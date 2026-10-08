# Esito della prova semplice Stockfish

Checkpoint richiesto creato prima dell'esperimento: d833c58. Protocollo fissato in ../stockfish-specials-simple-v1-protocol.md prima di eseguire il nuovo classificatore. Nessuna soglia ritoccata dopo i risultati.

## Risultati reali

| Campione | Grande riconosciute / attese | Grande assegnate erroneamente | Geniale riconosciute / attese | Geniale assegnate erroneamente |
|---|---:|---:|---:|---:|
| Personali 1–6 | 4 / 14 | 3 | 1 / 1 | 0 |
| Due storiche | 0 / 10 | 1 | 0 / 2 | 0 |
| Totale | 4 / 24 | 4 | 1 / 3 | 0 |

La concordanza globale sulle 586 mosse incluse passa da 309 a 310. Il denominatore comprende Libro, tutte le categorie comuni, Mossa mancata, Grande e Geniale; esclude Forzata e matto dato. Non è confrontabile direttamente con precedenti percentuali QA che escludevano le categorie speciali. Nessuna validazione indipendente effettuata.

## Cosa ha funzionato

Il riconoscitore Geniale identifica personale 6, 6.Nxe5 (ply 11): presa di pedone, cavallo accettato con ...Nxe5, saldo a -2, poi d4 e recupero tramite la combinazione. La prima variante Stockfish e la ricerca della posizione successiva concordano sulla risposta e sulla valutazione circa pari. Una buona alternativa non sacrificante esiste, ma non offre già una vittoria netta. Non è un semplice scambio immediato.

Le Grande riconosciute sono personale 2 Rxf2 (ply 31), personale 3 Bxe6 (42), personale 5 Nxh1 (16), personale 6 d4 (13). Rxf2 viene riconosciuta per l'opportunità creata dall'errore, anche se Kxf2 ha una valutazione simile: il ramo non richiede unicità.

## Limiti emersi

I quattro falsi positivi Grande sono personale 3 Qxe5+ (29), personale 3 Rxg8 (46), personale 4 Nxb5 (31), storico Saint-Amant–Staunton Rxe2 (112). Unico modo stimato di conservare il vantaggio non coincide sempre con l'etichetta Grande. Alcune mosse completano una tattica già avviata, oppure sono riprese ordinarie. Escludere tutte le ricatture sarebbe scorretto: Rxf2 è un positivo reale.

Dieci delle 24 Grande attese rimangono non riconosciute per dati insufficienti: profondità diverse fra le prime due linee o radici duplicate. Il classificatore si astiene; non riscrive le cache. Questo è un limite degli input per il confronto, distinto dai falsi positivi della regola.

Per le due Geniale storiche: Rb3 (ply 53) non supera il filtro Migliore perché l'analisi locale la classifica Ottima; Rxf5+ (61) ha un'altra alternativa già nettamente vincente, quindi il protocollo la esclude. Il risultato personale 1/1 non dimostra affidabilità di Geniale: nel totale si riconosce solo 1 di 3 esempi.

## Decisione

Prototipo conservato come esperimento riproducibile, senza collegamento all'app. La semplificazione riduce il costo a zero nuove ricerche, ma Grande produce quattro falsi positivi su otto assegnazioni; non soddisfa l'obiettivo di elevata somiglianza a Chess.com. La prossima ipotesi da studiare è la distinzione fra nuova decisione critica e prosecuzione di una tattica. Non è stata aggiunta una regola ad hoc per eliminare questi quattro esempi.

Per ripetere il confronto: `node scripts/stockfish-specials-simple-experiment.js` dalla radice del progetto. Ogni esecuzione crea una cartella distinta.

## Verifica

- 592 mosse ripercorse legalmente; PV candidate controllate.
- Hash dei 16 file fixture/cache e del libro invariati.
- 11 test del prototipo e 17 test precedenti: 28 superati.
- Controllo sintattico dei due nuovi script superato.
- Nessuna nuova ricerca motore, lettura .env o partite 7–10, modifica all'app, alle soglie comuni o alle baseline QA.
- Suite app/build/browser: NON ESEGUITI, perché l'app non è cambiata.
- Il nuovo esperimento resta successivo alla commit di checkpoint, non incluso in una seconda commit. Nessun push.
