#!/usr/bin/env python3
"""
Penanda kehadiran Meta di kantor.

    python3 meta.py siaga                 duduk, layar tidur
    python3 meta.py mulai "<tugas>"       duduk, layar menyala
    python3 meta.py pesan "<tugas baru>"  ganti balon saja
    python3 meta.py selesai               tinggalkan kursi

Pembungkus tiga baris. Logikanya ada di kehadiran.py.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kehadiran import utama

if __name__ == "__main__":
    sys.exit(utama(["meta"] + sys.argv[1:]))
