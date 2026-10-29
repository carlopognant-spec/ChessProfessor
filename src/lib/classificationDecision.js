import { createClassificationPolicy } from './classificationPolicy.js'
import { formatSpecialAssessment } from './analysisSpecialClassification.js'
import { formatMoveOpportunity } from './moveOpportunities.js'

const bands = ['best', 'excellent', 'good', 'inaccuracy', 'mistake']
const numericalLabels = new Set([...bands, 'blunder', 'unclassified'])
const names = { best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', forced: 'Forzata', book: 'Libro', unclassified: 'Non classificata',
  missed: 'Occasione mancata', great: 'Grande', brilliant: 'Geniale' }
const clone = value => value == null ? null : JSON.parse(JSON.stringify(value))
const validThresholds = policy => bands.every((key, index) => Number.isFinite(policy?.thresholds?.[key])
  && policy.thresholds[key] >= 0 && (!index || policy.thresholds[key] >= policy.thresholds[bands[index - 1]]))
function snapshot(value) {
  const copied = clone(value)
  const freeze = object => {
    if (object && typeof object === 'object') { Object.values(object).forEach(freeze); Object.freeze(object) }
    return object
  }
  return freeze(copied)
}

function decisionFor(entry, policy) {
  const inputs = Object.fromEntries(['bestEval', 'bestMate', 'playedEval', 'playedMate', 'bestProbability',
    'playedProbability', 'dropPct', 'isEngineBest', 'bestUci', 'playedUci', 'evaluationSource', 'baseClassification']
    .map(key => [key, entry[key] ?? null]))
  Object.assign(inputs, { isBookMove: entry.isBookMove ?? null, forced: entry.moveFacts?.forced ?? null,
    legalMoves: entry.moveFacts?.legalMoves ?? null, equivalentBest: entry.evaluationEvidence?.equivalentBest ?? null })
  const label = entry.classification ?? 'unclassified'
  const rule = label === 'forced' ? 'forced-override' : label === 'book' ? 'opening-book'
    : label === 'unclassified' ? 'insufficient-evidence' : label === 'missed' ? 'missed-opportunity'
      : ['great', 'brilliant'].includes(label) ? `special-${label}` : inputs.playedMate === 0 ? 'delivered-mate'
        : label === 'best' && inputs.equivalentBest ? 'equivalent-best'
          : label === 'excellent' && inputs.isEngineBest === false && Number.isFinite(inputs.dropPct)
            && inputs.dropPct <= policy.thresholds?.best ? 'different-primary-choice' : 'loss-band'
  const rootHistory = entry.engine?.history, playedHistory = entry.playedEngine?.history
  const historyMode = rootHistory && playedHistory ? 'game-history' : !rootHistory && !playedHistory
    && entry.engine && entry.playedEngine ? 'fen-only' : 'unknown'
  return snapshot({ schemaVersion: 1, policy, classification: label, numericalClassification: entry.numericalClassification ?? null,
    rule, inputs, evidence: { ...entry.evaluationEvidence, historyMode },
    position: { fenBefore: entry.fenBefore ?? null, fenAfter: entry.fenAfter ?? null, history: entry.engine?.history ?? null },
    engineProfiles: { root: entry.engine?.analysisMetadata ?? null, played: entry.playedEngine?.analysisMetadata ?? null },
    openingBookMetadata: entry.openingBookMetadata ?? null,
    reasons: { missed: entry.missedOpportunityReason ?? null, missedPolicy: entry.missedOpportunity?.policyVersion ?? entry.missedOpportunity?.policy ?? null,
      great: entry.specialAssessment?.grande?.reason ?? null, brilliant: entry.specialAssessment?.brilliant?.reason ?? null,
      specialPolicy: entry.specialAssessment?.version ?? null } })
}

export function annotateClassification(entry, previous = undefined, policy = createClassificationPolicy()) {
  const result = { ...entry, classificationDecision: decisionFor(entry, policy) }
  const origin = entry.classificationOrigin ?? previous?.classificationOrigin ?? previous?.classificationDecision
    ?? (previous !== undefined ? { schemaVersion: 0, classification: previous?.classification ?? null, policy: null } : null)
  if (origin !== null) result.classificationOrigin = snapshot(origin)
  return result
}

export function annotateClassifications(entries, previous = undefined, policy = createClassificationPolicy()) {
  return entries.map((entry, index) => annotateClassification(entry, previous?.[index], policy))
}

export function replayNumericalDecision(decision) {
  const unsupported = { status: 'unsupported' }
  const p = decision?.policy, i = decision?.inputs
  if (decision?.schemaVersion !== 1 || !i || p?.version !== 'classification-policy-v1'
    || p.numericalVersion !== 'loss-bands-v1' || p.reviewVersion !== 'review-reliability-v2'
    || p.scoreModel?.id !== 'cp-logistic-v1' || !Number.isFinite(p.scoreModel.cpScale) || p.scoreModel.cpScale <= 0
    || !validThresholds(p)
    || ![...numericalLabels, 'book', 'forced'].includes(decision.classification)) return unsupported
  const probability = (cp, mate, zeroWins) => Number.isFinite(mate) ? mate === 0 ? Number(zeroWins) : Number(mate > 0)
    : Number.isFinite(cp) ? 1 / (1 + Math.exp(-cp / p.scoreModel.cpScale)) : null
  const best = i.playedMate === 0 ? 1 : probability(i.bestEval, i.bestMate, false)
  const played = probability(i.playedEval, i.playedMate, true)
  const drop = best === null || played === null ? null : Math.max(0, 100 * (best - played))
  let numerical = drop === null ? 'unclassified' : bands.find(key => drop <= p.thresholds[key]) ?? 'blunder'
  if (numerical === 'best' && i.isEngineBest === false && i.playedMate !== 0) numerical = 'excellent'
  const equivalent = i.equivalentBest?.kind === 'equal-cp' && i.evaluationSource === 'root-pv'
    && decision.evidence?.source === 'completed-snapshot' && i.bestMate === null && i.playedMate === null
    && Number.isFinite(i.bestEval) && i.bestEval === i.playedEval
    || i.equivalentBest?.kind === 'equal-mate' && i.evaluationSource === 'root-pv'
      && Number.isSafeInteger(i.bestMate) && i.bestMate !== 0 && i.bestMate === i.playedMate
  if (numerical === 'excellent' && i.isEngineBest === false && equivalent) numerical = 'best'
  const forcedVerified = i.forced === true && i.legalMoves === 1
  const classification = forcedVerified ? 'forced' : i.isBookMove === true && i.playedMate !== 0 ? 'book' : numerical
  const consistent = decision.numericalClassification == null || decision.numericalClassification === numerical
  const factsAgree = i.forced !== true || forcedVerified
  const scoresAgree = [[i.bestProbability, best], [i.playedProbability, played], [i.dropPct, drop]]
    .every(([recorded, calculated]) => recorded == null || calculated !== null && Number.isFinite(recorded) && Math.abs(recorded - calculated) < 1e-9)
  return { status: classification === decision.classification && consistent && scoresAgree && factsAgree ? 'reproduced' : 'mismatch', classification }
}

export function explainClassification(entry) {
  const stored = entry.classificationDecision
  const policy = validThresholds(stored?.policy) ? stored.policy : createClassificationPolicy()
  const decision = stored?.schemaVersion === 1 && stored.inputs && validThresholds(stored.policy) && stored.classification === entry.classification ? stored
    : decisionFor(entry, policy)
  const i = decision.inputs, label = decision.classification, name = names[label] ?? label
  const suffix = " L'indice è locale: non è una probabilità calibrata di vittoria."
  let explanation
  if (label === 'forced') explanation = i.forced === true && i.legalMoves === 1
    ? 'Forzata: nella posizione c’era una sola mossa legale; questa etichetta prevale sul giudizio numerico.'
    : 'Forzata: criterio non verificato; i dati registrati non confermano l’unicità della mossa legale.'
  else if (label === 'book') explanation = decision.openingBookMetadata?.revision != null
    ? `Libro: continuazione nel repertorio con revisione registrata ${decision.openingBookMetadata.revision}; questa etichetta prevale sulla fascia numerica.`
    : 'Libro: flag archiviato; origine del repertorio non registrata. Questa ricostruzione non verifica l’appartenenza al repertorio corrente.'
  else if (label === 'unclassified') explanation = 'Non classificata: i dati disponibili non bastano per un confronto numerico affidabile.'
  else if (label === 'missed' || label === 'great' || label === 'brilliant') {
    let detail = ''
    try { detail = label === 'missed' ? formatMoveOpportunity(entry.missedOpportunity) : formatSpecialAssessment(entry) } catch { /* Legacy evidence may be incomplete. */ }
    explanation = `${name}: ${detail || (label === 'missed' ? 'una possibilità utile non è stata mantenuta.' : 'criterio speciale aggiuntivo; i dettagli della verifica non sono disponibili.')} Il solo calo numerico non ricostruisce questa regola.`
  }
  else if (i.playedMate === 0) explanation = `${name}: scacco matto dato; il confronto numerico registra indice finale 1 e perdita nulla.`
  else if (decision.rule === 'equivalent-best') explanation = 'Migliore: valutazione pari alla prima scelta nello stesso confronto verificato; l’alternativa viene promossa da Ottima a Migliore.'
  else if (decision.rule === 'different-primary-choice') explanation = `Ottima: la perdita rientra nella fascia Migliore (fino a ${decision.policy.thresholds.best} punti percentuali), ma la mossa differisce dalla prima scelta del motore e non ha un’equivalenza verificata.`
  else {
    const index = bands.indexOf(label), thresholds = decision.policy?.thresholds
    const interval = label === 'blunder' ? `oltre ${thresholds?.mistake}` : index === 0 ? `fino a ${thresholds?.best}`
      : index > 0 ? `oltre ${thresholds?.[bands[index - 1]]} e fino a ${thresholds?.[label]}` : 'non disponibile'
    explanation = `${name}: perdita ${Number.isFinite(i.dropPct) ? i.dropPct.toFixed(2) : 'non disponibile'} punti percentuali dell’indice locale; fascia ${interval} punti percentuali.`
  }
  const origin = entry.classificationOrigin
  if (origin?.policy === null) explanation += ` L’etichetta originaria ${names[origin.classification] ?? origin.classification ?? 'sconosciuta'} non ha criteri registrati: questa spiegazione riguarda la ricostruzione corrente.`
  return explanation + suffix
}
