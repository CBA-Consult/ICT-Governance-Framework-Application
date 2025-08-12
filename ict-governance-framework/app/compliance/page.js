// Compliance Page - ICT Governance Framework

export default function CompliancePage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Compliance</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-200">
        Compliance is a core pillar of the ICT Governance Framework. The framework ensures adherence to regulatory requirements, industry standards, and internal policies through automated monitoring, regular assessments, and continuous improvement.
      </p>
      <ul className="list-disc list-inside mb-6">
        <li><strong>Regulatory Compliance</strong>: Alignment with ISO/IEC 27001, COBIT, ITIL, NIST, and other standards.</li>
        <li><strong>Automated Compliance Monitoring</strong>: Continuous policy compliance scanning and reporting.</li>
        <li><strong>Exception Management</strong>: Formal process for managing and tracking policy exceptions.</li>
        <li><strong>Audit & Reporting</strong>: Regular audits, compliance dashboards, and stakeholder reporting.</li>
        <li><strong>Continuous Improvement</strong>: Annual benchmarking and quarterly reviews to drive compliance maturity.</li>
      </ul>
      <p className="text-gray-700 dark:text-gray-200">
        For compliance checklists, audit results, and detailed procedures, refer to the compliance documentation in the repository.
      </p>
    </div>
  );
}
