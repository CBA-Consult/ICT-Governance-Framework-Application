'use client';

import CodeBlock from '../components/docs/CodeBlock';
import TableOfContents from '../components/docs/TableOfContents';

const headings = [
    { id: 'introduction', text: 'Introduction' },
    { id: 'getting-started', text: 'Getting Started' },
    { id: 'api-endpoints', text: 'API Endpoints' },
    { id: 'example-usage', text: 'Example Usage' },
];

const exampleCode = `
import { api } from './api';

function fetchComplianceData() {
  // Fetch data from the main compliance endpoint
  return api.get('/compliance-dashboard');
}
`;

export default function DocsPage() {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-3">
            <article className="text-gray-700 dark:text-gray-300">
              <h1 id="introduction" className="scroll-mt-24 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6">
                Introduction to the Framework API
              </h1>
              <p className="text-lg leading-8 mb-6">
                Welcome to the documentation for the ICT Governance Framework API. This API provides a set of endpoints to interact with the core components of the governance framework, including compliance data, policies, and application procurement workflows.
              </p>

              <h2 id="getting-started" className="scroll-mt-24 text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 border-b pb-2">
                Getting Started
              </h2>
              <p className="text-lg leading-8 mb-6">
                To get started, you'll need an API key. Please contact the framework administrator to obtain your credentials. Once you have your key, you can include it in the <code>Authorization</code> header of your requests as a Bearer token.
              </p>

              <h2 id="api-endpoints" className="scroll-mt-24 text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 border-b pb-2">
                API Endpoints
              </h2>
              <p className="text-lg leading-8 mb-6">
                The API is organized around REST principles. All endpoints are available under the <code>/api</code> path.
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6 text-lg">
                <li><code>/api/defender-alerts/sync</code>: Syncs alerts from Microsoft Defender.</li>
                <li><code>/api/policies</code>: Fetches all current policies.</li>
                <li><code>/api/procurement/requests</code>: Lists all application procurement requests.</li>
              </ul>

              <h2 id="example-usage" className="scroll-mt-24 text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 border-b pb-2">
                Example Usage
              </h2>
              <p className="text-lg leading-8 mb-6">
                Here's a quick example of how you might fetch compliance data using a JavaScript client.
              </p>
              <CodeBlock code={exampleCode} language="javascript" />
              <p className="text-lg leading-8 mt-6">
                This example demonstrates a simple GET request to the compliance endpoint. The response will contain a JSON object with the latest compliance metrics.
              </p>
            </article>
          </div>
          <div className="hidden lg:block lg:col-span-1">
            <TableOfContents headings={headings} />
          </div>
        </div>
      </main>
    </div>
  );
}
