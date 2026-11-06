#!/usr/bin/env bash
# Run DDI Lifecycle → DCAT-AP Turtle transform (XSLT 3.0 via Saxon-HE).
# Usage: ./run.sh <ddi-input.xml> [output.ttl]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
XSL="${SCRIPT_DIR}/xsl/ddi-lifecycle-to-dcat-ap.xsl"
LIB_DIR="${SCRIPT_DIR}/lib"
SAXON_VERSION="12.5"
SAXON_JAR="${LIB_DIR}/saxon-he-${SAXON_VERSION}.jar"
RESOLVER_JAR="${LIB_DIR}/xmlresolver-5.2.2.jar"
RESOLVER_DATA_JAR="${LIB_DIR}/xmlresolver-5.2.2-data.jar"
SAXON_URL="${SAXON_URL:-https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-5/SaxonHE12-5J.zip}"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <ddi-input.xml> [output.ttl]" >&2
  exit 1
fi

INPUT="$1"
OUT="${2:-${SCRIPT_DIR}/out/dcat-ap.ttl}"

if [[ ! -f "$INPUT" ]]; then
  echo "Input not found: $INPUT" >&2
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java not found. Install a JRE 11+ to run Saxon-HE." >&2
  exit 1
fi

ensure_saxon() {
  if [[ -f "$SAXON_JAR" && -f "$RESOLVER_JAR" && -f "$RESOLVER_DATA_JAR" ]]; then
    return 0
  fi
  echo "Downloading Saxon HE ${SAXON_VERSION} (+ xmlresolver)…" >&2
  mkdir -p "$LIB_DIR"
  tmp="$(mktemp -d)"
  curl -fsSL -o "$tmp/saxon.zip" "$SAXON_URL"
  unzip -qo "$tmp/saxon.zip" \
    "saxon-he-${SAXON_VERSION}.jar" \
    "lib/xmlresolver-5.2.2.jar" \
    "lib/xmlresolver-5.2.2-data.jar" \
    -d "$tmp"
  mv "$tmp/saxon-he-${SAXON_VERSION}.jar" "$LIB_DIR/"
  mv "$tmp/lib/xmlresolver-5.2.2.jar" "$LIB_DIR/"
  mv "$tmp/lib/xmlresolver-5.2.2-data.jar" "$LIB_DIR/"
  rm -rf "$tmp"
}

ensure_saxon

# Override full classpath if SAXON_CP is set
CP="${SAXON_CP:-${SAXON_JAR}:${RESOLVER_JAR}:${RESOLVER_DATA_JAR}}"

mkdir -p "$(dirname "$OUT")"
java -cp "$CP" net.sf.saxon.Transform -s:"$INPUT" -xsl:"$XSL" -o:"$OUT"
echo "Wrote $OUT"
