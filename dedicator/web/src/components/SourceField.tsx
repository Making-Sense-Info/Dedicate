import { useI18n } from '../i18n/context'

export type SourceSample = {
  id: string
  label: string
  url: string
}

type Props = {
  label: string
  hint?: string
  accept: string
  file: File | null
  url: string
  onFile: (file: File | null) => void
  onUrl: (url: string) => void
  urlPlaceholder?: string
  /** Optional third mode: preset sample URLs (e.g. Dedicate DDI examples). */
  samples?: SourceSample[]
  sampleNoneLabel?: string
}

export function SourceField({
  label,
  hint,
  accept,
  file,
  url,
  onFile,
  onUrl,
  urlPlaceholder = 'https://…',
  samples,
  sampleNoneLabel,
}: Props) {
  const { t } = useI18n()
  const hasSamples = Boolean(samples?.length)
  const selectedSampleId =
    samples?.find((s) => s.url === url.trim() && !file)?.id ?? ''

  return (
    <div className={`source-field${hasSamples ? ' has-samples' : ''}`}>
      <div className="source-head">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      <div className={`source-modes${hasSamples ? ' with-sample' : ''}`}>
        <label className="source-file">
          <span>{t('source.file')}</span>
          <input
            type="file"
            accept={accept}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              onFile(f)
              if (f) onUrl('')
            }}
          />
          {file && <em className="file-name">{file.name}</em>}
        </label>
        <label className="source-url">
          <span>{t('source.url')}</span>
          <input
            type="url"
            value={url}
            placeholder={urlPlaceholder}
            onChange={(e) => {
              onUrl(e.target.value)
              if (e.target.value.trim()) onFile(null)
            }}
          />
        </label>
        {hasSamples && (
          <label className="source-sample">
            <span>{t('source.sample')}</span>
            <select
              value={selectedSampleId}
              onChange={(e) => {
                const id = e.target.value
                if (!id) {
                  if (selectedSampleId) onUrl('')
                  return
                }
                const sample = samples?.find((s) => s.id === id)
                if (!sample) return
                onFile(null)
                onUrl(sample.url)
              }}
            >
              <option value="">{sampleNoneLabel ?? t('source.sample.none')}</option>
              {samples!.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  )
}
