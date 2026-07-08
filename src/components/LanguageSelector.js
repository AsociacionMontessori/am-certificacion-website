import React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../i18n"
import { LANGUAGES, LANGUAGE_CODES } from "../i18n/config"
import { storeLanguageChoice } from "../i18n/browser-language"

/*
 * Banderas como SVG inline (los emoji de bandera no se renderizan en
 * Windows/Chrome). El recorte circular lo hace el wrapper con
 * rounded-full + overflow-hidden; preserveAspectRatio "slice" llena la burbuja.
 */
const FlagMX = () => (
  <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
    <rect width="8" height="24" fill="#006847" />
    <rect x="8" width="8" height="24" fill="#ffffff" />
    <rect x="16" width="8" height="24" fill="#CE1126" />
    <circle cx="12" cy="12" r="2.2" fill="#8C6239" opacity="0.85" />
  </svg>
)

const FlagUS = () => (
  <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
    <rect width="24" height="24" fill="#ffffff" />
    {[0, 2, 4, 6].map(i => (
      <rect key={i} y={i * (24 / 7)} width="24" height={24 / 7} fill="#B22234" />
    ))}
    <rect width="11" height={24 * (4 / 7)} fill="#3C3B6E" />
    {[
      [2.2, 2.6], [5.5, 2.6], [8.8, 2.6],
      [3.85, 5.4], [7.15, 5.4],
      [2.2, 8.2], [5.5, 8.2], [8.8, 8.2],
      [3.85, 11], [7.15, 11],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="0.7" fill="#ffffff" />
    ))}
  </svg>
)

const FlagBR = () => (
  <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
    <rect width="24" height="24" fill="#009C3B" />
    <polygon points="12,3.5 20.5,12 12,20.5 3.5,12" fill="#FEDF00" />
    <circle cx="12" cy="12" r="3.7" fill="#002776" />
    <path d="M8.6 11.2 C 10.8 10.4, 13.6 10.9, 15.4 12.6" stroke="#ffffff" strokeWidth="0.7" fill="none" />
  </svg>
)

const FLAGS = {
  es: FlagMX,
  en: FlagUS,
  "pt-br": FlagBR,
}

/**
 * Selector de idioma de un clic con burbujas de bandera.
 * Lleva a la misma página en el otro idioma y guarda la elección explícita:
 * a partir de ahí no se vuelve a auto-redirigir por idioma del navegador.
 */
export default function LanguageSelector({ textColor = "text-black", className = "" }) {
  const { t } = useTranslation()
  const { language, originalPath, localizedPath } = useLocalization()

  return (
    <nav
      aria-label={t("languageSelector.ariaLabel")}
      className={`flex items-center gap-2 ${className}`}
    >
      {LANGUAGE_CODES.map(code => {
        const lang = LANGUAGES[code]
        const Flag = FLAGS[code]
        const isCurrent = code === language
        return (
          <Link
            key={code}
            to={localizedPath(originalPath, code)}
            lang={lang.htmlLang}
            hrefLang={lang.htmlLang}
            title={lang.name}
            aria-label={lang.name}
            aria-current={isCurrent ? "true" : undefined}
            onClick={() => storeLanguageChoice(code)}
            className={`block h-7 w-7 rounded-full overflow-hidden shadow-md transition-all duration-200 ${
              isCurrent
                ? "ring-2 ring-blue ring-offset-1 scale-110"
                : "opacity-60 hover:opacity-100 hover:scale-110"
            }`}
          >
            <Flag />
          </Link>
        )
      })}
    </nav>
  )
}
