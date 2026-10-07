import { readFile,writeFile,mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries,moveEvaluationFields } from '../src/lib/classification.js'
import { moveFacts,pvMaterial } from './grande-comparison-features.js'

const root=new URL('../',import.meta.url),base='tests/fixtures/qa/',folder=base+'analysis-cache-large-200k/2026-10-07T09-51-26-999Z/'
const ids=[...Array.from({length:6},(_,i)=>`personal-0${i+1}`),'game-1-chigorin-steinitz-1892','game-2-saintamant-staunton-1843']
const watched=[],rows=[],sha=bytes=>createHash('sha256').update(bytes).digest('hex')
async function input(path){const bytes=await readFile(new URL(path,root));watched.push({path,sha256:sha(bytes)});return JSON.parse(bytes)}
for(const id of ids){
  const fixture=await input(base+id+'.json'),cache=await input(folder+id+'.json')
  if(fixture.pgn!==cache.pgn||cache.packageVersion!=='19.0.0'||cache.searchLimit?.value!==200000)throw Error('Incompatible cache')
  const full=new Chess();full.loadPgn(fixture.pgn);const actual=full.history(),game=new Chess()
  let previousMove=null,previousNumerical=null
  for(const [index,e] of cache.entries.entries()){
    if(e.ply!==index+1||e.fenBefore!==game.fen()||e.san!==actual[index])throw Error('Cache chain mismatch')
    const facts=moveFacts(e.fenBefore,e.san,previousMove),number=game.moveNumber(),move=game.move(e.san)
    if(e.fenAfter!==facts.fenAfter||game.fen()!==e.fenAfter||e.uci!==`${move.from}${move.to}${move.promotion??''}`)throw Error('Invalid move')
    const annotation=fixture.annotations.find(a=>a.ply===e.ply)
    if(!annotation||annotation.san!==e.san)throw Error('Missing annotation')
    const fields=moveEvaluationFields(e.engine,e.playedEngine,e.uci,{isCheckmate:facts.deliveredMate})
    const numerical=classifyAnalysisEntries([{...fields,isBookMove:false}])[0]
    const primary=e.engine.lines.find(l=>l.multipv===1),playedRoot=e.engine.lines.find(l=>l.pv[0]===e.uci),second=e.engine.lines.find(l=>l.multipv===2)
    const child=e.playedEngine.lines.find(l=>l.multipv===1)
    const pv=child?pvMaterial(e.fenAfter,child.pv,facts.side):null
    const cpGapComparable=primary&&second&&primary.depth===second.depth&&primary.mate==null&&second.mate==null&&Number.isFinite(primary.evalCp)&&Number.isFinite(second.evalCp)&&primary.pv[0]!==second.pv[0]&&![primary,second].some(l=>/\b(?:lowerbound|upperbound)\b/.test(l.raw??''))
    rows.push({gameId:id,group:id.startsWith('personal')?'development':'historical',ply:e.ply,moveNumber:number,san:e.san,side:facts.side,expected:annotation.category,fenBefore:e.fenBefore,fenAfter:e.fenAfter,facts,
      features:{capture:facts.capture,captureRookOrQueen:facts.captureRookOrQueen,check:facts.check,geometricDoubleAttack:facts.geometricDoubleAttack,kingAndQueenAttack:facts.kingAndQueenAttack,recapture:facts.recapture,
        answerToCheck:facts.inCheckBefore,afterLocalNumericalError:['mistake','blunder'].includes(previousNumerical?.classification),
        playedIsPv1:primary?.pv[0]===e.uci,mateSignal:!facts.deliveredMate&&(playedRoot?.mate>0||e.playedEngine.mate<0),
        gainPersistsAt4Ply:pv?.deltaAt4Ply!=null&&facts.materialChange+pv.deltaAt4Ply>0},
      sameDepthPvGapCp:cpGapComparable?primary.evalCp-second.evalCp:null,
      parentScores:{bestCp:primary?.evalCp??null,bestMate:primary?.mate??null,secondCp:second?.evalCp??null,secondMate:second?.mate??null},
      numericalClassification:numerical.classification,previousNumericalClassification:previousNumerical?.classification??null,
      pvMaterial:pv,priorReferenceCategory:index?fixture.annotations.find(a=>a.ply===index)?.category??null:null})
    previousMove=move;previousNumerical=numerical
  }
  if(actual.length!==cache.entries.length)throw Error('Incomplete game')
}
// Reference labels group rows AFTER extraction; they never decide computed features.
const eligible=rows.filter(r=>!['Libro','Forzata','Geniale'].includes(r.expected)&&!r.facts.deliveredMate)
const features=Object.keys(rows[0].features)
const groups=['development','historical','all'].map(group=>{
  const own=eligible.filter(r=>group==='all'||r.group===group),positives=own.filter(r=>r.expected==='Grande'),negatives=own.filter(r=>r.expected!=='Grande')
  const goodNegatives=negatives.filter(r=>['Migliore','Ottima'].includes(r.expected))
  return{group,total:own.length,positives:positives.length,negatives:negatives.length,goodNegatives:goodNegatives.length,
    features:features.map(feature=>{const tp=positives.filter(r=>r.features[feature]).length,fp=negatives.filter(r=>r.features[feature]).length;
      return{feature,tp,fp,goodNegativeMatches:goodNegatives.filter(r=>r.features[feature]).length,recall:positives.length?tp/positives.length:null,precisionIfUsedAlone:tp+fp?tp/(tp+fp):null}})}
})
// Combinations are illustrative descriptive counts, not a fitted classifier.
const combinations=[['pv1-after-error',r=>r.features.playedIsPv1&&r.features.afterLocalNumericalError],['pv1-capture-major-after-error',r=>r.features.playedIsPv1&&r.features.captureRookOrQueen&&r.features.afterLocalNumericalError],['pv1-double-attack',r=>r.features.playedIsPv1&&r.features.geometricDoubleAttack],['pv1-mate-signal',r=>r.features.playedIsPv1&&r.features.mateSignal]]
const combinationCounts=combinations.map(([name,test])=>({name,grande:eligible.filter(r=>r.expected==='Grande'&&test(r)).length,nonGrande:eligible.filter(r=>r.expected!=='Grande'&&test(r)).length}))
const negativeExamples=features.flatMap(feature=>eligible.filter(r=>r.expected!=='Grande'&&r.features[feature]).map(r=>({feature,gameId:r.gameId,ply:r.ply,san:r.san,expected:r.expected,group:r.group})))
for(const file of watched)if(sha(await readFile(new URL(file.path,root)))!==file.sha256)throw Error('Source changed')
const summary={totalPlies:rows.length,eligible:eligible.length,excluded:rows.length-eligible.length,exclusions:'reference Libro/Forzata/Geniale and delivered mate',sourceHashesUnchanged:true,searchesExecuted:0,dataRole:'development and historical study; no independent validation',featuresAreLabelIndependent:true,
  notes:['Geometric attacks include pinned-piece attacks and do not prove a winning fork.','Material at 4 ply is one cached PV and is absent if the sequence is shorter; false feature values include unavailable horizons.','Local previous error uses current numerical classifier without book override, never previous Chess.com expected category.','Same-depth root gap is only partial MultiPV coverage; no uniqueness inference.','Counts are correlated within games; no statistical confidence or adoption claim.']}
const directory=new URL(`agent-output/grande-negative-comparison-${new Date().toISOString().replace(/[:.]/g,'-')}/`,root)
await mkdir(directory)
await writeFile(new URL('results.json',directory),JSON.stringify({summary,groups,combinationCounts,rows,negativeExamples,watched},null,2)+'\n',{flag:'wx'})
const report=['# Grande — confronto con mosse simili non Grande','',...Object.entries(summary).map(([k,v])=>`- ${k}: ${JSON.stringify(v)}`),'',
  ...groups.flatMap(g=>[`## ${g.group}`,`Grande=${g.positives}; non Grande=${g.negatives}; tra i negativi Migliore/Ottima=${g.goodNegatives}.`,'','| Caratteristica | Grande | Non Grande | Migliore/Ottima fra i negativi | Precisione se usata sola |','|---|---:|---:|---:|---:|',...g.features.map(f=>`| ${f.feature} | ${f.tp} | ${f.fp} | ${f.goodNegativeMatches} | ${f.precisionIfUsedAlone==null?'n/d':(f.precisionIfUsedAlone*100).toFixed(1)+'%'} |`),'']),
  '## Combinazioni descrittive','',...combinationCounts.map(c=>`- ${c.name}: Grande ${c.grande}; non Grande ${c.nonGrande}.`),'',
  '## Tutti i controesempi per caratteristica','', '| Caratteristica | Partita | Ply | SAN | Etichetta |','|---|---|---:|---|---|',...negativeExamples.map(r=>`| ${r.feature} | ${r.gameId} | ${r.ply} | ${r.san} | ${r.expected} |`),'',
  'Nessuna regola o soglia adattata ai conteggi. Le proprietà non equivalgono a motivazione certa di Chess.com. Test sintetici delle feature eseguiti separatamente; suite app/build/browser NON ESEGUITI. .env e Partite/7–10 non letti. App/cache/file precedenti intatti. Nessun commit/push.',''].join('\n')
await writeFile(new URL('report.md',directory),report,{flag:'wx'})
console.log(JSON.stringify({output:fileURLToPath(directory),summary,groups,combinationCounts},null,2))
