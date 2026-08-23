import { MELVOR_AREAS } from '../../__fixtures__/areas';
import { MELVOR_TARGETS } from '../../__fixtures__/targets';
import type { ThievingLoadout } from '../../calc/types';
import { buildNpcDetail } from './detail-view.template';

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

describe('DetailViewTemplate', () => {
  describe('buildNpcDetail', () => {
    const target = MELVOR_TARGETS.find((t) => t.name === 'Woman')!;
    const areas = MELVOR_AREAS;
    const loadout = makeLoadout({ skillLevel: 99 });

    it('should return display with NPC name, area, and level', () => {
      const detail = buildNpcDetail(target, areas, loadout, 50, 1000);
      expect(detail.name).toBe('Woman');
      expect(detail.area).toBe('Low Town');
      expect(detail.level).toBe(4);
    });

    it('should include formatted stats', () => {
      const detail = buildNpcDetail(target, areas, loadout, 50, 1000);
      expect(detail.formattedSuccessRate).toMatch(/%$/);
      expect(detail.formattedXpHr).toBeTruthy();
      expect(detail.formattedInterval).toMatch(/s$/);
      expect(detail.formattedStunDuration).toMatch(/s$/);
    });

    it('should populate loot table with currency, common, NPC unique, area uniques, and rares', () => {
      const detail = buildNpcDetail(target, areas, loadout, 50, 1000);
      const categories = detail.lootTable.map((e) => e.categoryLabel);
      expect(categories).toContain('Currency');
      expect(categories).toContain('Common');
      expect(categories).toContain('Unique');
      expect(categories).toContain('Area');
      expect(categories).toContain('Rare');
    });

    it('should populate confidence table excluding guaranteed drops', () => {
      const detail = buildNpcDetail(target, areas, loadout, 50, 1000);
      expect(detail.confidenceTable.length).toBeGreaterThan(0);
      for (const entry of detail.confidenceTable) {
        expect(entry.formattedProbability).toMatch(/%$/);
        expect(entry.attemptsFor50).toBeTruthy();
        expect(entry.attemptsFor90).toBeTruthy();
        expect(entry.attemptsFor99).toBeTruthy();
      }
    });

    it('should use the provided mastery level', () => {
      const detail = buildNpcDetail(target, areas, loadout, 75, 1000);
      expect(detail.masteryLevel).toBe(75);
    });

    it('should update confidence when attempts change', () => {
      const detail1 = buildNpcDetail(target, areas, loadout, 50, 1);
      const detail10000 = buildNpcDetail(target, areas, loadout, 50, 10000);
      const conf1 = detail1.confidenceTable[0]?.formattedProbability;
      const conf10000 = detail10000.confidenceTable[0]?.formattedProbability;
      expect(conf1).not.toBe(conf10000);
    });

    it('should set realm label to Melvor for Melvor targets', () => {
      const detail = buildNpcDetail(target, areas, loadout, 50, 1000);
      expect(detail.realm).toBe('Melvor');
    });
  });
});
