import type { ThievingBoostId, ThievingRealmId } from '../constants/item-ids';

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
  'id' | 'name' | 'perception' | 'maxHit' | 'baseExperience' | 'level'
>;

export interface ThievingTarget extends NpcCalcFields {
  // Derived from npc.area.realm — game Realm is a class, we use a string discriminant
  realmId: ThievingRealmId;
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

/** A game modifier value resolved to plain data, decoupled from game object references. */
export interface Modifier {
  /** Modifier.id, e.g. "melvorD:thievingStealth", specific to thieving. */
  boostId: ThievingBoostId;
  /** Signed numeric value — positive means increase */
  value: number;
  /** Realm scope ID, if the modifier is realm-gated */
  realmId?: string;
}

export interface EquippedItemEntry {
  slotId: string;
  itemId: string;
  itemName: string;
  modifiers: Modifier[];
}

export interface Potion {
  itemId: string;
  itemName: string;
  tier: number;
  modifiers: Modifier[];
}

export interface Prayer {
  id: string;
  name: string;
}

export interface AgilityObstacle {
  id: string;
  name: string;
  slot: number;
  modifiers: Modifier[];
}

export interface AgilityPillar {
  id: string;
  name: string;
  slot: number;
  modifiers: Modifier[];
}

export interface AstrologyConstellation {
  constellationId: string;
  constellationName: string;
  /** Resolved modifier values at max-level; scale by timesBought / maxCount */
  modifiers: Modifier[];
}

export interface PetInfo {
  id: string;
  name: string;
}

export interface ShopPurchase {
  id: string;
  name: string;
  count: number;
}

export interface SummoningSynergyInfo {
  summon1Id: string;
  summon2Id: string;
  description: string;
  modifiers: Modifier[];
}

export interface ThievingLoadout {
  equipment: EquippedItemEntry[];
  /** Thieving mastery level */
  masteryLevel: number;
  melvorMasteryPoolPercent: number;
  abyssalMasteryPoolPercent: number;
  activePotion: Potion | undefined;
  activePrayers: [Prayer] | [Prayer, Prayer] | undefined;
  agilityObstacles: AgilityObstacle[];
  agilityPillars: AgilityPillar[];
  astrologyConstellations: AstrologyConstellation[];
  activePets: PetInfo[];
  shopPurchases: ShopPurchase[];
  activeSummoningSynergy: SummoningSynergyInfo | undefined;
  skillLevel: number;
  abyssalSkillLevel: number;
}

export interface ThievingBoosts {
  /** Thieving stealth stat */
  stealth: number;

  /** Flat reduction in skill interval in milliseconds */
  intervalReductionMs: number;

  /** Percentage reduction in skill interval */
  intervalReductionPercent: number;

  /** Percentage bonus to XP gained */
  xpBonusPercent: number;

  /** Percentage bonus to currency gained */
  currencyBonusPercent: number;

  /** Percentage chance to double dropped items */
  additionalDoubleItemPercent: number;

  /** Percentage chance to avoid being stunned */
  stunAvoidancePercent: number;

  /** Percentage reduction in stun duration */
  stunDurationReductionPercent: number;

  /** Flat bonus to area unique chance */
  areaUniqueBonus: number;

  /** Percentage bonus to area unique chance */
  areaUniqueBonusPercent: number;

  /** Additive bonus to currency multiplier. Applied as (1 + value) in calc engine. Default 0 means no change. */
  currencyMultiplierBonus: number;

  /** Additive bonus to item quantity multiplier. Applied as (1 + value) in calc engine. Default 0 means no change. */
  itemMultiplierBonus: number;

  /** Auto-sell price multiplier (0 = disabled). When active, common drops are sold at this factor times base price. */
  autoSellMultiplier: number;
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
