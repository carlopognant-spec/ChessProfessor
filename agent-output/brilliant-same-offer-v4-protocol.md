# Geniale v4 — alternative vincenti con lo stesso pezzo in presa

8 ottobre 2026, protocollo prima del confronto. Ipotesi derivata dall'errore Rac1 già osservato: sviluppo adattato, non validazione indipendente. Nessuna nuova ricerca motore, soglia, modifica a file precedenti/app/Grande/cache o lettura .env/partite 7–10. Nessun commit/push.

Conservare v3 e le 30 nuove valutazioni delle accettazioni. Aggiungere soltanto un controllo sulle offerte qualificanti attribuite come nuove da v3:

- Limitarsi al pezzo lasciato sulla propria casella, non al pezzo appena mosso.
- Dalla STESSA FEN prima della giocata, ripercorrere le alternative root salvate e tutte le loro PV. Enumerare legalmente le accettazioni materiali dell'alternativa con il saldo riferito alla medesima posizione iniziale.
- Confrontare una root della giocata e una root alternativa entrambe senza bound, con depth positiva identica, probabilità locale almeno 0,75 (soglia esistente), radici distinte e nessuna duplicazione della giocata.
- Se l'alternativa lascia catturabile lo STESSO pezzo (colore/tipo/casella) senza muoverlo ed è già vincente secondo quel criterio, l'offerta è disponibile anche senza la giocata specifica. Non considerare tale offerta una prova sufficiente per Geniale.
- Se tutte le offerte nuove qualificanti sono escluse da questo confronto, v4 non assegna Geniale. Se ne resta una, mantenere v3. Pezzi diversi e depth diverse non costituiscono questa evidenza; non attribuire un punteggio a una presa non ricercata.

Il confronto non dimostra che le alternative siano equivalenti contro ogni difesa, né che la mossa sia priva di creatività. Identifica una vittoria stimata già disponibile con la medesima offerta: amplia il veto sulle alternative senza offerta, senza rimuoverlo. Non elimina tutti i sacrifici in posizioni valutate favorevolmente, né vieta recuperi al quarto ply.

Audit sulle offerte materiali di tutte le 592 mosse, inclusi i tre Geniale di riferimento. Prima classificare senza annotazioni, poi confrontare v3 completa/v4: TP/FP/FN, cambiamenti, eventuali positivi persi, righe comparabili/incomparabili e identità del pezzo. Nessuna attivazione anche se scompare Rac1. Grande rimane congelata; non convertire Geniale esclusi in Grande.
