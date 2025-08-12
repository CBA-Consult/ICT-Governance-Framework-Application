"use client";
import React, { useState } from 'react';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    category: '',
    priority: 'Medium',
    subject: '',
    description: '',
    contactInfo: '',
    anonymous: false,
    attachments: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const categories = [
    { value: 'Policy', label: 'Policy & Governance' },
    { value: 'Process', label: 'Process & Procedures' },
    { value: 'Technology', label: 'Technology & Systems' },
    { value: 'Service', label: 'Service Delivery' },
    { value: 'Compliance', label: 'Compliance & Risk' },
    { value: 'Training', label: 'Training & Support' },
    { value: 'Other', label: 'Other' }
  ];

  const priorities = [
    { value: 'Critical', label: 'Critical - Business Impact', color: 'text-red-600' },
    { value: 'High', label: 'High - Significant Issue', color: 'text-orange-600' },
    { value: 'Medium', label: 'Medium - Standard Request', color: 'text-yellow-600' },
    { value: 'Low', label: 'Low - Enhancement/Suggestion', color: 'text-green-600' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'attachments') {
          formData.attachments.forEach(file => {
            formDataToSend.append('attachments', file);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitStatus({
          type: 'success',
          message: `Feedback submitted successfully! Reference ID: ${result.feedbackId}`,
          feedbackId: result.feedbackId
        });
        // Reset form
        setFormData({
          category: '',
          priority: 'Medium',
          subject: '',
          description: '',
          contactInfo: '',
          anonymous: false,
          attachments: []
        });
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit feedback. Please try again or contact support.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">ICT Governance Feedback</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Your feedback helps us improve our governance processes, policies, and services. 
              All feedback is reviewed and responded to according to our service level agreements.
            </p>
          </div>

          {submitStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              submitStatus.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {submitStatus.type === 'success' ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{submitStatus.message}</p>
                  {submitStatus.feedbackId && (
                    <p className="text-sm mt-1">
                      You can track the status of your feedback using this reference ID.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Feedback Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Priority Selection */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-2">
                Priority Level *
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select the appropriate priority based on business impact and urgency.
              </p>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                maxLength={200}
                placeholder="Brief summary of your feedback"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Detailed Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={6}
                maxLength={2000}
                placeholder="Please provide detailed information about your feedback, including specific examples, expected outcomes, and any relevant context."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium mb-2">
                Contact Information
              </label>
              <input
                type="email"
                id="contactInfo"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleInputChange}
                placeholder="your.email@company.com"
                disabled={formData.anonymous}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
              <div className="mt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="anonymous"
                    checked={formData.anonymous}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                    Submit anonymously (no follow-up possible)
                  </span>
                </label>
              </div>
            </div>

            {/* File Attachments */}
            <div>
              <label htmlFor="attachments" className="block text-sm font-medium mb-2">
                Attachments (Optional)
              </label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.pptx"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Supported formats: PDF, Word, Excel, PowerPoint, Text, Images (max 10MB per file)
              </p>
              
              {formData.attachments.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Attached Files:</h4>
                  <ul className="space-y-1">
                    {formData.attachments.map((file, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Service Level Agreement Information */}
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Response Time Expectations
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li><strong>Critical:</strong> Acknowledgment within 15 minutes, Response within 2 hours</li>
                <li><strong>High:</strong> Acknowledgment within 15 minutes, Response within 8 hours</li>
                <li><strong>Medium:</strong> Acknowledgment within 15 minutes, Response within 24 hours</li>
                <li><strong>Low:</strong> Acknowledgment within 15 minutes, Response within 72 hours</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    category: '',
                    priority: 'Medium',
                    subject: '',
                    description: '',
                    contactInfo: '',
                    anonymous: false,
                    attachments: []
                  });
                  setSubmitStatus(null);
                }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;