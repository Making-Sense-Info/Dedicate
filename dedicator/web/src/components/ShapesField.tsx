import { useI18n } from '../i18n/useI18n'
import { SHAPES_PRESETS, shapesPreset, type ShapesPresetId } from '../lib/shapes'

type Props = {
  preset: ShapesPresetId
  onPreset: (id: ShapesPresetId) => void
  file: File | null
  url: string
  onFile: (file: File | null) => void
  onUrl: (url: string) => void
}

export function ShapesField({ preset, onPreset, file, url, onFile, onUrl }: Props) {
  const { t } = useI18n()
  const current = shapesPreset(preset)
  const isOther = preset === 'other'

  return (
    <div className="source-field shapes-field">
      <div className="source-head">
        <span>{t('shapes.label')}</span>
        <small>{t('shapes.hint')}</small>
      </div>

      <label className="shapes-select">
        <span>{t('shapes.accessLevel')}</span>
        <select
          value={preset}
          onChange={(e) => onPreset(e.target.value as ShapesPresetId)}
        >
          {SHAPES_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fileName ? `${t(p.labelKey)} — ${p.fileName}` : t(p.labelKey)}
            </option>
          ))}
        </select>
      </label>

      <p className="shapes-desc muted">{t(current.descKey)}</p>

      {!isOther && current.url && current.fileName && (
        <p className="shapes-url muted">
          <code title={current.url}>{current.fileName}</code>
          <a className="shapes-open" href={current.url} target="_blank" rel="noreferrer">
            {t('shapes.openUrl')}
          </a>
        </p>
      )}

      {isOther && (
        <div className="source-modes">
          <label className="source-file">
            <span>{t('source.file')}</span>
            <input
              type="file"
              accept=".ttl,.rdf,.owl,text/turtle"
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
              placeholder="https://…/shapes.ttl"
              onChange={(e) => {
                onUrl(e.target.value)
                if (e.target.value.trim()) onFile(null)
              }}
            />
          </label>
        </div>
      )}
    </div>
  )
}
