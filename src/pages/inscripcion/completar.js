import * as React from "react"
import { useEffect, useState } from "react"
import { Link, navigate } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import InscripcionParte1Form from "../../components/inscripcion/InscripcionParte1Form"
import { fetchInscripcionOrden } from "../../utils/inscripcionApi"
import { mapProgramaCheckoutANivel, PORTAL_ALUMNOS_URL } from "../../data/inscripcionForm"

const InscripcionCompletarPage = () => {
  const [ordenFromUrl, setOrdenFromUrl] = useState("")
  const [ordenId, setOrdenId] = useState("")
  const [ordenInput, setOrdenInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [context, setContext] = useState(null)
  const [cuentaCreada, setCuentaCreada] = useState(null)

  const loadOrden = async (id) => {
    const trimmed = id.trim()
    if (!trimmed) {
      setError("Indica la referencia de tu pago")
      return
    }
    setLoading(true)
    setError("")
    try {
      const data = await fetchInscripcionOrden(trimmed)
      setOrdenId(trimmed)
      setContext(data)
      if (data.parte1Completa) {
        setCuentaCreada({
          emailInstitucional: data.emailInstitucional,
          portalUrl: data.portalUrl || PORTAL_ALUMNOS_URL,
        })
      }
    } catch (err) {
      setContext(null)
      setError(err.message || "No se pudo verificar el pago")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orden = params.get("orden") || ""

    setOrdenFromUrl(orden)
    setOrdenId(orden)
    setOrdenInput(orden)
  }, [])

  useEffect(() => {
    if (ordenFromUrl) loadOrden(ordenFromUrl)
  }, [ordenFromUrl])

  useEffect(() => {
    if (context?.parte1Completa && !context?.parte2Completa && ordenId && typeof window !== "undefined") {
      navigate(`/inscripcion/documentos?orden=${encodeURIComponent(ordenId)}`)
    }
  }, [context, ordenId])

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
      navigate(`/inscripcion/documentos?orden=${encodeURIComponent(ordenId)}`)
    }
  }

  return (
    <CheckoutPageShell
      title="Paso 2 · Tu cuenta en el portal"
      description="Datos básicos para crear tu usuario institucional. El pago ya está vinculado automáticamente."
      backTo="/diplomados"
    >
      {!ordenFromUrl && !context && (
        <div className="mb-6 space-y-3">
          <label className="block text-sm font-medium text-black" htmlFor="orden-ref">
            Referencia de pago
          </label>
          <input
            id="orden-ref"
            type="text"
            value={ordenInput}
            onChange={(e) => setOrdenInput(e.target.value)}
            placeholder="Ej. abc123..."
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

      {loading && (
        <div className="py-8">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-blue/20 bg-white/90 px-5 py-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-6 w-6 rounded-full border-[3px] border-blue/30 border-t-blue animate-spin"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-blue">Verificando tu pago…</p>
                <p className="text-xs text-gray mt-1">
                  Esto puede tardar unos segundos mientras validamos tu orden y habilitamos el siguiente paso.
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
            <Link to="/inscripcion/pagar" className="inline-block mt-3 text-sm font-medium text-blue underline">
              Ir al pago de inscripción
            </Link>
          )}
        </div>
      )}

      {!loading && context && !context.pagado && (
        <div className="rounded-2xl border border-yellow/30 bg-yellow/10 px-4 py-4 text-sm text-gray">
          <p className="mb-3">Aún no confirmamos el pago. Si acabas de pagar, espera unos minutos e intenta de nuevo.</p>
          <Link to="/inscripcion/pagar" className="font-semibold text-blue underline">
            Ir al pago de inscripción
          </Link>
        </div>
      )}

      {!loading && context?.pagado && cuentaCreada && (
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-green/20 flex items-center justify-center text-2xl text-green">✓</div>
          <h2 className="text-lg font-bold text-blue">¡Cuenta creada!</h2>
          <p className="text-sm text-gray leading-relaxed">
            Tu usuario:{" "}
            <strong className="text-blue">{cuentaCreada.emailInstitucional}</strong>
          </p>
          <Link
            to={`/inscripcion/documentos?orden=${encodeURIComponent(ordenId)}`}
            className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green"
          >
            Continuar al expediente (paso 3)
          </Link>
          <a
            href={cuentaCreada.portalUrl || PORTAL_ALUMNOS_URL}
            className="block text-sm text-blue underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Entrar al portal de alumnos
          </a>
        </div>
      )}

      {!loading && context?.pagado && !cuentaCreada && (
        <InscripcionParte1Form
          ordenId={ordenId}
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

export const Head = () => (
  <Seo
    title="Paso 2 · Tu cuenta en el portal"
    description="Datos básicos para crear tu usuario institucional. El pago ya está vinculado automáticamente."
    pathname="/inscripcion/completar"
  />
)

export default InscripcionCompletarPage
