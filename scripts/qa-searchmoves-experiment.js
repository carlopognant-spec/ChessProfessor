import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { NativeEngine } from './qa/native-engine.js'
import { compare, validateCache, labels, summarizeReports } from './qa/compare.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const base = 'tests/fixtures/qa/'
const output = base + 'analysis-cache-searchmoves/'
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const executable = 'tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe'
const digest = text => createHash('sha256').update(text).digest('hex')
const readJson = async filename => JSON.parse(await readFile(filename, 'utf8'))
const save = async (filename, value) => writeFile(output + filename, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const cachedLine = entry => entry.engine.lines.find(line => line.multipv <= 5 && line.pv[0] === entry.uci)
let activeEngine
let context = 'preflight'
let goCount = 0
async function session() {
  activeEngine = new NativeEngine(executable)
  await activeEngine.init()
  if (activeEngine.version !== 'Stockfish 16') throw new Error(`Versione inattesa: ${activeEngine.version}`)
  await activeEngine.newGame()
  return activeEngine
}
async function search(engine, entry, moves, multiPv) {
  const commands = [`setoption name MultiPV value ${multiPv}`, `position fen ${entry.fenBefore}`, `go depth 12 searchmoves ${moves.join(' ')}`]
  const lines = new Map(), discardedBounds = []
  const started = performance.now()
  goCount++
  const result = await engine.request(commands, raw => {
    const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (raw.startsWith('info ') && score) {
      if (/\b(upperbound|lowerbound)\b/.test(raw)) discardedBounds.push(raw)
      else {
        const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
        lines.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0), evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null, pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
      }
    }
    if (raw.startsWith('bestmove ')) return { commands, bestmove: raw, lines: [...lines.values()].sort((a, b) => a.multipv - b.multipv), discardedBounds }
  })
  result.elapsedMs = performance.now() - started
  if (result.lines.length !== moves.length || result.lines.some(line => line.depth !== 12 || !moves.includes(line.pv[0]) || (line.evalCp == null && line.mate == null)) || new Set(result.lines.map(line => line.pv[0])).size !== moves.length) throw new Error(`Risultato incompleto/non valido: ${JSON.stringify(result)}`)
  return result
}
function distribution(pairs) {
  const cp = pairs.filter(([a, b]) => Number.isFinite(a?.evalCp) && Number.isFinite(b?.evalCp))
  const values = cp.map(([a, b]) => Math.abs(a.evalCp - b.evalCp)).sort((a, b) => a - b)
  const n = values.length
  return { pairs: pairs.length, cpPairs: n, mean: n ? values.reduce((a, b) => a + b, 0) / n : null, median: n ? (values[Math.floor((n - 1) / 2)] + values[Math.floor(n / 2)]) / 2 : null, p90: n ? values[Math.ceil(n * .9) - 1] : null, max: n ? values[n - 1] : null, signInversions: cp.filter(([a, b]) => a.evalCp * b.evalCp < 0).length, zeroTransitions: cp.filter(([a, b]) => (a.evalCp === 0) !== (b.evalCp === 0)).length, mateCp: pairs.filter(([a, b]) => (a?.mate != null && b?.evalCp != null) || (b?.mate != null && a?.evalCp != null)).length, mateMate: pairs.filter(([a, b]) => a?.mate != null && b?.mate != null).length }
}
function replacement(entry, record, pairMode) {
  // Adapt root scores to the existing QA contract without changing production code.
  // Keep cached primary in single mode; pair mode uses the newly ranked primary.
  const primary = pairMode && record.pair ? record.pair.lines[0] : entry.engine.lines.find(line => line.multipv === 1)
  const played = pairMode && record.pair ? record.pair.lines.find(line => line.pv[0] === entry.uci) : record.single.lines[0]
  const lines = [{ ...(primary.pv[0] === entry.uci ? played : primary), multipv: 1 }, ...(primary.pv[0] === entry.uci ? [] : [{ ...played, multipv: 2 }])]
  return { ...entry, engine: { ...lines[0], lines } }
}
const score = row => row.playedMate != null ? `mate ${row.playedMate}` : row.playedEval
let seed = 20261007
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
try {
  const inputs = []
  const protectedFiles = []
  for (const id of ids) {
    const fixturePath = base + id + '.json', cachePath = base + 'analysis-cache/' + id + '.json'
    const fixtureText = await readFile(fixturePath, 'utf8'), cacheText = await readFile(cachePath, 'utf8')
    const fixture = { ...JSON.parse(fixtureText), id }, cache = JSON.parse(cacheText)
    validateCache(cache, fixture, ENGINE_CONFIG)
    if (cache.depth !== 12 || cache.multiPv !== 5 || cache.threads !== 1 || cache.hashMb !== 16 || cache.engineVersion !== 'Stockfish 16') throw new Error(`Baseline incompatibile: ${id}`)
    protectedFiles.push({ path: fixturePath, sha256: digest(fixtureText) }, { path: cachePath, sha256: digest(cacheText) })
    inputs.push({ id, fixture, cache, K: cache.entries.filter(e => !cachedLine(e)).length })
  }
  if (process.argv.includes('--preflight')) { console.log(JSON.stringify(inputs.map(({ id, cache, K }) => ({ id, P: cache.entries.length, K })), null, 2)); process.exit(0) }
  await access(executable)
  try { await access(output); throw new Error('Cartella risultati già presente: nessuna sovrascrittura') } catch (error) { if (error.code !== 'ENOENT') throw error }
  await mkdir(output)
  const startedAt = new Date().toISOString(), started = performance.now()
  const results = []
  // Separate processes per game AND per search scheme: identical cold start,
  // ucinewgame, ascending ply order; no interleaving of pair/single hash state.
  for (const input of inputs) {
    const records = input.cache.entries.map(entry => ({ ply: entry.ply, uci: entry.uci, fenBefore: entry.fenBefore, insideMultiPv: Boolean(cachedLine(entry)), single: null, pair: null }))
    for (const mode of ['single', 'pair']) {
      context = `${input.id}/${mode}/init`
      const engine = await session()
      for (const [index, entry] of input.cache.entries.entries()) {
        if (mode === 'pair' && records[index].insideMultiPv) continue
        context = `${input.id}/${mode}/ply ${entry.ply}`
        const moves = mode === 'single' ? [entry.uci] : [entry.engine.lines.find(line => line.multipv === 1).pv[0], entry.uci]
        records[index][mode] = await search(engine, entry, moves, mode === 'single' ? 1 : 2)
        if (entry.ply % 20 === 0) console.log(`${context}; go=${goCount}`)
      }
      engine.close(); activeEngine = null
      await save(`${input.id}-${mode}.json`, { schemaVersion: 1, experiment: 'C7', engineVersion: engine.version, depth: 12, threads: 1, hashMb: 16, hashPolicy: 'new process and ucinewgame per game/scheme; retained within ascending selected plies', startedAt, baselineSha256: protectedFiles.find(f => f.path === base + 'analysis-cache/' + input.id + '.json').sha256, entries: records.filter(r => r[mode]).map(r => ({ ply: r.ply, uci: r.uci, fenBefore: r.fenBefore, insideMultiPv: r.insideMultiPv, result: r[mode] })) })
    }
    results.push({ ...input, records })
    console.log(`Completata ${input.id}: P=${records.length}, K=${input.K}`)
  }
  const candidates = results.flatMap(r => r.cache.entries.map(entry => ({ id: r.id, entry })))
  for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]] }
  const sample = candidates.slice(0, 50)
  const repeats = sample.map(({ id, entry }) => ({ id, ply: entry.ply, uci: entry.uci, fenBefore: entry.fenBefore, runs: [] }))
  for (let run = 0; run < 2; run++) {
    // Cold start per game in each replay; same selected-ply order both times.
    for (const id of ids) {
      context = `repeat ${run + 1}/${id}/init`
      const engine = await session()
      for (const [index, item] of sample.entries()) if (item.id === id) {
        context = `repeat ${run + 1}/${id}/ply ${item.entry.ply}`
        repeats[index].runs.push(await search(engine, item.entry, [item.entry.uci], 1))
      }
      engine.close(); activeEngine = null
    }
    console.log(`Ripetibilità passaggio ${run + 1}: go=${goCount}`)
  }
  await save('repeatability.json', { seed: 20261007, sampling: 'Fisher-Yates LCG, 50 without replacement across 8 games; original sampled order within each game; new process/ucinewgame per game and replay', entries: repeats })
  const suspects = await readJson(base + 'suspect-labels.json')
  const openingBook = createOpeningBook((await readJson('src/data/openingPositions.json')).positions)
  const summaries = [], changes = [], allReports = []
  for (const item of results) {
    const schemes = ['current', 'single', 'pair'].map(scheme => {
      const cache = scheme === 'current' ? item.cache : { ...item.cache, entries: item.cache.entries.map((e, i) => scheme === 'pair' && item.records[i].insideMultiPv ? e : replacement(e, item.records[i], scheme === 'pair')) }
      const report = compare(item.fixture, cache, suspects, { openingBook })
      return { scheme, report }
    })
    for (const { scheme, report } of schemes.slice(1)) for (const [i, row] of report.rows.entries()) if (row.actual !== schemes[0].report.rows[i].actual) {
      const previous = schemes[0].report.rows[i]
      changes.push({ id: item.id, scheme, ply: row.ply, san: row.san, expected: row.expected, before: previous.actual, after: row.actual, oldBestCp: previous.bestEval, oldBestMate: previous.bestMate, oldPlayedCp: previous.playedEval, oldPlayedMate: previous.playedMate, newBestCp: row.bestEval, newBestMate: row.bestMate, newPlayedCp: row.playedEval, newPlayedMate: row.playedMate, exclusions: row.reasons })
    }
    const inside = item.records.filter(r => r.insideMultiPv), outside = item.records.filter(r => !r.insideMultiPv)
    const entryFor = r => item.cache.entries[r.ply - 1]
    const singleMs = item.records.reduce((n, r) => n + r.single.elapsedMs, 0), pairMs = outside.reduce((n, r) => n + r.pair.elapsedMs, 0)
    summaries.push({ id: item.id, P: item.records.length, K: item.K, insideNoise: distribution(inside.map(r => [r.single.lines[0], cachedLine(entryFor(r))])), outsidePairVsSingle: distribution(outside.map(r => [r.pair.lines.find(l => l.pv[0] === r.uci), r.single.lines[0]])), outsidePairVsCachedPlayed: distribution(outside.map(r => [r.pair.lines.find(l => l.pv[0] === r.uci), { evalCp: entryFor(r).playedEngine.evalCp == null ? null : -entryFor(r).playedEngine.evalCp, mate: entryFor(r).playedEngine.mate == null ? null : -entryFor(r).playedEngine.mate }])), outsidePairBestVsCache: distribution(outside.map(r => [r.pair.lines.find(l => l.pv[0] === entryFor(r).engine.lines[0].pv[0]), entryFor(r).engine.lines[0]])), singleGo: item.records.length, pairGo: outside.length, singleMs, pairMs })
    allReports.push({ id: item.id, schemes })
  }
  const groups = ['personal', 'historical'].map(group => ({ group, schemes: ['current', 'single', 'pair'].map(scheme => ({ scheme, ...summarizeReports(allReports.filter(r => r.id.startsWith(group === 'personal' ? 'personal-' : 'game-')).map(r => r.schemes.find(s => s.scheme === scheme).report)) })) }))
  const allInside = results.flatMap(item => item.records.filter(r => r.insideMultiPv).map(r => [r.single.lines[0], cachedLine(item.cache.entries[r.ply - 1])]))
  const identical = repeats.filter(r => { const a = r.runs[0].lines[0], b = r.runs[1].lines[0]; return a.evalCp === b.evalCp && a.mate === b.mate }).length
  for (const file of protectedFiles) if (digest(await readFile(file.path, 'utf8')) !== file.sha256) throw new Error(`Baseline modificata: ${file.path}`)
  const summary = { startedAt, finishedAt: new Date().toISOString(), totalElapsedMs: performance.now() - started, goCount, baselineIntegrity: protectedFiles, summaries, insideNoise: distribution(allInside), groups, repeatability: { sample: 50, identical, differences: distribution(repeats.map(r => r.runs.map(run => run.lines[0]))), go: 100, elapsedMs: repeats.reduce((n, r) => n + r.runs.reduce((m, run) => m + run.elapsedMs, 0), 0) }, changes }
  await save('summary.json', summary)
  await save('classifications.json', allReports)
  const report = ['# C7 — Stockfish 16 searchmoves', '', 'Offline; depth 12, Threads 1, Hash 16 MB. Sessione nuova per partita/schema, ucinewgame; hash mantenuta fra richieste dello stesso schema. Riferimenti MultiPV legacy, nessuna nuova ricerca completa.', '', 'Schema single: best cached + played single per ogni ply. Schema pair: MultiPV cached per mosse interne, best/played dalla ricerca a due candidati per mosse esterne. La prima PV della coppia determina isEngineBest; migliore soltanto fra i due candidati. Regole QA, esclusioni e Mossa mancata importate senza modifiche. Terminali: preservata la regola corrente del matto; nessuna nuova regola dello stallo.', '', 'Adattamento QA: score root inseriti in linee sintetiche, stessa depth; root-pv è il contratto numerico del classificatore, NON una dichiarazione che single e best cached provengano dalla stessa ricerca. Raw separati nei file delle ricerche.', '', 'P90 nearest-rank; inversioni di segno strettamente positivo/negativo, zeri separati. Mate/cp esclusi dalla distribuzione cp. Il riferimento 32,74 cp riguarda altre coppie e un diverso sottoinsieme: confronto descrittivo, non test appaiato.', '', '| Partita | P | K | go attuale (storico) | go single misurati | secondi single | go pair aggiuntivi | secondi pair |', '|---|---:|---:|---:|---:|---:|---:|---:|', ...summaries.map(s => `| ${s.id} | ${s.P} | ${s.K} | ${2*s.P} | ${s.singleGo} | ${(s.singleMs/1000).toFixed(3)} | ${s.pairGo} | ${(s.pairMs/1000).toFixed(3)} |`), '', 'Tempi attuale: NON ESEGUITO (cache storiche senza tempi). Tempo completo B4/pair: NON ESEGUITO, manca il costo delle ricerche MultiPV complete e delle eventuali posizioni finali. go candidato B4: P+K+T; questo esperimento single esegue P ricerche anche dentro MultiPV. Pair operativo: P+K+T; pair incrementale offline: K.', '', '| Gruppo | Schema | Esatta | % | Entro una classe | % |', '|---|---|---:|---:|---:|---:|', ...groups.flatMap(g => g.schemes.map(s => `| ${g.group} | ${s.scheme} | ${s.exact}/${s.included} | ${s.exactPct.toFixed(4)} | ${s.withinOne}/${s.ordinalIncluded} | ${s.withinOnePct.toFixed(4)} |`)), '', '## Rumore interno MultiPV', '', '```json', JSON.stringify(summary.insideNoise, null, 2), '```', '', '## Distribuzioni per partita (coppia vs single e cache incluse)', '', '```json', JSON.stringify(summaries, null, 2), '```', '', `Ripetibilità: ${identical}/50 score identici fra due replay a condizioni iniziali e ordine uguali; seed 20261007. Non misura identità rispetto al primo passaggio, che aveva diversa storia hash.`, `go totali reali: ${goCount}; tempo totale ${(summary.totalElapsedMs/1000).toFixed(3)} s.`, '', '## Tutti i cambiamenti di categoria (incluse mosse escluse dalle metriche)', '', '| Partita | Schema | ply | SAN | Attesa | Prima | Dopo | best prima | played prima | best dopo | played dopo | Esclusioni |', '|---|---|---:|---|---|---|---|---|---|---|---|---|', ...changes.map(c => `| ${c.id} | ${c.scheme} | ${c.ply} | ${c.san} | ${c.expected} | ${c.before} | ${c.after} | ${c.oldBestMate != null ? 'mate '+c.oldBestMate : c.oldBestCp} | ${c.oldPlayedMate != null ? 'mate '+c.oldPlayedMate : c.oldPlayedCp} | ${c.newBestMate != null ? 'mate '+c.newBestMate : c.newBestCp} | ${c.newPlayedMate != null ? 'mate '+c.newPlayedMate : c.newPlayedCp} | ${c.exclusions.join(',')} |`), '', 'Stockfish 19/browser: NON ESEGUITO. Build e test sono verifiche del repository, non validazione del worker per questo esperimento.', '']
  await writeFile(output + 'report.md', report.join('\n'), { flag: 'wx' })
  console.log(JSON.stringify({ goCount, seconds: summary.totalElapsedMs/1000, insideNoise: summary.insideNoise, groups, identical, categoryChanges: changes.length }, null, 2))
} catch (error) {
  console.error(`STOP ${context}: ${error.stack ?? error.message}`)
  process.exitCode = 1
} finally { activeEngine?.close() }
