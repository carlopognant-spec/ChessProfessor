# ChessProfessor: direzione e prompt operativi

Data di riferimento: 20 ottobre 2026.

**Pausa operativa richiesta da Carlo il 29 ottobre 2026.** Lo sviluppo delle
aperture è sospeso per contenere tempi e consumo di token. Questa disposizione
prevale sui successivi inviti a proseguire P02: nessun nuovo corso, commento,
esercizio, raccolta Stockfish o QA estesa fino a richiesta esplicita di ripresa.
Restano valide le decisioni didattiche, il perimetro A, i progetti e le prove.

- **Completato registrato:** SIC-07 R1 e SIC-08 R1 sono integrati; conteggio dei
  moduli verificato oggi senza motore: 309 corsi/esercizi, 48 percorsi siciliani.
  Ultima copertura documentata: 1.994 esatta, 203 solo trasposta e 10.125 assente.
  Risultati e QA sono collegati qui sotto;
  sono evidenze pregresse, non test rieseguiti alla sospensione.
- **Manca:** completare gli ingressi Ae3/Dc7 a3, f4, Dd2 e ...Cf6 anticipato,
  poi gli altri rami del perimetro A; copertura e commenti non sono completi.
- **Blocco di ripresa verificato:** `node scripts/openings-workflow.mjs brief`
  fallisce sul controllo congelato di `src/lib/openingBook.js`: atteso
  `7a0187…5513c`, attuale `4aa57e…58b72`, dopo l'aggiunta dei metadati del
  repertorio. Non ripristinare il file né aggiornare automaticamente gli hash.
  `OPENING-NOW.md` e `data/opening-pipeline/current.json` restano l'ultimo stato
  riuscito, non riconvalidato oggi. Il ledger indica ancora SIC-08 R1 attivo,
  mentre il suo registro QA documenta il completamento.
- **Problemi conservati:** i fallimenti originali SIC-07/SIC-08 e relative
  revisioni R1 restano nei rapporti; soglie 100 cp di perdita / 200 cp di swing
  invariate. Il registro SIC-07 mantiene un timeout dello strumento bozze e un
  TODO preesistente; non sono nuovi fallimenti osservati oggi.
- **Ripresa, solo su richiesta:** leggere questo blocco e i risultati R1;
  verificare e risolvere la discrepanza d'hash secondo la pipeline, preservando
  modifiche Git e prove congelate. Poi rilanciare `brief` e usare soltanto
  `inspect`/`sources`/`history` pertinenti. Riutilizzare le ricerche compatibili;
  pianificare nuove prove e QA solo per il nuovo lotto autorizzato.

**Ripresa rapida:** usare [OPENING-NOW.md](OPENING-NOW.md) e `node scripts/openings-workflow.mjs brief` per lo stato verificato. Consultare questa roadmap per decisioni di fase; per i singoli dati usare `inspect`, `sources` e `history` della [pipeline](OPENING-PIPELINE.md). I report storici completi restano conservati.

**Aggiornamento P02 del 28 ottobre 2026 — SIC-08 R1:** aggiunti sette percorsi Taimanov con Ad3 e sette esercizi, portando l'app a **309 corsi/esercizi e 48 percorsi siciliani**. Sono coperte esattamente tutte le 14 posizioni sorgente del sottoramo scelto: copertura attuale 1.994 esatte, 203 trasposte, 10.125 assenti. Il [progetto R1](OPENING-TAIMANOV-BD3-P022-R1-DESIGN.md) revisiona il solo seguito ...h5 dopo il fallimento iniziale e preserva le prove; il [risultato](OPENING-TAIMANOV-BD3-P022-R1-RESULTS.md) riporta i 17 confronti didattici e sette esercizi accettati, 30 risultati riusati e 12 nuove ricerche. I prossimi ingressi da completare nel gruppo Ae3/Dc7 sono a3, f4, Dd2 e ...Cf6 anticipato; gli altri rami Taimanov e gli ingressi Ac4/Ad3/f3 già rinviati restano nel perimetro A. P02 continua; i risultati precedenti qui sotto restano storici.

**Aggiornamento P02 del 27 ottobre 2026 — SIC-07 R1:** integrati nove percorsi Taimanov con Ae3/Ae2 e nove esercizi: **302 corsi/esercizi, 41 siciliani**. Copertura attuale 1.980 posizioni esatte, 203 solo trasposte e 10.139 assenti. Il [risultato R1](OPENING-TAIMANOV-BE2-P022-R1-RESULTS.md) conserva il superamento dei 18 confronti didattici e nove esercizi: 34 risultati riusati con provenienza e 11 nuove ricerche. Il primo seguito e il relativo esercizio sono stati revisionati dopo il fallimento originale, conservato senza modifiche. Il [progetto R1](OPENING-TAIMANOV-BE2-P022-R1-DESIGN.md) descrive la revisione e il budget. P02 resta aperta: i successivi rami Taimanov Qc7/Ae3, le 98 posizioni residue del candidato e gli ingressi Ac4/Ad3/f3 restano nel perimetro A. I paragrafi SIC-07 originali più sotto sono storia della progettazione, non lo stato operativo corrente.

Questo documento raccoglie le decisioni di prodotto espresse da Carlo e le traduce in incarichi eseguibili. La sua creazione non avvia le implementazioni. Quando Carlo chiede di riprendere questa roadmap, usare il protocollo seguente per scegliere il prossimo incarico, senza chiedergli di riscriverne i requisiti.

## Direzione concordata

Collaudo dell'ampliamento SIC-08 R1 del 28 ottobre: **144 test mirati, build no-env e 72/72 casi browser PASS**. [Registro e perimetro QA](data/opening-taimanov-bd3-p022-r1-qa.json). Sette nuovi corsi e sette esercizi utilizzabili, 523 file protetti preservati; proseguire con gli ingressi Taimanov a3/f4/Dd2/...Cf6 senza rilanciare i ledger completati.

Collaudo dell'ampliamento SIC-07 R1: **build no-env e 90/90 casi browser PASS**. Il [registro QA](data/opening-taimanov-be2-p022-r1-qa.json) distingue le verifiche dei contenuti dal timeout residuo del solo strumento di preparazione bozze. I nove percorsi e nove esercizi sono utilizzabili nell'app; il prossimo lotto P02 resta quello degli altri rami Taimanov Qc7/Ae3.

ChessProfessor deve aiutare a comprendere il gioco e migliorare attraverso aperture, spiegazioni, basi, esercizi e, successivamente, allenamento derivato dalle proprie partite.

Dopo un mese di utilizzo, l'obiettivo didattico è comprendere alcune aperture e i relativi piani, gestire i finali fondamentali e riconoscere meglio gli errori ricorrenti. Non è una promessa di aumento Elo o un risultato già misurato.

Ordine concordato:

1. Completare la copertura delle varianti dei corsi di apertura.
2. Completare e revisionare i commenti sulle mosse.
3. Migliorare organizzazione, grafica e interazioni dei corsi.
4. Aggiungere basi e mini lezioni, compresi i finali elementari.
5. Aggiungere puzzle su temi tattici e finali, anche senza scacco matto.
6. Collegare lo storico delle partite Chess.com e Lichess.
7. Individuare lacune e proporre lezioni e puzzle mirati, anche dagli errori personali.

Il ripasso programmato, gli account interni a ChessProfessor, la sincronizzazione tra dispositivi e un eventuale servizio pubblico sono decisioni future. Collegare un profilo scacchistico non implica automaticamente introdurre tutte queste funzioni.

## Stato iniziale verificato nei file del progetto

Questi numeri sono una fotografia iniziale, da ricontrollare quando si riprende il lavoro:

| Misura | Stato al 20 ottobre 2026 |
| --- | --- |
| Catalogo consultabile | 12.377 record, 500 codici ECO |
| Corsi | 280 percorsi in 37 famiglie |
| Esercizi sulle deviazioni nei corsi | 280, con controlli a orizzonte limitato |
| Semimosse con spiegazione posizionale | 8.930 |
| Coppie con nota scritta | 1.974 su 4.492; utilizzi, non testi unici |
| Percorsi interamente commentati per coppia | 58 su 280 |
| Famiglie interamente commentate per coppia | Londra, Nimzo-Indiana, Ovest-Indiana, Catalana, Bogo-Indiana |

Fonti locali:

- [Biblioteca e corsi](OPENING-LIBRARY.md).
- [Inventario attuale](OPENING-COVERAGE.md).
- [Copertura dei commenti](OPENING-COMMENTARY-COVERAGE.md).
- [Revisione delle lacune](OPENING-EXPANSION-AUDIT.md).
- [Proposta storica di espansione](OPENING-LIBRARY-EXPANSION.md), da interpretare alla luce dei lavori successivi.
- [README generale](../README.md) e aggiornamenti finali dei due handoff nella radice.

Non equiparare record del catalogo, varianti distinte, corsi, note ed esercizi. L'inventario attuale senza rami pendenti non dimostra che tutte le varianti richieste siano coperte. Le continuazioni costruite con il motore devono restare distinguibili dalla teoria documentata.

## Protocollo comune a ogni prompt

Leggere questo protocollo insieme al prompt selezionato: costituiscono un unico incarico.

1. Controllare istruzioni locali, stato Git, sorgenti e rapporti pertinenti. Non sovrascrivere lavoro esistente. Non aggiornare automaticamente il checkout durante una ricognizione.
2. Individuare l'ultimo risultato verificato. Non considerare conclusa una fase perché il suo file esiste o un precedente messaggio la dichiara completa.
3. Prima di modificare, dichiarare in poche righe obiettivo concreto, ambito del lotto e criterio di completamento. Un lotto deve produrre un risultato utilizzabile e verificabile; evitare riscritture generali.
4. Eseguire il lavoro già autorizzato fino alla verifica. Risolvere autonomamente le scelte ordinarie. Chiedere chiarimenti soltanto per ambiguità sostanziali, dipendenze mancanti o nuove decisioni di prodotto; continuare nel frattempo le attività indipendenti.
5. Non modificare classificatore, soglie, rating, riconoscimento Libro, Mossa mancata o politica Grande/Geniale per adattarli a corsi o puzzle. Eventuali cambiamenti richiedono un incarico distinto.
6. Non leggere `.env`, esporre credenziali o riutilizzare dati QA protetti come contenuti didattici. Rispettare manifest e studi congelati; non rilanciare esperimenti monouso. Nuove ricerche motore devono avere un piano esplicito con selezione, motore, budget, limiti e ripresa.
7. Verificare su fonti primarie le nuove informazioni esterne, le API, le licenze e le condizioni d'uso. Registrare fonte e data. Non dedurre supporto tecnico o diritto di redistribuzione dalla sola accessibilità di una pagina.
8. Eseguire controlli proporzionati: legalità e coerenza dei dati scacchistici; test del comportamento modificato; build per modifiche applicative; browser per interazioni e percorsi utente. Riportare separatamente ciò che è verificato, inferito o non collaudato. Non aggiungere test che controllino soltanto la presenza di frasi.
9. Non fare commit, push, deploy o operazioni su account esterni senza una richiesta che li autorizzi. Non introdurre servizi a pagamento o nuove infrastrutture come conseguenza implicita di questa roadmap.
10. Chiudere il lotto con risultato, file, controlli realmente eseguiti, limiti e prossimo passo esatto. Aggiornare il registro finale di questo documento solo con risultati effettivi. Rispettare qualsiasi limite esplicito di Carlo, compreso «un punto, poi STOP».

Ottimizzazione concordata il 27 ottobre: usare la [pipeline comune](OPENING-PIPELINE.md), evitando nuovi collector/builder/reporter copiati. Selezionare gruppi più ampi e coerenti con il backlog, con guadagno di copertura e dipendenze espliciti. Controllare tutti i nuovi contenuti; usare il selettore QA per distinguere dati, strumenti e modifiche runtime. Gli aggregatori rientrano nei soli dati esclusivamente quando l'annullamento degli import/inserimenti dichiarati ripristina esattamente gli hash precedenti. File sconosciuti, modifiche runtime, traguardi di famiglia e consegne richiedono la verifica completa. Conservare la matrice browser storica anche quando si esegue una selezione motivata. Riusare esiti soltanto con firme compatibili; le ricerche motore restano esplicite e limitate. Raggruppare la progettazione e applicare il routing autonomo in AGENTS.md quando serve una delega.

La richiesta di eseguire una fase autorizza i suoi lotti ordinari, non tutte le fasi successive. Con «riprendi la roadmap» scegliere la prima fase incompleta con prerequisiti soddisfatti e applicare prima il protocollo di scelta del modello seguente. Non saltare avanti perché un'altra fase sembra più interessante.

## Scelta del modello e del ragionamento: regola concordata con Carlo

Aggiornamento del 27 ottobre 2026: Carlo ha richiesto il routing autonomo definito in [AGENTS.md](../AGENTS.md) e nella [configurazione Codex](../.codex/config.toml). Sol Medium resta responsabile del lavoro; Luna High, Astra Medium e Astra High sono deleghe opzionali, selezionate per beneficio concreto, incertezza, rischio, dipendenze, complessità e verifiche. Il tempo richiesto da un'attività non basta per coinvolgere Astra.

Questa richiesta sostituisce le pause manuali e le assegnazioni per fase della procedura precedente. Usare soltanto modelli e deleghe realmente esposti dal client; la configurazione non cambia retroattivamente il modello di una conversazione aperta. Se la capacità necessaria manca, dichiarare il limite senza simulare il cambio.

Restano invariati il perimetro autorizzato, i prerequisiti delle fasi e i controlli scacchistici. Le decisioni di modello non autorizzano nuove fasi, ricerche motore o operazioni Git. I progetti e le prove congelate conservano le loro raccomandazioni storiche.

La tabella seguente conserva le raccomandazioni storiche, superate dal routing autonomo; non impone chiamate Astra o cambi manuali:

| Fase | Modello consigliato | Ragionamento | Motivo |
| --- | --- | --- | --- |
| P01 | GPT-6 Astra | High | Confronto fra fonti, gerarchie, trasposizioni e definizione della completezza |
| P02 | GPT-6.1 Sol per l'implementazione; GPT-6 Astra per la progettazione scacchistica dei nuovi lotti | High | SIC-07 progettato: implementare insieme nove percorsi Taimanov con la pipeline comune e Sol / High |
| P03 | GPT-6 Astra | High | Revisione strategica delle spiegazioni e gestione delle ambiguità |
| P04 | GPT-6.1 Sol | High | Interazioni, accessibilità e verifiche del comportamento nel browser |
| P05 | GPT-6 Astra per il curriculum; GPT-6.1 Sol per l'implementazione | High | Separare la progettazione didattica dalla realizzazione, fermandosi prima del cambio |
| P06 | GPT-6 Astra per criteri e validazione; GPT-6.1 Sol per l'implementazione | High | Definire obiettivi e alternative valide prima di costruire il flusso |
| P07 | GPT-6 Astra per fattibilità e architettura; GPT-6.1 Sol per l'integrazione | High | Verificare vincoli delle piattaforme prima dello sviluppo |
| P08 | GPT-6 Astra per criteri ed evidenze; GPT-6.1 Sol per l'implementazione | High | Distinguere difficoltà dimostrate, selezione dei puzzle e funzioni utente |
| P09 | GPT-6 Astra | High | Progettare misure e interpretare risultati senza conclusioni causali infondate |

La tabella non è un confronto misurato dei modelli su ChessProfessor. Il routing corrente usa i quattro livelli richiesti da Carlo e mantiene Astra High come eccezione.

Punto di ripresa al 27 ottobre 2026: **SIC-07 progettato e verificato offline**, pronto per l'implementazione con **Sol Medium e deleghe opzionali**, secondo il routing corrente in AGENTS.md. [Progetto e istruzioni](OPENING-TAIMANOV-BE2-P022-DESIGN.md), [piano](data/opening-taimanov-be2-p022-plan.json), [prova](data/opening-taimanov-be2-p022-design-verification.json), [registro attivo](data/opening-pipeline/lots.json). Nove percorsi Taimanov con Ae3/Ae2 e nove esercizi, 150 semimosse documentate e 14 didattiche, 216 file preservati, 341 repliche immediate e 90 transizioni verificate per entrambi i colori. Proiezione: 302 corsi/esercizi, 24 nuove posizioni esatte e una trasposta; 1.980 esatte, 203 solo trasposte, 10.139 assenti. Motore ancora da eseguire: 37 job, tetto 74 go/14.800.000 nodi richiesti. Browser pianificato: 82 nuovi casi e otto regressioni, conservando i 141 storici. L'applicazione resta a **293 corsi/esercizi**, 32 siciliani, 1.956 posizioni esatte, 202 solo trasposte e **10.164 assenti**: gli esiti applicativi precedenti sono quelli di [SIC-06](OPENING-PIPELINE-RESULTS.md), non validazione del nuovo lotto. Le 98 posizioni residue del candidato Taimanov e gli ingressi Ac4/Ad3/f3 restano nel perimetro A. P02 rimane in corso.

## P01 — Verificare la copertura reale delle varianti

**Prerequisito:** nessuno. **Tipo:** ricognizione e progettazione, senza cambiare corsi o generare ricerche motore.

> Ricostruisci la copertura delle aperture di ChessProfessor. L'obiettivo di Carlo è avere tutte le varianti previste prima di completare commenti e interfaccia. Non interpretare il numero di corsi attuale come prova di completezza e non ridurre unilateralmente la richiesta ai soli rami già censiti.
>
> Esamina catalogo, corsi, inventari e gerarchia dei bivi. Per ogni famiglia distingui sistemi, varianti, sottovarianti, sinonimi e trasposizioni. Confronta la copertura con fonti primarie verificabili e dichiara i limiti delle fonti: un catalogo di nomi non è l'intera teoria.
>
> Produci una matrice con identificatore, famiglia e ramo padre, nome, posizione o sequenza caratteristica, fonte, corso esistente, stato di copertura e motivazione. Distingui completo rispetto al perimetro, parziale, mancante, duplicato/alias e incerto. Non contare sinonimi come nuove lezioni.
>
> Proponi un perimetro finito e verificabile che renda operativo «tutte le varianti», elencando anche le esclusioni e i casi incerti. Non sostituirlo con un numero arbitrario di corsi o un limite uguale per famiglia. Ordina i rami mancanti per dipendenze didattiche e importanza della distinzione scacchistica; non attribuire frequenze senza dati.
>
> Consegna matrice, fonti, lacune e proposta di perimetro. Se il confine richiede una scelta sostanziale, presentala a Carlo con alternative concrete prima di dichiarare approvata la definizione di completezza. Non iniziare l'espansione in questa fase.

**Completamento:** ogni famiglia attuale è censita, le lacune sono tracciabili e il perimetro da usare in P02 è esplicito. La proposta resta proposta fino alla sua accettazione.

## P02 — Completare le varianti mancanti

**Prerequisito:** matrice P01 e perimetro accettato. **Tipo:** implementazione per famiglie o gruppi coerenti di rami.

> Completa il prossimo gruppo di varianti mancanti dalla matrice P01. Conserva corsi, identificatori, preferiti e progressi esistenti. Parti dalle dipendenze didattiche del ramo, senza introdurre varianti fittizie per aumentare i conteggi.
>
> Ogni variante deve avere ingresso e posizione caratteristica documentati, collocazione nell'albero, percorso realmente giocabile, piani per entrambi i colori e bivi coerenti. Se una famiglia accorpa aperture autonome, valuta la separazione mantenendo compatibilità dei riferimenti.
>
> Scegli una conclusione didattica significativa: non allungare tutte le linee fino allo stesso numero di mosse. Distingui teoria documentata e seguito didattico. Per l'eventuale nuovo lavoro motore definisci prima un piano limitato e riproducibile; riusa prove compatibili senza alterare archivi congelati.
>
> Inserisci i testi minimi specifici necessari a usare il corso; la revisione integrale dei commenti appartiene a P03. Non pubblicare segnaposto o promesse al posto dei contenuti. Mantieni la disponibilità degli esercizi prevista dai corsi e verifica quelli nuovi.
>
> Una mossa diversa dalla linea attesa non è automaticamente un errore. Se conduce a un ramo coperto, gestisci il cambio; altrimenti segnala il limite del corso. Verifica legalità, continuità SAN/FEN, trasposizioni, navigazione e funzionamento con entrambi i colori. Aggiorna la matrice con prove e lacune residue.

**Completamento:** tutti i rami del perimetro sono giocabili e verificati, senza duplicati conteggiati come copertura. Eventuali esclusioni successive devono essere esplicite e motivate, non silenziose.

## P03 — Completare e revisionare i commenti

**Prerequisito:** copertura P02 completata nel perimetro concordato. **Tipo:** contenuti e verifiche, una famiglia alla volta.

> Completa le spiegazioni delle mosse dei corsi, partendo dai passaggi privi di nota scritta. Ricalcola la copertura attuale: non assumere che i numeri della fotografia iniziale siano ancora validi.
>
> Per ogni decisione spiega cosa cambia con l'ultima mossa avversaria, quale problema affronta l'allievo, perché la scelta del corso è sensata, quale replica reale segue e quale piano ne deriva. Considera entrambi i colori. Evita testi generici intercambiabili fra posizioni.
>
> Non anticipare la soluzione nel testo mostrato prima della mossa; usa indizi progressivi facoltativi. Dopo la risposta, collega la propria mossa alla replica avversaria effettiva. Descrivi correttamente centro, case, colonne, cambi, tempi e sicurezza del re. Distingui pressione geometrica, cattura legale, minaccia e guadagno dimostrato.
>
> Non dichiarare una scelta unica, forzata o vincente senza prove adeguate. Non inventare trappole per ogni linea: se presenti, verifica ingresso, errore, risorsa e difese avversarie. Una continuazione cooperativa non è una confutazione.
>
> Lega le note alle sequenze revisionate e invalida il loro riuso se cambia la posizione o il contesto rilevante. Misura separatamente testi unici, utilizzi, spiegazioni posizionali e commenti revisionati. Mantieni leggibile il riepilogo del turno, con approfondimenti accessibili senza sovraccaricare la schermata.

**Completamento:** ogni passaggio del perimetro ha un commento specifico revisionato o un riuso giustificato nello stesso contesto. I controlli automatici sui fatti della scacchiera non sono presentati come certificazione editoriale completa.

## P04 — Migliorare l'esperienza dei corsi

**Prerequisito:** P03 completata. **Tipo:** valutazione dei flussi e implementazione incrementale.

> Esamina l'esperienza di una persona che sceglie un'apertura, inizia dalle basi, incontra un bivio, sbaglia, chiede un indizio e riprende una lezione. Individua gli ostacoli osservabili prima di proporre un cambiamento grafico.
>
> Migliora gerarchia famiglia/sistema/variante, leggibilità, orientamento nell'albero, feedback e gestione dei progressi. Conserva la partita aperta entrando e uscendo dalla biblioteca. Rendi distinguibili completamento nella sessione e progressi persistenti.
>
> Mantieni centrali scacchiera e decisione dell'allievo. Non mostrare soluzioni prima della risposta. Frequenza di una mossa, qualità della mossa e ordine didattico devono restare concetti distinti. Gestisci dati esterni mancanti senza bloccare il corso.
>
> Per ogni lotto definisci il percorso utente che migliora e verifica desktop, mobile, tastiera, feedback accessibili, entrambi i colori e assenza di regressioni su navigazione e salvataggi. Motiva le modifiche con effetti concreti sull'uso.

**Completamento:** i flussi previsti funzionano e i miglioramenti sono verificati nel browser. Nessuna nuova infrastruttura o identità grafica completa è implicita nell'incarico.

## P05 — Progettare e costruire le basi e le mini lezioni

**Prerequisito:** P04 completata. **Tipo:** prima curriculum, poi implementazione per moduli.

> Crea una sezione distinta per le basi con mini lezioni che insegnano un procedimento e lo fanno praticare. Parti da prerequisiti chiari e ordina gli argomenti per difficoltà.
>
> Includi almeno matto con re e donna contro re, matto con re e torre contro re, prevenzione dello stallo, ruolo del re nei finali, opposizione e promozione nei finali elementari di pedoni. Prevedi una progressione successiva per finali di torri e pezzi minori senza introdurre subito tutti i casi avanzati. Distingui il matto con due alfieri da un generico finale con alfieri; non presentare ogni combinazione di materiale come vittoria forzata.
>
> Ogni modulo deve avere obiettivo osservabile, spiegazione breve, esempio guidato, pratica con difesa avversaria significativa, indizi e criterio di riuscita. Insegna come arrivare al risultato, non soltanto a trovare la prossima mossa.
>
> Gestisci matto, stallo, posizioni patte e regole applicabili. Accetta più soluzioni valide quando esistono. Per le verifiche scegli strumenti adeguati, dichiarando limiti e dipendenze; non promettere tablebase offline se non sono integrate.

**Completamento:** il primo curriculum definito è fruibile e verificato; lezioni complete, esempi dimostrativi e moduli futuri sono distinguibili. Nessuna etichetta di corso completo per semplici schede introduttive.

## P06 — Aggiungere puzzle generali e di finale

**Prerequisito:** P05 completata. **Tipo:** catalogazione dei temi, modello degli esercizi, poi prima raccolta verificata.

> Progetta puzzle distinti dalle lezioni guidate, riusando quanto esiste dove appropriato. Consulta le fonti ufficiali Lichess per temi, struttura dei dati e licenza corrente. Non assumere che un tema presente su Lichess sia già supportato in ChessProfessor.
>
> Copri progressivamente deviazione, adescamento, forchetta, inchiodatura, infilata, attacco scoperto, eliminazione del difensore, difesa e matto. Includi finali in cui l'obiettivo è promuovere, vincere o pattare: lo scacco matto non è l'unico successo possibile.
>
> Definisci posizione iniziale, lato dell'allievo, obiettivo, varianti accettate, repliche avversarie, indizi, spiegazione, temi, provenienza e metodo di validazione. Non dichiarare unica una soluzione solo perché il file ne contiene una. Una difficoltà o un rating puzzle esterno non equivalgono automaticamente all'Elo dell'utente.
>
> Verifica le posizioni, l'obiettivo e le difese significative. Specifica cosa succede dopo risposte alternative, errore, abbandono, ripetizione e conclusione. Mantieni visibile la distinzione fra esercizi costruiti e posizioni tratte da partite reali.
>
> Consegna una prima raccolta con copertura dichiarata, modalità per tema, progressi locali e flusso completo testato. Nessun volume minimo inventato per chiamarla una raccolta completa di tutti i temi.

**Completamento:** è possibile risolvere esercizi verificati di tattica e finale, con feedback e gestione delle alternative. La copertura effettiva e i temi ancora assenti sono pubblicati.

## P07 — Collegare le partite Chess.com e Lichess

**Prerequisito:** P06 completata. **Tipo:** verifica delle possibilità delle piattaforme, poi integrazione.

> Verifica nelle documentazioni ufficiali correnti come ottenere le partite di un utente Chess.com e Lichess. Distingui consultazione di partite pubbliche tramite nome utente, autenticazione, associazione verificata di un account e disponibilità di dati privati. Non presentare il semplice inserimento di uno username come prova di proprietà dell'account.
>
> Documenta copertura storica, paginazione, limiti, condizioni d'uso, licenze, errori e vincoli del browser. Non promettere «tutte le partite» quando la piattaforma non lo garantisce. Non richiedere password delle piattaforme e non inserire segreti nel bundle.
>
> Proponi il percorso minimo che soddisfa l'importazione delle partite personali. Se occorrono backend, hosting, nuove autorizzazioni o costi, prepara architettura e alternativa concreta prima della decisione di prodotto. L'integrazione deve poter convivere con import PGN e archivio locale.
>
> Implementa per piattaforma importazione riprendibile e limitata, deduplicazione, attribuzione della fonte, data di aggiornamento, selezione di intervallo e gestione delle partite nuove. Identifica il colore dell'utente e distingui cadenze e varianti scacchistiche non supportate. Consenti interruzione e rimozione dei dati importati.
>
> Usa fixture e risposte simulate per errori, paginazione e rate limit; dichiara separatamente ogni prova live realmente eseguita. Non richiedere che l'intero archivio sia analizzato prima di mostrare un primo risultato.

**Completamento:** per ciascuna piattaforma supportata è chiaro quali partite si recuperano, con quali permessi e limiti; importazione e ripresa sono verificate. Le piattaforme non ancora integrate restano indicate come tali.

## P08 — Individuare lacune e creare allenamento personale

**Prerequisito:** P07 e disponibilità dei moduli P05/P06. **Tipo:** prima criteri e prove, poi funzioni utente.

> Collega le analisi delle partite dell'utente a un profilo di studio comprensibile. Distingui fase della partita, tema tattico o strategico, errore osservato, frequenza nel campione e solidità dell'evidenza. Una cattiva valutazione non identifica da sola il tema dell'errore.
>
> Definisci i criteri per apertura, mediogioco e finale senza affidarti soltanto al numero di mossa. Considera colore, cadenza, quantità di dati e opportunità effettivamente incontrate. Pochi casi non bastano per chiamare una difficoltà ricorrente; evita diagnosi certe con campioni insufficienti.
>
> Ogni suggerimento deve collegarsi a partite e posizioni verificabili, spiegare il motivo della proposta e rimandare a una lezione o a un esercizio disponibile. Mostra anche quando non ci sono dati sufficienti. Non trasformare la coincidenza con le etichette Chess.com in obiettivo del sistema.
>
> Per creare puzzle personali seleziona un momento con una risorsa didatticamente chiara. Verifica posizione prima della decisione, colore, alternative valide, risposta avversaria e obiettivo. Non trasformare automaticamente ogni Errore o Errore grave in un puzzle: escludi casi ambigui, instabili o privi di una spiegazione utile.
>
> Mantieni distinta la prova originale dalla verifica aggiuntiva. Gestisci analisi incomplete, annullamento, riuso dei risultati e budget limitati senza bloccare l'app. Evita lavoro motore duplicato. Conserva i collegamenti alla partita senza usare informazioni future come indizi anticipati.
>
> Consegna un primo ciclo completo: partita importata, difficoltà motivata, esercizio o lezione consigliati, pratica e aggiornamento dei risultati. Non chiamare «apprendimento dimostrato» il solo completamento degli esercizi.

**Completamento:** l'utente comprende una propria difficoltà sulla base di esempi e può esercitarla; suggerimenti e puzzle hanno prove tracciabili e limiti espliciti.

## P09 — Verificare il beneficio dopo un mese

**Prerequisito:** disponibilità del ciclo P08. **Tipo:** progettazione della valutazione, poi raccolta solo nel perimetro autorizzato.

> Definisci come valutare se l'esperienza raggiunge l'obiettivo didattico iniziale. Distingui uso dell'app, completamenti, comprensione e trasferimento a posizioni nuove.
>
> Prevedi prove iniziali e finali comparabili ma non identiche: riconoscere piani di apertura, eseguire finali fondamentali e risolvere temi allenati su posizioni non già memorizzate. Interpreta gli errori nelle partite successive considerando campione, avversari e cadenza.
>
> Proponi misure locali e minimali prima di analytics esterni. Non promettere un aumento Elo e non attribuire causalmente all'app ogni variazione. Chiedi una decisione solo quando servono nuovi servizi, raccolta di dati personali o partecipanti esterni.

**Completamento:** esiste un protocollo riproducibile con misure, limiti e condizioni di successo esplicite. I risultati restano «non misurati» fino alla raccolta effettiva.

## Registro di avanzamento e ripresa

Stati ammessi: da iniziare, in corso, completata con prove, in attesa di decisione, dipendenza mancante. Una fase parzialmente implementata resta in corso.

| Fase | Stato | Ultimo risultato | Prossima azione |
| --- | --- | --- | --- |
| P01 | Completata con prove | Audit e perimetro completo A confermati da Carlo | Usare la matrice come fotografia iniziale |
| P02 | In corso | SIC-07 progettato: nove corsi/esercizi, +25 posizioni previste; app ancora a 293 | Implementare SIC-07 con Sol / High dopo cambio manuale, usando la pipeline comune |
| P03 | Dipendenza mancante | Copertura iniziale: 1.974/4.492 coppie | Dopo P02, aggiornare copertura e completare per famiglia |
| P04 | Dipendenza mancante | Interfaccia corsi già presente | Dopo P03, verificare i flussi e scegliere il primo miglioramento |
| P05 | Dipendenza mancante | Nuovo curriculum non definito | Dopo P04, progettare il primo gruppo di mini lezioni |
| P06 | Dipendenza mancante | Esistono esercizi nei corsi; raccolta generale da costruire | Dopo P05, definire temi e modello puzzle |
| P07 | Dipendenza mancante | Collegamento profili non verificato in questa ricognizione | Dopo P06, verificare API e percorso minimo |
| P08 | Dipendenza mancante | Profilo delle lacune e puzzle personali da costruire | Dopo P07, definire evidenze e selezione dei casi |
| P09 | Dipendenza mancante | Beneficio dopo un mese non misurato | Definire protocollo quando il ciclo personale è disponibile |

Per ogni lotto aggiungere qui un breve aggiornamento con data, fase, ambito, file o report, comandi e risultati effettivi, limiti e prossimo passo. Non sostituire la fotografia iniziale con numeri privi di provenienza.

### 20 ottobre 2026 — P01, audit e proposta

- Configurazione concordata per l'avvio: GPT-6 Astra / High. Nessun cambio richiesto durante il lotto.
- [Rapporto](OPENING-SCOPE-AUDIT.md), [matrice delle 37 famiglie](OPENING-SCOPE-MATRIX.md) e [dati integrali](data/opening-scope-audit.json).
- Confrontati 12.377 record locali e 3.865 Lichess: 12.723 ordini e 12.322 posizioni distinte. Corsi: 1.919 posizioni raggiunte con un ordine delle fonti, 201 soltanto per trasposizione, 10.202 assenti. Posizioni e corsi non sono conteggi equivalenti.
- Documentate collisioni nella famiglia assegnata dal nome completo. 897 riferimenti da riesaminare; 655 gruppi con conflitti e 2.030 assegnazioni canoniche senza revisione del nome primario. Questi insiemi possono sovrapporsi e non sono conteggi di errori certificati.
- Proposto A: copertura dell'intero corpus fissato, con alias e trasposizioni raggruppati. Alternativa B: prima fermata alle ancore ECO, che non equivale a tutte le varianti. Nessun perimetro accettato automaticamente.
- Generatore e verifica offline: `node scripts/audit-opening-scope.mjs`, `node scripts/audit-opening-scope.mjs --check`. Verifica separata: `node scripts/verify-opening-scope-audit.mjs`; risultati e hash in [opening-scope-verification.json](data/opening-scope-verification.json).
- Nessuna ricerca motore o modifica applicativa. Prossimo lotto proposto: P02.1, correzione della tassonomia con preservazione di ID e progressi. Modello consigliato GPT-6.1 Sol, ragionamento High; fermarsi per la scelta di Carlo e il cambio di configurazione.

### 20 ottobre 2026 — P02.1, tassonomia della biblioteca

- Carlo ha confermato esplicitamente il perimetro completo A delle due fonti e autorizzato la prosecuzione. Configurazione concordata per questo lotto: GPT-6.1 Sol / High.
- Correzione applicata durante la preparazione del catalogo: nome primario prima delle sottovarianti, sistemi espliciti sotto genitori generici, ripieghi ECO e nomi incerti tracciati nel rapporto.
- 807 associazioni di navigazione cambiate; tutti i 37 percorsi di base e i 280 corsi restano collegati con gli stessi ID. Le 497 assegnazioni da revisionare restano nel perimetro. Nessun nuovo corso aggiunto in questo lotto.
- Catalogo sorgente invariato byte per byte per preservare gli hash delle prove. Il generatore mantiene esplicitamente la politica sorgente originale; la biblioteca usa il risolutore corrente. Preferiti e ripassi preesistenti verificati anche nel browser dopo ricaricamento.
- [Rapporto e ripresa](OPENING-TAXONOMY.md), [cambiamenti e casi da revisionare](data/opening-taxonomy.json), [baseline degli invarianti](data/opening-taxonomy-baseline.json).
- Suite completa no-env: 74 file, 715 PASS e 1 TODO preesistente; build PASS, 129 moduli; browser mirato 3 PASS. Rapporto offline e otto hash protetti verificati. Nessun motore, commit o push.
- P02.1 completato; P02 rimane in corso. Per P02.2 serve progettare i nuovi rami (prima tranche Siciliana: Najdorf con Ag5 e Chekhover), le fonti e le eventuali verifiche motore prima di implementare. Consigliato GPT-6 Astra / High: fermarsi qui per il cambio concordato e attendere Carlo. Nessuna nuova conferma necessaria sul perimetro A.

### 20 ottobre 2026 — P02.2-SIC-01, progettazione della prima tranche Siciliana

- Configurazione concordata: GPT-6 Astra / High. Progetto concluso, implementazione ancora da iniziare. L'interruzione della sessione non ha perso gli artefatti; verifica finale ripresa dai file salvati.
- [Progetto con prompt operativo](OPENING-SICILIAN-P022-DESIGN.md), [specifica strutturata](data/opening-sicilian-p022-plan.json), [rapporto di verifica](data/opening-sicilian-p022-design-verification.json).
- Definiti due ID nuovi, ingressi ai bivi 4.Dxd4 e 6.Ag5, fonti esatte, 42 semimosse documentate senza seguito generato, piani per entrambi i colori e 13 note minime. I 280 corsi esistenti restano invariati.
- Due esercizi costruiti selezionati: dopo 7...Cxe4 nella Najdorf e 5.Ac4 nella Chekhover. Verificate legalità, cattura della donna e tutte le 65 repliche immediate; saldo materiale minimo rispettivamente 5 e 6. Controllo motore ancora pendente: quattro job, massimo otto `go` comprese le conferme, 1,6 milioni di nodi richiesti.
- Comandi realmente eseguiti: `node scripts/verify-opening-sicilian-design.mjs` e `node scripts/verify-opening-sicilian-design.mjs --check`, entrambi PASS. Controllati hash delle fonti e dei file protetti, prefissi, quattro sessioni tramite la logica di pratica e copertura prevista. `git diff --check` PASS. Nessun test browser o build necessario per il solo progetto.
- Proiezione, non copertura già pubblicata: 20 posizioni nuove, 6 con ancore ECO; assenti complessive da 10.202 a 10.182. Nei due sottoalberi rimangono 145 e 13 posizioni assenti, tutte elencate nel rapporto. Il perimetro A resta interamente valido e P02 resta in corso.
- Prossima azione: GPT-6.1 Sol / High per implementare questo lotto e verificarlo. Fermarsi qui per il cambio manuale richiesto da Carlo. Alla fine dell'implementazione, tornare alla progettazione con GPT-6 Astra / High; primo punto locale proposto, Chekhover Zaitsev con 5...Dd7 e dipendenze.
- Nessuna ricerca motore, modifica applicativa aggiuntiva, commit o push durante questo lotto di progettazione.

### 20 ottobre 2026 — P02.2-SIC-01, implementazione verificata

- Configurazione concordata: GPT-6.1 Sol / High. Aggiunti Najdorf con 6.Ag5 e Chekhover con ...Ad7: due percorsi, 42 semimosse documentate e 13 note specifiche. Disponibili entrambi i colori, bivi e due esercizi costruiti.
- [Rapporto di esito e ripresa](OPENING-SICILIAN-P022-RESULTS.md), [verifica attuale del corpus](data/opening-sicilian-p022-result.json), [prove degli esercizi](data/opening-sicilian-p022-practical-verification.json).
- Quattro ricerche eseguite, senza conferme: 800.000 nodi richiesti, 800.533 riportati. Bestmove previsti confermati; variazioni di controllo 550 e 609 cp. Enumerate le 65 repliche immediate, con saldi minimi 5 e 6. [Manifest e trascrizioni](data/opening-sicilian-p022-engine/manifest.json) separati dalle prove storiche.
- Verificati i 280 corsi originali come sottoinsieme identico, gli hash protetti e i byte dei dati/prove storici. Totali effettivi 282 corsi e 282 esercizi; 21 corsi siciliani. Copertura: 1.939 posizioni con almeno un ordine esatto raggiunto, 201 solo per trasposizione, 10.182 assenti. Aggiunte 20 posizioni, 6 con ancore ECO; residui locali 145 e 13, conservati nel rapporto.
- `node scripts/build-opening-sicilian-content.mjs --check` e `node scripts/report-opening-sicilian-result.mjs --check`: PASS, offline. `npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false`: 76 file, 724 PASS e 1 TODO preesistente, 148,16 s. Aggiornate aspettative esatte su conteggi e conclusioni documentate, preservando i vincoli storici.
- `npm.cmd run build -- --config scripts/qa-no-env-build.config.js`: PASS, 132 moduli, 5,00 s; rimane l'avviso sui chunk grandi. `npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"`: 13 PASS, 2,2 minuti. Verificati quattro completamenti, ricaricamento e dati preesistenti, due esercizi senza soluzione anticipata, bivi in entrambe le direzioni, checkpoint del Nero e alternativa Zaitsev non valutata come errore scacchistico.
- Aggiornati inventario e copertura dei commenti: 8.972 semimosse spiegate, 1.994 utilizzi di note scritte su 4.513 coppie, 59 percorsi interamente commentati per coppia. Questi conteggi non dichiarano completa P03.
- Lotto completato; P02 rimane in corso. Prossimo punto: progettazione Chekhover Zaitsev con 5...Dd7 e dipendenze, GPT-6 Astra / High. Fermarsi qui per il cambio manuale richiesto da Carlo. Nessun commit, push o deploy.

### 20 ottobre 2026 — P02.2-SIC-02, progetto Chekhover Zaitsev

- Configurazione concordata: GPT-6 Astra / High. Ripresa dal lotto precedente; i suoi due verificatori offline continuano a passare. Nessuna modifica applicativa in questo progetto.
- [Progetto e prompt di implementazione](OPENING-ZAITSEV-P022-DESIGN.md), [specifica fissata](data/opening-zaitsev-p022-plan.json), [prova offline e baseline dei 282 corsi](data/opening-zaitsev-p022-design-verification.json).
- Un nuovo ID previsto: `sicilian:chekhover-zaitsev`, bivio nero all’indice 9 contro ...Ad7. Dieci semimosse di fonte fino a ...Dd7; due semimosse didattiche scelte, Axc6 Dxc6, soggette a verifica prima della pubblicazione. Nessuna attribuzione del seguito al catalogo.
- Esercizio costruito dopo 6.Ad3: ...Cxd4 è l’unica cattura immediata della donna; 36 repliche legali enumerate, saldo materiale minimo +6. Controesempi verificati per distinguere un cambio delle donne dalla loro perdita; e4 resta difeso dalla donna d4 al termine del percorso. Valutazioni motore ancora pendenti.
- Piano fissato: cinque job primari, 200.000 nodi ciascuno, al massimo dieci go e 2.000.000 nodi richiesti incluse conferme. La baseline dell’esercizio riusa il controllo della scelta bianca. Nessuna ricerca eseguita; nessun aumento automatico di budget o ricerca di nuovi candidati.
- `node scripts/verify-opening-zaitsev-design.mjs` e `--check`: PASS; fonti, hash, due sessioni offline e bivi controllati. `git diff --check`: PASS. Build e browser del nuovo percorso pendenti all’implementazione.
- Proiezione: 283 corsi/esercizi, una posizione nuova senza ancore ECO aggiuntive, 10.181 posizioni assenti complessive e 12 su 22 nel sottoalbero Chekhover. I valori pubblicati restano 282 e 10.182; P02 non è completo.
- Prossima azione: GPT-6.1 Sol / High per implementazione, prove motore limitate e test. Fermarsi per il cambio manuale richiesto da Carlo. Dopo l’implementazione, progettare insieme i residui Chekhover con ...Ad7 (7.c4, 10.Dd3/11.Dd2) con GPT-6 Astra / High. Nessun commit, push o deploy.

### 21 ottobre 2026 — P02.2-SIC-02, implementazione Chekhover Zaitsev

- Configurazione concordata: GPT-6.1 Sol / High. Verificatore del progetto e builder del lotto precedente PASS prima delle modifiche; manifest nuovo preparato offline e poi eseguito secondo il piano.
- Integrati `sicilian:chekhover-zaitsev` ed esercizio costruito dopo 6.Ad3. Dieci semimosse documentate e due didattiche scritte, con confine della fonte visibile; due note nuove legate alla sequenza completa. Preservati i 282 corsi e i 282 esercizi precedenti e tutti gli hash protetti.
- [Risultato e ripresa](OPENING-ZAITSEV-P022-RESULTS.md), [rapporto attuale](data/opening-zaitsev-p022-result.json), [prove](data/opening-zaitsev-p022-practical-verification.json), [manifest](data/opening-zaitsev-p022-engine/manifest.json). Esattamente cinque ricerche, zero conferme: 1.000.000 nodi richiesti, 1.000.864 riportati. Differenze di controllo 74 e -20 cp; perdita di controllo 74 e 0 contro il massimo 100. Esercizio: variazione 640 cp, bestmove ...Cxd4, 36 repliche immediate e minimo materiale +6.
- Corretti accenti e apostrofi persi nei testi del piano archiviato tramite un [testo UTF-8 separato](data/opening-zaitsev-p022-editorial.json). Il builder controlla la corrispondenza della versione ASCII: nessuna modifica al piano, alle mosse, alle FEN o agli input motore congelati.
- Copertura effettiva: 1.940 posizioni con almeno un ordine esatto, 201 solo per trasposizione e 10.181 assenti; una posizione aggiunta e zero nuove ancore ECO. Sottoalbero Chekhover: 12 posizioni assenti su 22. Totali: 283 corsi/esercizi, 22 siciliani; 8.984 semimosse spiegate, 1.999 coppie scritte su 4.519 e 59 percorsi interamente commentati per coppia.
- Builder nuovo e precedente in `--check`, rapporto attuale e `git diff --check`: PASS. Test mirati: 6 file, 74 PASS. Suite completa finale: 77 file, 729 PASS e 1 TODO preesistente, 198,33 s. Build finale dopo la correzione dei testi: PASS, 134 moduli, 13,52 s. Browser finale: 20 PASS, 3,0 minuti; sei completamenti con persistenza, tre esercizi, sei cambi di ramo, quattro checkpoint e alternativa legale non coperta. Il primo browser ha segnalato due aspettative da distinguere per la provenienza mista, ora corrette; i controlli storici restano attivi.
- Lotto completato; P02 rimane in corso. Prossima azione: GPT-6 Astra / High per progettare congiuntamente i residui Chekhover con ...Ad7 (7.c4, 10.Dd3/11.Dd2), usando il rapporto attuale e conservando i dodici residui. Fermarsi prima di quel lavoro per il cambio manuale richiesto da Carlo. Nessun commit, push o deploy.

### 21 ottobre 2026 — P02.2-SIC-03, progetto Chekhover dopo ...Ad7

- Progettati tre percorsi: 7.c4 fino a 8...g6, 10.Dd3 con seguito didattico ...O-O, 11.Dd2 con seguito didattico ...Dc7. Totale 56 semimosse documentate, due scelte didattiche e zero generate. [Progetto e prompt operativo](OPENING-CHEKHOVER-P022-DESIGN.md), [specifica](data/opening-chekhover-p022-plan.json), [prova offline](data/opening-chekhover-p022-design-verification.json).
- Fonti fissate: quattro record B53 del catalogo, nessun ulteriore discendente nei prefissi selezionati, nessun riferimento Lichess per queste posizioni e zero nuove ancore ECO. Baseline 283 corsi/esercizi e 70 file dei lotti precedenti congelati, oltre agli hash protetti P02.1.
- Esercizi costruiti: dopo 7...Axe4, 11.Db5 e 11...Aa4; risposte Dxe4, ...Axb5 e Cxa4. Controllate tutte le 89 repliche immediate: 24/39/26, saldi minimi 2/6/2. Prove motore pendenti: nove job, massimo diciotto `go` e 3,6 milioni di nodi richiesti incluse conferme/fallimenti. Un controllo viene riusato come baseline, senza ricerche duplicate.
- Individuata una dipendenza di navigazione: Dd2 prosegue l'intero corso ...Ad7, non crea un bivio alla semimossa 20. Nel ritorno al corso breve l'indice attuale coincide con la fine; progettato un ripasso esplicito dall'inizio senza credito automatico. Simulazione offline per entrambi i colori; modifica applicativa e browser ancora pendenti.
- Builder Siciliana e Zaitsev, rapporto Zaitsev corrente e nuovo verificatore offline in scrittura/`--check`: PASS. `git diff --check`: PASS. Nessuna ricerca motore o modifica applicativa in questo progetto; suite, build e browser nuovi non eseguiti.
- Proiezione verificata sull'intero corpus: 286 corsi/esercizi, 1.944 posizioni con ordine esatto, 201 solo per trasposizione e 10.177 assenti. Chekhover: otto residui su 22. I numeri pubblicati restano 283 e 10.181; P02 non è completo.
- Prossima azione: GPT-6.1 Sol / High per il prompt di implementazione. Fermarsi per il cambio manuale richiesto da Carlo. Dopo l'implementazione, GPT-6 Astra / High per progettare le alternative precoci 4...a6 e dipendenze; 4...Cf6 e 4...Ad7 restano tracciate. Nessun commit, push o deploy.

### 21 ottobre 2026 — P02.2-SIC-03, implementazione Chekhover dopo ...Ad7

- Integrati tre percorsi e tre esercizi in moduli separati, preservando i 283 corsi/esercizi precedenti, i 70 file del piano e gli hash protetti. 56 semimosse documentate, due scelte didattiche, zero generate e quattro note nuove legate alle sequenze complete. [Esiti e ripresa](OPENING-CHEKHOVER-P022-RESULTS.md), [rapporto corrente](data/opening-chekhover-p022-result.json), [prove](data/opening-chekhover-p022-practical-verification.json), [manifest](data/opening-chekhover-p022-engine/manifest.json).
- Eseguite nove ricerche primarie, zero conferme: 1.800.000 nodi richiesti e 1.800.661 riportati. Controlli delle continuazioni: perdite 3 cp per ...O-O e 28 cp per ...Dc7, entro 100. Esercizi: variazioni 486/624/491 cp; tutte le 89 repliche immediate e saldi minimi 2/6/2 verificati. Riutilizzato il controllo Dd2 come baseline; nessuna ricerca storica rilanciata.
- Corretto il ritorno a un percorso interamente contenuto: ripasso esplicito dall'inizio senza completamento dal solo prefisso. Checkpoint distinti per bivi reali, prosecuzione e ripasso. Entrambi i colori conservano mosse attive e normale persistenza; storage e vecchi ID invariati.
- Copertura effettiva: 286 corsi/esercizi, 25 siciliani, quattro posizioni nuove, 1.944 con ordine esatto, 201 solo per trasposizione e 10.177 assenti; zero nuove ancore ECO. Restano otto posizioni Chekhover. Commenti: 9.042 semimosse spiegate, 2.012 utilizzi scritti su 4.548 coppie, 59 corsi interamente commentati per coppia.
- Controlli offline dei tre builder e rapporto corrente PASS; test mirati 8 file/84 PASS; suite completa 78 file/735 PASS e un TODO preesistente, 161,37 s; build PASS, 136 moduli, 12,17 s; browser finale 39 PASS, 2,7 minuti. Primo browser: timeout iniziale del catalogo e due aspettative nuove sui completamenti alla fine del bivio Dd3, corrette senza modifiche applicative né aumento dei timeout. La ripetizione completa passa tutti i casi e mantiene i venti controlli precedenti. Collegamenti, UTF-8, lock residui e `git diff --check` verificati.
- Lotto completato; P02 resta in corso. Prossimo lavoro: progettare le alternative Chekhover precoci con 4...a6 e dipendenze usando il rapporto corrente, mantenendo 4...Cf6 e 4...Ad7 tra i residui. Configurazione consigliata **GPT-6 Astra / High**: fermarsi prima della progettazione e attendere il cambio manuale di Carlo. Nessun commit, push o deploy.

### 21 ottobre 2026 — P02.2-SIC-04, progetto Chekhover con 4...a6

- Progettati due percorsi: `sicilian:chekhover-a6-be3` (nove semimosse documentate, una didattica ...Cf6) e `sicilian:chekhover-a6-c4` (dodici semimosse interamente documentate). [Progetto e prompt operativo](OPENING-CHEKHOVER-A6-P022-DESIGN.md), [specifica](data/opening-chekhover-a6-p022-plan.json), [prova offline](data/opening-chekhover-a6-p022-design-verification.json).
- Cinque record/posizioni B53 coprono l’intero sottoalbero fissato 4...a6; il nodo comune si conta una volta. Nessun nuovo riferimento Lichess o ancora ECO. Preservati 108 file congelati, hash protetti e baseline semantiche dei 286 corsi/esercizi. L’applicazione non è stata modificata.
- Verificati sei collegamenti diretti tra corsi, ciascuno nei due colori: bivio nero all’indice 7 e bianco all’indice 8. Il flusso esistente è sufficiente; mantenere il controllo delle destinazioni contenute. Al bivio nero il rappresentante di ...a6 è Ae3, con c4 disponibile al bivio successivo o tramite selezione del corso. Nessuna prova browser eseguita in questo progetto.
- Esercizi costruiti: dopo 5...Db6 risponde Dxb6, dopo 6.Cc3 risponde ...Cxd4. Tutte le 54 repliche immediate enumerate (21/33), saldi minimi 9/6; nessuna pretesa di frequenza, unicità globale o vittoria dimostrata. Piano motore fissato: cinque job, 200.000 nodi ciascuno, massimo dieci `go` e 2.000.000 nodi richiesti incluse conferme/fallimenti. Baseline Ae3 riutilizzata; zero ricerche eseguite.
- Tre builder precedenti e reporter corrente in `--check`, nuovo verificatore in scrittura/`--check`, `git diff --check`: PASS. Proiezione verificata su tutte le 12.322 posizioni: 288 corsi/esercizi, 27 siciliani, 1.949 posizioni esatte, 201 solo trasposte e 10.172 assenti; tre residui Chekhover. I totali pubblicati restano 286 e 10.177. Build, suite e browser nuovi pendenti all’implementazione.
- Prossima azione: **GPT-6.1 Sol / High** per implementazione, prove limitate e verifiche; fermarsi per il cambio manuale di Carlo. Dopo l’implementazione, **GPT-6 Astra / High** per progettare i tre residui 4...Cf6, 4...Cf6 5.Cc3 e 4...Ad7. Nessun commit, push o deploy in questo progetto.

### 21 ottobre 2026 — P02.2-SIC-04, implementazione Chekhover con 4...a6

- Integrati `sicilian:chekhover-a6-be3` e `sicilian:chekhover-a6-c4`, con due esercizi in moduli separati. 21 semimosse documentate e una didattica scritta ...Cf6, nessuna generata; cinque voci editoriali, quattro testi distinti, legate alla sequenza completa. [Esiti e ripresa](OPENING-CHEKHOVER-A6-P022-RESULTS.md), [rapporto corrente](data/opening-chekhover-a6-p022-result.json), [prove](data/opening-chekhover-a6-p022-practical-verification.json), [manifest](data/opening-chekhover-a6-p022-engine/manifest.json).
- Eseguite cinque ricerche primarie e zero conferme: 1.000.000 nodi richiesti e 1.000.653 riportati. Perdita della continuazione ...Cf6 14 cp, entro 100; esercizi 762/617 cp, 54 repliche immediate e saldi minimi 9/6. Il controllo Ae3 è riusato come baseline. Tutti i gate sono passati prima della generazione; nessun collector storico rilanciato.
- Bivi ...Cc6/...a6 e Ae3/c4 verificati nelle due direzioni e nei due colori, con il flusso già esistente. La scelta ...a6 propone il rappresentante Ae3; c4 resta disponibile al bivio seguente o selezionando il percorso. Checkpoint senza credito prematuro e ripresa con mosse attive; Dd3 nel ramo c4 resta un’alternativa legale non coperta. Nessuna modifica necessaria alla navigazione dell’app.
- Copertura effettiva: 288 corsi/esercizi, 27 siciliani, cinque posizioni nuove, 1.949 esatte, 201 solo trasposte e 10.172 assenti; zero nuove ancore ECO e tre residui Chekhover su 22. Preservati 286 corsi/esercizi precedenti, 108 file congelati e hash protetti. Commenti: 9.064 semimosse spiegate, 2.023 utilizzi scritti su 4.559 coppie, 61 percorsi interamente commentati per coppia.
- Quattro builder offline e reporter corrente PASS; test mirati 9 file/100 PASS, 67,06 s; suite completa 79 file/742 PASS e un TODO preesistente, 149,37 s; build PASS, 138 moduli, 11,55 s; browser finale 62 PASS, 4,2 minuti, mantenendo i 39 casi precedenti. Il primo avvio browser si è fermato alla raccolta per titoli duplicati nei nuovi checkpoint, corretti includendo il corso origine; nessun caso eseguito prima della correzione, nessun cambiamento applicativo o aumento dei timeout. UTF-8, collegamenti locali, assenza di lock e `git diff --check` verificati.
- Lotto completato; P02 resta in corso. Prossimo lavoro: progettare insieme i tre residui Chekhover 4...Cf6, 4...Cf6 5.Cc3 e 4...Ad7, mantenendo il resto del corpus A. Configurazione **GPT-6 Astra / High**: fermarsi prima del progetto e attendere il cambio manuale di Carlo. Nessun commit, push o deploy.

### 21 ottobre 2026 — P02.2-SIC-05, progetto Chekhover con 4...Cf6 e 4...Ad7

- Progettati `sicilian:chekhover-nf6` e `sicilian:chekhover-early-bd7`, due esercizi e quattro voci editoriali: 17 semimosse documentate e tre continuazioni didattiche. [Progetto e prompt operativo](OPENING-CHEKHOVER-EARLY-P022-DESIGN.md), [specifica](data/opening-chekhover-early-p022-plan.json), [prova offline](data/opening-chekhover-early-p022-design-verification.json). Coperti in proiezione tutti i tre residui del sottoalbero Chekhover fissato.
- I due ordini arrivano alla stessa FEN finale, ma hanno prefisso comune di sette semimosse: conservare corsi e progressi distinti senza completamento derivato dalla trasposizione. Verificati offline quattro figli del bivio, sei transizioni dirette nei due colori e l'alternativa legale Ae3 non coperta. Previsti 25 nuovi scenari browser, 87 complessivi; nessuna modifica alla navigazione prevista senza un difetto concreto.
- Esercizi costruiti: dopo 5...Af5 risponde exf5; dopo 5.Da4 risponde ...Axa4 lungo la diagonale libera d7-a4. Enumerate tutte le 60 repliche immediate (27/33), saldi minimi 3/9. Nessuna vittoria completa o frequenza pratica dedotta dal solo materiale immediato.
- Preparati otto job motore, con tre confronti separati per le tre mosse didattiche e due controlli riusati come baseline degli esercizi. 200.000 nodi per richiesta; massimo 16 `go` e 3.200.000 nodi richiesti incluse conferme/fallimenti. Zero ricerche eseguite. Il builder nuovo dovrà gestire `authoredMoves` come array e pubblicare insieme i due corsi soltanto dopo tutti i gate.
- Quattro builder precedenti e reporter SIC-04 in `--check`, nuovo verificatore in scrittura/`--check`, controlli UTF-8, collegamenti locali e `git diff --check`: PASS. Preservati 134 file congelati, hash protetti e baseline dei 288 corsi/esercizi. Proiezione sull'intero corpus: 290 corsi/esercizi, 29 siciliani, 1.952 posizioni esatte, 201 solo trasposte, 10.169 assenti e zero nuove ancore ECO. Chekhover: 22 su 22 con ordine esatto nel corpus fissato; non equivale alla completezza teorica. L'app resta a 288 corsi; suite, build, browser e motore del nuovo lotto pendenti all'implementazione.
- Prossima azione: **GPT-6.1 Sol / High** per implementare SIC-05; fermarsi per il cambio manuale richiesto da Carlo. Dopo l'implementazione, **GPT-6 Astra / High** per progettare ...g6/...a6/...e5 dopo 4.Cxd4 e relativi discendenti, confrontandoli con il Dragone esistente: quattro posizioni attualmente assenti, soltanto identificate in questo progetto. Nessun commit, push o deploy.

### 21 ottobre 2026 — P02.2-SIC-05, implementazione Chekhover con 4...Cf6 e 4...Ad7

- Integrati `sicilian:chekhover-nf6` e `sicilian:chekhover-early-bd7` con due esercizi in moduli separati. 17 semimosse documentate e tre didattiche scritte, nessuna generata; quattro note specifiche vincolate alle sequenze complete. [Esiti e ripresa](OPENING-CHEKHOVER-EARLY-P022-RESULTS.md), [rapporto corrente](data/opening-chekhover-early-p022-result.json), [prove](data/opening-chekhover-early-p022-practical-verification.json) e [manifest](data/opening-chekhover-early-p022-engine/manifest.json).
- Otto ricerche primarie, zero conferme: 1.600.000 nodi richiesti e 1.601.397 riportati. Tre confronti indipendenti, perdite 46/19/24 cp entro 100; variazioni degli esercizi 561/719 cp, 60 repliche immediate e saldi minimi 3/9. Due controlli riusati come baseline. Il nuovo builder gestisce l'array delle tre mosse didattiche senza saltare verifiche; tutti i gate passano prima della generazione.
- Ordini distinti, stessa FEN finale: ritorno al prefisso 7, avvio esplicito e mosse residue con entrambi i colori. Il bivio offre ...Cc6/...a6/...Cf6/...Ad7, mantenendo i rappresentanti precedenti. Ae3 dopo ...Cf6 resta legale e non coperta. Nessuna modifica necessaria alla navigazione dell'applicazione; UI e persistenza confermate dagli 87 scenari browser.
- Copertura effettiva: 290 corsi/esercizi, 29 siciliani, tre posizioni nuove, 1.952 esatte, 201 solo trasposte e 10.169 assenti; zero nuove ancore ECO. Tutte le 22 posizioni Chekhover fissate hanno almeno un ordine esatto, senza affermare completezza teorica. Preservati 288 corsi/esercizi, 134 file congelati e hash protetti. Commenti: 9.084 semimosse spiegate, 2.033 utilizzi scritti su 4.569 coppie, 63 corsi interamente commentati per coppia.
- Cinque builder e reporter corrente in `--check` PASS. Primo gruppo mirato: 106 PASS e un conteggio siciliano rimasto a 27; corretto a 29, scope 7 PASS. Suite completa successiva: 80 file, 749 PASS e un TODO preesistente, 233,35 s, inclusi tutti i 107 test mirati. Build PASS, 140 moduli, 6,26 s, con il precedente avviso sulle dimensioni dei chunk. Browser 87 PASS, 9,0 minuti, in una sola esecuzione: conservati i 62 casi precedenti e aggiunti i 25 previsti, comprese quattro riprese fra i due ordini con la stessa FEN finale senza credito anticipato. Nessuna modifica applicativa o aumento dei timeout. UTF-8, collegamenti, assenza di lock e `git diff --check` verificati.
- Lotto completato. Prossimo progetto: alternative precoci ...g6/...a6/...e5 dopo 4.Cxd4 e discendenti, con confronto con il Dragone già presente. Configurazione **GPT-6 Astra / High**: fermarsi prima della progettazione per il cambio manuale di Carlo. P02 resta in corso. Nessun commit, push o deploy.

### 27 ottobre 2026 — P02.2-SIC-06, progetto delle alternative precoci dopo 4.Cxd4

- Progettati tre corsi: `sicilian:early-g6-bc4`, interamente documentato fino a 7...Cc6; `sicilian:early-a6`, con coppia didattica Cc3/Cf6; `sicilian:early-e5`, con Cb3/Cf6. Totali: 30 semimosse documentate, quattro didattiche, otto note specifiche e tre esercizi. [Progetto e prompt operativo](OPENING-SICILIAN-EARLY-P022-DESIGN.md), [piano](data/opening-sicilian-early-p022-plan.json), [prova offline](data/opening-sicilian-early-p022-design-verification.json).
- Distinti il nome sorgente Accelerated Dragon e l'ordine concreto con d6 già giocata. Conservati nomi/codici originali nella provenienza; confronto geometrico con Dragone e Dragone accelerato esistenti. Il nuovo ordine a6 raggiunge la posizione iniziale Najdorf nei primi quattro campi FEN, con diverso contatore delle semimosse: conservare FEN complete e checkpoint al prefisso 7, senza credito alla destinazione.
- Verificate 16 transizioni dirette nei due colori. Per ...Cf6 il rappresentante resta il corso principale `sicilian`; Dragone e Najdorf si scelgono esplicitamente. Previsti 54 nuovi scenari browser, 141 complessivi, mantenendo gli 87 precedenti. La mossa c4 dopo ...g6 è legale e non coperta.
- Esercizi costruiti: ...Ah3/gxh3, Ab5+/...axb5, Ac4/...exd4. Tutte le 113 repliche immediate enumerate, 31/40/42, con saldi minimi 2/2/2. Preparati dodici job motore, quattro confronti delle mosse didattiche e tre baseline, di cui due condivise. 200.000 nodi per richiesta; massimo 24 `go` e 4.800.000 nodi richiesti incluse conferme/fallimenti. Zero ricerche eseguite.
- Cinque builder precedenti e reporter SIC-05 in `--check`, nuovo verificatore in scrittura/`--check`, UTF-8, collegamenti e `git diff --check`: PASS. Preservati 169 file congelati, hash protetti e baseline dei 290 corsi/esercizi. Proiezione sull'intero corpus: 293 corsi/esercizi, 32 siciliani, 1.956 posizioni esatte, 202 solo trasposte e 10.164 assenti, zero nuove ancore ECO. Quattro nuove posizioni esatte e una posizione intermedia raggiunta solo per trasposizione. L'applicazione resta a 290 corsi; build, suite e browser del lotto pendenti all'implementazione.
- Prossima azione: **GPT-6.1 Sol / High** per implementazione, raccolta limitata e verifiche; fermarsi per il cambio manuale di Carlo. Dopo l'implementazione, **GPT-6 Astra / High** per progettare le due posizioni 5.Ac4 e 5.Ad3 dopo 4...Cf6, soltanto identificate qui. Nessun commit, push o deploy.

### 27 ottobre 2026 — Pipeline comune e applicazione a SIC-06

- Realizzati [comandi comuni e guida](OPENING-PIPELINE.md): verifica, preparazione, raccolta esplicita, generazione, rapporti, inventari, stato/ripresa, backlog, QA proporzionata e controllo documenti. Registro [lots.json](data/opening-pipeline/lots.json). Gli script specifici storici e i loro input restano immutati; SIC-05 è ricostruito identico nei tre artefatti, senza nuove ricerche.
- Selettore dei gruppi aggiornato dopo SIC-06: 2.977 gruppi candidati, con posizioni condivise contate una sola volta. I primi dodici gruppi interessano 1.102 posizioni assenti distinte; sono proposte, non contenuti completati o dodici corsi sufficienti. Nella Siciliana il primo candidato ha 122 posizioni, dopo il prefisso Taimanov con Cc3. [Backlog](data/opening-pipeline/backlog.json). Priorità quantitativa da integrare con revisione didattica.
- Checkpoint firmati e log dei comandi; cache QA riusata soltanto con gli stessi input. Prova reale di ripresa: cinque esiti riutilizzati in 1,43 s senza rilanciare test o motore. Il primo controllo mirato ha completato tutti i passaggi in circa 30 s; tempi riferiti agli strumenti, non alla validazione completa di nuove interazioni. Gli input dei test e del browser sono ricontrollati a fine comando; i soli aggiornamenti narrativi non invalidano le prove applicative.
- Applicata la pipeline a SIC-06: dodici primarie e zero conferme, 2.400.000 nodi richiesti e 2.401.653 riportati. Confronti Cc3/Cf6/Cb3/Cf6: perdite 13/0/35/4 cp; esercizi 437/416/366 cp, tutte le 113 repliche e saldi minimi 2/2/2. Generati e integrati tre percorsi/esercizi, preservando i 290 precedenti e i 169 file. [Rapporto automatico](OPENING-SICILIAN-EARLY-P022-RESULTS.md).
- Totali effettivi: 293 corsi/esercizi, 32 siciliani, 1.956 posizioni esatte, 202 solo trasposte e 10.164 assenti; quattro nuove esatte e una trasposta. Commenti: 9.118 semimosse spiegate, 2.050 coppie scritte su 4.586, 66 corsi interamente commentati per coppia. Nessuna modifica al codice di navigazione: annullando soltanto i nuovi import/inserimenti, gli aggregatori tornano agli hash del progetto.
- Verifiche iniziali degli strumenti PASS; regressione intermedia su 81 file, 763 PASS e un TODO preesistente. Dopo integrazione, 114 test dei contenuti PASS; un timeout nel nuovo test offline di confronto artefatti sotto carico parallelo, portato a un limite locale di 30 s: ripetizione pipeline 15 PASS. Build PASS, 142 moduli, 4,93 s. Verifica finale: 82 file, 771 PASS e un TODO preesistente, 249,47 s, firma degli input invariata. Browser: 61 PASS e un timeout iniziale del catalogo in 6,9 minuti; verificati gli input, il solo caso mancante passa con --last-failed in 29,9 s, senza cambi a codice o timeout. Totale 62 casi distinti PASS. [Esiti completi](OPENING-PIPELINE-RESULTS.md). Tutti i 141 scenari restano disponibili; selezione di 62 (54 nuovi e otto regressioni), motivata nel registro. Nessun aumento dei timeout browser o dei budget motore.
- Pipeline e SIC-06 completati. Prossimo progetto con **GPT-6 Astra / High** per scegliere e progettare un gruppo coerente più ampio dal backlog: il candidato Taimanov da 122 posizioni va esaminato per dipendenze e dimensione. Ac4/Ad3 del vecchio puntatore rimangono nel perimetro A. Fermarsi per il cambio manuale richiesto da Carlo; nessun commit, push o deploy.

### 27 ottobre 2026 — P02.2-SIC-07, progetto Taimanov con Ae3 e Ae2

- Esaminato il candidato da 122 posizioni assenti: 138 record complessivi, 126 posizioni e 58 ordini terminali. Scelto un sottoramo completo e coerente con 20 posizioni e nove ordini terminali, dopo Dc7/Ae3/a6/Ae2. Gli altri 98 residui dopo il lotto sono elencati nella prova; il perimetro A resta invariato. [Progetto](OPENING-TAIMANOV-BE2-P022-DESIGN.md).
- Preparati nove percorsi e nove esercizi nel formato comune: 150 semimosse documentate, 14 didattiche e 46 note di coppia. Cinque coppie aggiunte garantiscono almeno una mossa attiva per entrambi i colori dai checkpoint; quattro risposte aggiunte completano cambi, arrocco o difesa della torre. Nessuna modifica applicativa e nessuna ricerca motore.
- PASS: baseline dei 293 corsi/esercizi, 216 hash protetti, 341 repliche legali immediate, 90 transizioni dirette con entrambi i colori, 27 fatti geometrici. Verificata anche la convergenza dei due ordini a3/b5 e arrocco/b5: stessa posizione, contatori FEN differenti, progressi separati. [Prova riproducibile](data/opening-taimanov-be2-p022-design-verification.json).
- Preflight e [proiezione comune](data/opening-pipeline/sic-07-projection.json) PASS: 302 corsi/esercizi previsti, 24 nuove posizioni esatte e una solo trasposta, incluse quattro ancore ECO. Copertura prevista 1.980 esatte, 203 trasposte e 10.139 assenti; attuale invariata a 1.956/202/10.164. Nessun risultato di apprendimento inferito da queste misure.
- Piano motore: 37 job primari, baseline condivise esplicitamente entro ciascun corso; massimo 74 go e 14.800.000 nodi richiesti. Soglie invariate; tutte le 14 mosse didattiche e i nove esercizi devono superare i gate. Zero job eseguiti. Matrice browser progettata: 82 casi nuovi, 90 selezionati con otto regressioni, 223 disponibili dopo integrazione. Nessun caso nuovo eseguito in questa fase.
- Prossimo lavoro **GPT-6.1 Sol / High**: implementare e collaudare insieme tutti e nove i percorsi con gli strumenti comuni; il registro attivo è `sic-07`. Fermarsi per il cambio manuale richiesto da Carlo. Nessun commit, push o deploy.

Formula di ripresa utilizzabile da Carlo:

> Riprendi con `node scripts/openings-workflow.mjs brief` e la skill `opening-workflow`: usa il lotto e la prossima azione verificati. Leggi soltanto progetto, corso o errore pertinente; consulta questa roadmap per decisioni di fase. Mantieni i gate, i file congelati e il cambio manuale di modello concordato. Non avviare fasi successive prima dei loro prerequisiti.
