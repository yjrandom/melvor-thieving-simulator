import type {
  AgilityObstacle,
  AgilityPillar,
  EquippedItemEntry,
  LoadoutOverrides,
  Modifier,
  Potion,
  Prayer,
  SummoningSynergyInfo,
  ThievingLoadout,
} from '../calc/types';
import { ThievingBoostId } from '../constants/item-ids';
import { applyOverrides } from './overrides';

function makeLoadout(
  overrides: Partial<ThievingLoadout> = {},
): ThievingLoadout {
  return {
    equipment: [],
    masteryLevel: 50,
    melvorMasteryPoolPercent: 80,
    abyssalMasteryPoolPercent: 30,
    activePotion: undefined,
    activePrayers: undefined,
    agilityObstacles: [],
    agilityPillars: [],
    astrologyConstellations: [],
    activePets: [],
    shopPurchases: [],
    activeSummoningSynergy: undefined,
    skillLevel: 99,
    abyssalSkillLevel: 1,
    ...overrides,
  };
}

function makeEquipment(
  slotId: string,
  modifiers: Modifier[] = [],
): EquippedItemEntry {
  return {
    slotId,
    itemId: `test:${slotId}`,
    itemName: `Test ${slotId}`,
    modifiers,
  };
}

function makeObstacle(slot: number, name = `Obstacle ${slot}`): AgilityObstacle {
  return {
    id: `test:obstacle_${slot}`,
    name,
    slot,
    modifiers: [],
  };
}

function makePillar(slot: number, name = `Pillar ${slot}`): AgilityPillar {
  return {
    id: `test:pillar_${slot}`,
    name,
    slot,
    modifiers: [],
  };
}

function makePotion(tier: number): Potion {
  return {
    itemId: `test:potion_t${tier}`,
    itemName: `Test Potion T${tier}`,
    tier,
    modifiers: [{ boostId: ThievingBoostId.STEALTH, value: tier * 10 }],
  };
}

function makePrayer(id: string): Prayer {
  return { id, name: `Prayer ${id}` };
}

function makeSynergy(id1: string, id2: string): SummoningSynergyInfo {
  return {
    summon1Id: id1,
    summon2Id: id2,
    name: `${id1} + ${id2}`,
    description: `${id1} + ${id2}`,
    modifiers: [],
  };
}

describe('applyOverrides', () => {
  describe('with empty overrides', () => {
    it('should return a loadout identical to the imported one', () => {
      const imported = makeLoadout({
        equipment: [makeEquipment('melvorD:Gloves')],
        masteryLevel: 75,
        activePotion: makePotion(3),
        skillLevel: 110,
      });

      const result = applyOverrides(imported, {});

      expect(result).toEqual(imported);
    });
  });

  describe('equipment overrides', () => {
    it('should replace a single equipment slot', () => {
      const original = makeEquipment('melvorD:Gloves');
      const replacement = makeEquipment('melvorD:Gloves', [
        { boostId: ThievingBoostId.STEALTH, value: 50 },
      ]);
      const imported = makeLoadout({ equipment: [original] });

      const result = applyOverrides(imported, {
        equipment: { 'melvorD:Gloves': replacement },
      });

      expect(result.equipment).toEqual([replacement]);
    });

    it('should clear a slot when set to null', () => {
      const imported = makeLoadout({
        equipment: [
          makeEquipment('melvorD:Gloves'),
          makeEquipment('melvorD:Cape'),
        ],
      });

      const result = applyOverrides(imported, {
        equipment: { 'melvorD:Gloves': null },
      });

      expect(result.equipment).toHaveLength(1);
      expect(result.equipment[0].slotId).toBe('melvorD:Cape');
    });

    it('should add an item to a new slot', () => {
      const imported = makeLoadout({
        equipment: [makeEquipment('melvorD:Gloves')],
      });
      const newItem = makeEquipment('melvorD:Ring');

      const result = applyOverrides(imported, {
        equipment: { 'melvorD:Ring': newItem },
      });

      expect(result.equipment).toHaveLength(2);
      expect(result.equipment.map((e) => e.slotId)).toContain('melvorD:Gloves');
      expect(result.equipment.map((e) => e.slotId)).toContain('melvorD:Ring');
    });

    it('should preserve unmentioned slots', () => {
      const gloves = makeEquipment('melvorD:Gloves');
      const cape = makeEquipment('melvorD:Cape');
      const imported = makeLoadout({ equipment: [gloves, cape] });
      const newCape = makeEquipment('melvorD:Cape', [
        { boostId: ThievingBoostId.STEALTH, value: 100 },
      ]);

      const result = applyOverrides(imported, {
        equipment: { 'melvorD:Cape': newCape },
      });

      expect(result.equipment).toHaveLength(2);
      expect(result.equipment.find((e) => e.slotId === 'melvorD:Gloves')).toEqual(gloves);
      expect(result.equipment.find((e) => e.slotId === 'melvorD:Cape')).toEqual(newCape);
    });

    it('should not mutate the imported loadout', () => {
      const original = makeEquipment('melvorD:Gloves');
      const imported = makeLoadout({ equipment: [original] });
      const equipmentBefore = [...imported.equipment];

      applyOverrides(imported, {
        equipment: { 'melvorD:Gloves': null },
      });

      expect(imported.equipment).toEqual(equipmentBefore);
    });
  });

  describe('potion overrides', () => {
    it('should replace an active potion', () => {
      const imported = makeLoadout({ activePotion: makePotion(2) });
      const newPotion = makePotion(4);

      const result = applyOverrides(imported, { activePotion: newPotion });

      expect(result.activePotion).toEqual(newPotion);
    });

    it('should clear the potion when set to null', () => {
      const imported = makeLoadout({ activePotion: makePotion(3) });

      const result = applyOverrides(imported, { activePotion: null });

      expect(result.activePotion).toBeUndefined();
    });

    it('should add a potion when none was active', () => {
      const imported = makeLoadout({ activePotion: undefined });
      const potion = makePotion(1);

      const result = applyOverrides(imported, { activePotion: potion });

      expect(result.activePotion).toEqual(potion);
    });

    it('should preserve the imported potion when override is absent', () => {
      const potion = makePotion(3);
      const imported = makeLoadout({ activePotion: potion });

      const result = applyOverrides(imported, {});

      expect(result.activePotion).toEqual(potion);
    });
  });

  describe('prayer overrides', () => {
    it('should replace active prayers with a single prayer', () => {
      const imported = makeLoadout({
        activePrayers: [makePrayer('prayer1'), makePrayer('prayer2')],
      });
      const newPrayers: [Prayer] = [makePrayer('prayer3')];

      const result = applyOverrides(imported, { activePrayers: newPrayers });

      expect(result.activePrayers).toEqual(newPrayers);
    });

    it('should replace active prayers with two prayers', () => {
      const imported = makeLoadout({ activePrayers: [makePrayer('prayer1')] });
      const newPrayers: [Prayer, Prayer] = [makePrayer('prayer2'), makePrayer('prayer3')];

      const result = applyOverrides(imported, { activePrayers: newPrayers });

      expect(result.activePrayers).toEqual(newPrayers);
    });

    it('should clear prayers when set to null', () => {
      const imported = makeLoadout({
        activePrayers: [makePrayer('prayer1')],
      });

      const result = applyOverrides(imported, { activePrayers: null });

      expect(result.activePrayers).toBeUndefined();
    });

    it('should add prayers when none were active', () => {
      const imported = makeLoadout({ activePrayers: undefined });
      const prayers: [Prayer] = [makePrayer('prayer1')];

      const result = applyOverrides(imported, { activePrayers: prayers });

      expect(result.activePrayers).toEqual(prayers);
    });
  });

  describe('agility obstacle overrides', () => {
    it('should replace a specific obstacle slot', () => {
      const obstacle0 = makeObstacle(0, 'Original');
      const obstacle1 = makeObstacle(1);
      const imported = makeLoadout({
        agilityObstacles: [obstacle0, obstacle1],
      });
      const replacement = makeObstacle(0, 'Replacement');

      const result = applyOverrides(imported, {
        agilityObstacles: { 0: replacement },
      });

      expect(result.agilityObstacles).toHaveLength(2);
      expect(result.agilityObstacles.find((o) => o.slot === 0)).toEqual(replacement);
      expect(result.agilityObstacles.find((o) => o.slot === 1)).toEqual(obstacle1);
    });

    it('should clear a specific obstacle slot when set to null', () => {
      const imported = makeLoadout({
        agilityObstacles: [makeObstacle(0), makeObstacle(1), makeObstacle(2)],
      });

      const result = applyOverrides(imported, {
        agilityObstacles: { 1: null },
      });

      expect(result.agilityObstacles).toHaveLength(2);
      expect(result.agilityObstacles.map((o) => o.slot)).toEqual([0, 2]);
    });

    it('should add an obstacle to a new slot', () => {
      const imported = makeLoadout({
        agilityObstacles: [makeObstacle(0)],
      });
      const newObstacle = makeObstacle(3, 'New Obstacle');

      const result = applyOverrides(imported, {
        agilityObstacles: { 3: newObstacle },
      });

      expect(result.agilityObstacles).toHaveLength(2);
      expect(result.agilityObstacles.find((o) => o.slot === 3)).toEqual(newObstacle);
    });

    it('should not mutate the imported obstacles', () => {
      const imported = makeLoadout({
        agilityObstacles: [makeObstacle(0), makeObstacle(1)],
      });
      const obstaclesBefore = [...imported.agilityObstacles];

      applyOverrides(imported, { agilityObstacles: { 0: null } });

      expect(imported.agilityObstacles).toEqual(obstaclesBefore);
    });
  });

  describe('agility pillar overrides', () => {
    it('should replace a specific pillar slot', () => {
      const pillar0 = makePillar(0, 'Original');
      const imported = makeLoadout({ agilityPillars: [pillar0] });
      const replacement = makePillar(0, 'Replacement');

      const result = applyOverrides(imported, {
        agilityPillars: { 0: replacement },
      });

      expect(result.agilityPillars).toEqual([replacement]);
    });

    it('should clear a pillar slot when set to null', () => {
      const imported = makeLoadout({
        agilityPillars: [makePillar(0), makePillar(1)],
      });

      const result = applyOverrides(imported, {
        agilityPillars: { 0: null },
      });

      expect(result.agilityPillars).toHaveLength(1);
      expect(result.agilityPillars[0].slot).toBe(1);
    });
  });

  describe('summoning synergy overrides', () => {
    it('should replace the active synergy', () => {
      const imported = makeLoadout({
        activeSummoningSynergy: makeSynergy('a', 'b'),
      });
      const newSynergy = makeSynergy('c', 'd');

      const result = applyOverrides(imported, {
        activeSummoningSynergy: newSynergy,
      });

      expect(result.activeSummoningSynergy).toEqual(newSynergy);
    });

    it('should clear the synergy when set to null', () => {
      const imported = makeLoadout({
        activeSummoningSynergy: makeSynergy('a', 'b'),
      });

      const result = applyOverrides(imported, {
        activeSummoningSynergy: null,
      });

      expect(result.activeSummoningSynergy).toBeUndefined();
    });

    it('should add a synergy when none was active', () => {
      const imported = makeLoadout({ activeSummoningSynergy: undefined });
      const synergy = makeSynergy('a', 'b');

      const result = applyOverrides(imported, {
        activeSummoningSynergy: synergy,
      });

      expect(result.activeSummoningSynergy).toEqual(synergy);
    });
  });

  describe('scalar overrides', () => {
    it.each`
      field                    | importedValue | overrideValue
      ${'masteryLevel'}        | ${50}         | ${99}
      ${'skillLevel'}          | ${80}         | ${120}
      ${'abyssalSkillLevel'}   | ${1}          | ${60}
    `(
      'should override $field from $importedValue to $overrideValue',
      ({ field, importedValue, overrideValue }) => {
        const imported = makeLoadout({ [field]: importedValue });

        const result = applyOverrides(imported, { [field]: overrideValue });

        expect(result[field as keyof ThievingLoadout]).toBe(overrideValue);
      },
    );

    it.each`
      field                    | importedValue
      ${'masteryLevel'}        | ${50}
      ${'skillLevel'}          | ${80}
      ${'abyssalSkillLevel'}   | ${1}
    `(
      'should preserve $field when not overridden',
      ({ field, importedValue }) => {
        const imported = makeLoadout({ [field]: importedValue });

        const result = applyOverrides(imported, {});

        expect(result[field as keyof ThievingLoadout]).toBe(importedValue);
      },
    );
  });

  describe('non-overridable fields', () => {
    it('should always preserve mastery pool percentages from imported loadout', () => {
      const imported = makeLoadout({
        melvorMasteryPoolPercent: 95,
        abyssalMasteryPoolPercent: 50,
      });

      const result = applyOverrides(imported, {
        masteryLevel: 99,
        skillLevel: 120,
      });

      expect(result.melvorMasteryPoolPercent).toBe(95);
      expect(result.abyssalMasteryPoolPercent).toBe(50);
    });

    it('should always preserve astrology constellations from imported loadout', () => {
      const constellations = [
        {
          constellationId: 'test:ko',
          constellationName: 'Ko',
          modifiers: [{ boostId: ThievingBoostId.STEALTH, value: 5 }],
        },
      ];
      const imported = makeLoadout({ astrologyConstellations: constellations });

      const result = applyOverrides(imported, { masteryLevel: 99 });

      expect(result.astrologyConstellations).toBe(constellations);
    });

    it('should always preserve active pets from imported loadout', () => {
      const pets = [{ id: 'test:rocky', name: 'Rocky' }];
      const imported = makeLoadout({ activePets: pets });

      const result = applyOverrides(imported, { masteryLevel: 99 });

      expect(result.activePets).toBe(pets);
    });

    it('should always preserve shop purchases from imported loadout', () => {
      const purchases = [{ id: 'test:gloves', name: 'Gloves of Silence', count: 1 }];
      const imported = makeLoadout({ shopPurchases: purchases });

      const result = applyOverrides(imported, { masteryLevel: 99 });

      expect(result.shopPurchases).toBe(purchases);
    });
  });

  describe('combined overrides', () => {
    it('should apply multiple overrides simultaneously', () => {
      const gloves = makeEquipment('melvorD:Gloves');
      const cape = makeEquipment('melvorD:Cape');
      const potion = makePotion(2);
      const obstacle = makeObstacle(0);
      const synergy = makeSynergy('a', 'b');

      const imported = makeLoadout({
        equipment: [gloves, cape],
        masteryLevel: 50,
        activePotion: potion,
        activePrayers: [makePrayer('prayer1')],
        agilityObstacles: [obstacle],
        activeSummoningSynergy: synergy,
        skillLevel: 99,
      });

      const newCape = makeEquipment('melvorD:Cape', [
        { boostId: ThievingBoostId.STEALTH, value: 100 },
      ]);
      const newPotion = makePotion(4);
      const newPrayers: [Prayer, Prayer] = [makePrayer('p2'), makePrayer('p3')];

      const result = applyOverrides(imported, {
        equipment: { 'melvorD:Cape': newCape },
        masteryLevel: 99,
        activePotion: newPotion,
        activePrayers: newPrayers,
        activeSummoningSynergy: null,
        skillLevel: 120,
      });

      expect(result.equipment.find((e) => e.slotId === 'melvorD:Gloves')).toEqual(gloves);
      expect(result.equipment.find((e) => e.slotId === 'melvorD:Cape')).toEqual(newCape);
      expect(result.masteryLevel).toBe(99);
      expect(result.activePotion).toEqual(newPotion);
      expect(result.activePrayers).toEqual(newPrayers);
      expect(result.agilityObstacles).toEqual([obstacle]);
      expect(result.activeSummoningSynergy).toBeUndefined();
      expect(result.skillLevel).toBe(120);
    });
  });
});
