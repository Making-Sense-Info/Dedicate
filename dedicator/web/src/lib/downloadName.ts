/** Basename of a DDI file or URL path, without extension (for download stems). */
export function ddiStem(file: File | null | undefined, url: string | undefined): string {
  let raw = ''
  if (file?.name) {
    raw = file.name
  } else {
    const u = (url ?? '').trim()
    if (u) {
      try {
        const path = new URL(u).pathname
        raw = decodeURIComponent(path.split('/').filter(Boolean).pop() ?? '')
      } catch {
        raw = u.split(/[\\/]/).pop() ?? ''
      }
    }
  }
  const stem = raw.replace(/\.(xml|ddi)(\.gz)?$/i, '').trim()
  return stem || 'ddi'
}

export function validationReportFilename(stem: string): string {
  return `${stem || 'ddi'}-validation.ttl`
}
