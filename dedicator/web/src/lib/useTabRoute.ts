import { useCallback, useEffect, useState } from 'react'
import { pathForTab, tabFromPath, type MainTab } from './tabs'

const KNOWN = new Set(['/', '/home', '/conformity', '/turtle', '/hierarchy', '/graph-table', '/bubbles'])

/**
 * Sync main tab with the browser URL (History API) so back/forward work.
 */
export function useTabRoute(initial: MainTab = 'home') {
  const [tab, setTabState] = useState<MainTab>(() => {
    if (typeof window === 'undefined') return initial
    return tabFromPath(window.location.pathname)
  })

  useEffect(() => {
    const raw = window.location.pathname.replace(/\/+$/, '') || '/'
    if (!KNOWN.has(raw)) {
      window.history.replaceState(null, '', '/')
      setTabState('home')
      return
    }
    if (raw === '/home') {
      window.history.replaceState(null, '', '/')
      setTabState('home')
    }
  }, [])

  useEffect(() => {
    function onPopState() {
      setTabState(tabFromPath(window.location.pathname))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setTab = useCallback((next: MainTab, opts?: { replace?: boolean }) => {
    const path = pathForTab(next)
    if (path !== window.location.pathname) {
      if (opts?.replace) window.history.replaceState(null, '', path)
      else window.history.pushState(null, '', path)
    }
    setTabState(next)
  }, [])

  return { tab, setTab } as const
}
