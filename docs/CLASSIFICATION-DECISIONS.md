# Classificazione: criteri, spiegazioni e provenienza

Il resoconto offre **Perché questa classificazione?** per ciascuna mossa. Mostra
la ragione dell'etichetta, le fasce numeriche, l'affidabilità del confronto, le
versioni e l'eventuale etichetta originaria. I dati completi sono consultabili
aprendo **Dati e criteri per la riproduzione**.

## Criteri attuali, invariati

L'indice locale usa `1 / (1 + exp(-cp / 400))`. Non è una probabilità umana
calibrata. Le fasce di perdita, in punti percentuali dell'indice, restano:
Migliore fino a 1; Ottima fino a 3; Buona fino a 5; Imprecisione fino a 10;
Errore fino a 20; Errore grave oltre 20. Restano le regole esistenti per prima
scelta, equivalenza verificata, Libro, mosse forzate, matto, occasioni mancate e
categorie speciali. Nessuna soglia è stata adattata a etichette esterne.

## Dati registrati

`classificationDecision` contiene modello e scala, fasce, versioni numeriche,
del confronto e dei criteri supplementari; punteggi e indici usati; regola
applicata; stato delle evidenze; profili motore; FEN e storia disponibile;
provenienza del repertorio quando nota. La copia è indipendente dagli oggetti
mutabili del motore. Le ricerche originali e i certificati restano nei loro campi.

`classificationOrigin` conserva la prima decisione documentata prima della
riclassificazione o sostituzione dell'analisi. Per dati precedenti alla funzione
conserva l'etichetta e `policy: null`: non inventa criteri storici mancanti.
La compatibilità del profilo motore resta distinta dalla provenienza dei criteri.
Il formato e il database degli archivi non richiedono una migrazione distruttiva.

`replayNumericalDecision` ricalcola dai parametri registrati il giudizio numerico
delle versioni supportate, rilevando incoerenze. Non certifica che i punteggi siano
verità scacchistiche e non riesegue Stockfish. Per Grande, Geniale, Mossa mancata
o versioni non supportate dichiara il limite: non emula algoritmi storici assenti.

### Perimetro del replay speciale (verifica del 29 ottobre 2026)

Il termine **regola speciale** indica qui una regola di classificazione, non una
mossa illegale o una regola degli scacchi mancante. Sono due verifiche distinte:

| Situazione | Cosa viene verificato | Limite |
| --- | --- | --- |
| Fasce numeriche, equivalenza, matto dato, Libro e Forzata | `replayNumericalDecision` ricalcola dai valori registrati le versioni supportate | Non riesegue Stockfish, non dimostra la correttezza dei punteggi né l'appartenenza storica al repertorio; Forzata richiede il conteggio registrato coerente |
| Grande | Il classificatore corrente controlla confronti tra alternative e le famiglie tattiche/prove implementate | Il solo tracciato numerico non include precedenti mosse, tutte le varianti e i certificati necessari; replay `unsupported` |
| Geniale | Il classificatore corrente verifica offerta materiale, accettazioni e compensazione disponibili | Continuazioni irrisolte o prove insufficienti restano candidate, senza promozione; replay numerico `unsupported` |
| Occasione mancata | Regole correnti per vantaggio offerto dall'avversario, confronto coerente e matto non mantenuto, anche da continuazione archiviata verificata | Servono contesto della partita e varianti legali; una sola percentuale persa non ricostruisce il criterio; replay numerico `unsupported` |
| Versione ignota o criteri originali assenti | Il replay dichiara il limite; l'origine resta distinta dalla ricostruzione corrente | Non si possono recuperare algoritmi o dati mai salvati |

Arrocco corto/lungo, en passant e promozioni a donna, torre, alfiere e cavallo
sono gestiti dalla ricostruzione legale con `chess.js`: 14 casi mirati, per
entrambi i colori, verificano classificazione numerica, PGN/FEN/UCI, validazione
dell'archivio e selezione del candidato al ripasso. I punteggi di questi test
sono sintetici: verificano il percorso dei dati, non l'accuratezza di Stockfish.
Matto dato, mosse forzate, categorie protette e varianti illegali/incomplete
hanno inoltre test dedicati. Non si tratta di una certificazione di ogni regola
FIDE o variante scacchistica.

Grande e Geniale restano categorie sperimentali: le famiglie riconosciute non
costituiscono un catalogo completo di tutte le mosse notevoli. MultiPV può coprire
solo le alternative analizzate; dove non sono esaurite le difese legali, una
variante favorevole non prova un risultato forzato contro ogni risposta.
L'assenza di un'etichetta speciale non invalida il giudizio numerico.

**Problema riprodotto e corretto:** i controlli delle categorie speciali, delle
conferme dei sacrifici e del matto mancato ignoravano i flag booleani
`lowerbound`/`upperbound`, pur rifiutando
già `bound` e gli stessi marcatori nel testo UCI. Un limite di valutazione poteva
quindi essere trattato come punteggio esatto, generando una falsa etichetta.
Ora anche questi flag impediscono la promozione. Il tracciato registra
`evidenceVersion: exact-score-flags-v1`; formule, soglie e versione delle famiglie
speciali restano invariate. I vecchi tracciati senza questo campo non vengono
riscritti retroattivamente.

Riaprire un'analisi con `reclassifyReviewedMoves` applica le verifiche correnti ai
dati completi disponibili e conserva la prima origine, senza mutare il record
originale: è una **riclassificazione corrente**, non il replay di un vecchio
algoritmo. Un vecchio punteggio inesatto non può essere corretto senza una nuova
ricerca. Nel ripasso un errore o un'occasione mancata archiviati sono solo indizi:
nuove ricerche con storia della partita verificano utilità e tentativi; prove
inconcludenti non producono una penalità. Grande/Geniale non sono candidati in
quanto tali. Il controllo dei flag nel ripasso era già presente e non cambia.

Non viene aggiunto un emulatore storico: duplicherebbe classificatori e prove
senza recuperare le informazioni mancanti. Il replay numerico rimane una verifica
limitata e dichiarata; la riclassificazione completa riusa il percorso esistente.

## Correzioni di integrità e compatibilità

Un'UCI eventualmente registrata deve corrispondere alla mossa ricostruita dal
PGN: SAN e FEN corrette non rendono accettabile un'UCI diversa. I campi assenti
negli archivi legacy restano supportati. Un criterio Forzata contraddetto dal
numero di mosse legali non viene dichiarato riprodotto.

Per il ripasso, le segnalazioni vecchie e quelle ricostruite formano soltanto
l'elenco dei candidati. Il giudizio richiede sempre nuove evidenze Stockfish con
la storia della partita; una riclassificazione da sola non aggiorna una ricerca.
Gli ID dei progressi restano identici con i criteri predefiniti già utilizzati.
Se modello, fasce o criteri dell'opportunità cambiano, ricevono un'identità
separata; un semplice riordino dei campi non invalida i progressi.

## Spiegazioni scacchistiche deterministiche

Il dettaglio della classificazione offre una spiegazione su richiesta, distinta
dal calcolo dell'etichetta: motivo, minaccia/opportunità, risposta avversaria e
alternativa. `moveExplanation.js` ricostruisce mosse e varianti legali dai dati
già disponibili; rifiuta punteggi limitati, posizioni incoerenti e varianti di
matto incomplete. Le linee mostrate sono illustrative, non prove contro tutte
le difese. Una presa con ripresa non viene presentata come perdita automatica.
Quando la causa tattica non è documentabile, lo dichiara senza inventarla.

Il ripasso usa lo stesso componente solo dopo un tentativo corretto o la
richiesta della soluzione. Le spiegazioni usano il confronto fresco già eseguito
per l'esercizio; non riutilizzano i punteggi obsoleti come prova e non avviano
nuove ricerche o chiamate AI. Nell'analisi le verifiche legali partono solo
all'apertura del dettaglio. Nessun nuovo campo obbligatorio viene salvato negli
archivi e nessuna formula o soglia di classificazione viene modificata.

## Riferimento tecnico Lichess

Consultati i sorgenti ufficiali il 29 ottobre 2026:

- [Advice.scala](https://github.com/lichess-org/lila/blob/master/modules/tree/src/main/Advice.scala): separazione fra giudizi numerici e indicazioni sul matto.
- [scalachess eval.scala](https://github.com/lichess-org/scalachess/blob/master/core/src/main/scala/eval.scala): trasformazione delle valutazioni in un indice; modello diverso da quello locale.
- [COPYING Lila](https://github.com/lichess-org/lila/blob/master/COPYING.md): AGPL-3.0-or-later, salvo eccezioni elencate.

Sono riferimenti progettuali: nessun codice Lichess è stato copiato. Differenze
fra modelli o concordanza con etichette esterne non dimostrano, da sole, maggiore
accuratezza. Non è stata eseguita una nuova calibrazione indipendente.
