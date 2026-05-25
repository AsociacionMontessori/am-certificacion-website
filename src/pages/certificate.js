import * as React from "react"
import { Link, navigate } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"

const TARGET = "/diplomados/#certificacion_internacional"

const Certificate = () => {
  React.useEffect(() => {
    navigate(TARGET, { replace: true })
  }, [])

  return (
    <Layout>
      <main className="min-h-[50vh] px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-blue">Diplomados Montessori</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray">
          Esta sección ahora vive en Diplomados para evitar información duplicada.
        </p>
        <Link
          to={TARGET}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-blue px-6 py-3 font-semibold text-white"
        >
          Ver programas y precios
        </Link>
      </main>
    </Layout>
  )
}

export const Head = () => (
  <Seo
    title="Diplomados Montessori"
    pathname="/certificate/"
    canonicalUrl="https://certificacionmontessori.com/diplomados/"
    description="Consulta los diplomados Montessori y sus precios en la sección de Diplomados."
    robots="noindex,follow"
  />
)

export default Certificate
