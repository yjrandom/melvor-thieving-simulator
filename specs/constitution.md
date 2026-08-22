# Melvor Thieving Simulator

Mod specification for a thieving skill calculator and loadout optimizer for Melvor Idle.

**Status:** Draft | **Version:** 0.1 | **Date:** Aug 2026

---

## Objective

Build a Melvor Idle mod that lets players experiment with different loadouts and compare XP/hr (and secondary metrics) across all thieving targets, without switching gear in-game. The mod imports the player's current character state and calculates outcomes for every NPC in one view.

> **Design principle:** This is a gaming aid, not a banking app. Absolute accuracy is a goal, not a gate. Ship something usable, iterate toward precision based on user feedback.

---

## Core Features

| Feature                | Status      | Description                                                                                                                    |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Character import       | **Ready**   | Pull current loadout, bonuses, mastery levels, agility setup, potions, prayers, pets, and shop purchases from live game state via `game` global. |
| Loadout editing        | Gap         | Override imported values to experiment with hypothetical setups: swap equipment, toggle potions, change agility obstacles.     |
| All-targets comparison | Gap         | Single-screen table showing every thieving NPC with derived XP/hr and GP/hr for the active loadout configuration.              |
| Per-target detail      | Gap         | Drill into an individual NPC to see loot table breakdown, success rate, stun impact, and drop confidence intervals.            |
| GP/hr with synergies   | Gap         | Account for special setups like summoning synergies (e.g., item-to-GP conversion at x15 multiplier) in gold calculations.      |

---

## Mechanics to Model

Thieving outcomes depend on a stack of modifiers. The following sources must be accounted for in the calculation engine:

- Base NPC success rate and XP values
- Mastery level per NPC (affects success chance, doubles, area bonuses)
- Mastery pool checkpoint bonuses
- Equipment modifiers (Thieving Gloves, Chapeau Noir, etc.)
- Potion effects (Gentle Hands tiers)
- Prayer bonuses
- Agility course obstacle and pillar effects
- Astrology modifiers
- Pet effects
- Shop purchases affecting thieving
- Stun duration and its impact on effective XP/hr
- Summoning synergies for GP calculations
- Township bonuses (expansion content)

### Data source decision

Primary source: game source code where formulas can be directly extracted. Fallback: the Melvor wiki. Discrepancies found during usage are acceptable and will be fixed iteratively.

---

## UI Concept

### Comparison view (primary screen)

A table of all unlocked thieving NPCs, sorted by XP/hr by default. Key columns:

- **NPC name** and area
- **XP/hr** (primary metric)
- **GP/hr** (including synergy effects if active)
- **Success rate** (%)

Scope is deliberately smaller than the combat simulator's UI. One screen for comparison, one for configuration.

### Configuration panel

Similar in concept to the combat simulator's loadout panel, but reduced scope: equipment slots relevant to thieving, potion selector, prayer toggles, agility course setup. Must support both "import from character" and manual override.

### Per-target detail (secondary)

Expanded view for a single NPC. Loot table with drop rates, confidence intervals for specific drops over N attempts, mastery progress estimate.

---

## Technical Approach

### Platform

- Melvor Idle mod via the official modding API
- TypeScript, compiled to JS via Webpack
- Entry point: `src/setup.ts`, exported as `setup(ctx: Modding.ModContext)` → bundles to `dist/setup.mjs`
- Manifest (`manifest.json`) copied into `dist/` at build time
- Type definitions from `melvor-typing-project` (manually imported community package) — see `types/` below
- UI injected into the game's interface via mod context

### Type definitions (`types/`)

Imported from the [Melvor Typing Project](https://github.com/GamesByMalcsPtyLtd/Melvor-Typing-Project/). Generated from the game's source code, though currently only verified up to game version V1.2. Two subdirectories:

- **`game-types/`** — type definitions for game internals: skills, items, combat, modding API, UI components, etc. These define the shape of runtime globals like `game`, `thievingMenu`, and the `Modding.ModContext` lifecycle.
- **`library-types/`** — type definitions for third-party libraries the game exposes as globals (e.g., Tippy.js, SweetAlert, Sortable, Pixi.js, petite-vue, Fuse.js). Available for use in mod UI code without bundling.

Key files in `game-types/`:
- `mod.d.ts` — modding API types (`Modding.ModContext`, lifecycle hooks)
- `thieving2.d.ts` — thieving skill types
- `game.d.ts` — root `Game` class types

### Architecture

Three layers, all in `src/`:

1. **State reader** — extracts character state (equipment, mastery, modifiers, potions, agility, etc.) from live game objects via the Melvor modding API
2. **Calculation engine** — pure functions: loadout config in, per-NPC metrics (XP/hr, GP/hr, success rate) out
3. **UI layer** — comparison table and configuration panel injected into the game interface

> **Key dependency:** The state reader layer's feasibility depends entirely on what the Melvor modding API exposes. The combat simulator mod is the primary reference for how to access character state, modifier stacking, and equipment data. Its source code must be studied before implementation begins.

### Modding conventions

- The mod registers via `export function setup(ctx: Modding.ModContext)` in the entry file
- Lifecycle hooks: `ctx.onCharacterLoaded`, `ctx.onInterfaceReady`, etc. — character data is only available after `characterLoaded`
- Game globals like `game` (the `Game` instance) are available at runtime and typed via `types/` — use them directly, no casts needed

---

## Open Tasks

| Task                               | Status      | Notes                                                                                                                               |
| ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Study combat simulator source code | **Resolved** | Game types confirm character state is accessible via the `game` global — no need to reverse-engineer the combat simulator's approach. Still useful as UI reference. |
| Inventory accessible APIs          | **Resolved** | Key APIs identified: `game.thieving`, `game.combat.player`, `game.potions`, `game.agility`, `game.astrology`, `game.modifiers`. All available after `ctx.onCharacterLoaded`. |
| Map thieving formulas              | **Done**    | See `specs/formulas.md` — all formulas, modifier stacking, and mechanic details extracted from wiki.                                |
| Catalog NPC/area data              | **Done**    | See `specs/npc-data.md` — all NPC stats, area assignments, and unique drops for both realms.                                        |
| Define UI wireframes               | **Done**    | Columns defined: NPC, Area, Level, XP/hr, GP/hr, Success %, Double %. Realm tabs for filtering.                                    |
| Build state reader                 | **Done**    | `readLoadout`, `readTargets`, `readAreas`, `readAllMasteryLevels` in `state/reader.ts`.                                            |
| Build calculation engine           | **Done**    | Pure functions in `calc/thieving.ts` and `calc/aggregator.ts`. Fully tested.                                                        |
| Build UI                           | **Partial** | Comparison table (4.1) done. Config panel (4.2) and per-target detail (4.3) remaining.                                              |
| Set up dev/test loop               | Gap         | Establish a way to load the mod into the game with a save file that has varied mastery levels for realistic testing.                |
| Create `assets/style.css`          | **Done**    | Styled comparison table with dark theme matching Melvor aesthetic. Loaded via manifest.                                             |

---

## Risks

**Critical (Resolved):** The `game` global exposes character state directly — `game.thieving`, `game.combat.player`, `game.modifiers`, etc. No fragile hacks needed. The `melvor-types` package provides type coverage for these APIs.

**Moderate:** The imported `types` may not cover all APIs needed, as the latest version only supports up to game version v1.2.0. Type definitions provide shapes but not runtime behavior — runtime testing against the actual game is required.

**Low:** Wiki-sourced formulas may diverge from actual game logic. Acceptable given the accuracy tolerance, but specific edge cases (modifier stacking order, stun/potion interactions) should be validated against game source when possible.

---

## Out-of-scope

- Pixel-perfect reproduction of the combat simulator's UI complexity
- Simulation-based approach (running N iterations) -- deterministic formula evaluation is sufficient
- Offline/standalone version -- this is an in-game mod only
- Support for non-thieving skills

