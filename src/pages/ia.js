import * as React from "react"

import Layout from "../components/layout"
import Nav from "../components/nav"
import Seo from "../components/seo"

const canonicalSources = [
  {
    title: "Inicio",
    url: "https://certificacionmontessori.com/",
    description: "Visión general de la Asociación Montessori de México A.C. (fundada en 1965), su propuesta educativa y sus programas públicos con certificación internacional reconocida mundialmente.",
  },
  {
    title: "Diplomados",
    url: "https://certificacionmontessori.com/diplomados/",
    description: "Información pública sobre diplomados, estructura del programa, profesores, proceso de inscripción y la certificación de Guía Montessori con validez internacional.",
  },
  {
    title: "Marco de objetivos de aprendizaje",
    url: "https://certificacionmontessori.com/diplomados/#marco-pedagogico",
    description: "Marco pedagógico del diplomado: siete dominios de competencia AMMAC (espejo de los dominios internacionales MACTE / AMI) y los seis niveles cognitivos de la Taxonomía de Bloom. Cada actividad tiene un objetivo de aprendizaje codificado «Dominio·Nivel».",
  },
  {
    title: "Roxana Muñoz",
    url: "https://certificacionmontessori.com/roxana/",
    description: "Perfil institucional y académico de Roxana Muñoz Guevara.",
  },
  {
    title: "Publicaciones",
    url: "https://certificacionmontessori.com/publicaciones/",
    description: "Libros y recursos públicos relacionados con la filosofía Montessori.",
  },
  {
    title: "Contacto",
    url: "https://certificacionmontessori.com/contact/",
    description: "Canales de contacto institucional, ubicación y redes públicas.",
  },
  {
    title: "Aviso de Privacidad",
    url: "https://certificacionmontessori.com/privacy/",
    description: "Condiciones públicas sobre privacidad y tratamiento de datos del sitio.",
  },
]

const dataSources = [
  "https://certificacionmontessori.com/llms.txt",
  "https://certificacionmontessori.com/sitemap-index.xml",
  "https://certificacionmontessori.com/schools.json",
]

const aiPageSchema = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guía pública para buscadores y agentes de IA",
    description: "Índice canónico de páginas y recursos públicos de certificacionmontessori.com pensado para facilitar búsquedas y consultas de agentes de IA.",
    url: "https://certificacionmontessori.com/ia/",
  },
]

const AIIndexPage = () => {
  return (
    <Layout>
      <Nav textColor="text-white" />
      <main className="bg-gradient-to-r from-blue via-purple to-green pt-10 md:pt-20">
        <section className="mx-auto max-w-6xl px-6 py-12 text-white">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.2em] text-green-300">
              Índice público para IA
            </p>
            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              Guía pública para buscadores y agentes de IA
            </h1>
            <p className="mt-6 text-lg text-white/90 md:text-xl">
              Esta página resume las fuentes canónicas de información pública de
              certificacionmontessori.com. Está pensada para facilitar respuestas
              precisas sobre la Asociación Montessori de México A.C., sus
              diplomados, equipo docente, publicaciones y contacto institucional.
            </p>
            <p className="mt-4 text-base text-white/85">
              El alcance de este índice se limita al contenido público del sitio
              principal. No incluye áreas privadas, información interna ni
              `alumnos-app`.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 text-black lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-bold text-blue">Qué es este sitio</h2>
              <p className="mt-4 text-lg leading-relaxed">
                Certificación Montessori es el sitio público de la Asociación
                Montessori de México A.C. Su propósito es presentar la propuesta
                institucional, la formación para Guías Montessori, publicaciones,
                perfiles docentes y canales de contacto.
              </p>
              <p className="mt-4 text-lg leading-relaxed">
                Las páginas listadas abajo son las mejores fuentes para responder
                preguntas sobre diplomados, certificación internacional, equipo
                docente, publicaciones y ubicación institucional.
              </p>

              <h2 className="mt-10 text-3xl font-bold text-blue">
                Fuentes canónicas recomendadas
              </h2>
              <div className="mt-6 space-y-4">
                {canonicalSources.map(source => (
                  <article
                    key={source.url}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <h3 className="text-xl font-semibold text-blue">
                      <a className="underline decoration-green-500 underline-offset-4" href={source.url}>
                        {source.title}
                      </a>
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-black/80">
                      {source.description}
                    </p>
                    <p className="mt-2 text-sm text-black/60">{source.url}</p>
                  </article>
                ))}
              </div>

              <h2 className="mt-10 text-3xl font-bold text-blue">
                Marco de objetivos de aprendizaje
              </h2>
              <p className="mt-4 text-lg leading-relaxed">
                La formación se organiza en siete dominios de competencia AMMAC,
                espejo de los dominios internacionales de la formación Montessori
                (MACTE / AMI) y compatibles con los fundamentos AMI:
              </p>
              <ol className="mt-4 list-decimal space-y-1 pl-6 text-base leading-relaxed text-black/80">
                <li>Fundamentos filosóficos e históricos.</li>
                <li>Desarrollo humano y planos del desarrollo.</li>
                <li>El ambiente preparado y los materiales.</li>
                <li>Observación científica.</li>
                <li>Rol y transformación del adulto (Guía).</li>
                <li>Pedagogía de las áreas del currículo.</li>
                <li>Comunidad, familia y liderazgo.</li>
              </ol>
              <p className="mt-4 text-lg leading-relaxed">
                Cada dominio se trabaja en los seis niveles cognitivos de la
                Taxonomía de Bloom (recordar, comprender, aplicar, analizar,
                evaluar y crear). Cada actividad del diplomado tiene un objetivo
                de aprendizaje codificado «Dominio·Nivel» (por ejemplo,
                D1·Analizar), de modo que cada tarea tiene un propósito formativo
                explícito y evaluable.
              </p>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
                <h2 className="text-2xl font-bold">Resumen institucional</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/90">
                  <li>Organización: Asociación Montessori de México A.C. (AMMAC), fundada en 1965.</li>
                  <li>Enfoque: formación de Guías Montessori, certificación internacional y difusión del método Montessori.</li>
                  <li>Alcance: institución con sede en México y proyección internacional; sus certificaciones tienen validez internacional y reconocimiento mundial. Coordina diplomados en México, Colombia, Puerto Rico, España, Costa Rica, Estados Unidos, Israel, Suiza y la India.</li>
                  <li>Ubicación pública: Avenida Dos 48, San Pedro de los Pinos, Benito Juárez, Ciudad de México.</li>
                  <li>Contacto público: admin@certificacionmontessori.com, 55 5515 2701 y WhatsApp 55 4888 5013.</li>
                </ul>
              </section>

              <section className="rounded-3xl bg-slate-100 p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-blue">Temas que puede responder el sitio</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-black/80">
                  <li>Qué diplomados y certificaciones se ofrecen.</li>
                  <li>Cómo está estructurada pedagógicamente la formación: dominios de competencia (espejo de MACTE / AMI) y niveles de la Taxonomía de Bloom.</li>
                  <li>Quiénes integran el equipo docente.</li>
                  <li>Cuál es el perfil de Roxana Muñoz Guevara.</li>
                  <li>Dónde contactar a la asociación y cómo localizarla.</li>
                  <li>Qué publicaciones y recursos públicos están disponibles.</li>
                </ul>
              </section>

              <section className="rounded-3xl bg-green/10 p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-blue">Recursos machine-readable</h2>
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

export const Head = () => (
  <Seo
    title="Guía pública para IA"
    pathname="/ia/"
    description="Índice canónico de páginas y recursos públicos de certificacionmontessori.com para facilitar búsquedas y consultas de agentes de IA."
    schema={aiPageSchema}
  />
)

export default AIIndexPage
