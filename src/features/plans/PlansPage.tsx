import { ArrowRight, CalendarDays, Dumbbell, FolderPlus, Layers, Plus, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { FOCUS_LABELS, INTENSITY_LABELS, formatPlanSchedule, formatProgramSchedule, formatSchedule, plannedVolume, type WorkoutPlan, type WorkoutProgram, type WorkoutRecord } from '../../domain';
import type { PlannerData } from '../../data/db';
import { EmptyState, Page } from '../../shared/ui';
import { FocusIllustration } from './FocusIllustration';
import { ProgramCreateModal } from './ProgramCreateModal';

export function Plans({ data }: { data: PlannerData }) {
  const { plans, programs, records } = data;
  const [view, setView] = useState<'plans' | 'programs'>(() => programs.length ? 'programs' : 'plans');
  const [createOpen, setCreateOpen] = useState(false);
  const planCountLabel = plans.length === 1 ? 'plan' : 'plans';
  const programCountLabel = programs.length === 1 ? 'program' : 'programs';

  return <>
    <Page title="Workout plans" subtitle="Simple sessions you can actually repeat." action={<div className="page-actions"><button type="button" className="button secondary" onClick={() => setCreateOpen(true)}><FolderPlus size={17} /> New program</button><Link className="button primary" to="/plans/new"><Plus size={17} /> New plan</Link></div>}>
      <div className="plans-toolbar">
        <div className="toolbar-note"><Target size={18} /><span>Each plan has one confirmed focus. The exercises can still work across several areas.</span></div>
        <div className="plans-view-switch" role="tablist" aria-label="Workout plan views">
          <button type="button" role="tab" id="programs-tab" aria-controls="plans-view-panel" aria-selected={view === 'programs'} className={view === 'programs' ? 'selected' : ''} onClick={() => setView('programs')}>Programs <span>{programs.length} {programCountLabel}</span></button>
          <button type="button" role="tab" id="plans-tab" aria-controls="plans-view-panel" aria-selected={view === 'plans'} className={view === 'plans' ? 'selected' : ''} onClick={() => setView('plans')}>Plans <span>{plans.length} {planCountLabel}</span></button>
        </div>
      </div>
      <div className="plans-view-content" id="plans-view-panel" role="tabpanel" tabIndex={0} aria-labelledby={view === 'programs' ? 'programs-tab' : 'plans-tab'} key={view}>{view === 'plans' && plans.length === 0 ? <EmptyState
        large
        icon={<Dumbbell size={24} />}
        title="Your first plan starts here"
        body="Choose a focus, add a few movements from the library, and save a session you’ll want to come back to."
        action={<Link className="button primary" to="/plans/new"><Plus size={16} /> Build a plan</Link>}
      /> : view === 'plans' ? <div className="plan-grid">
        {plans.map((plan) => <PlanCard key={plan.id} plan={plan} records={records} programs={programs} />)}
      </div> : programs.length === 0 ? <EmptyState
        large
        icon={<Layers size={24} />}
        title="Organize your plans into a program"
        body="Create a program when you want related sessions—like Push, Pull, and Legs—in one easy-to-open place."
        action={<button type="button" className="button primary" onClick={() => setCreateOpen(true)}><FolderPlus size={16} /> Create a program</button>}
      /> : <div className="program-grid">
        {programs.map((program) => <ProgramCard key={program.id} program={program} plans={plans} />)}
      </div>}</div>
      <section className="principle-strip"><Sparkles size={18} /><p><strong>One good session is enough.</strong> You can always edit a plan later. Past workout records keep the version you actually followed.</p></section>
    </Page>
    {createOpen && <ProgramCreateModal data={data} onClose={() => setCreateOpen(false)} />}
  </>;
}

function ProgramCard({ program, plans }: { program: WorkoutProgram; plans: WorkoutPlan[] }) {
  const memberPlans = program.planIds.map((id) => plans.find((plan) => plan.id === id)).filter((plan): plan is WorkoutPlan => Boolean(plan));
  const workoutLabel = memberPlans.length === 1 ? 'workout' : 'workouts';

  return (
    <Link className="program-card" to={`/programs/${program.id}`} aria-label={`Open ${program.name} program`}>
      <div className="program-card-icon"><Layers size={25} /></div>
      <div className="program-card-body">
        <div className="card-topline"><span className="area-pill">Program</span><span className="muted">{memberPlans.length} {workoutLabel}</span></div>
        <h2>{program.name}</h2>
        <p className="muted">{memberPlans.length ? memberPlans.map((plan) => plan.name).join(' · ') : 'No workout plans yet'}</p>
        <div className="program-card-footer"><span>{program.schedule ? formatProgramSchedule(program.schedule) : memberPlans.length ? `${formatSchedule(memberPlans[0].schedule)}${memberPlans.length > 1 ? ' and more' : ''}` : 'Add plans when you’re ready'}</span><span className="text-link">Open program <ArrowRight size={15} /></span></div>
      </div>
    </Link>
  );
}

export function PlanCard({ plan, records, programs }: { plan: WorkoutPlan; records: WorkoutRecord[]; programs: WorkoutProgram[] }) {
  const lastRecord = records.find((record) => record.sourcePlanId === plan.id);
  const lastUsedLabel = lastRecord ? `Last used ${lastRecord.sessionDate}` : 'Not used yet';
  const scheduleLabel = formatPlanSchedule(plan, programs);
  const focus = plan.focus ?? plan.primaryTargetArea;
  const intensity = plan.intensity ?? 'moderate';
  const membership = programs.filter((program) => program.planIds.includes(plan.id)).map((program) => program.name);
  const membershipLabel = membership.length ? `Program${membership.length > 1 ? 's' : ''}: ${membership.join(', ')}` : 'Not assigned to a program';

  return (
    <Link className="plan-card" to={`/plans/${plan.id}`} aria-label={`Open ${plan.name} workout plan`}>
      <div className="plan-graphic"><FocusIllustration focus={focus} /></div>
      <div className="plan-card-body">
        <div className="card-topline"><span className="area-pill">{FOCUS_LABELS[focus]}</span><span className="muted">{lastUsedLabel}</span></div>
        <h2>{plan.name}</h2>
        <p className={`plan-membership ${membership.length ? '' : 'unassigned'}`}><Layers size={13} /><span>{membershipLabel}</span></p>
        <p className="muted">{plan.prescriptions.length} exercises · {plannedVolume(plan.prescriptions)} planned work sets · {INTENSITY_LABELS[intensity]} intensity</p>
        <div className="plan-card-footer">
          <span className="schedule-label"><CalendarDays size={15} /> {scheduleLabel}</span>
          <span className="text-link">Open plan <ArrowRight size={15} /></span>
        </div>
      </div>
    </Link>
  );
}
