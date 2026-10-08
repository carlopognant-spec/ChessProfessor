import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { auditCompensationHistory } from './brilliant-compensation-history.js'

const root = new URL('../', import.meta.url), sources = [], rows = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); sources.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const baseline = await input('agent-output/brilliant-offer-v2-2026-10-08T02-16-04-769Z/results.json')
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const metadata = []
for (const id of ids) {
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  const fixture = await input(`tests/fixtures/qa/${id}.json`)
  if (cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000 || cache.multiPv !== 5
    || cache.threads !== 1 || cache.hashMb !== 16 || cache.scorePerspective !== 'side-to-move at each FEN'
    || fixture.pgn !== cache.pgn) throw Error('Incompatible source')
  metadata.push({ id, source: fixture.source, role: fixture.role,
    ratingsInPgn: [...fixture.pgn.matchAll(/\[(WhiteElo|BlackElo)\s+"([^"]*)"\]/g)].map(m => ({ tag: m[1], value: m[2] })) })
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.ply !== index + 1 || index && cache.entries[index - 1].fenAfter !== entry.fenBefore) throw Error('Broken game chain')
    const result = auditCompensationHistory(entry, cache.entries[index - 2], cache.entries[index - 1])
    const reference = baseline.rows.find(r => r.id === id && r.ply === entry.ply)
    if (!reference || reference.san !== entry.san) throw Error('Reference mismatch')
    rows.push({ id, group: reference.group, ply: entry.ply, san: entry.san, expected: reference.expected, base: reference.base,
      v2: reference.v2, diagnostic: result })
  }
}
for (const source of sources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source changed')
const offers = rows.flatMap(r => r.diagnostic.offers.map(o => ({ id: r.id, ply: r.ply, san: r.san, base: r.base, expected: r.expected, ...o })))
const summary = { plies: rows.length, materialOffers: offers.length,
  persistentOffers: offers.filter(o => o.attribution.status === 'persistent').length,
  statusCounts: Object.fromEntries([...new Set(offers.map(o => o.status))].sort().map(s => [s, offers.filter(o => o.status === s).length])),
  searchesExecuted: 0, sourceHashesUnchanged: true, appIntegration: false, independentValidation: false,
  causalAttributionEstablished: false, classificationChanged: false }
const cases = rows.filter(r => r.expected === 'Geniale' || r.v2 && r.expected !== 'Geniale')
const newlyCompensated = offers.filter(o => o.status === 'previously-poor-now-compensated')
const directory = new URL(`agent-output/brilliant-compensation-history-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, cases, newlyCompensated, metadata, rows, sources }, null, 2) + '\n', { flag: 'wx' })
const describe = o => `${o.offer.replySan}: ${o.status}; ora ${o.current.minProbability ?? '?'}–${o.current.maxProbability ?? '?'}; prima ${o.previous.map(p => `${p.rootUci} ${p.minProbability ?? '?'}–${p.maxProbability ?? '?'}`).join('; ') || 'non confrontabile'}`
const report = ['# Compensazione delle offerte persistenti', '', 'Protocollo: ../brilliant-compensation-history-v1-protocol.md. Confronto temporale, non causale. Nessuna nuova classificazione.', '',
  ...Object.entries(summary).map(([k,v]) => `- ${k}: ${JSON.stringify(v)}`), '',
  '## Tre riferimenti e due falsi positivi v2', '',
  ...cases.map(r => `- ${r.id} ${r.ply} ${r.san} (${r.expected}): ${r.diagnostic.offers.map(describe).join(' | ')}`), '',
  '## Tutte le offerte precedentemente sfavorevoli ora compensate', '',
  ...newlyCompensated.map(o => `- ${o.id} ${o.ply} ${o.san} (${o.expected}, base ${o.base}): ${describe(o)}`), '',
  'Score diversi da ricerche diverse/depth diverse non provano miglioramento causato dalla mossa. Mancanza di score non equivale a sacrificio sfavorevole. Nessun uso di Elo stimato. App/Grande/cache invariati, nessuna nuova ricerca/commit/push. Suite app/build/browser NON ESEGUITI.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary,
  cases: cases.map(r => ({ id: r.id, ply: r.ply, san: r.san, expected: r.expected, offers: r.diagnostic.offers.map(describe) })),
  newlyCompensated: newlyCompensated.map(o => ({ id: o.id, ply: o.ply, san: o.san, expected: o.expected, base: o.base })), metadata }, null, 2))
