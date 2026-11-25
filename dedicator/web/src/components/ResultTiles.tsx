import { useI18n } from '../i18n/useI18n'
import type { MainTab } from '../lib/tabs'

type Tile = {
  id: MainTab
  titleKey: string
  blurbKey: string
  icon: 'check' | 'code' | 'tree' | 'table' | 'bubbles'
}

const TILES: Tile[] = [
  { id: 'conformity', titleKey: 'tab.conformity', blurbKey: 'tiles.conformity.blurb', icon: 'check' },
  { id: 'turtle', titleKey: 'tab.turtle', blurbKey: 'tiles.turtle.blurb', icon: 'code' },
  { id: 'hierarchy', titleKey: 'tab.hierarchy', blurbKey: 'tiles.hierarchy.blurb', icon: 'tree' },
  { id: 'graph-table', titleKey: 'tab.graphTable', blurbKey: 'tiles.graphTable.blurb', icon: 'table' },
  { id: 'bubbles', titleKey: 'tab.bubbles', blurbKey: 'tiles.bubbles.blurb', icon: 'bubbles' },
]

type Props = {
  showConformity: boolean
  violationCount: number | null
  onOpen: (tab: MainTab) => void
}

function TileIcon({ kind }: { kind: Tile['icon'] }) {
  const common = {
    width: 36,
    height: 36,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    'aria-hidden': true as const,
  }
  switch (kind) {
    case 'check':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="14" />
          <path d="M16 24.5 21.5 30 32 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'code':
      return (
        <svg {...common}>
          <path d="M16 18 10 24l6 6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 18l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 14 22 34" strokeLinecap="round" />
        </svg>
      )
    case 'tree':
      return (
        <svg {...common}>
          <circle cx="24" cy="12" r="4" />
          <circle cx="14" cy="30" r="4" />
          <circle cx="34" cy="30" r="4" />
          <path d="M24 16v6M24 22 14 26M24 22l10 4" strokeLinecap="round" />
        </svg>
      )
    case 'table':
      return (
        <svg {...common}>
          <rect x="10" y="12" width="16" height="14" rx="2" />
          <rect x="22" y="22" width="16" height="14" rx="2" />
          <path d="M26 19h6M14 29v-3" strokeLinecap="round" />
        </svg>
      )
    case 'bubbles':
      return (
        <svg {...common}>
          <circle cx="18" cy="22" r="8" />
          <circle cx="32" cy="16" r="5" />
          <circle cx="33" cy="32" r="6" />
        </svg>
      )
  }
}

export function ResultTiles({ showConformity, violationCount, onOpen }: Props) {
  const { t } = useI18n()
  const tiles = TILES.filter((tile) => tile.id !== 'conformity' || showConformity)

  return (
    <section className="result-tiles" aria-label={t('tiles.title')}>
      <header className="result-tiles-head">
        <h2>{t('tiles.title')}</h2>
        <p>{t('tiles.intro')}</p>
      </header>
      <div className="result-tiles-grid">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className="result-tile"
            onClick={() => onOpen(tile.id)}
          >
            <span className={`result-tile-ico kind-${tile.icon}`}>
              <TileIcon kind={tile.icon} />
            </span>
            <span className="result-tile-copy">
              <strong>
                {t(tile.titleKey)}
                {tile.id === 'conformity' && violationCount != null ? ` (${violationCount})` : ''}
              </strong>
              <span>{t(tile.blurbKey)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
