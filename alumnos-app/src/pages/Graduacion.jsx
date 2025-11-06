import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AcademicCapIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const Graduacion = () => {
  const { currentUser } = useAuth();
  const [infoGraduacion, setInfoGraduacion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfoGraduacion = async () => {
      if (currentUser) {
        try {
          const graduacionDoc = await getDoc(doc(db, 'graduacion', currentUser.uid));
          if (graduacionDoc.exists()) {
            setInfoGraduacion({ id: graduacionDoc.id, ...graduacionDoc.data() });
          }
        } catch (error) {
          console.error('Error al cargar información de graduación:', error);
        }
      }
      setLoading(false);
    };

    loadInfoGraduacion();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  const requisitos = [
    { nombre: 'Completar todas las materias', completado: infoGraduacion?.materiasCompletadas || false },
    { nombre: 'Promedio mínimo de 8.0', completado: infoGraduacion?.promedioMinimo || false },
    { nombre: 'Tesis o proyecto final', completado: infoGraduacion?.tesisCompletada || false },
    { nombre: 'Prácticas profesionales', completado: infoGraduacion?.practicasCompletadas || false },
    { nombre: 'Pago de derechos de titulación', completado: infoGraduacion?.pagoRealizado || false },
  ];

  const completados = requisitos.filter(r => r.completado).length;
  const porcentaje = (completados / requisitos.length) * 100;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Información de Graduación
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Progreso y requisitos para tu graduación
        </p>
      </div>

      {/* Progreso General */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <AcademicCapIcon className="w-8 h-8 text-blue mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Progreso de Graduación
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completados} de {requisitos.length} requisitos completados
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue h-4 rounded-full transition-all duration-300"
              style={{ width: `${porcentaje}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {porcentaje.toFixed(0)}% completado
          </p>
        </div>
      </div>

      {/* Requisitos */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Requisitos de Graduación
        </h2>
        <ul className="space-y-3">
          {requisitos.map((requisito, index) => (
            <li key={index} className="flex items-center">
              {requisito.completado ? (
                <CheckCircleIcon className="w-6 h-6 text-green mr-3" />
              ) : (
                <ClockIcon className="w-6 h-6 text-gray-400 mr-3" />
              )}
              <span className={`text-sm ${requisito.completado ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {requisito.nombre}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Información Adicional */}
      {infoGraduacion && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {infoGraduacion.fechaCeremonia && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Fecha de Ceremonia
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {infoGraduacion.fechaCeremonia.toDate ? 
                new Date(infoGraduacion.fechaCeremonia.toDate()).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) :
                infoGraduacion.fechaCeremonia
              }
            </p>
          </div>
          )}

          {infoGraduacion.lugarCeremonia && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Lugar de Ceremonia
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {infoGraduacion.lugarCeremonia}
              </p>
            </div>
          )}

          {infoGraduacion.horaCeremonia && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Hora de Ceremonia
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {infoGraduacion.horaCeremonia}
              </p>
            </div>
          )}

          {infoGraduacion.instrucciones && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Instrucciones Adicionales
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {infoGraduacion.instrucciones}
              </p>
            </div>
          )}
        </div>
      )}

      {!infoGraduacion && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            La información de graduación estará disponible cuando esté próxima tu fecha de graduación.
          </p>
        </div>
      )}
    </div>
  );
};

export default Graduacion;

