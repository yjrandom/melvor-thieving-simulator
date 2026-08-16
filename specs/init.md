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
| Character import       | **Blocked** | Pull current loadout, bonuses, mastery levels, agility setup, potions, prayers, pets, and shop purchases from live game state. |
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
- TypeScript, compiled to JS (`dist/setup.mjs`)
- Type definitions from `melvor-types` (community package)
- UI injected into the game's interface via mod context

### Architecture

Three layers:

1. **State reader** -- extracts character state from the game's live objects
2. **Calculation engine** -- pure functions that take a loadout config and return per-NPC metrics
3. **UI layer** -- renders comparison table and configuration panel

> **Key dependency:** The state reader layer's feasibility depends entirely on what the Melvor modding API exposes. The combat simulator mod is the primary reference for how to access character state, modifier stacking, and equipment data. Its source code must be studied before implementation begins.

---

## Open Tasks

| Task                               | Status      | Notes                                                                                                                               |
| ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Study combat simulator source code | **Blocked** | Prerequisite for everything. Understand how it reads character state, models mechanics, and builds UI. De-risks the entire project. |
| Inventory accessible APIs          | **Blocked** | After studying combat sim: catalog which character state fields are accessible via modding API vs. internal game objects.           |
| Map thieving formulas              | **Done**    | See `specs/formulas.md` — all formulas, modifier stacking, and mechanic details extracted from wiki.                                |
| Catalog NPC/area data              | **Done**    | See `specs/npc-data.md` — all NPC stats, area assignments, and unique drops for both realms.                                        |
| Define UI wireframes               | Gap         | Commit to exact columns for comparison table. Decide configuration panel layout. Keep scope small.                                  |
| Build state reader                 | Gap         | Implement character state import. Depends on API inventory.                                                                         |
| Build calculation engine           | Gap         | Pure functions: loadout config in, per-NPC metrics out. Testable independently of the game.                                         |
| Build UI                           | Gap         | Comparison table, config panel, per-target detail view.                                                                             |
| Set up dev/test loop               | Gap         | Establish a way to load the mod into the game with a save file that has varied mastery levels for realistic testing.                |
| Create `assets/style.css`          | Ready       | Referenced in manifest but doesn't exist yet. Needed before any UI work.                                                            |

---

## Risks

**Critical:** The entire plan assumes the Melvor modding API exposes enough character state to import loadouts. If the combat simulator achieves this through fragile hacks (monkey-patching, accessing private internals), the approach may break across game updates. This risk is resolved by studying the combat simulator source.

**Moderate:** The `melvor-types` community package may not cover all APIs needed. Type definitions give signatures, not behavior -- runtime testing against the actual game is required.

**Low:** Wiki-sourced formulas may diverge from actual game logic. Acceptable given the accuracy tolerance, but specific edge cases (modifier stacking order, stun/potion interactions) should be validated against game source when possible.

---

## Non-Goals

- Pixel-perfect reproduction of the combat simulator's UI complexity
- Simulation-based approach (running N iterations) -- deterministic formula evaluation is sufficient
- Offline/standalone version -- this is an in-game mod only
- Support for non-thieving skills

---

## Next Step

Locate and study the Melvor Combat Simulator mod source code. Specifically answer: how does it read equipped items, active modifiers, and mastery data from the game? What patterns does it use for UI injection? Document findings, then revisit this spec to fill in the **Blocked** items.
