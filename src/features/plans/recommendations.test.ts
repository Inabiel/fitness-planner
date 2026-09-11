import { describe, expect, it } from 'vitest';
import type { PlanSnapshot, Prescription, WorkoutPlan, WorkoutRecord } from '../../domain';
import { EXERCISES } from '../../data/exercises';
import { assessPlanIntensity, assessPrescriptionEffort, createPresetPrescriptions, createRecommendedPrescriptions, recommendNextIntensity, recommendNextPrescriptions, selectRecommendedExercises } from './recommendations';

const prescription: Prescription = {
  id: 'push-up-prescription',
  exerciseId: 'push-up',
  sets: 3,
  dose: { kind: 'reps', value: 10 },
  restSeconds: 60,
  notes: '',
  recommendedLoadKg: 10,
  targetRir: 2,
};

const plan: WorkoutPlan = {
  id: 'push-plan',
  name: 'Push day',
  revision: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  primaryTargetArea: 'chest',
  focus: 'push',
  intensity: 'moderate',
  focusConfirmed: true,
  schedule: { kind: 'weekly', weekday: 1, startsOn: '2026-01-05' },
  prescriptions: [prescription],
};

function record(date: string, reps: number[], rir: number[]): WorkoutRecord {
  const snapshot: PlanSnapshot = {
    name: plan.name,
    primaryTargetArea: plan.primaryTargetArea,
    focus: plan.focus,
    intensity: plan.intensity,
    schedule: plan.schedule,
    prescriptions: [prescription],
    exercises: [EXERCISES[0]],
  };

  return {
    id: `record-${date}`,
    sourcePlanId: plan.id,
    sessionDate: date,
    status: 'completed',
    completedAt: `${date}T18:00:00.000Z`,
    revision: 1,
    planSnapshot: snapshot,
    sets: reps.map((actualReps, index) => ({
      prescriptionId: prescription.id,
      setNumber: index + 1,
      actualReps,
      actualDurationSeconds: null,
      loadKg: 10,
      rir: rir[index] ?? null,
    })),
  };
}

describe('workout recommendations', () => {
  it('selects exercises for split focus and creates profile-aware prescriptions', () => {
    const exercises = selectRecommendedExercises('push', EXERCISES);
    const prescriptions = createRecommendedPrescriptions('push', 'beginner', 'build-muscle', EXERCISES, () => 'id');

    expect(exercises.map((exercise) => exercise.id)).toContain('push-up');
    expect(prescriptions[0]).toMatchObject({ sets: 3, dose: { value: 8 }, targetRir: 2 });
  });

  it('applies presets to the selected intention', () => {
    const easyChest = createPresetPrescriptions('easy-one', 'chest', 'beginner', 'general-fitness', EXERCISES, () => 'easy-id');
    const aerobic = createPresetPrescriptions('aerobic-flow', 'aerobic', 'beginner', 'general-fitness', EXERCISES, () => 'aerobic-id');

    expect(easyChest.every((item) => item.sets === 2 && item.dose.value === 8 && item.targetRir === 3)).toBe(true);
    expect(easyChest.every((item) => ['barbell-bench-press', 'dumbbell-bench-press', 'push-up', 'chest-press-machine'].includes(item.exerciseId))).toBe(true);
    expect(aerobic.length).toBe(4);
    expect(aerobic.every((item) => item.sets === 1 && item.dose.kind === 'duration' && item.dose.value === 600)).toBe(true);
  });

  it('changes generated dose and target effort with intensity', () => {
    const easy = createPresetPrescriptions('machine-circuit', 'push', 'beginner', 'general-fitness', EXERCISES, () => 'easy-id', 'easy');
    const hard = createPresetPrescriptions('machine-circuit', 'push', 'beginner', 'general-fitness', EXERCISES, () => 'hard-id', 'hard');

    expect(easy[0].dose.value).toBeLessThan(hard[0].dose.value);
    expect(easy[0].targetRir).toBe(3);
    expect(hard[0].targetRir).toBe(1);
  });

  it('increases load after two sessions above the recommendation', () => {
    const next = recommendNextPrescriptions(plan, [record('2026-01-12', [11, 12, 11], [3, 3, 3]), record('2026-01-05', [11, 11, 12], [3, 3, 3])]);

    expect(next[0].recommendedLoadKg).toBe(10.5);
  });

  it('reduces load and adds rest after repeated burden signals', () => {
    const next = recommendNextPrescriptions(plan, [record('2026-01-12', [7, 6, 6], [0, 0, 0]), record('2026-01-05', [7, 7, 6], [1, 0, 0])]);

    expect(next[0]).toMatchObject({ recommendedLoadKg: 9, restSeconds: 90 });
  });

  it('explains whether logged effort should increase or decrease', () => {
    expect(assessPrescriptionEffort(prescription, plan.id, [record('2026-01-12', [11, 12, 11], [3, 3, 3]), record('2026-01-05', [11, 11, 12], [3, 3, 3])]).direction).toBe('increase');
    expect(assessPrescriptionEffort(prescription, plan.id, [record('2026-01-12', [7, 6, 6], [0, 0, 0]), record('2026-01-05', [7, 7, 6], [1, 0, 0])]).direction).toBe('decrease');
  });

  it('reports and advances a recurring plan after repeated above-target intensity', () => {
    const records = [record('2026-01-12', [11, 12, 11], [2, 2, 2]), record('2026-01-05', [11, 11, 12], [2, 2, 2])];

    expect(assessPlanIntensity(plan, records).result).toBe('above');
    expect(assessPlanIntensity({ ...plan, intensity: 'hard' }, records).label).toBe('Target advanced');
    expect(recommendNextIntensity(plan, records)).toBe('hard');
  });

  it('does not advance intensity for one-time plans', () => {
    const oneTimePlan = { ...plan, schedule: { kind: 'date' as const, date: '2026-01-12' } };
    const records = [record('2026-01-12', [11, 12, 11], [2, 2, 2]), record('2026-01-05', [11, 11, 12], [2, 2, 2])];

    expect(recommendNextIntensity(oneTimePlan, records)).toBe('moderate');
  });

  it('does not treat the planned very-hard RIR as a burden signal', () => {
    const veryHardPlan = { ...plan, intensity: 'very-hard' as const, prescriptions: [{ ...prescription, targetRir: 0 }] };
    const veryHardRecord = (date: string): WorkoutRecord => {
      const base = record(date, [10, 10, 10], [0, 0, 0]);
      return {
        ...base,
        planSnapshot: { ...base.planSnapshot, intensity: 'very-hard', prescriptions: veryHardPlan.prescriptions },
        sets: base.sets.map((set) => ({ ...set, prescriptionId: veryHardPlan.prescriptions[0].id })),
      };
    };

    expect(recommendNextPrescriptions(veryHardPlan, [veryHardRecord('2026-01-12'), veryHardRecord('2026-01-05')])[0]).toEqual(veryHardPlan.prescriptions[0]);
  });
});
