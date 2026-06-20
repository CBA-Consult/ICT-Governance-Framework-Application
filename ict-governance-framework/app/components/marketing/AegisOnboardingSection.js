'use client';

import Link from 'next/link';

const ONBOARDING_STEPS = [
  {
    step: '01',
    title: 'Register & Upload',
    summary: 'Create your secure workspace and upload governance artifacts (PDF, DOCX, TXT, Markdown).',
    outcome: 'Governance reality enters the system',
    phase: 'ingest'
  },
  {
    step: '02',
    title: 'AI Extraction',
    summary: 'Semantic engine structures requirements, controls, processes, and implicit practices.',
    outcome: 'What exists — not just what is claimed',
    phase: 'extract'
  },
  {
    step: '03',
    title: 'Maturity Scoring',
    summary: 'Entities scored across Initial → Optimizing with evidence-backed consistency.',
    outcome: 'Current governance state defined',
    phase: 'assess'
  },
  {
    step: '04',
    title: 'Actionable Insights',
    summary: 'Prioritized roadmap, control gaps, SLA and evidence expectations.',
    outcome: 'Required state transformation',
    phase: 'act'
  },
  {
    step: '05',
    title: 'Review & Collaborate',
    summary: 'Shared workspace for domain maturity, gaps, validation, and team remediation.',
    outcome: 'Governance becomes operational',
    phase: 'collaborate'
  },
  {
    step: '06',
    title: 'Enforce & Restore',
    summary: 'SET → OBSERVE → COMPARE → ACT → VERIFY — multi-source evidence and controlled remediation.',
    outcome: 'Control loop begins',
    phase: 'control'
  }
];

const MATURITY_LEVELS = [
  { level: 1, name: 'Initial', detail: 'Ad-hoc, reactive — no systemic enforcement' },
  { level: 2, name: 'Managed', detail: 'Project-level controls with limited consistency' },
  { level: 3, name: 'Defined', detail: 'Organization-wide standards and formal tooling' },
  { level: 4, name: 'Quantitatively Managed', detail: 'KPI-driven, predictable outcomes' },
  { level: 5, name: 'Optimizing', detail: 'Continuous verification + controlled correction (DGCS)' }
];

export default function AegisOnboardingSection({ isAuthenticated = false }) {
  const startHref = '/onboarding/wizard';
  const uploadHref = isAuthenticated ? '/documents/new' : '/onboarding/wizard';

  return (
    <section className="bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Onboarding journey
          </p>
          <h2 className="mt-2 text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            From documents to controlled state
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Ingest → extract → verify → score → act → control loop. Not a maturity scanner — a
            state-ingestion pipeline that activates a Digital Governance Control System.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {ONBOARDING_STEPS.map((item) => (
            <div
              key={item.step}
              className={`rounded-xl border p-5 bg-white dark:bg-slate-900 ${
                item.phase === 'control'
                  ? 'border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-200 dark:ring-emerald-900'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.summary}</p>
                  <p className="mt-2 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                    → {item.outcome}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Maturity model</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Initial → Managed → Defined → Quantitative → Optimizing
          </p>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {MATURITY_LEVELS.map((m) => (
              <div
                key={m.level}
                className={`rounded-lg border p-3 text-sm ${
                  m.level === 5
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  L{m.level} · {m.name}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-6">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
            From this point forward, Aegis Control continuously verifies and restores your governance state.
          </p>
          <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Onboarding ends at Step 06 — operational control begins with evidence-backed closure on every deviation.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={startHref}
              className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {isAuthenticated ? 'Run guided experience' : 'Start onboarding'}
            </Link>
            <Link
              href={uploadHref}
              className="inline-flex rounded-md border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 px-4 py-2 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              {isAuthenticated ? 'Upload artifacts directly' : 'Skip to upload'}
            </Link>
            <Link
              href={isAuthenticated ? '/compliance-escalations' : '/auth?redirect=/compliance-escalations'}
              className="inline-flex rounded-md border border-emerald-600 text-emerald-700 dark:text-emerald-400 px-4 py-2 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
            >
              See control loop in action
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
