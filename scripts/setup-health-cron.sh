#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apps/trendyummy}"
APP_NAME="${APP_NAME:-trendyummy}"
BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/trendyummy}"
BASE_URL="${BASE_URL:-http://127.0.0.1}"
LOG_FILE="${LOG_FILE:-/home/ubuntu/trendyummy-health.log}"
CRON_SCHEDULE="${CRON_SCHEDULE:-*/5 * * * *}"

CRON_LINE="${CRON_SCHEDULE} cd ${APP_DIR} && NEXT_PUBLIC_BASE_PATH=${BASE_PATH} APP_NAME=${APP_NAME} BASE_URL=${BASE_URL} ./scripts/health-monitor.sh >> ${LOG_FILE} 2>&1"

(crontab -l 2>/dev/null | grep -Fv './scripts/health-monitor.sh'; echo "${CRON_LINE}") | crontab -

echo "Registered cron line:"
echo "${CRON_LINE}"
echo
echo "Current crontab:"
crontab -l
