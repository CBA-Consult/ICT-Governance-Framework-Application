'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AegisLogoPrimary from '../governance/AegisLogoPrimary';
import AegisLogoConvergence from '../governance/AegisLogoConvergence';
import AegisLogoMultisource from '../governance/AegisLogoMultisource';
import GovernanceStateBadge from '../governance/GovernanceStateBadge';
import { authFetch } from '../../lib/authFetch';
import { resolveEscalationEvidenceState } from '../../../lib/governanceState';

import AegisOnboardingSection from './AegisOnboardingSection';

const DEMO_TENANT = 'tenant-contoso-health';

const CONTROL_LOOP = [
  { step: 'SET', label: 'Define intended state', detail: 'Requirements, Layer 2 baselines, ADPA artifacts' },
  { step: 'OBSERVE', label: 'Collect evidence', detail: 'Policy scan, Graph API, Sentinel queries' },
  { step: 'COMPARE', label: 'Resolve truth', detail: 'evidenceChain: consistent | divergent | partial' },
  { step: 'ACT', label: 'Controlled remediation', detail: 'Manual orchestration (L4), approval-gated' },
  { step: 'VERIFY', label: 'Close with proof', detail: 'Verified lifecycle state + full lineage' }
];

const PRINCIPLES = [
  {
    title: 'Always Verified',
    body: 'State is validated using independent evidence — not inferred from telemetry alone.'
  },
  {
    title: 'Deterministically Enforced',
    body: 'Policies are executable and testable, not descriptive or advisory.'
  },
  {
    title: 'Continuously Restored',
    body: 'Deviation triggers guided remediation until the intended state is proven.'
  }
];

const ARCHITECTURE_LAYERS = [
  { layer: 'Category', name: 'Digital Governance Control System (DGCS)' },
  { layer: 'Platform', name: 'ICT Governance Framework' },
  { layer: 'Engine', name: 'ADPA Governance Engine' },
  { layer: 'Product', name: 'Aegis Control' }
];

export default function AegisHomeLanding({ isAuthenticated = false, user = null }) {
  const [posture, setPosture] = useState(null);
  const [postureLoading, setPostureLoading] = useState(false);

  // Only fetch protected APIs after auth is confirmed — never on public load
  useEffect(() => {
    if (!isAuthenticated) {
      setPosture(null);
      return undefined;
    }

    let cancelled = false;
    setPostureLoading(true);

    (async () => {
      try {
        const res = await authFetch(
          `/api/traceability/tenants/${encodeURIComponent(DEMO_TENANT)}/compliance-escalations`
        );
        if (cancelled) return;
        if (!res.ok) {
          setPosture(null);
          return;
        }
        const payload = await res.json();
        const escalations = payload.data?.escalations || [];
        const open = escalations.filter((e) =>
          ['Open', 'Mitigating', 'Acknowledged'].includes(e.status)
        );

        let state = 'verified';
        let confidence = 'high';

        if (open.some((e) => resolveEscalationEvidenceState(e) === 'divergent')) {
          state = 'divergent';
          const divergent = open.find((e) => resolveEscalationEvidenceState(e) === 'divergent');
          confidence = divergent?.evidenceChains?.[0]?.confidence || 'low';
        } else if (open.some((e) => resolveEscalationEvidenceState(e) === 'partial')) {
          state = 'partial';
          confidence = 'medium';
        } else if (open.length > 0) {
          state = 'consistent';
          confidence = open[0]?.evidenceChains?.[0]?.confidence || 'high';
        }

        setPosture({ state, confidence, openCount: open.length });
      } catch {
        if (!cancelled) setPosture(null);
      } finally {
        if (!cancelled) setPostureLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const displayName = user?.firstName || user?.displayName || user?.username || 'there';
  const demoHref = isAuthenticated
    ? '/compliance-escalations'
    : '/auth?redirect=/compliance-escalations';

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-indigo-950/40 dark:via-slate-950 dark:to-emerald-950/20" />
        <div className="absolute top-20 right-10 opacity-20 dark:opacity-10 pointer-events-none hidden lg:block">
          <AegisLogoPrimary size={320} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {isAuthenticated ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Welcome back, {displayName}
                  </p>
                  <h1 className="mt-3 text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Aegis Control
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Demo tenant posture · Contoso Health
                    </span>
                    {postureLoading ? (
                      <span className="text-xs text-slate-400">Loading state…</span>
                    ) : posture ? (
                      <GovernanceStateBadge state={posture.state} confidence={posture.confidence} size="md" />
                    ) : (
                      <GovernanceStateBadge state="pending" size="md" />
                    )}
                  </div>
                  {posture?.openCount > 0 && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {posture.openCount} open escalation{posture.openCount === 1 ? '' : 's'} under governance review.
                    </p>
                  )}
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                    Your control system is active — verify evidence, orchestrate remediation, and close with proof.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Digital Governance Control System
                  </p>
                  <h1 className="mt-3 text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Aegis
                  </h1>
                  <p className="mt-4 text-lg text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                    Protection is not assumed — it is verified, enforced, and restored with evidence.
                  </p>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                    Aegis continuously ensures enterprise IT environments remain in their intended state
                    through deterministic governance, independent verification, and controlled remediation.
                  </p>
                </>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Open Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/onboarding/wizard"
                      className="inline-flex items-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Start guided experience
                    </Link>
                    <Link
                      href="/auth"
                      className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth?mode=register"
                      className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Register
                    </Link>
                  </>
                )}
                <Link
                  href={demoHref}
                  className="inline-flex items-center rounded-md border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-5 py-2.5 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                >
                  View Control Loop Demo
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-8 shadow-lg">
                <AegisLogoPrimary size={200} className="mx-auto" />
                <p className="mt-4 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  Shield · Control loop · Verified core
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Control loop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Governance control loop</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          A closed feedback system — not monitoring, not reporting. Every deviation has an actionable outcome with proof.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CONTROL_LOOP.map((item, idx) => (
            <div
              key={item.step}
              className="relative rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
            >
              {idx < CONTROL_LOOP.length - 1 && (
                <span className="hidden lg:block absolute top-1/2 -right-2 text-slate-300 dark:text-slate-600 text-lg z-10">
                  →
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                {item.step}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System design: marks + states */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">System design semantics</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Visual language maps directly to runtime governance states enforced in the product.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <AegisLogoPrimary size={80} className="mx-auto" />
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Authority + control</h3>
              <p className="mt-2 text-xs text-slate-500">Primary mark — governed protection with continuous feedback</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <AegisLogoMultisource size={80} className="mx-auto" />
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Multi-source validation</h3>
              <p className="mt-2 text-xs text-slate-500">Independent evidence corroborated into evidenceChain resolution</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <GovernanceStateBadge state="consistent" confidence="high" />
                <GovernanceStateBadge state="divergent" confidence="low" />
                <GovernanceStateBadge state="partial" confidence="medium" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <AegisLogoConvergence size={80} className="mx-auto" />
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Remediation convergence</h3>
              <p className="mt-2 text-xs text-slate-500">Divergence corrected until verified, high-confidence closure</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <GovernanceStateBadge state="running" />
                <GovernanceStateBadge state="verified" />
                <GovernanceStateBadge state="closed" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Architecture stack</h2>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Layer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Component</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
              {ARCHITECTURE_LAYERS.map((row) => (
                <tr key={row.layer}>
                  <td className="px-4 py-3 font-medium text-indigo-700 dark:text-indigo-400">{row.layer}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <blockquote className="mt-8 border-l-4 border-emerald-500 pl-4 text-sm text-slate-700 dark:text-slate-300 italic max-w-3xl">
          Remediation is not complete until independent evidence confirms consistent, high-confidence state —
          with full lineage from requirement to runtime.
        </blockquote>
      </section>

      <AegisOnboardingSection isAuthenticated={isAuthenticated} />

      {/* Principles */}
      <section className="bg-indigo-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold">Core principles</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-lg bg-indigo-900/50 border border-indigo-800 p-5">
                <h3 className="font-semibold text-indigo-200">{p.title}</h3>
                <p className="mt-2 text-sm text-indigo-100/90">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
