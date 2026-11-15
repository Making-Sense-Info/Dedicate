import { useI18n } from '../i18n/context'

type Props = {
  ddi: string
  shapes: string
  onHome?: () => void
}

/** Reminder of the DDI + SHACL sources the current result views apply to. */
export function RunSourcesBar({ ddi, shapes, onHome }: Props) {
  const { t } = useI18n()

  return (
    <aside className="run-sources" aria-label="Input sources for this run">
      <div>
        <span className="run-sources-k">{t('sources.ddi')}</span>
        <code title={ddi}>{ddi}</code>
      </div>
      <div>
        <span className="run-sources-k">{t('sources.shacl')}</span>
        <code title={shapes}>{shapes}</code>
      </div>
      {onHome && (
        <button type="button" className="ghost run-sources-home" onClick={onHome}>
          {t('sources.home')}
        </button>
      )}
    </aside>
  )
}
