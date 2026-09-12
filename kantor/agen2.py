#!/usr/bin/env python3
"""
Penanda kehadiran Agent 2 di kantor.

Kembarannya agen1.py, dengan satu beda yang penting: kehadiran daring
dikirim ke /api/agen?agen=2 supaya tidak saling menimpa dengan Agent 1.

    python3 agen2.py mulai "memperbaiki gelembung teks"
    python3 agen2.py selesai

Status dianggap basi setelah 5 menit -- jadi kalau sesi berhenti di
tengah jalan, mejanya kosong sendiri tanpa perlu dibereskan.
"""
import json, sys, time
from pathlib import Path

NOMOR  = 2
DIR    = Path(__file__).resolve().parent
BERKAS = DIR / f"agen{NOMOR}.json"

def tulis(aktif: bool, pesan: str = ""):
    isi = {"aktif": aktif, "pesan": pesan, "waktu": time.time()}
    BERKAS.write_text(json.dumps(isi, ensure_ascii=False), encoding="utf-8")
    print(f"  Agent {NOMOR}: {'BEKERJA — ' + pesan if aktif else 'meninggalkan meja'}")

if __name__ == "__main__":
    cmd = (sys.argv[1] if len(sys.argv) > 1 else "").lower()
    if cmd in ("mulai", "start", "on"):
        tulis(True, " ".join(sys.argv[2:]) or "bekerja")
    elif cmd in ("selesai", "stop", "off"):
        tulis(False)
    else:
        print(__doc__)
        sys.exit(1)
