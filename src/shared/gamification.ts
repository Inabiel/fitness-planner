import { dateIsValid, localDate, weekdayFor, type WorkoutRecord } from '../domain';

export type GamificationWeekState = 'new' | 'active' | 'pending' | 'broken';

export interface GamificationDay {
  date: string;
  completed: boolean;
}

export interface GamificationWeek {
  start: string;
  days: GamificationDay[];
  workoutDayCount: number;
  active: boolean;
}

export interface GamificationBadgeSummary {
  id: string;
  name: string;
  requirement: string;
  metric: 'workout-days' | 'active-weeks';
  threshold: number;
  progress: number;
  earned: boolean;
  achievementDate?: string;
}

export interface GamificationSummary {
  today: string;
  workoutDays: string[];
  activeWeeks: string[];
  currentWeekStart: string;
  currentWeekState: GamificationWeekState;
  currentStreak: number;
  bestStreak: number;
  currentWeek: GamificationWeek;
  weeks: GamificationWeek[];
  badges: GamificationBadgeSummary[];
}

export interface GamificationCelebration {
  title: string;
  message: string;
  streak?: number;
  badgeNames: string[];
  badgeRequirement?: string;
}

const BADGES = [
  { id: 'first-workout-day', name: 'First step', threshold: 1, metric: 'workout-days' as const, requirement: '1 workout day' },
  { id: 'workout-days-10', name: 'Finding your rhythm', threshold: 10, metric: 'workout-days' as const, requirement: '10 workout days' },
  { id: 'workout-days-25', name: 'Showing up', threshold: 25, metric: 'workout-days' as const, requirement: '25 workout days' },
  { id: 'workout-days-50', name: 'A habit in motion', threshold: 50, metric: 'workout-days' as const, requirement: '50 workout days' },
  { id: 'workout-days-100', name: 'One hundred days', threshold: 100, metric: 'workout-days' as const, requirement: '100 workout days' },
  { id: 'active-weeks-4', name: 'Four weeks of consistency', threshold: 4, metric: 'active-weeks' as const, requirement: '4 active weeks in a row' },
  { id: 'active-weeks-8', name: 'Building consistency', threshold: 8, metric: 'active-weeks' as const, requirement: '8 active weeks in a row' },
  { id: 'active-weeks-12', name: 'Twelve weeks strong', threshold: 12, metric: 'active-weeks' as const, requirement: '12 active weeks in a row' },
] as const;

export function getGamificationSummary(records: WorkoutRecord[], requestedToday: string = localDate()): GamificationSummary {
  const today = dateIsValid(requestedToday) ? requestedToday : localDate();
  const workoutDays = [...new Set(records
    .filter((record) => record.status === 'completed' && dateIsValid(record.sessionDate) && record.sessionDate <= today)
    .map((record) => record.sessionDate))].sort();
  const activeWeeks = [...new Set(workoutDays.map(weekStart))].sort();
  const streaks = getStreaks(activeWeeks);
  const currentWeekStart = weekStart(today);
  const previousWeekStart = shiftDate(currentWeekStart, -7);
  const currentWeekState: GamificationWeekState = activeWeeks.includes(currentWeekStart)
    ? 'active'
    : activeWeeks.includes(previousWeekStart)
      ? 'pending'
      : workoutDays.length
        ? 'broken'
        : 'new';
  const streakAnchor = currentWeekState === 'active' ? currentWeekStart : currentWeekState === 'pending' ? previousWeekStart : null;
  const currentStreak = streakAnchor ? streaks.byWeek.get(streakAnchor) ?? 0 : 0;
  const weeks = Array.from({ length: 12 }, (_, index) => makeWeek(shiftDate(currentWeekStart, (index - 11) * 7), workoutDays));

  return {
    today,
    workoutDays,
    activeWeeks,
    currentWeekStart,
    currentWeekState,
    currentStreak,
    bestStreak: streaks.best,
    currentWeek: weeks[11],
    weeks,
    badges: BADGES.map((badge) => {
      const progress = badge.metric === 'workout-days' ? workoutDays.length : streaks.best;
      const achievementDate = badge.metric === 'workout-days'
        ? workoutDays[badge.threshold - 1]
        : workoutDays.find((date) => (streaks.byWeek.get(weekStart(date)) ?? 0) >= badge.threshold);
      return { ...badge, progress, earned: progress >= badge.threshold, achievementDate };
    }),
  };
}

export function getGamificationCelebration(before: GamificationSummary, after: GamificationSummary): GamificationCelebration | null {
  const newBadges = newlyEarnedBadges(before, after);
  const streakActivated = after.currentWeekState === 'active' && before.currentWeekState !== 'active';
  if (!newBadges.length && !streakActivated) return null;

  const badge = newBadges[0];
  return {
    title: streakActivated ? 'Your streak is on fire!' : 'Milestone unlocked!',
    message: streakActivated
      ? after.currentStreak > 1 ? `${after.currentStreak} active weeks in a row.` : 'Your weekly streak is live.'
      : `${badge.name} is now yours.`,
    streak: after.currentWeekState === 'active' ? after.currentStreak : undefined,
    badgeNames: newBadges.map((item) => item.name),
    badgeRequirement: badge?.requirement,
  };
}

export function getGamificationFeedback(before: GamificationSummary, after: GamificationSummary): string | null {
  const newBadges = newlyEarnedBadges(before, after);
  if (!newBadges.length && after.workoutDays.length === before.workoutDays.length) return null;
  if (newBadges.length === 1) {
    const badge = newBadges[0];
    return `Milestone unlocked: ${badge.name} — ${badge.requirement} recorded.`;
  }
  if (newBadges.length > 1) return `Milestones unlocked: ${newBadges.map((badge) => badge.name).join(', ')}.`;
  if (after.currentWeekState === 'active' && before.currentWeekState !== 'active') {
    if (before.currentWeekState === 'broken') return 'Welcome back. Start a new chapter this week.';
    if (after.currentStreak > 1) return `${after.currentStreak} active weeks in a row.`;
  }
  return 'Workout complete. This week counts.';
}

function newlyEarnedBadges(before: GamificationSummary, after: GamificationSummary): GamificationBadgeSummary[] {
  return after.badges.filter((badge) => badge.earned && !before.badges.some((previous) => previous.id === badge.id && previous.earned));
}

function makeWeek(start: string, workoutDays: string[]): GamificationWeek {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(start, index);
    return { date, completed: workoutDays.includes(date) };
  });
  const workoutDayCount = days.filter((day) => day.completed).length;
  return { start, days, workoutDayCount, active: workoutDayCount > 0 };
}

function getStreaks(activeWeeks: string[]): { byWeek: Map<string, number>; best: number } {
  const byWeek = new Map<string, number>();
  let best = 0;
  activeWeeks.forEach((week, index) => {
    const previous = activeWeeks[index - 1];
    const streak = previous && shiftDate(previous, 7) === week ? (byWeek.get(previous) ?? 0) + 1 : 1;
    byWeek.set(week, streak);
    best = Math.max(best, streak);
  });
  return { byWeek, best };
}

function weekStart(date: string): string {
  return shiftDate(date, 1 - weekdayFor(date));
}

function shiftDate(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  return localDate(new Date(year, month - 1, day + days));
}
