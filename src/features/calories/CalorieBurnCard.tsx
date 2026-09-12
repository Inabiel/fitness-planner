import { Flame } from 'lucide-react';
import type { CalorieBurnSummary } from '../../shared/calorieBurn';

const numberFormatter = new Intl.NumberFormat();

export function CalorieBurnCard({ summary }: { summary: CalorieBurnSummary }) {
  return (
    <section className="side-card calorie-burn-card">
      <div className="section-heading"><div><p className="eyebrow">Energy burned</p><h3>Keep the fire moving</h3></div><span className="calorie-burn-icon"><Flame size={18} fill="currentColor" /></span></div>
      <div className="calorie-burn-today"><strong>{formatCalories(summary.today)}</strong><span>estimated kcal today</span></div>
      <div className="calorie-burn-periods"><Period label="This week" value={summary.week} /><Period label="This month" value={summary.month} /><Period label="This year" value={summary.year} /><Period label="All time" value={summary.overall} /></div>
      <p className="fine-print">Estimated from completed workouts, target intensity, plan duration, and body weight. This is not a wearable measurement.</p>
    </section>
  );
}

function Period({ label, value }: { label: string; value: number }) {
  return <div><strong>{formatCalories(value)}</strong><span>{label}</span></div>;
}

function formatCalories(value: number): string {
  return numberFormatter.format(value);
}
