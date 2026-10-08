export const RULE_POLICIES = Object.freeze({
  cautious: Object.freeze({ falsePositiveCost: 4, minimumPrecision: 0.80, minimumNewPositives: 3, maxRules: 2 }),
  exploratory: Object.freeze({ falsePositiveCost: 1, minimumPrecision: 0.50, minimumNewPositives: 3, maxRules: 2 }),
})

export function matchesRule(features, rule) {
  // Unknown values satisfy neither a positive nor a negative predicate.
  return rule.every(({ name, value }) => features[name] === value)
}
export function predictsGrande(features, model) {
  return model.rules.some(rule => matchesRule(features, rule.predicates))
}
export function trainingWithoutGame(samples, allowedGames, heldOut) {
  if (!allowedGames.includes(heldOut)) throw new TypeError('Held-out game outside development whitelist')
  const games = new Set(allowedGames)
  return samples.filter(sample => games.has(sample.gameId) && sample.gameId !== heldOut && sample.eligible)
}
export function learnGrandeRules(rows, featureNames, policyName = 'cautious') {
  const policy = RULE_POLICIES[policyName]
  if (!policy) throw new TypeError('Unknown learning policy')
  const names = [...featureNames].sort()
  if (new Set(names).size !== names.length) throw new TypeError('Duplicate feature names')
  for (const row of rows) {
    if (typeof row.label !== 'boolean') throw new TypeError('Boolean training label required')
    for (const name of names) if (![true, false, null].includes(row.features[name])) throw new TypeError('Feature must be boolean or null')
  }
  const candidates = []
  for (let i = 0; i < names.length; i++) for (const value of [false, true]) {
    candidates.push([{ name: names[i], value }])
    for (let j = i + 1; j < names.length; j++) for (const otherValue of [false, true]) {
      candidates.push([{ name: names[i], value }, { name: names[j], value: otherValue }])
    }
  }
  const selected = [], covered = new Set()
  for (let step = 0; step < policy.maxRules; step++) {
    const scored = candidates.map(predicates => {
      const indices = rows.map((row, index) => !covered.has(index) && matchesRule(row.features, predicates) ? index : -1).filter(i => i >= 0)
      const tp = indices.filter(index => rows[index].label).length, fp = indices.length - tp
      return { predicates, indices, tp, fp, gain: tp - policy.falsePositiveCost * fp,
        laplacePrecision: (tp + 1) / (tp + fp + 2), key: JSON.stringify(predicates) }
    }).filter(r => r.tp >= policy.minimumNewPositives && r.gain > 0 && r.laplacePrecision >= policy.minimumPrecision)
    scored.sort((a, b) => b.gain - a.gain || a.fp - b.fp || b.tp - a.tp || a.predicates.length - b.predicates.length || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    if (!scored.length) break
    const best = scored[0]
    selected.push({ predicates: best.predicates, trainingNewTp: best.tp, trainingNewFp: best.fp,
      gain: best.gain, laplacePrecision: best.laplacePrecision })
    best.indices.forEach(index => covered.add(index))
  }
  return { policyName, policy, trainingRows: rows.length, trainingPositives: rows.filter(row => row.label).length, rules: selected }
}
