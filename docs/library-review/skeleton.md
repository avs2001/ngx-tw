# Skeleton — Production-Grade Review

**Entry point:** `ngx-tw/skeleton`
**Files:** `projects/ngx-tw/skeleton/`

## Snapshot
- Selectors: `tw-skeleton` (element)
- Public classes/directives: `SkeletonComponent`
- Inputs: 6 (`shape`, `animation`, `width`, `height`, `lines`, `announce`)
- Outputs: 0
- Slots: 0 (no `<ng-content>`)
- CVA: no
- `tv()` config: yes, slots (`root`, `container`, `row`, `sr`)
- A11y CDK utilities used: none (uses raw `role="status"` / `aria-live`)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `shape` | `SkeletonShape` (`'text' \| 'rectangle' \| 'circle'`) | `'text'` | yes | |
| `animation` | `SkeletonAnimation` (`'pulse' \| 'wave' \| 'none'`) | `'pulse'` | yes | |
| `width` | `string \| number \| undefined` | `undefined` | yes | Numbers → `px`; strings pass through |
| `height` | `string \| number \| undefined` | `undefined` | yes | Same |
| `lines` | `number` | `1` | yes | text-shape only |
| `announce` | `boolean` | `false` | yes | Uses `booleanAttribute` transform |

### Findings
- All inputs have one-line JSDoc with default — compliant.
- 6 inputs sits at the cap. No exception needed.
- All booleans default to `false` — compliant.
- `booleanAttribute` transform on `announce` (line 108) is the canonical way to accept `<tw-skeleton announce>` without `[announce]="true"`. Excellent DX.
- `width`/`height` accept both `number` and `string` — pragmatic but adds a coercion step (`dimensionToCss` helper at line 44). Consumers writing `<tw-skeleton width="50%">` and `<tw-skeleton [width]="200">` both work. Documented in JSDoc.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- No outputs — appropriate for a static placeholder.

## Customization surface
- ng-content slots: none. The skeleton is purely chrome.
- Structural directives: none.
- Fallback content: not applicable.
- Class merging: yes — `twMerge: true` (line 42).
- Findings:
  - No projection means consumers cannot decorate the skeleton with custom content. Acceptable for a single-purpose placeholder.

## CSS / Styling
- tailwind-variants: yes; slots — `root`, `container`, `row`, `sr`.
- twMerge: yes.
- Semantic tokens vs raw palette: compliant. `bg-surface-muted` (lines 19, 21) — perfect use of the surface token. No raw palette references.
- Surface/fg/border tokens usage: only `bg-surface-muted`. The wave-overlay uses a hand-rolled gradient pseudo-element defined in `theme/_base.css:162-173` — uses `linear-gradient(...)` with raw `rgba()` values. FLAG: the wave gradient is defined in theme CSS, not the component, so it falls outside the component-styling rules. But if dark mode is in play, the wave's `rgba(255 255 255 / 0.5)` highlight may look wrong on a dark skeleton background. Open question for the deep-dive: confirm the wave gradient adapts.
- Radius compliance: `rounded-md` (text/rectangle, line 26–27), `rounded-full` (circle, line 28). Compliant.
- Spacing compliance: `gap-2` on the multi-line container (line 21). Compliant (codified standard gap value).
- Typography compliance: not applicable (skeleton has no text).
- Focus rings compliance: not applicable.
- Dark mode handling: `bg-surface-muted` adapts via theme tokens. The wave overlay in `_base.css` does NOT have `dark:` adjustments (verified). FLAG: dark-mode wave may need a separate keyframe / linear-gradient using `currentColor` or a `dark:` variant in the theme CSS.
- Transitions: none on the component itself — animations are CSS keyframes (`skeleton-pulse` / `skeleton-wave`) defined in `theme/_base.css`.
- Shadows: none — appropriate.
- Icon sub-scale: not applicable.
- Findings:
  - The fix-up for `lines === 1` switches the root to single-shape mode; for `lines > 1` switches to a flex column container that suppresses the animation on the root and applies it to each row. The class swap at line 119–122 is correct but the logic is split between `mode()` (template-driving signal) and `rootClasses()` (style-driving computed) — slightly hard to follow. Consider documenting in code comments.
  - The wave animation in `_base.css` uses raw `rgba(255 255 255 / 0.5)` (verified earlier). In dark mode the wave will be too bright. Theme-level fix needed.

## Accessibility
- ARIA roles/attributes:
  - Default: `aria-hidden="true"` (line 75) — invisible to AT.
  - When `announce=true`: `role="status"`, `aria-busy="true"`, `aria-live="polite"`, plus an `sr-only` "Loading" label (lines 76–86).
- Keyboard support: not focusable — correct.
- CDK a11y utilities: not used. Could use `LiveAnnouncer` for the announce path, but the current approach (live region in the DOM) is equivalent and simpler.
- Labels/descriptions wiring: hardcoded `"Loading"` (line 87) — not localisable. Same issue as Badge's dismiss label, Avatar's group label.
- AXE risks: none expected.
- Findings:
  - Hardcoded `"Loading"` label — needs a localisable input (e.g., `loadingLabel`).
  - Multi-line skeleton renders no sr-only label per row (correct — the host owns the announcement).
  - When `announce=true` + `lines > 1`, the announcement reads only the host's "Loading" — not per-row. Correct.

## Form integration (if applicable)
- CVA: not applicable.

## Tests
- Spec file: yes (`skeleton.spec.ts`, 297 lines).
- Coverage breakdown:
  - rendering: default, default classes, aria-hidden by default, no sr-only by default.
  - shape: text, rectangle, circle.
  - animation: pulse, wave, none.
  - width/height: numeric pixel coercion, string passthrough, undefined omission.
  - lines: single mode, multi-row mode, host container shift, last-row width shortening, animation propagation, ignored for rectangle/circle, width on non-last rows.
  - announce: ARIA toggle, sr-only label, toggle back.
  - non-interactive: no tabindex.
- Vitest-specific issues: none.
- Findings: spec is comprehensive — among the best in the library. Few real gaps.
  - Missing: no test for `aria-live="polite"` precedence (covered via `announce` test, but the value `polite` is asserted).
  - Missing: no test asserting the `sr-only` label's text changes after a `loadingLabel` input (which doesn't exist yet — see recommendations).

## Gaps & lacks
1. Hardcoded `"Loading"` label is not localisable — add a `loadingLabel` input.
2. Dark-mode wave animation in `theme/_base.css` uses raw `rgba(255 255 255 / 0.5)` — may render poorly on dark backgrounds. Theme fix.
3. The internal `mode()` / `rootClasses()` split is correct but worth a comment for future maintainers.
4. Width/height accept `string | number | undefined` — clean but uses union typing. Worth verifying Compodoc renders the type table correctly.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal
Localise the loading label and ensure dark-mode wave animation is theme-driven.

### Tasks
1. **Add a `loadingLabel` input** — l10n compliance.
   - File(s): `projects/ngx-tw/skeleton/skeleton.ts:107-108` (`announce` input area), `projects/ngx-tw/skeleton/skeleton.ts:86-88` (template sr-only span)
   - Why: Hardcoded English strings block l10n. Library API must allow consumer override.
   - Change: add `readonly loadingLabel = input('Loading');` with JSDoc. Bind `{{ loadingLabel() }}` in the template instead of the literal "Loading".
   - Acceptance: spec adds `it('uses the custom loadingLabel in the sr-only span')`; default text remains "Loading".

2. **Make wave animation dark-mode aware** — theme update.
   - File(s): `projects/ngx-tw/theme/_base.css:162-173` (`.skeleton-wave::after` gradient)
   - Why: Current gradient uses `rgba(255 255 255 / 0.5)`, fixed for light backgrounds. On dark themes the shimmer will be too bright.
   - Change: parameterise via a CSS variable. Define `--skeleton-wave-highlight` in `_semantic.css` (default `rgba(255 255 255 / 0.5)`) and `_dark.css` (`rgba(255 255 255 / 0.1)` or similar). Update `.skeleton-wave::after` to use `var(--skeleton-wave-highlight)` instead of the literal `rgba(...)`.
   - Acceptance: dark-mode demo at `/skeleton` shows a subtler wave; light mode unchanged; the variable is defined in both theme variants.

3. **Add maintainer comments to `mode()` and `rootClasses()` split** — readability.
   - File(s): `projects/ngx-tw/skeleton/skeleton.ts:110-127` (mode + rootClasses)
   - Why: The single-vs-multi-line logic spans two computeds and depends on a shape gate. A short comment block clarifies intent.
   - Change: add a comment above `mode`: "Single-line text and non-text shapes render the host as the placeholder itself; multi-line text renders the host as a flex-column container with N child placeholders."
   - Acceptance: a 2-line comment is added; no behaviour change.

4. **Document `width`/`height` coercion behaviour** — JSDoc clarity.
   - File(s): `projects/ngx-tw/skeleton/skeleton.ts:98-102` (width/height JSDoc)
   - Why: JSDoc already covers it, but a concrete `@example` is missing.
   - Change: add `@example` lines: `[width]="200"  // → 200px`, `[width]="'50%'"  // → 50%`.
   - Acceptance: Compodoc renders examples on the API table.

5. **Test gap: loadingLabel** — covers the new input.
   - File(s): `projects/ngx-tw/skeleton/skeleton.spec.ts`
   - Why: New input must be covered.
   - Change: under the `announce` describe block, add `it('uses the custom loadingLabel')`.
   - Acceptance: one new passing test.

### Out of scope
- Replacing the rectangle/text shape merge — they share styling and are intentionally similar.
- Adding `<ng-content>` to allow overlay content — out of scope for a pure placeholder.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- skeleton`
- Visual check: demo app at `http://localhost:4600/skeleton` (both light + dark themes)
- A11y: `npm run e2e:a11y`

## Priority
**P2** — Skeleton is well-built and well-tested. l10n input + dark-mode theme polish are the only material asks.
