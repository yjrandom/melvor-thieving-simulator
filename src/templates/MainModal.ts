import type { ThievingArea, ThievingTarget } from '../calc/types';

interface MainModalInputProps {
  theivingTargets: ThievingTarget[];
  theivingAreas: ThievingArea[];
}

interface MainModalOutputProps extends MainModalInputProps {
  isOpen: boolean;
  setIsOpen: () => void;
}

export default function MainModal(
  props: MainModalInputProps,
): Component<MainModalOutputProps> {
  return {
    $template: '#ts-modal',
    ...props,
    isOpen: false,
    setIsOpen() {
      this.isOpen = !this.isOpen;
    },
  };
}
