'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function CommunicationCenter() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('channels');
  const [channels, setChannels] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    channel_type: '',
    status: 'active',
    category: ''
  });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'channels':
          await fetchChannels();
          break;
        case 'announcements':
          await fetchAnnouncements();
          break;
        case 'templates':
          await fetchTemplates();
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    const params = new URLSearchParams({
      limit: 50,
      offset: 0,
      ...filters
    });

    const response = await fetch(`/api/communication/channels?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch communication channels');
    }

    const data = await response.json();
    setChannels(data);
  };

  const fetchAnnouncements = async () => {
    const params = new URLSearchParams({
      limit: 50,
      offset: 0,
      ...filters
    });

    const response = await fetch(`/api/announcements?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }

    const data = await response.json();
    setAnnouncements(data.announcements || []);
  };

  const fetchTemplates = async () => {
    const params = new URLSearchParams({
      limit: 50,
      offset: 0,
      is_active: true
    });

    const response = await fetch(`/api/communication-templates?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch communication templates');
    }

    const data = await response.json();
    setTemplates(data.templates || []);
  };

  const handleCreateChannel = () => {
    // Navigate to create channel page
    window.location.href = '/communication/channels/create';
  };

  const handleCreateAnnouncement = () => {
    // Navigate to create announcement page
    window.location.href = '/announcements/create';
  };

  const handleCreateTemplate = () => {
    // Navigate to create template page
    window.location.href = '/communication/templates/create';
  };

  const getChannelIcon = (channelType) => {
    switch (channelType) {
      case 'team':
        return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case 'project':
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      case 'announcement':
        return <SpeakerWaveIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'High':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredItems = () => {
    let items = [];
    
    switch (activeTab) {
      case 'channels':
        items = channels;
        break;
      case 'announcements':
        items = announcements;
        break;
      case 'templates':
        items = templates;
        break;
    }

    if (!searchTerm) return items;

    return items.filter(item => {
      const searchFields = [
        item.channel_name || item.title || item.template_name,
        item.description || item.content || item.category
      ];
      
      return searchFields.some(field => 
        field && field.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const tabs = [
    { id: 'channels', name: 'Channels', icon: ChatBubbleLeftRightIcon },
    { id: 'announcements', name: 'Announcements', icon: SpeakerWaveIcon },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Communication Center
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage channels, announcements, and communication templates
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                {activeTab === 'channels' && (
                  <button
                    onClick={handleCreateChannel}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Channel
                  </button>
                )}
                
                {activeTab === 'announcements' && (
                  <button
                    onClick={handleCreateAnnouncement}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Announcement
                  </button>
                )}
                
                {activeTab === 'templates' && (
                  <button
                    onClick={handleCreateTemplate}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Template
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading {activeTab}...</p>
            </div>
          ) : filteredItems().length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No {activeTab} found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Channels */}
              {activeTab === 'channels' && filteredItems().map(channel => (
                <div
                  key={channel.channel_id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => window.location.href = `/communication/channels/${channel.channel_id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getChannelIcon(channel.channel_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {channel.channel_name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {channel.description}
                          </p>
                          
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {channel.member_count} members
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {channel.channel_type}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Updated {formatRelativeTime(channel.updated_at)}
                            </span>
                            {channel.unread_count > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {channel.unread_count} unread
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Announcements */}
              {activeTab === 'announcements' && filteredItems().map(announcement => (
                <div
                  key={announcement.announcement_id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => window.location.href = `/announcements/${announcement.announcement_id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <SpeakerWaveIcon className="h-5 w-5 text-purple-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {announcement.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {announcement.content}
                          </p>
                          
                          <div className="mt-2 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              getPriorityColor(announcement.priority)
                            }`}>
                              {announcement.priority}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {announcement.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(announcement.created_at)}
                            </span>
                            {!announcement.read_at && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Templates */}
              {activeTab === 'templates' && filteredItems().map(template => (
                <div
                  key={template.template_id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => window.location.href = `/communication/templates/${template.template_id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <DocumentTextIcon className="h-5 w-5 text-green-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {template.template_name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {template.subject_template}
                          </p>
                          
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {template.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {template.template_type}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Created {formatRelativeTime(template.created_at)}
                            </span>
                            <div className="flex items-center space-x-1">
                              {template.delivery_channels?.includes('email') && (
                                <EnvelopeIcon className="h-3 w-3 text-gray-400" title="Email" />
                              )}
                              {template.delivery_channels?.includes('sms') && (
                                <DevicePhoneMobileIcon className="h-3 w-3 text-gray-400" title="SMS" />
                              )}
                              {template.delivery_channels?.includes('in_app') && (
                                <ChatBubbleLeftRightIcon className="h-3 w-3 text-gray-400" title="In-App" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}