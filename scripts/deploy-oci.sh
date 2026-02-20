#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-trendyummy}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BASE_URL="${BASE_URL:-http://127.0.0.1}"
BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}"
PORT="${PORT:-3000}"

normalize_base_path() {
  local value="$1"
  if [[ -z "$value" || "$value" == "/" ]]; then
    echo ""
    return
  fi

  if [[ "$value" != /* ]]; then
    value="/$value"
  fi

  value="${value%/}"
  echo "$value"
}

BASE_PATH="$(normalize_base_path "$BASE_PATH")"

echo "[1/5] Move to app directory: $APP_DIR"
cd "$APP_DIR"

echo "[2/5] Install dependencies"
npm install --no-audit --no-fund

echo "[3/5] Build app"
npm run build

echo "[4/5] Restart app"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
  else
    PORT="$PORT" pm2 start npm --name "$APP_NAME" -- run start
  fi
else
  echo "PM2 not found. Starting with nohup..."
  pkill -f "next start" || true
  nohup npm run start > server.log 2>&1 &
fi

echo "[5/5] Health check"
"$APP_DIR/scripts/health-check.sh" "$BASE_URL" "$BASE_PATH"

echo "Done."
