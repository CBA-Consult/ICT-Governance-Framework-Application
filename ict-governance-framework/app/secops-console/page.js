'use client';

import SecOpsConsole from '../components/governance/SecOpsConsole';

export default function SecOpsConsolePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <SecOpsConsole />
      </div>
    </div>
  );
}
