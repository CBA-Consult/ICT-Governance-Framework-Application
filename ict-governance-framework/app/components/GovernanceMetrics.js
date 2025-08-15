'use client';

export default function GovernanceMetrics({ governanceMetrics }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Governance Metrics
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Policy Compliance</span>
            <span className="text-sm text-green-600 font-semibold">{governanceMetrics.policyCompliance}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Security Score</span>
            <span className="text-sm text-green-600 font-semibold">{governanceMetrics.securityScore}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Cost Optimization</span>
            <span className="text-sm text-yellow-600 font-semibold">{governanceMetrics.costOptimization}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
