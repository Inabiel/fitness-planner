# Form Fitness Planner — Domain Context

This is a browser-only personal fitness planner. One person keeps a fitness profile, creates reusable one-workout plans, follows dated sessions, records optional results, and reviews progress. The current implementation is local-first: data is stored in this browser with IndexedDB and is not sent to an application server.

This file owns the project vocabulary. The current implementation snapshot below is intentionally included so product and engineering discussions stay aligned.

## Current implementation snapshot

- React 19 + TypeScript + Vite client application.
- React Router `HashRouter`; routes work from a static host without server rewrites.
- Dexie-backed IndexedDB database named `form-fitness-planner`.
- One singleton profile, saved plans, workout records, and body-weight records.
- 32 built-in Exercises: 24 strength-oriented entries and 8 aerobic entries.
- Local focus illustrations for body areas, splits, and aerobic focus.
- Four-step onboarding and profile editing with a final confirmation modal.
- Six Workout Presets, paginated/searchable/filterable Exercise Library, and persisted Custom Exercise Order.
- Four target intensity levels that shape generated prescriptions and can advance after repeated above-target recurring sessions.
- Dated session logging with optional reps/duration, load, and RIR per set.
- Dashboard schedule browsing for the selected date, nearest earlier occurrences, nearest upcoming occurrences, and direct specific-date navigation.
- Simple two-session progression guidance that can adjust the next prescription.
- Body-weight and session-performance trend graphs, with exact tables retained for detail.
- WhatsApp-friendly plan text copy with optional exercise steps and snackbar feedback for transient actions.
- Plan deletion preserves historical Workout Records. Profile settings can clear all local data and reload onboarding.

## Profile and goals

**Fitness Profile**  
Personal information, body measurements, activity level, goals, training experience, and the revision metadata used by estimates and suggestions.

**Fitness Goal**  
A desired outcome: lose fat, build muscle, maintain weight, or improve general fitness. The profile stores one Primary Fitness Goal and optional Secondary Goals.

**Primary Fitness Goal**  
The single goal used by the current nutrition estimate. Secondary goals are supporting context and do not change the calculation.

**BMI Estimate**  
Body weight divided by height squared in metres. It is displayed separately from nutrition targets and is not treated as a goal or diagnosis.

**Daily Nutrition Targets**  
Estimated calories and protein, carbohydrate, and fat grams for a day. The current implementation uses a Mifflin–St Jeor-style BMR, activity multipliers, fixed goal adjustments, and macro heuristics. These are product heuristics, not medical advice.

## Workouts

**Exercise**  
A static entry in the Exercise Library with a stable ID, name, written instructions, `doseKind` (`reps` or `duration`), primary and optional secondary Worked Areas, optional equipment, optional aerobic classification, curated popularity rank, and a media placeholder label.

**Exercise Media**  
The intended demonstration slot for an Exercise. The current library does not ship GIF/video demonstrations; the UI deliberately shows a reviewed-content placeholder while written instructions remain available.

**Exercise Library**  
The read-only built-in collection in `src/data/exercises.ts`. It is not a user-editable catalog. The plan editor supports search, area/aerobic filtering, pagination of six entries per page, popularity/name/area sorting, and the persisted custom order.

**Popularity Rank**  
A curated static ordering, not a usage metric. Lower ranks appear first in the default library order and break recommendation ties.

**Custom Exercise Order**  
A profile-level ordering of known built-in exercise IDs. It is edited from the Exercise order sidebar screen with arrows or drag-and-drop, then used when the plan editor chooses Custom order. It affects future library browsing and does not reorder existing plans or records.

**Exercise Prescription**  
One exercise’s planned dose inside a Workout Plan: positive sets, reps or duration, rest seconds, optional coaching notes, optional recommended load, and optional target RIR. Each prescription has its own ID, so a plan can technically contain the same exercise more than once.

**Recommended Prescription**  
The current suggested next dose for an Exercise Prescription. It includes sets, dose, rest, recommended load, notes, and target RIR where applicable. Recommendations are editable guidance, not requirements.

**Rep in Reserve (RIR)**  
The optional estimate of how many more repetitions could have been completed after a set. The current burden heuristic treats RIR 0–1 as a burden signal for rep-based work.

**Workout Preset**  
A selectable template that replaces the current exercise selection and applies an effort profile to the confirmed Workout Focus. Current presets are Easy One, Strength Base, Muscle Builder, Machine Circuit, Quick Sweat, and Aerobic Flow.

**Target Intensity**  
The desired exertion profile for a Workout Plan: Easy, Moderate, Hard, or Very hard. It shapes generated sets, dose, rest, and target RIR; it is a relative planning target, not a medical or one-repetition-maximum measurement.

**Achieved Intensity**  
The latest logged recurring session’s measured result against the plan’s Target Intensity. It is reported as below target, on target, or above target when enough actual dose or RIR data is recorded. Two consecutive above-target sessions can advance the plan’s Target Intensity by one level.

**Workout Session**  
A dated use of a Workout Plan. The current implementation stores the first explicit save or completion as a Workout Record rather than materializing an infinite recurrence series.

**Workout Record**  
The persisted record for a dated session. It stores status (`in_progress` or `completed`), completion time, revision, actual Set Records, and a snapshot of the plan and exercise metadata used at that time.

**Set Record**  
One optional actual observation tied to a snapshot prescription and set number. Reps or duration, load in kilograms, and RIR are independent fields. Blank values remain unknown; they are not copied from the prescription or converted to zero.

**Body Weight Record**  
A dated body-weight observation stored separately from the profile’s current weight. One record per date is supported; saving the same date updates it, and the Progress screen can delete it.

**Session Progress**
The rounded percentage of planned reps or duration completed in a completed session. 100% means the planned dose was completed. The Progress screen shows the overall latest-eight-session trend, and recurring plan detail shows the same metric for that plan; load and RIR remain separate recorded observations.

## Focus and areas

**Workout Focus**  
The confirmed intention for a plan. The current union supports body-part focus (`chest`, `back`, `shoulders`, `arms`, `legs`, `glutes`, `core`, `full-body`), training split (`push`, `pull`, `upper-body`, `lower-body`), and aerobic style (`aerobic`).

**Target Area**  
A body-part focus category. Full body is a supported focus category, not a literal anatomical area.

**Workout Split**  
A multi-area focus grouped by training pattern. Current splits are Push, Pull, Upper body, and Lower body.

**Primary Target Area**  
The compatibility field retained on plans and snapshots. For a body-part focus it matches that focus; for splits and aerobic focus it is mapped to a representative area (chest, back, legs, or legs respectively). It is not a claim that one area receives the most physiological work.

**Worked Area**  
An area affected by an Exercise. Primary and secondary labels describe library metadata, not intensity, percentage contribution, or proof of activation.

**Area Suggestion**  
A deterministic editable suggestion based on the profile’s Primary Fitness Goal and training experience. It does not use progress history. The person must confirm or replace it before saving a plan.

## Scheduling and progression

**Plan Schedule**  
Either one calendar date or a recurring weekday with a local `startsOn` date. Recurring occurrences are derived when displayed; completion of one occurrence does not complete later occurrences. The dashboard can show the selected date plus up to three nearest occurrences before and after it, and each occurrence opens its exact dated session.

**Burden Signal**  
Current evidence that a recent logged prescription may have been too difficult: any observed dose at or below 80% of target, a first-to-last-set drop-off of at least `max(2, 25% of target)`, or RIR 0–1. The algorithm evaluates the two most recent completed sessions that have logged dose values.

**Progression Recommendation**  
After two comparable completed sessions, repeated burden signals reduce the next load by about 10% when a load exists, reduce the dose by one rep or five seconds otherwise, and add 30 seconds of rest up to 180 seconds. Repeated above-target dose increases load by about 5% or adds one rep/five seconds. Mixed evidence holds the current prescription. Historical snapshots are never rewritten.

## Boundaries and non-goals

- There are no accounts, authentication, server APIs, cloud sync, or cross-device recovery.
- Custom exercises and custom media are not supported.
- The app does not yet ship reviewed GIF/video demonstrations or attribution metadata.
- Weekly multi-day program grouping is not modeled; a plan is one repeatable workout.
- The current local database has one schema version and does not yet perform runtime validation or stale-tab conflict detection.
