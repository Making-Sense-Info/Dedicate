import type { Locale } from './types'

export const LOCALE_STORAGE_KEY = 'dedicator-locale'

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'fr'
}

/** Browser locale → fr if French, otherwise en (preferred when neither fr nor en). */
export function localeFromBrowser(): Locale {
  const candidates = [...(navigator.languages ?? []), navigator.language]
  for (const raw of candidates) {
    if (!raw) continue
    const primary = raw.toLowerCase().split('-')[0]
    if (primary === 'fr') return 'fr'
    if (primary === 'en') return 'en'
  }
  return 'en'
}

export function readStoredLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(saved) ? saved : null
  } catch {
    return null
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveInitialLocale(): Locale {
  return readStoredLocale() ?? localeFromBrowser()
}

export function translate(
  dict: Record<string, string>,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let out = dict[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{{${k}}}`, String(v))
    }
  }
  return out
}
