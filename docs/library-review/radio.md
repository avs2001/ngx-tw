# Radio — Production-Grade Review

**Entry point:** `ngx-tw/radio`
**Files:** `projects/ngx-tw/radio/`

## Snapshot
- Selectors: `tw-radio` (element, `RadioComponent`), `tw-radio-group` (element, `RadioGroupComponent`)
- Public classes/directives: `RadioComponent`, `RadioGroupComponent<T>`
- Inputs: 12 on `RadioComponent` (`value`, `color`, `size`, `variant`, `disabled`, `label`, `description`, `labelPosition`, `name`, `ariaLabel`, `ariaLabelledby`, `ariaDescribedby`) + 1 model (`checked`) ; 11 on `RadioGroupComponent` (`color`, `size`, `variant`, `orientation`, `disabled`, `required`, `name`, `ariaLabel`, `ariaLabelledby`, `ariaDescribedby`) + 1 model (`value`)
- Outputs: 1 on `RadioComponent` (`change`), 1 on `RadioGroupComponent` (`change`)
- Slots: 3 on radio (default = label, `[slot='description']`, `[slot='dot']`)
- CVA: yes (on `RadioGroupComponent`)
- `tv()` config: yes, slots (`radioVariants` on radio: 8 slots; `radioGroupVariants` on group: single-element)
- A11y CDK utilities used: `FocusMonitor` (both radio and group), roving tabindex implemented manually

## Inputs
### `RadioComponent`
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `value` | `unknown` | `undefined` | yes | Required inside a group; ignored standalone |
| `color` | `TwColor \| undefined` | `undefined` (inherits) | yes | Per-radio override of group color |
| `size` | `TwSize \| undefined` | `undefined` (inherits) | yes | Per-radio override of group size |
| `variant` | `RadioVariant \| undefined` | `undefined` (inherits) | yes | `'solid' \| 'outline'` |
| `disabled` | `boolean` | `false` | yes | OR'd with group disabled |
| `label` | `string \| undefined` | `undefined` | yes | Inline string label fallback |
| `description` | `string \| undefined` | `undefined` | yes | Secondary text under label |
| `labelPosition` | `RadioLabelPosition` | `'after'` | yes | `'before' \| 'after'` |
| `name` | `string \| undefined` | `undefined` | yes | Standalone HTML form name |
| `ariaLabel` (alias) | `string \| undefined` | `undefined` | yes | Aliased `aria-label` |
| `ariaLabelledby` (alias) | `string \| undefined` | `undefined` | yes | Aliased `aria-labelledby` |
| `ariaDescribedby` (alias) | `string \| undefined` | `undefined` | yes | Aliased `aria-describedby` |
| `checked` (model) | `boolean` | `false` | yes | Standalone two-way; in-group is read-only |

### `RadioGroupComponent<T>`
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `color` | `TwColor` | `'primary'` | yes | Propagated to children |
| `size` | `TwSize` | `'md'` | yes | Propagated to children |
| `variant` | `RadioVariant` | `'solid'` | yes | Propagated to children |
| `orientation` | `RadioOrientation` | `'vertical'` | yes | Drives `aria-orientation` + arrow-key model |
| `disabled` | `boolean` | `false` | yes | Cascades to children |
| `required` | `boolean` | `false` | yes | Sets `aria-required` |
| `name` | `string \| undefined` | `undefined` | yes | Propagated to each child's `name` attr |
| `ariaLabel` (alias) | `string \| undefined` | `undefined` | yes |  |
| `ariaLabelledby` (alias) | `string \| undefined` | `undefined` | yes |  |
| `ariaDescribedby` (alias) | `string \| undefined` | `undefined` | yes |  |
| `value` (model) | `T \| null` | `null` | yes | Authoritative selection |

### Findings
- Radio has 13 inputs (12 + model). Group has 11 inputs (10 + model). Both exceed the 5–6 cap; both qualify under the **form-control exception** (ARIA + Forms baseline plus color/size/variant inheritance). Compliant — no reshape needed.
- All inputs carry one-line JSDoc — compliant.
- All booleans default to `false` — compliant.
- `RadioComponent` declares `name` even when nested in a group (group's name wins). The duplicate axis is fine because consumers may still use standalone radios; documentation could clarify the precedence in the spec.
- Group `value` is a `model<T | null>`. Standalone radio exposes `checked` (`model<boolean>`). The intentional dual surface is well-documented in JSDoc.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `RadioComponent.change` | `boolean` | past-tense / action | Fires on user-driven selection only (not programmatic) |
| `RadioGroupComponent.change` | `T \| null` | past-tense / action | Fires when user selection changes; does not fire on `writeValue` |

### Findings
- Output names are `change`. Per the codified dual-pattern note, both `valueChange` (state) and past-tense action names coexist. `change` is the canonical Material-equivalent name; aligned with checkbox/slider/select conventions in this library. Compliant.
- Group also emits `valueChange` implicitly via the `model<T | null>` two-way binding — that is separate from the `change` output and is the propertyChange-pattern coverage. Compliant.
- `RadioComponent.change` fires only when a radio *becomes* selected (line 360–362). The signature could also benefit from a payload that includes `previousValue`/`value` like `select.selectionChange` for symmetry, but the boolean is simple and Material-equivalent. Low priority.

## Customization surface
- ng-content slots:
  - Default slot (label content) — used inside `labelClasses` span (line 173).
  - `[slot='description']` — rich description (line 179).
  - `[slot='dot']` — replaces the selected-state dot when checked (line 163).
- Structural directives: none — radio uses plain named slots.
- Fallback content: `[slot='dot']` falls back to the styled inner `<span>` (line 164). Description and label have inline fallback bound from string inputs. Compliant.
- Class merging: yes — `twMerge: true` on both `tv()` configs (lines 102, 426).
- Findings:
  - Customization is good: three slots cover label, description, dot. A consumer can replace any of them with rich content.
  - Missing slot: there is no way to project a leading icon/avatar before the radio circle (similar to checkbox's leading slot). Optional; not a hard gap.

## CSS / Styling
- tailwind-variants: yes; multi-slot on radio (`root`, `circleWrap`, `circle`, `dotWrap`, `dot`, `labelWrap`, `label`, `description`); single-element on group.
- twMerge: yes on both `tv()` calls (lines 102, 426).
- Semantic tokens vs raw palette: compliant. Lines 107–149 use only `primary/secondary/accent/neutral/info/success/warning/error` shades plus `border-fg` for neutral. No raw palette colors.
- Surface/fg/border tokens usage: `border-border`/`hover:border-border-strong` on unchecked circle (line 88); `text-fg`/`text-fg-muted` for label/description (lines 46–47). Compliant.
- Radius compliance: `rounded-md` on root (line 38), `rounded-full` on circle/dot. Compliant.
- Spacing/gap compliance: `gap-3` on root (line 38) — within the canonical `gap-1/1.5/2/3` set. Group uses `gap-2` (vertical) and `gap-3` (horizontal) (lines 413–414) — compliant.
- Typography compliance: label `font-medium`, description normal weight. Sizes `text-2xs / text-xs / text-sm / text-base` (lines 54–80) — `text-base` is appropriate for `lg`/`xl` per the trigger scale. Compliant.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on root (line 38). Compliant, but **note**: the ring is hard-coded to `primary-500` regardless of the resolved `color`. Slider uses a per-color focus ring (`FOCUS_RING` lookup). Per the codified focus-ring policy "outline-primary-500" is required, so this is *correct* — the focus indicator should not shift colors. Compliant.
- Dark mode handling: solid/outline ring + dot are `-600` shades on a transparent circle. No explicit `dark:` overrides — the `-600` shade rebrands cleanly. Compliant.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on circle (line 41). Compliant.
- Shadows: none on the radio control itself. Compliant.
- Icon sub-scale: dot is a **dot indicator** (size-1.5/2/2.5/3/3.5). The xs (`size-1.5`) and xl (`size-3.5`) fall outside the codified dot scale (xs=2 / sm=2.5 / md=3). xs uses `size-3.5` for the circle (between dot scale and glyph scale) without the inline justification required by the half-step rule (see CLAUDE.md "Half-step decorative"). FLAG: add a short inline comment justifying `size-3.5` for xs circle and `size-1.5`/`size-3.5` for xs/xl dots; or remap to canonical scale.
- Animations: `animate.enter="check-in"` on dot (line 162) — references `@keyframes check-in` in `theme/_base.css` (line 82). Compliant.
- Findings:
  - The `size-1.5` xs dot, `size-3.5` xs circle, and `size-3.5` xl dot all sit outside the codified dot scale. Either add an inline justification comment or remap to canonical values. P2.

## Accessibility
- ARIA roles/attributes: `role="radio"` on each radio host (line 187); `role="radiogroup"` on group (line 445). `aria-checked`, `aria-disabled`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-orientation`, `aria-required` all bound (lines 191–198, 448–453). Compliant.
- Keyboard support: Space activates (line 376); Enter explicitly NOT supported per native radio semantics (line 399 test). ArrowDown/ArrowRight = next enabled; ArrowUp/ArrowLeft = previous enabled; Home/End = first/last enabled (lines 568–582). Wrap-around active (line 603). Disabled options skipped during arrow nav (line 604). Compliant — matches WAI-ARIA APG pattern.
- CDK a11y utilities: `FocusMonitor.monitor()` on both radio and group hosts (lines 393, 643). Stop monitoring via `DestroyRef.onDestroy()`. Compliant.
- Label/hint/error wiring: `effectiveAriaLabelledby` (line 302) and `effectiveAriaDescribedby` (line 309) auto-wire the label/description IDs. Compliant.
- Dev-mode accessible-name warning: present (lines 345, 522). Compliant.
- Roving tabindex: `isFocusable()` computed (lines 288–300) — only the selected (or first enabled) radio is tabbable. Compliant.
- AXE risks: low; potential issue is that the group does **not** carry `aria-activedescendant`. Standard radio-group pattern manages focus on the active radio (roving tabindex) — that is the implemented model. Compliant.

### Findings
- Implementation is solid and matches APG. No major a11y gaps.
- Minor: the group's keyboard handler (line 551) listens at the group host, but with roving tabindex the radio child is the focused element. The handler still works because of bubbling, but documenting the design or moving the handler to a `(keydown)` on the bubbled target is cleaner. Low priority.

## Form integration (if applicable)
- CVA implementation: `RadioGroupComponent` implements `ControlValueAccessor` (line 457). Providers wire `NG_VALUE_ACCESSOR` via `forwardRef` (lines 437–443). `writeValue` updates `activeValue` + `value` (line 625); `setDisabledState` sets `cvaDisabled` (line 638). Compliant.
- ErrorStateMatcher integration: **missing** — there is no `TW_ERROR_STATE_MATCHER` injection, no `errorState` signal, and no `aria-invalid` binding on the group or radios. The library has a codified matcher (`projects/ngx-tw/core/error-state-matcher.ts`); other form controls (`select`) provide an `errorStateSignal`. P1 gap.
- form-field interop: **missing** — no `TW_FORM_FIELD_CONTROL` provider, no `FormFieldControl` implementation. Consumers cannot wrap a radio group in `<tw-form-field>` to get a label/hint/error frame. P1 gap.
- Works with all three form strategies: yes — tests cover reactive (`FormControl`), template-driven (`ngModel`), and signal forms (`form()` + `[formField]`) (lines 728–830 of spec).
- Findings:
  - Add `TW_ERROR_STATE_MATCHER` injection + `errorStateSignal` + `aria-invalid` binding on the group host (mirrors `select.ts`). P1.
  - Implement `FormFieldControl` on the group + provide `TW_FORM_FIELD_CONTROL` so the group can sit inside `<tw-form-field>` with a label/hint/error. P1.

## Tests
- Spec file: yes (`radio.spec.ts`, 830 lines).
- Coverage breakdown:
  - Rendering: variants/colors/sizes/orientations covered (lines 207–240).
  - Inputs/outputs: aria-checked, change emit, programmatic vs user change (lines 251–296).
  - Keyboard: all arrows, Home/End, wrap-around, disabled skipping, Space activation, Enter ignored (lines 298–416).
  - Roving tabindex: dedicated `describe` block (lines 418–455).
  - Disabled cascade: per-radio + group-level + aria-disabled (lines 457–496).
  - Inheritance overrides: color/size/variant per-radio override (lines 498–517).
  - Name propagation (lines 519–528).
  - Accessibility: aria-label, aria-required, unique IDs, dev-mode name warning (lines 530–581).
  - Content projection: default + description + dot slots (lines 583–601).
  - FocusMonitor lifecycle (lines 603–617).
  - Standalone: separate describe (lines 622–724) — covers native non-toggle-off semantics, Space, disabled, dev-mode warning.
  - CVA: reactive, template-driven, signal forms (lines 728–830).
- Vitest issues: no `fakeAsync`/`tick`. Uses `vi.spyOn`, `fixture.componentRef.setInput`, `whenStable()`. Compliant.
- Findings:
  - Excellent coverage. No gaps in functional tests.
  - The visual a11y check (focus ring presence) is implicit — only `tabindex` is asserted. Would benefit from class-string asserts on the focus-visible outline classes (matching how select does it on the listbox, lines 251–260 of select spec).
  - No test asserts that programmatic `writeValue` does NOT call the change emit (the test for `selectionChange.source = 'programmatic'` pattern from select is missing here).

## Gaps & lacks
1. **No ErrorStateMatcher integration.** `RadioGroupComponent` has no `errorState`, no `aria-invalid`, no `TW_ERROR_STATE_MATCHER` injection. Required parity with other form controls (checkbox/select).
2. **No `FormFieldControl` interop.** Group cannot sit inside `<tw-form-field>` to get label/hint/error chrome and merged `aria-describedby`.
3. **Half-step icon scales without justification.** `size-1.5`/`size-3.5` (xs dot/circle and xl dot) sit outside the codified dot scale. Need inline comments or remapping.
4. **No `valueChange` symmetry on RadioComponent.change payload.** Boolean payload loses the previous/new value pair. Low priority.
5. **No leading-icon slot.** Optional.
6. **Group keyboard handler bound to group host.** Works via bubbling but unusual; document or move handler to the focused radio.

## Concrete recommendations (deep-dive prompt body)

### Goal
Bring `RadioGroupComponent` into parity with the library's form-control standard by integrating `TW_ERROR_STATE_MATCHER` and `FormFieldControl`. Justify or remap the half-step icon scales. Polish minor a11y and test coverage gaps.

### Tasks
1. **Integrate `TW_ERROR_STATE_MATCHER`** — wire error state into `RadioGroupComponent`.
   - File(s): `projects/ngx-tw/radio/radio.ts:457-648`
   - Why: Library codifies `TW_ERROR_STATE_MATCHER` as the strategy token for form controls. Radio is the only form control missing it.
   - Change: Inject `NgControl` (`{ self: true, optional: true }`) and `TW_ERROR_STATE_MATCHER`; inject `NgForm`/`FormGroupDirective` optionally; expose an `errorState` signal computed from the matcher result; bind `[attr.aria-invalid]="errorState() || null"` on the group host. Mirror the pattern in `select.ts:786-1448`.
   - Acceptance: `errorState()` returns `true` when the matcher considers the bound control invalid; a Vitest case asserts `aria-invalid="true"` after `control.markAsTouched()` + invalid value.

2. **Implement `FormFieldControl`** — make the group form-field-compatible.
   - File(s): `projects/ngx-tw/radio/radio.ts:457-648`
   - Why: Consumers should be able to wrap a radio group in `<tw-form-field>` for label/hint/error chrome.
   - Change: Implement the `FormFieldControl<T>` abstract: `id`, `value`, `focused` (driven by the focused-thumb FocusMonitor signal), `empty`, `disabled`, `required`, `errorState`, `controlType = 'radio-group'`, `userAriaDescribedBy`, `setDescribedByIds(ids)`, `onContainerClick(event)` that focuses the first enabled radio. Provide `TW_FORM_FIELD_CONTROL` via `{ provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(...) }`.
   - Acceptance: A Vitest case wraps `<tw-radio-group>` inside `<tw-form-field>` with `<label twLabel>`, `<tw-hint>`, `<tw-error>` and asserts the merged `aria-describedby` reaches the group host.

3. **Justify or remap half-step icon scales** — clean up icon-scale violations.
   - File(s): `projects/ngx-tw/radio/radio.ts:50-80`
   - Why: `size-1.5` (xs dot), `size-3.5` (xs circle), `size-3.5` (xl dot) sit between codified dot/glyph scales without the inline-comment justification required by CLAUDE.md ("Half-step decorative").
   - Change: Either (a) remap xs circle to `size-3` (matching the dot scale's md value would overlap, so accept `size-3.5` with inline comment) and xs dot to `size-2`, xl dot to `size-4`; or (b) add inline `// half-step …` comments on each half-step value explaining why neither neighbouring step fits.
   - Acceptance: Visual identity is preserved across breakpoints (compare demo Examples page before/after); inline comments referenced from the spec section.

4. **Assert focus-ring classes in spec** — improve visual a11y test coverage.
   - File(s): `projects/ngx-tw/radio/radio.spec.ts:418-455`
   - Why: Roving-tabindex test asserts `tabindex` only. The codified focus-ring policy (`focus-visible:outline-2 outline-offset-2 outline-primary-500`) is not exercised.
   - Change: Add an assertion that the radio host's `className` contains the canonical outline classes.
   - Acceptance: Test passes; coverage of focus-ring policy added.

5. **Add a programmatic-vs-user change test** — mirror select spec.
   - File(s): `projects/ngx-tw/radio/radio.spec.ts:296`
   - Why: There is one test that confirms programmatic `selected.set(...)` does NOT fire `change`, but no symmetric coverage for `writeValue` from CVA. Adds confidence that CVA paths do not double-fire.
   - Change: In the `RadioGroup CVA` block, assert that `control.setValue('c')` does not emit `change`.
   - Acceptance: Test passes; explicit guarantee.

6. **Optional: add a `RadioGroupChangeEvent` payload** — symmetry with select.
   - File(s): `projects/ngx-tw/radio/radio.ts:492`
   - Why: Select's `selectionChange` emits `{ value, previousValue, added, removed, source }`. Radio's `change` only emits the new value. Symmetry is nice-to-have for analytics consumers.
   - Change: Either keep `change: T | null` and add `selectionChange: { value, previousValue, source }`, or replace `change` with the richer payload (breaking change — defer to next major).
   - Acceptance: Deferred — flag as a future enhancement.

### Out of scope
- Reshaping `RadioComponent` inputs into config objects (form-control exception covers the count).
- Adding indeterminate state (not a radio pattern).
- Changing the `aria-checked` boolean to `"true"`/`"false"` strings (already done).

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- radio`
- Visual check: `http://localhost:4600/radio/examples`
- A11y: `npm run e2e:a11y` or run AXE in the demo overview.

## Priority
**P1** — Functional and visual quality are already strong; the missing `ErrorStateMatcher`/`FormFieldControl` integration is the only blocker that breaks parity with other form controls. The icon-scale half-steps are P2 polish.
