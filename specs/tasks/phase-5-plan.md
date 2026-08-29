# Phase 5 — Implementation Plan

Implementation guide for the remaining Phase 5 tasks (5.1, 5.4, 5.5, 5.6, 5.7).

## Implementation Order

**5.7 → 5.5 → 5.1 → 5.4 → 5.6**

- **5.7** is the simplest (one new field, CSS class, guard) — quick win
- **5.5** requires a new utility (`formatModifier`) that benefits later tasks
- **5.1** touches many files but is mechanical (add `mediaUrl` through the pipeline)
- **5.4** is investigative — needs game type analysis to determine if modifier IDs are actually missing
- **5.6** is the most complex (bidirectional linking, UI restructuring)

---

## Task 5.7 — Disable Equipment Slots With No Applicable Items

### Changes

**`src/templates/tabs/equipment/equipment-tab.template.ts`**
- Add `disabled: boolean` to `EquipmentSlotDisplay`
- Change `buildEquipmentSlots` signature: add 3rd param `availableOptions: Record<string, EquipmentOption[]>`
- Set `disabled: !(slotId in availableOptions) || availableOptions[slotId].length === 0`

**`src/templates/main.template.ts`**
- Pass `props.equipmentOptions` to all `buildEquipmentSlots()` calls (lines ~231, ~269)
- Guard `selectSlot()`: early-return if the slot is disabled

**`src/templates/tabs/equipment/equipment-tab.template.html`**
- Add `'ts-equip-cell--disabled': slot.disabled` to `:class` binding
- Guard click: `@click="slot.disabled ? null : selectSlot(slot.slotId)"`

**`assets/style.css`**
- `.ts-equip-cell--disabled`: `opacity: 0.35; pointer-events: none; cursor: default`

**Tests** (`equipment-tab.template.spec.ts`)
- Slot with options → `disabled: false`
- Slot missing from options map → `disabled: true`
- Slot present but empty array → `disabled: true`

---

## Task 5.5 — Show Boost Details in Equipment Picker

### New utility: `src/utils/modifier-format.ts`

Create `formatModifier(modifier: Modifier): string` and `formatModifiers(modifiers: Modifier[]): string`.

Display label map keyed by `ThievingBoostId`:

| BoostId | Label | Format |
|---------|-------|--------|
| STEALTH | "Stealth" | `+{value}` |
| FLAT_SKILL_INTERVAL | "Interval" | `-{value/1000}s` (ms→s, negative = beneficial) |
| SKILL_INTERVAL | "Interval" | `-{value}%` |
| AREA_UNIQUE_CHANCE | "Area Unique" | `+{value}` |
| AREA_UNIQUE_CHANCE_PERCENT | "Area Unique" | `+{value}%` |
| STUN_AVOID_CHANCE | "Stun Avoid" | `+{value}%` |
| IGNORE_THIEVING_DAMAGE_CHANCE | "Ignore Damage" | `+{value}%` |
| THIEVING_STUN_INTERVAL | "Stun Duration" | `-{value}%` |
| SKILL_XP | "XP" | `+{value}%` |
| GLOBAL_ITEM_DOUBLING_CHANCE | "Item Doubling" | `+{value}%` |

Interval & stun duration display as reductions (negative sign = beneficial). Realm-gated modifiers append `" (Melvor)"` or `" (Abyssal)"`.

`formatModifiers` joins all formatted strings with `, `.

### Changes

**`src/templates/main.template.ts`**
- In `selectSlot()`, map `EquipmentOption[]` to include `formattedModifiers: string` using `formatModifiers()`:
  ```ts
  this.slotOptions = options.map(o => ({
    ...o,
    formattedModifiers: formatModifiers(o.modifiers),
  }));
  ```

**`src/templates/tabs/equipment/equipment-tab.template.html`**
- Change picker item from single `v-text` to two spans:
  ```html
  <button ...>
    <span class="ts-picker-item-name" v-text="option.itemName"></span>
    <span class="ts-picker-item-mods" v-if="option.formattedModifiers" v-text="option.formattedModifiers"></span>
  </button>
  ```

**`assets/style.css`**
- `.ts-equip-picker-item`: change to `display: flex; flex-direction: column; align-items: flex-start`
- `.ts-picker-item-name`: item name styling
- `.ts-picker-item-mods`: `font-size: 0.75rem; color: #8899aa`

**Tests** (`src/utils/modifier-format.spec.ts`)
- Data-driven tests for each `ThievingBoostId` (follow `number-utils.spec.ts` pattern)
- Sign handling, realm scope indicator
- `FLAT_SKILL_INTERVAL` ms-to-seconds conversion
- Empty modifiers array → empty string

---

## Task 5.1 — Item Icons Throughout UI

### Type changes (`src/calc/types.ts`)

Add `mediaUrl?: string` to:
- `EquippedItemEntry`
- `EquipmentOption`
- `Potion`
- `SummoningSynergyInfo` — add `summon1MediaUrl?: string` and `summon2MediaUrl?: string` (two familiar icons per synergy)

### Reader changes (`src/state/reader.ts`)

Capture `item.media` / `product.media` in:
- `readEquipment()`: add `mediaUrl: item.media` (item is already accessed as EquipmentItem)
- `readEquipmentOptions()`: add `mediaUrl: item.media`
- `readActivePotion()` / `readPotionOptions()`: add `mediaUrl: potion.media`
- `readActiveSynergy()` / `readSynergyOptions()`: add `summon1MediaUrl: synergy.summons[0].product.media`, `summon2MediaUrl: synergy.summons[1].product.media`

### Display type changes

- `EquipmentSlotDisplay` → add `mediaUrl?: string`; `buildEquipmentSlots` copies from equipped item
- `PotionOptionDisplay` → add `mediaUrl?: string`; `buildPotionOptions` copies from potion
- `SynergyOptionDisplay` → add `summon1MediaUrl?: string`, `summon2MediaUrl?: string`
- `EquipmentDisplayEntry` (config tab) → add `mediaUrl?: string`; `buildConfigDisplay` copies from equipment

### Template changes

**Equipment tab HTML** — Add `<img>` in paperdoll cells and picker items:
- Paperdoll: `<img v-if="slot.mediaUrl" :src="slot.mediaUrl" class="ts-item-icon">` inside `.ts-equip-cell`
- Picker: `<img v-if="option.mediaUrl" :src="option.mediaUrl" class="ts-item-icon ts-item-icon--sm">` in picker item

**Config tab HTML** — Add icons for potions and synergies:
- Potion buttons: `<img v-if="potion.mediaUrl" :src="potion.mediaUrl" class="ts-item-icon--sm">`
- Synergy buttons: familiar icons using `summon1MediaUrl` and `summon2MediaUrl`

**Simulate tab HTML** — Add icons in loadout summary equipment grid entries

### CSS (`assets/style.css`)
- `.ts-item-icon`: `width: 32px; height: 32px; object-fit: contain`
- `.ts-item-icon--sm`: `width: 20px; height: 20px; object-fit: contain`

### Tests
- Update `makeLoadout` factories to optionally include `mediaUrl`
- Test builders propagate `mediaUrl` when present and handle `undefined`

---

## Task 5.4 — Equipment List Accuracy Audit

### Current state

The `ThievingBoosts` interface has 13 fields. The `MODIFIER_BOOST_MAP` maps 9 of the 10 `ThievingBoostId` values (`IGNORE_THIEVING_DAMAGE_CHANCE` is in the enum but not in the map). The 4 unmapped boost fields are:
- `currencyBonusPercent` — populated by mastery logic only (`getNpcMasteryBoosts`, `getMasteryPoolBoosts`)
- `currencyMultiplierBonus` — populated by special synergy (Devil gamble) only
- `itemMultiplierBonus` — populated by special synergy (Devil gamble) only
- `autoSellMultiplier` — populated by special synergy (auto-sell) only

### Investigation steps

1. Search game type definitions (`types/game-types/`) for modifier IDs related to currency bonuses (e.g., `currencyGain`, `thievingGP`, `currencyGainBasedOnProduct`) to determine if equipment items can carry them
2. Investigate `IGNORE_THIEVING_DAMAGE_CHANCE` — it's in the enum but not in `MODIFIER_BOOST_MAP`. Either add the mapping or document why it's excluded
3. Check for set bonus items: `EquipmentItem` has no obvious `setEquipment` property for set membership. Set bonuses may be managed at a higher level (`ItemSet`, `EquipmentSet`). If set detection is not feasible from item-level data alone, document as a known limitation
4. Based on findings, either:
   - Add missing `ThievingBoostId` values and `MODIFIER_BOOST_MAP` entries
   - Or document that the current filter is correct and set bonuses are out of scope

### Deliverables
- Updated `ThievingBoostId` enum if new modifier IDs found
- Updated `MODIFIER_BOOST_MAP` if new mappings needed
- Resolution for `IGNORE_THIEVING_DAMAGE_CHANCE` gap
- Document findings in phase-5.md for items that can't be resolved without runtime validation

---

## Task 5.6 — Summoning Synergy Linked to Equipment

### Design

**Placement:** Synergy panel goes in the equipment tab, below the paperdoll/picker area.

**Bidirectional linking:**
- Equipping Summon 1 + Summon 2 → auto-selects matching synergy (or clears if no match)
- Selecting a synergy → auto-equips corresponding familiar tablets in Summon 1/2 slots
- Clearing a summon slot → clears the synergy

### Key finding: ID matching

`readActiveSynergy` uses `synergy.summons[0].product.id` which is the `EquipmentItem.id` of the summoning tablet — same as `item.id` in `readEquipment` for summon slots. Equipment item ID = familiar product ID for summon slots. No extra `familiarProductId` field needed.

### Important caveat: tablet visibility

Summoning tablets may NOT appear in the equipment options list because `hasThievingModifier` checks item-level modifiers, and synergy bonuses are on the synergy, not the tablet. Task 5.6 needs to ensure familiar tablets from thieving synergies are included in the SUMMON1/SUMMON2 equipment options even without direct thieving modifiers.

### Changes

**`src/state/reader.ts`**
- After `readEquipmentOptions` builds the options map, inject synergy-relevant familiar tablets into SUMMON1/SUMMON2 slots. For each synergy from `readSynergyOptions`, add the synergy's familiar products as equipment options for summon slots (if not already present). Access `synergy.summons[0].product` and `synergy.summons[1].product` for item data.

**`src/templates/main.template.ts`**
- Add helper: `findMatchingSynergy(summon1ItemId, summon2ItemId)` — searches `props.synergyOptions`
- Add helper: `findEquipmentForFamiliar(slotId, familiarId)` — searches `props.equipmentOptions[slotId]`
- Modify `selectItem()`: after setting equipment override, if slot is SUMMON1 or SUMMON2, call `autoLinkSynergy()`
- Add `autoLinkSynergy()`: reads both summon slots from active loadout, finds matching synergy, sets/clears synergy override
- Modify `selectSynergy()`: also set equipment overrides for SUMMON1 and SUMMON2 using the synergy's familiar IDs
- Modify `clearSlot()` path: if clearing a summon slot, also clear synergy override

**`src/templates/tabs/equipment/equipment-tab.template.html`**
- Add synergy panel section after the picker (reuse `.ts-config-panel` pattern from config tab)
- Synergy options list with selection state, name, and description

**`src/templates/tabs/config/config-tab.template.html`**
- Remove the entire Summoning Synergy panel (lines 20-37)

**`assets/style.css`**
- Synergy panel positioning within equipment tab layout

### Tests
- `findMatchingSynergy()`: matching pair, reversed order, no match, partial match
- `findEquipmentForFamiliar()`: found, not found
- Auto-linking: both summons equipped with valid synergy, no valid synergy, one slot empty
- Synergy selection: auto-equips both summon slots
- Clearing summon slot: clears synergy

---

## File change summary

| File | Tasks |
|------|-------|
| `src/calc/types.ts` | 5.1, (5.4) |
| `src/constants/item-ids.ts` | (5.4) |
| `src/state/reader.ts` | 5.1, (5.4), 5.6 |
| `src/calc/aggregator.ts` | (5.4) |
| `src/utils/modifier-format.ts` | 5.5 (new) |
| `src/utils/modifier-format.spec.ts` | 5.5 (new) |
| `src/templates/tabs/equipment/equipment-tab.template.ts` | 5.1, 5.7 |
| `src/templates/tabs/equipment/equipment-tab.template.html` | 5.1, 5.5, 5.6, 5.7 |
| `src/templates/tabs/equipment/equipment-tab.template.spec.ts` | 5.7 |
| `src/templates/main.template.ts` | 5.1, 5.5, 5.6, 5.7 |
| `src/templates/main.template.spec.ts` | 5.6 |
| `src/templates/tabs/config/config-tab.template.ts` | 5.1 |
| `src/templates/tabs/config/config-tab.template.html` | 5.1, 5.6 |
| `src/templates/tabs/config/config-tab.template.spec.ts` | 5.1 |
| `src/templates/tabs/simulate/simulate-tab.template.html` | 5.1 |
| `assets/style.css` | 5.1, 5.5, 5.6, 5.7 |
| `specs/tasks/phase-5.md` | all (status updates) |

Parenthesized tasks depend on audit findings.
