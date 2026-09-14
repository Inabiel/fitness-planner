import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Dumbbell, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { formatProgramSchedule, localDate, occurrenceAfter, occursOn, type WorkoutPlan } from '../../domain';
import { deleteProgram, type AuthenticatedPlannerData } from '../../data/db';
import { formatLongDate } from '../../shared/formatters';
import { EmptyState, Page } from '../../shared/ui';
import { PlanCard } from './PlansPage';

export function ProgramDetail({ data }: { data: AuthenticatedPlannerData }) {
  const { programId } = useParams();
  const navigate = useNavigate();
  const selectedProgram = data.programs.find((item) => item.id === programId);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!deleteOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) setDeleteOpen(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [deleteOpen, saving]);

  if (!selectedProgram) {
    return <Page title="Program not found" subtitle="This program may have been deleted."><EmptyState icon={<Layers size={22} />} title="No program here" body="Return to your workout plans to choose another program." action={<Link to="/plans" className="button secondary">Back to plans</Link>} /></Page>;
  }

  const program = selectedProgram;
  const memberPlans = program.planIds.map((id) => data.plans.find((plan) => plan.id === id)).filter((plan): plan is WorkoutPlan => Boolean(plan));
  const workoutLabel = memberPlans.length === 1 ? 'workout' : 'workouts';
  const today = localDate();
  const nextWorkout = program.schedule && memberPlans.map((plan) => {
    const date = occursOn(plan, today, data.programs) ? today : occurrenceAfter(plan, today, data.programs);
    return date ? { plan, date } : null;
  }).filter((item): item is { plan: WorkoutPlan; date: string } => Boolean(item)).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextWorkoutIndex = nextWorkout ? memberPlans.findIndex((plan) => plan.id === nextWorkout.plan.id) : -1;

  async function removeProgram() {
    setSaving(true);
    setError('');
    try {
      await deleteProgram(program.id);
      navigate('/plans');
    } catch {
      setError('The program could not be deleted. Try again.');
      setSaving(false);
    }
  }

  return (
      <Page title={program.name} subtitle={`${memberPlans.length} ${workoutLabel} organized in this program${program.schedule ? ` · ${formatProgramSchedule(program.schedule)}` : ''}.`} backTo="/plans" action={<div className="page-actions"><Link className="button primary" to={`/plans/new?programId=${program.id}`}><Plus size={16} /> Add workout plan</Link><Link className="button secondary" to={`/programs/${program.id}/edit`}><Pencil size={16} /> Edit</Link><button className="button danger-button" type="button" onClick={() => setDeleteOpen(true)} disabled={saving}><Trash2 size={16} /> Delete</button></div>}>
      <section className="program-hero"><div><p className="eyebrow on-dark">Workout program</p><h2>{memberPlans.length ? 'Your sessions, in one place.' : 'Add workouts whenever you’re ready.'}</h2><p>{program.schedule ? 'The ordered plans rotate on this moving-day schedule. Rest days appear automatically between sessions.' : 'Programs organize plans without changing their schedules, logging, or history.'}</p></div><Layers size={54} aria-hidden="true" /></section>
      {program.schedule && nextWorkout && <section className="program-next-card"><div><p className="eyebrow">Next in rotation</p><h2>{nextWorkout.plan.name}</h2><p><CalendarDays size={14} /> {nextWorkout.date === today ? 'Today' : formatLongDate(nextWorkout.date)} · Workout {nextWorkoutIndex + 1} of {memberPlans.length}</p></div><Link className="button primary" to={`/sessions/${nextWorkout.plan.id}/${nextWorkout.date}`}>{nextWorkout.date === today ? 'Start today' : 'Open workout'} <ArrowRight size={16} /></Link></section>}
      <section className="detail-section program-workouts-section"><div className="section-heading"><div><p className="eyebrow">Program workouts</p><h2>Open a session plan</h2></div><span className="count-badge">{memberPlans.length}</span></div>
        {memberPlans.length ? <div className="plan-grid">{memberPlans.map((plan) => <PlanCard key={plan.id} plan={plan} records={data.records} programs={data.programs} weightKg={data.profile.weightKg} />)}</div> : <EmptyState compact icon={<Dumbbell size={21} />} title="No workout plans in this program" body="Edit the program to add plans you’ve already built." action={<Link className="button secondary small" to={`/programs/${program.id}/edit`}>Add workout plans</Link>} />}
      </section>
      {error && <p className="form-error global-error" role="alert">{error}</p>}
      {deleteOpen && <DeleteProgramModal programName={program.name} deleting={saving} error={error} onCancel={() => setDeleteOpen(false)} onDelete={removeProgram} />}
    </Page>
  );
}

function DeleteProgramModal({ programName, deleting, error, onCancel, onDelete }: { programName: string; deleting: boolean; error: string; onCancel: () => void; onDelete: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) onCancel(); }}><div className="delete-data-modal" role="dialog" aria-modal="true" aria-labelledby="delete-program-title"><div className="warning-icon"><Trash2 size={20} /></div><p className="eyebrow">Delete program</p><h2 id="delete-program-title">Delete {programName}?</h2><p>The workout plans and their recorded history will stay safe. Only this program grouping will be removed.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button ghost" onClick={onCancel} disabled={deleting} autoFocus>Cancel</button><button type="button" className="button danger-button" onClick={onDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete program'}</button></div></div></div>;
}
