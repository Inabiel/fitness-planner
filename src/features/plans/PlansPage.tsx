import { ArrowRight, CalendarDays, Dumbbell, Plus, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router';
import { FOCUS_LABELS, plannedVolume, type WorkoutPlan, type WorkoutRecord } from '../../domain';
import type { PlannerData } from '../../data/db';
import { weekdayLabel } from '../../shared/formatters';
import { EmptyState, Page } from '../../shared/ui';
import { FocusIllustration } from './FocusIllustration';

export function Plans({ data }: { data: PlannerData }) {
  const { plans, records } = data;
  const planCountLabel = plans.length === 1 ? 'plan' : 'plans';

  return (
    <Page title="Workout plans" subtitle="Simple sessions you can actually repeat." action={<Link className="button primary" to="/plans/new"><Plus size={17} /> New plan</Link>}>
      <div className="plans-toolbar">
        <div className="toolbar-note"><Target size={18} /><span>Each plan has one confirmed focus. The exercises can still work across several areas.</span></div>
        <span className="muted">{plans.length} {planCountLabel}</span>
      </div>
      {plans.length === 0 ? <EmptyState
        large
        icon={<Dumbbell size={24} />}
        title="Your first plan starts here"
        body="Choose a focus, add a few movements from the library, and save a session you’ll want to come back to."
        action={<Link className="button primary" to="/plans/new"><Plus size={16} /> Build a plan</Link>}
      /> : <div className="plan-grid">
        {plans.map((plan) => <PlanCard key={plan.id} plan={plan} records={records} />)}
      </div>}
      <section className="principle-strip"><Sparkles size={18} /><p><strong>One good session is enough.</strong> You can always edit a plan later. Past workout records keep the version you actually followed.</p></section>
    </Page>
  );
}

function PlanCard({ plan, records }: { plan: WorkoutPlan; records: WorkoutRecord[] }) {
  const lastRecord = records.find((record) => record.sourcePlanId === plan.id);
  const lastUsedLabel = lastRecord ? `Last used ${lastRecord.sessionDate}` : 'Not used yet';
  const scheduleLabel = plan.schedule.kind === 'weekly' ? `Every ${weekdayLabel(plan.schedule.weekday)}` : plan.schedule.date;
  const focus = plan.focus ?? plan.primaryTargetArea;

  return (
    <Link className="plan-card" to={`/plans/${plan.id}`} aria-label={`Open ${plan.name} workout plan`}>
      <div className="plan-graphic"><FocusIllustration focus={focus} /></div>
      <div className="plan-card-body">
        <div className="card-topline"><span className="area-pill">{FOCUS_LABELS[focus]}</span><span className="muted">{lastUsedLabel}</span></div>
        <h2>{plan.name}</h2>
        <p className="muted">{plan.prescriptions.length} exercises · {plannedVolume(plan.prescriptions)} planned work sets</p>
        <div className="plan-card-footer">
          <span className="schedule-label"><CalendarDays size={15} /> {scheduleLabel}</span>
          <span className="text-link">Open plan <ArrowRight size={15} /></span>
        </div>
      </div>
    </Link>
  );
}
