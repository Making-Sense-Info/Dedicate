import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en } from './en'
import { fr } from './fr'
import {
  resolveInitialLocale,
  translate,
  writeStoredLocale,
} from './resolve'
import { I18nContext } from './store'
import type { Locale } from './types'

const catalogs = { en, fr } as const

/** Provider only — hook lives in `useI18n.ts` so Vite Fast Refresh stays happy. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale())

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeStoredLocale(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(catalogs[locale], key, vars),
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
