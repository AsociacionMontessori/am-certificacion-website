import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ExclamationTriangleIcon, 
  CalendarIcon,
  EnvelopeIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getMateriasProximas } from '../services/notificacionesService';
import { sendNotificacionMateriasProximas } from '../services/emailService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';

const AlertasMateriasProximas = () => {
  const { currentUser, userData } = useAuth();
  const { success, error: showError } = useNotifications();
  const [materiasProximas, setMateriasProximas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const cargarMateriasProximas = async () => {
      try {
        const materias = await getMateriasProximas();
        setMateriasProximas(materias);
        
        // Verificar si ya se envió email hoy
        const lastEmailDate = localStorage.getItem('lastMateriasEmailDate');
        const today = new Date().toDateString();
        setEmailEnviado(lastEmailDate === today);
      } catch (error) {
        console.error('Error al cargar materias próximas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarMateriasProximas();
    
    // Verificar cada 5 minutos
    const interval = setInterval(cargarMateriasProximas, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleEnviarEmail = async () => {
    // Obtener email del admin (prioridad: userData.email, luego currentUser.email)
    const adminEmail = userData?.email || currentUser?.email;
    
    if (!adminEmail) {
      showError('No se puede enviar el email: no hay email del administrador configurado');
      return;
    }

    setEnviandoEmail(true);
    try {
      const resultado = await sendNotificacionMateriasProximas(materiasProximas, adminEmail);
      if (resultado.success) {
        setEmailEnviado(true);
        localStorage.setItem('lastMateriasEmailDate', new Date().toDateString());
        success(resultado.message || 'Email enviado exitosamente');
      } else {
        showError(resultado.error || 'Error al enviar el email');
      }
    } catch (error) {
      console.error('Error al enviar email:', error);
      showError('Error al enviar el email. Por favor, intenta de nuevo.');
    } finally {
      setEnviandoEmail(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Guardar el estado de dismiss para esta sesión
    sessionStorage.setItem('materiasProximasDismissed', 'true');
  };

  // Verificar si se desestimó en esta sesión
  useEffect(() => {
    const dismissed = sessionStorage.getItem('materiasProximasDismissed');
    if (dismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <LoadingSpinner size="sm" variant="montessori" />
      </div>
    );
  }

  if (dismissed || materiasProximas.length === 0) {
    return null;
  }

  // Agrupar por urgencia
  const muyUrgentes = materiasProximas.filter(m => m.diasRestantes <= 3);
  const urgentes = materiasProximas.filter(m => m.diasRestantes > 3 && m.diasRestantes <= 5);
  const proximas = materiasProximas.filter(m => m.diasRestantes > 5);

  const colorUrgencia = muyUrgentes.length > 0 ? 'red' : urgentes.length > 0 ? 'yellow' : 'blue';
  const bgColor = colorUrgencia === 'red' 
    ? 'bg-red/10 dark:bg-red/20 border-red/30' 
    : colorUrgencia === 'yellow'
    ? 'bg-yellow/10 dark:bg-yellow/20 border-yellow/30'
    : 'bg-blue/10 dark:bg-blue/20 border-blue/30';
  const textColorClass = colorUrgencia === 'red' 
    ? 'text-red' 
    : colorUrgencia === 'yellow'
    ? 'text-yellow'
    : 'text-blue';

  return (
    <div className={`${bgColor} rounded-xl shadow-md border p-4 sm:p-6 mb-6 animate-slide-up`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <ExclamationTriangleIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${textColorClass} flex-shrink-0 mt-1`} />
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg sm:text-xl font-bold ${textColorClass} mb-1`}>
              Materias Próximas a Iniciar
            </h3>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {materiasProximas.length} materia(s) iniciarán en 7 días o menos
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Cerrar alerta"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Lista de materias */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {muyUrgentes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-red mb-2 uppercase tracking-wide">
              ⚠️ Muy Urgentes (3 días o menos)
            </p>
            {muyUrgentes.map((item) => (
              <MateriaItem key={item.materia.id} item={item} color="red" />
            ))}
          </div>
        )}
        
        {urgentes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-yellow mb-2 uppercase tracking-wide">
              ⚡ Urgentes (4-5 días)
            </p>
            {urgentes.map((item) => (
              <MateriaItem key={item.materia.id} item={item} color="yellow" />
            ))}
          </div>
        )}
        
        {proximas.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue mb-2 uppercase tracking-wide">
              📅 Próximas (6-7 días)
            </p>
            {proximas.map((item) => (
              <MateriaItem key={item.materia.id} item={item} color="blue" />
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        {materiasProximas.length > 0 && materiasProximas[0]?.alumno?.id && (
          <Link
            to={`/admin/alumno/${materiasProximas[0].alumno.id}`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue/90 transition-colors"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Ver Detalles
          </Link>
        )}
        <button
          onClick={handleEnviarEmail}
          disabled={enviandoEmail || emailEnviado}
          className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            emailEnviado
              ? 'bg-green text-gray-900 dark:text-gray-900 cursor-not-allowed'
              : enviandoEmail
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          {enviandoEmail ? (
            <>
              <LoadingSpinner size="sm" variant="montessori" className="mr-2" />
              Enviando...
            </>
          ) : emailEnviado ? (
            <>
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Email Enviado Hoy
            </>
          ) : (
            <>
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Enviar Email
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const MateriaItem = ({ item, color }) => {
  const fechaFormateada = item.fechaInicio.toLocaleDateString('es-MX', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const borderColorClass = color === 'red' 
    ? 'border-red' 
    : color === 'yellow'
    ? 'border-yellow'
    : 'border-blue';
  const bgBadgeClass = color === 'red' 
    ? 'bg-red' 
    : color === 'yellow'
    ? 'bg-yellow'
    : 'bg-blue';
  const textBadgeClass = color === 'yellow'
    ? 'text-gray-900 dark:text-gray-900'
    : 'text-white';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 ${borderColorClass} shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
              {item.materia.nombre}
            </h4>
            <span className={`badge ${bgBadgeClass} ${textBadgeClass} text-xs flex-shrink-0`}>
              {item.diasRestantes} día{item.diasRestantes !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            {item.alumno?.nombre || 'Alumno no encontrado'}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
            <ClockIcon className="w-3 h-3" />
            <span>{fechaFormateada}</span>
            {item.alumno?.nivel && (
              <>
                <span>•</span>
                <span>{item.alumno.nivel}</span>
              </>
            )}
          </div>
        </div>
        {item.alumno?.id && (
          <Link
            to={`/admin/alumno/${item.alumno.id}`}
            className="flex-shrink-0 text-blue hover:text-blue/80 text-xs font-medium"
          >
            Ver →
          </Link>
        )}
      </div>
    </div>
  );
};

export default AlertasMateriasProximas;
