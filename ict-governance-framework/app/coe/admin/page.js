'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { CoEPageShell } from '../../components/coe/CoEProgramNav';
import { coeFetch, SyncButton, CENTER_ICONS } from '../../components/coe/CoEShared';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

const PHASES = [
  { id: 'setup', name: 'Set up' },
  { id: 'use', name: 'Use' },
  { id: 'deep-dive', name: 'Deep dive' }
];

export default function CoEAdminPage() {
  const { hasPermission } = useAuth();
  const [phase, setPhase] = useState('setup');
  const [metrics, setMetrics] = useState(null);
  const [centers, setCenters] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    const [m, c] = await Promise.all([
      coeFetch('/api/coe/metrics'),
      coeFetch('/api/coe/centers')
    ]);
    setMetrics(m);
    setCenters(c);
  };

  useEffect(() => {
    if (hasPermission('governance.read')) load().catch((e) => setError(e.message));
  }, [hasPermission]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await coeFetch('/api/coe/sync', { method: 'POST' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read required.</div>;
  }

  return (
    <CoEPageShell
      title="Admin"
      description="Gain insights into your ICT Governance adoption across templates, AI providers, artifacts, and documents."
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {PHASES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              phase === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {phase === 'setup' && (
        <div className="space-y-6">
          <div className="p-6 border rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <h2 className="font-semibold mb-2">Set up your CoE registry</h2>
            <p className="text-sm text-gray-600 mb-4">
              Apply the database schema once, then sync ADPA inventory into the four lifecycle centers.
            </p>
            <code className="block text-xs bg-white dark:bg-gray-900 p-2 rounded mb-4">
              npm run setup:coe-lifecycle
            </code>
            <SyncButton onSync={handleSync} syncing={syncing} />
          </div>
          <SetupChecklist />
        </div>
      )}

      {phase === 'use' && metrics && (
        <div className="space-y-6">
          <h2 className="font-semibold">Adoption dashboard</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Document templates" value={metrics.inventory.templates.document} />
            <Kpi label="Artifact templates" value={metrics.inventory.templates.governanceArtifact} />
            <Kpi label="CoE registry items" value={metrics.coeRegistry.total} />
            <Kpi label="Published docs" value={metrics.inventory.documents.published} />
          </div>
          {metrics.coeRegistry.byPhase && Object.keys(metrics.coeRegistry.byPhase).length > 0 && (
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium mb-2">Items by lifecycle phase</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.coeRegistry.byPhase).map(([phase, count]) => (
                  <span key={phase} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {phase.replace('_', ' ')}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
          {metrics.coeRegistry.note && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">{metrics.coeRegistry.note}</p>
          )}
        </div>
      )}

      {phase === 'deep-dive' && (
        <div>
          <h2 className="font-semibold mb-4">Lifecycle centers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centers.map((center) => {
              const Icon = CENTER_ICONS[center.id] || DocumentDuplicateIcon;
              return (
                <Link
                  key={center.id}
                  href={`/coe/${center.id}`}
                  className="flex items-start gap-4 p-5 border rounded-xl hover:border-blue-500 transition"
                >
                  <Icon className="h-8 w-8 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-semibold">{center.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{center.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </CoEPageShell>
  );
}

function SetupChecklist() {
  const items = [
    'Run setup:coe-lifecycle against PostgreSQL',
    'Sync ADPA inventory (templates, providers, tenants, documents)',
    'Assign CoE administrators with governance.read',
    'Initiate items in each lifecycle center',
    'Complete Govern onboarding for production items'
  ];
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span className="h-5 w-5 rounded border flex items-center justify-center text-xs text-gray-400">{i + 1}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-2xl font-bold">{value ?? 0}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
