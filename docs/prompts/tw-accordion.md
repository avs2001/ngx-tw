# Prompt: Build `tw-accordion` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, animation rules
- `projects/ngx-tw/collapsible/collapsible.ts` — this is the primitive the accordion reuses
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types
- `projects/ngx-tw/theme/_base.css` — existing `collapsible-enter`/`collapsible-leave` keyframes are reused as-is

## What to build

A dedicated accordion component (`tw-accordion`) that coordinates multiple `<tw-collapsible>` children via a Radix-style API (`type: 'single' | 'multiple'`). Instead of re-implementing trigger, panel, or animation logic, `tw-accordion` reuses `tw-collapsible` as the item primitive and exposes itself as a `CollapsibleGroupComponent` through a DI alias. Children discover the accordion via the existing `inject(CollapsibleGroupComponent, { optional: true })` lookup and delegate toggling + keyboard navigation to it.

The accordion's responsibility is:
- Coordinate which children are open based on `type` (single vs multiple).
- Sync the model `value` with children's open state.
- Provide container styling (`variant`) for connected / bordered / ghost looks.
- Offer a `collapsible` flag (Radix-style) to control whether the active panel can be closed by re-clicking it in single mode.

## API design

### `AccordionComponent` — selector: `tw-accordion`

#### Inputs
- `/** Open mode. `'single'` allows one panel open at a time; `'multiple'` allows many. Defaults to `'single'`. */` `type = input<AccordionType>('single')`
- `/** Visual style of the accordion container. Defaults to `'default'`. */` `variant = input<AccordionVariant>('default')`
- `/** In `'single'` mode, whether re-clicking the open panel closes it. Defaults to `true`. */` `collapsible = input(true)`

#### Models
- `/** Open panel value(s). String in `'single'` mode, string[] in `'multiple'` mode. Two-way bindable. */` `value = model<string | string[]>('')`

### Types
- `AccordionType = 'single' | 'multiple'`
- `AccordionVariant = 'default' | 'bordered' | 'ghost'`

## Usage

```html
<!-- Single-open accordion (the common case) -->
<tw-accordion [(value)]="activePanel">
  <tw-collapsible value="a">
    <button twCollapsibleTrigger>Panel A</button>
    <p>Content A</p>
  </tw-collapsible>
  <tw-collapsible value="b">
    <button twCollapsibleTrigger>Panel B</button>
    <p>Content B</p>
  </tw-collapsible>
</tw-accordion>
```

```html
<!-- Multiple panels open at once -->
<tw-accordion type="multiple" variant="bordered" [(value)]="openPanels">
  <tw-collapsible value="x"><button twCollapsibleTrigger>X</button><p>X</p></tw-collapsible>
  <tw-collapsible value="y"><button twCollapsibleTrigger>Y</button><p>Y</p></tw-collapsible>
</tw-accordion>
```

```html
<!-- Force at least one open in single mode -->
<tw-accordion [collapsible]="false" value="a">
  <tw-collapsible value="a"><button twCollapsibleTrigger>A</button><p>A</p></tw-collapsible>
  <tw-collapsible value="b"><button twCollapsibleTrigger>B</button><p>B</p></tw-collapsible>
</tw-accordion>
```

## Styling

### `tv()` config — single slot (root)

**Base classes:**
- `root`: `block`

**Variants — `variant`:**
- `default`: `rounded-lg overflow-hidden divide-y divide-border` — connected look, dividers between items, no outer border
- `bordered`: `rounded-lg overflow-hidden divide-y divide-border border border-border` — connected look with outer border
- `ghost`: empty — minimal container, children handle their own visual separation

Enable `twMerge: true`. `defaultVariants: { variant: 'default' }`.

Children (`tw-collapsible`) automatically apply `rounded-none border-0 border-b-0` because they detect the group via `!!this.group` and use their existing `inGroup` variant.

## Accessibility

- Host: `role="group"`
- Keyboard navigation is inherited from the existing `CollapsibleTriggerDirective` → `group.onTriggerKeydown(event)`: ArrowDown, ArrowUp, Home, End; disabled items skipped.
- ARIA attributes on trigger/panel are handled by the collapsible primitives.

## Implementation notes

### DI alias

`AccordionComponent` provides itself to the `CollapsibleGroupComponent` DI token via `useExisting` + `forwardRef`. This is the single mechanism that lets child collapsibles discover the accordion:

```typescript
providers: [
  { provide: CollapsibleGroupComponent, useExisting: forwardRef(() => AccordionComponent) },
]
```

Because `CollapsibleComponent.group = inject(CollapsibleGroupComponent, { optional: true })` walks up the element injector tree, and content-projected children (`<tw-collapsible>` inside `<tw-accordion>`) resolve through the accordion's element injector, the lookup succeeds. The accordion does **not** need to extend `CollapsibleGroupComponent`; it only needs to be structurally compatible with the runtime call sites: `toggleItem(item)` and `onTriggerKeydown(event)`.

### Structural compatibility

The two methods that children invoke on their group are:
- `toggleItem(item: CollapsibleComponent): void` — called by `CollapsibleComponent.toggle()`
- `onTriggerKeydown(event: KeyboardEvent): void` — called by `CollapsibleTriggerDirective.onKeydown()`

`AccordionComponent` implements both. Keyboard navigation logic is a direct port from `CollapsibleGroupComponent` (which works well for accordions). Toggle logic diverges to support the `collapsible` flag and the `type` input.

### Value semantics

- `type='single'`: `value` is a single string; clicking an item sets `value` to its `value`; clicking the open item clears `value` to `''` when `collapsible` is true, or is a no-op when false.
- `type='multiple'`: `value` is a `string[]`; clicking toggles membership.
- Initial open state is synced from `value` via an effect (runs when `value()` or `items()` change).

### Animation

No new animations. Children use the existing `collapsible-enter` / `collapsible-leave` keyframes already defined in `theme/_base.css`.

### Public API exports

From `projects/ngx-tw/accordion/index.ts`:
```typescript
export { AccordionComponent } from './accordion';
export type { AccordionType, AccordionVariant } from './accordion';
```

## File structure

All files in `projects/ngx-tw/accordion/`:
- `accordion.ts` — `AccordionComponent`, `AccordionType`, `AccordionVariant`
- `accordion.spec.ts` — Vitest tests covering: default render, all variants, single/multiple modes, `collapsible=false` behavior, `value` two-way binding, keyboard navigation (ArrowDown / ArrowUp / Home / End, skipping disabled), ARIA role, integration with `tw-collapsible` children.
- `index.ts` — public API exports
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

Also update:
- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/accordion';`

## Constraints

- All styling via Tailwind utilities and `tv()` — no CSS files
- Semantic color and surface/fg/border tokens only
- `ChangeDetection.OnPush`
- Signal-based APIs: `input()`, `model()`, `computed()`, `contentChildren()`
- `host` object for host bindings — no `@HostBinding` / `@HostListener`
- `inject()` for DI — no constructor injection
- No `@angular/animations` imports
- Tests: Vitest, `vi.spyOn()`, no `fakeAsync`
- JSDoc on every public `input()` / `model()`
