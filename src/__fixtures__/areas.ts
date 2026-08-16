import type { ThievingArea } from '../calc/types';
import { AREA_UNIQUE_BASE_CHANCE } from '../calc/constants';

const BASE = AREA_UNIQUE_BASE_CHANCE;

export const MELVOR_AREAS: ThievingArea[] = [
  {
    name: 'Low Town', realm: 'melvor', levelRequirement: 1,
    targets: ['Man', 'Woman'],
    areaUniqueDrops: [
      { name: 'Jeweled Necklace', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Golbin Village', realm: 'melvor', levelRequirement: 8,
    targets: ['Golbin', 'Golbin Chief'],
    areaUniqueDrops: [
      { name: 'Crate of Basic Supplies', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Bandit Hideout', realm: 'melvor', levelRequirement: 12,
    targets: ['Bandit Thug', 'Marauder'],
    areaUniqueDrops: [
      { name: "Thiever's Cape", dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: "Marksman's Sigil", dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Banquet', realm: 'melvor', levelRequirement: 26,
    targets: ['Assistant Cook', 'Chef'],
    areaUniqueDrops: [
      { name: 'Bag of Flour', dropChance: BASE, dropQuantity: { min: 200, max: 200 } },
      { name: 'Cooking Apron', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: "Farmer's Market", realm: 'melvor', levelRequirement: 31,
    targets: ['Merchant', 'Bob the Farmer'],
    areaUniqueDrops: [
      { name: 'Crate of Food', dropChance: BASE, dropQuantity: { min: 10, max: 10 } },
      { name: 'Basic Bag', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Apple Tree Seeds', dropChance: BASE, dropQuantity: { min: 3, max: 3 } },
    ],
  },
  {
    name: 'Port of Lemvor', realm: 'melvor', levelRequirement: 45,
    targets: ['Dock Hand', 'Fisherman'],
    areaUniqueDrops: [
      { name: 'Shipwheel', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Treasure Chest', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Fishing Hook', dropChance: BASE, dropQuantity: { min: 1000, max: 1000 } },
    ],
  },
  {
    name: 'Cave of Giants', realm: 'melvor', levelRequirement: 49,
    targets: ['Troll', 'Cyclops'],
    areaUniqueDrops: [
      { name: 'Giant Club', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Stack of Bones', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Eyeball', dropChance: BASE, dropQuantity: { min: 100, max: 100 } },
    ],
  },
  {
    name: 'Outskirts', realm: 'melvor', levelRequirement: 61,
    targets: ['Lumberjack', 'Miner'],
    areaUniqueDrops: [
      { name: 'Pile of Logs', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Pile of Ores', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Fort', realm: 'melvor', levelRequirement: 66,
    targets: ['Squire', 'Knight'],
    areaUniqueDrops: [
      { name: "Knight's Sigil", dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: "Knight's Cape", dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Whetstone', dropChance: BASE, dropQuantity: { min: 1000, max: 1000 } },
    ],
  },
  {
    name: 'Wizard Tower', realm: 'melvor', levelRequirement: 75,
    targets: ['Acolyte', 'Wizard'],
    areaUniqueDrops: [
      { name: "Wizard's Scroll", dropChance: BASE, dropQuantity: { min: 1000, max: 1000 } },
      { name: "Wizard's Sigil", dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Prayer Scroll', dropChance: BASE, dropQuantity: { min: 1000, max: 1000 } },
    ],
  },
  {
    name: 'Royal Castle', realm: 'melvor', levelRequirement: 79,
    targets: ['Court Jester', 'Princess', 'King'],
    areaUniqueDrops: [
      { name: 'Ring of Wealth', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Chest of Gems', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Antique Vase', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
];

export const TOTH_AREAS: ThievingArea[] = [
  {
    name: 'Lost Ruins', realm: 'melvor', levelRequirement: 100,
    targets: ['Explorer', 'Adventurer', 'Treasure Hunter'],
    areaUniqueDrops: [
      { name: "Explorer's Map", dropChance: BASE, dropQuantity: { min: 500, max: 500 } },
      { name: 'Golden Chest', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Undead Palace', realm: 'melvor', levelRequirement: 102,
    targets: ['Necromancer', 'Dark Knight'],
    areaUniqueDrops: [
      { name: 'Large Urn', dropChance: BASE, dropQuantity: { min: 10, max: 10 } },
    ],
  },
  {
    name: 'Desert', realm: 'melvor', levelRequirement: 104,
    targets: ['Pilgrim', 'Travelling Merchant'],
    areaUniqueDrops: [
      { name: 'Portable Rations', dropChance: BASE, dropQuantity: { min: 500, max: 500 } },
      { name: 'Crate of Lost Supplies', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Mushroom Forest', realm: 'melvor', levelRequirement: 110,
    targets: ['Sage', 'Madremonte'],
    areaUniqueDrops: [
      { name: 'Mushrooms', dropChance: BASE, dropQuantity: { min: 10, max: 10 } },
      { name: 'Mortar and Pestle', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Exotic Herb Sack', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Twilight', realm: 'melvor', levelRequirement: 114,
    targets: ['Vampire', 'Vampire Lord'],
    areaUniqueDrops: [
      { name: 'Blood Vial', dropChance: BASE, dropQuantity: { min: 500, max: 500 } },
      { name: 'Masquerade Mask', dropChance: BASE, dropQuantity: { min: 500, max: 500 } },
    ],
  },
];

export const ABYSSAL_AREAS: ThievingArea[] = [
  {
    name: 'Crimson Village', realm: 'abyssal', levelRequirement: 1,
    targets: ['Turned Man', 'Turned Woman', 'Turned Farmer'],
    areaUniqueDrops: [
      { name: 'Crimson Lantern Stick', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Blighted Reach', realm: 'abyssal', levelRequirement: 8,
    targets: ['Blighted Dryad', 'Blighted Treant'],
    areaUniqueDrops: [
      { name: 'Toxic Spores', dropChance: BASE, dropQuantity: { min: 5, max: 5 } },
      { name: 'Blighted Heart Amulet', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Shadeveil Maze', realm: 'abyssal', levelRequirement: 16,
    targets: ['Dark Shade', 'Dark Wraithlurker', 'Dark Shadowmancer'],
    areaUniqueDrops: [
      { name: 'Shade Essence', dropChance: BASE, dropQuantity: { min: 5, max: 5 } },
      { name: 'Locked Maze Chest', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Withering Ruins', realm: 'abyssal', levelRequirement: 27,
    targets: ['Withering Gargoyle', 'Withering Golem'],
    areaUniqueDrops: [
      { name: 'Witherlyme Seeds', dropChance: BASE, dropQuantity: { min: 10, max: 10 } },
      { name: 'Withering Bones', dropChance: BASE, dropQuantity: { min: 10, max: 10 } },
      { name: 'Withering Stones', dropChance: BASE, dropQuantity: { min: 150, max: 150 } },
    ],
  },
  {
    name: 'Silent Crypt', realm: 'abyssal', levelRequirement: 38,
    targets: ['Silent Poltergeist', 'Silent Wanderer', 'Silent Keeper'],
    areaUniqueDrops: [
      { name: 'Whispertallow Seeds', dropChance: BASE, dropQuantity: { min: 10, max: 10 } },
      { name: 'Old Casket', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
      { name: 'Soul Stone', dropChance: BASE, dropQuantity: { min: 1, max: 1 } },
    ],
  },
  {
    name: 'Void Vaults', realm: 'abyssal', levelRequirement: 46,
    targets: ['Void Envoy', 'Void Shambler', 'Void Gazer'],
    areaUniqueDrops: [
      { name: 'Echosnap Seeds', dropChance: BASE, dropQuantity: { min: 5, max: 5 } },
      { name: 'Void Essence', dropChance: BASE, dropQuantity: { min: 2, max: 2 } },
    ],
  },
];

export const ALL_AREAS: ThievingArea[] = [
  ...MELVOR_AREAS,
  ...TOTH_AREAS,
  ...ABYSSAL_AREAS,
];
