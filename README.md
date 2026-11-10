# Dedicate

## Introduction

This repository details how to produce [DCAT](https://www.w3.org/TR/vocab-dcat-3/) metadata for resources documented in [DDI](https://ddialliance.org/). The [roadmap](./ROADMAP.md) gives more detail on the operations planned.

A common base for the different use cases is the [model-level mapping](./model-mapping.md) between DDI and DCAT.
The curated SSSOM file is [`ddi-lifecycle-dcat-ap-mapping.ttl`](./ddi-lifecycle-dcat-ap-mapping.ttl) (Catalog / Dataset / Distribution for DCAT-AP, plus a `variables` set targeting HealthDCAT-AP `hasVariables` + CSVW).

## Implementation

A [first implementation](./ddi-l-to-healthdcat-ap/README.md) is available to produce HealthDCAT-AP from DDI-l 3.3.

## Common resources

- [Data Catalog Vocabulary (DCAT) - Version 3](https://www.w3.org/TR/vocab-dcat-3/)
- DDI Lifecycle 3.3 [schema documentation](https://docs.ddialliance.org/DDI-Lifecycle/3.3/xmlschema/index.html)
- [DDI Data Documentation 3.3](https://ddialliance.github.io/ddimodel-web/DDI-L-3.3/)
- [HealthDCAT-AP specification](https://healthdataeu.pages.code.europa.eu/healthdcat-ap/releases/latest/) (latest)
- [TEHDAS2 deliverables](https://tehdas.eu/results/)
- [Metadata Catalog](https://catalogue-metadonnees.health-data-hub.fr/) of the French Health Data Hub, with its [editor](https://editor.catalogue-metadonnees.health-data-hub.fr/)
- [QUANTUM Data Quality Labelling Tool](https://github.com/quantum-label/quantum_labelling_tool/tree/1.1.0)
- [EDDI 2024 presentation](https://zenodo.org/records/14823393) on "Mapping PhysicalInstance and DCAT" by Christophe Dzikowski, Insee

This work is sponsored by [Making Sense](https://making-sense.info/), the [Constances Cohort](https://www.constances.fr/) and the [CASD](https://casd.eu/).

## AI usage

Some drafting and coding tasks may use large language models as assistive tools.

Humans remain responsible for design choices, review, and what is committed to this repository.
