# Geniale v4 — alternative dalla stessa posizione

Protocollo: ../brilliant-same-offer-v4-protocol.md. Ipotesi nata da Rac1 già osservata; nessuna validazione indipendente.

| Gruppo | Versione | TP | FP | FN | Precisione | Richiamo |
|---|---|---:|---:|---:|---:|---:|
| development | v3 | 1 | 1 | 0 | 0.5 | 1 |
| development | v4 | 1 | 0 | 0 | 1 | 1 |
| historical | v3 | 0 | 0 | 2 | n/d | 0 |
| historical | v4 | 0 | 0 | 2 | n/d | 0 |
| all | v3 | 1 | 1 | 2 | 0.5 | 0.3333333333333333 |
| all | v4 | 1 | 0 | 2 | 1 | 0.3333333333333333 |

## Casi di riferimento e assegnazioni

- personal-04 ply 55, Rac1, riferimento Migliore: v3 true, v4 false; winning-alternative-with-same-offer; alternative con stessa offerta: Rab1 (b@e4); Rfc1 (b@e4); Rfb1 (b@e4).
- personal-06 ply 11, Nxe5, riferimento Geniale: v3 true, v4 true; supported-material-offer; alternative con stessa offerta: nessuna comparabile.
- game-1-chigorin-steinitz-1892 ply 53, Rb3, riferimento Geniale: v3 false, v4 false; winning-nonsacrifice-alternative; alternative con stessa offerta: h4 (n@h8).
- game-1-chigorin-steinitz-1892 ply 61, Rxf5+, riferimento Geniale: v3 false, v4 false; winning-nonsacrifice-alternative; alternative con stessa offerta: nessuna comparabile.

Audit: 6 mosse con 11 righe comparabili vincenti e stessa offerta. Una sola modifica alle assegnazioni non implica che l'audit riguardi una sola posizione.

## Tutti i confronti positivi

- personal-04 47 f3 (Ottima, base Ottima): [{"uci":"g2h3","san":"Kh3","depth":15,"evalCp":1284,"mate":null,"probability":0.9612088655397639,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"a8","type":"b","color":"w"}]}].
- personal-04 55 Rac1 (Migliore, base Ottima): [{"uci":"a1b1","san":"Rab1","depth":19,"evalCp":null,"mate":5,"probability":1,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"e4","type":"b","color":"w"}]},{"uci":"f1c1","san":"Rfc1","depth":19,"evalCp":null,"mate":5,"probability":1,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"e4","type":"b","color":"w"}]},{"uci":"f1b1","san":"Rfb1","depth":19,"evalCp":null,"mate":6,"probability":1,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"e4","type":"b","color":"w"}]}].
- personal-05 18 b6 (Buona, base Ottima): [{"uci":"d7c6","san":"Qc6","depth":15,"evalCp":831,"mate":null,"probability":0.8886969868517457,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"c5","type":"b","color":"b"}]},{"uci":"d7e7","san":"Qe7","depth":15,"evalCp":708,"mate":null,"probability":0.8544576710630347,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"c5","type":"b","color":"b"}]}].
- personal-05 20 O-O (Migliore, base Migliore): [{"uci":"d7f5","san":"Qf5","depth":14,"evalCp":839,"mate":null,"probability":0.8906599544761572,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"c5","type":"b","color":"b"}]}].
- game-1-chigorin-steinitz-1892 53 Rb3 (Geniale, base Ottima): [{"uci":"h2h4","san":"h4","depth":13,"evalCp":642,"mate":null,"probability":0.8327160444615168,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"h8","type":"n","color":"w"}]}].
- game-1-chigorin-steinitz-1892 55 Rf3 (Migliore, base Migliore): [{"uci":"b3g3","san":"Rg3","depth":13,"evalCp":732,"mate":null,"probability":0.861761726827506,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"h8","type":"n","color":"w"}]},{"uci":"b3h3","san":"Rh3","depth":13,"evalCp":493,"mate":null,"probability":0.7742558331886429,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"h8","type":"n","color":"w"}]},{"uci":"e1e2","san":"Re2","depth":13,"evalCp":493,"mate":null,"probability":0.7742558331886429,"comparable":true,"alternativeRootCount":1,"sameOffers":[{"square":"h8","type":"n","color":"w"}]}].

Confronti a budget limitato: non prove di vittoria contro ogni difesa. Differenze di depth/bound/radici duplicate non diventano score comparabili. Soglie, Grande e app/cache invariati. Nessuna nuova ricerca o commit/push. Suite app/build/browser NON ESEGUITI.
