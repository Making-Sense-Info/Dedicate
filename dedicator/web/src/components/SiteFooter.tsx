import { useI18n } from '../i18n/useI18n'

const SITE = 'https://making-sense.info/'
const LINKEDIN = 'https://www.linkedin.com/company/making-sense-info/'
const MAIL = 'mailto:contact@making-sense.info'

export function SiteFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <a className="site-footer-brand" href={SITE} target="_blank" rel="noopener noreferrer">
        <img
          className="site-footer-logo site-footer-logo--on-light"
          src="/logo-making-sense-dark.svg"
          alt="Making Sense"
          width={148}
          height={36}
        />
        <img
          className="site-footer-logo site-footer-logo--on-dark"
          src="/logo-making-sense-light.svg"
          alt="Making Sense"
          width={148}
          height={36}
        />
      </a>

      <p className="site-footer-copy">{t('footer.copy', { year })}</p>

      <div className="site-footer-links">
        <a
          href={LINKEDIN}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('footer.linkedin')}
          title="LinkedIn"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.34h4.52V23H.24V8.34zM8.34 8.34h4.33v2h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.42 3.02 5.42 6.94V23h-4.52v-6.66c0-1.59-.03-3.63-2.21-3.63-2.21 0-2.55 1.73-2.55 3.51V23H8.34V8.34z"
            />
          </svg>
        </a>
        <a href={MAIL} aria-label={t('footer.mail')} title="contact@making-sense.info">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3.5 7.5 12 13l8.5-5.5" />
          </svg>
        </a>
      </div>
    </footer>
  )
}
