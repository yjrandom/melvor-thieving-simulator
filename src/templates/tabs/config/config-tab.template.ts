import type { ThievingLoadout } from '../../../calc/types';
import { formatPercent } from '../../../utils/number-utils';
import { getSlotDisplayName } from '../equipment/equipment-tab.template';

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
