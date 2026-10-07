import { ENGINE_CONFIG } from './engineConfig.js'

export function createAnalysisMetadata({ nodes = ENGINE_CONFIG.nodes, multiPv = ENGINE_CONFIG.multiPv, actualEngineId = null } = {}) {
  return {
    schemaVersion: 1,
    engine: { name: ENGINE_CONFIG.engine.name, version: ENGINE_CONFIG.engine.version, packageVersion: ENGINE_CONFIG.engine.packageVersion, build: ENGINE_CONFIG.engine.build, actualEngineId },
    budget: { kind: 'nodes', value: nodes },
    multiPv, threads: ENGINE_CONFIG.threads, hashMb: ENGINE_CONFIG.hashMb, hashPolicy: ENGINE_CONFIG.hashPolicy,
  }
}
export function analysisMetadataKey(metadata = createAnalysisMetadata()) {
  // UCI identity is diagnostic; compatibility uses the pinned build and search conditions.
  const { actualEngineId: _actualEngineId, ...engine } = metadata.engine
  return JSON.stringify({ ...metadata, engine })
}
export function isAnalysisCurrent(record) {
  if (!record?.analysisMetadata) return false
  try { return analysisMetadataKey(record.analysisMetadata) === analysisMetadataKey() }
  catch { return false }
}
