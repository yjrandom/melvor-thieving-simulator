import type {
  AgilityObstacle,
  AgilityPillar,
  EquippedItemEntry,
  LoadoutOverrides,
  ThievingLoadout,
} from '../calc/types';

/**
 * Merges user overrides onto an imported loadout, producing a new loadout for simulation.
 *
 * Absent override fields preserve the imported values. Explicit `null` clears
 * the field to its empty state. Per-slot fields (equipment, agility) are merged
 * at the slot level — only mentioned slots are affected.
 *
 * @param {ThievingLoadout} imported Base loadout imported from the game.
 * @param {LoadoutOverrides} overrides User-specified hypothetical changes.
 * @returns {ThievingLoadout} Merged loadout ready for boost aggregation.
 */
export function applyOverrides(
  imported: ThievingLoadout,
  overrides: LoadoutOverrides,
): ThievingLoadout {
  return {
    equipment: overrides.equipment !== undefined
      ? mergeEquipment(imported.equipment, overrides.equipment)
      : imported.equipment,

    masteryLevel: overrides.masteryLevel ?? imported.masteryLevel,

    melvorMasteryPoolPercent: imported.melvorMasteryPoolPercent,
    abyssalMasteryPoolPercent: imported.abyssalMasteryPoolPercent,

    activePotion: overrides.activePotion !== undefined
      ? (overrides.activePotion ?? undefined)
      : imported.activePotion,

    activePrayers: overrides.activePrayers !== undefined
      ? (overrides.activePrayers ?? undefined)
      : imported.activePrayers,

    agilityObstacles: overrides.agilityObstacles !== undefined
      ? mergeSlottedArray(imported.agilityObstacles, overrides.agilityObstacles)
      : imported.agilityObstacles,

    agilityPillars: overrides.agilityPillars !== undefined
      ? mergeSlottedArray(imported.agilityPillars, overrides.agilityPillars)
      : imported.agilityPillars,

    astrologyConstellations: imported.astrologyConstellations,
    activePets: imported.activePets,
    shopPurchases: imported.shopPurchases,

    activeSummoningSynergy: overrides.activeSummoningSynergy !== undefined
      ? (overrides.activeSummoningSynergy ?? undefined)
      : imported.activeSummoningSynergy,

    skillLevel: overrides.skillLevel ?? imported.skillLevel,
    abyssalSkillLevel: overrides.abyssalSkillLevel ?? imported.abyssalSkillLevel,
  };
}

/**
 * Merges per-slot equipment overrides into the imported equipment array.
 *
 * For each slot in the overrides: `null` removes the item from that slot,
 * a value replaces the item. Slots not mentioned in overrides are preserved.
 */
function mergeEquipment(
  imported: EquippedItemEntry[],
  overrides: Partial<Record<string, EquippedItemEntry | null>> | null,
): EquippedItemEntry[] {
  const bySlot = new Map(imported.map((e) => [e.slotId, e]));

  if (overrides === null) {
    return []
  }

  for (const [slotId, entry] of Object.entries(overrides)) {
    if (entry === null) {
      bySlot.delete(slotId);
    } else if (entry !== undefined) {
      bySlot.set(slotId, entry);
    }
  }

  return [...bySlot.values()];
}

/**
 * Merges per-slot overrides into an array of slotted items (obstacles or pillars).
 *
 * Items have a `slot` property used as the key. `null` removes the item at that slot;
 * a value replaces it. Slots not mentioned in overrides are preserved.
 */
function mergeSlottedArray<T extends { slot: number }>(
  imported: T[],
  overrides: Partial<Record<number, T | null>>,
): T[] {
  const bySlot = new Map(imported.map((item) => [item.slot, item]));

  for (const [slotStr, item] of Object.entries(overrides)) {
    const slot = Number(slotStr);
    if (item === null) {
      bySlot.delete(slot);
    } else if (item !== undefined) {
      bySlot.set(slot, item);
    }
  }

  return [...bySlot.values()];
}
