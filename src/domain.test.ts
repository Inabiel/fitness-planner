import { describe, expect, it } from 'vitest';
import { calculateEstimates, occurrenceAfter, occurrenceBefore, occursOn, suggestArea, type Profile, type WorkoutPlan } from './domain';

const profile: Profile = {
  id: 'profile', name: 'Alex', age: 30, sex: 'female', heightCm: 170, weightKg: 70,
  activityLevel: 'moderate', experience: 'beginner', primaryGoal: 'build-muscle', secondaryGoals: [],
  updatedAt: '2026-01-01T00:00:00.000Z', revision: 1,
};

const plan: WorkoutPlan = {
  id: 'plan', name: 'Monday strength', revision: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  primaryTargetArea: 'full-body', focusConfirmed: true, schedule: { kind: 'weekly', weekday: 1, startsOn: '2026-01-05' }, prescriptions: [],
};

describe('fitness rules', () => {
  it('calculates distinct BMI and daily nutrition estimates', () => {
    const estimate = calculateEstimates(profile);
    expect(estimate.bmi).toBeCloseTo(24.2, 1);
    expect(estimate.dailyCalories).toBeGreaterThan(1200);
    expect(estimate.ruleVersion).toBe('MVP-2026.1');
  });

  it('keeps recurring sessions on local calendar weekdays', () => {
    expect(occursOn(plan, '2026-01-05')).toBe(true);
    expect(occursOn(plan, '2026-01-12')).toBe(true);
    expect(occursOn(plan, '2026-01-06')).toBe(false);
    expect(occursOn(plan, '2025-12-29')).toBe(false);
  });

  it('finds the nearest scheduled workout before and after a selected date', () => {
    expect(occurrenceBefore(plan, '2026-01-14')).toBe('2026-01-12');
    expect(occurrenceAfter(plan, '2026-01-14')).toBe('2026-01-19');
    expect(occurrenceBefore({ ...plan, schedule: { kind: 'date', date: '2026-01-08' } }, '2026-01-14')).toBe('2026-01-08');
    expect(occurrenceAfter({ ...plan, schedule: { kind: 'date', date: '2026-01-20' } }, '2026-01-14')).toBe('2026-01-20');
  });

  it('suggests a transparent focus without using history', () => {
    expect(suggestArea('build-muscle', 'beginner').area).toBe('full-body');
    expect(suggestArea('build-muscle', 'advanced').area).toBe('legs');
  });
});
