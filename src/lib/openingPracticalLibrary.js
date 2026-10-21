import historical from '../data/openingPracticalCases.js'
import roadmap from '../data/openingRoadmapPracticalCases.js'
import zaitsev from '../data/openingZaitsevPracticalCases.js'
import chekhover from '../data/openingChekhoverPracticalCases.js'

// Keep the collected historical data byte-identical; expose all published cases.
export default {
  schema:1,
  policies:[historical.policy,roadmap.policy,zaitsev.policy,chekhover.policy],
  methods:historical.methods,
  entries:[...historical.entries,...roadmap.entries,...zaitsev.entries,...chekhover.entries],
  uncovered:[...historical.uncovered,...roadmap.uncovered,...zaitsev.uncovered,...chekhover.uncovered],
}
