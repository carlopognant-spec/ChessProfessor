import { buildSync } from 'esbuild'
import { fileURLToPath } from 'node:url'

// Dev-server workers use HTTP imports; provide the same bundled code for offline dev tests.
export const refinementWorkerSource = buildSync({
  entryPoints: [fileURLToPath(new URL('../../src/lib/refinementWorker.js', import.meta.url))],
  bundle: true, write: false, platform: 'browser', format: 'iife',
}).outputFiles[0].text

// Existing browser tests mock Stockfish. Keep the separate chess-processing worker real.
export function allowRefinementWorker(source) {
  const NativeWorker = window.Worker
  let selected = NativeWorker
  Object.defineProperty(window, 'Worker', { configurable: true,
    get: () => selected,
    set: MockWorker => {
      selected = new Proxy(MockWorker, { construct: (target, args) => {
        const devWorker = String(args[0]).includes('refinementWorker')
        if (devWorker) return new NativeWorker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })), args[1])
        if (args[1]?.name === 'chessprofessor-refinement') return new NativeWorker(...args)
        return Reflect.construct(target, args)
      } })
    },
  })
}
