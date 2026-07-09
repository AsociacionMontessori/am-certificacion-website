import * as React from "react"
import { useTranslation } from "react-i18next"

import Layout from "../components/layout"
import Nav from "../components/nav"
import Seo from "../components/seo"
import { getT, useLocalization } from "../i18n"
import { LANGUAGES, DEFAULT_LANGUAGE, localizePath, parsePath } from "../i18n/config"

const SITE_URL = "https://certificacionmontessori.com"

// Cada versión de idioma de /ia/ enlaza a las URLs canónicas de SU idioma.
const buildCanonicalSources = lp => [
  { id: "inicio", url: `${SITE_URL}${lp("/")}` },
  { id: "diplomados", url: `${SITE_URL}${lp("/diplomados/")}` },
  { id: "marco", url: `${SITE_URL}${lp("/diplomados/")}#marco-pedagogico` },
  { id: "roxana", url: `${SITE_URL}${lp("/roxana/")}` },
  { id: "publicaciones", url: `${SITE_URL}${lp("/publicaciones/")}` },
  { id: "contacto", url: `${SITE_URL}${lp("/contact/")}` },
  { id: "privacidad", url: `${SITE_URL}${lp("/privacy/")}` },
]

// llms.txt localizado vive en /<prefijo>/llms.txt (sin barra final: es archivo).
const buildDataSources = language => [
  `${SITE_URL}${LANGUAGES[language]?.prefix || ""}/llms.txt`,
  `${SITE_URL}/sitemap-index.xml`,
  `${SITE_URL}/schools.json`,
]

const buildAiPageSchema = (t, language = DEFAULT_LANGUAGE) => [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("schema.nombre"),
    description: t("schema.descripcion"),
    url: `${SITE_URL}${localizePath(language, "/ia/")}`,
  },
]

const AIIndexPage = () => {
  const { t } = useTranslation("ia")
  const { language, localizedPath } = useLocalization()
  const canonicalSources = buildCanonicalSources(localizedPath)
  const dataSources = buildDataSources(language)
  return (
    <Layout>
      <Nav textColor="text-white" />
      <main className="bg-gradient-to-r from-blue via-purple to-green pt-10 md:pt-20">
        <section className="mx-auto max-w-6xl px-6 py-12 text-white">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.2em] text-green-300">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-lg text-white/90 md:text-xl">
              {t("hero.p1")}
            </p>
            <p className="mt-4 text-base text-white/85">
              {t("hero.p2")}
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 text-black lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-bold text-blue">{t("queEs.titulo")}</h2>
              <p className="mt-4 text-lg leading-relaxed">
                {t("queEs.p1")}
              </p>
              <p className="mt-4 text-lg leading-relaxed">
                {t("queEs.p2")}
              </p>

              <h2 className="mt-10 text-3xl font-bold text-blue">
                {t("fuentes.titulo")}
              </h2>
              <div className="mt-6 space-y-4">
                {canonicalSources.map(source => (
                  <article
                    key={source.url}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <h3 className="text-xl font-semibold text-blue">
                      <a className="underline decoration-green-500 underline-offset-4" href={source.url}>
                        {t(`fuentes.items.${source.id}.titulo`)}
                      </a>
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-black/80">
                      {t(`fuentes.items.${source.id}.descripcion`)}
                    </p>
                    <p className="mt-2 text-sm text-black/60">{source.url}</p>
                  </article>
                ))}
              </div>

              <h2 className="mt-10 text-3xl font-bold text-blue">
                {t("marco.titulo")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed">
                {t("marco.p1")}
              </p>
              <ol className="mt-4 list-decimal space-y-1 pl-6 text-base leading-relaxed text-black/80">
                {t("marco.dominios", { returnObjects: true }).map((dominio, index) => (
                  <li key={index}>{dominio}</li>
                ))}
              </ol>
              <p className="mt-4 text-lg leading-relaxed">
                {t("marco.p2")}
              </p>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
                <h2 className="text-2xl font-bold">{t("resumen.titulo")}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/90">
                  {t("resumen.items", { returnObjects: true }).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl bg-slate-100 p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-blue">{t("temas.titulo")}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-black/80">
                  {t("temas.items", { returnObjects: true }).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl bg-green/10 p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-blue">{t("recursos.titulo")}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-black/80">
                  {dataSources.map(source => (
                    <li key={source}>
                      <a className="underline decoration-green-600 underline-offset-4" href={source}>
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, "ia")
  const { language } = parsePath(location.pathname)
  return (
    <Seo
      title={t("seo.title")}
      pathname={location.pathname}
      description={t("seo.description")}
      schema={buildAiPageSchema(t, language)}
    />
  )
}

export default AIIndexPage
