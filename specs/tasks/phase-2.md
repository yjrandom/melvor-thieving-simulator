# Phase 2 — Harden the Calculation Engine

The calc engine (`src/calc/thieving.ts`) implements the core formulas. It needs tests and coverage for edge cases.

## 2.1 Unit tests for calc engine

**Status:** Done
**Why:** `calcThieving` and its component functions have zero test coverage. The formulas are documented in `formulas.md` — tests should verify against the worked examples there.

- [x] Test `calcSuccessRate` — including 100% cap when stealth >= perception
- [x] Test `calcEffectiveInterval` — flat reduction, floor clamping, percentage reduction
- [x] Test `calcStunDuration` — percentage reduction, zero floor
- [x] Test `calcDoubleChance` — stealth-based + additive bonus, 100% cap
- [x] Test `calcNpcUniqueChance`
- [x] Test `calcAreaUniqueChance` — percentage + flat bonus stacking
- [x] Test `calcThieving` — end-to-end with known fixture data, verify XP/hr matches manual calculation
- [x] Test stun avoidance integration in `calcThieving` — verify it reduces effective stun rate

## 2.2 Summoning synergy support in boost aggregator

**Status:** Done
**Why:** `formulas.md` documents ~18 synergies. Some change GP calculation fundamentally (Leprechaun + Monkey auto-sell, Leprechaun + Devil gamble). The calc engine stays synergy-unaware — all synergy effects are resolved in the boost aggregator and expressed as `ThievingBoosts` fields before reaching the calculator.

- [x] Extend `ThievingBoosts` if needed to express synergy net effects (e.g., currency multiplier field for auto-sell, item multiplier for Devil gamble)
- [x] Implement Leprechaun + Monkey auto-sell as a currency bonus in the aggregator
- [x] Implement Leprechaun + Devil gamble as expected-value adjustments to currency and doubling fields
- [x] Implement other synergies as flat modifier adjustments in the aggregator
- [x] Unit tests for each synergy path (aggregator level, not calc level)

**Notes:**

- Three new fields added to `ThievingBoosts`: `currencyMultiplierBonus`, `itemMultiplierBonus`, `autoSellMultiplier`
- Devil gamble EV: currency 1.35x (bonus 0.35), items 1.9x (bonus 0.9)
- Auto-sell: aggregator sets `autoSellMultiplier = 15`; calc engine integration deferred until common drop sell price data is added to `ThievingTarget`
- `itemMultiplierBonus` tracked but not yet consumed by the calc engine (needs item value → GP/hr path)
- Bug fixed: `IGNORE_THIEVING_DAMAGE_CHANCE` was incorrectly mapped to `stunAvoidancePercent` — ignoring damage does not avoid the stun time penalty, so it was removed from the modifier map
