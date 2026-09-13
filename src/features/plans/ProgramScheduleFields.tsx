import { Field } from '../../shared/ui';

export type ProgramScheduleKind = 'independent' | 'rolling';

interface ProgramScheduleFieldsProps {
  kind: ProgramScheduleKind;
  startsOn: string;
  intervalDays: string;
  onKindChange: (kind: ProgramScheduleKind) => void;
  onStartsOnChange: (value: string) => void;
  onIntervalDaysChange: (value: string) => void;
}

export function ProgramScheduleFields({ kind, startsOn, intervalDays, onKindChange, onStartsOnChange, onIntervalDaysChange }: ProgramScheduleFieldsProps) {
  return <>
    <div className="segmented" role="group" aria-label="Program schedule">
      <button type="button" className={kind === 'independent' ? 'selected' : ''} onClick={() => onKindChange('independent')}>Keep plan schedules</button>
      <button type="button" className={kind === 'rolling' ? 'selected' : ''} onClick={() => onKindChange('rolling')}>Moving-day rotation</button>
    </div>
    <p className="section-explainer">Keep plan schedules for fixed weekdays, or rotate plans in order on a moving schedule. A two-day interval creates workout → rest → workout.</p>
    {kind === 'rolling' && <div className="schedule-fields">
      <Field label="Starts on"><input type="date" value={startsOn} onChange={(event) => onStartsOnChange(event.target.value)} /></Field>
      <Field label="Workout every" suffix="days" hint="1 = daily · 2 = workout/rest"><input type="number" min="1" max="30" step="1" value={intervalDays} onChange={(event) => onIntervalDaysChange(event.target.value)} /></Field>
    </div>}
  </>;
}
