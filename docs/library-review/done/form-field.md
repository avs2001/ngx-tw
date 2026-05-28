# Form-Field — Production-Grade Review

**Entry point:** `ngx-tw/form-field`
**Files:** `projects/ngx-tw/form-field/`

## Snapshot
- Selectors: `tw-form-field` (element); `[twLabel]`, `[twHint]`, `[twError]`, `[slot="prefix"]`, `[slot="suffix"]` (attribute directives).
- Public classes/directives: `FormFieldComponent`, `LabelDirective`, `HintDirective`, `ErrorDirective`, `PrefixDirective`, `SuffixDirective`. Public types: `FormFieldAppearance`, `FloatLabel`. Public abstract contract: `FormFieldControl<T>` and token `TW_FORM_FIELD_CONTROL`.
- Inputs: 5 on `FormFieldComponent` (`appearance`, `floatLabel`, `hideRequiredMarker`, `color`, `hintAlign`) + 1 on `HintDirective` (`align`).
- Outputs: 0.
- Slots: 5 (`twLabel`, `twHint`, `twError`, `[slot=prefix]`, `[slot=suffix]`) + the default unprojected slot that wraps the control.
- CVA: not applicable (form-field is a layout/orchestrator, not a control).
- `tv()` config: yes; slots: `root`, `controlWrapper`, `infix`, `labelWrapper`, `label`, `requiredMarker`, `prefix`, `suffix`, `subscriptWrapper`, `hint`, `error` (`form-field.ts:74-188`).
- A11y CDK utilities used: none directly. Wires `aria-describedby`/`aria-labelledby` via the `FormFieldControl` contract; CDK is exercised by the child controls.

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `appearance` | `'outline' \| 'filled'` | `'outline'` | yes (`form-field.ts:309`) | Material parity; `'standard'` not exposed. |
| `floatLabel` | `'auto' \| 'always'` | `'auto'` | yes (`form-field.ts:312`) | Missing `'never'` mode (Material has it). |
| `hideRequiredMarker` | `boolean` | `false` | yes (`form-field.ts:315`) | Boolean defaults to `false` — compliant. |
| `color` | `TwColor` | `'primary'` | yes (`form-field.ts:318`) | Shared `TwColor` from `ngx-tw/core`. |
| `hintAlign` | `'start' \| 'end'` | `'start'` | yes (`form-field.ts:321`) | Default alignment when `twHint` does not specify its own. |
| (`HintDirective.align`) | `'start' \| 'end' \| undefined` | `undefined` | yes (`form-field.ts:229`) | Per-hint override of the parent's `hintAlign`. |

### Findings
- All five inputs are well-named, well-documented, and bounded to shared types or narrow unions.
- Within the form-control input cap exception; surface is appropriate.
- **Missing input — `floatLabel: 'never'`.** Useful when a consumer wants a placeholder-only field but still wants `appearance="filled"` chrome. Today the only way is to also omit the `twLabel` projection entirely, which is awkward when label content lives in shared component state.
- **Missing input — `size`.** The form-field has no size axis; the wrapper's vertical/horizontal padding (`px-3 py-2` outline, `px-3 pt-6 pb-2` filled — `form-field.ts:95, 99`) is fixed regardless of the underlying control's density. A `tw-input` rendered standalone uses `px-4 py-2` (`input.ts:79`) but the same input inside a form-field always renders with the wrapper's `px-3 py-2`. Compact (xs/sm) and comfortable (lg/xl) form-fields are impossible without overriding via `class`.
- **Missing input — `subscriptSizing`.** The subscript wrapper is `min-h-5` (~20px reserve, `form-field.ts:87`) regardless of whether hints/errors will appear. Material exposes `subscriptSizing: 'fixed' | 'dynamic'`. For dense forms (no hints) this wastes vertical rhythm.
- `HintDirective.align` is a per-instance override but its type `'start' | 'end' | undefined` does not match the parent's `'start' | 'end'`. The `undefined` value means "inherit"; consider naming a typed sentinel (e.g., `'inherit'`) so the demo and API docs are self-documenting.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- No outputs — the form-field is a slot composer, not a state owner. Correct by design. State (`focused`, `empty`, `errorState`) is owned by the child control and read via the `FormFieldControl` contract.

## Customization surface
- ng-content slots:
  - `<ng-content select="[slot=prefix]" />` (`form-field.html:2`)
  - default `<ng-content />` inside the infix (`form-field.html:4`)
  - `<ng-content select="[slot=suffix]" />` (`form-field.html:6`)
  - `<ng-content select="[twLabel]" />` inside the floating label wrapper (`form-field.html:9`)
  - `<ng-content select="[twError]" />` / `<ng-content select="[twHint]" />` swapped in the subscript region (`form-field.html:19, 21`).
- Structural directives: none. Label/hint/error/prefix/suffix are attribute directives that inject the parent `FormFieldComponent` to read class signals and generate ids.
- Fallback content: none. If no `twLabel` is projected the floating wrapper is omitted (`form-field.html:7`); if no `twHint`/`twError` is projected the subscript wrapper still reserves `min-h-5` (`form-field.ts:87`).
- Class merging: `twMerge: true` (`form-field.ts:186`).
- Findings:
  - **Hard-coupled label rendering.** The `<label>` element is the only element actually rendered inside the floating wrapper — the `<span>` required-marker is sibling, but the wrapper's positioning is computed against the floated `<label>` itself (`form-field.html:9-12`). If a consumer projects `<div twLabel>` instead of `<label twLabel>`, the `for=` attribute binding on the host (`form-field.ts:197`) still applies but no native label association exists. Consider validating in dev mode that `twLabel` is applied to a `<label>` element.
  - **No prefix/suffix abstraction.** Prefix/suffix sit outside the infix as direct projections (`form-field.html:2, 6`). The user's prefix element can be anything — text, icon, even another control. There's no built-in `text-fg-muted` adjustment for icons vs. text, and no built-in click-target sizing rule. The `PrefixDirective`/`SuffixDirective` only apply `flex items-center shrink-0 text-fg-muted` (`form-field.ts:85-86`). Document a recommended pattern (e.g., icons use `size-5`, text uses `text-sm font-medium`) — see recommendations.
  - **No `appearance="standard"`.** Material's borderless underlined variant is missing. This is intentional in many modern designs (Tailwind UI doesn't ship it either), so likely fine — but call it out so consumers don't ask.
  - The five-slot directive surface (`twLabel`, `twHint`, `twError`, `slot=prefix`, `slot=suffix`) mixes two conventions: `tw*` attribute directives and `slot="*"` attributes. The same library uses `[slot="prefix"]` selectors elsewhere (`form-field.ts:267, 285`). This is consistent within form-field but worth documenting in the contributing guide.

## CSS / Styling
- tailwind-variants: yes; eleven slots cover all rendered regions.
- twMerge: yes (`form-field.ts:186`).
- Semantic tokens vs raw palette: 100% semantic. `border-border`/`border-border-strong` (`form-field.ts:95, 95`), `bg-surface-muted`/`bg-surface-sunken` (`form-field.ts:99`), `border-primary-500`/`border-secondary-500`/…/`border-error-500` (`form-field.ts:138-145`), `bg-surface` notch (`form-field.ts:168`). No raw palette anywhere.
- Surface/fg/border tokens usage: `text-fg` root (`form-field.ts:76`), `text-fg-muted` for placeholders/hints/prefix/suffix (`form-field.ts:83, 85, 86, 88`), `border-border` resting and `border-border-strong` on hover/neutral-focused (`form-field.ts:95, 141`). Correct.
- Radius compliance: `rounded-md` on the control wrapper (`form-field.ts:78`) — compliant.
- Spacing/gap compliance: `px-3 py-2` outline (`form-field.ts:95`), `px-3 pt-6 pb-2` filled (`form-field.ts:99`), `gap-2` inside wrapper (`form-field.ts:78`), `mt-1` subscript (`form-field.ts:87`). The outline `py-2` row pairs with the canonical inline-padding `md` row. **Concern**: there is no scale — no size axis means xs/lg densities are unreachable.
- Typography compliance: label `text-sm` resting → `text-xs` floated (`form-field.ts:124, 128`), subscript `text-xs` (`form-field.ts:87`). Compliant; matches CLAUDE.md "hint/description `text-xs`" and "error `text-xs text-error-{600|700}`".
- Focus rings compliance: **not handled by form-field directly.** The visible focus is the colored border on the control wrapper (`form-field.ts:138-145`). The actual focus ring (the outline) lives on the wrapped input (`input.ts:79` standalone) or is absent inside the form-field (`input.ts:78` — `focus-visible:outline-none` is applied to the input when in a form-field). This is the canonical "input border = focus indicator" pattern and matches Material. AXE will not flag, but document that the focus ring is the border, not an outline.
- Dark mode handling: relies on surface/fg/border tokens — they swap. The colored borders (`border-primary-500`, etc.) work in both modes at the `-500` shade. The notch `bg-surface` (`form-field.ts:168`) follows the page surface. **Gap**: the disabled state uses `opacity-50` on root (`form-field.ts:132`), which is fine, but the disabled element should also visually de-emphasize the border. Today it relies only on opacity.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on the control wrapper (`form-field.ts:78`); `transition-[top,left,color,transform] duration-200 motion-reduce:transition-none` on the label wrapper (`form-field.ts:81`); `transition-[font-size,color] duration-200 motion-reduce:transition-none` on the label (`form-field.ts:83`). All specific-property, all motion-reduce-aware.
- Shadows: none used. Correct — form fields are flat by default.
- Icon sub-scale: prefix/suffix do not enforce a size — they only apply `flex items-center shrink-0 text-fg-muted`. **Gap**: no documented guidance on icon size inside prefix/suffix. Consumers may use `size-4` or `size-5` arbitrarily. Recommend `size-5` for `md` density with documentation.
- Findings:
  - **No size axis.** This is the single biggest visual-system gap. Add `size: TwSize` and wire to the padding scale (`px-2 py-1` xs … `px-6 py-3` xl) plus label transform offsets and floated-label `top`/`left` values.
  - **`prefix` and `suffix` lack icon-vs-text density.** Document recommended icon size and consider exposing a `[slot="prefix-icon"]` / `[slot="suffix-icon"]` directive that enforces `size-5` automatically.
  - **Label-position only auto/always.** Add `'never'` to disable floating entirely.
  - **Subscript reserve is fixed.** Add `subscriptSizing: 'fixed' | 'dynamic'` to allow dense layouts.

## Accessibility
- ARIA roles/attributes: form-field is a layout shell with no role of its own — correct. The label is wired via `for=` (`form-field.ts:197`), and hint/error ids flow into the control's `aria-describedby` via the `FormFieldControl.setDescribedByIds` callback (`form-field.ts:423-439`). Error elements get `role="alert"` and `aria-live="polite"` (`form-field.ts:247-249`).
- Keyboard support: none owned by form-field. The container click handler (`form-field.ts:485-487`) forwards to `control.onContainerClick()` so clicking the wrapper focuses the underlying input — Material parity.
- CDK a11y utilities: none used directly. The form-field relies on the child control to do `FocusMonitor` work and only consumes the resulting `focused()` signal.
- Label / hint / error wiring:
  - `label[twLabel]`: gets a generated id (`form-field.ts:204`) and `for=` is bound to `control.id()` (`form-field.ts:207`). Compliant.
  - `aria-labelledby`: NOT set on the control by the form-field. The control receives the label by `for=`/`id` association, which is enough for native `<input>` but fails for non-native controls (e.g., a `tw-select` trigger) that need `aria-labelledby` explicitly. **Gap**: the contract has `userAriaDescribedBy?` but no `userAriaLabelledby?` and no mechanism to push the label id to non-native controls. Select handles this internally; checkbox/switch don't talk to form-field at all (see those reviews).
  - `aria-describedby`: hint and error ids are merged, plus user-supplied ids (`form-field.ts:423-439`). Correct. Error mode replaces hint ids (subscript swap).
  - `aria-invalid` / `aria-required`: NOT set by form-field — those are pushed by the control itself based on its own `errorState()` and `required()`. Correct separation of concerns.
- AXE risks:
  - Low — but only if the consumer uses a `<label>` element for `twLabel`. If they use `<span twLabel>` (today valid), there is no native label association, and AT only gets `aria-labelledby` via the label id. Validate the host element type in dev mode.
- Findings:
  - **Add `aria-labelledby` pushdown.** The `FormFieldControl` contract should expose a `setLabelledByIds(ids: string[])` callback symmetric to `setDescribedByIds`. Non-native controls (select, autocomplete, combobox) need this.
  - **Validate label host element.** Dev-mode warn (or throw) when `twLabel` is applied to a non-`<label>` element.
  - **Label `for` is the canonical association.** Continue using `for=` for native inputs — this is more robust than `aria-labelledby` and matches Material.

## Form integration
- CVA: not applicable.
- ErrorStateMatcher: form-field reads `control.errorState()` only — does not own matcher resolution itself. Child controls (`input.ts:202, 250-258`) own this. Correct delegation.
- form-field interop: form-field owns the contract (`FormFieldControl` abstract class + `TW_FORM_FIELD_CONTROL` token, `form-field.ts:33-65`). Currently consumed by `input` and `select` only. **Cross-cutting gap**: checkbox, switch, and radio do NOT register with form-field. This breaks consistency — a consumer cannot put `<tw-checkbox>` inside `<tw-form-field>` and get label/hint/error wiring. See recommendations.
- Works with template-driven, reactive, AND signal-based forms: form-field has no opinion — it forwards to the child control, which handles every strategy.
- Findings:
  - **Cross-cutting**: extend the `FormFieldControl` contract usage to checkbox/switch/radio. The contract's `empty()` and `focused()` signals are mostly trivial for toggles (`empty()` would always be `false`; `focused()` reads CDK FocusMonitor) but the value is consistency: hint/error wiring works for every form control.
  - The dev-mode "no control" throw (`form-field.ts:477-481`) is a strong, helpful invariant. Keep it.

## Tests
- Spec file: yes (`form-field.spec.ts`, 682 lines).
- Coverage breakdown:
  - Default render: yes (`form-field.spec.ts:170-201`).
  - Missing control dev-mode throw: yes (`form-field.spec.ts:203-209`).
  - Appearance input: outline + filled DOM-level assertions (`form-field.spec.ts:211-234`).
  - Color input: every value of `TwColor` parametrized including the `neutral` carve-out to `border-border-strong` (`form-field.spec.ts:236-273`).
  - Required marker: absent/present/hidden via `hideRequiredMarker` (`form-field.spec.ts:275-305`).
  - Label association: `for=` set and reactive to `control.id()` changes (`form-field.spec.ts:307-333`).
  - aria-describedby wiring: hints, errors, error swap, multiple errors, userAriaDescribedBy merging (`form-field.spec.ts:335-379`).
  - Error directive a11y: `role="alert"` and `aria-live="polite"` (`form-field.spec.ts:381-406`).
  - Floating label: every transition (rest/focus/non-empty/`floatLabel='always'`/notch/filled-vs-outline/prefix-presence/`left` value) (`form-field.spec.ts:408-492`).
  - Placeholder hiding: when label is resting (`form-field.spec.ts:494-527`).
  - Subscript swap: hint↔error semantics (`form-field.spec.ts:529-559`).
  - Container click forwarding: yes (`form-field.spec.ts:561-576`).
  - Duplicate hint alignment dev-mode throw: yes (`form-field.spec.ts:578-584`).
  - Hint alignment per-instance vs. parent default: yes (`form-field.spec.ts:586-607`).
  - Disabled state: opacity+pointer-events on root (`form-field.spec.ts:609-627`).
  - Invalid border for outline and filled: yes (`form-field.spec.ts:629-654`).
  - Prefix/suffix: classes applied to projected elements (`form-field.spec.ts:656-681`).
- Vitest-specific issues: none. No `fakeAsync`/`tick`. Uses signal-input set on a fake control directive — clean pattern.
- Findings:
  - **Excellent coverage.** This is the most thoroughly tested form control wrapper in the library.
  - Missing: a test for the case where `twLabel` is applied to a non-`<label>` element (today undefined behavior — see recommendations).
  - Missing: a test that the `controlType` host class hook is removed when the control is unmounted (the suffix `tw-form-field-type-fake` is set but never asserted to be absent on teardown — minor).
  - Missing: a test that `setDescribedByIds` is called with an empty array (`[]`) when no hints/errors are present — important for the "no aria-describedby leaks" invariant.

## Gaps & lacks
1. **No `size` axis.** xs/sm/lg/xl density is unreachable without consumer overrides. Major UX gap compared to Material.
2. **`floatLabel='never'` not supported.** A common request for placeholder-only flows.
3. **`subscriptSizing` not supported.** Wastes 20px of vertical rhythm even when no hints/errors will ever appear.
4. **Cross-cutting form-field interop**: checkbox/switch/radio do not register with form-field via `FormFieldControl`. Inconsistent API surface.
5. **`aria-labelledby` pushdown missing** from the `FormFieldControl` contract. Non-native controls miss the label association.
6. **No dev-mode check that `twLabel` is a `<label>` element.** Silent a11y regression if a consumer uses `<span>`.
7. **No prefix/suffix density tokens.** Icon vs. text adjusts manually.
8. **No "fixed" appearance with persistent label** (Material's "fill-label-above" pattern). Likely fine, but worth a note.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Close the visual-system and a11y gaps on `tw-form-field` so it can host **every** form control in the library — not just input/textarea/select — with a single, consistent label/hint/error/prefix/suffix API. Add the missing size axis and the missing `floatLabel='never'` / `subscriptSizing='dynamic'` modes. Extend the `FormFieldControl` contract for `aria-labelledby` pushdown.

### Tasks

1. **Add `size: TwSize` input and wire density throughout the tv() variants.**
   - File(s): `projects/ngx-tw/form-field/form-field.ts:72-188` (`formFieldVariants`), `projects/ngx-tw/form-field/form-field.ts:309-322` (component inputs).
   - Why: form-field is the only component in the library without a size axis; xs/lg/xl density today is impossible.
   - Change:
     - Add `readonly size = input<TwSize>('md');` with JSDoc.
     - Add a `size` variant axis to `formFieldVariants` with five rows mapping to `px-2 py-1` (xs), `px-3 py-1.5` (sm), `px-3 py-2` (md), `px-4 py-2.5` (lg), `px-5 py-3` (xl). Apply on the `controlWrapper` slot.
     - Recompute label resting `top` and floated `top` offsets per size — at xs the floated label top must clear the 1px border with the smaller font; at xl the resting label centerline shifts.
     - Compound-variant the filled `pt-6 pb-2` so it scales correctly (filled needs ~150% headroom vs. outline).
   - Acceptance: visual diff in demo renders five usable densities; spec asserts `px-2 py-1` (xs) and `px-5 py-3` (xl) on the control wrapper; floating label transition still works at every size.

2. **Add `floatLabel='never'` mode.**
   - File(s): `projects/ngx-tw/form-field/form-field.ts:25, 312, 355-360`.
   - Why: a common pattern is placeholder-only with `appearance='filled'` chrome; today only achievable by omitting `twLabel`.
   - Change: extend the `FloatLabel` union to `'auto' | 'always' | 'never'`. In `shouldLabelFloat()`, return `false` and skip the wrapper render when `floatLabel() === 'never'`. Update placeholder-hiding logic so the placeholder is always visible in `never` mode regardless of label presence.
   - Acceptance: snapshot test renders the input with placeholder visible and no floating wrapper; demo gains a "Placeholder only" example.

3. **Add `subscriptSizing: 'fixed' | 'dynamic'` input.**
   - File(s): `projects/ngx-tw/form-field/form-field.ts:87, 322-325`.
   - Why: dense forms with no hints/errors waste 20px per row.
   - Change: new input `readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');`. In `subscriptWrapper` slot, drop `min-h-5` when `'dynamic'`. When `'dynamic'` and no hint/error/error-state, the entire subscript `<div>` should also be `@if`-gated so it does not consume layout space.
   - Acceptance: spec asserts `min-h-5` is absent in `'dynamic'` mode and a default-rendered `tw-form-field` with `subscriptSizing='dynamic'` and no hints has total height equal to the control wrapper alone.

4. **Extend `FormFieldControl` contract with `setLabelledByIds`.**
   - File(s): `projects/ngx-tw/form-field/form-field.ts:33-57` (contract), `form-field.ts:421-439` (effect), `projects/ngx-tw/input/input.ts:367-374` (consumer), and `projects/ngx-tw/select/select.ts` (consumer).
   - Why: non-native controls need `aria-labelledby` pushdown — the `for=`/`id` association on `<label>` does not reach a `<button role="combobox">` trigger.
   - Change:
     - Add abstract method `abstract setLabelledByIds(ids: string[]): void;` to `FormFieldControl`.
     - In `FormFieldComponent` constructor, add a second `effect` that reads `labelChild()?.id` and the merged userAriaLabelledby (new `userAriaLabelledby` Signal on the contract), then calls `control.setLabelledByIds(...)`.
     - In `InputDirective.setLabelledByIds`, set/remove the `aria-labelledby` attribute on the native element (mirror `setDescribedByIds`).
     - In `SelectComponent.setLabelledByIds`, push to the combobox trigger's `aria-labelledby`.
   - Acceptance: spec asserts a `<tw-form-field>` with a `<label twLabel>` pushes the label id onto an input's `aria-labelledby`; same for a fake control; same for a select trigger.

5. **Cross-cutting — make checkbox/switch/radio register with form-field.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts`, `projects/ngx-tw/switch/switch.ts`, `projects/ngx-tw/radio/radio.ts`.
   - Why: a consumer cannot put `<tw-checkbox>` inside `<tw-form-field>` and get label/hint/error wiring; they must hand-roll `aria-describedby`. Cross-cutting inconsistency.
   - Change: each component extends `FormFieldControl<boolean>` (or `FormFieldControl<string>` for radio's emitted value), provides itself under `TW_FORM_FIELD_CONTROL`, exposes `id`/`value`/`focused`/`empty` (always `false` for toggles)/`disabled`/`required`/`errorState`/`userAriaDescribedBy`/`userAriaLabelledby` signals, and implements `setDescribedByIds`/`setLabelledByIds`. Container click on the form-field should focus the host. Treat form-field's `appearance="outline"` as decorative around toggles; the toggle's own focus ring is the canonical indicator.
   - Acceptance: a host template `<tw-form-field><label twLabel>Receive emails</label><tw-checkbox /></tw-form-field>` renders, the label `for` points at the checkbox host id, the hint id ends up in `aria-describedby` on the host, AXE passes. Add to each component's spec.

6. **Dev-mode validate `twLabel` host element type.**
   - File(s): `projects/ngx-tw/form-field/form-field.ts:192-211` (LabelDirective).
   - Why: silent a11y regression if `twLabel` is applied to `<span>` instead of `<label>`.
   - Change: in `LabelDirective` constructor, `if (isDevMode() && elementRef.nativeElement.tagName !== 'LABEL') console.warn('[tw-form-field] twLabel should be applied to a <label> element so the for-id association works with native controls.');`. Warn only — don't throw, because the directive is valid on `<span>` for non-native controls.
   - Acceptance: spec asserts a console.warn when `<span twLabel>` is projected; no warn when `<label twLabel>` is used.

7. **Add prefix/suffix density guidance + optional `[slot="prefix-icon"]` directive.**
   - File(s): `projects/ngx-tw/form-field/form-field.ts:264-295`, demo page.
   - Why: today consumers pick `size-4` or `size-5` arbitrarily; icon vs. text alignment differs.
   - Change: keep `[slot="prefix"]`/`[slot="suffix"]` as-is. Add two opt-in attribute directives `[slot="prefix-icon"]` / `[slot="suffix-icon"]` that apply `size-5 text-fg-muted shrink-0` (md-scale glyph). Document recommended pattern in the demo overview.
   - Acceptance: demo gains an "Icon prefix/suffix" example using the new attribute selectors; visual diff shows correct alignment with the input's text baseline at md and lg sizes.

8. **Test gaps.**
   - File(s): `projects/ngx-tw/form-field/form-field.spec.ts`.
   - Why: cover edge cases.
   - Change: add specs for (a) `setDescribedByIds([])` invocation when no hints/errors exist; (b) `<span twLabel>` triggering the dev warn; (c) the new `size`, `floatLabel='never'`, `subscriptSizing='dynamic'` inputs.
   - Acceptance: green.

### Out of scope

- Implementing `appearance='standard'` (Material's underline-only variant) — modern design language does not need it.
- Adding a `tone='soft'|'strong'` axis to the filled appearance — defer until a real consumer asks.
- Replacing the floating-label CSS transitions with `animate.enter`/`animate.leave` — the current transition-based approach is correct for label motion (continuous, not discrete).

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- form-field`
- Visual check: `http://localhost:4600/form-field` (outline + filled, every size, floating + always + never, with/without prefix/suffix)
- A11y: `npm run e2e:a11y` (form-field route, and the now-form-field-wrapped checkbox/switch/radio routes)

## Priority
**P1** — form-field is the orchestration spine of the entire form-control story. The size axis, `floatLabel='never'`, and cross-cutting checkbox/switch/radio wiring are real consumer-facing gaps. The component is otherwise well-architected and thoroughly tested; this is enhancement, not rescue. Land before P0 only if the consuming app needs density variants now; otherwise after the higher-severity form-control rescues in this batch.
