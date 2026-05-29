# Prompt: Build `twNumberInput` + `tw-number-stepper` for ngx-tw

> Source of truth: this document. Read it end-to-end before opening any code file.

---

## Context

Before writing code, read:

- `.claude/CLAUDE.md` — directive selector convention (`tw` camelCase prefix for attribute selectors), class-naming rule (no `Tw` prefix on the class identifier; `Tw` only on hand-authored **types**), `host` bindings rule (no `@HostBinding` / `@HostListener`), signal API rules (`computed()` vs `linkedSignal()`, **no signal cycles in `effect()`**), JSDoc requirements, CVA runtime-vs-static discriminator (the "ControlValueAccessor" section), input-count cap (directives are **not** in the codified exception list → keep to ≤ 5–6 inputs), Visual Design System (icon sub-scales — glyph scale for the chevrons; note the stepper **buttons** deliberately leave the square-interactive scale, see the `tv()` sizing rationale below — focus rings, transitions / `duration-normal`, `text-2xs`).
- `projects/ngx-tw/input/input.ts` — **THE composition base.** Note especially:
  - selector `input[twInput], textarea[twInput]`;
  - the exported `TW_INPUT_VALUE_ACCESSOR` token (`{ value: unknown | WritableSignal<unknown> }`) and how `_value` / `empty` / float-label state reads through it: the `isSignal(this.valueAccessor.value)` `effect()` (input.ts:322-327) and `_currentValue()` (input.ts:429-436);
  - that it injects `TW_INPUT_VALUE_ACCESSOR` with `{ optional: true, self: true }` (input.ts:180-183);
  - that InputDirective injects its **own** `NgControl { optional, self }` for matcher / error-state, and **does not implement `ControlValueAccessor`** (it relies on Angular's native value accessors attaching to the element);
  - the `[attr.type]` host binding bound to `type()` defaulting to `'text'`;
  - that the `readonly` input is mirrored onto the native `readonly` attribute via an **`effect()`** that runs **after** construction (input.ts:330-337) — this timing matters for the `readonly` signal source (see Implementation notes);
  - the host bindings it owns (do not duplicate): `[class]`, `[attr.id]`, `[attr.type]`, `[disabled]`, `[attr.aria-invalid]`, `[attr.aria-required]`, `(input)`.
- `projects/ngx-tw/input/index.ts` and `projects/ngx-tw/input/ng-package.json` — secondary-entry-point boilerplate to copy.
- `projects/ngx-tw/time-picker/time-picker.ts` — **canonical stepper / spinbutton precedent.** Mirror precisely:
  - `role="spinbutton"` + `inputmode="numeric"` on a text input, with `aria-valuemin` / `aria-valuemax` / `aria-valuenow` / `aria-valuetext` (time-picker.ts:266-276). Note its `*ValueText()` computeds (time-picker.ts:612-633) return a **non-null** `emptyValueText` (`'Empty'`, time-picker-intl.ts:70) when the field is blank — i.e. the precedent **always supplies a non-null `aria-valuetext`**; only `aria-valuenow` is dropped when empty;
  - the stepper button column: `stepperGroup` / `stepper` / `stepperIcon` tv slots (time-picker.ts:113-115, 338-371), `onStepperMouseDown` (preventDefault to keep focus), `onStepperClick` (steps **then** refocuses the input via `el?.focus()`, time-picker.ts:983-992 — the **refocus lives in the stepper handler, not in the step method**). **Sizing:** the column must **fit the field height, not bloat it** — two stacked square buttons (`size-6`/`size-8`) make the column 2× a button tall and grow the field. Instead the group is `flex flex-col self-stretch` and each button is `flex-1` with a **width-only** per-size class (`w-6`/`w-7`/`w-8`); height comes from `flex-1`, the `size-3` / `size-4` glyph chevron's min-content is the natural floor (do **not** add `min-h-0`). The companion's host carries `flex self-stretch` so it stretches in both an `items-stretch` standalone row and an `items-center` form-field `[twSuffix]` slot;
  - `type="button"`, `tabindex="-1"` on each stepper button (the spinbutton input owns value semantics; APG keyboard stepping lives on the input);
  - `stepWithWrap` / `clamp` usage shape (but see Implementation notes — number-input needs its **own** clamp/round/parse, not the time-utils helpers).
- `projects/ngx-tw/segmented-control/segmented-control.ts` (line 215) and `projects/ngx-tw/calendar/calendar.ts` (line 137) — **the static-`NG_VALUE_ACCESSOR` precedents.** Copy their provider shape (static `NG_VALUE_ACCESSOR` + `forwardRef`). They use it precisely because they do **not** inject `NgControl { self }` for matcher integration — exactly number-input's situation.
- `projects/ngx-tw/form-field/form-field.ts` + `projects/ngx-tw/form-field/form-field.html` — the `[twPrefix]` / `[twSuffix]` / `[twPrefixIcon]` / `[twSuffixIcon]` projection slots (form-field.html lines 2-8); the stepper companion mounts into `[twSuffix]`. The `TW_FORM_FIELD_CONTROL` contract is **already satisfied by the sibling InputDirective** — `NumberInputDirective` does **not** re-implement `FormFieldControl`.
- `projects/ngx-tw/core/types.ts` and `projects/ngx-tw/core/error-state-matcher.ts` — `TwColor`, `TwSize`, `ErrorStateMatcher`, `TW_ERROR_STATE_MATCHER`. (number-input needs only `TwSize`; error-state stays on the sibling InputDirective.)

CDK modules to import: **none.** Pure DOM — no overlays, no focus traps, no `LiveAnnouncer`. The `role="spinbutton"` input already exposes value semantics to assistive tech; native key-repeat covers held arrows; format/parse is pure `Intl.NumberFormat` + string work.

---

## What to build

Two artifacts in **one** secondary entry point (`projects/ngx-tw/number-input/`), following the file-upload precedent of multiple exports per entry point:

1. **`NumberInputDirective`** — an attribute directive (`selector: 'input[twNumberInput]'`, `exportAs: 'twNumberInput'`) that turns a plain `<input twInput twNumberInput>` into a robust numeric field **without** `type="number"`. It:
   - implements `ControlValueAccessor` so the form value round-trips as a real `number | null` (not a string);
   - parses the displayed text → `number | null` on every keystroke, formats `number → string` via `Intl.NumberFormat` on blur / Enter / stepper;
   - adds `inputmode`, `role="spinbutton"`, and `aria-value*` semantics;
   - handles ArrowUp/Down/Home/End/Enter keyboard stepping, with `min` / `max` clamping and `step` increments;
   - exposes `increment()` / `decrement()` and a readonly `value: Signal<number | null>` for non-form / template-ref use.
2. **`NumberStepperComponent`** — a tiny companion (`selector: 'tw-number-stepper'`, `exportAs: 'twNumberStepper'`) that renders the up/down spinner button column and calls `for().increment()` / `for().decrement()` then refocuses the input via `for().focus()`. A directive cannot emit sibling DOM, so the visible spinner buttons live here. It carries the `twSuffix` attribute so `<tw-form-field>` slots it; it also works standalone inside a consumer flex wrapper.

Together they replace the broken-on-mobile, browser-inconsistent `<input type="number">`: real spinner buttons, arrow-key step, min/max clamping, correct `inputmode`, and locale-aware formatted display.

### What it does NOT do

- Does **not** set `type="number"` — the input stays `type="text"` (InputDirective's default) so the mobile keyboard and formatting are fully controlled. Do not change `type`.
- Does **not** re-implement error-state / `FormFieldControl` / `TW_ERROR_STATE_MATCHER` — those stay on the sibling `InputDirective`. The number-input directive injects **no** `NgControl`.
- Does **not** change value on mouse-wheel scroll. The native `type="number"` wheel-to-change behavior is a deliberate omission (a well-known footgun). Do not bind `(wheel)`.
- Does **not** support currency *parsing* of symbol-prefixed text beyond what locale-aware separator stripping covers in v1 (see Formatting & parsing) — currency *display* via `Intl.NumberFormat` is supported.
- Does **not** support `style: 'percent'` in v1. `Intl` percent scales the value ×100, which would require the parser to divide by 100 and the focused-edit display to show the un-scaled percent number — out of scope for v1 (see Open decisions). Plain/grouped/decimal and currency styles are unaffected.
- Does **not** ship hold-to-repeat on the stepper buttons (single step per click in v1 — see Open decisions).
- Does **not** add a `disabled` / `readonly` input — `InputDirective` already owns those on the same element. The directive *reads* them and exposes readonly signals for the stepper.

---

## File layout

Create under `projects/ngx-tw/number-input/`:

| File | Role |
|---|---|
| `number-input.ts` | `NumberInputDirective` — selector `input[twNumberInput]`, `exportAs: 'twNumberInput'`, the 5 inputs, CVA impl, parse/format/clamp/round helpers (inline), `displayText` signal, `value` numeric signal, keyboard handling, host bindings. No `tv()`. |
| `number-stepper.ts` | `NumberStepperComponent` — selector `tw-number-stepper`, `exportAs: 'twNumberStepper'`, the `for` input, the `size` input, the `tv()` slot config, up/down button template. |
| `number-input.spec.ts` | Vitest suite for the directive — see Test plan. |
| `number-stepper.spec.ts` | Vitest suite for the stepper — see Test plan. |
| `index.ts` | Re-exports `NumberInputDirective`, `NumberStepperComponent`, and any public types. |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |

(One `.spec.ts` per artifact keeps each suite focused; both are matched by the `number-input/**/*.spec.ts` glob in the registration edits below.)

---

## Public types (exported from `index.ts`)

The directive needs **no** new exported type beyond Angular / TS built-ins:

- `min` / `max` / `step` are `number`.
- `format` is the built-in `Intl.NumberFormatOptions`.
- `locale` is `string`.

So `index.ts` exports only the two classes:

```ts
export { NumberInputDirective } from './number-input';
export { NumberStepperComponent } from './number-stepper';
```

If, during implementation, a small shared shape proves useful (e.g. a `NumberStepperSize` alias), prefer reusing `TwSize` from `@cdevhub/ngx-tw/core` rather than minting a new exported type.

---

## Selector & class names

- `NumberInputDirective` — attribute selector `[twNumberInput]` (consumer writes `<input twInput twNumberInput>`); `exportAs: 'twNumberInput'`; class name `NumberInputDirective` (no `Tw` prefix on the class).
- `NumberStepperComponent` — element selector `tw-number-stepper`; `exportAs: 'twNumberStepper'`; class name `NumberStepperComponent`.

---

## Provider declarations (exact)

`NumberInputDirective` declares **two** providers. This is the crux of the whole design — copy the shape verbatim:

```ts
@Directive({
  selector: 'input[twNumberInput]',
  exportAs: 'twNumberInput',
  providers: [
    // Custom CVA — transports a real `number | null`, not a string.
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputDirective),
      multi: true,
    },
    // Lets the sibling InputDirective read the *formatted display text* for its
    // empty / float-label logic. Exposes a signal so InputDirective's
    // `isSignal(value)` effect (input.ts:322-327) keeps `_value` self-healing.
    {
      provide: TW_INPUT_VALUE_ACCESSOR,
      useFactory: (dir: NumberInputDirective) => ({ value: dir.displayText }),
      deps: [forwardRef(() => NumberInputDirective)],
    },
  ],
  host: { /* see Accessibility */ },
})
export class NumberInputDirective implements ControlValueAccessor { /* … */ }
```

Import `NG_VALUE_ACCESSOR` and `ControlValueAccessor` from `@angular/forms`; `TW_INPUT_VALUE_ACCESSOR` from `@cdevhub/ngx-tw/input`; `forwardRef` from `@angular/core`.

**DI-ordering reassurance:** InputDirective requests `TW_INPUT_VALUE_ACCESSOR` with `{ self: true }` (input.ts:180-183). Because it is `self`-scoped, Angular must instantiate `NumberInputDirective` on the same element to satisfy the `useFactory` `deps`, so `displayText` (a class-field initializer, `signal<string>('')`) is guaranteed initialized **before** the factory returns the `{ value: dir.displayText }` object — there is no ordering hazard. InputDirective's `isSignal(value)` effect (input.ts:322-327) then track-reads that signal normally.

`NumberStepperComponent` declares **no** providers.

---

## Value-accessor composition (the crux — read twice)

On a `type="text"` input, Angular's built-in `DefaultValueAccessor` transports the value as a **string**. To round-trip a real `number | null`, `NumberInputDirective` must itself implement `ControlValueAccessor`:

- on user input → parse the display string → `number | null`, call `onChange(number | null)`;
- on `writeValue(number | null)` → format to a display string and write it into the input element.

**Registration is static `NG_VALUE_ACCESSOR` (multi: true)** — *not* the runtime `ngControl.valueAccessor = this` pattern. The discriminator (CLAUDE.md "ControlValueAccessor"): the runtime pattern is required **only** when the control injects `NgControl { self }` for matcher integration. `NumberInputDirective` injects **no** `NgControl` — error-state / matcher is already owned by the sibling `InputDirective` on the same element. With no self-`NgControl`, static `NG_VALUE_ACCESSOR` is clean and avoids the circular-DI trap. A custom `NG_VALUE_ACCESSOR` takes precedence over the built-in `DefaultValueAccessor`, so there is **no** "more than one value accessor" error.

DI chain (verify it is acyclic during implementation): `InputDirective` → injects `NgControl { self }` → resolves `NG_VALUE_ACCESSOR` → finds `NumberInputDirective` (the lone custom accessor). `InputDirective` provides no accessor; `NumberInputDirective` injects no `NgControl`. No cycle.

> **Static-CVA precedent in-repo:** `segmented-control.ts` (line 215) and `calendar.ts` (line 137) already provide a static `NG_VALUE_ACCESSOR` with `forwardRef`, precisely because they do **not** inject `NgControl { self }` for matcher integration. Copy their provider shape. The CHANGELOG codifies the discriminator (`projects/ngx-tw/CHANGELOG.md` ~lines 122-134): controls that integrate `TW_ERROR_STATE_MATCHER` via `inject(NgControl, { self: true })` MUST use runtime registration; controls that don't (the `input` / `textarea` carve-out, and now number-input) may use static `NG_VALUE_ACCESSOR`. number-input belongs in the second group because the matcher stays on the sibling `InputDirective`. Add an inline comment on the provider noting that the directive injects **no** `NgControl` — that is the entire reason static registration is legal here. (Do not imply number-input is the first to use the static pattern; it follows segmented-control / calendar.)

The **two** value surfaces are intentionally distinct and must not be conflated:

| Surface | Type | Who reads it | Why |
|---|---|---|---|
| Public `value` (`exportAs`) + CVA value | `Signal<number \| null>` / `number \| null` | consumers via template ref; Angular forms via `onChange` | the real numeric model |
| `displayText` (via `TW_INPUT_VALUE_ACCESSOR.value`) | `WritableSignal<string>` | the sibling `InputDirective` only | so `empty` / float-label reflect the **formatted text in the box**, including intermediate states like `'-'`, `'1.'`, `'-.'` where the numeric model is `null` but the field is visibly non-empty |

**Do NOT `useExisting: NumberInputDirective` for `TW_INPUT_VALUE_ACCESSOR`** — that would make the token's `.value` equal the directive's `.value` (the numeric signal), which would (a) feed a number into InputDirective's string-stringify path and (b) report the field as *empty* during intermediate typing (model `null`), making the float-label drop down over the text the user is mid-typing. The `useFactory` adapter exposing `displayText` is the correct wiring. `displayText` is `signal<string>('')` and is updated on **every** mutation of the field text (keystroke, writeValue, stepper, blur-reformat).

> **Why this diverges from the only in-repo `TW_INPUT_VALUE_ACCESSOR` example.** `input.spec.ts`'s `TestAccessorDirective` registers the token with `useExisting` because **its own `value` field IS the display string** — token value and accessor value are the same thing there. Here the directive's `value` field is the **numeric model**, a different shape from the display string, so a `useFactory` adapter exposing the separate `displayText` signal is **mandatory**. Do **not** "match the in-repo precedent" and regress to `useExisting` — that reintroduces the float-label-drops-over-mid-typed-text bug described above.

---

## `type="number"` avoidance & a11y semantics

The input stays `type="text"` — do **not** set `type="number"` (let InputDirective's default stand). The directive adds, via its `host` block:

- `[attr.inputmode]` → `'numeric'` when the resolved format is integer-only (`format()?.maximumFractionDigits === 0`), else `'decimal'`. (Default — no `format` — is `'decimal'`.)
- `role="spinbutton"`.
- `[attr.aria-valuemin]` → `min() ?? null`.
- `[attr.aria-valuemax]` → `max() ?? null`.
- `[attr.aria-valuenow]` → the numeric model `value() ?? null` (dropped when empty / unparseable; see verification note below).
- `[attr.aria-valuetext]` → the formatted display string, **always non-null**: `displayText() || 'Empty'` (a plain literal — see i18n note in Open decisions).

**`aria-valuenow` when empty — verify against axe-core.** ARIA 1.2 permits an indeterminate spinbutton to omit `aria-valuenow`, so `value() ?? null` (attribute dropped when empty) is correct per spec. But axe-core behavior is not assumed here: **verify the empty-state spinbutton against axe-core during implementation.** If axe-core's `aria-required-attr` flags the missing `aria-valuenow`, fall back to binding `aria-valuenow` to `min ?? 0` when empty (and update the empty-state test accordingly). Do not assume; confirm empirically.

**`aria-valuetext` is always supplied** (this mirrors time-picker's *pattern of always providing a non-null `aria-valuetext`*, time-picker.ts:266-276 + the `*ValueText()` computeds at 612-633 which return `emptyValueText` when blank — **not** the dropped-when-empty `?? null` pattern). number-input uses a plain literal `'Empty'` instead of an Intl service. So bind `displayText() || 'Empty'`, never `displayText() || null`.

**No host-binding collision** (verify): `InputDirective` binds `[class]`, `[attr.id]`, `[attr.type]`, `[disabled]`, `[attr.aria-invalid]`, `[attr.aria-required]`, `(input)`. `NumberInputDirective` adds `[attr.inputmode]`, `role`, `[attr.aria-valuemin/max/now/text]`, and **its own** `(input)`. Do **not** re-bind `aria-invalid` / `aria-required` / `type` / `disabled` / `id` — InputDirective owns them. Two `(input)` handlers on the same element coexist fine (both fire).

---

## API design

### Inputs

The directive is **not** in any input-count exception list. The set is **5** — within cap. Justify any addition before adding it.

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `min` | `number \| undefined` | `undefined` | `Smallest accepted value. Clamps the committed value (on blur, Enter, and stepping) and sets aria-valuemin. Does not clamp per keystroke. Defaults to undefined (no lower bound).` |
| `max` | `number \| undefined` | `undefined` | `Largest accepted value. Clamps the committed value (on blur, Enter, and stepping) and sets aria-valuemax. Does not clamp per keystroke. Defaults to undefined (no upper bound).` |
| `step` | `number` | `1` | `Amount added or subtracted by ArrowUp/ArrowDown and the stepper buttons. Enter-after-edit is unaffected. Defaults to 1. Values <= 0 or non-finite fall back to 1.` |
| `format` | `Intl.NumberFormatOptions \| undefined` | `undefined` | `Intl.NumberFormat options driving the blurred display (grouping, decimals, currency). The formatter's resolved maximumFractionDigits also sets commit-time rounding precision and switches inputmode to 'numeric' when it is 0. Percent style is not supported in v1. Defaults to undefined (locale default number formatting, grouping on).` |
| `locale` | `string \| undefined` | `undefined` | `BCP-47 locale for Intl.NumberFormat formatting and for locale-aware parsing (decimal and group separators). Defaults to undefined (the runtime default locale).` |

The input name `twNumberInput` is the **selector only** (a valueless marker attribute) — it is **not** an `input()`. Do not declare an `input()` aliased to `twNumberInput`; the directive is activated by the bare attribute, exactly like `twInput`.

### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `valueChange` | `number \| null` | `Fires when the committed numeric value changes through user interaction (typing, stepping, clamping on blur/Enter). Does not fire on writeValue (programmatic form writes). Useful for non-form / template-ref usage alongside the value signal.` |

**Why an output and a `value` signal but no `model()`:** the form value is owned by the parent through CVA (`ngModel` / `formControl` / `formField` already round-trip it), so a `model()` two-way binding would be redundant and would fight the CVA round-trip. The readonly `value` signal serves template-ref reads; `valueChange` serves non-form consumers who want an event without wiring a form. Keeping both is cheap and covers the "I just want `(valueChange)` on a bare input" case the file-upload doc validated for its event surface.

### Models

None.

### Public methods (instance API — reachable via `#ref="twNumberInput"`)

| Method | Signature | JSDoc |
|---|---|---|
| `increment` | `(): void` | `Steps the value up: treats an empty field as 0, adds step, clamps to [min,max], rounds to the formatter's resolved precision, formats, and writes both the display and the model. Emits valueChange. No-op when the host input is disabled or readonly. Does not move focus.` |
| `decrement` | `(): void` | `Steps the value down: treats an empty field as 0, subtracts step, clamps to [min,max], rounds, formats, writes display and model. Emits valueChange. No-op when disabled or readonly. Does not move focus.` |
| `focus` | `(options?: FocusOptions): void` | `Moves focus to the underlying input element.` |

`increment` / `decrement` intentionally do **not** refocus the input — keyboard ArrowUp/Down already has focus on the input, and programmatic callers should not have focus stolen. The companion stepper refocuses explicitly after stepping (see `NumberStepperComponent` wiring), matching the time-picker precedent where refocus lives in `onStepperClick`, not in the step method.

### Public readonly signals

| Signal | Type | JSDoc |
|---|---|---|
| `value` | `Signal<number \| null>` | `The current committed numeric value, or null when empty / unparseable. Read this from a template ref (#n='twNumberInput') for non-form usage.` |
| `disabled` | `Signal<boolean>` | `True when the control is disabled. Reactively tracks the reactive-forms path (setDisabledState via control.disable()) and a static disabled attribute read at mount. A runtime-toggled declarative [disabled] binding without reactive forms is NOT reactively tracked (v2 limitation — same class as readonly). Read by the companion stepper so its buttons disable in lock-step.` |
| `readonly` | `Signal<boolean>` | `True when the host input carries the readonly attribute (static / declarative, seeded after render). A runtime toggle of the bare readonly attribute is not reactively tracked (v2). Read by the companion stepper so its buttons disable in lock-step.` |

`displayText` is exposed as a `readonly` field (`WritableSignal<string>` internally, surfaced through `TW_INPUT_VALUE_ACCESSOR`) — mark it `/** @internal */`; it is wiring, not consumer API.

---

## CVA contract

| CVA hook | Behavior |
|---|---|
| `writeValue(value: number \| null \| undefined)` | Coerces: `null` / `undefined` / `NaN` → model `null`, `displayText` `''`. A finite number → store as the model, set `displayText` to the **formatted** string (`Intl.NumberFormat`). **Caret guard:** if the host input is currently focused (`document.activeElement === el`, or a tracked `focused` flag), update the model **and** `displayText` but do **NOT** write the formatted string into `el.value` — defer the visible reformat to the next blur. Writing the formatted string into `el.value` mid-focus clobbers the caret (the same hazard the focused-edit rule prevents for typing). When not focused, write `el.value = formatted` (or `''`). Does **not** clamp and does **not** round the stored model (a programmatic write is authoritative; clamping/rounding a parent-owned value silently would surprise reactive forms and split the form value from the model) and does **not** emit `valueChange`. Idempotent for the same number. **Note the one transient consequence:** because the model is stored un-rounded here while `displayText` (hence `aria-valuetext`) is formatted to the resolved precision, an over-precise `writeValue` (e.g. `1.23456` under the default 3-fraction-digit decimal format) can momentarily show `aria-valuenow="1.23456"` against `aria-valuetext="1.235"`; this is reconciled on the next user commit (blur/Enter/step) and is preferable to a form-value-vs-model split. |
| `registerOnChange(fn)` | Store `fn`. Call it with the parsed `number \| null` on **every committed user change**: per-keystroke parse, stepper, and the blur/Enter clamp-round. Never call from `writeValue`. |
| `registerOnTouched(fn)` | Store `fn`. Call on the input's `blur` (after the reformat). |
| `setDisabledState(isDisabled: boolean)` | **Set a local `cvaDisabled = signal(false)` to `isDisabled`.** This is the reactive source for the disabled state when the control is disabled via reactive forms (`control.disable()` calls this hook). The public `disabled` signal is `computed(() => this.cvaDisabled() \|\| this.el.disabled)` so it tracks the reactive-forms path (`cvaDisabled`, reactive) and a static `disabled` attribute read at first computation. **It is NOT reactive for a runtime-toggled declarative `[disabled]` binding without reactive forms** — InputDirective flips `el.disabled` via its host binding but never calls `setDisabledState`, so `cvaDisabled` stays `false` and `el.disabled` is a non-signal read that doesn't re-trigger the computed. Back-injecting InputDirective to read its `disabled` signal is a genuine DI cycle (via the `TW_INPUT_VALUE_ACCESSOR` factory), so there is no clean fix; this is a documented v2 limitation, symmetric with the `readonly` limitation. **Why a signal and not a no-op:** the stepper binds `for().disabled()`; a no-op `setDisabledState` with a `computed()` reading only a non-signal DOM property would return a *stale* `false` on the reactive-forms path (nothing bumps the computed's deps on disable), so the stepper buttons would stay enabled — failing the "stepper disables when the bound FormControl is disabled" test. Mirrors file-upload's `cvaDisabled` OR pattern. |

**Value shape:** CVA outbound value is always `number | null` — never a string, never `NaN`. Inbound `writeValue` tolerates `number | null | undefined` and coerces `NaN` → `null`.

---

## Formatting & parsing behavior (exhaustive — treat like file-upload's validation table)

Two display modes, switched by focus:

- **Focused (editing):** show the **raw editable string** the user types. Do **not** reformat mid-typing — never re-set the input value while focused (it clobbers the caret). On each `(input)`, parse the raw string → update the model + `displayText` (so float-label / `valueChange` track live), but leave the visible text exactly as typed.
- **Blurred / Enter / stepper (committing):** parse → clamp to `[min,max]` → round to precision → format via `Intl.NumberFormat` → write the formatted string back into the element **and** `displayText`, and commit the model.

### `el.value` write call sites (every mutation, explicit)

The doc claims to enumerate every mutation; here it is concretely, per trigger — (1) is `el.value` rewritten? (2) is `displayText` set? (3) does it emit?

| Trigger | `el.value` write? | `displayText.set(...)` | model + emit |
|---|---|---|---|
| `writeValue` | `el.value = formatted` (or `''`) **unless focused** (caret guard — see CVA table) | always set to formatted (or `''`) | model set (un-rounded); **no** `valueChange` |
| `onInput` (keystroke / paste) | **left untouched** (preserve caret) | `displayText.set(rawText)` | `value.set(parsed)`; emit `valueChange` |
| `blur` / `Enter` / stepper / `Home` / `End` | `el.value = formatted` | `displayText.set(formatted)` | `value.set(committed)`; emit `valueChange` (and `onTouched` on blur) |

### Parsing rules (locale-aware)

Given `locale` (or runtime default), derive the locale's group separator and decimal separator once (via `Intl.NumberFormat(locale).formatToParts(11000.1)` — inspect `group` and `decimal` parts; inline helper, ~15 lines). Then parse a raw string in **exactly this order** (the order is load-bearing — `e`/`E` rejection must precede any stripping, or `'1e3'` would survive as `'13'`):

1. **Trim.** Empty → model `null`.
2. **Reject exponent notation.** If the trimmed string contains `e` or `E` (any position), return `null` — v1 rejects exponent notation. This step runs **before** all stripping/normalization (otherwise `'1e3'` → `'13'` and `'1.5e2'` → `'1.52'`). Reject on **any** `e`/`E`, regardless of position.
3. **Strip all Unicode whitespace** via `/\s/gu` — matches U+0020 (space), U+00A0 (NBSP), U+202F (narrow NBSP), U+2000–200A, U+3000, etc., so both formatter NBSP group separators (fr-FR/fr-CH use U+202F; ru/sv/pl/nb use U+00A0) **and** a user-typed ASCII space are removed regardless of locale.
4. **Strip group separators.** Remove every occurrence of the locale group separator. (For space-grouped locales this is redundant-but-harmless because step 3 already removed the NBSP/space separator — note this in `localeSeparators`.)
5. **Normalize the decimal separator.** Replace the locale decimal separator with `'.'`.
6. **Strip remaining non-numeric characters.** Remove currency symbols, `%`, `+`, and any character that is not a digit, `.`, or a leading `-` (a single leading minus, only meaningful when `min` is absent or negative — but parsing accepts it regardless; clamping handles range). This is where a leading `'+'` is dropped, so `'+5'` → `'5'`.
7. **Digit-presence + finiteness guard.** If the cleaned string contains **no digit** (`''`, `'-'`, `'.'`, `'-.'`, and also `'--'` once step 6 has reduced it to `'-'`), return `null` — this is what prevents `Number('') === 0` from committing a bogus `0`. Otherwise call `Number(cleaned)`: if `Number.isFinite`, that's the model; else (`'1.2.3'`) → `null`. (Do **not** gate this with a regex such as `/^-?\d+(\.\d+)?$/` — that would reject the legitimate intermediate `'1.'` whose model must be `1`. Use the digit-presence test, then `Number()` + `isFinite`.)

### Intermediate states (kept raw while focused; committed on blur)

| Raw text (focused) | Model while focused | After blur |
|---|---|---|
| `''` | `null` | `''` (empty) |
| `'-'` | `null` | reverts to last committed formatted value (or `''` if none) |
| `'.'` | `null` | reverts |
| `'1.'` | `1` | `'1'` formatted |
| `'-.'` | `null` | reverts |
| `'1.0'` | `1` | `'1'` (or `'1.0'`/`'1.00'` if `minimumFractionDigits` so dictates) |
| `'1.50'` | `1.5` | formatted per `format` |
| `'1e3'` | `null` (rejected at step 2) | reverts |

### Edge cases — define each

- **Unparseable** (`'abc'`, `'--'`, `'1.2.3'`, `'$'`, `'%'`) → strip to no-digit / non-finite → model `null` (step 7). On blur, revert the display to the **last committed formatted value**, or `''` when there is none. (Chosen over leaving the bad text: a numeric field that shows garbage after blur is worse than one that snaps back; the last-good value is the least-surprising recovery.)
- **Scientific notation** (`'1e3'`, `'1E3'`, `'1.5e2'`) → rejected at **step 2** (before stripping) → `null`. v1 does not accept exponent notation.
- **Leading plus** (`'+5'`) → step 6 strips the `'+'` → `'5'` → has a digit → **accepted as `5`**.
- **Lone group separator** (`','` in en-US) → step 4 strips it → `''` → no digit → `null` (step 7).
- **Trailing group separator mid-typing** (`'1,'` in en-US) → step 4 strips it → `'1'` → `1` (legitimate intermediate; field shows `'1,'` until blur, then formats).
- **Multiple decimal separators** (`'1.2.3'`) → has digits, `Number('1.2.3')` is `NaN` → not finite → `null` (step 7).
- **Leading zeros** (`'007'`) → `Number('007') === 7`; on blur formats to `'7'`.
- **Negative zero** — `format(-0)` renders `'-0'`, which is confusing in a number box. Normalize `Object.is(n, -0) ? 0 : n` **before** formatting so the field never shows `'-0'`. (See the round/format note.)
- **Paste** — handled by the same `(input)` parse path; no special `(paste)` handler. Pasting `'$1,234.50'` parses to `1234.5` via the strip/normalize steps.
- **Rounding** — on **user commits** (blur, Enter, stepper), round the **model** to the formatter's **resolved** `maximumFractionDigits` — i.e. `new Intl.NumberFormat(locale, options).resolvedOptions().maximumFractionDigits`, **not** only when the consumer set it explicitly. `Intl` defaults `maximumFractionDigits` to 3 for decimal style, so without this the model (`1.23456`) would diverge from the display (`'1.235'`): `aria-valuenow ≠ aria-valuetext`, form value ≠ display, and a no-edit re-blur would silently mutate the model. Rounding to the resolved precision on every **user** commit keeps `parse(aria-valuetext) === aria-valuenow` and display === model for interactively-entered values. **The invariant is scoped to user commits, not `writeValue`:** a programmatic `writeValue` does **not** round the stored model (it must not silently diverge from the parent FormControl, which would create a form-value-vs-model split), so an over-precise `writeValue` may transiently show a rounded `aria-valuetext` against the authoritative un-rounded `aria-valuenow` until the next user commit reconciles them (see the `writeValue` CVA row).
- **Very large numbers** — values beyond `Number.MAX_SAFE_INTEGER` lose precision (inherent to the `number` model the CVA round-trips). v1 does not guard this; consumers needing big-integer fidelity should set `max` to a safe bound.
- **Clamping** — on commit only (blur, Enter, stepper). Never per keystroke — users must be able to type `'1'` on the way to `'15'` even when `min` is `10`.
- **Negative sign** — accepted by the parser; clamping enforces `min`. If `min >= 0`, a typed negative commits to `min` on blur. (Mobile-keyboard caveat: see the negative-entry note in Accessibility / Open decisions.)
- **Wheel** — explicitly NOT handled. Do not bind `(wheel)`. Document the deliberate omission inline.

---

## Keyboard & stepping (APG spinbutton)

Bind `(keydown)` on the host. All actions are no-ops when the element is disabled or readonly, and clamp to `[min,max]`:

| Key | Action |
|---|---|
| `ArrowUp` | `preventDefault()`, `increment()` (commit immediately: parse → +step → clamp → round → format → write display + model, emit `valueChange`). |
| `ArrowDown` | `preventDefault()`, `decrement()`. |
| `Home` | `preventDefault()`; if `min` defined, set value to `min` (commit). No-op when `min` undefined. |
| `End` | `preventDefault()`; if `max` defined, set value to `max` (commit). No-op when `max` undefined. |
| `Enter` | `preventDefault()` is **not** called (preserve form submission); instead commit-in-place (parse → clamp → round → format → write display, keep focus). |

**All other keys** (PageUp / PageDown, text entry, caret navigation, Backspace, Delete) are left to **native handling** — do **not** `preventDefault` them.

Held ArrowUp/ArrowDown repeat via **native key-repeat** — no custom timer. PageUp / PageDown (larger step) is an Open Decision (not in v1).

**Empty-field step rule (single coherent rule, matches native `<input type=number>`):** when the field is empty, **treat the current value as `0`, apply ±`step`, then clamp to `[min,max]`.** This single rule yields every expected outcome: `min=10, ArrowUp` → `clamp(0+1, 10, ∞) = 10`; no-min `ArrowUp` → `clamp(1, −∞, ∞) = 1 = step`; `max=-5, ArrowUp` → `clamp(1, −∞, −5) = −5`. Do not phrase it as "starts from `min ?? 0`" — that phrasing is self-contradictory (it can't yield both `10` for min-10 and `step` for no-min from one starting point).

---

## Accessibility

- **`role="spinbutton"`** on the host input — the input is the value-bearing widget. `inputmode` (`'decimal'` / `'numeric'`) drives the correct mobile keyboard.
- **`aria-value*`** — `aria-valuemin` / `aria-valuemax` only when `min` / `max` are set (`?? null` so the attribute is dropped when unset); `aria-valuenow` is the numeric model, **dropped when empty** (`value() ?? null`) per ARIA 1.2 indeterminate-spinbutton allowance — but **verify against axe-core** and fall back to `min ?? 0`-when-empty if `aria-required-attr` flags it (see `type="number" avoidance & a11y semantics`); `aria-valuetext` is the formatted display and is **always supplied** (`displayText() || 'Empty'`, never `null`) — this mirrors time-picker's pattern of always providing a non-null `aria-valuetext` (time-picker.ts:266-276 + the `*ValueText()` computeds at 612-633), using a plain literal instead of an Intl service.
- **`aria-invalid` / `aria-required`** — owned by the sibling `InputDirective`; do not re-bind.
- **Negative entry on mobile** — `inputmode` `numeric` / `decimal` exposes **no minus key** on iOS and most Android soft keyboards, yet the parser accepts negatives and `min` may be `< 0`. When negatives are reachable (`min` undefined or `min < 0`), mobile users reach them via the stepper / ArrowDown. A consumer needing soft-keyboard minus entry can accept this trade-off or (v2) opt into `inputmode='text'`. This is a known, documented trade-off — do **not** change the default `inputmode`. (See Open decisions.)
- **Stepper buttons** (in `NumberStepperComponent`): `type="button"`, `tabindex="-1"` (the spinbutton input owns value + keyboard semantics; the buttons are redundant pointer affordances, kept out of the tab order — matches time-picker.ts:340-369). Give each a **real `aria-label`** (`'Increase'` / `'Decrease'`) — do **not** `aria-hidden` the column. **v1 ships English-only stepper labels** (and the empty-value `aria-valuetext` literal `'Empty'`); routing them through an Intl token like time-picker's intl service is a deliberate v2 decision, not an oversight (see Open decisions). Rationale (the task's "pick one, justify it"): time-picker labels its steppers and keeps them focusable-by-pointer-only; matching that keeps a consistent library idiom and lets a screen-reader pointer user discover the affordance, while `tabindex="-1"` avoids double-exposing the value semantics already on the input. `(mousedown)="$event.preventDefault()"` so clicking a stepper does **not** blur the input (which would prematurely fire format-on-blur); after stepping, the stepper calls `for().focus()` to return focus to the input.
- **Focus ring** — canonical `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on each stepper button (mirror the `stepper` slot in time-picker.ts:114). The input's own focus ring is owned by `InputDirective` / `<tw-form-field>`. Use `focus-visible` exclusively — never `focus:`.
- **AXE matrix:** must pass on — default render; with `min`/`max` set (valid `aria-value*`); empty (**verify the dropped `aria-valuenow` empirically against axe-core; if flagged, fall back to `min ?? 0`**); inside `<tw-form-field>` with a label; with the stepper present; disabled; readonly; integer (`inputmode="numeric"`) and decimal (`inputmode="decimal"`) modes.
- **Dev-mode warnings:** one optional warning — if `step` resolves `<= 0` or non-finite, warn once (`afterNextRender`, `isDevMode()` guard) that it falls back to `1` (mirror time-picker.ts:794-807). No accessible-name warning here — the label is the sibling InputDirective / form-field's responsibility.

---

## Form integration

- `NumberInputDirective implements ControlValueAccessor` (static `NG_VALUE_ACCESSOR`, above). Round-trips `number | null` through:
  - **template-driven** — `<input twInput twNumberInput [(ngModel)]="qty">`;
  - **reactive** — `<input twInput twNumberInput [formControl]="qtyCtrl">`;
  - **signal-based** — `<input twInput twNumberInput [formField]="form.qty">`.
- Inside `<tw-form-field>`: the sibling `InputDirective` provides `TW_FORM_FIELD_CONTROL`; the float-label / empty state reads the **formatted display** through `TW_INPUT_VALUE_ACCESSOR.value` (the `displayText` signal). Error chrome, `aria-describedby` merging, and `TW_ERROR_STATE_MATCHER` all flow through InputDirective unchanged.
- **Disabled reactivity (two supported paths, one documented gap):** (A) Disabling a reactive `FormControl` calls `setDisabledState(true)` → sets `cvaDisabled` → the public `disabled` signal flips → the stepper disables. (Separately, `InputDirective` reacts to the control's status change and applies the element's native `[disabled]`.) (C) A static `disabled` attribute on the element at mount is read by the `disabled` computed's `el.disabled` term. (B) A **runtime-toggled declarative `[disabled]="sig()"` binding without reactive forms is NOT reactively tracked** — InputDirective flips `el.disabled` but never calls `setDisabledState`, and `el.disabled` is a non-signal read, so the stepper's `for().disabled()` would be stale. Back-injecting InputDirective is a DI cycle, so there is no clean fix; this is a documented v2 limitation (sibling to the `readonly` one). Test the two **supported** paths (A reactive-forms `control.disable()`, and C static attribute); do **not** assert path B works.
- Demo and test all three strategies with both whole-number and decimal-format configs.

---

## Variants — `tv()`

- **`NumberInputDirective`: no `tv()` config.** The directive sets **no** class strings — `InputDirective` owns all input chrome (border, padding, focus ring, error border, size density). There are no slots, no color/size axes on the directive, nothing to merge. The `tv()` / tailwind-variants machinery does not apply (same rationale as `twAspectRatio`: a behavioral directive, not a variant-driven visual component). Do **not** add a `tv()` to `number-input.ts`.
- **`NumberStepperComponent`: `tv()` required**, slot-based, `twMerge: true`, with a `size: TwSize` axis matching time-picker's stepper scale. Slots: `group`, `button`, `icon`. Mirror the time-picker stepper styling (time-picker.ts `stepperGroup` / `stepper` / `stepperIcon` slots). **The column must fit the field height, not bloat it** — see the sizing note below the block:

```ts
const numberStepper = tv(
  {
    slots: {
      // Column stretches to the field height (host carries `flex self-stretch`);
      // the two buttons split it via `flex-1`.
      group: 'flex flex-col self-stretch',
      // `flex-1` gives each button HALF the field height; the per-size class is
      // WIDTH-only. Do NOT use the square `size-6/7/8` scale here — two stacked
      // squares are 2× a button tall and bloat the field. The `size-3`/`size-4`
      // chevron glyph's min-content is the natural floor; do NOT add `min-h-0`.
      button:
        'flex-1 inline-flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-muted rounded-md transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-40 disabled:pointer-events-none',
      icon: '',
    },
    variants: {
      size: {
        xs: { button: 'w-6', icon: 'size-3' },
        sm: { button: 'w-7', icon: 'size-3' },
        md: { button: 'w-7', icon: 'size-3' },
        lg: { button: 'w-8', icon: 'size-4' },
        xl: { button: 'w-8', icon: 'size-4' },
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);
```

- **Host must stretch.** Put `host: { class: 'flex self-stretch' }` on `NumberStepperComponent`: `flex` makes the inner group fill the host, `self-stretch` makes the host fill the field height — overriding `items-center` in a `<tw-form-field>` `[twSuffix]` slot and matching `items-stretch` in a standalone flex row. Without it the column collapses to its content height and floats.
- **Sizing rationale (do not "correct" back to squares).** Stacking two square `size-6`/`size-7`/`size-8` buttons in a `flex flex-col` column is exactly what bloated the field to ~72px. The fix: `group` is `flex flex-col self-stretch`, the `button` slot is prefixed `flex-1` (height comes from the flex split), and the per-size class is **width-only** (`w-6`/`w-7`/`w-8`). Chevrons stay on the **glyph** sub-scale (`size-3`/`size-4`). One consequence: each spinner ends up `< 24px` tall, below CLAUDE.md's WCAG 2.5.8 target-size floor (codified in slider.ts/badge.ts). This is an **accepted** trade-off — two ≥24px stacked buttons cannot fit a compact field, and the value is fully reachable via the ≥24px spinbutton input + ↑/↓ (WCAG 2.5.8 equivalent-control exception). Document it inline in the `tv()` config (mirror number-stepper.ts / time-picker.ts).
- The `button` slot's disabled styling is `disabled:opacity-40 disabled:pointer-events-none` — copied **verbatim** from the time-picker stepper. Do **not** add `disabled:cursor-default`: with `pointer-events-none` the cursor utility is dead code. And `disabled:opacity-40` is intentionally mirrored from the time-picker stepper precedent — it is **not** the CLAUDE.md Opacity-table 50/30 values, so a reviewer/implementer should not "correct" it.
- (`w-6`…`w-8` set button **width**; height comes from `flex-1`. `size-3`/`size-4` is the **glyph** sub-scale per CLAUDE.md "Icon Sizing". Do not mix sub-scales.)

---

## DOM structure

### `NumberInputDirective` — no template (attribute directive)

The consumer's `<input>` is the host. Host bindings only:

```ts
host: {
  'role': 'spinbutton',
  '[attr.inputmode]': 'inputMode()',
  '[attr.aria-valuemin]': 'min() ?? null',
  '[attr.aria-valuemax]': 'max() ?? null',
  '[attr.aria-valuenow]': 'value() ?? null',
  '[attr.aria-valuetext]': 'displayText() || "Empty"',
  '(input)': 'onInput()',
  '(keydown)': 'onKeydown($event)',
  '(focus)': 'onFocus()',
  '(blur)': 'onBlur()',
}
```

`inputMode = computed(() => this.format()?.maximumFractionDigits === 0 ? 'numeric' : 'decimal')`. (Bind `(focus)` so the directive can track a `focused` flag for the `writeValue` caret guard — or read `document.activeElement === el` directly; either is acceptable.)

### `NumberStepperComponent` — inline template

```html
<div [class]="groupClasses()">
  <button
    type="button"
    tabindex="-1"
    aria-label="Increase"
    [class]="buttonClasses()"
    [disabled]="isDisabled()"
    (mousedown)="$event.preventDefault()"
    (click)="onStep(1)"
  >
    <ng-content select="[slot=up]">
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" [class]="iconClasses()">
        <path fill-rule="evenodd" d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.94l-3.71 3.83a.75.75 0 1 1-1.08-1.04l4.25-4.39a.75.75 0 0 1 1.08 0l4.25 4.39a.75.75 0 0 1-.02 1.06Z" clip-rule="evenodd" />
      </svg>
    </ng-content>
  </button>
  <button
    type="button"
    tabindex="-1"
    aria-label="Decrease"
    [class]="buttonClasses()"
    [disabled]="isDisabled()"
    (mousedown)="$event.preventDefault()"
    (click)="onStep(-1)"
  >
    <ng-content select="[slot=down]">
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" [class]="iconClasses()">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
      </svg>
    </ng-content>
  </button>
</div>
```

(Copy the chevron SVG paths verbatim from time-picker.ts:350-351 and 365-366. The `[slot=up]` / `[slot=down]` projection lets consumers swap glyphs.)

---

## `NumberStepperComponent` design

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `for` | `NumberInputDirective \| undefined` | `undefined` | `The number-input directive instance this stepper controls. Bind to a template ref, e.g. [for]="qty" with #qty="twNumberInput". When omitted, the buttons render but do nothing (no-op) and disable.` |
| `size` | `TwSize` | `'md'` | `Button + glyph density. Match the field's size for visual alignment. Defaults to 'md'.` |

`for` is the standard input name for "the control I target" (mirrors `<label for>`). It is a plain `input()`, not required — but the stepper disables itself when `for()` is undefined.

### Wiring

- `onStep(direction: 1 | -1)` → `const dir = this.for(); if (!dir) return; if (direction === 1) { dir.increment(); } else { dir.decrement(); } dir.focus();`. The directive's `increment` / `decrement` do **not** refocus, so the stepper refocuses the input after stepping via `for().focus()` — matching the time-picker precedent (`onStepperClick`, time-picker.ts:983-992) where refocus lives in the stepper handler, not the step method.
- `isDisabled = computed(() => { const d = this.for(); return !d || d.disabled() || d.readonly(); })` — disable when there's no target, or the target input is disabled / readonly. This is why `NumberInputDirective` exposes `disabled` and `readonly` signals.
- Host class: keep the component's host element bare; the `group` div is the visible root. The `twSuffix` attribute the consumer adds lets the form-field slot it. No host bindings required.

### Slot usage inside `<tw-form-field>`

The consumer adds `twSuffix` to the `<tw-number-stepper>` element so form-field projects it into the `[twSuffix]` slot (form-field.html line 7):

```html
<tw-form-field>
  <tw-label>Quantity</tw-label>
  <input twInput twNumberInput #qty="twNumberInput" [formControl]="qtyCtrl" [min]="0" [max]="99" />
  <tw-number-stepper twSuffix [for]="qty" />
</tw-form-field>
```

Standalone (no form-field), the consumer wraps both in a flex row themselves.

---

## Implementation notes

- **Signals only.** `value` is the source-of-truth model — implement as a writable `signal<number | null>(null)` exposed `.asReadonly()` as the public `value`. `displayText = signal<string>('')`.
- **`disabled` / `readonly` sources (decide explicitly — do not leave implied):**
  - `disabled = computed(() => this.cvaDisabled() || this.el.disabled)`. `cvaDisabled = signal(false)` is set by `setDisabledState` and is the reactive source for the reactive-forms path (path A, the tested one). The `this.el.disabled` read covers a **static** `disabled` attribute on the element at first computation (path C). Because `cvaDisabled` is a signal, the `computed()` re-evaluates when reactive forms disable the control — so the stepper's `for().disabled()` is never stale on path A. **It is NOT reactive for a runtime-toggled declarative `[disabled]` binding without reactive forms** (path B): `el.disabled` is a non-signal DOM read, and InputDirective never calls `setDisabledState` for a plain `[disabled]`. Back-injecting InputDirective is a DI cycle, so this is a documented v2 limitation — symmetric with `readonly` below.
  - `readonly`: there is no CVA hook for it, and InputDirective mirrors its `readonly` input onto the native attribute via an **`effect()` that runs after construction** (input.ts:330-337). A `computed(() => this.el.readOnly)` with no signal deps evaluates **once, lazily**, and can cache `false` before that effect lands the attribute — breaking even the static case. **Decision:** back the public `readonly` with a real signal seeded after render — `private readonlySig = signal(false)`, seeded in `afterNextRender(() => this.readonlySig.set(this.el.readOnly))` (runs after InputDirective's effect has applied the attribute); expose `readonly = this.readonlySig.asReadonly()`. The interaction-time guards in `increment` / `decrement` / `onKeydown` still read `this.el.readOnly` **live** (always fresh, never memoized). A runtime toggle of the bare `readonly` attribute won't reactively re-flip the stepper binding (the `afterNextRender` seed is one-shot) — that is a v2 concern (Open decisions); the static / declarative-at-mount case reliably reflects via the seed.
- **No back-injection.** Do **not** `inject(InputDirective)` or `inject(NgControl)` to read disabled/readonly from the sibling — `InputDirective` depends on `NumberInputDirective` via the `TW_INPUT_VALUE_ACCESSOR` factory, so injecting back is a DI cycle, and an `NgControl` injection would void the static-accessor rationale. Use `cvaDisabled` + the element read / `afterNextRender` seed.
- **No signal cycles in `effect()`.** There is no place here that needs an effect to write a signal it also reads. Parsing/formatting are synchronous transforms triggered by DOM events (`onInput`, `onBlur`, `onFocus`, `onKeydown`, `increment`, `decrement`, `writeValue`) — plain methods, not effects. The only effect-like work is the `afterNextRender` one-shot seed of `readonlySig` (writes a signal it never reads — no cycle). Do **not** introduce an effect that reads `value()` and writes the input element from inside the same effect.
- **Inline helpers** (no shared utility, no reuse of `time-utils` — `parseField` there is 1–2 digit only and useless here):
  - `localeSeparators(locale)` → `{ group, decimal }` via `Intl.NumberFormat(locale).formatToParts(11000.1)`. Note that the all-Unicode-whitespace strip (parse step 3) makes the exact group-separator strip (step 4) redundant-but-harmless for space-grouped locales (fr / ru / sv …).
  - `parse(raw, locale)` → `number | null` (the ordered strip/normalize steps above).
  - `format(n, locale, options)` → `string`. Normalize `Object.is(n, -0) ? 0 : n` **before** formatting so the box never shows `'-0'`. Use `new Intl.NumberFormat(locale, options).format(...)` (construct the formatter lazily / memoize per `(locale, options)` if needed — but a fresh formatter per commit is acceptable, commits are low-frequency).
  - `clamp(n, min, max)` → respects `undefined` bounds.
  - `round(n, maxFractionDigits)` → round to the formatter's **resolved** `maximumFractionDigits` (`new Intl.NumberFormat(locale, options).resolvedOptions().maximumFractionDigits`) on **every user commit**, so model and display always agree for interactively-entered values (see the Rounding edge case — `writeValue` deliberately does not round).
- Read the underlying element via `inject(ElementRef<HTMLInputElement>)` (`this.el = inject(ElementRef).nativeElement`).
- `OnPush` is N/A for a directive; the stepper component uses `ChangeDetection.OnPush`.
- `standalone` — do not set `standalone: true` (default in v21). `inject()` for DI. No `@HostBinding` / `@HostListener` — `host` object only. Native control flow only.
- No `@angular/animations`. No new keyframes. Tailwind `transition-colors duration-normal motion-reduce:transition-none` on the stepper buttons (from time-picker).
- `forwardRef` is required in the providers (self-reference inside the decorator) — same idiom as time-picker's `TW_FORM_FIELD_CONTROL` provider and segmented-control's `NG_VALUE_ACCESSOR` provider.

---

## Usage examples

Zero-config (whole numbers, no bounds, no stepper):

```html
<input twInput twNumberInput [(ngModel)]="quantity" />
```

Min / max / step:

```html
<input twInput twNumberInput [formControl]="qtyCtrl" [min]="0" [max]="99" [step]="1" />
```

With the stepper companion (standalone flex row):

```html
<div class="flex items-stretch gap-1">
  <input twInput twNumberInput #qty="twNumberInput" [formControl]="qtyCtrl" [min]="0" [max]="10" />
  <tw-number-stepper [for]="qty" size="md" />
</div>
```

Currency display via `Intl` format:

```html
<input
  twInput
  twNumberInput
  [(ngModel)]="price"
  [format]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }"
  locale="de-DE"
/>
```

Inside `<tw-form-field>` with label, hint, and the stepper in the suffix slot:

```html
<tw-form-field>
  <tw-label>Quantity</tw-label>
  <input twInput twNumberInput #qty="twNumberInput" [formControl]="qtyCtrl" [min]="1" [max]="50" required />
  <tw-number-stepper twSuffix [for]="qty" />
  <tw-hint>Between 1 and 50.</tw-hint>
  <tw-error match="required">Quantity is required.</tw-error>
</tw-form-field>
```

Reactive forms (decimal):

```html
<input twInput twNumberInput [formControl]="weightCtrl" [format]="{ minimumFractionDigits: 1, maximumFractionDigits: 2 }" />
```

Signal-based forms:

```html
<input twInput twNumberInput [formField]="orderForm.quantity" [min]="0" />
```

Standalone, no form (template ref + output):

```html
<input twInput twNumberInput #n="twNumberInput" [min]="0" [max]="5" (valueChange)="onCount($event)" />
<tw-number-stepper [for]="n" />
<p>Current: {{ n.value() ?? '—' }}</p>
```

Disabled (disabled lives on the input; the stepper follows):

```html
<input twInput twNumberInput #q="twNumberInput" [formControl]="qtyCtrl" disabled />
<tw-number-stepper [for]="q" />
```

---

## Test plan

Vitest. No `fakeAsync` / `tick`. Use `async/await` + `fixture.whenStable()`; `vi.spyOn` for spies; `vi.useFakeTimers()` only if a dev-mode warning timing needs control. Set signal inputs with `fixture.componentRef.setInput(...)`. Use a tiny host component wrapping `<input twInput twNumberInput …>` (import `InputDirective` from `@cdevhub/ngx-tw/input`). Assert against the **DOM** (element `value`, attributes) and emitted values — not internal signals.

### `number-input.spec.ts` (directive)

1. **Rendering / attributes**
   - Mounts a bare `<input twInput twNumberInput>` without errors; element keeps `type="text"` (or no explicit type → text).
   - `role="spinbutton"` is present.
   - `inputmode="decimal"` by default; `inputmode="numeric"` when `format = { maximumFractionDigits: 0 }`.
   - `aria-valuemin` / `aria-valuemax` present only when `min` / `max` set; absent otherwise.
   - `aria-valuenow` absent when empty (**verify against axe-core in the a11y block; documented fallback is `min ?? 0` if axe flags it**); equals the numeric value when set.
   - `aria-valuetext` equals the formatted display when set; equals `'Empty'` (literal, **not absent**) when the field is blank.

2. **Parsing (each via setting `input.value` + dispatching `input`)**
   - `'42'` → model `42`, `valueChange` emits `42`.
   - `''` → model `null`.
   - intermediate `'-'`, `'.'`, `'1.'`, `'-.'`, `'1.0'` keep raw text while focused and produce the table's model values (assert element value unchanged, model per table — `'1.'` → `1`, `'-'` / `'.'` / `'-.'` → `null`).
   - `'1.50'` → `1.5`.
   - `'abc'` / `'1.2.3'` / `'1e3'` / `'$'` / `'%'` / `'--'` → model `null` (`'1e3'` rejected at the exponent step; `'--'` dies at the digit-presence check).
   - `'+5'` → `5` (leading `'+'` stripped).
   - `','` (en-US lone group separator) → `null`; `'1,'` → `1`.
   - `'$1,234.50'` with `locale='en-US'` → `1234.5` (group/decimal strip).
   - `'1.234,50'` with `locale='de-DE'` → `1234.5`.
   - `'1 234,5'` with `locale='fr-FR'` → `1234.5` (narrow-NBSP group separator stripped via the Unicode-whitespace step).

3. **Formatting / commit on blur**
   - Type `'1.0'`, blur → element value becomes `'1'` (default) / `'1.00'` when `minimumFractionDigits: 2`.
   - Unparseable typed then blur → reverts to last committed formatted value (or `''` when none).
   - `format = { style: 'currency', currency: 'USD' }`, write `5` → element shows `'$5.00'` (locale-dependent — assert it contains the digits + currency marker rather than an exact string to stay locale-robust).
   - **Rounding agreement (user commit):** with no explicit `maximumFractionDigits` (decimal default = 3), type `'1.23456'`, blur → element shows `'1.235'` **and** the committed model / `aria-valuenow` is `1.235` (model rounded to the resolved precision — display === model on the user-commit path).
   - **Negative zero:** committing `-0` (e.g. typing `'-0'` then blur) shows `'0'`, never `'-0'`.

4. **Clamping**
   - `min=10`, type `'5'`, blur → model + element become `10`.
   - `max=99`, type `'200'`, blur → `99`.
   - Typing `'1'` with `min=10` does **not** clamp mid-typing (model `1` while focused; clamps to `10` on blur).

5. **Keyboard stepping**
   - ArrowUp adds `step`; ArrowDown subtracts; both clamp.
   - ArrowUp from empty with `min=10` → `10`; with no min → `step` (from 0). (Both satisfied by the single "treat empty as 0, ±step, clamp" rule.)
   - Home → `min` (no-op when min undefined); End → `max` (no-op when max undefined).
   - Enter commits in place without losing focus (assert `document.activeElement` is still the input).
   - Stepping is a no-op when the element is disabled / readonly.
   - PageUp / PageDown / Backspace are **not** `preventDefault`ed (native handling preserved).

6. **Public API**
   - `increment()` / `decrement()` step + clamp + emit `valueChange`. They do **not** move focus (refocus is the stepper's job — assert in the stepper spec, not here).
   - `value()` reflects the current model.
   - `disabled()` reflects both `setDisabledState(true)` (reactive-forms path A) and a static `disabled` attribute (path C); `readonly()` reflects the (seeded) `readonly` attribute. (Do **not** add a test asserting a runtime-toggled declarative `[disabled]` flips `disabled()` — that is a documented v2 limitation, path B.)

7. **CVA contract**
   - `writeValue(42)` (input not focused) sets the element value to the formatted `'42'` and model `42`; does **not** emit `valueChange`.
   - `writeValue` while the input is **focused** updates model + `displayText` but leaves `el.value` (the raw caret-bearing text) untouched (caret guard).
   - `writeValue(null)` clears element + model.
   - `writeValue(NaN)` → model `null`.
   - User input calls the registered `onChange` with `number | null`.
   - blur calls the registered `onTouched`.
   - Works with `[formControl]`: form value updates on type; `setValue(7)` updates the element.
   - Works with `[(ngModel)]`: round-trip.
   - Works with `[formField]` (signal forms): round-trip.
   - `setDisabledState(true)` (via `control.disable()`) flips `disabled()` to true **and** disables the element; stepping becomes a no-op. (This is the test the no-op design would have failed.)

8. **`TW_INPUT_VALUE_ACCESSOR` wiring**
   - Inside `<tw-form-field>`, the float-label reflects non-empty during intermediate typing (`'-'`): assert the form-field treats the control as non-empty (query the floated-label class/state, or assert `displayText` via the exposed signal is `'-'`). This proves `displayText` (not the numeric value) feeds InputDirective.

9. **Accessibility / dev-mode**
   - AXE clean: default, with min/max, empty (**verify the dropped `aria-valuenow` empirically; if axe-core flags `aria-required-attr`, switch the empty binding to `min ?? 0` and update test 1's empty-`aria-valuenow` assertion to match**), disabled, integer + decimal modes, inside form-field with a label.
   - `step=0` logs a dev-mode warning and falls back to `1` (spy `console.warn`).
   - No `(wheel)` listener changes the value: dispatch a `wheel` event, assert model unchanged.

### `number-stepper.spec.ts` (component)

1. Renders two `type="button"` buttons, each `tabindex="-1"`, with `aria-label="Increase"` / `"Decrease"`.
2. Each `size` (`xs`–`xl`) renders without error.
3. Clicking up calls `for().increment()` and then refocuses the input (`for().focus()`); down calls `decrement()` then refocuses (spy on a stub directive instance, or wire a real `<input twNumberInput #n>` and assert its `value()` changes **and** `document.activeElement` is the input after click).
4. `mousedown` on a button calls `preventDefault` (assert via a spy on the event, or that input focus is retained after click).
5. Buttons are `disabled` when `for()` is undefined, when `for().disabled()` is true (drive via a disabled `FormControl` on the bound input), or when `for().readonly()` is true.
6. After a click, focus returns to the bound input (the stepper, not the directive, owns the refocus — assert `document.activeElement` is the input).
7. `[slot=up]` / `[slot=down]` projected content replaces the default chevron.
8. AXE clean.
9. Consumer `class` on the host merges via `twMerge` (assert a custom class survives alongside `flex`).

Target: directive ~40–55 `it()` blocks; stepper ~10–14.

---

## Demo page

Follow-up via `/demo-doc-page` (listed here for completeness). Create under `projects/demo/src/app/routes/number-input/`. Examples to ship:

- Zero-config whole number.
- Min / max / step.
- With stepper (standalone flex row).
- Currency (`Intl` format, non-US locale).
- Inside `<tw-form-field>` with label / hint / error + stepper in the suffix slot.
- Reactive forms (decimal precision).
- Template-driven forms.
- Signal-based forms.
- Disabled / readonly.

Page wrapper mirrors `input-page.component.ts`. Sidebar entry: insert **"Number Input"** alphabetically.

---

## Registration — all FOUR config edits (plus the per-directory boilerplate)

Omitting any of edits 2–4 makes CI **silently skip** the new specs (per the project memory note). Do all of these:

1. `projects/ngx-tw/src/public-api.ts` — add `export * from '@cdevhub/ngx-tw/number-input';` in the form-control cluster (the `select` / `input` / `textarea` / `file-upload` lines ~33-36). Sequential append within that cluster; do not reorder unrelated lines.
2. `projects/ngx-tw/tsconfig.lib.json` — add `"number-input/**/*.ts",` to the `include` array (alphabetically near `"input/**/*.ts"` / after `"menu/**/*.ts"` is fine — the array is roughly alphabetical).
3. `projects/ngx-tw/tsconfig.spec.json` — add `"number-input/**/*.spec.ts",` to `include`.
4. `angular.json` — the ngx-tw `unit-test` target's `include` array (the cluster around line 143-145, near `"../input/**/*.spec.ts"` / `"../file-upload/**/*.spec.ts"`) — add `"../number-input/**/*.spec.ts",`.

Plus the per-directory files (created in File layout): `index.ts` re-exporting `NumberInputDirective` + `NumberStepperComponent`, and `ng-package.json` = `{ "lib": { "entryFile": "index.ts" } }`.

The root `tsconfig.json` `@cdevhub/ngx-tw/*` path alias is a **wildcard** → no per-entry edit needed there. (Mentioned so the implementer doesn't hunt for it.)

---

## Open decisions for the maintainer

Genuinely-optional items deferred from v1; the load-bearing decisions above are settled.

1. **Hold-to-repeat on the stepper buttons.** v1 is single-step-per-click (held arrows already repeat via native key-repeat on the input). A press-and-hold accelerating repeat on the buttons is a v2 nicety. **[DEFERRED — single step in v1.]**
2. **PageUp / PageDown for a larger step.** APG mentions a "large step" for spinbuttons. Not in v1; could add a `pageStep` input (would push the directive to 6 inputs — still within cap). **[DEFERRED.]**
3. **Custom `parser` / `formatter` function inputs.** v1 covers grouping, decimals, and currency via `Intl.NumberFormatOptions`, which absorbs the common cases without extra inputs. If a consumer needs bespoke formatting (e.g. phone-style grouping, unit suffixes), add optional `parser: (raw: string) => number | null` and `formatter: (n: number) => string` inputs in v2 (would push to 7 inputs — needs an input-count justification at that point). **[DEFERRED — Intl coverage judged sufficient for v1.]**
4. **Mouse-wheel to change value.** Deliberately omitted (the native `type="number"` footgun). Could be a future opt-in input (`wheelStep`), default off. **[OMITTED BY DESIGN.]**
5. **Exponent / scientific notation parsing.** v1 rejects `'1e3'` (at the dedicated exponent step, before stripping). Could be added behind a flag. **[DEFERRED.]**
6. **Reactive `readonly`.** v1 seeds the public `readonly` signal once via `afterNextRender` (so the static / declarative-at-mount attribute reflects reliably) and reads `el.readOnly` live at interaction time. A runtime toggle of the bare `readonly` attribute would need a small revision-signal bump — v2 if a consumer needs it. **[DEFERRED.]**
7. **Reactive declarative `[disabled]` without reactive forms (path B).** `disabled()` is reactive for reactive-forms `control.disable()` and a static `disabled` attribute at mount, but **not** for a runtime-toggled `[disabled]="sig()"` binding without reactive forms — InputDirective flips `el.disabled` but never calls `setDisabledState`, and back-injecting InputDirective is a DI cycle (via the `TW_INPUT_VALUE_ACCESSOR` factory). Same class as the readonly limitation. A v2 fix would need a non-cyclic channel for the sibling's disabled state. **[DEFERRED.]**
8. **Percent format style.** `Intl` percent scales the value ×100, which requires the parser to divide by 100 and the focused-edit display to show the un-scaled percent number (e.g. edit `60`, not `0.6` and not `60%`). v1 omits percent to stay correct-by-construction; currency and plain/grouped/decimal styles are unaffected. **[DEFERRED.]**
9. **i18n of stepper labels and the empty `aria-valuetext`.** v1 ships English-only `'Increase'` / `'Decrease'` stepper `aria-label`s and the `'Empty'` `aria-valuetext` literal. Routing them through an injectable Intl token (as time-picker does via its intl service) is a deliberate v2 decision, not an oversight. **[DEFERRED.]**
10. **Soft-keyboard minus entry on mobile.** `inputmode` `numeric` / `decimal` exposes no minus key on iOS / most Android; when `min < 0` (or undefined) mobile users reach negatives via the stepper / ArrowDown. A consumer needing keyboard minus entry could opt into `inputmode='text'` in v2. The default `inputmode` is unchanged in v1. **[KNOWN TRADE-OFF.]**

---

## Constraints (from CLAUDE.md — non-negotiable)

- Attribute selector `[twNumberInput]`; element selector `tw-number-stepper`. Class names `NumberInputDirective` / `NumberStepperComponent` (no `Tw` prefix on class identifiers).
- `standalone` not set (default in v21). `ChangeDetection.OnPush` on the stepper component. `host` object for all host bindings — never `@HostBinding` / `@HostListener`. `inject()` for DI. Native control flow only.
- Signal API exclusively: `input()` / `output()` / `computed()`; writable `signal()` for the model, `displayText`, `cvaDisabled`, and `readonlySig`. No `model()` (CVA owns the round-trip). No `mutate`. **No signal cycles in `effect()`** — parse/format are event-driven methods; the only effect-like work is the one-shot `afterNextRender` seed of `readonlySig` (writes a signal it never reads).
- **CVA via static `NG_VALUE_ACCESSOR` (multi: true)** — permitted here because the directive injects **no** `NgControl` (matcher lives on the sibling InputDirective). Follows the segmented-control / calendar precedent. Verify the directive injects no `NgControl`. `forwardRef` in the providers.
- `setDisabledState` sets a `cvaDisabled` signal ORed into `disabled()` — **not** a no-op (a no-op leaves the stepper's `for().disabled()` stale on the reactive-forms path). Do not inject `InputDirective`/`NgControl` back to read disabled (DI cycle). A runtime-toggled declarative `[disabled]` without reactive forms is a documented v2 limitation.
- Parsing follows the **ordered** step list: trim → reject `e`/`E` (before stripping) → strip all Unicode whitespace (`/\s/gu`) → strip group separators → normalize decimal → strip remaining non-numeric / leading `+` → digit-presence + `isFinite` guard (no regex gate). Round the model to the formatter's **resolved** `maximumFractionDigits` on every **user** commit (not on `writeValue`); normalize `-0` → `0` before formatting.
- `aria-valuenow` is dropped when empty (verify against axe-core; documented `min ?? 0` fallback); `aria-valuetext` is **always** non-null (`displayText() || 'Empty'`).
- `NumberInputDirective` sets **no** class strings and has **no** `tv()`. `NumberStepperComponent` uses `tv()` with `twMerge: true`, slot-based (`group`/`button`/`icon`), defines `defaultVariants`, `size: TwSize` from `@cdevhub/ngx-tw/core`. No exported variant config.
- Semantic / surface-fg-border tokens only — `text-fg-muted`, `hover:text-fg`, `hover:bg-surface-muted` on the stepper buttons. No raw palette colors, no raw `neutral-*` for structure.
- Visual Design System: stepper column `flex flex-col self-stretch` with `flex-1` **width-only** buttons (`w-6`…`w-8`) so it fits the field height instead of bloating it (NOT the square `size-6`…`size-8` scale — see the `tv()` sizing rationale; the sub-24px target is a documented WCAG 2.5.8 equivalent-control trade-off), chevrons on the **glyph** scale (`size-3`/`size-4`); `rounded-md`; `transition-colors duration-normal motion-reduce:transition-none`; canonical `focus-visible:outline-2 outline-offset-2 outline-primary-500`; `disabled:opacity-40 disabled:pointer-events-none` (mirrored verbatim from the time-picker stepper — **no** `disabled:cursor-default`, which is dead under `pointer-events-none`; `opacity-40` is the stepper precedent, not the 50/30 Opacity-table values).
- No `@angular/animations`. No new theme keyframes.
- Vitest, no `fakeAsync` / `tick`. Assert DOM + emissions, not internal signals.
- Every `input()`, `output()`, public method, and public signal carries a one-line JSDoc; Compodoc renders the tables.
- ≤ 5–6 inputs on the directive (it is **not** in any exception list). v1 ships **5**.

---

## Acceptance criteria

- `<input twInput twNumberInput>` round-trips a real `number | null` through template-driven, reactive, and signal forms; the form value is never a string and never `NaN`.
- The element stays `type="text"`; `inputmode` is `'numeric'` for integer formats and `'decimal'` otherwise; `role="spinbutton"` with correct `aria-value*` — `aria-valuemin/max` dropped when unset, `aria-valuenow` dropped when empty (or `min ?? 0` if axe-core requires it), `aria-valuetext` **always** present (`'Empty'` when blank).
- Parsing follows the ordered steps: `'1e3'` → `null` (exponent rejected first), `'+5'` → `5`, `','` → `null`, `'1,'` → `1`, `'1.'` → `1`, NBSP-grouped locales parse correctly; the model is rounded to the formatter's resolved precision on every **user** commit so display === model for typed values; `-0` never displays.
- Typing intermediate states (`'-'`, `'1.'`) does not clobber the caret or prematurely reformat; `writeValue` while focused leaves the raw text untouched (caret guard); blur / Enter / stepping commit (parse → clamp → round → format).
- ArrowUp/Down/Home/End/Enter and the `tw-number-stepper` buttons all step + clamp (empty field treated as `0`); wheel does nothing; non-stepping keys (PageUp/Down, Backspace) are left to native handling.
- `<tw-number-stepper [for]="…">` controls the directive, disables in lock-step (including when the bound `FormControl` is disabled via `setDisabledState`, and when the input is readonly), labels its buttons (`Increase`/`Decrease`), keeps `tabindex="-1"`, and **refocuses the input after stepping via `for().focus()`** (the refocus lives in the stepper, not in the directive's `increment`/`decrement`).
- `disabled()` is reactive on the reactive-forms path and a static attribute at mount; the runtime-toggled declarative `[disabled]` path and runtime `readonly` toggling are documented v2 limitations, not regressions.
- Inside `<tw-form-field>`, float-label / empty state tracks the **formatted display text** (via `TW_INPUT_VALUE_ACCESSOR` → `displayText`), and error chrome flows through the sibling InputDirective.
- Every public API member has a one-line JSDoc; Compodoc tables are complete.
- All Vitest blocks pass (both spec files run — confirm all four registration edits landed).
- `ng build ngx-tw` clean; the `ngx-tw/number-input` secondary entry point bundles.
- AXE clean across the matrix; no console errors on the demo route (port 4600).
