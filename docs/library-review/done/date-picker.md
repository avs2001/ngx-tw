# Date-Picker — Production-Grade Review

**Entry point:** `ngx-tw/date-picker`
**Files:** `projects/ngx-tw/date-picker/`

## Snapshot
- Selectors: element `tw-date-picker`; internal overlay `tw-date-picker-overlay` (not exported).
- Public classes/directives: `DatePickerComponent` (extends `FormFieldControl<D>`); internal `DatePickerOverlayComponent` not in `index.ts`.
- Inputs: **32** on `DatePickerComponent` (overlay + form-control combo — exception applies).
- Outputs: **4** (`opened`, `closed`, `dateInput`, `dateChange`) plus two-way `model()`s (`value`, `open`).
- Slots: **1** (`select="[slot=trigger-icon]"`) — calendar icon override via fallback content.
- CVA: yes (implements `ControlValueAccessor`).
- `tv()` config: yes; slots used: `root`, `input`, `triggerButton`, `triggerIcon`, `clearButton` (date-picker.ts:124–134).
- A11y CDK utilities used: `FocusMonitor`, `FocusTrapFactory`, `LiveAnnouncer`, plus CDK `Overlay` + `ComponentPortal` (date-picker.ts:33–40).

## Inputs

| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `idInput` (alias `id`) | `input<string \| undefined>` | `undefined` | yes | |
| `minDate` / `maxDate` | `input<D \| null>` | `null` | yes | |
| `dateFilter` | `input<TwDateFilter<D> \| null>` | `null` | yes | uses deprecated alias |
| `startView` | `input<TwCalendarView>` | `'day'` | yes | uses deprecated alias |
| `startAt` | `input<D \| null>` | `null` | yes | |
| `format` | `input<unknown>` | `DEFAULT_DISPLAY_FORMAT` | yes | `{ dateTimeFormat: Intl.DateTimeFormatOptions }` |
| `parseFormat` | `input<unknown>` | `undefined` | yes | native adapter ignores |
| `placeholder` | `input<string \| undefined>` | `undefined` | yes | |
| `disabledInput` (alias `disabled`) | `input<boolean, unknown>` | `false` | yes | `booleanAttribute` |
| `requiredInput` (alias `required`) | `input<boolean, unknown>` | `false` | yes | |
| `readonlyInput` (alias `readonly`) | `input<boolean, unknown>` | `false` | yes | |
| `size` | `input<TwSize>` | `'md'` | yes | |
| `color` | `input<TwColor>` | `'primary'` | yes | |
| `variant` | `input<DatePickerVariant \| undefined>` | `undefined` | yes | auto-resolves naked when in form-field |
| `showClear` | `input<boolean>` | `true` | yes | **TRUE-default — NOT in codified list** |
| `showActions` | `input<boolean>` | `false` | yes | Today/Clear/Cancel/Apply |
| `todayLabel`/`clearLabel`/`cancelLabel`/`applyLabel` | `input<string>` | `'Today'`/etc | yes | |
| `openOnFocus` | `input<boolean>` | `false` | yes | |
| `panelClass` | `input<string \| readonly string[]>` | `''` | yes | |
| `scrollStrategy` | `input<'reposition' \| 'close' \| 'block'>` | `'reposition'` | yes | |
| `offset` | `input<number>` | `4` | yes | |
| `triggerAriaLabel` | `input<string>` | `'Open calendar'` | yes | |
| `withTime` | `input<boolean>` | `false` | yes | embeds time-picker |
| `timeFormat` | `input<TimePickerFormat>` | `'24h'` | yes | |
| `showSeconds` | `input<boolean>` | `false` | yes | |
| `hourStep`/`minuteStep`/`secondStep` | `input<number>` | `1` | yes | |
| `minTime` / `maxTime` | `input<D \| null>` | `null` | yes | |
| `errorStateMatcher` | `input<ErrorStateMatcher \| undefined>` | `undefined` | yes | |
| `ariaLabel` / `ariaLabelledby` / `userAriaDescribedByInput` | `input<string \| undefined>` | `undefined` | yes | aliased |
| `value` | `model<D \| null>` | `null` | yes | |
| `open` | `model<boolean>` | `false` | yes | |

### Findings
1. **`showClear` defaults to `true` without inline justification.** Other boolean true-defaults in the library are codified in CLAUDE.md (e.g. `bordered`, `allowSingleDayRange`). Either justify in the JSDoc comment or revert to `false`.
2. **Uses deprecated `TwCalendarView` / `TwDateFilter` aliases** (date-picker.ts:58, 111, 357, 360) — these are explicitly marked `@deprecated` in `ngx-tw/calendar/index.ts:125–132`. Should switch to `CalendarViewState` / `DateFilterFn<D>`.
3. **Time-picker config inputs are duplicated on the date-picker host** (`timeFormat`, `showSeconds`, `hourStep/minuteStep/secondStep`, `minTime/maxTime`) — 6 inputs just to forward to the embedded time-picker (date-picker.ts:438–456). Consider a `timeConfig: input<{ format?, showSeconds?, hourStep?, ... }>()` bundle to halve the input count and keep the surface scannable. Matches the `constraints` pattern in calendar.
4. **`scrollStrategy` is a string-enum** but the overlay accepts a full `ScrollStrategy` factory. No support for `block`-strategy with custom margin or `noop`. Document or extend.
5. **`format` typed as `unknown`** is correct for adapter polymorphism but loses tooling support. Consider a `DateAdapterFormat<D>` helper type that the native adapter narrows to `{ dateTimeFormat: Intl.DateTimeFormatOptions }`.

## Outputs

| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `opened` | `DatePickerOpenedEvent` (`{ trigger }`) | past tense | fires after enter animation |
| `closed` | `DatePickerCloseReason` (union) | past tense | fires after leave animation |
| `dateInput` | `DatePickerInputEvent<D>` (`{ rawText, parsed, target }`) | past tense | every keystroke pre-commit |
| `dateChange` | `DatePickerChangeEvent<D>` (`{ value, previousValue, source }`) | past tense | commit |

### Findings
1. **Solid coverage.** Distinct `dateInput`/`dateChange` follows Material's `mat-datepicker` shape; `DatePickerCloseReason` and `source` discriminators are typed unions, not free strings.
2. **`dateInput` fires with `parsed: null` always** (date-picker.ts:824–829). The JSDoc promises parsed result "if parsing succeeded" — currently the parse only runs on blur. Either parse-and-emit-on-input or correct the JSDoc.
3. **No `viewChange`/`monthChange` propagation** from the embedded calendar. A consumer wiring analytics to "user navigated months in the dropdown" has no hook. Consider re-emitting calendar events.

## Customization surface
- ng-content slots: `select="[slot=trigger-icon]"` with calendar SVG fallback (date-picker.ts:318–334). Single slot, fallback content properly defined.
- Structural directives: none.
- Fallback content: the calendar icon `<svg>` is the fallback — consumer can replace by projecting `<tw-icon slot="trigger-icon">`.
- Class merging: `twMerge: true` (date-picker.ts:217).
- Findings:
  1. **No projection for the trigger label/text** — the date string is rendered into an `<input>` directly. If a consumer wants a button-style trigger (rich label, formatted span), they cannot. Consider a `[trigger]="customTrigger"` template input or `<ng-content select="[slot=trigger]">` that replaces the entire control.
  2. **No projection for presets in the overlay.** A consumer wanting "Today / Yesterday / Tomorrow" inline shortcuts under the calendar has no slot — they must use the date-range-picker (which exposes presets). Add `select="[slot=presets]"` to the overlay panel or accept a `presets` input mirroring `DateRangePicker`.
  3. **No `cellTemplate` / `dateClass` pass-through** to the embedded calendar (date-picker-overlay.ts:46–55). Calendar exposes both inputs; not forwarded. Add `cellTemplate: input<TemplateRef<...>>` + `dateClass: input<DateClassFn<D>>` and forward to the calendar.

## CSS / Styling
- tailwind-variants: yes; slots: `root`/`input`/`triggerButton`/`triggerIcon`/`clearButton` (date-picker.ts:124–134); variants include `size` (xs/sm/md/lg/xl), `variant` (default/naked), `open`, `disabled`, `focused`, `errorState`, `color` (8-way).
- twMerge: yes.
- Semantic tokens vs raw palette:
  - Surface/fg/border: `bg-surface`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-border`, `border-border-strong`, `hover:bg-surface-muted` — all canonical (date-picker.ts:126–172).
  - Color variants: only used in compound variants for `border-{color}-500` (date-picker.ts:196–203) and `border-error-500` for the error state (date-picker.ts:205). No raw `blue-*`/`red-*`.
- Radius compliance: `rounded-md` on root, trigger, clear button — canonical (date-picker.ts:130–133, 170).
- Spacing/gap compliance: `gap-1`/`gap-1.5`/`gap-2` (date-picker.ts:138, 144, 150, 156, 162) + inline padding `px-3 py-2` on default (date-picker.ts:170) — all canonical inline rows.
- Typography compliance: `text-xs` / `text-sm` / `text-base` scaled per size — canonical (date-picker.ts:139–164).
- Focus rings compliance: every interactive button uses `focus-visible:outline-2 outline-offset-2 outline-primary-500` (date-picker.ts:130, 133). Input uses `focus-within:outline-none` for the naked variant (date-picker.ts:172); border color change drives the focused affordance in default. **Correct pattern.**
- Dark mode handling: not explicit — relies on `surface`/`fg`/`border` tokens (which the theme defines for dark). Color-variant borders (`border-primary-500` etc.) do not need dark overrides.
- Transitions: `transition-[color,border-color,box-shadow] duration-200 motion-reduce:transition-none` (date-picker.ts:126) on the root — canonical multi-property; `transition-colors duration-200 motion-reduce:transition-none` on buttons. Compliant.
- Shadows: none on the trigger root. Overlay panel uses `shadow-md` (date-picker-overlay.ts:184) — canonical for floating panel.
- Icon sub-scale:
  - `triggerIcon`: `size-3.5` (xs), `size-4` (sm/md), `size-5` (lg/xl) — date-picker.ts:141, 147, 153, 159, 165. **`size-3.5` is the codified half-step exception for xs-density chevrons.** Acceptable per the rule that allows `size-3.5` for compact triggers. No inline comment though — add one.
  - `triggerButton`: `size-6`/`size-7`/`size-8`/`size-9`/`size-10` — date-picker.ts:140, 146, 152, 158, 164. **`size-10` for xl is one step above the codified square-interactive scale (xs:6/sm:7/md:8/lg:9).** Either drop `size-10` for `xl` (use `size-9`) or extend the documented scale.
  - `clearButton`: fixed `size-5` (date-picker.ts:133) — uses glyph sub-scale; small target. Acceptable for a tabindex=-1 affordance, but borderline accessibility (the WCAG min target is 24×24 CSS px = `size-6`). Consider `size-6` for primary trigger row hits.
  - Inline clear SVG: `class="size-3"` (date-picker.ts:295) — glyph inside a square button, but the button itself is `size-5` so contents are tight. Acceptable.
- Findings:
  1. **`xl` size uses `size-10` for the trigger button**, one step beyond the codified `size-{6..9}` scale. Add `size-10` to the rules table or step down to `size-9`.
  2. **`size-3.5` half-step on the trigger icon needs an inline comment** per the policy ("each use must carry a one-line comment explaining why the half-step is needed").
  3. **`tw-date-picker-panel` panelClass is opaque** — the overlay uses `shadow-md`, `border border-border`, `rounded-lg`, `bg-surface-overlay` (date-picker-overlay.ts:184). Canonical.
  4. **Clear-button target is `size-5` (20×20)** below the WCAG AA 24px minimum interactive target. Bump to `size-6` or larger.

## Accessibility
- ARIA roles/attributes:
  - Input is `role="combobox" aria-haspopup="dialog" aria-expanded` (date-picker.ts:269–272). Material's date-picker uses `role="textbox"` + `aria-haspopup="grid"`; current choice matches Headless UI and modern WCAG combobox pattern. Accept.
  - `aria-autocomplete="none"` — important because the input is free-text but not autocompleted (date-picker.ts:273).
  - `aria-controls`, `aria-label`/`aria-labelledby`/`aria-describedby` wired (date-picker.ts:272–276).
  - `aria-required`, `aria-invalid`, `aria-disabled` reflected (date-picker.ts:277–279).
  - Trigger button is `aria-haspopup="dialog"` + `aria-expanded` + `aria-controls`. Both input and trigger control the same dialog id — correct.
  - Overlay panel: `role="dialog" aria-modal="true" aria-label` (date-picker-overlay.ts:38–39). Correct.
  - Clear button: `tabindex="-1"` + `aria-label="Clear date"` (date-picker.ts:289–293). Removed from tab order on purpose; reachable via mouse.
- Keyboard support:
  - Alt+ArrowDown opens (date-picker.ts:849), Alt+ArrowUp closes and restores (date-picker.ts:855), Enter commits + closes (date-picker.ts:864), Escape closes with restore (date-picker.ts:872), Tab closes without restore (date-picker.ts:877). Trigger keydown: Enter/Space open (date-picker.ts:905).
  - **No `Home`/`End` shortcuts on the input** (Home/End in input is browser default — caret to start/end; acceptable).
- CDK utilities: `FocusMonitor` monitors the host (date-picker.ts:752); `FocusTrapFactory` traps the overlay (date-picker.ts:500, 1113); `LiveAnnouncer` announces commits (date-picker.ts:957–960).
- Live announcement: on commit — `Date cleared` / `${display} selected` (date-picker.ts:957–960). Correctly polite. **No announcement of the focused calendar date in the overlay** — relies on the calendar's own announcements (but the calendar doesn't fire them either, see calendar.md finding #1).
- AXE risks:
  - `aria-required` only fires on the input, not on the trigger button. Acceptable since the input owns the primary label.
  - Combobox pattern with hidden listbox/grid: the dialog is `role="dialog"` not `role="grid"`, and `aria-controls` points to it — slight friction with strict WAI-ARIA combobox pattern (which expects `aria-controls` → `role="listbox"`/`grid`). Current shape matches Material / Reach UI.
- Findings:
  1. **`aria-autocomplete="none"` is correct** — keeps AT from announcing predictions.
  2. **Combobox pattern wraps a dialog** — ARIA 1.2 supports this with `aria-haspopup="dialog"`. Lint clean.
  3. **No focus return path is documented when the user clicks outside.** `closeOverlay('backdrop')` calls `returnFocusTo?.focus()` (date-picker.ts:1030) but `returnFocusTo` may be `null` if neither input nor trigger registered. Add a fallback to `triggerRef.nativeElement.focus()`.
  4. **No `aria-busy` while the overlay is animating.** Not strictly required; current `data-variant` attribute is the only marker.
  5. **Clear-button `aria-label` is hardcoded `'Clear date'` (date-picker.ts:292)** — no i18n. Should be an input or pulled from a `DatePickerIntl` service for consistency with `CalendarIntl`.

## Form integration
- CVA implementation: `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState` (date-picker.ts:1220–1267). `writeValue` coerces via `adapter.deserialize`, validates via `adapter.isValid`, and emits a `programmatic` `dateChange`. Wires accessor without registering `NG_VALUE_ACCESSOR` provider to avoid circular DI (date-picker.ts:675–677).
- ErrorStateMatcher integration: full — `errorStateMatcher` input wins, otherwise `TW_ERROR_STATE_MATCHER` from DI (date-picker.ts:653, 509). Re-runs on focus, ngControl status changes, parent form submits (date-picker.ts:646–658, 774–793).
- form-field interop: extends `FormFieldControl<D>` and provides `TW_FORM_FIELD_CONTROL` via `useExisting` (date-picker.ts:253–258). Implements `id`, `focused`, `empty`, `disabled`, `required`, `errorState`, `controlType: 'date-picker'`, `userAriaDescribedBy`, `setDescribedByIds`, `onContainerClick`. Variant auto-resolves to `'naked'` when wrapped (date-picker.ts:568–570).
- Locale handling: format uses `adapter.format(date, effectiveFormat())` (date-picker.ts:948, 1253). Parse via `adapter.parse(rawText, parseFormat)` (date-picker.ts:928). The native adapter's locale flows from `LOCALE_ID` through the calendar — date-picker does not set adapter locale itself.
- Findings:
  1. **Date-picker does not propagate `locale` input** — if the calendar drives the adapter's locale (calendar.ts:705–708) and the picker overlay creates a calendar without a `locale` input, locale routing works only when the picker's overlay calendar inherits LOCALE_ID. **A consumer who wants a per-instance locale on a standalone date-picker has no input.** Add `locale: input<string | null>(null)` and forward to the embedded calendar.
  2. **Parse error path conflates "unparseable" with "out-of-range"** in `aria-invalid` but consumers cannot distinguish them — both surface as `errorState()` (date-picker.ts:648–658). Two distinct `parseError` / `rangeError` signals exist internally but are not exposed as outputs.
  3. **`writeValue` with a string that doesn't deserialize sets `internalValue=null` silently** (date-picker.ts:1235–1242) — no `dateChange` emission, no error flag. Material's behavior is to set `parseError` and surface the bad input. Decide and document.
  4. **`carryTimeOfDay` (date-picker.ts:1158)** copies time from the current or pending value onto a freshly picked date — correct, but if both are `null`, the time-of-day is whatever the adapter's `today()` returns. Document.

## Tests
- Spec file: yes — `date-picker.spec.ts` (24K, **54 it blocks**, 11 describe blocks).
- Coverage breakdown:
  - Rendering: default mount, each size, each color, `data-variant`, placeholder, `role="combobox"`, `aria-label`, formatted value display.
  - Inputs: `aria-required`, disabled blocks opening.
  - Clear button: hidden/shown, commits null with `source='clear'`, hidden when `showClear=false`.
  - Typed input: `dateInput` every keystroke, parse on blur, `aria-invalid` for bad/out-of-range input, clear-to-null commit, Enter commit.
  - Open/close lifecycle: trigger click, `role="dialog" aria-modal="true"`, `opened` event, Escape restore, backdrop close, Alt+ArrowDown, Enter on trigger.
  - Calendar picking: commit + close.
  - Action bar: no auto-commit when `showActions=true`, Apply commits, Cancel restores.
  - CVA: reactive setValue/disable, template-driven ngModel round-trip.
  - Form-field integration: auto-naked variant, control registration, hint id merging.
  - Dev-mode warning: missing accessible name.
- Vitest issues: zero `fakeAsync`/`tick`. Heavy use of `async`/`await` + `whenStable()`.
- Findings:
  1. **No locale tests.** Setting LOCALE_ID and asserting the formatted display text in a non-English locale is missing.
  2. **No `withTime` tests.** Time-mode wiring (8 inputs + carryTimeOfDay + min/max time) is uncovered. Add tests for: enabling time, picking a date carries existing time, time-out-of-range sets errorState, `minTime`/`maxTime` rejection.
  3. **No DST / leap-year tests.** Same concern as calendar.
  4. **No `openOnFocus` test** — input exists; behavior untested.
  5. **No `parseFormat` test** — input exists; behavior untested.
  6. **No keyboard test for `Tab` close path** — `onInputKeydown` handles it (date-picker.ts:877) but no spec.
  7. **No focus-restore test.** When `closeOverlay('escape', true)` runs, focus should return to `returnFocusTo` — uncovered.
  8. **No signal-forms test.** The CLAUDE.md form-strategy contract requires all three; reactive + template-driven are tested, signal-forms is not.

## Gaps & lacks
1. **Deprecated `TwCalendarView`/`TwDateFilter` imports** still in the source (date-picker.ts:58, 111).
2. **No `locale` input** — the picker cannot override LOCALE_ID per instance.
3. **No projection for trigger label or presets** — only for `[slot=trigger-icon]`.
4. **`cellTemplate` and `dateClass` are not forwarded** to the embedded calendar.
5. **`showClear: true` default not codified** as a TRUE-default exception.
6. **Clear-button target is 20×20** — under WCAG AA's 24×24 recommendation.
7. **`xl` trigger size is `size-10`** — outside the documented square-interactive scale.
8. **`size-3.5` half-step lacks an inline-comment justification.**
9. **Clear `aria-label` is hardcoded** — no i18n.
10. **No tests for locale, time-mode, DST/leap-year, signal-forms, focus-restore.**
11. **Time-picker config duplicated** as 8 separate inputs (`withTime`/`timeFormat`/`showSeconds`/`hourStep`/`minuteStep`/`secondStep`/`minTime`/`maxTime`).

## Concrete recommendations (deep-dive prompt body)

### Goal
Tighten the date-picker into a v1 surface: drop deprecated type aliases, add a `locale` input, expose projection for presets / custom triggers, collapse the time-mode bag into a config object, fix the clear-target sizing, codify the `showClear` true-default, and round out tests for locale, time-mode, signal-forms, and DST.

### Tasks

1. **Replace deprecated `TwCalendarView` / `TwDateFilter` imports.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.ts:58, 111, 357, 360`.
   - Why: Both aliases are `@deprecated` in `ngx-tw/calendar/index.ts:125–132` and are slated for removal post-Phase 10 (which has landed).
   - Change: Import `CalendarViewState` + `DateFilterFn` from `ngx-tw/calendar` and use them as the input types. Drop the `export type { ... }` re-export at line 111.
   - Acceptance: `git grep "TwCalendarView\|TwDateFilter" projects/ngx-tw/date-picker` is empty; build green.

2. **Add a `locale` input and propagate it to the embedded calendar.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.ts:462+` (input), `date-picker.ts:706-734` (effect that pushes config), `date-picker-overlay.ts:107` (signal), `date-picker-overlay.ts:50` (forward to calendar).
   - Why: Today the picker cannot override LOCALE_ID per instance; the only path is provider-scoped DI. Calendar already exposes a `locale` input.
   - Change: `readonly locale = input<string | null>(null)`. In `effect` that pushes config to overlay, set `instance.locale.set(this.locale())`. Add `locale = signal<string | null>(null)` to overlay; forward `[locale]="locale()"` to the `<tw-calendar>`. Also push `this.adapter.setLocale(locale)` for the input/parse path when not null.
   - Acceptance: New spec — set `locale="de-DE"`, assert input display uses German month name.

3. **Forward `cellTemplate` and `dateClass` to the embedded calendar.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.ts:462+`, `date-picker-overlay.ts:46-55`.
   - Why: Two of the calendar's main customization surfaces are silently dropped when accessed via picker.
   - Change: Add inputs (`cellTemplate: input<TemplateRef<...>>`, `dateClass: input<DateClassFn<D>>`), forward them through the overlay signal bag, bind on the inner `<tw-calendar>` element.
   - Acceptance: A spec mounts the picker with a `<ng-template #cell let-c>{{c.displayValue}}*</ng-template>` and asserts the asterisk renders inside a day cell.

4. **Collapse time-mode inputs into a single config object.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.ts:434-456` (8 inputs).
   - Why: 8 inputs just for an optional time-of-day mode is the kind of bloat the input cap is supposed to deter — even with the overlay exception. A `timeConfig` input is one signal that defaults to `null` (off).
   - Change: New type `DatePickerTimeConfig = { format?: TimePickerFormat; showSeconds?: boolean; hourStep?: number; minuteStep?: number; secondStep?: number; minTime?: D | null; maxTime?: D | null }`. Replace the 8 inputs with `readonly timeConfig = input<DatePickerTimeConfig | null>(null)` and a `withTime = computed(() => this.timeConfig() !== null)`. Deprecate old inputs in v1, remove in v2.
   - Acceptance: Existing spec with `[withTime]="true" [timeFormat]="'12h'"` continues to compile (kept for back-compat) but the new `[timeConfig]="{ format: '12h' }"` shape also works. Document both during the deprecation window.

5. **Bump clear-button target to `size-6`.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.ts:133`.
   - Why: WCAG AA recommends a 24×24 CSS px target. Current `size-5` is 20×20.
   - Change: `clearButton: 'inline-flex items-center justify-center shrink-0 rounded-md ... size-6 ...'` (also bump the SVG inside from `size-3` to `size-4` for visual balance).
   - Acceptance: Visual check in demo; no test change required.

6. **Codify `showClear: true` default in JSDoc.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.ts:401-402`.
   - Why: TRUE-defaults are a codified exception requiring inline justification.
   - Change: Add a comment line above the input: `// TRUE-default: a picker without a clear affordance forces consumers to wire one — most form pickers expect the inline clear.`
   - Acceptance: PR review checklist passes.

7. **Add an inline comment on `size-3.5` half-step.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.ts:141`.
   - Why: Policy: "each use must carry a one-line comment explaining why the half-step is needed".
   - Change: Above the `triggerIcon: 'size-3.5'` entry, comment that `size-3` would look pinched against `text-xs` and `size-4` would crowd a 24-px trigger.
   - Acceptance: comment present.

8. **Expose projection for presets + custom trigger.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.ts:259–336` (template), `date-picker-overlay.ts:42–101` (template).
   - Why: Equivalence with the range-picker presets list and parity with Material's `mat-datepicker-toggle` rich label.
   - Change: Add `<ng-content select="[slot=presets]"></ng-content>` inside the overlay above the calendar. Add `<ng-content select="[slot=trigger]"></ng-content>` outside the input — when projected, hide the default input chrome. Document the slot contract.
   - Acceptance: New specs — projecting `[slot=trigger]` hides the input; projecting `[slot=presets]` renders the list.

9. **Round out tests: locale, time-mode, signal-forms, DST, focus-restore.**
   - File(s): `projects/ngx-tw/date-picker/date-picker.spec.ts`.
   - Why: Coverage gaps listed above.
   - Change: Add `describe('locale')`, `describe('time mode')`, `describe('signal forms')`, `describe('focus restore')` blocks. Use Vitest's `vi.useFakeTimers()` for the 150ms close-animation timer (NOT `fakeAsync`); already supported by the runner.
   - Acceptance: `npm test` green; spec count rises; new branches exercise `withTime`, `minTime`/`maxTime` rejection, `'time'` source.

### Out of scope
- Swapping the overlay panel for a fullscreen sheet on mobile (Phase 11+ in calendar plan).
- A `DatePickerIntl` service for clear-button label localization (parallel to `CalendarIntl`). The placeholder for this exists; addressing it is its own task.
- Removing the deprecated time-mode inputs after the migration window (v2 work).

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/date-picker`
- A11y: AXE on the date-picker route, attention to focus-restore on Escape/backdrop and `aria-controls` consistency.

## Priority
**P1** — The date-picker is functionally complete (CVA + ErrorStateMatcher + form-field + overlay + focus trap + live announce + dev-mode warnings) and well-tested for the canonical flow. The recommendations are surface-stability and i18n parity work (locale propagation, deprecated alias cleanup, time-mode config object, projection slots). P0 only if v1 needs the consumer customization parity with `mat-datepicker` (presets/custom trigger).
