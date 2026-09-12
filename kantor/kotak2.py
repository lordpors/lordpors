#!/usr/bin/env python3
"""
Kotak masuk Agent 2 — laci sendiri, terpisah dari agen lain.

Dipakai saat Porscy bilang "cek kotak masuk". Pesan yang dia kirim dari
kantor-lordpors.vercel.app dengan awalan  /agen2  mendarat di sini dan
TIDAK terlihat oleh agen lain.

    python3 kotak2.py                  lihat pesan untuk Agent 2
    python3 kotak2.py --gambar         ikut simpan lampiran ke ./lampiran2/
    python3 kotak2.py --kosongkan      hapus pesan Agent 2 sesudah dibaca
    python3 kotak2.py --kosongkan --termasuk-lama
                                         ikut hapus surat tak beralamat

SURAT TAK BERALAMAT. Pesan yang dikirim sebelum ada pengalamatan tidak
punya tujuan, jadi tampil di kedua laci dan ditandai [tanpa alamat].
Sengaja tidak ikut terhapus oleh --kosongkan biasa: agen sebelah mungkin
belum sempat membacanya.

Lampiran disimpan sebagai base64 di dalam pesannya, jadi --gambar cuma
menuliskannya kembali jadi berkas; tidak ada permintaan tambahan.
"""
import base64, json, sys, urllib.request
from pathlib import Path

NOMOR = 2
DIR   = Path(__file__).resolve().parent
KUNCI = DIR / ".kunci-kantor"
AWAN  = "https://kantor-lordpors.vercel.app/api/pesan"

def panggil(cara="GET", tambahan=""):
    if not KUNCI.is_file():
        sys.exit("  .kunci-kantor tidak ada — tidak bisa membaca kotak masuk.")
    alamat = f"{AWAN}?agen={NOMOR}{tambahan}"
    req = urllib.request.Request(
        alamat, headers={"X-Kunci": KUNCI.read_text().strip()}, method=cara)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

def main():
    simpan   = "--gambar" in sys.argv
    kosongkn = "--kosongkan" in sys.argv
    ikutLama = "--termasuk-lama" in sys.argv

    d = panggil("GET")
    pesan = d.get("pesan", [])
    if not pesan:
        print(f"  kotak masuk Agent {NOMOR} kosong.")
        return

    print(f"  {len(pesan)} pesan untuk Agent {NOMOR}:\n")
    for i, p in enumerate(pesan, 1):
        tanda = "" if p.get("untuk") else "  [tanpa alamat]"
        print(f"  [{i}] {p.get('waktu','')[:19].replace('T',' ')} UTC{tanda}")
        print(f"      {p.get('teks','')}")
        l = p.get("lampiran")
        if isinstance(l, dict):
            print(f"      lampiran: {l.get('nama')} ({l.get('jenis')})")
            if simpan:
                keluar = DIR / f"lampiran{NOMOR}"
                keluar.mkdir(exist_ok=True)
                jalur = keluar / f"{i:02d}-{l.get('nama','gambar')}"
                jalur.write_bytes(base64.b64decode(l.get("data", "")))
                print(f"      disimpan: {jalur}")
        print()

    if kosongkn:
        h = panggil("DELETE", "&lama=1" if ikutLama else "")
        print(f"  dikosongkan: {h.get('dihapus', 0)} pesan dihapus.")
        if not ikutLama and any(not p.get("untuk") for p in pesan):
            print("  surat tak beralamat dibiarkan — pakai --termasuk-lama "
                  "kalau memang mau ikut dihapus.")

if __name__ == "__main__":
    main()
