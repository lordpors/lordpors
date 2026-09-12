#!/usr/bin/env python3
"""
Penanda kehadiran Agent 1 di kantor.

Dipanggil Claude saat mulai dan selesai mengerjakan sesuatu. Isinya
dibaca kantor/kantor.js tiap 2 detik: kalau aktif, karakternya muncul
duduk di meja kedua dan monitornya menyala.

    python3 agen1.py mulai "membangun modul audit"
    python3 agen1.py selesai

Status dianggap basi setelah 5 menit -- jadi kalau Claude berhenti di
tengah jalan, mejanya kosong sendiri tanpa perlu dibereskan.
"""
import json, sys, time
from pathlib import Path

DIR    = Path(__file__).resolve().parent
BERKAS = DIR / "agen1.json"

def tulis(aktif: bool, pesan: str = ""):
    isi = {"aktif": aktif, "pesan": pesan, "waktu": time.time()}
    BERKAS.write_text(json.dumps(isi, ensure_ascii=False), encoding="utf-8")
    print(f"  Agent 1: {'BEKERJA — ' + pesan if aktif else 'meninggalkan meja'}")

if __name__ == "__main__":
    cmd = (sys.argv[1] if len(sys.argv) > 1 else "").lower()
    if cmd in ("mulai", "start", "on"):
        tulis(True, " ".join(sys.argv[2:]) or "bekerja")
    elif cmd in ("selesai", "stop", "off"):
        tulis(False)
    else:
        print(__doc__)
        sys.exit(1)
