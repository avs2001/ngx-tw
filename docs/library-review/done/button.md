# Button — Production-Grade Review

**Entry point:** `ngx-tw/button`
**Files:** `projects/ngx-tw/button/`

## Snapshot
- Selectors: `[twButton]` (directive, attribute), `[twButtonIcon]` (icon directive, attribute)
- Public classes/directives: `ButtonDirective`, `ButtonIconDirective`
- Inputs: 5 on `ButtonDirective` (`variant`, `color`, `size`, `disabled`, `loading`) + 1 on `ButtonIconDirective` (`twButtonIcon` positional)
- Outputs: 0 (intentional — host element owns native `(click)`)
- Slots: 0 named slots (content projection only — directive wraps host element)
- CVA: no (not a form control)
- `tv()` config: yes, no slots (single-element directive); `defaultVariants` defined
- A11y CDK utilities used: `FocusMonitor` (monitor/stopMonitoring lifecycle)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'soft' \| 'link'` | `'solid'` | yes | Exposes `ButtonVariant` type |
| `color` | `TwColor` (shared) | `'primary'` | yes | Uses shared `ngx-tw/core` type |
| `size` | `TwSize` (shared) | `'md'` | yes | Uses shared `ngx-tw/core` type |
| `disabled` | `boolean` | `false` | yes | Sets `aria-disabled`; `disabled` attr on `<button>`; `tabindex=-1` on anchors |
| `loading` | `boolean` | `false` | yes | Sets `aria-busy`; treated as disabled |
| `twButtonIcon` (on icon directive) | `'' \| 'leading' \| 'trailing'` | `'leading'` | yes | Positional input — selector also acts as variable name; consider naming `position` |

### Findings
- All inputs have one-line JSDoc with default — compliant.
- Uses shared `TwColor`/`TwSize` from `ngx-tw/core` correctly (line 12).
- All booleans default to `false` — compliant.
- Within the input-cap (5 + 1 sub-directive); no exception needed.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- Directive intentionally exposes no outputs — consumers wire native `(click)` directly on the host `<button>`/`<a>`. The directive only blocks the click in disabled/loading state via `stopImmediatePropagation()`. This is the canonical pattern for a behavior directive on a native element. No gap.

## Customization surface
- ng-content slots: n/a (directive — content lives in the host element)
- Structural directives: none
- Fallback content: n/a
- Class merging: yes — `twMerge: true` on `tv()` (line 125)
- Findings: Composition is excellent. Consumers can use `<button twButton>` or `<a twButton>` and inject any children (icons, labels, spinners). `ButtonIconDirective` auto-resolves its size from the parent `ButtonDirective` via `inject(ButtonDirective)` — a nice composition primitive.

## CSS / Styling
- tailwind-variants: yes; single-slot, slot config not used (intentional — directive applies one class set to the host)
- twMerge: yes (line 125)
- Semantic tokens vs raw palette: semantic-token compliant. Lines 55–108 use only `primary/secondary/accent/neutral/info/success/warning/error` shades, plus `surface-muted`/`surface-sunken`/`fg`/`fg-muted`/`border` for neutral variants (lines 76–80).
- Surface/fg/border tokens usage: neutral variant correctly maps to `bg-surface-muted text-fg`, ghost to `text-fg-muted`, outline to `border-border text-fg` (lines 76–80).
- Radius compliance: `rounded-md` (line 18) — compliant.
- Spacing compliance: `px-{2,3,4,5,6} py-{1,1.5,2,2.5,3}` exactly matches codified inline-padding scale (lines 38–42).
- Gap compliance: `gap-1.5` (line 18) — compliant.
- Typography compliance: `text-xs`/`text-sm`/`text-base` per the trigger scale (xs→xs, sm/md→sm, lg/xl→base). Compliant; `font-medium` is the trigger weight.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (line 18) — canonical compliant.
- Dark mode handling: NO `dark:` overrides anywhere. Solid variants use `bg-primary-600 text-white`. The `-600` shade rebrands cleanly under a dark theme, but the foreground `text-white` is a raw class instead of the new `text-on-{role}` token. This is the same gap codified across the library after PR4 added `on-{role}` tokens (commit `e952a33`). FLAG: solid variants should use `text-on-primary`/`text-on-success`/`text-on-warning`/`text-on-error`/… rather than `text-white` (line 55) and `text-black` (line 97 for warning).
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` (line 18) — compliant; specific property, reduced-motion respected.
- Shadows: none — appropriate for a button (shadows are reserved for elevated surfaces).
- Icon sub-scale: `ButtonIconDirective` maps xs/sm→`size-4`, md/lg/xl→`size-5` (line 203). Compliant with the glyph sub-scale.
- Findings:
  - Replace `text-white`/`text-black` in solid compoundVariants with `text-on-{role}` tokens to align with the codified solid-fill foreground policy.
  - The `text-black` carve-out for warning (line 97) becomes `text-on-warning` (which already maps to `--color-amber-950` — same contrast intent).

## Accessibility
- ARIA roles/attributes: `aria-disabled`, `aria-busy` bound dynamically (lines 133–134). `disabled` attr on native `<button>` only. `tabindex=-1` only on non-button (e.g., anchor) when disabled.
- Keyboard support: inherited from native `<button>`/`<a>`. Disabled-anchor click handler calls `preventDefault()` + `stopImmediatePropagation()` (line 181).
- CDK a11y utilities: `FocusMonitor.monitor()` + cleanup via `DestroyRef.onDestroy()` (lines 174–179) — modern, no manual `ngOnDestroy`.
- Labels/descriptions wiring: consumer-owned (button label is projected via element content).
- AXE risks: none expected — the directive does not introduce new interactive structures, only enhances native elements.
- Findings:
  - `aria-busy` is set when `loading=true` but there is no `aria-live` region inside the button telling AT what is happening. Consider documenting the recommended pattern: pair `loading` with a visually hidden status text (e.g., `<span class="sr-only">Loading…</span>`), or accept a `loadingLabel` input that renders a hidden announcement. Low priority — most apps handle this at the page level.
  - No spinner is rendered automatically when `loading=true`. The pattern documented in `spinner.ts` JSDoc is "compose `<tw-spinner>` inside a loading button". This is intentional (the directive does not own template), but the demo/api docs should call this out so consumers don't expect a built-in spinner.

## Form integration (if applicable)
- CVA: not applicable — buttons are not form controls.
- ErrorStateMatcher: n/a.
- form-field interop: n/a (form-field expects an input).
- Findings: nothing required.

## Tests
- Spec file: yes (`button.spec.ts`, 313 lines).
- Coverage breakdown:
  - rendering: covered (`<button>`, `<a>` hosts).
  - inputs (variants, colors, sizes): every value rendered.
  - disabled/loading state: ARIA attrs, opacity, click blocking on anchor.
  - FocusMonitor lifecycle: monitor + stopMonitoring on destroy.
  - icon directive: size derivation for xs/sm/md, `order-last` for trailing.
  - outputs: n/a (no outputs).
  - projection: implicit through host templates.
  - CVA: n/a.
- Vitest-specific issues: none. Uses `fixture.componentRef.setInput`, `vi.spyOn`, no `fakeAsync`/`tick`.
- Findings:
  - Missing: no explicit assertion on focus-ring classes (only loose `inline-flex/rounded-md/font-medium` check).
  - Missing: click blocked when `loading=true` is not tested (only `disabled=true` on anchor is).
  - Missing: `lg`/`xl` icon size mapping (only xs/sm/md tested at lines 282–304).
  - Missing: native `<button>` does NOT receive `tabindex=-1` (only anchor does) — happy-path tested but inverse not.

## Gaps & lacks
1. Solid-variant foreground uses raw `text-white`/`text-black` instead of `text-on-{role}` tokens introduced in commit `e952a33`. This makes solid buttons inconsistent with the codified policy.
2. No built-in spinner rendering when `loading=true`. Consumers must compose `<tw-spinner>` manually. Could be considered a feature gap or a deliberate composition decision — documenting it in the JSDoc would close the question.
3. `loading` state has no AT announcement (`aria-busy` only). Adding an optional `loadingLabel` input that renders a hidden `sr-only` element would close the loop for screen readers.
4. The icon directive's input name `twButtonIcon` is both the selector and the positional input — this overloads the property name. Acceptable but unusual; alternative: rename the input to `position` and keep the selector as `[twButtonIcon]`.
5. Tests miss: focus-ring class assertion, `loading` click-block, full size matrix for the icon directive.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal
Align Button with the post-PR `on-{role}` foreground tokens and close minor a11y / test gaps.

### Tasks
1. **Adopt `text-on-{role}` tokens in solid variants** — replace raw `text-white`/`text-black`.
   - File(s): `projects/ngx-tw/button/button.ts:55-108` (compoundVariants block)
   - Why: Codified token surface in `theme/_semantic.css:138-151` provides `on-info/on-success/on-warning/on-error/on-primary/on-secondary/on-accent/on-neutral`. Solid-fill buttons should pair `bg-{role}-{shade}` with `text-on-{role}`, not `text-white`/`text-black`. Aligns with PR e952a33.
   - Change: for `variant: 'solid'` rows, swap `text-white` → `text-on-{color}` and `text-black` (warning row) → `text-on-warning`. The neutral solid row should swap `text-fg` → `text-on-neutral` for consistency (semantically the same in light mode, but standardised).
   - Acceptance: every `variant: 'solid'` row uses a single `text-on-{color}` token; no raw `text-white`/`text-black` remains in the file; visual demo at `/button` continues to show readable foregrounds; no AXE regressions.

2. **Add an optional `loadingLabel` input for AT announcement** — closes the a11y gap when `loading=true`.
   - File(s): `projects/ngx-tw/button/button.ts:140-187`
   - Why: `aria-busy` alone does not announce "loading" to screen readers; the consumer's button label is still announced. A hidden `sr-only` text gives AT explicit context.
   - Change: add `loadingLabel = input('')`. When `loading()` is true and `loadingLabel()` is non-empty, render an `sr-only` child via host content? The directive has no template, so this requires either (a) projecting a sibling slot via a structural directive or (b) the simpler route of documenting the pattern and keeping the directive template-free. Recommended path: keep the directive template-free and instead add a JSDoc example showing `<button twButton [loading]="loading"><tw-spinner *ngIf="loading" size="sm"/>Save</button>` plus a hidden span. Update demo Examples page to show the pattern.
   - Acceptance: JSDoc on `loading` input documents the AT pattern; demo example renders a hidden status text alongside the spinner; AXE check on the loading example passes.

3. **Fill spec coverage gaps** — focus-ring classes, loading click-block, full icon size matrix.
   - File(s): `projects/ngx-tw/button/button.spec.ts` (new `it()` blocks under existing `describe` groups)
   - Why: Library quality bar; CLAUDE.md test rules require every variant rendered + interaction + a11y attrs.
   - Change: (a) Add `it('renders focus-visible outline classes')` querying `focus-visible:outline-primary-500`. (b) Add `it('blocks click when loading=true')` mirroring the disabled-anchor block test at lines 216–227. (c) Extend icon directive size tests at lines 282–304 to cover `lg` and `xl` → `size-5`.
   - Acceptance: `npm test -- --reporter=verbose button` shows three additional passing tests; total file size grows by ~30 lines.

4. **Document the click-handler contract on the JSDoc** — clarify why there's no `clicked` output.
   - File(s): `projects/ngx-tw/button/button.ts:140-145` (class-level JSDoc)
   - Why: The directive does not emit a `clicked` output (the host element owns the native event); this is an intentional API choice that's worth documenting so consumers don't reinvent.
   - Change: Add a class-level JSDoc block on `ButtonDirective` stating "this is a host directive that enhances a native `<button>` or `<a>` element; bind `(click)` directly on the host". Cross-reference the disabled-click-block behavior.
   - Acceptance: Compodoc renders the class description; the API table on `/button/api` shows the description.

### Out of scope
- Adding a `clicked` output — intentionally absent.
- Auto-rendering a spinner in the loading state — composition is the documented pattern.
- Renaming `twButtonIcon` input → `position` — semver impact > benefit; leave as-is.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- button`
- Visual check: demo app at `http://localhost:4600/button`
- A11y: `npm run e2e:a11y` or AXE on the demo page

## Priority
**P2** — Component is structurally sound and well-tested. The `text-on-{role}` migration is the only material consistency gap; everything else is polish.
