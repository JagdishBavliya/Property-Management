import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { 
  selectCurrentUser, selectIsAuthenticated, selectToken, selectAuthLoading,
  selectAuthError, loginUser, getCurrentUser, logout,  clearError
} from '../store/slices/authSlice';

const getStoredToken = () => (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
const getStoredUserId = () => (typeof window !== 'undefined') ? localStorage.getItem('user_id') : null;

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  
  useEffect(() => {
    if (getStoredToken() && getStoredUserId() && !user) dispatch(getCurrentUser());
  }, [dispatch, user]);

  useEffect(() => {
    if (getStoredToken() && user && !user.permissions) dispatch(getCurrentUser());
  }, [dispatch, user]);

  const login = async (credentials) => {
    try {
      dispatch(clearError());
      const result = await dispatch(loginUser(credentials)).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error || 'Login failed' };
    }
  };

  const logoutUser = () => { dispatch(logout()); router.push('/auth/login'); };

  const hasPermission = (requiredRole) => {
    if (!user) return false;
    const roleHierarchy = { 'Super Admin': 4, 'Admin': 3, 'Manager': 2, 'Agent': 1 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout: logoutUser,
    hasPermission,
    clearError: () => dispatch(clearError()),
  };
}; 