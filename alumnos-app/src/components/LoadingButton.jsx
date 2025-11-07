import LoadingSpinner from './LoadingSpinner';

const LoadingButton = ({
  isLoading = false,
  disabled = false,
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue text-white hover:bg-blue/90 focus:ring-blue',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600',
    danger: 'bg-red text-white hover:bg-red/90 focus:ring-red',
    success: 'bg-green text-gray-900 dark:text-gray-900 hover:bg-green/90 focus:ring-green'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" variant="default" className="mr-2" />
          <span>Procesando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
