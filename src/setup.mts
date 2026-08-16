import { readTargets, readAreas } from './state/reader.js';

export function setup(ctx: Modding.ModContext) {
  ctx.onCharacterLoaded(() => {
    const targets = readTargets(game.thieving);
    const areas = readAreas(game.thieving);
    console.log(`[ThievingSim] Loaded ${targets.length} targets, ${areas.length} areas`);
  });

  ctx.onInterfaceReady(() => {
    console.log('[ThievingSim] Interface ready');
  });
}
