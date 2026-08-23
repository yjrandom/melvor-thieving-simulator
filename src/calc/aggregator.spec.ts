import {
  SynergyFamiliarId,
  ThievingBoostId,
  ThievingRealmId,
} from '../constants/item-ids';
import { Aggregator } from './aggregator';
import type {
  EquippedItemEntry,
  Modifier,
  Potion,
  SummoningSynergyInfo,
  ThievingLoadout,
} from './types';

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

function makeEquipment(
  slotId: string,
  modifiers: Modifier[],
): EquippedItemEntry {
  return {
    slotId,
    itemId: `test:${slotId}`,
    itemName: `Test ${slotId}`,
    modifiers,
  };
}

function makeStealth(value: number, realmId?: string): Modifier {
  const modifier: Modifier = {
    boostId: ThievingBoostId.STEALTH,
    value,
  };

  if (realmId) {
    modifier.realmId = realmId;
  }

  return modifier;
}

function makeInterval(value: number, realmId?: string): Modifier {
  const modifier: Modifier = {
    boostId: ThievingBoostId.FLAT_SKILL_INTERVAL,
    value,
  };

  if (realmId) {
    modifier.realmId = realmId;
  }

  return modifier;
}

function makeSynergy(
  summon1Id: string,
  summon2Id: string,
  modifiers: Modifier[] = [],
): SummoningSynergyInfo {
  return {
    summon1Id,
    summon2Id,
    name: `${summon1Id} + ${summon2Id}`,
    description: 'test synergy',
    modifiers,
  };
}

describe('Aggregator', () => {
  let aggregator: Aggregator;

  beforeEach(() => {
    aggregator = new Aggregator();
  });

  describe('bare loadout', () => {
    it('returns defaults plus skill level stealth', () => {
      const loadout = makeLoadout({ skillLevel: 1 });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.stealth).toBe(1);
      expect(boosts.intervalReductionMs).toBe(0);
      expect(boosts.intervalReductionPercent).toBe(0);
      expect(boosts.xpBonusPercent).toBe(0);
      expect(boosts.currencyBonusPercent).toBe(0);
      expect(boosts.additionalDoubleItemPercent).toBe(0);
      expect(boosts.stunAvoidancePercent).toBe(0);
      expect(boosts.stunDurationReductionPercent).toBe(0);
      expect(boosts.areaUniqueBonusPercent).toBe(0);
      expect(boosts.areaUniqueBonus).toBe(0);
      expect(boosts.currencyMultiplierBonus).toBe(0);
      expect(boosts.itemMultiplierBonus).toBe(0);
      expect(boosts.autoSellMultiplier).toBe(0);
    });
  });

  describe('stealth stacking from multiple sources', () => {
    it('sums equipment + mastery + skill level + mastery pool stealth', () => {
      const loadout = makeLoadout({
        equipment: [
          makeEquipment('gloves', [makeStealth(75)]),
          makeEquipment('cape', [makeStealth(270)]),
          makeEquipment('boots', [makeStealth(40)]),
        ],
        masteryLevel: 99,
        melvorMasteryPoolPercent: 95,
        skillLevel: 120,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      const equipStealth = 75 + 270 + 40;
      const masteryStealth = 99 + 75; // 1/level + 75 at 99
      const poolStealth = 30 + 100; // 10% + 95% checkpoints
      const skillStealth = 120;
      expect(boosts.stealth).toBe(
        equipStealth + masteryStealth + poolStealth + skillStealth,
      );
    });

    it('caps skill level stealth at 120', () => {
      const loadout = makeLoadout({ skillLevel: 150 });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.stealth).toBe(120);
    });
  });

  describe('realm-gated bonuses', () => {
    it('melvor mastery pool bonuses do not apply to abyssal targets', () => {
      const loadout = makeLoadout({
        melvorMasteryPoolPercent: 95,
        skillLevel: 1,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.ABYSSAL,
      );

      // Melvor pool 10% gives +30 stealth, 95% gives +100 — neither should apply
      expect(boosts.stealth).toBe(1); // only skill level
      expect(boosts.xpBonusPercent).toBe(0);
      expect(boosts.currencyBonusPercent).toBe(0);
      expect(boosts.areaUniqueBonusPercent).toBe(0);
    });

    it('abyssal mastery pool bonuses do not apply to melvor targets', () => {
      const loadout = makeLoadout({
        abyssalMasteryPoolPercent: 95,
        skillLevel: 1,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.stealth).toBe(1);
      expect(boosts.intervalReductionMs).toBe(0);
    });

    it('abyssal pool 50% gives stealth and interval to abyssal targets', () => {
      const loadout = makeLoadout({
        abyssalMasteryPoolPercent: 50,
        skillLevel: 1,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.ABYSSAL,
      );

      expect(boosts.stealth).toBe(1 + 40); // skill + abyssal pool 50%
      expect(boosts.intervalReductionMs).toBe(200);
    });

    it('abyssal pool 95% gives full stealth and area unique bonus', () => {
      const loadout = makeLoadout({
        abyssalMasteryPoolPercent: 95,
        skillLevel: 1,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.ABYSSAL,
      );

      expect(boosts.stealth).toBe(1 + 40 + 125); // skill + pool 50% + pool 95%
      expect(boosts.areaUniqueBonusPercent).toBe(200);
    });

    it('realm-scoped equipment modifiers are skipped for wrong realm', () => {
      const loadout = makeLoadout({
        equipment: [
          makeEquipment('ring', [makeStealth(80, ThievingRealmId.ABYSSAL)]),
        ],
        skillLevel: 1,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.stealth).toBe(1); // only skill level, ring skipped
    });

    it('realm-scoped equipment modifiers apply to matching realm', () => {
      const loadout = makeLoadout({
        equipment: [
          makeEquipment('ring', [makeStealth(80, ThievingRealmId.ABYSSAL)]),
        ],
        skillLevel: 1,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.ABYSSAL,
      );

      expect(boosts.stealth).toBe(1 + 80);
    });

    it('unscoped equipment modifiers apply to both realms', () => {
      const loadout = makeLoadout({
        equipment: [makeEquipment('gloves', [makeStealth(75)])],
        skillLevel: 1,
      });
      const melvorBoosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );
      const abyssalBoosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.ABYSSAL,
      );

      expect(melvorBoosts.stealth).toBe(1 + 75);
      expect(abyssalBoosts.stealth).toBe(1 + 75);
    });
  });

  describe('per-NPC mastery level contribution', () => {
    it.each`
      scenario                       | level | expectedStealth | expectedCurrency | expectedInterval
      ${'level 0: no bonuses'}       | ${0}  | ${0}            | ${0}             | ${0}
      ${'level 1: 1 stealth, 1% gp'} | ${1}  | ${1}            | ${1}             | ${0}
      ${'level 49: no interval'}     | ${49} | ${49}           | ${49}            | ${0}
      ${'level 50: interval unlock'} | ${50} | ${50}           | ${50}            | ${200}
      ${'level 98: no 99 bonus yet'} | ${98} | ${98}           | ${98}            | ${200}
      ${'level 99: +75 stealth'}     | ${99} | ${174}          | ${99}            | ${200}
    `(
      '$scenario',
      ({ level, expectedStealth, expectedCurrency, expectedInterval }) => {
        const loadout = makeLoadout({ masteryLevel: level, skillLevel: 0 });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.stealth).toBe(expectedStealth);
        expect(boosts.currencyBonusPercent).toBe(expectedCurrency);
        expect(boosts.intervalReductionMs).toBe(expectedInterval);
      },
    );
  });

  describe('mastery pool checkpoints (Melvor)', () => {
    it.each`
      scenario       | poolPct | expectedStealth | expectedXpBonus | expectedInterval | expectedCurrency | expectedAreaUnique
      ${'below 10%'} | ${9}    | ${0}            | ${0}            | ${0}             | ${0}             | ${0}
      ${'at 10%'}    | ${10}   | ${30}           | ${3}            | ${0}             | ${0}             | ${0}
      ${'at 25%'}    | ${25}   | ${30}           | ${3}            | ${200}           | ${0}             | ${0}
      ${'at 50%'}    | ${50}   | ${30}           | ${3}            | ${200}           | ${100}           | ${0}
      ${'at 95%'}    | ${95}   | ${130}          | ${3}            | ${200}           | ${100}           | ${200}
    `(
      '$scenario',
      ({
        poolPct,
        expectedStealth,
        expectedXpBonus,
        expectedInterval,
        expectedCurrency,
        expectedAreaUnique,
      }) => {
        const loadout = makeLoadout({
          melvorMasteryPoolPercent: poolPct,
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.stealth).toBe(expectedStealth);
        expect(boosts.xpBonusPercent).toBe(expectedXpBonus);
        expect(boosts.intervalReductionMs).toBe(expectedInterval);
        expect(boosts.currencyBonusPercent).toBe(expectedCurrency);
        expect(boosts.areaUniqueBonusPercent).toBe(expectedAreaUnique);
      },
    );
  });

  describe('skillcape interval reduction', () => {
    it('regular skillcape provides -500ms', () => {
      const loadout = makeLoadout({
        equipment: [makeEquipment('cape', [makeInterval(500)])],
        skillLevel: 0,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.intervalReductionMs).toBe(500);
    });

    it('superior skillcape provides -800ms (replaces, not stacks)', () => {
      const loadout = makeLoadout({
        equipment: [makeEquipment('cape', [makeInterval(800)])],
        skillLevel: 0,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.intervalReductionMs).toBe(800);
    });
  });

  describe('potion modifiers', () => {
    it('applies potion stealth modifier', () => {
      const potion: Potion = {
        itemId: 'test:gentle_hands_iv',
        itemName: 'Gentle Hands Potion IV',
        tier: 4,
        modifiers: [makeStealth(75)],
      };
      const loadout = makeLoadout({ activePotion: potion, skillLevel: 0 });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.stealth).toBe(75);
    });

    it('realm-scoped potion modifier skipped for wrong realm', () => {
      const potion: Potion = {
        itemId: 'test:silent_thief_iv',
        itemName: 'Silent Thief Potion IV',
        tier: 4,
        modifiers: [
          makeStealth(100, ThievingRealmId.ABYSSAL),
          {
            boostId: ThievingBoostId.STUN_AVOID_CHANCE,
            value: 10,
            realmId: ThievingRealmId.ABYSSAL,
          },
        ],
      };
      const loadout = makeLoadout({ activePotion: potion, skillLevel: 0 });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.stealth).toBe(0);
      expect(boosts.stunAvoidancePercent).toBe(0);
    });
  });

  describe('agility modifiers', () => {
    it('sums obstacle and pillar modifier contributions', () => {
      const loadout = makeLoadout({
        agilityObstacles: [
          {
            id: 'test:rooftop_run',
            name: 'Rooftop Run',
            slot: 0,
            modifiers: [makeInterval(200)],
          },
        ],
        agilityPillars: [
          {
            id: 'test:pillar',
            name: 'Test Pillar',
            slot: 0,
            modifiers: [makeStealth(50)],
          },
        ],
        skillLevel: 0,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.intervalReductionMs).toBe(200);
      expect(boosts.stealth).toBe(50);
    });
  });

  describe('astrology modifiers', () => {
    it('applies astrology constellation modifiers', () => {
      const loadout = makeLoadout({
        astrologyConstellations: [
          {
            constellationId: 'test:ko',
            constellationName: 'Ko',
            modifiers: [
              {
                boostId: ThievingBoostId.SKILL_INTERVAL,
                value: 5,
              },
            ],
          },
        ],
        skillLevel: 0,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.MELVOR,
      );

      expect(boosts.intervalReductionPercent).toBe(5);
    });
  });

  describe('IGNORE_THIEVING_DAMAGE_CHANCE does not affect stun avoidance', () => {
    it('ignore-damage modifier is not mapped to stunAvoidancePercent', () => {
      const loadout = makeLoadout({
        activeSummoningSynergy: makeSynergy(
          'abyssal_pig',
          'abyssal_leprechaun',
          [
            {
              boostId: ThievingBoostId.IGNORE_THIEVING_DAMAGE_CHANCE,
              value: 20,
            },
          ],
        ),
        skillLevel: 0,
      });
      const boosts = aggregator.aggregateBoosts(
        loadout,
        ThievingRealmId.ABYSSAL,
      );

      expect(boosts.stunAvoidancePercent).toBe(0);
    });
  });

  describe('summoning synergies', () => {
    describe('Leprechaun + Devil (gamble)', () => {
      it('sets currency and item multiplier bonuses for Melvor synergy', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            SynergyFamiliarId.LEPRECHAUN,
            SynergyFamiliarId.DEVIL,
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.currencyMultiplierBonus).toBeCloseTo(0.35, 10);
        expect(boosts.itemMultiplierBonus).toBeCloseTo(0.9, 10);
      });

      it('sets multiplier bonuses for Abyssal synergy', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            SynergyFamiliarId.ABYSSAL_LEPRECHAUN,
            SynergyFamiliarId.ABYSSAL_DEVIL,
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.ABYSSAL,
        );

        expect(boosts.currencyMultiplierBonus).toBeCloseTo(0.35, 10);
        expect(boosts.itemMultiplierBonus).toBeCloseTo(0.9, 10);
      });

      it('detects synergy regardless of familiar order', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            SynergyFamiliarId.DEVIL,
            SynergyFamiliarId.LEPRECHAUN,
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.currencyMultiplierBonus).toBeCloseTo(0.35, 10);
        expect(boosts.itemMultiplierBonus).toBeCloseTo(0.9, 10);
      });

      it('combines Devil gamble with standard modifier contributions', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            SynergyFamiliarId.LEPRECHAUN,
            SynergyFamiliarId.DEVIL,
            [makeStealth(10)],
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.stealth).toBe(10);
        expect(boosts.currencyMultiplierBonus).toBeCloseTo(0.35, 10);
      });
    });

    describe('Leprechaun + Monkey (auto-sell)', () => {
      it('sets auto-sell multiplier for Melvor synergy', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            SynergyFamiliarId.LEPRECHAUN,
            SynergyFamiliarId.MONKEY,
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.autoSellMultiplier).toBe(15);
      });

      it('sets auto-sell multiplier for Abyssal synergy', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            SynergyFamiliarId.ABYSSAL_LEPRECHAUN,
            SynergyFamiliarId.ABYSSAL_MONKEY,
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.ABYSSAL,
        );

        expect(boosts.autoSellMultiplier).toBe(15);
      });

      it('detects synergy regardless of familiar order', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            SynergyFamiliarId.MONKEY,
            SynergyFamiliarId.LEPRECHAUN,
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.autoSellMultiplier).toBe(15);
      });
    });

    describe('modifier-based synergies', () => {
      it('Abyssal Octopus + Leprechaun: stun avoidance via modifier', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            'melvorItA:AbyssalOctopus',
            'melvorItA:AbyssalLeprechaun',
            [
              {
                boostId: ThievingBoostId.STUN_AVOID_CHANCE,
                value: 15,
                realmId: ThievingRealmId.ABYSSAL,
              },
            ],
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.ABYSSAL,
        );

        expect(boosts.stunAvoidancePercent).toBe(15);
      });

      it('Abyssal Octopus synergy skipped for Melvor realm', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            'melvorItA:AbyssalOctopus',
            'melvorItA:AbyssalLeprechaun',
            [
              {
                boostId: ThievingBoostId.STUN_AVOID_CHANCE,
                value: 15,
                realmId: ThievingRealmId.ABYSSAL,
              },
            ],
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.stunAvoidancePercent).toBe(0);
      });

      it('Abyssal Bear + Leprechaun: area unique bonus via modifier', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            'melvorItA:AbyssalBear',
            'melvorItA:AbyssalLeprechaun',
            [
              {
                boostId: ThievingBoostId.AREA_UNIQUE_CHANCE,
                value: 0.001,
                realmId: ThievingRealmId.ABYSSAL,
              },
            ],
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.ABYSSAL,
        );

        expect(boosts.areaUniqueBonus).toBeCloseTo(0.001, 10);
      });
    });

    describe('no synergy active', () => {
      it('produces default multiplier values', () => {
        const loadout = makeLoadout({ skillLevel: 0 });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.currencyMultiplierBonus).toBe(0);
        expect(boosts.itemMultiplierBonus).toBe(0);
        expect(boosts.autoSellMultiplier).toBe(0);
      });
    });

    describe('unknown synergy', () => {
      it('only applies standard modifiers, no special effects', () => {
        const loadout = makeLoadout({
          activeSummoningSynergy: makeSynergy(
            'melvorD:Ent',
            'melvorD:Leprechaun',
            [makeStealth(5)],
          ),
          skillLevel: 0,
        });
        const boosts = aggregator.aggregateBoosts(
          loadout,
          ThievingRealmId.MELVOR,
        );

        expect(boosts.stealth).toBe(5);
        expect(boosts.currencyMultiplierBonus).toBe(0);
        expect(boosts.itemMultiplierBonus).toBe(0);
        expect(boosts.autoSellMultiplier).toBe(0);
      });
    });
  });
});
