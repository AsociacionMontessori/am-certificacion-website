import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { regenerarTodosLosCodigos } from '../../utils/regenerarCodigosVerificacion';

const STORAGE_KEY = 'regenerarCodigos_historial';

const RegenerarCodigos = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [ejecutando, setEjecutando] = useState(false);

  // Cargar historial guardado al montar el componente
  useEffect(() => {
    const historialGuardado = localStorage.getItem(STORAGE_KEY);
    if (historialGuardado) {
      try {
        const parsed = JSON.parse(historialGuardado);
        setResultado(parsed);
      } catch (error) {
        console.error('Error al cargar historial:', error);
      }
    }
  }, []);

  const handleRegenerar = async () => {
    if (!window.confirm('¿Estás seguro de regenerar todos los códigos de verificación? Esto actualizará los códigos de todos los alumnos que tienen folio.')) {
      return;
    }

    setLoading(true);
    setEjecutando(true);
    setResultado(null);

    try {
      const resultado = await regenerarTodosLosCodigos();
      const resultadoConFecha = {
        ...resultado,
        fecha: new Date().toISOString()
      };
      setResultado(resultadoConFecha);
      // Guardar en localStorage
      if (resultadoConFecha) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resultadoConFecha));
      }
    } catch (error) {
      console.error('Error:', error);
      const errorResult = {
        success: false,
        error: error.message,
        fecha: new Date().toISOString()
      };
      setResultado(errorResult);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(errorResult));
    } finally {
      setLoading(false);
      setEjecutando(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center text-blue hover:text-blue/80 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver al panel
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          Regenerar Códigos de Verificación
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Regenera los códigos de verificación de todos los certificados existentes con el nuevo algoritmo determinístico
        </p>
      </div>

      <div className="bg-yellow/10 dark:bg-yellow/20 border border-yellow/30 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow">Advertencia</h3>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <p>
                Este proceso regenerará los códigos de verificación de todos los alumnos que tienen un folio de certificado.
                Los códigos se generarán usando el nuevo algoritmo determinístico que asegura que el código sea siempre el mismo
                para el mismo folio y alumno.
              </p>
              <p className="mt-2">
                <strong>Nota:</strong> Los códigos QR existentes dejarán de funcionar hasta que se regeneren los certificados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleRegenerar}
            disabled={loading || ejecutando}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue text-white rounded-lg hover:bg-blue/90 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                Regenerando...
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Regenerar Todos los Códigos
              </>
            )}
          </button>
          {resultado && (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas limpiar el historial guardado?')) {
                  localStorage.removeItem(STORAGE_KEY);
                  setResultado(null);
                }
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Limpiar Historial
            </button>
          )}
        </div>
      </div>

      {resultado && (
        <div className={`rounded-xl shadow-sm border p-6 ${
          resultado.success 
            ? 'bg-green/10 dark:bg-green/20 border-green/30' 
            : 'bg-red/10 dark:bg-red/20 border-red/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {resultado.success ? '✅ Proceso Completado' : '❌ Error en el Proceso'}
            </h2>
            {resultado.fecha && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(resultado.fecha).toLocaleString('es-MX')}
              </span>
            )}
          </div>
          
          {resultado.success ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue">{resultado.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green">{resultado.actualizados}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Actualizados</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow">{resultado.yaCorrectos}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ya Correctos</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red">{resultado.errores}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Errores</div>
                </div>
              </div>

              {resultado.resultados && resultado.resultados.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    Detalles por Alumno
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Alumno</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Folio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Código</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {resultado.resultados.slice(0, 50).map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.alumno}</td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{item.folio}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.estado === 'actualizado' 
                                    ? 'bg-green text-gray-900'
                                    : item.estado === 'ya_correcto'
                                    ? 'bg-yellow text-gray-900 dark:text-white'
                                    : 'bg-red text-white'
                                }`}>
                                  {item.estado === 'actualizado' ? 'Actualizado' : 
                                   item.estado === 'ya_correcto' ? 'Ya correcto' : 'Error'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                                {item.codigoNuevo || item.codigo || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {resultado.resultados.length > 50 && (
                        <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-700">
                          Mostrando primeros 50 de {resultado.resultados.length} resultados
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red">
              <p className="font-semibold">Error:</p>
              <p>{resultado.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegenerarCodigos;

