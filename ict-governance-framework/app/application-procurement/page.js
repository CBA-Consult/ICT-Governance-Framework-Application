'use client';

import { useState, useEffect } from 'react';
import ProcurementWizard from '@/app/components/procurement/ProcurementWizard'; // Using the new wizard

// NOTE: Using a simplified mock data structure for the table display
const mockRequests = [
    { id: 'req-001', applicationName: 'Figma', vendor: 'Figma Inc.', requestedBy: 'John Smith', department: 'Design', status: 'Pending Compliance Review', urgency: 'High', complianceScore: null, submissionDate: '2024-01-15' },
    { id: 'req-002', applicationName: 'Notion', vendor: 'Notion Labs Inc.', requestedBy: 'Sarah Johnson', department: 'Marketing', status: 'Approved', urgency: 'Medium', complianceScore: 85, submissionDate: '2024-01-10' },
    { id: 'req-003', applicationName: 'Jira', vendor: 'Atlassian', requestedBy: 'David Chen', department: 'Engineering', status: 'Rejected', urgency: 'High', complianceScore: 65, submissionDate: '2024-01-08' },
];

export default function ApplicationProcurementPage() {
  const [procurementRequests, setProcurementRequests] = useState([]);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setProcurementRequests(mockRequests);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900/50';
      case 'Rejected': return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/50';
      case 'Pending Compliance Review': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50';
      case 'Pending Manager Approval': return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50';
      default: return 'text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-700';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-12">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    Application Procurement
                </h1>
                <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                    Request new business applications with our streamlined and compliant workflow.
                </p>
            </div>
            <button
              onClick={() => setShowNewRequestForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              New Request
            </button>
        </div>

        {showNewRequestForm && <ProcurementWizard onClose={() => setShowNewRequestForm(false)} />}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Compliance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {procurementRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{request.applicationName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{request.vendor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{request.requestedBy}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{request.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {request.complianceScore ? `${request.complianceScore}/100` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {request.submissionDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
