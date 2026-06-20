'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authFetch, parseApiError } from '../../lib/authFetch';
import ResponsibilityBoundaryPanel from './ResponsibilityBoundaryPanel';
import GovernanceStateBadge from '../governance/GovernanceStateBadge';
import {
  resolveEscalationEvidenceState,
  resolveGovernanceState
} from '../../../lib/governanceState';

const DEFAULT_TENANT = 'tenant-contoso-health';

function statusClass(status) {
  switch (status) {
    case 'Open': return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'Acknowledged': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Mitigating': return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'Resolved': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Closed': return 'bg-slate-50 text-slate-700 border-slate-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function priorityClass(priority) {
  switch (priority) {
    case 'Critical': return 'text-rose-700 font-bold';
    case 'High': return 'text-orange-600 font-semibold';
    case 'Medium': return 'text-amber-600';
    default: return 'text-slate-600';
  }
}

export default function ComplianceEscalationsConsole() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT);
  const [escalations, setEscalations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [checkForm, setCheckForm] = useState({
    checkValidationInPlace: true,
    checkValidationDescription: '',
    linkedRuleIds: [],
    preventsDownstreamEscalation: true,
    evidenceRef: '',
    reviewExpiry: ''
  });

  const [downstreamForm, setDownstreamForm] = useState({
    description: '',
    linkedRuleIds: [],
    impactAssessment: '',
    mitigationDeadline: '',
    liabilityScope: 'client-premises-downstream'
  });

  const [routingForm, setRoutingForm] = useState({
    internalMitigationSufficient: true,
    routingDecision: 'remains-with-vendor',
    vendorId: '',
    vendorName: '',
    linkedRuleIds: [],
    rationale: ''
  });

  const [resolveNotes, setResolveNotes] = useState('');
  const [remediationRun, setRemediationRun] = useState(null);
  const [remediationLoading, setRemediationLoading] = useState(false);

  const loadEscalations = useCallback(async () => {
    const res = await authFetch(
      `/api/traceability/tenants/${encodeURIComponent(tenantId)}/compliance-escalations`
    );
    if (!res.ok) {
      throw new Error(await parseApiError(res, 'Failed to load compliance escalations'));
    }
    const payload = await res.json();
    return payload.data?.escalations || [];
  }, [tenantId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      window.location.href = '/auth?redirect=/compliance-escalations';
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await loadEscalations();
        setEscalations(list);
        setSelected((prev) => prev && list.find((e) => e.escalationId === prev.escalationId) ? prev : (list[0] || null));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, isAuthenticated, loadEscalations]);

  useEffect(() => {
    if (!selected) return;
    const ruleIds = (selected.mitigationPlan?.clientActions || []).map((a) => a.linkedRuleId).filter(Boolean);
    setCheckForm((f) => ({
      ...f,
      linkedRuleIds: ruleIds.length ? [ruleIds[0]] : [],
      checkValidationDescription: '',
      evidenceRef: '',
      reviewExpiry: ''
    }));
    setDownstreamForm((f) => ({
      ...f,
      linkedRuleIds: ruleIds.length ? [ruleIds[0]] : [],
      description: '',
      impactAssessment: '',
      mitigationDeadline: ''
    }));
    setRoutingForm((f) => ({
      ...f,
      linkedRuleIds: ruleIds.length ? [ruleIds[0]] : [],
      vendorId: selected.complianceNotification?.assetId ? 'vendor-from-asset' : '',
      vendorName: '',
      rationale: ''
    }));
    setResolveNotes('');
    setActionError(null);
    setRemediationRun(null);
  }, [selected]);

  const refresh = async (escalationId) => {
    const list = await loadEscalations();
    setEscalations(list);
    const match = escalationId ? list.find((e) => e.escalationId === escalationId) : null;
    setSelected(match || list[0] || null);
  };

  const postAction = async (path, body) => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await authFetch(path, { method: 'POST', body: JSON.stringify(body || {}) });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Action failed'));
      }
      const payload = await res.json();
      await refresh(payload.data?.escalationId);
      return payload.data;
    } catch (err) {
      setActionError(err.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const executeRemediationPlan = async () => {
    if (!selected?.requirementId) return;
    setRemediationLoading(true);
    setActionError(null);
    setRemediationRun(null);
    try {
      const res = await authFetch('/api/remediation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          requirementId: selected.requirementId,
          planId: 'mfa-redeploy-plan',
          escalationId: selected.escalationId
        })
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Remediation execution failed'));
      }
      const payload = await res.json();
      setRemediationRun(payload.data);
      if (!payload.success) {
        setActionError(`Remediation failed at step: ${payload.data?.failedStep || 'unknown'}`);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setRemediationLoading(false);
    }
  };

  const remediationStepLabel = (stepId) => {
    switch (stepId) {
      case 'reapply-ca-policy': return 'Redeploy CA policy';
      case 'invalidate-sessions': return 'Invalidate sessions';
      case 'revalidate': return 'Re-validation';
      default: return stepId;
    }
  };

  const closeRemediationRunRecord = async () => {
    if (!remediationRun?.remediationRunId) return;
    setRemediationLoading(true);
    setActionError(null);
    try {
      const res = await authFetch(`/api/remediation/runs/${encodeURIComponent(remediationRun.remediationRunId)}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          reason: 'escalation-resolved'
        })
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Failed to close remediation run'));
      }
      const payload = await res.json();
      setRemediationRun((prev) => ({ ...prev, ...payload.data }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setRemediationLoading(false);
    }
  };

  const filtered = escalations.filter((e) => {
    if (filter === 'all') return true;
    return e.status?.toLowerCase() === filter.toLowerCase();
  });

  const openCount = escalations.filter((e) => e.status === 'Open').length;
  const mitigatingCount = escalations.filter((e) => e.status === 'Mitigating').length;
  const downstreamCount = escalations.filter((e) => e.downstreamLiabilityEscalation?.status === 'escalated').length;
  const slaBreachCount = escalations.filter((e) => e.slaStatus?.slaBreached).length;
  const discountEligibleCount = escalations.filter((e) => e.internalControlDiscount?.effectiveDiscountPercent > 0).length;

  if (authLoading || loading) {
    return (
      <div className="p-8 text-slate-600 dark:text-slate-300">
        Loading client compliance escalations…
      </div>
    );
  }

  if (error) {
    const apiHint = /API route not found|npm run server|dev:full/i.test(error)
      ? 'Run npm run dev:full (both servers) or npm run server in a separate terminal on port 4000, then refresh.'
      : 'Ensure the API server is running (npm run server on port 4000) and you have governance.read permission.';
    return (
      <div className="p-8 max-w-3xl">
        <p className="text-rose-600 font-semibold">{error}</p>
        <p className="text-sm text-slate-500 mt-2">{apiHint}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <header className="border-b border-slate-200 dark:border-slate-700 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              Client compliance partnership
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Compliance Escalations
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
              Rule-level failure detail — not vendor scorecards alone. Non-compliance does not trigger immediate vendor block.
              Assess internal controls first, then route liability: remains with the vendor or escalates into governance products and services.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 max-w-3xl">
              Unlike CASB Score-10 checklists (MFA ✓, ISO 27001 ✓), every escalation names the failed monitoring rule,
              framework control, expected vs observed state, and mitigation actions.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tenant</label>
            <select
              value={tenantId}
              onChange={(e) => { setTenantId(e.target.value); setSelected(null); }}
              className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="tenant-contoso-health">Contoso Health</option>
              <option value="tenant-01">tenant-01</option>
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{escalations.length}</p>
        </div>
        <div className="rounded-lg border border-rose-200 dark:border-rose-900 p-4 bg-rose-50/50 dark:bg-rose-950/20">
          <p className="text-xs text-rose-600 uppercase">Open</p>
          <p className="text-2xl font-bold text-rose-700">{openCount}</p>
        </div>
        <div className="rounded-lg border border-blue-200 dark:border-blue-900 p-4 bg-blue-50/50 dark:bg-blue-950/20">
          <p className="text-xs text-blue-600 uppercase">Mitigating</p>
          <p className="text-2xl font-bold text-blue-700">{mitigatingCount}</p>
        </div>
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 p-4 bg-amber-50/50 dark:bg-amber-950/20">
          <p className="text-xs text-amber-700 uppercase">Downstream escalated</p>
          <p className="text-2xl font-bold text-amber-800">{downstreamCount}</p>
        </div>
        <div className="rounded-lg border border-orange-200 dark:border-orange-900 p-4 bg-orange-50/50 dark:bg-orange-950/20">
          <p className="text-xs text-orange-700 uppercase">SLA breaches</p>
          <p className="text-2xl font-bold text-orange-800">{slaBreachCount}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 p-4 bg-emerald-50/50 dark:bg-emerald-950/20">
          <p className="text-xs text-emerald-700 uppercase">Discount active</p>
          <p className="text-2xl font-bold text-emerald-800">{discountEligibleCount}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <aside className="lg:col-span-2 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {['all', 'open', 'mitigating', 'resolved'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  filter === f
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-300 dark:border-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-sm text-slate-500">
              No compliance escalations for this tenant. Failures from validation loop-back will appear here with explicit control detail.
            </div>
          ) : (
            <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
              {filtered.map((esc) => (
                <li key={esc.escalationId}>
                  <button
                    type="button"
                    onClick={() => setSelected(esc)}
                    className={`w-full text-left rounded-lg border p-4 transition ${
                      selected?.escalationId === esc.escalationId
                        ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusClass(esc.status)}`}>{esc.status}</span>
                      <span className={`text-xs ${priorityClass(esc.priority)}`}>{esc.priority}</span>
                    </div>
                    <p className="font-semibold text-sm mt-2 text-slate-900 dark:text-white truncate">
                      {esc.requirementId || esc.escalationId}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {(esc.frameworkImpacts || []).map((i) => `${i.certificationId} ${i.controlId}`).join(' · ')}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(esc.issuedAt).toLocaleString()}</p>
                    {esc.slaStatus?.slaBreached && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">SLA breach</p>
                    )}
                    {esc.internalControlDiscount?.effectiveDiscountPercent > 0 && (
                      <p className="text-xs text-emerald-600 mt-1">{esc.internalControlDiscount.effectiveDiscountPercent}% TCO discount</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="lg:col-span-3 space-y-4">
          {!selected ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500">
              Select an escalation to review control failures and client actions.
            </div>
          ) : (
            <>
              {actionError && (
                <div className="rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3">{actionError}</div>
              )}

              <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <div className="flex flex-wrap justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selected.requirementId}</h2>
                    <p className="text-sm text-slate-500">{selected.escalationId}</p>
                    {(selected.evidenceChains?.length > 0 || selected.evidenceAlert) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Evidence</span>
                        <GovernanceStateBadge
                          state={resolveEscalationEvidenceState(selected)}
                          confidence={
                            (selected.evidenceChains || []).find(
                              (c) => c.resolution === resolveEscalationEvidenceState(selected)
                            )?.confidence || selected.evidenceChains?.[0]?.confidence
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selected.status === 'Open' && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => postAction(
                          `/api/traceability/tenants/${tenantId}/compliance-escalations/${selected.escalationId}/acknowledge`,
                          { notes: 'Acknowledged — reviewing mitigation options.' }
                        )}
                        className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border-l-4 border-indigo-500 pl-3">
                  {selected.summary}
                </p>
              </section>

              {selected.serviceResponsibilityBoundary && (
                <ResponsibilityBoundaryPanel
                  boundary={selected.serviceResponsibilityBoundary}
                  frameworkImpacts={selected.frameworkImpacts}
                />
              )}

              {selected.remediationTrigger && (
                <section className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 p-5">
                  <h3 className="font-semibold text-rose-900 dark:text-rose-200 mb-1">Evidence remediation pipeline</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{selected.remediationTrigger.summary}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <GovernanceStateBadge state={selected.remediationTrigger.status || 'pending'} />
                    <span className="text-xs text-slate-500 capitalize">{selected.remediationTrigger.priority} priority</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {(selected.remediationTrigger.actionPipeline || []).map((action) => (
                      <li key={action.actionId} className="text-xs rounded-md border border-rose-200 dark:border-rose-800 bg-white/60 dark:bg-slate-900/40 p-2">
                        <span className="font-medium">{action.label || action.actionId}</span>
                        <span className="text-slate-500 ml-2 capitalize">({action.phase} · {action.status?.replace(/-/g, ' ')})</span>
                      </li>
                    ))}
                  </ul>
                  {selected.remediationTrigger.requiresApproval && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-3">Destructive restore actions require approval before execution.</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Manual remediation orchestration</p>
                    <button
                      type="button"
                      onClick={executeRemediationPlan}
                      disabled={remediationLoading || submitting}
                      className="rounded-md bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2"
                    >
                      {remediationLoading ? 'Executing remediation plan…' : 'Execute Remediation Plan'}
                    </button>
                    {remediationRun && (
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500 uppercase tracking-wide">Run status</span>
                          <GovernanceStateBadge state={remediationRun.status} size="md" />
                        </div>
                        {(remediationRun.results || []).map((step, idx) => (
                          <p key={step.stepId || idx} className="text-sm text-slate-700 dark:text-slate-300">
                            Step {idx + 1}: {remediationStepLabel(step.stepId)}
                            {' '}{step.success ? '✅' : '❌'}
                          </p>
                        ))}
                        {(remediationRun.status === 'verified' || remediationRun.status === 'completed') && remediationRun.finalValidation?.evidenceChain && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Post-remediation evidence</span>
                            <GovernanceStateBadge
                              state={resolveGovernanceState(remediationRun.finalValidation.evidenceChain)}
                              confidence={remediationRun.finalValidation.evidenceChain.confidence}
                            />
                          </div>
                        )}
                        {remediationRun.status === 'failed' && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <GovernanceStateBadge state="failed" />
                            <span className="text-sm text-rose-700 dark:text-rose-400">Failed at {remediationRun.failedStep}</span>
                          </div>
                        )}
                        {(remediationRun.statusHistory || []).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-rose-100 dark:border-rose-900">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Lifecycle history</p>
                            <ul className="space-y-2">
                              {remediationRun.statusHistory.map((entry, idx) => (
                                <li key={`${entry.status}-${entry.at}-${idx}`} className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                  <GovernanceStateBadge state={entry.status} />
                                  <span className="text-slate-400">{entry.by}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {remediationRun.status === 'verified' && (
                          <button
                            type="button"
                            onClick={closeRemediationRunRecord}
                            disabled={remediationLoading || submitting}
                            className="mt-2 rounded-md border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-50 text-sm font-medium px-3 py-1.5"
                          >
                            Close remediation run
                          </button>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Run ID: {remediationRun.remediationRunId}
                          {remediationRun.lineageId ? ` · Lineage: ${remediationRun.lineageId}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {selected.evidenceAlert && !selected.remediationTrigger && (
                <section className="rounded-lg border border-amber-300 bg-amber-50/40 p-4 text-xs text-amber-800">
                  Evidence alert detected — remediation blocked by safeguards ({selected.evidenceConflictClass}).
                </section>
              )}

              {selected.timeboundOnboarding?.enabled && (
                <section className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Timebound onboarding</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {selected.timeboundOnboarding.windowDays}-day window from {selected.timeboundOnboarding.windowStartsAt?.replace(/-/g, ' ')}
                  </p>
                  <div className="rounded-md p-4 border border-amber-200 bg-white/60 dark:bg-slate-900/60">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {selected.timeboundOnboarding.summary
                        || `Accounts in user-account-created state are not active, excluded from FAIR/ALE risk, and ${selected.timeboundOnboarding.accessDuringWindow?.replace(/-/g, ' ') || 'blocked until MFA registered'}.`}
                    </p>
                    <ul className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <li>Access during window: {selected.timeboundOnboarding.accessDuringWindow?.replace(/-/g, ' ')}</li>
                      <li>Risk treatment: {selected.timeboundOnboarding.riskTreatment?.replace(/-/g, ' ')}</li>
                      {(selected.timeboundOnboarding.accountStatesInWindow || []).length > 0 && (
                        <li>States in window: {(selected.timeboundOnboarding.accountStatesInWindow || []).join(', ').replace(/-/g, ' ')}</li>
                      )}
                      {selected.frameworkExposure?.timeboundOnboarding?.windowStatus && (
                        <li>Window status: {selected.frameworkExposure.timeboundOnboarding.windowStatus.replace(/-/g, ' ')}</li>
                      )}
                    </ul>
                  </div>
                </section>
              )}

              {selected.frameworkExposure && (
                <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Framework dollar exposure (FAIR/ALE)</h3>
                  <p className="text-xs text-slate-500 mb-3">{selected.frameworkExposure.reportingBoundary?.replace(/-/g, ' ')}</p>
                  <div className={`rounded-md p-4 border ${
                    selected.frameworkExposure.exposureStatus === 'contained-at-access-gate'
                      ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-slate-200 bg-slate-50 dark:bg-slate-800'
                  }`}>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {selected.frameworkExposure.exposureUsd != null
                        ? `$${Number(selected.frameworkExposure.exposureUsd).toLocaleString()}`
                        : '— null'}
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        ({selected.frameworkExposure.exposureStatus?.replace(/-/g, ' ')})
                      </span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{selected.frameworkExposure.rationale}</p>
                    {selected.frameworkExposure.exposureStatus === 'contained-at-access-gate' && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                        Access not granted without MFA registration — exposure intentionally null while login gate holds.
                      </p>
                    )}
                    {selected.frameworkExposure.exposureStatus === 'excluded-onboarding-accounts' && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                        User-account-created states excluded — only active-eligible users count toward MFA risk.
                      </p>
                    )}
                    {(selected.frameworkExposure.excludedAccountStates || []).length > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        Excluded from risk: {selected.frameworkExposure.excludedAccountStates.join(', ').replace(/-/g, ' ')}
                        {selected.frameworkExposure.onboardingGracePeriodDays != null && (
                          <> · timebound onboarding ({selected.frameworkExposure.onboardingGracePeriodDays} days)</>
                        )}
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Framework control impacts</h3>
                <ul className="space-y-3">
                  {(selected.frameworkImpacts || []).map((impact) => (
                    <li key={`${impact.certificationId}-${impact.controlId}`} className="rounded-md bg-slate-50 dark:bg-slate-800 p-3 text-sm">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {impact.certificationLabel} — control {impact.controlId}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">{impact.controlName}</p>
                      <p className="text-xs text-rose-600 mt-1">{impact.complianceStatus}</p>
                      {(impact.triggeredBy || []).map((t, idx) => (
                        <p key={idx} className="text-xs text-slate-500 mt-1 font-mono">
                          rule {t.ruleId}: expected &quot;{t.expected}&quot; → observed &quot;{t.observed}&quot;
                          {t.responsibility && (
                            <span className="ml-2 text-violet-600">
                              ({t.responsibility.accountableParty === 'governance-service' ? 'service ensures' : 'client responsible'})
                            </span>
                          )}
                        </p>
                      ))}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Mitigation actions (execute internally)</h3>
                <ul className="space-y-3">
                  {(selected.mitigationPlan?.clientActions || []).map((action) => (
                    <li key={action.actionId} className="border border-slate-200 dark:border-slate-600 rounded-md p-3">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{action.title}</p>
                        <span className={`text-xs ${priorityClass(action.priority)}`}>{action.priority}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{action.description}</p>
                      <p className="text-xs text-slate-400 mt-2">Rule: {action.linkedRuleId} · Control: {action.linkedFrameworkControlId || action.linkedControlId}</p>
                    </li>
                  ))}
                </ul>
                {selected.mitigationPlan?.remediationTemplateId && (
                  <p className="text-xs text-slate-500 mt-3">Template: {selected.mitigationPlan.remediationTemplateId}</p>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">SLA &amp; internal control discount</h3>
                {selected.slaStatus && (
                  <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm">
                    <div className={`rounded-md p-3 border ${selected.slaStatus.acknowledgeBreached ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50 dark:bg-slate-800'}`}>
                      <p className="font-medium">Acknowledge</p>
                      <p className="text-xs text-slate-500">Target: {selected.slaStatus.targets.labels?.acknowledgeMs || '48 hours'}</p>
                      <p className="text-xs mt-1">{selected.slaStatus.acknowledgeBreached ? 'Breached' : 'Within SLA'}</p>
                    </div>
                    <div className={`rounded-md p-3 border ${selected.slaStatus.checkValidationBreached ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50 dark:bg-slate-800'}`}>
                      <p className="font-medium">Check validation</p>
                      <p className="text-xs text-slate-500">Target: {selected.slaStatus.targets.labels?.checkValidationMs || '5 days'}</p>
                      <p className="text-xs mt-1">{selected.slaStatus.checkValidationBreached ? 'Breached' : 'Within SLA'}</p>
                    </div>
                    <div className={`rounded-md p-3 border ${selected.slaStatus.resolutionBreached ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50 dark:bg-slate-800'}`}>
                      <p className="font-medium">Resolution</p>
                      <p className="text-xs text-slate-500">Target: {selected.slaStatus.targets.labels?.resolutionMs || '14 days'}</p>
                      <p className="text-xs mt-1">{selected.slaStatus.resolutionBreached ? 'Breached' : 'Within SLA'}</p>
                    </div>
                    <div className="rounded-md p-3 border border-slate-200 bg-slate-50 dark:bg-slate-800">
                      <p className="font-medium">Escalation triggers</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Downstream: {selected.slaStatus.downstreamEscalationTriggered ? 'Yes' : 'No'}
                        · Products/services: {selected.slaStatus.governanceProductsEscalationTriggered ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                )}
                {selected.internalControlDiscount && (
                  <div className={`rounded-md p-4 border ${selected.internalControlDiscount.effectiveDiscountPercent > 0 ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 dark:bg-slate-800'}`}>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      TCO discount: {selected.internalControlDiscount.effectiveDiscountPercent}%
                      {selected.internalControlDiscount.nominalDiscountPercent > selected.internalControlDiscount.effectiveDiscountPercent && (
                        <span className="text-orange-600 text-sm font-normal ml-2">
                          (was {selected.internalControlDiscount.nominalDiscountPercent}% — voided by SLA breach)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{selected.internalControlDiscount.note}</p>
                    <ul className="mt-3 space-y-1">
                      {(selected.internalControlDiscount.tierResults || []).map((tier) => (
                        <li key={tier.tierId} className="text-xs text-emerald-800 dark:text-emerald-300">
                          +{tier.discountPercent}% — {tier.label}
                        </li>
                      ))}
                    </ul>
                    {selected.internalControlDiscount.voidReason && (
                      <p className="text-xs text-orange-700 mt-2">{selected.internalControlDiscount.voidReason}</p>
                    )}
                  </div>
                )}
                {selected.mitigationCostCoverage && (
                  <div className="mt-4 rounded-md p-4 border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900">
                    <p className="font-semibold text-indigo-900 dark:text-indigo-200">
                      Vendor mitigation coverage
                      {selected.procurementSla?.status && (
                        <span className="ml-2 text-xs font-normal text-indigo-700">
                          ({selected.procurementSla.status})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {selected.mitigationCostCoverage.vendorAccountability?.obligation
                        || 'Vendor accountable for initiating controls per mitigation plan when non-compliance is triggered.'}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Model: {(selected.mitigationCostCoverage.coverageModel || 'vendor-accountability').replace(/-/g, ' ')}
                      · Pricing: {(selected.mitigationCostCoverage.pricingApproach || 'not-line-item-priced').replace(/-/g, ' ')}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {(selected.mitigationCostCoverage.controlObligations || []).map((item) => (
                        <li key={item.obligationId} className="text-xs border border-indigo-100 dark:border-indigo-800 rounded p-2 bg-white/60 dark:bg-slate-900/40">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{item.description}</span>
                          <p className="text-slate-500 mt-1">
                            Accountable: {item.accountableParty || 'vendor'}
                            {item.linkedRuleId && ` · Rule: ${item.linkedRuleId}`}
                          </p>
                        </li>
                      ))}
                    </ul>
                    {selected.mitigationCostCoverage.financialExposure && (
                      <p className="text-xs text-slate-500 mt-3 italic">
                        {selected.mitigationCostCoverage.financialExposure.note
                          || 'Control placement is not line-item priced. Dollar exposure is reported via FAIR/ALE/TCO only.'}
                      </p>
                    )}
                    {(selected.mitigationCostCoverage.totalEstimatedCoverageUsd != null
                      && selected.mitigationCostCoverage.totalEstimatedCoverageUsd > 0) && (
                      <p className="text-xs text-slate-500 mt-2">
                        Optional TCO estimate: ${selected.mitigationCostCoverage.totalEstimatedCoverageUsd.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 p-5">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-1">Check validation (prevent downstream escalation)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                  Confirm an internal check/validation covers the failed rules so non-compliance does not propagate on your premises.
                </p>
                {selected.clientCheckValidation ? (
                  <div className="rounded-md bg-white dark:bg-slate-900 border p-3 text-sm">
                    <p className="font-medium">{selected.clientCheckValidation.checkValidationDescription}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Prevents downstream: {selected.clientCheckValidation.preventsDownstreamEscalation ? 'Yes' : 'No'}
                      · Assessed {new Date(selected.clientCheckValidation.assessedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={async (ev) => {
                      ev.preventDefault();
                      await postAction(
                        `/api/traceability/tenants/${tenantId}/compliance-escalations/${selected.escalationId}/check-validation`,
                        checkForm
                      );
                    }}
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checkForm.checkValidationInPlace}
                        onChange={(e) => setCheckForm({ ...checkForm, checkValidationInPlace: e.target.checked })}
                      />
                      Internal check/validation is in place
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checkForm.preventsDownstreamEscalation}
                        onChange={(e) => setCheckForm({ ...checkForm, preventsDownstreamEscalation: e.target.checked })}
                      />
                      This prevents downstream escalation on client premises
                    </label>
                    <select
                      multiple
                      value={checkForm.linkedRuleIds}
                      onChange={(e) => setCheckForm({
                        ...checkForm,
                        linkedRuleIds: Array.from(e.target.selectedOptions, (o) => o.value)
                      })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    >
                      {(selected.mitigationPlan?.clientActions || []).map((a) => (
                        <option key={a.linkedRuleId} value={a.linkedRuleId}>{a.linkedRuleId} — {a.title}</option>
                      ))}
                    </select>
                    <textarea
                      required
                      placeholder="Describe your compensating check/validation…"
                      value={checkForm.checkValidationDescription}
                      onChange={(e) => setCheckForm({ ...checkForm, checkValidationDescription: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    />
                    <input
                      type="text"
                      placeholder="Evidence reference (optional)"
                      value={checkForm.evidenceRef}
                      onChange={(e) => setCheckForm({ ...checkForm, evidenceRef: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !checkForm.linkedRuleIds.length}
                      className="px-4 py-2 rounded-md bg-emerald-700 text-white text-sm hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Record check validation
                    </button>
                  </form>
                )}
              </section>

              <section className="rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/30 dark:bg-violet-950/20 p-5">
                <h3 className="font-semibold text-violet-900 dark:text-violet-300 mb-1">Liability routing (no immediate vendor block)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                  After reviewing failed rules, decide whether internal controls contain the risk at the vendor,
                  or whether non-compliance escalates into your governance products and services.
                </p>
                {selected.liabilityRouting ? (
                  <div className="rounded-md bg-white dark:bg-slate-900 border p-3 text-sm">
                    <p className="font-medium capitalize">{selected.liabilityRouting.routingDecision.replace(/-/g, ' ')}</p>
                    <p className="text-xs text-slate-500 mt-2">{selected.liabilityRouting.rationale}</p>
                    <p className="text-xs text-violet-700 mt-2">
                      Internal mitigation sufficient: {selected.liabilityRouting.internalMitigationSufficient ? 'Yes' : 'No'}
                      · Vendor block applied: {selected.liabilityRouting.immediateVendorBlockApplied ? 'Yes' : 'No'}
                    </p>
                  </div>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={async (ev) => {
                      ev.preventDefault();
                      await postAction(
                        `/api/traceability/tenants/${tenantId}/compliance-escalations/${selected.escalationId}/liability-routing`,
                        routingForm
                      );
                    }}
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={routingForm.internalMitigationSufficient}
                        onChange={(e) => setRoutingForm({ ...routingForm, internalMitigationSufficient: e.target.checked })}
                      />
                      Internal controls sufficiently mitigate the vendor non-compliance
                    </label>
                    <select
                      value={routingForm.routingDecision}
                      onChange={(e) => setRoutingForm({ ...routingForm, routingDecision: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      <option value="remains-with-vendor">Remains with non-compliant vendor</option>
                      <option value="escalates-to-governance-products-services">Escalates into governance products &amp; services</option>
                    </select>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Vendor ID (optional)"
                        value={routingForm.vendorId}
                        onChange={(e) => setRoutingForm({ ...routingForm, vendorId: e.target.value })}
                        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Vendor name (optional)"
                        value={routingForm.vendorName}
                        onChange={(e) => setRoutingForm({ ...routingForm, vendorName: e.target.value })}
                        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      />
                    </div>
                    <select
                      multiple
                      value={routingForm.linkedRuleIds}
                      onChange={(e) => setRoutingForm({
                        ...routingForm,
                        linkedRuleIds: Array.from(e.target.selectedOptions, (o) => o.value)
                      })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    >
                      {(selected.mitigationPlan?.clientActions || []).map((a) => (
                        <option key={a.linkedRuleId} value={a.linkedRuleId}>{a.linkedRuleId}</option>
                      ))}
                    </select>
                    <textarea
                      required
                      placeholder="Rationale for liability routing decision…"
                      value={routingForm.rationale}
                      onChange={(e) => setRoutingForm({ ...routingForm, rationale: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !routingForm.linkedRuleIds.length}
                      className="px-4 py-2 rounded-md bg-violet-700 text-white text-sm hover:bg-violet-600 disabled:opacity-50"
                    >
                      Record liability routing
                    </button>
                  </form>
                )}
              </section>

              <section className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20 p-5">
                <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">Downstream liability escalation</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                  If you cannot contain the failure with check validation, formally escalate downstream liability linked to the failed framework rules.
                </p>
                {selected.downstreamLiabilityEscalation?.status === 'escalated' ? (
                  <div className="rounded-md bg-white dark:bg-slate-900 border p-3 text-sm">
                    <p className="font-medium">{selected.downstreamLiabilityEscalation.description}</p>
                    <p className="text-xs text-slate-500 mt-2">{selected.downstreamLiabilityEscalation.impactAssessment}</p>
                    <p className="text-xs text-amber-700 mt-2">
                      Scope: {selected.downstreamLiabilityEscalation.liabilityScope}
                      · Escalated {new Date(selected.downstreamLiabilityEscalation.escalatedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={async (ev) => {
                      ev.preventDefault();
                      await postAction(
                        `/api/traceability/tenants/${tenantId}/compliance-escalations/${selected.escalationId}/downstream-liability`,
                        downstreamForm
                      );
                    }}
                  >
                    <select
                      value={downstreamForm.liabilityScope}
                      onChange={(e) => setDownstreamForm({ ...downstreamForm, liabilityScope: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      <option value="client-premises-downstream">Client premises downstream</option>
                      <option value="business-process">Business process impact</option>
                      <option value="third-party-chain">Third-party chain</option>
                      <option value="operational-impact">Operational impact</option>
                    </select>
                    <select
                      multiple
                      value={downstreamForm.linkedRuleIds}
                      onChange={(e) => setDownstreamForm({
                        ...downstreamForm,
                        linkedRuleIds: Array.from(e.target.selectedOptions, (o) => o.value)
                      })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    >
                      {(selected.mitigationPlan?.clientActions || []).map((a) => (
                        <option key={a.linkedRuleId} value={a.linkedRuleId}>{a.linkedRuleId}</option>
                      ))}
                    </select>
                    <textarea
                      required
                      placeholder="Describe downstream liability and impact…"
                      value={downstreamForm.description}
                      onChange={(e) => setDownstreamForm({ ...downstreamForm, description: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    />
                    <textarea
                      placeholder="Impact assessment (optional)"
                      value={downstreamForm.impactAssessment}
                      onChange={(e) => setDownstreamForm({ ...downstreamForm, impactAssessment: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[60px]"
                    />
                    <input
                      type="datetime-local"
                      value={downstreamForm.mitigationDeadline}
                      onChange={(e) => setDownstreamForm({ ...downstreamForm, mitigationDeadline: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !downstreamForm.linkedRuleIds.length}
                      className="px-4 py-2 rounded-md bg-amber-700 text-white text-sm hover:bg-amber-600 disabled:opacity-50"
                    >
                      Escalate downstream liability
                    </button>
                  </form>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Close escalation</h3>
                <textarea
                  placeholder="Resolution notes…"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[60px] mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={submitting || selected.status === 'Resolved'}
                    onClick={() => postAction(
                      `/api/traceability/tenants/${tenantId}/compliance-escalations/${selected.escalationId}/resolve`,
                      { decision: 'remediate', notes: resolveNotes }
                    )}
                    className="px-3 py-1.5 text-sm rounded-md bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    Resolved — remediated
                  </button>
                  <button
                    type="button"
                    disabled={submitting || selected.status === 'Resolved'}
                    onClick={() => postAction(
                      `/api/traceability/tenants/${tenantId}/compliance-escalations/${selected.escalationId}/resolve`,
                      { decision: 'compensating-control', notes: resolveNotes }
                    )}
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    Resolved — compensating control
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
