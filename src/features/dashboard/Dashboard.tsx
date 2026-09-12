import { useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, CalendarDays, CircleCheck, Dumbbell, Flame, HeartPulse, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { FOCUS_LABELS, INTENSITY_LABELS, calculateEstimates, formatSchedule, localDate, occurrenceAfter, occurrenceBefore, occursOn, plannedVolume, type Profile, type WorkoutPlan } from '../../domain';
import type { PlannerData } from '../../data/db';
import { formatLongDate, formatShortDate, getGreeting } from '../../shared/formatters';
import { EmptyState, Page } from '../../shared/ui';

export function Dashboard({ data }: { data: PlannerData }) {
  const { profile, plans, records, weights } = data;
  const [selectedDate, setSelectedDate] = useState(localDate());
  const estimate = profile ? calculateEstimates(profile) : null;
  const selectedPlans = plans.filter((plan) => occursOn(plan, selectedDate));
  const beforePlans = plans.map((plan) => ({ plan, date: occurrenceBefore(plan, selectedDate) })).filter((item): item is ScheduledOccurrence => Boolean(item.date)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const upcomingPlans = plans.map((plan) => ({ plan, date: occurrenceAfter(plan, selectedDate) })).filter((item): item is ScheduledOccurrence => Boolean(item.date)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const recentWeight = weights[0];
  const firstName = profile?.name.split(' ')[0] ?? 'there';

  return (
    <Page
      title={`${getGreeting()}, ${firstName}.`}
      subtitle="Here’s a calm view of what’s next."
      action={<Link className="button primary" to="/plans/new"><Plus size={17} /> New plan</Link>}
    >
      <div className="dashboard-grid">
        <div className="main-column">
          <section className="welcome-panel">
            <div>
              <p className="eyebrow on-dark">Your day, your pace</p>
              <h2>{formatLongDate(selectedDate)}</h2>
              <p>Small actions compound. Start with the session that fits this date.</p>
            </div>
            <div className="welcome-orbit"><Dumbbell size={32} /></div>
          </section>
          <section className="section-block">
            <div className="section-heading">
              <div><p className="eyebrow">Schedule</p><h2>What’s scheduled</h2></div>
              <div className="dashboard-date-controls"><button className="icon-button" type="button" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} aria-label="Show previous date"><ArrowLeft size={16} /></button><DatePicker value={selectedDate} onChange={setSelectedDate} /><button className="icon-button" type="button" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} aria-label="Show next date"><ArrowRight size={16} /></button>{selectedDate !== localDate() && <button className="button small ghost" type="button" onClick={() => setSelectedDate(localDate())}>Today</button>}</div>
            </div>
            {selectedPlans.length === 0 ? <EmptyState
              icon={<CalendarDays size={22} />}
              title="Nothing scheduled on this date"
              body="Try another date, or create a one-time session or recurring plan."
              action={<Link className="button secondary" to="/plans/new"><Plus size={16} /> Create a plan</Link>}
            /> : <div className="schedule-list">
              {selectedPlans.map((plan) => <ScheduleCard key={plan.id} plan={plan} completed={hasCompletedRecord(records, plan.id, selectedDate)} date={selectedDate} />)}
            </div>}
            {beforePlans.length > 0 && <ScheduleWindow title="Before this date" occurrences={beforePlans} records={records} />}
            {upcomingPlans.length > 0 && <ScheduleWindow title="Coming up" occurrences={upcomingPlans} records={records} />}
          </section>
        </div>
        <aside className="dashboard-side">
          <EstimateCard estimate={estimate} profile={profile} />
          <div className="side-card quick-card">
            <div className="section-heading"><div><p className="eyebrow">Quick log</p><h3>Keep the signal</h3></div><Activity size={19} /></div>
            <Link className="quick-row" to="/progress">
              <span className="quick-icon peach"><TrendingUp size={17} /></span>
              <span><strong>Body weight</strong><small>{recentWeight ? `${recentWeight.weightKg} kg · ${recentWeight.date}` : 'Add your first measurement'}</small></span>
              <ArrowRight size={16} />
            </Link>
            <Link className="quick-row" to="/plans">
              <span className="quick-icon blue"><Dumbbell size={17} /></span>
              <span><strong>Workout plans</strong><small>{plans.length ? `${plans.length} saved ${plans.length === 1 ? 'plan' : 'plans'}` : 'Build your first plan'}</small></span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="quote-card"><span className="quote-mark">“</span><p>Consistency is a practice, not a personality trait.</p><small>FORM NOTE</small></div>
        </aside>
      </div>
    </Page>
  );
}

interface ScheduledOccurrence {
  plan: WorkoutPlan;
  date: string;
}

function ScheduleWindow({ title, occurrences, records }: { title: string; occurrences: ScheduledOccurrence[]; records: PlannerData['records'] }) {
  return <section className="schedule-window"><div className="section-heading"><div><p className="eyebrow">{title}</p><h3>{occurrences.length} scheduled {occurrences.length === 1 ? 'workout' : 'workouts'}</h3></div></div><div className="schedule-list">{occurrences.map(({ plan, date }) => <ScheduleCard key={`${plan.id}-${date}`} plan={plan} completed={hasCompletedRecord(records, plan.id, date)} date={date} />)}</div></section>;
}

function hasCompletedRecord(records: PlannerData['records'], planId: string, date: string): boolean {
  return records.some((record) => record.sourcePlanId === planId && record.sessionDate === date && record.status === 'completed');
}

function shiftDate(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  return localDate(new Date(year, month - 1, day + days));
}

function DatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const label = value === localDate() ? 'Today' : formatShortDate(value);
  return <label className="date-picker"><CalendarDays size={16} /><span>{label}</span><input type="date" value={value} onChange={(event) => onChange(event.target.value)} aria-label="Select schedule date" /></label>;
}

function EstimateCard({ estimate, profile }: { estimate: ReturnType<typeof calculateEstimates> | null; profile: Profile | undefined }) {
  if (!estimate || !profile) return null;
  return (
    <div className="side-card estimate-card">
      <div className="section-heading"><div><p className="eyebrow">Daily nutrition targets</p><h3>{estimate.dailyCalories.toLocaleString()} <small>calories/day</small></h3></div><span className="target-icon"><Flame size={18} /></span></div>
      <div className="macro-bars">
        <MacroBar label="Protein" value={`${estimate.proteinGrams}g`} width={Math.min(100, estimate.proteinGrams / 2)} tone="green" />
        <MacroBar label="Carbs" value={`${estimate.carbohydrateGrams}g`} width={Math.min(100, estimate.carbohydrateGrams / 3)} tone="gold" />
        <MacroBar label="Fat" value={`${estimate.fatGrams}g`} width={Math.min(100, estimate.fatGrams * 1.2)} tone="peach" />
      </div>
      <div className="bmi-row"><span><HeartPulse size={16} /> BMI estimate <small>body mass index</small></span><strong>{estimate.bmi.toFixed(1)}</strong></div>
      <p className="fine-print">A daily estimate based on your profile and primary goal. BMI is a height-to-weight screening number, not a diagnosis. These are starting points, not medical advice or a per-workout allowance.</p>
      <Link className="text-link estimate-about-link" to="/about">How this is calculated <ArrowRight size={15} /></Link>
    </div>
  );
}

function MacroBar({ label, value, width, tone }: { label: string; value: string; width: number; tone: string }) {
  return <div className="macro-row"><span>{label}</span><span>{value}</span><div className="macro-track"><span className={tone} style={{ width: `${width}%` }} /></div></div>;
}

function ScheduleCard({ plan, completed, date }: { plan: WorkoutPlan; completed: boolean; date: string }) {
  const focus = plan.focus ?? plan.primaryTargetArea;
  return <Link to={`/sessions/${plan.id}/${date}`} className={`schedule-card ${completed ? 'done' : ''}`}>
    <span className="schedule-status">{completed ? <CircleCheck size={20} /> : <span className="empty-circle" />}</span>
    <span className="schedule-card-main"><span className="card-kicker">{FOCUS_LABELS[focus]} focus · {INTENSITY_LABELS[plan.intensity ?? 'moderate']} intensity · {plannedVolume(plan.prescriptions)} planned work sets</span><strong>{plan.name}</strong><span className="muted">{plan.prescriptions.length} exercises · {formatSchedule(plan.schedule)}</span><span className="schedule-occurrence"><CalendarDays size={13} /> {formatShortDate(date)}</span></span>
    <ArrowRight size={18} />
  </Link>;
}
