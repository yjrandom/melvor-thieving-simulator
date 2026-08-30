/**
 * Extracted from game typedef.
 *
 * See {@linkcode CurrencyIds} in `idEnums.d.ts`
 */
export enum ThievingCurrencyId {
  GP = 'melvorD:GP',
  AP = 'melvorD:AP',
}

export const THIEVING_SKILL_ID = 'melvorD:Thieving';

export enum ThievingRealmId {
  MELVOR = 'melvorD:Melvor',
  ABYSSAL = 'melvorItA:Abyssal',
}

/**
 * Extracted from game typedef.
 *
 * See {@linkcode EquipmentSlotId} in `idEnums.d.ts`
 */
export enum ThievingEquipmentSlotId {
  HELMET = 'melvorD:Helmet',
  PLATEBODY = 'melvorD:Platebody',
  PLATELEGS = 'melvorD:Platelegs',
  BOOTS = 'melvorD:Boots',
  WEAPON = 'melvorD:Weapon',
  SHIELD = 'melvorD:Shield',
  AMULET = 'melvorD:Amulet',
  RING = 'melvorD:Ring',
  GLOVES = 'melvorD:Gloves',
  QUIVER = 'melvorD:Quiver',
  CAPE = 'melvorD:Cape',
  PASSIVE = 'melvorD:Passive',
  SUMMON1 = 'melvorD:Summon1',
  SUMMON2 = 'melvorD:Summon2',
  CONSUMABLE = 'melvorD:Consumable',
  GEM = 'melvorD:Gem',
  ENHANCEMENT1 = 'melvorD:Enhancement1',
  ENHANCEMENT2 = 'melvorD:Enhancement2',
  ENHANCEMENT3 = 'melvorD:Enhancement3',
}

/**
 * Summoning familiar product IDs for synergies requiring special aggregator logic.
 * IDs are game item references — must be verified at runtime (Phase 5.2).
 */
export enum SynergyFamiliarId {
  LEPRECHAUN = 'melvorD:Leprechaun',
  DEVIL = 'melvorD:Devil',
  MONKEY = 'melvorD:Monkey',
  ABYSSAL_LEPRECHAUN = 'melvorItA:AbyssalLeprechaun',
  ABYSSAL_DEVIL = 'melvorItA:AbyssalDevil',
  ABYSSAL_MONKEY = 'melvorItA:AbyssalMonkey',
}

export enum ThievingBoostId {
  STEALTH = 'melvorD:thievingStealth',
  FLAT_SKILL_INTERVAL = 'melvorD:flatSkillInterval',
  SKILL_INTERVAL = 'melvorD:skillInterval',
  AREA_UNIQUE_CHANCE = 'melvorD:thievingAreaUniqueChance',
  AREA_UNIQUE_CHANCE_PERCENT = 'melvorD:thievingAreaUniqueChancePercent',
  STUN_AVOID_CHANCE = 'melvorD:stunAvoidChance',
  IGNORE_THIEVING_DAMAGE_CHANCE = 'melvorD:ignoreThievingDamageChance',
  THIEVING_STUN_INTERVAL = 'melvorD:thievingStunInterval',
  SKILL_XP = 'melvorD:skillXP',
  GLOBAL_ITEM_DOUBLING_CHANCE = 'melvorD:globalItemDoublingChance',
}