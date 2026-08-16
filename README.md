# Melvor Thieving Simulator

> [!WARNING] 
> Work-in-Progress

A [Melvor Idle](https://melvoridle.com/) mod that simulates thieving outcomes for different loadouts, letting you compare XP/hr and GP/hr across all thieving NPCs without switching gear in-game.

## Features

- **Character import** — pull your current loadout, mastery, potions, agility, prayers, pets, and shop purchases from the live game
- **Loadout editing** — swap equipment, toggle potions, change agility obstacles to explore hypothetical setups
- **All-targets comparison** — single table showing every thieving NPC with XP/hr, GP/hr, and success rate for your configuration
- **Per-target detail** — drill into an NPC for loot table breakdown, stun impact, and drop confidence intervals
- **Synergy-aware GP** — accounts for summoning synergies and special item-to-GP conversions

## Building

Requires [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm exec tsc
```

Output goes to `dist/setup.mjs`, which is the entry point referenced by `manifest.json`.

## Installation

Once built, load the mod into Melvor Idle through the game's mod manager by pointing it at this directory.

## Architecture

Three layers in `src/`:

1. **State reader** — extracts character state from game objects via the Melvor modding API
2. **Calculation engine** — pure functions: loadout config in, per-NPC metrics out
3. **UI layer** — comparison table and config panel injected into the game interface

## License

ISC
