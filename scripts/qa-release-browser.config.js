import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '..', testMatch: 'release-smoke.spec.js', timeout: 120000,
  expect: { timeout: 60000 }, workers: 1,
  use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true },
  webServer: process.env.CHESSPROFESSOR_RELEASE_URL ? undefined : {
    command: 'npm run preview -- --config scripts/qa-no-env-build.config.js --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175/ChessProfessor/', reuseExistingServer: false,
  },
})
