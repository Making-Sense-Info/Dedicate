/**
 * HealthDCAT-AP Release 8 access-level SHACL shapes from the spec
 * (Validation of HealthDCAT-AP) + Other for custom URL/file.
 * Labels / descriptions live in i18n.
 */

const SHAPES_DIR =
  'https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes'

export type ShapesPresetId = 'public' | 'restricted' | 'non-public' | 'other'

export type ShapesPreset = {
  id: ShapesPresetId
  fileName: string | null
  url: string | null
  labelKey: string
  descKey: string
}

/** Spec order: public → restricted → non-public, then Other. */
export const SHAPES_PRESETS: ShapesPreset[] = [
  {
    id: 'public',
    fileName: 'public-shapes.ttl',
    url: `${SHAPES_DIR}/public-shapes.ttl`,
    labelKey: 'shapes.public',
    descKey: 'shapes.public.desc',
  },
  {
    id: 'restricted',
    fileName: 'restricted-shapes.ttl',
    url: `${SHAPES_DIR}/restricted-shapes.ttl`,
    labelKey: 'shapes.restricted',
    descKey: 'shapes.restricted.desc',
  },
  {
    id: 'non-public',
    fileName: 'non-public-shapes.ttl',
    url: `${SHAPES_DIR}/non-public-shapes.ttl`,
    labelKey: 'shapes.nonPublic',
    descKey: 'shapes.nonPublic.desc',
  },
  {
    id: 'other',
    fileName: null,
    url: null,
    labelKey: 'shapes.other',
    descKey: 'shapes.other.desc',
  },
]

export const DEFAULT_SHAPES_PRESET: ShapesPresetId = 'non-public'

export function shapesPreset(id: ShapesPresetId): ShapesPreset {
  return SHAPES_PRESETS.find((p) => p.id === id) ?? SHAPES_PRESETS[2]!
}

export function shapesPresetUrl(id: ShapesPresetId): string | null {
  return shapesPreset(id).url
}
