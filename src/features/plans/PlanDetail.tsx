import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, CircleCheck, Clipboard, Clock3, Dumbbell, Flame, Info, Pencil, Timer, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { AREA_LABELS, FOCUS_LABELS, INTENSITY_LABELS, calculateEstimates, formatPlanSchedule, isPlanRecurring, localDate, occurrenceAfter, occursOn, plannedVolume, snapshotEstimate, type EstimateSnapshot, type Exercise, type Prescription, type WorkoutIntensity } from '../../domain';
import { deletePlan as removePlan, now, updatePlanEstimate, type AuthenticatedPlannerData } from '../../data/db';
import { EXERCISES } from '../../data/exercises';
import { formatDateTime } from '../../shared/formatters';
import { getProgressPoints } from '../../shared/progress';
import { estimatePlanCalories } from '../../shared/calorieBurn';
import { ProgressLineChart } from '../../shared/progressChart';
import { EmptyState, Page, Snackbar } from '../../shared/ui';
import type { GamificationCelebration } from '../../shared/gamification';
import { GamificationCelebrationModal } from '../gamification';
import { FocusIllustration } from './FocusIllustration';
import { LiveTrackingModal } from './LiveTrackingModal';
import { copyToClipboard, formatWorkoutPlanText } from '../../shared/workoutExport';
import { assessPlanIntensity, assessPrescriptionEffort, type EffortAssessment, type IntensityAssessment } from './recommendations';

export function PlanDetail({ data }: { data: AuthenticatedPlannerData }) {
  const { planId } = useParams();
  const navigate = useNavigate();
  const selectedPlan = data.plans.find((item) => item.id === planId);
  const [showRecalc, setShowRecalc] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [liveTrackingOpen, setLiveTrackingOpen] = useState(false);
  const [includeSteps, setIncludeSteps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [celebration, setCelebration] = useState<GamificationCelebration | null>(null);
  const [celebrationDetail, setCelebrationDetail] = useState('');
  const [error, setError] = useState('');
  const dismissSnackbar = useCallback(() => setSnackbar(null), []);

  useEffect(() => {
    if (!deleteOpen && !copyOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        setDeleteOpen(false);
        setCopyOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyOpen, deleteOpen, saving]);

  if (!selectedPlan) {
    return <Page title="Plan not found" subtitle="This plan may have been deleted."><EmptyState icon={<Info size={22} />} title="No plan here" body="Historical workout records are kept separately from plans." action={<Link to="/plans" className="button secondary">Back to plans</Link>} /></Page>;
  }

  const plan = selectedPlan;
  const focus = plan.focus ?? plan.primaryTargetArea;
  const intensity = plan.intensity ?? 'moderate';
  const estimatedCalories = estimatePlanCalories(plan, data.profile.weightKg);
  const today = localDate();
  const rollingProgram = data.programs.find((program) => program.schedule?.kind === 'rolling' && program.planIds.includes(plan.id));
  const canStartToday = occursOn(plan, today, data.programs);
  const fallbackSessionDate = rollingProgram?.schedule?.startsOn ?? (plan.schedule.kind === 'date' ? plan.schedule.date : plan.schedule.startsOn);
  const logSessionDate = canStartToday ? today : rollingProgram ? (occurrenceAfter(plan, today, data.programs) ?? fallbackSessionDate) : fallbackSessionDate;
  const previewEstimate = calculateEstimates(data.profile);
  const progressPoints = isPlanRecurring(plan, data.programs) ? getProgressPoints(data.records, plan.id) : [];

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

  function openCopyModal() {
    setCopied(false);
    setIncludeSteps(false);
    setCopyOpen(true);
  }

  async function copyPlan() {
    setSaving(true);
    try {
      await copyToClipboard(formatWorkoutPlanText(plan, EXERCISES, includeSteps, data.programs));
      setCopyOpen(false);
      setCopied(true);
      setSnackbar({ message: 'Workout plan copied to clipboard.', tone: 'success' });
    } catch {
      setSnackbar({ message: 'The plan could not be copied. Try selecting the plan text manually.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page
      title={plan.name}
      subtitle={`${FOCUS_LABELS[focus]} focus · ${INTENSITY_LABELS[intensity]} intensity · ${formatPlanSchedule(plan, data.programs)}`}
      backTo="/plans"
      action={<div className="page-actions"><Link className="button secondary" to={`/plans/${plan.id}/edit`}><Pencil size={16} /> Edit</Link><button className="button secondary" type="button" onClick={openCopyModal}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? 'Copied' : 'Copy plan text'}</button>{canStartToday && <Link className="button primary" to={`/sessions/${plan.id}/${today}`}><Dumbbell size={16} /> Start today</Link>}</div>}
    >
      <div className="detail-layout">
        <div className="detail-main">
          <section className="focus-hero"><div className="focus-copy"><p className="eyebrow on-dark">Workout focus</p><h2>{FOCUS_LABELS[focus]}</h2><p>This is the intention you confirmed for the plan. Your exercises can work other areas too.</p></div><FocusIllustration focus={focus} /></section>
          {isPlanRecurring(plan, data.programs) && <section className="detail-section progress-card"><div className="section-heading"><div><p className="eyebrow">Recurring progress</p><h2>Performance trend</h2></div><span className="unit-label">% of target</span></div>{progressPoints.length ? <ProgressLineChart points={progressPoints} ariaLabel={`${plan.name} performance trend`} /> : <EmptyState compact icon={<Flame size={21} />} title="Your trend starts after one completed session" body="Log actual reps or duration in a recurring session to see progress here." />}</section>}
          <section className="detail-section">
            <div className="section-heading"><div><p className="eyebrow">The sequence</p><h2>{plan.prescriptions.length} exercises</h2></div><span className="volume-badge"><Flame size={15} /> {plannedVolume(plan.prescriptions)} planned work sets · {estimatedCalories.toLocaleString()} estimated kcal</span></div>
            <p className="section-explainer">Planned volume means the total number of work sets in this session. It is guidance, not your actual workload.</p>
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
            <button className="side-action" type="button" onClick={() => setLiveTrackingOpen(true)}><Timer size={17} /><span><strong>Live tracking</strong><small>Track each exercise in a focused modal with rest countdowns between movements.</small></span><ArrowRight size={16} /></button>
            <Link className="side-action" to={`/sessions/${plan.id}/${logSessionDate}`}><CircleCheck size={17} /><span><strong>Log workout result</strong><small>Record reps, duration, weight/resistance, and RIR (reps in reserve) for effort guidance.</small></span><ArrowRight size={16} /></Link>
            <button className="side-action" onClick={() => setDeleteOpen(true)}><Trash2 size={17} /><span><strong>Delete this plan</strong><small>Recorded history will stay safe.</small></span><ArrowRight size={16} /></button>
          </div>
        </aside>
      </div>
      {error && <p className="form-error global-error" role="alert">{error}</p>}
      {snackbar && <Snackbar message={snackbar.message} tone={snackbar.tone} onDismiss={dismissSnackbar} />}
      {copyOpen && <CopyPlanModal includeSteps={includeSteps} saving={saving} onIncludeStepsChange={setIncludeSteps} onCancel={() => setCopyOpen(false)} onCopy={copyPlan} />}
      {liveTrackingOpen && <LiveTrackingModal plan={plan} records={data.records} onClose={() => setLiveTrackingOpen(false)} onSaved={(message, nextCelebration) => { if (nextCelebration) { setCelebration(nextCelebration); setCelebrationDetail(message); } else { setSnackbar({ message, tone: 'success' }); } }} />}
      {celebration && <GamificationCelebrationModal celebration={celebration} detail={celebrationDetail} onClose={() => { setCelebration(null); setCelebrationDetail(''); }} />}
      {showRecalc && <RecalculationModal estimate={plan.estimate} previewEstimate={previewEstimate} profileRevision={data.profile.revision} saving={saving} onCancel={() => setShowRecalc(false)} onSave={saveRecalculation} />}
      {deleteOpen && <DeleteModal planName={plan.name} error={error} saving={saving} onCancel={() => setDeleteOpen(false)} onDelete={deletePlan} />}
    </Page>
  );
}

function CopyPlanModal({ includeSteps, saving, onIncludeStepsChange, onCancel, onCopy }: { includeSteps: boolean; saving: boolean; onIncludeStepsChange: (value: boolean) => void; onCancel: () => void; onCopy: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}>
      <div className="review-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="copy-plan-title">
        <div className="confirmation-icon"><Clipboard size={20} /></div>
        <p className="eyebrow">Copy workout plan</p>
        <h2 id="copy-plan-title">Choose what to copy</h2>
        <p className="muted">The plan summary is always included. Add exercise steps when you want the movement instructions in your message too.</p>
        <label className="confirm-row">
          <input type="checkbox" checked={includeSteps} onChange={(event) => onIncludeStepsChange(event.target.checked)} />
          <span><strong>Include exercise steps</strong><small>Copies each exercise’s plan, rest, notes, and written instructions.</small></span>
        </label>
        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={onCancel} disabled={saving} autoFocus>Cancel</button>
          <button type="button" className="button primary" onClick={onCopy} disabled={saving}>{saving ? 'Copying…' : 'Copy plan text'} <Clipboard size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function EstimateSnapshotCard({ estimate, onRecalculate }: { estimate?: EstimateSnapshot; onRecalculate: () => void }) {
  return <div className="side-card saved-estimate"><div className="section-heading"><div><p className="eyebrow">Saved estimates</p><h3>{estimate ? `${estimate.dailyCalories.toLocaleString()} calories` : 'Not available'}</h3></div><span className="target-icon"><Flame size={17} /></span></div>{estimate ? <><div className="saved-macros"><span>{estimate.proteinGrams}g protein</span><span>{estimate.carbohydrateGrams}g carbohydrates</span><span>{estimate.fatGrams}g fat</span></div><p className="fine-print">Captured from profile revision {estimate.profileRevision} · {formatDateTime(estimate.calculatedAt)}</p></> : <p className="fine-print">This plan has no saved estimate yet.</p>}<button className="button small secondary full-width" onClick={onRecalculate}><RotateIcon /> Recalculate explicitly</button></div>;
}

function RecalculationModal({ estimate, previewEstimate, profileRevision, saving, onCancel, onSave }: { estimate?: EstimateSnapshot; previewEstimate: ReturnType<typeof calculateEstimates>; profileRevision: number; saving: boolean; onCancel: () => void; onSave: () => void }) {
  const newEstimate = { ...previewEstimate, calculatedAt: now(), profileRevision };
  return <div className="inline-modal"><div><p className="eyebrow">Explicit recalculation</p><h2>Preview replacement estimates</h2><p className="muted">Your profile may have changed. This only updates the saved estimate on this plan; history stays unchanged.</p></div><div className="compare-grid"><EstimateCompare label="Saved" estimate={estimate} /><EstimateCompare label="New preview" estimate={newEstimate} /></div><div className="modal-actions"><button className="button ghost" onClick={onCancel}>Keep current</button><button className="button primary" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save replacement'}</button></div></div>;
}

function DeleteModal({ planName, error, saving, onCancel, onDelete }: { planName: string; error: string; saving: boolean; onCancel: () => void; onDelete: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}><div className="delete-data-modal" role="dialog" aria-modal="true" aria-labelledby="delete-plan-title"><div className="warning-icon"><Trash2 size={20} /></div><p className="eyebrow">Delete workout plan</p><h2 id="delete-plan-title">Delete {planName}?</h2><p>Future sessions will disappear, but recorded history will be retained.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button ghost" onClick={onCancel} disabled={saving} autoFocus>Cancel</button><button type="button" className="button danger-button" onClick={onDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete plan'}</button></div></div></div>;
}

function EstimateCompare({ label, estimate }: { label: string; estimate?: EstimateSnapshot | (ReturnType<typeof calculateEstimates> & { calculatedAt: string; profileRevision: number }) }) {
  return <div className="compare-card"><span className="eyebrow">{label}</span>{estimate ? <><strong>{estimate.dailyCalories.toLocaleString()} <small>calories</small></strong><span>{estimate.proteinGrams}g protein · {estimate.carbohydrateGrams}g carbohydrates · {estimate.fatGrams}g fat</span><span>BMI (body mass index) {estimate.bmi.toFixed(1)}</span></> : <span className="muted">No saved estimate</span>}</div>;
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
  const rirLabel = prescription.dose.kind === 'reps' ? ` · Target ${prescription.targetRir ?? 2} RIR (reps left)` : '';
  return <article className="exercise-detail"><div className="exercise-detail-number">{String(index + 1).padStart(2, '0')}</div><div className="exercise-detail-content"><div className="exercise-detail-heading"><div><h3>{exercise.name}</h3><span className="worked-label">Primary: {primaryAreas}{secondaryAreas}</span></div><div className="exercise-detail-badges"><span className="dose-pill">{prescription.sets} × {prescription.dose.value}{prescription.dose.kind === 'reps' ? ' reps' : ' sec'}</span><span className={`effort-pill ${effort.direction}`}>{effort.label}</span></div></div><div className="exercise-detail-grid"><div className="exercise-media gif-media"><img src={`assets/exercises/${exercise.id}.gif?v=2`} alt={`${exercise.name} movement demonstration`} loading="lazy" /></div><div><p className="eyebrow">How to move</p><ol className="instruction-list">{exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol><p className="rest-note"><Clock3 size={14} /> Weight/resistance: {formatLoad(prescription.recommendedLoadKg)} · Rest {prescription.restSeconds} sec{rirLabel}{prescription.notes ? ` · ${prescription.notes}` : ''}</p><p className="effort-detail">{effort.detail}</p></div></div></div></article>;
}

function formatLoad(load: number | null | undefined): string {
  if (load === 0) return 'Bodyweight';
  if (load === null || load === undefined) return 'Choose a weight/resistance';
  return `${load} kg`;
}

function RotateIcon() { return <span className="rotate-icon">↻</span>; }
