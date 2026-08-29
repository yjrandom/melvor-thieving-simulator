import type {
  EquipmentOption,
  LoadoutOverrides,
  ThievingLoadout,
} from '../../../calc/types';
import { ThievingEquipmentSlotId } from '../../../constants/item-ids';

export interface EquipmentSlotDisplay {
  slotId: string;
  slotName: string;
  itemName: string;
  hasItem: boolean;
  isOverridden: boolean;
  /** True when the slot has no selectable equipment options. */
  disabled: boolean;
  mediaUrl?: string;
  gridRow: number;
  gridCol: number;
}

const SLOT_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  [ThievingEquipmentSlotId.HELMET]: 'Head',
  [ThievingEquipmentSlotId.PLATEBODY]: 'Body',
  [ThievingEquipmentSlotId.PLATELEGS]: 'Legs',
  [ThievingEquipmentSlotId.BOOTS]: 'Feet',
  [ThievingEquipmentSlotId.WEAPON]: 'Weapon',
  [ThievingEquipmentSlotId.SHIELD]: 'Off-hand',
  [ThievingEquipmentSlotId.AMULET]: 'Neck',
  [ThievingEquipmentSlotId.RING]: 'Ring',
  [ThievingEquipmentSlotId.GLOVES]: 'Hands',
  [ThievingEquipmentSlotId.QUIVER]: 'Ammo',
  [ThievingEquipmentSlotId.CAPE]: 'Cape',
  [ThievingEquipmentSlotId.PASSIVE]: 'Passive',
  [ThievingEquipmentSlotId.SUMMON1]: 'Summon 1',
  [ThievingEquipmentSlotId.SUMMON2]: 'Summon 2',
  [ThievingEquipmentSlotId.CONSUMABLE]: 'Consumable',
  [ThievingEquipmentSlotId.GEM]: 'Gem',
  [ThievingEquipmentSlotId.ENHANCEMENT1]: 'Enhance 1',
  [ThievingEquipmentSlotId.ENHANCEMENT2]: 'Enhance 2',
  [ThievingEquipmentSlotId.ENHANCEMENT3]: 'Enhance 3',
};

/** Paper-doll grid positions matching Melvor's equipment screen layout (3-column). */
export const SLOT_GRID_POSITIONS: Readonly<
  Record<string, { row: number; col: number }>
> = {
  [ThievingEquipmentSlotId.HELMET]: { row: 0, col: 1 },
  [ThievingEquipmentSlotId.CAPE]: { row: 1, col: 0 },
  [ThievingEquipmentSlotId.AMULET]: { row: 1, col: 1 },
  [ThievingEquipmentSlotId.QUIVER]: { row: 1, col: 2 },
  [ThievingEquipmentSlotId.WEAPON]: { row: 2, col: 0 },
  [ThievingEquipmentSlotId.PLATEBODY]: { row: 2, col: 1 },
  [ThievingEquipmentSlotId.SHIELD]: { row: 2, col: 2 },
  [ThievingEquipmentSlotId.PLATELEGS]: { row: 3, col: 1 },
  [ThievingEquipmentSlotId.GLOVES]: { row: 4, col: 0 },
  [ThievingEquipmentSlotId.BOOTS]: { row: 4, col: 1 },
  [ThievingEquipmentSlotId.RING]: { row: 4, col: 2 },
  [ThievingEquipmentSlotId.PASSIVE]: { row: 5, col: 0 },
  [ThievingEquipmentSlotId.SUMMON1]: { row: 6, col: 0 },
  [ThievingEquipmentSlotId.SUMMON2]: { row: 6, col: 1 },
  [ThievingEquipmentSlotId.CONSUMABLE]: { row: 7, col: 0 },
  [ThievingEquipmentSlotId.GEM]: { row: 7, col: 1 },
  [ThievingEquipmentSlotId.ENHANCEMENT1]: { row: 8, col: 0 },
  [ThievingEquipmentSlotId.ENHANCEMENT2]: { row: 8, col: 1 },
  [ThievingEquipmentSlotId.ENHANCEMENT3]: { row: 8, col: 2 },
};

/**
 * Maps an equipment slot ID to a human-readable display name.
 * Falls back to the suffix after ':' for unknown slot IDs.
 */
export function getSlotDisplayName(slotId: string): string {
  return SLOT_DISPLAY_NAMES[slotId] ?? slotId.split(':').pop()!;
}

/** Builds the display state for all equipment slots from the active loadout and overrides. */
export function buildEquipmentSlots(
  loadout: ThievingLoadout,
  overrides: LoadoutOverrides,
  availableOptions: Record<string, EquipmentOption[]> = {},
): EquipmentSlotDisplay[] {
  const equippedBySlot = new Map(loadout.equipment.map((e) => [e.slotId, e]));
  const overriddenSlots = new Set(
    overrides.equipment ? Object.keys(overrides.equipment) : [],
  );

  return Object.values(ThievingEquipmentSlotId).map((slotId) => {
    const equipped = equippedBySlot.get(slotId);
    const pos = SLOT_GRID_POSITIONS[slotId] ?? { row: 0, col: 0 };
    const options = availableOptions[slotId];
    return {
      slotId,
      slotName: getSlotDisplayName(slotId),
      itemName: equipped?.itemName ?? 'Empty',
      hasItem: equipped !== undefined,
      isOverridden: overriddenSlots.has(slotId),
      disabled: !options || options.length === 0,
      ...(equipped?.mediaUrl !== undefined && { mediaUrl: equipped.mediaUrl }),
      gridRow: pos.row,
      gridCol: pos.col,
    };
  });
}
