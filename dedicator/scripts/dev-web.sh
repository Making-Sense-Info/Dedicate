#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Ensure node is on PATH (nvm / Homebrew) for yarn & vite shebangs
if ! command -v node >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
  elif [[ -x /opt/homebrew/bin/node ]]; then
    export PATH="/opt/homebrew/bin:$PATH"
  elif [[ -x /usr/local/bin/node ]]; then
    export PATH="/usr/local/bin:$PATH"
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node not found. Load nvm (e.g. source ~/.nvm/nvm.sh) or install Node 22+." >&2
  exit 1
fi

cd "$ROOT/dedicator/web"
[[ -d node_modules ]] || yarn install
exec yarn dev
