# Prompt: Build `tw-tabs` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, design tokens, accessibility requirements, Visual Design System
- `projects/ngx-tw/card/card.ts` — multi-part component pattern with slots `tv()`, parent component + child directives that inject parent and read computed classes
- `projects/ngx-tw/button/button.ts` — directive pattern with `FocusMonitor`, `DestroyRef` cleanup, `host` bindings, `computed()` for variant classes
- `projects/ngx-tw/alert/alert.ts` — `contentChild()` detection, `LiveAnnouncer`, `animate.leave`, slot-based `tv()`
- `projects/ngx-tw/badge/badge.ts` — compact component with dismissible pattern, `output()` usage
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types
- CDK: `FocusKeyManager` from `@angular/cdk/a11y` (accepts `Signal<T[]>` + `Injector`), `FocusableOption`, `FocusMonitor`

## What to build

A tab component system for organizing content into panels, where only one panel is visible at a time. The system consists of a container component (`tw-tabs`), individual tab definitions (`tw-tab`), and optional structural directives for full template control over triggers and content. It supports multiple visual variants (underline, enclosed, pill), horizontal and vertical orientation, lazy content rendering, closable tabs, a scrollable overflow tab strip, fitted/equal-width mode, and full keyboard navigation via CDK's `FocusKeyManager`.

The active tab is two-way bound via `model()` using a string-based value identifier per tab, with `linkedSignal()` internally so clicking a tab updates the active state without requiring the parent to re-provide the value.

## API design

### `TabsComponent` — selector: `tw-tabs`

Container component. Hosts the tablist and panels. Uses `ChangeDetection.OnPush`.

#### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `variant` | `input<TabsVariant>()` | `'underline'` | `/** Controls the visual style of the tab strip. Defaults to 'underline'. */` |
| `color` | `input<TwColor>()` | `'primary'` | `/** Sets the semantic color for active tab indicators and highlights. Defaults to 'primary'. */` |
| `size` | `input<TwSize>()` | `'md'` | `/** Controls padding, font size, and icon size of tab triggers. Defaults to 'md'. */` |
| `orientation` | `input<'horizontal' \| 'vertical'>()` | `'horizontal'` | `/** Layout direction of the tab strip. Defaults to 'horizontal'. */` |
| `fitted` | `input<boolean>()` | `false` | `/** When true, tab triggers stretch to fill the available width equally. Defaults to false. */` |

`TabsVariant` = `'underline' | 'enclosed' | 'pill'`

#### Models

| Model | Type | JSDoc |
|---|---|---|
| `value` | `model<string>()` | `/** The value of the currently active tab. Two-way bound. Updates when the user selects a tab. */` |

Use `linkedSignal()` internally to track the active tab — it initializes from `value()` but user clicks update it locally before emitting back.

#### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `closed` | `string` | `/** Fires when a closable tab's close button is clicked. Payload is the tab's value. */` |

### `TabComponent` — selector: `tw-tab`

Defines a single tab. Projected as content children inside `tw-tabs`. Uses `ChangeDetection.OnPush`.

#### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `value` | `input.required<string>()` | — | `/** Unique identifier for this tab. Used to match the active tab value. */` |
| `label` | `input<string>()` | `''` | `/** Plain text label shown in the trigger. Ignored when a custom trigger template is provided. */` |
| `disabled` | `input<boolean>()` | `false` | `/** When true, the tab cannot be selected and is skipped by keyboard navigation. Defaults to false. */` |
| `closable` | `input<boolean>()` | `false` | `/** When true, a close button is rendered in the tab trigger. Defaults to false. */` |
| `lazy` | `input<boolean>()` | `false` | `/** When true, the tab panel content is only instantiated when the tab becomes active for the first time. Defaults to false. */` |

### Content projection

**Tab trigger customization** — `TabTriggerDirective` (attribute selector: `twTabTrigger`)

A structural-like directive applied to an `ng-template` inside `tw-tab`. When present, replaces the default trigger content (label text) with the consumer's template. The template receives an implicit context with `{ $implicit: { active: boolean, disabled: boolean, value: string } }`.

```html
<tw-tab value="settings">
  <ng-template twTabTrigger let-ctx>
    <svg>...</svg> {{ ctx.active ? 'Settings (active)' : 'Settings' }}
  </ng-template>
  <p>Settings content here</p>
</tw-tab>
```

**Tab content** — the default `ng-content` of each `tw-tab` is rendered as the panel body when that tab is active.

**Tab content template** — `TabContentDirective` (attribute selector: `twTabContent`)

An `ng-template` directive inside `tw-tab`. When present, the template is used for the panel content. This is the mechanism for lazy rendering — the template is only stamped when the tab is activated (and optionally destroyed on deactivation, or kept alive after first activation based on the `lazy` input behavior: lazy means "render on first activation, keep alive thereafter").

```html
<tw-tab value="dashboard" label="Dashboard" [lazy]="true">
  <ng-template twTabContent>
    <expensive-dashboard-widget />
  </ng-template>
</tw-tab>
```

## Usage examples

```html
<!-- Simplest case: underline tabs with string labels -->
<tw-tabs [(value)]="activeTab">
  <tw-tab value="overview" label="Overview">Overview content</tw-tab>
  <tw-tab value="details" label="Details">Details content</tw-tab>
  <tw-tab value="history" label="History">History content</tw-tab>
</tw-tabs>
```

```html
<!-- Pill variant, small size, primary color -->
<tw-tabs variant="pill" size="sm" color="primary" [(value)]="tab">
  <tw-tab value="all" label="All">...</tw-tab>
  <tw-tab value="active" label="Active">...</tw-tab>
  <tw-tab value="archived" label="Archived">...</tw-tab>
</tw-tabs>
```

```html
<!-- Enclosed variant, fitted width -->
<tw-tabs variant="enclosed" [fitted]="true" [(value)]="tab">
  <tw-tab value="code" label="Code">...</tw-tab>
  <tw-tab value="preview" label="Preview">...</tw-tab>
</tw-tabs>
```

```html
<!-- Disabled tab and closable tabs -->
<tw-tabs [(value)]="tab" (closed)="onClose($event)">
  <tw-tab value="home" label="Home">...</tw-tab>
  <tw-tab value="locked" label="Locked" [disabled]="true">...</tw-tab>
  <tw-tab value="draft" label="Draft" [closable]="true">...</tw-tab>
</tw-tabs>
```

```html
<!-- Custom trigger with icon, lazy content -->
<tw-tabs [(value)]="tab">
  <tw-tab value="profile" [lazy]="true">
    <ng-template twTabTrigger let-ctx>
      <svg class="size-4 shrink-0">...</svg>
      Profile
    </ng-template>
    <ng-template twTabContent>
      <user-profile />
    </ng-template>
  </tw-tab>
</tw-tabs>
```

```html
<!-- Vertical orientation -->
<tw-tabs orientation="vertical" variant="pill" [(value)]="tab">
  <tw-tab value="general" label="General">...</tw-tab>
  <tw-tab value="security" label="Security">...</tw-tab>
  <tw-tab value="billing" label="Billing">...</tw-tab>
</tw-tabs>
```

## Styling

Use a slotted `tv()` config with the following slots: `root`, `tablist`, `tablistInner` (the scrollable strip), `trigger`, `triggerActive`, `panel`, `scrollButton`, `closeButton`.

**Variant styling:**

- **underline**: tablist has a bottom `border-border` (horizontal) or right `border-border` (vertical). Active trigger gets a 2px `border-b-2 border-{color}-500` (horizontal) or `border-r-2` (vertical) indicator. Triggers have transparent background; hover: `hover:text-fg hover:bg-surface-muted`. Active trigger text: `text-{color}-700`.
- **enclosed**: tablist has a bottom `border-border`. Active trigger gets `bg-surface border border-border border-b-transparent` (lifts out of the border). Inactive triggers: `bg-surface-muted`. Container rounded `rounded-lg`.
- **pill**: tablist has `bg-surface-muted rounded-xl p-1`. Triggers are `rounded-md`. Active trigger: `bg-surface shadow-sm text-{color}-700`. Gap between triggers: `gap-1`.

**Size mapping** for triggers follows the inline element padding scale from CLAUDE.md: xs=`px-2 py-1 text-xs`, sm=`px-3 py-1.5 text-sm`, md=`px-4 py-2 text-sm`, lg=`px-5 py-2.5 text-base`, xl=`px-6 py-3 text-base`.

**Orientation:** When `vertical`, root switches to `flex flex-row`. Tablist becomes `flex-col`. Panel takes remaining width via `flex-1 min-w-0`.

**Focus ring on triggers:** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.

**Disabled triggers:** `opacity-50 pointer-events-none`.

**Transitions on triggers:** `transition-colors duration-200 motion-reduce:transition-none`.

**Scroll buttons:** Visible only when the tab strip overflows horizontally. Styled as `size-5` icon buttons with `disabled:opacity-30 disabled:cursor-default`. Use `overflow-x-auto` with hidden scrollbar CSS class on the inner strip.

**Panel entry animation:** Use `animate.enter="fade-in"` on the panel container. Define `fade-in` keyframes in `_base.css` (150ms ease-in) if not already present.

**Close button inside trigger:** `size-4 rounded-md hover:bg-surface-muted transition-colors duration-200`. Positioned after the label with `gap-1.5`.

All `tv()` configs must have `defaultVariants` and `twMerge: true`.

## Accessibility

**ARIA roles:**
- `tw-tabs` root or its tablist container: `role="tablist"`, `aria-orientation="horizontal|vertical"`
- Each trigger: `role="tab"`, `aria-selected="true|false"`, `aria-controls="panel-{value}"`, `id="tab-{value}"`, `aria-disabled="true"` when disabled, `tabindex="0"` for active tab, `tabindex="-1"` for inactive tabs
- Each panel: `role="tabpanel"`, `aria-labelledby="tab-{value}"`, `id="panel-{value}"`, `tabindex="0"`

**Keyboard navigation** via CDK `FocusKeyManager`:
- Create a `FocusKeyManager` from the tab trigger elements (they implement `FocusableOption`). Configure with `.withHorizontalOrientation('ltr')` for horizontal, `.withVerticalOrientation()` for vertical. Enable `.withHomeAndEnd()` and `.withWrap()`.
- **ArrowRight / ArrowDown** — next tab (based on orientation)
- **ArrowLeft / ArrowUp** — previous tab (based on orientation)
- **Home** — first enabled tab
- **End** — last enabled tab
- **Enter / Space** — activate the focused tab (if using focus-follows-selection, activation is automatic on arrow key; this is the recommended WAI-ARIA pattern — implement "automatic activation" where focus change also selects the tab)
- **Tab** — moves focus out of the tablist to the active panel

**Focus management:**
- Use `FocusMonitor` on each trigger for focus origin tracking (keyboard vs mouse).
- When a tab is closed and it was the active tab, activate the nearest enabled sibling and move focus to it.

**Screen reader:**
- The close button inside a trigger must have `aria-label="Close {tab label}"`.
- Use `LiveAnnouncer` to announce tab changes: announce `"{label} tab, {index} of {total}"` on activation.

## Implementation notes

- `TabsComponent` collects `TabComponent` children via `contentChildren(TabComponent)`.
- `TabComponent` detects `twTabTrigger` and `twTabContent` templates via `contentChild(TabTriggerDirective)` and `contentChild(TabContentDirective)`.
- The tablist is rendered inside `TabsComponent`'s template by iterating over the content children. Each trigger is a `<button>` element. If a `twTabTrigger` template exists for a tab, stamp it with `ngTemplateOutlet`; otherwise render the `label()` text.
- The active panel is rendered below the tablist. Use `@if` to conditionally show the active tab's content. For lazy tabs, track a `Set<string>` of "ever-activated" values — once a tab has been activated, its content stays in the DOM (hidden via `[hidden]` or `@if` with the set check).
- Scroll overflow detection: use `ResizeObserver` (or `afterNextRender` + scroll event listeners) on the tablist inner container to detect overflow. Expose two signals `canScrollStart` and `canScrollEnd` that control scroll button visibility. Scroll buttons call `scrollBy()` on the inner container. Use a CSS class with `scrollbar-width: none` and `::-webkit-scrollbar { display: none }` to hide the native scrollbar.
- Generate stable IDs using a counter or `uniqueId()` pattern for `id` and `aria-controls`/`aria-labelledby` linkage. Prefix with a component-scoped ID to avoid collisions.
- The template will exceed 50 lines — extract to `tabs.html`.
- `FocusKeyManager` accepts `Signal<FocusableOption[]>` + `Injector` in its constructor. Build the signal from the content children, filtering out disabled tabs for the skip predicate.
- Cleanup: destroy `FocusKeyManager`, unsubscribe from scroll listeners, disconnect `ResizeObserver` via `DestroyRef.onDestroy()`.

## File structure

Create at `projects/ngx-tw/tabs/`:

- `tabs.ts` — `TabsComponent`, `TabComponent`, `TabTriggerDirective`, `TabContentDirective`, plus `TabsVariant` type
- `tabs.html` — external template for `TabsComponent`
- `tabs.spec.ts` — Vitest tests covering: default render with string labels, all three variants, all five sizes, horizontal/vertical orientation, active tab selection via click, keyboard navigation (arrow keys, Home, End), disabled tab skipping, closable tab close button + `closed` output, lazy content rendering, custom trigger template, fitted mode, scroll overflow buttons, ARIA roles/attributes (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`, `aria-orientation`), `[(value)]` two-way binding, focus management on tab close. No `fakeAsync` — use `async/await` with `fixture.whenStable()`.
- `index.ts` — exports `TabsComponent`, `TabComponent`, `TabTriggerDirective`, `TabContentDirective`, `TabsVariant`
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

Reference `TwColor` and `TwSize` from `ngx-tw/core`.

## Public API exports

From `projects/ngx-tw/tabs/index.ts`:
```typescript
export { TabsComponent, TabComponent, TabTriggerDirective, TabContentDirective } from './tabs';
export type { TabsVariant } from './tabs';
```

Add to `projects/ngx-tw/src/public-api.ts`:
```typescript
export * from 'ngx-tw/tabs';
```

## Constraints

- All conventions from CLAUDE.md apply. Key constraints for this component:
- `ChangeDetection.OnPush` on all components
- Signal-based APIs only: `input()`, `model()`, `output()`, `computed()`, `linkedSignal()`, `contentChildren()`, `contentChild()`
- `host` object for all host bindings — no `@HostBinding`/`@HostListener`
- No `@angular/animations` — use `animate.enter`/`animate.leave`
- No `fakeAsync`/`tick` in tests
- No raw palette colors — semantic tokens only
- No raw `neutral-*` — use surface/fg/border tokens
- Inline element padding scale and trigger font size scale from the Visual Design System
- `twMerge: true` and `defaultVariants` in all `tv()` configs
- JSDoc on every public `input()`, `output()`, and `model()`
- `FocusKeyManager` from CDK for keyboard navigation — do not reimplement
