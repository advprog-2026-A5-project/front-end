#!/usr/bin/env bash
set -euo pipefail

AUTH_BASE_URL="${AUTH_BASE_URL:-http://localhost:8080}"
KEBUN_BASE_URL="${KEBUN_BASE_URL:-http://localhost:8081}"
HASIL_PANEN_BASE_URL="${HASIL_PANEN_BASE_URL:-http://localhost:8082}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@mysawit.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "[1/4] Sign in to Auth: ${AUTH_BASE_URL}/api/auth/signin"
TOKEN=$(curl -sS -X POST "${AUTH_BASE_URL}/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
  | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

if [[ -z "${TOKEN}" ]]; then
  echo "ERROR: failed to get token from signin response"
  exit 1
fi

echo "[2/4] Call protected Auth endpoint: ${AUTH_BASE_URL}/api/users/me"
curl -sS -f "${AUTH_BASE_URL}/api/users/me" -H "Authorization: Bearer ${TOKEN}" >/tmp/mysawit_auth_me.json
cat /tmp/mysawit_auth_me.json

echo "[3/4] Call Kebun endpoint: ${KEBUN_BASE_URL}/kebun"
curl -sS -f "${KEBUN_BASE_URL}/kebun" >/tmp/mysawit_kebun_list.json
cat /tmp/mysawit_kebun_list.json

echo "[4/4] Call Hasil Panen endpoint: ${HASIL_PANEN_BASE_URL}/health"
curl -sS -f "${HASIL_PANEN_BASE_URL}/health" >/tmp/mysawit_hasil_health.json
cat /tmp/mysawit_hasil_health.json

echo "Smoke test passed"
