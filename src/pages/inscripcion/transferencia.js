import * as React from "react"
import { Link } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import DatosBancariosCard from "../../components/inscripcion/DatosBancariosCard"
import { DATOS_BANCARIOS_INSCRIPCION } from "../../data/datosBancarios"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"

const pasosTransferencia = [
  {
    titulo: "1. Realiza la transferencia",
    texto:
      "Transfiere el monto de inscripción a la cuenta que corresponda según si necesitas factura fiscal o recibo normal. Incluye tu nombre completo en el concepto.",
  },
  {
    titulo: "2. Envía tu comprobante",
    texto: `Manda el comprobante a ${DATOS_BANCARIOS_INSCRIPCION.correoComprobante} con tu nombre, programa de interés y teléfono de contacto.`,
  },
  {
    titulo: "3. Espera confirmación",
    texto:
      "Cuando validemos el depósito, te enviaremos la referencia para continuar con tu cuenta (paso 2) y expediente (paso 3) en el sitio.",
  },
  {
    titulo: "4. Completa tu inscripción",
    texto:
      "Con la referencia de pago confirmada, crea tu usuario institucional y sube tus documentos. Si pagaste por transferencia, adjunta también el comprobante en el expediente.",
  },
]

const InscripcionTransferenciaPage = () => {
  const { esMexico } = useVisitorGeo()

  return (
  <CheckoutPageShell
    title="Pago por transferencia bancaria"
    description="Inscripciones por transferencia bancaria a Asociación Montessori de México A.C."
    backTo="/inscripcion/pagar"
  >
    <DatosBancariosCard esMexico={esMexico} />

    <div className="mt-6 space-y-4">
      {pasosTransferencia.map((paso) => (
        <article
          key={paso.titulo}
          className="rounded-2xl border border-gray/20 bg-white px-4 py-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-blue mb-2">{paso.titulo}</h2>
          <p className="text-sm text-gray leading-relaxed">{paso.texto}</p>
        </article>
      ))}
    </div>

    <div className="mt-8 flex flex-col gap-3">
      <Link
        to="/inscripcion/completar"
        className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-blue"
      >
        Ya tengo referencia de pago confirmada
      </Link>
    </div>
  </CheckoutPageShell>
  )
}

export const Head = () => (
  <Seo
    title="Pago por transferencia bancaria"
    description="Inscripciones por transferencia bancaria a Asociación Montessori de México A.C."
    pathname="/inscripcion/transferencia"
    robots="noindex,follow"
  />
)

export default InscripcionTransferenciaPage
