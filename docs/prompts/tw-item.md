# Prompt: Build `tw-item` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, design tokens, visual design system
- `projects/ngx-tw/card/card.ts` — the canonical multi-slot directive pattern this component must mirror (parent component + child directives with `inject(ParentComponent)` + `host: { '[class]': 'classes()' }`)
- `projects/ngx-tw/card/card.spec.ts` — mirror the test layout (host components per scenario, Vitest imports, `fixture.componentRef.setInput` avoided in favor of host signal bindings)
- `projects/ngx-tw/core/types.ts` — shared `TwSize` type (must be used for the `size` input)
- `projects/ngx-tw/button/button.ts` — reference for `FocusMonitor` usage in interactive mode

CDK modules used:
- `@angular/cdk/a11y` — `FocusMonitor` for interactive-mode focus ring discipline
- `@angular/cdk/keycodes` — `ENTER`, `SPACE` for keyboard activation

## What to build

A `tw-item` layout primitive that composes four content regions — **leading**, **title**, **description**, and **trailing** — into a single horizontal row with a vertical text stack in the middle. It is the shared building block for:

- **Section / page headers** — large title + descriptive paragraph, optional icon tile on the left
- **List items** — rows inside a `<ul>` with consistent spacing and optional interactive highlight
- **Table cell compositions** — first-cell "title + subtitle + icon" patterns inside a `<td>`

`tw-item` is structurally neutral: it renders as a plain `<div>` by default and applies no ARIA role unless `interactive` is set. It does not wrap projected leading content in opinionated chrome (no tinted box, no rounded background) — consumers project their own `<tw-icon>`, `<tw-avatar>`, number bullet, or checkbox and style it to taste. The component's sole responsibility is **layout, alignment, spacing, and typography** across its four slots.

Like `tw-card`, this is a multi-slot component that exposes itself to child directives via DI. The child directives are slot markers: they apply the correct per-slot class string computed from the parent's `size`, `align`, and `interactive` inputs.

## API design

### Component: `ItemComponent`

**Selector:** `tw-item`

#### Inputs

- `/** Controls overall density and typography scale. `'sm'` is compact with single-line truncation (table rows). `'md'` is the default list item size. `'lg'` is the section-header scale with a larger title. Defaults to `'md'`. */` `size = input<ItemSize>('md')`
- `/** Vertical alignment of the leading and trailing slots relative to the content stack. `'start'` aligns them to the title baseline (recommended when a description is present). `'center'` vertically centers them on the whole block (recommended for single-line items). Defaults to `'start'`. */` `align = input<ItemAlign>('start')`
- `/** When `true`, the item becomes keyboard-activatable: it gets `role="button"`, `tabindex="0"`, a hover background, a pointer cursor, and a visible focus ring. Click and Enter/Space emit `selected`. Defaults to `false`. */` `interactive = input(false)`
- `/** Disables interaction. Only meaningful when `interactive` is `true`. Applies `opacity-50`, `pointer-events-none`, and sets `aria-disabled`. Defaults to `false`. */` `disabled = input(false)`

#### Outputs

- `/** Fires when an interactive item is activated via click, Enter, or Space. Payload is the originating `Event`. Not emitted when `disabled` is `true` or `interactive` is `false`. */` `selected = output<Event>()`

#### Types (exported from the entry point)

```typescript
export type ItemSize = Extract<TwSize, 'sm' | 'md' | 'lg'>;
export type ItemAlign = 'start' | 'center';
```

`ItemSize` is a narrowed subset of `TwSize`. `xs` and `xl` are not supported — the use cases (compact row, default list item, section header) do not require them and adding them dilutes the design intent.

### Child directives (slot markers)

Four directives, each injects `ItemComponent` and applies computed slot classes via `host: { '[class]': 'classes()' }`. No inputs, no outputs, no state.

- `ItemLeadingDirective` — selector: `[twItemLeading]` — left column. Optional. Common content: `<tw-icon>`, `<tw-avatar>`, number bullet, checkbox.
- `ItemTitleDirective` — selector: `[twItemTitle]` — primary label. Required for any meaningful item. Supports inline children (badges, chips, inline icons).
- `ItemDescriptionDirective` — selector: `[twItemDescription]` — secondary text. Optional. Supports inline children.
- `ItemTrailingDirective` — selector: `[twItemTrailing]` — right column. Optional. Common content: action buttons, metadata text, chevron, timestamp.

All four directives are detected by `ItemComponent` via `contentChild()` so wrapper slots conditionally render only when populated (prevents stray gap/margin when a slot is empty).

## Content projection

The component template renders this DOM skeleton:

```html
<!-- conceptual layout — actual implementation in tv() slots below -->
<tw-item>
  <div class="leading"><ng-content select="[twItemLeading]" /></div>
  <div class="content-stack">
    <div class="title-row"><ng-content select="[twItemTitle]" /></div>
    <div class="description"><ng-content select="[twItemDescription]" /></div>
  </div>
  <div class="trailing"><ng-content select="[twItemTrailing]" /></div>
</tw-item>
```

Conditional rendering rules (via `@if` on `contentChild()` results):

- Leading wrapper renders only if `twItemLeading` is projected.
- Trailing wrapper renders only if `twItemTrailing` is projected.
- Description wrapper renders only if `twItemDescription` is projected.
- Title wrapper always renders (title is structurally required — but do NOT throw if missing; let it render an empty div).
- The content stack (middle column) always renders so the flex layout is stable.

Do NOT provide fallback content for any slot — all slots are structural per the CLAUDE.md convention.

## Usage examples

```html
<!-- Use case 1: Section header (image 1 reference) -->
<tw-item size="lg">
  <div twItemLeading
       class="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
    <tw-icon name="sort" class="size-5" />
  </div>
  <div twItemTitle>Sort</div>
  <div twItemDescription>
    Reorder rows by any column. Click a header to toggle ascending and descending.
  </div>
</tw-item>
```

```html
<!-- Use case 2: List items inside a <ul>, separated by borders -->
<ul class="divide-y divide-border rounded-lg border border-border">
  @for (row of rows(); track row.id) {
    <li>
      <tw-item size="md" interactive align="center" (selected)="openRow(row)">
        <tw-avatar twItemLeading [name]="row.name" size="sm" />
        <div twItemTitle>{{ row.name }}</div>
        <div twItemDescription>{{ row.role }}</div>
        <tw-icon twItemTrailing name="chevron-right" class="size-4 text-fg-muted" />
      </tw-item>
    </li>
  }
</ul>
```

```html
<!-- Use case 3: Table cell composition (image 2 reference) -->
<table class="w-full">
  <tbody>
    @for (row of rows(); track row.id) {
      <tr class="border-b border-border">
        <td class="p-3">
          <tw-item size="sm" align="center">
            <div twItemLeading
                 class="flex size-8 items-center justify-center rounded-lg bg-info-50 text-info-600">
              <tw-icon name="file" class="size-4" />
            </div>
            <div twItemTitle>{{ row.title }}</div>
            <div twItemDescription>{{ row.code }}</div>
          </tw-item>
        </td>
        <td class="p-3 text-sm text-fg">{{ row.owner }}</td>
        <td class="p-3 text-sm text-fg-muted">{{ row.updatedAt | date }}</td>
      </tr>
    }
  </tbody>
</table>
```

```html
<!-- Disabled interactive item -->
<tw-item interactive disabled>
  <div twItemTitle>Unavailable option</div>
  <div twItemDescription>This action is currently disabled.</div>
</tw-item>
```

```html
<!-- Title with inline children: badges, chips -->
<tw-item size="md">
  <tw-icon twItemLeading name="package" class="size-5 text-fg-muted" />
  <div twItemTitle class="flex items-center gap-2">
    <span>Release v1.4.0</span>
    <span twBadge color="success" variant="soft">Latest</span>
  </div>
  <div twItemDescription>Published 2 hours ago</div>
</tw-item>
```

## Styling

### `tv()` config — slots-based

**Slots:** `root`, `leading`, `content`, `title`, `description`, `trailing`

**Base classes:**

```
root:        'flex w-full text-fg'
leading:     'flex shrink-0'
content:     'flex min-w-0 flex-col'
title:       'text-fg font-medium'
description: 'text-fg-muted'
trailing:    'flex shrink-0 items-center'
```

**Variants — `size`** (maps to both padding/gap and typography scale):

| Slot | `sm` | `md` | `lg` |
|---|---|---|---|
| `root` | `gap-2 py-1.5` | `gap-3 py-2` | `gap-4 py-3` |
| `leading` | `items-center` | `items-start mt-0.5` | `items-start mt-0.5` |
| `content` | `gap-0` | `gap-0.5` | `gap-1` |
| `title` | `text-sm truncate` | `text-sm` | `text-lg font-semibold` |
| `description` | `text-xs truncate` | `text-sm` | `text-sm` |
| `trailing` | `gap-1.5` | `gap-2` | `gap-2` |

Notes:
- The `sm` size applies `truncate` on both title and description and keeps `content` gap at `0` for the tightest possible row. `min-w-0` on `content` (in base) enables the truncation.
- The `md` size is the balanced default: wraps freely, comfortable 0.5 gap between title and description.
- The `lg` size bumps title to `text-lg font-semibold` per the visual spec for section headers, widens the `gap-4` outer gutter, and uses `gap-1` between title and description for breathing room.
- Leading `mt-0.5` at `md` / `lg` aligns an icon/avatar's optical baseline with the title's first line when `align='start'`.

**Variants — `align`** (applied to `root`, overrides the leading `items-*` at `sm` where needed):

| Slot | `start` | `center` |
|---|---|---|
| `root` | `items-start` | `items-center` |
| `leading` | (inherits from size) | `items-center mt-0` |
| `trailing` | `items-start` | `items-center` |

When `align='center'`, the leading slot's `mt-0.5` alignment nudge (from the size variant) is explicitly cleared via `mt-0`. Use a `compoundVariants` entry per `size` × `align='center'` to override.

**Variants — `interactive`:**

| Slot | `false` | `true` |
|---|---|---|
| `root` | (no extra) | `rounded-md cursor-pointer transition-colors duration-200 motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 px-2 -mx-2` |

The `px-2 -mx-2` pattern extends the hover/focus hit area horizontally while keeping the content flush with its parent — critical for list items inside a `<ul>` that should feel clickable across their full width without horizontal padding creeping into the layout.

**Variants — `disabled`:**

| Slot | `false` | `true` |
|---|---|---|
| `root` | (no extra) | `opacity-50 pointer-events-none` |

**`compoundVariants`:**

```
{ size: 'sm', align: 'center', class: { leading: 'mt-0', root: 'items-center' } }
{ size: 'md', align: 'center', class: { leading: 'mt-0', root: 'items-center' } }
{ size: 'lg', align: 'center', class: { leading: 'mt-0', root: 'items-center' } }
```

**`defaultVariants`:** `size: 'md'`, `align: 'start'`, `interactive: false`, `disabled: false`.

Enable `twMerge: true`.

### Host bindings

On `ItemComponent`:

```
host: {
  '[class]': 'rootClasses()',
  '[attr.role]': 'interactive() ? "button" : null',
  '[attr.tabindex]': 'interactive() && !disabled() ? 0 : null',
  '[attr.aria-disabled]': 'disabled() ? "true" : null',
  '(click)': 'onActivate($event)',
  '(keydown)': 'onKeydown($event)',
}
```

Each child directive applies its own slot class via `host: { '[class]': 'classes()' }` where `classes` is a `computed()` that reads the parent's slot result (`this.item.leadingClasses()`, etc.).

### Semantic tokens checklist

- Text: `text-fg` (title), `text-fg-muted` (description). No raw `neutral-*`.
- Hover: `hover:bg-surface-muted`. No raw palette.
- Focus ring: exact pattern from Visual Design System — `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
- Radius for interactive: `rounded-md` (per the Visual Design System scale for small interactive elements).
- Transitions: `transition-colors duration-200 motion-reduce:transition-none`.

## Accessibility

**Default (non-interactive) mode:**
- No ARIA role applied — renders as a layout-only `<div>`.
- Consumer wraps in `<li>`, `<section>`, `<article>` etc. for semantic meaning.
- No `aria-describedby` wiring is done by the component. If a consumer needs title↔description association (e.g., inside a form field), they add `id` on the title and `aria-describedby` on the parent themselves.

**Interactive mode (`interactive=true`):**
- Host gets `role="button"` and `tabindex="0"`.
- Click, Enter, and Space trigger the `selected` output and invoke `event.preventDefault()` on keyboard activation to avoid page scroll on Space.
- Focus ring uses the `focus-visible` pattern — invisible under mouse focus, visible under keyboard focus.
- `FocusMonitor` (from `@angular/cdk/a11y`) is used to track focus origin and is cleaned up in `ngOnDestroy`. The visible ring is governed by the CSS `focus-visible` pseudo-class; `FocusMonitor` is used only to ensure consistent focus-origin behavior matching the rest of the library (see `button.ts`).

**Disabled mode:**
- `aria-disabled="true"` on the host.
- `tabindex` removed so the item is not keyboard-focusable.
- `pointer-events-none` prevents click from reaching the host.
- The `selected` output is never emitted.

**Keyboard map (interactive mode only):**

| Key | Action |
|---|---|
| `Enter` | Emit `selected($event)`; `preventDefault()` |
| `Space` | Emit `selected($event)`; `preventDefault()` |
| `Tab` / `Shift+Tab` | Standard focus traversal (handled by browser) |

Must pass AXE checks in all three modes (default, interactive, disabled).

## Implementation notes

- Define the `tv()` config at the top of `item.ts`, co-located with the component.
- `ItemComponent` uses `contentChild(ItemLeadingDirective)`, `contentChild(ItemTrailingDirective)`, `contentChild(ItemDescriptionDirective)` to detect whether each optional slot is projected. `ItemTitleDirective` is not queried — the title row always renders.
- The template uses `@if` on each `contentChild()` result to conditionally render the wrapper `<div>` for leading, description, and trailing. The middle content stack and title slot always render.
- Each directive injects `ItemComponent` and reads `leadingClasses` / `titleClasses` / `descriptionClasses` / `trailingClasses` from it.
- All directives and the component live in the same `item.ts` file.
- `rootClasses`, `leadingClasses`, `contentClasses`, `titleClasses`, `descriptionClasses`, `trailingClasses` are all `computed()` values derived from a single `variantResult` signal that calls the `tv()` function with the current input values.
- `onActivate(event: Event)` — guard on `disabled()`, then `selected.emit(event)`.
- `onKeydown(event: KeyboardEvent)` — if `interactive() && !disabled()` and key is `ENTER` or `SPACE`, call `event.preventDefault()` and emit `selected`. Use `@angular/cdk/keycodes` constants.
- `FocusMonitor` is injected only when `interactive()` is `true`; inject it unconditionally and call `monitor()` / `stopMonitoring()` in `ngOnInit`/`ngOnDestroy` using `effect()` to react to `interactive()` changes.
- No `linkedSignal` needed — all state is derived.
- Template stays under ~30 lines; use inline template.

## File structure

```
projects/ngx-tw/item/
  item.ts          — ItemComponent, ItemLeadingDirective, ItemTitleDirective,
                     ItemDescriptionDirective, ItemTrailingDirective,
                     ItemSize, ItemAlign types
  item.spec.ts     — Vitest tests (see plan below)
  index.ts         — public API exports
  ng-package.json  — { "lib": { "entryFile": "index.ts" } }
```

### `item.spec.ts` coverage plan

- **Default render**
  - Component mounts with no inputs and a single projected title.
  - Renders a `<tw-item>` element with default classes (`flex`, `gap-3`, `text-fg`).
  - Does not apply `role`, `tabindex`, or `aria-disabled` by default.

- **Size variants**
  - Each of `sm`, `md`, `lg` applies the expected gap, padding, and typography classes on root/title/description.
  - `sm` applies `truncate` to title and description.
  - `lg` applies `text-lg font-semibold` to title.

- **Align variants**
  - `start` (default) puts `items-start` on root and applies `mt-0.5` to the leading slot at `md`/`lg`.
  - `center` puts `items-center` on root and clears `mt-0` on leading.

- **Interactive mode**
  - Sets `role="button"` and `tabindex="0"` on the host.
  - Click emits `selected` with the native event.
  - `Enter` keydown emits `selected` and calls `preventDefault()`.
  - `Space` keydown emits `selected` and calls `preventDefault()`.
  - Hover/focus classes are present in the class string (`hover:bg-surface-muted`, `focus-visible:outline-primary-500`).

- **Disabled mode**
  - Sets `aria-disabled="true"` and removes `tabindex`.
  - Applies `opacity-50 pointer-events-none` classes.
  - Click does not emit `selected`.
  - Enter/Space keydown does not emit `selected`.

- **Content projection**
  - Each of `twItemLeading`, `twItemTitle`, `twItemDescription`, `twItemTrailing` slots renders projected content.
  - Omitting the leading slot removes its wrapper from the DOM.
  - Omitting the description removes its wrapper.
  - Omitting the trailing removes its wrapper.
  - Title row always renders, even when empty.

- **Slot class application**
  - `[twItemTitle]` element receives the computed title classes (e.g., `text-sm` at `md`, `text-lg` at `lg`).
  - `[twItemDescription]` element receives `text-fg-muted`.

- **Class merging via twMerge**
  - Consumer-provided `class="text-xl"` on `[twItemTitle]` overrides the internal `text-sm` (use a host component that adds a custom class and assert only the consumer's class is present for the conflicting property).

- **Accessibility**
  - Default mode has no `role` attribute.
  - Interactive mode has `role="button"`.
  - Disabled interactive mode has `aria-disabled="true"` and no `tabindex`.

**Vitest rules reminder:** no `fakeAsync` / `tick`. Use `async/await` with `fixture.whenStable()` where needed. Use `vi.spyOn()` for any spies. Import all test utilities from `vitest` explicitly.

## Public API exports

From `projects/ngx-tw/item/index.ts`:

```typescript
export {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
  ItemTrailingDirective,
} from './item';
export type { ItemSize, ItemAlign } from './item';
```

Add `export * from 'ngx-tw/item';` to `projects/ngx-tw/src/public-api.ts` (preserve alphabetical ordering where the rest of the file follows one; otherwise append).

## Constraints

- `ChangeDetection.OnPush` on the component and every directive.
- Signal-based APIs only: `input()`, `output()`, `computed()`, `contentChild()`. No `model()` — no two-way state.
- `host` object for all host bindings and listeners — no `@HostBinding` / `@HostListener`.
- `inject()` for DI — no constructor injection.
- Native control flow only (`@if`, `@for`). No `*ngIf` / `*ngFor` / `ngClass` / `ngStyle`.
- No arrow functions in the template.
- No CSS files. All styling via Tailwind utilities inside the `tv()` config and host bindings.
- Semantic color tokens only. Structural neutrals use surface/fg/border tokens. No raw `neutral-*`, `blue-*`, etc.
- All visual tokens (radius `rounded-md`, gap `gap-1.5`/`gap-2`/`gap-3`/`gap-4`, padding `py-1.5`/`py-2`/`py-3`, icon sizing `size-4`/`size-5`, transitions `duration-200`, focus ring pattern, opacity `opacity-50`) match the Visual Design System in CLAUDE.md exactly.
- `twMerge: true` in the `tv()` config.
- JSDoc on every `input()` and `output()`.
- No `@angular/animations` — not needed here; no enter/leave animation requirements.
- Tests run under Vitest — no `fakeAsync`/`tick`.
