import * as React from "react"
import { useEffect, useState } from "react"
import { Link, navigate } from "gatsby"
import { useTranslation } from "react-i18next"
import { getT, useLocalization } from "../../i18n"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import InscripcionParte1Form from "../../components/inscripcion/InscripcionParte1Form"
import { fetchInscripcionOrden, canjearCodigoDirecto } from "../../utils/inscripcionApi"
import { mapProgramaCheckoutANivel, PORTAL_ALUMNOS_URL } from "../../data/inscripcionForm"

const InscripcionCompletarPage = () => {
  const { t } = useTranslation("checkout")
  const { localizedPath } = useLocalization()
  const [ordenFromUrl, setOrdenFromUrl] = useState("")
  const [ordenId, setOrdenId] = useState("")
  const [ordenInput, setOrdenInput] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [context, setContext] = useState(null)
  const [cuentaCreada, setCuentaCreada] = useState(null)

  const loadOrden = async (id, token) => {
    const trimmed = id.trim()
    if (!trimmed) {
      setError(t("completePage.missingReference"))
      return
    }
    setLoading(true)
    setError("")
    try {
      let effectiveId = trimmed
      let effectiveToken = token
      let data
      try {
        data = await fetchInscripcionOrden(effectiveId, effectiveToken)
      } catch (firstErr) {
        // Si la referencia no corresponde a una orden, puede ser el código
        // compartido de inscripción directa (pago hecho con nosotros). Lo
        // canjeamos por una orden pagada individual y seguimos el flujo normal.
        if (!/no encontrada/i.test(firstErr.message || "")) throw firstErr
        const canje = await canjearCodigoDirecto(trimmed)
        effectiveId = canje.ordenId
        effectiveToken = canje.accessToken
        data = await fetchInscripcionOrden(effectiveId, effectiveToken)
        // Reflejar la orden real en la URL para que un refresh la retome
        // (y no vuelva a canjear el código creando otra orden).
        if (typeof window !== "undefined") {
          window.history.replaceState(
            null,
            "",
            localizedPath(`/inscripcion/completar?orden=${encodeURIComponent(effectiveId)}&t=${encodeURIComponent(effectiveToken)}`),
          )
        }
      }
      setOrdenId(effectiveId)
      setAccessToken(effectiveToken)
      setContext(data)
      if (data.parte1Completa) {
        setCuentaCreada({
          emailInstitucional: data.emailInstitucional,
          portalUrl: data.portalUrl || PORTAL_ALUMNOS_URL,
        })
      }
    } catch (err) {
      setContext(null)
      setError(err.message || t("completePage.verifyError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orden = params.get("orden") || ""
    // F-02: accessToken viaja en `?t=` del success_url de Stripe.
    const token = params.get("t") || ""

    setOrdenFromUrl(orden)
    setOrdenId(orden)
    setOrdenInput(orden)
    setAccessToken(token)
  }, [])

  useEffect(() => {
    if (ordenFromUrl) loadOrden(ordenFromUrl, accessToken)
  }, [ordenFromUrl, accessToken])

  useEffect(() => {
    if (context?.parte1Completa && !context?.parte2Completa && ordenId && typeof window !== "undefined") {
      const tokenSuffix = accessToken ? `&t=${encodeURIComponent(accessToken)}` : ""
      navigate(localizedPath(`/inscripcion/documentos?orden=${encodeURIComponent(ordenId)}${tokenSuffix}`))
    }
  }, [context, ordenId, accessToken])

  const initialValues = context?.datosParte1
    ? {
        ...context.datosParte1,
        nombreCompleto: context.datosParte1.nombreCompleto || context.cliente?.nombre || "",
        emailContacto: context.datosParte1.emailContacto || context.cliente?.email || "",
        telefonoMovil: context.datosParte1.telefonoMovil || context.cliente?.telefono || "",
        nivelEspecializacion:
          context.datosParte1.nivelEspecializacion || mapProgramaCheckoutANivel(context.programa),
      }
    : {
        nombreCompleto: context?.cliente?.nombre || "",
        emailContacto: context?.cliente?.email || "",
        telefonoMovil: context?.cliente?.telefono || "",
        nivelEspecializacion: mapProgramaCheckoutANivel(context?.programa),
      }

  const handleParte1Success = (result) => {
    setCuentaCreada(result)
    if (typeof window !== "undefined") {
      const tokenSuffix = accessToken ? `&t=${encodeURIComponent(accessToken)}` : ""
      navigate(localizedPath(`/inscripcion/documentos?orden=${encodeURIComponent(ordenId)}${tokenSuffix}`))
    }
  }

  return (
    <CheckoutPageShell
      title={t("completePage.title")}
      description={t("completePage.description")}
      backTo="/diplomados"
    >
      {!ordenFromUrl && !context && (
        <div className="mb-6 space-y-3">
          <label className="block text-sm font-medium text-black" htmlFor="orden-ref">
            {t("completePage.paymentReference")}
          </label>
          <input
            id="orden-ref"
            type="text"
            value={ordenInput}
            onChange={(e) => setOrdenInput(e.target.value)}
            placeholder={t("completePage.referencePlaceholder")}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
          />
          <button
            type="button"
            onClick={() => loadOrden(ordenInput)}
            disabled={loading}
            className="min-h-[48px] w-full rounded-full font-semibold text-white bg-blue disabled:opacity-60"
          >
            {loading ? t("completePage.verifyLoading") : t("common.continue")}
          </button>
        </div>
      )}

      {loading && (
        <div className="py-8">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-blue/20 bg-white/90 px-5 py-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-6 w-6 rounded-full border-[3px] border-blue/30 border-t-blue animate-spin"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-blue">{t("completePage.verifyingTitle")}</p>
                <p className="text-xs text-gray mt-1">
                  {t("completePage.verifyingText")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red/5 border border-red/20 px-4 py-3 mb-4">
          <p className="text-sm text-red">{error}</p>
          {!context?.pagado && (
            <Link to={localizedPath("/inscripcion/pagar")} className="inline-block mt-3 text-sm font-medium text-blue underline">
              {t("completePage.goPay")}
            </Link>
          )}
        </div>
      )}

      {!loading && context && !context.pagado && (
        <div className="rounded-2xl border border-yellow/30 bg-yellow/10 px-4 py-4 text-sm text-gray">
          <p className="mb-3">{t("completePage.notConfirmed")}</p>
          <Link to={localizedPath("/inscripcion/pagar")} className="font-semibold text-blue underline">
            {t("completePage.goPay")}
          </Link>
        </div>
      )}

      {!loading && context?.pagado && cuentaCreada && (
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-green/20 flex items-center justify-center text-2xl text-green">✓</div>
          <h2 className="text-lg font-bold text-blue">{t("completePage.accountCreated")}</h2>
          <p className="text-sm text-gray leading-relaxed">
            {t("completePage.yourUser")}{" "}
            <strong className="text-blue">{cuentaCreada.emailInstitucional}</strong>
          </p>
          <Link
            to={localizedPath(`/inscripcion/documentos?orden=${encodeURIComponent(ordenId)}${accessToken ? `&t=${encodeURIComponent(accessToken)}` : ""}`)}
            className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green"
          >
            {t("completePage.continueDocs")}
          </Link>
          <a
            href={cuentaCreada.portalUrl || PORTAL_ALUMNOS_URL}
            className="block text-sm text-blue underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("completePage.enterPortal")}
          </a>
        </div>
      )}

      {!loading && context?.pagado && !cuentaCreada && (
        <InscripcionParte1Form
          ordenId={ordenId}
          accessToken={accessToken}
          initialValues={initialValues}
          nivelEspecializacionFijo={
            mapProgramaCheckoutANivel(context?.programa) ||
            initialValues.nivelEspecializacion
          }
          programaPagadoLabel={context?.programa || ""}
          onSuccess={handleParte1Success}
        />
      )}
    </CheckoutPageShell>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, "checkout")
  return (
    <Seo
      title={t("completePage.seoTitle")}
      description={t("completePage.seoDescription")}
      pathname={location.pathname}
      robots="noindex,follow"
    />
  )
}

export default InscripcionCompletarPage
