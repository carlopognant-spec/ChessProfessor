import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {nativeWdlInterval} from './qa/native-wdl-interval.mjs'
import {validGrandeSearch} from '../src/lib/grandeProofs.js'
import {SPECIAL_POLICY} from '../src/lib/specialPolicy.js'
const area='agent-output/native-alternative-evidence-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=[]
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b},json=async p=>JSON.parse(await read(p))
assert((await json(`${area}/replay-check.json`)).passed)
const protocol=await json(`${area}/protocol.json`),collection=await json(`${area}/collection.json`),packets=new Map()
for(const r of collection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);packets.set(p.fen,p.engine)}
const study=await json('agent-output/native-wdl-study-v1/forcing-choice-study-v2.json'),rows=[]
for(const r of study.results.find(r=>r.id==='native-forcing-choice').changes.filter(r=>r.after==='Grande'&&r.grande?.nativeOutcome)){
 const own=r.grande.nativeOutcome,alternatives=own.alternatives.map(a=>{
  const request=protocol.selected.find(t=>t.cohort===r.cohort&&t.game===r.game&&t.ply===r.ply&&t.uci===a.uci),child=packets.get(request.fen)
  const valid=validGrandeSearch(child,request.fen),native=child.mate==null?nativeWdlInterval(request.fen,-child.evalCp):null
  return {uci:a.uci,root:a,child:{valid,cp:-child.evalCp,mate:child.mate==null?null:-child.mate,dominant:native?.dominant,bounds:native?.bounds},
   nonWinning:valid&&native&&['d','l'].includes(native.dominant)}
 })
 const allNonWinning=alternatives.every(a=>a.nonWinning),maxAlternative=Math.max(...alternatives.map(a=>Math.max(a.root.bounds.points.max,a.child.bounds?.points.max??1)))
 rows.push({cohort:r.cohort,game:r.game,ply:r.ply,san:r.san,expected:r.expected,maintained:own.maintained,
  allNonWinning,minimumCorroboratedGap:own.maintained-maxAlternative,gapPass:own.maintained-maxAlternative>=SPECIAL_POLICY.gap,alternatives})
}
await read('scripts/report-native-alternatives.mjs')
await writeFile(`${area}/results.json`,JSON.stringify({diagnosticOnly:true,productionChanged:false,newSearches:0,rows,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(rows.map(({cohort,game,ply,san,expected,allNonWinning,minimumCorroboratedGap,gapPass,alternatives})=>({cohort,game,ply,san,expected,allNonWinning,minimumCorroboratedGap,gapPass,alternatives:alternatives.map(a=>({uci:a.uci,root:a.root.dominant,child:a.child.dominant,cp:a.child.cp,valid:a.child.valid}))}))))
