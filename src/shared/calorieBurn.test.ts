import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '../domain';
import { estimateWorkoutCalories, getCalorieBurnSummary } from './calorieBurn';

function record(date: string, intensity: WorkoutRecord['planSnapshot']['intensity'] = 'moderate', id = date): WorkoutRecord {
  return {
    id,
    sourcePlanId: 'plan-1',
    sessionDate: date,
    status: 'completed',
    completedAt: `${date}T12:00:00.000Z`,
    revision: 1,
    planSnapshot: {
      name: 'Plan',
      primaryTargetArea: 'full-body',
      intensity,
      schedule: { kind: 'date', date },
      prescriptions: [{ id: 'prescription-1', exerciseId: 'squat', sets: 3, dose: { kind: 'reps', value: 10 }, restSeconds: 60, notes: '' }],
      exercises: [],
    },
    sets: [],
  };
}

describe('calorie burn', () => {
  it('estimates active calories from plan duration, intensity, and body weight', () => {
    expect(estimateWorkoutCalories(record('2026-09-13'), 70)).toBe(49);
  });

  it('aggregates completed history into local calendar periods', () => {
    const summary = getCalorieBurnSummary([
      record('2026-09-13'),
      record('2026-09-10', 'hard'),
      record('2026-09-01'),
      record('2026-08-31'),
      record('2025-12-31'),
      { ...record('2026-09-13', 'moderate', 'unfinished'), status: 'in_progress', completedAt: null },
    ], { weightKg: 70 }, [], '2026-09-13');

    expect(summary.today).toBe(49);
    expect(summary.week).toBeGreaterThan(summary.today);
    expect(summary.month).toBeGreaterThan(summary.week);
    expect(summary.year).toBeGreaterThan(summary.month);
    expect(summary.overall).toBeGreaterThan(summary.year);
  });
});
