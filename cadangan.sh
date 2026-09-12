#!/usr/bin/env bash
# ============================================================
#  Cadangan otomatis ke GitHub.
#
#  ARAHNYA SATU JALUR: komputer -> GitHub. Jangan pernah dibalik
#  jadi menarik dari GitHub sebagai sumber. Bot menulis
#  data/ledger.json terus-menerus; kalau GitHub jadi sumbernya,
#  tiap tarikan akan bentrok dengan tulisan yang sedang berjalan.
#
#  GitHub itu SALINAN KESELAMATAN, bukan sumber kebenaran.
#  Menariknya balik cuma dilakukan sekali: saat memulihkan di
#  komputer baru.
#
#      ./cadangan.sh           cadangkan sekarang
#      ./cadangan.sh --lihat   tampilkan apa yang AKAN ikut, tanpa mengirim
# ============================================================
set -uo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$AKAR" || exit 1

if [ ! -d .git ]; then
  echo "  belum ada repo git di $AKAR — jalankan dulu: git init"
  exit 1
fi

# ------------------------------------------------------------
# PENJAGA. .gitignore sudah menolak semuanya secara bawaan, tapi
# satu baris "!" yang salah ketik cukup untuk membocorkan kunci,
# dan riwayat git tidak melupakan. Jadi diperiksa lagi di sini,
# tepat sebelum mengirim.
# ------------------------------------------------------------
BERBAHAYA='(^|/)(\.env|\.kunci-|auth/|.*creds.*\.json$)'

git add -A

if git diff --cached --name-only | grep -qE "$BERBAHAYA"; then
  echo "  BATAL — ada berkas rahasia yang ikut ter-stage:"
  git diff --cached --name-only | grep -E "$BERBAHAYA" | sed 's/^/    /'
  echo "  Periksa .gitignore. Tidak ada yang dikirim."
  git reset -q
  exit 1
fi

if [ "${1:-}" = "--lihat" ]; then
  echo "  yang akan ikut tercadangkan:"
  git diff --cached --name-only | sed 's/^/    /'
  echo "  total: $(git diff --cached --name-only | wc -l) berkas"
  git reset -q
  exit 0
fi

if git diff --cached --quiet; then
  echo "  tidak ada perubahan — tidak ada yang perlu dicadangkan."
  exit 0
fi

JUMLAH=$(git diff --cached --name-only | wc -l)
git commit -q -m "cadangan otomatis $(date '+%Y-%m-%d %H:%M') — $JUMLAH berkas"
echo "  disimpan lokal: $JUMLAH berkas"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "  belum ada remote 'origin' — commit-nya aman di lokal,"
  echo "  tapi belum sampai ke GitHub."
  exit 0
fi

CABANG=$(git rev-parse --abbrev-ref HEAD)
if git push -q origin "$CABANG" 2>/dev/null; then
  echo "  terdorong ke GitHub ($CABANG)"
else
  echo "  GAGAL mendorong ke GitHub. Commit-nya tetap aman di lokal;"
  echo "  jalankan lagi sesudah kredensialnya dibereskan."
  exit 1
fi
