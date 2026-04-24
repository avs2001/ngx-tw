# tw-input / tw-textarea — attribute directive

## Goal

A single attribute directive that adapts any native `<input>` or `<textarea>`
into a first-class ngx-tw form-field-compatible control. It mirrors the
`MatInput` design from Angular Material, but stays signal-based.

- Works standalone (default text-input styling via `tv()`).
- Works inside `<tw-form-field>` (strips its own chrome, lets form-field paint
  the container and float the label).
- Extensible by two independent mechanisms (see below).

## Selector

`input[twInput], textarea[twInput]`

Attribute selector so it attaches to native elements. No wrapper `<div>`.

## Class name

`InputDirective` (Angular CLI naming; the `twInput` selector provides prefix).

## Extension layers

### Layer 1 — completely custom form-field control
Already supported by the library: any directive/component can
`extends FormFieldControl<T>` and provide itself under `TW_FORM_FIELD_CONTROL`.
Used by `tw-select` today; will be used by a future datepicker trigger,
autocomplete, combobox.

### Layer 2 — swap the value source on an existing `<input twInput>`
New: `TW_INPUT_VALUE_ACCESSOR` injection token.

```ts
export const TW_INPUT_VALUE_ACCESSOR = new InjectionToken<{
  value: unknown | WritableSignal<unknown>;
}>('TW_INPUT_VALUE_ACCESSOR');
```

Directives that wrap an `<input twInput>` — e.g. a masked-input directive or a
datepicker that parses the text — can provide themselves as this token. The
`InputDirective` then reads value from the accessor's `value` property
(supports both plain values and `WritableSignal`) instead of the native
element. Same role as Material's `MAT_INPUT_VALUE_ACCESSOR`.

### Layer 3 — when to show errors
New: `TW_ERROR_STATE_MATCHER` token in `ngx-tw/core` with a default strategy
(`invalid && (dirty || touched || submitted)`). Consumers override at any
injector level, or per-instance via the `errorStateMatcher` input.

## Inputs

| Input | Type | Default | Notes |
|---|---|---|---|
| `id` | `string` | generated `tw-input-N` | Aliased; used by form-field label `for` |
| `type` | `string` | `'text'` | Dev-mode throws on `checkbox`, `radio`, `submit`, etc. |
| `disabled` | `boolean` | `false` | Falls back to `ngControl.disabled` |
| `required` | `boolean` | `false` | Falls back to `Validators.required` presence |
| `readonly` | `boolean` | `false` | Native attribute |
| `errorStateMatcher` | `ErrorStateMatcher \| undefined` | `undefined` | Per-instance override |
| `aria-describedby` | `string \| undefined` | `undefined` | Consumer ids, merged by form-field |

No `placeholder` input — consumers set `placeholder="..."` directly on the
native element. (Avoids a pointless pass-through.)

## Outputs

None. Value/focus/blur events are the native events — consumers subscribe to
them as they would any `<input>`.

## FormFieldControl implementation (signals)

- `id` — from `idInput()` or generated uid.
- `value` — derived from value accessor (if provided) or native element value;
  re-read on every `input` event.
- `focused` — driven by CDK `FocusMonitor`.
- `empty` — `!value` (plus `neverEmpty` types: date, datetime-local, month,
  time, week).
- `disabled` — `disabledInput() || ngControl?.disabled`.
- `required` — `requiredInput() || Validators.required present`.
- `errorState` — matcher applied to current `ngControl.control` + parent form's
  `submitted`. Recomputes on statusChanges, valueChanges, blur, and form submit.
- `controlType` — `'input'` or `'textarea'` depending on element tag.
- `userAriaDescribedBy` — from `aria-describedby` input.
- `setDescribedByIds(ids)` — writes `aria-describedby` on the native element.
- `onContainerClick()` — focuses the element if not already focused.

## Autofill

Uses CDK `AutofillMonitor`. When browser autofill triggers, `empty` becomes
false so the floating label behaves correctly.

## No ControlValueAccessor

The directive does not implement CVA. Angular's built-in accessors
(`DefaultValueAccessor`, `NumberValueAccessor`, `RangeValueAccessor`) already
attach to native `<input>`/`<textarea>` and integrate with all three forms
strategies (template-driven, reactive, signal-forms). We only observe
`NgControl` — we never replace it.

## Styling

`tv()` config with two branches:

- `inFormField: false` — rounded-md border, px-4 py-2, hover/focus ring, error
  state shows `border-error-500` + `outline-error-500`.
- `inFormField: true` — no border, no padding, no background; form-field owns
  the container chrome.

Detected via `inject(FormFieldComponent, { optional: true })`.

## Host bindings

- `[class]` — tv() classes
- `[attr.id]` — id signal
- `[attr.type]` — only for input (not textarea)
- `[disabled]` — disabled()
- `[attr.aria-invalid]` — errorState() || null
- `[attr.aria-required]` — required() || null
- `(input)` — update value signal
- `(blur)` (via FocusMonitor) — bump error-state trigger

`aria-describedby` is managed imperatively via `setDescribedByIds` — not bound
via host — so form-field can assemble hint/error ids without conflict.

## Tests

- Default render on input and textarea without errors
- `empty` flips to false when user types
- `focused` reflects FocusMonitor origin
- `disabled` input applies native disabled attribute
- `required` signal derives from input OR `Validators.required` on NgControl
- `type` input syncs to native attribute; dev throws on invalid types
- Standalone: input paints its own border; error state turns border red
- Inside `<tw-form-field>`: no self-border; form-field drives label float
- `errorState` flips when control becomes invalid + touched
- Custom `ErrorStateMatcher` via per-instance input
- `TW_INPUT_VALUE_ACCESSOR` provider swaps value source
- `setDescribedByIds` writes `aria-describedby` on the host element
- Works with template-driven `[(ngModel)]`, reactive `[formControl]`

## Files

- `projects/ngx-tw/core/error-state-matcher.ts`
- `projects/ngx-tw/core/index.ts` (update)
- `projects/ngx-tw/input/input.ts`
- `projects/ngx-tw/input/input.spec.ts`
- `projects/ngx-tw/input/index.ts`
- `projects/ngx-tw/input/ng-package.json`
- `projects/ngx-tw/src/public-api.ts` (update)
