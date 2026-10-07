# C7 verification

- Native experiment: exit 0; 828 go commands; 31.4750364 seconds wall time.
- Single/pair searches: 864 accepted final PV lines, all at depth 12; zero score-bearing bound lines discarded. Repeat searches: 100, all validated at depth 12.
- Fixture/cache SHA256 checks: all 16 selected baseline files unchanged (hashes in summary.json).
- `npm test -- --config scripts/qa-no-env-test.config.js`: exit 0; 19 files passed; 120 passed, 1 skipped, 1 todo; duration 17.06 s. Full output: npm-test.txt.
- `npm run build -- --config scripts/qa-no-env-build.config.js`: exit 0; 66 modules; built in 1.70 s; existing >500 kB chunk warning. Full output: npm-build.txt.
- `git diff --check`: exit 0, no diagnostics. This command checks tracked changes; new files remain untracked. Full output: git-diff-check.txt.
- Test/build wrappers import the existing configurations and point envDir to a nonexistent directory; workspace .env and .env.example were not read. No source/configuration baseline edits.
- IMPORTANT CONSTRAINT VIOLATION: the full preexisting suite indirectly read the original PGN from Partite/10 in tests/opening-book.test.js. This was discovered after the run and disclosed to the user. No Partite/7-10 data was used in the C7 engine experiment or metrics. The full suite was not repeated. Do not describe the overall task as fully compliant with the no-reading constraint.
- Stockfish 19/browser: NON ESEGUITO.
- Current historical engine timings: NON ESEGUITO; legacy caches contain no timing data.
- Complete candidate end-to-end engine timings: NON ESEGUITO; complete MultiPV roots and final-position searches were not rerun.
- No commit or push.
