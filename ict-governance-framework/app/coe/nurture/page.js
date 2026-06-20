'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { CoEPageShell } from '../../components/coe/CoEProgramNav';
import { coeFetch } from '../../components/coe/CoEShared';

const PHASES = [
  { id: 'setup', name: 'Set up' },
  { id: 'use', name: 'Use' }
];

export default function CoENurturePage() {
  const { hasPermission } = useAuth();
  const [phase, setPhase] = useState('setup');
  const [modules, setModules] = useState([]);
  const [centers, setCenters] = useState([]);

  useEffect(() => {
    if (!hasPermission('governance.read')) return;
    coeFetch('/api/coe/training').then(setModules);
    coeFetch('/api/coe/centers').then(setCenters);
  }, [hasPermission]);

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read required.</div>;
  }

  const byCenter = modules.reduce((acc, m) => {
    if (!acc[m.centerId]) acc[m.centerId] = [];
    acc[m.centerId].push(m);
    return acc;
  }, {});

  return (
    <CoEPageShell
      title="Nurture"
      description="Accelerate adoption by thriving with a community of governance practitioners and makers."
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
            Configure learning paths per lifecycle center. Training completion is tracked on each CoE item
            and gates activation when all required modules are complete.
          </p>
          {Object.entries(byCenter).map(([centerId, mods]) => (
            <div key={centerId} className="border rounded-lg p-4">
              <h3 className="font-medium capitalize">{centerId.replace('-', ' ')}</h3>
              <ul className="mt-3 space-y-2">
                {mods.map((m) => (
                  <li key={m.id} className="flex justify-between text-sm">
                    <span>{m.title}</span>
                    <span className="text-gray-400">{m.durationMinutes} min</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 className="font-medium">Community of makers</h3>
            <p className="text-sm text-gray-600 mt-2">
              Governance practitioners share templates, artifact patterns, and documentation examples.
              Use Feedback and Escalations for CoE improvement requests.
            </p>
            <div className="flex gap-3 mt-3">
              <Link href="/feedback" className="text-blue-600 text-sm hover:underline">Feedback →</Link>
              <Link href="/documents" className="text-blue-600 text-sm hover:underline">Document library →</Link>
            </div>
          </div>
        </div>
      )}

      {phase === 'use' && (
        <div>
          <h2 className="font-semibold mb-4">Complete training on lifecycle items</h2>
          <p className="text-sm text-gray-600 mb-4">
            Open a lifecycle center item, scroll to Learning &amp; development, and mark modules complete.
            Training progress feeds the onboarding checklist automatically.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centers.map((c) => (
              <Link
                key={c.id}
                href={`/coe/${c.id}`}
                className="p-4 border rounded-lg hover:border-blue-500"
              >
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {c.trainingModules.length} training module(s)
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </CoEPageShell>
  );
}
