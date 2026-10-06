import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Chess } from 'chess.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { fixtureMoves, validateCache, compare, renderReport } from './qa/compare.js'
import { NativeEngine } from './qa/native-engine.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = path.join(root, 'tests/fixtures/qa')
let ids = ['game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843', 'game-3-fools-mate']
const json = async filename => JSON.parse(await readFile(filename, 'utf8'))
const reports = [], pending = []
let engine
try {
  const regenerate = process.argv.includes('--generate')
  const personal = process.argv.includes('--personal')
  const unknown = process.argv.slice(2).filter(arg => !['--generate', '--personal'].includes(arg))
  if (unknown.length) throw new Error(`Argomenti sconosciuti: ${unknown.join(', ')}`)
  if (personal) {
    ids = (await readdir(directory)).filter(name => /^personal-\d+\.json$/.test(name)).sort().map(name => name.slice(0, -5))
    if (!ids.length) throw new Error('Nessuna fixture personale: eseguire node scripts/qa-import-personal.js')
  }
  const suspects = await json(path.join(directory, 'suspect-labels.json'))
  for (const id of ids) {
    let fixture
    try { fixture = await json(path.join(directory, `${id}.json`)) }
    catch (error) { if (error.code !== 'ENOENT') throw error; pending.push(`Fixture assente: ${id}`); continue }
    fixture.id = id
    const moves = fixtureMoves(fixture)
    const cachePath = path.join(directory, 'analysis-cache', `${id}.json`)
    let cache
    if (regenerate) {
      if (!engine) {
        const localExecutable = path.join(root, 'tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe')
        let executable = process.env.STOCKFISH_PATH
        if (!executable) {
          try { await access(localExecutable); executable = localExecutable }
          catch { executable = 'stockfish' }
        }
        engine = new NativeEngine(executable)
        await engine.init()
      }
      await engine.newGame()
      console.error(`Analisi reale: ${id} (${moves.length} ply)`)
      const game = new Chess()
      cache = { schemaVersion: 1, pgn: fixture.pgn, engineVersion: engine.version, depth: ENGINE_CONFIG.defaultDepth, multiPv: ENGINE_CONFIG.multiPv, scorePerspective: 'side-to-move at each FEN', threads: 1, hashMb: 16, generatedAt: new Date().toISOString(), entries: [] }
      for (const [index, san] of moves.entries()) {
        const fenBefore = game.fen()
        const before = await engine.analyze(fenBefore, cache.depth, cache.multiPv)
        const move = game.move(san)
        const playedEngine = await engine.analyze(game.fen(), cache.depth, cache.multiPv)
        cache.entries.push({ ply: index + 1, san, uci: `${move.from}${move.to}${move.promotion ?? ''}`, fenBefore, fenAfter: game.fen(), engine: before, playedEngine })
        if ((index + 1) % 20 === 0) console.error(`${id}: ${index + 1}/${moves.length} ply`)
      }
      validateCache(cache, fixture, ENGINE_CONFIG)
      await mkdir(path.dirname(cachePath), { recursive: true })
      await writeFile(cachePath, JSON.stringify(cache, null, 2) + '\n')
    } else {
      try { cache = await json(cachePath) }
      catch (error) { if (error.code !== 'ENOENT') throw error; pending.push(`Cache assente: ${id}`); continue }
    }
    validateCache(cache, fixture, ENGINE_CONFIG)
    reports.push(compare(fixture, cache, suspects))
  }
  const report = renderReport(reports, pending)
  await writeFile(path.join(root, personal ? 'agent-output/qa-compare-personal.md' : 'agent-output/qa-compare.md'), report)
  console.log(report)
  if (pending.length) process.exitCode = 1
} catch (error) {
  console.error(`STOP: ${error.message}`)
  process.exitCode = 1
} finally { engine?.close() }
