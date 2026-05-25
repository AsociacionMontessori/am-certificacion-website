import * as React from "react"
import { useEffect, useState } from "react"
import { Link } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import InscripcionParte2Form from "../../components/inscripcion/InscripcionParte2Form"
import { fetchInscripcionOrden } from "../../utils/inscripcionApi"
import { PORTAL_ALUMNOS_URL } from "../../data/inscripcionForm"

const InscripcionDocumentosPage = () => {
  const [ordenFromUrl, setOrdenFromUrl] = useState("")
  const [ordenId, setOrdenId] = useState("")
  const [ordenInput, setOrdenInput] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [context, setContext] = useState(null)
  const [enviado, setEnviado] = useState(false)

  const loadOrden = async (id, token) => {
    const trimmed = id.trim()
    if (!trimmed) {
      setError("Indica la referencia de tu pago")
      return
    }
    setLoading(true)
    setError("")
    try {
      const data = await fetchInscripcionOrden(trimmed, token)
      setOrdenId(trimmed)
      setContext(data)
      if (data.parte2Completa) setEnviado(true)
    } catch (err) {
      setContext(null)
      setError(err.message || "No se pudo verificar la inscripción")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orden = params.get("orden") || ""
    const token = params.get("t") || ""

    setOrdenFromUrl(orden)
    setOrdenId(orden)
    setOrdenInput(orden)
    setAccessToken(token)
  }, [])

  useEffect(() => {
    if (ordenFromUrl) loadOrden(ordenFromUrl, accessToken)
  }, [ordenFromUrl, accessToken])

  const nivelEsp =
    context?.datosParte1?.nivelEspecializacion || context?.programa || "Otro"

  return (
    <CheckoutPageShell
      title="Paso 3 · Expediente administrativo"
      description="Documentos e información complementaria. No necesitas comprobante de pago de inscripción."
      backTo={ordenId ? `/inscripcion/completar?orden=${encodeURIComponent(ordenId)}` : "/diplomados"}
    >
      {!ordenFromUrl && !context && (
        <div className="mb-6 space-y-3">
          <label className="block text-sm font-medium text-black" htmlFor="orden-ref-doc">
            Referencia de pago
          </label>
          <input
            id="orden-ref-doc"
            type="text"
            value={ordenInput}
            onChange={(e) => setOrdenInput(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
          />
          <button
            type="button"
            onClick={() => loadOrden(ordenInput)}
            disabled={loading}
            className="min-h-[48px] w-full rounded-full font-semibold text-white bg-blue disabled:opacity-60"
          >
            {loading ? "Verificando…" : "Continuar"}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-gray text-center py-8">Cargando…</p>}

      {error && <p className="text-sm text-red mb-4">{error}</p>}

      {!loading && context && !context.parte1Completa && (
        <div className="rounded-2xl border border-yellow/30 bg-yellow/10 px-4 py-4 text-sm text-gray space-y-3">
          <p>Primero debes crear tu cuenta (paso 2).</p>
          <Link
            to={`/inscripcion/completar?orden=${encodeURIComponent(ordenId)}${accessToken ? `&t=${encodeURIComponent(accessToken)}` : ""}`}
            className="font-semibold text-blue underline"
          >
            Ir al paso 2
          </Link>
        </div>
      )}

      {!loading && context?.parte1Completa && enviado && (
        <div className="text-center space-y-4 py-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-green/20 flex items-center justify-center text-2xl text-green">✓</div>
          <h2 className="text-lg font-bold text-blue">¡Expediente recibido!</h2>
          <p className="text-sm text-gray leading-relaxed">
            Tu inscripción está completa. Revisaremos tu información y te contactaremos por correo.
          </p>
          <a
            href={context.portalUrl || PORTAL_ALUMNOS_URL}
            className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-blue"
            target="_blank"
            rel="noopener noreferrer"
          >
            Entrar al portal de alumnos
          </a>
        </div>
      )}

      {!loading && context?.parte1Completa && !enviado && (
        <InscripcionParte2Form
          ordenId={ordenId}
          accessToken={accessToken}
          nivelEspecializacion={nivelEsp}
          initialValues={context.datosParte2 || {}}
          onSuccess={() => setEnviado(true)}
        />
      )}
    </CheckoutPageShell>
  )
}

export const Head = () => (
  <Seo
    title="Paso 3 · Expediente administrativo"
    description="Documentos e información complementaria. No necesitas comprobante de pago de inscripción."
    pathname="/inscripcion/documentos"
  />
)

export default InscripcionDocumentosPage
