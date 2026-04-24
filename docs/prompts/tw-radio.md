# Prompt: Build `tw-radio` and `tw-radio-group` for ngx-tw

## Context

Before starting, read:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full project conventions (Angular v21 signals, Tailwind v4 semantic + surface/fg/border tokens, `tv()` with `twMerge`, no `@angular/animations`, Vitest rules, no `fakeAsync`, Visual Design System).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/segmented-control/segmented-control.ts` — **primary structural reference for the parent/child model**. Mirror: `contentChildren` query on the group, `forwardRef` DI on children, `linkedSignal()` mirror of `model()`, static color lookup tables for Tailwind v4 scanning, roving-tabindex via `isFocusable()` on each child, keyboard wrapping, `FocusMonitor` lifecycle, CVA block.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/checkbox/checkbox.ts` — reference for a single-input-like control with a slotted `tv()`, dev-mode accessible-name warning, `animate.enter="check-in"` on the selected indicator, per-slot `computed()` classes, static `SOLID_*` / `OUTLINE_*` color lookup tables. **Re-use the existing `.check-in` keyframe** already added to `theme/_base.css` — no new animation CSS is required.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/switch/switch.ts` — reference for CVA shape, dev-mode accessible-name hint, host `role` semantics.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/docs/prompts/tw-checkbox.md` and `/Users/ciprianiuga/dev/sandbox/ngx-tw/docs/prompts/tw-switch.md` — prompt siblings; keep naming/section style consistent with these.

CDK modules to import:

- `@angular/cdk/a11y` — `FocusMonitor` (both components), `FocusKeyManager` (group) for wrapping roving-tabindex keyboard navigation.
- `@angular/cdk/keycodes` — `SPACE`, `ENTER`, `UP_ARROW`, `DOWN_ARROW`, `LEFT_ARROW`, `RIGHT_ARROW`, `HOME`, `END`.

## What to build

Two standalone, accessible components that compose into a single, highly customizable radio pattern:

- **`<tw-radio-group>`** — the container. Owns the selection state and implements `ControlValueAccessor` so it works with template-driven (`[(ngModel)]`), reactive (`formControl` / `formControlName`), and signal-based forms. Provides itself through a DI token (`TW_RADIO_GROUP`) that child radios consume. Handles keyboard navigation (ARIA APG radiogroup pattern: arrow keys move selection with wrap, Space selects the focused radio, Home/End jump to first/last enabled). Hosts `role="radiogroup"`, `aria-orientation`, `aria-disabled`, `aria-required`, and the accessible-name attributes.

- **`<tw-radio>`** — the individual radio button. Renders a hollow circle with an inner dot when selected, plus optional inline label/description and content projection slots. Hosts `role="radio"`, `aria-checked`, `aria-disabled`, roving `tabindex`. Consults the parent group via DI when present; when no group is present, behaves as a standalone boolean toggle (source of truth is its own `checked` model). Never implements CVA itself — the group owns form integration.

Both components use Tailwind v4 utilities exclusively, semantic color tokens for the selected indicator, and surface/fg/border tokens for neutral structural styling. No hidden native `<input type="radio">` — the host carries the ARIA semantics (same decision as `tw-switch` and `tw-checkbox`; the CVA bridges form serialization).

### Design decisions baked in

- **Parent/child coupling via a DI token, not a class-type inject.** Define `TW_RADIO_GROUP` (`InjectionToken<TwRadioGroupApi>`). The group provides itself via the token; the radio injects it with `{ optional: true }`. Rationale: allows future custom containers (e.g., a data-driven wrapper) to expose the same contract without subclassing, and keeps `tw-radio` usable standalone.
- **Value generic.** `RadioGroupComponent<T = unknown>` — the group is typed on `T` so consumers get type safety on `value`/`valueChange` when they pass a concrete type (`string`, number, enum). The token contract declares `value: Signal<unknown>` to keep the token non-generic.
- **No per-radio `required`.** Required is a group-level concern (radiogroups are either required or not). The group exposes `required`; the group's host gets `aria-required`.
- **No hidden `<input>`.** See Accessibility — host elements carry ARIA semantics; the group's CVA emits the selected value.
- **Re-use `.check-in` keyframe.** The radio dot enters with `animate.enter="check-in"`, pointing at the keyframe already defined in `theme/_base.css` by the checkbox prompt. No theme changes are required by this prompt.

## API design

### `tw-radio-group`

#### Selector

`tw-radio-group` — element selector, standalone component, `ChangeDetectionStrategy.OnPush`.

#### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `color` | `TwColor` | `'primary'` | `/** Sets the semantic color applied to the selected radio's dot/ring. Propagated to children unless a child overrides it. Defaults to \`'primary'\`. */` |
| `size` | `TwSize` | `'md'` | `/** Controls the overall scale of radios inside the group. Propagated to children unless a child overrides it. Defaults to \`'md'\`. */` |
| `variant` | `RadioVariant` | `'solid'` | `/** Visual style of the selected indicator. \`'solid'\` fills the dot with the color against a colored ring; \`'outline'\` keeps a transparent fill with a colored ring and colored dot. Propagated to children unless a child overrides it. Defaults to \`'solid'\`. */` |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | `/** Layout direction of the group. Drives \`aria-orientation\` and the arrow-key model. Defaults to \`'vertical'\`. */` |
| `disabled` | `boolean` | `false` | `/** When true, disables every radio in the group and blocks keyboard interaction. Defaults to \`false\`. */` |
| `required` | `boolean` | `false` | `/** When true, sets \`aria-required="true"\` on the group for assistive tech. Defaults to \`false\`. */` |
| `name` | `string \| undefined` | `undefined` | `/** Optional form-association name. Propagated to each child radio's host \`name\` attribute so standard HTML form semantics still apply. */` |
| `ariaLabel` (alias `'aria-label'`) | `string \| undefined` | `undefined` | `/** Accessible name for the group when no visible label is provided. Mirrored to \`aria-label\`. */` |
| `ariaLabelledby` (alias `'aria-labelledby'`) | `string \| undefined` | `undefined` | `/** ID of an external element that labels the group. Mirrored to \`aria-labelledby\`. */` |
| `ariaDescribedby` (alias `'aria-describedby'`) | `string \| undefined` | `undefined` | `/** ID of an external element that describes the group. Mirrored to \`aria-describedby\`. */` |

**Input count:** 10 inputs + 1 model exceeds the 5–6 guideline, consistent with `tw-switch` / `tw-checkbox` prompts. Justified by: parity with the sibling controls, full CVA + a11y plumbing, and the user's explicit "highly customizable" request. No input has hidden behavior — each has a single, clear purpose.

#### Models (two-way)

| Model | Type | Default | JSDoc |
|---|---|---|---|
| `value` | `T \| null` | `null` | `/** Two-way bound selected value. Updates when the user picks a radio; fires \`valueChange\`. \`null\` means no selection. */` |

#### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `change` | `T \| null` | `/** Fires after the selected value changes from a user interaction. Does not fire when the value is updated programmatically via \`writeValue\`. */` |

`valueChange` is auto-generated by the `model()` — do NOT redeclare.

#### Content projection

The group renders exactly one `<ng-content />` and expects `<tw-radio>` children (or any element; the group only queries for `RadioComponent` via `contentChildren`). There are no named slots on the group.

#### Supporting types

```ts
export type RadioVariant = 'solid' | 'outline';
export type RadioOrientation = 'horizontal' | 'vertical';

/** Minimal contract the radio-group exposes to child radios through the DI token. */
export interface TwRadioGroupApi {
  readonly value: Signal<unknown>;
  readonly color: Signal<TwColor>;
  readonly size: Signal<TwSize>;
  readonly variant: Signal<RadioVariant>;
  readonly name: Signal<string | undefined>;
  readonly isDisabled: Signal<boolean>;
  /** Called by a child when the user activates it (click or keyboard). */
  selectValue(value: unknown): void;
}

export const TW_RADIO_GROUP = new InjectionToken<TwRadioGroupApi>('TW_RADIO_GROUP');
```

### `tw-radio`

#### Selector

`tw-radio` — element selector, standalone component, `ChangeDetectionStrategy.OnPush`.

#### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `value` | `unknown` | `undefined` | `/** The value this radio contributes when selected inside a \`tw-radio-group\`. Required when nested in a group; ignored when used standalone. */` |
| `color` | `TwColor \| undefined` | `undefined` | `/** Overrides the parent group's color for this radio. When undefined, inherits from the group (or defaults to \`'primary'\` standalone). */` |
| `size` | `TwSize \| undefined` | `undefined` | `/** Overrides the parent group's size for this radio. When undefined, inherits from the group (or defaults to \`'md'\` standalone). */` |
| `variant` | `RadioVariant \| undefined` | `undefined` | `/** Overrides the parent group's variant for this radio. When undefined, inherits from the group (or defaults to \`'solid'\` standalone). */` |
| `disabled` | `boolean` | `false` | `/** When true, disables this radio regardless of the group's state. Group-disabled always wins as an OR. Defaults to \`false\`. */` |
| `label` | `string \| undefined` | `undefined` | `/** Optional inline label rendered next to the radio. Ignored when label content is projected. */` |
| `description` | `string \| undefined` | `undefined` | `/** Optional secondary description rendered under the label. Ignored when description content is projected. */` |
| `labelPosition` | `'before' \| 'after'` | `'after'` | `/** Position of the label/description relative to the radio. Defaults to \`'after'\`. */` |
| `name` | `string \| undefined` | `undefined` | `/** Optional name attribute for standalone use. Ignored when the parent group provides a name. */` |
| `ariaLabel` (alias `'aria-label'`) | `string \| undefined` | `undefined` | `/** Accessible name when no visible label is provided. Mirrored to \`aria-label\`. */` |
| `ariaLabelledby` (alias `'aria-labelledby'`) | `string \| undefined` | `undefined` | `/** ID of an external element that labels the radio. Mirrored to \`aria-labelledby\`. */` |
| `ariaDescribedby` (alias `'aria-describedby'`) | `string \| undefined` | `undefined` | `/** ID of an external element that describes the radio. Mirrored to \`aria-describedby\`. */` |

#### Models (two-way)

| Model | Type | Default | JSDoc |
|---|---|---|---|
| `checked` | `boolean` | `false` | `/** Two-way bound checked state. Authoritative only in standalone mode; when inside a \`tw-radio-group\`, this model reflects group selection but does NOT drive it. */` |

Rationale: inside a group, `checked` is derived from `group.value() === value()`. A user click inside a group calls `group.selectValue(this.value())` — the group's `value` model then propagates back and the radio's `checked` is re-derived. Standalone, `checked` is the source of truth and toggles to `true` on click (radios do not toggle back off on re-click — that matches native `<input type="radio">`).

#### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `change` | `boolean` | `/** Fires after the checked state changes from a user interaction on this radio. In grouped mode only fires when this radio becomes the selected one. Does not fire when selection is updated programmatically. */` |

#### Content projection

| Slot selector | Purpose | Fallback |
|---|---|---|
| (default — no selector) | Optional rich label content. Replaces the `label` input when provided. | None — if neither default content nor `label` is set, the label region is not rendered. |
| `[slot="description"]` | Optional description content. Replaces the `description` input when provided. | None. |
| `[slot="dot"]` | Overrides the default inner dot glyph shown when the radio is selected. | Default: a filled `<span>` dot sized via the size scale (see Styling). |

Use `contentChild()` queries where detection is required (follow the checkbox/switch pattern). Default-slot label detection mirrors `tw-switch`.

## Usage examples

```html
<!-- Simplest case: reactive form -->
<tw-radio-group formControlName="plan" aria-label="Subscription plan">
  <tw-radio value="free" label="Free" />
  <tw-radio value="pro" label="Pro" />
  <tw-radio value="team" label="Team" />
</tw-radio-group>
```

```html
<!-- Two-way binding with a signal -->
<tw-radio-group [(value)]="selectedPlan" color="success" size="lg">
  <tw-radio value="monthly" label="Monthly" description="Billed every month" />
  <tw-radio value="annual" label="Annual" description="Save 20% with yearly billing" />
</tw-radio-group>
```

```html
<!-- Horizontal orientation, variant override on a single radio -->
<tw-radio-group [(value)]="priority" orientation="horizontal" variant="outline">
  <tw-radio value="low" label="Low" />
  <tw-radio value="med" label="Medium" />
  <tw-radio value="high" label="High" color="error" variant="solid" />
</tw-radio-group>
```

```html
<!-- Rich projected content per radio -->
<tw-radio-group [(value)]="shippingMethod" aria-labelledby="shipping-heading">
  <tw-radio value="standard">
    <span>Standard shipping</span>
    <span slot="description">Arrives in 3–5 business days</span>
  </tw-radio>
  <tw-radio value="express">
    <span>Express shipping</span>
    <span slot="description">Arrives tomorrow</span>
  </tw-radio>
</tw-radio-group>
```

```html
<!-- Disabled group -->
<tw-radio-group [(value)]="locked" [disabled]="true" aria-label="Locked setting">
  <tw-radio value="a" label="Option A" />
  <tw-radio value="b" label="Option B" />
</tw-radio-group>
```

```html
<!-- Per-radio disabled inside an enabled group -->
<tw-radio-group [(value)]="choice">
  <tw-radio value="a" label="Available" />
  <tw-radio value="b" label="Unavailable" [disabled]="true" />
  <tw-radio value="c" label="Available" />
</tw-radio-group>
```

```html
<!-- Standalone radio (no group) — behaves as a boolean toggle via [(checked)] -->
<tw-radio [(checked)]="confirmed" label="I confirm this action" />
```

## Styling

Two `tv()` configs — one per component. Both enable `twMerge: true`. Active color styling is wired via two static `Record<TwColor, string>` lookup tables per variant — mirror `checkbox.ts`'s `SOLID_*` / `OUTLINE_*` pattern so Tailwind v4 scans all class combinations.

### `tw-radio-group` `tv()` (flat, no slots)

- `base`: `flex` plus layout utilities per orientation.
- Variants:
  - `orientation`:
    - `vertical` → `flex-col gap-2`
    - `horizontal` → `flex-row flex-wrap gap-3`
  - `disabled`:
    - `true` → `opacity-50 pointer-events-none cursor-not-allowed`
    - `false` → `''`
- `defaultVariants`: `{ orientation: 'vertical', disabled: false }`.

### `tw-radio` `tv()` with slots

```
slots:
  root        — outer row wrapper (clickable); flex layout, swapped via labelPosition
  circleWrap  — positioning wrapper for the ring (relative, shrink-0, mt-0.5)
  circle      — the outer ring (rounded-full border), background/border vary with state/variant
  dot         — the inner filled dot (absolute-centered), shown only when selected
  labelWrap   — vertical stack of label + description
  label       — label text
  description — description text
```

Base classes per slot:

- `root`: `inline-flex items-start gap-3 cursor-pointer select-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`
- `circleWrap`: `relative inline-flex items-center justify-center shrink-0 mt-0.5`
- `circle`: `inline-flex items-center justify-center rounded-full border bg-surface transition-colors duration-200 motion-reduce:transition-none`
- `dot`: `inline-block rounded-full pointer-events-none`
- `labelWrap`: `flex flex-col min-w-0 empty:hidden`
- `label`: `font-medium text-fg empty:hidden`
- `description`: `text-fg-muted empty:hidden`

`tv()` variants:

```
size:
  xs → circle: 'size-3.5', dot: 'size-1.5',   label: 'text-xs',   description: 'text-[11px]'
  sm → circle: 'size-4',   dot: 'size-2',     label: 'text-sm',   description: 'text-xs'
  md → circle: 'size-5',   dot: 'size-2.5',   label: 'text-sm',   description: 'text-xs'
  lg → circle: 'size-6',   dot: 'size-3',     label: 'text-base', description: 'text-sm'
  xl → circle: 'size-7',   dot: 'size-3.5',   label: 'text-base', description: 'text-sm'

labelPosition:
  before → root: 'flex-row-reverse'
  after  → root: 'flex-row'

checked:
  true  → circle: ''  // color applied via static lookup at runtime
  false → circle: 'border-border hover:border-border-strong'

disabled:
  true  → root: 'opacity-50 pointer-events-none cursor-not-allowed'
  false → root: ''
```

`defaultVariants`: `{ size: 'md', labelPosition: 'after', checked: false, disabled: false }`.

### Static selected-state color lookups

Define at the top of `radio.ts`, outside the component, fully static strings:

```ts
// Solid: colored ring + white-ish dot (black on warning).
const SOLID_RING: Record<TwColor, string>;
//   primary: 'border-primary-600'   ...   warning: 'border-warning-500'   ...

const SOLID_DOT: Record<TwColor, string>;
//   primary: 'bg-primary-600'       ...   warning: 'bg-warning-500'       ...

// Outline: colored ring + same-colored dot, fill stays bg-surface.
const OUTLINE_RING: Record<TwColor, string>;   // same shape as SOLID_RING
const OUTLINE_DOT: Record<TwColor, string>;    // same shape as SOLID_DOT
```

Use `{color}-600` across the board, `{color}-500` for warning, and `border-fg` / `bg-fg` for `neutral` (match the checkbox exactly so the two controls look consistent side-by-side).

### Wiring

- `circleClasses` computed = `variantResult().circle()` + (selected ? `(variant==='solid' ? SOLID_RING[color] : OUTLINE_RING[color])` : '').
- `dotClasses` computed = `variantResult().dot()` + `(variant==='solid' ? SOLID_DOT[color] : OUTLINE_DOT[color])`.
- Host `[attr.data-checked]` on the radio so consumers/tests can assert state without sniffing class strings. Analogous `[attr.data-checked]` and `[attr.data-value]` on the radio host are optional but encouraged.
- Dot rendered via `@if (isSelected())` inside the `circle` slot; wrap the dot element with `animate.enter="check-in"` so it pops in using the existing theme keyframe.
- All visual tokens (radius `rounded-full` on circle/dot, `rounded-md` focus target, transition `duration-200 motion-reduce:transition-none`, focus ring `outline-2 outline-offset-2 outline-primary-500`, gap `gap-2` vertical / `gap-3` horizontal, disabled opacity `50`) match CLAUDE.md's Visual Design System. Do not invent new values.

## Accessibility

### Group host

- `role="radiogroup"`.
- `[attr.aria-orientation]="orientation()"`.
- `[attr.aria-disabled]="isDisabled() || null"`.
- `[attr.aria-required]="required() || null"`.
- `[attr.aria-label]`, `[attr.aria-labelledby]`, `[attr.aria-describedby]` mirror inputs.
- Dev-mode warning via `afterNextRender` + `isDevMode()`: if none of `ariaLabel`, `ariaLabelledby`, and visible label text (group's own textContent minus the radios' textContent is hard to measure cleanly; use the simpler check: at least one of `ariaLabel`/`ariaLabelledby` is present) is set, log `[tw-radio-group] The radiogroup has no accessible name. Set aria-label or aria-labelledby.`. Mirror the switch's `hasAccessibleNameHint()` shape.
- The group does **not** take `tabindex` — focus lands on the currently-selected radio (or the first enabled radio if none is selected). This is the ARIA APG roving-tabindex pattern.

### Radio host

- `role="radio"`.
- `[attr.aria-checked]="isSelected() ? 'true' : 'false'"`.
- `[attr.aria-disabled]="isDisabled() || null"`.
- `[attr.aria-label]`, `[attr.aria-labelledby]`, `[attr.aria-describedby]` mirror inputs (same "labelledby points at internal label id when no external labelling is supplied" pattern used by `tw-switch`/`tw-checkbox`).
- `[attr.tabindex]` = roving: `0` when the radio is the "active" one (selected, or first enabled when nothing selected) AND not disabled; otherwise `-1`.
- `[attr.name]` = `parent?.name() ?? own name() ?? null`.

### Keyboard (group-level `(keydown)` listener)

Use a `FocusKeyManager<RadioComponent>` created in the group's `ngOnInit`:

```ts
this.keyManager = new FocusKeyManager(this.radios)
  .withWrap()
  .withHomeAndEnd()
  .skipPredicate((r: RadioComponent) => r.isDisabled());
```

Handle these keys on the group host:

- `ArrowDown` / `ArrowRight` → `keyManager.setNextItemActive()`, then `selectValue(activeItem.value())`. `preventDefault()`.
- `ArrowUp` / `ArrowLeft` → `keyManager.setPreviousItemActive()`, then `selectValue(activeItem.value())`. `preventDefault()`.
- `Home` → `keyManager.setFirstItemActive()`, then select. `preventDefault()`.
- `End` → `keyManager.setLastItemActive()`, then select. `preventDefault()`.
- `Space` → if the focused item isn't already selected, `selectValue(active.value())` and `preventDefault()`. (Enter does NOT activate a radio — matches native semantics and ARIA APG.)
- Disabled group → return early, emit nothing.

Child radios must implement the `FocusableOption` contract: a `focus()` method that calls `this.elementRef.nativeElement.focus()`. Wire the key manager to the `contentChildren(RadioComponent)` `QueryList` — update it on `radios.changes` (subscribe via `takeUntilDestroyed(destroyRef)`).

### Focus

- Both components use `FocusMonitor.monitor` on the host in `ngOnInit` and `stopMonitoring` in `destroyRef.onDestroy`.
- Focus ring on the radio: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
- The radio's entire row is the click target — clicking label or description selects. Click on a disabled radio does nothing.

### Reduced motion

- Radio transitions carry `motion-reduce:transition-none`.
- The `.check-in` animation used by the dot already has `animation-duration: 0ms` under `prefers-reduced-motion` in `theme/_base.css` (added by the checkbox prompt) — no action required by this prompt.

## Form integration

Implement `ControlValueAccessor` **only on `RadioGroupComponent`**, provided via `NG_VALUE_ACCESSOR` with `forwardRef(() => RadioGroupComponent)` and `multi: true`. The individual radio never implements CVA. Mirror the segmented-control implementation.

- **`writeValue(value: T | null)`**: update both the `value` model and the internal `activeValue = linkedSignal(() => this.value())`. Do NOT emit `change` from `writeValue`.
- **`registerOnChange(fn)`** / **`registerOnTouched(fn)`**: store on private fields; call inside `selectValue()` and in a host `(blur)` listener.
- **`setDisabledState(isDisabled)`**: write to `cvaDisabled = signal(false)`; `isDisabled = computed(() => disabled() || cvaDisabled())` drives ARIA and child disabled cascade.

Must work with template-driven (`[(ngModel)]`), reactive (`formControl`/`formControlName`), and signal-based forms. Do not import any forms-strategy-specific symbol other than `ControlValueAccessor` and `NG_VALUE_ACCESSOR`.

This prompt does **not** implement `FormFieldControl` / `TW_FORM_FIELD_CONTROL` — the radio-group is standalone. A later prompt can add form-field adapter support.

## Implementation notes

### Group

- `model<T | null>('value', null)` + `activeValue = linkedSignal(() => this.value())` — same pattern as `segmented-control`.
- Provide itself through `TW_RADIO_GROUP`:

  ```ts
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioGroupComponent), multi: true },
    { provide: TW_RADIO_GROUP, useExisting: forwardRef(() => RadioGroupComponent) },
  ]
  ```

- Implement `TwRadioGroupApi` — exposes `value`, `color`, `size`, `variant`, `name`, `isDisabled`, and `selectValue(value)`. Every field must be a `Signal` so children can `computed()` cleanly.
- `contentChildren(RadioComponent, { descendants: true })` query, stored as `radios`.
- `selectValue(next: unknown)`:
  1. If `isDisabled()` → return.
  2. If `next === activeValue()` → still call `onTouched()` (user pressed Space on the already-selected radio, which counts as an interaction) but do NOT emit `change`.
  3. Otherwise: `activeValue.set(next); value.set(next); onChange(next); onTouched(); change.emit(next);`.
- Initialise `FocusKeyManager` in `ngOnInit` with the `radios` `QueryList`; update on `radios.changes`. Respect `orientation()` — the key manager itself doesn't care, but use the orientation to decide whether `ArrowLeft`/`ArrowRight` (horizontal) or `ArrowUp`/`ArrowDown` (vertical) activate. Per ARIA APG: accept both axes in both orientations — the orientation only affects `aria-orientation`, not which keys work. Pick the simpler "both axes work in both orientations" behaviour.
- Generate a unique host id (`tw-radio-group-${nextGroupId++}`).
- Accessible-name dev-mode warning as described in Accessibility.

### Radio

- Inject `const parent = inject(TW_RADIO_GROUP, { optional: true })`.
- `effectiveColor = computed(() => this.color() ?? parent?.color() ?? 'primary')`. Same pattern for `size`, `variant`.
- `effectiveName = computed(() => parent?.name() ?? this.name())`.
- `isSelected = computed(() => parent ? parent.value() === this.value() : this.internalChecked())`.
- `internalChecked = linkedSignal(() => this.checked())` (for standalone mode).
- `isDisabled = computed(() => this.disabled() || (parent?.isDisabled() ?? false))`.
- `isFocusable = computed(() => { ... })` — same logic segmented-control uses: if disabled, false; if selected, true; if parent has no selection, first enabled radio is focusable; else false. Standalone: always `tabindex=0` unless disabled.
- `onActivate()` (called from click and from `FocusKeyManager`'s Space handling):
  1. If `isDisabled()` → return.
  2. If `parent` → `parent.selectValue(this.value())` and emit `change.emit(true)` if this radio became selected (check after the parent's signal has propagated — simplest is: if `!wasSelected && isSelected()` after microtask, emit; or unconditionally emit `change(true)` since a click always "means" I want this one selected). Prefer: emit `change(true)` only when `!wasSelected` before the call.
  3. Else (standalone) → `internalChecked.set(true); checked.set(true); change.emit(true);`.
- `focus()` public method: `this.elementRef.nativeElement.focus()` — required for `FocusKeyManager` to navigate.
- Host bindings via the `host:` object only.
- Class composition: one `computed()` per slot (`rootClasses`, `circleWrapClasses`, `circleClasses`, `dotClasses`, `labelWrapClasses`, `labelClasses`, `descriptionClasses`). The `circleClasses` and `dotClasses` computed append the correct static lookup entries only when selected.
- `contentChild()` queries for `[slot="dot"]` and `[slot="description"]`; fall back to the default dot / input strings via `@if`.
- `onBlur()` calls `parent?.['_notifyTouched']?.()` if the group exposes that path — simpler: the group attaches its own `(blur)` listener via the host listener and relies on focus moving within the group for `onTouched`. Keep the radio free of CVA concerns.
- Accessible-name dev-mode warning: mirror the checkbox's `hasAccessibleNameHint()` pattern.

### Both components

- No `@angular/animations`. Dot uses `animate.enter="check-in"` referencing the existing theme keyframe.
- Host bindings via `host:` only. No `@HostBinding` / `@HostListener`.
- `inject()` for all DI. No constructor injection.
- Native control flow only (`@if`, `@for`). No arrow functions in templates.
- No `ngClass` / `ngStyle`.

## File structure

Create the following under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/radio/`:

- `radio.ts` — contains:
  - `RadioVariant` type, `RadioOrientation` type.
  - `TwRadioGroupApi` interface.
  - `TW_RADIO_GROUP` InjectionToken.
  - `RadioComponent` (`tw-radio`).
  - `RadioGroupComponent` (`tw-radio-group`).
  - `tv()` configs (one per component) and static color lookup tables.
  - Single file for both components so the `forwardRef` dance is straightforward and matches the segmented-control precedent.
- `radio.spec.ts` — Vitest tests covering:
  - **Rendering (group):** mounts empty; sets `role="radiogroup"`, `aria-orientation="vertical"` by default and `"horizontal"` when overridden; sets `aria-required` when `required`; every `color`, `size`, `variant`, and `orientation` renders without errors.
  - **Rendering (radio):** mounts standalone with defaults; sets `role="radio"`, `aria-checked="false"` initially; label input and `[slot="description"]` both render; projected default-slot label replaces `label` input; `[slot="dot"]` replaces the default dot when selected; disabled radio gets `aria-disabled="true"` and `tabindex="-1"`.
  - **Selection (grouped):** clicking a radio updates the group's `[(value)]` signal and emits `change`; `value`/`aria-checked` on the clicked radio flips to `true` and all siblings flip to `false`; programmatic `value.set()` or `FormControl.setValue()` updates the DOM without firing `change`.
  - **Keyboard (grouped):** Home, End, ArrowDown/ArrowUp, ArrowLeft/ArrowRight move selection with wrap; disabled radios are skipped; Space on the focused radio selects it (and emits `change` only if it wasn't already selected); Enter does nothing; arrow keys call `preventDefault`.
  - **Roving tabindex:** initially the first enabled radio has `tabindex="0"` and others `-1`; after selection, the selected radio has `0` and others `-1`; a disabled radio is never `0`.
  - **Disabled cascade:** `[disabled]="true"` on the group disables every radio (each radio's `aria-disabled="true"`); per-radio `[disabled]="true"` disables only that radio; click and keyboard on a disabled radio emit nothing.
  - **Inheritance overrides:** `color`/`size`/`variant` on the radio override the group's values; when omitted, radios inherit.
  - **Name propagation:** group `name="plan"` mirrors to every radio's `[attr.name]="plan"`; per-radio `name` is ignored when inside a group.
  - **Standalone radio:** `<tw-radio>` without a group uses its own `[(checked)]`; click sets `checked` to `true`; re-click does NOT unset (native radio semantics); disabled blocks click.
  - **Accessibility:** group `aria-label` / `aria-labelledby` reflected; group without an accessible name logs a dev-mode warning (spy on `console.warn`); radio without any accessible name also warns; `aria-checked` flips correctly on each radio during selection; unique ids per group and per radio.
  - **ControlValueAccessor (reactive forms host):** initializes from `FormControl.value`; user selection updates `FormControl.value`; `FormControl.setValue('pro')` updates DOM `aria-checked`; `FormControl.disable()` blocks interaction and cascades `aria-disabled` to every radio.
  - **ControlValueAccessor (template-driven host):** `[(ngModel)]` round-trip with `await fixture.whenStable()`.
  - **FocusMonitor:** `monitor` called on init for both components, `stopMonitoring` on destroy (provide a spy via `TestBed`).
  - **No `fakeAsync` / `tick`.** Use `async/await` with `await fixture.whenStable()`. Use `vi.spyOn()` for spies and `vi.fn()` for output callbacks. Explicit Vitest imports: `import { describe, it, expect, vi, beforeEach } from 'vitest'`.
- `index.ts` — public API exports (see below).
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Reference shared types from `ngx-tw/core` (`TwColor`, `TwSize`) — do not redefine.

### Theme file edits

**None required.** The `.check-in` keyframe and `prefers-reduced-motion` override already exist in `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` from the checkbox prompt.

## Public API exports

In `projects/ngx-tw/radio/index.ts`:

```ts
export { RadioComponent, RadioGroupComponent, TW_RADIO_GROUP } from './radio';
export type { RadioVariant, RadioOrientation, TwRadioGroupApi } from './radio';
```

In `projects/ngx-tw/src/public-api.ts`, add:

```ts
export * from 'ngx-tw/radio';
```

## Constraints

- Standalone components. Do **not** set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush` on both components.
- Signal-based APIs only: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`, `contentChildren()`, `contentChild()`. No `mutate`.
- `inject()` for DI. No constructor injection.
- Host bindings via the `host:` object. Never `@HostBinding` / `@HostListener`.
- Native control flow only (`@if`, `@for`, `@switch`). No arrow functions in templates.
- No `ngClass` / `ngStyle`.
- Tailwind utilities only — no component CSS files. Use semantic tokens (`primary-*`, `info-*`, etc.) and surface/fg/border tokens (`bg-surface`, `text-fg`, `border-border`, `border-border-strong`). Never raw palette colors. Never raw `neutral-*` shades for structural styling.
- Both `tv()` configs must include `defaultVariants` and pass `{ twMerge: true }` as the second argument.
- Visual tokens (radius `rounded-full` on the circle/dot, `rounded-md` on the clickable row for focus-ring alignment, focus ring `outline-2 outline-offset-2 outline-primary-500`, transitions `duration-200 motion-reduce:transition-none`, gaps `gap-2` vertical / `gap-3` horizontal, disabled opacity `50`, icon sizes from the Visual Design System) match CLAUDE.md exactly. Do not invent new values.
- Every `input()`, `output()`, `model()`, and public method has a one-line JSDoc.
- Vitest runner: no `fakeAsync` / `tick`; use `vi.spyOn`, `async/await`, `fixture.whenStable()`.
- No `@angular/animations`. Dot uses `animate.enter="check-in"` with the pre-existing keyframe in `theme/_base.css`.
- Keyboard: arrow keys (both axes), Home, End, and Space — no Enter (matches native `<input type="radio">` semantics and ARIA APG).
- CVA lives on the **group only**. The individual radio never imports `NG_VALUE_ACCESSOR`.
