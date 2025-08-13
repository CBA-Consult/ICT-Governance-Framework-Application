'use client';

import Link from 'next/link';
import { ShieldCheckIcon, DocumentTextIcon, BeakerIcon } from '@heroicons/react/24/outline';

// Mock data for policies
const policies = [
  {
    id: 1,
    title: 'Acceptable Use Policy',
    category: 'Security',
    description: 'Guidelines for the acceptable use of company technology resources.',
    icon: ShieldCheckIcon,
  },
  {
    id: 2,
    title: 'Data Privacy Policy',
    category: 'Compliance',
    description: 'Rules and procedures for handling sensitive customer and company data.',
    icon: DocumentTextIcon,
  },
  {
    id: 3,
    title: 'Innovation Sandbox Policy',
    category: 'Technology',
    description: 'Framework for experimenting with new technologies and ideas in a controlled environment.',
    icon: BeakerIcon,
  },
  {
    id: 4,
    title: 'Incident Response Plan',
    category: 'Security',
    description: 'Procedures for responding to and managing security incidents.',
    icon: ShieldCheckIcon,
  },
    {
    id: 5,
    title: 'Remote Work Policy',
    category: 'HR',
    description: 'Guidelines and requirements for employees working remotely.',
    icon: DocumentTextIcon,
  },
  {
    id: 6,
    title: 'Technology Selection Policy',
    category: 'Technology',
    description: 'Process for evaluating and selecting new hardware and software.',
    icon: BeakerIcon,
  },
];

// A mapping from category to color for the icons
const categoryColors = {
  Security: 'text-red-500',
  Compliance: 'text-blue-500',
  Technology: 'text-green-500',
  HR: 'text-purple-500',
};

export default function PoliciesPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Company Policies
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Browse and review all official company policies and guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {policies.map((policy) => (
            <Link href={`/policies/${policy.id}`} key={policy.id}>
              <div className="group block p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out">
                <div className="flex items-center mb-4">
                  <policy.icon
                    className={`h-8 w-8 ${categoryColors[policy.category] || 'text-gray-500'}`}
                    aria-hidden="true"
                  />
                  <span className="ml-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {policy.category}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {policy.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {policy.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
