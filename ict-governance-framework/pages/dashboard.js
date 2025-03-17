import React from 'react';

const Dashboard = () => {
    const complianceScore = 85;
    const securityScore = 72;
  return (
    <div>
      <h1>ICT Governance Framework Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {/* Widget 1: Policies Overview */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Policies Overview</h2>
          <p>Total Policies: 25</p>
          <p>Policies in Review: 3</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Compliance Score</h2>
          <div className="flex items-center">
            <div className="w-2/3 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${complianceScore}%` }}></div>
            </div>
            <span className="ml-2">{complianceScore}%</span>
          </div>
        </div>

        {/* Widget 2: Compliance Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Compliance Status</h2>
          <div className="flex items-center">
            <div className="w-2/3 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <span className="ml-2">75%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Security Score</h2>
          <div className="flex items-center">
            <div className="w-2/3 bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${securityScore}%` }}></div>
            </div>
            <span className="ml-2">{securityScore}%</span>
          </div>
        </div>

        {/* Widget 3: Recent Activities */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-2 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-2">Recent Activities</h2>
          <ul className="list-disc list-inside">
            <li>New policy "Data Security Policy" added.</li>
            <li>"Acceptable Use Policy" review completed.</li>
          </ul>
        </div>

        {/* Widget 4: Upcoming Reviews */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-2 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-2">Upcoming Reviews</h2>
          <ul>
            <li>Password Policy - Due: 2024-03-15</li>
            <li>Data Backup Policy - Due: 2024-04-01</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
