# Tasks

Derived from `constitution.md` and actual project state.

## Legend

| Symbol  | Meaning                                    |
| ------- | ------------------------------------------ |
| Done    | Implemented and working                    |
| Partial | Started but incomplete or has known issues |
| Ready   | Dependencies met, can start now            |
| Blocked | Waiting on another task                    |

## Phases

| Phase | File                       | Summary                                          | Status |
| ----- | -------------------------- | ------------------------------------------------ | ------ |
| 0     | [phase-0.md](phase-0.md)   | Fix foundations (Jest, CSS, setup scaffold)      | Done   |
| 1     | [phase-1.md](phase-1.md)   | Loadout configuration & boost aggregation        | Done   |
| 2     | [phase-2.md](phase-2.md)   | Harden the calculation engine                    | Done   |
| 3     | [phase-3.md](phase-3.md)   | Loadout editing (hypothetical overrides)         | Done   |
| 4     | [phase-4.md](phase-4.md)   | UI (comparison table, config panel, detail view) | Done    |
| 5     | [phase-5.md](phase-5.md)   | UI polish & UX improvements                      | Partial |

## Resolved Decisions

1. **Synergy modeling:** The calc engine stays synergy-unaware. All synergy effects are resolved in the boost aggregator and expressed as `ThievingBoosts` fields. The calculator never sees synergy types — it just computes from the flat boosts it receives.

2. **Formula source of truth:** Wiki-sourced formulas are the source of truth unless formulas can be obtained from the game API. Ship wiki-based, fix discrepancies on user reports.
