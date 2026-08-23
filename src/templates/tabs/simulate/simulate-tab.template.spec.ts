import { MELVOR_TARGETS } from '../../../__fixtures__/targets';
import type { ThievingLoadout } from '../../../calc/types';
import { buildRows } from './simulate-tab.template';

function makeLoadout(
  overrides: Partial<ThievingLoadout> = {},
): ThievingLoadout {
  return {
    equipment: [],
    masteryLevel: 0,
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
    ...overrides,
  };
}

describe('SimulateTabTemplate', () => {
  describe('buildRows', () => {
    const targets = MELVOR_TARGETS.slice(0, 3);
    const loadout = makeLoadout({ skillLevel: 99 });
    const masteryLevels = new Map<string, number>([
      ['melvorF:Man', 50],
      ['melvorF:Woman', 10],
      ['melvorF:Golbin', 1],
    ]);

    it('should produce one row per target', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      expect(rows).toHaveLength(3);
    });

    it('should use per-NPC mastery levels from the map', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      expect(rows[0].masteryLevel).toBe(50);
      expect(rows[1].masteryLevel).toBe(10);
      expect(rows[2].masteryLevel).toBe(1);
    });

    it('should default to mastery 1 when NPC is not in the map', () => {
      const rows = buildRows(targets, loadout, new Map());
      expect(rows[0].masteryLevel).toBe(1);
    });

    it('should compute positive XP/hr for all targets', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      for (const row of rows) {
        expect(row.result.xpPerHour).toBeGreaterThan(0);
      }
    });

    it('should format XP/hr as a string', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      for (const row of rows) {
        expect(row.formattedXpHr).toMatch(/^\d|K|M/);
      }
    });

    it('should format success rate as a percentage', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      for (const row of rows) {
        expect(row.formattedSuccess).toMatch(/%$/);
      }
    });

    it('should yield higher success rate for NPC with more mastery', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      const manRow = rows.find((r) => r.target.name === 'Man')!;
      const golbinRow = rows.find((r) => r.target.name === 'Golbin')!;
      expect(manRow.result.successRate).toBeGreaterThan(
        golbinRow.result.successRate,
      );
    });

    it('should set currency label based on target currency type', () => {
      const rows = buildRows(targets, loadout, masteryLevels);
      for (const row of rows) {
        expect(row.currencyLabel).toBe('GP');
      }
    });
  });
});
