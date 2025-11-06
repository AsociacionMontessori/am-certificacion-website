import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DocumentTextIcon, UserIcon, AcademicCapIcon, LinkIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatearFechaLarga } from '../utils/formatearFecha';

const Expediente = () => {
  const { currentUser, userData } = useAuth();
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    expediente.estado === 'Activo' 
                      ? 'bg-green text-white' 
                      : 'bg-gray text-white'
                  }`}>
                    {expediente.estado}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Enlaces Públicos */}
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
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm min-w-0"
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
                  onClick={() => {
                    const url = `${window.location.origin}/public/alumno/${currentUser?.uid}`;
                    navigator.clipboard.writeText(url).then(() => {
                      alert('URL copiada al portapapeles');
                    });
                  }}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green text-white rounded-lg hover:bg-green/90 transition-colors text-sm whitespace-nowrap"
                >
                  <ShareIcon className="w-4 h-4 mr-1" />
                  Compartir
                </button>
              </div>
            </div>
          </div>

          {/* Certificado Digital */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Certificado digital / Constancia de estudios
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/certificado/${currentUser?.uid}`}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm min-w-0"
              />
              <div className="flex gap-2 sm:flex-shrink-0">
                <a
                  href={`/certificado/${currentUser?.uid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green text-white rounded-lg hover:bg-green/90 transition-colors text-sm whitespace-nowrap"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  Ver
                </a>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/certificado/${currentUser?.uid}`;
                    navigator.clipboard.writeText(url).then(() => {
                      alert('URL copiada al portapapeles');
                    });
                  }}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green text-white rounded-lg hover:bg-green/90 transition-colors text-sm whitespace-nowrap"
                >
                  <ShareIcon className="w-4 h-4 mr-1" />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expediente;

