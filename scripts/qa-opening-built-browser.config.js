import {defineConfig} from '@playwright/test'
import openingConfig from './qa-opening-browser.config.js'

// Same scenarios, browser and timeouts against the previously built no-env app.
export default defineConfig({...openingConfig,
  webServer:{...openingConfig.webServer,
    command:'npm run preview -- --config scripts/qa-no-env-build.config.js --host 127.0.0.1 --port 4176 --strictPort'},
})
