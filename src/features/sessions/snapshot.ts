import type { Exercise, PlanSnapshot, WorkoutPlan } from '../../domain';
import { EXERCISES } from '../../data/exercises';

export function makePlanSnapshot(plan: WorkoutPlan): PlanSnapshot {
  const prescriptions = plan.prescriptions.map((prescription) => ({
    ...prescription,
    dose: { ...prescription.dose },
  }));
  const exercises = plan.prescriptions
    .map((prescription) => EXERCISES.find((exercise) => exercise.id === prescription.exerciseId))
    .filter((exercise): exercise is Exercise => Boolean(exercise));

  return {
    name: plan.name,
    primaryTargetArea: plan.primaryTargetArea,
    focus: plan.focus,
    schedule: plan.schedule,
    prescriptions,
    exercises,
    estimate: plan.estimate,
  };
}
