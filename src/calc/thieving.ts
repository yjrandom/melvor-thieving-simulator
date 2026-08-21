import {
  BASE_INTERVAL_MS,
  BASE_STUN_DURATION_MS,
  MIN_INTERVAL_MS,
  MS_PER_HOUR,
} from '../constants/game.constants';
import { boundValue } from '../utils/number-utils';
import type { ThievingBoosts, ThievingResult, ThievingTarget } from './types';

// success_rate = min(1, (100 + stealth) / (100 + perception))
export function calcSuccessRate(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): number {
  return Math.min(1, (100 + boosts.stealth) / (100 + target.perception));
}

// effective_interval = max(base - flat_reductions, minimum) * (1 - pct_reduction / 100)
export function calcEffectiveInterval(boosts: ThievingBoosts): number {
  const afterFlat = Math.max(
    BASE_INTERVAL_MS - boosts.intervalReductionMs,
    MIN_INTERVAL_MS,
  );
  return afterFlat * (1 - boosts.intervalReductionPercent / 100);
}

export function calcStunDuration(boosts: ThievingBoosts): number {
  return Math.max(
    0,
    BASE_STUN_DURATION_MS * (1 - boosts.stunDurationReductionPercent / 100),
  );
}

// double_chance = min(1, stealth / (4 * perception) + additional / 100)
export function calcDoubleChance(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): number {
  const stealthBased = boosts.stealth / (4 * target.perception);
  return Math.min(1, stealthBased + boosts.additionalDoubleItemPercent / 100);
}

// unique_chance = (100 + stealth) / (10000 * perception)
export function calcNpcUniqueChance(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): number {
  return (100 + boosts.stealth) / (10_000 * target.perception);
}

export function calcAreaUniqueChance(
  baseChance: number,
  boosts: ThievingBoosts,
): number {
  return (
    baseChance * (1 + boosts.areaUniqueBonusPercent / 100) +
    boosts.areaUniqueBonus
  );
}

export function calcXpPerAction(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): number {
  return target.baseExperience * (1 + boosts.xpBonusPercent / 100);
}

// avg_currency = (min + max) / 2 * (1 + currency_bonus / 100)
export function calcAvgCurrencyPerSuccess(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): number {
  const avgBase = (target.currencyRange.min + target.currencyRange.max) / 2;
  return avgBase * (1 + boosts.currencyBonusPercent / 100);
}

export function calcThieving(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): ThievingResult {
  const successRate = calcSuccessRate(target, boosts);
  const effectiveIntervalMs = calcEffectiveInterval(boosts);
  const effectiveStunDurationMs = calcStunDuration(boosts);
  const xpPerAction = calcXpPerAction(target, boosts);
  const doubleChance = calcDoubleChance(target, boosts);
  const npcUniqueChance = calcNpcUniqueChance(target, boosts);

  const stunAvoidance = boundValue(boosts.stunAvoidancePercent / 100, 0, 1);
  const pStun = (1 - successRate) * (1 - stunAvoidance);
  const expectedTimePerAction =
    effectiveIntervalMs + pStun * effectiveStunDurationMs;
  const actionsPerHour = MS_PER_HOUR / expectedTimePerAction;
  const successfulActionsPerHour = actionsPerHour * successRate;

  const xpPerHour = successfulActionsPerHour * xpPerAction;

  const avgCurrencyPerSuccess = calcAvgCurrencyPerSuccess(target, boosts);
  const currencyPerHour =
    successfulActionsPerHour * avgCurrencyPerSuccess * (1 + doubleChance);

  return {
    successRate,
    effectiveIntervalMs,
    effectiveStunDurationMs,
    doubleChance,
    npcUniqueChance,
    xpPerAction,
    actionsPerHour,
    successfulActionsPerHour,
    xpPerHour,
    currencyPerHour,
  };
}
