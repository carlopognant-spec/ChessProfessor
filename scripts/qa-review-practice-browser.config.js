import config from '../playwright.config.js'

export default { ...config, testDir: '..', testMatch: 'review-practice.spec.js' }
