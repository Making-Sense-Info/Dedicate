import { useEffect, useMemo, useState } from 'react'
import { useI18n } from './i18n/context'
import { runPipeline, type RunResult } from './lib/api'
import { buildRdfIndex } from './lib/rdf'
import { parseShaclReport } from './lib/shacl'
import {
  DEFAULT_SHAPES_PRESET,
  shapesPreset as getShapesPreset,
  shapesPresetUrl,
  type ShapesPresetId,
} from './lib/shapes'
import type { MainTab } from './lib/tabs'
import { SourceField } from './components/SourceField'
import { ShapesField } from './components/ShapesField'
import { RunSourcesBar } from './components/RunSourcesBar'
import { ResultTiles } from './components/ResultTiles'
import { HierarchyView } from './components/HierarchyView'
import { GraphTableView } from './components/GraphTableView'
import { BubbleView } from './components/BubbleView'
import { ValidationReport } from './components/ValidationReport'
import { SiteFooter } from './components/SiteFooter'
import { LangSwitch } from './components/LangSwitch'
import './App.css'

type RunSources = {
  ddi: string
  shapes: string
}

function sourceLabel(file: File | null, url: string, empty: string): string {
  if (file) return `local:${file.name}`
  const u = url.trim()
  if (u) return u
  return empty
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dedicator-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('dedicator-theme', theme)
  }, [theme])
  return { theme, setTheme }
}

export default function App() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [tab, setTab] = useState<MainTab>('home')

  const [ddiFile, setDdiFile] = useState<File | null>(null)
  const [ddiUrl, setDdiUrl] = useState('')
  const [shapesPreset, setShapesPreset] = useState<ShapesPresetId>(DEFAULT_SHAPES_PRESET)
  const [shapesFile, setShapesFile] = useState<File | null>(null)
  const [shapesOtherUrl, setShapesOtherUrl] = useState('')
  const [validate, setValidate] = useState(true)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [runSources, setRunSources] = useState<RunSources | null>(null)
  /** Last successful run asked for Sparna validation (drives Conformité tab). */
  const [wantedValidation, setWantedValidation] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const index = useMemo(() => {
    if (!result?.turtle) return null
    try {
      return buildRdfIndex(result.turtle)
    } catch {
      return null
    }
  }, [result?.turtle])

  useEffect(() => {
    if (!index) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !index.byId.has(selectedId)) {
      setSelectedId(index.datasets[0]?.id ?? index.resources[0]?.id ?? null)
    }
  }, [index, selectedId])

  const shaclView = useMemo(() => parseShaclReport(result?.reportTtl), [result?.reportTtl])
  const violationCount = shaclView?.bySeverity.Violation ?? null
  const showConformity = wantedValidation

  const hasDdi = Boolean(ddiFile || ddiUrl.trim())
  const readyTabs = Boolean(result && index)

  const resolvedShapesUrl =
    shapesPreset === 'other' ? shapesOtherUrl.trim() : (shapesPresetUrl(shapesPreset) ?? '')
  const hasShapes =
    shapesPreset !== 'other' || Boolean(shapesFile || shapesOtherUrl.trim())

  function onShapesPreset(id: ShapesPresetId) {
    setShapesPreset(id)
    if (id !== 'other') {
      setShapesFile(null)
      setShapesOtherUrl('')
    }
  }

  async function onRun() {
    if (!hasDdi) {
      setError(t('run.error.ddi'))
      return
    }
    if (validate && !hasShapes) {
      setError(t('run.error.shapes'))
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setRunSources(null)
    setWantedValidation(false)
    setSelectedId(null)
    setTab('home')
    try {
      const shapesForRun = shapesPreset === 'other' ? shapesFile : null
      const shapesUrlForRun =
        shapesPreset === 'other'
          ? shapesFile
            ? undefined
            : shapesOtherUrl
          : resolvedShapesUrl

      const out = await runPipeline({
        ddi: ddiFile,
        ddiUrl: ddiFile ? undefined : ddiUrl,
        shapes: validate ? shapesForRun : undefined,
        shapesUrl: validate ? shapesUrlForRun : undefined,
        validate,
      })
      setResult(out)
      setWantedValidation(validate)
      const presetMeta = getShapesPreset(shapesPreset)
      setRunSources({
        ddi: sourceLabel(ddiFile, ddiUrl, '—'),
        shapes: validate
          ? shapesPreset === 'other'
            ? sourceLabel(shapesFile, shapesOtherUrl, '—')
            : `${t(presetMeta.labelKey)}: ${resolvedShapesUrl}`
          : t('run.shapesSkipped'),
      })
      setTab('home')
    } catch (e) {
      setResult(null)
      setRunSources(null)
      setWantedValidation(false)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function go(next: MainTab) {
    if (next !== 'home' && !readyTabs) return
    if (next === 'conformity' && !showConformity) return
    setTab(next)
  }

  const sourcesBar =
    runSources && tab !== 'home' ? (
      <RunSourcesBar {...runSources} onHome={() => go('home')} />
    ) : null

  return (
    <div className={`shell ${busy ? 'is-busy' : ''}`}>
      <div className="orb orb-a" aria-hidden />
      <div className="orb orb-b" aria-hidden />

      {busy && (
        <div className="run-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="run-overlay-card">
            <span className="spinner run-overlay-spinner" aria-hidden />
            <strong>{t('run.running')}</strong>
            <p>{t('run.running.hint')}</p>
          </div>
        </div>
      )}

      <header className={`topbar ${readyTabs ? 'has-tabs' : 'brand-only'}`}>
        <div className="brand-block">
          <div className="brand-mark" aria-hidden>
            <span />
          </div>
          <div>
            <p className="kicker">{t('brand.kicker')}</p>
            <h1 className="brand">{t('brand.name')}</h1>
          </div>
        </div>

        {readyTabs && (
          <nav className="main-tabs" aria-label="Main">
            <button
              type="button"
              className={tab === 'home' ? 'active' : ''}
              onClick={() => go('home')}
            >
              {t('tab.home')}
            </button>
            {showConformity && (
              <button
                type="button"
                className={tab === 'conformity' ? 'active' : ''}
                onClick={() => go('conformity')}
              >
                {t('tab.conformity')}
                {violationCount != null ? ` (${violationCount})` : ''}
              </button>
            )}
            <button
              type="button"
              className={tab === 'turtle' ? 'active' : ''}
              onClick={() => go('turtle')}
            >
              {t('tab.turtle')}
            </button>
            <button
              type="button"
              className={tab === 'hierarchy' ? 'active' : ''}
              onClick={() => go('hierarchy')}
            >
              {t('tab.hierarchy')}
            </button>
            <button
              type="button"
              className={tab === 'graph-table' ? 'active' : ''}
              onClick={() => go('graph-table')}
            >
              {t('tab.graphTable')}
            </button>
            <button
              type="button"
              className={tab === 'bubbles' ? 'active' : ''}
              onClick={() => go('bubbles')}
            >
              {t('tab.bubbles')}
            </button>
          </nav>
        )}

        <div className="top-actions">
          <LangSwitch />
          <div className="theme-switch" role="group" aria-label={t('theme')}>
            <button
              type="button"
              className={theme === 'light' ? 'active' : ''}
              aria-pressed={theme === 'light'}
              onClick={() => setTheme('light')}
            >
              <span className="theme-ico" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              </span>
              <span className="theme-label">{t('theme.light')}</span>
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'active' : ''}
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
            >
              <span className="theme-ico" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
                </svg>
              </span>
              <span className="theme-label">{t('theme.dark')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="stage">
        {tab === 'home' && (
          <section className="home animate-in">
            <p className="tagline">{t('home.tagline')}</p>

            <div className="home-config">
              <SourceField
                label={t('ddi.label')}
                hint={t('ddi.hint')}
                accept=".xml,application/xml,text/xml"
                file={ddiFile}
                url={ddiUrl}
                onFile={setDdiFile}
                onUrl={setDdiUrl}
              />

              <div className="validate-choice" role="radiogroup" aria-label={t('tab.conformity')}>
                <button
                  type="button"
                  role="radio"
                  className={`validate-card ${validate ? 'active yes' : ''}`}
                  aria-checked={validate}
                  onClick={() => setValidate(true)}
                >
                  <span className="validate-card-k">
                    <span className="dot on" />
                    {t('validate.want')}
                  </span>
                  <span className="validate-card-d">{t('validate.want.desc')}</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  className={`validate-card ${!validate ? 'active no' : ''}`}
                  aria-checked={!validate}
                  onClick={() => setValidate(false)}
                >
                  <span className="validate-card-k">
                    <span className="dot off" />
                    {t('validate.skip')}
                  </span>
                  <span className="validate-card-d">{t('validate.skip.desc')}</span>
                </button>
              </div>
              {validate && (
                <>
                  <p className="validate-hint muted">
                    {t('validate.powered')}{' '}
                    <a
                      className="inline-link"
                      href="https://shacl-play.sparna.fr/play/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('validate.shaclPlay')}
                    </a>
                  </p>
                  <ShapesField
                    preset={shapesPreset}
                    onPreset={onShapesPreset}
                    file={shapesFile}
                    url={shapesOtherUrl}
                    onFile={setShapesFile}
                    onUrl={setShapesOtherUrl}
                  />
                </>
              )}
            </div>

            <div className="cta-row">
              <button type="button" className="run" disabled={busy || !hasDdi} onClick={onRun}>
                {busy ? <span className="spinner" aria-hidden /> : null}
                {busy
                  ? t('run.running')
                  : validate
                    ? t('run.transformValidate')
                    : t('run.transform')}
              </button>
            </div>

            {error && <pre className="error">{error}</pre>}

            {readyTabs && runSources && (
              <div className="run-success animate-in">
                <div className="run-success-banner">
                  <span className="dot on" />
                  <div>
                    <strong>{t('run.success.title')}</strong>
                    <p>{t('run.success.body')}</p>
                  </div>
                </div>
                <RunSourcesBar {...runSources} />
                <ResultTiles
                  showConformity={showConformity}
                  violationCount={violationCount}
                  onOpen={go}
                />
              </div>
            )}
          </section>
        )}

        {tab === 'conformity' && result && showConformity && (
          <div className="pane">
            {sourcesBar}
            <ValidationReport
              reportTtl={result.reportTtl}
              validated={result.validated}
              shaclConfigured={result.shaclConfigured}
            />
          </div>
        )}

        {tab === 'turtle' && result && (
          <div className="stack pane">
            {sourcesBar}
            <div className="toolbar">
              <button
                type="button"
                className="ghost"
                onClick={() => navigator.clipboard.writeText(result.turtle)}
              >
                {t('turtle.copy')}
              </button>
              <a
                className="ghost"
                href={`data:text/turtle;charset=utf-8,${encodeURIComponent(result.turtle)}`}
                download="healthdcat-ap.ttl"
              >
                {t('turtle.download')}
              </a>
            </div>
            <pre className="code">{result.turtle}</pre>
          </div>
        )}

        {tab === 'hierarchy' && index && (
          <div className="pane-stack">
            {sourcesBar}
            <HierarchyView index={index} onSelect={setSelectedId} />
          </div>
        )}

        {tab === 'graph-table' && index && (
          <div className="pane-stack">
            {sourcesBar}
            <GraphTableView index={index} onSelect={setSelectedId} />
          </div>
        )}

        {tab === 'bubbles' && index && (
          <div className="pane-stack">
            {sourcesBar}
            <BubbleView index={index} />
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
