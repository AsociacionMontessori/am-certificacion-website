import LoadingSpinner from './LoadingSpinner';

const LoadingOverlay = ({ 
  isLoading, 
  message = 'Cargando...',
  variant = 'default',
  children,
  className = ''
}) => {
  if (!isLoading) {
    return children;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Contenido con overlay */}
      <div className={isLoading ? 'opacity-30 pointer-events-none' : ''}>
        {children}
      </div>
      
      {/* Overlay de carga */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg">
          <LoadingSpinner 
            size="lg" 
            variant={variant}
            message={message}
          />
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;

