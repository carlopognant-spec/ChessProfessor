# Audit UX della schermata di analisi — 2 novembre 2026

> Ultima revisione dopo il controllo visivo: [correzioni e verifiche](#revisione-dopo-il-controllo-visivo-dellutente).
> Le sezioni dell'audit sotto conservano le osservazioni precedenti al redesign.

Diagnosi selettiva completata, senza redesign o modifiche applicative. Le verifiche
ancora aperte sotto indicate delimitano le conclusioni: non è una certificazione
completa di accessibilità, prestazioni o correttezza di tutti i percorsi.

## Recupero e integrità

- Worktree verificata: `C:\Users\carlo\AppData\Local\Temp\chessprofessor-grande-candidate-20261030`.
- Branch: `work/grande-candidate-20261030`; HEAD: `6004046e4d3b571790270c5dc71da340035959ff`.
- Stato iniziale: **17 file modificati e 29 non tracciati**. Nessun reset, clean,
  stash, checkout, commit, push, merge o deploy.
- Recuperati `analysis-ux-audit.spec.js`, relativa configurazione, cinque misure
  in `docs/data/ui-animation-audit.json` e i cinque profili integrali
  `%TEMP%/ui-animation-audit-{plain,archived,active-replay,no-animation-control,summary-off-control}.json`.
  Non esisteva un resoconto UX finale. La sintesi della sessione precedente
  attestava soltanto il controllo sintattico del test UX; i dati di animazione
  presenti sul disco documentano invece misure già svolte. Non sono stati rigenerati.
- Consultati `GRANDE-V3-CLOSURE.md`, `GRANDE-V3-INTEGRATION.md` per il perimetro e
  `GRANDE-V3-PERFORMANCE.md` con `docs/data/grande-performance-verification.json`
  per riutilizzare diagnosi, verifiche e limiti prestazionali.
- Contesto recuperato dalla sintesi della sessione `01a1980e-2103-7901-8778-35ae1c6440ee`
  e da un estratto mirato della coda del relativo log, senza lettura integrale.
- Confronto SHA-256 finale: **2.377/2.377 file preesistenti identici**, compresi
  quelli non tracciati; nessuno mancante. Manifest esterno:
  `%TEMP%/chessprofessor-ux-baseline-20261102.json`.
- Soli nuovi artefatti nel repository: questo documento e
  `docs/data/analysis-ux-audit-observations.json`. Configurazioni, copie dei test,
  screenshot e risultati aggiuntivi sono in `%TEMP%`. Nessuna modifica ai sorgenti
  del checkout originale; dipendenze già installate, nessuna riconfigurazione.

File già modificati, tutti preservati:

| Gruppo | Percorsi relativi |
| --- | --- |
| Applicazione, tracciati | `src/App.jsx`; `src/components/{ClassificationDetails,EnginePanel}.jsx`; `src/lib/{analysisRefinement,analysisSpecialClassification,classificationDecision,gameAnalysis,reviewMoves,reviewPractice}.js` |
| Test, tracciati | `{analysis-ui,playwright-check,review-practice}.spec.js`; `tests/{analysis-special-classification,grande-recovery-proof,grande-verification,native-proof-flow,special-classification}.test.js` |
| Applicazione, non tracciati | `src/lib/{grandeCandidate,grandeCandidateV2,grandeCandidateV3,refinementWorker,refinementWorkerClient}.js` |
| Test, non tracciati | `{analysis-ux-audit,grande-performance,grande-v3-smoke,ui-animation-audit}.spec.js`; `tests/{grande-candidate,grande-candidate-v2,grande-candidate-v3,grande-v3-integration,refinement-worker}.test.js`; `tests/fixtures/grande-v3-regressions.json`; `tests/helpers/browser-refinement-worker.js` |
| Script, non tracciati | `scripts/evaluate-grande-candidate{,-v2,-v3}.mjs`; `scripts/qa-{analysis-ux-audit,grande-performance-browser,grande-v3-browser,refinement-browser,ui-animation-audit}.config.js` |
| Documenti/dati, non tracciati | `docs/GRANDE-V3-{CLOSURE,INTEGRATION,PERFORMANCE}.md`; `docs/data/{grande-performance-verification,ui-animation-audit}.json` |

Le parentesi graffe nella tabella abbreviano soltanto l'elenco dei nomi.

## Inventario e comportamento dei controlli

**N** = verificato ora con Playwright; **R** = evidenza precedente riutilizzata;
**S** = lettura del codice, senza nuova prova di quel percorso. PASS significa
che il comportamento atteso dal test è stato osservato, anche quando descrive un bug.

| Controlli e funzione prevista | Risultato / problema / sovrapposizione |
| --- | --- |
| Primo, Indietro, Avanti, Ultimo; frecce da tastiera | **N:** FEN e contatore corretti, estremi disabilitati; frecce ignorate nel campo PGN. Nessun difetto osservato in questo percorso. |
| Pulsanti della notazione: selezionare una posizione | **N:** selezione corretta, ma tornando alla semimossa 2 di 4 rimangono soltanto 2 pulsanti: la continuazione esiste ancora ed è raggiungibile con Avanti/Ultimo. |
| Righe del resoconto: esaminare la mossa | **N:** la riga 25 porta alla FEN **prima** della mossa. La notazione porta invece alla posizione dopo la mossa (**S**): funzioni vicine, ma non equivalenti. Il clic non riporta la scacchiera in vista. |
| Vista Auto/Bianco/Nero, Ruota; riconoscimento nome PGN | **R:** smoke di orientamento/UI riportati nel lavoro prestazionale; **S:** dropdown e Ruota modificano lo stesso stato. Ruota è una scorciatoia, non una funzionalità diversa. Nessuna nuova prova di persistenza effettuata. |
| Importa PGN da testo | **N:** partita valida applicata; PGN illegale segnala errore e conserva la FEN precedente. |
| Reset partita | **N:** reset immediato senza conferma; il vecchio testo PGN resta nel campo. Rischio di confondere partita corrente e bozza da reimportare; non implica cancellazione degli archivi. |
| ← Torna indietro | **N:** disabilitato nel percorso import/reset; **S:** annulla soltanto mosse applicate dalla chat. Nome ambiguo rispetto a Indietro della navigazione; non è un undo generale. |
| Editor: FEN, Applica posizione, palette K/Q/R/B/N/P e minuscole, Cancella | **N:** anteprima FEN, applicazione, inserimento cavallo e cancellazione corretti; posizione senza re respinta. Non provati tutti i pezzi individualmente. |
| Editor: lato al tratto, en passant, arrocchi | **S:** aggiornano i campi della bozza; validazione all'applicazione. Non ripetuti tutti gli incroci dei campi. |
| Copia FEN | **N, bug:** con una bozza visibile diversa dalla partita copia la FEN sottostante e sovrascrive la bozza. Rifiuto clipboard simulato: errore non gestito, nessun messaggio locale di esito. |
| Scacchiera: selezione e promozione | **N, bug:** indicatori delle mosse legali persistono dopo import con casella sorgente ormai vuota. In studio il clic promuove sempre a donna, pur esistendo quattro promozioni legali. **S:** anche il drag forza `q`; il drag non è stato riprovato. |
| Frecce disegnate manualmente | **S:** disponibili, conservate al cambio posizione (`clearArrowsOnPositionChange: false`). Utilità intenzionale o possibile residuo visivo da chiarire; nessuna nuova prova con mouse/touch. |
| Salva partita e analisi; Apri; Rinomina; Esporta PGN; Elimina; importa file PGN | **N:** salvataggio/deduplica, rinomina, riapertura, export dell'intera continuazione anche da Primo, annullamento/conferma eliminazione e import file corretti. Browser isolato, nessun archivio personale modificato. |
| Avvia, Interrompi, Riprendi analisi; Riavvia motore | **R:** regressioni motore/annullamento riportate nel lavoro precedente; **S:** ripresa conserva i risultati, riavvio esplicito dopo errore. Nessuna ricerca Stockfish reale in questo audit. Avvia è alto 35 px nei due viewport misurati. |
| Approfondisci le mosse dubbie; Verifica le Grandi / i sacrifici / le scelte decisive; Interrompi approfondimento | **R:** piani, stop, doppio clic, risultati parziali, ripresa e fallimento motore già verificati. **S:** sono selettori diversi, non duplicati eliminabili senza mantenere i filtri. Le Grandi richiede risultati di approfondimento; i controlli speciali dipendono dall'opzione sperimentale. |
| Mostra analisi approfondita; Mostra Grande e Geniale sperimentali | **R:** toggle/coerenza v3 coperti dagli smoke precedenti; **S:** distinguono proiezione approfondita e visibilità delle categorie sperimentali. Non sono lo stesso interruttore. |
| Ripassa i miei errori, Il mio colore, Riprova posizione N | **R:** 17 scenari di ripasso riportati nel lavoro precedente; **N:** lanciatore disabilitato senza analisi. Doppio accesso utile: selezione globale o posizione singola. Lanciatore alto 35 px. I controlli interni della sessione sono fuori dal perimetro della schermata qui completato. |
| Perché questa classificazione? → Spiegazione scacchistica / Dati e criteri | **N:** aperti sulla semimossa 25; spiegazione visibile, scacchiera fuori viewport. **S:** spiegazioni ripetute per riga e dati tecnici annidati; accesso lungo al contenuto didattico. |
| Strumenti; Editor; Partita e analisi; Aperture; Chatbot; Partite salvate | **N:** disclosure usati nei flussi. Importazione e resoconto richiedono due aperture; archivio una terza. **N:** richiesta Explorer anche con Aperture chiuso, risposta simulata. **S:** manca un comando di retry sulla stessa posizione dopo errore. |
| Chat: provider Groq/Gemini, testo, Invia | **N, solo sviluppo:** selezione provider e invio locale funzionano, ma una richiesta non critica viene respinta senza chiamare AI esterna. **S/N DOM:** provider e campo non hanno label esplicita; messaggi senza semantica live. **S:** in produzione questi controlli sono sostituiti da un messaggio di chat disabilitata. Percorso AI positivo non provato. |
| Link Partita e analisi / Biblioteca aperture | **S:** navigazione tramite hash, contenuto preservato montato. Biblioteca fuori perimetro: non rieseguita. |

## Distanza tra mossa, spiegazione e scacchiera

Misura nuova su archivio autentico di **66 semimosse**, Edge headless, altezza 900 px,
contesti vuoti e richieste Explorer simulate; zero worker Stockfish.
Coordinate verticali riferite al documento, non al viewport:

| Viewport | Scacchiera | Navigazione | Riga 25 | Spiegazione aperta | Altezza pagina, prima → dopo apertura |
| --- | --- | --- | --- | --- | --- |
| 1280 × 900 | y 179–705, 526 px | y 1146–1215 | y 4696–4740 | y 5306–5833 | 10.201 → 11.307 px |
| 390 × 900 | y 159–515, 356 px | y 996–1065 | y 4869–4920 | y 5677–6348 | 11.134 → 12.576 px |

Il clic sulla riga modifica correttamente il modello, ma lascia lo scroll a 4268/4445 px:
**scacchiera e navigazione non sono visibili**. Aprendo la spiegazione, lo scroll arriva
a 4821/5193 px e può uscire dalla vista anche la riga selezionata. La spiegazione
comincia rispettivamente 610/808 px sotto l'inizio della riga. Nessun overflow
orizzontale osservato. CSS: contenuto limitato a 600 px anche sul desktop, tutto in
colonna. Il problema dimostrato è la distanza funzionale verticale, non la sola
quantità di pulsanti. Screenshot completi ispezionati, in `%TEMP%/chessprofessor-ux-analysis-{1280,390}.png`.

## Animazioni: evidenze riutilizzate e limiti causali

Stessa partita di 66 semimosse; cinque acquisizioni del 1 novembre, dev server,
Edge headless, profiler CDP e campionamento DOM/rAF. Una sola acquisizione per caso:
**non** benchmark statistico né misura della build produzione. I tempi includono
l'overhead della strumentazione; gli intervalli totali sono diversi.

| Scenario | Max long task UI | Long task cumulativi | Max gap rAF | Commit React / con Board |
| --- | ---: | ---: | ---: | ---: |
| Partita senza analisi archiviata | 116 ms | 554 ms | 117 ms | 52 / 33 |
| Analisi archiviata | 379 ms | 2590 ms | 344 ms | 46 / 33 |
| Replay di una risposta archiviata | 265 ms | 3266 ms | 267 ms | 43 / 34 |
| Animazioni disattivate nel solo test | 333 ms | 2484 ms | 333 ms | 30 / 24 |
| Resoconto rimosso nel solo test | 251 ms | 2333 ms | 256 ms | 51 / 34 |

**Confermato:**

- Le trasformazioni animate esistono: nel caso semplice, 13–20 matrici distinte per
  movimento, con primi campioni trasformati 42–101 ms dopo il clic. Durata configurata:
  120 ms. Nell'archiviato compaiono anche movimenti senza campioni intermedi o con una
  sola matrice. Non è quindi una semplice animazione disabilitata.
- Il thread UI perde finestre di rendering: gap superiori alla durata nominale
  dell'animazione possono consumarne gli stati intermedi. Disattivare le animazioni
  elimina le trasformazioni ma lascia pause fino a 333 ms: CSS/trasformazioni non
  spiegano da soli il lag riprodotto.
- Zero smontaggi della scacchiera nei cinque casi. Non c'è evidenza del remount
  come causa nei percorsi misurati; sono presenti numerosi aggiornamenti React.
- I profili attribuiscono lavoro applicativo a render di resoconto/dettagli,
  `resolveMoveReview` e replay/sincronizzazione della partita. Nel caso archiviato,
  tempi campionati **inclusivi**: `AnalysisSummary` circa 210 ms,
  `ClassificationDetails` 279 ms, `resolveMoveReview` 74 ms, `replayGame` 100 ms.
  Non vanno sommati come costi indipendenti o equiparati a tutta la durata dei long task.
  Togliere il resoconto migliora alcuni segnali ma lascia gap di 256 ms: è un
  contributore verificato, non una causa unica né una stima affidabile del guadagno.
- Il lag è riproducibile con **zero ricerche Stockfish**. Nel replay attivo sono
  registrati due comandi `go` e una risposta storica, con attesa artificiale di
  500 ms: questo misura la pubblicazione di dati e il lavoro UI associato,
  non il consumo CPU di Stockfish.
- La precedente diagnosi del pulsante scelte decisive resta valida: calcolo
  sincrono del piano/render/validazione in chess.js, indipendente da ricerche reali.
  Il fix worker già presente ha portato max long task da 27.941 a 166 ms e stop da
  28.006 a 84 ms nel confronto archiviato. **Non è un blocco ancora da correggere
  sul thread UI**. Restano pianificazione lunga in background e salvataggio archivio
  con long task di 1099 ms, già documentati; nessun benchmark ripetuto.

**Restano ipotesi/non misurati:** contesa CPU con Stockfish realmente in ricerca,
GPU/compositor/paint, esperienza su dispositivo fisico e peso residuo delle singole
regole CSS. La durata 120 ms può apparire rapida, ma allungarla non risolve i long task.
Nessuna prova isola un unico aggiornamento React responsabile di tutte le pause.

## Esecuzioni di questa ripresa

1. `node node_modules/@playwright/test/cli.js test --config scripts/qa-analysis-ux-audit.config.js --reporter=list --output C:/Users/carlo/AppData/Local/Temp/chessprofessor-ux-results-20261102`
   → **4 PASS, 1 FAIL, 17,0 s**. Fallimento dell'harness: leggeva `backgroundImage`
   sul quadrato invece che sull'overlay figlio. Non dimostrava un difetto applicativo.
2. Solo quel caso, copia temporanea con selettore corretto:
   `node node_modules/@playwright/test/cli.js test --config C:/Users/carlo/AppData/Local/Temp/chessprofessor-ux-selection-20261102/config.mjs --grep "selection hints" --output C:/Users/carlo/AppData/Local/Temp/chessprofessor-ux-selection-results-20261102`
   → **1 PASS, 3,8 s**. Originale preservato: il suo selettore richiede ancora correzione
   prima di riutilizzarlo come regressione stabile. Due tentativi preliminari di
   configurazione/import della copia temporanea non avevano eseguito test.
3. `node $env:TEMP/chessprofessor-ux-layout.mjs` → assert PASS a **1280 e 390 px**:
   66 righe, FEN prima della mossa 25 esatta, nessun overflow orizzontale, zero errori
   pagina e zero worker Stockfish. Verifica mirata nuova, non benchmark prestazionale.
4. Lettura e aggregazione offline dei cinque profili CDP esistenti; nessuna nuova
   acquisizione delle animazioni. Conservati hash dei profili nel JSON di evidenza.
5. SHA-256 dei file preesistenti e controllo finale di branch/HEAD/stato.
   `git diff --check` PASS; soltanto avvisi preesistenti di normalizzazione CRLF/LF.

In totale: **cinque scenari UX distinti verificati con successo**, uno dei quali
soltanto nella copia corretta; due verifiche aggiuntive del layout. Explorer e
clipboard sono simulati dove dichiarato. Nessun contatto AI, ricerca Stockfish,
suite completa, build o benchmark storico eseguito. Le 63 verifiche Vitest, i tre
scenari prestazionali e i 27 smoke citati nel report prestazionale sono risultati
precedenti, non nuove esecuzioni.

## Raccomandazioni per la successiva progettazione, in ordine

1. **Correttezza e feedback:** Copia FEN deve operare sulla posizione esplicitamente
   indicata senza cancellare la bozza e segnalare l'esito; pulire la selezione quando
   cambia posizione; consentire tutte le promozioni in studio. Rendere chiaro l'effetto
   del reset e distinguere la bozza PGN dalla partita attiva.
2. **Contesto della mossa:** scacchiera, navigazione, notazione completa e spiegazione
   della mossa selezionata devono essere consultabili insieme. Su desktop sfruttare
   lo spazio disponibile; su mobile prevedere un accesso diretto alla posizione e
   un dettaglio selezionato, evitando 66 spiegazioni/disclosure distribuiti in pagina.
   Conservare la distinzione prima/dopo la mossa e tutte le informazioni verificabili.
3. **Lavoro UI durante la navigazione:** intervenire sui render/calcoli del resoconto,
   dettagli e replay solo dopo un confronto mirato sulla build produzione. Separare
   il salvataggio archivio, già lento, dal tema animazioni. Preservare worker, stop,
   snapshot parziali, budget e classificazione; niente allungamento CSS come soluzione
   principale al lag.
4. **Controlli più leggibili:** un'azione principale per lo stato corrente di analisi;
   filtri di approfondimento raccolti in un accesso avanzato mantenendo le diverse
   coperture. Rendere import/apri immediatamente trovabili; collocare reset tra le
   azioni partita; rinominare l'undo in “Annulla mossa chat”. Non eliminare import
   testo/file, ripasso globale/singolo o toggle con significato diverso. Valutare
   dropdown orientamento + scorciatoia Ruota come un unico gruppo compatto.
5. **Accessibilità e attese:** label della chat, annunci dei messaggi, esito copia,
   bersagli coerenti con i 44 px già usati altrove; spiegazione della disponibilità
   dei comandi disabilitati; retry Explorer esplicito e richiesta differita fino
   all'apertura del pannello se coerente con le esigenze della chat.

## Verifiche ancora mancanti

- Breve confronto navigazione in produzione con Stockfish reale attivo/inattivo,
  senza rifare benchmark o ricerche sul corpus; trace rendering/paint su hardware
  rappresentativo se rimane lag. Gli esiti attuali non attribuiscono lag alla CPU motore.
- Tastiera/screen reader completi, drag/touch, clipboard reale con permessi del browser,
  chat AI positiva e disegno frecce al cambio posizione. Non serve provarli per
  confermare i bug già riprodotti, ma restano necessari per una QA generale.
- Correggere il selettore nel test UX recuperato quando sarà autorizzato il lavoro
  successivo. Non rieseguire gli scenari già superati senza cambi pertinenti.

Evidenze persistenti: `docs/data/analysis-ux-audit-observations.json`, i due JSON
prestazionali già presenti e i report Grande esistenti. Profili e script temporanei
sono referenziati per riproducibilità, ma possono essere rimossi dal sistema.

## Implementazione successiva — 2 novembre 2026

Schermata aggiornata nella stessa worktree e sullo stesso HEAD, senza commit.
L'audit storico e `docs/data/analysis-ux-audit-observations.json` sono preservati.

### Comportamento consegnato

- Desktop: due colonne; scacchiera e navigazione rimangono consultabili durante
  la lettura. Mobile: scorciatoie con focus per raggiungere scacchiera o dettaglio.
- Notazione completa sempre disponibile, posizione attiva evidenziata e lista
  con scroll interno. Elenco classificazioni compatto, un solo dettaglio contestuale.
  Azioni esplicite Prima/Dopo la mossa; frecce coerenti anche prima della mossa,
  senza badge della mossa precedente. Totali e precisione disponibili nel resoconto.
- Distinte Copia FEN corrente e Copia bozza FEN: nessuna sovrascrittura dell'editor,
  esito accessibile anche con clipboard rifiutata o assente.
- Selezioni ripulite su navigazione, import e reset, anche alla stessa FEN.
  Dialog di promozione per clic e trascinamento: Donna/Torre/Alfiere/Cavallo,
  annullamento/Escape e gestione del focus. Le frecce da tastiera nel dialog
  non navigano la partita sottostante.
- Reset mantiene intenzionalmente bozza PGN e archivio: testo preventivo ed esito
  lo dichiarano. Modificare la bozza non applica una partita. Undo rinominato
  “Annulla mossa chat”. Importazione e apertura raggiungibili dall'intestazione.
- Filtri di approfondimento raccolti nelle verifiche avanzate; toggle distinti,
  ripasso globale e ripasso della posizione conservati. Label e annunci chat corretti.
- Resoconto aggregato memoizzato; dettagli costosi calcolati per la sola mossa
  selezionata. Nessun refactoring del replay, del classificatore o del worker.
  Archivi legacy senza `moveHistorySan` navigano usando la timeline completa.

### Verifiche eseguite

**42 scenari browser distinti PASS**, senza contare due volte i retry:

| Gruppo | Scenari |
| --- | ---: |
| Audit trasformato in regressione: navigazione/reset, editor/copia, archivio, selezione/promozione, chat/layout | 5 |
| Nuovo workspace: 1280/390 px, contesto prima/dopo, frecce e badge, scorciatoie/focus, tastiera nel dialog | 3 |
| Editor/scacchiera: clipboard, stessa FEN, quattro promozioni clic e quattro drag, annullamento | 4 |
| Orientamento e frecce, desktop/mobile | 4 |
| Ripasso, compreso quello singolo con analisi approfondita legacy | 17 |
| Motore: Stockfish 19 reale, due riavvii espliciti, quattro lifecycle approfondimento | 7 |
| Smoke V3 sulla build finale: decisioni, toggle, archivio/offline, ereditata distinta da confermata | 2 |

**52 test Vitest PASS**, cinque file: `game-navigation`, `game-archive`,
`analysis-presentation`, `refinement-worker`, `move-explanation`.
Build finale PASS (157 moduli); resta l'avviso preesistente per bundle oltre 500 kB.
`git diff --check` PASS. Screenshot 1280/390 ispezionati; nessun overflow orizzontale
nei casi verificati. Le azioni principali hanno bersagli di almeno 44 px.

Il test UX recuperato ora legge correttamente lo sfondo dell'overlay figlio.
Il test drag attende 60 ms per il cleanup del sensore dnd-kit, che sopprime clic
per 50 ms dopo il drop: il primo timeout non era un difetto della promozione.
Il test di ripasso ha invece trovato il fallback timeline mancante, corretto
nel sorgente e verificato senza alterare la fixture legacy.
I selettori degli altri test coinvolti sono stati adattati; quelli non eseguiti
non sono dichiarati validati runtime. Nessuna suite completa rieseguita.

### Misure sulla produzione

Confronto mirato con la stessa partita di 66 semimosse e otto navigazioni a
1280×900. Zero ricerche motore durante la misura; nessun job di test concorrente.

| Segnale | Prima, build preservata | Build finale |
| --- | ---: | ---: |
| Massimo long task UI | 57 ms | 51 ms |
| Long task cumulativi | 212 ms | 51 ms |
| Massimo gap rAF | 55,6 ms | 44,5 ms |
| Intervalli rAF oltre 25 ms | 16 | 16 |

Una sola osservazione per versione: segnali favorevoli, **nessuna stima statistica
del guadagno e nessuna promessa di fluidità perfetta**. La prima baseline aveva
61 ms massimi. Una misura intermedia after sovrapposta ad altri test è esclusa;
resta conservata e marcata nel JSON. Le misure dell'audit in sviluppo non sono
confrontate direttamente con questi valori di produzione. Durata animazioni
immutata a 120 ms; nessun nuovo blocco importante osservato nella navigazione misurata.

Evidenza: `docs/data/analysis-navigation-production.json`. Riproduzione:

```powershell
node scripts/measure-analysis-navigation.mjs http://127.0.0.1:4176/ChessProfessor/ "$env:TEMP/navigation.json"
```

Richiede la build di produzione già servita a quell'indirizzo; non avvia il motore.
Stockfish reale è stato verificato separatamente per correttezza, cache e riavvio
offline: questi test non misurano la contesa CPU durante le animazioni.

### Integrità, accesso locale e limiti

Manifest iniziale: `%TEMP%/chessprofessor-redesign-baseline.json`, 2.379 file.
Nessun file preesistente rimosso. Codice di `src/lib/`, worker, Stockfish, aperture,
fixture protette e cinque profili originali invariati rispetto all'inizio di
questa implementazione. Le modifiche preesistenti V3 restano presenti; in
`EnginePanel` gli interventi nuovi riguardano soltanto il raggruppamento dei controlli.
Nessuna installazione, lettura `.env`, riconfigurazione di agenti/MCP o modifica
ai sorgenti del checkout originale. Nessun commit, push, merge o deploy.

Anteprima sviluppo locale: `http://127.0.0.1:4173/ChessProfessor/`.
Per riavviarla dalla worktree, dopo aver fermato un eventuale server sulla porta:

```powershell
node node_modules/vite/bin/vite.js --config scripts/qa-no-env-build.config.js --host 127.0.0.1 --port 4173 --strictPort
```

Per le regressioni del workspace, con quel server attivo:
`node node_modules/@playwright/test/cli.js test --config scripts/qa-analysis-workspace.config.js`.
La build finale è in `%TEMP%/chessprofessor-ux-final-dist`.

Restano da provare touch e screen reader su dispositivi fisici, clipboard con
permessi reali, GPU/paint e contesa con Stockfish reale. La chat positiva non è
stata chiamata; resta disabilitata nella produzione come prima. Rimangono i limiti
già noti di pianificazione in background e salvataggio archivio: non sono stati
alterati né nuovamente misurati. Nessuna regressione residua nei percorsi eseguiti.

## Revisione dopo il controllo visivo dell'utente

Completata il 2 novembre 2026 nella stessa worktree/branch/HEAD. Le sezioni
precedenti descrivono gli stati storici, non la disposizione attuale.

- Scacchiera centrata sul desktop; barra verticale immediatamente a sinistra,
  allineata e alta quanto la scacchiera, con punteggio e nome accessibile.
  La barra usa gli stessi dati/calcoli esistenti del pannello motore tramite portal.
- Pannello destro: spiegazione didattica in alto, quindi **unica** notazione
  tabellare Turno/Bianco/Nero. Selezione e tastiera mostrano la posizione dopo
  la mossa. Continuazione completa conservata; selezionata evidenziata e mantenuta
  visibile nello scroll interno, anche con intestazione sticky.
- Rimossi i pulsanti Prima/Dopo e la relativa selezione UI. Le distinzioni FEN
  prima/dopo restano nei dati. Frecce riferite soltanto alla posizione corrente,
  badge/colori alla mossa effettivamente giocata. Selezioni e frecce manuali
  azzerate al cambio posizione. Supportati anche archivi legacy senza storia per riga.
- Spiegazione disponibile per tutte le mosse analizzate, con titolo neutro per
  quelle senza errore. Varianti/limiti espandibili. Dati numerici, motivazioni,
  prove e `ClassificationDetails` conservati nella tracciabilità chiusa: nessuna
  cancellazione di metadati. Anche controlli motore/approfondimenti sono espandibili.
- Rimossa Aperture dalla radice Strumenti. Il contesto di apertura ancora utile
  alla chat è caricato soltanto aprendola, senza richiesta Explorer all'avvio.
  Biblioteca e percorsi formativi invariati. Editor preservato senza redesign.
- Mobile 390 px: colonna singola, scorciatoie con focus, controlli raggiungibili,
  stessa barra verticale e nessun overflow orizzontale nei flussi verificati.

File applicativi modificati in questa revisione: `src/App.jsx`,
`src/components/{AnalysisSummary,MoveList,MoveExplanation,Board,EnginePanel}.jsx`,
`src/index.css`. Adattati sei spec esistenti e la configurazione mirata;
aggiunto `browser-inputs.spec.js`. Il test della tabella ha verificato e corretto
un difetto reale dell'autoscroll: `offsetTop` nel nuovo markup era relativo alla
cella, non al contenitore. Ora si usano i rettangoli relativi del contenitore.

### Esiti di questa revisione

**44 scenari browser distinti PASS**, escludendo dal conteggio i retry:
5 audit/regressione, 4 editor/promozioni, 1 touch/clipboard, 4 workspace,
4 orientamento/evidenziazioni, 17 ripasso, 7 motore/lifecycle, 2 smoke V3 in produzione.
I due workspace sono stati rieseguiti dopo il fix autoscroll; il test Stockfish
reale dopo lo stesso fix, per misurare il codice finale. Sono passati entrambi.
**38 test unitari PASS** in `game-navigation`, `analysis-presentation`,
`move-explanation`. Build finale PASS, 157 moduli; avviso bundle >500 kB preesistente.
`git diff --check` PASS. I restanti adattamenti ai test storici sono statici,
non vengono presentati come copertura runtime. Nessuna suite completa o benchmark
del classificatore rilanciato.

Verificati: iniziale/finale e timeline, selezione dopo la mossa, evidenziazioni,
spiegazione, barra, layout 1280/390, archivio, metadati/toggle/offline V3,
entrambi i ripassi, caricamento e apertura pannelli, restart/cancellazione/ripresa.
Screenshot finali ispezionati in `%TEMP%/chessprofessor-unified-notation-scroll-results/`.

Touch: emulazione Chromium a 390 px, mossa e sottopromozione tramite eventi touch
autentici del browser. Clipboard: API reale, senza mock, con permessi concessi
nel contesto isolato; copie corrente/bozza verificate e contenuto precedente
ripristinato senza esporlo nei log. Accessibilità di base: nomi/ruoli, intestazioni
della tabella, focus, tastiera e dialog verificati. Non è una certificazione con
screen reader né una prova su hardware touch fisico.

### Navigazione con Stockfish attivo

Riutilizzato il test funzionale con Stockfish 19 reale a budget invariato di
200.000 nodi: nessun nuovo corpus o benchmark. Nel percorso già previsto sono
state campionate otto navigazioni, **8/8 mentre il worker era in ricerca**
(flag sui messaggi `go`/`bestmove`). Misura finale isolata su Edge headless/Vite:
gap rAF massimo **44,5 ms**, **zero long task ≥50 ms** nella finestra osservata.
È una misura breve singola in sviluppo, non un confronto statistico, una promessa
di 60 fps o una misura GPU. Il risultato precedente al fix scroll è conservato
separatamente in TEMP e non è usato per attribuire causalità.

Evidenze persistenti: `docs/data/analysis-navigation-engine-active.json` e
`docs/data/analysis-ux-revision-observations.json`; profili e risultati precedenti
preservati. Durata animazioni ancora 120 ms; nessuna modifica a motore,
classificatore, refinement worker, cache o logiche scacchistiche.

Manifest iniziale: `%TEMP%/chessprofessor-ux-revision-baseline.json`, 2.385 file.
Nessun file preesistente rimosso; hash di `src/lib`, fixture, dati protetti,
editor, biblioteca e osservazioni storiche invariati. Nessun intervento sul
checkout originale; nessun commit, push, merge, deploy o riconfigurazione strumenti.
Anteprima locale pronta su `http://127.0.0.1:4173/ChessProfessor/`;
build finale in `%TEMP%/chessprofessor-ux-revision-final-dist`.

Restano: verifica visiva dell'utente, touch fisico, screen reader, permessi
clipboard nell'ambiente quotidiano dell'utente, GPU e contesa CPU prolungata.
Nessuna regressione residua osservata nei percorsi eseguiti.
