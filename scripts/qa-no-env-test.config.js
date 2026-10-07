import config from '../vitest.config.js'
import { fileURLToPath } from 'node:url'

// C7 must not read the workspace .env. This directory does not exist.
export default { ...config, envDir: fileURLToPath(new URL('./qa-empty-env/', import.meta.url)) }
