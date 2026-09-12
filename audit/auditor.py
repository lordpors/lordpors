"""
Pemeriksa website calon klien — LordPors.

GUNANYA APA
-----------
Blast dingin ("Halo, mau bikin website?") hampir selalu diabaikan, karena
penerimanya tahu pesan itu dikirim ke ribuan orang sekaligus.

Modul ini mengubahnya jadi alasan menghubungi yang masuk akal: memeriksa
website calon klien, lalu menyusun satu kalimat pembuka yang HANYA masuk akal
untuk dia. Bedanya besar:

    sebelum : "Halo, mau bikin website untuk usahanya?"
    sesudah : "Pak, situs sate-pakdhe.com saya buka 6,8 detik dan belum bisa
               dibuka rapi di HP. Boleh saya kirim hasil pemeriksaannya?"

BATASAN YANG SENGAJA DIPASANG
-----------------------------
- Hanya membaca halaman depan, persis seperti pengunjung biasa. Tidak ada
  pemindaian, tidak menyentuh bagian yang tidak publik.
- Satu permintaan per situs, jeda antar situs. Bukan alat pemindai massal.
- User-Agent menyebut identitas asli dan alamat yang bisa dihubungi. Kalau
  pemilik situs ingin memblokir, dia bisa.
- Semua temuan berupa ANGKA TERUKUR. Tidak ada "situs Anda kurang menarik".
  Kalau tidak bisa diukur, tidak dilaporkan.
"""

from __future__ import annotations

import asyncio
import re
import ssl
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from urllib.parse import urlparse, urljoin

import httpx
from bs4 import BeautifulSoup

# User-Agent ini dibaca pemilik situs di log server mereka. Ia HARUS
# menyebut identitas dan cara menghubungi — itu yang membedakan alat ini
# dari pemindai yang mengendap-endap.
#
# BELUM LENGKAP: alamat kontaknya masih kosong karena bisnis ini belum
# punya domain sendiri (branding PorsLabs sengaja dilepas 12 Sep 2026 —
# kantor ini bisnis yang berbeda). Isi tanda kurungnya begitu domainnya
# ada; jangan dibiarkan kosong lebih lama dari perlunya.
UA = (
    "LordPorsAudit/1.0 (pemeriksaan halaman depan untuk calon klien; "
    "satu permintaan per situs, ada jeda)"
)

BATAS_DETIK = 15.0
JEDA_ANTAR_SITUS = 2.0        # sopan: jangan membanjiri
AMBANG_LAMBAT = 3.0           # detik; di atas ini dianggap lambat
AMBANG_BERAT = 2_000_000      # bita halaman depan
JUMLAH_UKUR = 3               # sekali ukur tidak bisa dipercaya


@dataclass
class Temuan:
    """Satu hal yang ditemukan. Selalu punya angka atau bukti."""
    kode: str
    berat: str                 # 'tinggi' | 'sedang' | 'rendah'
    judul: str
    bukti: str


@dataclass
class HasilAudit:
    url: str
    dapat_dibuka: bool = False
    kode_http: int | None = None
    waktu_muat: float | None = None          # nilai tengah dari beberapa kali ukur
    waktu_tercepat: float | None = None
    waktu_terlambat: float | None = None
    ukuran_halaman: int | None = None
    https: bool = False
    ssl_valid: bool | None = None
    ramah_ponsel: bool | None = None
    ada_judul: bool | None = None
    panjang_judul: int | None = None
    ada_deskripsi: bool | None = None
    ada_tautan_wa: bool | None = None
    ada_nomor_telepon: bool | None = None
    jumlah_gambar: int | None = None
    gambar_tanpa_alt: int | None = None
    galat: str | None = None
    temuan: list[Temuan] = field(default_factory=list)
    diperiksa_pada: str = ""

    def skor(self) -> int:
        """0-100. Semakin tinggi semakin baik. Murni dari temuan terukur."""
        if not self.dapat_dibuka:
            return 0
        nilai = 100
        for t in self.temuan:
            nilai -= {"tinggi": 20, "sedang": 10, "rendah": 4}.get(t.berat, 0)
        return max(0, nilai)

    def dict(self) -> dict:
        d = asdict(self)
        d["skor"] = self.skor()
        return d


def _rapikan_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return ""
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    return url


async def periksa(url: str, klien: httpx.AsyncClient | None = None) -> HasilAudit:
    """Periksa satu situs. Tidak pernah melempar galat — kegagalan jadi temuan."""
    url = _rapikan_url(url)
    h = HasilAudit(url=url, diperiksa_pada=datetime.now(timezone.utc).isoformat())
    if not url:
        h.galat = "URL kosong"
        return h

    milik_sendiri = klien is None
    if milik_sendiri:
        klien = httpx.AsyncClient(
            timeout=BATAS_DETIK,
            follow_redirects=True,
            headers={"User-Agent": UA, "Accept-Language": "id-ID,id;q=0.9"},
        )

    try:
        # Sekali ukur TIDAK cukup. Terbukti saat uji: satu situs pernah
        # terbaca 10,5 detik padahal pengukuran berulang memberi 0,3-1,0 detik
        # -- gangguan jaringan sesaat. Kalau angka itu dikirim ke calon klien
        # lalu dia mengecek sendiri dan mendapat 1 detik, kredibilitas hilang.
        # Jadi diukur beberapa kali, yang dipakai NILAI TENGAH.
        waktu = []
        r = None
        try:
            for _ in range(JUMLAH_UKUR):
                mulai = time.perf_counter()
                r = await klien.get(url)
                waktu.append(time.perf_counter() - mulai)
        except ssl.SSLCertVerificationError as e:
            # Sertifikat bermasalah itu temuan penting, bukan sekadar galat:
            # peramban akan menampilkan layar merah "Tidak Aman" ke pengunjung.
            h.https = url.startswith("https://")
            h.ssl_valid = False
            h.galat = f"sertifikat SSL bermasalah: {str(e)[:80]}"
            h.temuan.append(Temuan(
                "ssl_rusak", "tinggi",
                "Sertifikat keamanan bermasalah",
                "Peramban menampilkan peringatan 'Tidak Aman' sebelum halaman terbuka.",
            ))
            return h
        except httpx.ConnectError:
            h.galat = "tidak bisa tersambung"
            h.temuan.append(Temuan(
                "tidak_hidup", "tinggi", "Situs tidak bisa dibuka",
                "Server tidak menjawab sama sekali.",
            ))
            return h
        except httpx.TimeoutException:
            h.galat = f"tidak menjawab dalam {BATAS_DETIK:.0f} detik"
            h.temuan.append(Temuan(
                "sangat_lambat", "tinggi", "Situs tidak terbuka dalam 15 detik",
                f"Pengunjung hampir pasti sudah pergi sebelum halaman muncul.",
            ))
            return h

        waktu.sort()
        h.waktu_muat = round(waktu[len(waktu) // 2], 2)       # nilai tengah
        h.waktu_tercepat = round(waktu[0], 2)
        h.waktu_terlambat = round(waktu[-1], 2)
        h.kode_http = r.status_code
        h.dapat_dibuka = r.status_code < 400
        h.ukuran_halaman = len(r.content)
        h.https = str(r.url).startswith("https://")
        h.ssl_valid = True if h.https else None

        if not h.dapat_dibuka:
            h.temuan.append(Temuan(
                "http_galat", "tinggi", f"Halaman depan menjawab {r.status_code}",
                "Pengunjung melihat halaman galat, bukan isi situs.",
            ))
            return h

        # ---------- kecepatan ----------
        if h.waktu_muat > AMBANG_LAMBAT:
            h.temuan.append(Temuan(
                "lambat", "tinggi", f"Halaman depan terbuka {h.waktu_muat:.1f} detik",
                f"Nilai tengah dari {JUMLAH_UKUR} kali pengukuran "
                f"({h.waktu_tercepat:.1f}-{h.waktu_terlambat:.1f} detik). "
                "Di atas 3 detik, sebagian besar pengunjung dari HP menutup halaman.",
            ))

        if h.ukuran_halaman and h.ukuran_halaman > AMBANG_BERAT:
            h.temuan.append(Temuan(
                "berat", "sedang",
                f"Halaman depan berukuran {h.ukuran_halaman/1_048_576:.1f} MB",
                "Berat untuk kuota prabayar dan jaringan di luar kota.",
            ))

        # ---------- keamanan ----------
        if not h.https:
            h.temuan.append(Temuan(
                "tanpa_https", "tinggi", "Belum memakai HTTPS",
                "Chrome menandai situs http:// sebagai 'Tidak Aman' di bilah alamat.",
            ))

        # ---------- isi halaman ----------
        sup = BeautifulSoup(r.text, "html.parser")

        vp = sup.find("meta", attrs={"name": re.compile("^viewport$", re.I)})
        h.ramah_ponsel = vp is not None
        if not h.ramah_ponsel:
            h.temuan.append(Temuan(
                "tidak_ramah_ponsel", "tinggi", "Belum disiapkan untuk layar HP",
                "Tidak ada tag viewport, jadi tampilan di HP mengecil seperti versi komputer.",
            ))

        judul = sup.find("title")
        teks_judul = judul.get_text(strip=True) if judul else ""
        h.ada_judul = bool(teks_judul)
        h.panjang_judul = len(teks_judul)
        if not h.ada_judul:
            h.temuan.append(Temuan(
                "tanpa_judul", "sedang", "Halaman tidak punya judul",
                "Di hasil Google yang muncul jadi potongan alamat, bukan nama usaha.",
            ))
        elif h.panjang_judul > 65:
            h.temuan.append(Temuan(
                "judul_kepanjangan", "rendah",
                f"Judul {h.panjang_judul} karakter",
                "Google memotong judul di sekitar 60 karakter.",
            ))

        desc = sup.find("meta", attrs={"name": re.compile("^description$", re.I)})
        h.ada_deskripsi = bool(desc and desc.get("content", "").strip())
        if not h.ada_deskripsi:
            h.temuan.append(Temuan(
                "tanpa_deskripsi", "sedang", "Tidak ada deskripsi untuk hasil Google",
                "Google mengarang sendiri cuplikannya, sering dari kalimat yang tidak menjual.",
            ))

        teks_penuh = r.text
        h.ada_tautan_wa = bool(re.search(r"wa\.me/|api\.whatsapp\.com|whatsapp://", teks_penuh, re.I))
        if not h.ada_tautan_wa:
            h.temuan.append(Temuan(
                "tanpa_wa", "tinggi", "Tidak ada tombol WhatsApp",
                "Pengunjung yang tertarik harus menyalin nomor sendiri — banyak yang urung.",
            ))

        h.ada_nomor_telepon = bool(re.search(r"tel:\+?\d|(\+62|62|0)8\d{8,}", teks_penuh))
        if not h.ada_nomor_telepon and not h.ada_tautan_wa:
            h.temuan.append(Temuan(
                "tanpa_kontak", "tinggi", "Tidak ada nomor yang bisa dihubungi",
                "Tidak ditemukan nomor telepon maupun tautan WhatsApp di halaman depan.",
            ))

        gambar = sup.find_all("img")
        h.jumlah_gambar = len(gambar)
        h.gambar_tanpa_alt = sum(1 for g in gambar if not (g.get("alt") or "").strip())
        if h.jumlah_gambar >= 5 and h.gambar_tanpa_alt >= h.jumlah_gambar * 0.6:
            h.temuan.append(Temuan(
                "gambar_tanpa_alt", "rendah",
                f"{h.gambar_tanpa_alt} dari {h.jumlah_gambar} gambar tanpa keterangan",
                "Google tidak bisa membaca isi gambar tanpa atribut alt.",
            ))

        return h

    except Exception as e:  # jaring pengaman; jangan sampai satu situs aneh menghentikan batch
        h.galat = f"{type(e).__name__}: {str(e)[:100]}"
        return h
    finally:
        if milik_sendiri:
            await klien.aclose()


async def periksa_banyak(daftar: list[str], jeda: float = JEDA_ANTAR_SITUS) -> list[HasilAudit]:
    """Periksa berurutan dengan jeda. Sengaja TIDAK paralel: ini bukan pemindai."""
    hasil = []
    async with httpx.AsyncClient(
        timeout=BATAS_DETIK, follow_redirects=True,
        headers={"User-Agent": UA, "Accept-Language": "id-ID,id;q=0.9"},
    ) as klien:
        for i, u in enumerate(daftar):
            hasil.append(await periksa(u, klien))
            if i < len(daftar) - 1:
                await asyncio.sleep(jeda)
    return hasil
