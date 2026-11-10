# Dedicate roadmap

## Done

- [x] Map from DDI-L to main DCAT classes and DCAT-AP mandatory and recommended properties
- [x] Implementation of step 1 (XSL) - first pass in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/) (graceful on incomplete DDI; not generative from SSSOM yet)
- [x] StudyUnit Citation/Coverage catalogue DCAT enrichment -> Dataset (creator, publisher, contactPoint, language, identifier, dcterms passthrough, Subject->theme, Keyword, spatial, temporal)
- [x] One `hasVariables` / TableGroup per Dataset (aggregate LogicalRecords of all PIs; not one TG per LogicalProduct)
- [x] Mapping extension for variables (DDI Variable / LogicalRecord -> HealthDCAT-AP `hasVariables` + CSVW) in [`ddi-lifecycle-dcat-ap-mapping.ttl`](./ddi-lifecycle-dcat-ap-mapping.ttl)
- [x] XSL implementation of the `variables` mapping set in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/)
- [x] Code lists -> HealthDCAT-AP `hasCodingSystem` / `hasCodeValues` (Dataset-scoped CodeList / Code) - see [#12](https://github.com/Making-Sense-Info/Dedicate/issues/12) for Literal vs Concept SHACL follow-up
- [x] Optional SHACL validation in `run.sh` / `run.ps1` (Sparna jar + shapes URL / local cache)

## Spec tracker (HealthDCAT-AP upstream)

Open work items we care about: [healthdataeu/healthdcat-ap work items](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items?state=opened).

These do not block Dedicate implementation by themselves (wait for clarifications / future releases), but they explain several SHACL / modelling choices.

As R8 spec uses CSVW, we prefer full W3C CSVW conformance rather than a silent HealthDCAT-only dialect (tracked in [#64](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/64)). Detail issues below feed that decision.

| Topic | Upstream | Impact on Dedicate |
| --- | --- | --- |
| Full CSVW conformance | [#64](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/64) | Product decision: full W3C CSVW vs documented HealthDCAT subset, wait before inventing structure |
| CSVW Table -> column vs `tableSchema` | [#55](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/55) (comment added) | Keep current flatten until clarified, do not invent `tableSchema` yet |
| CSVW Column datatype form | [#61](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/61) | Done in Dedicate (#7): emit CSVW name literals, revisit if R8 changes |
| Distribution <-> Table link | [#62](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/62) | No RDF link to emit until the profile adds one |
| Property table labels vs RDF IRIs | [#63](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/63) | Doc-only for us, predicates already use RDF names |
| `csvw:url` / `propertyUrl` range | [#56](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/56) | Watch, we rarely emit these today |
| Column.name cardinality changelog | [#57](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/57) | Watch, we already emit `csvw:name` on Columns |
| Column value ranges / coding per variable | [#4](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/4) | Future, CodeLists only at Dataset level for now |
| Mandatory `csvw:name` on Table | [#31](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/31) | Watch, we emit Table `dct:title` today |
| Distribution usage (public / HDAB) | [#58](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/58) | Context for accessURL policy later |

## SHACL violations (HealthDCAT-AP validation)

Source: open Dedicate issues labelled [`SHACL violation`](https://github.com/Making-Sense-Info/Dedicate/issues?q=is%3Aissue+is%3Aopen+label%3A%22SHACL+violation%22).
For each item: update [`model-mapping.md`](./model-mapping.md) + [`ddi-lifecycle-dcat-ap-mapping.ttl`](./ddi-lifecycle-dcat-ap-mapping.ttl) + [`ddi-l-to-healthdcat-ap/xsl/ddi-lifecycle-to-dcat-ap.xsl`](./ddi-l-to-healthdcat-ap/xsl/ddi-lifecycle-to-dcat-ap.xsl), then re-validate Turtle.

### Priority A - fix now (DDI already enough / XSL-only)

- [x] [#7 Column datatype](https://github.com/Making-Sense-Info/Dedicate/issues/7) - SHACL wants `csvw:datatype` literal (`"string"`, `"integer"`, …), not `xsd:decimal`  
  Ref upstream: [#61](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/61)  
  Done: XSL map + representation fallbacks -> CSVW names, model-mapping + SSSOM updated

- [x] [#9 Column description](https://github.com/Making-Sense-Info/Dedicate/issues/9) - every Column ≥1 `dct:description`  
  Done: Description -> else Label -> else VariableName, model-mapping + SSSOM updated

- [ ] [#8 CSVWColumnShape](https://github.com/Making-Sense-Info/Dedicate/issues/8) - re-check after #7 + #9  
  Doc: Column SHACL checklist; XSL residual fixes if any

- [ ] [#12 `hasCodeValues` Literal](https://github.com/Making-Sense-Info/Dedicate/issues/12) - SHACL `nodeKind` Literal; we emit `skos:Concept`  
  DDI: CodeLists / Codes present  
  Doc + mapping + XSL: emit literals (keep `hasCodingSystem` -> Standard)

- [ ] [#10 Distribution on Dataset](https://github.com/Making-Sense-Info/Dedicate/issues/10) - verify on SNDS-TS (every StudyUnit already has PI refs)  
  If still failing: find which Dataset lacks `dcat:distribution`; only then decide stub vs invalid input  
  Doc + mapping + XSL as needed

### Priority B - parked (DDI / catalogue content missing in DDI XML input)

Needs Mekong catalogue enrichment or new DDI fields before Dedicate can emit SHACL-valid values:

- [ ] [#11 `dcatap:applicableLegislation`](https://github.com/Making-Sense-Info/Dedicate/issues/11) - not in DDI today (catalogue has it; not bound)
- [ ] [#13 `dct:provenance`](https://github.com/Making-Sense-Info/Dedicate/issues/13) - no Dataset-level provenance in DDI (only variable labels containing “provenance”)
- [ ] [#14 `dct:type`](https://github.com/Making-Sense-Info/Dedicate/issues/14) - catalogue row not bound; watch upstream [#41](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/41) (dataset-type CV unfit for health)
- [ ] [#15 `healthdcatap:healthCategory`](https://github.com/Making-Sense-Info/Dedicate/issues/15) - catalogue values not in DDI
- [ ] [#16 `healthdcatap:hdab`](https://github.com/Making-Sense-Info/Dedicate/issues/16) - not in DDI
- [ ] [#17 `vcard:hasEmail` / `hasURL`](https://github.com/Making-Sense-Info/Dedicate/issues/17) - Contributor name only, no ContactInformation / Email
- [ ] [#18 publisher `HealthPublisherAgent_Shape`](https://github.com/Making-Sense-Info/Dedicate/issues/18) - needs Agent contactPoint (+ description); blocked on same contact data as #17; also upstream publisher-type [#44](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/44)

## Other backlog

- [ ] Add mapping for selected DCAT-AP optional properties still parked (version, …)
- [ ] Implementation of step 2
- [ ] Extension of the mapping to HealthDCAT-AP (remaining properties beyond SHACL blockers)
- [ ] After [#64](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/64) / related clarity: optional `tableSchema` (#55), Distribution <-> Table link (#62), Table `csvw:name` (#31), per-column value ranges (#4)

## Ideas

- Use [SSSOM](https://mapping-commons.github.io/sssom/dev/) to express the mappings
- Generate the XSL (or other runtime) from a richer executable SSSOM (today the TTL is curated spec; XSL is hand-written)
- CI: run `./run.sh … --shacl-jar … --shapes <R8 non-public URL>` on `in/ddil-example.xml` / `SNDS-TS.xml`

## Questions

- How to link DDI Lifecycle concepts to CSVW `propertyURL`? -> see SSSOM `variables/conceptreference-to-propertyurl` (still low confidence / TODO); related upstream [#56](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/56)
- Priority B fields: bind from Mekong `Catalogue_TS.xlsx` DCAT sheet into StudyUnit, or inject Dedicate defaults (e.g. EHDS ELI) in XSL?
- [#10](https://github.com/Making-Sense-Info/Dedicate/issues/10): stub Distribution when StudyUnit has zero PI, or treat as invalid DDI input?
- [#12](https://github.com/Making-Sense-Info/Dedicate/issues/12): Literal-only confirmed by SHACL; structured code <-> scheme stays only via `hasCodingSystem`
