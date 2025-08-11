import React, { useState, useEffect } from 'react';

const ApplicationProcurement = () => {
  const [procurementRequests, setProcurementRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({
    applicationName: '',
    vendor: '',
    businessJustification: '',
    requestedBy: '',
    department: '',
    estimatedUsers: '',
    estimatedCost: '',
    urgency: 'Medium',
    dataClassification: 'Business',
    complianceRequirements: []
  });
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock procurement requests data
  const mockRequests = [
    {
      id: 'req-001',
      applicationName: 'Figma',
      vendor: 'Figma Inc.',
      requestedBy: 'John Smith',
      department: 'Design',
      businessJustification: 'Need collaborative design tool for UI/UX work',
      estimatedUsers: 5,
      estimatedCost: '$15/month per user',
      urgency: 'High',
      dataClassification: 'Business',
      status: 'Pending Compliance Review',
      submissionDate: '2024-01-15',
      complianceScore: null,
      approvalWorkflow: [
        { step: 'Submitted', status: 'Completed', date: '2024-01-15', approver: 'System' },
        { step: 'Manager Approval', status: 'Completed', date: '2024-01-16', approver: 'Jane Doe' },
        { step: 'Compliance Review', status: 'In Progress', date: null, approver: 'Compliance Team' },
        { step: 'Security Review', status: 'Pending', date: null, approver: 'Security Team' },
        { step: 'Final Approval', status: 'Pending', date: null, approver: 'ICT Governance Council' }
      ],
      complianceRequirements: ['GDPR', 'SOC2']
    },
    {
      id: 'req-002',
      applicationName: 'Notion',
      vendor: 'Notion Labs Inc.',
      requestedBy: 'Sarah Johnson',
      department: 'Marketing',
      businessJustification: 'Team collaboration and documentation platform',
      estimatedUsers: 12,
      estimatedCost: '$8/month per user',
      urgency: 'Medium',
      dataClassification: 'Business',
      status: 'Approved',
      submissionDate: '2024-01-10',
      complianceScore: 85,
      approvalWorkflow: [
        { step: 'Submitted', status: 'Completed', date: '2024-01-10', approver: 'System' },
        { step: 'Manager Approval', status: 'Completed', date: '2024-01-11', approver: 'Mike Wilson' },
        { step: 'Compliance Review', status: 'Completed', date: '2024-01-12', approver: 'Compliance Team' },
        { step: 'Security Review', status: 'Completed', date: '2024-01-13', approver: 'Security Team' },
        { step: 'Final Approval', status: 'Completed', date: '2024-01-14', approver: 'ICT Governance Council' }
      ],
      complianceRequirements: ['GDPR']
    },
    {
      id: 'req-003',
      applicationName: 'Jira',
      vendor: 'Atlassian',
      requestedBy: 'David Chen',
      department: 'Engineering',
      businessJustification: 'Project management and issue tracking for development team',
      estimatedUsers: 25,
      estimatedCost: '$7/month per user',
      urgency: 'High',
      dataClassification: 'Confidential',
      status: 'Rejected',
      submissionDate: '2024-01-08',
      complianceScore: 65,
      rejectionReason: 'Compliance score below minimum threshold. Alternative solutions recommended.',
      approvalWorkflow: [
        { step: 'Submitted', status: 'Completed', date: '2024-01-08', approver: 'System' },
        { step: 'Manager Approval', status: 'Completed', date: '2024-01-09', approver: 'Lisa Brown' },
        { step: 'Compliance Review', status: 'Completed', date: '2024-01-10', approver: 'Compliance Team' },
        { step: 'Security Review', status: 'Rejected', date: '2024-01-11', approver: 'Security Team' }
      ],
      complianceRequirements: ['GDPR', 'SOC2', 'ISO27001']
    }
  ];

  const departments = ['Engineering', 'Marketing', 'Sales', 'Design', 'HR', 'Finance', 'Operations'];
  const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];
  const dataClassifications = ['Public', 'Internal', 'Business', 'Confidential', 'Restricted'];
  const complianceOptions = ['GDPR', 'SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS', 'FedRAMP'];

  useEffect(() => {
    // Simulate API call to load procurement requests
    setTimeout(() => {
      setProcurementRequests(mockRequests);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newRequest.applicationName || !newRequest.vendor || !newRequest.businessJustification) {
      alert('Please fill in all required fields');
      return;
    }

    // Create new request
    const request = {
      id: `req-${Date.now()}`,
      ...newRequest,
      requestedBy: 'Current User', // In real app, get from auth context
      status: 'Pending Manager Approval',
      submissionDate: new Date().toISOString().split('T')[0],
      complianceScore: null,
      approvalWorkflow: [
        { step: 'Submitted', status: 'Completed', date: new Date().toISOString().split('T')[0], approver: 'System' },
        { step: 'Manager Approval', status: 'Pending', date: null, approver: 'Manager' },
        { step: 'Compliance Review', status: 'Pending', date: null, approver: 'Compliance Team' },
        { step: 'Security Review', status: 'Pending', date: null, approver: 'Security Team' },
        { step: 'Final Approval', status: 'Pending', date: null, approver: 'ICT Governance Council' }
      ]
    };

    setProcurementRequests([request, ...procurementRequests]);
    setNewRequest({
      applicationName: '',
      vendor: '',
      businessJustification: '',
      requestedBy: '',
      department: '',
      estimatedUsers: '',
      estimatedCost: '',
      urgency: 'Medium',
      dataClassification: 'Business',
      complianceRequirements: []
    });
    setShowNewRequestForm(false);
    
    alert('Procurement request submitted successfully!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Pending Compliance Review': return 'text-yellow-600 bg-yellow-100';
      case 'Pending Manager Approval': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading procurement requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application Procurement</h1>
              <p className="mt-2 text-gray-600">
                Request new business applications with automated compliance validation
              </p>
            </div>
            <button
              onClick={() => setShowNewRequestForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">New Application Request</h2>
                <button
                  onClick={() => setShowNewRequestForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newRequest.applicationName}
                      onChange={(e) => setNewRequest({...newRequest, applicationName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newRequest.vendor}
                      onChange={(e) => setNewRequest({...newRequest, vendor: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newRequest.department}
                      onChange={(e) => setNewRequest({...newRequest, department: e.target.value})}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Users
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newRequest.estimatedUsers}
                      onChange={(e) => setNewRequest({...newRequest, estimatedUsers: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Cost
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., $10/month per user"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newRequest.estimatedCost}
                      onChange={(e) => setNewRequest({...newRequest, estimatedCost: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newRequest.urgency}
                      onChange={(e) => setNewRequest({...newRequest, urgency: e.target.value})}
                    >
                      {urgencyLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Classification
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newRequest.dataClassification}
                      onChange={(e) => setNewRequest({...newRequest, dataClassification: e.target.value})}
                    >
                      {dataClassifications.map(classification => (
                        <option key={classification} value={classification}>{classification}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compliance Requirements
                    </label>
                    <div className="space-y-2">
                      {complianceOptions.map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={newRequest.complianceRequirements.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRequest({
                                  ...newRequest,
                                  complianceRequirements: [...newRequest.complianceRequirements, option]
                                });
                              } else {
                                setNewRequest({
                                  ...newRequest,
                                  complianceRequirements: newRequest.complianceRequirements.filter(req => req !== option)
                                });
                              }
                            }}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Justification *
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this application is needed and how it will benefit the business..."
                    value={newRequest.businessJustification}
                    onChange={(e) => setNewRequest({...newRequest, businessJustification: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Procurement Requests</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {procurementRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.applicationName}</div>
                        <div className="text-sm text-gray-500">{request.vendor}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{request.requestedBy}</div>
                        <div className="text-sm text-gray-500">{request.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.complianceScore ? (
                        <span className={`font-medium ${
                          request.complianceScore >= 90 ? 'text-green-600' :
                          request.complianceScore >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {request.complianceScore}/100
                        </span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.submissionDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationProcurement;