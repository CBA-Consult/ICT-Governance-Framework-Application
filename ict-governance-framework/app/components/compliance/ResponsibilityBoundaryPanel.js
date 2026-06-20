'use client';

import GovernanceStateBadge from '../governance/GovernanceStateBadge';
import { resolveGovernanceState } from '../../../lib/governanceState';

function monitorabilityLabel(obl) {
  const m = obl.monitorability;
  if (!m?.type) return null;
  const conf = m.confidenceLevel ? ` · ${m.confidenceLevel} confidence` : '';
  return `${m.type.replace(/-/g, ' ')}${conf}`;
}

function evidenceLabel(obl) {
  const ev = obl.obligationEvidence || obl.evidence;
  if (!ev) return null;
  const primary = obl.obligationEvidence?.primarySource || ev.primarySource || ev.source;
  const freq = ev.auditFrequency || obl.obligationEvidence?.auditFrequency;
  const ownership = ev.ownership || obl.obligationEvidence?.ownership;
  if (!primary) {
    const count = (ev.sources || []).length;
    return count ? `${count} evidence sources (${ownership || 'shared'})` : null;
  }
  return `${primary.replace(/-/g, ' ')}${freq ? ` · ${freq}` : ''}${ownership ? ` · ${ownership}-owned` : ''}`;
}

function ObligationCard({ obl, variant }) {
  const border = {
    service: 'border-emerald-200 dark:border-emerald-800',
    shared: 'border-amber-300 dark:border-amber-700',
    client: 'border-slate-300 dark:border-slate-600'
  }[variant] || 'border-slate-200';

  const badge = {
    service: 'text-emerald-700 dark:text-emerald-400',
    shared: 'text-amber-700 dark:text-amber-400',
    client: 'text-slate-500 dark:text-slate-400'
  }[variant];

  return (
    <li className={`text-xs rounded-md border ${border} bg-white/70 dark:bg-slate-900/40 p-2`}>
      <p className="font-medium text-slate-800 dark:text-slate-200">{obl.title}</p>
      {monitorabilityLabel(obl) && (
        <p className={`${badge} mt-1 capitalize`}>{monitorabilityLabel(obl)}</p>
      )}
      {variant === 'service' && obl.monitoredBySystem && (
        <p className="text-emerald-600 mt-1">Monitored by system</p>
      )}
      {obl.slaBinding?.slaId && (
        <p className="text-indigo-600 dark:text-indigo-400 mt-1">
          SLA {obl.slaBinding.contractClauseRef || obl.slaBinding.slaId}
          {obl.slaBinding.targets?.threshold && ` · target ${obl.slaBinding.targets.threshold}`}
        </p>
      )}
      {obl.slaStatus?.applicable && (
        <p className={`mt-1 ${obl.slaStatus.breached ? 'text-rose-600' : 'text-emerald-600'}`}>
          {obl.slaStatus.breached
            ? `SLA breached (${obl.slaStatus.contractClauseRef || obl.slaStatus.slaId})`
            : 'SLA met for active-eligible denominator'}
        </p>
      )}
      {evidenceLabel(obl) && (
        <p className="text-sky-700 dark:text-sky-400 mt-1 capitalize">
          Evidence: {evidenceLabel(obl)}
          {obl.obligationEvidence?.auditReady === false && ' · audit gaps'}
        </p>
      )}
      {obl.evidenceChain && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Cross-source</span>
          <GovernanceStateBadge
            state={resolveGovernanceState(obl.evidenceChain)}
            confidence={obl.evidenceChain.confidence}
          />
          {obl.evidenceChain.requiresEscalation && (
            <span className="text-xs text-rose-600 dark:text-rose-400">Action required</span>
          )}
        </div>
      )}
      {variant === 'client' && (
        <p className="text-slate-500 mt-1">Client specification — not system-monitored</p>
      )}
      {variant === 'shared' && obl.sharedResponsibilityModel && (
        <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">Service:</span>
            {' '}{(obl.sharedResponsibilityModel.serviceEnsures || []).join(', ').replace(/-/g, ' ')}
          </p>
          <p>
            <span className="font-medium text-slate-600 dark:text-slate-400">Client:</span>
            {' '}{(obl.sharedResponsibilityModel.clientEnsures || []).join(', ').replace(/-/g, ' ')}
          </p>
          <p className="text-amber-600 dark:text-amber-500 capitalize">
            Attribution: {obl.sharedResponsibilityModel.failureAttributionLogic?.replace(/-/g, ' ')}
          </p>
        </div>
      )}
    </li>
  );
}

export default function ResponsibilityBoundaryPanel({ boundary, frameworkImpacts }) {
  if (!boundary) return null;

  const obligations = boundary.obligations || [
    ...(boundary.serviceObligations || []).map((o) => ({ ...o, responsibilityType: o.responsibilityType || 'service' })),
    ...(boundary.sharedObligations || []).map((o) => ({ ...o, responsibilityType: 'shared' })),
    ...(boundary.clientPremisesObligations || []).map((o) => ({ ...o, responsibilityType: o.responsibilityType || 'client' }))
  ];

  const service = obligations.filter((o) => (o.responsibilityType || 'service') === 'service');
  const shared = obligations.filter((o) => o.responsibilityType === 'shared');
  const client = obligations.filter((o) => (o.responsibilityType || 'client') === 'client');

  return (
    <section className="rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/30 dark:bg-violet-950/20 p-5">
      <h3 className="font-semibold text-violet-900 dark:text-violet-200 mb-1">Responsibility boundary</h3>
      <p className="text-xs text-slate-500 mb-3">Service · Shared · Client — monitorability · SLA · evidence</p>
      {boundary.summary && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{boundary.summary}</p>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
            Service-controlled ({service.length})
          </p>
          <ul className="space-y-2">
            {service.map((obl) => (
              <ObligationCard key={obl.obligationId} obl={obl} variant="service" />
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
            Shared ({shared.length})
          </p>
          <ul className="space-y-2">
            {shared.length === 0 ? (
              <li className="text-xs text-slate-500">None</li>
            ) : shared.map((obl) => (
              <ObligationCard key={obl.obligationId} obl={obl} variant="shared" />
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-2">
            Client-controlled ({client.length})
          </p>
          <ul className="space-y-2">
            {client.map((obl) => (
              <ObligationCard key={obl.obligationId} obl={obl} variant="client" />
            ))}
          </ul>
        </div>
      </div>
      {(frameworkImpacts || []).some((i) => i.responsibilityBoundary) && (
        <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800">
          <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 mb-2">Per standard split</p>
          {(frameworkImpacts || []).map((impact) => impact.responsibilityBoundary && (
            <div key={`${impact.certificationId}-${impact.controlId}`} className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              <span className="font-medium">{impact.certificationId} {impact.controlId}:</span>
              {' '}service ({impact.responsibilityBoundary.serviceEnsures?.length || 0})
              · shared ({impact.responsibilityBoundary.sharedControls?.length || 0})
              · client ({impact.responsibilityBoundary.clientResponsibleFor?.length || 0})
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
