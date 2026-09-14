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
});
