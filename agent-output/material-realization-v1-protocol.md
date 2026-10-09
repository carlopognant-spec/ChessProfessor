# Realizzazione materiale e nuova decisione — protocollo v1

Ipotesi: una grande differenza tra la migliore mossa e le alternative non distingue una nuova decisione dalla semplice conclusione materiale di una sequenza. Il nuovo controllo non modifica soglie, cache o file congelati e non dimostra equivalenza con Game Review.

Si cercano due eventi strutturali, verificando mosse legali, FEN consecutive e identità dei pezzi:

1. Ripresa immediata sullo stesso bersaglio, dello stesso tipo di pezzo appena perso, con recupero almeno pari alla perdita. Non include prese intermedie, cambi di bersaglio o riprese con perdita materiale residua.
2. Incasso con lo stesso pezzo di un bersaglio rimasto fermo dopo un precedente doppio attacco con scacco. Il pezzo mosso deve attaccare direttamente sia il re sia il bersaglio dopo la mossa precedente; la cattura finale deve essere legale. Gli attacchi geometrici servono solo a descrivere la sequenza, non a provare il guadagno contro tutte le difese.

Per una candidata Grande, se uno di questi eventi è presente e il contesto motore non mostra un nuovo guadagno di opportunità pari al divario locale già esistente (0,20), l'attribuzione diventa candidata per novità non stabilita e rimane visibile la categoria numerica. Un nuovo guadagno avversario lascia la candidata Grande intatta. Geniale e Mossa mancata conservano la priorità. Dati storici incompleti non vengono inventati.

I test strutturali devono coprire entrambi i colori, catene incoerenti, bersagli cambiati e riprese di valore diverso. Il confronto completo usa le sole otto partite autorizzate, include anche eventuali veri positivi persi e non riscrive il risultato della prima implementazione. La selezione nasce da due discordanti già osservati: anche un miglioramento sul campione resta esplorativo e richiede dati indipendenti.
