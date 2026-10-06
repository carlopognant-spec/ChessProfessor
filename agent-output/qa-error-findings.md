# Diagnosi: conclusioni e prossimo intervento

6 ottobre 2026. Nessuna modifica a soglie, profondità di produzione o classificazione.

## Dati verificati

Le tre normalizzazioni dei refusi sono state applicate prima della classificazione e registrate in `tests/fixtures/qa/personal-manifest.json`: personal-03 ply 125 migliroe → Migliore; personal-04 ply 21 erroe → Errore; personal-04 ply 31 migliroe → Migliore. I file originali non sono stati modificati.

Su 27 etichette attese Errore, 5 coincidono a depth 12 e 22 sono discordanti. È stato rieseguito solo questo gruppo di 22 posizioni a depth 18, MultiPV 5, con Stockfish 16, un thread e Hash 16 MB. Le cache di produzione restano intatte. Valutazioni complete in `qa-error-diagnostic.json`, confronto in `qa-error-diagnostic.md`.

- 4/22 diventano Errore: personal-01 ply 31 g4, personal-03 ply 43 dxe6, personal-04 ply 40 Nxd4, personal-05 ply 13 Bxd7+.
- 10/22 cambiano categoria; 18/22 restano discordanti.
- Non è stata misurata l'accuratezza complessiva a depth 18: mancano le altre mosse. Non possiamo sommare automaticamente questi quattro casi ai cinque già corretti, perché anche quelli potrebbero cambiare a maggiore profondità.
- Ogni posizione diagnostica usa una sessione UCI nuova, mentre le cache iniziali usano una sessione per partita. Il confronto misura sensibilità alle condizioni di analisi, senza isolare interamente la sola profondità.

## Limiti dimostrati del modello attuale

`calculateWinProbability` limita cp a ±1000. Per +1000, +2000 e +4000 restituisce esattamente 0.9241418199787566; per i corrispondenti score negativi circa 0.07585818002124355. Se entrambe le valutazioni superano il limite con lo stesso segno, la perdita calcolata è zero anche quando gli score differiscono molto. Tre dei 22 casi avevano almeno uno score fuori limite già a depth 12.

Il passaggio da un forte vantaggio cp a matto vincente introduce una differenza di almeno 7.586 punti percentuali rispetto al limite cp; non è necessariamente un peggioramento reale equivalente. Analogamente, due matti perdenti sono entrambi probabilità zero: personal-04 ply 50 Ne2 passa da matto subito in 6 a matto in 3, ma resta Migliore a depth 12 e 18. Per ply 54 Kd7, la linea perdente si accorcia da 8 a 6 (depth 12) e da 7 a 5 (depth 18), ancora senza perdita di probabilità. È un limite della politica iniziale approvata, non un'assenza di score.

Queste evidenze non provano che eliminare il limite o penalizzare il matto corto riproduca chess.com: sono aspetti da progettare e verificare separatamente.

## Cosa pubblica chess.com

La [documentazione ufficiale delle categorie](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc), consultata il 6 ottobre 2026, descrive un modello di punti attesi basato su valutazione e rating. Pubblica questi intervalli di perdita: Migliore zero, Ottima fino a 0.02, Buona 0.02–0.05, Imprecisione 0.05–0.10, Errore 0.10–0.20, Errore grave 0.20–1.00. Le convenzioni esatte ai confini e la formula completa non sono specificate in quella pagina.

Le nostre soglie iniziali divergono per Migliore e Ottima; le soglie Errore/Errore grave sono già numericamente analoghe, ma applicate a un modello diverso. Non è quindi sufficiente cambiare solo i numeri delle soglie per risolvere gli Errori discordanti. La funzione locale cp→probabilità non usa il rating. I PGN personali includono WhiteElo e BlackElo, utili per un futuro modello esplicitamente stimato.

La [documentazione sulla forza di analisi](https://support.chess.com/en/articles/11845102-why-did-my-move-classification-change-in-game-review) spiega che le etichette possono cambiare tra analisi rapida e revisione completa, e tra impostazioni di forza diverse. Questo è un ulteriore fattore di confronto, non la dimostrazione della causa di ciascuna discrepanza.

## Prossimo passo proposto

Prima di altre tarature: progettare il modello di punti attesi e la gestione delle posizioni già vinte/perse o con matto forzato. Separare la scelta della migliore mossa dal semplice confronto di due analisi indipendenti; usare le varianti UCI per valutare questa scelta. Allineare le categorie comuni alle definizioni pubblicate, dichiarando esplicitamente ciò che è una nostra approssimazione. Conservare i report attuali come baseline, e riservare Partite/7–10 alla validazione dopo l'annotazione. Non introdurre coefficienti dipendenti dal rating senza una base o una verifica.
