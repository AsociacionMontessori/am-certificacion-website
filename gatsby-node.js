const {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  isLocalizedPath,
  localizePath,
  normalizePath,
} = require("./src/i18n/config")
const { loadWordPressPosts } = require("./src/services/wordpressNodeSource")

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
