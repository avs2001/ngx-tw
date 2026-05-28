# Progress-Bar — Production-Grade Review

**Entry point:** `ngx-tw/progress-bar`
**Files:** `projects/ngx-tw/progress-bar/`

## Snapshot
- Selectors: `tw-progress-bar` (element, `ProgressBarComponent`)
- Public classes/directives: `ProgressBarComponent`
- Inputs: 6 (`value`, `variant`, `color`, `size`, `label`, `options`) — with `options` bundling 7 sub-fields (`min`, `max`, `segments`, `showValue`, `formatter`, `ariaLabel`, `ariaLabelledby`)
- Outputs: 0
- Slots: 0
- CVA: no (not a form control — read-only progress indicator)
- `tv()` config: yes, multi-slot (`root`, `header`, `label`, `valueText`, `rail`, `fill`, `segmentList`, `segment`)
- A11y CDK utilities used: none — pure semantic markup with `role="progressbar"` + ARIA value attributes

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `value` | `number \| null \| undefined` | `null` | yes | `null`/`undefined` → indeterminate |
| `variant` | `ProgressBarVariant` | `'linear'` | yes | `'linear' \| 'segmented'` |
| `color` | `TwColor` | `'primary'` | yes |  |
| `size` | `ProgressBarSize` | `'md'` | yes | Local `'sm' \| 'md' \| 'lg'` (not `TwSize`) |
| `label` | `string \| undefined` | `undefined` | yes |  |
| `options` | `ProgressBarOptions \| undefined` | `undefined` | yes | Bundled non-visual config |

### Findings
- **6 inputs — within the codified 5–6 cap.** Compliant. The bundled-`options` reshape is the canonical pattern: it consolidates `min`/`max`/`segments`/`showValue`/`formatter`/`ariaLabel`/`ariaLabelledby` (7 axes) into one input. The review brief explicitly asked: "check whether progress-bar has bloated inputs and recommend reshape if so" — the reshape is already done. No further reshape needed.
- `size` uses a local `ProgressBarSize` (`'sm' | 'md' | 'lg'`) rather than the shared `TwSize`. This is intentional — progress-bar thickness has only three meaningful steps. Compliant.
- All inputs carry one-line JSDoc — compliant.
- All booleans default to `false` (`options.showValue`). Compliant.
- `value: null` indicates indeterminate; the JSDoc documents this. Good.
- `options` is a `ProgressBarOptions | undefined` input — the only oddity is consumers cannot partially update one field without re-passing the whole object (no `linkedSignal` merging). Acceptable trade-off for the smaller API surface.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- No outputs — appropriate for a read-only indicator. Compliant.

## Customization surface
- ng-content slots: none.
- Structural directives: none.
- Fallback content: n/a.
- Class merging: yes — `twMerge: true` (line 107).
- Findings:
  - No projection means consumers cannot inject a custom valueText (e.g., a tw-icon with the value) or replace the label markup. The `label` input + `options.formatter` handle the standard cases.
  - Consider adding two optional named slots: `[slot='label']` (rich label content), `[slot='value']` (rich value-readout content beside the label). Optional — current input surface is sufficient for the documented use cases.

## CSS / Styling
- tailwind-variants: yes, multi-slot.
- twMerge: yes (line 107).
- Semantic tokens vs raw palette: compliant. The `FILL_COLORS` lookup (lines 57–66) uses `bg-{role}-500`/`bg-fg` only.
- Surface/fg/border tokens usage:
  - `text-fg-muted` for label/value text (lines 74–75). Compliant.
  - `bg-surface-muted` for rail and unfilled segments (lines 76, 301). Compliant.
  - No border tokens used (rail is filled, not outlined). Acceptable.
- Radius compliance: `rounded-full` everywhere (rail, fill, segment). Compliant.
- Spacing compliance: `gap-3` header (line 73); `gap-1` segment list (line 79); `gap-1.5` root when has header (line 96). All within the codified gap scale. Compliant.
- Typography compliance:
  - Label `text-xs text-fg-muted` (line 74). Per the codified typography table, label/header should be `text-sm font-medium`. Progress-bar uses `text-xs` (one step smaller) without `font-medium`. This is unconventional but defensible because the progress bar is a *decorative* indicator (not a form-control label) and labels above progress bars often need to be subdued. P2 — either accept the deviation (and add a documentation note) or align with `text-sm font-medium`.
  - Value text `text-xs text-fg-muted font-medium tabular-nums` (line 75). Compliant for caption/metadata.
- Focus rings compliance: n/a (no interactive elements).
- Dark mode handling: solid `bg-{role}-500` rebrands cleanly. No explicit `dark:` overrides needed. Compliant.
- Transitions:
  - Fill `transition-[width] duration-200 motion-reduce:transition-none` when determinate (line 94). Compliant — specific property, reduced-motion respected.
  - Indeterminate fill uses `animate-progress-bar-indeterminate` (line 93) — a custom animation referenced as a Tailwind utility. Compliant pattern (theme owns the keyframe).
- Shadows: none. Compliant.
- Icon sub-scale: n/a.
- Animations: `animate-progress-bar-indeterminate` keyframe is correctly defined in `theme/_base.css:178-184` with a `0% → -100%`, `100% → 400%` sweep and a `prefers-reduced-motion: reduce` fallback at line 308 that pins the bar at `translateX(35%)` with zero duration. Compliant.
- Findings:
  - Label uses `text-xs` instead of the codified `text-sm font-medium` — decide whether the deviation is intentional and document.

## Accessibility
- ARIA roles/attributes:
  - `role="progressbar"` on the rail (line 154) or segment list (line 172). Compliant.
  - `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`/`aria-busy` correctly bound, with `aria-valuenow`/`aria-valuetext` set to `null` for indeterminate (lines 156–160). Compliant.
  - `aria-label`/`aria-labelledby` correctly resolved through `resolvedAriaLabel`/`resolvedAriaLabelledby` (lines 264–275). Compliant.
- Keyboard support: n/a (non-interactive).
- CDK a11y utilities: none — appropriate.
- Label/hint/error wiring: external label via `aria-labelledby` (line 273). Compliant.
- Dev-mode accessible-name warning: present (lines 307–319). Uses an `effect()` rather than `afterNextRender` — works but emits once at the first read. Compliant.
- AXE risks: low. One subtle issue: when `value` is set but the consumer also provides `formatter`, `aria-valuetext` carries the formatted string. Screen readers read `aria-valuetext` if set, otherwise `aria-valuenow` + min/max. This is the spec — compliant.

### Findings
- ARIA implementation is correct for both determinate and indeterminate states.
- The dev-mode warning uses `effect()` with a `warned` flag rather than `afterNextRender`. The pattern works but is fragile (a future refactor that swaps Signal sources could re-trigger). Consider replacing with `afterNextRender` for consistency with checkbox/radio/select. P2.

## Form integration (if applicable)
- CVA: n/a.
- ErrorStateMatcher: n/a.
- form-field interop: n/a.
- Findings: nothing required — progress bar is decorative/read-only.

## Tests
- Spec file: yes (`progress-bar.spec.ts`, 425 lines).
- Coverage breakdown:
  - Rendering: progressbar element, indeterminate default, default min/max, bare-component test (lines 73–110).
  - Determinate: aria-valuenow, fill width at 0/50/100, clamping below min, clamping above max, custom min/max (lines 112–175).
  - Indeterminate: aria-valuenow omitted, aria-busy true, animate class present, switching back to determinate (lines 177–214).
  - Variants: linear + segmented; segment count; filled cell count at value=40/100/0 (lines 216–273).
  - Colors: every TwColor; specific class assertion for success (lines 275–296).
  - Sizes: sm/md/lg with thickness class assertion (lines 298–313).
  - `options.showValue`: text rendered, hidden when false, updates on value change (lines 315–346).
  - `options.formatter`: visible text and `aria-valuetext` use custom formatter (lines 348–360).
  - Accessible name: label → aria-labelledby; ariaLabel → aria-label; ariaLabelledby → aria-labelledby; dev-mode warning fires; suppressed by label and ariaLabel (lines 362–423).
- Vitest issues: no `fakeAsync`/`tick`. Uses `fixture.componentRef.setInput`, `vi.spyOn(console, 'warn')`. Compliant.
- Findings:
  - Excellent coverage.
  - One missing test: there is no assertion that the `animate-progress-bar-indeterminate` *keyframe* actually exists and animates the element. Hard to test in jsdom, but a JSDOM-friendly approach is to assert `getComputedStyle(fill).animationName === 'progress-bar-indeterminate'`. This would have caught the missing-keyframe bug noted above.
  - No test for `options.segments` with values like `0`, `1`, or negative — `segmentIndices` (line 259) uses `Math.max(1, Math.floor(...))` so a 0 or negative count falls back to 1. Worth a test.
  - No test for the relationship between `progressRatio` and segmented fill — e.g., `value=44` with 5 segments fills 2 (44/100 = 0.44 → cells `1, 2` filled since `2/5 = 0.4 ≤ 0.44 < 0.6 = 3/5`). Spec covers 40 explicitly but not the boundary case 44/45.

## Gaps & lacks
1. **Label typography deviates from codified `text-sm font-medium`.** Currently `text-xs`. Either accept the deviation or align. P2.
2. **Dev-mode warning uses `effect()` instead of `afterNextRender`.** Consistency drift; works today. P2.
3. **No content projection slots.** Optional enhancement.
4. **No test covering `options.segments=0` or computed-style assertion of the indeterminate animation.** P2.
5. **`options` is a single mutable object** — partial overrides require re-passing the whole object. Acceptable trade-off, but a `mergedOptions` helper for consumers may be nice to ship in the public API. P2.

## Concrete recommendations (deep-dive prompt body)

### Goal
Decide and document the label typography stance, swap the dev-mode warning to `afterNextRender` for consistency, and close minor test/customization gaps. The input surface is already correctly reshaped — no further refactor needed. The indeterminate keyframe is correctly defined.

### Tasks
1. **Resolve label typography** — pick a stance and document it.
   - File(s): `projects/ngx-tw/progress-bar/progress-bar.ts:74`
   - Why: Codified typography table specifies `text-sm font-medium` for titles/labels; progress-bar uses `text-xs` (no weight). Either deviation is fine but must be intentional.
   - Change: Recommended — change to `text-sm font-medium text-fg-muted` to match other component labels. If keeping `text-xs`, add a one-line inline comment explaining "decorative-indicator label sits one step below form-control labels" and update CLAUDE.md typography table to add the exception.
   - Acceptance: Demo overview matches the updated standard; no AXE regression.

2. **Swap dev-mode warning to `afterNextRender`** — match the library convention.
   - File(s): `projects/ngx-tw/progress-bar/progress-bar.ts:307-319`
   - Why: Other components (radio, slider, select) use `afterNextRender` for the one-shot dev-mode accessible-name warning. The current `effect()` + `warned` flag is fragile.
   - Change: Replace the constructor `effect()` with `afterNextRender(() => { if (isDevMode() && noName) console.warn(...) })`.
   - Acceptance: Existing spec lines 395–423 still pass.

3. **Add edge-case tests for `options.segments`** — harden segment math.
   - File(s): `projects/ngx-tw/progress-bar/progress-bar.spec.ts:216-273`
   - Why: `segmentIndices` (line 259) defends against `0` and negatives by `Math.max(1, ...)`. Currently untested.
   - Change: Add cases: `segments=0` → one cell rendered; `segments=-3` → one cell rendered; `segments=3.7` → three cells (`Math.floor`); `value=44` with `segments=5` and `color='success'` → exactly 2 filled cells (boundary).
   - Acceptance: Tests pass.

4. **Add a computed-style test for the indeterminate animation** — guard the keyframe.
   - File(s): `projects/ngx-tw/progress-bar/progress-bar.spec.ts:177-214`
   - Why: Indeterminate animation is correctly wired today; a guard test would catch a future regression that removed or renamed the keyframe.
   - Change: After `setInput('value', null)`, query the fill and assert `getComputedStyle(fill).animationName` contains `'progress-bar-indeterminate'`. (jsdom returns the literal animation name; verified pattern used elsewhere in the library.)
   - Acceptance: Test passes against the current theme.

5. **Optional: add `[slot='label']` and `[slot='value']` content slots** — richer customization.
   - File(s): `projects/ngx-tw/progress-bar/progress-bar.ts:138-187`
   - Why: Some consumers want to project an icon next to the label (e.g., a check when complete) or a "3.2 MB / 10 MB" with mixed styling.
   - Change: Replace label/value spans with `<ng-content select="[slot='label']">{{ label() }}</ng-content>` and `<ng-content select="[slot='value']">{{ formattedValue() }}</ng-content>`. Maintain existing string-input fallbacks. Add tests.
   - Acceptance: Examples demonstrate icon-in-label and unit-suffix-in-value.

### Out of scope
- Adding a `bufferValue` for buffered-media progress (could be a follow-up).
- Striped/animated variants (decorative, low priority).
- Vertical orientation (not a documented use case for progress bars).
- Form integration (progress bar is read-only).

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- progress-bar`
- Visual check: `http://localhost:4600/progress-bar/examples` (especially indeterminate animation)
- A11y: `npm run e2e:a11y` and verify AT announces "0 of 100" / "loading" appropriately.

## Priority
**P2** — Implementation is already production quality: 6-input surface complies with the cap, ARIA wiring is correct, indeterminate keyframe is correctly defined and reduced-motion-safe. Remaining work is polish (label typography stance, dev-warning consistency, optional projection slots, hardening tests).
