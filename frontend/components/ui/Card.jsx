import { clsx } from 'clsx';

const Card = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  padding = 'p-6 sm:p-8',
  shadow = 'shadow-soft',
  border = 'border border-gray-100',
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-white rounded-2xl shadow-soft border border-gray-100 transition-all duration-300 hover:shadow-medium hover:border-gray-200',
    elevated: 'bg-white rounded-2xl shadow-medium border border-gray-100 transition-all duration-300 hover:shadow-large hover:border-gray-200 transform hover:-translate-y-1',
    gradient: 'bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-soft border border-gray-100 transition-all duration-300 hover:shadow-medium hover:border-gray-200',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-soft transition-all duration-300 hover:shadow-medium',
  };

  return (
    <div
      className={clsx(
        variants[variant],
        padding,
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card; 