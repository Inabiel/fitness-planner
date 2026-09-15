import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, CircleCheck, Clipboard, Dumbbell, Flame, Pencil, Timer, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { FOCUS_LABELS, INTENSITY_LABELS, dateIsValid, isPlanRecurring, localDate, plannedVolume, type EstimateSnapshot, type SetRecord, type WorkoutIntensity, type WorkoutRecord } from '../../domain';
import type { PlannerData } from '../../data/db';
import { deletePlan as removePlan, deleteWorkoutRecord, now, saveWorkoutRecord, uid, updatePlanPrescriptions } from '../../data/db';
import { EXERCISES } from '../../data/exercises';
import { getGamificationCelebration, getGamificationFeedback, getGamificationSummary, type GamificationCelebration } from '../../shared/gamification';
import { formatDateTime, formatLongDate } from '../../shared/formatters';
import { estimatePlanCalories } from '../../shared/calorieBurn';
import { getProgressPoints } from '../../shared/progress';
import { ProgressLineChart } from '../../shared/progressChart';
import { copyToClipboard, formatWorkoutPlanText } from '../../shared/workoutExport';
import { EmptyState, Page, Snackbar } from '../../shared/ui';
import { GamificationCelebrationModal } from '../gamification';
import { FocusIllustration } from '../plans/FocusIllustration';
import { LiveTrackingModal } from '../plans/LiveTrackingModal';
import { CopyPlanModal, DeletePlanModal } from '../plans/PlanActionModals';
import { assessPlanIntensity, assessPrescriptionEffort, adjustPrescriptionsForIntensity, recommendNextIntensity, recommendNextPrescriptions, type EffortAssessment, type IntensityAssessment } from '../plans/recommendations';
import { makePlanSnapshot } from './snapshot';
import { DeleteRecordModal } from './HistoryDetail';
import { getVisibleSetCount, SessionExercise, type SetValueField } from './SessionExercise';

export function Session({ data }: { data: PlannerData }) {
  const { planId, date } = useParams();
  const navigate = useNavigate();
  const selectedPlan = data.plans.find((item) => item.id === planId);
  const existing = data.records.find((record) => record.sourcePlanId === planId && record.sessionDate === date);
  const [sets, setSets] = useState<SetRecord[]>(existing?.sets ?? []);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePlanOpen, setDeletePlanOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [includeSteps, setIncludeSteps] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveTrackingOpen, setLiveTrackingOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [celebration, setCelebration] = useState<GamificationCelebration | null>(null);
  const [celebrationDetail, setCelebrationDetail] = useState('');
  const dismissSnackbar = useCallback(() => setSnackbar(null), []);

  useEffect(() => {
    if (!deletePlanOpen && !copyOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        setDeletePlanOpen(false);
        setCopyOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyOpen, deletePlanOpen, saving]);

  if (!selectedPlan || !date || !dateIsValid(date)) {
    return <Page title="Session unavailable" subtitle="We couldn’t resolve this dated occurrence."><EmptyState icon={<CalendarDays size={22} />} title="Check the plan and date" body="This session may belong to a deleted plan or an invalid date." action={<Link className="button secondary" to="/plans">Back to plans</Link>} /></Page>;
  }

  const plan = selectedPlan;
  const sessionDate = date;
  const snapshot = existing?.planSnapshot ?? makePlanSnapshot(plan);
  const focus = snapshot.focus ?? snapshot.primaryTargetArea;
  const intensity = snapshot.intensity ?? plan.intensity ?? 'moderate';
  const estimatedCalories = estimatePlanCalories(plan, data.profile?.weightKg ?? 0);
  const progressPoints = isPlanRecurring(plan, data.programs) ? getProgressPoints(data.records, plan.id) : [];

  function getSet(prescriptionId: string, setNumber: number): SetRecord {
    return sets.find((item) => item.prescriptionId === prescriptionId && item.setNumber === setNumber) ?? {
      prescriptionId,
      setNumber,
      actualReps: null,
      actualDurationSeconds: null,
      loadKg: null,
      rir: null,
    };
  }

  function updateSet(prescriptionId: string, setNumber: number, field: SetValueField, value: string) {
    const current = getSet(prescriptionId, setNumber);
    const parsed = value === '' ? null : Number(value);
    const next = { ...current, [field]: parsed };
    const hasValue = next.actualReps !== null || next.actualDurationSeconds !== null || next.loadKg !== null || next.rir !== null;

    setSets((items) => {
      const withoutCurrent = items.filter((item) => !(item.prescriptionId === prescriptionId && item.setNumber === setNumber));
      return hasValue ? [...withoutCurrent, next] : withoutCurrent;
    });
  }

  async function save(status: WorkoutRecord['status']) {
    setSaving(true);
    setSnackbar(null);
    setCelebration(null);
    setCelebrationDetail('');
    const record: WorkoutRecord = {
      id: existing?.id ?? uid(),
      sourcePlanId: plan.id,
      sessionDate,
      status,
      completedAt: status === 'completed' ? (existing?.completedAt ?? now()) : null,
      revision: (existing?.revision ?? 0) + 1,
      planSnapshot: snapshot,
      sets,
    };

    try {
      await saveWorkoutRecord(record);
      if (status === 'completed') {
        const recordsForRecommendation = data.records.filter((item) => item.id !== record.id).concat(record);
        const beforeGamification = getGamificationSummary(data.records, localDate());
        const afterGamification = getGamificationSummary(recordsForRecommendation, localDate());
        const gamificationMessage = getGamificationFeedback(beforeGamification, afterGamification);
        const gamificationCelebration = getGamificationCelebration(beforeGamification, afterGamification);
        const withGamification = (message: string) => gamificationMessage ? `${gamificationMessage} ${message}` : message;
        const showCompletion = (message: string, tone: 'success' | 'error') => {
          if (tone === 'success' && gamificationCelebration) {
            setCelebration(gamificationCelebration);
            setCelebrationDetail(message);
            return;
          }
          setSnackbar({ message: withGamification(message), tone });
        };
        const currentIntensity = plan.intensity ?? 'moderate';
        const nextIntensity = recommendNextIntensity(plan, recordsForRecommendation, isPlanRecurring(plan, data.programs));
        const intensityChanged = plan.intensity !== undefined && nextIntensity !== currentIntensity;
        const nextPrescriptions = intensityChanged
          ? adjustPrescriptionsForIntensity(plan.prescriptions, currentIntensity, nextIntensity)
          : recommendNextPrescriptions(plan, recordsForRecommendation);
        const changed = nextPrescriptions.some((item, index) => item !== plan.prescriptions[index]);

        if (changed || intensityChanged) {
          try {
            await updatePlanPrescriptions(plan.id, nextPrescriptions, plan.revision + 1, intensityChanged ? nextIntensity : undefined);
            showCompletion(intensityChanged
              ? `Session complete. You exceeded the ${INTENSITY_LABELS[currentIntensity]} target twice, so this plan is now ${INTENSITY_LABELS[nextIntensity]}.`
              : 'Session complete. Your next recommendation was adjusted from recent performance.', 'success');
          } catch {
            showCompletion('Session complete. Your next recommendation could not be updated.', 'error');
          }
        } else {
          const intensityResult = assessPlanIntensity(plan, recordsForRecommendation).result;
          showCompletion(intensityResult === 'above'
            ? `Session complete. You exceeded the ${INTENSITY_LABELS[currentIntensity]} target.`
            : intensityResult === 'on-target'
              ? `Session complete. You achieved the ${INTENSITY_LABELS[currentIntensity]} target.`
              : 'Session complete. Nice work.', 'success');
        }
      } else {
        setSnackbar({ message: 'Progress saved.', tone: 'success' });
      }
    } catch {
      setSnackbar({ message: 'Could not save yet. Your entries are still on this screen—try again.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord() {
    if (!existing) return;
    setSaving(true);
    try {
      await deleteWorkoutRecord(existing.id);
      navigate('/progress');
    } catch {
      setSnackbar({ message: 'Could not delete this saved session. Try again.', tone: 'error' });
      setSaving(false);
    }
  }

  async function deletePlan() {
    setSaving(true);
    try {
      await removePlan(plan.id);
      navigate('/plans');
    } catch {
      setSnackbar({ message: 'Could not delete this plan. Try again.', tone: 'error' });
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
    <Page title={existing?.status === 'completed' ? 'Completed session' : 'Follow your session'} subtitle={`${snapshot.name} · ${formatLongDate(date)}`} backTo={`/plans/${plan.id}`} action={<div className="page-actions"><Link className="button secondary" to={`/plans/${plan.id}`}><Dumbbell size={16} /> Plan details</Link><Link className="button secondary" to={`/plans/${plan.id}/edit`}><Pencil size={16} /> Edit plan</Link><button className="button secondary" type="button" onClick={openCopyModal}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? 'Copied' : 'Copy plan text'}</button></div>}>
      <div className="session-layout">
        <div className="session-main">
          <section className="focus-hero session-focus-hero"><div className="focus-copy"><p className="eyebrow on-dark">Workout focus</p><h2>{FOCUS_LABELS[focus]}</h2><p>This is the intention you confirmed for the plan. Your exercises can work other areas too.</p></div><FocusIllustration focus={focus} /></section>
          {progressPoints.length > 0 && <section className="detail-section progress-card"><div className="section-heading"><div><p className="eyebrow">Recurring progress</p><h2>Performance trend</h2></div><span className="unit-label">% of target</span></div><ProgressLineChart points={progressPoints} ariaLabel={`${snapshot.name} performance trend`} /></section>}
          <div className="session-intro"><span className="session-date"><CalendarDays size={16} /> {formatLongDate(date)}</span><span className="area-pill">{FOCUS_LABELS[focus]} focus</span><span className="area-pill intensity-pill">Target: {INTENSITY_LABELS[intensity]}</span><h2>{snapshot.name}</h2><p className="muted">Log actual reps, weight/resistance, and optional RIR (reps in reserve). RIR means how many more good-form reps you could have done after a set. Blank fields stay unknown, and completion never requires performance details.</p></div>
          {snapshot.prescriptions.map((prescription, index) => {
            const exercise = snapshot.exercises.find((item) => item.id === prescription.exerciseId) ?? EXERCISES.find((item) => item.id === prescription.exerciseId);
            return exercise ? <SessionExercise key={prescription.id} prescription={prescription} exercise={exercise} index={index} effort={assessPrescriptionEffort(prescription, plan.id, data.records)} setCount={getVisibleSetCount(prescription, sets)} showDetails getSet={getSet} updateSet={updateSet} /> : null;
          })}
          <div className="session-actions">
            <button className="button ghost" onClick={() => navigate(-1)}>Exit</button>
            <button className="button secondary" onClick={() => save('in_progress')} disabled={saving}><Check size={16} /> {saving ? 'Saving…' : 'Save progress'}</button>
            <button className="button primary" onClick={() => save('completed')} disabled={saving}><CircleCheck size={16} /> Mark complete</button>
            {existing && <button className="button danger-button" onClick={() => setDeleteOpen(true)} disabled={saving}><Trash2 size={16} /> Delete saved session</button>}
          </div>
        </div>
        <aside className="session-side">
          <SessionEstimateCard estimate={snapshot.estimate} />
          <IntensityCard target={intensity} assessment={assessPlanIntensity(plan, data.records)} />
          <EffortSummary assessments={plan.prescriptions.map((prescription) => assessPrescriptionEffort(prescription, plan.id, data.records))} />
          <div className="side-card"><p className="eyebrow">Planned work sets</p><strong className="big-number">{plannedVolume(snapshot.prescriptions)}</strong><span className="muted">sets scheduled · {estimatedCalories.toLocaleString()} estimated kcal</span></div>
          <div className="side-card"><p className="eyebrow">Session note</p><h3>Presence over perfection.</h3><p className="muted">You can finish a session without recording a single set. Actual performance is optional, not assumed.</p></div>
          <div className="side-card">
            <p className="eyebrow">Plan actions</p>
            <Link className="side-action" to={`/plans/${plan.id}`}><Dumbbell size={17} /><span><strong>View plan details</strong><small>See the full plan, progress, estimates, and exercise guidance.</small></span><ArrowRight size={16} /></Link>
            <Link className="side-action" to={`/plans/${plan.id}/edit`}><Pencil size={17} /><span><strong>Edit this plan</strong><small>Update the plan without changing this session snapshot.</small></span><ArrowRight size={16} /></Link>
            <button className="side-action" type="button" onClick={openCopyModal}><Clipboard size={17} /><span><strong>Copy plan text</strong><small>Prepare the workout for sharing or keeping elsewhere.</small></span><ArrowRight size={16} /></button>
            <button className="side-action" type="button" onClick={() => setLiveTrackingOpen(true)}><Timer size={17} /><span><strong>Live tracking</strong><small>Track each exercise in a focused modal with rest countdowns.</small></span><ArrowRight size={16} /></button>
            <button className="side-action" type="button" onClick={() => setDeletePlanOpen(true)} disabled={saving}><Trash2 size={17} /><span><strong>Delete this plan</strong><small>Recorded history will stay safe.</small></span><ArrowRight size={16} /></button>
          </div>
        </aside>
      </div>
      {snackbar && <Snackbar message={snackbar.message} tone={snackbar.tone} onDismiss={dismissSnackbar} />}
      {copyOpen && <CopyPlanModal includeSteps={includeSteps} saving={saving} onIncludeStepsChange={setIncludeSteps} onCancel={() => setCopyOpen(false)} onCopy={copyPlan} />}
      {liveTrackingOpen && <LiveTrackingModal plan={plan} records={data.records} onClose={() => setLiveTrackingOpen(false)} onSaved={(message, nextCelebration) => { if (nextCelebration) { setCelebration(nextCelebration); setCelebrationDetail(message); } else { setSnackbar({ message, tone: 'success' }); } }} />}
      {celebration && <GamificationCelebrationModal celebration={celebration} detail={celebrationDetail} onClose={() => { setCelebration(null); setCelebrationDetail(''); }} />}
      {deletePlanOpen && <DeletePlanModal planName={plan.name} error={snackbar?.tone === 'error' ? snackbar.message : ''} saving={saving} onCancel={() => setDeletePlanOpen(false)} onDelete={deletePlan} />}
      {deleteOpen && <DeleteRecordModal recordName={snapshot.name} deleting={saving} onCancel={() => setDeleteOpen(false)} onDelete={deleteRecord} />}
    </Page>
  );
}

function SessionEstimateCard({ estimate }: { estimate?: EstimateSnapshot }) {
  return <div className="side-card saved-estimate"><div className="section-heading"><div><p className="eyebrow">Saved estimates</p><h3>{estimate ? `${estimate.dailyCalories.toLocaleString()} calories` : 'Not available'}</h3></div><span className="target-icon"><Flame size={17} /></span></div>{estimate ? <><div className="saved-macros"><span>{estimate.proteinGrams}g protein</span><span>{estimate.carbohydrateGrams}g carbohydrates</span><span>{estimate.fatGrams}g fat</span></div><p className="fine-print">Captured from profile revision {estimate.profileRevision} · {formatDateTime(estimate.calculatedAt)}</p></> : <p className="fine-print">This session has no saved estimate.</p>}</div>;
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
