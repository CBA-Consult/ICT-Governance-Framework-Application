'use client';

import { useState, useEffect } from 'react';
import ComplianceOverviewCards from '../components/compliance/ComplianceOverviewCards';
import CertificationComplianceChart from '../components/compliance/CertificationComplianceChart';
import DiscoveredApplicationsTable from '../components/compliance/DiscoveredApplicationsTable';
import TopRisks from '../components/compliance/TopRisks';
import AppDetailsModal from '../components/compliance/AppDetailsModal';

// NOTE: Using the same mock data structure as the original file
const mockComplianceData = {
    overview: {
      totalApplications: 156,
      compliantApplications: 142,
      nonCompliantApplications: 14,
      pendingReview: 8,
      overallComplianceScore: 91,
      cloudAppSecurityScore: 88,
      riskDistribution: { low: 128, medium: 22, high: 6 }
    },
    certificationCompliance: {
      soc2: { compliant: 145, total: 156, percentage: 93 },
      iso27001: { compliant: 138, total: 156, percentage: 88 },
      gdpr: { compliant: 152, total: 156, percentage: 97 },
      hipaa: { compliant: 89, total: 156, percentage: 57 },
      pciDss: { compliant: 45, total: 156, percentage: 29 }
    },
    topRisks: [
      { application: 'Legacy CRM System', riskLevel: 'High', issues: ['No MFA', 'Outdated encryption', 'No audit trail'], score: 45 },
      { application: 'File Sharing Tool', riskLevel: 'High', issues: ['Data location unknown', 'No DLP support'], score: 52 },
      { application: 'Project Management Tool', riskLevel: 'Medium', issues: ['Limited access controls', 'No SSO integration'], score: 68 }
    ]
};

const mockDiscoveredApps = [
    { id: 'disc-001', name: 'Microsoft Office Online', publisher: 'Microsoft Corporation', discoverySource: 'Microsoft Defender for Cloud Apps', firstSeen: '2024-01-28', lastSeen: '2024-01-30', userCount: 120, deviceCount: 80, riskScore: 2.0, complianceScore: 98, status: 'Approved', category: 'Productivity', vendor: 'Microsoft', headquarters: 'USA', dataCenter: 'Multiple', hostingCompany: 'Azure', founded: '1975', holding: 'Public', latestBreach: 'N/A', mfa: true, dataAtRestEncryption: 'AES-256', certifications: { soc2: true, iso27001: true, gdpr: true, hipaa: true } },
    { id: 'disc-002', name: 'Trello', publisher: 'Atlassian', discoverySource: 'Microsoft Sentinel', firstSeen: '2024-01-25', lastSeen: '2024-01-30', userCount: 8, deviceCount: 6, riskScore: 4.2, complianceScore: 82, status: 'Approved', category: 'Productivity', vendor: 'Atlassian', headquarters: 'Australia', dataCenter: 'AWS', hostingCompany: 'AWS', founded: '2011', holding: 'Public', latestBreach: '2022', mfa: true, dataAtRestEncryption: 'AES-256', certifications: { soc2: true, iso27001: true, gdpr: true, hipaa: false } },
    { id: 'disc-003', name: 'Unknown File Sync Tool', publisher: 'Unknown', discoverySource: 'Microsoft Defender for Endpoint', firstSeen: '2024-01-29', lastSeen: '2024-01-30', userCount: 3, deviceCount: 3, riskScore: 8.5, complianceScore: 35, status: 'Blocked', category: 'File Sharing', vendor: 'Unknown', headquarters: 'Unknown', dataCenter: 'Unknown', hostingCompany: 'Unknown', founded: 'Unknown', holding: 'Unknown', latestBreach: 'Unknown', mfa: false, dataAtRestEncryption: 'None', certifications: { soc2: false, iso27001: false, gdpr: false, hipaa: false } },
];


export default function ComplianceDashboardPage() {
  const [complianceData, setComplianceData] = useState(null);
  const [discoveredApps, setDiscoveredApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setComplianceData(mockComplianceData);
      setDiscoveredApps(mockDiscoveredApps);
      setLoading(false);
    }, 500); // Shortened delay for quicker loading of the mockup
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">Loading Compliance Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-left mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Compliance Dashboard
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            An overview of application compliance and security posture.
          </p>
        </div>

        <ComplianceOverviewCards overviewData={complianceData.overview} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-3">
                <CertificationComplianceChart data={complianceData.certificationCompliance} />
            </div>
            <div className="lg:col-span-2">
                <TopRisks risks={complianceData.topRisks} />
            </div>
        </div>

        <DiscoveredApplicationsTable applications={discoveredApps} onReview={setSelectedApp} />
      </main>

      <AppDetailsModal app={selectedApp} onClose={() => setSelectedApp(null)} />
    </div>
  );
}
