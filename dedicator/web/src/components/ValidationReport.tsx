import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/context'
import { parseShaclReport, type ShaclGroup, type ShaclSeverity } from '../lib/shacl'
import { shortIri } from '../lib/rdf'

type Props = {
  reportTtl: string | null
  validated: boolean
  shaclConfigured?: boolean
}

const SEVERITY_ORDER: ShaclSeverity[] = ['Violation', 'Warning', 'Info', 'Other']

function GroupRow({ group, defaultOpen }: { group: ShaclGroup; defaultOpen?: boolean }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(Boolean(defaultOpen))
  return (
    <div className={`val-group sev-${group.severity.toLowerCase()}`}>
      <button type="button" className="val-group-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={`chev ${open ? 'open' : ''}`} aria-hidden>
          ▸
        </span>
        <span className={`sev-pill sev-${group.severity.toLowerCase()}`}>{group.severity}</span>
        <span className="val-count">{group.count}</span>
        <span className="val-msg">{group.message}</span>
        {(group.path || group.component) && (
          <span className="val-meta">
            {group.path && <code>{group.path}</code>}
            {group.component && <code>{group.component}</code>}
          </span>
        )}
      </button>
      {open && (
        <ul className="val-issues">
          {group.issues.map((issue) => (
            <li key={issue.id}>
              <div>
                <span className="label">{t('val.focus')}</span>
                <code title={issue.focusNode}>{shortIri(issue.focusNode)}</code>
              </div>
              {issue.path && (
                <div>
                  <span className="label">{t('val.path')}</span>
                  <code>{issue.path}</code>
                </div>
              )}
              {issue.value && (
                <div>
                  <span className="label">{t('val.value')}</span>
                  <code title={issue.value}>{shortIri(issue.value)}</code>
                </div>
              )}
              {issue.component && (
                <div>
                  <span className="label">{t('val.constraint')}</span>
                  <code>{issue.component}</code>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ValidationReport({ reportTtl, validated, shaclConfigured }: Props) {
  const { t } = useI18n()
  const report = useMemo(() => parseShaclReport(reportTtl), [reportTtl])
  const [filter, setFilter] = useState<ShaclSeverity | 'All'>('All')
  const [query, setQuery] = useState('')

  if (!validated || !reportTtl) {
    if (shaclConfigured === false) {
      return <p className="muted">{t('val.noJar')}</p>
    }
    return <p className="muted">{t('val.noReport')}</p>
  }

  if (!report) {
    return <p className="muted">{t('val.parseError')}</p>
  }

  const groups = report.groups.filter((g) => {
    if (filter !== 'All' && g.severity !== filter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      g.message.toLowerCase().includes(q) ||
      g.path.toLowerCase().includes(q) ||
      g.component.toLowerCase().includes(q) ||
      g.issues.some((i) => i.focusNode.toLowerCase().includes(q))
    )
  })

  return (
    <div className="val-report">
      <header className="val-summary">
        <div>
          <p className="val-kicker">{t('val.kicker')}</p>
          <h3>
            {report.conforms === true
              ? t('val.conforms')
              : report.conforms === false
                ? t('val.notConforms')
                : t('val.report')}
          </h3>
        </div>
        <div className="val-stats">
          {SEVERITY_ORDER.map((sev) =>
            report.bySeverity[sev] ? (
              <button
                key={sev}
                type="button"
                className={`sev-stat sev-${sev.toLowerCase()} ${filter === sev ? 'active' : ''}`}
                onClick={() => setFilter((f) => (f === sev ? 'All' : sev))}
              >
                <strong>{report.bySeverity[sev]}</strong>
                <span>{sev}</span>
              </button>
            ) : null,
          )}
          <button
            type="button"
            className={`sev-stat sev-all ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            <strong>{report.total}</strong>
            <span>{t('val.all')}</span>
          </button>
        </div>
      </header>

      <div className="val-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('val.filter')}
        />
        <span className="muted">
          {t(groups.length === 1 ? 'val.groups' : 'val.groups_plural', { count: groups.length })}
        </span>
      </div>

      <div className="val-groups">
        {groups.length === 0 && <p className="muted">{t('val.noMatch')}</p>}
        {groups.map((g) => (
          <GroupRow key={g.key} group={g} />
        ))}
      </div>
    </div>
  )
}
