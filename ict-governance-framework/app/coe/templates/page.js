'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { CoEPageShell } from '../../components/coe/CoEProgramNav';
import { coeFetch, PhaseBadge, SyncButton } from '../../components/coe/CoEShared';
import { TemplateKindBadge, CreateTemplateModal } from '../../components/coe/TemplateLifecycle';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

const PHASE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unregistered', label: 'Not registered' },
  { id: 'initiation', label: 'Initiation' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'active', label: 'Active' },
  { id: 'build_update', label: 'Build & Update' },
  { id: 'retiring', label: 'Retiring' },
  { id: 'retired', label: 'Retired' }
];

export default function TemplateCoEPage() {
  const { hasPermission } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [dbAvailable, setDbAvailable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);

  const center = { id: 'templates', name: 'Template CoE' };

  const load = async () => {
    setLoading(true);
    try {
      const data = await coeFetch('/api/templates/lifecycle/catalog');
      setCatalog(data.templates || []);
      setDbAvailable(data.dbAvailable);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('governance.read')) load();
  }, [hasPermission]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await coeFetch('/api/templates/lifecycle/sync', { method: 'POST' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async (form) => {
    setBusy(true);
    try {
      await coeFetch('/api/templates/lifecycle/draft', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (templateId) => {
    try {
      await coeFetch(`/api/templates/lifecycle/${templateId}/register`, { method: 'POST', body: '{}' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const filtered = useMemo(() => {
    return catalog.filter((t) => {
      if (phaseFilter !== 'all' && t.lifecyclePhase !== phaseFilter) return false;
      if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
      return true;
    });
  }, [catalog, phaseFilter, kindFilter]);

  const stats = useMemo(() => ({
    total: catalog.length,
    active: catalog.filter((t) => t.lifecyclePhase === 'active').length,
    inProgress: catalog.filter((t) => ['initiation', 'onboarding', 'build_update'].includes(t.lifecyclePhase)).length,
    unregistered: catalog.filter((t) => !t.registered).length
  }), [catalog]);

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read permission required.</div>;
  }

  return (
    <CoEPageShell
      title="Template Lifecycle Management"
      description="Guide each ADPA template through initiation, onboarding, active use, maintenance, and retirement with quality control gates and an immutable audit trail per template."
    >
      <div className="flex flex-wrap justify-end gap-2 mb-6 -mt-2">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          New template
        </button>
        <SyncButton onSync={handleSync} syncing={syncing} />
      </div>

      {dbAvailable === false && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
          CoE database unavailable — lifecycle state stored in{' '}
          <code className="text-xs">adpa/coe/template-registry.json</code>. Run{' '}
          <code className="text-xs">npm run setup:coe-lifecycle</code> for full PostgreSQL audit.
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="ADPA templates" value={stats.total} />
        <KpiCard label="Active" value={stats.active} />
        <KpiCard label="In lifecycle" value={stats.inProgress} />
        <KpiCard label="Not registered" value={stats.unregistered} />
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <FunnelIcon className="h-4 w-4 text-gray-400" />
        {PHASE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setPhaseFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs ${
              phaseFilter === f.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="ml-auto text-xs border rounded px-2 py-1"
        >
          <option value="all">All kinds</option>
          <option value="document">Document</option>
          <option value="governance-artifact">Governance artifact</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading template catalog...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onRegister={handleRegister} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-gray-500 p-8 text-center bg-gray-50 rounded-lg">
              No templates match the current filters.
            </p>
          )}
        </div>
      )}

      <CreateTemplateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        busy={busy}
      />
    </CoEPageShell>
  );
}

function TemplateCard({ template, onRegister }) {
  const href = `/coe/templates/${template.id}`;
  const isUnregistered = !template.registered;

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 hover:border-blue-400 transition-colors">
      <div className="flex justify-between items-start gap-2 mb-2">
        <Link href={href} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 truncate">
          {template.id}
        </Link>
        <PhaseBadge phase={isUnregistered ? 'initiation' : template.lifecyclePhase} />
      </div>

      <div className="flex gap-2 mb-3">
        <TemplateKindBadge kind={template.kind} pillar={template.pillar} />
        {template.status === 'missing' && (
          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">file missing</span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {template.phaseLabel}
        {template.phaseIntent && ` · ${template.phaseIntent}`}
      </p>

      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{template.frameworkSource ? 'Framework linked' : template.outputCategory || '—'}</span>
        {isUnregistered ? (
          <button
            onClick={() => onRegister(template.id)}
            className="text-blue-600 hover:underline font-medium"
          >
            Start lifecycle
          </button>
        ) : (
          <Link href={href} className="text-blue-600 hover:underline font-medium">
            Manage →
          </Link>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
