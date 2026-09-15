export const GOALS = ['lose-fat', 'build-muscle', 'maintain-weight', 'general-fitness'] as const;
export type Goal = (typeof GOALS)[number];

export const AREAS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full-body'] as const;
export type Area = (typeof AREAS)[number];
export const SPLITS = ['push', 'pull', 'upper-body', 'lower-body'] as const;
export type Split = (typeof SPLITS)[number];
export const WORKOUT_STYLES = ['aerobic'] as const;
export type WorkoutStyle = (typeof WORKOUT_STYLES)[number];
export type WorkoutFocus = Area | Split | WorkoutStyle;

export const WORKOUT_INTENSITIES = ['easy', 'moderate', 'hard', 'very-hard'] as const;
export type WorkoutIntensity = (typeof WORKOUT_INTENSITIES)[number];

export const INTENSITY_LABELS: Record<WorkoutIntensity, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  'very-hard': 'Very hard',
};

export type Sex = 'female' | 'male';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
export type Experience = 'beginner' | 'intermediate' | 'advanced';

export interface Profile {
  id: 'profile';
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  experience: Experience;
  primaryGoal: Goal;
  secondaryGoals: Goal[];
  exerciseOrder?: string[];
  updatedAt: string;
  revision: number;
}

export interface EstimateSnapshot {
  ruleVersion: string;
  calculatedAt: string;
  profileRevision: number;
  bmi: number;
  dailyCalories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
}

export interface Exercise {
  id: string;
  name: string;
  instructions: string[];
  primaryAreas: Area[];
  secondaryAreas: Area[];
  doseKind: 'reps' | 'duration';
  popularityRank: number;
  equipment?: string;
  exerciseType?: 'aerobic';
  mediaLabel: string;
}

export interface Prescription {
  id: string;
  exerciseId: string;
  sets: number;
  dose: { kind: 'reps' | 'duration'; value: number };
  restSeconds: number;
  notes: string;
  recommendedLoadKg?: number | null;
  targetRir?: number;
}

export interface PlanConstraints {
  durationMinutes?: number;
  availableEquipment?: string[];
}

export type Schedule =
  | { kind: 'date'; date: string }
  | { kind: 'weekly'; weekday: number; startsOn: string };

export type ProgramSchedule = {
  kind: 'rolling';
  startsOn: string;
  intervalDays: number;
  advanceOnCompletion?: boolean;
  deloadEveryRotations?: number;
  anchorDate?: string;
  anchorPlanIndex?: number;
};

export interface ProgramReschedule {
  planId: string;
  fromDate: string;
  toDate: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  primaryTargetArea: Area;
  focus?: WorkoutFocus;
  intensity?: WorkoutIntensity;
  focusConfirmed: boolean;
  schedule: Schedule;
  prescriptions: Prescription[];
  estimate?: EstimateSnapshot;
  constraints?: PlanConstraints;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  planIds: string[];
  schedule?: ProgramSchedule;
  skippedDates?: string[];
  rescheduledOccurrences?: ProgramReschedule[];
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export function removePlanFromProgram(program: WorkoutProgram, planId: string): WorkoutProgram {
  return { ...program, planIds: program.planIds.filter((id) => id !== planId) };
}

export interface PlanSnapshot {
  name: string;
  primaryTargetArea: Area;
  focus?: WorkoutFocus;
  intensity?: WorkoutIntensity;
  schedule: Schedule;
  prescriptions: Prescription[];
  exercises: Exercise[];
  estimate?: EstimateSnapshot;
  constraints?: PlanConstraints;
  programDeload?: boolean;
}

export interface SetRecord {
  prescriptionId: string;
  setNumber: number;
  actualReps: number | null;
  actualDurationSeconds: number | null;
  loadKg: number | null;
  rir?: number | null;
  notes?: string | null;
}

export interface WorkoutRecord {
  id: string;
  sourcePlanId: string;
  sessionDate: string;
  status: 'in_progress' | 'completed';
  completedAt: string | null;
  revision: number;
  planSnapshot: PlanSnapshot;
  sets: SetRecord[];
}

export interface BodyWeightRecord {
  date: string;
  weightKg: number;
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export interface Estimates {
  bmi: number;
  dailyCalories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  ruleVersion: string;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  'lose-fat': -300,
  'build-muscle': 250,
  'maintain-weight': 0,
  'general-fitness': 100,
};

export const GOAL_LABELS: Record<Goal, string> = {
  'lose-fat': 'Lose fat',
  'build-muscle': 'Build muscle',
  'maintain-weight': 'Maintain weight',
  'general-fitness': 'General fitness',
};

export const AREA_LABELS: Record<Area, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  'full-body': 'Full body',
};

export const FOCUS_LABELS: Record<WorkoutFocus, string> = {
  ...AREA_LABELS,
  push: 'Push',
  pull: 'Pull',
  'upper-body': 'Upper body',
  'lower-body': 'Lower body',
  aerobic: 'Cardio (aerobic)',
};

export function targetAreaForFocus(focus: WorkoutFocus): Area {
  switch (focus) {
    case 'push': return 'chest';
    case 'pull': return 'back';
    case 'upper-body': return 'chest';
    case 'lower-body': return 'legs';
    case 'aerobic': return 'legs';
    default: return focus;
  }
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Mostly sitting',
  light: 'Lightly active',
  moderate: 'Moderately active',
  high: 'Very active',
  athlete: 'Athlete / highly active',
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateIsValid(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function weekdayFor(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 ? 7 : weekday;
}

export function occursOn(plan: WorkoutPlan, date: string, programs: readonly WorkoutProgram[] = []): boolean {
  if (!dateIsValid(date)) return false;
  const rollingProgram = rollingProgramForPlan(plan.id, programs);
  if (rollingProgram) return rollingProgramPlanOn(rollingProgram, date) === plan.id;
  if (plan.schedule.kind === 'date') return plan.schedule.date === date;
  return date >= plan.schedule.startsOn && weekdayFor(date) === plan.schedule.weekday;
}

export function occurrenceBefore(plan: WorkoutPlan, date: string, programs: readonly WorkoutProgram[] = []): string | null {
  if (!dateIsValid(date)) return null;
  if (plan.schedule.kind === 'date' && !rollingProgramForPlan(plan.id, programs)) return dateIsValid(plan.schedule.date) && plan.schedule.date < date ? plan.schedule.date : null;
  for (let offset = 1; offset <= 366; offset += 1) {
    const candidate = shiftLocalDate(date, -offset);
    if (occursOn(plan, candidate, programs)) return candidate;
  }
  return null;
}

export function occurrenceAfter(plan: WorkoutPlan, date: string, programs: readonly WorkoutProgram[] = []): string | null {
  if (!dateIsValid(date)) return null;
  if (plan.schedule.kind === 'date' && !rollingProgramForPlan(plan.id, programs)) return dateIsValid(plan.schedule.date) && plan.schedule.date > date ? plan.schedule.date : null;
  for (let offset = 1; offset <= 366; offset += 1) {
    const candidate = shiftLocalDate(date, offset);
    if (occursOn(plan, candidate, programs)) return candidate;
  }
  return null;
}

export function rollingProgramPlanOn(program: WorkoutProgram, date: string): string | null {
  const schedule = program.schedule;
  const rescheduled = program.rescheduledOccurrences?.find((item) => item.toDate === date);
  if (rescheduled && program.planIds.includes(rescheduled.planId)) return rescheduled.planId;
  if (program.skippedDates?.includes(date) || program.rescheduledOccurrences?.some((item) => item.fromDate === date)) return null;
  if (!schedule || !program.planIds.length || !dateIsValid(date) || !dateIsValid(schedule.startsOn) || !Number.isInteger(schedule.intervalDays) || schedule.intervalDays < 1) return null;
  const anchorDate = schedule.anchorDate ?? schedule.startsOn;
  const anchorPlanIndex = schedule.anchorPlanIndex ?? 0;
  if (!dateIsValid(anchorDate) || !dateIsValid(date) || date < anchorDate || !Number.isInteger(anchorPlanIndex)) return null;
  const elapsedDays = calendarDaysBetween(anchorDate, date);
  if (elapsedDays % schedule.intervalDays !== 0) return null;
  return program.planIds[(anchorPlanIndex + elapsedDays / schedule.intervalDays) % program.planIds.length] ?? null;
}

export function isProgramDeloadDate(program: WorkoutProgram, date: string): boolean {
  const schedule = program.schedule;
  const every = schedule?.deloadEveryRotations;
  if (!schedule || !every || every < 2 || !Number.isInteger(every) || !program.planIds.length || !dateIsValid(date) || date < schedule.startsOn) return false;
  const elapsedDays = calendarDaysBetween(schedule.startsOn, date);
  if (elapsedDays < 0 || elapsedDays % schedule.intervalDays !== 0) return false;
  const sessionNumber = elapsedDays / schedule.intervalDays;
  const rotationNumber = Math.floor(sessionNumber / program.planIds.length) + 1;
  return rotationNumber % every === 0 && rollingProgramPlanOn(program, date) !== null;
}

export function advanceProgramAfterCompletion(program: WorkoutProgram, planId: string, sessionDate: string): WorkoutProgram {
  const schedule = program.schedule;
  const planIndex = program.planIds.indexOf(planId);
  if (!schedule?.advanceOnCompletion || planIndex < 0 || !dateIsValid(sessionDate)) return program;
  return { ...program, schedule: { ...schedule, anchorDate: sessionDate, anchorPlanIndex: planIndex } };
}

export interface ProgramProgress {
  completedSessions: number;
  currentRotationCompleted: number;
  rotationSize: number;
  percentage: number;
  lastCompletedDate: string | null;
}

export function getProgramProgress(program: WorkoutProgram, records: readonly WorkoutRecord[]): ProgramProgress {
  const rotationSize = program.planIds.length;
  const completed = records
    .filter((record) => record.status === 'completed' && program.planIds.includes(record.sourcePlanId))
    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate) || a.id.localeCompare(b.id))
    .filter((record, index, all) => index === all.findIndex((item) => item.sourcePlanId === record.sourcePlanId && item.sessionDate === record.sessionDate));
  if (!rotationSize || !completed.length) return { completedSessions: completed.length, currentRotationCompleted: 0, rotationSize, percentage: 0, lastCompletedDate: completed.at(-1)?.sessionDate ?? null };

  let expectedIndex = program.planIds.indexOf(completed.at(-1)?.sourcePlanId ?? '');
  let currentRotationCompleted = 0;
  for (let index = completed.length - 1; index >= 0 && expectedIndex >= 0; index -= 1) {
    if (completed[index].sourcePlanId !== program.planIds[expectedIndex]) break;
    currentRotationCompleted += 1;
    expectedIndex = (expectedIndex - 1 + rotationSize) % rotationSize;
  }
  const progressUnits = currentRotationCompleted % rotationSize || rotationSize;
  return {
    completedSessions: completed.length,
    currentRotationCompleted,
    rotationSize,
    percentage: Math.round((progressUnits / rotationSize) * 100),
    lastCompletedDate: completed.at(-1)?.sessionDate ?? null,
  };
}

export function applyDeload(prescription: Prescription): Prescription {
  const doseStep = prescription.dose.kind === 'duration' ? 5 : 1;
  const dose = Math.max(doseStep, Math.round((prescription.dose.value * 0.8) / doseStep) * doseStep);
  const note = prescription.notes.startsWith('Deload:') ? prescription.notes : `Deload: ${prescription.notes}`.trim();
  return { ...prescription, sets: Math.max(1, Math.ceil(prescription.sets * 0.6)), dose: { ...prescription.dose, value: dose }, restSeconds: Math.min(180, prescription.restSeconds + 30), notes: note };
}

export function isPlanRecurring(plan: WorkoutPlan, programs: readonly WorkoutProgram[] = []): boolean {
  return plan.schedule.kind === 'weekly' || Boolean(rollingProgramForPlan(plan.id, programs));
}

export function formatProgramSchedule(schedule?: ProgramSchedule): string {
  if (!schedule) return 'Each plan keeps its own schedule';
  const dayLabel = schedule.intervalDays === 1 ? 'day' : 'days';
  return `Moving rotation · every ${schedule.intervalDays} ${dayLabel} · from ${schedule.startsOn}`;
}

export function formatPlanSchedule(plan: WorkoutPlan, programs: readonly WorkoutProgram[] = []): string {
  const rollingSchedule = rollingProgramForPlan(plan.id, programs)?.schedule;
  return rollingSchedule ? formatProgramSchedule(rollingSchedule) : formatSchedule(plan.schedule);
}

function rollingProgramForPlan(planId: string, programs: readonly WorkoutProgram[]): WorkoutProgram | undefined {
  return programs.find((program) => program.schedule?.kind === 'rolling' && program.planIds.includes(planId));
}

function calendarDaysBetween(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  return Math.round((Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) / 86400000);
}

function shiftLocalDate(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  return localDate(new Date(year, month - 1, day + days));
}

export function calculateEstimates(profile: Pick<Profile, 'age' | 'sex' | 'heightCm' | 'weightKg' | 'activityLevel' | 'primaryGoal'>): Estimates {
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + (profile.sex === 'male' ? 5 : -161);
  const calories = Math.max(1200, bmr * ACTIVITY_FACTORS[profile.activityLevel] + GOAL_ADJUSTMENTS[profile.primaryGoal]);
  const protein = profile.weightKg * (profile.primaryGoal === 'build-muscle' ? 1.8 : 1.6);
  const fat = profile.weightKg * 0.8;
  const carbohydrate = Math.max(0, (calories - protein * 4 - fat * 9) / 4);

  return {
    bmi: profile.weightKg / ((profile.heightCm / 100) ** 2),
    dailyCalories: Math.round(calories / 50) * 50,
    proteinGrams: Math.round(protein),
    carbohydrateGrams: Math.round(carbohydrate),
    fatGrams: Math.round(fat),
    ruleVersion: 'MVP-2026.1',
  };
}

export function snapshotEstimate(profile: Profile): EstimateSnapshot {
  const estimate = calculateEstimates(profile);
  return { ...estimate, calculatedAt: new Date().toISOString(), profileRevision: profile.revision };
}

export function suggestArea(goal: Goal, experience: Experience): { area: Area; reason: string } {
  if (experience === 'beginner' || goal === 'lose-fat' || goal === 'general-fitness') {
    return {
      area: 'full-body',
      reason: experience === 'beginner' ? 'A full-body focus keeps your first plans simple and balanced.' : 'A full-body focus supports steady, general progress across your week.',
    };
  }
  if (goal === 'build-muscle') {
    return { area: 'legs', reason: 'Legs give a high-value base for a muscle-building plan.' };
  }
  return { area: 'core', reason: 'Core work is a practical anchor for a maintenance-focused session.' };
}

export function plannedVolume(prescriptions: Prescription[]): number {
  return prescriptions.reduce((total, prescription) => total + prescription.sets, 0);
}

export function exerciseMatchesConstraints(exercise: Exercise, constraints?: PlanConstraints): boolean {
  const available = constraints?.availableEquipment;
  return !available?.length || !exercise.equipment || available.includes(exercise.equipment);
}

export function formatSchedule(schedule: Schedule): string {
  if (schedule.kind === 'date') return `One time · ${schedule.date}`;
  const weekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][schedule.weekday - 1];
  return `Every ${weekday} · from ${schedule.startsOn}`;
}
