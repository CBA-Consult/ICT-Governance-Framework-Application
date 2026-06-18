'use client';

import { useEffect, useMemo, useState } from 'react';
import { mapApiAssetToRegisterRow, promoteAssetValidation } from '../../lib/handleDrillStateTransition';

const DR_FILTERS = ['All', 'Stable', 'DR_Hydrated', 'Stale_Drill', 'Failed_Validation'];
const ORIGIN_FILTERS = ['All', 'Managed', 'Shadow_IT', 'CASB_Discovery'];
const POSTURE_FILTERS = ['All', 'Unverified', 'Under_Review', 'Verified', 'Remediated', 'Rejected'];

function filterButtonClass(active) {
  return active
    ? 'bg-indigo-600 text-white border-indigo-600'
    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
}

function drStatusClass(status) {
  if (status === 'DR_Hydrated') return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (status === 'Stable') return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  if (status === 'Stale_Drill') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
}

function drDotClass(status) {
  if (status === 'DR_Hydrated') return 'bg-green-600';
  if (status === 'Stable') return 'bg-gray-400';
  if (status === 'Stale_Drill') return 'bg-amber-500';
  return 'bg-red-600';
}

function postureClass(posture) {
  if (posture === 'Verified' || posture === 'Remediated') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  }
  if (posture === 'Unverified') {
    return 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
  }
  if (posture === 'Under_Review') {
    return 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  }
  if (posture === 'Rejected') {
    return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  }
  return 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
}

function originClass(origin) {
  if (origin === 'Shadow_IT') {
    return 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  }
  if (origin === 'CASB_Discovery') {
    return 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
}

function environmentClass(environment) {
  if (environment === 'Production') {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  }
  if (environment === 'Shadow IT') {
    return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }
  return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
}

function canPromote(asset) {
  return asset.assetOrigin === 'Shadow_IT'
    && (asset.validationPosture === 'Unverified' || asset.validationPosture === 'Under_Review');
}

export default function AssetRegister({
  initialAssets = [],
  automationMetric = null,
  onAssetsRefresh = null
}) {
  const [drFilter, setDrFilter] = useState('All');
  const [originFilter, setOriginFilter] = useState('All');
  const [postureFilter, setPostureFilter] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [promotingId, setPromotingId] = useState(null);
  const [promoteError, setPromoteError] = useState(null);
  const [assets, setAssets] = useState(initialAssets);

  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchDr = drFilter === 'All' || asset.drStatus === drFilter;
      const matchOrigin = originFilter === 'All' || asset.assetOrigin === originFilter;
      const matchPosture = postureFilter === 'All' || asset.validationPosture === postureFilter;
      return matchDr && matchOrigin && matchPosture;
    });
  }, [assets, drFilter, originFilter, postureFilter]);

  const hydratedCount = useMemo(
    () => assets.filter((a) => a.drStatus === 'DR_Hydrated').length,
    [assets]
  );

  const shadowItCount = useMemo(
    () => assets.filter((a) => a.assetOrigin === 'Shadow_IT').length,
    [assets]
  );

  const unverifiedCount = useMemo(
    () => assets.filter((a) => a.validationPosture === 'Unverified').length,
    [assets]
  );

  const handlePromoteAsset = async (asset) => {
    setPromoteError(null);
    setPromotingId(asset.id);

    try {
      const token = localStorage.getItem('token');
      const result = await promoteAssetValidation(asset.id, token);
      const updated = mapApiAssetToRegisterRow(result.asset);

      setAssets((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setSelectedAsset((prev) => (prev?.id === updated.id ? updated : prev));

      if (onAssetsRefresh) {
        await onAssetsRefresh();
      }
    } catch (err) {
      setPromoteError(err.message);
    } finally {
      setPromotingId(null);
    }
  };

  const openAuditDrawer = (asset) => {
    setSelectedAsset(asset);
  };

  const renderAuditDrawerContent = () => {
    if (!selectedAsset) return null;

    return (
      <>
        <div className="flex justify-between items-start mb-4 gap-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">RPAS Audit Ledger</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{selectedAsset.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate max-w-[240px]" title={selectedAsset.id}>
              {selectedAsset.id}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedAsset(null)}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-semibold px-2 py-1 rounded border border-gray-200 dark:border-gray-600"
          >
            Close
          </button>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Tenant</span>
            <span className="text-gray-900 dark:text-white font-medium">{selectedAsset.tenantName}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Origin / Posture</span>
            <span className="text-gray-900 dark:text-white font-medium block mt-0.5">
              {selectedAsset.assetOrigin.replace(/_/g, ' ')} · {selectedAsset.validationPosture.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Cryptographic / CASB Reference</span>
            <code className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 p-1 rounded font-mono break-all block mt-1">
              {selectedAsset.auditRef}
            </code>
          </div>
          {selectedAsset.casbRiskScore != null && (
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">CASB Risk Score</span>
              <span className="text-gray-900 dark:text-white font-medium">{selectedAsset.casbRiskScore}</span>
            </div>
          )}
          {selectedAsset.casbDiscoveredAt && (
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">CASB Discovered</span>
              <span className="text-gray-900 dark:text-white font-medium block mt-0.5">{selectedAsset.casbDiscoveredAt}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Last Active Drill Check</span>
            <span className="text-gray-900 dark:text-white font-medium block mt-0.5">{selectedAsset.lastDrill}</span>
          </div>
          {selectedAsset.rtoSeconds != null && (
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">Measured RTO</span>
              <span className="text-gray-900 dark:text-white font-medium">{selectedAsset.rtoSeconds}s</span>
            </div>
          )}
          {selectedAsset.rpoFlagTriggered && (
            <p className="text-amber-600 dark:text-amber-400 font-medium">RPO threshold flagged during last drill</p>
          )}
          {canPromote(selectedAsset) && (
            <button
              type="button"
              onClick={() => handlePromoteAsset(selectedAsset)}
              disabled={promotingId === selectedAsset.id}
              className="w-full mt-2 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {promotingId === selectedAsset.id ? 'Promoting…' : 'Promote to Verified'}
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="min-w-0">
        <header className="mb-6 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RPAS Asset Register</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {assets.length} assets · {hydratedCount} DR validated · {shadowItCount} shadow IT · {unverifiedCount} unverified
            </p>
            {automationMetric && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Automation KPI: {Number(automationMetric.current_value).toFixed(1)}% / {automationMetric.target_value}% target
              </p>
            )}
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
              Click any asset row (or <strong>Inspect Audit Trail</strong>) to open the RPAS Audit Ledger drawer.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Gate B DR Status</p>
            <div className="flex flex-wrap gap-2">
              {DR_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setDrFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${filterButtonClass(drFilter === status)}`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Asset Origin (Focus Area 5)</p>
            <div className="flex flex-wrap gap-2">
              {ORIGIN_FILTERS.map((origin) => (
                <button
                  key={origin}
                  type="button"
                  onClick={() => setOriginFilter(origin)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${filterButtonClass(originFilter === origin)}`}
                >
                  {origin.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Validation Posture</p>
            <div className="flex flex-wrap gap-2">
              {POSTURE_FILTERS.map((posture) => (
                <button
                  key={posture}
                  type="button"
                  onClick={() => setPostureFilter(posture)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${filterButtonClass(postureFilter === posture)}`}
                >
                  {posture.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </header>

        {promoteError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-200">
            {promoteError}
          </div>
        )}

        <main className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {filteredAssets.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
              No assets match the selected filters. Run G-B1 sync, G-B3 recovery drill, or CASB ingest to populate the register.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4">Asset Details</th>
                    <th className="p-4">Environment</th>
                    <th className="p-4">Origin</th>
                    <th className="p-4">Validation Posture</th>
                    <th className="p-4">Gate B DR</th>
                    <th className="p-4">Compliance</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  {filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => openAuditDrawer(asset)}
                      className={`cursor-pointer transition-colors ${
                        selectedAsset?.id === asset.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-inset ring-indigo-300 dark:ring-indigo-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{asset.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {asset.type} · {asset.provider}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-xs" title={asset.id}>
                          {asset.id}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${environmentClass(asset.environment)}`}>
                          {asset.environment}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${originClass(asset.assetOrigin)}`}>
                          {asset.assetOrigin.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${postureClass(asset.validationPosture)}`}>
                          {asset.validationPosture.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${drStatusClass(asset.drStatus)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${drDotClass(asset.drStatus)}`} />
                          {asset.drStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-300">{asset.complianceState}</td>
                      <td className="p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openAuditDrawer(asset)}
                          className="block w-full text-left text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20"
                        >
                          Inspect Audit Trail
                        </button>
                        {canPromote(asset) && (
                          <button
                            type="button"
                            onClick={() => handlePromoteAsset(asset)}
                            disabled={promotingId === asset.id}
                            className="block text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold disabled:opacity-50"
                          >
                            {promotingId === asset.id ? 'Promoting…' : 'Confirm Onboarding'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {selectedAsset && (
        <>
          <button
            type="button"
            aria-label="Close audit drawer"
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedAsset(null)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto p-5">
            {renderAuditDrawerContent()}
          </aside>
        </>
      )}
    </div>
  );
}
