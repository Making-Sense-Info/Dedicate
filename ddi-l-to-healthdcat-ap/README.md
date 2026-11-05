# DDI-L to HealthDCAT-AP

Produce [HealthDCAT-AP](https://healthdataeu.pages.code.europa.eu/healthdcat-ap/) (and DCAT-AP / CSVW variables) metadata from DDI Lifecycle 3.3 XML.

The curated mapping is in [`ddi-lifecycle-dcat-ap-mapping.ttl`](../ddi-lifecycle-dcat-ap-mapping.ttl) and [`model-mapping.md`](../model-mapping.md). The XSLT below is a first executable interpretation of that mapping (it does not load the TTL at runtime).

## Prerequisite

**Java 11 or newer** on the PATH (`java -version`).

That’s the only install required. Saxon-HE (XSLT 3.0 engine) is fetched automatically the first time you run the script (needs network once).

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

## Run

From this directory (`ddi-l-to-healthdcat-ap`), pass any DDI Lifecycle 3.3 XML and an optional Turtle output path (default: `out/dcat-ap.ttl`):

### macOS / Linux

```bash
chmod +x run.sh   # once
./run.sh path/to/input.xml [path/to/output.ttl]
```

### Windows (PowerShell)

```powershell
.\run.ps1 -InputPath "path\to\input.xml" [-OutputPath "path\to\output.ttl"]
```

## Sample input

[`in/ddil-example.xml`](./in/ddil-example.xml) is a compact DDI Lifecycle 3.3 instance built from the public [HDH synthetic SNDS](https://www.data.gouv.fr/datasets/donnees-synthetiques-de-la-base-principales-du-systeme-national-des-donnees-de-sante) on data.gouv.fr (Licence Ouverte 2.0, 50 fictional patients). Variable names match the published CSV headers, the DDI itself is hand-authored for Dedicate demos (not an official HDH product).

It mirrors a multi-domain layout (one StudyUnit / Dataset per domain, several PhysicalInstances / tables under each):

- Group `snds-synth-hdh` with 3 StudyUnits: `BEN`, `DCIR`, `DECES`
- 5 PhysicalInstances: `IR_BEN_R`, `IR_IBA_R`, `ER_PHA_F`, `ER_BIO_F`, `KI_ECD_R`
- 5 LogicalProducts (one per PI, Mekong-like) / 5 LogicalRecords -> still **one TableGroup per StudyUnit** with N Tables
- StudyUnit Citation/Coverage filled in Mekong catalogue style (`Creator`/`Publisher`/`Contributor`, `dcterms:*`, Subject/Keyword, spatial, temporal)
- 24 variables (shared where the same column name appears on several tables)
- 2 code lists (`BEN_SEX_COD`, Yes/No for `PHA_DEC_TOP`)

Try it:

```bash
./run.sh in/ddil-example.xml out/ddil-example.ttl
```

```powershell
.\run.ps1 -InputPath "in\ddil-example.xml" -OutputPath "out\ddil-example.ttl"
```

## What you get

- `dcat:Dataset` / `dcat:Distribution` from StudyUnit / PhysicalInstance
- `healthdcatap:hasVariables` -> CSVW `TableGroup` / `Table` / `Column` when `VariablesInRecord` is present
- Missing DDI fields are omitted (no hard failure)

## Layout

```text
ddi-l-to-healthdcat-ap/
  README.md
  run.sh / run.ps1
  xsl/ddi-lifecycle-to-dcat-ap.xsl   # XSLT 3.0
  in/ddil-example.xml                # sample DDI (HDH synthetic SNDS subset)
  out/                               # generated Turtle
  lib/                               # Saxon jars (auto-downloaded, gitignored)
```
