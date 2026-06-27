const FUNCTIONS_BASE =
  "https://us-central1-certificacionmontessori.cloudfunctions.net"

export const getInscripcionOrdenUrl = () =>
  process.env.GATSBY_GET_INSCRIPCION_ORDEN_URL ||
  `${FUNCTIONS_BASE}/getInscripcionOrden`

export const getCompleteParte1Url = () =>
  process.env.GATSBY_COMPLETE_INSCRIPCION_PARTE1_URL ||
  `${FUNCTIONS_BASE}/completeInscripcionParte1`

export const getCompleteParte2Url = () =>
  process.env.GATSBY_COMPLETE_INSCRIPCION_PARTE2_URL ||
  `${FUNCTIONS_BASE}/completeInscripcionParte2`

export const getUploadUrlEndpoint = () =>
  process.env.GATSBY_INSCRIPCION_UPLOAD_URL ||
  `${FUNCTIONS_BASE}/getInscripcionUploadUrl`

export const getCanjearCodigoDirectoUrl = () =>
  process.env.GATSBY_CANJEAR_CODIGO_DIRECTO_URL ||
  `${FUNCTIONS_BASE}/canjearCodigoDirecto`

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "No se pudo completar la solicitud")
  }
  return data
}

// F-02: el `accessToken` viaja en `?t=` del success_url y debe acompañar a
// cada llamada a los endpoints de inscripción para autorizar acceso a la
// orden. Si la orden es legacy (sin `accessTokenHash` en Firestore), el
// backend acepta llamadas sin token; este shim solo añade el campo cuando
// el frontend lo tiene disponible.
function withToken(body, accessToken) {
  if (!accessToken) return body
  return { ...body, accessToken }
}

export async function fetchInscripcionOrden(ordenId, accessToken) {
  return postJson(getInscripcionOrdenUrl(), withToken({ ordenId }, accessToken))
}

// Canjea el código compartido de inscripción directa (pago hecho con nosotros
// fuera de línea) por una orden pagada individual. Devuelve { ordenId, accessToken }.
export async function canjearCodigoDirecto(codigo) {
  return postJson(getCanjearCodigoDirectoUrl(), { codigo })
}

export async function submitInscripcionParte1(ordenId, datos, accessToken) {
  return postJson(getCompleteParte1Url(), withToken({ ordenId, ...datos }, accessToken))
}

export async function submitInscripcionParte2(ordenId, datos, accessToken) {
  return postJson(getCompleteParte2Url(), withToken({ ordenId, ...datos }, accessToken))
}

export async function requestInscripcionUploadUrl(ordenId, docType, file, accessToken) {
  return postJson(getUploadUrlEndpoint(), withToken({
    ordenId,
    docType,
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  }, accessToken))
}

export async function uploadFileToSignedUrl(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!response.ok) {
    throw new Error("No se pudo subir el archivo")
  }
}
