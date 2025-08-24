// Basic validation test for user creation
// This file can be run to test the validation functionality

const testValidation = () => {
  console.log('Testing User Validation...');
  
  // Test cases for client-side validation
  const testCases = [
    {
      name: 'Valid user data',
      data: {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        department: 'IT',
        jobTitle: 'Developer'
      },
      expectedValid: true
    },
    {
      name: 'Invalid username - too short',
      data: {
        username: 'ab',
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      },
      expectedValid: false,
      expectedError: 'username'
    },
    {
      name: 'Invalid email format',
      data: {
        username: 'testuser123',
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      },
      expectedValid: false,
      expectedError: 'email'
    },
    {
      name: 'Weak password',
      data: {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      },
      expectedValid: false,
      expectedError: 'password'
    },
    {
      name: 'Missing required fields',
      data: {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'SecurePass123!'
        // Missing firstName and lastName
      },
      expectedValid: false,
      expectedError: 'firstName'
    }
  ];
  
  // Simple validation functions (mimicking client-side logic)
  const validateUser = (data) => {
    const errors = {};
    
    // Username validation
    if (!data.username || data.username.trim().length < 3 || data.username.length > 50) {
      errors.username = 'Username must be 3-50 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    // Email validation
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!data.password || data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(data.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }
    
    // Name validation
    if (!data.firstName || !data.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!data.lastName || !data.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // Run test cases
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = validateUser(testCase.data);
    const testPassed = result.isValid === testCase.expectedValid;
    
    if (testPassed) {
      console.log(`✅ Test ${index + 1}: ${testCase.name} - PASSED`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name} - FAILED`);
      console.log(`   Expected valid: ${testCase.expectedValid}, Got: ${result.isValid}`);
      console.log(`   Errors:`, result.errors);
      failed++;
    }
  });
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  // Test password strength calculation
  console.log('\nTesting Password Strength...');
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    if (password.length >= 16) strength += 1;
    return Math.min(strength, 5);
  };
  
  const passwordTests = [
    { password: 'weak', expectedStrength: 1 },
    { password: 'WeakPass', expectedStrength: 2 },
    { password: 'WeakPass1', expectedStrength: 3 },
    { password: 'WeakPass1!', expectedStrength: 4 },
    { password: 'VeryStrongPassword123!', expectedStrength: 5 }
  ];
  
  passwordTests.forEach((test, index) => {
    const strength = calculatePasswordStrength(test.password);
    const strengthLabels = ['Very Weak', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    console.log(`Password: "${test.password}" - Strength: ${strength}/5 (${strengthLabels[strength]})`);
  });
};

// Run tests if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
  testValidation();
}

module.exports = { testValidation };