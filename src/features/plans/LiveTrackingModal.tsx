import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleCheck, Dumbbell, SkipForward, Timer, X } from 'lucide-react';
import { FOCUS_LABELS, localDate, type Exercise, type PlanSnapshot, type Prescription, type SetRecord, type WorkoutPlan, type WorkoutProgram, type WorkoutRecord } from '../../domain';
import { advanceProgramsAfterCompletion, now, saveWorkoutRecord, uid } from '../../data/db';
import { EXERCISES } from '../../data/exercises';
import { getGamificationCelebration, getGamificationFeedback, getGamificationSummary, type GamificationCelebration } from '../../shared/gamification';
import { EmptyState, Modal } from '../../shared/ui';
import { getVisibleSetCount, SessionExercise, type SetValueField } from '../sessions/SessionExercise';
import { makePlanSnapshot } from '../sessions/snapshot';

interface TrackingStep {
  prescription: Prescription;
  exercise: Exercise;
}

export function LiveTrackingModal({ plan, records, programs = [], onClose, onSaved }: { plan: WorkoutPlan; records: WorkoutRecord[]; programs?: WorkoutProgram[]; onClose: () => void; onSaved: (message: string, celebration: GamificationCelebration | null) => void }) {
  const sessionDate = localDate();
  const existing = records.find((record) => record.sourcePlanId === plan.id && record.sessionDate === sessionDate);
  const [snapshot, setSnapshot] = useState<PlanSnapshot>(() => existing?.planSnapshot ?? makePlanSnapshot(plan, programs, sessionDate));
  const steps = snapshot.prescriptions.reduce<TrackingStep[]>((items, prescription) => {
    const exercise = snapshot.exercises.find((item) => item.id === prescription.exerciseId);
    return exercise ? [...items, { prescription, exercise }] : items;
  }, []);
  const existingSets = existing?.sets ?? [];
  const [sets, setSets] = useState<SetRecord[]>(existingSets);
  const [extraSets, setExtraSets] = useState<Record<string, number>>(() => Object.fromEntries(snapshot.prescriptions.map((prescription) => [prescription.id, Math.max(0, getVisibleSetCount(prescription, existingSets) - prescription.sets)])));
  const [activeIndex, setActiveIndex] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const activeStep = steps[activeIndex];

  useEffect(() => {
    if (restRemaining === null) return;
    if (restRemaining <= 0) {
      setRestRemaining(null);
      return;
    }
    const timer = window.setTimeout(() => setRestRemaining((current) => current === null ? null : current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [restRemaining]);

  function getSet(prescriptionId: string, setNumber: number): SetRecord {
    return sets.find((item) => item.prescriptionId === prescriptionId && item.setNumber === setNumber) ?? { prescriptionId, setNumber, actualReps: null, actualDurationSeconds: null, loadKg: null, rir: null, notes: null };
  }

  function updateSet(prescriptionId: string, setNumber: number, field: SetValueField, value: string) {
    const current = getSet(prescriptionId, setNumber);
    const parsed = field === 'notes' ? (value.trim() || null) : value === '' ? null : Number(value);
    const next = { ...current, [field]: parsed };
    const hasValue = next.actualReps !== null || next.actualDurationSeconds !== null || next.loadKg !== null || next.rir !== null && next.rir !== undefined || Boolean(next.notes);
    setSets((items) => {
      const withoutCurrent = items.filter((item) => !(item.prescriptionId === prescriptionId && item.setNumber === setNumber));
      return hasValue ? [...withoutCurrent, next] : withoutCurrent;
    });
  }

  function replaceExercise(prescriptionId: string, exercise: Exercise) {
    setSnapshot((current) => {
      const prescriptions = current.prescriptions.map((item) => item.id === prescriptionId ? { ...item, exerciseId: exercise.id, dose: { ...item.dose, kind: exercise.doseKind } } : item);
      const usedExerciseIds = new Set(prescriptions.map((item) => item.exerciseId));
      return { ...current, prescriptions, exercises: [...current.exercises.filter((item) => usedExerciseIds.has(item.id)), ...(current.exercises.some((item) => item.id === exercise.id) ? [] : [exercise])] };
    });
  }

  function addSet(prescriptionId: string) {
    setExtraSets((items) => ({ ...items, [prescriptionId]: (items[prescriptionId] ?? 0) + 1 }));
  }

  async function save(status: WorkoutRecord['status']) {
    setSaving(true);
    setError('');
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
        try {
          await advanceProgramsAfterCompletion(plan.id, sessionDate);
        } catch {
          // The session is already safe; a later completion can retry the schedule shift.
        }
      }
      const beforeGamification = getGamificationSummary(records, sessionDate);
      const afterGamification = getGamificationSummary(records.filter((item) => item.id !== record.id).concat(record), sessionDate);
      const gamificationMessage = status === 'completed' ? getGamificationFeedback(beforeGamification, afterGamification) : null;
      const gamificationCelebration = status === 'completed' ? getGamificationCelebration(beforeGamification, afterGamification) : null;
      const completionMessage = status === 'completed' ? 'Live workout complete.' : 'Live progress saved.';
      onSaved(gamificationCelebration ? completionMessage : gamificationMessage ? `${gamificationMessage} ${completionMessage}` : completionMessage, gamificationCelebration);
      onClose();
    } catch {
      setError('Could not save your live workout. Your entries are still here—try again.');
    } finally {
      setSaving(false);
    }
  }

  function completeExercise() {
    if (!activeStep || activeIndex >= steps.length - 1) return;
    const nextIndex = activeIndex + 1;
    setActiveIndex(nextIndex);
    if (activeStep.prescription.restSeconds > 0) setRestRemaining(activeStep.prescription.restSeconds);
  }

  function skipRest() {
    setRestRemaining(null);
  }

  if (!activeStep) {
    return <div className="modal-backdrop" role="presentation"><Modal className="review-confirmation-modal" label="Live tracking unavailable" onClose={() => { if (!saving) onClose(); }}><EmptyState icon={<Dumbbell size={22} />} title="No exercises to track" body="Add an exercise to this plan before starting live tracking." action={<button type="button" className="button secondary" onClick={onClose}>Close</button>} /></Modal></div>;
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <Modal className="review-confirmation-modal live-tracking-modal" labelledBy="live-tracking-title" onClose={() => { if (!saving) onClose(); }}>
        <div className="live-tracking-header"><div><div className="confirmation-icon"><Timer size={20} /></div><p className="eyebrow">Live tracking</p><h2 id="live-tracking-title">{plan.name}</h2><p>Log each exercise as you go. Complete one to start its rest timer and move forward automatically.</p></div><button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label="Close live tracking"><X size={18} /></button></div>
        <div className="live-tracking-overview" aria-label="Workout exercise sequence">{steps.map((step, index) => <div className={`live-tracking-step ${index < activeIndex ? 'complete' : index === activeIndex ? 'current' : ''}`} key={step.prescription.id}><span className="live-tracking-step-index">{index < activeIndex ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span><span className="live-tracking-step-body"><strong>{step.exercise.name}</strong><small>{FOCUS_LABELS[snapshot.focus ?? snapshot.primaryTargetArea]} · {step.prescription.sets} sets planned</small></span></div>)}</div>
        {restRemaining !== null ? <div className="live-rest-view"><Timer size={25} /><p className="eyebrow">Rest</p><strong className="live-rest-timer" aria-live="polite">{formatTimer(restRemaining)}</strong><p>Next up: <strong>{steps[activeIndex].exercise.name}</strong></p><small>The next exercise will open automatically when the timer ends.</small><button type="button" className="button secondary" onClick={skipRest} disabled={saving}><SkipForward size={16} /> Skip rest</button></div> : <div className="live-tracking-active" key={activeStep.prescription.id}><SessionExercise prescription={activeStep.prescription} exercise={activeStep.exercise} index={activeIndex} setCount={activeStep.prescription.sets + (extraSets[activeStep.prescription.id] ?? 0)} onAddSet={() => addSet(activeStep.prescription.id)} showDetails replacementExercises={EXERCISES} onReplaceExercise={(replacement) => replaceExercise(activeStep.prescription.id, replacement)} getSet={getSet} updateSet={updateSet} /></div>}
        {error && <p className="form-error global-error" role="alert">{error}</p>}
        <div className="modal-actions live-tracking-actions"><button type="button" className="button ghost" onClick={() => void save('in_progress')} disabled={saving}>{saving ? 'Saving…' : 'Save progress & exit'}</button>{restRemaining === null && (activeIndex < steps.length - 1 ? <button type="button" className="button primary" onClick={completeExercise} disabled={saving}>Complete & rest <ArrowRight size={16} /></button> : <button type="button" className="button primary" onClick={() => void save('completed')} disabled={saving}><CircleCheck size={16} /> Finish workout</button>)}</div>
      </Modal>
    </div>
  );
}

function formatTimer(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
