import { GENERIC_RARE_DROPS } from '../__fixtures__/loots';
import {
  AREA_UNIQUE_BASE_CHANCE,
  DEFAULT_BOOSTS,
  LootCategory,
  RealmName,
} from '../constants/game.constants';
import { ThievingRealmId } from '../constants/item-ids';
import {
  buildLootTable,
  calcAtLeastOneChance,
  calcAttemptsForChance,
} from './detail';
import type {
  ThievingArea,
  ThievingBoosts,
  ThievingResult,
  ThievingTarget,
} from './types';

describe('Detail Calculations', () => {
  describe('calcAtLeastOneChance', () => {
    describe('should return correct probability for standard inputs', () => {
      it.each`
        scenario                        | chance   | attempts | expected
        ${'50% chance, 1 attempt'}      | ${0.5}   | ${1}     | ${0.5}
        ${'50% chance, 2 attempts'}     | ${0.5}   | ${2}     | ${0.75}
        ${'50% chance, 10 attempts'}    | ${0.5}   | ${10}    | ${1 - Math.pow(0.5, 10)}
        ${'1% chance, 100 attempts'}    | ${0.01}  | ${100}   | ${1 - Math.pow(0.99, 100)}
        ${'1% chance, 1 attempt'}       | ${0.01}  | ${1}     | ${0.01}
        ${'0.2% chance, 500 attempts'}  | ${0.002} | ${500}   | ${1 - Math.pow(0.998, 500)}
        ${'0.2% chance, 3000 attempts'} | ${0.002} | ${3000}  | ${1 - Math.pow(0.998, 3000)}
      `('$scenario', ({ chance, attempts, expected }) => {
        expect(calcAtLeastOneChance(chance, attempts)).toBeCloseTo(
          expected,
          10,
        );
      });
    });

    describe('should handle edge cases', () => {
      it.each`
        scenario                     | chance | attempts | expected
        ${'zero chance'}             | ${0}   | ${1000}  | ${0}
        ${'zero attempts'}           | ${0.5} | ${0}     | ${0}
        ${'negative chance'}         | ${-1}  | ${10}    | ${0}
        ${'negative attempts'}       | ${0.5} | ${-5}    | ${0}
        ${'100% chance'}             | ${1}   | ${1}     | ${1}
        ${'100% chance, many tries'} | ${1}   | ${100}   | ${1}
        ${'chance > 1'}              | ${1.5} | ${1}     | ${1}
      `('$scenario', ({ chance, attempts, expected }) => {
        expect(calcAtLeastOneChance(chance, attempts)).toBe(expected);
      });
    });
  });

  describe('calcAttemptsForChance', () => {
    describe('should return correct attempt counts for standard inputs', () => {
      it.each`
        scenario                          | chance     | confidence | expected
        ${'50% conf at 50% chance'}       | ${0.5}     | ${0.5}     | ${1}
        ${'90% conf at 50% chance'}       | ${0.5}     | ${0.9}     | ${4}
        ${'99% conf at 50% chance'}       | ${0.5}     | ${0.99}    | ${7}
        ${'50% conf at 1% chance'}        | ${0.01}    | ${0.5}     | ${69}
        ${'90% conf at 1% chance'}        | ${0.01}    | ${0.9}     | ${230}
        ${'50% conf at 0.2% (1/500)'}     | ${0.002}   | ${0.5}     | ${347}
        ${'90% conf at 0.2% (1/500)'}     | ${0.002}   | ${0.9}     | ${1151}
        ${'99% conf at 0.005% (1/20000)'} | ${0.00005} | ${0.99}    | ${92102}
      `('$scenario', ({ chance, confidence, expected }) => {
        expect(calcAttemptsForChance(chance, confidence)).toBe(expected);
      });
    });

    describe('should handle edge cases', () => {
      it.each`
        scenario                 | chance | confidence | expected
        ${'zero chance'}         | ${0}   | ${0.5}     | ${Infinity}
        ${'negative chance'}     | ${-1}  | ${0.5}     | ${Infinity}
        ${'100% chance'}         | ${1}   | ${0.99}    | ${1}
        ${'zero confidence'}     | ${0.5} | ${0}       | ${0}
        ${'negative confidence'} | ${0.5} | ${-0.1}    | ${0}
        ${'100% confidence'}     | ${0.5} | ${1}       | ${Infinity}
      `('$scenario', ({ chance, confidence, expected }) => {
        expect(calcAttemptsForChance(chance, confidence)).toBe(expected);
      });
    });

    describe('should be consistent with calcAtLeastOneChance', () => {
      it.each`
        chance   | confidence
        ${0.01}  | ${0.5}
        ${0.01}  | ${0.9}
        ${0.002} | ${0.5}
        ${0.002} | ${0.99}
      `(
        '$chance chance at $confidence confidence',
        ({ chance, confidence }) => {
          const attempts = calcAttemptsForChance(chance, confidence);
          const achieved = calcAtLeastOneChance(chance, attempts);
          expect(achieved).toBeGreaterThanOrEqual(confidence);

          if (attempts > 1) {
            const belowAttempts = calcAtLeastOneChance(chance, attempts - 1);
            expect(belowAttempts).toBeLessThan(confidence);
          }
        },
      );
    });
  });

  describe('buildLootTable', () => {
    const baseTarget: ThievingTarget = {
      id: 'melvorF:Woman',
      name: 'Woman',
      area: 'Low Town',
      realmId: ThievingRealmId.MELVOR,
      level: 4,
      baseExperience: 7,
      maxHit: 32,
      perception: 140,
      currencyRange: { min: 1, max: 150 },
      currencyType: 'gp',
      uniqueDrop: { name: 'Fine Coinpurse', dropQuantity: { min: 1, max: 1 } },
    };

    const baseArea: ThievingArea = {
      name: 'Low Town',
      realm: RealmName.MELVOR,
      levelRequirement: 1,
      targets: ['Man', 'Woman'],
      areaUniqueDrops: [
        {
          name: 'Jeweled Necklace',
          dropChance: AREA_UNIQUE_BASE_CHANCE,
          dropQuantity: { min: 1, max: 1 },
        },
      ],
    };

    const baseResult: ThievingResult = {
      successRate: 0.9,
      effectiveIntervalMs: 2800,
      effectiveStunDurationMs: 3000,
      doubleChance: 0.25,
      npcUniqueChance: 0.0005,
      xpPerAction: 7,
      actionsPerHour: 1200,
      successfulActionsPerHour: 1080,
      xpPerHour: 7560,
      currencyPerHour: 102060,
    };

    const baseBoosts: ThievingBoosts = {
      ...DEFAULT_BOOSTS,
      stealth: 200,
    };

    it('should include currency, common, NPC unique, area uniques, and generic rares', () => {
      const table = buildLootTable(
        baseTarget,
        baseArea,
        baseResult,
        baseBoosts,
      );

      const categories = table.map((e) => e.category);
      expect(categories).toContain(LootCategory.CURRENCY);
      expect(categories).toContain(LootCategory.COMMON);
      expect(categories).toContain(LootCategory.NPC_UNIQUE);
      expect(categories).toContain(LootCategory.AREA_UNIQUE);
      expect(categories).toContain(LootCategory.GENERIC_RARE);
    });

    it('should have correct entry count', () => {
      const table = buildLootTable(
        baseTarget,
        baseArea,
        baseResult,
        baseBoosts,
      );
      // 1 currency + 1 common + 1 NPC unique + 1 area unique + 4 generic rares
      expect(table).toHaveLength(
        3 + baseArea.areaUniqueDrops.length + GENERIC_RARE_DROPS.length,
      );
    });

    it('should set currency chance per success to 1', () => {
      const table = buildLootTable(
        baseTarget,
        baseArea,
        baseResult,
        baseBoosts,
      );
      const currency = table.find((e) => e.category === LootCategory.CURRENCY)!;
      expect(currency.chancePerSuccess).toBe(1);
      expect(currency.chancePerAction).toBeCloseTo(0.9);
    });

    it('should set common drop chance to 0.75', () => {
      const table = buildLootTable(
        baseTarget,
        baseArea,
        baseResult,
        baseBoosts,
      );
      const common = table.find((e) => e.category === LootCategory.COMMON)!;
      expect(common.chancePerSuccess).toBe(0.75);
      expect(common.chancePerAction).toBeCloseTo(0.75 * 0.9);
    });

    it('should use result npcUniqueChance for NPC unique entry', () => {
      const table = buildLootTable(
        baseTarget,
        baseArea,
        baseResult,
        baseBoosts,
      );
      const unique = table.find((e) => e.category === LootCategory.NPC_UNIQUE)!;
      expect(unique.name).toBe('Fine Coinpurse');
      expect(unique.chancePerSuccess).toBe(0.0005);
      expect(unique.chancePerAction).toBeCloseTo(0.0005 * 0.9);
    });

    it('should omit NPC unique entry when target has no unique drop', () => {
      const noUniqueTarget = { ...baseTarget, uniqueDrop: undefined };
      const table = buildLootTable(
        noUniqueTarget,
        baseArea,
        baseResult,
        baseBoosts,
      );
      expect(
        table.find((e) => e.category === LootCategory.NPC_UNIQUE),
      ).toBeUndefined();
    });

    it('should factor doubling into expectedPerHour', () => {
      const table = buildLootTable(
        baseTarget,
        baseArea,
        baseResult,
        baseBoosts,
      );
      const common = table.find((e) => e.category === LootCategory.COMMON)!;
      const expectedPerHour =
        baseResult.successfulActionsPerHour *
        0.75 *
        (1 + baseResult.doubleChance);
      expect(common.expectedPerHour).toBeCloseTo(expectedPerHour);
    });

    it('should handle missing area gracefully', () => {
      const table = buildLootTable(
        baseTarget,
        undefined,
        baseResult,
        baseBoosts,
      );
      expect(
        table.find((e) => e.category === LootCategory.AREA_UNIQUE),
      ).toBeUndefined();
    });

    it('should include all generic rare items', () => {
      const table = buildLootTable(
        baseTarget,
        baseArea,
        baseResult,
        baseBoosts,
      );
      const rares = table.filter(
        (e) => e.category === LootCategory.GENERIC_RARE,
      );
      expect(rares).toHaveLength(GENERIC_RARE_DROPS.length);
      for (const rare of GENERIC_RARE_DROPS) {
        expect(rares.find((r) => r.name === rare.name)).toBeDefined();
      }
    });

    it('should apply area unique bonus from boosts', () => {
      const boostedBoosts: ThievingBoosts = {
        ...baseBoosts,
        areaUniqueBonusPercent: 200,
      };
      const table = buildLootTable(
        baseTarget,
        baseArea,
        baseResult,
        boostedBoosts,
      );
      const areaUnique = table.find(
        (e) => e.category === LootCategory.AREA_UNIQUE,
      )!;
      const expectedChance = AREA_UNIQUE_BASE_CHANCE * (1 + 200 / 100);
      expect(areaUnique.chancePerSuccess).toBeCloseTo(expectedChance);
    });
  });
});
