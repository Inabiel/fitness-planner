import { useEffect, useState } from 'react';
import { ArrowRight, CircleCheck, Clock3, Dumbbell, Flame, Info, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { AREA_LABELS, FOCUS_LABELS, INTENSITY_LABELS, calculateEstimates, formatSchedule, localDate, occursOn, plannedVolume, snapshotEstimate, type EstimateSnapshot, type Exercise, type Prescription, type WorkoutIntensity } from '../../domain';
import { deletePlan as removePlan, now, updatePlanEstimate, type AuthenticatedPlannerData } from '../../data/db';
import { EXERCISES } from '../../data/exercises';
import { formatDateTime } from '../../shared/formatters';
import { EmptyState, Page } from '../../shared/ui';
import { FocusIllustration } from './FocusIllustration';
import { assessPlanIntensity, assessPrescriptionEffort, type EffortAssessment, type IntensityAssessment } from './recommendations';

export function PlanDetail({ data }: { data: AuthenticatedPlannerData }) {
  const { planId } = useParams();
  const navigate = useNavigate();
  const selectedPlan = data.plans.find((item) => item.id === planId);
  const [showRecalc, setShowRecalc] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!deleteOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) setDeleteOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteOpen, saving]);

  if (!selectedPlan) {
    return <Page title="Plan not found" subtitle="This plan may have been deleted."><EmptyState icon={<Info size={22} />} title="No plan here" body="Historical workout records are kept separately from plans." action={<Link to="/plans" className="button secondary">Back to plans</Link>} /></Page>;
  }

  const plan = selectedPlan;
  const focus = plan.focus ?? plan.primaryTargetArea;
  const intensity = plan.intensity ?? 'moderate';
  const today = localDate();
  const canStartToday = occursOn(plan, today);
  const previewEstimate = calculateEstimates(data.profile);

  async function deletePlan() {
    setSaving(true);
    setError('');
    try {
      await removePlan(plan.id);
      navigate('/plans');
    } catch {
      setError('The plan could not be deleted. Try again.');
      setSaving(false);
    }
  }

  async function saveRecalculation() {
    setSaving(true);
    setError('');
    try {
      await updatePlanEstimate(plan.id, snapshotEstimate(data.profile), plan.revision + 1);
      setShowRecalc(false);
    } catch {
      setError('The estimate could not be updated. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page
      title={plan.name}
      subtitle={`${FOCUS_LABELS[focus]} focus · ${INTENSITY_LABELS[intensity]} intensity · ${formatSchedule(plan.schedule)}`}
      backTo="/plans"
      action={<div className="page-actions"><Link className="button secondary" to={`/plans/${plan.id}/edit`}><Pencil size={16} /> Edit</Link>{canStartToday && <Link className="button primary" to={`/sessions/${plan.id}/${today}`}><Dumbbell size={16} /> Start today</Link>}</div>}
    >
      <div className="detail-layout">
        <div className="detail-main">
          <section className="focus-hero"><div className="focus-copy"><p className="eyebrow on-dark">Workout focus</p><h2>{FOCUS_LABELS[focus]}</h2><p>This is the intention you confirmed for the plan. Your exercises can work other areas too.</p></div><FocusIllustration focus={focus} /></section>
          <section className="detail-section">
            <div className="section-heading"><div><p className="eyebrow">The sequence</p><h2>{plan.prescriptions.length} exercises</h2></div><span className="volume-badge"><Flame size={15} /> {plannedVolume(plan.prescriptions)} planned work sets</span></div>
            <p className="section-explainer">Planned volume is a simple count of work sets for this session. It is guidance, not your actual workload.</p>
            <div className="detail-exercise-list">{plan.prescriptions.map((prescription, index) => {
              const exercise = EXERCISES.find((item) => item.id === prescription.exerciseId);
              return exercise ? <ExerciseDetail key={prescription.id} prescription={prescription} exercise={exercise} index={index} effort={assessPrescriptionEffort(prescription, plan.id, data.records)} /> : null;
            })}</div>
          </section>
        </div>
        <aside className="detail-side">
          <EstimateSnapshotCard estimate={plan.estimate} onRecalculate={() => setShowRecalc(true)} />
          <IntensityCard target={intensity} assessment={assessPlanIntensity(plan, data.records)} />
          <EffortSummary assessments={plan.prescriptions.map((prescription) => assessPrescriptionEffort(prescription, plan.id, data.records))} />
          <div className="side-card">
            <p className="eyebrow">Plan actions</p>
            <Link className="side-action" to={`/sessions/${plan.id}/${canStartToday ? today : (plan.schedule.kind === 'date' ? plan.schedule.date : plan.schedule.startsOn)}`}><CircleCheck size={17} /><span><strong>Log workout result</strong><small>Record reps, duration, load, and RIR for effort guidance.</small></span><ArrowRight size={16} /></Link>
            <button className="side-action" onClick={() => setDeleteOpen(true)}><Trash2 size={17} /><span><strong>Delete this plan</strong><small>Recorded history will stay safe.</small></span><ArrowRight size={16} /></button>
          </div>
        </aside>
      </div>
      {error && <p className="form-error global-error" role="alert">{error}</p>}
      {showRecalc && <RecalculationModal estimate={plan.estimate} previewEstimate={previewEstimate} profileRevision={data.profile.revision} saving={saving} onCancel={() => setShowRecalc(false)} onSave={saveRecalculation} />}
      {deleteOpen && <DeleteModal planName={plan.name} saving={saving} onCancel={() => setDeleteOpen(false)} onDelete={deletePlan} />}
    </Page>
  );
}

function EstimateSnapshotCard({ estimate, onRecalculate }: { estimate?: EstimateSnapshot; onRecalculate: () => void }) {
  return <div className="side-card saved-estimate"><div className="section-heading"><div><p className="eyebrow">Saved estimates</p><h3>{estimate ? `${estimate.dailyCalories.toLocaleString()} kcal` : 'Not available'}</h3></div><span className="target-icon"><Flame size={17} /></span></div>{estimate ? <><div className="saved-macros"><span>{estimate.proteinGrams}g protein</span><span>{estimate.carbohydrateGrams}g carbs</span><span>{estimate.fatGrams}g fat</span></div><p className="fine-print">Captured from profile revision {estimate.profileRevision} · {formatDateTime(estimate.calculatedAt)}</p></> : <p className="fine-print">This plan has no saved estimate yet.</p>}<button className="button small secondary full-width" onClick={onRecalculate}><RotateIcon /> Recalculate explicitly</button></div>;
}

function RecalculationModal({ estimate, previewEstimate, profileRevision, saving, onCancel, onSave }: { estimate?: EstimateSnapshot; previewEstimate: ReturnType<typeof calculateEstimates>; profileRevision: number; saving: boolean; onCancel: () => void; onSave: () => void }) {
  const newEstimate = { ...previewEstimate, calculatedAt: now(), profileRevision };
  return <div className="inline-modal"><div><p className="eyebrow">Explicit recalculation</p><h2>Preview replacement estimates</h2><p className="muted">Your profile may have changed. This only updates the saved estimate on this plan; history stays unchanged.</p></div><div className="compare-grid"><EstimateCompare label="Saved" estimate={estimate} /><EstimateCompare label="New preview" estimate={newEstimate} /></div><div className="modal-actions"><button className="button ghost" onClick={onCancel}>Keep current</button><button className="button primary" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save replacement'}</button></div></div>;
}

function DeleteModal({ planName, saving, onCancel, onDelete }: { planName: string; saving: boolean; onCancel: () => void; onDelete: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}><div className="delete-data-modal" role="dialog" aria-modal="true" aria-labelledby="delete-plan-title"><div className="warning-icon"><Trash2 size={20} /></div><p className="eyebrow">Delete workout plan</p><h2 id="delete-plan-title">Delete {planName}?</h2><p>Future sessions will disappear, but recorded history will be retained.</p><div className="modal-actions"><button type="button" className="button ghost" onClick={onCancel} disabled={saving}>Cancel</button><button type="button" className="button danger-button" onClick={onDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete plan'}</button></div></div></div>;
}

function EstimateCompare({ label, estimate }: { label: string; estimate?: EstimateSnapshot | (ReturnType<typeof calculateEstimates> & { calculatedAt: string; profileRevision: number }) }) {
  return <div className="compare-card"><span className="eyebrow">{label}</span>{estimate ? <><strong>{estimate.dailyCalories.toLocaleString()} <small>kcal</small></strong><span>{estimate.proteinGrams}g protein · {estimate.carbohydrateGrams}g carbs · {estimate.fatGrams}g fat</span><span>BMI {estimate.bmi.toFixed(1)}</span></> : <span className="muted">No saved estimate</span>}</div>;
}

function EffortSummary({ assessments }: { assessments: EffortAssessment[] }) {
  const increases = assessments.filter((assessment) => assessment.direction === 'increase').length;
  const decreases = assessments.filter((assessment) => assessment.direction === 'decrease').length;
  const trends = assessments.filter((assessment) => assessment.direction === 'insufficient-data').length;
  const summary = decreases ? 'Some exercises need less effort.' : increases ? 'Some exercises are ready for more effort.' : trends === assessments.length ? 'Log two completed sessions to calculate changes.' : 'Your current effort is repeatable.';
  return <div className="side-card effort-summary"><p className="eyebrow">Effort guidance</p><h3>{summary}</h3><div className="effort-summary-stats"><span><strong>{increases}</strong> increase</span><span><strong>{decreases}</strong> decrease</span><span><strong>{trends}</strong> building</span></div></div>;
}

function IntensityCard({ target, assessment }: { target: WorkoutIntensity; assessment: IntensityAssessment }) {
  const pillClass = assessment.result === 'above' ? 'increase' : assessment.result === 'below' ? 'decrease' : assessment.result === 'on-target' ? 'hold' : 'insufficient-data';
  return <div className="side-card intensity-card"><div className="section-heading"><div><p className="eyebrow">Target intensity</p><h3>{INTENSITY_LABELS[target]}</h3></div><span className={`effort-pill ${pillClass}`}>{assessment.label}</span></div><p className="effort-detail">{assessment.detail}</p></div>;
}

function ExerciseDetail({ prescription, exercise, index, effort }: { prescription: Prescription; exercise: Exercise; index: number; effort: EffortAssessment }) {
  const primaryAreas = exercise.primaryAreas.map((area) => AREA_LABELS[area]).join(', ');
  const secondaryAreas = exercise.secondaryAreas.length ? ` · Secondary: ${exercise.secondaryAreas.map((area) => AREA_LABELS[area]).join(', ')}` : '';
  const rirLabel = prescription.dose.kind === 'reps' ? ` · Target ${prescription.targetRir ?? 2} RIR` : '';
  return <article className="exercise-detail"><div className="exercise-detail-number">{String(index + 1).padStart(2, '0')}</div><div className="exercise-detail-content"><div className="exercise-detail-heading"><div><h3>{exercise.name}</h3><span className="worked-label">Primary: {primaryAreas}{secondaryAreas}</span></div><div className="exercise-detail-badges"><span className="dose-pill">{prescription.sets} × {prescription.dose.value}{prescription.dose.kind === 'reps' ? ' reps' : ' sec'}</span><span className={`effort-pill ${effort.direction}`}>{effort.label}</span></div></div><div className="exercise-detail-grid"><div className="exercise-media unavailable"><Dumbbell size={20} /><span>{exercise.mediaLabel}</span><small>Written instructions remain available.</small></div><div><p className="eyebrow">How to move</p><ol className="instruction-list">{exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol><p className="rest-note"><Clock3 size={14} /> Start {formatLoad(prescription.recommendedLoadKg)} · Rest {prescription.restSeconds} sec{rirLabel}{prescription.notes ? ` · ${prescription.notes}` : ''}</p><p className="effort-detail">{effort.detail}</p></div></div></div></article>;
}

function formatLoad(load: number | null | undefined): string {
  if (load === 0) return 'Bodyweight';
  if (load === null || load === undefined) return 'Choose a suitable load';
  return `${load} kg`;
}

function RotateIcon() { return <span className="rotate-icon">↻</span>; }
