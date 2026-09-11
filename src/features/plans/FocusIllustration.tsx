import { FOCUS_LABELS, type WorkoutFocus } from '../../domain';

const FOCUS_IMAGES: Record<WorkoutFocus, string> = {
  chest: 'assets/body-areas/chest.svg',
  back: 'assets/body-areas/back.svg',
  shoulders: 'assets/body-areas/shoulders.svg',
  arms: 'assets/body-areas/arms.svg',
  legs: 'assets/body-areas/legs.svg',
  glutes: 'assets/body-areas/glutes.svg',
  core: 'assets/body-areas/core.svg',
  'full-body': 'assets/body-areas/full-body.svg',
  push: 'assets/body-areas/push.svg',
  pull: 'assets/body-areas/pull.svg',
  'upper-body': 'assets/body-areas/upper-body.svg',
  'lower-body': 'assets/body-areas/lower-body.svg',
  aerobic: 'assets/body-areas/aerobic.svg',
};

export function FocusIllustration({ focus, className = '' }: { focus: WorkoutFocus; className?: string }) {
  return <img className={`focus-illustration ${className}`} src={FOCUS_IMAGES[focus]} alt={`${FOCUS_LABELS[focus]} body area illustration`} />;
}
