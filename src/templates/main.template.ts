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
import { applyOverrides } from '../state/overrides';
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
}

export interface SynergyOptionDisplay {
  index: number;
  name: string;
  description: string;
  isSelected: boolean;
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
  slotOptions: EquipmentOption[];
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

/** Returns true if any override field is set (not undefined). */
function hasOverrides(overrides: LoadoutOverrides): boolean {
  return Object.values(overrides).some((v) => v !== undefined);
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
