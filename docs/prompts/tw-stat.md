# Prompt: Build `tw-stat` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — every convention, especially: Visual Design System (typography table, spacing scale, borders, shadows), `tv()` slots + `compoundVariants` pattern, content-projection-fallback rules, input cap exceptions, JSDoc requirements.
- `projects/ngx-tw/empty-state/empty-state.ts` — the closest structural analog: display-only, variant axis, slot directives that capture either DOM-projected content (`[twEmptyStateIcon]`) or `TemplateRef`-projected content (`*twEmptyStateTitle`). Mirror this pattern.
- `projects/ngx-tw/card/card.ts` — variant + size + color slot table with `compoundVariants` and slot-projection directives carrying class bindings from the parent.
- `projects/ngx-tw/badge/badge.ts` — `solid | outline | soft | filled`-style variant + color compound matrix, and `contentChild` detection for optional leading slots.
- `projects/ngx-tw/skeleton/skeleton.ts` — how the library renders loading placeholders. The stat will instantiate `<tw-skeleton>` internally when `loading()` is true.
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`.

CDK modules: none. This is a pure display primitive.

Composable components: `<tw-skeleton>` (loading), `<tw-icon>` (optional fallback inside the delta indicator), `<tw-badge>` (consumer may project one into the footer slot for tags).

## What to build

A compact display tile that surfaces a single key performance indicator (KPI) — a primary value with a label, optional description, optional leading icon, and an optional **trend delta** (direction + value + comparison label). Used in analytics dashboards, admin overviews, and reporting tiles. Display-only: no inputs, no outputs other than possibly the delta's own ARIA wiring; no form integration.

The component splits into two co-located classes:

1. **`StatComponent`** (`tw-stat`) — the tile shell. Carries surface variant, size axis, and the loading flag. Hosts content-projection slots for label, value, description, icon, delta, and footer.
2. **`StatDeltaComponent`** (`tw-stat-delta`) — a self-contained trend indicator that consumers project into the stat's delta slot (or use anywhere as a standalone tag). Owns direction, value, comparison label, sentiment inversion, and the auto-composed ARIA description.

Plus four slot directives: `[twStatLabel]`, `[twStatValue]`, `[twStatDescription]`, `[twStatIcon]`, `[twStatFooter]` — all attribute-selector marker directives that the parent picks up via `contentChild` (DOM projection, matching the badge / empty-state pattern). The value slot is the dominant visual element; the description and footer are optional auxiliary regions.

## API design

### `StatComponent` (`tw-stat`)

#### Inputs

```ts
/** Surface treatment. `'plain'` removes border and background; `'outlined'` (default) adds a border on the surface token; `'elevated'` adds shadow and uses the raised surface; `'filled'` uses the muted surface with no border. */
variant = input<StatVariant>('outlined');

/** Density scale — drives padding, internal gaps, value/label typography, and the size passed to the internal `<tw-skeleton>` and `<tw-icon>` instances. Defaults to `'md'`. */
size = input<TwSize>('md');

/** When true, replaces the label, value, and delta regions with `<tw-skeleton>` placeholders and sets `aria-busy="true"` + `aria-live="polite"` on the host. Projected footer content still renders. Defaults to `false`. */
loading = input(false, { transform: booleanAttribute });
```

Three inputs. Within cap. No exceptions invoked.

#### Outputs

None — display-only.

#### Content projection slots

- `[twStatLabel]` — short caption ("Revenue", "Active Users"). Required for meaningful semantics; if absent the component still renders but logs nothing (no fallback text — consumers may already announce via surrounding `aria-label`).
- `[twStatValue]` — the dominant number/text. Consumers format the value themselves (Angular's `decimal`, `currency`, `percent` pipes or pre-formatted strings). May contain inline `<sup>` / `<small>` for prefix/suffix units.
- `[twStatDescription]` — optional secondary text under the value.
- `[twStatIcon]` — optional leading icon. When present, the layout shifts to an icon-leading arrangement (icon on the left, content stack on the right).
- `[twStatFooter]` — optional auxiliary region rendered below the description. For sparklines, mini-charts, or `<tw-badge>` tags. Renders even when `loading()` is true so consumers can compose skeleton charts in the footer.
- `<tw-stat-delta>` — the trend indicator. Consumers project it directly (no marker directive — the component is identified by element selector via `contentChild(StatDeltaComponent)`). Renders to the right of the value on the same baseline.

All slots are optional. The component should use `contentChild()` to detect presence and conditionally render the corresponding region — no fallback content for structural slots (matches empty-state convention).

### `StatDeltaComponent` (`tw-stat-delta`)

#### Inputs

```ts
/** Direction of change. `'up'` renders an up-chevron and (by default) the `success` color; `'down'` renders a down-chevron and the `error` color; `'neutral'` renders a horizontal-line glyph and the `neutral` color. Defaults to `'neutral'`. */
direction = input<StatDeltaDirection>('neutral');

/**
 * When true, swaps the success/error semantics: `down` becomes success-colored, `up` becomes error-colored.
 * Use for metrics where lower is better — bounce rate, error rate, latency, churn. `neutral` direction is unaffected.
 * Defaults to `false`.
 */
inverted = input(false, { transform: booleanAttribute });

/** Display style. `'badge'` (default) wraps the delta in a pill-shaped soft-colored chip; `'inline'` renders icon + text on the surface background; `'icon-only'` shows just the directional glyph for ultra-dense layouts. */
variant = input<StatDeltaVariant>('badge');

/** Optional comparison label rendered next to the delta value (e.g. `"vs last week"`, `"since launch"`). Wrapped in a `text-fg-muted` span. Defaults to `undefined`. */
comparisonLabel = input<string>();

/**
 * Explicit accessible label for the delta. When omitted, the component composes one from `direction` + `comparisonLabel` and the projected text content (e.g. `"increased by 12.5% vs last week"`). Override when projected content is purely symbolic or already localized.
 */
ariaLabel = input<string>();
```

Five inputs. Within cap. The delta's text content (e.g. `"+12.5%"`) is projected via `<ng-content>` — never an input.

#### Outputs

None.

### Shared types

```ts
export type StatVariant = 'plain' | 'outlined' | 'elevated' | 'filled';
export type StatDeltaDirection = 'up' | 'down' | 'neutral';
export type StatDeltaVariant = 'badge' | 'inline' | 'icon-only';
```

Export from each component's local file; re-export from `index.ts`. Do not promote to `ngx-tw/core` — they are stat-specific.

## Usage examples

```html
<!-- Simplest: label + value -->
<tw-stat>
  <span twStatLabel>Revenue</span>
  <span twStatValue>$24,580</span>
</tw-stat>

<!-- With description and delta -->
<tw-stat>
  <span twStatLabel>Active users</span>
  <span twStatValue>{{ users | number }}</span>
  <span twStatDescription>Daily uniques</span>
  <tw-stat-delta direction="up" comparisonLabel="vs last week">+12.5%</tw-stat-delta>
</tw-stat>

<!-- Inverted sentiment: down is good (lower bounce rate) -->
<tw-stat>
  <span twStatLabel>Bounce rate</span>
  <span twStatValue>{{ bounce | percent:'1.1-1' }}</span>
  <tw-stat-delta direction="down" inverted comparisonLabel="vs last month">−3.2%</tw-stat-delta>
</tw-stat>

<!-- Loading state -->
<tw-stat [loading]="!data()">
  <span twStatLabel>Conversion</span>
  <span twStatValue>{{ data()?.conversion | percent }}</span>
  <tw-stat-delta direction="up">+0.4pp</tw-stat-delta>
</tw-stat>

<!-- Icon-leading layout -->
<tw-stat variant="elevated">
  <tw-icon twStatIcon name="chart-bar" size="lg" />
  <span twStatLabel>Orders</span>
  <span twStatValue>1,284</span>
  <tw-stat-delta direction="up" variant="inline">+8.1%</tw-stat-delta>
</tw-stat>

<!-- With footer (sparkline or extra metadata) -->
<tw-stat>
  <span twStatLabel>Monthly recurring revenue</span>
  <span twStatValue>$48.2k</span>
  <tw-stat-delta direction="up" comparisonLabel="MoM">+6.0%</tw-stat-delta>
  <div twStatFooter>
    <app-sparkline [data]="series()" />
  </div>
</tw-stat>

<!-- Dashboard grid of tiles — layout is the consumer's responsibility -->
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  @for (kpi of kpis(); track kpi.id) {
    <tw-stat>
      <span twStatLabel>{{ kpi.label }}</span>
      <span twStatValue>{{ kpi.value }}</span>
      <tw-stat-delta [direction]="kpi.direction" [inverted]="kpi.inverted">
        {{ kpi.deltaText }}
      </tw-stat-delta>
    </tw-stat>
  }
</div>
```

## Styling

### `StatComponent` — `tv()` slot config

Slots: `root`, `header` (icon + label row), `label`, `value`, `description`, `delta` (wrapper around the projected `<tw-stat-delta>`), `footer`.

**Variants:**
- `variant`: `'plain' | 'outlined' | 'elevated' | 'filled'`
  - `plain` → `bg-transparent` on root, no border.
  - `outlined` → `bg-surface border border-border rounded-lg` on root. **Default.**
  - `elevated` → `bg-surface-raised border border-border rounded-lg shadow hover:shadow-md transition-shadow duration-200 motion-reduce:transition-none` on root.
  - `filled` → `bg-surface-muted rounded-lg` on root, no border.
- `size`: maps to the spacing scale in CLAUDE.md.
  - `xs` → `root: p-2 gap-1`, `label: text-2xs`, `value: text-sm font-semibold tabular-nums`, `description: text-2xs text-fg-muted`.
  - `sm` → `root: p-3 gap-1`, `label: text-xs`, `value: text-base font-semibold tabular-nums`, `description: text-xs text-fg-muted`.
  - `md` → `root: p-4 gap-1.5`, `label: text-xs`, `value: text-lg font-semibold tabular-nums`, `description: text-xs text-fg-muted`. **Default.**
  - `lg` → `root: p-6 gap-2`, `label: text-sm`, `value: text-2xl font-semibold tabular-nums`, `description: text-sm text-fg-muted`. *(Marquee KPI display sizing — see Constraints below.)*
  - `xl` → `root: p-8 gap-2`, `label: text-sm`, `value: text-3xl font-semibold tabular-nums`, `description: text-sm text-fg-muted`. *(Marquee KPI display sizing — see Constraints below.)*
- `iconLeading` (boolean): when true (`hasIcon` is set), `root` switches to `flex items-start gap-3` with the icon as the first flex child and the content stack (`flex flex-col min-w-0 flex-1`) as the second. When false, the layout is a single vertical stack.

Base slot classes:
- `root`: `block text-fg` (or `flex …` when `iconLeading`).
- `header`: `flex items-center gap-1.5` (when icon is inline with the label; or just a marker wrapper when icon-leading kicks in).
- `label`: `text-fg-muted font-medium` (+ size-specific font-size).
- `value`: `text-fg block` + size-specific font + `tabular-nums` for numeric alignment.
- `description`: size-specific font + `text-fg-muted`.
- `delta`: `inline-flex items-center` — wraps the projected `<tw-stat-delta>`. Margin-top adjustment per size (`mt-1` at sm/md, `mt-2` at lg/xl).
- `footer`: `mt-3 pt-3 border-t border-border` — visually separates auxiliary content from the primary stack.

`defaultVariants`: `{ variant: 'outlined', size: 'md', iconLeading: false }`. Enable `twMerge`.

**Loading state styling:** when `loading()` is true, the template renders `<tw-skeleton>` instances inside the value, label, and delta regions. Use `<tw-skeleton>` directly — do not invent new placeholder primitives. Sizes:
- label skeleton → `<tw-skeleton width="40%" height="0.75rem" />` (matches label `text-xs` baseline).
- value skeleton → `<tw-skeleton [width]="loadingValueWidth()" [height]="loadingValueHeight()" />` where the dimensions track the size axis.
- delta skeleton → `<tw-skeleton width="3rem" height="1.25rem" />` shaped to match a badge.

### `StatDeltaComponent` — `tv()` slot config

Slots: `root`, `icon`, `text`, `comparison`.

**Variants:**
- `variant`: `'badge' | 'inline' | 'icon-only'`
  - `badge` → `root: inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium tabular-nums` + colored background/text per `effectiveColor()`.
  - `inline` → `root: inline-flex items-center gap-1 text-xs font-medium tabular-nums` (no chip background; foreground color follows effective color via `text-{color}-700`).
  - `icon-only` → `root: inline-flex items-center justify-center size-6` with only the chevron rendered; text/comparison hidden visually but still in the accessible name via `aria-label`.
- `effectiveColor`: an internal variant derived from `direction` + `inverted`:
  - `direction === 'neutral'` → `neutral`.
  - `direction === 'up' && !inverted` → `success`. `direction === 'up' && inverted` → `error`.
  - `direction === 'down' && !inverted` → `error`. `direction === 'down' && inverted` → `success`.

Compound variants render the soft-color combinations (mirroring badge's `soft` variant: `bg-{color}-soft text-{color}-soft-fg` for badge variant; `text-{color}-700` for inline). Keep the matrix small — three directions × `success | error | neutral` only.

**Icons (inline SVGs, not from `tw-icon` registry — single-purpose glyphs):**
- `up` → 12px chevron-up at xs/sm density (`size-3`); 16px (`size-4`) at md+. Use `size-3.5` if a half-step is needed and add the inline comment justifying it (CLAUDE.md half-step rule).
- `down` → mirrored chevron-down at same sizes.
- `neutral` → short horizontal-line glyph at the same sizes.

Always `shrink-0` on the SVG.

`defaultVariants`: `{ direction: 'neutral', inverted: false, variant: 'badge' }`. Enable `twMerge`.

### What NOT to style

- Do not extend the display-size scale beyond what this prompt codifies. The stat-value role permits `text-base` (sm), `text-lg` (md), `text-2xl` (lg), `text-3xl` (xl) — and ONLY for the stat value slot inside this component. No other component in the library may use `text-lg`, `text-xl`, `text-2xl`, or `text-3xl`. See Constraints for the rationale and the CLAUDE.md follow-up.
- Do not use raw palette colors for the delta — only `success-*`, `error-*`, `neutral-*` via the semantic tokens / soft-color tokens established in the alert and badge slot tables.
- No `dark:` overrides on surface/fg/border tokens — those handle dark mode automatically per CLAUDE.md.

## Accessibility

### `StatComponent`

- Host renders as `<dl>` semantically: set `'[attr.role]': '"group"'` is NOT used — instead, use the natural `<dl>` semantics by rendering the host as an actual `<dl>` element. Set the selector to match `dl` style: keep `tw-stat` as the element selector but **render a `<dl>` internally inside the host**, with `<dt>` for the label region and `<dd>` for the value (and a second `<dd>` for the description). The host element itself carries `role="group"` only when the consumer provides an `aria-labelledby` reference; default is no role so the inner `<dl>` semantics dominate.

  *Trade-off considered:* the cleanest alternative is to make `tw-stat` an attribute selector applied to a consumer's `<dl>` element. This was rejected because consumers should not have to know the underlying semantic — `tw-stat` is the canonical form. Render the `<dl>` inside the component template.

- Loading state: while `loading()` is true, the host carries `aria-busy="true"` and `aria-live="polite"`. The `<tw-skeleton>` placeholders inside use `[announce]="false"` (parent owns the announcement). When loading transitions back to false, the live region announces the resolved content automatically.

- No focus management — the tile is non-interactive by default. If a consumer projects an interactive element (a button-wrapped tile is a common dashboard pattern), they are responsible for the focus indicator on that element. The component does not register a host focus-ring style.

### `StatDeltaComponent`

- Host renders as `<span>` with `role="img"` and an `aria-label` that conveys the direction non-visually. The component composes the label as:
  - explicit `ariaLabel()` input wins if provided;
  - otherwise: `"{verb} by {textContent}{ comparison ? ' ' + comparisonLabel : ''}"` where `verb` is `"increased"` for `up`, `"decreased"` for `down`, `"unchanged"` for `neutral`.
  - Read the projected text via `viewChild` / `ElementRef` query on the inner `<span>` slot, fetched in `afterRenderEffect`. Re-compute when the projected text changes — if this proves brittle, accept an inline `aria-label` input and document that consumers should set it when projected content is dynamic.

- Color is conveyed by the icon glyph, not color alone — meets WCAG SC 1.4.1 Use of Color. The arrow's direction (up/down/horizontal) is the non-color cue.

- Decorative SVG inside: `aria-hidden="true"` on the SVG element since the host's `aria-label` already conveys direction.

- Focus: the delta is not interactive. No focus ring.

WCAG AA: every color combination from the soft-color slot tokens already passes AA in the default theme. AXE checks must pass — verify in the spec with a host fixture that asserts presence/absence of `role`, `aria-label`, `aria-busy` for each state.

## Implementation notes

- **Loading width/height computation:** `loadingValueWidth()` / `loadingValueHeight()` are `computed()` over `size()`. Keep widths in `rem`/percentage so they scale with the consumer's theme.
- **Slot detection:** use `contentChild(StatLabelDirective)`, `contentChild(StatValueDirective)`, etc., on the component. Each slot directive is a bare attribute-selector marker (`@Directive({ selector: '[twStatLabel]' })`) — no class binding from the parent unless the design needs it. The parent applies slot classes via the template wrapper around `<ng-content select="[twStatLabel]">`. *(Compare with empty-state's title/description as `TemplateRef`-capturing structural directives if dynamic-element semantics are needed; for stat, attribute selectors are sufficient because the wrapping `<dt>` / `<dd>` element is constant.)*
- **Delta detection on parent:** `contentChild(StatDeltaComponent)`. The parent renders `<ng-content select="tw-stat-delta">` inside the delta slot wrapper. When `loading()` is true, the projected delta is hidden via `@if (!loading())` and a skeleton is rendered in its place.
- **Footer always renders when projected**, even during loading — consumers may have their own skeleton inside (e.g., a sparkline skeleton).
- **`StatDeltaComponent` standalone use:** the delta should work as a standalone element outside a `tw-stat`. No `inject(StatComponent)` — the parent does not control the child.
- **Use `host: { ... }` for all bindings.** No `@HostBinding` / `@HostListener`. No `ngClass` / `ngStyle`.
- **No animations.** No DOM entry/exit — these tiles are typically rendered up-front in a dashboard grid.

## Form integration

N/A — display-only.

## File structure

Secondary entry point at `projects/ngx-tw/stat/`:

- `stat.ts` — `StatComponent`, `StatDeltaComponent`, and the slot directives (`StatLabelDirective`, `StatValueDirective`, `StatDescriptionDirective`, `StatIconDirective`, `StatFooterDirective`). Co-locate both component classes and all directives in one file per the alert/card pattern.
- `stat.spec.ts` — Vitest tests covering:
  - **Rendering:** default render with no slots; each `variant` value; each `size` value; each `StatDeltaDirection` × `inverted` combination; icon-leading layout when `[twStatIcon]` is present.
  - **Inputs:** `variant`, `size`, `loading` produce expected DOM changes (query for surface classes, skeleton presence, etc.). `StatDeltaComponent` `direction`, `inverted`, `variant`, `comparisonLabel`, `ariaLabel` produce expected DOM and ARIA changes.
  - **Outputs:** none — skip the section.
  - **Interactions:** none — display-only. Verify that no `(click)` / keyboard listeners are wired on the host.
  - **Accessibility:** host renders as `<dl>` (or contains one); `<dt>` and `<dd>` elements present for label/value/description; loading state sets `aria-busy="true"` and `aria-live="polite"`; loading state clears them when toggled off; `StatDeltaComponent` host carries `role="img"` and `aria-label` with the composed text; explicit `ariaLabel` input overrides the composed value; `inverted` does not flip the ARIA verb (direction's literal meaning is preserved — "decreased" still says "decreased" regardless of sentiment).
  - **Content projection:** projecting each slot directive renders the projected content in the correct region; absent slots render no markup for that region (use DOM queries, not class checks); footer renders even during loading; delta projection is hidden during loading and replaced with a skeleton.
  - **Standalone delta:** `tw-stat-delta` outside a `tw-stat` renders correctly with all its inputs.
  - No `fakeAsync` / `tick`. Use `async/await` with `await fixture.whenStable()`. Use `fixture.componentRef.setInput()` for signal inputs. Use `vi.spyOn()` for spies (none expected here, but for completeness).
- `index.ts` — re-export `StatComponent`, `StatDeltaComponent`, all slot directives, and the type exports (`StatVariant`, `StatDeltaDirection`, `StatDeltaVariant`).
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

## Public API exports

From `projects/ngx-tw/stat/index.ts`:

```ts
export {
  StatComponent,
  StatDeltaComponent,
  StatLabelDirective,
  StatValueDirective,
  StatDescriptionDirective,
  StatIconDirective,
  StatFooterDirective,
} from './stat';
export type { StatVariant, StatDeltaDirection, StatDeltaVariant } from './stat';
```

Add to `projects/ngx-tw/src/public-api.ts`:

```ts
export * from 'ngx-tw/stat';
```

(Insert in the same display-component grouping as `card`, `alert`, `empty-state`.)

## Constraints

- **Input cap respected.** `StatComponent` exposes 3 inputs (`variant`, `size`, `loading`). `StatDeltaComponent` exposes 5 (`direction`, `inverted`, `variant`, `comparisonLabel`, `ariaLabel`). Neither component qualifies for any of the four codified cap exceptions; both stay within the 5–6 limit by pushing label / value / description / prefix / suffix / formatter to content projection — the canonical library pattern (per CLAUDE.md: *"Content projection over inputs for rich content"*).
- **Value formatting is the consumer's job.** No `formatter` input, no `prefix` / `suffix` inputs. Consumers project pre-formatted strings or use Angular's `decimal` / `currency` / `percent` pipes inside `[twStatValue]`.
- **Loading is a flag, not a projected skeleton.** The component instantiates `<tw-skeleton>` internally because the dashboard ergonomic ("I have a `loading` signal") is overwhelmingly common. Consumers wanting a custom placeholder can omit `loading` and project their own skeleton inside `[twStatValue]`.
- **Sentiment inversion uses a boolean `inverted` input**, not a `'positive-up' | 'positive-down'` union — matches the library's boolean style and stays cap-friendly. The JSDoc on `inverted` must clearly state what gets inverted ("`down` becomes the success sentiment — use for metrics where lower is better").
- **`<dl>` / `<dt>` / `<dd>` semantic structure chosen over `role="group"` + `aria-labelledby`** — definition-list semantics are the screen-reader-tested convention used by Tailwind UI, Tremor, and Mantine for statistic tiles. The label is the term being defined; the value is its definition. Reserve `role="group"` only when the consumer needs to attach an external `aria-labelledby`.
- **No raw palette colors.** Delta colors use the soft-color slot tokens (`bg-{color}-soft`, `text-{color}-soft-fg`) and `text-{color}-700` for the inline variant, where `{color}` resolves to `success | error | neutral` after sentiment inversion.
- **No raw `neutral-*` shades.** Structural styling uses surface/fg/border tokens (`bg-surface`, `bg-surface-raised`, `bg-surface-muted`, `text-fg`, `text-fg-muted`, `border-border`).
- **No `@angular/animations`.** No DOM entry/exit animations on the tile.
- **OnPush change detection.** No `@HostBinding` / `@HostListener`. No constructor injection (none needed). No `ngClass` / `ngStyle`.

### Display typography — codified exception for stat value

The user confirmed the marquee KPI look (Tremor / Vercel / Linear pattern with display-size numbers). The stat value uses:

| Density | Value typography |
|---|---|
| `xs` | `text-sm font-semibold tabular-nums` |
| `sm` | `text-base font-semibold tabular-nums` |
| `md` | `text-lg font-semibold tabular-nums` |
| `xl` | `text-2xl font-semibold tabular-nums` (mapped to `lg` row in spec) |
| `xl` | `text-3xl font-semibold tabular-nums` |

This is a **deliberate, scoped exception to the codified typography table in CLAUDE.md**, which currently forbids `text-lg` and larger for component-internal text. The deviation is justified because:

1. A KPI tile's reason for existing is that the number must dominate the surrounding chrome — `text-base` reads as bold body text, not a metric.
2. The exception is narrowly scoped to the `value` slot of `tw-stat` only — no other component is permitted to climb above `text-base`.
3. The peer libraries we benchmark (Tremor, Mantine `<Stat>`, Tailwind UI "Stats", Vercel/Linear dashboards) all use display-size numbers for this exact role; staying within `text-base` would put ngx-tw visibly behind on this primitive.

**Follow-up:** the implementer (or a subsequent maintainer) should propose a CLAUDE.md amendment adding two rows to the typography table:

```
| Stat value (`tw-stat`) at `md` density | `text-lg`  | `font-semibold` |
| Stat value (`tw-stat`) at `lg` density | `text-2xl` | `font-semibold` |
| Stat value (`tw-stat`) at `xl` density | `text-3xl` | `font-semibold` |
```

…plus a paragraph clarifying that `text-lg` / `text-xl` / `text-2xl` / `text-3xl` remain forbidden everywhere else. The user authorized the deviation explicitly during prompt design; CLAUDE.md was not modified at design time because the .claude/ directory is gated against agent self-modification. Treat the amendment as a near-term follow-up, not a blocker for shipping the component.
