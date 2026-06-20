'use client';

import { useState } from 'react';
import { XMarkIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { authFetch, parseApiError } from '../../lib/authFetch';

const PROCEDURE_STEPS = [
  {
    title: 'Confirm identity platform degradation',
    detail:
      'Break Glass is only for when standard paths fail: Global Administrator lockout, MFA device loss with no backup admin, or Entra ID / identity infrastructure outage blocking normal recovery.'
  },
  {
    title: 'Request audit & compliance review (before activation)',
    detail:
      'The audit team must be notified prior to or concurrently with any emergency activation. All steps are logged to the immutable privileged-action ledger with cryptographic payload hashes.'
  },
  {
    title: 'Global Administrator recovery scope',
    detail:
      'Intervention may include password reset for the Global Administrator account/role and temporary replacement of MFA with a time-bounded emergency factor. Previous MFA bindings must be invalidated and restored only after formal closeout.'
  },
  {
    title: 'Out-of-band activation only',
    detail:
      'Emergency windows are opened via POST /api/auth/jit/emergency/activate using the configured system secret — never through this UI. This console is for audit, reconciliation, and compliance review after the fact.'
  },
  {
    title: 'Mandatory closeout',
    detail:
      'Every emergency ticket requires cryptographic reconciliation, audit sign-off, and restoration of standard MFA and least-privilege access within the defined emergency window.'
  }
];

const MINIMUM_REQUIREMENTS = [
  'Documented business justification and incident reference (ticket / bridge call ID)',
  'Compliance or audit team notified — review triggered before or during the procedure',
  'Named approver for Global Administrator identity recovery',
  'Time-bounded emergency window with automatic expiry',
  'Full privileged-action audit trail (noisy by design — every mutation logged)',
  'Post-incident reconciliation sweep and MFA restoration plan'
];

export default function BreakGlassProcedureModal({ open, onClose }) {
  const [tab, setTab] = useState('guidance');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [ackAudit, setAckAudit] = useState(false);
  const [ackTemporaryMfa, setAckTemporaryMfa] = useState(false);
  const [form, setForm] = useState({
    tenantScope: '',
    affectedIdentity: '',
    lockoutType: 'mfa',
    incidentReference: '',
    businessJustification: '',
    contactInfo: ''
  });

  if (!open) return null;

  const resetAndClose = () => {
    if (submitting) return;
    setTab('guidance');
    setSubmitError(null);
    setSubmitSuccess(null);
    setAckAudit(false);
    setAckTemporaryMfa(false);
    onClose();
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!ackAudit || !ackTemporaryMfa) {
      setSubmitError('You must acknowledge audit review and temporary MFA handling before submitting.');
      return;
    }
    if (!form.affectedIdentity.trim() || !form.businessJustification.trim()) {
      setSubmitError('Affected identity and business justification are required.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await authFetch('/api/feedback/break-glass-intervention', {
        method: 'POST',
        body: JSON.stringify({
          tenantScope: form.tenantScope,
          affectedIdentity: form.affectedIdentity,
          lockoutType: form.lockoutType,
          incidentReference: form.incidentReference,
          businessJustification: form.businessJustification,
          contactInfo: form.contactInfo
        })
      });
      if (res.status === 401) {
        throw new Error('Your session has expired. Sign in again and retry the intervention request.');
      }
      if (res.status === 403) {
        throw new Error(
          'Your account cannot submit Break Glass intervention requests. Contact the audit/compliance team via your incident bridge.'
        );
      }
      if (!res.ok) throw new Error(await parseApiError(res, 'Failed to submit intervention request'));

      const data = await res.json();
      setSubmitSuccess(data.feedbackId || data.id || 'Submitted');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-rose-200 dark:border-rose-900 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start gap-4">
          <div className="flex gap-3">
            <ShieldExclamationIcon className="h-8 w-8 text-rose-600 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Break Glass Emergency Procedure
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Global Administrator lockout · MFA recovery · audit-gated intervention
              </p>
            </div>
          </div>
          <button type="button" onClick={resetAndClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            type="button"
            onClick={() => setTab('guidance')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px ${
              tab === 'guidance'
                ? 'border-rose-600 text-rose-700 dark:text-rose-300'
                : 'border-transparent text-gray-500'
            }`}
          >
            Procedure &amp; audit requirements
          </button>
          <button
            type="button"
            onClick={() => setTab('request')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px ${
              tab === 'request'
                ? 'border-rose-600 text-rose-700 dark:text-rose-300'
                : 'border-transparent text-gray-500'
            }`}
          >
            Request GA intervention
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {tab === 'guidance' && (
            <div className="space-y-6 text-sm">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-amber-900 dark:text-amber-100">
                <p className="font-semibold">When identity infrastructure is degraded</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Use this procedure when the Global Administrator cannot sign in (password expired, MFA device lost,
                  conditional access loop, or identity platform outage) and no other privileged path can restore governance.
                  Routine password resets use standard self-service or helpdesk — not Break Glass.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Procedure steps</h3>
                <ol className="space-y-3">
                  {PROCEDURE_STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 text-xs font-bold text-rose-800 dark:text-rose-200">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{step.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                  Minimum requirements (noisy audit)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-700 dark:text-gray-300">
                  {MINIMUM_REQUIREMENTS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-3">
                Expected production volume: <strong>0–1</strong> emergency activation per 30 days. Higher counts
                indicate verification test data, repeated lockouts, or a control failure requiring audit review.
              </p>
            </div>
          )}

          {tab === 'request' && (
            <form onSubmit={handleSubmitRequest} className="space-y-4 text-sm">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Submit a formal request for Global Administrator intervention. This notifies compliance and audit —
                it does <strong>not</strong> activate emergency access. Activation remains out-of-band via the
                emergency API after approval.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tenant / scope</span>
                  <input
                    type="text"
                    value={form.tenantScope}
                    onChange={(e) => setForm((f) => ({ ...f, tenantScope: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                    placeholder="e.g. tenant-01"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Affected identity (GA UPN) *</span>
                  <input
                    type="text"
                    required
                    value={form.affectedIdentity}
                    onChange={(e) => setForm((f) => ({ ...f, affectedIdentity: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                    placeholder="globaladmin@contoso.com"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Lockout type</span>
                <select
                  value={form.lockoutType}
                  onChange={(e) => setForm((f) => ({ ...f, lockoutType: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="mfa">MFA / authenticator unavailable</option>
                  <option value="password">Password reset required</option>
                  <option value="both">Password and MFA recovery</option>
                  <option value="identity_platform">Identity platform outage</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Incident / bridge reference</span>
                <input
                  type="text"
                  value={form.incidentReference}
                  onChange={(e) => setForm((f) => ({ ...f, incidentReference: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  placeholder="INC-12345 or bridge call ID"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Business justification *</span>
                <textarea
                  required
                  rows={4}
                  value={form.businessJustification}
                  onChange={(e) => setForm((f) => ({ ...f, businessJustification: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  placeholder="Why standard recovery paths are unavailable and impact if GA remains locked out…"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Contact</span>
                <input
                  type="text"
                  value={form.contactInfo}
                  onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  placeholder="Phone or Teams reach-back"
                />
              </label>

              <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900/40">
                <label className="flex gap-2 items-start text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ackAudit}
                    onChange={(e) => setAckAudit(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I understand the audit team must review this request prior to or during any Break Glass activation,
                    and all actions produce immutable privileged-action logs.
                  </span>
                </label>
                <label className="flex gap-2 items-start text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ackTemporaryMfa}
                    onChange={(e) => setAckTemporaryMfa(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I understand emergency recovery may temporarily replace existing MFA factors for the Global
                    Administrator account until formal closeout and restoration.
                  </span>
                </label>
              </div>

              {submitError && (
                <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>
              )}
              {submitSuccess && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Request recorded ({submitSuccess}). Audit/compliance will review before any emergency activation.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit intervention request to audit queue'}
              </button>
            </form>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={resetAndClose}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
