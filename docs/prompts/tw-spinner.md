# Prompt: Build `tw-spinner` for ngx-tw

## Context

Before starting, read:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full conventions (Angular v21 signals, Tailwind v4, semantic + surface/fg/border tokens, `tv()` with `twMerge`, no `@angular/animations`, Vitest rules).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — shared `TwColor`, `TwSize`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/icon/icon.ts` — reference pattern for a small single-element visual component: `TwIconColor = TwColor | 'current'`, size → pixel map, `color: 'current'` default, `tv()` config, host class binding, `aria-label` input.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/badge/badge.ts` — reference pattern for `tv()` slots + `compoundVariants` iterating every `TwColor`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/button/button.ts` — existing `loading` input on the button directive; the spinner's button-integration recipe composes with this.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/form-field/form-field.ts` — `SuffixDirective` / `PrefixDirective` registered on `[slot="prefix"]` and `[slot="suffix"]`; the form-field recipe projects `<tw-spinner slot="suffix" />` there.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — existing animation classes (`fade-in`, `scale-in`, etc.) with their `prefers-reduced-motion` handling. You will add keyframe definitions for the `dots` and `bars` variants here.

Tailwind v4 ships `animate-spin` out of the box (it declares `@keyframes spin` globally), so the default **circular** variant needs no custom keyframes. The `dots` and `bars` variants do — define those in `theme/_base.css`.

No CDK modules are required for this component.

## What to build

A small, accessible, theme-aware spinner component (`<tw-spinner>`) used to indicate indeterminate progress. It is designed to compose cleanly inside other ngx-tw components:

- Inside a `<button twButton [loading]="true">` to show a pending action.
- Inside a `<tw-form-field>` as `[slot="suffix"]` / `[slot="prefix"]` to indicate async validation or pending load.
- Inline with text ("Saving…"), inside menu items, centered in cards, or as a full-surface overlay via a consumer wrapper.

The component is a single element from the consumer's perspective. It supports three visual variants (`circular` default, `dots`, `bars`), the standard `TwColor` palette plus a `'current'` value that inherits `currentColor` (essential for button and prefix/suffix composition), the standard `TwSize` scale plus an `'inherit'` value that sizes the spinner from the surrounding font (`1em` × `1em`) for text-inline usage, and a `track` toggle for the circular variant. Accessibility is built in: `role="status"`, a localizable screen-reader label, and full `prefers-reduced-motion` support.

## API design

### Selector

`tw-spinner` — element selector. `ChangeDetectionStrategy.OnPush`. Inline template.

### Types

Export from `spinner.ts`:

```ts
/** Visual style of the spinner. */
export type SpinnerVariant = 'circular' | 'dots' | 'bars';

/** Semantic color for the spinner. `'current'` inherits from parent `color` (text/currentColor). */
export type SpinnerColor = TwColor | 'current';

/** Size of the spinner. `'inherit'` sizes the spinner to `1em` so it scales with the surrounding font. */
export type SpinnerSize = TwSize | 'inherit';
```

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `variant` | `SpinnerVariant` | `'circular'` | `/** Controls the visual style of the spinner. Defaults to 'circular'. */` |
| `color` | `SpinnerColor` | `'current'` | `/** Semantic color. 'current' inherits the surrounding text color — required for composition inside buttons and form-field prefix/suffix slots. Defaults to 'current'. */` |
| `size` | `SpinnerSize` | `'md'` | `/** Sets the spinner dimensions. 'inherit' sizes the spinner to 1em so it matches the surrounding font size (useful for inline text indicators). Defaults to 'md'. */` |
| `track` | `boolean` | `true` | `/** When true, renders a subtle ring behind the rotating stroke. Only applies to the 'circular' variant. Defaults to true. */` |
| `label` | `string` | `'Loading'` | `/** Accessible label announced by assistive technology. Rendered in a visually hidden span so sighted users do not see it. Defaults to 'Loading'. */` |

No outputs. No content projection. No form integration (the spinner is purely presentational).

No `speed` input — omit it. Reduced motion already halts the animation; runtime speed tuning adds surface area without a clear use case. Revisit only if a consumer asks.

## Usage examples

```html
<!-- Simplest: standalone primary circular spinner -->
<tw-spinner />
```

```html
<!-- Semantic color + size -->
<tw-spinner color="success" size="lg" />
```

```html
<!-- Dots variant, inherits surrounding text color -->
<span class="text-info-600 inline-flex items-center gap-2">
  <tw-spinner variant="dots" size="sm" />
  Syncing changes…
</span>
```

```html
<!-- Inside a button: spinner picks up the button's text color automatically -->
<button twButton [loading]="saving()" (click)="save()">
  @if (saving()) {
    <tw-spinner size="sm" />
  }
  Save
</button>
```

```html
<!-- Inside a form-field: pending async validation indicator -->
<tw-form-field>
  <label twLabel>Email</label>
  <input twInput type="email" formControlName="email" />
  @if (emailCtrl.pending) {
    <tw-spinner slot="suffix" size="sm" label="Validating email" />
  }
</tw-form-field>
```

```html
<!-- Text-inline with `size="inherit"` — scales with the surrounding font -->
<p class="text-sm text-fg-muted">
  <tw-spinner size="inherit" /> Loading dashboard…
</p>
```

```html
<!-- Centered in a card (consumer-owned wrapper) -->
<tw-card class="flex items-center justify-center min-h-40">
  <tw-spinner size="xl" color="primary" label="Loading report" />
</tw-card>
```

```html
<!-- Circular without the track ring -->
<tw-spinner [track]="false" color="accent" />
```

## Styling

Use a single `tv()` config with **slots** so each variant can style its internal parts independently. Enable `twMerge: true`.

### `tv()` slots

```
root        — host wrapper; inline-flex, aspect-square, positions the inner animation
circle      — SVG ring for the 'circular' variant (track + stroke)
dots        — flex row holding three bouncing dots for the 'dots' variant
bar         — individual bar for the 'bars' variant (three of them)
srLabel     — visually hidden label for screen readers
```

### Base classes per slot

- `root`: `inline-flex items-center justify-center shrink-0 align-middle`
- `circle`: `block` (SVG host; sized by `size` variant on the root)
- `dots`: `inline-flex items-center justify-center gap-1 h-full w-full`
- `bar`: `inline-block rounded-sm` — **exception**: `rounded-sm` is allowed here for the narrow bar shape; CLAUDE.md's visual scale (`md`/`lg`/`xl`/`full`) is for block-level elements. If you prefer to stay strict, use `rounded-md` with narrower bars.
- `srLabel`: `sr-only`

### Variants

```
variant:
  circular → circle: '' (SVG rendered)
  dots     → dots:   '' (three <span> rendered)
  bars     → bar:    '' (three <span> rendered, animated with stagger)

size (root pixel box):
  xs      → 'size-3'   (12px)
  sm      → 'size-4'   (16px)
  md      → 'size-5'   (20px)
  lg      → 'size-6'   (24px)
  xl      → 'size-8'   (32px)
  inherit → 'size-[1em]'   (sizes from surrounding font)

color (applied to root; stroke/fill/bg inherits via currentColor in SVG and bg-current on dots/bars):
  current   → ''                (inherits — critical for button and form-field composition)
  primary   → 'text-primary-600'
  secondary → 'text-secondary-600'
  accent    → 'text-accent-600'
  neutral   → 'text-fg-muted'
  info      → 'text-info-600'
  success   → 'text-success-600'
  warning   → 'text-warning-600'
  error     → 'text-error-600'

track (circular only):
  true  → (no class — controlled in the SVG template: the track <circle> is rendered)
  false → (the track <circle> is not rendered)
```

`defaultVariants`: `{ variant: 'circular', color: 'current', size: 'md', track: true }`.

Host binding: `host: { '[class]': 'rootClasses()' }`. All variant computation happens inside a `computed()` that calls `tv()`.

### Circular variant implementation

Render an inline SVG inside the `root`:

```html
<svg viewBox="0 0 24 24" class="size-full animate-spin motion-reduce:animate-none" aria-hidden="true">
  @if (track()) {
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" opacity="0.2" />
  }
  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"
          stroke-linecap="round" stroke-dasharray="60" stroke-dashoffset="40" />
</svg>
```

- Uses Tailwind's built-in `animate-spin` (no new keyframes needed — Tailwind v4 ships `spin`).
- `motion-reduce:animate-none` honors `prefers-reduced-motion`.
- `currentColor` + `stroke-width="3"` at a 24-unit viewBox produces a visually balanced ring at every `size-*` class.
- Track `opacity-0.2` gives the subtle background ring when `track` is true.

### Dots variant implementation

Three `<span>` elements inside the `dots` slot, each `bg-current rounded-full`, sized ~`size-1.5` for xs/sm, `size-2` for md/lg/xl. Animate each with a staggered `dots-bounce` class:

```html
<span class="dots-bounce [animation-delay:-0.3s]"></span>
<span class="dots-bounce [animation-delay:-0.15s]"></span>
<span class="dots-bounce"></span>
```

### Bars variant implementation

Three narrow `<span>` bars inside the `root` as a flex row, each `bg-current` with width ~`w-1` (xs/sm) or `w-1.5` (md/lg/xl) and full height. Animate with `bars-stretch` + stagger:

```html
<span class="bars-stretch [animation-delay:-0.4s]"></span>
<span class="bars-stretch [animation-delay:-0.2s]"></span>
<span class="bars-stretch"></span>
```

### Keyframes — add to `projects/ngx-tw/theme/_base.css`

Append alongside the existing animation declarations:

```css
/* Spinner — dots variant */
@keyframes tw-spinner-dots-bounce {
  0%, 80%, 100% { transform: scale(0.3); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1; }
}
.dots-bounce {
  display: inline-block;
  width: 25%;
  height: 25%;
  background: currentColor;
  border-radius: 9999px;
  animation: tw-spinner-dots-bounce 1.2s ease-in-out infinite both;
}

/* Spinner — bars variant */
@keyframes tw-spinner-bars-stretch {
  0%, 40%, 100% { transform: scaleY(0.4); }
  20%           { transform: scaleY(1);   }
}
.bars-stretch {
  display: inline-block;
  width: 15%;
  height: 100%;
  background: currentColor;
  border-radius: 2px;
  transform-origin: center;
  animation: tw-spinner-bars-stretch 1s ease-in-out infinite;
}
```

Add the reduced-motion block (append to the existing `@media (prefers-reduced-motion: reduce)` rule in `_base.css`):

```css
@media (prefers-reduced-motion: reduce) {
  /* …existing entries… */
  .dots-bounce,
  .bars-stretch { animation-duration: 0ms; animation-iteration-count: 1; }
}
```

The circular variant uses Tailwind's `motion-reduce:animate-none` utility directly on the SVG, so no CSS addition is needed for it.

## Accessibility

- **Role:** host gets `role="status"`.
- **Live region:** host gets `aria-live="polite"`. This causes screen readers to announce the label when the spinner is inserted into the DOM (i.e., when a parent toggles `@if (loading)`).
- **Label:** render the `label` input inside a visually hidden `<span class="sr-only">` child. Do not use `aria-label` on the host because `role="status"` + visible child text is the more reliable pattern (and the host itself has no inherent text content).
- **Decorative children:** the SVG (circular) gets `aria-hidden="true"`. The dot and bar `<span>`s carry no ARIA — the `sr-only` label already owns the announcement.
- **Button composition:** `<button twButton [loading]>` already sets `aria-busy="true"` on itself. The spinner inside the button simply provides the visual + screen-reader label; no additional ARIA wiring is needed.
- **Form-field composition:** the consumer is expected to set `aria-busy` on the form-field or the input when async validation runs. The spinner itself announces its label via `role="status"`.
- **Reduced motion:** the circular variant uses `motion-reduce:animate-none`; the dots/bars variants are halted via the `@media (prefers-reduced-motion: reduce)` block added to `theme/_base.css`. In all cases the spinner remains visible (shape is static) so users still get the pending-state affordance.
- **Focus:** the spinner is not interactive. No `tabindex`, no focus ring.

Must pass AXE.

## Composition patterns

This section is first-class — composition is the spinner's primary job. Document each pattern in the demo app and ensure the API supports it with zero extra inputs.

### 1. Inside `[twButton]` (button loading state)

`ButtonDirective` already exposes a `loading` input that sets `aria-busy` and blocks clicks. The spinner is projected by the consumer into the button's content — no changes to `ButtonDirective` are required in this prompt.

Recommended usage:

```html
<button twButton [loading]="saving()" (click)="save()">
  @if (saving()) {
    <tw-spinner size="sm" />
  }
  Save
</button>
```

- `color` defaults to `'current'` so the spinner adopts the button's text color automatically (white on solid, `primary-700` on ghost, etc.).
- `size="sm"` matches the icon sizing convention (`size-4`) used by `twButtonIcon` for `md` buttons. For `xs`/`sm` buttons, use `size="xs"`; for `lg`/`xl` buttons, use `size="md"`.
- The spinner replaces or joins the leading icon slot. The consumer decides layout.

**Optional enhancement (out of scope for this prompt):** a follow-up prompt may add a `[twButtonSpinner]` helper or a default projected spinner when `loading` is true — but keep this component decoupled for now. Projecting manually is more flexible.

### 2. Inside `<tw-form-field>` (async validation / pending load)

The form-field provides `[slot="prefix"]` and `[slot="suffix"]` slots via `PrefixDirective` / `SuffixDirective`. Consumers project a spinner exactly like they would an icon:

```html
<tw-form-field>
  <label twLabel>Username</label>
  <input twInput formControlName="username" />
  @if (usernameCtrl.pending) {
    <tw-spinner slot="suffix" size="sm" label="Checking availability" />
  }
</tw-form-field>
```

- `color="current"` (the default) inherits the suffix container's `text-fg-muted`, matching any icon in that slot.
- `size="sm"` matches typical form-field input height.
- If the field is invalid, the form-field border already turns `error-500`; the spinner does not need a special invalid state.

### 3. Inline text indicator

```html
<span class="text-fg-muted inline-flex items-center gap-1.5">
  <tw-spinner size="inherit" variant="dots" />
  Saving…
</span>
```

`size="inherit"` sizes the spinner at `1em × 1em`, so it scales with the ambient font. `color="current"` ensures it matches the surrounding `text-fg-muted`.

### 4. Centered block / card loading

```html
<div class="flex items-center justify-center min-h-40 bg-surface-raised rounded-lg">
  <tw-spinner size="xl" color="primary" label="Loading report" />
</div>
```

### 5. Overlay / full-surface loading (recipe, not built-in)

Do not build overlay behavior into the spinner. Document the recipe in the demo:

```html
<div class="relative">
  <!-- content -->
  @if (loading()) {
    <div class="absolute inset-0 flex items-center justify-center
                bg-surface/70 backdrop-blur-sm rounded-[inherit]"
         role="status" aria-live="polite">
      <tw-spinner size="xl" color="primary" label="Loading" />
      <!-- Label is already announced by the outer role="status" region;
           tw-spinner's own role="status" is redundant here but harmless. -->
    </div>
  }
</div>
```

Consumers who need a CDK overlay variant can compose `@angular/cdk/overlay` with this spinner — no library surface needed.

### 6. Menu items, list rows, async actions

```html
<tw-menu-item (click)="runAsync()">
  @if (pending()) {
    <tw-spinner size="sm" variant="dots" />
  } @else {
    <tw-icon name="refresh-cw" />
  }
  Refresh
</tw-menu-item>
```

## Implementation notes

- Single `@Component` with `selector: 'tw-spinner'`, `ChangeDetection.OnPush`, inline template, no `ViewEncapsulation.None` needed (no scoped styles to leak).
- Use `input()` for all six inputs. No `model()` — the spinner has no two-way state.
- Derive class strings with a single `computed()` per slot (`rootClasses`, `dotsClasses`, `barClasses`, `srLabelClasses`). The circular SVG has fixed attributes in the template.
- Template uses `@switch (variant())` to render one of three sub-trees: the SVG, the dots row, or the bars row.
- The `srLabel` `<span>` is always rendered (unconditional) — hidden visually by `sr-only`, the label text bound via `{{ label() }}`.
- `host: { role: 'status', 'aria-live': 'polite', '[class]': 'rootClasses()' }`. Do not set `aria-label` on the host — the child `sr-only` span carries the accessible text.
- No `inject()` or `OnInit`/`OnDestroy` needed. The spinner is pure.
- No CDK imports.
- Do not emit any events.

## File structure

Create under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/spinner/`:

- `spinner.ts` — `SpinnerComponent`, `SpinnerVariant`, `SpinnerColor`, `SpinnerSize` types.
- `spinner.spec.ts` — Vitest tests (see coverage below).
- `index.ts` — public exports.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Also:

- Append the `dots-bounce` / `bars-stretch` keyframes and reduced-motion block to `projects/ngx-tw/theme/_base.css` as specified under "Keyframes" above.
- Reference shared types `TwColor`, `TwSize` from `ngx-tw/core` — do not redefine.

### Test coverage (`spinner.spec.ts`)

Cover:

- Default render: mounts without inputs; host has `role="status"`, `aria-live="polite"`; `sr-only` span contains text `'Loading'`; the circular SVG is rendered with two `<circle>` elements (track + stroke).
- Each `SpinnerVariant` value renders its expected inner structure (`svg` / three dot spans / three bar spans).
- Each `SpinnerColor` value applies without errors; `'current'` applies no explicit `text-*` class; the 8 `TwColor` values each apply the corresponding `text-{color}-600` class.
- Each `SpinnerSize` value renders (`size-3` through `size-8`, plus `size-[1em]` for `'inherit'`).
- `track: false` removes the track `<circle>` from the circular SVG; `track: true` renders it.
- `label` input: updates the `sr-only` span text content.
- SVG has `aria-hidden="true"`.
- The host carries no `tabindex` (non-interactive).
- Class string updates when inputs change (use `fixture.componentRef.setInput` then `fixture.detectChanges()`; query DOM, not internal signal values).
- Rendered DOM is consistent when mounted inside a `[twButton]` host (i.e., the spinner is visible in the button's content and does not throw).
- Rendered DOM is consistent when mounted inside a `[slot="suffix"]` of a `<tw-form-field>` (no errors, correct classes).
- Reduced-motion: assert that the circular SVG has the `motion-reduce:animate-none` utility class on it (behavioral assertion only — do not mock `matchMedia`).

**No `fakeAsync` / `tick`.** Use `async/await` with `fixture.whenStable()` where required. No timers to simulate — the CSS animations are fire-and-forget.

## Public API exports

In `projects/ngx-tw/spinner/index.ts`:

```ts
export { SpinnerComponent } from './spinner';
export type { SpinnerVariant, SpinnerColor, SpinnerSize } from './spinner';
```

In `projects/ngx-tw/src/public-api.ts`, add:

```ts
export * from 'ngx-tw/spinner';
```

## Constraints

- Standalone component. Do **not** set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush`. Inline template.
- Signal APIs only: `input()`, `computed()`. No `model()`, no `linkedSignal()`, no `mutate`.
- Host bindings via the `host:` object — never `@HostBinding` / `@HostListener`.
- Native control flow only (`@if`, `@switch`, `@for`). No `ngClass` / `ngStyle`. No arrow functions in templates.
- Tailwind utilities only — no component CSS files. Use semantic tokens (`primary-*`, `info-*`, etc.) and surface/fg/border tokens where applicable. Never raw palette colors. Never raw `neutral-*` shades for structural styling — `neutral` maps to `text-fg-muted`.
- `tv()` config must include `defaultVariants` and pass `{ twMerge: true }` as the second argument.
- Visual tokens (sizes `size-3` through `size-8`, focus ring pattern N/A, transitions via `animate-spin` / `motion-reduce:animate-none`, opacity `opacity-20` for the track ring) match the Visual Design System in CLAUDE.md. The only new keyframes added live in `theme/_base.css` — never in a component CSS file.
- Every `input()` has a one-line JSDoc.
- Vitest runner: no `fakeAsync` / `tick`; use `vi.spyOn`, `async/await`, `fixture.whenStable()`.
- No `@angular/animations`. No CDK dependencies.
