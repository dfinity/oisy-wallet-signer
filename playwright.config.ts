import {defineConfig, devices} from '@playwright/test';

const DEV = (process.env.NODE_ENV ?? 'production') === 'development';

export default defineConfig({
  webServer: {
    command: 'npm run dev:party',
    reuseExistingServer: true,
    port: 5173
  },
  testDir: 'e2e',
  testMatch: ['**/*.e2e.ts', '**/*.spec.ts'],
  timeout: 60000,
  use: {
    testIdAttribute: 'data-tid',
    trace: 'on',
    ...(DEV && {headless: false})
  },
  projects: [
    {
      name: 'Google Chrome',
      use: {...devices['Desktop Chrome'], channel: 'chrome'}
    }
  ]
});
