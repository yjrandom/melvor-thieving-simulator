import type {
  AgilityObstacle,
  AgilityPillar,
  AstrologyConstellation,
  EquipmentOption,
  EquippedItemEntry,
  LootItem,
  Modifier,
  PetInfo,
  Potion,
  Prayer,
  ShopPurchase,
  SummoningSynergyInfo,
  ThievingArea,
  ThievingLoadout,
  ThievingTarget,
} from '../calc/types';
import { RealmName } from '../calc/types';
import {
  ThievingBoostId,
  ThievingEquipmentSlotId,
  ThievingRealmId,
} from '../constants/item-ids';

type CurrencyType = 'gp' | 'ap';

const CURRENCY_ID_MAP: Record<string, CurrencyType> = {
  'melvorD:GP': 'gp',
  'melvorItA:AbyssalPieces': 'ap',
};

function resolveCurrencyType(currencyId: string): CurrencyType {
  return CURRENCY_ID_MAP[currencyId] ?? 'gp';
}

function resolveRealm(realmId: string): RealmName {
  return realmId === ThievingRealmId.ABYSSAL
    ? RealmName.ABYSSAL
    : RealmName.MELVOR;
}

function toLootItem(drop: AnyItemQuantity): LootItem {
  return {
    name: drop.item.name,
    dropQuantity: { min: drop.quantity, max: drop.quantity },
  };
}

export function readTargets(thieving: Thieving): ThievingTarget[] {
  return thieving.actions.allObjects.map((npc): ThievingTarget => {
    const primaryCurrency = npc.currencyDrops[0];
    const currencyType = primaryCurrency
      ? resolveCurrencyType(primaryCurrency.currency.id)
      : 'gp';
    const maxCurrency = primaryCurrency?.quantity ?? 0;

    const target: ThievingTarget = {
      id: npc.id,
      name: npc.name,
      perception: npc.perception,
      maxHit: npc.maxHit,
      baseExperience: npc.baseExperience,
      level: npc.level,
      realmId:
        (npc.area?.realm.id as ThievingRealmId) ?? ThievingRealmId.MELVOR,
      area: npc.area?.name ?? '',
      currencyRange: { min: maxCurrency > 0 ? 1 : 0, max: maxCurrency },
      currencyType,
    };
    if (npc.uniqueDrop) {
      target.uniqueDrop = toLootItem(npc.uniqueDrop);
    }
    return target;
  });
}

export function readAreas(thieving: Thieving): ThievingArea[] {
  return thieving.areas.allObjects.map(
    (area): ThievingArea => ({
      name: area.name,
      realm: area.realm.name as RealmName,
      levelRequirement: area.npcs[0]?.level ?? 1,
      targets: area.npcs.map((npc) => npc.name),
      areaUniqueDrops: area.uniqueDrops.map(toLootItem),
    }),
  );
}

/** Serializes game ModifierValue[] into plain data, preserving realm scope. */
function resolveModifiers(modValues: ModifierValue[] | undefined): Modifier[] {
  if (!modValues) return [];
  return modValues.map((mv) => {
    const resolved: Modifier = {
      boostId: mv.modifier.id as ThievingBoostId,
      value: mv.value,
    };
    if (mv.realm) resolved.realmId = mv.realm.id;
    return resolved;
  });
}

const THIEVING_SLOT_IDS = Object.values(ThievingEquipmentSlotId);

function readEquipment(player: Player): EquippedItemEntry[] {
  const equipment = player.equipment;
  const entries: EquippedItemEntry[] = [];
  for (const slotId of THIEVING_SLOT_IDS) {
    if (equipment.isSlotEmpty(slotId)) continue;
    const item = equipment.getItemInSlot(slotId);
    entries.push({
      slotId,
      itemId: item.id,
      itemName: item.name,
      modifiers: resolveModifiers((item as EquipmentItem).modifiers),
    });
  }
  return entries;
}

/**
 * Reads mastery levels for all thieving NPCs.
 *
 * @returns Map of NPC ID to mastery level.
 */
export function readAllMasteryLevels(thieving: Thieving): Map<string, number> {
  const levels = new Map<string, number>();
  for (const npc of thieving.actions.allObjects) {
    levels.set(npc.id, thieving.getMasteryLevel(npc));
  }
  return levels;
}

function readMasteryPoolPercent(
  thieving: Thieving,
  realms: Game['realms'],
  realmId: string,
): number {
  const realm = realms.getObjectByID(realmId);
  if (realm === undefined) return 0;
  const cap = thieving.getMasteryPoolCap(realm);
  if (cap <= 0) return 0;
  return (thieving.getMasteryPoolXP(realm) / cap) * 100;
}

function readActivePotion(
  potions: PotionManager,
  thieving: Thieving,
): Potion | undefined {
  const potion = potions.getActivePotionForAction(thieving);
  if (potion === undefined) return undefined;
  return {
    itemId: potion.id,
    itemName: potion.name,
    tier: potion.tier,
    modifiers: resolveModifiers(potion.stats.modifiers),
  };
}

function readActivePrayers(
  activePrayers: Set<ActivePrayer>,
): Set<Prayer> | undefined {
  const prayers = new Set<Prayer>();

  activePrayers.forEach((prayer) => {
    prayers.add({ id: prayer.id, name: prayer.name });
  });

  return prayers;
}

const REALM_IDS = ['melvorD:Melvor', 'melvorItA:Abyssal'] as const;

function readAgilityObstacles(
  agility: Agility,
  realms: Game['realms'],
): AgilityObstacle[] {
  const obstacles: AgilityObstacle[] = [];
  for (const realmId of REALM_IDS) {
    const realm = realms.getObjectByID(realmId);
    if (realm === undefined) continue;
    const course = agility.courses.get(realm);
    if (course === undefined) continue;
    for (const [slot, obstacle] of course.builtObstacles) {
      obstacles.push({
        id: obstacle.id,
        name: obstacle.name,
        slot,
        modifiers: resolveModifiers(obstacle.modifiers),
      });
    }
  }
  return obstacles;
}

function readAgilityPillars(
  agility: Agility,
  realms: Game['realms'],
): AgilityPillar[] {
  const pillars: AgilityPillar[] = [];
  for (const realmId of REALM_IDS) {
    const realm = realms.getObjectByID(realmId);
    if (realm === undefined) continue;
    const course = agility.courses.get(realm);
    if (course === undefined) continue;
    for (const [slot, pillar] of course.builtPillars) {
      pillars.push({
        id: pillar.id,
        name: pillar.name,
        slot,
        modifiers: resolveModifiers(pillar.modifiers),
      });
    }
  }
  return pillars;
}

function readAstrologyModifiers(
  astrology: Astrology,
  thieving: Thieving,
): AstrologyConstellation[] {
  const mods: AstrologyConstellation[] = [];
  for (const recipe of astrology.actions.allObjects) {
    if (!recipe.skills.includes(thieving as unknown as AnySkill)) continue;
    const collectMods = (modifiers: AstrologyModifier[]) => {
      for (const mod of modifiers) {
        if (mod.timesBought > 0) {
          mods.push({
            constellationId: recipe.id,
            constellationName: recipe.name,
            modifiers: resolveModifiers(mod.stats.modifiers),
          });
        }
      }
    };
    collectMods(recipe.standardModifiers);
    collectMods(recipe.uniqueModifiers);
    collectMods(recipe.abyssalModifiers);
  }
  return mods;
}

function readActivePets(petManager: PetManager): PetInfo[] {
  const pets: PetInfo[] = [];
  for (const pet of petManager.unlocked) {
    pets.push({ id: pet.id, name: pet.name });
  }
  return pets;
}

function readShopPurchases(shop: Shop): ShopPurchase[] {
  const purchases: ShopPurchase[] = [];
  for (const [purchase, count] of shop.upgradesPurchased) {
    if (count > 0) {
      purchases.push({ id: purchase.id, name: purchase.name, count });
    }
  }
  return purchases;
}

function readActiveSynergy(player: Player): SummoningSynergyInfo | undefined {
  const synergy = player.activeSummoningSynergy;
  if (synergy === undefined) return undefined;
  return {
    summon1Id: synergy.summons[0].product.id,
    summon2Id: synergy.summons[1].product.id,
    description: synergy.description,
    modifiers: resolveModifiers(synergy.modifiers),
  };
}

const THIEVING_BOOST_IDS = new Set<string>(Object.values(ThievingBoostId));

/** Returns true if the item has at least one modifier relevant to thieving calculations. */
function hasThievingModifier(modifiers: ModifierValue[] | undefined): boolean {
  if (!modifiers) return false;
  return modifiers.some((mv) => THIEVING_BOOST_IDS.has(mv.modifier.id));
}

/**
 * Enumerates equippable items with thieving-relevant modifiers for each equipment slot.
 *
 * @returns Record keyed by slot ID, each holding the available items sorted alphabetically.
 */
export function readEquipmentOptions(
  game: Game,
): Record<string, EquipmentOption[]> {
  const thievingSlotIds = new Set<string>(
    Object.values(ThievingEquipmentSlotId),
  );
  const optionsBySlot: Record<string, EquipmentOption[]> = {};

  for (const item of game.items.equipment.allObjects) {
    if (!hasThievingModifier(item.modifiers)) continue;
    for (const slot of item.validSlots) {
      if (!thievingSlotIds.has(slot.id)) continue;
      const slotId = slot.id;
      if (!(slotId in optionsBySlot)) optionsBySlot[slotId] = [];
      optionsBySlot[slotId]?.push({
        itemId: item.id,
        itemName: item.name,
        modifiers: resolveModifiers(item.modifiers),
      });
    }
  }

  for (const options of Object.values(optionsBySlot)) {
    options.sort((a, b) => a.itemName.localeCompare(b.itemName));
  }

  return optionsBySlot;
}

/**
 * Reads the player's current thieving loadout from the game state.
 *
 * Mastery level defaults to 1 — callers should set per-NPC mastery via
 * {@link readAllMasteryLevels} before passing the loadout to the aggregator.
 */
export function readLoadout(game: Game): ThievingLoadout {
  const player = game.combat.player;
  return {
    equipment: readEquipment(player),
    masteryLevel: 1,
    melvorMasteryPoolPercent: readMasteryPoolPercent(
      game.thieving,
      game.realms,
      'melvorD:Melvor',
    ),
    abyssalMasteryPoolPercent: readMasteryPoolPercent(
      game.thieving,
      game.realms,
      'melvorItA:Abyssal',
    ),
    activePotion: readActivePotion(game.potions, game.thieving),
    activePrayers: readActivePrayers(player.activePrayers),
    agilityObstacles: readAgilityObstacles(game.agility, game.realms),
    agilityPillars: readAgilityPillars(game.agility, game.realms),
    astrologyConstellations: readAstrologyModifiers(
      game.astrology,
      game.thieving,
    ),
    activePets: readActivePets(game.petManager),
    shopPurchases: readShopPurchases(game.shop),
    activeSummoningSynergy: readActiveSynergy(player),
    skillLevel: game.thieving.level,
    abyssalSkillLevel: game.thieving.abyssalLevel,
  };
}
