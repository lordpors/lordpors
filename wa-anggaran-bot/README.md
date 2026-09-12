# Bot anggaran grup WhatsApp

Pencatat pemasukan/pengeluaran di **satu grup**. Bukan blaster.

## Risiko

Ini WhatsApp **tidak resmi** (Baileys / seperti WhatsApp Web). Melanggar ToS. Nomor bisa dibanned. Pakai **nomor baru**, jangan nomor PorsBlast, jangan nomor pribadi/bank.

Bisa di **Termux HP** supaya PC tidak perlu nyala. HP jangan di-sleep agresif: baterai Termux **Tidak dibatasi**, `termux-wake-lock`, jalan di `tmux`.

Jangan campur nomor PorsBlast.

## Jalanin di Termux (HP)

```bash
pkg update -y
pkg install nodejs tmux
termux-setup-storage
rm -rf ~/wa-anggaran-bot
mkdir -p ~/wa-anggaran-bot
tar -xzf /sdcard/Download/wa-anggaran-bot.tgz -C ~/wa-anggaran-bot --strip-components=1
cd ~/wa-anggaran-bot
npm install
termux-wake-lock
tmux new -s anggaran
npm start
```

Detach tmux: **Ctrl+B**, lalu **D**. Balik: `tmux attach -t anggaran`.

Scan QR di HP **nomor bot**. Masukkan nomor itu ke grup anggaran. Di grup ketik:

```
!bot
```

## Perintah

```
+50000 gaji           pemasukan
-12000 bensin         pengeluaran
masuk 50000 gaji
keluar 12000 bensin
saldo
hapus terakhir
hapus idr
bantuan
```

Angka `6.55` / `6,59` = USD. Pakai `$` untuk dolar, `Rp` / `50rb` / `1.000` untuk IDR.

Data: `data/ledger.json`. Session: `auth/`. Sheet: tab **Cost SEO** saja, tanpa Rekap.
