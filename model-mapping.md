# Dedicate: Model-Level Mapping between DDI and DCAT

## Introduction

Here we document the model-level mapping between DDI and DCAT, or more precisely from the different DDI products (Codebook, Lifecycle and CDI) to DCAT.

Since the aim is to produce metadata conforming to DCAT profiles, the document is organized according to the DCAT model. Each main section corresponds to a DCAT class, and is further divided according to the DDI product which is source of the mapping.

The DCAT model is detailed [in the Recommendation](https://www.w3.org/TR/vocab-dcat-3/#fig-dcat-all-attributes); a summary view of its structure is given below.

```mermaid
---
config:
  layout: elk
title: DCAT v3
---
classDiagram
    Resource <|-- Dataset
    Resource <|-- DataService
    Resource <-- Relationship
    Relationship <-- Resource
    Distribution <-- Dataset
    DataService <-- Distribution
    Dataset <-- DataService
    Dataset <|-- DatasetSeries
    DatasetSeries <-- Dataset
    Resource <-- CatalogRecord
    CatalogRecord <-- Catalog
    Resource <-- Catalog
    Dataset <-- Catalog
    DataService <-- Catalog
    Catalog <-- Catalog
```

## DCAT Resource

The DCAT Recommendation defines the [Resource class](https://www.w3.org/TR/vocab-dcat-3/#Class:Resource) by: "This class carries properties common to all cataloged resources, including datasets and data services". This class is mainly useful to catalog resources that are not datasets or data services, so we may ignore it in this mapping exercice. However, it bears a great number of properties that are inherited by Dataset and DataService. These properties will be studied in the next section.

## DDI to HealthDCAT-AP

Overview of how DDI Lifecycle projects onto HealthDCAT-AP / CSVW objects.

Property-level detail follows in the following sections:

- [Dataset](#dcat-dataset)
- [Distribution](#dcat-distribution)
- [variables / CSVW](#dataset-structure--variables-healthdcat-ap--csvw)

```mermaid
flowchart TB
  SU["DDI StudyUnit<br/>Citation / Coverage"] ==>|1 : 1| DS["dcat:Dataset"]
  SU -->|PhysicalInstanceReference| PI
  DS -->|dcat:distribution| Dist
  DS -->|healthdcatap:hasVariables| TG

  PI["DDI PhysicalInstance"] ==>|1 : 1| Dist["dcat:Distribution"]
  PI -->|DataRelationship| LR

  SU -.->|one TG per Dataset| TG["csvw:TableGroup"]
  TG -->|csvw:table| T

  LR["DDI LogicalRecord"] ==>|1 : 1| T["csvw:Table"]
  LR -->|VariablesInRecord| Var
  T -->|csvw:column| Col

  Var["DDI Variable"] ==>|1 : 1| Col["csvw:Column"]

  classDef ddi fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a
  classDef dcat fill:#dcfce7,stroke:#15803d,color:#14532d
  class SU,PI,LR,Var ddi
  class DS,Dist,TG,T,Col dcat
```

Organisation below follows HealthDCAT-AP Release 8 Dataset property tables (cardinality / EHDS requirements).

✅ = XSL implements the mapping (emitted when the DDI source field is present); ❌ = not implemented yet. Missing DDI fields are omitted.

### DCAT Dataset

The DCAT Recommendation defines the [Dataset class](https://www.w3.org/TR/vocab-dcat-3/#Class:Dataset) as a "collection of data, published or curated by a single agent, and available for access or download in one or more representations".

#### Identification

❗️TODO document how to identify an DCAT Dataset (its URI)

#### DDI Lifecycle

A DDI `StudyUnits` produces one `dcat:Dataset`.

Bibliographic / coverage fields come from `Citation` and `Coverage`.

Linked PhysicalInstances become Distributions, LogicalRecords / Variables become the CSVW TableGroup (see [Dataset structure / variables](#dataset-structure--variables-healthdcat-ap--csvw)).

##### StudyUnit `UserAttributePair` contract (JSON CustomField)

Priority B catalogue fields that have no dedicated DDI Lifecycle element are carried as StudyUnit `UserAttributePair`. The expected input (reference sample `in/ddil-example.xml`) is one pair per property:

| Field | Content |
| --- | --- |
| `AttributeKey` | always `extension:CustomField` |
| `AttributeValue` | JSON object (Colectica multilingual CustomField, `ValueType` = `1`) |

JSON shape:

```json
{
  "ValueType": 1,
  "Title": { "en": "…", "fr": "…" },
  "Description": { "en": "dcatap:applicableLegislation", "fr": "dcatap:applicableLegislation" },
  "MultilingualStringValue": { "en": "…", "fr": "…" }
}
```

| JSON field | Role for Dedicate |
| --- | --- |
| `Description.en` / `.fr` | HealthDCAT / DCAT property name (same string in both langs). Predicate for mapping. |
| `Title.*` | Human label only (ignored by the XSL). |
| `MultilingualStringValue.*` | Value text per language (`en`, `fr`, …). |

Rules for the XSL:

1. If `AttributeKey` is `extension:CustomField` and `AttributeValue` parses as JSON with `Description` + `MultilingualStringValue`, use that contract.
2. Property key = first non-empty of `Description.en`, `Description.fr`, then any other `Description` entry.
3. For language-tagged literals (e.g. `hdab` / `foaf:name`), emit one value per `MultilingualStringValue` entry using the map key as `@lang`.
4. For IRI-ranged properties, scan every `MultilingualStringValue` string: whole-value `http(s)|urn` URI, or every embedded `http(s)` URL → IRI (deduped across languages). Prose with no URI is omitted.
5. Legacy fallback (not used in the reference sample): plain `AttributeKey` = property name, optional `property@lang` suffix, raw `AttributeValue` text — same emit rules as before.

Emitted today: `dcatap:applicableLegislation`, `healthdcatap:healthCategory`, `healthdcatap:hdab`. Other UAP keys in the sample (`dcat:temporalResolution`, `dpv:*`, `populationCoverage`, counts, `dqv:hasQualityAnnotation`, `dcat:version`, `dct:type (éditeur)`) stay parked until ranges / shapes are settled. Dataset `hasCodingSystem` comes from `OtherMaterial` / `RelatedOtherMaterialReference`, not from UAPs.

Agent-ranged UAP values (`hdab`): each `MultilingualStringValue` entry becomes `foaf:name` with that language (no URI required).

##### Mandatory

Properties with cardinality requiring at least one value in HealthDCAT-AP R8 (or mandatory when `hasStructuredData` is true).

###### `dct:title` ✅

`Citation/Title/String` -> `dcterms:title` (multi-language).

###### `dct:description` ✅

Prefers `Citation/dcterms:description`; also accepts classic `Citation/Description` (`Content` / `String`) -> `dcterms:description`.

###### `dct:identifier` ✅

`Citation/InternationalIdentifier/IdentifierContent` -> `dcterms:identifier`.

###### `dct:accessRights` ✅

`Citation/dcterms:accessRights` -> `dcterms:accessRights`. Whole-value URIs, or catalogue strings `Label (https://…)`, become IRIs, otherwise kept as language-tagged literals.

###### `dcatap:applicableLegislation` ✅

StudyUnit `UserAttributePair` CustomField whose `Description` is `dcatap:applicableLegislation` (see [UAP contract](#studyunit-userattributepair-contract-colectica-customfield-json)). Extract all `http(s)` URIs from `MultilingualStringValue` (multi-ELI catalogue strings), dedupe across languages -> Dataset `dcatap:applicableLegislation` IRIs. Same IRIs are copied onto each Distribution of that Dataset ([Dedicate #11](https://github.com/Making-Sense-Info/Dedicate/issues/11)). Omitted when no URI is found.

###### `healthdcatap:healthCategory` ✅

EHDS Art. 51 CV. StudyUnit CustomField `Description` `healthdcatap:healthCategory` -> `healthdcatap:healthCategory` IRI (whole-value URI or embedded URL in `MultilingualStringValue`). [Dedicate #15](https://github.com/Making-Sense-Info/Dedicate/issues/15).

###### `healthdcatap:hdab` ✅

Health data access body. StudyUnit CustomField `Description` `healthdcatap:hdab` or catalogue split `healthdcatap:hdab:label` -> one `healthdcatap:hdab` / `foaf:Agent` blank with `foaf:name` language-tagged from each `MultilingualStringValue` entry ([Dedicate #16](https://github.com/Making-Sense-Info/Dedicate/issues/16)). Optional `healthdcatap:hdab:mail` / `healthdcatap:hdab:url` → Agent `cv:contactPoint` (`cv:email` Literal, `cv:contactPage` IRI). Publisher Agent contact remains [#18](https://github.com/Making-Sense-Info/Dedicate/issues/18).

###### `healthdcatap:hasStructuredData` ✅

Derived: `true` when the StudyUnit’s PhysicalInstances expose variables via LogicalRecord / `VariablesInRecord`. Not read from a DDI boolean field.

###### `healthdcatap:hasVariables` ✅

When structured data is true: one `csvw:TableGroup` per Dataset (see [Dataset structure / variables](#dataset-structure--variables-healthdcat-ap--csvw)). Mandatory in HealthDCAT-AP whenever `hasStructuredData` is `true`.

##### Recommended

Core discoverability / DCAT-AP-style recommended properties (and HealthDCAT-AP "Reuse" E/A with optional cardinality).

###### `dct:publisher` ✅

`Citation/Publisher` (`PublisherName` / `OrganizationName`) -> `foaf:Agent` / `foaf:name`. When `ContactInformation` is present (under Publisher, else Citation / StudyUnit), also emit exactly one `cv:contactPoint` / `cv:ContactPoint` with `cv:email` (Literal) and/or `cv:contactPage` (IRI from `URL`) for `HealthPublisherAgent_Shape` ([Dedicate #18](https://github.com/Making-Sense-Info/Dedicate/issues/18)). Optional publisher `dct:description` is not mapped yet.

###### `dcat:contactPoint` ✅

Prefers structured `ContactInformation` -> `vcard:Kind` with `vcard:hasEmail` (`mailto:` IRI from `Email` / `InternetEmail`) and/or `vcard:hasURL` (IRI from `URL`) when present ([Dedicate #17](https://github.com/Making-Sense-Info/Dedicate/issues/17)). Else `Citation/Contributor` names -> `vcard:fn`; if a Contributor name looks like an email, emit `vcard:hasEmail` instead of (or in addition to) `fn`. Reference sample keeps `ContactInformation` under `Publisher` (shared with [#18](https://github.com/Making-Sense-Info/Dedicate/issues/18)).

###### `dcat:distribution` ✅

Each `PhysicalInstanceReference` -> `dcat:distribution` (one Distribution per PhysicalInstance).

Verified on `ddil-example.xml`: every StudyUnit has ≥1 PI ref, every Dataset emits ≥1 distribution ([Dedicate #10](https://github.com/Making-Sense-Info/Dedicate/issues/10)). No stub Distribution when PI is absent, treat as incomplete DDI. A Sparna message "missing distribution" can be misleading when `minCount` and `sh:node :Distribution_Shape` are merged (upstream [#65](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/65)). `dcatap:applicableLegislation` on Distribution is filled from the StudyUnit UAP ([#11](https://github.com/Making-Sense-Info/Dedicate/issues/11)).

###### `dcat:keyword` ✅

`Coverage/TopicalCoverage/Keyword` (text + `xml:lang`) -> `dcat:keyword`. Legacy Keyword carrying a CV URI still maps to `dcat:theme`.

###### `dcat:theme` ✅

`Coverage/TopicalCoverage/Subject` + `controlledVocabularyURN` -> `dcat:theme` IRI.

###### `dct:language` ✅

`Citation/Language` -> `dcterms:language` (IRI if URI-shaped, else literal).

###### `dct:accrualPeriodicity` ✅

`Citation/dcterms:accrualPeriodicity` -> `dcterms:accrualPeriodicity` (HealthDCAT-AP "frequency"). Same URI / `Label (URI)` rule as `accessRights`.

###### `dct:spatial` ✅

`Coverage/SpatialCoverage` -> blank `dcterms:Location` (`rdfs:label` from Description, `dcterms:identifier` from CountryCode).

###### `dct:temporal` ✅

`Coverage/TemporalCoverage/ReferenceDate` -> `dcterms:PeriodOfTime` with `dcat:startDate` / `dcat:endDate`.

###### `dct:modified` ✅

`Citation/dcterms:modified` -> `dcterms:modified`.

###### `dct:conformsTo` ✅

`Citation/dcterms:conformsTo` -> `dcterms:conformsTo`. Same URI / `Label (URI)` rule as `accessRights` (reference sample may keep prose literals today).

###### `dct:creator` ✅

`Citation/Creator` -> `foaf:Agent` / `foaf:name`.

###### `dct:type` ❌

Dataset type CV. No StudyUnit mapping; not emitted.

###### `dcat:version` ❌

StudyUnit CustomField `Description` `dcat:version`. `pi:DataFileVersion` on PhysicalInstance remains out of scope for Dataset today. XSL emit TODO.

###### `dcat:temporalResolution` ❌

StudyUnit CustomField `Description` `dcat:temporalResolution`. Not read from Coverage / Citation. XSL emit TODO.

###### `dct:issued` ❌

Release date (`dct:issued`). Not mapped.

###### `adms:identifier` ❌

Other identifier. Not mapped.

###### `dcat:inSeries` ❌

Dataset series membership. Not mapped.

##### Other

Remaining HealthDCAT-AP Dataset properties (optional / profile extensions).

###### `dct:source` ✅

`Citation/dcterms:source` -> `dcterms:source`.

###### `dct:provenance` ✅

`Citation/dcterms:provenance` (prose, optional `xml:lang`) -> one `dcterms:provenance` blank `dcterms:ProvenanceStatement` with `rdfs:label` language-tagged per Citation value (HealthDCAT-AP R8 range / SHACL `BlankNodeOrIRI`; R8 example uses `rdfs:label`). Not emitted as a bare Literal ([Dedicate #13](https://github.com/Making-Sense-Info/Dedicate/issues/13)).

###### `dct:alternative` ❌

Not mapped.

###### `dcat:landingPage` ❌

Not mapped (`foaf:page` / documentation also ❌).

###### `foaf:page` ❌

Documentation. Not mapped.

###### `dcat:hasVersion` ❌

Not mapped.

###### `dcat:isReferencedBy` ❌

Not mapped.

###### `dcat:qualifiedRelation` ❌

Not mapped.

###### `prov:qualifiedAttribution` ❌

Not mapped.

###### `dcat:relation` ❌

Related resource. Not mapped.

###### `dcat:spatialResolutionInMeters` ❌

Not mapped.

###### `dcat:sample` ❌

Not mapped.

###### `prov:wasGeneratedBy` ❌

Not mapped.

###### `geodcatap:custodian` ❌

Not mapped.

###### `healthdcatap:analytics` ❌

Not mapped.

###### `healthdcatap:hdabCoordinator` ❌

Not mapped.

###### `healthdcatap:healthTheme` ❌

Not mapped (distinct from `dcat:theme`).

###### `healthdcatap:minTypicalAge` / `healthdcatap:maxTypicalAge` ❌

Not mapped.

###### `healthdcatap:numberOfRecords` ❌

Not mapped.

###### `healthdcatap:numberOfUniqueIndividuals` ❌

Not mapped.

###### `healthdcatap:populationCoverage` ❌

Not mapped (possible future Universe / Description).

###### `healthdcatap:retentionPeriod` ❌

Not mapped.

###### `healthdcatap:hasCodingSystem` ✅

StudyUnit `RelatedOtherMaterialReference` → ResourcePackage `OtherMaterial` (typically `TypeOfMaterial` = `ReferenceTable`) → `healthdcatap:hasCodingSystem`.

Intent ([HealthDCAT-AP #66](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/66)): dataset-level pointers to nomenclatures / référentiels used by the Dataset — not variable CodeLists (those stay in CSVW / LogicalProduct for column semantics).

Support:

- Prefer `OtherMaterial/ExternalURLReference` when it is an IRI (Coding System NAL / Wikidata)
- Else local `dct:Standard` IRI from the OtherMaterial URN, with `dct:identifier` = `UserID` and `dct:title` from Citation/Title (fallback Description)

Do not invent NAL IRIs. Variable `CodeList` / `CodeRepresentation` are not mapped to `hasCodingSystem`.

###### `healthdcatap:hasCodeValues` ❌ (later)

Not emitted. R8 models `hasCodeValues` as Literals that act as filters relative to a coding system (which codes / branches the Dataset covers), not as dumping every CodeList value. DDI content for that is not settled yet; keep Variable CodeLists for CSVW only until then.

###### `dpv:hasLegalBasis` ❌

StudyUnit CustomField `Description` `dpv:hasLegalBasis`. XSL emit TODO.

###### `dpv:hasPurpose` ❌

StudyUnit CustomField `Description` `dpv:hasPurpose`. XSL emit TODO.

###### `dpv:hasPersonalData` ❌

HealthDCAT-AP "personal data". StudyUnit CustomField `Description` `dpv:hasPersonalData`. XSL emit TODO.

###### `dqv:hasQualityAnnotation` ❌

StudyUnit CustomField `Description` `dqv:hasQualityAnnotation`. XSL emit TODO.

###### `adms:versionNotes` ❌

Not mapped.

### DCAT Distribution

The DCAT Recommendation defines the [Distribution class](https://www.w3.org/TR/vocab-dcat-3/#Class:Distribution) as a specific representation of a dataset (format, access, rights, etc.).

#### DDI Lifecycle

A PhysicalInstance produces one `dcat:Distribution`, linked from the StudyUnit Dataset via `dcat:distribution` (see Dataset § Recommended).

##### Mandatory

Properties with cardinality requiring at least one value in HealthDCAT-AP R8.

###### `dcat:accessURL` ✅

`PhysicalInstance/DataFileIdentification/DataFileURI` -> `dcat:accessURL`. Relative paths are resolved against the XSL `base-uri` param when set. Omitted when absent (reference sample may have no `DataFileURI` -> Distributions are title-only).

###### `dcatap:applicableLegislation` ✅

ELI / legal resource on the Distribution. Copied from the parent StudyUnit UAP `dcatap:applicableLegislation` IRIs (same extraction as Dataset; [Dedicate #11](https://github.com/Making-Sense-Info/Dedicate/issues/11)). No PhysicalInstance-level UAP yet.

##### Recommended

###### `dct:title` ✅

`Citation/Title/String` -> `dcterms:title`.

###### `dct:description` ✅

`Citation/Description` (`Content` / `String`) -> `dcterms:description`.

Omitted when absent.

###### `dct:format` ✅

`Citation` format / DCTerms `format` -> `dcterms:format` (literal today).

HealthDCAT-AP expects the EU file-type CV when applicable.

Alternative DDI path not used yet: `PhysicalStructure/FileFormat` via RecordLayout.

Omitted when absent.

###### `dcat:downloadURL` ❌

Direct download link. Not mapped (distinct from `accessURL`).

###### `dcat:mediaType` ❌

IANA media type. Not mapped.

###### `dct:license` ❌

Licence document on the Distribution. Not mapped.

###### `dct:rights` ❌

Rights statement. Not mapped.

###### `dcatap:availability` ❌

Planned-availability CV. Not mapped.

###### `dcat:byteSize` ❌

Not mapped.

###### `spdx:checksum` ❌

Checksum. Not mapped.

###### `dcat:compressFormat` ❌

Compression format. Not mapped.

###### `dcat:packageFormat` ❌

Packaging format. Not mapped.

###### `dct:language` ❌

Distribution language. Not mapped (Dataset language is mapped separately).

###### `dct:modified` ❌

Distribution modification date. `pi:DataFileVersion/@versionDate` can bu used?

###### `dct:issued` ❌

Release date. Not mapped.

###### `dct:conformsTo` ❌

Linked schemas / standards the Distribution conforms to (`linked schemas` in HealthDCAT-AP). Not mapped at Distribution level.

###### `odrl:hasPolicy` ❌

ODRL policy. Not mapped.

###### `foaf:page` ❌

Documentation. Not mapped.

###### `dcat:accessService` ❌

Link to a Data Service. Not mapped.

###### `dcat:spatialResolutionInMeters` ❌

Not mapped.

###### `dcat:temporalResolution` ❌

Not mapped.

###### `adms:status` ❌

Distribution-status CV. Not mapped.

### DCAT Catalog

Out of scope for now.

A stub remains in the XSL (`Organization` -> Catalog title / description / publisher) and in the SSSOM `catalog` mapping set, but it is not on the Dedicate delivery path and is not linked to Datasets via `dcat:dataset`.

Revisit only if Dedicate must emit a standalone catalogue.

### Dataset structure / variables (HealthDCAT-AP + CSVW)

Core DCAT-AP does not describe dataset variables. HealthDCAT-AP does, via CSVW linked from the Dataset:

- `healthdcatap:hasStructuredData` / `healthdcatap:hasVariables` on the Dataset (see Dataset § Mandatory)
- `csvw:TableGroup` -> `csvw:Table` -> `csvw:Column` (R8 flatten today; no `tableSchema` yet)

#### Conformance note (SHACL vs prose vs W3C CSVW)

Dedicate’s Column output is written to pass the R8 non-public SHACL `CSVWColumnShape` (exactly one `csvw:name` and `csvw:datatype` as literals, ≥1 `csvw:title` and `dct:description`, optional `csvw:propertyUrl` IRI). See [Dedicate #7](https://github.com/Making-Sense-Info/Dedicate/issues/7), [#9](https://github.com/Making-Sense-Info/Dedicate/issues/9), [#8](https://github.com/Making-Sense-Info/Dedicate/issues/8).

That is not the same as claiming every constraint is spelled out the same way in the HealthDCAT-AP R8 HTML property tables (prose / examples can be quieter or diverge from the shapes). Where they conflict, we follow SHACL rules, and we track upstream mismatches.

Separately, we share the product stance that if the profile uses CSVW, it should respect W3C CSVW properly (full structure / datatypes / ranges), not a silent HealthDCAT-only dialect. It is tracked in upstream [#64](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/64) (with #55, #61, #56,...). Until that lands, Dedicate stays on the R8 flatten (`Table -> column`) and does not invent `tableSchema`.

#### DDI Lifecycle attachment path

```text
StudyUnit                    ->  dcat:Dataset
  + healthdcatap:hasVariables ->  one csvw:TableGroup per Dataset
  PhysicalInstanceReference
    PhysicalInstance         ->  dcat:Distribution
      DataRelationshipReference
        DataRelationship
          LogicalRecord      ->  csvw:Table  (all records of the StudyUnit aggregated in that TableGroup)
            VariablesInRecord / VariableUsedReference
              Variable       ->  csvw:Column
```

#### Table Group

We produce one TableGroup per StudyUnit / Dataset (not one per LogicalProduct).

##### Mandatory

###### `csvw:table` ✅

One `csvw:table` link per LogicalRecord aggregated under the StudyUnit’s PhysicalInstances.

###### `dct:title` ✅

Built from the StudyUnit `Citation/Title` strings, suffixed with ` — variables` (multi-language support, suffix to discuss ❗️).

#### Table

One LogicalRecord produces one `csvw:Table`.

##### Mandatory

###### `csvw:column` ✅

One link per Variable referenced from `VariablesInRecord` / `VariableUsedReference`.

###### `dct:title` ✅

`LogicalRecord/LogicalRecordName/String` -> `dcterms:title`.

##### Recommended

###### `csvw:url` ❌

URL of the CSV file (synthetic / anonymised extract in HealthDCAT-AP usage notes). Not mapped.

###### `csvw:keyword` ❌

Keywords on the table. Not mapped.

#### Column

One DDI Variable produces one `csvw:Column` (Column IRI = Variable URN).

##### Mandatory

###### `csvw:name` ✅

1. `Variable/VariableName/String` (first)
2. else first `UserID`
3. else last segment of the Column IRI

###### `csvw:title` ✅

`Variable/Label/Content` (multi-language). If no Label, reuse `csvw:name`.

###### `dct:description` ✅

Always emit at least one `dcterms:description` ([Dedicate #9](https://github.com/Making-Sense-Info/Dedicate/issues/9)):

1. `Variable/Description` (`Content` / `String`) when present
2. else `Variable/Label/Content` (same text as `csvw:title`)
3. else the resolved `csvw:name`

###### `csvw:datatype` ✅

Always emit exactly one CSVW built-in name literal (`"string"`, `"integer"`, `"decimal"`, `"dateTime"`,...) — not an XSD IRI ([Dedicate #7](https://github.com/Making-Sense-Info/Dedicate/issues/7), upstream [#61](https://code.europa.eu/healthdataeu/healthdcat-ap/-/work_items/61)).

1. `VariableRepresentation/*/RecommendedDataType` via the XSL map
2. else Text / CodeRepresentation → `"string"`, Numeric → `"decimal"`, DateTime → `"dateTime"`
3. else `"string"`

##### Recommended

###### `csvw:propertyUrl` ✅

`Variable/ConceptReference/URN` when present -> `csvw:propertyUrl` (at most one IRI).

Omit if absent.

##### Other

###### `dct:identifier` ✅

`Variable/UserID` -> `dcterms:identifier` (extra Dedicate binding, not listed on the HealthDCAT-AP R8 Column table).

#### Open points

- See open questions at the top of the SSSOM file (`propertyUrl`, `csvw:title` vs `csvw:titles`). Settled: Columns #7+#9+#8. Coding: `hasCodingSystem` from OtherMaterial (#66); `hasCodeValues` deferred.
- Known medical coding systems: map to Coding System NAL / Wikidata when an authoritative IRI is available in DDI (not invented).
