import { z } from 'zod';
import { db, now } from './db';

export const BACKUP_FORMAT = 'fitnesspal-backup';
export const BACKUP_VERSION = 1;

const area = z.enum(['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full-body']);
const focus = z.enum(['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full-body', 'push', 'pull', 'upper-body', 'lower-body', 'aerobic']);
const intensity = z.enum(['easy', 'moderate', 'hard', 'very-hard']);
const goal = z.enum(['lose-fat', 'build-muscle', 'maintain-weight', 'general-fitness']);
const schedule = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('date'), date: z.string().min(1) }),
  z.object({ kind: z.literal('weekly'), weekday: z.number().int().min(0).max(6), startsOn: z.string().min(1) }),
]);
const estimate = z.object({
  ruleVersion: z.string().min(1),
  calculatedAt: z.string().min(1),
  profileRevision: z.number().int().nonnegative(),
  bmi: z.number().nonnegative(),
  dailyCalories: z.number().nonnegative(),
  proteinGrams: z.number().nonnegative(),
  carbohydrateGrams: z.number().nonnegative(),
  fatGrams: z.number().nonnegative(),
});
const exercise = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  instructions: z.array(z.string()),
  primaryAreas: z.array(area),
  secondaryAreas: z.array(area),
  doseKind: z.enum(['reps', 'duration']),
  popularityRank: z.number().nonnegative(),
  equipment: z.string().optional(),
  exerciseType: z.literal('aerobic').optional(),
  mediaLabel: z.string(),
});
const prescription = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  sets: z.number().int().positive(),
  dose: z.object({ kind: z.enum(['reps', 'duration']), value: z.number().positive() }),
  restSeconds: z.number().int().nonnegative(),
  notes: z.string(),
  recommendedLoadKg: z.number().nonnegative().nullable().optional(),
  targetRir: z.number().int().nonnegative().optional(),
});
const profile = z.object({
  id: z.literal('profile'),
  name: z.string(),
  age: z.number().int().min(13).max(100),
  sex: z.enum(['female', 'male']),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'high', 'athlete']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  primaryGoal: goal,
  secondaryGoals: z.array(goal),
  exerciseOrder: z.array(z.string().min(1)).optional(),
  updatedAt: z.string().min(1),
  revision: z.number().int().nonnegative(),
});
const plan = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  revision: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  primaryTargetArea: area,
  focus: focus.optional(),
  intensity: intensity.optional(),
  focusConfirmed: z.boolean(),
  schedule,
  prescriptions: z.array(prescription),
  estimate: estimate.optional(),
});
const program = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  planIds: z.array(z.string().min(1)),
  schedule: z.object({ kind: z.literal('rolling'), startsOn: z.string().min(1), intervalDays: z.number().int().positive() }).optional(),
  revision: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
const snapshot = z.object({
  name: z.string().min(1),
  primaryTargetArea: area,
  focus: focus.optional(),
  intensity: intensity.optional(),
  schedule,
  prescriptions: z.array(prescription),
  exercises: z.array(exercise),
  estimate: estimate.optional(),
});
const record = z.object({
  id: z.string().min(1),
  sourcePlanId: z.string().min(1),
  sessionDate: z.string().min(1),
  status: z.enum(['in_progress', 'completed']),
  completedAt: z.string().nullable(),
  revision: z.number().int().nonnegative(),
  planSnapshot: snapshot,
  sets: z.array(z.object({
    prescriptionId: z.string().min(1),
    setNumber: z.number().int().positive(),
    actualReps: z.number().nonnegative().nullable(),
    actualDurationSeconds: z.number().nonnegative().nullable(),
    loadKg: z.number().nonnegative().nullable(),
    rir: z.number().int().nonnegative().nullable().optional(),
  })),
});
const weight = z.object({
  date: z.string().min(1),
  weightKg: z.number().positive(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  revision: z.number().int().nonnegative(),
});

const backup = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string().min(1),
  data: z.object({
    profile: profile.nullable(),
    plans: z.array(plan),
    programs: z.array(program),
    records: z.array(record),
    weights: z.array(weight),
  }),
});

export type BackupDocument = z.infer<typeof backup>;

export async function exportCurrentData(): Promise<BackupDocument> {
  const [profileData, plans, programs, records, weights] = await Promise.all([
    db.profiles.get('profile'),
    db.plans.toArray(),
    db.programs.toArray(),
    db.records.toArray(),
    db.weights.toArray(),
  ]);

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now(),
    data: { profile: profileData ?? null, plans, programs, records, weights },
  };
}

export function serializeBackup(document: BackupDocument): string {
  return JSON.stringify(document, null, 2);
}

export function parseBackup(text: string): BackupDocument {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }

  const result = backup.safeParse(value);
  if (!result.success) throw new Error('This is not a valid fitnessPal backup file.');
  assertRelationships(result.data);
  return result.data;
}

export async function replaceCurrentData(document: BackupDocument): Promise<void> {
  await db.transaction('rw', db.profiles, db.plans, db.programs, db.records, db.weights, async () => {
    await db.profiles.clear();
    await db.plans.clear();
    await db.programs.clear();
    await db.records.clear();
    await db.weights.clear();
    if (document.data.profile) await db.profiles.put(document.data.profile);
    await db.plans.bulkPut(document.data.plans);
    await db.programs.bulkPut(document.data.programs);
    await db.records.bulkPut(document.data.records);
    await db.weights.bulkPut(document.data.weights);
  });
}

function assertRelationships(document: BackupDocument) {
  assertUnique(document.data.plans.map((item) => item.id), 'plans');
  assertUnique(document.data.programs.map((item) => item.id), 'programs');
  assertUnique(document.data.records.map((item) => item.id), 'records');
  assertUnique(document.data.records.map((item) => `${item.sourcePlanId}:${item.sessionDate}`), 'session records');
  assertUnique(document.data.weights.map((item) => item.date), 'body-weight records');

  const planIds = new Set(document.data.plans.map((item) => item.id));
  const assignedPlanIds = new Set<string>();
  for (const item of document.data.programs) {
    for (const planId of item.planIds) {
      if (!planIds.has(planId) || assignedPlanIds.has(planId)) throw new Error('This backup contains invalid program references.');
      assignedPlanIds.add(planId);
    }
  }
}

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`This backup contains duplicate ${label}.`);
}
