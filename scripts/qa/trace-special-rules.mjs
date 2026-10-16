// Diagnostic instrumentation only. Every caller must compare final labels with
// the unmodified classifier. Inputs and application source stay untouched.
import assert from 'node:assert/strict'
const root = new URL('../../src/lib/', import.meta.url)
export function tracedSpecialSource(rawSpecial, rawOpportunities) {
  const replace = (s, before, after) => {
    assert.equal(s.split(before).length, 2, `Ambiguous trace marker: ${before.slice(0, 90)}`)
    return s.replace(before, after)
  }
  const url = (s, file) => 'data:text/javascript;base64,' + Buffer.from(s
    .replaceAll("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
    .replace(/from '(\.\/[^']+)'/g, (_, p) => `from '${new URL(p, new URL(file, root)).href}'`)).toString('base64')
  let op = rawOpportunities.replaceAll('\r\n', '\n')
  op = replace(op, `  return classifyStoredMatingContinuation(
    classifyCoherentWinningOpportunity(classifyOriginalOpportunity(entry, previous), entry, previous), entry, previous)`,
    `  const original = classifyOriginalOpportunity(entry, previous)
  entry.__auditTrail?.push({rule:'original-opportunity',category:original.classification,status:original.classification==='missed'?'supported':'not-supported',reason:original.missedOpportunityReason})
  const intermediate = classifyCoherentWinningOpportunity(original, entry, previous)
  entry.__auditTrail?.push({rule:'intermediate-opportunity',category:intermediate.classification,status:intermediate!==original?'supported':'unchanged',reason:intermediate.missedOpportunityReason})
  const stored = classifyStoredMatingContinuation(intermediate, entry, previous)
  entry.__auditTrail?.push({rule:'stored-mating-continuation',category:stored.classification,status:stored!==intermediate?'supported':'unchanged',reason:stored.missedOpportunityReason})
  return stored`)
  let s = rawSpecial.replaceAll('\r\n', '\n')
  s = replace(s, "from './moveOpportunities.js'", `from '${url(op, 'moveOpportunities.js')}'`)
  s = replace(s, '  let result = classifyMoveOpportunity(entry, previous)',
    `  const trail = []
  const record = (rule, category, status, detail={}) => trail.push(structuredClone({rule,category,status,...detail}))
  record('numerical',entry.baseClassification??entry.classification,'baseline')
  let result = classifyMoveOpportunity({...entry,__auditTrail:trail}, previous)`)
  s = replace(s, "    events: [], grande: { status: 'rejected', reason: 'not-eligible' },",
    "    events: [], ruleTrace: trail, grande: { status: 'rejected', reason: 'not-eligible' },")
  s = replace(s, `  const finish = () => assessment.brilliant.status === 'supported' ? { ...result, classification: 'brilliant' }
    : assessment.grande.status === 'supported' ? { ...result, classification: 'great' } : result`,
    `  const finish = () => {
    const chosen=assessment.brilliant.status==='supported'?{...result,classification:'brilliant'}:assessment.grande.status==='supported'?{...result,classification:'great'}:result
    record('arbitration',chosen.classification,'final',{great:assessment.grande.status,brilliant:assessment.brilliant.status})
    return chosen
  }`)
  s = replace(s, "  if (result.classification === 'missed') {", "  if (result.classification === 'missed') {\n    record('stop-missed','missed','final')")
  const history = "  if (result.opportunityAssessment?.status === 'retain-numerical') {"
  if (s.includes(history)) s = replace(s, history,
    history + "\n    record('opportunity-history',result.classification,'final',{reason:result.opportunityAssessment.reason})")
  s = replace(s, "if (['book', 'unclassified', 'great', 'brilliant'].includes(result.classification) || result.isBookMove || result.playedMate === 0) return result",
    "if (['book', 'unclassified', 'great', 'brilliant'].includes(result.classification) || result.isBookMove || result.playedMate === 0) {record('stop-protected',result.classification,'final');return result}")
  s = replace(s, "      assessment.grande = assessment.brilliant = { status: 'protected', reason: 'forced-or-terminal' }",
    "      record('forced-or-terminal',result.classification,'protected')\n      assessment.grande = assessment.brilliant = { status: 'protected', reason: 'forced-or-terminal' }")
  s = replace(s, '    if (after.isGameOver()) return result', "    if (after.isGameOver()) {record('terminal-position',result.classification,'final');return result}")
  s = replace(s, '    const response = responseAssessment?.status', "    record('empirical-response','great',responseAssessment?.status??'not-applicable',{reason:responseAssessment?.reason})\n    const response = responseAssessment?.status")
  s = replace(s, "    if (roots.status !== 'available') {", "    record('root-evidence',null,roots.status,{reason:roots.reason,coverage:roots.coverage})\n    if (roots.status !== 'available') {")
  s = replace(s, "      assessment.brilliant = { status: 'insufficient', reason: 'snapshot-disagreement' }",
    "      record('snapshot-consistency',null,'insufficient',{reason:'snapshot-disagreement'})\n      assessment.brilliant = { status: 'insufficient', reason: 'snapshot-disagreement' }")
  s = replace(s, "        assessment.events.push({ kind: 'winning-opportunity', status: 'supported' })",
    "        record('counterfactual-opportunity','missed','supported')\n        assessment.events.push({ kind: 'winning-opportunity', status: 'supported' })")
  s = replace(s, "      assessment.events.push({ kind: 'missed-defense', status: 'supported', coverage: roots.coverage,",
    "      record('missed-defense',null,'supported')\n      assessment.events.push({ kind: 'missed-defense', status: 'supported', coverage: roots.coverage,")
  s = replace(s, "      assessment.brilliant = { status: 'insufficient', reason: 'missing-or-conflicting-played-score' }",
    "      record('played-evidence',null,'insufficient',{reason:'missing-or-conflicting-played-score'})\n      assessment.brilliant = { status: 'insufficient', reason: 'missing-or-conflicting-played-score' }")
  s = replace(s, "    const recovery = baseClassification === 'best'",
    "    record('sacrifice','brilliant',assessment.brilliant.status,{reason:assessment.brilliant.reason})\n    const recovery = baseClassification === 'best'")
  s = replace(s, '    if (recovery) assessment.grande = recovery',
    "    record('equilibrium-recovery','great',recovery?.status??'not-supported',{reason:recovery?.reason})\n    if (recovery) assessment.grande = recovery")
  s = replace(s, '      if (defense || conversion) {',
    "      record('critical-choice','great',defense||conversion?'supported':'not-supported',{defense,conversion})\n      if (defense || conversion) {")
  s = replace(s, "    if (assessment.grande.status === 'supported' && !response)",
    "    record('material-realization','great',assessment.grande.realization?assessment.grande.status:'not-applicable',{reason:assessment.grande.reason})\n    if (assessment.grande.status === 'supported' && !response)")
  s = replace(s, "    assessment.grande = assessment.brilliant = { status: 'insufficient', reason: 'invalid-position-or-variation' }",
    "    record('invalid-position',null,'insufficient')\n    assessment.grande = assessment.brilliant = { status: 'insufficient', reason: 'invalid-position-or-variation' }")
  return url(s, 'specialClassification.js')
}
