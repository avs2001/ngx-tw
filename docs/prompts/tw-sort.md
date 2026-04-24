# Prompt: Build `tw-sort` for ngx-tw

## Overview

Build a composable, accessible sorting primitive for use with tables, lists, grids, or any custom data view. It provides two pieces:

- **`TwSortDirective`** (`[twSort]`) — a container directive that holds sort state (`active` column id + `direction`) and emits `twSortChange` when users interact with child headers.
- **`TwSortHeaderComponent`** (`[tw-sort-header]`) — an attribute-selector component that turns any element (a `<th>`, `<div>`, `<button>`, …) into a clickable sort header with visible direction arrow, keyboard support, and correct `aria-sort` semantics.

Consumers compose these with their own rendering layer — we do NOT ship a table or list component. The directive does not care what the data is; it emits events, consumers sort.

**Research summary**

- **Angular Material `MatSort` / `MatSortHeader`** — `MatSort` is a container directive (`[matSort]`) exposing `active`, `direction`, `start`, `disableClear`, `disabled` inputs and a `matSortChange` output. `MatSortHeader` is a component with attribute selector `[mat-sort-header]` that injects the parent `MatSort`, registers itself via `MatSort.register()`, and cycles direction on click/keyboard. Direction type is `'asc' | 'desc' | ''` where `''` is the cleared state. `aria-sort` is set on the host; `role="button"` lives on an **inner** element inside the header template, not on the host, because of an [NVDA bug (#7718)](https://github.com/nvaccess/nvda/issues/7718) where `tabindex` on a `th` breaks keyboard navigation. We follow Material's split-host pattern.
- **PrimeNG `p-sortIcon`** — standalone icon that reads sort state from a parent table. Less composable — we prefer Material's decoupled pattern.
- **CDK `FocusMonitor`** — used to distinguish keyboard-vs-mouse focus for focus ring behaviour. Reuse as in `button.ts`.
- **CDK keycodes** (`ENTER`, `SPACE`) — use for keyboard handler.

The winning mix for ngx-tw: Material's two-piece architecture and aria-sort semantics, **signal-based API** (no RxJS `Subject`s exposed), `SortDirection = 'asc' | 'desc' | null` (cleaner than `''`), `TwColor` / `TwSize` integration, composable projected arrow icon slot for full customization, and Tailwind v4 styling with `tv()`.

## Context

Read before starting:

- `.claude/CLAUDE.md` — conventions, Visual Design System tokens, `tv()` usage, JSDoc, Vitest rules.
- `projects/ngx-tw/paginator/paginator.ts` — canonical signal-based pattern with `model()`, `computed()`, `host` object, `LiveAnnouncer`, tv() multi-slot.
- `projects/ngx-tw/button/button.ts` — attribute-selector directive with `FocusMonitor`, `inject()`, `host` bindings, no `@HostBinding`/`@HostListener`.
- `projects/ngx-tw/tabs/tabs.ts` + `tabs/tabs.html` — static `Record<TwColor, string>` color maps for active states, parent-child signal coordination.
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`.
- `node_modules/@angular/cdk/keycodes/index.d.ts` — `ENTER`, `SPACE` constants.
- `node_modules/@angular/cdk/a11y/index.d.ts` — `FocusMonitor`, `LiveAnnouncer`.

## What to build

A new secondary entry point `ngx-tw/sort` exporting:

1. **`SortDirective`** (selector: `[twSort]`, exportAs: `twSort`) — container directive.
2. **`SortHeaderComponent`** (selector: `[tw-sort-header]`, exportAs: `twSortHeader`) — sortable header.

Plus:

- `SortDirection = 'asc' | 'desc' | null`
- `TwSortArrowPosition = 'before' | 'after'`
- `TwSortEvent` — output payload `{ active: string | null; direction: SortDirection; previous: { active: string | null; direction: SortDirection } }`
- `TwSortable` — interface child headers implement when registering with parent.

## Architecture

```
<table twSort [twSortActive]="active" (twSortChange)="onSort($event)">
  <thead>
    <tr>
      <th tw-sort-header id="name">Name</th>
      <th tw-sort-header id="age">Age</th>
    </tr>
  </thead>
  <tbody>…</tbody>
</table>
```

- `SortDirective` holds `active = model<string | null>(null)` and `direction = model<SortDirection>(null)`.
- `SortHeaderComponent` injects parent `SortDirective` via `inject(SortDirective, { optional: true })`. If absent, throws in dev mode.
- On init, the header calls `parent.register(this)` and deregisters on `DestroyRef`. Duplicate `id` throws in dev mode.
- Clicking / pressing Enter or Space on a header calls `parent.sort(header)`, which:
  - If header.id !== active → sets `active = header.id`; `direction = effectiveStart(header)`.
  - Else → advances direction along the cycle returned by `getDirectionCycle(header)`.
- `parent.sortChange` emits `TwSortEvent` with the new and previous snapshot.
- `aria-sort` on each header host reflects that header's contribution: `'ascending' | 'descending' | 'none'`.

## API — SortDirective

### Inputs / models

```typescript
/** The id of the currently sorted header, or `null` when nothing is sorted. Two-way bindable via `[(twSortActive)]`. Defaults to `null`. */
readonly active = model<string | null>(null, { alias: 'twSortActive' });

/** Current sort direction. `null` means cleared. Two-way bindable via `[(twSortDirection)]`. Defaults to `null`. */
readonly direction = model<SortDirection>(null, { alias: 'twSortDirection' });

/** Starting direction used when a header becomes active for the first time. Per-header `start` overrides this. Defaults to `'asc'`. */
readonly start = input<'asc' | 'desc'>('asc', { alias: 'twSortStart' });

/** When true, the direction cycle skips the cleared (`null`) state — headers toggle between `'asc'` and `'desc'` only. Per-header `disableClear` overrides this. Defaults to `false`. */
readonly disableClear = input<boolean>(false, { alias: 'twSortDisableClear' });

/** When true, all child sort headers are disabled. Defaults to `false`. */
readonly disabled = input<boolean>(false, { alias: 'twSortDisabled' });
```

### Outputs

```typescript
/** Fires whenever the user changes `active` or `direction` by interacting with a header. Programmatic changes to `[(twSortActive)]` / `[(twSortDirection)]` do NOT emit. */
readonly sortChange = output<TwSortEvent>({ alias: 'twSortChange' });
```

### Public methods

```typescript
/** Registers a header so its id is validated (duplicate ids throw in dev mode) and can participate in sorting. Called by `SortHeaderComponent` on init. */
register(sortable: TwSortable): void;

/** Deregisters a header. Called on destroy. */
deregister(sortable: TwSortable): void;

/** Cycles the direction for the given header and emits `twSortChange`. No-op when `disabled()` is true. */
sort(sortable: TwSortable): void;

/** Returns the next direction for the header given the current state. Exported for testing; header uses this internally via `sort()`. */
getNextSortDirection(sortable: TwSortable): SortDirection;
```

### Internal

- `private readonly sortables = new Map<string, TwSortable>();`
- Duplicate-id check in `register()` throws in `isDevMode()` only.
- `sort(header)` logic:

```text
if (this.active() !== header.id) {
  previous = { active: this.active(), direction: this.direction() }
  this.active.set(header.id)
  this.direction.set(effectiveStart(header))
} else {
  previous = { ..., direction: this.direction() }
  this.direction.set(getNextSortDirection(header))
  if (this.direction() === null) this.active.set(null)
}
this.sortChange.emit({ active, direction, previous })
```

- `getNextSortDirection(header)`:
  - `const start = header.start ?? this.start()`
  - `const disableClear = header.disableClear ?? this.disableClear()`
  - Build cycle: `start === 'desc' ? ['desc','asc'] : ['asc','desc']`, then push `null` unless `disableClear`.
  - Return `cycle[(cycle.indexOf(this.direction()) + 1) % cycle.length]`.
- When `active.set(null)` happens in the clear step, `aria-sort` of all headers goes to `'none'`.

### TwSortable interface

```typescript
export interface TwSortable {
  /** Unique id identifying the column/field this header sorts. */
  readonly id: string;
  /** Header-level starting direction (overrides parent `start`). */
  readonly start: 'asc' | 'desc' | undefined;
  /** Header-level disable-clear (overrides parent `disableClear`). */
  readonly disableClear: boolean | undefined;
  /** Whether this header is disabled. */
  readonly disabled: boolean;
}
```

Do NOT require `TwSortable` implementations to extend `SortHeaderComponent`. The interface is kept minimal so the directive is unit-testable without mounting a full component.

### TwSortEvent

```typescript
export interface TwSortEvent {
  /** New active header id, or `null` when cleared. */
  active: string | null;
  /** New direction. */
  direction: SortDirection;
  /** Previous snapshot. */
  previous: {
    active: string | null;
    direction: SortDirection;
  };
}
```

## API — SortHeaderComponent

### Inputs

```typescript
/** Unique id for this header. Required. */
readonly id = input.required<string>();

/** Overrides the parent `SortDirective.start` for this header only. */
readonly start = input<'asc' | 'desc' | undefined>(undefined);

/** Overrides the parent `SortDirective.disableClear` for this header only. */
readonly disableClear = input<boolean | undefined>(undefined);

/** When true, this header is disabled. Defaults to `false`. */
readonly disabled = input<boolean>(false);

/** Whether the sort arrow renders `'before'` or `'after'` the projected label. Defaults to `'after'`. */
readonly arrowPosition = input<TwSortArrowPosition>('after');

/** Semantic color used for the arrow and hover accent when this header is active. Defaults to `'primary'`. */
readonly color = input<TwColor>('primary');

/** Controls padding and font size. Uses shared `TwSize`. Defaults to `'md'`. */
readonly size = input<TwSize>('md');

/** Accessible description read by screen readers for the sort action (set via `AriaDescriber`). Defaults to `'Sort'`. */
readonly sortActionDescription = input<string>('Sort');
```

### Content projection

- **Default slot** — the label text (`<th tw-sort-header id="name">Name</th>`). Always rendered.
- **`[twSortHeaderIcon]`** (attribute selector match) — fully replaces the built-in arrow SVG. Consumers can project a `tw-icon` or a custom SVG. Falls back to the built-in chevron when absent.

### Host bindings

```
host: {
  '[class]': 'hostClasses()',
  '[attr.aria-sort]': 'ariaSort()',  // 'ascending' | 'descending' | 'none'
  '[attr.aria-disabled]': 'isDisabled() || null',
  '(click)': 'handleClick()',
  '(keydown)': 'handleKeydown($event)',
}
```

> Do NOT set `role="button"` or `tabindex` on the host. Those go on the inner `.tw-sort-header-container` element inside the template (per NVDA workaround described in Overview research). The host's `aria-sort` is still read correctly because it lives on an element acting as the table header.

### Template (external `sort-header.html`, under 50 lines)

```html
<div
  [class]="containerClasses()"
  [attr.role]="isDisabled() ? null : 'button'"
  [attr.tabindex]="isDisabled() ? null : 0"
  [attr.aria-describedby]="describerId()"
>
  @if (arrowPosition() === 'before') {
    <ng-container *ngTemplateOutlet="arrowTmpl" />
  }
  <span [class]="labelClasses()"><ng-content /></span>
  @if (arrowPosition() === 'after') {
    <ng-container *ngTemplateOutlet="arrowTmpl" />
  }
</div>

<ng-template #arrowTmpl>
  @if (renderArrow()) {
    <span [class]="arrowClasses()">
      <ng-content select="[twSortHeaderIcon]">
        <!-- Default chevron SVG; flips via transform on direction change -->
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" [class]="arrowIconClasses()">
          <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
        </svg>
      </ng-content>
    </span>
  }
</ng-template>
```

`renderArrow()` returns true when the header is the active one OR not disabled (keeps layout stable on hover). Inactive headers show a faint neutral arrow (`opacity-0 group-hover:opacity-50`). The active header's arrow uses `color-500/600` and rotates `180deg` for `desc`.

### Keyboard handler

```typescript
handleKeydown(event: KeyboardEvent): void {
  if (this.isDisabled()) return;
  if (event.keyCode === ENTER || event.keyCode === SPACE) {
    event.preventDefault();
    this.triggerSort();
  }
}
```

### Click handler

```typescript
handleClick(): void {
  if (this.isDisabled()) return;
  this.triggerSort();
}

private triggerSort(): void {
  this.parent.sort(this);
}
```

### Computed signals

```typescript
readonly isActive = computed(() => this.parent.active() === this.id());
readonly isDisabled = computed(() => this.parent.disabled() || this.disabled());
readonly effectiveDirection = computed<SortDirection>(
  () => (this.isActive() ? this.parent.direction() : null),
);
readonly ariaSort = computed(() => {
  const d = this.effectiveDirection();
  if (d === 'asc') return 'ascending';
  if (d === 'desc') return 'descending';
  return 'none';
});
readonly renderArrow = computed(() => this.isActive() || !this.isDisabled());
```

### FocusMonitor

`ngOnInit`: `focusMonitor.monitor(containerRef, true)` on the inner container (not the host). Stop on `DestroyRef`.

### AriaDescriber

Use `AriaDescriber.describe(containerRef.nativeElement, sortActionDescription())` on init; remove on destroy. Gives screen readers a contextual "Sort" hint on top of the header's text content. Sync whenever `sortActionDescription()` changes (use `effect()`).

## Styling

### `tv()` config — multi-slot

Slots:

- `host` — host-level classes (cursor, select, min-width hint)
- `container` — the inner element with `role="button"` (focus ring lives here)
- `label` — wraps the projected text
- `arrow` — wrapper around the arrow
- `arrowIcon` — the SVG itself (size, rotate transform)

**Base classes:**

```
host:       'group select-none'
container:  'inline-flex items-center gap-1.5 cursor-pointer rounded-md font-medium text-fg transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 hover:bg-surface-muted'
label:      'min-w-0'
arrow:      'inline-flex shrink-0 items-center justify-center transition-opacity duration-200 motion-reduce:transition-none'
arrowIcon:  'shrink-0 transition-transform duration-200 motion-reduce:transition-none'
```

**Variants — `size`** (container padding + font + icon):

| Size | container | arrowIcon |
|---|---|---|
| `xs` | `px-2 py-1 text-xs` | `size-3.5` |
| `sm` | `px-2.5 py-1.5 text-sm` | `size-4` |
| `md` | `px-3 py-2 text-sm` | `size-4` |
| `lg` | `px-4 py-2.5 text-base` | `size-5` |
| `xl` | `px-5 py-3 text-base` | `size-5` |

**Variants — `active`** (is this header currently sorted?):

- `true` — `container: 'text-fg'`, `arrow: 'opacity-100'`
- `false` — `container: 'text-fg-muted'`, `arrow: 'opacity-0 group-hover:opacity-50 group-focus-within:opacity-50'`

**Variants — `direction`** (drives arrow rotation):

- `asc` — `arrowIcon: 'rotate-180'`
- `desc` — `arrowIcon: 'rotate-0'`
- `null` — `arrowIcon: 'rotate-0'`

> Rationale: the built-in SVG is a downward chevron; `desc` shows it as-is (pointing down toward the largest item at the bottom), `asc` flips to point up.

**Variants — `disabled`:**

- `true` — `host: 'opacity-50 pointer-events-none'`

**Variants — `color`** (applied only when active — static per-color maps):

```typescript
const ARROW_ACTIVE_COLOR: Record<TwColor, string> = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  accent: 'text-accent-600',
  neutral: 'text-fg',
  info: 'text-info-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
};
```

Computed via `arrowClasses()` — merges base + active state + per-color via `twMerge`.

**`defaultVariants`:** `{ size: 'md', active: false, direction: null, disabled: false }`. Enable `twMerge: true`.

## Accessibility

- **`aria-sort`** on each header host: `'ascending' | 'descending' | 'none'`. Only the active header gets `'ascending'` or `'descending'`. Inactive headers get `'none'` (explicit, not null — aids AT users scanning the table).
- **`role="button"` + `tabindex="0"`** on the inner container only (not the host) to avoid the NVDA `<th tabindex>` bug. When `disabled`, remove both attributes.
- **`aria-describedby`** pointing at an off-screen description managed by `AriaDescriber` (`sortActionDescription()` string). Screen readers announce the header's visible content AND the action description, so users know this element performs sorting.
- **Focus ring** — standard `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on the container element, using the primary token regardless of the header's `color()` (focus indication is a global concern; `color()` only tints the active arrow).
- **Keyboard** — Enter / Space trigger `sort()`. No other keys are consumed (consumer can add arrow-key navigation via CDK `ListKeyManager` if they want).
- **`FocusMonitor`** — use CDK's monitor on the container element so mouse-vs-keyboard focus is distinguished. No bespoke focus-visible polyfill.
- **`LiveAnnouncer`** — OPTIONAL. Do NOT announce automatically — sort changes are often part of a larger data-table update the consumer announces themselves. Exposing a public API for announcements is out of scope.
- **AXE + WCAG AA** — must pass AXE with zero violations on a representative configuration. Visual focus ring must have 3:1 contrast against `surface`. Disabled state uses `opacity-50` (sufficient at 3:1 on non-text UI).

## Form integration

Neither `SortDirective` nor `SortHeaderComponent` is a form control. Neither implements `ControlValueAccessor`.

## Usage examples

```html
<!-- Basic table integration -->
<table twSort (twSortChange)="sorted($event)">
  <thead>
    <tr>
      <th tw-sort-header id="name">Name</th>
      <th tw-sort-header id="age">Age</th>
      <th tw-sort-header id="role">Role</th>
    </tr>
  </thead>
  <tbody>
    @for (row of sortedRows(); track row.id) {
      <tr><td>{{ row.name }}</td><td>{{ row.age }}</td><td>{{ row.role }}</td></tr>
    }
  </tbody>
</table>
```

```html
<!-- Two-way binding for URL sync -->
<table
  twSort
  [(twSortActive)]="activeColumn"
  [(twSortDirection)]="direction"
  twSortStart="desc"
  [twSortDisableClear]="true"
>
  <thead>
    <tr>
      <th tw-sort-header id="created" color="success">Created</th>
      <th tw-sort-header id="updated" color="info">Updated</th>
    </tr>
  </thead>
</table>
```

```html
<!-- Composed with a list: the directive doesn't care about the host element -->
<div twSort (twSortChange)="applySort($event)" class="flex gap-2">
  <button tw-sort-header id="priority" twButton variant="ghost">Priority</button>
  <button tw-sort-header id="due" twButton variant="ghost">Due Date</button>
</div>
```

```html
<!-- Custom icon -->
<th tw-sort-header id="price">
  Price
  <tw-icon name="arrows-up-down" twSortHeaderIcon />
</th>
```

```html
<!-- Per-header overrides -->
<th tw-sort-header id="score" start="desc" [disableClear]="true" color="warning">
  Score
</th>
```

## Edge cases

- **Child header mounted with a parent missing** → throws `Error('SortHeader must be placed within a parent element with the twSort directive.')` in dev mode.
- **Duplicate header ids** → throws `Error('Cannot have two tw-sort-header elements with the same id (…).')` in dev mode only.
- **`active` set programmatically to an unregistered id** → no error, `ariaSort()` returns `'none'` for all current headers (their `id !== active`). When the matching header mounts later, it picks up the active state automatically.
- **`direction` set programmatically without `active`** → allowed; the directive stores it and applies it when `active` is next set. Visually nothing changes until `active` is non-null.
- **`disabled` toggled on directive while header is active** → header appears disabled but `aria-sort` still reflects current direction (don't hide sort state — users should know what's currently applied).
- **Header `disabled` true while it is the active one** → visually muted but `aria-sort` still shows the direction. Clicking/keyboard is a no-op until re-enabled.
- **Programmatic `active` / `direction` changes** — do NOT emit `twSortChange`. Consumers who want to observe programmatic changes bind `[(twSortActive)]` / `[(twSortDirection)]`.
- **`start='desc'` with `disableClear=false`** → cycle is `[null → desc → asc → null → …]` when the header is newly activated (so first click lands on `desc`, second on `asc`, third clears). Verify in spec.
- **Clicking a non-active header** → sets `active = header.id`, `direction = effectiveStart(header)`, regardless of previous direction. Always starts a fresh cycle on column switch.
- **Same-header cycle hits `null`** → `active.set(null)` as well, so the whole sort clears.

## Implementation notes

- **No `@HostBinding` / `@HostListener`** — use `host` object.
- **No constructor injection** — use `inject()` only.
- **No RxJS exposed** — all public state is signal-based. Internally no `Subject`s.
- **`LiveAnnouncer`** — do NOT inject. Not needed per design decision above.
- **`AriaDescriber`** — inject via `inject(AriaDescriber, { optional: true })`. Apply to the inner container element from a `viewChild` ref.
- **`FocusMonitor`** — inject via `inject(FocusMonitor)`. Monitor the inner container. Stop via `DestroyRef.onDestroy`.
- **`ChangeDetection.OnPush`** on both directive (no template; still valid via `@Directive`) and header component.
- **Strict TypeScript** — `SortDirection` uses `null`, never `''`.
- **Dev warnings / throws** — gate behind `isDevMode()` (import from `@angular/core`).
- **JSDoc** — every `input()`, `output()`, `model()`, and public method.
- **No arrow functions in templates**; use `computed()` signals for derived values.
- **Template length** — header template is ~25 lines; extract to `sort-header.html`. Directive has no template.

## File structure

All files in `projects/ngx-tw/sort/`:

- `sort.ts` — `SortDirective`, `TwSortable` interface, `TwSortEvent` interface, `SortDirection` type, `getSortDirectionCycle` pure helper (exported internally for unit tests, NOT from `index.ts`).
- `sort-header.ts` — `SortHeaderComponent`, `TwSortArrowPosition` type, tv() config, `ARROW_ACTIVE_COLOR` static map.
- `sort-header.html` — external template.
- `sort.spec.ts` — directive tests + integration tests with `SortHeaderComponent`. Vitest, no `fakeAsync`.
- `sort-header.spec.ts` — isolated header tests (rendering, arrow rotation, ARIA, disabled, focus monitor, content projection of `[twSortHeaderIcon]`).
- `index.ts` — public exports.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Also update:

- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/sort';`.

## Public API exports (`index.ts`)

```typescript
export { SortDirective } from './sort';
export { SortHeaderComponent } from './sort-header';
export type {
  SortDirection,
  TwSortable,
  TwSortEvent,
} from './sort';
export type { TwSortArrowPosition } from './sort-header';
```

Do NOT export `getSortDirectionCycle` or `ARROW_ACTIVE_COLOR` publicly — internal only.

## Constraints

- Tailwind v4 utilities only — no CSS file for the component. Keyframes for rotation already handled by `transition-transform duration-200`.
- Semantic color tokens (`primary-*`, `info-*`, etc.) — never raw palette.
- Surface/fg/border tokens (`bg-surface-muted`, `text-fg-muted`, etc.) for structural styling — never raw `neutral-*`.
- Static `Record<TwColor, string>` maps for color-dependent classes — no string interpolation of Tailwind class names.
- Signal API with `model()` for two-way binding on `active` and `direction`. `input()` elsewhere.
- `ChangeDetection.OnPush` on the component.
- `host` object for host bindings; `inject()` for DI; native control flow (`@if`).
- No `@angular/animations`. No `fakeAsync` / `tick`.
- Every public member has a one-line JSDoc.
- Tests use Vitest with `vi.spyOn`, `fixture.componentRef.setInput`, `async/await` + `fixture.whenStable()`.

## Testing checklist

- **Directive — state management**: default `active = null`, `direction = null`; `twSortActive` / `twSortDirection` are two-way bindable; programmatic changes do NOT emit `twSortChange`.
- **Directive — register/deregister**: headers register on init; throws on duplicate id in dev mode; deregisters on destroy.
- **Directive — sort cycle**: with `start='asc'`, `disableClear=false`, calling `sort(header)` cycles `null → asc → desc → null → asc …`; with `disableClear=true`, cycles `null → asc → desc → asc → desc …` (first activation only hits `null → asc`); with `start='desc'`, `disableClear=false`, cycles `null → desc → asc → null`.
- **Directive — column switch**: sorting a different header always starts at `effectiveStart(newHeader)` regardless of prior direction.
- **Directive — per-header overrides**: `header.start = 'desc'` overrides parent `start = 'asc'`; `header.disableClear = true` overrides parent `disableClear = false`.
- **Directive — disabled**: `sort(header)` is a no-op when `directive.disabled() === true`; no `sortChange` emission.
- **Header — rendering**: renders projected content; arrow visible when active; inactive arrow has `opacity-0` class in the DOM; size variant applies correct padding classes.
- **Header — ARIA**: `aria-sort="none"` when inactive; `'ascending'` / `'descending'` when active; `role="button"` + `tabindex="0"` on the inner container when enabled; both removed when `disabled`.
- **Header — click**: click triggers `parent.sort(this)`, emits `twSortChange` with correct `active`, `direction`, `previous`.
- **Header — keyboard**: Enter and Space on the container trigger sort; other keys do nothing; `event.preventDefault()` is called so Space doesn't scroll the page.
- **Header — disabled**: click/keyboard no-op; `aria-disabled="true"`; no ring on focus.
- **Header — content projection**: default slot (text) renders; `[twSortHeaderIcon]` replaces built-in SVG; when not projected, default SVG renders.
- **Header — arrow position**: `arrowPosition='before'` renders arrow before label; `'after'` after.
- **Header — color**: active arrow element has the expected per-color class (query DOM for `text-primary-600` etc.).
- **Integration — parent/child**: nested `SortHeaderComponent` updates when parent state changes; two headers share state (activating one clears `aria-sort` on the other).
- **AXE** — one axe-core check on a table containing three sort headers in various states.
- **No `fakeAsync`** — all async waits via `await fixture.whenStable()`.
