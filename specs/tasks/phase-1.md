# Phase 1 — Loadout Configuration & Boost Aggregation

Two distinct layers:

1. **Loadout configuration** — responsible for fetching current player state from the game and (later) applying user overrides. Produces a complete loadout description.
2. **Boost aggregator** — pure function that takes a loadout and a target NPC, derives the flat `ThievingBoosts` the calc engine consumes. No game dependency — fully testable offline.

Initial scope: **read-only import of current loadout** (no hypothetical overrides yet).

## 1.1 Define loadout types

**Status:** Done
**Why:** Need a type representing a complete loadout — everything that affects thieving outcomes. This is the contract between the loadout layer and the boost aggregator.

- [x] Define `ThievingLoadout` interface in `calc/types.ts`
- [x] Fields for: equipped items (by slot), mastery levels (per NPC ID), mastery pool percentages (melvor + abyssal), active potion (id + tier), active prayers, agility obstacles + pillar, astrology modifiers (Ko constellation), active pets, relevant shop purchases, active summoning familiars/synergy, skill level, abyssal skill level
- [x] Keep it a plain data object — no game types, no classes

## 1.2 Build loadout reader (current state only)

**Status:** Done
**Why:** Must extract the player's current loadout from the game's live objects (`game.combat.player`, `game.potions`, `game.agility`, `game.astrology`, `game.modifiers`, etc.). This is the untested part — requires runtime validation against the actual game.

- [x] Implement `readLoadout(game: Game): ThievingLoadout` in `state/reader.ts`
- [x] Read equipped items relevant to thieving (by slot ID, with resolved modifier values from game objects)
- [x] Read mastery levels per NPC and mastery pool percentages (both realms)
- [x] Read active potion (Gentle Hands / Silent Thief — id and tier)
- [x] Read active prayers
- [x] Read agility course obstacles and pillar effects
- [x] Read astrology (Ko constellation) modifiers
- [x] Read active pets
- [x] Read relevant shop purchases
- [x] Read active summoning familiars and synergy
- [x] Read thieving skill level and abyssal skill level

## 1.3 Build boost aggregator

**Status:** Done
**Why:** Pure function that converts a `ThievingLoadout` + per-NPC context into a `ThievingBoosts` object. This is where the modifier stacking logic lives. Standalone module (`calc/aggregator.ts`), no game dependency.

- [x] Implement `aggregateBoosts(loadout: ThievingLoadout, target: ThievingTarget): ThievingBoosts`
- [x] Sum stealth from all sources (equipment, mastery level, mastery pool, potion, skillcape, astrology, skill level)
- [x] Sum flat interval reductions (mastery 50, mastery pool 25%, agility, skillcape)
- [x] Sum percentage interval reductions (astrology, ItA sources)
- [x] Sum XP bonus modifiers
- [x] Sum currency bonus modifiers (mastery pool 50%, skillcape)
- [x] Sum double chance modifiers (from equipment/other sources beyond stealth-based)
- [x] Sum stun avoidance (Thieving Shorts, Grappling Hook, Superior Skillcape, synergies)
- [x] Sum stun duration reduction (Rooftop Climb, Masquerade Mask)
- [x] Sum area unique bonus (mastery pool 95%, Hunter's Journal, synergies)
- [x] Handle realm-specific modifier gating (Melvor vs Abyssal)

## 1.4 Unit tests for boost aggregation

**Status:** Done
**Why:** The aggregator is the most bug-prone part of the system — complex stacking rules, realm-specific gating, and many edge cases. Must be tested independently of the game.

- [x] Test stealth stacking from multiple sources
- [x] Test realm-gated bonuses (e.g., Melvor pool bonuses don't apply to Abyssal NPCs)
- [x] Test per-NPC mastery level contribution
- [x] Test interval reduction with floor clamping
- [x] Test skillcape vs superior skillcape (replacement, not stacking)
