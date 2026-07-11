import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { Link } from "gatsby"
import { Trans, useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"
import { createPublicCheckoutSession } from "../../utils/stripeCheckout"
import {
  INSCRIPCION_PUBLIC,
  PROGRAMAS_INSCRIPCION,
  getProgramaByCheckoutLabel,
  getTotalPagoCheckout,
  programaTienePromoInscripcionIncluida,
} from "../../data/inscripcionPublic"
import { getCuentaContableId } from "../../data/datosBancarios"
import ComprobanteFiscalMexico from "./ComprobanteFiscalMexico"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"
import {
  INSCRIPCION_PRECIO,
  getCheckoutLabelFromProgramaId,
} from "../../data/programasOferta"

const { trackEvent } = require("../../utils/analytics")

const formatMonto = (n) =>
  Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 })

const getProgramDisplayName = (t, checkoutLabel) => {
  const program = getProgramaByCheckoutLabel(checkoutLabel)
  return program ? t(`programs.options.${program.id}`, { defaultValue: program.cardTitle }) : checkoutLabel
}

const getTranslatedResumenPago = ({ t, checkoutLabel, coin, soloInscripcion }) => {
  const program = getProgramaByCheckoutLabel(checkoutLabel)
  const ins = INSCRIPCION_PRECIO.priceMx
  if (!program) {
    return t("inscriptionForm.summaryNoProgram", { coin, ins })
  }
  const programName = getProgramDisplayName(t, checkoutLabel)
  if (programaTienePromoInscripcionIncluida(checkoutLabel)) {
    if (soloInscripcion) {
      return t("inscriptionForm.summaryPromoForced", {
        coin,
        price: program.priceMx,
      })
    }
    return t("inscriptionForm.summaryPromo", {
      coin,
      price: program.priceMx,
    })
  }
  if (soloInscripcion) {
    return t("inscriptionForm.summaryOnly", {
      coin,
      ins,
      program: programName,
    })
  }
  const total = formatMonto(getTotalPagoCheckout(checkoutLabel, false))
  if (program.tipo === "guia") {
    return t("inscriptionForm.summaryGuide", {
      coin,
      ins,
      price: program.priceMx,
      total,
    })
  }
  if (program.tipo === "diplomado") {
    return t("inscriptionForm.summaryDiploma", {
      coin,
      ins,
      program: programName,
      price: program.priceMx,
      duration: program.duration,
      total,
    })
  }
  return t("inscriptionForm.summaryNoProgram", { coin, ins })
}

const readProgramaIdFromUrl = () => {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("programa")
}

const resolveInitialPrograma = (initialProgramaId) => {
  const fromProp = initialProgramaId
    ? getCheckoutLabelFromProgramaId(initialProgramaId)
    : null
  const fromUrl = getCheckoutLabelFromProgramaId(readProgramaIdFromUrl())
  const label = fromProp || fromUrl
  return label && PROGRAMAS_INSCRIPCION.includes(label) ? label : ""
}

const InscriptionCheckoutForm = ({
  coin,
  price,
  cancelHref = "/",
  initialProgramaId = null,
}) => {
  const { t } = useTranslation("checkout")
  const { language, localizedPath } = useLocalization()
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [programa, setPrograma] = useState(() =>
    resolveInitialPrograma(initialProgramaId)
  )
  const [soloInscripcion, setSoloInscripcion] = useState(() =>
    !programaTienePromoInscripcionIncluida(resolveInitialPrograma(initialProgramaId))
  )
  const [requiereFacturaFiscal, setRequiereFacturaFiscal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkoutUrl, setCheckoutUrl] = useState("")
  const { esMexico: visitanteEnMexico } = useVisitorGeo()
  const permiteFacturaFiscal = visitanteEnMexico && language === "es"

  const programaSeleccionado = Boolean(programa)
  const esPromoNeuro = programaTienePromoInscripcionIncluida(programa)
  const pagarSoloInscripcion = !programaSeleccionado || (!esPromoNeuro && soloInscripcion)

  useEffect(() => {
    if (!permiteFacturaFiscal) {
      setRequiereFacturaFiscal(false)
    }
  }, [permiteFacturaFiscal])

  useEffect(() => {
    if (!initialProgramaId) return
    const label = getCheckoutLabelFromProgramaId(initialProgramaId)
    if (label && PROGRAMAS_INSCRIPCION.includes(label)) {
      setPrograma(label)
      setSoloInscripcion(!programaTienePromoInscripcionIncluida(label))
    }
  }, [initialProgramaId])

  useEffect(() => {
    const id = readProgramaIdFromUrl()
    if (!id) return
    const label = getCheckoutLabelFromProgramaId(id)
    if (label && PROGRAMAS_INSCRIPCION.includes(label)) {
      setPrograma(label)
      setSoloInscripcion(!programaTienePromoInscripcionIncluida(label))
    }
  }, [])

  useEffect(() => {
    if (esPromoNeuro && soloInscripcion) {
      setSoloInscripcion(false)
    }
  }, [esPromoNeuro, soloInscripcion])

  const resumenPrograma = useMemo(
    () =>
      getTranslatedResumenPago({
        t,
        checkoutLabel: programa,
        coin,
        soloInscripcion: pagarSoloInscripcion,
      }),
    [t, programa, coin, pagarSoloInscripcion]
  )

  const montoHoy = useMemo(
    () =>
      pagarSoloInscripcion
        ? INSCRIPCION_PRECIO.priceMx
        : formatMonto(getTotalPagoCheckout(programa, false)),
    [programa, pagarSoloInscripcion]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setCheckoutUrl("")
    setLoading(true)
    // Abrimos la pestaña dentro del gesto de clic (evita el bloqueo de popups).
    const stripeTab = typeof window !== "undefined" ? window.open("", "_blank") : null

    try {
      const payload = {
        soloInscripcion: pagarSoloInscripcion,
        requiereFacturaFiscal: permiteFacturaFiscal && requiereFacturaFiscal,
        cuentaContable: getCuentaContableId(permiteFacturaFiscal && requiereFacturaFiscal),
        language,
        cliente: { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() },
      }

      if (programaSeleccionado) {
        payload.programa = programa
      } else {
        payload.sku = INSCRIPCION_PUBLIC.sku
        payload.quantity = 1
      }

      const { url } = await createPublicCheckoutSession(payload)
      trackEvent("begin_checkout", {
        language,
        program_id: getProgramaByCheckoutLabel(programa)?.id || "inscripcion",
        landing_path: typeof window === "undefined" ? "" : window.location.pathname,
        cta_position: "checkout_form",
        lead_channel: "stripe",
      })
      if (stripeTab && !stripeTab.closed) {
        stripeTab.location = url
        setCheckoutUrl(url)
        setLoading(false)
      } else if (typeof window !== "undefined") {
        window.location.href = url
      }
    } catch (err) {
      if (stripeTab && !stripeTab.closed) stripeTab.close()
      setError(err.message || t("inscriptionForm.error"))
      setLoading(false)
    }
  }

  let botonLabel = t("inscriptionForm.payFull", { coin, amount: montoHoy })
  if (esPromoNeuro) {
    botonLabel = t("inscriptionForm.payDiploma", { coin, amount: montoHoy })
  } else if (pagarSoloInscripcion) {
    botonLabel = t("inscriptionForm.payEnrollment", { coin, price })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
      {esPromoNeuro ? (
        <div className="rounded-xl border-2 border-green/40 bg-green/10 px-4 py-4 space-y-2">
          <p className="text-sm font-bold text-green">{t("inscriptionForm.promoBadge")}</p>
          <p className="text-sm text-gray leading-relaxed">
            {t("inscriptionForm.promoDetail")}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-blue/25 bg-blue/5 px-4 py-4 space-y-2">
          <p className="text-sm text-gray leading-relaxed">
            <strong className="text-blue">{t("inscriptionForm.flexibleStrong")}</strong>{" "}
            {t("inscriptionForm.flexibleText")}
          </p>
          <p className="text-xs font-semibold text-green">
            {t("inscriptionForm.oneTime")}
          </p>
        </div>
      )}

      {!esPromoNeuro && (
        <fieldset className="space-y-2 rounded-xl border border-gray/20 bg-white px-4 py-4">
          <legend className="text-sm font-medium text-black px-1">{t("inscriptionForm.whatPayToday")}</legend>
          <label
            className={`flex min-h-[44px] items-start gap-3 ${programaSeleccionado ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          >
            <input
              type="radio"
              name="modoPago"
              checked={!pagarSoloInscripcion}
              onChange={() => setSoloInscripcion(false)}
              disabled={!programaSeleccionado}
              className="mt-1"
            />
            <span className="text-sm text-black">
              <span className="font-medium">{t("inscriptionForm.fullStart")}</span>
              <span className="block text-xs text-gray">
                {t("inscriptionForm.fullStartHint")}
              </span>
            </span>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="modoPago"
              checked={pagarSoloInscripcion}
              onChange={() => setSoloInscripcion(true)}
              className="mt-1"
            />
            <span className="text-sm text-black">
              <span className="font-medium">{t("inscriptionForm.onlyEnrollment")}</span>
              <span className="block text-xs text-gray">
                {t("inscriptionForm.onlyEnrollmentHint")}
              </span>
            </span>
          </label>
        </fieldset>
      )}

      {permiteFacturaFiscal ? (
        <ComprobanteFiscalMexico
          requiereFacturaFiscal={requiereFacturaFiscal}
          onChange={setRequiereFacturaFiscal}
        />
      ) : (
        <p className="text-sm text-gray rounded-xl border border-gray/20 bg-gray/5 px-4 py-3 leading-relaxed">
          <Trans
            i18nKey="apartarForm.receiptOutsideMexico"
            ns="checkout"
            components={{ strong: <strong className="text-black" /> }}
          />
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-nombre">
            {t("apartarForm.fullName")}
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
            {t("apartarForm.email")}
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
            {t("apartarForm.phone")}
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
            {t("inscriptionForm.programInterest")}
          </label>
          <select
            id="insc-programa"
            value={programa}
            onChange={(e) => {
              const nextPrograma = e.target.value
              setPrograma(nextPrograma)
              setSoloInscripcion(!programaTienePromoInscripcionIncluida(nextPrograma))
            }}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
          >
            <option value="">{t("programs.defineLater")}</option>
            {PROGRAMAS_INSCRIPCION.map((p) => (
              <option key={p} value={p}>
                {getProgramDisplayName(t, p)}
                {programaTienePromoInscripcionIncluida(p)
                  ? ` · ${t("inscriptionForm.promoBadge")}`
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

      {checkoutUrl && (
        <p className="text-sm text-blue rounded-lg bg-blue/5 px-3 py-2 leading-relaxed">
          {t("common.openPayment")}{" "}
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            {t("common.openHere")}
          </a>
          .
        </p>
      )}

      <div className="flex flex-col gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green disabled:opacity-60"
        >
          {loading ? t("common.redirecting") : botonLabel}
        </button>
        <Link
          to={localizedPath(cancelHref)}
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-medium text-blue border border-blue/30 bg-white text-center"
        >
          {t("common.cancel")}
        </Link>
      </div>
    </form>
  )
}

export default InscriptionCheckoutForm
