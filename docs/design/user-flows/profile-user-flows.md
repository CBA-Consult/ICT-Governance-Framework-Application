# User Profile Page - User Flows and Interactions

## Overview

This document outlines the complete user flows and interaction patterns for the user profile page, providing detailed guidance for user experience design and development implementation.

## Table of Contents

1. [Primary User Flows](#primary-user-flows)
2. [Secondary User Flows](#secondary-user-flows)
3. [Error Handling Flows](#error-handling-flows)
4. [Interaction Patterns](#interaction-patterns)
5. [State Management](#state-management)
6. [Accessibility Flows](#accessibility-flows)
7. [Mobile-Specific Flows](#mobile-specific-flows)

## Primary User Flows

### 1. Profile Information Update Flow

#### Flow Diagram
```
[Profile Page Load] 
        ↓
[View Profile Information]
        ↓
[Click "Edit Profile"] ← User Decision Point
        ↓
[Enter Edit Mode]
        ↓
[Modify Form Fields] ← Validation occurs in real-time
        ↓
[Click "Save Changes"] ← User Decision Point
        ↓
[Validation Check] → [Show Errors] → [Return to Edit Mode]
        ↓ (if valid)
[Submit to Server]
        ↓
[Success Response] → [Update UI] → [Show Success Message] → [Exit Edit Mode]
        ↓ (if error)
[Show Error Message] → [Remain in Edit Mode]
```

#### Detailed Steps

**Step 1: Profile Page Load**
- User navigates to profile page
- System loads current profile data
- Display loading state while fetching data
- Show profile information in read-only mode

**Step 2: Initiate Edit Mode**
- User clicks "Edit Profile" button
- Form fields become editable
- Button changes to "Cancel" and "Save Changes"
- Focus moves to first editable field

**Step 3: Form Interaction**
- User modifies desired fields
- Real-time validation provides immediate feedback
- Field-level error messages appear below invalid fields
- Save button remains disabled until all validations pass

**Step 4: Save Changes**
- User clicks "Save Changes" button
- Form data is validated client-side
- If valid, submit to server with loading indicator
- If invalid, highlight errors and focus first error field

**Step 5: Success Handling**
- Server responds with updated profile data
- UI updates with new information
- Success message appears briefly
- Form exits edit mode
- User context is updated

#### User Actions and System Responses

| User Action | System Response | Visual Feedback |
|-------------|-----------------|-----------------|
| Click "Edit Profile" | Enable form fields | Button text changes, fields become editable |
| Type in field | Real-time validation | Border color changes, error/success indicators |
| Click "Cancel" | Revert changes | Confirmation dialog if changes exist |
| Click "Save" | Submit form | Loading spinner, disabled button |
| Successful save | Update display | Success message, exit edit mode |
| Save error | Show error | Error message, remain in edit mode |

### 2. Profile Picture Upload Flow

#### Flow Diagram
```
[Profile Page]
        ↓
[Click Camera Icon] ← User Decision Point
        ↓
[File Picker Opens] ← System Action
        ↓
[User Selects Image] ← User Decision Point
        ↓
[Image Validation] → [Show Error] → [Return to File Picker]
        ↓ (if valid)
[Show Image Preview]
        ↓
[User Confirms Upload] ← User Decision Point
        ↓
[Upload to Server] ← Show Progress
        ↓
[Success Response] → [Update Profile Picture] → [Show Success Message]
        ↓ (if error)
[Show Error Message] → [Retain Previous Image]
```

#### Detailed Steps

**Step 1: Initiate Upload**
- User clicks camera icon on profile picture
- File picker dialog opens
- Accept only image files (jpg, png, gif, webp)
- Maximum file size: 5MB

**Step 2: Image Selection**
- User selects image file
- Client-side validation checks file type and size
- If invalid, show error message and return to picker
- If valid, proceed to preview

**Step 3: Image Preview**
- Display selected image in preview modal
- Show crop/resize options if needed
- Provide "Cancel" and "Upload" buttons
- Show file size and dimensions

**Step 4: Upload Process**
- User confirms upload
- Show progress bar during upload
- Disable other actions during upload
- Handle upload cancellation

**Step 5: Upload Completion**
- Server processes and stores image
- Update profile picture in UI
- Show success notification
- Close preview modal

### 3. Security Settings Management Flow

#### Flow Diagram
```
[Profile Page]
        ↓
[Click "Security" Tab] ← User Decision Point
        ↓
[Load Security Data]
        ↓
[Display Active Sessions]
        ↓
[User Reviews Sessions] ← User Decision Point
        ↓
[Click "Revoke Session"] ← User Decision Point
        ↓
[Confirmation Dialog] ← System Action
        ↓
[User Confirms] ← User Decision Point
        ↓
[Revoke Session] → [Update Session List] → [Show Success Message]
        ↓ (if error)
[Show Error Message] → [Retain Session List]
```

#### Session Management Actions

**View Active Sessions**
- Display all active sessions
- Show device information, IP address, last activity
- Highlight current session
- Provide revoke action for other sessions

**Revoke Individual Session**
- User clicks "Revoke" on specific session
- Show confirmation dialog with session details
- User confirms revocation
- Session is invalidated on server
- Session removed from list

**Revoke All Other Sessions**
- User clicks "Revoke All Other Sessions"
- Show confirmation dialog with count
- User confirms mass revocation
- All sessions except current are invalidated
- Session list updates to show only current session

## Secondary User Flows

### 1. Activity History Review Flow

#### Flow Diagram
```
[Security Tab]
        ↓
[Click "Activity" Tab] ← User Decision Point
        ↓
[Load Activity Data]
        ↓
[Display Recent Activities]
        ↓
[User Reviews Activities] ← User Decision Point
        ↓
[Apply Filters] ← Optional User Action
        ↓
[Load More Activities] ← Optional User Action
        ↓
[Export Activity Log] ← Optional User Action
```

#### Activity Features
- **Filter by Type**: Login, Profile Update, Password Change, etc.
- **Date Range**: Last 7 days, 30 days, 90 days, Custom
- **Search**: Search by IP address or activity description
- **Export**: Download activity log as CSV or PDF

### 2. Preferences Configuration Flow

#### Flow Diagram
```
[Profile Page]
        ↓
[Click "Preferences" Tab] ← User Decision Point
        ↓
[Load User Preferences]
        ↓
[Display Preference Categories]
        ↓
[User Modifies Settings] ← User Decision Point
        ↓
[Auto-save Preferences] ← System Action
        ↓
[Show Save Confirmation] → [Apply New Settings]
```

#### Preference Categories
- **Interface**: Theme, Language, Timezone
- **Notifications**: Email, SMS, In-app preferences
- **Privacy**: Data sharing, Activity visibility
- **Accessibility**: Screen reader, High contrast, Font size

## Error Handling Flows

### 1. Network Error Flow

#### Flow Diagram
```
[User Action] → [Network Request]
        ↓
[Network Timeout/Error] ← System Detection
        ↓
[Show Error Message] ← System Response
        ↓
[Provide Retry Option] ← System Action
        ↓
[User Clicks Retry] ← User Decision Point
        ↓
[Retry Request] → [Success] → [Continue Normal Flow]
        ↓ (if still fails)
[Show Persistent Error] → [Provide Alternative Actions]
```

#### Error Types and Responses

| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| Network Timeout | "Connection timed out. Please try again." | Retry button |
| Server Error | "Something went wrong. Please try again later." | Retry button + Support link |
| Validation Error | Specific field error messages | Highlight fields, focus first error |
| Permission Error | "You don't have permission to perform this action." | Contact admin link |
| File Upload Error | "File upload failed. Please check file size and format." | Try again with different file |

### 2. Validation Error Flow

#### Flow Diagram
```
[User Input] → [Real-time Validation]
        ↓
[Validation Fails] ← System Check
        ↓
[Show Field Error] ← System Response
        ↓
[User Corrects Input] ← User Action
        ↓
[Re-validate] → [Validation Passes] → [Clear Error]
        ↓ (if still invalid)
[Maintain Error State] → [Provide Help Text]
```

#### Validation Rules

**First Name / Last Name**
- Required field
- 2-50 characters
- Letters, spaces, hyphens, apostrophes only
- No leading/trailing spaces

**Phone Number**
- Optional field
- Valid phone format
- International formats accepted
- Auto-formatting applied

**Email Address**
- Read-only (cannot be changed)
- Valid email format
- Unique in system

## Interaction Patterns

### 1. Form Interaction Patterns

#### Edit Mode Toggle
```javascript
// State management for edit mode
const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState(initialData);
const [originalData, setOriginalData] = useState(initialData);

// Enter edit mode
const enterEditMode = () => {
  setOriginalData(formData);
  setIsEditing(true);
  // Focus first editable field
  setTimeout(() => {
    document.getElementById('firstName')?.focus();
  }, 100);
};

// Cancel edit mode
const cancelEditMode = () => {
  if (hasChanges()) {
    showConfirmationDialog();
  } else {
    setFormData(originalData);
    setIsEditing(false);
  }
};
```

#### Real-time Validation
```javascript
// Validation on field change
const validateField = (name, value) => {
  const rules = validationRules[name];
  const errors = [];
  
  if (rules.required && !value.trim()) {
    errors.push(`${rules.label} is required`);
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${rules.label} must be at least ${rules.minLength} characters`);
  }
  
  return errors;
};

// Update field with validation
const updateField = (name, value) => {
  setFormData(prev => ({ ...prev, [name]: value }));
  
  const fieldErrors = validateField(name, value);
  setErrors(prev => ({ ...prev, [name]: fieldErrors }));
};
```

### 2. Loading States

#### Progressive Loading
```javascript
// Loading states for different operations
const [loadingStates, setLoadingStates] = useState({
  profile: false,
  saving: false,
  uploading: false,
  sessions: false
});

// Update specific loading state
const setLoading = (operation, isLoading) => {
  setLoadingStates(prev => ({
    ...prev,
    [operation]: isLoading
  }));
};
```

#### Skeleton Screens
```jsx
// Skeleton component for loading states
const ProfileSkeleton = () => (
  <div className="profile-skeleton">
    <div className="skeleton-header">
      <div className="skeleton-avatar" />
      <div className="skeleton-info">
        <div className="skeleton-line skeleton-line-title" />
        <div className="skeleton-line skeleton-line-subtitle" />
      </div>
    </div>
    <div className="skeleton-content">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-line-short" />
    </div>
  </div>
);
```

### 3. Success Feedback

#### Toast Notifications
```javascript
// Success notification system
const showSuccessToast = (message, duration = 3000) => {
  const toast = {
    id: Date.now(),
    type: 'success',
    message,
    duration
  };
  
  setToasts(prev => [...prev, toast]);
  
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== toast.id));
  }, duration);
};

// Usage examples
showSuccessToast('Profile updated successfully');
showSuccessToast('Profile picture uploaded');
showSuccessToast('Session revoked');
```

## State Management

### 1. Profile State Structure

```javascript
// Profile state interface
const profileState = {
  // User data
  user: {
    id: string,
    firstName: string,
    lastName: string,
    displayName: string,
    email: string,
    phone: string,
    officeLocation: string,
    jobTitle: string,
    department: string,
    profilePicture: string,
    roles: Array<Role>,
    permissions: Array<string>,
    preferences: Object,
    lastLogin: string,
    status: 'active' | 'inactive'
  },
  
  // UI state
  ui: {
    isEditing: boolean,
    activeTab: string,
    loadingStates: Object,
    errors: Object,
    isDirty: boolean
  },
  
  // Security data
  security: {
    sessions: Array<Session>,
    activities: Array<Activity>,
    lastPasswordChange: string
  }
};
```

### 2. State Actions

```javascript
// Profile actions
const profileActions = {
  // Data actions
  LOAD_PROFILE: 'LOAD_PROFILE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  UPLOAD_PICTURE: 'UPLOAD_PICTURE',
  
  // UI actions
  SET_EDITING: 'SET_EDITING',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  
  // Security actions
  LOAD_SESSIONS: 'LOAD_SESSIONS',
  REVOKE_SESSION: 'REVOKE_SESSION',
  LOAD_ACTIVITIES: 'LOAD_ACTIVITIES'
};
```

## Accessibility Flows

### 1. Keyboard Navigation Flow

#### Tab Order
```
1. Skip to main content link
2. Profile header actions (Edit, Upload Photo)
3. Tab navigation (Personal Info, Security, Activity, Preferences)
4. Form fields (in logical order)
5. Form actions (Cancel, Save)
6. Secondary actions (if any)
```

#### Keyboard Shortcuts
- **Tab**: Move to next focusable element
- **Shift + Tab**: Move to previous focusable element
- **Enter/Space**: Activate buttons and links
- **Arrow Keys**: Navigate between tabs
- **Escape**: Cancel edit mode or close modals

### 2. Screen Reader Flow

#### Announcements
```javascript
// Screen reader announcements
const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Usage examples
announceToScreenReader('Profile updated successfully');
announceToScreenReader('Entering edit mode');
announceToScreenReader('Session revoked');
```

#### ARIA Labels and Descriptions
```jsx
// Accessible form fields
<input
  id="firstName"
  name="firstName"
  aria-label="First name"
  aria-describedby="firstName-help firstName-error"
  aria-invalid={!!errors.firstName}
  aria-required="true"
/>

// Accessible buttons
<button
  aria-label="Upload profile picture"
  aria-describedby="upload-help"
>
  <CameraIcon />
</button>

// Accessible tabs
<div role="tablist" aria-label="Profile sections">
  <button
    role="tab"
    aria-selected={activeTab === 'personal'}
    aria-controls="personal-tabpanel"
    id="personal-tab"
  >
    Personal Information
  </button>
</div>
```

## Mobile-Specific Flows

### 1. Touch Interaction Flow

#### Swipe Navigation
```javascript
// Touch gesture handling
const handleTouchStart = (e) => {
  setTouchStart(e.touches[0].clientX);
};

const handleTouchMove = (e) => {
  if (!touchStart) return;
  
  const currentTouch = e.touches[0].clientX;
  const diff = touchStart - currentTouch;
  
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      // Swipe left - next tab
      navigateToNextTab();
    } else {
      // Swipe right - previous tab
      navigateToPreviousTab();
    }
    setTouchStart(null);
  }
};
```

#### Pull-to-Refresh
```javascript
// Pull to refresh implementation
const handlePullToRefresh = () => {
  setIsRefreshing(true);
  
  Promise.all([
    fetchProfileData(),
    fetchSecurityData(),
    fetchActivityData()
  ]).finally(() => {
    setIsRefreshing(false);
  });
};
```

### 2. Mobile Form Optimization

#### Input Focus Management
```javascript
// Prevent zoom on input focus (iOS)
const preventZoom = () => {
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.style.fontSize = '16px';
  });
};

// Scroll to focused input
const scrollToInput = (inputElement) => {
  setTimeout(() => {
    inputElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, 300);
};
```

## Performance Considerations

### 1. Lazy Loading
```javascript
// Lazy load tab content
const TabContent = lazy(() => import('./TabContent'));

// Usage with Suspense
<Suspense fallback={<TabSkeleton />}>
  <TabContent tab={activeTab} />
</Suspense>
```

### 2. Debounced Validation
```javascript
// Debounce validation for better performance
const debouncedValidation = useMemo(
  () => debounce((name, value) => {
    const errors = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: errors }));
  }, 300),
  []
);
```

### 3. Optimistic Updates
```javascript
// Optimistic UI updates
const updateProfileOptimistically = (updates) => {
  // Update UI immediately
  setProfile(prev => ({ ...prev, ...updates }));
  
  // Send to server
  updateProfile(updates).catch(() => {
    // Revert on error
    setProfile(originalProfile);
    showErrorToast('Failed to update profile');
  });
};
```

## Conclusion

These user flows provide comprehensive guidance for implementing an intuitive and accessible user profile experience. The flows cover all major user interactions, error scenarios, and edge cases while maintaining consistency with modern UX patterns and accessibility standards.

### Key Takeaways

1. **Progressive Enhancement**: Start with basic functionality and enhance with advanced features
2. **Error Recovery**: Always provide clear paths for users to recover from errors
3. **Accessibility First**: Design flows that work for all users, including those using assistive technologies
4. **Mobile Optimization**: Adapt flows for touch interfaces and mobile constraints
5. **Performance**: Implement loading states and optimizations to maintain responsiveness

These flows should be used in conjunction with the wireframes and component specifications to create a cohesive and user-friendly profile management experience.