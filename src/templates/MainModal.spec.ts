import { MELVOR_TARGETS } from '../__fixtures__/targets';
import type {
  LoadoutOverrides,
  Potion,
  SummoningSynergyInfo,
  ThievingLoadout,
} from '../calc/types';
import { ThievingEquipmentSlotId } from '../constants/item-ids';
import {
  buildAgilitySlots,
  buildConfigDisplay,
  buildEquipmentSlots,
  buildPotionOptions,
  buildRows,
  buildSynergyOptions,
  getSlotDisplayName,
  SLOT_GRID_POSITIONS,
} from './MainModal';

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
  describe('buildRows', () => {
    const targets = MELVOR_TARGETS.slice(0, 3);
    const loadout = makeLoadout({ skillLevel: 99 });
    const masteryLevels = new Map<string, number>([
      ['melvorF:Man', 50],
      ['melvorF:Woman', 10],
      ['melvorF:Golbin', 1],
    ]);

    it('should produce one row per target', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      expect(rows).toHaveLength(3);
    });

    it('should use per-NPC mastery levels from the map', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      expect(rows[0].masteryLevel).toBe(50);
      expect(rows[1].masteryLevel).toBe(10);
      expect(rows[2].masteryLevel).toBe(1);
    });

    it('should default to mastery 1 when NPC is not in the map', () => {
      const rows = buildRows(targets, loadout, new Map());
      expect(rows[0].masteryLevel).toBe(1);
    });

    it('should compute positive XP/hr for all targets', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      for (const row of rows) {
        expect(row.result.xpPerHour).toBeGreaterThan(0);
      }
    });

    it('should format XP/hr as a string', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      for (const row of rows) {
        expect(row.formattedXpHr).toMatch(/^\d|K|M/);
      }
    });

    it('should format success rate as a percentage', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      for (const row of rows) {
        expect(row.formattedSuccess).toMatch(/%$/);
      }
    });

    it('should yield higher success rate for NPC with more mastery', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      const manRow = rows.find((r) => r.target.name === 'Man')!;
      const golbinRow = rows.find((r) => r.target.name === 'Golbin')!;
      expect(manRow.result.successRate).toBeGreaterThan(golbinRow.result.successRate);
    });

    it('should set currency label based on target currency type', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      for (const row of rows) {
        expect(row.currencyLabel).toBe('GP');
      }
    });
  });

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

  describe('buildConfigDisplay', () => {
    it('should map equipment entries to display entries with slot names', () => {
      const loadout = makeLoadout({
        equipment: [
          { slotId: ThievingEquipmentSlotId.GLOVES, itemId: 'melvorF:Gloves1', itemName: 'Thieving Gloves', modifiers: [] },
          { slotId: ThievingEquipmentSlotId.CAPE, itemId: 'melvorF:Cape1', itemName: "Thiever's Cape", modifiers: [] },
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
          { slotId: 'melvorD:CustomSlot', itemId: 'item1', itemName: 'Custom Item', modifiers: [] },
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
      const display = buildConfigDisplay(makeLoadout({ activePrayers: undefined }));
      expect(display.prayerSummary).toBe('None');
    });

    it('should show "None" when prayers set is empty', () => {
      const display = buildConfigDisplay(makeLoadout({ activePrayers: new Set() }));
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
      expect(display.synergy).toBe('Auto-sells common drops for 15x base price');
    });

    it('should format mastery pool percentages', () => {
      const loadout = makeLoadout({
        melvorMasteryPoolPercent: 96.5,
        abyssalMasteryPoolPercent: 42.3,
      });
      const display = buildConfigDisplay(loadout);
      expect(display.melvorPool).toBe('96.5%');
      expect(display.abyssalPool).toBe('42.3%');
    });

    it('should format zero mastery pool percentages', () => {
      const display = buildConfigDisplay(makeLoadout());
      expect(display.melvorPool).toBe('0.0%');
      expect(display.abyssalPool).toBe('0.0%');
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
      { summon1Id: 's1', summon2Id: 's2', name: 'Leprechaun + Monkey', description: 'Auto-sell', modifiers: [] },
      { summon1Id: 's3', summon2Id: 's4', name: 'Leprechaun + Devil', description: 'Gamble', modifiers: [] },
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
      expect(result[0]).toMatchObject({ slot: 0, name: 'Rocky Road', type: 'obstacle', isCleared: false });
      expect(result[1]).toMatchObject({ slot: 1, name: 'Muddy Path', type: 'obstacle', isCleared: false });
      expect(result[2]).toMatchObject({ slot: 0, name: 'Stone Pillar', type: 'pillar', isCleared: false });
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
  });
});
