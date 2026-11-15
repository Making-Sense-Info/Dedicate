#!/usr/bin/env bash
# Thin job runner for Dedicator API: Saxon transform + optional Sparna validate.
# Args: --input --output [--xsl] [--shacl-jar] [--shapes] [--report]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PIPELINE="${ROOT}/ddi-l-to-healthdcat-ap"
LIB_DIR="${PIPELINE}/lib"
SHACL_CACHE_DIR="${LIB_DIR}/shacl-cache"
SAXON_VERSION="12.5"
SAXON_JAR="${LIB_DIR}/saxon-he-${SAXON_VERSION}.jar"
RESOLVER_JAR="${LIB_DIR}/xmlresolver-5.2.2.jar"
RESOLVER_DATA_JAR="${LIB_DIR}/xmlresolver-5.2.2-data.jar"
SAXON_URL="${SAXON_URL:-https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-5/SaxonHE12-5J.zip}"
DEFAULT_XSL="${PIPELINE}/xsl/ddi-lifecycle-to-dcat-ap.xsl"
DEFAULT_SHAPES_URL="https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl"

INPUT=""
OUT=""
XSL="${DEFAULT_XSL}"
SHACL_JAR="${SHACL_JAR:-}"
SHAPES="${SHACL_SHAPES:-${DEFAULT_SHAPES_URL}}"
REPORT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input) INPUT="$2"; shift 2 ;;
    --output) OUT="$2"; shift 2 ;;
    --xsl) XSL="$2"; shift 2 ;;
    --shacl-jar) SHACL_JAR="$2"; shift 2 ;;
    --shapes) SHAPES="$2"; shift 2 ;;
    --report) REPORT="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$INPUT" && -f "$INPUT" ]] || { echo "Missing --input" >&2; exit 2; }
[[ -n "$OUT" ]] || { echo "Missing --output" >&2; exit 2; }
[[ -f "$XSL" ]] || { echo "XSL not found: $XSL" >&2; exit 2; }

ensure_saxon() {
  if [[ -f "$SAXON_JAR" && -f "$RESOLVER_JAR" && -f "$RESOLVER_DATA_JAR" ]]; then
    return 0
  fi
  mkdir -p "$LIB_DIR"
  local tmp
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

resolve_shapes() {
  local src="$1"
  if [[ "$src" =~ ^https?:// ]]; then
    mkdir -p "$SHACL_CACHE_DIR"
    local name dest
    name="$(basename "${src%%\?*}")"
    [[ -n "$name" && "$name" != "/" ]] || name="shapes.ttl"
    dest="${SHACL_CACHE_DIR}/${name}"
    curl -fsSL -A "Dedicator" -o "$dest" "$src"
    printf '%s' "$dest"
  else
    printf '%s' "$src"
  fi
}

command -v java >/dev/null 2>&1 || { echo "java required" >&2; exit 1; }
ensure_saxon

mkdir -p "$(dirname "$OUT")"
CP="${SAXON_JAR}:${RESOLVER_JAR}:${RESOLVER_DATA_JAR}"
java -cp "$CP" net.sf.saxon.Transform -s:"$INPUT" -xsl:"$XSL" -o:"$OUT"
echo "Wrote $OUT"

if [[ -n "$SHACL_JAR" ]]; then
  [[ -f "$SHACL_JAR" ]] || { echo "SHACL jar not found: $SHACL_JAR" >&2; exit 1; }
  [[ -n "$SHAPES" ]] || { echo "Missing --shapes" >&2; exit 1; }
  SHAPES_LOCAL="$(resolve_shapes "$SHAPES")"
  [[ -e "$SHAPES_LOCAL" ]] || { echo "Shapes not found: $SHAPES_LOCAL" >&2; exit 1; }
  if [[ -z "$REPORT" ]]; then
    REPORT="${OUT%.*}-shacl-report.html"
  fi
  report_ttl="${REPORT%.*}.ttl"
  mkdir -p "$(dirname "$REPORT")"
  java -jar "$SHACL_JAR" validate \
    --input "$OUT" \
    --shapes "$SHAPES_LOCAL" \
    --output "$REPORT" \
    --output "$report_ttl"
  echo "Wrote $REPORT"
  echo "Wrote $report_ttl"
fi
