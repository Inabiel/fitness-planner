# Mobile UI/UX Audit — Deferred Fixes

Audit date: 2026-09-14  
Scope: mobile layouts and interactions, with emphasis on 320px–430px phone widths.

This is an implementation backlog, not a redesign brief. Fix the items in priority order and keep the current visual language.

## Priority 1 — Fix before relying on mobile

### 1. Increase touch targets in live tracking

Current set inputs are approximately 34px high. The `Add another set` button and shared icon buttons are also below a comfortable mobile hit area.

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

### 2. Keep the live-tracking completion action available

The live-tracking modal scrolls as one surface, so `Complete & rest` / `Finish workout` can disappear below a long workout.

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

### 3. Prevent narrow-screen compression

The focus hero and plan cards retain fixed horizontal allocations at small widths. At 320px, long labels, plan names, and actions are likely to become cramped.

Affected areas:

- `src/styles.css` — `.focus-hero`, `.plan-card`, `.plan-graphic`, `.plan-card-footer`

Change:

- At a very narrow breakpoint, stack the focus illustration and copy.
- Reduce or stack the plan card illustration and content.
- Allow plan card footer actions to wrap without clipping.

Acceptance criteria:

- Verify at 320px, 360px, and 390px widths.
- No heading, label, plan name, or action is clipped or horizontally overflows.
- The primary action remains obvious and easy to tap.

### 4. Make the plan editor save bar wrap safely

The editor can show three actions at once: `Cancel`, `Save & add another`, and `Save plan`. The current sticky row does not have a mobile wrapping strategy.

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

### 5. Allow section headings and badges to wrap

Section headings use a single flex row. Long badges such as planned volume summaries can crowd headings on phones.

Affected areas:

- `src/styles.css` — `.section-heading`
- Plan detail and progress screens

Change:

- Allow heading groups to wrap at mobile widths.
- Align wrapped badges cleanly below or beside the heading.

Acceptance criteria:

- Long volume, streak, and progress badges do not overlap or force horizontal scrolling.

### 6. Improve tables for phone use

Progress tables are horizontally scrollable, but there is no indication that more columns are available. Performance data can require significant sideways scrolling.

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

### 7. Make exercise ordering touch-friendly

HTML drag-and-drop is unreliable on touch devices. The arrow fallback exists, but the controls are small and currently feel secondary.

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

### 8. Improve modal and drawer focus behavior

Dialogs and the mobile navigation drawer expose the correct dialog semantics, but focus trapping, focus restoration, and body-scroll locking are incomplete or inconsistent.

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

### 9. Improve small-text contrast and readability

Several metadata, filter, and helper labels are very small and muted. This is especially difficult on phone screens and in bright conditions.

Affected areas:

- `src/styles.css` — `.eyebrow`, `.worked-label`, `.fine-print`, filter controls, small buttons

Change:

- Darken muted text where it carries information.
- Avoid reducing important supporting text below a comfortable mobile size, roughly 12–13px.
- Verify contrast with an accessibility checker before release.

Acceptance criteria:

- Supporting labels remain legible without zooming.
- Small text meets the chosen accessibility contrast target.

### 10. Handle mobile viewport and safe-area behavior

The app uses `100vh` in loading and modal layouts, and some bottom-positioned UI does not include the iOS home-indicator inset.

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

This audit was completed from the responsive source and route structure. A real browser screenshot/click-through pass could not be completed in the development environment because the available browser binary failed to launch. The narrow-screen compression findings must therefore be confirmed during implementation.

No product code was changed as part of this audit.
