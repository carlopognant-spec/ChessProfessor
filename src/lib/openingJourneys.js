import {Chess} from 'chess.js'
import {OPENING_LESSONS} from './openingLessons.js'
import {OPENING_STORIES} from './openingStories.js'
import {OPENING_VARIANTS} from './openingVariants.js'
import {openingChallenge,openingPawnChanges} from './openingChallenge.js'
import {openingOpponent} from './openingOpponent.js'
import openingExpansion from '../data/openingExpansion.js'
import caroNotes from './openingCaroNotes.js'
import strategicNotes from './openingStrategicNotes.js'

// Authored teaching continuations, not engine recommendations or game records.
// Each family has one explicitly named route; it does not stand for every variation.
const routes = {
  italian: ['Italiana con c3 e d3', '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. Re1 a6 8. Bb3 Ba7 9. Nbd2 h6 10. Nf1 Re8 11. Ng3 Be6 12. Bc2 d5 13. exd5 Bxd5 14. Be3 Bxe3 15. Rxe3 Qd7 16. Qe2 Rad8 17. Re1 Qd6 18. a3 a5',
    'Il cavallo arriva da b1 a g3 passando per d2 e f1. La torre sostiene e4: osserva quando il Nero rompe con …d5 e come si apre il centro.',
    'Prepara …d5 con lo sviluppo e le torri al centro. Dopo il cambio in d5, attiva i pezzi sulle colonne centrali.'],
  spanish: ['Spagnola chiusa con Re1 e c3', '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. Nb3 a5 15. Be3 a4 16. Nbd2 Bd7',
    'Re1 sostiene e4 e c3 prepara d4. Dopo i cambi al centro, coordina cavalli e alfieri senza abbandonare i pedoni d4 ed e4.',
    'Allarga il gioco con …b5 e …c5. La pressione su d4 deve accompagnarsi allo sviluppo dell’alfiere c8.'],
  sicilian: ['Siciliana aperta con …e6 e …d6', '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. Be2 Be7 7. O-O O-O 8. Be3 Nc6 9. f4 Qc7 10. Qe1 a6 11. Qg3 Bd7 12. Kh1 b5 13. a3 Rac8 14. Rae1 Na5 15. Bd3 Nc4 16. Bc1 Rfe8',
    'Il cambio del pedone d apre il gioco. Coordina f4 e la donna sul lato di re; il centro e4 e il cavallo d4 richiedono ancora attenzione.',
    'La colonna c è semiaperta per il Nero. …a6 e …b5 guadagnano spazio, mentre il cavallo può cercare c4.'],
  french: ['Francese, variante di avanzata', '1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 Nh6 7. b4 cxd4 8. cxd4 Nf5 9. Bb2 Bd7 10. Be2 Rc8 11. O-O Be7 12. Qd3 O-O 13. Nbd2 a6 14. Rac1 Na7 15. Nb3 Bb5 16. Qd2 Bxe2 17. Qxe2 Rxc1 18. Rxc1 Rc8',
    'La catena d4–e5 dà spazio. Sostieni d4 sotto la pressione di donna e cavallo e completa lo sviluppo prima di attaccare.',
    'Colpisci la base d4 con …c5, …Qb6 e …Nf5. Usa la colonna c e cerca attività per l’alfiere campochiaro.'],
  caro: ['Caro-Kann, struttura classica', '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 e6 11. Bf4 Ngf6 12. O-O-O Be7 13. Kb1 O-O 14. Ne4 Nxe4 15. Qxe4 Nf6 16. Qe2 Qa5',
    'Guadagni spazio sul lato di re ma arrocchi lungo. Dopo il cambio degli alfieri coordina donna e torri senza dimenticare la sicurezza sul lato di donna.',
    'L’alfiere esce prima di …e6. Completa lo sviluppo e usa …Qa5 per creare pressione sul lato dell’arrocco bianco.'],
  scandinavian: ['Scandinava con donna in a5', '1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 c6 6. Bc4 Bf5 7. Bd2 e6 8. Qe2 Bb4 9. O-O-O Nbd7 10. a3 Bxc3 11. Bxc3 Qc7 12. Ne5 O-O 13. f3 b5 14. Bb3 a5 15. g4 Bg6 16. h4 h6',
    'Sviluppa i pezzi guadagnando tempo sulla donna. Con gli arrocchi opposti, prepara le spinte sul lato di re e sorveglia …b5 e …a5.',
    'La donna torna in c7 e il re arrocca corto. I pedoni a e b cercano spazio contro il re bianco: calcola prima di aprire linee.'],
  pirc: ['Pirc con sviluppo classico', '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O Nc6 7. d5 Nb8 8. Re1 e5 9. dxe6 Bxe6 10. Bf4 Nc6 11. Qd2 Re8 12. Rad1 Qe7 13. h3 Rad8 14. Bb5 Bd7 15. Bxc6 Bxc6 16. Nd5 Bxd5 17. exd5 Qd7',
    'Lo spazio centrale ti permette di svilupparti. Il cambio en passant apre il centro: porta le torri sulle colonne d ed e.',
    'Il centro bianco diventa un bersaglio dopo …e5. Sviluppa l’alfiere c8 e coordina le torri prima dei cambi centrali.'],
  alekhine: ['Alekhine con cambio centrale', '1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Bg4 5. Be2 e6 6. O-O Be7 7. c4 Nb6 8. exd6 cxd6 9. Nc3 O-O 10. Be3 Nc6 11. Rc1 d5 12. cxd5 Nxd5 13. Nxd5 exd5 14. h3 Bh5 15. Qb3 Qd7 16. Rfe1 Rfe8',
    'Guadagni spazio ma poi scegli di cambiare in d6. Sviluppa i pezzi e usa la colonna c prima che il Nero completi la liberazione centrale.',
    'Dopo aver provocato l’avanzata dei pedoni, gioca contro il centro con …d5. I cambi lasciano un pedone d5 da sostenere con i pezzi.'],
  petrov: ['Petrov con centro aperto', '1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6 7. O-O Be7 8. c4 Nb4 9. Be2 O-O 10. Nc3 Nxc3 11. bxc3 Nc6 12. Re1 Bf5 13. Bf4 Re8 14. Qd2 Qd7 15. h3 Rad8 16. Bd3 Bxd3 17. Qxd3 Bf8',
    'Dopo le catture iniziali costruisci il centro con d4 e c4. Il cambio in c3 cambia la struttura: coordina le torri senza lasciare d4 debole.',
    'Riprendi e4 solo dopo aver scacciato il cavallo con …d6. Sviluppa i pezzi e aumenta la pressione sul centro bianco.'],
  scotch: ['Scozzese con …Bc5', '1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bc4 O-O 8. O-O Bb6 9. Nc2 d6 10. Bxb6 axb6 11. Ne3 Be6 12. Nd2 Rfe8 13. f4 Bxc4 14. Ndxc4 b5 15. Nd2 Qe6 16. Qf3 Rxa2',
    'Il centro aperto richiede sviluppo rapido. Dopo f4 controlla anche il lato di donna: il pedone a2 resta esposto alla torre sulla colonna a.',
    'La donna f6 aumenta la pressione centrale. La ripresa …axb6 apre la colonna a: osserva come la torre può entrare in a2.'],
  vienna: ['Viennese con fianchetto', '1. e4 e5 2. Nc3 Nf6 3. g3 d5 4. exd5 Nxd5 5. Bg2 Nxc3 6. bxc3 Bd6 7. Nf3 O-O 8. O-O Nc6 9. d3 Re8 10. Re1 Bf5 11. Rb1 Rb8 12. Be3 Qd7 13. Qd2 b6 14. Nh4 Be6 15. a4 Ne7 16. a5 Bd5',
    'L’alfiere g2 guarda il centro. Dopo bxc3, usa la colonna b e prepara lo sviluppo dell’alfiere c1; i pedoni doppiati influenzano il piano.',
    'La spinta …d5 contesta subito il centro. Sostieni e5 e coordina gli alfieri sulle diagonali centrali.'],
  'kings-gambit': ['Gambetto di Re accettato con …d5', '1. e4 e5 2. f4 exf4 3. Nf3 d5 4. exd5 Nf6 5. Bb5+ c6 6. dxc6 Nxc6 7. d4 Bd6 8. O-O O-O 9. Nc3 Bg4 10. Bxc6 bxc6 11. Qd3 Re8 12. Bd2 Qc7 13. Rae1 Rad8 14. Ne4 Nxe4 15. Rxe4 Rxe4 16. Qxe4 Be6',
    'Il pedone f offerto accelera il gioco ma espone il re. Arrocca e usa lo sviluppo per contestare le colonne aperte.',
    'Restituisci parte del materiale con …d5 per attivare i pezzi. Il pedone f4 limita il Bianco ma non sostituisce lo sviluppo.'],
  philidor: ['Philidor con sviluppo compatto', '1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Nc3 Nbd7 5. Bc4 Be7 6. O-O O-O 7. Re1 c6 8. a4 Qc7 9. h3 h6 10. Be3 Re8 11. Qd2 Bf8 12. Rad1 a6 13. Ba2 b5 14. dxe5 dxe5 15. Nh4 Nc5 16. f3 Be6',
    'Il vantaggio di spazio ti permette di preparare le torri. Prima di f3 e Nh4, osserva come il cambio in e5 apre la colonna d.',
    'La struttura compatta richiede un piano attivo: …c6 e …b5 danno spazio, mentre …Nc5 sviluppa il cavallo verso il centro.'],
  'queens-gambit': ['Gambetto di Donna rifiutato, cambio in d5', '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 Be7 6. e3 O-O 7. Bd3 Nbd7 8. Qc2 Re8 9. Nge2 Nf8 10. O-O c6 11. Rab1 a5 12. a3 Bd6 13. b4 axb4 14. axb4 b5 15. Bf4 Bxf4 16. Nxf4 Bd7 17. Ra1 Qe7 18. Rxa8 Rxa8',
    'Il cambio in d5 crea una struttura asimmetrica. La spinta b4 attacca la catena sul lato di donna; osserva la risposta …b5 prima di continuare.',
    'Sostieni d5 e prepara lo sviluppo dell’alfiere c8. …a5 e …b5 modificano i bersagli del piano bianco sul lato di donna.'],
  london: ['Londra con …c5 e sviluppo classico', '1. d4 d5 2. Nf3 Nf6 3. Bf4 e6 4. e3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. Bg3 O-O 8. Bd3 b6 9. Ne5 Bb7 10. f4 Ne7 11. Qf3 Nf5 12. Bf2 Be7 13. g4 Nd6 14. g5 Nfe4 15. O-O Rc8 16. Rad1 f6',
    'Sviluppa l’alfiere prima di e3. Ne5 e f4 preparano gioco sul lato di re, ma l’apertura del centro con …f6 obbliga a ricalcolare.',
    'Contesta d4 con …c5 e sviluppa l’alfiere in b7. Contro le spinte bianche, cerca controgioco centrale con …f6.'],
  'kings-indian': ['Est-Indiana con centro chiuso', '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Nd3 f5 11. f3 f4 12. Bd2 g5 13. Rc1 Ng6 14. c5 Nf6 15. Nb5 Rf7 16. Ba5 b6',
    'Dopo d5 il centro è chiuso. Prepara c5 e l’attività sul lato di donna, tenendo conto dell’avanzata dei pedoni neri verso il tuo re.',
    'Il centro chiuso permette di preparare …f5 e …g5. Coordina l’attacco con i pezzi e controlla il controgioco bianco con c5.'],
  grunfeld: ['Grünfeld, variante di cambio', '1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Qc7 11. Rc1 Rd8 12. h3 b6 13. f4 Bb7 14. d5 Na5 15. Bd3 e6 16. c4 exd5 17. exd5 Re8',
    'I pedoni d4 ed e4 danno spazio ma sono bersagli. Sostieni il centro con i pezzi prima di trasformarlo con d5.',
    'Attacca d4 con …c5, l’alfiere g7 e le torri. Dopo d5 cerca di aprire il centro con …e6.'],
  nimzo: ['Nimzo-Indiana con e3 e Bd3', '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 dxc4 10. Bxc4 Qc7 11. Bd3 e5 12. Qc2 Re8 13. Ng5 h6 14. Ne4 Nxe4 15. Bxe4 cxd4 16. cxd4 exd4 17. exd4 Qd6',
    'Ottieni la coppia degli alfieri ma accetti pedoni doppiati. Usa gli alfieri sulle diagonali aperte e osserva come i cambi trasformano il centro.',
    'Il cambio in c3 altera i pedoni bianchi. Combina …c5 ed …e5 con lo sviluppo per mettere il centro sotto pressione.'],
  'queens-indian': ['Ovest-Indiana con doppio fianchetto', '1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 Ne4 8. Qc2 Nxc3 9. Qxc3 f5 10. b3 Bf6 11. Bb2 d6 12. Qd2 Nd7 13. Rad1 Qe7 14. Ne1 Bxg2 15. Nxg2 e5 16. dxe5 Nxe5',
    'Il fianchetto sostiene il centro. Dopo i cambi dei pezzi, coordina le torri e valuta come rispondere alla spinta …e5.',
    'Il controllo di e4 permette al cavallo di entrare al centro. Prepara …e5 con donna, cavallo e pedone d6.'],
  catalan: ['Catalana con centro mantenuto', '1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7 7. Qc2 c6 8. Nbd2 b6 9. e4 Bb7 10. e5 Ne8 11. cxd5 cxd5 12. Re1 Rc8 13. Qd3 Nc7 14. Nf1 Ba6 15. Qd1 Bxf1 16. Bxf1 Nb8',
    'Il fianchetto accompagna l’occupazione del centro. Dopo e5, il cavallo d2 cerca nuove case attraverso f1; valuta il ruolo dell’alfiere g2 dietro la catena.',
    'Mantieni una struttura solida e riorganizza i cavalli dopo e5. La diagonale a6–f1 offre un cambio dell’alfiere.'],
  dutch: ['Olandese con fianchetto nero', '1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 Qe8 8. d5 Na6 9. Nd4 Bd7 10. Rb1 c6 11. b4 Nc7 12. dxc6 bxc6 13. b5 cxb5 14. Ncxb5 Nxb5 15. Nxb5 Bc6 16. Bxc6 Qxc6',
    'Il centro e il fianchetto sostengono il gioco sul lato di donna. Rb1 e b4 preparano l’apertura di linee: segui le ricatture con precisione.',
    '…f5 controlla e4. Completa il fianchetto e contesta la catena bianca con …c6 prima di cercare altre spinte.'],
  benoni: ['Benoni moderna con e4', '1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O 9. O-O Re8 10. Nd2 Na6 11. f3 Nc7 12. a4 b6 13. Nc4 Ba6 14. Bf4 Bxc4 15. Bxc4 a6 16. Qd3 Qd7',
    'Il pedone d5 dà spazio e limita il Nero. Sostieni e4 e sviluppa i pezzi prima di preparare una rottura con e5.',
    'Il pedone d6 richiede difesa, ma l’alfiere g7 e la colonna e danno attività. Prepara il controgioco sul lato di donna.'],
  budapest: ['Budapest con restituzione del pedone', '1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. Bf4 Nc6 5. Nf3 Bb4+ 6. Nbd2 Qe7 7. e3 Ngxe5 8. Nxe5 Nxe5 9. Be2 O-O 10. O-O d6 11. Nb3 b6 12. a3 Bc5 13. Nxc5 bxc5 14. Qc2 Bb7 15. Rad1 Rae8 16. Rd2 Ng6',
    'Restituisci il pedone per completare lo sviluppo. Dopo i cambi, sfrutta la coppia degli alfieri e coordina le torri sulla colonna d.',
    'Recupera e5 senza affidarti a una trappola. Il cavallo e5 e l’alfiere b7 partecipano alla pressione centrale.'],
  english: ['Inglese con …e5 e fianchetto', '1. c4 e5 2. Nc3 Nf6 3. g3 d5 4. cxd5 Nxd5 5. Bg2 Nb6 6. Nf3 Nc6 7. O-O Be7 8. d3 O-O 9. Be3 Be6 10. Rc1 f5 11. Na4 Nxa4 12. Qxa4 Bd5 13. a3 a6 14. b4 Bd6 15. Bc5 Kh8 16. Qc2 Qe7',
    'L’alfiere g2 controlla il centro da lontano. Usa la colonna c e prepara b4, mantenendo il re al sicuro contro …f5.',
    'Il pedone e5 dà spazio e …f5 prepara attività. Coordina gli alfieri al centro e controlla l’avanzata bianca sul lato di donna.'],
  reti: ['Réti con doppio fianchetto', '1. Nf3 d5 2. c4 e6 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. b3 c5 7. Bb2 Nc6 8. e3 b6 9. Nc3 Bb7 10. Qe2 Rc8 11. Rfd1 Qc7 12. Rac1 Rfd8 13. d4 cxd4 14. exd4 dxc4 15. bxc4 Na5 16. Ne5 Bxg2 17. Kxg2 Bd6',
    'Sviluppi i pezzi prima di occupare il centro. La spinta d4 arriva quando le torri sono pronte: i cambi aprono nuove linee per gli alfieri.',
    'Occupa il centro senza lasciare i pedoni indifesi. Rispondi a d4 osservando le colonne che si aprono e il ruolo dei cavalli.'],
  'four-knights': ['Quattro Cavalli con centro aperto', '1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4 5. Nxd4 Bb4 6. Nxc6 bxc6 7. Bd3 d5 8. exd5 cxd5 9. O-O O-O 10. Bg5 c6 11. Qf3 Be7 12. Rae1 Be6 13. Ne2 Rb8 14. b3 Qd7 15. Nd4 Rfe8 16. Nxe6 fxe6',
    'L’apertura del centro dà spazio agli alfieri. Sfrutta la colonna e e porta il cavallo verso d4, controllando le conseguenze dei cambi.',
    'Il pedone c sostiene d5 dopo i cambi iniziali. Sviluppa l’alfiere c8 e attiva le torri prima di cercare l’iniziativa.'],
  larsen: ['Larsen contro un centro con …e5', '1. b3 e5 2. Bb2 Nc6 3. e3 d5 4. Bb5 Bd6 5. f4 Qe7 6. Nf3 f6 7. O-O Bd7 8. Nc3 e4 9. Bxc6 bxc6 10. Nd4 Nh6 11. Qe1 O-O 12. Nce2 c5 13. Nb5 Bxb5 14. c4 Bc6 15. cxd5 Bxd5 16. Nc3 Bc6',
    'L’alfiere b2 preme sulla grande diagonale. La spinta f4 contesta e5; dopo …e4 devi trovare nuove case per i cavalli.',
    'Occupa il centro e sostienilo con i pezzi. Le spinte …e4 e …c5 guadagnano spazio ma lasciano case da controllare.'],
  bird: ['Bird con fianchetto sul lato di donna', '1. f4 d5 2. Nf3 Nf6 3. e3 g6 4. b3 Bg7 5. Bb2 O-O 6. Be2 c5 7. O-O Nc6 8. Ne5 Qc7 9. Nxc6 Qxc6 10. Bf3 b6 11. d3 Bb7 12. Nd2 Rad8 13. Qe1 Qc7 14. Be5 Qd7 15. Qh4 Ne8 16. Bxg7 Nxg7',
    'f4 controlla e5 ma lascia diagonali verso il re. Sviluppa e arrocca prima di portare la donna in h4.',
    'Il centro con d5 e c5 dà spazio. Coordina il fianchetto con le torri e rispondi alle minacce bianche sul lato di re.'],
  trompowsky: ['Trompowsky con cambio in f6', '1. d4 Nf6 2. Bg5 e6 3. e4 h6 4. Bxf6 Qxf6 5. Nc3 d6 6. Nf3 g6 7. Qd2 Bg7 8. O-O-O O-O 9. h4 Nc6 10. Kb1 e5 11. d5 Ne7 12. h5 g5 13. Nh2 Bd7 14. Be2 Rfc8 15. Bg4 Bxg4 16. Nxg4 Qf4',
    'Il cambio in f6 cede la coppia degli alfieri per costruire il centro. Con arrocchi opposti, prepara le spinte h4 e h5 senza trascurare il re in b1.',
    'La donna riprende in f6 e l’alfiere va in g7. Contesta il centro con …e5 e cerca attività sulla colonna c.'],
  colle: ['Colle con preparazione di e4', '1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. O-O O-O 8. dxc5 Bxc5 9. e4 Qc7 10. Qe2 Bd6 11. Re1 e5 12. exd5 Nxd5 13. Ne4 Be7 14. Bc4 Be6 15. Neg5 Bxg5 16. Nxg5 Rad8',
    'Il centro con e3 e c3 prepara e4. Libera il centro con dxc5 e porta la torre in e1 per partecipare alla lotta sulle colonne aperte.',
    'Non lasciare che il Bianco giochi lo schema senza pressione. …c5 ed …e5 contestano il centro e danno case ai pezzi.'],
  bogo: ['Bogo-Indiana con cambio degli alfieri', '1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Bxd2+ 5. Qxd2 O-O 6. Nc3 d5 7. e3 b6 8. Bd3 Bb7 9. O-O Nbd7 10. Rac1 c5 11. cxd5 exd5 12. Rfd1 Re8 13. Bb1 Qe7 14. dxc5 bxc5 15. Qc2 Rad8 16. Ne2 Ne4',
    'Pari lo scacco sviluppando l’alfiere. Dopo il cambio, prepara le torri sulle colonne centrali e osserva la pressione sulla diagonale b1–h7.',
    'Lo scacco iniziale semplifica gli alfieri camposcuro. Contesta il centro con …c5 e cerca una casa attiva per il cavallo in e4.'],
  'old-indian': ['Vecchia Indiana con …e5', '1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. Nf3 Nbd7 5. e4 Be7 6. Be2 O-O 7. O-O c6 8. Re1 Qc7 9. Bf1 Re8 10. h3 Bf8 11. Be3 a6 12. Rc1 b6 13. d5 Bb7 14. b4 cxd5 15. cxd5 Qd8 16. Nd2 Rc8',
    'Lo spazio permette di preparare le torri prima di d5. Dopo il cambio in d5, valuta come sfruttare la colonna c e l’avanzata b4.',
    'L’alfiere si sviluppa in e7 prima di tornare in f8. Prepara controgioco centrale e attività per l’alfiere c8.'],
  nimzowitsch: ['Nimzowitsch con centro chiuso', '1. e4 Nc6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 Nge7 6. O-O h6 7. c3 g5 8. Ne1 Bg7 9. Nd3 O-O 10. f4 f6 11. exf6 Bxf6 12. fxg5 Bxg5 13. Bxg5 hxg5 14. Nd2 Ng6 15. Nf3 Qe7 16. Qd2 g4',
    'Il pedone e5 guadagna spazio. Dopo …f6, i cambi aprono linee verso i re: coordina cavalli e donna senza muovere automaticamente i pedoni.',
    'Il cavallo c6 accompagna …d5. Le spinte …g5 e …f6 cambiano la struttura e richiedono attenzione alla sicurezza del tuo re.'],
  owen: ['Owen con doppio fianchetto', '1. e4 b6 2. d4 Bb7 3. Bd3 e6 4. Nf3 Nf6 5. Qe2 d5 6. e5 Nfd7 7. O-O c5 8. c3 Nc6 9. a3 Be7 10. b4 O-O 11. Be3 Rc8 12. Nbd2 cxd4 13. cxd4 f6 14. exf6 Bxf6 15. Rac1 Qe7 16. Rfe1 e5',
    'Costruisci un centro ampio e sostieni d4 con i pezzi. Il Nero lo attacca con …c5 e …f6: prepara le torri prima che il centro si apra.',
    'Il fianchetto in b7 attacca il centro da lontano. Combina …c5 e …f6 con lo sviluppo per mettere in discussione i pedoni bianchi.'],
  'open-games': ['Apertura di Alfiere con d3', '1. e4 e5 2. Bc4 Nf6 3. d3 Nc6 4. Nf3 Bc5 5. O-O d6 6. c3 O-O 7. Bb3 a6 8. Nbd2 Ba7 9. Re1 h6 10. Nf1 Re8 11. Ng3 Be6 12. Bc2 d5 13. exd5 Bxd5 14. Be3 Bxe3 15. Rxe3 Qd7 16. Qe2 Rad8',
    'Lo sviluppo tranquillo prepara attività centrale. Il cavallo passa per f1 e g3; la torre e1 sostiene e4 prima della rottura …d5.',
    'Completa lo sviluppo e prepara …d5. Dopo i cambi cerca attività sulle colonne d ed e, controllando le minacce al re.'],
  'queens-pawn': ['Donna con sviluppo classico e c4', '1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 c5 5. O-O Nc6 6. b3 Bd6 7. Bb2 O-O 8. Nbd2 b6 9. c4 Bb7 10. Rc1 Qe7 11. Qe2 Rad8 12. Rfd1 Rfe8 13. cxd5 exd5 14. dxc5 bxc5 15. Ba6 Bxa6 16. Qxa6 Ne4',
    'Completa lo sviluppo e prepara c4. I cambi centrali aprono le colonne per le torri e modificano la diagonale dell’alfiere b2.',
    'Contesta d4 con …c5. Dopo i cambi coordina le torri e usa e4 come possibile avamposto del cavallo.'],
  other: ['Sviluppo flessibile da 1.Nc3', '1. Nc3 d5 2. e4 dxe4 3. Nxe4 Nf6 4. Nxf6+ exf6 5. d4 Bd6 6. Nf3 O-O 7. Be2 Re8 8. O-O Nc6 9. c3 Bf5 10. Be3 Qd7 11. Qd2 Rad8 12. Rfe1 Ne7 13. Bf4 Nd5 14. Bxd6 Qxd6 15. Bd3 Bxd3 16. Qxd3 Nf4',
    'Da un primo tratto flessibile passi a una struttura concreta. Sviluppa i pezzi e osserva come i cambi degli alfieri modificano le case disponibili ai cavalli.',
    'I pedoni f doppiati non impediscono lo sviluppo. Attiva le torri e porta il cavallo da e7 a d5 e f4.'],
}

export const OPENING_JOURNEYS = OPENING_LESSONS.map(guide => {
  const [title,pgn,whitePlan,blackPlan]=routes[guide.id]
  const board=new Chess();board.loadPgn(pgn)
  return {id:guide.id,family:guide.id,title,moves:board.history(),whitePlan,blackPlan,
    contrast:'Le basi e un primo impianto completo fino al mediogioco.'}
})

export const ALL_OPENING_JOURNEYS=[...OPENING_JOURNEYS,...OPENING_VARIANTS,...openingExpansion.entries]
export const familyJourneys=family=>ALL_OPENING_JOURNEYS.filter(j=>j.family===family)

const positionKey=board=>board.fen().split(' ').slice(0,4).join(' ')
let sharedStories
const variantNotes={
  'kings-indian:fianchetto':{
    8:'g3 prepara un alfiere sulla grande diagonale, mentre il Nero mette al sicuro il re. Rispetto alla Classica, il Bianco non destina l’alfiere a e2: questo cambia le possibilità di pressione sul centro e sul lato di donna.',
    12:'Dopo l’arrocco bianco, e5 contesta d4. Il Nero non lascia al Bianco un centro indisturbato: prima di scegliere un piano sul fianco bisogna decidere come gestire questa tensione.',
    18:'La torre bianca sostiene e4 dalla colonna e. Con exd4 il Nero cambia la struttura: dopo la ricattura il cavallo bianco può occupare d4, ma diventa anche un pezzo da attaccare guadagnando tempi.',
    20:'Cxd4 centralizza il cavallo; ...Cc5 sviluppa pressione su e4. Il Bianco deve coordinare i pezzi attorno al centro, invece di considerare il fianchetto un attacco già pronto.',
    24:'La donna si collega ai pezzi sviluppati, ma ...Ch5 attacca l’alfiere in f4. Il Nero usa un tempo sul pezzo per disturbare la coordinazione: prima del piano strategico viene la risposta alla minaccia concreta.',
  },
  'kings-indian:four-pawns':{
    8:'f4 completa il fronte di quattro pedoni: il Bianco guadagna spazio, ma ha ancora molti pezzi da sviluppare. Il Nero arrocca e può colpire il centro con c5: lo spazio ha valore solo se può essere sostenuto.',
    12:'d5 chiude la tensione con c5, ma ...e6 attacca subito la base avanzata del centro. Il Nero cerca di aprire linee prima che il vantaggio di spazio si trasformi in un vantaggio di coordinazione.',
    16:'cxd5 ricostruisce il centro con il pedone c; la torre nera entra in e8. La colonna e non è ancora libera: la torre aumenta la pressione sul pedone e4 e sulle eventuali aperture del centro.',
    18:'La spinta e5 entra nel calcolo concreto. Dopo ...dxe5, la ricattura bianca cambia i difensori del centro e libera la colonna d: non basta contare i pedoni avanzati, bisogna contare anche le risposte con tempo.',
    20:'fxe5 mantiene un pedone avanzato, ma ...Cg4 lo attacca. La torre in e8 partecipa alla pressione lungo la colonna: l’arrocco e i cambi successivi richiedono attenzione alle ricatture su e5.',
    24:'I cambi su e5 hanno eliminato la massa di pedoni che occupava il centro. Il Bianco deve ora valorizzare sviluppo e attività dei pezzi; il Nero ha ottenuto il tipo di trasformazione che cercava attaccando il centro.',
  },
  'kings-indian:averbakh':{
    10:'Ag5 mette pressione sul cavallo f6 prima che il cavallo g1 si sviluppi. Il Nero risponde con c5: invece di inseguire l’alfiere, mette alla prova il centro e lascia aperta una trasformazione verso una struttura Benoni.',
    14:'La donna bianca si sviluppa mentre ...exd5 modifica il centro. Dopo la ricattura con il pedone e, il Bianco avrà spazio in d5 e il Nero potrà cercare attività sulle colonne centrali.',
    18:'Cf3 completa un altro pezzo, ma ...Ag4 lo attacca. Osserva i due alfieri: entrambi i colori stanno usando lo sviluppo per creare pressione sui cavalli e influenzare i cambi.',
    24:'h3 chiede all’alfiere nero di decidere. Con ...Axf3 il Nero cede un alfiere per il cavallo: la ricattura e l’attività sulla colonna e contano più di un automatismo sulla coppia degli alfieri.',
  },
  'kings-indian:makogonov':{
    8:'h3 controlla g4 e conserva più possibilità per i pezzi bianchi. Il Nero arrocca: il Bianco deve ancora scegliere come combinare sviluppo, centro e possibile espansione sul lato di re.',
    12:'d5 chiude il centro; il cavallo nero passa da a6 con l’idea di raggiungere c5. Un centro chiuso permette manovre più lunghe, ma occorre riconoscere le case verso cui si dirigono i pezzi avversari.',
    14:'g4 guadagna spazio sul lato di re e controlla f5. Il Nero occupa c5 con il cavallo: i due colori migliorano settori diversi e dovranno collegarli alle rotture centrali.',
    18:'Cge2 sviluppa senza chiudere la strada al pedone f. La risposta ...c6 attacca d5: prima di continuare le manovre sul lato di re, il Bianco deve considerare la trasformazione della catena centrale.',
    28:'La donna bianca collega i pezzi, ma ...f5 mette in discussione e4. La spinta apre possibilità tattiche proprio sul lato dove il Bianco ha avanzato i pedoni: la scelta della cattura decide quali linee si apriranno.',
  },
  'kings-indian:petrosian':{
    12:'Il Bianco chiude con d5 prima di arroccare. Il Nero risponde con a5 e frena l’espansione b4: anche con il centro chiuso, le spinte sui fianchi dipendono dalle case controllate dall’avversario.',
    14:'Ag5 attacca il cavallo f6. Con ...h6 il Nero attacca a sua volta l’alfiere: il Bianco deve scegliere dove conservarlo e quale influenza potrà avere sulle future spinte centrali.',
    20:'Cd2 riorganizza il cavallo bianco. ...Ch7 libera f6, rendendo possibile il passaggio del pedone f da f7 a f5: una ritirata può preparare un’azione, non soltanto cedere spazio.',
    24:'b3 sostiene c4, mentre ...f5 mette sotto pressione e4. I due fronti non sono indipendenti: un cambio nel centro può aprire linee contro il re prima che l’espansione sul lato di donna produca risultati.',
    26:'exf5 e ...gxf5 eliminano i pedoni e bianco e f nero. La colonna g diventa semiaperta per il Nero e il pedone g arriva in f5: sono cambiate insieme le possibilità d’attacco e la copertura del re nero.',
  },
  'kings-indian:gligoric':{
    12:'Ae3 sviluppa l’alfiere mantenendo la tensione d4-e5. ...Cg4 lo attacca subito: il Nero guadagna un tempo, ma deve poi giustificare la posizione avanzata del cavallo con un seguito coerente.',
    14:'Ag5 conserva l’alfiere e mette pressione sul pedone e7 lungo la diagonale. ...f6 sostiene e5 e attacca l’alfiere in g5, ma sposta un pedone vicino al re: ogni tempo guadagnato sull’alfiere modifica anche la struttura difensiva.',
    16:'Ah4 evita l’attacco del pedone f6. Con ...g5 il Nero continua l’inseguimento: il Bianco perde tempi di sviluppo, mentre il Nero avanza altri pedoni della copertura del re.',
    22:'d5 chiude il centro; ...Ce7 riorganizza il cavallo c6. Le manovre dei cavalli e la rottura f5 acquistano importanza perché le colonne centrali non si aprono da sole.',
    26:'Il cambio exf5 permette ...Cexf5: il cavallo da e7 raggiunge una casa attiva. Osserva come una rottura di pedone possa servire soprattutto a migliorare i pezzi.',
  },
  'kings-indian:exchange':{
    12:'dxe5 e ...dxe5 sciolgono la tensione centrale e liberano la colonna d. Le donne possono ora incontrarsi su quella colonna: il tipo di partita cambia già con la scelta di questo cambio.',
    14:'Dxd8 e ...Txd8 eliminano le donne e attivano una torre nera. Con meno possibilità di attacco diretto al re diventano centrali sviluppo, case d’appoggio e attività sulle colonne.',
    18:'Cd5 occupa una casa attiva, ma il Nero cambia con ...Cxd5. La ricattura del pedone c sposterà il centro: prima di cercare un avamposto bisogna considerare anche quale struttura resta dopo il cambio.',
    20:'cxd5 porta il pedone c in d5; ...c6 lo attacca immediatamente. Il Nero non accetta un pedone avanzato indisturbato e cerca di liberare altre case per i propri pezzi.',
    28:'Il cambio degli alfieri in e6 attiva la torre nera. Anche senza donne, una ricattura può creare un pezzo attivo: il Bianco deve coordinare le torri invece di limitarsi a contare i cambi.',
  },
  'kings-indian:bayonet':{
    16:'b4 avvia l’espansione sul lato di donna nella Classica. ...Ch5 prepara il gioco con f5 e attacca case sul lato di re: il Bianco deve collegare la propria iniziativa al controllo del centro.',
    18:'Te1 sostiene e4; ...f5 mette quel pedone sotto pressione. Entrambi hanno mosso per il centro, anche se l’espansione iniziale del Bianco era sul lato di donna.',
    20:'Cg5 aumenta la pressione su e6 e f7. ...Cf6 riporta il cavallo verso il centro e attacca e4: una risposta difensiva può conservare anche un bersaglio da attaccare.',
    22:'Af3 sostiene e4, ma ...c6 attacca d5. Il Nero mette sotto pressione due elementi del centro con risorse diverse: il Bianco deve valutare le tensioni insieme.',
    26:'Ce6 invade il campo nero, ma ...Axe6 cambia l’alfiere per il cavallo. La successiva ricattura trasformerà il pedone d5 in un pedone avanzato in e6: attività e possibili debolezze vanno valutate insieme.',
    28:'dxe6 crea il pedone avanzato in e6; ...fxe4 elimina il pedone e4. Il Bianco deve rispondere alla nuova situazione centrale, senza continuare automaticamente il piano iniziato con b4.',
  },
  'caro:advance':{
    4:'e5 guadagna spazio e chiude la tensione centrale. Il Nero sviluppa l’alfiere prima di e6: l’attacco alla catena dovrà arrivare con c5 o f6, non inseguendo il pedone avanzato senza preparazione.',
    14:'Il cambio in d4 apre la colonna c e obbliga il Bianco a ricostruire il centro. La manovra del cavallo nero prepara il gioco contro d4: non basta aver guadagnato spazio con e5.',
    28:'La rottura f6 mette alla prova la punta della catena. Il Bianco deve scegliere come sostenerla o trasformarla: i cambi sulla colonna f modificheranno anche la copertura dei re.',
  },
  'caro:exchange':{
    4:'Il cambio elimina i pedoni e bianco e d nero. La colonna e è semiaperta per il Bianco, la colonna c per il Nero: una struttura apparentemente tranquilla suggerisce già piani diversi alle torri.',
    18:'Il cambio degli alfieri attiva la donna nera. Prima di cercare un attacco, il Bianco deve completare la sicurezza del re e coordinare i pezzi sulla colonna e.',
    24:'Ce5 usa l’appoggio di d4. Il Nero conserva l’alfiere e il Bianco prepara attività sulla terza traversa: lo sviluppo iniziale si trasforma in manovra.',
  },
  'caro:panov':{
    6:'c4 contesta d5 e trasforma la Variante di Cambio nel Panov. Il Nero sviluppa il cavallo invece di cercare subito materiale: la futura struttura del centro guiderà i cambi.',
    12:'Dopo cxd5 e Cxd5 il pedone d4 è isolato. Il Bianco ha spazio e linee per i pezzi; il Nero cercherà pressione sul pedone e controllo della casa davanti ad esso.',
    24:'Ae3 sostiene d4, mentre Ab7 mette i pezzi neri sulla grande diagonale. Prima di semplificare, entrambi devono chiedersi quale effetto avrà il cambio sull’attività attorno al pedone isolato.',
  },
}
function sharedStory(board,journey,index){
  if(!sharedStories){
    sharedStories=new Map()
    for(const base of OPENING_JOURNEYS){
      const position=new Chess()
      for(let i=0;i<base.moves.length;i++){
        const pair=Math.floor(i/2)*2
        sharedStories.set(`${positionKey(position)}|${base.moves.slice(0,pair+2).join(' ')}`,OPENING_STORIES[base.id][Math.floor(i/2)])
        position.move(base.moves[i])
      }
    }
  }
  const pair=Math.floor(index/2)*2
  return sharedStories.get(`${positionKey(board)}|${journey.moves.slice(0,pair+2).join(' ')}`)
}

export const JOURNEY_STAGES = [
  {id:'opening',title:'1 · Le basi dell’apertura',goal:'Occupa il centro, sviluppa i primi pezzi e osserva la risposta avversaria.'},
  {id:'development',title:'2 · Sviluppo e sicurezza del re',goal:'Collega i pezzi, prepara l’arrocco e individua la rottura centrale.'},
  {id:'middlegame',title:'3 · Entriamo nel mediogioco',goal:'Collega ogni mossa alla struttura: colonne, diagonali, cambi e bersagli.'},
]

// The question is written for this position; its explanation is returned separately
// so the UI can reveal it only after the player has completed the full move.
export function journeyCoach(journey,index,side){
  const stage=JOURNEY_STAGES[index<8?0:index<18?1:2]
  const board=new Chess()
  let previousPosition
  for(const san of journey.moves.slice(0,index)){previousPosition=board.fen();board.move(san)}
  const plan=side==='w'?journey.whitePlan:journey.blackPlan
  const san=journey.moves[index]
  if(!san)return {stage,plan}
  let story=OPENING_STORIES[journey.id]?.[Math.floor(index/2)]
  if(!story&&journey.variant)story=sharedStory(board,journey,index)
  if(!story&&!journey.variant)throw new Error(`Missing opening story: ${journey.id}:${index}`)
  const challenge=openingChallenge(board,san)
  const opponent=previousPosition&&new Chess(previousPosition).turn()!==side
    ?openingOpponent(previousPosition,journey.moves[index-1],san):null
  let debrief=story?.debrief
  if(!debrief){
    const pair=Math.floor(index/2)*2,position=new Chess()
    for(const played of journey.moves.slice(0,pair))position.move(played)
    const oldPosition=new Chess(position.fen())
    const effects=[]
    for(const played of journey.moves.slice(pair,pair+2)){
      effects.push(openingChallenge(position,played).effect);position.move(played)
    }
    debrief=effects.join(' ')
    const structure=openingPawnChanges(oldPosition,position)
    if(structure)debrief+=' '+structure
    if(pair===4||pair===18)debrief+=' '+journey.contrast
  }
  const reviewed=caroNotes[journey.id]??strategicNotes[journey.id]
  debrief=(reviewed?.line===journey.moves.join(' ')?reviewed.notes[Math.floor(index/2)*2]:null)
    ??journey.editorialNotes?.[Math.floor(index/2)*2]??variantNotes[journey.id]?.[Math.floor(index/2)*2]??debrief
  const before=board.fen(),move=board.move(san)
  const authored=story&&(move.color==='w'?story.white:story.black)
  const explicit=authored&&(/cavall|alfier|torre|pedon|donna|arrocc|riprend|cattur|spinta/i.test(authored.question)||authored.question.includes(move.from)||authored.question.includes(move.to))
  const piece={p:'pedone',n:'cavallo',b:'alfiere',r:'torre',q:'donna',k:'re'}[move.piece]
  return {stage,plan,situation:authored?.situation??challenge.situation,
    question:opponent?.question??(authored&&!explicit?authored.question:challenge.question),
    opponent,guidedQuestion:authored?.question??challenge.question,debrief,
    hint:`Concentrati ${piece==='donna'?'sulla donna':piece==='torre'?'sulla torre':piece==='alfiere'?'sull’alfiere':`sul ${piece}`} in ${move.from}.`,
    san,from:move.from,to:move.to,before}
}
