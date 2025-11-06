import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ArrowLeftIcon, CalendarIcon, ChartBarIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const AlumnoDetail = () => {
  const { id } = useParams();
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlumno = async () => {
      try {
        const alumnoDoc = await getDoc(doc(db, 'alumnos', id));
        if (alumnoDoc.exists()) {
          setAlumno({ id: alumnoDoc.id, ...alumnoDoc.data() });
        }
      } catch (error) {
        console.error('Error al cargar alumno:', error);
      }
      setLoading(false);
    };

    loadAlumno();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <p className="text-gray-600 dark:text-gray-400">Alumno no encontrado</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Link
        to="/admin"
        className="inline-flex items-center text-blue hover:text-blue/80 mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Volver al panel
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {alumno.nombre}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Detalles del alumno
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Información Personal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información Personal
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
              <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.nombre}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Matrícula</dt>
              <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.matricula || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
              <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.telefono || 'N/A'}</dd>
            </div>
            {alumno.fechaNacimiento && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de nacimiento</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {alumno.fechaNacimiento.toDate ? 
                    new Date(alumno.fechaNacimiento.toDate()).toLocaleDateString() :
                    alumno.fechaNacimiento
                  }
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Información Académica */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información Académica
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Programa</dt>
              <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.programa || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cohorte</dt>
              <dd className="text-sm text-gray-900 dark:text-white mt-1">{alumno.cohorte || 'N/A'}</dd>
            </div>
            {alumno.fechaIngreso && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de ingreso</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {alumno.fechaIngreso.toDate ? 
                    new Date(alumno.fechaIngreso.toDate()).toLocaleDateString() :
                    alumno.fechaIngreso
                  }
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alumno.estado === 'Activo' 
                    ? 'bg-green text-white'
                    : alumno.estado === 'Graduado'
                    ? 'bg-yellow text-white'
                    : 'bg-gray text-white'
                }`}>
                  {alumno.estado || 'N/A'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Gestión Académica */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Gestión Académica
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to={`/admin/alumno/${alumno.id}/materias`}
              className="flex items-center p-4 bg-blue/10 dark:bg-blue/20 rounded-lg hover:bg-blue/20 dark:hover:bg-blue/30 transition-colors"
            >
              <CalendarIcon className="w-6 h-6 text-blue mr-3" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Materias</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestionar calendario</p>
              </div>
            </Link>
            <Link
              to={`/admin/alumno/${alumno.id}/calificaciones`}
              className="flex items-center p-4 bg-yellow/10 dark:bg-yellow/20 rounded-lg hover:bg-yellow/20 dark:hover:bg-yellow/30 transition-colors"
            >
              <ChartBarIcon className="w-6 h-6 text-yellow mr-3" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Calificaciones</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestionar calificaciones</p>
              </div>
            </Link>
            <Link
              to={`/admin/alumno/${alumno.id}/graduacion`}
              className="flex items-center p-4 bg-green/10 dark:bg-green/20 rounded-lg hover:bg-green/20 dark:hover:bg-green/30 transition-colors"
            >
              <AcademicCapIcon className="w-6 h-6 text-green mr-3" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Graduación</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestionar graduación</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Vista Pública y Certificado */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Enlaces Públicos
          </h2>
          
          {/* Vista Pública */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Vista pública del perfil:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/public/alumno/${alumno.id}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm min-w-0"
              />
              <Link
                to={`/public/alumno/${alumno.id}`}
                target="_blank"
                className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 transition-colors text-sm whitespace-nowrap sm:flex-shrink-0"
              >
                Ver
              </Link>
            </div>
          </div>

          {/* Certificado Digital */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Certificado digital / Constancia de estudios:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/certificado/${alumno.id}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm min-w-0"
              />
              <Link
                to={`/certificado/${alumno.id}`}
                target="_blank"
                className="px-4 py-2 bg-green text-white rounded-lg hover:bg-green/90 transition-colors text-sm whitespace-nowrap sm:flex-shrink-0"
              >
                Ver Certificado
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumnoDetail;

