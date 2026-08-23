# Phase 0 — Fix Foundations

Things that are broken or missing but block all forward progress.

## 0.1 Fix Jest configuration

**Status:** Done
**Why:** Tests pass on `.ts` source via SWC but Jest also picks up compiled `.js` files from `dist/` which crash on ESM imports. `@swc/jest` is installed but no `jest.config` wires it up properly. Test infrastructure must work before adding calc engine tests.

- [x] Add `jest.config.ts` (or `.js`) with SWC transform
- [x] Exclude `dist/` and `node_modules/` from test roots
- [x] Verify `pnpm test` passes cleanly

## 0.2 Create `assets/style.css`

**Status:** Done
**Why:** `manifest.json` references `assets/style.css` in the `load` array. The mod will fail to load without it. Empty file is fine until UI work begins.

- [x] Create empty `assets/style.css`

## 0.3 Wire up `setup.mts` scaffold

**Status:** Done
**Why:** Entry point is `console.log('Hello World!')`. Needs lifecycle hooks so the mod actually initializes. No functionality yet, just the skeleton.

- [x] Register `ctx.onCharacterLoaded` callback
- [x] Register `ctx.onInterfaceReady` callback
- [x] Import and call `readTargets` / `readAreas` in `onCharacterLoaded` to verify data flows
