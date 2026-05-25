import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import RoxanaBooksSection from "../components/RoxanaBooksSection"

const PublicacionesPage = () => {
  return (
    <Layout>
      <Nav textColor="text-white" />
      <section className="bg-gradient-to-r from-blue via-purple to-green pt-16 w-full overflow-x-hidden">
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
              Elige el título que quieres recibir en casa o consulta la versión
              disponible en Amazon México.
            </>
          }
          className="pt-4"
        />
      </section>
    </Layout>
  )
}

export const Head = () => (
  <Seo
    title="Publicaciones"
    pathname="/publicaciones/"
    description="Consulta publicaciones, libros y recursos públicos relacionados con la filosofía y el método Montessori."
  />
)

export default PublicacionesPage
