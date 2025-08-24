'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import OverviewCards from './components/OverviewCards';
import FrameworkStatus from './components/FrameworkStatus';
import GovernanceMetrics from './components/GovernanceMetrics';
import RecentActivities from './components/RecentActivities';
import QuickActions from './components/QuickActions';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [governanceMetrics, setGovernanceMetrics] = useState({
    complianceScore: 87,
    riskLevel: 'Medium',
    activeProjects: 12,
    policyCompliance: 94,
    securityScore: 91,
    costOptimization: 78
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'Policy Update', description: 'Technology Selection Policy updated', timestamp: '2 hours ago', status: 'completed' },
    { id: 2, type: 'Compliance Check', description: 'Azure resources compliance scan', timestamp: '4 hours ago', status: 'in-progress' },
    { id: 3, type: 'Risk Assessment', description: 'Multi-cloud security assessment', timestamp: '1 day ago', status: 'completed' },
    { id: 4, type: 'Blueprint Deployment', description: 'Infrastructure blueprint deployed', timestamp: '2 days ago', status: 'completed' }
  ]);

  const [frameworkStatus, setFrameworkStatus] = useState({
    task1: { name: 'Analyze Existing Framework', progress: 95, status: 'completed' },
    task2: { name: 'Develop Target Framework', progress: 90, status: 'completed' },
    task3: { name: 'Create Blueprint Templates', progress: 85, status: 'in-progress' },
    task4: { name: 'Implement Framework', progress: 70, status: 'in-progress' },
    task5: { name: 'Evaluate Effectiveness', progress: 60, status: 'in-progress' }
  });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Welcome Message */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.firstName || user?.username}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.jobTitle && user?.department 
                  ? `${user.jobTitle} - ${user.department}`
                  : user?.jobTitle || user?.department || 'ICT Governance Framework Dashboard'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'First time'}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Roles: {user?.roles?.join(', ') || 'None'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OverviewCards governanceMetrics={governanceMetrics} />
        <FrameworkStatus frameworkStatus={frameworkStatus} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <GovernanceMetrics governanceMetrics={governanceMetrics} />
          <RecentActivities recentActivities={recentActivities} />
        </div>
        <QuickActions />
      </main>
    </div>
  );
}