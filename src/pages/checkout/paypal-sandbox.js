import * as React from "react"
import Seo from "../../components/seo"

const KEY = "cm-paypal-sandbox-order-v1"
const API = process.env.GATSBY_PAYPAL_SANDBOX_API_BASE_URL || ""
const ENABLED = process.env.GATSBY_PAYPAL_SANDBOX_ENABLED === "true"
function apiBase() {
  const url = new URL(API)
  if (url.username || url.password || url.search || url.hash ||
      !(url.protocol === "https:" || (url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname)))) {
    throw new Error("Configura una API de pruebas aislada.")
  }
  return url.href.replace(/\/$/, "")
}
async function post(action, body) {
  const response = await fetch(`${apiBase()}/${action}`, { method: "POST", redirect: "error",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Operación Sandbox no disponible.")
  if (result.environment !== "sandbox") throw new Error("Respuesta fuera de Sandbox.")
  return result
}
function identity() {
  const saved = sessionStorage.getItem(KEY)
  if (saved) return JSON.parse(saved)
  const data = { requestId: crypto.randomUUID(), accessToken: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") }
  sessionStorage.setItem(KEY, JSON.stringify(data))
  return data
}
const labels = { pendiente: "Orden creada, todavía sin pago.", pendiente_pago: "Pago pendiente de confirmación.",
  pagado: "Pago Sandbox confirmado. No se entregaron productos ni se crearon alumnos reales.",
  revision: "Pago en revisión por devolución. Sin entrega.", reembolsado: "Pago reembolsado.",
  revertido: "Pago revertido. Sin entrega.", denegado: "Pago denegado. Sin entrega." }

export default function PayPalSandboxPage() {
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [result, setResult] = React.useState(null)
  const [saved, setSaved] = React.useState(false)
  const locked = React.useRef(false)
  const perform = React.useCallback(async action => {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setMessage("")
    try {
      const data = identity()
      setSaved(true)
      const response = await post(action, { ...data, sku: "ebook_ammac_1", quantity: 1 })
      setResult(response)
      if (action === "createPayPalSandboxOrder") {
        const url = new URL(response.url)
        if (url.origin !== "https://www.sandbox.paypal.com" || url.username || url.password ||
            !["/checkoutnow", "/checkoutnow/"].includes(url.pathname)) throw new Error("Enlace Sandbox inválido.")
        window.location.assign(url.href)
      }
    } catch (error) { setMessage(error.message || "No se pudo verificar el pago. Consulta el estado.") }
    finally { locked.current = false; setBusy(false) }
  }, [])
  React.useEffect(() => {
    if (!ENABLED) return
    try {
      const hasOrder = Boolean(sessionStorage.getItem(KEY))
      setSaved(hasOrder)
      const query = new URLSearchParams(window.location.search)
      window.history.replaceState(null, "", window.location.pathname)
      if (query.get("cancel")) setMessage("Regresaste sin completar el pago. Puedes consultar su estado.")
      else if (query.has("token")) {
        if (hasOrder) perform("capturePayPalSandboxOrder")
        else setMessage("No hay una orden de prueba en este navegador. No se confirmó ningún pago.")
      }
    } catch (_) { setMessage("Esta prueba necesita almacenamiento de sesión habilitado.") }
  }, [perform])
  return <main className="min-h-screen bg-slate-100 px-5 py-16 text-slate-900">
    <article className="mx-auto max-w-lg rounded-3xl bg-white p-7 shadow-lg space-y-6">
      <p className="font-bold text-amber-800">PRUEBAS · PAYPAL SANDBOX</p>
      <h1 className="text-3xl font-bold">Compra de prueba</h1>
      <p>Sin dinero real, descargas, inscripciones ni correos. Usa únicamente cuentas ficticias de PayPal Sandbox.</p>
      {!ENABLED ? <p role="status">Esta prueba está deshabilitada en este sitio.</p> : <>
        <section className="rounded-xl bg-slate-100 p-4">
          <h2 className="font-semibold">Ebook 1 · Pedagogía científica</h2>
          <p>Catálogo de pruebas: $213.00 MXN. Sin cupones ni envío.</p>
        </section>
        {result && <p role="status">{labels[result.estado] || "Estado no confirmado. Consulta nuevamente."}</p>}
        {message && <p role="alert" className="text-amber-900">{message}</p>}
        <div className="flex flex-col gap-3">
          {!saved && <button disabled={busy} onClick={() => perform("createPayPalSandboxOrder")}
            className="min-h-[48px] rounded-full bg-blueAccessible text-white px-6 py-3 disabled:opacity-50">
            {busy ? "Conectando…" : "Pagar con PayPal Sandbox"}</button>}
          {saved && <>
            <button disabled={busy} onClick={() => perform("getPayPalSandboxStatus")}
              className="min-h-[48px] rounded-full border border-blueAccessible px-6 py-3 disabled:opacity-50">Consultar estado</button>
            <button disabled={busy} onClick={() => perform("capturePayPalSandboxOrder")}
              className="min-h-[48px] rounded-full border border-blueAccessible px-6 py-3 disabled:opacity-50">Confirmar / reconciliar prueba</button>
            {!result?.pagado && <button disabled={busy} onClick={() => perform("createPayPalSandboxOrder")}
              className="min-h-[48px] rounded-full bg-blueAccessible text-white px-6 py-3 disabled:opacity-50">Continuar en PayPal Sandbox</button>}
          </>}
        </div>
      </>}
    </article>
  </main>
}
export const Head = () => <Seo title="Prueba privada PayPal Sandbox" robots="noindex,nofollow" />
