# Ripartenza ChessProfessor — 8 ottobre 2026

## Obiettivo e stato

Progetto: `C:\Users\carlo\Desktop\ChessProfessor`, PowerShell. Obiettivo di Carlo: avvicinare le categorie Grande e Geniale a quelle di Chess.com, con Stockfish e motivazioni tattiche verificabili. Le categorie speciali rimangono sperimentali, non attivate nell'app. Carlo non può ancora fornire altre partite annotate; vuole proseguire con i dati disponibili. Non continuare a modificare regole soltanto per recuperare i pochi esempi noti.

Questo file è incluso nel nuovo commit di checkpoint richiesto da Carlo. Il checkpoint precedente è `d833c58`; prima ancora `7869014` aveva salvato Precisione, contesto analisi e rating delle partite. Il nuovo hash è riportato nella risposta finale della chat. Nessun push richiesto o eseguito.

## Vincoli persistenti

- Non leggere `.env`, Partite/7–10 o fixture/cache personal-07…10. Rimangono riservate, nessuna validazione su quelle partite autorizzata.
- Non modificare cache/baseline `tests/fixtures/qa/**`, file precedenti, soglie o `classification.js`. Finora tutti gli esperimenti usano nuovi script e nuovi output in `agent-output/`; nessuna modifica all'app.
- Nessuna nuova commit/push automatica: Carlo ha chiesto questo checkpoint. Per riprendere la ricerca basta continuare sugli script nuovi; non serve chiedere permesso per normali verifiche reversibili.
- Niente ricerche motore indiscriminate. Il prossimo audit di forchette non richiede nuovi go. Eventuali ricerche successive: manifest e budget preventivi, selezione dichiarata, raw UCI, hash prima/dopo, output separato e stop al cap.
- Non assegnare nuovi score ai dati mancanti, non dichiarare unicità usando solo MultiPV 5, non chiamare una PV legale prova contro tutte le difese. Nessuna attivazione delle nuove etichette prima di una validazione indipendente.
- Non usare subagenti senza richiesta esplicita o istruzione applicabile che lo richieda.

## Fonti consentite

Otto partite: `tests/fixtures/qa/personal-01.json`…`personal-06.json`, `game-1-chigorin-steinitz-1892.json`, `game-2-saintamant-staunton-1843.json`.

Cache corrispondenti: `tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/<id>.json`. Totale 592 ply, 24 riferimenti Grande e 3 Geniale. Sono dati già studiati, non un campione indipendente.

Configurazione originale: Stockfish 19.0.0 large-single, 200.000 nodi, MultiPV 5, Threads 1, Hash 16 MB; `hashPolicy` nella cache è esattamente `ucinewgame + Clear Hash before every search`; score dalla prospettiva del lato al tratto a ciascuna FEN. Entries con `ply`, `san`, `uci`, `fenBefore`, `fenAfter`, `engine`, `playedEngine`.

`src/data/openingPositions.json` è enorme su una riga: leggerlo come JSON negli script, non stamparlo con Get-Content. Rating dei personali circa 580–791; rating nelle storiche `?`, non inventarli.

## Risultati congelati

Valutatore unico: `scripts/specials-frozen-evaluate.js`, documentazione `agent-output/specials-frozen-evaluator-usage.md`, lock `agent-output/specials-frozen-candidate-v1.json` (20 dipendenze con SHA-256).

```powershell
node scripts/specials-frozen-evaluate.js --development
```

Riproduce 592 assegnazioni e motivi senza fitting o ricerche. Grande: TP 6, FP 0, FN 18. Geniale: TP 1, FP 0, FN 2. Nessuna sovrapposizione. Non significa precisione garantita: pochi positivi e scelte adattate ai dati già osservati.

Per nuove partite già analizzate:

```powershell
node scripts/specials-frozen-evaluate.js --fixture percorso/partita.json --cache percorso/analisi.json
```

Annotazioni parziali/assenti non diventano negativi. Eventuali supplementi richiedono `--evidence results.json --manifest manifest.json`; verifiche su configurazione, FEN/root/budget, score unbounded estratto da UCI e legalità PV. Le ricerche mancanti non vengono avviate automaticamente. Cambiare dipendenze congelate fa fallire la verifica: non aggiornare il lock per aggirare il controllo.

Grande prudente: Migliore/PV1, almeno due mosse legali, protezioni comuni; risposta a errore numerico precedente e nessuna presa. Modello `agent-output/grande-prudent-candidate-v1.json`, appreso lasciando fuori una partita personale a turno; stessa regola in tutti i sei fold. Copre solo una famiglia, non tutta Grande.

Geniale v4: Migliore/Ottima; perdita netta almeno 2 accettando un pezzo; posizione e tutte le accettazioni almeno 0,45; score mancanti → astensione; PV almeno 8 ply o matto prima; scambio immediato escluso; veto su alternativa vincente senza sacrificio (0,75). V3 richiede attribuzione nuova dell'offerta. V4 esclude anche offerte di pezzi stazionari presenti in alternative vincenti dalla medesima FEN, a pari depth, con lo stesso pezzo in presa. File `scripts/brilliant-same-offer-v4.js`, protocollo `agent-output/brilliant-same-offer-v4-protocol.md`.

Nxe5 personale 6/ply 11 è il solo vero Geniale riconosciuto. Rb3 storico/53 e Rxf5+/61 restano esclusi da alternative già vincenti. Non togliere il veto solo per recuperarli. Rac1 personale 4/55 era falso positivo dopo completamento delle prove: Rab1/Rfc1/Rfb1 vincono lasciando lo stesso alfiere e4 in presa; v4 lo esclude. Zero variazioni all'app.

30 nuove ricerche già ESEGUITE, non ripeterle: `agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json`, manifest `agent-output/brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json`. Totale 6.003.955 nodi, cap 7.500.000; 21 scambi, 4 offerte persistenti, 1 falso positivo Rac1 poi escluso. WDL registrato, non usato per cambiare etichette; modello di auto-gioco, non Expected Points umano.

## Ultimo lavoro: le 18 Grande mancate

Leggere `agent-output/grande-missed-families-2026-10-08T03-05-48-750Z/findings.md` e `results.json`. Script `scripts/grande-missed-families-audit.js`; protocollo `agent-output/grande-missed-families-v1-protocol.md`.

Tutte e 18 sono già Migliore/PV1: 5 prese dopo errore locale, 4 prese senza errore locale precedente, 9 mosse senza presa e senza errore locale precedente. Non è il motore che non le trova, è la regola troppo limitata.

Controfattuale in memoria eliminando SOLO il divieto di presa: TP 11, FP 8, FN 13 invece di TP 6, FP 0, FN 18. NON ADOTTATO. Tra gli errori anche Rxf5+ storico, annotato Geniale: non risolvere Geniale mancati promuovendoli automaticamente a Grande.

Tra 24 Grande e 164 negativi idonei: doppio attacco geometrico 5 positivi/5 negativi; scacco 6/9; risposta a scacco 2/17; ricattura 1/26. Geometria da sola non è una forchetta vincente e include pezzi inchiodati. Le prime prove sul distacco root/unicità e sulle feature di presa avevano già introdotto falsi positivi: non ripartire semplicemente da quelle regole.

## Punto preciso da cui cominciare

**Verificare le difese legali dei dieci candidati di doppio attacco in `agent-output/grande-fork-audit-candidates-v1.json`.** Selezione già fissata sull'intero campione senza etichette attese, esame NON ESEGUITO, nessuna ricerca motore prevista.

Dieci casi: P2 Bc4/19 e Rxf6+/43; P3 Nxd6+/19 e Qxe5+/29; P4 Nd6+/29; P6 d4/13, Nxf6+/35, Nxd7/37; Chigorin e6+/39; Saint-Amant Nxc3/80. Le etichette attese si consultano dopo i calcoli, non per decidere quali difese esplorare.

Prima fissare un nuovo protocollo: ripercorrere la mossa, enumerare tutte le risposte legali avversarie, distinguere cattura dell'attaccante, fuga/difesa di uno o entrambi i bersagli e possibilità di presa da parte dello stesso pezzo al turno successivo. Gestire scacchi, inchiodature e identità dei bersagli; un recupero materiale apparente può perdere l'attaccante nella ricattura. Usare le PV salvate per supporto, senza score inventati o FEN con lato al tratto cambiato artificialmente. Confrontare i cinque positivi e cinque negativi soltanto dopo l'estrazione. Non assegnare Grande solo perché la forchetta esiste: serve anche capire il valore rispetto alle alternative.

Obiettivo del prossimo passo: una diagnosi ripetibile che distingua doppio attacco efficace da apparente, non un'altra soglia adattata al piccolo campione. File nuovi fuori dalle cache; annotare limiti e costo della sola enumerazione legale. Se serve ricerca ulteriore, preparare un manifest separato prima di eseguire go.

## Precisione ed Elo: questione già chiusa

Precisione Lichess e classificatore usano curve diverse (0,00368208 contro 0,0025 per cp). P4 Nero Qb5: stessi score +459 prima e −661 dopo dal lato Nero, cali 76,36 e 59,83 pp per curve diverse; non bug di FEN/score. Precisione 50,64 e controfattuale 67,52 non sono una correzione da applicare. Nessuna stima Elo/fascia numerica con la calibrazione disponibile; non riaprire modificando accuracy.js per avvicinarsi a Chess.com.

## Verifiche

Ultime verifiche: 13 test delle feature e Grande; prima 27 test del valutatore unico/v4/Grande/percorsi. Prima di questo checkpoint sono stati eseguiti tutti i test di ricerca aggiunti dopo `d833c58`: **95 test superati, zero fallimenti**. Le suite nuove sono funzioni pure e usano solo input consentiti. Suite app/build/browser NON ESEGUITI perché app invariata.
