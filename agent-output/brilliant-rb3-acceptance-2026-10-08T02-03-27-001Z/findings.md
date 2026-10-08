# Rb3: il cavallo può essere lasciato in presa con compensazione

8 ottobre 2026. Diagnosi del riferimento storico Chigorin–Steinitz Rb3, ply 53. Caso scelto perché già annotato Geniale: non è un campione per misurare precisione o richiamo. Protocollo preventivo ../brilliant-rb3-acceptance-v1-protocol.md.

## Risultati reali

Ricerca dalla FEN dopo Rb3, lato al tratto Nero, sola radice c8h8/Qxh8. Stockfish 19 npm 19.0.0 large-single, MultiPV 1, Threads 1, Hash 16, hash pulita prima di ogni ricerca.

| Budget nominale | Nodi effettivi | Depth dello score senza bound | Score dal lato Nero | Score dal lato Bianco |
|---:|---:|---:|---:|---:|
| 200.000 | 200.186 | 21 | −903 cp | +903 cp |
| 1.000.000 | 1.000.218 | 28 | −977 cp | +977 cp |

Totale effettivo 1.200.404, entro il tetto 1.300.000. Circa 4,8 secondi della raccolta, esclusa preparazione. Nodi allo score finale uguali ai nodi effettivi in entrambe le ricerche. Nessun mate annunciato; i valori sono stime, non prove di vittoria.

## Compensazione osservata

Prima di Rb3 il saldo materiale Bianco è +1. ...Qxh8 prende il cavallo, portandolo a −2: perdita di 3 rispetto alla posizione iniziale.

A 200k: `Qxh8 Rf3 Qg8 Rxf5+ Kg7 Rg5+ Kh8 Rxg8+ Rxg8`. Il Bianco recupera il cavallo f5 e poi scambia una torre per la donna. Il saldo non viene recuperato con una ricattura immediata: Rf3 è una mossa preparatoria.

A 1M: `Qxh8 g4 Qg8 Qxf5+ Kg7 Re7+ Kh8 Rbxb7 Bg7 Rxg7 Qxg7 Rxg7`. Il Bianco recupera con la pressione sul re e una combinazione sulle colonne settima/g. La prima continuazione cambia da Rf3 a g4: non promettere stabilità della singola PV. Entrambe le ricerche stimano forte vantaggio per il Bianco dopo l'accettazione.

Il pezzo sacrificato è il cavallo h8, già attaccato dalla donna prima di Rb3. La torre b3 non è il pezzo catturato. Un rilevatore limitato al pezzo appena mosso non copre questa situazione.

La cache della miglior difesa dopo Rb3 contiene invece ...Kg7, −672 cp dal lato Nero: rifiutare appare meno sfavorevole del prendere il cavallo nei calcoli disponibili. Sono ricerche con MultiPV, depth e budget effettivo per linea diversi; questo confronto non prova l'ottimalità assoluta di ...Kg7 né copre tutte le difese.

## Cosa cambia nel progetto

Chiusa l'incertezza sull'accettazione mancante: ...Qxh8 è legale e nelle due ricerche ha compensazione favorevole al Bianco. Documentata una famiglia da prevedere nel futuro protocollo Geniale: pezzo lasciato in presa, sacrificio rifiutato dalla migliore risposta stimata, recupero tramite preparazione/attacco.

Nessuna nuova Geniale assegnata nell'app o nel modello v1. Rb3 rimane Ottima locale e sono già disponibili alternative root vincenti secondo le soglie del protocollo. Il successo di una diagnosi non autorizza a rimuovere queste guardie per un singolo riferimento storico. Nessuna precisione/recall ricalcolata su un caso selezionato tramite la sua etichetta.

## Verifica

PGN e FEN iniziale ripercorsi, legalità di Rb3 e Qxh8 confermata, root finale c8h8 verificato, entrambe le PV interamente ripercorse senza errori, materiale registrato per ply. Raw UCI completo salvato nei due search JSON. Hash delle quattro sorgenti invariati; nessuna modifica a cache/baseline QA, app, soglie o Grande. .env e partite 7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.
