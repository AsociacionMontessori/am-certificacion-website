import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import RoxanaBooksSection from "../components/RoxanaBooksSection"

const BLOG_URL = "https://montessorimexico.org/"

const PublicacionesPage = () => {
  return (
    <Layout>
      <section
        className="w-full overflow-x-hidden bg-cover bg-center bg-fixed"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,151,178,0.92), rgba(0,151,178,0.80), rgba(126,217,87,0.92)), url('/backgrounds/publicaciones.webp')",
        }}
      >
        <Nav textColor="text-white" />
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-6 text-white lg:px-12 lg:pb-14">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow">
            Biblioteca Montessori
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            Publicaciones de la Asociación Montessori de México
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/85 md:text-lg">
            Una serie editorial para acercar la filosofía Montessori, sus fundamentos y
            sus grandes lecciones a familias, docentes y comunidades educativas.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#catalogo-libros"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue transition hover:bg-white/90"
            >
              Ver libros
            </a>
            <a
              href="https://www.amazon.com/author/montessori.mx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Página de autor en Amazon
            </a>
          </div>
        </div>

        <RoxanaBooksSection
          id="catalogo-libros"
          headingId="publicaciones-libros-heading"
          eyebrow="Catálogo editorial"
          title="Libros disponibles"
          description={
            <>
              Consigue cada título en su edición impresa y digital directamente en
              Amazon México.
            </>
          }
          className="pt-4"
        />

        <section
          id="blog"
          aria-labelledby="blog-heading"
          className="bg-white px-4 py-10 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green">
                  Blog
                </p>
                <h2 id="blog-heading" className="mt-2 text-2xl font-bold text-blue md:text-3xl">
                  Entradas recientes
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray md:text-base">
                  Artículos, avisos y recursos publicados en Montessori México.
                </p>
              </div>
              <a
                href={BLOG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue/90"
              >
                Abrir blog
              </a>
            </div>
            <div className="h-[42rem] overflow-hidden rounded-lg border border-blue/15 bg-white shadow-xl sm:h-[36rem]">
              <iframe
                src={BLOG_URL}
                title="Blog Montessori México"
                className="h-full w-full"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </section>
    </Layout>
  )
}

export const Head = ({ location }) => (
  <Seo
    title="Publicaciones"
    pathname={location.pathname}
    description="Consulta publicaciones, libros y recursos públicos relacionados con la filosofía y el método Montessori."
  />
)

export default PublicacionesPage
