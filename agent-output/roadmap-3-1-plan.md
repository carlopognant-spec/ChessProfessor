# 3.1 — Piano delle categorie speciali, da approvare

Solo progettazione e lettura. Nessun classificatore, soglia, modello, repertorio o cache modificato. Fonte ufficiale consultata il 7 ottobre 2026: [Chess.com, How are moves classified?](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc), articolo datato 9 febbraio 2026.

## DOCUMENTATO

Il modello Expected Points dipende da valutazione e rating. Le categorie speciali hanno ulteriori criteri:

- **Mossa mancata:** non sfruttare un errore avversario per ottenere una posizione vincente, spesso restando pari o peggio.
- **Grande:** mossa decisiva, per esempio passaggio da perso a pari, da pari a vinto oppure unica buona mossa.
- **Geniale:** sacrificio valido di un pezzo, con mossa migliore o quasi; posizione successiva non cattiva e vittoria non già assicurata senza trovare quella mossa.

L’articolo descrive maggiore generosità per giocatori meno esperti. Non fornisce algoritmo completo, coefficienti del rating, margini di unicità, criteri operativi del sacrificio o budget motore. Queste definizioni non autorizzano a presentare la sigmoid locale come il modello Chess.com. Le soglie pubblicate riguardano Expected Points, non una validazione delle nostre soglie. Nessuna formula dipendente dal rating verrà inventata.

## Stato reale dell’app

`missedOpportunity.js` implementa già Mossa mancata. Grande/Geniale sono soltanto nomi nel classificatore e nel resoconto, senza regola che li assegni; QA li tratta come non implementati. Non serve ripartire da zero per Mossa mancata.

Regola Mossa mancata esistente, **NOSTRA APPROSSIMAZIONE**:

1. Predecessore immediato, FEN adiacenti, turni opposti, categoria comune avversaria Errore/Errore grave; predecessore Libro escluso.
2. Probabilità locale prima dell’errore, dal lato corrente, al massimo 0,60.
3. Opportunità almeno 0,75, confermata sia dalla valutazione precedente invertita sia dal punteggio corrente; dopo la giocata al massimo 0,60.
4. Giocata legale e alternativa PV1 diversa e legalmente ripercorribile fino a otto ply: minimo due, salvo PV di un ply che dà realmente matto.
5. Libro, Non valutabile e matto dato protetti. Conserva categoria comune, perdita e motivo di accettazione/rifiuto; alternativa e contesto già mostrati in UI.

Sono vincoli locali prudenziali, non requisiti numerici ufficiali. La vecchia misura 1/10 riguarda le cache Stockfish 16/depth 12 e non è un risultato nuovo del motore adottato. In questo punto non ricalcolate metriche su cache large.

## Dati e limiti

Conteggi letti direttamente dalle annotazioni delle sole fixture P1-P6: **10 Mossa mancata, 14 Grande, 1 Geniale**, su 399 ply; confermato il ruolo development nel manifest. Le fixture non registrano una configurazione completa di Game Review. Non leggere Partite/7-10 per scegliere regole o esempi; saranno validazione soltanto dopo aver fissato la politica e ricevuto autorizzazione.

Campione insufficiente a validare le categorie speciali: una sola Geniale non consente di misurare generalizzazione. Correlazione fra mosse della stessa partita, scelta delle regole sullo sviluppo e differenze di motore/revisione impediscono di trattare una concordanza come prova d’equivalenza. Anche zero falsi positivi su P1-P6 non garantisce precisione fuori campione.

Rumore di riferimento già misurato C7: mediana 16 cp, P90 104 cp. Non è una tolleranza universale né un intervallo di confidenza per large/200k. Il punteggio identico in ripetizioni deterministiche non prova che il punteggio sia corretto. Non usare questi numeri per introdurre una nuova soglia nascosta.

## NOSTRA APPROSSIMAZIONE proposta: protocollo comune

Priorità alla precisione: se la verifica manca o è ambigua, conservare la categoria comune e non assegnare la categoria speciale. Non chiamare “verificato” un semplice salto di cp o un’etichetta attesa della fixture.

- Stockfish 19 large-single, 200.000 nodi, MultiPV 5, Threads 1, Hash 16: configurazione corrente invariata. Soglie 1/3/5/10/20, sigmoid, Libro, Mossa mancata e cap invariati. Nessun selettore o Approfondisci.
- Guardie comuni: SAN/UCI legale, FEN coerenti, punteggi finiti non bound, metadati compatibili e dati sufficienti. Non mescolare linee a depth reali diverse come se fossero una graduatoria completa. Mancanze, errori, stallo, categoria sconosciuta e posizioni già terminali richiedono astensione. Matto realmente dato mantiene la gestione corrente.
- Per le nuove promozioni speciali, requisito iniziale più restrittivo: `isEngineBest === true` e categoria comune Migliore. Non estendere il cap o dichiarare equivalenti mosse diverse per inseguire le etichette. Questo filtro riduce il richiamo ed è una scelta nostra, non una definizione ufficiale.
- Annotazione separata e serializzabile: categoria comune, regola/versione, prove, motivo, alternative UCI/SAN e motivo di astensione. Ricalcolare il contesto per partita, non inserirlo nella cache grezza FEN+mossa.
- Per rendere obsolete le analisi già archiviate, incrementare lo schema analisi soltanto quando sarà adottata una nuova regola. Nessuna riscrittura automatica dei record o delle cache baseline.

## Grande: primo candidato limitato all’unicità

Propongo inizialmente di studiare **soltanto “unica buona mossa”**, lasciando fuori le promozioni basate su transizioni perso/pari/vinto, che richiederebbero nuove definizioni quantitative oggi non approvate. Un miglioramento rispetto al punteggio avversario precedente potrebbe essere effetto dell’errore avversario o di ricerche discordanti.

La MultiPV 5 corrente **non dimostra l’unicità**: una sesta alternativa non analizzata può essere altrettanto valida. Confrontare soltanto PV1 e PV2 non basta. Un solo go a budget limitato può inoltre terminare con linee a profondità diverse e radici duplicate.

Piano sperimentale futuro, subordinato a un’autorizzazione separata:

1. Enumerare tutte le mosse legali dalla FEN, deduplicare per UCI. Una sola mossa legale è Forzata: non assegnare Grande.
2. Raccogliere prove confrontabili per **tutte** le alternative, registrando budget, depth effettiva, limiti e copertura. Una MultiPV a tutte le radici può essere una modalità di raccolta, ma non garantisce da sola risoluzione sufficiente. Prima di calcolare, proporre costo e protocollo; cache nuova separata soltanto dopo via libera.
3. Primo prototipo prudente, se approvato: unicità dimostrata nel caso discreto di una sola mossa che evita un matto forzato contro e conserva un esito non perdente, mentre tutte le altre hanno matto contro confermato. Richiede anche prova dell’esito non perdente, non il semplice “score non negativo”. Senza copertura completa/prova della difesa: astensione. L’assegnazione sarebbe condizionata a Stockfish e al budget, non una prova matematica universale, salvo eventuali esiti terminali esatti.
4. Casi soltanto cp, alternative non risolte, difese incerte o risultati instabili: conservare Migliore. Non inventare un distacco in cp per chiamarla Grande. Se nessuno dei 14 esempi soddisfa il protocollo, riportare zero riconoscimenti e i motivi, senza allentarlo automaticamente.

Con i dati attuali non propongo di attivare Grande: mancano la verifica completa delle alternative e la politica approvata su questi casi. Il candidato va valutato prima offline; potrebbe risultare troppo restrittivo o troppo costoso per essere adottato.

## Geniale: richiede una verifica specifica del sacrificio

Secondo candidato, da affrontare soltanto dopo Grande e un nuovo via libera. Il singolo esempio di sviluppo non deve diventare una regola scritta per quel ply.

Piano prudente, senza ancora fissare una formula:

1. Verificare il requisito PV1/categoria comune Migliore e le guardie comuni.
2. Identificare l’offerta concreta di un pezzo non pedone: presa o sequenza di prese legale, con pezzo identificato per colore/tipo/casa. Una casa attaccata, un bilancio materiale negativo o una PV sola non bastano.
3. Confrontare risposte avversarie che accettano e rifiutano l’offerta; verificare la miglior difesa, non una risposta cooperativa della PV. Registrare bilancio materiale lungo la sequenza ed eventuale restituzione, promozione, matto o compensazione. Se non si distingue un sacrificio da scambio, guadagno materiale o perdita accidentale: astensione.
4. Verificare il controfattuale senza il sacrificio e l’esito dopo la miglior difesa. Le attuali cinque linee e la sola analisi dopo la giocata possono essere insufficienti. “Non già vinta” e “non cattiva” richiedono una politica operativa da approvare: non introdurre nuove soglie nella sigmoid esistente.
5. Prima di qualunque nuova ricerca, proporre protocollo, costi e cartella separata; nessun calcolo autorizzato da questo piano. Se le prove non bastano, la categoria resta comune.

In particolare non attivare un semplice controllo “PV1 + pezzo sacrificato”: produrrebbe falsi positivi nei casi di vittoria già facile, scambi, pezzi recuperati subito, risposte subottimali e difese non viste. L’eventuale uso dei valori materiali tradizionali sarebbe un’euristica locale da documentare e approvare, non il criterio privato Chess.com.

## UI e ordine delle regole da approvare prima del codice

Conservare la categoria comune nel record. Libro, Non valutabile e matto dato restano protetti. Per le altre entry: Mossa mancata come oggi; poi verifica Geniale; poi Grande; infine categoria comune. L’ordine delle due nuove categorie è una proposta locale per evitare doppie etichette, non un comportamento ufficiale noto. Le due vengono implementate/verificate in punti separati.

Spiegazione visibile soltanto se supportata dai dati:

- Mossa mancata: testo attuale con errore avversario e alternativa.
- Grande: difesa trovata e almeno una alternativa legale con il suo esito; motivazione “unica difesa verificata fra le mosse legali” soltanto se la verifica è completa.
- Geniale: pezzo offerto, accettazione/miglior difesa, prosecuzione legale e controfattuale. Non presentare la giocata stessa come “alternativa”: distinguere linea scelta e linea di confronto.

In UI descrivere il perché, senza dettagli tecnici irrilevanti; nel report QA conservare prove e motivi di rifiuto. Nessuna chiamata LLM per decidere l’etichetta o colmare dati mancanti. Non occorre assegnare un nome speciale per mostrare un’interessante variante in un futuro punto separato.

## Sequenza proposta, un punto alla volta

1. **Approvazione di questo piano**, oppure modifica dei candidati.
2. **Mossa mancata:** prima diagnosi di regressione dalle cache esistenti con il motore adottato, mantenendo integralmente la politica corrente. Nessuna taratura per recuperare i dieci esempi. Eventuali cambiamenti richiedono un piano distinto e approvazione; C9 resta sospeso.
3. **Grande:** progettare e autorizzare soltanto l’esperimento sulle prove di unicità, con stima dei costi prima dell’avvio. Dopo il risultato decidere se implementare; con dati insufficienti non attivare la categoria.
4. **Geniale:** stessa sequenza, con protocollo materiale/controfattuale esplicito. Non implementare insieme a Grande.
5. Dopo ogni eventuale implementazione approvata, bloccare versione/regole prima della validazione 7-10, che necessita di autorizzazione esplicita a leggerle.

## Verifiche future necessarie

Test sintetici separati dai dati di sviluppo: entrambe le prospettive, matto/stallo, unico legale, due difese equivalenti, alternativa fuori MultiPV, radici duplicate/depth diverse, bound/mancanze, falso sacrificio/scambio, promozione/arrocco/en passant, risposte che accettano/rifiutano, vantaggio già decisivo, cache hit e archivio obsoleto. Le verifiche materiali usano mosse effettive chess.js, non soltanto un flag mockato. UI: testo coerente con FEN, alternativa legale, chiusura/riapertura senza perdere motivazione.

Offline, solo quando autorizzato: elenco di tutti gli attesi e tutti gli assegnati, TP/FP/FN, precisione e richiamo per categoria, casi esclusi/sospetti separati. Se zero assegnati, precisione non definita, non 100%. Negativi: anche mosse con altre etichette, non soltanto i positivi noti. Non dare distanza ordinale a Grande/Geniale/Mossa mancata. Report con denominatore delle categorie comuni fisso e denominatore totale esplicito quando aumenta il supporto QA, senza confrontare percentuali ottenute con esclusioni diverse.

Tenere distinti P1-P6 development e H1-H2, senza usarli come validazione indipendente. Le differenze di Game Review e il campione scarso impediscono di promettere equivalenza Chess.com. Non cambiare motore/budget durante il confronto e non riscrivere baseline.

## Verifiche eseguite in questo punto (output reali, estratti)

```text
Conteggi fixture P1-P6: Mossa mancata 10; Grande 14; Geniale 1

> vitest run --config scripts/qa-no-env-test.config.js --cache false
Test Files  24 passed (24)
Tests       137 passed | 1 skipped | 1 todo (139)
Start at    14:33:46
Duration    6.57s

> vite build --config scripts/qa-no-env-build.config.js
71 modules transformed.
(!) Some chunks are larger than 500 kB after minification.
built in 4.29s
```

Entrambi exit 0, suite completa senza esclusioni. Browser, nuovi esperimenti motore, implementazione categorie e validazione 7-10: **NON ESEGUITO**. Build in dist ignorato; nessuna nuova cache. git diff --check finale: exit 0, solo eventuali avvisi LF/CRLF.

File creato: agent-output/roadmap-3-1-plan.md. File modificato: HANDOFF-ChessProfessor.md. Nessun file app/test modificato. Nessun commit/push.

Comandi per Carlo, non eseguiti:

```powershell
git status --short
git diff --check
git diff -- HANDOFF-ChessProfessor.md
git add -- HANDOFF-ChessProfessor.md agent-output/roadmap-3-1-plan.md
git diff --cached --stat
git diff --cached --check
```

STOP alla progettazione; attendere approvazione prima di ogni implementazione o nuovo esperimento.
