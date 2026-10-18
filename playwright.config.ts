import { defineConfig, devices } from '@playwright/test';
import { env } from './src/env';
import { STATE } from './src/support/paths';

// Projects follow the architecture doc: one setup project, the API layer, one UI project per role (picked by the
// spec file's suffix), and the shop-wide clock tests last on a single worker.
const ui = (role: 'guest' | 'customer' | 'support' | 'warehouse' | 'admin') => ({
  name: `ui-${role}`,
  testMatch: `ui/**/*.${role}.spec.ts`,
  grepInvert: /@clock/,
  dependencies: ['setup'],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: role === 'guest' || role === 'customer' ? env.shopUrl : env.adminUrl,
    // Customers are fresh fixture shoppers per test (see src/fixtures); staff logins are saved once by setup.
    storageState: role === 'support' || role === 'warehouse' || role === 'admin' ? STATE[role] : undefined,
  },
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: env.ci,
  retries: env.ci ? 1 : 0,
  workers: env.ci ? 4 : undefined,
  reporter: env.ci ? [['github'], ['html', { open: 'never' }], ['list']] : [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: 'setup/*.setup.ts' },
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts',
      grepInvert: /@clock/,
      dependencies: ['setup'],
    },
    ui('guest'),
    ui('customer'),
    ui('support'),
    ui('warehouse'),
    ui('admin'),
    {
      // The shop clock and the planted bugs are shared by the whole shop, so these run alone, after the rest.
      name: 'clock',
      grep: /@clock/,
      testMatch: ['api/**/*.spec.ts', 'ui/**/*.spec.ts'],
      workers: 1,
      fullyParallel: false,
      dependencies: ['api', 'ui-guest', 'ui-customer', 'ui-support', 'ui-warehouse', 'ui-admin'],
      use: { ...devices['Desktop Chrome'], baseURL: env.shopUrl },
    },
  ],
});
