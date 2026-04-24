# Prompt: Build `tw-menu` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system, animation rules, testing rules
- `projects/ngx-tw/tooltip/tooltip.ts` — pattern for CDK Overlay composition, `animate.enter`/`animate.leave` host bindings, `tv()` with slots
- `projects/ngx-tw/button/button.ts` — directive pattern, `hostDirectives` inspiration, `computed()` → host class binding
- `projects/ngx-tw/card/card.ts` — multi-slot `tv()` config, child directives that inject parent for variant propagation
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types
- `node_modules/@angular/cdk/fesm2022/menu.mjs` — CDK Menu primitives: `CdkMenu`, `CdkMenuTrigger`, `CdkMenuItem`, `CdkMenuItemCheckbox`, `CdkMenuItemRadio`, `CdkMenuGroup`, `CdkContextMenuTrigger`, `CdkTargetMenuAim`

## What to build

A composable menu system for ngx-tw that layers Tailwind CSS styling on top of Angular CDK Menu primitives. The system consists of **thin directive/component wrappers** that use `hostDirectives` to compose CDK behavior and add visual styling via `tv()`. CDK handles all keyboard navigation, focus management, ARIA attributes, overlay positioning, submenu lifecycle, and typeahead. The ngx-tw layer adds: visual appearance, size/color variants, enter/leave animations, and convenience content-projection directives for icons, descriptions, and shortcut hints.

The menu supports: single-level dropdowns, nested submenus, checkbox items, radio item groups, item groups with optional labels, destructive items, disabled items, context menus, and compact/default sizing.

## API design

### Directives and components

**`MenuComponent`** — Component, selector: `tw-menu`, hosts `CdkMenu` via `hostDirectives` (exposing `closed` output and `orientation` input). This is the menu panel container rendered inside CDK's overlay.

### Inputs (MenuComponent)
- `/** Controls item density and padding. Defaults to `'md'`. */` — `size = input<TwSize>('md')`

**`MenuTriggerDirective`** — Directive, selector: `[twMenuTrigger]`, hosts `CdkMenuTrigger` via `hostDirectives` (exposing `menuTemplateRef` as `twMenuTrigger`, `opened`, `closed`). No visual styling — the consumer applies `twButton` or their own element. This is a pure behavioral bridge.

**`ContextMenuTriggerDirective`** — Directive, selector: `[twContextMenuTrigger]`, hosts `CdkContextMenuTrigger` via `hostDirectives` (exposing `menuTemplateRef` as `twContextMenuTrigger`, `opened`, `closed`, `disabled`). Right-click trigger.

**`MenuItemDirective`** — Directive, selector: `[twMenuItem]`, hosts `CdkMenuItem` via `hostDirectives` (exposing `disabled`, `triggered`). Applies visual styling to the host element.

### Inputs (MenuItemDirective)
- `/** Semantic color of the item. Use `'error'` for destructive actions. Defaults to `'default'`. */` — `color = input<'default' | TwColor>('default')`

**`MenuItemCheckboxDirective`** — Directive, selector: `[twMenuItemCheckbox]`, hosts `CdkMenuItemCheckbox` via `hostDirectives` (exposing `disabled`, `triggered`, `checked` aliased as `cdkMenuItemChecked`). Renders a check indicator in the leading slot when checked.

**`MenuItemRadioDirective`** — Directive, selector: `[twMenuItemRadio]`, hosts `CdkMenuItemRadio` via `hostDirectives` (exposing `disabled`, `triggered`, `checked` aliased as `cdkMenuItemChecked`). Renders a dot indicator when checked.

**`MenuGroupDirective`** — Directive, selector: `[twMenuGroup]`, hosts `CdkMenuGroup` via `hostDirectives`. Applies structural styling (padding separation between groups). Groups are visually separated by a border divider rendered by the directive.

**`MenuItemIconDirective`** — Directive, selector: `[twMenuItemIcon]`. Styles a leading icon inside a menu item. No CDK dependency.

**`MenuItemDescriptionDirective`** — Directive, selector: `[twMenuItemDescription]`. Styles secondary description text. No CDK dependency.

**`MenuItemShortcutDirective`** — Directive, selector: `[twMenuItemShortcut]`. Right-aligns and mutes keyboard shortcut hint text. No CDK dependency.

**`MenuItemSubmenuIndicatorDirective`** — Directive, selector: `[twMenuItemSubmenuIcon]`. Styles the trailing chevron for submenu triggers. No CDK dependency.

### Outputs
CDK directives expose their outputs through `hostDirectives` — `triggered` on items, `opened`/`closed` on triggers and menu. No custom outputs needed.

### Content projection
All directives use the host element pattern — no internal templates with `ng-content` except:
- `MenuComponent` (`tw-menu`): `<ng-content />` wrapping all menu items
- `MenuItemCheckboxDirective` and `MenuItemRadioDirective`: inject the parent `MenuComponent` for size propagation; the check/radio indicator is rendered via a pseudo-element or an inline SVG in the template (a small internal template is acceptable here)

## Usage examples

```html
<!-- Simplest menu -->
<button twButton [twMenuTrigger]="menu">Options</button>
<ng-template #menu>
  <tw-menu>
    <button twMenuItem>Edit</button>
    <button twMenuItem>Duplicate</button>
    <button twMenuItem disabled>Archive</button>
    <button twMenuItem color="error">Delete</button>
  </tw-menu>
</ng-template>
```

```html
<!-- Menu with icons, descriptions, and shortcuts -->
<button twButton [twMenuTrigger]="fileMenu">File</button>
<ng-template #fileMenu>
  <tw-menu>
    <button twMenuItem>
      <svg twMenuItemIcon><!-- icon --></svg>
      New File
      <span twMenuItemShortcut>Ctrl+N</span>
    </button>
    <button twMenuItem>
      <svg twMenuItemIcon><!-- icon --></svg>
      Open
      <span twMenuItemShortcut>Ctrl+O</span>
    </button>
    <tw-separator />
    <button twMenuItem>
      Save
      <span twMenuItemDescription>Last saved 2 minutes ago</span>
    </button>
  </tw-menu>
</ng-template>
```

```html
<!-- Nested submenu -->
<ng-template #parentMenu>
  <tw-menu>
    <button twMenuItem>Cut</button>
    <button twMenuItem [twMenuTrigger]="shareMenu">
      Share
      <svg twMenuItemSubmenuIcon><!-- chevron-right --></svg>
    </button>
  </tw-menu>
</ng-template>
<ng-template #shareMenu>
  <tw-menu>
    <button twMenuItem>Email</button>
    <button twMenuItem>Slack</button>
  </tw-menu>
</ng-template>
```

```html
<!-- Checkbox and radio items -->
<ng-template #viewMenu>
  <tw-menu>
    <div twMenuGroup>
      <button twMenuItemCheckbox [cdkMenuItemChecked]="showToolbar()">Toolbar</button>
      <button twMenuItemCheckbox [cdkMenuItemChecked]="showSidebar()">Sidebar</button>
    </div>
    <tw-separator />
    <div twMenuGroup>
      <button twMenuItemRadio [cdkMenuItemChecked]="viewMode() === 'grid'">Grid</button>
      <button twMenuItemRadio [cdkMenuItemChecked]="viewMode() === 'list'">List</button>
    </div>
  </tw-menu>
</ng-template>
```

```html
<!-- Context menu -->
<div [twContextMenuTrigger]="ctxMenu" class="h-64 border border-border rounded-lg">
  Right-click here
</div>
<ng-template #ctxMenu>
  <tw-menu size="sm">
    <button twMenuItem>Inspect</button>
    <button twMenuItem>View Source</button>
  </tw-menu>
</ng-template>
```

```html
<!-- Compact size -->
<ng-template #compactMenu>
  <tw-menu size="xs">
    <button twMenuItem>Tiny item</button>
    <button twMenuItem>Another item</button>
  </tw-menu>
</ng-template>
```

```html
<!-- Large size with colored items -->
<ng-template #actionsMenu>
  <tw-menu size="lg">
    <button twMenuItem color="primary">Approve</button>
    <button twMenuItem color="success">Merge</button>
    <button twMenuItem color="warning">Request Changes</button>
    <button twMenuItem color="error">Reject</button>
  </tw-menu>
</ng-template>
```

## Styling

### `tv()` config — menu panel (`tw-menu`)

Slots: `panel`. No slots needed — single host element.

**Base:** `min-w-48 rounded-lg bg-surface-overlay border border-border shadow-md overflow-y-auto p-1 text-fg`

**Variants:**
- `size`:
  - `xs`: `p-0.5`
  - `sm`: `p-0.5`
  - `md`: `p-1`
  - `lg`: `p-1.5`
  - `xl`: `p-2`

**`defaultVariants`:** `{ size: 'md' }`. Enable `twMerge`.

### `tv()` config — menu item (`twMenuItem`)

**Base:** `relative flex items-center gap-2 rounded-md text-sm cursor-pointer select-none transition-colors duration-200 motion-reduce:transition-none text-fg outline-none focus-visible:bg-surface-muted hover:bg-surface-muted`

**Variants:**
- `size`:
  - `xs`: `px-1.5 py-0.5 text-xs`
  - `sm`: `px-2 py-1 text-xs`
  - `md`: `px-3 py-1.5 text-sm`
  - `lg`: `px-4 py-2 text-sm`
  - `xl`: `px-5 py-2.5 text-base`
- `color`:
  - `default`: (no extra classes)
  - `primary`: `text-primary-700 hover:bg-primary-50 focus-visible:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950 dark:focus-visible:bg-primary-950`
  - `secondary`: `text-secondary-700 hover:bg-secondary-50 focus-visible:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-950 dark:focus-visible:bg-secondary-950`
  - `accent`: `text-accent-700 hover:bg-accent-50 focus-visible:bg-accent-50 dark:text-accent-300 dark:hover:bg-accent-950 dark:focus-visible:bg-accent-950`
  - `info`: `text-info-700 hover:bg-info-50 focus-visible:bg-info-50 dark:text-info-300 dark:hover:bg-info-950 dark:focus-visible:bg-info-950`
  - `success`: `text-success-700 hover:bg-success-50 focus-visible:bg-success-50 dark:text-success-300 dark:hover:bg-success-950 dark:focus-visible:bg-success-950`
  - `warning`: `text-warning-700 hover:bg-warning-50 focus-visible:bg-warning-50 dark:text-warning-300 dark:hover:bg-warning-950 dark:focus-visible:bg-warning-950`
  - `error`: `text-error-700 hover:bg-error-50 focus-visible:bg-error-50 dark:text-error-300 dark:hover:bg-error-950 dark:focus-visible:bg-error-950`
  - `neutral`: `text-fg-muted hover:bg-surface-muted focus-visible:bg-surface-muted`
- `disabled`:
  - `true`: `opacity-50 pointer-events-none`

**`defaultVariants`:** `{ size: 'md', color: 'default', disabled: false }`. Enable `twMerge`.

The `size` variant is inherited from the parent `tw-menu` via `inject(MenuComponent)`. The item's `computed()` reads the parent's `size` signal.

### Menu item sub-directives

- **`twMenuItemIcon`:** `size-4 shrink-0 text-fg-muted` (for `xs`–`md`), `size-5 shrink-0 text-fg-muted` (for `lg`–`xl`). When `color` is a semantic color (non-default): inherit the item's text color.
- **`twMenuItemDescription`:** `block text-xs text-fg-muted mt-0.5 min-w-0 truncate`. Full width below label. The item should use `flex-col` layout when a description child is detected (via `contentChild()` query on the item directive).
- **`twMenuItemShortcut`:** `ml-auto pl-3 text-xs text-fg-subtle tracking-wide`. Pushed to the right edge.
- **`twMenuItemSubmenuIcon`:** `ml-auto pl-2 size-4 shrink-0 text-fg-muted`. Chevron pointing right (or left in RTL — consumer provides the icon, not the library).
- **`twMenuGroup`:** No visual styling on the host. The group itself is just a semantic wrapper. Use `tw-separator` between groups for visual dividers — the consumer places separators explicitly.

### Checkbox/radio indicators

- Checkbox items: reserve `size-4` leading space. When checked, show a checkmark icon (inline SVG in the directive's template — small enough to inline). When unchecked, the space is empty.
- Radio items: same pattern with a filled circle indicator.
- Both inject the parent `MenuComponent` for size.

## Accessibility

CDK Menu handles all ARIA attributes automatically:
- `role="menu"` on `CdkMenu`
- `role="menuitem"` on `CdkMenuItem`
- `role="menuitemcheckbox"` on `CdkMenuItemCheckbox`
- `role="menuitemradio"` on `CdkMenuItemRadio`
- `role="group"` on `CdkMenuGroup`
- `aria-haspopup`, `aria-expanded` on triggers
- `aria-checked` on selectable items
- `aria-disabled` on disabled items

**Keyboard behavior** (all handled by CDK):
- `ArrowDown` / `ArrowUp` — move focus between items
- `ArrowRight` — open submenu (or `ArrowLeft` in RTL)
- `ArrowLeft` — close submenu, return to parent (or `ArrowRight` in RTL)
- `Enter` / `Space` — activate focused item
- `Escape` — close current menu, return focus to trigger
- `Home` / `End` — move to first/last item
- `Tab` — close all menus
- Typeahead — CDK's built-in type-to-select

**Focus management:** CDK handles focus trapping within the menu and restoring focus to the trigger on close. The ngx-tw layer adds `focus-visible:bg-surface-muted` for visual focus indicators (outline-free — menus use background highlight for focus, not outline rings, since items are tightly packed).

## Implementation notes

- Each directive uses `hostDirectives` to compose the corresponding CDK directive. Expose CDK inputs/outputs via the `inputs`/`outputs` arrays in `hostDirectives` config, aliasing where needed (e.g., `menuTemplateRef` aliased to `twMenuTrigger`).
- `MenuComponent` is a component (not directive) because it needs a template for `<ng-content />` and hosts `animate.enter`/`animate.leave`. It uses `CdkMenu` as a host directive.
- Item directives inject `MenuComponent` to read the `size()` signal. Use `inject(MenuComponent, { optional: true })` — if no parent menu exists, fall back to `'md'`.
- The `MenuItemDirective`'s `computed()` merges the parent `size` with its own `color` and `disabled` inputs to produce the class string.
- For checkbox/radio items: the directive wraps the projected content with a small inline template that includes the indicator SVG and a `<ng-content />`. The template should be minimal (under 10 lines). Use `@if` on CDK's `checked` attribute to toggle indicator visibility.
- Add `scale-in` and `scale-out` keyframe animations to `projects/ngx-tw/theme/_base.css` for menu enter/leave. Definition: scale from 95% to 100% opacity 0→1 over 150ms. The `MenuComponent` uses `host: { '[animate.enter]': '"scale-in fade-in"', '[animate.leave]': '"scale-out fade-out"' }`.
- CDK handles RTL via `Directionality`. No extra work needed.
- The `twMenuTrigger` directive should set `aria-haspopup="menu"` on the host if CDK doesn't already (verify — CDK should handle this).

## File structure

All files in `projects/ngx-tw/menu/`:

- `menu.ts` — all directives and the `MenuComponent`: `MenuComponent`, `MenuTriggerDirective`, `ContextMenuTriggerDirective`, `MenuItemDirective`, `MenuItemCheckboxDirective`, `MenuItemRadioDirective`, `MenuGroupDirective`, `MenuItemIconDirective`, `MenuItemDescriptionDirective`, `MenuItemShortcutDirective`, `MenuItemSubmenuIndicatorDirective`
- `menu.spec.ts` — Vitest tests covering: default render of menu with items, all size variants (`xs`, `sm`, `md`, `lg`, `xl`), disabled items block interaction, all color variants (full `TwColor` set + `'default'`), checkbox item toggling, radio item mutual exclusion, submenu opening via keyboard, context menu trigger, shortcut/description/icon directives render correctly, ARIA attributes present, focus moves with arrow keys. No `fakeAsync` — use `async/await` with `fixture.whenStable()`.
- `index.ts` — public API exports
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

Also update:
- `projects/ngx-tw/theme/_base.css` — add `scale-in`/`scale-out` keyframe animations
- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/menu';`

## Public API exports

From `index.ts`:
```
MenuComponent, MenuTriggerDirective, ContextMenuTriggerDirective,
MenuItemDirective, MenuItemCheckboxDirective, MenuItemRadioDirective,
MenuGroupDirective, MenuItemIconDirective, MenuItemDescriptionDirective,
MenuItemShortcutDirective, MenuItemSubmenuIndicatorDirective
```

Re-export CdkMenuModule from `@angular/cdk/menu` is NOT needed — consumers import ngx-tw directives only. The CDK directives are composed internally via `hostDirectives`.

## Constraints

- No `@angular/animations` — use `animate.enter`/`animate.leave` with CSS classes defined in theme
- No CSS files on components — Tailwind utilities only
- `ChangeDetection.OnPush` on the `MenuComponent`
- Signal-based APIs: `input()`, `computed()` only — no `model()` needed (menu has no two-way bound value)
- `host` object for all host bindings — no `@HostBinding`/`@HostListener`
- All colors semantic — `surface-overlay`, `text-fg`, `border-border`, `error-700` — no raw palette
- `tv()` with `twMerge: true` and `defaultVariants`
- JSDoc on every `input()` and `output()`
- Tests: Vitest, no `fakeAsync`, use `vi.spyOn()` for spies
