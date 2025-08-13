'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const getBarColor = (percentage) => {
  if (percentage >= 90) return '#22c55e'; // green-500
  if (percentage >= 80) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

export default function CertificationComplianceChart({ data }) {
  const chartData = Object.entries(data).map(([name, values]) => ({
    name: name.toUpperCase(),
    percentage: values.percentage,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Certification Compliance
      </h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis unit="%" stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                borderColor: '#4b5563',
                color: '#ffffff',
                borderRadius: '0.5rem',
              }}
              cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
            />
            <Bar dataKey="percentage" name="Compliance">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
