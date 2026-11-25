import { useI18n } from '../i18n/useI18n'
import type { Locale } from '../i18n/types'

const OPTIONS: Locale[] = ['en', 'fr']

export function LangSwitch() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="lang-switch" role="group" aria-label={t('lang')}>
      {OPTIONS.map((code) => (
        <button
          key={code}
          type="button"
          className={locale === code ? 'active' : ''}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
        >
          {t(`lang.${code}`)}
        </button>
      ))}
    </div>
  )
}
