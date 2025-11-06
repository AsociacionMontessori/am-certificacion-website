import { useAuth } from '../contexts/AuthContext';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  AcademicCapIcon 
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { userData } = useAuth();

  const cards = [
    {
      title: 'Mi Expediente',
      description: 'Consulta tu información personal y documentos académicos',
      icon: DocumentTextIcon,
      href: '/expediente',
      color: 'bg-blue'
    },
    {
      title: 'Calendario',
      description: 'Revisa tus materias y horarios de clase',
      icon: CalendarIcon,
      href: '/calendario',
      color: 'bg-green'
    },
    {
      title: 'Calificaciones',
      description: 'Consulta tus calificaciones y promedios',
      icon: ChartBarIcon,
      href: '/calificaciones',
      color: 'bg-yellow'
    },
    {
      title: 'Graduación',
      description: 'Información sobre tu proceso de graduación',
      icon: AcademicCapIcon,
      href: '/graduacion',
      color: 'bg-orange'
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenido, {userData?.nombre || 'Alumno'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Portal Alumnos de Certificación Montessori - Asociación Montessori de México A.C.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.href}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {card.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Link a Inscripción */}
      <div className="mt-8 mb-6">
        <Link
          to="/inscripcion"
          className="inline-flex items-center px-6 py-3 bg-green text-white rounded-lg hover:bg-green/90 transition-colors font-medium"
        >
          Completa tu Información de Inscripción
        </Link>
      </div>

      {/* Información rápida */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información del Alumno
          </h2>
          <dl className="space-y-2">
            {userData?.matricula && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Matrícula</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{userData.matricula}</dd>
              </div>
            )}
            {userData?.programa && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Programa</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{userData.programa}</dd>
              </div>
            )}
            {userData?.cohorte && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Cohorte</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{userData.cohorte}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Estado Académico
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aquí encontrarás información sobre tu progreso académico y próximos pasos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

