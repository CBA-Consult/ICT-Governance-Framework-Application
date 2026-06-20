'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const SECTIONS = [
  { id: 'overview', name: 'Overview', href: '/coe/overview', icon: HomeIcon, phases: ['Overview', 'Download'] },
  { id: 'templates', name: 'Templates', href: '/coe/templates', icon: DocumentDuplicateIcon, phases: ['Lifecycle', 'QC gates', 'Audit'] },
  { id: 'ai-providers', name: 'AI Providers', href: '/coe/ai-providers', icon: CpuChipIcon, phases: ['Providers', 'Models', 'Assignments'] },
  { id: 'admin', name: 'Admin', href: '/coe/admin', icon: ChartBarIcon, phases: ['Set up', 'Use', 'Deep dive'] },
  { id: 'govern', name: 'Govern', href: '/coe/govern', icon: ShieldCheckIcon, phases: ['Set up', 'Use', 'Deep dive'] },
  { id: 'nurture', name: 'Nurture', href: '/coe/nurture', icon: UserGroupIcon, phases: ['Set up', 'Use'] }
];

export function CoEProgramNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/coe/overview" className="font-bold text-gray-900 dark:text-white hover:text-blue-600">
            ICT Governance CoE
          </Link>
          <p className="text-xs text-gray-500 mt-1">Center of Excellence</p>
        </div>
        <nav className="p-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = pathname.startsWith(section.href);
            return (
              <div key={section.id} className="mb-1">
                <Link
                  href={section.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {section.name}
                </Link>
                {active && (
                  <div className="ml-8 mt-1 mb-2 space-y-0.5">
                    {section.phases.map((phase) => (
                      <span key={phase} className="block text-xs text-gray-400 px-2 py-0.5">
                        {phase}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function CoEPhaseTabs({ phases, activePhase, onChange, basePath }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
      {phases.map((phase) => (
        <button
          key={phase.id}
          onClick={() => onChange(phase.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activePhase === phase.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {phase.name}
        </button>
      ))}
    </div>
  );
}

export function CoEPageShell({ title, description, children }) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto py-8 px-4">
      <CoEProgramNav />
      <main className="flex-1 min-w-0">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">{description}</p>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}

export { SECTIONS };
