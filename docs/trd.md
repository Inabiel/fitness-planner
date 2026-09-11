# Technical Requirements Document — Form Fitness Planner

Status: current implementation and deployment baseline. Last reconciled: 2026-09-12. This document describes the code that exists today; unresolved hardening work is listed at the end.

## Architecture

The application is a static client:

Browser → React UI → pure domain functions and feature state → Dexie/IndexedDB.

There is no application API, authentication, server database, server-rendered route, or secret-bearing client configuration. Static focus artwork is bundled under public/assets/body-areas. The built application is deployable to any HTTPS static host.

## Stack

- React and React DOM 19.
- TypeScript 5.9 with strict mode and no emitted JavaScript from the TypeScript compiler.
- Vite 7 with the React plugin.
- React Router 7 declarative HashRouter.
- Dexie 4 and dexie-react-hooks for IndexedDB and live queries.
- Lucide React for interface icons.
- Zod is installed but is not currently used for persistence-boundary validation.
- Vitest for pure logic tests and Playwright is listed as a future browser-test runner.
- Ordinary CSS in src/styles.css; no component styling framework.

Exact package versions are governed by package.json and package-lock.json.

## Source boundaries

| Boundary | Responsibility |
| --- | --- |
| src/app/App.tsx | Reads live planner data and selects onboarding or authenticated routes. |
| src/domain.ts | TypeScript domain types, labels, dates, estimates, focus mapping, schedule matching, and planned volume. |
| src/data/db.ts | Dexie database, CRUD helpers, clear-all transaction, and usePlanner live query. |
| src/data/exercises.ts | Static Exercise Library and curated popularity ranks. |
| src/features/profile | Onboarding stepper, profile settings, form conversion, and validation guards. |
| src/features/plans | Plan list/editor/detail, focus previews, illustration assets, presets, and progression heuristics. |
| src/features/sessions | Dated session logger, plan snapshot creation, and historical record detail. |
| src/features/progress | Body-weight entry/chart, workout history, performance trend chart, and performance table. |
| src/features/exercises | Persisted Custom Exercise Order with arrow and drag-and-drop reorder behavior. |
| src/shared | App shell, page/field/empty-state/snackbar primitives, formatters, progress metric/chart, workout text export, and basic validation. |
| src/styles.css | Central visual system, responsive layout, hover states, focus states, modal styling, and reduced-motion rules. |

Feature index files re-export screen entry points. They provide stable import boundaries without adding a state-management layer.

## Runtime routes

The application uses hash routes so a static host does not need to rewrite unknown paths:

| Route | Component | Responsibility |
| --- | --- | --- |
| #/onboarding | Onboarding | New or existing profile stepper and final confirmation. |
| #/ | Dashboard | Selected-date schedule, earlier/upcoming occurrences, date navigation, estimates, BMI, quick links, and responsive shell. |
| #/plans | Plans | Saved plan cards and empty state. |
| #/plans/new | PlanEditor | New plan form, focus selection, presets, library, prescriptions, and save. |
| #/plans/:planId | PlanDetail | Focus, recurring progress trend, sequence, effort guidance, estimate, logging action, text export, recalculate, and delete. |
| #/plans/:planId/edit | PlanEditor | Existing plan editing. |
| #/sessions/:planId/:date | Session | Dated occurrence logger, step text export, and completion action. |
| #/history/:recordId | HistoryDetail | Historical snapshot independent of a current plan. |
| #/progress | Progress | Body-weight entry/trend, workout history, performance trend, and performance observations. |
| #/exercise-order | ExerciseOrder | Profile-level custom ordering for future library browsing. |
| #/profile | ProfileSettings | Profile updates and modal-confirmed clear-all. |

Unknown routes redirect to onboarding when no profile exists and to the dashboard otherwise. Unknown plan/record IDs render explicit empty states.

## Type model

The core model is in src/domain.ts:

- Profile: singleton ID, profile inputs, primary/secondary goals, optional exercise order, updatedAt, revision.
- Exercise: stable ID, name, instructions, primary/secondary areas, dose kind, popularity rank, optional equipment/aerobic type, and media label.
- Prescription: stable ID, exercise ID, sets, reps or duration, rest seconds, notes, optional recommended load, and optional target RIR.
- Schedule: date or weekly weekday plus startsOn.
- WorkoutPlan: name, revision/timestamps, compatibility primaryTargetArea, optional WorkoutFocus and target intensity, confirmation, schedule, prescriptions, and optional EstimateSnapshot.
- PlanSnapshot: plan name, focus/target intensity/schedule, prescriptions, exercise metadata, and estimate captured for a WorkoutRecord.
- SetRecord: prescription ID, one-based set number, optional actual reps or duration, optional load, and optional RIR.
- WorkoutRecord: source plan ID, session date, status, completion time, revision, plan snapshot, and set records.
- BodyWeightRecord: date, weight, timestamps, and revision.

WorkoutFocus is a union of eight body-part focuses, four training splits, and aerobic. PrimaryTargetArea remains on plans for compatibility and is derived through targetAreaForFocus for non-body-part focuses.

## Persistence

FitnessDatabase uses Dexie database name form-fitness-planner and schema version 1:

| Store | Current schema |
| --- | --- |
| profiles | id |
| plans | id, updatedAt |
| records | id, compound sourcePlanId + sessionDate index, sessionDate |
| weights | date |

usePlanner reads the four stores with Promise.all and returns a live-query value. Plans, records, and weights are ordered in the query for recent-first display.

CRUD helpers use put/update/delete. clearAllData uses one read-write transaction to clear profiles, plans, records, and weights together. The UI reports failures in the main write paths and keeps active form state in React memory.

Important current limitations:

- The compound records index is indexed but not declared unique. The UI finds an existing record by plan/date, but the database does not enforce that invariant.
- There is no Dexie migration beyond version 1.
- Stored values are trusted as TypeScript objects; no runtime schema validation currently protects reads.
- Revision fields are incremented but stale-tab writes are not rejected.
- Plan deletion is intentionally non-cascading so records remain available.

## Lifecycle and history

1. The dashboard derives recurring occurrences with occursOn rather than pre-creating an unbounded series.
2. Opening a session does not write immediately.
3. Save progress or Mark complete creates or updates the record keyed in the UI by source plan/date.
4. The record snapshots current plan and static exercise metadata through makePlanSnapshot.
5. Editing a plan affects the current plan and future unrecorded use; the snapshot in an existing record is unchanged.
6. Deleting a plan deletes only the plan store entry.
7. History detail resolves by record ID and does not require the source plan to exist.
8. Explicit plan recalculation updates only the selected plan estimate.

The dashboard resolves the selected date directly from the current local calendar. occurrenceBefore and occurrenceAfter search for the closest valid occurrence on each side, inspect up to 366 days for recurring plans, and return a one-time plan only when its configured date is on that side. The UI caps each side at three occurrences and links each card to the exact plan/date session route.

## Domain rules currently implemented

### Estimates

calculateEstimates uses:

- BMR = 10 × weight + 6.25 × height − 5 × age + sex constant;
- activity factors 1.2, 1.375, 1.55, 1.725, and 1.9;
- goal adjustments −300, +250, 0, and +100 kcal;
- a 1,200 kcal minimum and rounding to the nearest 50;
- protein at 1.8 g/kg for Build muscle and 1.6 g/kg otherwise;
- fat at 0.8 g/kg;
- carbohydrate as the remaining calories.

The result carries rule version MVP-2026.1. These are implementation heuristics and need health review before release.

### Focus and prescription selection

selectRecommendedExercises scores matching primary areas at 3 and secondary areas at 1, then sorts by score, popularity rank, and source order. Aerobic focus only considers aerobic entries. The first four candidates become recommended prescriptions.

Starting load defaults are keyed by exercise ID and experience. Sets and dose vary by experience and primary goal. Presets replace the current prescription list and apply their own sets, dose, rest, notes, load reduction, and target RIR.

### Effort adaptation

The two most recent completed records with actual dose entries are evaluated per exercise:

- burden if any dose is at or below 80% of target;
- burden if first-to-last observed dose drops by at least max(2, 25% of target);
- burden if a logged RIR is 0 or 1;
- overperformed if all observed dose values exceed target;
- otherwise hold.

Two repeated burden signals reduce load by roughly 10% or dose by one rep/five seconds and add 30 seconds rest, capped at 180 seconds. Two repeated overperformance signals increase load by roughly 5% or dose by one rep/five seconds. Plan detail exposes the assessment; session completion persists the next recommendation. This is deliberately simple and is not a validated fatigue model.

### Progress charts

sessionProgress compares each logged set’s actual reps or duration with its plan snapshot target, averages those ratios across prescriptions, and reports a rounded percentage. 100% means the planned dose was completed. Charts use the latest eight completed sessions with actual dose entries; they intentionally do not combine load or RIR into the percentage. The progress page shows the overall trend, while recurring plan detail shows the trend for that plan. Body-weight history remains a separate kilogram chart with an exact-value table.

## UI, export, and assets

FocusIllustration resolves the focus union to relative local WebP files so the same build works at the domain root and a repository Pages path. The HTML favicon uses Vite’s BASE_URL placeholder. Optimized focus assets are used in onboarding intention preview, plan cards, and plan detail.

Plan detail and active sessions can copy a complete workout plan or an individual exercise step as WhatsApp-friendly text. Copying uses the Clipboard API with a local/older-browser textarea fallback. The shared Snackbar confirms copy, save-progress, and session-completion actions, auto-dismisses, and supports manual dismissal.

Exercise entries currently render a written-instructions/media placeholder. No exercise GIF/video URL, source, attribution, or playback control exists yet.

The shared AppShell contains a fixed desktop sidebar and a mobile drawer. At widths up to 720px, the drawer is hidden off-canvas until the visible hamburger control opens it; the header is sticky, the drawer scrolls independently, and a scrim closes it. CSS includes visible focus, action hover motion, and reduced-motion overrides.

## Code guide

The compiler is strict, uses isolated modules, checks unused locals/parameters, and does not emit files. Feature code is TypeScript/TSX. Pure rules are kept outside React where practical. Database writes are isolated in data/db.ts. Feature index files expose stable imports for route composition.

Known maintainability debt:

- Several screen JSX expressions and CSS blocks are compressed into long lines, which increases review and change cost.
- Static EXERCISES data is coupled directly to recommendations and views instead of being validated at a content boundary.
- Zod is installed but not used.
- Profile Settings and onboarding do not share one complete range-validation function.

## Verification status

Current automated checks:

- npm run build: passes TypeScript checking and Vite production build.
- npm run lint: passes ESLint.
- npm test: passes 18 Vitest tests across domain rules, exercise ordering, recommendations, text export, and progress metrics.

The domain suite also covers nearest earlier and upcoming occurrences for recurring and one-time schedules. Browser, IndexedDB, mobile, modal, and real asset smoke tests remain to be added.
The package includes npm run test:browser, but there are currently no Playwright test files or Playwright configuration. The package also includes npm run media, but scripts/generate-media.mjs is not currently present.

## GitHub Pages deployment

The repository now includes .github/workflows/deploy-pages.yml:

1. Trigger on pushes to main or manual workflow dispatch.
2. Check out the repository.
3. Set up Node 22 and npm cache.
4. Configure GitHub Pages.
5. Run npm ci and npm run build.
6. Upload dist as the Pages artifact.
7. Deploy with the github-pages environment.

The workflow grants contents read, pages write, and id-token write permissions and serializes deployments. Vite uses a relative base so repository Pages paths work; focus assets use relative URLs and the favicon resolves through BASE_URL. GitHub repository Settings → Pages must use GitHub Actions as the source. If the repository’s default branch is not main, change the workflow trigger.

References: [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [Vite static deployment](https://vite.dev/guide/static-deploy.html).

## Technical roadmap

### Before production release

- Add runtime validation and Dexie migrations without deleting user data.
- Enforce one source-plan/date occurrence at the database layer.
- Add revision conflict handling for multiple tabs.
- Share validated profile bounds between onboarding and settings.
- Replace placeholder exercise media with reviewed local or licensed assets and attribution.
- Add Playwright coverage and run mobile/accessibility checks on real browsers.

### Next product increment

- Match recommendations by prescription ID, not only exercise ID.
- Separate load, dose, RIR, and adherence trends in progress views.
- Define and implement a transparent weekly volume model.
- Add keyboard/touch alternatives to native drag-and-drop ordering.
- Split dense screens and CSS into smaller reusable components only where that improves changeability.

### Later, if product demand justifies it

Add accounts, sync, backup, and server-owned data only as a deliberate architecture change. It would require authentication, authorization, conflict resolution, privacy policy, migrations, and a new threat model.
