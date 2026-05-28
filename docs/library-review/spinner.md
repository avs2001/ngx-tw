# Spinner — Production-Grade Review

**Entry point:** `ngx-tw/spinner`
**Files:** `projects/ngx-tw/spinner/`

## Snapshot
- Selectors: `tw-spinner` (element)
- Public classes/directives: `SpinnerComponent`
- Inputs: 5 (`variant`, `color`, `size`, `track`, `label`)
- Outputs: 0
- Slots: 0 (no `<ng-content>`)
- CVA: no
- `tv()` config: yes, slots (`root`, `svg`, `track`, `stroke`, `dots`, `bars`, `bar`, `dot`, `srLabel`)
- A11y CDK utilities used: none (raw `role="status"` + `aria-live`)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `variant` | `SpinnerVariant` (`'circular' \| 'dots' \| 'bars'`) | `'circular'` | yes | |
| `color` | `SpinnerColor` (`TwColor \| 'current'`) | `'current'` | yes | `current` inherits text color — important for composition |
| `size` | `SpinnerSize` (`TwSize \| 'inherit'`) | `'md'` | yes | `inherit` → `size-[1em]` |
| `track` | `boolean` | `true` | yes | Codified `true`-default exception |
| `label` | `string` | `'Loading'` | yes | Hardcoded English default |

### Findings
- All inputs have one-line JSDoc with defaults — compliant.
- 5 inputs — within cap.
- `track` defaults to `true` (line 139) — codified exception per CLAUDE.md: "without the track ring the spinner reads as a partial arc, not a loading indicator". JSDoc on line 138 explains it. Compliant with the codified exception list.
- `label` defaults to hardcoded English `"Loading"` — same l10n issue as other components, but here it IS the input so consumers can override directly. Acceptable.
- Spinner extends `TwColor` with `'current'` (matches Icon) and `TwSize` with `'inherit'`. Both are justified extensions for composition use cases.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- No outputs — appropriate for a loading indicator.

## Customization surface
- ng-content slots: none. Variant-driven rendering of SVG, dots, or bars.
- Structural directives: none.
- Fallback content: not applicable.
- Class merging: yes — `twMerge: true` (line 57).
- Findings:
  - No projection means consumers can't customize the spinner glyph beyond the three variants. For specialised loading indicators (branded), consumers compose their own — acceptable.

## CSS / Styling
- tailwind-variants: yes, slots — `root`, `svg`, `track`, `stroke`, `dots`, `bars`, `bar`, `dot`, `srLabel`.
- twMerge: yes.
- Semantic tokens vs raw palette: compliant. Lines 32–42 use `text-{role}-500`; neutral uses `text-fg-muted` (line 37). `current` uses no class (lines 33).
- Surface/fg/border tokens: neutral uses `text-fg-muted` correctly.
- Radius compliance: not applicable (spinner is SVG/shape-based).
- Spacing compliance: `gap-1` on dots and bars containers (lines 25–26) — compliant.
- Typography compliance: not applicable.
- Focus rings compliance: not applicable (non-interactive).
- Dark mode handling: relies on semantic tokens + `currentColor` — automatically dark-aware. Compliant.
- Transitions: `motion-reduce:animate-none` on the SVG (line 22) — respects reduced motion. The dot/bar animations are also covered in `theme/_base.css:303-318`.
- Shadows: none — appropriate.
- Icon sub-scale: `size-3` (xs), `size-4` (sm), `size-5` (md), `size-6` (lg), `size-8` (xl), `size-[1em]` (inherit). Same scale as Icon. Same documentation reconciliation point.
- Findings:
  - The SVG uses `stroke-dasharray="60" stroke-dashoffset="40"` to render a partial arc (lines 105–106). These are hardcoded magic numbers; for an `r=10` circle, circumference ≈ 62.83. A dasharray of 60 creates a near-complete dash; offset of 40 reveals 20 of the 60 — about a 1/3 arc. Visually fine but undocumented. Add an inline comment.
  - The dots/bars animations use `.tw-spinner-dot`/`.tw-spinner-bar` classes defined in `theme/_base.css` (lines 119–141). These are component-specific theme classes — acceptable but creates coupling between component and theme. The library convention is to put keyframe-named classes in the theme (per CLAUDE.md "Where keyframe definitions live"). Compliant.
  - `size-[1em]` (line 49) is an arbitrary value — but `size-{N}` doesn't express "match parent font size". Justified; add a comment ("`1em` so the spinner scales with the surrounding font when used inline with text").

## Accessibility
- ARIA roles/attributes: `role="status"`, `aria-live="polite"` on host (lines 80–81). SVG/dots/bars are `aria-hidden="true"` (lines 87, 111, 118). `sr-only` label spans rendered with the `label` text (line 125).
- Keyboard support: not focusable — correct.
- CDK a11y utilities: not used; the inline sr-only span approach works fine.
- Labels/descriptions wiring: `label` input drives the sr-only text. Consumer can localise via override. Default `'Loading'` is reasonable.
- AXE risks: none expected.
- Findings:
  - `aria-live="polite"` on the host fires on initial mount. If the spinner is conditionally rendered (e.g., `@if (loading()) { <tw-spinner /> }`), the AT will announce "Loading" each time. Correct for async UX.
  - The codified menu-item carve-out doesn't apply here — spinner is non-interactive.

## Form integration (if applicable)
- CVA: not applicable.

## Tests
- Spec file: yes (`spinner.spec.ts`, 231 lines).
- Coverage breakdown:
  - rendering: default, ARIA, sr-only label, default circular SVG, non-interactive.
  - variants: all 3 (circular, dots, bars).
  - colors: all 8 + `current` + inherits from parent via `text-info-600`.
  - sizes: all 5 + `inherit` (`size-[1em]`).
  - track: with/without.
  - label: custom text, no aria-label on host.
  - reduced motion: `motion-reduce:animate-none` + `animate-spin` on circular.
- Vitest-specific issues: none.
- Findings:
  - Missing: no test for `motion-reduce` on dots/bars (only circular checked).
  - Missing: no test for non-circular variants when `track=false` (track only applies to circular; covered implicitly).
  - Missing: visual smoke that the dots/bars actually have an animation class — implicit through `.tw-spinner-dot`/`.tw-spinner-bar` selectors.

## Gaps & lacks
1. Hardcoded magic numbers in the circular SVG arc (`stroke-dasharray="60" stroke-dashoffset="40"`) — undocumented; add inline comments.
2. `size-[1em]` arbitrary value lacks an inline comment per the codified rule.
3. Dots/bars motion-reduce coverage not explicit in tests.
4. Default `label='Loading'` is the only English string; consumer override is straightforward — flag in docs but no API change needed.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal
Polish documentation and tests on an already-solid spinner.

### Tasks
1. **Document the circular SVG arc magic numbers** — readability + maintainability.
   - File(s): `projects/ngx-tw/spinner/spinner.ts:98-108` (circle stroke attributes)
   - Why: `stroke-dasharray="60" stroke-dashoffset="40"` are not obvious. Future contributors changing the arc proportion need context.
   - Change: add an inline comment above the `<circle>` block: `<!-- r=10 → circumference ≈ 62.83; dasharray 60 + offset 40 renders a ~1/3 arc that spins via animate-spin. -->`
   - Acceptance: comment present.

2. **Justify the `size-[1em]` arbitrary value** — codified rule.
   - File(s): `projects/ngx-tw/spinner/spinner.ts:49` (size variants — `inherit`)
   - Why: CLAUDE.md says arbitrary classes need a one-line comment.
   - Change: add an inline comment: `// 1em — matches surrounding font size for inline-text indicators; no Tailwind size token expresses font-relative sizing.`
   - Acceptance: comment present.

3. **Add motion-reduce coverage for dots and bars** — close test matrix.
   - File(s): `projects/ngx-tw/spinner/spinner.spec.ts` (under `reduced motion` describe)
   - Why: Codified test rule requires every variant covered for behaviour.
   - Change: add tests asserting that `<tw-spinner variant="dots">` and `<tw-spinner variant="bars">` have a motion-reduce affordance. Since the reduced-motion behaviour lives in `theme/_base.css:305-307` (animation-duration: 0ms), this is a CSS-only assertion — verify the `.tw-spinner-dot`/`.tw-spinner-bar` selectors are present and trust the theme.
   - Acceptance: two new passing tests confirming the dot/bar elements have the expected class.

4. **Add a `<title>` element to the circular SVG when `label` is set** — optional polish.
   - File(s): `projects/ngx-tw/spinner/spinner.ts:87-108`
   - Why: A `<title>` inside an SVG provides hover-tooltip on supporting browsers. The host already has `role="status"` + sr-only label, so this is purely decorative.
   - Change: optional — `<title>{{ label() }}</title>` at the top of the SVG. Could be controversial since the host owns the announcement; leave out unless visible UX win.
   - Acceptance: skip if redundant.

### Out of scope
- Adding a fourth `variant` (e.g., `gradient`) — current 3 cover usage.
- Allowing custom animation duration — keep simple.
- Splitting circular/dots/bars into separate components — single-component variant pattern is correct.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- spinner`
- Visual check: demo app at `http://localhost:4600/spinner`
- A11y: `npm run e2e:a11y`

## Priority
**P2** — Spinner is in great shape. Minor doc/comment polish only.
