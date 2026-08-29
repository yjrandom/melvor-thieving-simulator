import type { Modifier } from '../calc/types';
import { ThievingBoostId, ThievingRealmId } from '../constants/item-ids';
import { formatModifier, formatModifiers } from './modifier-format';

describe('Modifier Format', () => {
  describe('formatModifier', () => {
    it.each`
      scenario                         | boostId                                          | value   | realmId      | expected
      ${'stealth'}                     | ${ThievingBoostId.STEALTH}                       | ${10}   | ${undefined} | ${'+10 Stealth'}
      ${'flat interval (ms to s)'}     | ${ThievingBoostId.FLAT_SKILL_INTERVAL}           | ${200}  | ${undefined} | ${'-0.2s Interval'}
      ${'percent interval'}            | ${ThievingBoostId.SKILL_INTERVAL}                | ${5}    | ${undefined} | ${'-5% Interval'}
      ${'area unique flat'}            | ${ThievingBoostId.AREA_UNIQUE_CHANCE}            | ${3}    | ${undefined} | ${'+3 Area Unique'}
      ${'area unique percent'}         | ${ThievingBoostId.AREA_UNIQUE_CHANCE_PERCENT}    | ${25}   | ${undefined} | ${'+25% Area Unique'}
      ${'stun avoid'}                  | ${ThievingBoostId.STUN_AVOID_CHANCE}             | ${10}   | ${undefined} | ${'+10% Stun Avoid'}
      ${'ignore damage'}               | ${ThievingBoostId.IGNORE_THIEVING_DAMAGE_CHANCE} | ${5}    | ${undefined} | ${'+5% Ignore Damage'}
      ${'stun duration'}               | ${ThievingBoostId.THIEVING_STUN_INTERVAL}        | ${15}   | ${undefined} | ${'-15% Stun Duration'}
      ${'xp bonus'}                    | ${ThievingBoostId.SKILL_XP}                      | ${3}    | ${undefined} | ${'+3% XP'}
      ${'item doubling'}               | ${ThievingBoostId.GLOBAL_ITEM_DOUBLING_CHANCE}   | ${10}   | ${undefined} | ${'+10% Item Doubling'}
      ${'melvor realm scope'}          | ${ThievingBoostId.STEALTH}                       | ${5}    | ${ThievingRealmId.MELVOR}  | ${'+5 Stealth (Melvor)'}
      ${'abyssal realm scope'}         | ${ThievingBoostId.SKILL_XP}                      | ${8}    | ${ThievingRealmId.ABYSSAL} | ${'+8% XP (Abyssal)'}
      ${'flat interval 1000ms'}        | ${ThievingBoostId.FLAT_SKILL_INTERVAL}           | ${1000} | ${undefined} | ${'-1s Interval'}
    `('$scenario', ({ boostId, value, realmId, expected }) => {
      const modifier: Modifier = { boostId, value, realmId };
      expect(formatModifier(modifier)).toBe(expected);
    });

    it('should return empty string for unknown boost ID', () => {
      const modifier: Modifier = {
        boostId: 'melvorD:unknownModifier' as ThievingBoostId,
        value: 10,
      };
      expect(formatModifier(modifier)).toBe('');
    });
  });

  describe('formatModifiers', () => {
    it('should join multiple modifiers with commas', () => {
      const modifiers: Modifier[] = [
        { boostId: ThievingBoostId.STEALTH, value: 10 },
        { boostId: ThievingBoostId.SKILL_XP, value: 5 },
      ];
      expect(formatModifiers(modifiers)).toBe('+10 Stealth, +5% XP');
    });

    it('should return empty string for empty array', () => {
      expect(formatModifiers([])).toBe('');
    });

    it('should filter out unknown modifiers', () => {
      const modifiers: Modifier[] = [
        { boostId: ThievingBoostId.STEALTH, value: 10 },
        { boostId: 'melvorD:unknown' as ThievingBoostId, value: 5 },
      ];
      expect(formatModifiers(modifiers)).toBe('+10 Stealth');
    });
  });
});
