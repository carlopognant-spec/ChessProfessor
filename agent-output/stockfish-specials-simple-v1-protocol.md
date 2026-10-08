# Esperimento semplice Stockfish v1

Checkpoint precedente: d833c58. Questo protocollo precede la raccolta dei risultati del nuovo classificatore. Soglie euristiche locali, non algoritmo Chess.com e non calibrazione indipendente. Nessun adattamento delle soglie dopo il primo risultato.

## Dati e costo

Solo cache Stockfish 19 large-single, 200.000 nodi, MultiPV 5 già presenti per personali 1–6 e due storiche. Zero nuove ricerche. Etichette consultate solo dal valutatore, mai dal riconoscitore. Storiche separate dai personali. Partite 7–10, .env e baseline QA esclusi; scrittura in una nuova cartella agent-output. Nessuna modifica al classificatore comune, alla Precisione o all'app.

## Protezioni

Richiedere categoria comune Migliore, mossa uguale alla prima linea, almeno due mosse legali, FEN coerenti, varianti legali e score senza bound. Libro e matto già dato sono esclusi. Confrontare le prime due linee solo alla stessa profondità; il MultiPV è una stima delle alternative, non una prova di unicità. Probabilità: curva esistente sigmoid(cp/400), mate positivo=1, negativo=0; nessun confronto di distanza mate con cp. La valutazione root e quella della posizione successiva, normalizzata al giocatore, devono differire al massimo di 0,10.

## Grande

Tre rami alternativi, applicati dopo Geniale:

1. Unica risorsa stimata: probabilità giocata almeno 0,45, seconda al massimo 0,35, distacco almeno 0,20.
2. Unica continuazione nettamente vincente stimata: giocata almeno 0,75, seconda al massimo 0,60, distacco almeno 0,20.
3. Opportunità creata dall'errore avversario: precedente classificazione numerica Errore/Errore grave; probabilità del giocatore prima dell'errore al massimo 0,60; opportunità offerta e mossa giocata almeno 0,75. FEN adiacenti e alternanza dei colori obbligatorie.

Matto viene trattato come esito vincente in questi confronti: se la seconda linea vince anch'essa, il solo matto non basta. Scacchi, forchette e ricatture non sono condizioni sufficienti né esclusioni automatiche.

## Geniale

Riconoscitore prudente del sacrificio accettato dalla miglior risposta stimata, non di tutte le possibili offerte:

- Mossa giocata Migliore, migliore probabilità root e probabilità dopo almeno 0,45.
- Nessuna alternativa mostrata già vincente (probabilità almeno 0,75). Prima e seconda linea alla stessa profondità.
- Nella risposta migliore della posizione successiva l'avversario cattura un pezzo non pedone; quella risposta coincide con la continuazione root. Se il motore rifiuta il sacrificio, esito non riconosciuto da questa v1.
- Saldo materiale rispetto a prima della mossa almeno 2 punti sotto dopo l'accettazione, con valori 1/3/3/5/9. La risposta successiva del giocatore non deve recuperare immediatamente tutto il saldo mediante una presa: serve una continuazione diversa da un normale scambio.
- Replay della PV fino a 8 ply dopo l'offerta, oppure al matto se precedente; PV più corta senza matto = dati insufficienti. Registrare tutti i saldi e recuperi. Il sacrificio può essere temporaneo: il recupero successivo tramite una combinazione non lo esclude.

Le PV sono risposte ottimali stimate a budget limitato. Non dimostrano compensazione contro ogni difesa, né completano il protocollo originario di sacrificio verificato. L'esito è un'etichetta sperimentale accompagnata dal motivo; nessuna attivazione nell'app su questi soli dati.

## Misure

Per Grande e Geniale: assegnazioni, TP, FP, FN, precisione, richiamo e astensioni, separati per personali e storiche. Conteggiare gli attesi fuori filtro. Conservare le categorie di base e confrontare la concordanza globale prima/dopo con esclusione esplicita di Forzata e di matto dato. Un solo positivo Geniale non permette di stimare la generalizzazione. Test sintetici per colori, score/bound/depth, scambio, sacrificio, duplicati, PV illegali, FEN e categorie protette.
