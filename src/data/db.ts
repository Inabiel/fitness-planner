import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import type { BodyWeightRecord, Profile, WorkoutIntensity, WorkoutPlan, WorkoutRecord } from '../domain';

class FitnessDatabase extends Dexie {
  declare profiles: Table<Profile, string>;
  declare plans: Table<WorkoutPlan, string>;
  declare records: Table<WorkoutRecord, string>;
  declare weights: Table<BodyWeightRecord, string>;

  constructor() {
    super('form-fitness-planner');
    this.version(1).stores({
      profiles: 'id',
      plans: 'id, updatedAt',
      records: 'id, [sourcePlanId+sessionDate], sessionDate',
      weights: 'date',
    });
  }
}

export const db = new FitnessDatabase();
export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();

export function saveProfile(profile: Profile) {
  return db.profiles.put(profile);
}

export function savePlan(plan: WorkoutPlan) {
  return db.plans.put(plan);
}

export function deletePlan(planId: string) {
  return db.plans.delete(planId);
}

export function updatePlanEstimate(planId: string, estimate: WorkoutPlan['estimate'], revision: number) {
  return db.plans.update(planId, { estimate, revision, updatedAt: now() });
}

export function updatePlanPrescriptions(planId: string, prescriptions: WorkoutPlan['prescriptions'], revision: number, intensity?: WorkoutIntensity) {
  return db.plans.update(planId, { prescriptions, revision, updatedAt: now(), ...(intensity ? { intensity } : {}) });
}

export function saveWorkoutRecord(record: WorkoutRecord) {
  return db.records.put(record);
}

export function deleteWorkoutRecord(recordId: string) {
  return db.records.delete(recordId);
}

export function saveBodyWeight(record: BodyWeightRecord) {
  return db.weights.put(record);
}

export function deleteBodyWeight(date: string) {
  return db.weights.delete(date);
}

export async function clearAllData() {
  await db.transaction('rw', db.profiles, db.plans, db.records, db.weights, async () => {
    await db.profiles.clear();
    await db.plans.clear();
    await db.records.clear();
    await db.weights.clear();
  });
}

export interface PlannerData {
  profile: Profile | undefined;
  plans: WorkoutPlan[];
  records: WorkoutRecord[];
  weights: BodyWeightRecord[];
}

export type AuthenticatedPlannerData = PlannerData & { profile: Profile };

export function usePlanner(): PlannerData | undefined {
  return useLiveQuery(async () => {
    const [profile, plans, records, weights] = await Promise.all([
      db.profiles.get('profile'),
      db.plans.orderBy('updatedAt').reverse().toArray(),
      db.records.orderBy('sessionDate').reverse().toArray(),
      db.weights.orderBy('date').reverse().toArray(),
    ]);
    return { profile, plans, records, weights };
  }, []);
}
