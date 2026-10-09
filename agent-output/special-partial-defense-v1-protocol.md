# Difesa critica e prove parziali — protocollo v1

Mantenere soglie, budget e dati congelati. Migliorare il riconoscimento solo usando prove già disponibili, con copertura esplicita; confrontare tutte le 592 semimosse autorizzate e i precedenti falsi positivi.

Per le cache legacy, distinguere radici duplicate della stessa iterazione (ambigue, da rifiutare) da radici ripetute a profondità diverse. In quest'ultimo caso scegliere strutturalmente la riga alla profondità della PV1, oppure quella alla profondità maggiore se la prima manca; non scegliere per score. Verificare legalità di tutte le righe, comprese quelle scartate, e non modificare la cache. Gli snapshot completi del worker mantengono il loro contratto stretto.

Consentire una stima di difesa critica con prove parziali soltanto se la giocata è Migliore/PV1, il risultato indipendente concorda, esiste un'alternativa distinta alla stessa profondità e tutte le alternative disponibili, anche a profondità diversa, sono sotto la banda povera già fissata. Non estendere il criterio di conversione vincente alle iterazioni miste: Qxe5+ personale 3 è un precedente controesempio. Non affermare unicità tra mosse non analizzate.

Per Geniale, il confronto PV1/PV2 a pari profondità non è una prova necessaria della compensazione materiale. Restano score validi, varianti legali, accettazioni coperte e veti sulle alternative vincenti. Un recupero materiale non scelto non blocca una variante di compensazione che contiene un matto indicato da score unbounded e rigiocato fino al matto; lo scambio immediato nella variante scelta rimane escluso. Non rimuovere il veto sulle posizioni già vincenti solo per recuperare i due Geniali storici.

Aggiornare la versione e ricalcolare gli archivi precedenti. Registrare corretti, discordanti e persi: il campione resta di sviluppo e non costituisce validazione indipendente.

## Revisione dopo il primo confronto

L'audit `special-classification-2026-10-09T12-01-39-743Z` recupera i due Grande, ma aggiunge tre discordanti: Qxf6, Bxg5 e Rxe2, tutti recuperi materiali. La guardia precedente riconosceva la ripresa solo quando il pezzo che riprendeva aveva lo stesso tipo di quello perso: questa condizione non descrive una normale ricattura e viene tolta. Resta il controllo di valore recuperato, bersaglio e novità del contesto.

La nuova famiglia parziale viene limitata alla **difesa** in una posizione mantenuta non vincente secondo la banda esistente (massimo 0,60). Non serve a promuovere catture vincenti sulla sola differenza con alternative perdenti. Il criterio quantitativo preesistente sulle iterazioni coerenti conserva il contratto originale. Questa revisione nasce da risultati osservati: anche un eventuale miglioramento successivo resta esplorativo.
