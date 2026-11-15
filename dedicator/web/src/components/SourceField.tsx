import { useI18n } from '../i18n/context'

type Props = {
  label: string
  hint?: string
  accept: string
  file: File | null
  url: string
  onFile: (file: File | null) => void
  onUrl: (url: string) => void
  urlPlaceholder?: string
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
}: Props) {
  const { t } = useI18n()

  return (
    <div className="source-field">
      <div className="source-head">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      <div className="source-modes">
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
      </div>
    </div>
  )
}
