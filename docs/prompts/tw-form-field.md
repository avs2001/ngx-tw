# Prompt: Build `tw-form-field` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, animation rules
- `projects/ngx-tw/card/card.ts` — slot-based `tv()` pattern with multiple directives and `contentChild()` presence detection
- `projects/ngx-tw/collapsible/collapsible.ts` — parent/child coordination via `inject()`, `linkedSignal()`, `contentChildren()`, unique ID generation for ARIA wiring
- `projects/ngx-tw/tooltip/tooltip.ts` and `projects/ngx-tw/popover/popover.ts` — `InjectionToken` patterns for cross-component communication
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types
- `projects/ngx-tw/theme/_base.css` — where any new keyframes would live (no new keyframes expected; floating label uses CSS `transition-transform`)
- Angular Material for inspiration only (do not copy): `@angular/material/form-field` — `MatFormFieldControl` abstract class, label `for` wiring, subscript swap error↔hint. ngx-tw replaces Material's RxJS `stateChanges` with signal-based reactivity.
- `@angular/cdk/a11y` — `_IdGenerator` for stable ARIA ids

## What to build

A structural wrapper component that standardizes the presentation of a form control with its label, required marker, prefix/suffix adornments, hints, and validation errors. `tw-form-field` does **not** own the control's value or validation — it observes a child "form-field control" (e.g., a future `tw-input`, `tw-select`, `tw-textarea`, or any custom control) via a registration protocol and mirrors its state (focused, empty, disabled, required, invalid) into presentation and ARIA plumbing.

This component ships **before** any concrete control exists. Its critical deliverable is the **`FormFieldControl` abstract class + injection token** that every future ngx-tw control (and consumer-authored custom controls) will implement to plug into the form field. The contract is signal-based — no RxJS `stateChanges` stream.

`tw-form-field` itself is **not** a form control and does **not** implement `ControlValueAccessor`. CVA belongs on the wrapped control.

## API design

### Component: `FormFieldComponent`

**Selector:** `tw-form-field`

#### Inputs

- `/** Visual appearance of the field container. \`'outline'\` draws a full border around the control; \`'filled'\` uses a filled surface with a bottom border. Defaults to \`'outline'\`. */` `appearance = input<FormFieldAppearance>('outline')` — `'outline' | 'filled'`
- `/** Floating label behavior. \`'auto'\` floats above the control when focused or non-empty; \`'always'\` keeps the label floated. Defaults to \`'auto'\`. */` `floatLabel = input<FloatLabel>('auto')` — `'auto' | 'always'`
- `/** Hides the visual required marker (\`*\`) even when the wrapped control is required. ARIA \`aria-required\` remains on the control regardless. Defaults to \`false\`. */` `hideRequiredMarker = input(false)`
- `/** Semantic color for focused/active accents (border color when focused, label color when floated). Defaults to \`'primary'\`. */` `color = input<TwColor>('primary')`
- `/** Alignment of a single \`twHint\` element. When two hints are projected and each sets its own \`align\`, their own alignment wins. Defaults to \`'start'\`. */` `hintAlign = input<'start' | 'end'>('start')`

Keep the input count to these five. The wrapped control owns `disabled`, `required`, `value`, and validation — the form-field reads them.

#### Outputs

None. State flows in from the wrapped control via the `FormFieldControl` contract. If consumers need to react to focus/error changes, they subscribe to the control directly (or to `NgControl.statusChanges` on their reactive form).

#### Content projection

Three directive-based slots and two attribute-marker slots:

- `twLabel` (attribute directive on any element, typically `<label twLabel>…</label>`) — the floating label. **Structural slot, no fallback.** When omitted, the form-field renders without a label and `_hasFloatingLabel()` returns false.
- `twHint` (attribute directive, `<span twHint>…</span>` or `<div twHint align="end">…</div>`) — helper text below the control. Zero, one, or two hints allowed (one `start`, one `end`). Hidden when the control is in an error state and a `twError` is present.
- `twError` (attribute directive, `<span twError>…</span>`) — validation message(s) below the control. Multiple allowed. Displayed only when the wrapped control's `errorState()` signal is `true`. Replaces hints in the subscript area.
- `[slot="prefix"]` (CSS attribute selector on any element) — leading adornment inside the control box (icon, prefix text, button). Not a directive — consumers just add `slot="prefix"` to their element.
- `[slot="suffix"]` (CSS attribute selector) — trailing adornment inside the control box.
- Default `<ng-content>` — projects the form-field control itself (e.g., `<input twInput>`, `<tw-select>`).

**Why attribute directives for label/hint/error, not `[slot=...]`:** these elements need their own host bindings (ids for ARIA, dynamic `align` input on hint, error role). CSS attribute selectors can't carry that logic. Prefix/suffix are passive containers — a plain `[slot]` selector is sufficient and keeps consumer markup lightweight.

### Supporting directives

- **`LabelDirective`** — selector: `[twLabel]`. Injects parent `FormFieldComponent`. Generates a stable `id` (via CDK `_IdGenerator`, prefix `tw-form-field-label-`). Host bindings: `[id]="id"`, `[attr.for]="controlId()"` (computed from parent's wrapped control `id()`), and slot classes from `tv()`. The directive itself has no inputs; positioning, floating transform, and color come from parent-driven classes.
- **`HintDirective`** — selector: `[twHint]`. Injects parent. Generates a stable id (prefix `tw-form-field-hint-`). Input: `align = input<'start' | 'end'>('start')`. Host bindings: `[id]="id"`, slot classes.
- **`ErrorDirective`** — selector: `[twError]`. Injects parent. Generates a stable id (prefix `tw-form-field-error-`). Host bindings: `[id]="id"`, `role="alert"`, `aria-live="polite"`, slot classes.
- **`PrefixDirective`** — selector: `[slot="prefix"]` (scoped inside `tw-form-field`). Lightweight marker so the form-field can detect presence via `contentChildren()` and apply prefix slot classes.
- **`SuffixDirective`** — selector: `[slot="suffix"]` (scoped). Mirror of `PrefixDirective`.

All directives live in `form-field.ts` alongside the component.

### The `FormFieldControl` contract (core deliverable)

Define in `form-field.ts` and export from the entry point. **This is the critical API that every future form control in ngx-tw must implement.** Because Angular's DI and `inject()` require a token, provide both an abstract class and an `InjectionToken` that aliases it.

```typescript
/** Abstract contract every ngx-tw form-field-compatible control must implement. */
export abstract class FormFieldControl<T = unknown> {
  /** Unique id on the control's host element. Used by the form-field label `for` attribute and aria-describedby wiring. */
  abstract readonly id: Signal<string>;
  /** Current value of the control. */
  abstract readonly value: Signal<T | null>;
  /** Whether the control currently has focus. Typically driven by CDK `FocusMonitor`. */
  abstract readonly focused: Signal<boolean>;
  /** Whether the control's value is considered empty (controls the floating label). */
  abstract readonly empty: Signal<boolean>;
  /** Whether the control is disabled. */
  abstract readonly disabled: Signal<boolean>;
  /** Whether the control is marked required. */
  abstract readonly required: Signal<boolean>;
  /** Whether the control should be rendered as invalid. Control decides this (usually via NgControl.invalid && (touched || submitted)). */
  abstract readonly errorState: Signal<boolean>;
  /** Optional control-type identifier (e.g., 'input', 'select'). Form-field appends `tw-form-field-type-{controlType}` to its host for styling hooks. */
  abstract readonly controlType?: string;
  /** Consumer-supplied aria-describedby ids the form-field should preserve when merging in hint/error ids. */
  abstract readonly userAriaDescribedBy?: Signal<string | undefined>;

  /** Called by the form-field to push the merged aria-describedby ids back onto the control's host element. */
  abstract setDescribedByIds(ids: string[]): void;
  /** Called when the form-field container is clicked (used to focus the control, open a panel, etc.). */
  abstract onContainerClick(event: MouseEvent): void;
}

/** Injection token matching `FormFieldControl`. Controls register via `providers: [{ provide: TW_FORM_FIELD_CONTROL, useExisting: MyControl }]`. */
export const TW_FORM_FIELD_CONTROL = new InjectionToken<FormFieldControl<unknown>>('TW_FORM_FIELD_CONTROL');
```

**Why signals, not RxJS `stateChanges`:** the form-field component reads each field through `computed()` and template interpolation; signal graph handles change propagation automatically. No subscription lifecycle, no `markForCheck()` plumbing.

**ControlValueAccessor interop:** `FormFieldControl` is orthogonal to `ControlValueAccessor`. A concrete control (e.g., `tw-input`) implements BOTH — `ControlValueAccessor` for Angular forms integration (writeValue/registerOnChange/setDisabledState) AND `FormFieldControl` to expose state to the form-field. The control's signals are simply the reactive counterparts of the values CVA already tracks. Example: `disabled` signal is `set()` inside `setDisabledState(isDisabled)`; `empty` is `computed(() => value() == null || value() === '')`; `errorState` is `computed()` combining `NgControl.invalid()` and `NgControl.touched()` (accessed via `toSignal()` where needed, or via the signal-forms equivalent).

**How the form-field acquires the control:** use `contentChild(TW_FORM_FIELD_CONTROL)` (as a signal). When the token resolves, it gives the form-field the live contract. The form-field asserts presence in `ngAfterContentInit` and throws a clear error if missing, in dev mode only.

### Types

```typescript
export type FormFieldAppearance = 'outline' | 'filled';
export type FloatLabel = 'auto' | 'always';
```

## Usage examples

```html
<!-- Simplest case: outline appearance, label + single hint -->
<tw-form-field>
  <label twLabel>Email</label>
  <input twInput type="email" [formControl]="emailCtrl" />
  <span twHint>We'll never share your email.</span>
</tw-form-field>
```

```html
<!-- Filled appearance with prefix/suffix and required marker -->
<tw-form-field appearance="filled" color="info">
  <label twLabel>Amount</label>
  <span slot="prefix">$</span>
  <input twInput type="number" required [formControl]="amountCtrl" />
  <span slot="suffix">USD</span>
</tw-form-field>
```

```html
<!-- Error state (control decides; form-field mirrors) -->
<tw-form-field>
  <label twLabel>Username</label>
  <input twInput [formControl]="usernameCtrl" />
  @if (usernameCtrl.hasError('required')) {
    <span twError>Username is required.</span>
  }
  @if (usernameCtrl.hasError('minlength')) {
    <span twError>At least 3 characters.</span>
  }
</tw-form-field>
```

```html
<!-- Always-floated label, end-aligned hint -->
<tw-form-field floatLabel="always">
  <label twLabel>Search</label>
  <input twInput />
  <span twHint align="end">Press / to focus</span>
</tw-form-field>
```

```html
<!-- Hidden required marker (still announced via aria-required) -->
<tw-form-field hideRequiredMarker>
  <label twLabel>Name</label>
  <input twInput required [formControl]="nameCtrl" />
</tw-form-field>
```

## Styling

### `tv()` config — slots-based

Slots: `root`, `labelWrapper`, `label`, `requiredMarker`, `controlWrapper`, `prefix`, `suffix`, `subscriptWrapper`, `hint`, `error`.

**Base class intent** (the implementer fills in exact utilities against CLAUDE.md's Visual Design System — do not hardcode):

- `root` — block container with `relative` positioning (floating label needs an absolute-positioned reference). Standard text color `text-fg`. Disabled state: `opacity-50 pointer-events-none` when wrapped control is disabled.
- `controlWrapper` — flex row with `items-center gap-2`, `rounded-md` (matches small interactive elements), `transition-colors duration-200 motion-reduce:transition-none`. Contains prefix → projected control → suffix.
  - `outline` appearance: `border border-border` → `border-border-strong` on hover → `border-{color}-500` when focused (reading `_shouldShowFocus()`); uses inline padding (`px-3 py-2` at default; see size note below).
  - `filled` appearance: `bg-surface-muted border-b border-border` → `border-b-2 border-{color}-500` when focused; `hover:bg-surface-sunken`.
- `labelWrapper` — absolute-positioned wrapper inside the control row that holds the label + required marker. Starts aligned with the input's baseline (`top-1/2 -translate-y-1/2 left-3`). When floated, it translates up and scales to roughly 85% of its original size, and shifts color to `text-{color}-600` when focused, `text-fg-muted` otherwise.
- `label` — `text-sm text-fg-muted` at rest, `text-xs` when floated. Use `transition-transform duration-200 transition-colors motion-reduce:transition-none`. **No `@angular/animations`.** Floating transform applied via a computed class: `translate-y-[-1.5rem] scale-[0.85] origin-left` when floated. (Exact offset is implementer's call — target: label sits on the top border for `outline`, above the control for `filled`.) For `outline` appearance, when floated the label needs a small `bg-surface px-1` to "notch" through the border visually (keeps it readable against the border).
- `requiredMarker` — `text-error-600 ml-0.5` with `aria-hidden="true"`. Rendered only when `!hideRequiredMarker() && control.required()`.
- `prefix` / `suffix` — `flex items-center text-fg-muted` with `shrink-0`. Icon sizing per visual design system (`size-5`). Gap handled by `controlWrapper`.
- `subscriptWrapper` — below the control row, `mt-1 min-h-[1.25rem] text-xs flex justify-between`. Reserves space for one line of hint/error so the layout does not shift when validation appears.
- `hint` — `text-fg-muted`. The form-field decides order: `align="start"` hints render on the left; `align="end"` hints render on the right (via a spacer div with `flex-1`).
- `error` — `text-error-600 font-medium`. Replaces hints when `control.errorState()` is true.

**Variants** (`tv()` declaration):

- `appearance`: `'outline' | 'filled'` → applies to `controlWrapper` background/border and to `label` floated-position background notch behavior.
- `color`: all `TwColor` values. Applied via `compoundVariants` (e.g., `appearance: 'outline'` + each color → focused border `border-{color}-500` and floated label `text-{color}-600`). For `neutral`, collapse to `border-border-strong` / `text-fg` (no semantic color accent).
- `focused`: `true | false` — internal boolean variant set from the control's `focused()` signal; drives color application. Not a consumer input.
- `invalid`: `true | false` — internal; when true, overrides focused border color with `border-error-500` and label color with `text-error-600`.
- `floatLabel`: `'auto' | 'always'` — drives whether label renders in floated position regardless of focus/empty.
- `disabled`: `true | false` — internal; applies `opacity-50 pointer-events-none` to root.

`defaultVariants`: `appearance: 'outline'`, `color: 'primary'`, `focused: false`, `invalid: false`, `floatLabel: 'auto'`, `disabled: false`.

Enable `twMerge: true`.

### Size handling

This form-field does **not** expose a `size` input directly. Size is the wrapped control's concern — the `twInput` directive (future) will dictate its own padding. The form-field's `controlWrapper` simply flexes to fit. Prefix/suffix adornments align to the control's height via `items-center`.

### Focus ring

The focus ring does **not** go on the form-field root. It goes on the wrapped control itself (the input element). Form-field's `controlWrapper` only changes its border color when `control.focused()` is true. This matches native `<input>` behavior and avoids double focus indicators. The implementer will ensure the future `tw-input` uses the standard focus ring: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.

### Floating label animation — no `@angular/animations`

The floating label is a pure CSS transform. Two classes toggle based on the computed `_shouldLabelFloat()` signal:

- Resting: `translate-y-0 scale-100 text-sm`
- Floated: `-translate-y-[1.4rem] scale-[0.85] text-xs` (exact translation is implementer's call to align with the top border/edge)

Both share `transition-[transform,color,font-size] duration-200 ease-out motion-reduce:transition-none origin-[top_left]`. No `animate.enter`/`animate.leave` needed — the label element always exists; only its transform changes.

`_shouldLabelFloat()` = `floatLabel() === 'always' || control.focused() || !control.empty()`.

## Accessibility

**Label association:**
- `LabelDirective` has a generated `id`. Its host binding `[attr.for]` = the wrapped control's `id()` signal. This creates the standard `<label for="…">` association. If the control opts out (e.g., a compound widget where the form-field itself is the click target), the control can expose a flag like `disableAutomaticLabeling?: boolean` on the contract — but defer that until a real case appears; out of scope for this prompt.
- Clicking anywhere on the form-field's `controlWrapper` calls `control.onContainerClick(event)`. Concrete controls use this to focus their underlying native element.

**`aria-describedby` wiring:**
- The form-field collects ids from: any `twHint` directives (when not in error state) and all `twError` directives (when in error state). It merges these with `control.userAriaDescribedBy()` (consumer-supplied ids the control must preserve) and calls `control.setDescribedByIds(mergedIds)`. The control is responsible for applying them to its own host.
- When `errorState()` flips, the described-by ids swap from hint ids to error ids. Use a `computed()` that reads the directive lists and the error state together.

**`aria-invalid`:**
- The control owns this. When `errorState()` is true, the control applies `aria-invalid="true"` on its host. The form-field does not duplicate.

**Required marker announcement:**
- Visual marker has `aria-hidden="true"`. The control itself carries the native `required` attribute and/or `aria-required="true"` so screen readers announce requirement. `hideRequiredMarker` hides only the visual — never the semantic announcement.

**Error announcement:**
- `ErrorDirective` hosts get `role="alert"` and `aria-live="polite"` so newly-appearing errors are announced. No use of CDK `LiveAnnouncer` needed here — `role="alert"` is the accepted pattern for inline validation errors.

**Keyboard behavior:**
- None at the form-field level. All keyboard handling lives on the wrapped control. Tab order: prefix → control → suffix (natural DOM order). Prefixes/suffixes that are interactive (icon buttons) are keyboard-reachable by default.

**Must pass AXE** and meet WCAG AA color contrast (semantic tokens already designed to comply; verify the floated-label color on both appearances).

## Error state logic

**The wrapped control owns `errorState()`.** The form-field never computes validation itself. A concrete control typically derives `errorState` as:

```
errorState = computed(() => ngControl.invalid() && (ngControl.touched() || parentFormSubmitted()))
```

The form-field reads `control.errorState()` and:
1. Sets its own `invalid` variant to swap border/label colors.
2. In the subscript area: if `errorState()` is true AND at least one `twError` child is projected → render the error list (hide hints). Otherwise → render hints.

Subscript swap uses `@if` in the template — no animation is needed. If a subtle fade is desirable later, the implementer can add `animate.enter="fade-in"` using the existing keyframes in `projects/ngx-tw/theme/_base.css`; do not add it preemptively.

## Form integration

**`tw-form-field` does NOT implement `ControlValueAccessor`.** It is a presentational wrapper around a control. The control (e.g., future `tw-input`) is the CVA.

Concrete controls that want to be usable inside `tw-form-field` must:
1. Extend (or implement) `FormFieldControl<T>` and expose all required signals.
2. Provide themselves under the `TW_FORM_FIELD_CONTROL` token:
   ```typescript
   providers: [{ provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => InputDirective) }]
   ```
3. Implement `ControlValueAccessor` independently so Angular forms (template-driven, reactive, signal-based forms) can bind. CVA and `FormFieldControl` are composed on the same class.

Because this component ships before `tw-input`, spec tests must verify the contract using a **minimal fake control** (a standalone test-only component that implements `FormFieldControl` with manually-set signals). See File structure → spec.

## Implementation notes

- `FormFieldComponent` uses `contentChild(TW_FORM_FIELD_CONTROL)` as a signal to acquire the control lazily. Also `contentChild(LabelDirective)`, `contentChildren(HintDirective)`, `contentChildren(ErrorDirective)`, `contentChildren(PrefixDirective)`, `contentChildren(SuffixDirective)`. Use the signal-based APIs (not `@ContentChild` decorators).
- In `ngAfterContentInit`, assert the control is present; throw a clear dev-mode error if missing (mirror the pattern used by Material's `getMatFormFieldMissingControlError`, but as a plain `Error` thrown only when `ngDevMode`).
- Validate hint alignment in dev mode only: at most one `align="start"` and one `align="end"`. Throw a descriptive error if exceeded.
- ID generation: use CDK `_IdGenerator` from `@angular/cdk/a11y` (same pattern Material uses). Each directive calls `inject(_IdGenerator).getId('tw-form-field-{kind}-')` in a field initializer.
- Derived signals on `FormFieldComponent`:
  - `hasLabel = computed(() => !!labelChild())`
  - `shouldLabelFloat = computed(() => floatLabel() === 'always' || (!!control() && (control()!.focused() || !control()!.empty())))`
  - `isInvalid = computed(() => !!control()?.errorState())`
  - `isDisabled = computed(() => !!control()?.disabled())`
  - `isFocused = computed(() => !!control()?.focused())`
  - `subscriptMode = computed<'error' | 'hint'>(() => isInvalid() && errorChildren().length > 0 ? 'error' : 'hint')`
  - `describedByIds = computed(() => subscriptMode() === 'error' ? errorChildren().map(e => e.id) : hintChildren().map(h => h.id))`
- Push `describedByIds` to the control via an `effect()` that calls `control()?.setDescribedByIds([...consumerIds, ...generatedIds])`. Include `control()?.userAriaDescribedBy()` in the merge.
- Host click: `host: { '(click)': '_onContainerClick($event)' }` → delegates to `control()?.onContainerClick(event)`.
- `controlType` hook: when set on the control, add a class `tw-form-field-type-{controlType}` to the root via `[class]` binding (gives consumers a styling hook).
- Do not subscribe to anything. No `RxJS`. All reactivity flows through signals.
- Template size will likely exceed 50 lines — extract to `form-field.html`.
- All directives and the component live in a single `form-field.ts` file (with the template in `form-field.html`).

## File structure

All files in `projects/ngx-tw/form-field/`:

- `form-field.ts` — `FormFieldComponent`, `LabelDirective`, `HintDirective`, `ErrorDirective`, `PrefixDirective`, `SuffixDirective`, `FormFieldControl` abstract class, `TW_FORM_FIELD_CONTROL` injection token, `FormFieldAppearance` and `FloatLabel` types, `tv()` config.
- `form-field.html` — extracted template (expected > 50 lines due to outline/filled branching, label wrapper, prefix/suffix slots, subscript swap).
- `form-field.spec.ts` — Vitest tests covering:
  - Default render (component mounts without errors when a minimal fake `FormFieldControl` is projected).
  - Dev-mode error thrown when no control is projected.
  - Each `appearance` value renders without errors.
  - Each `color` value renders without errors.
  - `hideRequiredMarker`: marker present/absent based on input, regardless of control's `required()`.
  - Label `for` attribute equals the control's `id()`.
  - `aria-describedby` ids are set on the control (via spy on `setDescribedByIds`) when hints are projected; ids reflect **error** directives when `errorState()` is true.
  - `role="alert"` on each `twError`.
  - Floating label state toggles based on `floatLabel()`, `control.focused()`, `control.empty()` (assert through the presence of the floated-state class on the label host, or through DOM position — prefer DOM position).
  - Error subscript replaces hint subscript when `control.errorState()` becomes true.
  - Clicking the form-field container calls `control.onContainerClick(event)` (spy).
  - Duplicate hint alignment throws in dev mode.
  - Disabled class/appearance applied when `control.disabled()` is true.
  - `userAriaDescribedBy` ids are preserved in the merged described-by output.
  - Contract fake: include a `TestFormFieldControlComponent` in the spec that implements `FormFieldControl` with `signal()`-backed fields and provides itself under `TW_FORM_FIELD_CONTROL`. Use `fixture.componentRef.setInput` or direct signal `set()` on the fake to drive state transitions. No `fakeAsync`/`tick` — use `async/await` with `fixture.whenStable()`; use `vi.spyOn()` for method spies.
- `index.ts` — public API exports.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Also update:
- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/form-field';`.
- No changes to `projects/ngx-tw/theme/_base.css` — no new keyframes; floating label is CSS transform only.

## Public API exports

From `projects/ngx-tw/form-field/index.ts`:
```typescript
export { FormFieldComponent, LabelDirective, HintDirective, ErrorDirective, PrefixDirective, SuffixDirective } from './form-field';
export { FormFieldControl, TW_FORM_FIELD_CONTROL } from './form-field';
export type { FormFieldAppearance, FloatLabel } from './form-field';
```

## Constraints

- `ChangeDetection.OnPush` on the component and every directive.
- Signal-based APIs only: `input()`, `computed()`, `contentChild()`, `contentChildren()`, `effect()`. No RxJS inside the form-field. No `@ContentChild` decorators.
- No `@HostBinding`/`@HostListener` — use the `host` object.
- No `@angular/animations` — floating label uses `transition-transform`/`transition-colors` Tailwind utilities.
- No CSS files — all styling via Tailwind utilities in `tv()` config.
- Semantic color tokens only — never raw palette colors. Neutral structural styling uses surface/fg/border tokens.
- All visual tokens (radius `rounded-md`, transition durations, typography `text-sm`/`text-xs`, borders `border-border`/`border-border-strong`, focus handling on the control, spacing scale) must match the Visual Design System in CLAUDE.md. Do not invent values.
- `twMerge: true` in `tv()` config.
- JSDoc on every `input()`, every abstract member of `FormFieldControl`, and every public symbol exported from `index.ts`.
- Tests use Vitest — `vi.spyOn()`, `async/await`, no `fakeAsync`/`tick`.
- Keep inputs at five (`appearance`, `floatLabel`, `hideRequiredMarker`, `color`, `hintAlign`). Control-owned concerns (`disabled`, `required`, `value`, validation) do NOT get form-field inputs.
