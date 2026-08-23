import { Aggregator } from '../calc/aggregator';
import {
  buildLootTable,
  calcAtLeastOneChance,
  calcAttemptsForChance,
} from '../calc/detail';
import { calcThieving } from '../calc/thieving';
import type {
  EquipmentOption,
  EquippedItemEntry,
  LoadoutOverrides,
  Potion,
  SummoningSynergyInfo,
  ThievingArea,
  ThievingBoosts,
  ThievingLoadout,
  ThievingResult,
  ThievingTarget,
} from '../calc/types';
import { RealmName } from '../constants/game.constants';
import type { ThievingRealmId } from '../constants/item-ids';
import { ThievingEquipmentSlotId } from '../constants/item-ids';
import { applyOverrides } from '../state/overrides';
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

export type ModalTab = 'simulate' | 'equipment' | 'config';

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

export interface EquipmentSlotDisplay {
  slotId: string;
  slotName: string;
  itemName: string;
  hasItem: boolean;
  isOverridden: boolean;
  gridRow: number;
  gridCol: number;
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

export interface AgilitySlotDisplay {
  slot: number;
  name: string;
  type: 'obstacle' | 'pillar';
  isCleared: boolean;
}

export interface PotionOptionDisplay {
  itemId: string;
  itemName: string;
  tier: number;
  isSelected: boolean;
}

export interface SynergyOptionDisplay {
  index: number;
  name: string;
  description: string;
  isSelected: boolean;
}

export interface ImportResult {
  loadout: ThievingLoadout;
  masteryLevels: Map<string, number>;
}

export interface MainModalInputProps {
  targets: ThievingTarget[];
  areas: ThievingArea[];
  onImport: () => ImportResult;
  equipmentOptions: Record<string, EquipmentOption[]>;
  potionOptions: Potion[];
  synergyOptions: SummoningSynergyInfo[];
}

interface MainModalScope {
  isOpen: boolean;
  hasImported: boolean;
  activeTab: ModalTab;
  configDisplay: ConfigDisplay | null;
  realmFilter: RealmFilter;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  allRows: ComparisonRow[];
  filteredRows: ComparisonRow[];
  equipmentSlots: EquipmentSlotDisplay[];
  selectedSlot: string | null;
  slotOptions: EquipmentOption[];
  selectedSlotName: string;
  potionDisplayOptions: PotionOptionDisplay[];
  synergyDisplayOptions: SynergyOptionDisplay[];
  agilitySlots: AgilitySlotDisplay[];
  hasAnyOverride: boolean;
  detailDisplay: NpcDetailDisplay | null;
  confidenceAttempts: number;
  confidenceInput: string;
  setIsOpen: () => void;
  setActiveTab: (tab: ModalTab) => void;
  setRealmFilter: (filter: RealmFilter) => void;
  toggleSort: (column: SortColumn) => void;
  sortIndicator: (column: SortColumn) => string;
  recomputeFilteredRows: () => void;
  importLoadout: () => void;
  selectSlot: (slotId: string) => void;
  selectItem: (option: EquipmentOption | null) => void;
  clearSlot: () => void;
  resetEquipment: () => void;
  selectPotion: (potion: PotionOptionDisplay) => void;
  clearPotion: () => void;
  selectSynergy: (synergy: SynergyOptionDisplay) => void;
  clearSynergy: () => void;
  clearAgilitySlot: (display: AgilitySlotDisplay) => void;
  resetAll: () => void;
  selectTarget: (row: ComparisonRow) => void;
  backToTable: () => void;
  setConfidenceAttempts: (count: number) => void;
  applyConfidenceInput: () => void;
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

/** Paper-doll grid positions matching Melvor's equipment screen layout (3-column). */
export const SLOT_GRID_POSITIONS: Readonly<
  Record<string, { row: number; col: number }>
> = {
  [ThievingEquipmentSlotId.HELMET]: { row: 0, col: 1 },
  [ThievingEquipmentSlotId.CAPE]: { row: 1, col: 0 },
  [ThievingEquipmentSlotId.AMULET]: { row: 1, col: 1 },
  [ThievingEquipmentSlotId.QUIVER]: { row: 1, col: 2 },
  [ThievingEquipmentSlotId.WEAPON]: { row: 2, col: 0 },
  [ThievingEquipmentSlotId.PLATEBODY]: { row: 2, col: 1 },
  [ThievingEquipmentSlotId.SHIELD]: { row: 2, col: 2 },
  [ThievingEquipmentSlotId.PLATELEGS]: { row: 3, col: 1 },
  [ThievingEquipmentSlotId.GLOVES]: { row: 4, col: 0 },
  [ThievingEquipmentSlotId.BOOTS]: { row: 4, col: 1 },
  [ThievingEquipmentSlotId.RING]: { row: 4, col: 2 },
  [ThievingEquipmentSlotId.PASSIVE]: { row: 5, col: 0 },
  [ThievingEquipmentSlotId.SUMMON1]: { row: 6, col: 0 },
  [ThievingEquipmentSlotId.SUMMON2]: { row: 6, col: 1 },
  [ThievingEquipmentSlotId.CONSUMABLE]: { row: 7, col: 0 },
  [ThievingEquipmentSlotId.GEM]: { row: 7, col: 1 },
  [ThievingEquipmentSlotId.ENHANCEMENT1]: { row: 8, col: 0 },
  [ThievingEquipmentSlotId.ENHANCEMENT2]: { row: 8, col: 1 },
  [ThievingEquipmentSlotId.ENHANCEMENT3]: { row: 8, col: 2 },
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
      parts.push(`${pillarCount} ${pillarCount === 1 ? 'pillar' : 'pillars'}`);
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

/** Builds the display state for all equipment slots from the active loadout and overrides. */
export function buildEquipmentSlots(
  loadout: ThievingLoadout,
  overrides: LoadoutOverrides,
): EquipmentSlotDisplay[] {
  const equippedBySlot = new Map(loadout.equipment.map((e) => [e.slotId, e]));
  const overriddenSlots = new Set(
    overrides.equipment ? Object.keys(overrides.equipment) : [],
  );

  return Object.values(ThievingEquipmentSlotId).map((slotId) => {
    const equipped = equippedBySlot.get(slotId);
    const pos = SLOT_GRID_POSITIONS[slotId] ?? { row: 0, col: 0 };
    return {
      slotId,
      slotName: getSlotDisplayName(slotId),
      itemName: equipped?.itemName ?? 'Empty',
      hasItem: equipped !== undefined,
      isOverridden: overriddenSlots.has(slotId),
      gridRow: pos.row,
      gridCol: pos.col,
    };
  });
}

/** Builds potion option display state with selection tracking. */
export function buildPotionOptions(
  options: Potion[],
  activePotion: Potion | undefined,
): PotionOptionDisplay[] {
  return options.map((p) => ({
    itemId: p.itemId,
    itemName: p.itemName,
    tier: p.tier,
    isSelected: activePotion?.itemId === p.itemId,
  }));
}

/** Builds synergy option display state with selection tracking. */
export function buildSynergyOptions(
  options: SummoningSynergyInfo[],
  activeSynergy: SummoningSynergyInfo | undefined,
): SynergyOptionDisplay[] {
  return options.map((s, i) => ({
    index: i,
    name: s.name,
    description: s.description,
    isSelected:
      activeSynergy?.summon1Id === s.summon1Id &&
      activeSynergy?.summon2Id === s.summon2Id,
  }));
}

/** Builds agility slot display from the active loadout and current overrides. */
export function buildAgilitySlots(
  loadout: ThievingLoadout,
  overrides: LoadoutOverrides,
): AgilitySlotDisplay[] {
  const slots: AgilitySlotDisplay[] = [];
  const clearedObstacles = new Set<number>();
  const clearedPillars = new Set<number>();

  if (overrides.agilityObstacles) {
    for (const [slotStr, val] of Object.entries(overrides.agilityObstacles)) {
      if (val === null) clearedObstacles.add(Number(slotStr));
    }
  }
  if (overrides.agilityPillars) {
    for (const [slotStr, val] of Object.entries(overrides.agilityPillars)) {
      if (val === null) clearedPillars.add(Number(slotStr));
    }
  }

  for (const obstacle of loadout.agilityObstacles) {
    slots.push({
      slot: obstacle.slot,
      name: obstacle.name,
      type: 'obstacle',
      isCleared: clearedObstacles.has(obstacle.slot),
    });
  }
  for (const pillar of loadout.agilityPillars) {
    slots.push({
      slot: pillar.slot,
      name: pillar.name,
      type: 'pillar',
      isCleared: clearedPillars.has(pillar.slot),
    });
  }
  return slots;
}

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

/** Returns true if any override field is set (not undefined). */
function hasOverrides(overrides: LoadoutOverrides): boolean {
  return Object.values(overrides).some((v) => v !== undefined);
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
  let currentOverrides: LoadoutOverrides = {};
  let selectedTargetRow: ComparisonRow | null = null;

  function getActiveLoadout(): ThievingLoadout {
    return applyOverrides(importedLoadout!, currentOverrides);
  }

  /** Refreshes all derived display state from the current loadout and overrides. */
  function refreshDisplay(scope: MainModalScope): void {
    const activeLoadout = getActiveLoadout();
    scope.configDisplay = buildConfigDisplay(activeLoadout);
    scope.allRows = buildRows(
      props.targets,
      activeLoadout,
      importedMasteryLevels!,
    );
    scope.equipmentSlots = buildEquipmentSlots(activeLoadout, currentOverrides);
    scope.potionDisplayOptions = buildPotionOptions(
      props.potionOptions,
      activeLoadout.activePotion,
    );
    scope.synergyDisplayOptions = buildSynergyOptions(
      props.synergyOptions,
      activeLoadout.activeSummoningSynergy,
    );
    scope.agilitySlots = buildAgilitySlots(importedLoadout!, currentOverrides);
    scope.hasAnyOverride = hasOverrides(currentOverrides);
    scope.recomputeFilteredRows();

    if (selectedTargetRow) {
      scope.detailDisplay = buildNpcDetail(
        selectedTargetRow.target,
        props.areas,
        activeLoadout,
        selectedTargetRow.masteryLevel,
        scope.confidenceAttempts,
      );
    }
  }

  return {
    $template: '#ts-modal',
    isOpen: false,
    hasImported: false,
    activeTab: 'simulate' as ModalTab,
    configDisplay: null,
    realmFilter: 'all' as RealmFilter,
    sortColumn: SortColumn.XP_HR,
    sortDirection: SortDirection.DESC,
    allRows: [],
    filteredRows: [],
    equipmentSlots: [],
    selectedSlot: null,
    slotOptions: [],
    selectedSlotName: '',
    potionDisplayOptions: [],
    synergyDisplayOptions: [],
    agilitySlots: [],
    hasAnyOverride: false,
    detailDisplay: null,
    confidenceAttempts: 1000,
    confidenceInput: '1000',

    setIsOpen() {
      this.isOpen = !this.isOpen;
    },

    setActiveTab(tab: ModalTab) {
      this.activeTab = tab;
      this.selectedSlot = null;
      this.slotOptions = [];
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
      currentOverrides = {};
      selectedTargetRow = null;
      this.hasImported = true;
      this.selectedSlot = null;
      this.slotOptions = [];
      this.detailDisplay = null;
      refreshDisplay(this);
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

    selectSlot(slotId: string) {
      this.selectedSlot = slotId;
      this.selectedSlotName = getSlotDisplayName(slotId);
      this.slotOptions = props.equipmentOptions[slotId] ?? [];
    },

    selectItem(option: EquipmentOption | null) {
      if (!this.selectedSlot || !importedLoadout || !importedMasteryLevels)
        return;

      const slotId = this.selectedSlot;
      if (!currentOverrides.equipment) currentOverrides.equipment = {};

      if (option) {
        const entry: EquippedItemEntry = {
          slotId,
          itemId: option.itemId,
          itemName: option.itemName,
          modifiers: option.modifiers,
        };
        currentOverrides.equipment[slotId] = entry;
      } else {
        currentOverrides.equipment[slotId] = null;
      }

      refreshDisplay(this);
    },

    clearSlot() {
      this.selectItem(null);
    },

    resetEquipment() {
      if (!importedLoadout || !importedMasteryLevels) return;
      delete currentOverrides.equipment;
      this.selectedSlot = null;
      this.slotOptions = [];
      refreshDisplay(this);
    },

    selectPotion(display: PotionOptionDisplay) {
      if (!importedLoadout || !importedMasteryLevels) return;
      const potion = props.potionOptions.find(
        (p) => p.itemId === display.itemId,
      );
      if (!potion) return;

      if (display.isSelected) {
        delete currentOverrides.activePotion;
      } else {
        currentOverrides.activePotion = potion;
      }
      refreshDisplay(this);
    },

    clearPotion() {
      if (!importedLoadout || !importedMasteryLevels) return;
      currentOverrides.activePotion = null;
      refreshDisplay(this);
    },

    selectSynergy(display: SynergyOptionDisplay) {
      if (!importedLoadout || !importedMasteryLevels) return;
      const synergy = props.synergyOptions[display.index];
      if (!synergy) return;

      if (display.isSelected) {
        delete currentOverrides.activeSummoningSynergy;
      } else {
        currentOverrides.activeSummoningSynergy = synergy;
      }
      refreshDisplay(this);
    },

    clearSynergy() {
      if (!importedLoadout || !importedMasteryLevels) return;
      currentOverrides.activeSummoningSynergy = null;
      refreshDisplay(this);
    },

    clearAgilitySlot(display: AgilitySlotDisplay) {
      if (!importedLoadout || !importedMasteryLevels) return;
      if (display.type === 'obstacle') {
        if (!currentOverrides.agilityObstacles) {
          currentOverrides.agilityObstacles = {};
        }
        currentOverrides.agilityObstacles[display.slot] = null;
      } else {
        if (!currentOverrides.agilityPillars) {
          currentOverrides.agilityPillars = {};
        }
        currentOverrides.agilityPillars[display.slot] = null;
      }
      refreshDisplay(this);
    },

    resetAll() {
      if (!importedLoadout || !importedMasteryLevels) return;
      currentOverrides = {};
      this.selectedSlot = null;
      this.slotOptions = [];
      refreshDisplay(this);
    },

    selectTarget(row: ComparisonRow) {
      if (!importedLoadout || !importedMasteryLevels) return;
      selectedTargetRow = row;
      const activeLoadout = getActiveLoadout();
      this.detailDisplay = buildNpcDetail(
        row.target,
        props.areas,
        activeLoadout,
        row.masteryLevel,
        this.confidenceAttempts,
      );
    },

    backToTable() {
      selectedTargetRow = null;
      this.detailDisplay = null;
    },

    setConfidenceAttempts(count: number) {
      if (!selectedTargetRow || !importedLoadout) return;
      this.confidenceAttempts = count;
      this.confidenceInput = String(count);
      const activeLoadout = getActiveLoadout();
      this.detailDisplay = buildNpcDetail(
        selectedTargetRow.target,
        props.areas,
        activeLoadout,
        selectedTargetRow.masteryLevel,
        count,
      );
    },

    applyConfidenceInput() {
      const parsed = parseInt(this.confidenceInput, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.setConfidenceAttempts(parsed);
      }
    },
  };
}
