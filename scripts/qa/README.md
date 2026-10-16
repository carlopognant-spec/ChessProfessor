# Confronto QA

Questo documento descrive il codice corrente. I report e le baseline storiche
conservano configurazione, data e risultati della loro esecuzione.

Classificatore speciale corrente `counterfactual-v20`: cattura dello scaccante,
forchetta con scacco, risposta forzante rinviabile e sacrificio con accettazione
obbligata/PV terminale verificata e minaccia di matto nuova in assenza di
scacco entrante. Soglie e punteggi numerici invariati.
Grandi24/34 FP0, Geniali3/4 FP0 nel profilo di sviluppo piu completo.
I verificatori monouso `verify-special-completion-tactics.mjs` e
`verify-forced-mating-sacrifice.mjs` hanno confrontato tutte le1116 osservazioni;
i risultati sono in `agent-output/special-completion-v1/verification-v16.json`
e `verification-v17.json`. I manifest fissano le versioni prima/dopo: non
rilanciare quelli storici dopo ulteriori modifiche delle sorgenti congelate.
La verifica successiva `verify-causal-mating-threat.mjs`, salvata in
`verification-v18.json`, aggiunge Qh5 senza promuovere Kb6. Il precedente
candidato privo della precondizione causale rimane respinto e conservato.
`diagnose-special-decision-pairs.mjs` e soltanto una diagnosi sui104 FEN
gia raccolti, non un nuovo flusso nell'app o una validazione indipendente.
[Report corrente](../../agent-output/special-completion-v1/report.md).

## Confronto rapido delle categorie ordinarie

`node scripts/compare-ordinary-evidence.mjs agent-output/<nuovo-nome>` confronta
insieme tre ipotesi sui dati di sviluppo gia salvati: alternative quasi pari,
ultima coppia root coerente e stima child piu profonda. Non avvia Stockfish e
non legge le cinque partite riservate. Ricalcola anche le categorie speciali,
conta correzioni e regressioni per ciascun gruppo e verifica gli hash delle
sorgenti e delle dipendenze congelate. La cartella di output deve essere nuova.
Il protocollo viene scritto prima dei risultati; `results.json` conserva tutte
le modifiche proposte e la matrice delle discrepanze. I profili iniziale e
approfondito sono misure delle stesse 262 mosse, oltre alle 592 precedenti.
Una proposta con regressioni viene scartata; nessuna modifica e applicata
automaticamente al classificatore. Il primo confronto e in
`agent-output/ordinary-evidence-batch-v1/`.

## Configurazione dell'app

La fonte è `src/lib/engineConfig.js`: Stockfish **19.0.0**, build
**large-single**, budget nominale **200.000 nodi**, **MultiPV 5**, Threads 1,
Hash 16 MB. Il worker browser invia `ucinewgame` e `Clear Hash` prima di ogni
ricerca. Gli asset provengono dal pacchetto npm tramite
`scripts/stockfish-assets.js`; non vengono usati i vecchi asset lite.

`defaultDepth: 12` resta per il QA storico. Non è il limite di ricerca del
browser e non esiste un fallback corrente a depth 8.

Le cache dell'esperimento a nodi sono in
`tests/fixtures/qa/analysis-cache-large-200k/<data-esecuzione>/` e registrano
motore, build, budget, hash policy, score e telemetria. Non sono intercambiabili
con le cache legacy a depth 12. `scripts/qa-nodes-experiment.js` genera nuove
ricerche e un output separato: non è un controllo unitario né un comando da
lanciare durante una semplice pulizia del codice.

## Categorie e precisione

L'approfondimento facoltativo è in `src/lib/analysisRefinement.js`. La versione
iniziale resta a 200.000 nodi, con dati a 1.000.000 salvati separatamente nel
campo `refinement`. Per richiesta: massimo 12 mosse, 24 FEN distinte e riserva
telemetrica di 5.000 nodi per ricerca. Posizioni condivise e già approfondite
non generano ricerche duplicate. Il piano deriva da evidenza indicativa,
candidati speciali o distanza entro 1 punto da una soglia; non dalle etichette
di riferimento. Questo margine non cambia le soglie del classificatore.

La selezione `evidence-priority-v2` ordina le mosse già eleggibili: sacrifici
con prove pendenti, altri candidati Geniale/Grande, confronti mancanti o
discordanti, indipendenti, confini numerici. Spareggio cronologico. Ragione
e priorità sono registrate nel piano; limiti e formato delle prove rimangono
invariati. Una diversa priorità non promuove direttamente le categorie.

Misura di sviluppo del 15 ottobre, cinque partite/262 semimosse:
184 -> 188 corrispondenze fino a due richieste, 5 correzioni e 1 regressione;
Qxe5 Geniale raggiunta al primo clic. False speciali invariate. Due ipotesi
di conservazione dei confronti scartate: quality +2/-2, equal-depth nessun
cambiamento. [Report](../../agent-output/refinement-quality-priority-v2/report.md).
Le cinque partite riservate alla validazione precedente non sono rianalizzate;
questo risultato non è una nuova validazione indipendente.

La vista approfondita usa una sola evidenza per FEN anche nelle righe adiacenti.
L'archivio conserva dati iniziali e approfonditi; un approfondimento con profilo
incompatibile non viene proiettato sopra quello iniziale. Interruzioni ed errori
preservano i dati iniziali e le posizioni completate. Non parte un retry al
riavvio del worker. UI e archivio ricevono rispettivamente vista e dati canonici.

La verifica motore reale su personal-01 completa è in
`agent-output/optional-refinement-full-game-v1/`: 51 mosse, 12 selezionate,
17 FEN, 5 ricerche pregresse riusate e 12 nuove. Concordanza 32/51 -> 37/51,
cinque recuperi, nessuna regressione nel caso. È una partita già studiata e
un approfondimento selettivo, non precisione generale. Le cache iniziali e
il confronto complessivo 329/592 restano invariati.

`scripts/validate-optional-refinement.js --prepare` fissa il manifest e
`--run` consuma quel piano una sola volta; non è un comando da rilanciare
durante una verifica ordinaria. I raw sono già conservati. La matrice iniziale
si può verificare senza motore con `scripts/audit-special-classification.js`.

App e QA condividono la classificazione numerica. Il modello attivo usa
`sigmoid(cp/400)` senza taglio dei centipawn nella funzione
`calculateWinProbability`. `dropPct` è la perdita in punti percentuali dalla
prospettiva di chi muove, limitata inferiormente a zero.

Massimi correnti: Migliore 1, Ottima 3, Buona 5, Imprecisione 10, Errore 20;
oltre 20, Errore grave. Una mossa diversa dalla PV principale riceve al massimo
Ottima quando l'identità UCI è nota, salvo matto dato. La mossa giocata usa il
suo score nell'ultima iterazione MultiPV completa e valida quando disponibile.
Anche la migliore viene valutata nella stessa iterazione. Le coppie root legacy
devono avere score esatti, stessa profondità, radici non ambigue e PV legali.
Altrimenti si usa la posizione successiva, riportata alla prospettiva di chi
muove, dichiarando il confronto indicativo o discordante in `evaluationEvidence`.
App, archivi e QA condividono `reviewEvaluation.js` e `reviewMoves.js`.
Forzata significa unica mossa legale, conserva la categoria numerica ed entra
nel confronto esatto; resta fuori dalla scala ordinale. Libro è registrato
anche in `moveFacts.book`, separatamente da `numericalClassification`.

Libro viene assegnato dal repertorio locale finché la partita non devia;
la soglia Explorer di 15 partite serve solo a fermare le richieste quando
`analyzeGame` riceve un provider Explorer. L'app consulta l'Explorer nel pannello
Aperture, indipendentemente dall'analisi Stockfish. Le posizioni senza score
sufficienti sono Non valutabile.

Matto vincente/perdente corrisponde a probabilità 1/0. Il matto dato ha perdita
zero. Conservare lo stesso esito del matto non penalizza una variazione della
distanza; il confronto della distanza è diagnostico. La regola della PV
principale continua ad applicarsi alle categorie comuni.

Mossa mancata è attiva con una politica locale provvisoria: errore avversario
adiacente, nuova opportunità vincente confermata, occasione non mantenuta e
variante alternativa legalmente verificata. La politica richiede probabilità
vincente almeno 0,75 e usa 0,60 come limite non vincente. Non è il modello
dipendente dal rating di Chess.com.

La famiglia `opportunity-evidence-v2` aggiunge soltanto il caso di vantaggio
intermedio (indice prima dell'errore >0,60 e <0,75), occasione vincente >=0,75
e giocata <=0,60. Richiede entrambi i confronti completi/coerenti, errore
numerico avversario adiacente, variante legale diversa e accordo col child
entro la tolleranza già esistente. `missedOpportunity.js` resta congelato.
La v13 ammette anche una precedente stima indipendente: snapshot completo
validato, prima scelta invariata tra snapshot e ultima iterazione, child
legale della stessa FEN e accordo con il confronto completo corrente.
Questa estensione registra `opportunity-evidence-v3`; la famiglia con due
confronti completi conserva `opportunity-evidence-v2`.
Il tentativo separato di riequilibrio è stato respinto per un nuovo falso
positivo; l'ipotesi sul matto nello snapshot non ha dato cambiamenti.

Il percorso corrente aggiunge `missed-mate-v1` in `moveOpportunities.js`:
PV principale unbounded con matto positivo, variante completa legalmente
verificata fino al matto, giocata diversa e nessun matto vincente conservato
nelle evidenze della giocata. Serve uno score child finito senza mate/bound.
Questo criterio locale riconosce una rinuncia al matto anche mantenendo
vantaggio materiale e non richiede un nuovo errore avversario. Una PV legale
non è una prova contro tutte le difese: la valutazione di matto proviene dal
motore. I moduli congelati degli esperimenti continuano a usare la politica
originaria; il QA corrente e l'app condividono il nuovo percorso.
`stored-mating-continuation-v1` recupera inoltre il suffisso di matto dalla
variante root completa della precedente mossa avversaria. Richiede score
mate negativo coerente, lunghezza corretta, catena FEN e matto terminale,
stessa prima scelta corrente e giocata diversa dalla prima scelta. Protegge
le prove di matto conservato e non modifica le valutazioni numeriche.

Grande e Geniale sono disponibili nell'app con un'opzione sperimentale,
attiva inizialmente e disattivabile. Il percorso `specialClassification.js` confronta
alternative, difese e compensazione, con versione `counterfactual-v15`.
Le fasce fisse sono condivise in `specialPolicy.js`, senza cambi numerici.
La v12 riconosce come alternativa senza nuovo sacrificio anche una variante
vincente che conserva solo pezzi fermi già legalmente catturabili prima della
mossa. Il controllo considera inchiodature e apertura di linee. Gli archivi
v14 e precedenti sono riclassificati senza nuove ricerche.
Le accettazioni mancanti possono usare uno snapshot coerente già disponibile
della stessa FEN nell'analisi avversaria successiva. Una seconda stima concorde
della posizione dopo la cattura può confermare la compensazione quando la PV
termina durante uno scambio. Non sostituisce score invalidi o discordanti e non
scavalca le protezioni contro scambi ordinari, offerte persistenti e alternative
già vincenti. Live e archivio aggiornano le etichette senza nuove ricerche.
Include il recupero da posizione povera a circa equilibrata dopo un errore
numerico avversario, anche con una presa: servono ricerca indipendente concorde,
confronto coerente e alternative disponibili sotto la banda favorevole.
Le difese critiche circa equilibrate possono usare un confronto parziale
alla profondità della PV1, purché tutte le alternative disponibili restino
nella banda povera. Le ripetizioni legacy a profondità diverse sono selezionate
per profondità, senza scegliere lo score; copie ambigue nella stessa iterazione
restano invalide. La copertura e le righe scartate sono dichiarate.
Recupera inoltre il modello empirico congelato `grande-prudent-candidate-v1`
per la risposta Migliore/PV1 senza presa dopo errore numerico avversario:
la motivazione dichiara questo criterio senza affermare unicità tra alternative.
La v14 usa nel contesto i bestProbability del confronto review-v2 gia
ricalcolato, conservando il percorso legacy per ingressi senza review. Con
snapshot completo/coerente, la famiglia empirica richiede inoltre un evento
forzante verificabile: scacco, minaccia legale di matto in una mossa, nuova
cattura senza ricattura legale o di un pezzo di maggior valore. Il controllo
usa mosse legali, comprese inchiodature, e non promuove nessuna etichetta da solo.
La minaccia dopo un passaggio ipotetico del turno non prova un matto contro
tutte le difese. Prove legacy incomplete non vengono demosse da questo filtro;
i criteri separati di difesa e conversione restano operativi.
[Misura di sviluppo e limiti](../../agent-output/grande-decision-evidence-v1/report.md).
La v15 aggiunge `opportunity-episode-v1`: con catena esatta di tre mosse,
varianti legali e valutazioni concordi ricalcolate, mantiene Errore grave
quando il giocatore perde di nuovo un vantaggio già proprio, restituito
dall'errore avversario. Non si applica al matto perso, a una precedente
Mossa mancata o a un'occasione più forte oltre la tolleranza esistente.
Il lotto elimina una falsa Mossa mancata distinta nei due profili, senza
regressioni nei 1116 confronti di sviluppo. Soglie numeriche invariate.
`scripts/qa/trace-special-rules.mjs` traccia soltanto i rami effettivamente
eseguiti in Node nativo, verificando che le etichette rimangano identiche;
non è codice dell'app. I manifest dell'audit v14 e dello studio restano
storici: non rieseguire i comandi monouso sulla versione successiva.
[Audit delle precedenze, storia e controesempi](../../agent-output/rule-precedence-audit-v1/report.md).
Il comando facoltativo **Verifica le Grandi** usa il piano separato
`grande-evidence-v1` / `grande-verification-v1`, attivato con
`buildRefinementPlan(entries, { grandeOnly: true })`. Considera solo Grandi
empiriche non di matto e coppie non ancora completate a 1M. Usa la vista
riclassificata, comprese prove approfondite presenti da un solo lato della
mossa. Il piano normale `evidence-priority-v2`, i budget e il classificatore
v15 restano invariati. Il lotto canonico passa da 194 a 195/262 dopo questa
verifica aggiuntiva: Bc4 torna Migliore, zero regressioni, false Grandi 2 -> 1.
Sono due ricerche supplementari nel campione, non un confronto a costo uguale.
La promozione di priorità e l'estensione ai recuperi sono state respinte:
regredivano rispettivamente a6 e Qd3. I 16 pacchetti diagnostici del lotto
sono separati dagli archivi e hanno un replay offline verificato. Non
rieseguire i vecchi monouso dopo le modifiche alle sorgenti.
[Verifica delle Grandi e proposte respinte](../../agent-output/empirical-grande-verification-v1/report.md).
Il modello distingue anche riprese materiali e incassi di doppi attacchi
da una nuova decisione critica: senza un nuovo guadagno di opportunità,
mantiene la categoria numerica e spiega l'incertezza sulla novità.
Il QA corrente confronta le sue etichette includendo Grande/Geniale nel
denominatore esatto; la metrica ordinale conserva solo le categorie comuni.
Il criterio aggiunge anche il confronto causale dell'occasione vincente,
senza richiedere la categoria numerica Errore/Errore grave del predecessore.
Nuovo audit isolato, sulle sole otto partite consentite e senza motori:
`node scripts/audit-special-classification.js`.

Il worker conserva in `specialLines` le linee dell'ultima iterazione completa,
con radici distinte e bestmove coerente, mentre gli score numerici rimangono
quelli del percorso precedente. Le vecchie cache senza snapshot sono usate
solo quando le linee disponibili sono confrontabili. L'opzione sperimentale
cambia la presentazione delle etichette, senza avviare altre ricerche.

Gli esperimenti v2/v3/v4 e il valutatore congelato hanno risultati separati,
con le regole originarie. Il valutatore verifica le dipendenze elencate in
`agent-output/specials-frozen-candidate-v1.json`: una mancata corrispondenza
degli hash richiede diagnosi, senza aggiornare il lock per aggirare il controllo.

`cpToProbability` e `moverWinProb` restano API legacy con il loro contratto
limitato; non sono usate dal classificatore numerico corrente. La precisione
0–100 in `src/lib/accuracy.js` è un calcolo distinto, basato sulla formula
pubblica Lichess e sui punteggi delle posizioni effettive. Non va sostituita con
la curva della classificazione né con una stima Elo.

## Test senza nuove ricerche

### Confronto pubblico dei budget, 12 ottobre 2026

`scripts/benchmark-public-node-budgets.js` confronta le prime due partite
pubbliche del Mondiale 2024, fissate prima delle ricerche, a 200k e 1M nodi.
Protocollo e manifest monouso sono in `agent-output/node-budget-public-v1/`:
non rilanciare la raccolta e non cambiare il campione dopo averne visto gli
esiti. I due budget sono alternati per posizione; il profilo resta Stockfish
19 large-single WASM, MultiPV 5, un thread, Hash 16 MB, pulita per ricerca.

`scripts/report-public-node-budgets.js` verifica e riassume i dati offline,
senza motore: ricostruisce gli snapshot dai raw UCI, riconcilia la telemetria,
riproduce le classificazioni e confronta il primo lotto selettivo con la
ricerca completa. Scrive solo file nuovi; anche il report esistente non va
sovrascritto. Non leggere questo esperimento come precisione rispetto a
Chess.com: mancano etichette indipendenti. I tempi sono del WASM tramite Node
sul PC disponibile, non una prova nel browser o sul telefono. Non modifica
app, soglie, rating, cache precedenti o i 20 input congelati.

Da PowerShell nella radice del progetto:

```powershell
npm test -- --config scripts/qa-no-env-test.config.js --cache false
$researchTests = @(Get-ChildItem scripts -Filter '*.test.js' | ForEach-Object { $_.FullName })
node --test @researchTests
npm run build -- --config scripts/qa-no-env-build.config.js
```

Queste configurazioni non caricano `.env`. I test verificano funzioni pure,
worker/processi simulati, legalità e provenienza con dati di sviluppo.
`npm run test:browser` è separato e alcune prove avviano ricerche reali.

## QA storico a profondità fissa

`npm run qa:compare` legge le cache in `tests/fixtures/qa/analysis-cache/` e
scrive `agent-output/qa-compare.md`. Dati mancanti producono un report parziale
e codice di uscita 1. Non è un comando di sola lettura dei report.

Con `--personal` confronta le fixture personali presenti nella cartella.
Il gruppo di sviluppo è costituito dalle partite 1–6; 7–10 restano riservate.
La discovery di questa CLI non costituisce una whitelist dei soli ID 1–6:
non usarla quando sono presenti fixture riservate senza verificarne prima
l'ambito. Il relativo output è `agent-output/qa-compare-personal.md`.

L'opzione `--generate` avvia ricerche reali e scrive le cache legacy; non va
usata per rieseguire semplicemente i test o preservare le baseline.
La scelta del motore è `STOCKFISH_PATH`, poi l'eseguibile locale
`tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe` se disponibile,
altrimenti `stockfish` nel PATH. Stockfish 16 resta per il percorso storico;
non coincide con Stockfish 19 dell'app. Conservare distribuzione, licenza e
sorgenti. La CLI non installa o scarica un motore.

Le fixture storiche principali sono
`tests/fixtures/qa/game-1-chigorin-steinitz-1892.json` e
`game-2-saintamant-staunton-1843.json`: PGN e annotazioni `{ply, san, category}`
per ogni semimossa. Le etichette sospette sono in `suspect-labels.json`.
La partita sanity è separata dal campione di confronto.

Cache legacy schema 1: PGN esatto, versione motore, depth 12, MultiPV 5,
data di generazione e posizioni prima/dopo con SAN/UCI e score grezzi dalla
prospettiva del lato al tratto. Non contengono classificazioni. Ogni partita
usa `ucinewgame` e una cache nuova; non riusa la cache dell'app. La hash policy
del QA legacy non va descritta come quella delle ricerche correnti a nodi.

Il confronto esatto include Mossa mancata; la metrica entro una classe usa
solo le sei categorie comuni attese. Libro, categorie non supportate,
etichette sospette e score mancanti sono esclusi secondo la politica della
CLI. Le ragioni possono sovrapporsi; ciascuna riga viene esclusa dal
denominatore una sola volta. Con denominatore zero la percentuale è N/D.
Il QA legacy conserva categorie numeriche sulle righe Libro escluse;
gli adattatori dei report dell'app le riportano a Libro.

## Import e diagnostica storica

`node scripts/check-immediate-recovery-regression.js` verifica la policy
v7 sui cinque riferimenti nuovi, sulle otto cache precedenti e sul caso
Qxe5 con prova mirata. Non avvia ricerche. Risultati in
`agent-output/immediate-recovery-v7-regression-v1/`: profili iniziali
167/262 e 329/592 invariati, caso mirato separato. I vecchi manifest che
congelano il codice v6 richiedono quel codice, senza riscriverne gli hash.

La verifica mirata delle evidenze e in
`agent-output/targeted-special-evidence-v1/`: sette ricerche prefissate,
una accettazione a 200k e sei FEN a 1M, senza modifica dei criteri.
`node scripts/verify-targeted-specials.js --replay` verifica raw, snapshot,
PV e risultati offline. NON ripetere --run. La root forzata a ...Rxf7
non e una valutazione generale e resta separata dalle analisi complete.

`node scripts/diagnose-new-specials.js` esegue la diagnosi offline delle
speciali sulle cinque nuove e sulle otto cache precedenti. Una copia in
memoria disattiva solo la famiglia empirica Grande per misurare recuperi
e regressioni; l'app resta invariata. Report, guardie delle Mancate e
copertura delle accettazioni dei sacrifici in
`agent-output/special-diagnosis-v1/`. Nessuna ricerca motore: la variante
e retrospettiva e non e un criterio attivo o una validazione indipendente.

Il confronto delle cinque nuove partite confermate e in
`agent-output/new-references-200k-v1/`. `scripts/compare-new-references.js`
usa il profilo applicativo iniziale a 200k nodi e il percorso
`analyzeGame` + `reclassifyReviewedMoves`, senza Explorer o LLM.
`--prepare` fissa campione, hash e budget; `--run` e monouso e non deve
essere ripetuto. `node scripts/compare-new-references.js --replay`
ricostruisce raw, snapshot, telemetria e tutte le categorie senza avviare
il motore. Il report include Libro/Forzata, una misura separata senza
Libro atteso e tutte le discrepanze. Le etichette non entrano nel motore
o nelle regole. La metrica storica 329/592 resta separata.

`node scripts/study-refinement-stability.js` studia offline i cambi della
prima scelta nelle ultime tre profondità complete dei raw pubblici a 200k.
Confronta la priorità prima della mossa e prima/dopo con la baseline dello
studio precedente. Non avvia il motore o modifica l'app. Protocollo,
selezioni, segnali, tabelle e limiti in
`agent-output/refinement-stability-v1/`. La riproduzione aggiorna solo i
risultati di questo studio; concordanza a 1M non significa precisione.

`node scripts/study-refinement-priority.js` esegue lo studio offline delle
priorità sul campione pubblico `node-budget-public-v1`, senza avviare il
motore. Confronta sei strategie basate sui dati iniziali, sia con massimo
12 mosse sia con il tetto di FEN del lotto attuale. Verifica hash e replay,
conserva selezioni, segnali, classificazioni e costi stimati in
`agent-output/refinement-priority-v1/`. Il protocollo descrive le strategie
prima della simulazione. È uno studio esplorativo su un campione già noto,
non una misura di precisione. Non modifica l'app o i report precedenti;
rieseguirlo aggiorna soltanto i risultati di questo studio offline.

`scripts/qa-import-personal.js` valida PGN e liste, crea fixture annotate e
scrive `personal-manifest.json`; non interpreta NAG come etichette Game Review.
Legge tutte le cartelle numeriche direttamente in `Partite`. Il 14 ottobre
2026 le vecchie 7–10 non annotate sono state spostate in
`Partite/Archivio-non-analizzate/`; non sono piu scoperte dall'importer.
Il catalogo consultabile delle 11 personali e delle 2 storiche e in
`Partite/Confermate/`, che questo importer legacy non importa.
Le sorgenti originali non
vengono modificate, ma le fixture e il manifest vengono scritti.

`scripts/qa-diagnose-errors.js` avvia Stockfish reale a depth 18 sui soli
Errori discordanti delle fixture personali selezionate. Scrive
`agent-output/qa-error-diagnostic.json` e `.md`; al primo errore si ferma e
l'eventuale risultato parziale ha `completed: false`. La selezione delle
fixture personali richiede lo stesso controllo delle riserve. Il campione
non misura l'accuratezza dell'intero gruppo a depth 18.

Questi comandi e gli esperimenti motore sono distinti dai test unitari.
I risultati storici, inclusa la baseline in centipawn, rimangono intatti.
Le cache e i report già studiati non dimostrano una validazione indipendente
o una corrispondenza al 100% con Chess.com.


Verifica v19/v20: scripts/verify-grande-recovery-proof.mjs e
verify-discovered-check-preparation.mjs sono monouso con lock delle sorgenti.
Risultati in agent-output/grande-recovery-proof-v1/verification.json e
verification-v20.json. Il certificato refinement.grandeProof conserva solo
root/child,non etichette;vista raffinata applica la decisione separata e lascia
invariato il profilo numerico. Nuovo scopegrande-recovery-proof-v1,dopo quelli
empirici,sempre max12mosse/24FEN. Solo una childquery1M nelcampione.
La preparazione di scacchi di scoperta usa prove legali,non un modello WDL.


Verifica v21: scripts/verify-sacrifice-proof-flows.mjs e monouso; output
verification-v2.json in agent-output/all-sacrifice-proofs-v1. Controlla tutti
i profili e i flussi canonici senza cambiare score o viste iniziali.
La sola successiva aggiunta del contratto di richiesta e provata da
scripts/verify-sacrifice-request-contract.mjs: confronto sorgente esatto e
audit di tutti116packet,budget/MultiPVidentici alle richieste. Non riavviare
questi script o le raccolte storiche. I risultati hanno hash delle sorgenti.

Lo studio nativo WDL e separato in native-wdl-study-v1:538 righe cp+wdl
verificano il modello SF19 con intervalli di arrotondamento. Il candidato
esteso e respinto (Nc3 eQxf6 falseGrandi);nessunWDLintegrato nella v21.


V22: scripts/verify-native-winning-flows.mjs e monouso;output e hash in
agent-output/native-winning-integration-v1/verification.json. Riproduce
la baseline v21 con prove gia verificate,poi esegue criticalOnly fino a
nessuna nuova richiesta su18profili e5canonici. Nessuna nuova ricerca,156
packet riusati;numericfield e piano normale invariati. Nuovo scope
grande-winning-proof-v1 e refinement.nativeProof(root,child,alternative,
attempts),proiettato solo nella vista approfondita. Un job senza query
non avviaWorker. Non rieseguire vecchi verificatori su sorgenti nuove.

La raccolta remaining-special-depth-v1 e uno studio separato a5M su6casi
aperti e controlli prefissati;non cambia il budget1M o i criteri dell'app.

Revisione riutilizzabile: `npm run review:auto`. Preparazione e risultati sono
memorizzati per hash; nessuna nuova ricerca del motore. Uso, confronto dei
candidati e limiti: [REVIEW-AUTOMATION.md](REVIEW-AUTOMATION.md).

v24: prove aggiuntive elencate esplicitamente in review-evidence.json,
hash e replay verificati. Quattro child query1M certificano il confronto
del vantaggio relativo di axb4; nessuna soglia numerica calibrata. Report
immutabile in agent-output/native-edge-integration-v1/classifier-verification.json.
Gli script probe-edge-choice e probe-depth-stability sono monouso, gia
completati e rigiocati: non riavviarli su sorgenti modificate. Continuare
con review:auto. Report dell'instabilita separato in depth-stability-v1.
