# Prompt: Build `twTooltip` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, animation patterns
- `projects/ngx-tw/button/button.ts` — attribute directive pattern with `tv()`, `FocusMonitor`, `host` bindings, `DestroyRef` cleanup
- `projects/ngx-tw/badge/badge.ts` — `tv()` slots pattern with `compoundVariants` for color mapping
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types
- `projects/ngx-tw/theme/_base.css` — existing `fade-in`/`fade-out` animation keyframes
- Angular CDK overlay: `Overlay`, `OverlayRef`, `FlexibleConnectedPositionStrategy`, `ConnectedPosition`, `ScrollDispatcher` from `@angular/cdk/overlay`
- Angular CDK a11y: `AriaDescriber` from `@angular/cdk/a11y`
- Reference `node_modules/@angular/material/tooltip` source for CDK overlay + AriaDescriber composition patterns

## What to build

An attribute directive `twTooltip` that attaches to any element and shows a floating tooltip on hover/focus. The directive uses CDK Overlay for positioning and CDK `AriaDescriber` for accessibility. The tooltip content can be a plain string or a `TemplateRef` for rich content. It supports 12 placement positions with automatic fallback, an optional arrow indicator, configurable show/hide delays, semantic color variants, size variants, and a disabled state. An internal `TooltipOverlayComponent` renders the tooltip content inside the CDK overlay — it is not part of the public API.

## API design

### Directive: `TooltipDirective` (selector: `[twTooltip]`, exportAs: `twTooltip`)

#### Inputs

- `twTooltip: string | TemplateRef<void>` — **required.** The tooltip content. Strings render as text; TemplateRef renders via `ngTemplateOutlet`. This is the selector input.
- `twTooltipPosition: TooltipPosition` — Preferred placement relative to the trigger. CDK handles fallback if the preferred position doesn't fit. Default: `'top'`.
- `twTooltipColor: TwColor` — Semantic color palette for the tooltip. Default: `'neutral'`.
- `twTooltipSize: 'sm' | 'md' | 'lg'` — Controls padding, font size, max-width, and arrow size. Default: `'md'`.
- `twTooltipShowDelay: number` — Milliseconds to wait before showing after trigger. Default: `200`.
- `twTooltipHideDelay: number` — Milliseconds to wait before hiding after trigger ends. Default: `0`.
- `twTooltipDisabled: boolean` — When true, tooltip never shows. Default: `false`.
- `twTooltipArrow: boolean` — When true, renders an arrow/caret pointing to the trigger. Default: `true`.

#### Outputs

- `twTooltipShown: void` — Fires when the tooltip becomes visible.
- `twTooltipHidden: void` — Fires when the tooltip is fully hidden.

#### Public methods (via `exportAs`)

- `show(): void` — Programmatically show the tooltip.
- `hide(): void` — Programmatically hide the tooltip.
- `toggle(): void` — Toggle tooltip visibility.

### Types to export

```typescript
type TooltipPosition = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end';
```

## Usage examples

```html
<!-- Simplest: string tooltip on a button -->
<button twButton twTooltip="Save changes">Save</button>

<!-- Positioned bottom with custom color -->
<button twButton twTooltip="Delete item" twTooltipPosition="bottom" twTooltipColor="error">Delete</button>

<!-- Large tooltip with delay -->
<span twTooltip="This action cannot be undone" twTooltipSize="lg" [twTooltipShowDelay]="500">Hover me</span>

<!-- Rich content via TemplateRef -->
<button twButton [twTooltip]="richTip">Info</button>
<ng-template #richTip>
  <strong>Keyboard shortcut:</strong> Ctrl+S
</ng-template>

<!-- Disabled tooltip -->
<button twButton twTooltip="Not available" [twTooltipDisabled]="true">Disabled tip</button>

<!-- No arrow -->
<span twTooltip="Clean tooltip" [twTooltipArrow]="false">No arrow</span>

<!-- Programmatic control via exportAs -->
<button twButton twTooltip="Manual control" #tip="twTooltip" (click)="tip.toggle()">Toggle tip</button>
```

## Styling

### `tv()` config

Use `tv()` with **slots**: `panel`, `arrow`, `content`.

**Slots:**
- `panel` — the outer tooltip container. Base: `rounded-md shadow-sm z-50 pointer-events-none`
- `arrow` — the CSS arrow element. Base: `absolute size-2 rotate-45`
- `content` — the inner text/template wrapper. Base: `relative z-10`

**Variants:**

`color` — all 8 `TwColor` values. For `neutral`: `bg-surface-overlay text-fg` on panel, `bg-surface-overlay` on arrow. For semantic colors: `bg-{color}-700 text-white` on panel, `bg-{color}-700` on arrow.

`size`:
- `sm`: panel `px-2 py-1 text-xs max-w-[12rem]`, arrow `size-1.5`
- `md`: panel `px-3 py-1.5 text-sm max-w-xs`, arrow `size-2`
- `lg`: panel `px-4 py-2 text-sm max-w-sm`, arrow `size-2`

**defaultVariants:** `color: 'neutral'`, `size: 'md'`.

Enable `twMerge: true`.

### Arrow positioning

The arrow's position class is determined at runtime from CDK's `positionChange` observable, which reports the resolved connection pair. Map the resolved position to an arrow placement class:
- Tooltip above trigger: arrow at bottom center (`-bottom-1 left-1/2 -translate-x-1/2`)
- Tooltip below: arrow at top center (`-top-1 left-1/2 -translate-x-1/2`)
- Tooltip left: arrow at right center (`-right-1 top-1/2 -translate-y-1/2`)
- Tooltip right: arrow at left center (`-left-1 top-1/2 -translate-y-1/2`)

### Animations

The overlay component uses `animate.enter="fade-in"` and `animate.leave="fade-out"` — these keyframes already exist in `_base.css`. No new keyframes needed.

## Accessibility

- **ARIA:** Use CDK `AriaDescriber.describe()` to associate the tooltip text with the trigger element. When the tooltip content is a string, call `describe(hostElement, message, 'tooltip')`. When content changes or the directive is destroyed, call `removeDescription()`. For TemplateRef content, set `aria-describedby` manually pointing to the overlay's ID.
- **Keyboard:** `Escape` hides the tooltip when it is visible. The directive listens on the host element for `keydown.escape`.
- **Focus:** Tooltip shows on `focusin` and hides on `focusout` of the trigger element — this ensures keyboard users see tooltips. Use CDK `FocusMonitor` to track focus origin.
- **Role:** The tooltip overlay element gets `role="tooltip"` and a unique `id`. The trigger element gets `aria-describedby` pointing to that ID while the tooltip is visible.
- **Touch:** Listen for `touchstart` (show with delay) and `touchend` (hide with delay). Use `passive: true`. Dismiss on scroll via CDK `ScrollDispatcher`.
- **Reduced motion:** Handled by the theme CSS (`_base.css` already sets `animation-duration: 0ms` for `prefers-reduced-motion: reduce`).

## Implementation notes

- The directive creates a CDK `OverlayRef` lazily on first show. Use `Overlay.create()` with `FlexibleConnectedPositionStrategy` connected to the host element. Configure preferred position plus fallback positions (opposite side, then adjacent sides).
- Map each `TooltipPosition` value to a CDK `ConnectedPosition` (origin + overlay attachment points). Build a fallback chain: preferred position first, then opposite, then perpendicular positions.
- Use `reposition` scroll strategy so the tooltip follows the trigger on scroll.
- The internal `TooltipOverlayComponent` receives inputs via the CDK `ComponentPortal` or by setting properties on the component ref after attaching. It renders the content (string via text interpolation, TemplateRef via `ngTemplateOutlet`), applies `tv()` classes, renders the arrow conditionally, and uses `animate.enter`/`animate.leave` on its host.
- Show/hide delays: use `setTimeout` managed via a pending timer reference. Clear pending timers on each show/hide call. On destroy, clear timers and dispose the overlay.
- Disabled state: when `twTooltipDisabled` changes to `true`, immediately hide and prevent future shows.
- Subscribe to `positionChange` on the position strategy to update the arrow's directional class via a signal on the overlay component.
- Clean up: use `DestroyRef.onDestroy()` to dispose the overlay, remove ARIA descriptions, stop monitoring focus, and clear timers. Do not implement `OnDestroy` — use `DestroyRef`.
- The overlay component is declared in the same file as the directive. It is not exported from the public API.
- Host bindings on the directive: `(mouseenter)`, `(mouseleave)`, `(focusin)`, `(focusout)`, `(keydown.escape)`, `(touchstart)`, `(touchend)` — all via `host` object.

## File structure

```
projects/ngx-tw/tooltip/
  tooltip.ts           — TooltipDirective + internal TooltipOverlayComponent
  tooltip.spec.ts      — Vitest tests
  index.ts             — exports TooltipDirective, TooltipPosition
  ng-package.json      — { "lib": { "entryFile": "index.ts" } }
```

### Test coverage for `tooltip.spec.ts`

- Default render: directive on an element, hover triggers tooltip, tooltip appears in overlay
- All color variants render with correct role="tooltip"
- All size variants render without errors
- Position input: verify CDK overlay is created with correct preferred position
- Show/hide delays: use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` to test delay behavior
- Disabled state: setting `twTooltipDisabled` to `true` prevents tooltip from showing on hover
- Arrow: arrow element present by default, absent when `twTooltipArrow` is `false`
- TemplateRef content: projects template content into the tooltip overlay
- Keyboard: `Escape` key hides the visible tooltip
- Focus: `focusin` shows tooltip, `focusout` hides it
- ARIA: trigger has `aria-describedby` pointing to tooltip's `id` while visible; removed when hidden
- Tooltip has `role="tooltip"` on the overlay element
- Outputs: `twTooltipShown` emits when tooltip appears, `twTooltipHidden` emits when it hides
- Programmatic control: `show()`, `hide()`, `toggle()` via `exportAs` reference
- Cleanup: tooltip is removed from DOM when directive is destroyed

## Public API exports

`index.ts` exports:
- `TooltipDirective`
- `TooltipPosition` (type)

Add to `projects/ngx-tw/src/public-api.ts`:
```typescript
export * from 'ngx-tw/tooltip';
```

## Constraints

- Attribute selector `[twTooltip]`, not element selector
- All inputs prefixed with `twTooltip` (Angular convention for directive inputs sharing the selector name)
- Signal-based APIs: `input()`, `output()`, `computed()` — no decorators
- `ChangeDetection.OnPush` on the internal overlay component
- `host` object for all host bindings — no `@HostListener`
- Semantic color tokens only — no raw palette colors
- Surface/fg tokens for neutral variant — no `neutral-*` shades
- `rounded-md` for tooltip panel (small interactive element per design system)
- `shadow-sm` for tooltip elevation (small floating element)
- `duration-150` for enter/leave via `fade-in`/`fade-out` (already defined in theme)
- `animate.enter`/`animate.leave` — not `@angular/animations`
- Vitest only — `vi.useFakeTimers()` for delay tests, no `fakeAsync`/`tick`
- `DestroyRef` for cleanup, not `OnDestroy` interface
- Do not export the internal overlay component
- `twMerge: true` in `tv()` config
