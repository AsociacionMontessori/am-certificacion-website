import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
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
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ShieldCheckIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import AlertasMateriasAtraso from '../components/AlertasMateriasAtraso';

const Dashboard = () => {
  const { userData } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { success, prompt: showPrompt } = useNotifications();

  // Función para copiar al portapapeles
  const handleCopyToClipboard = async (texto, tipo = '') => {
    try {
      await navigator.clipboard.writeText(texto);
      success(`${tipo ? tipo + ' ' : ''}copiado al portapapeles`);
    } catch (error) {
      console.error('Error al copiar:', error);
      const userInput = await showPrompt(`Copia este ${tipo || 'texto'}:`, {
        defaultValue: texto,
        title: 'Copiar al portapapeles'
      });
      if (userInput) {
        success(`${tipo ? tipo + ' ' : ''}copiado al portapapeles`);
      }
    }
  };

  // Función para copiar el enlace de verificación
  const handleCopyVerificationLink = async () => {
    if (userData?.folioCertificado && userData?.codigoVerificacion) {
      const link = `alumnos.certificacionmontessori.com/verificar?folio=${userData.folioCertificado}&t=${userData.codigoVerificacion}`;
      await handleCopyToClipboard(link, 'Enlace de verificación');
    }
  };

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
          Hola, {userData?.nombre || 'Alumno'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Portal Alumnos de Certificación Montessori - Asociación Montessori de México A.C.
        </p>
      </div>

      {/* Estado: Inactivo */}
      {userData?.estado === 'Inactivo' && (
        <div className="bg-red/10 dark:bg-red/20 border border-red/30 rounded-xl p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-red mb-2">Usuario inactivo</h2>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
            Tu cuenta se encuentra inactiva. Por favor, contacta con administración para mayor información.
          </p>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-2">Posibles causas:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Baja solicitada por el alumno</li>
              <li>Falta de pago</li>
              <li>No asistió a clases o no entregó actividades</li>
              <li>No ingresó al sistema en los últimos tres meses</li>
            </ul>
          </div>
        </div>
      )}

      {/* Alertas de Materias con Atraso */}
      {userData?.estado !== 'Inactivo' && <AlertasMateriasAtraso />}

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
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-900 dark:text-white font-mono flex-1 min-w-0 break-words overflow-hidden">
                      {userData.mailClassroom}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(userData.mailClassroom, 'Mail de Classroom')}
                      className="flex-shrink-0 p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue dark:hover:text-blue transition-colors"
                      title="Copiar mail"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                    Contraseña de Classroom
                  </label>
                  <div className="relative">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-900 dark:text-white font-mono flex-1 min-w-0 break-words overflow-hidden">
                        {showPassword ? userData.passwordClassroom : '••••••••'}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(userData.passwordClassroom, 'Contraseña de Classroom')}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue dark:hover:text-blue transition-colors"
                          title="Copiar contraseña"
                        >
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 italic">
              Usa tus accesos de Classroom para entrar y usar este servicio.
            </p>
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-green text-gray-900 dark:text-gray-900 rounded-lg hover:bg-green/90 font-medium transition-colors"
            >
              Abrir Gmail
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
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 italic">
              Usa tus accesos de Classroom para entrar y usar este servicio.
            </p>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-yellow text-gray-900 dark:text-gray-900 rounded-lg hover:bg-yellow/90 font-medium transition-colors"
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
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 italic">
              Usa tus accesos de Classroom para entrar y usar este servicio.
            </p>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-orange text-white rounded-lg hover:bg-orange/90 font-medium transition-colors"
            >
              Abrir Google Calendar
            </a>
          </div>

          {/* Verificación de Certificado - Oculto si usuario inactivo */}
          {userData?.estado !== 'Inactivo' && (userData?.folioCertificado || userData?.codigoVerificacion) && (
            <div className="bg-blue/10 dark:bg-blue/20 rounded-lg p-5 border border-blue/20">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-blue mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Verificación de Certificado
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Tu folio y código de verificación para validar tu constancia de estudios.
              </p>
              <div className="space-y-3">
                {userData.folioCertificado && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                          Folio
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">
                          {userData.folioCertificado}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyToClipboard(userData.folioCertificado, 'Folio')}
                        className="ml-2 p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue dark:hover:text-blue transition-colors"
                        title="Copiar folio"
                      >
                        <ClipboardDocumentIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                {userData.codigoVerificacion && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                          Código de Verificación
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">
                          {userData.codigoVerificacion}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyToClipboard(userData.codigoVerificacion, 'Código')}
                        className="ml-2 p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue dark:hover:text-blue transition-colors"
                        title="Copiar código"
                      >
                        <ClipboardDocumentIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                {userData.folioCertificado && userData.codigoVerificacion && (
                  <button
                    onClick={handleCopyVerificationLink}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue text-white rounded-lg hover:bg-blue/90 font-medium transition-colors"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                    Copiar Enlace de Verificación
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Enlaces Públicos - Oculto si usuario inactivo */}
          {userData?.estado !== 'Inactivo' && (
          <div className="bg-green/10 dark:bg-green/20 rounded-lg p-5 border border-green/20">
            <div className="flex items-center mb-4">
              <LinkIcon className="w-6 h-6 text-green mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Enlaces Públicos
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Comparte estos enlaces para que otros puedan ver tu información académica pública.
            </p>
            <div className="space-y-3">
              {/* Vista Pública del Perfil */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      Vista Pública del Perfil
                    </label>
                    <p className="text-xs text-gray-900 dark:text-white font-mono truncate">
                      {`${window.location.origin}/public/alumno/${userData?.id || ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleCopyToClipboard(`${window.location.origin}/public/alumno/${userData?.id || ''}`, 'Enlace público')}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green dark:hover:text-green transition-colors"
                      title="Copiar enlace"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                    <a
                      href={`/public/alumno/${userData?.id || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green dark:hover:text-green transition-colors"
                      title="Abrir en nueva pestaña"
                    >
                      <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
              {/* Certificado Digital */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      Certificado Digital
                    </label>
                    <p className="text-xs text-gray-900 dark:text-white font-mono truncate">
                      {`${window.location.origin}/certificado/${userData?.id || ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleCopyToClipboard(`${window.location.origin}/certificado/${userData?.id || ''}`, 'Enlace de certificado')}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green dark:hover:text-green transition-colors"
                      title="Copiar enlace"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                    <a
                      href={`/certificado/${userData?.id || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green dark:hover:text-green transition-colors"
                      title="Abrir en nueva pestaña"
                    >
                      <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <a 
              href="https://asociacionmontessori.com.mx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue hover:underline"
            >
              asociacionmontessori.com.mx
            </a>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Asociación Montessori de México. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 italic">
            Esta aplicación es una donación de un exalumno Montessori.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
