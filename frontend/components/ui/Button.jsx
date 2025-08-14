import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  iconSize,
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-responsive-button transform hover:-translate-y-0.5 active:translate-y-0';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white focus:ring-primary-500/30 shadow-soft hover:shadow-medium',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900 focus:ring-gray-500/30 shadow-soft hover:shadow-medium',
    success: 'bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white focus:ring-success-500/30 shadow-soft hover:shadow-medium',
    danger: 'bg-gradient-to-r from-danger-600 to-danger-700 hover:from-danger-700 hover:to-danger-800 text-white focus:ring-danger-500/30 shadow-soft hover:shadow-medium',
    outline: 'border-2 border-gray-300 hover:border-primary-500 text-gray-700 hover:text-primary-700 focus:ring-primary-500/30 bg-white hover:bg-primary-50 shadow-soft hover:shadow-medium',
    ghost: 'text-gray-700 hover:text-primary-700 focus:ring-primary-500/30 hover:bg-primary-50',
    accent: 'bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white focus:ring-accent-500/30 shadow-soft hover:shadow-medium',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-xs sm:text-sm',
    md: 'px-4 py-2.5 text-sm sm:text-base',
    lg: 'px-6 py-3 text-base sm:text-lg',
    xl: 'px-8 py-4 text-lg sm:text-xl',
    square: 'w-8 h-8 p-0 text-xs sm:text-sm',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3 sm:h-4 sm:w-4',
    md: 'h-4 w-4 sm:h-5 sm:w-5',
    lg: 'h-5 w-5 sm:h-6 sm:w-6',
    xl: 'h-6 w-6 sm:h-7 sm:w-7',
    square: 'h-4 w-4',
  };

  return (
    <button
      ref={ref}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={clsx(iconSize || iconSizes[size], size === 'square' ? '' : 'mr-2')} />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={clsx(iconSize || iconSizes[size], size === 'square' ? '' : 'ml-2')} />
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 