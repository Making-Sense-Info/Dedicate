#!/usr/bin/env bash
# One-shot local stack: API (:8080) then UI (:5173) once /api/health is OK.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_PID=""

cleanup() {
  if [[ -n "${API_PID}" ]] && kill -0 "${API_PID}" 2>/dev/null; then
    kill "${API_PID}" 2>/dev/null || true
    wait "${API_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting API…"
"${SCRIPT_DIR}/dev-api.sh" &
API_PID=$!

ready=0
for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:8080/api/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    echo "API exited before becoming ready." >&2
    exit 1
  fi
  sleep 0.4
done

if [[ "${ready}" -ne 1 ]]; then
  echo "API did not become ready at http://127.0.0.1:8080/api/health" >&2
  exit 1
fi

echo "API ready — starting UI (Ctrl+C stops both)…"
"${SCRIPT_DIR}/dev-web.sh"
