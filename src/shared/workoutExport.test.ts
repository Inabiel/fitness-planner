import { describe, expect, it } from 'vitest';
import type { Prescription, WorkoutPlan } from '../domain';
import { EXERCISES } from '../data/exercises';
import { formatWorkoutPlanText, formatWorkoutStepText } from './workoutExport';

describe('workout plan export', () => {
  const plan: WorkoutPlan = {
    id: 'plan-1',
    name: 'Push day',
    revision: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    primaryTargetArea: 'chest',
    focus: 'push',
    intensity: 'easy',
    focusConfirmed: true,
    schedule: { kind: 'weekly', weekday: 1, startsOn: '2026-01-05' },
    prescriptions: [{
      id: 'prescription-1',
      exerciseId: 'push-up',
      sets: 2,
      dose: { kind: 'reps', value: 8 },
      restSeconds: 60,
      notes: 'Controlled tempo',
      recommendedLoadKg: 0,
      targetRir: 3,
    }],
  };

  it('formats a plan for copying into a message', () => {
    expect(formatWorkoutPlanText(plan, EXERCISES)).toContain('*Push day*\nFocus: Push\nTarget intensity: Easy');
    expect(formatWorkoutPlanText(plan, EXERCISES)).toContain('1. Push-up — 2 × 8 reps · Bodyweight · Target 3 RIR · Controlled tempo\n   Rest 60 sec');
    expect(formatWorkoutPlanText(plan, EXERCISES)).toContain('After training: log actual reps or duration, load, and RIR in fitnessPal.');
  });

  it('formats an individual workout step with instructions', () => {
    const exercise = EXERCISES.find((item) => item.id === 'push-up');
    if (!exercise) throw new Error('Test exercise missing');
    const prescription: Prescription = {
      id: 'prescription-1',
      exerciseId: 'push-up',
      sets: 2,
      dose: { kind: 'reps', value: 8 },
      restSeconds: 60,
      notes: 'Controlled tempo',
      recommendedLoadKg: 0,
      targetRir: 3,
    };

    expect(formatWorkoutStepText(prescription, exercise, 1)).toContain('*Step 1: Push-up*\nPlan: 2 × 8 reps\nLoad: Bodyweight\nRest: 60 sec\nTarget: 3 RIR');
    expect(formatWorkoutStepText(prescription, exercise, 1)).toContain(`Instructions:\n1. ${exercise.instructions[0]}`);
  });
});
