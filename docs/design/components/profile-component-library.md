# Profile Page Component Library

## Overview

This document defines the reusable components for the user profile page, providing specifications for consistent implementation across the ICT Governance Framework.

## Component Hierarchy

```
ProfilePage
├── ProfileHeader
│   ├── ProfileAvatar
│   ├── ProfileInfo
│   └── ProfileActions
├── TabNavigation
│   └── TabButton
├── ContentArea
│   ├── PersonalInfoTab
│   │   ├── FormSection
│   │   ├── FormField
│   │   └── RolesBadges
│   ├── SecurityTab
│   │   ├── SessionCard
│   │   └── SecurityActions
│   ├── ActivityTab
│   │   ├── ActivityItem
│   │   └── ActivityFilter
│   └── PreferencesTab
│       └── PreferenceGroup
└── FormActions
    ├── Button
    └── LoadingSpinner
```

## Core Components

### 1. ProfileHeader Component

#### Purpose
Displays user's primary information and quick actions at the top of the profile page.

#### Props
```typescript
interface ProfileHeaderProps {
  user: User;
  isEditing: boolean;
  onEditToggle: () => void;
  onPhotoUpload: (file: File) => void;
  onSecurityClick: () => void;
}
```

#### Implementation
```jsx
import React from 'react';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileInfo } from './ProfileInfo';
import { ProfileActions } from './ProfileActions';

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isEditing,
  onEditToggle,
  onPhotoUpload,
  onSecurityClick
}) => {
  return (
    <div className="profile-header">
      <div className="profile-header-content">
        <ProfileAvatar
          src={user.profilePicture}
          alt={`${user.firstName} ${user.lastName}`}
          size="large"
          onUpload={onPhotoUpload}
          editable={isEditing}
        />
        
        <ProfileInfo
          user={user}
          className="profile-info"
        />
        
        <ProfileActions
          isEditing={isEditing}
          onEditToggle={onEditToggle}
          onSecurityClick={onSecurityClick}
        />
      </div>
    </div>
  );
};
```

#### Styling
```css
.profile-header {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.profile-header-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

@media (max-width: 768px) {
  .profile-header {
    padding: 16px;
  }
  
  .profile-header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}
```

### 2. ProfileAvatar Component

#### Purpose
Displays user's profile picture with upload functionality.

#### Props
```typescript
interface ProfileAvatarProps {
  src?: string;
  alt: string;
  size: 'small' | 'medium' | 'large';
  editable?: boolean;
  onUpload?: (file: File) => void;
}
```

#### Implementation
```jsx
import React, { useRef } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt,
  size = 'medium',
  editable = false,
  onUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-20 h-20'
  };

  return (
    <div className={`profile-avatar ${sizeClasses[size]}`}>
      <img
        src={src || '/default-avatar.png'}
        alt={alt}
        className="profile-avatar-image"
      />
      
      {editable && (
        <>
          <button
            onClick={handleUploadClick}
            className="profile-avatar-upload"
            aria-label="Upload profile picture"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
    </div>
  );
};
```

#### Styling
```css
.profile-avatar {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.profile-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-upload {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: white;
  border-radius: 50%;
  padding: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.profile-avatar-upload:hover {
  transform: scale(1.1);
}
```

### 3. TabNavigation Component

#### Purpose
Provides navigation between different sections of the profile page.

#### Props
```typescript
interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
}

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}
```

#### Implementation
```jsx
import React from 'react';

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs
}) => {
  return (
    <nav className="tab-navigation" role="tablist">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </nav>
  );
};

const TabButton: React.FC<{
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}> = ({ tab, isActive, onClick }) => {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      className={`tab-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {tab.icon && <tab.icon className="tab-icon" />}
      <span className="tab-label">{tab.label}</span>
      {tab.badge && (
        <span className="tab-badge">{tab.badge}</span>
      )}
    </button>
  );
};
```

#### Styling
```css
.tab-navigation {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-navigation::-webkit-scrollbar {
  display: none;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: fit-content;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.tab-badge {
  background: #ef4444;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

@media (max-width: 768px) {
  .tab-button {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .tab-label {
    display: none;
  }
  
  .tab-icon {
    width: 20px;
    height: 20px;
  }
}
```

### 4. FormField Component

#### Purpose
Reusable form input component with validation and accessibility features.

#### Props
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}
```

#### Implementation
```jsx
import React from 'react';

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  helpText,
  required = false,
  disabled = false,
  placeholder
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`form-input ${error ? 'error' : ''}`}
        aria-describedby={
          error ? `${name}-error` : helpText ? `${name}-help` : undefined
        }
        aria-invalid={!!error}
      />
      
      {error && (
        <p id={`${name}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={`${name}-help`} className="form-help">
          {helpText}
        </p>
      )}
    </div>
  );
};
```

#### Styling
```css
.form-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.required-indicator {
  color: #ef4444;
  margin-left: 4px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.form-help {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .form-input {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 14px 16px;
  }
}
```

### 5. SessionCard Component

#### Purpose
Displays information about active user sessions with management actions.

#### Props
```typescript
interface SessionCardProps {
  session: UserSession;
  isCurrent: boolean;
  onRevoke: (sessionId: string) => void;
}

interface UserSession {
  sessionId: string;
  deviceInfo: {
    platform: string;
    browser: string;
  };
  ipAddress: string;
  lastActivity: string;
  expiresAt: string;
  location?: string;
}
```

#### Implementation
```jsx
import React from 'react';
import { 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon
} from '@heroicons/react/24/outline';

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isCurrent,
  onRevoke
}) => {
  const getDeviceIcon = () => {
    const platform = session.deviceInfo.platform.toLowerCase();
    if (platform.includes('mobile') || platform.includes('iphone') || platform.includes('android')) {
      return DevicePhoneMobileIcon;
    }
    if (platform.includes('tablet') || platform.includes('ipad')) {
      return DeviceTabletIcon;
    }
    return ComputerDesktopIcon;
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <div className={`session-card ${isCurrent ? 'current' : ''}`}>
      <div className="session-header">
        <div className="session-device">
          <DeviceIcon className="device-icon" />
          <div className="device-info">
            <h4 className="device-name">
              {session.deviceInfo.platform}
            </h4>
            <p className="device-browser">
              {session.deviceInfo.browser}
            </p>
          </div>
        </div>
        
        {isCurrent && (
          <span className="current-badge">Current Session</span>
        )}
      </div>
      
      <div className="session-details">
        <p className="session-detail">
          <span className="detail-label">IP Address:</span>
          {session.ipAddress}
        </p>
        <p className="session-detail">
          <span className="detail-label">Last Activity:</span>
          {new Date(session.lastActivity).toLocaleString()}
        </p>
        <p className="session-detail">
          <span className="detail-label">Expires:</span>
          {new Date(session.expiresAt).toLocaleString()}
        </p>
        {session.location && (
          <p className="session-detail">
            <span className="detail-label">Location:</span>
            {session.location}
          </p>
        )}
      </div>
      
      {!isCurrent && (
        <div className="session-actions">
          <button
            onClick={() => onRevoke(session.sessionId)}
            className="revoke-button"
          >
            Revoke Session
          </button>
        </div>
      )}
    </div>
  );
};
```

#### Styling
```css
.session-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  transition: border-color 0.2s ease;
}

.session-card.current {
  border-color: #10b981;
  background: #f0fdf4;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.session-device {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  width: 24px;
  height: 24px;
  color: #6b7280;
}

.device-name {
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.device-browser {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.current-badge {
  background: #10b981;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.session-details {
  margin-bottom: 12px;
}

.session-detail {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0;
}

.detail-label {
  font-weight: 500;
  color: #374151;
  margin-right: 8px;
}

.session-actions {
  display: flex;
  justify-content: flex-end;
}

.revoke-button {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.revoke-button:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .current-badge {
    align-self: flex-start;
  }
}
```

### 6. Button Component

#### Purpose
Standardized button component with multiple variants and states.

#### Props
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

#### Implementation
```jsx
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button'
}) => {
  const baseClasses = 'button';
  const variantClasses = `button-${variant}`;
  const sizeClasses = `button-${size}`;
  const fullWidthClass = fullWidth ? 'button-full-width' : '';
  
  const className = [
    baseClasses,
    variantClasses,
    sizeClasses,
    fullWidthClass
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <LoadingSpinner size="small" />}
      <span className={loading ? 'button-content-loading' : ''}>
        {children}
      </span>
    </button>
  );
};
```

#### Styling
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  font-family: inherit;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.button-primary {
  background: #2563eb;
  color: white;
}

.button-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.button-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.button-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.button-danger {
  background: #ef4444;
  color: white;
}

.button-danger:hover:not(:disabled) {
  background: #dc2626;
}

.button-ghost {
  background: transparent;
  color: #6b7280;
}

.button-ghost:hover:not(:disabled) {
  background: #f9fafb;
  color: #374151;
}

/* Sizes */
.button-small {
  padding: 8px 12px;
  font-size: 14px;
}

.button-medium {
  padding: 12px 16px;
  font-size: 14px;
}

.button-large {
  padding: 16px 24px;
  font-size: 16px;
}

/* Full width */
.button-full-width {
  width: 100%;
}

/* Loading state */
.button-content-loading {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .button-small {
    padding: 10px 14px;
    min-height: 44px;
  }
  
  .button-medium {
    padding: 14px 18px;
    min-height: 44px;
  }
  
  .button-large {
    padding: 18px 26px;
    min-height: 48px;
  }
}
```

## Usage Examples

### Basic Profile Page Setup

```jsx
import React, { useState } from 'react';
import { ProfileHeader } from './components/ProfileHeader';
import { TabNavigation } from './components/TabNavigation';
import { FormField } from './components/FormField';
import { Button } from './components/Button';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1 (555) 123-4567'
  });

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: UserIcon },
    { id: 'security', label: 'Security', icon: LockClosedIcon },
    { id: 'activity', label: 'Activity', icon: ClockIcon },
    { id: 'preferences', label: 'Preferences', icon: CogIcon }
  ];

  return (
    <div className="profile-page">
      <ProfileHeader
        user={user}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onPhotoUpload={handlePhotoUpload}
        onSecurityClick={() => setActiveTab('security')}
      />
      
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />
      
      <div className="content-area">
        {activeTab === 'personal' && (
          <div className="personal-info-tab">
            <FormField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
              required
            />
            
            <FormField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
              required
            />
            
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

## Testing Guidelines

### Unit Testing
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders label and input correctly', () => {
    render(
      <FormField
        label="First Name"
        name="firstName"
        value=""
        onChange={() => {}}
      />
    );
    
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
  });
  
  it('shows error message when error prop is provided', () => {
    render(
      <FormField
        label="First Name"
        name="firstName"
        value=""
        onChange={() => {}}
        error="This field is required"
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});
```

### Accessibility Testing
```jsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('ProfileHeader accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<ProfileHeader {...props} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Performance Considerations

### Code Splitting
```jsx
import { lazy, Suspense } from 'react';

const SecurityTab = lazy(() => import('./SecurityTab'));
const ActivityTab = lazy(() => import('./ActivityTab'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <SecurityTab />
</Suspense>
```

### Memoization
```jsx
import { memo, useMemo } from 'react';

export const FormField = memo(({ label, name, value, onChange, ...props }) => {
  const inputId = useMemo(() => `${name}-${Math.random()}`, [name]);
  
  // Component implementation
});
```

This component library provides a solid foundation for building a consistent and accessible user profile interface while maintaining flexibility for future enhancements.