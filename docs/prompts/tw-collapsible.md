# Prompt: Build `tw-collapsible` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, animation rules
- `projects/ngx-tw/tabs/tabs.ts` — pattern for parent-child component coordination, `contentChildren()`, `linkedSignal()`, keyboard navigation, `LiveAnnouncer`
- `projects/ngx-tw/card/card.ts` — pattern for multi-slot `tv()` with directives that `inject()` the parent component to read slot classes
- `projects/ngx-tw/alert/alert.ts` — pattern for `contentChild()` presence detection, `animate.leave`, variant + color compoundVariants
- `projects/ngx-tw/theme/_base.css` — existing animation keyframes; new collapsible-specific keyframes will be added here
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types

## What to build

Two components and supporting directives for expandable/collapsible content sections:

1. **`CollapsibleComponent`** (`tw-collapsible`) — an individual expandable panel with a trigger (header) and collapsible content body. Works standalone or inside a group.
2. **`CollapsibleGroupComponent`** (`tw-collapsible-group`) — an optional wrapper that coordinates multiple collapsible children. Supports accordion mode (only one open at a time) and independent mode (multiple open).

The collapsible is a multi-part component with slots: root, trigger, icon, and content. Styling is driven by `tv()` with slots. The trigger is always visible; the content conditionally renders with `@if` and uses `animate.enter`/`animate.leave` for smooth appearance.

## API design

### `CollapsibleComponent` — selector: `tw-collapsible`

#### Inputs
- `/** Unique identifier for this panel. Required when used inside a group. */` `value = input<string>('')`
- `/** Controls the visual style. Defaults to `'default'`. */` `variant = input<CollapsibleVariant>('default')`
- `/** Sets the semantic color. Applies to `bordered` and `filled` variants. Defaults to `'neutral'`. */` `color = input<TwColor>('neutral')`
- `/** Controls padding of trigger and content sections. Defaults to `'md'`. */` `size = input<TwSize>('md')`
- `/** When true, the panel cannot be toggled and appears dimmed. Defaults to `false`. */` `disabled = input(false)`
- `/** When true, content is rendered on first open and kept in the DOM across toggles. Prevents child component re-initialization and server re-fetches. When false, content is destroyed on close and recreated on open. Defaults to `false`. */` `keepAlive = input(false)`

#### Models
- `/** Whether the panel is expanded. Two-way bindable. Defaults to `false`. */` `open = model(false)`

#### Outputs
- `/** Fires after the panel is toggled. Payload is the new open state. */` `toggled = output<boolean>()`

#### Content projection
- `ng-content select="[twCollapsibleTrigger]"` — **structural slot, no fallback.** Consumer must provide a trigger. The directive auto-applies trigger styling, ARIA attributes, keyboard handling, and the icon.
- `ng-content select="[twCollapsibleIcon]"` — **optional slot with fallback.** Default: a chevron SVG that rotates 180deg when open. Consumer can replace with any icon element.
- `ng-content` (default slot) — the collapsible body content. Visibility strategy depends on `keepAlive` input (see Content Rendering Strategy section).

### `CollapsibleGroupComponent` — selector: `tw-collapsible-group`

#### Inputs
- `/** When true, only one panel can be open at a time. Defaults to `false`. */` `accordion = input(false)`

#### Models
- `/** The value(s) of currently open panels. String in accordion mode, string array in independent mode. Two-way bindable. */` `value = model<string | string[]>('')`

### Directives

- **`CollapsibleTriggerDirective`** (`[twCollapsibleTrigger]`) — attribute directive applied to the trigger element. Injects parent `CollapsibleComponent` to read slot classes. Sets host bindings: `role="button"`, `[attr.aria-expanded]`, `[attr.aria-controls]`, `tabindex="0"`, `(click)` and `(keydown)` handlers for Enter/Space. Applies trigger slot classes from `tv()`.
- **`CollapsibleIconDirective`** (`[twCollapsibleIcon]`) — attribute directive for custom icons. Injects parent to read icon slot classes. Applied by consumer on their custom icon element.

### Types
- `CollapsibleVariant = 'default' | 'bordered' | 'ghost' | 'filled'`

## Usage examples

```html
<!-- Simplest case: standalone collapsible -->
<tw-collapsible>
  <button twCollapsibleTrigger>Section title</button>
  <p>Collapsible content here.</p>
</tw-collapsible>
```

```html
<!-- Two-way binding on open state -->
<tw-collapsible [(open)]="isPanelOpen" variant="bordered" color="primary">
  <button twCollapsibleTrigger>Details</button>
  <div>Rich content with other components inside.</div>
</tw-collapsible>
```

```html
<!-- Custom icon (plus/minus) -->
<tw-collapsible>
  <button twCollapsibleTrigger>
    FAQ Question
    <svg twCollapsibleIcon><!-- custom plus/minus SVG --></svg>
  </button>
  <p>Answer goes here.</p>
</tw-collapsible>
```

```html
<!-- Accordion mode: only one open at a time -->
<tw-collapsible-group accordion [(value)]="activePanel">
  <tw-collapsible value="a" variant="filled" color="info">
    <button twCollapsibleTrigger>Panel A</button>
    <p>Content A</p>
  </tw-collapsible>
  <tw-collapsible value="b" variant="filled" color="info">
    <button twCollapsibleTrigger>Panel B</button>
    <p>Content B</p>
  </tw-collapsible>
</tw-collapsible-group>
```

```html
<!-- Independent mode: multiple open, size variant -->
<tw-collapsible-group [(value)]="openPanels">
  <tw-collapsible value="x" size="sm">
    <button twCollapsibleTrigger>Small panel</button>
    <p>Compact content.</p>
  </tw-collapsible>
  <tw-collapsible value="y" size="lg">
    <button twCollapsibleTrigger>Large panel</button>
    <p>Spacious content.</p>
  </tw-collapsible>
</tw-collapsible-group>
```

```html
<!-- Disabled state -->
<tw-collapsible disabled>
  <button twCollapsibleTrigger>Cannot toggle</button>
  <p>This content is hidden and toggle is blocked.</p>
</tw-collapsible>
```

```html
<!-- keepAlive: content with server requests survives collapse -->
<tw-collapsible keepAlive>
  <button twCollapsibleTrigger>User Activity</button>
  <app-activity-feed userId="123" />  <!-- fetches on init, preserved across toggles -->
</tw-collapsible>
```

```html
<!-- keepAlive in accordion: only first open triggers component init -->
<tw-collapsible-group accordion [(value)]="activePanel">
  <tw-collapsible value="users" keepAlive variant="bordered">
    <button twCollapsibleTrigger>Users</button>
    <app-user-list />  <!-- expensive component, kept alive -->
  </tw-collapsible>
  <tw-collapsible value="logs" keepAlive variant="bordered">
    <button twCollapsibleTrigger>Audit Logs</button>
    <app-audit-log />  <!-- server-fetched, kept alive -->
  </tw-collapsible>
</tw-collapsible-group>
```

## Styling

### `tv()` config — multi-slot

Slots: `root`, `trigger`, `icon`, `content`.

**Base classes:**
- `root`: `rounded-lg overflow-hidden`
- `trigger`: `flex w-full items-center justify-between gap-3 cursor-pointer text-sm font-medium text-fg transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`
- `icon`: `size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none` — rotates via a `data-open` attribute: `[data-open="true"] .icon { rotate: 180deg }` — actually, apply rotation inline via computed class: when open, add `rotate-180`.
- `content`: `text-sm text-fg`

**Variants — `variant`:**
- `default`: root gets no background/border. Trigger gets `hover:bg-surface-muted`. Clean, minimal. Items separated by border-b when in a group.
- `bordered`: root gets `border border-border`. Trigger gets `hover:bg-surface-muted`. Content gets top border separator.
- `ghost`: root gets no background/border. Trigger gets `hover:bg-surface-muted rounded-md`. Very subtle.
- `filled`: root gets no explicit background (set via compoundVariants per color). Trigger background shifts on hover.

**Variants — `size`:** Apply the spacing scale from CLAUDE.md to trigger (inline padding pattern: `px-4 py-2` for md) and content (container padding: `p-4` for md). Font size follows the trigger font size scale.

**Variants — `color`:** Empty objects in the `color` variant; actual styling via `compoundVariants` for `filled` + each color (`bg-{color}-50 text-{color}-800`, trigger hover `hover:bg-{color}-100`) and `bordered` + each color (`border-{color}-300`). Neutral uses surface/fg/border tokens.

Enable `twMerge: true`. Define `defaultVariants: { variant: 'default', color: 'neutral', size: 'md' }`.

### Default chevron icon

The trigger template includes a default chevron SVG (Heroicons `chevron-down`, `size-5`). It gets a `rotate-180` class added via computed when `open` is true, producing a smooth rotation via the `transition-transform duration-200` on the icon slot.

### Content Rendering Strategy

The component uses a **dual rendering strategy** controlled by the `keepAlive` input. This follows the same pattern as `TabsComponent` (see `projects/ngx-tw/tabs/tabs.ts` — `activatedTabs` signal, `shouldRenderPanel()`, `[hidden]`).

**`keepAlive = false` (default) — destroy on close:**
- Content wrapped in `@if (open())` — destroyed when collapsed, recreated when expanded
- Uses `animate.enter="collapsible-enter"` / `animate.leave="collapsible-leave"` for smooth enter/leave keyframe animations on every toggle cycle
- Best for: static content, text, simple displays
- Trade-off: child components re-initialize on every open (triggers `ngOnInit`, server fetches, etc.)

**`keepAlive = true` — render once, keep alive:**
- Track whether this panel has been opened at least once via an `activated` signal (boolean, initially `false`, set to `true` on first open)
- Content wrapped in `@if (activated())` — enters DOM on first open, stays forever
- Visibility toggled via a wrapper with CSS `grid-template-rows` transition (not `[hidden]`, to enable smooth height animation):
  ```html
  @if (activated()) {
    <div [class]="contentClasses()"
         [attr.data-open]="open()"
         role="region"
         [attr.aria-labelledby]="triggerId">
      <div class="overflow-hidden">
        <ng-content />
      </div>
    </div>
  }
  ```
- `animate.enter="collapsible-enter"` on the wrapper fires only on first open
- Subsequent toggles animate via CSS transitions on the wrapper (grid-template-rows + opacity)
- Best for: components with server requests, forms, scroll state, expensive renders
- Trade-off: collapsed content stays in DOM (memory), but no re-initialization cost

**Implementation detail:** The component template handles both modes in a single `@if`:
```html
@if (keepAlive() ? activated() : open()) {
  <div [class]="contentClasses()"
       [attr.data-open]="open()"
       [class.collapsible-keep-alive]="keepAlive()"
       [animate.enter]="'collapsible-enter'"
       [animate.leave]="keepAlive() ? undefined : 'collapsible-leave'"
       role="region"
       [attr.aria-labelledby]="triggerId">
    <div class="overflow-hidden">
      <ng-content />
    </div>
  </div>
}
```

### Animations

**Add to `projects/ngx-tw/theme/_base.css`:**

**Keyframe animations (for `keepAlive=false` and first open of `keepAlive=true`):**
- `@keyframes collapsible-enter` — animates from `opacity: 0; max-height: 0` to `opacity: 1; max-height: var(--collapsible-max-height, 500px)` over 150ms ease-out
- `@keyframes collapsible-leave` — reverse of enter, 150ms ease-in
- Add both to `prefers-reduced-motion: reduce` block with `animation-duration: 0ms`

**CSS transitions (for `keepAlive=true` subsequent toggles):**
```css
.collapsible-keep-alive {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows 150ms ease, opacity 150ms ease;
}
.collapsible-keep-alive[data-open="false"] {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapsible-keep-alive {
    transition-duration: 0ms;
  }
}
```

## Accessibility

**ARIA:**
- Trigger: `role="button"`, `aria-expanded="true|false"`, `aria-controls="[panel-id]"`, `tabindex="0"`
- Content panel: `role="region"`, `aria-labelledby="[trigger-id]"`, `id="[panel-id]"`
- Disabled trigger: `aria-disabled="true"`, no `tabindex` change (still focusable, but toggle is blocked)
- Group: `role="group"` on the host (not `role="tablist"` — collapsibles are not tabs)

**Keyboard behavior:**
- `Enter` / `Space` on trigger: toggle the panel
- When inside a `CollapsibleGroupComponent`:
  - `ArrowDown`: move focus to next collapsible trigger
  - `ArrowUp`: move focus to previous collapsible trigger
  - `Home`: move focus to first trigger
  - `End`: move focus to last trigger

**Focus management:** Use `FocusMonitor` from `@angular/cdk/a11y` on triggers to track focus origin. Announce state changes via `LiveAnnouncer` — e.g., "Section expanded" / "Section collapsed".

## Implementation notes

- `CollapsibleComponent` generates unique IDs for trigger and panel using a module-level counter (same pattern as tabs).
- When inside a `CollapsibleGroupComponent`, the collapsible registers itself. The group injects its children via `contentChildren(CollapsibleComponent)`. On toggle, if `accordion` is true, the group closes all other panels before opening the toggled one. Coordination: the group listens to each child's `toggled` output or the child checks `inject(CollapsibleGroupComponent, { optional: true })` and defers open/close logic to the group.
- The `open` state on `CollapsibleComponent` uses `linkedSignal()` — it defaults from the `model()` input but can also be set by the group. When a group is present, toggling updates the group's `value` model, which in turn drives each child's `open` state.
- **`keepAlive` rendering:** The component tracks an `activated` signal (boolean). On first open, `activated` is set to `true` and never reverts. The `@if` condition is `keepAlive() ? activated() : open()`. When `keepAlive=true`, the content wrapper gets the `collapsible-keep-alive` CSS class which uses `grid-template-rows` transitions. The `[data-open]` attribute drives the collapsed/expanded CSS state. The inner `<div class="overflow-hidden">` is required for the grid-row animation to clip content during collapse.
- The `CollapsibleTriggerDirective` handles click and keydown on its host element. It injects the parent `CollapsibleComponent` and calls a `toggle()` method.
- The default chevron SVG is rendered inside the trigger's template, after the projected trigger content and before any `twCollapsibleIcon` override. Use `contentChild(CollapsibleIconDirective)` to detect if a custom icon was provided; if so, skip the default chevron.
- The template should be ~30-40 lines inline. If it grows beyond 50 lines, extract to `collapsible.html`.

## File structure

All files in `projects/ngx-tw/collapsible/`:

- `collapsible.ts` — `CollapsibleComponent`, `CollapsibleGroupComponent`, `CollapsibleTriggerDirective`, `CollapsibleIconDirective`, `CollapsibleVariant` type
- `collapsible.spec.ts` — Vitest tests covering: default render, all four variants, all size/color combinations render without error, `open` model two-way binding, `toggled` output emission, click toggle, Enter/Space keyboard toggle, disabled state blocks toggle, accordion mode (only one open), independent mode (multiple open), arrow key navigation in group, ARIA attributes (`aria-expanded`, `aria-controls`, `role`), content projection (custom trigger, custom icon, default chevron fallback), `LiveAnnouncer` called on toggle, **`keepAlive` tests**: content stays in DOM after close (`keepAlive=true`), content destroyed after close (`keepAlive=false`), child component not re-initialized on re-open with `keepAlive`, `activated` signal set on first open, `data-open` attribute toggles correctly, `collapsible-keep-alive` class applied only when `keepAlive=true`. No `fakeAsync`.
- `index.ts` — public API exports
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

Also update:
- `projects/ngx-tw/theme/_base.css` — add `collapsible-enter` / `collapsible-leave` keyframes + reduced motion handling
- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/collapsible';`

## Public API exports

From `projects/ngx-tw/collapsible/index.ts`:
```typescript
export { CollapsibleComponent, CollapsibleGroupComponent, CollapsibleTriggerDirective, CollapsibleIconDirective } from './collapsible';
export type { CollapsibleVariant } from './collapsible';
```

## Constraints

- All styling via Tailwind utilities and `tv()` — no CSS files on components
- Semantic color tokens only — never raw palette colors
- Neutral structural styling uses surface/fg/border tokens
- `ChangeDetection.OnPush` on all components
- Signal-based APIs: `input()`, `model()`, `output()`, `computed()`, `linkedSignal()`
- `host` object for host bindings — no `@HostBinding`/`@HostListener`
- `inject()` for DI — no constructor injection
- `animate.enter`/`animate.leave` for animations — no `@angular/animations`
- Tests: Vitest with `vi.spyOn()`, `async/await`, no `fakeAsync`
- JSDoc on every public `input()`, `output()`, `model()`
- Visual tokens from CLAUDE.md design system — no invented values
