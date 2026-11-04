import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'

const phase=process.env.GRANDE_PERF_PHASE??'after'
const mode=process.env.GRANDE_PERF_MODE??'planning'
if(!['before','after'].includes(phase)||!['planning','cached','real'].includes(mode))throw Error('Expected GRANDE_PERF_PHASE=before|after and GRANDE_PERF_MODE=planning|cached|real')
const sourcePath='agent-output/refinement-quality-priority-v2/priority-game-184316820266-round-2.json'
const entries=JSON.parse(readFileSync(sourcePath)).entries
const chess=new Chess(entries[0].fenBefore)
for(const e of entries)chess.move(e.playedMove)
const pgn=chess.pgn(),stamp='2026-11-01T00:00:00.000Z'
const record={id:createHash('sha256').update(pgn).digest('hex'),schemaVersion:1,analysisSchemaVersion:1,pgn,title:'Performance real refined game',players:{white:'Archive',black:'Archive'},date:'?',result:'*',importedAt:stamp,updatedAt:stamp,analysisMetadata:entries[0].analysisMetadata,analysisEntries:entries}
const cachedPackets={}
for(const folder of ['native-wdl-evidence-v1','native-alternative-evidence-v1','special-completion-evidence-v1']){
 for(const file of readdirSync(`agent-output/${folder}`).filter(f=>/^search-.*\.json$/.test(f))){
  const packet=JSON.parse(readFileSync(`agent-output/${folder}/${file}`))
  if(packet.nodes===1000000&&packet.multiPv===5&&packet.rawLines?.length&&packet.bestmove)cachedPackets[`position fen ${packet.fen}`]=packet.rawLines
 }
}
for(const e of entries)for(const engine of [e.engine,e.playedEngine]){
 const h=engine.history,raw=cachedPackets[`position fen ${engine.fen}`]
 if(h&&raw)cachedPackets[`position fen ${h.initialFen}${h.moves.length?` moves ${h.moves.join(' ')}`:''}`]=raw
}

test.afterEach(async({page},info)=>{
 if(info.status!==info.expectedStatus&&!page.isClosed()){
  const data=await page.evaluate(()=>window.perfLog).catch(()=>null)
  writeFileSync(join(tmpdir(),`grande-performance-${phase}-${mode}-failure.json`),JSON.stringify({errors:info.errors,data},null,2))
 }
})

async function seedAndOpen(page){
 await page.goto('./')
 await page.evaluate(record=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('chessprofessor-games',1);r.onupgradeneeded=()=>r.result.createObjectStore('games',{keyPath:'id'});r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('games','readwrite');tx.objectStore('games').put(record);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)}
 }),record)
 await page.reload()
 for(const selector of ['.tools-menu','.tools-game','.game-archive']){const d=page.locator(selector);if(!await d.evaluate(e=>e.open))await d.locator(':scope > summary').click()}
 await page.getByRole('button',{name:'Apri',exact:true}).click()
 await expect(page.locator('.analysis-row-button')).toHaveCount(entries.length)
 const advanced=page.locator('.advanced-analysis');if(await advanced.count()&&!await advanced.evaluate(e=>e.open))await advanced.locator(':scope > summary').click()
}

test('decisive button main thread, isolated context, bounded engine',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('https://explorer.lichess.ovh/**',r=>r.fulfill({json:{white:0,draws:0,black:0,moves:[]}}))
 await page.addInitScript(({mode,cachedPackets})=>{
  const log=window.perfLog={events:[],longtasks:[],frames:[],beats:[],mode}
  const event=(type,data={})=>log.events.push({type,t:performance.now(),...data})
  let frame=performance.now(),beat=frame
  const tick=now=>{log.frames.push({t:now,gap:now-frame});frame=now;requestAnimationFrame(tick)};requestAnimationFrame(tick)
  setInterval(()=>{const now=performance.now();log.beats.push({t:now,gap:now-beat});beat=now},50)
  new PerformanceObserver(list=>{for(const e of list.getEntries())log.longtasks.push({t:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)event('click',{text:b.textContent})},true)
  const Native=Worker
  window.Worker=class extends Native{
   constructor(url,options){
    const sf=String(url).includes('stockfish-')
    if(sf&&mode!=='real'){
     // Planning-only sentinel never fabricates an evaluation or starts a Stockfish search.
     const script=`const packets=${JSON.stringify(cachedPackets)};let position,timer,completed=0;onmessage=e=>{const m=e.data;if(m==='uci'){postMessage('id name Stockfish 19 WASM');postMessage('uciok')}if(m==='isready')postMessage('readyok');if(m.startsWith('position '))position=m;if(m.startsWith('go ')&&${JSON.stringify(mode)}==='cached'&&packets[position]&&completed<1){timer=setTimeout(()=>{completed++;for(const l of packets[position])postMessage(l)},750)}if(m==='stop'){clearTimeout(timer);postMessage('bestmove (none)')}}`
     super(URL.createObjectURL(new Blob([script],{type:'text/javascript'})),options)
    }else super(url,options)
    this.sf=sf;this.running=false
    if(sf){event('sf-worker');this.addEventListener('message',e=>{if(String(e.data).startsWith('bestmove')){this.running=false;event('bestmove',{line:e.data,source:mode==='real'?'live-stockfish':String(e.data).includes('(none)')?'synthetic-stop-ack':'archived-1M-rawLines'})}})}
   }
   postMessage(msg,...args){
    if(this.sf){if(String(msg).startsWith('position '))this.position=msg;if(String(msg).startsWith('go ')){event('go',{command:msg,position:this.position,overlap:this.running});this.running=true;if(mode==='planning'||(mode==='real'&&log.events.filter(e=>e.type==='go').length>2))return}if(msg==='stop')event('stop')}
    return super.postMessage(msg,...args)
   }
   terminate(){if(this.sf){this.running=false;event('terminate')}return super.terminate()}
  }
 },{mode,cachedPackets})
 await seedAndOpen(page)
 const button=page.getByRole('button',{name:'Verifica le scelte decisive',exact:true})
 await expect(button).toBeEnabled()
 const cdp=await context.newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start')
 await page.evaluate(()=>{window.perfLog.start=performance.now()})
 const clickStarted=Date.now();await button.click({timeout:120000});const clickResolvedMs=Date.now()-clickStarted
 await expect(page.getByRole('button',{name:'Interrompi approfondimento',exact:true})).toBeVisible()
 const goWait=Date.now()
 if(mode!=='planning'){
  await expect.poll(()=>page.evaluate(()=>window.perfLog.events.filter(e=>e.type==='bestmove').length),{timeout:90000}).toBeGreaterThan(0)
 }else{
  await page.waitForFunction(()=>window.perfLog.events.some(e=>e.type==='go'),{timeout:90000})
 }
 if(mode==='cached')await page.waitForFunction(()=>window.perfLog.events.filter(e=>e.type==='go').length>=2,{timeout:90000})
 const navStart=Date.now();await page.getByRole('button',{name:'Indietro',exact:true}).click();const navigationMs=Date.now()-navStart
 const cancelStart=Date.now();await page.getByRole('button',{name:'Interrompi approfondimento',exact:true}).click();const cancelMs=Date.now()-cancelStart
 await expect(button).toBeEnabled()
 if(mode==='cached'){
  await page.getByRole('button',{name:'Salva partita e analisi',exact:true}).click()
  const partial=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('chessprofessor-games',1);r.onsuccess=()=>{const db=r.result;const q=db.transaction('games').objectStore('games').getAll();q.onsuccess=()=>{db.close();resolve(q.result[0].analysisEntries)}}}))
  expect(partial.map(e=>e.fenBefore)).toEqual(entries.map(e=>e.fenBefore))
  expect(partial.map(e=>e.playedMove)).toEqual(entries.map(e=>e.playedMove))
  const newAttempts=partial.flatMap(e=>e.refinement?.nativeProof?.attempts??[]).filter(a=>!entries.flatMap(e=>e.refinement?.nativeProof?.attempts??[]).some(old=>old.fen===a.fen))
  expect(newAttempts.length).toBeGreaterThan(0)
  const firstPosition=await page.evaluate(()=>window.perfLog.events.find(e=>e.type==='go').position)
  await button.click({timeout:120000})
  await expect(page.getByRole('button',{name:'Interrompi approfondimento',exact:true})).toBeVisible()
  await page.waitForFunction(()=>window.perfLog.events.filter(e=>e.type==='go').length>=3,{timeout:90000})
  const positions=await page.evaluate(()=>window.perfLog.events.filter(e=>e.type==='go').map(e=>e.position))
  expect(positions.slice(2)).not.toContain(firstPosition)
  await page.getByRole('button',{name:'Interrompi approfondimento',exact:true}).click()
  await expect(button).toBeEnabled()
 }
 const profile=(await cdp.send('Profiler.stop')).profile
 const data=await page.evaluate(()=>{window.perfLog.end=performance.now();return window.perfLog})
 const interval=data.longtasks.filter(t=>t.t+t.duration>=data.start&&t.t<=data.end)
 const save=data.events.find(e=>e.type==='click'&&e.text==='Salva partita e analisi')
 const taskStats=tasks=>({count:tasks.length,totalMs:tasks.reduce((s,t)=>s+t.duration,0),maxMs:Math.max(0,...tasks.map(t=>t.duration))})
 const summary={phase,mode,sourcePath,entries:entries.length,cachedResponseDelayMs:mode==='cached'?750:null,clickResolvedMs,navigationMs,cancelMs,waitAfterClickMs:Date.now()-goWait,longtasks:interval.length,totalLongtaskMs:interval.reduce((s,t)=>s+t.duration,0),maxLongtaskMs:Math.max(0,...interval.map(t=>t.duration)),maxRafGapMs:Math.max(0,...data.frames.filter(f=>f.t>=data.start).map(f=>f.gap)),maxHeartbeatGapMs:Math.max(0,...data.beats.filter(f=>f.t>=data.start).map(f=>f.gap)),go:data.events.filter(e=>e.type==='go'),bestmoves:data.events.filter(e=>e.type==='bestmove'),errors}
 if(save)summary.longtaskPhases={saveClickT:save.t,beforeSave:taskStats(interval.filter(t=>t.t<save.t)),afterSave:taskStats(interval.filter(t=>t.t>=save.t))}
 const output=join(tmpdir(),`grande-performance-${phase}-${mode}.json`)
 writeFileSync(output,JSON.stringify({summary,data,profile},null,2),{flag:phase==='before'?'wx':'w'});console.log(JSON.stringify({output,summary}))
 expect(summary.go.length).toBeGreaterThan(0)
 expect(summary.go.some(e=>e.overlap)).toBe(false)
 expect(errors).toEqual([])
})

test('early planning cancel locks a same-tick double click and can retry',async({page})=>{
 test.skip(phase==='before','Early planning cancellation is the new behavior')
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('https://explorer.lichess.ovh/**',r=>r.fulfill({json:{white:0,draws:0,black:0,moves:[]}}))
 await page.addInitScript(()=>{
  window.perfLog={events:[]};let next=0
  const Native=Worker,event=(type,data={})=>window.perfLog.events.push({type,t:performance.now(),...data})
  window.Worker=class extends Native{
   constructor(url,options){super(url,options);this.key=++next;this.refinement=String(url).includes('refinementWorker');this.sf=String(url).includes('stockfish-');event('worker',{key:this.key,url:String(url)})}
   postMessage(msg,...rest){if(this.refinement&&msg.operation)event(msg.operation,{key:this.key,id:msg.id});if(this.sf&&String(msg).startsWith('go '))event('go');return super.postMessage(msg,...rest)}
   terminate(){event('terminate',{key:this.key});return super.terminate()}
  }
 })
 await seedAndOpen(page)
 const button=page.getByRole('button',{name:'Verifica le scelte decisive',exact:true})
 await expect(button).toBeEnabled()
 const rounds=[]
 for(let round=0;round<2;round++){
  await button.evaluate((e,round)=>{
   const event=type=>window.perfLog.events.push({type,t:performance.now(),round})
   event('start');e.click();e.click()
   // Schedule real UI handlers in-browser so the 500 ms bound excludes driver round trips.
   setTimeout(()=>{
    const buttons=[...document.querySelectorAll('button')]
    const stop=buttons.find(b=>b.textContent==='Interrompi approfondimento')
    const nav=buttons.find(b=>b.textContent===(round?'Avanti':'Indietro'))
    event(stop?'preparing-visible':'preparing-missing')
    event('navigate');nav?.click();event('cancel');stop?.click();event('cancel-clicked')
   },100)
  },round)
  await page.waitForFunction(n=>window.perfLog.events.filter(e=>e.type==='cancel-clicked').length>=n,round+1)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen',round?entries.at(-1).fenAfter:entries.at(-1).fenBefore)
  rounds.push(await page.evaluate(round=>{const e=window.perfLog.events.filter(e=>e.round===round);return{round,start:e.find(e=>e.type==='start').t,cancel:e.find(e=>e.type==='cancel').t}},round))
  await expect(button).toBeEnabled()
 }
 const data=await page.evaluate(()=>window.perfLog)
 const plans=data.events.filter(e=>e.type==='plan')
 for(const p of plans){const stop=data.events.find(e=>e.type==='terminate'&&e.key===p.key&&e.t>p.t);expect(stop).toBeTruthy();expect(stop.t-p.t).toBeLessThan(500)}
 const output=join(tmpdir(),`grande-performance-${phase}-early-cancel.json`)
 writeFileSync(output,JSON.stringify({rounds,data,errors},null,2));console.log(JSON.stringify({output,rounds,plans}))
 expect(plans).toHaveLength(2)
 expect(new Set(plans.map(p=>p.key)).size).toBe(2)
 expect(data.events.filter(e=>e.type==='preparing-visible')).toHaveLength(2)
 expect(data.events.filter(e=>e.type==='go')).toHaveLength(0)
 expect(errors).toEqual([])
})
