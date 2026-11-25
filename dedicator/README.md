# Dedicator

Web UI + API to run the Dedicate DDI → HealthDCAT-AP pipeline (**Saxon-HE** + **Sparna shacl-play**), then inspect Conformité (if validated), Turtle, hierarchy, graph-table, and bubbles.

```
DDI XML (+ optional XSL / shapes)
        │
        ▼
  Dedicator API
        │
        ├─ macOS / Linux → invoke.sh
        └─ Windows       → invoke.ps1
                │
                ▼
           Java: Saxon (+ Sparna if SHACL_JAR is set)
        │
        ▼
  React UI (Conformité · Turtle · Hierarchy · Graph-table · Bubbles)
```

The `.sh` helpers are for **macOS / Linux**. On **Windows**, use the `.ps1` scripts (PowerShell).

## Prerequisites

| Tool | Role |
| --- | --- |
| **Java 11+** | Saxon + Sparna jars |
| **Python 3.11+** | Dedicator API (FastAPI) |
| **Node 22+** and **Yarn** | Vite UI |
| **Sparna shacl-play onejar** (optional) | SHACL validation ([releases](https://github.com/sparna-git/shacl-play/releases)) |

Without `SHACL_JAR`, transform still works; Sparna validation is skipped.

Download example (any OS):

```text
https://github.com/sparna-git/shacl-play/releases/download/0.12.5/shacl-play-app-0.12.5-onejar.jar
```

## Local run — macOS / Linux

From the **repository root**, one terminal:

```bash
# Sparna jar (required for validation). Either:
#   mkdir -p dedicator/jars && curl -fsSL -L -o dedicator/jars/shacl-play-app-0.12.5-onejar.jar \
#     https://github.com/sparna-git/shacl-play/releases/download/0.12.5/shacl-play-app-0.12.5-onejar.jar
# or set an explicit path:
#   export SHACL_JAR="$HOME/Downloads/shacl-play-app-0.12.5-onejar.jar"
# If `dedicator/jars/shacl-play-app-0.12.5-onejar.jar` exists, `dev-api` / `dev.sh` pick it up automatically.

chmod +x dedicator/scripts/*.sh dedicator/api/invoke.sh

# API :8080 then UI :5173 once /api/health is OK (Ctrl+C stops both)
./dedicator/scripts/dev.sh
```

If the UI step says `node: No such file or directory`, load nvm first then re-run `dev.sh`:

```bash
source ~/.nvm/nvm.sh
./dedicator/scripts/dev.sh
```

To run API or UI alone: `./dedicator/scripts/dev-api.sh` / `./dedicator/scripts/dev-web.sh`.

Open http://127.0.0.1:5173. UI is EN/FR (browser locale by default, preference stored in `localStorage`). Layout is responsive (phone/tablet: scrollable tabs, stacked forms, graph-table single-column). Tabs are URL routes (`/`, `/conformity`, `/turtle`, `/hierarchy`, `/graph-table`, `/bubbles`) so the browser back/forward buttons work. On **Home**, set DDI (file or URL) and SHACL shapes from the HealthDCAT-AP R8 spec (`public-shapes.ttl` / `restricted-shapes.ttl` / `non-public-shapes.ttl`, or Other URL/file), then **Transform**. The repository XSLT is used automatically. After a successful run, each result screen shows the DDI / SHACL sources used. Views:

- **Conformité** — Sparna SHACL report (only if validation was enabled)
- **Turtle** — raw HealthDCAT-AP TTL
- **Hierarchy** — tree rooted on `dcat:Dataset`
- **Graph-table** — resource tables linked by edges
- **Bubbles** — Dataset bubbles first; single-click inspects, double-click expands / collapses links; border colours for Dataset / Distribution / Table / Variable (`csvw:Column`)

CLI-only pipeline (no UI), same jars:

```bash
./ddi-l-to-healthdcat-ap/run.sh \
  --input ddi-l-to-healthdcat-ap/in/ddil-example.xml \
  --output ddi-l-to-healthdcat-ap/out/ddil-example.ttl \
  --shacl-jar "$SHACL_JAR" \
  --shapes https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl
```

## Local run — Windows (PowerShell)

From the **repository root**, one PowerShell window:

```powershell
# Point to your Sparna jar (required for validation)
$env:SHACL_JAR = "$env:USERPROFILE\Downloads\shacl-play-app-0.12.5-onejar.jar"

# API :8080 then UI :5173 once /api/health is OK (Ctrl+C stops both)
.\dedicator\scripts\dev.ps1
```

If scripts are blocked:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

To run API or UI alone: `.\dedicator\scripts\dev-api.ps1` / `.\dedicator\scripts\dev-web.ps1`.

Open http://127.0.0.1:5173 as above.

CLI-only pipeline (no UI):

```powershell
.\ddi-l-to-healthdcat-ap\run.ps1 `
  -InputPath "ddi-l-to-healthdcat-ap\in\ddil-example.xml" `
  -OutputPath "ddi-l-to-healthdcat-ap\out\ddil-example.ttl" `
  -ShaclJar $env:SHACL_JAR `
  -Shapes "https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl"
```

## Script map

| Role | macOS / Linux | Windows |
| --- | --- | --- |
| Start API + UI | `dedicator/scripts/dev.sh` | `dedicator/scripts/dev.ps1` |
| Start API only | `dedicator/scripts/dev-api.sh` | `dedicator/scripts/dev-api.ps1` |
| Start UI only | `dedicator/scripts/dev-web.sh` | `dedicator/scripts/dev-web.ps1` |
| Job runner (used by API) | `dedicator/api/invoke.sh` | `dedicator/api/invoke.ps1` |
| CLI pipeline | `ddi-l-to-healthdcat-ap/run.sh` | `ddi-l-to-healthdcat-ap/run.ps1` |

## API

| Method | Path | Role |
| --- | --- | --- |
| `GET` | `/api/health` | Java / XSL / Sparna readiness (+ `invokeScript`) |
| `POST` | `/api/run` | multipart: `ddi` **or** `ddi_url`, optional `xsl` / `xsl_url`, `shapes` / `shapes_url`, `run_validation` |

Default XSL: `ddi-l-to-healthdcat-ap/xsl/ddi-lifecycle-to-dcat-ap.xsl`.  
Default shapes: HealthDCAT-AP R8 non-public shapes URL (same as `run.sh` / `run.ps1`).
