# Risultato: stabilità del motore e limiti persistenti della classificazione

12 ottobre 2026. Dodici casi fissati prima delle ricerche: per ciascuna di
Buona, Imprecisione ed Errore, tre discordanze di tipo diverso e un controllo
corretto. La selezione usa le prime righe disponibili, quindi non è casuale
né rappresentativa; nove casi sono deliberatamente discordanti.

## Esito a regole invariate

| Categoria attesa | Corrette a 200k | Corrette a 1M |
|---|---:|---:|
| Buona | 1/4 | 1/4 |
| Imprecisione | 1/4 | 3/4 |
| Errore | 1/4 | 2/4 |
| Totale selezionato | 3/12 | 6/12 |

Tre recuperi, nessuna regressione dei tre controlli, quattro cambi di etichetta
e tre cambi della prima scelta. Questi numeri descrivono il controllo selezionato,
non una nuova precisione complessiva delle partite.

Le tre etichette recuperate sono personal-01/18 h6 (Buona -> Imprecisione),
personal-01/28 Qd8 (Ottima -> Imprecisione), personal-01/44 g5 (Imprecisione ->
Errore). Le perdite locali passano rispettivamente 4.702 -> 5.137,
2.329 -> 5.976 e 9.396 -> 10.750 punti. Due casi sono vicini ai confini;
non affermare che la nuova categoria sia definitivamente stabile a ogni budget.

## Separazione del metodo numerico dal budget

La cache originaria non conserva gli snapshot completi; la nuova raccolta li
conserva. Per controllare questo fattore, i raw a 1M sono stati valutati offline
anche con il metodo originario congelato moveEvaluationFields/classifyAnalysisEntries.
Sui dodici casi questo metodo recupera le stesse tre etichette: 6/12 corrette,
nessuna differenza di categoria rispetto al confronto coerente attuale a 1M.
Le perdite numeriche differiscono, ma non le etichette. In questo controllo
il miglioramento di concordanza è quindi compatibile con la ricerca a budget
maggiore, non dipende dalla sola selezione del nuovo snapshot.

Questo non dimostra che gli snapshot siano inutili: evita di attribuire loro
il guadagno numerico di questi casi, e continua a preferire confronti coerenti
senza mescolare score quando disponibili. Dettagli in offline-method-comparison.json.

## Perché restano sei discordanze

Le tre Buone discordanti non diventano Buone. Bb4 resta Ottima con -0.77 ->
-1.03 per il Nero (perdita 1.604 punti); Nf3 resta Ottima con +0.51 -> +0.44
per il Bianco (0.436 punti). Le valutazioni del motore rimangono molto vicine.
Non sarebbe giustificato aumentare artificialmente quelle perdite solo per
ottenere l'etichetta di riferimento.

Kg7 passa da Migliore a Ottima: il motore preferisce ora Kg8, ma la posizione
era già molto sfavorevole. Migliore -8.50, giocata -9.22 nella stessa ricerca;
il sigmoid locale produce soltanto 1.598 punti di perdita. Il riferimento è
Buona: c'è sia instabilità della prima scelta originaria sia divergenza della
scala di classificazione in una posizione già persa.

Kf6, riferimento Imprecisione, resta PV1 anche a 1M; score -10.11 per il Bianco,
perdita zero perché migliore e giocata coincidono. Kd7, riferimento Errore,
resta PV1 e matto contro in 5, anche con root a depth 46. Qui la ricerca più
lunga non conferma il riferimento: non degradare una prima scelta verificata
solo per far coincidere le etichette. Può esserci differenza di motore,
ricerca, modello del riferimento o della sua provenienza.

Ke7, riferimento Errore, resta Ottima: -10.40 -> -10.78 per il Nero, perdita
0.587 punti. La curva si appiattisce nelle posizioni già perse; non equivale
al modello privato di Expected Points e non descrive da sola la difficoltà
pratica delle difese. Questo limite richiede uno studio del modello, non una
presunta intenzione del giocatore o un coefficiente di rating inventato.

## Decisione e stato dell'app

Non sono stati modificati classificatore, curve, soglie, rating o budget
di produzione (200.000 nodi). Aumentare il budget a 1M dappertutto costerebbe
cinque volte i nodi e qui non risolve Buona o tutte le discordanze: questo
campione non giustifica una modifica automatica del profilo dell'app.

Il confronto generale resta 329/592. Le categorie storiche restano Buona 17/94,
Imprecisione 17/57, Errore 10/36; i tre recuperi appartengono al nuovo controllo
numerico isolato, non a una rianalisi completa delle partite o delle categorie
speciali. Non sommarli automaticamente al risultato generale.

24 ricerche, ciascuna 1.000.000 nodi nominali, Stockfish 19.0.0 large-single,
MultiPV 5, un thread, Hash 16 MB, hash pulita prima di ogni go. Telemetria
totale 24.006.864 nodi, sotto il tetto prefissato 24.120.000. Nessuna ricerca
aggiunta o ripetuta. PV e catene FEN validate, fonti e 20 input congelati
invariati. Nessuna lettura di .env o delle partite riservate 7–10.

Sono stati aggiunti soltanto script e dati diagnostici; controllo sintattico
degli script e verifiche degli hash eseguiti. Nessuna nuova suite o build
necessaria per codice applicativo invariato. Il prossimo intervento può
concentrarsi su una modalità di approfondimento selettivo e sulla provenienza
dei riferimenti discordanti, mantenendo separati questi due obiettivi.
