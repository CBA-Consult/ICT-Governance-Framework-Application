'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  CENTER_ICONS,
  coeFetch,
  PhaseBadge,
  CoEBreadcrumb,
  SyncButton
} from '../../components/coe/CoEShared';

export default function CoECenterPage() {
  const { centerId } = useParams();
  const { hasPermission } = useAuth();
  const [center, setCenter] = useState(null);
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, i, inv] = await Promise.all([
        coeFetch(`/api/coe/centers/${centerId}`),
        coeFetch(`/api/coe/centers/${centerId}/items`),
        coeFetch(`/api/coe/centers/${centerId}/inventory`)
      ]);
      setCenter(c);
      setItems(i);
      setInventory(inv);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('governance.read') && centerId) load();
  }, [hasPermission, centerId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await coeFetch('/api/coe/sync', { method: 'POST' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleInitiate = async (entry) => {
    try {
      const payload = {
        externalRef: entry.id || entry.tenantId || entry.templateId || `${centerId}-${Date.now()}`,
        displayName: entry.displayName || entry.id || entry.name || entry.tenantId,
        description: entry.description || entry.kind || '',
        tenantId: entry.tenantId || null,
        metadata: entry
      };
      await coeFetch(`/api/coe/centers/${centerId}/items`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read permission required.</div>;
  }

  const Icon = CENTER_ICONS[centerId];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <CoEBreadcrumb center={center} />

      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div className="flex items-center gap-4">
          {Icon && <Icon className="h-10 w-10 text-blue-600" />}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{center?.name || centerId}</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{center?.description}</p>
          </div>
        </div>
        <SyncButton onSync={handleSync} syncing={syncing} />
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KpiCard label="CoE items" value={items.length} />
        <KpiCard label="ADPA inventory" value={inventory.length} />
        <KpiCard label="Active" value={items.filter((i) => i.lifecycle_phase === 'active').length} />
        <KpiCard label="In onboarding" value={items.filter((i) => i.lifecycle_phase === 'onboarding').length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Lifecycle registry</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">
              No CoE items yet. Sync from ADPA inventory or initiate from the panel on the right.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.item_id}
                  href={`/coe/${centerId}/items/${item.item_id}`}
                  className="block p-4 bg-white dark:bg-gray-800 border rounded-lg hover:border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.display_name}</p>
                      <p className="text-xs font-mono text-gray-500">{item.external_ref}</p>
                    </div>
                    <PhaseBadge phase={item.lifecycle_phase} />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>v{item.current_version}</span>
                    <span>Onboarding {item.onboardingPercent}%</span>
                    <span>{item.owner_count} owner(s)</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">ADPA inventory — initiate</h2>
          <div className="bg-white dark:bg-gray-800 border rounded-lg max-h-96 overflow-y-auto">
            {inventory.slice(0, 20).map((entry, idx) => (
              <div key={idx} className="p-3 border-b flex justify-between items-center text-sm">
                <span className="truncate mr-2">{entry.id || entry.displayName || entry.tenantId}</span>
                <button
                  onClick={() => handleInitiate(entry)}
                  className="text-blue-600 hover:underline shrink-0 text-xs"
                >
                  Initiate
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <p className="font-semibold mb-2">CoE capabilities</p>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              {(center?.onboardingChecklist || []).slice(0, 3).map((s) => (
                <li key={s.id}>✓ {s.label}</li>
              ))}
              <li>✓ {(center?.trainingModules || []).length} training modules</li>
              <li>✓ Immutable audit trail</li>
              <li>✓ Rollback to prior version</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
