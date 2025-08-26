import React from 'react';
import FormField from './FormField';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

const PersonalInfoTab = ({
  profile,
  formData,
  isEditing,
  onInputChange,
  onSave,
  onCancel,
  saving
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="First Name"
          name="firstName"
          value={isEditing ? formData.firstName : (profile?.first_name || 'Not set')}
          onChange={onInputChange}
          disabled={!isEditing}
          required
          placeholder="Enter your first name"
        />

        <FormField
          label="Last Name"
          name="lastName"
          value={isEditing ? formData.lastName : (profile?.last_name || 'Not set')}
          onChange={onInputChange}
          disabled={!isEditing}
          required
          placeholder="Enter your last name"
        />

        <FormField
          label="Display Name"
          name="displayName"
          value={isEditing ? formData.displayName : (profile?.display_name || 'Not set')}
          onChange={onInputChange}
          disabled={!isEditing}
          placeholder="Enter your display name"
          helpText="This is how your name will appear to other users"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <div className="mt-1 text-gray-900 p-3 bg-gray-50 rounded-md border">
            {profile?.email}
          </div>
          <p className="text-xs text-gray-500">Email cannot be changed</p>
        </div>

        <FormField
          label="Phone Number"
          name="phone"
          type="tel"
          value={isEditing ? formData.phone : (profile?.phone || 'Not set')}
          onChange={onInputChange}
          disabled={!isEditing}
          placeholder="Enter your phone number"
        />

        <FormField
          label="Office Location"
          name="officeLocation"
          value={isEditing ? formData.officeLocation : (profile?.office_location || 'Not set')}
          onChange={onInputChange}
          disabled={!isEditing}
          placeholder="Enter your office location"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <div className="mt-1 text-gray-900 p-3 bg-gray-50 rounded-md border">
            {profile?.department || 'Not set'}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Job Title</label>
          <div className="mt-1 text-gray-900 p-3 bg-gray-50 rounded-md border">
            {profile?.job_title || 'Not set'}
          </div>
        </div>
      </div>

      {/* Roles and Permissions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Roles</label>
          <div className="flex flex-wrap gap-2">
            {profile?.roles?.length > 0 ? (
              profile.roles.map((role, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  {role.roleName}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No roles assigned</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Permissions</label>
          <div className="max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {profile?.permissions?.length > 0 ? (
                profile.permissions.map((permission, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    {permission}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No permissions assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoTab;