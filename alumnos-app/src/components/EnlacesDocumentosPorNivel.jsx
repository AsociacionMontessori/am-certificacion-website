import { obtenerDocumentosPorNivel } from '../utils/opcionesCertificado';
import { useNotifications } from '../contexts/NotificationContext';

const EnlacesDocumentosPorNivel = ({ alumno }) => {
  const { success, error: showError } = useNotifications();
  const documentos = obtenerDocumentosPorNivel(alumno, window.location.origin);

  return (
    <div className="space-y-4">
      {documentos.map(documento => (
        <div key={documento.url}>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{documento.label}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              aria-label={`URL: ${documento.label}`}
              readOnly
              value={documento.url}
              className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <a href={documento.url} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-green text-gray-900 rounded-lg text-sm whitespace-nowrap">
              Ver {documento.tipo.toLowerCase()}
            </a>
            <button type="button" aria-label={`Copiar: ${documento.label}`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(documento.url);
                  success('URL copiada al portapapeles');
                } catch {
                  showError('No se pudo copiar el enlace. Puedes seleccionarlo y copiarlo manualmente.');
                }
              }}
              className="px-4 py-2 bg-blue text-white rounded-lg text-sm whitespace-nowrap">
              Copiar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnlacesDocumentosPorNivel;
