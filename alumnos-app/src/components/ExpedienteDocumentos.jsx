import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  getExpedienteDocsUrls,
  subirDocumentoExpediente,
  ACCEPT_DOCS,
  MAX_FILE_MB,
} from '../services/expedienteService';

const LABELS = {
  actaNacimiento: 'Acta de nacimiento',
  comprobanteEstudios: 'Comprobante de estudios',
  cedulaFiscal: 'Constancia de situación fiscal (SAT)',
  identificacionOficial: 'Identificación oficial',
  comprobanteDomicilio: 'Comprobante de domicilio',
  reglamentoFirmado: 'Contrato / reglamento firmado',
  comprobantePagoTransferencia: 'Comprobante de pago (transferencia)',
};

// Orden de presentación estable, para que la lista no baile entre recargas.
const ORDEN = [
  'actaNacimiento',
  'comprobanteEstudios',
  'identificacionOficial',
  'comprobanteDomicilio',
  'reglamentoFirmado',
  'cedulaFiscal',
  'comprobantePagoTransferencia',
];

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ExpedienteDocumentos = ({ alumnoId, soloLectura = false, titulo = 'Documentos del expediente' }) => {
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cargadoUnaVez, setCargadoUnaVez] = useState(false);
  const [subiendo, setSubiendo] = useState('');
  const [errorSubida, setErrorSubida] = useState({});
  const inputsRef = useRef({});

  const cargar = useCallback(async () => {
    if (!alumnoId) return;
    setLoading(true);
    setError('');
    try {
      setEstado(await getExpedienteDocsUrls(alumnoId));
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

  const handleArchivo = async (docType, event) => {
    const file = event.target.files?.[0];
    // Permite volver a elegir el mismo archivo si la subida falló.
    event.target.value = '';
    if (!file) return;
    setErrorSubida((prev) => ({ ...prev, [docType]: '' }));
    setSubiendo(docType);
    try {
      await subirDocumentoExpediente(alumnoId, docType, file);
      await cargar();
    } catch (e) {
      setErrorSubida((prev) => ({ ...prev, [docType]: e.message || 'No se pudo subir' }));
    } finally {
      setSubiendo('');
    }
  };

  const requeridos = estado?.requeridos || [];
  const opcionales = estado?.opcionales || [];
  const faltantes = estado?.faltantes || [];
  const historial = estado?.historial || [];
  const porTipo = new Map((estado?.docs || []).map((d) => [d.docType, d]));

  const tipos = ORDEN.filter((t) => requeridos.includes(t) || opcionales.includes(t));
  // Cualquier tipo entregado que no esté en el catálogo actual (documentos
  // históricos) se muestra igual: no conviene esconder algo que sí existe.
  const extras = [...porTipo.keys()].filter((t) => t && !tipos.includes(t));

  return (
    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{titulo}</h2>
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

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!error && cargadoUnaVez && estado && (
        <div
          className={`mb-4 flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
            estado.expedienteCompleto
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
          }`}
        >
          {estado.expedienteCompleto ? (
            <CheckCircleIcon className="h-5 w-5 shrink-0" />
          ) : (
            <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
          )}
          <span>
            {estado.expedienteCompleto
              ? 'Expediente completo: están todos los documentos obligatorios.'
              : `Faltan ${faltantes.length} documento${faltantes.length === 1 ? '' : 's'}: ${faltantes
                  .map((t) => LABELS[t] || t)
                  .join(', ')}.`}
          </span>
        </div>
      )}

      {!error && cargadoUnaVez && estado && (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...tipos, ...extras].map((docType) => {
            const doc = porTipo.get(docType);
            const esObligatorio = requeridos.includes(docType);
            const estaSubiendo = subiendo === docType;
            return (
              <li key={docType} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <DocumentTextIcon
                    className={`h-6 w-6 shrink-0 ${doc ? 'text-gray-400' : 'text-amber-400'}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {LABELS[docType] || docType}
                      {!esObligatorio && (
                        <span className="ml-2 text-xs font-normal text-gray-400">opcional</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {doc
                        ? `${doc.fileName}${doc.sizeBytes ? ` · ${formatSize(doc.sizeBytes)}` : ''}`
                        : 'Pendiente de entregar'}
                    </p>
                    {errorSubida[docType] && (
                      <p className="text-xs text-red-600 dark:text-red-400">{errorSubida[docType]}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {doc && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Ver
                    </a>
                  )}
                  {!soloLectura && (
                    <>
                      <input
                        ref={(el) => {
                          inputsRef.current[docType] = el;
                        }}
                        type="file"
                        accept={ACCEPT_DOCS}
                        className="hidden"
                        onChange={(e) => handleArchivo(docType, e)}
                      />
                      <button
                        type="button"
                        disabled={estaSubiendo}
                        onClick={() => inputsRef.current[docType]?.click()}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
                      >
                        <ArrowUpTrayIcon className={`h-4 w-4 ${estaSubiendo ? 'animate-pulse' : ''}`} />
                        {estaSubiendo ? 'Subiendo…' : doc ? 'Reemplazar' : 'Subir'}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {historial.length > 0 && (
        <details className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
          <summary className="text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
            Versiones anteriores ({historial.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {historial.map((h) => (
              <li key={h.path} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-500 dark:text-gray-400 truncate">
                  {LABELS[h.docType] || h.docType}
                  {h.reemplazadoEn ? ` · reemplazado el ${new Date(h.reemplazadoEn).toLocaleDateString('es-MX')}` : ''}
                </span>
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  Ver
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-3 text-xs text-gray-400">
        PDF o imagen, máximo {MAX_FILE_MB} MB. Al reemplazar un documento, la versión anterior se
        conserva en el historial.
        Los enlaces de descarga son temporales (≈15 min); usa «Actualizar» si expiran.
      </p>
    </div>
  );
};

export default ExpedienteDocumentos;
