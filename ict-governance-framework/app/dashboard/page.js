"use client";
import React from "react";

const kpiData = [
  {
    label: 'Governance Maturity Level',
    value: 'Level 3 → 4',
    target: 'Level 4 (Managed)',
    trend: 'progressing',
    description: 'Current maturity level based on annual assessment.'
  },
  {
    label: 'Policy Compliance Rate',
    value: '94%',
    target: '>95%',
    trend: 'up',
    description: 'Percentage of technology assets compliant with governance policies.'
  },
  {
    label: 'Risk Remediation Rate',
    value: '91%',
    target: '>90%',
    trend: 'up',
    description: 'Percentage of identified risks remediated within SLA.'
  },
  {
    label: 'Stakeholder Satisfaction',
    value: '82%',
    target: '>85%',
    trend: 'up',
    description: 'Overall satisfaction with governance services.'
  },
  {
    label: 'Process Automation Rate',
    value: '68%',
    target: '>70%',
    trend: 'up',
    description: 'Percentage of governance processes with automation.'
  },
  {
    label: 'Business Value Realization',
    value: '$2.3M',
    target: '$2.3M+',
    trend: 'steady',
    description: 'Annual value delivered by governance initiatives.'
  },
  {
    label: 'Incident Rate',
    value: '↓',
    target: 'Decreasing',
    trend: 'down',
    description: 'Number of incidents related to governance failures.'
  },
  {
    label: 'Mean Time to Resolve (MTTR)',
    value: '18h',
    target: '<24h',
    trend: 'up',
    description: 'Average time to resolve governance-related incidents.'
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">ICT Governance KPI Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">{kpi.label}</h2>
                <p className="text-2xl font-bold mb-1">{kpi.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Target: {kpi.target}</p>
                <p className="text-xs text-gray-400 dark:text-gray-300">{kpi.description}</p>
              </div>
              <div className="mt-2">
                {kpi.trend === 'up' && <span className="text-green-600">▲ Improving</span>}
                {kpi.trend === 'down' && <span className="text-red-600">▼ Decreasing</span>}
                {kpi.trend === 'steady' && <span className="text-yellow-600">● Stable</span>}
                {kpi.trend === 'progressing' && <span className="text-blue-600">→ Progressing</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Summary & Trends</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
            <li>Governance maturity is advancing toward Level 4 (Managed).</li>
            <li>Policy compliance and risk remediation rates are above 90% and trending upward.</li>
            <li>Stakeholder satisfaction and automation progress are improving, with targets in reach.</li>
            <li>Business value realization is stable at $2.3M annually.</li>
            <li>Incident rates are decreasing and MTTR remains well below target.</li>
          </ul>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Compliance & Risk</h3>
            <ul className="text-gray-700 dark:text-gray-200 list-disc list-inside">
              <li><strong>Policy Compliance Rate:</strong> 94% (Target: &gt;95%)</li>
              <li><strong>Risk Remediation Rate:</strong> 91% (Target: &gt;90%)</li>
              <li><strong>Incident Rate:</strong> Decreasing</li>
              <li><strong>Security Control Effectiveness:</strong> 96%</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Business Value & Automation</h3>
            <ul className="text-gray-700 dark:text-gray-200 list-disc list-inside">
              <li><strong>Business Value Realization:</strong> $2.3M/year</li>
              <li><strong>Process Automation Rate:</strong> 68% (Target: &gt;70%)</li>
              <li><strong>Manual Task Reduction:</strong> 50% reduction annually</li>
              <li><strong>Automated Compliance Scanning:</strong> 95% coverage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
