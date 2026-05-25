import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { Link } from "gatsby"
import { createPublicCheckoutSession } from "../../utils/stripeCheckout"
import {
  PROGRAMAS_INSCRIPCION,
  getResumenPagoInscripcion,
  getTotalPagoCheckout,
  programaTienePromoInscripcionIncluida,
  PROMO_NEURO_INSCRIPCION_INCLUIDA,
} from "../../data/inscripcionPublic"
import { getCuentaContableId } from "../../data/datosBancarios"
import ComprobanteFiscalMexico from "./ComprobanteFiscalMexico"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"
import {
  INSCRIPCION_PRECIO,
  getCheckoutLabelFromProgramaId,
} from "../../data/programasOferta"

const formatMonto = (n) =>
  Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 })

const readProgramaIdFromUrl = () => {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("programa")
}

const InscriptionCheckoutForm = ({
  coin,
  price,
  cancelHref = "/",
  initialProgramaId = null,
}) => {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [programa, setPrograma] = useState(() => {
    const fromProp = initialProgramaId
      ? getCheckoutLabelFromProgramaId(initialProgramaId)
      : null
    const fromUrl = getCheckoutLabelFromProgramaId(readProgramaIdFromUrl())
    const label = fromProp || fromUrl
    if (label && PROGRAMAS_INSCRIPCION.includes(label)) {
      return label
    }
    return PROGRAMAS_INSCRIPCION[0]
  })
  const [soloInscripcion, setSoloInscripcion] = useState(false)
  const [requiereFacturaFiscal, setRequiereFacturaFiscal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { esMexico: visitanteEnMexico } = useVisitorGeo()

  const esPromoNeuro = programaTienePromoInscripcionIncluida(programa)

  useEffect(() => {
    if (!visitanteEnMexico) {
      setRequiereFacturaFiscal(false)
    }
  }, [visitanteEnMexico])

  useEffect(() => {
    if (!initialProgramaId) return
    const label = getCheckoutLabelFromProgramaId(initialProgramaId)
    if (label && PROGRAMAS_INSCRIPCION.includes(label)) {
      setPrograma(label)
    }
  }, [initialProgramaId])

  useEffect(() => {
    const id = readProgramaIdFromUrl()
    if (!id) return
    const label = getCheckoutLabelFromProgramaId(id)
    if (label && PROGRAMAS_INSCRIPCION.includes(label)) {
      setPrograma(label)
    }
  }, [])

  useEffect(() => {
    if (esPromoNeuro && soloInscripcion) {
      setSoloInscripcion(false)
    }
  }, [esPromoNeuro, soloInscripcion])

  const resumenPrograma = useMemo(
    () => getResumenPagoInscripcion(programa, coin, soloInscripcion),
    [programa, coin, soloInscripcion]
  )

  const montoHoy = useMemo(
    () =>
      soloInscripcion
        ? INSCRIPCION_PRECIO.priceMx
        : formatMonto(getTotalPagoCheckout(programa, false)),
    [programa, soloInscripcion]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { url } = await createPublicCheckoutSession({
        programa,
        soloInscripcion: esPromoNeuro ? false : soloInscripcion,
        requiereFacturaFiscal,
        cuentaContable: getCuentaContableId(requiereFacturaFiscal),
        cliente: { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() },
      })
      if (typeof window !== "undefined") {
        window.location.href = url
      }
    } catch (err) {
      setError(err.message || "Error al iniciar el pago")
      setLoading(false)
    }
  }

  let botonLabel = `Pagar inicio completo (${coin} $${montoHoy})`
  if (esPromoNeuro) {
    botonLabel = `Pagar diplomado (${coin} $${montoHoy})`
  } else if (soloInscripcion) {
    botonLabel = `Pagar inscripción (${coin} ${price})`
  }

  return (
    <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
      {esPromoNeuro ? (
        <div className="rounded-xl border-2 border-green/40 bg-green/10 px-4 py-4 space-y-2">
          <p className="text-sm font-bold text-green">{PROMO_NEURO_INSCRIPCION_INCLUIDA.badge}</p>
          <p className="text-sm text-gray leading-relaxed">
            {PROMO_NEURO_INSCRIPCION_INCLUIDA.detalle}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-blue/25 bg-blue/5 px-4 py-4 space-y-2">
          <p className="text-sm text-gray leading-relaxed">
            <strong className="text-blue">Recomendado:</strong> paga inscripción y tu
            programa en un solo checkout para activar tu lugar de inmediato.
          </p>
          <p className="text-xs font-semibold text-green">
            La inscripción se paga una sola vez; otros diplomados o cursos posteriores no la
            incluyen de nuevo.
          </p>
        </div>
      )}

      {!esPromoNeuro && (
        <fieldset className="space-y-2 rounded-xl border border-gray/20 bg-white px-4 py-4">
          <legend className="text-sm font-medium text-black px-1">¿Qué pagas hoy?</legend>
          <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
            <input
              type="radio"
              name="modoPago"
              checked={!soloInscripcion}
              onChange={() => setSoloInscripcion(false)}
              className="mt-1"
            />
            <span className="text-sm text-black">
              <span className="font-medium">Inicio completo</span>
              <span className="block text-xs text-gray">
                Inscripción + primer pago del programa (Stripe)
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
            <input
              type="radio"
              name="modoPago"
              checked={soloInscripcion}
              onChange={() => setSoloInscripcion(true)}
              className="mt-1"
            />
            <span className="text-sm text-black">
              <span className="font-medium">Solo inscripción hoy</span>
              <span className="block text-xs text-gray">
                El programa se liquida después (portal o transferencia)
              </span>
            </span>
          </label>
        </fieldset>
      )}

      {visitanteEnMexico ? (
        <ComprobanteFiscalMexico
          requiereFacturaFiscal={requiereFacturaFiscal}
          onChange={setRequiereFacturaFiscal}
        />
      ) : (
        <p className="text-sm text-gray rounded-xl border border-gray/20 bg-gray/5 px-4 py-3 leading-relaxed">
          Comprobante: <strong className="text-black">recibo normal</strong> (sin factura fiscal
          mexicana). La factura con RFC solo aplica para pagos desde México.
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-nombre">
            Nombre completo
          </label>
          <input
            id="insc-nombre"
            type="text"
            required
            minLength={2}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-email">
            Correo electrónico
          </label>
          <input
            id="insc-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-tel">
            Teléfono (opcional)
          </label>
          <input
            id="insc-tel"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-programa">
            Programa de interés
          </label>
          <select
            id="insc-programa"
            value={programa}
            onChange={(e) => setPrograma(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
          >
            {PROGRAMAS_INSCRIPCION.map((p) => (
              <option key={p} value={p}>
                {p}
                {programaTienePromoInscripcionIncluida(p)
                  ? ` · ${PROMO_NEURO_INSCRIPCION_INCLUIDA.badge}`
                  : ""}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray leading-relaxed rounded-lg bg-gray/5 px-3 py-2 border border-gray/15">
            {resumenPrograma}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green disabled:opacity-60"
        >
          {loading ? "Redirigiendo…" : botonLabel}
        </button>
        <Link
          to={cancelHref}
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-medium text-blue border border-blue/30 bg-white text-center"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}

export default InscriptionCheckoutForm
