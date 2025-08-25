'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { withAuth } from '../contexts/AuthContext';

function ProfilePage() {
  const { user, apiClient, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [sessions, setSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [preferences, setPreferences] = useState({});

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/profile');
      setProfile(response.data.profile);
      setFormData({
        firstName: response.data.profile.first_name || '',
        lastName: response.data.profile.last_name || '',
        displayName: response.data.profile.display_name || '',
        phone: response.data.profile.phone || '',
        officeLocation: response.data.profile.office_location || ''
      });
      setPreferences(response.data.profile.preferences || {});
      setError(null);
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await apiClient.get('/profile/sessions');
      setSessions(response.data.sessions);
    } catch (err) {
      console.error('Sessions fetch error:', err);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await apiClient.get('/profile/activity?limit=10');
      setActivity(response.data.activities);
    } catch (err) {
      console.error('Activity fetch error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/profile', formData);
      setProfile(prev => ({ ...prev, ...response.data.profile }));
      setIsEditing(false);
      setError(null);
      
      // Update user context
      await updateUser(response.data.profile);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      displayName: profile.display_name || '',
      phone: profile.phone || '',
      officeLocation: profile.office_location || ''
    });
    setIsEditing(false);
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await apiClient.delete(`/profile/sessions/${sessionId}`);
      fetchSessions(); // Refresh sessions list
    } catch (err) {
      console.error('Session revoke error:', err);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await apiClient.delete('/profile/sessions');
      fetchSessions(); // Refresh sessions list
    } catch (err) {
      console.error('Revoke all sessions error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Error Loading Profile
            </h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              onClick={fetchProfile}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.display_name || `${profile?.first_name} ${profile?.last_name}`}
                  </h1>
                  <p className="text-gray-600">{profile?.email}</p>
                  <p className="text-sm text-gray-500">
                    {profile?.department} • {profile?.job_title}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', name: 'Profile Information' },
                { id: 'security', name: 'Security' },
                { id: 'activity', name: 'Activity' },
                { id: 'preferences', name: 'Preferences' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'security') fetchSessions();
                    if (tab.id === 'activity') fetchActivity();
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile?.first_name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile?.last_name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile?.display_name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{profile?.email}</p>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile?.phone || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Office Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="officeLocation"
                        value={formData.officeLocation}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile?.office_location || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-gray-900">{profile?.department || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                    <p className="mt-1 text-gray-900">{profile?.job_title || 'Not set'}</p>
                  </div>
                </div>

                {/* Roles and Permissions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                    <div className="space-y-1">
                      {profile?.roles?.length > 0 ? (
                        profile.roles.map((role, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2"
                          >
                            {role.roleName}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No roles assigned</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {profile?.permissions?.length > 0 ? (
                        profile.permissions.map((permission, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2 mb-1"
                          >
                            {permission}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No permissions assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className={`border rounded-lg p-4 ${
                          session.isCurrent ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">
                                {session.deviceInfo?.platform || 'Unknown Device'}
                              </h4>
                              {session.isCurrent && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">IP: {session.ipAddress}</p>
                            <p className="text-sm text-gray-600">
                              Last Activity: {formatDate(session.lastActivity)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Expires: {formatDate(session.expiresAt)}
                            </p>
                          </div>
                          {!session.isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(session.sessionId)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllSessions}
                      className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Revoke All Other Sessions
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.log_id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.activity_type}</h4>
                          <p className="text-sm text-gray-600">{item.activity_description}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(item.created_at)} • {item.ip_address}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            item.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">User Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Theme</label>
                    <p className="mt-1 text-gray-900">{preferences?.theme || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <p className="mt-1 text-gray-900">{preferences?.language || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <p className="mt-1 text-gray-900">{preferences?.timezone || 'Not set'}</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    Preference editing will be available in a future update.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component wrapped with authentication
export default withAuth(ProfilePage);