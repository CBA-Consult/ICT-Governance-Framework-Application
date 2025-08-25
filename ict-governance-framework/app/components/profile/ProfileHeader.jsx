import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

const ProfileHeader = ({
  user,
  isEditing,
  onEditToggle,
  onPhotoUpload
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="profile-header bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white/20">
                <AvatarImage
                  src={user?.profilePicture || user?.profile_picture}
                  alt={`${user?.firstName || user?.first_name} ${user?.lastName || user?.last_name}`}
                />
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {getInitials(user?.firstName || user?.first_name, user?.lastName || user?.last_name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={onPhotoUpload}
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                aria-label="Upload profile picture"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold mb-1">
                {user?.displayName || user?.display_name || `${user?.firstName || user?.first_name} ${user?.lastName || user?.last_name}`}
              </h1>
              <p className="text-blue-100 mb-1">{user?.jobTitle || user?.job_title}</p>
              <p className="text-blue-100 mb-1">{user?.email}</p>
              <p className="text-sm text-blue-200">
                {user?.department} • Last login: {formatDate(user?.lastLogin || user?.last_login)}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
              <Button
                variant={isEditing ? "secondary" : "default"}
                onClick={onEditToggle}
                className="bg-white text-blue-600 hover:bg-gray-50"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
              <Button
                variant="outline"
                onClick={onPhotoUpload}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Upload Photo
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;