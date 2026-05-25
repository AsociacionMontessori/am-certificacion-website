import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import Nav from "../../components/nav"
import { Link } from "gatsby"

const CheckoutCancelPage = () => (
  <Layout>
    <Nav textColor="text-white" />
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-24">
      <article className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-blue mb-3">Pago cancelado</h1>
        <p className="text-gray text-base leading-relaxed mb-6">
          No se realizó ningún cargo. Puedes intentar de nuevo cuando quieras o
          usar nuestros canales alternativos de inscripción.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/diplomados/"
            className="inline-flex min-h-[44px] items-center justify-center px-8 py-3 rounded-full font-semibold text-white bg-blue"
          >
            Ver diplomados
          </Link>
          <Link
            to="/publicaciones/"
            className="inline-flex min-h-[44px] items-center justify-center px-8 py-3 rounded-full font-medium text-blue border border-blue/30"
          >
            Ver publicaciones
          </Link>
        </div>
      </article>
    </section>
  </Layout>
)

export const Head = () => (
  <Seo title="Pago cancelado" description="El pago no se completó." pathname="/checkout/cancel" />
)

export default CheckoutCancelPage
