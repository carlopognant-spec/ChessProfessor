import config from '../playwright.config.js'
export default { ...config, testDir: '..', webServer: undefined,
  testMatch: ['long-game-stability.spec.js', 'game-exploration.spec.js'], workers: 1, reporter: 'list' }
