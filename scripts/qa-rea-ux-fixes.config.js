import config from '../playwright.config.js'

export default { ...config, testDir: '..', testMatch: ['rea-ux-fixes.spec.js', 'review-practice.spec.js'] }
