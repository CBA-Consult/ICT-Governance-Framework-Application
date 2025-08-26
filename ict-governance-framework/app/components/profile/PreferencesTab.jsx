import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

const PreferencesTab = ({ preferences }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">User Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Theme</label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <span className="text-gray-900">{preferences?.theme || 'System Default'}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <span className="text-gray-900">{preferences?.language || 'English (US)'}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <span className="text-gray-900">{preferences?.timezone || 'UTC'}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date Format</label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <span className="text-gray-900">{preferences?.dateFormat || 'MM/DD/YYYY'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900">Notification Preferences</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Email Notifications</h5>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  {preferences?.emailNotifications ? 'Enabled' : 'Disabled'}
                </span>
                <div className={`w-10 h-6 rounded-full ${preferences?.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'} relative transition-colors`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${preferences?.emailNotifications ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Browser Notifications</h5>
                <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  {preferences?.browserNotifications ? 'Enabled' : 'Disabled'}
                </span>
                <div className={`w-10 h-6 rounded-full ${preferences?.browserNotifications ? 'bg-blue-600' : 'bg-gray-300'} relative transition-colors`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${preferences?.browserNotifications ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Security Alerts</h5>
                <p className="text-sm text-gray-600">Receive alerts about security events</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  {preferences?.securityAlerts !== false ? 'Enabled' : 'Disabled'}
                </span>
                <div className={`w-10 h-6 rounded-full ${preferences?.securityAlerts !== false ? 'bg-blue-600' : 'bg-gray-300'} relative transition-colors`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${preferences?.securityAlerts !== false ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Coming Soon</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Preference editing will be available in a future update. Contact your administrator to modify these settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" disabled>
            Edit Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesTab;