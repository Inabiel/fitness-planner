import { useState } from 'react';
import { CalendarDays, Check, CircleCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { FOCUS_LABELS, dateIsValid, plannedVolume, type Exercise, type Prescription, type SetRecord, type WorkoutRecord } from '../../domain';
import type { PlannerData } from '../../data/db';
import { now, saveWorkoutRecord, uid, updatePlanPrescriptions } from '../../data/db';
import { EXERCISES } from '../../data/exercises';
import { formatLongDate } from '../../shared/formatters';
import { EmptyState, Page } from '../../shared/ui';
import { recommendNextPrescriptions } from '../plans/recommendations';
import { makePlanSnapshot } from './snapshot';

type SetValueField = 'actualReps' | 'actualDurationSeconds' | 'loadKg' | 'rir';

export function Session({ data }: { data: PlannerData }) {
  const { planId, date } = useParams();
  const navigate = useNavigate();
  const selectedPlan = data.plans.find((item) => item.id === planId);
  const existing = data.records.find((record) => record.sourcePlanId === planId && record.sessionDate === date);
  const [sets, setSets] = useState<SetRecord[]>(existing?.sets ?? []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!selectedPlan || !date || !dateIsValid(date)) {
    return <Page title="Session unavailable" subtitle="We couldn’t resolve this dated occurrence."><EmptyState icon={<CalendarDays size={22} />} title="Check the plan and date" body="This session may belong to a deleted plan or an invalid date." action={<Link className="button secondary" to="/plans">Back to plans</Link>} /></Page>;
  }

  const plan = selectedPlan;
  const sessionDate = date;
  const snapshot = existing?.planSnapshot ?? makePlanSnapshot(plan);
  const focus = snapshot.focus ?? snapshot.primaryTargetArea;

  function getSet(prescriptionId: string, setNumber: number): SetRecord {
    return sets.find((item) => item.prescriptionId === prescriptionId && item.setNumber === setNumber) ?? {
      prescriptionId,
      setNumber,
      actualReps: null,
      actualDurationSeconds: null,
      loadKg: null,
      rir: null,
    };
  }

  function updateSet(prescriptionId: string, setNumber: number, field: SetValueField, value: string) {
    const current = getSet(prescriptionId, setNumber);
    const parsed = value === '' ? null : Number(value);
    const next = { ...current, [field]: parsed };
    const hasValue = next.actualReps !== null || next.actualDurationSeconds !== null || next.loadKg !== null || next.rir !== null;

    setSets((items) => {
      const withoutCurrent = items.filter((item) => !(item.prescriptionId === prescriptionId && item.setNumber === setNumber));
      return hasValue ? [...withoutCurrent, next] : withoutCurrent;
    });
  }

  async function save(status: WorkoutRecord['status']) {
    setSaving(true);
    setMessage('');
    const record: WorkoutRecord = {
      id: existing?.id ?? uid(),
      sourcePlanId: plan.id,
      sessionDate,
      status,
      completedAt: status === 'completed' ? (existing?.completedAt ?? now()) : null,
      revision: (existing?.revision ?? 0) + 1,
      planSnapshot: snapshot,
      sets,
    };

    try {
      await saveWorkoutRecord(record);
      if (status === 'completed') {
        const recordsForRecommendation = data.records.filter((item) => item.id !== record.id).concat(record);
        const nextPrescriptions = recommendNextPrescriptions(plan, recordsForRecommendation);
        const changed = nextPrescriptions.some((item, index) => item !== plan.prescriptions[index]);

        if (changed) {
          try {
            await updatePlanPrescriptions(plan.id, nextPrescriptions, plan.revision + 1);
            setMessage('Session complete. Your next recommendation was adjusted from recent performance.');
          } catch {
            setMessage('Session complete. Your next recommendation could not be updated.');
          }
        } else {
          setMessage('Session complete. Nice work.');
        }
      } else {
        setMessage('Progress saved.');
      }
    } catch {
      setMessage('Could not save yet. Your entries are still on this screen—try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page title={existing?.status === 'completed' ? 'Completed session' : 'Follow your session'} subtitle={`${snapshot.name} · ${formatLongDate(date)}`} backTo={`/plans/${plan.id}`}>
      <div className="session-layout">
        <div className="session-main">
          <div className="session-intro"><span className="session-date"><CalendarDays size={16} /> {formatLongDate(date)}</span><span className="area-pill">{FOCUS_LABELS[focus]} focus</span><h2>{snapshot.name}</h2><p className="muted">Log actual reps, load, and optional RIR. Blank fields stay unknown, and completion never requires performance details.</p></div>
          {snapshot.prescriptions.map((prescription, index) => {
            const exercise = snapshot.exercises.find((item) => item.id === prescription.exerciseId) ?? EXERCISES.find((item) => item.id === prescription.exerciseId);
            return exercise ? <SessionExercise key={prescription.id} prescription={prescription} exercise={exercise} index={index} getSet={getSet} updateSet={updateSet} /> : null;
          })}
          <div className="session-actions">
            {message && <p className={`save-message ${message.startsWith('Could') ? 'error' : ''}`} role="status">{message}</p>}
            <button className="button ghost" onClick={() => navigate(-1)}>Exit</button>
            <button className="button secondary" onClick={() => save('in_progress')} disabled={saving}><Check size={16} /> {saving ? 'Saving…' : 'Save progress'}</button>
            <button className="button primary" onClick={() => save('completed')} disabled={saving}><CircleCheck size={16} /> Mark complete</button>
          </div>
        </div>
        <aside className="session-side"><div className="side-card"><p className="eyebrow">Session note</p><h3>Presence over perfection.</h3><p className="muted">You can finish a session without recording a single set. Actual performance is optional, not assumed.</p></div><div className="side-card"><p className="eyebrow">Planned volume</p><strong className="big-number">{plannedVolume(snapshot.prescriptions)}</strong><span className="muted">work sets planned</span></div></aside>
      </div>
    </Page>
  );
}

function SessionExercise({ prescription, exercise, index, getSet, updateSet }: { prescription: Prescription; exercise: Exercise; index: number; getSet: (prescriptionId: string, setNumber: number) => SetRecord; updateSet: (prescriptionId: string, setNumber: number, field: SetValueField, value: string) => void }) {
  const doseLabel = prescription.dose.kind === 'reps' ? 'reps' : 'sec';
  const loadLabel = prescription.recommendedLoadKg === 0 ? 'bodyweight' : prescription.recommendedLoadKg ? `${prescription.recommendedLoadKg} kg` : 'choose a load';
  const effortLabel = prescription.targetRir === undefined ? '' : ` · target ${prescription.targetRir} RIR`;
  return <section className="session-exercise"><div className="session-exercise-heading"><span className="sequence-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{exercise.name}</h3><p className="worked-label">Planned: {prescription.sets} × {prescription.dose.value} {doseLabel} · {loadLabel} · {prescription.restSeconds}s rest{effortLabel}</p></div></div><div className={`set-table ${prescription.dose.kind}`}><div className="set-table-head"><span>Set</span><span>{prescription.dose.kind === 'reps' ? 'Actual reps' : 'Actual sec'}</span><span>Load <small>kg</small></span>{prescription.dose.kind === 'reps' && <span>RIR</span>}</div>{Array.from({ length: prescription.sets }, (_, index) => <SetRow key={index + 1} exercise={exercise} prescription={prescription} setNumber={index + 1} current={getSet(prescription.id, index + 1)} onChange={updateSet} />)}</div></section>;
}

function SetRow({ exercise, prescription, setNumber, current, onChange }: { exercise: Exercise; prescription: Prescription; setNumber: number; current: SetRecord; onChange: (prescriptionId: string, setNumber: number, field: SetValueField, value: string) => void }) {
  const actualField: SetValueField = prescription.dose.kind === 'reps' ? 'actualReps' : 'actualDurationSeconds';
  const actualLabel = prescription.dose.kind === 'reps' ? 'actual reps' : 'actual duration';
  const actualValue = prescription.dose.kind === 'reps' ? current.actualReps : current.actualDurationSeconds;

  return <div className="set-row"><span className="set-number">{setNumber}</span><input aria-label={`${exercise.name} set ${setNumber} ${actualLabel}`} type="number" min="0" step="1" value={actualValue ?? ''} onChange={(event) => onChange(prescription.id, setNumber, actualField, event.target.value)} placeholder="—" /><input aria-label={`${exercise.name} set ${setNumber} load in kilograms`} type="number" min="0" step="0.5" value={current.loadKg ?? ''} onChange={(event) => onChange(prescription.id, setNumber, 'loadKg', event.target.value)} placeholder="—" />{prescription.dose.kind === 'reps' && <input aria-label={`${exercise.name} set ${setNumber} reps in reserve`} type="number" min="0" max="5" step="1" value={current.rir ?? ''} onChange={(event) => onChange(prescription.id, setNumber, 'rir', event.target.value)} placeholder="—" />}</div>;
}
