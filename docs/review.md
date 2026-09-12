# Repository Review — Form Fitness Planner

Review date: 2026-09-13
Review scope: current source, product documents, tests, static assets, and deployment setup.

This review includes the organization-only Workout Program capability: Programs group ordered references to existing plans, while plan scheduling, sessions, and history remain unchanged. Program-level scheduling and progression remain roadmap work.

## Executive summary

Form Fitness Planner is a focused local-first fitness planning prototype with a surprisingly complete end-to-end loop: profile → plan → dated session → optional result logging → history/progress. The implementation has good domain instincts around snapshots, explicit confirmation, optional measurements, and preserving historical data when plans change.

The repository is closer to a strong MVP prototype than a production-ready fitness product. The largest gaps are not missing screens; they are trust and operational gaps: generated exercise demonstrations need content review, nutrition logic is unreviewed, IndexedDB data is not runtime-validated or migrated, browser coverage is absent, and a few domain invariants are only enforced by UI behavior. The new GitHub Pages workflow removes the deployment gap, but repository settings still need to select GitHub Actions as the Pages source.

## Score

Overall score: 7.0 / 10

| Dimension | Score | Assessment |
| --- | ---: | --- |
| Product coverage | 8.0 | The main planning, logging, history, progress, onboarding, and deletion flows exist. |
| Domain modeling | 7.5 | Strong unions and snapshots; some compatibility fields and duplicate-ID edge cases remain. |
| Architecture | 7.5 | Appropriate React/Vite/Dexie split with modest feature boundaries and no unnecessary backend. |
| UX and accessibility baseline | 7.5 | Clear flows, custom modals, labels, focus, responsive drawer, hover motion, and reduced-motion support. |
| Data integrity | 6.5 | History snapshots and clear-all transaction are good; runtime validation, migrations, uniqueness, and conflict handling are missing. |
| Test confidence | 5.0 | Twenty-four pure-logic tests pass, but there are no browser journeys or persistence integration tests. |
| Content readiness | 5.0 | The static library is broad and now has local GIF demonstrations, but generated output still needs movement/content review. |
| Deployment readiness | 6.5 | A Pages workflow and relative asset paths now exist; branch/settings assumptions remain. |

The score is limited by release risk, not by the amount of UI already built. A small amount of hardening could raise the project significantly without adding many new features.

## What the repository does well

### 1. It completes a useful product loop

The implementation is not a collection of disconnected screens. A person can:

- complete the four-step onboarding flow;
- receive an estimate and focus suggestion;
- create a plan with body-part, split, or aerobic focus;
- use presets or select exercises;
- schedule a dated occurrence;
- save partial progress or complete without entering every result;
- browse a selected dashboard date, nearby earlier/upcoming occurrences, or a specific calendar date;
- inspect historical snapshots;
- see plan recommendations react to repeated logged performance.

That coherence is the strongest product quality in the repository.

### 2. The local-first architecture matches the stated scope

React, Vite, and Dexie are a proportionate choice for a private, single-device planner. There is no speculative API, auth layer, server state cache, or cloud abstraction. Data stays in IndexedDB, and clear-all is implemented as one transaction across profiles, plans, records, and weight entries.

The use of HashRouter is also a practical static-host decision. It avoids requiring route rewrites, which is useful for GitHub Pages.

### 3. Historical integrity is treated as a first-class concern

The plan snapshot inside WorkoutRecord is the right architectural choice. It preserves the name, focus, schedule, prescriptions, exercise metadata, and estimate associated with the performed session. Plan edits, estimate recalculation, and plan deletion therefore do not silently rewrite the past.

The delete-plan UI also communicates that records remain safe. This is a good example of product copy reinforcing the data model.

### 4. TypeScript modeling is clear and useful

The domain uses discriminated unions for Schedule and WorkoutFocus, literal unions for goals/areas/experience, and explicit interfaces for Profile, Exercise, Prescription, SetRecord, WorkoutRecord, and snapshots. The compiler uses strict mode, isolated modules, and unused symbol checks.

The code also keeps calculation, schedule, focus suggestion, recommendation, and ordering logic outside React components where possible. That makes the existing unit tests small and meaningful.

### 5. The interaction design has improved beyond the original MVP

The repository now includes:

- a review confirmation modal;
- modal deletion for all local data and plan deletion;
- hover/focus treatment across action controls;
- whole-card plan navigation;
- a mobile drawer with visible hamburger control and scrim;
- reduced-motion overrides;
- optimized local WebP focus artwork in onboarding and plan surfaces;
- an Exercise Order screen with drag/drop and arrow controls;
- pagination and multiple library sort modes.
- independent deletion for saved workout records from session and history detail.

These are good usability investments because they reduce friction in the primary flows rather than adding unrelated features.

### 6. The recommendation feature is transparent enough to inspect

The current effort model is intentionally simple: it looks at the two most recent completed sessions with logged dose values, detects low output, set drop-off, or low RIR, and returns Increase, Decrease, Hold, or Trend building. The plan detail exposes the direction and explanation instead of silently changing a number.

The adjustment is also conservative and editable: roughly 5% load increase, 10% decrease, dose step changes when no load exists, and additional rest for burden. This is a reasonable prototype heuristic as long as it is not marketed as a validated fatigue or readiness score.

## What needs improvement

### 1. Generated exercise media needs content review

Evidence: public/assets/exercises contains one local four-frame GIF for each of the 46 catalog entries, and the plan editor and plan detail render those GIFs. The assets are generated educational visuals without expert movement review, formal content approval, attribution metadata, or failure-retry path.

Impact: P09 now has a working demonstration surface, but an incorrect generated pose could create trust or safety risk. Written instructions remain the authoritative coaching text until the visuals are reviewed.

Recommendation: review every generated demonstration for exercise identity and safe form, replace unsuitable output, and add explicit approval/attribution metadata if the media pipeline becomes a release feature. Do not silently substitute arbitrary remote URLs.

### 2. Nutrition guidance needs health and product review

Evidence: src/domain.ts implements a BMR-style formula, activity multipliers, goal calorie adjustments, a calorie floor, and macro ratios. The How it works and Calculate pages now document the formulas, constants, supported inputs, source links, and “not medical advice” boundaries; the rules are still product heuristics without a qualified health review or uncertainty model.

Impact: numeric output can look authoritative even when it is only a rough heuristic. This is the highest trust risk in the current product.

Recommendation: keep the source, rationale, supported-input behavior, and safety copy current; have the rules reviewed by a qualified health professional before public release; and keep the rule version in saved snapshots when the rules change.

### 3. Persistence has a good shape but weak protection at the storage boundary

Evidence: Dexie is on schema version 2 with a programs-store migration; persisted objects are trusted as TypeScript values; runtime parsers and stale-tab conflict checks are still absent. Revision numbers are incremented but not compared before writes. The compound plan/date record index is not declared unique.

Impact: a future model change or malformed IndexedDB value can break rendering or calculations. Multiple tabs can overwrite each other. Duplicate occurrence records are not structurally impossible.

Recommendation: add small Zod parsers for each stored root entity, introduce explicit Dexie migrations, make the occurrence invariant unique where compatible with the existing data, and reject stale revisions with a recoverable message. Test migration preservation before changing the schema.

### 4. The test suite proves rules, not the application

Evidence: the current suite has 24 Vitest tests for estimates/scheduling/suggestions, ordering, presets, progression, export formatting, progress metrics, gamification, and shared profile bounds. package.json includes a browser test command, but there are no Playwright spec files or Playwright configuration. There are no IndexedDB integration tests.

Impact: regressions in routes, forms, modals, snapshots, deletion, mobile navigation, and reload behavior can pass CI unnoticed.

Recommendation: add a small Playwright smoke suite for onboarding, plan creation, session completion, history after plan deletion, clear-all, and mobile drawer navigation. Add fake-indexeddb or browser-backed persistence tests for duplicate occurrence, reload, and snapshot preservation.

### 5. Some important invariants are UI-only

Evidence: the session UI finds an existing record by source plan ID and date, while the database index is not unique. The recommendation matcher finds the first snapshot prescription by exercise ID. The editor permits the same exercise to be added more than once.

Impact: duplicate exercises can cause results to be attributed to the wrong prescription. Repeated taps or external writes can create multiple records for one occurrence.

Recommendation: match recommendation history by prescription identity and add a stable occurrence key. Preserve support for repeated exercises by ensuring every set and snapshot lookup remains prescription-ID based.

### 6. Profile validation now shares supported bounds

Evidence: onboarding and Profile Settings both use the shared `PROFILE_LIMITS` for age 13–100, height 100–250 cm, and weight 30–300 kg. A focused form test covers out-of-range age, height, and weight.

Impact: the two profile entry flows now present consistent supported bounds; arbitrary persisted IndexedDB values still lack runtime parsing.

Recommendation: keep the shared bounds synchronized with the calculator and add runtime persistence validation at the IndexedDB boundary.

### 7. The repository has maintainability debt despite good boundaries

Evidence: many screen components and large sections of src/styles.css are compressed into long single lines. Feature folders and index exports exist, but substantial views still combine data preparation, event handlers, markup, and presentation in one file.

Impact: visual changes are harder to review, accessibility fixes are easier to miss, and future contributors must parse dense expressions.

Recommendation: refactor only the screens that are actively changing. Extract small components with real boundaries—session set row, plan action group, library controls, modal shell, and progress tables—without creating a generic design-system package prematurely.

### 8. The content-generation script is broken

Evidence: package.json exposes npm run media, but scripts/generate-media.mjs is not present in the repository.

Impact: a documented-looking command fails immediately and can mislead contributors about how assets are maintained.

Recommendation: either add the script with its exact input/output contract or remove the script until an asset pipeline is real. Prefer the latter if manual reviewed assets are the actual workflow.

### 9. Deployment is now present but still needs repository configuration

Evidence: .github/workflows/deploy-pages.yml builds dist and deploys through the github-pages environment on main. Vite uses a relative base and focus assets use BASE_URL.

Impact: the code is prepared for Pages, but the repository must use GitHub Actions as its Pages publishing source, and a repository whose default branch is not main needs a trigger change.

Recommendation: enable Pages → GitHub Actions, run the workflow once, verify the published URL and IndexedDB origin, and add a Pages smoke check to CI.

## Architecture assessment

### Current structure

The structure is appropriately small:

- src/app owns route composition;
- src/domain owns stable rules and types;
- src/data owns persistence and static content;
- feature folders own screen behavior;
- src/shared owns shell and repeated primitives;
- CSS remains centralized.

This is a good stopping point for the current product. Adding Redux, a query library, a service layer, or a backend would increase complexity without solving a current requirement.

### Main architectural seam to strengthen

The persistence boundary is the most valuable next seam. Stored data should enter through validated parsers and leave through typed repositories that enforce revision and occurrence rules. This is a small improvement with a large reliability payoff.

The second seam is exercise content. Static content should become a validated data contract with media status and ownership metadata before the library expands further.

## Product assessment

The product is strongest when it is concrete and user-controlled:

- the plan focus is confirmed explicitly;
- presets can be edited;
- performance fields are optional;
- deletion explains what is preserved;
- recommendations are shown as guidance;
- the dashboard makes recurring and one-time schedule occurrences discoverable around a selected date;
- historical data is not rewritten.

The product is weakest where it implies expertise without enough evidence:

- nutrition personalization;
- exercise demonstrations;
- automatic effort progression;
- “popularity” ordering, which is curated rather than measured.

Copy should continue to distinguish recommendation from fact, and planned work from observed work.

## Priority roadmap

### Phase 0 — Make the current MVP trustworthy

1. Add runtime IndexedDB validation and a migration test harness.
2. Enforce one plan/date occurrence and fix duplicate-exercise recommendation matching.
3. Add Playwright smoke journeys and at least one real IndexedDB reload test.
4. Have nutrition rules and copy reviewed by a qualified health professional.
5. Decide whether to remove or implement the missing media script.

Exit condition: critical flows work after reload, history remains intact across plan deletion/editing, malformed/stale data fails safely, and the main browser journeys are automated.

### Phase 1 — Complete the promised content

1. Review demonstrations for all 46 exercises and replace unsuitable output.
2. Add media metadata, rights/attribution, fallback, and user-controlled playback.
3. Add content validation for focus coverage, dose kind, instructions, and media status.
4. Test focus artwork and asset paths on the deployed Pages origin.

Exit condition: every selectable exercise has reviewed written guidance and a verified usable demonstration or an explicit documented exception.

### Phase 2 — Make progression more useful without pretending certainty

1. Split observed load, dose, RIR, and adherence into separate progress signals.
2. Add duration-specific and partial-session test cases.
3. Show the evidence behind an adjustment and allow accept/skip.
4. Define weekly volume only after choosing units and recovery assumptions.
5. Add keyboard/touch alternatives for exercise ordering.

Exit condition: progression is explainable, editable, and does not collapse unlike exercises into one unsupported score.

### Phase 3 — Scale only after local use proves demand

Consider accounts, sync, backup, multi-device recovery, and server-owned data only after the local workflow demonstrates sustained value. That phase requires a new privacy model, authentication, authorization, conflict resolution, migrations, and threat model.

## Final assessment

This repository has a solid product spine and an appropriately restrained architecture. It should continue as a local-first MVP while hardening trust boundaries and completing content. The best next work is not another dashboard feature; it is validation, browser coverage, content rights, and fixing the few invariants that currently depend on UI discipline.
