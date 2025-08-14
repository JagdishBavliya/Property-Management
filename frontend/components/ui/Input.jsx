import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  variant = 'default',
  required = false,
  ...props 
}, ref) => {
  const variants = {
    default: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/30 focus:border-primary-500 text-sm sm:text-base transition-all duration-300 bg-white hover:border-gray-300 shadow-soft focus:shadow-medium',
    error: 'w-full px-4 py-3 border-2 border-danger-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-danger-500/30 focus:border-danger-500 text-sm sm:text-base transition-all duration-300 bg-white shadow-soft focus:shadow-medium',
    success: 'w-full px-4 py-3 border-2 border-success-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-success-500/30 focus:border-success-500 text-sm sm:text-base transition-all duration-300 bg-white shadow-soft focus:shadow-medium',
  };

  const inputVariant = error ? 'error' : variant;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          className={clsx(
            variants[inputVariant],
            LeftIcon && 'pl-12',
            RightIcon && 'pr-12',
            className
          )}
          {...props}
        />
        
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {RightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={clsx(
          'mt-2 flex items-center gap-1 text-sm',
          error ? 'text-danger-600' : 'text-gray-600'
        )}>
          {error && (
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {helperText && !error && (
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 