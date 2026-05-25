const DEFAULT_CHECKOUT_URL =
  "https://us-central1-certificacionmontessori.cloudfunctions.net/createPublicCheckout"

const DEFAULT_DIGITAL_DOWNLOAD_URL =
  "https://us-central1-certificacionmontessori.cloudfunctions.net/getDigitalBookDownloadUrl"

export const getCheckoutApiUrl = () =>
  process.env.GATSBY_CHECKOUT_API_URL || DEFAULT_CHECKOUT_URL

export const getDigitalDownloadApiUrl = () =>
  process.env.GATSBY_DIGITAL_DOWNLOAD_API_URL || DEFAULT_DIGITAL_DOWNLOAD_URL

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

/**
 * @param {object} payload
 * @returns {Promise<{ url: string, fileName: string, expiresInSeconds: number }>}
 */
export async function getDigitalBookDownloadUrl(payload) {
  const response = await fetch(getDigitalDownloadApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || "No se pudo preparar la descarga")
  }

  if (!data.url) {
    throw new Error("Respuesta de descarga incompleta")
  }

  return data
}
