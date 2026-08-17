# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Melvor Idle mod that simulates thieving outcomes for different loadouts, letting players compare XP/hr and GP/hr across all thieving NPCs without switching gear in-game. Built against the official Melvor modding API.

The project is in early stages — `src/setup.ts` is a scaffold and the spec in `specs/constitution.md` is the design document.

## Build & Test

```bash
pnpm install
pnpm build             # type-checks, bundles via webpack, minifies HTML templates → dist/
pnpm test              # runs Jest with SWC transform
pnpm buildzip          # build + package into a zip for mod upload
```

No linter configured.

## Architecture (Planned)

Three layers, all in `src/`:

1. **State reader** — extracts character state (equipment, mastery, modifiers, potions, agility, etc.) from live game objects via the Melvor modding API
2. **Calculation engine** — pure functions: loadout config in, per-NPC metrics (XP/hr, GP/hr, success rate) out
3. **UI layer** — comparison table and configuration panel injected into the game interface

The mod entry point is `src/setup.ts`, exported as `setup(ctx: Modding.ModContext)`. Webpack bundles it to `dist/setup.mjs`; the manifest (`manifest.json`) is copied into `dist/` at build time.

## Key Files

- `manifest.json` — Melvor mod manifest (namespace: `thievingSimulator`)
- `specs/constitution.md` — full design spec with feature list, mechanics to model, and open tasks
- `specs/formulas.md` — thieving formulas and mechanics reference (interval, stealth, success rate, doubling, loot, synergies)
- `specs/npc-data.md` — complete NPC stats and area data for both Melvor and Abyssal realms
- `types/game-types/` — Melvor game type definitions (manually imported from the Melvor Typing Project)
- `types/game-types/mod.d.ts` — modding API types (`Modding.ModContext`, lifecycle hooks)
- `types/game-types/thieving2.d.ts` — thieving skill types
- `types/game-types/game.d.ts` — root `Game` class types

## TypeScript

- Strict mode enabled with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- Module system: `esnext` with `verbatimModuleSyntax` and `moduleResolution: bundler` — use `import type` syntax for type-only imports
- Target: `esnext`

## Melvor Modding Conventions

- The mod registers via `export function setup(ctx: Modding.ModContext)` in the entry file
- Lifecycle hooks: `ctx.onCharacterLoaded`, `ctx.onInterfaceReady`, etc. — character data is only available after `characterLoaded`
- Game globals like `game` (the `Game` instance) are available at runtime and typed via `types/` — use them directly, no casts needed
- Type definitions in `types/` provide shapes but not runtime behavior — runtime testing against the actual game is required

## Workflow

- `specs/constitution.md` is the design spec — consult it for feature scope, mechanics to model, and architectural decisions.
- `specs/tasks.md` tracks all planned work, derived from the constitution. When completing a task, update its status to Done and check its boxes (`[ ]` → `[x]`).
