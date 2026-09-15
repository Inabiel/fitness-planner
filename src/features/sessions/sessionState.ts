import type { Exercise, PlanSnapshot, SetRecord } from '../../domain';
import type { SetValueField } from './SessionExercise';

export function getSessionSet(sets: readonly SetRecord[], prescriptionId: string, setNumber: number): SetRecord {
  return sets.find((item) => item.prescriptionId === prescriptionId && item.setNumber === setNumber) ?? {
    prescriptionId,
    setNumber,
    actualReps: null,
    actualDurationSeconds: null,
    loadKg: null,
    rir: null,
    notes: null,
  };
}

export function updateSessionSets(sets: readonly SetRecord[], prescriptionId: string, setNumber: number, field: SetValueField, value: string): SetRecord[] {
  const current = getSessionSet(sets, prescriptionId, setNumber);
  const parsed = field === 'notes' ? (value.trim() || null) : value === '' ? null : Number(value);
  const next = { ...current, [field]: parsed };
  const hasValue = next.actualReps !== null || next.actualDurationSeconds !== null || next.loadKg !== null || next.rir !== null && next.rir !== undefined || Boolean(next.notes);
  const withoutCurrent = sets.filter((item) => !(item.prescriptionId === prescriptionId && item.setNumber === setNumber));
  return hasValue ? [...withoutCurrent, next] : withoutCurrent;
}

export function replaceExerciseInSnapshot(snapshot: PlanSnapshot, prescriptionId: string, exercise: Exercise): PlanSnapshot {
  const prescriptions = snapshot.prescriptions.map((item) => item.id === prescriptionId ? { ...item, exerciseId: exercise.id, dose: { ...item.dose, kind: exercise.doseKind } } : item);
  const usedExerciseIds = new Set(prescriptions.map((item) => item.exerciseId));
  return { ...snapshot, prescriptions, exercises: [...snapshot.exercises.filter((item) => usedExerciseIds.has(item.id)), ...(snapshot.exercises.some((item) => item.id === exercise.id) ? [] : [exercise])] };
}
