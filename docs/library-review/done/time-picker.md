# Time-Picker — Production-Grade Review

**Entry point:** `ngx-tw/time-picker`
**Files:** `projects/ngx-tw/time-picker/`

## Snapshot
- Selectors: element `tw-time-picker`.
- Public classes/directives: `TimePickerComponent` (extends `FormFieldControl<D>`).
- Inputs: **20** on `TimePickerComponent` (form-control exception applies).
- Outputs: **2** (`timeInput`, `timeChange`) plus two-way `value: model()`.
- Slots: **0** (no `ng-content`).
- CVA: yes (implements `ControlValueAccessor`).
- `tv()` config: yes; slots used: `root`, `fieldGroup`, `field`, `separator`, `stepperGroup`, `stepper`, `meridiem`, `meridiemButton`, `clearButton` (time-picker.ts:102–119).
- A11y CDK utilities used: `FocusMonitor`, `LiveAnnouncer` (time-picker.ts:29). No overlay/focus-trap (inline component).

## Inputs

| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `idInput` (alias `id`) | `input<string \| undefined>` | `undefined` | yes | |
| `disabledInput` (alias `disabled`) | `input<boolean>` | `false` | yes | **No `booleanAttribute` transform** (unlike date-picker) |
| `requiredInput` (alias `required`) | `input<boolean>` | `false` | yes | same |
| `readonlyInput` (alias `readonly`) | `input<boolean>` | `false` | yes | same |
| `size` | `input<TwSize>` | `'md'` | yes | |
| `color` | `input<TwColor>` | `'primary'` | yes | |
| `variant` | `input<TimePickerVariant \| undefined>` | `undefined` | yes | naked when wrapped |
| `format` | `input<TimePickerFormat>` | `'24h'` | yes | |
| `showSeconds` | `input<boolean>` | `false` | yes | |
| `hourStep` / `minuteStep` / `secondStep` | `input<number>` | `1` | yes | dev-warns on invalid |
| `minTime` / `maxTime` | `input<D \| null>` | `null` | yes | |
| `referenceDate` | `input<D \| null>` | `null` | yes | date portion when value is null |
| `placeholder` | `input<string \| undefined>` | `undefined` | yes | |
| `showSteppers` | `input<boolean>` | `true` | yes | **TRUE-default — not codified** |
| `showClear` | `input<boolean>` | `true` | yes | **TRUE-default — not codified** |
| `clearLabel` | `input<string>` | `'Clear time'` | yes | |
| `errorStateMatcher` | `input<ErrorStateMatcher \| undefined>` | `undefined` | yes | |
| `ariaLabel` / `ariaLabelledby` / `userAriaDescribedByInput` | `input<string \| undefined>` | `undefined` | yes | aliased |
| `value` | `model<D \| null>` | `null` | yes | |

### Findings
1. **Two boolean true-defaults uncodified.** `showSteppers: true` and `showClear: true` need inline JSDoc justification per CLAUDE.md boolean-default rules.
2. **`disabled`/`required`/`readonly` lack `booleanAttribute` transform** (time-picker.ts:399, 402, 405) — contrast with date-picker (date-picker.ts:375–390) which uses `transform: booleanAttribute`. Without it, `[disabled]="''"` (empty-string attribute) does not coerce to `true`. Either align to date-picker or document the difference.
3. **No `step` consolidation** — three step inputs (`hourStep`, `minuteStep`, `secondStep`) are independent. Acceptable since steps are field-specific, but a `timeSteps: { hour?, minute?, second? }` config would also be ergonomic and align with the proposed `timeConfig` pattern.
4. **No `format`-change reset behavior** — when `format` flips 24h↔12h with a value set, the effect at time-picker.ts:702–720 re-renders hour text and the AM/PM toggle. Verify intermediate state (e.g., hour=14 while `format` flips to 12h) shows `02` + `PM`. ✓ that's what the effect does.
5. **No `seconds` `aria-valuemax=59` guard for negative `secondStep`** — input typed `number` accepts any value; dev-warn only catches `< 1` or non-finite (time-picker.ts:737–750). Negative steps would skip `stepWithWrap` math.

## Outputs

| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `timeInput` | `TimePickerInputEvent<D>` (`{ field, rawText, parsed }`) | past tense | every keystroke/step/meridiem |
| `timeChange` | `TimePickerChangeEvent<D>` (`{ value, previousValue, source }`) | past tense | commit |

### Findings
1. **Clean.** `source` is a typed union (`'input' | 'stepper' | 'meridiem' | 'clear' | 'programmatic'`) — clear discriminator.
2. **`timeInput` always emits** before any commit, including from `commitFromFields(source='meridiem')` (time-picker.ts:977–981). Predictable stream.
3. **No `opened`/`closed` outputs** — correct, time-picker is inline.

## Customization surface
- ng-content slots: **none**.
- Structural directives: none.
- Fallback content: n/a.
- Class merging: `twMerge: true` (time-picker.ts:198).
- Findings:
  1. **No projection at all** — even for icons inside the steppers. A consumer wanting custom step glyphs (e.g., chevrons-up/down vs. the current rounded chevrons) cannot. Compared with date-picker's `[slot=trigger-icon]`, this is a gap. Add `select="[slot=stepper-up]"` / `[slot=stepper-down]` slots.
  2. **No projected label slot** between fields — separator is hard-coded `:`. Acceptable for time but limits regional formats (e.g., locales using `.`).

## CSS / Styling
- tailwind-variants: yes; nine slots (root/fieldGroup/field/separator/stepperGroup/stepper/meridiem/meridiemButton/clearButton). Variants: `size` (5-step), `variant` (default/naked), `disabled`, `focused`, `errorState`, `color` (8-way).
- twMerge: yes.
- Semantic tokens vs raw palette:
  - Surface/fg/border: `bg-surface`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-border`, `border-border-strong`, `hover:bg-surface-muted` — canonical.
  - Color variants: `border-{color}-500` (8 colors) in compound variants (time-picker.ts:179–187).
  - **`text-primary-50` on the active meridiem button (time-picker.ts:631)** — this is a raw shade reference where `text-on-primary` should be used. The semantic on-primary token already maps to white (`_semantic.css:148`) and would be the correct token. **Token violation.**
- Surface/fg/border tokens: well-applied.
- Radius compliance: `rounded-md` on fields, steppers, meridiem container + buttons, clear button (time-picker.ts:108, 112, 114, 116, 118) — canonical.
- Spacing/gap compliance: `gap-1`/`gap-1.5`/`gap-2` per size (time-picker.ts:123, 129, 135, 141, 147) + inline padding on default `px-3 py-2` (time-picker.ts:155) — canonical. **Meridiem buttons use `px-1.5 py-0.5` (xs)**, `px-2 py-0.5` (sm), `px-2 py-1` (md), `px-2.5 py-1` (lg), `px-3 py-1.5` (xl) — `py-0.5` is below the canonical inline scale (canonical: `py-1`/`py-1.5`/`py-2`/`py-2.5`/`py-3`). Re-evaluate against the rules table (CLAUDE.md inline padding); `py-0.5` is outside the scale.
- Typography compliance: `text-xs`/`text-sm`/`text-base` scaled per size (time-picker.ts:124, 130, 136, 142, 148). Meridiem buttons use `text-2xs` (xs), `text-xs` (sm/md), `text-sm` (lg/xl) — `text-2xs` for xs is the codified xs-density step for kbd-hint-like content. **Compliant.**
- Focus rings compliance:
  - **Field input has no canonical outline ring.** time-picker.ts:108: `field: 'bg-transparent text-center outline-none border-0 p-0 m-0 text-fg placeholder:text-fg-subtle rounded-md caret-transparent focus-visible:bg-surface-muted'`. The fields use a **background-shift** (`focus-visible:bg-surface-muted`) as the focus indicator. This is the **menu-item carve-out pattern** — but the field role is `spinbutton` (time-picker.ts:236), not menuitem. Per CLAUDE.md: "The menu-item carve-out does NOT extend to other listbox-like roles (`option`, `tab`, `treeitem`)". **Spinbutton is similarly excluded** — this is a focus-ring policy violation.
  - Steppers + meridiem buttons + clear button use the canonical `focus-visible:outline-2 outline-offset-2 outline-primary-500` (time-picker.ts:112, 116, 118).
- Dark mode handling: implicit via surface/fg/border tokens. Meridiem active state `bg-primary-500 text-primary-50` would need a dark override (`dark:` selector) — but since `primary-500` and `primary-50` are theme tokens that themselves remap in dark mode, the explicit override isn't required if the contrast holds.
- Transitions: `transition-[color,border-color,box-shadow] duration-200 motion-reduce:transition-none` on root (time-picker.ts:105); `transition-colors duration-200 motion-reduce:transition-none` on steppers + meridiem buttons. Compliant.
- Shadows: none. (Time-picker has no elevated state.)
- Icon sub-scale:
  - Steppers: `size-3` (xs), `size-3.5` (sm), `size-4` (md), `size-5` (lg/xl) — time-picker.ts:125, 131, 137, 143, 149. **`size-3.5` half-step needs an inline comment.** `size-5` for both `lg` and `xl` is fine but xl could go to `size-6` for proportionality. The chevron SVGs inside use `width="10" height="10"` (time-picker.ts:320–322, 333) — fixed-pixel sizes. Should bind to a class like `size-2.5`/`size-3` for consistency.
  - Clear button: fixed `size-5` (time-picker.ts:118) — same WCAG target concern as date-picker.
- Findings:
  1. **`text-primary-50` violates the semantic token rule** — replace with `text-on-primary` (time-picker.ts:631).
  2. **Spinbutton fields use background-shift focus** — apply the canonical outline ring or document explicitly why spinbuttons follow the menu-item carve-out.
  3. **Meridiem `py-0.5` is below the canonical inline padding scale.**
  4. **Half-step `size-3.5` (sm stepper) needs an inline comment.**
  5. **SVG icon sizing via `width="10" height="10"` (time-picker.ts:320–322, 333)** — hard-coded pixel sizing instead of a Tailwind size class. Switch to a class like `size-2.5` or have the parent button's icon class drive it.
  6. **Clear button target undersized** (`size-5`).
  7. **Stepper button `size-3` at xs** = 12×12 CSS px — far below WCAG AA's 24×24 minimum. Mouse-only users may find it impossible to hit. Bump xs to `size-6` and use `size-2.5` for the icon inside (the codified square-interactive scale starts at `size-6`).

## Accessibility
- ARIA roles/attributes:
  - Each field: `role="spinbutton"` (time-picker.ts:236, 264, 293) — correct for time fields.
  - `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` wired (time-picker.ts:237–240, 265–268, 294–297). **`aria-valuetext` includes meridiem for the hour field in 12h mode** (time-picker.ts:562–568). Good.
  - `aria-invalid`, `aria-disabled` reflected (time-picker.ts:241–242, 269–270, 298–299).
  - **`aria-label`** on each field: hardcoded `'Hours'`, `'Minutes'`, `'Seconds'` (time-picker.ts:235, 263, 292). **Not i18n.** Consumers in non-English locales cannot localize the announce. Use a `TimePickerIntl` service.
  - Field group: `role="group"` + `aria-label` (time-picker.ts:223). Group aria-label defaults to `'Time'` (time-picker.ts:587) — also not i18n.
  - Meridiem container: `role="radiogroup" aria-label="AM or PM"` (time-picker.ts:341) — **hardcoded English**.
  - Meridiem buttons: `aria-pressed` (time-picker.ts:345, 353) but no `role="radio"`. **Spec-wise** — buttons inside a `role="radiogroup"` should have `role="radio"` with `aria-checked`, not `aria-pressed`. AT users may interpret the group inconsistently. Either change to `role="radio"` + `aria-checked`, or drop `role="radiogroup"` and use two pressed toggles.
  - Steppers: `tabindex="-1"` (time-picker.ts:313, 326) — keyboard users use ArrowUp/Down on the field instead. Correct.
  - Clear button: `tabindex="-1"` + `aria-label` from i18n input (time-picker.ts:366–368). Good.
  - Host: `aria-disabled`, `aria-invalid`, `data-variant` (time-picker.ts:384–386). No host role.
- Keyboard support:
  - ArrowUp/Down on field: step (with Shift = ×2) (time-picker.ts:860–867).
  - ArrowLeft at caret-start moves to previous field (time-picker.ts:868–873); ArrowRight at caret-end moves to next field.
  - Home: set to field min; End: set to field max (time-picker.ts:880–889).
  - Delete/Backspace: native (time-picker.ts:890–893).
  - Typing digits: auto-advances when buffer is full or first digit is "terminal" (time-picker.ts:947–956).
  - Meridiem: ArrowUp/ArrowDown/Space/Enter toggles (time-picker.ts:911–917).
- CDK utilities: `FocusMonitor` tracks host (time-picker.ts:753); `LiveAnnouncer` polite announcements on commit (time-picker.ts:1033–1036).
- Live announcement: `'Time cleared'` / `'${formatAnnouncement} selected'` (time-picker.ts:1033–1036). The announcement string includes AM/PM in 12h mode. Polite + correct. **Hardcoded English.**
- AXE risks:
  - `role="radiogroup"` with `aria-pressed` (not `aria-checked`) on its children — likely AXE issue.
  - Hardcoded `'Hours'`/`'Minutes'`/`'Seconds'`/`'AM or PM'`/`'Time'` labels and `'Time cleared'`/`'... selected'` announcements — i18n gap.
- Findings:
  1. **`role="radiogroup"` semantics inconsistent with `aria-pressed`** — either switch buttons to `role="radio" aria-checked` or drop the radiogroup role.
  2. **No `TimePickerIntl` service** — every aria-label string is hardcoded. Consumers in non-English locales must remap manually (and can do so partially via aria-label inputs on the host, but not the inner fields). Mirror `CalendarIntl` with a `TimePickerIntl`.
  3. **Stepper size at xs (12×12 px) below WCAG minimum** — see Styling finding #7.

## Form integration
- CVA implementation: `writeValue` coerces via `adapter.deserialize` + `adapter.isValid` (time-picker.ts:1186–1213). Wires accessor without `NG_VALUE_ACCESSOR` provider (time-picker.ts:669–671).
- ErrorStateMatcher integration: full — per-instance input or DI default (time-picker.ts:652, 490).
- form-field interop: extends `FormFieldControl<D>` and provides `TW_FORM_FIELD_CONTROL`. Implements full interface. Variant auto-naked when wrapped (time-picker.ts:544–546).
- Locale handling: **none**. Time format is locale-agnostic (HH:MM:SS or HH:MM AM). Meridiem labels (`'AM'`/`'PM'`) are hardcoded — in some locales these would be 午前/午後 (Japanese). Use `Intl.DateTimeFormat` to localize the meridiem display.
- Findings:
  1. **No locale support for meridiem labels.** AM/PM hardcoded. A future `TimePickerIntl` would expose `meridiemLabels: { AM: string; PM: string }`.
  2. **`writeValue` with a non-deserializable string sets `internalValue=null` AND `rangeError=true`** (time-picker.ts:1198–1207) — similar to date-picker but with the rangeError flag. Verify the consumer can distinguish "I wrote null" from "I wrote junk".
  3. **No validator integration** — `Validators.required` works via standard reactive forms; no `minTime` / `maxTime` validator is wired. Same gap as date-range-picker.
  4. **`isInRange` does not consider seconds when `showSeconds=false`** but the input value may still carry seconds from the adapter — `timeOfDaySeconds` reads `adapter.getSeconds(v)`, so a value with `:30` seconds would be compared against `minTime`'s `:00`. Acceptable but document — consumers passing `minTime` with non-zero seconds may be surprised when `showSeconds=false`.

## Tests
- Spec file: yes — `time-picker.spec.ts` (13K, **42 it blocks**, 7 describe blocks).
- Coverage breakdown:
  - Rendering: default mount, no seconds by default, seconds when enabled, AM/PM toggle only in 12h, zero-padded display.
  - Inputs/outputs: type-2-digits commits + emits, ArrowUp on minutes + wrap, ArrowDown on hours in 24h, AM/PM flip → ±12, clear → null + `source='clear'`, 24h→12h hour reformat.
  - Range validation: `aria-invalid` outside `[minTime, maxTime]`.
  - Disabled & readonly: disabled blocks stepping, readonly blocks typing.
  - Accessibility: spinbutton role + aria-value attrs, `aria-valuetext` includes AM/PM, host aria-disabled.
  - Forms integration: reactive `writeValue`, reactive type-and-update, `setDisabledState`, template-driven `[(ngModel)]`.
- Vitest issues: zero `fakeAsync`/`tick`. Uses a `typeDigit` helper (time-picker.spec.ts:93) that dispatches `beforeinput` + `input` events — clean.
- Findings:
  1. **No locale tests** — even though time fields don't have locale-bound text, the `AM`/`PM` displayed text is not asserted in non-English contexts.
  2. **No `referenceDate` test** — when `value=null`, typing a time should produce a date using `referenceDate` if set, else `today`. Uncovered.
  3. **No `hourStep`/`minuteStep`/`secondStep` non-1 step test.** Inputs exist; behavior with step=15 (common minute interval) is uncovered.
  4. **No Shift+ArrowUp/Down (× 2 step) test.** Behavior at time-picker.ts:963 (`shift ? 2 : 1`).
  5. **No keyboard tests for caret-boundary navigation** (ArrowLeft at start → previous field).
  6. **No "type a digit that auto-advances" test** — terminal-digit logic is core but uncovered.
  7. **No `showSeconds` toggle round-trip test** — switching `showSeconds` after a value is set should not lose the seconds (effect at time-picker.ts:716–718).
  8. **No `writeValue` with invalid string** test — should set `rangeError=true` + clear fields.
  9. **No signal-forms test.**

## Gaps & lacks
1. **`role="radiogroup"` with `aria-pressed` children** — WAI-ARIA inconsistency.
2. **All aria-labels hardcoded English** — no `TimePickerIntl`.
3. **Meridiem labels (`AM`/`PM`) hardcoded** — locale gap.
4. **`text-primary-50` violates semantic-token rule.**
5. **Spinbutton fields use background-shift focus** (menu-item carve-out misapplied).
6. **Meridiem `py-0.5` below canonical scale.**
7. **Stepper xs target 12×12 below WCAG minimum.**
8. **Clear button target undersized.**
9. **Hard-coded SVG width/height instead of `size-*` classes.**
10. **Half-step `size-3.5` without inline comment.**
11. **No `booleanAttribute` transform on `disabled`/`required`/`readonly`.**
12. **No `showSteppers`/`showClear: true` JSDoc justification.**
13. **No projection (`[slot=stepper-up]`/`stepper-down`).**
14. **No `minTime`/`maxTime` validator integration.**
15. **No tests for `referenceDate`, step sizes, Shift-multiplier, caret-boundary nav, terminal-digit advance, signal-forms, writeValue-invalid.**

## Concrete recommendations (deep-dive prompt body)

### Goal
Fix the WAI-ARIA inconsistency on the meridiem radiogroup, introduce a `TimePickerIntl` service for hardcoded labels (Hours/Minutes/Seconds/Time/AM/PM and the announcements), upgrade the spinbutton focus indicators to the canonical outline ring, replace `text-primary-50` with `text-on-primary`, bump the stepper xs target to meet WCAG, and round out tests for `referenceDate`, step sizes, caret-boundary navigation, and signal-forms.

### Tasks

1. **Replace `text-primary-50` with `text-on-primary` on the active meridiem button.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:631`.
   - Why: Semantic token policy requires `on-{role}` foreground for solid-fill backgrounds. `text-primary-50` is a raw shade reference and won't follow consumer theme remaps.
   - Change: `bg-primary-500 text-on-primary hover:bg-primary-600`.
   - Acceptance: snapshot test of the active button's class string contains `text-on-primary`; no `primary-50`.

2. **Fix radiogroup ARIA inconsistency.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:340-360`.
   - Why: `role="radiogroup"` children should expose `role="radio"` with `aria-checked`, not `aria-pressed`.
   - Change: Two options — (a) preferred: add `[attr.role]="'radio'"` + `[attr.aria-checked]="meridiem() === 'AM'"` (and `'PM'`), drop `aria-pressed`. (b) drop `role="radiogroup"` and keep `aria-pressed` (toggle-button pattern). Use option (a) — it's more discoverable to AT users in screen-reader rotor lists.
   - Acceptance: AXE clean; existing meridiem keyboard tests still pass (ArrowUp/Down/Space/Enter toggle).

3. **Introduce `TimePickerIntl` and replace hardcoded English labels.**
   - File(s): new `projects/ngx-tw/time-picker/time-picker-intl.ts`; usages at time-picker.ts:235, 263, 292, 305, 313, 326, 341, 587 (group label), 957 ('Time cleared'), 959 ('${...} selected').
   - Why: Hardcoded English strings break i18n. Mirrors `CalendarIntl`.
   - Change: `@Injectable()` class with fields: `groupLabel`, `hoursLabel`, `minutesLabel`, `secondsLabel`, `meridiemGroupLabel`, `amLabel`, `pmLabel`, `clearedAnnouncement`, `selectedAnnouncement(text: string)`. Provide via a `provideTimePickerIntl(custom: Partial<TimePickerIntl>): Provider`. Inject in `TimePickerComponent` with optional fallback to new instance.
   - Acceptance: existing tests pass (defaults preserved); add a test that overrides via DI and asserts the new label appears in the DOM.

4. **Apply canonical focus ring to spinbutton fields.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:108`.
   - Why: The current `focus-visible:bg-surface-muted` is the menu-item carve-out, which CLAUDE.md restricts to `menuitem` / `menuitemcheckbox` / `menuitemradio`. Spinbutton is not in the carve-out list.
   - Change: Replace `focus-visible:bg-surface-muted` with `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`. Adjust `rounded-md` for the focus shape if needed.
   - Acceptance: visually distinct field focus that matches calendar cells; tests for focus styling pass.

5. **Bump stepper xs target to `size-6` minimum.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:125, 131, 137, 143, 149`.
   - Why: Current xs `size-3` (12×12 px) is far below WCAG AA 24×24 recommendation.
   - Change: xs `size-6`, sm `size-7`, md `size-7`, lg `size-8`, xl `size-8` (matching the codified square-interactive scale). Update the inner SVG to scale appropriately (use a class instead of `width="10"`).
   - Acceptance: no failing tests; visual review.

6. **Replace SVG `width="10" height="10"` with a Tailwind size class.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:320, 333` (stepper chevrons), `time-picker.ts:371` (clear icon).
   - Why: Pixel-fixed sizing breaks scaling. Half-step usages need inline comments.
   - Change: Apply `class="size-2.5"` (xs) ... `class="size-3"` (others), or compute via a `stepperIcon` slot in the tv config. Add inline comment on any `size-3.5` step.
   - Acceptance: all chevrons scale with the picker size; no fixed pixel widths.

7. **Codify TRUE-defaults: `showSteppers`, `showClear`.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:443-448`.
   - Why: Boolean true-defaults require codified JSDoc justification.
   - Change: Add the same rationale comment as `bordered` / `allowSingleDayRange`: `// TRUE-default: a time-picker without steppers reads as an inert read-only display`.
   - Acceptance: review checklist passes.

8. **Add `booleanAttribute` transform to `disabled`/`required`/`readonly`.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:399, 402, 405`.
   - Why: Parity with date-picker (date-picker.ts:375-390); template `[disabled]` consistently coerces strings.
   - Change: `readonly disabledInput = input<boolean, unknown>(false, { alias: 'disabled', transform: booleanAttribute })` (and the other two).
   - Acceptance: spec adding `disabled=""` to the template results in `aria-disabled="true"`.

9. **Bump clear-button target to `size-6`.** Same change as date-picker.

10. **Add stepper-icon projection.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:309-338`.
   - Why: Currently SVGs are hard-rendered. Consumers using a custom icon set cannot override.
   - Change: Wrap the SVG with `<ng-content select="[slot=stepper-up]">fallback</ng-content>` (and `stepper-down`).
   - Acceptance: a test projecting a custom icon hides the default chevron.

11. **Round out tests: `referenceDate`, step sizes, Shift-multiplier, caret-boundary nav, terminal-digit advance, signal-forms, writeValue-invalid.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.spec.ts`.
   - Why: Coverage gaps listed.
   - Change: Add `describe('referenceDate')`, `describe('step sizes')`, `describe('keyboard caret-boundary')`, `describe('terminal-digit advance')`, `describe('signal forms')`, plus a `writeValue('not-a-date')` test that asserts `rangeError=true` + fields cleared.
   - Acceptance: new branches exercised.

12. **Document `isInRange` seconds behavior when `showSeconds=false`.**
   - File(s): `projects/ngx-tw/time-picker/time-picker.ts:1053-1079`.
   - Why: `minTime`/`maxTime` with non-zero seconds may surprise consumers in 2-field mode.
   - Change: Add a JSDoc remark on `minTime` and `maxTime` inputs.
   - Acceptance: docs gen reflects.

### Out of scope
- Consolidating `hourStep`/`minuteStep`/`secondStep` into a `timeSteps` object (low value; field-specific steps are common).
- Dropping the meridiem in favor of an Intl-derived format (large rewrite).
- A floating-overlay variant of the time-picker (different control altogether).

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/time-picker`
- A11y: AXE on the time-picker route, attention to the radiogroup fix and the focus ring on spinbutton fields.

## Priority
**P1** — Functional core is rock-solid (digit buffering, terminal-advance, ArrowUp/Down stepping, AM/PM mapping via the core `to12h`/`from12h` utilities, ARIA spinbutton model, CVA + ErrorStateMatcher + form-field). Recommendations are correctness (radiogroup ARIA, `text-on-primary`), policy (focus ring on spinbutton, WCAG target on steppers), and i18n (`TimePickerIntl`). The radiogroup fix is the closest thing to a P0 here; everything else can ride along.
