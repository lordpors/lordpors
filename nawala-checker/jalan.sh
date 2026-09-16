#!/usr/bin/env bash
# Jalankan domain rotator di Termux, tetap hidup saat layar mati.
cd "$(dirname "$0")"
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi
command -v termux-wake-lock >/dev/null && termux-wake-lock
exec python3 domain_rotator.py "$@"
