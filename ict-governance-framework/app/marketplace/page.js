'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GovernanceStateBadge from '../components/governance/GovernanceStateBadge';

function formatLoadError(err) {
  const message = err.response?.data?.error || err.message || 'Failed to load marketplace';
  if (err.response?.status === 403) {
    return `${message} — your account needs governance.read or app.procurement permission.`;
  }
  if (err.response?.status === 404 || /Cannot GET \/api\//i.test(String(err.response?.data || ''))) {
    return 'API route not found — the Express API on port 4000 is stale or not running. Stop it and run npm run dev.';
  }
  if (!err.response) {
    return 'API server unavailable — run npm run dev (starts API + Next) or npm run server in a separate terminal.';
  }
  return message;
}

export default function MarketplacePage() {
  const { isAuthenticated, isLoading: authLoading, apiClient } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const [vRes, oRes] = await Promise.all([
      apiClient.get('/vendors'),
      apiClient.get('/marketplace/offerings')
    ]);
    setVendors(vRes.data?.data?.vendors || []);
    setOfferings(oRes.data?.data?.offerings || []);
  }, [apiClient]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      window.location.href = '/auth?redirect=/marketplace';
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (err) {
        setError(formatLoadError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, isAuthenticated, load]);

  const retry = async () => {
    setError(null);
    setLoading(true);
    try {
      await load();
    } catch (err) {
      setError(formatLoadError(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-slate-600 dark:text-slate-300">Loading marketplace…</div>;
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl">
        <p className="text-rose-600 font-semibold">{error}</p>
        <p className="text-sm text-slate-500 mt-2">
          Run <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">npm run dev</code> to start both the API (port 4000) and Next.js (port 3000).
          Marketplace access requires <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">app.procurement</code> or <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">governance.read</code> permission.
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <header className="border-b border-slate-200 dark:border-slate-700 pb-5">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Marketplace</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
          Vendor-backed offerings linked to procurement-approved vendor identities. Draft offerings cannot be published until the vendor is active.
        </p>
      </header>

      <section className="space-y-4">
        {vendors.map((v) => {
          const vOfferings = offerings.filter((o) => o.vendorId === v.vendorId);
          return (
            <div key={v.vendorId} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{v.displayName}</h2>
                  <p className="text-xs text-slate-500 mt-1">{v.vendorId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Vendor</span>
                  <GovernanceStateBadge state={v.status} size="md" />
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offerings</p>
                {vOfferings.length === 0 ? (
                  <p className="text-sm text-slate-500 mt-2">No offerings registered.</p>
                ) : (
                  <ul className="mt-3 grid md:grid-cols-2 gap-3">
                    {vOfferings.map((o) => (
                      <li key={o.offeringId} className="rounded-md border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{o.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{o.offeringId}</p>
                          </div>
                          <GovernanceStateBadge
                            state={o.status === 'published' ? 'verified' : 'partial'}
                            label={o.status}
                          />
                        </div>
                        <p className="mt-3 text-xs text-slate-500 capitalize">Category: {o.category}</p>
                        {(o.governanceMapping?.supportedControls || []).length > 0 && (
                          <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-300">
                            Controls: {(o.governanceMapping.supportedControls || []).join(', ')}
                          </p>
                        )}
                        {v.status !== 'active' && o.status !== 'published' && (
                          <p className="mt-2 text-xs text-amber-600">
                            Publish blocked — vendor onboarding incomplete.
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
