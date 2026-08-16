import type { ThievingArea, ThievingTarget, LootItem } from '../calc/types';

type CurrencyType = 'gp' | 'ap';

const CURRENCY_ID_MAP: Record<string, CurrencyType> = {
  'melvorD:GP': 'gp',
  'melvorItA:AbyssalPieces': 'ap',
};

function resolveCurrencyType(currencyId: string): CurrencyType {
  return CURRENCY_ID_MAP[currencyId] ?? 'gp';
}

function resolveRealm(realmId: string): 'melvor' | 'abyssal' {
  return realmId === 'melvorItA:Abyssal' ? 'abyssal' : 'melvor';
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
      realm: npc.area ? resolveRealm(npc.area.realm.id) : 'melvor',
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
  return thieving.areas.allObjects.map((area): ThievingArea => ({
    name: area.name,
    realm: resolveRealm(area.realm.id),
    levelRequirement: area.npcs[0]?.level ?? 1,
    targets: area.npcs.map((npc) => npc.name),
    areaUniqueDrops: area.uniqueDrops.map(toLootItem),
  }));
}
