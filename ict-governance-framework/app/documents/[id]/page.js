'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DocumentTextIcon, 
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  ArrowLeftIcon,
  EyeIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const statusColors = {
  'Draft': 'bg-gray-100 text-gray-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Approved': 'bg-green-100 text-green-800',
  'Published': 'bg-blue-100 text-blue-800',
  'Archived': 'bg-gray-100 text-gray-600',
  'Deprecated': 'bg-red-100 text-red-800'
};

const statusIcons = {
  'Draft': PencilIcon,
  'Under Review': ClockIcon,
  'Approved': CheckCircleIcon,
  'Published': CheckCircleIcon,
  'Archived': ArchiveBoxIcon,
  'Deprecated': ExclamationTriangleIcon
};

const priorityColors = {
  'Critical': 'text-red-600 bg-red-50',
  'High': 'text-orange-600 bg-orange-50',
  'Medium': 'text-yellow-600 bg-yellow-50',
  'Low': 'text-green-600 bg-green-50'
};

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchDocument();
    }
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        }
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      setDocument(data.data.document);
      setVersions(data.data.versions);
      setCurrentWorkflow(data.data.currentWorkflow);
      setRelationships(data.data.relationships);
      
      // Set the current version as selected by default
      const currentVersion = data.data.versions.find(v => v.is_current);
      setSelectedVersion(currentVersion);
    } catch (error) {
      console.error('Error fetching document:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canEdit = () => {
    return hasPermission('document.edit') && 
           (document?.owner_user_id === user?.user_id || hasPermission('document.admin'));
  };

  const canCreateVersion = () => {
    return hasPermission('version.create') && 
           (document?.owner_user_id === user?.user_id || hasPermission('document.admin'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <div className="mt-6">
            <Link
              href="/documents"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const StatusIcon = statusIcons[document.status];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/documents"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Documents
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className={`h-12 w-12 rounded-lg bg-${document.category_color || 'gray'}-100 flex items-center justify-center mr-4`}>
                  <DocumentTextIcon className={`h-8 w-8 text-${document.category_color || 'gray'}-600`} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {document.title}
                  </h1>
                  <div className="flex items-center mt-1 space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[document.status]}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {document.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${document.category_color || 'gray'}-100 text-${document.category_color || 'gray'}-800`}>
                      {document.category_name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {document.document_type}
                    </span>
                    {document.priority !== 'Medium' && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[document.priority]}`}>
                        {document.priority} Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {document.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-3xl">
                  {document.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3 ml-6">
              {canEdit() && (
                <Link
                  href={`/documents/${document.document_id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              )}
              {canCreateVersion() && (
                <Link
                  href={`/documents/${document.document_id}/new-version`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  New Version
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Document Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {document.owner_first_name} {document.owner_last_name}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentDuplicateIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Version</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedVersion?.version_number || '1.0.0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDateShort(document.updated_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Review</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {document.next_review_date ? formatDateShort(document.next_review_date) : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Workflow Alert */}
        {currentWorkflow && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 mb-8">
            <div className="flex">
              <ClockIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Approval Workflow in Progress
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  This document is currently under review. Workflow type: {currentWorkflow.workflow_type}
                </p>
                <div className="mt-3">
                  <Link
                    href={`/workflows/${currentWorkflow.workflow_id}`}
                    className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
                  >
                    View workflow details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <EyeIcon className="h-5 w-5 inline mr-2" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'versions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <DocumentDuplicateIcon className="h-5 w-5 inline mr-2" />
              Versions ({versions.length})
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metadata'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <TagIcon className="h-5 w-5 inline mr-2" />
              Metadata
            </button>
            {relationships.length > 0 && (
              <button
                onClick={() => setActiveTab('relationships')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'relationships'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <LinkIcon className="h-5 w-5 inline mr-2" />
                Related Documents ({relationships.length})
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {activeTab === 'content' && (
            <div className="p-6">
              {selectedVersion ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Document Content - Version {selectedVersion.version_number}
                    </h3>
                    {selectedVersion.change_summary && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedVersion.change_summary}
                      </span>
                    )}
                  </div>
                  
                  <div className="prose dark:prose-invert max-w-none">
                    {selectedVersion.content_type === 'markdown' ? (
                      <div className="whitespace-pre-wrap">{selectedVersion.content}</div>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No content available</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This document doesn't have any content yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="p-6">
              <div className="space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.version_id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedVersion?.version_id === version.version_id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            version.is_current 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            v{version.version_number}
                            {version.is_current && ' (Current)'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {version.change_summary}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {version.change_type} change by {version.created_by_first_name} {version.created_by_last_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(version.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Document Information</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Document ID</dt>
                      <dd className="text-sm text-gray-900 dark:text-white font-mono">{document.document_id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{formatDate(document.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Last Updated</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{formatDate(document.updated_at)}</dd>
                    </div>
                    {document.effective_date && (
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Effective Date</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatDateShort(document.effective_date)}</dd>
                      </div>
                    )}
                    {document.expiry_date && (
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Expiry Date</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatDateShort(document.expiry_date)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Review Information</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Review Frequency</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        Every {document.review_frequency_months} months
                      </dd>
                    </div>
                    {document.next_review_date && (
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Next Review</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatDateShort(document.next_review_date)}</dd>
                      </div>
                    )}
                    {document.approver_first_name && (
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Approver</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {document.approver_first_name} {document.approver_last_name}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {document.tags && document.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {document.compliance_frameworks && document.compliance_frameworks.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Compliance Frameworks</h4>
                    <div className="flex flex-wrap gap-2">
                      {document.compliance_frameworks.map((framework, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {framework}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'relationships' && (
            <div className="p-6">
              <div className="space-y-4">
                {relationships.map((relationship) => (
                  <div
                    key={`${relationship.target_document_id}-${relationship.relationship_type}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <LinkIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {relationship.target_title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {relationship.relationship_type} • {relationship.target_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[relationship.target_status]}`}>
                          {relationship.target_status}
                        </span>
                        <Link
                          href={`/documents/${relationship.target_document_id}`}
                          className="ml-3 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}