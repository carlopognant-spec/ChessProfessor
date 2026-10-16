import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {knightPawnEvasionExploitingQueenPin} from '../agent-output/remaining-tactical-families-v1/knight-pin-evasion.mjs'
const area='agent-output/remaining-tactical-families-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=[]
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b}
const {cases}=JSON.parse(await read('agent-output/special-completion-v1/cohorts.json'))
for(const p of ['scripts/study-knight-pin-evasion.mjs',`${area}/knight-pin-evasion.mjs`])await read(p)
await writeFile(`${area}/knight-pin-protocol.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newEngineSearches:0,productionChanges:false,
 selection:'All1116 observations, no reference-label selection.',hypothesis:'A knight legally threatened by a pawn has one quiet escape that newly attacks a knight relatively pinned to a queen. Every immediate capture of the escaped knight can be met by the pinning slider taking the queen, with positive net material after every immediate legal reply. The gain is conditional on acceptance, not forced against every defense.',sources},null,2)+'\n',{flag:'wx'})
const cache=new Map(),rows=[]
for(const c of cases)for(const[i,e]of c.entries.entries()){
 const key=[e.fenBefore,e.playedUci,e.fenAfter].join('|');if(!cache.has(key))cache.set(key,knightPawnEvasionExploitingQueenPin(e))
 const proof=cache.get(key);if(proof)rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],proof})
}
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await writeFile(`${area}/knight-pin-study.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newEngineSearches:0,productionChanges:false,rows,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(rows))
