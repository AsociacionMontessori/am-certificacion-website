import React from "react"
import { I18nextProvider } from "react-i18next"
import { getI18nInstance, PageLanguageContext } from "./index"
import { parsePath } from "./config"

/**
 * Envuelve cada página con el provider de i18next y el contexto de idioma.
 * Compartido por gatsby-browser.js y gatsby-ssr.js para que el HTML
 * pre-renderizado ya salga en el idioma correcto.
 */
const wrapPageElement = ({ element, props }) => {
  const fromContext =
    props.pageContext && props.pageContext.language
      ? {
          language: props.pageContext.language,
          originalPath: props.pageContext.originalPath,
        }
      : parsePath(props.location.pathname)

  return (
    <I18nextProvider i18n={getI18nInstance(fromContext.language)}>
      <PageLanguageContext.Provider value={fromContext}>
        {element}
      </PageLanguageContext.Provider>
    </I18nextProvider>
  )
}

export default wrapPageElement
