const path = require('path');
const { devices } = require('@playwright/test');
const { getHttpAuth } = require('./src/auth');

// HTTP Basic Auth for Pantheon-locked environments. Dormant unless
// VRT_HTTP_USER + VRT_HTTP_PASS are set in the env. See README.
const httpAuth = getHttpAuth();
const httpCredentials = httpAuth
  ? {
      username: httpAuth.username,
      password: httpAuth.password,
      ...(httpAuth.origin ? { origin: httpAuth.origin } : {}),
    }
  : undefined;

module.exports = {
  testDir: path.join(__dirname, 'tests'),
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(process.cwd(), 'playwright-report') }],
  ],
  outputDir: path.join(process.cwd(), 'test-results'),
  globalSetup: path.join(__dirname, 'src', 'global-setup.js'),
  use: {
    ignoreHTTPSErrors: true,
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    ...(httpCredentials ? { httpCredentials } : {}),
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
};
