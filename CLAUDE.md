# CLAUDE.md

Operational guidance for Claude Code. Design, architecture, and technical details live in `specs/`.

> Canary: keep this file under 100 lines. If approaching that, extract instructions to a dedicated file.

## Build & Test commands

- Do not run any build or test commands. Leave it to the user, and ask for output / results if requried.


## TypeScript best practices

- Enums should be created for type unions that require runtime value use.
- Use `satisfies` to preserve inference while conforming to type.
- Do not use `any` liberally; this defeats the purpose of using ts.
- Do not type assert (`as`) unnecessarily; it obfuscates typing issues.

## Documentation

- Apply meaningful JSDoc comments for methods / functions. 
- Properties can be given documentation if naming is not sufficient to convey all meaning, or hidden business rules
- Refer to `utils/number-utils.ts` as **Canonical** example.

## Review

- Review should be done in consultation with specs. Drifts should be highlighted.

## Testing

- All functions / methods should be unit tested.
- If Data Driven Testing can be used for repeated test cases, use it. Refer to `utils/number-utils.spec.ts` for example.

## Specs

### Adherence
MUST consult before design work, or implementation that affect design, if relevant:

- `specs/constitution.md` — design spec: feature scope, mechanics, architecture, modding conventions, type definitions
- `specs/formulas.md` — thieving formulas and mechanics reference
- `specs/npc-data.md` — NPC stats and area data for both realms
- `specs/tasks.md` — planned work tracker; update status to Done and check boxes when completing tasks

### Source of truth
- `constitution.md` should be the sole source of truth. If other specs disagree, confere to it, but highlight the discrapencies.

