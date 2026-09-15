import { AREA_LABELS, occursOn, type Area, type WorkoutPlan, type WorkoutProgram, type WorkoutRecord } from '../domain';
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

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  value: number;
  unit: 'kg' | 'reps' | 'sec';
  date: string;
}

export function getPersonalRecords(records: readonly WorkoutRecord[], limit = 6): PersonalRecord[] {
  const groups = new Map<string, { name: string; loads: { value: number; date: string }[]; doses: { value: number; unit: 'reps' | 'sec'; date: string }[] }>();
  for (const record of records) {
    if (record.status !== 'completed') continue;
    for (const prescription of record.planSnapshot.prescriptions) {
      const exercise = record.planSnapshot.exercises.find((item) => item.id === prescription.exerciseId);
      if (!exercise) continue;
      const group = groups.get(exercise.id) ?? { name: exercise.name, loads: [], doses: [] };
      for (const set of record.sets.filter((item) => item.prescriptionId === prescription.id)) {
        if (set.loadKg !== null && set.loadKg !== undefined && set.loadKg > 0) group.loads.push({ value: set.loadKg, date: record.sessionDate });
        const dose = prescription.dose.kind === 'reps' ? set.actualReps : set.actualDurationSeconds;
        if (dose !== null && dose !== undefined) group.doses.push({ value: dose, unit: prescription.dose.kind === 'reps' ? 'reps' : 'sec', date: record.sessionDate });
      }
      groups.set(exercise.id, group);
    }
  }
  return [...groups.entries()].map(([exerciseId, group]) => {
    const bestLoad = group.loads.sort(compareObservation).at(-1);
    if (bestLoad) return { exerciseId, exerciseName: group.name, value: bestLoad.value, unit: 'kg' as const, date: bestLoad.date };
    const bestDose = group.doses.sort(compareObservation).at(-1);
    return bestDose ? { exerciseId, exerciseName: group.name, value: bestDose.value, unit: bestDose.unit, date: bestDose.date } : null;
  }).filter((record): record is PersonalRecord => Boolean(record)).sort((a, b) => b.value - a.value).slice(0, limit);
}

export interface WeeklyVolumeSummary {
  current: number;
  previous: number;
  changePercent: number | null;
}

export function getWeeklyVolumeSummary(records: readonly WorkoutRecord[], endDate: string): WeeklyVolumeSummary {
  const current = volumeBetween(records, endDate, 0, 6);
  const previous = volumeBetween(records, endDate, 7, 13);
  return { current, previous, changePercent: previous ? Math.round(((current - previous) / previous) * 100) : null };
}

export interface AdherenceSummary {
  scheduled: number;
  completed: number;
  percentage: number | null;
  windowDays: number;
}

export function getAdherenceSummary(plans: readonly WorkoutPlan[], programs: readonly WorkoutProgram[], records: readonly WorkoutRecord[], endDate: string, windowDays = 28): AdherenceSummary {
  let scheduled = 0;
  let completed = 0;
  for (let offset = 0; offset < windowDays; offset += 1) {
    const date = shiftDate(endDate, -offset);
    for (const plan of plans) {
      if (!occursOn(plan, date, programs)) continue;
      scheduled += 1;
      if (records.some((record) => record.status === 'completed' && record.sourcePlanId === plan.id && record.sessionDate === date)) completed += 1;
    }
  }
  return { scheduled, completed, percentage: scheduled ? Math.round((completed / scheduled) * 100) : null, windowDays };
}

export interface MuscleBalanceEntry {
  area: Area;
  label: string;
  sets: number;
  percentage: number;
}

export function getMuscleBalance(records: readonly WorkoutRecord[], endDate: string, windowDays = 28): MuscleBalanceEntry[] {
  const counts = new Map<Area, number>();
  for (const record of records) {
    if (record.status !== 'completed' || record.sessionDate < shiftDate(endDate, -(windowDays - 1)) || record.sessionDate > endDate) continue;
    for (const prescription of record.planSnapshot.prescriptions) {
      const exercise = record.planSnapshot.exercises.find((item) => item.id === prescription.exerciseId);
      const area = exercise?.primaryAreas[0];
      if (!area) continue;
      const recordedSets = record.sets.filter((set) => set.prescriptionId === prescription.id && hasSetData(set)).length;
      counts.set(area, (counts.get(area) ?? 0) + (recordedSets || prescription.sets));
    }
  }
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([area, sets]) => ({ area, label: AREA_LABELS[area], sets, percentage: total ? Math.round((sets / total) * 100) : 0 }));
}

function compareObservation(a: { value: number; date: string }, b: { value: number; date: string }): number {
  return a.value - b.value || a.date.localeCompare(b.date);
}

function volumeBetween(records: readonly WorkoutRecord[], endDate: string, startOffset: number, endOffset: number): number {
  return records.filter((record) => record.status === 'completed' && record.sessionDate >= shiftDate(endDate, -endOffset) && record.sessionDate <= shiftDate(endDate, -startOffset)).reduce((total, record) => total + recordSetVolume(record), 0);
}

function recordSetVolume(record: WorkoutRecord): number {
  const recorded = record.sets.filter(hasSetData).length;
  return recorded || record.planSnapshot.prescriptions.reduce((total, prescription) => total + prescription.sets, 0);
}

function hasSetData(set: WorkoutRecord['sets'][number]): boolean {
  return set.actualReps !== null || set.actualDurationSeconds !== null || set.loadKg !== null || set.rir !== null && set.rir !== undefined || Boolean(set.notes);
}

function shiftDate(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
