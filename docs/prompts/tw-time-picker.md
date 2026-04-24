# tw-time-picker — implementation prompt

## Design research summary

Surveyed: Angular Material `mat-timepicker`, Radix/Shadcn time-picker recipe, Ant Design `TimePicker`, headless date libraries.

**Accepted patterns (what the industry does):**
- **Segmented numeric fields** (`HH : MM` + optional `: SS`, + optional `AM/PM`) are the desktop default. Each field is its own `role="spinbutton"`. Clock/wheel UIs are mobile-first and poor keyboard citizens — skip.
- **Keyboard model:** ArrowUp/Down steps the focused field by its configured step; ArrowLeft/Right moves between fields; Home/End clamp to min/max of the focused field; typing a digit overwrites the leading digit and auto-advances on the second.
- **12h vs 24h** is a user-facing toggle. Internally the value stays a `Date` and the 0–23 hour range is authoritative. 12h renders 1–12 + AM/PM; 0 ↔ 12 AM, 12 ↔ 12 PM.
- **Step support** on each unit (`minuteStep: 15` is the common meeting-scheduler pattern).
- **Min/Max** compare only the time-of-day portion when the date component of the stored `Date` can vary.
- **Live-announce** committed changes (CDK `LiveAnnouncer`) because the fields auto-advance.

## Component summary

`tw-time-picker` — a segmented time editor. Exposes three strategies:
1. **Standalone** — `<tw-time-picker [(ngModel)]="value" />`.
2. **Inside `<tw-form-field>`** — auto-hides its chrome, participates in error state and `describedby`.
3. **Embedded in `tw-calendar`** via the calendar's new `withTime` input, so `tw-date-picker` gets a date-plus-time picker for free.

Value type: `Date | null`. Every date arithmetic / parse goes through `DateAdapter<D>` from `ngx-tw/calendar`, so Luxon/date-fns swaps stay transparent.

## Entry point & files

- `projects/ngx-tw/time-picker/time-picker.ts`
- `projects/ngx-tw/time-picker/time-picker.spec.ts`
- `projects/ngx-tw/time-picker/index.ts`
- `projects/ngx-tw/time-picker/ng-package.json`
- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/time-picker';`
- `projects/ngx-tw/calendar/calendar-time-controls.ts` — internal, not exported (renders inline inside tw-calendar when `withTime` is true)
- `projects/ngx-tw/calendar/calendar.ts` — new `withTime`, `timeFormat`, `showSeconds`, `hourStep`, `minuteStep`, `secondStep` inputs

## Public types

```ts
export type TimePickerVariant = 'default' | 'naked';
export type TimePickerFormat = '12h' | '24h';
export type TimePickerField = 'hour' | 'minute' | 'second' | 'meridiem';

export type TimePickerChangeSource =
  | 'input'      // digit typed in a field
  | 'stepper'    // +/- button or ArrowUp/Down
  | 'meridiem'   // AM/PM toggle
  | 'clear'
  | 'programmatic';

export interface TimePickerChangeEvent<D> {
  readonly value: D | null;
  readonly previousValue: D | null;
  readonly source: TimePickerChangeSource;
}

export interface TimePickerInputEvent<D> {
  readonly field: TimePickerField;
  readonly rawText: string;
  readonly parsed: D | null;
}
```

## Inputs

| Name | Type | Default | Alias | Purpose |
|---|---|---|---|---|
| `idInput` | `string \| undefined` | auto (`tw-time-picker-N`) | `id` | Host id, used by `<label for>` |
| `disabledInput` | `boolean` | `false` | `disabled` | Disables all fields; sets `aria-disabled` |
| `requiredInput` | `boolean` | `false` | `required` | Sets `aria-required`; honours `Validators.required` |
| `readonlyInput` | `boolean` | `false` | `readonly` | Blocks typing and stepping; value still visible |
| `size` | `TwSize` | `'md'` | — | Field height, font size, stepper size |
| `color` | `TwColor` | `'primary'` | — | Focused-field border and focus ring |
| `variant` | `TimePickerVariant \| undefined` | auto (`'naked'` in form-field, else `'default'`) | — | Visual chrome |
| `format` | `TimePickerFormat` | `'24h'` | — | `'12h'` adds AM/PM toggle and renders hours 1–12 |
| `showSeconds` | `boolean` | `false` | — | Adds a seconds field |
| `hourStep` | `number` | `1` | — | Increment when stepping hours |
| `minuteStep` | `number` | `1` | — | Increment when stepping minutes |
| `secondStep` | `number` | `1` | — | Increment when stepping seconds |
| `minTime` | `D \| null` | `null` | — | Earliest time-of-day; sets `errorState` when violated |
| `maxTime` | `D \| null` | `null` | — | Latest time-of-day; sets `errorState` when violated |
| `referenceDate` | `D \| null` | `null` → today | — | Date portion used when constructing a `D` from time-only input |
| `placeholder` | `string \| undefined` | `undefined` | — | Shown when a field is empty |
| `showSteppers` | `boolean` | `true` | — | Toggle the up/down chevron buttons per field |
| `showClear` | `boolean` | `true` | — | Render clear affordance when value is set |
| `clearLabel` | `string` | `'Clear time'` | — | aria-label for the clear button |
| `errorStateMatcher` | `ErrorStateMatcher \| undefined` | — | — | Per-instance override |
| `ariaLabel` | `string \| undefined` | — | `aria-label` | Group name when no visible label |
| `ariaLabelledby` | `string \| undefined` | — | `aria-labelledby` | External label id |
| `userAriaDescribedByInput` | `string \| undefined` | — | `aria-describedby` | Preserved/merged by form-field |

> **[NOTE: input count]** This exceeds 5–6. The overlay-input exception in memory applies: time-picker is a composite form control and needs every axis.

## Two-way models

| Name | Type | Purpose |
|---|---|---|
| `value` | `D \| null` | Current selected time as a full `Date` (date portion = `referenceDate` at commit time) |

## Outputs

| Name | Payload | Fires when |
|---|---|---|
| `timeInput` | `TimePickerInputEvent<D>` | Any keystroke/stepper interaction, **before** commit |
| `timeChange` | `TimePickerChangeEvent<D>` | After a commit (digit + auto-advance, stepper, meridiem toggle, or clear) |

## Accessibility

- Host: `role="group"`, `aria-label`/`aria-labelledby`, `aria-disabled`, `aria-invalid` on error.
- Each numeric field: `role="spinbutton"`, `aria-label` (`Hours` / `Minutes` / `Seconds`), `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (rendered zero-padded).
- Meridiem toggle: two `<button type="button" aria-pressed>` buttons inside a `role="radiogroup"` with `aria-label="AM/PM"`. Space toggles.
- Stepper buttons: `aria-label` (`Increase hours`/`Decrease hours`/…), `tabindex="-1"` (mouse-only affordance; arrow keys handle keyboard).
- Clear button: `aria-label="Clear time"`, `tabindex="-1"`.
- LiveAnnouncer (`polite`) on commit: `{formatted} selected` / `Time cleared`.
- Focus ring pattern (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`) on every focusable field and button.
- Dev-mode warning when no accessible name provided (mirroring date-picker).

## Keyboard map

| Key | Behaviour |
|---|---|
| `ArrowUp` | Increment focused field by its step, wrapping around (23→00 etc.) |
| `ArrowDown` | Decrement focused field by its step, wrapping |
| `Shift+ArrowUp/Down` | Step × 10 (for hours × 10 → 5 to keep range sensible) |
| `Home` | Set focused field to its minimum (0, or 1 for 12h hour) |
| `End` | Set focused field to its maximum |
| `ArrowLeft` | Move focus to previous field |
| `ArrowRight` | Move focus to next field |
| Digit (`0-9`) | Overwrite leading digit; second digit auto-advances to next field |
| `Backspace` / `Delete` | Clear focused field back to placeholder |
| `Tab` / `Shift+Tab` | Native tab traversal between fields and AM/PM toggle |

## tv() config sketch

```ts
const timePickerVariants = tv({
  slots: {
    root: 'inline-flex items-center gap-1 text-fg transition-[color,border-color] duration-200 motion-reduce:transition-none',
    fieldGroup: 'inline-flex items-center gap-0 tabular-nums font-medium',
    field: 'bg-transparent text-center outline-none border-0 p-0 m-0 text-fg placeholder:text-fg-subtle rounded-sm caret-transparent selection:bg-primary-500/20 focus-visible:bg-surface-muted',
    separator: 'text-fg-subtle select-none',
    stepperGroup: 'flex flex-col',
    stepper: 'inline-flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-muted rounded-sm transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-40 disabled:pointer-events-none',
    meridiem: 'inline-flex items-center rounded-md border border-border overflow-hidden ml-1 shrink-0',
    meridiemButton: 'px-2 py-1 text-xs font-medium text-fg-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200 motion-reduce:transition-none aria-pressed:bg-primary-500 aria-pressed:text-primary-50',
    clearButton: 'inline-flex items-center justify-center shrink-0 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none size-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
  },
  variants: {
    size: { xs: {...}, sm: {...}, md: {...}, lg: {...}, xl: {...} },
    variant: {
      default: { root: 'rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong' },
      naked: { root: 'bg-transparent border-0 rounded-none p-0' },
    },
    disabled: { true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' }, false: {} },
    focused: { true: {}, false: {} },
    errorState: { true: {}, false: {} },
    color: { primary, secondary, accent, neutral, info, success, warning, error },
  },
  compoundVariants: [
    // default + focused → colored border per color
    // default + errorState → error-500 border
  ],
  defaultVariants: { size: 'md', variant: 'default', disabled: false, focused: false, errorState: false, color: 'primary' },
}, { twMerge: true });
```

## ControlValueAccessor

- `NG_VALUE_ACCESSOR` wired via `forwardRef` — except when `NgControl` is injected with `{ self: true }`, in which case the accessor is assigned manually (same pattern as date-picker).
- `writeValue(value)` coerces via `DateAdapter.deserialize`, falls back to `referenceDate` for the date portion when the incoming value is time-only.
- `registerOnChange`, `registerOnTouched`, `setDisabledState` — standard.

## FormFieldControl

Extend `FormFieldControl<D>` so `<tw-form-field>` can host the component and float labels, wire `aria-describedby`, and surface error state. `controlType = 'time-picker'`. Auto-resolves `variant` to `'naked'` when wrapped.

## Calendar integration

New inputs on `tw-calendar`:

| Name | Type | Default | Purpose |
|---|---|---|---|
| `withTime` | `boolean` | `false` | When true, renders time controls under the month view |
| `timeFormat` | `TimePickerFormat` | `'24h'` | Forwarded to inline time controls |
| `showSeconds` | `boolean` | `false` | Forwarded |
| `hourStep` / `minuteStep` / `secondStep` | `number` | `1` | Forwarded |
| `minTime` / `maxTime` | `D \| null` | `null` | Forwarded |

Implementation: inline `<tw-calendar-time-controls>` component renders below the month-view grid when `withTime()` is true. It operates on the calendar's `selected` signal — wraps the time components while preserving the date component of the current selection, or applies today's date if no selection exists yet.

`tw-date-picker` needs no API change — the `withTime` capability flows through as an existing passthrough via the overlay's `<tw-calendar>` bindings. The date-picker's `format` input will honour `timeStyle` when consumers provide it, so the input display correctly reads "Apr 21, 2026, 3:45 PM".

## Tests (spec checklist)

- Renders with no inputs (value `null`, shows placeholder)
- Each size/variant/color renders without errors
- Typing `1`, `4` in hours sets hour to 14 (24h) or 2 PM (12h) and advances focus
- ArrowUp wraps from 23 → 0 (24h) and from 12 → 1 (12h) on hours
- `minuteStep: 15` — ArrowUp from 10 → 25 (step-aligned)
- Min/Max time → typing an out-of-range time sets `errorState`
- AM/PM toggle flips the stored hour by ±12 and emits `timeChange`
- Clear button resets value to `null` and emits with `source: 'clear'`
- Disabled state blocks input/stepper/meridiem interactions and emits nothing
- Reactive form: `FormControl.value` updates on commit; `writeValue(new Date(2026,0,1,9,30))` populates fields
- Template-driven `[(ngModel)]`: round-trip works
- Signal form: set via `form.getControl()` value; component updates
- AXE-style a11y checks: `role="spinbutton"` on each field, `aria-valuenow`/`aria-valuetext` update
- Focus ring present on focus-visible
- Inside `<tw-form-field>`: variant auto-resolves to `'naked'`; error state flows through
- **Calendar integration tests**: `withTime=true` renders time controls; changing hour on the controls updates `selected` while preserving the day

## Animations

None required. Field focus uses `transition-colors duration-200`. No enter/leave.

## Open decisions (resolved here)

- **Value type = Date (via DateAdapter).** Alternative `{hours, minutes, seconds}` was rejected — complicates CVA, breaks calendar fusion.
- **Default format = '24h'.** Locale-aware default was rejected for determinism; consumers pick `'12h'` explicitly.
- **Stepper buttons default on.** They cost little and are a clear affordance; hide via `showSteppers=false`.
- **Step 0 is invalid.** Clamp to 1 with a dev-mode warning.
- **Wrapping on ArrowUp past max** — chosen (matches Material). For bounded ranges (`minTime`/`maxTime`) wrapping still occurs but commits are rejected into errorState.
