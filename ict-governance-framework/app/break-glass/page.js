'use client';

import BreakGlassConsole from '../components/governance/BreakGlassConsole';
import { withAuth } from '../contexts/AuthContext';

function BreakGlassPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <BreakGlassConsole />
      </div>
    </div>
  );
}

export default withAuth(BreakGlassPage, ['user.read', 'role.read'], ['admin', 'super_admin']);
