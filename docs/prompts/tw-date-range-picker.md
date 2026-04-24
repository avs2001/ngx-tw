# Prompt: Build `tw-date-range-picker` for ngx-tw

## Context

Before starting, read:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full project conventions (Angular v21 signals, Tailwind v4 semantic + surface/fg/border tokens, `tv()` with `twMerge: true`, no `@angular/animations`, Vitest rules, no `fakeAsync`, Visual Design System).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/error-state-matcher.ts` — `ErrorStateMatcher`, `TW_ERROR_STATE_MATCHER`, `TwFormSubmitted`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/time-utils.ts` — `TimePickerFormat`, `timeOfDaySeconds`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/calendar/calendar.ts` — **the calendar this component embeds in its overlay.** Note that `tw-calendar` already supports `selectionMode="range"` natively: its `selected` model accepts a `TwDateRange<D>`, it maintains a `previewStart`/`previewEnd` hover state during the two-click flow, and its `userSelection` output emits `TwCalendarUserSelection<D>` whose `value` is a `TwDateRange<D>` once committed. Use `selectionMode="range"`, `selected`, and `userSelection`. Do NOT lift range state up or use two independent calendars — the calendar owns the range-selection logic.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/calendar/date-range.ts` — `TwDateRange<D>`, `TwDateRangeInput<D>`, `TwDateRangeSelectionStrategy<D>`, `DefaultDateRangeSelectionStrategy`, `TW_DATE_RANGE_SELECTION_STRATEGY`, `TwCalendarUserSelection<D>`. The range type used by the calendar and by this picker's value surface. **Reuse `TwDateRange<D>` verbatim** — do not invent a parallel `DateRange` type.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/calendar/date-adapter.ts` — abstract `DateAdapter<D>` contract and `DATE_ADAPTER` token. All date operations (compare, clamp, format, parse, withTime, today, addCalendarMonths) go through the injected adapter. Never call `new Date(...)` or `.toISOString()` in the component source.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/calendar/native-date-adapter.ts` — default adapter shipped via `provideNativeDateAdapter()`; `TwNativeDateFormat` shape (`{ dateTimeFormat?: Intl.DateTimeFormatOptions }`).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/date-picker/date-picker.ts` — **primary structural reference.** The range picker is the two-date sibling of `tw-date-picker`; copy verbatim: provider block (`NG_VALUE_ACCESSOR` + `TW_FORM_FIELD_CONTROL` with `forwardRef`), `FormFieldControl<TwDateRange<D>>` signal wiring (`id`, `value`, `focused`, `empty`, `disabled`, `required`, `errorState`, `userAriaDescribedBy`, `controlType`, `setDescribedByIds`, `onContainerClick`), `FocusMonitor.monitor(elementRef, true)` lifecycle, `afterNextRender` + `isDevMode()` accessible-name warning, auto-naked variant detection (`variant() ?? (formField ? 'naked' : 'default')`), error-state matcher wiring (`parseError` + `rangeError` signals ORed with the injected `TW_ERROR_STATE_MATCHER`), `_ngControlRev` / `_formSubmitRev` bump signals, the ID counter pattern, the `ANIMATION_DURATION = 150` leave timer. Every behaviour here is proven in `tw-date-picker` — mirror it, substituting a two-date value for the single date.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/date-picker/date-picker-overlay.ts` — overlay component pattern: internal, non-exported overlay host configured via signal-backed fields set from the outer component, attached via `ComponentPortal`. The range picker's overlay is structurally identical but hosts either one or two `<tw-calendar>` instances (see "Two-calendar composition" below) and two `<tw-time-picker>` instances when `showTime` is true.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/time-picker/time-picker.ts` — `TimePickerComponent`, `TimePickerChangeEvent<D>`, `TimePickerChangeSource`, `TimePickerFormat`. Embedded twice when `showTime` is true (one bound to `pendingRange.start`, one to `pendingRange.end`).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/form-field/form-field.ts` — `FormFieldControl<T>` abstract class and `TW_FORM_FIELD_CONTROL` token. The range picker extends `FormFieldControl<TwDateRange<D>>` and provides itself under `TW_FORM_FIELD_CONTROL`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/input/input.ts` — `errorState` derivation pattern using `TW_ERROR_STATE_MATCHER`, `parentForm` / `parentFormGroup`, and `_ngControlRev` / `_formSubmitRev` bump-signals.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/popover/popover.ts` — overlay lifecycle boilerplate (position strategy, scroll strategies, backdrop, enter/leave animation, `ANIMATION_DURATION` leave-timer). Already applied verbatim in `tw-date-picker`; follow that.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/button/button.ts` — `ButtonDirective` selector `[twButton]`. Preset buttons, action-row buttons, and the clear button in the trigger all use this directive.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — existing `scale-in` / `scale-out` / `fade-in` / `fade-out` keyframes. **No new keyframes required.**
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/docs/prompts/tw-date-picker.md` — mirror this prompt's structure and depth.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/docs/prompts/tw-select.md` and `tw-input.md` — secondary format references.

CDK modules to import:

- `@angular/cdk/overlay` — `Overlay`, `OverlayRef`, `FlexibleConnectedPositionStrategy`, `ConnectedPosition`, `ScrollStrategy`.
- `@angular/cdk/portal` — `ComponentPortal`.
- `@angular/cdk/a11y` — `FocusMonitor` (descendants-aware host focus tracking), `LiveAnnouncer` (announce committed range / preset selection), `FocusTrap` via `FocusTrapFactory` (trap focus inside the overlay dialog).
- `@angular/cdk/keycodes` — `ENTER`, `SPACE`, `ESCAPE`, `DOWN_ARROW`, `UP_ARROW`, `ALT`.

### Standards informing this design

- **WAI-ARIA APG "Date Picker Dialog"** — trigger is `role="combobox"` with `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` pointing at the overlay's `role="dialog"` / `aria-modal="true"` wrapper. The calendar inside provides its own `role="group"` grid semantics. Focus is trapped inside the dialog; Escape closes and returns focus to the trigger.
- **Angular Material `mat-date-range-input`** — inspired the `TwDateRange<D>` value shape, the two-calendar side-by-side layout (`numberOfMonths = 2`), the `min` / `max` / `dateFilter` cascade into the calendar, and the auto-swap behaviour when the second click lands before the first.
- **Radix UI `DateRangePicker`** and **React Aria's `useDateRangePicker`** — inspired the preset-list sidebar ("Today", "Last 7 days", "This month", "Last 30 days", "Year to date") and the "apply on second click" desktop flow vs. explicit action-bar flow for touch.
- **Headless UI `Popover`** — confirmed the overlay-as-dialog pattern for picker popups.

## What to build

A standalone `<tw-date-range-picker>` element component that lets users pick a two-endpoint date range. The trigger shows the formatted range text (`"Apr 21, 2026 – May 3, 2026"` or `"Start date — End date"` when empty); clicking the trigger opens an overlay dialog hosting one or two `<tw-calendar>` instances in `selectionMode="range"`. The user clicks the start date, then the end date (hover preview in between); the calendar's `userSelection` output emits a `TwDateRange<D>` which the picker treats as the new pending value. Optional: two `<tw-time-picker>` instances below the calendars when `showTime` is true; a preset list sidebar for quick-select ranges; an action bar (`Today / Clear / Cancel / Apply`) for touch contexts.

The component is generic over `D` (the date type understood by the injected adapter) and defaults to `D = Date` for the common case. Its value is a `TwDateRange<D> | null`. `null` represents "no range chosen"; a `TwDateRange` with either endpoint `null` represents the in-progress "only start picked" state that round-trips through `writeValue` and `value` (for consumers who want to persist partial ranges) — see **Edge cases** for the full rule.

The component participates in all three Angular forms strategies (template-driven, reactive, signal-forms) via `ControlValueAccessor`, and integrates with `<tw-form-field>` by extending `FormFieldControl<TwDateRange<D>>` and providing itself under `TW_FORM_FIELD_CONTROL`. All date operations go through the injected `DateAdapter<D>`.

### Design decisions baked in

- **Value type is `TwDateRange<D> | null`.** Reuse the class from `ngx-tw/calendar` — do NOT define a parallel `DateRange` interface. `TwDateRange` is immutable, exposes `start` / `end` / `complete` / `empty`, and is already serialised by `writeValue` paths in `CalendarComponent.writeValue`. Accepting both `TwDateRange<D>` and plain `{ start, end }` objects in `writeValue` matches what the calendar already does (`TwDateRangeInput<D>`).
- **Single trigger element (read-only text), not two separate date-inputs.** Unlike Material's `<mat-date-range-input>` (two chained `<input>` elements), this component presents one formatted range string inside a non-editable trigger button. Typed range entry is a separable feature and out of scope for v1 — flagged as [CONFIRM] below. Rationale: a single trigger is simpler, works on mobile, and matches the Radix / React Aria convention. Typed entry adds considerable parse-ambiguity surface area (which half is being edited? what separator? does "today" fill both ends?) and would double the spec.
- **`tw-calendar` with `selectionMode="range"` owns the range logic.** The calendar already handles first-click / second-click / auto-swap / hover preview / keyboard navigation inside the grid. The picker passes `selectionMode="range"`, binds its `pendingRange` signal into the calendar's `selected` model, and listens to `userSelection` to know when the user completed a range. **Do not lift range state up.**
- **Two-calendar composition for `numberOfMonths === 2`.** Two `<tw-calendar>` instances render side by side; they share the same `pendingRange` signal (both display the same selection and preview), but each has its own `activeDate` model so the user sees two consecutive months. On open: left calendar's `activeDate = pendingRange.start ?? startAt ?? today`; right calendar's `activeDate = adapter.addCalendarMonths(left.activeDate, 1)`. When the user paginates either calendar, the other moves in lockstep (clamp to `minDate` / `maxDate`). See "Two-calendar composition" below. For `numberOfMonths === 1`, a single calendar instance.
- **Optional time mode.** When `showTime` is true, below the calendars renders a row containing two `<tw-time-picker>` instances (`variant="naked"`), one for the start time and one for the end time. Each commits its time-of-day onto the corresponding range endpoint via `adapter.withTime(...)`. Time-mode also folds hour/minute (and seconds if `showSeconds`) into the default display format. When `showTime` is false, times are zeroed via `adapter.withTime(d, 0, 0, 0)` at commit time so equality checks behave predictably.
- **Optional preset list.** When `presets` is non-empty, the overlay renders a vertical list on the left (before the calendars) of preset buttons. Clicking a preset calls its `range()` factory, clamps the result to `minDate`/`maxDate`, sets `pendingRange`, and (unless `showActions` is true) immediately commits and closes.
- **Optional action bar.** When `showActions` is true the overlay renders a `Today | Clear | Cancel | Apply` row; default is `false` (desktop flow commits on second click). Same pattern as `tw-date-picker`.
- **Dialog, not listbox.** Overlay is `role="dialog"` `aria-modal="true"`; focus is trapped via `FocusTrapFactory`.
- **Auto-naked variant inside `<tw-form-field>`.** Same pattern as `tw-date-picker` and `tw-select`.
- **`DateAdapter<D>` is the only way dates are formatted, compared, or mutated.** No direct `Date` API calls in the component source.

## API design

### Component identity

- **Selector:** `tw-date-range-picker` (element selector).
- **Class:** `DateRangePickerComponent`.
- **Entry point:** `ngx-tw/date-range-picker`.
- **Generic:** `DateRangePickerComponent<D = Date>` — the date type understood by the adapter.
- **Change detection:** `ChangeDetectionStrategy.OnPush`.
- **Standalone:** yes (do not set `standalone: true` — Angular v21 default).
- **Providers (on the component metadata):**
  - `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateRangePickerComponent), multi: true }`
  - `{ provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => DateRangePickerComponent) }`

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `idInput` (alias `'id'`) | `string \| undefined` | auto `tw-date-range-picker-${n}` | `/** Id on the trigger element. Auto-generated when not provided. Used by the form-field's \`<label for>\` attribute. */` |
| `minDate` | `D \| null` | `null` | `/** Earliest selectable date for either endpoint. Presets and calendar cells earlier than this are rejected/disabled. Defaults to \`null\` (no minimum). */` |
| `maxDate` | `D \| null` | `null` | `/** Latest selectable date for either endpoint. Presets and calendar cells later than this are rejected/disabled. Defaults to \`null\` (no maximum). */` |
| `dateFilter` | `TwDateFilter<D> \| null` | `null` | `/** Per-date predicate — return \`false\` to disable. Applied in both calendars. When the user tries to select a filtered date via a preset, the preset is skipped. */` |
| `startView` | `TwCalendarView` | `'month'` | `/** Which calendar view opens first — \`'month'\`, \`'year'\`, or \`'multi-year'\`. Defaults to \`'month'\`. */` |
| `startAt` | `D \| null` | `null` | `/** Date the left calendar focuses on when opened with no value. Falls back to today. Ignored when a value is already set. */` |
| `format` | `TwNativeDateFormat \| unknown` | `{ dateTimeFormat: { year: 'numeric', month: 'short', day: 'numeric' } }` | `/** Display format for each endpoint, passed to \`DateAdapter.format()\`. When \`showTime\` is true and this is left at the default, hour/minute (and optional seconds) are folded in automatically. */` |
| `rangeSeparator` | `string` | `' – '` (en dash) | `/** Separator rendered between the two formatted endpoints in the trigger. Defaults to \`" – "\`. */` |
| `emptyStartLabel` | `string` | `'Start date'` | `/** Placeholder text shown in the trigger for an empty \`start\` endpoint. */` |
| `emptyEndLabel` | `string` | `'End date'` | `/** Placeholder text shown in the trigger for an empty \`end\` endpoint. */` |
| `placeholder` | `string \| undefined` | `undefined` | `/** When set, overrides the composed \`${emptyStartLabel}${rangeSeparator}${emptyEndLabel}\` placeholder with a single string. */` |
| `disabledInput` (alias `'disabled'`) | `boolean` | `false` | `/** When true, the trigger cannot open the overlay and \`aria-disabled="true"\` is set. Defaults to \`false\`. */` |
| `requiredInput` (alias `'required'`) | `boolean` | `false` | `/** When true, exposes \`aria-required="true"\`. \`Validators.required\` on a bound \`NgControl\` is also honoured. Defaults to \`false\`. */` |
| `size` | `TwSize` | `'md'` | `/** Trigger padding, font size, and calendar cell density. Uses the shared \`TwSize\` scale. Defaults to \`'md'\`. */` |
| `color` | `TwColor` | `'primary'` | `/** Semantic color for focused border, calendar range fill, and preset active state. Defaults to \`'primary'\`. */` |
| `variant` | `DateRangePickerVariant \| undefined` | `undefined` | `/** Visual style of the trigger. \`'default'\` draws its own border; \`'naked'\` strips chrome so a parent (e.g. \`tw-form-field\`) owns it. Auto-resolves to \`'naked'\` when inside a form-field; otherwise \`'default'\`. */` |
| `numberOfMonths` | `1 \| 2` | `2` | `/** How many months the overlay shows side-by-side. \`2\` is the standard range-picker layout; use \`1\` for compact contexts. Defaults to \`2\`. */` |
| `presets` | `readonly DateRangePreset<D>[]` | `[]` | `/** Optional quick-select presets rendered as a vertical list before the calendars. Each preset provides a label and a factory returning a \`TwDateRange<D>\`. An empty array hides the preset panel. */` |
| `showClear` | `boolean` | `true` | `/** Whether to show a clear-button affordance inside the trigger when a value is set. Defaults to \`true\`. */` |
| `showActions` | `boolean` | `false` | `/** When true, renders a \`Today / Clear / Cancel / Apply\` action bar at the bottom of the overlay. The calendar commits on the second click by default — turn this on for touch-heavy contexts. Defaults to \`false\`. */` |
| `showTime` | `boolean` | `false` | `/** When true, the overlay also renders two \`<tw-time-picker>\` instances so users can pick times for the start and end of the range. Defaults to \`false\`. */` |
| `timeFormat` | `TimePickerFormat` | `'24h'` | `/** Format of the embedded time-pickers. \`'24h'\` renders 00–23; \`'12h'\` adds an AM/PM toggle. Defaults to \`'24h'\`. */` |
| `showSeconds` | `boolean` | `false` | `/** Whether the embedded time-pickers expose a seconds field. Defaults to \`false\`. */` |
| `hourStep` | `number` | `1` | `/** Step for the embedded time-pickers' hour fields. Defaults to \`1\`. */` |
| `minuteStep` | `number` | `1` | `/** Step for the embedded time-pickers' minute fields. Defaults to \`1\`. */` |
| `secondStep` | `number` | `1` | `/** Step for the embedded time-pickers' second fields. Defaults to \`1\`. */` |
| `todayLabel` | `string` | `'Today'` | `/** Label for the \`Today\` action in the overlay's action bar. */` |
| `clearLabel` | `string` | `'Clear'` | `/** Label for the \`Clear\` action in the overlay's action bar. */` |
| `cancelLabel` | `string` | `'Cancel'` | `/** Label for the \`Cancel\` action in the overlay's action bar. */` |
| `applyLabel` | `string` | `'Apply'` | `/** Label for the \`Apply\` action in the overlay's action bar. */` |
| `panelClass` | `string \| readonly string[]` | `''` | `/** Extra class(es) applied to the overlay panel element. \`twMerge\` resolves conflicts with internal classes. */` |
| `scrollStrategy` | `'reposition' \| 'close' \| 'block'` | `'reposition'` | `/** CDK scroll strategy for the overlay. Defaults to \`'reposition'\`. */` |
| `offset` | `number` | `4` | `/** Pixel distance between trigger and overlay. Defaults to \`4\`. */` |
| `triggerAriaLabel` | `string` | `'Open date range picker'` | `/** Accessible name for the calendar trigger button. */` |
| `errorStateMatcher` | `ErrorStateMatcher \| undefined` | `undefined` | `/** Per-instance override of the \`ErrorStateMatcher\`. When omitted, uses the injected \`TW_ERROR_STATE_MATCHER\`. */` |
| `ariaLabel` (alias `'aria-label'`) | `string \| undefined` | `undefined` | `/** Accessible name for the trigger. Required when no visible label is supplied via \`tw-form-field\` or an external \`aria-labelledby\`. */` |
| `ariaLabelledby` (alias `'aria-labelledby'`) | `string \| undefined` | `undefined` | `/** ID of an external element that labels the trigger. */` |
| `userAriaDescribedByInput` (alias `'aria-describedby'`) | `string \| undefined` | `undefined` | `/** Consumer-supplied \`aria-describedby\` ids. The form-field preserves these when merging hint/error ids. */` |

**Input count:** ~32. Exceeds the 5–6 guideline, permitted under MEMORY.md's "Overlay input count exception" (same policy applied to `tw-select`, `tw-popover`, `tw-input`, `tw-date-picker`). The common case still only needs `[(value)]`, optionally `minDate` / `maxDate` / `presets`.

### Models (two-way)

| Model | Type | Default | JSDoc |
|---|---|---|---|
| `value` | `TwDateRange<D> \| null` | `null` | `/** Two-way bound selected range. \`null\` when no selection. Setting programmatically updates the trigger display and the calendar selection; it does NOT fire \`valueChange\` with \`source: 'user'\`. */` |
| `open` | `boolean` | `false` | `/** Two-way bound open state of the overlay. Setting to \`true\` opens; setting to \`false\` closes. */` |

`valueChange` and `openChange` are auto-generated by `model()` — do NOT redeclare.

### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `opened` | `DateRangePickerOpenedEvent` | `/** Fires after the overlay's enter animation completes. Payload is the trigger element. */` |
| `closed` | `DateRangePickerCloseReason` | `/** Fires after the overlay's leave animation completes. Payload is the reason it closed. */` |
| `rangeChange` | `DateRangePickerChangeEvent<D>` | `/** Fires after a commit — either from completing a range in the calendar, picking a preset, or applying via the action bar. Includes the new range, the previous range, and a \`source\` discriminator. */` |
| `presetSelected` | `DateRangePreset<D>` | `/** Fires when the user picks a preset from the list. Payload is the preset descriptor. Fires in addition to \`rangeChange\`. */` |

Omit a `dateInput` event (no typed input in v1).

### Supporting types

Define in `date-range-picker.ts`; re-export from `index.ts`:

```ts
/** Visual style of the trigger. */
export type DateRangePickerVariant = 'default' | 'naked';

/** Origin of a value change, used to distinguish user input from programmatic writes. */
export type DateRangePickerChangeSource =
  | 'calendar'
  | 'preset'
  | 'time'
  | 'apply'
  | 'clear'
  | 'today'
  | 'programmatic';

/** Reason the overlay closed. */
export type DateRangePickerCloseReason =
  | 'select'
  | 'apply'
  | 'cancel'
  | 'escape'
  | 'backdrop'
  | 'programmatic';

/** Emitted by `rangeChange`. */
export interface DateRangePickerChangeEvent<D> {
  /** The committed range (`null` when cleared). */
  readonly value: TwDateRange<D> | null;
  /** The range before this change. */
  readonly previousValue: TwDateRange<D> | null;
  /** What triggered the change. */
  readonly source: DateRangePickerChangeSource;
}

/** Emitted by `opened`. */
export interface DateRangePickerOpenedEvent {
  /** The trigger element. */
  readonly trigger: HTMLElement;
}

/** A quick-select preset rendered in the overlay's preset list. */
export interface DateRangePreset<D = Date> {
  /** Label shown on the preset button. */
  readonly label: string;
  /** Factory returning the range to apply when this preset is chosen. Called fresh each click so "today"-relative presets stay current. */
  readonly range: () => TwDateRange<D>;
  /** Optional identifier — surfaced in `presetSelected` and used for tracking the active preset visual state. */
  readonly id?: string;
}

/** Re-exported from `ngx-tw/calendar` for consumers that import only the range picker. */
export type { TwCalendarView, TwDateFilter, TwDateRange, TwDateRangeInput } from 'ngx-tw/calendar';

/** Re-exported from `ngx-tw/core`. */
export type { TimePickerFormat } from 'ngx-tw/core';
```

### Content projection

Three optional slots:

| Slot | Mechanism | Purpose / Fallback |
|---|---|---|
| Trigger icon | `[slot="trigger-icon"]` on any element | **Fallback:** default calendar-range SVG icon (inline, `size-4` / `size-5` per variant). Lets consumers swap in a `lucide-angular` icon. |
| Overlay header | `[slot="overlay-header"]` on any element | No fallback — region renders only when projected. Forwarded to the overlay via a `TemplateRef` signal (same pattern as `tw-select` and `tw-date-picker`). |
| Overlay footer | `[slot="overlay-footer"]` on any element | No fallback — renders between the calendars and the action bar when projected. Useful for custom helper text or bespoke action affordances when `showActions` is `false`. |

No template directive for presets — the `presets` array is sufficient and keeps the API ergonomic. Consumers needing template-driven preset visuals can project custom content into `overlay-header` and hide the built-in list with an empty `presets` array.

## Usage examples

```html
<!-- Simplest: two-way binding, default Intl formatting, 2-month layout -->
<tw-date-range-picker [(value)]="vacation" aria-label="Vacation dates" />
```

```html
<!-- Reactive forms + presets + min/max -->
<tw-form-field>
  <label twLabel>Report period</label>
  <tw-date-range-picker
    formControlName="reportRange"
    [minDate]="startOfYear"
    [maxDate]="today"
    [presets]="reportPresets"
  />
  <span twHint>Pick a range within this year.</span>
  <span twError>Please pick a range.</span>
</tw-form-field>
```

```html
<!-- Template-driven + weekdays-only filter -->
<tw-date-range-picker
  [(ngModel)]="travelWindow"
  [dateFilter]="weekdayFilter"
  [minDate]="today"
  aria-label="Travel window"
/>
```

```html
<!-- Signal-forms + action bar (touch-friendly explicit apply flow) -->
<tw-date-range-picker
  [control]="form.booking"
  [showActions]="true"
  color="accent"
  size="lg"
  aria-label="Booking dates"
/>
```

```html
<!-- Time-of-day mode for event scheduling -->
<tw-date-range-picker
  [(value)]="eventWindow"
  [showTime]="true"
  timeFormat="12h"
  [showSeconds]="false"
  aria-label="Event window"
/>
```

```html
<!-- One-month compact layout -->
<tw-date-range-picker
  [(value)]="range"
  [numberOfMonths]="1"
  aria-label="Compact range"
/>
```

```html
<!-- Disabled -->
<tw-date-range-picker [(value)]="lockedRange" [disabled]="true" aria-label="Locked" />
```

```html
<!-- Custom trigger icon -->
<tw-date-range-picker [(value)]="range" aria-label="Pick a range">
  <tw-icon slot="trigger-icon" name="calendar-range" />
</tw-date-range-picker>
```

```ts
// Presets definition (in the component class)
readonly reportPresets: readonly DateRangePreset<Date>[] = [
  { id: 'today',       label: 'Today',        range: () => {
    const t = this.adapter.today();
    return new TwDateRange(t, t);
  }},
  { id: 'last-7',      label: 'Last 7 days',  range: () => { /* ... */ }},
  { id: 'this-month',  label: 'This month',   range: () => { /* ... */ }},
  { id: 'last-30',     label: 'Last 30 days', range: () => { /* ... */ }},
  { id: 'ytd',         label: 'Year to date', range: () => { /* ... */ }},
];
```

## Styling

### `tv()` config — slot-based

Single `tv()` config in `date-range-picker.ts`. Slots:

```
slots:
  root          — outer block wrapping trigger content; `relative inline-flex items-center w-full`
  trigger       — the button surface (reads as text + icon); `flex-1 inline-flex items-center gap-2 min-w-0 text-left bg-transparent outline-none`
  startText     — span rendering the formatted start; `truncate`
  separator     — span rendering `rangeSeparator`; `shrink-0 text-fg-subtle`
  endText       — span rendering the formatted end; `truncate`
  placeholderText — shown when both endpoints null; `text-fg-subtle truncate`
  triggerIconBtn — trailing calendar-icon button; `inline-flex items-center justify-center shrink-0 rounded-md`
  triggerIcon   — the SVG/ng-content holder; `shrink-0 transition-colors duration-200 motion-reduce:transition-none`
  clearButton   — clear affordance; `size-5 rounded-md inline-flex items-center justify-center shrink-0`
  panel         — overlay container: `bg-surface-overlay border border-border rounded-lg shadow-md overflow-hidden flex`
  panelInner    — wrapper around presets + calendars/time row; `flex flex-col flex-1`
  panelHeader   — slot="overlay-header" wrapper; `border-b border-border px-3 py-2`
  presetList    — `flex flex-col gap-1 p-2 border-r border-border bg-surface-muted min-w-[10rem]`
  presetButton  — each preset <button twButton variant="ghost" size="sm"> with full-width class applied
  calendars     — container for 1 or 2 calendars; `flex flex-row items-start` (side-by-side)
  calendarDivider — vertical divider between the two calendars; `self-stretch border-l border-border`
  timeRow       — row below calendars when showTime; `border-t border-border flex items-center justify-between gap-3 px-3 py-2`
  timeColumn    — `flex items-center gap-2`
  timeLabel     — `text-xs font-medium text-fg-muted`
  footerSlot    — slot="overlay-footer" wrapper; `border-t border-border px-3 py-2`
  actionBar     — `border-t border-border flex items-center justify-between gap-2 px-3 py-2`
  actionGroup   — `flex items-center gap-2`
```

Variants (mirror `tw-date-picker` + introduce `numberOfMonths` for layout-only styling):

```
size:
  xs → root: 'gap-1 text-xs',       triggerIconBtn: 'size-6',  triggerIcon: 'size-3.5'
  sm → root: 'gap-1.5 text-sm',     triggerIconBtn: 'size-7',  triggerIcon: 'size-4'
  md → root: 'gap-2 text-sm',       triggerIconBtn: 'size-8',  triggerIcon: 'size-4'
  lg → root: 'gap-2 text-base',     triggerIconBtn: 'size-9',  triggerIcon: 'size-5'
  xl → root: 'gap-2 text-base',     triggerIconBtn: 'size-10', triggerIcon: 'size-5'

variant:
  default → root: 'rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong'
  naked   → root: 'bg-transparent border-0 rounded-none p-0 focus-within:outline-none'

open:
  true  → triggerIconBtn: 'bg-surface-muted text-fg'
  false → {}

disabled:
  true  → root: 'opacity-50 pointer-events-none cursor-not-allowed'
  false → {}

errorState: { true: {}, false: {} }      // drives focused-border compoundVariants
focused:    { true: {}, false: {} }
color:      { primary: {}, secondary: {}, accent: {}, neutral: {}, info: {}, success: {}, warning: {}, error: {} }
```

Compound variants (focused-border per color, `variant: 'default'` only; plus error border):

```
{ variant: 'default', focused: true, color: 'primary',   class: { root: 'border-primary-500' } }
{ variant: 'default', focused: true, color: 'secondary', class: { root: 'border-secondary-500' } }
{ variant: 'default', focused: true, color: 'accent',    class: { root: 'border-accent-500' } }
{ variant: 'default', focused: true, color: 'neutral',   class: { root: 'border-border-strong' } }
{ variant: 'default', focused: true, color: 'info',      class: { root: 'border-info-500' } }
{ variant: 'default', focused: true, color: 'success',   class: { root: 'border-success-500' } }
{ variant: 'default', focused: true, color: 'warning',   class: { root: 'border-warning-500' } }
{ variant: 'default', focused: true, color: 'error',     class: { root: 'border-error-500' } }
{ variant: 'default', errorState: true,                  class: { root: 'border-error-500' } }
```

`defaultVariants`:

```
{ size: 'md', variant: 'default', open: false, disabled: false, errorState: false, focused: false, color: 'primary' }
```

`twMerge: true` in the second argument.

### Key structural classes

- **Panel:** `bg-surface-overlay border border-border rounded-lg shadow-md overflow-hidden flex`. Use `max-w-[calc(100vw-16px)]` so very large layouts don't overflow the viewport.
- **Calendars row:** each embedded `<tw-calendar>` takes its natural width from its `size` variant; divider is `border-l border-border` with `self-stretch`.
- **Time row:** `border-t border-border`, `px-3 py-2`, `flex items-center gap-3`. Inside, two `timeColumn` groups separated by the rangeSeparator.
- **Preset list:** `border-r border-border bg-surface-muted min-w-[10rem] p-2 gap-1` flex-column. Each preset uses `<button twButton variant="ghost" size="sm" class="w-full justify-start">`.
- **Action bar:** `border-t border-border flex items-center justify-between gap-2 px-3 py-2`. Buttons use `<button twButton variant="ghost|solid" size="sm">`.
- **Enter/leave:** `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"` on the panel. Classes exist in `projects/ngx-tw/theme/_base.css`.
- **Clear button / trigger icon:** reuse the utility classes from `tw-date-picker`'s `clearButton` and `triggerButton` slots verbatim (hover: `text-fg bg-surface-muted`; focus: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`).

### Visual-design-system compliance

- Radius: `rounded-md` on trigger icon button and preset buttons; `rounded-lg` on panel. Matches CLAUDE.md.
- Spacing: standard inline padding scale on the root (`px-3 py-2` for `md`); `size-{n}` grid on the trigger icon button.
- Gap: `gap-1` for preset list, `gap-2` for action bar and trigger content, `gap-3` for time row columns.
- Shadow: `shadow-md` on panel. No other shadows.
- Focus ring: default variant uses a `focus-within:outline-*-primary-500` on the root; the trigger button and clear button use `focus-visible:outline-*` for keyboard-only rings.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` for color state changes; animate.enter/leave for panel mount.
- Icons: `size-4` for sm/md, `size-5` for lg/xl; add `shrink-0`. Matches CLAUDE.md Icon Sizing table.
- Borders: structural dividers use `border-border`; range-fill inside calendar cells is delegated to `tw-calendar` which already uses `bg-{color}-100` + `bg-{color}-500` endpoints.

## Accessibility

### Roles & attributes — ARIA APG "Date Picker Dialog"

**Trigger (`<button type="button">` on the host, acts as combobox):**
- `[id]="hostId"` — the id the form-field's `<label for>` points at.
- `type="button"`.
- `[attr.role]="'combobox'"` — combobox-with-dialog-popup variant of the APG pattern.
- `[attr.aria-haspopup]="'dialog'"`.
- `[attr.aria-expanded]="open() ? 'true' : 'false'"`.
- `[attr.aria-controls]="dialogId"`.
- `[attr.aria-label]="triggerAccessibleName()"` — `computed` combining `ariaLabel()` with the currently selected range (e.g. `"Pick date range. Current range: Apr 21 2026 to May 3 2026."`).
- `[attr.aria-labelledby]="ariaLabelledby() || null"`.
- `[attr.aria-describedby]="describedBy() || null"`.
- `[attr.aria-required]="required() || null"`.
- `[attr.aria-invalid]="errorState() || null"`.
- `[attr.aria-disabled]="isDisabled() || null"`.
- `[disabled]="isDisabled()"`.

**Trigger clear button (rendered conditionally):**
- `type="button"`, `tabindex="-1"`.
- `[attr.aria-label]="'Clear date range'"`.

**Overlay dialog (`<div role="dialog">` in the internal overlay component):**
- `role="dialog"`, `aria-modal="true"`.
- `[id]="dialogId"`.
- `[attr.aria-label]="dialogAriaLabel()"` — `computed(() => ariaLabel() || 'Choose a date range')`.

**Embedded `<tw-calendar>`s (inside the dialog):**
- `selectionMode="range"`.
- Pass `[selected]="pendingRange()"`, `[minDate]`, `[maxDate]`, `[dateFilter]`, `[color]`, `[size]`.
- Left calendar: `aria-label="Start calendar"`. Right calendar: `aria-label="End calendar"`. Single calendar: `aria-label="Calendar"`.
- Bind each calendar's `activeDate` to its own local model so they can paginate independently (with lockstep logic — see Implementation notes).

**Preset list (when non-empty):**
- Wrap in `<div role="listbox" aria-label="Preset ranges">`.
- Each preset button: `role="option"`, `[attr.aria-selected]="isActivePreset(preset)"`. Clicking a preset is a selection action.

**Time row (when `showTime`):**
- Each `<tw-time-picker>` is its own CVA-aware control; preserve its ARIA via `aria-label="Start time"` / `aria-label="End time"` on the instance.

### Keyboard behaviour

| Key | Trigger focused, closed | Dialog focused |
|---|---|---|
| `Enter` / `Space` | opens the overlay, moves focus to the left calendar's active cell | calendar cell selects (first click → start, second click → commits); preset button activates; action-bar button activates |
| `Escape` | no-op | closes the dialog with reason `'escape'`, restores `lastValueBeforeOpen`, returns focus to trigger |
| `Alt + Down` | opens | — |
| `Alt + Up` | — | closes with reason `'cancel'` (silent restore) |
| `Tab` / `Shift+Tab` | natural focus movement | trapped inside the dialog by `FocusTrap`; within the dialog, Tab cycles preset list → calendar → action bar |
| Arrow keys | natural | forwarded to calendar cells by `tw-calendar` roving-tabindex |

**Focus trap:** instantiate `FocusTrapFactory.create(overlayElement)` on attach; destroy in the leave-animation timer callback. `tw-calendar` already handles roving-tabindex inside its grid; the trap keeps focus inside the dialog when the user tabs past the last focusable element.

**Focus return:** on close, move DOM focus back to the trigger element (always — the only other focusable on the host is the clear button with `tabindex=-1`).

### Live announcements

Inject `LiveAnnouncer`. On a user-initiated commit:

- Range completed via calendar: `"{{ formattedStart }} to {{ formattedEnd }} selected"`.
- Partial range (start only): `"{{ formattedStart }} selected. Pick end date."`.
- Preset chosen: `"${preset.label} selected. {{ formattedStart }} to {{ formattedEnd }}."`.
- Cleared: `"Date range cleared"`.

Do not announce programmatic writes or hover previews.

### Dev-mode accessible-name warning

In the constructor, `afterNextRender` + `isDevMode()`: warn if `ariaLabel()`, `ariaLabelledby()`, AND the form-field-wrapper label are all absent. Message:

```
[tw-date-range-picker] The date-range-picker has no accessible name. Set aria-label, aria-labelledby, or wrap the component in a <tw-form-field> with a <label twLabel>.
```

### AXE / WCAG

Must pass all AXE checks and meet WCAG AA. Key concerns: contrast of placeholder text (`text-fg-subtle` on `bg-surface`), contrast of disabled state (`opacity-50` + tokens), visible focus indicator on the trigger and every interactive element inside the overlay, label association across every form strategy.

## Form integration

### `ControlValueAccessor`

Implement on `DateRangePickerComponent`. Register via `NG_VALUE_ACCESSOR` (see Providers). Mirror `CalendarComponent.writeValue` for range handling and `DatePickerComponent.writeValue` for the CVA boilerplate.

- **`writeValue(value: TwDateRangeInput<D> | null | undefined)`** — accept `TwDateRange<D>`, `{ start, end }` objects, and nullish. Coerce via:
  - `null` / `undefined` → `internalValue.set(null)`, clear the trigger display.
  - `TwDateRange` instance → use directly; validate endpoints via `adapter.isValid` and coerce invalid endpoints to `null` while keeping the other.
  - Plain object → construct `new TwDateRange<D>(obj.start ?? null, obj.end ?? null)` after `adapter.deserialize` on each non-null endpoint.
  - If both endpoints become `null`, set `internalValue` to `null` (not `new TwDateRange(null, null)`) so `isEmpty()` reads consistently.
- **`registerOnChange(fn: (value: TwDateRange<D> | null) => void)`** — store on a private field.
- **`registerOnTouched(fn: () => void)`** — called on focus loss (FocusMonitor descendants-aware) and on close of the overlay.
- **`setDisabledState(isDisabled: boolean)`** — sets a `cvaDisabled` signal; `isDisabled = computed(() => disabledInput() || cvaDisabled() || !!ngControl?.disabled)` drives ARIA and the trigger's `[disabled]` binding.

Template-driven, reactive, and signal-forms all work automatically through the CVA + `model()` combination. No per-strategy code.

### `FormFieldControl<TwDateRange<D>>` contract

Extend the abstract class from `ngx-tw/form-field`. Provide under `TW_FORM_FIELD_CONTROL` as shown in Providers. Required signals:

- `id = computed(() => idInput() ?? hostId)`.
- `value: Signal<TwDateRange<D> | null>` — expose `internalValue`.
- `focused: Signal<boolean>` — driven by `FocusMonitor.monitor(elementRef, true)` so descendants (overlay included) count.
- `empty: Signal<boolean>` — `computed(() => { const v = internalValue(); return v === null || (v.start === null && v.end === null); })`.
- `disabled: Signal<boolean>` — `isDisabled`.
- `required: Signal<boolean>` — `requiredInput()` OR (`NgControl.control.hasValidator(Validators.required)`).
- `errorState: Signal<boolean>` — combines the matcher result with internal `parseError()` (false in v1, reserved for future typed-entry mode) and `rangeError()` (true when an endpoint falls outside `minDate`/`maxDate` — e.g. after a programmatic `writeValue` with out-of-range dates).
- `controlType = 'date-range-picker'` — gives the form-field a `tw-form-field-type-date-range-picker` class hook.
- `userAriaDescribedBy: Signal<string | undefined>` — echoes `userAriaDescribedByInput()`.
- **`setDescribedByIds(ids: string[])`** — store on a `describedByIdsSignal`, used by the trigger's `[attr.aria-describedby]`.
- **`onContainerClick(event: MouseEvent)`** — open the overlay unless the click is on the clear or trigger-icon button; focus the trigger button so the form-field-wrapped UX matches user expectation.

### Auto-naked detection

```ts
private readonly formField = inject(FormFieldComponent, { optional: true });
readonly resolvedVariant = computed<DateRangePickerVariant>(
  () => this.variant() ?? (this.formField ? 'naked' : 'default'),
);
```

### Error-state wiring

Copy the pattern from `InputDirective` / `DatePickerComponent`: inject `NgControl, { optional: true, self: true }`, `NgForm`, `FormGroupDirective`, `TW_ERROR_STATE_MATCHER`. Bump `_ngControlRev` on `statusChanges` / `valueChanges`; bump `_formSubmitRev` on the parent form's `ngSubmit`.

## Interaction model

1. **Trigger click or Enter/Space:** opens the overlay, stores `lastValueBeforeOpen = internalValue()`, initialises `pendingRange = internalValue() ?? new TwDateRange(null, null)`, and moves focus to the left calendar's active cell.
2. **First calendar click:** calendar emits `userSelection` with `{ value: TwDateRange(start, null), source: 'user' }`. The picker updates `pendingRange` but does NOT commit. Trigger text now reads `"${formattedStart}${separator}${emptyEndLabel}"`.
3. **Hover preview between clicks:** `tw-calendar` already highlights the would-be range via its `previewStart` / `previewEnd` internals. No picker-side logic needed.
4. **Second calendar click:** calendar emits `userSelection` with a complete `TwDateRange`. If `showActions()` is false AND `showTime()` is false AND no presets interaction pending, commit immediately (`rangeChange` with `source: 'calendar'`) and close with reason `'select'`. If `showActions()` OR `showTime()`, stay open so the user can set times or confirm.
5. **Preset click:** call `preset.range()`, clamp to `minDate`/`maxDate`, validate via `dateFilter`, set `pendingRange`, emit `presetSelected`, then commit and close UNLESS `showActions()` OR `showTime()`.
6. **Time picker change:** when `showTime` is true, each `<tw-time-picker>`'s `timeChange` handler folds the time onto the corresponding endpoint via `adapter.withTime()`. Staged into `pendingRange`. Does NOT auto-close.
7. **Clear button in trigger:** `commit(null, 'clear')`; overlay stays closed if closed; does not open.
8. **Action bar `Today`:** sets `pendingRange` to `new TwDateRange(adapter.today(), adapter.today())` (clamped to min/max).
9. **Action bar `Clear`:** sets `pendingRange` to `null`.
10. **Action bar `Cancel`:** restores `lastValueBeforeOpen`, closes with reason `'cancel'`.
11. **Action bar `Apply`:** commits `pendingRange` (null if both endpoints null; otherwise the range) with `source: 'apply'`, closes with reason `'apply'`.
12. **Escape key:** silent restore + close with reason `'escape'`.
13. **Backdrop click:** close with reason `'backdrop'` WITHOUT committing the pending range — treat as cancel when `showActions()` is true, or as a commit of whatever `pendingRange` is when `showActions()` is false. [CONFIRM] below.

## Composition with existing components

### `tw-calendar` API usage

```html
<tw-calendar
  #leftCal
  selectionMode="range"
  [selected]="pendingRange()"
  [startAt]="leftActiveDate()"
  [startView]="startView()"
  [minDate]="minDate()"
  [maxDate]="effectiveLeftMax()"   <!-- see lockstep below -->
  [dateFilter]="dateFilter()"
  [color]="color()"
  [size]="size()"
  [aria-label]="'Start calendar'"
  (userSelection)="onCalendarUserSelection($event)"
  (viewChanged)="onLeftViewChanged($event)"
/>
```

- Bind `selected` to the overlay's `pendingRange` signal, NOT directly to `value`. `pendingRange` is the user's in-progress draft; commit occurs via `userSelection` (and, when showActions is true, Apply).
- Listen to `userSelection` only — this is the committed-click event. Ignore `selected`'s internal model updates (they happen mid-click during the strategy-driven selection flow).
- Pass `selectionMode="range"` so the calendar uses `DefaultDateRangeSelectionStrategy` (or a custom one if the consumer registers `TW_DATE_RANGE_SELECTION_STRATEGY`).
- The calendar already handles keyboard nav, roving-tabindex, and the hover preview via its internal `previewStart` / `previewEnd` signals. No picker-side preview logic required.

### Two-calendar composition (`numberOfMonths === 2`)

- Render two `<tw-calendar>` instances in a flex row inside the panel's `calendars` slot, separated by a vertical divider.
- Each calendar gets its own `activeDate` local model (`leftActiveDate = signal(...)`, `rightActiveDate = signal(...)`).
- **Initial state on open:** `leftActiveDate = pendingRange.start ?? startAt ?? adapter.today()`; `rightActiveDate = adapter.addCalendarMonths(leftActiveDate, 1)`. Clamp both to `minDate`/`maxDate` via `adapter.clampDate`.
- **Lockstep pagination:** when the left calendar paginates (user clicks its prev/next), bump `rightActiveDate` so it's always `leftActiveDate + 1 month`. Similarly, when the right paginates, set `leftActiveDate = right - 1`. Skip the adjustment if it would violate `minDate`/`maxDate` — in that case, only move the calendar the user interacted with (Material's approach).
- **`effectiveLeftMax` / `effectiveRightMin`:** prevent the two calendars from showing the same month. If `leftActiveDate` equals `rightActiveDate` in year+month, the left calendar's next-button becomes a no-op OR the right calendar's prev-button becomes a no-op. Simplest: pass `maxDate` unchanged and let the lockstep logic drive correctness.
- Both calendars share the same `selected` (bound to `pendingRange`), `color`, `size`, `minDate`, `maxDate`, `dateFilter`. They differ only in `activeDate` and `aria-label`.
- Detect `viewChanged` on EITHER calendar. If a calendar switches to `'year'` or `'multi-year'` view, collapse the overlay into single-calendar mode until it returns to `'month'` (the multi-year/year views are not side-by-side-compatible in Material either).

For `numberOfMonths === 1`, render a single calendar and omit the divider.

### `tw-time-picker` API usage (when `showTime`)

```html
<tw-time-picker
  variant="naked"
  [value]="pendingRange()?.start ?? null"
  [size]="size()"
  [color]="color()"
  [format]="timeFormat()"
  [showSeconds]="showSeconds()"
  [hourStep]="hourStep()"
  [minuteStep]="minuteStep()"
  [secondStep]="secondStep()"
  [showClear]="false"
  [referenceDate]="pendingRange()?.start ?? adapter.today()"
  aria-label="Start time"
  (timeChange)="onStartTimeChange($event)"
/>
```

- Use `variant="naked"` so the time picker inherits the overlay's chrome.
- Two instances: one for `start`, one for `end`. Each binds to its own endpoint's time-of-day.
- `(timeChange)` handler calls `adapter.withTime(pendingRange.start/end, h, m, s)` and updates `pendingRange`.
- When `showActions()` is false and the user changes a time, commit immediately (source: `'time'`) without closing — the overlay stays open so the user can tweak further.
- Skip rendering the time row when either endpoint is `null` (there's nothing to attach a time to). Consumer guidance: set the range first, then the times.

## Overlay

Reuse the select/date-picker pattern verbatim with these specifics:

- **Position strategy:** `FlexibleConnectedPositionStrategy` with four positions: `bottom-start`, `bottom-end`, `top-start`, `top-end`. `withFlexibleDimensions(false)`, `withPush(false)`, `withViewportMargin(8)`.
- **Width:** overlay width is `auto` — panel sizes itself by the calendars + optional preset list + optional time row.
- **Scroll strategy:** switch on `scrollStrategy()` input.
- **Backdrop:** `hasBackdrop: true`, `backdropClass: 'cdk-overlay-transparent-backdrop'`. Backdrop click → `closeOverlay('backdrop')` (restoring via `showActions()` branch as noted above).
- **Escape key:** subscribe to `overlayRef.keydownEvents()` and close with `'escape'` (silent restore).
- **Enter/leave:** `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"` on the panel's host. `ANIMATION_DURATION = 150`. Defer `overlayRef.detach()` by that duration after flipping `closing = true`.
- **Focus trap:** `FocusTrapFactory.create(overlayElement)`; destroy in the detach-timer callback.
- **Internal overlay component:** `DateRangePickerOverlayComponent` (private, not exported), selector `tw-date-range-picker-overlay`, attached via `ComponentPortal`. Hosts the preset list, one or two calendars, optional time row, and action bar. Receives config through `signal()`-backed fields set from the outer component after `overlayRef.attach()`. Mirrors `DatePickerOverlayComponent`.

## Edge cases

- **start > end:** handled inside the calendar by `DefaultDateRangeSelectionStrategy` — if the second click is before the first, endpoints are auto-swapped. Picker just trusts the calendar's output.
- **start === end (same day):** allowed; represents a single-day range. Valid for presets like "Today".
- **Min/max clamping:** `adapter.clampDate(endpoint, minDate, maxDate)` on every commit. If a preset's range falls entirely outside `[minDate, maxDate]`, skip (log a console warning in dev mode).
- **Null range:** both endpoints `null` is equivalent to "no selection". `writeValue(new TwDateRange(null, null))` normalises to `internalValue.set(null)`.
- **Partial range:** `{ start: Date, end: null }` round-trips through `writeValue` and `value`. Trigger shows `"${formattedStart}${separator}${emptyEndLabel}"`. `empty()` returns false (there's at least one endpoint). `errorState` may flag if `requiredInput` is true and `complete` is false and the form has been submitted — handled by the default matcher.
- **`dateFilter` rejects a preset endpoint:** the preset is not applied; `presetSelected` does not fire; the picker announces `"${preset.label} is not available in the current filter."` via `LiveAnnouncer`.
- **Time mode + `start === end` day:** both times are editable independently; if `endTime < startTime` on the same day, flag `rangeError` (shown as `aria-invalid` via the standard error-state pipeline). [CONFIRM] whether to auto-swap.
- **Programmatic writeValue with invalid endpoint:** that endpoint becomes `null` and `rangeError` fires; the other endpoint is preserved.
- **Calendar pagination in two-month layout when min/max pins one side:** if `minDate` prevents the left calendar from going back, the left prev-button disables (handled by `tw-calendar`'s `canGoPrevious`); if the right calendar's `activeDate` would fall outside `maxDate`, similarly pinned. Lockstep logic SKIPS moving the non-interacted calendar when doing so would violate min/max.
- **View change (year / multi-year) in two-month layout:** collapse to single calendar during non-month views — users generally expect the year/decade picker to be full-width.

## Implementation notes

### State signals

- `value = model<TwDateRange<D> | null>(null)` — consumer-facing.
- `internalValue = linkedSignal(() => value())` — decouples programmatic writes from user commits.
- `pendingRange = signal<TwDateRange<D> | null>(null)` — overlay-local draft; initialised from `internalValue` on open.
- `open = model(false)`; `closing = signal(false)` (mirror popover's leave-animation sequencing).
- `parseError = signal(false)` (reserved for future typed-entry; always false in v1).
- `rangeError = signal(false)` — drives `errorState`; set when `writeValue` receives out-of-range endpoints.
- `lastValueBeforeOpen = signal<TwDateRange<D> | null>(null)` — captured on open so Escape / Cancel can restore.
- `focused = signal(false)` — via `FocusMonitor.monitor(elementRef, true)`.
- `cvaDisabled = signal(false)`.
- `describedByIdsSignal = signal<readonly string[]>([])`.
- `leftActiveDate = signal<D>(...)` / `rightActiveDate = signal<D>(...)` — local per-calendar focus.
- `activePresetId = computed<string | undefined>(() => { const v = internalValue(); if (!v) return; return presets().find(p => rangesEqual(p.range(), v, adapter))?.id; })`.

### Display formatting

- `triggerDisplayText = computed(() => { const v = internalValue(); if (!v || (v.start === null && v.end === null)) return placeholder() ?? ''; const start = v.start ? adapter.format(v.start, effectiveFormat()) : emptyStartLabel(); const end = v.end ? adapter.format(v.end, effectiveFormat()) : emptyEndLabel(); return `${start}${rangeSeparator()}${end}`; });`.
- `effectiveFormat` — same computed pattern as `tw-date-picker`: fold hour/minute/seconds into the default format when `showTime` is true and consumer hasn't overridden `format`.

### Commit helper

```ts
private commit(next: TwDateRange<D> | null, source: DateRangePickerChangeSource): void {
  const previous = this.internalValue();
  const normalised = next && (next.start === null && next.end === null) ? null : next;
  this.internalValue.set(normalised);
  this.value.set(normalised);
  this.parseError.set(false);
  this.rangeError.set(false);
  if (source !== 'programmatic') {
    this.onChange(normalised);
    this.onTouched();
    this.announce(normalised);
  }
  this.rangeChange.emit({ value: normalised, previousValue: previous, source });
}
```

### Preset handling

```ts
private onPresetClick(preset: DateRangePreset<D>): void {
  const range = this.clampRange(preset.range());
  if (!this.isRangeValid(range)) {
    this.liveAnnouncer.announce(`${preset.label} is not available.`, 'polite');
    return;
  }
  this.pendingRange.set(range);
  this.presetSelected.emit(preset);
  if (!this.showActions() && !this.showTime()) {
    this.commit(range, 'preset');
    this.closeOverlay('select');
  }
}
```

### Range equality

Helper for the `activePresetId` computation:

```ts
function rangesEqual<D>(a: TwDateRange<D>, b: TwDateRange<D>, adapter: DateAdapter<D>): boolean {
  const startEq = (a.start === null && b.start === null) ||
    (a.start !== null && b.start !== null && adapter.sameDate(a.start, b.start));
  const endEq = (a.end === null && b.end === null) ||
    (a.end !== null && b.end !== null && adapter.sameDate(a.end, b.end));
  return startEq && endEq;
}
```

(`sameDate` exists on `DateAdapter`; confirm in `date-adapter.ts`.)

### Two-calendar pagination lockstep

```ts
onLeftActiveDateChange(next: D): void {
  const clamped = this.adapter.clampDate(next, this.minDate(), this.maxDate());
  this.leftActiveDate.set(clamped);
  const proposedRight = this.adapter.addCalendarMonths(clamped, 1);
  const clampedRight = this.adapter.clampDate(proposedRight, this.minDate(), this.maxDate());
  // Only move the right calendar if doing so does not violate maxDate.
  if (this.adapter.compareDate(clampedRight, clamped) > 0) {
    this.rightActiveDate.set(clampedRight);
  }
}

onRightActiveDateChange(next: D): void {
  /* mirror: set right, propose left = right - 1, skip if it drops below min */
}
```

Wire these to the calendar's `(activeDateChange)` — `activeDate` is a `linkedSignal` on the calendar, writable from outside.

### Overlay config forwarding

Mirror `DatePickerOverlayComponent`: expose signals for `size`, `color`, `minDate`, `maxDate`, `dateFilter`, `startView`, `numberOfMonths`, `pendingRange`, `presets`, `activePresetId`, `showActions`, `showTime`, `timeFormat`, `showSeconds`, `hourStep`, `minuteStep`, `secondStep`, `todayLabel`, `clearLabel`, `cancelLabel`, `applyLabel`, `dialogId`, `dialogAriaLabel`, `panelClassValue`, `leaving`, `leftActiveDate`, `rightActiveDate`. Plus callbacks: `onCalendarSelect`, `onStartTimeChange`, `onEndTimeChange`, `onToday`, `onClear`, `onCancel`, `onApply`, `onPresetSelect`, `onLeftActiveDateChange`, `onRightActiveDateChange`.

### Refs & injection

```ts
private readonly adapter = inject<DateAdapter<D>>(DATE_ADAPTER);
private readonly overlayService = inject(Overlay);
private readonly focusMonitor = inject(FocusMonitor);
private readonly liveAnnouncer = inject(LiveAnnouncer);
private readonly focusTrapFactory = inject(FocusTrapFactory);
private readonly elementRef = inject(ElementRef<HTMLElement>);
private readonly viewContainerRef = inject(ViewContainerRef);
private readonly injector = inject(Injector);
private readonly destroyRef = inject(DestroyRef);
private readonly formField = inject(FormFieldComponent, { optional: true });
private readonly ngControl = inject(NgControl, { optional: true, self: true });
private readonly parentForm = inject(NgForm, { optional: true });
private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);

private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
```

### ID generation

```ts
let nextDateRangePickerId = 0;
readonly hostId = `tw-date-range-picker-${nextDateRangePickerId++}`;
readonly dialogId = `${this.hostId}-dialog`;
```

### Template structure

Main component template (inline, ~35 lines):

```
<button
  #trigger
  type="button"
  [id]="hostId"
  [class]="triggerClasses()"
  [attr.role]="'combobox'"
  [attr.aria-haspopup]="'dialog'"
  [attr.aria-expanded]="open() ? 'true' : 'false'"
  [attr.aria-controls]="dialogId"
  [attr.aria-label]="triggerAccessibleName()"
  [attr.aria-labelledby]="ariaLabelledby() || null"
  [attr.aria-describedby]="describedBy() || null"
  [attr.aria-required]="required() || null"
  [attr.aria-invalid]="errorState() || null"
  [attr.aria-disabled]="isDisabled() || null"
  [disabled]="isDisabled()"
  (click)="onTriggerClick()"
  (keydown)="onTriggerKeydown($event)"
>
  @if (internalValue(); as v) {
    <span [class]="startTextClasses()">{{ displayStart(v) }}</span>
    <span [class]="separatorClasses()">{{ rangeSeparator() }}</span>
    <span [class]="endTextClasses()">{{ displayEnd(v) }}</span>
  } @else {
    <span [class]="placeholderClasses()">{{ displayPlaceholder() }}</span>
  }
</button>

@if (showClear() && !isEmpty() && !isDisabled()) {
  <button
    type="button"
    tabindex="-1"
    [class]="clearButtonClasses()"
    [attr.aria-label]="'Clear date range'"
    (click)="onClearClick($event)"
  >
    <!-- inline X SVG (copy from tw-date-picker) -->
  </button>
}

<button
  #triggerBtn
  type="button"
  [class]="triggerIconBtnClasses()"
  [attr.aria-label]="triggerAriaLabel()"
  [attr.aria-haspopup]="'dialog'"
  [attr.aria-expanded]="open() ? 'true' : 'false'"
  [attr.aria-controls]="dialogId"
  [attr.aria-disabled]="isDisabled() || null"
  [disabled]="isDisabled()"
  (click)="onTriggerIconClick()"
>
  <ng-content select="[slot=trigger-icon]">
    <!-- fallback calendar-range SVG -->
  </ng-content>
</button>
```

Host keeps `[class]="rootClasses()"`.

Overlay component template (inline, ~60 lines — extract to `date-range-picker-overlay.html` if it grows past 80):

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
  @if (presets().length) {
    <div [class]="presetListClasses()" role="listbox" aria-label="Preset ranges">
      @for (preset of presets(); track preset.id ?? preset.label) {
        <button
          twButton variant="ghost" size="sm"
          role="option"
          class="w-full justify-start"
          [attr.aria-selected]="preset.id === activePresetId() ? 'true' : 'false'"
          (click)="handlePreset(preset)"
        >
          {{ preset.label }}
        </button>
      }
    </div>
  }

  <div [class]="panelInnerClasses()">
    @if (hasHeaderSlot()) { <div [class]="panelHeaderClasses()"><ng-content select="[slot=overlay-header]" /></div> }

    <div [class]="calendarsClasses()">
      <tw-calendar
        selectionMode="range"
        [selected]="pendingRange()"
        [(activeDate)]="leftActiveDate"
        [startView]="startView()"
        [minDate]="minDate()"
        [maxDate]="maxDate()"
        [dateFilter]="dateFilter()"
        [color]="color()"
        [size]="size()"
        aria-label="Start calendar"
        (userSelection)="onCalendarSelection($event)"
        (viewChanged)="onViewChanged($event)"
      />
      @if (numberOfMonths() === 2 && !isNonMonthView()) {
        <div [class]="calendarDividerClasses()"></div>
        <tw-calendar
          selectionMode="range"
          [selected]="pendingRange()"
          [(activeDate)]="rightActiveDate"
          [startView]="startView()"
          [minDate]="minDate()"
          [maxDate]="maxDate()"
          [dateFilter]="dateFilter()"
          [color]="color()"
          [size]="size()"
          aria-label="End calendar"
          (userSelection)="onCalendarSelection($event)"
          (viewChanged)="onViewChanged($event)"
        />
      }
    </div>

    @if (showTime()) {
      <div [class]="timeRowClasses()">
        <div [class]="timeColumnClasses()">
          <span [class]="timeLabelClasses()">Start</span>
          <tw-time-picker
            variant="naked"
            [value]="pendingRange()?.start ?? null"
            [size]="size()"
            [color]="color()"
            [format]="timeFormat()"
            [showSeconds]="showSeconds()"
            [hourStep]="hourStep()"
            [minuteStep]="minuteStep()"
            [secondStep]="secondStep()"
            [showClear]="false"
            aria-label="Start time"
            (timeChange)="onStartTimeChange($event)"
          />
        </div>
        <div [class]="timeColumnClasses()">
          <span [class]="timeLabelClasses()">End</span>
          <tw-time-picker
            variant="naked"
            [value]="pendingRange()?.end ?? null"
            [size]="size()"
            [color]="color()"
            [format]="timeFormat()"
            [showSeconds]="showSeconds()"
            [hourStep]="hourStep()"
            [minuteStep]="minuteStep()"
            [secondStep]="secondStep()"
            [showClear]="false"
            aria-label="End time"
            (timeChange)="onEndTimeChange($event)"
          />
        </div>
      </div>
    }

    @if (hasFooterSlot()) { <div [class]="footerSlotClasses()"><ng-content select="[slot=overlay-footer]" /></div> }

    @if (showActions()) {
      <div [class]="actionBarClasses()">
        <div [class]="actionGroupClasses()">
          <button twButton variant="ghost" size="sm" type="button" (click)="handleToday()">{{ todayLabel() }}</button>
          @if (pendingRange() !== null) {
            <button twButton variant="ghost" size="sm" type="button" (click)="handleClear()">{{ clearLabel() }}</button>
          }
        </div>
        <div [class]="actionGroupClasses()">
          <button twButton variant="ghost" size="sm" type="button" (click)="handleCancel()">{{ cancelLabel() }}</button>
          <button twButton variant="solid" size="sm" type="button" (click)="handleApply()">{{ applyLabel() }}</button>
        </div>
      </div>
    }
  </div>
</div>
```

Use `contentChild()` in the outer component to detect projected `overlay-header` / `overlay-footer` content and forward a `TemplateRef` or a boolean signal to the overlay instance (CDK portal content doesn't share DOM with the outer template; the same pattern is used in `SelectOverlayComponent` — follow verbatim).

### Constraints during implementation

- No arrow functions in templates. Define helper methods (`onTriggerClick`, `handlePreset`, `onStartTimeChange`, …).
- No `ngClass` / `ngStyle`. Use `[class]` / `[style.*]`.
- No `@HostBinding` / `@HostListener` — `host:` object only.
- No `fakeAsync` / `tick` — Vitest. Use `async/await` + `fixture.whenStable()` and `vi.useFakeTimers()` / `vi.runAllTimers()` for the 150 ms close-animation timer.
- Never import `@angular/animations`.
- All class strings must be statically present (static `Record<TwColor, string>` lookups); no template-literal concatenation.
- Never call `new Date(...)` or `.toISOString()` — always go through the injected `DateAdapter`.

## File structure

Under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/date-range-picker/`:

- **`date-range-picker.ts`** — `DateRangePickerComponent<D>`, all public types (`DateRangePickerVariant`, `DateRangePickerChangeSource`, `DateRangePickerCloseReason`, `DateRangePickerChangeEvent`, `DateRangePickerOpenedEvent`, `DateRangePreset`). `tv()` config. Static color compound-variant lookups. Module-scoped `nextDateRangePickerId` counter. Overlay helpers (`buildPositions`, `resolveScrollStrategy`, `clampRange`, `rangesEqual`).
- **`date-range-picker-overlay.ts`** — private `DateRangePickerOverlayComponent` (not exported from `index.ts`). Contains the dialog template (preset list + one or two calendars + optional time row + optional header/footer slots + optional action bar). Receives config via signal-backed fields set from the outer component. Mirrors `DatePickerOverlayComponent`.
- **`date-range-picker-overlay.html`** — extract only if the overlay template grows past ~80 lines.
- **`date-range-picker.spec.ts`** — Vitest tests (see Testing plan below). No `fakeAsync`.
- **`index.ts`** — public API exports (see below).
- **`ng-package.json`** — `{ "lib": { "entryFile": "index.ts" } }`.

Update:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/date-range-picker';`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/angular.json` — verify ng-packagr auto-discovers the new `ng-package.json` (v21 setups do so by default).
- **No theme file edits.** `scale-in`/`scale-out`/`fade-in`/`fade-out` already exist in `projects/ngx-tw/theme/_base.css`.

## Public API exports

```ts
// projects/ngx-tw/date-range-picker/index.ts
export { DateRangePickerComponent } from './date-range-picker';
export type {
  DateRangePickerVariant,
  DateRangePickerChangeSource,
  DateRangePickerCloseReason,
  DateRangePickerChangeEvent,
  DateRangePickerOpenedEvent,
  DateRangePreset,
} from './date-range-picker';
```

`DateRangePickerOverlayComponent` is **not** exported — internal overlay host only. `TwDateRange` / `TwDateRangeInput` / `TwDateFilter` / `TwCalendarView` / `TimePickerFormat` are already exported from `ngx-tw/calendar` and `ngx-tw/core`; consumers import them from there.

## Testing plan

File: `date-range-picker.spec.ts`. Use explicit Vitest imports (`import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'`) and `ComponentFixture` / `TestBed` from Angular. Import `OverlayModule` and call `provideNativeDateAdapter()` in each test bed. Use `vi.spyOn()` for spies; `vi.useFakeTimers()` for the 150 ms close-animation timer; `await fixture.whenStable()` for async `ngModel` paths. No `fakeAsync`/`tick`.

Define small test hosts: `BasicHost`, `ReactiveFormsHost`, `TemplateDrivenHost`, `FormFieldWrappedHost`, `ActionBarHost`, `TimeModeHost`, `PresetsHost`, `SingleMonthHost`, `RangeConstrainedHost`.

### What to cover

**Rendering**
- Default render mounts without errors with no inputs.
- Each `size` (`xs`–`xl`) renders without errors.
- Each `color` renders without errors.
- `variant="default"` and `variant="naked"` render distinctly.
- Empty state shows composed placeholder (`emptyStartLabel rangeSeparator emptyEndLabel`).
- Populated state shows both endpoints joined by `rangeSeparator`.
- Partial value (`{ start: Date, end: null }`) shows `formattedStart rangeSeparator emptyEndLabel`.
- `numberOfMonths === 1` renders a single calendar; `numberOfMonths === 2` renders two + divider.
- Wrapped in `<tw-form-field>` without explicit `variant` → auto-naked.
- Disabled renders `aria-disabled="true"`, trigger cannot open.

**Calendar interaction**
- First click updates `pendingRange.start`, does NOT commit (spy on `rangeChange`).
- Second click inside the range commits (calendar reason `'select'`), emits `rangeChange` with `source: 'calendar'`, closes overlay.
- Auto-swap when second click lands before first (inherited from `DefaultDateRangeSelectionStrategy` — assert by clicking end < start).
- Hover preview: calendar's `previewStart`/`previewEnd` update while pending. (Trust the calendar; just assert that the picker doesn't interfere.)
- When `showActions=true`, second click does NOT close; `Apply` commits and closes with reason `'apply'`; `Cancel` restores and closes with reason `'cancel'`.

**Presets**
- Given a non-empty `presets` array, the preset list renders with each label.
- Clicking a preset commits (source: `'preset'`), emits `presetSelected`, closes when `!showActions` and `!showTime`.
- Active preset has `aria-selected="true"` when `internalValue` equals its range.
- Preset producing a range outside `[minDate, maxDate]` is skipped with a live-announcer call.

**Time mode**
- `showTime=true` renders two `<tw-time-picker>` instances (query by `aria-label`).
- Changing the start time emits `rangeChange` with `source: 'time'` (when `!showActions`).
- `adapter.withTime` is called with correct hour/minute arguments.
- `showTime=true` + `showActions=true`: time edits update `pendingRange` but do NOT commit until Apply.

**CVA / forms**
- Reactive forms: `FormControl.setValue(new TwDateRange(d1, d2))` updates the trigger display.
- Reactive forms: user-completed range calls the registered `onChange` with the new `TwDateRange`.
- `FormControl.disable()` applies disabled styling and blocks interaction.
- Template-driven: `[(ngModel)]` round-trip works after `await fixture.whenStable()`.
- Signal forms: `[control]="form.range"` commits on user completion.
- `writeValue(null)` clears display, emits `rangeChange` with `source: 'programmatic'` (same pattern as date-picker).
- `writeValue({ start: d1, end: d2 })` (plain object) is accepted and coerced to `TwDateRange`.
- `writeValue(new TwDateRange(d1, null))` (partial) is accepted and rendered as partial.
- `setDisabledState(true)` sets `isDisabled()` and `aria-disabled="true"`.

**Outputs**
- `opened` fires after the enter animation (advance with `vi.runAllTimers()`).
- `closed` fires with each correct `reason`.
- `rangeChange` fires exactly once per commit; payload includes `value`, `previousValue`, `source`.
- `presetSelected` fires with the preset object.

**Keyboard**
- Trigger focused + `Enter` / `Space`: opens.
- Trigger focused + `Alt+Down`: opens.
- Dialog focused + `Escape`: closes with `'escape'`, restores `lastValueBeforeOpen`, focus returns to trigger.
- Dialog focused + `Alt+Up`: closes with `'cancel'`.
- `Tab` inside dialog stays trapped.

**Accessibility**
- Trigger: `role="combobox"`, `aria-haspopup="dialog"`, `aria-expanded` reflects `open`, `aria-controls` matches dialog id.
- Dialog: `role="dialog"`, `aria-modal="true"`, `aria-label` set.
- Each calendar has a distinct `aria-label` (`"Start calendar"` / `"End calendar"` / `"Calendar"`).
- Preset list: `role="listbox"`; each preset: `role="option"` with `aria-selected`.
- Each time picker: `aria-label="Start time"` / `"End time"`.
- `aria-invalid="true"` appears when `errorState` is true.
- Dev-mode warning logged when no accessible name (`vi.spyOn(console, 'warn')`).
- `FocusMonitor.monitor` / `stopMonitoring` called; `FocusTrapFactory.create` and trap `destroy` called around each open/close.
- LiveAnnouncer called on user commits only (not programmatic writes).

**Form-field integration**
- `contentChild(TW_FORM_FIELD_CONTROL)` on the parent resolves to the range picker.
- `control.empty()` is false when any endpoint is set, true only when `internalValue` is null or both endpoints null.
- `control.errorState()` reflects matcher + `rangeError`.
- `setDescribedByIds(['x', 'y'])` updates the trigger's `aria-describedby` to `"x y"`.
- `onContainerClick` opens the overlay.

**Overlay lifecycle**
- Opening attaches; closing detaches after 150 ms (advance with `vi.runAllTimers()`).
- Destroying the component while open disposes the overlay cleanly.

**Adapter swap**
- A minimal stub adapter (records `format` / `compareDate` / `clampDate` / `withTime` / `addCalendarMonths` calls) proves all date operations go through the adapter. Grep the component source for `new Date(` and `.toISOString(` — both should be absent.

**Edge cases**
- Partial range round-trip through `writeValue`.
- Same-day range (`start === end`).
- Auto-swap via calendar when second click lands earlier than first.
- Preset producing out-of-range range is skipped.
- `numberOfMonths === 2` with `minDate` pinning left prev-button: right calendar paginates independently; lockstep skips when it would violate min.

## Open questions

All must be resolved by the implementer — mark each in the closing summary.

- **[CONFIRM] Typed range entry scope.** v1 does NOT support typing dates into the trigger (read-only button). Ship this way, or add two chained `<input>` elements as a second phase? Recommendation: ship v1 without typing; add `<tw-date-range-input>` as a follow-up primitive.
- **[CONFIRM] Backdrop click behaviour when `showActions=true`.** Cancel (restore) or apply (commit pending)? Recommendation: cancel — matches Material and the Apply-button's explicit role.
- **[CONFIRM] Date formatting library.** Use `Intl.DateTimeFormat` via the existing `NativeDateAdapter` (already supports `{ dateTimeFormat: Intl.DateTimeFormatOptions }`). No new formatting helper needed. Custom adapters (Luxon, date-fns) remain the consumer's path via `provideTwCalendar({ adapter })`.
- **[CONFIRM] Time mode: auto-swap `startTime` / `endTime` on same-day ranges when end < start?** Or set `rangeError`? Recommendation: set `rangeError` (silent correction is surprising).
- **[CONFIRM] `Clear` action semantics in the action bar.** Commit `null` immediately, or set `pendingRange = null` and wait for `Apply`? Recommendation: the latter — consistent with `Today` (stage, don't commit).
- **[CONFIRM] Preset active-state detection.** Use `preset.id` when present; otherwise structural equality via `rangesEqual`. Confirm `DateAdapter.sameDate` exists or add `sameDay` coverage via `compareDate === 0` at day-granularity.
- **[CONFIRM] View collapse during year/multi-year in 2-month layout.** Collapse to single calendar, or render both calendars in year view? Recommendation: collapse — Material does too, and side-by-side year grids are wasteful.
- **[CONFIRM] `min-w-[10rem]` on the preset list** — should the minimum width scale with `size`? The `xs` preset list may feel too narrow at 10rem × `text-xs`; consider `size`-driven widths in `tv()`.
- **[CONFIRM] Mobile viewport fallback.** Panel uses `max-w-[calc(100vw-16px)]`; verify the 2-month layout degrades gracefully on narrow viewports (< 640 px). Consider forcing `numberOfMonths = 1` below a breakpoint via a computed override. Defer to a follow-up if not critical for v1.
- **[CONFIRM] Re-export `TwDateRange` from `ngx-tw/date-range-picker`?** Strictly it lives in `ngx-tw/calendar`. Re-exporting saves consumers one import but creates two canonical export sites. Recommendation: do NOT re-export; keep `TwDateRange` in `ngx-tw/calendar` only, and document the import path in the prompt usage examples.

## Constraints

- Standalone component; do NOT set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush` on the component, the overlay component, and every directive.
- Signal APIs only: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`, `signal()`, `contentChild()`, `viewChild.required()`, `effect()`. No `mutate`. RxJS only for CDK-returned observables (`overlayRef.backdropClick()`, `overlayRef.keydownEvents()`, `ngControl.control.statusChanges`, `parentForm.ngSubmit`) — must use `takeUntilDestroyed`.
- `inject()` for DI — no constructor injection.
- `host:` object only — never `@HostBinding`/`@HostListener`.
- Native control flow (`@if`, `@for`, `@switch`); no `ngClass`/`ngStyle`; no arrow functions in templates.
- Tailwind utilities only, no CSS files. Semantic tokens (`primary-*`, `info-*`, …), surface/fg/border tokens for neutral structural styling. Never raw palette colors. Never raw `neutral-*` for structural styling.
- `tv()` includes `defaultVariants` and passes `{ twMerge: true }` as the second argument.
- All class strings statically present in source — static `Record<TwColor, string>` lookup tables, not template-literal concatenation.
- Visual tokens match CLAUDE.md's Visual Design System exactly: `rounded-md` on trigger icon button + preset buttons, `rounded-lg` on panel, `shadow-md` on floating panel, `transition-colors duration-200 motion-reduce:transition-none`, focus ring `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`, standard inline padding scale, `size-4`/`size-5` icons with `shrink-0`. No invented values.
- No `@angular/animations`. Overlay enter/leave uses `animate.enter="scale-in fade-in"` / `animate.leave="scale-out fade-out"` with existing keyframes in `projects/ngx-tw/theme/_base.css`.
- Every `input()`, `output()`, `model()`, exported type member, and public method has a one-line JSDoc.
- Strict typing — no `any`. Generic `D` propagates through value, model, events, calendar composition, preset factories, and time-picker composition.
- CVA on the component itself. Form-field integration via `TW_FORM_FIELD_CONTROL` token; auto-naked detection when a `FormFieldComponent` is injectable as an ancestor. Error state derived via `TW_ERROR_STATE_MATCHER` plus internal `rangeError`.
- All date operations through the injected `DateAdapter<D>`. No `new Date(...)`, no `.toISOString()`, no date-library imports.
- Range value type: `TwDateRange<D>` from `ngx-tw/calendar` — reused verbatim, not redefined.
- Vitest: `vi.spyOn()`, `async/await`, `fixture.whenStable()`, `vi.useFakeTimers()`. No `fakeAsync`/`tick`.
- Keyboard behaviour matches WAI-ARIA APG "Date Picker Dialog".
