'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CoEPageShell } from '../../components/coe/CoEProgramNav';
import { coeFetch, CoESection, SyncButton } from '../../components/coe/CoEShared';
import {
  ProviderCard,
  AssignmentTable,
  RegisterProviderModal,
  RoutePreviewPanel
} from '../../components/coe/AiControlPlane';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function AiProvidersCoEPage() {
  const { hasPermission } = useAuth();
  const [overview, setOverview] = useState(null);
  const [providers, setProviders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outputFilter, setOutputFilter] = useState('all');
  const [routePreview, setRoutePreview] = useState(null);
  const [busyAssignment, setBusyAssignment] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ov, prov, assign] = await Promise.all([
        coeFetch('/api/ai/control-plane/overview'),
        coeFetch('/api/ai/control-plane/providers'),
        coeFetch('/api/ai/control-plane/assignments')
      ]);
      setOverview(ov);
      setProviders(prov.providers || []);
      setAssignments(assign.assignments || []);
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
      await coeFetch('/api/ai/control-plane/sync', {
        method: 'POST',
        body: JSON.stringify({ replaceAssignments: false })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRegisterProvider = async (form) => {
    setBusy(true);
    try {
      await coeFetch('/api/ai/control-plane/providers', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setShowRegister(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleAssignment = async (assignment) => {
    try {
      await coeFetch(`/api/ai/control-plane/assignments/${assignment.assignmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !assignment.enabled })
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleResolveRoute = async (assignment) => {
    setBusyAssignment(assignment.assignmentId);
    try {
      const route = await coeFetch('/api/ai/control-plane/resolve-route', {
        method: 'POST',
        body: JSON.stringify({
          templateId: assignment.templateId,
          outputType: assignment.outputType,
          cloudProvider: assignment.cloudProvider
        })
      });
      setRoutePreview(route);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyAssignment(null);
    }
  };

  const filteredAssignments = useMemo(() => {
    if (outputFilter === 'all') return assignments;
    return assignments.filter((a) => a.outputType === outputFilter);
  }, [assignments, outputFilter]);

  const stats = overview?.stats || {};

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read permission required.</div>;
  }

  return (
    <CoEPageShell
      title="AI Provider Control Plane"
      description="Register AI providers and model versions, retrieve deployments, and assign LLM routes from templates to output artifacts — JSON, documents, Bicep, Terraform, UI-as-code, and compliance policies."
    >
      <div className="flex flex-wrap justify-end gap-2 mb-6 -mt-2">
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          Register provider
        </button>
        <SyncButton onSync={handleSync} syncing={syncing} label="Sync from processor config" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Providers', value: stats.providerCount || 0 },
          { label: 'Models', value: stats.modelCount || 0 },
          { label: 'Assignments', value: stats.assignmentCount || 0 },
          { label: 'Templates routed', value: stats.templatesWithAssignment || 0 }
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {overview?.activeProcessor && (
        <p className="text-sm text-gray-600 mb-4">
          Active processor: <span className="font-mono text-blue-600">{overview.activeProcessor}</span>
        </p>
      )}

      <CoESection title="Registered providers">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.providerId} provider={p} />
            ))}
          </div>
        )}
        {!loading && !providers.length && (
          <p className="text-sm text-gray-500">No providers registered. Sync from processor-config or register manually.</p>
        )}
      </CoESection>

      <CoESection title="Template → output assignments">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            className="border rounded-md px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-600"
            value={outputFilter}
            onChange={(e) => setOutputFilter(e.target.value)}
          >
            <option value="all">All output types</option>
            {(overview?.bridge?.outputTypes || []).map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <AssignmentTable
          assignments={filteredAssignments}
          outputTypes={overview?.bridge?.outputTypes}
          onToggle={handleToggleAssignment}
          onResolve={handleResolveRoute}
          busyId={busyAssignment}
        />
      </CoESection>

      <CoESection title="Supported output types">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(overview?.bridge?.outputTypes || []).map((t) => (
            <div key={t.id} className="text-sm border border-gray-100 dark:border-gray-700 rounded-lg p-3">
              <p className="font-medium">{t.label}</p>
              <p className="text-xs text-gray-500 mt-1">{t.id} · {t.artifactLayer}</p>
            </div>
          ))}
        </div>
      </CoESection>

      <RegisterProviderModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSubmit={handleRegisterProvider}
        busy={busy}
        providerTypes={overview?.bridge?.providerTypes}
      />

      <RoutePreviewPanel route={routePreview} onClose={() => setRoutePreview(null)} />
    </CoEPageShell>
  );
}
