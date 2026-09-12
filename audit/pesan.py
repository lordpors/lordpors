"""
Menyusun kalimat pembuka dari hasil audit.

Aturan yang dipegang di sini:

1. SEBUT SATU MASALAH, BUKAN SEMUA. Daftar panjang berisi delapan kekurangan
   terbaca seperti penghinaan, dan orang membalas dengan membela diri.
   Satu temuan paling berat sudah cukup untuk memulai percakapan.

2. SELALU SERTAKAN ANGKANYA. "Situs Bapak lambat" adalah pendapat.
   "Saya buka 6,8 detik" adalah fakta yang bisa dia periksa sendiri.

3. JANGAN MENAKUT-NAKUTI. Tidak ada "situs Bapak akan hilang dari Google".
   Itu tidak bisa dibuktikan, dan orang sudah kebal dengan pola itu.

4. KALAU SITUSNYA BAGUS, JANGAN DIKIRIMI. Fungsi `layak_dihubungi()` ada
   supaya blast tidak dikirim ke orang yang situsnya memang sudah beres.
   Mengirim "situs Bapak bermasalah" ke situs yang sehat adalah cara tercepat
   kehilangan kepercayaan.
"""

from __future__ import annotations
import random
from urllib.parse import urlparse

# Urutan kepentingan. Yang di atas dipakai lebih dulu kalau muncul bersamaan.
URUTAN = [
    "tidak_hidup", "http_galat", "ssl_rusak", "sangat_lambat",
    "lambat", "tidak_ramah_ponsel", "tanpa_https",
    "tanpa_wa", "tanpa_kontak",
    "berat", "tanpa_judul", "tanpa_deskripsi",
    "judul_kepanjangan", "gambar_tanpa_alt",
]

# {nama} diisi nama usaha, {situs} diisi domain, {angka} dari bukti.
BUKA = {
    "tidak_hidup": [
        "Halo{sapa}, saya coba buka {situs} tapi tidak bisa terbuka sama sekali.",
        "Halo{sapa}, {situs} sepertinya sedang tidak bisa diakses.",
    ],
    "http_galat": [
        "Halo{sapa}, {situs} menampilkan halaman error waktu saya buka.",
    ],
    "ssl_rusak": [
        "Halo{sapa}, waktu buka {situs} peramban saya menampilkan peringatan "
        "“Tidak Aman” sebelum halamannya muncul.",
    ],
    "sangat_lambat": [
        "Halo{sapa}, saya coba buka {situs} tapi lebih dari 15 detik belum terbuka juga.",
    ],
    "lambat": [
        "Halo{sapa}, saya baru buka {situs} dan perlu {angka} untuk terbuka.",
        "Halo{sapa}, {situs} saya buka dari HP, butuh {angka} sampai halamannya muncul.",
    ],
    "tidak_ramah_ponsel": [
        "Halo{sapa}, saya buka {situs} dari HP dan tampilannya masih versi komputer "
        "— harus dizoom dulu untuk dibaca.",
    ],
    "tanpa_https": [
        "Halo{sapa}, {situs} masih memakai http biasa, jadi Chrome menandainya "
        "“Tidak Aman” di bilah alamat.",
    ],
    "tanpa_wa": [
        "Halo{sapa}, saya lihat {situs} belum ada tombol WhatsApp-nya. "
        "Pengunjung yang tertarik harus menyalin nomor sendiri.",
    ],
    "tanpa_kontak": [
        "Halo{sapa}, saya cari nomor yang bisa dihubungi di {situs} tapi tidak ketemu "
        "di halaman depannya.",
    ],
    "berat": [
        "Halo{sapa}, halaman depan {situs} ukurannya {angka} — lumayan berat "
        "untuk kuota prabayar.",
    ],
    "tanpa_judul": [
        "Halo{sapa}, di hasil pencarian Google, {situs} muncul tanpa judul usaha.",
    ],
    "tanpa_deskripsi": [
        "Halo{sapa}, {situs} belum punya deskripsi untuk hasil Google, "
        "jadi cuplikannya dikarang sendiri oleh Google.",
    ],
}

PENUTUP = [
    "Kalau berkenan, saya kirimkan hasil pemeriksaan lengkapnya. Gratis, tanpa kewajiban apa pun.",
    "Boleh saya kirim hasil pemeriksaan lengkapnya? Gratis saja.",
    "Saya sudah catat beberapa hal lain juga. Mau saya kirimkan?",
]


def _domain(url: str) -> str:
    d = urlparse(url).netloc or url
    return d.replace("www.", "")


def _angka(kode: str, h) -> str:
    if kode == "lambat":
        return f"{h.waktu_muat:.1f} detik"
    if kode == "berat" and h.ukuran_halaman:
        return f"{h.ukuran_halaman/1_048_576:.1f} MB"
    return ""


def layak_dihubungi(h, skor_minimal: int = 85) -> bool:
    """
    False kalau situsnya sudah sehat. Jangan kirim pesan 'ada masalah'
    ke orang yang tidak punya masalah -- itu langsung ketahuan bohong.
    """
    if h.galat and not h.temuan:
        return False                      # gagal periksa, bukan berarti situsnya jelek
    if not h.temuan:
        return False
    if h.skor() >= skor_minimal:
        return False
    return any(t.berat == "tinggi" for t in h.temuan)


def susun(h, nama: str = "", acak: bool = True) -> str | None:
    """Susun pesan pembuka. None kalau situs ini sebaiknya tidak dihubungi."""
    if not layak_dihubungi(h):
        return None

    ada = {t.kode: t for t in h.temuan}
    kode = next((k for k in URUTAN if k in ada), None)
    if kode is None or kode not in BUKA:
        return None

    pilih = random.choice if acak else (lambda x: x[0])
    sapa = f" {nama}" if nama else ""
    baris = pilih(BUKA[kode]).format(
        sapa=sapa, situs=_domain(h.url), angka=_angka(kode, h)
    )
    return f"{baris}\n\n{pilih(PENUTUP)}"


def ringkasan(h) -> str:
    """Laporan lengkap, dikirim SETELAH calon klien menjawab 'boleh'."""
    baris = [f"Hasil pemeriksaan {_domain(h.url)}", ""]
    if h.waktu_muat is not None:
        baris.append(f"Waktu buka   : {h.waktu_muat:.1f} detik")
    if h.ukuran_halaman:
        baris.append(f"Ukuran       : {h.ukuran_halaman/1024:.0f} KB")
    baris.append(f"Skor         : {h.skor()}/100")
    baris.append("")
    if h.temuan:
        baris.append("Yang saya temukan:")
        for i, t in enumerate(h.temuan, 1):
            baris.append(f"{i}. {t.judul}")
            baris.append(f"   {t.bukti}")
    else:
        baris.append("Tidak ada masalah teknis yang saya temukan.")
    baris += ["", "Diperiksa dari halaman depan saja, seperti pengunjung biasa."]
    return "\n".join(baris)
