#!/usr/bin/env bash
set -euo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUNCI="${1:-}"

if [ ! -r "$KUNCI" ]; then
  echo "pakai: bash migration/restore.sh /lokasi/AI-agent-migration-key-2026-09-16.txt"
  exit 1
fi
if [ "$AKAR" != "$HOME/My_Business/AI-agent" ]; then
  echo "clone repo harus berada di $HOME/My_Business/AI-agent"
  exit 1
fi

cd "$AKAR/migration"
sha256sum -c SHA256SUMS
printf 'Pemulihan akan menimpa sesi/config lama di PC ini. Ketik PULIHKAN: '
read -r SETUJU
[ "$SETUJU" = PULIHKAN ] || exit 1

cat ai-agent-private-2026-09-16.gpg.part-* \
  | gpg --batch --yes --pinentry-mode loopback --passphrase-file "$KUNCI" --decrypt \
  | zstd -q -d \
  | tar -xf - -C "$HOME"

chmod 600 "$AKAR"/kantor/.kunci-* "$AKAR/telegram-blaster/.env" 2>/dev/null || true

command -v npm >/dev/null && (cd "$AKAR/wa-anggaran-bot" && npm ci --omit=dev)
python3 -m pip install --user -r "$AKAR/nawala-checker/requirements.txt"

mkdir -p "$HOME/.config/systemd/user"
cp "$AKAR"/migration/systemd/* "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now penerima-auditor.service wa-anggaran-bot.service \
  nawala-checker.service cadangan-kantor.timer

echo "selesai — login GitHub/Claude/Codex ulang hanya jika token lama sudah kedaluwarsa."
