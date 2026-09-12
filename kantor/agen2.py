#!/usr/bin/env python3
"""
Penanda kehadiran Agent 2 di kantor.

    python3 agen2.py siaga                 duduk, layar tidur
    python3 agen2.py mulai "<tugas>"       duduk, layar menyala
    python3 agen2.py pesan "<tugas baru>"  ganti balon saja
    python3 agen2.py selesai               tinggalkan kursi

Pembungkus tiga baris. Logikanya ada di kehadiran.py.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kehadiran import utama

if __name__ == "__main__":
    sys.exit(utama(["agen2"] + sys.argv[1:]))
