# Recupero delle prove già disponibili — protocollo

Non cambiare soglie né utilizzare le etichette nel detector. Confrontare tutte le 592 semimosse autorizzate, conservando i risultati precedenti. Le partite riservate restano escluse; nessuna nuova ricerca motore.

Una comparazione quantitativa PV1/PV2 richiede che entrambe siano legali, unbounded, distinte e alla stessa profondità. Non richiede che anche PV3–PV5 abbiano quella profondità: queste ultime non entrano nel divario. Devono comunque avere score validi e PV legali, senza duplicati. Dichiarare quante alternative sono effettivamente confrontabili e non presentare la copertura parziale come tutte le mosse legali. Le stime vincenti delle altre linee mantengono i veti prudenziali sui sacrifici; non diventano prove di unicità.

Separatamente, recuperare la famiglia già fissata e verificata prima di questa implementazione: Migliore/PV1 non di libro, non terminale o forzata, senza cattura, dopo errore numerico avversario. Il modello congelato è `agent-output/grande-prudent-candidate-v1.json`, con test lasciando fuori una partita per volta. È un criterio empirico esplorativo, non una definizione universale. Non modificarne i predicati né usarlo per ignorare incoerenze tra la valutazione radice e il risultato della mossa.

Misurare prima separatamente il recupero della comparazione, poi l'unione con la famiglia preesistente. Riportare nuovi corretti, nuovi discordanti, persi e sovrapposizioni. L'adozione rimane sperimentale; zero discordanti sul campione non è garanzia generale.
