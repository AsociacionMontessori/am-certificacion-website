import { navigate } from "gatsby"

/** Redirige retornos de Stripe que caen en / por hosting SPA legacy. */
export function redirectStripeCheckoutReturn(location) {
  if (typeof window === "undefined" || !location?.search) return
  const params = new URLSearchParams(location.search)
  const orden = params.get("orden")
  const tipo = params.get("tipo")
  if (!orden) return
  if (tipo === "inscripcion" || tipo === "inicio_programa") {
    navigate(`/checkout/success${location.search}`, { replace: true })
  }
}
