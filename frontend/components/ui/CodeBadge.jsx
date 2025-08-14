import Badge from './Badge';
import { 
  UserIcon, 
  UsersIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  CurrencyDollarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const CodeBadge = ({ code, size = 'xxs', className = '' }) => {
  if (!code) return null;

  const getCodeConfig = (code) => {
    if (code.startsWith('SADM-')) {
      return {
        variant: 'danger',
        icon: AcademicCapIcon,
        label: 'Super Admin'
      };
    }
    if (code.startsWith('ADM-')) {
      return {
        variant: 'warning',
        icon: UserIcon,
        label: 'Admin'
      };
    }
    if (code.startsWith('MNG-')) {
      return {
        variant: 'accent',
        icon: UsersIcon,
        label: 'Manager'
      };
    }
    if (code.startsWith('AGT-')) {
      return {
        variant: 'primary',
        icon: UserGroupIcon,
        label: 'Agent'
      };
    }
    if (code.startsWith('PROP-')) {
      return {
        variant: 'success',
        icon: BuildingOfficeIcon,
        label: 'Property'
      };
    }
    if (code.startsWith('BRK-')) {
      return {
        variant: 'secondary',
        icon: CurrencyDollarIcon,
        label: 'Brokerage'
      };
    }
    
    // Default fallback for unknown codes
    return {
      variant: 'outline',
      icon: UserIcon,
      label: 'Code'
    };
  };

  const config = getCodeConfig(code);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      size={size} 
      className={className}
    >
      <Icon className="h-3 w-3 mr-1" />
      {code}
    </Badge>
  );
};

export default CodeBadge; 