# Product Requirements Document — Form Fitness Planner

Status: implemented MVP baseline with explicit release gaps. Last reconciled: 2026-09-12. The domain vocabulary lives in [CONTEXT.md](../CONTEXT.md), shipped boundaries are listed in [MVP scope](mvp-scope.md), and the implementation is described in [TRD](trd.md).

## Product purpose

Help one person create repeatable gym workouts, understand the intended focus, follow a dated session, optionally record what actually happened, and notice progress without an account or cloud service.

The current product is a local-first prototype. It is useful for planning and journaling, but nutrition calculations remain heuristics awaiting qualified health review and exercise demonstrations are not yet production-complete.

## Intended user and outcome

The intended user has access to a standard gym and wants a low-friction personal planner. The MVP outcome is achieved when the person can:

1. complete onboarding and see a profile-based estimate;
2. create, edit, schedule, and delete a focused workout plan;
3. choose from a searchable, sortable, paginated exercise library;
4. follow and log a dated workout session;
5. see historical snapshots survive plan changes;
6. track body weight and exercise observations locally after reload.
7. inspect how estimates are calculated or try a temporary estimate without changing saved data.

## Current user journey

1. First visit opens the four-step Baseline → Context → Goals → Review stepper.
2. The final action opens a custom confirmation modal before saving the profile.
3. The dashboard shows a selected calendar day, scheduled plans, nearest earlier and upcoming occurrences, daily nutrition estimates, BMI, quick log links, and recent context.
4. Plan creation starts with a focus-aware recommendation and supports body-part, split, and aerobic focus.
5. The person can apply a preset, edit the generated prescriptions, or add individual exercises from the library.
6. Plan detail shows the focus illustration, recurring performance trend, sequence, planned volume, saved estimate, effort guidance, logging entry point, copy actions, and delete action.
7. A dated session accepts optional actual dose, load, and RIR per set. Completion is always possible without performance input.
8. Progress and history show weight observations, recorded sessions, snapshots, and entered exercise results.
9. Profile settings allow profile edits and a modal-confirmed clear-all operation that returns to onboarding.
10. The How it works page explains formulas, terms, sources, supported inputs, and safety boundaries; the Calculator page estimates locally without saving or changing planner data.

## Functional requirements and implementation status

| ID | Requirement | Current implementation |
| --- | --- | --- |
| P01 | Profile stepper | Implemented. Four steps preserve in-memory entries, show field errors, require baseline/context/primary goal data, and require final confirmation. |
| P02 | Goals and units | Implemented. Four goals, optional non-duplicate secondary goals, kg/cm inputs, female/male values, five activity levels, and three experience levels. |
| P03 | Estimates | Implemented as MVP-2026.1 heuristics. BMI is separate; calories and macros are daily values. Formulas, constants, terms, sources, supported inputs, and safety boundaries are documented in How it works; qualified health review remains required. |
| P04 | Workout volume | Implemented as planned work-set count per displayed session. It is clearly separated from actual logged workload; weekly volume and a clinical guidance model are not implemented. |
| P05 | Plan management | Implemented. Plans require a name, confirmed focus, valid schedule, and at least one prescription. Delete uses a custom modal and leaves history. |
| P06 | Scheduling | Implemented. Plans are one date or recurring weekday from startsOn; the dashboard shows the selected date, up to three nearest earlier occurrences, and up to three nearest upcoming occurrences. Date controls open the exact matching session route. |
| P07 | Focus and suggestions | Implemented. Supports eight areas, four splits, and Aerobic. Goal/experience suggestion is editable and confirmation is required. |
| P08 | Focus graphics | Implemented with optimized local WebP assets, labels, and alt text. The assets illustrate focus; they do not claim intensity or anatomical percentages. |
| P09 | Exercise library | Partially implemented. 32 static exercises support search, filters, popularity/name/area/custom sorting, pagination, equipment labels, and written instructions. GIF/video media, source metadata, and rights review are missing. |
| P10 | Prescriptions | Implemented. Sets, reps/duration, load, rest, notes, ordering, removal, target RIR, six presets, and four target intensity levels are supported. |
| P11 | Workout tracking | Implemented. In-progress and completed records accept optional actual reps/duration, load, and RIR for individual sets. Saved records can be deleted from session and history detail views. |
| P12 | History preservation | Implemented in the normal UI flow. Records store plan/exercise/prescription snapshots and remain accessible after source-plan deletion. |
| P13 | Body weight and progress | Implemented. One dated weight record can be created, updated, or deleted; body-weight and session-performance charts plus tables show progress and up to 12 performance rows. |
| P14 | Profile updates and recalculation | Implemented. Profile saves increment revision; existing plan estimates stay unchanged until explicit plan-level recalculation. |
| P15 | Local persistence | Implemented with Dexie/IndexedDB and live queries. Clear-all is transactional. Runtime shape validation, migrations, and stale-tab conflict handling remain absent. |
| P16 | Effort adaptation | Implemented as a deterministic heuristic. Two recent completed sessions with recorded dose drive Increase, Decrease, Hold, or Trend building guidance, target-intensity advancement for recurring plans, and future prescription adjustment. |
| P17 | Calculation transparency and temporary calculator | Implemented. How it works documents estimate formulas, terms, sources, supported inputs, and safety boundaries; Calculator runs the same rules locally without persisting inputs or changing planner data. |

## Interaction and quality requirements

Implemented baseline:

- React Router hash navigation supports static hosting without rewrite rules.
- Desktop fixed sidebar and mobile slide-out sidebar are available.
- Mobile includes a visible hamburger control, sticky header, close action, scrim, and independently scrollable drawer.
- Buttons, cards, filters, side actions, and links have hover/focus motion; reduced-motion preferences are respected.
- Form controls have labels, inline errors, text-based explanations, visible focus, modal semantics, and graphic alt text.
- Empty, loading, unavailable-media, and storage-error messages exist in the main flows.
- Save/complete actions disable while their write is pending.
- Copy actions use a local clipboard fallback and show auto-dismissing snackbar feedback; session save/complete actions use the same transient feedback.
- Dashboard schedule cards show the occurrence date and link directly to that dated session.

Still to verify or improve:

- real-device keyboard and screen-reader audit;
- browser journeys on Chromium, Firefox, and WebKit;
- modal focus trapping and focus restoration;
- touch-friendly drag-and-drop behavior for Custom Exercise Order;

## Current rules

### Estimate rule

The implementation uses BMR, activity factors, goal adjustments, a calorie floor/rounding step, weight-based protein/fat, and carbohydrate remainder. The exact constants, source links, supported inputs, and safety boundaries are recorded in [MVP scope](mvp-scope.md), the How it works page, and src/domain.ts. These are estimates, not medical or dietary prescriptions.

### Focus suggestion rule

The current suggestion is deterministic and history-free:

- beginner → Full body;
- Lose fat or General fitness → Full body;
- Build muscle → Legs;
- remaining maintenance-oriented case → Core.

The result is only a starting suggestion and must be confirmed or replaced.

### Effort rule

For the two most recent completed records with actual dose values:

- burden: any value ≤ 80% of target, meaningful first-to-last-set drop-off, or RIR ≤ 1;
- increase: every observed dose value is above target;
- mixed/other evidence: hold;
- repeated burden reduces load/dose and adds rest;
- repeated overperformance increases load/dose.

Missing observations are excluded. This is a conservative product heuristic, not a validated readiness or fatigue model.

### Progress chart rule

Completed-session progress is the average of each prescription’s actual reps or duration divided by its plan snapshot target, expressed as a percentage. The overall Progress chart and recurring plan charts show the latest eight sessions with positive dose data; 100% is the target line. Load and RIR are kept in the performance table rather than folded into this score.

### Dashboard schedule rule

The selected date is the primary schedule query. The dashboard separately finds the nearest valid occurrence before and after that date for each plan, limits each side to three cards, and sorts earlier cards newest-first and upcoming cards oldest-first. Recurring occurrences are searched within a one-year window; one-time plans are returned only when their configured date is on the relevant side. Invalid dates return no occurrence.

## Release gaps and risks

| ID | Gap | Why it matters |
| --- | --- | --- |
| R01 | Exercise media is still a placeholder | The product promise includes demonstrations, but users currently receive written instructions only. |
| R02 | Nutrition rules remain product heuristics awaiting qualified health review | Incorrect personalized guidance can create health and trust risk even with documented sources and safety boundaries. |
| R04 | IndexedDB is version 1 with no runtime schema validation or migration tests | Future model changes can threaten stored user history. |
| R05 | No browser test suite is present | Core route, IndexedDB, modal, mobile, and snapshot behavior are not regression-protected in a real browser. |
| R06 | Recommendation matching is exercise-ID based | A plan containing the same exercise twice can conflate prescription history. |
| R07 | The media generation npm script points to a missing scripts/generate-media.mjs | The documented/package workflow is incomplete. |
| R08 | The Pages workflow assumes the default branch is main | Repositories using another default branch must update the trigger. |

## Deferred product scope

Accounts, cloud synchronization, file backup/import, custom exercises/media, weekly multi-day programs, social features, analytics, AI coaching, medical diagnosis, and automatic changes to historical records remain out of scope.

## Roadmap

### Release hardening

1. Replace media placeholders with reviewed, licensed demonstrations and attribution metadata.
2. Have nutrition constants and copy reviewed by a qualified health professional before release.
3. Add IndexedDB runtime validation, schema migrations, unique occurrence enforcement, and persistence-failure tests.
4. Add Playwright journeys for onboarding, plan CRUD, session logging, history preservation, clear-all, mobile navigation, and Pages preview.

### Product depth

1. Fix duplicate-exercise prescription matching and expand recommendation tests around missing data, duration, load, RIR, and mixed sessions.
2. Add a transparent weekly volume model only after defining units and recovery assumptions.
3. Add trend views that distinguish load, dose, RIR, and adherence instead of collapsing them into one score.
4. Add accessible touch/keyboard alternatives for exercise reordering.
5. Break dense screen components and CSS blocks into reviewable reusable units as the UI grows.

### Scale only if demanded

Introduce accounts, sync, backup, multi-device recovery, and server-owned data only after local use validates the core workflow. They would change privacy, security, conflict, and migration requirements substantially.
