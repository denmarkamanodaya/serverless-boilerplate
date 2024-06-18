require('dotenv').config();
module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: process.env.NODE_ENV || 'test',
  },
  testTimeout: 15000,
  restoreMocks: true,
  coveragePathIgnorePatterns: [
    'node_modules',
    'database',
    'src/utils/custom-errors/class-errors.js',
    'src/common/logger.js',
    'tests',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  verbose: true,
};
