import { readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parsePersonal } from './qa/personal-import.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const records = []
try {
  for (const number of (await readdir(path.join(root, 'Partite'))).filter(name => /^\d+$/.test(name)).sort((a, b) => Number(a) - Number(b))) {
    const folder = path.join(root, 'Partite', number)
    const names = (await readdir(folder)).filter(name => name.endsWith('.pgn'))
    if (names.length !== 1) throw new Error(`Partite/${number}: atteso un solo PGN`)
    const pgn = await readFile(path.join(folder, names[0]), 'utf8')
    const text = await readFile(path.join(folder, 'analisi.txt'), 'utf8')
    records.push({ number, pgnSource: `Partite/${number}/${names[0]}`, annotationSource: `Partite/${number}/analisi.txt`, ...parsePersonal(pgn, text, `personal-${number.padStart(2, '0')}`) })
  }
  // Validate every input before writing any fixture; original files stay intact.
  for (const record of records.filter(record => record.annotated)) {
    await writeFile(path.join(root, 'tests/fixtures/qa', `${record.fixture.id}.json`), JSON.stringify(record.fixture, null, 2) + '\n')
  }
  const manifest = records.map(({ fixture, ...record }) => ({ ...record, id: fixture.id, label: fixture.label, role: fixture.role }))
  await writeFile(path.join(root, 'tests/fixtures/qa/personal-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest, null, 2))
} catch (error) { console.error(`STOP: ${error.message}`); process.exitCode = 1 }
