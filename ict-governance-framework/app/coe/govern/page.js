'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { CoEPageShell } from '../../components/coe/CoEProgramNav';
import { coeFetch, PhaseBadge } from '../../components/coe/CoEShared';

const PHASES = [
  { id: 'setup', name: 'Set up' },
  { id: 'use', name: 'Use' },
  { id: 'deep-dive', name: 'Deep dive' }
];

export default function CoEGovernPage() {
  const { hasPermission } = useAuth();
  const [phase, setPhase] = useState('setup');
  const [centers, setCenters] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!hasPermission('governance.read')) return;
    coeFetch('/api/coe/centers').then(setCenters);
    Promise.all(
      ['templates', 'ai-providers', 'artifacts', 'documents'].map((id) =>
        coeFetch(`/api/coe/centers/${id}/items`).catch(() => [])
      )
    ).then((results) => setItems(results.flat()));
  }, [hasPermission]);

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read required.</div>;
  }

  return (
    <CoEPageShell
      title="Govern"
      description="Establish required audit and compliance processes with immutable trails and rollback."
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {PHASES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              phase === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {phase === 'setup' && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Each lifecycle item requires onboarding before activation: business justification, owner assignment,
            checklist completion, and CoE approval.
          </p>
          {centers.map((c) => (
            <div key={c.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{c.name}</h3>
              <ul className="mt-2 space-y-1">
                {c.onboardingChecklist.map((step) => (
                  <li key={step.id} className="text-sm text-gray-600">
                    {step.required ? '●' : '○'} {step.label}
                  </li>
                ))}
              </ul>
              <Link href={`/coe/${c.id}`} className="text-blue-600 text-sm mt-2 inline-block hover:underline">
                Open center →
              </Link>
            </div>
          ))}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
            <strong>RPAS binding:</strong> CSR-42 v2.3.0 — certify changes via{' '}
            <code className="text-xs">npm run governance:validate</code>
          </div>
        </div>
      )}

      {phase === 'use' && (
        <div>
          <h2 className="font-semibold mb-4">Active lifecycle registry</h2>
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No CoE items yet. Go to Admin → Set up → Sync, then Admin → Deep dive to initiate items.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.item_id}
                  href={`/coe/${item.center_type}/items/${item.item_id}`}
                  className="flex justify-between items-center p-3 border rounded-lg hover:border-blue-500"
                >
                  <div>
                    <p className="font-medium text-sm">{item.display_name}</p>
                    <p className="text-xs text-gray-500">{item.center_type} · v{item.current_version}</p>
                  </div>
                  <PhaseBadge phase={item.lifecycle_phase} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'deep-dive' && (
        <div className="space-y-4">
          <div className="p-5 border rounded-xl">
            <h3 className="font-semibold">Immutable audit trail</h3>
            <p className="text-sm text-gray-600 mt-2">
              All lifecycle events are written to <code className="text-xs">coe_audit_log</code> with SHA-256 checksums.
              Database triggers prevent UPDATE or DELETE — supporting full traceability for auditors.
            </p>
          </div>
          <div className="p-5 border rounded-xl">
            <h3 className="font-semibold">Version rollback</h3>
            <p className="text-sm text-gray-600 mt-2">
              Each transition creates a version snapshot in <code className="text-xs">coe_item_versions</code>.
              Open any item → Version history → Rollback to restore a prior lifecycle state.
            </p>
          </div>
          <div className="p-5 border rounded-xl">
            <h3 className="font-semibold">Compliance mapping</h3>
            <p className="text-sm text-gray-600 mt-2">
              Seven-pillar templates map to NIST CSF 2.0 controls. Tenant governance DOCX packs document
              requirement-to-infrastructure traceability per pillar.
            </p>
            <Link href="/compliance-dashboard" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Open compliance dashboard →
            </Link>
          </div>
        </div>
      )}
    </CoEPageShell>
  );
}
