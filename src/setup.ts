import { readAreas, readTargets } from './state/reader';

export function setup(ctx: Modding.ModContext) {
  ctx.onModsLoaded(() => {
    console.log('[ThievingSim] Mods loaded');
  });

  ctx.onCharacterLoaded(() => {
    const targets = readTargets(game.thieving);
    const areas = readAreas(game.thieving);
    console.log(
      `[ThievingSim] Loaded ${targets.length} targets, ${areas.length} areas`,
    );
  });

  ctx.onInterfaceReady(() => {
    console.log('[ThievingSim] Interface ready');
  });
}
