# Geniale: diagnosi dei sacrifici e degli scambi

8 ottobre 2026. Audit descrittivo, non nuova regola. I tre riferimenti Geniale sono stati letti per conoscere il problema; l'estrazione seguente percorre comunque tutte le 592 mosse consentite, senza usare le etichette per scegliere risposte o caratteristiche. Non calibrazione indipendente.

Solo personali 1–6 e due storiche, cache Stockfish 19 large 200k già salvate. Nessun motore avviato, app/Grande/soglie/cache/file precedenti invariati; niente .env o 7–10, nessun commit/push.

## Estrazione

- Dopo ogni mossa enumerare tutte le risposte legali che catturano un pezzo non pedone del giocatore. Registrare identità/casa del pezzo offerto, valore e saldo materiale prima/dopo offerta e accettazione, valori 1/3/3/5/9.
- Distinguere pezzo mosso da pezzo lasciato in presa. Segnalare attacchi geometrici già esistenti prima dell'offerta, senza considerarli prova di cattura legale o favorevole.
- Le accettazioni con saldo rispetto a prima dell'offerta almeno -2 sono candidate materiali, come nella soglia v1. Non sono automaticamente Geniale.
- Per ogni risposta cercare una linea child MultiPV corrispondente; se manca, risultato irrisolto. Mai inventare uno score per una risposta fuori MultiPV.
- Ripercorrere le PV salvate e registrare saldi nei primi 8 ply, recupero immediato tramite presa, recupero successivo, matto finale e profondità. Valutazioni normalizzate al giocatore; bound/mate zero o score mancanti restano ignoti.
- Identificare se la miglior difesa child accetta un'offerta o la rifiuta. Un rifiuto non invalida di per sé un sacrificio: lascia da verificare le risposte accettanti.
- Riportare il motivo di mancato riconoscimento della v1, la categoria comune e se esiste una root alternativa già vincente secondo la soglia v1 0,75, con profondità e limiti del confronto.

## Confronto

Contare tutte le offerte materiali tra mosse annotate Geniale e altre categorie; distinguere stessa mossa candidata da più possibili accettazioni. Elencare tutti i casi Geniale, tutte le offerte nei candidati Migliore/Ottima e gli scambi con recupero immediato nelle PV disponibili. Nessun nuovo classificatore adottato sulla base di tre positivi. Scopo: separare filtro troppo stretto, sacrificio rifiutato, posizione già vinta e dati mancanti.
