import config from '../playwright.config.js'
export default { ...config, testDir: '..', webServer: undefined, testMatch: 'analysis-ux-audit.spec.js' }
