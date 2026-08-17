import type {
  ActivePotionInfo,
  ActivePrayerInfo,
  AgilityObstacleInfo,
  AgilityPillarInfo,
  AstrologyModifierInfo,
  EquippedItemEntry,
  LootItem,
  PetInfo,
  ShopPurchaseInfo,
  SummoningSynergyInfo,
  ThievingArea,
  ThievingLoadout,
  ThievingTarget,
} from '../calc/types';
import {
  RealmName,
  ThievingEquipmentSlotId,
  ThievingRealmId,
} from '../calc/types';

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
      name: npc.name,
      perception: npc.perception,
      maxHit: npc.maxHit,
      baseExperience: npc.baseExperience,
      level: npc.level,
      realm: npc.area ? resolveRealm(npc.area.realm.id) : RealmName.MELVOR,
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
      realm: resolveRealm(area.realm.id),
      levelRequirement: area.npcs[0]?.level ?? 1,
      targets: area.npcs.map((npc) => npc.name),
      areaUniqueDrops: area.uniqueDrops.map(toLootItem),
    }),
  );
}

const THIEVING_SLOT_IDS = Object.values(ThievingEquipmentSlotId);

function readEquipment(player: Player): EquippedItemEntry[] {
  const equipment = player.equipment;
  const entries: EquippedItemEntry[] = [];
  for (const slotId of THIEVING_SLOT_IDS) {
    if (equipment.isSlotEmpty(slotId)) continue;
    const item = equipment.getItemInSlot(slotId);
    entries.push({ slotId, itemId: item.id, itemName: item.name });
  }
  return entries;
}

function readMasteryLevels(thieving: Thieving): Map<string, number> {
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
): ActivePotionInfo | undefined {
  const potion = potions.getActivePotionForAction(thieving);
  if (potion === undefined) return undefined;
  return {
    itemId: potion.id,
    itemName: potion.name,
    tier: potion.tier,
  };
}

function readActivePrayers(player: Player): ActivePrayerInfo[] {
  const prayers: ActivePrayerInfo[] = [];
  for (const prayer of player.activePrayers) {
    prayers.push({ id: prayer.id, name: prayer.name });
  }
  return prayers;
}

const REALM_IDS = ['melvorD:Melvor', 'melvorItA:Abyssal'] as const;

function readAgilityObstacles(
  agility: Agility,
  realms: Game['realms'],
): AgilityObstacleInfo[] {
  const obstacles: AgilityObstacleInfo[] = [];
  for (const realmId of REALM_IDS) {
    const realm = realms.getObjectByID(realmId);
    if (realm === undefined) continue;
    const course = agility.courses.get(realm);
    if (course === undefined) continue;
    for (const [slot, obstacle] of course.builtObstacles) {
      obstacles.push({ id: obstacle.id, name: obstacle.name, slot });
    }
  }
  return obstacles;
}

function readAgilityPillars(
  agility: Agility,
  realms: Game['realms'],
): AgilityPillarInfo[] {
  const pillars: AgilityPillarInfo[] = [];
  for (const realmId of REALM_IDS) {
    const realm = realms.getObjectByID(realmId);
    if (realm === undefined) continue;
    const course = agility.courses.get(realm);
    if (course === undefined) continue;
    for (const [slot, pillar] of course.builtPillars) {
      pillars.push({ id: pillar.id, name: pillar.name, slot });
    }
  }
  return pillars;
}

function readAstrologyModifiers(
  astrology: Astrology,
  thieving: Thieving,
): AstrologyModifierInfo[] {
  const mods: AstrologyModifierInfo[] = [];
  for (const recipe of astrology.actions.allObjects) {
    if (!recipe.skills.includes(thieving as unknown as AnySkill)) continue;
    const addMods = (
      modifiers: AstrologyModifier[],
      modifierType: AstrologyModifierInfo['modifierType'],
    ) => {
      modifiers.forEach((mod, index) => {
        if (mod.timesBought > 0) {
          mods.push({
            constellationId: recipe.id,
            constellationName: recipe.name,
            modifierType,
            index,
            timesBought: mod.timesBought,
            maxCount: mod.maxCount,
          });
        }
      });
    };
    addMods(recipe.standardModifiers, 'standard');
    addMods(recipe.uniqueModifiers, 'unique');
    addMods(recipe.abyssalModifiers, 'abyssal');
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

function readShopPurchases(shop: Shop): ShopPurchaseInfo[] {
  const purchases: ShopPurchaseInfo[] = [];
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
  };
}

export function readLoadout(game: Game): ThievingLoadout {
  const player = game.combat.player;
  return {
    equipment: readEquipment(player),
    masteryLevels: readMasteryLevels(game.thieving),
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
    activePrayers: readActivePrayers(player),
    agilityObstacles: readAgilityObstacles(game.agility, game.realms),
    agilityPillars: readAgilityPillars(game.agility, game.realms),
    astrologyModifiers: readAstrologyModifiers(game.astrology, game.thieving),
    activePets: readActivePets(game.petManager),
    shopPurchases: readShopPurchases(game.shop),
    activeSynergy: readActiveSynergy(player),
    skillLevel: game.thieving.level,
    abyssalSkillLevel: game.thieving.abyssalLevel,
  };
}
