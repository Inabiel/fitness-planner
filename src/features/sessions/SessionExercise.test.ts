import { describe, expect, it } from 'vitest';
import type { Prescription, SetRecord } from '../../domain';
import { getVisibleSetCount } from './SessionExercise';

const prescription: Prescription = {
  id: 'squat-prescription',
  exerciseId: 'barbell-back-squat',
  sets: 3,
  dose: { kind: 'reps', value: 8 },
  restSeconds: 90,
  notes: '',
};

describe('session exercise set rows', () => {
  it('keeps planned rows and restores saved extra rows', () => {
    const savedSets: SetRecord[] = [
      { prescriptionId: prescription.id, setNumber: 1, actualReps: 8, actualDurationSeconds: null, loadKg: 20, rir: 2 },
      { prescriptionId: prescription.id, setNumber: 4, actualReps: 7, actualDurationSeconds: null, loadKg: 20, rir: 1 },
      { prescriptionId: 'another-prescription', setNumber: 8, actualReps: 8, actualDurationSeconds: null, loadKg: null, rir: null },
    ];

    expect(getVisibleSetCount(prescription, [])).toBe(3);
    expect(getVisibleSetCount(prescription, savedSets)).toBe(4);
  });
});
