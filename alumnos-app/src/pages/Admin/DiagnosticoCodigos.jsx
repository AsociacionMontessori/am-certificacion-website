import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { generarCodigoVerificacion } from '../../services/certificadoService';
import { ArrowLeftIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DiagnosticoCodigos = () => {
  const [alumnos, setAlumnos] = useState([]); // usado para resumen
  const [loading, setLoading] = useState(true);
  const [diagnostico, setDiagnostico] = useState([]);

  useEffect(() => {
    const loadDiagnostico = async () => {
      try {
        const alumnosSnapshot = await getDocs(collection(db, 'alumnos'));
        const alumnosData = alumnosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const diagnosticos = [];
        for (const alumno of alumnosData) {
          const folio = alumno.folioCertificado;
          const codigoGuardado = alumno.codigoVerificacion;
          
          if (folio) {
            const codigoEsperado = generarCodigoVerificacion(alumno.id, folio);
            const tieneCodigo = !!codigoGuardado;
            const codigoCorrecto = codigoGuardado?.trim().toUpperCase() === codigoEsperado;
            
            diagnosticos.push({
              alumno: alumno.nombre || 'Sin nombre',
              alumnoId: alumno.id,
              folio,
              tieneCodigo,
              codigoGuardado,
              codigoEsperado,
              codigoCorrecto,
              estado: !tieneCodigo ? 'FALTA_CODIGO' : !codigoCorrecto ? 'CODIGO_INCORRECTO' : 'OK'
            });
          }
        }

        setAlumnos(alumnosData);
        setDiagnostico(diagnosticos);
      } catch (error) {
        console.error('Error al cargar diagnóstico:', error);
      }
      setLoading(false);
    };

    loadDiagnostico();
  }, []);

  const problemas = diagnostico.filter(d => d.estado !== 'OK');
  const correctos = diagnostico.filter(d => d.estado === 'OK');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

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
          Diagnóstico de Códigos de Verificación
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Verifica el estado de los códigos de verificación en la base de datos
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-blue">{diagnostico.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total con folio</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green">{correctos.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Códigos correctos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-red">{problemas.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Problemas</div>
        </div>
      </div>

      {/* Problemas */}
      {problemas.length > 0 && (
        <div className="bg-red/10 dark:bg-red/20 border border-red/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red mr-2" />
            Problemas Encontrados ({problemas.length})
          </h2>
          <div className="space-y-4">
            {problemas.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.alumno}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {item.alumnoId}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Folio:</span>{' '}
                        <span className="font-mono text-gray-700 dark:text-gray-300">{item.folio}</span>
                      </p>
                      {item.estado === 'FALTA_CODIGO' && (
                        <div className="text-red text-sm">
                          ❌ No tiene código de verificación guardado
                        </div>
                      )}
                      {item.estado === 'CODIGO_INCORRECTO' && (
                        <div className="space-y-1">
                          <div className="text-red text-sm">
                            ❌ Código incorrecto
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span>Guardado:</span>{' '}
                            <span className="font-mono">{item.codigoGuardado}</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span>Esperado:</span>{' '}
                            <span className="font-mono">{item.codigoEsperado}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correctos */}
      {correctos.length > 0 && (
        <div className="bg-green/10 dark:bg-green/20 border border-green/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CheckCircleIcon className="w-6 h-6 text-green mr-2" />
            Códigos Correctos ({correctos.length})
          </h2>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {correctos.slice(0, 20).map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green/30">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.alumno}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Folio: <span className="font-mono">{item.folio}</span> | 
                  Código: <span className="font-mono">{item.codigoGuardado}</span>
                </p>
              </div>
            ))}
            {correctos.length > 20 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Mostrando primeros 20 de {correctos.length} códigos correctos
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticoCodigos;

