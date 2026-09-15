import { INTENSITY_LABELS, type WorkoutIntensity } from '../../domain';
import type { EffortAssessment, IntensityAssessment } from './recommendations';

export function EffortSummary({ assessments }: { assessments: EffortAssessment[] }) {
  const increases = assessments.filter((assessment) => assessment.direction === 'increase').length;
  const decreases = assessments.filter((assessment) => assessment.direction === 'decrease').length;
  const trends = assessments.filter((assessment) => assessment.direction === 'insufficient-data').length;
  const summary = decreases ? 'Some exercises need less effort.' : increases ? 'Some exercises are ready for more effort.' : trends === assessments.length ? 'Log two completed sessions to calculate changes.' : 'Your current effort is repeatable.';
  return <div className="side-card effort-summary"><p className="eyebrow">Effort guidance</p><h3>{summary}</h3><div className="effort-summary-stats"><span><strong>{increases}</strong> increase</span><span><strong>{decreases}</strong> decrease</span><span><strong>{trends}</strong> building</span></div></div>;
}

export function IntensityCard({ target, assessment }: { target: WorkoutIntensity; assessment: IntensityAssessment }) {
  const pillClass = assessment.result === 'above' ? 'increase' : assessment.result === 'below' ? 'decrease' : assessment.result === 'on-target' ? 'hold' : 'insufficient-data';
  return <div className="side-card intensity-card"><div className="section-heading"><div><p className="eyebrow">Target intensity</p><h3>{INTENSITY_LABELS[target]}</h3></div><span className={`effort-pill ${pillClass}`}>{assessment.label}</span></div><p className="effort-detail">{assessment.detail}</p></div>;
}
