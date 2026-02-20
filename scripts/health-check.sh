#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1}"
BASE_PATH="${2:-}"

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
ROOT="${BASE_URL}${BASE_PATH}"

check_status() {
  local url="$1"
  local expected="${2:-200}"
  local retries="${3:-6}"
  local delay_sec="${4:-2}"
  local status=""

  for ((i = 1; i <= retries; i++)); do
    status="$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$url" || true)"
    if [[ "$status" == "$expected" ]]; then
      echo "OK   ${url} -> ${status}"
      return 0
    fi

    if [[ "$i" -lt "$retries" ]]; then
      sleep "$delay_sec"
    fi
  done

  echo "FAIL ${url} -> ${status} (expected ${expected})"
  return 1
}

check_json_contains() {
  local url="$1"
  local token="$2"
  local body
  body="$(curl -s --max-time 30 "$url")"
  if [[ "$body" != *"$token"* ]]; then
    echo "FAIL ${url} -> token not found: ${token}"
    return 1
  fi
  echo "OK   ${url} -> contains ${token}"
}

echo "Health check base: ${ROOT}"

check_status "${ROOT}" 200
check_status "${ROOT}/trends" 200
check_status "${ROOT}/api/sessions?pageSize=1" 200
check_status "${ROOT}/api/trends" 200
check_status "${ROOT}/api/youtube" 200
check_status "${ROOT}/api/humor" 200
check_json_contains "${ROOT}/api/trends" "\"success\":true"

echo "All health checks passed."
