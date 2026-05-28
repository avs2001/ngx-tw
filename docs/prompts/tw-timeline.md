# Prompt: Build `tw-timeline` for ngx-tw

## Context

Before writing code, read these files in full. The requirements doc is normative — when this prompt and the requirements doc disagree, the requirements doc wins, and you must surface the conflict in a comment rather than silently picking.

- `.claude/CLAUDE.md` — conventions, semantic tokens, focus-ring policy, animation rules, visual design system. Pay special attention to: typography rules (the `text-base` step is forbidden outside the codified `tw-item` lg exception — see Open question 1 below), icon sub-scales (`size-2`/`size-2.5`/`size-3` for dot indicators; `size-6` → `size-12` for circle markers), animation conventions (no `@angular/animations`; `animate.enter` references named CSS classes; keyframes live in the theme CSS), input cap (4 inputs on container, 5 inputs on item — both are hard caps).
- `docs/requirements/timeline.requirements.md` — **the source of truth**. Inputs, defaults, slot names, state matrix, RTL behavior, AXE expectations, and acceptance criteria all come from this document. Do not redesign the API.
- `projects/ngx-tw/stepper/stepper.ts` — closest peer. Copy the static class-lookup pattern verbatim (`INDICATOR_ACTIVE`, `INDICATOR_COMPLETED`, `CONNECTOR_REACHED`) — Tailwind v4 cannot resolve interpolated class names like `` `bg-${color}-solid` `` at build time, so the maps must be exhaustive `Record<TwColor, string>` lookups. Also study the stepper's `tv()` slot config for `stepConnector` / `stepIndicator` and how `orientation` flips the connector axis (`w-px` vertical → `h-px` horizontal), and the compound-variant thickness scaling for `lg`/`xl`.
- `projects/ngx-tw/item/item.ts` — slot-directive idiom for content projection (`twItemLeading` / `twItemTitle` / `twItemDescription` attribute directives). The timeline reuses this pattern for `twTimelineMarker` / `twTimelineTimestamp` / `twTimelineOpposite`. Also references `FocusMonitor` only if a future interactive variant lands — timeline v1 does **not** make the item focusable, so do not pull `FocusMonitor` in.
- `projects/ngx-tw/avatar/avatar.ts` — size-propagation-via-injection-token pattern (`AVATAR_GROUP_SIZE`). Apply the same idiom: the container defines `TIMELINE_CONTEXT` (an injection token surfacing `{ orientation, align, size, lineStyle, items }` as reactive getters); items inject it with `inject(TimelineComponent)` directly (mandatory — see Implementation notes). The avatar reference is the canonical example of `inject(ParentComponent)` propagating layout data via signals.
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`, `TwOrientation`. Do NOT add new shared types for the timeline. Color slot tokens (`*-solid`, `*-solid-fg`, `*-soft`, `*-border-strong`) are defined in `theme/_semantic.css` and consumed by the stepper — reuse them.
- `projects/ngx-tw/theme/_base.css` — animation keyframes live here, NOT in a separate `default.css`. The requirements doc says "`theme/default.css`" but the actual file in this repo is `theme/_base.css` (imported from `theme/index.css`). Add the `timeline-item-enter` keyframe alongside the existing `step-panel-enter-forward` / `toast-slide-*` blocks. Add the reduced-motion override to the existing `@media (prefers-reduced-motion: reduce)` block at the bottom of the file.

No CDK modules are required. Timeline is presentational only — no overlay, no focus trap, no live announcer, no keyboard handlers.

---

## What to build

A purely presentational layout primitive that renders a chronological sequence of events along a single axis. The container `<tw-timeline>` owns layout decisions (orientation, alignment, size, line style) and propagates them to children via dependency injection. Each `<tw-timeline-item>` styles its own marker and connector based on its `color`, `marker`, and `state` inputs, and reports its position back to the container so auto-numbering and first/last connector elision can be computed.

The component pair sits between `tw-stepper` (an interactive wizard with panels and form integration, owned by `CdkStepper`) and a plain ordered list. It deliberately does **not** install a keyboard map, does **not** trap focus, does **not** own panels or selection state, and the item host is **not** focusable. Consumers wanting row-level activation project an interactive primitive (`<tw-item interactive>`, `<button>`, an anchor) inside the default slot.

Scope decisions already locked by the requirements doc (do not revisit):

- Container input count = **4** (`orientation`, `align`, `size`, `lineStyle`). No more.
- Item input count = **5** (`color`, `marker`, `state`, `timestamp`, `dateTime`). No more — no `interactive`, no `dotted` per-item connector, no `stateLabel`.
- State strings are hardcoded English in v1 (`"Pending: "`, `"Current: "`, `"Error: "`). `TW_TIMELINE_I18N` is v1.5.
- The marker slot selector is `[twTimelineMarker]` (attribute) on whatever element the consumer wants. There is no `<tw-timeline-marker>` element.
- `align` is ignored when `orientation === 'horizontal'`.
- Standalone entry point `ngx-tw/timeline`.

---

## File layout

Create under `projects/ngx-tw/timeline/`:

| File | Role |
|---|---|
| `timeline.ts` | `TimelineComponent`, `TimelineItemComponent`, slot directives (`TimelineMarkerDirective`, `TimelineTimestampDirective`, `TimelineOppositeDirective`), `tv()` config, static color × state lookup maps. |
| `timeline.spec.ts` | Vitest suite — see Test plan. |
| `index.ts` | Re-exports the two components, the three slot directives, and any helper types. |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |

Modify (matching the `19d8193` `breadcrumbs / sheet / textarea` wiring pattern):

- `projects/ngx-tw/src/public-api.ts` — append `export * from 'ngx-tw/timeline';` (keep alphabetical-ish grouping; the file is currently grouped roughly by component family — the simplest placement is after `breadcrumbs`).
- `projects/ngx-tw/tsconfig.lib.json` — add `"timeline/**/*.ts"` to the `include` array.
- `projects/ngx-tw/tsconfig.spec.json` — add `"timeline/**/*.spec.ts"` to the `include` array.
- `angular.json` — add `"../timeline/**/*.spec.ts"` to `projects.ngx-tw.architect.test.options.include` (follow the `breadcrumbs/sheet` insertion shown in lines 143–159 of the existing file).
- `projects/ngx-tw/theme/_base.css` — add the `timeline-item-enter` keyframe + class (see Animation section below). Add the reduced-motion override to the existing `@media (prefers-reduced-motion: reduce)` block at the end of the file.

Do **not** create a `default.css` file. The requirements doc uses that name as a generic alias for the library's default theme stylesheet; in this repo the file is `_base.css`.

---

## Public API

### `TimelineComponent` — selector `tw-timeline`

Class name: `TimelineComponent` (no `Tw` prefix).

**Inputs (4 — hard cap):**

| Name | Type | Default | JSDoc (paste verbatim) |
|---|---|---|---|
| `orientation` | `TwOrientation` | `'vertical'` | `Axis along which items are laid out. 'vertical' stacks items top-to-bottom; 'horizontal' lays them out left-to-right (RTL-aware). Defaults to 'vertical'.` |
| `align` | `'left' \| 'right' \| 'alternate' \| 'split'` | `'left'` | `Vertical layout strategy. 'left' / 'right' place the marker on that side; 'alternate' centers the marker and flips the body left ↔ right per item; 'split' centers the marker with body on the right and the opposite slot on the left. Ignored when orientation is 'horizontal'. Defaults to 'left'.` |
| `size` | `TwSize` | `'md'` | `Density and typography scale. Controls marker diameter, gap between items, and body typography step. Defaults to 'md'.` |
| `lineStyle` | `'solid' \| 'dashed'` | `'solid'` | `Connector line style applied to every gap between items. Defaults to 'solid'.` |

**Outputs:** none. Item-level events bubble naturally — the container does not aggregate them.

**Host bindings (via `host` object):**

- `role`: `'list'` (static).
- `[attr.aria-orientation]`: `'horizontal'` when `orientation() === 'horizontal'`, `null` otherwise (vertical is implicit in list semantics).
- `[class]`: bound to a `rootClasses` computed signal that resolves the `tv()` `root` slot.
- Do **not** set `tabindex`.

**Internal API surface (not exported):**

- `items = contentChildren(TimelineItemComponent, { descendants: false })` — discovers projected children in DOM order.
- `getIndex(item: TimelineItemComponent): number` — used by items to compute their 1-based auto-number and to know whether they are first/last (for connector elision). Returns `-1` if not found; items must treat that as "not yet projected" and render no connector.
- `getTotal(): number` — `this.items().length`. Exposed so the item template can render `@if (index < total - 1)` for the trailing connector.

Both `getIndex` and `getTotal` are read by items inside `computed()` calls, so they must read signals (`this.items()`) — they cannot be plain methods that snapshot. Implement as `computed`-friendly getters or as helper signals exposed publicly on the container.

### `TimelineItemComponent` — selector `tw-timeline-item`

Class name: `TimelineItemComponent` (no `Tw` prefix).

**Inputs (5 — hard cap):**

| Name | Type | Default | JSDoc (paste verbatim) |
|---|---|---|---|
| `color` | `TwColor` | `'primary'` | `Semantic color for the marker fill and the trailing connector when the item is in a reached state. Ignored when state is 'error' (which forces the error palette). Defaults to 'primary'.` |
| `marker` | `'dot' \| 'circle'` | `'dot'` | `Marker geometry. 'dot' is a small filled circle. 'circle' is a larger ring that may contain a projected icon, avatar, or an auto-computed 1-based index. Defaults to 'dot'.` |
| `state` | `'reached' \| 'pending' \| 'current' \| 'error'` | `'reached'` | `Semantic state of the event. Drives marker fill, ring, and trailing-connector color, and applies aria-current="step" when 'current'. Defaults to 'reached'.` |
| `timestamp` | `string \| Date \| null` | `null` | `Timestamp shown in the timestamp slot. A Date is formatted via Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }); a string is rendered verbatim; null omits the timestamp element. Overridden by projected [twTimelineTimestamp] content when present. Defaults to null.` |
| `dateTime` | `string \| null` | `null` | `Machine-readable ISO 8601 datetime for the rendered <time datetime="…"> attribute. Derived from timestamp when it is a Date and this input is null; required (explicit) when timestamp is a string and machine-readability is desired. When null with a string timestamp, the timestamp renders as a <span> instead. Defaults to null.` |

**Outputs:** none. The decision recorded in requirements § 2.3 is that the item itself is not interactive in v1; row activation is owned by a projected interactive primitive.

**Host bindings (via `host` object):**

- `role`: `'listitem'` (static).
- `[attr.aria-current]`: `'step'` when `state() === 'current'`, `null` otherwise.
- `[class]`: bound to `rootClasses` (the `item` slot of the `tv()` config).
- `[animate.enter]`: bound to a `enterAnimationClass` computed that returns `'timeline-item-enter'` in vertical orientation and `'timeline-item-enter-horizontal'` in horizontal. See Animation section.
- Do **not** set `tabindex`. Do **not** set `(click)` / `(keydown)`.

**Slot directives:**

| Selector | Kind | Purpose |
|---|---|---|
| `[twTimelineMarker]` | Attribute marker directive | When `marker === 'circle'`, the projected element renders inside the marker bubble (icon, avatar, custom node). Ignored with a dev warning when `marker === 'dot'`. |
| `[twTimelineTimestamp]` | Attribute marker directive | Replaces the rendered `timestamp` / `dateTime` output. Use for relative-time components ("2 hours ago"). |
| `[twTimelineOpposite]` | Attribute marker directive | Content for the opposite side from the body. Rendered only when `align === 'alternate'` or `align === 'split'` and orientation is vertical. Ignored otherwise. |

Each directive is a pure marker — it captures presence via `contentChild(SelectorDirective)` on the item. They do **not** apply host classes; styling lives on the wrapper elements that the item template emits around them.

For the marker slot specifically: because it sits inside a `@switch (marker())` `'circle'` branch, the projected element is only rendered when `marker === 'circle'`. The dev warning for `marker === 'dot'` with marker-slot content projected must fire in `ngOnInit` (one-shot) and only when `ngDevMode` is true. Do **not** use an `effect()` for this — the warning should fire once, not re-fire on input changes, and it must not run in production.

---

## DOM structure

### Vertical, `align="left"` (default)

```html
<!-- host: <tw-timeline role="list" class="<rootClasses>"> -->
  <!-- host: <tw-timeline-item role="listitem" class="<itemClasses>"> -->
    <div class="<markerColClasses>">      <!-- marker column (fixed width based on size) -->
      <span class="<connectorLeadingClasses>" aria-hidden="true"></span>  <!-- omitted when isFirst() -->
      <div class="<markerClasses>" [attr.aria-label]="markerAriaLabel()">
        <!-- @switch (marker()) -->
        <!--   @case 'dot' { (empty — bubble only) } -->
        <!--   @case 'circle' {
                  @if (hasMarkerSlot()) { <ng-content select="[twTimelineMarker]" /> }
                  @else if (state() === 'error') { <svg class="size-4"><!-- inline exclamation glyph --></svg> }
                  @else { <span class="<numberClasses>">{{ index() + 1 }}</span> }
                } -->
      </div>
      <span class="<connectorTrailingClasses>" aria-hidden="true"></span>  <!-- omitted when isLast() -->
    </div>
    <div class="<bodyClasses>">
      <span class="sr-only">{{ stateLabel() }}</span>  <!-- "Pending: " / "Current: " / "Error: " ; nothing for 'reached' -->
      @if (hasTimestampSlot()) {
        <ng-content select="[twTimelineTimestamp]" />
      } @else if (timestamp() !== null) {
        @if (resolvedDateTime() !== null) {
          <time [attr.datetime]="resolvedDateTime()" class="<timestampClasses>">{{ formattedTimestamp() }}</time>
        } @else {
          <span class="<timestampClasses>">{{ formattedTimestamp() }}</span>
        }
      }
      <ng-content />
    </div>
  <!-- /tw-timeline-item -->
  …more items…
<!-- /tw-timeline -->
```

### Vertical, `align="alternate"` / `align="split"`

The item template emits a third column for the opposite slot. When `[twTimelineOpposite]` is not projected, the column still renders as an empty placeholder of the same `min-width` so the marker column stays centered. Order in DOM: opposite | marker-col | body. For `align="alternate"`, odd items flip body and opposite in the rendered visual via flex `order` utilities or by swapping classes; do **not** physically reorder the DOM — reading order must remain consistent.

### Horizontal

```html
<!-- host: <tw-timeline role="list" aria-orientation="horizontal" class="flex flex-row ..."> -->
  <!-- host: <tw-timeline-item role="listitem" class="flex flex-col items-center ..."> -->
    <div class="<bodyClasses>">…body above the marker row…</div>
    <div class="<markerRowClasses>">
      <span class="<connectorLeadingClasses>" aria-hidden="true"></span>
      <div class="<markerClasses>">…</div>
      <span class="<connectorTrailingClasses>" aria-hidden="true"></span>
    </div>
  <!-- /tw-timeline-item -->
<!-- /tw-timeline -->
```

The connector strategy is **per-item trailing connector with first/last suppression**. The leading connector is emitted only when `isFirst() === false`; the trailing connector is emitted only when `isLast() === false`. The alternative (a single container-emitted line between items) was considered but rejected because it requires the container to render its own template loop over `items()` rather than projecting children — and content projection of arbitrary `<tw-timeline-item>` is the documented API. Per-item connectors keep DOM emission co-located with the item that "owns" them.

---

## `tv()` variant plan

Single `tv()` config in `timeline.ts`, `twMerge: true`, slot-based. The config covers both the container (`root`) and the item (`item`, `markerCol`, `markerRow`, `marker`, `connectorLeading`, `connectorTrailing`, `body`, `opposite`, `number`, `timestamp`). One config — not two — so that compound variants on `orientation × size` and `align × orientation` can target both layers from one place.

```ts
const timelineVariants = tv({
  slots: {
    // Container (the <tw-timeline> host)
    root: 'flex',
    // Item host
    item: 'relative flex min-w-0',
    // Marker column / row wrapper
    markerCol: 'relative flex flex-col items-center shrink-0',
    markerRow: 'relative flex flex-row items-center shrink-0',
    // The bubble that holds the dot/circle. Color/state styling is applied via static lookup, not tv().
    marker:
      'relative z-[1] inline-flex items-center justify-center shrink-0 rounded-full transition-[color,background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none',
    // Connectors — base layout; color is applied via static lookup.
    connectorLeading: 'shrink-0',
    connectorTrailing: 'shrink-0',
    // Body wrapper next to the marker.
    body: 'min-w-0 flex-1 flex flex-col',
    // Opposite slot wrapper (alternate / split only).
    opposite: 'min-w-0 flex flex-col',
    // The auto-number / projected-content slot inside a circle marker.
    number: 'leading-none font-semibold',
    // The timestamp element (whether <time> or <span>).
    timestamp: 'text-fg-muted',
  },
  variants: {
    orientation: {
      vertical: {
        root: 'flex-col',
        item: 'flex-row items-start',
        // The marker column is the lane that contains the bubble plus the two connector segments.
        // The leading / trailing connector classes carry the line geometry below.
      },
      horizontal: {
        root: 'flex-row items-start overflow-x-auto',
        item: 'flex-col items-center text-center',
      },
    },
    align: {
      left:      { /* default — marker on the left of body; opposite slot ignored */ },
      right:     { item: 'flex-row-reverse' },
      alternate: { /* odd vs even handled via compound variants below */ },
      split:     { /* opposite | marker | body — see compound variant below */ },
    },
    size: {
      xs: { item: 'gap-3', body: 'text-xs gap-1', timestamp: 'text-2xs', number: 'text-2xs' },
      sm: { item: 'gap-4', body: 'text-sm gap-1', timestamp: 'text-xs', number: 'text-xs' },
      md: { item: 'gap-5', body: 'text-sm gap-1.5', timestamp: 'text-xs', number: 'text-xs' },
      lg: { item: 'gap-6', body: 'text-sm gap-1.5', timestamp: 'text-xs', number: 'text-sm' },
      xl: { item: 'gap-8', body: 'text-sm gap-2', timestamp: 'text-xs', number: 'text-sm' },
    },
    marker: {
      dot:    { /* size-* applied via size × marker compound below */ },
      circle: { /* size-* applied via size × marker compound below */ },
    },
    lineStyle: {
      solid:  { /* base bg-* class applied via static state lookup */ },
      dashed: {
        // Dashed connectors use border-dashed instead of a solid bg fill. The
        // base `connectorLeading`/`connectorTrailing` classes still apply.
        connectorLeading:  'border-dashed bg-transparent',
        connectorTrailing: 'border-dashed bg-transparent',
      },
    },
    state: {
      // State drives the visually-hidden state-label only via a separate computed;
      // marker/connector color is applied via static lookups. The tv() axis exists
      // here so compound variants like `state: 'pending', marker: 'circle'` can
      // target the auto-number's muted color without recomputing the lookup table.
      reached: { number: 'text-fg' },
      pending: { number: 'text-fg-muted' },
      current: { number: 'text-fg' },
      error:   { number: 'text-fg' /* svg replaces number entirely */ },
    },
  },
  compoundVariants: [
    // Marker geometry per size × marker variant (per requirements § 4.3)
    { marker: 'dot',    size: 'xs', class: { marker: 'size-2' } },
    { marker: 'dot',    size: 'sm', class: { marker: 'size-2.5' } },
    { marker: 'dot',    size: 'md', class: { marker: 'size-3' } },
    { marker: 'dot',    size: 'lg', class: { marker: 'size-3' } },
    { marker: 'dot',    size: 'xl', class: { marker: 'size-3' } },
    { marker: 'circle', size: 'xs', class: { marker: 'size-6' } },
    { marker: 'circle', size: 'sm', class: { marker: 'size-7' } },
    { marker: 'circle', size: 'md', class: { marker: 'size-8' } },
    { marker: 'circle', size: 'lg', class: { marker: 'size-10' } },
    { marker: 'circle', size: 'xl', class: { marker: 'size-12' } },

    // Vertical connector geometry — line lives inside the marker column,
    // running through the bubble. `w-px` is the default; lg/xl thicken to `w-0.5`.
    {
      orientation: 'vertical', lineStyle: 'solid',
      class: { connectorLeading: 'w-px flex-1 -mb-px', connectorTrailing: 'w-px flex-1 -mt-px' },
    },
    {
      orientation: 'vertical', lineStyle: 'dashed',
      class: { connectorLeading: 'border-l flex-1', connectorTrailing: 'border-l flex-1' },
    },
    {
      orientation: 'vertical', size: 'lg', lineStyle: 'solid',
      class: { connectorLeading: 'w-0.5', connectorTrailing: 'w-0.5' },
    },
    {
      orientation: 'vertical', size: 'xl', lineStyle: 'solid',
      class: { connectorLeading: 'w-0.5', connectorTrailing: 'w-0.5' },
    },

    // Horizontal connector geometry
    {
      orientation: 'horizontal', lineStyle: 'solid',
      class: { connectorLeading: 'h-px flex-1 -mr-px', connectorTrailing: 'h-px flex-1 -ml-px' },
    },
    {
      orientation: 'horizontal', lineStyle: 'dashed',
      class: { connectorLeading: 'border-t flex-1', connectorTrailing: 'border-t flex-1' },
    },
    {
      orientation: 'horizontal', size: 'lg', lineStyle: 'solid',
      class: { connectorLeading: 'h-0.5', connectorTrailing: 'h-0.5' },
    },
    {
      orientation: 'horizontal', size: 'xl', lineStyle: 'solid',
      class: { connectorLeading: 'h-0.5', connectorTrailing: 'h-0.5' },
    },
  ],
  defaultVariants: {
    orientation: 'vertical',
    align: 'left',
    size: 'md',
    marker: 'dot',
    state: 'reached',
    lineStyle: 'solid',
  },
}, { twMerge: true });
```

Notes:

- `xl` density uses `text-sm` for the body **not** `text-base`. The requirements doc (§ 4.3) permits `text-base` for `xl` if the codified exception applies. **It does not apply to timeline.** Stay at `text-sm` — see Interpretations applied below.
- `text-2xs` is used at `xs` density for timestamp + number (CLAUDE.md permits this — it is the canonical step below `text-xs`).
- `lineStyle="dashed"` switches the connector from a `bg-*` background fill to a CSS `border-l` / `border-t`. Color is then applied via `border-<color>-border-strong` in the lookup map (see below) instead of `bg-<color>-border-strong`. The `tv()` config strips the base `bg-*` via `bg-transparent` so `twMerge` doesn't union both.
- `align="alternate"` and `align="split"` are NOT fully encoded in the `tv()` config — they require per-item conditional class application (odd vs even). Handle this in the item's `[class]` host binding by switching `bodyClasses` / `oppositeClasses` based on `index() % 2 === 0` (`alternate`) or `align() === 'split'` plus orientation. Keep the `tv()` config focused on the static parts.
- The `state` axis appears in both the `tv()` config (for the auto-number text color) and in the static lookup tables (for the marker fill / connector color). This is intentional — the tv() axis handles purely typographic state styling that doesn't need to vary by color, while the static maps handle color × state combinations Tailwind can't interpolate. If the implementer wonders why state appears in two places, the answer is: by design.

---

## Static color × state class lookups

Tailwind v4 only resolves statically-written class names. Per the stepper precedent (`INDICATOR_ACTIVE`, `INDICATOR_COMPLETED`, `CONNECTOR_REACHED`), all color × state combinations must be enumerated as exhaustive maps. Copy the stepper's structure exactly.

```ts
type TimelineMarkerStyleState = 'reached' | 'pending' | 'current' | 'error';

// ── Marker fill: dot or circle bubble background + border + (current) halo ring.

const MARKER_PENDING = 'bg-surface border-2 border-border text-fg-muted';
const MARKER_ERROR = 'bg-error-solid text-error-solid-fg border border-error-border-strong';

const MARKER_REACHED: Record<TwColor, string> = {
  primary:   'bg-primary-solid text-primary-solid-fg border border-primary-border-strong',
  secondary: 'bg-secondary-solid text-secondary-solid-fg border border-secondary-border-strong',
  accent:    'bg-accent-solid text-accent-solid-fg border border-accent-border-strong',
  neutral:   'bg-neutral-solid text-neutral-solid-fg border border-neutral-border-strong',
  info:      'bg-info-solid text-info-solid-fg border border-info-border-strong',
  success:   'bg-success-solid text-success-solid-fg border border-success-border-strong',
  warning:   'bg-warning-solid text-warning-solid-fg border border-warning-border-strong',
  error:     'bg-error-solid text-error-solid-fg border border-error-border-strong',
};

const MARKER_CURRENT: Record<TwColor, string> = {
  primary:   'bg-primary-solid text-primary-solid-fg border border-primary-border-strong ring-4 ring-primary-soft',
  secondary: 'bg-secondary-solid text-secondary-solid-fg border border-secondary-border-strong ring-4 ring-secondary-soft',
  accent:    'bg-accent-solid text-accent-solid-fg border border-accent-border-strong ring-4 ring-accent-soft',
  neutral:   'bg-neutral-solid text-neutral-solid-fg border border-neutral-border-strong ring-4 ring-neutral-soft',
  info:      'bg-info-solid text-info-solid-fg border border-info-border-strong ring-4 ring-info-soft',
  success:   'bg-success-solid text-success-solid-fg border border-success-border-strong ring-4 ring-success-soft',
  warning:   'bg-warning-solid text-warning-solid-fg border border-warning-border-strong ring-4 ring-warning-soft',
  error:     'bg-error-solid text-error-solid-fg border border-error-border-strong ring-4 ring-error-soft',
};

// When marker='circle' and a `[twTimelineMarker]` slot is projected, the bubble
// uses the SOFT background so the projected glyph/avatar reads against a tinted
// surface rather than competing with a solid fill. Stepper analogue: when a
// custom icon template overrides the number, the indicator stays SOLID — but
// stepper's icon templates are sized to sit against `*-solid-fg`. Timeline's
// projected content (often `<tw-icon>`, `<tw-avatar>`) is sized for SOFT.
const MARKER_REACHED_SOFT: Record<TwColor, string> = {
  primary:   'bg-primary-soft text-primary-fg border border-primary-border-strong',
  secondary: 'bg-secondary-soft text-secondary-fg border border-secondary-border-strong',
  accent:    'bg-accent-soft text-accent-fg border border-accent-border-strong',
  neutral:   'bg-surface-muted text-fg border border-border',
  info:      'bg-info-soft text-info-fg border border-info-border-strong',
  success:   'bg-success-soft text-success-fg border border-success-border-strong',
  warning:   'bg-warning-soft text-warning-fg border border-warning-border-strong',
  error:     'bg-error-soft text-error-fg border border-error-border-strong',
};

const MARKER_CURRENT_SOFT: Record<TwColor, string> = {
  primary:   'bg-primary-soft text-primary-fg border border-primary-border-strong ring-4 ring-primary-soft',
  secondary: 'bg-secondary-soft text-secondary-fg border border-secondary-border-strong ring-4 ring-secondary-soft',
  accent:    'bg-accent-soft text-accent-fg border border-accent-border-strong ring-4 ring-accent-soft',
  neutral:   'bg-surface-muted text-fg border border-border ring-4 ring-border',
  info:      'bg-info-soft text-info-fg border border-info-border-strong ring-4 ring-info-soft',
  success:   'bg-success-soft text-success-fg border border-success-border-strong ring-4 ring-success-soft',
  warning:   'bg-warning-soft text-warning-fg border border-warning-border-strong ring-4 ring-warning-soft',
  error:     'bg-error-soft text-error-fg border border-error-border-strong ring-4 ring-error-soft',
};

// ── Trailing connector color: state of the LEADING item drives the line that
// runs to the next item. See requirements § 4.5: 'current' MUST NOT tint the
// trailing connector (subsequent items have not been reached yet).

const CONNECTOR_DEFAULT = 'bg-border';
const CONNECTOR_ERROR = 'bg-error-border-strong';
const CONNECTOR_DASHED_DEFAULT = 'border-border';
const CONNECTOR_DASHED_ERROR = 'border-error-border-strong';

const CONNECTOR_REACHED: Record<TwColor, string> = {
  primary:   'bg-primary-border-strong',
  secondary: 'bg-secondary-border-strong',
  accent:    'bg-accent-border-strong',
  neutral:   'bg-neutral-border-strong',
  info:      'bg-info-border-strong',
  success:   'bg-success-border-strong',
  warning:   'bg-warning-border-strong',
  error:     'bg-error-border-strong',
};

const CONNECTOR_DASHED_REACHED: Record<TwColor, string> = {
  primary:   'border-primary-border-strong',
  secondary: 'border-secondary-border-strong',
  accent:    'border-accent-border-strong',
  neutral:   'border-neutral-border-strong',
  info:      'border-info-border-strong',
  success:   'border-success-border-strong',
  warning:   'border-warning-border-strong',
  error:     'border-error-border-strong',
};

function resolveMarkerClasses(
  state: TimelineMarkerStyleState,
  color: TwColor,
  hasMarkerSlot: boolean,
): string {
  // hasMarkerSlot is only meaningful when marker === 'circle'; the dot variant
  // always renders the bubble itself with no inner content.
  switch (state) {
    case 'pending': return MARKER_PENDING;
    case 'error':   return MARKER_ERROR;
    case 'reached': return hasMarkerSlot ? MARKER_REACHED_SOFT[color] : MARKER_REACHED[color];
    case 'current': return hasMarkerSlot ? MARKER_CURRENT_SOFT[color] : MARKER_CURRENT[color];
  }
}

function resolveConnectorClasses(
  state: TimelineMarkerStyleState,
  color: TwColor,
  lineStyle: 'solid' | 'dashed',
): string {
  if (lineStyle === 'dashed') {
    if (state === 'error') return CONNECTOR_DASHED_ERROR;
    if (state === 'reached') return CONNECTOR_DASHED_REACHED[color];
    return CONNECTOR_DASHED_DEFAULT; // pending or current
  }
  if (state === 'error') return CONNECTOR_ERROR;
  if (state === 'reached') return CONNECTOR_REACHED[color];
  return CONNECTOR_DEFAULT; // pending or current
}
```

Wiring inside the item:

- `markerClasses = computed(() => `${this._tv().marker()} ${resolveMarkerClasses(this.state(), this.resolvedColor(), this.hasMarkerSlot())}`)`.
- `connectorTrailingClasses = computed(() => `${this._tv().connectorTrailing()} ${resolveConnectorClasses(this.state(), this.resolvedColor(), this.timeline.lineStyle())}`)`.
- `connectorLeadingClasses = computed(() => ...)` — the leading connector takes its color from the **previous** item's state. Implementing that requires the container's `items()` array. Either expose `getPreviousItem(item)` on the container, or expose a `leadingConnectorState/leadingConnectorColor` signal on each item that reads `this.timeline.items()[this.index() - 1]` if present. Prefer the latter — keeps logic local.
- `resolvedColor = computed(() => this.state() === 'error' ? 'error' : this.color())`. Error overrides color per § 2.3.

---

## Animation

Add to `projects/ngx-tw/theme/_base.css`, alongside the existing `step-panel-enter-forward` block (around line 214):

```css
/* ── Timeline — item enter ── */

@keyframes timeline-item-enter {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}
.timeline-item-enter {
  animation: timeline-item-enter 200ms ease-out;
}

@keyframes timeline-item-enter-horizontal {
  from { opacity: 0; transform: translateX(-4px); }
  to   { opacity: 1; transform: none; }
}
.timeline-item-enter-horizontal {
  animation: timeline-item-enter-horizontal 200ms ease-out;
}
```

Add to the existing `@media (prefers-reduced-motion: reduce)` block at the bottom of the file (around line 320):

```css
.timeline-item-enter,
.timeline-item-enter-horizontal {
  animation-duration: 0ms;
  transform: none;
}
```

Wire on the item host:

```ts
// Inside TimelineItemComponent
readonly enterAnimationClass = computed(() =>
  this.timeline.orientation() === 'horizontal'
    ? 'timeline-item-enter-horizontal'
    : 'timeline-item-enter',
);

// host:
//   '[animate.enter]': 'enterAnimationClass()'
```

`animate.enter` is a compiler-level feature (Angular v17.1+, native in v21). It accepts the class name as a string and applies it on DOM entry; Angular removes the class once `animationend` fires. No `@angular/animations` import.

No leave animation — items disappear instantly when removed. (Per requirements § 6.2: no reorder animations.)

---

## Accessibility

Recap of requirements § 5 — the implementation must satisfy all of these. Do not invent additions beyond what is listed.

- **Container** carries `role="list"`. `aria-orientation="horizontal"` is set ONLY when `orientation === 'horizontal'`; vertical is the implicit list direction. Container is **not** focusable (no `tabindex`).
- **Item** carries `role="listitem"`. `aria-current="step"` is applied only when `state === 'current'`. Item is **not** focusable.
- **Marker bubble** is `aria-hidden="true"` when the item already carries a textual equivalent inside the body (the default case — the body holds the visible event description). The marker only loses `aria-hidden` and gains an `aria-label` (e.g., `"Current"`) when the consumer projects no body text — but this is a degenerate case the component does not actively support in v1. **Simplification**: in v1, the marker is always `aria-hidden="true"`. State is conveyed exclusively via the visually-hidden state-label span inside the body (see next bullet) and via `aria-current="step"`.
- **Visually-hidden state label** sits as the first child inside the body wrapper:
  - `reached` → render no extra element (default state needs no announcement).
  - `pending` → `<span class="sr-only">Pending: </span>`.
  - `current` → `<span class="sr-only">Current: </span>`. Combined with the `aria-current="step"` on the item host, this gives AT both a label and a programmatic indicator.
  - `error` → `<span class="sr-only">Error: </span>`.

  Hardcoded English in v1. `TW_TIMELINE_I18N` is deferred (requirements § 11.2).
- **Timestamp** renders as `<time datetime="…">` when `dateTime()` or a `Date`-typed `timestamp()` resolves to an ISO-8601 string. Otherwise a `<span>`. Use the existing `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` for `Date`-typed values; no library import required.
- **No keyboard map.** Container does not install a key handler; item does not install a key handler. Projected interactive children participate in the document tab order normally. This is a deliberate departure from `tw-stepper` — document it in JSDoc on `TimelineComponent`.
- **AXE conformance.** Zero violations on the demo pages at default configuration. Demo pages MUST carry an `<h1>` and proper landmarks so the AXE harness can run.

---

## Implementation notes

**Angular conventions (recap from CLAUDE.md, applied here):**

- Standalone components — do NOT set `standalone: true` (v21 default).
- `ChangeDetection.OnPush` on both components and on the three slot directives.
- `host` object for all host bindings — never `@HostBinding`, never `@HostListener`.
- `inject()` for DI — no constructor injection.
- Signal-based inputs (`input()` / `input.required()`). No `model()` is needed — the parent does not need `[(prop)]` two-way binding for any input.
- `computed()` for all derived state. **Never** `linkedSignal()` — there is no writable derived state.
- Native control flow (`@if`, `@for`, `@switch`). No `ngClass`, no `ngStyle`, no `*ngFor`, no `*ngIf`.

**Auto-numbering.**

- The container exposes `items = contentChildren(TimelineItemComponent, { descendants: false })`. The `descendants: false` is important — nested timelines are explicitly not supported (requirements § 1.3), and `descendants: false` ensures items inside any future nested timeline (or inside a projected `<tw-item>`) are not double-counted.
- Each item computes `index = computed(() => this.timeline.items().indexOf(this))`. Returns `-1` until the container's `contentChildren` has materialised (typically by the first change-detection cycle after view init). Render the body with `{{ index() + 1 }}` — `-1 + 1 === 0` is harmless during the first paint; the value re-renders correctly on the next CD.
- `isFirst = computed(() => this.index() === 0)`. `isLast = computed(() => this.index() === this.timeline.items().length - 1)`. Both must be defensive: a `-1` index means "no signal yet" → return `false` for both (so connectors render and elide once the index resolves).
- **Do not** use an `effect()` to write the index into a signal on the item. Reads are pull-based via the parent's `contentChildren` signal — that is sufficient for OnPush change detection and avoids the "side-effecting writes inside an effect" anti-pattern.

**Container injection (mandatory, not optional).**

The item injects the container directly: `private readonly timeline = inject(TimelineComponent)`. **No `{ optional: true }`.** A `<tw-timeline-item>` outside a `<tw-timeline>` is a programmer error — let the DI failure throw with the native Angular error rather than silently degrading. This matches the contract of `CdkStep`, `CdkAccordionItem`, and similar parent-child relationships in CDK.

**Slot detection.**

Three slot directives are pure marker directives. Detection inside the item:

```ts
readonly markerSlot = contentChild(TimelineMarkerDirective);
readonly timestampSlot = contentChild(TimelineTimestampDirective);
readonly oppositeSlot = contentChild(TimelineOppositeDirective);

readonly hasMarkerSlot = computed(() => !!this.markerSlot());
readonly hasTimestampSlot = computed(() => !!this.timestampSlot());
readonly hasOppositeSlot = computed(() => !!this.oppositeSlot());
```

The template emits a normal `<ng-content select="[twTimelineMarker]" />` etc. — the directive is only used to detect presence, not to capture a template (the slot content is real DOM, not an `<ng-template>`).

**Dev warning for marker slot with `marker="dot"`.**

```ts
ngOnInit(): void {
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    if (this.marker() === 'dot' && this.hasMarkerSlot()) {
      console.warn(
        '[tw-timeline-item] [twTimelineMarker] content is ignored when marker="dot". ' +
        'Set marker="circle" to render projected marker content.',
      );
    }
  }
}
```

One-shot in `ngOnInit`. **Not** an `effect()` — the warning should fire once at mount, not re-fire on every input change. Production builds (`ngDevMode === false`) MUST NOT log. The `typeof` guard is required because `ngDevMode` is a global that may be undefined depending on build tooling.

**Connector strategy: per-item trailing.**

Each item emits its own leading and trailing connector spans inside the marker column/row. The container does not emit anything between items. First-item leading connector is conditionally omitted via `@if (!isFirst())`. Last-item trailing connector is omitted via `@if (!isLast())`. This trade-off is documented because the alternative (container-emitted line between items via `@for (item of items(); track item)`) was rejected: it would force the container to render its own template loop instead of projecting children, breaking the documented `<tw-timeline><tw-timeline-item>…</tw-timeline-item></tw-timeline>` consumer API.

**Orientation handling.**

Vertical and horizontal are the same component (`TimelineComponent` + `TimelineItemComponent`) — orientation is a `tv()` variant axis, not separate components. The item's template uses two top-level branches:

```html
@if (timeline.orientation() === 'vertical') {
  <!-- vertical layout: marker column on side, body flex-row -->
} @else {
  <!-- horizontal layout: marker row below or above, body flex-col -->
}
```

Keep both branches in the same template — duplicates a small amount of slot markup but avoids a per-orientation sub-component.

**RTL.**

All horizontal spacing uses logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`). No `ml-*`/`mr-*`/`pl-*`/`pr-*` in container or marker column. Tailwind v4's logical-property utilities handle the `dir="rtl"` flip automatically — no `rtl:` variant needed for layout. (`rtl:rotate-180` may be needed on directional glyphs inside projected content, but that is the consumer's concern.)

**Two-column vs three-column layouts.**

- `align="left"` / `align="right"`: two-column layout (marker | body or body | marker).
- `align="alternate"` / `align="split"`: three-column layout (opposite | marker | body), with the body and opposite columns having `min-w-0 flex-1` and the same minimum width applied symmetrically so the marker stays centered. When `[twTimelineOpposite]` is not projected on a given item, the opposite column still emits an empty placeholder.
- For `align="alternate"`, the visual flip on odd vs even items uses CSS `order` utilities (`md:order-1` / `md:order-2` style), not DOM reordering — reading order in the source must remain consistent for AT.

**OnPush + signal reactivity.**

- `contentChildren` returns a signal — reads in `computed()` are reactive automatically.
- The container's `items()` signal updates when items are projected/removed; the item's `index`, `isFirst`, `isLast`, and connector classes all recompute downstream.
- No manual `markForCheck` calls anywhere.

---

## Usage examples

Activity feed (canonical):

```html
<tw-timeline>
  @for (event of events; track event.id) {
    <tw-timeline-item
      [color]="event.color"
      [timestamp]="event.at"
      [dateTime]="event.at.toISOString()"
    >
      <p class="text-sm">
        <strong>{{ event.actor }}</strong> {{ event.verb }} {{ event.target }}
      </p>
    </tw-timeline-item>
  }
</tw-timeline>
```

Order tracking (state machine + projected icons):

```html
<tw-timeline>
  <tw-timeline-item marker="circle" color="success" state="reached" timestamp="Mar 14, 09:02">
    <tw-icon twTimelineMarker name="check" />
    <p class="text-sm font-semibold">Order placed</p>
    <p class="text-xs text-fg-muted">Confirmation #4A82-19</p>
  </tw-timeline-item>

  <tw-timeline-item marker="circle" color="success" state="reached" timestamp="Mar 15, 11:14">
    <tw-icon twTimelineMarker name="package" />
    <p class="text-sm font-semibold">Shipped</p>
  </tw-timeline-item>

  <tw-timeline-item marker="circle" color="primary" state="current" timestamp="Mar 17, in transit">
    <tw-icon twTimelineMarker name="truck" />
    <p class="text-sm font-semibold">Out for delivery</p>
  </tw-timeline-item>

  <tw-timeline-item marker="circle" color="neutral" state="pending">
    <tw-icon twTimelineMarker name="home" />
    <p class="text-sm text-fg-muted">Delivered</p>
  </tw-timeline-item>
</tw-timeline>
```

Alternating roadmap:

```html
<tw-timeline align="alternate">
  <tw-timeline-item marker="circle" color="primary" state="reached">
    <span twTimelineOpposite class="text-sm font-semibold">Q1 2026</span>
    <p class="text-sm font-semibold">Auth rewrite</p>
    <p class="text-xs text-fg-muted">Moved to OAuth 2.1, retired legacy tokens.</p>
  </tw-timeline-item>

  <tw-timeline-item marker="circle" color="primary" state="current">
    <span twTimelineOpposite class="text-sm font-semibold">Q2 2026</span>
    <p class="text-sm font-semibold">Mobile beta</p>
  </tw-timeline-item>

  <tw-timeline-item marker="circle" color="neutral" state="pending">
    <span twTimelineOpposite class="text-sm font-semibold">Q3 2026</span>
    <p class="text-sm text-fg-muted">Enterprise pilot</p>
  </tw-timeline-item>
</tw-timeline>
```

Compact audit log with avatars:

```html
<tw-timeline size="sm">
  @for (entry of auditLog; track entry.id) {
    <tw-timeline-item marker="circle" color="neutral" [timestamp]="entry.at">
      <tw-avatar twTimelineMarker [src]="entry.actor.avatarUrl" size="sm" />
      <p class="text-sm">
        <strong>{{ entry.actor.name }}</strong> {{ entry.action }}
      </p>
    </tw-timeline-item>
  }
</tw-timeline>
```

Horizontal event ribbon:

```html
<tw-timeline orientation="horizontal" size="sm">
  <tw-timeline-item marker="circle" color="success" state="reached" timestamp="10:02">
    <p class="text-xs font-medium">Departed</p>
  </tw-timeline-item>
  <tw-timeline-item marker="circle" color="success" state="reached" timestamp="10:45">
    <p class="text-xs font-medium">Hub A</p>
  </tw-timeline-item>
  <tw-timeline-item marker="circle" color="primary" state="current" timestamp="11:30">
    <p class="text-xs font-medium">In transit</p>
  </tw-timeline-item>
  <tw-timeline-item marker="circle" color="neutral" state="pending">
    <p class="text-xs font-medium">Delivery</p>
  </tw-timeline-item>
</tw-timeline>
```

Custom timestamp template (relative-time):

```html
<tw-timeline>
  <tw-timeline-item color="info">
    <span twTimelineTimestamp class="text-xs text-fg-muted">2 hours ago</span>
    <p class="text-sm">User logged in.</p>
  </tw-timeline-item>
</tw-timeline>
```

Interactive item (consumer-owned activation):

```html
<tw-timeline>
  <tw-timeline-item color="primary" state="reached">
    <tw-item interactive (selected)="openDetails(entry)">
      <span twItemTitle>Build #4821 completed</span>
      <span twItemDescription>Deployed to staging in 4m 12s.</span>
    </tw-item>
  </tw-timeline-item>
</tw-timeline>
```

Dashed connector:

```html
<tw-timeline lineStyle="dashed">
  <tw-timeline-item color="primary" state="reached">…</tw-timeline-item>
  <tw-timeline-item color="primary" state="current">…</tw-timeline-item>
  <tw-timeline-item color="neutral" state="pending">…</tw-timeline-item>
</tw-timeline>
```

---

## Test plan (`timeline.spec.ts`)

Vitest. No `fakeAsync` / `tick`. Use `async/await` with `fixture.whenStable()` where needed. Set inputs via `fixture.componentRef.setInput()`.

**Container rendering**
- [ ] Empty container: mounts with `role="list"`, no items, no warnings, no connector elements.
- [ ] Each `orientation` value (`vertical`, `horizontal`) renders without errors. Horizontal applies `aria-orientation="horizontal"`; vertical does not set the attribute.
- [ ] Each `align` value (`left`, `right`, `alternate`, `split`) in vertical orientation renders without errors. (Snapshot the root class set per `align`.)
- [ ] Each `size` value (`xs`, `sm`, `md`, `lg`, `xl`) applies the expected gap class.
- [ ] Each `lineStyle` value (`solid`, `dashed`) renders the expected connector class (assert `bg-*` for solid, `border-l`/`border-t` for dashed).

**Item rendering**
- [ ] Default item: `role="listitem"`, `aria-current` absent, `marker="dot"`, `state="reached"`, no timestamp emitted.
- [ ] Each `marker` value (`dot`, `circle`) renders the correct geometry class per size (e.g., `marker="dot"` × `size="md"` → `size-3`).
- [ ] Each `state` value:
  - `reached` → no visually-hidden label.
  - `pending` → `<span class="sr-only">Pending: </span>` present; marker carries `MARKER_PENDING` classes.
  - `current` → `aria-current="step"` on item host; `<span class="sr-only">Current: </span>` present.
  - `error` → `<span class="sr-only">Error: </span>` present; marker carries error palette regardless of `color` input.
- [ ] Each `color` × `state` combination: assert the resolved marker class string contains the right `bg-<color>-*` / `text-<color>-*` / `border-<color>-*` tokens (lightweight `.includes()` checks; do not snapshot full lists).
- [ ] `timestamp` as a `Date`: renders `<time>` element with `datetime` attribute equal to `date.toISOString()` and visible text matching the `Intl.DateTimeFormat` output.
- [ ] `timestamp` as a string with `dateTime=null`: renders a `<span>`, not `<time>`, with verbatim text.
- [ ] `timestamp` as a string with `dateTime` provided: renders `<time datetime>` with the explicit ISO string.
- [ ] `timestamp=null`: no timestamp element emitted (no `<time>`, no `<span class="…timestamp…">`).

**Content projection**
- [ ] `[twTimelineMarker]` projection + `marker="circle"`: projected element renders inside the marker bubble; the auto-number is not rendered.
- [ ] `[twTimelineMarker]` projection + `marker="dot"`: projected element is NOT rendered (the slot is inside the `'circle'` `@switch` case). `console.warn` is called once with a message matching `/twTimelineMarker.+marker="dot"/`. Use `vi.spyOn(console, 'warn')`.
- [ ] `[twTimelineTimestamp]` projection: replaces the rendered `timestamp` / `<time>` output regardless of `timestamp()` / `dateTime()` values.
- [ ] `[twTimelineOpposite]` projection + `align="alternate"`: renders in the opposite column.
- [ ] `[twTimelineOpposite]` projection + `align="left"`: NOT rendered (opposite column is omitted entirely in left/right alignment).
- [ ] `[twTimelineOpposite]` projection + `orientation="horizontal"`: NOT rendered.
- [ ] Default-slot content (`<p>{{ event }}</p>`) renders inside the body wrapper.

**Auto-numbering**
- [ ] Three items, `marker="circle"`, no projected marker content: rendered numbers are `1`, `2`, `3`.
- [ ] Adding a fourth item at runtime increments to `4`. (Use a host component with `@for` over a signal array; mutate the array, call `fixture.detectChanges()`, then read the new number from the DOM.)
- [ ] Removing the middle item re-numbers: `1`, `2`, `3` (was `1`, `2`, `3`, `4`).
- [ ] Items with projected `[twTimelineMarker]`: the auto-number is not rendered, but subsequent items' indices reflect their DOM position (numbering does not skip "consumed" slots).

**Connectors**
- [ ] First item: no leading-connector `<span>` in the DOM (assert by counting the connector children inside the marker column).
- [ ] Last item: no trailing-connector `<span>` in the DOM.
- [ ] Middle item: both leading and trailing connectors present.
- [ ] **Single-item timeline: zero connector spans inside the marker column** (the only item is both first and last; both connectors elide). Required by requirements § 9.
- [ ] Trailing connector after a `reached` item with `color="success"`: classes include `bg-success-border-strong`.
- [ ] Trailing connector after a `current` item: classes include `bg-border` (NOT `bg-<color>-border-strong`).
- [ ] Trailing connector after an `error` item: classes include `bg-error-border-strong`.
- [ ] `lineStyle="dashed"`: trailing connector includes `border-l` (vertical) / `border-t` (horizontal) and `border-dashed`; does NOT include `bg-*-border-strong`.

**Accessibility**
- [ ] AXE pass on a representative 5-item timeline covering all four states and both orientations. Use `@axe-core/playwright` or the existing AXE harness.
- [ ] `aria-current="step"` present on `current` items; absent on all others.
- [ ] Visually-hidden state labels are children of the body wrapper with the `sr-only` class (assert via class presence, not innerText comparison alone).
- [ ] `<time datetime>` is emitted only when machine-readability is satisfied.
- [ ] Container host has no `tabindex`. Item host has no `tabindex`.

**Composition**
- [ ] `<tw-item>` projected as default-slot content renders without conflicting classes (no double `border-*`, no double `font-*`).
- [ ] `<tw-avatar>` projected as `[twTimelineMarker]` with `size="sm"` renders at the avatar's own size (the timeline does not override avatar sizing).

**RTL**
- [ ] Host the timeline inside a `<div dir="rtl">` parent in the test. `align="left"` with `orientation="vertical"`: the marker column's logical-start (`ms-*` / `start-*`) classes resolve to the visual right edge. (Lightweight assertion: presence of logical-property classes, no hard-coded `ml-*`/`mr-*`.)

**Animation (smoke)**
- [ ] Item host carries `[animate.enter]="timeline-item-enter"` in vertical orientation. Switching to horizontal swaps the value to `timeline-item-enter-horizontal`. (Read the host attribute after `fixture.detectChanges()`.)

---

## Demo pages (skill: `demo-doc-page`)

Routes under `projects/demo/src/app/routes/timeline/`:

- `overview` — Description, accessibility notes (list semantics, aria-current, visually-hidden state text, no keyboard map), basic vertical example with five items in mixed states. Cite the `<h1>` requirement so AXE can run.
- `examples` — Activity feed, order tracking with icons, alternating roadmap, audit log with avatars, horizontal ribbon, dashed connector, custom timestamp template, interactive item with projected `<tw-item interactive>`, RTL example (wrap in `<div dir="rtl">`).
- `api` — Tables for `TimelineComponent` inputs (4), `TimelineItemComponent` inputs (5), the three slot directives (`twTimelineMarker`, `twTimelineTimestamp`, `twTimelineOpposite`).

Wire the route into `projects/demo/src/app/app.routes.ts` and the sidebar in `projects/demo/src/app/layout/shell.ts` (insert alphabetically — between `tabs` and `time-picker` is the natural slot).

---

## Files to create / modify (recap)

**NEW:**
- `projects/ngx-tw/timeline/index.ts`
- `projects/ngx-tw/timeline/ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`
- `projects/ngx-tw/timeline/timeline.ts` — both components + three slot directives + `tv()` config + static lookup maps
- `projects/ngx-tw/timeline/timeline.spec.ts`
- `projects/demo/src/app/routes/timeline/overview/timeline-overview.ts` (and `.html` if extracted)
- `projects/demo/src/app/routes/timeline/examples/timeline-examples.ts`
- `projects/demo/src/app/routes/timeline/api/timeline-api.ts`

**MODIFY:**
- `projects/ngx-tw/theme/_base.css` — add `timeline-item-enter` and `timeline-item-enter-horizontal` keyframes + reduced-motion override (NOT `default.css` — that file does not exist in this repo).
- `projects/ngx-tw/src/public-api.ts` — append `export * from 'ngx-tw/timeline';`.
- `projects/ngx-tw/tsconfig.lib.json` — add `"timeline/**/*.ts"` to `include`.
- `projects/ngx-tw/tsconfig.spec.json` — add `"timeline/**/*.spec.ts"` to `include`.
- `angular.json` — add `"../timeline/**/*.spec.ts"` to `projects.ngx-tw.architect.test.options.include`.
- `projects/demo/src/app/app.routes.ts` — register the timeline routes.
- `projects/demo/src/app/layout/shell.ts` — add timeline to the sidebar.

No root `package.json` changes are needed — secondary entry points are discovered via the `ng-package.json` file in each directory, which is the standard ng-packagr convention.

---

## Interpretations applied (resolved before implementation)

These are places where the requirements doc was ambiguous, terse, or referenced a file/convention that needed translation to the current repo state. The implementer should not re-litigate these; they are recorded so the maintainer can spot-check the reasoning during review.

1. **`xl` density typography step held at `text-sm`.** Requirements § 4.3 explicitly states "If the typography rule would otherwise block `xl` density, drop the `text-base` use entirely and stay at `text-sm`." CLAUDE.md's typography rules block the `text-base` use here (no exception qualifies for timeline). The prompt applies the requirements doc's own fallback — no new exception is carved.

2. **`text-2xs` at `xs` density.** CLAUDE.md permits `text-2xs` for xs density sub-`text-xs` cases. The auto-number inside a 24px circle marker at `xs` density and the timestamp at `xs` both qualify. Applied without further escalation.

3. **`theme/_base.css` vs `theme/default.css`.** Requirements references "`theme/default.css`" but the repo's actual file is `theme/_base.css` (imported from `theme/index.css`). The prompt instructs adding keyframes to `_base.css` alongside existing animation blocks (`step-panel-enter-forward`, `toast-slide-*`). This is a documentation translation, not a design change.

4. **Soft-background marker fill when `[twTimelineMarker]` content is projected (circle variant).** Requirements § 4.5 table column "circle styling (slot content projected)" specifies `bg-{color}-soft border border-{color}-border-strong` for the projected-content variant — distinct from the solid fill used for the auto-number variant. The prompt encodes this as two parallel lookup maps (`MARKER_REACHED` solid vs `MARKER_REACHED_SOFT`, and the same pair for `CURRENT`). This is an interpretation of a dense requirements table; flagging it explicitly so review can verify the soft/solid split matches the maintainer's intent.

---

## Open questions (genuine — surface to maintainer before committing)

These are decisions the implementer should NOT silently default. Confirm with the maintainer first.

1. **Error glyph inside `circle` markers.** Requirements § 4.5 says the error state's circle marker renders an "exclamation glyph" instead of the auto-number. The prompt assumes an inline hand-authored `<svg>` (~12 lines, `viewBox="0 0 24 24"`, `fill="currentColor"`) because relying on the icon registry would force consumers to register a Lucide icon just to render the error state. Confirm: hand-authored SVG vs `<tw-icon name="alert-triangle">` (the latter would require consumers to call `provideTwLucideIcons` with that icon registered, or the error state would render empty).

2. **Leading connector color when the previous item has `state="current"` or `state="pending"`.** Requirements § 4.5 explicitly defines the trailing connector after a `current` item as `bg-border` (neutral). By symmetry — a connector between items A and B is one physical line — the leading connector of B should agree with the trailing connector of A. The prompt resolves this by having each item's leading-connector class computation read the previous item's state from the container's `items()` signal. Confirm that the leading connector "belongs to" the previous item visually, rather than to the item that emits it.

3. **`role="feed"` deferral.** Requirements § 11.3 defers `role="feed"` to v1.5. The prompt assumes v1 ships with `role="list"` only and adds no feed-related ARIA, no `aria-busy`, no paging surface. If the maintainer wants a `role` input on the container in v1 (still within the 4 → 5 input cap), the requirements doc needs to be updated first.

---

## Acceptance criteria

Per requirements § 13, the component is "done" when all 12 items in that section are satisfied. The implementer must verify each item explicitly — do not assume passing tests are sufficient (item 8 requires AXE zero-violations on the demo pages, which only the demo build validates; item 11 requires Compodoc tables to be non-empty, which is a JSDoc coverage requirement, not a unit-test outcome).

Specifically:

1. All 4 container inputs implemented with the exact defaults and JSDoc shown in the API table above.
2. All 5 item inputs implemented with the exact defaults and JSDoc shown in the API table above.
3. All three slot directives implemented (`twTimelineMarker`, `twTimelineTimestamp`, `twTimelineOpposite`).
4. State × color matrix rendered correctly per § 4.5 of the requirements (verified via the spec's per-combination tests).
5. Auto-numbering works for `marker="circle"` with no projected slot content, and updates on add/remove.
6. First/last connector elision is correct (and a single-item timeline emits zero connectors — see Test plan).
7. RTL: container and items use logical-property utilities exclusively for horizontal spacing.
8. Spec passes per the Test plan section above.
9. AXE passes on the demo pages with zero violations.
10. `_base.css` carries the `timeline-item-enter` and `timeline-item-enter-horizontal` keyframes plus the reduced-motion override.
11. `public-api.ts`, `tsconfig.lib.json`, `tsconfig.spec.json`, and `angular.json` are wired.
12. Compodoc tables are non-empty for both `TimelineComponent` and `TimelineItemComponent` (proxy: every public member has a one-line JSDoc, as shown in the API tables above).

---

## Constraints (from CLAUDE.md — non-negotiable)

- Selectors `tw-timeline`, `tw-timeline-item`; class names `TimelineComponent`, `TimelineItemComponent` (no `Tw` prefix on classes).
- Standalone components — do not set `standalone: true`.
- `ChangeDetection.OnPush`; `host` object for host bindings; `inject()` for DI; native control flow.
- Signal API exclusively; `computed()` for all derived state; no `linkedSignal`, no `model()`.
- Semantic tokens only (`*-solid`, `*-soft`, `*-border-strong`, `surface`, `fg`, `border`); no raw palette or raw `neutral-*` for structure.
- Visual tokens drawn from CLAUDE.md "Visual Design System" — radius, gaps, typography, focus rings, icon sub-scales. No invented values.
- No `@angular/animations`. Use `animate.enter` with a class name defined in `theme/_base.css`.
- No `ngClass` / `ngStyle`. Use `[class]` / `[style]` bindings.
- No `fakeAsync` / `tick` in tests. No `@HostBinding` / `@HostListener`.
- JSDoc one-line description on every `input()` / public method (verbatim strings provided in the API table above).
- Input count: container = 4 (within cap), item = 5 (at cap). No expansion without a documented exception.
