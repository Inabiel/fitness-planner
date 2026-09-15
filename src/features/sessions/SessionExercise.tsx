import { Clock3, Plus } from 'lucide-react';
import { AREA_LABELS, type Exercise, type Prescription, type SetRecord } from '../../domain';
import type { EffortAssessment } from '../plans/recommendations';

export type SetValueField = 'actualReps' | 'actualDurationSeconds' | 'loadKg' | 'rir';

export function getVisibleSetCount(prescription: Prescription, sets: SetRecord[]): number {
  return sets.reduce((count, set) => set.prescriptionId === prescription.id ? Math.max(count, set.setNumber) : count, prescription.sets);
}

export function SessionExercise({ prescription, exercise, index, effort, showDetails = false, setCount, onAddSet, getSet, updateSet }: { prescription: Prescription; exercise: Exercise; index: number; effort?: EffortAssessment; showDetails?: boolean; setCount?: number; onAddSet?: () => void; getSet: (prescriptionId: string, setNumber: number) => SetRecord; updateSet: (prescriptionId: string, setNumber: number, field: SetValueField, value: string) => void }) {
  const visibleSetCount = Math.max(prescription.sets, setCount ?? prescription.sets);
  const doseLabel = prescription.dose.kind === 'reps' ? 'reps' : 'sec';
  const loadLabel = prescription.recommendedLoadKg === 0 ? 'bodyweight' : prescription.recommendedLoadKg ? `${prescription.recommendedLoadKg} kg` : 'choose a weight/resistance';
  const effortLabel = prescription.targetRir === undefined ? '' : ` · target ${prescription.targetRir} RIR (reps left)`;
  const primaryAreas = exercise.primaryAreas.map((area) => AREA_LABELS[area]).join(', ');
  const secondaryAreas = exercise.secondaryAreas.length ? ` · Secondary: ${exercise.secondaryAreas.map((area) => AREA_LABELS[area]).join(', ')}` : '';
  return <section className="session-exercise"><div className="session-exercise-heading"><span className="sequence-number">{String(index + 1).padStart(2, '0')}</span><div><div className="exercise-detail-heading"><div><h3>{exercise.name}</h3><span className="worked-label">Primary: {primaryAreas}{secondaryAreas}</span></div>{effort && <span className={`effort-pill ${effort.direction}`}>{effort.label}</span>}</div><p className="worked-label">Planned: {prescription.sets} × {prescription.dose.value} {doseLabel} · {loadLabel} · {prescription.restSeconds}s rest{effortLabel}</p></div></div>{showDetails && <div className="exercise-detail-grid session-exercise-detail"><div className="exercise-media gif-media"><img src={`assets/exercises/${exercise.id}.gif?v=2`} alt={`${exercise.name} movement demonstration`} loading="lazy" /></div><div><p className="eyebrow">How to move</p><ol className="instruction-list">{exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol><p className="rest-note"><Clock3 size={14} /> Rest {prescription.restSeconds} sec{effortLabel}{prescription.notes ? ` · ${prescription.notes}` : ''}</p>{effort && <p className="effort-detail">{effort.detail}</p>}</div></div>}<div className={`set-table ${prescription.dose.kind}`}><div className="set-table-head"><span>Set</span><span>{prescription.dose.kind === 'reps' ? 'Actual reps' : 'Actual sec'}</span><span title="Weight or resistance used for the exercise">Weight/resistance <small>kg</small></span>{prescription.dose.kind === 'reps' && <span title="RIR means reps in reserve: how many more good-form reps you could have done">RIR <small>reps left</small></span>}</div>{Array.from({ length: visibleSetCount }, (_, index) => <SetRow key={index + 1} exercise={exercise} prescription={prescription} setNumber={index + 1} current={getSet(prescription.id, index + 1)} onChange={updateSet} />)}</div>{onAddSet && <button type="button" className="button ghost small session-exercise-add-set" onClick={onAddSet}><Plus size={15} /> Add another set</button>}</section>;
}

function SetRow({ exercise, prescription, setNumber, current, onChange }: { exercise: Exercise; prescription: Prescription; setNumber: number; current: SetRecord; onChange: (prescriptionId: string, setNumber: number, field: SetValueField, value: string) => void }) {
  const actualField: SetValueField = prescription.dose.kind === 'reps' ? 'actualReps' : 'actualDurationSeconds';
  const actualLabel = prescription.dose.kind === 'reps' ? 'actual reps' : 'actual duration';
  const actualValue = prescription.dose.kind === 'reps' ? current.actualReps : current.actualDurationSeconds;

  return <div className="set-row"><span className="set-number">{setNumber}</span><input aria-label={`${exercise.name} set ${setNumber} ${actualLabel}`} type="number" min="0" step="1" value={actualValue ?? ''} onChange={(event) => onChange(prescription.id, setNumber, actualField, event.target.value)} placeholder="—" /><input aria-label={`${exercise.name} set ${setNumber} weight or resistance in kilograms`} type="number" min="0" step="0.5" value={current.loadKg ?? ''} onChange={(event) => onChange(prescription.id, setNumber, 'loadKg', event.target.value)} placeholder="—" />{prescription.dose.kind === 'reps' && <input aria-label={`${exercise.name} set ${setNumber} reps in reserve`} type="number" min="0" max="5" step="1" value={current.rir ?? ''} onChange={(event) => onChange(prescription.id, setNumber, 'rir', event.target.value)} placeholder="—" />}</div>;
}
