import React, { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';

const CheckPermission = ({ permission, children, fallback = null }) => {
  const { user, loading } = useAuth();

  const hasPermission = useMemo(() => {
    if (!user) return false;
    if (loading && user) return true;
    if (!user?.permissions || user.permissions.length === 0) return false;
    
    const perms = user.permissions;    
    if (Array.isArray(perms) && perms.length > 0 && typeof perms[0] === 'string') {
      return new Set(perms).has(permission);
    }    
    if (Array.isArray(perms) && perms.length > 0 && typeof perms[0] === 'object') {
      const allPermissions = perms.flatMap(item => [item?.name,item?.code, item?.permission].filter(Boolean));
      return new Set(allPermissions).has(permission);
    }
    return false;
  }, [user, permission, loading]);
  
  return hasPermission ? children : fallback;
};

export default CheckPermission;