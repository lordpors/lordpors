#!/usr/bin/env python3
"""
Alat audit calon klien — LordPors.

    python3 jalankan.py situs.com lain.com
    python3 jalankan.py --berkas daftar.txt
    python3 jalankan.py --berkas daftar.txt --keluar hasil.csv
    python3 jalankan.py situs.com --lengkap

Berkas daftar: satu situs per baris. Boleh diberi nama setelah koma:

    sate-pakdhe.com, Pak Dhe
    laundrykinclong.id, Bu Sri
"""
from __future__ import annotations
import argparse, asyncio, csv, json, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from auditor import periksa, JEDA_ANTAR_SITUS
from pesan import susun, ringkasan, layak_dihubungi
import httpx
from auditor import UA, BATAS_DETIK


BERKAS_STATUS = Path(__file__).parent / "status.json"


def tulis_status(**isi):
    """
    Tulis keadaan sekarang ke status.json.

    Dibaca oleh kantor/ (visualisasi). Sengaja berkas biasa, bukan soket:
    kalau visualisasinya tidak dibuka, tidak ada biaya sama sekali, dan
    alat audit tetap jalan seperti biasa.
    """
    isi["waktu"] = time.time()
    try:
        BERKAS_STATUS.write_text(json.dumps(isi, ensure_ascii=False), encoding="utf-8")
    except Exception:
        pass          # visualisasi tidak boleh menghentikan pekerjaan


def baca_daftar(p: Path) -> list[tuple[str, str]]:
    keluar = []
    for baris in p.read_text(encoding="utf-8").splitlines():
        baris = baris.strip()
        if not baris or baris.startswith("#"):
            continue
        if "," in baris:
            u, n = baris.split(",", 1)
            keluar.append((u.strip(), n.strip()))
        else:
            keluar.append((baris, ""))
    return keluar


async def main():
    ap = argparse.ArgumentParser(description="Audit website calon klien")
    ap.add_argument("situs", nargs="*", help="alamat situs")
    ap.add_argument("--berkas", type=Path, help="berkas daftar situs")
    ap.add_argument("--keluar", type=Path, help="simpan hasil ke CSV")
    ap.add_argument("--json", type=Path, help="simpan hasil mentah ke JSON")
    ap.add_argument("--lengkap", action="store_true", help="tampilkan laporan lengkap")
    ap.add_argument("--jeda", type=float, default=JEDA_ANTAR_SITUS,
                    help=f"jeda antar situs, detik (bawaan {JEDA_ANTAR_SITUS})")
    a = ap.parse_args()

    target = [(s, "") for s in a.situs]
    if a.berkas:
        if not a.berkas.exists():
            print(f"Berkas tidak ditemukan: {a.berkas}", file=sys.stderr)
            return 1
        target += baca_daftar(a.berkas)
    if not target:
        ap.print_help()
        return 1

    print(f"Memeriksa {len(target)} situs, jeda {a.jeda} detik antar situs.\n")
    tulis_status(keadaan="mulai", total=len(target), selesai=0,
                 situs=None, pesan="Menyiapkan daftar")

    hasil = []
    async with httpx.AsyncClient(
        timeout=BATAS_DETIK, follow_redirects=True,
        headers={"User-Agent": UA, "Accept-Language": "id-ID,id;q=0.9"},
    ) as klien:
        for i, (url, nama) in enumerate(target, 1):
            tulis_status(keadaan="memeriksa", total=len(target), selesai=i-1,
                         situs=url, pesan=f"Memeriksa {url}")
            h = await periksa(url, klien)
            hasil.append((h, nama))
            tulis_status(keadaan="hasil", total=len(target), selesai=i,
                         situs=h.url, skor=h.skor(),
                         temuan=len(h.temuan),
                         layak=layak_dihubungi(h),
                         pesan=("Layak dihubungi" if layak_dihubungi(h) else "Situs sehat, dilewati"))

            tanda = "·" if layak_dihubungi(h) else " "
            print(f"{tanda} [{i}/{len(target)}] {h.url}")
            print(f"      skor {h.skor():3d}/100   "
                  f"{h.waktu_muat if h.waktu_muat is not None else '-'}s   "
                  f"{len(h.temuan)} temuan")

            if a.lengkap:
                print()
                for baris in ringkasan(h).splitlines():
                    print(f"      {baris}")

            p = susun(h, nama=nama)
            if p:
                print("      ── pesan pembuka ──")
                for baris in p.splitlines():
                    print(f"      {baris}" if baris else "")
            print()

            if i < len(target):
                tulis_status(keadaan="jeda", total=len(target), selesai=i,
                             situs=None, pesan="Jeda antar situs")
                await asyncio.sleep(a.jeda)

    layak = [h for h, _ in hasil if layak_dihubungi(h)]
    tulis_status(keadaan="selesai", total=len(hasil), selesai=len(hasil),
                 situs=None, layak_total=len(layak),
                 pesan=f"Selesai — {len(layak)} dari {len(hasil)} layak dihubungi")
    print("─" * 58)
    print(f"  diperiksa       : {len(hasil)}")
    print(f"  layak dihubungi : {len(layak)}")
    print(f"  dilewati        : {len(hasil) - len(layak)}  (situsnya sudah sehat / gagal diperiksa)")

    if a.keluar:
        with a.keluar.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["url", "nama", "skor", "waktu_muat", "ukuran",
                        "https", "ramah_ponsel", "ada_wa", "jml_temuan",
                        "layak_dihubungi", "pesan_pembuka"])
            for h, nama in hasil:
                w.writerow([h.url, nama, h.skor(), h.waktu_muat, h.ukuran_halaman,
                            h.https, h.ramah_ponsel, h.ada_tautan_wa, len(h.temuan),
                            layak_dihubungi(h), (susun(h, nama=nama) or "").replace("\n", " ")])
        print(f"  CSV disimpan    : {a.keluar}")

    if a.json:
        a.json.write_text(json.dumps([h.dict() for h, _ in hasil],
                                     ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  JSON disimpan   : {a.json}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
