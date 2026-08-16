import { boundValue } from '../utils/number-utils';
import {
  BASE_INTERVAL_MS,
  BASE_STUN_INTERVAL_MS,
  MIN_INTERVAL_MS,
  MS_PER_HOUR,
} from './constants';
import type { ThievingBoosts, ThievingResult, ThievingTarget } from './types';

/**
 * Calculates the success rate for a thieving action.
 *
 * @param {ThievingTarget} target The target being thieved.
 * @param {ThievingBoosts} boosts The boosts applied to the thieving action.
 * @returns {number} The success rate as a percentage.
 */
export function calcSuccessRate(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): number {
  const pickpocket = boundValue(
    Math.floor((boosts.stealth / target.perception) * 100),
    0,
    100,
  );

  return boundValue(pickpocket + boosts.sleightOfHand, 0, 100);
}

export function calcActionInterval(boosts: ThievingBoosts): number {
  const modified =
    Math.floor(BASE_INTERVAL_MS * (1 + boosts.intervalPercent / 100)) +
    boosts.flatIntervalMs;
  return Math.max(MIN_INTERVAL_MS, modified);
}

export function calcStunInterval(boosts: ThievingBoosts): number {
  return Math.max(
    0,
    Math.floor(BASE_STUN_INTERVAL_MS * (1 + boosts.stunIntervalPercent / 100)),
  );
}

export function calcXpPerAction(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): number {
  return target.baseXp * (1 + boosts.xpPercent / 100);
}

export function calcThieving(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): ThievingResult {
  const successRate = calcSuccessRate(target, boosts);
  const actionIntervalMs = calcActionInterval(boosts);
  const stunIntervalMs = calcStunInterval(boosts);
  const xpPerAction = calcXpPerAction(target, boosts);

  const pSuccess = successRate / 100;
  const pStun =
    (1 - pSuccess) *
    (1 - boundValue(boosts.stunAvoidancePercent, 0, 100) / 100);

  const expectedTimePerAttempt = actionIntervalMs + pStun * stunIntervalMs;
  const attemptsPerHour = MS_PER_HOUR / expectedTimePerAttempt;
  const effectiveXpPerHour = attemptsPerHour * pSuccess * xpPerAction;

  return {
    successRate,
    actionIntervalMs,
    stunIntervalMs,
    xpPerAction,
    effectiveXpPerHour,
  };
}

export function calcMasteryXpPerAction(
  target: ThievingTarget,
  boosts: ThievingBoosts,
): void {
  // TODO:
}
