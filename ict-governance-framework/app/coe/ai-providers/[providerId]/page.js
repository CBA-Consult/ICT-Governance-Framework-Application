'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import {
  coeFetch,
  PhaseBadge,
  CoEBreadcrumb,
  CoESection
} from '../../../components/coe/CoEShared';
import {
  ProviderTypeBadge,
  ModelVersionTimeline,
  RegisterModelModal,
  AssignmentTable,
  RoutePreviewPanel
} from '../../../components/coe/AiControlPlane';

export default function AiProviderDetailPage() {
  const { providerId } = useParams();
  const { hasPermission } = useAuth();
  const [detail, setDetail] = useState(null);
  const [bridge, setBridge] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [routePreview, setRoutePreview] = useState(null);
  const [busyAssignment, setBusyAssignment] = useState(null);

  const center = { id: 'ai-providers', name: 'AI Provider CoE' };

  const load = async () => {
    try {
      const [data, bridgeData] = await Promise.all([
        coeFetch(`/api/ai/control-plane/providers/${providerId}`),
        coeFetch('/api/ai/control-plane/bridge')
      ]);
      setDetail(data);
      setBridge(bridgeData);
      setError(null);
    } catch (e) {
      setError(e.message);
      setDetail(null);
    }
  };

  useEffect(() => {
    if (hasPermission('governance.read') && providerId) load();
  }, [hasPermission, providerId]);

  const handleRegisterModel = async (form) => {
    setBusy(true);
    try {
      await coeFetch(`/api/ai/control-plane/providers/${providerId}/models`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setShowModelModal(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePhaseChange = async (lifecyclePhase) => {
    setBusy(true);
    try {
      await coeFetch('/api/ai/control-plane/providers', {
        method: 'POST',
        body: JSON.stringify({
          providerId,
          allowUpdate: true,
          lifecyclePhase,
          displayName: detail.provider.displayName,
          type: detail.provider.type
        })
      });
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

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read permission required.</div>;
  }

  if (!detail) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        {error ? <p className="text-red-600">{error}</p> : <p className="text-gray-500">Loading...</p>}
      </div>
    );
  }

  const { provider, assignments } = detail;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <CoEBreadcrumb
        center={center}
        item={{ display_name: provider.displayName }}
      />

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{provider.displayName}</h1>
          <ProviderTypeBadge type={provider.type} />
          <PhaseBadge phase={provider.lifecyclePhase} />
          {provider.isActiveProcessor && (
            <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">Active processor</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2 font-mono">{provider.providerId}</p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <CoESection title="Provider details">
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Endpoint</dt>
            <dd>{provider.endpoint || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">API version</dt>
            <dd>{provider.apiVersion || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Entra ID</dt>
            <dd>{provider.useEntraId ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Processor ref</dt>
            <dd className="font-mono">{provider.processorRef || '—'}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 mr-2">Lifecycle:</span>
          {(bridge?.lifecyclePhases || []).map((p) => (
            <button
              key={p.id}
              disabled={busy || provider.lifecyclePhase === p.id}
              onClick={() => handlePhaseChange(p.id)}
              className={`px-3 py-1 rounded-full text-xs ${
                provider.lifecyclePhase === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CoESection>

      <CoESection title="Models & versions">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowModelModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Register model version
          </button>
        </div>
        <ModelVersionTimeline models={provider.models} />
      </CoESection>

      <CoESection title="Assignments using this provider">
        <AssignmentTable
          assignments={assignments}
          outputTypes={bridge?.outputTypes}
          onToggle={handleToggleAssignment}
          onResolve={handleResolveRoute}
          busyId={busyAssignment}
        />
      </CoESection>

      <RegisterModelModal
        open={showModelModal}
        onClose={() => setShowModelModal(false)}
        onSubmit={handleRegisterModel}
        busy={busy}
      />

      <RoutePreviewPanel route={routePreview} onClose={() => setRoutePreview(null)} />
    </div>
  );
}
