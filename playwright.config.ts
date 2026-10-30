import { defineConfig, devices } from '@playwright/test'

// Conductor worktree deterministic port allocation: 42000 + issue number (9)
const PORT = 42009

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}/visualitzacio/`,
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT}`,
    url: `http://localhost:${PORT}/visualitzacio/`,
    reuseExistingServer: false,
    timeout: 30000,
  },
})
