# Mobile UI/UX Audit — Status and Remaining Work

Audit date: 2026-09-15
Scope: mobile layouts and interactions, with emphasis on 320px–430px phone widths.

This started as an implementation backlog, not a redesign brief. Source-level fixes landed in the responsive stylesheet; the remaining confidence gap is real browser/device verification. Keep the current visual language.

## Priority 1 — Fix before relying on mobile

### 1. Increase touch targets in live tracking — implemented at source level

Mobile rules now give set inputs, compact buttons, modal close controls, date controls, reorder/delete controls, and snackbar dismissal controls a 44px target where they are used.

Affected areas:

- `src/styles.css` — `.set-row input`, `.button.small`, `.icon-button`
- `src/features/sessions/SessionExercise.tsx`
- `src/features/plans/LiveTrackingModal.tsx`

Change:

- Give editable inputs and important action buttons at least a 44px hit area on mobile.
- Keep the visual treatment compact with padding or an inner visual element if needed.
- Include date navigation, modal close, reorder, delete, and snackbar dismiss controls.

Acceptance criteria:

- A user can comfortably tap set inputs and `Add another set` with one thumb.
- No important mobile control is smaller than approximately 44px × 44px.
- The compact visual style is preserved.

### 2. Keep the live-tracking completion action available — implemented at source level

The live-tracking footer is sticky inside the scrollable modal, with bottom scroll padding and safe-area spacing so `Complete & rest` / `Finish workout` stays reachable.

Affected areas:

- `src/features/plans/LiveTrackingModal.tsx`
- `src/styles.css` — live-tracking modal and footer styles

Change:

- Make the live-tracking footer sticky inside the modal.
- Preserve enough bottom spacing for the mobile safe area and keyboard.
- Ensure the footer does not cover the last set row.

Acceptance criteria:

- The completion action remains reachable while scrolling through exercises.
- The last input remains visible above the footer when focused.
- The footer works at 320px width and with extra sets.

### 3. Prevent narrow-screen compression — implemented at source level

At very narrow widths, the focus hero and plan cards stack their fixed visual/content areas. Dashboard schedule cards, program rotation previews, and modal headings also constrain long content so it wraps instead of forcing horizontal overflow.

Affected areas:

- `src/styles.css` — `.focus-hero`, `.plan-card`, `.plan-graphic`, `.plan-card-footer`
- `src/styles.css` — `.schedule-list`, `.schedule-card`, `.rotation-preview-row`, modal headers

Change:

- At a very narrow breakpoint, stack the focus illustration and copy.
- Reduce or stack the plan card illustration and content.
- Allow plan card footer actions to wrap without clipping.
- Constrain schedule grid items to the available column width and wrap long workout names.

Acceptance criteria:

- Verify at 320px, 360px, and 390px widths.
- No heading, label, plan name, or action is clipped or horizontally overflows.
- The primary action remains obvious and easy to tap.

### 4. Make the plan editor save bar wrap safely — implemented at source level

The sticky row wraps its actions on mobile and places the primary save action on its own row when needed, with safe-area bottom padding.

Affected areas:

- `src/features/plans/PlanEditor.tsx`
- `src/styles.css` — `.sticky-save`

Change:

- Allow the action row to wrap, or place the primary save action on its own full-width row.
- Keep the sticky bar above the safe-area inset.

Acceptance criteria:

- All actions remain visible and tappable at 320px.
- The primary save action is never pushed off-screen.
- The bar does not obscure form fields or validation messages.

## Priority 2 — Improve mobile usability and accessibility

### 5. Allow section headings and badges to wrap — implemented at source level

Mobile section headings wrap and constrain their children so long badges do not crowd the heading or force horizontal scrolling.

Affected areas:

- `src/styles.css` — `.section-heading`
- Plan detail and progress screens

Change:

- Allow heading groups to wrap at mobile widths.
- Align wrapped badges cleanly below or beside the heading.

Acceptance criteria:

- Long volume, streak, and progress badges do not overlap or force horizontal scrolling.

### 6. Improve tables for phone use — implemented at source level

Progress tables remain horizontally scrollable, now show a `Swipe to see more` hint on mobile, and keep their first column sticky for context.

Affected areas:

- `src/features/progress/Progress.tsx`
- `src/styles.css` — `.data-table-wrap`

Change:

- Keep horizontal scrolling as the minimal solution, but add a clear mobile hint such as `Swipe to see more`.
- If the table remains difficult to use after testing, convert rows to stacked mobile cards.

Acceptance criteria:

- Users understand that the table scrolls horizontally.
- The first column remains understandable while scrolling.
- No table content is clipped permanently.

### 7. Make exercise ordering touch-friendly — implemented at source level

Arrow controls provide the touch fallback, and the shared mobile icon-button target makes them tappable. Drag-and-drop remains available for pointer devices; touch-only verification is still pending.

Affected areas:

- `src/features/exercises/ExerciseOrder.tsx`
- `src/styles.css` — exercise-order controls

Change:

- Make up/down controls at least 44px on mobile.
- Treat those controls as the primary mobile interaction.
- Keep drag-and-drop for pointer devices only if it remains useful.

Acceptance criteria:

- A user can reorder a list entirely by touch without dragging.
- Reordering gives immediate, visible feedback.

### 8. Improve modal and drawer focus behavior — implemented in shared focus hook

The shared dialog focus hook moves focus into dialogs/drawers, traps Tab navigation, restores the opening element, locks body scrolling, and handles Escape. Real browser and screen-reader verification is still pending.

Affected areas:

- `src/shared/ui.tsx`
- `src/features/plans/LiveTrackingModal.tsx`
- Other confirmation and editor modals

Change:

- Move focus into the opened modal/drawer.
- Keep keyboard focus inside it while open.
- Restore focus to the opening control on close.
- Lock background scrolling while a modal or drawer is open.
- Keep Escape and close-button behavior consistent.

Acceptance criteria:

- Keyboard and screen-reader users cannot accidentally interact with the page behind an open modal.
- Closing a modal returns focus to the triggering control.
- Mobile background content does not scroll behind the drawer or modal.

### 9. Improve small-text contrast and readability — improved at source level

Mobile overrides darken and enlarge key eyebrow, helper, filter, status, and worked-label text. A measured contrast audit is still pending.

Affected areas:

- `src/styles.css` — `.eyebrow`, `.worked-label`, `.fine-print`, filter controls, small buttons

Change:

- Darken muted text where it carries information.
- Avoid reducing important supporting text below a comfortable mobile size, roughly 12–13px.
- Verify contrast with an accessibility checker before release.

Acceptance criteria:

- Supporting labels remain legible without zooming.
- Small text meets the chosen accessibility contrast target.

### 10. Handle mobile viewport and safe-area behavior — implemented at source level

Viewport-sensitive surfaces use `100dvh` fallbacks and safe-area insets. Mobile modal dialogs reserve space below the app/onboarding top bar, remain scrollable, and keep fixed actions above the home indicator.

Affected areas:

- `src/index.html`
- `src/styles.css` — viewport-height layouts, snackbar, modal and sticky actions

Change:

- Prefer `100dvh` with a fallback where viewport height matters.
- Add `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` where fixed UI can meet a notch or home indicator.
- Check the mobile header and snackbar in standalone/PWA-like display mode.

Acceptance criteria:

- No fixed control is hidden behind the browser UI or iPhone home indicator.
- Modal content remains usable when the browser address bar expands or collapses.

## Verification status

Automated checks pass: `npm run build`, `npm run lint`, and `npm test` (37 tests). No Playwright specs exist yet, and no real browser/device pass was run.

## Verification checklist

Before marking this backlog complete, test at minimum:

- 320px, 360px, and 390px viewport widths.
- Onboarding and profile editing.
- Dashboard date navigation and mobile drawer.
- Plans, plan detail, plan creation, and plan editing.
- Live tracking with a long workout and at least one added set.
- Session detail and history detail.
- Progress tables.
- Exercise ordering using touch only.
- Every modal open, close, Escape action, and scroll behavior.
- Keyboard focus order and focus restoration.
- iOS Safari or an equivalent safe-area emulator.

## Audit limitation

The responsive status above is based on source inspection and automated project checks. The 320px, 360px, and 390px layouts, mobile modal scrolling/header offsets, keyboard focus, touch controls, and iOS safe-area behavior still need a real browser/device pass before this audit is closed.
