# fitnessPal

fitnessPal is a local-first personal fitness planner for creating repeatable workouts, following dated sessions, logging results, and reviewing progress.

It runs entirely in the browser. Profile data, plans, programs, workout records, and body-weight entries are stored locally in IndexedDB; there is no account, backend, or cloud sync.

## Features

- Four-step onboarding: baseline, context, goals, and final review confirmation.
- BMI and daily calorie/macronutrient estimates based on the current profile.
- Workout plans focused on body areas, Push/Pull-style splits, or aerobic training.
- Programs that organize existing workout plans into an ordered routine, track rotation progress, support skip/move controls, optional deload rotations, and optional completion-driven schedule shifting.
- Program creation can select only unassigned plans or create and automatically attach new plans; the main action opens a quick-create modal and the plan editor can save and add another.
- Live Tracking opens a workout modal with set inputs, per-set notes, session-only exercise substitutions, exercise progress, rest countdowns, automatic exercise advance, and save/finish actions.
- Focus-aware exercise recommendations and six presets:
  - Easy One
  - Strength Base
  - Muscle Builder
  - Machine Circuit
  - Quick Sweat
  - Aerobic Flow
- Exercise library with 46 built-in movements, including machine-specific and aerobic exercises.
- Local four-frame looping GIF demonstrations for every exercise, styled with grayscale anatomy and warm muscle accents.
- Exercise search, area/type filters, pagination, popularity/name/area sorting, and custom ordering.
- Dashboard schedule browsing for a selected date, nearby earlier workouts, and upcoming workouts.
- Dated workout sessions with optional actual reps/duration, load, reps in reserve (RIR), and per-set notes.
- Plan personalization with optional time and available-machine constraints that shape recommendations and the exercise library.
- Effort guidance that recommends increasing, decreasing, or holding effort from recent logged results.
- Four target intensity levels that shape plan prescriptions and advance after repeated above-target recurring sessions.
- Historical plan snapshots that remain available after a plan is edited or deleted.
- Saved workout records can be deleted from the session and history detail views.
- A How it works page explains formulas, terms, sources, and safety boundaries.
- A standalone calculator estimates calories, macros, and BMI without changing saved data.
- Copyable workout plans with optional exercise steps for use in WhatsApp or elsewhere.
- Body-weight chart, workout history, performance trend graph, recorded performance table, personal records, weekly work-set volume, schedule adherence, and primary muscle-balance signals.
- Weekly consistency streaks with fire styling, workout-day milestone badges, a 12-week activity history, and completion celebrations derived from saved workouts.
- Estimated calories burned from completed workouts, summarized for today, this week, this month, this year, and all retained history.
- Temporary versioned JSON backup import/export for moving local data between devices; this bridge is intended to be replaced by backend sync.
- Snackbar confirmations for transient actions and routine completion; newly activated streaks and earned badges use a celebratory modal.
- Responsive desktop sidebar, mobile navigation drawer, mobile-safe dialogs, and narrow-screen card layouts.
- Modal confirmation for profile deletion, plan deletion, and workout-record deletion.

## Quick start

Requirements: Node.js 22 or newer and npm.

    npm install
    npm run dev

Open the local URL printed by Vite. The first visit starts at onboarding.

## Available commands

    npm run dev       # Start the Vite development server
    npm run build     # Type-check and create a production build
    npm run preview   # Preview the production build locally
    npm run lint      # Run ESLint
    npm test          # Run the Vitest suite

## Routes

The app uses hash routing so it can run on static hosting without server-side route rewrites.

| Route | Purpose |
| --- | --- |
| #/onboarding | Create or edit the fitness profile |
| #/ | Dashboard and schedule |
| #/plans | View saved workout plans |
| #/plans/new | Create a workout plan |
| #/plans/:planId | View plan details, progress, effort guidance, and copy actions |
| #/plans/:planId/edit | Edit a workout plan |
| #/programs/new | Create a workout program |
| #/programs/:programId | View a program and its member plans |
| #/programs/:programId/edit | Edit a workout program |
| #/sessions/:planId/:date | Log a dated workout session |
| #/history/:recordId | View a historical session snapshot |
| #/progress | Track body weight and performance |
| #/exercise-order | Customize exercise ordering |
| #/about | Read calculation formulas, terms, sources, and safety boundaries |
| #/calculate | Try a temporary estimate without changing saved data |
| #/profile | Edit profile, transfer temporary JSON backups, or delete all local data |

## Data and privacy

Data is stored in the browser database named form-fitness-planner. The app does not send profile, plan, measurement, or workout data to an application server. Clearing all local data from Profile settings removes the profile, plans, workout history, and body-weight records, then returns to onboarding.

Profile settings also provides temporary JSON backup export/import for manual device transfer. Import validates the backup and replaces all local stores; it is not automatic synchronization and should be removed when backend sync ships.

Because storage is origin- and browser-specific, clearing site data, changing browsers/devices, or browser eviction can remove access to local records. The temporary JSON backup is manual transfer only; automatic synchronization is not currently supported.

## GitHub Pages deployment

The repository includes .github/workflows/deploy-pages.yml. It builds the Vite app and deploys dist to GitHub Pages when main is updated, or when the workflow is run manually.

To enable it in GitHub:

1. Open repository Settings → Pages.
2. Set the publishing source to GitHub Actions.
3. Push to main or run Deploy to GitHub Pages from the Actions tab.

The Vite build uses relative asset paths and HashRouter, so it works at a repository Pages URL as well as a domain root. If the repository uses another default branch, update the workflow trigger.

## Project structure

    src/app              Route composition
    src/domain.ts        Domain types and pure fitness rules
    src/data             Dexie persistence and static exercises
    src/features         Dashboard, plans, sessions, progress, profile, calories, gamification, about, and calculator
    src/shared           App shell, fields, empty states, snackbars, charts, calculations, export, and formatters
    src/styles.css       Shared visual and responsive styles
    public/assets        Local focus illustrations
    docs                 Product, technical, scope, context, and review documents

## Documentation

- [Domain context](CONTEXT.md)
- [Implemented MVP scope](docs/mvp-scope.md)
- [Product requirements](docs/prd.md)
- [Technical requirements](docs/trd.md)
- [Repository review and roadmap](docs/review.md)
- [Mobile UI/UX audit](docs/mobile-ux-audit.md)
- [Gamification and streaks](docs/gamification.md)
- [Media generation guide](docs/media-generation/README.md)

## Current limitations

- Exercise GIFs are generated educational aids; movement review, attribution metadata, and a formal content-approval workflow are not shipped.
- Nutrition calculations, workout-energy totals, and progression recommendations are transparent MVP heuristics with documented boundaries, not clinical or medical guidance.
- IndexedDB is currently schema version 2 without runtime data parsing, complete migration coverage, or stale-tab conflict detection.
- Vitest covers pure domain, ordering, recommendation, gamification, calorie-aggregation, and backup-validation tests. Browser-level Playwright journeys and real browser/device responsive verification are not yet implemented.
- Program scheduling, progress, rest-day behavior, skip/move controls, deload rotations, completion-driven shifting, and nearby next-workout recommendations are shipped. The temporary JSON backup bridge is intentionally not a sync solution.
