#!/usr/bin/env python3
"""
Penanda kehadiran Agent 3 di kantor.

    python3 agen3.py mulai "ringkasan singkat tugasnya"
    python3 agen3.py selesai

Isinya cuma pembungkus. Seluruh logikanya ada di kehadiran.py — termasuk
penyegar latar yang menjaga kehadiran tetap hidup selama pekerjaan
berlangsung, dan tiga pengamannya. Satu berkas untuk tiga agen supaya
perbaikan tidak perlu disalin tiga kali.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kehadiran import utama

if __name__ == "__main__":
    sys.exit(utama(["3"] + sys.argv[1:]))
