import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://property.pagemasterpro.site/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 seconds timeout
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }    
    if (error.response?.status === 403) console.error('Access forbidden:', error.response.data);
    if (error.response?.status >= 500) console.error('Server error:', error.response.data);
    
    return Promise.reject(error);
  }
);

export default axiosInstance;