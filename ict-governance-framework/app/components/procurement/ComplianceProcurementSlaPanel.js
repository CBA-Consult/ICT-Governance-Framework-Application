'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

const DEFAULT_TENANT = 'tenant-contoso-health';

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export default function ComplianceProcurementSlaPanel({ tenantId = DEFAULT_TENANT }) {
  const { token } = useAuth();
  const [slas, setSlas] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftForm, setDraftForm] = useState({
    title: '',
    linkedEscalationId: '',
    priority: 'High',
    vendorName: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slaRes, escRes] = await Promise.all([
        fetch(`/api/traceability/tenants/${tenantId}/procurement-slas`, { headers: authHeaders(token) }),
        fetch(`/api/traceability/tenants/${tenantId}/compliance-escalations`, { headers: authHeaders(token) })
      ]);
      const slaJson = await slaRes.json();
      const escJson = await escRes.json();
      if (!slaRes.ok) throw new Error(slaJson.error || 'Failed to load procurement SLAs');
      if (!escRes.ok) throw new Error(escJson.error || 'Failed to load escalations');
      setSlas(slaJson.data?.slas || []);
      setEscalations(escJson.data?.escalations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body || {})
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    await load();
    return json.data;
  }

  async function handleDraft(ev) {
    ev.preventDefault();
    setError(null);
    if (!draftForm.linkedEscalationId) {
      setError('Link an escalation so control obligations can be derived from the client mitigation plan.');
      return;
    }
    try {
      await post(`/api/traceability/tenants/${tenantId}/procurement-slas/draft`, {
        title: draftForm.title || undefined,
        linkedEscalationId: draftForm.linkedEscalationId,
        priority: draftForm.priority,
        mitigationControlCostCoverage: {
          coversAdditionalControls: true,
          coverageBasis: 'non-compliant-asset-exposed-risk',
          coverageModel: 'vendor-accountability',
          pricingApproach: 'not-line-item-priced',
          vendorAccountability: {
            accountableParty: 'vendor',
            vendorName: draftForm.vendorName || undefined,
            obligation: 'Vendor remains accountable for contracted compliance requirements and must initiate controls per the linked mitigation plan when non-compliance is triggered.'
          }
        }
      });
      setDraftForm((f) => ({ ...f, title: '', vendorName: '' }));
    } catch (err) {
      setError(err.message);
    }
  }

  const statusClass = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading compliance mitigation SLAs…</p>;
  }

  return (
    <div className="mt-12 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance mitigation SLAs</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
          Procurement binds vendor accountability for compliance services. When non-compliance is triggered,
          the SLA enables the client mitigation plan — control obligations are tied to escalation actions,
          not line-item dollar amounts. Financial exposure is reported separately via FAIR/ALE/TCO within
          the governance framework boundary.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      )}

      <form onSubmit={handleDraft} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Draft vendor accountability SLA</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-400">Title</span>
            <input
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900"
              value={draftForm.title}
              onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
              placeholder="MFA vendor compliance SLA"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-400">Linked escalation (required)</span>
            <select
              required
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900"
              value={draftForm.linkedEscalationId}
              onChange={(e) => setDraftForm({ ...draftForm, linkedEscalationId: e.target.value })}
            >
              <option value="">Select escalation…</option>
              {escalations.map((esc) => (
                <option key={esc.escalationId} value={esc.escalationId}>
                  {esc.escalationId} · {esc.priority} · {esc.status}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-400">Priority / SLA tier</span>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900"
              value={draftForm.priority}
              onChange={(e) => setDraftForm({ ...draftForm, priority: e.target.value })}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-400">Accountable vendor</span>
            <input
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900"
              value={draftForm.vendorName}
              onChange={(e) => setDraftForm({ ...draftForm, vendorName: e.target.value })}
              placeholder="Microsoft / Entra ID"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Control obligations are auto-derived from the escalation mitigation plan. No dollar amount is required
          for control placement — executive reporting uses FAIR/ALE exposure instead.
        </p>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Draft SLA with vendor control obligations
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obligations</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {slas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-gray-500">No procurement SLAs drafted yet.</td>
              </tr>
            )}
            {slas.map((sla) => {
              const coverage = sla.mitigationControlCostCoverage || {};
              const obligationCount = (coverage.controlObligations || []).length;
              return (
                <tr key={sla.slaId}>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">{sla.title}</p>
                    <p className="text-xs text-gray-500 font-mono">{sla.slaId}</p>
                    <p className="text-xs text-indigo-600 mt-1">{coverage.coverageModel || 'vendor-accountability'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass(sla.status)}`}>
                      {sla.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {obligationCount} control obligation(s)
                    <span className="block text-xs text-gray-500">
                      {coverage.pricingApproach?.replace(/-/g, ' ') || 'not line item priced'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    {sla.status === 'draft' && (
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => post(`/api/traceability/tenants/${tenantId}/procurement-slas/${sla.slaId}/approve`)}
                      >
                        Approve
                      </button>
                    )}
                    {(sla.status === 'draft' || sla.status === 'approved') && sla.linkedEscalationId && (
                      <button
                        type="button"
                        className="text-emerald-600 hover:underline"
                        onClick={() => post(
                          `/api/traceability/tenants/${tenantId}/procurement-slas/${sla.slaId}/activate`,
                          { escalationId: sla.linkedEscalationId }
                        )}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
