import type {
  EquipmentOption,
  LoadoutOverrides,
  Potion,
  SummoningSynergyInfo,
  ThievingLoadout,
} from '../calc/types';
import {
  buildAgilitySlots,
  buildPotionOptions,
  buildSynergyOptions,
  findEquipmentForFamiliar,
  findMatchingSynergy,
} from './main.template';

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

describe('MainModal', () => {
  describe('buildPotionOptions', () => {
    const potions: Potion[] = [
      { itemId: 'p1', itemName: 'Gentle Hands I', tier: 0, modifiers: [] },
      { itemId: 'p2', itemName: 'Gentle Hands II', tier: 1, modifiers: [] },
      { itemId: 'p3', itemName: 'Gentle Hands III', tier: 2, modifiers: [] },
    ];

    it('should mark the active potion as selected', () => {
      const result = buildPotionOptions(potions, potions[1]);
      expect(result[0].isSelected).toBe(false);
      expect(result[1].isSelected).toBe(true);
      expect(result[2].isSelected).toBe(false);
    });

    it('should mark none as selected when no potion is active', () => {
      const result = buildPotionOptions(potions, undefined);
      expect(result.every((p) => !p.isSelected)).toBe(true);
    });

    it('should preserve potion data in display entries', () => {
      const result = buildPotionOptions(potions, undefined);
      expect(result[0]).toMatchObject({
        itemId: 'p1',
        itemName: 'Gentle Hands I',
        tier: 0,
      });
    });
  });

  describe('buildSynergyOptions', () => {
    const synergies: SummoningSynergyInfo[] = [
      {
        summon1Id: 's1',
        summon2Id: 's2',
        name: 'Leprechaun + Monkey',
        description: 'Auto-sell',
        modifiers: [],
      },
      {
        summon1Id: 's3',
        summon2Id: 's4',
        name: 'Leprechaun + Devil',
        description: 'Gamble',
        modifiers: [],
      },
    ];

    it('should mark the active synergy as selected', () => {
      const result = buildSynergyOptions(synergies, synergies[0]);
      expect(result[0].isSelected).toBe(true);
      expect(result[1].isSelected).toBe(false);
    });

    it('should mark none as selected when no synergy is active', () => {
      const result = buildSynergyOptions(synergies, undefined);
      expect(result.every((s) => !s.isSelected)).toBe(true);
    });

    it('should include index, name, and description', () => {
      const result = buildSynergyOptions(synergies, undefined);
      expect(result[0]).toMatchObject({
        index: 0,
        name: 'Leprechaun + Monkey',
        description: 'Auto-sell',
      });
      expect(result[1].index).toBe(1);
    });
  });

  describe('buildAgilitySlots', () => {
    it('should list obstacles and pillars from the imported loadout', () => {
      const loadout = makeLoadout({
        agilityObstacles: [
          { id: 'obs1', name: 'Rocky Road', slot: 0, modifiers: [] },
          { id: 'obs2', name: 'Muddy Path', slot: 1, modifiers: [] },
        ],
        agilityPillars: [
          { id: 'pil1', name: 'Stone Pillar', slot: 0, modifiers: [] },
        ],
      });
      const result = buildAgilitySlots(loadout, {});
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        slot: 0,
        name: 'Rocky Road',
        type: 'obstacle',
        isCleared: false,
      });
      expect(result[1]).toMatchObject({
        slot: 1,
        name: 'Muddy Path',
        type: 'obstacle',
        isCleared: false,
      });
      expect(result[2]).toMatchObject({
        slot: 0,
        name: 'Stone Pillar',
        type: 'pillar',
        isCleared: false,
      });
    });

    it('should mark cleared obstacle slots', () => {
      const loadout = makeLoadout({
        agilityObstacles: [
          { id: 'obs1', name: 'Rocky Road', slot: 0, modifiers: [] },
          { id: 'obs2', name: 'Muddy Path', slot: 1, modifiers: [] },
        ],
      });
      const overrides: LoadoutOverrides = {
        agilityObstacles: { 0: null },
      };
      const result = buildAgilitySlots(loadout, overrides);
      expect(result[0].isCleared).toBe(true);
      expect(result[1].isCleared).toBe(false);
    });

    it('should mark cleared pillar slots', () => {
      const loadout = makeLoadout({
        agilityPillars: [
          { id: 'pil1', name: 'Stone Pillar', slot: 0, modifiers: [] },
        ],
      });
      const overrides: LoadoutOverrides = {
        agilityPillars: { 0: null },
      };
      const result = buildAgilitySlots(loadout, overrides);
      expect(result[0].isCleared).toBe(true);
    });

    it('should return empty when no course is loaded', () => {
      const result = buildAgilitySlots(makeLoadout(), {});
      expect(result).toEqual([]);
    });
  });

  describe('findMatchingSynergy', () => {
    const synergies: SummoningSynergyInfo[] = [
      {
        summon1Id: 'melvorD:Leprechaun',
        summon2Id: 'melvorD:Monkey',
        name: 'Leprechaun + Monkey',
        description: 'Auto-sell',
        modifiers: [],
      },
      {
        summon1Id: 'melvorD:Leprechaun',
        summon2Id: 'melvorD:Devil',
        name: 'Leprechaun + Devil',
        description: 'Gamble',
        modifiers: [],
      },
    ];

    it('should find a matching synergy pair', () => {
      const result = findMatchingSynergy('melvorD:Leprechaun', 'melvorD:Monkey', synergies);
      expect(result).toBe(synergies[0]);
    });

    it('should find a match with reversed order', () => {
      const result = findMatchingSynergy('melvorD:Monkey', 'melvorD:Leprechaun', synergies);
      expect(result).toBe(synergies[0]);
    });

    it('should return undefined when no match exists', () => {
      const result = findMatchingSynergy('melvorD:Monkey', 'melvorD:Devil', synergies);
      expect(result).toBeUndefined();
    });

    it('should return undefined with only one summon ID', () => {
      const result = findMatchingSynergy('melvorD:Leprechaun', undefined, synergies);
      expect(result).toBeUndefined();
    });

    it('should return undefined when both IDs are undefined', () => {
      const result = findMatchingSynergy(undefined, undefined, synergies);
      expect(result).toBeUndefined();
    });
  });

  describe('findEquipmentForFamiliar', () => {
    const options: Record<string, EquipmentOption[]> = {
      'melvorD:Summon1': [
        { itemId: 'melvorD:Leprechaun', itemName: 'Leprechaun', modifiers: [] },
        { itemId: 'melvorD:Monkey', itemName: 'Monkey', modifiers: [] },
      ],
    };

    it('should find the equipment option by familiar ID', () => {
      const result = findEquipmentForFamiliar('melvorD:Summon1', 'melvorD:Leprechaun', options);
      expect(result).toEqual(options['melvorD:Summon1'][0]);
    });

    it('should return undefined when familiar is not in the slot', () => {
      const result = findEquipmentForFamiliar('melvorD:Summon1', 'melvorD:Devil', options);
      expect(result).toBeUndefined();
    });

    it('should return undefined when slot has no options', () => {
      const result = findEquipmentForFamiliar('melvorD:Summon2', 'melvorD:Leprechaun', options);
      expect(result).toBeUndefined();
    });
  });
});
