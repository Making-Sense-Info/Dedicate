# Dedicate roadmap

- [x] Map from DDI-L to main DCAT classes and DCAT-AP mandatory and recommended properties
- [x] Implementation of step 1 (XSL) — first pass in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/) (graceful on incomplete DDI; not generative from SSSOM yet)
- [ ] Add mapping for selected DCAT-AP optional properties
- [ ] Implementation of step 2
- [x] Mapping extension for variables (DDI Variable / LogicalRecord → HealthDCAT-AP `hasVariables` + CSVW) in [`ddi-lifecycle-dcat-ap-mapping.ttl`](./ddi-lifecycle-dcat-ap-mapping.ttl)
- [x] XSL implementation of the `variables` mapping set in [`ddi-l-to-healthdcat-ap/`](./ddi-l-to-healthdcat-ap/)
- [ ] Extension of the mapping to HealthDCAT-AP (remaining properties: healthCategory, accessRights, hdab, …)


## Ideas

- Use [SSSOM](https://mapping-commons.github.io/sssom/dev/) to express the mappings
- Generate the XSL (or other runtime) from a richer executable SSSOM (today the TTL is curated spec; XSL is hand-written)

## Questions

- How to link DDI Lifecycle concepts to CSVW `propertyURL`? → see SSSOM `variables/conceptreference-to-propertyurl` (still low confidence / TODO)
- 🆕 How to produce mandatory CV-based field like [`healthCategory`](https://data.health.europa.eu/healthdcat-ap/releases/release-8/#properties-with-controlled-vocabularies-that-must-be-used-for-the-listed-properties)?
- 🆕 Same question with the access rights?
