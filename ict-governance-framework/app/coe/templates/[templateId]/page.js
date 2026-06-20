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
  TemplatePhasePipeline,
  PhaseGuidePanel,
  QCGatesPanel,
  LifecycleTransitionPanel,
  TemplateAuditTimeline,
  TemplateKindBadge
} from '../../../components/coe/TemplateLifecycle';

export default function TemplateLifecycleDetailPage() {
  const { templateId } = useParams();
  const { hasPermission, user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = await coeFetch(`/api/templates/lifecycle/${templateId}`);
      setDetail(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      setDetail(null);
    }
  };

  useEffect(() => {
    if (hasPermission('governance.read') && templateId) load();
  }, [hasPermission, templateId]);

  const ensureRegistered = async () => {
    setBusy(true);
    try {
      await coeFetch(`/api/templates/lifecycle/${templateId}/register`, { method: 'POST', body: '{}' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const runGate = async (gateId) => {
    setBusy(true);
    try {
      await coeFetch(`/api/templates/lifecycle/${templateId}/qc-gates/${gateId}/run`, { method: 'POST', body: '{}' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const approveGate = async (gateId) => {
    const notes = prompt('Approval notes (optional):') || 'Governor approval recorded';
    setBusy(true);
    try {
      await coeFetch(`/api/templates/lifecycle/${templateId}/qc-gates/${gateId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const transition = async (targetPhase) => {
    const reason = prompt(`Reason for transition to ${targetPhase}:`, 'Lifecycle advancement') || '';
    setBusy(true);
    try {
      await coeFetch(`/api/templates/lifecycle/${templateId}/lifecycle`, {
        method: 'PATCH',
        body: JSON.stringify({ targetPhase, reason })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const assignOwner = async () => {
    setBusy(true);
    try {
      await coeFetch(`/api/templates/lifecycle/${templateId}/owners`, {
        method: 'POST',
        body: JSON.stringify({ ownerEmail: user?.email, ownerRole: 'domain_owner' })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitJustification = async () => {
    setBusy(true);
    try {
      await coeFetch(`/api/templates/lifecycle/${templateId}/justification`, {
        method: 'POST',
        body: JSON.stringify({
          summary: `Business justification for template ${templateId}`,
          valueProposition: 'Standardizes governed output aligned to ICT Governance Framework and seven-pillar model.',
          costOfInaction: 'Inconsistent artifacts, audit gaps, and ungoverned LLM generation.',
          riskAssessment: 'Low when managed through CoE lifecycle and QC gates.'
        })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read permission required.</div>;
  }

  if (!detail && !error) {
    return <div className="p-8 text-gray-500">Loading template lifecycle...</div>;
  }

  if (!detail) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={ensureRegistered} disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
          Register template lifecycle
        </button>
      </div>
    );
  }

  const { item, adpa, center, owners, justification, onboarding, phaseGuidance, bridge, storageMode } = detail;
  const isUnregistered = item.lifecycle_phase === 'initiation' && !detail.auditTrail?.length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <CoEBreadcrumb center={center || { id: 'templates', name: 'Template CoE' }} item={item} />

      <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{item.display_name || templateId}</h1>
          <p className="text-sm font-mono text-gray-500 mt-1">{templateId} — v{item.current_version}</p>
          <div className="flex gap-2 mt-2">
            {adpa && <TemplateKindBadge kind={adpa.kind} pillar={adpa.pillar} />}
            <span className="text-xs text-gray-400">Storage: {storageMode}</span>
          </div>
        </div>
        <PhaseBadge phase={item.lifecycle_phase} />
      </div>

      <TemplatePhasePipeline currentPhase={item.lifecycle_phase} bridgePhases={bridge?.phases} />

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {isUnregistered && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm mb-2">This template is not yet in the governed lifecycle registry.</p>
          <button onClick={ensureRegistered} disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
            Start lifecycle
          </button>
        </div>
      )}

      <PhaseGuidePanel phaseGuidance={phaseGuidance} adpaStage={detail.adpaStage} bridge={bridge} />

      <LifecycleTransitionPanel
        pendingTransitions={detail.pendingTransitions}
        currentPhase={item.lifecycle_phase}
        onTransition={transition}
        busy={busy}
      />

      <QCGatesPanel
        applicableGates={detail.applicableGates}
        qcGates={detail.qcGates}
        onRunGate={runGate}
        onApproveGate={approveGate}
        busy={busy}
      />

      <CoESection title="Ownership">
        {owners?.length === 0 ? (
          <button onClick={assignOwner} disabled={busy} className="text-blue-600 text-sm hover:underline">
            Assign yourself as domain owner
          </button>
        ) : (
          <ul className="space-y-1 text-sm">
            {owners.map((o) => (
              <li key={o.owner_id}>{o.owner_email} — {o.owner_role}</li>
            ))}
          </ul>
        )}
      </CoESection>

      <CoESection title="Business justification">
        {justification ? (
          <dl className="text-sm space-y-2">
            <div><dt className="font-medium">Summary</dt><dd>{justification.summary}</dd></div>
            <div><dt className="font-medium">Value</dt><dd>{justification.value_proposition || justification.valueProposition}</dd></div>
            <div><dt className="font-medium">Cost of inaction</dt><dd>{justification.cost_of_inaction || justification.costOfInaction}</dd></div>
          </dl>
        ) : (
          <button onClick={submitJustification} disabled={busy} className="text-blue-600 text-sm hover:underline">
            Submit business justification
          </button>
        )}
      </CoESection>

      {adpa && (
        <CoESection title="ADPA template metadata">
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">Kind</dt><dd>{adpa.kind}</dd></div>
            <div><dt className="text-gray-500">File</dt><dd className="font-mono text-xs break-all">{adpa.file}</dd></div>
            {adpa.frameworkSource && (
              <div className="sm:col-span-2"><dt className="text-gray-500">Framework source</dt><dd className="font-mono text-xs">{adpa.frameworkSource}</dd></div>
            )}
            {adpa.pillar && <div><dt className="text-gray-500">Pillar</dt><dd>{adpa.pillar}</dd></div>}
            {adpa.artifactType && <div><dt className="text-gray-500">Artifact type</dt><dd>{adpa.artifactType}</dd></div>}
            {adpa.nistCategories && (
              <div className="sm:col-span-2"><dt className="text-gray-500">NIST CSF</dt><dd>{adpa.nistCategories.join(', ')}</dd></div>
            )}
          </dl>
        </CoESection>
      )}

      {(center?.onboardingChecklist?.length > 0) && (
        <CoESection title="Onboarding checklist">
          <ul className="space-y-2 text-sm">
            {center.onboardingChecklist.map((step) => {
              const progress = onboarding?.find((p) => p.checklist_item_id === step.id);
              return (
                <li key={step.id} className={progress?.completed ? 'text-green-700' : 'text-gray-600'}>
                  {progress?.completed ? '✓' : '○'} {step.label}
                </li>
              );
            })}
          </ul>
        </CoESection>
      )}

      <TemplateAuditTimeline auditTrail={detail.auditTrail} />
    </div>
  );
}
