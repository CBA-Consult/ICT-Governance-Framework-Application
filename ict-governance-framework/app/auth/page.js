'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const redirectTarget = (() => {
    const redirect = searchParams.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return '/dashboard';
  })();

  // Get mode from URL params (login or register)
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(redirectTarget);
    }
  }, [isAuthenticated, isLoading, router, redirectTarget]);

  // Update URL when mode changes
  useEffect(() => {
    const redirectQuery = redirectTarget !== '/dashboard'
      ? `&redirect=${encodeURIComponent(redirectTarget)}`
      : '';
    const newUrl = mode === 'register'
      ? `/auth?mode=register${redirectQuery}`
      : `/auth${redirectQuery ? `?${redirectQuery.slice(1)}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [mode, redirectTarget]);

  const handleLoginSuccess = () => {
    router.push(redirectTarget);
  };

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {mode === 'login' ? (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      ) : (
        <RegisterForm
          onSuccess={handleLoginSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </div>
  );
}