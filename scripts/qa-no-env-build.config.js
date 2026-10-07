import config from '../vite.config.js'
import { fileURLToPath } from 'node:url'

// Preserve the normal build configuration, except dotenv discovery.
export default { ...config, envDir: fileURLToPath(new URL('./qa-empty-env/', import.meta.url)) }
