'use client';

import { useCallback, useEffect, useState } from 'react';
import AssetRegister from '../components/governance/AssetRegister';
import { mapApiAssetToRegisterRow } from '../lib/handleDrillStateTransition';

export default function AssetRegisterPage() {
  const [assets, setAssets] = useState([]);
  const [automationMetric, setAutomationMetric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAssets = useCallback(async () => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const assetsRes = await fetch('/api/assets', { headers });
    if (!assetsRes.ok) {
      const body = await assetsRes.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to load asset register');
    }

    const assetsPayload = await assetsRes.json();
    const transformedAssets = (assetsPayload.assets || []).map((asset) => mapApiAssetToRegisterRow(asset));
    setAssets(transformedAssets);
    return assetsPayload;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    Promise.all([
      loadAssets(),
      fetch('/api/governance/measurement-plan/KPI-GOV-AUTOMATION-TARGET', { headers })
    ])
      .then(async ([, metricRes]) => {
        if (metricRes.ok) {
          const metricPayload = await metricRes.json();
          setAutomationMetric(metricPayload.metric);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadAssets]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Loading live asset register from governance API…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <AssetRegister
      initialAssets={assets}
      automationMetric={automationMetric}
      onAssetsRefresh={loadAssets}
    />
  );
}
