'use client';

import Link from 'next/link';
import {
  DocumentDuplicateIcon,
  CpuChipIcon,
  CircleStackIcon,
  BookOpenIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { authFetch, parseApiError } from '../../lib/authFetch';

const CENTER_ICONS = {
  templates: DocumentDuplicateIcon,
  'ai-providers': CpuChipIcon,
  artifacts: CircleStackIcon,
  documents: BookOpenIcon
};

const PHASES = [
  { id: 'initiation', label: 'Initiation' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'active', label: 'Active' },
  { id: 'build_update', label: 'Build & Update' },
  { id: 'retiring', label: 'Retiring' },
  { id: 'retired', label: 'Retired' }
];

export { CENTER_ICONS, PHASES };

export function authHeaders() {
  try {
    const storedTokens = localStorage.getItem('tokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      if (tokens?.accessToken) {
        return {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        };
      }
    }
  } catch {
    // fall through
  }
  const token = localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
}

export async function coeFetch(url, options = {}) {
  const res = await authFetch(url, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || (await parseApiError(res, 'Request failed')));
  }
  return json.data;
}

export function PhaseBadge({ phase }) {
  const colors = {
    initiation: 'bg-purple-100 text-purple-800',
    onboarding: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    build_update: 'bg-blue-100 text-blue-800',
    retiring: 'bg-orange-100 text-orange-800',
    retired: 'bg-gray-100 text-gray-600'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[phase] || 'bg-gray-100'}`}>
      {phase?.replace('_', ' ')}
    </span>
  );
}

export function CoESection({ title, children }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function CoEBreadcrumb({ center, item }) {
  const centerHref = center?.id === 'templates'
    ? '/coe/templates'
    : center?.id === 'ai-providers'
      ? '/coe/ai-providers'
      : `/coe/${center?.id}`;
  return (
    <nav className="text-sm text-gray-500 mb-4">
      <Link href="/coe/overview" className="hover:text-blue-600">Centers of Excellence</Link>
      {center && (
        <>
          <span className="mx-2">/</span>
          <Link href={centerHref} className="hover:text-blue-600">{center.name}</Link>
        </>
      )}
      {item && (
        <>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white">{item.display_name}</span>
        </>
      )}
    </nav>
  );
}

export function LifecyclePipeline({ currentPhase }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {PHASES.map((p, i) => (
        <div key={p.id} className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            p.id === currentPhase ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-100 text-gray-600'
          }`}>
            {p.label}
          </span>
          {i < PHASES.length - 1 && <span className="text-gray-300">→</span>}
        </div>
      ))}
    </div>
  );
}

export function SyncButton({ onSync, syncing, label = 'Sync from ADPA inventory' }) {
  return (
    <button
      onClick={onSync}
      disabled={syncing}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm disabled:opacity-50"
    >
      <ArrowPathIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : label}
    </button>
  );
}
