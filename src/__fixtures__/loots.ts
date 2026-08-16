import type { LootItem } from '../calc/types';

export const GENERIC_RARE_DROPS: LootItem[] = [
  { name: "Bobby's Pocket", dropChance: 1 / 120, dropQuantity: { min: 1, max: 1 } },
  { name: 'Chapeau Noir', dropChance: 1 / 20_000, dropQuantity: { min: 1, max: 1 } },
  { name: 'Sneak-Ers', dropChance: 1 / 15_000, dropQuantity: { min: 1, max: 1 } },
  { name: 'Thieving Shorts', dropChance: 1 / 15_000, dropQuantity: { min: 1, max: 1 } },
];
