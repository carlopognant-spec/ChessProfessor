import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Chess} from 'chess.js'
import {refinementWorkerSource} from './tests/helpers/browser-refinement-worker.js'
const source='agent-output/refinement-quality-priority-v2/priority-game-184316820266-round-2.json'
const entries=JSON.parse(readFileSync(source)).entries
const chess=new Chess(entries[0].fenBefore);for(const e of entries)chess.move(e.playedMove)
const packets={}
for(const dir of ['native-wdl-evidence-v1','native-alternative-evidence-v1','special-completion-evidence-v1'])for(const file of readdirSync(`agent-output/${dir}`).filter(f=>/^search-.*\.json$/.test(f))){const p=JSON.parse(readFileSync(`agent-output/${dir}/${file}`));if(p.nodes===1000000&&p.multiPv===5&&p.rawLines?.length&&p.bestmove)packets[`position fen ${p.fen}`]=p.rawLines}
for(const e of entries)for(const engine of [e.engine,e.playedEngine])if(engine.history&&packets[`position fen ${engine.fen}`]){const h=engine.history;packets[`position fen ${h.initialFen}${h.moves.length?` moves ${h.moves.join(' ')}`:''}`]=packets[`position fen ${engine.fen}`]}
const summaries=[]
for(const mode of ['plain','archived','active-replay','no-animation-control','summary-off-control'])test(mode,async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('https://explorer.lichess.ovh/**',r=>r.fulfill({json:{white:0,draws:0,black:0,moves:[]}}))
 if(mode==='summary-off-control')await page.route('**/src/components/AnalysisSummary.jsx',route=>route.fulfill({contentType:'text/javascript',body:'export default function AnalysisSummary(){return null}'}))
 if(mode==='no-animation-control')await page.route('**/src/components/Board.jsx',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('animationDurationInMs: 120,','animationDurationInMs: 120, showAnimations: false,')})})
 await page.addInitScript(({packets,refinementWorkerSource})=>{
  const log=window.animationAudit={frames:[],longtasks:[],commits:[],workers:[],actions:[],samples:[],mutations:[]}
  let last=performance.now();function frame(t){log.frames.push({t,gap:t-last});last=t;if(log.measuring){const pieces=[...document.querySelectorAll('.board-stage [data-piece]')];log.samples.push({t,pieces:pieces.filter(e=>e.style.transform).map(e=>({id:e.id,inline:e.style.transform,computed:getComputedStyle(e).transform,transition:getComputedStyle(e).transitionDuration})),fen:document.querySelector('.board-stage')?.dataset.fen})}requestAnimationFrame(frame)}requestAnimationFrame(frame)
  new PerformanceObserver(list=>{for(const e of list.getEntries())log.longtasks.push({t:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,renderers:new Map(),inject(renderer){this.renderers.set(1,renderer);return 1},onCommitFiberRoot(id,root){if(!log.measuring)return;const names=[];function walk(n){if(!n)return;const name=n.type?.name??n.type?.render?.name;if(['Board','ChessboardProvider','Piece','EnginePanel'].includes(name)&&(n.flags&1))names.push(name);walk(n.child);walk(n.sibling)}walk(root.current);log.commits.push({t:performance.now(),names})},onCommitFiberUnmount(){}}
  const Native=Worker
  window.Worker=class extends Native{
   constructor(url,options){const sf=String(url).includes('stockfish-'),refine=String(url).includes('refinementWorker');if(sf){const script=`const packets=${JSON.stringify(packets)};let position,timer,count=0;onmessage=e=>{const m=e.data;if(m==='uci'){postMessage('id name archived Stockfish rawLines replay');postMessage('uciok')}if(m==='isready')postMessage('readyok');if(m.startsWith('position '))position=m;if(m.startsWith('go ')&&packets[position]&&count<1)timer=setTimeout(()=>{count++;for(const l of packets[position])postMessage(l)},500);if(m==='stop'){clearTimeout(timer);postMessage('bestmove (none)')}}`;super(URL.createObjectURL(new Blob([script],{type:'text/javascript'})),options)}else if(refine)super(URL.createObjectURL(new Blob([refinementWorkerSource],{type:'text/javascript'})),options);else super(url,options);this.sf=sf;if(sf)this.addEventListener('message',e=>{if(String(e.data).startsWith('bestmove'))log.workers.push({t:performance.now(),message:e.data,source:'archived-rawLines-replay'})})}
   postMessage(message,...rest){if(this.sf)log.workers.push({t:performance.now(),message});return super.postMessage(message,...rest)}
  }
  document.addEventListener('DOMContentLoaded',()=>new MutationObserver(list=>{if(log.measuring)for(const e of list){if(e.type==='childList'&&[...e.removedNodes].some(n=>n.nodeType===1&&n.matches?.('.board-stage')))log.mutations.push({t:performance.now(),type:'board-unmount'})}}).observe(document,{childList:true,subtree:true}))
 },{packets,refinementWorkerSource})
 console.log(mode,'goto');await page.goto('./');console.log(mode,'seed')
 await page.evaluate(async({pgn,entries})=>{const {createGameArchive}=await import('/ChessProfessor/src/lib/gameArchive.js');const archive=createGameArchive();await archive.save({pgn,analysisEntries:entries});await archive.close()},{pgn:chess.pgn(),entries:mode==='plain'?[]:entries})
 console.log(mode,'reload');await page.reload();console.log(mode,'tools');await page.waitForTimeout(1000);console.log('setup-errors',errors)
 for(const s of ['.tools-menu','.tools-game','.game-archive']){const d=page.locator(s);if(!await d.evaluate(e=>e.open))await d.locator(':scope > summary').click()}
 console.log(mode,'open');await page.getByRole('button',{name:'Apri',exact:true}).click();console.log(mode,'opened')
 if(mode!=='plain'&&mode!=='summary-off-control')await expect(page.locator('.analysis-row-button')).toHaveCount(entries.length)
 await page.waitForTimeout(400)
 if(mode==='active-replay'){const advanced=page.locator('.advanced-analysis');if(await advanced.count()&&!await advanced.evaluate(e=>e.open))await advanced.locator(':scope > summary').click();await page.getByRole('button',{name:'Verifica le scelte decisive',exact:true}).click();await page.waitForFunction(()=>window.animationAudit.workers.some(e=>String(e.message).startsWith('go ')))}
 console.log(mode,'measure');const cdp=await context.newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start')
 await page.evaluate(()=>{window.animationAudit.start=performance.now();window.animationAudit.measuring=true})
 
 // Identical bounded navigation, using in-page handlers excludes driver timing from animation onset.
 for(let i=0;i<8;i++){
  await page.evaluate(i=>{const name=i%2?'Avanti':'Indietro';const b=[...document.querySelectorAll('button')].find(b=>b.textContent===name);window.animationAudit.actions.push({t:performance.now(),name});b.click()},i)
  await page.waitForTimeout(220)
 }
 await page.evaluate(()=>{window.animationAudit.navigationEnd=performance.now()})
 // The archived game ends in mate; inspect the previous legal position for selection.
 await page.getByRole('button',{name:'Indietro',exact:true}).click();await page.waitForTimeout(220)
 const game=new Chess(await page.locator('.board-stage').getAttribute('data-fen'));const square=game.moves({verbose:true})[0].from
 for(let i=0;i<2;i++){await page.locator(`#study-board-square-${square}`).click();await page.waitForTimeout(180)}
 if(mode==='active-replay')await page.getByRole('button',{name:'Interrompi approfondimento',exact:true}).click()
 await page.waitForTimeout(180)
 const profile=(await cdp.send('Profiler.stop')).profile
 const data=await page.evaluate(()=>{window.animationAudit.end=performance.now();window.animationAudit.measuring=false;return window.animationAudit})
 const frames=data.frames.filter(f=>f.t>=data.start&&f.t<=data.end),tasks=data.longtasks.filter(t=>t.t+t.duration>=data.start&&t.t<=data.end)
 const animations=data.actions.map((action,i)=>{const end=data.actions[i+1]?.t??data.navigationEnd;const samples=data.samples.filter(s=>s.t>=action.t&&s.t<end);const transformed=samples.filter(s=>s.pieces.length);const matrices=[...new Set(transformed.flatMap(s=>s.pieces.map(p=>p.computed)))];return{action,transformedFrames:transformed.length,distinctMatrices:matrices.length,firstTransformDelayMs:transformed[0]?transformed[0].t-action.t:null,lastTransformDelayMs:transformed.at(-1)?transformed.at(-1).t-action.t:null,maxFrameGapMs:Math.max(0,...frames.filter(f=>f.t>=action.t&&f.t<end).map(f=>f.gap))}})
 const weights=new Map();for(let i=0;i<(profile.samples??[]).length;i++){const id=profile.samples[i];weights.set(id,(weights.get(id)??0)+(profile.timeDeltas?.[i]??0))}
 const nodeMap=new Map(profile.nodes.map(n=>[n.id,n]));const inclusive=id=>(weights.get(id)??0)+(nodeMap.get(id).children??[]).reduce((sum,child)=>sum+inclusive(child),0);const inclusiveApplicationMs={};for(const n of profile.nodes)if(/^(AnalysisSummary|AccuracySummary|ClassificationDetails|Board|resolveMoveReview|replayGame|syncGameState|EnginePanel)$/.test(n.callFrame.functionName)){const name=n.callFrame.functionName+' @ '+n.callFrame.url.split('/').at(-1)+':'+(n.callFrame.lineNumber+1);inclusiveApplicationMs[name]=(inclusiveApplicationMs[name]??0)+inclusive(n.id)/1000}
 const top=profile.nodes.map(n=>({name:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber+1,ms:(weights.get(n.id)??0)/1000})).sort((a,b)=>b.ms-a.ms).slice(0,20)
 const summary={mode,fixture:source,plies:entries.length,durationMs:data.end-data.start,animationDurationMs:120,longtasks:tasks.length,maxLongtaskMs:Math.max(0,...tasks.map(t=>t.duration)),totalLongtaskMs:tasks.reduce((s,t)=>s+t.duration,0),rafFrames:frames.length,maxRafGapMs:Math.max(0,...frames.map(f=>f.gap)),framesOver25Ms:frames.filter(f=>f.gap>25).length,commits:data.commits.length,boardRenderCommits:data.commits.filter(c=>c.names.includes('Board')).length,boardUnmounts:data.mutations.length,animations,workerGo:data.workers.filter(w=>String(w.message).startsWith('go ')).length,replayedBestmoves:data.workers.filter(w=>String(w.message).startsWith('bestmove')&&!String(w.message).includes('(none)')).length,inclusiveApplicationMs,top,errors}
 const output=join(tmpdir(),`ui-animation-audit-${mode}.json`);writeFileSync(output,JSON.stringify({summary,data,profile},null,2));summaries.push(summary);console.log(JSON.stringify({output,summary}))
 expect(errors).toEqual([]);expect(summary.boardUnmounts).toBe(0)
 if(mode==='no-animation-control')expect(animations.every(a=>a.transformedFrames===0)).toBe(true);else if(mode==='plain'||mode==='summary-off-control')expect(animations.filter(a=>a.distinctMatrices>1).length).toBeGreaterThan(0)
})
test.afterAll(()=>writeFileSync('docs/data/ui-animation-audit.json',JSON.stringify({environment:'Normal dev server 4173; headless Edge; no app files changed; profiling instrumentation adds overhead.',engineEvidence:'Archived real analyzed game; active-replay uses one authentic historical 1M-node rawLines response after artificial 500ms delay, then holds later searches. No live Stockfish search or CPU contention measured.',summaries},null,2)))









