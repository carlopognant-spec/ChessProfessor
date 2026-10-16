import {defineConfig} from '@playwright/test'
export default defineConfig({
  testDir:'..',testMatch:'opening-library.spec.js',timeout:60000,
  expect:{timeout:15000},workers:1,outputDir:'.cache/opening-browser-results',
  use:{browserName:'chromium',channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true},
  webServer:{command:'npm run dev -- --config scripts/qa-no-env-build.config.js --host 127.0.0.1 --port 4176 --strictPort',url:'http://127.0.0.1:4176/ChessProfessor/',reuseExistingServer:false},
})
