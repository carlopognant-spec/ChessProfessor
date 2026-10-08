import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { moveFacts, pvMaterial } from './grande-comparison-features.js'
import { moveEvaluationFields, classifyAnalysisEntries } from '../src/lib/classification.js'

const root=new URL('../',import.meta.url),sources=[],rows=[]
const hash=b=>createHash('sha256').update(b).digest('hex')
async function input(path){const bytes=await readFile(new URL(path,root));sources.push({path,sha256:hash(bytes)});return JSON.parse(bytes)}
const frozen=await input('agent-output/specials-frozen-evaluation-2026-10-08T02-58-22-772Z/results.json')
const ids=[...Array.from({length:6},(_,i)=>`personal-0${i+1}`),'game-1-chigorin-steinitz-1892','game-2-saintamant-staunton-1843']
for(const id of ids){
  const cache=await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  if(cache.packageVersion!=='19.0.0'||cache.searchLimit?.value!==200000||cache.multiPv!==5||cache.threads!==1||cache.hashMb!==16)throw Error('Incompatible cache')
  let previousMove=null
  for(const [index,entry] of cache.entries.entries()){
    const facts=moveFacts(entry.fenBefore,entry.san,previousMove)
    if(facts.fenAfter!==entry.fenAfter||entry.ply!==index+1||index&&cache.entries[index-1].fenAfter!==entry.fenBefore)throw Error('Invalid chain')
    const fields=moveEvaluationFields(entry.engine,entry.playedEngine,entry.uci,{isCheckmate:facts.deliveredMate})
    const previous=cache.entries[index-1]
    const prior=previous?classifyAnalysisEntries([{...previous,isBookMove:false,...moveEvaluationFields(previous.engine,previous.playedEngine,previous.uci)}])[0]:null
    const rootLines=(entry.engine?.lines??[]).map(l=>({uci:l.pv?.[0],depth:l.depth,evalCp:l.evalCp??null,mate:l.mate??null,bound:Boolean(l.bound||/\b(?:upperbound|lowerbound)\b/.test(l.raw??''))}))
    const child=entry.playedEngine?.lines?.find(l=>l.multipv===1)
    const material=child?pvMaterial(entry.fenAfter,child.pv,facts.side):null
    const best=rootLines[0],second=rootLines[1]
    const comparable=best&&second&&best.depth===second.depth&&best.depth>0&&!best.bound&&!second.bound&&best.uci!==second.uci
    // Frozen reference labels and outcomes are joined only after feature extraction.
    const reference=frozen.rows.find(r=>r.gameId===id&&r.ply===entry.ply)
    if(!reference||reference.san!==entry.san)throw Error('Frozen mismatch')
    const inferredAfterError=['mistake','blunder'].includes(prior?.classification)
    const relaxedAssignment=reference.grandeAssigned||(!reference.brilliantAssigned&&reference.features?.afterError===true)
    const family=reference.base!=='Migliore'||!fields.isEngineBest?'ineligible-common-or-root'
      :facts.capture?(inferredAfterError?'capture-after-error':'capture-without-error')
      :inferredAfterError?'quiet-after-error':'quiet-without-error'
    rows.push({id,group:id.startsWith('personal')?'development':'historical',ply:entry.ply,san:entry.san,
      moveNumber:new Chess(entry.fenBefore).moveNumber(),side:facts.side,expected:reference.expected,excluded:reference.excluded,
      base:reference.base,predicted:reference.predicted,grandeAssigned:reference.grandeAssigned,
      brilliantAssigned:reference.brilliantAssigned,relaxedAssignment,family,reason:reference.grandeReason,
      fields,previous:{san:previous?.san??null,numericalClassification:prior?.classification??null},
      facts:{capture:facts.capture,capturedType:facts.capturedType,check:facts.check,answerToCheck:facts.inCheckBefore,
        recapture:facts.recapture,geometricDoubleAttack:facts.geometricDoubleAttack,kingAndQueenAttack:facts.kingAndQueenAttack,targets:facts.targets},
      mateSignal:fields.playedMate>0||child?.mate<0,
      cpGap:comparable&&best.mate==null&&second.mate==null&&Number.isFinite(best.evalCp)&&Number.isFinite(second.evalCp)?best.evalCp-second.evalCp:null,
      rootDepthComparable:Boolean(comparable),rootLines,material})
    previousMove=facts.move
  }
}
for(const source of sources)if(hash(await readFile(new URL(source.path,root)))!==source.sha256)throw Error('Source changed')
const missed=rows.filter(r=>!r.excluded&&r.expected==='Grande'&&!r.grandeAssigned)
const changes=rows.filter(r=>r.relaxedAssignment&&!r.grandeAssigned)
function metrics(group,field){const own=rows.filter(r=>!r.excluded&&(group==='all'||r.group===group)),assigned=own.filter(r=>r[field]),positive=own.filter(r=>r.expected==='Grande');const tp=assigned.filter(r=>r.expected==='Grande').length;return {group,field,tp,fp:assigned.length-tp,fn:positive.length-tp}}
const eligible=rows.filter(r=>!r.excluded&&r.base==='Migliore'&&r.fields.isEngineBest&&!r.brilliantAssigned)
const featureCounts=['check','answerToCheck','recapture','geometricDoubleAttack','kingAndQueenAttack'].map(feature=>({feature,
  positives:eligible.filter(r=>r.expected==='Grande'&&r.facts[feature]).length,
  negatives:eligible.filter(r=>r.expected!=='Grande'&&r.facts[feature]).length}))
const summary={plies:rows.length,missedGrande:missed.length,
  missedFamilies:Object.fromEntries([...new Set(missed.map(r=>r.family))].sort().map(f=>[f,missed.filter(r=>r.family===f).length])),
  eligiblePositives:eligible.filter(r=>r.expected==='Grande').length,eligibleNegatives:eligible.filter(r=>r.expected!=='Grande').length,
  featureCounts,metrics:['development','historical','all'].flatMap(g=>['grandeAssigned','relaxedAssignment'].map(f=>metrics(g,f))),
  additionalAssignments:changes.length,searchesExecuted:0,modelChanged:false,sourceHashesUnchanged:true,independentValidation:false,appIntegration:false}
const directory=new URL(`agent-output/grande-missed-families-${new Date().toISOString().replace(/[:.]/g,'-')}/`,root)
await mkdir(directory)
await writeFile(new URL('results.json',directory),JSON.stringify({summary,missed,changes,rows,sources},null,2)+'\n',{flag:'wx'})
const report=['# Grande mancanti — famiglie e controfattuale', '', 'Protocollo: ../grande-missed-families-v1-protocol.md. Diagnosi su riferimenti già studiati; nessun nuovo fitting o modifica al modello.', '',
 ...Object.entries(summary).map(([k,v])=>`- ${k}: ${JSON.stringify(v)}`),'',
 '| Partita | Giocata | Famiglia | Scacco | Possibile doppio attacco geometrico | Matto segnalato | Precedente categoria numerica |', '|---|---|---|---|---|---|---|',
 ...missed.map(r=>`| ${r.id} | ${r.moveNumber}${r.side==='w'?'.':'...'}${r.san} | ${r.family} | ${r.facts.check} | ${r.facts.geometricDoubleAttack} | ${r.mateSignal} | ${r.previous.san}: ${r.previous.numericalClassification} |`),'',
 '## Tutte le assegnazioni nuove togliendo solo il veto sulle prese', '',
 ...changes.map(r=>`- ${r.id}, ply ${r.ply}, ${r.san}: riferimento ${r.expected}; famiglia ${r.family}.`),'',
 'Attacchi geometrici non provano forchette vincenti; PV non provano unicità. Il controfattuale non modifica il valutatore congelato. Nessun motore avviato o modifica ad app/cache; nessun commit/push. Suite app/build/browser NON ESEGUITI.',''].join('\n')
await writeFile(new URL('report.md',directory),report,{flag:'wx'})
console.log(JSON.stringify({output:fileURLToPath(directory),summary,changes:changes.map(r=>({id:r.id,ply:r.ply,san:r.san,expected:r.expected})),missed:missed.map(r=>({id:r.id,ply:r.ply,san:r.san,family:r.family,facts:r.facts,mateSignal:r.mateSignal,cpGap:r.cpGap}))},null,2))
