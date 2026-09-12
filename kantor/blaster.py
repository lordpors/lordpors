#!/usr/bin/env python3
"""
Penanda kehadiran Blaster di kantor.

    python3 blaster.py siaga                 duduk, layar tidur
    python3 blaster.py mulai "<tugas>"       duduk, layar menyala
    python3 blaster.py pesan "<tugas baru>"  ganti balon saja
    python3 blaster.py selesai               tinggalkan kursi

Pembungkus tiga baris. Logikanya ada di kehadiran.py.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kehadiran import utama

if __name__ == "__main__":
    sys.exit(utama(["blaster"] + sys.argv[1:]))
