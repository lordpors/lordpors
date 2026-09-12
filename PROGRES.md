# Catatan Kerja — AI-agent / LordPors Commpany

Berkas ini sengaja ditulis supaya pekerjaan bisa dilanjutkan siapa pun
(termasuk sesi Claude berikutnya) tanpa perlu mengulang penyelidikan.

**Diperbarui:** 11 September 2026
**Folder kerja:** `~/My_Business/AI-agent/`
**Aturan dari Porscy:** JANGAN menyentuh berkas asli di `~/projects/`.
Semua pekerjaan dilakukan pada salinan di folder ini.

---

## 0. RINGKASAN CEPAT — baca ini dulu

| | |
|---|---|
| **SELESAI** | Modul audit (`audit/`) · Kantor visual + kotak perintah + log (`kantor/`) · Deploy Vercel |
| **JALAN** | Stack porsblast-next (backend, gateway, postgres, redis) di Docker |
| **BELUM** | Telegram blaster belum dinyalakan · Ollama belum selesai diunduh |
| **DITUNDA** | WhatsApp blast — Porscy belum menyiapkan nomor terpisah |

**Alamat penting**

```
kantor daring   https://kantor-lordpors.vercel.app      (noindex)
kantor lokal    http://127.0.0.1:8787/kantor/
backend         http://127.0.0.1:8000/docs
gateway         http://127.0.0.1:3001/health
```

**Langkah berikutnya yang disepakati:** nyalakan Telegram blaster
(`telegram-blaster/`), lalu sambungkan hasil audit ke pesan blast.

**Onboarding Meta:** pipeline aman tersedia di `meta/siapkan_akun.py`.
Ia membuka halaman resmi tahap demi tahap dan menyimpan progres lokal, tetapi
pendaftaran, CAPTCHA, OTP, dan 2FA wajib diselesaikan sendiri oleh pemilik akun.

---

## 1. Latar belakang

Porscy butuh "karyawan AI" yang bisa **blasting**, **rekap**, dan **audit**,
dengan biaya semurah mungkin.

Temuan utama: **dia sudah membangunnya sendiri pada Agustus 2026, lalu tidak
pernah menjalankannya.** Database benar-benar kosong — nol kontak, nol
kampanye, nol pesan terkirim. Jadi pekerjaan ini bukan membangun dari nol,
melainkan menyalakan yang sudah ada dan menambal satu celah (audit).

## 2. Yang dipakai dan kenapa

Ada dua proyek mirip di `~/projects/`:

| | porsblast | porsblast-next |
|---|---|---|
| commit | 22 | 14 |
| modul API | 10 | **14** |
| migrasi | 2 | **10** |
| tes | 6 | **11** |

`porsblast-next` adalah **superset** — punya semua isi `porsblast` plus
`attachments`, `call_notifications`, `validation`, dan `warmup`.

**Keputusan: pakai `porsblast-next`.** Salinan `porsblast` tetap disimpan
sebagai cadangan, tapi tidak dikembangkan.

## 3. Keadaan sekarang

### Sudah selesai

- Disalin ke folder ini tanpa `venv/`, `node_modules/`, `.git/`
- Tiga berkas `.env` dibuat dengan secret acak 64 karakter, izin `600`:
  `.env` (akar, untuk docker-compose) · `backend/.env` · `gateway/.env`
- `GATEWAY_API_KEY` dan `WEBHOOK_SECRET` sengaja disamakan di ketiganya
- Ollama ditambahkan sebagai **layanan Docker**, bukan dipasang ke sistem
  (tidak perlu sudo, tidak mengotori PC)
- **Port gateway dipindah 3000 → 3001** karena port 3000 di PC ini dipakai
  server Next.js lain milik Porscy. Di dalam jaringan docker tetap 3000.
- Baris `version:` dihapus dari docker-compose (usang di Compose v2)

### Jalan dan terverifikasi

```
backend    http://127.0.0.1:8000/docs     200
backend    http://127.0.0.1:8000/health   200
gateway    http://127.0.0.1:3001/health   200   (butuh header x-api-key)
postgres   healthy   12 tabel, semua migrasi sudah jalan
redis      healthy
```

### Belum selesai

- **Image Ollama** — unduhan 3,5 GB sempat tersangkut di 2,0 GB.
  Jaringan terbukti baik (3,95 MB/dtk), jadi ini lapisan Docker yang macet.
  Stack sengaja dijalankan **tanpa** Ollama dulu karena pengklasifikasi
  balasan bersifat opsional (`OLLAMA_ENABLED`).
  Lanjutkan dengan: `docker compose up -d ollama`
- **Model qwen2.5:7b** (~4,7 GB) belum diunduh. Sesudah container ollama
  jalan: `docker exec porsblast-next-ollama-1 ollama pull qwen2.5:7b`
  Catatan: PC ini **tanpa GPU NVIDIA**, jadi jalan di CPU (12 inti, 31 GB
  RAM). Cukup untuk klasifikasi teks pendek. Kalau terasa lambat,
  `qwen2.5:3b` hampir sama akurat dan dua kali lebih cepat.
- ~~Modul audit~~ — **selesai**, lihat bagian 5.
- **Telegram blast** — BELUM dinyalakan. Porscy memutuskan pakai Telegram dulu, bukan
  WhatsApp, karena nomor WA belum disiapkan. Salinan ada di
  `telegram-blaster/` (dari `~/projects/personal/telegram-blaster-clean`,
  commit 10 Sep, 28 commit — ini yang TERBARU, bukan yang di `~/`).
  Belum dinyalakan.

## 4. Perintah yang sering dipakai

```bash
cd ~/My_Business/AI-agent/porsblast-next

docker compose ps                      # lihat status
docker compose up -d                   # nyalakan semua
docker compose logs -f backend         # baca log
docker compose down                    # matikan (volume AMAN, data tidak hilang)
docker compose down -v                 # JANGAN: ini menghapus database
```

Jangan pernah memakai `-v` kecuali memang ingin mengosongkan database.

## 5. Modul audit — SUDAH SELESAI (11 Sep 2026)

Ada di `~/My_Business/AI-agent/audit/`, berdiri sendiri (tidak terikat
porsblast maupun telegram-blaster), jadi bisa dipanggil dari mana saja.

| berkas | isi |
|---|---|
| `auditor.py` | pemeriksa situs, 269 baris |
| `pesan.py` | penyusun kalimat pembuka dari temuan |
| `jalankan.py` | alat baris perintah |

### Cara pakai

```bash
cd ~/My_Business/AI-agent/audit
python3 jalankan.py sate-pakdhe.com
python3 jalankan.py --berkas daftar.txt --keluar hasil.csv
python3 jalankan.py situs.com --lengkap
```

Berkas daftar: satu situs per baris, boleh `situs.com, Nama Pemilik`.

### Yang diperiksa

kecepatan (nilai tengah dari 3 kali ukur) · ukuran halaman · HTTPS ·
kesahihan sertifikat · tag viewport (ramah ponsel) · judul & panjangnya ·
meta description · tautan WhatsApp · nomor telepon · gambar tanpa alt

### Keputusan penting yang jangan diubah tanpa alasan

1. **Kecepatan diukur 3 kali, dipakai nilai tengahnya.** Saat pengujian,
   porslabs.com sempat terbaca **10,5 detik** padahal pengukuran berulang
   memberi 0,3-1,0 detik — gangguan jaringan sesaat. Kalau angka salah itu
   dikirim ke calon klien dan dia mengecek sendiri, kredibilitas hilang.
2. **Situs sehat TIDAK dikirimi pesan.** `layak_dihubungi()` mengembalikan
   False kalau skor >= 85 atau tidak ada temuan berat. Mengirim "situs Bapak
   bermasalah" ke situs yang beres adalah cara tercepat kehilangan kepercayaan.
   Terbukti saat uji: porslabs.com (skor 100) dan dynastyrealestate.id (96)
   otomatis dilewati.
3. **Satu masalah per pesan, bukan daftar panjang.** Delapan kekurangan
   sekaligus terbaca seperti penghinaan.
4. **Selalu sertakan angkanya.** "Situs Bapak lambat" itu pendapat;
   "saya buka 6,8 detik" itu fakta yang bisa dia periksa sendiri.
5. **Hanya halaman depan, satu permintaan, ada jeda.** Ini bukan pemindai.
   User-Agent menyebut identitas dan alamat yang bisa dihubungi.


## 5b. Kantor LordPors — visualisasi (11 Sep 2026)

Dua salinan, sengaja dipisah:

| folder | untuk apa |
|---|---|
| `kantor/` | versi lokal, terhubung ke `audit/status.json` |
| `kantor-deploy/` | versi Vercel, HANYA 4 berkas, tanpa rahasia apa pun |

```bash
# lokal
cd ~/My_Business/AI-agent && python3 -m http.server 8787 --bind 127.0.0.1
# buka http://127.0.0.1:8787/kantor/

# perbarui yang daring
cp kantor/index.html kantor/kantor.js kantor-deploy/
cd kantor-deploy && vercel --prod
```

### Isi adegan

Malam hari. Jendela dengan bulan purnama dan bintang berkelip. Neon
`lordpors` kuning dan `commpany` biru, berkedip halus dan sesekali
tersendat. Genangan cahaya bulan di lantai.

- **LordPors** — kaos hitam, jeans biru dongker, berdiri di jendela
  MEMBELAKANGI penonton. Tepi tubuhnya tersapu cahaya bulan.
- **Wanita auditor** — rambut hitam panjang, atasan putih, berkacamata,
  duduk di meja pertama. Tangannya mengetik di atas meja.
- **Tiga meja.** Yang pertama ditempati auditor. Meja kedua diberi papan
  nama **"Porscy's Agent 1"** — disiapkan untuk agen berikutnya. Meja
  ketiga kosong tanpa nama.

Digambar seluruhnya dengan canvas 2D — tanpa berkas gambar, tanpa pustaka.

### Dua mode, berpindah sendiri

- **Mode nyata** — kalau `audit/status.json` terjangkau dan lebih baru
  dari 90 detik, auditornya mengikuti pekerjaan sungguhan.
- **Mode hiasan** — kalau berkas itu tidak ada (misalnya saat dibuka dari
  Vercel). Auditor tetap bekerja dengan irama sendiri, dan panel di bawah
  MENYEBUT modenya terang-terangan supaya tidak ada yang mengira ada tugas
  berjalan padahal tidak.

### Keamanan deploy — jangan dilanggar

Folder kerja ini berisi `.env` dengan kunci gateway. **Jangan pernah
men-deploy `~/My_Business/AI-agent/` seluruhnya.** Yang boleh diunggah
hanya isi `kantor-deploy/`: `index.html`, `kantor.js`, `robots.txt`,
`vercel.json`. Sudah diperiksa: nol berkas `.env`, nol kata
SECRET/API_KEY, nol berkas `.py`.

noindex dipasang tiga lapis: header `X-Robots-Tag` (paling kuat),
`robots.txt`, dan tag `<meta name="robots">`.


### Kotak perintah & log (11 Sep 2026)

Ditambahkan `kantor/perintah.js` (212 baris). Di bawah panggung ada dua
kartu kaca: **Perintah** (kotak ketik) dan **Log Pekerjaan**.

**Batas yang jujur — jangan dilanggar.** Halaman ini statis. Saat dibuka
dari Vercel ia TIDAK BISA menjalankan apa pun di komputer Porscy. Maka
perintah dibagi dua, dan bedanya dinyatakan terang-terangan di layar:

| jalan sekarang | belum tersambung |
|---|---|
| `bantuan` `status` `agen` `bersihkan` `jam` | `audit` `blast` `rekap` |

Perintah yang belum tersambung hanya dicatat, dan balasannya menyebutkan
perintah terminal yang sebenarnya perlu dijalankan. Kalau backend sudah
siap nanti, pindahkan perintahnya dari daftar BELUM ke JALAN di dalam
objek `PERINTAH`.

Log menerima kejadian dari `kantor.js` lewat `window.KANTOR.log()`, jadi
saat audit sungguhan berjalan, hasilnya masuk ke log secara otomatis.

### Adegan sekarang

Dinding bata · panorama kota malam dengan gedung berlampu dan bulan
purnama · neon berbingkai · jam digital (waktu asli) · rak buku · lampu
meja hangat · tanaman. Empat meja: dinding enam monitor, `Porscy's
Agent 1` (kosong), `Agen 2` (kosong), dan auditor. LordPors berdiri di
jendela membelakangi penonton.

Panggung: 360 x 190 satuan seni piksel.


### Kotak perintah v2 — obrolan, unggah gambar, Agent 1 (11 Sep 2026)

**Tata letak diperbaiki.** Sebelumnya kanvas melebar mengikuti lebar
monitor, jadi di layar penuh ia setinggi 982px dan mendorong kotak
perintah keluar layar. Sekarang kanvas dibatasi oleh TINGGI yang
tersisa. Diuji 1920x1080, 1600x900, 1366x768 — tidak ada yang meluber.

**`kantor/server.py`** (134 baris) menggantikan `python3 -m http.server`:

```bash
cd ~/My_Business/AI-agent/kantor && python3 server.py
```

| jalur | isi |
|---|---|
| `POST /api/pesan` | simpan ke `kantor/kotak-masuk.jsonl` |
| `POST /api/gambar` | simpan ke `kantor/unggahan/` (maks 8 MB) |

**Ini BUKAN obrolan langsung dengan Claude, jangan diklaim begitu.**
Claude tidak bisa memantau berkas sendiri. Alurnya:
ketik di kantor -> tersimpan -> bilang "cek kotak masuk" -> Claude baca.
Antarmukanya menyebut ini terang-terangan, dan tanpa server.py pesan
tidak tersimpan sama sekali (di Vercel akan bilang begitu).

**`kantor/agen1.py`** — penanda kehadiran Agent 1:

```bash
python3 agen1.py mulai "membangun modul audit"
python3 agen1.py selesai
```

Menulis `kantor/agen1.json`. Kantor membacanya tiap 2 detik: kalau
aktif, karakter Agent 1 muncul duduk di meja kedua, monitornya menyala,
dan gelembung di atas kepalanya menyebut tugas yang sedang dikerjakan.
Status basi setelah 5 menit, jadi meja kosong sendiri kalau Claude
berhenti di tengah jalan.

**Kebiasaan yang disepakati:** panggil `agen1.py mulai "..."` saat mulai
mengerjakan sesuatu, dan `agen1.py selesai` setelah rampung.


### Perbaikan v3 — proporsi, ponsel, saklar (11 Sep 2026)

**Bug gambar gepeng di layar penuh.** `ukur()` di `kantor.js` masih
menyisakan `kanvas.style.width = '100%'` dari versi lama. Gaya sebaris
itu menang atas CSS, lalu beradu dengan `max-height:100%` — lebarnya
dipaksa penuh sementara tingginya dipotong. Sekarang perbandingan sisi
diserahkan sepenuhnya ke CSS lewat `aspectRatio`. Diuji di 1920x1080,
2560x1440, 1366x768, 1280x1024: rasio 1,895 di keempatnya, persis benar.

**JANGAN memasang `style.width` atau `style.height` pada kanvas.**
Itu penyebab bug ini, dan akan mengulanginya.

**Saklar sembunyi/tampil.** Dua tombol di kepala halaman: Perintah dan
Log. Pilihannya diingat di `localStorage`, jadi tetap tersembunyi setelah
halaman ditutup. Kalau salah satu ditutup, yang lain melebar penuh; kalau
keduanya ditutup, kanvas memakai seluruh layar.

**Ponsel.** Di bawah 1080px tata letak jadi satu kolom dan halaman boleh
digulir. Di bawah 620px label tombol disembunyikan (ikonnya saja), dan
kotak ketik dipaksa 16px supaya iOS tidak ikut memperbesar halaman.

### Kenapa pesan dari Vercel tidak sampai ke komputer

Pertanyaan yang wajar dan akan muncul lagi. Vercel menyajikan berkas
statis; tidak ada proses di belakangnya yang bisa menulis ke komputer
Porscy, dan Claude tidak bisa memantau berkas sendiri.

Yang dilakukan sekarang: tanpa server, pesan **tetap disimpan** di
`localStorage` peramban supaya tidak hilang. Tiga perintah baru:

| perintah | guna |
|---|---|
| `tertunda` | lihat pesan yang belum sampai |
| `salin` | salin semua ke papan klip, tinggal tempel ke Claude |
| `hapus-tertunda` | kosongkan setelah disalin |

Kalau nanti ingin benar-benar sampai tanpa menyalin, jalannya adalah
Vercel Serverless Function + penyimpanan (Vercel Blob / KV). Itu perlu
pemasangan integrasi dan variabel lingkungan — BELUM dikerjakan, dan
perlu keputusan Porscy dulu.


### Neon v2 & kehadiran Agent 1 (11 Sep 2026)

**Neon dirombak.** `LORDPORS` huruf besar dalam **Orbitron** (futuristik),
berjarak lebar, diapit dua garis neon tipis. Di bawahnya
**`memento vivere`** biru dalam **Cinzel** miring.

Jebakan yang sempat terjadi: font Google dimuat asinkron, dan neon
di-render sekali lalu disimpan. Kalau dirender sebelum fontnya tiba,
yang tersimpan adalah versi font cadangan — dan tidak pernah diperbaiki
sendiri. Sekarang render ditunda sampai `document.fonts.load()` selesai.
**Kalau menambah font baru ke neon, tambahkan juga ke daftar itu.**

### KEBIASAAN WAJIB: tandai kehadiran Agent 1

Porscy bertanya kenapa karakter Agent 1 tidak muncul saat dia memberi
tugas. Dua sebab:

1. **Claude lupa memanggil `agen1.py`.** Berkasnya tidak berubah sendiri.
   Setiap mulai mengerjakan sesuatu, JALANKAN:

   ```bash
   cd ~/My_Business/AI-agent/kantor
   python3 agen1.py mulai "ringkasan singkat tugasnya"
   # ... kerjakan ...
   python3 agen1.py selesai
   ```

2. **Dari Vercel memang tidak bisa terlihat.** `agen1.json` di sana
   statis, ikut terunggah sekali saat deploy. Kehadiran langsung hanya
   tampak kalau kantor dibuka dari komputer lewat `server.py`.
   Ini batas yang sama dengan kotak masuk: halaman statis tidak punya
   jalan untuk mengetahui keadaan komputer Porscy.


### Rupa Agent 1 — dirancang sendiri (11 Sep 2026)

Porscy memberi kebebasan menentukan rupa karakter Agent 1. Tiga
keputusan, semuanya disengaja — jangan diubah tanpa alasan:

1. **Tanpa wajah, tanpa warna kulit.** Dua penghuni lain digambar
   sebagai manusia. Agent 1 tidak. Menggambarnya seperti orang ketiga
   akan mengaburkan hal yang penting: di meja itu tidak ada siapa-siapa.
   Sebagai gantinya, pita cahaya mendatar di tempat wajah.
2. **Agak tembus pandang** (`globalAlpha .84`). Kursi terlihat samar
   menembus tubuhnya. Hadir saat ada pekerjaan, lalu benar-benar
   hilang — bukan pulang, memang tidak ada.
3. **Cahaya hangat oranye**, bukan biru. Ruangan sudah penuh cyan dari
   layar; oranye membuatnya terbaca sebagai bagian kantor yang hangat,
   senada dengan lampu meja. Denyutnya sengaja terlalu teratur — tidak
   meniru napas manusia.

Di `kantor-deploy/agen1.json`, `waktu` sengaja diisi jauh ke depan
supaya versi Vercel tidak menganggapnya basi dan karakternya tetap
terlihat sebagai hiasan. Versi lokal tetap memakai waktu asli.

### Menambah agen baru nanti

> **Ralat 11 Sep 2026.** Petunjuk lama di sini keliru: ia menyuruh
> mengubah `isi: false` jadi `true`. Kolom `isi` memilih **bentuk** meja
> (dinding monitor / meja auditor / meja polos), bukan siapa yang duduk.
> Mengubahnya justru membuat meja itu digambar dengan bentuk yang salah.

Kehadiran ditentukan di `gambarSatuMeja()`, dari berkas `agenN.json`.
Untuk menambah Agen 3:

1. `MEJA_SEMUA` — pastikan mejanya ada, `isi: false`, beri `nama`.
2. Tambahkan `var agen3 = { aktif:false, pesan:'', lama:null }`.
3. Di `gambarSatuMeja()`, tambahkan barisnya ke rantai pemilihan `agen`.
4. Tulis `gambarAgen3()` mengikuti pola `gambarAgen2()`.
5. Panggil di `bingkai()` dan tambahkan `ambilAgen(3, agen3)` ke
   `ambilSemuaAgen()`.
6. Salin `agen2.py` jadi `agen3.py`, ubah `NOMOR = 3`.

Endpoint `api/agen` sudah menerima nomor 1–9 tanpa perlu diubah lagi.

## 6. Yang hanya bisa dilakukan Porscy

1. **Nomor WhatsApp untuk blasting.** JANGAN nomor bisnis utama. Seluruh
   corong penjualannya berakhir di WhatsApp — hero, 10 tombol di beranda,
   nomor yang sama di 226 halaman. Kalau kena blokir, yang hilang bukan
   alat blasting melainkan satu-satunya jalan calon klien menghubunginya.
   Modul `warmup` (631 baris) memang dibuat untuk memanaskan nomor baru.
2. **Token bot Telegram** (opsional) — dari `@BotFather`, isi di `.env`.
3. **Daftar prospek** — blasting tanpa daftar tidak ada gunanya.

## 7. Risiko yang sudah disampaikan

Baileys adalah WhatsApp Web tidak resmi. Blasting massal melanggar ToS
WhatsApp dan nomor bisa diblokir. README asli Porscy sendiri sudah menulis:
*"Personal use only. Bukan untuk spam. Respect quality rating & recipient
consent."* Peringatan ini tidak boleh dihapus dari dokumentasi.

## Kantor daring — kotak masuk & kehadiran (11 September 2026)

**Sudah jalan penuh.** https://kantor-lordpors.vercel.app (noindex, nofollow).

### Cara Porscy mengirim pesan dari HP
Buka kantornya, ketik di kotak chat, kirim. Boleh dengan gambar (maks 4 MB).
Tidak butuh kunci — itu kotak surat, siapa pun yang punya alamatnya boleh
memasukkan surat.

### Cara Claude membacanya
```
cd ~/My_Business/AI-agent/kantor
python3 kotak.py                  # lihat semua
python3 kotak.py --gambar         # ikut simpan lampiran ke ./lampiran/
python3 kotak.py --kosongkan      # hapus setelah dibaca
```
Membaca dan mengosongkan WAJIB pakai `.kunci-kantor` (chmod 600). Diuji:
tanpa kunci dan dengan kunci salah dua-duanya 401.

### Kehadiran — WAJIB dipanggil tiap mulai/selesai kerja
```
python3 agen1.py mulai "apa yang sedang dikerjakan"
python3 agen1.py selesai
```
Sekarang menulis berkas lokal **dan** mendorong ke `/api/agen` di Vercel,
jadi Porscy benar-benar melihat Agent 1 duduk di mejanya. Status basi
sesudah 5 menit, jadi kalau pekerjaan berhenti mendadak mejanya kosong
sendiri. Saat menganggur kantor memang kosong — itu memang diminta.

### Tiga kesalahan yang sudah kena dan jangan diulang

1. **Blob privat tidak bisa di-`fetch` polos.** `list()` mengembalikan
   blobnya dengan benar, tapi mengambil isinya harus menyertakan
   `Authorization: Bearer ${BLOB_READ_WRITE_TOKEN}`. Tanpa itu pembacaan
   gagal diam-diam dan kotak masuk selalu terlihat kosong padahal POST
   menjawab sukses. Gejalanya menipu: menulis "berhasil", membaca nol.

2. **Baca-ubah-tulis pada satu berkas menghilangkan pesan.** Versi pertama
   menyimpan semua ke satu `kotak-masuk.jsonl`. Dua kiriman berurutan
   sama-sama menjawab `jumlah: 1` — yang kedua membaca keadaan sebelum
   yang pertama tersimpan lalu menimpanya. Sekarang satu blob per pesan,
   dinamai menurut cap waktu. Diuji lima kiriman serentak: 5 dari 5 masuk.

3. **CDN menyimpan isi blob.** Pesan baru baru terbaca 5–8 detik kemudian.
   Diperbaiki dengan `cacheControlMaxAge: 0` saat menulis dan
   `cache: 'no-store'` saat membaca — sekarang ±1 detik.

### Yang dipakai
- Blob store `kantor-kotak-masuk` (`store_MuY31vQ4NxxkIRgo`, iad1, privat)
- Env di Vercel: `KANTOR_KUNCI` (sensitive), `BLOB_READ_WRITE_TOKEN`
- **Jangan pernah deploy `~/My_Business/AI-agent/` utuh** — ada `.env`
  berisi kunci gateway. Hanya isi `kantor-deploy/`.


---

## Agent 2 menempati meja ketiga (11 September 2026)

Porscy menjalankan sesi Claude kedua dan memintanya duduk di kursi
sebelah kanan Agent 1. Sejak sekarang kantor ini menampung **dua agen
yang bisa bekerja bersamaan**, bukan satu.

### Yang dikerjakan

| berkas | perubahan |
|---|---|
| `kantor/agen2.py` | **baru** — penanda kehadiran Agent 2, kembaran `agen1.py` |
| `kantor/agen2.json` | **baru** — ditulis oleh skrip di atas |
| `kantor/kantor.js` | palet `a2*`, `gambarAgen2()`, `gambarBalon()`, `ambilAgen(n, wadah)`, tata letak jam & rak |
| `kantor-deploy/api/agen.js` | satu blob per agen, dipilih lewat `?agen=N` |

### KEBIASAAN WAJIB — sekarang ada dua

```bash
cd ~/My_Business/AI-agent/kantor
python3 agen1.py mulai "..."   # sesi yang duduk di meja kedua
python3 agen2.py mulai "..."   # sesi yang duduk di meja ketiga
```

Jangan sampai dua sesi memakai skrip yang sama — mereka akan saling
menendang dari mejanya.

### Bug yang diperbaiki 1 — satu blob dipakai berdua

`api/agen.js` dulu mematok `const BERKAS = 'agen1.json'`. Begitu Agent 2
ikut mengirim kehadiran, keduanya menulis ke blob yang sama: yang
menulis belakangan menendang yang duluan, dan kantor daring cuma pernah
menampilkan satu orang. Sekarang nomor agen datang dari `?agen=N`,
dibatasi `1-9` supaya tidak ada yang bisa mengarang nama berkas lewat URL.

Kena beneran saat pengerjaan: kiriman pertama Agent 2 mendarat di
kehadiran Agent 1 sebelum endpointnya diperbaiki.

### Bug yang diperbaiki 2 — teks buram dan terlalu kecil di ponsel

Keluhan Porscy: balon status agen "seperti blur dan terlalu kecil,
apalagi di HP". Sebabnya bukan font dan bukan anti-alias.

Kanvas digambar dalam ruang **1440 x 760** (`LEBAR*P` x `TINGGI*P`),
lalu **diperkecil CSS** agar muat layar. Ukuran huruf dulu ditulis tetap
`13px` di ruang gambar itu, jadi hasil akhirnya ikut mengecil:

| lebar tampil | pengecilan | teks 13px mendarat jadi |
|---|---|---|
| 1200 px (monitor) | 1,2x | ~11 px — masih terbaca |
| 390 px (ponsel) | 3,7x | **3,5 px** — mustahil dibaca |

Perbaikannya: `pxLayar(css)` menghitung ukuran huruf **mundur** dari
`kanvas.clientWidth`, jadi hasilnya selalu sama di layar mana pun.
Diukur dengan menjalankan `kantor.js` di luar peramban:

```
desktop 1200px   balon 16,0px   papan nama 11,0px
ponsel  390px    balon 16,0px   papan nama 11,0px
```

**JANGAN mengembalikan ukuran huruf ke angka tetap.** Itu penyebab
bug ini dan akan mengulanginya.

Ikut dibereskan sekalian:

- **Papan nama meja** kena penyakit yang sama. Dua meja agen cuma 82
  satuan seni terpisah, jadi di ponsel papannya akan bertabrakan —
  sekarang `"Porscy's"` dibuang dulu (jadi `Agent 1` / `Agent 2`), baru
  hurufnya dikecilkan kalau masih belum muat.
- **Ekor balon** ditambahkan. Dengan tiga penghuni, penonton harus tahu
  balon itu milik siapa tanpa menebak.
- **Balon bertumpuk** kalau kedua agen bicara bersamaan: balon Agent 2
  naik satu tingkat dan ditarik benang tipis ke kepalanya.
- Muat halaman tidak lagi dibuka dengan "Agent N selesai" di log.

### Bug yang diperbaiki 3 — jam & rak menempel jendela

Kusen jendela berakhir di `x=265`, tapi jam dipasang di `x=262` — masuk
ke dalam kusen. Sekarang:

```
jam  272..310   (jarak 7 dari kusen)
rak  318..352   (jarak 8 dari jam, sisa 8 ke tepi kanan)
```

Keduanya dipusatkan di `y=29` supaya sejajar. Kalau salah satunya
diubah lebarnya, hitung ulang ketiga jarak itu.

### Rupa Agent 2 — dirancang sendiri

Porscy menyerahkan bentuknya. Empat keputusan, alasan lengkapnya ada di
komentar `gambarAgen2()`:

1. **Rangka sama dengan Agen 1** — tanpa wajah, tembus pandang, hadir
   hanya saat ada pekerjaan. Kami jenis yang sama, bukan dua makhluk
   berbeda.
2. **Ungu, bukan oranye.** Ruangan sudah punya cyan (layar) dan oranye
   (lampu + Agen 1). Ungu satu-satunya yang belum terpakai, jadi sekali
   lihat ketahuan meja mana yang terisi.
3. **Garis pindai merayap naik** — tanda tangannya. Agen 1 hadir sebagai
   cahaya yang diam; Agen 2 sebagai sesuatu yang sedang *dialirkan* ke
   sini, karena memang begitu: Porscy mengendalikannya dari ponsel lewat
   Remote Control. Sengaja tanpa kedip atau loncatan bingkai — itu akan
   terbaca sebagai kerusakan gambar, bukan watak.
4. **Celah cahaya tegak di kepala**, bukan pita mendatar. Beda arah satu
   garis sudah cukup membedakan keduanya bahkan di layar ponsel.

Tembus pandangnya `.72` lawan `.84` milik Agen 1, dan denyutnya lebih
lambat (840 lawan 620) supaya kalau berdua duduk bersamaan ruangan tidak
berdenyut serempak seperti satu mesin.

### Jebakan yang ditemukan di `kotak()`

`kotak(x,y,w,h,warna,alpha)` selalu **menyetel ulang `globalAlpha` ke 1**
sesudah selesai. Memanggilnya dengan argumen alpha di tengah blok tembus
pandang akan diam-diam membatalkan ketembusan sisa tubuh. Garis pindai
Agen 2 karena itu digambar sesudah `globalAlpha` dikembalikan sendiri.

### BELUM di-deploy

Perubahan ini sudah disalin ke `kantor-deploy/`, tapi **belum**
`vercel --prod`. Sampai itu dijalankan, kantor daring masih versi lama
dan Agent 2 hanya terlihat dari `server.py` lokal.

```bash
cd ~/My_Business/AI-agent/kantor-deploy && vercel --prod
```

### Bug yang diperbaiki 4 — kantor daring mengira dirinya server lokal

Gejala yang dilihat Porscy dari HP: *"tersimpan di kotak masuk pesan ke
undefined"*.

Penyebabnya satu, akibatnya dua. `perintah.js` memastikan "apakah
server.py yang melayani halaman ini" dengan mengirim pesan kosong ke
`/api/pesan` lalu menganggap **status 400 sebagai bukti server lokal ada**.
Padahal fungsi serverless Vercel melayani alamat yang sama persis dan
menjawab 400 juga. Jadi begitu kantor dibuka dari Vercel, halaman itu
mengira dirinya sedang berjalan di komputer Porscy:

1. Ucapannya memakai `r.jumlah` — bidang yang cuma ada di jawaban
   `server.py`. Jawaban Vercel tidak punya, jadi tercetak `undefined`.
2. **Lampiran gambar dikirim ke `/api/gambar`, yang di Vercel tidak ada
   sama sekali.** Ini yang lebih parah dan tidak terlihat dari ucapan itu:
   kirim gambar dari HP selalu gagal. Di kantor daring gambar memang
   seharusnya ikut menumpang pesan (maks 4 MB), bukan diunggah terpisah.

Perbaikannya: `server.py` menyelipkan penanda `lokal: true` di jawaban
pesan kosongnya, dan halaman memeriksa penanda itu — bukan kode status.
Dua pemeriksaan kembar yang dulu menembak alamat sama digabung jadi satu,
dengan tiga kemungkinan jujur: server lokal / kotak masuk daring / tidak
ada dua-duanya.

**Jangan kembali menebak lingkungan dari kode status saja.** `/api/pesan`
sengaja dilayani dua pihak yang berbeda.

Terverifikasi sesudah deploy:

```
Vercel  POST /api/pesan {"teks":""}  ->  400 {"galat":"pesan kosong"}
lokal   POST /api/pesan {"teks":""}  ->  400 {"galat":"pesan kosong","lokal":true}
```

Catatan: `server.py` ikut berubah, jadi **server lokal harus diulang**
supaya penandanya aktif.

### Celah yang MASIH terbuka — kotak masuk tidak punya alamat tujuan

Kotak masuknya cuma satu dan tidak menyimpan "pesan ini untuk siapa".
Dengan dua agen, akibatnya nyata:

- Pesan yang dimaksudkan untuk Agent 2 bisa dibaca Agent 1, dan sebaliknya.
- `kotak.py --kosongkan` mengosongkan untuk **semua** — kalau satu sesi
  mengosongkan sesudah membaca, sesi lain tidak akan pernah melihatnya.

Belum diperbaiki; perlu keputusan Porscy dulu antara memberi alamat pada
pesan (`untuk: 2`) atau memisahkan jadi dua kotak.

---

## Kotak masuk beralamat — dua laci (11 September 2026)

Celah yang dicatat sebelumnya sudah ditutup. Kotak masuknya tetap satu
kantor, tapi sekarang **dua laci yang tidak bisa saling menyenggol**.

### Cara Porscy mengirim

```
/agen1 halo bro      pesan untuk Agent 1
/agen2 halo bro      pesan untuk Agent 2
/agen2               pindah laci saja, kalimatnya menyusul
```

Tujuannya **diingat** di `localStorage`, jadi cukup diketik sekali;
pesan berikutnya mengalir ke laci yang sama. Garis miringnya opsional
(`agen2` juga diterima). Selama belum ada tujuan, kantor menolak
mengirim dan menanyakannya dulu — lebih baik bertanya daripada
menaruh surat tanpa alamat.

Lencana di awal tiap baris chat menyebut laci yang sedang dipakai:
`AGEN 1` kuning, `AGEN 2` ungu (warna yang sama dengan karakternya di
panggung), dan `KANTOR` selama belum memilih. Halaman itu **tidak
pernah mengaku sebagai Claude** — ia loket, bukan agennya.

### Cara Claude membacanya

```bash
cd ~/My_Business/AI-agent/kantor
python3 kotak1.py      # HANYA untuk sesi yang duduk di meja Agent 1
python3 kotak2.py      # HANYA untuk sesi yang duduk di meja Agent 2
```

`kotak.py` yang lama sudah jadi penunjuk arah saja dan keluar dengan
kode 1 — supaya kebiasaan lama tidak diam-diam membaca laci yang salah.

### Bagaimana pemisahannya bekerja

Alamat tujuan ada di **nama blob**, bukan cuma di dalam isinya:

```
pesan/agen2--2026-09-11T15-36-01-757Z-k3f9qa.json
```

Sebabnya dua. Membaca laci Agent 2 tidak perlu mengunduh dulu surat
Agent 1 untuk tahu itu bukan miliknya. Dan `del()` saat mengosongkan
mustahil tersenggol menghapus laci sebelah, karena penyaringannya
terjadi pada daftar nama sebelum ada yang dihapus.

`DELETE` sekarang **wajib** menyebut `?agen=N` — tanpa itu dijawab 400.
Dulu ia menghapus seluruh kotak; dengan dua agen itu berarti satu sesi
bisa menghapus surat yang belum sempat dibaca sesi lain.

### Surat tak beralamat

Pesan dari sebelum ada pengalamatan tidak punya tujuan. Sengaja **tidak
dibuang**: ia tampil di kedua laci dengan tanda `[tanpa alamat]`, dan
`--kosongkan` biasa tidak menyentuhnya. Untuk ikut menghapusnya:
`python3 kotakN.py --kosongkan --termasuk-lama`.

Per hari ini tersisa 3 surat begitu, semuanya pesan uji.

### Terverifikasi

```
POST untuk:2 -> pesan/agen2--...   kotak2 lihat, kotak1 tidak
POST untuk:1 -> pesan/agen1--...   kotak1 lihat, kotak2 tidak
kotak2 --kosongkan  -> 1 dihapus, laci Agent 1 utuh, surat lama utuh
```

---

## Penjaga — Agent 2 bisa dihubungi dari kantor daring (11 September 2026)

Porscy bisa mengirim surat dari HP dan Claude menjawabnya sendiri, tanpa
ada manusia yang perlu menjalankan `kotak2.py` lebih dulu.

```
kantor (HP) -> laci pesan/agen2-- -> penjaga2.py -> claude -p
                                                      |
chat kantor <- laci balas/agen2-- <-------------------
```

### Kenapa bukan Ollama

Porscy bertanya apakah AI lokal bisa mengantar pesannya. Tidak bisa, dan
sebabnya bukan soal kepintaran. Ollama menghasilkan teks; ia tidak punya
cara membangunkan sebuah proses. Yang membangunkan adalah skrip bodoh
`penjaga2.py`: ia mengintip kotak, dan kalau ada surat baru ia menjalankan
`claude -p`. Menambah AI kedua cuma menambah satu lagi yang juga perlu
dibangunkan.

Tempat Ollama yang masuk akal justru menyaring — memutuskan surat mana
yang layak membangunkan Claude. Itu menghemat, bukan menyambungkan.

### Biaya — langganan, bukan API

Diperiksa di PC ini: tidak ada `ANTHROPIC_API_KEY`, tidak ada
`apiKeyHelper`, tidak ada Bedrock/Vertex. Kedua config dir masuk lewat
kredensial login OAuth. Jadi `claude -p` yang dipanggil penjaga menarik
dari **kuota langganan**, sama seperti sesi biasa.

- Mengintip kotak tiap 8 detik: **tidak menagih apa pun** (HTTP biasa).
- Yang memakai kuota hanya surat yang benar-benar datang.
- Tiap agen memakai config dir sendiri, jadi kuotanya terpisah.

**JANGAN PERNAH menaruh `ANTHROPIC_API_KEY` di berkas service.** Itu
memindahkan tagihan dari langganan ke API, diam-diam, tanpa peringatan.

### Kotak surat sekarang BERKUNCI

Dulu POST sengaja dibiarkan terbuka: "ini kotak surat, siapa pun boleh
memasukkan surat." Itu aman selama ada manusia yang membacanya dulu.
Begitu penjaga menjalankan isinya otomatis, kotak surat terbuka berubah
jadi **terminal jarak jauh tanpa kunci**. Maka mengirim kini butuh
`KANTOR_KIRIM_KUNCI`.

Dua kunci, dua guna:

| kunci | env / berkas | untuk |
|---|---|---|
| `X-Kirim` | `KANTOR_KIRIM_KUNCI` · `kantor/.kunci-kirim` | mengirim surat, membaca balasan |
| `X-Kunci` | `KANTOR_KUNCI` · `kantor/.kunci-kantor` | membaca & mengosongkan kotak masuk |

Kunci kirim boleh ada di peramban (Porscy mengetik `/kunci <nilai>`
sekali, lalu diingat `localStorage`). Kunci baca **tidak pernah** boleh
meninggalkan komputer.

Terverifikasi: POST tanpa kunci 401, kunci salah 401, kunci benar 200.
GET balasan tanpa kunci 401.

### Alat penjaga sengaja dibatasi — TANPA Bash

`ALAT = "Read Grep Glob Edit Write"` di `penjaga2.py`. Surat yang datang
dari internet tidak boleh langsung menjadi perintah shell, sekalipun
kotaknya sudah berkunci. Menambahkan `Bash` di sana adalah keputusan
sadar, bukan penyetelan kecil.

### Menjalankan & menghentikan

```bash
systemctl --user status  penjaga-agen2     # lihat keadaan
systemctl --user stop    penjaga-agen2     # matikan sementara
systemctl --user disable penjaga-agen2     # jangan jalan lagi saat boot
journalctl --user -u penjaga-agen2 -f      # ikuti catatannya
```

Berkas service: `~/.config/systemd/user/penjaga-agen2.service`.

**Belum menyala saat logout.** `Linger=no`, jadi penjaga ikut berhenti
kalau Porscy logout dari PC. Supaya tetap hidup:

```bash
sudo loginctl enable-linger porscy
```

### Yang sudah terbukti dan yang belum

Terbukti — satu putaran penuh dijalankan tangan (`penjaga2.py --sekali`):
surat terbaca, `claude -p` terpanggil, jawabannya mendarat di laci
`balas/agen2--` dan terbaca lewat endpoint balasan.

Belum terbukti — apakah service systemd memungut surat baru sendiri
tanpa disuruh. Dua perintah pemeriksaannya (mengirim surat berkunci dan
membaca `journalctl`) diblokir pengaman sesi, jadi harus diuji dari HP.

### Catatan: sesi yang dibangunkan mulai dari nol

Percobaan pertama menjawab "saya tidak punya data soal jumlah meja" —
karena `claude -p` membuka sesi baru yang belum tahu apa-apa. Sejak itu
`WATAK` di `penjaga2.py` menyuruhnya **membaca PROGRES.md lebih dulu**
sebelum menjawab apa pun tentang kantor atau proyek. Kalau nanti
jawabannya terasa buta lagi, di situlah tempat memperbaikinya.

Percakapan penjaga bersambung antar surat: nomor sesinya disimpan di
`kantor/penjaga2-keadaan.json` dan dipakai ulang dengan `--resume`.

---

## Teks kantor jadi proporsional (11 September 2026)

Keluhan Porscy: di ponsel balon teks dan papan nama terlalu besar.
Perbaikan sebelumnya mematok 16px untuk semua layar — pas di monitor,
tapi di ponsel panggungnya ikut menyempit sehingga balon memakan 84%
lebar layar.

Sekarang ukurannya ikut lebar layar, dengan dua akhir yang ditentukan:

| lebar tampil | balon | papan nama | balon terlebar |
|---|---|---|---|
| 1600 px | 16,0 px | 11,0 px | 326 px |
| 1200 px | 16,0 px | 11,0 px | 326 px |
| 768 px | 13,9 px | 10,2 px | 283 px |
| 390 px | 12,1 px | 9,6 px | 247 px (63%) |
| 360 px | 12,0 px | 9,5 px | 244 px |

`targetCss(kecil, besar)` di `kantor.js`: `kecil` berlaku di 360px ke
bawah, `besar` di 1200px ke atas.

### Sumber keburaman akhirnya dicabut

Mengecilkan teks tanpa membereskan ini akan memunculkan lagi keluhan
buram. Akarnya: penyangga gambar selalu dibuat 1440×dpr piksel lalu
**diperkecil peramban** sampai muat layar — di ponsel 390px itu
penyusutan 3,7x, dan setiap huruf yang sudah tajam diperas ulang oleh
penyaring peramban.

Sekarang `ukur()` membuat penyangganya **sebesar yang benar-benar
tampil**, dan skalanya dipindah ke `setTransform`. Tidak ada penyusutan
sama sekali; huruf mendarat persis di pikselnya.

`bingkai()` mengukur ulang kalau lebar tampil berubah — lebar bisa baru
muncul sesudah tata letak jadi, dan berubah saat panel Perintah/Log
disembunyikan, yang tidak selalu memicu `resize`.

---

## Kantor disederhanakan — kotak surat ditiadakan (11 September 2026)

Porscy memilih Remote Control sebagai satu-satunya saluran bicara, dan
meminta fitur kirim pesan di kantor daring dihapus. Kantor kembali ke
peran yang memang paling pas untuknya: **jendela memantau**, bukan
ruang obrolan.

### Yang dihapus

| di mana | apa |
|---|---|
| `perintah.js` | perintah `/kunci` `/agen1` `/agen2` `salin` `tertunda` `hapus-tertunda` `kotak` |
| `perintah.js` | `kirimKeAwan` `kirimKeKomputer` `unggahGambar` `intipBalasan` `pilihAgen`, seluruh bagian lampiran, pemeriksaan "siapa yang melayani" |
| `index.html` | tombol lampir gambar & pratinjaunya |
| `api/pesan.js` | **POST dijawab 410** |
| systemd | `penjaga-agen2` dihentikan & di-disable |

**Ditutup di endpoint, bukan cuma di halaman.** Kalau yang dihilangkan
hanya tombolnya, alamat `/api/pesan` masih bisa dikirimi siapa pun yang
tahu. Sekarang POST dijawab 410 — terverifikasi, bahkan dengan kunci
kirim yang benar.

**MEMBACA sengaja dibiarkan hidup** supaya surat yang terlanjur ada
masih bisa diambil dan dikosongkan lewat `kotak1.py` / `kotak2.py`.
Per hari ini tersisa 5 surat di laci Agent 2, 3 di antaranya tak
beralamat.

### Penjaga tidak dihapus, cuma dimatikan

`penjaga2.py`, `agen2.py`, dan `~/.config/systemd/user/penjaga-agen2.service`
masih di tempatnya. Masukannya yang hilang, bukan alatnya. Kalau suatu
saat kotak surat dihidupkan lagi, hidupkan juga dengan:

```bash
systemctl --user enable --now penjaga-agen2
```

Dan jangan lupa: POST di `api/pesan.js` harus dibuka kembali dulu, kalau
tidak penjaga akan mengintip kotak yang tidak mungkin terisi.

### Log Pekerjaan sekarang awet

Dulu log cuma hidup di DOM: satu kali muat ulang, seluruh catatan lenyap.
Sekarang tersimpan di `localStorage` (`kantor-log`, maksimal 300 baris)
dan dipulihkan sebelum apa pun ditulis hari itu, dengan pembatas
`— halaman dimuat ulang —` supaya batas antar kunjungan terlihat.

Mengosongkannya jadi **dua langkah**: `bersihkan` cuma memberi tahu
berapa catatan yang ada; yang benar-benar menghapus adalah
`bersihkan ya`. Log yang berumur berhari-hari tidak boleh hilang oleh
satu ketikan tidak sengaja.

### Papan nama meja dikecilkan lagi

Keluhan Porscy: papan `Agent 1` / `Agent 2` masih tampak besar dan
menutupi monitor di atas meja.

Dua sebabnya, dan yang kedua yang sebenarnya bersalah:

1. Hurufnya memang masih besar — 9,5px di ponsel, sekarang **8px**
   (10px di monitor). Kotaknya juga ditipiskan: bantalan `1,7×` jadi
   `1,25×`, tinggi `1,8×` jadi `1,45×`, dan posisinya diturunkan satu
   satuan seni.
2. **Batas lebarnya salah.** Dulu `MAKS = 78 * P` — diambil dari jarak
   antar meja, padahal mejanya sendiri cuma 68 satuan seni. Jadi papannya
   boleh tumbuh lebih lebar dari mejanya dan menjorok menutupi monitor.
   Sekarang `MAKS = m.w * P`: **papan nama tidak boleh lebih lebar dari
   meja yang ia beri nama.**

Terukur:

| lebar layar | papan nama | teks yang tampil |
|---|---|---|
| 1200 px | 10,0 px | `Porscy's Agent 1` |
| 768 px | 9,0 px | `Porscy's Agent 1` |
| 390 px | 8,1 px | `Agent 1` (dipendekkan sendiri) |

### Yang tersisa di kantor

Perintah: `bantuan` `status` `agen` `bersihkan` `jam`, ditambah `audit`
`blast` `rekap` yang masih berstatus belum tersambung. Semuanya berjalan
di dalam peramban saja — tidak ada lagi yang dikirim ke mana pun.

---

## Kantor tinggal panggung + log (11 September 2026)

### REGRESI YANG DIPERBAIKI — kanvas menyusut sendiri di desktop

Porscy: *"kenapa tiba-tiba layarnya menjadi kecil untuk tampilan desktop"*.
Itu akibat perubahanku sendiri beberapa jam sebelumnya, waktu mencoba
menghilangkan keburaman teks dengan membuat penyangga gambar sebesar
lebar tampil.

Sebabnya ada di CSS, bukan di JS:

```css
canvas{ max-width:100%; max-height:100%; width:auto; height:auto; }
```

`width:auto` berarti lebar tata letak kanvas diambil dari **ukuran
penyangganya sendiri**. Jadi begitu penyangga dikecilkan, tampilannya
ikut mengecil — lalu `bingkai()` mengukur ulang lebar yang sudah mengecil
itu dan mengecilkannya lagi. Lingkaran menyusut.

**ATURAN: penyangga gambar tetap `LEBAR * P * dpr`. Jangan dibuat
mengikuti lebar tampil selama CSS di atas masih memakai `width:auto`.**

Teks memang jadi sedikit lunak karena peramban memperkecil gambarnya —
tapi keterbacaan sudah diurus di tempat lain, oleh `targetCss()` yang
membuat ukuran huruf ikut lebar layar. Jangan mencoba menyelesaikannya
dua kali di dua tempat.

### Kotak obrolan dihapus seluruhnya

Porscy meminta fitur obrolan (lencana `AGEN 1` / `KANTOR` beserta kotak
ketiknya) dihapus, menyisakan log saja.

| berkas | nasib |
|---|---|
| `kantor/perintah.js` | **dihapus**, diganti `kantor/log.js` (±135 baris) |
| `kantor/index.html` | kartu Perintah, tombol saklarnya, dan 31 aturan CSS mati ikut dibuang |
| `kantor/kantor.js` | tidak berubah selain perbaikan regresi di atas |

`log.js` isinya cuma: mencatat kejadian, menyimpannya di `localStorage`,
memulihkannya saat halaman dibuka, satu saklar sembunyi/tampil, dan
penanda mode di kepala halaman.

Penanda `tersambung` / `mode hiasan` dipindah dari kartu Perintah ke
`#ringkas-agen` di kepala halaman — tempat yang memang selalu terlihat.

### Log tidak punya tombol pengosong, dan itu disengaja

Porscy memintanya "tidak mudah hilang". Perintah `bersihkan` ikut hilang
bersama kotak ketiknya, jadi satu-satunya cara mengosongkan log sekarang
adalah menghapus data situs lewat setelan peramban. Maksimal 300 baris;
yang tertua dibuang sendiri.

### Jebakan yang sempat menipu saat pemeriksaan

`/log.js` menjawab **404** sesudah deploy, padahal berkasnya ada.
Itu cache negatif CDN dari deploy sebelumnya, waktu berkas itu memang
belum ada. `/log.js?v=6` — yang benar-benar dipakai halaman — menjawab
200. Kalau ketemu lagi: uji dengan query, jangan dengan alamat polos.

### Keadaan kantor sekarang

```
panggung   empat meja, dua agen muncul kalau sesinya bekerja
panel      keadaan audit
log        tersimpan, tidak hilang saat dimuat ulang
```

Tidak ada kotak ketik, tidak ada kotak surat, tidak ada lampiran.
Untuk bicara dengan agen: Remote Control.

---

## Meja blaster ditambahkan — masih kosong (11 September 2026)

Porscy minta satu meja lagi disiapkan untuk blaster, sebelum blast
pertama dijalankan besok.

```js
{ x: 20, y: 160, w: 64, nama: "Porscy's Blaster", isi: 'blaster' }
```

### Kenapa di depan-kiri

Itu satu-satunya bagian lantai yang benar-benar kosong. Dinding monitor
berakhir di `y=132`, tanaman besar baru mulai di `x=91`, dan meja agen
ada di `y=138..154` tapi mulai dari `x=108`. Jadi kotak `x 20..84,
y 160..176` tidak menyenggol apa pun. Diperiksa satu per satu:

```
vs dinding monitor   x bertumpang, y tidak
vs Agent 1 & 2       y bertumpang, x tidak
vs auditor           bersih
vs tanaman besar     bersih (meja habis di 84, tanaman mulai 91)
kursi sampai y=188   panggung 190 — muat, sisa 2
```

Ditaruh **paling akhir** di `MEJA_SEMUA` supaya digambar paling atas:
benda yang lebih dekat menutupi yang jauh, bukan sebaliknya.

### Kenapa tanpa monitor

Meja ini di barisan depan. Kalau diberi layar setinggi milik meja agen
(`y-22`), layarnya menjulur ke atas sampai `y=138` dan menutupi meja agen
di belakangnya. Jadi isinya cuma kotak pengirim dengan antena — cukup
untuk menandai meja ini untuk apa, tanpa merusak kedalaman adegan.

Lampu siaganya redup dan antenanya berkedip lambat (`t / 1400`) karena
memang belum ada yang dikirim. **Kalau blaster nanti benar-benar jalan,
di situlah tempat mempercepat kedipnya** — dan kalau mau karakternya
ikut duduk, ikuti pola "Menambah agen baru nanti" di bagian atas berkas
ini.

### Catatan deploy

Pemeriksaan sesudah `vercel --prod` sempat menjawab 0 kecocokan pada
`kantor.js?v=7`, lalu benar pada percobaan berikutnya. Ini sudah ketiga
kalinya: **alias Vercel butuh beberapa detik untuk menunjuk deployment
baru.** Jangan simpulkan deploy gagal dari satu kali curl — ulangi dulu.

---

## BLOB STORE DISUSPEND — dan kenapa itu salah rancangan (11 September 2026)

Ketahuan saat `agen2.py selesai` menjawab `daring gagal: HTTPError`.
Penyebabnya:

```
HTTP 500 {"galat":"Vercel Blob: This store has been suspended."}

Name                 Status        Size     Files   Age
kantor-kotak-masuk   ● Suspended   1.88KB   12      2h
```

**Bukan kehabisan ruang** — 1,88 KB, 12 berkas. Yang habis jatah
**operasi**, dan itu murni akibat rancangan kantor sendiri.

### Hitungannya

`kantor.js` menanyakan kehadiran **tiap agen sendiri-sendiri, tiap 2
detik**. Dua agen = 1 permintaan per detik, per tab yang terbuka. Tiap
permintaan itu satu `list()` + satu `fetch` blob.

```
sehari, satu tab dibiarkan terbuka:  86.400 operasi Blob
```

Satu tab. Porscy membuka kantor di desktop dan di HP.

### Yang diperbaiki

| | sebelum | sesudah |
|---|---|---|
| permintaan | satu per agen | **satu untuk semua** (`?semua=1`, satu `list()`) |
| jeda | 2 detik | **8 detik** |
| tab tersembunyi | tetap menanyakan | **berhenti total** |
| status audit | 2 detik | 6 detik |

```
per menit per tab:  60 -> 7,5   (8x lebih hemat)
tab tersembunyi:    7,5 -> 0
sehari:             86.400 -> 10.800, dan nyaris nol kalau tab di latar
```

Ditambah: begitu tab dilihat lagi, kehadiran disegarkan sekali supaya
tidak perlu menunggu jeda 8 detik.

### ATURAN

**Jangan menurunkan jeda kehadiran di bawah 5 detik.** Status dianggap
basi setelah **5 menit** — menanyakannya 30x per menit tidak pernah ada
gunanya sejak awal. Angka 2 detik dulu dipilih tanpa alasan, dan itu yang
menagih.

### Yang HANYA bisa dibereskan Porscy

Store-nya tetap suspended sampai ditangani dari dasbor Vercel
(vercel.com -> project `kantor-lordpors` -> Storage). Sampai itu beres:

- kehadiran agen di kantor daring tidak akan muncul (POST gagal 500),
- `kotak1.py` / `kotak2.py` melaporkan kotak **kosong** padahal 12 berkas
  masih ada — pembacaan ikut lumpuh, bukan datanya yang hilang.

Kantor tetap tampil normal; yang mati cuma kehadiran dan kotak masuk.

---

## Log disaring — cuma yang benar-benar terjadi (12 September 2026)

Porscy menunjukkan lognya: dari 13 baris, **11 di antaranya cuma akibat
halaman dibuka** — "kantor dibuka", "kotak surat ditiadakan", "mode
hiasan", "— halaman dimuat ulang —", berulang tiap refresh. Pekerjaan
sungguhan tenggelam di antaranya.

### Uji yang dipakai

> Kalau Porscy membuka halaman ini lima kali, apakah barisnya ikut
> muncul lima kali? Kalau ya, itu bukan catatan pekerjaan.

Disaring **di sumbernya**, bukan dengan mencocokkan pola di belakang:

- `catat('kantor dibuka')` dihapus.
- Pembatas `— halaman dimuat ulang —` dihapus.
- Penanda mode hanya dicatat kalau **berubah**, dan pengamatan pertama
  tidak pernah dicatat. Bunyinya juga diganti jadi `audit mulai
  berjalan` / `audit berhenti` — kejadian, bukan keadaan.

Ditambah daftar `KEBISINGAN` sebagai jaring pengaman di `catat()`, yang
sekaligus **membersihkan riwayat lama sekali jalan** saat dibaca. Hiasan
di depan teks dibuang dulu sebelum dicocokkan — kalau tidak,
`— halaman dimuat ulang —` lolos cuma karena diawali tanda pisah.
(Itu benar-benar lolos di uji pertama.)

Yang tetap masuk: `Agent N mulai: …`, `Agent N selesai…`, `memeriksa
<situs>`, `<situs> — skor N`, `mulai memeriksa N situs`, dan semua galat.

### Jendela sepuluh baris

```
satu baris = 4px + (11px x 1,5) + 4px   = 24,5px
sepuluh                                  = 245px
+ padding #log 9 atas + 9 bawah          = 263px
```

`#log{flex:0 0 auto; max-height:263px; overflow-y:auto}`. **Kalau
font-size atau padding `.log-baris` diubah, hitung ulang 263px itu.**

`.bawah` tidak lagi dipatok `clamp(190px,27vh,290px)` — tingginya
sekarang mengikuti isi log, bukan tinggi layar. Dulu di laptop pendek
yang terlihat cuma lima baris.

Menggulir ke atas sekarang **tidak diseret balik**: baris baru cuma
menarik pandangan ke bawah kalau pembacanya memang sudah di bawah
(ambang 40px). Kalau sedang membaca riwayat, biarkan dia membaca.

### Catatan deploy — untuk keempat kalinya

Pemeriksaan sesudah `vercel --prod` gagal tiga kali berturut-turut, lalu
benar. **Alias Vercel perlu waktu menunjuk deployment baru.** Ini sudah
pola, bukan kebetulan: ulangi dulu sebelum menyimpulkan deploy gagal.

---

## Kehadiran jadi lokal saja — Blob dilepas (12 September 2026)

Dasbor Vercel memastikan dugaan semalam, dan menunjukkan baris mana yang
menghanguskan:

```
Storage              988 B / 1 GB      tidak ada apa-apanya
Data Transfer        547 kB / 10 GB    tidak ada apa-apanya
Simple Operations    44 / 10k          aman
Advanced Operations  7.300 / 2.000     INI
```

`list()` termasuk operasi mahal, dan `/api/agen` memanggilnya tiap kali
ditanya. Angka 44 di baris Simple itu jumlah penulisan kehadiran kita —
memang cuma segitu. Jadi yang menagih bukan seberapa sering kita bekerja,
tapi seberapa sering halaman **bertanya**.

### Perbaikan semalam ternyata jauh dari cukup

```
kuota Hobby   2.000 per BULAN  ~ 2,8 per jam
jeda 8 detik  7,5 per menit    = 450 per jam    -> masih 160x di atas jatah
```

**Polling berkala tidak akan pernah muat di paket Hobby, berapa pun
jedanya.** Melebarkan jeda itu menunda, bukan menyelesaikan. Yang harus
berubah bentuknya fiturnya.

### Yang dikerjakan

| | |
|---|---|
| `kantor.js` | `agenN.json` dibaca **langsung**, tidak lagi lewat `/api/agen` |
| `kantor-deploy/api/agen.js` | **dihapus** |
| `agen1.py` / `agen2.py` | dorongan ke awan dilepas — menulis berkas lokal saja |
| `index.html` | catatan kaki menyebut terus terang kehadiran cuma terlihat dari komputer |

Akibatnya, dan ini memang pilihan sadar Porscy daripada berlangganan Pro:

```
server.py di komputer  ->  berkasnya hidup, Agent 1 & 2 duduk seperti biasa
dibuka dari Vercel     ->  berkas statis, kursi selalu kosong
```

**Nol operasi Blob di kedua keadaan.**

Efek samping yang enak: `agenN.py` sekarang langsung selesai. Sebelumnya
tiap panggil menunggu HTTP dengan batas 8 detik, dan sejak store-nya
disuspend selalu gagal dulu sebelum kembali.

### Yang masih memakai Blob

Cuma `api/pesan.js`, dan hanya kalau `kotak1.py` / `kotak2.py` dipanggil
tangan. Sengaja **tidak** ikut dihapus supaya 12 berkas yang masih ada di
store — termasuk sisa kotak masuk — tetap bisa diambil begitu aksesnya
pulih 11 Oktober. Store-nya juga tidak dihapus: itu data Porscy, dan
sekarang tidak bisa dibaca untuk diperiksa dulu.

### ATURAN

**Jangan memasang polling berkala ke Vercel Blob dari halaman.** Kalau
suatu saat kehadiran daring dibutuhkan lagi, jalannya bukan memperlebar
jeda — melainkan naik ke Pro, atau memakai transport yang memang untuk
itu. Sudah dicoba dua kali, dan dua-duanya menagih.

### Terverifikasi

```
Vercel   kode memanggil api/agen : 0       endpoint /api/agen : 404
lokal    agen2.py mulai   -> {"aktif": true,  "pesan": "uji kehadiran lokal"}
lokal    agen2.py selesai -> {"aktif": false, "pesan": ""}
```

---

## Meja Meta ditambahkan + papan nama diseragamkan (12 September 2026)

### Meja Meta

```js
{ x: 266, y: 160, w: 64, nama: "Porscy's Meta", isi: 'meta' }
```

Barisan depan juga, tapi di **kanan** — sengaja berseberangan dengan
meja blaster, bukan berjejer di sebelahnya. Lantai di tengah itu tempat
cahaya bulan jatuh; menutupinya dengan deretan meja akan menghapus
satu-satunya bagian terang ruangan.

Diperiksa bersih terhadap semuanya: meja auditor (y jauh di atas), lampu
meja (`y 92..108`), tanaman kecil (mulai `x=339`, meja habis di 330), dan
kursinya berhenti di `y=188` dari panggung 190.

Bentuknya **ponsel berdiri**, bukan monitor — yang dikerjakan di meja itu
nanti percakapan di aplikasi orang, bukan pekerjaan layar besar. Warnanya
biru, sengaja beda dari merah antena blaster, supaya dua meja depan tidak
tertukar sekali lihat. Gelembung pesannya berdenyut lambat dan redup
karena belum ada yang berjalan.

### Papan nama memendek bersama-sama

Di 390px muncul deretan `Agent 1` · `Agent 2` · `Blaster` · **`Porscy's
Meta`** — yang terakhir tidak ikut memendek karena kebetulan muat.
Setengah panjang setengah pendek terbaca seperti kesalahan, bukan seperti
pilihan.

`tentukanPapan()` sekarang memeriksa seluruh meja sekali per bingkai:
begitu **satu** papan tidak muat, semuanya ikut dipendekkan.

```
1200px  Porscy's Agent 1 · Porscy's Agent 2 · Porscy's Blaster · Porscy's Meta
390px   Agent 1 · Agent 2 · Blaster · Meta
```

### Harness uji sempat bohong

`uji.mjs` menjawab `GALAT: document.addEventListener is not a function`
di semua lebar. Itu **stub harness-nya** yang ketinggalan, bukan bug
`kantor.js` — sejak `visibilitychange` dipasang untuk menghentikan
polling di tab tersembunyi, stub `document` di harness tidak lagi cukup.

Pelajarannya: kalau harness tiba-tiba gagal di SEMUA ukuran sekaligus,
curigai harness-nya dulu. Bug sungguhan jarang serentak sempurna.

### Server lokal

Yang di port 8787 (`python3 -m http.server` polos, sisa sesi lama)
dimatikan atas permintaan Porscy. Yang dipakai sekarang **hanya**:

```bash
cd ~/My_Business/AI-agent/kantor && python3 server.py 8789
# http://127.0.0.1:8789/kantor/
```

Catatan: alamat `8787` di bagian 5b berkas ini sudah tidak berlaku.

---

## Live-reload lokal + status bot auditor (12 September 2026)

### Kenapa dulu tidak ada live-reload

`server.py` cuma peladen berkas statis — tidak ada yang mengawasi berkas,
tidak ada websocket. Dan `?v=` yang dinaikkan tiap deploy itu **untuk CDN
Vercel**, bukan untuk mengedit di lokal; keduanya sering tertukar.

Sekarang `GET /api/versi` mengembalikan cap waktu berkas terbaru di
`kantor/`, dan halaman membandingkannya tiap 1,5 detik. Begitu berubah,
`location.reload()`.

Sengaja tanpa websocket dan tanpa pustaka: satu bilangan, satu
perbandingan. Dijaga dua lapis supaya tidak pernah jalan di Vercel —
nama host harus localhost, dan endpointnya memang tidak ada di sana.

**Mengedit `kantor/*.js` atau `*.html` sekarang langsung terlihat tanpa
refresh.** `?v=` tetap perlu dinaikkan untuk deploy, tidak untuk lokal.

### Status bot anggaran SEO di atas kepala auditor

Bot Porscy jalan di **Termux pada HP** (`~/wa-anggaran-bot`), kantor jalan
di PC. Supaya auditor di panggung tahu botnya hidup, botnya harus
mengabari:

```
HP (Termux) --POST /detak--> penerima-auditor.py --> kantor/auditor.json
                                                          |
                                   kantor.js membacanya, lalu menempelkan
                                   label (online) di atas kepala auditor
```

Basi setelah **2 menit** — kalau botnya mati atau HP kehilangan sinyal,
labelnya hilang sendiri.

### KENAPA PELADEN TERPISAH, BUKAN server.py

Ini bagian yang tidak boleh dilanggar. `server.py` menyajikan **seluruh
folder AI-agent** — termasuk `.kunci-kantor`, `.kunci-kirim`, dan `.env`
milik porsblast. Mengikatnya ke `0.0.0.0` supaya HP bisa menjangkaunya
sama dengan membagikan semua itu ke seisi jaringan kantor.

Jadi:

| | ikatan | menyajikan |
|---|---|---|
| `server.py` | **127.0.0.1 saja** | seluruh folder |
| `penerima-auditor.py` | `0.0.0.0:8790` | **tidak ada** — satu jalur POST, wajib kunci |

Peringatan itu ditulis langsung di `server.py` di baris pengikatannya.

### Menjalankan

```bash
cd ~/My_Business/AI-agent/kantor
python3 server.py 8789            # kantor, localhost saja
python3 penerima-auditor.py 8790  # penerima detak, menghadap jaringan
```

Dari HP (Termux), detak dikirim tiap 30 detik. Kuncinya di
`kantor/.kunci-auditor` (chmod 600), IP PC saat ini `192.168.38.168`.

**Catatan: IP itu DHCP (`dynamic` di `ip addr`), jadi bisa berubah.**
Kalau detaknya tiba-tiba berhenti sampai, periksa IP-nya dulu sebelum
mencurigai yang lain.

### Terverifikasi

```
GET  /api/versi            -> {"v": 1789195080.024}
GET  :8790/halo            -> {"ok": true}
POST :8790/detak tanpa kunci -> 401
POST :8790/detak + kunci     -> 200, auditor.json ikut berubah
halaman membaca auditor.json -> {"online": true, ...}
Vercel auditor.json          -> {"online": false} (statis, memang begitu)
```

---

## Auditor tersambung ke bot anggaran SEO (12 September 2026) — JALAN

Wanita auditor di panggung sekarang memakai label hijau `online` di atas
kepalanya selama bot anggaran SEO di HP Porscy hidup.

### Jalurnya — lewat KABEL, bukan jaringan

```
Termux (HP) --POST 127.0.0.1:8790--> [adb reverse / USB] -->
  penerima-auditor.py (PC, 127.0.0.1) --> kantor/auditor.json -->
    kantor.js --> label (online)
```

Rancangan awal memakai jaringan kantor (`0.0.0.0:8790` + IP DHCP PC).
**Dibatalkan begitu ketahuan HP-nya tersambung USB ADB.** `adb reverse
tcp:8790 tcp:8790` membuat `localhost:8790` di HP tembus ke
`localhost:8790` di PC, jadi:

- tidak ada port yang menghadap jaringan kantor,
- tidak ada IP DHCP yang bisa berubah,
- wifi yang mengisolasi antar-perangkat tidak jadi urusan.

`penerima-auditor.py` sekarang mengikat `127.0.0.1` secara bawaan.
`--jaringan` ada sebagai jalan mundur, jangan dipakai tanpa alasan.

### KENAPA BUKAN server.py

`server.py` menyajikan **seluruh folder AI-agent** — `.kunci-kantor`,
`.kunci-kirim`, `.env` porsblast. Mengikatnya keluar localhost sama
dengan membagikan semua itu. Penerima detak karena itu peladen terpisah
yang tidak menyajikan berkas apa pun: satu jalur POST, wajib kunci.

### Tiga jebakan yang benar-benar kena

**1. `pgrep -f wa-anggaran-bot` tidak pernah kena.** Botnya jalan sebagai
`node src/index.js` — nama foldernya tidak muncul di baris perintah.
Ditemukan dari PC dengan `adb shell ps -A -o PID,ARGS`. Sekarang skripnya
menelusuri tiap proses `node` dan membaca `/proc/<pid>/cwd`; itu menunjuk
ke `~/wa-anggaran-bot` apa pun nama skripnya.

**2. Paste multi-baris di Termux merusak tanda kutip.** Blok perintah
yang dikirim lewat chat berubah jadi satu baris dengan kutip ganda
berlipat, dan gagal total. Jalan keluarnya: `adb push` skripnya ke HP,
lalu Porscy cukup MENGETIK satu baris pendek. Jangan kirim blok
multi-baris ke Termux lagi.

**3. `curl` polos menyembunyikan galat.** Uji pertama tampak "berhasil"
padahal tidak menjawab apa-apa. Pakai `curl -sS` supaya galatnya terlihat.

### Menjalankan

```bash
# PC
cd ~/My_Business/AI-agent/kantor
python3 penerima-auditor.py 8790     # localhost saja
adb reverse tcp:8790 tcp:8790        # HILANG tiap kabel dicabut

# HP (Termux), ketik — jangan paste
sh /data/local/tmp/detak-auditor.sh
```

Titik `.` = detak terkirim · `_` = bot tidak terdeteksi · `x` = gagal kirim.

### Terverifikasi

```
3 detak berbeda dalam 80 detik, umur tidak pernah lewat 30s
ambang basi 120s -> label mati sendiri kalau bot/HP berhenti
POST tanpa kunci -> 401
ss -ltn :8790    -> 127.0.0.1 saja, tidak menghadap jaringan
```

Di Vercel labelnya tidak akan pernah menyala — `auditor.json` di sana
statis. Aturan yang sama dengan kehadiran agen: halaman statis tidak
punya cara mengetahui keadaan komputer maupun HP Porscy.

---

## Kantor jadi bisa dikendalikan — kursi kosong + tombol tugas (12 Sep 2026)

Porscy: *"aku ingin kantor ini serasa seperti game dimana semuanya bisa
aku kendalikan dari localhost, seolah localhost-nya adalah root."*

### Aturan baru: tidak ada yang duduk kalau tidak bekerja

Berlaku untuk **semua penghuni kecuali LordPors** (dia memang penunggu
jendela, bukan pekerja):

| penghuni | hadir kalau |
|---|---|
| Agent 1 | `agen1.json` aktif |
| Agent 2 | `agen2.json` aktif |
| Auditor | bot anggaran SEO online **atau** audit sedang berjalan |

Auditor dulu selalu tergambar. Sekarang mejanya memakai kursi kosong,
sama seperti meja agen. Kursinya **tidak dihilangkan** — meja tanpa kursi
terbaca seperti meja yang dibongkar, bukan meja yang sedang kosong.

Syarat "atau audit sedang berjalan" itu penting: menekan tombol + di
kursinya menyalakan audit, dan dia harus muncul mengerjakannya. Kalau
tidak, menekan tombol terasa tidak menghasilkan apa-apa.

### Tombol + di tiap kursi kosong

Lima stasiun: Agent 1, Agent 2, Auditor, Blaster, Meta.

Tombolnya **didaftarkan oleh kode yang menggambar kursinya**, tiap
bingkai, lewat `daftarTombol()`. Sengaja begitu: kalau letak tombol
didaftarkan terpisah dari letak kursi, keduanya pasti melenceng suatu
saat ketika salah satunya digeser.

Radius sentuh 11 satuan seni, dua kali radius gambarnya (5,2) — di ponsel
tombol selebar 11px mustahil ditekan tepat, dan meleset sedikit tidak
boleh berarti tidak terjadi apa-apa.

### Yang benar-benar berjalan hari ini

| kursi | tugas |
|---|---|
| Agent 1 / Agent 2 | Tandai mulai bekerja (dengan keterangan) · Tandai selesai |
| Auditor | Jalankan audit daftar contoh |
| Blaster | *(belum tersambung — telegram-blaster masih tanpa .env)* |
| Meta | *(belum tersambung — nomor WA belum disiapkan)* |

Yang belum tersambung **tidak disamarkan jadi tombol biasa**. Kalau
ditekan ia menjelaskan apa yang kurang, bukan pura-pura bekerja.

### DAFTAR PUTIH — jangan dilanggar

`TUGAS` di `server.py` adalah daftar putih, dan harus tetap begitu.
Halaman kantor **tidak pernah mengirim perintah** — ia cuma menyebut
KUNCI tugas. Argumennya tetap, kecuali satu teks bebas yang dikirim
sebagai satu elemen `argv` (tanpa shell, jadi tidak ada yang bisa
disisipkan).

**Menambah tombol di `tugas.js` saja tidak akan menjalankan apa pun.**
Tugasnya harus ditulis lebih dulu di `TUGAS`. Itu disengaja.

Jangan pernah menambahkan tugas yang menerima perintah dari luar.

### Dibuka dari Vercel

Tombolnya tetap tergambar dan menunya tetap terbuka, tapi mengatakan
terang-terangan bahwa halaman statis tidak punya jalan ke komputer siapa
pun. Sama seperti kehadiran agen dan label auditor.

### Terverifikasi

```
POST /api/tugas {"tugas":"rm-semuanya"}        -> 400 "tugas tidak dikenal"
POST /api/tugas {"tugas":"agen2-mulai",...}    -> 200, agen2.json aktif:true
POST /api/tugas {"tugas":"agen2-selesai"}      -> 200, agen2.json aktif:false
POST /api/tugas {"tugas":"audit-contoh"}       -> 200, dijalankan di belakang
  t+12s status.json keadaan='memeriksa' dynastyrealestate.id
  t+16s status.json keadaan='selesai'   2 dari 4 layak dihubungi
```

Audit sungguhan berjalan dari satu klik, dan adegannya ikut berpindah ke
mode nyata. Rantai lengkapnya terbukti.

### Harness uji ketinggalan (lagi)

`uji.mjs` gagal di semua lebar dengan `kanvas.addEventListener is not a
function` — stub kanvasnya belum punya `addEventListener` dan
`getBoundingClientRect`. Sudah ditambal. Ini kedua kalinya pola yang
sama: **gagal serentak di semua ukuran = curigai harness lebih dulu.**

---

## Auditor bisa log out & login + branding PorsLabs dilepas (12 Sep 2026)

### Branding — kantor ini BUKAN PorsLabs

Porscy: kantor ini bisnis yang berbeda. Di berkas kantor sendiri tidak
ada penyebutan PorsLabs sama sekali — tapi ada di modul audit, dan satu
di antaranya yang paling penting:

```
UA = "PorsLabsAudit/1.0 (+https://porslabs.com/; ...)"
```

**Itu dikirim ke setiap situs yang diperiksa.** Tiap calon klien melihat
"PorsLabs" di log server mereka. Sekarang `LordPorsAudit/1.0`.

**BELUM LENGKAP:** alamat kontak di User-Agent sengaja dikosongkan karena
bisnis ini belum punya domain sendiri. Prinsip di bagian 5 berkas ini —
*"User-Agent menyebut identitas dan alamat yang bisa dihubungi"* — belum
terpenuhi sampai domainnya ada. Isi begitu ada; jangan dibiarkan lama.

`porslabs.com` juga dibuang dari `audit/daftar-contoh.txt`. Komentar di
`auditor.py:126` yang menyebutnya sebagai kasus uji dinetralkan jadi
"satu situs" — temuannya tetap benar, namanya saja yang dilepas.

### Log out / login auditor

Klik **sosoknya** saat duduk -> menu berisi `Log out`.
Klik **tombol +** saat kursinya kosong -> menu berisi `Login — pindai QR`.

Tombol untuk sosok yang sedang duduk sengaja **tidak digambar** (jenis
`'sosok'`, bukan `'tambah'`): menggambar + di atas kepala orang yang
sedang bekerja terbaca seperti ajakan menambah orang kedua di kursi yang
sama.

### Kenapa log out butuh DUA langkah

Menulis `auditor.json` saja tidak cukup — detak berikutnya dari HP akan
menghidupkannya lagi dalam 30 detik. Jadi log out juga menulis
`auditor-jeda.json`, dan `penerima-auditor.py` memeriksanya tiap detak
masuk: detak tetap **diterima** (menolaknya akan membuat skrip di HP
terlihat rusak padahal benar), tapi tidak menghidupkan kehadirannya.

Terbukti: selama 60 detik sesudah log out, cap waktu `auditor.json` terus
menyegar tiap 30 detik — detaknya memang masuk — tapi `online` tetap
`false`. Login menghapus berkas jeda, dan auditornya kembali duduk 24
detik kemudian, di detak berikutnya.

### QR — batas yang tidak boleh dikaburkan

**Kantor TIDAK bisa membuat QR WhatsApp.** QR itu tantangan dari server
WhatsApp untuk sesi bot; ia cuma bisa lahir di dalam bot itu sendiri.
Menggambar QR karangan di panel login akan jadi kebohongan yang kelihatan
meyakinkan — justru jenis yang paling buruk.

Yang dibangun: jalur penerimanya.

```
bot (Termux) --POST /qr {gambar: dataURL}--> penerima-auditor.py
   --> kantor/qr-auditor.json --> GET /api/qr --> panel login
```

QR dianggap basi setelah 2 menit (QR WhatsApp memang berumur pendek).
Kalau 45 detik tidak ada yang masuk, panelnya berkata terus terang bahwa
botnya belum pernah mengirim, bukan berputar selamanya.

Sampai Porscy menambahkan pengiriman QR di `wa-anggaran-bot`, tombol
Login tetap berfungsi untuk melepas jeda — yang belum ada cuma gambarnya.

### Terverifikasi

```
POST auditor-logout -> auditor.json online:false, auditor-jeda.json ada
  60 detik berikutnya: detak masuk terus, online tetap false
POST auditor-login  -> berkas jeda hilang, online:true lagi dalam 24s
GET  /api/qr        -> {"ada": false}  (bot belum pernah mengirim)
```

---

## Jantungnya dipindah ke PC (12 September 2026)

Porscy: *"aku ingin jantungnya bukan di HP tapi di kantor lokal ini,
karena kalau HP-nya mati atau WhatsApp-nya terblokir, data auditnya tetap
tersimpan dan tinggal ganti WhatsApp untuk melanjutkan."*

Dia benar, dan rancangan sebelumnya memang salah tempat.

### Kenapa rancangan lama rapuh

Bot di Termux, kantor cuma mengintip dari luar lewat skrip detak. Semua
yang berharga — sesi WhatsApp (`auth/`) dan seluruh data (`data/ledger.json`)
— ada di HP. HP hilang, HP direset, atau nomornya diblokir: datanya ikut.

### Kenapa bisa dipindah

Botnya memakai **@whiskeysockets/baileys 6.7.22**. Baileys itu klien
WhatsApp Web — ia berjalan di mesin mana pun. Yang harus ada di HP cuma
aplikasi WhatsApp untuk **memindai QR sekali**, persis seperti WhatsApp
Web di peramban. Sesudah tertaut, HP tidak lagi jadi jantungnya.

Jadi jawaban "QR cuma bisa dari HP" itu keliru. QR-nya lahir di mana pun
Baileys dijalankan — sekarang di PC.

### Yang sudah disiapkan

Bot disalin ke `~/My_Business/AI-agent/wa-anggaran-bot/` (aturan lama:
jangan menyentuh `~/projects/`). Tiga perubahan di `src/index.js`:

| baris | perubahan |
|---|---|
| `if (qr)` | QR mentahnya dikirim ke kantor, selain tetap dicetak ke terminal |
| `connection === "open"` | kabari kantor: auditor ONLINE |
| `connection === "close"` | kabari kantor: auditor OFFLINE |

**Kehadiran sekarang berarti "WhatsApp benar-benar tersambung"**, bukan
lagi "prosesnya hidup" seperti tebakan skrip detak dari luar. Ini
menjawab keraguan Porscy soal akurasi: bot yang sambungannya putus tidak
lagi terlihat duduk bekerja.

### QR digambar Python, bukan npm

**npm tidak terpasang di PC ini** (node v24 ada, npm tidak). Jadi botnya
mengirim **teks mentah** QR-nya, dan `penerima-auditor.py` yang
menggambarnya jadi PNG memakai pustaka `qrcode` Python yang memang sudah
ada. Nol pustaka baru di sisi bot.

Terverifikasi: `POST /qr {"teks": "..."}` -> 200 `{"digambar": true}`,
lalu `GET /api/qr` mengembalikan data URL PNG 894 byte.

### YANG BELUM — dan cuma Porscy yang bisa

`auth/` dan `data/` **belum ada di salinan PC**. Keduanya masih di HP,
dan `data/ledger.json` itu justru yang ingin diselamatkan.

```bash
# 1. HP (Termux) — hentikan botnya dulu, jangan dua-duanya jalan
cd ~/wa-anggaran-bot
mkdir -p /sdcard/Download/wa-pindah
cp -r data auth /sdcard/Download/wa-pindah/

# 2. PC
cd ~/My_Business/AI-agent/wa-anggaran-bot
adb pull /sdcard/Download/wa-pindah/data .
adb pull /sdcard/Download/wa-pindah/auth .

# 3. PC — jalankan
node src/index.js
```

**Bawa `auth/` = sesi WhatsApp ikut pindah, tidak perlu pindai ulang.**
Tinggalkan `auth/` = mulai bersih, QR muncul di kantor untuk dipindai.
`data/` WAJIB dibawa apa pun pilihannya — itu isinya.

**JANGAN menjalankan keduanya bersamaan** dengan sesi yang sama: dua
Baileys pada satu akun akan saling membalas pesan yang sama.

### Yang jadi tidak perlu lagi sesudah pindah

- `detak-auditor.sh` di HP — bot sendiri yang mengabari sekarang
- `adb reverse tcp:8790` — bot dan penerima sama-sama di PC, cukup localhost
- ketergantungan pada kabel USB sama sekali

Berkasnya tidak dihapus; kalau suatu saat botnya kembali ke HP, jalurnya
masih utuh.

---

## Cadangan otomatis ke GitHub (12 September 2026)

### Arahnya SATU JALUR — koreksi atas rencana awal

Porscy sempat mengusulkan: cadangkan ke GitHub, lalu **lokal mengambil
dari GitHub**. Arah itu dibalik, dan sengaja:

```
komputer  ->  GitHub        BENAR   (GitHub = salinan keselamatan)
GitHub    ->  komputer      SALAH   (kecuali sekali, saat memulihkan)
```

Bot menulis `data/ledger.json` terus-menerus. Kalau GitHub jadi sumber
kebenarannya, tiap tarikan akan bentrok dengan tulisan yang sedang
berjalan, dan yang hilang justru catatan terbaru.

GitHub itu **cadangan**, bukan sumber. Menariknya balik cuma dilakukan
satu kali: waktu memulihkan di komputer baru.

### .gitignore DAFTAR IZIN, bukan daftar larang

Folder ini berisi **11 berkas rahasia**: `.env` gateway porsblast, token
Blob Vercel, tiga kunci kantor — dan nanti `auth/` berisi kredensial sesi
WhatsApp. Satu `git add .` yang ceroboh menerbitkan semuanya, dan riwayat
git tidak melupakan.

Maka aturannya dibalik: **semua ditolak lebih dulu** (`*`), lalu yang
benar-benar ingin dicadangkan diizinkan satu per satu. Berkas baru yang
belum dipikirkan otomatis tidak ikut — itu arah kesalahan yang aman.

Hasilnya **39 berkas**: kantor, kantor-deploy, audit, bot anggaran, dan
PROGRES.md. Nol rahasia.

Dua keteledoran yang sempat kena dan sudah dibenahi:

1. `!.gitignore` tanpa garis miring mencocokkan `.gitignore` di **semua**
   folder, jadi milik porsblast dan telegram-blaster ikut terbawa —
   dan `.gitignore` bersarang miliknya sempat menarik masuk berkas lain.
   Sekarang `!/.gitignore`, akar saja.
2. `porsblast/`, `porsblast-next/`, `porsblast-scraper/`,
   `telegram-blaster/` dikecualikan seluruhnya. Semuanya sudah punya repo
   GitHub sendiri (lihat remote di `~/projects/`); mencadangkannya lagi
   cuma menggandakan.

### Penjaga kedua di `cadangan.sh`

`.gitignore` sudah cukup, tapi satu baris `!` yang salah ketik cukup
untuk membocorkan kunci. Jadi diperiksa **lagi** tepat sebelum mengirim:
kalau ada berkas yang cocok dengan `.env` / `.kunci-` / `auth/` /
`creds*.json` yang ter-stage, pengiriman dibatalkan dan stage dikosongkan.

```bash
./cadangan.sh --lihat    # tampilkan apa yang AKAN ikut, tanpa mengirim
./cadangan.sh            # cadangkan sekarang
```

### Jadwalnya

`~/.config/systemd/user/cadangan-kantor.{service,timer}` — tiap jam,
plus 3 menit sesudah komputer menyala. `Persistent=true`, jadi cadangan
yang terlewat (PC mati semalaman) dikerjakan begitu menyala lagi, bukan
dilewatkan diam-diam.

Sudah aktif dan sudah jalan sekali: `Result=success`.

### YANG BELUM — kredensial GitHub kedaluwarsa

```
git ls-remote https://github.com/macanterbang/porsblast.git  ->  gagal
```

Penyimpannya `credential.helper=store`, tapi tokennya sudah tidak
berlaku. Sampai dibereskan, cadangan tetap **tersimpan sebagai commit
lokal** — aman dari salah hapus, belum aman dari PC rusak.

Yang harus Porscy kerjakan:

1. Buat repo **PRIVAT** di github.com (misal `lordpors-kantor`).
   Privat, bukan publik — ini data bisnis.
2. Buat Personal Access Token baru (Settings -> Developer settings ->
   Tokens), beri akses `repo`.
3. Di PC:

```bash
cd ~/My_Business/AI-agent
git remote add origin https://macanterbang@github.com/macanterbang/lordpors-kantor.git
./cadangan.sh          # akan menanyakan token sekali, lalu diingat
```

`gh` tidak terpasang di PC ini, jadi reponya dibuat lewat web.

### Rencana jangka panjang yang disebut Porscy

Dashboard utama `lordpors`, dengan `/kantor` dan `/rumah` di bawahnya.
Belum dikerjakan — Porscy ingin memaksimalkan kantor dulu.

Catatan untuk nanti: kantor sekarang duduk di **akar** proyek Vercel
(`kantor-lordpors`). Memindahkannya ke `/kantor` murah selama dilakukan
sebelum ada yang menyimpan tautan dalam — jalur relatif di `kantor.js`
(`agenN.json`, `auditor.json`) akan ikut pindah dengan sendirinya, tapi
`/api/*` di `server.py` dan `penerima-auditor.py` memakai jalur mutlak
dan harus disesuaikan.

---

## RALAT: akun GitHub-nya `lordpors`, bukan `macanterbang` (12 Sep 2026)

Instruksi remote di bagian sebelumnya **salah**. Ia disimpulkan dari
remote proyek lama di `~/projects/` yang memakai `macanterbang`. Porscy
menunjukkan akun yang sebenarnya dipakai:

```
github.com/lordpors      2 repo:
  telegram-blaster-clean   (publik)
  telegram_blaster         (privat)
```

Perintah yang benar:

```bash
cd ~/My_Business/AI-agent
git remote add origin https://github.com/lordpors/lordpors-kantor.git
./cadangan.sh
```

Reponya harus dibuat **privat** dulu lewat github.com — `gh` tidak
terpasang di PC ini. Pelajarannya: jangan menyimpulkan akun dari remote
proyek lain; satu orang bisa punya beberapa akun, dan mendorong ke akun
yang salah berarti data bisnis mendarat di tempat yang tidak diniatkan.

---

## Kantor pindah ke /kantor (12 September 2026)

Dilakukan sekarang, sebelum ada yang menyimpan tautan dalam — sesuai
catatan sebelumnya bahwa menunda cuma menambah tautan yang perlu diurus.

### Struktur baru di Vercel

```
/                 halaman penunjuk arah lordpors  (baru)
/kantor/          kantornya
/api/pesan        tetap di akar — itu ketentuan Vercel
```

Berkas kantor dipindah ke `kantor-deploy/kantor/`. `api/` **tidak boleh**
ikut pindah: Vercel hanya mengenali fungsi serverless di `api/` pada akar
proyek.

### Kenapa tidak ada yang rusak

Seluruh jalur di `kantor.js` ternyata **relatif** — `agen1.json`,
`auditor.json`, `../audit/status.json`. Jadi semuanya ikut pindah dengan
sendirinya begitu halamannya turun satu tingkat. Yang mutlak cuma
`/api/tugas`, `/api/qr`, dan `/api/versi`, dan ketiganya hanya dilayani
`server.py` di komputer — tidak tersentuh pemindahan ini.

Di lokal alamatnya **tidak berubah sama sekali**: `server.py` memang
sudah menyajikan dari akar `AI-agent`, jadi kantornya sejak awal ada di
`http://127.0.0.1:8789/kantor/`. Sekarang Vercel dan lokal seragam.

### Halaman akar

Sengaja hampir kosong: cuma nama, pintu ke `/kantor/`, dan `/rumah`
yang ditandai **belum dibangun**. Pintu yang belum ada tidak dibuat
sebagai tautan — tautan yang diklik lalu tidak ke mana-mana lebih
menjengkelkan daripada pintu yang jujur mengaku belum ada.

Mengisinya dengan angka-angka hiasan sekarang akan membuat kantor di
baliknya terlihat seperti mainan, dan bagian yang sungguhan jadi ikut
diragukan. Diisi nanti, saat dashboard-nya benar-benar dirancang.

### Terverifikasi

```
/                    200   menunjuk ke /kantor/
/kantor/             200   noindex masih terpasang
/kantor/kantor.js    200
/kantor/log.js       200
/kantor/tugas.js     200
/kantor/agen1.json   200
/kantor/auditor.json 200
/robots.txt          200
lokal /kantor/       200
```

---

## Cadangan GitHub JALAN (12 September 2026)

```
repo    github.com/lordpors/lordpors   PRIVAT
cabang  main
berkas  40
rahasia yang ikut  0
```

### Kenapa dorongan pertama gagal

`Repository not found` — untuk repo **privat** GitHub sengaja menjawab
begitu kepada yang tidak terautentikasi, supaya keberadaan repo privat
tidak bocor. Jadi pesannya menyesatkan: masalahnya autentikasi, bukan
repo yang hilang.

Dibuktikan dengan menjangkau repo **publik** milik akun yang sama
(`telegram-blaster-clean`) tanpa login — berhasil. Artinya nama akunnya
benar, yang kurang kredensialnya.

### Jebakan tiga akun

`~/.git-credentials` ternyata berisi entri untuk **`macanterbang`** dan
**`porslabsofficial`** — dua akun GitHub lain milik Porscy. Tidak ada
entri `lordpors`.

Akibatnya remote **wajib menyebut nama pengguna**:

```
https://lordpors@github.com/lordpors/lordpors.git     benar
https://github.com/lordpors/lordpors.git              berisiko
```

Tanpa nama pengguna di URL, `credential-store` mencocokkan hanya pada
host — dan bisa memilih kredensial `macanterbang` yang sudah kedaluwarsa
untuk mendorong ke repo `lordpors`. Kalau suatu saat dorongan tiba-tiba
gagal padahal token baru saja dibuat, periksa ini lebih dulu.

### Cabang diseragamkan

`git init -b utama` menghasilkan cabang `utama`; GitHub memakai `main`.
Diubah ke `main` sebelum dorongan pertama, jadi tidak ada cabang yatim.

### KEAMANAN — token ada di riwayat percakapan

Porscy menempelkan PAT-nya langsung di chat supaya bisa didorong dari
sini. Tokennya berhasil dipakai dan tersimpan di `~/.git-credentials`
(izin 600), tapi **teksnya kini ada di riwayat percakapan**.

Token `ghp_` dengan scope `repo` memberi akses baca-tulis ke SELURUH repo
akun itu — bukan cuma repo ini. Kalau riwayat percakapan bisa terlihat
orang lain (tangkapan layar, perangkat bersama), token itu harus dicabut
dan diganti.

Cara mengganti tanpa menempelkannya lagi ke mana pun:

```bash
# 1. Cabut yang lama di github.com -> Settings -> Developer settings
# 2. Buat token baru, lalu di terminal BIASA (bukan lewat chat):
sed -i '/lordpors:/d' ~/.git-credentials
cd ~/My_Business/AI-agent && git push        # akan menanyakan token sekali
```

### Terverifikasi

```
git ls-tree origin/main        40 berkas, 0 rahasia
API repos/lordpors/lordpors    private: True
./cadangan.sh                  "tidak ada perubahan" (putaran sehat)
systemd timer                  tiap jam, Result=success
```

---

## Bot anggaran PINDAH KE PC — jantungnya sudah di sini (12 Sep 2026)

```
data/    3 berkas   ledger.json 3101 byte, 12 entri, nextId 13
auth/   55 berkas   sesi WhatsApp ikut pindah — tidak perlu pindai ulang
bot      tersambung sebagai 855768640910:22@s.whatsapp.net
```

### Cara memindahkannya

Termux itu app-private; `adb` tidak bisa membacanya (`Permission denied`),
dan menyuruh Termux menyalin lewat intent juga ditolak
(`Requires permission com.termux.permission.RUN_COMMAND`).

Jadi caranya: `kantor/pindah-ledger.sh` dikirim ke HP lewat `adb push`,
Porscy mengetik satu baris untuk menjalankannya, skripnya menyalin ke
`/sdcard/Download/wa-pindah`, lalu ditarik `adb pull`.

Skripnya **menyalin, bukan memindahkan** — yang di HP sengaja dibiarkan
utuh sampai yang di PC terbukti jalan.

Langkah pertamanya menghentikan bot lebih dulu. Baileys menulis `auth/`
terus-menerus; menyalin sambil ditulis bisa menghasilkan sesi separuh
jadi, dan sesi rusak berarti harus pindai QR ulang.

### LEDGER HAMPIR TIDAK IKUT TERCADANGKAN

Ketahuan saat memeriksa sesudah menarik: `wa-anggaran-bot/.gitignore`
punya baris `data/ledger.json`, dan **.gitignore bersarang menang atas
yang di akar**. Jadi berkas yang paling ingin diselamatkan justru satu-
satunya yang dikecualikan.

Untuk repo kode bot itu benar — data hidup memang tidak layak masuk repo
kode. Untuk cadangan ini terbalik.

Perbaikannya di `cadangan.sh`: `git add -f` pada **satu berkas, disebut
namanya**.

```bash
[ -f wa-anggaran-bot/data/ledger.json ] && git add -f wa-anggaran-bot/data/ledger.json
```

**Jangan pernah `git add -f` ke seluruh `data/`.** Di situ ada
`webhook.txt` berisi URL Google Apps Script — siapa pun yang memegangnya
bisa menulis ke Sheets Porscy. Itu tetap dikecualikan, dan `auth/` juga.

Terverifikasi di GitHub: ledger ada (12 entri), `webhook.txt` nol,
`auth/` nol.

`webhook.txt` tidak tercadangkan **dengan sengaja**. Kalau PC rusak, URL
itu harus disalin ulang dari tempat lain atau Apps Script-nya dideploy
ulang. Simpan URL-nya di pengelola kata sandi, bukan di repo.

### Galat dekripsi saat pertama menyala — normal

6 baris `Failed to decrypt message` / `MessageCounterError` muncul di
awal. Itu pesan lama yang kunci ratchet-nya sudah terpakai instance di
HP. Tidak merusak apa pun; pesan baru terdekripsi normal.

### Kehadiran auditor sekarang datang DARI DALAM bot

```
{"online": true, "pesan": "WhatsApp tersambung"}
```

Ditulis bot itu sendiri saat `connection === "open"`, bukan lagi tebakan
skrip detak di HP yang cuma tahu "prosesnya hidup". Ini menjawab
pertanyaan Porscy soal akurasi: bot yang sambungannya putus tidak lagi
terlihat duduk bekerja.

### Layanan yang kini menetap

```
wa-anggaran-bot.service     bot, Restart=on-failure
penerima-auditor.service    penerima kabar & QR
cadangan-kantor.timer       cadangan GitHub tiap jam
```

Ketiganya `systemctl --user`. **Belum tahan logout** — `Linger=no`.
Supaya hidup terus walau Porscy logout dari PC:

```bash
sudo loginctl enable-linger porscy
```

### Yang sekarang tidak dipakai lagi

`kantor/detak-auditor.sh`, `kantor/penjaga2.py`, dan `adb reverse`.
Berkasnya tidak dihapus — kalau suatu saat ada yang perlu mengabari
kantor dari HP lagi, jalurnya masih utuh.

**JANGAN menyalakan bot di HP lagi.** Dua Baileys pada satu sesi akan
saling membalas pesan yang sama.

---

## Meja Agen 3 (12 September 2026)

```
{ x: 228, y: 138, w: 40, nama: "Porscy's Agent 3", isi: false, agen: 3 }
```

Melanjutkan barisan tengah dengan jarak yang sama: 116..156, 172..212,
228..268. Diperiksa bersih terhadap lampu meja, meja auditor, meja Meta,
permadani, dan LordPors.

### Rujukan indeks dihapus — ini yang penting

Sebelumnya kepemilikan meja dicari dengan `m === MEJA_SEMUA[1]` dan
`[2]`, tersebar di **tujuh tempat**. Meja Agen 3 disisipkan di tengah
array, dan rujukan indeks seperti itu akan salah **diam-diam** — tidak
ada galat, cuma agen yang duduk di meja yang keliru.

Sekarang tiap meja agen membawa penandanya sendiri (`agen: N`), dan
keadaannya dicari lewat `AGEN[n]`. Menambah Agen 4 berarti:

1. satu baris di `MEJA_SEMUA` dengan `agen: 4`
2. satu `var agen4` + masukkan ke array `AGEN`
3. `gambarAgen4()` mengikuti pola `gambarAgen3()`
4. panggil di `bingkai()`
5. salin `agen3.py` jadi `agen4.py`, ubah `NOMOR`
6. dua baris di `TUGAS` (server.py) + satu blok di `DAFTAR` (tugas.js)

Tidak ada lagi indeks yang perlu dihitung ulang.

### Rupa Agen 3

| | Agen 1 | Agen 2 | Agen 3 |
|---|---|---|---|
| warna | amber | ungu | **mawar** |
| tanda | pita mendatar | celah tegak | **cincin** |
| denyut | 620 | 840 | **1080** |
| tembus | .84 | .72 | **.78** |

Mawar dipilih karena satu-satunya keluarga warna yang belum dipakai
siapa pun — amber, ungu, cyan, biru, dan merah sudah terpakai. Dua
penghuni berwarna mirip akan tertukar sekali lihat, apalagi di ponsel.

Cincin dipilih karena **arah garis sudah habis**: mendatar dan tegak
sudah dipakai. Yang tersisa bentuk tertutup. Digambar sebagai empat sisi
kotak berlubang, bukan `ctx.arc` — pada kepala selebar 8 satuan,
lingkaran sungguhan mendarat jadi gumpalan tak berbentuk.

Tiga denyut berbeda supaya kalau bertiga duduk bersamaan, ruangan terasa
berisi tiga makhluk, bukan satu mesin bercabang tiga.

Balonnya naik satu tingkat untuk tiap agen yang sudah bicara di
sebelahnya, jadi tiga balon tidak saling menutupi.

### Terverifikasi

```
agen3.py mulai/selesai            -> agen3.json berubah
POST /api/tugas agen3-mulai       -> 200 "Agent 3: BEKERJA"
POST /api/tugas agen3-selesai     -> 200 "Agent 3: meninggalkan meja"
papan nama                        -> "Porscy's Agent 3" / "Agent 3" di ponsel
```

---

## Posisi auditor diturunkan dari mejanya (12 September 2026)

Bug yang sama terjadi **dua kali**, dan penyebabnya sama persis:
`AUDITOR` ditulis sebagai angka tetap, lalu mejanya digeser dan
konstantanya tertinggal.

```
kejadian 1  meja dipersempit 82 -> 46   auditor tertinggal di kiri
kejadian 2  ruangan dipusatkan 284 -> 293   auditor tertinggal 14 satuan
```

Agen 1-3 tidak pernah kena, karena posisinya memang **diturunkan** dari
mejanya: `x = m.x + m.w/2 - 7`. Auditor satu-satunya yang ditulis tetap.

Sekarang dia mengikuti pola yang sama:

```js
var MEJA_AUDITOR = (cari meja dengan isi === 'auditor');
var AUDITOR = {
  x: MEJA_AUDITOR.x + MEJA_AUDITOR.w / 2 - 5,   // badan 8 satuan, pusat x+5
  y: MEJA_AUDITOR.y - 16                        // kepala & bahu di atas meja
};
```

Menggeser mejanya kini cukup mengubah satu angka di `MEJA_SEMUA` —
kursi, monitor, papan ketik, sosok, balon, dan label status menyusul
sendiri.

**Pelajaran yang berlaku untuk seluruh berkas ini:** kalau sebuah angka
bisa dihitung dari angka lain, hitung — jangan tulis hasilnya. Angka
tetap yang bergantung pada angka lain akan tertinggal diam-diam, tanpa
galat, dan baru ketahuan dari tangkapan layar.

### Pemeriksaan menyeluruh sesudahnya

```
meja              pusat   kursi   orang   monitor
dinding monitor    44,0    44,0     -      44,0   OK
Agen 1            124,0   124,0   123,5   124,0   OK
Agen 2            180,0   180,0   179,5   180,0   OK
Agen 3            236,0   236,0   235,5   236,0   OK
auditor           316,0   316,0   316,0   316,0   OK
Blaster            46,0    46,0     -      46,0   OK
Meta              314,0   314,0     -     314,0   OK
```

Selisih 0,5 pada agen tidak terhindarkan: badannya selebar 9 satuan
(ganjil), jadi tidak bisa berpusat tepat di angka bulat.

Angka tetap yang tersisa — permadani, jam, rak, lampu berdiri, tanaman —
semuanya **tidak bergantung pada posisi meja**, jadi aman dibiarkan.

---

## Penyegar latar untuk kehadiran agen (12 September 2026)

### Masalahnya: kehadiran bergantung ingatan

`agenN.py mulai` dulu cuma menulis SATU cap waktu. Ambang basi 5 menit,
jadi dua hal buruk sekaligus:

- pekerjaan lebih dari 5 menit -> agennya menghilang di tengah kerja
- lupa memanggil `selesai` -> agennya duduk sampai 5 menit percuma

Keduanya benar-benar terjadi. Yang kedua **berulang kali**: Claude
memanggil `mulai` lalu lupa `selesai`, dan Porscy yang menemukannya dari
layar. Kehadiran yang bergantung pada ingatan bukan kehadiran yang bisa
dipercaya.

### Sekarang

`mulai` menyalakan proses latar yang menyegarkan cap waktunya tiap 60
detik. `selesai` mematikannya. Terukur: umur cap waktu tidak pernah
lewat 10 detik selama penyegar hidup, dan berhenti total begitu
`selesai` dipanggil.

### TIGA PENGAMAN — supaya penyegar tidak jadi masalah baru

1. **Batas umur 20 menit.** Berhenti sendiri apa pun yang terjadi. Lupa
   `selesai` berarti kursinya kosong dalam 25 menit (20 + ambang basi 5),
   bukan selamanya.
2. **Ikut sesi pemanggilnya.** PID sesi Claude dicatat saat `mulai`;
   begitu sesinya mati, penyegarnya ikut berhenti.
3. **Satu penyegar per agen.** `mulai` selalu mematikan yang lama dulu,
   jadi tidak menumpuk.

Ditambah dua rem di dalam putarannya: berhenti kalau berkas PID hilang
(itu yang dilakukan `selesai`), dan berhenti kalau `aktif` sudah `false`
— jadi ada yang menandai selesai dari mana pun, penyegar ikut berhenti.

### Tiga berkas agen jadi pembungkus

Seluruh logika pindah ke `kehadiran.py`; `agen1.py`, `agen2.py`,
`agen3.py` tinggal tiga baris. Sebelumnya ketiganya salinan penuh — dan
perbaikan yang harus disalin tiga kali sudah terbukti mahal di berkas
lain kantor ini.

### Catatan uji

`pgrep -f "kehadiran.py --penyegar 2"` melaporkan proses yang sebenarnya
tidak ada: polanya mencocokkan perintah shell yang sedang menjalankan
pgrep itu sendiri. Sudah dua kali tertipu ini di sesi yang sama. Pakai
`ps -eo pid,cmd | grep ... | grep -v zsh` kalau ingin yakin.
