import React from "react"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import { DEFAULT_LANGUAGE, localizePath, parsePath } from "./config"

// Un JSON por namespace e idioma (ver src/i18n/locales/<idioma>/)
const NAMESPACES = [
  "common",
  "home",
  "diplomados",
  "faq",
  "contact",
  "publicaciones",
  "programs",
  "roxana",
  "directorio",
  "ia",
  "legal",
  "checkout",
  "footer",
]

const loadLocale = lang => {
  const resources = {}
  NAMESPACES.forEach(ns => {
    // require estático por idioma para que webpack los empaquete
    resources[ns] = require(`./locales/${lang}/${ns}.json`)
  })
  return resources
}

const resources = {
  es: loadLocale("es"),
  en: loadLocale("en"),
  "pt-br": loadLocale("pt-br"),
}

const instances = {}

export const getI18nInstance = language => {
  const lang = resources[language] ? language : DEFAULT_LANGUAGE
  if (!instances[lang]) {
    const instance = i18next.createInstance()
    instance.use(initReactI18next).init({
      lng: lang,
      // Nuestro código es «pt-br» (minúsculas, igual que la ruta); sin esto
      // i18next lo normaliza a «pt-BR», no encuentra recursos y cae al español.
      lowerCaseLng: true,
      fallbackLng: DEFAULT_LANGUAGE,
      resources,
      ns: NAMESPACES,
      defaultNS: "common",
      interpolation: { escapeValue: false }, // React ya escapa
      returnEmptyString: false, // string vacío en EN/PT cae al español
      initImmediate: false, // init síncrono: necesario para SSR
    })
    instances[lang] = instance
  }
  return instances[lang]
}

/**
 * t para los `export const Head` de las páginas: el Head de Gatsby se renderiza
 * FUERA de wrapPageElement, así que no hay provider; se resuelve el idioma
 * desde el pathname y se usa la instancia directamente.
 *
 *   export const Head = ({ location }) => {
 *     const t = getT(location.pathname, "home")
 *     return <Seo title={t("seo.title")} … />
 *   }
 */
export const getT = (pathname, namespace = "common") => {
  const { language } = parsePath(pathname)
  return getI18nInstance(language).getFixedT(language, namespace)
}

export const PageLanguageContext = React.createContext({
  language: DEFAULT_LANGUAGE,
  originalPath: "/",
})

/**
 * Hook para componentes de página: idioma actual, ruta canónica en español
 * y helper para construir links en el idioma actual (u otro).
 */
export const useLocalization = () => {
  const { language, originalPath } = React.useContext(PageLanguageContext)
  const localizedPath = (path, lang = language) => localizePath(lang, path)
  return { language, originalPath, localizedPath }
}
