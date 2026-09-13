import { FOCUS_LABELS, formatPlanSchedule, INTENSITY_LABELS, type Exercise, type Prescription, type WorkoutPlan, type WorkoutProgram } from '../domain';

export function formatWorkoutStepText(prescription: Prescription, exercise: Exercise, stepNumber?: number): string {
  const dose = prescription.dose.kind === 'reps' ? `${prescription.dose.value} reps` : `${prescription.dose.value} sec`;
  const load = prescription.recommendedLoadKg === 0 ? 'Bodyweight' : prescription.recommendedLoadKg ? `${prescription.recommendedLoadKg} kg` : 'Choose a weight/resistance';
  const rir = prescription.dose.kind === 'reps' ? `Target: ${prescription.targetRir ?? 2} RIR (reps in reserve)` : null;

  return [
    `*${stepNumber ? `Step ${stepNumber}: ` : ''}${exercise.name}*`,
    `Plan: ${prescription.sets} × ${dose}`,
    `Weight/resistance: ${load}`,
    `Rest: ${prescription.restSeconds} sec`,
    ...(rir ? [rir] : []),
    ...(prescription.notes ? [`Note: ${prescription.notes}`] : []),
    '',
    'Instructions:',
    ...exercise.instructions.map((instruction, index) => `${index + 1}. ${instruction}`),
  ].join('\n');
}

export function formatWorkoutPlanText(plan: WorkoutPlan, exercises: Exercise[], includeSteps = false, programs: readonly WorkoutProgram[] = []): string {
  const focus = plan.focus ?? plan.primaryTargetArea;
  const intensity = plan.intensity ?? 'moderate';
  const exerciseLines = plan.prescriptions.flatMap((prescription, index) => {
    const exercise = exercises.find((item) => item.id === prescription.exerciseId);
    if (!exercise) return [];

    const dose = prescription.dose.kind === 'reps' ? `${prescription.dose.value} reps` : `${prescription.dose.value} sec`;
    const load = prescription.recommendedLoadKg === 0 ? ' · Bodyweight' : prescription.recommendedLoadKg ? ` · ${prescription.recommendedLoadKg} kg` : '';
    const rir = prescription.dose.kind === 'reps' ? ` · Target ${prescription.targetRir ?? 2} RIR (reps in reserve)` : '';
    const notes = prescription.notes ? ` · ${prescription.notes}` : '';

    return [`${index + 1}. ${exercise.name} — ${prescription.sets} × ${dose}${load}${rir}${notes}`, `   Rest ${prescription.restSeconds} sec`];
  });
  const stepLines = includeSteps ? plan.prescriptions.flatMap((prescription, index) => {
    const exercise = exercises.find((item) => item.id === prescription.exerciseId);
    return exercise ? [formatWorkoutStepText(prescription, exercise, index + 1), ''] : [];
  }) : [];

  return [
    `*${plan.name}*`,
    `Focus: ${FOCUS_LABELS[focus]}`,
    `Target intensity: ${INTENSITY_LABELS[intensity]}`,
    `Schedule: ${formatPlanSchedule(plan, programs)}`,
    '',
    '*Workout*',
    ...exerciseLines,
    ...(stepLines.length ? ['', '*Exercise steps*', ...stepLines] : []),
    '',
    'After training: log actual reps or duration, weight/resistance, and RIR (reps in reserve) in fitnessPal.',
  ].join('\n');
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall back for local or older browser contexts.
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}
