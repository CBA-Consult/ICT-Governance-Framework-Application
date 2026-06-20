'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { CoEPageShell } from '../../components/coe/CoEProgramNav';
import { coeFetch } from '../../components/coe/CoEShared';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function CoEOverviewPage() {
  const { hasPermission } = useAuth();
  const [program, setProgram] = useState(null);
  const [scope, setScope] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (hasPermission('governance.read')) {
      coeFetch('/api/coe/program').then(setProgram).catch(console.error);
      coeFetch('/api/coe/scope').then(setScope).catch(console.error);
    }
  }, [hasPermission]);

  if (!hasPermission('governance.read')) {
    return <div className="p-8 text-red-600">governance.read required.</div>;
  }

  return (
    <CoEPageShell
      title="Overview"
      description={program?.description || 'Define goals and expected outcomes of your CoE and get started.'}
    >
      <div className="flex gap-2 mb-6">
        {['overview', 'download'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t === 'overview' ? 'Overview' : 'Download'}
          </button>
        ))}
      </div>

      {tab === 'overview' && program && (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Goals &amp; expected outcomes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {program.goals.map((g) => (
                <div key={g.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                  <h3 className="font-medium text-gray-900 dark:text-white">{g.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{g.outcome}</p>
                </div>
              ))}
            </div>
          </section>

          {program.adoptionSnapshot && (
            <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Templates" value={program.adoptionSnapshot.templates?.total} />
              <MetricCard label="AI providers" value={program.adoptionSnapshot.aiProviders?.total} />
              <MetricCard label="Tenants" value={program.adoptionSnapshot.tenants?.total} />
              <MetricCard label="Documents" value={program.adoptionSnapshot.documents?.total} />
            </section>
          )}

          {scope && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Full ICT governance scope</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Beyond in-repo ADPA and the web app: Power Platform apps (each app = one software artifact),
                plus Azure, AWS, and GCP infrastructure under the seven-pillar model.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {scope.scopeModel.scopeLayers.map((layer) => (
                  <div key={layer.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                    <p className="font-medium text-sm">{layer.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{layer.description?.slice(0, 120)}…</p>
                    {scope.inventory.assetsByScopeLayer[layer.id] != null && (
                      <p className="text-xs text-blue-600 mt-2">
                        {scope.inventory.assetsByScopeLayer[layer.id]} governed asset(s)
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Rule: each Power App / flow = <code className="bg-gray-100 px-1 rounded">software-power-platform-app</code> artifact
                in the Software pillar · Artifacts CoE · template <code className="bg-gray-100 px-1 rounded">power-platform-application</code>
              </p>
            </section>
          )}

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Get started</h2>
            <ol className="space-y-3">
              {program.getStartedSteps.map((s) => (
                <li key={s.step} className="flex gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                    {s.step}
                  </span>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    {s.command && <code className="text-xs text-gray-500 block mt-1">{s.command}</code>}
                    {s.action && <p className="text-sm text-gray-600 mt-1">{s.action}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link href="/coe/templates" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Template lifecycle →
            </Link>
            <Link href="/coe/admin" className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              Admin → Set up
            </Link>
          </div>
        </>
      )}

      {tab === 'download' && program && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Download</h2>
          <p className="text-sm text-gray-600 mb-4">
            Starter kit assets and sample governance documentation from the repository.
          </p>
          <ul className="space-y-3">
            {program.downloads.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs font-mono text-gray-500">{d.path}</p>
                </div>
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  {d.type}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-4">
            Files are stored in the repository. Use Git clone or your IDE to access paths listed above.
          </p>
        </section>
      )}
    </CoEPageShell>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="p-4 border rounded-lg text-center">
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
