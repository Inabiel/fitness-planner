import { describe, expect, it } from 'vitest';
import { calculateEstimates, formatPlanSchedule, occurrenceAfter, occurrenceBefore, occursOn, removePlanFromProgram, rollingProgramPlanOn, suggestArea, type Profile, type WorkoutPlan, type WorkoutProgram } from './domain';

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

  it('resolves an ordered moving-day rotation without changing weekday plans', () => {
    const rotation: WorkoutProgram = {
      id: 'rotation', name: 'Four-day rotation', planIds: ['plan-a', 'plan-b', 'plan-c', 'plan-d'],
      schedule: { kind: 'rolling', startsOn: '2026-01-05', intervalDays: 2 }, revision: 1,
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const planA = { ...plan, id: 'plan-a' };
    const planB = { ...plan, id: 'plan-b' };

    expect(rollingProgramPlanOn(rotation, '2026-01-05')).toBe('plan-a');
    expect(rollingProgramPlanOn(rotation, '2026-01-06')).toBeNull();
    expect(rollingProgramPlanOn(rotation, '2026-01-07')).toBe('plan-b');
    expect(rollingProgramPlanOn(rotation, '2026-01-13')).toBe('plan-a');
    expect(occursOn(planB, '2026-01-07', [rotation])).toBe(true);
    expect(occurrenceAfter(planB, '2026-01-05', [rotation])).toBe('2026-01-07');
    expect(formatPlanSchedule(planA, [rotation])).toBe('Moving rotation · every 2 days · from 2026-01-05');
  });

  it('suggests a transparent focus without using history', () => {
    expect(suggestArea('build-muscle', 'beginner').area).toBe('full-body');
    expect(suggestArea('build-muscle', 'advanced').area).toBe('legs');
  });

  it('removes a deleted plan from program membership', () => {
    const program: WorkoutProgram = { id: 'program', name: 'Strength', planIds: ['plan', 'other-plan'], revision: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
    expect(removePlanFromProgram(program, 'plan').planIds).toEqual(['other-plan']);
  });
});
