import * as React from "react"
import { Link } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import DatosBancariosCard from "../../components/inscripcion/DatosBancariosCard"
import ApartarInscripcionForm from "../../components/checkout/ApartarInscripcionForm"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"
import { INSCRIPCION_PRECIO } from "../../data/programasOferta"

const InscripcionPagarPage = () => {
  const { esMexico } = useVisitorGeo()
  const coin = esMexico ? "MXN" : "USD"
  const price = esMexico ? `$${INSCRIPCION_PRECIO.priceMx}` : `$${INSCRIPCION_PRECIO.priceUsd}`

  return (
    <CheckoutPageShell
      title="Aparta tu lugar"
      description="Paga tu inscripción con tarjeta o hazlo por transferencia bancaria."
      backTo="/diplomados"
    >
      <ApartarInscripcionForm coin={coin} price={price} cancelHref="/diplomados" />

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-gray/20" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray">
          o paga por transferencia
        </span>
        <span className="h-px flex-1 bg-gray/20" />
      </div>

      <DatosBancariosCard compact esMexico={esMexico} />

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
    title="Aparta tu lugar"
    description="Aparta tu lugar en los diplomados Montessori con tarjeta o por transferencia bancaria."
    pathname="/inscripcion/pagar"
    robots="noindex,follow"
  />
)

export default InscripcionPagarPage
