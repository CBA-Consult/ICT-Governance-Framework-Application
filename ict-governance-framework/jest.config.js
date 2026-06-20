/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/contracts'],
  testMatch: ['**/*.contract.test.js'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  testTimeout: 120000,
  verbose: true,
  forceExit: true,
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/contracts/_helpers/uuid-cjs-shim.js'
  },
  collectCoverageFrom: [
    'services/**/*.js',
    'api/**/*.js',
    '!**/*.test.js'
  ]
};
