import { test, expect } from '@playwright/test'
import { allowRefinementWorker, refinementWorkerSource } from './tests/helpers/browser-refinement-worker.js'

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Chess } from 'chess.js'
import { createAnalysisMetadata } from './src/lib/analysisMetadata.js'

test.beforeEach(async ({ page }) => { await page.addInitScript(allowRefinementWorker, refinementWorkerSource) })

const appUrl = 'http://127.0.0.1:4176/ChessProfessor/'
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)))
const cohorts = read('./agent-output/special-completion-v1/cohorts.json').cases

function archivedGame(id, ply, supplemental = false, modern = false) {
  const source = modern ? read(`./agent-output/new-references-200k-v1/game-${id}.json`).liveEntries
    : cohorts.find(row => row.id === id && row.cohort === 'old').entries
  const entries = structuredClone(source.slice(ply - 3, ply))
  const game = new Chess(entries[0].fenBefore), history = [], metadata = createAnalysisMetadata()
  for (const [index, entry] of entries.entries()) {
    entry.ply = index + 1
    entry.moveHistorySan = [...history]
    // The seed models an old classification over compatible archived searches; no score or PV is generated.
    entry.analysisMetadata = metadata
    entry.engine.analysisMetadata = metadata
    entry.playedEngine.analysisMetadata = metadata
    game.move(entry.playedMove)
    history.push(entry.playedMove)
  }
  if (supplemental) {
    const packets = new Map(), target = entries[2]
    for (const folder of ['native-wdl-evidence-v1', 'special-completion-evidence-v1']) {
      for (const record of read(`./agent-output/${folder}/collection.json`).records) {
        const packet = read(`./${record.path}`)
        if (!packets.has(packet.fen)) packets.set(packet.fen, packet.engine)
      }
    }
    expect(packets.has(target.fenBefore) && packets.has(target.fenAfter)).toBe(true)
    target.refinement = { nativeProof: { version: 'native-winning-proof-v1',
      root: packets.get(target.fenBefore), child: packets.get(target.fenAfter), alternatives: [] } }
  }
  const pgn = game.pgn(), timestamp = '2026-10-30T00:00:00.000Z'
  return { id: createHash('sha256').update(pgn).digest('hex'), schemaVersion: 1, analysisSchemaVersion: 1,
    pgn, title: `Grande v3 ${id}`, players: { white: 'Smoke', black: 'Archive' }, date: '?', result: '*',
    importedAt: timestamp, updatedAt: timestamp, analysisMetadata: metadata, analysisEntries: entries }
}

async function archiveRecord(page, record = null) {
  return page.evaluate(record => new Promise((resolve, reject) => {
    const request = indexedDB.open('chessprofessor-games', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('games', { keyPath: 'id' })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('games', record ? 'readwrite' : 'readonly')
      const store = tx.objectStore('games'), operation = record ? store.put(record) : store.getAll()
      let result
      operation.onsuccess = () => { result = operation.result }
      tx.oncomplete = () => { db.close(); resolve(result) }
      tx.onabort = () => { db.close(); reject(tx.error) }
    }
  }), record)
}

async function openArchive(page) {
  for (const selector of ['.tools-menu', '.tools-game', '.game-archive']) {
    const details = page.locator(selector)
    if (!await details.evaluate(element => element.open)) await details.locator(':scope > summary').click()
  }
  await page.getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toHaveCount(3)
  for (const selector of ['.engine-workspace', '.advanced-analysis', '.analysis-display-options']) {
    const details = page.locator(selector)
    if (!await details.evaluate(element => element.open)) await details.locator(':scope > summary').click()
  }
}

async function decision(page) {
  const selected = page.locator('.selected-move')
  const traceability = page.locator('.traceability')
  if (!await traceability.evaluate(element => element.open)) await traceability.locator(':scope > summary').click()
  const details = selected.locator('.classification-details')
  if (!await details.evaluate(element => element.open)) await details.locator(':scope > summary').click()
  const data = details.locator('details')
  if (!await data.evaluate(element => element.open)) await data.locator(':scope > summary').click()
  return JSON.parse(await selected.locator('pre').innerText())
}

test.beforeEach(async ({ page }) => {
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.addInitScript(() => {
    window.startedWorkers = Number(sessionStorage.getItem('grande-smoke-workers') ?? 0)
    window.Worker = class {
      constructor() {
        sessionStorage.setItem('grande-smoke-workers', String(++window.startedWorkers))
        throw Error('Unexpected engine search')
      }
    }
  })
})

test('production archive opens Qxa8 as v3, navigates, toggles coherently and preserves its decision', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  const source = archivedGame('personal-05', 27, true), target = source.analysisEntries[2]
  expect(target.playedMove).toBe('Qxa8')
  expect(target.classification).toBe('best')
  await page.goto(appUrl)
  await archiveRecord(page, source)
  await page.reload()
  await openArchive(page)
  const button = page.locator('.analysis-row-button').nth(2)
  const selected = page.locator('.selected-move')
  await expect(button).toHaveAttribute('data-classification', 'great')
  await button.click()
  await page.locator('.traceability > summary').click()
  await expect(selected).toContainText('Certificato tattico verificato')
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', target.fenAfter)
  await page.getByRole('button', { name: 'Indietro', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', target.fenBefore)
  await page.getByRole('button', { name: 'Avanti', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', target.fenAfter)
  const active = await decision(page)
  expect(active).toMatchObject({ classification: 'great', candidateAssessment: {
    version: 'grande-evidence-candidate-v3', classification: 'great', verdict: 'confirmed', inheritance: null,
    provenance: { source: 'archive-native' } } })
  expect((await archiveRecord(page))[0].analysisEntries[2]).toEqual(target)
  await expect(selected.locator('.classification-details')).toContainText('Etichetta originaria: Migliore')
  const toggle = page.getByRole('checkbox', { name: 'Mostra Grande e Geniale sperimentali', exact: true })
  await toggle.uncheck()
  await expect(button).toHaveAttribute('data-classification', 'best')
  await expect(selected).not.toContainText('Certificato tattico')
  await expect(selected.locator('.classification-details')).not.toContainText('criterio speciale aggiuntivo')
  const hidden = JSON.parse(await selected.locator('pre').innerText())
  expect(hidden.classification).toBe('best')
  expect(hidden.candidateAssessment?.classification ?? 'best').toBe('best')
  await toggle.check()
  await expect(selected).toContainText('Certificato tattico verificato')
  expect(JSON.parse(await selected.locator('pre').innerText())).toEqual(active)
  await page.getByRole('button', { name: 'Salva partita e analisi', exact: true }).click()
  await expect(page.locator('.game-archive [role="status"]')).toContainText('salvata senza duplicati')
  const saved = (await archiveRecord(page))[0], savedTarget = saved.analysisEntries[2]
  expect(savedTarget.classificationDecision).toEqual(active)
  expect(savedTarget.classificationOrigin.classification).toBe('best')
  expect(savedTarget.refinement.nativeProof).toEqual(target.refinement.nativeProof)
  await page.reload()
  await page.context().setOffline(true)
  await openArchive(page)
  await expect(page.getByRole('button', { name: 'Verifica le scelte decisive', exact: true })).toBeEnabled()
  expect(await decision(page)).toEqual(active)
  expect((await archiveRecord(page))[0].analysisEntries[2].classificationOrigin).toEqual(savedTarget.classificationOrigin)
  expect(await page.evaluate(() => window.startedWorkers)).toBe(0)
  expect(errors).toEqual([])
})

test('production distinguishes inherited Grande from a newly confirmed tactic', async ({ page }) => {
  await page.goto(appUrl)
  await archiveRecord(page, archivedGame('184316820266', 28, false, true))
  await page.reload()
  await page.context().setOffline(true)
  await openArchive(page)
  await expect(page.getByRole('button', { name: 'Verifica le scelte decisive', exact: true })).toBeEnabled()
  const button = page.locator('.analysis-row-button').nth(2)
  await expect(button).toHaveAttribute('data-classification', 'great')
  await button.click()
  await page.locator('.traceability > summary').click()
  await expect(page.locator('.selected-move')).toContainText('non è una nuova conferma tattica')
  await expect(page.locator('.selected-move')).not.toContainText('Certificato tattico verificato')
  expect(await decision(page)).toMatchObject({ classification: 'great', candidateAssessment: {
    verdict: 'inconclusive', inheritance: 'context' } })
  expect(await page.evaluate(() => window.startedWorkers)).toBe(0)
})
