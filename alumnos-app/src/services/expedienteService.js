import { auth } from '../config/firebase';

const BASE_URL = 'https://us-central1-certificacionmontessori.cloudfunctions.net';

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
 * Obtiene los documentos del expediente de un alumno con URLs de descarga
 * firmadas (válidas ~15 min). Devuelve un arreglo de
 * { docType, fileName, contentType, sizeBytes, updated, url }.
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
  return data.docs || [];
};
