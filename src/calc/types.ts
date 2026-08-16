export interface NumberRange {
  min: number;
  max: number;
}

export interface LootItem {
  name: string;
  dropQuantity: NumberRange;
  dropChance?: number;
}

// Primitive fields picked from the game's ThievingNPC (inherits from BasicSkillRecipe).
// A live ThievingNPC instance satisfies this structurally at runtime.
type NpcCalcFields = Pick<
  ThievingNPC,
  'name' | 'perception' | 'maxHit' | 'baseExperience' | 'level'
>;

export interface ThievingTarget extends NpcCalcFields {
  // Derived from npc.area.realm — game Realm is a class, we use a string discriminant
  realm: 'melvor' | 'abyssal';
  // Derived from npc.area.name
  area: string;
  // Computed from npc.currencyDrops + modifiers (game stores max only)
  currencyRange: NumberRange;
  currencyType: 'gp' | 'ap';
  uniqueDrop?: LootItem;
}

export enum RealmName {
  MELVOR = 'melvor',
  ABYSSAL = 'abyssal',
}

export interface ThievingArea {
  name: string;
  realm: RealmName;
  levelRequirement: number;
  targets: string[];
  areaUniqueDrops: LootItem[];
}

export interface EquippedItemEntry {
  slotId: string;
  itemId: string;
  itemName: string;
}

export interface ActivePotionInfo {
  itemId: string;
  itemName: string;
  tier: number;
}

export interface ActivePrayerInfo {
  id: string;
  name: string;
}

export interface AgilityObstacleInfo {
  id: string;
  name: string;
  slot: number;
}

export interface AgilityPillarInfo {
  id: string;
  name: string;
  slot: number;
}

export interface AstrologyModifierInfo {
  constellationId: string;
  constellationName: string;
  modifierType: 'standard' | 'unique' | 'abyssal';
  index: number;
  timesBought: number;
  maxCount: number;
}

export interface PetInfo {
  id: string;
  name: string;
}

export interface ShopPurchaseInfo {
  id: string;
  name: string;
  count: number;
}

export interface SummoningSynergyInfo {
  summon1Id: string;
  summon2Id: string;
  description: string;
}

export interface ThievingLoadout {
  equipment: EquippedItemEntry[];
  masteryLevels: Map<string, number>;
  melvorMasteryPoolPercent: number;
  abyssalMasteryPoolPercent: number;
  activePotion: ActivePotionInfo | undefined;
  activePrayers: ActivePrayerInfo[];
  agilityObstacles: AgilityObstacleInfo[];
  agilityPillars: AgilityPillarInfo[];
  astrologyModifiers: AstrologyModifierInfo[];
  activePets: PetInfo[];
  shopPurchases: ShopPurchaseInfo[];
  activeSynergy: SummoningSynergyInfo | undefined;
  skillLevel: number;
  abyssalSkillLevel: number;
}

export interface ThievingBoosts {
  stealth: number;
  flatIntervalReductionMs: number;
  percentIntervalReduction: number;
  percentXpBonus: number;
  percentCurrencyBonus: number;
  additionalDoublePercent: number;
  stunAvoidancePercent: number;
  percentStunDurationReduction: number;
  percentAreaUniqueBonus: number;
  flatAreaUniqueBonus: number;
}

export interface ThievingResult {
  successRate: number;
  effectiveIntervalMs: number;
  effectiveStunDurationMs: number;
  doubleChance: number;
  npcUniqueChance: number;
  xpPerAction: number;
  actionsPerHour: number;
  successfulActionsPerHour: number;
  xpPerHour: number;
  currencyPerHour: number;
}

/**
 * Extracted from game typedef.
 *
 * See {@linkcode CurrencyIds} in `idEnums.d.ts`
 */
export enum ThievingCurrencyId {
  GP = 'melvorD:GP',
  AP = 'melvorD:AP',
}

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
