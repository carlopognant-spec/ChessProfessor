import config from '../playwright.config.js'
export default { ...config, testDir: '..', webServer: undefined,
  testMatch: ['analysis-workspace.spec.js', 'analysis-ux-audit.spec.js', 'editor-board-regression.spec.js', 'browser-inputs.spec.js'] }
