import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'

const root = fileURLToPath(new URL('../', import.meta.url))
export function stockfishAssets() {
  const packageRoot = path.join(root, 'node_modules/stockfish')
  const assets = new Map([
    [ENGINE_CONFIG.engine.workerFile, path.join(packageRoot, 'bin/stockfish-19-single.js')],
    [ENGINE_CONFIG.engine.wasmFile, path.join(packageRoot, 'bin/stockfish-19-single.wasm')],
    ['stockfish-Copying.txt', path.join(packageRoot, 'Copying.txt')],
    ['engine-cache-sw.js', path.join(root, 'public/engine-cache-sw.js')],
  ])
  function validate() {
    const info = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
    if (info.version !== ENGINE_CONFIG.engine.packageVersion) throw new Error('Versione npm Stockfish diversa dalla configurazione')
    for (const filename of assets.values()) if (fs.statSync(filename).size > 100000000) throw new Error('Asset Stockfish oltre 100 MB')
  }
  return {
    name: 'stockfish-assets',
    buildStart: validate,
    configureServer(server) {
      validate()
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url, 'http://localhost').pathname
        const name = pathname.startsWith(server.config.base) ? pathname.slice(server.config.base.length) : pathname.slice(1)
        const filename = assets.get(name)
        if (!filename || !['GET', 'HEAD'].includes(request.method)) return next()
        response.setHeader('Content-Type', name.endsWith('.wasm') ? 'application/wasm' : name.endsWith('.js') ? 'text/javascript' : 'text/plain')
        response.setHeader('Content-Length', fs.statSync(filename).size)
        response.setHeader('Cache-Control', name === 'engine-cache-sw.js' ? 'no-cache' : 'public, max-age=31536000, immutable')
        if (request.method === 'HEAD') return response.end()
        const stream = fs.createReadStream(filename)
        stream.on('error', error => response.destroy(error))
        stream.pipe(response)
      })
    },
    generateBundle() {
      for (const [fileName, filename] of assets) this.emitFile({ type: 'asset', fileName, source: fs.readFileSync(filename) })
    },
  }
}
