import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import Nav from "../../components/nav"
import { Link } from "gatsby"

const CheckoutSuccessPage = ({ location }) => {
  const params = new URLSearchParams(location?.search || "")
  const ordenId = params.get("orden")

  return (
    <Layout>
      <Seo title="Pago recibido" description="Tu pago fue procesado correctamente." />
      <Nav textColor="text-white" />
      <main className="min-h-[60vh] flex items-center justify-center px-6 py-24">
        <article className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green/20 flex items-center justify-center">
            <span className="text-3xl text-green" aria-hidden="true">
              ✓
            </span>
          </div>
          <h1 className="text-2xl font-bold text-blue mb-3">¡Pago recibido!</h1>
          <p className="text-gray text-base leading-relaxed mb-4">
            Gracias por tu pago. En las próximas 24–48 horas revisaremos tu
            inscripción o pedido y te contactaremos por correo.
          </p>
          {ordenId && (
            <p className="text-sm text-gray mb-6">
              Referencia: <span className="font-mono text-blue">{ordenId}</span>
            </p>
          )}
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center px-8 py-3 rounded-full font-semibold text-white bg-blue hover:bg-blue/90"
          >
            Volver al inicio
          </Link>
        </article>
      </main>
    </Layout>
  )
}

export default CheckoutSuccessPage
