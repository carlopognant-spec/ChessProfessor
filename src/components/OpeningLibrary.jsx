import {useEffect,useMemo,useState} from 'react'
import {Chess} from 'chess.js'
import {Chessboard} from 'react-chessboard'
import {OPENING_LESSONS,OPENING_TRAPS,VARIANT_NOTES} from '../lib/openingLessons.js'
import {OPENING_JOURNEYS,JOURNEY_STAGES,journeyCoach} from '../lib/openingJourneys.js'
import {prepareOpeningCatalog,normalizeOpeningQuery,linePositions,initialPracticeIndex,practiceMove,
  OPENING_PROGRESS_KEY,validOpeningProgress,recordOpeningCompletion} from '../lib/openingLibrary.js'
import '../opening-library.css'
import catalogLicense from '../data/openingBook.LICENSE.txt?raw'

let catalogPromise
const loadCatalog=()=>catalogPromise??=import('../data/openingCatalog.json').then(({default:data})=>prepareOpeningCatalog(data.entries))
  .catch(error=>{catalogPromise=null;throw error})
const traps=OPENING_TRAPS.map(trap=>{const b=new Chess();b.loadPgn(trap.pgn);return{...trap,moves:b.history()}})
const numbered=moves=>moves.map((san,i)=>(i%2===0?`${Math.floor(i/2)+1}. `:'')+san).join(' ')

export default function OpeningLibrary(){
  const [catalog,setCatalog]=useState(null),[loadError,setLoadError]=useState('')
  const [query,setQuery]=useState(''),[family,setFamily]=useState('all'),[filter,setFilter]=useState('fundamentals'),[page,setPage]=useState(0)
  const [branch,setBranch]=useState(null)
  const [selectedId,setSelectedId]=useState(null),[mode,setMode]=useState('lesson'),[trapId,setTrapId]=useState(null)
  const [step,setStep]=useState(0),[side,setSide]=useState('w'),[from,setFrom]=useState(null),[sanInput,setSanInput]=useState('')
  const [feedback,setFeedback]=useState(''),[mistakes,setMistakes]=useState(0),[hints,setHints]=useState(0),[hintVisible,setHintVisible]=useState(false)
  const [hintLevel,setHintLevel]=useState(0)
  const [lastReply,setLastReply]=useState(null)
  const [storageError,setStorageError]=useState(false)
  const [progress,setProgress]=useState(()=>{try{return validOpeningProgress(JSON.parse(localStorage.getItem(OPENING_PROGRESS_KEY)))}catch{return validOpeningProgress(null)}})
  useEffect(()=>{let live=true;loadCatalog().then(rows=>{if(live){setCatalog(rows);setLoadError('')}}).catch(()=>{if(live)setLoadError('Il catalogo non è disponibile. Controlla la connessione e riprova.')});return()=>{live=false}},[])
  useEffect(()=>{try{localStorage.setItem(OPENING_PROGRESS_KEY,JSON.stringify(progress));setStorageError(false)}catch{setStorageError(true)}},[progress])
  const foundations=useMemo(()=>{
    if(!catalog)return[]
    return OPENING_LESSONS.flatMap(guide=>{const b=new Chess();b.loadPgn(guide.line);const key=b.history().join(' ')
      const entry=catalog.find(e=>e.moves.join(' ')===key&&e.family===guide.id);return entry?[entry]:[]})
  },[catalog])
  const selected=catalog?.find(e=>e.id===selectedId)??foundations.find(e=>e.family==='italian')??catalog?.[0]
  const trap=traps.find(t=>t.id===trapId)
  const guide=OPENING_LESSONS.find(g=>g.id===selected?.family)??OPENING_LESSONS.at(-1)
  const journey=OPENING_JOURNEYS.find(j=>j.id===guide.id)
  const guided=mode==='lesson'
  const interactive=guided||mode==='train'
  const moves=guided?journey.moves:trap?.moves??selected?.moves??[]
  const line=useMemo(()=>linePositions(moves),[moves])
  const title=guided?journey.title:trap?.title??selected?.displayName??''
  const drillId=(guided?`journey:v1:${journey.id}`:trap?`trap:${trap.id}`:selected?.id)+':'+side
  const complete=step===moves.length
  const fen=line.positions[Math.min(step,moves.length)]
  const result=progress.sessions[drillId]
  const coach=guided?journeyCoach(journey,step,side):null
  const filtered=useMemo(()=>{
    const tokens=normalizeOpeningQuery(query).split(' ').filter(Boolean)
    // Searching always covers the complete catalog, including on the start view.
    const source=filter==='fundamentals'&&!tokens.length?foundations:catalog??[]
    return source.filter(e=>(family==='all'||e.family===family)
      &&(!branch||e.moves.length>branch.length&&branch.every((m,i)=>e.moves[i]===m))
      &&(filter!=='favorites'||progress.favorites.includes(e.id))
      &&(filter!=='advanced'||!foundations.some(f=>f.id===e.id))&&tokens.every(t=>e.search.includes(t)))
  },[catalog,foundations,query,family,filter,progress.favorites,branch])
  const shown=filtered.slice(page*30,(page+1)*30)
  const guidedCatalog=filter==='fundamentals'&&!query.trim()
  const variantNote=VARIANT_NOTES.find(([match])=>match.test(selected?.name??''))?.[1]
  function clearExercise(){setFrom(null);setFeedback('');setSanInput('');setMistakes(0);setHints(0);setHintVisible(false);setHintLevel(0);setLastReply(null)}
  function select(entry){const lesson=filter==='fundamentals'&&!query.trim();setSelectedId(entry.id);setTrapId(null);setMode(lesson?'lesson':'study');setStep(lesson&&side==='b'?1:0);clearExercise();if(lesson&&side==='b')setLastReply(0)}
  function startPractice(color=side){setSide(color);setMode('train');setStep(initialPracticeIndex(moves,color));clearExercise()}
  function startJourney(color=side){setSide(color);setTrapId(null);setMode('lesson');setStep(initialPracticeIndex(journey.moves,color));clearExercise();if(color==='b')setLastReply(0)}
  function submit(move){
    if(!interactive||complete)return false
    const response=practiceMove(moves,step,side,move)
    setFrom(null);setSanInput('')
    if(response.status==='illegal'){setFeedback('Questa mossa non è legale nella posizione. Riprova.');return false}
    if(response.status==='different-line'){setMistakes(n=>n+1);setFeedback(guided?'La mossa è legale. In questa partita seguiamo un altro piano: rileggi il consiglio dell’istruttore e riprova. La tua mossa non viene valutata come un errore scacchistico.':'Mossa legale, ma appartiene a un’altra linea. Prova a ricordare la continuazione scelta.');return false}
    if(!['correct','complete'].includes(response.status))return false
    setStep(response.index);setHintVisible(false);setHintLevel(0)
    if(guided)setLastReply(response.reply?step+1:null)
    if(response.status==='complete'){
      setProgress(p=>recordOpeningCompletion(p,drillId,mistakes===0&&hints===0))
      setFeedback(guided?`Percorso completato. ${coach.debrief}`:mistakes===0&&hints===0?'Linea completata senza errori e senza indizi!':'Linea completata. Ripetila per consolidare le mosse.')
    }else setFeedback(guided?coach.debrief:response.reply?`Corretto. L’avversario risponde ${response.reply}.`:'Corretto. Continua.')
    return true
  }
  function drop({sourceSquare,targetSquare}){
    if(!targetSquare)return false
    const expected=line.parsed[step]
    const board=new Chess(fen),promoting=board.get(sourceSquare)?.type==='p'&&/[18]$/.test(targetSquare)
    const promotion=promoting?(expected?.uci.slice(0,4)===sourceSquare+targetSquare?expected.promotion:'q'):undefined
    return submit({from:sourceSquare,to:targetSquare,...(promotion?{promotion}:{})})
  }
  function click({square}){
    if(!interactive||complete)return
    if(from&&square!==from){if(drop({sourceSquare:from,targetSquare:square}))return}
    const board=new Chess(fen)
    setFrom(board.get(square)?.color===side?square:null)
  }
  const squareStyles={}
  if(from){squareStyles[from]={background:'rgba(201,162,75,.7)'};for(const m of new Chess(fen).moves({square:from,verbose:true}))squareStyles[m.to]={background:'radial-gradient(circle, rgba(40,50,35,.4) 24%, transparent 26%)'}}
  if(hintVisible&&(!guided||hintLevel===2)&&line.parsed[step]){squareStyles[line.parsed[step].uci.slice(0,2)]={background:'rgba(201,162,75,.8)'};if(guided)squareStyles[line.parsed[step].uci.slice(2,4)]={background:'rgba(201,162,75,.6)'}}
  const chooseFilter=value=>{setFilter(value);setPage(0);setBranch(null)}
  const canTrain=line.parsed.some(m=>m.color===side)
  const continuationCount=useMemo(()=>catalog&&selected?catalog.filter(e=>e.id!==selected.id&&selected.moves.length<e.moves.length&&selected.moves.every((m,i)=>e.moves[i]===m)).length:0,[catalog,selected])
  if(loadError)return <main className="opening-library"><h1>Biblioteca delle aperture</h1><p role="alert">{loadError}</p><button onClick={()=>{setLoadError('');loadCatalog().then(setCatalog).catch(()=>setLoadError('Catalogo non disponibile. Riprova.'))}}>Riprova</button></main>
  if(!catalog||!selected)return <main className="opening-library" aria-busy="true"><h1>Biblioteca delle aperture</h1><p>Caricamento delle aperture e delle varianti…</p></main>
  return <main className="opening-library">
    <header className="opening-hero"><div><p className="opening-eyebrow">IL TUO ISTRUTTORE SULLA SCACCHIERA</p><h1>Dall’apertura al mediogioco, giocando.</h1><p>Tu muovi. L’istruttore ti accompagna: prima le basi, poi i piani della posizione.</p></div>
      <div className="opening-totals"><strong>{catalog.length.toLocaleString('it-IT')}</strong><span>linee · 500 codici ECO</span></div></header>
    {storageError&&<p className="notice" role="status">Il browser non permette di salvare preferiti e progressi. Puoi continuare a studiare in questa sessione.</p>}
    <div className="opening-layout">
      <aside className="opening-catalog" aria-label="Catalogo delle aperture">
        <label className="opening-search">Cerca un’apertura<input type="search" value={query} placeholder="Siciliana, Najdorf, B90, e4 c5…" onChange={e=>{setQuery(e.target.value);setPage(0);setBranch(null)}} /></label>
        <label className="opening-family-filter">Famiglia<select value={family} onChange={e=>{setFamily(e.target.value);setPage(0);setBranch(null)}}><option value="all">Tutte le famiglie</option>{OPENING_LESSONS.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
        <div className="opening-filters" aria-label="Selezione del catalogo">{[['fundamentals','Fondamentali'],['all','Tutte'],['advanced','Approfondimenti'],['favorites','Preferiti']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>chooseFilter(value)}>{label}</button>)}</div>
        <p className="opening-result-count" aria-live="polite">{filtered.length.toLocaleString('it-IT')} {guidedCatalog?'percorsi guidati':filtered.length===1?'linea':'linee'}{query.trim()?' · ricerca nel catalogo completo':''}</p>
        {branch&&<button className="opening-back-link" onClick={()=>{setBranch(null);setPage(0)}}>← Tutte le linee</button>}
        <div className="opening-results">{shown.map(e=><button className="opening-result" key={e.id} aria-pressed={selected.id===e.id} onClick={()=>select(e)}><span className="opening-result-meta"><span>{guidedCatalog?'Partita guidata':e.eco}</span><span>{guidedCatalog?OPENING_JOURNEYS.find(j=>j.id===e.family).moves.length/2:Math.ceil(e.moves.length/2)} mosse{progress.favorites.includes(e.id)?' · ★':''}</span></span><strong>{e.displayName}</strong><span className="opening-result-moves">{guidedCatalog?'Dalle prime mosse ai piani di mediogioco':numbered(e.moves.slice(0,6))+(e.moves.length>6?' …':'')}</span></button>)}</div>
        {!shown.length&&<p className="notice">Nessuna linea trovata. Prova un altro nome o cambia i filtri.</p>}
        {filtered.length>30&&<div className="opening-pagination"><button disabled={!page} onClick={()=>setPage(p=>p-1)}>Precedenti</button><span>{page+1} / {Math.ceil(filtered.length/30)}</span><button disabled={(page+1)*30>=filtered.length} onClick={()=>setPage(p=>p+1)}>Successive</button></div>}
      </aside>
      <section className="opening-workbench" aria-label="Studio dell’apertura">
        <div className="opening-line-heading"><div><p className="opening-eyebrow">{guided?`PARTITA GUIDATA · ${guide.title}`:trap?'TRAPPOLA DIDATTICA':`${selected.eco} · ${guide.title}`}</p><h2>{title}</h2></div><button className="opening-favorite" aria-label="Salva apertura nei preferiti" aria-pressed={progress.favorites.includes(selected.id)} onClick={()=>setProgress(p=>({...p,favorites:p.favorites.includes(selected.id)?p.favorites.filter(id=>id!==selected.id):[...p.favorites,selected.id]}))}>{progress.favorites.includes(selected.id)?'★':'☆'}</button></div>
        <div className="opening-modes" aria-label="Modalità apertura">{[['lesson','Partita guidata'],['study','Esplora'],['train','Allenati'],['traps','Trappole']].map(([value,label])=><button key={value} aria-pressed={mode===value} onClick={()=>{if(value==='lesson')startJourney();else if(value==='train'){const practiceMoves=trap?.moves??selected.moves;setMode('train');setStep(initialPracticeIndex(practiceMoves,side));clearExercise()}else{setMode(value);setStep(0);clearExercise()}}}>{label}</button>)}</div>
        {mode==='traps'?<div className="opening-trap-list"><p>Queste combinazioni funzionano con le risposte mostrate. Studia anche come evitarle.</p>{traps.map(t=><article key={t.id}><p className="opening-eyebrow">{OPENING_LESSONS.find(g=>g.id===t.family)?.title}</p><h3>{t.title}</h3><p>{t.idea}</p><button onClick={()=>{setTrapId(t.id);setSide(t.side);setMode('study');setStep(0);clearExercise()}}>Apri la trappola</button></article>)}</div>:<>
          {trap&&<button className="opening-back-link" onClick={()=>{setTrapId(null);setStep(0);setMode('study');clearExercise()}}>← Torna all’apertura selezionata</button>}
          {guided&&<section className="opening-coach" aria-label="Consiglio dell’istruttore">
            <ol className="opening-journey-stages">{JOURNEY_STAGES.map(stage=><li key={stage.id} aria-current={stage.id===coach.stage.id?'step':undefined}>{stage.title}</li>)}</ol>
            <p className="opening-small">{moves.length/2} mosse complete · {moves.length} semimosse · Un percorso didattico della famiglia, con risposte preparate fino al mediogioco.</p>
            <div className="opening-color-choice"><span>Gioca con</span><button aria-pressed={side==='w'} onClick={()=>startJourney('w')}>Bianco</button><button aria-pressed={side==='b'} onClick={()=>startJourney('b')}>Nero</button></div>
            {feedback&&<p className="opening-feedback opening-debrief" role="status">{feedback}</p>}
            {lastReply!==null&&<p className="opening-reply">L’avversario ha giocato <strong>{journey.moves[lastReply]}</strong>.</p>}
            <h3>{complete?'Ora sai come nasce questa posizione':`L’istruttore · Tocca a te, ${side==='w'?'Bianco':'Nero'}`}</h3>
            {!complete&&<><p className="opening-coach-situation">{coach.situation}</p><p className="opening-coach-question">{coach.question}</p></>}
            <details className="opening-plan-preview"><summary>Rivedi il piano di questo impianto</summary><p>{coach.plan}</p></details>
            {complete&&<div className="opening-recap"><h3>Rifletti sulla partita</h3><p>Quale cambio ha trasformato il centro? Quale pezzo hai migliorato? Dove cercheresti gioco adesso?</p><p>Confronta il tuo piano con quello avversario nelle note qui sotto, poi prova il percorso con l’altro colore.</p></div>}
          </section>}
          <div className="opening-board" data-fen={fen}><Chessboard options={{id:'opening-study-board',position:fen,boardOrientation:side==='b'?'black':'white',allowDragging:interactive&&!complete,onPieceDrop:drop,onSquareClick:click,squareStyles,animationDurationInMs:120,lightSquareStyle:{backgroundColor:'#EDE6D6'},darkSquareStyle:{backgroundColor:'#7C6A53'}}} /></div>
          {mode==='study'?<><div className="opening-board-controls"><button aria-label="Posizione iniziale apertura" disabled={!step} onClick={()=>setStep(0)}>⏮</button><button aria-label="Mossa precedente apertura" disabled={!step} onClick={()=>setStep(s=>s-1)}>←</button><span>{step} / {moves.length}</span><button aria-label="Mossa successiva apertura" disabled={complete} onClick={()=>setStep(s=>s+1)}>→</button><button aria-label="Ultima posizione apertura" disabled={complete} onClick={()=>setStep(moves.length)}>⏭</button><button aria-label="Ruota scacchiera apertura" onClick={()=>setSide(s=>s==='w'?'b':'w')}>Ruota</button></div>
            <div className="opening-move-strip" aria-label="Mosse della variante">{moves.map((san,i)=><button key={i} aria-current={step===i+1?'step':undefined} onClick={()=>setStep(i+1)}>{i%2===0?`${Math.floor(i/2)+1}. `:''}{san}</button>)}</div>
            <div className="opening-study-actions"><button className="opening-primary" onClick={()=>startPractice()}>Allena questa {trap?'trappola':'variante'}</button>{!trap&&continuationCount>0&&<button onClick={()=>{setQuery('');setBranch(selected.moves);setFilter('all');setFamily('all');setPage(0)}}>Esplora le continuazioni ({continuationCount})</button>}</div>
          </>:<div className="opening-training">{!guided&&<div className="opening-color-choice"><span>Gioca con</span><button aria-pressed={side==='w'} onClick={()=>startPractice('w')}>Bianco</button><button aria-pressed={side==='b'} onClick={()=>startPractice('b')}>Nero</button></div>}
            {trap&&side!==trap.side&&<p className="opening-small">Stai ripassando il lato che subisce la trappola, per riconoscere il pericolo. Per giocare la combinazione scegli il {trap.side==='w'?'Bianco':'Nero'}.</p>}
            <p>{!canTrain?'Questa linea non contiene mosse per il colore scelto. Cambia colore o scegli una continuazione più lunga.':complete?guided?'Partita guidata completata':'Ripasso completato':`Tocca a te · ${side==='w'?'Bianco':'Nero'} · ${Math.floor(step/2)+1}${side==='b'?'…':'.'}`}</p>
            <progress aria-label="Avanzamento esercizio" max={moves.length} value={step}/>
            <form onSubmit={e=>{e.preventDefault();if(sanInput.trim())submit(sanInput.trim())}}><label>Mossa in notazione<input value={sanInput} onChange={e=>setSanInput(e.target.value)} placeholder="es. Nf3" disabled={complete||!canTrain} autoComplete="off" /></label><button disabled={complete||!canTrain||!sanInput.trim()}>Gioca</button></form>
            <div className="opening-training-tools"><button disabled={complete||!canTrain||guided&&hintLevel===2} onClick={()=>{setHints(n=>n+1);setHintVisible(true);if(guided)setHintLevel(n=>Math.min(2,n+1))}}>{guided?hintLevel===0?'Chiedi un indizio':hintLevel===1?'Mostra la soluzione':'Soluzione mostrata':'Mostra un indizio'}</button><button onClick={()=>guided?startJourney():startPractice()}>Ricomincia</button></div>
            {hintVisible&&!complete&&<p className="opening-hint">{guided&&hintLevel===1?coach.hint:<>Nella linea scelta: <strong>{line.parsed[step]?.san}</strong>. {guided&&`Da ${coach.from} a ${coach.to}. `}Il pezzo è evidenziato sulla scacchiera.</>}</p>}
            {!guided&&<p className="opening-feedback" role="status">{feedback}</p>}<p className="opening-practice-stats">{guided?`Percorsi completati: ${result?.completed??0}`:`Ripassi completati: ${result?.completed??0} · Senza errori o indizi: ${result?.clean??0}`}</p>
            <p className="opening-small">Puoi trascinare i pezzi, toccare partenza e arrivo oppure scrivere la mossa. Le risposte avversarie seguono la variante scelta.</p>
          </div>}
          <details className="opening-notes" open={!guided}><summary>{trap?'L’idea della trappola':'Capire la posizione e rivedere i piani'}</summary><p>{trap?.idea??guide.intro}</p>
            {trap?<><h3>Come evitarla</h3><p>{trap.defense}</p><p className="opening-small">{trap.outcome==='mate'?'La sequenza termina in matto.':'La sequenza termina con un guadagno materiale.'} Puoi ripassarla con entrambi i colori.</p></>:<>
              {!guided&&variantNote&&<div className="opening-variant-note"><h3>Focus sulla variante</h3><p>{variantNote}</p></div>}
              <p className="opening-small">{guided?`Piani del percorso · ${journey.title}`:`Piani generali della famiglia · ${guide.title}`}</p><div className="opening-plan-grid"><div><h3>Il piano del Bianco</h3>{guided?<p>{journey.whitePlan}</p>:<ul>{guide.white.map(p=><li key={p}>{p}</li>)}</ul>}</div><div><h3>Il piano del Nero</h3>{guided?<p>{journey.blackPlan}</p>:<ul>{guide.black.map(p=><li key={p}>{p}</li>)}</ul>}</div></div>
              <h3>Da tenere d’occhio</h3><p>{guide.warning}</p><p className="opening-small">Ogni ordine di mosse può richiedere adattamenti: i piani della famiglia non sostituiscono il calcolo nella posizione concreta.</p>
            </>}
          </details>
        </>}
      </section>
    </div>
    <footer className="opening-source">Catalogo ECO: <a href="https://github.com/JeffML/eco.json" target="_blank" rel="noreferrer">eco.json</a> · Licenza MIT. Nomi originali ricercabili; spiegazioni didattiche in italiano. Preferiti e progressi sono salvati in questo browser.<details><summary>Licenza del catalogo</summary><pre>{catalogLicense}</pre></details></footer>
  </main>
}
