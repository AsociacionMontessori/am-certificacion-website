import * as React from "react"
import { Link } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import DatosBancariosCard from "../../components/inscripcion/DatosBancariosCard"

// NOTA: El flujo de pago con tarjeta vía Stripe está temporalmente
// deshabilitado mientras se completa la activación de Stripe Live.
// Para reactivarlo, restaurar `InscriptionCheckoutForm` y la lógica de
// geolocalización desde git history (commit anterior a "hotfix(stripe):
// pausar checkout público").

const InscripcionPagarPage = () => {
  return (
    <CheckoutPageShell
      title="Paso 1 · Inscripción por transferencia"
      description="Realiza tu pago de inscripción mediante transferencia bancaria."
      backTo="/diplomados"
    >
      <DatosBancariosCard compact />

      <div className="mt-4 space-y-3">
        <Link
          to="/inscripcion/transferencia"
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-blue"
        >
          Ver instrucciones de transferencia
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray text-center leading-relaxed">
        ¿Ya pagaste por transferencia?{" "}
        <Link to="/inscripcion/completar" className="text-blue underline font-medium">
          Continuar al paso 2
        </Link>
      </p>

      <p className="mt-2 text-xs text-gray text-center leading-relaxed">
        ¿Dudas? Escríbenos a{" "}
        <a href="mailto:admin@certificacionmontessori.com" className="text-blue underline font-medium">
          admin@certificacionmontessori.com
        </a>
      </p>
    </CheckoutPageShell>
  )
}

export const Head = () => (
  <Seo
    title="Paso 1 · Inscripción por transferencia"
    description="Inscríbete a los diplomados Montessori por transferencia bancaria."
    pathname="/inscripcion/pagar"
  />
)

export default InscripcionPagarPage
