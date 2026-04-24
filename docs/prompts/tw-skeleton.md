# Prompt: Build `tw-skeleton` for ngx-tw

## Context

Before starting, read:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full conventions (Angular v21 signals, Tailwind v4, semantic + surface/fg/border tokens, `tv()` with `twMerge`, no `@angular/animations`, Vitest rules).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/spinner/spinner.ts` — closest sibling: small leaf presentational component with `tv()` slots, custom keyframes living in `theme/_base.css`, `motion-reduce:` handling, `aria-hidden`/`role="status"` accessibility wiring, `'inherit'`/`'current'` value escape hatches.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/separator/` — reference for a simple non-interactive presentational component with a single `tv()` config and host class binding.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/progress-bar/progress-bar.ts` — reference for declaring custom keyframe-driven utility classes (e.g. `animate-progress-bar-indeterminate`) and selecting them via `tv()` variants.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — the single home for keyframe definitions and the existing `@media (prefers-reduced-motion: reduce)` block. You will append new entries for `skeleton-pulse` and `skeleton-wave` here.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — shared `TwColor`, `TwSize` (skeleton does not use `TwColor`; it does use a custom radius scale).

No CDK modules required — skeleton is non-interactive, non-focusable, no overlay, no a11y service.

## What to build

A `tw-skeleton` component that renders a placeholder loading shape (gray block) where real content will eventually appear. It is the standard "shimmer" / "pulse" you see in modern UIs (Material, Radix, shadcn, Chakra) — used inside cards, lists, tables, and detail views to communicate "this region is loading" without layout jump when the real content arrives.

The component is a single leaf element (no content projection). It supports three shapes (`text`, `rectangle`, `circle`), three animation modes (`pulse` default, `wave`, `none`), arbitrary width / height via inputs (or via consumer classes), and an optional multi-line text mode that stacks N skeleton rows. Accessibility is built-in: by default the skeleton is hidden from assistive technology (a parent region typically owns the `aria-busy` announcement), with an opt-in `announce` mode that exposes `role="status"` + `aria-live="polite"` + a screen-reader label for stand-alone usage.

The skeleton inherits its color from the theme's `surface-muted` token, which automatically adapts to light/dark themes.

## API design

### Selector

`tw-skeleton` — element selector. `ChangeDetectionStrategy.OnPush`. Inline template.

### Types

Export from `skeleton.ts`:

```ts
/** Geometric shape of the skeleton placeholder. */
export type SkeletonShape = 'text' | 'rectangle' | 'circle';

/** Animation style applied to the skeleton. */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';
```

No `TwColor` input — the skeleton is intentionally monochrome (theme-driven `bg-surface-muted`) so it never competes with real content. If a consumer needs a custom tint, they can override via class merge (twMerge handles it).

### Inputs

All six inputs are kept under the 6-input guideline.

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `shape` | `SkeletonShape` | `'text'` | `/** Geometric shape of the placeholder. 'text' renders a short rectangle with text-line proportions; 'rectangle' a free-form block sized by width/height; 'circle' a perfect circle (avatar / icon placeholder). Defaults to 'text'. */` |
| `animation` | `SkeletonAnimation` | `'pulse'` | `/** Animation style. 'pulse' fades opacity in and out; 'wave' sweeps a shimmer across; 'none' renders a static block. All animations are halted under prefers-reduced-motion. Defaults to 'pulse'. */` |
| `width` | `string \| number \| undefined` | `undefined` | `/** Optional explicit width. Number is treated as pixels; string is passed through (e.g. '50%', '12rem', 'auto'). When undefined, the skeleton fills its container's width (or its shape default for circle). */` |
| `height` | `string \| number \| undefined` | `undefined` | `/** Optional explicit height. Number is treated as pixels; string is passed through. When undefined, the skeleton uses its shape default (text-line height for text, 1rem for rectangle, equal-to-width for circle). */` |
| `lines` | `number` | `1` | `/** Number of stacked text rows to render. Only applies when shape is 'text'. Values > 1 render N rows in a vertical stack with a 0.5rem gap; the last row is rendered at 60% width to mimic a paragraph's final line. Ignored for 'rectangle' and 'circle'. Defaults to 1. */` |
| `announce` | `boolean` | `false` | `/** When true, the skeleton announces itself as a busy live region via role="status", aria-busy="true", aria-live="polite", and the visually-hidden label text. When false (default), the skeleton is fully hidden from assistive technology with aria-hidden="true" — appropriate when a parent already owns the loading announcement. */` |

No outputs. No content projection. No `ControlValueAccessor`.

> **[CONFIRM]** The `announce` input defaults to `false` because in real-world skeleton usage (lists, cards, tables) the parent region almost always owns the loading announcement, and N skeleton elements all firing live announcements would be overwhelming. Confirm this default matches intent.

> **[CONFIRM]** No `label` input: when `announce` is true, the spoken text is hard-coded to `'Loading'`. If consumers need a custom announcement (e.g. `'Loading article'`), add a 7th `label` input. Recommendation: ship without it and add later if requested — keeps the API at 6 inputs.

> **[CONFIRM]** No `radius` input on `shape: 'rectangle'`. The default is `rounded-md`. Consumers wanting `rounded-lg` or `rounded-full` rectangles use a class override (twMerge resolves it). If a controlled radius proves common, add a 7th input mapping to `'none' | 'md' | 'lg' | 'full'`.

## Usage examples

```html
<!-- Simplest: a single text-line skeleton, default pulse animation -->
<tw-skeleton />
```

```html
<!-- Multi-line paragraph placeholder (last line auto-shortened to 60%) -->
<tw-skeleton [lines]="4" />
```

```html
<!-- Circle for avatar placeholder -->
<tw-skeleton shape="circle" [width]="40" [height]="40" />
```

```html
<!-- Rectangle for an image / card hero placeholder, full container width -->
<tw-skeleton shape="rectangle" height="12rem" />
```

```html
<!-- Wave (shimmer) animation -->
<tw-skeleton shape="rectangle" animation="wave" height="8rem" />
```

```html
<!-- Static (no animation) — useful for very dense lists or test snapshots -->
<tw-skeleton animation="none" [lines]="3" />
```

```html
<!-- Composed: a list-row skeleton (avatar + 2 text lines) -->
@for (_ of placeholderRows; track $index) {
  <div class="flex items-center gap-3 p-3">
    <tw-skeleton shape="circle" [width]="40" [height]="40" />
    <div class="flex-1">
      <tw-skeleton [lines]="2" />
    </div>
  </div>
}
```

```html
<!-- Stand-alone usage where this skeleton owns the loading announcement -->
<tw-skeleton shape="rectangle" height="20rem" announce />
```

## Styling

Single `tv()` config with **slots** so the multi-line text mode can style the row container and each row independently. Enable `twMerge: true`.

### `tv()` slots

```
root  — host wrapper. For shape='text' with lines>1, this becomes the column container holding rows.
              For shape='text' with lines=1, the host IS the rendered shape.
              For shape='rectangle' / 'circle', the host IS the rendered shape.
row   — only used when shape='text' and lines>1. One per stacked text line.
sr    — visually-hidden announcement label (rendered only when announce=true).
```

### Base classes

- `root` (single-shape mode, i.e. `shape!='text' || lines==1`):
  `block bg-surface-muted overflow-hidden relative isolate`
- `root` (multi-line text mode, i.e. `shape='text' && lines>1`):
  `flex flex-col gap-2`
  (the host is just a flex column; individual `row` elements carry the visible appearance)
- `row`:
  `block bg-surface-muted overflow-hidden relative isolate w-full`
- `sr`:
  `sr-only`

Use a `mode` variant inside `tv()` to switch between single-shape and multi-row, derived from `shape() !== 'text' || lines() === 1` in the component.

### Variants on the rendered shape (host in single mode, `row` slot in multi-line mode)

```
shape:
  text       → 'h-4 w-full rounded-md'   (default text-line height = 1rem)
  rectangle  → 'h-4 w-full rounded-md'   (consumer typically sets explicit height/width)
  circle     → 'rounded-full aspect-square'
                (height defaults to 2.5rem if neither width nor height inputs provided —
                 set this default via the inline style helper below, not via tv())

animation:
  pulse → 'skeleton-pulse'
  wave  → 'skeleton-wave'
  none  → ''
```

`defaultVariants`: `{ shape: 'text', animation: 'pulse' }`.

Apply variant classes to:
- the host (`'[class]': 'rootClasses()'`) when in single-shape mode,
- each `row` element via `[class]="rowClasses($index, lines())"` when in multi-line mode (the host gets only the column classes, no animation / shape).

The last row (when `lines > 1`) gets an additional `w-3/5` to mimic a paragraph's final short line. Encode this via a helper computed (e.g. `rowClass(index)`) that appends `w-3/5` for `index === lines() - 1`. Do not encode it via `compoundVariants` — keep the row-vs-host distinction explicit in the template.

### Inline style for explicit dimensions

Use a `style()` computed that produces a string `'width: …; height: …;'` for the `width` / `height` inputs. Pass numbers through as `${n}px`, strings through verbatim. Apply via `[style]="rootStyle()"` on the host (single mode) or via `[style]="rowStyle($index)"` on each row in multi-line mode (only the *first* row gets explicit width if provided — subsequent rows respect the `w-3/5` last-line rule). When `width` / `height` are undefined the style binding is an empty string.

> **[CONFIRM]** Width handling in multi-line text mode is opinionated: `width` applies to all but the last row, `lines>1`'s last row stays at `w-3/5`. Alternative: ignore `width` entirely when `lines>1`, expecting the consumer to compose the layout. Recommendation: ship the opinionated default — it's the common case.

### Animation classes — define in `projects/ngx-tw/theme/_base.css`

Append alongside the existing animation declarations (after the spinner block, before `progress-bar-indeterminate`):

```css
/* ── Skeleton ── */

/* Pulse: gentle opacity fade. Theme-friendly; works on any background color. */
@keyframes tw-skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
.skeleton-pulse {
  animation: tw-skeleton-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Wave: shimmer band sweeps left-to-right via an absolutely-positioned
   gradient pseudo-element. Requires the host to be `position: relative;
   overflow: hidden;` (already on .skeleton base classes). */
@keyframes tw-skeleton-wave {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.skeleton-wave::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgb(255 255 255 / 0.08) 50%,
    transparent 100%
  );
  animation: tw-skeleton-wave 1.6s linear infinite;
}
```

> **[CONFIRM]** The wave gradient uses `rgb(255 255 255 / 0.08)` — a low-alpha white band that reads on both light and dark surface-muted backgrounds without needing a separate dark-mode rule. Verify visual contrast in the dark theme; if needed, add a `[data-theme="dark"] .skeleton-wave::after` override using `currentColor` or a darker tint.

Append to the existing `@media (prefers-reduced-motion: reduce)` block at the bottom of `_base.css`:

```css
.skeleton-pulse,
.skeleton-wave::after {
  animation-duration: 0ms;
  animation-iteration-count: 1;
}
```

The skeleton remains visible (background is the static `bg-surface-muted`) so users still get the placeholder affordance — only the motion stops.

## Accessibility

The skeleton has two distinct accessibility modes, chosen by the `announce` input.

### Default — `announce = false` (opaque to assistive tech)

This is the common case: the skeleton is one of many placeholders inside a parent region whose own `aria-busy` / `aria-live` announces the load. Multiple competing live regions would over-announce.

Host attributes (always-on when `announce` is false):
- `aria-hidden="true"`
- no `role`, no `aria-label`, no `aria-live`, no `tabindex`

The skeleton becomes a purely decorative shape that screen readers skip entirely. The consumer is responsible for the parent announcement (e.g. wrapping the loading region in `<div aria-busy="true" aria-live="polite">`).

### Opt-in — `announce = true` (stand-alone busy region)

Used when this skeleton is the only loading affordance for its region (e.g. a single hero placeholder).

Host attributes:
- `role="status"`
- `aria-busy="true"`
- `aria-live="polite"`
- a child `<span class="sr-only">Loading</span>` is rendered (announcement text is fixed to `'Loading'` — see `[CONFIRM]` on the `label` input above)

### Always

- The skeleton is non-interactive: no `tabindex`, no focus ring, no keyboard handling.
- All decorative children (rows, the wave's `::after` band) are CSS-only and inherit `aria-hidden` from the host (or the parent in announce-true mode).
- `prefers-reduced-motion` halts the animation but the placeholder stays visible.

Must pass AXE in both modes.

## Implementation notes

- Single `@Component` with `selector: 'tw-skeleton'`, `ChangeDetection.OnPush`, inline template. No `OnInit`/`OnDestroy`. No DI.
- All six inputs are `input()` signals. No `model()` — the skeleton has no two-way state. No `linkedSignal()` — every derived value is purely computed from inputs.
- Derive `mode` (`'single' | 'multi'`) via a `computed()`: `shape() === 'text' && lines() > 1 ? 'multi' : 'single'`.
- Derive `rootClasses()` via a `computed()` that branches on `mode()`. In single mode it returns the shape + animation utilities. In multi mode it returns the column container classes (no shape, no animation on the host).
- Derive `rowClass(index)` (a method, NOT a computed — it takes an arg) that returns the per-row class string. The animation class is applied per row so each row pulses/waves in sync.
- Derive `rootStyle()` and `rowStyle(index)` computeds/methods returning the inline `width`/`height` declarations. Numeric inputs → `${n}px`. String inputs pass through. Undefined → empty string.
- Host bindings via the `host:` object:
  - `'[class]': 'rootClasses()'`
  - `'[style]': 'rootStyle()'` (always; resolves to `''` in multi-row mode where dimensions belong to rows)
  - `'[attr.aria-hidden]': "announce() ? null : 'true'"`
  - `'[attr.role]': "announce() ? 'status' : null"`
  - `'[attr.aria-busy]': "announce() ? 'true' : null"`
  - `'[attr.aria-live]': "announce() ? 'polite' : null"`
- Template:
  ```
  @if (mode() === 'multi') {
    @for (_ of rowsArray(); track $index) {
      <span [class]="rowClass($index)" [style]="rowStyle($index)"></span>
    }
  }
  @if (announce()) {
    <span class="sr-only">Loading</span>
  }
  ```
  In single mode the host element itself is the visible shape — no inner element is needed except the optional sr-only span. In multi mode the host is the container; `<span>` rows are the visible shapes.
- `rowsArray()` is a `computed()` returning `Array(lines()).fill(0)` so `@for` can iterate.
- Never compute classes via string concatenation — go through the `tv()` config and `twMerge`.
- No CDK imports.

## File structure

Create under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/skeleton/`:

- `skeleton.ts` — `SkeletonComponent`, `SkeletonShape`, `SkeletonAnimation` types.
- `skeleton.spec.ts` — Vitest tests (see coverage below).
- `index.ts` — public exports.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Also:

- Append the `tw-skeleton-pulse` / `tw-skeleton-wave` keyframes and the reduced-motion entries to `projects/ngx-tw/theme/_base.css` exactly as specified under "Animation classes" above.
- Reference no shared types (skeleton has its own `SkeletonShape` / `SkeletonAnimation` and intentionally does not consume `TwColor` or `TwSize`).

### Test coverage (`skeleton.spec.ts`)

Cover:

- **Default render:** mounts without inputs; host has `aria-hidden="true"`, no `role`, no `tabindex`; element has the `bg-surface-muted` and `skeleton-pulse` utility classes; default shape is text-line height (`h-4 w-full rounded-md`).
- **Each `SkeletonShape`:** `'text'` renders the host as the visible shape with `rounded-md`; `'circle'` renders with `rounded-full aspect-square`; `'rectangle'` renders with `rounded-md` and respects width/height inputs.
- **Each `SkeletonAnimation`:** `'pulse'` applies the `skeleton-pulse` class; `'wave'` applies the `skeleton-wave` class; `'none'` applies neither animation class.
- **`width` / `height` inputs:** numeric values produce `width: <n>px` / `height: <n>px` in the inline `style` attribute; string values pass through verbatim (`'12rem'`, `'50%'`); undefined yields no inline style for that property.
- **`lines` input:**
  - `lines = 1` (or unset) renders the host as a single shape with no child row spans (other than the optional sr-only span).
  - `lines = 3` with `shape = 'text'` renders 3 row spans inside the host; the host itself loses the shape/animation classes and gains the column container classes (`flex flex-col gap-2`).
  - The third (last) row span has the `w-3/5` class; the first two do not.
  - `lines > 1` is ignored when `shape = 'rectangle'` or `'circle'` — host renders as the single shape.
- **`announce` input:**
  - `false` (default): host has `aria-hidden="true"` and no `role`; no `sr-only` label child is rendered.
  - `true`: host has `role="status"`, `aria-busy="true"`, `aria-live="polite"`, no `aria-hidden`; an `sr-only` child contains the text `'Loading'`.
- **Reduced-motion:** assert that the rendered shape carries the `skeleton-pulse` / `skeleton-wave` class. Do NOT mock `matchMedia` — the reduced-motion behavior is owned by `_base.css` and is verified by the class string presence (the CSS rule does the rest).
- **Class string updates** when inputs change (use `fixture.componentRef.setInput(name, value)` then `fixture.detectChanges()`; query the DOM, not internal signal values).
- **Non-interactive:** no `tabindex` attribute; clicking the element emits no events; the component class has no outputs.

**No `fakeAsync` / `tick`.** Use `async`/`await` with `fixture.whenStable()` if needed. There is nothing async to wait for in this component.

## Public API exports

In `projects/ngx-tw/skeleton/index.ts`:

```ts
export { SkeletonComponent } from './skeleton';
export type { SkeletonShape, SkeletonAnimation } from './skeleton';
```

In `projects/ngx-tw/src/public-api.ts`, add (place near the other leaf presentational entries — after `progress-bar`, alongside `spinner`):

```ts
export * from 'ngx-tw/skeleton';
```

## Constraints

- Standalone component. Do **not** set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush`. Inline template.
- Signal APIs only: `input()`, `computed()`. No `model()`, no `linkedSignal()`, no `mutate`.
- Host bindings via the `host:` object — never `@HostBinding` / `@HostListener`.
- Native control flow only (`@if`, `@for`). No `ngClass` / `ngStyle`. No arrow functions in templates.
- Tailwind utilities only — no component CSS files. Use surface/fg/border tokens (`bg-surface-muted`) for the placeholder background — never raw `neutral-*` shades, never raw palette colors.
- `tv()` config must include `defaultVariants` and pass `{ twMerge: true }` as the second argument.
- Visual tokens conform to the Visual Design System in CLAUDE.md:
  - radius: `rounded-md` for text/rectangle, `rounded-full` for circle (no other values introduced),
  - heights: `h-4` (text default — matches `text-sm` line height),
  - gaps: `gap-2` between stacked text rows,
  - opacity: animation `opacity` keyframe range `1 → 0.5 → 1` (does not introduce a new opacity scale; runtime animation only).
- Keyframes for `skeleton-pulse` and `skeleton-wave` live exclusively in `projects/ngx-tw/theme/_base.css` — never in a component file.
- Every `input()` has a one-line JSDoc.
- Vitest runner: no `fakeAsync` / `tick`; use `vi.spyOn`, `async/await`, `fixture.whenStable()`.
- No `@angular/animations`. No CDK dependencies.
