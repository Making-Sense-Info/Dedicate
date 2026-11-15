import { useMemo, useState } from 'react'
import type { RdfIndex, ResourceView } from '../lib/rdf'

type Props = {
  index: RdfIndex
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ExploreView({ index, selectedId, onSelect }: Props) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return index.resources
    return index.resources.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.id.toLowerCase().includes(needle) ||
        r.types.some((t) => t.toLowerCase().includes(needle)),
    )
  }, [index.resources, q])

  const selected: ResourceView | null = selectedId ? index.byId.get(selectedId) ?? null : null

  return (
    <div className="explore">
      <aside className="explore-list">
        <input
          className="explore-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter resources…"
        />
        <ul>
          {filtered.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={r.id === selectedId ? 'active' : ''}
                onClick={() => onSelect(r.id)}
              >
                <strong>{r.title}</strong>
                <span>{r.types[0] ?? 'Resource'}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="explore-detail">
        {!selected && <p className="muted">Select a resource to inspect its title and attributes.</p>}
        {selected && (
          <>
            <header className="explore-hero">
              <p className="explore-type">{selected.types.join(' · ') || 'Resource'}</p>
              <h3>{selected.title}</h3>
              <code>{selected.id}</code>
            </header>

            <h4>Attributes</h4>
            {selected.attributes.length === 0 ? (
              <p className="muted">No literal attributes.</p>
            ) : (
              <div className="mini-table-wrap">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.attributes.map((a, i) => (
                      <tr key={`${a.predicate}-${i}`}>
                        <td title={a.predicate}>{a.predicateShort}</td>
                        <td>{a.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h4>Outgoing links</h4>
            {selected.linksOut.length === 0 ? (
              <p className="muted">None</p>
            ) : (
              <ul className="link-list">
                {selected.linksOut.map((l, i) => (
                  <li key={`${l.target}-${i}`}>
                    <span className="pred">{l.predicateShort}</span>
                    <button type="button" className="linkish" onClick={() => onSelect(l.target)}>
                      {l.targetLabel}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <h4>Incoming links</h4>
            {selected.linksIn.length === 0 ? (
              <p className="muted">None</p>
            ) : (
              <ul className="link-list">
                {selected.linksIn.map((l, i) => (
                  <li key={`${l.source}-${i}`}>
                    <button type="button" className="linkish" onClick={() => onSelect(l.source)}>
                      {l.sourceLabel}
                    </button>
                    <span className="pred">→ {l.predicateShort}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
