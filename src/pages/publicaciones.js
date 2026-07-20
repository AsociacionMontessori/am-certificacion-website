import * as React from "react"
import { graphql } from "gatsby"
import { useTranslation } from "react-i18next"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import PublicationsTabs from "../components/publications/PublicationsTabs"
import { roxanaBooks } from "../data/roxanaBooks"
import { getT } from "../i18n"
import { buildPublicationSchemas } from "../utils/publicationSchemas"

const PublicacionesPage = ({ data }) => {
  const { t } = useTranslation("publicaciones")
  const posts = data?.allWordpressEditorialPost?.nodes || []

  return (
    <Layout>
      <section className="publications-hero w-full overflow-x-hidden bg-cover bg-center">
        <Nav textColor="text-white" />
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-6 text-white lg:px-12 lg:pb-14">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/85 md:text-lg">
            {t("hero.description")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#articulos"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue transition hover:bg-white/90"
            >
              {t("hero.ctaArticulos")}
            </a>
            <a
              href="#libros"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {t("hero.ctaLibros")}
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <PublicationsTabs posts={posts} />
        </div>
      </section>
    </Layout>
  )
}

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
        imageCardUrl
        imageSrcSet
        imageAlt
        imageWidth
        imageHeight
      }
    }
  }
`

export const Head = ({ data, location }) => {
  const t = getT(location.pathname, "publicaciones")
  const localizedBooks = roxanaBooks.map(book => ({
    ...book,
    title: t(`libros.${book.id}.titulo`, { defaultValue: book.title }),
    description: t(`libros.${book.id}.descripcion`, {
      defaultValue: book.description,
    }),
    amazonUrl:
      location.pathname.startsWith("/en/") && book.amazonUrlEn
        ? book.amazonUrlEn
        : book.amazonUrl,
  }))
  const pageUrl = `https://certificacionmontessori.com${location.pathname}`
  const schemas = buildPublicationSchemas({
    posts: data?.allWordpressEditorialPost?.nodes || [],
    books: localizedBooks,
    pageUrl,
    language: location.pathname.startsWith("/pt-br/")
      ? "pt-BR"
      : location.pathname.startsWith("/en/")
        ? "en"
        : "es-MX",
  })

  return (
    <>
      <Seo
        title={t("seo.title")}
        pathname={location.pathname}
        description={t("seo.description")}
        schema={schemas}
      />
      <link
        rel="preload"
        as="image"
        href="/backgrounds/publicaciones-mobile.webp"
        media="(max-width: 767px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/backgrounds/publicaciones.webp"
        media="(min-width: 768px)"
        fetchPriority="high"
      />
    </>
  )
}

export default PublicacionesPage
