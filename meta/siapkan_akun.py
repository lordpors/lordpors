#!/usr/bin/env python3
"""Pipeline aman menyiapkan akun Meta untuk WhatsApp Business.

Pendaftaran, CAPTCHA, OTP, dan 2FA tetap dikerjakan pemilik akun di halaman
resmi Meta. Skrip ini hanya membuka tahap berikutnya dan menyimpan progres.

    python3 meta/siapkan_akun.py
    python3 meta/siapkan_akun.py --status
    python3 meta/siapkan_akun.py --uji
"""
import argparse
import json
import tempfile
import webbrowser
from pathlib import Path


STATUS = Path(__file__).with_name("status.json")
TAHAP = (
    (
        "akun",
        "Buat akun Facebook asli milik pemilik bisnis",
        "https://www.facebook.com/r.php",
        "Isi sendiri data asli, lalu selesaikan CAPTCHA dan pendaftaran.",
    ),
    (
        "konfirmasi",
        "Konfirmasi email atau nomor telepon",
        "https://www.facebook.com/settings?tab=account",
        "Pastikan kontak sudah berstatus terkonfirmasi. Jangan berikan OTP ke skrip.",
    ),
    (
        "keamanan",
        "Aktifkan autentikasi dua faktor",
        "https://www.facebook.com/security/2fac/settings/",
        "Simpan recovery codes di password manager, bukan di folder proyek.",
    ),
    (
        "bisnis",
        "Buat atau pilih Meta Business Portfolio",
        "https://business.facebook.com/overview",
        "Gunakan nama dan data bisnis yang benar; catat Business ID di password manager.",
    ),
)


def baca(path=STATUS):
    try:
        nomor = int(json.loads(path.read_text(encoding="utf-8")).get("tahap", 0))
    except (FileNotFoundError, ValueError, TypeError, json.JSONDecodeError):
        nomor = 0
    return min(max(nomor, 0), len(TAHAP))


def simpan(nomor, path=STATUS):
    path.write_text(json.dumps({"tahap": nomor}), encoding="utf-8")


def tampilkan(nomor):
    print(f"\n  Progres: {nomor}/{len(TAHAP)} tahap")
    for i, (_, judul, _, _) in enumerate(TAHAP):
        print(f"  {'[x]' if i < nomor else '[ ]'} {i + 1}. {judul}")
    if nomor == len(TAHAP):
        print("\n  SIAP — akun aman dan Business Portfolio tersedia untuk onboarding WhatsApp.")


def uji():
    assert TAHAP and len({k for k, *_ in TAHAP}) == len(TAHAP)
    assert all(url.startswith("https://") for _, _, url, _ in TAHAP)
    with tempfile.TemporaryDirectory() as d:
        path = Path(d) / "status.json"
        assert baca(path) == 0
        simpan(2, path)
        assert baca(path) == 2
    print("  Uji lulus.")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--status", action="store_true", help="lihat progres tanpa membuka browser")
    ap.add_argument("--uji", action="store_true", help="jalankan pemeriksaan mandiri")
    a = ap.parse_args()
    if a.uji:
        return uji()

    nomor = baca()
    tampilkan(nomor)
    if a.status or nomor == len(TAHAP):
        return

    _, judul, url, petunjuk = TAHAP[nomor]
    print(f"\n  Sekarang: {judul}\n  {petunjuk}\n  {url}")
    webbrowser.open(url)
    if input("\n  Ketik SELESAI setelah tahap ini benar-benar selesai: ").strip().upper() == "SELESAI":
        simpan(nomor + 1)
        print("  Tersimpan. Jalankan skrip lagi untuk tahap berikutnya.")
    else:
        print("  Belum ditandai selesai; progres tetap aman.")


if __name__ == "__main__":
    main()
