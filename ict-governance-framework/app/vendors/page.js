'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GovernanceStateBadge from '../components/governance/GovernanceStateBadge';

function percentLabel(p) {
  if (p == null) return '—';
  return `${p}%`;
}

export default function VendorRegistryPage() {
  const { isAuthenticated, isLoading: authLoading, hasPermission, apiClient } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newVendor, setNewVendor] = useState({ displayName: '', website: '', email: '' });
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.vendorId === selectedVendorId) || null,
    [vendors, selectedVendorId]
  );

  const canManage = hasPermission('app.procurement');

  const load = useCallback(async () => {
    const res = await apiClient.get('/vendors');
    const list = res.data?.data?.vendors || [];
    setVendors(list);
    setSelectedVendorId((current) => current || list[0]?.vendorId || null);
  }, [apiClient]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      window.location.href = '/auth?redirect=/vendors';
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (err) {
        const message = err.response?.data?.error || err.message || 'Failed to load vendors';
        if (err.response?.status === 403) {
          setError(`${message} — your account needs governance.read or app.procurement permission.`);
        } else if (err.response?.status === 404 || /Cannot GET \/api\//i.test(String(err.response?.data || ''))) {
          setError('API route not found — the Express API on port 4000 is stale or not running. Stop it and run npm run dev.');
        } else if (!err.response) {
          setError('API server unavailable — run npm run dev (starts API + Next) or npm run server in a separate terminal.');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, isAuthenticated, load]);

  const createVendor = async () => {
    if (!canManage) return;
    setCreating(true);
    setError(null);
    try {
      const res = await apiClient.post('/vendors', {
        displayName: newVendor.displayName,
        website: newVendor.website || null,
        contact: { email: newVendor.email || null }
      });
      if (!res.data?.success) throw new Error('Failed to create vendor');
      setNewVendor({ displayName: '', website: '', email: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setCreating(false);
    }
  };

  const completeStep = async (vendorId, stepId) => {
    if (!canManage) return;
    setError(null);
    try {
      await apiClient.post(`/vendors/${encodeURIComponent(vendorId)}/onboarding/complete`, { stepId });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-slate-600">Loading vendor registry…</div>;
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl">
        <p className="text-rose-600 font-semibold">{error}</p>
        <p className="text-sm text-slate-500 mt-2">
          Run <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">npm run dev</code> to start both the API (port 4000) and Next.js (port 3000).
          Vendor management requires <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">app.procurement</code> permission.
        </p>
        <button
          type="button"
          onClick={async () => {
            setError(null);
            setLoading(true);
            try {
              await load();
            } catch (err) {
              setError(err.response?.data?.error || err.message || 'Failed to load vendors');
            } finally {
              setLoading(false);
            }
          }}
          className="mt-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="border-b border-slate-200 dark:border-slate-700 pb-5">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          Vendor registry
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
          Procurement onboarding for marketplace vendors. Offerings should reference registered vendors so responsibility,
          evidence expectations, and SLAs can be enforced consistently.
        </p>
      </header>

      {canManage && (
        <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white">Register a vendor</h2>
          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <input
              value={newVendor.displayName}
              onChange={(e) => setNewVendor((v) => ({ ...v, displayName: e.target.value }))}
              placeholder="Vendor name"
              className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              value={newVendor.website}
              onChange={(e) => setNewVendor((v) => ({ ...v, website: e.target.value }))}
              placeholder="Website (optional)"
              className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              value={newVendor.email}
              onChange={(e) => setNewVendor((v) => ({ ...v, email: e.target.value }))}
              placeholder="Security contact email (optional)"
              className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={creating || !newVendor.displayName.trim()}
            onClick={createVendor}
            className="mt-4 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2"
          >
            {creating ? 'Registering…' : 'Register vendor'}
          </button>
        </section>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <aside className="lg:col-span-2 space-y-2">
          {vendors.map((v) => (
            <button
              key={v.vendorId}
              type="button"
              onClick={() => setSelectedVendorId(v.vendorId)}
              className={`w-full text-left rounded-lg border p-4 transition ${
                selectedVendorId === v.vendorId
                  ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className="font-semibold text-slate-900 dark:text-white">{v.displayName}</p>
                <GovernanceStateBadge state={v.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{v.vendorId}</p>
              <p className="text-xs text-slate-500 mt-2">
                Onboarding: {percentLabel(v.onboardingProgress?.percent)}
              </p>
            </button>
          ))}
        </aside>

        <main className="lg:col-span-3">
          {!selectedVendor ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500">
              Select a vendor to view onboarding status.
            </div>
          ) : (
            <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedVendor.displayName}</h2>
                  <p className="text-sm text-slate-500">{selectedVendor.website || 'Website not provided'}</p>
                  {selectedVendor.contact?.email && (
                    <p className="text-xs text-slate-500 mt-1">Security contact: {selectedVendor.contact.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Status</span>
                  <GovernanceStateBadge state={selectedVendor.status} size="md" />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-5">
                <h3 className="font-semibold text-slate-900 dark:text-white">Vendor onboarding checklist</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Procurement completes required steps before offerings can be treated as governed and eligible for catalog approval.
                </p>
                <ul className="mt-4 space-y-2">
                  {(selectedVendor.onboarding?.checklist || []).map((s) => {
                    const done = (selectedVendor.onboarding?.completedStepIds || []).includes(s.stepId);
                    return (
                      <li key={s.stepId} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 dark:border-slate-700 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.label}</p>
                          <p className="text-xs text-slate-500">{s.stepId}{s.required ? ' · required' : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {done ? (
                            <span className="text-emerald-700 text-sm font-semibold">Completed</span>
                          ) : (
                            <span className="text-slate-500 text-sm">Pending</span>
                          )}
                          {canManage && !done && (
                            <button
                              type="button"
                              onClick={() => completeStep(selectedVendor.vendorId, s.stepId)}
                              className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5"
                            >
                              Mark complete
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

