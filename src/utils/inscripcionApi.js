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

export async function fetchInscripcionOrden(ordenId) {
  return postJson(getInscripcionOrdenUrl(), { ordenId })
}

export async function submitInscripcionParte1(ordenId, datos) {
  return postJson(getCompleteParte1Url(), { ordenId, ...datos })
}

export async function submitInscripcionParte2(ordenId, datos) {
  return postJson(getCompleteParte2Url(), { ordenId, ...datos })
}

export async function requestInscripcionUploadUrl(ordenId, docType, file) {
  return postJson(getUploadUrlEndpoint(), {
    ordenId,
    docType,
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  })
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
