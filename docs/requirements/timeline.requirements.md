# `tw-timeline` — Component Requirements

Status: draft for implementation.
Entry point: `ngx-tw/timeline` (standalone; new component).
Shared types reused from `ngx-tw/core`: `TwSize`, `TwColor`, `TwOrientation`.

This document is the build-time specification. It describes **what** the component does, **how** it must behave, and **what** its public surface looks like. Implementation details (DOM structure choices, exact class strings, internal CSS class names) are suggestions, not mandates, unless explicitly marked **MUST**.

Normative language follows RFC 2119: **MUST** / **MUST NOT** are hard rules, **SHOULD** / **SHOULD NOT** are strong defaults with justified exceptions, **MAY** is permitted.

---

## 1. Scope and goals

### 1.1 What this component is

A presentational layout primitive that renders a chronological sequence of events along a single axis. Each event is rendered as an **item** that pairs a **marker** (dot, ring, icon, number, or fully custom shape) with **content** (title, description, timestamp, optional actions). Items are connected by a **line** that runs through their markers, communicating chronological adjacency.

The timeline is **declarative and content-projected**: consumers write `<tw-timeline-item>` children inside `<tw-timeline>`. The container styles the line, propagates layout decisions (orientation, alignment, size), and computes per-item numbering. The item styles its own marker and content slots and reports its index/position back to the container.

### 1.2 Use cases

| Use case | Shape |
|---|---|
| Activity feed (latest changes on a record) | Vertical, dot markers, color by event type, timestamps |
| Order tracking ("Placed → Shipped → Out for delivery → Delivered") | Vertical, circle markers with icons, `state` machine driving colors |
| Release notes / changelog | Vertical, version chip as marker content, free-form description |
| Audit log | Vertical, compact density (`sm`), avatar as marker, timestamps |
| Project roadmap milestones | Vertical alternating layout (left/right zigzag), dates as opposing content |
| Stepper-style "progress so far" indicator that is **not** interactive | Vertical or horizontal, `state` drives colors, no panels |
| Compact horizontal event ribbon (e.g., race splits, shipment hops) | Horizontal, dot markers below, content above |

### 1.3 What this component is not

- **Not a stepper.** A stepper is an interactive multi-step wizard with panels, navigation, completion state, and form integration (CDK `CdkStepper`). The timeline is presentational only — there is no active panel, no per-step content panes, no navigation. Items MAY be individually interactive (a clickable row that emits a `selected` event) but the container does not own tab/panel semantics.
- **Not a list/feed virtualizer.** Items are projected children; the container does not lazily render or windowize. For very long timelines (>200 items) the consumer is responsible for windowing externally.
- **Not a tree or hierarchy.** Items are flat. Nested timelines are not supported and SHOULD NOT be created by consumers.
- **Not a calendar event view.** Items have a timestamp but the timeline does not enforce ordering, snap-to-day grouping, or "today" markers. Consumers order the items.

### 1.4 Non-goals (explicit)

- Server-side data fetching, pagination, infinite scroll.
- Drag-to-reorder of items.
- Filtering or grouping by date / type at the component level.
- Multi-track parallel timelines (Gantt-style swimlanes).
- Animations between items beyond the standard `prefers-reduced-motion`-respecting enter animation defined in `theme/default.css`.

---

## 2. Public API

### 2.1 Anatomy

```
<tw-timeline>                           ← container; owns orientation, align, size, lineStyle
  <tw-timeline-item>                    ← single event; owns marker variant, state, timestamp
    <ng-content>                        ← default slot: free-form item body (project tw-item, headings, paragraphs, anything)
    <ng-content select="[twTimelineMarker]"/>     ← optional: custom marker content (icon, avatar, number)
    <ng-content select="[twTimelineOpposite]"/>   ← optional (vertical only): content on the opposite side (used by align="alternate" and align="split")
  </tw-timeline-item>
  …more items…
</tw-timeline>
```

There is intentionally no `<tw-timeline-marker>` element selector; marker content is projected via the `[twTimelineMarker]` attribute on whatever element the consumer wants (an `<tw-icon>`, a `<tw-avatar>`, a `<span>`, etc.). This keeps the DOM flat.

### 2.2 `TimelineComponent` — `tw-timeline`

#### Inputs (4)

| Name | Type | Default | Description |
|---|---|---|---|
| `orientation` | `TwOrientation` (`'vertical' \| 'horizontal'`) | `'vertical'` | Axis along which items are laid out. Vertical is the default and primary use case. |
| `align` | `'left' \| 'right' \| 'alternate' \| 'split'` | `'left'` | Layout strategy for vertical orientation. **MUST be ignored** when `orientation === 'horizontal'`. See § 4.2 for semantics. |
| `size` | `TwSize` | `'md'` | Density and typography scale. Controls marker diameter, gap between items, content typography step. See § 4.3 for the full mapping. |
| `lineStyle` | `'solid' \| 'dashed'` | `'solid'` | Default connector line style applied to every gap between items. Per-item overrides are out of scope for v1. |

#### Outputs

None on the container. Item-level `selected` events bubble naturally.

#### Host attributes

- **MUST** apply `role="list"` to the container. (Per ARIA 1.2: a chronological list is a list. `role="feed"` is reserved for infinite, lazily-loaded content streams and **MUST NOT** be used here by default.)
- **MUST** apply `aria-orientation="horizontal"` when `orientation === 'horizontal'`. (The default vertical orientation does not require the attribute — vertical is the implicit list direction.)
- **MUST NOT** set `tabindex` on the container itself.

### 2.3 `TimelineItemComponent` — `tw-timeline-item`

#### Inputs (5)

| Name | Type | Default | Description |
|---|---|---|---|
| `color` | `TwColor` | `'primary'` | Semantic color of the marker (and of the trailing connector when `state === 'reached'`). Ignored when `state === 'error'` (which forces `error` palette). |
| `marker` | `'dot' \| 'circle'` | `'dot'` | Marker geometry. `dot` is a small filled circle. `circle` is a larger ring/disc that **MAY** contain projected content (icon, avatar, custom node) or an auto-computed number. See § 4.4. |
| `state` | `'reached' \| 'pending' \| 'current' \| 'error'` | `'reached'` | Semantic state of the event. Drives marker fill, ring, and trailing-connector color. See § 4.5 for the state table. |
| `timestamp` | `string \| Date \| null` | `null` | Timestamp shown in the timestamp slot. When a `Date`, it is formatted with the consumer's default locale via `Intl.DateTimeFormat` (or via projected `[twTimelineTimestamp]` content if the consumer wants control). When a `string`, it is rendered as-is. When `null`, no timestamp element is rendered. |
| `dateTime` | `string \| null` | `null` | Machine-readable ISO 8601 string used for the `<time datetime="…">` attribute. If `null` and `timestamp` is a `Date`, it is derived from the Date. If both are `null`, no `<time>` element is emitted (a `<span>` is used for any projected timestamp slot). |

The item must NOT exceed 5 inputs. Decorative connector overrides are deferred to v1.5+.

#### Outputs

| Name | Type | When it fires |
|---|---|---|
| `selected` | `output<Event>` | Optional: only emits when the item host is given `[interactive]="true"` via projected content. **The container does not own this output**; items inheriting interactive behavior **MUST** use the existing `tw-item` primitive's `selected` output for the interactive sub-region. The timeline item itself is not focusable. |

> **Decision:** the timeline item is **not** directly interactive in v1. If a consumer needs row-level click handling, they project a `<tw-item interactive>` (or a `<button>`) inside the default slot. This avoids creating nested-interactive ARIA failures (a clickable item containing a clickable button) and keeps the item's input count to 5.

#### Slots / projection

| Slot | Selector | Required? | Purpose |
|---|---|---|---|
| Default | (no selector) | Yes for v1 (otherwise the item renders empty) | Free-form body. Consumer projects title, description, content. **MAY** be a `<tw-item>` or arbitrary markup. |
| Marker content | `[twTimelineMarker]` | Optional | When present and `marker === 'circle'`, this content is rendered inside the circle (instead of the auto-number). When `marker === 'dot'`, the marker slot **MUST** be ignored and a warning logged in dev mode. |
| Timestamp | `[twTimelineTimestamp]` | Optional | When present, replaces the rendered `timestamp` input. Allows projecting relative-time components (e.g. "2 hours ago"). |
| Opposite | `[twTimelineOpposite]` | Optional, vertical only | Content shown on the opposite side from the main body in `align="alternate"` and `align="split"` layouts. Ignored in `align="left"` / `align="right"` and in horizontal orientation. |

#### Host attributes

- **MUST** apply `role="listitem"`.
- **MUST NOT** set `tabindex`. Focus management is owned by projected interactive children (buttons, links, `<tw-item interactive>`).
- **MUST** apply `aria-current="step"` when `state === 'current'` (so AT can announce the in-progress event in process-style timelines).
- **MUST** apply `aria-label` derived from `state` when the visual state would otherwise convey meaning by color alone. The label format **MUST** be `"<state>: "` prepended via a visually hidden span inside the item, OR via `aria-label` on the marker element. (See § 5.1.)

---

## 3. Composition examples

### 3.1 Activity feed (canonical case)

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

### 3.2 Order tracking with icons (state machine)

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

### 3.3 Alternating roadmap

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

### 3.4 Compact audit log with avatars

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

### 3.5 Horizontal event ribbon

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

---

## 4. Layout model

### 4.1 Orientation

| `orientation` | Direction | Notes |
|---|---|---|
| `'vertical'` | Items stacked top-to-bottom. Marker column on one or both sides. Connector line is vertical. | Default and primary use case. |
| `'horizontal'` | Items laid out left-to-right. Marker row above or below the content. Connector line is horizontal. | Used for compact ribbons. RTL-aware: line direction reverses in `dir="rtl"`. |

### 4.2 Vertical alignment (`align`)

| `align` | Marker position | Content position | Opposite slot used? |
|---|---|---|---|
| `'left'` (default) | Left of content | Right of marker | No |
| `'right'` | Right of content | Left of marker | No |
| `'alternate'` | Center column | Alternates left ↔ right per item (odd items right, even items left) | Yes (rendered on the opposite side from the body, mirrored alternately) |
| `'split'` | Center column | Right side | Yes (rendered on the left side; useful for timestamps on left, content on right) |

`alternate` and `split` **MUST** render the opposite slot via projected `[twTimelineOpposite]` content. If no opposite content is projected, the opposite side **MUST** be rendered as an empty placeholder of the same minimum width so the marker stays centered.

### 4.3 Size scale

The `size` input drives marker geometry, gap between items, and content typography. The library's canonical size scale (`xs | sm | md | lg | xl`) applies.

| `size` | `dot` diameter | `circle` diameter | Item gap (vertical) | Typography baseline |
|---|---|---|---|---|
| `xs` | `size-2` (8px) | `size-6` (24px) | `gap-3` | `text-xs` |
| `sm` | `size-2.5` (10px) | `size-7` (28px) | `gap-4` | `text-sm` |
| `md` | `size-3` (12px) | `size-8` (32px) | `gap-5` | `text-sm` |
| `lg` | `size-3` (12px) | `size-10` (40px) | `gap-6` | `text-sm` |
| `xl` | `size-3` (12px) | `size-12` (48px) | `gap-8` | `text-base` *(only if the codified `text-base` exception applies)* |

Per CLAUDE.md typography rules, the timeline **MUST NOT** use `text-lg`, `text-xl`, or larger for component-internal text. The `text-base` step is only permitted at `xl` density and **MUST** carry the same single-line justification comment shown in other components. If the typography rule would otherwise block `xl` density, drop the `text-base` use entirely and stay at `text-sm`.

### 4.4 Marker geometry

| `marker` | What is rendered | Marker slot used? | Auto-numbering? |
|---|---|---|---|
| `'dot'` | A small filled (or outlined, per state) circle of the diameter shown in § 4.3. | No (must not be projected; dev warning if attempted) | No |
| `'circle'` | A larger ring/disc of the diameter shown in § 4.3. Content inside is either projected `[twTimelineMarker]` content OR — if no content is projected — the item's auto-computed 1-based index. | Yes | Yes when no slot content is projected. Numbering reflects DOM order. |

### 4.5 State machine

| `state` | `dot` styling | `circle` styling (no slot content) | `circle` styling (slot content projected) | Trailing connector color |
|---|---|---|---|---|
| `reached` (default) | `bg-{color}-solid` | `bg-{color}-solid text-{color}-solid-fg` with the auto-number rendered as `text-xs font-semibold` | `bg-{color}-soft border border-{color}-border-strong` wrapping the projected content. Projected content **MUST** inherit `text-{color}-solid` (or the consumer's own color). | `bg-{color}-border-strong` |
| `pending` | `bg-surface border-2 border-border` (outlined) | `bg-surface border-2 border-border text-fg-muted` with the auto-number | `bg-surface border-2 border-border` wrapping the projected content. Projected content **MUST** read as muted (the consumer is expected to size icons / avatars appropriately). | `bg-border` |
| `current` | `bg-{color}-solid ring-4 ring-{color}-soft` | `bg-{color}-solid text-{color}-solid-fg ring-4 ring-{color}-soft` with the auto-number | `bg-{color}-soft border border-{color}-border-strong ring-4 ring-{color}-soft` wrapping the projected content. | `bg-border` (the trailing connector after a `current` item **MUST NOT** be tinted — `current` means subsequent items have not yet been reached) |
| `error` | `bg-error-solid` (color input is ignored) | `bg-error-solid text-error-solid-fg` with the auto-number replaced by an `<svg>` exclamation glyph | `bg-error-solid text-error-solid-fg` wrapping the projected content; `error` overrides `color` | `bg-error-border-strong` |

The leading connector of the **first** item **MUST** be omitted (rendered as `display: none` or simply not emitted). The trailing connector of the **last** item **MUST** be omitted likewise.

The color slot tokens listed above (`*-solid`, `*-solid-fg`, `*-soft`, `*-border-strong`) are the same tokens used by the stepper component. They handle light/dark mode automatically; no explicit `dark:` variants are needed.

### 4.6 Connector geometry

| Orientation | Connector dimensions | Where it sits |
|---|---|---|
| Vertical | `w-px` (1px), height fills the gap between adjacent markers, plus the inner area of the marker on both sides so the line visually enters and exits the marker. | Centered behind the marker column. `align="alternate"` and `align="split"` use the center column. |
| Horizontal | `h-px` (1px), width fills the gap between adjacent markers. | Centered behind the marker row. |

When `lineStyle === 'dashed'`, the connector **MUST** use `border-dashed border-l` (vertical) / `border-dashed border-t` (horizontal) instead of a solid background fill, so the dashed pattern is consistent regardless of length.

Connector thickness at `lg` / `xl` densities **MAY** scale to 2px (`w-0.5` / `h-0.5`) per the stepper precedent, but this is OPTIONAL in v1.

---

## 5. Accessibility

### 5.1 Roles and structure

- **Container**: `role="list"`. Container **MUST NOT** be focusable.
- **Item**: `role="listitem"`. Item **MUST NOT** be focusable. If the consumer needs row-level activation, they project an interactive element inside the default slot.
- **Marker**: the marker element **MUST** be `aria-hidden="true"` UNLESS the marker visually conveys state-only information AND the consumer has not provided a textual equivalent inside the default slot. In that case the marker **MUST** carry an `aria-label` reflecting the state, e.g. `aria-label="Current"`, `aria-label="Pending"`, `aria-label="Error"`. (See § 5.2.)
- `current` state items **MUST** carry `aria-current="step"` on the item host.

### 5.2 State conveyance (color is not the sole signal)

When `state` is set, the styling differs by fill and ring. Per WCAG 1.4.1 "Use of Color", the state **MUST** also be conveyed non-visually. The component **MUST** include a visually-hidden span inside each item (or use `aria-label` on the marker) that announces the state in English:

- `reached` → no announcement needed (the default state has no extra signal)
- `pending` → visually-hidden text: `"Pending: "`
- `current` → visually-hidden text: `"Current: "` plus `aria-current="step"` on the item
- `error` → visually-hidden text: `"Error: "`

The English strings **MUST** be overridable via an input or via slot projection so consumers can localize. For v1 the simplest approach is a per-item `stateLabel` input — but this would exceed the 5-input cap. **Decision for v1**: ship hardcoded English strings, document the limitation, and add localization in v1.5 via a config token (`TW_TIMELINE_I18N`) similar to other library i18n tokens.

### 5.3 Timestamps

When `timestamp` is provided and `dateTime` is resolvable (either passed directly, or derivable from a `Date`-typed `timestamp`), the rendered element **MUST** be a `<time datetime="…">` element. Otherwise it **MUST** be a plain `<span>`.

### 5.4 Keyboard

- The container is **not** focusable.
- The container does **not** install a keyboard map.
- Projected interactive children (buttons, links, `<tw-item interactive>`) participate in the document tab order normally.
- This explicit non-installation is documented because it is a deliberate departure from `tw-stepper`. The timeline is not a navigable widget.

### 5.5 Reduced motion

Any enter/leave animation defined for items (see § 6) **MUST** respect `prefers-reduced-motion: reduce` and reduce duration to 0ms in that mode.

### 5.6 AXE conformance

The component **MUST** pass `@axe-core/playwright` automated checks at default configuration with no violations. The demo pages **MUST** carry an `<h1>` and proper landmark structure so the AXE harness can run.

---

## 6. Animation

### 6.1 Item enter

When an item is appended to the timeline at runtime (a new event arrives), the item **SHOULD** animate in. Use Angular's native `animate.enter` (NOT `@angular/animations`, which is deprecated). The animation class is `timeline-item-enter` and is defined in `projects/ngx-tw/theme/default.css`:

```css
@keyframes timeline-item-enter {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}
.timeline-item-enter { animation: timeline-item-enter 200ms ease-out; }

@media (prefers-reduced-motion: reduce) {
  .timeline-item-enter { animation-duration: 0ms; transform: none; }
}
```

In horizontal orientation, the translate axis **MUST** be X instead of Y. Either ship a second class (`timeline-item-enter-horizontal`) or compose both with a CSS variable. Implementation discretion.

### 6.2 No reorder animations

Items **MUST NOT** animate when reordered. Reordering during runtime would require FLIP-style animation that adds complexity disproportionate to value.

---

## 7. RTL

When the document direction is `rtl`:
- Vertical orientation: `align="left"` and `align="right"` semantics swap. `align="alternate"` and `align="split"` reflect across the vertical axis.
- Horizontal orientation: items lay out right-to-left. The connector line, marker geometry, and content order all flip via the writing-mode-aware utilities (`ms-*`, `me-*`, `ps-*`, `pe-*` rather than `ml-*`, `mr-*`).

**MUST** use logical properties for any spacing that crosses the line direction. **MUST NOT** use directional pixel utilities (`ml-*`, `mr-*`, `pl-*`, `pr-*`) on container or marker layout.

---

## 8. Performance

- Render is O(N) on the number of items. Connector lines are CSS-only (no per-item DOM line element); they **MAY** be implemented as borders on the marker column or as a single absolute-positioned `<span>` per item. Implementation discretion.
- Auto-numbering **MUST** use `contentChildren(TimelineItemComponent)` on the container with `descendants: false`, and the item **MUST** compute its 1-based index via a `computed()` over the container's children array. No `effect()` that writes to DOM.
- The component **MUST** use `OnPush` change detection.
- Items **MUST NOT** trigger global state updates when their state input changes. State changes are purely local visual updates.

---

## 9. States and edge cases

| Scenario | Expected behavior |
|---|---|
| Empty timeline (no items) | Container renders an empty `<div role="list">`. No connector, no spacing artifacts. Consumer may project a `<tw-empty-state>` outside the timeline; embedding it inside is permitted but not styled by the component. |
| Single item | No connector is rendered. Marker is centered as if it had siblings. |
| `state="current"` followed by `state="reached"` | Allowed (history can have edits applied after the current event). Connector after the `current` item **MUST** be `bg-border` regardless. |
| `state="error"` mid-sequence | The `error` item is colored with the error palette; its trailing connector is `bg-error-border-strong`. Subsequent items are unaffected. |
| Marker slot projected when `marker="dot"` | Dev-mode warning logged via `console.warn` once per item. Slot content is ignored at render time. Production builds **MUST NOT** log. |
| `timestamp` is a `Date` and `dateTime` is `null` | The `<time datetime="…">` attribute is the Date's `toISOString()`. The visible text is `new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)` UNLESS `[twTimelineTimestamp]` content is projected. |
| `timestamp` is a string and `dateTime` is null | Visible text is the string as-is. The element is a `<span>`, not `<time>`. |
| Container orientation switches at runtime | Layout reflows. No animation between orientations. |
| Container is inside a flex/grid parent with constrained height | Vertical timeline does not scroll itself. Consumer is responsible for wrapping in a scroll container. |
| Very long content in an item | Content wraps. `min-w-0` is applied to the body wrapper so flex truncation works inside. The marker column does not stretch. |
| Two adjacent items with very different content heights | Connector stretches to fill the gap. Marker stays vertically centered to the title's first line (`mt-0.5` baseline nudge). |

---

## 10. Testing requirements

Per CLAUDE.md, tests use Vitest. Test files live next to source (`timeline.spec.ts`).

The spec **MUST** cover:

### 10.1 Rendering

- Default render of container with no children: `role="list"` present, no items, no warnings.
- Each `orientation` value renders with the correct DOM (vertical vs horizontal line direction).
- Each `align` value in vertical orientation renders the marker on the correct side and uses the opposite slot when present.
- Each `size` value applies the correct marker diameter and gap (assert by class presence).
- Each `lineStyle` value renders solid vs dashed connectors.

### 10.2 Item rendering

- Default item renders `role="listitem"`, default marker (`dot`), default state (`reached`).
- Each `marker` value (`dot` / `circle`) renders the correct geometry.
- Each `state` value applies the correct ARIA attributes (`aria-current` only for `current`, visually-hidden state text for `pending` / `current` / `error`).
- Each `color` value × each `state` combination produces a unique class set (assert by snapshotting the marker's class list).
- `timestamp` as a `Date` renders a `<time>` element with the correct `datetime` attribute.
- `timestamp` as a string renders a `<span>`, not `<time>`.
- `[twTimelineTimestamp]` projection overrides the input.
- `[twTimelineMarker]` projection replaces the auto-number when `marker="circle"`.
- `[twTimelineMarker]` projection is ignored when `marker="dot"` (and dev warning is logged).
- `[twTimelineOpposite]` projection renders only in `align="alternate"` and `align="split"`.

### 10.3 Auto-numbering

- Items receive 1-based indices reflecting DOM order.
- Adding/removing items at runtime updates the numbering for subsequent items.
- Items with projected marker content do not consume an index (the index still exists for ordinality but is not rendered).

### 10.4 Connectors

- First item has no leading connector.
- Last item has no trailing connector.
- Connector color reflects the leading item's `state` (per § 4.5 trailing-connector rules).
- `lineStyle="dashed"` renders dashed style on all connectors.

### 10.5 Accessibility

- AXE passes on a representative DOM (5+ items, all states represented, both orientations) with zero violations.
- `aria-current="step"` is present on `current` items and absent on others.
- Visually-hidden state text is present and matches the rule in § 5.2.
- `<time datetime>` is emitted only when the timestamp is machine-readable.

### 10.6 Composition

- A `<tw-item>` projected inside the default slot renders correctly without conflicting with timeline styles.
- A `<tw-avatar>` projected as `[twTimelineMarker]` inherits expected sizing (via the avatar's own `size` input — the timeline does NOT control avatar sizing).

### 10.7 RTL

- In `dir="rtl"`, the marker side in `align="left"` ends up on the visual right (logical-property correctness).

### 10.8 What NOT to test (per CLAUDE.md)

- Internal signal values, computed property values, or specific class strings beyond what is required to assert behavior.

---

## 11. Open questions / deferred to v1.5

1. **Per-item connector overrides.** A consumer might want a dashed connector between two specific items while the rest are solid. Deferred — would require a 6th input on `tw-timeline-item`.
2. **Localized state labels.** v1 ships hardcoded English ("Pending:", "Current:", "Error:"). v1.5 adds `TW_TIMELINE_I18N` token.
3. **`role="feed"` for infinite lists.** Different ARIA contract (article children, `aria-busy`, paging). Out of scope for v1; consider as a `variant` later.
4. **Sticky timestamps in scroll containers.** Some activity feeds sticky-pin the date as you scroll past it. Out of scope; the consumer can build this on top.
5. **Connector color when error sits between two reached states.** Currently the error item's trailing connector is `error-border-strong`. Subsequent reached items' trailing connectors are normal `*-border-strong`. Confirm with stakeholders that this is the desired visual semantic (vs. "everything after an error is also error-colored").
6. **Grouping by day.** Activity feeds often want day separators ("Today", "Yesterday", "March 12"). Could be a separate `<tw-timeline-divider>` projected child in v1.5.

---

## 12. Implementation constraints (recap of CLAUDE.md rules that bind this component)

- **Angular v21**: standalone components (no `standalone: true`), signal-based inputs/outputs, `OnPush`, `host` object for bindings, native control flow (`@if`/`@for`).
- **Tailwind v4**: no CSS files in component dirs; all styling via `tv()` slots and host class bindings. The only CSS asset added is the `timeline-item-enter` keyframe in `theme/default.css`.
- **Semantic tokens only**: marker fills, ring colors, connector colors use `*-solid`, `*-soft`, `*-border-strong`, `bg-border`, `bg-surface`, `text-fg-muted` — never raw `bg-blue-500` / `text-neutral-700`.
- **Input cap**: container 4 inputs, item 5 inputs. Hard cap — no v1 expansion without a documented exception.
- **Selector**: `tw-timeline` (element), `tw-timeline-item` (element). Directives use `twTimelineMarker`, `twTimelineTimestamp`, `twTimelineOpposite` (camelCase attribute selectors).
- **Class names**: `TimelineComponent`, `TimelineItemComponent` — no `Tw*` prefix.
- **Secondary entry point**: `projects/ngx-tw/timeline/` with `index.ts`, `ng-package.json`, `timeline.ts`, `timeline.spec.ts`.
- **JSDoc**: every public input/output/method gets a one-line JSDoc describing purpose and default. No type repetition.
- **No `@angular/animations`**. Use `animate.enter` with the keyframe in `theme/default.css`.
- **No `ngClass` / `ngStyle`**. Use `[class]` / `[style]` bindings.
- **No `fakeAsync`/`tick`** in tests. Use `vi.useFakeTimers()` for any timer needs (likely none for a presentational component).
- **No `@HostBinding`/`@HostListener`**. Use `host` object.

---

## 13. Acceptance criteria

The component is "done" when:

1. ✅ All inputs from § 2 are implemented with correct defaults and JSDoc.
2. ✅ All slots from § 2 are projected and styled per § 4.
3. ✅ All states from § 4.5 render with the correct class sets.
4. ✅ Auto-numbering works (§ 4.4) and updates on item add/remove.
5. ✅ Connector elision on first/last items (§ 4.5).
6. ✅ RTL correctness (§ 7) for all alignments.
7. ✅ Test coverage per § 10.
8. ✅ AXE zero violations on the demo pages (§ 5.6).
9. ✅ The `theme/default.css` carries the `timeline-item-enter` keyframe.
10. ✅ The library's `public-api.ts` re-exports the new entry point.
11. ✅ Compodoc generates non-empty API tables for both `TimelineComponent` and `TimelineItemComponent` (proxy: every public member has a JSDoc).
12. ✅ Demo pages exist at `projects/demo/src/app/routes/timeline/{overview,examples,api}` and are wired into `app.routes.ts`, per the `demo-doc-page` skill.
