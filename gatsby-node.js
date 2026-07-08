const {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  isLocalizedPath,
  localizePath,
  normalizePath,
} = require("./src/i18n/config")

/**
 * Duplica las páginas públicas localizables en /en/… y /pt-br/….
 * El español conserva TODAS sus URLs actuales en la raíz.
 * Toda página recibe pageContext.language y originalPath para el SEO y el selector.
 */
exports.onCreatePage = ({ page, actions }) => {
  const { createPage, deletePage } = actions

  // Página ya creada por este hook: no volver a procesarla.
  if (page.context && page.context.language) return

  const originalPath = normalizePath(page.path)

  deletePage(page)
  createPage({
    ...page,
    context: { ...page.context, language: DEFAULT_LANGUAGE, originalPath },
  })

  if (!isLocalizedPath(originalPath)) return

  LANGUAGE_CODES.filter(code => code !== DEFAULT_LANGUAGE).forEach(language => {
    createPage({
      ...page,
      path: localizePath(language, originalPath),
      context: { ...page.context, language, originalPath },
    })
  })
}
