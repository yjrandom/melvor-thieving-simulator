import { Aggregator } from '../../../calc/aggregator';
import { calcThieving } from '../../../calc/thieving';
import type {
  ThievingLoadout,
  ThievingResult,
  ThievingTarget,
} from '../../../calc/types';
import { RealmName } from '../../../constants/game.constants';
import type { ThievingRealmId } from '../../../constants/item-ids';
import { formatNumber, formatPercent } from '../../../utils/number-utils';

export enum SortColumn {
  NPC = 'npc',
  AREA = 'area',
  LEVEL = 'level',
  XP_HR = 'xpHr',
  CURRENCY_HR = 'currencyHr',
  SUCCESS = 'success',
  DOUBLE = 'double',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export type RealmFilter = 'all' | 'melvor' | 'abyssal';

export interface ComparisonRow {
  target: ThievingTarget;
  result: ThievingResult;
  masteryLevel: number;
  formattedXpHr: string;
  formattedCurrencyHr: string;
  formattedSuccess: string;
  formattedDouble: string;
  currencyLabel: string;
}

const SORT_COLUMN_ACCESSOR: Record<
  SortColumn,
  (row: ComparisonRow) => string | number
> = {
  [SortColumn.NPC]: (r) => r.target.name,
  [SortColumn.AREA]: (r) => r.target.area,
  [SortColumn.LEVEL]: (r) => r.target.level,
  [SortColumn.XP_HR]: (r) => r.result.xpPerHour,
  [SortColumn.CURRENCY_HR]: (r) => r.result.currencyPerHour,
  [SortColumn.SUCCESS]: (r) => r.result.successRate,
  [SortColumn.DOUBLE]: (r) => r.result.doubleChance,
};

export const REALM_FILTER_MAP: Record<RealmFilter, RealmName | undefined> = {
  all: undefined,
  melvor: RealmName.MELVOR,
  abyssal: RealmName.ABYSSAL,
};

/** Builds all comparison rows by running the aggregator + calc engine for each target. */
export function buildRows(
  targets: ThievingTarget[],
  loadout: ThievingLoadout,
  masteryLevels: Map<string, number>,
): ComparisonRow[] {
  const aggregator = new Aggregator();
  return targets.map((target) => {
    const npcMastery = masteryLevels.get(target.id) ?? 1;
    const npcLoadout: ThievingLoadout = {
      ...loadout,
      masteryLevel: npcMastery,
    };
    const boosts = aggregator.aggregateBoosts(
      npcLoadout,
      target.realmId as ThievingRealmId,
    );
    const result = calcThieving(target, boosts);
    return {
      target,
      result,
      masteryLevel: npcMastery,
      formattedXpHr: formatNumber(result.xpPerHour),
      formattedCurrencyHr: formatNumber(result.currencyPerHour),
      formattedSuccess: formatPercent(result.successRate),
      formattedDouble: formatPercent(result.doubleChance),
      currencyLabel: target.currencyType === 'ap' ? 'AP' : 'GP',
    };
  });
}

/** Sorts comparison rows by the given column and direction. */
export function sortRows(
  rows: ComparisonRow[],
  column: SortColumn,
  direction: SortDirection,
): ComparisonRow[] {
  const accessor = SORT_COLUMN_ACCESSOR[column];
  const dir = direction === SortDirection.ASC ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    if (typeof va === 'string' && typeof vb === 'string') {
      return dir * va.localeCompare(vb);
    }
    return dir * ((va as number) - (vb as number));
  });
}
