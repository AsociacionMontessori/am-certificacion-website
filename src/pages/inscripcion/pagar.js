import * as React from "react"
import { Link } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import DatosBancariosCard from "../../components/inscripcion/DatosBancariosCard"

// NOTA: El flujo de pago con tarjeta vía Stripe está temporalmente
// deshabilitado mientras se completa la activación de la cuenta Stripe Live
// (KYC + cuenta bancaria). Para reactivarlo, restaurar `InscriptionCheckoutForm`
// y la lógica de geolocalización desde el commit anterior en git history
// (busca "pre-live: deshabilitar checkout Stripe").

const InscripcionPagarPage = () => {
  return (
    <CheckoutPageShell
      title="Paso 1 · Inscripción por transferencia"
      description="Inscríbete por transferencia bancaria mientras finalizamos la activación de pagos en línea."
      backTo="/diplomados"
    >
      <div className="rounded-2xl border-2 border-yellow/40 bg-yellow/10 px-5 py-5 mb-6">
        <p className="text-sm font-semibold text-black mb-2">
          Pagos con tarjeta en mantenimiento
        </p>
        <p className="text-sm text-gray leading-relaxed">
          Estamos finalizando la verificación con nuestro procesador de pagos.
          Por ahora, las inscripciones se realizan por <strong>transferencia
          bancaria</strong>. El proceso es exactamente el mismo en cuanto
          confirmamos el depósito.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-black text-center">
          Inscríbete por transferencia
        </p>
        <DatosBancariosCard compact />
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
