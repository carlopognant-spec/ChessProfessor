import config from '../playwright.config.js'

export default {
  ...config,
  testDir: '..',
  testMatch: 'grande-v3-smoke.spec.js',
  webServer: {
    command: 'npm run preview -- --config scripts/qa-no-env-build.config.js --host 127.0.0.1 --port 4176 --strictPort',
    url: 'http://127.0.0.1:4176/ChessProfessor/',
    reuseExistingServer: false,
  },
}
