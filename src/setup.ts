import {
  readAllMasteryLevels,
  readAreas,
  readEquipmentOptions,
  readLoadout,
  readTargets,
} from './state/reader';
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
    const equipmentOptions = readEquipmentOptions(game);

    const component = ui.createStore(
      MainModal({
        targets,
        areas,
        onImport: () => ({
          loadout: readLoadout(game),
          masteryLevels: readAllMasteryLevels(game.thieving),
        }),
        equipmentOptions,
      }),
    );
    ui.create(component, document.body);

    sidebar.category('Modding').item('Thieving Simulator', {
      onClick() {
        component.setIsOpen();
      },
    });
  });
}
