# Checkpoint P0 — navigazione e continuazione ipotetica

Data: 2026-11-02. Worktree `chessprofessor-grande-candidate-20261030`, branch
`work/grande-candidate-20261030`, HEAD `6004046e4d3b571790270c5dc71da340035959ff`.
Consegna parziale coerente: P0 implementato e verificato nei casi sotto;
P1 e P2 della richiesta allegata restano da eseguire. Nessun commit/push/deploy.

## Evidenze e limiti

Consultati `ANALYSIS-UX-AUDIT.md` e `GRANDE-V3-PERFORMANCE.md`; preservati i
profili storici. Non ripetuti benchmark del classificatore. Il vecchio profilo
di produzione a 8 azioni non è comparabile al nuovo stress a 40 eventi in dev.

Non trovata la partita autentica dell'utente a circa 87 semimosse nei 28 PGN
locali piccoli esaminati. Usati separatamente:

- `Partite/Confermate/personal-04/partita.pgn`: abbandono autentico, 55 semimosse,
  risultato 1-0, posizione legalmente proseguibile.
- Prime 87 semimosse di `Partite/Confermate/Storiche/game-2-saintamant-staunton-1843/partita.pgn`:
  fixture derivata con risultato `*`, senza alterare il PGN originale a 132 semimosse.

Confermata una causa evitabile: ogni navigazione ricostruiva la partita con
chess.js e ne riestraeva la cronologia. Nei profili equivalenti del caso 87/off,
tempo campionato inclusivo totale `handleKeyDown` 535,623 → 2,112 ms nella fase
`after-render`; `replayGame` 379,624 → 11,287 ms; `syncGameState` non compare più
nel percorso di navigazione. Sono totali campionati, non latenze per tasto;
tempi inclusivi sovrapposti non vanno sommati. Costo esclusivo attribuito a
chess.js 651,3 → 36,7 ms. Il confronto con worker sentinella conferma il costo
anche senza ricerca Stockfish reale.

Il rendering resta costoso. Nel confronto prima/finale 87/off: massimo long task
105 → 117 ms, massimo intervallo rAF 166,7 → 144,2 ms, commit React 165 → 170.
Non è dimostrato un miglioramento generale del rendering né una riduzione dei
commit. La fase intermedia `after-render` aveva max task 109 ms e rAF 138,9 ms.
La singola prova finale con motore reale registra max task 87 ms, rAF 144,6 ms,
181 commit; manca un precedente equivalente reale, quindi non è un prima/dopo.

Mai riprodotti il dialogo Wait/Close o il re sopra Strumenti. Verificati bounding
box degli SVG visibili dopo assestamento, non soltanto contenitori `data-piece`
(questi avevano già uno scarto da baseline inline). Non certificati assenza di
fughe di memoria, GPU fisica o stalli prolungati nell'ambiente dell'utente.
I profili senza analisi archiviata non misurano il beneficio del rinvio del coach.

## Correzioni

- `src/context/GameContext.jsx`, `src/lib/gameNavigation.js`: indice FEN della
  cronologia, lettura delle posizioni note senza replay; ricostruzione completa
  solo quando si gioca davvero, conservando la verifica delle regole.
- Continuazione ipotetica separata dalla partita importata: PGN, risultato e
  cronologia destinata all'analisi rimangono originali. Pulsante «Torna alla
  partita». Classificazioni originali non applicate a nuove mosse divergenti.
  La continuazione è temporanea; non è stato aggiunto un suo export separato.
- `EnginePanel.jsx`: pausa/cancellazione entrando nella continuazione;
  nessun avvio automatico di analisi completa o approfondimenti su questa.
  Budget, MultiPV, V3, worker, cache e risultati originali conservati.
- `App.jsx`, `Board.jsx`: riconoscimento esplicito `KeyboardEvent.repeat`,
  eliminazione degli aggiornamenti dell'editor nascosto durante la navigazione;
  niente interpolazione animata o overlay analitici durante la pressione ripetuta.
  Riattivazione dopo 180 ms di inattività, animazione ordinaria ancora 120 ms.
- `AnalysisSummary.jsx`: spiegazione pesante differita durante input rapido;
  tracciabilità montata soltanto quando aperta, dati preservati.
- `MoveList.jsx`: classificazioni limitate al prefisso coerente della partita.
- `src/index.css`: contenimento dei livelli animati nella scacchiera e SVG block.
  Questo contiene eventuali fuoriuscite; non dimostra la causa del re dislocato.

## Verifiche eseguite

- 28 Vitest passati: game-navigation (6), game-archive (10),
  analysis-presentation (8), refinement-worker (4).
- 6 Playwright `game-exploration.spec.js` passati: abbandono e archivio/PGN
  originale, ritorno alla partita, nessun nuovo `go`; rifiuto mosse dopo matto,
  stallo, materiale insufficiente, cinquanta mosse e triplice ripetizione.
- 4 profili prima; 4 dopo cache; 4 `after-render` passati; sul codice finale
  derivata87/off e derivata87/real entrambi passati. Quaranta eventi tastiera
  attendibili, 39 con repeat; pause richieste dal driver 30 ms, intervalli reali
  più lunghi per rendering/driver. Verificati anche 8 click, pressione mouse,
  rotazione, scroll, FEN e pezzi visibili. La pressione mouse mantiene il
  comportamento nativo: non è stata aggiunta ripetizione ai pulsanti.
- Con motore reale: 7 `go` della partita originale prima della continuazione,
  ancora 7 dopo cancellazione e attesa. Non sono sette benchmark nuovi né
  una sola ricerca isolata: è il flusso applicativo invariato con budget 200k.
- 26 casi distinti UI/workspace/ripasso passati, compresi 1280 e 390 px,
  attraverso esecuzione principale e retry mirati. Due fallimenti iniziali:
  uno non riprodotto isolatamente durante modifiche HMR; uno causato da tre
  assert DOM separati che attraversavano il timer di inattività. Quest'ultimo
  corretto con snapshot DOM atomico e controllo esplicito di `event.repeat`;
  retry passati. Non occultati i risultati iniziali.
- 6 regressioni lifecycle motore/approfondimenti con mock passate.
- Build finale passata in 7,25 s; resta avviso bundle >500 kB.
- 2 smoke Grande V3 sulla produzione passati (archivio Qxa8 e distinzione
  classificazione ereditata/tattica confermata). Aggiornato il test per aprire
  la tracciabilità prima di cercarne il contenuto.

Evidenze persistenti: `docs/data/p0-long-game-{before,after,after-render,final,final-real}.json`.
`p0-long-game-after-real.json` conserva anche un precedente test fallito per
assert troppo anticipato: contava un `go` originale partito prima della
cancellazione. Il test finale confronta dopo l'ingresso nella continuazione;
nessun `go` successivo osservato. Raw CDP e log restano in `%TEMP%/p0-long-game-*`
e `%TEMP%/chessprofessor-p0-*`; non sono necessari per recuperare le conclusioni.

## Integrità e ripresa

Manifest iniziale `%TEMP%/chessprofessor-p0-baseline.json`, 2.392 file. Confronto
hash finale: soltanto i file applicativi elencati sopra, `analysis-workspace.spec.js`,
`grande-v3-smoke.spec.js`, `tests/game-navigation.test.js` risultano cambiati
rispetto all'inizio di questa fase; nessun file preesistente rimosso. Nuovi:
`game-exploration.spec.js`, `long-game-stability.spec.js`,
`scripts/qa-long-game-stability.config.js`, evidenze P0 e questo checkpoint.
Classificatore, worker, Stockfish, aperture, PGN, ricerca ChessReps e tutte le
altre modifiche preesistenti preservati. Nessuna scrittura nel checkout originale.

Anteprima produzione corrente: `http://127.0.0.1:4176/ChessProfessor/`, build in
`%TEMP%/chessprofessor-p0-final-dist`. Dev corrente: porta 4173.
Per i test P0, con dev già avviato:

```powershell
node node_modules/@playwright/test/cli.js test --config scripts/qa-long-game-stability.config.js game-exploration.spec.js
# Nuove evidenze con nome distinto, senza sovrascrivere i profili precedenti:
$env:P0_PHASE='followup'
node node_modules/@playwright/test/cli.js test --config scripts/qa-long-game-stability.config.js long-game-stability.spec.js
# Solo se serve una nuova verifica reale, non ripeterla automaticamente:
$env:P0_REAL='1'
node node_modules/@playwright/test/cli.js test --config scripts/qa-long-game-stability.config.js long-game-stability.spec.js
Remove-Item Env:P0_REAL
Remove-Item Env:P0_PHASE
```

Prossimo blocco: P1 `MoveExplanation` (eliminare riempitivi tecnici, commenti
solo fondati, unica spiegazione nel pannello), orientamento barra senza cambiare
il segno numerico, rimozione duplicati motore e verifica necessità interna delle
5 PV. Poi P2: dimensionamento desktop e suoni originali con preferenza persistente.
Nessuna di queste attività è dichiarata completata qui. Prima di ulteriori
ottimizzazioni estese servono il PGN originale dell'incidente o un caso equivalente
riproducibile e un controllo memoria mirato. Touch/audio fisico e screen reader
non verificati in questa fase.

## Aggiornamento P1/P2 completato — 2026-11-02

Questa sezione supera il precedente elenco di P1/P2 ancora da eseguire;
le evidenze storiche P0 sopra rimangono valide con i limiti già dichiarati.

### Verifica residua P0

Caso originale dell'incidente ancora non disponibile: riutilizzata la fixture
derivata a 87 semimosse, senza presentarla come riproduzione del crash.
Nuovo controllo circoscritto `p0-resource-lifecycle.spec.js`, 1 passato in 32 s:
otto cicli a motore fermo, uno con Stockfish reale attivo, continuazione
ipotetica/cancellazione e quattro cicli successivi. Ogni ciclo esegue 24 eventi
tastiera, assestamento e GC forzata prima del campionamento CDP.

- Motore fermo: 1.348 nodi DOM e 538 listener, costanti negli otto campioni.
- Dopo cancellazione: 1.363 nodi e 554 listener, costanti nei quattro campioni.
- Un solo worker costruito e riutilizzato nel documento; nessuna crescita nei
  cicli. Due comandi `go` prima della cancellazione, zero dopo lo `stop`.
- FEN attesi e zero errori pagina; nessun blocco grave osservato.
- Heap main target dopo GC: circa 13,38–14,55 MB off, 16,16–17,08 MB dopo stop.
  Range riportati, senza soglia artificiale di presunta assenza di leak.

Evidenza: `docs/data/p0-resource-lifecycle.json`, con campioni, comandi e limiti.
Il confine dell'assert è stato rafforzato al timestamp dello stop effettivo:
traccia ricontrollata offline e sintassi verificata senza ripetere la ricerca.
Non misurati teardown del documento, heap worker/WASM, GPU o leak lenti.
Il controllo precede l'aggiunta dell'audio; l'audio ha proprie prove di rilascio,
preferenza, singolo contesto e soppressione delle raffiche, non un heap profile.

### Spiegazioni didattiche

`src/lib/moveExplanation.js` conserva contratto, fatti e limitazioni interne;
`MoveExplanation.jsx` omette i campi vuoti e restituisce null senza contenuti
utili. Eliminati i riempitivi di legalità e mancata dimostrazione nella vista
didattica. Commenti fondati su posizione effettiva: sviluppo di cavallo/alfiere
con nuovo controllo centrale, occupazione del centro con pedone, alfiere in
fianchetto dietro il pedone corrispondente, catture/riprese/promozioni e matto.
Nessuna intenzione futura attribuita al giocatore.

Risposte concrete del motore presentate come eventi della variante, senza
spacciarle per difese obbligate. Alternative solo da confronto completo,
coerente e verificabile, con classificazione numerica ricalcolata fra
imprecisione/errore/errore grave/occasione persa. Un divario minimo su una buona
mossa non basta, neppure con una vecchia etichetta di errore. Rimossi i commenti
duplicati sotto la scacchiera; resta il pannello contestuale e la spiegazione
dell'esercizio quando si entra nel ripasso. Tracciabilità e dati preservati.

### Valutazione, MultiPV, dimensioni e suoni

- `evaluationBar.js` e `EnginePanel.jsx`: colore visualizzato sotto cresce dal
  basso; ruotare cambia colori/percentuali, senza cambiare il segno del punteggio.
  Coperti parità, vantaggi estremi, matto positivo/negativo e matto dato M0/-M0.
  Etichetta accessibile esplicita la convenzione Bianco positivo/Nero negativo.
- Rimossi conteggio MultiPV e valutazione duplicata dal pannello motore.
  Freccia ordinaria già limitata alla PV primaria; alternative didattiche filtrate.
- Audit statico: `ENGINE_CONFIG.multiPv` è 5; analisi partita e posizione usano
  questa configurazione. `grandeCandidateV3.js`, funzione `completed`, richiede
  almeno due PV e tutte le righe attese, con ordine/profondità/mosse distinti;
  il refinement usa il budget configurato, tranne acceptance già a una PV.
  Non dimostrata una riduzione sicura dei calcoli ordinari senza cambiare
  compatibilità/cache/evidenze. Nessuna modifica al budget o al motore.
- `src/index.css`: più spazio alla colonna scacchiera, piccolo margine sinistro
  e pannello destro; limite legato all'altezza desktop per tenere accessibile la
  navigazione. A 1280×1000 la scacchiera misurata supera 570 px (circa 614 px);
  a 390 px resta nella pagina, senza scroll orizzontale. Screenshot ispezionati.
- `MoveSound.jsx` e `moveAudio.js`: toni Web Audio originali sintetizzati, distinti
  per movimento e cattura (anche SAN con cattura en passant), nessun asset terzo.
  Default disattivato, preferenza persistente; attivazione/ripresa solo da gesto
  utente, pulsante Prova audio e messaggio se il browser nega l'avvio.
  Un contesto per scacchiera, oscillatore precedente fermato/disconnesso,
  durata 80 ms, raffiche sotto 90 ms scartate. Nessuna coda; niente suoni per
  import, salto di molte mosse, editor o navigazione rapida P0. Cleanup su smontaggio.

### Verifiche finali

- **94 test unitari passati**, otto file: move-explanation 38, review-practice 18,
  evaluation-bar 8, move-audio 2, game-navigation 6, game-archive 10,
  analysis-presentation 8, refinement-worker 4.
- **46 casi browser distinti passati**, attraverso esecuzioni mirate e retry:
  31 polish/workspace/esplorazione/ripasso, 4 orientamento/evidenziazioni,
  8 lifecycle/pausa/restart/approfondimenti, 2 smoke V3 produzione, 1 risorse P0.
  Verificati input ripetuti, cronologia completa, posizioni finali realmente
  terminate, PGN/archivio originale, pannelli, ripasso e navigazione con coach
  differito. Nessuna suite completa e nessun benchmark classificatore ripetuto.
- Audio browser: API AudioContext reale con avvii strumentati; tre mosse touch
  producono sine/sine/triangle; raffica produce al massimo un nuovo avvio,
  mute ne impedisce altri, preferenza e riattivazione dopo reload funzionano.
  Questo verifica generazione/riproduzione API, non l'ascolto tramite altoparlanti.
- Primo test audio fallito: il wrapper interpretava ogni `displayFen` come editor;
  corretto usando editor effettivo/differenza dalla FEN attiva. Retry passato.
- Prima esecuzione da 31: 30 passati, un vecchio assert attendeva un'intestazione
  didattica soppressa. Sostituito con controllo di contenuto concreto e alternativa
  Bb5 verificata; retry passato anche dopo il filtro di pertinenza finale.
- Layout/touch emulato a **1280 e 390 px**, screenshot controllati:
  `%TEMP%/chessprofessor-p1p2-layout-final/analysis-polish-bar-contextual-teaching-and-layout-{1280,390}/analysis-{1280,390}.png`.
- Build finale **passata, 8,04 s**; resta l'avviso noto di chunk >500 kB.
  Due smoke V3 ripassati sulla build finale. `git diff --check` dei file esistenti
  modificati passato (solo avvisi di normalizzazione CRLF/LF).

Log riprendibili in `%TEMP%/chessprofessor-p1p2-{unit-final,engine,last,polish,regressions,build-final,grande-final}.log`.
I risultati intermedi falliti non sono stati eliminati né descritti come passati.
Nessuna nuova misura equivalente prima/dopo del rendering finale: non si
attribuisce a P1/P2 un miglioramento prestazionale quantitativo non misurato.

### File e integrità

File esistenti modificati in questa fase: `src/components/{Board,EnginePanel,MoveExplanation}.jsx`,
`src/lib/moveExplanation.js`, `src/index.css`, `tests/move-explanation.test.js`,
`analysis-ui.spec.js`, `playwright-check.spec.js`, `review-practice.spec.js`,
e questo documento. Nuovi: `src/components/MoveSound.jsx`,
`src/lib/{evaluationBar,moveAudio}.js`, `tests/{evaluation-bar,move-audio}.test.js`,
`analysis-polish.spec.js`, `p0-resource-lifecycle.spec.js`, evidenza risorse JSON.
Aggiornati selettori/attese dei test motore per usare il punteggio della barra.

Manifest di controllo `%TEMP%/chessprofessor-p1p2-baseline.json` (2.401 file,
esclusi file .env); confronto in `%TEMP%/chessprofessor-p1p2-integrity.txt`.
Nessun file preesistente rimosso; nessuna modifica a classificatore V3,
Stockfish/configurazione, worker, aperture, dati, PGN, lavoro ChessReps o cache
P0. Il manifest è stato raccolto durante l'avvio coordinato del lavoro: i file
didattici assegnati sono elencati esplicitamente anche quando già modificati
all'istante del loro hash. Checkout originale intatto. Nessun commit/push/deploy.

**Pronto per verifica locale:** `http://127.0.0.1:4176/ChessProfessor/`, build
`%TEMP%/chessprofessor-p1p2-final-dist`; dev 4173 ancora disponibile.
Nessun intervento P1/P2 richiesto rimasto a metà. Rischi residui: caso autentico
Wait/Close e re fuori scacchiera non riprodotti; heap/GPU/worker non certificati
su sessioni lunghe; touch fisico, ascolto audio e screen reader da verificare
sul dispositivo dell'utente. Per un eventuale nuovo P0 ripartire da questo
checkpoint e dalla traccia risorse, richiedendo un caso riproducibile prima
di refactoring estesi o nuovi benchmark.

## Hotfix circoscritto — dimensioni del ripasso, 2026-11-02

Regressione riprodotta con fixture rappresentativa archiviata e motore simulato
del test ripasso, senza benchmark o ricerche reali. Misurata l'unione dei bounding
box delle **64 caselle renderizzate**, oltre al contenitore e al viewport.

| Viewport | Scacchiera prima | Scacchiera dopo | Fondo dopo nel viewport |
| --- | --- | --- | --- |
| 1920×1080 | 1590×1590 px | 760×760 px | 1042,84 px |
| 1280×900 | 1190×1190 px | 580×580 px | 862,84 px |
| 390×844 | 316×316 px | 256×256 px | 540,55 px |

Causa verificata: la schermata usa `.analysis-shell` larga fino a 1680 px,
introdotta negli interventi UX locali; il ripasso eredita questa larghezza.
Il suo CSS, già presente in HEAD, aveva griglia a colonna unica e
`.practice-board { width: 100% }`, senza limite d'altezza. Il componente
react-chessboard usa una griglia larga il 100% con caselle `aspect-ratio: 1/1`:
nessun calcolo JS applicativo imponeva una misura errata.
Non è una trasformazione anomala dei pezzi né un effetto del motore.
La sola modifica recente a `.workspace-grid` non vincola il ripasso, che è
montato fuori da quella griglia: il difetto riguarda la larghezza della shell
e il limite mancante del ripasso, non quella specifica regola di ingrandimento.

Correzione limitata a `src/components/ReviewPracticePanel.css`: due colonne
desktop con scacchiera limitata da larghezza e `100dvh`; colonna singola mobile
con spazio riservato a orientamento, inserimento mossa e azioni principali.
Titolo e form compattati soltanto nel ripasso. In
`src/components/ReviewPracticePanel.jsx`, il focus iniziale porta anche il titolo
in vista, sotto la navigazione fissa. Nessuna modifica ai CSS della scacchiera
di analisi, logiche di gioco, classificazioni, audio, varianti o motore.

Regressione automatica in `review-practice.spec.js`: misure della griglia reale,
64 caselle, quadratura, limiti di viewport, verifica e suggerimenti interamente
visibili, pezzi proporzionati, selezione e marker legali delle stesse dimensioni
delle caselle; clic/drag e assestamento dopo animazione. Nuovo caso di drag con
sottopromozione. `analysis-polish.spec.js` ora controlla l'analisi agli stessi
tre viewport esatti, preservando la dimensione desktop (>570 px a 1280).

**10 casi browser distinti passati**: 3 misure/interazioni, drag con
sottopromozione, ripasso da vecchia analisi, frecce di cavallo/rotazione mobile,
sottopromozione tramite SAN e 3 layout analisi. Un primo assert dei marker
cercava lo stile sul nodo casella anziché sul figlio della libreria: corretto
il selettore e passati i tre retry, senza modificare gli indicatori applicativi.
Un primo controllo mobile trovava suggerimenti sotto il viewport: corretto il
dimensionamento/form e verificata visibilità completa. Nessuna suite completa.

Evidenza prima/dopo: `docs/data/practice-board-sizing.json` (include controlli
e dimensione delle caselle). Log in `%TEMP%/chessprofessor-practice-size-*` e
`%TEMP%/chessprofessor-practice-analysis-final.log`. `git diff --check` passato.
Build passata in **6,93 s**, con il noto avviso chunk >500 kB; anteprima 4176
aggiornata usando la stessa directory `%TEMP%/chessprofessor-p1p2-final-dist`.

Su mobile le caselle misurano 32×32 px; verifica, suggerimento e soluzione sono
nel viewport iniziale, mentre Salta e i progressi sono immediatamente sotto.
Non verificati dispositivi fisici o tutte le altezze/orientamenti possibili.
File modificati in questo hotfix: i due file ReviewPracticePanel, i due test
citati, questo checkpoint e l'evidenza JSON. Nessun commit/push/deploy;
checkout originale e lavoro P0/P1/P2 preservati.
