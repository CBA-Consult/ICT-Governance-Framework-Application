'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { PHASES, PhaseBadge, CoESection } from './CoEShared';

export function TemplatePhasePipeline({ currentPhase, bridgePhases }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-1 mb-2">
        {PHASES.map((p, i) => {
          const config = bridgePhases?.[p.id];
          const isCurrent = p.id === currentPhase;
          const phaseIndex = PHASES.findIndex((x) => x.id === currentPhase);
          const thisIndex = PHASES.findIndex((x) => x.id === p.id);
          const isPast = thisIndex < phaseIndex;

          return (
            <div key={p.id} className="flex items-center gap-1">
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                    : isPast
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
                title={config?.summary}
              >
                {p.label}
              </div>
              {i < PHASES.length - 1 && <span className="text-gray-300 text-xs">→</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PhaseGuidePanel({ phaseGuidance, adpaStage, bridge }) {
  if (!phaseGuidance) return null;

  const stageName = bridge?.adpaStages?.find((s) => s.id === adpaStage)?.name || adpaStage;

  return (
    <CoESection title={`Phase guide — ${phaseGuidance.label}`}>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{phaseGuidance.summary}</p>
      {adpaStage && (
        <p className="text-xs text-blue-600 mb-4">
          ADPA ritual stage: <strong>{stageName}</strong>
          {phaseGuidance.intent && <> · Intent: <strong>{phaseGuidance.intent}</strong></>}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold mb-2">Guidance</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {(phaseGuidance.guidance || []).map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2">Required actions</h3>
          <ul className="space-y-2 text-sm">
            {(phaseGuidance.requiredActions || []).map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-gray-400">○</span>
                {a.label}
                {a.auto && <span className="text-xs text-gray-400">(auto)</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CoESection>
  );
}

function GateStatusIcon({ status }) {
  if (status === 'passed') return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
  if (status === 'failed') return <XCircleIcon className="h-5 w-5 text-red-600" />;
  if (status === 'pending') return <ClockIcon className="h-5 w-5 text-yellow-600" />;
  return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
}

export function QCGatesPanel({ applicableGates, qcGates, onRunGate, onApproveGate, busy }) {
  return (
    <CoESection title="Quality control gates">
      <p className="text-sm text-gray-500 mb-4">
        DRACO and AEV gates enforce template quality before lifecycle transitions. Blocking gates must pass to advance.
      </p>
      <div className="space-y-3">
        {(applicableGates || []).map((gate) => {
          const recorded = qcGates?.[gate.id];
          const status = recorded?.status || 'not_run';
          const isManual = gate.runner === 'manual';

          return (
            <div
              key={gate.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/30"
            >
              <div className="flex gap-3 flex-1 min-w-0">
                <GateStatusIcon status={status} />
                <div>
                  <p className="font-medium text-sm">{gate.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{gate.description}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      gate.mode === 'blocking' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {gate.mode}
                    </span>
                    {recorded?.lastRunAt && (
                      <span className="text-xs text-gray-400">
                        Last run {new Date(recorded.lastRunAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {recorded?.result?.summary && (
                    <p className="text-xs mt-2 text-gray-600">{recorded.result.summary}</p>
                  )}
                  {recorded?.result?.errors?.length > 0 && (
                    <ul className="text-xs text-red-600 mt-1 list-disc ml-4">
                      {recorded.result.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                  {recorded?.result?.warnings?.length > 0 && (
                    <ul className="text-xs text-orange-600 mt-1 list-disc ml-4">
                      {recorded.result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!isManual && (
                  <button
                    onClick={() => onRunGate(gate.id)}
                    disabled={busy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <PlayIcon className="h-3.5 w-3.5" />
                    Run gate
                  </button>
                )}
                {isManual && status !== 'passed' && (
                  <button
                    onClick={() => onApproveGate(gate.id)}
                    disabled={busy}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CoESection>
  );
}

export function LifecycleTransitionPanel({ pendingTransitions, currentPhase, onTransition, busy }) {
  const transitions = pendingTransitions?.filter((t) => t.targetPhase) || [];
  if (!transitions.length) {
    return (
      <CoESection title="Lifecycle transitions">
        <p className="text-sm text-gray-500">This template is retired — no further transitions available.</p>
      </CoESection>
    );
  }

  return (
    <CoESection title="Lifecycle transitions">
      <p className="text-sm text-gray-500 mb-4">
        Current phase: <PhaseBadge phase={currentPhase} />. Complete blocking QC gates before advancing.
      </p>
      <div className="space-y-3">
        {transitions.map((t) => (
          <div key={t.targetPhase} className="p-4 border rounded-lg">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-medium text-sm">
                  Advance to {t.targetPhase.replace('_', ' ')}
                </p>
                {t.requiredGates?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {t.requiredGates.map((g) => (
                      <span
                        key={g.gateId}
                        className={`text-xs px-2 py-0.5 rounded ${
                          g.status === 'passed'
                            ? 'bg-green-100 text-green-700'
                            : g.blocking
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {g.gateId}: {g.status}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => onTransition(t.targetPhase)}
                disabled={busy || !t.canTransition}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title={!t.canTransition ? 'Complete required QC gates first' : ''}
              >
                Transition
              </button>
            </div>
          </div>
        ))}
      </div>
    </CoESection>
  );
}

export function TemplateAuditTimeline({ auditTrail }) {
  const events = auditTrail || [];
  return (
    <CoESection title="Immutable audit trail">
      {events.length === 0 ? (
        <p className="text-sm text-gray-500">No audit events yet. Register the template to begin the audit trail.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-2">
          {events.map((a) => (
            <div
              key={a.audit_id || a.auditId}
              className="text-xs font-mono border-l-2 border-blue-300 pl-3 py-1.5"
            >
              <span className="text-gray-500">{new Date(a.recorded_at || a.recordedAt).toISOString()}</span>
              {' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">{a.event_action || a.eventAction}</span>
              {' '}
              <span className="text-gray-500">by {a.actor_email || a.actorEmail}</span>
              {(a.checksum) && (
                <span className="text-gray-400 ml-2">#{String(a.checksum).slice(0, 8)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </CoESection>
  );
}

export function TemplateKindBadge({ kind, pillar }) {
  const colors = {
    document: 'bg-indigo-100 text-indigo-800',
    'governance-artifact': 'bg-emerald-100 text-emerald-800'
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[kind] || 'bg-gray-100 text-gray-600'}`}>
      {kind}{pillar ? ` · ${pillar}` : ''}
    </span>
  );
}

export function CreateTemplateModal({ open, onClose, onCreate, busy }) {
  const [form, setForm] = useState({
    templateId: '',
    displayName: '',
    kind: 'document',
    pillar: '',
    frameworkSource: '',
    description: ''
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-4">Register template lifecycle</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Template ID</label>
            <input
              required
              pattern="[a-z0-9-]+"
              className="w-full mt-1 px-3 py-2 border rounded text-sm"
              placeholder="my-new-template"
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Display name</label>
            <input
              className="w-full mt-1 px-3 py-2 border rounded text-sm"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Kind</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded text-sm"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
            >
              <option value="document">Document template</option>
              <option value="governance-artifact">Governance artifact (JSON)</option>
            </select>
          </div>
          {form.kind === 'governance-artifact' && (
            <div>
              <label className="text-xs font-medium text-gray-600">Pillar</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded text-sm"
                value={form.pillar}
                onChange={(e) => setForm({ ...form, pillar: e.target.value })}
              >
                <option value="">Select pillar</option>
                {['identity', 'devices', 'software', 'network', 'data', 'secops', 'resilience'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600">Description</label>
            <textarea
              className="w-full mt-1 px-3 py-2 border rounded text-sm"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              Start lifecycle
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
