import { clsx } from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary',
  message = 'Loading...',
  className = '',
  fullScreen = false,
  ...props 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const variants = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600',
    white: 'text-white',
  };

  return (
    <div 
      className={clsx(
        'flex flex-col items-center justify-center',
        fullScreen && 'fixed inset-0 bg-white z-50',
        !fullScreen && 'min-h-[200px]',
        className
      )} 
      {...props}
    >
      <div className="relative">
        <svg 
          className={clsx(
            'animate-spin',
            sizes[size],
            variants[variant]
          )} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {message && (
        <p className="mt-3 text-sm font-medium text-gray-600 animate-pulse-soft">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 