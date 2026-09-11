# Form Fitness Planner

Form is a local-first personal fitness planner for creating repeatable workouts, following dated sessions, logging results, and reviewing progress.

It runs entirely in the browser. Profile data, plans, workout records, and body-weight entries are stored locally in IndexedDB; there is no account, backend, or cloud sync.

## Features

- Four-step onboarding: baseline, context, goals, and final review confirmation.
- BMI and daily calorie/macronutrient estimates based on the current profile.
- Workout plans focused on body areas, Push/Pull-style splits, or aerobic training.
- Focus-aware exercise recommendations and six presets:
  - Easy One
  - Strength Base
  - Muscle Builder
  - Machine Circuit
  - Quick Sweat
  - Aerobic Flow
- Exercise library with 32 built-in movements, including machine-specific and aerobic exercises.
- Exercise search, area/type filters, pagination, popularity/name/area sorting, and custom ordering.
- Dashboard schedule browsing for a selected date, nearby earlier workouts, and upcoming workouts.
- Dated workout sessions with optional actual reps/duration, load, and reps in reserve (RIR).
- Effort guidance that recommends increasing, decreasing, or holding effort from recent logged results.
- Four target intensity levels that shape plan prescriptions and advance after repeated above-target recurring sessions.
- Historical plan snapshots that remain available after a plan is edited or deleted.
- Copyable workout plans and individual workout steps for use in WhatsApp or elsewhere.
- Body-weight chart, workout history, performance trend graph, and recorded performance table.
- Snackbar confirmations for copy, save-progress, and session-completion actions.
- Responsive desktop sidebar and mobile navigation drawer.
- Modal confirmation for profile deletion and plan deletion.

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
| #/sessions/:planId/:date | Log a dated workout session |
| #/history/:recordId | View a historical session snapshot |
| #/progress | Track body weight and performance |
| #/exercise-order | Customize exercise ordering |
| #/profile | Edit profile or delete all local data |

## Data and privacy

Data is stored in the browser database named form-fitness-planner. The app does not send profile, plan, measurement, or workout data to an application server. Clearing all local data from Profile settings removes the profile, plans, workout history, and body-weight records, then returns to onboarding.

Because storage is origin- and browser-specific, clearing site data, changing browsers/devices, or browser eviction can remove access to local records. Backup and synchronization are not currently supported.

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
    src/features         Dashboard, plans, sessions, progress, profile, and ordering
    src/shared           App shell, fields, empty states, snackbars, charts, export, and formatters
    src/styles.css       Shared visual and responsive styles
    public/assets        Local focus illustrations
    docs                 Product, technical, scope, context, and review documents

## Documentation

- [Domain context](CONTEXT.md)
- [Implemented MVP scope](docs/mvp-scope.md)
- [Product requirements](docs/prd.md)
- [Technical requirements](docs/trd.md)
- [Repository review and roadmap](docs/review.md)

## Current limitations

- Exercise demonstrations are currently written-instruction placeholders; reviewed GIF/video media and attribution are not shipped.
- Nutrition calculations and progression recommendations are transparent MVP heuristics, not clinical or medical guidance.
- IndexedDB is currently schema version 1 without runtime data parsing, migration coverage, or stale-tab conflict detection.
- Vitest covers pure domain, ordering, and recommendation rules. Browser-level Playwright journeys are not yet implemented.
- Weekly multi-day programs, accounts, cloud sync, file backup/import, and custom exercises are outside the current scope.
