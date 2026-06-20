'use client';

import { useEffect, useState } from 'react';
import { authFetch, parseApiError } from '../../lib/authFetch';

export default function BreakGlassTrend() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await authFetch('/api/analytics/break-glass/trend');
        if (!response.ok) {
          throw new Error(await parseApiError(response));
        }
        const data = await response.json();
        if (!cancelled) {
          setAnalyticsData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse p-4 mb-6">
        Loading audit metrics stream…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-xs text-amber-800 dark:text-amber-200">
        Break Glass trend unavailable: {error}
      </div>
    );
  }

  const trend = analyticsData?.trend || [];
  const maxCount = Math.max(
    ...trend.map((d) => Number(d.emergency_count || 0) + Number(d.standard_jit_count || 0)),
    1
  );
  const integrityScore = Number(analyticsData?.currentKpiScore ?? 100);
  const scoreWarning = integrityScore < 90;
  const volume = analyticsData?.volumeAssessment;
  const volumeElevated = volume?.level === 'elevated' || volume?.level === 'review_recommended';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm mb-6">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
            Privileged Action Volume &amp; Trend
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {analyticsData?.windowDays || 30}-day timeline reconciliation tracking (Control GV.SC.01)
          </p>
          {(analyticsData?.emergencyTotal > 0 || analyticsData?.standardJitTotal > 0) && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              {analyticsData.emergencyTotal} emergency · {analyticsData.standardJitTotal} standard JIT
              {volume?.expectedEmergencyPer30Days != null && (
                <span className="ml-1">
                  (expected ≤{volume.expectedEmergencyPer30Days} emergency / 30 days in production)
                </span>
              )}
            </p>
          )}
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-gray-400 dark:text-gray-500 block uppercase font-semibold">
            Audit Integrity Score
          </span>
          <span
            className={`text-xl font-extrabold ${
              scoreWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {integrityScore.toFixed(1)}%
          </span>
          {scoreWarning && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium">
              Elevated break glass activity — review open
            </span>
          )}
        </div>
      </header>

      {volumeElevated && volume?.messages?.length > 0 && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-3 text-xs text-rose-900 dark:text-rose-100">
          <p className="font-semibold">Volume above production baseline</p>
          {volume.messages.map((msg) => (
            <p key={msg} className="mt-1 leading-relaxed">{msg}</p>
          ))}
        </div>
      )}

      {volume?.level === 'development_noise' && !volumeElevated && volume?.messages?.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-900 dark:text-amber-100">
          {volume.messages.map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      )}

      {trend.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 py-8 text-center border border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
          No privileged action audit events in the selected window. Integrity baseline holds at 100%.
        </p>
      ) : (
        <div className="flex items-end gap-1 sm:gap-3 h-32 pt-2 border-b border-gray-100 dark:border-gray-700 pb-1 overflow-x-auto">
          {trend.map((bucket) => {
            const emergencyCount = Number(bucket.emergency_count || 0);
            const standardCount = Number(bucket.standard_jit_count || 0);
            const emergencyHeight = (emergencyCount / maxCount) * 100;
            const standardHeight = (standardCount / maxCount) * 100;

            return (
              <div
                key={bucket.date_bucket}
                className="flex-1 min-w-[20px] flex flex-col items-center group relative"
              >
                <div className="absolute -top-12 scale-0 group-hover:scale-100 bg-gray-900 text-white text-[10px] p-2 rounded shadow-md z-10 whitespace-nowrap transition-transform pointer-events-none">
                  <span className="font-bold text-rose-400">Emergency: {emergencyCount}</span>
                  <br />
                  <span className="text-slate-300">Standard JIT: {standardCount}</span>
                  <br />
                  <span className="text-slate-400">{bucket.date_bucket}</span>
                </div>

                <div className="w-full flex flex-col justify-end h-28 gap-0.5">
                  {emergencyCount > 0 && (
                    <div
                      style={{ height: `${Math.max(emergencyHeight, 8)}%` }}
                      className="bg-rose-500 rounded-t w-full transition-all duration-300 group-hover:bg-rose-600 min-h-[2px]"
                      title={`Emergency: ${emergencyCount}`}
                    />
                  )}
                  {standardCount > 0 && (
                    <div
                      style={{ height: `${Math.max(standardHeight, 8)}%` }}
                      className="bg-slate-300 dark:bg-slate-600 w-full transition-all duration-300 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 min-h-[2px]"
                      title={`Standard JIT: ${standardCount}`}
                    />
                  )}
                  {emergencyCount === 0 && standardCount === 0 && (
                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-2 truncate w-full text-center">
                  {bucket.date_bucket.split('-')[2]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <footer className="flex flex-wrap gap-4 mt-4 text-[11px] font-medium text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
          <span>Emergency Break Glass Invocations</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 rounded-sm" />
          <span>Standard Authorized JIT Session Mutations</span>
        </div>
        {analyticsData?.metricCode && (
          <div className="text-gray-400 dark:text-gray-500 font-mono">
            KPI: {analyticsData.metricCode}
          </div>
        )}
      </footer>
    </div>
  );
}
