import { DEFAULT_BOOSTS } from '../constants/game.constants';
import {
  SynergyFamiliarId,
  ThievingBoostId,
  ThievingRealmId,
} from '../constants/item-ids';
import type {
  AgilityObstacle,
  AgilityPillar,
  AstrologyConstellation,
  EquippedItemEntry,
  Modifier,
  Potion,
  SummoningSynergyInfo,
  ThievingBoosts,
  ThievingLoadout,
} from './types';

const DEVIL_GAMBLE_CURRENCY_BONUS = 0.35;
const DEVIL_GAMBLE_ITEM_BONUS = 0.9;
const AUTO_SELL_PRICE_MULTIPLIER = 15;

/**
 * Aggregates all applicable thieving boosts from a player loadout and target NPC.
 */
export class Aggregator {
  private readonly MASTERY_STEALTH_PER_LEVEL = 1;
  private readonly MASTERY_LEVEL_99_STEALTH_BONUS = 75;
  private readonly MASTERY_LEVEL_50_INTERVAL_REDUCTION_MS = 200;
  private readonly MASTERY_CURRENCY_BONUS_PER_LEVEL = 1;
  private readonly MAX_SKILL_LEVEL_STEALTH = 120;

  /**
   * Maps game modifier IDs to ThievingBoosts fields.
   *
   * Key IDs are derived from PlayerModifierTable property names in the
   * game type definitions. Must be verified at runtime (Phase 5.2).
   */
  private readonly MODIFIER_BOOST_MAP: Readonly<
    Partial<Record<ThievingBoostId, keyof ThievingBoosts>>
  > = {
    [ThievingBoostId.STEALTH]: 'stealth',
    [ThievingBoostId.FLAT_SKILL_INTERVAL]: 'intervalReductionMs',
    [ThievingBoostId.SKILL_INTERVAL]: 'intervalReductionPercent',
    [ThievingBoostId.AREA_UNIQUE_CHANCE]: 'areaUniqueBonus',
    [ThievingBoostId.AREA_UNIQUE_CHANCE_PERCENT]: 'areaUniqueBonusPercent',
    [ThievingBoostId.STUN_AVOID_CHANCE]: 'stunAvoidancePercent',
    [ThievingBoostId.THIEVING_STUN_INTERVAL]: 'stunDurationReductionPercent',
    [ThievingBoostId.SKILL_XP]: 'xpBonusPercent',
    [ThievingBoostId.GLOBAL_ITEM_DOUBLING_CHANCE]:
      'additionalDoubleItemPercent',
  };

  /**
   * Converts a player loadout and target NPC into flat boost values for the calc engine.
   *
   * Sums modifier contributions from equipment, potions, agility obstacles, astrology,
   * and summoning synergies using game-provided modifier values.
   *
   * Mastery, mastery pool checkpoints, and skill level bonuses are applied as game-rule logic.
   * Realm-specific bonuses are gated by modifier scope.
   *
   * @param {ThievingLoadout} loadout Complete player loadout — equipment, mastery, potions, etc.
   * @param {ThievingRealmId} targetNpcRealmId ID of the realm to which the target NPC belongs.
   * @returns {ThievingBoosts} Flat boost values ready for the calc engine.
   */
  aggregateBoosts(
    loadout: ThievingLoadout,
    targetNpcRealmId: ThievingRealmId,
  ): ThievingBoosts {
    return this.mergeBoosts(
      DEFAULT_BOOSTS,
      this.getEquipmentBoosts(loadout.equipment, targetNpcRealmId),
      this.getNpcMasteryBoosts(loadout.masteryLevel),
      this.getMasteryPoolBoosts(loadout.melvorMasteryPoolPercent, loadout.abyssalMasteryPoolPercent, targetNpcRealmId),
      this.getSkillLevelBoosts(loadout.skillLevel),
      this.getPotionBoosts(loadout.activePotion, targetNpcRealmId),
      this.getAgilityBoosts(
        loadout.agilityObstacles,
        loadout.agilityPillars,
        targetNpcRealmId,
      ),
      this.getAstrologyBoosts(
        loadout.astrologyConstellations,
        targetNpcRealmId,
      ),
      this.getSummoningSynergyBoosts(
        loadout.activeSummoningSynergy,
        targetNpcRealmId,
      ),
    );
  }

  /**
   * Sums partial boost contributions onto a base, producing a new {@link ThievingBoosts}.
   *
   * @param {ThievingBoosts} base Starting boost values (typically {@link DEFAULT_BOOSTS}).
   * @param {Partial<ThievingBoosts>[]} partials Partial contributions to sum onto the base.
   * @returns {ThievingBoosts} New object with all contributions summed.
   * @throw Error If any partial contains an undefined value for a boost field.
   */
  private mergeBoosts(
    base: ThievingBoosts,
    ...partials: Partial<ThievingBoosts>[]
  ): ThievingBoosts {
    const result = { ...base };
    for (const partial of partials) {
      for (const key of Object.keys(partial) as (keyof ThievingBoosts)[]) {
        const value = partial[key];
        // Type check; unreachable since key is derived from partial
        if (value === undefined) {
          throw new Error(`Unreachable: Partial boost field ${key} is undefined`);
        }

        result[key] += value;
      }
    }
    return result;
  }

  /**
   * Collects modifier contributions from all equipped items.
   *
   * @param {EquippedItemEntry[]} equipments List of equipped item entries.
   * @param {string} targetRealmId Realm ID of the target NPC for scope filtering.
   * @returns {Partial<ThievingBoosts>} Summed equipment modifier contributions.
   */
  private getEquipmentBoosts(
    equipments: EquippedItemEntry[],
    targetRealmId: string,
  ): Partial<ThievingBoosts> {
    return this.mergePartials(
      ...equipments.map((entry) =>
        this.resolveModifiers(entry.modifiers, targetRealmId),
      ),
    );
  }

  /**
   * Computes per-NPC mastery stealth, interval reduction, and currency bonuses.
   *
   * @param {number} masteryLevel The player's thieving mastery level for the target NPC.
   * @returns {Partial<ThievingBoosts>} Mastery-derived boost contributions.
   */
  private getNpcMasteryBoosts(masteryLevel: number): Partial<ThievingBoosts> {
    const partial: Partial<ThievingBoosts> = {
      stealth: masteryLevel * this.MASTERY_STEALTH_PER_LEVEL,
      currencyBonusPercent:
        masteryLevel * this.MASTERY_CURRENCY_BONUS_PER_LEVEL,
    };

    if (masteryLevel >= 50) {
      partial.intervalReductionMs = this.MASTERY_LEVEL_50_INTERVAL_REDUCTION_MS;
    }

    if (masteryLevel >= 99) {
      partial.stealth! += this.MASTERY_LEVEL_99_STEALTH_BONUS;
    }

    return partial;
  }

  /**
   * Computes mastery pool checkpoint bonuses gated by target realm.
   *
   * @param {number} melvorMasteryPoolPercent Melvor mastery pool percentage.
   * @param {number} abyssalMasteryPoolPercent Abyssal mastery pool percentage.
   * @param {ThievingRealmId} realmId Realm ID of the target NPC for scope filtering.
   * @returns {Partial<ThievingBoosts>} Mastery pool checkpoint contributions.
   */
  private getMasteryPoolBoosts(
    melvorMasteryPoolPercent: number,
    abyssalMasteryPoolPercent: number,
    realmId: ThievingRealmId,
  ): Partial<ThievingBoosts> {
    const partial: Partial<ThievingBoosts> = {};

    if (realmId === ThievingRealmId.MELVOR) {
      if (melvorMasteryPoolPercent >= 10) {
        partial.stealth = 30;
        partial.xpBonusPercent = 3;
      }
      if (melvorMasteryPoolPercent >= 25) partial.intervalReductionMs = 200;
      if (melvorMasteryPoolPercent >= 50) partial.currencyBonusPercent = 100;
      if (melvorMasteryPoolPercent >= 95) {
        partial.stealth = (partial.stealth ?? 0) + 100;
        partial.areaUniqueBonusPercent = 200;
      }
    } else {
      if (abyssalMasteryPoolPercent >= 50) {
        partial.intervalReductionMs = 200;
        partial.stealth = 40;
      }
      if (abyssalMasteryPoolPercent >= 95) {
        partial.stealth = (partial.stealth ?? 0) + 125;
        partial.areaUniqueBonusPercent = 200;
      }
    }

    return partial;
  }

  /**
   * Computes thieving skill level as stealth (1 per level, capped at {@link MAX_SKILL_LEVEL_STEALTH}).
   *
   * @param {number} skillLevel The player's thieving skill level.
   * @returns {Partial<ThievingBoosts>} Skill-level-derived stealth contribution.
   */
  private getSkillLevelBoosts(skillLevel: number): Partial<ThievingBoosts> {
    return {
      stealth: Math.min(skillLevel, this.MAX_SKILL_LEVEL_STEALTH),
    };
  }

  /**
   * Collects active potion modifier contributions.
   *
   * @param {Potion | undefined} potion The active potion info, or undefined if no potion is active.
   * @param {string} targetRealmId Realm ID of the target NPC for scope filtering.
   * @returns {Partial<ThievingBoosts>} Potion modifier contributions, or empty if no potion active.
   */
  private getPotionBoosts(
    potion: Potion | undefined,
    targetRealmId: string,
  ): Partial<ThievingBoosts> {
    if (!potion) {
      return {};
    }

    return this.resolveModifiers(potion.modifiers, targetRealmId);
  }

  /**
   * Collects agility obstacle and pillar modifier contributions.
   *
   * @param {AgilityObstacle[]} agilityObstacles List of active agility obstacles.
   * @param {AgilityPillar[]} agilityPillars List of active agility pillars.
   * @param {string} targetRealmId Realm ID of the target NPC for scope filtering.
   * @returns {Partial<ThievingBoosts>} Combined obstacle and pillar modifier contributions.
   */
  private getAgilityBoosts(
    agilityObstacles: AgilityObstacle[],
    agilityPillars: AgilityPillar[],
    targetRealmId: string,
  ): Partial<ThievingBoosts> {
    return this.mergePartials(
      ...agilityObstacles.map((o) =>
        this.resolveModifiers(o.modifiers, targetRealmId),
      ),
      ...agilityPillars.map((p) =>
        this.resolveModifiers(p.modifiers, targetRealmId),
      ),
    );
  }

  /**
   * Computes astrology modifier contributions, scaled by stars purchased.
   *
   * Each astrology modifier carries its max-level values; the effective
   * contribution scales linearly with `timesBought / maxCount`.
   *
   * @param {AstrologyConstellation[]} constellations List of active astrology modifiers.
   * @param {string} targetRealmId Realm ID of the target NPC for scope filtering.
   * @returns {Partial<ThievingBoosts>} Scaled astrology modifier contributions.
   */
  private getAstrologyBoosts(
    constellations: AstrologyConstellation[],
    targetRealmId: string,
  ): Partial<ThievingBoosts> {
    return this.mergePartials(
      ...constellations.map((entry) =>
        this.resolveModifiers(entry.modifiers, targetRealmId),
      ),
    );
  }

  /**
   * Collects summoning synergy modifier contributions and special synergy effects.
   *
   * Standard modifiers are resolved through {@link resolveModifiers}. Complex synergies
   * (Devil gamble, auto-sell) are detected by familiar IDs and expressed as expected-value
   * multipliers on dedicated {@link ThievingBoosts} fields.
   *
   * @param {SummoningSynergyInfo | undefined} activeSynergy Active synergy info, or undefined if no synergy is active.
   * @param {string} targetRealmId Realm ID of the target NPC for scope filtering.
   * @returns {Partial<ThievingBoosts>} Synergy modifier contributions, or empty if no synergy active.
   */
  private getSummoningSynergyBoosts(
    activeSynergy: SummoningSynergyInfo | undefined,
    targetRealmId: string,
  ): Partial<ThievingBoosts> {
    if (!activeSynergy) {
      return {};
    }

    return this.mergePartials(
      this.resolveModifiers(activeSynergy.modifiers, targetRealmId),
      this.resolveSpecialSynergy(activeSynergy),
    );
  }

  /**
   * Detects complex synergies that cannot be expressed as standard modifiers
   * and returns their expected-value boost contributions.
   */
  private resolveSpecialSynergy(
    synergy: SummoningSynergyInfo,
  ): Partial<ThievingBoosts> {
    if (this.isDevilGambleSynergy(synergy)) {
      return {
        currencyMultiplierBonus: DEVIL_GAMBLE_CURRENCY_BONUS,
        itemMultiplierBonus: DEVIL_GAMBLE_ITEM_BONUS,
      };
    }
    if (this.isAutoSellSynergy(synergy)) {
      return {
        autoSellMultiplier: AUTO_SELL_PRICE_MULTIPLIER,
      };
    }
    return {};
  }

  private isDevilGambleSynergy(synergy: SummoningSynergyInfo): boolean {
    return (
      this.hasFamiliars(synergy, SynergyFamiliarId.LEPRECHAUN, SynergyFamiliarId.DEVIL) ||
      this.hasFamiliars(synergy, SynergyFamiliarId.ABYSSAL_LEPRECHAUN, SynergyFamiliarId.ABYSSAL_DEVIL)
    );
  }

  private isAutoSellSynergy(synergy: SummoningSynergyInfo): boolean {
    return (
      this.hasFamiliars(synergy, SynergyFamiliarId.LEPRECHAUN, SynergyFamiliarId.MONKEY) ||
      this.hasFamiliars(synergy, SynergyFamiliarId.ABYSSAL_LEPRECHAUN, SynergyFamiliarId.ABYSSAL_MONKEY)
    );
  }

  private hasFamiliars(synergy: SummoningSynergyInfo, id1: string, id2: string): boolean {
    return (
      (synergy.summon1Id === id1 && synergy.summon2Id === id2) ||
      (synergy.summon1Id === id2 && synergy.summon2Id === id1)
    );
  }

  // ===========================================================================
  // #region Utilities
  // ===========================================================================

  /**
   * Sums multiple partial boost objects into a single partial.
   *
   * @param {Partial<ThievingBoosts>[]} partials Partial contributions to combine.
   * @returns {Partial<ThievingBoosts>} Combined partial with all values summed.
   */
  private mergePartials(
    ...partials: Partial<ThievingBoosts>[]
  ): Partial<ThievingBoosts> {
    const result: Partial<ThievingBoosts> = {};
    for (const partial of partials) {
      for (const key of Object.keys(partial) as (keyof ThievingBoosts)[]) {
        result[key] = (result[key] ?? 0) + partial[key]!;
      }
    }
    return result;
  }

  /**
   * Resolves modifier values into boost field contributions, respecting realm scope.
   *
   * For each modifier, if it has a realm scope that doesn't match the
   * target's realm, it is skipped. Otherwise, the value is mapped to the
   * corresponding {@link ThievingBoosts} field.
   *
   * @param {Modifier[]} modifiers Modifiers to resolve.
   * @param {string} targetRealmId Realm ID of the target NPC for scope filtering.
   * @returns {Partial<ThievingBoosts>} Boost field contributions from the modifiers.
   */
  private resolveModifiers(
    modifiers: Modifier[],
    targetRealmId: string,
  ): Partial<ThievingBoosts> {
    const partial: Partial<ThievingBoosts> = {};
    for (const mod of modifiers) {
      if (mod.realmId && mod.realmId !== targetRealmId) continue;
      const field = this.MODIFIER_BOOST_MAP[mod.boostId];
      if (field !== undefined) {
        partial[field] = (partial[field] ?? 0) + mod.value;
      }
    }
    return partial;
  }
  // #endregion
}
