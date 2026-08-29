import type { EquipmentOption, LoadoutOverrides, ThievingLoadout } from '../../../calc/types';
import { ThievingEquipmentSlotId } from '../../../constants/item-ids';
import {
  buildEquipmentSlots,
  getSlotDisplayName,
  SLOT_GRID_POSITIONS,
} from './equipment-tab.template';

function makeLoadout(
  overrides: Partial<ThievingLoadout> = {},
): ThievingLoadout {
  return {
    equipment: [],
    masteryLevel: 0,
    melvorMasteryPoolPercent: 0,
    abyssalMasteryPoolPercent: 0,
    activePotion: undefined,
    activePrayers: undefined,
    agilityObstacles: [],
    agilityPillars: [],
    astrologyConstellations: [],
    activePets: [],
    shopPurchases: [],
    activeSummoningSynergy: undefined,
    skillLevel: 1,
    abyssalSkillLevel: 1,
    ...overrides,
  };
}

describe('EquipmentTabTemplate', () => {
  describe('getSlotDisplayName', () => {
    it.each([
      [ThievingEquipmentSlotId.HELMET, 'Head'],
      [ThievingEquipmentSlotId.PLATEBODY, 'Body'],
      [ThievingEquipmentSlotId.PLATELEGS, 'Legs'],
      [ThievingEquipmentSlotId.BOOTS, 'Feet'],
      [ThievingEquipmentSlotId.WEAPON, 'Weapon'],
      [ThievingEquipmentSlotId.SHIELD, 'Off-hand'],
      [ThievingEquipmentSlotId.AMULET, 'Neck'],
      [ThievingEquipmentSlotId.RING, 'Ring'],
      [ThievingEquipmentSlotId.GLOVES, 'Hands'],
      [ThievingEquipmentSlotId.QUIVER, 'Ammo'],
      [ThievingEquipmentSlotId.CAPE, 'Cape'],
      [ThievingEquipmentSlotId.PASSIVE, 'Passive'],
      [ThievingEquipmentSlotId.SUMMON1, 'Summon 1'],
      [ThievingEquipmentSlotId.SUMMON2, 'Summon 2'],
      [ThievingEquipmentSlotId.CONSUMABLE, 'Consumable'],
      [ThievingEquipmentSlotId.GEM, 'Gem'],
      [ThievingEquipmentSlotId.ENHANCEMENT1, 'Enhance 1'],
      [ThievingEquipmentSlotId.ENHANCEMENT2, 'Enhance 2'],
      [ThievingEquipmentSlotId.ENHANCEMENT3, 'Enhance 3'],
    ])('should map %s to %s', (slotId, expected) => {
      expect(getSlotDisplayName(slotId)).toBe(expected);
    });

    it('should fall back to ID suffix for unknown slots', () => {
      expect(getSlotDisplayName('melvorD:UnknownSlot')).toBe('UnknownSlot');
    });

    it('should handle IDs without a colon', () => {
      expect(getSlotDisplayName('BareSlot')).toBe('BareSlot');
    });
  });

  describe('buildEquipmentSlots', () => {
    it('should produce one entry per ThievingEquipmentSlotId', () => {
      const loadout = makeLoadout();
      const slots = buildEquipmentSlots(loadout, {});
      expect(slots).toHaveLength(Object.keys(ThievingEquipmentSlotId).length);
    });

    it('should show "Empty" for unequipped slots', () => {
      const loadout = makeLoadout();
      const slots = buildEquipmentSlots(loadout, {});
      for (const slot of slots) {
        expect(slot.itemName).toBe('Empty');
        expect(slot.hasItem).toBe(false);
      }
    });

    it('should show equipped item name and hasItem=true', () => {
      const loadout = makeLoadout({
        equipment: [
          {
            slotId: ThievingEquipmentSlotId.GLOVES,
            itemId: 'melvorF:Gloves1',
            itemName: 'Thieving Gloves',
            modifiers: [],
          },
        ],
      });
      const slots = buildEquipmentSlots(loadout, {});
      const glovesSlot = slots.find(
        (s) => s.slotId === ThievingEquipmentSlotId.GLOVES,
      )!;
      expect(glovesSlot.itemName).toBe('Thieving Gloves');
      expect(glovesSlot.hasItem).toBe(true);
    });

    it('should mark overridden slots', () => {
      const loadout = makeLoadout({
        equipment: [
          {
            slotId: ThievingEquipmentSlotId.CAPE,
            itemId: 'melvorF:Cape1',
            itemName: "Thiever's Cape",
            modifiers: [],
          },
        ],
      });
      const overrides: LoadoutOverrides = {
        equipment: {
          [ThievingEquipmentSlotId.CAPE]: {
            slotId: ThievingEquipmentSlotId.CAPE,
            itemId: 'melvorF:Cape2',
            itemName: 'Chapeau Noir',
            modifiers: [],
          },
        },
      };
      const slots = buildEquipmentSlots(loadout, overrides);
      const capeSlot = slots.find(
        (s) => s.slotId === ThievingEquipmentSlotId.CAPE,
      )!;
      expect(capeSlot.isOverridden).toBe(true);
    });

    it('should not mark non-overridden slots', () => {
      const loadout = makeLoadout({
        equipment: [
          {
            slotId: ThievingEquipmentSlotId.GLOVES,
            itemId: 'melvorF:Gloves1',
            itemName: 'Thieving Gloves',
            modifiers: [],
          },
        ],
      });
      const slots = buildEquipmentSlots(loadout, {});
      const glovesSlot = slots.find(
        (s) => s.slotId === ThievingEquipmentSlotId.GLOVES,
      )!;
      expect(glovesSlot.isOverridden).toBe(false);
    });

    it('should assign grid positions from SLOT_GRID_POSITIONS', () => {
      const loadout = makeLoadout();
      const slots = buildEquipmentSlots(loadout, {});
      const helmetSlot = slots.find(
        (s) => s.slotId === ThievingEquipmentSlotId.HELMET,
      )!;
      const pos = SLOT_GRID_POSITIONS[ThievingEquipmentSlotId.HELMET];
      expect(helmetSlot.gridRow).toBe(pos.row);
      expect(helmetSlot.gridCol).toBe(pos.col);
    });

    it('should have display names for all slots', () => {
      const loadout = makeLoadout();
      const slots = buildEquipmentSlots(loadout, {});
      for (const slot of slots) {
        expect(slot.slotName).not.toBe('');
        expect(slot.slotName).not.toContain(':');
      }
    });

    describe('disabled flag', () => {
      const gloveOption: EquipmentOption = {
        itemId: 'melvorF:Gloves1',
        itemName: 'Thieving Gloves',
        modifiers: [],
      };

      it('should mark slot as enabled when it has available options', () => {
        const loadout = makeLoadout();
        const options: Record<string, EquipmentOption[]> = {
          [ThievingEquipmentSlotId.GLOVES]: [gloveOption],
        };
        const slots = buildEquipmentSlots(loadout, {}, options);
        const glovesSlot = slots.find(
          (s) => s.slotId === ThievingEquipmentSlotId.GLOVES,
        )!;
        expect(glovesSlot.disabled).toBe(false);
      });

      it('should mark slot as disabled when missing from options map', () => {
        const loadout = makeLoadout();
        const slots = buildEquipmentSlots(loadout, {}, {});
        const helmetSlot = slots.find(
          (s) => s.slotId === ThievingEquipmentSlotId.HELMET,
        )!;
        expect(helmetSlot.disabled).toBe(true);
      });

      it('should mark slot as disabled when present but empty array', () => {
        const loadout = makeLoadout();
        const options: Record<string, EquipmentOption[]> = {
          [ThievingEquipmentSlotId.HELMET]: [],
        };
        const slots = buildEquipmentSlots(loadout, {}, options);
        const helmetSlot = slots.find(
          (s) => s.slotId === ThievingEquipmentSlotId.HELMET,
        )!;
        expect(helmetSlot.disabled).toBe(true);
      });

      it('should mark all slots as disabled when no options provided', () => {
        const loadout = makeLoadout();
        const slots = buildEquipmentSlots(loadout, {});
        for (const slot of slots) {
          expect(slot.disabled).toBe(true);
        }
      });
    });
  });
});
