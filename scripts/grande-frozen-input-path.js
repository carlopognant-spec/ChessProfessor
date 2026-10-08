import path from 'node:path'
import { realpath } from 'node:fs/promises'

export function assertAllowedEvaluationPath(filename) {
  const normalized = filename.replaceAll('\\', '/').toLowerCase()
  const segments = normalized.split('/')
  if (segments.some(segment => segment === '.env' || segment.startsWith('.env.'))) throw Error('.env inputs are excluded')
  if (/\/partite\/(?:0?[789]|10)(?:\/|$)/.test('/' + normalized)
    || /(?:^|\/)personal-(?:0?[789]|10)(?:\.[^/]*)?$/.test(normalized)) throw Error('Games 7–10 remain reserved')
}
export async function resolveEvaluationInput(filename, cwd) {
  const absolute = path.resolve(cwd, filename)
  assertAllowedEvaluationPath(absolute)
  const resolved = await realpath(absolute)
  assertAllowedEvaluationPath(resolved)
  return resolved
}
