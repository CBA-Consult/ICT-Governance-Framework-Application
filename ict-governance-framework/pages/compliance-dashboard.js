import React, { useState, useEffect } from 'react';

const ComplianceDashboard = () => {
  const [complianceData, setComplianceData] = useState(null);
  const [discoveredApps, setDiscoveredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30days');

  // Mock compliance data
  const mockComplianceData = {
    overview: {
      totalApplications: 156,
      compliantApplications: 142,
      nonCompliantApplications: 14,
      pendingReview: 8,
      overallComplianceScore: 91,
      cloudAppSecurityScore: 88,
      riskDistribution: {
        low: 128,
        medium: 22,
        high: 6
      }
    },
    trends: {
      complianceScoreHistory: [
        { date: '2024-01-01', score: 85 },
        { date: '2024-01-08', score: 87 },
        { date: '2024-01-15', score: 89 },
        { date: '2024-01-22', score: 91 },
        { date: '2024-01-29', score: 91 }
      ],
      newApplications: [
        { date: '2024-01-01', count: 3 },
        { date: '2024-01-08', count: 5 },
        { date: '2024-01-15', count: 2 },
        { date: '2024-01-22', count: 4 },
        { date: '2024-01-29', count: 1 }
      ]
    },
    certificationCompliance: {
      soc2: { compliant: 145, total: 156, percentage: 93 },
      iso27001: { compliant: 138, total: 156, percentage: 88 },
      gdpr: { compliant: 152, total: 156, percentage: 97 },
      hipaa: { compliant: 89, total: 156, percentage: 57 },
      pciDss: { compliant: 45, total: 156, percentage: 29 }
    },
    topRisks: [
      {
        application: 'Legacy CRM System',
        riskLevel: 'High',
        issues: ['No MFA', 'Outdated encryption', 'No audit trail'],
        score: 45
      },
      {
        application: 'File Sharing Tool',
        riskLevel: 'High',
        issues: ['Data location unknown', 'No DLP support'],
        score: 52
      },
      {
        application: 'Project Management Tool',
        riskLevel: 'Medium',
        issues: ['Limited access controls', 'No SSO integration'],
        score: 68
      }
    ]
  };

  // Mock discovered applications from SIEM/Cloud App Security
  const mockDiscoveredApps = [
    {
      id: 'disc-001',
      name: 'Canva',
      publisher: 'Canva Pty Ltd',
      discoverySource: 'Microsoft Defender for Cloud Apps',
      firstSeen: '2024-01-28',
      lastSeen: '2024-01-30',
      userCount: 12,
      deviceCount: 8,
      riskScore: 6.5,
      complianceScore: 75,
      status: 'Pending Validation',
      category: 'Design',
      dataClassification: 'Business',
      cloudAppSecurityData: {
        overall: 75,
        compliance: { soc2: true, iso27001: false, gdpr: true, hipaa: false },
        security: { dataEncryption: true, mfa: false, auditTrail: true, accessControl: true },
        legal: { dataRetention: true, privacyPolicy: true, termsOfService: true }
      }
    },
    {
      id: 'disc-002',
      name: 'Trello',
      publisher: 'Atlassian',
      discoverySource: 'Microsoft Sentinel',
      firstSeen: '2024-01-25',
      lastSeen: '2024-01-30',
      userCount: 8,
      deviceCount: 6,
      riskScore: 4.2,
      complianceScore: 82,
      status: 'Approved',
      category: 'Productivity',
      dataClassification: 'Business',
      cloudAppSecurityData: {
        overall: 82,
        compliance: { soc2: true, iso27001: true, gdpr: true, hipaa: false },
        security: { dataEncryption: true, mfa: true, auditTrail: true, accessControl: true },
        legal: { dataRetention: true, privacyPolicy: true, termsOfService: true }
      }
    },
    {
      id: 'disc-003',
      name: 'Unknown File Sync Tool',
      publisher: 'Unknown',
      discoverySource: 'Microsoft Defender for Endpoint',
      firstSeen: '2024-01-29',
      lastSeen: '2024-01-30',
      userCount: 3,
      deviceCount: 3,
      riskScore: 8.5,
      complianceScore: 35,
      status: 'Blocked',
      category: 'File Sharing',
      dataClassification: 'Unknown',
      cloudAppSecurityData: {
        overall: 35,
        compliance: { soc2: false, iso27001: false, gdpr: false, hipaa: false },
        security: { dataEncryption: false, mfa: false, auditTrail: false, accessControl: false },
        legal: { dataRetention: false, privacyPolicy: false, termsOfService: false }
      }
    }
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setComplianceData(mockComplianceData);
      setDiscoveredApps(mockDiscoveredApps);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Blocked': return 'text-red-600 bg-red-100';
      case 'Pending Validation': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (score) => {
    if (score <= 3) return 'text-green-600 bg-green-100';
    if (score <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Microsoft Defender Cloud App Security integration and compliance monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overall Compliance</dt>
                  <dd className="text-lg font-medium text-gray-900">{complianceData.overview.overallComplianceScore}%</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Compliant Apps</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {complianceData.overview.compliantApplications}/{complianceData.overview.totalApplications}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Risk Apps</dt>
                  <dd className="text-lg font-medium text-gray-900">{complianceData.overview.riskDistribution.high}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cloud App Security Score</dt>
                  <dd className="text-lg font-medium text-gray-900">{complianceData.overview.cloudAppSecurityScore}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Certification Compliance */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Certification Compliance</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Object.entries(complianceData.certificationCompliance).map(([cert, data]) => (
                <div key={cert} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{data.percentage}%</div>
                  <div className="text-sm text-gray-500 mb-2">{cert.toUpperCase()}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.percentage >= 90 ? 'bg-green-500' :
                        data.percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {data.compliant}/{data.total} apps
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Discovered Applications */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recently Discovered Applications
              <span className="ml-2 text-sm font-normal text-gray-500">
                (via Microsoft Defender Cloud App Security & SIEM)
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discovery Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users/Devices
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discoveredApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{app.name}</div>
                        <div className="text-sm text-gray-500">{app.publisher}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.discoverySource}</div>
                      <div className="text-sm text-gray-500">First seen: {app.firstSeen}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.userCount} users</div>
                      <div className="text-sm text-gray-500">{app.deviceCount} devices</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(app.riskScore)}`}>
                        {app.riskScore}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getComplianceColor(app.complianceScore)}`}>
                        {app.complianceScore}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Review
                      </button>
                      {app.status === 'Pending Validation' && (
                        <button className="text-green-600 hover:text-green-900">
                          Validate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Risk Applications */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Risk Applications</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {complianceData.topRisks.map((risk, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-900">{risk.application}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      risk.riskLevel === 'High' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'
                    }`}>
                      {risk.riskLevel} Risk
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Compliance Score</span>
                    <span className={`text-sm font-semibold ${getComplianceColor(risk.score)}`}>
                      {risk.score}/100
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Issues:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {risk.issues.map((issue, issueIndex) => (
                        <span key={issueIndex} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                      Create Remediation Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;