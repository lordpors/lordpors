#!/usr/bin/env python3
"""
Penerima detak jantung bot anggaran SEO.

Bot itu jalan di Termux pada HP Porscy (~/wa-anggaran-bot). Kantor jalan
di PC. Supaya wanita auditor di panggung tahu botnya hidup, botnya harus
mengabari -- dan inilah yang menerima kabarnya.

    HP (Termux)  --POST /detak-->  penerima ini  -->  kantor/auditor.json
                                                            |
                                              kantor.js membacanya, lalu
                                              menempelkan label (online)
                                              di atas kepala auditor.

KENAPA PELADEN TERPISAH, BUKAN server.py

server.py menyajikan SELURUH folder AI-agent -- termasuk .kunci-kantor,
.kunci-kirim, dan .env milik porsblast. Mengikatnya ke 0.0.0.0 supaya HP
bisa menjangkaunya berarti membagikan semua itu ke seisi jaringan kantor.
Jadi server.py tetap 127.0.0.1, dan yang menghadap jaringan cuma berkas
ini: satu jalur, satu cara, wajib kunci, tidak menyajikan berkas apa pun.

    python3 penerima-auditor.py            port 8790
    python3 penerima-auditor.py 9100       port lain

Status dianggap basi setelah 2 menit. Jadi kalau botnya mati atau HP-nya
kehilangan sinyal, labelnya hilang sendiri tanpa perlu dibereskan.
"""
import json, sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DIR    = Path(__file__).resolve().parent
BERKAS = DIR / "auditor.json"
JEDA   = DIR / "auditor-jeda.json"       # ditulis kantor saat "Log out"
QR     = DIR / "qr-auditor.json"         # dikirim bot saat butuh dipindai
NAWALA = DIR / "nawala.json"              # status checker dari HP
KUNCI  = DIR / ".kunci-auditor"
BATAS  = 4096


def gambar_qr(teks: str) -> str:
    """Teks tantangan WhatsApp -> data URL PNG.

    Dipakai supaya bot tidak perlu memasang pustaka penggambar QR sendiri.
    box_size kecil dengan border 2 sudah cukup terpindai dari layar; yang
    penting kontrasnya hitam-putih murni, bukan ukurannya.
    """
    import base64, io
    import qrcode
    q = qrcode.QRCode(box_size=8, border=2)
    q.add_data(teks)
    q.make(fit=True)
    tampung = io.BytesIO()
    q.make_image(fill_color="black", back_color="white").save(tampung, format="PNG")
    return "data:image/png;base64," + base64.b64encode(tampung.getvalue()).decode()


def kunci_benar() -> str:
    if not KUNCI.is_file():
        sys.exit("  .kunci-auditor tidak ada -- penerima tidak bisa jalan.")
    return KUNCI.read_text(encoding="utf-8").strip()


class Penangan(BaseHTTPRequestHandler):
    server_version = "PenerimaAuditor/1.0"

    def log_message(self, fmt, *args):
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
        # Sengaja tidak menyajikan berkas apa pun. Dua jalur saja.
        jalur = self.path.split("?")[0]
        if jalur == "/halo":
            return self._balas(200, {"ok": True, "pesan": "penerima auditor hidup"})
        # Skrip detak di HP menanyakan ini tiap putaran: kalau Porscy
        # menekan "Log out" di kantor, detaknya berhenti dikirim. Tanpa
        # ini, log out akan langsung dibatalkan detak berikutnya.
        if jalur == "/jeda":
            return self._balas(200, {"jeda": JEDA.is_file()})
        self._balas(404, {"galat": "tidak ada apa-apa di sini"})

    def _baca(self, batas):
        n = int(self.headers.get("Content-Length") or 0)
        if not (0 < n <= batas):
            return {}
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return {}

    def do_POST(self):
        jalur = self.path.split("?")[0]
        if jalur not in ("/detak", "/qr", "/nawala"):
            return self._balas(404, {"galat": "jalur tidak dikenal"})

        if (self.headers.get("X-Kunci") or "").strip() != kunci_benar():
            return self._balas(401, {"galat": "kunci salah"})

        if jalur == "/nawala":
            d = self._baca(64 * 1024)
            if not isinstance(d, dict):
                return self._balas(400, {"galat": "JSON harus berupa objek"})
            sites = []
            for row in (d.get("sites") or [])[:50]:
                if not isinstance(row, dict):
                    continue
                domain = str(row.get("domain") or "")[:253]
                if not domain:
                    continue
                isp = row.get("isp") if isinstance(row.get("isp"), dict) else {}
                sites.append({
                    "domain": domain,
                    "blocked": bool(row.get("blocked")),
                    "http": str(row.get("http") or "")[:20],
                    "isp": {str(k)[:30]: str(v)[:20] for k, v in list(isp.items())[:10]},
                })
            isi = {
                "waktu": time.time(),
                "checked": str(d.get("checked") or "")[:40],
                "canary": d.get("canary") if isinstance(d.get("canary"), dict) else {},
                "sites": sites,
            }
            sementara = NAWALA.with_suffix(".json.tmp")
            sementara.write_text(json.dumps(isi, ensure_ascii=False), encoding="utf-8")
            sementara.replace(NAWALA)
            return self._balas(200, {"ok": True, "sites": len(sites)})

        # QR dikirim bot saat sesi WhatsApp-nya perlu dipindai ulang.
        # Isinya data URL gambar; kantor cuma menampilkannya apa adanya.
        if jalur == "/qr":
            d = self._baca(512 * 1024)
            gambar = str(d.get("gambar") or "")
            teks = str(d.get("teks") or "")

            # Bot mengirim TEKS MENTAH QR-nya; yang menggambar di sini.
            # Sengaja begitu supaya bot tidak perlu pustaka tambahan --
            # npm tidak terpasang di PC ini, sementara Python sudah punya
            # pustaka qrcode. Bentuk `gambar` (data URL) tetap diterima
            # kalau suatu saat ada pengirim yang sudah menggambarnya.
            if teks and not gambar:
                try:
                    gambar = gambar_qr(teks)
                except Exception as e:
                    return self._balas(500, {"galat": f"gagal menggambar QR: {e}"[:160]})

            if not gambar.startswith("data:image/"):
                return self._balas(400, {"galat": "butuh teks QR atau data URL gambar"})

            QR.write_text(json.dumps({"gambar": gambar[:400000],
                                      "waktu": time.time()}), encoding="utf-8")
            return self._balas(200, {"ok": True, "digambar": bool(teks)})

        d = self._baca(BATAS)

        # Kalau sedang dijeda, detaknya diterima tapi TIDAK menghidupkan
        # kehadirannya. Menolak dengan galat akan membuat skrip di HP
        # terlihat rusak padahal ia bekerja benar.
        if JEDA.is_file():
            BERKAS.write_text(json.dumps({"online": False, "pesan": "", "waktu": time.time()}),
                              encoding="utf-8")
            return self._balas(200, {"ok": True, "jeda": True, "online": False})

        isi = {
            "online": bool(d.get("online", True)),
            "pesan": str(d.get("pesan") or "")[:80],
            "waktu": time.time(),
        }
        BERKAS.write_text(json.dumps(isi, ensure_ascii=False), encoding="utf-8")
        self._balas(200, {"ok": True, **isi})


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
    # 127.0.0.1 secara bawaan, dan itu CUKUP karena HP tersambung lewat
    # USB ADB: `adb reverse tcp:8790 tcp:8790` membuat localhost:8790 di
    # HP tembus ke localhost:8790 di PC. Tidak ada satu pun port yang
    # menghadap jaringan kantor, tidak ada IP DHCP yang bisa berubah,
    # dan wifi yang mengisolasi antar-perangkat tidak jadi urusan.
    #
    # Pakai `--jaringan` HANYA kalau ADB memang tidak bisa dipakai.
    ikat = "0.0.0.0" if "--jaringan" in sys.argv else "127.0.0.1"
    kunci_benar()                      # gagal cepat kalau kuncinya belum ada
    srv = ThreadingHTTPServer((ikat, port), Penangan)
    print(f"  Penerima auditor di  {ikat}:{port}")
    print(f"  Menulis ke           {BERKAS}")
    if ikat == "127.0.0.1":
        print(f"  Dari HP kirim ke     http://127.0.0.1:{port}/detak")
        print(f"  (butuh: adb reverse tcp:{port} tcp:{port})")
    else:
        print(f"  MENGHADAP JARINGAN. Dari HP: http://<IP-PC>:{port}/detak")
    print("  Ctrl+C untuk berhenti.\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  berhenti.")
