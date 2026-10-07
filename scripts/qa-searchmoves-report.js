import { readFile, writeFile, appendFile } from 'node:fs/promises'
const dir = 'tests/fixtures/qa/analysis-cache-searchmoves/'
const json = async file => JSON.parse(await readFile(file, 'utf8'))
const summary = await json(dir + 'summary.json')
const pairs = [], cases = [], outside = []
for (const s of summary.summaries) {
  const cache = await json(`tests/fixtures/qa/analysis-cache/${s.id}.json`)
  const single = await json(dir + s.id + '-single.json')
  const pair = await json(dir + s.id + '-pair.json')
  for (const r of single.entries) {
    const e = cache.entries[r.ply - 1]
    const a = r.result.lines[0], b = e.engine.lines.find(l => l.multipv <= 5 && l.pv[0] === r.uci)
    if (b) {
      pairs.push({ id: s.id, ply: r.ply, san: e.san, a, b })
      if ((a.mate != null && b.evalCp != null) || (b.mate != null && a.evalCp != null) || (a.evalCp != null && b.evalCp != null && (a.evalCp*b.evalCp < 0 || Math.abs(a.evalCp-b.evalCp) >= 1000))) cases.push({ id: s.id, ply: r.ply, san: e.san, singleCp: a.evalCp, singleMate: a.mate, cachedCp: b.evalCp, cachedMate: b.mate })
    } else {
      const p = pair.entries.find(p => p.ply === r.ply).result
      outside.push({ id: s.id, ply: r.ply, single: a, played: p.lines.find(l => l.pv[0] === e.uci), best: p.lines.find(l => l.pv[0] === e.engine.lines[0].pv[0]), cachedBest: e.engine.lines[0], cachedPlayed: { evalCp: e.playedEngine.evalCp == null ? null : -e.playedEngine.evalCp, mate: e.playedEngine.mate == null ? null : -e.playedEngine.mate } })
    }
  }
}
function stats(pairs) {
  const cp = pairs.filter(([a,b]) => a.evalCp != null && b.evalCp != null)
  const v = cp.map(([a,b]) => Math.abs(a.evalCp-b.evalCp)).sort((a,b)=>a-b), n=v.length
  return { total: pairs.length, cp: n, mean: v.reduce((a,b)=>a+b,0)/n, median: (v[Math.floor((n-1)/2)]+v[Math.floor(n/2)])/2, p90:v[Math.ceil(n*.9)-1], max:v[n-1], signInversions:cp.filter(([a,b])=>a.evalCp*b.evalCp<0).length, mateCp:pairs.filter(([a,b])=>(a.mate!=null&&b.evalCp!=null)||(b.mate!=null&&a.evalCp!=null)).length, mateMate:pairs.filter(([a,b])=>a.mate!=null&&b.mate!=null).length }
}
const extra = { insideByGroup: ['personal','historical','all'].map(group=>({group,...stats(pairs.filter(p=>group==='all'||p.id.startsWith(group==='personal'?'personal-':'game-')).map(p=>[p.a,p.b]))})), outsideComparisons: [['pair played vs single','played','single'],['pair played vs cached child (sign inverted)','played','cachedPlayed'],['pair cached-best candidate vs cached best','best','cachedBest']].map(([comparison,a,b])=>({comparison,...stats(outside.map(p=>[p[a],p[b]]))})), cases, realGo:{single:summary.summaries.reduce((n,s)=>n+s.P,0),pairAdditional:summary.summaries.reduce((n,s)=>n+s.K,0),repeat:100}, realSeconds:{single:summary.summaries.reduce((n,s)=>n+s.singleMs,0)/1000,pairAdditional:summary.summaries.reduce((n,s)=>n+s.pairMs,0)/1000,repeat:summary.repeatability.elapsedMs/1000,total:summary.totalElapsedMs/1000}, changes: ['single','pair'].map(scheme=>({scheme,total:summary.changes.filter(c=>c.scheme===scheme).length,personal:summary.changes.filter(c=>c.scheme===scheme&&c.id.startsWith('personal-')).length,historical:summary.changes.filter(c=>c.scheme===scheme&&c.id.startsWith('game-')).length})) }
await writeFile(dir+'additional-statistics.json', JSON.stringify(extra,null,2)+'\n',{flag:'wx'})
const table = (rows,key) => ['| '+key+' | N cp | Media | Mediana | P90 | Max | Inversioni | mate/cp | mate/mate |','|---|---:|---:|---:|---:|---:|---:|---:|---:|',...rows.map(r=>`| ${r.group??r.comparison} | ${r.cp} | ${r.mean.toFixed(2)} | ${r.median} | ${r.p90} | ${r.max} | ${r.signInversions} | ${r.mateCp} | ${r.mateMate} |`)]
await appendFile(dir+'report.md', ['','## Tabelle aggregate', '', ...table(extra.insideByGroup,'Gruppo, single vs MultiPV interna'), '', ...table(extra.outsideComparisons,'Confronto fuori MultiPV (136 mosse)'), '', '## Casi mate/cp, inversioni e differenze >=1000 cp nel campione interno', '', '| Partita | ply | SAN | single cp | single mate | cached cp | cached mate |','|---|---:|---|---:|---:|---:|---:|', ...cases.map(c=>`| ${c.id} | ${c.ply} | ${c.san} | ${c.singleCp??''} | ${c.singleMate??''} | ${c.cachedCp??''} | ${c.cachedMate??''} |`),'', '## Tempi reali', '', '```json',JSON.stringify(extra.realSeconds,null,2),'```', '', 'Lettura: nessuno schema sperimentale migliora entrambe le metriche nei due gruppi. La media interna è dominata dalla coda P3; non dimostra che searchmoves riduca il rumore. Ripetibilità a hash iniziale e ordine uguali non implica coerenza con un diverso percorso MultiPV. Nessun cambio di produzione consigliato sulla sola base di questo esperimento.', '', 'Nel single, quando la giocata coincide con la prima PV cached, il classificatore usa lo stesso score single per best e played e mantiene perdita zero, come la regola attuale per isEngineBest. Nel pair, la prima PV può cambiare fra i due candidati; non certifica la migliore globale.', ''].join('\n'))
console.log(JSON.stringify(extra,null,2))
