import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DocumentTextIcon, UserIcon, AcademicCapIcon, LinkIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatearFechaLarga } from '../utils/formatearFecha';
import { getEstadoBadgeClasses } from '../utils/estadoBadgeClasses';

const Expediente = () => {
  const { currentUser, userData } = useAuth();
  const { success } = useNotifications();
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpediente = async () => {
      if (currentUser) {
        try {
          const expedienteDoc = await getDoc(doc(db, 'alumnos', currentUser.uid));
          if (expedienteDoc.exists()) {
            setExpediente({ id: expedienteDoc.id, ...expedienteDoc.data() });
          }
        } catch (error) {
          console.error('Error al cargar expediente:', error);
        }
      }
      setLoading(false);
    };

    loadExpediente();
  }, [currentUser]);

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        variant="montessori"
        message="Cargando expediente..."
        className="h-64"
      />
    );
  }

  const alumnoId = currentUser?.uid;
  const baseCertUrl = alumnoId ? `${window.location.origin}/certificado/${alumnoId}` : '';
  const constanciaUrl = alumnoId ? `${baseCertUrl}?tipo=constancia` : '';
  const tieneCertificado = Boolean(expediente?.fechaGraduacion);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mi Expediente
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Información personal y documentos académicos
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Información Personal */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <UserIcon className="w-6 h-6 text-blue mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Información Personal
            </h2>
          </div>
          <dl className="space-y-4">
            {expediente?.nombre && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre completo</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{expediente.nombre}</dd>
              </div>
            )}
            {expediente?.matricula && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Matrícula</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{expediente.matricula}</dd>
              </div>
            )}
            {expediente?.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email de inicio de sesión</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{expediente.email}</dd>
              </div>
            )}
            {expediente?.emailContacto && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email de contacto (y recuperación)</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{expediente.emailContacto}</dd>
              </div>
            )}
            {expediente?.telefono && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{expediente.telefono}</dd>
              </div>
            )}
            {expediente?.fechaNacimiento && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de nacimiento</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatearFechaLarga(expediente.fechaNacimiento)}
                </dd>
              </div>
            )}
            {expediente?.mailClassroom && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Mail de Classroom</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{expediente.mailClassroom}</dd>
              </div>
            )}
            {expediente?.passwordClassroom && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contraseña de Classroom</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1 font-mono">{expediente.passwordClassroom}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Información Académica */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="w-6 h-6 text-green mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Información Académica
            </h2>
          </div>
          <dl className="space-y-4">
            {expediente?.programa && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Programa</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{expediente.programa}</dd>
              </div>
            )}
            {expediente?.cohorte && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cohorte</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{expediente.cohorte}</dd>
              </div>
            )}
            {expediente?.fechaIngreso && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de ingreso</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatearFechaLarga(expediente.fechaIngreso)}
                </dd>
              </div>
            )}
            {expediente?.estado && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadgeClasses(expediente.estado)}`}>
                    {expediente.estado}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Enlaces Públicos - Ocultos si usuario inactivo */}
      {userData?.estado !== 'Inactivo' && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <LinkIcon className="w-6 h-6 text-blue mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Enlaces Públicos
            </h2>
          </div>
          <div className="space-y-4">
            {/* Vista Pública */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vista pública del perfil
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/public/alumno/${currentUser?.uid}`}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-0"
                />
                <div className="flex gap-2 sm:flex-shrink-0">
                  <a
                    href={`/public/alumno/${currentUser?.uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors text-sm whitespace-nowrap"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Ver
                  </a>
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/public/alumno/${currentUser?.uid}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        success('URL copiada al portapapeles');
                      } catch (error) {
                        console.error('Error al copiar:', error);
                      }
                    }}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green text-gray-900 dark:bg-green/80 dark:text-gray-900 rounded-lg hover:bg-green/90 dark:hover:bg-green/70 transition-colors text-sm whitespace-nowrap"
                  >
                    <ShareIcon className="w-4 h-4 mr-1" />
                    Compartir
                  </button>
                </div>
              </div>
            </div>

            {/* Enlaces por nivel (solo si tiene más de un nivel) */}
            {expediente?.niveles?.length > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Certificados y constancias por nivel
                </label>
                <div className="space-y-3">
                  {expediente.niveles.map((nivel) => {
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
                              {esCompletado ? 'Completado' : 'Activo'}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {nivel.nombre}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {tipoDoc}: {nivelUrl}
                          </p>
                        </div>
                        <div className="flex gap-2 sm:flex-shrink-0">
                          <a
                            href={nivelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg transition-colors text-xs whitespace-nowrap ${esCompletado
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

            {/* Constancia general - siempre visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Constancia de estudios {expediente?.niveles?.length > 1 ? '(general)' : '(nivel actual)'}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={constanciaUrl}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-0"
                />
                <div className="flex gap-2 sm:flex-shrink-0">
                  <a
                    href={constanciaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green text-gray-900 dark:bg-green/80 dark:text-gray-900 rounded-lg hover:bg-green/90 dark:hover:bg-green/70 transition-colors text-sm whitespace-nowrap"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Ver constancia
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(constanciaUrl);
                        success('URL copiada al portapapeles');
                      } catch (error) {
                        console.error('Error al copiar:', error);
                      }
                    }}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green text-gray-900 dark:bg-green/80 dark:text-gray-900 rounded-lg hover:bg-green/90 dark:hover:bg-green/70 transition-colors text-sm whitespace-nowrap"
                  >
                    <ShareIcon className="w-4 h-4 mr-1" />
                    Compartir
                  </button>
                </div>
              </div>
            </div>

            {tieneCertificado && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certificado digital de graduación
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={baseCertUrl}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-0"
                  />
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <a
                      href={baseCertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green text-gray-900 dark:bg-green/80 dark:text-gray-900 rounded-lg hover:bg-green/90 dark:hover:bg-green/70 transition-colors text-sm whitespace-nowrap"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      Ver certificado
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(baseCertUrl);
                          success('URL copiada al portapapeles');
                        } catch (error) {
                          console.error('Error al copiar:', error);
                        }
                      }}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green text-gray-900 dark:bg-green/80 dark:text-gray-900 rounded-lg hover:bg-green/90 dark:hover:bg-green/70 transition-colors text-sm whitespace-nowrap"
                    >
                      <ShareIcon className="w-4 h-4 mr-1" />
                      Compartir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Expediente;
