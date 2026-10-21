// Fixed documented prefix and separately checked authored demonstration.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-02",
  "entries": [
    {
      "id": "sicilian:chekhover-zaitsev",
      "family": "sicilian",
      "title": "Chekhover Zaitsev: 5...Dd7 e cambio in c6",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Nc6",
        "Bb5",
        "Qd7",
        "Bxc6",
        "Qxc6"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-02",
      "contrast": "Dopo 5.Ab5 il Nero interpone la donna in d7 invece dell’alfiere. Il cavallo c6 non è più inchiodato al re, ma sulla diagonale b5-c6-d7 si trova la donna: una cattura in d4 va calcolata insieme all’eventuale cambio delle donne.",
      "whitePlan": "Nel seguito dimostrativo, cambia l’alfiere per il cavallo c6 e togli il pezzo che attacca d4. Dopo ...Dxc6 controlla la pressione su e4, sviluppa i pezzi rimasti e prepara la sicurezza del re. Non dare per obbligatorio il cambio in c6.",
      "blackPlan": "Interponi la donna in d7; dopo Axc6, riprendi con la donna senza doppiare i pedoni. Conservi i due alfieri, entrambi ancora sulle case iniziali: completa lo sviluppo e controlla i tempi che il Bianco può guadagnare attaccando la donna.",
      "endpointReason": "Il percorso termina dopo 6...Dxc6, quando è visibile la differenza rispetto a ...Ad7 e ...Axc6. È un modulo breve sul cambio in c6: lo sviluppo non è completo, entrambi i re sono ancora al centro ed e4 richiede attenzione.",
      "sourceDisclosure": "La fonte identifica la variante fino a 5...Dd7. Il seguito 6.Axc6 Dxc6 è un esempio didattico scelto per confrontare le riprese in c6; non è una continuazione attribuita al catalogo né l’unica linea valida.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Qxd4 Nc6 Bb5 Qd7 Bxc6 Qxc6",
      "editorialNotes": {
        "8": "Ab5 inchioda il cavallo c6 al re. Con ...Dd7 la donna si interpone: spostare il cavallo diventa legalmente possibile, ma può lasciare la donna sulla diagonale dell’alfiere. Questo è diverso dal guadagno gratuito di una donna.",
        "10": "Nel seguito didattico, Axc6 elimina il cavallo che attacca d4; ...Dxc6 riprende con la donna, non con l’alfiere come nel ramo ...Ad7. I pedoni neri non vengono doppiati. La donna c6 guarda e4 lungo c6-d5-e4, ma e4 è difeso dalla donna d4: la pressione non dimostra un guadagno di pedone."
      },
      "provenance": {
        "kind": "documented-prefix-with-authored-continuation",
        "documentedPlies": 10,
        "authoredContinuationPlies": 2,
        "generatedPlies": 0,
        "continuationStatus": "bounded-engine-checked",
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "77915f5f49601838",
        "sourceName": "Sicilian Defense: Chekhover Variation, Zaitsev Defense",
        "sourceEco": "B53",
        "rootPositionId": "position:c2707909c4c54697",
        "engineSignature": "a897efc50d515998412c9ca2c6e480bc770d23575fca52b714d04a9d92a6aa13"
      }
    }
  ]
}
