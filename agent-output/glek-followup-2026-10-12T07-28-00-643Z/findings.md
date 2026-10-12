# Esito della prosecuzione e categorie complete

12 ottobre 2026. La correzione di Carlo separa i riferimenti: nella Game Review
anche Ag2 è Geniale; nell'Esploratore è Migliore. La precedente diagnosi di falso
positivo Ag2 rispetto alla Game Review è quindi superata, non sovrascritta.
I nuovi risultati registrano tutte e cinque le scelte come Geniali attese.

## Correzione attivata

Il collector conserva l'ultima iterazione MultiPV completa per ciascuna prima
scelta e restituisce quella associata al bestmove finale. Se la ricerca segue
A -> B -> A e termina durante l'ultima iterazione incompleta, la precedente
iterazione completa di A rimane disponibile. Non si mescolano profondità,
non si scelgono gli score più favorevoli, non si accettano bounds o duplicati.
Memoria limitata a 256 prime scelte. Nessuna ricerca motore aggiunta.

Questa correzione beneficia nuove ricerche e raw rigiocabili. Le vecchie cache
senza raw/snapshot non contengono le iterazioni perdute: non è possibile
ricostruirle da cinque score finali. Il profilo di ricerca e i classificatori
mantengono i loro budget e le loro soglie originarie.

Sulla Glek, rigiocando i raw delle tredici ricerche precedenti, il percorso
standard riconosce De2, d3 e Ag2 come Geniali. Ad3 e Ab5 sono escluse dalla
copertura coerente della giocata nella root standard. Nella ricerca mirata,
che comprende tutte e cinque le scelte ma non tutte le mosse legali, anche
Ad3 è Geniale: 4/5 riferimenti corretti, Ab5 resta Buona.

## Ab5: due blocchi, non soltanto il confine numerico

La perdita nella root mirata è 3.12386 punti, appena oltre il limite Ottima di
3. L'unica variante diagnostica prefissata ammette anche le Buone alla verifica
Geniale, senza cambiare soglie. Non basta: Ab5 diventa candidato rifiutato per
`unresolved-immediate-recovery`, senza promozione a Geniale.

Dopo Ab5 ...dxc3 il Bianco può giocare Axc6+, catturando il cavallo nero c6.
Il guard attuale considera il recupero materiale dopo quella sola cattura:
il saldo bianco torna al livello precedente. È però un recupero provvisorio.
La sequenza legale verificata Ab5 ...dxc3 Axc6+ ...bxc6 bxc3 ha questi saldi
materiali convenzionali dal punto di vista del Bianco:

| Posizione | Saldo materiale Bianco |
|---|---:|
| Prima di Ab5 | +2 |
| Dopo ...dxc3 | -1 |
| Dopo Axc6+ | +2 |
| Dopo ...bxc6 | -1 |
| Dopo bxc3 | 0 |

Il guard è dunque prudente rispetto a un recupero non assestato. Questa
sequenza spiega un limite logico, ma non dimostra che il Nero debba scegliere
ogni continuazione o che qualsiasi controcattura garantisca compensazione.
Non è stato rimosso il guard: protegge altri casi di scambio ordinario e
recupero irrisolto. Una modifica richiede una regola generale sul saldo dopo
le risposte, con verifica sui positivi e negativi, non un'eccezione per Ab5.

## Tutte le categorie: nessun peggioramento, nessun aumento sul campione

Sul campione già studiato di 592 mosse si riproducono 329 etichette, pari al
55.6%. Nessuna etichetta cambia rispetto alla baseline dopo l'introduzione di
Forzata. Anche il candidato che ammette le Buone non cambia alcuna delle 592
etichette; è rimasto disattivato perché qui non dimostra un beneficio.

| Categoria | Corrette / attese | Assegnazioni extra discordanti |
|---|---:|---:|
| Libro | 56/58 | 2 |
| Migliore | 120/178 | 60 |
| Ottima | 83/121 | 132 |
| Buona | 17/94 | 35 |
| Imprecisione | 17/57 | 23 |
| Errore | 10/36 | 8 |
| Errore grave | 8/8 | 3 |
| Grande | 11/24 | 0 |
| Geniale | 1/3 | 0 |
| Mossa mancata | 3/10 | 0 |
| Forzata | 3/3 | 0 |

Le assegnazioni extra misurano disaccordi con i riferimenti disponibili, non
verità scacchistica assoluta. Corrette/attese è recupero delle etichette attese,
non precisione delle assegnazioni. L'8/8 degli Errori gravi non nasconde i tre
falsi positivi già diagnosticati. Il caso Glek è tenuto separato da queste 592
mosse e non viene usato per gonfiare la percentuale complessiva.

Verifiche: 253 test unitari passati, 1 TODO preesistente, 36 file; 12 scenari
browser passati; build senza .env riuscita. Rimane l'avviso storico sul chunk
del repertorio. Zero nuove ricerche motore in questa prosecuzione, 20 input
congelati e cache preservati, nessuna lettura delle partite riservate 7–10.
