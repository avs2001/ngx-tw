# Slider — Production-Grade Review

**Entry point:** `ngx-tw/slider`
**Files:** `projects/ngx-tw/slider/`

## Snapshot
- Selectors: `tw-slider` (element, `SliderComponent`)
- Public classes/directives: `SliderComponent`
- Inputs: 22 (`min`, `max`, `step`, `color`, `size`, `variant`, `disabled`, `required`, `range`, `marks`, `showMarkLabels`, `showMinMax`, `showValue`, `label`, `description`, `valueFormatter`, `name`, `ariaLabel`, `ariaLabelledby`, `ariaDescribedby`, `ariaLabelStart`, `ariaLabelEnd`) + 1 model (`value`)
- Outputs: 2 (`input`, `change`)
- Slots: 0 (no `ng-content`)
- CVA: yes
- `tv()` config: yes, multi-slot (15 slots: `root`, `header`, `label`, `valueText`, `description`, `region`, `rail`, `fill`, `marksRow`, `mark`, `markActive`, `thumb`, `bubble`, `bubbleVisible`, `markLabelsRow`, `markLabel`, `minMaxRow`)
- A11y CDK utilities used: `FocusMonitor`, `Directionality` (for RTL)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `min` | `number` | `0` | yes |  |
| `max` | `number` | `100` | yes |  |
| `step` | `number \| null` | `1` | yes | `null` = continuous |
| `color` | `TwColor` | `'primary'` | yes |  |
| `size` | `TwSize` | `'md'` | yes |  |
| `variant` | `SliderVariant` | `'solid'` | yes | `'solid' \| 'soft' \| 'outline'` |
| `disabled` | `boolean` | `false` | yes |  |
| `required` | `boolean` | `false` | yes | **NOT wired to any aria-required attribute (template gap)** |
| `range` | `boolean` | `false` | yes |  |
| `marks` | `SliderMark[] \| boolean` | `false` | yes | `true` auto-generates from step |
| `showMarkLabels` | `boolean` | `false` | yes |  |
| `showMinMax` | `boolean` | `false` | yes |  |
| `showValue` | `boolean` | `false` | yes |  |
| `label` | `string \| undefined` | `undefined` | yes |  |
| `description` | `string \| undefined` | `undefined` | yes |  |
| `valueFormatter` | `SliderValueFormatter \| undefined` | `undefined` (`DEFAULT_FORMATTER`) | yes |  |
| `name` | `string \| undefined` | `undefined` | yes | Informational; no native input rendered |
| `ariaLabel` (alias) | `string \| undefined` | `undefined` | yes |  |
| `ariaLabelledby` (alias) | `string \| undefined` | `undefined` | yes |  |
| `ariaDescribedby` (alias) | `string \| undefined` | `undefined` | yes |  |
| `ariaLabelStart` | `string` | `'Minimum'` | yes | Range mode start thumb |
| `ariaLabelEnd` | `string` | `'Maximum'` | yes | Range mode end thumb |
| `value` (model) | `SliderValue` | `0` | yes | `number` single, `[number, number]` range |

### Findings
- 22 inputs + 1 model. Exceeds the 5–6 cap; qualifies under the **form-control exception** (~12 ARIA + Forms baseline; slider adds range/marks/min/max axes that are independent geometric concerns). Compliant.
- All inputs carry one-line JSDoc — compliant.
- All booleans default to `false` — compliant.
- **`required` is a declared input (line 413) but never read in the template** — there is no `[attr.aria-required]` binding on the thumb. This is a real bug: setting `required="true"` has no observable effect. P0.
- `name` is informational only (no native form input is rendered). JSDoc is honest about this; acceptable but could be wired into a hidden `<input type="hidden">` for native form submission. Low priority.
- `ariaLabelStart`/`ariaLabelEnd` defaults are English-only literals (`'Minimum'`, `'Maximum'`). Internationalisation hook (`$localize`-friendly inputs) would help, but acceptable to defer.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `input` | `SliderValue` | propertyChange-ish; named `input` per HTML5 convention | Fires continuously while dragging or key-held |
| `change` | `SliderValue` | action | Fires on commit (pointer release, key release after change, blur with keyboard-dirty flag) |

### Findings
- `input` and `change` follow the HTML5 `<input type="range">` semantics: `input` is rapid-fire while dragging, `change` is commit-only. Matches Material's API. Compliant.
- The `change` emit is triggered by `commitValue()` (line 950) — which runs on pointer up AND on every keyboard step (line 834). That makes `change` essentially identical to `input` for keyboard nav (each Arrow press fires both). This deviates from HTML5 spec where keyboard `change` should debounce until focus is lost. Worth aligning with native behaviour: emit `input` per keypress and `change` only on `blur` if keyboard-dirty.
- Both outputs share the same payload type as `value`. Consistent.

## Customization surface
- ng-content slots: **none**. The component does not use `<ng-content>` anywhere — label/description/value/marks are all driven by string/object inputs.
- Structural directives: none.
- Fallback content: n/a.
- Class merging: yes — `twMerge: true` (line 198).
- Findings:
  - No content projection limits richness: a consumer cannot render a custom mark label (e.g., an icon), custom value bubble (e.g., temperature unit suffix), or a leading/trailing icon (volume mute/max). The `valueFormatter` covers the simple textual case but cannot project DOM.
  - Recommend adding three optional structural slots: `*twSliderMarkLabel` (per-mark template with `{ value, label, index }` context), `*twSliderValueBubble` (per-thumb template with `{ value, formattedValue, thumb: 'single' | 'start' | 'end' }` context), and named slots `[slot='leading']` / `[slot='trailing']` for inline glyphs around the rail. P2 enhancement.

## CSS / Styling
- tailwind-variants: yes, multi-slot (16 slots).
- twMerge: yes (line 198).
- Semantic tokens vs raw palette:
  - All color lookups (lines 57–110) use semantic tokens (`primary-500`, `secondary-300`, `info-500`, `fg`, `fg-muted`). Compliant.
  - **One concern**: Line 134 bubble uses `bg-fg text-surface`. `text-surface` is a non-canonical token — `surface` is a *background* token; the foreground value that pairs with `bg-fg` should be `text-surface` (white in light, dark gray in dark). The library declares `--color-surface` (white) which is used as a text color here for inversion. While this works visually, it doesn't match the `on-{role}` convention that landed in PR commit `e952a33`. A new `--color-on-fg` (= white in light, dark gray in dark) would be more semantically correct. P2.
- Surface/fg/border tokens usage:
  - `bg-surface-muted` rail (line 124); `bg-surface` mark dot (line 129); `text-fg`/`text-fg-muted` labels (lines 119–121); `border-border` outline rail (line 178); `bg-surface-raised` thumb (line 132). Compliant.
- Radius compliance: `rounded-full` everywhere (rail, fill, mark, thumb). Bubble uses `rounded-md`. Compliant.
- Spacing/gap compliance: `gap-3` header (line 118); `mt-2` mark labels (line 136); `mt-0.5` not present (n/a — no icon-text alignment needed). Compliant.
- Typography compliance:
  - Label `text-sm font-medium` (line 119). Compliant — matches form-field label spec.
  - Value text `text-sm` `font-medium` `tabular-nums` (line 120). Compliant.
  - Description `text-xs text-fg-muted` (line 121). Compliant — matches form-field hint spec.
  - Bubble `text-xs font-medium tabular-nums` (line 134). Compliant.
  - Mark label `text-xs text-fg-muted tabular-nums` (line 138). Compliant.
  - Min/max row `text-xs text-fg-muted tabular-nums` (line 139). Compliant.
- Focus rings compliance:
  - Thumb uses `focus-visible:outline-2 focus-visible:outline-offset-2` (line 132) and then per-color outline via `FOCUS_RING[color]` (lines 101–110). This means the ring colour follows the slider's color input (e.g., `outline-success-500` for a success slider). Per the canonical policy the ring is `outline-primary-500` — but the policy is silent on whether colored controls may carry colored rings. Slider explicitly applies per-color rings, which **deviates** from button/select which keep `outline-primary-500` regardless of color. P1 — align with library policy (use canonical primary-500 ring) OR escalate to the policy maintainer that colored form controls warrant colored focus rings.
- Dark mode handling: thumb is `bg-surface-raised` (white surface, adapts via theme). Fill uses solid `bg-{role}-500` (rebrands cleanly). No explicit `dark:` overrides — relies on theme tokens. Compliant.
- Transitions:
  - Rail `transition-colors duration-200 motion-reduce:transition-none` (line 124). Compliant.
  - Fill `transition-colors duration-200 motion-reduce:transition-none` (line 125). Compliant.
  - Thumb `transition-[transform,box-shadow] duration-150 motion-reduce:transition-none` (line 132). `duration-150` is correct for micro-interaction; multi-property listed explicitly. Compliant.
  - Bubble `transition-opacity duration-150` (line 134). Compliant.
- Shadows: thumb `shadow-sm` rest → `shadow-md` hover/drag (line 132). Compliant per the codified shadow scale.
- Icon sub-scale:
  - Thumb is a **square interactive target** rendered as a circle (rounded-full). xs=size-3, sm=size-4, md=size-5, lg=size-6, xl=size-7 (lines 145–169). Per the codified square-interactive scale, xs should be `size-6` (24px). The current xs=`size-3` (~12px) is FAR below the 24px AAA target-size minimum. P0 a11y issue.
  - Mark dots are **dot indicators**. xs=`size-1` (4px), sm=`size-1`, md=`size-1.5`, lg=`size-2`, xl=`size-2`. The codified dot scale is xs=2/sm=2.5/md=3. Slider's marks are *smaller* than the codified scale. Marks are decorative (no interaction), but the codified scale exists for a reason — visibility. P2.
- Animations: thumb has no enter/leave animations — appropriate (slider doesn't insert/remove DOM).
- Findings:
  - Thumb size at `xs`/`sm`/`md` is below AAA target-size. P0.
  - Per-color focus rings deviate from canonical primary-500 policy. P1.
  - `text-surface` for bubble text relies on the surface token's foreground role — consider `text-on-fg` token. P2.
  - Mark dots smaller than codified dot scale. P2.

## Accessibility
- ARIA roles/attributes:
  - `role="slider"` on each thumb (lines 291, 313, 343). Compliant.
  - `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext` per thumb (lines 292–295, 319–322, 347–350). Compliant.
  - `aria-orientation="horizontal"` hardcoded (line 296, 323, 351). Vertical orientation is NOT supported despite being a common slider variant. P1 functional gap.
  - `aria-disabled` (line 297, 324, 352). Compliant.
  - `aria-labelledby`/`aria-label`/`aria-describedby` correctly resolved per-thumb (lines 289–291). Compliant.
  - Range thumbs constrain each other via `effectiveStartMax`/`effectiveEndMin` (lines 578–580) so the start cannot cross the end. Compliant.
  - **`aria-required` is NOT bound anywhere despite the input existing** (line 413). P0 bug.
- Keyboard support:
  - Arrow ←/→/↑/↓ step ±1 (lines 802–812). RTL inverts horizontal arrows (lines 803, 809). Compliant.
  - PageUp/PageDown ±10% of range (lines 814–818). Compliant.
  - Home/End jump to min/max (lines 820–824). Compliant.
  - Disabled blocks keyboard (line 792). Compliant.
  - No `Shift+Arrow` (no fine-step) — minor a11y nicety missing. P2.
  - Range mode: arrow keys move the focused thumb only; constraint clamping prevents crossover. Compliant.
- CDK a11y utilities:
  - `FocusMonitor.monitor(elementRef, true)` (line 996). Compliant.
  - `Directionality` injected for RTL (line 469). Compliant.
  - No `LiveAnnouncer` — but the value bubble + `aria-valuetext` cover the SR feedback. Acceptable.
- Label/hint/error wiring:
  - `resolvedSingleAriaLabel` / `resolvedSingleAriaLabelledby` (lines 691–701) correctly cascade through label → ariaLabelledby → ariaLabel.
  - Range mode falls back to per-thumb defaults ("Minimum"/"Maximum"). Compliant.
- AXE risks:
  - Target-size: xs/sm/md thumbs below 24×24. P0.
  - Missing `aria-required` wiring (bug). P0.
  - Missing vertical orientation (consumers may set `aria-orientation` externally? No host attribute hook exists).

### Findings
- Significant a11y gaps: target-size failure on small thumbs, dead `required` input, no vertical orientation.
- Otherwise excellent: ARIA value attributes, RTL keyboard inversion, range constraints, FocusMonitor.

## Form integration (if applicable)
- CVA implementation: yes (lines 965–991). `writeValue` normalises null/undefined/array/scalar payloads; sets internal signals. `setDisabledState` sets `cvaDisabled`. Compliant.
- ErrorStateMatcher integration: **missing**. No `TW_ERROR_STATE_MATCHER` injection, no `errorState` signal, no `aria-invalid` binding. Same gap as `radio`. P1.
- form-field interop: **missing**. No `TW_FORM_FIELD_CONTROL` provider, no `FormFieldControl` implementation. Cannot sit inside `<tw-form-field>`. P1.
- Works with all three form strategies: yes — tests cover reactive (line 611), template-driven (line 636), signal forms (line 667).
- Findings:
  - Add `ErrorStateMatcher` wiring. P1.
  - Implement `FormFieldControl` so the slider can render inside `<tw-form-field>` with label/hint/error chrome. P1.

## Tests
- Spec file: yes (`slider.spec.ts`, 688 lines).
- Coverage breakdown:
  - Rendering: every color/size/variant, label wiring, description wiring, min/max row, auto marks, custom marks (lines 187–306).
  - ARIA: valuemin/max/now, valuetext via formatter, range thumb constraints, orientation, aria-label, aria-disabled, tabindex when disabled (lines 310–373).
  - Keyboard: arrow inc/dec, ArrowUp/Down, Home/End, PageUp/Down, clamping, input+change emit, disabled block, range thumb crossover guard (lines 377–500).
  - Pointer: track click moves nearest thumb, snap, change emit on release, range nearest-thumb, disabled block (lines 504–568).
  - Two-way binding: programmatic updates, clamping (lines 572–589).
  - CVA: reactive, template-driven, signal forms (lines 594–687).
- Vitest issues:
  - No `fakeAsync`/`tick`. Uses `vi.spyOn(... getBoundingClientRect)` to mock layout. Uses fake PointerEvent shim for environments without it. Compliant.
- Findings:
  - **No test asserts `aria-required="true"` when `required=true`** — would have caught the template-wiring bug.
  - No test for RTL keyboard inversion (Directionality injection).
  - No test for the value-bubble visibility (`showValue=true`, focus a thumb, assert bubble opacity).
  - No test for vertical orientation (because the feature does not exist).
  - No focus-ring class-string assertions on the thumb (matches the gap in radio.spec).
  - No `Shift+Arrow` test (because the feature does not exist).

## Gaps & lacks
1. **`required` input is declared but never wired to `aria-required`.** P0 functional bug.
2. **Thumb size below WCAG 2.2 target-size minimum at xs/sm/md.** P0 a11y bug.
3. **No vertical orientation support.** `aria-orientation` hardcoded to `'horizontal'`. P1.
4. **No `ErrorStateMatcher` integration.** P1 form-control parity.
5. **No `FormFieldControl` interop.** P1 form-control parity.
6. **Per-color focus rings deviate from canonical primary-500 ring policy.** P1 (or escalate the policy).
7. **No content projection slots for mark labels / value bubbles / leading-trailing glyphs.** P2 enhancement.
8. **`change` emits on every keyboard step (should commit on blur).** P2 semantics fix.
9. **No `Shift+Arrow` fine-step.** P2 nicety.
10. **Mark dots smaller than codified dot scale.** P2 polish.
11. **Bubble uses `text-surface` instead of a hypothetical `on-fg` token.** P2 token cleanup.

## Concrete recommendations (deep-dive prompt body)

### Goal
Fix the two functional bugs (dead `required`, undersized thumb hit area), add vertical orientation, integrate `ErrorStateMatcher` + `FormFieldControl`, align focus-ring colour with policy, and add projection slots for richer customization.

### Tasks
1. **Wire `required` to `aria-required`** — fix the dead input.
   - File(s): `projects/ngx-tw/slider/slider.ts:283-365` (each thumb host attribute block)
   - Why: `required` input exists at line 413 but no binding consumes it. AXE will not flag this, but consumers expecting form validation announcement get nothing.
   - Change: Add `[attr.aria-required]="required() || null"` to each thumb (`#singleThumb`, `#startThumb`, `#endThumb`).
   - Acceptance: Vitest case sets `required=true` and asserts `thumb.getAttribute('aria-required')` equals `'true'`.

2. **Enlarge thumb to meet 24×24 target size** — fix WCAG 2.2 target-size SC.
   - File(s): `projects/ngx-tw/slider/slider.ts:142-172` (`tv` size variants)
   - Why: WCAG 2.2 SC 2.5.8 requires interactive targets ≥24×24 CSS px unless inline. Slider thumbs are interactive — current xs=12px, sm=16px, md=20px fail.
   - Change: Remap thumb sizes to the square-interactive scale: xs=`size-6` (24px), sm=`size-7` (28px), md=`size-8` (32px), lg=`size-9` (36px), xl=`size-10` (40px). Adjust `region` height proportionally. Keep the visual circle smaller via inner `::before`/`::after` if a visual change is undesirable, but the *hit area* must be ≥24px.
   - Acceptance: AXE target-size check passes at every size; visual identity preserved (compare demo).

3. **Add `orientation` input with vertical support** — close the structural gap.
   - File(s): `projects/ngx-tw/slider/slider.ts:283-376` (template), `113-198` (`tv` variants), `727-919` (pointer math)
   - Why: Slider is missing a documented APG axis.
   - Change: Add `orientation = input<'horizontal' | 'vertical'>('horizontal')`. Update `aria-orientation` binding to read it (lines 296, 323, 351). Add `vertical` slot variant flipping the rail to `h-full w-{rail-thickness}` and flipping fill from `width` to `height`. Update keyboard handler so ArrowUp/Down become primary axis in vertical, ArrowLeft/Right secondary (still works). Update `valuePct`/pointer math to compute from `clientY` when vertical. Add tests.
   - Acceptance: `<tw-slider orientation="vertical">` renders vertically, keyboard works, pointer-down on the vertical region updates value; AXE passes.

4. **Integrate `TW_ERROR_STATE_MATCHER`** — form-control parity.
   - File(s): `projects/ngx-tw/slider/slider.ts:390-1018`
   - Why: Library-wide policy. Other production form controls inject the matcher; slider is missing it.
   - Change: Inject `NgControl` + `TW_ERROR_STATE_MATCHER` + optional `NgForm`/`FormGroupDirective`. Expose `errorState: Signal<boolean>` driven by an `effect()` reading the matcher. Bind `[attr.aria-invalid]` on each thumb. Apply an error visual (e.g., `border-error-500` on thumb, `bg-error-50` on rail) via compound variants.
   - Acceptance: Vitest case binds `FormControl<number>(null, Validators.required)`, marks touched, asserts `aria-invalid="true"` on the thumb.

5. **Implement `FormFieldControl`** — form-field interop.
   - File(s): `projects/ngx-tw/slider/slider.ts:390-1018`
   - Why: Consumers should be able to wrap a slider in `<tw-form-field>` for label/hint/error chrome.
   - Change: Implement the abstract; provide `TW_FORM_FIELD_CONTROL` via `forwardRef`. `id` returns the single-thumb id (range mode picks the focused thumb or first); `focused` reads the FocusMonitor signal; `empty` always `false` (slider always has a value); `onContainerClick` focuses the appropriate thumb.
   - Acceptance: A Vitest case wraps `<tw-slider>` inside `<tw-form-field>` and asserts the hint id propagates into `aria-describedby`.

6. **Align focus-ring colour with the canonical policy** — pick a stance.
   - File(s): `projects/ngx-tw/slider/slider.ts:101-110`, `654`
   - Why: Per CLAUDE.md "Focus Rings" the canonical value is `focus-visible:outline-primary-500` regardless of color. Slider currently per-colors the ring.
   - Change: Either (a) drop `FOCUS_RING` and use `focus-visible:outline-primary-500` everywhere; or (b) escalate to the policy maintainer that colored form controls warrant per-color rings, then codify it in CLAUDE.md. Default recommendation: option (a).
   - Acceptance: All variants render with `outline-primary-500`; demo unchanged in behaviour.

7. **Emit `change` only on commit-after-keyboard** — match HTML5 semantics.
   - File(s): `projects/ngx-tw/slider/slider.ts:791-846`
   - Why: Currently `change` fires on every keypress, identical to `input`. HTML5 `<input type="range">` fires `change` only when the user *finishes* (blur or pointer up).
   - Change: In `onThumbKeyDown`, only emit `input` and update value; defer `change` emit to `onThumbBlur` when `keyboardDirty=true`. Pointer release path unchanged.
   - Acceptance: Vitest: dispatch three ArrowRight events without blur → `change` spy called 0 times, `input` spy called 3 times. Dispatch one ArrowRight then blur → `change` spy called once.

8. **Add `Shift+Arrow` fine-step** — APG enhancement.
   - File(s): `projects/ngx-tw/slider/slider.ts:791-836`
   - Why: APG slider pattern recommends a fine-step (smaller than step). Native HTML range supports Shift+Arrow for `step/10`.
   - Change: In `onThumbKeyDown`, when `event.shiftKey`, use `effectiveStep / 10` (clamped to a minimum of `range / 10000` so it does not vanish). Add a corresponding test.
   - Acceptance: Test passes.

9. **Add projection slots** — close customization gap.
   - File(s): `projects/ngx-tw/slider/slider.ts:230-389`
   - Why: Consumers cannot project custom value bubbles, mark labels, or leading/trailing glyphs.
   - Change: Add three structural directives:
     - `*twSliderMarkLabel let-mark let-index="index"` → renders inside each mark-label slot.
     - `*twSliderValueBubble let-value let-formatted="formatted" let-thumb="thumb"` → replaces the default bubble.
     - Named slots `[slot='leading']` / `[slot='trailing']` for inline glyphs around the region.
   - Acceptance: Examples in the demo render a temperature slider with °C suffix bubble and snow/sun icons.

10. **Polish: mark-dot sizes, bubble text token, projection test coverage** — P2 cleanup.
    - File(s): `projects/ngx-tw/slider/slider.ts:146,152,158,164,170,134`
    - Why: Mark dots are below the codified dot scale; bubble uses ambiguous `text-surface`.
    - Change: Remap mark sizes to xs=`size-2`, sm=`size-2.5`, md=`size-3`, lg/xl=`size-3` (top of codified dot scale). If a new `--color-on-fg` token is added to `theme/_semantic.css`, swap `text-surface` → `text-on-fg`.
    - Acceptance: visual identity at large sizes preserved; AXE unchanged.

### Out of scope
- Touch-only haptic feedback (out of library scope).
- A11y APG "edit-spinner" pattern (slider is `role=slider`).
- Animated value transitions on programmatic write (no requirement).

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- slider`
- Visual check: `http://localhost:4600/slider/examples`
- A11y: `npm run e2e:a11y` (target-size + aria-required check)

## Priority
**P0** — Two confirmed bugs (`required` dead input, target-size violation) plus a missing structural axis (vertical) make this the highest-priority component in this batch. Form-field parity is P1; styling/customization polish is P2.
