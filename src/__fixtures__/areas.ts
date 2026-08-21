import { RealmName, type ThievingArea } from '../calc/types';
import { AREA_UNIQUE_BASE_CHANCE } from '../constants/game.constants';

export const MELVOR_AREAS: ThievingArea[] = [
  {
    name: 'Low Town',
    realm: RealmName.MELVOR,
    levelRequirement: 1,
    targets: ['Man', 'Woman'],
    areaUniqueDrops: [
      {
        name: 'Jeweled Necklace',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Golbin Village',
    realm: RealmName.MELVOR,
    levelRequirement: 8,
    targets: ['Golbin', 'Golbin Chief'],
    areaUniqueDrops: [
      {
        name: 'Crate of Basic Supplies',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Bandit Hideout',
    realm: RealmName.MELVOR,
    levelRequirement: 12,
    targets: ['Bandit Thug', 'Marauder'],
    areaUniqueDrops: [
      {
        name: "Thiever's Cape",
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: "Marksman's Sigil",
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Banquet',
    realm: RealmName.MELVOR,
    levelRequirement: 26,
    targets: ['Assistant Cook', 'Chef'],
    areaUniqueDrops: [
      {
        name: 'Bag of Flour',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 200, max: 200 },
      },
      {
        name: 'Cooking Apron',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: "Farmer's Market",
    realm: RealmName.MELVOR,
    levelRequirement: 31,
    targets: ['Merchant', 'Bob the Farmer'],
    areaUniqueDrops: [
      {
        name: 'Crate of Food',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 10, max: 10 },
      },
      {
        name: 'Basic Bag',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Apple Tree Seeds',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 3, max: 3 },
      },
    ],
  },
  {
    name: 'Port of Lemvor',
    realm: RealmName.MELVOR,
    levelRequirement: 45,
    targets: ['Dock Hand', 'Fisherman'],
    areaUniqueDrops: [
      {
        name: 'Shipwheel',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Treasure Chest',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Fishing Hook',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1000, max: 1000 },
      },
    ],
  },
  {
    name: 'Cave of Giants',
    realm: RealmName.MELVOR,
    levelRequirement: 49,
    targets: ['Troll', 'Cyclops'],
    areaUniqueDrops: [
      {
        name: 'Giant Club',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Stack of Bones',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Eyeball',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 100, max: 100 },
      },
    ],
  },
  {
    name: 'Outskirts',
    realm: RealmName.MELVOR,
    levelRequirement: 61,
    targets: ['Lumberjack', 'Miner'],
    areaUniqueDrops: [
      {
        name: 'Pile of Logs',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Pile of Ores',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Fort',
    realm: RealmName.MELVOR,
    levelRequirement: 66,
    targets: ['Squire', 'Knight'],
    areaUniqueDrops: [
      {
        name: "Knight's Sigil",
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: "Knight's Cape",
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Whetstone',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1000, max: 1000 },
      },
    ],
  },
  {
    name: 'Wizard Tower',
    realm: RealmName.MELVOR,
    levelRequirement: 75,
    targets: ['Acolyte', 'Wizard'],
    areaUniqueDrops: [
      {
        name: "Wizard's Scroll",
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1000, max: 1000 },
      },
      {
        name: "Wizard's Sigil",
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Prayer Scroll',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1000, max: 1000 },
      },
    ],
  },
  {
    name: 'Royal Castle',
    realm: RealmName.MELVOR,
    levelRequirement: 79,
    targets: ['Court Jester', 'Princess', 'King'],
    areaUniqueDrops: [
      {
        name: 'Ring of Wealth',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Chest of Gems',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Antique Vase',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
];

export const TOTH_AREAS: ThievingArea[] = [
  {
    name: 'Lost Ruins',
    realm: RealmName.MELVOR,
    levelRequirement: 100,
    targets: ['Explorer', 'Adventurer', 'Treasure Hunter'],
    areaUniqueDrops: [
      {
        name: "Explorer's Map",
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 500, max: 500 },
      },
      {
        name: 'Golden Chest',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Undead Palace',
    realm: RealmName.MELVOR,
    levelRequirement: 102,
    targets: ['Necromancer', 'Dark Knight'],
    areaUniqueDrops: [
      {
        name: 'Large Urn',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 10, max: 10 },
      },
    ],
  },
  {
    name: 'Desert',
    realm: RealmName.MELVOR,
    levelRequirement: 104,
    targets: ['Pilgrim', 'Travelling Merchant'],
    areaUniqueDrops: [
      {
        name: 'Portable Rations',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 500, max: 500 },
      },
      {
        name: 'Crate of Lost Supplies',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Mushroom Forest',
    realm: RealmName.MELVOR,
    levelRequirement: 110,
    targets: ['Sage', 'Madremonte'],
    areaUniqueDrops: [
      {
        name: 'Mushrooms',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 10, max: 10 },
      },
      {
        name: 'Mortar and Pestle',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Exotic Herb Sack',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Twilight',
    realm: RealmName.MELVOR,
    levelRequirement: 114,
    targets: ['Vampire', 'Vampire Lord'],
    areaUniqueDrops: [
      {
        name: 'Blood Vial',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 500, max: 500 },
      },
      {
        name: 'Masquerade Mask',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 500, max: 500 },
      },
    ],
  },
];

export const ABYSSAL_AREAS: ThievingArea[] = [
  {
    name: 'Crimson Village',
    realm: RealmName.ABYSSAL,
    levelRequirement: 1,
    targets: ['Turned Man', 'Turned Woman', 'Turned Farmer'],
    areaUniqueDrops: [
      {
        name: 'Crimson Lantern Stick',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Blighted Reach',
    realm: RealmName.ABYSSAL,
    levelRequirement: 8,
    targets: ['Blighted Dryad', 'Blighted Treant'],
    areaUniqueDrops: [
      {
        name: 'Toxic Spores',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 5, max: 5 },
      },
      {
        name: 'Blighted Heart Amulet',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Shadeveil Maze',
    realm: RealmName.ABYSSAL,
    levelRequirement: 16,
    targets: ['Dark Shade', 'Dark Wraithlurker', 'Dark Shadowmancer'],
    areaUniqueDrops: [
      {
        name: 'Shade Essence',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 5, max: 5 },
      },
      {
        name: 'Locked Maze Chest',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Withering Ruins',
    realm: RealmName.ABYSSAL,
    levelRequirement: 27,
    targets: ['Withering Gargoyle', 'Withering Golem'],
    areaUniqueDrops: [
      {
        name: 'Witherlyme Seeds',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 10, max: 10 },
      },
      {
        name: 'Withering Bones',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 10, max: 10 },
      },
      {
        name: 'Withering Stones',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 150, max: 150 },
      },
    ],
  },
  {
    name: 'Silent Crypt',
    realm: RealmName.ABYSSAL,
    levelRequirement: 38,
    targets: ['Silent Poltergeist', 'Silent Wanderer', 'Silent Keeper'],
    areaUniqueDrops: [
      {
        name: 'Whispertallow Seeds',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 10, max: 10 },
      },
      {
        name: 'Old Casket',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
      {
        name: 'Soul Stone',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 1, max: 1 },
      },
    ],
  },
  {
    name: 'Void Vaults',
    realm: RealmName.ABYSSAL,
    levelRequirement: 46,
    targets: ['Void Envoy', 'Void Shambler', 'Void Gazer'],
    areaUniqueDrops: [
      {
        name: 'Echosnap Seeds',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 5, max: 5 },
      },
      {
        name: 'Void Essence',
        dropChance: AREA_UNIQUE_BASE_CHANCE,
        dropQuantity: { min: 2, max: 2 },
      },
    ],
  },
];

export const ALL_AREAS: ThievingArea[] = [
  ...MELVOR_AREAS,
  ...TOTH_AREAS,
  ...ABYSSAL_AREAS,
];
