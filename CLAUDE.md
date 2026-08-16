# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Melvor Idle mod that simulates thieving outcomes for different loadouts, letting players compare XP/hr and GP/hr across all thieving NPCs without switching gear in-game. Built against the official Melvor modding API.

The project is in early stages — `src/setup.mts` is a scaffold and the spec in `specs/init.md` is the design document.

## Build

```bash
pnpm install
pnpm exec tsc          # compiles src/ → dist/
```

No test runner is configured yet. No linter.

## Architecture (Planned)

Three layers, all in `src/`:

1. **State reader** — extracts character state (equipment, mastery, modifiers, potions, agility, etc.) from live game objects via the Melvor modding API
2. **Calculation engine** — pure functions: loadout config in, per-NPC metrics (XP/hr, GP/hr, success rate) out
3. **UI layer** — comparison table and configuration panel injected into the game interface

The mod entry point is `src/setup.mts`, exported as `setup(ctx: Modding.ModContext)`. The manifest (`manifest.json`) points the game to `dist/setup.mjs`.

## Key Files

- `manifest.json` — Melvor mod manifest (namespace: `melvorThievingSimulator`)
- `specs/init.md` — full design spec with feature list, mechanics to model, and open tasks
- `types/game-types/` — Melvor game type definitions from `melvor-types` (community package, installed via GitHub)
- `types/game-types/mod.d.ts` — modding API types (`Modding.ModContext`, lifecycle hooks)
- `types/game-types/thieving2.d.ts` — thieving skill types
- `types/game-types/game.d.ts` — root `Game` class types

## TypeScript

- Strict mode enabled with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- Module system: `nodenext` with `verbatimModuleSyntax` — use explicit `.mts` extensions and `import type` syntax
- Target: `esnext`

## Melvor Modding Conventions

- The mod registers via `export function setup(ctx: Modding.ModContext)` in the entry file
- Lifecycle hooks: `ctx.onCharacterLoaded`, `ctx.onInterfaceReady`, etc. — character data is only available after `characterLoaded`
- Game globals like `game` (the `Game` instance) are available at runtime but not typed in the project's own source — access them through the modding API or cast from `globalThis`
- The `melvor-types` package provides type definitions but not runtime behavior — runtime testing against the actual game is required
