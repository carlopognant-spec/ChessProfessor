import { defineConfig } from '@playwright/test'

export default defineConfig({
  testMatch: 'playwright-check.spec.js',
  timeout: 120000,
  expect: { timeout: 60000 },
  workers: 1,
  use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true },
  webServer: {
    command: 'npm run dev -- --config scripts/qa-no-env-build.config.js --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/ChessProfessor/',
    reuseExistingServer: false,
  },
})
