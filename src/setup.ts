import { readAllMasteryLevels, readAreas, readLoadout, readTargets } from './state/reader';
import MainModal from './templates/MainModal';

export function setup(ctx: Modding.ModContext) {
  ctx.onModsLoaded(() => {
    console.debug('[ThievingSim] Mods loaded');
  });

  ctx.onCharacterLoaded(() => {
    console.log(`[ThievingSim] Character loaded`);
  });

  ctx.onInterfaceReady(() => {
    console.log('[ThievingSim] Interface ready');

    const targets = readTargets(game.thieving);
    const areas = readAreas(game.thieving);
    const loadout = readLoadout(game);
    const masteryLevels = readAllMasteryLevels(game.thieving);

    const component = ui.createStore(
      MainModal({ targets, areas, loadout, masteryLevels }),
    );
    ui.create(component, document.body);

    sidebar.category('Modding').item('Thieving Simulator', {
      onClick() {
        component.setIsOpen();
      },
    });
  });
}
