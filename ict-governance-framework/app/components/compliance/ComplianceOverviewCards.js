'use client';

import { useCountUp } from '../../hooks/useCountUp';
import { ArrowTrendingUpIcon, ShieldCheckIcon, ExclamationTriangleIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

const MetricCard = ({ title, value, icon: Icon, unit = '' }) => {
  const animatedValue = useCountUp(value, 2);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transform hover:-translate-y-1 transition-all duration-300 ease-in-out hover:shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-blue-500" aria-hidden="true" />
        </div>
        <div className="text-right">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </dt>
          <dd className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {animatedValue}{unit}
          </dd>
        </div>
      </div>
    </div>
  );
};


export default function ComplianceOverviewCards({ overviewData }) {
  const cards = [
    {
      title: 'Overall Compliance',
      value: overviewData.overallComplianceScore,
      icon: ArrowTrendingUpIcon,
      unit: '%'
    },
    {
      title: 'Compliant Apps',
      value: overviewData.compliantApplications,
      icon: ShieldCheckIcon,
      unit: ''
    },
    {
      title: 'High Risk Apps',
      value: overviewData.riskDistribution.high,
      icon: ExclamationTriangleIcon,
      unit: ''
    },
    {
      title: 'Cloud App Security',
      value: overviewData.cloudAppSecurityScore,
      icon: BuildingLibraryIcon,
      unit: '%'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  );
}
