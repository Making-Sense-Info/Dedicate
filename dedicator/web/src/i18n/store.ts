import { createContext } from 'react'
import type { Locale } from './types'

export type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nValue | null>(null)
