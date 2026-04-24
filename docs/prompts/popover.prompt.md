# Prompt: Build `twPopover` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, animation patterns
- `projects/ngx-tw/tooltip/tooltip.ts` — the primary pattern to follow. The popover reuses the same CDK Overlay approach: attribute directive on trigger, internal overlay component rendered via `ComponentPortal`, `POSITION_MAP` record, `buildPositions()` fallback logic, arrow direction resolution from CDK position changes. Study this file thoroughly.
- `projects/ngx-tw/menu/menu.ts` — shows `animate.enter`/`animate.leave` usage and `tv()` with slots
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types
- `projects/ngx-tw/theme/_base.css` — existing `fade-in`, `fade-out`, `scale-in`, `scale-out` animation classes (reuse these)
- `@angular/cdk/overlay` — `FlexibleConnectedPositionStrategy`, `OverlayRef`, scroll strategies
- `@angular/cdk/portal` — `ComponentPortal`, `TemplatePortal`
- `@angular/cdk/a11y` — `FocusTrapFactory` for focus trapping

## What to build

An attribute directive `[twPopover]` that displays rich interactive content in a floating panel anchored to the trigger element. Unlike the tooltip (informational, non-interactive), the popover is a `dialog`-role overlay that can contain interactive content: forms, actions, navigation. It supports both `ng-template` and component class content via CDK Portals.

The popover consists of: a trigger directive (exported, applied by consumers), an internal overlay component (not exported, renders panel + arrow inside CDK Overlay), a close directive (exported, convenience for closing from inside content), and injection tokens for component-based content.

## API design

### PopoverDirective (`[twPopover]`)

Selector: `[twPopover]`. Export as: `twPopover`.

#### Inputs

- `twPopover: TemplateRef<PopoverTemplateContext> | Type<unknown>` (required) — The content to render. An `ng-template` receives context with `$implicit` (data) and `close` (function). A component class receives data and a ref via injection tokens.
- `twPopoverPosition: PopoverPosition` (default: `'bottom'`) — Preferred placement. CDK handles fallback when space is insufficient. Uses the same 12-value union as tooltip.
- `twPopoverTriggerOn: 'click' | 'focus' | 'manual'` (default: `'click'`) — What user interaction opens the popover. `'manual'` means consumers call `open()`/`close()` programmatically.
- `twPopoverDisabled: boolean` (default: `false`) — When true, all trigger interactions are suppressed.
- `twPopoverOpen: model<boolean>` (default: `false`) — Two-way bindable open state. Setting to `true` opens the popover programmatically; the popover sets it to `false` on close.
- `twPopoverSize: TwSize` (default: `'md'`) — Controls panel padding using the standard spacing scale from the visual design system.
- `twPopoverOffset: number` (default: `8`) — Pixel distance between trigger and panel edge. Applied as CDK position offset.
- `twPopoverArrow: boolean` (default: `true`) — Whether to render a directional arrow pointing at the trigger.
- `twPopoverBackdrop: 'transparent' | 'dimmed' | 'none'` (default: `'transparent'`) — `'transparent'` creates an invisible click-catching backdrop. `'dimmed'` adds a semi-transparent overlay. `'none'` disables the backdrop (popover closes via escape or explicit close only).
- `twPopoverCloseOnOutside: boolean` (default: `true`) — Whether clicking outside the panel closes the popover. Only relevant when backdrop is `'none'`.
- `twPopoverCloseOnEscape: boolean` (default: `true`) — Whether pressing Escape closes the popover.
- `twPopoverScrollStrategy: 'reposition' | 'close' | 'block'` (default: `'reposition'`) — CDK scroll strategy for the overlay.
- `twPopoverTrapFocus: boolean` (default: `true`) — Whether to trap focus inside the popover panel using CDK `FocusTrapFactory`.
- `twPopoverData: unknown` (default: `undefined`) — Arbitrary data passed to template context or component via `POPOVER_DATA` token.
- `twPopoverPanelClass: string | string[]` (default: `''`) — Additional CSS classes applied to the overlay panel for consumer customization.
- `twPopoverColor: TwColor | undefined` (default: `undefined`) — Optional semantic color. When set, adds a colored top border accent to the panel (`border-t-2 border-t-{color}-500`). When `undefined`, the panel is neutral with no accent.
- `twPopoverAriaLabel: string | undefined` (default: `undefined`) — Explicit `aria-label` for the dialog. If not set, the dialog relies on `aria-labelledby` from projected content.

#### Outputs

- `twPopoverOpened: void` — Fires after the popover becomes visible.
- `twPopoverClosed: void` — Fires after the popover is fully removed.

#### Public methods

- `open(): void` — Programmatically open the popover.
- `close(): void` — Programmatically close the popover.
- `toggle(): void` — Toggle open/close.
- `reposition(): void` — Force CDK to recalculate overlay position.

### PopoverCloseDirective (`[twPopoverClose]`)

Selector: `[twPopoverClose]`. Attribute directive placed on any element inside popover content to close the popover on click. Injects `POPOVER_REF` and calls `close()`.

Host listener: `(click)` calls `close()`.

### Types

```typescript
type PopoverPosition = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end';

interface PopoverTemplateContext<T = unknown> {
  $implicit: T;
  close: () => void;
}

interface PopoverRef {
  close(): void;
}
```

### Injection tokens

- `POPOVER_DATA` — provides the value of `twPopoverData` to component content.
- `POPOVER_REF` — provides a `PopoverRef` object with a `close()` method to component content.

## Usage examples

```html
<!-- Simplest: template content, click trigger -->
<button [twPopover]="popContent">Open popover</button>
<ng-template #popContent>
  <p>Popover body content here.</p>
</ng-template>

<!-- With position and size -->
<button [twPopover]="tipRef" twPopoverPosition="top" twPopoverSize="sm">
  Small top popover
</button>

<!-- Two-way open binding -->
<button [twPopover]="content" [(twPopoverOpen)]="isOpen">Toggle</button>

<!-- Template context with data and close -->
<button [twPopover]="detailed" [twPopoverData]="user">Profile</button>
<ng-template #detailed let-data let-close="close">
  <h3 class="text-sm font-semibold text-fg">{{ data.name }}</h3>
  <p class="text-sm text-fg-muted">{{ data.email }}</p>
  <button (click)="close()" class="text-sm text-primary-600">Dismiss</button>
</ng-template>

<!-- Close directive inside content -->
<ng-template #actions>
  <p>Are you sure?</p>
  <button twPopoverClose>Cancel</button>
</ng-template>

<!-- Component content with injection tokens -->
<button [twPopover]="ProfileCardComponent" [twPopoverData]="userId">
  View profile
</button>

<!-- With color accent -->
<button [twPopover]="content" twPopoverColor="warning">Warning info</button>

<!-- Disabled state -->
<button [twPopover]="content" [twPopoverDisabled]="true">Disabled</button>
```

## Styling

Use `tv()` with **slots** for the internal overlay component: `wrapper`, `panel`, `arrow`.

- **wrapper:** `relative z-50` (container for panel + arrow positioning)
- **panel:** `bg-surface-overlay text-fg text-sm border border-border rounded-lg shadow-md overflow-hidden` as base. Size variant maps to standard padding scale: `xs` = `p-2`, `sm` = `p-3`, `md` = `p-4`, `lg` = `p-6`, `xl` = `p-8`. Color variant adds a colored top border accent: `border-t-2 border-t-{color}-500` (e.g., `border-t-2 border-t-primary-500`). When no color is set, no accent border is rendered.
- **arrow:** `absolute size-2.5 rotate-45 bg-surface-overlay border border-border` with clip to hide the border edge that overlaps the panel. Arrow position classes keyed by direction (same pattern as tooltip's `ARROW_POSITION_CLASSES`).

Enable `twMerge: true`. Define `defaultVariants: { size: 'md' }`. The `color` variant is optional -- when set, it adds the accent border classes to the panel slot via `compoundVariants` or a computed class merge.

The `panelClass` input value is merged onto the panel slot via `twMerge` for consumer override support.

Backdrop classes: `'transparent'` = no visible style (CDK handles click-catching), `'dimmed'` = `bg-black/20` on the CDK backdrop element.

Enter/leave: use `animate.enter="scale-in fade-in"` and `animate.leave="scale-out fade-out"` on the internal overlay component host (same as menu). These animation classes already exist in `_base.css`.

## Accessibility

- **Trigger element:** Set `aria-haspopup="dialog"`, bind `[aria-expanded]` to open state, bind `[aria-controls]` to the panel's `id` when open (remove when closed).
- **Panel element:** `role="dialog"`, unique `id` (use incrementing counter like tooltip), `[aria-label]` from `twPopoverAriaLabel` input. If no explicit label, consumers should include a heading with `id` and the panel should have `aria-labelledby`.
- **Keyboard:**
  - `Escape` on trigger or inside panel: closes popover (when `closeOnEscape` is true), returns focus to trigger.
  - `Tab` inside panel: cycles through focusable elements when focus trap is enabled.
  - `Enter`/`Space` on trigger: opens popover (for `'click'` trigger mode).
- **Focus management:**
  - On open: move focus into the panel (first focusable element, or the panel itself if nothing is focusable). Use CDK `FocusTrapFactory` when `trapFocus` is true.
  - On close: return focus to the trigger element.
- **Live region:** Not needed -- popovers are user-initiated and focus moves into them.

## Implementation notes

Follow the tooltip's architecture closely: the directive creates a CDK `OverlayRef` with `FlexibleConnectedPositionStrategy`, attaches an internal `PopoverOverlayComponent` via `ComponentPortal`.

### Overlay lifecycle -- create once, reuse, dispose on destroy

Create the `OverlayRef` on the **first** call to `openPopover()`. On subsequent opens, reuse the existing `OverlayRef`. Never dispose and recreate the overlay on each open/close cycle. The lifecycle is:

- **First open:** call `overlay.create(...)` to get `OverlayRef`. Store it for the directive's lifetime.
- **Subsequent opens:** call `overlayRef.updatePositionStrategy(newStrategy)` to apply fresh positions (the offset or position input may have changed), then re-attach the portal.
- **On close:** call `overlayRef.detach()` only (not `dispose()`). Set `popoverInstance` to null.
- **On directive destroy (`DestroyRef.onDestroy()`):** call `overlayRef.dispose()` to fully clean up the CDK overlay, backdrop, and DOM elements.

This matches the tooltip's `createOverlay()` pattern: `if (this.overlayRef) return;`.

### Subscription management -- no leaks

There are two categories of subscriptions with different lifetimes:

**Overlay-lifetime subscriptions** (live as long as the OverlayRef exists):
- `positionStrategy.positionChanges` -- updates arrow direction. Subscribe once during `createOverlay()`. Use `takeUntilDestroyed(this.destroyRef)` from `@angular/core/rxjs-interop` since this subscription should survive open/close cycles and only end when the directive is destroyed.

**Per-open subscriptions** (live only while the popover is open):
- `overlayRef.backdropClick()` -- close on backdrop click
- `overlayRef.outsidePointerEvents()` -- close on outside click (when backdrop is `'none'`)
- `overlayRef.keydownEvents()` -- close on Escape from within overlay

These must be cleaned up on every close. Use a `Subscription` instance field. In `openPopover()`, create a new `Subscription` and `.add()` each per-open subscription to it. In the close flow, call `subscription.unsubscribe()` and set it to null. This prevents leaked subscriptions from accumulating across open/close cycles.

### Close animation flow -- animate before detach

`overlayRef.detach()` removes content from the DOM synchronously, which prevents CSS leave animations from playing. The close flow must wait for the animation to complete before detaching:

1. Destroy the focus trap (so focus can leave the panel).
2. Return focus to `elementRef.nativeElement`.
3. Set a closing flag to prevent re-entry.
4. Wait 150ms (matching `scale-out`/`fade-out` duration in `_base.css`) using `setTimeout`.
5. After the timeout: call `overlayRef.detach()`, unsubscribe per-open subscriptions, set `popoverInstance` to null, clear the `overlayId` signal.
6. Set `twPopoverOpen` model to `false` using `untracked()` (see below).
7. Emit `twPopoverClosed`.
8. Clear the closing flag.

Use a `closing` boolean flag to guard against re-entry. If `closePopover()` is called while already closing, return immediately.

**Important:** The `animate.leave` binding on the overlay component host is what triggers the CSS animation. The 150ms timeout must match the animation duration defined in `_base.css`. The component stays in the DOM during this window because `detach()` has not been called yet.

### Focus management -- always return focus on close

Return focus to `elementRef.nativeElement` in the close flow for **all** close paths: Escape key, backdrop click, outside click, programmatic close, and model-driven close. Do not limit focus return to only the Escape handler. This happens in step 2 of the close animation flow above.

### Effect guard -- prevent circular triggers with `untracked()`

The `effect()` watches `twPopoverOpen()` and calls `openPopover()`/`closePopover()`. Inside `closePopover()`, setting `twPopoverOpen` to `false` would re-trigger the effect, which would call `closePopover()` again. Prevent this by using `untracked()` from `@angular/core` when writing to the model inside `closePopover()`:

```
untracked(() => this.twPopoverOpen.set(false));
```

This ensures the model updates for the parent's two-way binding without creating a circular effect execution.

### Remaining implementation details

- Build a `POSITION_MAP` record identical to the tooltip's, but use the `twPopoverOffset` input value for offset distances instead of hardcoded `8`. Since offsets may change between opens, rebuild positions in `openPopover()` and apply via `overlayRef.updatePositionStrategy()` when reusing.
- Build fallback positions using the same `buildPositions()` pattern from tooltip.
- The internal overlay component receives panel configuration via writable signals (same pattern as `TooltipOverlayComponent`), not inputs -- the directive sets them after portal attachment.
- For `ng-template` content: use `TemplatePortal` with a context object `{ $implicit: data, close: closeFn }`.
- For component content: use `ComponentPortal` with an `Injector` that provides `POPOVER_DATA` and `POPOVER_REF`.
- Scroll strategy: map the `twPopoverScrollStrategy` input to CDK's `overlay.scrollStrategies.reposition()`, `.close()`, or `.block()`.
- Backdrop: when `'transparent'` or `'dimmed'`, create overlay with `hasBackdrop: true`. When `'dimmed'`, add backdrop class `bg-black/20`. When `'none'` and `closeOnOutside` is true, subscribe to `overlayRef.outsidePointerEvents()`.
- The `twPopoverOpen` model must sync both ways: setting it to `true` from the parent opens the popover; closing the popover (by any means) sets it to `false` (via `untracked()`).
- Use `effect()` to react to `twPopoverDisabled()` changes (close if currently open) and to `twPopoverOpen()` model changes from the parent.
- The `PopoverCloseDirective` is simple: inject `POPOVER_REF` (optional, for safety outside popover context) and call `close()` on host click.

## File structure

```
projects/ngx-tw/popover/
  popover.ts            — PopoverDirective, internal PopoverOverlayComponent (not exported)
  popover-close.ts      — PopoverCloseDirective
  popover-tokens.ts     — POPOVER_DATA, POPOVER_REF injection tokens, PopoverRef interface, PopoverTemplateContext interface
  popover.spec.ts       — Vitest tests
  index.ts              — public API exports
  ng-package.json       — { "lib": { "entryFile": "index.ts" } }
```

Tests must cover: default render with template content, all size variants, color accent variant (border-t class present), position input changes, trigger modes (click, focus, manual), disabled state blocking open, `twPopoverOpen` model two-way sync, `twPopoverData` passed to template context, `PopoverCloseDirective` closing on click, ARIA attributes (`aria-haspopup`, `aria-expanded`, `aria-controls`, `role="dialog"`), escape key closing, focus moving into panel on open and returning to trigger on close, backdrop click closing, focus returning to trigger on backdrop click (not just Escape), overlay reuse across open/close cycles (no new OverlayRef on second open). No `fakeAsync` -- use `async/await` with `fixture.whenStable()`.

## Public API exports

From `index.ts`:
```typescript
export { PopoverDirective, type PopoverPosition, type PopoverScrollStrategy, type PopoverBackdrop, type PopoverTrigger } from './popover';
export { PopoverCloseDirective } from './popover-close';
export { POPOVER_DATA, POPOVER_REF, type PopoverRef, type PopoverTemplateContext } from './popover-tokens';
```

Add `export * from 'ngx-tw/popover';` to `projects/ngx-tw/src/public-api.ts`.

## Constraints

- All conventions from CLAUDE.md apply. Key reminders for this artifact:
  - `ChangeDetection.OnPush` on the internal overlay component.
  - `host` object for all host bindings -- never `@HostBinding` / `@HostListener`.
  - `inject()` for DI -- no constructor injection.
  - `input()` / `model()` / `output()` signal APIs -- `model()` only for `twPopoverOpen`.
  - Inline template on the internal component (it should be well under 50 lines).
  - Semantic tokens only -- `bg-surface-overlay`, `border-border`, `text-fg` -- never raw palette colors.
  - `animate.enter` / `animate.leave` -- never `@angular/animations`.
  - Vitest with `vi.spyOn()`, no `fakeAsync` / `tick`.
  - JSDoc on every `input()`, `output()`, `model()`, and public method.
  - `twMerge: true` in `tv()` config.
- **CDK Overlay lifecycle:** `OverlayRef` must be created once on first open and reused for the directive's lifetime. On close, call `detach()` only. Call `dispose()` only in `DestroyRef.onDestroy()`. Never dispose and recreate the overlay on each open/close cycle.
- **Subscription cleanup:** Per-open subscriptions (`backdropClick()`, `outsidePointerEvents()`, `keydownEvents()`) must be collected in a `Subscription` and unsubscribed on every close. `positionChanges` uses `takeUntilDestroyed(this.destroyRef)` from `@angular/core/rxjs-interop`.
- **Close animation:** `overlayRef.detach()` must be called **after** a 150ms delay to allow `animate.leave` CSS animations to play. Never call `detach()` synchronously in the close path.
- **Focus return:** Focus must return to `elementRef.nativeElement` on **every** close path (Escape, backdrop click, outside click, programmatic, model-driven). Not just on Escape.
- **Effect cycle prevention:** Use `untracked()` from `@angular/core` when setting `twPopoverOpen` to `false` inside `closePopover()` to prevent the `effect()` from re-triggering a redundant close cycle.
- **Close re-entry guard:** Use a `closing` flag to prevent `closePopover()` from executing concurrently (e.g., if backdrop click and Escape fire in quick succession during the 150ms animation window).
