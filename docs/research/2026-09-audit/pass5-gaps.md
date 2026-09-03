# Pass 5 — lens: defects and coverage gaps

Read-only audit. Confidence markers per the brief: **[measured]** = a script/command I ran produced
the number; **[verified]** = I read the source; **[reported]** = inference. I did NOT run playwright,
`npm test`, or any build. Re-runnable scripts saved beside this report:
`scratchpad/bool.mjs` (A3), `scratchpad/fixme.mjs` + `fixme3.mjs` (A4), `scratchpad/inputs2.mjs` (A7).

## Ranked index

| # | severity | title |
|---|---|---|
| F-13 | HIGH | Overlay config frozen after first open in `tooltip`/`select`/`combobox`/`popover` (Part B) |
| F-10 | HIGH | `combobox` per-open subscriptions never torn down on close (Part B) |
| F-08 | HIGH | `provideCalendarIntl`/`provideTimePickerIntl` `Object.assign` → crash on an undefined i18n key (Part B) |
| F-09 | HIGH | Disabled `tw-calendar` presents every day cell as enabled and focusable (Part B) |
| F-01 | HIGH | `NumberInputDirective` disabled state never reaches the DOM; `onInput()` ungated (A1) |
| F-04 | HIGH | 37 `test.fixme` with no expiry; 1 provably stale, 5 unreported library bugs inside them (A4) |
| F-11 | MEDIUM | `split` leaves an in-flight drag wired up on destroy (Part B) |
| F-02 | MEDIUM | `select` clear is a `tabindex`'d span inside a `<button>` (A2) |
| F-03 | MEDIUM | 17/30 `true`-default justifications still `//`; the rule's stated rationale is fictional (A3) |
| F-06 | MEDIUM | Toast prose claims a reduced-motion swipe gate that does not exist; register's cost is wrong (A6) |
| F-07 | MEDIUM | Untested-input metric has no pinned definition; settles pass 2 vs pass 4 (A7) |
| F-05 | MEDIUM | 1 of 56 harnesses — and the two skips asking for one are already unblocked by it (A5) |
| F-14 | LOW | 15 one-shot dev-mode warnings against a pattern `carousel` already documented as wrong (Part B) |
| F-12 | LOW | Unpaired `requestAnimationFrame` in the shared overlay coordinator (Part B) |

**Four register corrections**: the `test.fixme` count is 37 not 38 and `dialog.spec.ts:92` is stale
(F-04); "every one of the seven canonical" is really 7 of CLAUDE.md's 13 illustrative entries (F-03);
adding the toast reduced-motion gate costs 1 red test and 3 vacuous ones, not "six killed" (F-06);
and the pass-2 / pass-4 disagreement over alias resolution is a **definitional mismatch, not an
error by either** — my methodology reproduces pass 4's per-component numbers exactly, so both
measured real but different quantities (F-07).

**One spec defect**: `.claude/CLAUDE.md:56` and `:467` justify the JSDoc rule with Compodoc, which is
not installed anywhere in this repo (`docs/mcp-server-architecture.md:60-62` already says so). The
real consumer is `scripts/mcp/extract-api.mjs`, which reads `/** */` blocks only — so the rule is
right and its stated reason is wrong (F-03).

---

# Part A — the pre-approved queue

## A1

### F-01 `NumberInputDirective` never reflects its disabled state to the DOM, and `onInput()` is ungated
Severity: HIGH
Anchor: `projects/ngx-tw/number-input/number-input.ts:57-68` (host block), `:200-202` (`setDisabledState`), `:224-231` (`onInput`)
Register: extends "Open — carried to pass 5" → `NumberInputDirective.setDisabledState`
Confidence: [verified] — both halves read in source; masking confirmed by grepping every shipped usage
What: Both halves of the register entry still reproduce on the current tree.

**Half 1 — no host binding.** The `host` block (`:57-68`) is:

```
'role': 'spinbutton',
'[attr.inputmode]': 'inputMode()',
'[attr.aria-valuemin]' / '[attr.aria-valuemax]' / '[attr.aria-valuenow]' / '[attr.aria-valuetext]',
'(input)' / '(keydown)' / '(focus)' / '(blur)'
```

There is no `'[disabled]'`, no `'[attr.disabled]'`, and no `'[attr.aria-disabled]'`.
`setDisabledState()` (`:200`) writes only the private `cvaDisabled` signal, which feeds the
public `disabled` computed (`:110`). Nothing propagates that to the element.

**Half 2 — `onInput()` is ungated.** `:224-231`:

```ts
onInput(): void {
  const raw = this.el.value;
  this.displayText.set(raw);
  const parsed = this.parseValue(raw);
  this._value.set(parsed);
  this.onChange(parsed);          // <- writes the disabled FormControl
  this.valueChange.emit(parsed);  // <- and emits the public output
}
```

Compare `onKeydown` (`:242`) and `stepBy` (`:277`), which both open with
`if (this.disabled() || this.el.readOnly) return;`. `onInput` and `onBlur`/`commitFromElement`
do not. So arrow-key stepping is correctly blocked while typing is not — an internally
inconsistent gate, which is the tell that the omission is accidental rather than designed.

**Why it is masked.** The sibling `InputDirective` carries `'[disabled]': 'disabled()'`
(`projects/ngx-tw/input/input.ts:179`) and `disabled` there is derived from `ngControl.disabled`
(`input.ts:288-290`). Every shipped usage pairs the two: 28 occurrences of the literal
`twInput twNumberInput` in `projects/demo/src`, and **zero** occurrences of `twNumberInput`
without `twInput` in demo or e2e. The selector is `input[twNumberInput]`, so standalone use is
legal and typed; it just has no in-repo exemplar.

Why it matters: A consumer who applies `twNumberInput` without `twInput` (legal — the selector
permits it, and nothing in the directive injects `InputDirective`) gets a control that:
(a) stays typable after `control.disable()`, (b) writes every keystroke through `onChange` into
the disabled control's value — `AbstractControl.setValue` does not check `disabled`, so
`getRawValue()` drifts, (c) emits `valueChange` while disabled, and (d) presents
`role="spinbutton"` with no disabled state to assistive tech. The `role="spinbutton"` makes (d)
worse than a bare input: the role suppresses the native textbox semantics an AT might otherwise
fall back on.

**Would a spec catch it? No, and for a structural reason.** All five spec hosts
(`number-input.spec.ts:68,78,88,111,118` — `NgModelHost`, `SignalFormHost`, `FormFieldHost`,
`DisabledAttrHost`, `ReadonlyAttrHost`) apply `twInput twNumberInput` together, so
`InputDirective`'s `[disabled]` binding supplies the native `disabled` in every test. The one
disabled test (`:572-582`) asserts `inputEl(fixture).disabled === true` — a real DOM assertion,
correctly written per CLAUDE.md — but it is **measuring the sibling directive**. It then asserts
only that `dir.increment()` is a no-op; it never dispatches an `input` event. So the spec is
green, DOM-based, and structurally incapable of failing on this bug. There is no
`twNumberInput`-alone host in the file at all.

Fix (additive, non-breaking):
1. Add to the host block: `'[attr.aria-disabled]': 'disabled() || null'`. Do **not** add
   `'[disabled]': 'disabled()'` — it would collide with `InputDirective`'s identical binding
   (`input.ts:179`) in the paired case, i.e. two directives writing the same DOM property on one
   element. The native property stays `InputDirective`'s job; this directive contributes the ARIA
   state and gates its own behaviour in step 2, which is the load-bearing half.
2. Gate `onInput()` and `onBlur()`/`commitFromElement()` on `disabled()` the same way
   `onKeydown`/`stepBy` already are: `if (this.disabled() || this.el.readOnly) return;` at the
   top of `onInput`. This is the load-bearing half — it stops the form-model write regardless
   of which directive owns the DOM attribute.
3. Add a `NumberInputOnlyHost` (`<input twNumberInput [formControl]="ctrl" />`, no `twInput`)
   to the spec and assert: after `ctrl.disable()`, dispatching `input` leaves `ctrl.getRawValue()`
   unchanged and emits no `valueChange`. Confirm the new test goes red with the gate removed
   (CLAUDE.md's forced-failure rule).
4. Optionally document that `twNumberInput` requires `twInput` — but that is a weaker fix than
   (2), because the directive would then need to *enforce* it (`inject(InputDirective)` non-optional),
   which is a BREAKING change for any consumer already using it standalone. Prefer (2).

---

## A2

### F-02 `select`'s clear control is a `role="button" tabindex="0"` span nested inside the `<button>` trigger
Severity: MEDIUM
Anchor: `projects/ngx-tw/select/select.ts:448-465` (the `<span role="button" tabindex="0">`), nested inside the trigger `<button>` opened at `:414`
Register: extends "Open — carried to pass 5" → select clear content-model violation (recorded pass 3 at register `:516-519`)
Confidence: [verified] — read both templates; compared against the in-repo `combobox` precedent

**What pass 3 actually landed** (checked before proposing anything, per the brief). Register
`:505-519` records that pass 3 *did* add the keyboard path — it is not still missing. Present on
the current tree: `onClearKeydown` (`select.ts:1147-1155`) handling Enter/Space with
`preventDefault` + `stopPropagation`, and `focusTrigger()` (`:1168-1171`) returning focus to the
trigger after the clear unmounts itself, carrying a deliberate `isDisabled()` guard with an
eight-line comment explaining why it is not redundant. The clear also has the canonical
focus-visible ring (`clearButtonClasses`, `:182-183`) and meets the 24px SC 2.5.8 target floor.
So the *behaviour* is done; what is open is exactly and only the content model.

What: HTML's content model for `<button>` is "phrasing content, but there must be no interactive
content descendant". A `tabindex="0"` `role="button"` span is interactive content. The nesting is
therefore invalid, and — as pass 3 correctly diagnosed — axe's `nested-interactive` rule cannot
see it, because that rule fires only when the ancestor's role is `childrenPresentational`, and
`combobox` is not.

Why it matters: (a) Nested focusable descendants of a `<button>` have undefined sequential-focus
behaviour across browsers; the current code works because Chrome and Firefox happen to allow it.
(b) Screen readers in forms/browse mode map a `role="combobox"` button to a single control; a
nested named button inside it is at the mercy of each AT's flattening heuristics. (c) It is a
correctness debt the library already knows how to avoid — `combobox` renders the identical clear
as a **real sibling `<button>`** (`projects/ngx-tw/combobox/combobox.ts:318-334`), because its
trigger is an `<input>` inside a wrapper. `select` is the only place in the library with this shape.

Fix (no public-API change; not a semver event):
1. Move the clear out of the trigger and make it a sibling inside the existing root. The root slot
   is already `'relative inline-block w-full'` (`select.ts:164`), so it can host an absolutely
   positioned control with no new wrapper: render
   `<button type="button" class="… absolute right-… top-1/2 -translate-y-1/2" aria-label="Clear selection">`
   after the trigger `</button>`, and reserve room by adding right padding to the trigger when
   `showClearButton()` is true (a `compoundVariant`, or a `[class.pr-…]` per size step).
   Alternative, if the absolute positioning proves fiddly against the five pinned trigger heights:
   convert `trigger` from the `<button>` to a `<div class="flex">` containing an inner
   `<button role="combobox">` that flexes, plus the clear as a flex sibling — this is exactly
   `combobox`'s structure and would make the two components structurally identical.
2. Delete `onClearKeydown` (`:1147-1155`) — a native `<button>` fires `click` on Enter and Space,
   so the handler becomes dead code. It is `@internal`, so removing it is not a breaking change.
   Keep `onClearClick`'s `stopPropagation()` only if the clear stays inside a click-handling
   ancestor; once hoisted it is unnecessary but harmless.
3. `focusTrigger()` stays as-is and is still required — the clear still unmounts itself.
4. **Costed locator churn (one line, e2e).** `e2e/specs/01-components/select.spec.ts:311` scopes
   the click to the trigger: `trigger.getByRole('button', { name: 'Clear selection' })`, and
   `:309-310` carries a comment that *documents the violation as intentional*. Both need updating
   to page-scoped/root-scoped. The unit spec is unaffected: `select.spec.ts:284,704,712,724,736,751`
   all use `fixture.nativeElement.querySelector('[aria-label="Clear selection"]')`, which survives
   the hoist unchanged.
5. Add a regression assertion to `select.spec.ts` that the clear control is **not** a descendant of
   the trigger button (`expect(trigger.contains(clearBtn)).toBe(false)`), so the shape cannot
   silently return. This is the only way it becomes enforceable — axe provably cannot see it.

---

## A3

### F-03 17 of 30 `true`-default boolean justifications are still bare `//` — enumerated, and the rule's stated rationale is fictional
Severity: MEDIUM
Anchor: `projects/ngx-tw/calendar/calendar.ts:488` (representative); full table below; rule at `.claude/CLAUDE.md:467`
Register: confirms "Open — carried to pass 5" → "17 of 30 … still bare `//`"; **corrects** its "every one of the seven CLAUDE.md holds up as canonical", and **contradicts** `.claude/CLAUDE.md:56` and register `:776` on the *mechanism*
Confidence: [measured] — enumerated by script (`scratchpad/bool.mjs`, re-runnable), then all 30 comment blocks read by hand to classify

What: The population is **exactly 30** and the `//`-only count is **exactly 17**. The register's
headline number is right; I re-derived it independently rather than trusting it. The script
matched `input(true` / `input<boolean>(true` / `model(true` across all 259 non-spec, non-meta
library files, then I read every one of the 30 comment blocks, because a naive
"is there a `//` above it" classifier over-reports: 20 of 30 have *both* a JSDoc block and a
`//` line, and in 3 of those the JSDoc already carries the justification (the `//` is redundant).
The discriminator is **whether the JSDoc block itself states why the default is `true`**.

**The 13 already compliant** — JSDoc carries the rationale, no migration needed:

| # | file:line | input |
|---|---|---|
| 1 | `accordion/accordion.ts:92` | `collapsible` |
| 2 | `carousel/carousel.ts:541` | `pauseOnHover` |
| 3 | `carousel/carousel.ts:544` | `pauseOnFocusIn` |
| 4 | `carousel/carousel.ts:547` | `draggable` |
| 5 | `carousel/carousel.ts:550` | `keyboard` |
| 6 | `combobox/combobox.ts:408` | `showChevron` — *also* has a redundant `//` duplicate |
| 7 | `combobox/combobox.ts:413` | `clearable` — *also* has a redundant `//` duplicate |
| 8 | `combobox/combobox.ts:427` | `openOnFocus` — *also* has a redundant `//` duplicate |
| 9 | `command-palette/command-palette.ts:424` | `closeOnSelect` |
| 10 | `command-palette/command-palette.ts:427` | `closeOnEscape` |
| 11 | `command-palette/command-palette.ts:430` | `closeOnBackdropClick` |
| 12 | `command-palette/command-palette.ts:433` | `autoFocus` |
| 13 | `spinner/spinner.ts:139` | `track` |

**The 17 that need migrating** — JSDoc states the default but not the reason; the reason is in a
`//` the tooling cannot read:

| # | file:line | input | where the `//` sits |
|---|---|---|---|
| 1 | `calendar/calendar-header.ts:119` | `canSwitchView` | below JSDoc |
| 2 | `calendar/calendar.ts:488` | `bordered` | below JSDoc |
| 3 | `date-picker/date-picker.ts:497` | `showClear` | below JSDoc |
| 4 | `date-range-picker/date-range-picker.ts:452` | `showClear` | below JSDoc |
| 5 | `paginator/paginator.ts:523` | `showFirstLastButtons` | below JSDoc |
| 6 | `paginator/paginator.ts:534` | `showPageInfo` | below JSDoc |
| 7 | `paginator/paginator.ts:539` | `hideOnEmpty` | below JSDoc |
| 8 | `popover/popover.ts:353` | `twPopoverArrow` | **above** JSDoc |
| 9 | `popover/popover.ts:361` | `twPopoverCloseOnOutside` | **above** JSDoc |
| 10 | `popover/popover.ts:366` | `twPopoverCloseOnEscape` | **above** JSDoc |
| 11 | `popover/popover.ts:374` | `twPopoverTrapFocus` | **above** JSDoc |
| 12 | `stepper/stepper.ts:327` | `showError` | below JSDoc |
| 13 | `stepper/stepper.ts:332` | `headerInteractive` | below JSDoc |
| 14 | `time-picker/time-picker.ts:586` | `showSteppers` | below JSDoc |
| 15 | `time-picker/time-picker.ts:590` | `showClear` | below JSDoc |
| 16 | `toast/toast-component.ts:203` | `dismissible` | **above** JSDoc |
| 17 | `tooltip/tooltip.ts:358` | `twTooltipArrow` | **above** JSDoc |

All 17 are on exported classes (`CalendarHeaderComponent` is exported at
`projects/ngx-tw/calendar/index.ts:18`; `ToastComponent` at `projects/ngx-tw/toast/index.ts:3`),
so every one is consumer-visible surface.

**Register correction.** The register says the 17 include "every one of the seven CLAUDE.md holds
up as canonical". CLAUDE.md's illustrative list (`:479-493`) actually names **13** inputs, of
which **7** are still `//`-only — `calendar.bordered`, the four `popover.*`, and the two
`timePicker.*`. The other six (`spinner.track`, `accordion.collapsible`, and all four
`commandPalette.*`) have **already been migrated** and are in the compliant table above. So "seven"
is the right count of stragglers but the wrong denominator, and the register understates the
progress that has been made.

**The rule's stated rationale is false, and the real one is stronger.** `.claude/CLAUDE.md:56`
and `:467` — and register `:776` — justify this rule with "Compodoc parses these to generate API
tables in the demo app". `grep -rni compodoc` over the whole tree finds **no Compodoc dependency,
no config, and no npm script**; `docs/mcp-server-architecture.md:60-62` already says so in
writing: *"Compodoc is **not installed** in this repo despite what CLAUDE.md implies."* The demo's
`api/*-api.component.ts` files are hand-authored HTML tables. So no demo cell is blank because of
this, and a maintainer who checks the claim will (correctly) conclude the rule is unenforced and
may stop applying it.

The genuine consequence is `scripts/mcp/extract-api.mjs`, which is run by `npm run build:lib`
and ships in `dist/ngx-tw/`. Its `jsDocOf()` (`extract-api.mjs:65-71`) reads the TypeScript
compiler's `jsDoc` node array — **`/** */` blocks only**. A `//` line is invisible to it. So the
17 justifications above are silently dropped from the MCP index that `@cdevhub/ngx-tw-mcp` serves
to consumers' agents, plus they never reach the emitted `.d.ts` and therefore never reach a
consumer's IDE hover. That is a real, shipping loss — it is just a different tool than the one
the spec names.

Why it matters: 17 documented design decisions are invisible to every consumer-facing surface
that exists, and the rule that would have caught it cites a tool that does not exist, which makes
the rule look like dead ceremony.

Fix:
1. Mechanical: for each of the 17, fold the `//` text into the JSDoc sentence, matching the shape
   the compliant 13 already use — `… Defaults to \`true\` — <reason>; the special case is <opt-out>.`
   Delete the `//`. Pure comment churn; no semver impact.
2. Delete the three redundant `//` duplicates on `combobox` (`:408`, `:413`, `:427`) at the same
   time so the file does not carry two copies of the same rationale that can drift apart.
3. **Spec defect — fix the rationale, not just the code.** Correct `.claude/CLAUDE.md:56` and
   `:467` to name `scripts/mcp/extract-api.mjs` (and the emitted `.d.ts`) instead of Compodoc, or
   state plainly that Compodoc is aspirational. Register `:776` carries the same false claim.
   `docs/mcp-server-architecture.md` already has the correct statement to copy.
4. Make it enforceable, since it has now survived two passes: add an ESLint rule (or a line to
   `scripts/verify-mcp-index.mjs`, which already runs in the same pipeline) that fails when an
   `input(true` / `model(true` declaration is not preceded by a JSDoc block containing
   `Defaults to \`true\``. That check is greppable in the same way the `dark:`-variant ban is.

---

## A4

### F-04 37 `test.fixme` used as an untracked bug tracker; at least one is provably stale, and three encode unreported library bugs
Severity: HIGH
Anchor: `e2e/specs/01-components/dialog.spec.ts:92` (the provably stale one); full census below
Register: extends "Open — carried to pass 5" → "38 `test.fixme` … no expiry"; **corrects** the count to **37**
Confidence: [measured] for the census (`scratchpad/fixme.mjs`, `fixme3.mjs`); [verified] for each triage call — I read the library source each fixme accuses

What: 37 `test.fixme` call sites suppress e2e tests with no expiry mechanism. One is provably
stale — the bug it names was fixed and three unit tests already assert the fix — two carry a wrong
or misattributed diagnosis, and five encode real library defects recorded nowhere else in the
project.

**Census — 37, not 38.** Script counts `test.fixme(` at statement position in every
`e2e/**/*.spec.ts`: **35 unconditional** (each suppresses one test) plus **2 conditional in-body**
(`explicit-assertions.spec.ts:228`, `:255`), which are the `ARIA_CONTROLS_BACKLOG` (7 components)
and `ACCESSIBLE_NAME_BACKLOG` (9 components) sets and therefore expand to 16 suppressed runs.
35 + 16 = 51, consistent with the register's reported 54 e2e skips (the balance being
browser-conditional). Prose mentions of `test.fixme` in `README.md` files are excluded — that is
almost certainly where the register's extra 1 came from.

Why it matters: `test.fixme` never executes its body, so a fixme whose bug has been fixed is
undetectable by construction — the suite reports green forever, and `dialog.spec.ts:92` proves that
is not hypothetical. Worse, five real library defects currently live *only* as comments inside
skipped tests, invisible to the register, the changelog, and every consumer.

**Triage.** Every one carries a written reason; the corpus is far better documented than a
"no expiry" summary suggests. The problem is not documentation, it is that nothing re-checks them.

**(c) TRIVIALLY FIXABLE NOW — 1 confirmed stale, high value**

| file:line | stated reason | why it is stale |
|---|---|---|
| `e2e/specs/01-components/dialog.spec.ts:92` | *"BUG (ngx-tw/dialog#aria-modal-default): CdkDialogConfig defaults `ariaModal = false`; TwDialogConfig should override to `true`. … Re-enable this test once the library default is corrected."* | **The default was corrected.** `projects/ngx-tw/dialog/dialog-config.ts:56` reads `override ariaModal?: boolean = true;`, `dialog-container.ts:82` binds `'[attr.aria-modal]': '_config.ariaModal'`, and **three unit tests already assert it** — `dialog.spec.ts:433-437` is literally titled *"should default aria-modal to true"*. The e2e almost certainly passes as written. Delete the `.fixme`. |

This is the same failure mode pass 4 recorded: a fixme comment that became a false statement about
the library and nothing noticed. It is worth stressing that this one is *stale in the good
direction* — the bug was fixed, the test that would have proven it stayed off, and the register
has been carrying a phantom dialog a11y defect for four passes.

**(b) STALE OR WRONG DIAGNOSIS — 2, needing one run each to settle**

| file:line | stated reason | what the source actually says |
|---|---|---|
| `e2e/specs/01-components/date-range-picker.spec.ts:42` | *"BUG / NEEDS-INVESTIGATION: `[numberOfMonths]="1"` still renders two grids. The `numberOfMonths` input may not propagate to the embedded `tw-calendar`'s `monthColumns`."* | **The propagation chain is intact on the current tree.** `date-range-picker.ts:445` declares the input; `:886`/`:920`/`:1248` push it onto the overlay instance; `date-range-picker-overlay.ts:128` binds `[monthColumns]="numberOfMonths()"`; `calendar.ts:500` declares `monthColumns` (default `1`). The demo wires both variants (`date-range-picker-examples.component.ts:190` and `:198`). The stated cause is therefore wrong. A plausible *remaining* cause is a first-render flash: `date-range-picker-overlay.ts:232` seeds `numberOfMonths = signal(2)` and the picker sets it after attach — but Playwright's `toHaveCount` auto-retries, so that should settle. Needs one run; do not fix blind. |
| `e2e/specs/01-components/split.spec.ts:443` | The comment block *immediately above* this fixme is the axe-sweep note that belongs to the previous test; a reader lands on the wrong rationale. The real reason sits further up. | Cosmetic but exactly the misattribution class that cost pass 4 a cycle. |

**(a) GENUINELY BLOCKED — 32.** Three distinct blockers, and the split matters because two of the
three are not e2e problems at all:

*Blocked on a demo/shell affordance that does not exist (19).* These are honest — the assertion
needs DOM the demo does not render. `concurrent-overlays.spec.ts:170,196,217,246` (no dialog
example mounts a select/toast/tooltip; the `_e2e/concurrent-overlays` route was never built),
`focus-restoration.spec.ts:23,43` + `keyboard-journey.spec.ts:56` (the shell ships no
`NavigationEnd` focus handler and no skip link — one shell change unblocks all three),
`mobile.spec.ts:26,65` (shell sidebar has no responsive variants),
`calendar.spec.ts:80,204,214`, `date-picker.spec.ts:225`, `date-range-picker.spec.ts:175`,
`time-picker.spec.ts:157`, `tab-nav.spec.ts:99,108`, `command-palette.spec.ts:178`,
`forms-three-strategies/date-range-picker.spec.ts:110`.

*Blocked on a real, unreported LIBRARY defect (5).* **These are the ones the register should be
carrying as defects, not as skipped tests** — the fixme is the only place they are written down:
- `forms-three-strategies/{date-picker:100, date-range-picker:101, time-picker:110, calendar:95}` —
  four tests, **one root cause**: `onFormReset` subscribes to `NgControl.control.events`, which
  Signal Forms' `FieldState` does not expose, so form reset silently does nothing under signal
  forms on all four date/time controls. CLAUDE.md mandates all three form strategies work; this is
  a documented, four-component hole in that guarantee with no register entry.
- `forms-three-strategies/input.spec.ts:125` — `InputDirective.errorState` does not recompute on a
  programmatic `markAsTouched()`, because the directive bumps `_ngControlRev` only from
  `statusChanges`/`valueChanges`/blur, and `markAsTouched()` emits neither. The fixme even names
  the fix (subscribe to the `events` stream for `TouchedChangeEvent`, Angular ≥18.1). Given P4-12
  deliberately re-timed `onTouched` across four controls, this is adjacent live territory.
- `calendar.spec.ts:153` — `ctrl.disable()` does not reach the day cells. **I confirmed this in
  source** — see F-11 in Part B below; it is a real a11y defect, not a test problem.
- `table.spec.ts:193` — explicitly out of scope for v1 per the `table.ts` header note. Correctly
  blocked and correctly documented.

*Blocked on a test-harness limitation (8).* `split.spec.ts:232,317,383,413,449` (three
"Investigate:" entries where a real pointer-capture drag does not reproduce the unit-tested math —
these read as *possible library bugs wearing a test-infrastructure label*, and deserve a look;
plus RTL, where seeding `document.documentElement.dir` does not flip CDK `Directionality`),
`split.spec.ts:443` (planned `LiveAnnouncer` enhancement, not yet in `split.ts`).

Why it matters: `test.fixme` never executes its body, so a fixme whose bug has been fixed is
**undetectable by construction** — the suite reports green forever. `dialog.spec.ts:92` proves the
failure mode is not hypothetical. Worse, five real library defects currently live *only* as e2e
comments, invisible to the register, the changelog, and any consumer.

Fix — **and the design constraint is the finding**: `A11Y_BACKLOG` self-expires *because axe still
runs* and `partitionViolations` (`e2e/support/a11y.ts:78-95`) diffs the live violation list against
the allowance set, reporting `staleAllowances`. A `test.fixme` produces no such observation. You
cannot copy the mechanism directly; you have to pick a shape per entry:

1. **Convert every "the library is broken" fixme to `test.fail()`** — the 5 library-defect entries
   above plus the 3 `split.spec.ts` "Investigate:" ones, 8 total. Playwright runs a `test.fail()`
   body and **fails the suite if it unexpectedly passes**. That is precisely the `A11Y_BACKLOG`
   self-expiry property, and it would have caught `dialog.spec.ts:92` on the day the default was
   corrected. This is the single highest-value change in A4.
2. **Keep `test.fixme` only for the 19 "demo does not render the DOM" entries** — those bodies
   would time out, not fail, so `test.fail()` is wrong for them. Give them a registry instead:

   ```ts
   // e2e/support/fixme-registry.ts
   export interface FixmeEntry {
     readonly id: string;          // 'concurrent-overlays/dialog-select'
     readonly reason: string;
     readonly blockedOn: string;   // '_e2e/concurrent-overlays route'
     readonly reviewBy: string;    // ISO date
   }
   export const FIXME_REGISTRY: readonly FixmeEntry[] = [ … ];
   ```

   plus one meta-test in `e2e/specs/00-smoke/` that fails when `Date.now()` passes `reviewBy`,
   with the same "delete it or move the date, deliberately" message `A11Y_BACKLOG` uses for stale
   allowances. Each fixme call site takes the id: `test.fixme(fixmeReason('concurrent-overlays/dialog-select'))`,
   so an entry cannot exist without a registry row and a registry row cannot exist without an
   expiry.
3. **Add a second meta-test asserting every `test.fixme(` call site has a registry id** — a source
   scan, exactly like the `app.routes.spec.ts` drift guard the repo already ships. Without it,
   step 2 becomes optional the first time someone is in a hurry.
4. **File the 5 library defects into the register as defects**, independent of the tests. A bug
   that exists only inside a skipped test's comment is not tracked.
5. Delete `dialog.spec.ts:92`'s `.fixme` (step (c)), and fix the misplaced comment at
   `split.spec.ts:443`.

---

## A5

### F-05 One test harness ships (`calendar/testing`) — and the skips that ask for a harness are already unblocked by it
Severity: MEDIUM
Anchor: `projects/ngx-tw/calendar/testing/calendar-harness.ts:12`; the asking skips at `projects/ngx-tw/date-range-picker/date-range-picker.spec.ts:528` and `:550`
Register: extends "Open — carried to pass 5" → "Test harnesses: 1 of 56"
Confidence: [verified] — read the harness API and both skip comments

What: exactly one component ships a CDK test harness; two `it.skip`s ask in writing for a harness
capability that this existing harness already provides; and the register's "1 of 56" framing implies
a 56-harness goal that would be the wrong thing to build.

Why it matters: the library currently pays a harness entry point's maintenance and documentation
cost while getting no leverage from it — the one place in the repo that needed it did not know it
existed, and two tests stayed skipped as a result. Meanwhile "1 of 56" points future work at 42
harnesses nobody has ever asked for, each of which would be public API frozen against refactoring.

**The one that ships.** `@cdevhub/ngx-tw/calendar/testing` — a nested entry point with its own
`ng-package.json`, exporting `CalendarHarness` (`calendar-harness.ts:12`, `hostSelector 'tw-calendar'`)
and `CalendarCellHarness` (`calendar-cell-harness.ts:15`, `hostSelector '[role="gridcell"]'`), plus
its own 129-line spec. It is the only `@angular/cdk/testing` consumer in the library. `README.md:333`
documents it. 178 + 102 lines of harness for one component.

**The two skips that ask for one, in writing** (`it.skip`, not `test.fixme` — they are unit specs):

- `date-range-picker.spec.ts:524-527`: *"clicking calendar cells through the overlay does not
  propagate a `rangeChange` … likely related to the cell index used (cells[0]/[5] land on
  adjacent-month leading days which the strategy rejects). Re-enable after the test picks in-month
  cells, **or after the calendar exposes a deterministic harness API**."*
- `date-range-picker.spec.ts:548-549`: *"same cell-selection harness issue as the test above"*.

(A third, `:499-501`, asks for a `goToDate(value.start)` **library API**, not a harness — do not
count it here.)

**The finding that actually matters: the harness they ask for already exists, and nothing outside
its own spec uses it.** `CalendarHarness` ships `selectCell(text)` (`:85`), `selectRange(start, end)`
(`:96`), `getCells(filters)` (`:80`), `getDisabledCells()` (`:152`) and `isDisabled()` (`:157`).
`CalendarCellHarness.with({ text, selected, disabled })` (`:21`) filters by visible text — which is
*exactly* the "pick in-month cells deterministically" capability both skips are missing. Both were
written before or in ignorance of it. Two of the four `date-range-picker` skips are unblockable
today with an import, no new code.

**My position on "a harness per component": no — and the honest target is ~14, not 56.**

A harness earns its keep in proportion to the DOM and timing ceremony it removes from a *consumer's*
test. Measure that against what the skips above were actually fighting: `document.querySelectorAll('tw-calendar-cell button:not([disabled])')` reaching through an
overlay into the global document, then indexing by position. That is real ceremony, and the harness
erases it. Now measure it against `tw-badge`, `tw-separator`, `tw-skeleton`, `tw-avatar`,
`tw-spinner`, `tw-progress-bar`, `tw-aspect-ratio`, `tw-empty-state` — the consumer's whole test is
`expect(el.textContent)` or `expect(el.getAttribute('aria-valuenow'))`. A harness there is a second
API to learn that wraps a one-line query.

Two arguments make the scoped answer stronger than "more coverage is better":

1. **A harness is public API and carries the compatibility promise of one.** Angular Material's
   harnesses are semver-stable surface. 56 harnesses is 56 more exported surfaces frozen against
   refactoring, on a library that is still renaming variant vocabularies (register's open item 1)
   and adding `TW_` prefixes to tokens (open item 2). Shipping 42 harnesses nobody needs would
   convert every future internal DOM change into a breaking change.
2. **The library's own evidence says the demand is concentrated.** Four passes of auditing produced
   exactly two written harness requests, both for the same thing — driving a calendar grid through
   an overlay. Zero for `badge`, `card`, `alert`, `separator`.

**The right target — the ~14 components a consumer cannot easily drive from raw DOM:**

- *Overlay-bearing* (the DOM lives in a global overlay container, not the fixture): `select`,
  `combobox`, `menu`, `dialog`, `sheet`, `popover`, `tooltip`, `command-palette`, `date-picker`,
  `date-range-picker`, `time-picker`. **11.**
- *Form controls with non-trivial internal structure* where "set the value" is several DOM steps:
  `slider` (pointer math + two thumbs), `tags-input` (chip list + editor), `file-upload`
  (`DataTransfer` construction). **3.**

That is 14, plus the existing `calendar` = 15. Everything else — `checkbox`, `switch`, `radio`,
`input`, `textarea`, `number-input`, `segmented-control` — is one native element a consumer can
already click, and the rest of the library is presentational.

Why it matters: the current state is the worst of both worlds — the library pays the maintenance
cost of a harness entry point and the documentation cost of advertising it, and gets no leverage
because the one place in the repo that needed it did not know it existed. And "1 of 56" as a
register line implies a 56-shaped goal, which would be the wrong thing to build.

Fix:
1. **Immediately, zero new code:** rewrite `date-range-picker.spec.ts:528` and `:550` to use
   `CalendarHarness.selectRange('10', '14')` via `TestbedHarnessEnvironment.documentRootLoader(fixture)`
   (required — the calendar is in the overlay container, not the fixture), and delete both
   `it.skip`s. Confirm they pass; if they still fail, the fixme's *other* hypothesis (a real
   `rangeChange`/strategy bug) is the live one, which is itself a valuable answer.
2. Replace the register's "Test harnesses: 1 of 56" line with "harnesses for the 14 overlay/complex
   controls; 1 shipped" so the number stops implying the wrong goal.
3. Build the remaining 14 in priority order — `select`, `combobox`, `dialog`, `menu` first; those
   four are the most-used and each needs `documentRootLoader` ceremony a consumer will otherwise
   reinvent. Ship each as `<component>/testing` with its own `ng-package.json`, matching the
   `calendar/testing` shape exactly. Purely additive; no semver event.
4. Do **not** build harnesses for presentational components. Record that as a decision so it stops
   reappearing as a gap.

---

## A6

### F-06 Four demo prose sites claim toast swipe is disabled under `prefers-reduced-motion`; the library has no such gate — and the register's cost estimate for adding it is wrong
Severity: MEDIUM
Anchor: prose at `projects/demo/src/app/routes/toast/overview/toast-overview.component.ts:75` and `:160`, `projects/demo/src/app/routes/toast/api/toast-api.component.ts:199`, `projects/demo/src/app/routes/toast/examples/toast-examples.component.ts:184`; absent gate at `projects/ngx-tw/toast/toast-container.ts:326-330`
Register: extends "Open — carried to pass 5" → toast prose defect; **contradicts** its cost line "adding the gate would silently kill six e2e tests"
Confidence: [verified] for the prose and the absent gate; [verified] for the per-test cost (read all six tests and the Playwright config) — not [measured], since I did not run playwright

What: four demo prose sites assert a `prefers-reduced-motion` gate on toast swipe-to-dismiss that
does not exist anywhere in the library, and the register's estimate of what adding the gate would
cost is wrong in both directions.

Why it matters: the demo is the library's documentation. A consumer relying on it reads that a
WCAG-adjacent behaviour is handled for them when it is not, and `toast-api.component.ts:199` also
breaks the demo-mirrors-library-JSDoc-verbatim convention the register established in Tier 1. The
register's mis-costing has kept the decision parked for four passes as though it were expensive.

**The prose (4 sites, not 1).**
- `toast-overview.component.ts:75` — *"Horizontal drag past the threshold dismisses with reason `'swipe'`; **disabled under `prefers-reduced-motion`**."*
- `toast-overview.component.ts:160` — feature bullet: *"Respects `prefers-reduced-motion` on enter / leave animations **and swipe**"*
- `toast-api.component.ts:199` — API-table row: *"Enables horizontal pointer swipe to dismiss; **disabled under prefers-reduced-motion**."*
- `toast-examples.component.ts:184` — *"lets pointer users drag a toast off-screen — **disabled automatically** under `prefers-reduced-motion`."*

**The absent gate.** `toast-container.ts:326-330` is the entire entry condition:

```ts
protected onSwipeStart(ref: ToastRef, event: PointerEvent, el: HTMLElement): void {
  if (!ref.config.swipeToDismiss) return;
  if (event.button !== 0) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('button, a, input, select, textarea, [role="button"]')) return;
```

`grep -rn "matchMedia\|prefers-reduced-motion" projects/ngx-tw/` returns **zero hits anywhere under
`toast/`**. The only runtime `matchMedia('(prefers-reduced-motion: reduce)')` in the library is
`carousel.ts:1198-1204`; everything else is CSS in `theme/_base.css:339,348,384`. Note the library's
own JSDoc is **correct** — `toast-config.ts:118` says only *"Enable horizontal swipe-to-dismiss via
pointer gestures. Defaults to `true`."* So this is demo prose inventing a behaviour the library never
claimed, and `toast-api.component.ts:199` also breaks the demo-mirrors-JSDoc-verbatim convention the
register established in Tier 1.

**The register's cost estimate is wrong, and the true cost points the other way.**
`playwright.config.ts:62` sets `contextOptions: { reducedMotion: 'reduce' }` **globally**, with the
comment that it is *"critical for stability … so overlay open/close tests don't race CSS keyframes."*
So every e2e test already runs under reduce. `toast-gestures.spec.ts` has **6** tests, of which only
**4** touch swipe. Adding the gate would produce:

| test | effect of adding the gate |
|---|---|
| `:70` a drag past the threshold dismisses the toast | **FAILS** — the only red |
| `:84` a drag short of the threshold snaps back | **passes vacuously** — no transform is ever applied, so `abs(after.x - before.x) < 2` is trivially true |
| `:102` a drag against the stacking edge never dismisses | **passes vacuously** — asserts the toast survives |
| `:116` `swipeToDismiss=false` ignores the gesture | **passes vacuously** — already asserts nothing happens |
| `:128`, `:146` Escape tests | unaffected |

So the true cost is **1 red test and 3 silently vacuous ones** — not six killed. That correction
matters in both directions: it is *cheaper* than the register says, and *more dangerous*, because
three tests would go on reporting green while testing nothing. That is the exact vacuity failure
mode the register already recorded for `onSwipeEnd` under a zero `getBoundingClientRect`.

And the escape hatch exists: `test.use({ reducedMotion: 'no-preference' })` at **file scope**, one
line at the top of `toast-gestures.spec.ts`, restores all four swipe tests to non-vacuous. Its
secondary cost is real and should be stated: that file would then run with toast enter/leave
animations live again, which is precisely the flake the global setting was added to prevent.

Fix — **needs a decision, and I recommend Option A:**

**Option A — delete the claim from the prose (4 edits, demo only, ~10 minutes).**
Rationale, and it is stronger than "the code is easier to leave alone":
- WCAG 2.3.3 *Animation from Interactions* is **AAA**, not the AA bar CLAUDE.md sets, and it targets
  non-essential motion *triggered by* an interaction (parallax, scroll-jacking) — not direct
  manipulation, where the element tracks the pointer 1:1. A swipe transform is direct manipulation.
- iOS and Android do **not** disable direct-manipulation drag gestures under Reduce Motion. Matching
  the platform is the accessible choice.
- Disabling swipe under reduced motion **removes a dismissal affordance** from the users who set that
  preference. Escape and the close button remain, but a pointer-only user loses a gesture for a
  preference that says nothing about their pointer. Arguably a small a11y regression dressed as a win.
- Costs zero test churn and creates zero vacuous tests.

Concretely: strike the clause at `toast-overview.component.ts:75`, drop "and swipe" from `:160`,
restore `toast-api.component.ts:199` to `toast-config.ts:118`'s JSDoc text verbatim, and strike the
clause at `toast-examples.component.ts:184`. Optionally add one sentence saying the toast's
*enter/leave animations* do honour the preference (true — `theme/_base.css`) while the swipe gesture
tracks the pointer directly.

**Option B — ship the gate (1 library edit + 1 e2e line + 1 new test).**
Add `if (this.prefersReducedMotion()) return;` to `onSwipeStart`, reading
`matchMedia('(prefers-reduced-motion: reduce)')` behind the same
`typeof window !== 'undefined' && typeof window.matchMedia === 'function'` SSR guard `carousel.ts:1198`
already uses (do **not** copy the unguarded form — P4-7 was exactly this). Then add
`test.use({ reducedMotion: 'no-preference' })` at the top of `toast-gestures.spec.ts` so all four
swipe tests keep testing swipe, and add **one new test under `reducedMotion: 'reduce'`** asserting
the gesture is inert — otherwise the new behaviour ships with zero coverage. Accept re-introduced
animation timing in that one file. This is a small behavioural change to a shipped component and
should be called out in the changelog even though it is not a semver break.

Whichever is chosen, the same decision governs the tooltip/popover/menu family if they ever grow
gestures, so record it rather than just editing the four strings.

---

## A7

### F-07 The untested-input metric has no pinned definition, so pass 2 and pass 4 measured different quantities and neither is wrong
Severity: MEDIUM
Anchor: methodology, not a code site — scripts saved at `scratchpad/inputs.mjs` and `scratchpad/inputs2.mjs`; representative worst case `projects/ngx-tw/date-picker/date-picker.ts:454`
Register: **reframes** "Pass 2's claim … is **wrong**: re-derived with alias resolution, the number does not move" — pass 4 did resolve aliases and its per-component numbers reproduce here exactly; the two passes measured different quantities. Confirms "worst offender is `date-picker`".
Confidence: [measured] — six definitions, one script, saved and re-runnable

What: the "N inputs never appear in any spec" metric has been re-derived by four passes with no
written definition of its denominator or its matcher, which produced an apparent
[measured]-versus-[measured] contradiction between pass 2 and pass 4 that turns out to be a
definitional mismatch. Under six explicit definitions the figure ranges from 41 (5.6%) to 244
(33.1%) on the same corpus.

Why it matters: a headline reported as "flat across four passes" is currently unfalsifiable — it
cannot be shown to have improved or regressed, so it cannot drive a decision, and it has already
cost a pass to a phantom disagreement between two correct measurements.

**Denominator, stated explicitly so this is reproducible.** Every `input(` / `input.required(` /
`model(` / `model.required(` **declaration** in a non-spec, non-`.meta.ts` file under
`projects/ngx-tw/`. One row per declaration — an aliased input is **one** row carrying two
searchable names. Host-directive re-exports are not declarations and are excluded. Result:
**738 declarations, 103 of them aliased.** (The register's 672 is close; the gap is almost certainly
internal sub-components — `calendar-view-base`, `month-view`, `calendar-header`,
`calendar-form-directives`, `dialog-content`, `sheet-content`. Per-component the two agree:
I measure `date-picker` at **38** total, exactly the register's denominator for it.)

**Six definitions, one corpus:**

| mode | definition | untested | % |
|---|---|---|---|
| A | property name appears anywhere in the **global** spec corpus | 86 | 11.7% |
| B | A, **plus alias** | 41 | 5.6% |
| C | property name appears in its **own entry point's** specs | 193 | 26.2% |
| D | C, **plus alias** | 120 | 16.3% |
| E | **driven** (`setInput('x'`, `[x]=`, `x="…"`, `.x.set(`) in its own entry point's specs | 244 | 33.1% |
| F | E, **plus alias** | 180 | 24.4% |

**Settling pass 2 vs pass 4 — and the honest answer is that neither is wrong.**

Two facts, both measured. First: **within any single methodology, alias resolution moves the number
substantially.** A→B: **−45**. C→D: **−73**. E→F: **−64**. There is no reading of this corpus under
which aliases are negligible — the 103 aliased declarations include every `aria-label` /
`aria-labelledby` / `aria-describedby` in the library (the exact family F10 was about) plus `id`,
`readonly`, `required`, `disabled` and `twRowExpansionWhen`. A matcher that searches `ariaLabelledby`
and not `aria-labelledby` mis-scores all of them. **Pass 2's mechanism claim is therefore correct.**

Second, and this is what I initially got wrong: **pass 4 clearly resolved aliases too.** Its
per-component figures reproduce under my mode F almost exactly —

| component | pass 4 (post-alias) | my mode F |
|---|---|---|
| `combobox` | 3 | **3**/33 |
| `select` | 6 | **6**/28 |
| `date-picker` | 19/38 | 21/**38** |

Two exact matches and a near-match on an identical denominator is not coincidence. So pass 4's
"the number does not move" almost certainly means *"the **total** stayed near 140 after alias
resolution, because composition shifted"* — which its own note says explicitly ("Composition shifted
usefully though: `combobox` 17→3, `select` 16→6"). I measured the delta **within** one methodology;
pass 4 measured the total **across** two passes' methodologies. Both are true, and they are not the
same quantity.

**What is genuinely unresolvable is that neither pass published its script.** That is the finding.
Two [measured] claims sat in apparent contradiction for a full pass purely because the metric had no
written definition, and it took a third derivation to discover they were not actually in conflict.

**"140/672 flat across four passes" is still not evidence of stagnation.** 140/672 = 20.8% sits
between my mode D (16.3%) and mode F (24.4%). Four passes each re-derived a number with an unstated
matcher against a denominator that itself moved (672 vs my 738); a flat headline over a shifting
definition and a shifting composition says very little about whether coverage improved.
Recommend the register adopt **mode F** as the official metric — it is the one that means "a test
actually drives this input", it resolves aliases, and it is the conservative choice — and that
`scratchpad/inputs2.mjs` be moved to `scripts/` so pass 6 re-runs it rather than re-inventing it.

Worst offenders under mode F: `calendar` 36/69, `date-picker` **21/38** (the register's worst
offender, corroborated), `date-range-picker` 18/48, `radio` 9/26, `carousel` 9/22,
`time-picker` 8/24, `command-palette` 8/22, `table` 7/23.

**Top 20 highest-risk untested inputs.** Filtered to inputs that change *behaviour*, not a class
string, and that a consumer is likely to actually set. Every one verified individually at **zero**
occurrences in its own entry point's specs.

| # | anchor | input | why it is high risk |
|---|---|---|---|
| 1 | `date-picker/date-picker.ts:463` | `parseFormat` | **Parsing** user-typed dates. Wrong parse silently yields the wrong date or `null` — the highest-consequence untested input in the library. |
| 2 | `date-picker/date-picker.ts:460` | `format` | Display formatting of the committed value; pairs with (1) and is the first thing a non-US-locale consumer sets. |
| 3 | `date-picker/date-picker.ts:457` | `startAt` | Which month the panel opens on. `date-range-picker.spec.ts:499-501` already records a *related* bug ("calendar always opens on today"); nothing tests the picker's own knob. |
| 4 | `date-picker/date-picker.ts:454` | `startView` | Opens on day/month/year. Changes the first rendered view and the whole keyboard model. |
| 5–16 | `checkbox:343`, `radio:310` & `:659`, `switch:262`, `slider:514`, `select:572`, `combobox:460`, `segmented-control:312`, `tags-input:318`, `transfer:584`, `file-upload:341`, `date-picker:552`, `date-range-picker:528`, `time-picker:596` | `errorStateMatcher` | **A 14-instance cluster with zero coverage anywhere.** This is the per-instance override of `TW_ERROR_STATE_MATCHER` — the token CLAUDE.md calls out by name, whose integration forced the whole runtime-CVA-registration rule, and whose plumbing P4-4/P4-10 spent a pass repairing. The default path is tested; the override is not tested on a single control. If the input were silently ignored, nothing would fail. |
| 17 | `date-range-picker/date-range-picker.ts:495,498,501` | `hourStep` / `minuteStep` / `secondStep` | Numeric stepping on a time row: classic off-by-one / non-dividing-step territory (see F-13 below). |
| 18 | `date-range-picker/date-range-picker.ts:458` | `maxRangeLength` | A **validation** bound. Untested, and `e2e/specs/01-components/date-range-picker.spec.ts:175`'s fixme says the picker does not even surface it — two independent signals on one input. |
| 19 | `time-picker/time-picker.ts:586` + `:590` | `showSteppers` / `showClear` | Both remove a primary affordance. `showSteppers` additionally carries a documented size-dependent override ("Ignored at `size='xs'` on the bordered `default` variant") that nothing verifies. |
| 20 | `carousel/carousel.ts:541`,`:544`,`:547` | `pauseOnHover` / `pauseOnFocusIn` / `draggable` | `pauseOnFocusIn`'s own JSDoc claims **WCAG 2.2.2 compliance**. An accessibility conformance claim with no test is the worst kind of untested input. |

Honourable mentions just outside the 20, all behaviour-changing and all at zero:
`popover:361` `twPopoverCloseOnOutside` and `:369` `twPopoverScrollStrategy` (dismiss semantics);
`select:554` / `combobox:439` / `date-picker:521` `scrollStrategy` (overlay behaviour on scroll);
`command-palette:433` `autoFocus`; `tabs:217` `isFocusStop` and `:220` `isDisabled` (keyboard
traversal); `paginator:457` `isDisabled`; `calendar:509` `resetBehavior` (the form-reset path four
`test.fixme`s are already blocked on — see F-04); `radio:292` `labelPosition`;
`switch:247` / `slider:487` `name` (native form submission).

Deliberately **excluded** as low-risk despite being untested: `carousel:1504` `color`,
`carousel:1510` `position`, `select:533` `size` / `:536` `color`, `time-picker:549` `size` /
`:555` `variant`, `dialog-content:160` `align`, `sheet-content:160` `align`, `table:697` `stackLabel`
— these resolve to a `tv()` slot and CLAUDE.md explicitly says not to test class names.

Fix:
1. Adopt mode F, move `inputs2.mjs` into `scripts/`, and print the number in CI so the metric has a
   definition and a trend instead of a re-derivation per pass.
2. Write the **`errorStateMatcher` cluster** first — one shared spec shape, applied to all 14
   controls, asserting a custom matcher flips `aria-invalid` where the default would not. Highest
   coverage-per-line in the library, and it guards the token CLAUDE.md treats as load-bearing.
3. Then `date-picker`'s `parseFormat` / `format` / `startAt` / `startView` — four inputs on the
   worst-offending component, all behavioural, all trivially unit-testable.
4. `carousel.pauseOnFocusIn` needs a test specifically because its JSDoc asserts WCAG conformance.

---

# Part B — new defects

### F-08 `provideCalendarIntl` / `provideTimePickerIntl` use `Object.assign`, so an explicitly-`undefined` field overwrites the default and crashes the calendar on view switch
Severity: HIGH
Anchor: `projects/ngx-tw/calendar/calendar-intl.ts:273`, `projects/ngx-tw/time-picker/time-picker-intl.ts:91`, `projects/ngx-tw/calendar/calendar.ts:942`
Register: extends P4-8 (same defect class, three sites P4-8 did not cover)
Confidence: [verified] — read all three merge sites and traced the crash path to a literal `.replace()` on the overwritten field

What: P4-8 fixed the label-object spread in `carousel`, `paginator`, `transfer` and `provideTheme`,
establishing the `Object.entries(…).filter(([, v]) => v !== undefined)` + `Required<>` pattern. I
re-swept: **all five spread-merge sites are correctly guarded** (`carousel.ts:606`, `table.ts:1031`,
`paginator.ts:664`, `timeline.ts:727`, `theme.config.ts:37`) — that half of the sweep is clean.

But the same defect exists in three `Object.assign` sites the pattern never reached.
`Object.assign` copies own enumerable properties **including ones whose value is `undefined`**:

```ts
// calendar-intl.ts:270-275
export function provideCalendarIntl(custom: Partial<CalendarIntl>): Provider {
  return { provide: CalendarIntl, useFactory: () => Object.assign(new CalendarIntl(), custom) };
}
// time-picker-intl.ts:88-93 — identical shape
// calendar.ts:942 — Object.assign(merged, this.injectedIntl, override)   (the per-instance `intl` input)
```

The crash path is concrete and short. `CalendarIntl.monthViewLabel` is a plain string field
(`calendar-intl.ts:100`), and `viewSwitched()` calls `.replace()` on it directly:

```ts
// calendar-intl.ts:170-174
viewSwitched(view: 'day' | 'month' | 'year', period: string): string {
  const label = view === 'day' ? this.monthViewLabel.replace(/ view$/, '') : …
```

`viewSwitched` is reached from `announceViewChange()` on every drill-up/drill-down
(`calendar.ts:1366`). So:

```ts
provideCalendarIntl({ monthViewLabel: i18n['calendar.monthView'] })   // key missing → undefined
```

type-checks (root `tsconfig.json` does not set `exactOptionalPropertyTypes` — the exact premise
P4-8 documented), silently replaces the default with `undefined`, and the first view switch throws
`Cannot read properties of undefined (reading 'replace')` — the identical error string P4-8's own
JSDoc quotes.

Why it matters: this is **strictly worse than the three cases P4-8 fixed**. Those were per-component
`[labels]` bindings; these are `EnvironmentProviders` set once at bootstrap, so one missing key in an
i18n bundle breaks *every* calendar and time-picker in the application. And it is the exact usage
`provideCalendarIntl` exists for — the four shipped locale packs (`calendar-intl-de/fr/es/pt/ja.ts`)
all document "Pass into the `intl` input or via `provideCalendarIntl`", which is precisely where a
dynamic lookup lands.

Fix (additive, no signature change, not a semver event):
```ts
export function provideCalendarIntl(custom: Partial<CalendarIntl>): Provider {
  return {
    provide: CalendarIntl,
    useFactory: () => {
      const defined = Object.fromEntries(
        Object.entries(custom).filter(([, v]) => v !== undefined),
      );
      return Object.assign(new CalendarIntl(), defined);
    },
  };
}
```
Same change in `time-picker-intl.ts:88-93`, and in `calendar.ts:936-946` filter `override` before
the `Object.assign(merged, this.injectedIntl, override)`. Add one spec per site passing
`{ monthViewLabel: undefined }` and asserting the default survives — and confirm it fails without
the filter, per CLAUDE.md's forced-failure rule.

---

### F-09 A disabled `tw-calendar` still presents every day cell as enabled and focusable
Severity: HIGH
Anchor: `projects/ngx-tw/calendar/calendar.ts:685` (`effectiveDisabled`), used at only `:148` and `:1371`; the plumbing gap at `projects/ngx-tw/calendar/calendar-view-base.ts:74`
Register: extends the `e2e/specs/01-components/calendar.spec.ts:153` fixme (which is **correctly** diagnosed and has no register entry); not otherwise in register
Confidence: [verified] — traced every consumer of `effectiveDisabled` and read the cell's own disabled source

What: `effectiveDisabled = computed(() => disabled() || cvaDisabled())` (`calendar.ts:685`) has
exactly **two** consumers in the entire library:
- `calendar.ts:148` — `'[attr.aria-disabled]': 'effectiveDisabled() || null'` on the host
- `calendar.ts:1371` — an early return in `onDateSelected()`

It is never passed down. `CalendarViewBase` (`calendar-view-base.ts:38-77`) declares 14 inputs and
**`disabled` is not one of them**; a cell's disabled state comes solely from
`month-view.ts:127` `enabled: !isDateDisabled(date, minDate, maxDate, dateFilter, …)`, i.e. from
date constraints only. `calendar-cell.ts:176` binds `[attr.aria-disabled]="!cell().enabled || null"`.

The contrast is the proof this is an oversight, not a design: **`readonly` IS plumbed** —
`calendar.ts:231,253,272,289` pass `[readonlyGrid]="effectiveReadonly()"` into all four views. The
identical wiring for `disabled` was simply never added.

Why it matters: with `[disabled]="true"` or a `control.disable()` on a bound `FormControl`:
- every day cell still reports itself enabled to assistive tech (no `aria-disabled`), so a screen
  reader user is invited to activate ~35 buttons that silently do nothing;
- the active cell keeps `tabindex="0"` (`month-view.ts:63`), so keyboard focus still enters the grid
  and arrow-navigates;
- there is **no visual disabled treatment at all** — `grep` for `opacity-50` / `cursor-not-allowed`
  gated on `effectiveDisabled` in `calendar.ts` returns nothing — so the calendar looks fully live;
- the header's prev/next/period buttons derive from `minDate`/`maxDate`, not from
  `effectiveDisabled`, so month paging still works on a disabled calendar.

That is a WCAG 4.1.2 (Name, Role, Value) problem: the state exposed to AT contradicts the state.
Note the click *is* inert (`:1371`), so this is a state-exposure and affordance defect, not a data
-integrity one — which is exactly why no test caught it.

Fix (additive):
1. Add `readonly disabledGrid = input<boolean>(false)` to `CalendarViewBase` alongside
   `readonlyGrid` (`calendar-view-base.ts:74`), and bind `[disabledGrid]="effectiveDisabled()"` at
   all four call sites `calendar.ts:231,253,272,289` — copy the `readonlyGrid` wiring verbatim.
2. In each view's cell builder, `enabled: !disabledGrid() && !isDateDisabled(…)`
   (`month-view.ts:127`, `year-view.ts:79`, `multi-year-view.ts:83`).
3. Gate the header buttons: pass `prevDisabled/nextDisabled/canSwitchView` as
   `… || effectiveDisabled()`.
4. Add `opacity-50` to the host classes when `effectiveDisabled()`. Do **not** add
   `pointer-events-none`, even though CLAUDE.md's disabled table names it as the preferred pairing:
   `calendar-cell.ts:298-299` records that mouse events must still dispatch on disabled cells (before
   the switch to `aria-disabled`, a natively-disabled cell never previewed, because browsers do not
   dispatch mouse events on it). Leave that reason in the code as a comment, or a reviewer will add
   `pointer-events-none` straight back.
5. Then delete the `test.fixme` at `e2e/specs/01-components/calendar.spec.ts:153` — it is the test
   for this fix and is currently the only place the bug is written down.

---

### F-10 `combobox` re-subscribes to backdrop + Escape on every open and never unsubscribes on close — subscriptions and `DestroyRef` callbacks grow without bound
Severity: HIGH
Anchor: `projects/ngx-tw/combobox/combobox.ts:1416-1439` (the two `subscribe*` methods), called from `:1301-1302`; `closeOverlay()` at `:1318-1339` does not undo them
Register: not in register — extends the F11/F12 destroy-path class the register opened but did not sweep
Confidence: [verified] — I read every site myself after the delegated sweep flagged it, and confirmed all four sibling components

What: `openOverlay()` (`combobox.ts:1299-1316`) calls `subscribeBackdrop()` and
`subscribeOverlayEscape()` on **every** open. Both register their teardown on the component's
`DestroyRef`, not per-open:

```ts
// :1416-1422
private subscribeBackdrop(): void {
  if (!this.overlayRef) return;
  const sub = this.overlayRef.backdropClick().subscribe(() => { this.closePanel(); });
  this.destroyRef.onDestroy(() => sub.unsubscribe());     // <- component lifetime, not panel lifetime
}
// :1433-1439 — same shape for consumeOverlayEscape
```

Meanwhile `ensureOverlay()` (`:1342-1345`) short-circuits on `if (this.overlayRef) { … return; }`,
so **one** `OverlayRef` is created and reused for the component's whole life, and `closeOverlay()`
(`:1318-1339`) only calls `overlayRef.detach()` — it disconnects the `ResizeObserver` and clears
timers but never touches the subscriptions. `overlayRef.dispose()` appears exactly once, at `:903`,
inside the component's destroy block. CDK's `backdropClick()` / `keydownEvents()` Subjects complete
only on `dispose()`, so nothing completes them at close.

Net: after N open/close cycles the component holds N live backdrop subscriptions, N Escape
teardowns, and 2N `DestroyRef` callback closures. One Escape keypress runs the handler N times.

**`combobox` is the only component in its family that skipped the pattern its siblings document as
mandatory:**
- `select.ts:1537-1554` — `subscribePerOpen()` opens with `this.perOpenSubs?.unsubscribe()`, and
  close tears it down (`:1462-1463`).
- `popover.ts:643-645` — same `perOpenSubs`, with the comment *"torn down on close to prevent
  accumulation when the directive is opened/closed many times."*
- `command-palette.ts:733-734` — `perOpenSubs?.unsubscribe(); perOpenSubs = null;` inside the close
  timer.
- `date-picker.ts:1358` — comment: *"takeUntilDestroyed is needed — accumulating subscribers across
  multiple open/close cycles is the bug we'd hit otherwise."*

Why it matters: the handlers are individually idempotent (`closePanel()` guards on `this.closing`),
so nothing renders wrong — which is exactly why it has gone unnoticed. The cost is unbounded
retention on the component most likely to be opened hundreds of times in one session (an
autocomplete/filter field in a data-heavy app), plus N-fold redundant handler execution. This is the
same class as F11 and F12 and it sits in a component four siblings already got right.

Fix (internal only, no API change): give `combobox` the `select.ts:1537-1554` `perOpenSubs` bag —
add `private perOpenSubs: Subscription | null = null`, have `subscribeBackdrop`/`subscribeOverlayEscape`
add into it instead of calling `destroyRef.onDestroy`, call `this.perOpenSubs?.unsubscribe()` at the
top of a new `subscribePerOpen()` invoked from `openOverlay()`, and unsubscribe + null it in
`closeOverlay()`'s timer callback alongside `overlayInstance = null`. Keep the existing
`overlayRef?.dispose()` on destroy — do **not** move `dispose()` into close; that would break the
`ensureOverlay()` reuse guard, a trap `picker-overlay-coordinator.ts:209-213` documents.
Spec: open/close 3 times, then assert the Escape handler fires once (spy on `closePanel` or count
`openedChange` emissions).

---

### F-11 `split` leaves an in-flight gutter drag wired up when the component is destroyed mid-gesture
Severity: MEDIUM
Anchor: `projects/ngx-tw/split/split.ts:597-615` (`_onGutterPointerDown`); cleanup only at `:662-673` (`_onGutterPointerUp`)
Register: not in register — extends F11/F12 (carousel timer, toast pointer capture)
Confidence: [verified] for the code fact; [reported] for the runtime consequence — I did not run a browser, and I say so deliberately below

What: `_onGutterPointerDown` calls `target.setPointerCapture(event.pointerId)` (`:600`) and adds
three listeners on the gutter element (`:607-609`), then stores `this._drag`. The **only** path that
removes them is `_onGutterPointerUp` (`:662-673`), which is itself reached only via those listeners.
`split.ts` has a `_destroyRef` (`:175`) with two `onDestroy` hooks (`:289` `ro.disconnect()`, `:308`
`sub.unsubscribe()`) — neither releases the drag.

`slider.ts:1141-1148` is the exact precedent and does it right:
```ts
this.destroyRef.onDestroy(() => {
  this.focusMonitor.stopMonitoring(this.elementRef);
  for (const { target } of this.capturedPointers.values()) {
    target.removeEventListener('pointermove', this.onPointerMove);
    target.removeEventListener('pointerup', this.onPointerUp);
    target.removeEventListener('pointercancel', this.onPointerUp);
  }
  this.capturedPointers.clear();
});
```
`split` is the one drag component without it.

Why it matters: a component destroyed mid-drag — a route change, an `@if` collapsing, a dialog
closing while the user holds the gutter — leaves `_drag` set with three live listeners and an
unreleased pointer capture. If `_onGutterPointerMove` fires once more it writes `_sizes` on a
destroyed component, the same signature as F11's post-destroy signal write.

**Honest scoping.** This is weaker than the carousel/toast leaks and I will not overstate it: the
listeners are bound to `target`, an element inside the component's own template, so once the
component is destroyed and unreferenced the whole graph is GC-eligible — it is not a classic
unbounded leak. Browsers do fire `pointercancel` when a captured element is disconnected, which
would in practice run the cleanup. What is *not* guaranteed is ordering relative to Angular's
destroy, so `_onGutterPointerMove` writing `_sizes` on a destroyed component is possible — the same
signature as F11's "timer fired after destroy and wrote a signal on a dead component". Treat this as
a defence-in-depth / consistency gap against `slider.ts`, not a proven leak.

Note the symmetric residual: `slider.ts:1141-1148` removes the listeners but never calls
`releasePointerCapture` for entries in `capturedPointers`. If capture release on destroy matters,
`slider` has that half missing; if it does not, `split`'s exposure is correspondingly smaller.
Fix both the same way or neither.

Fix: add to `split.ts`'s constructor —
```ts
this._destroyRef.onDestroy(() => {
  const d = this._drag;
  if (!d) return;
  d.target.removeEventListener('pointermove', d.moveHandler);
  d.target.removeEventListener('pointerup', d.upHandler);
  d.target.removeEventListener('pointercancel', d.upHandler);
  try { d.target.releasePointerCapture(d.pointerId); } catch { /* already released */ }
  this._drag = null;
});
```
which requires widening the `_drag` record to retain `target`, `moveHandler` and `upHandler`
(private field, no API impact). Add the matching `releasePointerCapture` loop to `slider.ts`.

---

### F-12 `overlay-container-coordinator` schedules a `requestAnimationFrame` it never cancels
Severity: LOW
Anchor: `projects/ngx-tw/core/overlay/overlay-container-coordinator.ts:124`; destroy hook at `:91-94`
Register: not in register
Confidence: [verified]

What: `startEnterAnimation()` calls `requestAnimationFrame(() => { … })` without storing the handle,
and nothing calls `cancelAnimationFrame`. If the coordinator is destroyed in the same frame the
animation starts, the callback runs after `destroyRef.onDestroy` (`:91-94`) has already cleared the
animation timer, and schedules a fresh `setTimeout` via `runAnimationTimer` that is then never
cleared.

Why it matters: small. The stray timer's only effect is `.emit()` on an already-completed
`EventEmitter` — a no-op. Reported because the code fact is certain and the fix is one line, and
because leaving one unpaired scheduler in the shared overlay coordinator undercuts the "every
scheduler is torn down" invariant the other fixes in this section are trying to establish.

Fix: store the handle in a field, `cancelAnimationFrame` it in the existing `destroyRef.onDestroy`
block at `:91-94`, and null it in the callback. While there: the same file's `EventEmitter` at `:88`
is an RxJS stream consumed via `.pipe()` and should be a `Subject<T>` — the register already
recorded that as cosmetic and deferred; folding it into this edit is cheap.

**Cleared in this sweep** (checked, teardown verified against the code, not the pattern): all 7
`overlay.create(` sites dispose their `OverlayRef` on destroy — `tooltip`, `picker-overlay-coordinator`,
`toast-renderer`, `combobox`, `popover`, `command-palette`, `select`; and `tabs`, `slider`,
`theme.service`, `flip-card`, `form-field`, `stat`, `timeline`, `escape.ts`, `form-reset.ts`,
`calendar`, `radio`, `date-range-picker`, `segmented-control`, `tab-nav`, `time-picker`, `input`,
`transfer`, `checkbox`, `stepper`, `tags-input`, `dialog`, `dialog-ref`, `date-picker`, `file-upload`,
`menu`, `switch`, `sheet`, `sheet-ref`, `code-block`, `toast-ref`, `toast-renderer`, `toast`.
Raw hit counts: `addEventListener` 21, observers 10, `setInterval` 1, `requestAnimationFrame` 1,
`setPointerCapture` 4, `.subscribe(` 82, `overlay.create(` 7, field-stored `setTimeout` 24.

---

### F-13 Overlay configuration is built once per component *lifetime* in `tooltip`, `select`, `combobox` and `popover` — `position`, `offset` and `scrollStrategy` are frozen after the first open
Severity: HIGH
Anchor: `projects/ngx-tw/tooltip/tooltip.ts:487`; `projects/ngx-tw/select/select.ts:1482` and `:1489`; `projects/ngx-tw/combobox/combobox.ts:1351` and `:1358`; `projects/ngx-tw/popover/popover.ts:591-598`
Register: not in register — extends the P4-6 / P4-9 "input read once, never re-read" class the brief flags as highest-value
Confidence: [verified] — each read site traced to its single occurrence in its file; the "disposed only at destroy" claim checked against each file's actual destroy and close bodies

What: four components build their CDK overlay inside a private `ensureOverlay()` / `createOverlay()`
guarded by `if (this.overlayRef) return;`, and dispose the `OverlayRef` **only** in
`destroyRef.onDestroy`. Closing merely `detach()`es. So "once per overlay creation" means once per
*component lifetime*, and every input consumed at creation time is frozen from the first open
onward.

| component | frozen input | sole read site | guard | dispose site |
|---|---|---|---|---|
| `tooltip` | `twTooltipPosition` (`:326`, default `'top'`) | `:487` `buildPositions(this.twTooltipPosition())` | `:485` | `:400` (destroy only); hide path is `detach()` at `:556-559` |
| `select` | `offset` (`:557`), `scrollStrategy` (`:554`) | `:1482`, `:1489` | `:1474` | `:1056` (destroy only) |
| `combobox` | `offset` (`:442`), `scrollStrategy` (`:439`) | `:1351`, `:1358` | `:1344` | `:903` (destroy only) |
| `popover` | `twPopoverScrollStrategy` (`:369`), backdrop config from `twPopoverBackdrop` (`:591-594`) | `:591-598` | `:586` | destroy only |

`tooltip` is the worst of the four: `[twTooltipPosition]="isMobile() ? 'bottom' : 'right'"` is an
entirely ordinary binding, tooltips show and hide constantly, and the value is silently ignored for
the rest of the tooltip's life after the first hover. (Its `scrollStrategy` is hard-coded, not
input-driven — no bug there.)

`popover` is a **partial** bug and the split is itself diagnostic: position and offset *are* refreshed
every open via `updatePositionStrategy()` (called from `openPopover()` at `:514`), so
`twPopoverPosition` / `twPopoverOffset` are fine. But `subscribePerOpen()` at `:618` re-reads
`twPopoverBackdrop()` every open to decide whether backdrop-click closes, while the overlay's actual
`hasBackdrop` / `backdropClass` were baked in at first creation. Flip `twPopoverBackdrop` from
`'none'` to `'dimmed'` after the first open and you get click-to-close behaviour updating while the
dim layer never appears — two reads of one input disagreeing. (I state that as observed code
behaviour; I did not verify CDK's internal `hasBackdrop` re-read semantics and am not asserting them.)

**The library has already solved this, in writing, and four components did not get the memo.**
`projects/ngx-tw/core/overlay/picker-overlay-coordinator.ts:209-213`:

```ts
// Dispose the OverlayRef so the next open() builds a fresh one with the
// current inputs (offset, scrollStrategy, panelClass). Without this the
// `if (this.overlayRef) return null;` guard at the top of open() would
// permanently block re-opens after the first close.
this.overlayRef?.dispose();
```

`date-picker` and `date-range-picker` route through that coordinator and are **correct**. This is the
same shape as P4-9, where `carousel.ts:693` documented the fix and `timeline` had it anyway.

Why it matters, and note the convergence with A7: `select.offset`, `select.scrollStrategy`,
`combobox.offset`, `combobox.scrollStrategy` and `popover.twPopoverScrollStrategy` are **all five in
F-07's untested list** — zero occurrences in their own entry point's specs. Five inputs that are
simultaneously broken and untested, found by two independent methods. `scrollStrategy` in particular
is documented consumer API for choosing what an overlay does on scroll; today, changing it after the
first open does nothing.

Fix (internal only, no API change):
1. `select` / `combobox`: in `closeOverlay()`'s timer callback, after `detach()`, add
   `this.overlayRef?.dispose(); this.overlayRef = null;` — copying `picker-overlay-coordinator.ts:209-213`
   exactly. **F-10 and F-13 must land in the same change for `combobox`, not in two PRs.** Each looks
   complete alone and neither is: F-13 alone (dispose on close) completes the backdrop/Escape Subjects
   but still leaves 2N `DestroyRef` closures accumulating, one pair per open; F-10 alone (a
   `perOpenSubs` bag) stops the accumulation but leaves `offset` / `scrollStrategy` frozen. Together
   they are correct and the `perOpenSubs` bag becomes belt-and-braces rather than the sole defence.
2. `tooltip`: dispose in `detach()` (`:556-559`) instead of only at destroy, or — cheaper and safer
   for a component that shows very frequently — keep the `OverlayRef` and call
   `positionStrategy.withPositions(buildPositions(this.twTooltipPosition()))` at the top of the show
   path, which is what `popover` already does for position via `updatePositionStrategy()`.
3. `popover`: rebuild `hasBackdrop`/`backdropClass`/`scrollStrategy` per open. CDK does not expose a
   `hasBackdrop` setter that re-renders, so this one needs the dispose-on-close approach.
4. Each fix needs a spec: open, change the input, close, reopen, assert the new value took effect.
   None of these five inputs has any spec today (F-07), so this is net-new coverage on exactly the
   code being changed.

---

### F-14 15 dev-mode accessible-name warnings fire once at first render, against a pattern `carousel` already documented as wrong
Severity: LOW
Anchor: `projects/ngx-tw/checkbox/checkbox.ts:395` (representative); 15 sites listed below; the corrected precedent at `projects/ngx-tw/carousel/carousel.ts:731-735`
Register: not in register
Confidence: [verified]

What: 15 sites across 13 components read an accessible-name or config input inside a constructor-time
`afterNextRender` to emit a dev-mode `console.warn`. `afterNextRender` runs exactly once, so the
warning's presence or absence is decided by the state at first render:

`checkbox.ts:395`, `file-upload.ts:584`, `radio.ts:447`, `switch.ts:295`, `slider.ts:587`,
`tags-input.ts:507`, `transfer.ts:879`, `date-picker.ts:989`, `time-picker.ts:953` and `:967`
(step validity), `date-range-picker.ts:971`, `select.ts:1019`, `table.ts:1254`, `paginator.ts:821`
(`_runDevWarnings`), `number-input.ts:152` (the `step` warning I read directly while verifying F-01).

`carousel.ts:731-735` replaced this exact pattern with a deduped `effect()` and says why: *"the
earlier implementation used afterNextRender which fires once… if a consumer later set
slidesPerView = 0.1, the threshold warning never surfaced."* `progress-bar.ts:321-338` already
follows the corrected pattern. So the library has both the diagnosis and the fix; 15 sites predate it.

Why it matters: **impact is cosmetic only, and I want to be explicit about that** — no rendered
output, ARIA attribute or behaviour depends on these; the entire consequence is a console warning
that is stale or absent. It is reported because the direction of the error is unhelpful: a consumer
who binds a label asynchronously (a resolved i18n string, a `resource()`) gets a spurious
"missing accessible name" warning that never clears, which trains people to ignore the warnings —
and the two `time-picker` and one `number-input` entries are *config validity* warnings
(`step`), where a late change genuinely should re-warn.

Fix: convert each to the deduped `effect()` shape at `carousel.ts:731-735` — a `Set` of
already-emitted warning keys guarding `console.warn`, inside an `effect()` so the inputs are tracked.
Mechanical, 15 sites, no API change, and it makes `afterNextRender`-reads-an-input greppable as a
lint rule afterwards.

---

## Swept and found clean (stated positively so pass 6 does not re-sweep)

- **Explicit-`undefined` spread merges (P4-8's pattern): all 5 label-object sites are correctly
  guarded** — `carousel.ts:606`, `table.ts:1031`, `paginator.ts:664`, `timeline.ts:727`,
  `theme.config.ts:37`. The gap was in `Object.assign`, not spread — see F-08. **[measured]**
- **`select`'s stale-index and stale-search handling is correct.** `selectByVisibleIndex`
  (`select.ts:1122-1128`) bounds-checks against the live `visibleOptions()`; `activeDescendantId`
  (`:759-763`) returns `null` for an out-of-range index; `openOverlay()` resets `search` (documented
  at `:936`). Changing `options` while the panel is open cannot select a removed item. The
  `combobox` empty-results-on-reopen class does **not** reproduce here. **[verified]**
- **`command-palette` deliberately preserves `query` across open/close** — `:411` documents it
  ("Opening and closing the palette leave it untouched — reset it yourself"). Not a bug; recorded so
  it is not re-flagged.
- **`slider`'s numeric edge handling is sound**: `clampAndSnap` (`:958-968`) returns `min()` for
  non-finite input, skips snapping when `step <= 0`, and re-clamps after snapping for float drift;
  `valuePct` returns 0 when the range is non-positive. `min > max` degrades to a stable value rather
  than `NaN`. **[verified]**
- **`number-input`'s numeric guards are sound**: `resolvedStep()` (`:343-346`) falls back to 1 for
  `<= 0` / non-finite, `clamp()` handles undefined bounds, `roundToPrecision` short-circuits on
  non-finite, and `-0` is normalised in both `writeValue` and `commitNumber`. **[verified]**
- **`paginator` guards `pageSize <= 0`** via `effectivePageSize = Math.max(1, pageSize())` (`:608`)
  and `totalItems <= 0` via the early return at `:612`. A literal `NaN` `pageSize` would propagate
  (`Math.max(1, NaN) === NaN`), but that requires a consumer binding `NaN`; I am not raising it as a
  finding. **[verified]**

## NOT swept this pass — stated so it is not mistaken for clean

- **Part B lead 5's date/timezone half was NOT swept.** DST boundaries, leap days, and
  timezone-dependent parsing across `calendar`, `date-picker`, `date-range-picker`, `time-picker` and
  the `DateAdapter` / `calendar/luxon` implementations were not examined. The three "clean" numeric
  entries above (`slider`, `number-input`, `paginator`) are the only part of lead 5 I measured, and
  they cover none of the date arithmetic. This is the largest remaining hole in my Part B coverage
  and is a good candidate for pass 6's first delegated sweep — `date-picker` is simultaneously the
  worst offender in F-07 (21/38 inputs never driven) and the owner of the two highest-risk untested
  inputs (`parseFormat`, `format`), so untested date parsing is where the two lenses agree.
- **Part B lead 2 (re-entrancy) was sampled, not swept.** I checked `select` (clean — F-13's
  companion note), `command-palette` (documented behaviour) and `combobox` (F-10/F-13). `menu`,
  `sheet`, `dialog`, `tooltip` and `stepper` were not examined for rapid open/close or
  destroy-mid-animation races beyond what the teardown sweep covered.

