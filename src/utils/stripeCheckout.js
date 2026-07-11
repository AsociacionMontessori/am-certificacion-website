const DEFAULT_CHECKOUT_URL =
  "https://us-central1-certificacionmontessori.cloudfunctions.net/createPublicCheckout"

const DEFAULT_DIGITAL_DOWNLOAD_URL =
  "https://us-central1-certificacionmontessori.cloudfunctions.net/getDigitalBookDownloadUrl"

const STRIPE_CHECKOUT_ORIGIN = "https://checkout.stripe.com"

export const getCheckoutApiUrl = () =>
  process.env.GATSBY_CHECKOUT_API_URL || DEFAULT_CHECKOUT_URL

export const getDigitalDownloadApiUrl = () =>
  process.env.GATSBY_DIGITAL_DOWNLOAD_API_URL || DEFAULT_DIGITAL_DOWNLOAD_URL

const getPublicStripeCheckoutUrl = value => {
  if (typeof value !== "string") return undefined

  try {
    const url = new URL(value)
    if (
      url.protocol !== "https:" ||
      url.hostname !== "checkout.stripe.com" ||
      url.username ||
      url.password ||
      url.origin !== STRIPE_CHECKOUT_ORIGIN
    ) {
      return undefined
    }
    return url.href
  } catch (_error) {
    return undefined
  }
}

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

  const data = (await response.json().catch(() => ({}))) || {}

  if (!response.ok) {
    throw new Error(data.error || "No se pudo iniciar el pago")
  }

  const url = getPublicStripeCheckoutUrl(data.url)
  if (!url) {
    throw new Error("Respuesta de pago incompleta")
  }

  return { ...data, url }
}

function getFileNameFromDisposition(disposition) {
  const match = String(disposition || "").match(/filename="([^"]+)"/)
  return match?.[1] || "ebook"
}

/**
 * @param {object} payload
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function downloadDigitalBookFile(payload) {
  const response = await fetch(getDigitalDownloadApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || "No se pudo preparar la descarga")
  }

  return {
    blob: await response.blob(),
    fileName: getFileNameFromDisposition(response.headers.get("Content-Disposition")),
  }
}
