# Grande v3 — proposta dopo diagnosi di v1/v2

7 ottobre 2026. Un solo punto: diagnosi offline e progettazione. Nessuna nuova ricerca, nessuna modifica a file esistenti/app/cache. Questo documento non attiva regole e non sostituisce i risultati precedenti.

## Evidenza reale da v2

Fonti lette: results.json ed evaluation.json in grande-progressive-v2-2026-10-07T15-24-36-014Z. Le etichette P1–P6 sono già state osservate: la v3 sarebbe progettata sullo sviluppo, NON fissata prima di vedere questi dati e NON una validazione indipendente.

Tra i 14 attesi Grande: uno riconosciuto, sei esclusi per alternativa sopra la guardia, tre per oscillazione, uno per score della giocata sotto guardia, due esclusi inizialmente per score mate e uno rimasto senza etichetta perché nella conferma passa da cp a mate. La tabella seguente riporta le 13 mancate assegnazioni.

| Motivo attesi non riconosciuti | Numero |
|---|---:|
| Alternativa sopra la guardia | 6 |
| Oscillazione oltre 50 cp | 3 |
| Giocata sotto la guardia | 1 |
| Score mate nel filtro iniziale | 2 |
| Passaggio cp→mate durante raccolta | 1 |
| Totale attesi non riconosciuti | 13 |

Esempi diagnostici, tutti cp dal lato del giocatore:

| Partita/ply | Giocata ai due budget | Alternativa osservata | Implicazione |
|---|---|---|---|
| P2/31 Rxf2 | +727/+769 | Kxf2 +728, solo 200k | Non è dimostrata unica buona mossa; un'altra presa è comparabile al primo budget |
| P4/22 Qb4 | +321/+333 | Qc7 +96, solo 200k | “Tutte le altre perdenti” esclude mosse che possono dare vantaggio con alternative circa pari |
| P5/27 Qxa8 | +665/+691 | Qf3 +59, solo 200k | Stesso limite semantico, mancano ancora conferma alternativa e copertura completa |
| P6/31 Nd5 | +477/+508 | Nd1 +226, solo 200k | Alternativa vantaggiosa; non chiamarla perdente o pari per recuperare l'etichetta |
| P3/19 Nxd6+ | +111/+112 | h3 −718/−658 | 60 cp di oscillazione, ma la variante osservata resta molto peggiore; altre prove possono ancora mancare |
| P4/29 Nd6+ | +738/+759 | Qa4 −884/−1005 | Oscillazione 121 cp su una variante che resta molto peggiore |

Non dedurre unicità da queste singole alternative. Non presentare la categoria Chess.com come errata perché diversa dalla nostra definizione locale.

## Scelta proposta

Conservare la verifica di tutte le mosse legali e le protezioni correnti. Proporre due rami di Grande, mantenendo separato un ramo mate futuro. Nessuna regola di “mossa decisiva” basata sul solo salto rispetto alla mossa avversaria: una mossa buona non crea da sola un aumento oggettivo del valore della posizione.

Le nuove costanti sono scelte euristiche dichiarate, non definizioni ufficiali Chess.com e non valori calibrati affidabilmente. Servono approvazione prima di qualsiasi esperimento v3. Nessun modello rating inventato.

### 1. Stabilità rilevante per la decisione

Per ogni radice r con score cp ai due budget: low(r)=min(score200k,score1M)−50; high(r)=max(score200k,score1M)+50. Mantenere 50 cp come margine operativo proposto, non intervallo di confidenza.

Rimuovere soltanto nel FUTURO esperimento v3 il veto automatico abs(score200k−score1M)>50. Al suo posto richiedere che l'intero inviluppo sostenga i requisiti del ramo. Un'oscillazione larga restringe le conclusioni possibili; se attraversa un confine rilevante, astensione. Non scegliere lo score migliore dei due e non usare una media per nascondere l'incertezza.

Una variante −884/−1005 non rende automaticamente instabile l'unicità; una giocata −40/+40 può invece non sostenere una conclusione positiva. Anche score concordanti non sono una prova matematica. Tutte le radici restano obbligatorie.

### 2. Ramo A: unica difesa che conserva la posizione

Prima variante v3: mantenere i confini di v2 per isolare il cambiamento della stabilità. Giocata low>=0, OGNI alternativa high<=−200, distacco prudente low(giocata)−max(high(alternative))>=200.

Questo ramo continua a escludere mosse con altre difese accettabili. Non estendere automaticamente a posizioni già stimate perdenti. I risultati devono distinguere il guadagno dovuto al controllo di stabilità dai casi aggiunti dal ramo B.

### 3. Ramo B: unica continuazione con vantaggio vincente stimato

Proposta preventiva per un esperimento distinto, da approvare: low(giocata)>=+300 cp; high di OGNI alternativa<=+150 cp. Il distacco prudente è quindi almeno 150 cp. Questi termini descrivono fasce locali di valutazione, non probabilità certe di vittoria/patta né Expected Points Chess.com.

Il margine di 50 rimane: una giocata osservata a +321/+333 ha low=+271 e quindi non passa questo ramo. È un caso ambiguo secondo la proposta, non un motivo per portare la soglia a +271 dopo averlo visto. Una seconda alternativa a +226 supera già il limite con la guardia; non abbassarne il valore per includere Nd5.

Il ramo B non serve a classificare ogni mossa migliore in posizione già vinta. Se un'altra radice conserva vantaggio sopra la fascia prevista, niente Grande per unicità. Rxf2 contro Kxf2 quasi equivalente resta escluso dalla definizione proposta finché non esistono altre prove di decisività.

### 4. Matti: ramo separato, senza conversione cp artificiale

P1/47, P2/73 e P5/37 mostrano un limite del filtro cp-only. Non convertirli a +1000 cp per applicare i rami A/B. Il ramo mate richiede una politica separata: distinguere matto trovato, unica mossa che mantiene il matto e alternative che conservano comunque una vittoria facile; una PV legale fino al matto non prova tutti i controfattuali. Nessuna nuova etichetta mate proposta in questo punto.

## Come verificare la proposta senza inseguire gli attesi

1. Primo prossimo punto consigliato: replay OFFLINE del solo ramo A con nuovo controllo di stabilità su TUTTE le ricerche v2 già raccolte, senza altri go. Prendere anche i negativi, mantenere denominatore 14 esplicito e astensioni separate. Nessuna ricostruzione delle radici mancanti.
2. Bloccare il report del ramo A prima di decidere se raccogliere nuove radici. Non allentare automaticamente i confini se non recupera esempi.
3. Ramo B soltanto dopo approvazione specifica della politica numerica. Manifest/costo separati, ricerche esistenti riusabili con FEN/UCI/motore/budget compatibili. Niente nuovi go alla sola creazione di questo documento.
4. Ramo mate e Geniale successivi. Non allargare insieme tutte le regole: rendere attribuibile ogni cambiamento.
5. P1–P6 rimangono sviluppo. Per la validazione indipendente bloccare versione, protocolli e criteri prima di leggere 7–10, e ottenere l'autorizzazione richiesta. Non promettere percentuali di equivalenza da questi esperimenti.

## Stato e limiti

ESEGUITO: lettura dei risultati sperimentali v2 e del confronto già salvato; diagnosi; creazione di questo documento.

NON ESEGUITO: replay v3, nuove letture delle fixture, nuove ricerche motore, modifica soglie/classification.js, implementazione app, test/build/browser, commit/push.

STOP. Prossimo punto: replay diagnostico del ramo A sul materiale già raccolto; non attivazione delle categorie.
