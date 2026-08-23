# Phase 4 — UI

## 4.1 Comparison table (primary screen)

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

## 4.2 Configuration panel

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

## 4.3 Per-target detail view

**Status:** Partial
**Why:** Secondary screen. Drill into one NPC to see loot table, drop confidence intervals, mastery progress estimate. Lower priority than comparison table.

- [x] Loot table breakdown (common drop, NPC unique, area uniques, generic rares)
- [x] Drop chance display with doubling factored in
- [x] Confidence interval calculator (probability of getting N drops in M attempts)
- [ ] Mastery progress estimate (XP to next mastery level at current rate) — deferred: mastery XP per-action formula not documented in specs

**Notes:**

- Clicking a row in the comparison table opens the per-NPC detail view within the Sim tab
- Stats grid shows: success rate, XP/hr, currency/hr, double chance, interval, stun duration, actions/hr, XP/action
- Loot table shows all drop types with per-success chance, quantity range, and expected per hour (factoring in doubling)
- Confidence calculator: binomial probability of at least 1 drop in N actions, with preset buttons (100/500/1K/5K/10K/50K)
- Also shows attempts needed for 50%/90%/99% confidence per drop
- Detail view auto-refreshes when loadout overrides change
- `calc/detail.ts` exports `calcAtLeastOneChance`, `calcAttemptsForChance`, `buildLootTable` — all pure functions with full unit test coverage
