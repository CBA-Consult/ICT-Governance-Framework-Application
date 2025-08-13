'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';

const DetailItem = ({ label, value }) => (
  <li>
    <span className="font-semibold text-gray-800 dark:text-gray-200">{label}:</span>
    <span className="text-gray-700 dark:text-gray-300 ml-2">{value}</span>
  </li>
);

export default function AppDetailsModal({ app, onClose }) {
  if (!app) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 hover:scale-100">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{app.name} Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">General</h3>
              <ul className="text-sm space-y-2">
                <DetailItem label="Score" value={`${app.complianceScore}/100`} />
                <DetailItem label="Category" value={app.category} />
                <DetailItem label="Vendor" value={app.vendor} />
                {/* Add other general details here */}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">Security & Compliance</h3>
              <ul className="text-sm space-y-2">
                <DetailItem label="Latest breach" value={app.latestBreach} />
                <DetailItem label="MFA Enabled" value={app.mfa ? 'Yes' : 'No'} />
                <DetailItem label="Data Encryption" value={app.dataAtRestEncryption} />
                {/* Add other security details here */}
              </ul>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {app.certifications && Object.entries(app.certifications).map(([key, value]) => (
                value === true && <span key={key} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">{key.toUpperCase()}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
             <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Close
              </button>
        </div>
      </div>
    </div>
  );
}
