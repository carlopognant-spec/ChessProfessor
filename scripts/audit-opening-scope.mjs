// P01: offline inventory only. No engine, application mutation or source download.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'
import {OPENING_LESSONS, openingFamily} from '../src/lib/openingLessons.js'

const sha = value => createHash('sha256').update(value).digest('hex')
const sourceDir = 'docs/data/opening-audit-sources'
const outputPath = 'docs/data/opening-scope-audit.json'
const tablePath = 'docs/OPENING-SCOPE-MATRIX.md'
const check = process.argv.includes('--check')
assert(process.argv.slice(2).every(arg => arg === '--check'), 'Supported option: --check')
const catalogBytes = await fs.readFile('src/data/openingCatalog.json')
const catalog = JSON.parse(catalogBytes)
const manifest = JSON.parse(await fs.readFile(`${sourceDir}/manifest.json`, 'utf8'))
const rootsBytes = await fs.readFile(`${sourceDir}/eco-roots.json`)
const rootsSnapshot = JSON.parse(rootsBytes)
assert.equal(rootsSnapshot.revision, catalog.revision)
const sources = new Map()
for (const file of manifest.files) {
  const bytes = await fs.readFile(`${sourceDir}/${file.name}`)
  assert.equal(sha(bytes), file.sha256, `Source hash: ${file.name}`)
  sources.set(file.name, bytes.toString('utf8'))
}
const records = catalog.entries.map(row => ({
  id: `eco:${row.id}`, source: 'eco', sourceRef: row.id, eco: row.eco,
  name: row.name, aliases: row.aliases, family: row.family, moves: row.moves,
}))
const pgnMoves = pgn => pgn.replace(/\d+\.(?:\.\.)?/g, ' ').trim().split(/\s+/)
for (const file of ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv']) {
  const lines = sources.get(file).trimEnd().split(/\r?\n/)
  assert.equal(lines[0], 'eco\tname\tpgn')
  for (let line = 1; line < lines.length; line++) {
    const [eco, name, pgn, ...extra] = lines[line].split('\t')
    assert.equal(extra.length, 0)
    assert(eco && name && pgn, `${file}:${line + 1}`)
    records.push({id: `lichess:${file}:${line + 1}`, source: 'lichess',
      sourceRef: `${file}#L${line + 1}`, eco, name, aliases: [],
      family: openingFamily(name, eco).id, moves: pgnMoves(pgn)})
  }
}
assert.equal(new Set(records.map(row => row.id)).size, records.length)
const recordsById = new Map(records.map(row => [row.id,row]))
for (const anchor of rootsSnapshot.roots) {
  const row = recordsById.get(`eco:${anchor.id}`)
  assert(row, `Unknown upstream ECO root: ${anchor.id}`)
  assert.equal(row.eco, anchor.eco)
  assert.equal(row.name, anchor.name)
  assert.equal(row.moves.join(' '), pgnMoves(anchor.moves).join(' '))
  row.isEcoRoot = true
}
// Audit-only hints anchored to the primary opening name. Production routing is preserved.
// Generic Indian/Queen's Pawn names need editorial review and keep their current assignment.
const primaryRules = [
  ['italian', /^(Italian(?: Game)?|Giuoco|Two Knights Defense|Evans Gambit|Hungarian Defense)\b/i],
  ['spanish', /^(Ruy Lopez|Spanish (Game|Opening))\b/i],
  ['sicilian', /^Sicilian\b/i], ['french', /^French\b/i], ['caro', /^Caro.Kann\b/i],
  ['scandinavian', /^(Scandinavian|Center Counter)\b/i], ['pirc', /^(Pirc|Modern Defen[cs]e|Robatsch)\b/i],
  ['alekhine', /^Alekhine\b/i], ['petrov', /^(Petrov|Petroff|Russian Game)\b/i],
  ['scotch', /^Scotch\b/i], ['vienna', /^Vienna\b/i], ['kings-gambit', /^(King'?s Gambit|KGA|KGD)\b/i],
  ['philidor', /^Philidor\b/i], ['queens-gambit', /^(Queen'?s Gambit|QGD|QGA|Slav|Semi.Slav|Tarrasch Defense|Semi.Tarrasch Defense)\b/i],
  ['london', /^London\b/i], ['kings-indian', /^(King'?s Indian Defen[cs]e|King'?s Indian$|KID\b)/i],
  ['grunfeld', /^(Gr[uü]nfeld|Gruenfeld|Neo.Gr[uü]nfeld)\b/i], ['nimzo', /^Nimzo.Indian\b/i],
  ['queens-indian', /^(Queen'?s Indian|Pseudo Queen'?s Indian)\b/i], ['catalan', /^Catalan\b/i],
  ['dutch', /^Dutch\b/i], ['benoni', /^(Benoni|Benko|Volga)\b/i], ['budapest', /^Budapest\b/i],
  ['english', /^(English Opening|English$)/i], ['reti', /^(R[eé]ti|Zukertort Opening|King'?s Indian Attack)\b/i],
  ['four-knights', /^Four Knights\b/i], ['larsen', /^(Nimzo.Larsen|Larsen)\b/i], ['bird', /^Bird\b/i],
  ['trompowsky', /^Trompowsky\b/i], ['colle', /^(Colle|Torre Attack)\b/i],
  ['bogo', /^Bogo.Indian\b/i], ['old-indian', /^Old Indian\b/i], ['nimzowitsch', /^Nimzowitsch Defen[cs]e\b/i],
  ['owen', /^Owen\b/i], ['open-games', /^(Bishop'?s Opening|Center Game|Danish Gambit|Ponziani)\b/i],
]
for (const row of records) {
  const [primary, ...rest] = row.name.split(':')
  const parts = rest.join(':').split(',').map(value => value.trim()).filter(Boolean)
  row.sourceHierarchy = {primary:primary.trim(), variation:parts[0]??null, subvariations:parts.slice(1)}
  row.applicationFamily = row.family
  row.primaryFamilyHint = primaryRules.find(([,rule]) => rule.test(primary.trim()))?.[0] ?? null
  row.routingReview = Boolean(row.primaryFamilyHint && row.primaryFamilyHint !== row.applicationFamily)
  row.family = row.primaryFamilyHint ?? row.applicationFamily
}

const root = {key: '', moves: [], children: new Map(), records: [], courses: [], ends: []}
const nodes = new Map([['', root]])
function insert(moves) {
  let node = root
  for (const san of moves) {
    if (!node.children.has(san)) {
      const path = [...node.moves, san], key = path.join(' ')
      const child = {key, moves: path, parent: node, children: new Map(), records: [], courses: [], ends: []}
      node.children.set(san, child)
      nodes.set(key, child)
    }
    node = node.children.get(san)
  }
  return node
}
for (const row of records) insert(row.moves).records.push(row)
assert.equal(new Set(ALL_OPENING_JOURNEYS.map(row => row.id)).size, ALL_OPENING_JOURNEYS.length)
for (const course of ALL_OPENING_JOURNEYS) {
  let node = insert(course.moves)
  node.ends.push(course.id)
  while (node) { node.courses.push(course.id); node = node.parent }
}

const board = new Chess(), byPosition = new Map(), positionsInCourses = new Map()
let checkedEdges = 0
function visit(node) {
  // chess.js emits an en-passant square only when the capture is legal.
  node.position = board.fen().split(' ').slice(0, 4).join(' ')
  if (node.records.length) {
    if (!byPosition.has(node.position)) byPosition.set(node.position, [])
    byPosition.get(node.position).push(node)
  }
  if (node.courses.length) {
    if (!positionsInCourses.has(node.position)) positionsInCourses.set(node.position, new Set())
    node.courses.forEach(id => positionsInCourses.get(node.position).add(id))
  }
  for (const [san, child] of node.children) {
    const move = board.move(san, {strict: true})
    assert.equal(move.san, san, `Noncanonical SAN: ${child.key}`)
    checkedEdges++
    visit(child)
    board.undo()
  }
}
visit(root)
const courseById = new Map(ALL_OPENING_JOURNEYS.map(course => [course.id, course]))
const positionId = position => `position:${sha(position).slice(0, 16)}`
const edgeRegistry = new Map()
const groups = [...byPosition.entries()].map(([position, groupNodes]) => {
  const groupRecords = groupNodes.flatMap(node => node.records)
  // Naming preference is an audit convention, not a proof of superior chess content.
  groupRecords.sort((a,b) => Number(b.source === 'lichess') - Number(a.source === 'lichess') ||
    a.moves.length - b.moves.length || a.id.localeCompare(b.id))
  const canonical = groupRecords[0]
  const exactCourses = [...new Set(groupNodes.flatMap(node => node.courses))].sort()
  const transposedCourses = [...(positionsInCourses.get(position) ?? [])].filter(id => !exactCourses.includes(id)).sort()
  const endedCourses = new Set(), parentIds = new Set(), missingEdges = new Map()
  for (const node of groupNodes) {
    let parent = node.parent
    while (parent) {
      parent.ends.forEach(id => endedCourses.add(id))
      if (parent.records.length && parent.position !== position) {
        parentIds.add(positionId(parent.position))
        break
      }
      parent = parent.parent
    }
    // Ended courses can lie above the nearest named parent too.
    parent = node.parent
    while (parent) { parent.ends.forEach(id => endedCourses.add(id)); parent = parent.parent }
    let cursor = root
    for (const san of node.moves) {
      const next = cursor.children.get(san)
      if (!next.courses.length && cursor.courses.length) {
        const id = `edge:${sha(`${cursor.position}|${san}`).slice(0,16)}`
        if (!edgeRegistry.has(id)) edgeRegistry.set(id, {id, before:cursor.position, san, after:next.position, orders:[]})
        const edge = edgeRegistry.get(id)
        if (!edge.orders.some(order => order.prefix === cursor.key)) edge.orders.push({ply:next.moves.length,
          prefix:cursor.key, coursesBefore:[...cursor.courses].sort()})
        missingEdges.set(id, id)
        break
      }
      cursor = next
    }
  }
  const families = [...new Set(groupRecords.map(row => row.family))].sort()
  const reach = exactCourses.length ? 'exact' : transposedCourses.length ? 'transposition' : endedCourses.size ? 'course-ended' : 'absent'
  // 'Completo' is deliberately limited to reaching this named position in a playable path.
  const status = reach === 'exact' ? 'completo-posizione' : reach === 'absent' ? 'mancante' : 'parziale'
  return {id: positionId(position), family: canonical.family, families, name: canonical.name,
    applicationFamilies: [...new Set(groupRecords.map(row => row.applicationFamily))].sort(),
    sourceHierarchy:canonical.sourceHierarchy,
    familyBasis:canonical.primaryFamilyHint?'primary-name-hint':'legacy-unreviewed',
    eco: [...new Set(groupRecords.map(row => row.eco))].sort(), position,
    canonicalRecord: canonical.id, moves: canonical.moves.join(' '),
    parentIds: [...parentIds].sort(), status, reach,
    reason: reach === 'exact' ? 'La sequenza di almeno una fonte è prefisso di un corso; non certifica commenti o continuazioni.' :
      reach === 'transposition' ? 'Posizione raggiunta, ma nessun ordine completo delle fonti è giocabile nei corsi.' :
      reach === 'course-ended' ? 'Almeno un corso termina prima di questa continuazione documentata.' :
      'La posizione caratteristica non compare in alcun corso.',
    exactCourses, transposedCourses, endedCourses: [...endedCourses].sort(),
    classificationReview: families.length > 1 || groupRecords.some(row => row.routingReview),
    routingReview: groupRecords.some(row => row.routingReview),
    ecoRoots:groupRecords.filter(row=>row.isEcoRoot).map(row=>row.id),
    recordIds: groupRecords.map(row => row.id),
    moveOrderCount: groupNodes.length, nameCount: new Set(groupRecords.map(row => row.name)).size,
    firstMissingEdgeIds: [...missingEdges.keys()].sort()}
}).sort((a,b) => a.family.localeCompare(b.family) || a.moves.split(' ').length-b.moves.split(' ').length || a.name.localeCompare(b.name))
const groupById = new Map(groups.map(group => [group.id, group]))
assert.equal(groupById.size, groups.length, 'Position ID collision')
for (const group of groups) {
  for (const parent of group.parentIds) assert(groupById.has(parent), `Missing parent: ${parent}`)
  for (const id of [...group.exactCourses, ...group.transposedCourses, ...group.endedCourses]) assert(courseById.has(id))
}
const recordRows = records.map(row => {
  const node = nodes.get(row.moves.join(' ')), group = groupById.get(positionId(node.position))
  const duplicate = row.id !== group.canonicalRecord
  return {...row, moves: row.moves.join(' '), groupId: group.id,
    status: duplicate ? 'duplicato-alias-posizione' : group.status,
    sequenceReach: node.courses.length ? 'exact' : positionsInCourses.has(node.position) ? 'transposition' : 'absent'}
})
assert.equal(recordRows.length, groups.reduce((sum,group) => sum+group.recordIds.length,0))
const boundaries = new Map()
for (const group of groups.filter(group => group.reach === 'absent' || group.reach === 'course-ended')) {
  for (const edgeId of group.firstMissingEdgeIds) {
    const edge = edgeRegistry.get(edgeId)
    if (!boundaries.has(edge.id)) boundaries.set(edge.id, {...edge, targets: [], families: []})
    const item = boundaries.get(edge.id)
    item.targets.push(group.id)
    if (!item.families.includes(group.family)) item.families.push(group.family)
  }
}
const frontier = [...boundaries.values()].map(row => ({...row, families: row.families.sort(), targets: [...new Set(row.targets)].sort()}))
  .sort((a,b) => Math.min(...a.orders.map(o=>o.ply))-Math.min(...b.orders.map(o=>o.ply)) || b.targets.length-a.targets.length || a.id.localeCompare(b.id))
const families = OPENING_LESSONS.map(guide => {
  const rows = groups.filter(group => group.family === guide.id)
  return {id: guide.id, title: guide.title, courses: ALL_OPENING_JOURNEYS.filter(c => c.family === guide.id).length,
    sourceRecords: records.filter(row => row.family === guide.id).length,
    currentApplicationRecords: records.filter(row => row.applicationFamily === guide.id).length,
    positions: rows.length, exact: rows.filter(row => row.reach === 'exact').length,
    transposition: rows.filter(row => row.reach === 'transposition').length,
    courseEnded: rows.filter(row => row.reach === 'course-ended').length,
    absent: rows.filter(row => row.reach === 'absent').length,
    classificationReview: rows.filter(row => row.classificationReview).length}
})
assert.equal(families.reduce((sum,family) => sum+family.positions,0), groups.length)
const courseRows = ALL_OPENING_JOURNEYS.map(course => ({id: course.id, family: course.family, title: course.title,
  moves: course.moves.join(' '), plies: course.moves.length,
  source: course.expansion ?? null,
  exactPositions: groups.filter(group => group.exactCourses.includes(course.id)).map(group => group.id),
  transposedPositions: groups.filter(group => group.transposedCourses.includes(course.id)).map(group => group.id)}))
const sourceCounts = Object.fromEntries(['eco','lichess'].map(source => [source,records.filter(row => row.source === source).length]))
const catalogSequences = new Set(catalog.entries.map(row => row.moves.join(' ')))
const catalogPositions = new Set(records.filter(row => row.source === 'eco').map(row => nodes.get(row.moves.join(' ')).position))
const lichessExtraSequences = records.filter(row => row.source === 'lichess' && !catalogSequences.has(row.moves.join(' ')))
const lichessExtraPositions = [...new Set(records.filter(row => row.source === 'lichess').map(row => nodes.get(row.moves.join(' ')).position))].filter(position => !catalogPositions.has(position))
const sourceInputPaths = ['src/lib/openingJourneys.js','src/lib/openingVariants.js','src/lib/openingLessons.js',
  'src/data/openingExpansion.js','src/lib/openingCurriculum.js','src/lib/openingExpansionPlan.js',
  'docs/data/opening-commentary-coverage.json','scripts/audit-opening-scope.mjs']
const inputHashes = {'src/data/openingCatalog.json': sha(catalogBytes),[`${sourceDir}/eco-roots.json`]:sha(rootsBytes)}
for (const path of sourceInputPaths) inputHashes[path] = sha(await fs.readFile(path))
const summary = {sourceCounts, sourceRecords: records.length, uniqueSequences: new Set(records.map(row => row.moves.join(' '))).size,
  uniquePositions: groups.length, mergedRecords: records.length-groups.length,
  groupsWithMultipleOrders: groups.filter(group => group.moveOrderCount > 1).length,
  groupsWithMultipleNames: groups.filter(group => group.nameCount > 1).length,
  classificationReview: groups.filter(group => group.classificationReview).length,
  routingReviewRecords:records.filter(row=>row.routingReview).length,
  legacyUnreviewedPositions:groups.filter(group=>group.familyBasis==='legacy-unreviewed').length,
  ecoRootCount:rootsSnapshot.roots.length, missingEcoRootCodes:rootsSnapshot.missingCodes,
  ecoRootReach:rootsSnapshot.roots.reduce((counts,root)=>{
    const row=recordsById.get(`eco:${root.id}`),group=groupById.get(positionId(nodes.get(row.moves.join(' ')).position))
    counts[group.reach]=(counts[group.reach]??0)+1;return counts
  },{}),
  lichessExtraSequences: lichessExtraSequences.length, lichessExtraPositions: lichessExtraPositions.length,
  courses: courseRows.length, coursePlies: courseRows.reduce((sum,course) => sum+course.plies,0),
  exactPositions: groups.filter(group => group.reach === 'exact').length,
  transposedOnlyPositions: groups.filter(group => group.reach === 'transposition').length,
  courseEndedPositions: groups.filter(group => group.reach === 'course-ended').length,
  absentPositions: groups.filter(group => group.reach === 'absent').length,
  firstMissingEdges: frontier.length, legalTrieEdgesChecked: checkedEdges}
const report = {schema:1,checkedOn:manifest.checkedOn,
  scope:'Named endpoint positions in the fixed eco.json catalog plus the fixed Lichess snapshot; proposal, not all chess theory.',
  positionIdentity:'Piece placement, side to move, castling rights, legal en-passant; move counters omitted. Move orders retained separately.',
  hierarchy:'Nearest preceding named position on each source sequence; multiple parents are possible. Not an editorial system/variation hierarchy.',
  familyPolicy:'Primary opening-name anchored hints when explicit; otherwise existing application name/ECO routing. Preferred Lichess canonical record. Provisional editorial mapping, conflicts retained, no production changes.',
  sources:{eco:{url:catalog.source,revision:catalog.revision,license:catalog.license},lichess:manifest},
  inputHashes,summary,families,courses:courseRows,positions:groups,records:recordRows,
  missingEdges:[...edgeRegistry.values()],frontier}
// Keep one entity per line for review without enormous pretty-printed files.
const json = '{\n'+Object.entries(report).map(([key,value]) => `${JSON.stringify(key)}:${Array.isArray(value)?'[\n'+value.map(row=>JSON.stringify(row)).join(',\n')+'\n]':JSON.stringify(value)}`).join(',\n')+'\n}\n'
const esc = text => String(text).replace(/\|/g,'\\|')
const lines = ['# P01 — Matrice della copertura delle posizioni di apertura','',
  `Fotografia: ${manifest.checkedOn}. Generata da \`node scripts/audit-opening-scope.mjs\`; verifica offline con \`--check\`.`, '',
  'Questa misura riguarda il raggiungimento delle posizioni nominate dalle fonti. Non certifica la completezza di un corso, dei suoi commenti, degli esercizi o di tutta la teoria. Il perimetro è una proposta da discutere.', '',
  `Fonti: ${sourceCounts.eco} record eco.json + ${sourceCounts.lichess} record Lichess = ${records.length} riferimenti; ${summary.uniqueSequences} ordini distinti; **${groups.length} posizioni finali distinte**.`, '',
  `I ${courseRows.length} corsi raggiungono ${summary.exactPositions} posizioni con almeno un ordine delle fonti e altre ${summary.transposedOnlyPositions} solo per trasposizione. ${summary.courseEndedPositions} posizioni proseguono oltre un corso terminato; ${summary.absentPositions} non compaiono nei corsi e richiedono rami diversi.`, '',
  `Lichess aggiunge ${summary.lichessExtraSequences} sequenze e ${summary.lichessExtraPositions} posizioni rispetto al catalogo locale. Non sono altrettanti nuovi corsi. ${summary.classificationReview} gruppi richiedono una revisione della famiglia; ${summary.routingReviewRecords} riferimenti hanno un nome primario esplicito in conflitto con il raggruppamento attuale.`, '',
  `Per altre ${summary.legacyUnreviewedPositions} posizioni la famiglia resta quella dell'app senza una regola sul nome primario: sono assegnazioni non revisionate, non conferme di correttezza. I conflitti segnalati e queste assegnazioni possono sovrapporsi.`, '',
  `Il flag upstream isEcoRoot individua ${summary.ecoRootCount} ancore ECO; manca il flag per ${summary.missingEcoRootCodes.join(', ')}. Copertura delle posizioni di queste ancore: ${JSON.stringify(summary.ecoRootReach)}. Le ancore sono una tappa di ampiezza, non un elenco di tutte le varianti.`, '',
  '## Legenda', '',
  '- **Esatta / completo-posizione:** almeno un ordine di mosse documentato è prefisso di un corso. Non equivale a variante didatticamente completa.',
  '- **Trasposizione / parziale:** stessa posizione con turno, arrocco ed en passant legale, ma ordine documentato non giocabile per intero.',
  '- **Oltre corso / parziale:** un corso è prefisso della fonte e finisce prima della sua posizione caratteristica.',
  '- **Assente / mancante:** posizione non raggiunta e nessun corso intero è prefisso della fonte.',
  '- **Duplicato-alias-posizione:** riferimenti raggruppati sullo stesso stato; nomi e ordini restano conservati. Non dimostra che gli ordini siano didatticamente equivalenti.',
  '- **Incerto:** flag `classificationReview` per famiglie discordanti o conflitti fra nome primario e assegnazione attuale. Può trattarsi di una vera trasposizione o di un errore di instradamento. La presenza della posizione resta misurabile.', '',
  '## Tutte le famiglie attuali', '',
  'Le posizioni sono attribuite alla famiglia proposta dal nome primario del riferimento canonico, quando esplicito; negli altri casi resta il raggruppamento attuale. Le regole sono solo nello script di audit: il catalogo applicativo non è modificato. I corsi che raggiungono una posizione possono appartenere ad altre famiglie. I conteggi sono additivi, ma la proposta di tassonomia richiede revisione editoriale.', '',
  '| Famiglia | Corsi | Posizioni fonte | Esatta | Trasposizione | Oltre corso | Assente | Famiglia incerta |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...families.map(f => `| ${f.title} | ${f.courses} | ${f.positions} | ${f.exact} | ${f.transposition} | ${f.courseEnded} | ${f.absent} | ${f.classificationReview} |`), '',
  '## Esempi verificabili per famiglia', '',
  'Selezione meccanica: fino a quattro posizioni assenti per famiglia, dando precedenza ai nomi primari riconosciuti e poi a lunghezza della linea e nome. Non è una graduatoria di importanza o frequenza. La proposta editoriale e le priorità sono nel rapporto P01.', '',
  ...families.flatMap(f => [`### ${f.title}`, '',
    '| ID posizione | Nome fonte | Sequenza caratteristica |', '| --- | --- | --- |',
    ...groups.filter(g => g.family === f.id && g.reach === 'absent').sort((a,b)=>Number(a.familyBasis==='legacy-unreviewed')-Number(b.familyBasis==='legacy-unreviewed') || a.moves.split(' ').length-b.moves.split(' ').length || a.name.localeCompare(b.name)).slice(0,4).map(g => `| ${g.id} | ${esc(g.name)} | ${g.moves} |`), '']),
  '## Matrice integrale e riproduzione', '',
  '- [Matrice JSON](data/opening-scope-audit.json): tutte le posizioni, i record delle fonti, gli alias, i corsi e le prime diramazioni mancanti.',
  '- `positions`: ID, famiglia/e, nome, ECO, posizione caratteristica, sequenza, genitori, stato, motivazione e corsi collegati.',
  '- `records`: riferimenti originali, nomi, alias, gerarchia sintattica del nome e ordini di mosse; conserva famiglia applicativa e proposta. Il prefisso `eco:` rimanda a `src/data/openingCatalog.json`; `lichess:` a file e riga dello snapshot.',
  '- `frontier`: prima mossa non coperta lungo ogni ordine documentato, con posizione precedente e corsi disponibili. Gruppi sovrapposti: non sommare i target come corsi necessari.',
  '- `missingEdges`: tutte le prime diramazioni mancanti, comprese quelle di ordini alternativi verso posizioni già raggiunte; gli ordini di ingresso restano distinti.',
  '- `courses`: tutti i 280 percorsi correnti con collegamenti alle posizioni raggiunte e provenienza disponibile.',
  '- [Snapshot Lichess e hash](data/opening-audit-sources/manifest.json).',
  '- [Fonte Lichess fissata](https://github.com/lichess-org/chess-openings/tree/'+manifest.revision+').',
  '- [Fonte eco.json fissata](https://github.com/JeffML/eco.json/tree/'+catalog.revision+').', '',
  `Controlli: ${checkedEdges} archi SAN del trie rigiocati legalmente; ID unici, riferimenti ai genitori/corsi e riconciliazione dei conteggi verificati. Nessun motore avviato.`,
  'Il confronto delle fonti non è una validazione indipendente: eco.json incorpora anche dati Lichess. Il dataset può contenere linee rare, trappole, errori e nomi ambigui; presenza nel catalogo non significa raccomandazione di giocare la linea.', '']
const markdown = lines.join('\n')
if (check) {
  assert.equal(await fs.readFile(outputPath,'utf8'),json,'Audit JSON is stale')
  assert.equal(await fs.readFile(tablePath,'utf8'),markdown,'Matrix Markdown is stale')
} else {
  await fs.writeFile(outputPath,json)
  await fs.writeFile(tablePath,markdown)
}
console.log(JSON.stringify({mode:check?'check':'write',...summary},null,2))
