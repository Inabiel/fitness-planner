import { INTENSITY_LABELS } from '../../domain';
import { exerciseMatchesConstraints } from '../../domain';
import type { Area, Experience, Exercise, Goal, PlanConstraints, Prescription, SetRecord, WorkoutFocus, WorkoutIntensity, WorkoutPlan, WorkoutRecord } from '../../domain';

const FOCUS_AREAS: Record<WorkoutFocus, readonly Area[]> = {
  chest: ['chest'],
  back: ['back'],
  shoulders: ['shoulders'],
  arms: ['arms'],
  legs: ['legs'],
  glutes: ['glutes'],
  core: ['core'],
  'full-body': ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core'],
  push: ['chest', 'shoulders', 'arms'],
  pull: ['back', 'arms', 'glutes'],
  'upper-body': ['chest', 'back', 'shoulders', 'arms'],
  'lower-body': ['legs', 'glutes', 'core'],
  aerobic: ['legs', 'glutes', 'core', 'shoulders', 'back'],
};

const STARTING_LOADS: Record<string, Record<Experience, number>> = {
  'barbell-back-squat': { beginner: 20, intermediate: 40, advanced: 60 },
  'barbell-bench-press': { beginner: 15, intermediate: 30, advanced: 45 },
  'conventional-deadlift': { beginner: 25, intermediate: 50, advanced: 75 },
  'pull-up': { beginner: 0, intermediate: 0, advanced: 0 },
  'dumbbell-bench-press': { beginner: 5, intermediate: 10, advanced: 16 },
  'chest-press-machine': { beginner: 20, intermediate: 35, advanced: 50 },
  'seated-machine-row': { beginner: 20, intermediate: 35, advanced: 50 },
  'butterfly-machine': { beginner: 15, intermediate: 25, advanced: 35 },
  'cable-crossover': { beginner: 10, intermediate: 20, advanced: 30 },
  'push-up': { beginner: 0, intermediate: 0, advanced: 0 },
  'seated-cable-row': { beginner: 20, intermediate: 30, advanced: 40 },
  'goblet-squat': { beginner: 12, intermediate: 16, advanced: 20 },
  'romanian-deadlift': { beginner: 16, intermediate: 24, advanced: 32 },
  'lat-pulldown': { beginner: 20, intermediate: 30, advanced: 40 },
  'leg-press': { beginner: 40, intermediate: 80, advanced: 120 },
  'hack-squat-machine': { beginner: 30, intermediate: 60, advanced: 90 },
  'dumbbell-shoulder-press': { beginner: 5, intermediate: 8, advanced: 12 },
  'machine-shoulder-press': { beginner: 15, intermediate: 25, advanced: 40 },
  'bulgarian-split-squat': { beginner: 6, intermediate: 10, advanced: 14 },
  'leg-extension-machine': { beginner: 15, intermediate: 30, advanced: 45 },
  'seated-leg-curl-machine': { beginner: 15, intermediate: 30, advanced: 45 },
  'calf-raise-machine': { beginner: 25, intermediate: 50, advanced: 75 },
  'hip-thrust': { beginner: 20, intermediate: 40, advanced: 60 },
  'one-arm-dumbbell-row': { beginner: 8, intermediate: 14, advanced: 20 },
  'lateral-raise': { beginner: 3, intermediate: 5, advanced: 8 },
  'face-pull': { beginner: 10, intermediate: 15, advanced: 20 },
  'hip-abduction-machine': { beginner: 20, intermediate: 35, advanced: 50 },
  'reverse-pec-deck': { beginner: 10, intermediate: 20, advanced: 30 },
  'triceps-pushdown': { beginner: 10, intermediate: 20, advanced: 30 },
  'preacher-curl-machine': { beginner: 10, intermediate: 20, advanced: 30 },
  'smith-machine-squat': { beginner: 20, intermediate: 40, advanced: 60 },
  'dead-bug': { beginner: 0, intermediate: 0, advanced: 0 },
  'farmer-carry': { beginner: 10, intermediate: 16, advanced: 22 },
  'reverse-lunge': { beginner: 8, intermediate: 12, advanced: 16 },
  'kettlebell-swing': { beginner: 8, intermediate: 12, advanced: 16 },
  'plank': { beginner: 0, intermediate: 0, advanced: 0 },
  'side-plank': { beginner: 0, intermediate: 0, advanced: 0 },
};

export const WORKOUT_PRESETS = [
  { id: 'easy-one', name: 'Easy One', description: 'Low-pressure version of your focus' },
  { id: 'strength-base', name: 'Strength Base', description: 'Big movements with longer rests' },
  { id: 'muscle-builder', name: 'Muscle Builder', description: 'Balanced growth-focused session' },
  { id: 'machine-circuit', name: 'Machine Circuit', description: 'Simple machines for your focus' },
  { id: 'quick-sweat', name: 'Quick Sweat', description: 'Fast circuit built around your focus' },
  { id: 'aerobic-flow', name: 'Cardio Flow', description: 'Steady cardio without max effort' },
] as const;

export type WorkoutPreset = (typeof WORKOUT_PRESETS)[number]['id'];

const INTENSITY_PROFILES: Record<WorkoutIntensity, { doseFactor: number; setDelta: number; restDelta: number; targetRir: number }> = {
  easy: { doseFactor: 0.8, setDelta: -1, restDelta: -30, targetRir: 3 },
  moderate: { doseFactor: 1, setDelta: 0, restDelta: 0, targetRir: 2 },
  hard: { doseFactor: 1.15, setDelta: 0, restDelta: 30, targetRir: 1 },
  'very-hard': { doseFactor: 1.3, setDelta: 1, restDelta: 45, targetRir: 0 },
};

export function selectRecommendedExercises(focus: WorkoutFocus, exercises: Exercise[], constraints?: PlanConstraints): Exercise[] {
  const targetAreas = FOCUS_AREAS[focus];
  const candidates = exercises.filter((exercise) => exerciseMatchesConstraints(exercise, constraints) && (focus !== 'aerobic' || exercise.exerciseType === 'aerobic'));
  const maxExercises = constraints?.durationMinutes && constraints.durationMinutes > 0 ? Math.max(1, Math.min(4, Math.floor(constraints.durationMinutes / 12))) : 4;
  return candidates
    .map((exercise, index) => ({ exercise, index, score: focusScore(exercise, targetAreas) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.popularityRank - b.exercise.popularityRank || a.index - b.index)
    .slice(0, maxExercises)
    .map((item) => item.exercise);
}

export function createRecommendedPrescriptions(focus: WorkoutFocus, experience: Experience, goal: Goal, exercises: Exercise[], createId: () => string, intensity: WorkoutIntensity = 'moderate', constraints?: PlanConstraints): Prescription[] {
  return selectRecommendedExercises(focus, exercises, constraints).map((exercise) => applyIntensity(createPrescription(exercise, experience, goal, createId), intensity));
}

export function createPresetPrescriptions(presetId: WorkoutPreset, focus: WorkoutFocus, experience: Experience, goal: Goal, exercises: Exercise[], createId: () => string, intensity: WorkoutIntensity = 'moderate', constraints?: PlanConstraints): Prescription[] {
  if (presetId === 'aerobic-flow' && focus !== 'aerobic') return [];

  const machineExercises = exercises.filter((exercise) => Boolean(exercise.equipment));
  const sourceExercises = presetId === 'machine-circuit' ? machineExercises : exercises;
  const presetExercises = selectRecommendedExercises(focus, sourceExercises, constraints);
  const fallbackExercises = presetId === 'machine-circuit' && presetExercises.length === 0 ? selectRecommendedExercises(focus, exercises, constraints) : presetExercises;

  return fallbackExercises.map((exercise) => applyIntensity(applyPreset(presetId, exercise, createPrescription(exercise, experience, goal, createId), experience), intensity));
}

export function adjustPrescriptionsForIntensity(prescriptions: Prescription[], from: WorkoutIntensity, to: WorkoutIntensity): Prescription[] {
  if (from === to) return prescriptions;

  const current = INTENSITY_PROFILES[from];
  const next = INTENSITY_PROFILES[to];
  return prescriptions.map((prescription) => ({
    ...prescription,
    sets: Math.max(1, prescription.sets + next.setDelta - current.setDelta),
    dose: { ...prescription.dose, value: adjustIntensityDose(prescription.dose.value, prescription.dose.kind, next.doseFactor / current.doseFactor) },
    restSeconds: Math.min(180, Math.max(0, prescription.restSeconds + next.restDelta - current.restDelta)),
    notes: updateIntensityNote(prescription.notes, prescription.dose.kind === 'reps' ? next.targetRir : undefined),
    targetRir: prescription.dose.kind === 'reps' ? next.targetRir : undefined,
  }));
}

function applyPreset(presetId: WorkoutPreset, exercise: Exercise, prescription: Prescription, experience: Experience): Prescription {
  const aerobic = exercise.exerciseType === 'aerobic';
  if (presetId === 'easy-one') return { ...prescription, sets: aerobic ? 1 : 2, dose: { ...prescription.dose, value: aerobic ? 600 : Math.max(6, Math.round(prescription.dose.value * 0.8)) }, restSeconds: 60, notes: 'Keep this easy and controlled. Finish with about 3 reps in reserve.', recommendedLoadKg: reduceStartingLoad(prescription.recommendedLoadKg), targetRir: aerobic ? undefined : 3 };
  if (presetId === 'strength-base') return { ...prescription, sets: aerobic ? 1 : experience === 'beginner' ? 3 : 4, dose: { ...prescription.dose, value: aerobic ? 600 : 5 }, restSeconds: 120, notes: 'Use a controlled weight/resistance and stop with about 2 reps in reserve.', targetRir: aerobic ? undefined : 2 };
  if (presetId === 'muscle-builder') return { ...prescription, sets: aerobic ? 1 : 3, dose: { ...prescription.dose, value: aerobic ? 900 : 10 }, restSeconds: 90, notes: 'Use a full range of motion and finish with about 2 reps in reserve.', targetRir: aerobic ? undefined : 2 };
  if (presetId === 'machine-circuit') return { ...prescription, sets: aerobic ? 1 : 3, dose: { ...prescription.dose, value: aerobic ? 600 : 12 }, restSeconds: 60, notes: 'Set the station up carefully and keep the movement controlled.', targetRir: aerobic ? undefined : 2 };
  if (presetId === 'quick-sweat') return { ...prescription, sets: aerobic ? 3 : 2, dose: { ...prescription.dose, value: aerobic ? 120 : 12 }, restSeconds: 30, notes: 'Move steadily and keep the effort challenging but repeatable.', recommendedLoadKg: reduceStartingLoad(prescription.recommendedLoadKg), targetRir: aerobic ? undefined : 3 };
  return { ...prescription, sets: 1, dose: { ...prescription.dose, value: 600 }, restSeconds: 60, notes: 'Hold a steady, conversational pace rather than sprinting.', targetRir: undefined };
}

function createPrescription(exercise: Exercise, experience: Experience, goal: Goal, createId: () => string): Prescription {
  return {
    id: createId(),
    exerciseId: exercise.id,
    sets: exercise.exerciseType === 'aerobic' ? 1 : recommendedSets(experience, goal),
    dose: { kind: exercise.doseKind, value: recommendedDose(exercise, goal) },
    restSeconds: recommendedRest(exercise),
    notes: 'Aim to finish with about 2 reps in reserve.',
    recommendedLoadKg: STARTING_LOADS[exercise.id]?.[experience] ?? null,
    targetRir: exercise.doseKind === 'reps' ? 2 : undefined,
  };
}

function applyIntensity(prescription: Prescription, intensity: WorkoutIntensity): Prescription {
  return adjustPrescriptionsForIntensity([prescription], 'moderate', intensity)[0];
}

function adjustIntensityDose(value: number, kind: Prescription['dose']['kind'], factor: number): number {
  const step = kind === 'duration' ? 5 : 1;
  return Math.max(step, Math.round((value * factor) / step) * step);
}

function updateIntensityNote(note: string, targetRir: number | undefined): string {
  return targetRir === undefined ? note : note.replace(/\d+\s+reps?\s+in\s+reserve/i, `${targetRir} reps in reserve`);
}

function reduceStartingLoad(load: number | null | undefined): number | null | undefined {
  return load && load > 0 ? roundLoad(load * 0.8) : load;
}

export function recommendNextPrescriptions(plan: WorkoutPlan, records: WorkoutRecord[]): Prescription[] {
  return plan.prescriptions.map((prescription) => recommendNextPrescription(prescription, plan.id, records));
}

export type EffortDirection = 'increase' | 'decrease' | 'hold' | 'insufficient-data';

export interface EffortAssessment {
  direction: EffortDirection;
  label: string;
  detail: string;
  completedSessions: number;
}

export type IntensityResult = 'above' | 'on-target' | 'below' | 'insufficient-data';

export interface IntensityAssessment {
  result: IntensityResult;
  label: string;
  detail: string;
  completedSessions: number;
}

export function assessPlanIntensity(plan: WorkoutPlan, records: WorkoutRecord[]): IntensityAssessment {
  const completed = completedPlanRecords(plan.id, records);
  const latest = completed.find((record) => recordHasIntensityData(record));
  if (!latest) return { result: 'insufficient-data', label: 'No intensity result yet', detail: 'Log actual reps, duration, weight/resistance, or RIR (reps in reserve) in a completed session.', completedSessions: 0 };

  const currentIntensity = plan.intensity ?? 'moderate';
  const measuredIntensity = latest.planSnapshot.intensity ?? currentIntensity;
  const result = compareRecordIntensity(latest, measuredIntensity);
  if (measuredIntensity !== currentIntensity && result === 'above') return { result, label: 'Target advanced', detail: `You exceeded the previous ${INTENSITY_LABELS[measuredIntensity]} target, so this plan is now ${INTENSITY_LABELS[currentIntensity]}.`, completedSessions: completed.filter(recordHasIntensityData).length };
  if (result === 'above') return { result, label: 'Above target intensity', detail: 'Your latest logged session was harder than this plan’s target.', completedSessions: completed.filter(recordHasIntensityData).length };
  if (result === 'below') return { result, label: 'Below target intensity', detail: 'Your latest logged session was lighter than this plan’s target.', completedSessions: completed.filter(recordHasIntensityData).length };
  return { result, label: 'Target intensity achieved', detail: 'Your latest logged session matched this plan’s target.', completedSessions: completed.filter(recordHasIntensityData).length };
}

export function recommendNextIntensity(plan: WorkoutPlan, records: WorkoutRecord[], recurring = plan.schedule.kind === 'weekly'): WorkoutIntensity {
  const current = plan.intensity ?? 'moderate';
  if (!recurring) return current;
  const recent = completedPlanRecords(plan.id, records).slice(0, 2);
  if (recent.length < 2 || recent.some((record) => compareRecordIntensity(record, record.planSnapshot.intensity ?? current) !== 'above')) return current;
  return nextIntensity(current) ?? current;
}

function nextIntensity(intensity: WorkoutIntensity): WorkoutIntensity | undefined {
  return ({ easy: 'moderate', moderate: 'hard', hard: 'very-hard', 'very-hard': undefined } as const)[intensity];
}

function completedPlanRecords(planId: string, records: WorkoutRecord[]): WorkoutRecord[] {
  return records.filter((record) => record.sourcePlanId === planId && record.status === 'completed').sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
}

function recordHasIntensityData(record: WorkoutRecord): boolean {
  return record.sets.some((set) => set.actualReps !== null || set.actualDurationSeconds !== null || set.loadKg !== null || set.rir !== null && set.rir !== undefined);
}

function compareRecordIntensity(record: WorkoutRecord, intensity: WorkoutIntensity): IntensityResult {
  const scores = record.planSnapshot.prescriptions.flatMap((prescription) => record.sets
    .filter((set) => set.prescriptionId === prescription.id)
    .map((set) => intensityScore(prescription, set, intensity))
    .filter((score): score is number => score !== null));
  if (!scores.length) return 'insufficient-data';

  const average = scores.reduce((total, score) => total + score, 0) / scores.length;
  return average > 0.25 ? 'above' : average < -0.25 ? 'below' : 'on-target';
}

function intensityScore(prescription: Prescription, set: SetRecord, intensity: WorkoutIntensity): number | null {
  const scores: number[] = [];
  const actual = actualValue(set, prescription.dose.kind);
  if (actual !== null) scores.push(actual > prescription.dose.value ? 1 : actual < prescription.dose.value * 0.8 ? -1 : 0);

  if (prescription.dose.kind === 'reps' && set.rir !== null && set.rir !== undefined) {
    const targetRir = INTENSITY_PROFILES[intensity].targetRir;
    scores.push(set.rir < targetRir ? 1 : set.rir > targetRir ? -1 : 0);
  }

  const plannedLoad = prescription.recommendedLoadKg;
  if (plannedLoad && plannedLoad > 0 && set.loadKg !== null) scores.push(set.loadKg > plannedLoad ? 1 : set.loadKg < plannedLoad * 0.8 ? -1 : 0);
  return scores.length ? scores.reduce((total, score) => total + score, 0) / scores.length : null;
}

export function assessPrescriptionEffort(prescription: Prescription, planId: string, records: WorkoutRecord[]): EffortAssessment {
  const recent = recentPerformances(prescription, planId, records);
  if (!recent.length) return { direction: 'insufficient-data', label: 'No result yet', detail: 'Log a completed session to start the comparison.', completedSessions: 0 };
  if (recent.length < 2) return { direction: 'insufficient-data', label: 'Trend building', detail: 'Complete one more session to calculate a change.', completedSessions: recent.length };

  const signals = recent.map(performanceSignal);
  if (signals.every((signal) => signal.burden)) return { direction: 'decrease', label: 'Decrease effort', detail: 'Recent results show below-target work, drop-off, or very low RIR (reps in reserve).', completedSessions: recent.length };
  if (signals.every((signal) => signal.overperformed)) return { direction: 'increase', label: 'Increase effort', detail: 'Recent results exceeded the planned target in every logged set.', completedSessions: recent.length };
  return { direction: 'hold', label: 'Hold effort', detail: 'Recent results are within a repeatable range.', completedSessions: recent.length };
}

function recommendNextPrescription(prescription: Prescription, planId: string, records: WorkoutRecord[]): Prescription {
  const recent = recentPerformances(prescription, planId, records);
  if (recent.length < 2) return prescription;

  const signals = recent.map(performanceSignal);
  if (signals.every((signal) => signal.burden)) return reducePrescription(prescription, recent[0]);
  if (signals.every((signal) => signal.overperformed)) return increasePrescription(prescription, recent[0]);
  return prescription;
}

function recentPerformances(prescription: Prescription, planId: string, records: WorkoutRecord[]): { prescription: Prescription; sets: SetRecord[] }[] {
  return records
    .filter((record) => record.sourcePlanId === planId && record.status === 'completed')
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .map((record) => {
      const snapshotPrescription = record.planSnapshot.prescriptions.find((item) => item.exerciseId === prescription.exerciseId);
      if (!snapshotPrescription) return null;
      const sets = record.sets
        .filter((set) => set.prescriptionId === snapshotPrescription.id && actualValue(set, snapshotPrescription.dose.kind) !== null)
        .sort((a, b) => a.setNumber - b.setNumber);
      return sets.length ? { prescription: snapshotPrescription, sets } : null;
    })
    .filter((performance): performance is { prescription: Prescription; sets: SetRecord[] } => Boolean(performance))
    .slice(0, 2);
}

function performanceSignal(performance: { prescription: Prescription; sets: SetRecord[] }): { burden: boolean; overperformed: boolean } {
  const target = performance.prescription.dose.value;
  const values = performance.sets.map((set) => actualValue(set, performance.prescription.dose.kind)).filter((value): value is number => value !== null);
  const dropOff = values.length > 1 && values[0] - values[values.length - 1] >= Math.max(2, target * 0.25);
  const lowReps = values.some((value) => value <= target * 0.8);
  const lowReserve = performance.sets.some((set) => set.rir !== null && set.rir !== undefined && set.rir < (performance.prescription.targetRir ?? 2));

  return {
    burden: lowReps || dropOff || lowReserve,
    overperformed: values.every((value) => value > target),
  };
}

function reducePrescription(prescription: Prescription, latest: { prescription: Prescription; sets: SetRecord[] }): Prescription {
  const observedLoad = latest.sets.map((set) => set.loadKg).find((load): load is number => load !== null && load > 0);
  const currentLoad = prescription.recommendedLoadKg ?? observedLoad ?? null;
  const nextLoad = currentLoad && currentLoad > 0 ? roundLoad(currentLoad * 0.9) : currentLoad;
  const nextDose = currentLoad && currentLoad > 0 ? prescription.dose.value : adjustDose(prescription, -1);

  return {
    ...prescription,
    dose: { ...prescription.dose, value: nextDose },
    restSeconds: Math.min(180, prescription.restSeconds + 30),
    recommendedLoadKg: nextLoad,
  };
}

function increasePrescription(prescription: Prescription, latest: { prescription: Prescription; sets: SetRecord[] }): Prescription {
  const observedLoad = latest.sets.map((set) => set.loadKg).find((load): load is number => load !== null && load > 0);
  const currentLoad = prescription.recommendedLoadKg ?? observedLoad ?? null;
  const nextLoad = currentLoad && currentLoad > 0 ? roundLoad(currentLoad * 1.05) : currentLoad;
  const nextDose = currentLoad && currentLoad > 0 ? prescription.dose.value : adjustDose(prescription, 1);

  return {
    ...prescription,
    dose: { ...prescription.dose, value: nextDose },
    recommendedLoadKg: nextLoad,
  };
}

function focusScore(exercise: Exercise, targetAreas: readonly string[]): number {
  const primaryMatches = exercise.primaryAreas.filter((area) => targetAreas.includes(area)).length;
  const secondaryMatches = exercise.secondaryAreas.filter((area) => targetAreas.includes(area)).length;
  return primaryMatches * 3 + secondaryMatches;
}

function recommendedSets(experience: Experience, goal: Goal): number {
  const base = experience === 'beginner' ? 2 : experience === 'advanced' ? 4 : 3;
  return goal === 'lose-fat' ? Math.max(2, base - 1) : goal === 'build-muscle' ? Math.max(3, base) : base;
}

function recommendedDose(exercise: Exercise, goal: Goal): number {
  if (exercise.exerciseType === 'aerobic') return 600;
  if (exercise.doseKind === 'duration') return 30;
  if (goal === 'lose-fat') return 12;
  if (goal === 'build-muscle') return 8;
  return 10;
}

function recommendedRest(exercise: Exercise): number {
  if (exercise.exerciseType === 'aerobic') return 60;
  const compoundAreas = ['chest', 'back', 'legs', 'glutes'];
  return exercise.primaryAreas.some((area) => compoundAreas.includes(area)) ? 90 : 60;
}

function actualValue(set: SetRecord, kind: 'reps' | 'duration'): number | null {
  return kind === 'reps' ? set.actualReps : set.actualDurationSeconds;
}

function adjustDose(prescription: Prescription, amount: number): number {
  const step = prescription.dose.kind === 'reps' ? 1 : 5;
  return Math.max(1, prescription.dose.value + amount * step);
}

function roundLoad(value: number): number {
  return Math.max(0.5, Math.round(value * 2) / 2);
}
