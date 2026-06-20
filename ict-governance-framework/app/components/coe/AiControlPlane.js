'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PhaseBadge } from './CoEShared';

export function OutputTypeBadge({ outputType, label }) {
  const colors = {
    json: 'bg-indigo-100 text-indigo-800',
    'document-md': 'bg-sky-100 text-sky-800',
    'document-docx': 'bg-sky-100 text-sky-800',
    bicep: 'bg-cyan-100 text-cyan-800',
    terraform: 'bg-teal-100 text-teal-800',
    'azure-policy': 'bg-violet-100 text-violet-800',
    'aws-config': 'bg-orange-100 text-orange-800',
    'ui-spec': 'bg-pink-100 text-pink-800',
    'compliance-policy': 'bg-amber-100 text-amber-800'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[outputType] || 'bg-gray-100 text-gray-700'}`}>
      {label || outputType}
    </span>
  );
}

export function ProviderTypeBadge({ type }) {
  const colors = {
    azure: 'bg-blue-100 text-blue-800',
    google: 'bg-green-100 text-green-800',
    ollama: 'bg-gray-100 text-gray-700',
    openai: 'bg-emerald-100 text-emerald-800',
    anthropic: 'bg-purple-100 text-purple-800'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-100'}`}>
      {type}
    </span>
  );
}

export function RegisterProviderModal({ open, onClose, onSubmit, busy, providerTypes }) {
  const [form, setForm] = useState({
    displayName: '',
    type: 'azure',
    endpoint: '',
    apiVersion: '',
    useEntraId: true
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Register AI Provider</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display name</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-600"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Provider type</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-600"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {(providerTypes || []).map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Endpoint URL</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-600"
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useEntraId"
              checked={form.useEntraId}
              onChange={(e) => setForm({ ...form, useEntraId: e.target.checked })}
            />
            <label htmlFor="useEntraId" className="text-sm">Use Entra ID authentication</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RegisterModelModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({
    modelId: '',
    displayName: '',
    deploymentName: '',
    lifecyclePhase: 'onboarding',
    changeSummary: ''
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Register Model Version</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Model ID</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-600"
              value={form.modelId}
              onChange={(e) => setForm({ ...form, modelId: e.target.value })}
              placeholder="gpt-4.1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display name</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-600"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deployment name (Foundry / Azure)</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-600"
              value={form.deploymentName}
              onChange={(e) => setForm({ ...form, deploymentName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Change summary</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-600"
              rows={2}
              value={form.changeSummary}
              onChange={(e) => setForm({ ...form, changeSummary: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Saving...' : 'Register version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssignmentTable({ assignments, outputTypes, onToggle, onResolve, busyId }) {
  const outputLabel = (id) => outputTypes?.find((t) => t.id === id)?.label || id;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500">
            <th className="py-2 pr-4">Template</th>
            <th className="py-2 pr-4">Output</th>
            <th className="py-2 pr-4">Provider / Model</th>
            <th className="py-2 pr-4">Phase</th>
            <th className="py-2 pr-4">Priority</th>
            <th className="py-2 pr-4">Enabled</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.assignmentId} className="border-b border-gray-100 dark:border-gray-700/50">
              <td className="py-3 pr-4">
                <Link href={`/coe/templates/${a.templateId}`} className="text-blue-600 hover:underline font-medium">
                  {a.templateId}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <OutputTypeBadge outputType={a.outputType} label={outputLabel(a.outputType)} />
                {a.cloudProvider && (
                  <span className="ml-1 text-xs text-gray-400">({a.cloudProvider})</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <Link href={`/coe/ai-providers/${a.providerId}`} className="text-blue-600 hover:underline">
                  {a.providerId}
                </Link>
                <div className="text-xs text-gray-500">{a.modelId}</div>
              </td>
              <td className="py-3 pr-4"><PhaseBadge phase={a.lifecyclePhase} /></td>
              <td className="py-3 pr-4">{a.priority}</td>
              <td className="py-3 pr-4">
                <button
                  onClick={() => onToggle(a)}
                  className={`px-2 py-0.5 rounded text-xs ${a.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                >
                  {a.enabled ? 'Yes' : 'No'}
                </button>
              </td>
              <td className="py-3">
                <button
                  onClick={() => onResolve(a)}
                  disabled={busyId === a.assignmentId}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  {busyId === a.assignmentId ? 'Resolving...' : 'Test route'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!assignments.length && (
        <p className="text-gray-500 text-sm py-6 text-center">No assignments yet. Sync from processor config to seed routes.</p>
      )}
    </div>
  );
}

export function ProviderCard({ provider }) {
  return (
    <Link
      href={`/coe/ai-providers/${provider.providerId}`}
      className="block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{provider.displayName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{provider.providerId}</p>
        </div>
        <ProviderTypeBadge type={provider.type} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <PhaseBadge phase={provider.lifecyclePhase} />
        {provider.isActiveProcessor && (
          <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">Active processor</span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {provider.models?.length || 0} model(s) · {provider.endpoint || 'No endpoint'}
      </p>
    </Link>
  );
}

export function ModelVersionTimeline({ models }) {
  if (!models?.length) {
    return <p className="text-sm text-gray-500">No models registered.</p>;
  }

  return (
    <div className="space-y-4">
      {models.map((model) => (
        <div key={model.modelId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-medium">{model.displayName || model.modelId}</h4>
              <p className="text-xs text-gray-500">{model.modelId}</p>
            </div>
            <div className="flex items-center gap-2">
              <PhaseBadge phase={model.lifecyclePhase} />
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">v{model.currentVersion}</span>
            </div>
          </div>
          {model.deploymentName && (
            <p className="text-xs text-gray-500 mt-2">Deployment: {model.deploymentName}</p>
          )}
          {model.versions?.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-gray-100 dark:border-gray-700 pt-2">
              {[...model.versions].reverse().slice(0, 5).map((v) => (
                <li key={v.version} className="text-xs text-gray-600 dark:text-gray-400">
                  v{v.version} — {v.changeSummary || 'Registered'} ({new Date(v.registeredAt).toLocaleDateString()})
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function RoutePreviewPanel({ route, onClose }) {
  if (!route) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Generation Route</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
        </div>
        <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
          {JSON.stringify(route, null, 2)}
        </pre>
      </div>
    </div>
  );
}
