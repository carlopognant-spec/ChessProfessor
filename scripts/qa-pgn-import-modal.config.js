import config from '../playwright.config.js'

export default { ...config, expect: { ...config.expect, timeout: 10000 }, testDir: '..', testMatch: ['pgn-import-modal.spec.js', 'review-practice.spec.js', 'rea-ux-fixes.spec.js', 'game-exploration.spec.js'] }
