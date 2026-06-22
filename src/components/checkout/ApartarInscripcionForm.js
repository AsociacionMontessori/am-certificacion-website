import * as React from "react"
import { useState, useEffect } from "react"
import { Link } from "gatsby"
import { createPublicCheckoutSession } from "../../utils/stripeCheckout"
import { INSCRIPCION_PUBLIC } from "../../data/inscripcionPublic"
import { getCuentaContableId } from "../../data/datosBancarios"
import ComprobanteFiscalMexico from "./ComprobanteFiscalMexico"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"

/**
 * Formulario para apartar el lugar pagando solo la inscripción con tarjeta.
 * Siempre cobra `inscripcion_diplomado` (no expone programas/colegiaturas, que
 * aún no tienen precio live). Al apartar, el backend regala el Paquete Cósmico.
 */
const ApartarInscripcionForm = ({ coin = "MXN", price, cancelHref = "/" }) => {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [requiereFacturaFiscal, setRequiereFacturaFiscal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkoutUrl, setCheckoutUrl] = useState("")
  const { esMexico: visitanteEnMexico } = useVisitorGeo()

  useEffect(() => {
    if (!visitanteEnMexico) setRequiereFacturaFiscal(false)
  }, [visitanteEnMexico])

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
        requiereFacturaFiscal,
        cuentaContable: getCuentaContableId(requiereFacturaFiscal),
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
      setError(err.message || "No se pudo iniciar el pago")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
      <div className="rounded-xl border border-blue/25 bg-blue/5 px-4 py-4 space-y-1">
        <p className="text-sm text-gray leading-relaxed">
          <strong className="text-blue">Apartas tu lugar</strong> pagando la inscripción
          {price ? <> ({coin} {price})</> : null}. Es un pago único: no se repite en
          otros diplomados o cursos posteriores.
        </p>
      </div>

      <div className="rounded-xl border-2 border-yellow/50 bg-yellow/10 px-4 py-3">
        <p className="text-sm font-semibold text-blue">🎁 De regalo al inscribirte</p>
        <p className="text-xs text-gray leading-relaxed mt-1">
          Recibes el <strong>Paquete Cósmico</strong> (Educación Cósmica + Guiones Cósmicos)
          en PDF y EPUB, sin costo. Lo descargas al terminar tu pago.
        </p>
      </div>

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
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="apartar-nombre">
            Nombre completo
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
            Correo electrónico
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
            Teléfono (opcional)
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
          Abrimos el pago seguro en una pestaña nueva. ¿No la ves?{" "}
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Ábrela aquí
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
          {loading ? "Redirigiendo…" : `Apartar mi lugar con tarjeta${price ? ` (${coin} ${price})` : ""}`}
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

export default ApartarInscripcionForm
