import { LootItemName, type LootItem } from "../calc/types";

export const GENERIC_LOOT_ITEMS: Record<LootItemName, LootItem> = {
  [LootItemName.COIN_PURSE]: {
    name: LootItemName.COIN_PURSE,
    dropQuantity: { min: 1, max: 1 }
  }
};

export const AREA_UNIQUE_LOOT_ITEMS: Record<LootItemName, LootItem> = {
  [LootItemName.COIN_PURSE]: {
    name: LootItemName.COIN_PURSE,
    dropQuantity: { min: 1, max: 1 }
  }
};

export const TARGET_UNIQUE_LOOT_ITEMS: Record<LootItemName, LootItem> = {
  [LootItemName.COIN_PURSE]: {
    name: LootItemName.COIN_PURSE,
    dropQuantity: { min: 1, max: 1 }
  }
};