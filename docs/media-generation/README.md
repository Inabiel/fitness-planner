# Media Generation Guide

Technical reference for creating, reviewing, and integrating local image and GIF assets in fitnessPal.

## 1. Scope and principles

Use generated raster media when it improves exercise recognition or workout-plan scanning. Keep the app usable without media: written instructions, labels, and controls remain the source of truth.

Media in this project must be:

- local and bundled with the static build;
- visually consistent within its asset family;
- free of text, logos, watermarks, and distracting backgrounds;
- safe to use as educational fitness guidance, not medical instruction;
- reviewed for obvious visual defects before it is committed.

Do not create a raster asset for a visual that CSS, HTML, an icon, or an SVG can express more clearly. Do not fetch media from an external URL at runtime.

## 2. Current asset contract

The app is a Vite static client and is also deployable under a repository path on GitHub Pages. Store public media under `public/assets` and reference it with a relative URL beginning with `assets/`.

| Use | Location | Current format | Current contract |
| --- | --- | --- | --- |
| Workout-focus illustration | `public/assets/body-areas/<focus>.webp` | WebP | Square, local, optimized, opaque illustration |
| Exercise demonstration | `public/assets/exercises/<exercise-id>.gif` | GIF | 512 × 512, opaque frames, four frames, one-second frame delay, `Dispose: None`, looping |

Existing exercise GIFs use the stable exercise ID from `src/data/exercises.ts`. The filename must exactly match that ID, including kebab-case spelling. Focus illustrations are mapped explicitly in `src/features/plans/FocusIllustration.tsx`.

Use paths like:

```tsx
src="assets/exercises/barbell-back-squat.gif"
src="assets/body-areas/legs.webp"
```

Avoid `/assets/...` because an absolute root path breaks when the app is hosted below a repository path. When replacing a cached asset, increment the existing query-string version, for example `?v=3`.

## 3. Choose the asset type

### Static images

Use WebP for focus illustrations and other static artwork. Prefer a square canvas so the asset can move between onboarding, cards, and detail views without cropping the subject.

Recommended defaults:

- 512 × 512 or 768 × 768 pixels;
- sRGB color profile;
- opaque background unless transparency is required by the consuming component;
- enough contrast for light and dark surfaces;
- no baked-in text or UI labels;
- a file size target of roughly 250 KB or less for card artwork.

### GIFs

Use GIF when a short looping demonstration is more useful than a still image and compatibility with the current exercise-media component matters. GIF has a limited color palette and is not ideal for long, photographic, or high-frame-rate video.

Recommended defaults for the existing exercise component:

- 512 × 512 pixels for every frame;
- four clear phases of one movement;
- one second per frame;
- opaque frames with the same camera, scale, lighting, and background;
- infinite loop;
- `Dispose: None`, so every full frame replaces the previous frame;
- optimized palette and no unnecessary metadata.

If smooth motion or a smaller download is more important than the current compatibility contract, propose animated WebP or video as a separate UI decision. Do not silently change the format for existing consumers.

## 4. Generation brief and prompt structure

Write the brief before generating. A good brief fixes the properties that must remain stable across a media set:

1. **Subject** — exercise, equipment, or body-area concept.
2. **View** — side, front, three-quarter, or another explicit camera angle.
3. **Movement** — start and end positions, direction, and joint action.
4. **Style** — clean educational fitness illustration, flat or lightly shaded, consistent with neighboring assets.
5. **Composition** — centered subject, full body or complete equipment visible, generous safe margin, square canvas.
6. **Background** — plain, quiet, and identical across a set.
7. **Constraints** — no text, labels, logos, watermark, extra limbs, duplicate equipment, cropped joints, or unsafe anatomy.

Static image prompt template:

```text
Create a square educational fitness illustration of [SUBJECT].
Show [VIEW] with [KEY POSITION / MUSCLE EMPHASIS]. Use a clean,
minimal, consistent visual style: [STYLE], [BACKGROUND], centered full
subject, generous margins, and clear silhouette. No text, labels, logos,
watermarks, medical claims, cropped body parts, or extra objects.
```

GIF storyboard template:

```text
Create four matching square frames for a looping educational demonstration
of [EXERCISE] using [EQUIPMENT], viewed from [VIEW]. Keep the exact same
subject, camera, scale, lighting, and plain background in every frame.
Frame 1: stable starting position.
Frame 2: controlled movement into the exercise.
Frame 3: clear end or contracted position.
Frame 4: controlled return toward the starting position.
No text, arrows, logos, watermarks, cropped joints, extra limbs, or unsafe
body positions. The frames must be understandable in sequence without
animation controls.
```

For a movement where those four phases are inaccurate, describe the actual phases instead. Accuracy takes priority over forcing every exercise into the same storyboard.

## 5. GIF assembly and optimization

Generate or export frames separately when possible. This makes it easier to correct one defective pose without regenerating the whole sequence.

With ImageMagick available, a representative assembly command is:

```sh
magick frame-01.png frame-02.png frame-03.png frame-04.png \
  -resize 512x512^ -gravity center -extent 512x512 \
  -colors 256 -delay 100 -loop 0 -dispose none \
  public/assets/exercises/<exercise-id>.gif
```

The command is a starting point, not a guarantee of quality. Check the result visually and inspect its metadata:

```sh
magick identify public/assets/exercises/<exercise-id>.gif
```

Confirm that every frame is 512 × 512, the frame count is intentional, the delay is 100 hundredths of a second, the loop is infinite, and disposal is `None`. If the output has ghosting, inconsistent crops, or a distracting palette, fix the source frames before increasing compression.

For static art, convert to WebP with a quality setting appropriate to the illustration and then inspect the result at its rendered size. Keep the original source outside `public/assets` unless the project explicitly needs it; the app only needs the optimized deliverable.

## 6. Integrating an asset

### New exercise GIF

1. Confirm the exercise already has a stable ID in `src/data/exercises.ts`, or add the exercise data first.
2. Save the optimized file as `public/assets/exercises/<exercise-id>.gif`.
3. Keep the existing media URL pattern in `PlanEditor.tsx` and `PlanDetail.tsx`.
4. Use meaningful alternative text such as `"<Exercise name> movement demonstration"`.
5. Keep the written instructions accurate even if the GIF fails to load.

### New focus illustration

1. Confirm the focus value exists in the `WorkoutFocus` union and has a label.
2. Save the optimized file as `public/assets/body-areas/<focus>.webp`.
3. Add the mapping in `src/features/plans/FocusIllustration.tsx`.
4. Use descriptive alternative text that names the focus, not the filename.
5. Check the illustration in onboarding preview, plan cards, and plan detail.

### Path and loading rules

- Use relative `assets/...` URLs.
- Use `loading="lazy"` for below-the-fold exercise media.
- Keep above-the-fold artwork fast and visually stable with explicit CSS dimensions.
- Do not add a runtime fetch, remote CDN dependency, or base64 blob to component code.
- If a replacement appears stale in a browser, update the small query-string cache version used by the component.

## 7. Review checklist

Before committing media, verify:

- [ ] Filename exactly matches the domain ID and uses lowercase kebab-case.
- [ ] Dimensions and frame count match the consuming component.
- [ ] The subject is centered, complete, and not clipped at card size.
- [ ] Movement is physically understandable and does not show an obvious unsafe pose.
- [ ] All frames use the same camera, scale, background, and subject identity.
- [ ] There is no text, logo, watermark, accidental anatomy, or unrelated object.
- [ ] The asset is local, optimized, and included in the production build.
- [ ] Alt text and written instructions remain useful without the asset.
- [ ] The asset has a documented source, generation date, and review status when provenance matters.
- [ ] `npm run lint`, `npm test -- --run`, and `npm run build` pass.

For exercise movement, visual generation is not expert validation. Mark generated demonstrations as educational aids and route safety-sensitive content through a qualified human review before presenting it as authoritative guidance.

## 8. Reusable media request

Copy this block into a future creation task:

```text
Asset type: [static image | GIF]
Asset ID / output path: [exact path]
UI location: [component or screen]
Subject: [exercise, equipment, or focus]
View: [camera angle]
Style: [match existing asset family]
Canvas: [width × height]
Animation: [frame count, delay, loop, disposal] or N/A
Must preserve: [camera, background, silhouette, equipment, colors]
Must avoid: text, logos, watermarks, cropping, unsafe anatomy, clutter
Acceptance checks: [visual checks + relevant test commands]
```
