import {
  injectSynergyFamiliars,
  readAllMasteryLevels,
  readAreas,
  readEquipmentOptions,
  readLoadout,
  readPotionOptions,
  readSynergyOptions,
  readTargets,
} from './state/reader';
import MainModal from './templates/main.template';

export function setup(ctx: Modding.ModContext) {
  ctx.onModsLoaded(() => {
    console.debug('[ThievingSim] Mods loaded');
  });

  ctx.onCharacterLoaded(() => {
    console.debug(`[ThievingSim] Character loaded`);
  });

  ctx.onInterfaceReady(() => {
    console.debug('[ThievingSim] Interface ready');

    const targets = readTargets(game.thieving);
    const areas = readAreas(game.thieving);
    const equipmentOptions = readEquipmentOptions(game);
    const potionOptions = readPotionOptions(game);
    const synergyOptions = readSynergyOptions(game);
    injectSynergyFamiliars(equipmentOptions, synergyOptions, game);

    const component = ui.createStore(
      MainModal({
        targets,
        areas,
        onImport: () => ({
          loadout: readLoadout(game),
          masteryLevels: readAllMasteryLevels(game.thieving),
        }),
        equipmentOptions,
        potionOptions,
        synergyOptions,
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
