export type DdiSampleId = 'example' | 'example-errors'

export type DdiSample = {
  id: DdiSampleId
  labelKey: string
  url: string
}

const RAW_BASE =
  'https://raw.githubusercontent.com/Making-Sense-Info/Dedicate/refs/heads/main/ddi-l-to-healthdcat-ap/in'

export const DDI_SAMPLES: DdiSample[] = [
  {
    id: 'example',
    labelKey: 'ddi.sample.example',
    url: `${RAW_BASE}/ddil-example.xml`,
  },
  {
    id: 'example-errors',
    labelKey: 'ddi.sample.errors',
    url: `${RAW_BASE}/ddil-example-errors.xml`,
  },
]

export function ddiSampleByUrl(url: string): DdiSample | undefined {
  const u = url.trim()
  return DDI_SAMPLES.find((s) => s.url === u)
}
