'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { authFetch, parseApiError } from '../../lib/authFetch';
import GovernanceStateBadge from '../governance/GovernanceStateBadge';
import AegisLogoConvergence from '../governance/AegisLogoConvergence';
import AegisLogoMultisource from '../governance/AegisLogoMultisource';
import { WIZARD_DEMO, WIZARD_STEPS, WIZARD_STEP_LABELS } from './wizardDemoData';

const EXTRACTION_TASKS = [
  'Identifying requirements',
  'Extracting control definitions',
  'Mapping processes',
  'Detecting implicit practices'
];

function WizardProgress({ currentIndex }) {
  return (
    <nav aria-label="Wizard progress" className="flex flex-wrap gap-2 justify-center mb-8">
      {WIZARD_STEPS.map((key, idx) => (
        <div
          key={key}
          className={`text-xs px-3 py-1 rounded-full border ${
            idx === currentIndex
              ? 'bg-indigo-600 text-white border-indigo-600'
              : idx < currentIndex
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:border-slate-700'
          }`}
        >
          {WIZARD_STEP_LABELS[key]}
        </div>
      ))}
    </nav>
  );
}

export default function AegisWizard() {
  const { isAuthenticated } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [extractionTaskIndex, setExtractionTaskIndex] = useState(-1);
  const [extractionDone, setExtractionDone] = useState(false);
  const [remediationRunning, setRemediationRunning] = useState(false);
  const [remediationRun, setRemediationRun] = useState(null);
  const [remediationError, setRemediationError] = useState(null);

  const step = WIZARD_STEPS[stepIndex];
  const goNext = useCallback(() => setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1)), []);
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  // Animated extraction sequence
  useEffect(() => {
    if (step !== 'extraction') return undefined;
    setExtractionTaskIndex(-1);
    setExtractionDone(false);
    let task = 0;
    const interval = setInterval(() => {
      setExtractionTaskIndex(task);
      task += 1;
      if (task >= EXTRACTION_TASKS.length) {
        clearInterval(interval);
        setTimeout(() => setExtractionDone(true), 400);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [step]);

  const startSampleDataset = () => {
    setDemoMode(true);
    setSelectedFiles([]);
    goNext();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setDemoMode(false);
  };

  const executeRemediation = async () => {
    setRemediationRunning(true);
    setRemediationError(null);
    try {
      if (isAuthenticated) {
        const res = await authFetch('/api/remediation/execute', {
          method: 'POST',
          body: JSON.stringify({
            tenantId: WIZARD_DEMO.tenantId,
            requirementId: WIZARD_DEMO.requirementId,
            planId: WIZARD_DEMO.planId,
            escalationId: WIZARD_DEMO.escalationId
          })
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Remediation failed'));
        }
        const payload = await res.json();
        setRemediationRun(payload.data);
        if (payload.success) {
          goNext();
        } else {
          setRemediationError(`Failed at step: ${payload.data?.failedStep || 'unknown'}`);
        }
      } else {
        await new Promise((r) => setTimeout(r, 2200));
        setRemediationRun({
          status: 'verified',
          results: WIZARD_DEMO.remediationSteps.map((s) => ({
            stepId: s.stepId,
            success: true
          })),
          finalValidation: {
            evidenceChain: { resolution: 'consistent', confidence: 'high' }
          }
        });
        goNext();
      }
    } catch (err) {
      setRemediationError(err.message);
    } finally {
      setRemediationRunning(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Back to Aegis Control
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            Guided first experience
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload → extract → detect → verify → remediate → prove
          </p>
        </div>

        <WizardProgress currentIndex={stepIndex} />

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 lg:p-8 shadow-sm">
          {step === 'upload' && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload governance artifacts</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                PDF, DOCX, TXT, Markdown — processed in a secure isolated zone.
              </p>
              <label className="mt-6 flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">Choose files or drag here</span>
                <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.txt,.md" onChange={handleFileChange} />
              </label>
              {selectedFiles.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">{selectedFiles.length} file(s) selected</p>
              )}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={startSampleDataset}
                  className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Use sample dataset (recommended demo)
                </button>
                <p className="mt-2 text-xs text-center text-slate-500">
                  Contoso Health MFA scenario — guaranteed end-to-end success
                </p>
              </div>
              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="mt-4 w-full rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium"
                >
                  Continue with uploaded files
                </button>
              )}
            </>
          )}

          {step === 'extraction' && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Analyzing artifacts…</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {demoMode ? 'Sample dataset: Contoso Health governance pack' : 'Processing your upload'}
              </p>
              <ul className="mt-6 space-y-3">
                {EXTRACTION_TASKS.map((task, idx) => (
                  <li key={task} className="flex items-center gap-3 text-sm">
                    <span className={idx <= extractionTaskIndex ? 'text-emerald-600' : 'text-slate-300'}>
                      {idx <= extractionTaskIndex ? '✓' : '○'}
                    </span>
                    <span className={idx <= extractionTaskIndex ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                      {task}
                    </span>
                  </li>
                ))}
              </ul>
              {extractionDone && (
                <div className="mt-6 rounded-lg bg-slate-50 dark:bg-slate-800 p-4 text-sm">
                  <p className="font-medium text-slate-900 dark:text-white">Extracted</p>
                  <ul className="mt-2 text-slate-600 dark:text-slate-400 space-y-1">
                    <li>{WIZARD_DEMO.extraction.requirements} requirements</li>
                    <li>{WIZARD_DEMO.extraction.controls} controls</li>
                    <li>{WIZARD_DEMO.extraction.gaps} governance gaps detected</li>
                  </ul>
                  <button type="button" onClick={goNext} className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                    View first insight
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'insight' && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Critical governance gap</h2>
              <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{WIZARD_DEMO.insight.title}</h3>
                  <GovernanceStateBadge state={WIZARD_DEMO.insight.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {WIZARD_DEMO.insight.aggregateEnrollment} aggregate enrollment — enforcement gap on active-eligible users.
                </p>
                <p className="mt-2 text-xs text-slate-500">{WIZARD_DEMO.insight.detail}</p>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                This mirrors live Contoso MFA requirement analysis — the system understood environment state, not just policy text.
              </p>
              <button type="button" onClick={goNext} className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Validate evidence
              </button>
            </>
          )}

          {step === 'escalation' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <AegisLogoMultisource size={48} />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Evidence validation</h2>
              </div>
              <ul className="space-y-2">
                {WIZARD_DEMO.evidenceSources.map((ev) => (
                  <li
                    key={ev.source}
                    className="flex justify-between items-center text-sm rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2"
                  >
                    <span className="font-medium">{ev.source}</span>
                    <span className={ev.result === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}>
                      {ev.result === 'PASS' ? '✅' : '❌'} {ev.result}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-slate-500 px-1">
                {WIZARD_DEMO.evidenceSources.map((e) => e.detail).join(' · ')}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600">Result:</span>
                <GovernanceStateBadge
                  state={WIZARD_DEMO.evidenceChain.resolution}
                  confidence={WIZARD_DEMO.evidenceChain.confidence}
                />
              </div>
              <div className="mt-4 rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-sm text-rose-800 dark:text-rose-300">
                Trust conflict: configuration and runtime behavior disagree.
              </div>
              <button type="button" onClick={goNext} className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Restore governed state
              </button>
            </>
          )}

          {step === 'remediation' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <AegisLogoConvergence size={48} />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Guided remediation</h2>
              </div>
              <ol className="space-y-2 text-sm">
                {WIZARD_DEMO.remediationSteps.map((s, idx) => (
                  <li key={s.stepId} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400">{idx + 1}.</span>
                    {s.label}
                    {remediationRun?.results?.find((r) => r.stepId === s.stepId)?.success && ' ✅'}
                  </li>
                ))}
              </ol>
              {!isAuthenticated && (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                  Demo mode — sign in to execute the live orchestrator. Simulation will match production outcomes.
                </p>
              )}
              {remediationError && (
                <p className="mt-3 text-sm text-rose-600">{remediationError}</p>
              )}
              <button
                type="button"
                onClick={executeRemediation}
                disabled={remediationRunning}
                className="mt-6 w-full rounded-md bg-rose-700 hover:bg-rose-800 disabled:opacity-50 px-4 py-3 text-sm font-semibold text-white"
              >
                {remediationRunning ? 'Running remediation…' : 'Execute remediation plan'}
              </button>
            </>
          )}

          {step === 'outcome' && (
            <>
              <div className="text-center">
                <GovernanceStateBadge state="verified" confidence="high" size="md" />
                <h2 className="mt-4 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  System restored to governed state
                </h2>
              </div>
              <div className="mt-6 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-sm">
                <p className="font-medium text-slate-900 dark:text-white">Evidence</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Graph API · Azure Policy · Sentinel →{' '}
                  <GovernanceStateBadge state="consistent" confidence="high" />
                </p>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                Detect → Verify → Act → Prove. This is how Aegis Control works.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link
                  href={isAuthenticated ? '/dashboard' : '/auth?redirect=/dashboard'}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Open full dashboard
                </Link>
                <Link
                  href={isAuthenticated ? '/documents/new' : '/auth?mode=register'}
                  className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium"
                >
                  Upload your real data
                </Link>
              </div>
            </>
          )}

          {stepIndex > 0 && step !== 'outcome' && step !== 'extraction' && (
            <button
              type="button"
              onClick={goBack}
              className="mt-6 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
