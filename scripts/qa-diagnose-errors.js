import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { classifyAnalysisEntries, evaluationFields } from '../src/lib/classification.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { compare, validateCache, labels } from './qa/compare.js'
import { NativeEngine } from './qa/native-engine.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const json = async filename => JSON.parse(await readFile(path.join(root, filename), 'utf8'))
const depth = 18
const selected = []
let engine
try {
  for (let number = 1; number <= 6; number++) {
    const id = `personal-${String(number).padStart(2, '0')}`
    const fixture = await json(`tests/fixtures/qa/${id}.json`)
    const cache = await json(`tests/fixtures/qa/analysis-cache/${id}.json`)
    validateCache(cache, fixture, ENGINE_CONFIG)
    const report = compare(fixture, cache)
    for (const row of report.rows.filter(row => row.expected === 'Errore' && row.actual !== row.expected && !row.reasons.length)) {
      selected.push({ id, row, entry: cache.entries[row.ply - 1], baselineEngine: cache.engineVersion })
    }
  }
  engine = new NativeEngine(process.env.STOCKFISH_PATH || path.join(root, 'tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe'))
  await engine.init()
  if (selected.some(item => item.baselineEngine !== engine.version)) throw new Error('Versione motore diversa dalla baseline')
  const diagnostic = { engineVersion: engine.version, depth, multiPv: ENGINE_CONFIG.multiPv, threads: 1, hashMb: 16, baselineDepth: ENGINE_CONFIG.defaultDepth, generatedAt: new Date().toISOString(), completed: false, entries: [] }
  for (const [index, item] of selected.entries()) {
    console.log(`${index + 1}/${selected.length}: ${item.id} ply ${item.row.ply} ${item.row.san}, depth ${depth}`)
    await engine.newGame()
    const before = await engine.analyze(item.entry.fenBefore, depth, diagnostic.multiPv)
    const after = await engine.analyze(item.entry.fenAfter, depth, diagnostic.multiPv)
    if ([before, after].some(result => result.evalCp == null && result.mate == null)) throw new Error(`Valutazione assente: ${item.id} ply ${item.row.ply}`)
    if ([before, after].some(result => result.mate == null && result.lines[0]?.depth < depth)) throw new Error(`Depth non raggiunta: ${item.id} ply ${item.row.ply}`)
    const classified = classifyAnalysisEntries([evaluationFields(before, after)])[0]
    diagnostic.entries.push({ game: item.id, ply: item.row.ply, san: item.row.san, expected: item.row.expected, fenBefore: item.entry.fenBefore, fenAfter: item.entry.fenAfter, baseline: item.row, engine: before, playedEngine: after, classified, actual: labels[classified.classification],
      baselineClampAffected: [item.row.bestEval, item.row.playedEval].some(score => score != null && Math.abs(score) > 1000),
      deeperClampAffected: [classified.bestEval, classified.playedEval].some(score => score != null && Math.abs(score) > 1000),
    })
    await writeFile(path.join(root, 'agent-output/qa-error-diagnostic.json'), JSON.stringify(diagnostic, null, 2) + '\n')
  }
  diagnostic.completed = true
  await writeFile(path.join(root, 'agent-output/qa-error-diagnostic.json'), JSON.stringify(diagnostic, null, 2) + '\n')
  const exact = diagnostic.entries.filter(entry => entry.actual === 'Errore').length
  const changed = diagnostic.entries.filter(entry => entry.actual !== entry.baseline.actual).length
  const clampAffected = diagnostic.entries.filter(entry => entry.baselineClampAffected).length
  const values = value => value == null ? 'N/D' : typeof value === 'number' ? value.toFixed(3) : value
  const lines = ['# Diagnosi degli Errori discordanti', '', `Motore ${diagnostic.engineVersion}, MultiPV ${diagnostic.multiPv}, depth 12 vs ${depth}. Soglie invariate. Cache di produzione intatte. Nuova sessione UCI per ogni coppia di posizioni diagnostiche.`, '', `Campione: tutti i ${selected.length} ply etichettati Errore da Carlo/chess.com ma discordanti a depth 12; non include i 5 già concordanti.`, `A depth ${depth}: ${exact}/${selected.length} coincidono con Errore; ${changed}/${selected.length} cambiano categoria; ${clampAffected}/${selected.length} avevano almeno uno score oltre il limite ±1000 del modello a depth 12.`, '', 'Questo campione è selezionato sulle discrepanze: non è una misura di accuratezza complessiva a depth 18. Analisi più profonda non equivale alla verità chess.com. Non conosciamo motore, tempo, modello di probabilità o regole esatte della sua Game Review. Il confronto non isola completamente profondità e stato della hash.', '', '| Partita | Ply | SAN | Categoria d12 | Categoria d18 | Drop d12 | Drop d18 | Best cp d12/d18 | Played cp d12/d18 | Best mate d12/d18 | Played mate d12/d18 | Clamp d12/d18 |', '|---|---|---|---|---|---|---|---|---|---|---|---|']
  for (const item of diagnostic.entries) {
    const before = item.baseline, after = item.classified
    lines.push('| ' + [item.game, item.ply, item.san, before.actual, item.actual, before.dropPct, after.dropPct,
      `${values(before.bestEval)}/${values(after.bestEval)}`, `${values(before.playedEval)}/${values(after.playedEval)}`,
      `${values(before.bestMate)}/${values(after.bestMate)}`, `${values(before.playedMate)}/${values(after.playedMate)}`,
      `${item.baselineClampAffected}/${item.deeperClampAffected}`].map(values).join(' | ') + ' |')
  }
  const report = lines.join('\n') + '\n'
  await writeFile(path.join(root, 'agent-output/qa-error-diagnostic.md'), report)
  console.log(report)
} catch (error) { console.error(`STOP: ${error.message}`); process.exitCode = 1 }
finally { engine?.close() }
