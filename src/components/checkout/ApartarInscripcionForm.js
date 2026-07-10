import * as React from "react"
import { useState, useEffect } from "react"
import { Link } from "gatsby"
import { Trans, useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"
import { createPublicCheckoutSession } from "../../utils/stripeCheckout"
import { INSCRIPCION_PUBLIC } from "../../data/inscripcionPublic"
import { getCuentaContableId } from "../../data/datosBancarios"
import ComprobanteFiscalMexico from "./ComprobanteFiscalMexico"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"

/**
 * Formulario para apartar el lugar pagando solo la inscripción con tarjeta.
 * Siempre cobra `inscripcion_diplomado` (no expone programas/colegiaturas, que
 * aún no tienen precio live). (El regalo de ebooks se retiró por exclusividad
 * KDP Select; ver roxanaBooks.js / digitalBooks.js.)
 */
const ApartarInscripcionForm = ({ coin = "MXN", price, cancelHref = "/" }) => {
  const { t } = useTranslation("checkout")
  const { language, localizedPath } = useLocalization()
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [requiereFacturaFiscal, setRequiereFacturaFiscal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkoutUrl, setCheckoutUrl] = useState("")
  const { esMexico: visitanteEnMexico } = useVisitorGeo()
  const permiteFacturaFiscal = visitanteEnMexico && language === "es"

  useEffect(() => {
    if (!permiteFacturaFiscal) setRequiereFacturaFiscal(false)
  }, [permiteFacturaFiscal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setCheckoutUrl("")
    setLoading(true)
    // Abrimos la pestaña dentro del gesto de clic (evita el bloqueo de popups
    // tras el await). El sitio se queda abierto en esta pestaña.
    const stripeTab = typeof window !== "undefined" ? window.open("", "_blank") : null
    try {
      const { url } = await createPublicCheckoutSession({
        sku: INSCRIPCION_PUBLIC.sku,
        quantity: 1,
        soloInscripcion: true,
        requiereFacturaFiscal: permiteFacturaFiscal && requiereFacturaFiscal,
        cuentaContable: getCuentaContableId(permiteFacturaFiscal && requiereFacturaFiscal),
        language,
        cliente: { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() },
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
      setError(err.message || t("apartarForm.error"))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
      <div className="rounded-xl border border-blue/25 bg-blue/5 px-4 py-4 space-y-1">
        <p className="text-sm text-gray leading-relaxed">
          <strong className="text-blue">{t("apartarForm.introStrong")}</strong> {t("apartarForm.intro")}
          {price ? <> ({coin} {price})</> : null}. {t("apartarForm.introAfter")}
        </p>
      </div>

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
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="apartar-nombre">
            {t("apartarForm.fullName")}
          </label>
          <input
            id="apartar-nombre"
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
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="apartar-email">
            {t("apartarForm.email")}
          </label>
          <input
            id="apartar-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="apartar-tel">
            {t("apartarForm.phone")}
          </label>
          <input
            id="apartar-tel"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="tel"
          />
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
          {loading
            ? t("common.redirecting")
            : price
              ? t("apartarForm.submitWithPrice", { coin, price })
              : t("apartarForm.submit")}
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

export default ApartarInscripcionForm
