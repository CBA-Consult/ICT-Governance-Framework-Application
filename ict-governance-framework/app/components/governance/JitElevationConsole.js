'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch, getStoredAccessToken, parseApiError } from '../../lib/authFetch';
import { requestJitElevation } from '../../lib/handleDrillStateTransition';

function formatTs(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function JitElevationConsole() {
  const [justification, setJustification] = useState('');
  const [scopeTenant, setScopeTenant] = useState('tenant-01');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actions, setActions] = useState([]);
  const [elevationResult, setElevationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/auth/jit/ledger?category=jit&limit=50');
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

  const loadTicketDetail = async (ticketId) => {
    try {
      const res = await authFetch(`/api/auth/jit/ledger/${encodeURIComponent(ticketId)}/actions`);
      if (!res.ok) throw new Error(await parseApiError(res));
      const data = await res.json();
      setSelectedTicket(data.ticket);
      setActions(data.actions || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleElevate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setElevationResult(null);
    try {
      const token = getStoredAccessToken();
      await requestJitElevation({ justification, scopeTenant, token });
      setElevationResult({
        note: 'JIT elevation ticket created. Pass the returned token in the X-JIT-Context header on privileged API routes.'
      });
      await loadTickets();
      setJustification('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">JIT Elevation Console</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Time-bounded privileged access for standard governance mutations — separate from Break Glass emergency procedures.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleElevate} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Request JIT Elevation</h2>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Justification</label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
            placeholder="Describe the privileged change and regulatory basis (min. 10 characters)…"
            required
            minLength={10}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Scope tenant</label>
          <input
            value={scopeTenant}
            onChange={(e) => setScopeTenant(e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Creating elevation…' : 'Create JIT elevation ticket'}
        </button>
        {elevationResult && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{elevationResult.note}</p>
        )}
      </form>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">JIT Ledger Tickets</h2>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No standard JIT elevation tickets recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {tickets.map((t) => (
                <li key={t.ticket_id}>
                  <button
                    type="button"
                    onClick={() => loadTicketDetail(t.ticket_id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <div className="font-mono text-xs text-gray-900 dark:text-white">{t.ticket_id}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {t.status?.replace(/_/g, ' ')} · until {formatTs(t.valid_until)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Ticket Detail &amp; Privileged Actions</h2>
          {!selectedTicket ? (
            <p className="text-sm text-gray-500">Select a ticket to view ledger metadata and privileged action log entries.</p>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="font-mono text-gray-900 dark:text-white">{selectedTicket.ticket_id}</div>
              <p className="text-gray-600 dark:text-gray-400">{selectedTicket.justification}</p>
              <p><span className="text-gray-500">Status:</span> {selectedTicket.status}</p>
              <p><span className="text-gray-500">Scope:</span> {selectedTicket.scope_tenant}</p>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Privileged actions ({actions.length})
                </p>
                {actions.length === 0 ? (
                  <p className="text-gray-500">No actions logged for this ticket yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto font-mono text-[10px]">
                    {actions.map((a) => (
                      <li key={a.id} className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        {a.http_method} {a.endpoint}
                        <br />
                        <span className="text-gray-500">{formatTs(a.timestamp)} · {a.action}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
