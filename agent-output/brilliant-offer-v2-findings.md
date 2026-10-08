# Esito Geniale v2 — 8 ottobre 2026

Risultato definitivo: [report](brilliant-offer-v2-2026-10-08T02-16-04-769Z/report.md), [dati completi](brilliant-offer-v2-2026-10-08T02-16-04-769Z/results.json). Protocollo fissato prima del confronto: [protocollo](brilliant-offer-v2-protocol.md).

La variante non migliora la concordanza con i riferimenti: su 592 mosse conserva Nxe5 (partita 6, ply 11), manca entrambi i Geniale storici e introduce due falsi positivi. V1: TP 1, FP 0, FN 2. V2: TP 1, FP 2, FN 2. Ventisei astensioni per accettazioni senza score utilizzabile. Dati di sviluppo già studiati, nessuna validazione indipendente; questi conteggi non stimano la precisione su nuove partite.

## Cosa spiegano i falsi positivi

- Partita 2, Nero, ply 14, O-O: lascia il cavallo a6 in presa, ma la PV è Bxa6 Qc7 Nd3 Bxc3+ bxc3 bxa6 e5 Ne4. Recupera il saldo al quarto e al sesto ply attraverso scambi. Il controllo contro la sola ricattura immediata non distingue questo scambio differito da un sacrificio qualificante. Probabilità locale dopo Bxa6: 0,4638, appena sopra la soglia fissata di 0,45.
- Chigorin–Steinitz, ply 55, Rf3: lascia ancora il cavallo h8 in presa. La PV Rxh8 g4 h6 gxf5 Kg7 Rg3+ Kf8 Qh4 recupera il saldo al quarto ply; il cavallo era già attaccato prima di Rf3. L'offerta legale e la compensazione nella PV non provano che questa specifica mossa introduca una nuova idea. Il riferimento la chiama Migliore.

Queste sono diagnosi sui due errori osservati, non nuove regole validate. Non imporre un divieto generale sul recupero al quarto ply: eliminerebbe anche combinazioni autentiche.

Rb3 resta esclusa da Nf7 e Qf7 già vincenti senza offerta materiale; Rxf5+ da g5 e Qf8+. Non rimuovere il veto soltanto per recuperare quei riferimenti. Le ricerche mirate Qxh8 già disponibili non cambiano alcun esito. Il test di copertura, con alternative artificialmente rimosse soltanto nel test, conferma che l'evidenza supplementare supporta il pezzo lasciato in presa e la difesa che rifiuta; quel test non conta come riconoscimento del caso reale.

Decisione: mantenere v2 come esperimento, senza attivarla nell'app. Grande congelata, Precisione, soglie e cache invariati. Nessuna nuova ricerca, commit o push. Hash degli input invariati. Tredici test mirati passati (otto v2 e cinque audit). Suite app/build/browser NON ESEGUITI.
