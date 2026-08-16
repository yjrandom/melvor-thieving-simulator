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

export interface ThievingArea {
  name: string;
  realm: 'melvor' | 'abyssal';
  levelRequirement: number;
  targets: string[];
  areaUniqueDrops: LootItem[];
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
