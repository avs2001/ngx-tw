# Prompt: Build `tw-date-picker` for ngx-tw

## Context

Before starting, read:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full project conventions (Angular v21 signals, Tailwind v4 semantic + surface/fg/border tokens, `tv()` with `twMerge: true`, no `@angular/animations`, Vitest rules, no `fakeAsync`, Visual Design System).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/error-state-matcher.ts` — `ErrorStateMatcher`, `TW_ERROR_STATE_MATCHER`, `TwFormSubmitted`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/calendar/calendar.ts` — **the calendar the date-picker embeds in its overlay.** Note its inputs (`selectionMode`, `startAt`, `startView`, `minDate`, `maxDate`, `dateFilter`, `dateClass`, `firstDayOfWeek`, `color`, `size`), its `selected` / `activeDate` / `currentView` models, its `userSelection` output (use this — **not** `selected` — to detect user commits), and its `focusActiveCell()` imperative method (call this after the overlay opens).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/calendar/date-adapter.ts` — the abstract `DateAdapter<D>` contract and the `DATE_ADAPTER` injection token. The date-picker **must** inject `DateAdapter<D>` (not import `NativeDateAdapter` directly) so consumers can swap date libraries.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/calendar/native-date-adapter.ts` — the default `Intl`-driven adapter; note the `TwNativeDateFormat` shape (`{ dateTimeFormat?: Intl.DateTimeFormatOptions }`), `parse()`, `deserialize()`, `isValid()`, `format()`, `toIso8601()` — those are the four adapter methods the date-picker uses most.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/form-field/form-field.ts` — `FormFieldControl<T>` abstract class and `TW_FORM_FIELD_CONTROL` injection token. The date-picker **must** extend `FormFieldControl<D>` and provide itself under `TW_FORM_FIELD_CONTROL`, matching how `SelectComponent` does it.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/form-field/form-field.html` — how the form-field reads the control and wires `aria-describedby`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/select/select.ts` — **primary structural reference**. Copy verbatim: provider block (`NG_VALUE_ACCESSOR` + `TW_FORM_FIELD_CONTROL` with `forwardRef`), `FormFieldControl` signal wiring (`id`, `value`, `focused`, `empty`, `disabled`, `required`, `errorState`, `userAriaDescribedBy`, `controlType`, `setDescribedByIds`, `onContainerClick`), `FocusMonitor.monitor(elementRef, true)` lifecycle, `afterNextRender` + `isDevMode()` accessible-name warning, static color lookup records for Tailwind v4 scanning, CVA implementation (`writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState`), and the auto-naked variant detection when wrapped in a form-field.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/select/select-overlay.ts` — how an internal overlay component is driven via signal-backed fields set from the outer component. Date-picker overlay follows the same pattern: an internal `DatePickerOverlayComponent` (not exported) that hosts the `<tw-calendar>` and its optional action bar.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/input/input.ts` — `errorState` derivation pattern using `TW_ERROR_STATE_MATCHER`, `parentForm` / `parentFormGroup`, and `_ngControlRev` / `_formSubmitRev` bump-signals. Date-picker uses the same pattern so it participates in the library-wide error-state policy.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/popover/popover.ts` — overlay lifecycle boilerplate (position strategy builder, `FlexibleConnectedPositionStrategy`, scroll strategies, backdrop, enter/leave with `scale-in`/`fade-in` / `scale-out`/`fade-out`, `ANIMATION_DURATION` leave-timer pattern). `SelectComponent` already applies this verbatim; follow its implementation.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — existing keyframes. `scale-in`/`scale-out`/`fade-in`/`fade-out` are sufficient. **No new keyframes required.**
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/docs/prompts/tw-select.md` and `/Users/ciprianiuga/dev/sandbox/ngx-tw/docs/prompts/tw-input.md` — for prompt-doc format and depth. Mirror their structure.

CDK modules to import:

- `@angular/cdk/overlay` — `Overlay`, `OverlayRef`, `FlexibleConnectedPositionStrategy`, `ConnectedPosition`, `ScrollStrategy`.
- `@angular/cdk/portal` — `ComponentPortal`.
- `@angular/cdk/a11y` — `FocusMonitor` (trigger focus state, descendants-aware), `LiveAnnouncer` (announce committed date), `FocusTrap` / `ConfigurableFocusTrapFactory` (trap focus inside the overlay dialog — a calendar IS a dialog; this is the key difference from `tw-select`).
- `@angular/cdk/keycodes` — `ENTER`, `SPACE`, `ESCAPE`, `DOWN_ARROW`, `UP_ARROW`, `ALT`.

### Standards informing this design

- **WAI-ARIA APG "Date Picker Dialog"** — trigger is `role="button"` (or `role="combobox"` with `aria-autocomplete="none"` when the input is directly editable — see design decisions), `aria-haspopup="dialog"`, `aria-expanded` reflects open state, `aria-controls` points at the dialog; the overlay is `role="dialog"` `aria-modal="true"` containing the grid (`tw-calendar` provides `role="group"` on its grid already — the wrapping dialog gives the popup its modal semantics). Focus is trapped inside the dialog; Escape closes and returns focus to the trigger.
- **Angular Material `mat-datepicker`** — inspired the `DateAdapter` pluggability, `TwNativeDateFormat` `parse` / `display` split, `min` / `max` / `dateFilter` cascading down to the calendar, and the "input + trigger button" composition pattern for form-field usage.
- **Radix UI `DatePicker`** — inspired the two-customization-axes split (type-to-parse the text input **plus** click-to-pick the calendar) and the "confirm / cancel / today" action-bar convention for touch-heavy contexts.
- **Headless UI `Popover`** — confirmed the overlay-as-dialog pattern for picker popups.

## What to build

A standalone `<tw-date-picker>` component that lets users enter a date either by typing into its text input or by picking in a popover calendar. The popover is rendered via `@angular/cdk/overlay` and hosts `<tw-calendar>` (already in the library). The component participates in all three Angular forms strategies (template-driven, reactive, signal-forms) via `ControlValueAccessor`, and integrates with `<tw-form-field>` by implementing `FormFieldControl<D>` and providing itself under `TW_FORM_FIELD_CONTROL`. All date operations go through the injected `DateAdapter<D>` so consumers can swap the underlying date library by calling `provideNativeDateAdapter()` (default) or `provideTwCalendar({ adapter })`.

Typed input is parsed on blur (not on every keystroke — see design decisions) using `DateAdapter.parse()`. A successfully parsed, validly-ranged date commits via the `onChange` CVA callback and `valueChange` model write. An unparseable or out-of-range entry surfaces via the standard `errorState` contract (controlled by `TW_ERROR_STATE_MATCHER`) so the wrapping `<tw-form-field>` renders it as invalid — the date-picker does not throw or clear the input on failure. A trailing calendar-icon button opens the overlay; picking a date in the calendar commits and closes. Escape cancels without changing the value.

The component is generic over `D` (the date type understood by the injected adapter) and defaults to `D = Date` for the common case.

### Design decisions baked in

- **Single `input` element + trigger button, not two separate components.** The date-picker owns its own `<input type="text">` (plus a trailing icon button). This keeps CVA wiring on one element, simplifies form-field integration, and avoids the Material-style `<mat-datepicker>` + `[matDatepicker]` decorator split (over-engineered for our surface). The pattern is closer to Radix UI's `DatePicker`.
- **Text input is the canonical value holder; the calendar is a picker affordance.** Typed input commits on blur/Enter; the calendar commits on click/Enter inside the grid. Both paths funnel through a single `commit()` private method.
- **Parse on blur, not on keystroke.** Partial strings (`"2026-04"`, `"04/21"`) are not yet valid — parsing mid-keystroke produces misleading `errorState` flashes and fights the user. `valueChange` fires on commit only. (Flagged [CONFIRM] below — some design systems prefer live parsing.)
- **Out-of-range and unparseable input both set `errorState`, but differently:** parse failure sets an internal `parseError` signal; out-of-range sets `rangeError`. The `errorState` computed ORs both with the `TW_ERROR_STATE_MATCHER` result, so wrapping form-fields render the red/`aria-invalid` treatment without any extra wiring.
- **Dialog, not listbox.** The overlay is `role="dialog"` `aria-modal="true"`; focus IS trapped inside it (`ConfigurableFocusTrapFactory`). This matches APG and is the key structural difference from `<tw-select>` (whose listbox keeps DOM focus on the trigger). `tw-calendar` already handles roving-tabindex within its grid.
- **`DateAdapter` is the only way dates are formatted, parsed, or compared.** The date-picker never calls `new Date(...)` or `.toISOString()` directly. This keeps the component locale- and library-agnostic.
- **Auto-naked variant when wrapped in `<tw-form-field>`.** Same pattern as `tw-select`: `variant() ?? (formField ? 'naked' : 'default')`. A naked date-picker strips its own border so the form-field wrapper draws the chrome.
- **Optional action bar inside the overlay.** When `showActions` is true the overlay renders a `Today | Clear | Cancel | Apply` row. Default is `false` — most desktop pickers commit on click. On touch, the consumer flips the input.
- **Clear button in the trigger** when the value is non-empty and `!disabled()` — same treatment as `tw-select`.

## API design

### Component identity

- **Selector:** `tw-date-picker` (element selector).
- **Class:** `DatePickerComponent`.
- **Entry point:** `ngx-tw/date-picker`.
- **Generic:** `DatePickerComponent<D = Date>` — the date type understood by the adapter.
- **Change detection:** `ChangeDetectionStrategy.OnPush`.
- **Standalone:** yes (do not set `standalone: true` — it's the Angular v21 default).
- **Providers (on the component metadata):**
  - `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePickerComponent), multi: true }`
  - `{ provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => DatePickerComponent) }`

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `idInput` (alias `'id'`) | `string \| undefined` | auto-generated `tw-date-picker-${n}` | `/** Id on the date-picker's input element. Auto-generated when not provided. Used by the form-field's \`<label for>\` attribute. */` |
| `minDate` | `D \| null` | `null` | `/** Minimum selectable date. Typed input earlier than this sets \`errorState\` and the calendar disables the cell. Defaults to \`null\` (no minimum). */` |
| `maxDate` | `D \| null` | `null` | `/** Maximum selectable date. Typed input later than this sets \`errorState\` and the calendar disables the cell. Defaults to \`null\` (no maximum). */` |
| `dateFilter` | `TwDateFilter<D> \| null` | `null` | `/** Per-date predicate — return \`false\` to disable. Applied in both the calendar (cell disabled) and the text-parse path (sets \`errorState\`). */` |
| `startView` | `TwCalendarView` | `'month'` | `/** Which calendar view opens first — \`'month'\`, \`'year'\`, or \`'multi-year'\`. Defaults to \`'month'\`. */` |
| `startAt` | `D \| null` | `null` | `/** Date to focus when the calendar opens with no selection. Falls back to today. */` |
| `format` | `TwNativeDateFormat \| unknown` | `{ dateTimeFormat: { year: 'numeric', month: 'short', day: 'numeric' } }` | `/** Display format passed straight to \`DateAdapter.format()\`. With the default \`NativeDateAdapter\`, accepts \`{ dateTimeFormat: Intl.DateTimeFormatOptions }\`. Defaults to \`"Apr 21, 2026"\`. */` |
| `parseFormat` | `unknown \| undefined` | `undefined` | `/** Optional format hint passed to \`DateAdapter.parse()\`. The \`NativeDateAdapter\` ignores this and relies on \`new Date(value)\`; custom adapters (Luxon, date-fns) can require a format string. */` |
| `placeholder` | `string \| undefined` | `undefined` | `/** Placeholder text shown in the input when no value is entered. */` |
| `disabledInput` (alias `'disabled'`) | `boolean` | `false` | `/** When true, the input is disabled, the trigger cannot open the calendar, and \`aria-disabled="true"\` is set. Defaults to \`false\`. */` |
| `requiredInput` (alias `'required'`) | `boolean` | `false` | `/** When true, exposes \`aria-required="true"\` on the input. Angular's standard \`Validators.required\` is also honoured. Defaults to \`false\`. */` |
| `readonlyInput` (alias `'readonly'`) | `boolean` | `false` | `/** When true, blocks typing but still allows picking via the calendar trigger. Native \`readonly\` attribute is set on the input. Defaults to \`false\`. */` |
| `size` | `TwSize` | `'md'` | `/** Trigger padding, font size, and calendar cell density. Uses the shared \`TwSize\` scale. Defaults to \`'md'\`. */` |
| `color` | `TwColor` | `'primary'` | `/** Semantic color for focused border, calendar selection ring, and today marker. Defaults to \`'primary'\`. */` |
| `variant` | `DatePickerVariant \| undefined` | `undefined` | `/** Visual style of the trigger. \`'default'\` draws its own border; \`'naked'\` strips chrome so a parent (e.g. \`tw-form-field\`) owns it. When inside a form-field and this is unset, resolves to \`'naked'\`; otherwise \`'default'\`. */` |
| `showClear` | `boolean` | `true` | `/** Whether to show a clear-button affordance inside the trigger when a value is set. Defaults to \`true\`. */` |
| `showActions` | `boolean` | `false` | `/** When true, renders a \`Today / Clear / Cancel / Apply\` action bar at the bottom of the overlay. The calendar commits on click by default — turn this on for touch-heavy contexts where an explicit confirmation step is preferred. Defaults to \`false\`. */` |
| `todayLabel` | `string` | `'Today'` | `/** Label for the \`Today\` action in the overlay's action bar. */` |
| `clearLabel` | `string` | `'Clear'` | `/** Label for the \`Clear\` action in the overlay's action bar. */` |
| `cancelLabel` | `string` | `'Cancel'` | `/** Label for the \`Cancel\` action in the overlay's action bar. */` |
| `applyLabel` | `string` | `'Apply'` | `/** Label for the \`Apply\` action in the overlay's action bar. */` |
| `openOnFocus` | `boolean` | `false` | `/** When true, focusing the text input opens the overlay. Defaults to \`false\` so keyboard users can edit the text without an overlay popping up. */` |
| `panelClass` | `string \| readonly string[]` | `''` | `/** Extra class(es) applied to the overlay panel element. \`twMerge\` resolves conflicts with internal classes. */` |
| `scrollStrategy` | `'reposition' \| 'close' \| 'block'` | `'reposition'` | `/** CDK scroll strategy for the overlay. Defaults to \`'reposition'\`. */` |
| `offset` | `number` | `4` | `/** Pixel distance between trigger and overlay. Defaults to \`4\`. */` |
| `triggerAriaLabel` | `string` | `'Open calendar'` | `/** Accessible name for the calendar trigger button. Defaults to \`'Open calendar'\`. */` |
| `errorStateMatcher` | `ErrorStateMatcher \| undefined` | `undefined` | `/** Per-instance override of the \`ErrorStateMatcher\`. When omitted, uses the injected \`TW_ERROR_STATE_MATCHER\`. */` |
| `ariaLabel` (alias `'aria-label'`) | `string \| undefined` | `undefined` | `/** Accessible name for the input. Required when no visible label is supplied via \`tw-form-field\` or an external \`aria-labelledby\`. */` |
| `ariaLabelledby` (alias `'aria-labelledby'`) | `string \| undefined` | `undefined` | `/** ID of an external element that labels the input. */` |
| `userAriaDescribedByInput` (alias `'aria-describedby'`) | `string \| undefined` | `undefined` | `/** Consumer-supplied \`aria-describedby\` ids. The form-field preserves these when merging hint and error ids. */` |

**Input count:** ~28 inputs. Exceeds the 5-6 guideline, permitted under MEMORY.md's "Overlay input count exception" (same policy applied to `tw-select`, `tw-popover`, `tw-input`). The common case still only needs `[(value)]` and optionally `minDate` / `maxDate`.

### Models (two-way)

| Model | Type | Default | JSDoc |
|---|---|---|---|
| `value` | `D \| null` | `null` | `/** Two-way bound selected date. \`null\` when no selection. Setting programmatically updates the input display and the calendar selection; it does NOT fire \`valueChange\` with \`source: 'user'\`. */` |
| `open` | `boolean` | `false` | `/** Two-way bound open state of the calendar overlay. Setting to \`true\` opens; setting to \`false\` closes. */` |

`valueChange` and `openChange` are auto-generated by `model()` — do NOT redeclare.

### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `opened` | `HTMLElement` (the trigger) | `/** Fires after the overlay's enter animation completes. */` |
| `closed` | `DatePickerCloseReason` | `/** Fires after the overlay's leave animation completes. Payload indicates why it closed — \`'select'\`, \`'apply'\`, \`'cancel'\`, \`'escape'\`, \`'backdrop'\`, \`'programmatic'\`. */` |
| `dateInput` | `DatePickerInputEvent<D>` | `/** Fires on every keystroke in the text input (before parsing). Use for live search / disabling submit buttons while the user is typing. Does NOT mean the value has committed. */` |
| `dateChange` | `DatePickerChangeEvent<D>` | `/** Fires after a commit — either from parsing a valid typed value on blur/Enter, or from selecting a date in the calendar. Includes the new value, the previous value, and a \`source\` discriminator. */` |

### Supporting types

Define in `date-picker.ts`, re-export from `index.ts`:

```ts
/** Visual style of the date-picker trigger. */
export type DatePickerVariant = 'default' | 'naked';

/** Origin of a value change, used to distinguish user input from programmatic writes. */
export type DatePickerChangeSource = 'input' | 'calendar' | 'apply' | 'clear' | 'today' | 'programmatic';

/** Reason the overlay closed. */
export type DatePickerCloseReason = 'select' | 'apply' | 'cancel' | 'escape' | 'backdrop' | 'programmatic';

/** Emitted by `dateInput`. */
export interface DatePickerInputEvent<D> {
  /** The raw string currently in the input (pre-parse). */
  rawText: string;
  /** The parsed value if parsing succeeded and it's in range; otherwise `null`. */
  parsed: D | null;
  /** The input element itself. */
  target: HTMLInputElement;
}

/** Emitted by `dateChange`. */
export interface DatePickerChangeEvent<D> {
  /** The committed value (`null` when cleared). */
  value: D | null;
  /** The value before this change. */
  previousValue: D | null;
  /** What triggered the change. */
  source: DatePickerChangeSource;
}

/** Re-exported from `ngx-tw/calendar` for consumers that import only the date-picker. */
export type { TwCalendarView, TwDateFilter } from 'ngx-tw/calendar';
```

### Content projection

Minimal — the date-picker is a closed unit. Two optional slots for advanced customization:

| Slot | Mechanism | Purpose / Fallback |
|---|---|---|
| Trigger icon | `[slot="trigger-icon"]` on any element | **Fallback:** the default calendar SVG icon (inline, `size-4` / `size-5` per variant). Lets consumers swap in `lucide-angular` or a brand icon. |
| Overlay header | `[slot="overlay-header"]` on any element | No fallback — region renders only when projected. Lets consumers prepend a custom banner above the calendar (e.g., `"Select a delivery date"`). |

No action-bar customization slot — the four buttons are driven by the `*Label` inputs, which is simpler than full templating. If a consumer needs bespoke actions, they disable `showActions` and wire their own affordances outside the component.

## Usage examples

```html
<!-- Simplest: two-way binding, no form-field, default Intl formatting -->
<tw-date-picker [(value)]="birthday" placeholder="MMM DD, YYYY" aria-label="Birthday" />
```

```html
<!-- Reactive forms with validation -->
<tw-form-field>
  <label twLabel>Delivery date</label>
  <tw-date-picker
    formControlName="deliveryDate"
    [minDate]="today"
    [maxDate]="maxDeliveryDate"
  />
  <span twHint>Choose a weekday within the next 30 days.</span>
  <span twError>Please pick a valid weekday.</span>
</tw-form-field>
```

```html
<!-- Template-driven + dateFilter (weekdays only) -->
<tw-date-picker
  [(ngModel)]="appointmentDate"
  [dateFilter]="weekdayFilter"
  [minDate]="today"
  aria-label="Appointment"
/>
```

```html
<!-- Signal-forms (Angular v21 `form()` API — works out of the box via CVA) -->
<tw-date-picker [control]="form.shipDate" />
```

```html
<!-- Action bar enabled for touch contexts -->
<tw-date-picker
  [(value)]="eventDate"
  [showActions]="true"
  color="accent"
  size="lg"
  aria-label="Event date"
/>
```

```html
<!-- Disabled -->
<tw-date-picker [(value)]="lockedDate" [disabled]="true" aria-label="Locked" />
```

```html
<!-- Custom trigger icon -->
<tw-date-picker [(value)]="date" aria-label="Pick a date">
  <tw-icon slot="trigger-icon" name="calendar-range" />
</tw-date-picker>
```

```html
<!-- Custom display format via native adapter -->
<!-- ts: readonly dayMonthYear: TwNativeDateFormat = {
         dateTimeFormat: { day: '2-digit', month: '2-digit', year: 'numeric' }
       }; -->
<tw-date-picker [(value)]="date" [format]="dayMonthYear" aria-label="Date (dd/mm/yyyy)" />
```

## Styling

### `tv()` config — slot-based

Single `tv()` config in `date-picker.ts`. Slots:

```
slots:
  root          — outer block wrapping input + trigger; `relative inline-flex items-center w-full`
  input         — the <input type="text">; bg-transparent, text-fg, placeholder:text-fg-subtle, w-full, outline-none
  triggerButton — the trailing calendar-icon button; inline-flex items-center justify-center, shrink-0, rounded-md
  triggerIcon   — the calendar SVG/ng-content holder; shrink-0, transition-colors duration-200
  clearButton   — optional clear affordance (hidden when empty or disabled); size-5, rounded-md
  panel         — overlay container: bg-surface-overlay, border border-border, rounded-lg, shadow-md, overflow-hidden, flex flex-col
  panelHeader   — slot="overlay-header" wrapper; border-b border-border, p-3
  panelBody     — wraps <tw-calendar>; p-1
  actionBar     — border-t border-border, flex items-center justify-between gap-2, px-3 py-2
  actionGroup   — flex items-center gap-2
```

Variants (mirror `tw-input` + `tw-select`):

```
inFormField:
  true  → root: 'border-0 p-0 shadow-none focus:outline-none focus-visible:outline-none'
  false → root: 'rounded-md border border-border px-4 py-2 text-sm transition-[color,border-color,box-shadow] duration-200 motion-reduce:transition-none hover:border-border-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-500'

size:
  xs → root: 'px-2 py-1 text-xs',       triggerButton: 'size-6',  triggerIcon: 'size-3.5'
  sm → root: 'px-3 py-1.5 text-sm',     triggerButton: 'size-7',  triggerIcon: 'size-4'
  md → root: 'px-4 py-2 text-sm',       triggerButton: 'size-8',  triggerIcon: 'size-4'
  lg → root: 'px-5 py-2.5 text-base',   triggerButton: 'size-9',  triggerIcon: 'size-5'
  xl → root: 'px-6 py-3 text-base',     triggerButton: 'size-10', triggerIcon: 'size-5'

variant:
  default → root: (uses the `inFormField: false` class above — `variant: 'default'` is effectively the standalone style)
  naked   → root: 'bg-transparent border-0 rounded-none p-0 focus-within:outline-none'    // form-field chrome takes over

open:
  true  → triggerButton: 'bg-surface-muted'
  false → triggerButton: ''

disabled:
  true  → root: 'opacity-50 pointer-events-none cursor-not-allowed'
  false → root: ''

errorState:
  true  → root: ''   // handled via compoundVariants below (only applies outside form-field)
  false → root: ''

focused: { true: {}, false: {} }   // drives the color compoundVariants

color: { primary: {}, secondary: {}, accent: {}, neutral: {}, info: {}, success: {}, warning: {}, error: {} }
```

Compound variants (mirror `SelectComponent`'s focused-border compounds, one row per `TwColor`, for the `variant: 'default'` case only):

```
{ variant: 'default', focused: true, color: 'primary',   class: { root: 'border-primary-500' } }
{ variant: 'default', focused: true, color: 'secondary', class: { root: 'border-secondary-500' } }
… accent, info, success, warning, error (static lookup for Tailwind v4 scanning) …
{ variant: 'default', focused: true, color: 'neutral',   class: { root: 'border-border-strong' } }
{ variant: 'default', errorState: true, class: { root: 'border-error-500' } }   // standalone invalid
```

`defaultVariants`:

```
{ size: 'md', variant: 'default', open: false, disabled: false, errorState: false, focused: false, color: 'primary', inFormField: false }
```

`twMerge: true` in the second argument.

### Key structural classes

- **Trigger button hover:** `hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none`.
- **Trigger button focus:** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
- **Clear button:** same pattern as `tw-select`'s clearButton slot.
- **Panel:** `bg-surface-overlay border border-border rounded-lg shadow-md overflow-hidden flex flex-col`. `max-w-[360px]` so large calendar sizes do not break layout.
- **Action bar buttons:** use the existing `<button twButton variant="ghost" size="sm">` component (import `ButtonDirective` from `ngx-tw/button`). Never style bare `<button>` elements.
- **Enter/leave:** `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"` on the panel. Classes exist in `theme/_base.css` — no new keyframes.

### Visual-design-system compliance

- Radius: `rounded-md` on trigger + icon button; `rounded-lg` on panel. Matches CLAUDE.md.
- Spacing: `px-{x} py-{y}` standard inline scale on the root; `size-{n}` grid on the trigger icon button.
- Gap: `gap-2` on the action bar; `gap-1.5` inside the trigger for icon + text if a label ever lands there (not today).
- Shadow: `shadow-md` on panel (floating element).
- Focus ring: default variant uses `focus-within:outline-*-primary-500` on the root (so keyboard focus on either the input or the icon button shows the same ring). The icon button itself uses `focus-visible:outline-*` for its mouse-vs-keyboard distinction.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none`.
- Icons: `size-4` (sm/md) or `size-5` (lg/xl); add `shrink-0`.

## Accessibility

### Roles & attributes — ARIA APG "Date Picker Dialog"

**Input (`<input type="text">` inside the root):**
- `[id]="hostId"` — the id the form-field's `<label for>` points at.
- `[attr.role]="'combobox'"` — input is a combobox-with-dialog-popup variant of the APG pattern (see note below).
- `[attr.aria-haspopup]="'dialog'"`.
- `[attr.aria-expanded]="open() ? 'true' : 'false'"`.
- `[attr.aria-controls]="dialogId"` — points at the overlay's `role="dialog"` wrapper.
- `[attr.aria-autocomplete]="'none'"` — we do not surface suggestions inside the input itself.
- `[attr.aria-label]="ariaLabel() || null"`.
- `[attr.aria-labelledby]="ariaLabelledby() || null"` (form-field label when wrapped).
- `[attr.aria-describedby]="describedByIds() || null"` (from form-field).
- `[attr.aria-required]="required() || null"`.
- `[attr.aria-invalid]="errorState() || null"`.
- `[attr.aria-disabled]="isDisabled() || null"`.
- `[disabled]="isDisabled()"`.
- `[readonly]="readonlyInput() || null"`.

**Trigger button (calendar icon):**
- `type="button"`.
- `[attr.aria-label]="triggerAriaLabel()"`.
- `[attr.aria-haspopup]="'dialog'"`.
- `[attr.aria-expanded]="open() ? 'true' : 'false'"`.
- `[attr.aria-controls]="dialogId"`.
- `[attr.aria-disabled]="isDisabled() || null"`.
- `[disabled]="isDisabled()"`.
- `tabindex="0"`.

**Overlay dialog (`<div role="dialog">` inside the internal overlay component):**
- `role="dialog"`.
- `aria-modal="true"`.
- `[id]="dialogId"`.
- `[attr.aria-label]="dialogAriaLabel()"` — `computed(() => ariaLabel() || 'Choose a date')`.

**Embedded `<tw-calendar>` inside the dialog:**
- Pass `[ariaLabel]="'Calendar'"` so the calendar's grid group has an accessible name distinct from the dialog's.
- Pass `selectionMode="single"`, plus `minDate`, `maxDate`, `dateFilter`, `startView`, `startAt ?? value() ?? today`, `color`, `size`, `firstDayOfWeek: null` (inherit adapter default).

### Keyboard behaviour

| Key | Input focused, closed | Input focused, open | Trigger button focused, closed | Dialog focused |
|---|---|---|---|---|
| typing | edits text | edits text (overlay stays open) | — | forwarded to calendar cells |
| `Enter` | commits the parsed value (or sets `parseError` if invalid) | commits, closes dialog with reason `'select'` | opens dialog | calendar cell selects; close with reason `'select'` |
| `Escape` | no-op | closes dialog with reason `'escape'`, restores previous value, returns focus to input | no-op | closes dialog with reason `'escape'`, returns focus to input |
| `Alt + Down` | opens dialog, moves focus to calendar active cell | — | opens | — |
| `Alt + Up` | — | closes with reason `'cancel'` (no commit) | — | closes |
| `Tab` | natural | `preventDefault` is NOT set — Tab moves out of the input; if focus leaves the dialog, close with reason `'programmatic'` | natural | trapped by focus trap until Escape or commit |
| `Space` | edits text | edits text | opens dialog | calendar cell selects |

**Focus trap:** instantiate a `ConfigurableFocusTrap` when the overlay attaches; destroy on close. The `<tw-calendar>` itself already handles roving-tabindex; the trap's job is only to keep focus inside the dialog if the consumer tabs past the calendar's last cell (or inside the action bar when `showActions` is true).

**Focus return:** on close, always move DOM focus back to the element that was focused when the overlay opened (usually the input; occasionally the trigger button if the user clicked it). Store this in a `lastFocusedElement` signal-or-private-field on open.

### Live announcements

- Inject `LiveAnnouncer`. On a **user-initiated commit** (source: `'input'`, `'calendar'`, `'apply'`, `'today'`, `'clear'`), announce the formatted value politely: `"{{ adapter.format(value, format) }} selected"` or `"Date cleared"` for null. Do not announce programmatic writes or parse errors (screen readers read `aria-invalid` already).

### Dev-mode accessible-name warning

In the constructor, use `afterNextRender` + `isDevMode()` to warn when `ariaLabel()`, `ariaLabelledby()`, and the form-field-wrapper label are all absent. Message:

```
[tw-date-picker] The date-picker has no accessible name. Set aria-label, aria-labelledby, or wrap the component in a <tw-form-field> with a <label twLabel>.
```

### AXE / WCAG

Must pass all AXE checks and meet WCAG AA. Key concerns to verify: contrast of the placeholder text (`text-fg-subtle` on `bg-surface`), contrast of the disabled state (`opacity-50` combined with tokens), focus indicator on both the input and the trigger button, label association across every form strategy.

## Form integration

### `ControlValueAccessor`

Implement on `DatePickerComponent`. Register via `NG_VALUE_ACCESSOR` (see Providers above). Mirror `SelectComponent`'s implementation:

- **`writeValue(value: unknown)`** — normalize via `DateAdapter.deserialize(value)`. When the result is `null`, valid, and in range → store; when invalid (`adapter.invalid()` sentinel) → set `parseError = true` and keep the raw display. Update the public `value` model and the internal `internalValue` linkedSignal. Sync the input's display text using `adapter.format()`. Emit `dateChange` with `source: 'programmatic'`. **Do not** call `onChange`.
- **`registerOnChange(fn: (v: D | null) => void)`** — store on a private field.
- **`registerOnTouched(fn: () => void)`** — store on a private field. Called on input blur (same trigger as the parse/commit step).
- **`setDisabledState(isDisabled: boolean)`** — set a `cvaDisabled` signal; `isDisabled = computed(() => disabledInput() || cvaDisabled())` drives ARIA and the input's `[disabled]` binding.

Mirrors `CalendarComponent`'s adapter usage for `writeValue` — the calendar already does `adapter.deserialize()` the same way; reuse that logic.

### Template-driven, reactive, signal-forms

All three strategies work automatically through the CVA + `model()` combination. No per-strategy code.

### `FormFieldControl<D>` contract

Implement the abstract class from `ngx-tw/form-field`. Provide under `TW_FORM_FIELD_CONTROL` as shown in Providers. Required signals:

- `id = computed(() => hostId)` — stable `tw-date-picker-${n}`.
- `value: Signal<D | null>` — expose `internalValue`.
- `focused: Signal<boolean>` — driven by `FocusMonitor.monitor(elementRef, true)` so descendants (the trigger button + the overlay) all count.
- `empty: Signal<boolean>` — `computed(() => internalValue() === null && !rawInputText())`.
- `disabled: Signal<boolean>` — `isDisabled` computed.
- `required: Signal<boolean>` — `requiredInput()` OR (NgControl's `Validators.required`). Copy the pattern from `InputDirective`.
- `errorState: Signal<boolean>` — combines the default matcher (ngControl invalid + interacted/submitted) with internal `parseError()` and `rangeError()` signals. Copy the pattern from `InputDirective`, then OR in the internal errors.
- `controlType = 'date-picker'` — gives the form-field a `tw-form-field-type-date-picker` class hook.
- `userAriaDescribedBy: Signal<string | undefined>` — echoes `userAriaDescribedByInput()`.
- **`setDescribedByIds(ids: string[])`** — store on a `describedByIdsSignal`, used by the input's `[attr.aria-describedby]`.
- **`onContainerClick(event: MouseEvent)`** — focus the input unless the click is on the trigger button (don't steal focus from a deliberate trigger click).

### Auto-naked detection

```ts
private readonly formField = inject(FormFieldComponent, { optional: true });
readonly resolvedVariant = computed<DatePickerVariant>(
  () => this.variant() ?? (this.formField ? 'naked' : 'default'),
);
```

The `tv()` config keys on `inFormField: !!this.formField` AND `variant: this.resolvedVariant()` so the styling collapses correctly either way.

### Error-state wiring

Copy the pattern from `InputDirective`:

```ts
private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);
private readonly ngControl = inject(NgControl, { optional: true, self: true });
private readonly parentForm = inject(NgForm, { optional: true });
private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
private readonly _ngControlRev = signal(0);
private readonly _formSubmitRev = signal(0);

readonly parseError = signal(false);
readonly rangeError = signal(false);

readonly errorState = computed(() => {
  this._ngControlRev();
  this._formSubmitRev();
  this._focused();
  if (this.parseError() || this.rangeError()) return true;
  const matcher = this.errorStateMatcher() ?? this.defaultMatcher;
  const form: TwFormSubmitted | null =
    (this.parentFormGroup as TwFormSubmitted | null) ??
    (this.parentForm as TwFormSubmitted | null);
  return matcher.isErrorState(this.ngControl?.control ?? null, form);
});
```

Subscribe to `ngControl.control.statusChanges` / `valueChanges` in `ngOnInit` (bump `_ngControlRev`) and to the parent form's `ngSubmit` (bump `_formSubmitRev`). Identical to `InputDirective.ngOnInit`.

## Implementation notes

### State signals

- `value = model<D | null>(null)` — consumer-facing.
- `internalValue = linkedSignal(() => value())` — decouples programmatic writes from user commits so `writeValue` doesn't re-trigger parent effects.
- `open = model(false)`; `closing = signal(false)` (mirror popover's leave-animation sequencing).
- `rawInputText = signal('')` — reflects what's in the input's DOM. Kept in sync via the `(input)` handler.
- `parseError = signal(false)` / `rangeError = signal(false)` — drive `errorState`.
- `lastValueBeforeOpen = signal<D | null>(null)` — captured on open so `Escape` / `Cancel` can restore it.
- `focused = signal(false)` — via `FocusMonitor.monitor(elementRef, true)`.
- `cvaDisabled = signal(false)`.
- `describedByIdsSignal = signal<readonly string[]>([])`.

### Parsing & formatting

- **On `(input)` (every keystroke):** update `rawInputText`; clear `parseError` and `rangeError` (don't flash red mid-typing); emit `dateInput` with `parsed: null` for now (rawText-only).
- **On blur OR Enter:** call `commitFromInput()`:
  1. `const raw = rawInputText().trim();`
  2. `if (!raw) { commit(null, 'input'); return; }` — empty string clears the value.
  3. `const parsed = adapter.parse(raw, parseFormat() ?? undefined);`
  4. If `parsed === null` or `!adapter.isValid(parsed)` → `parseError.set(true)`; leave the raw text in the input; do NOT emit `dateChange`; do NOT call `onChange`.
  5. If in range (`minDate`/`maxDate`/`dateFilter`) → `commit(parsed, 'input')`.
  6. Otherwise → `rangeError.set(true)`; same "leave text, no emit" behavior.
- **`commit(v: D | null, source: DatePickerChangeSource)`:**
  1. `const previous = internalValue();`
  2. `internalValue.set(v); value.set(v);`
  3. `parseError.set(false); rangeError.set(false);`
  4. Update `rawInputText` and the DOM input's `.value` using `v === null ? '' : adapter.format(v, format())`.
  5. If `source !== 'programmatic'` → `onChange(v); onTouched(); liveAnnouncer.announce(...)`.
  6. `dateChange.emit({ value: v, previousValue: previous, source });`
- **Calendar `userSelection` handler:** `onCalendarUserSelection(ev)` → `commit(ev.value as D, 'calendar')`; if `!showActions()` → `closeOverlay('select')`. When `showActions()` is true, the calendar's user selection only updates a pending value signal; commit happens on `Apply`.

Range validation helper: `isInRange(d: D): boolean` — `min` → `adapter.compareDate(d, min) >= 0`; `max` → `adapter.compareDate(d, max) <= 0`; `dateFilter` → `!!dateFilter()(d)`. Cover all three with short-circuit returns.

### Overlay lifecycle

Reuse the **select pattern verbatim** with these specifics:

- **Position strategy:** `FlexibleConnectedPositionStrategy` with four positions: `bottom-start`, `bottom-end`, `top-start`, `top-end`. `withFlexibleDimensions(false)` (calendar has a fixed pixel width per size variant), `withPush(false)`, `withViewportMargin(8)`.
- **Width:** calendar picks its own width via the `size` variant on `<tw-calendar>`. Do NOT set `panelWidth`. Overlay width is `auto`.
- **Scroll strategy:** switch on `scrollStrategy()` input (`reposition` / `close` / `block`).
- **Backdrop:** `hasBackdrop: true`, `backdropClass: 'cdk-overlay-transparent-backdrop'`. Backdrop click → `closeOverlay('backdrop')`.
- **Escape key:** subscribe to `overlayRef.keydownEvents()` and close with `'escape'` (restoring `lastValueBeforeOpen`).
- **Enter/leave:** `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"` on the panel. `ANIMATION_DURATION = 150`. Defer `overlayRef.detach()` by that duration after flipping `closing = true`.
- **Focus trap:** `ConfigurableFocusTrapFactory.create(overlayElement)`; destroy in the detach-timer callback.
- **Internal overlay component:** `DatePickerOverlayComponent` (private, not exported), selector `tw-date-picker-overlay`, attached via `ComponentPortal`. It hosts `<tw-calendar>` and, when `showActions` is true, the four-button action bar. Receives config through `signal()`-backed fields set from the outer component after `overlayRef.attach()`. Mirrors `SelectOverlayComponent`.

### Action bar behaviour

When `showActions()` is true, the overlay renders:

```
<div class="actionBar">
  <div class="actionGroup">
    <button twButton variant="ghost" size="sm" (click)="onToday()">{{ todayLabel() }}</button>
    @if (!isEmpty()) {
      <button twButton variant="ghost" size="sm" (click)="onClear()">{{ clearLabel() }}</button>
    }
  </div>
  <div class="actionGroup">
    <button twButton variant="ghost" size="sm" (click)="onCancel()">{{ cancelLabel() }}</button>
    <button twButton variant="solid" size="sm" (click)="onApply()">{{ applyLabel() }}</button>
  </div>
</div>
```

- `Today` → set calendar's `activeDate` to `adapter.today()`; do NOT commit yet (user must still click a cell or press Apply).
- `Clear` → set a pending null; commit via `onApply` OR commit immediately (flagged as [CONFIRM]).
- `Cancel` → restore `lastValueBeforeOpen`, close with reason `'cancel'`.
- `Apply` → commit the pending value, close with reason `'apply'`.

When `showActions()` is false, a calendar click commits immediately and closes with reason `'select'` (the APG-preferred flow for desktop).

### Refs & injection

```ts
private readonly adapter = inject<DateAdapter<D>>(DATE_ADAPTER);
private readonly overlayService = inject(Overlay);
private readonly focusMonitor = inject(FocusMonitor);
private readonly liveAnnouncer = inject(LiveAnnouncer);
private readonly focusTrapFactory = inject(ConfigurableFocusTrapFactory);
private readonly elementRef = inject(ElementRef<HTMLElement>);
private readonly viewContainerRef = inject(ViewContainerRef);
private readonly injector = inject(Injector);
private readonly destroyRef = inject(DestroyRef);
private readonly formField = inject(FormFieldComponent, { optional: true });
private readonly ngControl = inject(NgControl, { optional: true, self: true });
private readonly parentForm = inject(NgForm, { optional: true });
private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);

private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('dateInput');
private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('triggerBtn');
```

### ID generation

```ts
let nextDatePickerId = 0;
readonly hostId = `tw-date-picker-${nextDatePickerId++}`;
readonly dialogId = `${this.hostId}-dialog`;
```

### Template structure

Main component template (~30-40 lines), inline:

```
<input
  #dateInput
  type="text"
  [id]="hostId"
  [class]="inputClasses()"
  [value]="rawInputText()"
  [placeholder]="placeholder() || ''"
  [disabled]="isDisabled()"
  [readonly]="readonlyInput()"
  [attr.role]="'combobox'"
  [attr.aria-haspopup]="'dialog'"
  [attr.aria-expanded]="open() ? 'true' : 'false'"
  [attr.aria-controls]="dialogId"
  [attr.aria-autocomplete]="'none'"
  [attr.aria-label]="ariaLabel() || null"
  [attr.aria-labelledby]="ariaLabelledby() || null"
  [attr.aria-describedby]="describedBy() || null"
  [attr.aria-required]="required() || null"
  [attr.aria-invalid]="errorState() || null"
  [attr.aria-disabled]="isDisabled() || null"
  (input)="onInputEvent($event)"
  (blur)="onInputBlur()"
  (keydown)="onInputKeydown($event)"
  (focus)="onInputFocus()"
/>

@if (showClear() && !isEmpty() && !isDisabled()) {
  <button
    type="button"
    tabindex="-1"
    [class]="clearButtonClasses()"
    [attr.aria-label]="'Clear date'"
    (click)="onClearClick($event)"
  >
    <!-- inline X SVG (copy from tw-select) -->
  </button>
}

<button
  #triggerBtn
  type="button"
  [class]="triggerButtonClasses()"
  [attr.aria-label]="triggerAriaLabel()"
  [attr.aria-haspopup]="'dialog'"
  [attr.aria-expanded]="open() ? 'true' : 'false'"
  [attr.aria-controls]="dialogId"
  [attr.aria-disabled]="isDisabled() || null"
  [disabled]="isDisabled()"
  (click)="onTriggerClick()"
  (keydown)="onTriggerKeydown($event)"
>
  <ng-content select="[slot=trigger-icon]">
    <!-- fallback calendar SVG, sized via triggerIconClasses() -->
  </ng-content>
</button>
```

Host keeps `[class]="rootClasses()"`.

Overlay component template (~25 lines, inline — split to `date-picker-overlay.html` only if it crosses ~50):

```
<div
  role="dialog"
  aria-modal="true"
  [id]="dialogId()"
  [attr.aria-label]="dialogAriaLabel()"
  [class]="panelClasses()"
  animate.enter="scale-in fade-in"
  [animate.leave]="leaving() ? 'scale-out fade-out' : ''"
>
  @if (hasOverlayHeader()) {
    <div class="panelHeader">
      <ng-content select="[slot=overlay-header]" />
    </div>
  }

  <div class="panelBody">
    <tw-calendar
      selectionMode="single"
      [selected]="pendingValue()"
      [startAt]="startAt() ?? pendingValue() ?? null"
      [startView]="startView()"
      [minDate]="minDate()"
      [maxDate]="maxDate()"
      [dateFilter]="dateFilter()"
      [color]="color()"
      [size]="size()"
      [ariaLabel]="'Calendar'"
      (userSelection)="onCalendarSelection($event)"
    />
  </div>

  @if (showActions()) {
    <!-- action bar — see Action bar behaviour section -->
  }
</div>
```

Projected content for the `[slot="overlay-header"]` slot lives in the OUTER component's DOM and must be forwarded to the overlay through a `signal<TemplateRef>` OR by using a `<ng-content>` with a `slot` selector on the overlay component (preferred — matches how `SelectOverlayComponent` handles header/footer via signal-forwarded `TemplateRef` from the outer component's `contentChild(SelectHeaderTemplateDirective)`). Use the `TemplateRef` pattern — same as select — because the overlay is detached into the CDK portal outlet and does not share the outer component's DOM.

### Constraints during implementation

- No arrow functions in templates. Define helper methods (`onInputEvent`, `onTriggerClick`, …).
- No `ngClass` / `ngStyle`. Use `[class]` / `[style.*]`.
- No `@HostBinding` / `@HostListener` — `host:` object only.
- No `fakeAsync` / `tick` — Vitest. Use `async/await` + `fixture.whenStable()` and `vi.useFakeTimers()` / `vi.runAllTimers()` for the 150 ms close-animation timer.
- Never import `@angular/animations`.
- All class strings must be statically present (static `Record<TwColor, string>` lookups); no template-literal concatenation.
- Never call `new Date(...)` or `.toISOString()` in the component — always go through the injected `DateAdapter`.

## File structure

Under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/date-picker/`:

- **`date-picker.ts`** — `DatePickerComponent<D>`, all public types (`DatePickerVariant`, `DatePickerChangeSource`, `DatePickerCloseReason`, `DatePickerInputEvent`, `DatePickerChangeEvent`). `tv()` config. Static `OPTION_*`-style color lookups (focus-border, trigger-hover). Module-scoped `nextDatePickerId` counter. Overlay helpers (`buildPositions`, `resolveScrollStrategy`).
- **`date-picker-overlay.ts`** — private `DatePickerOverlayComponent` (not exported from `index.ts`). Contains the dialog template (calendar + optional action bar + optional header projection). Receives config via signal-backed fields set from the outer component. Mirrors `SelectOverlayComponent`.
- **`date-picker-overlay.html`** — extract only if the overlay template grows past ~50 lines.
- **`date-picker.spec.ts`** — Vitest tests (see Testing plan below). Must cover: default render, each `size` and `color`, disabled render, all CVA paths (template-driven, reactive, signal-forms), form-field integration, overlay open/close, keyboard, parse success/failure, range validation, `dateInput` vs `dateChange`, clear button, action bar, ARIA attributes, focus trap, focus return, dev-mode accessible-name warning. No `fakeAsync` — use `async/await` + `fixture.whenStable()` and `vi.useFakeTimers()` for the 150 ms animation.
- **`index.ts`** — public API exports (see below).
- **`ng-package.json`** — `{ "lib": { "entryFile": "index.ts" } }`.

Update:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/date-picker';`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/angular.json` — verify ng-packagr auto-discovers the new `ng-package.json`; most v21 setups do.
- **No theme file edits.** `scale-in`/`scale-out`/`fade-in`/`fade-out` already exist in `projects/ngx-tw/theme/_base.css`.

## Public API exports

```ts
// projects/ngx-tw/date-picker/index.ts
export { DatePickerComponent } from './date-picker';
export type {
  DatePickerVariant,
  DatePickerChangeSource,
  DatePickerCloseReason,
  DatePickerInputEvent,
  DatePickerChangeEvent,
} from './date-picker';
```

`DatePickerOverlayComponent` is **not** exported — internal overlay host only.

## Testing plan

File: `date-picker.spec.ts`. Use explicit Vitest imports (`import { describe, it, expect, vi, beforeEach } from 'vitest'`) and `ComponentFixture` / `TestBed` from Angular. Import `OverlayModule` and call `provideNativeDateAdapter()` in each test bed. Use `vi.spyOn()` for method spies; `vi.useFakeTimers()` for the 150 ms close-animation timer; `await fixture.whenStable()` for async `ngModel` paths. No `fakeAsync`/`tick`.

Define small test hosts: `BasicDatePickerHost`, `ReactiveFormsDatePickerHost`, `TemplateDrivenDatePickerHost`, `FormFieldWrappedDatePickerHost`, `ActionBarDatePickerHost`, `RangeConstrainedDatePickerHost`.

### What to cover

**Rendering**
- Default render mounts without errors with no inputs.
- Each `size` (`xs`–`xl`) renders without errors.
- Each `color` renders without errors.
- `variant="default"` and `variant="naked"` render distinctly (the naked variant strips the root's border utility; assert via host element `classList` using a `data-variant` attribute that the component should expose for testability).
- Placeholder is shown when value is null.
- Wrapped in `<tw-form-field>` without explicit `variant`: auto-naked.

**Typed input**
- Typing a valid date and blurring: input's `.value` is reformatted via `adapter.format`; `dateChange` fires with `source: 'input'`; `onChange` is called.
- Typing gibberish and blurring: `parseError` is true; input retains the raw text; `dateChange` does NOT fire; `aria-invalid="true"`; wrapping form-field shows its invalid styling.
- Typing a date earlier than `minDate`: `rangeError` is true; same no-emit behaviour.
- Typing a date later than `maxDate`: same.
- Typing a date rejected by `dateFilter`: same.
- Typing an empty string and blurring: commits `null` with `source: 'input'`.
- `(input)` fires `dateInput` on every keystroke with the correct `rawText`.
- Pressing Enter commits the same way as blurring.

**Calendar picking**
- Clicking the trigger opens the overlay; `opened` fires once the enter animation advances (use `vi.runAllTimers()`).
- Picking a date in the calendar fires `dateChange` with `source: 'calendar'`, closes the overlay with reason `'select'`, and updates the input's display text.
- When `showActions=true`, clicking a calendar date updates a pending value but does NOT commit; `Apply` commits and closes with reason `'apply'`; `Cancel` restores the previous value and closes with reason `'cancel'`.
- `Today` button sets the calendar's focus to today (does not commit on its own).
- `Clear` button commits `null` (behavior pending [CONFIRM]).
- Backdrop click closes with reason `'backdrop'` and does NOT change the value.

**CVA**
- Reactive forms: `FormControl.setValue(date)` updates the input display; `FormControl.disable()` applies disabled styling and blocks interaction.
- Template-driven: `[(ngModel)]` round-trip works after `await fixture.whenStable()`.
- Signal forms: a `control={...}` binding to a `form()` signal-form control commits on user input.
- `writeValue(null)` clears the display and fires `dateChange` with `source: 'programmatic'`.
- `writeValue(invalidValue)` (e.g., `'not-a-date'`) surfaces `parseError: true`.
- `setDisabledState(true)` sets `isDisabled()` and `aria-disabled="true"`.

**Outputs**
- `opened` fires after the enter animation completes.
- `closed` fires with the correct `reason` for each close path.
- `dateInput` fires on every keystroke.
- `dateChange` fires exactly once per commit; `added`/`removed`/`previousValue`/`source` are correct.

**Keyboard**
- Input focused + `Enter`: commits.
- Input focused + `Escape`: no-op (overlay is closed).
- Input focused + `Alt+Down`: opens overlay, focus moves to calendar.
- Overlay open + `Escape`: closes with `'escape'`, restores `lastValueBeforeOpen`, focus returns to input.
- Overlay open + `Tab`: focus trap keeps focus inside until last focusable; leaving via Shift+Tab from the calendar returns focus to the input and closes.
- Trigger focused + `Enter`: opens.

**Accessibility**
- Input: `role="combobox"`, `aria-haspopup="dialog"`, `aria-expanded` reflects `open`, `aria-controls` matches the dialog id.
- Dialog: `role="dialog"`, `aria-modal="true"`, `aria-label` is set.
- `aria-invalid="true"` appears on error states.
- Dev-mode warning is logged when no accessible name is provided (spy on `console.warn`).
- `FocusMonitor.monitor` / `stopMonitoring` are called.
- LiveAnnouncer is called on user commits (but not on programmatic writes).

**Form-field integration**
- When wrapped, `contentChild(TW_FORM_FIELD_CONTROL)` on the parent resolves to the date-picker.
- `control.focused()` is true when either the input, the trigger, or the overlay has focus.
- `control.empty()` is true when value is null AND input is empty; false when value is set OR input has text.
- `control.errorState()` is true when the matcher says so OR when `parseError`/`rangeError` is true.
- `setDescribedByIds(['x', 'y'])` updates the input's `aria-describedby` to `"x y"`.
- `onContainerClick` focuses the input (not the trigger).

**Overlay lifecycle**
- Opening attaches; closing detaches after the 150 ms delay (advance with `vi.runAllTimers()`).
- Focus trap is created on attach, destroyed on detach (spy on `ConfigurableFocusTrapFactory.create` and the returned trap's `destroy`).
- Destroying the component while open disposes the overlay cleanly.

**Adapter swap**
- A minimal stub adapter (records `parse`/`format` calls) proves all date operations go through the adapter. No direct `new Date(...)` calls in the component source.

## Constraints

- Standalone component; do NOT set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush` on component, overlay component, and every directive.
- Signal APIs only: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`, `signal()`, `contentChild()`, `viewChild.required()`, `effect()`. No `mutate`. RxJS only for CDK-returned observables (`overlayRef.backdropClick()`, `overlayRef.keydownEvents()`, `ngControl.control.statusChanges`, `parentForm.ngSubmit`) — must use `takeUntilDestroyed`.
- `inject()` for DI — no constructor injection.
- `host:` object only — never `@HostBinding`/`@HostListener`.
- Native control flow (`@if`, `@for`, `@switch`); no `ngClass`/`ngStyle`; no arrow functions in templates.
- Tailwind utilities only, no CSS files. Semantic tokens (`primary-*`, `info-*`, …), surface/fg/border tokens for neutral structural styling. Never raw palette colors. Never raw `neutral-*` for structural styling.
- `tv()` includes `defaultVariants` and passes `{ twMerge: true }` as the second argument.
- All class strings statically present in source — static `Record<TwColor, string>` lookup tables, not template-literal concatenation.
- Visual tokens (radius `rounded-md` on trigger + icon button / `rounded-lg` on panel, shadow `shadow-md`, transitions `duration-200 motion-reduce:transition-none`, focus ring `outline-2 outline-offset-2 outline-primary-500`, spacing from the standard inline padding scale, icon sizes `size-4`/`size-5`) match CLAUDE.md's Visual Design System exactly. No invented values.
- No `@angular/animations`. Overlay enter/leave uses `animate.enter="scale-in fade-in"` / `animate.leave="scale-out fade-out"` with existing keyframes in `projects/ngx-tw/theme/_base.css`.
- Every `input()`, `output()`, `model()`, exported type member, and public method has a one-line JSDoc.
- Strict typing — no `any`. Generic `D` propagates through value, model, events, and calendar composition.
- CVA on the component itself. Form-field integration via `TW_FORM_FIELD_CONTROL` token; auto-naked detection when a `FormFieldComponent` is injectable as an ancestor. Error state derived via `TW_ERROR_STATE_MATCHER` plus internal `parseError` / `rangeError`.
- All date operations through the injected `DateAdapter<D>`. No `new Date(...)`, no `.toISOString()`, no date-library imports.
- Vitest: `vi.spyOn()`, `async/await`, `fixture.whenStable()`, `vi.useFakeTimers()`. No `fakeAsync`/`tick`.
- Keyboard behaviour matches WAI-ARIA APG "Date Picker Dialog".
