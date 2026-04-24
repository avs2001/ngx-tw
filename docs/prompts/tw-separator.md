# Prompt: Build `tw-separator` for ngx-tw

## Context
Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, styling tokens
- `projects/ngx-tw/badge/badge.ts` — multi-slot `tv()` pattern with `TwColor`, computed variant result, slot class bindings
- `projects/ngx-tw/card/card.ts` — component with `ng-content` passthrough, structural slots
- `projects/ngx-tw/core/types.ts` — shared `TwColor` type

No CDK modules needed — separator is non-interactive.

## What to build
A `tw-separator` component that renders a visual divider line between content sections. It supports horizontal (default) and vertical orientations, three line styles (solid, dashed, dotted), three weight levels (thin, medium, thick), and semantic colors. When content is projected (e.g., text "OR" or an icon), the separator renders as two lines with a centered label between them. Labels are supported in horizontal orientation only.

## API design

### Inputs
- `orientation`: `/** Controls layout direction. Defaults to `'horizontal'`. */ input<'horizontal' | 'vertical'>('horizontal')`
- `variant`: `/** Controls the line style. Defaults to `'solid'`. */ input<SeparatorVariant>('solid')` — type `SeparatorVariant = 'solid' | 'dashed' | 'dotted'`
- `weight`: `/** Controls line thickness. Defaults to `'thin'`. */ input<SeparatorWeight>('thin')` — type `SeparatorWeight = 'thin' | 'medium' | 'thick'`
- `color`: `/** Sets the semantic color of the line. Defaults to `'neutral'`. */ input<TwColor>('neutral')`
- `decorative`: `/** When true, hides the separator from assistive technology (role="none", aria-hidden). Defaults to `false`. */ input(false)`

### Content projection
Single `<ng-content />` slot for the optional label. When content is present (detect via `contentChild` signal query on a wrapper element or a boolean signal tracking emptiness), render two flex-grown lines flanking the label. When absent, render a single full-width/full-height line. Labels are only rendered in horizontal orientation — in vertical mode, projected content is not displayed.

## Usage examples
```html
<!-- Simplest: horizontal solid line -->
<tw-separator />

<!-- Dashed line with color -->
<tw-separator variant="dashed" color="primary" />

<!-- With centered label text -->
<tw-separator>OR</tw-separator>

<!-- With icon label -->
<tw-separator color="accent">
  <svg class="size-4"><!-- icon --></svg>
</tw-separator>

<!-- Vertical separator inside a flex row -->
<div class="flex items-center gap-3">
  <span>Left</span>
  <tw-separator orientation="vertical" />
  <span>Right</span>
</div>

<!-- Decorative separator (hidden from screen readers) -->
<tw-separator decorative />

<!-- Thick dotted separator -->
<tw-separator variant="dotted" weight="thick" color="error" />
```

## Styling
Define `separatorVariants` using `tv()` with **slots**: `root`, `line`, `label`.

**Slots:**
- `root` — flex container. Horizontal: `flex items-center w-full`. Vertical: `flex flex-col items-center self-stretch`.
- `line` — the actual line element. Horizontal: `flex-1 border-t` (uses border-top for the line). Vertical: `flex-1 border-l` (uses border-left). 
- `label` — `px-3 text-sm text-fg-muted shrink-0 whitespace-nowrap` (horizontal only).

**Variants:**
- `variant`: `solid` = `border-solid`, `dashed` = `border-dashed`, `dotted` = `border-dotted` (applied to `line` slot)
- `weight`: `thin` = default border (1px), `medium` = `border-t-2` / `border-l-2`, `thick` = `border-t-[3px]` / `border-l-[3px]` — use compoundVariants with orientation to select correct border side
- `orientation`: `horizontal` / `vertical` — controls root flex direction and line border direction
- `color`: for `neutral`, use `border-border` on the line slot. For all other colors, use `border-{color}-300`. Apply via compoundVariants.

**defaultVariants:** `orientation: 'horizontal'`, `variant: 'solid'`, `weight: 'thin'`, `color: 'neutral'`.

Enable `twMerge: true`.

**Host bindings:** `'[class]': 'rootClasses()'`. The `line` and `label` slot classes are applied in the template via `[class]`.

ARIA on host: when `decorative()` is false, set `role="separator"` and `[attr.aria-orientation]` bound to the orientation input. When `decorative()` is true, set `role="none"` and `aria-hidden="true"`.

## Accessibility
- Default: `role="separator"` with `aria-orientation` matching the `orientation` input.
- Decorative mode: `role="none"` and `aria-hidden="true"` — the separator is invisible to assistive tech.
- No keyboard interaction needed — separators are non-interactive.
- Label text inside the separator is visual only — screen readers see the separator role, not the label content. If the label carries semantic meaning (like "OR" between login options), the consumer should add their own `aria-label` on the host.

## Implementation notes
- Use `contentChild` signal query (or a template reference variable approach) to detect whether label content has been projected. A practical approach: wrap `ng-content` in a container `<span>`, query it, and check if it has child nodes. Alternatively, use a simple element ref check in an `afterNextRender` or use Angular's native fallback content detection.
- Simpler alternative: always render the label wrapper, use CSS to hide it when empty via `:empty` pseudo-class (`hidden` when empty). This avoids runtime detection entirely. Prefer this approach.
- The component should use `ChangeDetection.OnPush`.
- Wire all inputs through a single `computed()` that calls `separatorVariants(...)` and destructure slot classes from the result.
- For the vertical + weight compoundVariants: swap `border-t-*` for `border-l-*`. This requires compoundVariants combining `orientation` and `weight`.
- Export the `SeparatorVariant` and `SeparatorWeight` types from the entry point.

## File structure
- `projects/ngx-tw/separator/separator.ts` — component + types
- `projects/ngx-tw/separator/separator.spec.ts` — Vitest tests covering: default render (horizontal solid line), each variant (solid/dashed/dotted), each weight, each orientation, color variants, decorative mode ARIA, label projection (with and without content), vertical mode ignores label, all combinations via compoundVariants. No `fakeAsync`.
- `projects/ngx-tw/separator/index.ts` — public API exports
- `projects/ngx-tw/separator/ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

## Public API exports
Export from `index.ts`: `SeparatorComponent`, `SeparatorVariant`, `SeparatorWeight`.
Add `export * from 'ngx-tw/separator';` to root `public-api.ts`.

## Constraints
- No `@angular/animations` — not needed for this component
- No CSS files — Tailwind utilities only via `tv()` and host/template class bindings
- Semantic color tokens only — never raw palette colors
- Neutral structural styling uses `border-border` token, not `neutral-*` shades
- `ChangeDetection.OnPush`, signal inputs, `computed()` for derived state
- `host` object for all host bindings — no `@HostBinding`
- Inline template (component is simple enough)
- Import `TwColor` from `ngx-tw/core`
- Enable `twMerge: true` in `tv()` config
