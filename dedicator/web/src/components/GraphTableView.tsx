import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/context'
import type { RdfIndex } from '../lib/rdf'

type Props = {
  index: RdfIndex
  onSelect?: (id: string) => void
}

type Pos = { x: number; y: number; w: number; h: number }

export function GraphTableView({ index, onSelect }: Props) {
  const { t } = useI18n()
  const boardRef = useRef<HTMLDivElement>(null)
  const [boardW, setBoardW] = useState(0)
  const seeds = useMemo(
    () => (index.datasets.length ? index.datasets : index.resources.slice(0, 5)).map((r) => r.id),
    [index],
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [positions, setPositions] = useState<Record<string, Pos>>({})

  useEffect(() => {
    setExpandedIds(new Set())
  }, [index])

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const measure = () => setBoardW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const visible = useMemo(() => {
    const set = new Set(seeds)
    for (const id of expandedIds) {
      const r = index.byId.get(id)
      if (!r) continue
      for (const l of r.linksOut) {
        if (index.byId.has(l.target)) set.add(l.target)
      }
    }
    return [...set]
  }, [seeds, expandedIds, index])

  useEffect(() => {
    const next: Record<string, Pos> = {}
    const avail = boardW > 0 ? boardW : 900
    const pad = avail < 560 ? 12 : 24
    const gapX = avail < 560 ? 12 : 40
    const gapY = avail < 560 ? 16 : 60
    const cardW =
      avail < 640
        ? Math.max(200, Math.min(280, avail - pad * 2))
        : 280
    const cardH = avail < 560 ? 180 : 200
    const strideX = cardW + gapX
    const strideY = cardH + gapY
    const cols =
      avail < 640
        ? 1
        : Math.max(1, Math.min(Math.ceil(Math.sqrt(visible.length)), Math.floor((avail - pad) / strideX) || 1))

    visible.forEach((id, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      next[id] = { x: pad + col * strideX, y: pad + row * strideY, w: cardW, h: cardH }
    })
    setPositions(next)
  }, [visible, boardW])

  const edges = useMemo(() => {
    const set = new Set(visible)
    const out: { from: string; to: string; label: string }[] = []
    for (const id of visible) {
      const r = index.byId.get(id)
      if (!r) continue
      for (const l of r.linksOut) {
        if (set.has(l.target)) out.push({ from: id, to: l.target, label: l.predicateShort })
      }
    }
    return out
  }, [index, visible])

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const minCanvas = boardW > 0 ? boardW : 320
  const width = Math.max(minCanvas, ...Object.values(positions).map((p) => p.x + p.w + 24), 0)
  const height = Math.max(boardW < 560 ? 320 : 520, ...Object.values(positions).map((p) => p.y + p.h + 24), 0)

  return (
    <div className="graph-table pane-inner">
      <header className="view-intro">
        <h3>{t('graphTable.title')}</h3>
        <p>{t('graphTable.intro')}</p>
      </header>
      <div className="gt-board" ref={boardRef}>
        <div className="gt-canvas" style={{ width, height }}>
          <svg className="gt-edges" width={width} height={height}>
            {edges.map((e, i) => {
              const a = positions[e.from]
              const b = positions[e.to]
              if (!a || !b) return null
              const x1 = a.x + a.w / 2
              const y1 = a.y + a.h / 2
              const x2 = b.x + b.w / 2
              const y2 = b.y + b.h / 2
              const mx = (x1 + x2) / 2
              const my = (y1 + y2) / 2
              return (
                <g key={`${e.from}-${e.to}-${i}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} className="gt-line" />
                  <text x={mx} y={my - 6} className="gt-edge-label">
                    {e.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {visible.map((id) => {
            const r = index.byId.get(id)
            const pos = positions[id]
            if (!r || !pos) return null
            const isExpanded = expandedIds.has(id)
            const canToggle = r.linksOut.some((l) => index.byId.has(l.target))
            return (
              <article
                key={id}
                className="gt-card"
                style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h }}
                onClick={() => onSelect?.(id)}
              >
                <header>
                  <span>{r.types[0] ?? t('resource')}</span>
                  <strong>{r.title}</strong>
                </header>
                <div className="gt-card-body">
                  <table className="mini-table">
                    <tbody>
                      {r.attributes.map((a, i) => (
                        <tr key={`${a.predicate}-${i}`}>
                          <td>{a.predicateShort}</td>
                          <td>{a.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <footer>
                  <button
                    type="button"
                    className="ghost"
                    disabled={!canToggle && !isExpanded}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(id)
                    }}
                  >
                    {isExpanded ? t('graphTable.collapse') : t('graphTable.expand')}
                  </button>
                </footer>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
