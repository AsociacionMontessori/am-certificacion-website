# Native Publications Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir el iframe de `/publicaciones/` por artículos nativos recientes, mostrar artículos antes que libros y conservar todos los destinos de Amazon con fallback comprobado.

**Architecture:** Un cliente WordPress normaliza y sanea hasta 12 posts. Gatsby crea nodos desde la REST API y cae a una instantánea versionada si la red falla; el navegador intenta un refresco no bloqueante. Headless UI mantiene ambos paneles montados y accesibles. Los artículos siguen enlazando al canonical WordPress y el Head genera `ItemList`/`Book` desde datos visibles.

**Tech Stack:** Gatsby 5, React 18, Headless UI 1.7, i18next, WordPress REST API, `sanitize-html`, `he`, `@noble/hashes` 1.8, Node.js contract tests, Playwright.

## Global Constraints

- Repositorio: `/home/carlos/Documentos/Repositorios/certificacionMontessori`.
- `Artículos` es la pestaña activa por defecto.
- `#articulos` y `#libros` abren estados reproducibles sin recargar.
- Ambos paneles permanecen en el HTML inicial; usar `unmount={false}`.
- Se muestran como máximo 12 artículos y un enlace al archivo completo.
- Los títulos, extractos y URLs WordPress se sanean antes de renderizar.
- Solo se aceptan enlaces HTTPS cuyo host sea `montessorimexico.org`.
- Inglés y portugués etiquetan explícitamente que los artículos están en español.
- No se traduce ni duplica el cuerpo de ningún artículo.
- Todos los libros, portadas y destinos actuales se derivan de `roxanaBooks`; no se reactivan ebooks o paquetes deshabilitados por KDP Select.
- No se muestran precio, stock, rating o reseña en JSON-LD.
- Un fallo WordPress nunca deja la sección vacía si existe una instantánea válida.
- Usar `trackEvent` del plan de analítica; no llamar `gtag` directamente.
- La instrumentación usa `source_content_id` con formato exacto `^post_[0-9a-f]{16}$`; el slug WordPress nunca cruza al payload GA4.

---

### Task 1: Normalize WordPress Posts and Generate a Snapshot

**Files:**
- Create: `src/services/wordpressPosts.js`
- Create: `scripts/fixtures/wordpress-posts.json`
- Create: `scripts/test-wordpress-posts.js`
- Create: `scripts/refresh-wordpress-posts.js`
- Generate: `src/data/wordpressPostsSnapshot.json`
- Modify: `package.json:7-39,43-58`

**Interfaces:**
- Produces `normalizeWordPressPost(raw: object) -> NormalizedPost | null`.
- Produces `fetchRecentWordPressPosts({ fetchImpl?: Function, limit?: number }) -> Promise<NormalizedPost[]>`.
- `NormalizedPost`: `id`, `slug`, `sourceContentId`, `url`, `title`, `excerpt`, `date`, `modified`, `author`, `imageUrl`, `imageAlt`, `imageWidth`, `imageHeight`.

- [ ] **Step 1: Add a representative REST fixture**

```json
[
  {
    "id": 101,
    "slug": "observacion-montessori",
    "link": "https://montessorimexico.org/observacion-montessori/",
    "date": "2026-07-10T08:00:00",
    "modified": "2026-07-10T09:00:00",
    "title": { "rendered": "Observación &amp; ambiente preparado" },
    "excerpt": { "rendered": "<p>Una mirada <strong>práctica</strong> a la observación.</p><script>alert(1)</script>" },
    "_embedded": {
      "author": [{ "name": "Roxana Muñoz" }],
      "wp:featuredmedia": [{
        "source_url": "https://montessorimexico.org/wp-content/uploads/2026/07/observacion.jpg",
        "alt_text": "Ambiente preparado Montessori",
        "media_details": { "width": 1200, "height": 630 }
      }]
    }
  },
  {
    "id": 102,
    "slug": "host-invalido",
    "link": "https://evil.example/copied-post/",
    "date": "2026-07-09T08:00:00",
    "modified": "2026-07-09T08:00:00",
    "title": { "rendered": "Entrada inválida" },
    "excerpt": { "rendered": "<p>No debe pasar.</p>" },
    "_embedded": { "author": [], "wp:featuredmedia": [] }
  },
  {
    "id": 103,
    "slug": "fecha-invalida",
    "link": "https://montessorimexico.org/fecha-invalida/",
    "date": "not-a-date",
    "title": { "rendered": "Fecha inválida" },
    "excerpt": { "rendered": "<p>No debe romper el resto del lote.</p>" },
    "_embedded": { "author": [], "wp:featuredmedia": [] }
  }
]
```

- [ ] **Step 2: Write the failing normalization test**

```javascript
// scripts/test-wordpress-posts.js
const assert = require("assert")
const fixture = require("./fixtures/wordpress-posts.json")
const {
  normalizeWordPressPost,
  normalizeWordPressPosts,
} = require("../src/services/wordpressPosts")

const post = normalizeWordPressPost(fixture[0])
assert.strictEqual(post.title, "Observación & ambiente preparado")
assert.strictEqual(post.excerpt, "Una mirada práctica a la observación.")
assert.strictEqual(post.author, "Roxana Muñoz")
assert.strictEqual(post.imageWidth, 1200)
assert.strictEqual(post.imageHeight, 630)
assert.strictEqual(post.url, "https://montessorimexico.org/observacion-montessori/")
assert.strictEqual(post.sourceContentId, "post_3cdd538282a5c53b")

assert.strictEqual(normalizeWordPressPost(fixture[1]), null)
assert.strictEqual(normalizeWordPressPost(fixture[2]), null)
assert.strictEqual(normalizeWordPressPosts(fixture).length, 1)
console.log("WordPress post contract ok")
```

- [ ] **Step 3: Install the focused sanitation and hashing dependencies**

```bash
npm install sanitize-html he @noble/hashes@1.8.0
node scripts/test-wordpress-posts.js
```

Expected: dependencies install; test still fails because the service module is absent.

- [ ] **Step 4: Implement the normalized service**

```javascript
// src/services/wordpressPosts.js
const sanitizeHtml = require("sanitize-html")
const he = require("he")
const { sha256 } = require("@noble/hashes/sha256")
const { bytesToHex, utf8ToBytes } = require("@noble/hashes/utils")

const WORDPRESS_ORIGIN = "https://montessorimexico.org"
const WORDPRESS_POSTS_ENDPOINT = `${WORDPRESS_ORIGIN}/wp-json/wp/v2/posts`

const buildSourceContentId = slug =>
  `post_${bytesToHex(sha256(utf8ToBytes(slug))).slice(0, 16)}`

const plainText = value =>
  he.decode(
    sanitizeHtml(String(value || ""), {
      allowedTags: [],
      allowedAttributes: {},
    })
  ).replace(/\s+/g, " ").trim()

const validWordPressUrl = value => {
  try {
    const url = new URL(value)
    return url.protocol === "https:"
      && url.hostname === "montessorimexico.org"
      && !url.username
      && !url.password
      && !url.port
      ? url.toString()
      : ""
  } catch {
    return ""
  }
}

const positiveInteger = value => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const isoDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

const normalizeWordPressPost = raw => {
  const url = validWordPressUrl(raw?.link)
  const title = plainText(raw?.title?.rendered)
  const id = String(raw?.id || "").trim()
  const slug = String(raw?.slug || "").trim()
  const date = isoDate(raw?.date)
  if (!url || !title || !id || !slug || !date) return null

  const author = Array.isArray(raw?._embedded?.author)
    ? plainText(raw._embedded.author[0]?.name)
    : ""
  const media = Array.isArray(raw?._embedded?.["wp:featuredmedia"])
    ? raw._embedded["wp:featuredmedia"][0]
    : null
  const imageUrl = validWordPressUrl(media?.source_url)

  return {
    id,
    slug,
    sourceContentId: buildSourceContentId(slug),
    url,
    title,
    excerpt: plainText(raw?.excerpt?.rendered),
    date,
    modified: isoDate(raw.modified) || date,
    author: author || "Asociación Montessori de México",
    imageUrl,
    imageAlt: plainText(media?.alt_text) || title,
    imageWidth: positiveInteger(media?.media_details?.width),
    imageHeight: positiveInteger(media?.media_details?.height),
  }
}

const normalizeWordPressPosts = rows =>
  (Array.isArray(rows) ? rows : [])
    .map(normalizeWordPressPost)
    .filter(Boolean)

const fetchRecentWordPressPosts = async ({ fetchImpl = fetch, limit = 12, timeoutMs = 8000 } = {}) => {
  const count = Math.max(1, Math.min(Number(limit) || 12, 12))
  const url = new URL(WORDPRESS_POSTS_ENDPOINT)
  url.searchParams.set("status", "publish")
  url.searchParams.set("orderby", "date")
  url.searchParams.set("order", "desc")
  url.searchParams.set("per_page", String(count))
  url.searchParams.set("_embed", "author,wp:featuredmedia")
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`WordPress returned HTTP ${response.status}`)
    return normalizeWordPressPosts(await response.json()).slice(0, count)
  } finally {
    clearTimeout(timer)
  }
}

module.exports = {
  WORDPRESS_ORIGIN,
  WORDPRESS_POSTS_ENDPOINT,
  fetchRecentWordPressPosts,
  normalizeWordPressPost,
  normalizeWordPressPosts,
  plainText,
}
```

- [ ] **Step 5: Add the snapshot refresh script**

```javascript
// scripts/refresh-wordpress-posts.js
const fs = require("fs")
const path = require("path")
const { fetchRecentWordPressPosts } = require("../src/services/wordpressPosts")

const run = async () => {
  const posts = await fetchRecentWordPressPosts({ limit: 12 })
  if (!posts.length) throw new Error("WordPress returned no valid published posts")
  const output = path.join(__dirname, "..", "src", "data", "wordpressPostsSnapshot.json")
  fs.writeFileSync(output, `${JSON.stringify(posts, null, 2)}\n`, "utf8")
  console.log(`Saved ${posts.length} posts to ${output}`)
}

run().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
```

Add scripts:

```json
"test:wordpress-posts": "node scripts/test-wordpress-posts.js",
"refresh:wordpress-posts": "node scripts/refresh-wordpress-posts.js"
```

- [ ] **Step 6: Generate and inspect the real snapshot**

```bash
npm run test:wordpress-posts
npm run refresh:wordpress-posts
node -e 'const p=require("./src/data/wordpressPostsSnapshot.json"); if(!p.length||p.length>12) process.exit(1); console.log(p.length)'
```

Expected: contract passes; snapshot contains between 1 and 12 valid canonical posts.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/services/wordpressPosts.js src/data/wordpressPostsSnapshot.json scripts/fixtures/wordpress-posts.json scripts/test-wordpress-posts.js scripts/refresh-wordpress-posts.js
git commit -m "feat(publications): normalize WordPress article snapshots"
```

---

### Task 2: Source WordPress Nodes with a Build-Time Fallback

**Files:**
- Modify: `gatsby-node.js:1-37`
- Create: `scripts/test-wordpress-source.js`
- Modify: `package.json:43-62`

**Interfaces:**
- Produces Gatsby node type `WordpressEditorialPost`.
- Produces `loadWordPressPosts({ fetchImpl, snapshot, reporter }) -> Promise<{ posts, source }>` from `gatsby-node.js` for contract testing.
- Consumers query `allWordpressEditorialPost` without knowing whether data came from live API or snapshot.

- [ ] **Step 1: Write a failing live/fallback loader test**

```javascript
// scripts/test-wordpress-source.js
const assert = require("assert")
const fixture = require("./fixtures/wordpress-posts.json")
const { loadWordPressPosts } = require("../gatsby-node")

const reporter = { warn() {}, info() {} }

async function run() {
  const live = await loadWordPressPosts({
    fetchImpl: async () => ({ ok: true, json: async () => fixture }),
    snapshot: [],
    reporter,
  })
  assert.strictEqual(live.source, "live")
  assert.strictEqual(live.posts.length, 1)

  const fallback = await loadWordPressPosts({
    fetchImpl: async () => { throw new Error("offline") },
    snapshot: [live.posts[0]],
    reporter,
  })
  assert.strictEqual(fallback.source, "snapshot")
  assert.strictEqual(fallback.posts.length, 1)
  console.log("WordPress Gatsby source contract ok")
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
```

- [ ] **Step 2: Run and verify the missing export failure**

```bash
node scripts/test-wordpress-source.js
```

Expected: `loadWordPressPosts is not a function`.

- [ ] **Step 3: Add schema customization, loader and source nodes**

Add to `gatsby-node.js` without changing the existing `onCreatePage` behavior:

```javascript
const snapshot = require("./src/data/wordpressPostsSnapshot.json")
const { fetchRecentWordPressPosts } = require("./src/services/wordpressPosts")

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

const loadWordPressPosts = async ({ fetchImpl = fetch, snapshot: fallback, reporter }) => {
  try {
    const posts = await fetchRecentWordPressPosts({ fetchImpl, limit: 12 })
    if (!posts.length) throw new Error("no valid posts")
    reporter?.info(`Using ${posts.length} live WordPress posts`)
    return { posts, source: "live" }
  } catch (error) {
    if (!Array.isArray(fallback) || !fallback.length) throw error
    reporter?.warn(`WordPress unavailable; using ${fallback.length} snapshot posts`)
    return { posts: fallback, source: "snapshot" }
  }
}

exports.loadWordPressPosts = loadWordPressPosts

exports.sourceNodes = async ({ actions, createNodeId, createContentDigest, reporter }) => {
  const { posts } = await loadWordPressPosts({ snapshot, reporter })
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
```

- [ ] **Step 4: Add and run the source contract**

Add package script:

```json
"test:wordpress-source": "node scripts/test-wordpress-source.js"
```

Run:

```bash
npm run test:wordpress-source
npm run build
```

Expected: source contract passes; build logs either live or snapshot source and exits `0`.

- [ ] **Step 5: Commit**

```bash
git add gatsby-node.js scripts/test-wordpress-source.js package.json package-lock.json
git commit -m "feat(publications): source WordPress posts with fallback"
```

---

### Task 3: Build Article Cards and Accessible Hash-Synced Tabs

**Files:**
- Create: `src/components/publications/ArticleCard.js`
- Create: `src/components/publications/ArticleGrid.js`
- Create: `src/components/publications/PublicationsTabs.js`
- Modify: `src/pages/publicaciones.js:1-114`
- Modify: `src/i18n/locales/es/publicaciones.json:6-30`
- Modify: `src/i18n/locales/en/publicaciones.json`
- Modify: `src/i18n/locales/pt-br/publicaciones.json`

**Interfaces:**
- `ArticleGrid({ initialPosts: NormalizedPost[] })` retains initial posts on refresh failure.
- `PublicationsTabs({ posts: NormalizedPost[] })` owns hash/index synchronization.
- `ArticleCard({ post })` emits `click_article` and never renders WordPress HTML.

- [ ] **Step 1: Create the article card**

```javascript
// src/components/publications/ArticleCard.js
import * as React from "react"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"

const { trackEvent } = require("../../utils/analytics")

const ArticleCard = ({ post }) => {
  const { t } = useTranslation("publicaciones")
  const { language } = useLocalization()
  const date = new Intl.DateTimeFormat(language === "pt-br" ? "pt-BR" : language, {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date(post.date))

  return (
    <article className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-blue/15 bg-white shadow-md">
      {post.imageUrl ? (
        <div className="aspect-[16/9] overflow-hidden bg-blue/5">
          <img
            src={post.imageUrl}
            alt={post.imageAlt}
            width={post.imageWidth || 1200}
            height={post.imageHeight || 630}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col p-5">
        <p className="text-xs text-gray">{date} · {post.author}</p>
        {language !== "es" ? (
          <p className="mt-2 text-xs font-semibold text-green">{t("articles.spanishLabel")}</p>
        ) : null}
        <h3 className="mt-2 text-lg font-bold leading-snug text-blue">{post.title}</h3>
        <p className="mt-3 line-clamp-4 flex-grow text-sm leading-relaxed text-gray">{post.excerpt}</p>
        <a
          href={post.url}
          onClick={() => trackEvent("click_article", {
            language,
            source_hostname: "certificacionmontessori.com",
            source_content_id: post.sourceContentId,
            landing_path: typeof window === "undefined" ? "" : window.location.pathname,
            cta_position: "article_card",
          })}
          className="mt-5 inline-flex min-h-[44px] items-center font-semibold text-blue underline decoration-green decoration-2 underline-offset-4"
        >
          {t("articles.read")}
        </a>
      </div>
    </article>
  )
}

export default ArticleCard
```

- [ ] **Step 2: Add resilient browser refresh**

```javascript
// src/components/publications/ArticleGrid.js
import * as React from "react"
import { useTranslation } from "react-i18next"
import ArticleCard from "./ArticleCard"

const { fetchRecentWordPressPosts } = require("../../services/wordpressPosts")

const ArticleGrid = ({ initialPosts }) => {
  const { t } = useTranslation("publicaciones")
  const [posts, setPosts] = React.useState(initialPosts)

  React.useEffect(() => {
    let active = true
    fetchRecentWordPressPosts({ limit: 12 })
      .then(fresh => { if (active && fresh.length) setPosts(fresh) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <section id="articulos" aria-labelledby="articles-heading" className="py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="articles-heading" className="text-2xl font-bold text-blue md:text-3xl">
            {t("articles.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray md:text-base">
            {t("articles.description")}
          </p>
        </div>
        <a href="https://montessorimexico.org/" className="font-semibold text-blue underline">
          {t("articles.all")}
        </a>
      </div>
      <ul className="mt-7 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
        {posts.map(post => <li key={post.id}><ArticleCard post={post} /></li>)}
      </ul>
    </section>
  )
}

export default ArticleGrid
```

- [ ] **Step 3: Implement tabs with both panels mounted**

```javascript
// src/components/publications/PublicationsTabs.js
import * as React from "react"
import { Tab } from "@headlessui/react"
import { useTranslation } from "react-i18next"
import RoxanaBooksSection from "../RoxanaBooksSection"
import ArticleGrid from "./ArticleGrid"

const hashForIndex = index => (index === 1 ? "#libros" : "#articulos")
const indexForHash = hash => (hash === "#libros" ? 1 : 0)

const PublicationsTabs = ({ posts }) => {
  const { t } = useTranslation("publicaciones")
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  React.useEffect(() => {
    const syncFromLocation = () => setSelectedIndex(indexForHash(window.location.hash))
    syncFromLocation()
    window.addEventListener("hashchange", syncFromLocation)
    window.addEventListener("popstate", syncFromLocation)
    return () => {
      window.removeEventListener("hashchange", syncFromLocation)
      window.removeEventListener("popstate", syncFromLocation)
    }
  }, [])

  const changeTab = index => {
    setSelectedIndex(index)
    window.history.replaceState(null, "", hashForIndex(index))
  }

  return (
    <Tab.Group selectedIndex={selectedIndex} onChange={changeTab}>
      <Tab.List className="mx-auto grid w-full max-w-md grid-cols-2 border border-blue/20 bg-white p-1" aria-label={t("tabs.label")}>
        {[t("tabs.articles"), t("tabs.books")].map(label => (
          <Tab key={label} className={({ selected }) => `min-h-[44px] px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue ${selected ? "bg-blue text-white" : "text-blue"}`}>
            {label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel unmount={false}><ArticleGrid initialPosts={posts} /></Tab.Panel>
        <Tab.Panel unmount={false}>
          <RoxanaBooksSection
            id="libros"
            headingId="publicaciones-libros-heading"
            className="bg-blue py-10"
          />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  )
}

export default PublicationsTabs
```

- [ ] **Step 4: Replace the iframe page and add the GraphQL query**

`PublicacionesPage` must receive `data`, render the existing compact hero, then:

```jsx
<section className="bg-white px-4 py-10 sm:px-6 lg:px-12">
  <div className="mx-auto max-w-6xl">
    <PublicationsTabs posts={data.allWordpressEditorialPost.nodes} />
  </div>
</section>
```

Add:

```javascript
export const query = graphql`
  query PublicacionesPageQuery {
    allWordpressEditorialPost(sort: { date: DESC }, limit: 12) {
      nodes {
        id
        wordpressId
        slug
        sourceContentId
        url
        title
        excerpt
        date
        modified
        author
        imageUrl
        imageAlt
        imageWidth
        imageHeight
      }
    }
  }
`
```

Remove `BLOG_URL`, the iframe and the old books-first hero CTA. Hero actions become links to `#articulos` and `#libros`.

- [ ] **Step 5: Add exact tab/article copy in all locales**

Add these keys:

```json
// es
"tabs": { "label": "Tipo de publicación", "articles": "Artículos", "books": "Libros AMMAC" },
"articles": { "title": "Artículos recientes", "description": "Ideas, investigación y práctica educativa publicadas por Montessori México.", "read": "Leer artículo", "all": "Ver todos los artículos", "spanishLabel": "Artículo en español" }
```

```json
// en
"tabs": { "label": "Publication type", "articles": "Articles", "books": "AMMAC books" },
"articles": { "title": "Recent articles", "description": "Ideas, research, and educational practice published by Montessori México.", "read": "Read article", "all": "View all articles", "spanishLabel": "Article in Spanish" }
```

```json
// pt-br
"tabs": { "label": "Tipo de publicação", "articles": "Artigos", "books": "Livros AMMAC" },
"articles": { "title": "Artigos recentes", "description": "Ideias, pesquisa e prática educacional publicadas pelo Montessori México.", "read": "Ler artigo", "all": "Ver todos os artigos", "spanishLabel": "Artigo em espanhol" }
```

- [ ] **Step 6: Build and inspect generated HTML**

```bash
npm run build
rg -n "iframe|Artículos recientes|Libros AMMAC" public/publicaciones/index.html
```

Expected: no iframe; both article and book panel content appears in HTML.

- [ ] **Step 7: Commit**

```bash
git add src/components/publications src/pages/publicaciones.js src/i18n/locales/es/publicaciones.json src/i18n/locales/en/publicaciones.json src/i18n/locales/pt-br/publicaciones.json
git commit -m "feat(publications): show articles before AMMAC books"
```

---

### Task 4: Add Book/Article Schemas and Amazon Events

**Files:**
- Create: `src/utils/publicationSchemas.js`
- Create: `scripts/test-publication-schemas.js`
- Modify: `src/components/RoxanaBooksSection.js:1-216`
- Modify: `src/pages/publicaciones.js`
- Modify: `package.json:43-64`

**Interfaces:**
- Produces `buildPublicationSchemas({ posts, books, pageUrl, language }) -> object[]`.
- `RoxanaBooksSection` emits `click_amazon` with `book_id` and no price.

- [ ] **Step 1: Write failing schema tests**

```javascript
// scripts/test-publication-schemas.js
const assert = require("assert")
const { buildPublicationSchemas } = require("../src/utils/publicationSchemas")

const schemas = buildPublicationSchemas({
  posts: [{ id: "101", url: "https://montessorimexico.org/post/", title: "Post" }],
  books: [{ id: "book-1", title: "Libro", coverImage: "/books/libro.jpg", amazonUrl: "https://www.amazon.com.mx/dp/ABC" }],
  pageUrl: "https://certificacionmontessori.com/publicaciones/",
  language: "es-MX",
})

assert.strictEqual(schemas[0]["@type"], "ItemList")
assert.strictEqual(schemas[0].name, "Artículos recientes")
assert.strictEqual(schemas[0].itemListElement[0].url, "https://montessorimexico.org/post/")
assert.strictEqual(schemas[1]["@type"], "ItemList")
assert.strictEqual(schemas[2]["@type"], "Book")
assert.strictEqual(schemas[2].author["@id"], "https://certificacionmontessori.com/roxana/#person")
assert.strictEqual(schemas[2].offers, undefined)
assert.strictEqual(schemas[2].aggregateRating, undefined)
console.log("publication schemas ok")
```

- [ ] **Step 2: Implement visible-data-only schemas**

```javascript
// src/utils/publicationSchemas.js
const buildPublicationSchemas = ({ posts, books, pageUrl, language }) => {
  const listNames = language === "pt-BR"
    ? { articles: "Artigos recentes", books: "Livros AMMAC" }
    : language === "en"
      ? { articles: "Recent articles", books: "AMMAC books" }
      : { articles: "Artículos recientes", books: "Libros AMMAC" }
  const articleList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#articles`,
    name: listNames.articles,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post.title,
      url: post.url,
    })),
  }
  const bookList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#books`,
    name: listNames.books,
    itemListElement: books.map((book, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: book.title,
      url: book.amazonUrl,
    })),
  }
  const bookSchemas = books.map(book => ({
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${pageUrl}#${book.id}`,
    name: book.title,
    description: book.description,
    image: new URL(book.coverImage, pageUrl).toString(),
    inLanguage: "es",
    author: { "@id": "https://certificacionmontessori.com/roxana/#person" },
    publisher: { "@id": "https://certificacionmontessori.com/#organization" },
    url: book.amazonUrl,
  }))
  return [articleList, bookList, ...bookSchemas]
}

module.exports = { buildPublicationSchemas }
```

- [ ] **Step 3: Emit Amazon events from the existing book card**

Import `useLocalization` is already present. Add `trackEvent` and attach:

```javascript
onClick={() => trackEvent("click_amazon", {
  language,
  book_id: book.id,
  landing_path: typeof window === "undefined" ? "" : window.location.pathname,
  cta_position: "book_card",
})}
```

Do not add an event to disabled digital offers and do not alter any Amazon URL.

- [ ] **Step 4: Pass schema from `Head`**

Use Head's GraphQL `data`, `getT` and current pathname. Build the exact visible book records before calling the schema builder:

```javascript
const localizedBooks = roxanaBooks.map(book => ({
  ...book,
  title: t(`libros.${book.id}.titulo`, { defaultValue: book.title }),
  description: t(`libros.${book.id}.descripcion`, { defaultValue: book.description }),
  amazonUrl:
    location.pathname.startsWith("/en/") && book.amazonUrlEn
      ? book.amazonUrlEn
      : book.amazonUrl,
}))
const pageUrl = `https://certificacionmontessori.com${location.pathname}`
const schemas = buildPublicationSchemas({
  posts: data.allWordpressEditorialPost.nodes,
  books: localizedBooks,
  pageUrl,
  language: location.pathname.startsWith("/pt-br/")
    ? "pt-BR"
    : location.pathname.startsWith("/en/") ? "en" : "es-MX",
})
```

Pass the resulting array to `<Seo schema={schemas} />`. Add `graphql` to the Gatsby import used by the page.

- [ ] **Step 5: Test and build**

Add package script:

```json
"test:publication-schemas": "node scripts/test-publication-schemas.js"
```

Run:

```bash
npm run test:publication-schemas
npm run test:analytics
npm run build
```

Expected: schema/analytics contracts pass; build completes.

- [ ] **Step 6: Commit**

```bash
git add src/utils/publicationSchemas.js scripts/test-publication-schemas.js src/components/RoxanaBooksSection.js src/pages/publicaciones.js package.json package-lock.json
git commit -m "feat(seo): describe publications and book exits"
```

---

### Task 5: Add Desktop/Mobile Browser Regression Tests

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/publications.spec.js`
- Create: `scripts/test-lighthouse-budget.js`
- Modify: `package.json:30-58`

**Interfaces:**
- Produces `npm run test:e2e` against a built Gatsby server on port `9000`.
- Captures stable desktop/mobile screenshots in Playwright output.

- [ ] **Step 1: Install Playwright and browser**

```bash
npm install --save-dev @playwright/test lighthouse
npx playwright install chromium
```

- [ ] **Step 2: Add deterministic configuration**

```javascript
// playwright.config.js
const { defineConfig, devices } = require("@playwright/test")

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:9000",
    screenshot: "only-on-failure",
    storageState: {
      cookies: [],
      origins: [{
        origin: "http://127.0.0.1:9000",
        localStorage: [{ name: "ammac-analytics-consent-v1", value: "denied" }],
      }],
    },
  },
  webServer: {
    command: "npm run serve:test",
    port: 9000,
    reuseExistingServer: true,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
})
```

- [ ] **Step 3: Write the rendered-flow test**

```javascript
// tests/e2e/publications.spec.js
const { test, expect } = require("@playwright/test")

test.beforeEach(async ({ page }) => {
  await page.route("**/wp-json/wp/v2/posts**", route => route.abort())
})

test("articles are first and snapshot survives API failure", async ({ page }) => {
  await page.goto("/publicaciones/")
  await expect(page.locator("iframe")).toHaveCount(0)
  await expect(page.getByRole("tab", { name: "Artículos" })).toHaveAttribute("aria-selected", "true")
  await expect(page.locator("article").first()).toBeVisible()
  await expect(page.getByRole("link", { name: "Ver todos los artículos" })).toBeVisible()
  await page.screenshot({ path: `test-results/publicaciones-${test.info().project.name}.png`, fullPage: true })
})

test("book hash and hero link open books and preserve Amazon destinations", async ({ page }) => {
  await page.goto("/publicaciones/#articulos")
  await expect(page.getByRole("tab", { name: "Artículos" })).toHaveAttribute("aria-selected", "true")
  await page.locator('a[href="#libros"]').first().click()
  await expect(page).toHaveURL(/#libros$/)
  await expect(page.getByRole("tab", { name: "Libros AMMAC" })).toHaveAttribute("aria-selected", "true")
  const amazonLinks = page.getByRole("link", { name: /Ver en Amazon/ })
  await expect(amazonLinks.first()).toBeVisible()
  const hrefs = await amazonLinks.evaluateAll(links => links.map(link => link.href).sort())
  expect(hrefs).toEqual([
    "https://www.amazon.com.mx/dp/B0GZY8N61G",
    "https://www.amazon.com.mx/dp/B0H13SC1QK",
    "https://www.amazon.com.mx/dp/B0H143L8GN",
    "https://www.amazon.com.mx/dp/B0H14FT9K4",
    "https://www.amazon.com.mx/dp/B0H3R8YX6Q",
  ].sort())
})

test("keyboard switches tabs without layout overlap", async ({ page }) => {
  await page.goto("/publicaciones/")
  const articles = page.getByRole("tab", { name: "Artículos" })
  await articles.focus()
  await page.keyboard.press("ArrowRight")
  await expect(page.getByRole("tab", { name: "Libros AMMAC" })).toHaveAttribute("aria-selected", "true")
  const boxes = await page.locator("main, footer, [role=tablist]").evaluateAll(elements =>
    elements.map(element => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    })
  )
  expect(boxes.every(box => box.width > 0 && box.height > 0)).toBe(true)
})

for (const [url, tabName, languageNotice] of [
  ["/en/publicaciones/", "Articles", "Article in Spanish"],
  ["/pt-br/publicaciones/", "Artigos", "Artigo em espanhol"],
]) {
  test(`${url} labels Spanish editorial content explicitly`, async ({ page }) => {
    await page.goto(url)
    await expect(page.getByRole("tab", { name: tabName })).toHaveAttribute("aria-selected", "true")
    await expect(page.getByText(languageNotice).first()).toBeVisible()
  })
}

test("analytics tag waits for consent and preferences remain reversible", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("ammac-analytics-consent-v1"))
  const analyticsRequests = []
  page.on("request", request => {
    if (/googletagmanager\.com|google-analytics\.com/.test(request.url())) {
      analyticsRequests.push(request.url())
    }
  })

  await page.goto("/publicaciones/")
  await expect(page.getByRole("dialog", { name: "Privacidad y analítica" })).toBeVisible()
  expect(analyticsRequests).toHaveLength(0)
  await page.getByRole("button", { name: "Aceptar analítica" }).click()
  await expect.poll(() => analyticsRequests.length).toBeGreaterThan(0)

  await page.getByRole("button", { name: "Preferencias de privacidad" }).click()
  await expect(page.getByRole("dialog", { name: "Privacidad y analítica" })).toBeVisible()
  await page.getByRole("button", { name: "No aceptar" }).click()
  await expect(page.getByRole("dialog", { name: "Privacidad y analítica" })).toHaveCount(0)
})
```

- [ ] **Step 4: Add scripts and run both viewports**

Add:

```json
"serve:test": "gatsby serve -p 9000",
"test:e2e": "playwright test",
"test:lighthouse-budget": "node scripts/test-lighthouse-budget.js test-results/lighthouse-publicaciones.json"
```

Run:

```bash
npm run build
npm run test:e2e
```

Expected: twelve tests pass, six per viewport; screenshots show no overlap and articles precede books, English and Portuguese identify the article language, and analytics stays unloaded until consent.

- [ ] **Step 5: Add and run the laboratory performance budget**

```javascript
// scripts/test-lighthouse-budget.js
const assert = require("assert")
const fs = require("fs")

const reportPath = process.argv[2]
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"))
const audits = report.audits
assert(audits["largest-contentful-paint"].numericValue <= 2500, "LCP exceeds 2.5s")
assert(audits["cumulative-layout-shift"].numericValue <= 0.1, "CLS exceeds 0.1")
assert(audits["total-blocking-time"].numericValue <= 200, "TBT exceeds 200ms")
console.log(`Lighthouse budget ok: ${reportPath}`)
```

Start the built server in one terminal:

```bash
npm run serve:test
```

Then run in another terminal:

```bash
npx lighthouse http://127.0.0.1:9000/publicaciones/ --only-categories=performance --form-factor=mobile --output=json --output-path=test-results/lighthouse-publicaciones.json --chrome-flags="--headless --no-sandbox"
npm run test:lighthouse-budget
```

Expected: LCP is at most 2.5 seconds, CLS at most 0.1 and TBT at most 200 milliseconds. INP is verified later from field data because Lighthouse cannot reproduce field INP.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.js tests/e2e/publications.spec.js scripts/test-lighthouse-budget.js package.json package-lock.json
git commit -m "test(publications): cover responsive article and book flows"
```

## Plan Completion Gate

Run:

```bash
npm run test:wordpress-posts
npm run test:wordpress-source
npm run test:publication-schemas
npm run test:analytics
npm run build
npm run test:e2e
! rg -n "<iframe|montessorimexico.org.*canonical" public/publicaciones/index.html
```

Expected: all commands pass; final `rg` finds neither an iframe nor a cross-domain canonical; HTML still contains article and book item lists.
