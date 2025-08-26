'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { withAuth } from '../contexts/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import TabNavigation from '../components/profile/TabNavigation';
import PersonalInfoTab from '../components/profile/PersonalInfoTab';
import SecurityTab from '../components/profile/SecurityTab';
import ActivityTab from '../components/profile/ActivityTab';
import PreferencesTab from '../components/profile/PreferencesTab';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';

function ProfilePage() {
  const { user, apiClient, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [sessions, setSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [preferences, setPreferences] = useState({});

  // Tab configuration with icons
  const tabs = [
    {
      id: 'personal',
      label: 'Personal Information',
      shortLabel: 'Info',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'security',
      label: 'Security & Privacy',
      shortLabel: 'Security',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      id: 'activity',
      label: 'Activity & Audit',
      shortLabel: 'Activity',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'preferences',
      label: 'Preferences',
      shortLabel: 'Prefs',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

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

  const handlePhotoUpload = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        try {
          const response = await apiClient.post('/profile/upload-picture', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Update profile with new picture URL
          setProfile(prev => ({ 
            ...prev, 
            profile_picture: response.data.profilePictureUrl 
          }));
          
          // Update user context
          await updateUser({ 
            ...user, 
            profilePicture: response.data.profilePictureUrl 
          });
        } catch (err) {
          setError('Failed to upload profile picture');
          console.error('Photo upload error:', err);
        }
      }
    };
    input.click();
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Fetch data when switching to specific tabs
    if (tabId === 'security') {
      fetchSessions();
    } else if (tabId === 'activity') {
      fetchActivity();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Profile
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchProfile}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
        {/* Profile Header */}
        <ProfileHeader
          user={profile}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onPhotoUpload={handlePhotoUpload}
        />

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content with Tabs */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              tabs={tabs}
            />

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="personal" className="mt-0">
                <PersonalInfoTab
                  profile={profile}
                  formData={formData}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                  onSave={handleSaveProfile}
                  onCancel={handleCancelEdit}
                  saving={saving}
                />
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <SecurityTab
                  sessions={sessions}
                  onRevokeSession={handleRevokeSession}
                  onRevokeAllSessions={handleRevokeAllSessions}
                />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <ActivityTab activity={activity} />
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">
                <PreferencesTab preferences={preferences} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Export the component wrapped with authentication
export default withAuth(ProfilePage);