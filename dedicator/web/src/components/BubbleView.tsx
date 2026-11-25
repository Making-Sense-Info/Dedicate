import { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { type Core, type ElementDefinition, type StylesheetStyle } from 'cytoscape'
import { useI18n } from '../i18n/context'
import type { RdfIndex, ResourceView } from '../lib/rdf'
import { isDataset } from '../lib/rdf'

type Props = {
  index: RdfIndex
}

/** Dataset bubbles first; double-click expands neighbors; click shows details. */
export function BubbleView({ index }: Props) {
  const { t } = useI18n()
  const hostRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const visibleRef = useRef<Set<string>>(new Set())
  const [selected, setSelected] = useState<ResourceView | null>(null)

  const seed = useMemo(() => {
    const ds = index.datasets
    if (ds.length) return ds.map((d) => d.id)
    return index.resources.slice(0, 8).map((r) => r.id)
  }, [index])

  useEffect(() => {
    if (!hostRef.current) return
    visibleRef.current = new Set(seed)
    setSelected(null)

    const styles = getComputedStyle(document.documentElement)
    const ink = styles.getPropertyValue('--ink').trim() || '#101820'
    const accent = styles.getPropertyValue('--accent').trim() || '#c45d7a'
    const accent2 = styles.getPropertyValue('--accent-2').trim() || '#4a5560'
    const surface = styles.getPropertyValue('--surface-solid').trim() || '#fff'

    const buildElements = (): ElementDefinition[] => {
      const visible = visibleRef.current
      const nodes: ElementDefinition[] = [...visible]
        .filter((id) => index.byId.has(id))
        .map((id) => {
          const r = index.byId.get(id)!
          const ds = isDataset(r)
          return {
            group: 'nodes' as const,
            data: {
              id,
              label: r.title.slice(0, 36),
              kind: ds ? 'dataset' : 'other',
            },
            classes: ds ? 'dataset' : 'other',
          }
        })

      const edges: ElementDefinition[] = []
      let i = 0
      for (const id of visible) {
        const r = index.byId.get(id)
        if (!r) continue
        for (const l of r.linksOut) {
          if (!visible.has(l.target)) continue
          edges.push({
            group: 'edges',
            data: { id: `e${i++}`, source: id, target: l.target, label: l.predicateShort },
          })
        }
      }
      return [...nodes, ...edges]
    }

    const cy = cytoscape({
      container: hostRef.current,
      elements: buildElements(),
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': surface,
            'border-width': 2,
            'border-color': accent2,
            color: ink,
            'font-size': '11px',
            'font-family': 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '88px',
            width: '88px',
            height: '88px',
            shape: 'ellipse',
          },
        },
        {
          selector: 'node.dataset',
          style: {
            width: '118px',
            height: '118px',
            'border-width': 3,
            'background-color': `color-mix(in srgb, ${accent2} 14%, ${surface})`,
            'font-size': '12px',
            'font-weight': 700,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.4,
            'line-color': ink,
            'target-arrow-color': ink,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '10px',
            color: ink,
            'text-outline-width': 2,
            'text-outline-color': surface,
            'text-rotation': 'autorotate',
          },
        },
        {
          selector: ':selected',
          style: {
            'border-color': accent,
            'line-color': accent,
            'target-arrow-color': accent,
          },
        },
      ] as StylesheetStyle[],
      layout: { name: 'cose', animate: true, animationDuration: 420, padding: 36 },
      wheelSensitivity: 0.25,
    })
    cyRef.current = cy

    const relayout = () => {
      cy.elements().remove()
      cy.add(buildElements())
      cy.layout({ name: 'cose', animate: true, animationDuration: 380, padding: 32 }).run()
    }

    cy.on('tap', 'node', (evt) => {
      const id = String(evt.target.id())
      setSelected(index.byId.get(id) ?? null)
    })

    cy.on('dbltap', 'node', (evt) => {
      const id = String(evt.target.id())
      const r = index.byId.get(id)
      if (!r) return
      let added = false
      for (const l of r.linksOut) {
        if (index.byId.has(l.target) && !visibleRef.current.has(l.target)) {
          visibleRef.current.add(l.target)
          added = true
        }
      }
      for (const l of r.linksIn) {
        if (index.byId.has(l.source) && !visibleRef.current.has(l.source)) {
          visibleRef.current.add(l.source)
          added = true
        }
      }
      if (added) relayout()
      setSelected(r)
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) setSelected(null)
    })

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [index, seed])

  return (
    <div className="bubbles pane-inner">
      <header className="view-intro">
        <h3>{t('bubbles.title')}</h3>
        <p>
          {t('bubbles.introBefore')} <code>dcat:Dataset</code> {t('bubbles.introAfter')}
        </p>
      </header>
      <div className="bubbles-layout">
        <div className="cy-wrap tight">
          <div className="cy-toolbar">
            <span className="muted">{t('bubbles.hint')}</span>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                visibleRef.current = new Set(seed)
                setSelected(null)
                const cy = cyRef.current
                if (!cy) return
                cy.elements().remove()
                const styles = getComputedStyle(document.documentElement)
                void styles
                cy.add(
                  [...seed]
                    .filter((id) => index.byId.has(id))
                    .map((id) => {
                      const r = index.byId.get(id)!
                      return {
                        group: 'nodes' as const,
                        data: { id, label: r.title.slice(0, 36) },
                        classes: isDataset(r) ? 'dataset' : 'other',
                      }
                    }),
                )
                cy.layout({ name: 'cose', animate: true, animationDuration: 380, padding: 32 }).run()
              }}
            >
              {t('bubbles.reset')}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => cyRef.current?.fit(undefined, 40)}
            >
              {t('bubbles.fit')}
            </button>
          </div>
          <div ref={hostRef} className="cy-host" />
        </div>
        <aside className={`bubble-detail ${selected ? 'open' : ''}`}>
          {!selected && <p className="muted">{t('bubbles.click')}</p>}
          {selected && (
            <>
              <p className="explore-type">{selected.types.join(' · ') || t('resource')}</p>
              <h4>{selected.title}</h4>
              <code className="tiny-id">{selected.id}</code>
              <table className="mini-table">
                <tbody>
                  {selected.attributes.map((a, i) => (
                    <tr key={`${a.predicate}-${i}`}>
                      <td>{a.predicateShort}</td>
                      <td>{a.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selected.linksOut.length > 0 && (
                <>
                  <h5>{t('bubbles.links')}</h5>
                  <ul className="link-list">
                    {selected.linksOut.map((l, i) => (
                      <li key={`${l.target}-${i}`}>
                        <span className="pred">{l.predicateShort}</span>
                        <span>{l.targetLabel}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
