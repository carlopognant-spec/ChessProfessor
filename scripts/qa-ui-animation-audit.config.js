import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'..',testMatch:'ui-animation-audit.spec.js',timeout:120000,expect:{timeout:60000},workers:1,reporter:'list',use:{browserName:'chromium',channel:'msedge',headless:true,viewport:{width:1280,height:900},baseURL:'http://127.0.0.1:4173/ChessProfessor/'}})
