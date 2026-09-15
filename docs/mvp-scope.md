# fitnessPal — Implemented MVP Scope

Status: current implementation baseline, 2026-09-15. Vocabulary is defined in [CONTEXT.md](../CONTEXT.md); technical details are in [TRD](trd.md).

## Product promise

An individual can complete onboarding, create a focused workout plan, schedule it, follow a dated occurrence, optionally record performance, and see the same local data after a reload. The application is intentionally browser-only and private by default.

## Shipped profile flow

- Four-step onboarding UI: Baseline, Context, Goals, and Review.
- Required fields: name, age, sex, height in cm, body weight in kg, activity level, training experience, and one Primary Fitness Goal.
- Optional Secondary Goals cannot duplicate the primary goal.
- Onboarding and profile settings share the same supported ranges: ages 13–100, height 100–250 cm, and weight 30–300 kg.
- Review has a final custom modal confirmation. Existing-profile edits preserve the profile’s exercise order and explicitly leave saved plan estimates unchanged.
- Profile settings include an explicit Delete all local data action. Confirmation uses a modal; successful deletion clears all five stores and reloads onboarding.

## Estimates

The app shows BMI separately from daily calorie and macro estimates. Current rules in `src/domain.ts` are:

- Mifflin–St Jeor-style BMR with sex constants `+5` and `-161`.
- Activity factors from 1.2 to 1.9.
- Goal adjustments of −300, +250, 0, or +100 kcal.
- A 1,200 kcal floor and calorie rounding to the nearest 50.
- Protein at 1.8 g/kg for muscle gain and 1.6 g/kg otherwise.
- Fat at 0.8 g/kg; carbohydrate fills remaining calories.

These values are implemented heuristics with rule version `MVP-2026.1`. The How it works page documents the formulas, constants, terms, source links, and safety boundaries; the standalone calculator exposes the same estimate rules without saving data. They still require qualified health review before being presented as production-grade personalized guidance.

## Workout energy tracking

The Dashboard shows estimated active calories from completed Workout Records for today, the current Monday–Sunday week, the current calendar month, the current calendar year, and all retained history. The estimate uses the saved plan snapshot’s work/rest duration, target intensity, and the latest body-weight record on or before each session date, falling back to the current profile weight. In-progress records and future-dated records are excluded. These are transparent product heuristics, not wearable measurements, medical guidance, or a calorie allowance.

## Shipped workout planning

- Create, view, edit, and delete one-workout Workout Plans.
- Create, view, edit, and delete Programs that contain an ordered list of existing Workout Plans.
- Optionally give a Program a moving-day rotation with a start date and interval; its ordered plans appear on successive rotation dates while fixed weekday plan schedules remain available when the rotation is off. Rolling programs can shift future occurrences after completion and mark every Nth rotation as a lighter deload.
- Select only unassigned plans when building a Program, remove or reorder selected plans, and create new plans from the Program flow with automatic assignment.
- Save a new plan and immediately start another one without leaving its Program context; the normal save returns to Program detail.
- The Program editor keeps already assigned plans out of the existing-plan chooser and offers a “Create a new plan here” action that returns to the Program after automatic assignment.
- The main New program action opens a modal for quick setup; creating a new plan from that modal hands off to the full plan editor.
- Plan detail offers Live Tracking in a modal with overall exercise progress, actual-set inputs, per-set notes, session-only exercise substitutions, a rest countdown, automatic advance to the next exercise, save-progress, and completion actions.
- Browse Plans and Programs separately on the Workout plans page; open a Program to reach each member plan’s existing detail screen.
- Deleting a Program keeps its Workout Plans and history; deleting a Workout Plan removes it from any Programs while preserving history.
- Confirm one Workout Focus: eight body-part categories, four training splits, or Aerobic.
- Show an optimized local focus illustration in intention preview, plan cards, and plan detail.
- Suggest a focus from goal and experience, with an editable explanation and explicit confirmation.
- Choose a recurring weekday or one calendar date for an individual plan; optionally choose a moving-day Program rotation that schedules its ordered plans every N days. The next occurrence can be skipped or moved without rewriting history.
- Browse the selected date, nearest earlier occurrences, and nearest upcoming occurrences from the dashboard. Previous/next day controls, a date picker, and a Today shortcut support specific-date workout lookup.
- Add at least one Exercise Prescription, reorder it, remove it, and edit sets, reps/duration, load, rest, and notes.
- Apply six focus-aware presets: Easy One, Strength Base, Muscle Builder, Machine Circuit, Quick Sweat, and Aerobic Flow.
- Choose Easy, Moderate, Hard, or Very hard target intensity; generated prescriptions adjust dose, rest, and target RIR.
- Optionally constrain new plan suggestions by available time and machine equipment; the same limits filter the exercise library.
- Copy a complete plan as text, with optional exercise steps, for use outside the local site.
- Entire plan cards navigate to plan details and include hover/focus treatment. Plan deletion confirms in a modal and leaves history intact.
- Plan cards show their assigned Program(s), or explicitly show when a plan is not assigned to a Program.

## Exercise Library

The static library currently contains 46 entries: 38 strength-oriented entries and 8 aerobic entries. Entries cover free weights, bodyweight, cable/machine movements, and common cardio equipment such as treadmill, bike, elliptical, rower, stair climber, jump rope, and swimming.

The plan editor provides:

- Search by exercise name, equipment, or type.
- Filters for All, Aerobic, and body areas.
- Six entries per page with pagination.
- Most popular, name A–Z, name Z–A, body-part, and Custom order sorting.
- A visible equipment label for machine-specific exercises.

Every exercise includes a local four-frame looping GIF demonstration using the grayscale-and-orange visual language of the body-area artwork. Written instructions remain available; the generated visuals are not expert-reviewed movement guidance.

## Sessions, logging, and progression

- Open a dated session from the dashboard, plan detail, or history flow.
- Save an in-progress session or mark it complete without entering performance details. Session-only exercise substitutions and per-set notes are preserved in the record snapshot.
- Delete a saved workout record from the session or history detail view.
- Log actual reps or duration, load in kg, optional RIR, and optional notes for each set.
- Preserve the plan and exercise snapshot inside the Workout Record.
- Use the two most recent completed sessions with dose observations to show No result, Trend building, Increase effort, Decrease effort, or Hold effort on plan detail.
- On completion, repeated increase/decrease signals adjust the next plan prescription while keeping historical records unchanged.
- For recurring plans, two consecutive above-target sessions advance target intensity by one level, capped at Very hard.

## Progress and history

- Add, update, and delete one dated body-weight record per date.
- Display a simple SVG body-weight trend and accessible data table.
- Display a body-weight trend, an overall session-performance trend, and an accessible performance table capped to the first 12 recorded entries for compactness.
- Open historical records by record ID even when the source plan has been deleted.
- Delete an individual saved workout record without deleting its source plan or other records.
- Show weekly consistency streaks, best streak, current-week workout markers, and encouraging weekly copy on Today.
- Derive workout-day milestone badges and a 12-week activity history on Progress from completed Workout Records.
- Show one celebration modal after a completed standard or Live Tracking save activates a weekly streak or earns a new badge; routine completions use a snackbar.
- Show derived personal records, current-versus-previous weekly work-set volume, 28-day schedule adherence, and primary muscle-balance signals on Progress.
- Export and import a versioned JSON backup from Profile settings to move all current local data between devices. Import validates, previews, confirms replacement, and restores the five local stores transactionally. This is a temporary bridge to remove when backend sync ships; merging is out of scope.

## Dashboard schedule browsing

The dashboard keeps a selected calendar date as the primary schedule view. It displays every plan occurring on that date, including completed state for that exact occurrence. It also displays up to three nearest scheduled occurrences before and after the selected date, sorted chronologically within their groups. One-time plans appear only on their configured date; recurring weekday plans resolve to their nearest valid local weekday occurrence after their `startsOn` date; plans in a moving-day Program resolve from the Program start, interval, and ordered plan IDs. Every displayed card links to the matching plan/date session route. A completion-driven Program rotation shifts future occurrences from the completed date; skipped and moved occurrences are excluded or replaced without changing historical records.

## Navigation and responsive behavior

Current hash routes:

| Route | Screen |
| --- | --- |
| `#/onboarding` | New or existing profile stepper |
| `#/` | Dashboard, selected-date schedule, and nearby occurrences |
| `#/plans` | Workout plan list and quick-create program modal |
| `#/plans/new` | Plan editor |
| `#/plans/:planId` | Plan detail, progress, effort guidance, and copy actions |
| `#/plans/:planId/edit` | Existing plan editor |
| `#/programs/new` | Program editor for naming and selecting existing plans |
| `#/programs/:programId` | Program detail with ordered member-plan cards |
| `#/programs/:programId/edit` | Existing program editor |
| `#/sessions/:planId/:date` | Dated session logger |
| `#/history/:recordId` | Historical session snapshot |
| `#/progress` | Weight, history, and performance |
| `#/exercise-order` | Custom exercise ordering |
| `#/about` | Calculation formulas, terms, sources, and safety boundaries |
| `#/calculate` | Temporary estimate calculator that does not change saved data |
| `#/profile` | Profile settings, temporary JSON data transfer, and data deletion |

Desktop uses a fixed sidebar. At widths up to 720px the sidebar becomes a slide-out drawer with a visible hamburger button, sticky mobile header, independent drawer scrolling, close button, and scrim. Mobile dialogs scroll from the top without hiding behind the header, account for safe-area insets, and keep long content within the viewport. Schedule cards wrap long content; very narrow plan cards stack their illustration, content, and actions. Hover transitions are reduced when the person prefers reduced motion.

## Local persistence

Dexie stores profiles, plans, programs, workout records, and body-weight records in IndexedDB. Live queries refresh the UI after writes. The database uses schema version 2; the migration adds the programs store. Clear-all-data is transactional across all five stores.

## Out of scope or not release-ready

- Accounts, cloud sync, installable PWA behavior, and custom exercises/media. The temporary JSON backup is manual transfer only and is not a sync implementation.
- Expert-reviewed exercise demonstrations, formal content approval/attribution metadata, and media retry behavior.
- Runtime validation of arbitrary persisted IndexedDB data, schema migrations, and stale-tab revision conflicts.
- Browser-level automated journeys and real-device mobile/accessibility verification. Source-level mobile fixes are implemented, but the full 320px–430px browser/device pass is still pending.
- Clinically reviewed nutrition rules or individualized health guidance.
