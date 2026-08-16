import type { ThievingBoosts } from './types';

export const BASE_INTERVAL_MS = 3000;
export const BASE_STUN_INTERVAL_MS = 3000;
export const MIN_INTERVAL_MS = 250;
export const MS_PER_HOUR = 3_600_000;

export const DEFAULT_BOOSTS: ThievingBoosts = {
  stealth: 0,
  sleightOfHand: 0,
  xpPercent: 0,
  intervalPercent: 0,
  flatIntervalMs: 0,
  stunAvoidancePercent: 0,
  stunIntervalPercent: 0,
};
