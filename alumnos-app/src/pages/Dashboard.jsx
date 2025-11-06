import { useAuth } from '../contexts/AuthContext';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  AcademicCapIcon,
  BookOpenIcon,
  EnvelopeIcon,
  FolderIcon,
  CalendarDaysIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Dashboard = () => {
  const { userData } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

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

      {/* Accesos Rápidos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Accesos Rápidos
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Classroom */}
          <div className="bg-blue/10 dark:bg-blue/20 rounded-lg p-5 border border-blue/20">
            <div className="flex items-center mb-4">
              <BookOpenIcon className="w-6 h-6 text-blue mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Accede a tus clases
              </h3>
            </div>
            {userData?.mailClassroom && userData?.passwordClassroom ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                    Mail de Classroom
                  </label>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-900 dark:text-white font-mono">
                      {userData.mailClassroom}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                    Contraseña de Classroom
                  </label>
                  <div className="relative">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between">
                      <p className="text-sm text-gray-900 dark:text-white font-mono flex-1">
                        {showPassword ? userData.passwordClassroom : '••••••••'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <a
                  href="https://classroom.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue text-white rounded-lg hover:bg-blue/90 font-medium transition-colors"
                >
                  Ir a Google Classroom
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Las credenciales de Classroom estarán disponibles próximamente.
              </p>
            )}
          </div>

          {/* Correo Escolar */}
          <div className="bg-green/10 dark:bg-green/20 rounded-lg p-5 border border-green/20">
            <div className="flex items-center mb-4">
              <EnvelopeIcon className="w-6 h-6 text-green mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ingresa a tu correo escolar
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Accede a tu correo institucional para recibir comunicaciones importantes.
            </p>
            <a
              href="http://mail.certificacionmontessori.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-green text-white rounded-lg hover:bg-green/90 font-medium transition-colors"
            >
              Abrir Correo Escolar
            </a>
          </div>

          {/* Drive */}
          <div className="bg-yellow/10 dark:bg-yellow/20 rounded-lg p-5 border border-yellow/20">
            <div className="flex items-center mb-4">
              <FolderIcon className="w-6 h-6 text-yellow mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Drive
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Gestiona tus documentos de clases y materiales académicos.
            </p>
            <a
              href="https://drive.certificacionmontessori.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-yellow text-white rounded-lg hover:bg-yellow/90 font-medium transition-colors"
            >
              Abrir Google Drive
            </a>
          </div>

          {/* Calendario */}
          <div className="bg-orange/10 dark:bg-orange/20 rounded-lg p-5 border border-orange/20">
            <div className="flex items-center mb-4">
              <CalendarDaysIcon className="w-6 h-6 text-orange mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Calendario
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Consulta eventos, fechas importantes y actividades académicas.
            </p>
            <a
              href="https://calendario.certificacionmontessori.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-orange text-white rounded-lg hover:bg-orange/90 font-medium transition-colors"
            >
              Abrir Calendario
            </a>
          </div>
        </div>
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

