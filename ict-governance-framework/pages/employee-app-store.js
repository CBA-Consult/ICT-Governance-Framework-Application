import React, { useState, useEffect } from 'react';

const EmployeeAppStore = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [userApps, setUserApps] = useState([]);

  // Mock data for predefined procured applications with compliance scores
  const mockApplications = [
    {
      id: 'app-001',
      name: 'Microsoft Office 365',
      description: 'Complete productivity suite with Word, Excel, PowerPoint, and Teams',
      category: 'Productivity',
      publisher: 'Microsoft Corporation',
      version: '2024.1',
      iconUrl: '/icons/office365.png',
      complianceScore: 95,
      securityScore: 92,
      riskLevel: 'Low',
      dataClassification: 'Business',
      isApproved: true,
      requiresApproval: false,
      cloudAppSecurityScore: {
        overall: 95,
        compliance: {
          soc2: true,
          iso27001: true,
          gdpr: true,
          hipaa: true
        },
        security: {
          dataEncryption: true,
          mfa: true,
          auditTrail: true,
          accessControl: true
        },
        legal: {
          dataRetention: true,
          privacyPolicy: true,
          termsOfService: true
        }
      },
      installationType: 'Cloud Service',
      businessJustification: 'Essential productivity tools for all employees'
    },
    {
      id: 'app-002',
      name: 'Slack',
      description: 'Team collaboration and communication platform',
      category: 'Communication',
      publisher: 'Slack Technologies',
      version: '4.35.0',
      iconUrl: '/icons/slack.png',
      complianceScore: 88,
      securityScore: 85,
      riskLevel: 'Medium',
      dataClassification: 'Business',
      isApproved: true,
      requiresApproval: true,
      cloudAppSecurityScore: {
        overall: 88,
        compliance: {
          soc2: true,
          iso27001: true,
          gdpr: true,
          hipaa: false
        },
        security: {
          dataEncryption: true,
          mfa: true,
          auditTrail: true,
          accessControl: true
        },
        legal: {
          dataRetention: true,
          privacyPolicy: true,
          termsOfService: true
        }
      },
      installationType: 'Cloud Service',
      businessJustification: 'Team communication and collaboration'
    },
    {
      id: 'app-003',
      name: 'Adobe Creative Cloud',
      description: 'Professional creative software suite including Photoshop, Illustrator, and InDesign',
      category: 'Design',
      publisher: 'Adobe Inc.',
      version: '2024.0',
      iconUrl: '/icons/adobe-cc.png',
      complianceScore: 90,
      securityScore: 87,
      riskLevel: 'Medium',
      dataClassification: 'Business',
      isApproved: true,
      requiresApproval: true,
      cloudAppSecurityScore: {
        overall: 90,
        compliance: {
          soc2: true,
          iso27001: true,
          gdpr: true,
          hipaa: false
        },
        security: {
          dataEncryption: true,
          mfa: true,
          auditTrail: true,
          accessControl: true
        },
        legal: {
          dataRetention: true,
          privacyPolicy: true,
          termsOfService: true
        }
      },
      installationType: 'Desktop Application',
      businessJustification: 'Professional design and creative work'
    },
    {
      id: 'app-004',
      name: 'Salesforce',
      description: 'Customer relationship management platform',
      category: 'CRM',
      publisher: 'Salesforce.com',
      version: 'Lightning',
      iconUrl: '/icons/salesforce.png',
      complianceScore: 93,
      securityScore: 91,
      riskLevel: 'Low',
      dataClassification: 'Confidential',
      isApproved: true,
      requiresApproval: true,
      cloudAppSecurityScore: {
        overall: 93,
        compliance: {
          soc2: true,
          iso27001: true,
          gdpr: true,
          hipaa: true
        },
        security: {
          dataEncryption: true,
          mfa: true,
          auditTrail: true,
          accessControl: true
        },
        legal: {
          dataRetention: true,
          privacyPolicy: true,
          termsOfService: true
        }
      },
      installationType: 'Cloud Service',
      businessJustification: 'Customer relationship management and sales tracking'
    },
    {
      id: 'app-005',
      name: 'Zoom',
      description: 'Video conferencing and online meeting platform',
      category: 'Communication',
      publisher: 'Zoom Video Communications',
      version: '5.16.0',
      iconUrl: '/icons/zoom.png',
      complianceScore: 82,
      securityScore: 78,
      riskLevel: 'Medium',
      dataClassification: 'Business',
      isApproved: true,
      requiresApproval: true,
      cloudAppSecurityScore: {
        overall: 82,
        compliance: {
          soc2: true,
          iso27001: false,
          gdpr: true,
          hipaa: true
        },
        security: {
          dataEncryption: true,
          mfa: true,
          auditTrail: true,
          accessControl: true
        },
        legal: {
          dataRetention: true,
          privacyPolicy: true,
          termsOfService: true
        }
      },
      installationType: 'Desktop/Mobile Application',
      businessJustification: 'Video conferencing and remote meetings'
    }
  ];

  const categories = ['All', 'Productivity', 'Communication', 'Design', 'CRM', 'Development', 'Security'];

  useEffect(() => {
    // Simulate API call to load applications
    setTimeout(() => {
      setApplications(mockApplications);
      setFilteredApps(mockApplications);
      setLoading(false);
    }, 1000);

    // Load user's current applications
    setUserApps(['app-001']); // Mock user already has Office 365
  }, []);

  useEffect(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.publisher.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    setFilteredApps(filtered);
  }, [searchTerm, selectedCategory, applications]);

  const handleRequestAccess = async (appId) => {
    // Simulate API call to request application access
    alert(`Access request submitted for application ${appId}. You will be notified when approved.`);
  };

  const handleInstallApp = async (appId) => {
    // Simulate API call to install application
    setUserApps([...userApps, appId]);
    alert(`Application ${appId} installation initiated. Check your device for installation progress.`);
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Employee App Store...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Employee App Store</h1>
            <p className="mt-2 text-gray-600">
              Self-service access to pre-approved, compliant business applications
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Applications
              </label>
              <input
                type="text"
                id="search"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name, description, or publisher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="md:w-48">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map(app => (
            <div key={app.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* App Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {app.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                      <p className="text-sm text-gray-500">{app.publisher}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(app.riskLevel)}`}>
                    {app.riskLevel} Risk
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{app.description}</p>

                {/* Compliance Scores */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Cloud App Security Score</span>
                    <span className={`text-sm font-semibold ${getComplianceColor(app.cloudAppSecurityScore.overall)}`}>
                      {app.cloudAppSecurityScore.overall}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        app.cloudAppSecurityScore.overall >= 90 ? 'bg-green-500' :
                        app.cloudAppSecurityScore.overall >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${app.cloudAppSecurityScore.overall}%` }}
                    ></div>
                  </div>
                </div>

                {/* Compliance Badges */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Compliance Certifications</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(app.cloudAppSecurityScore.compliance).map(([cert, status]) => (
                      <span
                        key={cert}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {cert.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* App Details */}
                <div className="text-xs text-gray-500 mb-4">
                  <p>Category: {app.category}</p>
                  <p>Version: {app.version}</p>
                  <p>Type: {app.installationType}</p>
                  <p>Data Classification: {app.dataClassification}</p>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t">
                  {userApps.includes(app.id) ? (
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
                    >
                      Already Installed
                    </button>
                  ) : app.requiresApproval ? (
                    <button
                      onClick={() => handleRequestAccess(app.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    >
                      Request Access
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInstallApp(app.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    >
                      Install Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No applications found</div>
            <p className="text-gray-500">Try adjusting your search criteria or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAppStore;