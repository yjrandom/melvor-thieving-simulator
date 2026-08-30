import type { ThievingLoadout } from '../../../calc/types';
import { ThievingEquipmentSlotId } from '../../../constants/item-ids';
import { buildConfigDisplay } from './config-tab.template';

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

describe('ConfigTabTemplate', () => {
  describe('buildConfigDisplay', () => {
    it('should map equipment entries to display entries with slot names', () => {
      const loadout = makeLoadout({
        equipment: [
          {
            slotId: ThievingEquipmentSlotId.GLOVES,
            itemId: 'melvorF:Gloves1',
            itemName: 'Thieving Gloves',
            modifiers: [],
          },
          {
            slotId: ThievingEquipmentSlotId.CAPE,
            itemId: 'melvorF:Cape1',
            itemName: "Thiever's Cape",
            modifiers: [],
          },
        ],
      });
      const display = buildConfigDisplay(loadout);
      expect(display.equipment).toEqual([
        { slotName: 'Hands', itemName: 'Thieving Gloves' },
        { slotName: 'Cape', itemName: "Thiever's Cape" },
      ]);
    });

    it('should fall back to ID suffix for unknown equipment slot IDs', () => {
      const loadout = makeLoadout({
        equipment: [
          {
            slotId: 'melvorD:CustomSlot',
            itemId: 'item1',
            itemName: 'Custom Item',
            modifiers: [],
          },
        ],
      });
      const display = buildConfigDisplay(loadout);
      expect(display.equipment[0].slotName).toBe('CustomSlot');
    });

    it('should return empty equipment array when no items are equipped', () => {
      const display = buildConfigDisplay(makeLoadout());
      expect(display.equipment).toEqual([]);
    });

    it('should show "None" when no potion is active', () => {
      const display = buildConfigDisplay(makeLoadout());
      expect(display.potion).toBe('None');
    });

    it('should show potion item name when present', () => {
      const loadout = makeLoadout({
        activePotion: {
          itemId: 'melvorF:Potion1',
          itemName: 'Gentle Hands IV',
          tier: 3,
          modifiers: [],
        },
      });
      const display = buildConfigDisplay(loadout);
      expect(display.potion).toBe('Gentle Hands IV');
    });

    it('should show "None" when no prayers are active (undefined)', () => {
      const display = buildConfigDisplay(
        makeLoadout({ activePrayers: undefined }),
      );
      expect(display.prayerSummary).toBe('None');
    });

    it('should show "None" when prayers set is empty', () => {
      const display = buildConfigDisplay(
        makeLoadout({ activePrayers: new Set() }),
      );
      expect(display.prayerSummary).toBe('None');
    });

    it('should show single prayer name', () => {
      const loadout = makeLoadout({
        activePrayers: new Set([{ id: 'prayer1', name: 'Safeguard' }]),
      });
      const display = buildConfigDisplay(loadout);
      expect(display.prayerSummary).toBe('Safeguard');
    });

    it('should join multiple prayer names with commas', () => {
      const loadout = makeLoadout({
        activePrayers: new Set([
          { id: 'prayer1', name: 'Safeguard' },
          { id: 'prayer2', name: 'Stone Skin' },
        ]),
      });
      const display = buildConfigDisplay(loadout);
      expect(display.prayerSummary).toBe('Safeguard, Stone Skin');
    });

    it('should show "No course loaded" when agility is empty', () => {
      const display = buildConfigDisplay(makeLoadout());
      expect(display.agilitySummary).toBe('No course loaded');
    });

    it.each([
      { obstacles: 1, pillars: 0, expected: '1 obstacle' },
      { obstacles: 2, pillars: 0, expected: '2 obstacles' },
      { obstacles: 0, pillars: 1, expected: '1 pillar' },
      { obstacles: 0, pillars: 2, expected: '2 pillars' },
      { obstacles: 10, pillars: 1, expected: '10 obstacles, 1 pillar' },
      { obstacles: 5, pillars: 3, expected: '5 obstacles, 3 pillars' },
    ])(
      'should show "$expected" for $obstacles obstacle(s) and $pillars pillar(s)',
      ({ obstacles, pillars, expected }) => {
        const loadout = makeLoadout({
          agilityObstacles: Array.from({ length: obstacles }, (_, i) => ({
            id: `obs${i}`,
            name: `Obstacle ${i}`,
            slot: i,
            modifiers: [],
          })),
          agilityPillars: Array.from({ length: pillars }, (_, i) => ({
            id: `pil${i}`,
            name: `Pillar ${i}`,
            slot: i,
            modifiers: [],
          })),
        });
        const display = buildConfigDisplay(loadout);
        expect(display.agilitySummary).toBe(expected);
      },
    );

    it('should show "None" when no synergy is active', () => {
      const display = buildConfigDisplay(makeLoadout());
      expect(display.synergy).toBe('None');
    });

    it('should show synergy description when present', () => {
      const loadout = makeLoadout({
        activeSummoningSynergy: {
          summon1Id: 'melvorD:Leprechaun',
          summon2Id: 'melvorD:Monkey',
          name: 'Leprechaun + Monkey',
          description: 'Auto-sells common drops for 15x base price',
          modifiers: [],
        },
      });
      const display = buildConfigDisplay(loadout);
      expect(display.synergy).toBe(
        'Auto-sells common drops for 15x base price',
      );
    });

    it('should format mastery pool percentages', () => {
      const loadout = makeLoadout({
        melvorMasteryPoolPercent: 96.5,
        abyssalMasteryPoolPercent: 42.3,
      });
      const display = buildConfigDisplay(loadout);
      expect(display.melvorPool).toBe('96.50%');
      expect(display.abyssalPool).toBe('42.30%');
    });

    it('should format zero mastery pool percentages', () => {
      const display = buildConfigDisplay(makeLoadout());
      expect(display.melvorPool).toBe('0.00%');
      expect(display.abyssalPool).toBe('0.00%');
    });

    it('should pass through skill levels', () => {
      const loadout = makeLoadout({ skillLevel: 99, abyssalSkillLevel: 45 });
      const display = buildConfigDisplay(loadout);
      expect(display.skillLevel).toBe(99);
      expect(display.abyssalSkillLevel).toBe(45);
    });

    it('should count astrology constellations', () => {
      const loadout = makeLoadout({
        astrologyConstellations: [
          { constellationId: 'c1', constellationName: 'Ko', modifiers: [] },
          { constellationId: 'c2', constellationName: 'Ko2', modifiers: [] },
          { constellationId: 'c3', constellationName: 'Ko3', modifiers: [] },
        ],
      });
      const display = buildConfigDisplay(loadout);
      expect(display.astrologyCount).toBe(3);
    });

    it('should count pets', () => {
      const loadout = makeLoadout({
        activePets: [
          { id: 'pet1', name: 'Peri' },
          { id: 'pet2', name: 'Otto' },
          { id: 'pet3', name: 'Saki' },
          { id: 'pet4', name: 'Chick' },
        ],
      });
      const display = buildConfigDisplay(loadout);
      expect(display.petCount).toBe(4);
    });

    it('should count shop purchases', () => {
      const loadout = makeLoadout({
        shopPurchases: [
          { id: 'shop1', name: 'Auto Eat', count: 1 },
          { id: 'shop2', name: 'Thieving Shorts', count: 1 },
        ],
      });
      const display = buildConfigDisplay(loadout);
      expect(display.shopPurchaseCount).toBe(2);
    });
  });
});
