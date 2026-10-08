# Perché mancano 18 Grande e quale famiglia studiare

[Report completo](report.md), [risultati e hash](results.json), [protocollo](../grande-missed-families-v1-protocol.md).

Tutte le 18 Grande mancate sono già Migliore e PV1 nel percorso corrente: la causa di queste mancate assegnazioni non è il filtro iniziale sulla categoria o sulla scelta del motore. È il limite della singola regola congelata, che copre soltanto risposte senza presa a un precedente errore numerico locale.

| Famiglia esclusa | Numero | Esempi |
|---|---:|---|
| Presa dopo errore locale | 5 | Bxf7 e Rxf2 della personale 2, Bxe6 della 3, Nxh1 della 5, Nxc3 nella Saint-Amant–Staunton |
| Presa senza errore precedente riconosciuto | 4 | Qxc7, Nxd6+, Qxa8, axb4 |
| Mossa senza presa e senza errore precedente riconosciuto | 9 | d4 e Nd5 della personale 6; Nc4, c6, e6+, Re1, Qh5 nella Chigorin–Steinitz; Ne4 e Bf3 nella Saint-Amant–Staunton |

La categoria precedente è quella numerica dell'app, non quella di Chess.com. Una differenza nel riconoscere l'errore precedente può quindi influenzare questa famiglia; non è stata corretta adattando le soglie ai riferimenti.

## Controfattuale eseguito in memoria

Eliminando soltanto capture=false e mantenendo tutte le altre guardie, Grande passa da TP 6 / FP 0 / FN 18 a TP 11 / FP 8 / FN 13. Tredici nuove assegnazioni: cinque riferimenti Grande e otto di altre categorie. Tra le otto c'è anche Rxf5+ storico, riferimento Geniale che il rilevatore Geniale non riconosce: promuoverlo automaticamente a Grande non risolve il disaccordo.

Il risultato è dunque più copertura con troppi errori osservati. Nessuna modifica al modello congelato o al suo hash. Non unire automaticamente questa regola alla precedente.

## Indizi tattici e negativi

Tra i 24 positivi Grande e 164 negativi idonei con categoria locale Migliore/PV1 (Geniale già assegnate protette):

| Indizio | Positivi | Negativi |
|---|---:|---:|
| Scacco dato | 6 | 9 |
| Risposta a scacco | 2 | 17 |
| Ricattura | 1 | 26 |
| Doppio attacco geometrico a pezzi non pedoni, incluso il re | 5 | 5 |
| Attacco geometrico a re e donna | 2 | 1 |

Gli indizi da soli non sono etichette Grande. Nel gruppo delle mancate, d4 attacca alfiere e cavallo, Nxd6+ attacca re e alfiere, e6+ attacca re e donna e Nxc3 attacca due torri. Sono situazioni coerenti con la famiglia di forchette indicata da Carlo, ma attacco geometrico non prova guadagno: contano inchiodature, cattura dell'attaccante e difese disponibili. Un distacco root confrontabile non prova unicità; dove le depth differiscono il report non calcola il distacco cp.

Prossimo controllo preparato: [dieci candidati di doppio attacco](../grande-fork-audit-candidates-v1.json), scelti con gli stessi criteri sul campione intero, senza usare la categoria attesa per selezionarli. L'esame delle difese legali è NON ESEGUITO; nessun nuovo go previsto dal manifest. Anche una forchetta valida non basta da sola per assegnare Grande: va confrontata con le alternative e con i negativi.

## Verifiche

Audit su 592 mosse eseguito, controfattuale in memoria, 13 test delle feature e del modello Grande passati. Nessun fitting, nuova ricerca, modifica a file precedenti/app/Grande/Geniale/cache, lettura .env/7–10, commit/push. Hash degli input invariati. Suite app/build/browser NON ESEGUITI. Diagnosi su dati già studiati, nessuna validazione indipendente.
