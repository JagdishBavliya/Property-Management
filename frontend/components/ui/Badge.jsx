import { clsx } from 'clsx';

const Badge = ({  children,  variant = 'primary',  size = 'md', className = '', ...props }) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-success-100 text-success-800 border-success-200',
    warning: 'bg-warning-100 text-warning-800 border-warning-200',
    danger: 'bg-danger-100 text-danger-800 border-danger-200',
    accent: 'bg-accent-100 text-accent-800 border-accent-200',
    outline: 'bg-transparent text-gray-700 border-gray-300',
  };
  
  const sizes = {
    xxs: 'px-2 py-0.5 text-xs whitespace-nowrap',
    xs: 'px-2.5 py-0.5 text-xs whitespace-nowrap',
    sm: 'px-3 py-0.5 text-xs whitespace-nowrap',
    md: 'px-3.5 py-1 text-xs whitespace-nowrap',
    lg: 'px-4 py-1.5 text-sm whitespace-nowrap',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
export default Badge; 