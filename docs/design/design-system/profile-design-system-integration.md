# Profile Page Design System Integration

## Overview

This document outlines how the user profile page components integrate with the ICT Governance Framework design system, ensuring consistency, maintainability, and scalability across the application.

## Table of Contents

1. [Design System Foundation](#design-system-foundation)
2. [Design Tokens](#design-tokens)
3. [Component Integration](#component-integration)
4. [Theming System](#theming-system)
5. [Brand Guidelines](#brand-guidelines)
6. [Implementation Guidelines](#implementation-guidelines)
7. [Quality Assurance](#quality-assurance)

## Design System Foundation

### Design Philosophy

The ICT Governance Framework design system is built on the following principles:

1. **Consistency**: Unified visual language across all components
2. **Accessibility**: WCAG 2.1 AA compliance by default
3. **Scalability**: Components that work across different contexts
4. **Maintainability**: Clear documentation and reusable patterns
5. **Performance**: Optimized for speed and efficiency

### Architecture Overview

```
Design System Architecture
├── Design Tokens (Colors, Typography, Spacing)
├── Base Components (Button, Input, Card)
├── Composite Components (Forms, Navigation)
├── Page Templates (Dashboard, Profile, Settings)
└── Themes (Light, Dark, High Contrast)
```

## Design Tokens

### Color System

#### Primary Colors
```css
:root {
  /* Primary Brand Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;  /* Primary */
  --color-primary-600: #2563eb;  /* Primary Dark */
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  
  /* Semantic Colors */
  --color-success-50: #f0fdf4;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  
  --color-error-50: #fef2f2;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  
  /* Neutral Colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
}
```

#### Profile-Specific Color Usage
```css
/* Profile Header */
.profile-header {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  color: white;
}

/* Form Fields */
.form-input {
  border-color: var(--color-gray-300);
  background: white;
}

.form-input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.form-input.error {
  border-color: var(--color-error-500);
  box-shadow: 0 0 0 3px var(--color-error-50);
}

/* Status Indicators */
.status-active {
  color: var(--color-success-600);
  background: var(--color-success-50);
}

.status-inactive {
  color: var(--color-gray-600);
  background: var(--color-gray-50);
}
```

### Typography System

#### Font Families
```css
:root {
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', monospace;
}
```

#### Font Scales
```css
:root {
  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

#### Profile Typography Usage
```css
/* Profile Header */
.profile-name {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.profile-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  opacity: 0.9;
}

/* Form Labels */
.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
}

/* Tab Navigation */
.tab-button {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}
```

### Spacing System

#### Spacing Scale
```css
:root {
  --spacing-0: 0;
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  --spacing-20: 5rem;     /* 80px */
  --spacing-24: 6rem;     /* 96px */
}
```

#### Profile Spacing Usage
```css
/* Profile Header */
.profile-header {
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-6);
}

/* Form Fields */
.form-field {
  margin-bottom: var(--spacing-5);
}

.form-input {
  padding: var(--spacing-3) var(--spacing-4);
}

/* Tab Navigation */
.tab-button {
  padding: var(--spacing-4) var(--spacing-5);
}

/* Content Sections */
.content-section {
  padding: var(--spacing-6);
  gap: var(--spacing-6);
}
```

### Border Radius System

```css
:root {
  --border-radius-none: 0;
  --border-radius-sm: 0.25rem;   /* 4px */
  --border-radius-base: 0.5rem;  /* 8px */
  --border-radius-lg: 0.75rem;   /* 12px */
  --border-radius-xl: 1rem;      /* 16px */
  --border-radius-full: 9999px;  /* Full circle */
}
```

### Shadow System

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

## Component Integration

### Base Component Mapping

#### Button Component Integration
```jsx
// Profile-specific button variants
export const ProfileButton = ({ variant, ...props }) => {
  const variantClasses = {
    'profile-primary': 'bg-primary-600 text-white hover:bg-primary-700',
    'profile-secondary': 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    'profile-danger': 'bg-error-600 text-white hover:bg-error-700'
  };
  
  return (
    <Button
      className={`${variantClasses[variant]} profile-button`}
      {...props}
    />
  );
};
```

#### Input Component Integration
```jsx
// Profile-specific input component
export const ProfileInput = ({ error, ...props }) => {
  return (
    <Input
      className={`profile-input ${error ? 'error' : ''}`}
      aria-invalid={!!error}
      {...props}
    />
  );
};
```

#### Card Component Integration
```jsx
// Profile section card
export const ProfileCard = ({ title, children, ...props }) => {
  return (
    <Card className="profile-card" {...props}>
      <CardHeader>
        <CardTitle className="profile-card-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="profile-card-content">
        {children}
      </CardContent>
    </Card>
  );
};
```

### Composite Component Patterns

#### Form Section Pattern
```jsx
// Reusable form section component
export const FormSection = ({ 
  title, 
  description, 
  children, 
  collapsible = false,
  defaultExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className="form-section">
      <div className="form-section-header">
        {collapsible ? (
          <button
            className="form-section-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            <ChevronDownIcon 
              className={`form-section-icon ${isExpanded ? 'expanded' : ''}`} 
            />
            <h3 className="form-section-title">{title}</h3>
          </button>
        ) : (
          <h3 className="form-section-title">{title}</h3>
        )}
        {description && (
          <p className="form-section-description">{description}</p>
        )}
      </div>
      
      {isExpanded && (
        <div className="form-section-content">
          {children}
        </div>
      )}
    </div>
  );
};
```

#### Status Badge Pattern
```jsx
// Reusable status badge component
export const StatusBadge = ({ status, size = 'medium' }) => {
  const statusConfig = {
    active: {
      color: 'success',
      label: 'Active',
      icon: CheckCircleIcon
    },
    inactive: {
      color: 'gray',
      label: 'Inactive',
      icon: XCircleIcon
    },
    pending: {
      color: 'warning',
      label: 'Pending',
      icon: ClockIcon
    }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant={config.color}
      size={size}
      className="status-badge"
    >
      <Icon className="status-badge-icon" />
      {config.label}
    </Badge>
  );
};
```

## Theming System

### Theme Structure
```javascript
// Theme configuration
const themes = {
  light: {
    colors: {
      background: '#ffffff',
      foreground: '#111827',
      primary: '#2563eb',
      secondary: '#6b7280',
      accent: '#f3f4f6',
      muted: '#f9fafb',
      border: '#e5e7eb',
      input: '#ffffff',
      card: '#ffffff'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  },
  
  dark: {
    colors: {
      background: '#111827',
      foreground: '#f9fafb',
      primary: '#3b82f6',
      secondary: '#9ca3af',
      accent: '#1f2937',
      muted: '#374151',
      border: '#374151',
      input: '#1f2937',
      card: '#1f2937'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
    }
  },
  
  highContrast: {
    colors: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#0000ff',
      secondary: '#666666',
      accent: '#f0f0f0',
      muted: '#f5f5f5',
      border: '#000000',
      input: '#ffffff',
      card: '#ffffff'
    },
    shadows: {
      sm: '0 2px 4px 0 rgba(0, 0, 0, 0.5)',
      md: '0 4px 8px -1px rgba(0, 0, 0, 0.5)'
    }
  }
};
```

### Theme Provider Implementation
```jsx
// Theme context provider
export const ThemeProvider = ({ children, defaultTheme = 'light' }) => {
  const [theme, setTheme] = useState(defaultTheme);
  
  useEffect(() => {
    const root = document.documentElement;
    const themeConfig = themes[theme];
    
    // Apply theme variables
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    Object.entries(themeConfig.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Update theme class
    root.className = theme;
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Profile Theme Customization
```css
/* Profile-specific theme overrides */
.profile-page {
  --profile-header-bg: var(--color-primary);
  --profile-card-bg: var(--color-card);
  --profile-border: var(--color-border);
}

/* Dark theme overrides */
.dark .profile-page {
  --profile-header-bg: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
}

/* High contrast theme overrides */
.high-contrast .profile-page {
  --profile-border: 2px solid var(--color-border);
}
```

## Brand Guidelines

### Logo Usage
```jsx
// Brand logo component
export const BrandLogo = ({ size = 'medium', variant = 'full' }) => {
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16'
  };
  
  return (
    <img
      src={`/logos/ict-governance-${variant}.svg`}
      alt="ICT Governance Framework"
      className={`brand-logo ${sizeClasses[size]}`}
    />
  );
};
```

### Color Usage Guidelines

#### Primary Colors
- **Primary Blue (#2563eb)**: Main actions, links, active states
- **Primary Dark (#1d4ed8)**: Hover states, pressed states
- **Primary Light (#dbeafe)**: Backgrounds, subtle highlights

#### Semantic Colors
- **Success Green**: Confirmations, success states, positive indicators
- **Warning Orange**: Warnings, cautions, attention needed
- **Error Red**: Errors, destructive actions, critical alerts
- **Info Blue**: Information, neutral notifications

#### Usage Rules
1. **Contrast**: Ensure minimum 4.5:1 contrast ratio for text
2. **Accessibility**: Don't rely on color alone to convey information
3. **Consistency**: Use semantic colors consistently across components
4. **Hierarchy**: Use color to establish visual hierarchy

### Typography Guidelines

#### Heading Hierarchy
```css
/* Profile page heading hierarchy */
.profile-page h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-foreground);
}

.profile-page h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-foreground);
}

.profile-page h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--color-foreground);
}

.profile-page h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
}
```

#### Text Styles
```css
/* Body text styles */
.text-body {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-foreground);
}

.text-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-gray-600);
}

.text-caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  color: var(--color-gray-500);
}
```

## Implementation Guidelines

### CSS Architecture

#### BEM Methodology
```css
/* Block */
.profile-header { }

/* Element */
.profile-header__avatar { }
.profile-header__info { }
.profile-header__actions { }

/* Modifier */
.profile-header--editing { }
.profile-header__avatar--large { }
```

#### CSS Custom Properties Usage
```css
/* Component-specific custom properties */
.profile-card {
  --card-padding: var(--spacing-6);
  --card-border-radius: var(--border-radius-lg);
  --card-shadow: var(--shadow-md);
  
  padding: var(--card-padding);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
}

/* Responsive custom properties */
@media (max-width: 768px) {
  .profile-card {
    --card-padding: var(--spacing-4);
  }
}
```

### Component Development Guidelines

#### Component Structure
```jsx
// Standard component structure
export const ProfileComponent = ({
  // Props with TypeScript types
  className,
  children,
  ...props
}) => {
  // Hooks and state
  const [state, setState] = useState();
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Implementation
  }, []);
  
  // Computed values
  const computedClass = useMemo(() => {
    return `profile-component ${className || ''}`;
  }, [className]);
  
  // Render
  return (
    <div className={computedClass} {...props}>
      {children}
    </div>
  );
};

// PropTypes or TypeScript interface
ProfileComponent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
```

#### Accessibility Implementation
```jsx
// Accessible component example
export const AccessibleFormField = ({
  label,
  error,
  helpText,
  required,
  ...inputProps
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      
      <input
        id={id}
        className="form-input"
        aria-describedby={[
          error && errorId,
          helpText && helpId
        ].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        {...inputProps}
      />
      
      {error && (
        <div id={errorId} className="form-error" role="alert">
          {error}
        </div>
      )}
      
      {helpText && (
        <div id={helpId} className="form-help">
          {helpText}
        </div>
      )}
    </div>
  );
};
```

### Testing Guidelines

#### Component Testing
```jsx
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileButton } from './ProfileButton';

describe('ProfileButton', () => {
  it('renders with correct variant class', () => {
    render(
      <ProfileButton variant="profile-primary">
        Save Changes
      </ProfileButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('profile-button', 'bg-primary-600');
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(
      <ProfileButton onClick={handleClick}>
        Click me
      </ProfileButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Visual Regression Testing
```javascript
// Storybook stories for visual testing
export default {
  title: 'Profile/Components',
  component: ProfileHeader,
  parameters: {
    layout: 'fullscreen'
  }
};

export const Default = {
  args: {
    user: mockUser,
    isEditing: false
  }
};

export const EditMode = {
  args: {
    user: mockUser,
    isEditing: true
  }
};

export const DarkTheme = {
  args: {
    user: mockUser,
    isEditing: false
  },
  parameters: {
    theme: 'dark'
  }
};
```

## Quality Assurance

### Design Review Checklist

#### Visual Consistency
- [ ] Colors match design tokens
- [ ] Typography follows hierarchy
- [ ] Spacing uses design system scale
- [ ] Border radius is consistent
- [ ] Shadows follow system guidelines

#### Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] ARIA labels are appropriate

#### Responsive Design
- [ ] Mobile layout works correctly
- [ ] Tablet layout is optimized
- [ ] Desktop layout uses space efficiently
- [ ] Touch targets are minimum 44px
- [ ] Text remains readable at all sizes

#### Performance
- [ ] Components are optimized
- [ ] Images are compressed
- [ ] CSS is minimal and efficient
- [ ] JavaScript is tree-shaken
- [ ] Loading states are implemented

### Code Review Guidelines

#### CSS Review
```css
/* Good: Uses design tokens */
.profile-card {
  padding: var(--spacing-6);
  background: var(--color-card);
  border-radius: var(--border-radius-lg);
}

/* Bad: Hard-coded values */
.profile-card {
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
}
```

#### Component Review
```jsx
// Good: Follows design system patterns
export const ProfileField = ({ label, error, ...props }) => {
  return (
    <FormField
      label={label}
      error={error}
      className="profile-field"
      {...props}
    />
  );
};

// Bad: Reimplements existing patterns
export const ProfileField = ({ label, error, ...props }) => {
  return (
    <div className="custom-field">
      <label>{label}</label>
      <input {...props} />
      {error && <span>{error}</span>}
    </div>
  );
};
```

### Documentation Standards

#### Component Documentation
```jsx
/**
 * ProfileHeader component displays user information and actions
 * 
 * @param {Object} user - User object with profile information
 * @param {boolean} isEditing - Whether the profile is in edit mode
 * @param {Function} onEditToggle - Callback for edit mode toggle
 * @param {Function} onPhotoUpload - Callback for photo upload
 * 
 * @example
 * <ProfileHeader
 *   user={currentUser}
 *   isEditing={false}
 *   onEditToggle={() => setEditing(!editing)}
 *   onPhotoUpload={handlePhotoUpload}
 * />
 */
export const ProfileHeader = ({ user, isEditing, onEditToggle, onPhotoUpload }) => {
  // Implementation
};
```

## Conclusion

This design system integration ensures that the user profile page maintains consistency with the broader ICT Governance Framework while providing flexibility for future enhancements. By following these guidelines, developers can create components that are:

1. **Consistent** with the overall design language
2. **Accessible** to all users
3. **Maintainable** through clear patterns and documentation
4. **Scalable** for future requirements
5. **Performant** through optimized implementation

The design system serves as a single source of truth for design decisions, enabling teams to work efficiently while maintaining high quality standards across the application.