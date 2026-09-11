import type { WorkoutRecord } from '../domain';
import { formatShortDate } from './formatters';

export interface ProgressPoint {
  id: string;
  label: string;
  value: number;
}

export function getProgressPoints(records: WorkoutRecord[], sourcePlanId?: string): ProgressPoint[] {
  return records
    .filter((record) => record.status === 'completed' && (!sourcePlanId || record.sourcePlanId === sourcePlanId))
    .map((record) => ({
      id: record.id,
      label: record.sessionDate,
      value: sessionProgress(record) ?? 0,
    }))
    .filter((point) => point.value > 0)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((point) => ({ ...point, label: formatShortDate(point.label) }))
    // ponytail: latest eight points keep charts readable; add pagination if history exploration needs it.
    .slice(-8);
}

export function sessionProgress(record: WorkoutRecord): number | null {
  const ratios = record.planSnapshot.prescriptions.flatMap((prescription) => {
    const values = record.sets
      .filter((set) => set.prescriptionId === prescription.id)
      .map((set) => prescription.dose.kind === 'reps' ? set.actualReps : set.actualDurationSeconds)
      .filter((value): value is number => value !== null && value !== undefined);
    if (!values.length || prescription.dose.value <= 0) return [];
    return [values.reduce((total, value) => total + value, 0) / values.length / prescription.dose.value * 100];
  });

  return ratios.length ? Math.round(ratios.reduce((total, value) => total + value, 0) / ratios.length) : null;
}
