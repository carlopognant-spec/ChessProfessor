import config from '../playwright.config.js'

// Reuse the user's dev server; never stop or replace it during the regression smoke.
export default { ...config, testDir: '..', webServer: undefined,
  testMatch: ['review-practice.spec.js', 'analysis-ui.spec.js', 'playwright-check.spec.js'] }
