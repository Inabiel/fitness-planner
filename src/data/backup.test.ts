import { describe, expect, it } from 'vitest';
import { parseBackup } from './backup';

const emptyBackup = JSON.stringify({
  format: 'fitnesspal-backup',
  version: 1,
  exportedAt: '2026-09-14T00:00:00.000Z',
  data: { profile: null, plans: [], programs: [], records: [], weights: [] },
});

describe('fitnessPal backups', () => {
  it('accepts an empty versioned backup', () => {
    expect(parseBackup(emptyBackup).data).toEqual({ profile: null, plans: [], programs: [], records: [], weights: [] });
  });

  it('rejects malformed backup data', () => {
    expect(() => parseBackup('{"format":"other"}')).toThrow('valid fitnessPal backup');
  });

  it('preserves optional feature fields in a version-one backup', () => {
    const backup = JSON.stringify({
      format: 'fitnesspal-backup', version: 1, exportedAt: '2026-09-15T00:00:00.000Z',
      data: {
        profile: null,
        plans: [{ id: 'plan-1', name: 'Push', revision: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01', primaryTargetArea: 'chest', focusConfirmed: true, schedule: { kind: 'date', date: '2026-01-01' }, prescriptions: [], constraints: { durationMinutes: 30, availableEquipment: ['Cable machine'] } }],
        programs: [{ id: 'program-1', name: 'Rotation', planIds: ['plan-1'], schedule: { kind: 'rolling', startsOn: '2026-01-01', intervalDays: 2, advanceOnCompletion: true, deloadEveryRotations: 4 }, skippedDates: ['2026-01-03'], rescheduledOccurrences: [], revision: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
        records: [{ id: 'record-1', sourcePlanId: 'plan-1', sessionDate: '2026-01-01', status: 'completed', completedAt: '2026-01-01', revision: 1, planSnapshot: { name: 'Push', primaryTargetArea: 'chest', schedule: { kind: 'date', date: '2026-01-01' }, prescriptions: [], exercises: [], programDeload: true, constraints: { durationMinutes: 30 } }, sets: [{ prescriptionId: 'set-1', setNumber: 1, actualReps: null, actualDurationSeconds: null, loadKg: null, rir: null, notes: 'Felt steady' }] }],
        weights: [],
      },
    });
    const parsed = parseBackup(backup);
    expect(parsed.data.plans[0].constraints?.durationMinutes).toBe(30);
    expect(parsed.data.programs[0].schedule?.advanceOnCompletion).toBe(true);
    expect(parsed.data.records[0].sets[0].notes).toBe('Felt steady');
  });
});
