import { forwardRef, useMemo } from 'react';
import { clsx } from 'clsx';

const UserAvatar = forwardRef(({ 
  user,
  size = 'md',
  className = '',
  showName = false,
  showStatus = false,
  status = 'online',
  ...props 
}, ref) => {
  const avatarColors = useMemo(() => {
    if (!user?.name) {
      return {
        bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
        text: 'text-white'
      };
    }

    // Create a hash from the user's name for consistent colors
    const hash = user.name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Predefined gradient combinations for attractive avatars
    const gradientCombinations = [
      { bg: 'bg-gradient-to-br from-primary-500 to-primary-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-success-500 to-success-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-accent-500 to-accent-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-warning-500 to-warning-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-danger-500 to-danger-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-teal-500 to-teal-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-rose-500 to-rose-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', text: 'text-white' },
      { bg: 'bg-gradient-to-br from-amber-500 to-amber-600', text: 'text-gray-900' },
    ];

    const colorIndex = Math.abs(hash) % gradientCombinations.length;
    return gradientCombinations[colorIndex];
  }, [user?.name]);

  // Get user's first character
  const getInitials = (name) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  // Size configurations
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl',
  };

  // Status configurations
  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    away: 'bg-warning-500',
    busy: 'bg-danger-500',
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-full font-semibold select-none shadow-soft';

  // If user has an avatar image, display it
  if (user?.avatar) {
    return (
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            ref={ref}
            src={user.avatar}
            alt={`${user.name || 'User'} avatar`}
            className={clsx(
              'rounded-full object-cover shadow-soft',
              sizes[size],
              className
            )}
            onError={(e) => {
              // If image fails to load, hide it and show fallback
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            {...props}
          />
          {/* Fallback avatar (hidden by default) */}
          <div
            className={clsx(
              baseClasses,
              avatarColors.bg,
              avatarColors.text,
              sizes[size],
              'hidden',
              className
            )}
          >
            {getInitials(user.name)}
          </div>
          {/* Status indicator */}
          {showStatus && (
            <div className={clsx(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
              statusColors[status] || statusColors.online
            )} />
          )}
        </div>
        {showName && user?.name && (
          <span className="text-sm font-semibold text-gray-900">
            {user.name}
          </span>
        )}
      </div>
    );
  }

  // Display fallback avatar with initials
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div
          ref={ref}
          className={clsx(
            baseClasses,
            avatarColors.bg,
            avatarColors.text,
            sizes[size],
            className
          )}
          {...props}
        >
          {getInitials(user?.name)}
        </div>
        {/* Status indicator */}
        {showStatus && (
          <div className={clsx(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
            statusColors[status] || statusColors.online
          )} />
        )}
      </div>
      {showName && user?.name && (
        <span className="text-sm font-semibold text-gray-900">
          {user.name}
        </span>
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
