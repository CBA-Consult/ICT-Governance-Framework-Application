'use client';

const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
};

export default function TopRisks({ risks }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Top Risk Applications
      </h2>
      <div className="space-y-4">
        {risks.map((risk, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white">{risk.application}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                risk.riskLevel === 'High' ? 'text-red-100 bg-red-600' : 'text-yellow-100 bg-yellow-600'
              }`}>
                {risk.riskLevel} Risk
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Compliance Score</span>
              <span className={`text-sm font-bold ${getComplianceColor(risk.score)}`}>
                {risk.score}/100
              </span>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Issues:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {risk.issues.map((issue, issueIndex) => (
                  <span key={issueIndex} className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-xs rounded-md">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-semibold">
                Create Remediation Plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
