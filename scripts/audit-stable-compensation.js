import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { classifySpecialMove } from '../src/lib/specialClassification.js'
import { collectSacrificeEvidence } from '../src/lib/sacrificeEvidence.js'

const root = new URL('../', import.meta.url), sources = new Map()
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path, json = true) {
  const bytes = await readFile(new URL(path, root)); sources.set(path, hash(bytes))
  return json ? JSON.parse(bytes) : bytes.toString('utf8')
}
await input('agent-output/stable-compensation-v1-protocol.md', false)
for (const path of ['scripts/audit-stable-compensation.js', 'src/lib/specialClassification.js', 'src/lib/sacrificeEvidence.js']) await input(path, false)
const frozen = await input('agent-output/specials-frozen-candidate-v1.json')
for (const source of frozen.sources) {
  const bytes = await readFile(new URL(source.path, root))
  if (hash(bytes) !== source.sha256) throw Error(`Frozen source changed: ${source.path}`)
  sources.set(source.path, source.sha256)
}
const baseline = await input('agent-output/special-classification-2026-10-09T12-14-50-139Z/results.json')
const external = await input('agent-output/external-specials-probe-2026-10-09T14-03-37-245Z/results.json')
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`),
  'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const rows = []
const categories = { Grande: 'great', Geniale: 'brilliant', 'Mossa mancata': 'missed' }
function evaluate(id, entries, reference) {
  const coverageOnly = [], corroborated = []
  for (const [i, entry] of entries.entries()) {
    const evidence = collectSacrificeEvidence(entry, entries[i + 1])
    const b = classifySpecialMove(entry, coverageOnly.at(-1), coverageOnly.at(-2),
      evidence && { ...evidence, allowConfirmation: false })
    const c = classifySpecialMove(entry, corroborated.at(-1), corroborated.at(-2), evidence)
    coverageOnly.push(b); corroborated.push(c)
    const expected = reference(entry.ply)
    rows.push({ id, ply: entry.ply, san: entry.playedMove, expected,
      baseline: entry.classification, coverageOnly: b.classification, corroborated: c.classification,
      baselineAssessment: entry.specialAssessment.brilliant,
      coverageAssessment: b.specialAssessment.brilliant, corroboratedAssessment: c.specialAssessment.brilliant,
      sameFenRoots: evidence?.acceptanceLines.length ?? 0,
      confirmations: evidence?.confirmations.map(row => ({ captureUci: row.captureUci, fen: row.fen,
        depth: row.line.depth, evalCp: row.line.evalCp, mate: row.line.mate, index: row.index })) ?? [] })
  }
}
for (const id of ids) {
  const fixture = await input(`tests/fixtures/qa/${id}.json`)
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  let before = 0, after = 0
  const entries = await analyzeGame({ openingBook: book, baseFen: cache.entries[0].fenBefore,
    moves: cache.entries.map(e => e.san),
    analyzePosition: async fen => { const e = cache.entries[before++]; if (e.fenBefore !== fen) throw Error('Before FEN'); return e.engine },
    analyzePlayedPosition: async fen => { const e = cache.entries[after++]; if (e.fenAfter !== fen) throw Error('After FEN'); return e.playedEngine } })
  for (const entry of entries) {
    const old = baseline.rows.find(r => r.id === id && r.ply === entry.ply)
    if (!old || old.after !== entry.classification) throw Error(`Baseline changed: ${id}/${entry.ply}`)
  }
  evaluate(id, entries, ply => categories[fixture.annotations.find(a => a.ply === ply)?.category] ?? fixture.annotations.find(a => a.ply === ply)?.category)
}
evaluate('external-vienna-53976549565', external.entries, ply => external.rows.find(r => r.ply === ply)?.reference ?? null)
function metrics(subset, variant) {
  return ['great', 'brilliant', 'missed'].map(category => {
    const labelled = subset.filter(r => r.expected != null)
    const assigned = labelled.filter(r => r[variant] === category)
    const positive = labelled.filter(r => r.expected === category)
    const tp = assigned.filter(r => r.expected === category).length
    return { category, tp, fp: assigned.length - tp, fn: positive.length - tp }
  })
}
const development = rows.filter(r => !r.id.startsWith('external-')), publicGame = rows.filter(r => r.id.startsWith('external-'))
const changed = rows.filter(r => r.baseline !== r.corroborated || r.baseline !== r.coverageOnly)
const summary = { version: 'stable-compensation-v1-candidate', newSearches: 0, plies: rows.length,
  baselineReproduced: true, sourceHashesUnchanged: true, independentlyValidated: false,
  appDefaultChanged: false, metrics: Object.fromEntries(['baseline', 'coverageOnly', 'corroborated'].map(v =>
    [v, { development: metrics(development, v), publicExamples: metrics(publicGame, v) }])),
  changed: changed.length, coverageSources: rows.filter(r => r.sameFenRoots).length,
  confirmationSources: rows.filter(r => r.confirmations.length).length }
for (const [path, digest] of sources) if (hash(await readFile(new URL(path, root))) !== digest) throw Error(`Changed input: ${path}`)
const directory = new URL(`agent-output/stable-compensation-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, rows, changed,
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(new URL('report.md', directory), ['# Compensazione corroborata: confronto completo', '',
  ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
  '| Partita/ply | Mossa | Riferimento | V5 | Sola copertura | Conferma | Motivo finale |', '|---|---|---|---|---|---|---|',
  ...changed.map(r => `| ${r.id}/${r.ply} | ${r.san} | ${r.expected ?? 'sconosciuto'} | ${r.baseline} | ${r.coverageOnly} | ${r.corroborated} | ${r.corroboratedAssessment.reason} |`), '',
  'Il confronto pubblico ora è dato di sviluppo: l’ipotesi deriva da Bxf4. Le mosse non annotate non sono negativi. Nessuna ricerca aggiuntiva e nessuna modifica alla politica predefinita.', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, changed }, null, 2))
