# Diagnosi degli Errori discordanti

Motore Stockfish 16, MultiPV 5, depth 12 vs 18. Soglie invariate. Cache di produzione intatte. Nuova sessione UCI per ogni coppia di posizioni diagnostiche.

Campione: tutti i 22 ply etichettati Errore da Carlo/chess.com ma discordanti a depth 12; non include i 5 già concordanti.
A depth 18: 4/22 coincidono con Errore; 10/22 cambiano categoria; 3/22 avevano almeno uno score oltre il limite ±1000 del modello a depth 12.

Questo campione è selezionato sulle discrepanze: non è una misura di accuratezza complessiva a depth 18. Analisi più profonda non equivale alla verità chess.com. Non conosciamo motore, tempo, modello di probabilità o regole esatte della sua Game Review. Il confronto non isola completamente profondità e stato della hash.

| Partita | Ply | SAN | Categoria d12 | Categoria d18 | Drop d12 | Drop d18 | Best cp d12/d18 | Played cp d12/d18 | Best mate d12/d18 | Played mate d12/d18 | Clamp d12/d18 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| personal-01 | 31.000 | g4 | Imprecisione | Errore | 9.870 | 14.522 | 127.000/118.000 | -32.000/-116.000 | N/D/N/D | N/D/N/D | false/false |
| personal-01 | 44.000 | g5 | Imprecisione | Imprecisione | 7.378 | 7.623 | -61.000/-94.000 | -182.000/-221.000 | N/D/N/D | N/D/N/D | false/false |
| personal-01 | 46.000 | Nf8 | Errore grave | Errore grave | 24.677 | 28.406 | -204.000/-215.000 | -766.000/-952.000 | N/D/N/D | N/D/N/D | false/false |
| personal-01 | 50.000 | Nd7 | Imprecisione | Migliore | 7.586 | 0.000 | -1036.000/N/D | N/D/N/D | N/D/-13.000 | -1.000/-1.000 | true/false |
| personal-02 | 36.000 | Bg6 | Ottima | Ottima | 1.161 | 1.304 | -582.000/-600.000 | -613.000/-636.000 | N/D/N/D | N/D/N/D | false/false |
| personal-02 | 54.000 | Ke7 | Migliore | Migliore | 0.387 | 0.000 | -943.000/-1103.000 | -963.000/-1197.000 | N/D/N/D | N/D/N/D | false/true |
| personal-02 | 64.000 | h6 | Buona | Imprecisione | 3.372 | 6.060 | -675.000/-738.000 | -788.000/-1258.000 | N/D/N/D | N/D/N/D | false/true |
| personal-02 | 66.000 | Kg6 | Imprecisione | Migliore | 5.089 | 0.000 | -772.000/-1112.000 | -1194.000/-3646.000 | N/D/N/D | N/D/N/D | true/true |
| personal-03 | 6.000 | f5 | Imprecisione | Imprecisione | 5.591 | 5.328 | -86.000/-97.000 | -178.000/-185.000 | N/D/N/D | N/D/N/D | false/false |
| personal-03 | 43.000 | dxe6 | Imprecisione | Errore | 9.059 | 10.181 | -502.000/-499.000 | -756.000/-792.000 | N/D/N/D | N/D/N/D | false/false |
| personal-03 | 79.000 | Ke3 | Ottima | Imprecisione | 1.139 | 8.124 | -631.000/-672.000 | -664.000/-3713.000 | N/D/N/D | N/D/N/D | false/true |
| personal-04 | 21.000 | e5 | Buona | Imprecisione | 3.290 | 5.978 | -100.000/-97.000 | -154.000/-196.000 | N/D/N/D | N/D/N/D | false/false |
| personal-04 | 32.000 | cxb5 | Migliore | Migliore | 0.118 | 0.223 | -566.000/-600.000 | -569.000/-606.000 | N/D/N/D | N/D/N/D | false/false |
| personal-04 | 38.000 | Nf5 | Buona | Buona | 3.008 | 3.740 | -656.000/-683.000 | -752.000/-812.000 | N/D/N/D | N/D/N/D | false/false |
| personal-04 | 40.000 | Nxd4 | Buona | Errore | 4.102 | 11.609 | -798.000/-812.000 | -984.000/N/D | N/D/N/D | N/D/-12.000 | false/false |
| personal-04 | 48.000 | Nd4 | Migliore | Migliore | 0.195 | 0.000 | -989.000/N/D | -1276.000/N/D | N/D/-7.000 | N/D/-5.000 | true/false |
| personal-04 | 50.000 | Ne2 | Migliore | Migliore | 0.000 | 0.000 | N/D/N/D | N/D/N/D | -6.000/-6.000 | -3.000/-3.000 | false/false |
| personal-04 | 54.000 | Kd7 | Migliore | Migliore | 0.000 | 0.000 | N/D/N/D | N/D/N/D | -8.000/-7.000 | -6.000/-5.000 | false/false |
| personal-05 | 13.000 | Bxd7+ | Errore grave | Errore | 20.514 | 19.812 | 70.000/56.000 | -268.000/-271.000 | N/D/N/D | N/D/N/D | false/false |
| personal-05 | 26.000 | Nf2 | Buona | Buona | 4.082 | 3.598 | -337.000/-372.000 | -418.000/-446.000 | N/D/N/D | N/D/N/D | false/false |
| personal-06 | 18.000 | Bg4 | Imprecisione | Imprecisione | 8.729 | 6.854 | -45.000/-56.000 | -188.000/-168.000 | N/D/N/D | N/D/N/D | false/false |
| personal-06 | 34.000 | gxf6 | Buona | Ottima | 5.000 | 2.384 | -576.000/-578.000 | -721.000/-643.000 | N/D/N/D | N/D/N/D | false/false |
