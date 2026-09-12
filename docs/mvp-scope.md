# Form Fitness Planner — Implemented MVP Scope

Status: current implementation baseline, 2026-09-12. Vocabulary is defined in [CONTEXT.md](../CONTEXT.md); technical details are in [TRD](trd.md).

## Product promise

An individual can complete onboarding, create a focused workout plan, schedule it, follow a dated occurrence, optionally record performance, and see the same local data after a reload. The application is intentionally browser-only and private by default.

## Shipped profile flow

- Four-step onboarding UI: Baseline, Context, Goals, and Review.
- Required fields: name, age, sex, height in cm, body weight in kg, activity level, training experience, and one Primary Fitness Goal.
- Optional Secondary Goals cannot duplicate the primary goal.
- Onboarding and profile settings share the same supported ranges: ages 13–100, height 100–250 cm, and weight 30–300 kg.
- Review has a final custom modal confirmation. Existing-profile edits preserve the profile’s exercise order and explicitly leave saved plan estimates unchanged.
- Profile settings include an explicit Delete all local data action. Confirmation uses a modal; successful deletion clears all four stores and reloads onboarding.

## Estimates

The app shows BMI separately from daily calorie and macro estimates. Current rules in `src/domain.ts` are:

- Mifflin–St Jeor-style BMR with sex constants `+5` and `-161`.
- Activity factors from 1.2 to 1.9.
- Goal adjustments of −300, +250, 0, or +100 kcal.
- A 1,200 kcal floor and calorie rounding to the nearest 50.
- Protein at 1.8 g/kg for muscle gain and 1.6 g/kg otherwise.
- Fat at 0.8 g/kg; carbohydrate fills remaining calories.

These values are implemented heuristics with rule version `MVP-2026.1`. The How it works page documents the formulas, constants, terms, source links, and safety boundaries; the standalone calculator exposes the same estimate rules without saving data. They still require qualified health review before being presented as production-grade personalized guidance.

## Shipped workout planning

- Create, view, edit, and delete one-workout Workout Plans.
- Confirm one Workout Focus: eight body-part categories, four training splits, or Aerobic.
- Show an optimized local focus illustration in intention preview, plan cards, and plan detail.
- Suggest a focus from goal and experience, with an editable explanation and explicit confirmation.
- Choose a recurring weekday or one calendar date.
- Browse the selected date, nearest earlier occurrences, and nearest upcoming occurrences from the dashboard. Previous/next day controls, a date picker, and a Today shortcut support specific-date workout lookup.
- Add at least one Exercise Prescription, reorder it, remove it, and edit sets, reps/duration, load, rest, and notes.
- Apply six focus-aware presets: Easy One, Strength Base, Muscle Builder, Machine Circuit, Quick Sweat, and Aerobic Flow.
- Choose Easy, Moderate, Hard, or Very hard target intensity; generated prescriptions adjust dose, rest, and target RIR.
- Copy a complete plan as text, with optional exercise steps, for use outside the local site.
- Entire plan cards navigate to plan details and include hover/focus treatment. Plan deletion confirms in a modal and leaves history intact.

## Exercise Library

The static library currently contains 32 entries: 24 strength-oriented entries and 8 aerobic entries. Entries cover free weights, bodyweight, cable/machine movements, and common cardio equipment such as treadmill, bike, elliptical, rower, stair climber, jump rope, and swimming.

The plan editor provides:

- Search by exercise name, equipment, or type.
- Filters for All, Aerobic, and body areas.
- Six entries per page with pagination.
- Most popular, name A–Z, name Z–A, body-part, and Custom order sorting.
- A visible equipment label for machine-specific exercises.

Exercise demonstrations are not shipped yet. The UI displays a media placeholder and preserves written instructions.

## Sessions, logging, and progression

- Open a dated session from the dashboard, plan detail, or history flow.
- Save an in-progress session or mark it complete without entering performance details.
- Delete a saved workout record from the session or history detail view.
- Log actual reps or duration, load in kg, and optional RIR for each set.
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

## Dashboard schedule browsing

The dashboard keeps a selected calendar date as the primary schedule view. It displays every plan occurring on that date, including completed state for that exact occurrence. It also displays up to three nearest scheduled occurrences before and after the selected date, sorted chronologically within their groups. One-time plans appear only on their configured date; recurring plans resolve to their nearest valid local weekday occurrence after their startsOn date. Every displayed card links to the matching plan/date session route.

## Navigation and responsive behavior

Current hash routes:

| Route | Screen |
| --- | --- |
| `#/onboarding` | New or existing profile stepper |
| `#/` | Dashboard, selected-date schedule, and nearby occurrences |
| `#/plans` | Workout plan list |
| `#/plans/new` | Plan editor |
| `#/plans/:planId` | Plan detail, progress, effort guidance, and copy actions |
| `#/plans/:planId/edit` | Existing plan editor |
| `#/sessions/:planId/:date` | Dated session logger |
| `#/history/:recordId` | Historical session snapshot |
| `#/progress` | Weight, history, and performance |
| `#/exercise-order` | Custom exercise ordering |
| `#/about` | Calculation formulas, terms, sources, and safety boundaries |
| `#/calculate` | Temporary estimate calculator that does not change saved data |
| `#/profile` | Profile settings and data deletion |

Desktop uses a fixed sidebar. At widths up to 720px the sidebar becomes a slide-out drawer with a visible hamburger button, sticky mobile header, independent drawer scrolling, close button, and scrim. Hover transitions are reduced when the person prefers reduced motion.

## Local persistence

Dexie stores profiles, plans, workout records, and body-weight records in IndexedDB. Live queries refresh the UI after writes. The current database is schema version 1. Clear-all-data is transactional across all four stores.

## Out of scope or not release-ready

- Accounts, cloud sync, file backup/import, installable PWA behavior, and custom exercises/media.
- Weekly program grouping and history-based exercise selection.
- Reviewed GIF/video demonstrations, content rights, source attribution, and media retry behavior.
- Runtime validation of arbitrary persisted IndexedDB data, schema migrations, and stale-tab revision conflicts.
- Browser-level automated journeys and a complete mobile/accessibility audit.
- Clinically reviewed nutrition rules or individualized health guidance.
