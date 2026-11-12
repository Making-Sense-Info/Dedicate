# Dedicate roadmap

## Done

- [x] Map from DDI-L to main DCAT classes and DCAT-AP mandatory and recommended properties
- [x] Implementation of step 1 (XSL) - first pass in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/) (graceful on incomplete DDI; not generative from SSSOM yet)
- [x] StudyUnit Citation/Coverage catalogue DCAT enrichment -> Dataset (creator, publisher, contactPoint, language, identifier, dcterms passthrough, Subject->theme, Keyword, spatial, temporal)
- [x] One `hasVariables` / TableGroup per Dataset (aggregate LogicalRecords of all PIs; not one TG per LogicalProduct)
- [x] Mapping extension for variables (DDI Variable / LogicalRecord -> HealthDCAT-AP `hasVariables` + CSVW) in [`ddi-lifecycle-dcat-ap-mapping.ttl`](./ddi-lifecycle-dcat-ap-mapping.ttl)
- [x] XSL implementation of the `variables` mapping set in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/)
- [x] Code lists -> HealthDCAT-AP `hasCodingSystem` (`dct:Standard`) / `hasCodeValues` (Literals; [#12](https://github.com/Making-Sense-Info/Dedicate/issues/12))
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
| SHACL `dcat:distribution` message (minCount + node merged) | [#65](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/65) | Explains misleading "missing distribution" when `Distribution_Shape` fails, Dedicate #10 OK |
| Distribution <-> Table link | [#62](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/62) | No RDF link to emit until the profile adds one |
| Property table labels vs RDF IRIs | [#63](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/63) | Doc-only for us, predicates already use RDF names |
| `csvw:url` / `propertyUrl` range | [#56](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/56) | Watch, we rarely emit these today |
| Column.name cardinality changelog | [#57](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/57) | Watch, we already emit `csvw:name` on Columns |
| Column value ranges / coding per variable | [#4](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/4) | Future; CodeLists only at Dataset level in R8 today |
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

- [x] [#8 CSVWColumnShape](https://github.com/Making-Sense-Info/Dedicate/issues/8)
  Done: Column SHACL checklist in model-mapping, XSL hardens name/title/datatype fallbacks for incomplete DDI

- [x] [#12 `hasCodeValues` Literal](https://github.com/Making-Sense-Info/Dedicate/issues/12) - SHACL `nodeKind` Literal; was `skos:Concept`  
  Done: distinct Code/Value literals; `hasCodingSystem` stays `dct:Standard`; model-mapping + SSSOM updated

- [x] [#10 Distribution on Dataset](https://github.com/Making-Sense-Info/Dedicate/issues/10)
  Done: all fixture Datasets emit ≥1 `dcat:distribution`, no stub when PI absent. Misleading SHACL "missing distribution" = merged minCount+node (upstream [#65](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/65)). Real `Distribution_Shape` gaps e.g. #11 applicableLegislation

### Priority B - catalogue enrichment in DDI (StudyUnit `UserAttributePair`)

Reference DDI input [`in/ddil-example.xml`](./ddi-l-to-healthdcat-ap/in/ddil-example.xml) carries Priority B catalogue fields as StudyUnit `UserAttributePair`. Full input / emit contract (including `@lang` on `AttributeKey` and XSL fallback without language): [model-mapping.md — UAP language contract](./model-mapping.md#studyunit-userattributepair-language-contract).

To get language-tagged RDF for multilingual UAP fields, the DDI input must use `property@fr` / `property@en` (etc.), a single occurrence stays a plain key. The XSL parses the suffix and attaches `@lang` on literals, missing or malformed suffix will emit without language. IRI-ranged UAP values ignore language on the key.

Keys present: `dcatap:applicableLegislation`, `healthdcatap:healthCategory`, `healthdcatap:hdab`, `dct:type (éditeur)`, `dcat:temporalResolution`, `dpv:hasLegalBasis`, `dpv:hasPurpose`, `dpv:hasPersonalData`, `healthdcatap:populationCoverage`, `healthdcatap:numberOfUniqueIndividuals`, `healthdcatap:numberOfRecords`, `healthdcatap:hasCodingSystem` (optional per StudyUnit), `dqv:hasQualityAnnotation`, `dcat:version`.

- [x] [#11 `dcatap:applicableLegislation`](https://github.com/Making-Sense-Info/Dedicate/issues/11) - UAP -> Dataset + Distribution IRIs (multi-ELI extract); model-mapping + SSSOM + XSL
- [ ] [#13 `dct:provenance`](https://github.com/Making-Sense-Info/Dedicate/issues/13) - still missing from enrichment pairs
- [ ] [#14 `dct:type`](https://github.com/Making-Sense-Info/Dedicate/issues/14) - publisher type as `dct:type (éditeur)` pair, dataset-type CV still watch upstream [#41](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/41)
- [x] [#15 `healthdcatap:healthCategory`](https://github.com/Making-Sense-Info/Dedicate/issues/15) - UAP -> healthCategory IRI; model-mapping + SSSOM + XSL
- [x] [#16 `healthdcatap:hdab`](https://github.com/Making-Sense-Info/Dedicate/issues/16) - UAP -> `foaf:Agent` + `foaf:name`@lang; model-mapping + SSSOM + XSL (Agent contact still #17/#18)
- [ ] [#17 `vcard:hasEmail` / `hasURL`](https://github.com/Making-Sense-Info/Dedicate/issues/17) - Contributor name only, no ContactInformation / Email
- [ ] [#18 publisher `HealthPublisherAgent_Shape`](https://github.com/Making-Sense-Info/Dedicate/issues/18) - needs Agent contactPoint (+ description), blocked on same contact data as #17; also upstream publisher-type [#44](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/44)

## Other backlog

- [ ] Add mapping for selected DCAT-AP optional properties still parked (version, …)
- [ ] Implementation of step 2
- [ ] Extension of the mapping to HealthDCAT-AP (remaining properties beyond SHACL blockers)
- [ ] After [#64](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/64) / related clarity: optional `tableSchema` (#55), Distribution <-> Table link (#62), Table `csvw:name` (#31), per-column value ranges (#4)

## Ideas

- Use [SSSOM](https://mapping-commons.github.io/sssom/dev/) to express the mappings
- Generate the XSL (or other runtime) from a richer executable SSSOM (today the TTL is curated spec; XSL is hand-written)

## Questions

- How to link DDI Lifecycle concepts to CSVW `propertyURL`? -> see SSSOM `variables/conceptreference-to-propertyurl` (still low confidence / TODO); related upstream [#56](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/56)
- Priority B remaining UAP keys (temporalResolution, dpv:*, populationCoverage, counts, qualityAnnotation, version, `dct:type (éditeur)`): confirm SHACL ranges before emit; reuse UAP `@lang` / URI extract helpers already in XSL
- Structured code↔category labels (dropped when `hasCodeValues` became Literals): revisit if upstream restores Concept range, or via CSVW column value ranges (#4)
