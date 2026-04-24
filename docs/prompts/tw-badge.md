# Prompt: Build `twBadge` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, variant patterns
- `projects/ngx-tw/button/button.ts` — reference pattern for attribute-selector component, `tv()` config with `compoundVariants`, signal inputs, `computed()` class binding
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types
- `projects/ngx-tw/button/button.spec.ts` — reference pattern for Vitest specs with test host components

## What to build

A badge/tag component with an attribute selector `[twBadge]` that styles its host element as an inline badge. It supports semantic color variants, three visual styles (solid, outline, soft), a size scale, optional pill shape, an optional dismiss button that emits an event, and a dot-only mode that renders a small colored circle without text content. The component uses an inline template with `ng-content` for the label, a conditional dismiss button, and a conditional dot indicator.

## API design

### Inputs

- `color: input<TwColor>('neutral')` — /** Sets the semantic color palette. Defaults to `'neutral'`. */
- `variant: input<BadgeVariant>('soft')` — /** Controls the visual style. Defaults to `'soft'`. */
- `size: input<TwSize>('md')` — /** Controls badge size (padding, font, icon size). Defaults to `'md'`. */
- `pill: input(false)` — /** When true, uses fully rounded corners instead of default `rounded-md`. Defaults to `false`. */
- `dismissible: input(false)` — /** When true, renders a dismiss button inside the badge. Defaults to `false`. */
- `dot: input(false)` — /** When true, renders a small colored dot with no text content. Defaults to `false`. */

Export `BadgeVariant` type: `'solid' | 'outline' | 'soft'`

### Outputs

- `dismissed: output<void>()` — /** Fires when the dismiss button is clicked. */

### Content projection

- Default `ng-content` for the badge label text or icon. This is a structural slot — when `dot` is true, projected content is hidden via the template (wrap `ng-content` in an element controlled by `@if(!dot())`).

## Usage examples

```html
<!-- Simplest: neutral soft badge -->
<span twBadge>Default</span>

<!-- Color + variant -->
<span twBadge color="success" variant="solid">Active</span>

<!-- Outline with pill shape -->
<span twBadge color="primary" variant="outline" [pill]="true">v2.1.0</span>

<!-- Dismissible badge -->
<span twBadge color="error" variant="soft" [dismissible]="true" (dismissed)="onRemove()">Expired</span>

<!-- Dot indicator (no text) -->
<span twBadge color="success" [dot]="true"></span>

<!-- Small badge -->
<span twBadge color="info" size="xs">New</span>
```

## Styling

Define a `tv()` config with **slots**: `root`, `content`, `dismiss`, `dot`.

**Root slot base:** `inline-flex items-center font-medium w-fit`

**Variants:**

- `variant`: `solid`, `outline` (add `border`), `soft`
- `color`: all 8 `TwColor` values — empty strings, resolved via `compoundVariants`
- `size`: badge-specific padding scale (tighter than buttons):
  - `xs`: `px-1.5 py-0.5 text-xs gap-1`
  - `sm`: `px-2 py-0.5 text-xs gap-1`
  - `md`: `px-2 py-1 text-xs gap-1.5`
  - `lg`: `px-3 py-1.5 text-sm gap-1.5`
  - `xl`: same as `lg`
- `pill`: `true` → `rounded-full`, `false` → `rounded-md`
- `dot`: `true` → override size padding to fixed small dimensions (e.g., `size-2 p-0` on root for the dot)

**Dismiss slot:** small inline button: `inline-flex items-center justify-center rounded-md cursor-pointer hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`. Size-dependent icon sizing: `size-4` for xs/sm/md, `size-5` for lg/xl. Render an inline SVG `x` icon (Heroicons micro x-mark path).

**Dot slot:** `rounded-full shrink-0`. Size: `size-1.5` for xs/sm, `size-2` for md/lg/xl. Color via `compoundVariants` matching the color input (`bg-{color}-500` for solid/soft, `bg-{color}-500` for outline).

**compoundVariants:** Follow the button pattern. For each color:
- `solid`: `bg-{color}-600 text-white` (neutral: `bg-surface-muted text-fg`)
- `outline`: `border-{color}-300 text-{color}-700` (neutral: `border-border text-fg`)
- `soft`: `bg-{color}-50 text-{color}-800` (neutral: `bg-surface-muted text-fg-muted`)

**defaultVariants:** `variant: 'soft'`, `color: 'neutral'`, `size: 'md'`, `pill: false`

Enable `twMerge: true`.

Apply the root slot classes via `host: { '[class]': 'rootClasses()' }`. Apply dismiss and content slot classes in the inline template.

## Accessibility

- Badge host: `role="status"` by default (informational). No keyboard interaction on the badge itself.
- Dismiss button: rendered as a `<button>` element with `aria-label="Dismiss"`. Keyboard: `Enter`/`Space` triggers dismiss. Focus ring per CLAUDE.md pattern.
- Dot mode: add `aria-label` on the host reflecting the color meaning if no projected content is present — the consumer should provide `aria-label` for screen reader context (document this in JSDoc for the `dot` input).

## Implementation notes

- This is a `@Component` with `selector: '[twBadge]'`, `ChangeDetection.OnPush`, and `exportAs: 'twBadge'`.
- Inline template: use `@if(!dot())` to wrap the `ng-content` and dismiss button regions. Use a separate `@if(dot())` block for the dot `<span>`.
- Use `computed()` for all slot class derivations — `rootClasses`, `contentClasses`, `dismissClasses`, `dotClasses`. No `linkedSignal` needed since all state is purely derived from inputs.
- The dismiss button's click handler calls `dismissed.emit()`. No other interaction logic.
- No CDK imports needed beyond standard Angular — the dismiss button is a simple native `<button>`, focus-visible CSS handles focus indication.

## File structure

```
projects/ngx-tw/badge/
  badge.ts          — BadgeComponent + BadgeVariant type
  badge.spec.ts     — Vitest tests: default render, all variant/color/size combos, pill, dismissible (click emits dismissed, keyboard Enter/Space), dot mode (no text rendered, dot element present), disabled dismiss suppression not needed (badge has no disabled state), ARIA role="status", dismiss button aria-label, content projection
  index.ts          — exports BadgeComponent, BadgeVariant
  ng-package.json   — { "lib": { "entryFile": "index.ts" } }
```

## Public API exports

Export `BadgeComponent` and `BadgeVariant` from `projects/ngx-tw/badge/index.ts`.

Add `export * from 'ngx-tw/badge';` to `projects/ngx-tw/src/public-api.ts`.

## Constraints

- All styling via Tailwind utilities + `tv()` with `twMerge: true`. No CSS files.
- Semantic color tokens only — never raw palette colors.
- Neutral structural styling uses surface/fg/border tokens.
- Signal-based inputs with `input()`. No `model()` needed — badge has no two-way bound state.
- `ChangeDetection.OnPush`. No `standalone: true` (default in v21).
- `host` object for host bindings. No `@HostBinding`/`@HostListener`.
- Vitest specs with `vi.spyOn()`. No `fakeAsync`/`tick`.
- Inline template (well under 50 lines).
- JSDoc on every public `input()` and `output()`.
