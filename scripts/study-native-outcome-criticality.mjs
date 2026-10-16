import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {nativeWdlInterval} from './qa/native-wdl-interval.mjs'
import {validGrandeSearch} from '../src/lib/grandeProofs.js'
import {classifyReviewedMove} from '../src/lib/reviewEvaluation.js'
import {calculateWinProbability} from '../src/lib/evaluation.js'
import {SPECIAL_POLICY} from '../src/lib/specialPolicy.js'
const area='agent-output/native-wdl-study-v1',sources=new Map(),sha=b=>createHash('sha256').update(b).digest('hex')
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},json=async p=>JSON.parse(await read(p))
const validation=await json(`${area}/interval-verification.json`);assert(validation.passed)
const {cases}=await json('agent-output/special-completion-v1/cohorts.json'),baseline=await json('agent-output/grande-recovery-proof-v1/verification-v20.json')
const base=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r])),packets=new Map()
const collection=await json('agent-output/special-completion-evidence-v1/collection.json')
for(const r of collection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);packets.set(p.fen,p.engine)}
for(const p of ['scripts/study-native-outcome-criticality.mjs','scripts/qa/native-wdl-interval.mjs','src/lib/grandeProofs.js','src/lib/specialPolicy.js','src/lib/reviewEvaluation.js'])await read(p)
await writeFile(`${area}/criticality-protocol.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newSearches:0,
 selection:'Every numerical Best, non-book/non-forced/nonterminal development observation; only existing exact complete root+child 1M proofs. Proof collection was previously targeted, so absent pairs remain unassessed.',
 hypothesis:'The sole analyzed winning outcome can be critical even when the generic cp index calls the second-best position favorable. Native WDL is a separate outcome axis, not a replacement numeric curve.',
 conditions:['Complete pinned root/child, legal PVs, actual-node caps, root best equals played move, coherent completed comparison.',
 'No announced mate; latest root primary agrees with completed root and child within existing consistency .10.',
 'Every WDL triple consistent with rounded cp has Win as strictly dominant outcome for the played root and its child; every analyzed alternative has Draw or Loss dominant.',
 'Native expected points of root and child >= existing winning .75; lower bound minus every alternative upper bound >= existing gap .20. No new fitted cutoffs.',
 'Preserve already-correct categories and forbid false Greats. No production change in this diagnostic study.'],sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const rows=[]
for(const c of cases)for(const e of c.entries){
 const b=base.get(`${c.cohort}:${c.id}:${e.ply}`)
 if(b.numerical!=='best'||e.isBookMove||e.moveFacts?.forced||e.playedMate===0)continue
 const root=packets.get(e.fenBefore),child=packets.get(e.fenAfter)
 if(!validGrandeSearch(root,e.fenBefore)||!validGrandeSearch(child,e.fenAfter))continue
 const temp=classifyReviewedMove({...e,engine:root,playedEngine:child}),lines=root.specialLines
 if(temp.classification!=='best'||temp.evaluationEvidence.status!=='coherent'||lines[0].pv[0]!==e.playedUci)continue
 if([root,child,...lines].some(l=>l.mate!=null)||!Number.isFinite(child.evalCp))continue
 const idx=calculateWinProbability
 if(Math.abs(idx(lines[0].evalCp)-(1-idx(child.evalCp)))>SPECIAL_POLICY.consistency||Math.abs(idx(lines[0].evalCp)-idx(root.evalCp))>SPECIAL_POLICY.consistency)continue
 const w=nativeWdlInterval(e.fenBefore,lines[0].evalCp),z=nativeWdlInterval(e.fenAfter,-child.evalCp),alts=lines.slice(1).map(l=>nativeWdlInterval(e.fenBefore,l.evalCp))
 if(!w||!z||alts.some(a=>!a))continue
 const gap=Math.min(w.bounds.points.min,z.bounds.points.min)-Math.max(...alts.map(a=>a.bounds.points.max))
 const supported=w.dominant==='w'&&z.dominant==='w'&&alts.every(a=>['d','l'].includes(a.dominant))
  &&Math.min(w.bounds.points.min,z.bounds.points.min)>=SPECIAL_POLICY.winning&&gap>=SPECIAL_POLICY.gap
 rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:b.expected,before:b.actual,supported,
  played:{cp:lines[0].evalCp,dominant:w.dominant,points:w.bounds.points},child:{cp:-child.evalCp,dominant:z.dominant,points:z.bounds.points},
  alternatives:alts.map((a,i)=>({uci:lines[i+1].pv[0],cp:a.cp,dominant:a.dominant,points:a.bounds.points})),gap})
}
const proposals=rows.filter(r=>r.supported&&!['Grande','Geniale','Mossa mancata'].includes(r.before)),falsePositives=proposals.filter(r=>r.expected!=='Grande')
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/criticality-study.json`,JSON.stringify({developmentOnly:true,independentValidation:false,productionChanged:false,newSearches:0,assessed:rows.length,proposals,falsePositives,rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({assessed:rows.length,proposals,falsePositives:falsePositives.length}))
