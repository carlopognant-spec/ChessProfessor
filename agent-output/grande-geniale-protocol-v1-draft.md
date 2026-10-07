# Grande e Geniale — protocollo v1, bozza preventiva

Data: 7 ottobre 2026. Solo documentazione. Nessuna implementazione o ricerca motore autorizzata da questo documento. Integra agent-output/roadmap-3-1-plan.md senza sostituirlo. Le categorie rimangono non attivate.

## Chiusura della diagnosi e verifica delle formule

La diagnosi precedente di P4 Nero è conclusa: prima/dopo Qb5, +459/−661 cp; FEN coerenti; Qb5 assente dalla root MultiPV. Il divario dei cali dipende dalle curve, non da score diversi. Precisione invariata; il 67,51856 del controfattuale non è una correzione.

Verifica del codice locale: calculateWinProbability usa 1/(1+exp(−cp/400)), coefficiente 0,0025. accuracyWinPercent usa 0,00368208 e clamp cp ±1000. Le due funzioni restano invariate.

La [pagina pubblica Lichess](https://lichess.org/page/accuracy) presenta la formula arrotondata senza bonus. Il [codice lila alla revisione documentata](https://github.com/lichess-org/lila/blob/2e653ad1e2b9fad31b4a092394019ef8fafdedb8/modules/analyse/src/main/AccuracyPercent.scala) aggiunge +1 prima del clamp, come bonus per l'incertezza dell'analisi. accuracy.js dichiara esplicitamente l'omissione nel commento iniziale; la scelta è documentata anche nel report precedente. README e PLAN non la precisano. Questa evidenza documenta l'intenzionalità nell'implementazione, non ricostruisce una specifica approvazione personale di Carlo. Nessuna modifica proposta qui.

3.3 resta senza stima Elo/fascia numerica. La proposta ricevuta da Claude per riaprirla (circa 20 partite, circa 40 osservazioni, Precisione circa 40–95, errore leave-one-out sotto circa 200) è una condizione preventiva candidata, non una validazione già raggiunta. In un futuro studio occorre distinguere leave-one-out per osservazione e validazione lasciando fuori un'intera partita: i due colori non sono indipendenti.

## Definizioni pubbliche e limiti

[Chess.com](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc) descrive Grande come mossa decisiva, anche unica buona mossa; Geniale come sacrificio valido di un pezzo, migliore o quasi, senza posizione successiva cattiva e senza vittoria già assicurata anche evitando quella mossa. I criteri sono più generosi per principianti.

Non sono pubblicati algoritmo completo, distacco operativo dalla seconda linea, perdita materiale minima, soglie di compensazione o coefficienti del rating. Il protocollo seguente è una nostra approssimazione prudente. Non promette equivalenza con Game Review e non deriva soglie dalle annotazioni.

## Vincoli e guardie comuni

- Configurazione dell'app invariata: Stockfish 19 large-single, 200.000 nodi, MultiPV 5, Threads 1, Hash 16 MB. Modello, soglie comuni, Libro, cap, Mossa mancata e Precisione invariati.
- Nessuna lettura di .env o Partite/7–10. Nessuna modifica a tests/fixtures/qa/**. Le prove future richiedono autorizzazione distinta e output separato.
- Candidato iniziale: mossa legale, categoria comune Migliore e isEngineBest=true. È una restrizione locale preventiva, più severa del “quasi migliore” pubblico.
- Libro, Non valutabile, matto dato e Mossa mancata mantengono la gestione attuale. Posizione già terminale e unica mossa legale non ricevono promozioni speciali.
- Verificare FEN, lato al tratto, SAN/UCI, score finiti e senza bound, provenienza del motore e budget. Confronti dal lato del giocatore; non convertire mate in un distacco cp.
- Radici duplicate, copertura incompleta, depth diverse, bound e dati mancanti impediscono di dichiarare unicità/verifica completa. Stesso budget non garantisce stessa precisione di ricerca.
- Esito a tre stati: candidato verificato secondo il protocollo; candidato escluso con motivo; prove insufficienti. In tutti i casi non verificati resta la categoria comune.

## Grande — prima fase separata

Obiettivo iniziale: verificare “unica buona mossa”, lasciando fuori transizioni perso/pari/vinto non ancora definite quantitativamente.

1. Enumerare e deduplicare tutte le mosse legali dalla FEN iniziale. Una sola mossa legale è forzata, non Grande.
2. Raccogliere risultati per ogni radice, con metadati, PV legalmente ripercorsa, score, bound, depth e budget. PV1/PV2 della MultiPV 5 non coprono necessariamente tutte le alternative.
3. Per ciascuna alternativa distinguere esito dimostrato, stima a budget limitato e irrisolto. Se una difesa fuori MultiPV è irrisolta, non dichiarare unicità.
4. Candidato conservativo del piano esistente: una sola mossa conserva un esito non perdente documentato, tutte le altre conducono a matto contro confermato. Una PV fino al matto documenta una linea legale, ma da sola non prova l'esito contro tutte le difese. Un punteggio cp non negativo non prova patta/vittoria. Mancando prove sufficienti, astensione; possibile risultato zero riconoscimenti.
5. Un eventuale candidato basato soltanto su cp richiede prima una politica numerica approvata. Il distacco dalla seconda alternativa è una misura da registrare, non una definizione sufficiente: due mosse entrambe perdenti o entrambe vincenti possono avere un ampio distacco.

Per il ramo euristico cp rimangono da fissare PRIMA dell'esperimento: soglia di “buona”, soglia di “alternativa insufficiente”, margine fra migliore e seconda, tolleranza di instabilità, protocollo di conferma. Nessun valore scelto in questo punto: fissarlo ora senza approvazione cambierebbe la politica prudente precedente. Le tolleranze devono derivare da un protocollo di robustezza indipendente dalle etichette attese, non dal recupero dei 14 esempi di sviluppo.

## Geniale — solo dopo la fase Grande

Obiettivo: offerta verificabile di un pezzo con compensazione che resiste alla miglior difesa e confronto senza sacrificio.

1. Identificare il pezzo non pedone per colore, tipo e casa. Documentare una sequenza legale che permette all'avversario di accettare l'offerta. Pezzo attaccato o saldo materiale negativo da soli non bastano.
2. Calcolare il saldo materiale dalla prospettiva del giocatore prima dell'offerta e dopo ogni ply. Registrare pezzi catturati, promozioni e recuperi. Una semplice presa reciproca equivalente, un guadagno netto o un pezzo recuperato subito non devono diventare automaticamente sacrificio.
3. Enumerare risposte che accettano e rifiutano. Esaminare la miglior difesa, anche quando rifiuta: una PV cooperativa non conferma il sacrificio. Se non c'è copertura o una risposta è irrisolta, astensione.
4. Dopo accettazione, distinguere perdita persistente da scambio e da restituzione temporanea. L'orizzonte deve essere stabilito prima dell'esperimento; se la sequenza di prese è ancora aperta al limite, il saldo è irrisolto.
5. Verificare l'esito dopo miglior difesa e il controfattuale delle alternative senza offerta. Se una buona alternativa senza sacrificio rende la vittoria già assicurata secondo la politica approvata, non assegnare Geniale. Non confrontare il saldo materiale con cp come se fossero la stessa misura.

Per il ramo euristico restano da approvare: valori materiali (eventuale convenzione pedone=1, cavallo/alfiere=3, torre=5, donna=9), perdita netta minima, orizzonte delle prese, definizione di “posizione non cattiva”, “già vinta senza sacrificio”, stabilità e budget di conferma. La convenzione materiale è solo una proposta; nessuna soglia attivata. Nessuna regola dipendente dal rating inventata. Il singolo esempio Geniale di sviluppo non basta a calibrarle.

## Piano di raccolta futura e costo

Non eseguito in questo punto. Nessun nuovo go.

Prima delle ricerche preparare un manifest approvabile con FEN dei candidati, tutte le radici, obiettivi per ricerca, budget, limiti, numero massimo di ricerche e cartella nuova fuori tests/fixtures/qa/**. Baseline e metadati grezzi restano intatti.

Se si adotta una ricerca separata per radice a B nodi e si esaminano posizioni con L_i mosse legali, la prima raccolta richiede sum(L_i) ricerche e circa B × sum(L_i) nodi nominali, prima delle conferme. Per Geniale si aggiungono risposte accettanti/rifiutanti e controfattuali. Registrare sforamento reale del budget; a ogni livello usare un tetto esplicito e astenersi se raggiunto. Nessuna stima in secondi qui: conteggi e benchmark dedicati NON ESEGUITI. Budget di app e budget sperimentale non vanno confusi.

## Valutazione preventiva e adozione

- Test sintetici indipendenti: entrambi i colori; unico legale; due buone difese; difesa fuori MultiPV; radici duplicate/depth diverse; bound; matto/stallo; scambio semplice; recupero immediato; sacrificio solo contro risposta cooperativa; promozione/arrocco/en passant; posizione già vinta; cache hit/archivio obsoleto.
- Analizzare positivi e negativi, non soltanto mosse annotate Grande/Geniale. P1–P6 restano sviluppo; H1–H2 separati; non usare 7–10 per scegliere regole.
- Report separato per categoria: TP/FP/FN, precisione, richiamo, astensioni e casi irrisolti. Zero assegnazioni => precisione non definita. Niente distanza ordinale per categorie speciali.
- Non fissare percentuali di successo come giustificazione per allentare soglie. Una sola Geniale non consente stima affidabile della generalizzazione.
- Prima di validare, bloccare regole/versione e criteri di adozione. Accesso a 7–10 soltanto con autorizzazione specifica successiva.
- Solo dopo esperimento e decisione: implementazione separata per categoria, preservazione baseClassification/prove/motivi, schema analisi incrementato senza riscrittura automatica degli archivi. Ordine proposto ereditato: protezioni attuali, Geniale, Grande, categoria comune.

## Esito del presente punto

ESEGUITO: lettura del piano e dei riferimenti locali alle formule, verifica delle fonti primarie pubbliche, creazione di questa sola bozza.

NON ESEGUITO: lettura di fixture per scegliere soglie, ricerche motore, nuovi conteggi sui candidati, calibrazione, implementazione, test, build, browser, validazione 7–10, commit/push.

STOP alla progettazione. Prossima decisione: conservare il candidato discreto prudente di Grande oppure autorizzare una politica euristica cp con parametri e protocollo di robustezza fissati prima della raccolta. Non avviare esperimenti sulla base di questa bozza.
