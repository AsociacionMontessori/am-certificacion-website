import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AcademicCapIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon, LinkIcon, EyeIcon, ShareIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatearFechaLarga } from '../utils/formatearFecha';
import { useNotifications } from '../contexts/NotificationContext';

const Graduacion = () => {
  const { currentUser, userData } = useAuth();
  const { success } = useNotifications();
  const [infoGraduacion, setInfoGraduacion] = useState(null);
  const [alumnoData, setAlumnoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfoGraduacion = async () => {
      if (currentUser) {
        try {
          const [graduacionDoc, alumnoDoc] = await Promise.all([
            getDoc(doc(db, 'graduacion', currentUser.uid)),
            getDoc(doc(db, 'alumnos', currentUser.uid))
          ]);
          if (graduacionDoc.exists()) {
            setInfoGraduacion({ id: graduacionDoc.id, ...graduacionDoc.data() });
          }
          if (alumnoDoc.exists()) {
            setAlumnoData({ id: alumnoDoc.id, ...alumnoDoc.data() });
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
      <LoadingSpinner
        size="lg"
        variant="montessori"
        message="Cargando información de graduación..."
        className="h-64"
      />
    );
  }

  const requisitos = [
    { nombre: 'Completar todas las materias', completado: infoGraduacion?.materiasCompletadas || false },
    { nombre: 'Promedio mínimo de 8.0', completado: infoGraduacion?.promedioMinimo || false },
    { nombre: 'Entrega de Album Montessori (proyecto final)', completado: infoGraduacion?.tesisCompletada || false },
    { nombre: 'Prácticas profesionales', completado: infoGraduacion?.practicasCompletadas || false },
    { nombre: 'Pago de derechos de certificado', completado: infoGraduacion?.pagoRealizado || false },
  ];

  const completados = requisitos.filter(r => r.completado).length;
  const porcentaje = (completados / requisitos.length) * 100;

  const baseCertUrl = currentUser ? `${window.location.origin}/certificado/${currentUser.uid}` : '';
  const tieneMultiplesNiveles = alumnoData?.niveles?.length > 1;

  if (userData?.estado === 'Inactivo') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Información de Graduación</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Progreso y requisitos para tu graduación</p>
        </div>
        <div className="bg-red/10 dark:bg-red/20 border border-red/30 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-red mb-1">Usuario inactivo</h2>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Tu cuenta está inactiva. Contacta con administración para reactivarla.
          </p>
        </div>
      </div>
    );
  }

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
                {formatearFechaLarga(infoGraduacion.fechaCeremonia)}
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

      {/* Certificados por nivel (solo si tiene más de un nivel) */}
      {tieneMultiplesNiveles && currentUser && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <LinkIcon className="w-6 h-6 text-blue mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Certificados y Constancias por Nivel
            </h2>
          </div>
          <div className="space-y-3">
            {alumnoData.niveles.map((nivel) => {
              const esCompletado = nivel.estado !== 'activo';
              const nivelUrl = esCompletado
                ? `${baseCertUrl}?nivel=${nivel.id}`
                : `${baseCertUrl}?nivel=${nivel.id}&tipo=constancia`;
              const tipoDoc = esCompletado ? 'Certificado' : 'Constancia';

              return (
                <div key={nivel.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${esCompletado
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-blue/10 text-blue'
                        }`}>
                        {esCompletado ? 'Completado' : 'En curso'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {nivel.nombre}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {esCompletado ? 'Certificado disponible' : 'Constancia de estudios activa'}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <a
                      href={nivelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg transition-colors text-xs font-medium whitespace-nowrap ${esCompletado
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-blue text-white hover:bg-blue/90'
                        }`}
                    >
                      <EyeIcon className="w-3.5 h-3.5 mr-1" />
                      Ver {tipoDoc.toLowerCase()}
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(nivelUrl);
                          success('URL copiada al portapapeles');
                        } catch (error) {
                          console.error('Error al copiar:', error);
                        }
                      }}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-xs whitespace-nowrap"
                    >
                      <ShareIcon className="w-3.5 h-3.5 mr-1" />
                      Copiar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificado Digital - Link general */}
      {currentUser && (
        <div className="mb-6 bg-gradient-to-r from-green to-green/90 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-white mr-4" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">
                  Certificado Digital
                </h2>
                <p className="text-white/90 text-sm">
                  Accede a tu certificado digital verificable
                </p>
              </div>
            </div>
            <Link
              to={`/certificado/${currentUser.uid}`}
              target="_blank"
              className="inline-flex items-center px-6 py-3 bg-white text-green rounded-lg hover:bg-white/90 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Ver Certificado
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
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

