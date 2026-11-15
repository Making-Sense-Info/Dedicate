import { useState } from 'react'
import { useI18n } from '../i18n/context'
import type { RdfIndex, ResourceView } from '../lib/rdf'

type Props = {
  index: RdfIndex
  onSelect?: (id: string) => void
}

function Node({
  resource,
  index,
  depth,
  ancestors,
  onSelect,
}: {
  resource: ResourceView
  index: RdfIndex
  depth: number
  ancestors: Set<string>
  onSelect?: (id: string) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(depth < 1)
  const children = resource.linksOut
    .map((l) => ({ link: l, child: index.byId.get(l.target) }))
    .filter((x): x is { link: (typeof resource.linksOut)[0]; child: ResourceView } => Boolean(x.child))
    .filter((x) => !ancestors.has(x.child.id))

  const nextAncestors = new Set(ancestors)
  nextAncestors.add(resource.id)

  return (
    <div className="tree-node" style={{ marginLeft: depth ? '1rem' : 0 }}>
      <div className="tree-row">
        <button
          type="button"
          className={`chev ${open ? 'open' : ''} ${children.length ? '' : 'ghost-chev'}`}
          disabled={!children.length}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t('hierarchy.collapse') : t('hierarchy.expand')}
        >
          ▸
        </button>
        <button type="button" className="tree-main" onClick={() => onSelect?.(resource.id)}>
          <span className="tree-type">{resource.types[0] ?? t('resource')}</span>
          <strong>{resource.title}</strong>
        </button>
      </div>

      {open && (
        <div className="tree-body">
          {resource.attributes.length > 0 && (
            <table className="mini-table tree-attrs">
              <tbody>
                {resource.attributes.slice(0, 8).map((a, i) => (
                  <tr key={`${a.predicate}-${i}`}>
                    <td>{a.predicateShort}</td>
                    <td>{a.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {children.map(({ link, child }) => (
            <div key={`${link.predicate}-${child.id}`} className="tree-child">
              <span className="tree-edge">{link.predicateShort}</span>
              <Node
                resource={child}
                index={index}
                depth={depth + 1}
                ancestors={nextAncestors}
                onSelect={onSelect}
              />
            </div>
          ))}
          {!children.length && resource.attributes.length === 0 && (
            <p className="muted tiny">{t('hierarchy.noLinks')}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function HierarchyView({ index, onSelect }: Props) {
  const { t } = useI18n()
  const roots = index.datasets.length ? index.datasets : index.resources.slice(0, 8)

  if (!roots.length) {
    return <p className="muted">{t('hierarchy.empty')}</p>
  }

  const count = index.datasets.length
    ? ` (${index.datasets.length})`
    : t('hierarchy.fallback')

  return (
    <div className="hierarchy pane-inner">
      <header className="view-intro">
        <h3>{t('hierarchy.title')}</h3>
        <p>
          {t('hierarchy.introBefore')} <code>dcat:Dataset</code>
          {t('hierarchy.introAfter', { count })}
        </p>
      </header>
      <div className="tree-roots">
        {roots.map((r) => (
          <Node
            key={r.id}
            resource={r}
            index={index}
            depth={0}
            ancestors={new Set()}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
