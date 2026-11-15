#!/usr/bin/env bash
# Local API on :8080 (Saxon + Sparna via invoke.sh).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="$ROOT/dedicator/api"
VENV="$ROOT/dedicator/.venv"

DEFAULT_SHACL_JAR="$ROOT/dedicator/jars/shacl-play-app-0.12.5-onejar.jar"
if [[ -z "${SHACL_JAR:-}" && -f "$DEFAULT_SHACL_JAR" ]]; then
  export SHACL_JAR="$DEFAULT_SHACL_JAR"
  echo "Using default SHACL_JAR=$SHACL_JAR" >&2
elif [[ -z "${SHACL_JAR:-}" ]]; then
  echo "Warning: SHACL_JAR is unset — transform will work, Sparna validation will be skipped." >&2
  echo "  Download Sparna onejar into dedicator/jars/ or:" >&2
  echo "  export SHACL_JAR=/path/to/shacl-play-app-0.12.5-onejar.jar" >&2
elif [[ ! -f "$SHACL_JAR" ]]; then
  echo "Warning: SHACL_JAR is set but file missing: $SHACL_JAR" >&2
fi

if [[ ! -d "$VENV" ]]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -r "$API/requirements.txt"
fi

export DEDICATOR_CORS="${DEDICATOR_CORS:-*}"
cd "$API"
exec "$VENV/bin/uvicorn" main:app --reload --host 127.0.0.1 --port 8080
