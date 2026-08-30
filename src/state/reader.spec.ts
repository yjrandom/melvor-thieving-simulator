import type { EquipmentOption, SummoningSynergyInfo } from '../calc/types';
import {
  THIEVING_SKILL_ID,
  ThievingBoostId,
  ThievingEquipmentSlotId,
  ThievingRealmId,
} from '../constants/item-ids';
import {
  injectSynergyFamiliars,
  readAllMasteryLevels,
  readAreas,
  readEquipmentOptions,
  readLoadout,
  readPotionOptions,
  readSynergyOptions,
  readTargets,
} from './reader';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function makeNpc(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test:farmer',
    name: 'Farmer',
    perception: 20,
    maxHit: 10,
    baseExperience: 8,
    level: 1,
    currencyDrops: [{ currency: { id: 'melvorD:GP' }, quantity: 50 }],
    area: { realm: { id: ThievingRealmId.MELVOR }, name: 'Low Town' },
    uniqueDrop: undefined as { item: { name: string }; quantity: number } | undefined,
    ...overrides,
  };
}

function makeGameArea(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Low Town',
    realm: { name: 'melvor' },
    npcs: [{ level: 1 }],
    uniqueDrops: [] as { item: { name: string }; quantity: number }[],
    ...overrides,
  };
}

function makeThieving(overrides: Record<string, unknown> = {}) {
  return {
    actions: {
      allObjects: [] as ReturnType<typeof makeNpc>[],
    },
    areas: {
      allObjects: [] as ReturnType<typeof makeGameArea>[],
    },
    getMasteryLevel: jest.fn().mockReturnValue(1),
    getMasteryPoolCap: jest.fn().mockReturnValue(0),
    getMasteryPoolXP: jest.fn().mockReturnValue(0),
    level: 99,
    abyssalLevel: 1,
    ...overrides,
  } as unknown as Thieving;
}

function makeModifierValue(
  modifierId: string,
  value: number,
  skillId?: string,
  realmId?: string,
) {
  return {
    modifier: { id: modifierId },
    value,
    skill: skillId ? { id: skillId } : undefined,
    realm: realmId ? { id: realmId } : undefined,
  } as unknown as ModifierValue;
}

function makeEquipmentItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test:gloves',
    name: 'Test Gloves',
    modifiers: [] as unknown as ModifierValue[],
    validSlots: [{ id: ThievingEquipmentSlotId.GLOVES }],
    media: 'gloves.png',
    ...overrides,
  };
}

function makeGameSynergy(overrides: Record<string, unknown> = {}) {
  return {
    summons: [
      {
        product: { id: 'test:leprechaun', media: 'leprechaun.png' },
        skills: [],
      },
      {
        product: { id: 'test:devil', media: 'devil.png' },
        skills: [],
      },
    ],
    name: 'Leprechaun + Devil',
    description: 'Gamble synergy',
    modifiers: [] as unknown as ModifierValue[],
    consumesOn: [{ type: 'ThievingAction' }],
    ...overrides,
  };
}

function makeGame(overrides: Record<string, unknown> = {}) {
  const thieving = makeThieving();
  return {
    thieving,
    items: {
      equipment: {
        allObjects: [] as ReturnType<typeof makeEquipmentItem>[],
        getObjectByID: jest.fn().mockReturnValue(undefined),
      },
      potions: {
        allObjects: [] as { id: string; name: string; tier: number; action: unknown; stats: { modifiers: ModifierValue[] }; media: string }[],
      },
    },
    summoning: {
      synergies: [] as ReturnType<typeof makeGameSynergy>[],
    },
    combat: {
      player: {
        equipment: {
          isSlotEmpty: jest.fn().mockReturnValue(true),
          getItemInSlot: jest.fn(),
        },
        activeSummoningSynergy: undefined,
        activePrayers: new Set(),
      },
    },
    potions: {
      getActivePotionForAction: jest.fn().mockReturnValue(undefined),
    },
    agility: {
      courses: new Map(),
    },
    astrology: {
      actions: { allObjects: [] },
    },
    petManager: {
      unlocked: [] as { id: string; name: string }[],
    },
    shop: {
      upgradesPurchased: new Map(),
    },
    realms: {
      getObjectByID: jest.fn().mockReturnValue(undefined),
    },
    ...overrides,
  } as unknown as Game;
}

function makeSynergyInfo(overrides: Partial<SummoningSynergyInfo> = {}): SummoningSynergyInfo {
  return {
    summon1Id: 'test:leprechaun',
    summon2Id: 'test:devil',
    name: 'Leprechaun + Devil',
    description: 'Gamble synergy',
    modifiers: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Reader', () => {
  describe('readTargets', () => {
    it('should map basic NPC fields', () => {
      const npc = makeNpc();
      const thieving = makeThieving();
      thieving.actions.allObjects = [npc] as never;

      const [target] = readTargets(thieving);

      expect(target.id).toBe('test:farmer');
      expect(target.name).toBe('Farmer');
      expect(target.perception).toBe(20);
      expect(target.maxHit).toBe(10);
      expect(target.baseExperience).toBe(8);
      expect(target.level).toBe(1);
    });

    describe('currency resolution', () => {
      it.each`
        scenario             | currencyId                  | quantity | expectedType | expectedRange
        ${'GP currency'}     | ${'melvorD:GP'}             | ${50}    | ${'gp'}      | ${{ min: 1, max: 50 }}
        ${'AP currency'}     | ${'melvorItA:AbyssalPieces'} | ${100}   | ${'ap'}      | ${{ min: 1, max: 100 }}
        ${'unknown currency'} | ${'modded:Custom'}          | ${30}    | ${'gp'}      | ${{ min: 1, max: 30 }}
      `('$scenario', ({ currencyId, quantity, expectedType, expectedRange }) => {
        const npc = makeNpc({
          currencyDrops: [{ currency: { id: currencyId }, quantity }],
        });
        const thieving = makeThieving();
        thieving.actions.allObjects = [npc] as never;

        const [target] = readTargets(thieving);

        expect(target.currencyType).toBe(expectedType);
        expect(target.currencyRange).toEqual(expectedRange);
      });
    });

    it('should default to GP with zero range when no currency drops', () => {
      const npc = makeNpc({ currencyDrops: [] });
      const thieving = makeThieving();
      thieving.actions.allObjects = [npc] as never;

      const [target] = readTargets(thieving);

      expect(target.currencyType).toBe('gp');
      expect(target.currencyRange).toEqual({ min: 0, max: 0 });
    });

    it('should include unique drop when present', () => {
      const npc = makeNpc({
        uniqueDrop: { item: { name: 'Farmer Straw Hat' }, quantity: 1 },
      });
      const thieving = makeThieving();
      thieving.actions.allObjects = [npc] as never;

      const [target] = readTargets(thieving);

      expect(target.uniqueDrop).toEqual({
        name: 'Farmer Straw Hat',
        dropQuantity: { min: 1, max: 1 },
      });
    });

    it('should omit unique drop when absent', () => {
      const npc = makeNpc({ uniqueDrop: undefined });
      const thieving = makeThieving();
      thieving.actions.allObjects = [npc] as never;

      const [target] = readTargets(thieving);

      expect(target.uniqueDrop).toBeUndefined();
    });

    describe('realm resolution', () => {
      it.each`
        scenario           | areaRealmId                  | expectedRealmId
        ${'Melvor realm'}  | ${ThievingRealmId.MELVOR}    | ${ThievingRealmId.MELVOR}
        ${'Abyssal realm'} | ${ThievingRealmId.ABYSSAL}   | ${ThievingRealmId.ABYSSAL}
      `('$scenario', ({ areaRealmId, expectedRealmId }) => {
        const npc = makeNpc({
          area: { realm: { id: areaRealmId }, name: 'Test Area' },
        });
        const thieving = makeThieving();
        thieving.actions.allObjects = [npc] as never;

        const [target] = readTargets(thieving);

        expect(target.realmId).toBe(expectedRealmId);
      });
    });

    it('should default to Melvor realm when area is undefined', () => {
      const npc = makeNpc({ area: undefined });
      const thieving = makeThieving();
      thieving.actions.allObjects = [npc] as never;

      const [target] = readTargets(thieving);

      expect(target.realmId).toBe(ThievingRealmId.MELVOR);
      expect(target.area).toBe('');
    });
  });

  describe('readAreas', () => {
    it('should map area fields', () => {
      const area = makeGameArea({
        name: 'Bandit Camp',
        realm: { name: 'melvor' },
        npcs: [
          { name: 'Bandit', level: 20 },
          { name: 'Bandit Leader', level: 40 },
        ],
      });
      const thieving = makeThieving();
      thieving.areas.allObjects = [area] as never;

      const [result] = readAreas(thieving);

      expect(result.name).toBe('Bandit Camp');
      expect(result.realm).toBe('melvor');
      expect(result.levelRequirement).toBe(20);
      expect(result.targets).toEqual(['Bandit', 'Bandit Leader']);
    });

    it('should map area unique drops', () => {
      const area = makeGameArea({
        uniqueDrops: [{ item: { name: 'Bandit Map' }, quantity: 1 }],
      });
      const thieving = makeThieving();
      thieving.areas.allObjects = [area] as never;

      const [result] = readAreas(thieving);

      expect(result.areaUniqueDrops).toEqual([
        { name: 'Bandit Map', dropQuantity: { min: 1, max: 1 } },
      ]);
    });

    it('should default level requirement to 1 when area has no NPCs', () => {
      const area = makeGameArea({ npcs: [] });
      const thieving = makeThieving();
      thieving.areas.allObjects = [area] as never;

      const [result] = readAreas(thieving);

      expect(result.levelRequirement).toBe(1);
    });
  });

  describe('readAllMasteryLevels', () => {
    it('should return a map of NPC ID to mastery level', () => {
      const npcs = [makeNpc({ id: 'npc:a' }), makeNpc({ id: 'npc:b' })];
      const getMasteryLevel = jest.fn()
        .mockReturnValueOnce(45)
        .mockReturnValueOnce(99);
      const thieving = makeThieving({ getMasteryLevel });
      thieving.actions.allObjects = npcs as never;

      const levels = readAllMasteryLevels(thieving);

      expect(levels.get('npc:a')).toBe(45);
      expect(levels.get('npc:b')).toBe(99);
      expect(levels.size).toBe(2);
    });

    it('should return an empty map when no NPCs exist', () => {
      const thieving = makeThieving();

      const levels = readAllMasteryLevels(thieving);

      expect(levels.size).toBe(0);
    });
  });

  describe('readEquipmentOptions', () => {
    it('should include items with thieving-relevant modifiers', () => {
      const item = makeEquipmentItem({
        id: 'test:stealth-gloves',
        name: 'Stealth Gloves',
        modifiers: [
          makeModifierValue(ThievingBoostId.STEALTH, 50),
        ],
      });
      const game = makeGame();
      game.items.equipment.allObjects = [item] as never;

      const options = readEquipmentOptions(game);

      expect(options[ThievingEquipmentSlotId.GLOVES]).toHaveLength(1);
      expect(options[ThievingEquipmentSlotId.GLOVES][0].itemId).toBe('test:stealth-gloves');
    });

    it('should exclude items without thieving-relevant modifiers', () => {
      const item = makeEquipmentItem({
        modifiers: [
          makeModifierValue('melvorD:miningNodeHP', 10),
        ],
      });
      const game = makeGame();
      game.items.equipment.allObjects = [item] as never;

      const options = readEquipmentOptions(game);

      expect(options[ThievingEquipmentSlotId.GLOVES]).toBeUndefined();
    });

    it('should exclude items with thieving boost IDs scoped to a non-thieving skill', () => {
      const item = makeEquipmentItem({
        modifiers: [
          makeModifierValue(ThievingBoostId.STEALTH, 50, 'melvorD:Mining'),
        ],
      });
      const game = makeGame();
      game.items.equipment.allObjects = [item] as never;

      const options = readEquipmentOptions(game);

      expect(options[ThievingEquipmentSlotId.GLOVES]).toBeUndefined();
    });

    it('should include items with modifiers scoped to thieving', () => {
      const item = makeEquipmentItem({
        modifiers: [
          makeModifierValue(ThievingBoostId.STEALTH, 50, THIEVING_SKILL_ID),
        ],
      });
      const game = makeGame();
      game.items.equipment.allObjects = [item] as never;

      const options = readEquipmentOptions(game);

      expect(options[ThievingEquipmentSlotId.GLOVES]).toHaveLength(1);
    });

    it('should exclude items whose valid slots are not thieving equipment slots', () => {
      const item = makeEquipmentItem({
        modifiers: [makeModifierValue(ThievingBoostId.STEALTH, 50)],
        validSlots: [{ id: 'melvorD:SomeOtherSlot' }],
      });
      const game = makeGame();
      game.items.equipment.allObjects = [item] as never;

      const options = readEquipmentOptions(game);

      expect(Object.keys(options)).toHaveLength(0);
    });

    it('should group items by valid slot', () => {
      const cape = makeEquipmentItem({
        id: 'test:cape',
        name: 'Thieving Cape',
        modifiers: [makeModifierValue(ThievingBoostId.STEALTH, 10)],
        validSlots: [{ id: ThievingEquipmentSlotId.CAPE }],
      });
      const gloves = makeEquipmentItem({
        id: 'test:gloves',
        name: 'Thieving Gloves',
        modifiers: [makeModifierValue(ThievingBoostId.STEALTH, 20)],
        validSlots: [{ id: ThievingEquipmentSlotId.GLOVES }],
      });
      const game = makeGame();
      game.items.equipment.allObjects = [cape, gloves] as never;

      const options = readEquipmentOptions(game);

      expect(options[ThievingEquipmentSlotId.CAPE]).toHaveLength(1);
      expect(options[ThievingEquipmentSlotId.GLOVES]).toHaveLength(1);
      expect(options[ThievingEquipmentSlotId.CAPE][0].itemId).toBe('test:cape');
      expect(options[ThievingEquipmentSlotId.GLOVES][0].itemId).toBe('test:gloves');
    });

    it('should sort options alphabetically within each slot', () => {
      const items = ['Zephyr Gloves', 'Alpha Gloves', 'Mystic Gloves'].map(
        (name, i) =>
          makeEquipmentItem({
            id: `test:gloves-${i}`,
            name,
            modifiers: [makeModifierValue(ThievingBoostId.STEALTH, 10)],
          }),
      );
      const game = makeGame();
      game.items.equipment.allObjects = items as never;

      const options = readEquipmentOptions(game);
      const names = options[ThievingEquipmentSlotId.GLOVES].map((o) => o.itemName);

      expect(names).toEqual(['Alpha Gloves', 'Mystic Gloves', 'Zephyr Gloves']);
    });

    it('should resolve realm-scoped modifiers on items', () => {
      const item = makeEquipmentItem({
        modifiers: [
          makeModifierValue(ThievingBoostId.STEALTH, 50, undefined, 'melvorD:Melvor'),
        ],
      });
      const game = makeGame();
      game.items.equipment.allObjects = [item] as never;

      const options = readEquipmentOptions(game);

      expect(options[ThievingEquipmentSlotId.GLOVES][0].modifiers).toEqual([
        { boostId: ThievingBoostId.STEALTH, value: 50, realmId: 'melvorD:Melvor' },
      ]);
    });

    it('should strip non-thieving-skill-scoped modifiers from resolved output', () => {
      const item = makeEquipmentItem({
        modifiers: [
          makeModifierValue(ThievingBoostId.STEALTH, 50),
          makeModifierValue(ThievingBoostId.STEALTH, 30, 'melvorD:Mining'),
        ],
      });
      const game = makeGame();
      game.items.equipment.allObjects = [item] as never;

      const options = readEquipmentOptions(game);

      expect(options[ThievingEquipmentSlotId.GLOVES][0].modifiers).toHaveLength(1);
      expect(options[ThievingEquipmentSlotId.GLOVES][0].modifiers[0].value).toBe(50);
    });
  });

  describe('injectSynergyFamiliars', () => {
    it('should inject missing familiar tablets into SUMMON1 and SUMMON2', () => {
      const optionsBySlot: Record<string, EquipmentOption[]> = {};
      const synergies = [makeSynergyInfo()];
      const leprechaun = makeEquipmentItem({ id: 'test:leprechaun', name: 'Leprechaun' });
      const devil = makeEquipmentItem({ id: 'test:devil', name: 'Devil' });
      const game = makeGame();
      (game.items.equipment.getObjectByID as jest.Mock).mockImplementation(
        (id: string) => {
          if (id === 'test:leprechaun') return leprechaun;
          if (id === 'test:devil') return devil;
          return undefined;
        },
      );

      injectSynergyFamiliars(optionsBySlot, synergies, game);

      expect(optionsBySlot[ThievingEquipmentSlotId.SUMMON1]).toHaveLength(2);
      expect(optionsBySlot[ThievingEquipmentSlotId.SUMMON2]).toHaveLength(2);
    });

    it('should not duplicate entries already present', () => {
      const existing: EquipmentOption = {
        itemId: 'test:leprechaun',
        itemName: 'Leprechaun',
        modifiers: [],
      };
      const optionsBySlot: Record<string, EquipmentOption[]> = {
        [ThievingEquipmentSlotId.SUMMON1]: [existing],
        [ThievingEquipmentSlotId.SUMMON2]: [existing],
      };
      const synergies = [makeSynergyInfo({ summon1Id: 'test:leprechaun', summon2Id: 'test:devil' })];
      const devil = makeEquipmentItem({ id: 'test:devil', name: 'Devil' });
      const game = makeGame();
      (game.items.equipment.getObjectByID as jest.Mock).mockImplementation(
        (id: string) => (id === 'test:devil' ? devil : undefined),
      );

      injectSynergyFamiliars(optionsBySlot, synergies, game);

      const summon1Ids = optionsBySlot[ThievingEquipmentSlotId.SUMMON1].map((o) => o.itemId);
      expect(summon1Ids.filter((id) => id === 'test:leprechaun')).toHaveLength(1);
    });

    it('should skip familiars not found in game items', () => {
      const optionsBySlot: Record<string, EquipmentOption[]> = {};
      const synergies = [makeSynergyInfo({ summon1Id: 'test:missing', summon2Id: 'test:also-missing' })];
      const game = makeGame();

      injectSynergyFamiliars(optionsBySlot, synergies, game);

      expect(optionsBySlot[ThievingEquipmentSlotId.SUMMON1]).toHaveLength(0);
      expect(optionsBySlot[ThievingEquipmentSlotId.SUMMON2]).toHaveLength(0);
    });

    it('should sort options alphabetically after injection', () => {
      const existing: EquipmentOption = {
        itemId: 'test:zebra',
        itemName: 'Zebra Tablet',
        modifiers: [],
      };
      const optionsBySlot: Record<string, EquipmentOption[]> = {
        [ThievingEquipmentSlotId.SUMMON1]: [existing],
      };
      const synergies = [makeSynergyInfo({ summon1Id: 'test:alpha', summon2Id: 'test:alpha' })];
      const alpha = makeEquipmentItem({ id: 'test:alpha', name: 'Alpha Tablet' });
      const game = makeGame();
      (game.items.equipment.getObjectByID as jest.Mock).mockReturnValue(alpha);

      injectSynergyFamiliars(optionsBySlot, synergies, game);

      const names = optionsBySlot[ThievingEquipmentSlotId.SUMMON1].map((o) => o.itemName);
      expect(names).toEqual(['Alpha Tablet', 'Zebra Tablet']);
    });
  });

  describe('readPotionOptions', () => {
    it('should include potions associated with the thieving skill', () => {
      const game = makeGame();
      const thievingRef = game.thieving;
      (game as unknown as { items: { potions: { allObjects: unknown[] } } }).items.potions.allObjects = [
        {
          id: 'test:thieving-potion',
          name: 'Thieving Potion',
          tier: 3,
          action: thievingRef,
          stats: { modifiers: [makeModifierValue(ThievingBoostId.STEALTH, 50)] },
          media: 'potion.png',
        },
      ];

      const potions = readPotionOptions(game);

      expect(potions).toHaveLength(1);
      expect(potions[0].itemId).toBe('test:thieving-potion');
      expect(potions[0].tier).toBe(3);
    });

    it('should exclude potions associated with a different skill', () => {
      const game = makeGame();
      const otherSkill = {};
      (game as unknown as { items: { potions: { allObjects: unknown[] } } }).items.potions.allObjects = [
        {
          id: 'test:mining-potion',
          name: 'Mining Potion',
          tier: 2,
          action: otherSkill,
          stats: { modifiers: [] },
          media: 'mining.png',
        },
      ];

      const potions = readPotionOptions(game);

      expect(potions).toHaveLength(0);
    });

    it('should sort potions by name', () => {
      const game = makeGame();
      const thievingRef = game.thieving;
      (game as unknown as { items: { potions: { allObjects: unknown[] } } }).items.potions.allObjects = [
        {
          id: 'test:b', name: 'Zephyr Potion', tier: 1,
          action: thievingRef, stats: { modifiers: [] }, media: '',
        },
        {
          id: 'test:a', name: 'Alpha Potion', tier: 2,
          action: thievingRef, stats: { modifiers: [] }, media: '',
        },
      ];

      const potions = readPotionOptions(game);

      expect(potions.map((p) => p.itemName)).toEqual(['Alpha Potion', 'Zephyr Potion']);
    });
  });

  describe('readSynergyOptions', () => {
    it('should include synergies with ThievingAction consumesOn event', () => {
      const game = makeGame();
      game.summoning.synergies = [
        makeGameSynergy({ consumesOn: [{ type: 'ThievingAction' }] }),
      ] as never;

      const synergies = readSynergyOptions(game);

      expect(synergies).toHaveLength(1);
      expect(synergies[0].name).toBe('Leprechaun + Devil');
    });

    it('should exclude synergies without ThievingAction consumesOn event', () => {
      const game = makeGame();
      game.summoning.synergies = [
        makeGameSynergy({ consumesOn: [{ type: 'WoodcuttingAction' }] }),
      ] as never;

      const synergies = readSynergyOptions(game);

      expect(synergies).toHaveLength(0);
    });

    it('should exclude synergies where familiar has thieving skill but consumesOn is non-thieving', () => {
      const game = makeGame();
      game.summoning.synergies = [
        makeGameSynergy({
          summons: [
            { product: { id: 'test:ent', media: 'ent.png' }, skills: [] },
            {
              product: { id: 'test:leprechaun', media: 'leprechaun.png' },
              skills: [game.thieving],
            },
          ],
          consumesOn: [{ type: 'WoodcuttingAction' }],
        }),
      ] as never;

      const synergies = readSynergyOptions(game);

      expect(synergies).toHaveLength(0);
    });

    it('should include synergies with multiple consumesOn events when one is ThievingAction', () => {
      const game = makeGame();
      game.summoning.synergies = [
        makeGameSynergy({
          consumesOn: [{ type: 'MiningAction' }, { type: 'ThievingAction' }],
        }),
      ] as never;

      const synergies = readSynergyOptions(game);

      expect(synergies).toHaveLength(1);
    });

    it('should return an empty array when no synergies exist', () => {
      const game = makeGame();
      game.summoning.synergies = [] as never;

      const synergies = readSynergyOptions(game);

      expect(synergies).toEqual([]);
    });

    it('should map all synergy fields correctly', () => {
      const game = makeGame();
      game.summoning.synergies = [
        makeGameSynergy({
          summons: [
            { product: { id: 'test:fam1', media: 'fam1.png' }, skills: [] },
            { product: { id: 'test:fam2', media: 'fam2.png' }, skills: [] },
          ],
          name: 'Fam1 + Fam2',
          description: 'A test synergy',
          modifiers: [makeModifierValue(ThievingBoostId.STEALTH, 100)],
          consumesOn: [{ type: 'ThievingAction' }],
        }),
      ] as never;

      const [synergy] = readSynergyOptions(game);

      expect(synergy).toEqual({
        summon1Id: 'test:fam1',
        summon2Id: 'test:fam2',
        name: 'Fam1 + Fam2',
        description: 'A test synergy',
        modifiers: [{ boostId: ThievingBoostId.STEALTH, value: 100 }],
        summon1MediaUrl: 'fam1.png',
        summon2MediaUrl: 'fam2.png',
      });
    });

    it('should filter out non-thieving-scoped modifiers from synergy output', () => {
      const game = makeGame();
      game.summoning.synergies = [
        makeGameSynergy({
          modifiers: [
            makeModifierValue(ThievingBoostId.STEALTH, 50),
            makeModifierValue(ThievingBoostId.STEALTH, 30, 'melvorD:Mining'),
          ],
          consumesOn: [{ type: 'ThievingAction' }],
        }),
      ] as never;

      const [synergy] = readSynergyOptions(game);

      expect(synergy.modifiers).toHaveLength(1);
      expect(synergy.modifiers[0].value).toBe(50);
    });

    describe('filtering accuracy against spec', () => {
      it('should include Leprechaun + Devil synergy with ThievingAction', () => {
        const game = makeGame();
        game.summoning.synergies = [
          makeGameSynergy({
            name: 'Leprechaun + Devil',
            consumesOn: [{ type: 'ThievingAction' }],
          }),
        ] as never;

        const synergies = readSynergyOptions(game);

        expect(synergies).toHaveLength(1);
      });

      it('should exclude Ent + Leprechaun synergy when consumesOn is WoodcuttingAction', () => {
        const game = makeGame();
        game.summoning.synergies = [
          makeGameSynergy({
            name: 'Ent + Leprechaun',
            consumesOn: [{ type: 'WoodcuttingAction' }],
          }),
        ] as never;

        const synergies = readSynergyOptions(game);

        expect(synergies).toHaveLength(0);
      });
    });
  });

  describe('readLoadout', () => {
    it('should compose sub-readers into a complete loadout', () => {
      const game = makeGame();

      const loadout = readLoadout(game);

      expect(loadout).toEqual(
        expect.objectContaining({
          equipment: [],
          masteryLevel: 1,
          melvorMasteryPoolPercent: 0,
          abyssalMasteryPoolPercent: 0,
          activePotion: undefined,
          agilityObstacles: [],
          agilityPillars: [],
          astrologyConstellations: [],
          activePets: [],
          shopPurchases: [],
          activeSummoningSynergy: undefined,
          skillLevel: 99,
          abyssalSkillLevel: 1,
        }),
      );
    });

    it('should read equipped items from non-empty slots', () => {
      const game = makeGame();
      const player = game.combat.player as unknown as {
        equipment: {
          isSlotEmpty: jest.Mock;
          getItemInSlot: jest.Mock;
        };
      };
      player.equipment.isSlotEmpty.mockImplementation(
        (slotId: string) => slotId !== ThievingEquipmentSlotId.GLOVES,
      );
      player.equipment.getItemInSlot.mockReturnValue({
        id: 'test:gloves',
        name: 'Thieving Gloves',
        modifiers: [makeModifierValue(ThievingBoostId.STEALTH, 50)],
        media: 'gloves.png',
      });

      const loadout = readLoadout(game);

      expect(loadout.equipment).toHaveLength(1);
      expect(loadout.equipment[0].slotId).toBe(ThievingEquipmentSlotId.GLOVES);
      expect(loadout.equipment[0].itemId).toBe('test:gloves');
    });

    it('should read active potion when present', () => {
      const game = makeGame();
      (game.potions.getActivePotionForAction as jest.Mock).mockReturnValue({
        id: 'test:potion',
        name: 'Thieving Potion IV',
        tier: 3,
        stats: { modifiers: [makeModifierValue(ThievingBoostId.STEALTH, 80)] },
        media: 'potion.png',
      });

      const loadout = readLoadout(game);

      expect(loadout.activePotion).toBeDefined();
      expect(loadout.activePotion!.itemId).toBe('test:potion');
    });

    it('should read active summoning synergy when present', () => {
      const game = makeGame();
      const player = game.combat.player as unknown as {
        activeSummoningSynergy: unknown;
      };
      player.activeSummoningSynergy = {
        summons: [
          { product: { id: 'test:leprechaun', media: 'lep.png' } },
          { product: { id: 'test:devil', media: 'dev.png' } },
        ],
        name: 'Leprechaun + Devil',
        description: 'Gamble',
        modifiers: [],
      };

      const loadout = readLoadout(game);

      expect(loadout.activeSummoningSynergy).toBeDefined();
      expect(loadout.activeSummoningSynergy!.summon1Id).toBe('test:leprechaun');
      expect(loadout.activeSummoningSynergy!.summon2Id).toBe('test:devil');
    });

    it('should read active pets', () => {
      const game = makeGame();
      (game.petManager as unknown as { unlocked: { id: string; name: string }[] }).unlocked = [
        { id: 'test:rocky', name: 'Rocky' },
      ];

      const loadout = readLoadout(game);

      expect(loadout.activePets).toEqual([{ id: 'test:rocky', name: 'Rocky' }]);
    });

    it('should read shop purchases with positive count', () => {
      const game = makeGame();
      const purchasesMap = new Map<{ id: string; name: string }, number>();
      purchasesMap.set({ id: 'test:gloves', name: 'Gloves of Silence' }, 1);
      purchasesMap.set({ id: 'test:cape', name: 'Thieving Cape' }, 0);
      (game.shop as unknown as { upgradesPurchased: typeof purchasesMap }).upgradesPurchased = purchasesMap;

      const loadout = readLoadout(game);

      expect(loadout.shopPurchases).toHaveLength(1);
      expect(loadout.shopPurchases[0].name).toBe('Gloves of Silence');
    });

    it('should read mastery pool percentages', () => {
      const melvorRealm = { id: 'melvorD:Melvor' };
      const abyssalRealm = { id: 'melvorItA:Abyssal' };
      const game = makeGame();
      (game.realms.getObjectByID as jest.Mock).mockImplementation(
        (id: string) => {
          if (id === 'melvorD:Melvor') return melvorRealm;
          if (id === 'melvorItA:Abyssal') return abyssalRealm;
          return undefined;
        },
      );
      const thieving = game.thieving as unknown as {
        getMasteryPoolCap: jest.Mock;
        getMasteryPoolXP: jest.Mock;
      };
      thieving.getMasteryPoolCap.mockReturnValue(1000);
      thieving.getMasteryPoolXP.mockImplementation((realm: { id: string }) =>
        realm.id === 'melvorD:Melvor' ? 950 : 300,
      );

      const loadout = readLoadout(game);

      expect(loadout.melvorMasteryPoolPercent).toBe(95);
      expect(loadout.abyssalMasteryPoolPercent).toBe(30);
    });
  });
});
