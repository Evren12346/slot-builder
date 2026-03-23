# Slot-Like Builder (Casino-Free)

A strategy builder with slot-style resource generation, progression systems,
dynamic events, biomes, quests, and multi-run persistence.

## Highlights

- Slot-style reel spins with pair/jackpot bonuses
- Passive structure economy with scaling costs
- Upgrade Lab with four upgrade tracks
- Rotating Quest Board with paid reroll (20 Energy + 20 Metal)
- Biome system with different economic modifiers and event pools
- World events and activity feed
- Run manager with multi-save support, run summary preview, import/export
- Offline production catch-up and autosave
- Compact arcade dashboard UI on desktop (no page scroll)
- Dedicated victory certificate panel + downloadable certificate file

## Difficulty Modes

Difficulty is selected per run at the start (before progress begins).

- Normal:
	- Victory: 20 of each structure + 25000 total resources
	- No forced time-limit fail
	- No stall fail rule
- Nightmare:
	- Victory: 60 of each structure + 500000 total resources
	- Fail if time reaches 3:00:00 before victory
	- Fail if stalled for 150 seconds (no spin energy and no passive income)

## Win/Lose Flow

- Win and lose are true end states per run.
- On win:
	- The run is marked complete
	- Core gameplay actions lock
	- A victory certificate is generated
	- Player can download certificate as `.txt`
- On loss:
	- The run is marked failed
	- Core gameplay actions lock
	- Start a new run to try again

## Run Management

- Create, save, load, and delete named runs
- Preview selected run stats before loading
- Export active run to JSON
- Import JSON as a new run
- Autosave every 5 seconds to active run
- Legacy single-save migration to a generated legacy run

## Save Schema

- Save payloads include `schemaVersion`
- Current schema: `v2`
- Loader/importer auto-migrates v1 -> v2
- Unsupported future schema versions are rejected safely

## Migration Harness

- Script: `tools/migration_harness.js`
- Run built-in migration checks:
	- `node tools/migration_harness.js`
- Validate/migrate a run JSON file:
	- `node tools/migration_harness.js /path/to/run.json`
- Validate and print migrated output:
	- `node tools/migration_harness.js /path/to/run.json --print`

## One-Command Scripts

- Migration harness: `npm run test:migration`
- Syntax checks: `npm run check:syntax`
- Full verification: `npm run verify`

## CI

- Workflow: `.github/workflows/verify.yml`
- Runs `npm run verify` on push and pull request

## Controls

- Mouse: spin, build, upgrade, manage runs, difficulty, certificate download
- Keyboard:
	- Space: spin
	- 1/2/3/4: build sawmill/quarry/forge/reactor
	- B: cycle unlocked biomes

## Run

Open `index.html` in a browser.

## Notes

- No real money
- No betting mechanic
- Strategy and resource progression only
