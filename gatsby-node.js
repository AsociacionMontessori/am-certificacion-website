const fs = require("fs")
const path = require("path")
const {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  isLocalizedPath,
  localizePath,
  normalizePath,
} = require("./src/i18n/config")
const { PROGRAM_LANDING_ROUTES } = require("./src/data/programLandingRoutes")
const { loadWordPressPosts } = require("./src/services/wordpressNodeSource")

exports.createPages = ({ actions }) => {
  const component = path.resolve("./src/templates/programLandingPage.js")

  PROGRAM_LANDING_ROUTES.forEach(route => {
    const originalPath = `/diplomados/${route.slug}/`
    LANGUAGE_CODES.forEach(language => {
      actions.createPage({
        path: localizePath(language, originalPath),
        component,
        context: { language, originalPath, programId: route.id },
      })
    })
  })
}

exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type WordpressEditorialPost implements Node {
      wordpressId: String!
      slug: String!
      sourceContentId: String!
      url: String!
      title: String!
      excerpt: String!
      date: Date! @dateformat
      modified: Date! @dateformat
      author: String!
      imageUrl: String
      imageCardUrl: String
      imageSrcSet: String
      imageAlt: String!
      imageWidth: Int
      imageHeight: Int
    }
  `)
}

exports.sourceNodes = async ({
  actions,
  createNodeId,
  createContentDigest,
  reporter,
}) => {
  const { posts } = await loadWordPressPosts({ reporter })
  posts.forEach(post => {
    actions.createNode({
      ...post,
      wordpressId: post.id,
      id: createNodeId(`wordpress-editorial-${post.id}`),
      parent: null,
      children: [],
      internal: {
        type: "WordpressEditorialPost",
        contentDigest: createContentDigest(post),
      },
    })
  })
}

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

exports.onPostBuild = ({ reporter }) => {
  const publicDir = path.join(process.cwd(), "public")
  let sanitizedFiles = 0

  const sanitizeDirectory = directory => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        sanitizeDirectory(entryPath)
        return
      }
      if (!entry.isFile() || !entry.name.endsWith(".html")) return

      const contents = fs.readFileSync(entryPath)
      if (!contents.includes(0)) return

      fs.writeFileSync(
        entryPath,
        contents.filter(byte => byte !== 0)
      )
      sanitizedFiles += 1
    })
  }

  sanitizeDirectory(publicDir)
  if (sanitizedFiles > 0) {
    reporter.info(
      `Removed NUL bytes from ${sanitizedFiles} generated HTML files`
    )
  }
}
