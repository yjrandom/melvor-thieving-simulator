import type { Modifier } from '../calc/types';
import { ThievingBoostId, ThievingRealmId } from '../constants/item-ids';

interface BoostDisplayConfig {
  label: string;
  /** Format function producing the sign + value string (e.g. "+10", "-0.2s"). */
  format: (value: number) => string;
}

const BOOST_DISPLAY: Readonly<Record<ThievingBoostId, BoostDisplayConfig>> = {
  [ThievingBoostId.STEALTH]: {
    label: 'Stealth',
    format: (v) => `+${v}`,
  },
  [ThievingBoostId.FLAT_SKILL_INTERVAL]: {
    label: 'Interval',
    format: (v) => `-${v / 1000}s`,
  },
  [ThievingBoostId.SKILL_INTERVAL]: {
    label: 'Interval',
    format: (v) => `-${v}%`,
  },
  [ThievingBoostId.AREA_UNIQUE_CHANCE]: {
    label: 'Area Unique',
    format: (v) => `+${v}`,
  },
  [ThievingBoostId.AREA_UNIQUE_CHANCE_PERCENT]: {
    label: 'Area Unique',
    format: (v) => `+${v}%`,
  },
  [ThievingBoostId.STUN_AVOID_CHANCE]: {
    label: 'Stun Avoid',
    format: (v) => `+${v}%`,
  },
  [ThievingBoostId.IGNORE_THIEVING_DAMAGE_CHANCE]: {
    label: 'Ignore Damage',
    format: (v) => `+${v}%`,
  },
  [ThievingBoostId.THIEVING_STUN_INTERVAL]: {
    label: 'Stun Duration',
    format: (v) => `-${v}%`,
  },
  [ThievingBoostId.SKILL_XP]: {
    label: 'XP',
    format: (v) => `+${v}%`,
  },
  [ThievingBoostId.GLOBAL_ITEM_DOUBLING_CHANCE]: {
    label: 'Item Doubling',
    format: (v) => `+${v}%`,
  },
};

const REALM_SUFFIX: Readonly<Record<string, string>> = {
  [ThievingRealmId.MELVOR]: ' (Melvor)',
  [ThievingRealmId.ABYSSAL]: ' (Abyssal)',
};

/**
 * Formats a single modifier into a human-readable string.
 *
 * @returns Formatted string (e.g. "+10 Stealth", "-0.2s Interval (Melvor)"), or empty string if unknown.
 */
export function formatModifier(modifier: Modifier): string {
  const config = BOOST_DISPLAY[modifier.boostId];
  if (!config) return '';

  const formatted = `${config.format(modifier.value)} ${config.label}`;
  const realmSuffix = modifier.realmId ? (REALM_SUFFIX[modifier.realmId] ?? '') : '';
  return formatted + realmSuffix;
}

/**
 * Formats an array of modifiers into a comma-separated human-readable string.
 *
 * @returns Comma-separated formatted modifiers, or empty string if none.
 */
export function formatModifiers(modifiers: Modifier[]): string {
  return modifiers.map(formatModifier).filter(Boolean).join(', ');
}
