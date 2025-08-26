import React from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

const SecurityTab = ({
  sessions,
  onRevokeSession,
  onRevokeAllSessions
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">Active Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions?.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`border rounded-lg p-4 transition-colors ${
                  session.isCurrent 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {session.deviceInfo?.platform || 'Unknown Device'}
                      </h4>
                      {session.isCurrent && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          Current Session
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center space-x-2">
                        <span className="font-medium">IP Address:</span>
                        <span>{session.ipAddress}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <span className="font-medium">Last Activity:</span>
                        <span>{formatDate(session.lastActivity)}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <span className="font-medium">Expires:</span>
                        <span>{formatDate(session.expiresAt)}</span>
                      </p>
                      {session.deviceInfo?.browser && (
                        <p className="flex items-center space-x-2">
                          <span className="font-medium">Browser:</span>
                          <span>{session.deviceInfo.browser}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRevokeSession(session.sessionId)}
                      className="ml-4"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No active sessions found</p>
            </div>
          )}
          
          {sessions?.length > 1 && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="destructive"
                onClick={onRevokeAllSessions}
                className="w-full sm:w-auto"
              >
                Revoke All Other Sessions
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                This will sign you out of all other devices and browsers
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">Password & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Password</h4>
              <p className="text-sm text-gray-600">Last changed 30 days ago</p>
            </div>
            <Button variant="outline">
              Change Password
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <Button variant="outline">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;