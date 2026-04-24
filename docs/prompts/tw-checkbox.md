# Prompt: Build `tw-checkbox` for ngx-tw

## Context

Before starting, read:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full project conventions (Angular v21 signals, Tailwind v4 semantic + surface/fg/border tokens, `tv()` with `twMerge`, no `@angular/animations`, Vitest rules, no `fakeAsync`, Visual Design System).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/switch/switch.ts` — **primary structural reference**. Mirror its patterns exactly: `model()` + `linkedSignal()`, static color lookup tables for Tailwind v4 scanning, `FocusMonitor` lifecycle, dev-mode accessible-name warning, `role` on host (no hidden native `<input>`), `host:` block for all bindings, per-slot `computed()` class signals.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/switch/switch.spec.ts` — test file shape to mirror (test hosts, helper functions, `beforeEach` FocusMonitor spy, CVA block).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — where new animation keyframes/classes are added.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/docs/prompts/tw-switch.md` — prompt sibling; keep naming/section style consistent.

CDK modules to import:
- `@angular/cdk/a11y` — `FocusMonitor`.
- `@angular/cdk/keycodes` — `SPACE` constant (only Space toggles; Enter does NOT toggle a native checkbox — diverges from `tw-switch`).

## What to build

A standalone, accessible checkbox component (`<tw-checkbox>`) with three visual states: unchecked, checked, and indeterminate. It implements `ControlValueAccessor` so it works with template-driven forms (`[(ngModel)]`), reactive forms (`formControl`/`formControlName`), and signal-based forms. It uses Tailwind v4 utilities exclusively, semantic color tokens for the active box color, and surface/fg/border tokens for neutral structural styling.

The component is a single element from the consumer's perspective but renders multiple internal slots: a box (the clickable square), a check-icon (default SVG check), an indeterminate-icon (default SVG dash), an optional label, and an optional description. The entire row is the click target so that label and description clicks also toggle the checkbox. The component intentionally follows the `tw-switch` shape for library consistency — except where ARIA semantics differ (role, keyboard: Space only, `aria-checked="mixed"` for indeterminate).

### Design decisions baked in (no hidden `<input>`, no `readonly`, no `value`)

- **No hidden native `<input type="checkbox">`.** The host element carries `role="checkbox"`, matching the `tw-switch` pattern. Rationale: the switch proves this works for CVA + form integration; adding a hidden native input splits focus management, requires a separate visually-hidden element, and complicates the click target. If a consumer needs native form submission semantics, they use `[formControl]` / `[(ngModel)]` — the CVA bridges both worlds.
- **No `readonly` input.** Per HTML spec, `readonly` has no effect on checkboxes. Including it would be misleading. `disabled` covers the only meaningful non-interactive state.
- **No `value` input in v1.** A `value` input only makes sense for grouped checkboxes whose form model is an array of values. That is the responsibility of a future `tw-checkbox-group` component and is out of scope here. This checkbox's CVA emits `true`/`false`.

## API design

### Selector

`tw-checkbox` — element selector, standalone component, `ChangeDetectionStrategy.OnPush`.

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `color` | `TwColor` | `'primary'` | `/** Sets the semantic color for the checked and indeterminate box fill/border. Defaults to \`'primary'\`. */` |
| `size` | `TwSize` | `'md'` | `/** Controls the overall scale of the box, check icon, and label typography. Defaults to \`'md'\`. */` |
| `variant` | `CheckboxVariant` | `'solid'` | `/** Visual style when checked or indeterminate. \`'solid'\` fills the box with the color; \`'outline'\` keeps a transparent fill with a colored border and check. Defaults to \`'solid'\`. */` |
| `disabled` | `boolean` | `false` | `/** When true, prevents interaction and applies muted styling. Defaults to \`false\`. */` |
| `required` | `boolean` | `false` | `/** When true, sets \`aria-required="true"\` so assistive tech announces the control as required. Defaults to \`false\`. */` |
| `label` | `string \| undefined` | `undefined` | `/** Optional inline label rendered next to the checkbox. Ignored when label content is projected. */` |
| `description` | `string \| undefined` | `undefined` | `/** Optional secondary description rendered under the label. Ignored when description content is projected. */` |
| `labelPosition` | `CheckboxLabelPosition` | `'after'` | `/** Position of the label/description relative to the checkbox. Defaults to \`'after'\`. */` |
| `name` | `string \| undefined` | `undefined` | `/** Optional name attribute, mirrored to the host for form association. */` |
| `ariaLabel` | `string \| undefined` (alias `'aria-label'`) | `undefined` | `/** Accessible name when no visible label is provided. Mirrored to \`aria-label\`. */` |
| `ariaLabelledby` | `string \| undefined` (alias `'aria-labelledby'`) | `undefined` | `/** ID of an external element that labels the checkbox. Mirrored to \`aria-labelledby\`. */` |
| `ariaDescribedby` | `string \| undefined` (alias `'aria-describedby'`) | `undefined` | `/** ID of an external element that describes the checkbox. Mirrored to \`aria-describedby\`. */` |

**Input count:** 12 inputs + 2 models = 14 members, over the 5–6 guideline. Justified by:
- Parity with `tw-switch` (11 inputs + 1 model).
- Full a11y plumbing for CVA (`ariaLabel`, `ariaLabelledby`, `ariaDescribedby`, `required`, `name`).
- The user explicitly requested maximum flexibility.
- No input adds hidden behavior — each has a single, clear purpose.

### Models (two-way)

| Model | Type | Default | JSDoc |
|---|---|---|---|
| `checked` | `boolean` | `false` | `/** Two-way bound checked state. Updates when the user toggles via click or Space. Emits a corresponding \`checkedChange\`. */` |
| `indeterminate` | `boolean` | `false` | `/** Two-way bound indeterminate state. When true, the box shows a dash instead of a check and the host exposes \`aria-checked="mixed"\`. Any user toggle clears indeterminate and sets \`checked\` to \`true\`. */` |

### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `change` | `boolean` | `/** Fires after the checked state changes from a user interaction. Payload is the new checked value. Does not fire when the value is updated programmatically via \`writeValue\`. */` |

`checkedChange` and `indeterminateChange` are auto-generated by the two `model()` declarations — do NOT redeclare them.

### Content projection

| Slot selector | Purpose | Fallback |
|---|---|---|
| (default — no selector) | Optional label content. Replaces the `label` input when provided. | None — if neither default content nor `label` is set, the label region is not rendered. |
| `[slot="description"]` | Optional description content. Replaces the `description` input when provided. | None. |
| `[slot="check-icon"]` | Overrides the default check glyph shown when `checked && !indeterminate`. | Default inline SVG checkmark (see Styling). |
| `[slot="indeterminate-icon"]` | Overrides the default indeterminate glyph shown when `indeterminate`. | Default inline SVG horizontal dash (see Styling). |

Use `contentChild()` queries with selectors to detect presence of `slot="check-icon"` and `slot="indeterminate-icon"` so fallback SVGs render via `@if` only when nothing is projected. Detection for default-slot label follows the same pattern the switch uses (treat empty projection as "no label" and fall back to the `label` input).

### Supporting types

```ts
export type CheckboxVariant = 'solid' | 'outline';
export type CheckboxLabelPosition = 'before' | 'after';
```

## Usage examples

```html
<!-- Simplest case -->
<tw-checkbox label="I agree to the terms" />
```

```html
<!-- Two-way binding -->
<tw-checkbox label="Subscribe to updates" [(checked)]="subscribed" />
```

```html
<!-- Reactive forms -->
<tw-checkbox label="Remember me" formControlName="rememberMe" />
```

```html
<!-- Indeterminate "select all" driven by a computed signal -->
<tw-checkbox
  label="Select all rows"
  [(checked)]="allSelected"
  [(indeterminate)]="someSelected"
/>
```

```html
<!-- Variants, colors, sizes -->
<tw-checkbox variant="outline" color="success" size="lg" label="Confirm" />
```

```html
<!-- Label before the box with projected rich label + description -->
<tw-checkbox labelPosition="before">
  <span>Beta features</span>
  <span slot="description">Opt in to experimental functionality</span>
</tw-checkbox>
```

```html
<!-- Custom check glyph -->
<tw-checkbox [(checked)]="done" label="Task complete">
  <tw-icon slot="check-icon" name="sparkles" />
</tw-checkbox>
```

```html
<!-- Disabled + required -->
<tw-checkbox label="Accept policy" [disabled]="true" [required]="true" [(checked)]="value" />
```

## Styling

Use a single `tv()` config with **slots**. Enable `twMerge: true`. Active color styling is wired via two static `Record<TwColor, string>` lookup tables so Tailwind v4 can scan all class combinations — mirror `switch.ts`'s `CHECKED_TRACK` and `CHECKED_ICON_COLOR`.

### `tv()` slots

```
slots:
  root        — outer row wrapper (clickable); flex layout, swapped via labelPosition
  boxWrap     — positioning wrapper for the box (relative, shrink-0)
  box         — the square itself (background/border and check-icon container)
  icon        — check-icon / indeterminate-icon positioning layer inside the box
  labelWrap   — vertical stack of label + description
  label       — label text
  description — description text
```

### `tv()` base classes (per slot)

- `root`: `inline-flex items-start gap-3 cursor-pointer select-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`
- `boxWrap`: `relative inline-flex items-center justify-center shrink-0 mt-0.5` — `mt-0.5` aligns the box with the first line of a multi-line label (per Visual Design System icon rule).
- `box`: `inline-flex items-center justify-center rounded-md border transition-colors duration-200 motion-reduce:transition-none`
- `icon`: `absolute inset-0 flex items-center justify-center pointer-events-none empty:hidden`
- `labelWrap`: `flex flex-col min-w-0 empty:hidden`
- `label`: `font-medium text-fg empty:hidden`
- `description`: `text-fg-muted empty:hidden`

### `tv()` variants

```
size:
  xs → box: 'size-3.5',  icon: '[&_svg]:size-3',    label: 'text-xs',  description: 'text-[11px]'
  sm → box: 'size-4',    icon: '[&_svg]:size-3',    label: 'text-sm',  description: 'text-xs'
  md → box: 'size-5',    icon: '[&_svg]:size-3.5',  label: 'text-sm',  description: 'text-xs'
  lg → box: 'size-6',    icon: '[&_svg]:size-4',    label: 'text-base', description: 'text-sm'
  xl → box: 'size-7',    icon: '[&_svg]:size-5',    label: 'text-base', description: 'text-sm'

labelPosition:
  before → root: 'flex-row-reverse'
  after  → root: 'flex-row'

state:  // combined checked|indeterminate|unchecked axis
  unchecked    → box: 'bg-surface border-border hover:border-border-strong'
  active       → box: '' (color applied via static lookup by (variant, color) — see below)

variant:  // only meaningful in combination with state='active' (applied via compoundVariants or runtime composition)
  solid   → box: ''
  outline → box: ''

disabled:
  true  → root: 'opacity-50 pointer-events-none cursor-not-allowed'
  false → root: ''
```

`defaultVariants`: `{ size: 'md', variant: 'solid', labelPosition: 'after', state: 'unchecked', disabled: false }`.

### Static active-state color lookups

Mirror `switch.ts` — fully-static class strings so Tailwind v4's content scanner picks them up. Apply via the `box` computed only when `checked() || indeterminate()`.

```ts
// Solid: filled box, white/black check (except neutral).
const SOLID_BOX: Record<TwColor, string> = {
  primary:   'bg-primary-600 border-primary-600',
  secondary: 'bg-secondary-600 border-secondary-600',
  accent:    'bg-accent-600 border-accent-600',
  neutral:   'bg-fg border-fg',
  info:      'bg-info-600 border-info-600',
  success:   'bg-success-600 border-success-600',
  warning:   'bg-warning-500 border-warning-500',
  error:     'bg-error-600 border-error-600',
};

const SOLID_ICON: Record<TwColor, string> = {
  primary:   'text-white',
  secondary: 'text-white',
  accent:    'text-white',
  neutral:   'text-surface',
  info:      'text-white',
  success:   'text-white',
  warning:   'text-black',
  error:     'text-white',
};

// Outline: transparent fill, colored border + colored icon.
const OUTLINE_BOX: Record<TwColor, string> = {
  primary:   'bg-surface border-primary-600',
  secondary: 'bg-surface border-secondary-600',
  accent:    'bg-surface border-accent-600',
  neutral:   'bg-surface border-fg',
  info:      'bg-surface border-info-600',
  success:   'bg-surface border-success-600',
  warning:   'bg-surface border-warning-500',
  error:     'bg-surface border-error-600',
};

const OUTLINE_ICON: Record<TwColor, string> = {
  primary:   'text-primary-600',
  secondary: 'text-secondary-600',
  accent:    'text-accent-600',
  neutral:   'text-fg',
  info:      'text-info-600',
  success:   'text-success-600',
  warning:   'text-warning-600',
  error:     'text-error-600',
};
```

### Wiring

- `boxClasses` computed = `variantResult().box()` + (active ? `(variant==='solid' ? SOLID_BOX[color] : OUTLINE_BOX[color])` : '').
- `iconColorClasses` computed = `variant==='solid' ? SOLID_ICON[color] : OUTLINE_ICON[color]`.
- Host `[attr.data-checked]` and `[attr.data-indeterminate]` so consumers and the test DOM can assert state without sniffing class strings.
- All visual tokens (radius `rounded-md`, transition `duration-200 motion-reduce:transition-none`, focus ring `outline-2 outline-offset-2 outline-primary-500`, icon sizing via Visual Design System, disabled opacity `50`, gap `gap-3`) are defined in CLAUDE.md's Visual Design System — do not introduce new values.

### Default check and indeterminate glyphs

Inline SVGs rendered inside the `icon` slot when nothing is projected. Keep stroke-based so they inherit `currentColor` from the computed icon-color class:

- **Check** — a two-segment polyline with `stroke-linecap="round"`, `stroke-linejoin="round"`, `stroke-width="3"` (in a 24-box viewBox). Path: `M5 12 l5 5 l9 -11`.
- **Indeterminate** — a single horizontal line with the same stroke. Path: `M5 12 h14`.

Both should be wrapped so that when it appears (via `@if`), the `.check-in` class (see Animation) plays. Use `animate.enter="check-in"` on the SVG element.

## Accessibility

- **Role and state:**
  - Host: `role="checkbox"`.
  - `[attr.aria-checked]`:
    - When `indeterminate()` → `'mixed'`.
    - Else when `internalChecked()` → `'true'`.
    - Else → `'false'`.
  - `[attr.aria-disabled]` set when disabled (return `null` when not).
  - `[attr.aria-required]` set when `required()` (return `null` when not).
  - `[attr.aria-label]`, `[attr.aria-labelledby]`, `[attr.aria-describedby]` mirror the corresponding inputs. When none is set and there is a visible label, point `aria-labelledby` at the internal label id (same as `tw-switch`).
  - When neither projected default-slot label, `label` input, `ariaLabel`, nor `ariaLabelledby` is provided, surface a dev-mode warning (`afterNextRender` + `isDevMode()` + `console.warn`) — mirror the switch's `hasAccessibleNameHint()` pattern.

- **Keyboard:**
  - `Space` → toggle, `event.preventDefault()` to suppress page scroll.
  - **Not `Enter`.** Native checkboxes do NOT respond to Enter (Enter submits the surrounding form). Do not handle it.
  - Use `SPACE` from `@angular/cdk/keycodes`; also tolerate `event.key === ' '` / `'Spacebar'` for cross-browser compat, matching `switch.ts`.
  - Disabled host: skip handling and emit nothing.

- **Focus:**
  - Host is focusable: `[attr.tabindex]="isDisabled() ? -1 : 0"`.
  - `FocusMonitor.monitor(elementRef)` in `ngOnInit`; stop monitoring via `DestroyRef.onDestroy`.
  - Focus ring: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on the root.

- **Click target:** the entire `root` is the click target — clicking the label or description toggles.

- **Reduced motion:** all transitions carry `motion-reduce:transition-none`. Animation classes added to the theme (`check-in`, `check-pop`) must have `animation-duration: 0ms` under `prefers-reduced-motion` — see Animation requirements.

- **Color contrast:** the unchecked `bg-surface border-border` box preserves a 1px boundary. For `outline` variant, the colored border must satisfy 3:1 contrast against `bg-surface` — `{color}-600` generally does. If AXE flags `warning` specifically (yellow on white), bump to `border-warning-600` in `OUTLINE_BOX` (already in the spec above).

## Form integration

Implement `ControlValueAccessor` and provide it via `NG_VALUE_ACCESSOR` with `forwardRef(() => CheckboxComponent)` and `multi: true`. Mirror the switch exactly.

- **`writeValue(value: boolean | null | undefined)`**: coerce to boolean (`!!value`); set both the `checked` model and the `internalChecked` linked signal. Clear `indeterminate` (set to `false`) — programmatic value writes are an authoritative boolean. Do NOT emit `change` from `writeValue`.
- **`registerOnChange(fn)`**: store `fn`; call inside `toggle()` after updating state.
- **`registerOnTouched(fn)`**: store `fn`; call inside `toggle()` and on host `blur`.
- **`setDisabledState(isDisabled)`**: write to a private `cvaDisabled` signal; `isDisabled = computed(() => disabled() || cvaDisabled())` drives ARIA, styling, and interaction guards.

Must work with template-driven (`[(ngModel)]`), reactive (`formControl`/`formControlName`), and signal-based forms. Do not import any forms-strategy-specific symbol other than `ControlValueAccessor` and `NG_VALUE_ACCESSOR`.

This prompt does **not** implement `FormFieldControl` / `TW_FORM_FIELD_CONTROL` — the checkbox is standalone. A later prompt can add form-field adapter support.

## Animation requirements

Animate the check/indeterminate glyph when it appears. Use `animate.enter` (NOT `@angular/animations`).

**In the component:** on the `<svg>` element inside the `icon` slot, add `animate.enter="check-in"`. Applies to both default and projected icons (the enter animation runs on the wrapper span containing the `@if`-gated icon).

**Theme additions (manual edit during implementation).** Append to `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css`, inside the existing animation keyframes block, and to the `prefers-reduced-motion` media query:

```css
/* Check / indeterminate glyph enter — combined scale + opacity pop for a tactile feel. */
@keyframes check-in {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}
.check-in {
  animation: check-in 150ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
  transform-origin: center;
}
```

Then, inside the existing `@media (prefers-reduced-motion: reduce)` block at the bottom of `_base.css`, add:

```css
.check-in { animation-duration: 0ms; }
```

Do not invent a second "leave" animation — the icon disappears instantly when the state flips, which matches native checkbox behavior and avoids lingering DOM.

## Implementation notes

- Use `model<boolean>('checked', { initialValue: false })` and `model<boolean>('indeterminate', { initialValue: false })`. Mirror each with a linked signal:
  - `internalChecked = linkedSignal(() => this.checked())`
  - `internalIndeterminate = linkedSignal(() => this.indeterminate())`
- `toggle()`:
  1. If `isDisabled()` → return.
  2. Let `wasIndeterminate = internalIndeterminate()`.
  3. If `wasIndeterminate` → set next checked to `true` (per ARIA APG pattern: indeterminate → checked on activation). Else → `next = !internalChecked()`.
  4. `internalChecked.set(next); checked.set(next);`
  5. If `wasIndeterminate` → `internalIndeterminate.set(false); indeterminate.set(false);`
  6. `onChange(next); onTouched(); change.emit(next);`
- Host bindings via the `host:` object only — never `@HostBinding`/`@HostListener`.
- `[attr.data-checked]="internalChecked()"` and `[attr.data-indeterminate]="internalIndeterminate()"` on the host (useful for tests and for consumer CSS overrides).
- Generate a unique id (`tw-checkbox-${nextId++}`) for the host and derive `labelId` / `descriptionId` from it — identical pattern to the switch.
- Class composition: one `computed()` per slot (`rootClasses`, `boxWrapClasses`, `boxClasses`, `iconClasses`, `labelWrapClasses`, `labelClasses`, `descriptionClasses`). The `boxClasses` computed appends the correct static lookup entry only when active.
- `iconColorClasses` is a separate `computed()` applied to the `<span>` wrapping the SVG (so both default and projected icons inherit it via `currentColor`).
- `@if (internalIndeterminate())` → render indeterminate icon (projected or default). `@else if (internalChecked())` → render check icon (projected or default). Otherwise → render nothing inside the box.
- `contentChild()` queries for `[slot="check-icon"]` and `[slot="indeterminate-icon"]` to detect overrides; fall back to inline SVG via `@if`.
- `onBlur()` calls `onTouched()`.
- No `@angular/animations`. The check-in uses `animate.enter="check-in"` with theme-defined keyframes.
- Accessible name warning: `afterNextRender(() => { if (isDevMode() && !this.hasAccessibleNameHint()) console.warn(...) })` — copy the switch's `hasAccessibleNameHint()` method verbatim with a `[tw-checkbox]` prefix.

## File structure

Create the following under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/checkbox/`:

- `checkbox.ts` — `CheckboxComponent`, `CheckboxVariant` type, `CheckboxLabelPosition` type, `tv()` config, static color lookup tables. Single-file component; no separate sub-components.
- `checkbox.spec.ts` — Vitest tests covering:
  - **Rendering:** mounts without inputs; host has `role="checkbox"` and `aria-checked="false"`; every `color`, `size`, and `variant` renders without errors; `label` input text renders; `description` input text renders.
  - **Inputs:** `aria-required` present when `required` is true, absent otherwise; `tabindex="0"` by default, `"-1"` when disabled; `aria-disabled="true"` when disabled; `labelPosition="before"` reverses flex direction (assert class or DOM order).
  - **Two-way bindings:** `[(checked)]` parent signal reflects toggles and programmatic updates; `[(indeterminate)]` parent signal reflects programmatic updates; user click on an indeterminate checkbox sets `checked=true` and `indeterminate=false` in the parent.
  - **ARIA state:** `aria-checked="mixed"` when `indeterminate=true`; flips to `"true"` after user toggle clears indeterminate; flips to `"false"` on subsequent toggle.
  - **Interactions:** click toggles state and emits `change`; Space toggles and calls `preventDefault`; Enter does NOT toggle (assert no state change); other keys do nothing; disabled blocks click and Space with no `change` emission.
  - **Content projection:** projected default-slot label, `[slot="description"]`, `[slot="check-icon"]`, `[slot="indeterminate-icon"]` all render; projecting a check icon replaces the default SVG; projecting nothing falls back to default SVGs.
  - **Accessibility:** `aria-label` input reflected; `aria-labelledby` points at internal label id when a visible label is present and no external labelling is supplied; unique id per instance.
  - **FocusMonitor:** `monitor` called on init, `stopMonitoring` called on destroy (provide a spy via `TestBed`).
  - **ControlValueAccessor (reactive forms host):** initializes from `FormControl.value`; user toggle updates `FormControl.value`; `FormControl.setValue(true)` updates the DOM `aria-checked`; `FormControl.disable()` blocks interaction.
  - **ControlValueAccessor (template-driven host):** `[(ngModel)]` round-trip via `await fixture.whenStable()`.
  - **Writable value resets indeterminate:** after `FormControl.setValue(false)` with `indeterminate=true`, the internal indeterminate clears and `aria-checked="false"`.
  - **No `fakeAsync` / `tick`.** Use `async/await` with `await fixture.whenStable()`. Use `vi.spyOn()` for event spies; `vi.fn()` for output spies. Explicit Vitest imports: `import { describe, it, expect, vi, beforeEach } from 'vitest'`.
- `index.ts` — public API exports.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Reference shared types from `ngx-tw/core` (`TwColor`, `TwSize`) — do not redefine.

### Theme file edit (manual, part of implementation)

Append to `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css`:
- `@keyframes check-in` block and `.check-in` class (see Animation requirements for exact CSS).
- Add `.check-in { animation-duration: 0ms; }` line inside the existing `@media (prefers-reduced-motion: reduce)` block.

## Public API exports

In `projects/ngx-tw/checkbox/index.ts`:

```ts
export { CheckboxComponent } from './checkbox';
export type { CheckboxVariant, CheckboxLabelPosition } from './checkbox';
```

In `projects/ngx-tw/src/public-api.ts`, add:

```ts
export * from 'ngx-tw/checkbox';
```

## Constraints

- Standalone component. Do **not** set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush`.
- Signal-based APIs only: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`. No `mutate`.
- `inject()` for DI. No constructor injection.
- Host bindings via the `host:` object. Never `@HostBinding` / `@HostListener`.
- Native control flow only (`@if`, `@for`). No arrow functions in templates.
- No `ngClass` / `ngStyle`.
- Tailwind utilities only — no component CSS files. Use semantic tokens (`primary-*`, `info-*`, etc.) and surface/fg/border tokens (`bg-surface`, `text-fg`, `border-border`, `border-border-strong`). Never raw palette colors. Never raw `neutral-*` shades for structural styling.
- `tv()` config must include `defaultVariants` and pass `{ twMerge: true }` as the second argument.
- Visual tokens (radius `rounded-md`, icon sizes `size-3` through `size-5`, focus ring `outline-2 outline-offset-2 outline-primary-500`, transitions `duration-200 motion-reduce:transition-none`, gap `gap-3`, disabled opacity `50`) match CLAUDE.md's Visual Design System exactly. Do not invent new values.
- Every `input()`, `output()`, `model()`, and public method has a one-line JSDoc.
- Vitest runner: no `fakeAsync` / `tick`; use `vi.spyOn`, `async/await`, `fixture.whenStable()`.
- No `@angular/animations`. Check animation uses `animate.enter="check-in"` with keyframes defined in `theme/_base.css`.
- Keyboard: Space only (no Enter) — matches native `<input type="checkbox">` semantics and diverges intentionally from `tw-switch`.
