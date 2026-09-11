import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '../domain';
import { getProgressPoints, sessionProgress } from './progress';

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
    exercises: [],
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
});
