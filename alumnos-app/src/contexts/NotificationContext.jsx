import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/solid';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);

  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration
    };

    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return showNotification(message, 'success', duration);
  }, [showNotification]);

  const error = useCallback((message, duration) => {
    return showNotification(message, 'error', duration);
  }, [showNotification]);

  const warning = useCallback((message, duration) => {
    return showNotification(message, 'warning', duration);
  }, [showNotification]);

  const info = useCallback((message, duration) => {
    return showNotification(message, 'info', duration);
  }, [showNotification]);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        title: options.title || 'Confirmar',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning', // 'warning', 'danger', 'info'
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  const prompt = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setPromptDialog({
        message,
        title: options.title || 'Ingresa información',
        placeholder: options.placeholder || '',
        defaultValue: options.defaultValue || '',
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'text', // 'text', 'password', 'email', etc.
        onConfirm: (value) => {
          setPromptDialog(null);
          resolve(value);
        },
        onCancel: () => {
          setPromptDialog(null);
          resolve(null);
        }
      });
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
        confirm,
        prompt
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
      {promptDialog && <PromptDialog {...promptDialog} />}
    </NotificationContext.Provider>
  );
};

// Componente de contenedor de notificaciones
const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full sm:max-w-md">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// Componente de notificación Toast
const NotificationToast = ({ notification, onRemove }) => {
  const { id, message, type } = notification;

  const configs = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green/95 dark:bg-green/90',
      borderColor: 'border-green',
      iconColor: 'text-white',
      textColor: 'text-white',
      shadowColor: 'shadow-green/50'
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red/95 dark:bg-red/90',
      borderColor: 'border-red',
      iconColor: 'text-white',
      textColor: 'text-white',
      shadowColor: 'shadow-red/50'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow/95 dark:bg-yellow/90',
      borderColor: 'border-yellow',
      iconColor: 'text-gray-900',
      textColor: 'text-gray-900 dark:text-white',
      shadowColor: 'shadow-yellow/50'
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue/95 dark:bg-blue/90',
      borderColor: 'border-blue',
      iconColor: 'text-white',
      textColor: 'text-white',
      shadowColor: 'shadow-blue/50'
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        ${config.bgColor}
        ${config.borderColor}
        ${config.shadowColor}
        border-2 rounded-xl p-4 shadow-lg backdrop-blur-sm
        animate-slide-in-right
        flex items-start gap-3
        min-w-[280px] max-w-full
      `}
      role="alert"
    >
      <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <p className={`flex-1 ${config.textColor} text-sm sm:text-base font-medium`}>
        {message}
      </p>
      <button
        onClick={() => onRemove(id)}
        className={`
          ${config.textColor}
          hover:opacity-70 transition-opacity flex-shrink-0
          p-1 -mt-1 -mr-1
        `}
        aria-label="Cerrar notificación"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Componente de diálogo de confirmación
const ConfirmDialog = ({ 
  message, 
  title, 
  confirmText, 
  cancelText, 
  type = 'warning',
  onConfirm, 
  onCancel 
}) => {
  const configs = {
    warning: {
      iconColor: 'text-yellow',
      bgColor: 'bg-yellow/10 dark:bg-yellow/20',
      buttonColor: 'bg-yellow text-gray-900 hover:bg-yellow/90'
    },
    danger: {
      iconColor: 'text-red',
      bgColor: 'bg-red/10 dark:bg-red/20',
      buttonColor: 'bg-red text-white hover:bg-red/90'
    },
    info: {
      iconColor: 'text-blue',
      bgColor: 'bg-blue/10 dark:bg-blue/20',
      buttonColor: 'bg-blue text-white hover:bg-blue/90'
    }
  };

  const config = configs[type] || configs.warning;
  const Icon = type === 'danger' ? XCircleIcon : ExclamationTriangleIcon;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full
          animate-scale-in
          border-2 border-gray-200 dark:border-gray-700
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`${config.bgColor} rounded-full p-3 flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                {message}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-6">
            <button
              onClick={onCancel}
              className="
                px-4 py-2.5 rounded-lg font-medium
                bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-600
                transition-colors
              "
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`
                px-4 py-2.5 rounded-lg font-medium
                ${config.buttonColor}
                transition-colors
                shadow-sm hover:shadow-md
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de diálogo de prompt
const PromptDialog = ({
  message,
  title,
  placeholder,
  defaultValue = '',
  confirmText,
  cancelText,
  type = 'text',
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue);

  // Reset value when dialog opens
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="
          bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full
          animate-scale-in
          border-2 border-gray-200 dark:border-gray-700
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
              {message}
            </p>
          </div>

          <input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="
              w-full px-4 py-2.5 rounded-lg
              border-2 border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent
              transition-colors
            "
            autoFocus
          />

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-6">
            <button
              onClick={onCancel}
              className="
                px-4 py-2.5 rounded-lg font-medium
                bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-600
                transition-colors
              "
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!value.trim()}
              className="
                px-4 py-2.5 rounded-lg font-medium
                bg-blue text-white hover:bg-blue/90
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                shadow-sm hover:shadow-md
              "
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

