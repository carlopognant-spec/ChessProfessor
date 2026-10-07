import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { moveEvaluationFields } from '../src/lib/classification.js'

// Explicit development + historical whitelist. No engine or env loading.
const root=new URL('../',import.meta.url)
const base='tests/fixtures/qa/',cacheFolder=base+'analysis-cache-large-200k/2026-10-07T09-51-26-999Z/'
const ids=[...Array.from({length:6},(_,i)=>`personal-0${i+1}`),'game-1-chigorin-steinitz-1892','game-2-saintamant-staunton-1843']
const watched=[],cases=[],sha=bytes=>createHash('sha256').update(bytes).digest('hex')
async function input(path){const bytes=await readFile(new URL(path,root));watched.push({path,sha256:sha(bytes)});return JSON.parse(bytes)}
const values={p:1,n:3,b:3,r:5,q:9,k:0}
function material(game,side){return game.board().flat().filter(Boolean).reduce((s,p)=>s+(p.color===side?1:-1)*values[p.type],0)}
function targets(game,from,side){return game.board().flat().filter(p=>p&&p.color!==side&&game.attackers(p.square,side).includes(from)).map(p=>({square:p.square,type:p.type,value:values[p.type]}))}
function pv(fen,line){
  const game=new Chess(fen),san=[],events=[];const side=game.turn(),startMaterial=material(game,side)
  try{
    for(const [i,uci] of (line.pv??[]).entries()){
      const mover=game.turn(),m=game.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})
      san.push(m.san)
      if(i<12)events.push({ply:i+1,side:mover,san:m.san,captured:m.captured??null,promotion:m.promotion??null,check:game.isCheck(),mate:game.isCheckmate(),moverMaterial:material(game,side),materialChange:material(game,side)-startMaterial,attackedTargets:targets(game,m.to,mover)})
    }
    return{san,events,legal:true,endIsCheckmate:game.isCheckmate(),endIsStalemate:game.isStalemate()}
  }catch(error){return{san,events,legal:false,error:error.message}}
}
const formatted=s=>s.mate!=null?`M${s.mate}`:s.evalCp==null?'n/d':String(s.evalCp)
for(const id of ids){
  const fixture=await input(base+id+'.json'),cache=await input(cacheFolder+id+'.json')
  if(fixture.pgn!==cache.pgn||cache.packageVersion!=='19.0.0'||cache.searchLimit?.value!==200000)throw Error('Mismatched cache')
  const full=new Chess();full.loadPgn(fixture.pgn);const actual=full.history(),game=new Chess()
  if(actual.length!==cache.entries.length)throw Error('Incomplete cache')
  for(const [index,e] of cache.entries.entries()){
    if(e.ply!==index+1||e.fenBefore!==game.fen()||e.san!==actual[index])throw Error('Invalid cache chain')
    const side=game.turn(),beforeCheck=game.isCheck(),beforeMaterial=material(game,side)
    const m=game.move(e.san)
    if(e.fenAfter!==game.fen()||e.uci!==`${m.from}${m.to}${m.promotion??''}`)throw Error('Invalid move')
    const annotation=fixture.annotations.find(a=>a.ply===e.ply)
    if(annotation?.category!=='Grande')continue
    const lines=e.engine.lines.map(l=>({...l,rootUci:l.pv[0],sequence:pv(e.fenBefore,l)}))
    const primary=lines.find(l=>l.multipv===1),playedRoot=lines.find(l=>l.rootUci===e.uci)
    const child=e.playedEngine.lines.find(l=>l.multipv===1)
    const childSequence=child?pv(e.fenAfter,child):null
    const attackTargets=targets(game,m.to,side),valuableTargets=attackTargets.filter(t=>['k','q','r','b','n'].includes(t.type))
    const facts={inCheckBefore:beforeCheck,checksAfter:game.isCheck(),mateGiven:game.isCheckmate(),captured:m.captured??null,materialBefore:beforeMaterial,materialAfter:material(game,side),materialChange:material(game,side)-beforeMaterial,attackedTargets:attackTargets,geometricFork:valuableTargets.length>=2,forkTargets:valuableTargets,legalReplies:game.moves().length}
    const previous=cache.entries[index-1], previousAnnotation=fixture.annotations.find(a=>a.ply===index)
    const parent=new Chess(e.fenBefore)
    const record={id,label:fixture.label,group:id.startsWith('personal')?'development':'historical',ply:e.ply,moveNumber:parent.moveNumber(),side,san:e.san,uci:e.uci,fenBefore:e.fenBefore,fenAfter:e.fenAfter,expected:'Grande',facts,
      previousMove:previous?{san:previous.san,expected:previousAnnotation?.category??null,previousOpponentBest:previous.engine.evalCp,previousOpponentBestMate:previous.engine.mate,previousOpponentPlayedCp:previous.playedEngine.evalCp==null?null:previous.playedEngine.evalCp,previousOpponentPlayedMate:previous.playedEngine.mate??null}:null,
      contextMoves:actual.slice(Math.max(0,index-4),Math.min(actual.length,index+7)),
      engineFields:moveEvaluationFields(e.engine,e.playedEngine,e.uci,{isCheckmate:game.isCheckmate()}),rootLines:lines,
      playedChild:{rawCpSideToMove:e.playedEngine.evalCp,rawMateSideToMove:e.playedEngine.mate,cpMover:e.playedEngine.evalCp==null?null:-e.playedEngine.evalCp,mateMover:e.playedEngine.mate==null?null:-e.playedEngine.mate,sequence:childSequence},
      directMateSignal:playedRoot?.mate>0||e.playedEngine.mate<0||game.isCheckmate(),
      isPlayedRootBest:primary?.rootUci===e.uci,rootCoverage:lines.length,legalRoots:parent.moves().length,
      ratingHeaders:{white:full.getHeaders().WhiteElo??null,black:full.getHeaders().BlackElo??null},
    }
    cases.push(record)
  }
}
for(const source of watched)if(sha(await readFile(new URL(source.path,root)))!==source.sha256)throw Error('Source changed')
const directory=new URL(`agent-output/grande-case-study-${new Date().toISOString().replace(/[:.]/g,'-')}/`,root)
await mkdir(directory)
const summary={cases:cases.length,development:cases.filter(c=>c.group==='development').length,historical:cases.filter(c=>c.group==='historical').length,captures:cases.filter(c=>c.facts.captured).length,checks:cases.filter(c=>c.facts.checksAfter).length,geometricForks:cases.filter(c=>c.facts.geometricFork).length,mateSignals:cases.filter(c=>c.directMateSignal).length,illegalCachedPv:cases.flatMap(c=>c.rootLines).filter(l=>!l.sequence.legal).length,sourceHashesUnchanged:true,searchesExecuted:0}
await writeFile(new URL('cases.json',directory),JSON.stringify({summary,cases,watched},null,2)+'\n',{flag:'wx'})
const text=['# Studio delle mosse Grande — P1–P6 e due storiche','',
  'Fonti: annotazioni fixture e cache Stockfish 19 large/200k. È studio descrittivo dello sviluppo e dei riferimenti storici, non validazione indipendente.',
  '[Definizione pubblica Chess.com](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc): mossa decisiva per l’esito, anche unica buona mossa; criterio più generoso per principianti. Non pubblica l’algoritmo completo.',
  'Una cattura/forchetta/scacco o un segnale di matto è un fatto o candidato motivo, non la spiegazione certa dell’etichetta. Attacchi geometrici non garantiscono guadagno: pezzi inchiodati, risposte e scambi richiedono verifica. PV legalmente ripercorsa non prova l’esito contro tutte le difese.',
  'Le cinque radici possono avere depth diverse e non coprono tutte le legali: non sono prova di unicità. Score normalizzati al giocatore salvo childRaw indicati in JSON.', '',
  ...Object.entries(summary).map(([k,v])=>`- ${k}: ${v}`),'',
  '| Partita | Mossa | Cattura | Scacco | Bersagli del pezzo mosso | Matto segnalato | Giocata PV1 |',
  '|---|---|---|---|---|---|---|',
  ...cases.map(c=>`| ${c.id} | ${c.moveNumber}${c.side==='w'?'.':'...'}${c.san} | ${c.facts.captured??'—'} | ${c.facts.checksAfter} | ${c.facts.attackedTargets.map(t=>t.type+t.square).join(', ')||'—'} | ${c.directMateSignal} | ${c.isPlayedRootBest} |`),'',
  ...cases.flatMap(c=>[`## ${c.id}, ${c.moveNumber}${c.side==='w'?'.':'...'}${c.san} (ply ${c.ply})`,'',
    `FEN prima: \`${c.fenBefore}\``, `FEN dopo: \`${c.fenAfter}\``,
    `Mossa precedente: ${c.previousMove?.san??'—'} (${c.previousMove?.expected??'—'}). Scacco prima: ${c.facts.inCheckBefore}. Materiale relativo: ${c.facts.materialBefore} → ${c.facts.materialAfter} (unità convenzionali 1/3/3/5/9).`,
    `Fatti: cattura ${c.facts.captured??'nessuna'}, scacco ${c.facts.checksAfter}; bersagli geometrici ${c.facts.attackedTargets.map(t=>t.type+t.square).join(', ')||'nessuno'}. Radici cache ${c.rootCoverage}/${c.legalRoots}.`,
    `Sequenza realmente giocata intorno alla mossa: ${c.contextMoves.join(' ')}.`,
    `Linea dopo la giocata (difesa avversaria/PV1 salvata): ${c.playedChild.sequence?.san.slice(0,12).join(' ')??'n/d'}; eval dal giocatore ${c.playedChild.mateMover!=null?'M'+c.playedChild.mateMover:c.playedChild.cpMover} cp/mate.`, '',
    '| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |', '|---:|---|---:|---:|---|',
    ...c.rootLines.map(l=>`| ${l.multipv} | ${l.sequence.san[0]??l.rootUci} | ${formatted(l)} | ${l.depth} | ${l.sequence.san.slice(0,12).join(' ')} |`), '',
  ]),
  'Nessuna nuova ricerca, modifica a soglie/classificatore o attivazione di categorie. .env e Partite/7–10 non letti. Test/build/browser NON ESEGUITI; replay chess.js e hash realmente eseguiti. Nessun commit/push. STOP.',''].join('\n')
await writeFile(new URL('report.md',directory),text,{flag:'wx'})
console.log(JSON.stringify({output:fileURLToPath(directory),summary,cases:cases.map(c=>({id:c.id,ply:c.ply,san:c.san,inCheck:c.facts.inCheckBefore,capture:c.facts.captured,targets:c.facts.attackedTargets,mate:c.directMateSignal,best:c.isPlayedRootBest,bestScore:formatted(c.rootLines[0]),second:c.rootLines[1]?formatted(c.rootLines[1]):null,after:c.playedChild.mateMover!=null?'M'+c.playedChild.mateMover:c.playedChild.cpMover,pv:c.playedChild.sequence?.san.slice(0,8).join(' ')}))},null,2))
