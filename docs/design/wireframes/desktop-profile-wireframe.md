# Desktop Profile Page Wireframe

## Layout Specifications

### Screen Size: 1200px+ (Desktop)
### Grid System: 12-column grid with 24px gutters

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER NAVIGATION BAR                                                                           │
│ [Logo] [Dashboard] [Applications] [Compliance] [Reports] [Profile ▼] [Notifications] [Logout]  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ PROFILE HEADER SECTION                                                                      │ │
│ │                                                                                             │ │
│ │ ┌─────────┐  ┌─────────────────────────────────────────┐  ┌─────────────────────────────┐ │ │
│ │ │         │  │ John Doe                                │  │ [📷 Upload Photo]          │ │ │
│ │ │  PHOTO  │  │ Senior ICT Manager                      │  │ [✏️ Edit Profile]          │ │ │
│ │ │  80x80  │  │ john.doe@company.com                    │  │ [🔒 Security Settings]     │ │ │
│ │ │         │  │ IT Department • Employee ID: EMP001     │  │                             │ │ │
│ │ └─────────┘  │ Last Login: 2 hours ago                 │  │                             │ │ │
│ │              │ Status: 🟢 Active                       │  │                             │ │ │
│ │              └─────────────────────────────────────────┘  └─────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ TAB NAVIGATION                                                                              │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │ │
│ │ │ 👤 Personal Info │ │ 🔒 Security     │ │ 📊 Activity     │ │ ⚙️ Preferences  │         │ │
│ │ │    (Active)      │ │                 │ │                 │ │                 │         │ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘         │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ CONTENT AREA - PERSONAL INFORMATION TAB                                                    │ │
│ │                                                                                             │ │
│ │ ┌─────────────────────────────────────────┐ ┌─────────────────────────────────────────┐   │ │
│ │ │ BASIC INFORMATION                       │ │ PROFESSIONAL INFORMATION                │   │ │
│ │ │                                         │ │                                         │   │ │
│ │ │ First Name *                            │ │ Job Title                               │   │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ ┌─────────────────────────────────────┐ │   │ │
│ │ │ │ John                                │ │ │ │ Senior ICT Manager                  │ │   │ │
│ │ │ └─────────────────────────────────────┘ │ │ └─────────────────────────────────────┘ │   │ │
│ │ │                                         │ │                                         │   │ │
│ │ │ Last Name *                             │ │ Department                              │   │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ ┌─────────────────────────────────────┐ │   │ │
│ │ │ │ Doe                                 │ │ │ │ Information Technology              │ │   │ │
│ │ │ └─────────────────────────────────────┘ │ │ └─────────────────────────────────────┘ │   │ │
│ │ │                                         │ │                                         │   │ │
│ │ │ Display Name                            │ │ Employee ID                             │   │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ ┌─────────────────────────────────────┐ │   │ │
│ │ │ │ John D.                             │ │ │ │ EMP001 (Read-only)                  │ │   │ │
│ │ │ └─────────────────────────────────────┘ │ │ └─────────────────────────────────────┘ │   │ │
│ │ │                                         │ │                                         │   │ │
│ │ │ Email Address                           │ │ Manager                                 │   │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ ┌─────────────────────────────────────┐ │   │ │
│ │ │ │ john.doe@company.com (Read-only)    │ │ │ │ Sarah Johnson                       │ │   │ │
│ │ │ └─────────────────────────────────────┘ │ │ └─────────────────────────────────────┘ │   │ │
│ │ └─────────────────────────────────────────┘ └─────────────────────────────────────────┘   │ │
│ │                                                                                             │ │
│ │ ┌─────────────────────────────────────────┐ ┌─────────────────────────────────────────┐   │ │
│ │ │ CONTACT INFORMATION                     │ │ ROLES & PERMISSIONS                     │   │ │
│ │ │                                         │ │                                         │   │ │
│ │ │ Phone Number                            │ │ Assigned Roles                          │   │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ ┌─────────────────────────────────────┐ │   │ │
│ │ │ │ +1 (555) 123-4567                   │ │ │ │ [ICT Manager] [User Admin]          │ │   │ │
│ │ │ └─────────────────────────────────────┘ │ │ │ [Compliance Officer]                │ │   │ │
│ │ │                                         │ │ └─────────────────────────────────────┘ │   │ │
│ │ │ Office Location                         │ │                                         │   │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ Permissions                             │   │ │
│ │ │ │ Building A, Floor 3, Room 301       │ │ │ ┌─────────────────────────────────────┐ │   │ │
│ │ │ └─────────────────────────────────────┘ │ │ │ • User Management                   │ │   │ │
│ │ │                                         │ │ │ • Application Approval              │ │   │ │
│ │ │ Emergency Contact                       │ │ │ • Compliance Monitoring             │ │   │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ │ • Report Generation                 │ │   │ │
│ │ │ │ Jane Doe - +1 (555) 987-6543       │ │ │ │ • Security Configuration            │ │   │ │
│ │ │ └─────────────────────────────────────┘ │ │ └─────────────────────────────────────┘ │   │ │
│ │ └─────────────────────────────────────────┘ └─────────────────────────────────────────┘   │ │
│ │                                                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ FORM ACTIONS                                                                        │   │ │
│ │ │                                                                                     │   │ │
│ │ │                                                    [Cancel Changes] [Save Changes] │   │ │
│ │ └─────────────────────────────────────────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Interactive Elements

### Profile Header Actions
1. **Upload Photo Button**
   - Opens file picker dialog
   - Supports drag & drop
   - Image preview before upload
   - Crop functionality

2. **Edit Profile Button**
   - Toggles edit mode for form fields
   - Changes to "Cancel" and "Save" buttons
   - Enables form validation

3. **Security Settings Button**
   - Quick access to security tab
   - Highlights security-related actions

### Form Field States
1. **Default State**: Clean, minimal border
2. **Focus State**: Blue border, subtle shadow
3. **Error State**: Red border, error message below
4. **Success State**: Green border, checkmark icon
5. **Disabled State**: Gray background, reduced opacity

### Validation Rules
- **First Name**: Required, 2-50 characters
- **Last Name**: Required, 2-50 characters
- **Display Name**: Optional, 2-100 characters
- **Phone**: Optional, valid phone format
- **Office Location**: Optional, 5-200 characters
- **Emergency Contact**: Optional, valid format

## Accessibility Features

### Keyboard Navigation
- Tab order: Header → Profile actions → Tab navigation → Form fields → Action buttons
- Enter key activates buttons and links
- Arrow keys navigate between tabs
- Escape key cancels edit mode

### Screen Reader Support
- Proper heading hierarchy (h1, h2, h3)
- Form labels associated with inputs
- Error messages announced
- Status updates communicated
- Role and state information provided

### Visual Indicators
- Focus rings on all interactive elements
- High contrast mode support
- Color-blind friendly color palette
- Clear visual hierarchy with typography

## Responsive Behavior

### Breakpoint: 1024px - 1199px
- Reduce padding and margins
- Adjust grid to 2-column layout for some sections
- Maintain full functionality

### Breakpoint: 768px - 1023px
- Switch to single-column layout
- Stack profile header elements
- Maintain tab navigation

### Breakpoint: < 768px
- Mobile-optimized layout
- Collapsible sections
- Touch-friendly button sizes