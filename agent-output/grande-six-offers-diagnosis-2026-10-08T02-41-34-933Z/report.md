# Perché i sei casi dell'audit non sono Grande

Fonte: [output reale e hash](results.json). Nessuna nuova ricerca o modifica al classificatore. I sei casi dell'ultimo audit sono sei accettazioni materiali in quattro mosse, non sei mosse annotate Grande. Nei riferimenti disponibili nessuna delle quattro è Grande.

| Partita | Giocata | Accettazioni sfavorevoli | Riferimento | Comune / candidato congelato | Esclusione Grande |
|---|---|---|---|---|---|
| Personale 4, Nero | 24...Nd4 | Bxe4, fxe4 | Errore | Ottima | Non è PV1: il motore preferisce Bd5. |
| Personale 6, Nero | 16...Qd7 | Nxf6+, Bxf6 | Buona | Errore | Non è PV1: il motore preferisce Ned7. |
| Chigorin–Steinitz, Nero | 23...g6 | Bxe7+ | Ottima | Migliore | PV1, ma Qh5 precedente è Migliore, non un errore: afterError=false. |
| Saint-Amant–Staunton, Bianco | 40.Rd1 | Nxc3 | Errore | Errore | Non è PV1: il motore preferisce d5. |

## Valutazioni dal lato di chi gioca

- Nd4: migliore Bd5 −1444 cp; dopo Nd4 il motore segnala matto contro in 7, con Bxe4. Fxe4 ha +1639 cp per il Bianco, dunque −1639 per il Nero. Ottima è un effetto del classificatore basato sulla piccola ulteriore perdita di probabilità in una posizione già fortemente perdente; non indica posizione favorevole. Il riferimento Errore mostra disaccordo nella categoria comune, non un Grande mancato.
- Qd7: migliore Ned7 −422 cp; giocata −769 cp tramite child principale Bxf6. Nxf6+ dà −551 cp per il Nero. Il riferimento Buona e il risultato Errore non coincidono; la mossa resta esclusa dal criterio Migliore/PV1 di Grande.
- g6: migliore e giocata −383 cp alla root, contro −615 cp della seconda root alla depth precedente. Dopo Bxe7+ lo score è −344 cp per il Nero. Essere la miglior difesa in una posizione sfavorevole non basta per la regola congelata. Il divario con la seconda root, inoltre a depth diversa, non prova che sia l'unica buona difesa. Nessuna precedente occasione da errore riconosciuta: Qh5 è Migliore.
- Rd1: migliore d5 −143 cp; giocata −328 cp, con Nxc3 nella child principale. Il riferimento la classifica Errore. Non è una mossa da promuovere per questo criterio.

La politica sperimentale congelata richiede Migliore/PV1, nessuna presa e risposta a un precedente errore numerico; copre una sola famiglia di Grande. Non rappresenta tutta la definizione della piattaforma. Un'offerta sfavorevole esclude il criterio di compensazione di Geniale, ma non è di per sé una regola di esclusione Grande: qui sono stati verificati separatamente i motivi del rilevatore Grande.

Score root e child provengono da ricerche limitate e possono avere depth diverse; sono quelli effettivamente usati dal percorso corrente, non prove esatte dell'esito. Il candidato congelato resta sperimentale e non attivato nell'app. Hash invariati, nessun commit/push; suite app/build/browser NON ESEGUITI perché non è cambiato codice.
