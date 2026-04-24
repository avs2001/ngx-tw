# Prompt: Build `tw-progress-bar` for ngx-tw

## Context

Read before starting:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full project conventions (Angular v21 signals, Tailwind v4 semantic + surface/fg/border tokens, `tv()` with `twMerge`, no `@angular/animations`, Vitest rules without `fakeAsync`, Visual Design System).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — shared `TwColor` type.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/badge/badge.ts` — reference for slotted `tv()` with colour × variant `compoundVariants` and `computed()` per-slot class exposure.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/alert/alert.ts` — reference for slot-aware component with structural regions gated via `contentChild()` presence checks and semantic colour variants.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/tabs/tabs.ts` — reference for the static `Record<TwColor, string>` lookup pattern used to keep Tailwind v4 class scanning happy when colour-driven classes must live outside the `tv()` config.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — where the indeterminate keyframe must be added, alongside the existing `prefers-reduced-motion` block.

No CDK modules are required. `LiveAnnouncer` is intentionally **not** used — browsers already announce `role="progressbar"` state changes through the ARIA progressbar pattern, and polling announcements would be noisy.

## What to build

A progress bar component (`<tw-progress-bar>`) that visualises task completion as a horizontal bar, a stepped sequence, or an indeterminate sweep. It supports the full `TwColor` palette, a bespoke three-step size scale (`sm | md | lg`) mapped to bar thickness, optional visible value caption, a consumer-supplied value formatter, and full determinate/indeterminate ARIA semantics.

The component is visually composed of slots (`root`, `header`, `label`, `valueText`, `rail`, `fill`, `segmentList`, `segment`) so consumers can override any slot's classes via class merging. The determinate mode animates the fill width. The indeterminate mode runs a named CSS keyframe defined in the theme. Segmented mode renders a fixed number of equal cells with a small gap between them and fills cells all-or-nothing based on progress. A label caption and value caption are optional: if either is provided, a header row renders above the bar.

Progress bars are for **measurable progress** (or will-be-measurable-once-we-start). For unknown-duration operations (e.g., a menu popover loading its items, a fetch before headers arrive) the `spinner` component is the correct choice — document this distinction in the "Composition usecases" section.

## API design

### Selector

`tw-progress-bar` — element selector, standalone component, `ChangeDetectionStrategy.OnPush`.

### Exported types

```ts
/** Visual style of the progress bar. */
export type ProgressBarVariant = 'linear' | 'segmented';

/** Size scale specific to progress bars (bar thickness). */
export type ProgressBarSize = 'sm' | 'md' | 'lg';

/** Function signature for formatting the visible / announced progress value. */
export type ProgressBarValueFormatter = (value: number, max: number, min: number) => string;
```

`ProgressBarSize` is intentionally narrower than `TwSize`. Bar thicknesses of `h-1`, `h-2`, `h-3` cover every real-world use; `xs` and `xl` don't produce meaningfully different bars.

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `value` | `number \| null \| undefined` | `null` | `/** Current progress value. When null or undefined, the bar renders indeterminate. Values outside [min, max] are clamped. */` |
| `min` | `number` | `0` | `/** Lower bound of the value range. Defaults to 0. */` |
| `max` | `number` | `100` | `/** Upper bound of the value range. Defaults to 100. */` |
| `variant` | `ProgressBarVariant` | `'linear'` | `/** Visual style of the bar. 'linear' renders a single fill; 'segmented' splits the rail into discrete steps. Defaults to 'linear'. */` |
| `color` | `TwColor` | `'primary'` | `/** Semantic colour of the filled portion. Defaults to 'primary'. Use status colours (success/warning/error) to reflect task outcome. */` |
| `size` | `ProgressBarSize` | `'md'` | `/** Bar thickness. 'sm' = h-1, 'md' = h-2, 'lg' = h-3. Defaults to 'md'. */` |
| `segments` | `number` | `5` | `/** Number of equal cells when variant is 'segmented'. Ignored for 'linear'. Defaults to 5. */` |
| `label` | `string \| undefined` | `undefined` | `/** Visible label rendered above the bar. When set, the bar is wired to the label via aria-labelledby. */` |
| `showValue` | `boolean` | `false` | `/** When true, renders the formatted progress value next to the label. Defaults to false. */` |
| `valueFormatter` | `ProgressBarValueFormatter \| undefined` | `undefined` | `/** Custom formatter for the displayed and announced value. Default formats as an integer percentage, e.g. '42%'. */` |
| `ariaLabel` | `string \| undefined` | `undefined` | `/** Accessible name when no visible label is provided. Mirrored to aria-label on the progressbar element. */` |
| `ariaLabelledby` | `string \| undefined` | `undefined` | `/** ID of an external element that labels the progress bar. Mirrored to aria-labelledby. */` |

### Outputs

None. Progress bars do not originate user interactions.

### Content projection

None. The label and value captions are input-driven — they are plain text and a formatter function is a better fit than content projection for this component.

## Usage examples

```html
<!-- Simplest case: a 40%-complete bar with default styling -->
<tw-progress-bar [value]="40" />
```

```html
<!-- Indeterminate (value omitted) while loading an initial payload -->
<tw-progress-bar label="Fetching records" />
```

```html
<!-- Upload progress with a custom formatter showing byte counts -->
<tw-progress-bar
  label="Uploading report.pdf"
  [value]="uploaded()"
  [max]="total()"
  [showValue]="true"
  [valueFormatter]="formatBytes"
  color="info"
/>
```

```html
<!-- Multi-step wizard via segmented variant -->
<tw-progress-bar
  label="Onboarding"
  variant="segmented"
  [segments]="4"
  [value]="step() * 25"
  [showValue]="false"
  color="primary"
/>
```

```html
<!-- Task complete: static 100% with success colour -->
<tw-progress-bar
  label="Backup"
  [value]="100"
  [showValue]="true"
  color="success"
  size="sm"
/>
```

```html
<!-- Task failed: error colour at the point of failure -->
<tw-progress-bar
  label="Backup"
  [value]="63"
  [showValue]="true"
  color="error"
  size="sm"
/>
```

```html
<!-- Skill / rating display (non-interactive, static value) -->
<tw-progress-bar [value]="72" ariaLabel="TypeScript proficiency" size="sm" color="accent" />
```

```html
<!-- Inline inside a list row: compact size, no label -->
<li class="flex items-center gap-3">
  <span class="text-sm text-fg flex-1 min-w-0 truncate">annual-report-2026.zip</span>
  <tw-progress-bar class="w-40" [value]="row.progress" size="sm" ariaLabel="File upload progress" />
</li>
```

## Styling

Use `tv()` with **slots**. Enable `twMerge: true`. Colour × variant styling comes from a small static lookup (see "Static fill-colour lookup" below) so Tailwind v4 can scan every class string.

### `tv()` slots

```
root         — outer wrapper; flex column; gap-1.5 when header is present
header       — horizontal flex row holding label + value text; justify-between
label        — label text
valueText    — formatted value text
rail         — the unfilled background track (linear variant) or empty (segmented)
fill         — the filled portion (linear variant only)
segmentList  — flex row of segment cells (segmented variant only)
segment      — individual cell (segmented variant only); variant-driven classes apply 'filled' or 'empty'
```

### `tv()` base classes (per slot)

- `root`: `flex flex-col w-full`
- `header`: `flex items-center justify-between gap-3`
- `label`: `text-xs text-fg-muted`
- `valueText`: `text-xs text-fg-muted font-medium tabular-nums`
- `rail`: `relative w-full overflow-hidden rounded-full bg-surface-muted`
- `fill`: `absolute inset-y-0 left-0 rounded-full`
- `segmentList`: `flex w-full gap-1`
- `segment`: `flex-1 rounded-full bg-surface-muted`

### `tv()` variants

```
size:
  sm → rail: 'h-1',  segment: 'h-1'
  md → rail: 'h-2',  segment: 'h-2'
  lg → rail: 'h-3',  segment: 'h-3'

variant:
  linear    → segmentList: 'hidden'
  segmented → rail: 'hidden'

isIndeterminate:
  true  → fill: 'w-[30%] animate-progress-bar-indeterminate'   // custom class; see theme additions
  false → fill: 'transition-[width] duration-200 motion-reduce:transition-none'

hasHeader:
  true  → root: 'gap-1.5'
  false → root: 'gap-0'
```

`defaultVariants`: `{ size: 'md', variant: 'linear', isIndeterminate: false, hasHeader: false }`.

### Static fill-colour lookup

Mirror the tabs pattern (`UNDERLINE_ACTIVE_HORIZONTAL` etc.). Tailwind v4 scans class strings statically, so colour-driven utilities must live in literal `Record<TwColor, string>` tables — not concatenated at runtime:

```ts
const FILL_COLORS: Record<TwColor, string> = {
  primary:   'bg-primary-500',
  secondary: 'bg-secondary-500',
  accent:    'bg-accent-500',
  neutral:   'bg-fg',
  info:      'bg-info-500',
  success:   'bg-success-500',
  warning:   'bg-warning-500',
  error:     'bg-error-500',
};
```

Apply `FILL_COLORS[color()]` to both the `fill` slot (linear) and to filled `segment` cells (segmented). Empty segments keep `bg-surface-muted` from the base class.

### Wiring

- A `computed()` produces the tv result. Per-slot computeds (`rootClasses`, `railClasses`, `fillClasses`, `segmentListClasses`, etc.) combine tv output with the static colour lookup where needed.
- The host element renders the visible wrapper; `[class]` binds to `rootClasses()`.
- The `fill` element uses `[style.width.%]="progressRatio() * 100"` in determinate mode. In indeterminate mode the tv config strips the width transition and applies the `animate-progress-bar-indeterminate` class, which drives width + transform via the keyframe (see "Theme CSS additions"). Do **not** bind `style.width` when indeterminate — the keyframe owns the width.
- The `segment` cells are rendered by `@for (i of segmentIndices(); track i)`, where `segmentIndices = computed(() => Array.from({ length: segments() }, (_, i) => i))`. Each cell receives an `[class]` binding that appends the colour lookup when `(i + 1) / segments() <= progressRatio()`.
- All visual tokens (radius `rounded-full`, gap `gap-1`, font sizes `text-xs`, transitions `duration-200 motion-reduce:transition-none`) come from the Visual Design System in CLAUDE.md — no new values.

## Accessibility

- **Role:** the visible rail element (not the component host) carries `role="progressbar"`. The host stays a plain container so the header (label + value) sits outside the ARIA progressbar subtree.
- **Required ARIA on the progressbar element:**
  - `aria-valuemin` = `min()`
  - `aria-valuemax` = `max()`
  - Determinate: `aria-valuenow` = clamped `value()`; `aria-valuetext` = formatted value (e.g. `"3.2 MB of 10 MB"` or `"42%"`).
  - Indeterminate: **omit** `aria-valuenow` entirely (ARIA 1.2 requires absence, not `null`). Set `aria-busy="true"` on the progressbar element.
- **Labelling precedence** (exactly one resolves at runtime):
  1. If `label()` is set → render a `<span id="tw-progress-bar-{n}-label">{{ label }}</span>` in the header, and bind `aria-labelledby` on the progressbar element to that id.
  2. Else if `ariaLabelledby()` is set → bind `aria-labelledby` on the progressbar to that value.
  3. Else if `ariaLabel()` is set → bind `aria-label` on the progressbar.
  4. Otherwise → in dev mode (`isDevMode()`) emit `console.warn` once per component instance explaining that the progressbar needs an accessible name.
- **Value announcement:** `aria-valuetext` is set regardless of `showValue` so assistive tech announces a meaningful string even when the caption is hidden. The visible `valueText` span is only rendered when `showValue()` is true.
- **Reduced motion:** the indeterminate keyframe honours `prefers-reduced-motion` via the theme CSS (see below). Determinate width transitions use `motion-reduce:transition-none`.
- **Contrast:** the rail uses `bg-surface-muted` (≥ 3:1 against `bg-surface` in the default theme); the fill uses `{color}-500` which meets ≥ 3:1 for non-text UI against the rail for every palette in `_semantic.css`. Keep these tokens; AXE must pass.
- Must pass AXE checks in both determinate and indeterminate modes.

## Theme CSS additions

Add to `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css`, in the "Animation keyframes" block:

```css
/* Indeterminate progress bar — a 30%-wide chip slides from left edge to right edge. */
@keyframes progress-bar-indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
.animate-progress-bar-indeterminate {
  animation: progress-bar-indeterminate 1.5s linear infinite;
  /* Fill keeps its tv-provided w-[30%]; only transform changes. */
}
```

And extend the existing `@media (prefers-reduced-motion: reduce)` block near the bottom of the file:

```css
@media (prefers-reduced-motion: reduce) {
  /* ...existing rules... */
  .animate-progress-bar-indeterminate {
    animation-duration: 0ms;
    transform: translateX(35%); /* static centred chip */
  }
}
```

No changes to the semantic tokens in `_semantic.css`.

## Implementation notes

- Clamp the raw `value()` to `[min(), max()]` inside a `clampedValue = computed(() => {...})`. If the raw value is `null`/`undefined`, `isIndeterminate` is true and `clampedValue` is irrelevant (do not expose it in bindings).
- `progressRatio = computed(() => {`
  - `if (isIndeterminate()) return 0;`
  - `const range = max() - min(); return range <= 0 ? 0 : (clampedValue() - min()) / range;`
  - `});`
- `formattedValue = computed(() => { const fmt = valueFormatter() ?? defaultFormatter; return fmt(clampedValue(), max(), min()); })` where `defaultFormatter = (v, mx, mn) => ${Math.round(((v - mn) / (mx - mn)) * 100)}%`. Only called when the mode is determinate.
- `hasHeader = computed(() => !!label() || showValue())`. Drives the `hasHeader` variant and `@if` gate on the header row.
- Determinate width binding: `[style.width.%]="progressRatio() * 100"` on the fill slot, gated by `@if (!isIndeterminate())`. In indeterminate mode a separate `<span>` with only the tv classes (no inline width style) renders — the `w-[30%]` class from the `isIndeterminate=true` variant plus the `animate-progress-bar-indeterminate` class own both width and transform.
- Unique id generation: `let nextId = 0;` at module scope; each instance takes `tw-progress-bar-${nextId++}` and uses it to derive the label id when the `label` input is set.
- Dev-mode accessible-name warning: only fire when **none** of `label`, `ariaLabel`, `ariaLabelledby` is provided, and only once per instance (guard with a `warned` private field). Use `isDevMode()` from `@angular/core`.
- No `@angular/animations`. No `LiveAnnouncer`. No CDK imports.
- Host bindings via the `host:` object only — never `@HostBinding`/`@HostListener`. No keyboard handlers (not interactive).
- Content flow rules from CLAUDE.md: native `@if` / `@for`; no `ngClass` / `ngStyle`; no arrow functions in templates.

## Composition usecases

Document these in a short comment block at the top of `progress-bar.ts` (so consumers reading the source see guidance):

- **Upload progress** — determinate linear bar with `valueFormatter` returning `"3.2 MB / 10 MB"` style labels and `showValue=true`.
- **Multi-step wizard** — `variant="segmented"` with `segments` equal to the step count; `value` derived from the current step.
- **Skill / rating display** — static determinate linear bar with `ariaLabel` and no visible label.
- **Inline in a list row** — compact `size="sm"`, no label, `class="w-40"` to constrain the width, per-row `ariaLabel`.
- **Card footer task completion** — linear bar with `showValue=true`, colour switched to `success` when complete or `error` on failure.
- **Indeterminate loading before first byte** — omit `value`; the bar sweeps. Use only when work is happening but cannot yet be measured.

And this contrast with `spinner`: the spinner is for **unknown-duration, non-progress** signals (optimistic UI spinners on a button, menu loading items, small inline busy indicators). If you can measure the work, or will be able to measure it shortly, use `tw-progress-bar` (indeterminate initially if needed). The `spinner` component is a separate artifact and is not built in this prompt.

## File structure

Create the following under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/progress-bar/`:

- `progress-bar.ts` — `ProgressBarComponent`, `ProgressBarVariant`, `ProgressBarSize`, `ProgressBarValueFormatter`, `FILL_COLORS` lookup, `tv()` config.
- `progress-bar.spec.ts` — Vitest tests (see below).
- `index.ts` — re-exports the public API.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

And modify:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — add the keyframe and reduced-motion override from "Theme CSS additions".
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/progress-bar';`.

Reference `TwColor` from `ngx-tw/core` — do not redefine.

### Test coverage (`progress-bar.spec.ts`)

Cover:

- Default render: mounts without inputs, host renders a `role="progressbar"` element with `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-busy="true"` (defaults to indeterminate because `value` is null), and no `aria-valuenow`.
- Determinate mode: setting `value=50` renders `aria-valuenow="50"` and `aria-valuetext="50%"`; no `aria-busy`. Fill element has inline `style="width: 50%"`.
- Value 0 and value 100 render the correct width and ARIA values.
- Clamping: `value=-10` clamps to `min`; `value=150` (with default max) clamps to `max`. ARIA reflects clamped values.
- Custom `min`/`max`: `min=10 max=20 value=15` computes 50% width and `aria-valuenow="15"`.
- Indeterminate: passing `null` or `undefined` removes `aria-valuenow` from the DOM, sets `aria-busy="true"`, and the fill element has the `animate-progress-bar-indeterminate` class.
- Switching from indeterminate to a number: `aria-busy` disappears; `aria-valuenow` appears; fill no longer has the animation class.
- Each `color` (all 8) and each `size` (`sm`, `md`, `lg`) renders without error.
- `variant="linear"` renders the `rail` element and not the `segmentList`. `variant="segmented"` renders `segmentList` with `segments` children and not the `rail`.
- `segmented`: with `segments=5` and `value=40` (max=100), exactly 2 cells have the filled colour class and 3 have the muted class. With `value=100`, all 5 are filled. With `value=0`, none are filled.
- `showValue=true` renders the formatted value text; changing `value` updates the visible text. `showValue=false` hides the text but `aria-valuetext` is still set on the progressbar.
- `valueFormatter` is called when provided: `valueFormatter = (v, mx) => \`${v}/${mx}\`` makes the visible text and `aria-valuetext` reflect the custom format.
- `label` input renders a `<span>` whose `id` is referenced by the progressbar's `aria-labelledby`.
- `ariaLabel` input mirrors to `aria-label` on the progressbar when no `label` and no `ariaLabelledby` are set.
- `ariaLabelledby` input mirrors to `aria-labelledby` on the progressbar when no `label` is set.
- Dev-mode warning: with `isDevMode()` true and none of `label` / `ariaLabel` / `ariaLabelledby` provided, `console.warn` is called once. With any of them set, no warning.
- **No `fakeAsync` / `tick`.** For any assertion that depends on signal propagation, use `await fixture.whenStable()` after `fixture.componentRef.setInput(...)` and `fixture.detectChanges()`. Use `vi.spyOn(console, 'warn')` for the warning test.

## Public API exports

In `projects/ngx-tw/progress-bar/index.ts`:

```ts
export { ProgressBarComponent } from './progress-bar';
export type {
  ProgressBarVariant,
  ProgressBarSize,
  ProgressBarValueFormatter,
} from './progress-bar';
```

In `projects/ngx-tw/src/public-api.ts`, append:

```ts
export * from 'ngx-tw/progress-bar';
```

## Constraints

- Standalone component. Do **not** set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush`.
- Signal-based APIs only: `input()`, `computed()`. No `model()` (no two-way binding needed). No `linkedSignal()` (no writable-derived state).
- `inject()` for DI if any is needed. No constructor injection.
- Host bindings via the `host:` object. Never `@HostBinding` / `@HostListener`.
- Native control flow only (`@if`, `@for`). No `ngClass` / `ngStyle`. No arrow functions in templates.
- Tailwind utilities only — no component CSS files. Use semantic tokens (`primary-*`, `info-*`, etc.) and surface/fg/border tokens (`bg-surface-muted`, `text-fg-muted`, `border-border`). Never raw palette colours. Never raw `neutral-*` shades for structural styling.
- `tv()` config must include `defaultVariants` and pass `{ twMerge: true }` as the second argument.
- Visual tokens (radius `rounded-full`, size heights `h-1 h-2 h-3`, gap `gap-1 gap-1.5`, font size `text-xs`, transitions `duration-200 motion-reduce:transition-none`, `tabular-nums` for the value caption) match the Visual Design System in CLAUDE.md exactly.
- Every `input()` and exported type has a one-line JSDoc.
- Indeterminate animation lives in `projects/ngx-tw/theme/_base.css`, not in the component.
- No `@angular/animations`. No CDK imports.
- Vitest runner: no `fakeAsync` / `tick`; use `vi.spyOn`, `async/await`, `fixture.whenStable()`.
