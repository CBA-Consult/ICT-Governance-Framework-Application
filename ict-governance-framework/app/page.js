'use client';

import { useAuth } from './contexts/AuthContext';
import AegisHomeLanding from './components/marketing/AegisHomeLanding';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return <AegisHomeLanding isAuthenticated={isAuthenticated} user={user} />;
}
