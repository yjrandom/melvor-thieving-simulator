# Phase 3 — Loadout Editing (Hypothetical Overrides)

Without this, the mod is a read-only stats viewer — not a simulator. Deferred from Phase 1 to ship a working read-only version first.

## 3.1 Define loadout override type

**Status:** Done
**Why:** Need a type representing user overrides on top of imported state. Must support partial overrides (change one piece of equipment, leave the rest imported).

- [x] Define `LoadoutOverrides` type — partial overlay on `ThievingLoadout`
- [x] Implement merge function: `applyOverrides(imported: ThievingLoadout, overrides: LoadoutOverrides): ThievingLoadout`

**Notes:**

- `LoadoutOverrides` uses a three-state pattern: absent (undefined) = keep imported, present = replace, `null` = clear
- Per-slot fields (equipment keyed by slot ID, agility keyed by slot number) enable granular overrides without replacing entire arrays
- Non-overridable fields: mastery pool percentages, astrology, pets, shop purchases — these are fixed character state
- Implementation in `state/overrides.ts`, unit tests in `state/overrides.spec.ts`

## 3.2 Equipment override logic

**Status:** Done
**Why:** Players want to swap equipment slots and see how XP/hr changes. Need to know which equipment slots are thieving-relevant and their modifier effects.

- [x] Catalog thieving-relevant equipment slots and their modifier contributions
- [x] Implement equipment swap in override merge

**Notes:**

- Equipment overrides keyed by `ThievingEquipmentSlotId` string values (e.g., `melvorD:Gloves`)
- Merge logic: imported equipment indexed by `slotId` into a Map; overrides replace/delete/add entries; unmentioned slots preserved
- Thieving-relevant slots already catalogued in `ThievingEquipmentSlotId` enum (19 slots)

## 3.3 Potion / Prayer / Agility toggles

**Status:** Done
**Why:** Simpler overrides — on/off toggles or tier selection rather than full equipment management.

- [x] Potion override (select tier or none)
- [x] Prayer toggle override
- [x] Agility obstacle override
- [x] Summoning familiar/synergy override

**Notes:**

- Potion/prayer/synergy use the `null` = clear pattern for toggling off
- Agility obstacles and pillars use per-slot override via `Record<number, T | null>`, same pattern as equipment
