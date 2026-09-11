import { AREA_LABELS, FOCUS_LABELS, targetAreaForFocus, type WorkoutFocus } from '../../domain';
import { FocusIllustration } from './FocusIllustration';

const FOCUS_AREA_LABELS: Record<WorkoutFocus, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  'full-body': 'Full body',
  push: 'Chest · shoulders · triceps',
  pull: 'Back · rear shoulders · biceps',
  'upper-body': 'Chest · back · shoulders · arms',
  'lower-body': 'Glutes · quads · hamstrings · calves',
  aerobic: `${AREA_LABELS[targetAreaForFocus('aerobic')]} · core · glutes`,
};

export function IntentionPreview({ focus }: { focus: WorkoutFocus }) {
  return (
    <div className="intention-preview">
      <div className="intention-preview-copy">
        <p className="eyebrow">Selected intention</p>
        <h3>{FOCUS_LABELS[focus]}</h3>
        <p>Primary body area</p>
        <strong>{FOCUS_AREA_LABELS[focus]}</strong>
      </div>
      <FocusIllustration focus={focus} />
    </div>
  );
}
