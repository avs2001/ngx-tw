# Input — Production-Grade Review

**Entry point:** `ngx-tw/input`
**Files:** `projects/ngx-tw/input/`

## Snapshot
- Selectors: `input[twInput], textarea[twInput]` (attribute directive on native elements).
- Public classes/directives: `InputDirective`, token `TW_INPUT_VALUE_ACCESSOR`.
- Inputs: 7 (`id`, `type`, `disabled`, `required`, `readonly`, `errorStateMatcher`, `aria-describedby`).
- Outputs: 0.
- Slots: 0 named slots (the directive does not render a template — it enhances the host `<input>`/`<textarea>` element).
- CVA: **no** — relies on Angular's native value accessors (`DefaultValueAccessor` for text, `NumberValueAccessor`, etc.) which attach to the underlying element. Correct delegation, but worth flagging in JSDoc.
- `tv()` config: yes; no slots — single-element directive with `defaultVariants` (`input.ts:72-104`).
- A11y CDK utilities used: `FocusMonitor` (`input.ts:149, 278-292`), `AutofillMonitor` (`input.ts:150, 329-336`), `Platform` (`input.ts:151, 328` — browser-only autofill).

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `id` (alias of `idInput`) | `string \| undefined` | `undefined` (auto-generates `tw-input-N`) | yes (`input.ts:177`) | Aliased; resolved by `id()` computed. |
| `type` | `string` | `'text'` | yes (`input.ts:180`) | Dev-mode throws on unsupported values (`checkbox`, `radio`, `submit`, …, `input.ts:51-61, 313-324`). |
| `disabled` (alias of `disabledInput`) | `boolean` | `false` | yes (`input.ts:183`) | Aliased; coerced via `booleanAttribute`. |
| `required` (alias of `requiredInput`) | `boolean` | `false` | yes (`input.ts:189`) | Inferred from `Validators.required` if not explicit (`input.ts:243-247`). |
| `readonly` (alias of `readonlyInput`) | `boolean` | `false` | yes (`input.ts:195`) | Synced to the native `readonly` attribute via `effect()`. |
| `errorStateMatcher` | `ErrorStateMatcher \| undefined` | `undefined` (falls back to `TW_ERROR_STATE_MATCHER`) | yes (`input.ts:201`) | Per-instance override. |
| `aria-describedby` (alias of `userAriaDescribedByInput`) | `string \| undefined` | `undefined` | yes (`input.ts:204`) | Preserved and merged with form-field hint/error ids. |

### Findings
- Within the form-control cap exception. 7 inputs is well below the 12+ ARIA-baseline ceiling.
- All inputs have one-line JSDoc with defaults — compliant.
- The aliased pattern (`idInput`/`disabledInput`/etc.) is unusual but justified: the alias matches the native HTML attribute name and signals to the consumer that the input maps to a DOM attribute. Acceptable.
- **Missing input — `placeholder`.** Inherited from the native attribute, so consumers write `<input twInput placeholder="…">`. Documented in the demo (`input-examples.component.ts:91`). Correct delegation — do not add.
- **Missing input — `name`.** Inherited from native. Correct.
- **Missing input — `autocomplete`.** Inherited from native. Correct.
- **No `clearable` affordance.** Consumers wanting a clear button must compose `<button slot="suffix">×</button>`. Reasonable, but call it out in JSDoc / demo.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- No outputs — value flow is owned by Angular's native value accessors (`(input)` is wired internally only to update the directive's `_value` signal for form-field's `empty()` computation, `input.ts:384-386`).
- Correct. The directive is a behavior enhancement on a native element; consumers wire `(input)`, `(change)`, `(focus)`, `(blur)` on the host directly.

## Customization surface
- ng-content slots: n/a (directive on a native element).
- Structural directives: none.
- Fallback content: n/a.
- Class merging: yes — `twMerge: true` (`input.ts:103`).
- Findings:
  - **Excellent composition.** The directive can be applied to any native `<input>` or `<textarea>`, and renders correctly standalone or inside `<tw-form-field>`.
  - **Extension point: `TW_INPUT_VALUE_ACCESSOR`** (`input.ts:47-49`). Consumers can swap value storage for masking, formatting, or custom parsers. Demo proves this with an `UppercaseValueDirective` (`input-examples.component.ts:37-52`). Strong Material-parity feature.
  - **Extension point: `TW_ERROR_STATE_MATCHER`** (`input.ts:162`). Per-instance or per-injector override of error-state policy.
  - **Extension point: `TW_FORM_FIELD_CONTROL`** (`input.ts:130`). Custom directives can extend `FormFieldControl` and replace the input entirely.
  - These three extension points make the input directive easily one of the most extensible components in the library.

## CSS / Styling
- tailwind-variants: yes; no slots — single-element directive with `inFormField`/`errorState`/`disabled` variants (`input.ts:72-104`).
- twMerge: yes (`input.ts:103`).
- Semantic tokens vs raw palette: 100% semantic. `text-fg`, `placeholder:text-fg-subtle`, `border-border`/`border-border-strong`, `border-error-500`, `outline-primary-500`, `outline-error-500`. No raw palette.
- Surface/fg/border tokens usage: correct — `text-fg`/`placeholder:text-fg-subtle` (`input.ts:74`), `border-border` resting and `border-border-strong` on hover (`input.ts:79`).
- Radius compliance: `rounded-md` standalone (`input.ts:79`), no radius inside form-field (border-0). Compliant.
- Spacing/gap compliance: `px-4 py-2` standalone (`input.ts:79`). **Issue**: this is `md`-only — there is no size axis on the input directive either. Inside a form-field the input strips padding (`p-0`, `input.ts:78`), so the wrapper's `px-3 py-2` carries density. Standalone (`<input twInput>` without a wrapper) is locked at md. Combined with form-field's lack of `size`, the entire input stack is single-density. **This is the dominant visual gap.**
- Typography compliance: `text-sm` (`input.ts:79`) — compliant for md baseline, but again locked.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` standalone (`input.ts:79`); `focus:outline-none focus-visible:outline-none` inside form-field (`input.ts:78`). The standalone variant uses `focus-visible:outline-error-500` when invalid (`input.ts:94`). Canonical compliant — the error variant correctly swaps outline color, not just border.
- Dark mode handling: relies entirely on surface/fg/border + `-500` shades that work in both modes. No `dark:` overrides needed.
- Transitions: `transition-[color,border-color,box-shadow] duration-200 motion-reduce:transition-none` standalone (`input.ts:79`). Specific properties, motion-reduce respected. Compliant.
- Shadows: none — correct.
- Icon sub-scale: n/a (directive does not own icons; icons live in prefix/suffix slots of the parent form-field).
- Findings:
  - **No size axis.** Inputs at xs/sm/lg/xl density unreachable without consumer overrides.
  - **Disabled state visual**: `opacity-50 cursor-not-allowed` (`input.ts:86`). The codified rule is `opacity-50 pointer-events-none`. `cursor-not-allowed` matches the codified per-control disabled pattern (`disabled:cursor-not-allowed`); the directive uses `opacity-50` without `pointer-events-none`, relying on the native `disabled` attribute to block events. Native is sufficient for `<input>`/`<textarea>` — they will not fire events when `disabled`. Correct, but inconsistent with checkbox/switch/radio (which use `pointer-events-none` on the container). Acceptable since natives handle their own disabled semantics.

## Accessibility
- ARIA roles/attributes:
  - `aria-invalid` host binding: set when `errorState()` (`input.ts:138`). Correct.
  - `aria-required` host binding: set when `required()` (`input.ts:139`). Correct.
  - `aria-describedby`: set by the form-field via `setDescribedByIds()` (`input.ts:367-374`). The user-supplied `aria-describedby` input is preserved and merged. Correct.
  - `aria-label` / `aria-labelledby`: NOT exposed as inputs on the directive. The consumer writes them as native HTML attributes — Angular renders them on the element. Acceptable, but note: when used inside a form-field, the label association is via `for=`/`id`, not `aria-labelledby` (see form-field review for the gap).
- Keyboard support: inherited from native `<input>`/`<textarea>`.
- CDK a11y utilities:
  - `FocusMonitor.monitor()` with `DestroyRef`-cleaned subscription (`input.ts:278-292`). Tracks focus origin; flips `focused()` signal and bumps a revision signal on blur so `errorState()` recomputes once `NgControl.touched` updates.
  - `AutofillMonitor.monitor()` browser-only (`input.ts:328-336`). Updates `_autofilled()` signal so the form-field's floating label still floats over autofilled inputs.
  - `Platform.isBrowser` guard for SSR (`input.ts:328`). Correct.
- Label / hint / error wiring: wired via the `FormFieldControl` contract (`input.ts:142-143, 367-374`). Compliant.
- AXE risks: low. The directive does not add new interactive structures.
- Findings:
  - **Solid a11y foundations.** FocusMonitor + AutofillMonitor + Platform guard show Material-level attention to detail.
  - **No `aria-labelledby` mirror.** The directive cannot be `aria-labelledby`'d by the form-field (form-field doesn't push that — see the form-field recommendations). Today the native `<label for>` does the work for `<input>`. Once form-field grows `setLabelledByIds`, mirror it here.

## Form integration
- CVA: not implemented on the directive itself — delegates to Angular's built-in value accessors on the underlying element (`DefaultValueAccessor` for text, `NumberValueAccessor` for `type="number"`, etc.). **This is correct and idiomatic** for an attribute directive on a native element. The directive's JSDoc (`input.ts:122-124`) explicitly notes this.
- ErrorStateMatcher integration:
  - Injects `TW_ERROR_STATE_MATCHER` (`input.ts:162`).
  - Per-instance override via `errorStateMatcher` input (`input.ts:201, 253-258`).
  - Combines `NgControl.control` with `parentFormGroup ?? parentForm` for the submitted state (`input.ts:158-161, 255-258`).
  - Recomputes `errorState()` on blur (revision signal `_ngControlRev`, `input.ts:283-289`), on form submit (revision signal `_formSubmitRev`, `input.ts:353-358`), and on status/value changes from the bound `NgControl` (`input.ts:341-352`).
  - **Excellent. This is the gold-standard ErrorStateMatcher integration in the library.**
- form-field interop:
  - Provides under `TW_FORM_FIELD_CONTROL` and extends `FormFieldControl<string>` (`input.ts:129-131, 142`).
  - Exposes `id`/`value`/`focused`/`empty`/`disabled`/`required`/`errorState`/`controlType`/`userAriaDescribedBy` signals (`input.ts:219-264`).
  - Implements `setDescribedByIds` and `onContainerClick` (`input.ts:367-381`).
  - When in a form-field, strips its own chrome (`input.ts:78`).
  - **Reference implementation** for what other form controls should look like.
- Works with template-driven, reactive, AND signal-based forms: yes — the directive does not handle value flow at all, so every Angular forms strategy works.
- Findings:
  - **No gaps in form integration.** This is the reference.
  - The `Validators.required` inference (`input.ts:245-247`) means consumers do not need to redundantly set `required` when using a reactive form with `Validators.required`. Material parity.

## Tests
- Spec file: yes (`input.spec.ts`, 481 lines).
- Coverage breakdown:
  - Rendering: standalone + textarea + in-form-field + unique id generation + standalone styling (`input.spec.ts:152-227`).
  - Inputs → DOM: `type`, `disabled`, `required`, `readonly`, unsupported-type dev-throw (`input.spec.ts:184-227`).
  - Value + empty tracking: starts empty, becomes non-empty on input, `date` type is never-empty (`input.spec.ts:229-257`).
  - Focus tracking (via `FocusEvent`): yes (`input.spec.ts:259-283`).
  - Reactive forms: `Validators.required` inference, `FormControl.disable()` propagation, `errorState` flips on `touched` (`input.spec.ts:285-321`).
  - Template-driven forms: ngModel value flow + required inference (`input.spec.ts:323-339`).
  - Parent form submit triggers error state: yes (`input.spec.ts:341-356`).
  - Inside form-field: registration + chrome strip + `TW_FORM_FIELD_CONTROL` provision (`input.spec.ts:358-389`).
  - aria-describedby: `setDescribedByIds` write/remove (`input.spec.ts:391-412`).
  - Per-instance error state matcher: yes (`input.spec.ts:414-437`).
  - TW_INPUT_VALUE_ACCESSOR extension: yes (`input.spec.ts:439-456`).
  - Textarea: value tracking + controlType (`input.spec.ts:458-480`).
- Vitest-specific issues: none. No `fakeAsync`/`tick`. Uses `fixture.whenStable()` for async settling.
- Findings:
  - **Excellent coverage.** Every advertised contract is exercised.
  - **Missing**: signal-based forms test. The library uses `@angular/forms/signals` (`form`, `FormField`) elsewhere (see switch/checkbox specs); input.spec.ts does not have an equivalent.
  - **Missing**: AutofillMonitor — the spec does not cover the autofill path. Hard to test in JSDOM but worth a unit-level test that mocks the monitor.
  - **Missing**: assertion that `id` input round-trips to the host attribute when explicitly provided (today the spec only checks the auto-generated id).
  - **Missing**: cross-browser test for the form-reset path. The library exports `onFormReset` (`core/form-reset.ts`); the input directive does not use it, but ResetEvent handling for `<input twInput>` should be verified.

## Gaps & lacks
1. **No size axis.** Density xs/sm/lg/xl unreachable. Pair with form-field's missing size — together they are the largest visual gap.
2. **No clearable / search affordance.** Consumers must compose. Document the pattern.
3. **No signal-based forms test.** Add to spec.
4. **AutofillMonitor untested.** Mock + assert.
5. **No `aria-labelledby` mirror.** Wait on form-field's `setLabelledByIds` to land.
6. **No textarea auto-resize.** A common request — Material's `cdkTextareaAutosize` exists in CDK; expose a thin opt-in.
7. **`type='search'` does not auto-render a clear affordance.** Consumers must compose.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Bring `tw-input` to a true production grade by adding density (in tandem with form-field), shipping a small set of polish features (textarea autosize, search-clear), and closing the test gaps. The directive's core (CVA delegation, ErrorStateMatcher wiring, form-field interop) is already gold-standard — only enhancements remain.

### Tasks

1. **Wire density via the form-field's `size`.**
   - File(s): `projects/ngx-tw/input/input.ts:72-104` (tv config), depends on the form-field `size` task.
   - Why: standalone inputs at xs/sm/lg/xl are unreachable.
   - Change: extend `inputVariants` with a `size` variant axis mapped to the codified inline-padding scale (`px-2 py-1` xs … `px-5 py-2.5` lg, `px-6 py-3` xl) and font scale (`text-xs` xs/sm, `text-sm` md, `text-base` lg/xl). Add `readonly size = input<TwSize>('md');`. Inside a form-field the directive continues to strip chrome (the form-field's size axis carries density); standalone the directive's own size axis applies.
   - Acceptance: spec asserts standalone `<input twInput size="sm">` renders `px-3 py-1.5 text-sm`; demo gains a size sweep.

2. **Add `cdkTextareaAutosize` opt-in for textareas.**
   - File(s): `projects/ngx-tw/input/input.ts:127` (selector), demo.
   - Why: Material's `MatInput` ships an opt-in auto-grow; consumers expect it.
   - Change: do NOT bake auto-resize into the directive. Document the pattern in JSDoc + demo: `<textarea twInput cdkTextareaAutosize cdkAutosizeMinRows="2" cdkAutosizeMaxRows="6"></textarea>`. The directive must not interfere — `cdkTextareaAutosize` reads scrollHeight and writes height; the input directive's `(input)` handler does not need to coordinate.
   - Acceptance: demo shows a working autosize textarea; spec asserts the autosize directive can be applied alongside `twInput` without conflicts.

3. **Document the "clear button" composition pattern.**
   - File(s): demo page only.
   - Why: a common request.
   - Change: add an example with `[slot="suffix"]` containing an icon button that calls `formControl.reset()` (or sets the ngModel to `''`). No library change.
   - Acceptance: demo snippet works at every size.

4. **Add signal-based forms test.**
   - File(s): `projects/ngx-tw/input/input.spec.ts`.
   - Why: input.spec.ts has reactive + template-driven coverage but not signal forms. Switch/checkbox specs do.
   - Change: add a host using `form(...)` and `FormField` from `@angular/forms/signals`; assert (a) initial value reflects, (b) user input updates the field value, (c) field `touched` flips on blur, (d) `errorState` recomputes once the field is touched and invalid.
   - Acceptance: green.

5. **Mock AutofillMonitor in tests.**
   - File(s): `projects/ngx-tw/input/input.spec.ts`.
   - Why: the autofill code path (`input.ts:328-336`) is currently uncovered.
   - Change: provide a stub `AutofillMonitor` that emits a `{ isAutofilled: true }` synthetic event. Assert that `directive.empty()` returns `false` after the event even when the native value is `''`.
   - Acceptance: green; the autofill path is exercised.

6. **Add a round-trip id test.**
   - File(s): `projects/ngx-tw/input/input.spec.ts:166-171`.
   - Why: today only the auto-generated id pattern is asserted.
   - Change: set the `id` host attribute to `'my-input'` via a host signal; assert `inputEl.id === 'my-input'` and that `directive.id() === 'my-input'`.
   - Acceptance: green.

7. **Mirror `setLabelledByIds` once form-field exposes it.**
   - File(s): `projects/ngx-tw/input/input.ts:367-374` (next to `setDescribedByIds`).
   - Why: see form-field review.
   - Change: implement `setLabelledByIds(ids: string[])` that sets/removes `aria-labelledby` on the native element, identical pattern to `setDescribedByIds`.
   - Acceptance: spec asserts the attribute round-trips.

### Out of scope

- Implementing CVA on the directive — Angular's native accessors are the right answer; do not regress.
- Adding `placeholder` / `name` / `autocomplete` inputs — they are native HTML attributes.
- Adding a `clearable` boolean input — composition via `[slot="suffix"]` is the documented pattern.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- input`
- Visual check: `http://localhost:4600/input` (standalone + inside form-field, every size, textarea autosize, suffix clear button)
- A11y: `npm run e2e:a11y` (input route)

## Priority
**P2** — `tw-input` is structurally excellent: CVA delegation, ErrorStateMatcher wiring, form-field interop, and AXE-safe a11y are all reference-quality. The only real gap is density, which is unblocked once form-field grows a `size` axis. Test polish + textarea autosize documentation round it out. Land after form-field's size axis (P1) so the two land together as a coherent density story.
