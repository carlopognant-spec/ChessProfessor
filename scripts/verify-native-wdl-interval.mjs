import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {nativeWdlInterval} from './qa/native-wdl-interval.mjs'
const area='agent-output/native-wdl-study-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=[]
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b}
const file='agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json',data=JSON.parse(await read(file))
const code=(await read(`${area}/stockfish-sf19-uci.cpp`)).toString()
assert(code.includes('-142.72052667, 372.35176398, -340.71073572, 415.23490212'))
assert(code.includes('5.93832785, 15.61267078, -30.57816876, 69.63866711'))
await read('scripts/qa/native-wdl-interval.mjs');await read('scripts/verify-native-wdl-interval.mjs')
await writeFile(`${area}/interval-protocol.json`,JSON.stringify({selection:'Every non-tablebase raw UCI line with cp and wdl in all30 pre-existing restricted search captures; no reference labels read.',newSearches:0,source:'Stockfish sf_19/src/uci.cpp',accept:'Each observed triple must be one of the possibilities consistent with the rounded cp and exact root material.',sources},null,2)+'\n',{flag:'wx'})
let checked=0,skipped=0;const mismatches=[]
for(const [index,r]of data.searches.entries())for(const raw of r.rawLines){
 const cp=raw.match(/\bscore cp (-?\d+)/),wdl=raw.match(/\bwdl (\d+) (\d+) (\d+)/)
 if(!cp||!wdl)continue
 const inferred=nativeWdlInterval(r.fen,Number(cp[1]))
 if(!inferred){skipped++;continue}
 checked++
 if(!inferred.possibilities.some(p=>p.w===Number(wdl[1])&&p.d===Number(wdl[2])&&p.l===Number(wdl[3])))mismatches.push({index,fen:r.fen,raw,inferred})
}
const passed=checked>0&&!mismatches.length
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256)
await writeFile(`${area}/interval-verification.json`,JSON.stringify({passed,checked,skipped,mismatches,newSearches:0,engineStarted:false,referenceLabelsRead:false,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed,checked,skipped,mismatches:mismatches.length,first:mismatches.slice(0,2)}))
