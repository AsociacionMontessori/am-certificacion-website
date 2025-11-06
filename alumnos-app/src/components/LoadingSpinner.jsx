import { AcademicCapIcon } from '@heroicons/react/24/outline';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'default',
  fullScreen = false,
  message = null,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const spinnerVariants = {
    default: (
      <div className={`animate-spin rounded-full border-b-2 border-blue ${sizeClasses[size]}`}></div>
    ),
    dots: (
      <div className="flex space-x-2">
        <div className={`${sizeClasses[size]} rounded-full bg-blue animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${sizeClasses[size]} rounded-full bg-blue animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${sizeClasses[size]} rounded-full bg-blue animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    ),
    pulse: (
      <div className={`${sizeClasses[size]} rounded-full bg-blue animate-pulse`}></div>
    ),
    montessori: (
      <div className="relative">
        <AcademicCapIcon className={`${sizeClasses[size]} text-blue animate-spin`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${sizeClasses[size]} rounded-full border-2 border-blue border-t-transparent animate-spin`}></div>
        </div>
      </div>
    )
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {spinnerVariants[variant]}
      {message && (
        <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;

