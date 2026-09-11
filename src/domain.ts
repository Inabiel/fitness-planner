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

export type Schedule =
  | { kind: 'date'; date: string }
  | { kind: 'weekly'; weekday: number; startsOn: string };

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
}

export interface SetRecord {
  prescriptionId: string;
  setNumber: number;
  actualReps: number | null;
  actualDurationSeconds: number | null;
  loadKg: number | null;
  rir?: number | null;
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

export function occursOn(plan: WorkoutPlan, date: string): boolean {
  if (!dateIsValid(date)) return false;
  if (plan.schedule.kind === 'date') return plan.schedule.date === date;
  return date >= plan.schedule.startsOn && weekdayFor(date) === plan.schedule.weekday;
}

export function occurrenceBefore(plan: WorkoutPlan, date: string): string | null {
  if (!dateIsValid(date)) return null;
  if (plan.schedule.kind === 'date') return dateIsValid(plan.schedule.date) && plan.schedule.date < date ? plan.schedule.date : null;
  for (let offset = 1; offset <= 366; offset += 1) {
    const candidate = shiftLocalDate(date, -offset);
    if (occursOn(plan, candidate)) return candidate;
  }
  return null;
}

export function occurrenceAfter(plan: WorkoutPlan, date: string): string | null {
  if (!dateIsValid(date)) return null;
  if (plan.schedule.kind === 'date') return dateIsValid(plan.schedule.date) && plan.schedule.date > date ? plan.schedule.date : null;
  for (let offset = 1; offset <= 366; offset += 1) {
    const candidate = shiftLocalDate(date, offset);
    if (occursOn(plan, candidate)) return candidate;
  }
  return null;
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

export function formatSchedule(schedule: Schedule): string {
  if (schedule.kind === 'date') return `One time · ${schedule.date}`;
  const weekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][schedule.weekday - 1];
  return `Every ${weekday} · from ${schedule.startsOn}`;
}
