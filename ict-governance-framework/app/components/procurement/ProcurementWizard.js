'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/solid';

const steps = [
  { id: 'Step 1', name: 'Application Details' },
  { id: 'Step 2', name: 'Business Justification' },
  { id: 'Step 3', name: 'Security & Compliance' },
  { id: 'Step 4', name: 'Review & Submit' },
];

export default function ProcurementWizard({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    applicationName: '',
    vendor: '',
    department: '',
    businessJustification: '',
    estimatedUsers: '',
    estimatedCost: '',
    urgency: 'Medium',
    dataClassification: 'Business',
    complianceRequirements: [],
  });

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const variants = {
    initial: { x: 300, opacity: 0 },
    enter: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Application Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {index + 1}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{step.id}</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{step.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={variants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5 }}
            >
              {/* Render current step component */}
              {currentStep === 0 && <Step1 formData={formData} setFormData={setFormData} />}
              {currentStep === 1 && <Step2 formData={formData} setFormData={setFormData} />}
              {currentStep === 2 && <Step3 formData={formData} setFormData={setFormData} />}
              {currentStep === 3 && <Step4 formData={formData} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button onClick={handlePrev} disabled={currentStep === 0} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50">
            Previous
          </button>
          <button onClick={handleNext} disabled={currentStep === steps.length - 1} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            Next
          </button>
          {currentStep === steps.length - 1 && (
            <button onClick={onClose} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Submit Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components (defined in the same file for mockup simplicity)

const Step1 = ({ formData, setFormData }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Application Details</h3>
    <div className="space-y-4">
      <input type="text" placeholder="Application Name" value={formData.applicationName} onChange={(e) => setFormData({ ...formData, applicationName: e.target.value })} className="w-full p-2 border rounded" />
      <input type="text" placeholder="Vendor" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full p-2 border rounded" />
      <input type="text" placeholder="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full p-2 border rounded" />
    </div>
  </div>
);

const Step2 = ({ formData, setFormData }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Business Justification</h3>
    <div className="space-y-4">
      <textarea placeholder="Business Justification" value={formData.businessJustification} onChange={(e) => setFormData({ ...formData, businessJustification: e.target.value })} className="w-full p-2 border rounded" />
      <input type="number" placeholder="Estimated Users" value={formData.estimatedUsers} onChange={(e) => setFormData({ ...formData, estimatedUsers: e.target.value })} className="w-full p-2 border rounded" />
      <input type="text" placeholder="Estimated Cost" value={formData.estimatedCost} onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })} className="w-full p-2 border rounded" />
    </div>
  </div>
);

const Step3 = ({ formData, setFormData }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Security & Compliance</h3>
    <div className="space-y-4">
      <select value={formData.dataClassification} onChange={(e) => setFormData({ ...formData, dataClassification: e.target.value })} className="w-full p-2 border rounded">
        <option>Public</option>
        <option>Internal</option>
        <option>Business</option>
        <option>Confidential</option>
      </select>
      <div>
        <label className="block mb-2">Compliance Requirements:</label>
        {['GDPR', 'SOC2', 'HIPAA'].map(req => (
          <label key={req} className="flex items-center">
            <input
              type="checkbox"
              checked={formData.complianceRequirements.includes(req)}
              onChange={(e) => {
                const updatedReqs = e.target.checked
                  ? [...formData.complianceRequirements, req]
                  : formData.complianceRequirements.filter(r => r !== req);
                setFormData({ ...formData, complianceRequirements: updatedReqs });
              }}
              className="mr-2"
            />
            {req}
          </label>
        ))}
      </div>
    </div>
  </div>
);

const Step4 = ({ formData }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Review & Submit</h3>
    <div className="space-y-2 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
      {Object.entries(formData).map(([key, value]) => (
        <div key={key}>
          <span className="font-bold">{key}: </span>
          <span>{Array.isArray(value) ? value.join(', ') : value}</span>
        </div>
      ))}
    </div>
  </div>
);
