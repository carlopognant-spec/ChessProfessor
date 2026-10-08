import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { auditSacrifices } from './brilliant-sacrifice-audit.js'

const root = new URL('../', import.meta.url), watched = [], rows = []
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const base = 'tests/fixtures/qa/', folder = base + 'analysis-cache-large-200k/2026-10-07T09-51-26-999Z/'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); watched.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const v1 = await input('agent-output/stockfish-specials-simple-2026-10-07T19-25-40-871Z/results.json')
for (const id of ids) {
  const fixture = await input(base + id + '.json'), cache = await input(folder + id + '.json')
  if (fixture.pgn !== cache.pgn || cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000) throw Error('Incompatible source')
  const full = new Chess(); full.loadPgn(fixture.pgn)
  const moves = full.history(), game = new Chess()
  if (moves.length !== cache.entries.length) throw Error('Incomplete game')
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.ply !== index + 1 || entry.fenBefore !== game.fen() || entry.san !== moves[index]) throw Error('Invalid chain')
    const move = game.move(entry.san)
    if (entry.fenAfter !== game.fen() || entry.uci !== `${move.from}${move.to}${move.promotion ?? ''}`) throw Error('Invalid cached move')
    const audit = auditSacrifices(entry)
    const expected = fixture.annotations.find(a => a.ply === entry.ply)
    const baseline = v1.rows.find(r => r.gameId === id && r.ply === entry.ply)
    if (!expected || expected.san !== entry.san || baseline?.expected !== expected.category) throw Error('Reference mismatch')
    rows.push({ id, group: id.startsWith('personal') ? 'development' : 'historical', ply: entry.ply, san: entry.san,
      fenBefore: entry.fenBefore, fenAfter: entry.fenAfter, expected: expected.category, base: baseline.base,
      v1: baseline.predicted, v1Reason: baseline.reason, audit })
  }
}
for (const source of watched) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source changed')
const candidates = rows.filter(r => r.audit.offers.some(o => o.candidateMaterialLoss))
const offers = candidates.flatMap(r => r.audit.offers.filter(o => o.candidateMaterialLoss).map(o => ({ ...o, id: r.id, ply: r.ply, expected: r.expected })))
const goodCandidates = candidates.filter(r => ['Migliore', 'Ottima'].includes(r.base))
const summary = { plies: rows.length, searchesExecuted: 0, sourceHashesUnchanged: true, independentValidation: false,
  candidateMoves: candidates.length, candidateAcceptances: offers.length,
  referenceBrilliantMoves: rows.filter(r => r.expected === 'Geniale').length,
  candidateBrilliantMoves: candidates.filter(r => r.expected === 'Geniale').length,
  candidateOtherMoves: candidates.filter(r => r.expected !== 'Geniale').length,
  goodBaseCandidateMoves: goodCandidates.length,
  uncachedAcceptances: offers.filter(o => !o.cachedAcceptance).length,
  bestDefenseAcceptsCandidateMoves: candidates.filter(r => r.audit.bestReplyAcceptsMaterialCandidate).length,
  cachedImmediateExchangeAcceptances: offers.filter(o => o.continuation?.immediateRecoveryByCapture).length,
  groups: ['development', 'historical'].map(group => {
    const own = rows.filter(r => r.group === group), selected = own.filter(r => r.audit.offers.some(o => o.candidateMaterialLoss))
    return { group, plies: own.length, referenceBrilliant: own.filter(r => r.expected === 'Geniale').length,
      materialCandidates: selected.length, brilliantMaterialCandidates: selected.filter(r => r.expected === 'Geniale').length }
  }), appIntegration: false }
const cases = rows.filter(r => r.expected === 'Geniale')
const directory = new URL(`agent-output/brilliant-sacrifice-audit-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, cases, rows, watched }, null, 2) + '\n', { flag: 'wx' })
const report = ['# Geniale — audit delle accettazioni legali', '', ...Object.entries(summary).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`), '',
  '## Tutti i riferimenti Geniale', '', ...cases.flatMap(r => [
    `### ${r.id}, ply ${r.ply}, ${r.san}`, `Base: ${r.base}; v1: ${r.v1}; motivo v1: ${r.v1Reason}.`,
    `Materiale prima/dopo: ${r.audit.initialMaterial}/${r.audit.materialAfterOffer}. Miglior risposta: ${r.audit.bestReply}. Alternative root già vincenti: ${JSON.stringify(r.audit.winningAlternatives)}.`, '',
    '| Accettazione | Pezzo | Mosso adesso | Già attaccato geometricamente | Delta | In cache | Miglior difesa | PV e saldi |', '|---|---|---|---|---:|---|---|---|',
    ...r.audit.offers.map(o => `| ${o.replySan} | ${o.offeredType}@${o.offeredSquare} | ${o.isMovedPiece} | ${o.geometricallyAttackedBefore} | ${o.materialDeltaAfterAcceptance} | ${o.cachedAcceptance} | ${o.bestDefenseAcceptsThis} | ${o.continuation ? o.continuation.events.map(e => `${e.san} (${e.materialDelta})`).join(' ') : 'NON DISPONIBILE'} |`), '']),
  '## Tutte le offerte materiali con base Migliore/Ottima', '',
  '| Partita | Ply | SAN | Riferimento | Base | Accettazione | Delta | Ricattura immediata nella PV | In cache |', '|---|---:|---|---|---|---|---:|---|---|',
  ...goodCandidates.flatMap(r => r.audit.offers.filter(o => o.candidateMaterialLoss).map(o => `| ${r.id} | ${r.ply} | ${r.san} | ${r.expected} | ${r.base} | ${o.replySan} | ${o.materialDeltaAfterAcceptance} | ${o.continuation?.immediateRecoveryByCapture ?? 'ignoto'} | ${o.cachedAcceptance} |`)), '',
  'Offerta materiale non equivale a Geniale. Righe root di depth diverse non provano qualità delle alternative; una PV non è una prova contro tutte le difese. Attacchi geometrici prima dell’offerta possono includere pezzi inchiodati. Score assenti non sono sostituiti con probabilità neutre.', '',
  'Grande e app invariati; nessun motore avviato, lettura .env/7–10 o modifica alle cache. Suite app/build/browser NON ESEGUITI. Nessun commit/push.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, cases: cases.map(r => ({ id: r.id, ply: r.ply, san: r.san, v1Reason: r.v1Reason,
  offers: r.audit.offers.map(o => ({ reply: o.replySan, type: o.offeredType, delta: o.materialDeltaAfterAcceptance, wasAttacked: o.geometricallyAttackedBefore,
    isMoved: o.isMovedPiece, cached: o.cachedAcceptance, acceptsBest: o.bestDefenseAcceptsThis })), winningAlternatives: r.audit.winningAlternatives })) }, null, 2))
