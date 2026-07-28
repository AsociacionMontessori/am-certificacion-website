import { useState, useEffect, useCallback } from 'react';
import { DocumentTextIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getExpedienteDocsUrls } from '../services/expedienteService';

const LABELS = {
  actaNacimiento: 'Acta de nacimiento',
  comprobanteEstudios: 'Comprobante de estudios',
  cedulaFiscal: 'Constancia de situación fiscal (SAT)',
  identificacionOficial: 'Identificación oficial',
  comprobanteDomicilio: 'Comprobante de domicilio',
  reglamentoFirmado: 'Reglamento firmado',
  comprobantePagoTransferencia: 'Comprobante de pago (transferencia)',
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ExpedienteDocumentos = ({ alumnoId }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cargadoUnaVez, setCargadoUnaVez] = useState(false);

  const cargar = useCallback(async () => {
    if (!alumnoId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getExpedienteDocsUrls(alumnoId);
      setDocs(data);
    } catch (e) {
      setError(e.message || 'No se pudieron obtener los documentos');
    } finally {
      setLoading(false);
      setCargadoUnaVez(true);
    }
  }, [alumnoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Documentos del expediente
        </h2>
        <button
          type="button"
          onClick={cargar}
          disabled={loading}
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {loading && !cargadoUnaVez && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando documentos…</p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!error && cargadoUnaVez && docs.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Este alumno aún no ha subido documentos a su expediente.
        </p>
      )}

      {docs.length > 0 && (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {docs.map((doc) => (
            <li key={doc.path} className="flex items-center justify-between py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {LABELS[doc.docType] || doc.docType || 'Documento'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {doc.fileName}
                    {doc.sizeBytes ? ` · ${formatSize(doc.sizeBytes)}` : ''}
                  </p>
                </div>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Ver / descargar
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Los enlaces de descarga son temporales (≈15 min). Usa «Actualizar» si expiran.
      </p>
    </div>
  );
};

export default ExpedienteDocumentos;
