
// Policies Page - ICT Governance Framework (Modernized)

export default function PoliciesPage() {
  return (
    <main className="max-w-4xl mx-auto py-10 px-4 sm:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-blue-900 dark:text-blue-200">Policies</h1>
        <p className="text-lg text-gray-700 dark:text-gray-200">
          The ICT Governance Framework establishes a comprehensive policy structure covering all major governance domains. Policies are regularly reviewed and updated to ensure alignment with business objectives, regulatory requirements, and emerging technology trends.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-blue-800 dark:text-blue-100">Policy Domains</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-800 dark:text-gray-100">
          <li><strong>Technology Selection &amp; Standardization</strong>: Ensures all technology acquisitions align with strategic goals and approved standards.</li>
          <li><strong>Security &amp; Compliance</strong>: Mandates security controls, compliance with ISO/IEC 27001, and regulatory adherence.</li>
          <li><strong>Architecture &amp; Change Management</strong>: Governs architecture reviews, change approvals, and lifecycle management.</li>
          <li><strong>Asset &amp; Vendor Management</strong>: Covers asset lifecycle, vendor selection, and performance monitoring.</li>
          <li><strong>Emerging Technology</strong>: Provides guidance for AI, IoT, edge computing, and other new domains.</li>
          <li><strong>Policy Enforcement</strong>: Automated compliance monitoring and exception management.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-blue-800 dark:text-blue-100">Policy KPIs &amp; Metrics</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-800 dark:text-gray-100">
          <li><strong>Policy Review Frequency:</strong> 100% of policies reviewed annually.</li>
          <li><strong>Compliance Rate:</strong> &gt;95% adherence to all mandatory policies.</li>
          <li><strong>Exception Rate:</strong> &lt;5% of policy exceptions granted per year.</li>
          <li><strong>Stakeholder Awareness:</strong> &gt;90% of staff acknowledge policy updates.</li>
          <li><strong>Audit Findings:</strong> &lt;2 major audit findings related to policy non-compliance per year.</li>
        </ul>
        <p className="mt-3 text-gray-700 dark:text-gray-200">
          Policy effectiveness is monitored through regular reviews, compliance tracking, and stakeholder feedback, ensuring continuous improvement and alignment with the ICT Governance Framework.
        </p>
      </section>

      <footer className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          For detailed policy documents and procedures, refer to the documentation in the repository root.
        </p>
      </footer>
    </main>
  );
}
