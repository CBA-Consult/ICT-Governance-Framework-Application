'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OverviewCards from './components/OverviewCards';
import FrameworkStatus from './components/FrameworkStatus';
import GovernanceMetrics from './components/GovernanceMetrics';
import RecentActivities from './components/RecentActivities';
import QuickActions from './components/QuickActions';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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