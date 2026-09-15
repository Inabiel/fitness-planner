import { applyDeload, isProgramDeloadDate, type Exercise, type PlanSnapshot, type WorkoutPlan, type WorkoutProgram } from '../../domain';
import { EXERCISES } from '../../data/exercises';

export function makePlanSnapshot(plan: WorkoutPlan, programs: readonly WorkoutProgram[] = [], sessionDate?: string): PlanSnapshot {
  const programDeload = Boolean(sessionDate && programs.some((program) => program.planIds.includes(plan.id) && isProgramDeloadDate(program, sessionDate)));
  const prescriptions = plan.prescriptions.map((prescription) => ({
    ...prescription,
    dose: { ...prescription.dose },
  })).map((prescription) => programDeload ? applyDeload(prescription) : prescription);
  const exercises = plan.prescriptions
    .map((prescription) => EXERCISES.find((exercise) => exercise.id === prescription.exerciseId))
    .filter((exercise): exercise is Exercise => Boolean(exercise));

  return {
    name: plan.name,
    primaryTargetArea: plan.primaryTargetArea,
    focus: plan.focus,
    intensity: plan.intensity,
    schedule: plan.schedule,
    prescriptions,
    exercises,
    estimate: plan.estimate,
    constraints: plan.constraints,
    ...(programDeload ? { programDeload: true } : {}),
  };
}
