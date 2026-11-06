#!/usr/bin/env bash
# Run DDI Lifecycle → HealthDCAT-AP Turtle (XSLT 3.0 via Saxon-HE).
# Optionally validate the Turtle with Sparna shacl-play when --shacl-jar is set.
#
# Usage:
#   ./run.sh --input <ddi.xml> [--output <out.ttl>] \
#            [--shacl-jar <shacl-play-app-*-onejar.jar>] \
#            [--shapes <shapes.ttl|dir|https://…>] [--report <report.html>]
#
# Backward-compatible positional form:
#   ./run.sh <ddi.xml> [out.ttl]
#
# Env (optional defaults):
#   SHACL_JAR, SHACL_SHAPES, SHACL_REPORT, SAXON_URL, SAXON_CP
#
# Note: Sparna shacl-play only accepts local paths for --shapes. HTTPS URLs are
# downloaded/cached under lib/shacl-cache/ before validation.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
XSL="${SCRIPT_DIR}/xsl/ddi-lifecycle-to-dcat-ap.xsl"
LIB_DIR="${SCRIPT_DIR}/lib"
SHACL_CACHE_DIR="${LIB_DIR}/shacl-cache"
SAXON_VERSION="12.5"
SAXON_JAR="${LIB_DIR}/saxon-he-${SAXON_VERSION}.jar"
RESOLVER_JAR="${LIB_DIR}/xmlresolver-5.2.2.jar"
RESOLVER_DATA_JAR="${LIB_DIR}/xmlresolver-5.2.2-data.jar"
SAXON_URL="${SAXON_URL:-https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-5/SaxonHE12-5J.zip}"
# Default: R8 non-public shapes. Full catalogue:
# https://data.health.europa.eu/healthdcat-ap/releases/release-8/#validation-of-healthdcat-ap
DEFAULT_SHAPES_URL="https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl"

INPUT=""
OUT=""
SHACL_JAR="${SHACL_JAR:-}"
SHAPES="${SHACL_SHAPES:-}"
REPORT="${SHACL_REPORT:-}"

usage() {
  cat >&2 <<EOF
Usage:
  ./run.sh --input <ddi.xml> [--output <out.ttl>] \\
           [--shacl-jar <shacl-play-app-*-onejar.jar>] \\
           [--shapes <shapes.ttl|dir|https://…>] [--report <report.html>]

  ./run.sh <ddi.xml> [out.ttl]

When --shacl-jar (or SHACL_JAR) is set, validation runs after Turtle generation.
--shapes (or SHACL_SHAPES) is then required (local path or https URL).
Default report: <output-stem>-shacl-report.html

Default shapes (R8 non-public):
  ${DEFAULT_SHAPES_URL}
All profiles: https://data.health.europa.eu/healthdcat-ap/releases/release-8/#validation-of-healthdcat-ap
EOF
}

# Resolve --shapes: local path as-is; https://… → cached file under lib/shacl-cache/
resolve_shapes() {
  local src="$1"
  if [[ "$src" =~ ^https?:// ]]; then
    if ! command -v curl >/dev/null 2>&1; then
      echo "curl is required to download SHACL shapes from URL." >&2
      exit 1
    fi
    mkdir -p "$SHACL_CACHE_DIR"
    local name
    name="$(basename "${src%%\?*}")"
    [[ -n "$name" && "$name" != "/" ]] || name="shapes.ttl"
    local dest="${SHACL_CACHE_DIR}/${name}"
    echo "Downloading SHACL shapes → ${dest}" >&2
    if ! curl -fsSL -A "Dedicate-run.sh" -o "$dest" "$src"; then
      echo "Failed to download SHACL shapes from: $src" >&2
      rm -f "$dest"
      exit 1
    fi
    printf '%s' "$dest"
  else
    printf '%s' "$src"
  fi
}

# Named args, or positional input [output]
while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--input)
      INPUT="${2:-}"; shift 2 ;;
    -o|--output)
      OUT="${2:-}"; shift 2 ;;
    --shacl-jar)
      SHACL_JAR="${2:-}"; shift 2 ;;
    -s|--shapes)
      SHAPES="${2:-}"; shift 2 ;;
    -r|--report)
      REPORT="${2:-}"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    --)
      shift; break ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      exit 1 ;;
    *)
      if [[ -z "$INPUT" ]]; then
        INPUT="$1"
      elif [[ -z "$OUT" ]]; then
        OUT="$1"
      else
        echo "Unexpected argument: $1" >&2
        usage
        exit 1
      fi
      shift ;;
  esac
done

if [[ -z "$INPUT" ]]; then
  usage
  exit 1
fi

OUT="${OUT:-${SCRIPT_DIR}/out/dcat-ap.ttl}"

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

CP="${SAXON_CP:-${SAXON_JAR}:${RESOLVER_JAR}:${RESOLVER_DATA_JAR}}"

mkdir -p "$(dirname "$OUT")"
java -cp "$CP" net.sf.saxon.Transform -s:"$INPUT" -xsl:"$XSL" -o:"$OUT"
echo "Wrote $OUT"

if [[ -n "$SHACL_JAR" ]]; then
  if [[ ! -f "$SHACL_JAR" ]]; then
    echo "SHACL jar not found: $SHACL_JAR" >&2
    exit 1
  fi
  if [[ -z "$SHAPES" ]]; then
    echo "Validation requested but --shapes / SHACL_SHAPES is missing." >&2
    echo "Tip: use the R8 non-public URL, e.g. --shapes ${DEFAULT_SHAPES_URL}" >&2
    exit 1
  fi
  SHAPES_LOCAL="$(resolve_shapes "$SHAPES")"
  if [[ ! -e "$SHAPES_LOCAL" ]]; then
    echo "SHACL shapes not found: $SHAPES_LOCAL" >&2
    exit 1
  fi

  if [[ -z "$REPORT" ]]; then
    stem="${OUT%.*}"
    REPORT="${stem}-shacl-report.html"
  fi
  report_ttl="${REPORT%.*}.ttl"
  mkdir -p "$(dirname "$REPORT")"

  echo "Validating with $(basename "$SHACL_JAR")…" >&2
  java -jar "$SHACL_JAR" validate \
    --input "$OUT" \
    --shapes "$SHAPES_LOCAL" \
    --output "$REPORT" \
    --output "$report_ttl"
  echo "Wrote $REPORT"
  echo "Wrote $report_ttl"
fi
