# Prompt: Build `tw-card` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, design tokens, visual design system
- `projects/ngx-tw/badge/badge.ts` — multi-slot `tv()` pattern with `contentChild()` detection, `computed()` class bindings
- `projects/ngx-tw/button/button.ts` — directive pattern, `FocusMonitor` usage, `compoundVariants`
- `projects/ngx-tw/core/types.ts` — shared `TwColor`, `TwSize` types

## What to build

A `CardComponent` (`tw-card`) — a versatile container component for grouping related content. It uses content projection with directive-marked slots for header, body, footer, and media regions. Each region conditionally renders its wrapper only when content is projected. The card supports three visual variants (`elevated`, `outlined`, `ghost`) and a `color` input that tints bordered/soft regions for semantic cards (error, success, info, etc.). A `size` input controls internal section padding.

This is a non-interactive, purely structural component — no keyboard behavior, no ARIA role, no focus management. Accessibility is limited to semantic HTML structure.

## API design

### Component: `CardComponent`

**Selector:** `tw-card`

#### Inputs

- `/** Controls the visual elevation style. Defaults to `'elevated'`. */` `variant: input<CardVariant>('elevated')` — type `'elevated' | 'outlined' | 'ghost'`
- `/** Sets the semantic color for bordered/tinted regions. Only applies to `outlined` variant borders and can tint header/footer backgrounds. Defaults to `'neutral'`. */` `color: input<TwColor>('neutral')`
- `/** Controls padding of header, body, and footer sections. Defaults to `'md'`. */` `size: input<TwSize>('md')`

Export `CardVariant = 'elevated' | 'outlined' | 'ghost'` as a named type from the entry point.

### Content projection

Four directive-based structural slots. Each detected via `contentChild()` — wrapper markup renders only when content is present (per CLAUDE.md convention for structural slots):

- `[twCardHeader]` — top section, gets a bottom border divider when body or footer exists
- `[twCardBody]` — main content area
- `[twCardFooter]` — bottom section, gets a top border divider when body or header exists
- `[twCardMedia]` — full-bleed media region (images, video). Consumer controls placement order in their template (before header = top media, after footer = bottom media). Applies `overflow-hidden` and strips padding.

### Directives

Four lightweight directives that serve as slot markers and apply per-slot classes from the `tv()` config:

- `CardHeaderDirective` — selector: `[twCardHeader]`
- `CardBodyDirective` — selector: `[twCardBody]`
- `CardFooterDirective` — selector: `[twCardFooter]`
- `CardMediaDirective` — selector: `[twCardMedia]`

Each directive injects the parent `CardComponent` to read size/variant signals and compute its own slot classes via `computed()`.

## Usage examples

```html
<!-- Simplest: body-only elevated card -->
<tw-card>
  <div twCardBody>Hello world</div>
</tw-card>
```

```html
<!-- Full card with header, body, footer -->
<tw-card variant="outlined" color="primary" size="lg">
  <div twCardHeader>Project Details</div>
  <div twCardBody>
    <p>Card content goes here.</p>
  </div>
  <div twCardFooter>
    <button twButton color="primary">Save</button>
  </div>
</tw-card>
```

```html
<!-- Card with top media -->
<tw-card variant="elevated">
  <img twCardMedia src="hero.jpg" alt="Hero image" />
  <div twCardBody>Caption below the image.</div>
</tw-card>
```

```html
<!-- Ghost variant, semantic error color -->
<tw-card variant="outlined" color="error">
  <div twCardHeader>Error</div>
  <div twCardBody>Something went wrong.</div>
</tw-card>
```

```html
<!-- Ghost (flat) card -->
<tw-card variant="ghost">
  <div twCardBody>Minimal flat card with no border or shadow.</div>
</tw-card>
```

## Styling

### `tv()` config — slots-based

**Slots:** `root`, `header`, `body`, `footer`, `media`

**Base classes:**
- `root`: `rounded-lg text-fg overflow-hidden`
- `header`: `text-sm font-semibold text-fg border-b border-border`
- `body`: `text-sm text-fg`
- `footer`: `text-xs text-fg-muted border-t border-border`
- `media`: `w-full overflow-hidden`

**Variants:**

`variant`:
- `elevated`: root gets `bg-surface-raised shadow transition-shadow duration-200 motion-reduce:transition-none`
- `outlined`: root gets `bg-surface border border-border`
- `ghost`: root gets `bg-transparent`

`size` — maps to padding on header/body/footer slots using the container spacing scale from CLAUDE.md:
- `xs`: `p-2`
- `sm`: `p-3`
- `md`: `p-4`
- `lg`: `p-6`
- `xl`: `p-8`

Media slot gets no padding regardless of size.

`color` — use `compoundVariants` for `outlined` + each color to set `border-{color}-300`. For `neutral`, use `border-border` (the default). Ghost and elevated variants ignore color — they use surface/fg/border tokens only.

**`defaultVariants`:** `variant: 'elevated'`, `color: 'neutral'`, `size: 'md'`

Enable `twMerge: true`.

### Host binding

`host: { '[class]': 'rootClasses()' }` where `rootClasses` is a `computed()` calling the `tv()` result's `root()` slot.

Section directives apply their slot classes via their own `host: { '[class]': 'classes()' }`.

### Border dividers

Header's bottom border and footer's top border are part of the slot base classes. When only a body is projected (no header, no footer), no dividers appear because the header/footer wrappers don't render. This is handled naturally by the `contentChild()` + `@if` pattern — no extra logic needed.

## Accessibility

Card is a non-interactive structural container. No ARIA role is applied by default — it renders as a generic `<tw-card>` element. Consumers add `role="region"` and `aria-label` if the card represents a landmark. No keyboard behavior or focus management required.

If consumers make a card interactive (e.g., wrapping in `<a>` or adding click handlers), accessibility is their responsibility.

## Implementation notes

- Define the `tv()` config with slots at the top of `card.ts`, co-located with the component.
- `CardComponent` uses `contentChild()` queries for each directive type to detect whether header/body/footer/media are projected.
- Template uses `@if` with `contentChild()` results to conditionally render wrapper `<div>` elements for header/body/footer. Media is projected directly via `<ng-content select="[twCardMedia]">` without a conditional wrapper — the directive handles its own styling.
- Each section directive (`CardHeaderDirective`, etc.) injects `CardComponent` and reads `size()` / `variant()` / `color()` to compute its slot classes.
- All directives and the component live in the same `card.ts` file.
- The component template will likely stay under 20 lines — use inline template.

## File structure

```
projects/ngx-tw/card/
  card.ts          — CardComponent, CardHeaderDirective, CardBodyDirective, CardFooterDirective, CardMediaDirective, CardVariant type
  card.spec.ts     — Tests: default render, all variants, all sizes, color variants on outlined, content projection (each slot present/absent, combinations), media placement, border dividers between sections, class merging via twMerge
  index.ts         — exports: CardComponent, CardHeaderDirective, CardBodyDirective, CardFooterDirective, CardMediaDirective, CardVariant
  ng-package.json  — { "lib": { "entryFile": "index.ts" } }
```

## Public API exports

Export from `index.ts`: `CardComponent`, `CardHeaderDirective`, `CardBodyDirective`, `CardFooterDirective`, `CardMediaDirective`, `CardVariant`.

Add `export * from 'ngx-tw/card';` to `projects/ngx-tw/src/public-api.ts`.

## Constraints

- `ChangeDetection.OnPush` on the component and all directives.
- Signal-based inputs only (`input()`). No `model()` — card has no two-way bound state.
- No CSS files. All styling via Tailwind utilities in `tv()` config and host bindings.
- Semantic color tokens only — never raw palette colors.
- Surface/fg/border tokens for all neutral structural styling.
- All visual tokens (radius `rounded-lg`, shadows `shadow`/`shadow-md`, spacing scale, typography, transitions) must match the Visual Design System in CLAUDE.md exactly.
- `twMerge: true` in `tv()` config.
- JSDoc on every `input()`.
- No `@angular/animations`.
- Tests use Vitest — no `fakeAsync`/`tick`.
