# Dedicate roadmap

## Done

- [x] Map from DDI-L to main DCAT classes and DCAT-AP mandatory and recommended properties
- [x] Implementation of step 1 (XSL) - first pass in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/) (graceful on incomplete DDI; not generative from SSSOM yet)
- [x] StudyUnit Citation/Coverage catalogue DCAT enrichment -> Dataset (creator, publisher, contactPoint, language, identifier, dcterms passthrough, Subject->theme, Keyword, spatial, temporal)
- [x] One `hasVariables` / TableGroup per Dataset (aggregate LogicalRecords of all PIs; not one TG per LogicalProduct)
- [x] Mapping extension for variables (DDI Variable / LogicalRecord -> HealthDCAT-AP `hasVariables` + CSVW) in [`ddi-lifecycle-dcat-ap-mapping.ttl`](./ddi-lifecycle-dcat-ap-mapping.ttl)
- [x] XSL implementation of the `variables` mapping set in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/)
- [x] Code lists -> HealthDCAT-AP `hasCodingSystem` / `hasCodeValues` (Dataset-scoped CodeList / Code) - see [#12](https://github.com/Making-Sense-Info/Dedicate/issues/12) for Literal vs Concept SHACL follow-up

## SHACL violations (HealthDCAT-AP validation)

Source: open issues labelled [`SHACL violation`](https://github.com/Making-Sense-Info/Dedicate/issues?q=is%3Aissue+is%3Aopen+label%3A%22SHACL+violation%22).
For each item: update [`model-mapping.md`](./model-mapping.md) + [`ddi-lifecycle-dcat-ap-mapping.ttl`](./ddi-lifecycle-dcat-ap-mapping.ttl) + [`ddi-l-to-healthdcat-ap/xsl/ddi-lifecycle-to-dcat-ap.xsl`](./ddi-l-to-healthdcat-ap/xsl/ddi-lifecycle-to-dcat-ap.xsl), then re-validate Turtle.

Suggested order: CSVW Column shape first (unblocks #8), then Dataset mandatory EHDS fields, then Agent / contact refinements.

### CSVW Column

- [ ] [#7 Column datatype](https://github.com/Making-Sense-Info/Dedicate/issues/7) - SHACL wants exactly one `csvw:datatype` literal (e.g. `"string"`, `"integer"`), not an XSD IRI/`xsd:decimal` QName
  - Doc: document HealthDCAT / CSVW expected datatype labels vs our current XSD map
  - Mapping: adjust `variables/recommendeddatatype-to-datatype` (DDI RecommendedDataType -> CSVW built-in name literal)
  - XSL: emit `csvw:datatype "string"` (etc.), not `xsd:string` / `xsd:decimal`

- [ ] [#9 Column description](https://github.com/Making-Sense-Info/Dedicate/issues/9) - every `csvw:Column` must have ≥1 `dct:description` literal
  - Doc: description mandatory for SHACL; fallback when DDI Description missing (e.g. Label / VariableName)
  - Mapping: extend `variables/description-to-description` with fallback rule
  - XSL: always emit at least one description (prefer Description, else Label, else name)

- [ ] [#8 CSVWColumnShape](https://github.com/Making-Sense-Info/Dedicate/issues/8) - `csvw:column` values must satisfy `CSVWColumnShape` (likely cleared once #7 + #9 pass; re-check residual constraints: name, title, …)
  - Doc: note Column SHACL checklist
  - Mapping / XSL: fix any remaining Column property after #7/#9

### Dataset - structure / legislation / EHDS

- [ ] [#10 Distribution required on Dataset](https://github.com/Making-Sense-Info/Dedicate/issues/10) - each Dataset must have ≥1 `dcat:distribution`
  - Doc: always emit at least one Distribution (placeholder if StudyUnit has no PI?)
  - Mapping: clarify empty-PI policy on `physicalinstanceref-to-distribution`
  - XSL: guarantee ≥1 distribution per Dataset (synthetic stub Distribution when no PI, or fail loudly - decide in mapping)

- [ ] [#11 `dcatap:applicableLegislation`](https://github.com/Making-Sense-Info/Dedicate/issues/11) - required on Dataset and Distribution
  - Doc: mark ✅; DDI source (Citation dcterms / OtherMaterial / catalogue `dcatap:applicableLegislation`) + default EHDS ELI `http://data.europa.eu/eli/reg/2025/327/oj`
  - Mapping: new records Dataset + Distribution -> `dcatap:applicableLegislation`
  - XSL: emit IRI(s) on Dataset and every Distribution (prefix `dcatap:`)

- [ ] [#13 `dct:provenance` on Dataset](https://github.com/Making-Sense-Info/Dedicate/issues/13) - ≥1 provenance required
  - Doc: DDI binding (Citation / Note / dcterms:provenance) ✅
  - Mapping: StudyUnit -> `dct:provenance` (ProvenanceStatement or literal - follow SHACL shape)
  - XSL: emit from DDI when present; document fallback if SHACL requires always-on

- [ ] [#14 `dct:type` on Dataset](https://github.com/Making-Sense-Info/Dedicate/issues/14) - ≥1 type required
  - Doc: catalogue / CV for dataset type; Mekong `dct:type` row
  - Mapping: Citation / Coverage / UserAttribute -> `dct:type` (CV IRI when possible)
  - XSL: emit type from DDI enrichment

- [ ] [#15 `healthdcatap:healthCategory`](https://github.com/Making-Sense-Info/Dedicate/issues/15) - ≥1 healthCategory (EHDS Art. 51 CV)
  - Doc: Health Categories NAL; Mekong catalogue values (HRAD, RQSH, …)
  - Mapping: DDI -> `healthdcatap:healthCategory` (Concept IRI)
  - XSL: parse catalogue-style values / controlledVocabularyURN -> NAL IRIs

- [ ] [#16 `healthdcatap:hdab`](https://github.com/Making-Sense-Info/Dedicate/issues/16) - exactly one HDAB Agent
  - Doc: HDAB binding (catalogue `healthdcatap:hdab`); Agent shape
  - Mapping: StudyUnit -> `healthdcatap:hdab` -> `foaf:Agent` (or required Agent shape)
  - XSL: emit single hdab from DDI / configured fallback

### Dataset - code values type

- [ ] [#12 `hasCodeValues` node kind Literal](https://github.com/Making-Sense-Info/Dedicate/issues/12) - SHACL requires Literal; we emit `skos:Concept`
  - Doc: switch to R8 Literal range; drop Concept/inScheme narrative for hasCodeValues (keep Standard for hasCodingSystem)
  - Mapping: revise `dataset/code-to-hascodevalues` -> literal (notation + optional label text)
  - XSL: emit `healthdcatap:hasCodeValues` language-tagged / plain literals instead of Concept IRIs (may keep ConceptScheme only on Standard if still useful, or simplify)

### Contact / publisher shapes

- [ ] [#17 `vcard:hasURL` or `vcard:hasEmail` IRI](https://github.com/Making-Sense-Info/Dedicate/issues/17) - contactPoint must expose at least one of hasURL / hasEmail as IRI
  - Doc: require email or URL in DDI ContactInformation / catalogue contact
  - Mapping: extend contactPoint records (email -> `vcard:hasEmail` `mailto:…`, page -> `vcard:hasURL`)
  - XSL: emit IRI when DDI has Email / URL; if only Contributor name exists, document SHACL gap / need Mekong to supply email

- [ ] [#18 `dct:publisher` HealthPublisherAgent_Shape](https://github.com/Making-Sense-Info/Dedicate/issues/18) - publisher Agent needs exactly one `cv:contactPoint`, ≤1 `dct:description`
  - Doc: publisher Agent shape (contactPoint + optional description); align with EHDS publisher-type if needed
  - Mapping: Publisher -> richer Agent (not only `foaf:name`)
  - XSL: nest / link contactPoint on publisher Agent; optional description; avoid extra properties that break the shape

## Other backlog

- [ ] Add mapping for selected DCAT-AP optional properties still parked (version, …)
- [ ] Implementation of step 2
- [ ] Extension of the mapping to HealthDCAT-AP (remaining properties beyond SHACL blockers)

## Ideas

- Use [SSSOM](https://mapping-commons.github.io/sssom/dev/) to express the mappings
- Generate the XSL (or other runtime) from a richer executable SSSOM (today the TTL is curated spec; XSL is hand-written)
- Wire SHACL validation into `ddi-l-to-healthdcat-ap` run / CI against Release 8 shapes

## Questions

- How to link DDI Lifecycle concepts to CSVW `propertyURL`? -> see SSSOM `variables/conceptreference-to-propertyurl` (still low confidence / TODO)
- `healthCategory` / access rights: always require Mekong catalogue CVs, or Dedicate defaults?
- [#10](https://github.com/Making-Sense-Info/Dedicate/issues/10): stub Distribution when StudyUnit has zero PI, or treat as invalid DDI input?
- [#12](https://github.com/Making-Sense-Info/Dedicate/issues/12): confirm Literal-only with HDAP (loses structured code↔scheme link we just added)
