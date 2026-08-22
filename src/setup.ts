import { readAreas, readTargets } from './state/reader';
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

    const pageContainer = document.getElementById('page-container')!;

    const theivingTargets = readTargets(game.thieving);
    const theivingAreas = readAreas(game.thieving);

    const mainModal = MainModal({
      theivingTargets,
      theivingAreas,
    });
    ui.create(mainModal, pageContainer);

    sidebar.category('Modding').item('Thieving Simulator', {
      onClick() {
        mainModal.setIsOpen();
      },
    });
  });
}
