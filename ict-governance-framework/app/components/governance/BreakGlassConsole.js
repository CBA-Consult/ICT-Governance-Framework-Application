'use client';

import { useCallback, useEffect, useState } from 'react';
import BreakGlassTrend from './BreakGlassTrend';
import { authFetch, getStoredAccessToken, parseApiError } from '../../lib/authFetch';
import { runManualLedgerReconciliation } from '../../lib/handleDrillStateTransition';

function formatTs(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function isReconciled(ticket) {
  if (!ticket) return false;
  return ticket.status === 'Expired' || ticket.status === 'Revoked'
    || (ticket.revoked_reason && ticket.revoked_reason.includes('Manual Audit Sweep Passed'));
}

export default function BreakGlassConsole() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState(null);
  const [error, setError] = useState(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/auth/jit/ledger?category=break_glass&limit=50');
      if (!res.ok) throw new Error(await parseApiError(res));
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const loadTicketDetail = async (ticket) => {
    setSelectedTicket(ticket);
    setAuditFeedback(null);
    try {
      const res = await authFetch(`/api/auth/jit/ledger/${encodeURIComponent(ticket.ticket_id)}/actions`);
      if (!res.ok) throw new Error(await parseApiError(res));
      const data = await res.json();
      setSelectedTicket(data.ticket);
      setActions(data.actions || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReconcile = async () => {
    if (!selectedTicket?.ticket_id) return;
    setReconciling(true);
    setError(null);
    setAuditFeedback(null);
    try {
      const token = getStoredAccessToken();
      const result = await runManualLedgerReconciliation(selectedTicket.ticket_id, token, {
        scopeTenant: selectedTicket.scope_tenant || 'tenant-01',
        justification: `Compliance-owner manual audit sweep for break glass ticket ${selectedTicket.ticket_id}`
      });
      setAuditFeedback(result);
      await loadTickets();
      await loadTicketDetail({ ticket_id: selectedTicket.ticket_id });
    } catch (err) {
      setError(err.message);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Break Glass Emergency Console</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Out-of-band emergency privileged access when identity infrastructure is degraded. Managed independently from the asset register.
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
          Emergency activation uses the out-of-band API (<code className="font-mono">POST /api/auth/jit/emergency/activate</code>) with your configured system secret — not exposed in this UI.
        </p>
      </header>

      <BreakGlassTrend />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Emergency Ledger Tickets</h2>
            <button type="button" onClick={loadTickets} className="text-xs text-indigo-600 font-semibold">Refresh</button>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No Break Glass emergency tickets in the ledger.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[28rem] overflow-y-auto">
              {tickets.map((t) => (
                <li key={t.ticket_id}>
                  <button
                    type="button"
                    onClick={() => loadTicketDetail(t)}
                    className={`w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/10 ${
                      selectedTicket?.ticket_id === t.ticket_id ? 'bg-rose-50 dark:bg-rose-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-900 dark:text-white">{t.ticket_id}</span>
                      {t.status === 'Break_Glass_Active' && (
                        <span className="text-[10px] font-bold text-red-600 animate-pulse">ACTIVE</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {t.status?.replace(/_/g, ' ')} · {formatTs(t.valid_from)} → {formatTs(t.valid_until)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-900 rounded-xl p-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Emergency Ticket Audit &amp; Reconciliation</h2>
          {!selectedTicket ? (
            <p className="text-sm text-gray-500">Select an emergency ticket to review privileged actions and run a manual cryptographic sweep.</p>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="font-mono text-gray-900 dark:text-white">{selectedTicket.ticket_id}</div>
              <p className="text-gray-600 dark:text-gray-400">{selectedTicket.justification}</p>
              <p><span className="text-gray-500">Requestor:</span> {selectedTicket.requestor_id}</p>
              <p><span className="text-gray-500">Status:</span> {selectedTicket.status?.replace(/_/g, ' ')}</p>
              <p><span className="text-gray-500">Scope:</span> {selectedTicket.scope_tenant}</p>
              {selectedTicket.revoked_reason && (
                <p><span className="text-gray-500">Closeout:</span> {selectedTicket.revoked_reason}</p>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="font-semibold mb-2">Privileged actions ({actions.length})</p>
                {actions.length === 0 ? (
                  <p className="text-gray-500">No privileged mutations logged under this emergency ticket.</p>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto font-mono text-[10px]">
                    {actions.map((a) => (
                      <li key={a.id} className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        {a.http_method} {a.endpoint}
                        <br />
                        <span className="text-gray-500">
                          {formatTs(a.timestamp)} · hash {String(a.payload_hash).slice(0, 12)}…
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={handleReconcile}
                disabled={reconciling || isReconciled(selectedTicket)}
                className={`w-full mt-2 py-2 px-3 text-xs rounded-lg font-bold border ${
                  isReconciled(selectedTicket)
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white border-red-700'
                }`}
              >
                {reconciling
                  ? 'Running Cryptographic Verification…'
                  : isReconciled(selectedTicket)
                    ? '✓ Ledger Reconciled & Closed'
                    : 'Force Cryptographic Audit Sweep'}
              </button>

              {auditFeedback && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded text-[10px] font-mono">
                  Verified {auditFeedback.verifiedActionsCount} action(s)
                  {auditFeedback.verificationDigest && (
                    <span className="block mt-1 text-gray-600 break-all">
                      Digest: {auditFeedback.verificationDigest.slice(0, 32)}…
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
