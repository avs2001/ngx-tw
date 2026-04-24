# Prompt: Build `tw-segmented-control` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, signal APIs, testing rules
- `projects/ngx-tw/tabs/tabs.ts` — the primary reference. Study its multi-part `tv()` with slots, `contentChildren()`, `linkedSignal()` for active value, keyboard navigation, orientation support, and `model()` for two-way binding
- `projects/ngx-tw/button/button.ts` — reference for `FocusMonitor` integration, `computed()` host class binding, and `tv()` with `compoundVariants`
- `projects/ngx-tw/core/types.ts` — shared `TwColor` and `TwSize` types
- `@angular/cdk/a11y` — `FocusMonitor` for focus origin tracking

## What to build

A segmented control — a group of mutually exclusive toggle buttons where exactly one option is always selected. It is the visual equivalent of a radio group. The component consists of two artifacts: `SegmentedControlComponent` (the container, selector `tw-segmented-control`) and `SegmentedControlOptionComponent` (each option, selector `tw-segmented-option`). The container is a `ControlValueAccessor` form control.

Options are defined via content projection — each `tw-segmented-option` has a `value` input and projects its label content via `ng-content` (supporting text, icons, or any custom template). This follows the library's "content projection over inputs" principle.

## API design

### `SegmentedControlComponent` (`tw-segmented-control`)

#### Inputs
- `/** Sets the semantic color for the active option indicator. Defaults to `'primary'`. */` — `color: input<TwColor>('primary')`
- `/** Controls padding, font size, and gap of options. Defaults to `'md'`. */` — `size: input<TwSize>('md')`
- `/** Layout direction of the control. Defaults to `'horizontal'`. */` — `orientation: input<'horizontal' | 'vertical'>('horizontal')`
- `/** When true, prevents all interaction and applies muted styling. Defaults to `false`. */` — `disabled: input(false)`

#### Model
- `/** The value of the currently selected option. Two-way bound. Updates on user selection. */` — `value: model<string | null>(null)`

### `SegmentedControlOptionComponent` (`tw-segmented-option`)

#### Inputs
- `/** Unique value identifying this option. Required. */` — `value: input.required<string>()`
- `/** When true, this option cannot be selected and is skipped by keyboard navigation. Defaults to `false`. */` — `disabled: input(false)`

#### Content projection
Label content is projected via a single default `ng-content` slot. No fallback — the consumer must provide a label (text, icon, or both).

## Usage examples

```html
<!-- Simplest case: text-only options -->
<tw-segmented-control [(value)]="view">
  <tw-segmented-option value="list">List</tw-segmented-option>
  <tw-segmented-option value="grid">Grid</tw-segmented-option>
  <tw-segmented-option value="table">Table</tw-segmented-option>
</tw-segmented-control>
```

```html
<!-- With size, color, and a disabled option -->
<tw-segmented-control [(value)]="plan" size="sm" color="accent">
  <tw-segmented-option value="free">Free</tw-segmented-option>
  <tw-segmented-option value="pro">Pro</tw-segmented-option>
  <tw-segmented-option value="enterprise" [disabled]="true">Enterprise</tw-segmented-option>
</tw-segmented-control>
```

```html
<!-- Vertical orientation -->
<tw-segmented-control [(value)]="align" orientation="vertical">
  <tw-segmented-option value="left">Left</tw-segmented-option>
  <tw-segmented-option value="center">Center</tw-segmented-option>
  <tw-segmented-option value="right">Right</tw-segmented-option>
</tw-segmented-control>
```

```html
<!-- Disabled group -->
<tw-segmented-control [(value)]="mode" [disabled]="true">
  <tw-segmented-option value="light">Light</tw-segmented-option>
  <tw-segmented-option value="dark">Dark</tw-segmented-option>
</tw-segmented-control>
```

```html
<!-- With reactive forms -->
<tw-segmented-control [formControl]="viewControl">
  <tw-segmented-option value="day">Day</tw-segmented-option>
  <tw-segmented-option value="week">Week</tw-segmented-option>
  <tw-segmented-option value="month">Month</tw-segmented-option>
</tw-segmented-control>
```

```html
<!-- Rich content: icon + text -->
<tw-segmented-control [(value)]="viewMode">
  <tw-segmented-option value="grid">
    <svg class="size-4 shrink-0"><!-- grid icon --></svg>
    Grid
  </tw-segmented-option>
  <tw-segmented-option value="list">
    <svg class="size-4 shrink-0"><!-- list icon --></svg>
    List
  </tw-segmented-option>
</tw-segmented-control>
```

## Styling

Use `tv()` with **slots**: `root`, `option`.

**`root` slot (the container):**
- Base: `inline-flex bg-surface-muted p-1 rounded-xl` (the recessed track that options sit inside)
- Orientation variant: `horizontal` -> `flex-row`, `vertical` -> `flex-col`
- Disabled: `opacity-50 pointer-events-none`

**`option` slot (each toggle button):**
- Base: `inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap cursor-pointer rounded-md transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`
- Size variants follow the inline element padding scale from CLAUDE.md and the trigger font size scale (`xs`: `px-2 py-1 text-xs`, `sm`: `px-3 py-1.5 text-sm`, `md`: `px-4 py-2 text-sm`, `lg`: `px-5 py-2.5 text-base`, `xl`: `px-6 py-3 text-base`)

**Active/inactive state** — applied dynamically (not via tv variants) following the tabs pattern:
- Active: `bg-surface shadow-sm text-{color}-700` (matches the `PILL_ACTIVE` lookup from tabs). Use a static `Record<TwColor, string>` lookup for active classes.
- Inactive: `text-fg-muted hover:text-fg`
- Disabled option: `opacity-50 pointer-events-none cursor-default`

Enable `twMerge: true`. Define `defaultVariants`: `size: 'md'`, `orientation: 'horizontal'`.

The root gap between options is `gap-1` (matching pill tabs gap).

## Accessibility

ARIA pattern: **radiogroup**.
- Container: `role="radiogroup"`. Bind `aria-orientation` to the orientation input. Bind `aria-disabled` when disabled.
- Each option: `role="radio"`. Bind `aria-checked` to whether it is the active option. Bind `aria-disabled` when the option or group is disabled.

Keyboard behavior (on the container, matching radiogroup pattern):
- `ArrowRight` / `ArrowDown` -> activate next enabled option (wrap around)
- `ArrowLeft` / `ArrowUp` -> activate previous enabled option (wrap around)
- `Home` -> activate first enabled option
- `End` -> activate last enabled option

Focus management: roving tabindex. The active option has `tabindex="0"`, all others have `tabindex="-1"`. When an arrow key moves selection, focus follows to the newly active option. Use `FocusMonitor` on the container for focus origin tracking.

## Form integration

Implement `ControlValueAccessor` on `SegmentedControlComponent`:
- `writeValue(val)`: set the internal value signal, which updates which option appears active
- `registerOnChange(fn)`: store the callback; call it whenever the user selects a new option
- `registerOnTouched(fn)`: store the callback; call it on blur from the container
- `setDisabledState(isDisabled)`: set an internal disabled signal that merges with the `disabled` input
- Provide `NG_VALUE_ACCESSOR` with `forwardRef` and `multi: true`

Must work with template-driven (`ngModel`), reactive (`formControl`/`formControlName`), and signal-based forms.

## Implementation notes

- The container queries its options via `contentChildren(SegmentedControlOptionComponent)`.
- Use `linkedSignal()` for the internal selected value — it syncs with the `value` model input but can be set independently when the user clicks or uses keyboard.
- Each option needs an `ElementRef` so the container can call `.focus()` on it during keyboard navigation (same pattern as `TabTriggerElementDirective`).
- The container computes per-option classes (active vs inactive) using a method, not per-option computed signals. Follow the `getTriggerClasses()` pattern from tabs.
- Active class lookup: define a `Record<TwColor, string>` constant mapping each color to its active classes (e.g., `primary` -> `'bg-surface shadow-sm text-primary-700'`). This keeps all class strings static for Tailwind v4 scanning.
- Keyboard handler lives on the container element, triggered via `(keydown)` in the host.
- The option component is simple — it holds `value`, `disabled`, and an `ElementRef`. It does not manage its own classes; the container applies classes to options via the template.
- Use `inject(forwardRef(() => SegmentedControlComponent))` in the option to access the parent, or use the container's template to render options. Prefer the container template approach (iterate `contentChildren` and render buttons) as tabs does.
- However, since options use `ng-content` for labels, the container cannot re-template them. Instead: options are rendered in-place, and the container provides class/state information to each option. The option injects the parent to read active state and classes.
- Generate unique IDs for ARIA attributes using an incrementing counter (same pattern as tabs).

## File structure

Directory: `projects/ngx-tw/segmented-control/`

- `segmented-control.ts` — `SegmentedControlComponent`, `SegmentedControlOptionComponent`, `tv()` config, active class lookups
- `segmented-control.spec.ts` — tests covering: default render, all sizes, orientation, color variants, click selection, keyboard navigation (all arrow keys, Home, End), disabled group, disabled individual option, ARIA roles and attributes (`role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-orientation`, `aria-disabled`), roving tabindex, content projection, `ControlValueAccessor` contract (`writeValue`, `onChange`, `setDisabledState`)
- `index.ts` — exports `SegmentedControlComponent`, `SegmentedControlOptionComponent`
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

## Public API exports

Export from `index.ts`: `SegmentedControlComponent`, `SegmentedControlOptionComponent`.
Add `export * from 'ngx-tw/segmented-control';` to root `public-api.ts`.

## Constraints

- All styling via Tailwind utilities — no CSS files
- Semantic color tokens only — never raw palette colors
- Surface/fg/border tokens for structural styling — never raw `neutral-*`
- `ChangeDetection.OnPush` on both components
- Signal APIs: `input()`, `model()`, `computed()`, `linkedSignal()`
- Host bindings via `host` object — no `@HostBinding`/`@HostListener`
- `inject()` only — no constructor injection
- `twMerge: true` on `tv()` config
- No `@angular/animations`
- Tests use Vitest — no `fakeAsync`/`tick`
- All `input()`/`model()` declarations must have JSDoc comments
