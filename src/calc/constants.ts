import type { ThievingBoosts } from './types';

export const BASE_INTERVAL_MS = 3000;
export const BASE_STUN_DURATION_MS = 3000;
export const MIN_INTERVAL_MS = 250;
export const MS_PER_HOUR = 3_600_000;
export const AREA_UNIQUE_BASE_CHANCE = 1 / 500;
export const COMMON_DROP_CHANCE = 0.75;

export const DEFAULT_BOOSTS: ThievingBoosts = {
  stealth: 0,
  flatIntervalReductionMs: 0,
  percentIntervalReduction: 0,
  percentXpBonus: 0,
  percentCurrencyBonus: 0,
  additionalDoublePercent: 0,
  stunAvoidancePercent: 0,
  percentStunDurationReduction: 0,
  percentAreaUniqueBonus: 0,
  flatAreaUniqueBonus: 0,
};

