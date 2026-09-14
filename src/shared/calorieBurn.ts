import { dateIsValid, localDate, weekdayFor, type BodyWeightRecord, type Profile, type Prescription, type WorkoutIntensity, type WorkoutPlan, type WorkoutRecord } from '../domain';

export interface CalorieBurnSummary {
  today: number;
  week: number;
  month: number;
  year: number;
  overall: number;
}

const INTENSITY_MET: Record<WorkoutIntensity, number> = {
  easy: 3.5,
  moderate: 5,
  hard: 6.5,
  'very-hard': 8,
};

export function getCalorieBurnSummary(records: WorkoutRecord[], profile: Pick<Profile, 'weightKg'>, weights: BodyWeightRecord[] = [], requestedToday: string = localDate()): CalorieBurnSummary {
  const today = dateIsValid(requestedToday) ? requestedToday : localDate();
  const weekStart = shiftDate(today, 1 - weekdayFor(today));
  const monthStart = `${today.slice(0, 7)}-01`;
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const totals = { today: 0, week: 0, month: 0, year: 0, overall: 0 };

  records.forEach((record) => {
    if (record.status !== 'completed' || !dateIsValid(record.sessionDate) || record.sessionDate > today) return;
    const calories = estimateWorkoutCalories(record, profile.weightKg, weights);
    totals.overall += calories;
    if (record.sessionDate === today) totals.today += calories;
    if (record.sessionDate >= weekStart) totals.week += calories;
    if (record.sessionDate >= monthStart) totals.month += calories;
    if (record.sessionDate >= yearStart) totals.year += calories;
  });

  return totals;
}

export function estimateWorkoutCalories(record: WorkoutRecord, fallbackWeightKg: number, weights: BodyWeightRecord[] = []): number {
  const weightKg = weights
    .filter((weight) => dateIsValid(weight.date) && weight.date <= record.sessionDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg ?? fallbackWeightKg;
  return estimatePlanCalories(record.planSnapshot, weightKg);
}

export function estimatePlanCalories(plan: Pick<WorkoutPlan, 'intensity' | 'prescriptions'>, weightKg: number): number {
  if (!plan.prescriptions.length) return 0;
  const minutes = estimateWorkoutMinutes(plan.prescriptions);
  const activeCalories = (INTENSITY_MET[plan.intensity ?? 'moderate'] - 1) * 3.5 * weightKg * minutes / 200;
  return Math.max(0, Math.round(activeCalories));
}

function estimateWorkoutMinutes(prescriptions: readonly Prescription[]): number {
  const activeSeconds = prescriptions.reduce((total, prescription) => {
    const secondsPerSet = prescription.dose.kind === 'duration' ? prescription.dose.value : Math.max(2, prescription.dose.value * 3);
    return total + prescription.sets * secondsPerSet;
  }, 0);
  const restSeconds = prescriptions.reduce((total, prescription) => total + Math.max(0, prescription.sets - 1) * Math.max(0, prescription.restSeconds), 0);
  const transitionSeconds = Math.max(0, prescriptions.length - 1) * 30;
  return Math.max(10, Math.ceil((activeSeconds + restSeconds + transitionSeconds) / 60));
}

function shiftDate(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  return localDate(new Date(year, month - 1, day + days));
}
