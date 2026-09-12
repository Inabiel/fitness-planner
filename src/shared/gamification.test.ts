import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '../domain';
import { getGamificationCelebration, getGamificationFeedback, getGamificationSummary } from './gamification';

function record(date: string, status: WorkoutRecord['status'] = 'completed', id = date): WorkoutRecord {
  return {
    id,
    sourcePlanId: 'plan-1',
    sessionDate: date,
    status,
    completedAt: status === 'completed' ? `${date}T12:00:00.000Z` : null,
    revision: 1,
    planSnapshot: {
      name: 'Plan',
      primaryTargetArea: 'full-body',
      schedule: { kind: 'date', date },
      prescriptions: [],
      exercises: [],
    },
    sets: [],
  };
}

describe('gamification', () => {
  it('counts distinct completed days and excludes unfinished or future records', () => {
    const summary = getGamificationSummary([
      record('2026-09-14'),
      record('2026-09-14', 'completed', 'duplicate'),
      record('2026-09-15'),
      record('2026-09-16', 'in_progress'),
      record('2026-09-22'),
    ], '2026-09-15');

    expect(summary.workoutDays).toEqual(['2026-09-14', '2026-09-15']);
    expect(summary.currentWeekState).toBe('active');
    expect(summary.currentStreak).toBe(1);
    expect(summary.currentWeek.workoutDayCount).toBe(2);
  });

  it('keeps a previous-week streak pending, then breaks it after another inactive week', () => {
    const records = [record('2026-08-31'), record('2026-09-07')];
    const pending = getGamificationSummary(records, '2026-09-14');
    const broken = getGamificationSummary(records, '2026-09-21');

    expect(pending).toMatchObject({ currentWeekState: 'pending', currentStreak: 2, bestStreak: 2 });
    expect(broken).toMatchObject({ currentWeekState: 'broken', currentStreak: 0, bestStreak: 2 });
  });

  it('derives weekly badges and only celebrates a newly crossed milestone', () => {
    const before = getGamificationSummary([record('2026-08-31'), record('2026-09-07'), record('2026-09-14')], '2026-09-21');
    const after = getGamificationSummary([...before.workoutDays.map((date) => record(date)), record('2026-09-21')], '2026-09-21');
    const repeat = getGamificationSummary(after.workoutDays.map((date) => record(date)), '2026-09-21');

    expect(after).toMatchObject({ currentWeekState: 'active', currentStreak: 4, bestStreak: 4 });
    expect(after.badges.find((badge) => badge.id === 'active-weeks-4')).toMatchObject({ earned: true, achievementDate: '2026-09-21' });
    expect(getGamificationCelebration(before, after)).toMatchObject({ title: 'Your streak is on fire!', streak: 4, badgeNames: ['Four weeks of consistency'] });
    expect(getGamificationFeedback(before, after)).toContain('Four weeks of consistency');
    expect(getGamificationFeedback(after, repeat)).toBeNull();
  });

  it('celebrates the first active week once, then stays quiet for same-week completions', () => {
    const before = getGamificationSummary([], '2026-09-14');
    const after = getGamificationSummary([record('2026-09-14')], '2026-09-14');
    const repeat = getGamificationSummary([...after.workoutDays.map((date) => record(date)), record('2026-09-14', 'completed', 'repeat')], '2026-09-14');

    expect(getGamificationCelebration(before, after)).toMatchObject({ title: 'Your streak is on fire!', streak: 1, badgeNames: ['First step'] });
    expect(getGamificationCelebration(after, repeat)).toBeNull();
  });
});
