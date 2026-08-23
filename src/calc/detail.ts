import { GENERIC_RARE_DROPS } from '../__fixtures__/loots';
import { COMMON_DROP_CHANCE, LootCategory } from '../constants/game.constants';
import { calcAreaUniqueChance } from './thieving';
import type {
  DetailLootEntry,
  ThievingArea,
  ThievingBoosts,
  ThievingResult,
  ThievingTarget,
} from './types';

/**
 * Probability of receiving at least one drop in N attempts.
 *
 * @param chancePerAttempt Drop probability per single attempt (0–1).
 * @param attempts Number of independent attempts.
 * @returns Probability of at least one success (0–1).
 */
export function calcAtLeastOneChance(
  chancePerAttempt: number,
  attempts: number,
): number {
  if (chancePerAttempt <= 0 || attempts <= 0) return 0;
  if (chancePerAttempt >= 1) return 1;
  return 1 - Math.pow(1 - chancePerAttempt, attempts);
}

/**
 * Number of attempts needed to reach a target confidence of at least one drop.
 *
 * @param chancePerAttempt Drop probability per single attempt (0–1, exclusive).
 * @param confidence Target cumulative probability (0–1, exclusive).
 * @returns Minimum integer attempts, or Infinity if the drop chance is zero.
 */
export function calcAttemptsForChance(
  chancePerAttempt: number,
  confidence: number,
): number {
  if (chancePerAttempt <= 0) return Infinity;
  if (chancePerAttempt >= 1) return 1;
  if (confidence <= 0) return 0;
  if (confidence >= 1) return Infinity;
  return Math.ceil(Math.log(1 - confidence) / Math.log(1 - chancePerAttempt));
}

/**
 * Assembles the complete loot table for a single NPC target.
 *
 * Each entry carries both a per-success and per-action drop chance (the latter
 * factors in the NPC's success rate) and an expected-per-hour figure that
 * accounts for doubling and currency multipliers.
 */
export function buildLootTable(
  target: ThievingTarget,
  area: ThievingArea | undefined,
  result: ThievingResult,
  boosts: ThievingBoosts,
): DetailLootEntry[] {
  const entries: DetailLootEntry[] = [];
  const { successRate, successfulActionsPerHour, doubleChance } = result;
  const doubleMultiplier = 1 + doubleChance;

  // Currency (always drops on success)
  const avgCurrencyBase =
    (target.currencyRange.min + target.currencyRange.max) / 2;
  const currencyBonusMult = 1 + boosts.currencyBonusPercent / 100;
  const currencyMult = 1 + boosts.currencyMultiplierBonus;
  entries.push({
    name: target.currencyType === 'ap' ? 'Abyssal Pieces' : 'Gold Pieces',
    category: LootCategory.CURRENCY,
    chancePerSuccess: 1,
    chancePerAction: successRate,
    quantity: target.currencyRange,
    expectedPerHour:
      successfulActionsPerHour *
      avgCurrencyBase *
      currencyBonusMult *
      doubleMultiplier *
      currencyMult,
  });

  // Common drop (75% per success)
  entries.push({
    name: 'Common Drop',
    category: LootCategory.COMMON,
    chancePerSuccess: COMMON_DROP_CHANCE,
    chancePerAction: COMMON_DROP_CHANCE * successRate,
    quantity: { min: 1, max: 1 },
    expectedPerHour:
      successfulActionsPerHour * COMMON_DROP_CHANCE * doubleMultiplier,
  });

  // NPC unique
  if (target.uniqueDrop) {
    const chance = result.npcUniqueChance;
    const avgQty =
      (target.uniqueDrop.dropQuantity.min +
        target.uniqueDrop.dropQuantity.max) /
      2;
    entries.push({
      name: target.uniqueDrop.name,
      category: LootCategory.NPC_UNIQUE,
      chancePerSuccess: chance,
      chancePerAction: chance * successRate,
      quantity: target.uniqueDrop.dropQuantity,
      expectedPerHour:
        successfulActionsPerHour * chance * avgQty * doubleMultiplier,
    });
  }

  // Area uniques (each rolled independently)
  if (area) {
    for (const areaUnique of area.areaUniqueDrops) {
      const baseChance = areaUnique.dropChance ?? 0;
      const effectiveChance = calcAreaUniqueChance(baseChance, boosts);
      const avgQty =
        (areaUnique.dropQuantity.min + areaUnique.dropQuantity.max) / 2;
      entries.push({
        name: areaUnique.name,
        category: LootCategory.AREA_UNIQUE,
        chancePerSuccess: effectiveChance,
        chancePerAction: effectiveChance * successRate,
        quantity: areaUnique.dropQuantity,
        expectedPerHour:
          successfulActionsPerHour *
          effectiveChance *
          avgQty *
          doubleMultiplier,
      });
    }
  }

  // Generic rares (independent chance each)
  for (const rare of GENERIC_RARE_DROPS) {
    const chance = rare.dropChance ?? 0;
    const avgQty = (rare.dropQuantity.min + rare.dropQuantity.max) / 2;
    entries.push({
      name: rare.name,
      category: LootCategory.GENERIC_RARE,
      chancePerSuccess: chance,
      chancePerAction: chance * successRate,
      quantity: rare.dropQuantity,
      expectedPerHour:
        successfulActionsPerHour * chance * avgQty * doubleMultiplier,
    });
  }

  return entries;
}
