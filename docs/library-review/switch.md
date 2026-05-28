# Switch — Production-Grade Review

**Entry point:** `ngx-tw/switch`
**Files:** `projects/ngx-tw/switch/`

## Snapshot
- Selectors: `tw-switch` (element).
- Public classes/directives: `SwitchComponent`. Public type: `SwitchLabelPosition`.
- Inputs: 13 (`color`, `size`, `disabled`, `required`, `label`, `description`, `labelPosition`, `name`, `aria-label`, `aria-labelledby`, `aria-describedby`, plus `checked` model and the implicit revision counter via inputs).
- Outputs: 1 (`change`) + 1 model (`checked`).
- Slots: 3 named (`[slot="on-icon"]`, `[slot="off-icon"]`, `[slot="description"]`) + the default unprojected slot for label content.
- CVA: yes (`switch.ts:185, 331-347`).
- `tv()` config: yes; slots: `root`, `switchEl`, `track`, `thumb`, `iconWrap`, `labelWrap`, `label`, `description` (`switch.ts:28-97`).
- A11y CDK utilities used: `FocusMonitor` (`switch.ts:225, 351-355`).

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `color` | `TwColor` | `'primary'` | yes (`switch.ts:187`) | Shared core type. |
| `size` | `TwSize` | `'md'` | yes (`switch.ts:190`) | Shared core type. |
| `disabled` | `boolean` | `false` | yes (`switch.ts:193`) | Compliant. |
| `required` | `boolean` | `false` | yes (`switch.ts:196`) | Compliant. |
| `label` | `string \| undefined` | `undefined` | yes (`switch.ts:199`) | Prefer content projection for rich labels. |
| `description` | `string \| undefined` | `undefined` | yes (`switch.ts:202`) | Prefer `[slot="description"]` for rich content. |
| `labelPosition` | `'before' \| 'after'` | `'after'` | yes (`switch.ts:205`) | Compliant. |
| `name` | `string \| undefined` | `undefined` | yes (`switch.ts:208`) | Mirrored to host as native attribute. |
| `aria-label` | `string \| undefined` | `undefined` | yes (`switch.ts:211`) | Aliased input. |
| `aria-labelledby` | `string \| undefined` | `undefined` | yes (`switch.ts:214`) | Aliased input. |
| `aria-describedby` | `string \| undefined` | `undefined` | yes (`switch.ts:217`) | Aliased input. |
| `checked` (model) | `boolean` | `false` | yes (`switch.ts:220`) | Two-way bound. |

### Findings
- 12 user-facing inputs (counting the model) — within the form-control cap exception.
- All inputs have one-line JSDoc — compliant.
- All boolean defaults are `false` — compliant.
- **Missing input — `value`.** Standard HTML checkboxes/switches have a `value` attribute used in form submissions (`<input type="checkbox" name="features" value="dark-mode">`). The library exposes only `checked`. Acceptable because Angular forms typically bind the boolean state to a property, but worth documenting.
- **Missing input — `errorState` or `error`.** No way to render the switch in an "error" state. A consumer using a `<tw-switch [required]="true">` inside a reactive form gets no visual feedback when the form is submitted untouched. This pairs with the form-field interop gap (see below).
- **No `id` input.** The component generates `tw-switch-N` (`switch.ts:233-234`); consumers cannot override. This breaks the pattern used by `input` (`input.ts:178` exposes `id` aliased). Add for parity, even if rarely needed.
- **No `errorStateMatcher` input.** Pair with the error-state gap.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `change` | `boolean` | past-tense action event | `switch.ts:223`. Fires on user toggle, not programmatic write — matches Material. |
| `checked` (model) | `boolean` | propertyChange | `switch.ts:220`. Two-way. |

### Findings
- Output naming follows the codified dual pattern (`change` past-tense + `checkedChange` via model). Compliant.
- JSDoc on `change` correctly states "Does not fire when the value is updated programmatically via `writeValue`" — important for consumers. Compliant.
- **Missing output — `(blur)` / `(focus)`.** The component has private blur handler (`switch.ts:325-327`) but does not surface focus/blur events. Reactive form consumers wanting to call `markAsTouched()` on blur can use the host `(blur)` directly since `tw-switch` is an element selector — but a typed `tw-switch.focused` signal would be valuable for parent components (form-field, custom wrappers).

## Customization surface
- ng-content slots:
  - Default (label): `<ng-content />` inside the label `<span>` (`switch.ts:154`).
  - `[slot="description"]`: secondary text (`switch.ts:160`).
  - `[slot="on-icon"]`: icon shown on the checked side (`switch.ts:143`).
  - `[slot="off-icon"]`: icon shown on the unchecked side (`switch.ts:141`).
- Structural directives: none.
- Fallback content: NONE provided for any slot — if the consumer omits all label content the label `<span>` collapses via `empty:hidden` (`switch.ts:40`). Correct: a switch with no accessible name triggers a dev-mode warn (`switch.ts:239-245`).
- Class merging: yes — `twMerge: true` (`switch.ts:96`).
- Findings:
  - **Strong projection story for icons.** On/off icons inside the track is a Material/Tailwind UI pattern done correctly.
  - **Mixed label API.** Both `label` input and default content projection are supported simultaneously — the template renders both (`switch.ts:154-157`). Consumers using both will get duplicate label text. Document that they are mutually exclusive, or `@if` the input version when projected content is present (via `contentChild` query).
  - Same dual API for `description` (`switch.ts:160-163`).
  - **No `[slot="thumb-icon"]`.** Some designs want an icon that lives on the thumb itself. Optional, defer until requested.

## CSS / Styling
- tailwind-variants: yes; 8 slots (`switch.ts:30-42`).
- twMerge: yes (`switch.ts:96`).
- Semantic tokens vs raw palette: **partially compliant.** Two raw colors used in solid-fill foreground lookups:
  - `'text-white'` for primary/secondary/accent/info/error in `CHECKED_ICON_COLOR` (`switch.ts:113-120`).
  - `'text-black'` for warning (`switch.ts:119`).
  - Per the recent `e952a33` commit codifying `on-{role}` tokens, these should be `text-on-primary` / `text-on-warning` / etc. See recommendations.
- Surface/fg/border tokens usage: `bg-surface-muted` track-off (`switch.ts:82`), `bg-surface` thumb (`switch.ts:36`), `text-fg-muted` for off icon (`switch.ts:298`). Compliant.
- Radius compliance: `rounded-md` root (`switch.ts:31`) for focus ring; `rounded-full` track + thumb (`switch.ts:34, 36`). Compliant.
- Spacing/gap compliance: `gap-3` root (`switch.ts:31`) — compliant. Track sizes use `h-4 w-7` xs through `h-8 w-14` xl (`switch.ts:46-71`). These are reasonable but **not** strictly on the codified spacing scale; they are functional dimensions of the toggle. Acceptable — a switch's track ratio is a fixed visual constant, not a spacing choice.
- Typography compliance:
  - Label: `text-xs` (xs), `text-sm` (sm/md), `text-base` (lg/xl) (`switch.ts:48, 54, 60, 66, 72`). Compliant with the trigger font scale.
  - Description: `text-2xs` (xs), `text-xs` (sm/md), `text-sm` (lg/xl) (`switch.ts:49, 55, 61, 67, 73`). Compliant — uses the codified `text-2xs` token at xs.
  - Label weight: `font-medium` (`switch.ts:40`). Compliant.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on root (`switch.ts:31`). **Canonical compliant.** The host is the focus target (correct for a `role="switch"` element).
- Dark mode handling:
  - `bg-fg` neutral checked track (`switch.ts:105`) — uses fg token, automatically swaps.
  - `text-surface` neutral checked icon (`switch.ts:115`) — uses surface token, automatically swaps.
  - Other colors use `-600` for tracks (`switch.ts:101-110`) — work in both modes at that shade.
  - **Concern**: no `dark:` overrides anywhere. The CLAUDE.md convention is that explicit `dark:bg-{color}-900/X` is acceptable; absence means we rely on the `-600` shades to read in both modes. Visually verify at lg/xl in dark mode; the warning track (`bg-warning-500`) may bleed into the surrounding surface in dark theme.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on track (`switch.ts:34`); `transition-transform duration-200 motion-reduce:transition-none` on thumb (`switch.ts:36`); `transition-opacity duration-200 motion-reduce:transition-none` on icons (`switch.ts:289, 297`). Specific, motion-reduce-aware. Compliant.
- Shadows: `shadow-sm` on thumb (`switch.ts:36`). Compliant — thumb is a "lifted" element.
- Icon sub-scale: track icons are not given explicit sizes — they inherit projected size. **Gap**: the consumer must pick a size that fits the track height. Document or constrain via `[&_svg]:size-X` per size variant.
- Findings:
  - **Replace raw `text-white`/`text-black` with `text-on-{role}` tokens** — same change codified across the library after commit `e952a33`.
  - **Constrain projected on/off icon sizes** via the tv config: at xs the track is `h-4` so the icon should be `[&_svg]:size-2.5`; at xl `h-8` so `[&_svg]:size-4`. Today consumers must know this.

## Accessibility
- ARIA roles/attributes:
  - `role="switch"` (`switch.ts:168`). Correct.
  - `aria-checked` reflects `internalChecked()` (`switch.ts:172`). Correct.
  - `aria-disabled` set when disabled (`switch.ts:173`). Correct.
  - `aria-required` set when required (`switch.ts:174`). Correct.
  - `aria-label`/`aria-labelledby`/`aria-describedby` all mirrored to host (`switch.ts:175-177`). `aria-labelledby` defaults to the internal label id when no external one and no `aria-label` is set (`switch.ts:252-257`). `aria-describedby` defaults to the internal description id (`switch.ts:259-263`). Material parity.
  - `tabindex` 0 or -1 based on disabled (`switch.ts:178`). Correct.
  - `name` attribute mirrored (`switch.ts:179`). The element is `<tw-switch>`, not `<input>`, so the `name` attribute does not participate in native form submission — it's a styling/identification hook only. Document or remove.
- Keyboard support: Space + Enter toggle (`switch.ts:316-322`). Enter is non-standard for native checkboxes but **is** the WAI-ARIA-recommended activation key for `role="switch"`. Correct.
- CDK a11y utilities: `FocusMonitor.monitor()` with `DestroyRef.onDestroy()` cleanup (`switch.ts:351-355`). The focus origin signal is not exposed externally — only used implicitly by the focus ring. Consider exposing `focused()` signal for form-field interop.
- Label / hint / error wiring:
  - `aria-labelledby` → internal label id (when no override). Correct.
  - `aria-describedby` → internal description id (when no override). Correct.
  - `aria-invalid` — **NOT exposed**. No error-state mechanism. This is the biggest a11y gap.
  - No form-field interop — switch does NOT register with `<tw-form-field>` (no `FormFieldControl` extension, no `TW_FORM_FIELD_CONTROL` provider). A consumer cannot put `<tw-switch>` inside `<tw-form-field>` and get label/hint/error wiring. Cross-cutting with checkbox/radio.
- AXE risks:
  - **Medium-low** — accessible-name is enforced via dev-mode warn (`switch.ts:240-244`), but a production user could ship without any of `label`/`aria-label`/`aria-labelledby`/projected content and AXE would flag. The dev warn is helpful but not fail-safe.
  - The hardcoded `'text-black'` on warning thumb icon (`switch.ts:119`) is a deliberate contrast choice — green/amber `-500` against white is too low, but black-on-amber is high. Validate at every size.
- Findings:
  - **Add `aria-invalid` host binding** tied to an error-state signal.
  - **Add `errorStateMatcher` / `errorState` support** (see Form integration).
  - **Register with form-field** via `FormFieldControl` (see Form integration).
  - **Expose `focused` signal** for parent coordination.
  - **`name` attribute is a no-op** on a non-form element — either remove or render a hidden `<input type="checkbox" name="…" [checked]="checked()">` so the switch participates in native form submission.

## Form integration
- CVA: yes — `writeValue` / `registerOnChange` / `registerOnTouched` / `setDisabledState` (`switch.ts:331-347`). Clean implementation; `setDisabledState` writes a separate `cvaDisabled` signal merged with the input via `isDisabled()` (`switch.ts:248`).
- ErrorStateMatcher integration: **NOT integrated.** The switch has no awareness of `TW_ERROR_STATE_MATCHER`, no `errorState` signal, no `aria-invalid` reflection. A reactive switch with `Validators.requiredTrue` invalid + touched will not paint differently from a valid switch.
- form-field interop: **NOT integrated.** Switch does not extend `FormFieldControl` and does not provide under `TW_FORM_FIELD_CONTROL`. Putting `<tw-switch>` inside `<tw-form-field>` mounts but does not wire label/hint/error.
- Works with template-driven, reactive, AND signal-based forms: yes (verified by spec `switch.spec.ts:382-475`). Signal forms tested via `form()` and `FormField` from `@angular/forms/signals`.
- Findings:
  - **Cross-cutting form-control gap (with checkbox + radio): no error state, no form-field interop, no ErrorStateMatcher.** This is the dominant issue.
  - CVA + signal forms work correctly today — value flow is fine. The gap is purely about error semantics and form-field composition.

## Tests
- Spec file: yes (`switch.spec.ts`, 476 lines).
- Coverage breakdown:
  - Rendering: default mount, `role="switch"`, `aria-checked="false"`, every color, every size, label + description text rendering (`switch.spec.ts:123-185`).
  - Inputs: `aria-required`, `tabindex` (0 vs -1), `labelPosition` flex direction (`switch.spec.ts:189-222`).
  - Interactions: click toggles + emits `change`, Space + Enter + ignored keys, disabled blocks click + keyboard, programmatic parent update reflects (`switch.spec.ts:226-303`).
  - Accessibility: aria-disabled, aria-label round-trip, aria-labelledby targeting internal label, unique id per instance (`switch.spec.ts:306-336`).
  - Content projection: label + description + on/off icons all render (`switch.spec.ts:341-360`).
  - FocusMonitor: monitor on init, stopMonitoring on destroy (`switch.spec.ts:364-376`).
  - CVA: reactive forms init/setValue/disable, template-driven ngModel toggle (`switch.spec.ts:382-436`).
  - Signal forms: initial value reflection, user toggle updates field value, blur marks touched (`switch.spec.ts:441-475`).
- Vitest-specific issues: none. Uses `vi.fn()`, `vi.clearAllMocks()`, `vi.spyOn`, no `fakeAsync`/`tick`. Compliant.
- Findings:
  - **Strong coverage.** The 3-form-strategy story (reactive + template-driven + signal forms) is well exercised.
  - **Missing**: no test for the `(change)` output payload firing/order vs. `model.checked` update. Today both are asserted independently but not that they fire in the same tick.
  - **Missing**: no test for the accessible-name dev-mode warn (`switch.ts:240-244`). Easy to miss as a regression.
  - **Missing**: no test that `change` does NOT fire on `writeValue()` (the JSDoc claims this, the impl honors it — but no assertion).
  - **Missing**: no error-state assertions — but those don't exist in the impl, so this is a "test once impl lands" item.

## Gaps & lacks
1. **No form-field interop.** Cannot be placed inside `<tw-form-field>` for unified label/hint/error wiring. Cross-cutting with checkbox/radio.
2. **No error state / ErrorStateMatcher / `aria-invalid`.** A switch in a reactive form cannot express invalid state.
3. **`text-white`/`text-black` raw colors** in `CHECKED_ICON_COLOR` (`switch.ts:113-120`) — should be `text-on-{role}` tokens per the codified policy.
4. **`name` attribute is a no-op** on the host (`<tw-switch>` is not a native form element). Either remove or render a hidden native checkbox for true form participation.
5. **No `id` input** — cannot override the auto-generated `tw-switch-N`. Inconsistent with `input`.
6. **No `focused()` signal exposed.** Parent components can't observe focus.
7. **Mixed label/description API** (input + projection both rendered). Document mutual exclusivity or `@if`-gate.
8. **Projected on/off icon sizes are not constrained.** Consumer must know to use track-fitting sizes.
9. **Test gaps**: no payload-ordering test, no dev-warn test, no "change doesn't fire on writeValue" test.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Bring `tw-switch` to the same form-control bar as `tw-input`: register with form-field, support ErrorStateMatcher + `aria-invalid`, replace raw foreground colors with `text-on-{role}` tokens, and close the polish gaps (`name` semantics, `id` input, exposed `focused()` signal). Keep the visuals and the keyboard/CVA contracts intact.

### Tasks

1. **Register switch with form-field via `FormFieldControl`.**
   - File(s): `projects/ngx-tw/switch/switch.ts:127-184`, depends on `ngx-tw/form-field` exports.
   - Why: cross-cutting consistency — checkbox/radio/select/input all need to compose inside `<tw-form-field>`. Switch is the next form control.
   - Change:
     - `extends FormFieldControl<boolean>` on `SwitchComponent`.
     - Add `providers: [{ provide: NG_VALUE_ACCESSOR, ... }, { provide: TW_FORM_FIELD_CONTROL, useExisting: SwitchComponent }]`.
     - Expose required signals: `id` (the new `id` input — see task 5), `value` (`computed(() => internalChecked())`), `focused` (new signal driven by FocusMonitor — see task 7), `empty` (`computed(() => false)` — switches are never empty), `disabled` (already exists as `isDisabled`), `required` (already exists), `errorState` (new — see task 2), `controlType = 'switch'`, `userAriaDescribedBy` (`computed(() => ariaDescribedby())`).
     - Implement `setDescribedByIds(ids: string[])`: write/remove `aria-describedby` on the host.
     - Implement `onContainerClick(event)`: focus the host element via `elementRef.nativeElement.focus()` (do NOT toggle — the form-field's container click forwards from clicks anywhere in the wrapper; double-toggle is wrong).
   - Acceptance: spec adds a `<tw-form-field><label twLabel>Notifications</label><tw-switch /></tw-form-field>` host; asserts (a) label `for` points at the switch host id, (b) hint id appears in `aria-describedby`, (c) form-field's container click focuses the switch but does not toggle it. AXE passes.

2. **Add ErrorStateMatcher + `errorState` + `aria-invalid`.**
   - File(s): `projects/ngx-tw/switch/switch.ts:185-247, 167-184`.
   - Why: a required switch in a reactive form cannot paint invalid today.
   - Change:
     - Inject `inject(NgControl, { optional: true, self: true })`, `inject(NgForm, { optional: true })`, `inject(FormGroupDirective, { optional: true })`, `inject(TW_ERROR_STATE_MATCHER)`. Pattern matches `input.ts:154-162`.
     - Add `readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);`.
     - Add `errorState = computed(() => matcher.isErrorState(ngControl?.control ?? null, form))`. Same revision-signal pattern as input (`_ngControlRev`, `_formSubmitRev`).
     - Host binding `'[attr.aria-invalid]': 'errorState() || null'`.
     - Visual: when `errorState()`, swap the off-track to `border border-error-500` and the focus ring to `outline-error-500` (compoundVariant). Reuse the input's pattern.
   - Acceptance: spec asserts a `<tw-switch [required]="true">` inside a reactive form flips `aria-invalid="true"` once touched + invalid; error ring renders.

3. **Replace `text-white`/`text-black` with `text-on-{role}` tokens.**
   - File(s): `projects/ngx-tw/switch/switch.ts:112-121`.
   - Why: codified after commit `e952a33`; current values are raw palette.
   - Change: rewrite `CHECKED_ICON_COLOR` to `{ primary: 'text-on-primary', secondary: 'text-on-secondary', accent: 'text-on-accent', neutral: 'text-on-neutral', info: 'text-on-info', success: 'text-on-success', warning: 'text-on-warning', error: 'text-on-error' }`. Remove the `text-black` carve-out — `text-on-warning` already maps to `--color-amber-950`.
   - Acceptance: spec asserts the on-icon color class for each `TwColor`; visual diff shows no perceptible contrast change against the active track.

4. **Decide `name` attribute semantics.**
   - File(s): `projects/ngx-tw/switch/switch.ts:179, 207-208`.
   - Why: `name` on `<tw-switch>` does not participate in native form submission; it's a no-op for `<form>`.
   - Change: render a visually hidden, deterministic-id `<input type="checkbox" [name]="name()" [checked]="internalChecked()" [disabled]="isDisabled()" tabindex="-1" aria-hidden="true">` inside the host so the switch participates in native form submission (matches Material's `MatSlideToggle`). Position absolutely off-screen with `sr-only` or a `pointer-events-none size-0 overflow-hidden` wrapper.
   - Acceptance: spec asserts that submitting a `<form>` containing `<tw-switch name="enabled" [checked]="true">` includes `enabled=on` in FormData; the hidden input does not appear in the visual layout or the tab order.

5. **Add `id` input for parity with `input`.**
   - File(s): `projects/ngx-tw/switch/switch.ts:208-217`.
   - Why: consistency with `input`; needed for `<label for>` from `<tw-form-field>`.
   - Change: add `readonly idInput = input<string | undefined>(undefined, { alias: 'id' });` and a `computed` `id = computed(() => this.idInput() ?? this.hostId)`. Bind to host via `'[id]': 'id()'`. Update `labelId`/`descriptionId` to derive from `id()` not `hostId`.
   - Acceptance: spec asserts that providing `id="my-switch"` writes the attribute and that `<label for="my-switch">` associates correctly.

6. **Expose `focused()` signal.**
   - File(s): `projects/ngx-tw/switch/switch.ts:225-227, 351-356`.
   - Why: form-field reads `control.focused()` to drive its focused state; today this is missing.
   - Change: convert FocusMonitor's subscription to a `focused = signal(false)` and update it from the monitor stream (mirror `input.ts:278-289`). Remove the redundant `(blur)` handler on the host — the FocusMonitor blur transition already covers `onTouched`.
   - Acceptance: spec asserts `directive.focused()` flips on focus/blur events.

7. **Add a test for `change` not firing on `writeValue()`.**
   - File(s): `projects/ngx-tw/switch/switch.spec.ts`.
   - Why: JSDoc-stated invariant is currently unverified.
   - Change: spy on `change`; call `instance.writeValue(true)`; assert spy not called.
   - Acceptance: green.

8. **Add a test for the accessible-name dev warn.**
   - File(s): `projects/ngx-tw/switch/switch.spec.ts`.
   - Why: a regression here is silent.
   - Change: render `<tw-switch />` with no label/aria-label/projection; spy on `console.warn`; flush `afterNextRender`; assert one call.
   - Acceptance: green.

9. **Constrain projected on/off icon sizes via tv compound variants.**
   - File(s): `projects/ngx-tw/switch/switch.ts:45-75`.
   - Why: consumers shouldn't have to know that an xs track wants `size-2.5` icons.
   - Change: in each `size` row of `switchVariants`, add `iconWrap: '[&_svg]:size-X'` mapping (xs→2.5, sm→3, md→3.5, lg→4, xl→4.5 — half-step justified for xs/xl per the icon-sub-scale carve-out).
   - Acceptance: spec asserts the size selector class is present at every size.

### Out of scope

- Removing the `label` / `description` string inputs in favor of projection-only — both are documented and have spec coverage; keeping the dual API but documenting mutual exclusivity is the right tradeoff.
- Adding a `[slot="thumb-icon"]` — defer until requested.
- Switching from `role="switch"` to a hidden native `<input type="checkbox" role="switch">` — the current implementation matches Tailwind UI and Material; the native equivalent gains nothing and loses the keyboard Enter activation.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- switch`
- Visual check: `http://localhost:4600/switch` (every size + color, inside form-field, error state via reactive `Validators.requiredTrue`)
- A11y: `npm run e2e:a11y` (switch route — verify with form-field wrapper)

## Priority
**P1** — switch lags the input directive by a meaningful amount: no form-field interop, no error state, no on-{role} tokens, no native form participation. None of these are catastrophic (CVA + signal forms work), but they prevent the switch from being a drop-in form control alongside `tw-input` in real applications. Land together with the matching checkbox/radio rescue in this batch.
