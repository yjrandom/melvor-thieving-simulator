import { Aggregator } from '../calc/aggregator';
import { calcThieving } from '../calc/thieving';
import type {
  ThievingArea,
  ThievingLoadout,
  ThievingResult,
  ThievingTarget,
} from '../calc/types';
import { RealmName } from '../calc/types';
import type { ThievingRealmId } from '../constants/item-ids';
import { ThievingEquipmentSlotId } from '../constants/item-ids';
import { formatNumber, formatPercent } from '../utils/number-utils';

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

export interface EquipmentDisplayEntry {
  /** Human-readable slot label (e.g. "Head", "Hands"). */
  slotName: string;
  /** Game item name. */
  itemName: string;
}

export interface ConfigDisplay {
  equipment: EquipmentDisplayEntry[];
  /** Item name or "None". */
  potion: string;
  /** Comma-joined names or "None". */
  prayerSummary: string;
  /** "N obstacles, M pillars" or "No course loaded". */
  agilitySummary: string;
  /** Synergy description or "None". */
  synergy: string;
  astrologyCount: number;
  petCount: number;
  shopPurchaseCount: number;
  skillLevel: number;
  abyssalSkillLevel: number;
  /** Pre-formatted percentage, e.g. "96.5%". */
  melvorPool: string;
  /** Pre-formatted percentage, e.g. "42.3%". */
  abyssalPool: string;
}

export interface ImportResult {
  loadout: ThievingLoadout;
  masteryLevels: Map<string, number>;
}

export interface MainModalInputProps {
  targets: ThievingTarget[];
  areas: ThievingArea[];
  onImport: () => ImportResult;
}

interface MainModalScope {
  isOpen: boolean;
  hasImported: boolean;
  configDisplay: ConfigDisplay | null;
  realmFilter: RealmFilter;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  allRows: ComparisonRow[];
  filteredRows: ComparisonRow[];
  setIsOpen: () => void;
  setRealmFilter: (filter: RealmFilter) => void;
  toggleSort: (column: SortColumn) => void;
  sortIndicator: (column: SortColumn) => string;
  recomputeFilteredRows: () => void;
  importLoadout: () => void;
}

const SLOT_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  [ThievingEquipmentSlotId.HELMET]: 'Head',
  [ThievingEquipmentSlotId.PLATEBODY]: 'Body',
  [ThievingEquipmentSlotId.PLATELEGS]: 'Legs',
  [ThievingEquipmentSlotId.BOOTS]: 'Feet',
  [ThievingEquipmentSlotId.WEAPON]: 'Weapon',
  [ThievingEquipmentSlotId.SHIELD]: 'Off-hand',
  [ThievingEquipmentSlotId.AMULET]: 'Neck',
  [ThievingEquipmentSlotId.RING]: 'Ring',
  [ThievingEquipmentSlotId.GLOVES]: 'Hands',
  [ThievingEquipmentSlotId.QUIVER]: 'Ammo',
  [ThievingEquipmentSlotId.CAPE]: 'Cape',
  [ThievingEquipmentSlotId.PASSIVE]: 'Passive',
  [ThievingEquipmentSlotId.SUMMON1]: 'Summon 1',
  [ThievingEquipmentSlotId.SUMMON2]: 'Summon 2',
  [ThievingEquipmentSlotId.CONSUMABLE]: 'Consumable',
  [ThievingEquipmentSlotId.GEM]: 'Gem',
  [ThievingEquipmentSlotId.ENHANCEMENT1]: 'Enhance 1',
  [ThievingEquipmentSlotId.ENHANCEMENT2]: 'Enhance 2',
  [ThievingEquipmentSlotId.ENHANCEMENT3]: 'Enhance 3',
};

/**
 * Maps an equipment slot ID to a human-readable display name.
 * Falls back to the suffix after ':' for unknown slot IDs.
 */
export function getSlotDisplayName(slotId: string): string {
  return SLOT_DISPLAY_NAMES[slotId] ?? slotId.split(':').pop()!;
}

/** Transforms a raw loadout into pre-formatted display data for the config panel. */
export function buildConfigDisplay(loadout: ThievingLoadout): ConfigDisplay {
  const equipment = loadout.equipment.map(
    (entry): EquipmentDisplayEntry => ({
      slotName: getSlotDisplayName(entry.slotId),
      itemName: entry.itemName,
    }),
  );

  const potion = loadout.activePotion?.itemName ?? 'None';

  const prayerSummary =
    loadout.activePrayers && loadout.activePrayers.size > 0
      ? [...loadout.activePrayers].map((p) => p.name).join(', ')
      : 'None';

  const obstacleCount = loadout.agilityObstacles.length;
  const pillarCount = loadout.agilityPillars.length;
  let agilitySummary: string;
  if (obstacleCount === 0 && pillarCount === 0) {
    agilitySummary = 'No course loaded';
  } else {
    const parts: string[] = [];
    if (obstacleCount > 0) {
      parts.push(
        `${obstacleCount} ${obstacleCount === 1 ? 'obstacle' : 'obstacles'}`,
      );
    }
    if (pillarCount > 0) {
      parts.push(
        `${pillarCount} ${pillarCount === 1 ? 'pillar' : 'pillars'}`,
      );
    }
    agilitySummary = parts.join(', ');
  }

  const synergy = loadout.activeSummoningSynergy?.description ?? 'None';

  return {
    equipment,
    potion,
    prayerSummary,
    agilitySummary,
    synergy,
    astrologyCount: loadout.astrologyConstellations.length,
    petCount: loadout.activePets.length,
    shopPurchaseCount: loadout.shopPurchases.length,
    skillLevel: loadout.skillLevel,
    abyssalSkillLevel: loadout.abyssalSkillLevel,
    melvorPool: formatPercent(loadout.melvorMasteryPoolPercent / 100),
    abyssalPool: formatPercent(loadout.abyssalMasteryPoolPercent / 100),
  };
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

const REALM_FILTER_MAP: Record<RealmFilter, RealmName | undefined> = {
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

function sortRows(
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

export default function MainModal(
  props: MainModalInputProps,
): Component<MainModalScope> {
  let importedLoadout: ThievingLoadout | null = null;
  let importedMasteryLevels: Map<string, number> | null = null;

  return {
    $template: '#ts-modal',
    isOpen: false,
    hasImported: false,
    configDisplay: null,
    realmFilter: 'all' as RealmFilter,
    sortColumn: SortColumn.XP_HR,
    sortDirection: SortDirection.DESC,
    allRows: [],
    filteredRows: [],

    setIsOpen() {
      this.isOpen = !this.isOpen;
    },

    setRealmFilter(filter: RealmFilter) {
      this.realmFilter = filter;
      this.recomputeFilteredRows();
    },

    toggleSort(column: SortColumn) {
      if (this.sortColumn === column) {
        this.sortDirection =
          this.sortDirection === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC;
      } else {
        this.sortColumn = column;
        this.sortDirection = SortDirection.DESC;
      }
      this.recomputeFilteredRows();
    },

    sortIndicator(column: SortColumn): string {
      if (this.sortColumn !== column) return '';
      return this.sortDirection === SortDirection.ASC ? ' ▲' : ' ▼';
    },

    importLoadout() {
      const { loadout, masteryLevels } = props.onImport();
      importedLoadout = loadout;
      importedMasteryLevels = masteryLevels;
      this.configDisplay = buildConfigDisplay(loadout);
      this.allRows = buildRows(props.targets, loadout, masteryLevels);
      this.hasImported = true;
      this.recomputeFilteredRows();
    },

    recomputeFilteredRows() {
      const realmName = REALM_FILTER_MAP[this.realmFilter];
      const filtered = realmName
        ? this.allRows.filter((r) => {
            const targetRealm =
              r.target.realmId === 'melvorItA:Abyssal'
                ? RealmName.ABYSSAL
                : RealmName.MELVOR;
            return targetRealm === realmName;
          })
        : this.allRows;
      this.filteredRows = sortRows(
        filtered,
        this.sortColumn,
        this.sortDirection,
      );
    },
  };
}
