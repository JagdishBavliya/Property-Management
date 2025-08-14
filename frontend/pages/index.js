import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    } else if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [user, isAuthenticated, router]);

  return null;
} 