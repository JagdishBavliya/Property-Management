import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

// Components
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { LOGO_IMAGE } from '../../utils/constants';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const router = useRouter();
  const { login, isAuthenticated, user, loading } = useAuth();
  const [formData, setFormData] = useState({email: '',password: ''});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated && user && !loading) router.push('/dashboard');
  }, [isAuthenticated, user, loading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const result = await login(formData);
      if (result.success) {
        toast.success('🔓 Logged in successfully!');
      } else {
        toast.error('🔐 Login failed!');
        setErrors({ general: result.error || 'Invalid credentials. Please try again.' });
      }
    } catch (error) {
      if (error.includes('❌ Invalid email or password')) {
        setErrors({ 
          email: '❌ Invalid email or password',
          password: '❌ Invalid email or password'
        });
        toast.error('❌ Invalid email or password');
      } else {
        setErrors({ general: error || '❌ Invalid credentials. Please try again.' });
        toast.error(error || '❌ Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isAuthenticated && user && !loading) return null;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary-200/30 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-large p-8 space-y-8 border border-white/20">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br to-primary-600 rounded-2xl flex items-center justify-center">
            <img src={LOGO_IMAGE} alt="Property Management System" width={60} height={60}/>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Sign in to your Property Management System account
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          {errors.general && (
            <div className="bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-soft">
              <svg className="h-5 w-5 text-danger-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              {errors.general}
            </div>
          )}

          <div className="space-y-5">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              required
              autoComplete="username"
              placeholder="Enter your email"
            />
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                }
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 