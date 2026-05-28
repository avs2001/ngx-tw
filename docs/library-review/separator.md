# Separator — Production-Grade Review

**Entry point:** `ngx-tw/separator`
**Files:** `projects/ngx-tw/separator/`

## Snapshot
- Selectors: `tw-separator` (element)
- Public classes/directives: `SeparatorComponent`
- Inputs: 5 (`orientation`, `variant`, `weight`, `color`, `decorative`)
- Outputs: 0
- Slots: 1 (default — label content, horizontal only)
- CVA: no
- `tv()` config: yes, slots used (`root`, `line`, `label`)
- A11y CDK utilities used: none

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | yes | |
| `variant` | `SeparatorVariant` (`'solid' \| 'dashed' \| 'dotted'`) | `'solid'` | yes | Line style |
| `weight` | `SeparatorWeight` (`'thin' \| 'medium' \| 'thick'`) | `'thin'` | yes | Thickness |
| `color` | `TwColor` (shared) | `'neutral'` | yes | |
| `decorative` | `boolean` | `false` | yes | Hides from AT |

### Findings
- All inputs have one-line JSDoc with defaults — compliant.
- All booleans default to `false` — compliant.
- 5 inputs — at the cap, no exception needed.
- Uses shared `TwColor` from `core` — compliant.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- No outputs — appropriate for a static visual primitive.

## Customization surface
- ng-content slots: default slot (label) — only rendered when `orientation === 'horizontal'` (line 84). Vertical separators cannot have labels.
- Structural directives: none.
- Fallback content: none. Empty label hides via `empty:hidden` (line 20).
- Class merging: yes — `twMerge: true` (line 69).
- Findings:
  - Vertical-with-label is intentionally not supported (line 83 guards on horizontal). This is a reasonable limitation but worth documenting in the component-level JSDoc.
  - The empty-label hiding via CSS `empty:hidden` is clever but depends on whitespace handling. If a consumer projects ` ` (whitespace), the selector treats it as not-empty. Acceptable.

## CSS / Styling
- tailwind-variants: yes; slots — `root`, `line`, `label`.
- twMerge: yes.
- Semantic tokens vs raw palette: compliant. Lines 44–51 use `border-{role}-300` for color variants, `border-border` for neutral (line 47).
- Surface/fg/border tokens usage: neutral uses `border-border` correctly (line 47). Label uses `text-fg-muted` (line 20). Compliant.
- Radius compliance: not applicable (separator is a line).
- Spacing compliance: `px-3` on label (line 20) — within the codified scale.
- Typography compliance: `text-sm` (line 20) — compliant body scale.
- Focus rings compliance: not applicable (non-interactive).
- Dark mode handling: relies entirely on theme tokens (`border-{role}-300`, `border-border`, `text-fg-muted`). No `dark:` overrides needed because `border-{role}-300` keeps the same lightness role in dark mode; the perception will depend on the consumer's dark theme. For semantic borders, a dark-mode shift might be desirable (e.g., `dark:border-{role}-700`) — investigate visually but defer.
- Transitions: none — appropriate (separators are static).
- Shadows: none — appropriate.
- Icon sub-scale: not applicable.
- Findings:
  - Arbitrary value `border-t-[3px]` and `border-l-[3px]` (lines 57, 60) for `thick`. CLAUDE.md allows arbitrary values only when no token expresses the value; here the tailwind border-width scale is `border / border-2 / border-4` — no `border-3` exists, so `[3px]` is justified. Add an inline comment so the intent is preserved.
  - The `weight: thin/medium/thick` shape uses empty slots for `thin` and overrides via compoundVariants for medium/thick (lines 56–60). Consider simplifying by defining `weight` slots directly: `thin: { line: 'border-t' }` (when `orientation: horizontal`). Today's design works but has empty `weight` blocks that exist only as compound-variant keys — wastes a layer.

## Accessibility
- ARIA roles/attributes: dynamic via `[attr.role]` — `"separator"` (default) or `"none"` when decorative (line 77). `[attr.aria-orientation]` matches input. `[attr.aria-hidden]="true"` when decorative.
- Keyboard support: not focusable, no interactions — correct.
- CDK a11y utilities: none required.
- Labels/descriptions wiring: optional label is a visual decoration only (when role is `"separator"`, AT does not announce the projected text as a label). This is acceptable but a consumer expecting "OR"-style labelled separators may want the label announced — consider `aria-labelledby` on the host pointing to the label span. Low priority.
- AXE risks: none expected.
- Findings:
  - `decorative` is set via a separate input rather than reading from `role` context. This is fine but consumers nesting separators inside `<menu>`/`<menubar>` may want auto-decorative. Out of scope for this batch.
  - Label is not wired to `aria-labelledby` — projecting "OR" between two halves of a form is a common pattern; if the label conveys meaning, it should be announced. Add documentation: "for decorative separators with visual-only labels, set `decorative=true`; for labelled separators (rare), wire `aria-labelledby` from consumer side using template variables".

## Form integration (if applicable)
- CVA: not applicable.

## Tests
- Spec file: yes (`separator.spec.ts`, 187 lines).
- Coverage breakdown:
  - rendering: default, two-line markup, horizontal classes.
  - inputs: orientation (horizontal/vertical), variant (solid/dashed/dotted), weight (medium/thick × both orientations), color (primary, neutral).
  - a11y: role=separator, aria-orientation, role=none + aria-hidden when decorative.
  - projection: empty label hidden, projected label visible (horizontal), no label slot in vertical.
- Vitest-specific issues: none.
- Findings:
  - Missing: weight `thin` is not tested (default render passes implicitly via `border-t` check at line 50, but the `weight: 'thin'` input branch is not explicitly toggled).
  - Missing: every color is not iterated — only `primary` and `neutral`. Codified test rule says every variant value rendered. Add an iteration over `TwColor`.
  - Missing: variant `solid` is not asserted explicitly (`border-solid` always applied via base) — minor.

## Gaps & lacks
1. Tests miss full color matrix iteration and `weight: 'thin'` explicit toggle.
2. The empty `thin`/`medium`/`thick` slots that act only as compound-variant keys are dead weight — consider simplifying `tv()` shape.
3. Label is not announced via `aria-labelledby` — consumers who want a semantic "OR" between regions can't wire it without custom DOM.
4. `border-t-[3px]` / `border-l-[3px]` arbitrary values need a one-line inline comment per the codified rule on arbitrary values.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal
Complete test coverage and small DX/a11y polish on Separator.

### Tasks
1. **Iterate every color in tests** — codified test rule.
   - File(s): `projects/ngx-tw/separator/separator.spec.ts:118-129` (color block)
   - Why: CLAUDE.md requires every variant value to render without errors.
   - Change: replace the two single-color assertions with a `for (const color of colors)` loop covering all 8 `TwColor` values. Existing semantic-class assertion (`border-primary-300` / `border-border`) can stay as a representative subset.
   - Acceptance: 8 new passing assertions; total test count rises.

2. **Add explicit `weight: 'thin'` assertion** — close the matrix.
   - File(s): `projects/ngx-tw/separator/separator.spec.ts:84-117` (weight block)
   - Why: `medium` and `thick` are asserted; `thin` is only implied by the default render.
   - Change: add `it('applies border-t (no width override) for weight="thin"')` checking the absence of `border-t-2` and `border-t-[3px]`.
   - Acceptance: one new passing test.

3. **Comment the arbitrary border-width values** — codified rule on arbitrary classes.
   - File(s): `projects/ngx-tw/separator/separator.ts:56-60` (compoundVariants block)
   - Why: CLAUDE.md says arbitrary values may be used when no token expresses the value, but should carry a one-line comment explaining why.
   - Change: prepend an inline comment above the block: `// thick = 3px; Tailwind border-width scale jumps 2 → 4, so an arbitrary value is required.`
   - Acceptance: comment present; grep `border-t-\[3px\]` finds the documented site.

4. **Document the vertical-label limitation** — class-level JSDoc.
   - File(s): `projects/ngx-tw/separator/separator.ts:88-89` (class JSDoc — add at top of `SeparatorComponent`)
   - Why: Consumers might expect labelled vertical separators; the template silently drops the slot.
   - Change: add a one-paragraph class JSDoc: "Renders a horizontal or vertical line. The default slot accepts label content but is rendered only in horizontal mode (vertical layouts can't accommodate inline labels without complex transforms). For decorative separators, set `decorative=true` to expose `role='none'` and `aria-hidden='true'`."
   - Acceptance: Compodoc renders the description on `/separator/api`.

5. **Simplify `weight` variant declaration** — remove empty slot blocks.
   - File(s): `projects/ngx-tw/separator/separator.ts:38-42, 54-61` (weight variants + compoundVariants)
   - Why: The empty `thin/medium/thick` slots add a layer that resolves to compound variants. A flatter shape is easier to maintain.
   - Change: split horizontal/vertical thickness directly into the orientation variant via compoundVariants, or expand `weight` to include the actual class strings: `thin: { line: '' }`, `medium: { line: '' }`, `thick: { line: '' }`, then use compoundVariants for orientation × weight (current shape) — but drop the empty entries from `variants.weight` and rely entirely on compoundVariants. Either path is fine; current shape works.
   - Acceptance: same generated classes; demo unchanged; tests pass.

### Out of scope
- Adding `aria-labelledby` auto-wiring — consumer-owned ARIA pattern.
- Vertical-label support — invasive; defer.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- separator`
- Visual check: demo app at `http://localhost:4600/separator`
- A11y: `npm run e2e:a11y`

## Priority
**P2** — Separator is in good shape. The recommended work is mostly test polish and minor doc/comment additions.
