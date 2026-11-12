# DDI-L to HealthDCAT-AP

Produce [HealthDCAT-AP](https://healthdataeu.pages.code.europa.eu/healthdcat-ap/) (and DCAT-AP / CSVW variables) metadata from DDI Lifecycle 3.3 XML.

The curated mapping is in [`ddi-lifecycle-dcat-ap-mapping.ttl`](../ddi-lifecycle-dcat-ap-mapping.ttl) and [`model-mapping.md`](../model-mapping.md). The XSLT below is a first executable interpretation of that mapping (it does not load the TTL at runtime).

## Prerequisite

**Java 11 or newer** on the PATH (`java -version`).

That’s the only install required for the transform. Saxon-HE (XSLT 3.0 engine) is fetched automatically the first time you run the script (needs network once).

For optional SHACL validation, also download a Sparna [shacl-play onejar](https://github.com/sparna-git/shacl-play/releases).

### macOS

```bash
brew install openjdk@26
# ensure `java` is on your PATH, then:
java -version
```

Or install a JRE from [Adoptium](https://adoptium.net/).

### Windows

Install a JDK/JRE 11+ (e.g. [Temurin](https://adoptium.net/)), open a new PowerShell, and check:

```powershell
java -version
```

## Run and validate

From this directory (`ddi-l-to-healthdcat-ap`), with the following arguments:

| Argument | Env default | Role |
| --- | --- | --- |
| `--input` / `-InputPath` | — | DDI Lifecycle 3.3 XML (required) |
| `--output` / `-OutputPath` | `out/dcat-ap.ttl` | Turtle output |
| `--shacl-jar` / `-ShaclJar` | `SHACL_JAR` | If set, run Sparna `validate` after the transform |
| `--shapes` / `-Shapes` | `SHACL_SHAPES` | Required when validating: local file/dir or `https://...` URL |
| `--report` / `-Report` | `SHACL_REPORT` or `<output-stem>-shacl-report.html` | HTML report (+ sibling `.ttl`) |

Sparna `validate` only accepts local paths for `--shapes`. If you pass an `https://` URL, `run.sh` / `run.ps1` download it into `lib/shacl-cache/` then pass the cached file.

All HealthDCAT-AP Release 8 SHACL shapes (public / restricted / non-public, ranges, vocabularies, recommended,...) are listed under [Validation of HealthDCAT-AP](https://data.health.europa.eu/healthdcat-ap/releases/release-8/#validation-of-healthdcat-ap).

By default we use the non-public profile, for another access level, use an other shape filefrom that page.

Default non-public shapes URL:

`https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl`

### macOS / Linux

```bash
chmod +x run.sh   # once

# Transform only
./run.sh --input in/ddil-example.xml --output out/ddil-example.ttl

# Transform + SHACL (jar provided -> validation at the end, shapes via HTTPS)
./run.sh --input in/ddil-example.xml --output out/ddil-example.ttl \
  --shacl-jar /path/to/shacl-play-app-0.12.5-onejar.jar \
  --shapes https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl \
  --report out/ddil-example-shacl-report.html
```

### Windows (PowerShell)

```powershell
# Transform only
.\run.ps1 -InputPath "in\ddil-example.xml" -OutputPath "out\ddil-example.ttl"

# Transform + SHACL (shapes via HTTPS)
.\run.ps1 -InputPath "in\ddil-example.xml" -OutputPath "out\ddil-example.ttl" `
  -ShaclJar "C:\path\shacl-play-app-0.12.5-onejar.jar" `
  -Shapes "https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl" `
  -Report "out\ddil-example-shacl-report.html"
```

### Validation only

Same shapes catalogue: [Validation of HealthDCAT-AP](https://data.health.europa.eu/healthdcat-ap/releases/release-8/#validation-of-healthdcat-ap).

You can use the [SHACL Play web UI](https://shacl-play.sparna.fr/play/validate).

Or the following command:

```bash
java -jar shacl-play-app-0.12.5-onejar.jar validate \
  --input path/to/output.ttl \
  --shapes path/to/shapes.ttl \
  --output validation-report.html \
  --output validation-report.ttl
```

## Sample input

[`in/ddil-example.xml`](./in/ddil-example.xml) is a compact DDI Lifecycle 3.3 instance built from the public [HDH synthetic SNDS](https://www.data.gouv.fr/datasets/donnees-synthetiques-de-la-base-principales-du-systeme-national-des-donnees-de-sante) on data.gouv.fr (Licence Ouverte 2.0, 50 fictional patients). Variable names match the published CSV headers, the DDI itself is hand-authored for Dedicate demos (not an official HDH product).

It mirrors a multi-domain layout (one StudyUnit / Dataset per domain, several PhysicalInstances / tables under each):

- Group `snds-synth-hdh` with 3 StudyUnits: `BEN`, `DCIR`, `DECES`
- 5 PhysicalInstances: `IR_BEN_R`, `IR_IBA_R`, `ER_PHA_F`, `ER_BIO_F`, `KI_ECD_R`
- 5 LogicalProducts (one per PI) / 5 LogicalRecords -> still **one TableGroup per StudyUnit** with N Tables
- StudyUnit Citation/Coverage filled with catalogue-style DCAT fields (`Creator`/`Publisher`/`Contributor`, `dcterms:*`, Subject/Keyword, spatial, temporal)
- 24 variables (shared where the same column name appears on several tables)
- 2 code lists (`BEN_SEX_COD`, Yes/No for `PHA_DEC_TOP`)

## What you get

- One `dcat:Dataset` per StudyUnit, one `dcat:Distribution` per linked PhysicalInstance
- StudyUnit `Citation` / `Coverage` -> Dataset properties (`title`, `description`, `creator`, `publisher`, `contactPoint`, `language`, `identifier`, `source`, `conformsTo`, `accessRights`, `accrualPeriodicity`, `modified`, `keyword`, `theme`, `spatial`, `temporal`)
- StudyUnit `UserAttributePair` (Priority B): reference input uses `AttributeKey@fr` / `@en` when multilingual, plain key when unique (no `xml:lang` on `AttributeValue`). XSL emits `dcatap:applicableLegislation` (Dataset + Distribution IRIs) and `healthdcatap:healthCategory` (IRI). See [UAP language contract](../model-mapping.md#studyunit-userattributepair-language-contract). Other UAP keys stay parked.
- `healthdcatap:hasVariables` -> one CSVW `TableGroup` per Dataset, with one `csvw:Table` per LogicalRecord of the StudyUnit’s PhysicalInstances
- Columns follow R8 SHACL `CSVWColumnShape` (name / title / description / datatype literals). See the [CSVW conformance note](../model-mapping.md#conformance-note-shacl-vs-prose-vs-w3c-csvw) in `model-mapping.md`
- `healthdcatap:hasCodingSystem` / `hasCodeValues` from CodeLists referenced by the Dataset’s variables (`dct:Standard` + code-value Literals)
- Missing DDI fields are omitted (no hard failure)
- Optional SHACL HTML + Turtle reports when `--shacl-jar` is set

## Layout

```text
ddi-l-to-healthdcat-ap/
  README.md
  run.sh / run.ps1
  xsl/ddi-lifecycle-to-dcat-ap.xsl   # XSLT 3.0
  in/ddil-example.xml                # sample DDI (HDH synthetic SNDS subset)
  out/                               # generated Turtle (+ optional SHACL reports)
  lib/                               # Saxon jars (auto-downloaded, gitignored)
```
