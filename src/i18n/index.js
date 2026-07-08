import React from "react"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import { DEFAULT_LANGUAGE, localizePath } from "./config"

import es from "./locales/es/common.json"
import en from "./locales/en/common.json"
import ptBr from "./locales/pt-br/common.json"

const resources = {
  es: { common: es },
  en: { common: en },
  "pt-br": { common: ptBr },
}

const instances = {}

export const getI18nInstance = language => {
  const lang = resources[language] ? language : DEFAULT_LANGUAGE
  if (!instances[lang]) {
    const instance = i18next.createInstance()
    instance.use(initReactI18next).init({
      lng: lang,
      fallbackLng: DEFAULT_LANGUAGE,
      resources,
      defaultNS: "common",
      interpolation: { escapeValue: false }, // React ya escapa
      returnEmptyString: false, // string vacío en EN/PT cae al español
      initImmediate: false, // init síncrono: necesario para SSR
    })
    instances[lang] = instance
  }
  return instances[lang]
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
