import config from '../playwright.config.js'

export default { ...config, testDir: '..',
  testMatch: ['analysis-ui.spec.js', 'analysis-polish.spec.js', 'game-exploration.spec.js', 'review-practice.spec.js'] }
