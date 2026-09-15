import { useState, type FormEvent } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, ChevronUp, Dumbbell, FolderPlus, Info, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { FOCUS_LABELS, dateIsValid, formatSchedule, localDate, type WorkoutPlan, type WorkoutProgram } from '../../domain';
import { saveProgram as saveProgramRecord, now as databaseNow, uid, type AuthenticatedPlannerData } from '../../data/db';
import { EmptyState, Field, Page } from '../../shared/ui';
import { ProgramScheduleFields, type ProgramScheduleKind } from './ProgramScheduleFields';

export function ProgramEditor({ data }: { data: AuthenticatedPlannerData }) {
  const { programId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(programId);
  const source = data.programs.find((program) => program.id === programId);
  const [name, setName] = useState(source?.name ?? '');
  const [planIds, setPlanIds] = useState(() => source?.planIds.filter((id) => data.plans.some((plan) => plan.id === id)) ?? []);
  const [scheduleKind, setScheduleKind] = useState<ProgramScheduleKind>(() => source?.schedule?.kind === 'rolling' ? 'rolling' : 'independent');
  const [startsOn, setStartsOn] = useState(source?.schedule?.kind === 'rolling' ? source.schedule.startsOn : localDate());
  const [intervalDays, setIntervalDays] = useState(String(source?.schedule?.kind === 'rolling' ? source.schedule.intervalDays : 2));
  const [advanceOnCompletion, setAdvanceOnCompletion] = useState(source?.schedule?.advanceOnCompletion ?? !editing);
  const [deloadEveryRotations, setDeloadEveryRotations] = useState(String(source?.schedule?.deloadEveryRotations ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedPlans = planIds.map((id) => data.plans.find((plan) => plan.id === id)).filter((plan): plan is WorkoutPlan => Boolean(plan));
  const assignedPlanIds = new Set(data.programs.flatMap((program) => program.planIds));
  const availablePlans = data.plans.filter((plan) => !assignedPlanIds.has(plan.id) && !planIds.includes(plan.id));

  if (editing && !source) {
    return <Page title="Program not found" subtitle="It may have been deleted, but its workout plans are still safe."><EmptyState icon={<Info size={22} />} title="There’s no program with that ID" body="Return to your workout plans to choose another program." action={<Link className="button secondary" to="/plans">Back to plans</Link>} /></Page>;
  }

  function togglePlan(planId: string) {
    setPlanIds((current) => current.includes(planId) ? current.filter((id) => id !== planId) : [...current, planId]);
  }

  function movePlan(index: number, direction: -1 | 1) {
    setPlanIds((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function removePlan(planId: string) {
    setPlanIds((current) => current.filter((id) => id !== planId));
  }

  function buildProgram(): WorkoutProgram | undefined {
    if (!name.trim()) {
      setError('Name your program before saving.');
      return undefined;
    }
    const interval = Number(intervalDays);
    if (scheduleKind === 'rolling' && (!dateIsValid(startsOn) || !Number.isInteger(interval) || interval < 1 || interval > 30)) {
      setError('Choose a valid start date and an interval from 1 to 30 days.');
      return undefined;
    }
    const deloadEvery = Number(deloadEveryRotations);
    if (scheduleKind === 'rolling' && deloadEveryRotations !== '' && (!Number.isInteger(deloadEvery) || deloadEvery < 2 || deloadEvery > 12)) {
      setError('Deload frequency must be between 2 and 12 rotations, or left blank.');
      return undefined;
    }
    const sourceSchedule = source?.schedule;
    const anchorIndex = sourceSchedule?.anchorPlanIndex ?? 0;
    const preserveAnchor = Boolean(sourceSchedule?.anchorDate && sourceSchedule.startsOn === startsOn && sourceSchedule.intervalDays === interval && source?.planIds[anchorIndex] === planIds[anchorIndex]);
    return {
      id: source?.id ?? uid(),
      name: name.trim(),
      planIds: planIds.filter((id) => data.plans.some((plan) => plan.id === id)),
      ...(scheduleKind === 'rolling' ? { schedule: { kind: 'rolling' as const, startsOn, intervalDays: interval, advanceOnCompletion, ...(deloadEveryRotations ? { deloadEveryRotations: deloadEvery } : {}), ...(preserveAnchor ? { anchorDate: sourceSchedule?.anchorDate, anchorPlanIndex: sourceSchedule?.anchorPlanIndex } : {}) } } : {}),
      revision: (source?.revision ?? 0) + 1,
      createdAt: source?.createdAt ?? databaseNow(),
      updatedAt: databaseNow(),
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const program = buildProgram();
    if (!program) return;

    setSaving(true);
    setError('');
    try {
      await saveProgramRecord(program);
      navigate(`/programs/${program.id}`);
    } catch {
      setError('The program could not be saved. Your draft is still here—try again.');
    } finally {
      setSaving(false);
    }
  }

  async function createPlanHere() {
    const program = buildProgram();
    if (!program) return;
    setSaving(true);
    setError('');
    try {
      await saveProgramRecord(program);
      navigate(`/plans/new?programId=${program.id}`);
    } catch {
      setError('The program could not be saved before creating a plan. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page title={editing ? 'Edit program' : 'Build a program'} subtitle="Keep related workouts together without changing how any individual session works." backTo="/plans">
      <form className="program-editor" onSubmit={submit}>
        <section className="editor-section">
          <div className="section-heading"><div><p className="eyebrow">01 · Identity</p><h2>Name your program</h2></div><FolderPlus size={19} /></div>
          <Field label="Program name" hint="Make the routine easy to recognize"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Three-day strength" /></Field>
        </section>
        <section className="editor-section">
          <div className="section-heading"><div><p className="eyebrow">02 · Workouts</p><h2>Choose unassigned plans</h2></div><span className="count-badge">{planIds.length}</span></div>
          <p className="section-explainer">Plans already assigned to a program stay out of this list. Selected plans keep their own detail pages and workout history; the schedule above decides whether their dates stay individual or rotate together.</p>
          {availablePlans.length ? <div className="program-plan-picker">{availablePlans.map((plan) => {
            const focus = plan.focus ?? plan.primaryTargetArea;
            return <label className="program-plan-option" key={plan.id}><input type="checkbox" checked={false} onChange={() => togglePlan(plan.id)} /><span className="program-plan-option-body"><strong>{plan.name}</strong><small>{FOCUS_LABELS[focus]} · Individual: {formatSchedule(plan.schedule)}</small></span></label>;
          })}</div> : <EmptyState compact icon={<Dumbbell size={21} />} title={data.plans.length ? 'No unassigned plans available' : 'Create a workout plan first'} body={data.plans.length ? 'Create a new plan here or remove a plan from another program.' : 'Programs can hold plans you’ve already built.'} action={<button type="button" className="button secondary small" onClick={createPlanHere} disabled={saving}><Plus size={15} /> Create a new plan here</button>} />}
          {availablePlans.length > 0 && <button type="button" className="button secondary small program-create-plan" onClick={createPlanHere} disabled={saving}><Plus size={15} /> Create a new plan here</button>}
        </section>
        <section className="editor-section">
          <div className="section-heading"><div><p className="eyebrow">03 · Schedule</p><h2>Choose the program rhythm</h2></div><CalendarDays size={19} /></div>
          <ProgramScheduleFields kind={scheduleKind} startsOn={startsOn} intervalDays={intervalDays} onKindChange={setScheduleKind} onStartsOnChange={setStartsOn} onIntervalDaysChange={setIntervalDays} advanceOnCompletion={advanceOnCompletion} onAdvanceOnCompletionChange={setAdvanceOnCompletion} deloadEveryRotations={deloadEveryRotations} onDeloadEveryRotationsChange={setDeloadEveryRotations} previewPlans={selectedPlans} />
        </section>
        {selectedPlans.length > 0 && <section className="editor-section">
          <div className="section-heading"><div><p className="eyebrow">04 · Order</p><h2>Set the order</h2></div></div>
          <p className="section-explainer">This order is how workouts appear in a moving-day rotation. It also controls the order shown inside the program.</p>
          <div className="program-order-list">{selectedPlans.map((plan, index) => <div className="program-order-item" key={plan.id}><span className="program-order-number">{String(index + 1).padStart(2, '0')}</span><span className="program-order-main"><strong>{plan.name}</strong><small>{FOCUS_LABELS[plan.focus ?? plan.primaryTargetArea]}</small></span><span className="program-order-controls"><button className="icon-button" type="button" onClick={() => movePlan(index, -1)} disabled={index === 0} aria-label={`Move ${plan.name} up`}><ChevronUp size={17} /></button><button className="icon-button" type="button" onClick={() => movePlan(index, 1)} disabled={index === selectedPlans.length - 1} aria-label={`Move ${plan.name} down`}><ChevronDown size={17} /></button><button className="icon-button danger" type="button" onClick={() => removePlan(plan.id)} aria-label={`Remove ${plan.name} from program`}><Trash2 size={16} /></button></span></div>)}</div>
        </section>}
        {error && <p className="form-error global-error" role="alert">{error}</p>}
        <div className="sticky-save"><button type="button" className="button ghost" onClick={() => navigate('/plans')}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Save program'} <ArrowRight size={16} /></button></div>
      </form>
    </Page>
  );
}
