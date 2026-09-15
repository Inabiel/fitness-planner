import { Award, CalendarDays, Check, Flame, Sparkles } from 'lucide-react';
import type { GamificationCelebration, GamificationSummary, GamificationWeek } from '../../shared/gamification';
import { formatShortDate, weekdayLabel } from '../../shared/formatters';
import { Modal } from '../../shared/ui';

export function WeeklyConsistencyCard({ summary }: { summary: GamificationSummary }) {
  const copy = getWeeklyCopy(summary);
  const streakActive = summary.currentWeekState === 'active';
  return (
    <section className={`side-card gamification-card ${streakActive ? 'streak-active' : ''}`}>
      <div className="section-heading"><div><p className="eyebrow">Weekly consistency</p><h3>Keep the rhythm</h3></div><span className="gamification-icon"><Flame size={18} fill={streakActive ? 'currentColor' : 'none'} /></span></div>
      <p className="gamification-headline">{copy.headline}</p>
      <p className="muted gamification-supporting">{copy.supporting}</p>
      <div className="gamification-stats"><div className="gamification-streak-stat"><strong><Flame size={15} fill={streakActive ? 'currentColor' : 'none'} />{summary.currentStreak}</strong><span>current streak</span></div><div><strong>{summary.bestStreak}</strong><span>best streak</span></div><div><strong>{summary.currentWeek.workoutDayCount}</strong><span>days this week</span></div></div>
      <WeekMarkers week={summary.currentWeek} label="This week" />
    </section>
  );
}

export function GamificationCelebrationModal({ celebration, detail, onClose }: { celebration: GamificationCelebration; detail?: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop gamification-celebration-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Modal className="gamification-celebration-modal" labelledBy="gamification-celebration-title" describedBy="gamification-celebration-message" onClose={onClose}>
        <div className="gamification-celebration-icon"><Flame size={27} fill="currentColor" /></div>
        <p className="eyebrow">Consistency win</p>
        <h2 id="gamification-celebration-title">{celebration.title}</h2>
        <p id="gamification-celebration-message">{celebration.message}</p>
        {celebration.streak !== undefined && <div className="gamification-celebration-streak"><strong>{celebration.streak}</strong><span>{celebration.streak === 1 ? 'active week' : 'active weeks'} in a row</span></div>}
        {celebration.badgeNames.length > 0 && <div className="gamification-celebration-badge"><Sparkles size={18} /><span><strong>{celebration.badgeNames.join(', ')}</strong><small>{celebration.badgeRequirement ?? 'New milestone unlocked'}</small></span></div>}
        {detail && <p className="gamification-celebration-detail">{detail}</p>}
        <div className="modal-actions"><button type="button" className="button primary" onClick={onClose} autoFocus>Keep the momentum</button></div>
      </Modal>
    </div>
  );
}

export function GamificationProgress({ summary }: { summary: GamificationSummary }) {
  const earned = summary.badges.filter((badge) => badge.earned).length;
  return (
    <section className="gamification-progress">
      <div className="section-heading"><div><p className="eyebrow">Milestones</p><h2>Proof of showing up</h2></div><span className="unit-label">{earned} / {summary.badges.length} earned</span></div>
      <div className="gamification-badge-grid">{summary.badges.map((badge) => {
        const percentage = Math.min(100, (badge.progress / badge.threshold) * 100);
        const progressLabel = badge.earned ? `Earned ${formatShortDate(badge.achievementDate ?? summary.today)}` : `${Math.min(badge.progress, badge.threshold)} / ${badge.threshold} ${badge.metric === 'workout-days' ? 'days' : 'weeks'}`;
        return <article className={`gamification-badge ${badge.earned ? 'earned' : ''}`} key={badge.id}><span className="badge-icon">{badge.earned ? <Check size={16} /> : <Award size={17} />}</span><div><strong>{badge.name}</strong><small>{badge.requirement}</small><div className="badge-progress" role="progressbar" aria-label={`${badge.name} progress`} aria-valuemin={0} aria-valuemax={badge.threshold} aria-valuenow={Math.min(badge.progress, badge.threshold)}><span style={{ width: `${percentage}%` }} /></div><small className="badge-progress-label">{progressLabel}</small></div></article>;
      })}</div>
      <div className="gamification-history-heading"><div><p className="eyebrow">Consistency history</p><h3>Last 12 weeks</h3></div><CalendarDays size={18} /></div>
      <div className="gamification-history">{summary.weeks.map((week) => <div className={`gamification-history-row ${week.active ? 'active' : ''}`} key={week.start}><div><strong>{week.start === summary.currentWeekStart ? 'This week' : formatWeekRange(week)}</strong><small>{week.workoutDayCount} workout {week.workoutDayCount === 1 ? 'day' : 'days'}</small></div><WeekMarkers week={week} label={formatWeekRange(week)} /></div>)}</div>
      <p className="fine-print">Milestones use completed workout days, so rest days are part of the plan.</p>
    </section>
  );
}

function WeekMarkers({ week, label }: { week: GamificationWeek; label: string }) {
  return <div className="gamification-week"><span className="gamification-week-label">{label}</span><div className="gamification-week-days" role="list" aria-label={`${label} workout days`}>{week.days.map((day, index) => <span className={`gamification-day ${day.completed ? 'complete' : ''}`} key={day.date} role="listitem" title={`${weekdayLabel(index + 1)}, ${formatShortDate(day.date)}${day.completed ? ' · workout recorded' : ''}`} aria-label={`${weekdayLabel(index + 1)}, ${formatShortDate(day.date)}${day.completed ? ', workout recorded' : ', no workout recorded'}`}>{day.completed ? <Check size={12} /> : weekdayLabel(index + 1).slice(0, 1)}</span>)}</div></div>;
}

function formatWeekRange(week: GamificationWeek): string {
  return `${formatShortDate(week.start)} – ${formatShortDate(week.days[6].date)}`;
}

function getWeeklyCopy(summary: GamificationSummary): { headline: string; supporting: string } {
  if (!summary.workoutDays.length) return { headline: 'Your first workout starts your story.', supporting: 'Complete a workout to start your weekly streak.' };
  if (summary.currentWeekState === 'pending') return { headline: 'A new week, a fresh opportunity.', supporting: 'Complete a workout this week to continue your weekly streak.' };
  if (summary.currentWeekState === 'broken') return { headline: 'Welcome back. Start a new chapter this week.', supporting: 'A single completed workout is enough to begin again.' };
  return { headline: 'This week counts. Make room for recovery, too.', supporting: `${summary.currentWeek.workoutDayCount} workout ${summary.currentWeek.workoutDayCount === 1 ? 'day' : 'days'} recorded this week.` };
}
