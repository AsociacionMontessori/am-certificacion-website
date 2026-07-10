import { navigate } from "gatsby"
import { localizePath, parsePath } from "../i18n/config"

/** Redirige retornos de Stripe que caen en / por hosting SPA legacy. */
export function redirectStripeCheckoutReturn(location) {
  if (typeof window === "undefined" || !location?.search) return
  const params = new URLSearchParams(location.search)
  const orden = params.get("orden")
  const tipo = params.get("tipo")
  if (!orden) return
  if (tipo === "inscripcion" || tipo === "inicio_programa") {
    const search = location.search || ""
    const { language } = parsePath(location.pathname)
    navigate(localizePath(language, `/checkout/success${search}`), { replace: true })
  }
}
