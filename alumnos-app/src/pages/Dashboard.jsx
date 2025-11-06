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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          Bienvenido, {userData?.nombre || 'Alumno'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Portal Alumnos de Certificación Montessori - Asociación Montessori de México A.C.
        </p>
      </div>

      {/* Cards de navegación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card, index) => (
          <Link
            key={card.title}
            to={card.href}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 p-5 sm:p-6 hover:scale-[1.02] animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`${card.color} w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue transition-colors">
              {card.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Link a Inscripción */}
      <div className="bg-gradient-to-r from-green to-green/90 rounded-xl shadow-sm border border-green/20 p-6 transition-all duration-300 hover:shadow-md">
        <Link
          to="/inscripcion"
          className="flex items-center justify-between group"
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">Completa tu Información</h3>
            <p className="text-sm text-white/90">Asegúrate de tener todos tus datos actualizados</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Información rápida */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            Información del Alumno
          </h2>
          <dl className="space-y-3">
            {userData?.matricula && (
              <div className="flex justify-between items-center py-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Matrícula</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">{userData.matricula}</dd>
              </div>
            )}
            {userData?.programa && (
              <div className="flex justify-between items-center py-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Programa</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">{userData.programa}</dd>
              </div>
            )}
            {userData?.cohorte && (
              <div className="flex justify-between items-center py-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cohorte</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">{userData.cohorte}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            Estado Académico
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Aquí encontrarás información sobre tu progreso académico y próximos pasos en tu camino hacia la certificación.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

