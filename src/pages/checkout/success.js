import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import Nav from "../../components/nav"
import { Link } from "gatsby"

const CheckoutSuccessPage = ({ location }) => {
  const params = new URLSearchParams(location?.search || "")
  const ordenId = params.get("orden")
  const tipo = params.get("tipo")
  const esInscripcion =
    tipo === "inscripcion" || tipo === "inicio_programa" || !tipo
  const inicioCompleto = tipo === "inicio_programa"

  const completarUrl = ordenId
    ? `/inscripcion/completar?orden=${encodeURIComponent(ordenId)}`
    : "/inscripcion/completar"

  return (
    <Layout>
      <Seo title="Pago recibido" description="Tu pago fue procesado correctamente." />
      <Nav textColor="text-white" />
      <main className="min-h-[60vh] flex items-center justify-center px-6 py-24">
        <article className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green/20 flex items-center justify-center">
            <span className="text-3xl text-green" aria-hidden="true">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-blue mb-3">¡Pago recibido!</h1>
          <p className="text-gray text-base leading-relaxed mb-4">
            {esInscripcion
              ? inicioCompleto
                ? "Tu inscripción y el pago inicial de tu programa quedaron registrados. Sigue con la creación de tu cuenta y el expediente administrativo."
                : "Tu pago de inscripción quedó registrado. Sigue con la creación de tu cuenta y el expediente administrativo."
              : "Gracias por tu pago. En las próximas 24–48 horas revisaremos tu pedido y te contactaremos por correo."}
          </p>
          {ordenId && (
            <p className="text-sm text-gray mb-6">
              Referencia: <span className="font-mono text-blue">{ordenId}</span>
            </p>
          )}

          {esInscripcion && (
            <div className="text-left rounded-2xl border border-blue/20 bg-blue/5 px-5 py-4 mb-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue mb-1">
                  Paso 2 · Cuenta en el portal
                </p>
                <p className="text-sm text-gray leading-relaxed mb-3">
                  Crea tu usuario <strong>@certificacionmontessori.com</strong> con tus datos básicos.
                </p>
                <Link
                  to={completarUrl}
                  className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green text-center"
                >
                  Crear mi cuenta
                </Link>
              </div>
              <p className="text-xs text-gray leading-relaxed">
                Después completarás el <strong>expediente administrativo</strong> (documentos y reglamento firmado).
                No necesitas adjuntar comprobante de pago.
              </p>
            </div>
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
