#!/data/data/com.termux/files/usr/bin/sh
# Pengirim detak bot anggaran SEO -> kantor LordPors di PC.
#
# Dikirim ke HP lewat `adb push` supaya tidak perlu di-paste: paste
# multi-baris di Termux merusak tanda kutipnya, dan itu sudah terbukti.
#
# Jalur: Termux -> 127.0.0.1:8790 (dijembatani `adb reverse` lewat USB)
#        -> penerima-auditor.py di PC -> kantor/auditor.json
#        -> label (online) di atas kepala wanita auditor.
#
# Jalankan di Termux:   sh /data/local/tmp/detak-auditor.sh
# Berhenti:             Ctrl+C

KUNCI="kKEXGCMhez5eCMnfIukF4d3bb39Up4qA"
ALAMAT="http://127.0.0.1:8790"
POLA="wa-anggaran-bot"
JEDA=30

echo "--- 1. jembatan ADB ---"
if curl -sS -m 5 "$ALAMAT/halo"; then
  echo ""
else
  echo ""
  echo "  TIDAK TEMBUS. Di PC jalankan:  adb reverse tcp:8790 tcp:8790"
  echo "  (jembatan ini hilang tiap kabel dicabut)"
  exit 1
fi

# Botnya jalan sebagai `node src/index.js` — nama foldernya TIDAK muncul
# di baris perintah, jadi mencocokkan "wa-anggaran-bot" tidak pernah kena.
# Yang dicocokkan sekarang FOLDER KERJA prosesnya lewat /proc/<pid>/cwd:
# itu menunjuk ke ~/wa-anggaran-bot, apa pun nama skrip yang dijalankan.
# Dua cadangan di bawahnya untuk jaga-jaga kalau /proc tidak terbaca.
bot_hidup() {
  for pid in $(pgrep node 2>/dev/null); do
    dir=$(readlink "/proc/$pid/cwd" 2>/dev/null)
    case "$dir" in *"$POLA"*) return 0 ;; esac
  done
  pgrep -f "$POLA" >/dev/null 2>&1 && return 0
  pgrep -f "node src/index.js" >/dev/null 2>&1 && return 0
  return 1
}

echo "--- 2. botnya jalan? ---"
if bot_hidup; then
  echo "  ya, ditemukan lewat folder kerjanya"
else
  echo "  TIDAK ditemukan. Detak tetap dikirim sekali untuk menguji,"
  echo "  tapi pengiriman berkalanya akan diam."
fi

echo "--- 3. kirim satu detak ---"
curl -sS -m 5 -X POST "$ALAMAT/detak" \
  -H "Content-Type: application/json" \
  -H "X-Kunci: $KUNCI" \
  -d '{"online":true,"pesan":"bot anggaran SEO"}'
echo ""

echo "--- 4. mulai mengirim tiap ${JEDA}s (Ctrl+C untuk berhenti) ---"
while true; do
  if bot_hidup; then
    curl -s -m 5 -X POST "$ALAMAT/detak" \
      -H "Content-Type: application/json" \
      -H "X-Kunci: $KUNCI" \
      -d '{"online":true,"pesan":"bot anggaran SEO"}' >/dev/null 2>&1 \
      && printf "." || printf "x"
  else
    printf "_"
  fi
  sleep "$JEDA"
done
