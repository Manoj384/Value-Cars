import { defineConfig, devices } from '@playwright/test';

/**
 * Local E2E config for the Value Cars customer journey.
 * The Next.js dev server runs on 127.0.0.1:3000 and talks to the hardened
 * backend on 127.0.0.1:8000 (DATABASE_URL override to local SQLite).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--no-sandbox'] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});