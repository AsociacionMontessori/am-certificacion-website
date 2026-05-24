const DEFAULT_CHECKOUT_URL =
  "https://us-central1-certificacionmontessori.cloudfunctions.net/createPublicCheckout"

export const getCheckoutApiUrl = () =>
  process.env.GATSBY_CHECKOUT_API_URL || DEFAULT_CHECKOUT_URL

/**
 * @param {object} payload
 * @returns {Promise<{ url: string, ordenId: string }>}
 */
export async function createPublicCheckoutSession(payload) {
  const response = await fetch(getCheckoutApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || "No se pudo iniciar el pago")
  }

  if (!data.url) {
    throw new Error("Respuesta de pago incompleta")
  }

  return data
}
