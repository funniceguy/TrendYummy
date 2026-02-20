#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-trendyummy}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BASE_URL="${BASE_URL:-http://127.0.0.1}"
BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}"
RECHECK_DELAY_SEC="${RECHECK_DELAY_SEC:-8}"
LOCK_FILE="${LOCK_FILE:-/tmp/${APP_NAME}-health-monitor.lock}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

exec 9>"${LOCK_FILE}"
if command -v flock >/dev/null 2>&1; then
  if ! flock -n 9; then
    log "Health monitor is already running."
    exit 0
  fi
fi

run_health_check() {
  "${APP_DIR}/scripts/health-check.sh" "${BASE_URL}" "${BASE_PATH}"
}

restart_app() {
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart "${APP_NAME}" --update-env
    pm2 save >/dev/null 2>&1 || true
    return
  fi

  pkill -f "next start" || true
  nohup npm run start > "${APP_DIR}/server.log" 2>&1 &
}

if run_health_check >/dev/null 2>&1; then
  log "Health check passed."
  exit 0
fi

log "Health check failed. Restarting ${APP_NAME}..."
restart_app
sleep "${RECHECK_DELAY_SEC}"

if run_health_check >/dev/null 2>&1; then
  log "Recovered after restart."
  exit 0
fi

log "Still unhealthy after restart. Manual inspection required."
exit 1
