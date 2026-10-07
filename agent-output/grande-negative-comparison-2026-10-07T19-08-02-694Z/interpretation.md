# Grande: confronto completato senza nuovi dati

Analisi descrittiva di 592 mosse delle partite personali 1–6 e delle due storiche. Dopo le esclusioni documentate in results.json: 525 mosse, 24 Grande e 501 con altre etichette. Le storiche sono materiale di studio, non validazione indipendente. Nessuna lettura delle partite 7–10.

## Risultato

| Segnale osservato | Grande | Altre etichette |
|---|---:|---:|
| Scacco | 6 | 35 |
| Attacco geometrico a due pezzi non pedoni | 5 | 13 |
| Matto forzato segnalato per la mossa giocata | 2 | 24 |
| Mossa uguale alla prima linea del motore | 24 | 162 |
| Prima linea dopo errore numerico locale dell'avversario | 11 | 7 |

Questi conteggi non sono errori di un classificatore attivo: sono corrispondenze delle caratteristiche con le annotazioni disponibili. Un attacco geometrico può essere neutralizzato; un matto può essere già disponibile con più mosse. Le ricerche memorizzate possono inoltre discordare fra posizione prima e dopo la mossa.

La combinazione prima linea + errore precedente separa meglio questi casi delle sole tattiche, ma copre soltanto 11 delle 24 Grande e comprende 7 mosse con altre etichette. Non è sufficiente per attivare Grande nell'app.

## Controesempi concreti da conservare

- Personale 3, 15.Qxe5+ (ply 29): prima linea, scacco, doppio attacco geometrico e risposta a un errore numerico locale; etichetta Migliore. Il divario fra le prime due linee memorizzate è 665 cp. Anche un ampio divario non dimostra da solo Grande.
- Personale 5, 13.Bxg5 (ply 25): prima linea, cattura di torre dopo errore grave e ricattura; etichetta Migliore. Divario fra le prime due linee 1461 cp. È l'unico negativo della combinazione prima linea + cattura di torre/donna + errore locale precedente, contro tre Grande: quattro osservazioni sono troppo poche per adottare una regola.
- Personale 3, 53...a1=Q (ply 106): etichetta Migliore; entrambe le prime linee indicano matto in 5. La presenza del matto non prova l'unicità della mossa.
- Personale 4, 25.Bxe4 (ply 49): prima linea e segnale di matto; etichetta Buona. Il motore locale e le annotazioni non sono intercambiabili.
- Personale 2, 16.Rxf2 (ply 31): Grande e ricattura. Escludere tutte le ricatture per eliminare il precedente falso positivo 23...Rxg8 scarterebbe anche un positivo reale.

I divari citati sono confronti fra linee root alla stessa profondità, senza bound, ma coprono solo il MultiPV disponibile. Non dimostrano che tutte le altre mosse legali siano peggiori.

## Direzione del prossimo esperimento

Separare tre ipotesi: risorsa che evita la sconfitta, opportunità che crea un vantaggio decisivo, e percorso di matto. Per ciascuna confrontare la mossa giocata con alternative e situazione precedente, così da distinguere un cambiamento concreto dalla prosecuzione di un vantaggio già presente. Scacchi, forchette e catture servono a descrivere il motivo tattico, non come condizioni sufficienti per assegnare Grande.

Prima di un nuovo esperimento fissare criteri e budget. Valutare sia i positivi sia i controesempi elencati, senza adattare soglie a una singola partita. Le nuove partite future serviranno a verificare se le regole generalizzano; nessun risultato di questo studio costituisce validazione indipendente. Geniale richiede un protocollo distinto sul sacrificio, non una derivazione automatica da queste caratteristiche.

## Verifiche reali

- Replay legale delle 592 mosse e delle varianti esaminate completato.
- Hash dei 16 file sorgente invariati prima e dopo l'analisi.
- Quattro test delle nuove funzioni di estrazione superati.
- Nuove ricerche motore: zero. App, soglie, classification.js e cache QA non modificati.
- Suite app, build e browser: NON ESEGUITI. Nessun commit/push.

Output completi: results.json e report.md nella stessa cartella.
