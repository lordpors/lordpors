# Pindah PC

Kode kantor dan seluruh fiturnya ada langsung di repo ini. Data rahasia,
sesi AI, dan login aplikasi ada di `ai-agent-private-2026-09-16.gpg.part-*`.
Arsip itu dienkripsi; kuncinya hanya disimpan di HP:

`Download/AI-agent-migration-key-2026-09-16.txt`

## Pulihkan di PC baru

Gunakan nama pengguna Linux `porscy` bila ingin riwayat sesi lama paling
mudah dikenali oleh aplikasinya. Lalu:

```bash
mkdir -p ~/My_Business
git clone https://github.com/lordpors/lordpors.git ~/My_Business/AI-agent
cd ~/My_Business/AI-agent
adb pull /sdcard/Download/AI-agent-migration-key-2026-09-16.txt ~/Downloads/
bash migration/restore.sh ~/Downloads/AI-agent-migration-key-2026-09-16.txt
```

Skrip memeriksa checksum, meminta konfirmasi, memulihkan berkas, memasang
dependensi, lalu mengaktifkan layanan auditor, WhatsApp, Nawala, dan backup.

## Isi arsip terenkripsi

- seluruh sesi lokal Claude dan Codex beserta konfigurasi/pluginnya;
- sesi WhatsApp Baileys, ledger, webhook Google Sheet;
- `.env` Telegram Blaster, Porsblast, dan Vercel;
- kunci kantor, status checker, kotak masuk, dan lampiran;
- kredensial CLI Vercel serta Railway.

Arsip sesi lokal dipertahankan apa adanya. Dokumentasi resmi OpenAI tidak
menjanjikan bahwa penyalinan penyimpanan lokal lintas-PC akan selalu membuat
semua percakapan muncul otomatis; berkas mentahnya tetap ada untuk pemulihan.
