import { auth } from '../config/firebase';

const BASE_URL = 'https://us-central1-certificacionmontessori.cloudfunctions.net';

export const MAX_FILE_MB = 10;
export const ACCEPT_DOCS = 'image/jpeg,image/png,image/webp,application/pdf';

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Estado del expediente de un alumno: documentos entregados (con URL de
 * descarga firmada, válida ~15 min), qué exige su programa y qué le falta.
 * Devuelve { docs, requeridos, opcionales, faltantes, expedienteCompleto }.
 */
export const getExpedienteDocsUrls = async (alumnoId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/getExpedienteDocsUrls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ alumnoId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'No se pudieron obtener los documentos');
  }
  return {
    docs: data.docs || [],
    // Versiones reemplazadas. Solo llegan con lectura privilegiada
    // (administración o directivos); al alumno le llega vacío.
    historial: data.historial || [],
    requeridos: data.requeridos || [],
    opcionales: data.opcionales || [],
    faltantes: data.faltantes || [],
    expedienteCompleto: Boolean(data.expedienteCompleto),
  };
};

/**
 * Sube un documento del expediente. Administración puede subir por cualquier
 * alumno; el alumno solo el suyo. Volver a subir el mismo tipo reemplaza el
 * archivo anterior en lugar de acumular copias.
 */
export const subirDocumentoExpediente = async (alumnoId, docType, file) => {
  if (!file) throw new Error('Selecciona un archivo');
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`El archivo debe ser menor a ${MAX_FILE_MB} MB`);
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/getExpedienteUploadUrl`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      alumnoId,
      docType,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo preparar la subida');
  }

  const put = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!put.ok) {
    throw new Error('No se pudo subir el archivo');
  }
  return { storagePath: data.storagePath, docType: data.docType };
};
