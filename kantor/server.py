#!/usr/bin/env python3
"""
Server kantor — pengganti `python3 -m http.server`.

KENAPA PERLU
------------
Halaman statis tidak bisa menyimpan apa pun. Server kecil ini menambah
dua kemampuan, dan hanya itu:

    POST /api/pesan   -> menyimpan pesan ke  kantor/kotak-masuk.jsonl
    POST /api/gambar  -> menyimpan gambar ke kantor/unggahan/

Dengan begitu, apa pun yang Porscy ketik atau unggah dari HP tersimpan
sebagai berkas nyata di komputernya. Claude tinggal membaca berkas itu
saat diminta -- itulah jembatannya.

YANG TIDAK DILAKUKAN, DAN JANGAN DIKLAIM BISA
---------------------------------------------
Ini BUKAN obrolan langsung dengan Claude. Tidak ada yang mengirim pesan
ke Claude secara otomatis; Claude tidak bisa memantau berkas sendiri.
Alurnya: ketik di kantor -> tersimpan -> bilang ke Claude "cek kotak
masuk" -> Claude membacanya. Antarmukanya menyebut ini terang-terangan.

    python3 server.py            # port 8787
    python3 server.py 9000       # port lain
"""
from __future__ import annotations

import base64, json, re, subprocess, sys, time
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

AKAR     = Path(__file__).resolve().parent.parent      # ~/My_Business/AI-agent
KANTOR   = Path(__file__).resolve().parent
KOTAK    = KANTOR / "kotak-masuk.jsonl"
UNGGAHAN = KANTOR / "unggahan"
BATAS_GAMBAR = 8 * 1024 * 1024                          # 8 MB
JENIS_OK = {"image/png": ".png", "image/jpeg": ".jpg",
            "image/webp": ".webp", "image/gif": ".gif"}


# ---------------------------------------------------------------------
# DAFTAR TUGAS — apa yang boleh dijalankan dari tombol + di kantor.
#
# INI DAFTAR PUTIH, DAN HARUS TETAP BEGITU. Halaman kantor tidak pernah
# mengirim perintah; ia cuma menyebut KUNCI dari daftar ini. Argumennya
# pun tetap, kecuali satu teks bebas yang dikirim sebagai satu elemen
# argv -- tidak lewat shell, jadi tidak ada yang bisa disisipkan.
#
# Jangan pernah menambahkan tugas yang menerima perintah dari luar.
# Kalau butuh tugas baru, tulis barisnya di sini.
#
#   argv     : dijalankan relatif terhadap `kerja`
#   teks     : True kalau tugas ini menerima keterangan bebas dari Porscy
#   latar    : True kalau dijalankan di belakang (tidak ditunggu selesai)
# ---------------------------------------------------------------------
JEDA_AUDITOR = KANTOR / "auditor-jeda.json"
QR_AUDITOR   = KANTOR / "qr-auditor.json"


def _auditor_keluar():
    """Log out auditor.

    Dua langkah, dan keduanya perlu. Menulis auditor.json saja tidak
    cukup: detak berikutnya dari HP akan langsung menghidupkannya lagi
    dalam 30 detik. Berkas jeda inilah yang membuat log out bertahan --
    penerima-auditor.py memeriksanya tiap detak masuk.
    """
    JEDA_AUDITOR.write_text('{"jeda": true}', encoding="utf-8")
    (KANTOR / "auditor.json").write_text(
        json.dumps({"online": False, "pesan": "", "waktu": time.time()}),
        encoding="utf-8")
    return "auditor keluar — kursinya kosong"


def _auditor_masuk():
    """Lepas jeda. Kehadirannya kembali saat detak berikutnya tiba."""
    if JEDA_AUDITOR.exists():
        JEDA_AUDITOR.unlink()
    if QR_AUDITOR.exists():
        QR_AUDITOR.unlink()          # QR lama tidak boleh dipindai ulang
    return "menunggu bot mengirim detak / QR"


TUGAS = {
    "auditor-logout": {
        "judul": "Log out auditor",
        "fungsi": _auditor_keluar, "teks": False, "latar": False,
    },
    "auditor-login": {
        "judul": "Login auditor",
        "fungsi": _auditor_masuk, "teks": False, "latar": False,
    },
    "agen1-mulai": {
        "judul": "Tandai mulai bekerja",
        "argv": [sys.executable, "agen1.py", "mulai"],
        "kerja": lambda: KANTOR, "teks": True, "latar": False,
    },
    "agen1-selesai": {
        "judul": "Tandai selesai",
        "argv": [sys.executable, "agen1.py", "selesai"],
        "kerja": lambda: KANTOR, "teks": False, "latar": False,
    },
    "agen2-mulai": {
        "judul": "Tandai mulai bekerja",
        "argv": [sys.executable, "agen2.py", "mulai"],
        "kerja": lambda: KANTOR, "teks": True, "latar": False,
    },
    "agen2-selesai": {
        "judul": "Tandai selesai",
        "argv": [sys.executable, "agen2.py", "selesai"],
        "kerja": lambda: KANTOR, "teks": False, "latar": False,
    },
    "agen3-mulai": {
        "judul": "Tandai mulai bekerja",
        "argv": [sys.executable, "agen3.py", "mulai"],
        "kerja": lambda: KANTOR, "teks": True, "latar": False,
    },
    "agen3-selesai": {
        "judul": "Tandai selesai",
        "argv": [sys.executable, "agen3.py", "selesai"],
        "kerja": lambda: KANTOR, "teks": False, "latar": False,
    },
    "agen1-siaga": {
        "judul": "Duduk siaga", "argv": [sys.executable, "agen1.py", "siaga"],
        "kerja": lambda: KANTOR, "teks": False, "latar": False,
    },
    "agen2-siaga": {
        "judul": "Duduk siaga", "argv": [sys.executable, "agen2.py", "siaga"],
        "kerja": lambda: KANTOR, "teks": False, "latar": False,
    },
    "agen3-siaga": {
        "judul": "Duduk siaga", "argv": [sys.executable, "agen3.py", "siaga"],
        "kerja": lambda: KANTOR, "teks": False, "latar": False,
    },
    "audit-contoh": {
        "judul": "Jalankan audit daftar contoh",
        "argv": [sys.executable, "jalankan.py", "--berkas", "daftar-contoh.txt"],
        "kerja": lambda: AKAR / "audit", "teks": False, "latar": True,
    },
}


class Penangan(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(AKAR), **k)

    def log_message(self, fmt, *args):
        if "/api/" in (args[0] if args else ""):
            sys.stderr.write("  %s\n" % (fmt % args))

    def _balas(self, kode, data):
        isi = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(kode)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(isi)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(isi)

    def do_GET(self):
        jalur = self.path.split("?")[0]
        if jalur == "/api/versi":
            return self._versi()
        if jalur == "/api/qr":
            # QR dikirim bot ke penerima-auditor.py; di sini cuma dibaca.
            if not QR_AUDITOR.is_file():
                return self._balas(200, {"ada": False})
            try:
                d = json.loads(QR_AUDITOR.read_text(encoding="utf-8"))
            except Exception:
                return self._balas(200, {"ada": False})
            # QR WhatsApp berumur pendek; lewat 2 menit jangan ditampilkan.
            if time.time() - d.get("waktu", 0) > 120:
                return self._balas(200, {"ada": False, "basi": True})
            return self._balas(200, {"ada": True, **d})
        return super().do_GET()

    def _versi(self):
        """Cap waktu berkas terbaru di kantor/.

        Dipakai halaman untuk memuat ulang dirinya sendiri begitu ada yang
        diedit. Sengaja sesederhana ini -- tanpa websocket, tanpa pustaka,
        tanpa proses pengawas. Satu bilangan, dibandingkan tiap 1,5 detik.
        """
        # HANYA BERKAS KODE. *.json sengaja TIDAK dipantau.
        #
        # auditor.json ditulis ulang tiap 45 detik oleh detak bot, dan
        # agenN.json tiap kali seseorang menandai mulai/selesai. Selama
        # keduanya ikut dipantau, halaman memuat ulang sendiri tiap 45
        # detik tanpa ada satu baris kode pun yang berubah -- persis yang
        # dikeluhkan Porscy.
        #
        # Berkas keadaan itu memang sudah diintip halaman secara
        # terpisah (ambilSemuaAgen tiap 8 detik); ia tidak butuh halaman
        # dimuat ulang untuk melihat perubahannya.
        terbaru = 0.0
        for pola in ("*.js", "*.html", "*.css"):
            for f in KANTOR.glob(pola):
                try:
                    terbaru = max(terbaru, f.stat().st_mtime)
                except OSError:
                    pass
        self._balas(200, {"v": round(terbaru, 3)})

    def _tugas(self):
        d = self._baca_json(4096) or {}
        nama = str(d.get("tugas") or "")
        t = TUGAS.get(nama)
        if not t:
            return self._balas(400, {"galat": "tugas tidak dikenal"})

        # Tugas dalam-proses (mis. menulis berkas jeda) tidak punya argv.
        if t.get("fungsi"):
            try:
                return self._balas(200, {"ok": True, "judul": t["judul"],
                                         "keluaran": t["fungsi"]()})
            except Exception as e:
                return self._balas(500, {"galat": f"{type(e).__name__}: {e}"[:200]})

        argv = list(t["argv"])
        if t["teks"]:
            teks = str(d.get("teks") or "").strip()[:80]
            argv.append(teks or "bekerja")

        kerja = t["kerja"]()
        try:
            if t["latar"]:
                subprocess.Popen(argv, cwd=str(kerja),
                                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return self._balas(200, {"ok": True, "judul": t["judul"],
                                         "keluaran": "dijalankan di belakang layar"})
            h = subprocess.run(argv, cwd=str(kerja), capture_output=True,
                               text=True, timeout=30)
            keluar = (h.stdout or h.stderr or "").strip()[:400]
            return self._balas(200 if h.returncode == 0 else 500,
                               {"ok": h.returncode == 0, "judul": t["judul"],
                                "keluaran": keluar or "selesai"})
        except Exception as e:
            return self._balas(500, {"galat": f"{type(e).__name__}: {e}"[:200]})

    def do_POST(self):
        if self.path == "/api/tugas":
            return self._tugas()
        if self.path == "/api/pesan":
            return self._pesan()
        if self.path == "/api/gambar":
            return self._gambar()
        self._balas(404, {"galat": "jalur tidak dikenal"})

    def _baca_json(self, batas):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > batas:
            return None
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return None

    def _pesan(self):
        d = self._baca_json(64 * 1024)
        if not d or not str(d.get("teks", "")).strip():
            return self._balas(400, {"galat": "pesan kosong", "lokal": True})
        baris = {
            "waktu": datetime.now().astimezone().isoformat(timespec="seconds"),
            "untuk": str(d.get("untuk") or "") or None,
            "teks": str(d["teks"])[:4000],
            "lampiran": d.get("lampiran") or None,
        }
        with KOTAK.open("a", encoding="utf-8") as f:
            f.write(json.dumps(baris, ensure_ascii=False) + "\n")
        jumlah = sum(1 for _ in KOTAK.open(encoding="utf-8"))
        return self._balas(200, {"ok": True, "tersimpan": str(KOTAK.name), "jumlah": jumlah})

    def _gambar(self):
        d = self._baca_json(BATAS_GAMBAR + 256 * 1024)
        if not d:
            return self._balas(400, {"galat": "tidak terbaca atau terlalu besar"})
        data_uri = str(d.get("data", ""))
        m = re.match(r"^data:([\w/+.-]+);base64,(.+)$", data_uri, re.S)
        if not m:
            return self._balas(400, {"galat": "format bukan data URI"})
        jenis, b64 = m.group(1), m.group(2)
        if jenis not in JENIS_OK:
            return self._balas(400, {"galat": "jenis tidak didukung: " + jenis})
        try:
            mentah = base64.b64decode(b64, validate=True)
        except Exception:
            return self._balas(400, {"galat": "base64 rusak"})
        if len(mentah) > BATAS_GAMBAR:
            return self._balas(413, {"galat": "lebih dari 8 MB"})

        UNGGAHAN.mkdir(exist_ok=True)
        aman = re.sub(r"[^\w.-]", "_", str(d.get("nama", "gambar")))[:60]
        nama = datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + aman
        if not nama.lower().endswith(JENIS_OK[jenis]):
            nama += JENIS_OK[jenis]
        (UNGGAHAN / nama).write_bytes(mentah)
        return self._balas(200, {"ok": True, "nama": nama,
                                 "jalur": str((UNGGAHAN / nama).relative_to(AKAR)),
                                 "ukuran": len(mentah)})

    def end_headers(self):
        if self.path.endswith((".json", ".jsonl")):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    # TETAP 127.0.0.1. Peladen ini menyajikan seluruh folder AI-agent --
    # termasuk .kunci-kantor, .kunci-kirim, dan .env milik porsblast.
    # Mengikatnya ke 0.0.0.0 berarti membagikan semua itu ke seisi
    # jaringan kantor. Kalau butuh dijangkau dari HP, pakai penerima
    # khusus (penerima-auditor.py), bukan peladen ini.
    srv = ThreadingHTTPServer(("127.0.0.1", port), Penangan)
    print(f"  Kantor jalan di  http://127.0.0.1:{port}/kantor/")
    print(f"  Kotak masuk      {KOTAK}")
    print(f"  Unggahan         {UNGGAHAN}/")
    print("  Ctrl+C untuk berhenti.\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  berhenti.")
