# Esito della revisione Rb3 / Rxf5+

L'audit finale è [report.md](report.md), con [dati completi](results.json) e [script ripetibile](../../scripts/audit-brilliant-causality.js). Le due cartelle precedenti di questa sessione sono esecuzioni preliminari: questa include le prove supplementari anche nella posizione precedente, mantenendo distinta la fonte di ogni score.

Sono state enumerate le offerte su tutte le 592 mosse consentite. Riutilizzate 32 ricerche esistenti, nessuna nuova ricerca. Dei 213 eventi di offerta: 93 nuovi, 30 già compensati, 84 senza copertura precedente/attuale sufficiente, 6 attualmente sfavorevoli. Le etichette non sono state modificate: 15/37 riconoscimenti, nessun falso positivo osservato nel campione di sviluppo.

Rb3 sacrifica il cavallo h8, non la torre. Qxh8 è compensata ora, ma non abbiamo la valutazione di Qxh8 dopo Nxh8, prima di Bxd4. La sola precedente possibilità di cattura non prova che il sacrificio fosse già buono. Inoltre h4 lascia il medesimo cavallo in presa con score quasi identico a Rb3 alla stessa depth. Mancano entrambe le valutazioni per attribuire a Rb3 la compensazione.

Rf3 è un controllo utile: grazie alle due ricerche Qxh8 dopo Rb3, sappiamo adesso che l'offerta del cavallo era già compensata prima di Rf3. Non va promossa soltanto perché la sua PV contiene un sacrificio favorevole. Questa informazione emerge riutilizzando correttamente le ricerche anche come storia, senza ricerche aggiuntive.

Rxf5+ introduce una nuova offerta della torre e obbliga Qxf5, unica risposta legale. La PV con stima mate -6 è completa e termina in matto. Il motivo tattico è supportato; il blocco riguarda la necessità del sacrificio in una posizione con altre mosse già molto favorevoli. Non trovare mate a depth 14/15 nelle alternative non permette di concludere che il mate a depth 42 sia esclusivo di Rxf5+. Conservare il blocco finché manca un confronto omogeneo.

## Prove mancanti, nessuna esecuzione programmata

- Qxh8 (`c8h8`) dopo 26.Nxh8: `r1q4N/pp5p/1bp2k2/3p1n1Q/P2P4/8/5PPP/1R2R1K1 b - - 0 26`.
- Qxh8 (`c8h8`) dopo l'alternativa 27.h4: `r1q4N/pp5p/2p2k2/3p1n1Q/P2b3P/8/5PP1/1R2R1K1 b - - 0 27`.
- Confronto indipendente e omogeneo delle root `f3f5`, `g4g5`, `h6f8` dalla stessa FEN prima di 31.Rxf5+: `8/pp1q3p/2p2krQ/3p1n2/P2b2P1/5R2/5P1P/4R1K1 w - - 3 31`.

Le prime due catture sono state verificate legali. Per una futura raccolta occorre un nuovo manifest con budget prefissato e contabilità dei nodi; queste posizioni non autorizzano né avviano nuove ricerche. Anche un confronto favorevole resterebbe evidenza su due casi studiati, non validazione generale.

Verifica di questo intervento: audit completato e hash invariati; 23 test mirati di compensazione, attribuzione e confronto della stessa offerta superati; controllo sintattico dello script e diff check senza errori. Nessun cambiamento al codice dell'app, quindi suite app/browser/build non rieseguite. Nessun commit/push.
