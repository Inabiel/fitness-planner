import { FOCUS_LABELS, type WorkoutFocus } from '../../domain';

const FOCUS_IMAGES: Record<WorkoutFocus, string> = {
  chest: 'assets/body-areas/chest.webp',
  back: 'assets/body-areas/back.webp',
  shoulders: 'assets/body-areas/shoulders.webp',
  arms: 'assets/body-areas/arms.webp',
  legs: 'assets/body-areas/legs.webp',
  glutes: 'assets/body-areas/glutes.webp',
  core: 'assets/body-areas/core.webp',
  'full-body': 'assets/body-areas/full-body.webp',
  push: 'assets/body-areas/push.webp',
  pull: 'assets/body-areas/pull.webp',
  'upper-body': 'assets/body-areas/upper-body.webp',
  'lower-body': 'assets/body-areas/lower-body.webp',
  aerobic: 'assets/body-areas/aerobic.webp',
};

export function FocusIllustration({ focus, className = '' }: { focus: WorkoutFocus; className?: string }) {
  return <img className={`focus-illustration ${className}`} src={FOCUS_IMAGES[focus]} alt={`${FOCUS_LABELS[focus]} body area illustration`} />;
}
