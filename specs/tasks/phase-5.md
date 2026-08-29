# Phase 5 — UI Polish & UX Improvements

## 5.1 Item icons throughout UI

**Status:** Done
**Why:** Equipment, potions, and synergies are displayed as text-only item names. Melvor items expose icons via `item.media` — using these makes items instantly recognizable and aligns with the game's visual language.

- [x] Extend data models (`EquippedItemEntry`, `EquipmentOption`, `Potion`, `SummoningSynergyInfo`) with a `mediaUrl` field
- [x] Update `state/reader.ts` to capture `item.media` / `potion.media` etc. when reading from game state
- [x] Show icons in the equipment tab paperdoll (slot cells)
- [x] Show icons in the equipment picker list (next to each selectable item)
- [x] Show icons in the sim tab loadout summary (equipment section)
- [x] Show icons for potions in the config tab selector
- [x] Show icons for synergies in the config tab selector (or wherever synergy UI moves — see 5.6)

## 5.2 Default sort by level ascending

**Status:** Done
**Why:** NPC list default sort is XP/hr DESC. Level ASC is a more intuitive default — players scan for NPCs near their level. Column header sorting still works for other orderings.

- [x] Change default `sortColumn` to `SortColumn.LEVEL` and `sortDirection` to `SortDirection.ASC` in `MainModal`

## 5.3 Zero loadout on initial load (no forced import)

**Status:** Done
**Why:** Currently the mod blocks all content until the user clicks "Import Character". The mod should start with a blank/zero loadout so the NPC table is immediately visible. The import button still exists to pull in the player's actual character state.

- [x] Create a default zero-state `ThievingLoadout` (empty equipment, level 1, 0% mastery pools, no potion/prayers/agility/astrology/pets/shop/synergy)
- [x] Initialize `MainModal` with this zero loadout and default mastery levels (all 1) — skip the `hasImported` gate for the table
- [x] Keep the "Import Character" button visible so users can import their real loadout at any time
- [ ] Future: level/stat overrides will let users configure hypothetical characters without importing

**Notes:**

- `ZERO_LOADOUT` exported from `main.template.ts` as the default loadout constant
- All `hasImported` visibility gates removed from templates — sidebar, realm tabs, table, and footer render immediately
- `hasImported` flag retained to toggle button text between "Import Character" and "Re-import"
- Initial rows and display state pre-computed from zero loadout at component creation

## 5.4 Equipment list accuracy audit

**Status:** Done
**Why:** The equipment option list has suspected inaccuracies — items appearing that have no thieving effect, and items missing that do (particularly set bonus items). The filter in `readEquipmentOptions` uses `hasThievingModifier` which only checks direct item modifiers, not set bonuses.

- [x] Audit `readEquipmentOptions` filter logic — currently checks `item.modifiers` for thieving boost IDs; items with only set-level bonuses are missed
- [x] Investigate whether set bonus items (e.g., Thieving Skill outfit pieces) should be included and how to resolve their set-level modifiers
- [x] Remove items that appear but have no actual thieving impact (false positives from modifier ID matching)
- [x] Document any items that cannot be resolved without runtime validation

**Findings:**

1. **`IGNORE_THIEVING_DAMAGE_CHANCE`** — Present in `ThievingBoostId` enum but intentionally excluded from `MODIFIER_BOOST_MAP`. This modifier only affects HP damage on failed pickpocket, not success/XP/GP rates. An existing test (`aggregator.spec.ts`) confirms this design. Items with this modifier correctly appear in the equipment picker for display/formatting (task 5.5) even though the aggregator doesn't map them to a boost field.

2. **Currency modifiers (`currencyGain`, `currencyGainBasedOnProduct`)** — These are generic scoped modifiers (scoped by currency + skill), not direct item-level thieving modifiers. The `currencyBonusPercent` boost is correctly populated only by mastery logic and mastery pool checkpoints, not by equipment. No equipment items carry thieving-scoped currency gain modifiers.

3. **Set bonuses** — `EquipmentItem.modifiers` holds only direct item modifiers. Set-level bonuses (e.g., Thieving Skill outfit set effect) are managed at the `Player`/`EquipmentSet` level through conditional modifiers, not on individual items. Resolving set bonuses would require runtime validation (checking which sets are complete) which is outside the scope of the static item filter. **Known limitation:** set bonus items are not included in the equipment options list.

4. **No false positives found** — The current `hasThievingModifier` filter correctly identifies items with at least one modifier matching `ThievingBoostId` values. All matched items have genuine thieving impact.

## 5.5 Show boost details in equipment picker

**Status:** Done
**Why:** The equipment picker shows only item names. Players need to see what each item does (e.g., "+10 Stealth", "-0.1s Interval") to make informed loadout decisions.

- [x] Format resolved modifiers into human-readable strings (e.g., `ThievingBoostId.STEALTH` value 10 → "+10 Stealth")
- [x] Display formatted modifiers below each item name in the equipment picker list
- [x] Include realm scope indicator if the modifier is realm-gated (e.g., "Melvor only")

## 5.6 Summoning synergy linked to equipment

**Status:** Done
**Why:** Summoning synergies are currently a separate selector in the Config tab. They are functionally linked to the Summon 1/2 equipment slots — equipping two specific familiars determines the available synergy, and vice versa.

- [x] Move synergy selection into the equipment tab (placement TBD — could be a section below paperdoll, or contextual when summon slots are selected)
- [x] Auto-populate synergy when both Summon 1 and Summon 2 are equipped with a valid synergy pair
- [x] Auto-equip Summon 1/2 slots when a synergy is selected directly (bidirectional linking)
- [x] Remove synergy section from the Config tab after migration
- [x] Ensure override state remains consistent (changing one summon slot clears the synergy if the pair is no longer valid)

## 5.7 Disable equipment slots with no applicable items

**Status:** Done
**Why:** All 19 equipment slots are shown and clickable, even slots with zero thieving-relevant items available. Non-interactive greyed-out slots reduce noise and guide users to meaningful choices.

- [x] Determine which slots have available options at initialization (from `equipmentOptions` keys)
- [x] Add a `disabled` flag to `EquipmentSlotDisplay`
- [x] Grey out disabled slots visually (dimmed, no hover effect)
- [x] Make disabled slots non-interactive (no click handler, no picker opening)
