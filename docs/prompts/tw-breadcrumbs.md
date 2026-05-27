# Prompt: Build `tw-breadcrumbs` for ngx-tw

## Context

Before writing code, read:

- `.claude/CLAUDE.md` — conventions, semantic tokens, focus-ring policy, animation rules, visual design system.
- `projects/ngx-tw/tab-nav/tab-nav.ts` — closest navigation-semantics peer (`<nav>` landmark with `aria-label`, `aria-current="page"` pattern, anchor link styling).
- `projects/ngx-tw/menu/menu.ts` — overflow popover pattern (`MenuComponent`, `MenuTriggerDirective`, `CdkMenuTrigger`).
- `projects/ngx-tw/icon/icon.ts` — default separator glyph (`tw-icon`); the registry expects kebab-case names.
- `projects/ngx-tw/core/index.ts` — `TwSize`.

CDK modules required: `@angular/cdk/menu` (via the existing `tw-menu` wrapper).

---

## What to build

A single component **`tw-breadcrumbs`** that renders a breadcrumb trail: a horizontal list of navigation hops ending in the current page. It uses the WAI-ARIA navigation landmark pattern — `<nav aria-label="Breadcrumb">` wrapping an `<ol>` of `<li>` items — with `aria-current="page"` on the last (current) item. Items before the last are anchors; the current item is rendered as plain text (no anchor) per WAI guidance.

When the trail exceeds `maxItems`, the middle items collapse behind an ellipsis trigger that opens a popover menu (via `tw-menu` / `CdkMenuTrigger`) listing the hidden items.

Scope decisions already locked (do not revisit):
- Items-array API only (no sibling content projection of `<a>`s). This is required for overflow truncation to work cleanly and matches Material / Radix / Chakra.
- Custom item rendering via a single `<ng-template twBreadcrumbsItem>` slot — consumers project router-aware anchors there.
- Custom separator via input (icon name) or a single `<ng-template twBreadcrumbsSeparator>` slot. Template wins when present.
- Standalone entry point `ngx-tw/breadcrumbs`.
- Reuse `TwSize` from `ngx-tw/core`; no new shared types.

---

## File layout

Create under `projects/ngx-tw/breadcrumbs/`:

| File | Role |
|---|---|
| `breadcrumbs.ts` | `BreadcrumbsComponent`, `BreadcrumbsLinkDirective`, `BreadcrumbsItemTemplateDirective`, `BreadcrumbsSeparatorTemplateDirective`, `TwBreadcrumbsItem<T>` interface, `tv()` config. |
| `index.ts` | Re-exports component, directives, types. |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |
| `breadcrumbs.spec.ts` | Vitest suite — see Test plan. |

Also:
- Add `export * from 'ngx-tw/breadcrumbs';` to `projects/ngx-tw/src/public-api.ts` (append, do not reorder).
- Add `"breadcrumbs/**/*.ts"` to `projects/ngx-tw/tsconfig.lib.json` `include`.
- Add `"breadcrumbs/**/*.spec.ts"` to `projects/ngx-tw/tsconfig.spec.json` `include`.
- Add `"../breadcrumbs/**/*.spec.ts"` to `angular.json` → `projects.ngx-tw.architect.test.options.include`.

---

## Public API

**Component:** `BreadcrumbsComponent`, selector `tw-breadcrumbs`.

**Item interface (generic):**

```ts
export interface TwBreadcrumbsItem<T = unknown> {
  /** Visible label. */
  label: string;
  /** Optional href for the anchor. Omit on the current item (last entry). */
  href?: string;
  /** Optional opaque data forwarded to the consumer's item template (e.g. router commands). */
  data?: T;
  /** When true, the item renders disabled (no anchor, muted). */
  disabled?: boolean;
}
```

The generic parameter `T` lets consumers strongly type their `data` payload (e.g. `TwBreadcrumbsItem<{ routerLink: string }>`) without unsafe casts in templates. `BreadcrumbsComponent` is also generic over the same `T`.

**Inputs (5, within the 5–6 cap — no exception claimed):**

| Name | Type | Default | Notes |
|---|---|---|---|
| `items` | `readonly TwBreadcrumbsItem[]` | `[]` | The full trail. The last entry is the current page. |
| `size` | `TwSize` | `'md'` | Drives font size, icon size, and inline padding. |
| `maxItems` | `number` | `0` | When `> 0` and `items.length > maxItems`, collapse the middle items behind an ellipsis menu. `0` disables collapsing. |
| `separator` | `string` | `'chevron-right'` | Lucide icon name used for the default separator. Ignored when a `<ng-template twBreadcrumbsSeparator>` slot is projected. |
| `ariaLabel` | `string` | `'Breadcrumb'` | Aliased as `aria-label`. Sets the `<nav>` landmark's accessible name. |

That's 5 inputs — within the 5–6 cap. The codified exceptions (overlay-bearing, form-control, structural-layout, data-primitive) do not apply; do not add more inputs without redesign.

**Slot directives:**

| Selector | Kind | TemplateRef context |
|---|---|---|
| `[twBreadcrumbsItem]` (structural, `*twBreadcrumbsItem`) | `BreadcrumbsItemTemplateDirective` | `{ $implicit: TwBreadcrumbsItem, item: TwBreadcrumbsItem, index: number, isCurrent: boolean }` |
| `[twBreadcrumbsSeparator]` (structural, `*twBreadcrumbsSeparator`) | `BreadcrumbsSeparatorTemplateDirective` | `{}` |

Discovered via `contentChild(BreadcrumbsItemTemplateDirective)` / `contentChild(BreadcrumbsSeparatorTemplateDirective)`. Both optional; component renders sensible defaults when absent.

**No outputs.** Navigation activation is owned by the anchors the consumer projects (or, in the default render, by the browser handling the `href`). The component does not emit a click event — that would duplicate native anchor semantics.

---

## ARIA wiring

```html
<nav [attr.aria-label]="ariaLabel()">
  <ol class="...">
    <!-- visible items (with overflow handling below) -->
    @for (entry of renderedEntries(); track entry.key) {
      @if (entry.kind === 'item') {
        <li>
          @if (template) {
            <ng-container *ngTemplateOutlet="template; context: { ... }" />
          } @else {
            @if (entry.isCurrent) {
              <span aria-current="page">{{ entry.item.label }}</span>
            } @else if (entry.item.href && !entry.item.disabled) {
              <a [href]="entry.item.href">{{ entry.item.label }}</a>
            } @else {
              <span [attr.aria-disabled]="entry.item.disabled ? 'true' : null">
                {{ entry.item.label }}
              </span>
            }
          }
        </li>
      } @else if (entry.kind === 'separator') {
        <li aria-hidden="true">
          <!-- separator template or default icon -->
        </li>
      } @else if (entry.kind === 'overflow') {
        <li>
          <button
            type="button"
            [twMenuTrigger]="overflowMenu"
            [attr.aria-label]="'Show more breadcrumbs'"
          >…</button>
          <ng-template #overflowMenu>
            <tw-menu>
              @for (item of collapsedItems(); track item) {
                <a twMenuItem [attr.href]="item.href ?? null" [attr.aria-disabled]="item.disabled ? 'true' : null">
                  {{ item.label }}
                </a>
              }
            </tw-menu>
          </ng-template>
        </li>
      }
    }
  </ol>
</nav>
```

Key rules:
- **`aria-current="page"`** lives on the current item ONLY. Never on an anchor — current is rendered as `<span>`.
- The separator `<li>` is `aria-hidden="true"` so screen readers traverse the trail without "chevron right" being announced.
- The overflow trigger is a real `<button>` with an `aria-label`; its label is fixed to `'Show more breadcrumbs'` (not exposed as input — keeps cap at 5).
- The `<ol>` does NOT need `role="list"` — it has that role natively; some Safari reset-CSS combinations strip it, but we don't ship a CSS reset.

---

## Overflow / truncation behavior

When `items.length > maxItems > 0`:

- Effective threshold: `effectiveMax = Math.max(maxItems, 2)` — values `< 2` are clamped to `2` because the layout always reserves at least one slot for first and one for last.
- Show: first item + ellipsis trigger + last `(effectiveMax - 1)` items.
- Hidden items are everything between index `1` and index `items.length - (effectiveMax - 1) - 1`, inclusive.
- The current page (last item) is ALWAYS visible.
- The first item is ALWAYS visible.
- `maxItems === 0` (default) → no collapsing regardless of length.
- `maxItems >= items.length` → no collapsing.
- `items.length <= 2` → no collapsing regardless of `maxItems`.

Computed signal `renderedEntries()` produces a flat list of `{ kind: 'item' | 'separator' | 'overflow', ... }` records that the template renders. Separators are inserted between items in the same computed.

The overflow menu uses `tw-menu` directly — consumer does not need to import `MenuComponent`. Re-export it internally via the component's `imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective]`.

Inside the overflow menu, items render as `<a twMenuItem [href]="item.href">{{ item.label }}</a>`. CDK applies `role="menuitem"` (overriding the native link role) — this is a deliberate trade-off: the user experiences a menu (with Up/Down navigation), and the native `<a>` ensures click and Enter actually navigate via the browser default. Disabled or href-less overflow items render as plain text inside `<span twMenuItem>` (no anchor).

---

## `tv()` variant plan

Single `tv()` config, slot-based, `twMerge: true`:

```ts
const breadcrumbs = tv({
  slots: {
    nav: '',
    list: 'flex flex-wrap items-center gap-1.5 m-0 p-0 list-none min-w-0',
    item: 'inline-flex items-center min-w-0',
    link: 'text-fg-muted hover:text-fg transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded-md no-underline truncate',
    current: 'text-fg font-medium truncate',
    disabled: 'text-fg-subtle opacity-50 cursor-not-allowed truncate',
    separator: 'inline-flex items-center text-fg-subtle shrink-0 select-none rtl:rotate-180',
    overflowTrigger:
      'inline-flex items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted ' +
      'transition-colors duration-200 motion-reduce:transition-none ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 cursor-pointer',
  },
  variants: {
    size: {
      xs: { list: 'gap-1', link: 'text-xs', current: 'text-xs', disabled: 'text-xs', separator: 'text-xs', overflowTrigger: 'size-6 text-xs' },
      sm: { list: 'gap-1', link: 'text-sm', current: 'text-sm', disabled: 'text-sm', separator: 'text-sm', overflowTrigger: 'size-7 text-sm' },
      md: { list: 'gap-1.5', link: 'text-sm', current: 'text-sm', disabled: 'text-sm', separator: 'text-sm', overflowTrigger: 'size-8 text-sm' },
      lg: { list: 'gap-2', link: 'text-base', current: 'text-base', disabled: 'text-base', separator: 'text-base', overflowTrigger: 'size-9 text-base' },
      xl: { list: 'gap-2', link: 'text-base', current: 'text-base', disabled: 'text-base', separator: 'text-base', overflowTrigger: 'size-9 text-base' },
    },
  },
  defaultVariants: { size: 'md' },
});
```

Notes:
- **`rtl:rotate-180`** on the separator flips the chevron in RTL. This relies on the `dir` attribute on a parent (`<html dir="rtl">` or a wrapping `[dir="rtl"]` element); Tailwind's `rtl:` variant handles the rest.
- Link/current/disabled all carry `truncate` + the parent `<li>` carries `min-w-0` so long labels can ellipsize. The list itself uses `flex-wrap` so the trail will wrap rather than overflow horizontally if width is tight — this is a deliberate choice (matches Chakra; reading order remains correct).
- The current item is bold-ish (`font-medium`) rather than colored. The link items are muted with `hover:text-fg`. This gives a visible hierarchy without depending on color.

---

## Icon sizing for separator

Per CLAUDE.md icon scale, default separator glyph uses `tw-icon` with `size` linked to the breadcrumb `size`:

| Breadcrumb size | Icon size |
|---|---|
| xs | `xs` (12px) |
| sm | `sm` (16px) |
| md | `sm` (16px) |
| lg | `md` (20px) |
| xl | `md` (20px) |

(`sm` icon at `md` density is the same pattern menu items use — keeps separators visually quiet.)

---

## Keyboard behavior

Default render: native — Tab moves between anchors, Enter activates the focused anchor.

Overflow ellipsis trigger:
- Tab brings focus to it like any other button.
- Enter / Space opens the menu (CDK menu handles this).
- ArrowDown also opens (CDK default for menu triggers).
- Inside the open menu, ArrowUp/Down move focus between menu items; Escape closes; Enter activates the focused link.

The component itself adds **no custom key handlers** — anchors are native, the overflow popover delegates to CDK menu.

---

## Default render layout

Final markup for a 4-item trail with no overflow:

```html
<nav aria-label="Breadcrumb" class="">
  <ol class="flex flex-wrap items-center gap-1.5 m-0 p-0 list-none min-w-0">
    <li class="inline-flex items-center min-w-0">
      <a href="/" class="text-fg-muted hover:text-fg ...">Home</a>
    </li>
    <li class="inline-flex items-center text-fg-subtle shrink-0 select-none" aria-hidden="true">
      <tw-icon name="chevron-right" size="sm" />
    </li>
    <li class="inline-flex items-center min-w-0">
      <a href="/library" class="...">Library</a>
    </li>
    <li class="..." aria-hidden="true"><tw-icon name="chevron-right" size="sm" /></li>
    <li class="inline-flex items-center min-w-0">
      <a href="/library/books" class="...">Books</a>
    </li>
    <li class="..." aria-hidden="true"><tw-icon name="chevron-right" size="sm" /></li>
    <li class="inline-flex items-center min-w-0">
      <span class="text-fg font-medium truncate" aria-current="page">The Pragmatic Programmer</span>
    </li>
  </ol>
</nav>
```

With `maxItems=3` and 5 items:

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>                          <!-- first -->
    <li aria-hidden="true">[chevron]</li>
    <li><button [twMenuTrigger]="overflow" aria-label="Show more breadcrumbs">…</button></li>
    <li aria-hidden="true">[chevron]</li>
    <li><a href="/library/books">Books</a></li>            <!-- second-to-last -->
    <li aria-hidden="true">[chevron]</li>
    <li><span aria-current="page">The Pragmatic Programmer</span></li>  <!-- last -->
  </ol>
</nav>
```

---

## Custom item template usage

Consumers project their own anchor inside `*twBreadcrumbsItem` and **opt into the component's link styling by applying the `twBreadcrumbsLink` directive** to their anchor. The directive injects the parent `BreadcrumbsComponent`, reads its `link` / `current` / `disabled` slot classes, and applies them through a `[class]` host binding. This gives consumers full router integration without forcing them to hand-author the styling.

`twBreadcrumbsLink` accepts a single optional input:

| Name | Type | Default | Notes |
|---|---|---|---|
| `current` | `boolean` | `false` | When true, applies `current` slot styling + sets `aria-current="page"`. Consumers bind this to `isCurrent` from the template context. |

Example with Angular Router:

```html
<tw-breadcrumbs [items]="trail" ariaLabel="Section navigation">
  <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent">
    @if (isCurrent) {
      <span twBreadcrumbsLink [current]="true">{{ item.label }}</span>
    } @else if (item.data?.routerLink) {
      <a twBreadcrumbsLink [routerLink]="item.data.routerLink">{{ item.label }}</a>
    } @else if (item.href) {
      <a twBreadcrumbsLink [href]="item.href">{{ item.label }}</a>
    } @else {
      <span twBreadcrumbsLink>{{ item.label }}</span>
    }
  </ng-template>
</tw-breadcrumbs>
```

The component wraps the projected content in its own `<li>`. The `<li>` carries layout-only classes (`inline-flex items-center min-w-0`); link / current / disabled styling lives on `twBreadcrumbsLink`. Without the directive, consumer content still renders inside the `<li>` but with no breadcrumb styling — explicitly documented as opt-in.

---

## Implementation notes

- Use the host selector `tw-breadcrumbs` on a `<nav>` element directly: `host: { '[attr.aria-label]': 'ariaLabel()', '[class]': 'navClasses()' }` — but you can't make `<tw-breadcrumbs>` BE a `<nav>` (custom element). Two options:
  1. Render `<nav>` inside the template, with the component host being `<tw-breadcrumbs>` (a generic div by default). The outer custom element does not need a landmark role.
  2. Use the host selector form `nav[twBreadcrumbs]` like tab-nav does.

  **Pick option 1** — keeps consumer markup simple (`<tw-breadcrumbs [items]="…" />`) and the outer custom element is functionally invisible. The internal `<nav>` carries the `aria-label`. The host element must carry `class: 'block min-w-0'` so it behaves predictably inside flex / grid layouts (custom elements default to `display: inline`).

- `renderedEntries = computed<RenderedEntry[]>(() => …)` produces the interleaved list of `item` / `separator` / `overflow` entries. Track key includes `kind` + a stable per-item id.
- `collapsedItems = computed<TwBreadcrumbsItem[]>(() => …)` derives the hidden middle items for the overflow menu.
- Use `inject(BreadcrumbsItemTemplateDirective, { optional: true })` won't work for content queries — use `contentChild(BreadcrumbsItemTemplateDirective)` on the component class.
- Default separator icon: use `<tw-icon [name]="separator()" [size]="iconSize()" />` where `iconSize` is a computed mapping `breadcrumbs-size → icon-size`.
- Default overflow trigger character: render a `<tw-icon name="more-horizontal" size="sm" />` glyph (Lucide name), with text fallback `'…'` for environments without the registry. Default to text `'…'` to avoid forcing consumers to register a Lucide icon for the default path — document that `provideTwLucideIcons` is required if they want a glyph; otherwise the unicode ellipsis renders.
- **NgTemplateOutlet** import is required for `*ngTemplateOutlet`.
- No `linkedSignal` needed — there is no internal writable state. Everything derives from `items()` + `maxItems()`.

---

## Test plan (`breadcrumbs.spec.ts`)

Vitest, no `fakeAsync`/`tick`. Use `vi.spyOn` for spies, `fixture.componentRef.setInput()` for input changes.

**Rendering**
- Mounts with empty `items`.
- Renders each `size` (xs/sm/md/lg/xl) without errors.
- 3-item trail: renders 3 `<li>`s for items + 2 separator `<li>`s.
- 1-item trail: renders 1 item, 0 separators.
- Empty `items`: renders an empty `<ol>` (no separators, no overflow).

**ARIA**
- `<nav>` carries the configured `aria-label` (default `"Breadcrumb"`).
- `<ol>` is present.
- Current (last) item is a `<span>` with `aria-current="page"`. Not an `<a>`.
- Non-current items with `href` render as `<a [href]>`.
- Non-current items without `href` and not disabled render as plain `<span>` (no `aria-current`).
- Disabled items render as `<span>` with `aria-disabled="true"`, never as `<a>`.
- Separator `<li>`s have `aria-hidden="true"`.

**Separator**
- Default: renders a `tw-icon` with `name="chevron-right"`.
- `separator` input changes the icon name.
- `*twBreadcrumbsSeparator` template projection replaces the icon entirely.

**Custom item template**
- `*twBreadcrumbsItem` projection replaces default rendering for every item.
- Template context carries `item`, `index`, `isCurrent` correctly (verify `isCurrent` is `true` only for the last item).

**Overflow**
- `maxItems=0` never collapses (3 items, 3 items rendered).
- `maxItems=5` with 4 items: no collapsing.
- `maxItems=3` with 5 items: shows first + ellipsis + last 2; ellipsis trigger is a `<button>` with `aria-label="Show more breadcrumbs"`.
- Overflow menu opens on click; menu lists the hidden middle items; menu closes on Escape.
- `maxItems=1` with many items: clamps to `2` (shows first + ellipsis + last only).

**Disabled items**
- Disabled item (no `href`, `disabled: true`) renders as `<span aria-disabled="true">` with `opacity-50` / `cursor-not-allowed` classes — never as `<a>`.

**Size variants**
- Each `TwSize` value applies its classes to the `<ol>` (assert via class string contains, not exact match).

**RTL**
- The separator class string includes `rtl:rotate-180` (lightweight check — full RTL pixel test is the demo's job).

**Focus indicator**
- Each anchor carries `focus-visible:outline-2`, `focus-visible:outline-primary-500`, `focus-visible:outline-offset-2`.
- The overflow trigger carries the same classes.

**Router integration smoke**
- A test host using `RouterLink` inside `*twBreadcrumbsItem` mounts and `<a [routerLink]>` resolves an `href` attribute. (Use `provideRouter([])` in TestBed.)

---

## Demo page scope (Phase 5)

Routes under `projects/demo/src/app/routes/breadcrumbs/`:
- `overview` — Description, accessibility notes (landmark + aria-current), basic example, keyboard table.
- `examples` — Basic 3-level trail, custom separator (text "/", icon "slash"), truncation/overflow (8-item trail with maxItems=3), router integration (using `RouterLink` inside `*twBreadcrumbsItem`), RTL example (wrap in `<div dir="rtl">`), size gallery.
- `api` — Tables for inputs, the `TwBreadcrumbsItem` interface, and template-context types.

Wire route into `projects/demo/src/app/app.routes.ts` and the sidebar in `projects/demo/src/app/layout/shell.ts` (insert alphabetically between Badge and Button — append the line; do not re-sort the whole array).

---

## Out of scope (do not implement)

- Multiple separator templates per item.
- Custom overflow popover (must use `tw-menu`).
- Click events / output emitters — anchors own activation.
- Icon-only items (label always required).
- Drag reorder / interactive trail editing.
- Schema.org `BreadcrumbList` microdata (separate enhancement layer).

---

## Constraints (from CLAUDE.md — non-negotiable)

- Selector `tw-breadcrumbs`; class name `BreadcrumbsComponent` (no `Tw` prefix on class).
- Standalone — do not set `standalone: true`.
- `ChangeDetection.OnPush`; `host` object for host bindings; `inject()` for DI; native control flow.
- Signal API exclusively; `computed()` for derived state. No `linkedSignal` needed.
- Semantic tokens only (`fg-*`, `border-*`, `primary-*`); no raw palette or raw `neutral-*` for structure.
- Visual tokens drawn from CLAUDE.md "Visual Design System" — radius, gaps, typography, focus rings, icon sizing.
- Canonical focus ring (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`) on every interactive element. (Overflow button is not a menu item — does NOT get the menu-item carve-out.)
- Vitest tests; no `fakeAsync`/`tick`. Set inputs via `fixture.componentRef.setInput`.
- JSDoc one-line description on every `input()` / public method.
- Input count: 5 — within the cap. No exception claimed.
