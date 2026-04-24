# Prompt: Build `tw-command-palette` for ngx-tw

## Context

Read before starting:

- `.claude/CLAUDE.md` — all conventions, visual design system, animation rules, testing rules
- `projects/ngx-tw/popover/popover.ts` — CDK Overlay lifecycle (create-once / reuse / `detach()` vs `dispose()`), close-animation flow, focus-trap composition, per-open vs overlay-lifetime subscriptions. The command palette follows this lifecycle model exactly.
- `projects/ngx-tw/menu/menu.ts` — `tv()` with slots, item density variants, `animate.enter`/`animate.leave` host bindings, inherited `size` propagation from parent component to child item directives via `inject()`.
- `projects/ngx-tw/dialog/dialog-container.ts` — modal backdrop pattern (`.tw-dialog-backdrop`), `aria-modal="true"`, `role="dialog"`, lifecycle state signals. Reuse the backdrop styling convention.
- `projects/ngx-tw/input/` — the search input styling reference; the palette's internal search field should visually match.
- `projects/ngx-tw/core/types.ts` — `TwSize` shared type.
- `projects/ngx-tw/theme/_base.css` — existing `fade-in`/`fade-out`/`scale-in`/`scale-out` animation classes and `.tw-dialog-backdrop` transition (reuse these; no new keyframes needed).
- `@angular/cdk/overlay` — `Overlay`, `OverlayRef`, `GlobalPositionStrategy`, scroll strategies, `OverlayContainer`.
- `@angular/cdk/portal` — `ComponentPortal`, `TemplatePortal`.
- `@angular/cdk/a11y` — `FocusTrapFactory`, `ActiveDescendantKeyManager`, `LiveAnnouncer`.
- `@angular/cdk/keycodes` — `ESCAPE`, `ENTER`, `UP_ARROW`, `DOWN_ARROW`, `HOME`, `END`, `TAB`.

## What to build

A keyboard-driven, searchable, modal command palette — the ngx-tw equivalent of VS Code's ⌘K, Linear's command menu, or Raycast. It opens as a centered overlay with a search input and a grouped, scrollable list of commands. Consumers can feed commands declaratively (via projected directives) or as a data array. Typing filters the list live. Arrow keys move the active item, Enter runs it, Escape closes.

The component exposes programmatic `open()` / `close()` / `toggle()` methods and a two-way-bindable `open` model, but deliberately **does not** bind a global hotkey itself — the consumer wires up `⌘K`/`Ctrl+K` or any other trigger. The overlay itself (backdrop, focus trap, body-scroll block, escape handling) is fully owned by the palette.

The palette ships one component (`tw-command-palette`) plus small structural directives for groups, items, item icons, shortcuts, and an empty-state template. It is not a form control.

## API design

### Component

**`CommandPaletteComponent`** — selector: `tw-command-palette`, element selector.

This is a **headless-by-default host**: when placed in a template, it renders nothing inline. All its UI (search input, list, backdrop) mounts into a CDK Overlay when opened. The component's sole DOM footprint when closed is a `<ng-container>` scaffold that hosts projected item directives so they can be discovered via `contentChildren()` even when the palette is not open.

### Inputs (CommandPaletteComponent)

- `/** Controls item density and padding across the palette. Defaults to `'md'`. */` — `size = input<TwSize>('md')`
- `/** Placeholder text in the search input. Defaults to `'Type a command or search…'`. */` — `placeholder = input<string>('Type a command or search…')`
- `/** Initial/controlled search query. Two-way bindable so consumers can read or reset the filter. Defaults to `''`. */` — `query = model<string>('')`
- `/** Controlled open state. Setting to `true` opens the palette; the palette sets it to `false` on close. Defaults to `false`. */` — `open = model<boolean>(false)`
- `/** Data-driven command list. Merged with declaratively projected items; filtered by `query`. Defaults to `[]`. */` — `commands = input<readonly CommandPaletteItem[]>([])`
- `/** Custom filter function. Receives the full item list and current query, returns the filtered, possibly reordered list. When unset, a case-insensitive substring match runs against `label`, `keywords`, and `group`. */` — `filterFn = input<CommandPaletteFilterFn | undefined>(undefined)`
- `/** Whether the palette closes automatically after an item is activated. Defaults to `true`. */` — `closeOnSelect = input<boolean>(true)`
- `/** Whether Escape closes the palette. Defaults to `true`. */` — `closeOnEscape = input<boolean>(true)`
- `/** Whether clicking the backdrop closes the palette. Defaults to `true`. */` — `closeOnBackdropClick = input<boolean>(true)`
- `/** Whether the search input is auto-focused when the palette opens. Defaults to `true`. */` — `autoFocus = input<boolean>(true)`
- `/** Optional label for screen readers identifying the palette. Read by the dialog on open. Defaults to `'Command palette'`. */` — `ariaLabel = input<string>('Command palette')`
- `/** Additional classes applied to the overlay panel for consumer customization. Merged via twMerge. Defaults to `''`. */` — `panelClass = input<string | string[]>('')`

### Outputs (CommandPaletteComponent)

- `/** Fires when a command is activated (by click or Enter). Payload is the `CommandPaletteItem` that ran. */` — `itemSelected = output<CommandPaletteItem>()`
- `/** Fires after the palette becomes fully visible. */` — `opened = output<void>()`
- `/** Fires after the palette is fully removed from the DOM (after the leave animation). */` — `closed = output<void>()`

### Public methods

- `/** Open the palette programmatically. */` — `open(): void` (name-collision: expose as `show()` if the `open` model getter conflicts; prefer `show()`/`hide()`/`toggle()` to avoid the clash). `[CONFIRM]`
- `/** Close the palette programmatically. */` — `hide(): void`
- `/** Toggle the current open state. */` — `toggle(): void`
- `/** Force the palette to reapply focus to the search input. */` — `focusSearch(): void`

### Structural directives

**`CommandPaletteItemDirective`** — selector: `tw-command-palette-item`, element selector. Declarative item. Consumers project content into it to render label + optional trailing shortcut.

Inputs:
- `/** Stable identifier for the item. Used by the palette to key list items and report selections. Required. */` — `id = input.required<string>()`
- `/** Plain-text label used for filtering. Defaults to the projected text content when unset. */` — `label = input<string | undefined>(undefined)`
- `/** Additional search keywords that match the query but are not rendered. Defaults to `[]`. */` — `keywords = input<readonly string[]>([])`
- `/** Optional group name. Items sharing a group are rendered under the same section header. Defaults to `undefined` (ungrouped). */` — `group = input<string | undefined>(undefined)`
- `/** Whether the item is disabled. Disabled items are visible but not selectable. Defaults to `false`. */` — `disabled = input<boolean>(false)`
- `/** Optional keyboard shortcut hint shown on the right edge. Accepts a string (`'⌘K'`) or string array (`['⌘', 'K']`). Defaults to `undefined`. */` — `shortcut = input<string | readonly string[] | undefined>(undefined)`
- `/** Callback invoked when the item is activated. Runs before `itemSelected` emits on the palette. Defaults to `undefined`. */` — `run = input<(() => void) | undefined>(undefined)`

Output:
- `/** Fires when this specific item is activated. */` — `activated = output<void>()`

**`CommandPaletteGroupDirective`** — attribute directive, selector: `[twCommandPaletteGroup]`. Optional explicit grouping wrapper (alternative to the `group` input on each item). Takes a `label` input and projects items inside.

Inputs:
- `/** Group heading text shown above the items. Required. */` — `label = input.required<string>()`

**`CommandPaletteItemIconDirective`** — attribute directive, selector: `[twCommandPaletteItemIcon]`. Applies leading-icon styling. Purely cosmetic, no behavior.

**`CommandPaletteItemDescriptionDirective`** — attribute directive, selector: `[twCommandPaletteItemDescription]`. Secondary text line under the label.

**`CommandPaletteEmptyDirective`** — structural directive, selector: `[twCommandPaletteEmpty]`. Consumer-provided template shown when no items match the query. Receives the current `query` string as `$implicit`. When absent, the palette renders a built-in fallback: a centered icon + "No results found" text.

**`CommandPaletteFooterDirective`** — structural directive, selector: `[twCommandPaletteFooter]`. Optional sticky footer region (for hint text like "↑↓ to navigate • ↵ to select • esc to close"). No fallback — when absent, no footer renders.

### Types (exported from the entry point)

```typescript
export interface CommandPaletteItem {
  /** Stable identifier. */
  id: string;
  /** Visible label. */
  label: string;
  /** Extra search keywords (not rendered). */
  keywords?: readonly string[];
  /** Group header name. */
  group?: string;
  /** Disabled items render but cannot be activated. */
  disabled?: boolean;
  /** Shortcut hint to render on the right edge. */
  shortcut?: string | readonly string[];
  /** Optional description shown under the label. */
  description?: string;
  /** Optional icon name (consumer renders through their own icon component via a template — or omit and rely on projection). */
  icon?: string;
  /** Activation callback. */
  run?: () => void;
}

export type CommandPaletteFilterFn = (
  items: readonly CommandPaletteItem[],
  query: string,
) => readonly CommandPaletteItem[];
```

### Injection token

- `COMMAND_PALETTE_REF` — provides a `{ close(): void; setQuery(q: string): void }` handle inside the overlay content (useful for future component-based content support; not required for v1 usage).

## Usage examples

```html
<!-- Simplest: declarative items, consumer-owned hotkey -->
<tw-command-palette [(open)]="paletteOpen" (itemSelected)="run($event)">
  <tw-command-palette-item id="new-file" (activated)="newFile()">
    <svg twCommandPaletteItemIcon><!-- icon --></svg>
    New file
  </tw-command-palette-item>
  <tw-command-palette-item id="open" (activated)="openFile()">Open…</tw-command-palette-item>
  <tw-command-palette-item id="settings" (activated)="openSettings()">Settings</tw-command-palette-item>
</tw-command-palette>
```

```html
<!-- With groups, shortcuts, and description -->
<tw-command-palette [(open)]="paletteOpen">
  <div twCommandPaletteGroup label="File">
    <tw-command-palette-item id="save" [shortcut]="['⌘', 'S']" (activated)="save()">
      Save
    </tw-command-palette-item>
    <tw-command-palette-item id="save-as" [shortcut]="['⌘', '⇧', 'S']" (activated)="saveAs()">
      Save as…
      <span twCommandPaletteItemDescription>Choose a new path</span>
    </tw-command-palette-item>
  </div>
  <div twCommandPaletteGroup label="Edit">
    <tw-command-palette-item id="undo" [shortcut]="['⌘', 'Z']" (activated)="undo()">Undo</tw-command-palette-item>
    <tw-command-palette-item id="redo" [shortcut]="['⌘', '⇧', 'Z']" (activated)="redo()">Redo</tw-command-palette-item>
  </div>
</tw-command-palette>
```

```html
<!-- Data-driven with keywords and empty-state template -->
<tw-command-palette [commands]="commands()" [(open)]="paletteOpen" (itemSelected)="execute($event)">
  <ng-template twCommandPaletteEmpty let-q>
    No commands match "<strong>{{ q }}</strong>". Try a different search.
  </ng-template>
  <ng-template twCommandPaletteFooter>
    <span class="text-fg-subtle text-xs">↑↓ navigate · ↵ select · esc close</span>
  </ng-template>
</tw-command-palette>
```

```html
<!-- Consumer-controlled hotkey (⌘K / Ctrl+K) -->
<!-- In consumer component: a HostListener-free approach using @cdk/a11y or a global keydown handler. -->
<tw-command-palette [(open)]="paletteOpen" placeholder="What do you want to do?" />

<!-- Custom filter (e.g., fuzzy match via consumer-supplied fn) -->
<tw-command-palette [commands]="commands()" [filterFn]="fuzzyFilter" [(open)]="paletteOpen" />

<!-- Small, non-closing (stays open so users can run multiple commands) -->
<tw-command-palette size="sm" [closeOnSelect]="false" [(open)]="paletteOpen" />
```

## Styling

Use `tv()` with **slots** — the palette has several distinct regions.

**Slots:** `backdrop`, `panel`, `searchWrapper`, `searchInput`, `searchIcon`, `list`, `groupHeader`, `item`, `itemLabel`, `itemDescription`, `itemShortcut`, `itemKbd`, `empty`, `footer`.

**Base classes per slot:**

- `backdrop`: `tw-dialog-backdrop fixed inset-0` (reuse the existing backdrop class from `_base.css` — it already handles fade-in/fade-out via the `.cdk-overlay-backdrop-showing` class).
- `panel`: `w-full max-w-xl mx-auto mt-[15vh] bg-surface-overlay text-fg rounded-lg border border-border shadow-md overflow-hidden flex flex-col max-h-[70vh] outline-none`
- `searchWrapper`: `flex items-center gap-3 border-b border-border px-4`
- `searchInput`: `flex-1 bg-transparent border-0 outline-none text-fg placeholder:text-fg-subtle text-sm py-3`
- `searchIcon`: `size-5 shrink-0 text-fg-muted`
- `list`: `flex-1 overflow-y-auto py-1`
- `groupHeader`: `px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle`
- `item`: `relative flex items-center gap-3 px-4 cursor-pointer select-none transition-colors duration-200 motion-reduce:transition-none text-fg outline-none`
- `itemLabel`: `flex-1 min-w-0 truncate text-sm`
- `itemDescription`: `block text-xs text-fg-muted mt-0.5 min-w-0 truncate`
- `itemShortcut`: `ml-auto flex items-center gap-1 pl-3 shrink-0`
- `itemKbd`: `inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-md border border-border bg-surface-muted text-fg-muted text-[0.6875rem] font-mono`
- `empty`: `px-4 py-10 text-center text-sm text-fg-muted`
- `footer`: `border-t border-border px-4 py-2 bg-surface-muted`

**Variants:**

- `size` (standard TwSize scale, mapped per slot):
  - `xs`: `item: 'py-1 text-xs'`, `searchInput: 'py-2 text-xs'`, `groupHeader: 'pt-2 pb-0.5'`
  - `sm`: `item: 'py-1.5 text-xs'`, `searchInput: 'py-2.5 text-xs'`
  - `md`: `item: 'py-2 text-sm'`, `searchInput: 'py-3 text-sm'` (default)
  - `lg`: `item: 'py-2.5 text-sm'`, `searchInput: 'py-3.5 text-base'`
  - `xl`: `item: 'py-3 text-base'`, `searchInput: 'py-4 text-base'`
- `active` (on `item` slot — whether this row is the active-descendant): `true`: `bg-surface-muted`, `false`: `''`
- `disabled` (on `item` slot): `true`: `opacity-50 pointer-events-none cursor-default`, `false`: `cursor-pointer hover:bg-surface-muted`

**`defaultVariants`:** `{ size: 'md', active: false, disabled: false }`. Enable `twMerge: true`.

`panelClass` input is merged onto the `panel` slot via the variant's slot function.

**Enter/leave animations:** The overlay component host uses `host: { '[animate.enter]': "'scale-in fade-in'", '[animate.leave]': "'scale-out fade-out'" }`. The CDK backdrop uses the existing `.tw-dialog-backdrop` class which handles its own fade via `.cdk-overlay-backdrop-showing`. **No new keyframes need to be added to `projects/ngx-tw/theme/_base.css`** — every animation primitive already exists.

**Semantic tokens only.** Never use raw `neutral-*` or palette colors. All backgrounds come from `surface-*`, text from `fg`/`fg-muted`/`fg-subtle`, borders from `border`.

## Accessibility

**ARIA structure (critical — follows the ARIA Authoring Practices "combobox with listbox popup"):**

- **Panel:** `role="dialog"`, `aria-modal="true"`, `aria-label="{ariaLabel}"` (or `aria-labelledby` when the consumer projects a titled region).
- **Search input:** `role="combobox"`, `aria-expanded="true"` while palette is open, `aria-controls="{listId}"`, `aria-activedescendant="{activeItemId}"`, `autocomplete="off"`, `spellcheck="false"`.
- **List:** `role="listbox"`, unique `id`.
- **Items:** `role="option"`, unique `id`, `aria-selected="true"` on the active item and `false` on others, `aria-disabled="true"` on disabled items.
- **Group headers:** render as `<div role="presentation">` with the label; wrap items via `aria-labelledby` on a `role="group"` container so screen readers announce "File group, 4 items".

**Keyboard behavior (owned by the palette, not CDK Menu — use `ActiveDescendantKeyManager`):**

| Key | Action |
|---|---|
| `ArrowDown` | Move active item down (wraps to first) |
| `ArrowUp` | Move active item up (wraps to last) |
| `Home` | Move to first item |
| `End` | Move to last item |
| `Enter` | Activate the active item |
| `Escape` | Close the palette (when `closeOnEscape` is true); return focus to the element that had focus before open |
| `Tab` | Close the palette; do not let Tab leave the trapped panel in v1 |
| Any printable character | Typed into the search input; does not change active item except through the resulting filter |

**Focus management:**

- On open: record `document.activeElement` as the restore target, attach a `FocusTrap` (via `FocusTrapFactory`) around the overlay panel, focus the search input (if `autoFocus`).
- While open: focus stays on the input; item highlighting is driven by `aria-activedescendant`. Never programmatically move DOM focus to items.
- On close: destroy the focus trap, restore focus to the previously active element before emitting `closed`.

**Screen-reader announcements:** use `LiveAnnouncer` (inject from `@angular/cdk/a11y`):

- On open: announce `"Command palette opened. {N} commands available."` (polite).
- When filter changes: announce `"{N} results for {query}"` — debounced by 200 ms to avoid overwhelming the user while typing.
- When no results: announce `"No commands match {query}"`.

Every interactive element has a visible focus indicator via the active-item `bg-surface-muted` class; the search input uses the standard focus ring (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`). Must pass AXE and meet WCAG AA.

## Implementation notes

- **Overlay lifecycle (mirror `popover.ts`):** Create the `OverlayRef` on first open. Reuse on subsequent opens — call `overlayRef.detach()` on close, `overlayRef.dispose()` only in `DestroyRef.onDestroy()`. Use `overlay.position().global().centerHorizontally().top()` as the `GlobalPositionStrategy` so the panel is centered with a top offset (let CSS handle the `15vh` offset on the panel slot).
- **Scroll strategy:** use `overlay.scrollStrategies.block()` so the page behind the palette does not scroll while the overlay is open.
- **Backdrop:** `hasBackdrop: true`, `backdropClass: 'tw-dialog-backdrop'` (reuses the existing CSS transition).
- **Close animation flow:** identical to popover — set a `closing` flag, destroy the focus trap, restore focus, wait 150 ms (matching `scale-out`/`fade-out`), then `overlayRef.detach()`, clear state, emit `closed`, set the `open` model to `false` via `untracked()` to avoid effect re-entry.
- **`open` model sync:** use a single `effect()` that reads `open()` and calls `show()` or `hide()` internally. Inside `hide()`, set `open.set(false)` in `untracked()`.
- **Item discovery:** use `contentChildren(CommandPaletteItemDirective, { descendants: true })` on the palette component to find projected items even when wrapped in `twCommandPaletteGroup`. Merge this list with the `commands` input array — declarative items win on id collision (dedupe by `id`).
- **Filtering:** compute `filteredItems = filterFn() ?? defaultFilter` where `defaultFilter` does case-insensitive substring match on `label` + `keywords` + `group`. Re-derive with `computed()` from `query()` and the merged item signal.
- **Grouping:** compute a grouped structure `{ group: string | null; items: CommandPaletteItem[] }[]` from the filtered items. Preserve insertion order.
- **Active item tracking:** use `ActiveDescendantKeyManager<CommandPaletteItem>` with `.withWrap()`. Reset active item to the first non-disabled item every time the filtered list changes. The key manager subscribes to input events via `onKeydown()` — forward `keydown` events from the search input to it.
- **Rendering:** the palette's *internal overlay component* (a separate private `CommandPaletteOverlayComponent`) holds the full template. The public `CommandPaletteComponent` is a thin controller that collects projected content, owns the signals, creates/disposes the overlay, and passes configuration + the item list to the overlay component via writable signals (same pattern as `PopoverOverlayComponent` in the popover).
- **Projected templates (`twCommandPaletteEmpty`, `twCommandPaletteFooter`):** the public component uses `contentChild(CommandPaletteEmptyDirective)` and `contentChild(CommandPaletteFooterDirective)` and forwards the `TemplateRef`s to the overlay component. Use `<ng-container *ngTemplateOutlet="empty; context: { $implicit: query() }"></ng-container>` in the overlay template.
- **Search input:** render a bare `<input>` inside the overlay component (do not nest `tw-input` — the palette's search has its own styling and behavior). Bind `[value]="query()"` and `(input)="query.set($event.target.value)"`.
- **Selection:** clicking an item or pressing Enter calls `selectItem(item)`, which (1) invokes `item.run?.()` if provided, (2) emits the matching directive's `activated` output if declarative, (3) emits the palette's `itemSelected` output, (4) closes the palette when `closeOnSelect()`.
- **Subscription management (mirror popover):** `keydownEvents()`, `backdropClick()` are per-open — collect into a `Subscription` and unsubscribe on close. Item-list changes via `contentChildren()` are signal-based and do not require manual cleanup.
- **`inject()` only.** `ChangeDetection.OnPush` on both the public and internal components. All host bindings via the `host` object.

## File structure

All files in `projects/ngx-tw/command-palette/`:

- `command-palette.ts` — `CommandPaletteComponent` (public), `CommandPaletteOverlayComponent` (private, not exported), `CommandPaletteItemDirective`, `CommandPaletteGroupDirective`, `CommandPaletteItemIconDirective`, `CommandPaletteItemDescriptionDirective`, `CommandPaletteEmptyDirective`, `CommandPaletteFooterDirective`.
- `command-palette-tokens.ts` — `COMMAND_PALETTE_REF` token, `CommandPaletteItem` interface, `CommandPaletteFilterFn` type, `CommandPaletteRef` interface.
- `command-palette.spec.ts` — Vitest tests covering:
  - Default render (component mounts, renders nothing when `open` is false).
  - `show()` opens the overlay; panel and search input are in the DOM.
  - All `size` variants apply correct classes to the item/search slots.
  - Declarative items are discovered via `contentChildren` and appear in the list.
  - `commands` input items are rendered.
  - Typing in the search input filters the list (case-insensitive substring).
  - Custom `filterFn` replaces the default.
  - Arrow keys move `aria-activedescendant`; wraps at top/bottom.
  - Home/End jump to first/last.
  - Enter activates the active item, emits `itemSelected`, closes when `closeOnSelect` is true, stays open when false.
  - Clicking an item activates it.
  - Escape closes; `closeOnEscape=false` disables.
  - Backdrop click closes; `closeOnBackdropClick=false` disables.
  - Disabled items do not activate.
  - `[(open)]` model two-way sync: setting true from parent opens; closing the palette updates the parent's signal.
  - ARIA: `role="dialog"`, `aria-modal="true"`, input `role="combobox"`, list `role="listbox"`, items `role="option"`, `aria-activedescendant` updates.
  - Focus trap: focus moves into the search input on open, returns to the previously focused element on close.
  - Empty state: fallback renders when no results; projected `twCommandPaletteEmpty` replaces fallback.
  - Overlay reuse: `OverlayRef` is not recreated on the second open.
  - **No `fakeAsync` / `tick`.** Use `async/await` with `fixture.whenStable()`. Use `vi.useFakeTimers()` + `vi.runAllTimers()` for the 150 ms close-animation delay.
- `index.ts` — public API exports.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Also update:

- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/command-palette';`.

**No changes to `projects/ngx-tw/theme/_base.css`** — reuse existing `fade-in`, `fade-out`, `scale-in`, `scale-out`, and `.tw-dialog-backdrop`.

## Public API exports

From `index.ts`:

```
CommandPaletteComponent,
CommandPaletteItemDirective,
CommandPaletteGroupDirective,
CommandPaletteItemIconDirective,
CommandPaletteItemDescriptionDirective,
CommandPaletteEmptyDirective,
CommandPaletteFooterDirective,
COMMAND_PALETTE_REF,
type CommandPaletteItem,
type CommandPaletteFilterFn,
type CommandPaletteRef,
```

Do **not** export `CommandPaletteOverlayComponent` — it is an internal implementation detail.

## Constraints

- All conventions from CLAUDE.md apply. Key reminders for this artifact:
  - `ChangeDetection.OnPush` on both components.
  - `host` object for all host bindings — never `@HostBinding`/`@HostListener`.
  - `inject()` for DI — no constructor injection.
  - `input()`/`model()`/`output()` — signal APIs only. `model()` is used for `open` and `query` (two-way bindable).
  - Inline templates (<50 lines) on both components.
  - Semantic tokens only — `bg-surface-overlay`, `border-border`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `bg-surface-muted` — **never** raw `neutral-*` or palette colors.
  - `animate.enter` / `animate.leave` — **never** `@angular/animations`.
  - `tv()` with `twMerge: true` and `defaultVariants` on every slot.
  - JSDoc on every `input()`, `output()`, `model()`, and public method.
  - Vitest tests, `vi.spyOn()` for spies, no `fakeAsync` / `tick`.
- **CDK Overlay lifecycle:** create `OverlayRef` once on first open, reuse across opens, `detach()` on close, `dispose()` only in `DestroyRef.onDestroy()`. Never recreate on each open.
- **Subscription cleanup:** per-open (`backdropClick()`, `keydownEvents()`) collected in a `Subscription`; `positionChanges` and content-children use `takeUntilDestroyed()` or signals.
- **Close animation:** `detach()` is called **after** a 150 ms delay so `animate.leave` CSS can play. Guard against re-entry with a `closing` flag.
- **Focus return:** restore focus to the element that had it before open, on **every** close path (Escape, backdrop, selection, programmatic, model-driven).
- **Effect cycle prevention:** use `untracked()` when setting the `open` model to `false` inside the close flow.
- **Not a form control.** No `ControlValueAccessor`. The `query` model is a plain two-way signal for observing/resetting the filter, not a form value.
