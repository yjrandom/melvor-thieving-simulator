import type { ThievingBoosts } from '../calc/types';

export const BASE_INTERVAL_MS = 3000;
export const BASE_STUN_DURATION_MS = 3000;
export const MIN_INTERVAL_MS = 250;
export const MS_PER_HOUR = 3_600_000;
export const AREA_UNIQUE_BASE_CHANCE = 1 / 500;
export const COMMON_DROP_CHANCE = 0.75;

export const DEFAULT_BOOSTS: ThievingBoosts = {
  stealth: 0,
  intervalReductionMs: 0,
  intervalReductionPercent: 0,
  xpBonusPercent: 0,
  currencyBonusPercent: 0,
  additionalDoubleItemPercent: 0,
  stunAvoidancePercent: 0,
  stunDurationReductionPercent: 0,
  areaUniqueBonusPercent: 0,
  areaUniqueBonus: 0,
  currencyMultiplierBonus: 0,
  itemMultiplierBonus: 0,
  autoSellMultiplier: 0,
};

export enum LootCategory {
  CURRENCY = 'currency',
  COMMON = 'common',
  NPC_UNIQUE = 'npcUnique',
  AREA_UNIQUE = 'areaUnique',
  GENERIC_RARE = 'genericRare',
}

export enum RealmName {
  MELVOR = 'melvor',
  ABYSSAL = 'abyssal',
}