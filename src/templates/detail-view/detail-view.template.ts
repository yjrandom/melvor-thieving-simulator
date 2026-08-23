import { Aggregator } from '../../calc/aggregator';
import {
  buildLootTable,
  calcAtLeastOneChance,
  calcAttemptsForChance,
} from '../../calc/detail';
import { calcThieving } from '../../calc/thieving';
import type {
  ThievingArea,
  ThievingBoosts,
  ThievingLoadout,
  ThievingTarget,
} from '../../calc/types';
import type { ThievingRealmId } from '../../constants/item-ids';
import { formatNumber, formatPercent } from '../../utils/number-utils';

export interface LootEntryDisplay {
  name: string;
  categoryLabel: string;
  formattedChance: string;
  formattedQuantity: string;
  formattedPerHour: string;
  chancePerAction: number;
}

export interface ConfidenceDisplay {
  name: string;
  formattedChance: string;
  formattedProbability: string;
  attemptsFor50: string;
  attemptsFor90: string;
  attemptsFor99: string;
}

export interface NpcDetailDisplay {
  name: string;
  area: string;
  level: number;
  realm: string;
  masteryLevel: number;
  formattedSuccessRate: string;
  formattedXpHr: string;
  formattedCurrencyHr: string;
  currencyLabel: string;
  formattedDouble: string;
  formattedInterval: string;
  formattedStunDuration: string;
  formattedActionsHr: string;
  formattedXpPerAction: string;
  formattedNpcUniqueChance: string;
  lootTable: LootEntryDisplay[];
  confidenceTable: ConfidenceDisplay[];
}

const CATEGORY_LABELS: Record<string, string> = {
  currency: 'Currency',
  common: 'Common',
  npcUnique: 'Unique',
  areaUnique: 'Area',
  genericRare: 'Rare',
};

/** Builds the per-NPC detail display from a target, its area, loadout, and mastery level. */
export function buildNpcDetail(
  target: ThievingTarget,
  areas: ThievingArea[],
  loadout: ThievingLoadout,
  masteryLevel: number,
  confidenceAttempts: number,
): NpcDetailDisplay {
  const aggregator = new Aggregator();
  const npcLoadout: ThievingLoadout = { ...loadout, masteryLevel };
  const boosts: ThievingBoosts = aggregator.aggregateBoosts(
    npcLoadout,
    target.realmId as ThievingRealmId,
  );
  const result = calcThieving(target, boosts);
  const area = areas.find((a) => a.name === target.area);
  const lootEntries = buildLootTable(target, area, result, boosts);

  const lootTable: LootEntryDisplay[] = lootEntries.map((entry) => ({
    name: entry.name,
    categoryLabel: CATEGORY_LABELS[entry.category] ?? entry.category,
    formattedChance: formatPercent(
      entry.chancePerSuccess,
      entry.chancePerSuccess < 0.01 ? 4 : 2,
    ),
    formattedQuantity:
      entry.quantity.min === entry.quantity.max
        ? formatNumber(entry.quantity.min)
        : `${formatNumber(entry.quantity.min)}–${formatNumber(entry.quantity.max)}`,
    formattedPerHour: formatNumber(entry.expectedPerHour, 1),
    chancePerAction: entry.chancePerAction,
  }));

  const confidenceEntries = lootEntries.filter(
    (e) => e.chancePerAction > 0 && e.chancePerAction < 1,
  );
  const confidenceTable: ConfidenceDisplay[] = confidenceEntries.map(
    (entry) => ({
      name: entry.name,
      formattedChance: formatPercent(
        entry.chancePerAction,
        entry.chancePerAction < 0.01 ? 4 : 2,
      ),
      formattedProbability: formatPercent(
        calcAtLeastOneChance(entry.chancePerAction, confidenceAttempts),
        1,
      ),
      attemptsFor50: formatNumber(
        calcAttemptsForChance(entry.chancePerAction, 0.5),
      ),
      attemptsFor90: formatNumber(
        calcAttemptsForChance(entry.chancePerAction, 0.9),
      ),
      attemptsFor99: formatNumber(
        calcAttemptsForChance(entry.chancePerAction, 0.99),
      ),
    }),
  );

  const realmLabel =
    target.realmId === 'melvorItA:Abyssal' ? 'Abyssal' : 'Melvor';

  return {
    name: target.name,
    area: target.area,
    level: target.level,
    realm: realmLabel,
    masteryLevel,
    formattedSuccessRate: formatPercent(result.successRate),
    formattedXpHr: formatNumber(result.xpPerHour),
    formattedCurrencyHr: formatNumber(result.currencyPerHour),
    currencyLabel: target.currencyType === 'ap' ? 'AP' : 'GP',
    formattedDouble: formatPercent(result.doubleChance),
    formattedInterval: (result.effectiveIntervalMs / 1000).toFixed(2) + 's',
    formattedStunDuration:
      (result.effectiveStunDurationMs / 1000).toFixed(2) + 's',
    formattedActionsHr: formatNumber(result.actionsPerHour),
    formattedXpPerAction: formatNumber(result.xpPerAction, 1),
    formattedNpcUniqueChance: formatPercent(result.npcUniqueChance, 4),
    lootTable,
    confidenceTable,
  };
}
