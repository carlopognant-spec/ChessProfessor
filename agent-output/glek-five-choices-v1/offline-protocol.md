# Controllo offline della prima causa di rifiuto

Fissato dopo la raccolta ma prima di questa verifica: nessuna ricerca motore.
Non modificare raw, manifest, results.json o classificatore.

La root standard e quella mirata hanno specialLines vuoto: l'ultima iterazione
completa ha una prima scelta diversa dal bestmove finale, mentre quella finale
è incompleta. Questo è un rifiuto di copertura, non una prova contro il sacrificio.

Per distinguere le cause, rigiocare i raw e conservare in ordine temporale
l'ultima iterazione completa che abbia PV1 uguale al bestmove finale. Non
scegliere l'iterazione per score o etichetta attesa. Applicare la stessa regola
alle tredici ricerche e passare le copie così ottenute allo stesso classificatore.
Conservare anche gli score e le linee finali originali.

Questa è una variante diagnostica della raccolta delle evidenze, non il percorso
di produzione. Riportare separatamente root standard e mirata; quest'ultima
copre soltanto i cinque candidati. Non applicare la variante all'app sulla base
di questo caso e non inventare un'eccezione per Ag2 se manca una differenza
scacchistica dimostrata rispetto alle altre quattro scelte.
