import { LootItemName, TargetName } from '../calc/types';
import type { ThievingTarget } from '../calc/types';
import { TARGET_UNIQUE_LOOT_ITEMS } from './loots';

export const TARGETS: Record<TargetName, ThievingTarget> = {
  [TargetName.MAN]: {
    name: TargetName.MAN,
    baseXp: 5,
    maxHit: 22,
    perception: 110,
    gp: { min: 1, max: 100 },
  },
  [TargetName.WOMAN]: {
    name: TargetName.WOMAN,
    baseXp: 7,
    maxHit: 32,
    perception: 140,
    gp: { min: 1, max: 150 },
    uniqueDrop: TARGET_UNIQUE_LOOT_ITEMS[LootItemName.COIN_PURSE],
  },
};
