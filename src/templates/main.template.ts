import type {
  EquipmentOption,
  EquippedItemEntry,
  LoadoutOverrides,
  Potion,
  SummoningSynergyInfo,
  ThievingArea,
  ThievingLoadout,
  ThievingTarget,
} from '../calc/types';
import { RealmName } from '../constants/game.constants';
import { ThievingEquipmentSlotId } from '../constants/item-ids';
import { applyOverrides } from '../state/overrides';
import { formatModifiers } from '../utils/modifier-format';

const SUMMON_SLOT_IDS = new Set<string>([
  ThievingEquipmentSlotId.SUMMON1,
  ThievingEquipmentSlotId.SUMMON2,
]);
import {
  buildNpcDetail,
  type NpcDetailDisplay,
} from './detail-view/detail-view.template';
import {
  buildConfigDisplay,
  type ConfigDisplay,
} from './tabs/config/config-tab.template';
import {
  buildEquipmentSlots,
  type EquipmentSlotDisplay,
  getSlotDisplayName,
} from './tabs/equipment/equipment-tab.template';
import {
  buildRows,
  type ComparisonRow,
  REALM_FILTER_MAP,
  type RealmFilter,
  SortColumn,
  SortDirection,
  sortRows,
} from './tabs/simulate/simulate-tab.template';

export type ModalTab = 'simulate' | 'equipment' | 'config';

export interface PotionOptionDisplay {
  itemId: string;
  itemName: string;
  tier: number;
  isSelected: boolean;
  mediaUrl?: string;
}

export interface SynergyOptionDisplay {
  index: number;
  name: string;
  description: string;
  isSelected: boolean;
  summon1MediaUrl?: string;
  summon2MediaUrl?: string;
}

export interface AgilitySlotDisplay {
  slot: number;
  name: string;
  type: 'obstacle' | 'pillar';
  isCleared: boolean;
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
  slotOptions: (EquipmentOption & { formattedModifiers: string })[];
  selectedSlotName: string;
  potionDisplayOptions: PotionOptionDisplay[];
  synergyDisplayOptions: SynergyOptionDisplay[];
  agilitySlots: AgilitySlotDisplay[];
  hasAnyOverride: boolean;
  detailDisplay: NpcDetailDisplay | null;
  confidenceAttempts: number;
  confidenceInput: string;
  SimulateTab: () => ComponentProps;
  DetailView: () => ComponentProps;
  EquipmentTab: () => ComponentProps;
  ConfigTab: () => ComponentProps;
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
    ...(p.mediaUrl !== undefined && { mediaUrl: p.mediaUrl }),
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
    ...(s.summon1MediaUrl !== undefined && { summon1MediaUrl: s.summon1MediaUrl }),
    ...(s.summon2MediaUrl !== undefined && { summon2MediaUrl: s.summon2MediaUrl }),
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

/**
 * Finds a synergy matching both summon familiar item IDs (order-independent).
 *
 * @returns The matching synergy, or undefined if no pair matches.
 */
export function findMatchingSynergy(
  summon1ItemId: string | undefined,
  summon2ItemId: string | undefined,
  synergies: SummoningSynergyInfo[],
): SummoningSynergyInfo | undefined {
  if (!summon1ItemId || !summon2ItemId) return undefined;
  return synergies.find(
    (s) =>
      (s.summon1Id === summon1ItemId && s.summon2Id === summon2ItemId) ||
      (s.summon1Id === summon2ItemId && s.summon2Id === summon1ItemId),
  );
}

/**
 * Finds the equipment option for a familiar in a given slot's options.
 *
 * @returns The matching equipment option, or undefined if not found.
 */
export function findEquipmentForFamiliar(
  slotId: string,
  familiarId: string,
  equipmentOptions: Record<string, EquipmentOption[]>,
): EquipmentOption | undefined {
  return equipmentOptions[slotId]?.find((o) => o.itemId === familiarId);
}

/** Returns true if any override field is set (not undefined). */
function hasOverrides(overrides: LoadoutOverrides): boolean {
  return Object.values(overrides).some((v) => v !== undefined);
}

export const ZERO_LOADOUT: ThievingLoadout = {
  equipment: [],
  masteryLevel: 1,
  melvorMasteryPoolPercent: 0,
  abyssalMasteryPoolPercent: 0,
  activePotion: undefined,
  activePrayers: undefined,
  agilityObstacles: [],
  agilityPillars: [],
  astrologyConstellations: [],
  activePets: [],
  shopPurchases: [],
  activeSummoningSynergy: undefined,
  skillLevel: 1,
  abyssalSkillLevel: 1,
};

export default function MainModal(
  props: MainModalInputProps,
): Component<MainModalScope> {
  let importedLoadout: ThievingLoadout = ZERO_LOADOUT;
  let importedMasteryLevels: Map<string, number> = new Map();
  let currentOverrides: LoadoutOverrides = {};
  let selectedTargetRow: ComparisonRow | null = null;

  function getActiveLoadout(): ThievingLoadout {
    return applyOverrides(importedLoadout, currentOverrides);
  }

  /** Reads the effective item ID for a summon slot from overrides or the imported loadout. */
  function getSummonItemId(slotId: string): string | undefined {
    if (currentOverrides.equipment && slotId in currentOverrides.equipment) {
      return currentOverrides.equipment[slotId]?.itemId;
    }
    return importedLoadout.equipment.find((e) => e.slotId === slotId)?.itemId;
  }

  /** Auto-sets or clears the synergy override based on the current summon slot state. */
  function autoLinkSynergy(): void {
    const summon1Id = getSummonItemId(ThievingEquipmentSlotId.SUMMON1);
    const summon2Id = getSummonItemId(ThievingEquipmentSlotId.SUMMON2);
    const match = findMatchingSynergy(summon1Id, summon2Id, props.synergyOptions);
    if (match) {
      currentOverrides.activeSummoningSynergy = match;
    } else {
      currentOverrides.activeSummoningSynergy = null;
    }
  }

  /** Refreshes all derived display state from the current loadout and overrides. */
  function refreshDisplay(scope: MainModalScope): void {
    const activeLoadout = getActiveLoadout();
    scope.configDisplay = buildConfigDisplay(activeLoadout);
    scope.allRows = buildRows(
      props.targets,
      activeLoadout,
      importedMasteryLevels,
    );
    scope.equipmentSlots = buildEquipmentSlots(activeLoadout, currentOverrides, props.equipmentOptions);
    scope.potionDisplayOptions = buildPotionOptions(
      props.potionOptions,
      activeLoadout.activePotion,
    );
    scope.synergyDisplayOptions = buildSynergyOptions(
      props.synergyOptions,
      activeLoadout.activeSummoningSynergy,
    );
    scope.agilitySlots = buildAgilitySlots(importedLoadout, currentOverrides);
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

  const initialRows = buildRows(props.targets, ZERO_LOADOUT, importedMasteryLevels);
  const initialSorted = sortRows(initialRows, SortColumn.LEVEL, SortDirection.ASC);

  return {
    $template: '#ts-modal',
    isOpen: false,
    hasImported: false,
    activeTab: 'simulate' as ModalTab,
    configDisplay: buildConfigDisplay(ZERO_LOADOUT),
    realmFilter: 'all' as RealmFilter,
    sortColumn: SortColumn.LEVEL,
    sortDirection: SortDirection.ASC,
    allRows: initialRows,
    filteredRows: initialSorted,
    equipmentSlots: buildEquipmentSlots(ZERO_LOADOUT, {}, props.equipmentOptions),
    selectedSlot: null,
    slotOptions: [],
    selectedSlotName: '',
    potionDisplayOptions: buildPotionOptions(props.potionOptions, undefined),
    synergyDisplayOptions: buildSynergyOptions(props.synergyOptions, undefined),
    agilitySlots: [],
    hasAnyOverride: false,
    detailDisplay: null,
    confidenceAttempts: 1000,
    confidenceInput: '1000',
    SimulateTab: () => ({ $template: '#ts-simulate-tab' }),
    DetailView: () => ({ $template: '#ts-detail-view' }),
    EquipmentTab: () => ({ $template: '#ts-equipment-tab' }),
    ConfigTab: () => ({ $template: '#ts-config-tab' }),

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
      const options = props.equipmentOptions[slotId];
      if (!options || options.length === 0) return;

      this.selectedSlot = slotId;
      this.selectedSlotName = getSlotDisplayName(slotId);
      this.slotOptions = options.map((o) => ({
        ...o,
        formattedModifiers: formatModifiers(o.modifiers),
      }));
    },

    selectItem(option: EquipmentOption | null) {
      if (!this.selectedSlot) return;

      const slotId = this.selectedSlot;
      if (!currentOverrides.equipment) currentOverrides.equipment = {};

      if (option) {
        const entry: EquippedItemEntry = {
          slotId,
          itemId: option.itemId,
          itemName: option.itemName,
          modifiers: option.modifiers,
          ...(option.mediaUrl !== undefined && { mediaUrl: option.mediaUrl }),
        };
        currentOverrides.equipment[slotId] = entry;
      } else {
        currentOverrides.equipment[slotId] = null;
      }

      if (SUMMON_SLOT_IDS.has(slotId)) {
        autoLinkSynergy();
      }

      refreshDisplay(this);
    },

    clearSlot() {
      if (this.selectedSlot && SUMMON_SLOT_IDS.has(this.selectedSlot)) {
        if (!currentOverrides.equipment) currentOverrides.equipment = {};
        currentOverrides.equipment[this.selectedSlot] = null;
        autoLinkSynergy();
        refreshDisplay(this);
        return;
      }
      this.selectItem(null);
    },

    resetEquipment() {
      delete currentOverrides.equipment;
      this.selectedSlot = null;
      this.slotOptions = [];
      refreshDisplay(this);
    },

    selectPotion(display: PotionOptionDisplay) {
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
      currentOverrides.activePotion = null;
      refreshDisplay(this);
    },

    selectSynergy(display: SynergyOptionDisplay) {
      const synergy = props.synergyOptions[display.index];
      if (!synergy) return;

      if (display.isSelected) {
        delete currentOverrides.activeSummoningSynergy;
      } else {
        currentOverrides.activeSummoningSynergy = synergy;

        if (!currentOverrides.equipment) currentOverrides.equipment = {};
        const summon1Option = findEquipmentForFamiliar(
          ThievingEquipmentSlotId.SUMMON1,
          synergy.summon1Id,
          props.equipmentOptions,
        );
        const summon2Option = findEquipmentForFamiliar(
          ThievingEquipmentSlotId.SUMMON2,
          synergy.summon2Id,
          props.equipmentOptions,
        );
        if (summon1Option) {
          currentOverrides.equipment[ThievingEquipmentSlotId.SUMMON1] = {
            slotId: ThievingEquipmentSlotId.SUMMON1,
            itemId: summon1Option.itemId,
            itemName: summon1Option.itemName,
            modifiers: summon1Option.modifiers,
            ...(summon1Option.mediaUrl !== undefined && { mediaUrl: summon1Option.mediaUrl }),
          };
        }
        if (summon2Option) {
          currentOverrides.equipment[ThievingEquipmentSlotId.SUMMON2] = {
            slotId: ThievingEquipmentSlotId.SUMMON2,
            itemId: summon2Option.itemId,
            itemName: summon2Option.itemName,
            modifiers: summon2Option.modifiers,
            ...(summon2Option.mediaUrl !== undefined && { mediaUrl: summon2Option.mediaUrl }),
          };
        }
      }
      refreshDisplay(this);
    },

    clearSynergy() {
      currentOverrides.activeSummoningSynergy = null;
      refreshDisplay(this);
    },

    clearAgilitySlot(display: AgilitySlotDisplay) {
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
      currentOverrides = {};
      this.selectedSlot = null;
      this.slotOptions = [];
      refreshDisplay(this);
    },

    selectTarget(row: ComparisonRow) {
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
      if (!selectedTargetRow) return;
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
