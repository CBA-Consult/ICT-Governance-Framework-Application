'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  coeFetch,
  PhaseBadge,
  CoEBreadcrumb,
  CoESection,
  LifecyclePipeline
} from '../../../../components/coe/CoEShared';

const NEXT_PHASES = {
  initiation: 'onboarding',
  onboarding: 'active',
  active: 'build_update',
  build_update: 'retiring',
  retiring: 'retired'
};

export default function CoEItemDetailPage() {
  const { centerId, itemId } = useParams();
  const { hasPermission, user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setDetail(await coeFetch(`/api/coe/centers/${centerId}/items/${itemId}`));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (hasPermission('governance.read')) load();
  }, [hasPermission, centerId, itemId]);

  const transition = async (targetPhase) => {
    setBusy(true);
    try {
      await coeFetch(`/api/coe/centers/${centerId}/items/${itemId}/lifecycle`, {
        method: 'PATCH',
        body: JSON.stringify({ targetPhase, reason: `Manual transition by ${user?.email}` })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const assignSelfAsOwner = async () => {
    setBusy(true);
    try {
      await coeFetch(`/api/coe/centers/${centerId}/items/${itemId}/owners`, {
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
      await coeFetch(`/api/coe/centers/${centerId}/items/${itemId}/justification`, {
        method: 'POST',
        body: JSON.stringify({
          summary: `Business justification for ${detail.item.display_name}`,
          valueProposition: 'Enables governed ICT delivery aligned to seven-pillar framework.',
          costOfInaction: 'Governance drift, audit findings, and uncontrolled infrastructure changes.',
          riskAssessment: 'Medium — mitigated through CoE lifecycle controls.'
        })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const completeOnboarding = async (checklistItemId) => {
    setBusy(true);
    try {
      await coeFetch(`/api/coe/centers/${centerId}/items/${itemId}/onboarding`, {
        method: 'POST',
        body: JSON.stringify({ checklistItemId, notes: 'Completed via Lifecycle Center' })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const completeTraining = async (moduleId) => {
    setBusy(true);
    try {
      await coeFetch(`/api/coe/centers/${centerId}/items/${itemId}/training`, {
        method: 'POST',
        body: JSON.stringify({ moduleId, score: 100 })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (versionNumber) => {
    if (!confirm(`Rollback to version ${versionNumber}?`)) return;
    setBusy(true);
    try {
      await coeFetch(`/api/coe/centers/${centerId}/items/${itemId}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ targetVersion: versionNumber, reason: 'Operator-initiated rollback' })
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!detail) {
    return <div className="p-8">{error || 'Loading...'}</div>;
  }

  const { item, center, owners, justification, onboarding, training, versions, auditTrail } = detail;
  const nextPhase = NEXT_PHASES[item.lifecycle_phase];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <CoEBreadcrumb center={center} item={item} />

      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{item.display_name}</h1>
          <p className="text-sm font-mono text-gray-500">{item.external_ref} — v{item.current_version}</p>
        </div>
        <PhaseBadge phase={item.lifecycle_phase} />
      </div>

      <LifecyclePipeline currentPhase={item.lifecycle_phase} />

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {nextPhase && (
        <div className="mb-6">
          <button
            disabled={busy}
            onClick={() => transition(nextPhase)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Advance to {nextPhase.replace('_', ' ')}
          </button>
        </div>
      )}

      <CoESection title="Ownership">
        {owners.length === 0 ? (
          <button onClick={assignSelfAsOwner} disabled={busy} className="text-blue-600 text-sm hover:underline">
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
            <div><dt className="font-medium">Value</dt><dd>{justification.value_proposition}</dd></div>
            <div><dt className="font-medium">Cost of inaction</dt><dd>{justification.cost_of_inaction}</dd></div>
          </dl>
        ) : (
          <button onClick={submitJustification} disabled={busy} className="text-blue-600 text-sm hover:underline">
            Submit business justification
          </button>
        )}
      </CoESection>

      <CoESection title="Onboarding checklist">
        <ul className="space-y-2">
          {(center?.onboardingChecklist || []).map((step) => {
            const progress = onboarding.find((p) => p.checklist_item_id === step.id);
            return (
              <li key={step.id} className="flex items-center justify-between text-sm border-b pb-2">
                <span className={progress?.completed ? 'text-green-700' : ''}>
                  {progress?.completed ? '✓' : '○'} {step.label}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {!progress?.completed && (
                  <button
                    onClick={() => completeOnboarding(step.id)}
                    disabled={busy}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    Complete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </CoESection>

      <CoESection title="Learning &amp; development">
        <ul className="space-y-2">
          {(center?.trainingModules || []).map((mod) => {
            const done = training.some((t) => t.module_id === mod.id);
            return (
              <li key={mod.id} className="flex justify-between text-sm">
                <span>{mod.title} ({mod.durationMinutes} min)</span>
                {done ? (
                  <span className="text-green-600 text-xs">Completed</span>
                ) : (
                  <button onClick={() => completeTraining(mod.id)} disabled={busy} className="text-blue-600 text-xs hover:underline">
                    Mark complete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </CoESection>

      <CoESection title="Version history &amp; rollback">
        {versions.length === 0 ? (
          <p className="text-sm text-gray-500">No versions recorded yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-2">Version</th>
                <th className="pb-2">Summary</th>
                <th className="pb-2">Date</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.version_number} className="border-t">
                  <td className="py-2 font-mono">v{v.version_number}</td>
                  <td className="py-2">{v.change_summary}</td>
                  <td className="py-2 text-gray-500">{new Date(v.created_at).toLocaleString()}</td>
                  <td className="py-2">
                    {v.version_number < item.current_version && (
                      <button onClick={() => rollback(v.version_number)} className="text-orange-600 text-xs hover:underline">
                        Rollback
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CoESection>

      <CoESection title="Immutable audit trail">
        {auditTrail.length === 0 ? (
          <p className="text-sm text-gray-500">No audit events yet.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {auditTrail.map((a) => (
              <div key={a.audit_id} className="text-xs font-mono border-l-2 border-gray-300 pl-3 py-1">
                <span className="text-gray-500">{new Date(a.recorded_at).toISOString()}</span>
                {' '}
                <span className="font-semibold">{a.event_action}</span>
                {' '}
                by {a.actor_email}
                {a.checksum && <span className="text-gray-400 ml-2">#{a.checksum.slice(0, 8)}</span>}
              </div>
            ))}
          </div>
        )}
      </CoESection>
    </div>
  );
}
