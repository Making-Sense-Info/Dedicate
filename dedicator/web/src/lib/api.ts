export type RunResult = {
  ok: boolean
  turtle: string
  reportHtml: string | null
  reportTtl: string | null
  validated: boolean
  log?: string
  shapes?: string | null
  shaclConfigured?: boolean
}

export type Health = {
  ok: boolean
  invoke: boolean
  invokeScript?: string
  platform?: string
  default_xsl: boolean
  shacl_jar: boolean
  default_shapes: string
  java: boolean
}

const apiBase = ''

export async function fetchHealth(): Promise<Health> {
  const res = await fetch(`${apiBase}/api/health`)
  if (!res.ok) throw new Error(`Health check failed (${res.status})`)
  return res.json()
}

export async function runPipeline(input: {
  ddi?: File | null
  ddiUrl?: string
  xsl?: File | null
  xslUrl?: string
  shapes?: File | null
  shapesUrl?: string
  validate: boolean
}): Promise<RunResult> {
  const body = new FormData()
  if (input.ddi) body.append('ddi', input.ddi)
  if (input.ddiUrl?.trim()) body.append('ddi_url', input.ddiUrl.trim())
  if (input.xsl) body.append('xsl', input.xsl)
  if (input.xslUrl?.trim()) body.append('xsl_url', input.xslUrl.trim())
  if (input.shapes) body.append('shapes', input.shapes)
  if (input.shapesUrl?.trim()) body.append('shapes_url', input.shapesUrl.trim())
  body.append('run_validation', input.validate ? 'true' : 'false')

  const res = await fetch(`${apiBase}/api/run`, { method: 'POST', body })
  if (!res.ok) {
    let detail: unknown = await res.text()
    try {
      detail = JSON.parse(String(detail))
    } catch {
      /* keep text */
    }
    const msg =
      typeof detail === 'object' && detail && 'detail' in detail
        ? JSON.stringify((detail as { detail: unknown }).detail, null, 2)
        : String(detail)
    throw new Error(msg || `Request failed (${res.status})`)
  }
  return res.json()
}
