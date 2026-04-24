# Prompt: Build `tw-switch` for ngx-tw

## Context

Before starting, read:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full project conventions (Angular v21 signals, Tailwind v4 semantic + surface/fg/border tokens, `tv()` with `twMerge`, no `@angular/animations`, Vitest rules, no `fakeAsync`).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/segmented-control/segmented-control.ts` — reference implementation for `ControlValueAccessor`, `linkedSignal()` mirror of a `model()` input, static color lookup tables for Tailwind v4 scanning, `FocusMonitor` lifecycle, keyboard handling.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/button/button.ts` — host bindings, computed classes, focus-visible pattern.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/form-field/form-field.ts` — slotted `tv()` config example (only the `tv()` shape — `tw-switch` does not implement the `FormFieldControl` contract in this prompt).

CDK modules to import:
- `@angular/cdk/a11y` — `FocusMonitor`.
- `@angular/cdk/keycodes` — `SPACE`, `ENTER` constants.

## What to build

A standalone, accessible toggle switch component (`<tw-switch>`) that toggles between on and off states. It implements `ControlValueAccessor` so it works seamlessly with template-driven forms (`[(ngModel)]`), reactive forms (`formControl` / `formControlName`), and signal-based forms. It uses Tailwind v4 utilities exclusively, semantic color tokens for the active track color, and surface/fg/border tokens for neutral structural styling.

The component is a single element from the consumer's perspective but renders multiple internal slots: a track, an animated thumb, optional on/off icon or text indicators inside the track, and optional label + description placed before or after the switch. The entire row is the click target so that label and description clicks also toggle the switch.

## API design

### Selector

`tw-switch` — element selector, standalone component, `ChangeDetectionStrategy.OnPush`.

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `color` | `TwColor` | `'primary'` | `/** Sets the semantic color for the active (checked) track. Defaults to `'primary'`. */` |
| `size` | `TwSize` | `'md'` | `/** Controls the overall scale of the track, thumb, and label typography. Defaults to `'md'`. */` |
| `disabled` | `boolean` | `false` | `/** When true, prevents interaction and applies muted styling. Defaults to `false`. */` |
| `required` | `boolean` | `false` | `/** When true, sets `aria-required="true"` so assistive tech announces the control as required. Defaults to `false`. */` |
| `label` | `string \| undefined` | `undefined` | `/** Optional inline label rendered next to the switch. Ignored when label content is projected. */` |
| `description` | `string \| undefined` | `undefined` | `/** Optional secondary description rendered under the label. Ignored when description content is projected. */` |
| `labelPosition` | `'before' \| 'after'` | `'after'` | `/** Position of the label/description relative to the switch. Defaults to `'after'`. */` |
| `name` | `string \| undefined` | `undefined` | `/** Optional name attribute, mirrored to the host for form association. */` |
| `ariaLabel` | `string \| undefined` | `undefined` | `/** Accessible name when no visible label is provided. Mirrored to `aria-label`. */` |
| `ariaLabelledby` | `string \| undefined` | `undefined` | `/** ID of an external element that labels the switch. Mirrored to `aria-labelledby`. */` |

### Models (two-way)

| Model | Type | Default | JSDoc |
|---|---|---|---|
| `checked` | `boolean` | `false` | `/** Two-way bound checked state. Updates when the user toggles via click, Space, or Enter. */` |

### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `change` | `boolean` | `/** Fires after the checked state changes from a user interaction. Payload is the new checked value. Does not fire when the value is updated programmatically via `writeValue`. */` |

### Content projection

| Slot selector | Purpose | Fallback |
|---|---|---|
| (default — no selector) | Optional label content. Replaces the `label` input when provided. | None — when neither default content nor `label` is set, the label region is not rendered. |
| `[slot="description"]` | Optional description content. Replaces the `description` input when provided. | None. |
| `[slot="on-icon"]` | Optional indicator rendered inside the track on the "on" side (revealed when checked). | None. |
| `[slot="off-icon"]` | Optional indicator rendered inside the track on the "off" side (revealed when unchecked). | None. |

Use `contentChild` queries to detect presence of slot content for `@if`-gated rendering. The default slot only renders the projected wrapper if either the input or content child is present.

## Usage examples

```html
<!-- Simplest case: standalone switch with a label -->
<tw-switch label="Enable notifications" />
```

```html
<!-- Two-way binding with a signal -->
<tw-switch label="Dark mode" [(checked)]="darkMode" />
```

```html
<!-- Reactive forms -->
<tw-switch label="Marketing emails" formControlName="marketing" />
```

```html
<!-- Color and size variants -->
<tw-switch color="success" size="lg" label="Auto-sync" description="Sync changes every minute" />
```

```html
<!-- Label before the switch, with projected rich label content -->
<tw-switch labelPosition="before">
  <span>Beta features</span>
  <span slot="description">Opt in to experimental functionality</span>
</tw-switch>
```

```html
<!-- On/off icons inside the track -->
<tw-switch label="Sound" color="info">
  <tw-icon slot="on-icon" name="volume-2" />
  <tw-icon slot="off-icon" name="volume-x" />
</tw-switch>
```

```html
<!-- Disabled and required -->
<tw-switch label="Locked setting" [disabled]="true" [required]="true" [(checked)]="value" />
```

## Styling

Use a single `tv()` config with **slots**. Enable `twMerge: true`. Color variants are wired via a separate static lookup table (so Tailwind v4 can scan all class combinations) — follow the `SURFACE_ACTIVE` / `FILLED_ACTIVE` pattern from `segmented-control.ts`.

### `tv()` slots

```
slots:
  root       — outer wrapper (clickable row); flex layout that swaps order via labelPosition
  switchEl   — the switch itself (track wrapper); positioned relative
  track      — the colored background pill
  thumb      — the moving circle; transform-translates on checked
  iconWrap   — absolute layer inside the track holding on/off icons
  labelWrap  — vertical stack of label + description
  label      — label text
  description — description text
```

### `tv()` base classes (per slot)

- `root`: `inline-flex items-center gap-3 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded-md`
- `switchEl`: `relative inline-flex items-center shrink-0`
- `track`: `relative inline-flex items-center rounded-full transition-colors duration-200 motion-reduce:transition-none border border-transparent`
- `thumb`: `absolute left-0.5 inline-flex items-center justify-center bg-surface rounded-full shadow-sm transition-transform duration-200 motion-reduce:transition-none`
- `iconWrap`: `absolute inset-0 flex items-center justify-between px-1 pointer-events-none text-fg-muted`
- `labelWrap`: `flex flex-col min-w-0`
- `label`: `text-sm font-medium text-fg`
- `description`: `text-xs text-fg-muted`

### `tv()` variants

```
size:
  xs → track: 'h-4 w-7',  thumb: 'size-3 data-[checked=true]:translate-x-3',  label: 'text-xs',  description: 'text-[11px]'
  sm → track: 'h-5 w-9',  thumb: 'size-4 data-[checked=true]:translate-x-4',  label: 'text-sm',  description: 'text-xs'
  md → track: 'h-6 w-11', thumb: 'size-5 data-[checked=true]:translate-x-5',  label: 'text-sm',  description: 'text-xs'
  lg → track: 'h-7 w-12', thumb: 'size-6 data-[checked=true]:translate-x-5',  label: 'text-base', description: 'text-sm'
  xl → track: 'h-8 w-14', thumb: 'size-7 data-[checked=true]:translate-x-6',  label: 'text-base', description: 'text-sm'

labelPosition:
  before → root: 'flex-row-reverse'
  after  → root: 'flex-row'

checked:
  true  → track: '' (color applied via static lookup; see below)
  false → track: 'bg-surface-muted'

disabled:
  true  → root: 'opacity-50 pointer-events-none cursor-not-allowed'
  false → ''
```

`defaultVariants`: `{ size: 'md', labelPosition: 'after', checked: false, disabled: false }`.

### Static checked-track color lookup

Mirror the `segmented-control.ts` pattern — a `Record<TwColor, string>` of fully-static class strings so Tailwind v4 scans them all. Apply the result to the `track` slot only when `checked` is true:

```
const CHECKED_TRACK: Record<TwColor, string> = {
  primary:   'bg-primary-600',
  secondary: 'bg-secondary-600',
  accent:    'bg-accent-600',
  neutral:   'bg-fg',
  info:      'bg-info-600',
  success:   'bg-success-600',
  warning:   'bg-warning-500',
  error:     'bg-error-600',
};
```

For unchecked: `bg-surface-muted` (already in the variant). For the on/off icon layer, use `text-fg-muted` so icons match the muted track in the off state, and `text-white` (or `text-black` for warning) when checked — apply via a second static lookup keyed on `color`.

### Wiring

- `track` slot consumed by an inner `<span>` in the template; class binding combines `variantResult.track()` + (checked ? `CHECKED_TRACK[color]` : '').
- `thumb` slot uses `data-checked` attribute binding; the `data-[checked=true]:translate-x-N` arbitrary variants handle the transform statically.
- All visual tokens (radius, shadow, focus ring, transitions, gap, font sizes, opacity) come from the Visual Design System in CLAUDE.md — do not introduce new values.

## Accessibility

- **Role and state:**
  - Host element: `role="switch"`.
  - `[attr.aria-checked]` mirrors `internalChecked()` (`'true'` / `'false'`).
  - `[attr.aria-disabled]` set when disabled (return `null` when not).
  - `[attr.aria-required]` set when `required()` is true (return `null` when not).
  - `[attr.aria-label]` and `[attr.aria-labelledby]` reflect the matching inputs when set.
  - When neither projected default-slot label, `label` input, `ariaLabel`, nor `ariaLabelledby` is provided, surface a dev-mode warning (`isDevMode()` + `console.warn`) explaining the control needs an accessible name.

- **Keyboard:**
  - `Space` → toggle, `event.preventDefault()` to suppress page scroll.
  - `Enter` → toggle.
  - Use `SPACE` and `ENTER` constants from `@angular/cdk/keycodes`.
  - Disabled host: skip handling and do not emit `change`.

- **Focus:**
  - Render the host as `<button type="button">`-equivalent semantics. Set `[attr.tabindex]` to `0` when enabled, `-1` when disabled.
  - Use `FocusMonitor.monitor(elementRef)` in `ngOnInit`; stop monitoring via `DestroyRef.onDestroy`.
  - Focus indicator: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on the root.

- **Click target:** the entire `root` is the click target — clicking the label or description toggles the switch.

- **Reduced motion:** thumb and track transitions use `motion-reduce:transition-none`.

- **Color contrast:** the unchecked `bg-surface-muted` track has a 1px transparent border to preserve a visible boundary against `bg-surface` pages; if you find AXE flagging contrast, swap to `border-border` for the unchecked state in a `compoundVariant`.

## Form integration

Implement `ControlValueAccessor` and provide it via `NG_VALUE_ACCESSOR` with `forwardRef(() => SwitchComponent)` and `multi: true`.

- **`writeValue(value: boolean | null)`**: coerce `value` to a boolean (`!!value`); update both the `checked` model and the `internalChecked` linked signal. Do **not** emit `change` from `writeValue`.
- **`registerOnChange(fn)`**: store `fn` in a private field; call it inside `toggle()` after updating state.
- **`registerOnTouched(fn)`**: store `fn`; call it inside `toggle()` and on host `blur` (use a host listener `(blur)='onTouched()'`).
- **`setDisabledState(isDisabled)`**: write to a private `cvaDisabled` signal; the `isDisabled = computed(() => disabled() || cvaDisabled())` value is what drives ARIA, styling, and interaction guards.

Must work with template-driven (`[(ngModel)]`), reactive (`formControl`, `formControlName`), and signal-based forms. Do not import any forms-strategy-specific symbol other than `ControlValueAccessor` and `NG_VALUE_ACCESSOR`.

## Implementation notes

- Use `model<boolean>('checked', { initialValue: false })` for two-way binding. Mirror it with `internalChecked = linkedSignal(() => this.checked())` so CVA writes and user clicks both update one signal that drives the view.
- `toggle()` method (called from click and from keydown):
  1. If `isDisabled()` → return.
  2. Compute `next = !internalChecked()`.
  3. `internalChecked.set(next); checked.set(next);`
  4. `onChange(next); onTouched(); change.emit(next);`
- Host bindings via the `host: { ... }` object only — never `@HostBinding`/`@HostListener`.
- Apply `[attr.data-checked]="internalChecked()"` to the host so the thumb's `data-[checked=true]:translate-x-*` variants light up.
- Generate a unique id (`tw-switch-${nextId++}`) for the host so external `<label for>` references work.
- Class composition: one `computed()` per slot (`rootClasses`, `trackClasses`, `thumbClasses`, etc.). The `trackClasses` computed appends the static `CHECKED_TRACK[color()]` string only when `internalChecked()` is true.
- `contentChild()` queries to detect projected content for default, `description`, `on-icon`, and `off-icon` slots — gate rendering with `@if`. Project the input-based `label` / `description` only when no corresponding child is detected.
- This prompt does **not** implement `FormFieldControl` / `TW_FORM_FIELD_CONTROL` integration — `tw-switch` is standalone. A separate prompt can add form-field adapter support later if needed.
- No `@angular/animations`. The thumb transition is a Tailwind `transition-transform duration-200` that animates the `translate-x-*` class flip.

## File structure

Create the following under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/switch/`:

- `switch.ts` — `SwitchComponent` (single component; no separate sub-components needed).
- `switch.spec.ts` — Vitest tests covering:
  - Default render: mounts without inputs, renders unchecked, host has `role="switch"` and `aria-checked="false"`.
  - All variants of `color` and `size` render without errors.
  - `[(checked)]` two-way binding: parent signal reflects toggles; programmatic parent updates flow into the DOM.
  - `change` output: emits with `true`/`false` payload on user interaction; does not emit from `writeValue`.
  - Click on host toggles state and emits `change`.
  - Click on projected label and description toggles state.
  - `Space` and `Enter` toggle state; `Space` calls `preventDefault`.
  - `disabled`: blocks click, blocks keyboard, no `change` emitted, `aria-disabled="true"`, `tabindex="-1"`.
  - `required`: sets `aria-required="true"`.
  - `aria-label` / `aria-labelledby` inputs reflected to host attributes.
  - `labelPosition` controls flex direction (assert via DOM order, not class names).
  - Content projection: `description`, `on-icon`, `off-icon` slots render when provided; default label slot replaces the `label` input.
  - Fallback: `label` input renders when no default content is projected.
  - `ControlValueAccessor`: `writeValue(true)` updates DOM; `setDisabledState(true)` blocks interaction; user toggle calls the registered `onChange` and `onTouched`.
  - Works with `FormControl` (reactive) and `[(ngModel)]` (template-driven) test hosts.
  - **No `fakeAsync` / `tick`.** Use `async/await` with `await fixture.whenStable()` after interactions.
- `index.ts` — re-exports the public API.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Reference shared types from `ngx-tw/core` (`TwColor`, `TwSize`) — do not redefine.

## Public API exports

In `projects/ngx-tw/switch/index.ts`:

```ts
export { SwitchComponent } from './switch';
```

(No exported variant types — the only customisation axes use shared `TwColor` / `TwSize`. If `labelPosition` warrants a named type, export it as `SwitchLabelPosition`.)

In `projects/ngx-tw/src/public-api.ts`, add:

```ts
export * from 'ngx-tw/switch';
```

## Constraints

- Standalone component. Do **not** set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush`.
- Signal-based APIs only: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`. No `mutate`.
- `inject()` for DI. No constructor injection.
- Host bindings via the `host:` object. Never `@HostBinding` / `@HostListener`.
- Native control flow only (`@if`, `@for`).
- No `ngClass` / `ngStyle`. No arrow functions in templates.
- Tailwind utilities only — no component CSS files. Use semantic tokens (`primary-*`, `info-*`, etc.) and surface/fg/border tokens (`bg-surface-muted`, `text-fg`, `border-border`). Never raw palette colors. Never raw `neutral-*` shades for structural styling.
- `tv()` config must include `defaultVariants` and pass `{ twMerge: true }` as the second argument.
- Visual tokens (radius `rounded-full`, shadow `shadow-sm`, focus ring `outline-2 outline-offset-2 outline-primary-500`, transitions `duration-200 motion-reduce:transition-none`) match the Visual Design System in CLAUDE.md exactly.
- Every `input()`, `output()`, `model()` and public method has a one-line JSDoc.
- Vitest runner: no `fakeAsync` / `tick`; use `vi.spyOn`, `async/await`, `fixture.whenStable()`.
- No `@angular/animations`.
