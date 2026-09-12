#!/data/data/com.termux/files/usr/bin/sh
# ============================================================
#  Pindahkan data bot anggaran dari HP ke PC.
#
#  Dijalankan DI TERMUX. Dikirim lewat adb push supaya tidak
#  perlu di-paste -- paste multi-baris di Termux merusak tanda
#  kutipnya, dan itu sudah terbukti sekali.
#
#  Yang dipindahkan:
#    data/   -> ledger.json, seluruh catatan anggaran. WAJIB.
#    auth/   -> sesi WhatsApp. Ikut = tidak perlu pindai QR lagi.
#
#  Skrip ini MENYALIN, tidak memindahkan. Yang di HP tetap utuh
#  sampai Porscy sendiri yakin yang di PC sudah benar jalan.
#
#  Jalankan:  sh /data/local/tmp/pindah-ledger.sh
# ============================================================

BOT="$HOME/wa-anggaran-bot"
TUJUAN="/sdcard/Download/wa-pindah"

echo "--- 1. bot harus berhenti dulu ---"
# auth/ ditulis Baileys terus-menerus. Menyalinnya sambil bot menulis
# bisa menghasilkan sesi yang separuh jadi -- dan sesi rusak berarti
# harus pindai ulang. data/ juga lebih aman disalin saat diam.
if pgrep -f "node src" >/dev/null 2>&1; then
  echo "  bot masih jalan, dihentikan…"
  pkill -f "node src"
  sleep 2
  if pgrep -f "node src" >/dev/null 2>&1; then
    echo "  GAGAL menghentikan. Hentikan sendiri (Ctrl+C di jendela botnya),"
    echo "  lalu jalankan skrip ini lagi."
    exit 1
  fi
  echo "  berhenti."
else
  echo "  sudah tidak jalan."
fi

echo "--- 2. izin penyimpanan ---"
if [ ! -d /sdcard ] || ! mkdir -p "$TUJUAN" 2>/dev/null; then
  echo "  Termux belum boleh menulis ke penyimpanan bersama."
  echo "  Jalankan dulu:   termux-setup-storage"
  echo "  (akan muncul permintaan izin -- pilih Izinkan)"
  echo "  Lalu jalankan skrip ini lagi."
  exit 1
fi
echo "  bisa menulis ke $TUJUAN"

echo "--- 3. salin ---"
ADA=0
for d in data auth; do
  if [ -d "$BOT/$d" ]; then
    rm -rf "$TUJUAN/$d"
    cp -r "$BOT/$d" "$TUJUAN/" && echo "  $d/  tersalin ($(ls -1 "$BOT/$d" | wc -l) berkas)"
    ADA=$((ADA + 1))
  else
    echo "  $d/  TIDAK ADA di $BOT"
  fi
done

if [ "$ADA" = "0" ]; then
  echo "  Tidak ada yang bisa disalin. Periksa lagi isi $BOT."
  exit 1
fi

echo "--- 4. isi ledger ---"
if [ -f "$TUJUAN/data/ledger.json" ]; then
  echo "  ukuran: $(wc -c < "$TUJUAN/data/ledger.json") byte"
else
  echo "  ledger.json tidak ditemukan — periksa apakah botnya memang sudah"
  echo "  pernah mencatat sesuatu."
fi

echo ""
echo "  SELESAI. Bilang ke Claude, nanti dia yang menarik ke PC."
echo "  Yang di HP sengaja TIDAK dihapus."
