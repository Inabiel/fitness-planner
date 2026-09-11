import { useState, type FormEvent } from 'react';
import { ArrowRight, BarChart3, Check, Clock3, Dumbbell, HeartPulse, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { dateIsValid, localDate, type BodyWeightRecord, type WorkoutRecord } from '../../domain';
import { deleteBodyWeight, now, saveBodyWeight, type PlannerData } from '../../data/db';
import { formatShortDate } from '../../shared/formatters';
import { getProgressPoints } from '../../shared/progress';
import { ChartMarker, ProgressLineChart } from '../../shared/progressChart';
import { EmptyState, Field, Page } from '../../shared/ui';
import { positiveNumber } from '../../shared/validation';

export function Progress({ data }: { data: PlannerData }) {
  const [date, setDate] = useState(localDate());
  const [weight, setWeight] = useState('');
  const [message, setMessage] = useState('');
  const weights = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));
  const performancePoints = getProgressPoints(data.records);

  async function saveWeight(event: FormEvent) {
    event.preventDefault();
    if (!dateIsValid(date) || !positiveNumber(weight)) {
      setMessage('Enter a valid date and a positive weight.');
      return;
    }

    const existing = data.weights.find((item) => item.date === date);
    const record: BodyWeightRecord = {
      date,
      weightKg: Number(weight),
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
      revision: (existing?.revision ?? 0) + 1,
    };

    try {
      await saveBodyWeight(record);
      setWeight('');
      setMessage(existing ? 'Measurement updated.' : 'Measurement saved.');
    } catch {
      setMessage('Could not save this measurement. Try again.');
    }
  }

  async function removeWeight(item: BodyWeightRecord) {
    try {
      await deleteBodyWeight(item.date);
    } catch {
      setMessage('Could not delete this measurement. Try again.');
    }
  }

  return (
    <Page title="Progress" subtitle="Notice the trend. Keep the pressure low." action={<Link className="button primary" to="/plans/new"><Plus size={17} /> New plan</Link>}>
      <div className="progress-grid">
        <section className="chart-card">
          <div className="section-heading"><div><p className="eyebrow">Body weight</p><h2>Measurements over time</h2></div><span className="unit-label">kg</span></div>
          {weights.length === 0 ? <EmptyState compact icon={<TrendingUp size={21} />} title="Your trend starts with one point" body="Add a dated measurement when it’s useful to you." /> : <WeightChart weights={weights} />}
          <div className="data-table-wrap"><table className="data-table"><caption className="sr-only">Body weight records</caption><thead><tr><th>Date</th><th>Weight</th><th /></tr></thead><tbody>{weights.slice().reverse().map((item) => <tr key={item.date}><td>{formatShortDate(item.date)}</td><td><strong>{item.weightKg} kg</strong></td><td><button className="icon-button danger" onClick={() => removeWeight(item)} aria-label={`Delete weight record from ${item.date}`}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
        </section>
        <aside className="progress-side">
          <form className="side-card weight-form" onSubmit={saveWeight}>
            <div className="section-heading"><div><p className="eyebrow">Quick entry</p><h3>Log body weight</h3></div><HeartPulse size={18} /></div>
            <Field label="Date"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
            <Field label="Weight" suffix="kg"><input type="number" min="1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="70.0" /></Field>
            {message && <p className="save-message" role="status">{message}</p>}
            <button className="button primary full-width">Save measurement</button>
            <p className="fine-print">One observation per date. Saving the same date updates it.</p>
          </form>
        </aside>
      </div>
      <section className="history-section">
        <div className="section-heading"><div><p className="eyebrow">Workout history</p><h2>Sessions you’ve recorded</h2></div><Link className="text-link" to="/progress">{data.records.length} records <ArrowRight size={15} /></Link></div>
        {data.records.length === 0 ? <EmptyState compact icon={<Dumbbell size={21} />} title="No workout records yet" body="Complete or save a session to see it here." /> : <div className="history-list">{data.records.map((record) => <Link key={record.id} to={`/history/${record.id}`} className="history-row"><span className={`history-icon ${record.status}`}>{record.status === 'completed' ? <Check size={16} /> : <Clock3 size={16} />}</span><span><strong>{record.planSnapshot.name}</strong><small>{formatShortDate(record.sessionDate)} · {record.sets.length ? `${record.sets.length} set entries` : 'No performance details'}</small></span><span className="status-text">{record.status === 'completed' ? 'Completed' : 'In progress'}</span><ArrowRight size={16} /></Link>)}</div>}
      </section>
      <section className="performance-section">
        <div className="section-heading"><div><p className="eyebrow">Performance</p><h2>Recorded exercise details</h2></div><BarChart3 size={19} /></div>
        {performancePoints.length ? <div className="performance-chart"><div className="section-heading"><div><p className="eyebrow">Session trend</p><h3>Progress toward each target</h3></div><span className="unit-label">%</span></div><ProgressLineChart points={performancePoints} ariaLabel="Workout performance trend" /></div> : null}
        <PerformanceTable records={data.records} />
      </section>
    </Page>
  );
}

function WeightChart({ weights }: { weights: BodyWeightRecord[] }) {
  const min = Math.min(...weights.map((item) => item.weightKg));
  const max = Math.max(...weights.map((item) => item.weightKg));
  const spread = Math.max(1, max - min);
  const chartPoints = weights.map((item, index) => pointForWeight(item.weightKg, index, weights.length, min, spread));
  const points = chartPoints.join(' ');

  return (
    <div className="chart-wrap">
      <div className="chart-stage">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Body weight trend from ${weights[0].weightKg} to ${weights[weights.length - 1].weightKg} kilograms`}
        >
          <path className="chart-gridline" d="M8 24 H92 M8 55 H92 M8 86 H92" />
          <polyline className="chart-line" points={points} />
        </svg>
        <div className="chart-markers">
          {weights.map((item, index) => {
            const [x, y] = chartPoints[index].split(',');

            return (
              <ChartMarker
                detail={`${item.weightKg} kg`}
                key={item.date}
                label={formatShortDate(item.date)}
                x={Number(x)}
                y={Number(y)}
              />
            );
          })}
        </div>
      </div>
      <div className="chart-labels">
        <span>{formatShortDate(weights[0].date)}</span>
        <strong>{weights[weights.length - 1].weightKg} kg</strong>
        <span>{formatShortDate(weights[weights.length - 1].date)}</span>
      </div>
    </div>
  );
}

function pointForWeight(weight: number, index: number, count: number, min: number, spread: number): string {
  const x = count === 1 ? 50 : 8 + (index / (count - 1)) * 84;
  const y = 86 - ((weight - min) / spread) * 62;
  return `${x},${y}`;
}

function PerformanceTable({ records }: { records: WorkoutRecord[] }) {
  const entries = records.flatMap((record) => record.sets.map((set) => {
    const prescription = record.planSnapshot.prescriptions.find((item) => item.id === set.prescriptionId);
    const exercise = record.planSnapshot.exercises.find((item) => item.id === prescription?.exerciseId);
    return { id: `${record.id}-${set.prescriptionId}-${set.setNumber}`, date: record.sessionDate, exercise: exercise?.name ?? 'Exercise', value: set.actualReps ?? set.actualDurationSeconds, unit: set.actualReps !== null ? 'reps' : 'sec', load: set.loadKg, rir: set.rir };
  })).filter((entry) => entry.value !== null);

  if (!entries.length) return <EmptyState compact icon={<BarChart3 size={21} />} title="No set details recorded yet" body="When you add actual reps, duration, or weight/resistance, those observations will show here." />;
  return <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Exercise</th><th>Result</th><th>Weight/resistance</th><th title="RIR means reps in reserve: how many more good-form reps you could have done">RIR (reps left)</th></tr></thead><tbody>{entries.slice(0, 12).map((entry) => <tr key={entry.id}><td>{formatShortDate(entry.date)}</td><td><strong>{entry.exercise}</strong></td><td>{entry.value} {entry.unit}</td><td>{entry.load === null ? 'Unknown' : `${entry.load} kg`}</td><td>{entry.rir === null || entry.rir === undefined ? '—' : entry.rir}</td></tr>)}</tbody></table></div>;
}
