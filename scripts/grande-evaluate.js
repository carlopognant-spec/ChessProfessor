import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Post-run evaluation only. Exact P1-P6 whitelist; no engine or env access.
const root = fileURLToPath(new URL('../', import.meta.url))
const directory = resolve(root, process.argv[2] ?? '')
if (!directory.startsWith(join(root, 'agent-output') + '\\') && !directory.startsWith(join(root, 'agent-output') + '/')) throw Error('Output must be within agent-output')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const resultBytes = await readFile(join(directory, 'results.json'))
const results = JSON.parse(resultBytes)
if (results.summary.failure || !results.summary.sourceHashesUnchanged) throw Error('Run failed or source changed; no metrics')
const records = new Map(results.records.map(r => [`${r.gameId}:${r.ply}`, r]))
const manifest = JSON.parse(await readFile(join(root, 'agent-output/grande-manifest-2026-10-07T15-03-53-742Z/manifest.json')))
const decisions = new Map(manifest.decisions.map(d => [`${d.gameId}:${d.ply}`, d]))
const sources = [], rows = [], games = []
let tp=0,fp=0,unrecognized=0
for(let i=1;i<=6;i++) {
  const id=`personal-0${i}`, path=join(root,`tests/fixtures/qa/${id}.json`), bytes=await readFile(path), fixture=JSON.parse(bytes)
  sources.push({path,sha256:hash(bytes)})
  let localTp=0,localFp=0,expectedCount=0
  for(const [index,a] of fixture.annotations.entries()) {
    const ply=a.ply ?? index+1, key=`${id}:${ply}`,record=records.get(key),decision=decisions.get(key)
    const predicted=record?.status==='verified-experimental',expected=a.category==='Grande'
    if(expected)expectedCount++
    if(predicted&&expected){tp++;localTp++}
    if(predicted&&!expected){fp++;localFp++}
    if(!predicted&&expected)unrecognized++
    if(predicted||expected)rows.push({gameId:id,ply,san:a.san,expected:a.category,predictedGrande:predicted,status:record?.status ?? (decision?.eligible?'not-run':'excluded-by-initial-filter'),reason:record?.reason ?? decision?.reason})
  }
  games.push({id,tp:localTp,fp:localFp,expected:expectedCount})
}
for(const source of sources)if(hash(await readFile(source.path))!==source.sha256)throw Error('Annotation file changed')
if(hash(await readFile(join(directory,'results.json')))!==hash(resultBytes))throw Error('Run results changed')
const expectedUnresolved=rows.filter(r=>r.expected==='Grande'&&['abstained','incomplete','not-run'].includes(r.status)).length
const evaluation={dataRole:'development-not-independent-validation',runResultsSha256:hash(resultBytes),tp,fp,unrecognized,expectedUnresolved,precision:tp+fp?tp/(tp+fp):null,observedRecall:tp+unrecognized?tp/(tp+unrecognized):null,games,expectedAndAssigned:rows,sources,
  note:'Observed recall counts every expected but unassigned label, including unresolved/unrun. Precision based on few predictions is not evidence of generalization. No thresholds changed after reading expected labels.'}
await writeFile(join(directory,'evaluation.json'),JSON.stringify(evaluation,null,2)+'\n',{flag:'wx'})
const report=['# Grande — confronto dopo chiusura della raccolta','',`TP=${tp}; FP=${fp}; attese non riconosciute=${unrecognized}; attese irrisolte/non eseguite=${expectedUnresolved}.`,`Precisione osservata=${evaluation.precision}; richiamo osservato=${evaluation.observedRecall}.`,evaluation.note,'','| Partita | Ply | SAN | Attesa | Grande assegnata | Stato | Motivo |','|---|---:|---|---|---|---|---|',...rows.map(r=>`| ${r.gameId} | ${r.ply} | ${r.san} | ${r.expected} | ${r.predictedGrande} | ${r.status} | ${r.reason} |`),'','Annotazioni P1–P6 lette solo dopo chiusura della sessione. Sei hash verificati invariati. .env e Partite/7–10 non letti. Nessun commit/push. STOP.',''].join('\n')
await writeFile(join(directory,'evaluation.md'),report,{flag:'wx'})
console.log(JSON.stringify(evaluation,null,2))
