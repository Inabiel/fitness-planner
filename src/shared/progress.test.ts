import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../data/exercises';
import type { WorkoutRecord } from '../domain';
import { getAdherenceSummary, getMuscleBalance, getPersonalRecords, getProgressPoints, getWeeklyVolumeSummary, sessionProgress } from './progress';

const record: WorkoutRecord = {
  id: 'record-1',
  sourcePlanId: 'plan-1',
  sessionDate: '2026-01-12',
  status: 'completed',
  completedAt: '2026-01-12T18:00:00.000Z',
  revision: 1,
  planSnapshot: {
    name: 'Push day',
    primaryTargetArea: 'chest',
    schedule: { kind: 'weekly', weekday: 1, startsOn: '2026-01-05' },
    prescriptions: [{ id: 'push-up', exerciseId: 'push-up', sets: 2, dose: { kind: 'reps', value: 10 }, restSeconds: 60, notes: '' }],
    exercises: [EXERCISES.find((exercise) => exercise.id === 'push-up')!],
  },
  sets: [
    { prescriptionId: 'push-up', setNumber: 1, actualReps: 10, actualDurationSeconds: null, loadKg: null, rir: null },
    { prescriptionId: 'push-up', setNumber: 2, actualReps: 8, actualDurationSeconds: null, loadKg: null, rir: null },
  ],
};

describe('workout progress', () => {
  it('calculates completed dose against the planned target', () => {
    expect(sessionProgress(record)).toBe(90);
    expect(getProgressPoints([record], 'plan-1')).toEqual([{ id: 'record-1', label: 'Jan 12', value: 90 }]);
  });

  it('derives personal records and weekly volume from completed observations', () => {
    const second = { ...record, id: 'record-2', sessionDate: '2026-01-14', sets: record.sets.map((set) => ({ ...set, actualReps: (set.actualReps ?? 0) + 2, loadKg: 5 })) };
    expect(getPersonalRecords([record, second])).toEqual([{ exerciseId: 'push-up', exerciseName: 'Push-up', value: 5, unit: 'kg', date: '2026-01-14' }]);
    expect(getWeeklyVolumeSummary([record, second], '2026-01-17')).toMatchObject({ current: 4, previous: 0, changePercent: null });
  });

  it('calculates scheduled adherence and primary muscle balance', () => {
    const plan = { id: 'plan-1', name: 'Push day', revision: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01', primaryTargetArea: 'chest' as const, focusConfirmed: true, schedule: { kind: 'weekly' as const, weekday: 1, startsOn: '2026-01-01' }, prescriptions: record.planSnapshot.prescriptions };
    expect(getAdherenceSummary([plan], [], [record], '2026-01-17', 14)).toMatchObject({ scheduled: 2, completed: 1, percentage: 50 });
    expect(getMuscleBalance([record], '2026-01-17')).toEqual([{ area: 'chest', label: 'Chest', sets: 2, percentage: 100 }]);
  });
});
