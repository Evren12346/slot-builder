# Slot-Like Builder (Casino-Free)

A strategy builder with slot-style resource generation, layered progression,
dynamic world events, biome modifiers, quests, and multi-run persistence.

## Highlights

- Slot-like reel spins with pair/jackpot bonus outcomes
- Passive structure economy with scaling build costs
- Upgrade Lab with four upgrade paths
- Rotating Quest Board with auto-refresh and reward payouts
- Quest reroll action (costs 20 Energy + 20 Metal)
- Biome system that changes economy modifiers and event pool
- World events and activity feed
- Dual trend chart (passive and total resources)
- Scale mode toggle: independent or shared trend scaling
- Lightweight audio feedback and panel flash effects
- Offline production catch-up on load
- Run summary preview for selected saves
- Run JSON import/export for backup and sharing

## Run Management

- Create new runs with custom names
- Save current run on demand
- Load selected run from the run list
- Delete selected run safely
- Preview selected run stats before loading
- Export active run to JSON file
- Import run from JSON file as a new run
- Autosave every 5 seconds to active run
- Legacy single-save migration into a "Legacy Run"

## Save Schema

- Run JSON now includes `schemaVersion`
- Current schema: `v2`
- Loader/importer automatically migrates older payloads (v1 -> v2)
- Payloads from future unsupported schema versions are rejected safely

## Migration Harness

- Script: `tools/migration_harness.js`
- Run built-in migration checks:
	- `node tools/migration_harness.js`
- Validate/migrate a run JSON file:
	- `node tools/migration_harness.js /path/to/run.json`
- Validate and print migrated output:
	- `node tools/migration_harness.js /path/to/run.json --print`

## One-Command Scripts

- Run migration harness:
	- `npm run test:migration`
- Run syntax checks:
	- `npm run check:syntax`
- Run full verification suite:
	- `npm run verify`

## CI

- GitHub Actions workflow: `.github/workflows/verify.yml`
- Runs `npm run verify` on every push and pull request

## Controls

- Mouse: click buttons to spin/build/upgrade/manage runs
- Keyboard shortcuts:
	- Space: spin
	- 1/2/3/4: build sawmill/quarry/forge/reactor
	- B: cycle unlocked biomes

## Run

Open `index.html` directly in a browser.

## Notes

- No real money.
- No betting mechanic.
- Resource generation and strategy progression only.
