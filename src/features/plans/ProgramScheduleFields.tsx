import { dateIsValid, localDate, type WorkoutPlan } from '../../domain';
import { formatShortDate } from '../../shared/formatters';
import { Field } from '../../shared/ui';

export type ProgramScheduleKind = 'independent' | 'rolling';

interface ProgramScheduleFieldsProps {
  kind: ProgramScheduleKind;
  startsOn: string;
  intervalDays: string;
  onKindChange: (kind: ProgramScheduleKind) => void;
  onStartsOnChange: (value: string) => void;
  onIntervalDaysChange: (value: string) => void;
  advanceOnCompletion: boolean;
  onAdvanceOnCompletionChange: (value: boolean) => void;
  deloadEveryRotations: string;
  onDeloadEveryRotationsChange: (value: string) => void;
  previewPlans?: readonly Pick<WorkoutPlan, 'name'>[];
}

export function ProgramScheduleFields({ kind, startsOn, intervalDays, onKindChange, onStartsOnChange, onIntervalDaysChange, advanceOnCompletion, onAdvanceOnCompletionChange, deloadEveryRotations, onDeloadEveryRotationsChange, previewPlans = [] }: ProgramScheduleFieldsProps) {
  const interval = Number(intervalDays);
  const showPreview = kind === 'rolling' && dateIsValid(startsOn) && Number.isInteger(interval) && interval > 0 && previewPlans.length > 0;

  return <>
    <div className="segmented" role="group" aria-label="Program schedule">
      <button type="button" className={kind === 'independent' ? 'selected' : ''} onClick={() => onKindChange('independent')}>Individual schedules</button>
      <button type="button" className={kind === 'rolling' ? 'selected' : ''} onClick={() => onKindChange('rolling')}>One rotation schedule</button>
    </div>
    <p className="section-explainer">Individual schedules keep each workout on its own weekday or date. One rotation schedule assigns a workout every N days in the order below; every 2 days means workout → rest → workout.</p>
    {kind === 'rolling' && <div className="schedule-fields">
      <Field label="Starts on"><input type="date" value={startsOn} onChange={(event) => onStartsOnChange(event.target.value)} /></Field>
      <Field label="Workout every" suffix="days" hint="1 = daily · 2 = workout/rest"><input type="number" min="1" max="30" step="1" value={intervalDays} onChange={(event) => onIntervalDaysChange(event.target.value)} /></Field>
      <Field label="Deload every" suffix="rotations" hint="Optional lighter cycle"><input type="number" min="2" max="12" step="1" value={deloadEveryRotations} onChange={(event) => onDeloadEveryRotationsChange(event.target.value)} placeholder="Off" /></Field>
    </div>}
    {kind === 'rolling' && <label className="confirm-row program-advance-toggle"><input type="checkbox" checked={advanceOnCompletion} onChange={(event) => onAdvanceOnCompletionChange(event.target.checked)} /><span><strong>Shift the next workout after completion</strong><small>Late sessions move the future rotation forward while preserving history.</small></span></label>}
    {showPreview && <div className="rotation-preview">
      <p className="field-label">Next in the rotation</p>
      <div className="rotation-preview-list">{previewPlans.slice(0, 3).map((plan, index) => {
        const [year, month, day] = startsOn.split('-').map(Number);
        const previewDate = localDate(new Date(year, month - 1, day + index * interval));
        return <div className="rotation-preview-row" key={`${plan.name}-${index}`}><time dateTime={previewDate}>{formatShortDate(previewDate)}</time><strong>{plan.name}</strong></div>;
      })}</div>
    </div>}
  </>;
}
