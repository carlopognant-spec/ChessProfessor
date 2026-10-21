# ChessProfessor: direzione e prompt operativi

Data di riferimento: 20 ottobre 2026.

Questo documento raccoglie le decisioni di prodotto espresse da Carlo e le traduce in incarichi eseguibili. La sua creazione non avvia le implementazioni. Quando Carlo chiede di riprendere questa roadmap, usare il protocollo seguente per scegliere il prossimo incarico, senza chiedergli di riscriverne i requisiti.

## Direzione concordata

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

La richiesta di eseguire una fase autorizza i suoi lotti ordinari, non tutte le fasi successive. Con «riprendi la roadmap» scegliere la prima fase incompleta con prerequisiti soddisfatti e applicare prima il protocollo di scelta del modello seguente. Non saltare avanti perché un'altra fase sembra più interessante.

## Scelta del modello e del ragionamento: regola concordata con Carlo

Carlo sceglie manualmente modello e impegno di ragionamento nell'interfaccia. Per tutta la roadmap, prima di ogni fase indicare il modello consigliato, il livello di ragionamento e il motivo in relazione al lavoro concreto. Non pretendere di aver cambiato le impostazioni al suo posto.

Se serve un cambio rispetto alla configurazione confermata, fermarsi prima del lavoro interessato e attendere che Carlo cambi le impostazioni e dica di continuare. La stessa regola vale all'interno di una fase se una sua parte richiede una configurazione diversa. Lasciare un punto di ripresa preciso con risultati già prodotti, lavoro pendente e configurazione richiesta. Non proseguire quel lavoro su un modello diverso tramite un agente secondario.

Alla fine di ogni fase indicare configurazione consigliata per la successiva e attendere l'avvio da parte di Carlo. Se la configurazione resta adeguata, non introdurre interruzioni aggiuntive fra i lotti ordinari della stessa fase, salvo suoi limiti espliciti. Non abbassare il ragionamento soltanto perché alcune operazioni sono meccaniche: valutare il lotto nel suo insieme.

Configurazioni inizialmente consigliate, da rivalutare al momento dell'esecuzione con le indicazioni ufficiali correnti e le opzioni disponibili:

| Fase | Modello consigliato | Ragionamento | Motivo |
| --- | --- | --- | --- |
| P01 | GPT-6 Astra | High | Confronto fra fonti, gerarchie, trasposizioni e definizione della completezza |
| P02 | GPT-6.1 Sol per l'implementazione; GPT-6 Astra per la progettazione scacchistica dei nuovi lotti | High | P02.2-SIC-03 verificato; prossimo progetto sulle alternative Chekhover precoci con Astra |
| P03 | GPT-6 Astra | High | Revisione strategica delle spiegazioni e gestione delle ambiguità |
| P04 | GPT-6.1 Sol | High | Interazioni, accessibilità e verifiche del comportamento nel browser |
| P05 | GPT-6 Astra per il curriculum; GPT-6.1 Sol per l'implementazione | High | Separare la progettazione didattica dalla realizzazione, fermandosi prima del cambio |
| P06 | GPT-6 Astra per criteri e validazione; GPT-6.1 Sol per l'implementazione | High | Definire obiettivi e alternative valide prima di costruire il flusso |
| P07 | GPT-6 Astra per fattibilità e architettura; GPT-6.1 Sol per l'integrazione | High | Verificare vincoli delle piattaforme prima dello sviluppo |
| P08 | GPT-6 Astra per criteri ed evidenze; GPT-6.1 Sol per l'implementazione | High | Distinguere difficoltà dimostrate, selezione dei puzzle e funzioni utente |
| P09 | GPT-6 Astra | High | Progettare misure e interpretare risultati senza conclusioni causali infondate |

Questa tabella è una raccomandazione operativa, non un confronto misurato dei modelli su ChessProfessor. Medium può essere proposto per lotti semplici e ben delimitati; Extra High o livelli superiori soltanto con un motivo concreto. Ogni cambio richiede comunque la pausa descritta sopra.

Punto di ripresa al 21 ottobre 2026: perimetro completo A confermato; P02.1 e lotti P02.2-SIC-01/02/03 completati con prove. [Risultati Chekhover](OPENING-CHEKHOVER-P022-RESULTS.md) e [rapporto attuale](data/opening-chekhover-p022-result.json): **286 corsi/esercizi**, 1.944 posizioni con ordine esatto, 201 solo per trasposizione e **10.177 assenti**, comprese otto Chekhover. P02.2-SIC-03 integra 7.c4, 10.Dd3 e 11.Dd2, con tre esercizi e ripresa corretta delle destinazioni contenute. Nove ricerche concluse; builder offline e build PASS; suite completa 735 PASS e un TODO preesistente; browser finale 39 PASS. Prossimo lavoro: **progettare le alternative Chekhover precoci con 4...a6 e dipendenze**, mantenendo anche 4...Cf6 e 4...Ad7 nel perimetro. Configurazione consigliata: **GPT-6 Astra / High**. Fermarsi prima di quel lavoro e attendere il cambio manuale e il «continua» di Carlo. P02 rimane in corso.

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
| P02 | In corso | P02.2-SIC-03 verificato; 286 corsi/esercizi e 10.177 posizioni assenti | Progettare le alternative Chekhover precoci con Astra / High dopo cambio manuale |
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

Formula di ripresa utilizzabile da Carlo:

> Riprendi `docs/ROADMAP-E-PROMPT-OPERATIVI.md`: verifica lo stato attuale, scegli il primo lotto eseguibile della prima fase incompleta e applica il relativo prompt con il protocollo comune. Non avviare fasi successive prima dei loro prerequisiti.
