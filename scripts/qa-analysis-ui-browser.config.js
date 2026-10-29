import config from '../playwright.config.js'

export default { ...config, testDir: '..', testMatch: 'analysis-ui.spec.js' }
