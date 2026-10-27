import historical from '../data/openingPracticalCases.js'
import roadmap from '../data/openingRoadmapPracticalCases.js'
import zaitsev from '../data/openingZaitsevPracticalCases.js'
import chekhover from '../data/openingChekhoverPracticalCases.js'
import chekhoverA6 from '../data/openingChekhoverA6PracticalCases.js'
import chekhoverEarly from '../data/openingChekhoverEarlyPracticalCases.js'
import sicilianEarly from '../data/openingSicilianEarlyPracticalCases.js'

// Keep the collected historical data byte-identical; expose all published cases.
export default {
  schema:1,
  policies:[historical.policy,roadmap.policy,zaitsev.policy,chekhover.policy,chekhoverA6.policy,chekhoverEarly.policy,sicilianEarly.policy],
  methods:historical.methods,
  entries:[...historical.entries,...roadmap.entries,...zaitsev.entries,...chekhover.entries,...chekhoverA6.entries,...chekhoverEarly.entries,...sicilianEarly.entries],
  uncovered:[...historical.uncovered,...roadmap.uncovered,...zaitsev.uncovered,...chekhover.uncovered,...chekhoverA6.uncovered,...chekhoverEarly.uncovered,...sicilianEarly.uncovered],
}
