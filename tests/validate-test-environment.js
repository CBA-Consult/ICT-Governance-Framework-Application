#!/usr/bin/env node

/**
 * Test Environment Validation Script
 * 
 * This script validates that the test environment is properly configured
 * for running the User Management end-to-end tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Test Environment for User Management Tests');
console.log('======================================================');

let validationErrors = [];
let validationWarnings = [];

// Check Node.js version
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js version: ${nodeVersion}`);
  
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 16) {
    validationErrors.push('Node.js version 16 or higher is required');
  }
} catch (error) {
  validationErrors.push('Failed to check Node.js version');
}

// Check if npm is available
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  validationErrors.push('npm is not available');
}

// Check if Playwright is installed
try {
  const playwrightVersion = execSync('npx playwright --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Playwright version: ${playwrightVersion}`);
} catch (error) {
  validationWarnings.push('Playwright is not installed. Run: npx playwright install');
}

// Check if required test files exist
const requiredFiles = [
  'tests/user-management.spec.ts',
  'tests/helpers/user-management-helpers.ts',
  'playwright.config.ts',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Required file exists: ${file}`);
  } else {
    validationErrors.push(`Required file missing: ${file}`);
  }
});

// Check if ICT Governance Framework directory exists
const frameworkDir = 'ict-governance-framework';
if (fs.existsSync(frameworkDir)) {
  console.log(`✅ ICT Governance Framework directory exists: ${frameworkDir}`);
  
  // Check for package.json in framework directory
  const frameworkPackageJson = path.join(frameworkDir, 'package.json');
  if (fs.existsSync(frameworkPackageJson)) {
    console.log(`✅ Framework package.json exists`);
    
    try {
      const packageData = JSON.parse(fs.readFileSync(frameworkPackageJson, 'utf8'));
      if (packageData.scripts && packageData.scripts.dev) {
        console.log(`✅ Framework has dev script`);
      } else {
        validationWarnings.push('Framework package.json missing dev script');
      }
    } catch (error) {
      validationWarnings.push('Failed to parse framework package.json');
    }
  } else {
    validationWarnings.push('Framework package.json not found');
  }
} else {
  validationErrors.push(`ICT Governance Framework directory not found: ${frameworkDir}`);
}

// Check if application is running on port 3000
const http = require('http');
const checkPort = (port) => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
};

// Check application availability
checkPort(3000).then(isRunning => {
  if (isRunning) {
    console.log('✅ Application is running on port 3000');
  } else {
    validationWarnings.push('Application is not running on port 3000. Start with: cd ict-governance-framework && npm run dev');
  }
  
  // Check Playwright configuration
  try {
    const playwrightConfig = require('../playwright.config.ts');
    console.log('✅ Playwright configuration loaded');
  } catch (error) {
    validationErrors.push('Failed to load Playwright configuration');
  }
  
  // Display validation results
  console.log('\n📋 Validation Summary');
  console.log('====================');
  
  if (validationErrors.length === 0) {
    console.log('✅ Environment validation passed!');
    
    if (validationWarnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validationWarnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
    
    console.log('\n🚀 Ready to run User Management tests!');
    console.log('\nRun tests with:');
    console.log('   ./tests/run-user-management-tests.sh');
    console.log('   or');
    console.log('   npx playwright test tests/user-management.spec.ts');
    
    process.exit(0);
  } else {
    console.log('❌ Environment validation failed!');
    console.log('\n🔧 Errors to fix:');
    validationErrors.forEach(error => {
      console.log(`   - ${error}`);
    });
    
    if (validationWarnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validationWarnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
    
    console.log('\n📚 Setup Instructions:');
    console.log('1. Install Node.js 16+ and npm');
    console.log('2. Install Playwright: npx playwright install');
    console.log('3. Start the application: cd ict-governance-framework && npm run dev');
    console.log('4. Run validation again: node tests/validate-test-environment.js');
    
    process.exit(1);
  }
});