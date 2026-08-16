export enum TargetName {
  MAN = 'Man',
  WOMAN = 'Woman',
}

export interface ThievingTarget {
  name: TargetName;
  baseXp: number;
  maxHit: number;
  perception: number;
  gp: NumberRange;
  uniqueDrop?: LootItem;
}

export interface ThievingBoosts {
  stealth: number;
  sleightOfHand: number;
  xpPercent: number;
  intervalPercent: number;
  flatIntervalMs: number;
  stunAvoidancePercent: number;
  stunIntervalPercent: number;
}

export interface ThievingResult {
  successRate: number;
  actionIntervalMs: number;
  stunIntervalMs: number;
  xpPerAction: number;
  effectiveXpPerHour: number;
}

export interface ThievingArea {
  name: string;
  levelRequirement: number;
  targets: ThievingTarget[];
  areaDrops: LootItem[];
}

export enum LootItemName {
  COIN_PURSE = "Coin Purse",
}


export interface LootItem {
  name: string;
  dropQuantity: NumberRange;
  dropChance?: number;
}

export interface NumberRange {
  min: number;
  max: number;
}
