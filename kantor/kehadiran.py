#!/usr/bin/env python3
"""
Kehadiran agen di kantor — dengan penyegar latar.

MASALAH YANG DIPECAHKAN

Sebelumnya `agenN.py mulai` cuma menulis SATU cap waktu. Kantor
menganggap kehadiran basi setelah 5 menit, jadi:

  - pekerjaan lebih dari 5 menit  -> agennya menghilang di tengah kerja
  - lupa memanggil `selesai`      -> agennya duduk sampai 5 menit percuma

Keduanya benar-benar terjadi, dan yang kedua berulang kali: Claude
memanggil `mulai` lalu lupa `selesai`. Kehadiran yang bergantung pada
ingatan bukan kehadiran yang bisa dipercaya.

CARA KERJANYA SEKARANG

`mulai` menulis agenN.json lalu menyalakan proses latar yang menyegarkan
cap waktunya tiap 60 detik. `selesai` mematikannya dan menandai kursi
kosong.

TIGA PENGAMAN, supaya penyegar ini tidak jadi masalah baru

1. BATAS UMUR. Rem terakhir, 12 jam. Yang sebenarnya menghentikan
   adalah pengaman kedua — batas ini cuma menjaga kalau pemeriksaan PID
   entah bagaimana meleset.

2. IKUT SESI PEMANGGILNYA. Kalau `mulai` dipanggil dari sesi Claude,
   PID sesi itu dicatat. Begitu sesinya mati, penyegarnya ikut berhenti
   pada putaran berikutnya.

3. SATU PENYEGAR PER AGEN. `mulai` selalu mematikan penyegar lama
   sebelum menyalakan yang baru, jadi tidak menumpuk.

Dipakai lewat agen1.py / agen2.py / agen3.py — jangan dipanggil
langsung. Satu berkas ini supaya perbaikan tidak perlu disalin tiga
kali; itu sudah terbukti mahal di berkas-berkas lain kantor ini.
"""
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

DIR = Path(__file__).resolve().parent

JEDA_SEGAR = 60            # detik antar penyegaran; ambang basi kantor 300
BATAS_UMUR = 12 * 3600     # rem terakhir; yang sebenarnya menghentikan: PID sesi

# DUA KEADAAN DUDUK, dan bedanya penting.
#
# Porscy minta agennya selalu duduk di kantor, bukan muncul-hilang. Tapi
# kalau "duduk" berlaku terus, ia berhenti berarti "sedang bekerja" —
# kantor jadi tidak memberi tahu apa-apa lagi.
#
# Jadi duduk dipecah dua:
#   kerja  -> layar menyala, balon menyebut tugasnya
#   siaga  -> duduk, layar mati, balon berbunyi "menunggu perintah"
#
# Yang membawa kabar sekarang BALONNYA, bukan ada-tidaknya sosok.
PESAN_SIAGA = "menunggu perintah"


"""Sejak 12 Sep 2026 berkas ini tidak lagi khusus agen bernomor.

Penghuninya disebut dengan KUNCI: "agen1", "agen2", "agen3", "blaster",
"meta". Kunci itu langsung jadi nama berkas keadaannya, jadi menambah
penghuni baru tidak perlu menyentuh berkas ini sama sekali — cukup buat
pembungkusnya seperti blaster.py."""


def berkas(kunci: str) -> Path:
    return DIR / f"{kunci}.json"


def berkas_pid(kunci: str) -> Path:
    return DIR / f".{kunci}-penyegar.pid"


def tulis(kunci: str, aktif: bool, pesan: str = "", siaga: bool = False) -> None:
    berkas(kunci).write_text(
        json.dumps({"aktif": aktif, "siaga": siaga, "pesan": pesan,
                    "waktu": time.time()}, ensure_ascii=False),
        encoding="utf-8")


def hidup(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except (ProcessLookupError, ValueError):
        return False
    except PermissionError:
        return True          # ada, cuma milik pengguna lain


def matikan_penyegar(kunci: str) -> bool:
    """Hentikan penyegar yang mungkin masih jalan. Aman dipanggil berulang."""
    p = berkas_pid(kunci)
    if not p.is_file():
        return False
    try:
        pid = int(p.read_text().strip())
    except Exception:
        p.unlink(missing_ok=True)
        return False
    if hidup(pid):
        try:
            os.kill(pid, signal.SIGTERM)
        except Exception:
            pass
    p.unlink(missing_ok=True)
    return True


def jalankan_penyegar(kunci: str, pesan: str, siaga: bool = False) -> None:
    """Proses latar: segarkan cap waktu sampai salah satu pengaman kena."""
    mulai = time.time()
    pemilik = os.environ.get("KEHADIRAN_PEMILIK")
    pemilik_pid = int(pemilik) if pemilik and pemilik.isdigit() else None

    while True:
        time.sleep(JEDA_SEGAR)

        if time.time() - mulai > BATAS_UMUR:
            break
        if pemilik_pid is not None and not hidup(pemilik_pid):
            break
        # `selesai` menghapus berkas PID — itu tanda berhenti yang paling
        # cepat sampai, tanpa perlu menunggu sinyal.
        if not berkas_pid(kunci).is_file():
            return

        d = {}
        try:
            d = json.loads(berkas(kunci).read_text(encoding="utf-8"))
        except Exception:
            pass
        # Kalau ada yang menandai selesai di sela-sela, jangan hidupkan lagi.
        if not d.get("aktif"):
            break

        # Pesannya dibaca ulang tiap putaran: kalau ada yang mengubahnya
        # lewat `pesan`, penyegar ikut membawa yang baru — bukan menimpa
        # kembali dengan teks lama.
        tulis(kunci, True, d.get("pesan", pesan), bool(d.get("siaga")))

    berkas_pid(kunci).unlink(missing_ok=True)


def mulai(kunci: str, pesan: str, siaga: bool = False) -> str:
    matikan_penyegar(kunci)
    tulis(kunci, True, pesan, siaga)

    lingkungan = dict(os.environ)
    # PID sesi Claude yang memanggil, supaya penyegar ikut mati bersamanya.
    pemilik = os.environ.get("CLAUDE_PID") or str(os.getppid())
    lingkungan["KEHADIRAN_PEMILIK"] = pemilik

    anak = subprocess.Popen(
        [sys.executable, str(Path(__file__).resolve()), "--penyegar", str(kunci), pesan],
        env=lingkungan, start_new_session=True,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
    berkas_pid(kunci).write_text(str(anak.pid), encoding="utf-8")
    keadaan = "SIAGA" if siaga else "BEKERJA"
    return f"{keadaan} — {pesan}  [penyegar {anak.pid}, tiap {JEDA_SEGAR}s]"


def selesai(kunci: str) -> str:
    ada = matikan_penyegar(kunci)
    tulis(kunci, False)
    return "meninggalkan meja" + ("  [penyegar dihentikan]" if ada else "")


def pesan_baru(kunci: str, teks: str) -> str:
    """Ganti teks balon TANPA menyentuh penyegar yang sedang jalan.

    Ini yang membuat balonnya bisa mengikuti pekerjaan yang berganti-ganti
    sepanjang sesi: cukup satu tulisan ke berkas, penyegar membacanya pada
    putaran berikutnya."""
    try:
        d = json.loads(berkas(kunci).read_text(encoding="utf-8"))
    except Exception:
        d = {}
    if not d.get("aktif"):
        return mulai(kunci, teks)
    tulis(kunci, True, teks, False)
    return f"BEKERJA — {teks}"


def utama(argv) -> int:
    if len(argv) >= 3 and argv[0] == "--penyegar":
        jalankan_penyegar(argv[1], argv[2], "--siaga" in argv)
        return 0

    if len(argv) < 2:
        print(__doc__)
        return 1

    kunci = argv[0]
    perintah = argv[1].lower()

    if perintah in ("mulai", "start", "on"):
        kabar = mulai(kunci, " ".join(argv[2:]) or "bekerja")
    elif perintah in ("siaga", "idle"):
        kabar = mulai(kunci, PESAN_SIAGA, siaga=True)
    elif perintah in ("pesan", "kabar"):
        kabar = pesan_baru(kunci, " ".join(argv[2:]) or "bekerja")
    elif perintah in ("selesai", "stop", "off"):
        kabar = selesai(kunci)
    else:
        print(__doc__)
        return 1

    print(f"  {kunci}: {kabar}")
    return 0


if __name__ == "__main__":
    sys.exit(utama(sys.argv[1:]))
