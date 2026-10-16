// Reusable offline replay. No engine launcher, network client, or reference editing.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { selectRefinementView, REFINEMENT_POLICY } from '../src/lib/analysisRefinement.js'
import { validGrandeSearch } from '../src/lib/grandeProofs.js'
import { NATIVE_PROOF_POLICY, nativeAlternativeFen } from '../src/lib/nativeEvidence.js'
import { SACRIFICE_SEARCH_POLICY } from '../src/lib/sacrificeSearches.js'
import { applyMoveFacts } from '../src/lib/reviewEvaluation.js'
import { LABELS, compareReviewRows, renderReviewReport } from './qa/review-report.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
process.chdir(root)
const area = 'agent-output/review-automation', sha = b => createHash('sha256').update(b).digest('hex')
const args = process.argv.slice(2), candidateIndex = args.indexOf('--candidate')
const candidate = candidateIndex < 0 ? null : args[candidateIndex + 1]
const acceptedArgs = new Set(['--refresh', '--help'])
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--candidate' && args[i + 1] && !args[i + 1].startsWith('--')) { i++; continue }
  if (!acceptedArgs.has(args[i])) throw new Error(`Argomento sconosciuto o incompleto: ${args[i]}`)
}
if (args.includes('--help')) {
  console.log('npm run review:auto [-- --candidate percorso.js] [--refresh]\nRiusa le prove registrate; --refresh ricostruisce solo la cache derivata, senza motore.\nExit 0: nessuna regressione/falso speciale; 1: errore o regressione. Report: agent-output/review-automation/latest.md')
  process.exit(0)
}
await mkdir(area, { recursive: true })
const inputs = new Map()
const read = async p => { const b = await readFile(p); inputs.set(p, sha(b)); return b }
const json = async p => JSON.parse(await read(p))
const save = (name, value) => writeFile(`${area}/${name}`, JSON.stringify(value) + '\n')
const frozen = await json('agent-output/specials-frozen-candidate-v1.json')
for (const s of frozen.sources) assert.equal(sha(await read(s.path)), s.sha256, `Dipendenza numerica modificata: ${s.path}`)
const baseline = await json('agent-output/native-winning-integration-v1/verification.json')
assert(baseline.passed)
const numericFields = baseline.numericFieldsUnchanged

async function prepare() {
  const { cases } = await json('agent-output/special-completion-v1/cohorts.json')
  const deep = new Map(), small = new Map()
  for (const collection of ['special-completion-evidence-v1', 'native-wdl-evidence-v1', 'native-alternative-evidence-v1']) {
    const c = await json(`agent-output/${collection}/collection.json`)
    for (const r of c.records) {
      const b = await read(r.path); assert.equal(sha(b), r.sha256, r.path)
      const p = JSON.parse(b)
      if (p.nodes === 1000000 && p.multiPv === 5 && !p.searchMoves && !deep.has(p.fen)) deep.set(p.fen, p.engine)
    }
  }
  const sp = await json('agent-output/all-sacrifice-proofs-v1/protocol.json')
  const sc = await json('agent-output/all-sacrifice-proofs-v1/collection.json')
  for (const r of sc.records) { const b = await read(r.path); assert.equal(sha(b), r.sha256, r.path); small.set(r.index, JSON.parse(b).engine) }
  const prior = await json('agent-output/all-sacrifice-proofs-v1/verification-v2.json')
  assert(prior.passed)
  // Only the old generic decision certificates belong in grandeProof.
  // Later native certificates must never be relabelled as generic evidence.
  const recovery = new Set(prior.rows.filter(r => r.grande?.decisionProof).map(r => `${r.cohort}:${r.game}:${r.ply}`))
  const prepared = []
  for (const c of cases) {
    const seeded = reclassifyReviewedMoves(structuredClone(c.entries).map(e => {
      const observations = sp.observations.filter(o => o.cohort === c.cohort && o.game === c.id && o.ply === e.ply)
      const offers = sp.targets.filter(t => t.fen === e.fenAfter && observations.some(o => o.captureUci === t.captureUci))
      const sacrifices = offers.map(t => ({ version: SACRIFICE_SEARCH_POLICY.version, fen: t.fen, captureUci: t.captureUci, acceptedFen: t.acceptedFen,
        acceptance: small.get(t.acceptance), confirmation: small.get(t.confirmation), recoveries: t.recoveries.map(r => ({ uci: r.uci, afterFen: r.afterFen, search: small.get(r.search), confirmation: small.get(r.confirmation) })) }))
      const hasRecovery = recovery.has(`${c.cohort}:${c.id}:${e.ply}`)
      if (!sacrifices.length && !hasRecovery) return e
      return { ...e, refinement: { ...e.refinement, version: REFINEMENT_POLICY.version,
        ...(hasRecovery ? { grandeProof: { version: 'grande-decision-proof-v1', root: deep.get(e.fenBefore), child: deep.get(e.fenAfter) } } : {}),
        sacrifices: [...(e.refinement?.sacrifices ?? []).filter(r => !sacrifices.some(s => s.captureUci === r.captureUci)), ...sacrifices] } }
    }))
    const entries = selectRefinementView(seeded, true).map(e => {
      const root = deep.get(e.fenBefore), child = deep.get(e.fenAfter)
      if (!validGrandeSearch(root, e.fenBefore) || !validGrandeSearch(child, e.fenAfter)) return e
      const alternatives = root.specialLines.filter(l => l.pv[0] !== e.playedUci).flatMap(l => {
        const uci = l.pv[0], fen = nativeAlternativeFen(e, uci), engine = deep.get(fen)
        return validGrandeSearch(engine, fen) ? [{ uci, fen, engine }] : []
      })
      return { ...e, nativeDecisionProof: { version: NATIVE_PROOF_POLICY.version, root, child, alternatives, attempts: [] } }
    })
    prepared.push({ cohort: c.cohort, id: c.id, expected: c.expected, entries,
      numbers: entries.map(e => numericFields.map(k => e[k] ?? null)) })
    console.log(`Preparazione ${c.cohort}/${c.id}: ${entries.length} mosse`)
  }
  const cache = { schema: 1, cases: prepared, inputs: [...inputs].map(([path, sha256]) => ({ path, sha256 })) }
  await save('prepared.json', cache)
  await save('prepared-integrity.json', { sha256: sha(await readFile(`${area}/prepared.json`)) })
  return cache
}

let cache
if (!args.includes('--refresh')) {
  try {
    const bytes = await readFile(`${area}/prepared.json`)
    const integrity = JSON.parse(await readFile(`${area}/prepared-integrity.json`))
    assert.equal(sha(bytes), integrity.sha256, 'Cache derivata modificata: usare --refresh')
    cache = JSON.parse(bytes); assert.equal(cache.schema, 1)
    for (const s of cache.inputs) assert.equal(sha(await read(s.path)), s.sha256, `Prova modificata: ${s.path}; usare --refresh`)
  } catch (e) { if (e.code !== 'ENOENT') throw e }
}
if (!cache) cache = await prepare()

const modelSources = new Map()
for (const name of (await readdir('src/lib')).filter(n => n.endsWith('.js')).sort()) modelSources.set(`src/lib/${name}`, sha(await readFile(`src/lib/${name}`)))
for (const p of ['scripts/review-automation.mjs', 'scripts/qa/review-report.mjs', 'package-lock.json']) modelSources.set(p, sha(await readFile(p)))
// Explicitly approved development collections extend the frozen base inputs.
// No discovery of arbitrary files, reference labels, or reserved games.
const evidenceConfig = 'scripts/qa/review-evidence.json'
const extraRead = async p => { const b = await readFile(p); modelSources.set(p, sha(b)); return JSON.parse(b) }
const extra = new Map()
for (const spec of (await extraRead(evidenceConfig)).collections) {
  assert((await extraRead(spec.replay)).passed, spec.replay)
  const collection = await extraRead(spec.collection)
  assert(collection.complete, spec.collection)
  for (const record of collection.records) {
    const packet = await extraRead(record.path)
    assert.equal(modelSources.get(record.path), record.sha256, record.path)
    if (packet.nodes === 1000000 && packet.multiPv === 5 && !packet.searchMoves && validGrandeSearch(packet.engine, packet.fen)) extra.set(packet.fen, packet.engine)
  }
}
for (const c of cache.cases) for (const e of c.entries) {
  const proof = e.nativeDecisionProof
  if (!proof?.root || !proof.child) continue
  for (const line of proof.root.specialLines.slice(1)) {
    const uci = line.pv[0], fen = nativeAlternativeFen(e, uci), engine = extra.get(fen)
    if (engine && !proof.alternatives.some(r => r.uci === uci)) proof.alternatives.push({ uci, fen, engine })
  }
}
let classify = reclassifyReviewedMoves
if (candidate) {
  const absolute = path.resolve(candidate), relative = path.relative(root, absolute)
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Candidato fuori dal progetto')
  const code = await readFile(absolute, 'utf8')
  modelSources.set(relative, sha(code))
  // Historical candidate files contain imports relative to src/lib.
  const rewritten = code.replaceAll("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
    .replace(/from '(\.\/[^']+)'/g, (_, p) => `from '${pathToFileURL(path.resolve(root, 'src/lib', p)).href}'`)
  for (const m of rewritten.matchAll(/from ['"](file:[^'"]+)['"]/g)) {
    const p = fileURLToPath(m[1]), rel = path.relative(root, p)
    assert(!rel.startsWith('..') && !path.isAbsolute(rel), 'Import candidato fuori dal progetto')
    modelSources.set(rel, sha(await readFile(p)))
  }
  const mod = await import('data:text/javascript;base64,' + Buffer.from(rewritten).toString('base64'))
  assert.equal(typeof mod.reclassifySpecialMoves, 'function')
  classify = entries => mod.reclassifySpecialMoves(entries).map(applyMoveFacts)
}
const fingerprint = sha(JSON.stringify({ prepared: sha(await readFile(`${area}/prepared.json`)), sources: [...modelSources], candidate }))
const resultPath = `${area}/result-${fingerprint}.json`
let report
try { report = JSON.parse(await readFile(resultPath)) } catch (e) { if (e.code !== 'ENOENT') throw e }
if (!report) {
  const rows = []
  for (const c of cache.cases) {
    const after = classify(structuredClone(c.entries))
    assert.equal(after.length, c.entries.length)
    for (let i = 0; i < after.length; i++) {
      const e = after[i]
      assert.equal(e.ply, c.entries[i].ply)
      assert(LABELS[e.classification], `Categoria sconosciuta: ${e.classification}`)
      rows.push({ cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove, expected: c.expected[i], actual: LABELS[e.classification],
        numericUnchanged: numericFields.every((k, j) => (e[k] ?? null) === c.numbers[i][j]), reason: e.specialAssessment?.grande?.reason })
    }
    console.log(`Verificato ${c.cohort}/${c.id}: ${after.length} mosse`)
  }
  report = { schema: 1, fingerprint, candidate, developmentOnly: true, independentValidation: false, newEngineSearches: 0,
    mode: 'stored-evidence-classifier-replay', baselineVersion: baseline.version, sources: [...modelSources].map(([path, sha256]) => ({ path, sha256 })),
    result: compareReviewRows(baseline.rows, rows) }
  for (const [p, hash] of modelSources) assert.equal(sha(await readFile(p)), hash, `Sorgente cambiata durante il controllo: ${p}`)
  await writeFile(resultPath, JSON.stringify(report, null, 2) + '\n')
} else console.log('Sorgenti e prove identiche: riuso il risultato precedente.')
await save('latest.json', report)
await writeFile(`${area}/latest.md`, renderReviewReport(report))
console.log(JSON.stringify({ passed: report.result.passed, cachedFingerprint: fingerprint.slice(0, 12), specials: report.result.specials,
  improvements: report.result.improvements.length, regressions: report.result.regressions.length, unresolved: report.result.unresolved.length,
  newEngineSearches: 0, report: `${area}/latest.md` }))
if (!report.result.passed) process.exitCode = 1
