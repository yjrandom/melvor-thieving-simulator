import {
  BASE_INTERVAL_MS,
  BASE_STUN_DURATION_MS,
  DEFAULT_BOOSTS,
  MIN_INTERVAL_MS,
  MS_PER_HOUR,
} from '../constants/game.constants';
import { ThievingRealmId } from '../constants/item-ids';
import type { ThievingBoosts, ThievingTarget } from './types';
import {
  calcAreaUniqueChance,
  calcAvgCurrencyPerSuccess,
  calcDoubleChance,
  calcEffectiveInterval,
  calcNpcUniqueChance,
  calcStunDuration,
  calcSuccessRate,
  calcThieving,
  calcXpPerAction,
} from './thieving';

function makeTarget(overrides: Partial<ThievingTarget> = {}): ThievingTarget {
  return {
    id: 'test:npc',
    name: 'Test NPC',
    perception: 220,
    maxHit: 100,
    baseExperience: 50,
    level: 50,
    realmId: ThievingRealmId.MELVOR,
    area: 'Test Area',
    currencyRange: { min: 1, max: 200 },
    currencyType: 'gp',
    ...overrides,
  };
}

function makeBoosts(overrides: Partial<ThievingBoosts> = {}): ThievingBoosts {
  return { ...DEFAULT_BOOSTS, ...overrides };
}

describe('Calc Engine', () => {
  describe('calcSuccessRate', () => {
    it.each`
      scenario                                   | stealth | perception | expected
      ${'wiki example: 200 stealth vs 220 perc'} | ${200}  | ${220}     | ${300 / 320}
      ${'guaranteed when stealth = perception'}   | ${220}  | ${220}     | ${1}
      ${'capped at 1 when stealth > perception'}  | ${500}  | ${220}     | ${1}
      ${'zero stealth'}                           | ${0}    | ${220}     | ${100 / 320}
      ${'high perception'}                        | ${100}  | ${1000}    | ${200 / 1100}
    `('$scenario', ({ stealth, perception, expected }) => {
      const target = makeTarget({ perception });
      const boosts = makeBoosts({ stealth });
      expect(calcSuccessRate(target, boosts)).toBeCloseTo(expected, 10);
    });
  });

  describe('calcEffectiveInterval', () => {
    it.each`
      scenario                                         | flatMs   | pct  | expected
      ${'no reductions'}                               | ${0}     | ${0} | ${BASE_INTERVAL_MS}
      ${'flat 200ms reduction'}                        | ${200}   | ${0} | ${2800}
      ${'flat 1200ms reduction (mastery+pool+agility+cape+gloves)'} | ${1200}  | ${0} | ${1800}
      ${'percentage 5% reduction (astrology)'}         | ${0}     | ${5} | ${BASE_INTERVAL_MS * 0.95}
      ${'flat + percentage combined'}                  | ${1200}  | ${5} | ${1800 * 0.95}
      ${'floor clamp when flat exceeds base'}          | ${2800}  | ${0} | ${MIN_INTERVAL_MS}
      ${'floor then percentage applied'}               | ${2800}  | ${5} | ${MIN_INTERVAL_MS * 0.95}
      ${'exact floor boundary'}                        | ${BASE_INTERVAL_MS - MIN_INTERVAL_MS} | ${0} | ${MIN_INTERVAL_MS}
    `('$scenario', ({ flatMs, pct, expected }) => {
      const boosts = makeBoosts({
        intervalReductionMs: flatMs,
        intervalReductionPercent: pct,
      });
      expect(calcEffectiveInterval(boosts)).toBeCloseTo(expected, 10);
    });
  });

  describe('calcStunDuration', () => {
    it.each`
      scenario                    | reductionPct | expected
      ${'no reduction'}           | ${0}         | ${BASE_STUN_DURATION_MS}
      ${'25% reduction'}          | ${25}        | ${BASE_STUN_DURATION_MS * 0.75}
      ${'50% reduction (two sources)'} | ${50}   | ${BASE_STUN_DURATION_MS * 0.5}
      ${'100% reduction floors at 0'}  | ${100}  | ${0}
      ${'over 100% floors at 0'}       | ${150}  | ${0}
    `('$scenario', ({ reductionPct, expected }) => {
      const boosts = makeBoosts({ stunDurationReductionPercent: reductionPct });
      expect(calcStunDuration(boosts)).toBeCloseTo(expected, 10);
    });
  });

  describe('calcDoubleChance', () => {
    it.each`
      scenario                                   | stealth | perception | additional | expected
      ${'wiki example: 330 vs 220'}              | ${330}  | ${220}     | ${0}       | ${330 / 880}
      ${'guaranteed when stealth >= 4*perception'}| ${880}  | ${220}     | ${0}       | ${1}
      ${'capped above 100%'}                     | ${1000} | ${220}     | ${0}       | ${1}
      ${'zero stealth, no additional'}           | ${0}    | ${220}     | ${0}       | ${0}
      ${'stealth-based + additional bonus'}      | ${200}  | ${220}     | ${10}      | ${200 / 880 + 0.1}
      ${'additional alone caps at 100%'}         | ${0}    | ${220}     | ${110}     | ${1}
    `('$scenario', ({ stealth, perception, additional, expected }) => {
      const target = makeTarget({ perception });
      const boosts = makeBoosts({ stealth, additionalDoubleItemPercent: additional });
      expect(calcDoubleChance(target, boosts)).toBeCloseTo(expected, 10);
    });
  });

  describe('calcNpcUniqueChance', () => {
    it.each`
      scenario                                     | stealth | perception | expected
      ${'wiki example: 800 stealth vs 300 perc'}   | ${800}  | ${300}     | ${900 / 3_000_000}
      ${'zero stealth'}                            | ${0}    | ${220}     | ${100 / 2_200_000}
      ${'high stealth'}                            | ${1000} | ${1000}    | ${1100 / 10_000_000}
    `('$scenario', ({ stealth, perception, expected }) => {
      const target = makeTarget({ perception });
      const boosts = makeBoosts({ stealth });
      expect(calcNpcUniqueChance(target, boosts)).toBeCloseTo(expected, 10);
    });
  });

  describe('calcAreaUniqueChance', () => {
    it.each`
      scenario                              | baseChance  | pctBonus | flatBonus | expected
      ${'base chance only'}                 | ${0.002}    | ${0}     | ${0}      | ${0.002}
      ${'with 200% percentage bonus'}       | ${0.002}    | ${200}   | ${0}      | ${0.002 * 3}
      ${'with flat bonus only'}             | ${0.002}    | ${0}     | ${0.0001} | ${0.002 + 0.0001}
      ${'percentage + flat stacking'}       | ${0.002}    | ${200}   | ${0.0001} | ${0.002 * 3 + 0.0001}
    `('$scenario', ({ baseChance, pctBonus, flatBonus, expected }) => {
      const boosts = makeBoosts({
        areaUniqueBonusPercent: pctBonus,
        areaUniqueBonus: flatBonus,
      });
      expect(calcAreaUniqueChance(baseChance, boosts)).toBeCloseTo(expected, 10);
    });
  });

  describe('calcXpPerAction', () => {
    it.each`
      scenario                 | baseXp | xpBonus | expected
      ${'no bonus'}            | ${50}  | ${0}    | ${50}
      ${'3% mastery pool'}     | ${50}  | ${3}    | ${50 * 1.03}
      ${'10% bonus'}           | ${100} | ${10}   | ${110}
    `('$scenario', ({ baseXp, xpBonus, expected }) => {
      const target = makeTarget({ baseExperience: baseXp });
      const boosts = makeBoosts({ xpBonusPercent: xpBonus });
      expect(calcXpPerAction(target, boosts)).toBeCloseTo(expected, 10);
    });
  });

  describe('calcAvgCurrencyPerSuccess', () => {
    it.each`
      scenario                   | min  | max    | currencyBonus | expected
      ${'no bonus, 1-200 range'} | ${1} | ${200} | ${0}          | ${100.5}
      ${'100% bonus'}            | ${1} | ${200} | ${100}        | ${201}
      ${'high range'}            | ${1} | ${1000}| ${0}          | ${500.5}
      ${'zero max'}              | ${0} | ${0}   | ${0}          | ${0}
    `('$scenario', ({ min, max, currencyBonus, expected }) => {
      const target = makeTarget({ currencyRange: { min, max } });
      const boosts = makeBoosts({ currencyBonusPercent: currencyBonus });
      expect(calcAvgCurrencyPerSuccess(target, boosts)).toBeCloseTo(expected, 10);
    });
  });

  describe('calcThieving', () => {
    it('end-to-end with Bandit Thug and 200 stealth', () => {
      const target = makeTarget({
        perception: 220,
        baseExperience: 13,
        currencyRange: { min: 1, max: 200 },
      });
      const boosts = makeBoosts({ stealth: 200 });
      const result = calcThieving(target, boosts);

      expect(result.successRate).toBeCloseTo(300 / 320, 10);
      expect(result.effectiveIntervalMs).toBe(BASE_INTERVAL_MS);
      expect(result.effectiveStunDurationMs).toBe(BASE_STUN_DURATION_MS);
      expect(result.doubleChance).toBeCloseTo(200 / 880, 10);
      expect(result.npcUniqueChance).toBeCloseTo(300 / 2_200_000, 10);
      expect(result.xpPerAction).toBe(13);

      const pStun = (1 - 300 / 320) * 1;
      const expectedTime = BASE_INTERVAL_MS + pStun * BASE_STUN_DURATION_MS;
      expect(result.actionsPerHour).toBeCloseTo(MS_PER_HOUR / expectedTime, 6);
      expect(result.successfulActionsPerHour).toBeCloseTo(
        (MS_PER_HOUR / expectedTime) * (300 / 320),
        6,
      );
      expect(result.xpPerHour).toBeCloseTo(
        result.successfulActionsPerHour * 13,
        4,
      );

      const avgCurrency = 100.5;
      expect(result.currencyPerHour).toBeCloseTo(
        result.successfulActionsPerHour * avgCurrency * (1 + 200 / 880),
        4,
      );
    });

    it('100% success rate eliminates stun impact', () => {
      const target = makeTarget({ perception: 220 });
      const boosts = makeBoosts({ stealth: 300 });
      const result = calcThieving(target, boosts);

      expect(result.successRate).toBe(1);
      expect(result.actionsPerHour).toBeCloseTo(
        MS_PER_HOUR / BASE_INTERVAL_MS,
        10,
      );
      expect(result.successfulActionsPerHour).toBeCloseTo(
        result.actionsPerHour,
        10,
      );
    });

    it('stun avoidance reduces effective stun rate', () => {
      const target = makeTarget({ perception: 220 });
      const boosts = makeBoosts({
        stealth: 100,
        stunAvoidancePercent: 50,
      });
      const result = calcThieving(target, boosts);

      const successRate = (100 + 100) / (100 + 220);
      const stunAvoidance = 0.5;
      const pStun = (1 - successRate) * (1 - stunAvoidance);
      const expectedTime = BASE_INTERVAL_MS + pStun * BASE_STUN_DURATION_MS;

      expect(result.actionsPerHour).toBeCloseTo(MS_PER_HOUR / expectedTime, 6);

      // Compare with zero stun avoidance — should have higher throughput
      const noAvoidResult = calcThieving(
        target,
        makeBoosts({ stealth: 100, stunAvoidancePercent: 0 }),
      );
      expect(result.actionsPerHour).toBeGreaterThan(
        noAvoidResult.actionsPerHour,
      );
    });

    it('stun avoidance capped at 100%', () => {
      const target = makeTarget({ perception: 220 });
      const boosts = makeBoosts({
        stealth: 100,
        stunAvoidancePercent: 150,
      });
      const result = calcThieving(target, boosts);

      // With 100% stun avoidance, no stun time even on failed attempts
      expect(result.actionsPerHour).toBeCloseTo(
        MS_PER_HOUR / BASE_INTERVAL_MS,
        10,
      );
    });

    it('currencyMultiplierBonus scales currency output', () => {
      const target = makeTarget({
        perception: 220,
        currencyRange: { min: 1, max: 200 },
      });
      const baseResult = calcThieving(target, makeBoosts({ stealth: 300 }));
      const boostedResult = calcThieving(
        target,
        makeBoosts({ stealth: 300, currencyMultiplierBonus: 0.35 }),
      );

      expect(boostedResult.currencyPerHour).toBeCloseTo(
        baseResult.currencyPerHour * 1.35,
        4,
      );
    });

    it('interval reductions increase throughput', () => {
      const target = makeTarget({ perception: 220 });
      const boosts = makeBoosts({
        stealth: 300,
        intervalReductionMs: 1200,
        intervalReductionPercent: 5,
      });
      const result = calcThieving(target, boosts);

      const expectedInterval = (BASE_INTERVAL_MS - 1200) * 0.95;
      expect(result.effectiveIntervalMs).toBeCloseTo(expectedInterval, 10);
      expect(result.actionsPerHour).toBeCloseTo(
        MS_PER_HOUR / expectedInterval,
        6,
      );
    });
  });
});
