# Gamification and streaks

Status: implemented 2026-09-13. This document defines the shipped first increment. See [PRD](prd.md), [TRD](trd.md), and [domain context](../CONTEXT.md).

## Product direction

Make returning to workouts feel rewarding through visible consistency, achievable milestones, and encouraging feedback. Keep workouts and Programs central: rewards appear around existing completion and Progress flows, without a separate game screen or extra steps before exercising.

Use a weekly consistency streak instead of requiring daily exercise. Completing at least one workout in a calendar week keeps the streak going; this is a product engagement rule, not a recommended training frequency. Rest days have no penalty. Higher loads, harder intensity, more sets, shorter rest, weight loss, and calorie targets never earn extra rewards.

## First version

| Content | Placement | Behavior |
| --- | --- | --- |
| Weekly streak | Today dashboard | Current consecutive active weeks, best streak, and whether this week is active or pending. |
| This week | Dashboard consistency card | Monday–Sunday markers for workout days, with a completed-day count and one weekly prompt. |
| Milestones | Progress, below the main workout summary | Earned badges and the next milestone with its exact requirement and progress. |
| Completion feedback | Standard session and Live Tracking completion | A warm celebration modal appears when a weekly streak activates or a badge is newly earned; routine completions use a brief snackbar. |
| Activity history | Progress | Last 12 weeks of workout-day markers, with dates and text equivalents. |

No new navigation item is needed. The dashboard's selected schedule date does not change the consistency card: it always describes the actual current week and labels its date range.

## Counting and streak rules

**Qualifying completion:** a persisted Workout Record with status `completed` and a valid `sessionDate` no later than today's local date. Actual set details are optional, matching the current completion flow. In-progress saves, creating plans or Programs, opening Live Tracking, completing an individual exercise, and skipping a rest timer do not qualify.

**Workout day:** a distinct qualifying `sessionDate` across every plan and Program. Two workouts on one date count as one day for gamification. This keeps repeated saves or multiple plans from multiplying rewards. Normal workout history can still show every session.

**Active week:** a Monday–Sunday calendar week containing at least one workout day. Use calendar dates, not rolling seven-day or 168-hour windows. Week identity is the date of its Monday, including at year boundaries.

**Current weekly streak:** if the current week is active, count consecutive active weeks ending this week. Otherwise count consecutive active weeks ending last week, and show the current week as pending. An unfinished week does not break the streak. If neither this week nor last week is active, current streak is zero. When an inactive week closes, it breaks the sequence; a later active week starts a new streak of one.

**Best weekly streak:** the longest consecutive sequence of active weeks in qualifying history. With no qualifying history, both streak counts are zero.

**Date authority:** use `sessionDate`, not `completedAt`, for attribution. A workout logged late belongs to its recorded date. Existing future-dated completed records are excluded until their date arrives. Changing timezone does not reinterpret stored date strings; local today controls which dates qualify. Recompute on local date rollover, tab focus, and history changes.

**Corrections:** late entries can restore a historical streak. Deleting a record or changing it back to in-progress recomputes days, streaks, and badges. If another completion remains on the same date, that workout day remains. Deleting a source plan or Program does not remove rewards supported by retained workout records. Changing a plan schedule or Program membership does not rewrite past rewards.

**Existing users:** derive results from all qualifying saved history when the feature first appears. Show existing earned badges without replaying old celebrations. Clearing all local data removes the underlying history and therefore resets gamification.

## Milestone content

Badges are derived from history, not permanently awarded balances. If supporting history is removed, a badge can become locked again; the badge section explains that milestones reflect saved history. Achievement dates are the earliest qualifying workout date on which the threshold was reached, recomputed after corrections.

| Stable badge ID | Display name | Requirement |
| --- | --- | --- |
| first-workout-day | First step | 1 distinct workout day |
| workout-days-10 | Finding your rhythm | 10 distinct workout days |
| workout-days-25 | Showing up | 25 distinct workout days |
| workout-days-50 | A habit in motion | 50 distinct workout days |
| workout-days-100 | One hundred days | 100 distinct workout days |
| active-weeks-4 | Four weeks of consistency | Best weekly streak of at least 4 |
| active-weeks-8 | Building consistency | Best weekly streak of at least 8 |
| active-weeks-12 | Twelve weeks strong | Best weekly streak of at least 12 |

Show progress such as “7 / 10 workout days” and “3 / 4 consecutive active weeks.” Streak badge progress uses the best streak, matching the unlock rule; current streak is shown separately. Badges measure recorded participation, not strength, fitness level, or workout quality.

## Copy and interaction

- Empty history: “Your first workout starts your story.” Link to existing workout plans; use the existing create-plan action if none exist.
- Current week pending: “A new week, a fresh opportunity.” Supporting text: “Complete a workout this week to continue your weekly streak.”
- Current week active: “This week counts. Make room for recovery, too.” Do not prompt another workout purely to earn more points.
- New streak week: “3 active weeks in a row.”
- Milestone unlocked: “Finding your rhythm — 10 workout days recorded.”
- After a break: “Welcome back. Start a new chapter this week.” Best streak and supported lifetime milestones remain visible.

Use a small progress fill, badge reveal, or warm celebration modal once after a new qualifying save that activates a streak or crosses a badge threshold. Routine completions use a snackbar. Do not interrupt exercise/rest transitions with celebrations, auto-open a celebration during an active tracking step, play sound, or announce every timer tick. Respect reduced motion, provide readable text for every status, and never rely on color alone. Avoid guilt, countdowns threatening a lost streak, and comparisons with other people.

## Technical implementation plan

Derive a shared summary from existing Workout Records and an explicitly supplied local `today`: qualifying days, active week starts, current/best streak, milestone progress and achievement dates. Keep date calculations deterministic and independent of the selected dashboard date. Validate date strings and use calendar arithmetic that handles DST, leap days, and year boundaries.

The first version requires no new database table, stored streak counter, reward ledger, or schema migration. Dashboard and Progress consume the same calculation. Both completion paths must use consistent qualification and feedback rules. Currently standard Session and Live Tracking save independently; implementation must cover both paths explicitly.

Compare summaries immediately before and after a successful completion save to determine newly crossed thresholds. Newly activated weekly streaks and newly earned badges open one combined celebration modal; routine completions use a snackbar. Repeated saves of the same day, reopening a completed session, rendering the dashboard, or reloading must not replay rewards. A failed save awards nothing and preserves entries for retry. A late log may produce one combined celebration for newly reached milestones. Re-earning after explicitly deleting supporting history may celebrate again; no permanent award ledger is planned.

Calculations read retained snapshots/records and must not require the current plan to exist. No reward logic changes prescriptions, estimates, intensity recommendations, or session schedules. Remain entirely local with the app's existing storage limitations.

## Acceptance examples for implementation

| Scenario | Expected result |
| --- | --- |
| No history; save in-progress | Zero days, zero streak, no badge. |
| First completed workout with blank set fields | One workout day, streak one, First step unlocked. |
| Complete two plans on the same date; save either again | Still one workout day; no repeated day/streak reward. |
| Active weeks start Aug 31 and Sep 7, 2026; today Sep 14 with no workout yet | Current streak two, this week pending, best two. |
| Same history; today Sep 21 with no Sep 14-week completion | Current streak zero, best two. |
| Add a late completion dated Sep 16 on Sep 21 | Current streak three ending last week; this week pending. |
| Complete Sep 21 after the previous example | Current and best streak four; four-week badge unlocks. |
| Delete the only completion supporting a middle week | Recalculate both streaks and any badges that depended on them. |
| Delete a plan but retain its completed records | Qualifying days and badges remain. |
| A completion is dated tomorrow | Excluded today; included when local today reaches that date, without a save celebration. |
| Standard logging versus Live Tracking Finish workout | Equivalent qualifying records yield identical summaries. |
| Save fails, page reloads, or a completed session is reopened | No new completion celebration. |
| Week spans December/January or a DST change | Calendar week membership stays correct. |

Before shipping, cover the counting rules with focused domain tests and verify dashboard, both completion flows, history deletion, narrow screens, and reduced-motion feedback in a browser. Check a save while midnight passes and returning to an open tab in a new week.

## Later possibilities, outside the first version

Personal weekly targets could follow once target changes, effective dates, and missed-week behavior are specified. XP, levels, cosmetic unlocks, customizable challenges, and Program-specific milestones are deferred until they add value beyond the first badges. Program completion rewards require a definition of a Program cycle and historical membership; today's mutable membership list is insufficient.

Daily exercise streaks, leaderboards, paid streak repairs, reward multipliers for intensity, and rewards for skipping rest are outside this proposal. No notifications, accounts, cloud sync, or analytics are added.
