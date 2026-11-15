import { useEffect, useMemo, useRef } from 'react'
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import type { RdfIndex } from '../lib/rdf'

type Props = {
  index: RdfIndex
  focusId: string | null
  onSelect: (id: string) => void
}

/** Interactive RDF graph: drag nodes; double-click toggles neighbor visibility. */
export function CytoscapeGraph({ index, focusId, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const expandedRef = useRef<Set<string>>(new Set())

  const seedIds = useMemo(() => {
    if (focusId && index.byId.has(focusId)) return [focusId]
    // Prefer typed Dataset / Catalog / Column if present
    const preferred = index.resources.filter((r) =>
      r.types.some((t) => /Dataset|Catalog|Distribution|Column|Table/i.test(t)),
    )
    return (preferred.length ? preferred : index.resources).slice(0, 12).map((r) => r.id)
  }, [index, focusId])

  useEffect(() => {
    if (!hostRef.current) return

    const styles = getComputedStyle(document.documentElement)
    const ink = styles.getPropertyValue('--ink').trim() || '#101820'
    const soft = styles.getPropertyValue('--ink-soft').trim() || '#4a5560'
    const accent = styles.getPropertyValue('--accent').trim() || '#c45d7a'
    const accent2 = styles.getPropertyValue('--accent-2').trim() || '#4a5560'
    const surface = styles.getPropertyValue('--surface-solid').trim() || '#fff'
    const line = styles.getPropertyValue('--line').trim() || '#ccc'

    expandedRef.current = new Set(seedIds)

    const buildElements = (): ElementDefinition[] => {
      const visible = new Set<string>(expandedRef.current)
      // include neighbors of expanded nodes
      for (const id of [...expandedRef.current]) {
        for (const n of index.adjacency.get(id) ?? []) visible.add(n)
      }

      const nodes: ElementDefinition[] = [...visible]
        .filter((id) => index.byId.has(id))
        .map((id) => {
          const r = index.byId.get(id)!
          return {
            group: 'nodes' as const,
            data: {
              id,
              label: r.title.slice(0, 42),
            },
            classes: expandedRef.current.has(id) ? 'open' : '',
          }
        })

      const edges: ElementDefinition[] = []
      let ei = 0
      for (const id of visible) {
        const r = index.byId.get(id)
        if (!r) continue
        for (const l of r.linksOut) {
          if (!visible.has(l.target)) continue
          edges.push({
            data: {
              id: `e${ei++}`,
              source: id,
              target: l.target,
              label: l.predicateShort,
            },
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
            'font-family': 'Syne, sans-serif',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '90px',
            width: '96px',
            height: '96px',
            shape: 'round-rectangle',
            'overlay-padding': '4px',
          },
        },
        {
          selector: 'node.open',
          style: {
            'border-color': accent,
            'border-width': 3,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.4,
            'line-color': line,
            'target-arrow-color': soft,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '9px',
            color: soft,
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
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
      ] as cytoscape.StylesheetStyle[],
      layout: { name: 'cose', animate: true, animationDuration: 450, padding: 30 },
      wheelSensitivity: 0.25,
    })

    cyRef.current = cy

    const relayout = () => {
      cy.elements().remove()
      cy.add(buildElements())
      cy.layout({ name: 'cose', animate: true, animationDuration: 400, padding: 28 }).run()
    }

    cy.on('tap', 'node', (evt) => {
      onSelect(evt.target.id())
    })

    cy.on('dbltap', 'node', (evt) => {
      const id = evt.target.id()
      if (expandedRef.current.has(id)) expandedRef.current.delete(id)
      else expandedRef.current.add(id)
      relayout()
      onSelect(id)
    })

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [index, seedIds, onSelect])

  useEffect(() => {
    const cy = cyRef.current
    if (!cy || !focusId || !cy.$id(focusId).length) return
    cy.nodes().unselect()
    cy.$id(focusId).select()
    cy.animate({ center: { eles: cy.$id(focusId) }, duration: 280 })
  }, [focusId])

  return (
    <div className="cy-wrap">
      <div className="cy-toolbar">
        <span className="muted">
          Drag nodes · scroll zoom · double-click a node to expand / collapse neighbors
        </span>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            const cy = cyRef.current
            if (!cy) return
            cy.fit(undefined, 40)
          }}
        >
          Fit
        </button>
      </div>
      <div ref={hostRef} className="cy-host" />
    </div>
  )
}
