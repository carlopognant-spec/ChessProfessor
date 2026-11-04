import { defineConfig } from '@playwright/test'
export default defineConfig({ testDir: '..', testMatch: 'grande-performance.spec.js', timeout: 240000, expect: { timeout: 90000 }, workers: 1, reporter: 'list', use: { browserName: 'chromium', channel: 'msedge', headless: true, baseURL: 'http://127.0.0.1:4173/ChessProfessor/' } })
