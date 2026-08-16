# Thieving Formulas & Mechanics Reference

Extracted from the Melvor Idle wiki. All formulas here are the calculation engine's source of truth until verified against game source code.

---

## Thieving Interval

**Base interval:** 3.0 seconds per pickpocket attempt.

### Flat Reductions (Melvor Realm — Base Game)

| Source                               | Reduction |
| ------------------------------------ | --------- |
| NPC Mastery Level 50                 | -0.2s     |
| Melvor Mastery Pool Checkpoint (25%) | -0.2s     |
| Agility: Rooftop Run                 | -0.2s     |
| Thieving Skillcape                   | -0.5s     |
| Gloves of Silence                    | -0.1s     |

### Percentage Reduction

| Source                                        | Reduction |
| --------------------------------------------- | --------- |
| Ko Constellation Mastery Level 20 (Astrology) | Up to -5% |

**Lowest possible interval (base game):** 1.65s

### TotH Expansion Additions

| Source                                | Reduction                             |
| ------------------------------------- | ------------------------------------- |
| Abyssal Mastery Pool Checkpoint (50%) | -0.2s                                 |
| Superior Thieving Skillcape           | -0.8s (replaces regular cape's -0.5s) |

**Lowest interval (TotH):** 1.1s

### Into the Abyss Expansion Additions

| Source                                      | Reduction |
| ------------------------------------------- | --------- |
| Depths of Resolve (combat area completion?) | -3%       |
| Additional source                           | -3%       |

**Lowest interval (ItA, Melvor NPCs):** 0.7s
**Lowest interval (ItA, with both realms):** 0.55s

### Interval Formula

```
effective_interval = max(
  base_interval - flat_reductions,
  minimum_interval
) * (1 - percentage_reduction)
```

Note: None of these modifiers reduce the stun duration of a failed attempt.

---

## Stealth & Perception

**Stealth** = player stat (increases success rate, double chance, unique chance).
**Perception** = NPC stat (fixed, cannot be reduced).

### Stealth Sources

#### Equipment

| Item                           | Slot       | Stealth | Realm                  |
| ------------------------------ | ---------- | ------- | ---------------------- |
| Golbin Mask                    | Head       | +20     | Both                   |
| Thieving Gloves                | Hands      | +75     | Both                   |
| Sneak-Ers                      | Feet       | +40     | Both                   |
| Thiever's Cape                 | Cape       | +270    | Both                   |
| Thieving Gloves (passive slot) | Passive    | +50     | Both                   |
| Thieving Shorts                | Legs       | +50     | Both                   |
| Grappling Hook                 | Weapon     | +50     | Melvor                 |
| Bobby's Pocket                 | Consumable | +45     | Both                   |
| (Abyssal torso)                | Torso      | +60     | Abyssal                |
| (Abyssal ring)                 | Ring       | +80     | Abyssal                |
| **Equipment Total**            |            | **600** | **(740 with Abyssal)** |

#### Mastery & Levels

| Source                        | Stealth                    | Realm   |
| ----------------------------- | -------------------------- | ------- |
| Melvor Mastery Pool (10%)     | +30                        | Melvor  |
| Melvor Mastery Pool (95%)     | +100                       | Melvor  |
| Abyssal Mastery Pool (50%)    | +40                        | Abyssal |
| Abyssal Mastery Pool (95%)    | +125                       | Abyssal |
| NPC Mastery Level (per level) | +1/level (max 99)          | Both    |
| NPC Mastery Level 99 unlock   | +75                        | Both    |
| Skill Level (per level)       | +1/level (max 120)         | Both    |
| **Mastery Total**             | **304** (339 with Abyssal) |         |

#### Potions

| Potion                  | Tier | Stealth | Charges | Realm   |
| ----------------------- | ---- | ------- | ------- | ------- |
| Gentle Hands Potion I   | I    | +15     | 20      | Both    |
| Gentle Hands Potion II  | II   | +30     | 30      | Both    |
| Gentle Hands Potion III | III  | +50     | 40      | Both    |
| Gentle Hands Potion IV  | IV   | +75     | 50      | Both    |
| Silent Thief Potion I   | I    | +50     | 1       | Abyssal |
| Silent Thief Potion II  | II   | +60     | 2       | Abyssal |
| Silent Thief Potion III | III  | +75     | 3       | Abyssal |
| Silent Thief Potion IV  | IV   | +100    | 4       | Abyssal |

Silent Thief Potions also grant +10% chance to avoid stun (Abyssal Realm only).

---

## Success Rate

```
success_rate = min(1, (100 + stealth) / (100 + perception))
```

Success is guaranteed when `stealth >= perception`.

**Example:** 200 stealth vs Bandit Thug (220 perception) = (100 + 200) / (100 + 220) = 300/320 = 93.75%

---

## Failure (Stun)

- **Stun duration:** 3 seconds (base)
- **Damage:** Up to NPC's Max Hit
- Damage Reduction (DR) works for Melvor Realm NPCs only
- Neither DR nor Abyssal Resistance reduces Abyssal Realm NPC damage
- Damage is potentially lethal; offset by eating food or Auto Eat
- Prayer points and potion charges are NOT consumed by stun damage

### Stun Duration Reduction

| Source                       | Reduction |
| ---------------------------- | --------- |
| Rooftop Climb (TotH Agility) | -25%      |
| Masquerade Mask (TotH)       | -25%      |

### Stun Avoidance (Melvor Realm only)

| Source                                       | Chance |
| -------------------------------------------- | ------ |
| Thieving Shorts                              | +15%   |
| Grappling Hook                               | +20%   |
| Superior Thieving Skillcape                  | +20%   |
| Silent Thief Potion (any tier, Abyssal only) | +10%   |

### Special

- Pig + Leprechaun synergy: Chef deals no damage on failed attempts
- Abyssal Octopus + Abyssal Leprechaun: +15% avoid stun (Abyssal only)
- Abyssal Pig + Abyssal Leprechaun: +20% chance NPCs deal no damage (Abyssal only)

---

## Loot (On Successful Pickpocket)

Each successful pickpocket grants, in order:

1. **Item doubling roll** — rolled once, applies to all items received
2. **Currency** — GP or AP, random amount from 1 to NPC's max
3. **Common drop** — 75% chance
4. **NPC unique item** — formula-based chance (see below)
5. **Area unique item** — 1/500 base chance per item (rolled separately for each)
6. **Generic rare item** — independent chance per item

### Generic Rare Items (Melvor)

| Item                   | Chance             | Price     |
| ---------------------- | ------------------ | --------- |
| Bobby's Pocket         | 1/120 (0.833%)     | 4,000 GP  |
| Chapeau Noir           | 1/20,000 (0.005%)  | 32,000 GP |
| Sneak-Ers              | 1/15,000 (0.0067%) | 15,000 GP |
| Thieving Shorts (TotH) | 1/15,000 (0.0067%) | 15,000 GP |

---

## Item Doubling

```
double_chance = min(1, stealth / (4 * perception))
```

Guaranteed when `stealth >= 4 * perception`.

**Example:** 330 stealth vs Bandit Thug (220 perception) = 330 / 880 = 37.50%

### Stacking

- **Additive** with other Thieving-specific and global double loot sources (capped at 100%)
- **Multiplicative** with Leprechaun + Devil synergy (chance of 4x items)
- Maximum possible: 8x items (2x from doubling \* 4x from synergy)

---

## NPC Unique Item Chance

```
unique_chance = (100 + stealth) / (10000 * perception)
```

**Example:** 800 stealth vs Merchant (300 perception) = 900 / 3,000,000 = 0.03%

---

## Area Unique Item Chance

- **Base chance:** 1/500 (0.20%) per unique item
- **Melvor Mastery Pool 95%:** chance tripled (+200%)
- **Abyssal Mastery Pool 95%:** chance tripled (+200%)
- **Hunters Journal (TotH):** +0.01% flat increase
- **Abyssal Bear + Abyssal Leprechaun:** +0.1% (Abyssal only)
- Each area unique is rolled separately; multiple can drop from one action

---

## Mastery Unlocks (Per NPC)

| Level | Unlock                                                |
| ----- | ----------------------------------------------------- |
| 1+    | +1 Stealth per level, +1% GP per level (NPC-specific) |
| 50    | -0.2s Thieving Interval (NPC-specific)                |
| 99    | +75 Stealth (NPC-specific)                            |

---

## Mastery Pool Checkpoints

### Melvor Realm

| Threshold | Bonus                                                              |
| --------- | ------------------------------------------------------------------ |
| 10%       | +30 Stealth (Melvor NPCs), +3% Skill XP                            |
| 25%       | -0.2s Interval (Melvor only), +3% Mastery XP (Melvor only)         |
| 50%       | +100% GP from Thieving                                             |
| 95%       | +100 Stealth (Melvor NPCs), +200% Area Unique chance (Melvor only) |

### Abyssal Realm

| Threshold | Bonus                                                                |
| --------- | -------------------------------------------------------------------- |
| 10%       | +6% Mastery XP (Abyssal only)                                        |
| 25%       | +15% minimum AP from Thieving                                        |
| 50%       | -0.2s Interval (Abyssal only), +40 Stealth (Abyssal NPCs)            |
| 95%       | +125 Stealth (Abyssal NPCs), +200% Area Unique chance (Abyssal only) |

---

## Skillcape Effects

### Thieving Skillcape (Level 99)

- -0.5s Thieving Interval

### Superior Thieving Skillcape (Level 120, TotH)

- -0.80s Thieving Interval
- +150% GP gained from Thieving
- +270 Stealth while Thieving
- +20% chance to avoid stun (Melvor Realm only)

---

## Summoning Synergies (Thieving-Relevant)

### Melvor Realm

| Familiar 1 | Familiar 2 | Effect                                                       |
| ---------- | ---------- | ------------------------------------------------------------ |
| Ent        | Leprechaun | Lumberjack: +2 Bird Nest instead of GP                       |
| Mole       | Leprechaun | Miner: +30% chance for random Gem                            |
| Octopus    | Leprechaun | Fisherman: +50% interval, +2 base item qty                   |
| Pig        | Leprechaun | Chef deals no damage                                         |
| Crow       | Leprechaun | Miner: +1 Rune Essence (not doubled)                         |
| Leprechaun | Monkey     | Auto-sell common drops for 15x base price (GP)               |
| Leprechaun | Salamander | Miner: +50% chance for random bar on common drop             |
| Leprechaun | Bear       | Farmer: +3% chance for Herb Sack on common drop              |
| Leprechaun | Devil      | 50% chance +100% GP, 35% chance 4x items, 15% chance nothing |
| Leprechaun | Owl        | +1.5% Mastery XP per maxed Ko star                           |

### Abyssal Realm

| Familiar 1         | Familiar 2         | Effect                                                    |
| ------------------ | ------------------ | --------------------------------------------------------- |
| Abyssal Ent        | Abyssal Leprechaun | Blighted Treant: +3 base Shadow Drake Nest qty            |
| Abyssal Mole       | Abyssal Leprechaun | Withering Golem: +5% chance for abyssal gem (not doubled) |
| Abyssal Octopus    | Abyssal Leprechaun | +15% avoid stun (Abyssal only)                            |
| Abyssal Pig        | Abyssal Leprechaun | +20% chance NPCs deal no damage (Abyssal only)            |
| Abyssal Bear       | Abyssal Leprechaun | +0.1% Area Unique chance (Abyssal only)                   |
| Abyssal Leprechaun | Abyssal Crow       | Withering Ruins: +1 Abyssal Essence (not doubled)         |
| Abyssal Leprechaun | Abyssal Salamander | Withering Ruins: +50% chance for Abyssal Bar on common    |
| Abyssal Leprechaun | Abyssal Monkey     | Auto-sell common drops for 15x base price (AP)            |
| Abyssal Leprechaun | Abyssal Devil      | 50% chance 2x AP, 35% chance 4x items, 15% nothing        |

---

## Effective XP/hr Formula

The simulator must account for stun time in throughput calculations:

```
actions_per_hour = 3600 / effective_action_time

where:
  effective_action_time = success_rate * interval + (1 - success_rate) * (interval + stun_duration)
                        = interval + (1 - success_rate) * stun_duration

xp_per_hour = actions_per_hour * success_rate * base_xp * (1 + xp_bonus_modifiers)
```

For GP/hr:

```
avg_gp_per_success = (max_gp + 1) / 2 * (1 + gp_bonus_modifiers)
gp_per_hour = actions_per_hour * success_rate * avg_gp_per_success * (1 + double_chance)
```

Note: GP/hr must also factor in special synergies (Leprechaun + Monkey auto-sell, Leprechaun + Devil gamble, etc.) as separate calculation paths.
