# Config Panel: Import & State Display

Feature spec for the configuration panel — the UI that represents the simulation's active loadout state.

**Status:** Ready | **Task ref:** 4.2 in `tasks.md`

---

## Problem

The mod currently loads the player's loadout eagerly on `onInterfaceReady` and feeds it directly into the comparison table. There is:

- No empty starting state — simulation results appear immediately with no context
- No UI showing _what_ state the simulation is using
- No way to re-import after changing gear in-game

The user has no visibility into what data drives the numbers they see.

## Goal

The mod starts with no state populated. An "Import Character" button reads the player's current equipment and loadout. A config panel displays the imported state so the user can confirm what's being simulated before reading the comparison table.

Equipment sets are out of scope for this spec — only the current (active) equipment set is imported. The design should not preclude adding a set selector later.

---

## Data Flow

### Current (before)

```
setup.ts: onInterfaceReady
  ├── readLoadout(game)
  ├── readAllMasteryLevels(game.thieving)
  └── MainModal({ targets, areas, loadout, masteryLevels })
        └── rows computed eagerly at construction
```

### Proposed (after)

```
setup.ts: onInterfaceReady
  ├── readTargets / readAreas (still eager — NPC data, not player state)
  └── MainModal({ targets, areas, onImport })
        ├── starts empty: no rows, no config display
        └── user clicks "Import Character"
              ├── onImport() → readLoadout + readAllMasteryLevels
              ├── configDisplay populated from loadout
              ├── allRows populated via buildRows
              └── table renders
```

### Why `onImport` is a callback

The `MainModal` component shouldn't depend on the `game` global directly. Passing `onImport: () => ImportResult` keeps the component a pure UI consumer of serialized data, and makes it testable without game mocks. The callback also makes it straightforward to add parameters later (e.g., equipment set index).

### Closure storage for imported loadout

The raw `ThievingLoadout` object contains `Set` and `Map` fields that may not play well with petite-vue's reactive proxy. It is stored in a **closure variable** inside the `MainModal` function, _not_ on the reactive scope. This keeps it available for the future override system (`applyOverrides(importedLoadout, overrides)`) without reactivity issues.

Only pre-formatted display data (`ConfigDisplay`) and comparison rows (`ComparisonRow[]`) go on the reactive scope.

---

## UI Structure

The config panel is a new section inside `ts-modal-body`, placed above the comparison table.

### Empty state (before import)

```
┌──────────────────────────────────────────────────────────┐
│ Thieving Simulator                                  [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│     Import your character's loadout to begin simulation. │
│                  [ Import Character ]                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                   (table hidden)                         │
└──────────────────────────────────────────────────────────┘
```

- Realm tabs in the header are hidden (meaningless without data)
- Table and footer are hidden
- Centered prompt + primary-styled button

### Loaded state (after import)

```
┌──────────────────────────────────────────────────────────┐
│ Thieving Simulator           [All] [Melvor] [Abyssal] [X]│
├──────────────────────────────────────────────────────────┤
│ Loadout                                    [Re-import]   │
│ ┌ EQUIPMENT ────────────────────────────────────────────┐│
│ │ Head: Golbin Mask       Hands: Thieving Gloves       ││
│ │ Feet: Sneak-Ers         Cape: Thiever's Cape         ││
│ │ Consumable: Bobby's Pocket                           ││
│ ├───────────────────────┬──────────────────────────────┐│
│ │ POTION                │ PRAYERS                      ││
│ │ Gentle Hands IV       │ None                         ││
│ ├───────────────────────┼──────────────────────────────┤│
│ │ SYNERGY               │ AGILITY                      ││
│ │ Lep + Monkey: ...     │ 10 obstacles, 1 pillar       ││
│ ├───────────────────────┴──────────────────────────────┤│
│ │ CHARACTER                                            ││
│ │ Level 99 · Abyssal 45 · Pool 96.5% · Abyssal 42.3%  ││
│ ├──────────────────────────────────────────────────────┤│
│ │ OTHER SOURCES                                        ││
│ │ 3 astrology · 4 pets · 2 purchases                   ││
│ └──────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────┤
│  NPC    │ Area    │ Lvl │ XP/hr  │ GP/hr │ Succ │ Dbl  │
│  ...    │ ...     │ ... │ ...    │ ...   │ ...  │ ...  │
├──────────────────────────────────────────────────────────┤
│                                             39 NPCs     │
└──────────────────────────────────────────────────────────┘
```

### Section detail levels

| Section       | Content                                  | Rationale                                                       |
| ------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Equipment     | Slot name → item name per occupied slot  | Primary thing users override; exact items must be visible       |
| Potion        | Item name or "None"                      | Single value                                                    |
| Prayers       | Comma-joined names or "None"             | Typically 0–2 active                                            |
| Synergy       | Description text or "None"               | Description is more useful than familiar IDs                    |
| Agility       | "N obstacles, M pillars" or "No course"  | Can be 30+ entries; count confirms import without flooding      |
| Character     | Skill level, abyssal level, both pool %s | Fixed stats, always relevant                                    |
| Other Sources | "N astrology · N pets · N purchases"     | Confirms capture; details aren't actionable until editing phase |

### Slot display names

Map `ThievingEquipmentSlotId` → readable names:

| Slot ID         | Display      |
| --------------- | ------------ |
| Helmet          | Head         |
| Platebody       | Body         |
| Platelegs       | Legs         |
| Boots           | Feet         |
| Weapon          | Weapon       |
| Shield          | Off-hand     |
| Amulet          | Neck         |
| Ring            | Ring         |
| Gloves          | Hands        |
| Quiver          | Ammo         |
| Cape            | Cape         |
| Passive         | Passive      |
| Summon1 / 2     | Summon 1 / 2 |
| Consumable      | Consumable   |
| Gem             | Gem          |
| Enhancement 1–3 | Enhance 1–3  |

Unknown slots fall back to the ID suffix after `:`.

---

## Types

All new types live in `MainModal.ts` — they are UI display concerns, not calc engine types.

```typescript
interface EquipmentDisplayEntry {
  slotName: string; // human-readable slot label
  itemName: string; // game item name
}

interface ConfigDisplay {
  equipment: EquipmentDisplayEntry[];
  potion: string; // item name or "None"
  prayerSummary: string; // comma-joined names or "None"
  agilitySummary: string; // "N obstacles, M pillars" or "No course loaded"
  synergy: string; // description or "None"
  astrologyCount: number;
  petCount: number;
  shopPurchaseCount: number;
  skillLevel: number;
  abyssalSkillLevel: number;
  melvorPool: string; // pre-formatted "96.5%"
  abyssalPool: string; // pre-formatted "42.3%"
}

interface ImportResult {
  loadout: ThievingLoadout;
  masteryLevels: Map<string, number>;
}
```

---

## Implementation: File Changes

### `src/templates/MainModal.ts`

- **`MainModalInputProps`**: drop `loadout` + `masteryLevels`, add `onImport: () => ImportResult`
- **`MainModalScope`**: add `hasImported: boolean`, `configDisplay: ConfigDisplay | null`; initial `allRows` / `filteredRows` are empty arrays
- **Add** exported types: `EquipmentDisplayEntry`, `ConfigDisplay`, `ImportResult`
- **Add** `SLOT_DISPLAY_NAMES` record + `getSlotDisplayName()` helper
- **Add** `buildConfigDisplay(loadout: ThievingLoadout): ConfigDisplay` — exported, pure, testable
- **Add** `importLoadout()` scope method:
  1. Calls `props.onImport()`
  2. Stores `loadout` and `masteryLevels` in closure variables (not reactive scope)
  3. Sets `this.configDisplay = buildConfigDisplay(loadout)`
  4. Sets `this.allRows = buildRows(props.targets, loadout, masteryLevels)`
  5. Sets `this.hasImported = true`
  6. Calls `this.recomputeFilteredRows()`
- **Unchanged**: `buildRows`, `sortRows`, `recomputeFilteredRows`, sort/filter logic

### `src/templates/MainModal.template.html`

- Insert `div.ts-config` above `ts-table-wrap` inside `ts-modal-body`
  - `v-if="!hasImported"` → empty-state div with prompt + import button
  - `v-else` → loaded-state div with heading bar + config grid sections
- Wrap `div.ts-table-wrap` with `v-if="hasImported"`
- Wrap `div.ts-footer` with `v-if="hasImported"`
- Wrap realm tabs (`div.ts-realm-tabs`) with `v-if="hasImported"`

### `src/setup.ts`

- Remove eagerly called `readLoadout(game)` and `readAllMasteryLevels(game.thieving)`
- Pass `onImport` callback:
  ```typescript
  MainModal({
    targets,
    areas,
    onImport: () => ({
      loadout: readLoadout(game),
      masteryLevels: readAllMasteryLevels(game.thieving),
    }),
  });
  ```

### `assets/style.css`

New classes following existing naming + dark color palette:

- `.ts-config` — section container, bottom border
- `.ts-config-empty` — centered flex column for empty state
- `.ts-btn`, `.ts-btn--primary`, `.ts-btn--secondary` — button styles; primary uses the existing green (`#0b6623`)
- `.ts-config-bar` — flex row for "Loadout" heading + Re-import button
- `.ts-config-grid` — 2-column CSS grid
- `.ts-config-section`, `.ts-config-section--wide` — grid items; wide spans both columns
- `.ts-config-label` — small uppercase heading (matches `ts-th` color/style)
- `.ts-config-value`, `.ts-config-none` — normal text / dimmed italic for "None"
- `.ts-equip-grid` — responsive sub-grid for equipment entries (`auto-fill, minmax(200px, 1fr)`)
- `.ts-equip-entry`, `.ts-equip-slot`, `.ts-equip-item` — slot:item pairs
- `.ts-config-stats` — flex-wrap row for stat/count pairs

### `src/templates/MainModal.spec.ts`

Existing `buildRows` tests unchanged (function signature unchanged).

New `buildConfigDisplay` test suite:

- Maps equipment slot IDs to display names
- Falls back to ID suffix for unknown slots
- Shows "None" for absent potion / prayers / synergy
- Shows item names when present
- Joins multiple prayer names with commas
- Pluralizes agility counts correctly ("1 obstacle" vs "2 obstacles")
- Shows "No course loaded" when agility is empty
- Formats mastery pool percentages via `formatPercent`
- Counts astrology, pets, shop purchases

### `specs/tasks.md`

- Task 4.2 status: Ready → Partial
- Check the "Import from character" button sub-item

---

## Future: Equipment Set Support

The `onImport` callback is the natural extension point. When equipment sets are added:

1. `ImportResult` gains an optional `equipmentSetIndex` or the callback accepts a parameter
2. The state reader offers `readLoadout(game, setIndex?)` to read from a specific set
3. The config panel header shows which set is active, with a selector

No structural changes to the config display or component scope are needed — the loadout shape is the same regardless of which set it came from.

---

## Verification

- `pnpm test` — existing `buildRows` tests pass, new `buildConfigDisplay` tests pass
- Runtime: user loads mod in game, opens modal, sees empty state, clicks Import, sees config panel populate and table appear
