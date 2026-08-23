# Task Breakdown

Derived from `constitution.md` and actual project state as of 2026-08-16.

---

## Legend

| Symbol  | Meaning                                    |
| ------- | ------------------------------------------ |
| Done    | Implemented and working                    |
| Partial | Started but incomplete or has known issues |
| Ready   | Dependencies met, can start now            |
| Blocked | Waiting on another task                    |

---

## Phase 0 — Fix Foundations

Things that are broken or missing but block all forward progress.

### 0.1 Fix Jest configuration

**Status:** Done
**Why:** Tests pass on `.ts` source via SWC but Jest also picks up compiled `.js` files from `dist/` which crash on ESM imports. `@swc/jest` is installed but no `jest.config` wires it up properly. Test infrastructure must work before adding calc engine tests.

- [x] Add `jest.config.ts` (or `.js`) with SWC transform
- [x] Exclude `dist/` and `node_modules/` from test roots
- [x] Verify `pnpm test` passes cleanly

### 0.2 Create `assets/style.css`

**Status:** Done
**Why:** `manifest.json` references `assets/style.css` in the `load` array. The mod will fail to load without it. Empty file is fine until UI work begins.

- [x] Create empty `assets/style.css`

### 0.3 Wire up `setup.mts` scaffold

**Status:** Done
**Why:** Entry point is `console.log('Hello World!')`. Needs lifecycle hooks so the mod actually initializes. No functionality yet, just the skeleton.

- [x] Register `ctx.onCharacterLoaded` callback
- [x] Register `ctx.onInterfaceReady` callback
- [x] Import and call `readTargets` / `readAreas` in `onCharacterLoaded` to verify data flows

---

## Phase 1 — Loadout Configuration & Boost Aggregation

Two distinct layers:

1. **Loadout configuration** — responsible for fetching current player state from the game and (later) applying user overrides. Produces a complete loadout description.
2. **Boost aggregator** — pure function that takes a loadout and a target NPC, derives the flat `ThievingBoosts` the calc engine consumes. No game dependency — fully testable offline.

Initial scope: **read-only import of current loadout** (no hypothetical overrides yet).

### 1.1 Define loadout types

**Status:** Done
**Why:** Need a type representing a complete loadout — everything that affects thieving outcomes. This is the contract between the loadout layer and the boost aggregator.

- [x] Define `ThievingLoadout` interface in `calc/types.ts`
- [x] Fields for: equipped items (by slot), mastery levels (per NPC ID), mastery pool percentages (melvor + abyssal), active potion (id + tier), active prayers, agility obstacles + pillar, astrology modifiers (Ko constellation), active pets, relevant shop purchases, active summoning familiars/synergy, skill level, abyssal skill level
- [x] Keep it a plain data object — no game types, no classes

### 1.2 Build loadout reader (current state only)

**Status:** Done
**Why:** Must extract the player's current loadout from the game's live objects (`game.combat.player`, `game.potions`, `game.agility`, `game.astrology`, `game.modifiers`, etc.). This is the untested part — requires runtime validation against the actual game.

- [x] Implement `readLoadout(game: Game): ThievingLoadout` in `state/reader.ts`
- [x] Read equipped items relevant to thieving (by slot ID, with resolved modifier values from game objects)
- [x] Read mastery levels per NPC and mastery pool percentages (both realms)
- [x] Read active potion (Gentle Hands / Silent Thief — id and tier)
- [x] Read active prayers
- [x] Read agility course obstacles and pillar effects
- [x] Read astrology (Ko constellation) modifiers
- [x] Read active pets
- [x] Read relevant shop purchases
- [x] Read active summoning familiars and synergy
- [x] Read thieving skill level and abyssal skill level

### 1.3 Build boost aggregator

**Status:** Done
**Why:** Pure function that converts a `ThievingLoadout` + per-NPC context into a `ThievingBoosts` object. This is where the modifier stacking logic lives. Standalone module (`calc/aggregator.ts`), no game dependency.

- [x] Implement `aggregateBoosts(loadout: ThievingLoadout, target: ThievingTarget): ThievingBoosts`
- [x] Sum stealth from all sources (equipment, mastery level, mastery pool, potion, skillcape, astrology, skill level)
- [x] Sum flat interval reductions (mastery 50, mastery pool 25%, agility, skillcape)
- [x] Sum percentage interval reductions (astrology, ItA sources)
- [x] Sum XP bonus modifiers
- [x] Sum currency bonus modifiers (mastery pool 50%, skillcape)
- [x] Sum double chance modifiers (from equipment/other sources beyond stealth-based)
- [x] Sum stun avoidance (Thieving Shorts, Grappling Hook, Superior Skillcape, synergies)
- [x] Sum stun duration reduction (Rooftop Climb, Masquerade Mask)
- [x] Sum area unique bonus (mastery pool 95%, Hunter's Journal, synergies)
- [x] Handle realm-specific modifier gating (Melvor vs Abyssal)

### 1.4 Unit tests for boost aggregation

**Status:** Done
**Why:** The aggregator is the most bug-prone part of the system — complex stacking rules, realm-specific gating, and many edge cases. Must be tested independently of the game.

- [x] Test stealth stacking from multiple sources
- [x] Test realm-gated bonuses (e.g., Melvor pool bonuses don't apply to Abyssal NPCs)
- [x] Test per-NPC mastery level contribution
- [x] Test interval reduction with floor clamping
- [x] Test skillcape vs superior skillcape (replacement, not stacking)

---

## Phase 2 — Harden the Calculation Engine

The calc engine (`src/calc/thieving.ts`) implements the core formulas. It needs tests and coverage for edge cases.

### 2.1 Unit tests for calc engine

**Status:** Done
**Why:** `calcThieving` and its component functions have zero test coverage. The formulas are documented in `formulas.md` — tests should verify against the worked examples there.

- [x] Test `calcSuccessRate` — including 100% cap when stealth >= perception
- [x] Test `calcEffectiveInterval` — flat reduction, floor clamping, percentage reduction
- [x] Test `calcStunDuration` — percentage reduction, zero floor
- [x] Test `calcDoubleChance` — stealth-based + additive bonus, 100% cap
- [x] Test `calcNpcUniqueChance`
- [x] Test `calcAreaUniqueChance` — percentage + flat bonus stacking
- [x] Test `calcThieving` — end-to-end with known fixture data, verify XP/hr matches manual calculation
- [x] Test stun avoidance integration in `calcThieving` — verify it reduces effective stun rate

### 2.2 Summoning synergy support in boost aggregator

**Status:** Done
**Why:** `formulas.md` documents ~18 synergies. Some change GP calculation fundamentally (Leprechaun + Monkey auto-sell, Leprechaun + Devil gamble). The calc engine stays synergy-unaware — all synergy effects are resolved in the boost aggregator and expressed as `ThievingBoosts` fields before reaching the calculator.

- [x] Extend `ThievingBoosts` if needed to express synergy net effects (e.g., currency multiplier field for auto-sell, item multiplier for Devil gamble)
- [x] Implement Leprechaun + Monkey auto-sell as a currency bonus in the aggregator
- [x] Implement Leprechaun + Devil gamble as expected-value adjustments to currency and doubling fields
- [x] Implement other synergies as flat modifier adjustments in the aggregator
- [x] Unit tests for each synergy path (aggregator level, not calc level)

**Notes:**
- Three new fields added to `ThievingBoosts`: `currencyMultiplierBonus`, `itemMultiplierBonus`, `autoSellMultiplier`
- Devil gamble EV: currency 1.35x (bonus 0.35), items 1.9x (bonus 0.9)
- Auto-sell: aggregator sets `autoSellMultiplier = 15`; calc engine integration deferred until common drop sell price data is added to `ThievingTarget`
- `itemMultiplierBonus` tracked but not yet consumed by the calc engine (needs item value → GP/hr path)
- Bug fixed: `IGNORE_THIEVING_DAMAGE_CHANCE` was incorrectly mapped to `stunAvoidancePercent` — ignoring damage does not avoid the stun time penalty, so it was removed from the modifier map

---

## Phase 3 — Loadout Editing (Hypothetical Overrides)

Without this, the mod is a read-only stats viewer — not a simulator. Deferred from Phase 1 to ship a working read-only version first.

### 3.1 Define loadout override type

**Status:** Done
**Why:** Need a type representing user overrides on top of imported state. Must support partial overrides (change one piece of equipment, leave the rest imported).

- [x] Define `LoadoutOverrides` type — partial overlay on `ThievingLoadout`
- [x] Implement merge function: `applyOverrides(imported: ThievingLoadout, overrides: LoadoutOverrides): ThievingLoadout`

**Notes:**
- `LoadoutOverrides` uses a three-state pattern: absent (undefined) = keep imported, present = replace, `null` = clear
- Per-slot fields (equipment keyed by slot ID, agility keyed by slot number) enable granular overrides without replacing entire arrays
- Non-overridable fields: mastery pool percentages, astrology, pets, shop purchases — these are fixed character state
- Implementation in `state/overrides.ts`, unit tests in `state/overrides.spec.ts`

### 3.2 Equipment override logic

**Status:** Done
**Why:** Players want to swap equipment slots and see how XP/hr changes. Need to know which equipment slots are thieving-relevant and their modifier effects.

- [x] Catalog thieving-relevant equipment slots and their modifier contributions
- [x] Implement equipment swap in override merge

**Notes:**
- Equipment overrides keyed by `ThievingEquipmentSlotId` string values (e.g., `melvorD:Gloves`)
- Merge logic: imported equipment indexed by `slotId` into a Map; overrides replace/delete/add entries; unmentioned slots preserved
- Thieving-relevant slots already catalogued in `ThievingEquipmentSlotId` enum (19 slots)

### 3.3 Potion / Prayer / Agility toggles

**Status:** Done
**Why:** Simpler overrides — on/off toggles or tier selection rather than full equipment management.

- [x] Potion override (select tier or none)
- [x] Prayer toggle override
- [x] Agility obstacle override
- [x] Summoning familiar/synergy override

**Notes:**
- Potion/prayer/synergy use the `null` = clear pattern for toggling off
- Agility obstacles and pillars use per-slot override via `Record<number, T | null>`, same pattern as equipment

---

## Phase 4 — UI

### 4.1 Comparison table (primary screen)

**Status:** Done
**Why:** Core deliverable. A table of all thieving NPCs showing XP/hr, GP/hr, success rate for the active loadout. Requires working boost aggregation and calc engine.

- [x] Define table columns (NPC name, area, level, XP/hr, GP/hr, success rate, double chance)
- [x] Implement table rendering (injected into game UI via mod context)
- [x] Default sort by XP/hr, allow column sorting
- [x] Realm tabs or filter (Melvor / Abyssal / All)
- [x] Style with `assets/style.css`

**Notes:**
- Reader extended with `readAllMasteryLevels` for bulk per-NPC mastery; `readLoadout` no longer requires a selected NPC
- `MainModal` component pre-computes all rows via aggregator + calc engine, exposes reactive sort/filter
- Number formatting utilities added: `formatNumber` (K/M/B suffixes) and `formatPercent`
- CSS loaded via manifest `load` array, copied to `dist/` by webpack CopyPlugin
- Mastery level shown as a badge next to NPC name in each row

### 4.2 Configuration panel

**Status:** Done
**Why:** Import button + override controls. Where the user selects hypothetical loadouts.

- [x] "Import from character" button
- [x] Equipment slot selectors (thieving-relevant slots only)
- [x] Potion selector (clickable list with selection tracking)
- [x] Prayer toggles — deferred (prayers have no thieving modifiers in the current system; display-only summary shown in loadout panel)
- [x] Agility course selector (display with per-slot clear)
- [x] Summoning synergy selector (name + description, click to select/deselect)
- [x] "Reset to imported" button (resets all overrides, not just equipment)

**Notes:**
- New "Config" sidebar tab consolidates potion, synergy, and agility selectors
- Equipment "Reset All" button label corrected to "Reset Equipment"; previous behavior was bugged (clearing all equipment instead of restoring imported)
- `buildAgilitySlots` shows imported obstacles/pillars with clear-per-slot; full obstacle picker deferred
- `readPotionOptions` and `readSynergyOptions` added to `state/reader.ts` for enumerating available options
- `SummoningSynergyInfo` extended with `name` field for display
- `refreshDisplay` helper consolidates all display state updates, replacing duplicated code

### 4.3 Per-target detail view

**Status:** Ready
**Why:** Secondary screen. Drill into one NPC to see loot table, drop confidence intervals, mastery progress estimate. Lower priority than comparison table.

- [ ] Loot table breakdown (common drop, NPC unique, area uniques, generic rares)
- [ ] Drop chance display with doubling factored in
- [ ] Confidence interval calculator (probability of getting N drops in M attempts)
- [ ] Mastery progress estimate (XP to next mastery level at current rate)

---

## Phase 5 — Dev/Test Loop & Polish

### 5.1 Dev environment setup

**Status:** Ready
**Why:** Need a way to load the mod into the game with a save file that has varied mastery levels. Without this, runtime testing is guesswork.

- [ ] Document how to load the mod into Melvor Idle (Steam or browser)
- [ ] Create or obtain a test save file with varied mastery levels
- [ ] Establish a quick reload cycle (change code → compile → reload mod)

### 5.2 Runtime validation

**Status:** Blocked on 1.2, 5.1
**Why:** Type definitions give API shapes but not behavior. Must verify that `readLoadout` actually returns correct values by comparing mod output against known in-game state.

- [ ] Compare mod output against in-game thieving stats for a known save
- [ ] Identify and fix discrepancies between wiki formulas and actual game behavior
- [ ] Verify modifier stacking order matches game implementation

---

## Resolved Decisions

1. **Synergy modeling:** The calc engine stays synergy-unaware. All synergy effects are resolved in the boost aggregator and expressed as `ThievingBoosts` fields. The calculator never sees synergy types — it just computes from the flat boosts it receives.

2. **Formula source of truth:** Wiki-sourced formulas are the source of truth unless formulas can be obtained from the game API. Ship wiki-based, fix discrepancies on user reports.
