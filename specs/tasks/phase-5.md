# Phase 5 — UI Polish & UX Improvements

## 5.1 Item icons throughout UI

**Status:** Ready
**Why:** Equipment, potions, and synergies are displayed as text-only item names. Melvor items expose icons via `item.media` — using these makes items instantly recognizable and aligns with the game's visual language.

- [ ] Extend data models (`EquippedItemEntry`, `EquipmentOption`, `Potion`, `SummoningSynergyInfo`) with a `mediaUrl` field
- [ ] Update `state/reader.ts` to capture `item.media` / `potion.media` etc. when reading from game state
- [ ] Show icons in the equipment tab paperdoll (slot cells)
- [ ] Show icons in the equipment picker list (next to each selectable item)
- [ ] Show icons in the sim tab loadout summary (equipment section)
- [ ] Show icons for potions in the config tab selector
- [ ] Show icons for synergies in the config tab selector (or wherever synergy UI moves — see 5.6)

## 5.2 Default sort by level ascending

**Status:** Ready
**Why:** NPC list default sort is XP/hr DESC. Level ASC is a more intuitive default — players scan for NPCs near their level. Column header sorting still works for other orderings.

- [ ] Change default `sortColumn` to `SortColumn.LEVEL` and `sortDirection` to `SortDirection.ASC` in `MainModal`

## 5.3 Zero loadout on initial load (no forced import)

**Status:** Ready
**Why:** Currently the mod blocks all content until the user clicks "Import Character". The mod should start with a blank/zero loadout so the NPC table is immediately visible. The import button still exists to pull in the player's actual character state.

- [ ] Create a default zero-state `ThievingLoadout` (empty equipment, level 1, 0% mastery pools, no potion/prayers/agility/astrology/pets/shop/synergy)
- [ ] Initialize `MainModal` with this zero loadout and default mastery levels (all 1) — skip the `hasImported` gate for the table
- [ ] Keep the "Import Character" button visible so users can import their real loadout at any time
- [ ] Future: level/stat overrides will let users configure hypothetical characters without importing

## 5.4 Equipment list accuracy audit

**Status:** Ready
**Why:** The equipment option list has suspected inaccuracies — items appearing that have no thieving effect, and items missing that do (particularly set bonus items). The filter in `readEquipmentOptions` uses `hasThievingModifier` which only checks direct item modifiers, not set bonuses.

- [ ] Audit `readEquipmentOptions` filter logic — currently checks `item.modifiers` for thieving boost IDs; items with only set-level bonuses are missed
- [ ] Investigate whether set bonus items (e.g., Thieving Skill outfit pieces) should be included and how to resolve their set-level modifiers
- [ ] Remove items that appear but have no actual thieving impact (false positives from modifier ID matching)
- [ ] Document any items that cannot be resolved without runtime validation

## 5.5 Show boost details in equipment picker

**Status:** Ready
**Why:** The equipment picker shows only item names. Players need to see what each item does (e.g., "+10 Stealth", "-0.1s Interval") to make informed loadout decisions.

- [ ] Format resolved modifiers into human-readable strings (e.g., `ThievingBoostId.STEALTH` value 10 → "+10 Stealth")
- [ ] Display formatted modifiers below each item name in the equipment picker list
- [ ] Include realm scope indicator if the modifier is realm-gated (e.g., "Melvor only")

## 5.6 Summoning synergy linked to equipment

**Status:** Ready
**Why:** Summoning synergies are currently a separate selector in the Config tab. They are functionally linked to the Summon 1/2 equipment slots — equipping two specific familiars determines the available synergy, and vice versa.

- [ ] Move synergy selection into the equipment tab (placement TBD — could be a section below paperdoll, or contextual when summon slots are selected)
- [ ] Auto-populate synergy when both Summon 1 and Summon 2 are equipped with a valid synergy pair
- [ ] Auto-equip Summon 1/2 slots when a synergy is selected directly (bidirectional linking)
- [ ] Remove synergy section from the Config tab after migration
- [ ] Ensure override state remains consistent (changing one summon slot clears the synergy if the pair is no longer valid)

## 5.7 Disable equipment slots with no applicable items

**Status:** Ready
**Why:** All 19 equipment slots are shown and clickable, even slots with zero thieving-relevant items available. Non-interactive greyed-out slots reduce noise and guide users to meaningful choices.

- [ ] Determine which slots have available options at initialization (from `equipmentOptions` keys)
- [ ] Add a `disabled` flag to `EquipmentSlotDisplay`
- [ ] Grey out disabled slots visually (dimmed, no hover effect)
- [ ] Make disabled slots non-interactive (no click handler, no picker opening)
