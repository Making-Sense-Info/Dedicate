# Dedicate roadmap

- [x] Map from DDI-L to main DCAT classes and DCAT-AP mandatory and recommended properties
- [ ] Implementation of step 1 (XSL)
- [ ] Add mapping for selected DCAT-AP optional properties
- [ ] Implementation of step 2
- [ ] Extension of the mapping to HealthDCAT-AP
- [x] Mapping extension for variables (DDI Variable / LogicalRecord → HealthDCAT-AP `hasVariables` + CSVW) in [`ddi-lifecycle-dcat-ap-mapping.ttl`](./ddi-lifecycle-dcat-ap-mapping.ttl)
- [x] XSL implementation of the `variables` mapping set in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/)


## Ideas

- Use [SSSOM](https://mapping-commons.github.io/sssom/dev/) to express the mappings

## Questions

- 🆕 How to link DDI Lifecycle concepts to CSVW `propertyURL` ([see here](https://data.health.europa.eu/healthdcat-ap/releases/release-8/#Column))?
- 🆕 How to produce mandatory CV-based field like [`healthCategory`](https://data.health.europa.eu/healthdcat-ap/releases/release-8/#properties-with-controlled-vocabularies-that-must-be-used-for-the-listed-properties)?
- 🆕 Same question with the access rights?
