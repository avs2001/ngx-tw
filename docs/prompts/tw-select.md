# Prompt: Build `tw-select` for ngx-tw

## Context

Before starting, read:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — full project conventions (Angular v21 signals, Tailwind v4 semantic + surface/fg/border tokens, `tv()` with `twMerge: true`, no `@angular/animations`, Vitest rules, no `fakeAsync`, Visual Design System).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/popover/popover.ts` — **primary structural reference for overlay positioning, scroll strategies, backdrop/outside-click, focus trap, enter/leave animations (`scale-in`/`scale-out`/`fade-in`/`fade-out`) referencing `theme/_base.css` keyframes**. Reuse its `FlexibleConnectedPositionStrategy` pattern verbatim (positionMap + fallback order + viewport margin), but trim it to the four "menu-like" placements the select needs.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/popover/popover-tokens.ts` — the injection-token + data pattern for panel content. Select does not need this (panel is internal), but review how tokens are scoped.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/form-field/form-field.ts` — `FormFieldControl` abstract class and `TW_FORM_FIELD_CONTROL` token. The select must implement `FormFieldControl<T | T[]>` and provide itself under this token so `tw-form-field` picks it up automatically.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/form-field/form-field.html` — how the form-field projects a control and mirrors ARIA; understand which attributes the select's host must expose (`[id]`, `[attr.aria-describedby]` via `setDescribedByIds`, `onContainerClick`).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/checkbox/checkbox.ts` — CVA implementation (the exact `writeValue` / `registerOnChange` / `registerOnTouched` / `setDisabledState` shape), `afterNextRender` dev-mode accessible-name warning, `FocusMonitor.monitor` / `stopMonitoring` lifecycle, static color lookup tables for Tailwind v4 scanning.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/radio/radio.ts` and `/Users/ciprianiuga/dev/sandbox/ngx-tw/docs/prompts/tw-radio.md` — `FocusKeyManager`/roving-tabindex pattern and the group-DI pattern. Select uses a different manager (`ActiveDescendantKeyManager`), but the ID-generator and dev-mode-warning patterns carry over.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/menu/menu.ts` — CDK overlay host-directive composition precedent (note: the select does **not** use `CdkMenu` — a listbox is not a menu). Useful only to see how the library composes CDK primitives.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — existing keyframes. `scale-in`/`scale-out`/`fade-in`/`fade-out` are sufficient for the panel enter/leave; **no new keyframes required**.

CDK modules to import:

- `@angular/cdk/overlay` — `Overlay`, `OverlayRef`, `FlexibleConnectedPositionStrategy`, `ConnectedPosition`, `ScrollStrategyOptions`.
- `@angular/cdk/portal` — `ComponentPortal`, `TemplatePortal`, `CdkPortalOutlet`.
- `@angular/cdk/a11y` — `ActiveDescendantKeyManager` (for option keyboard nav via `aria-activedescendant`), `LiveAnnouncer` (announce selection/deselection in multi-mode), `FocusMonitor` (trigger focus state).
- `@angular/cdk/keycodes` — `DOWN_ARROW`, `UP_ARROW`, `HOME`, `END`, `ENTER`, `SPACE`, `ESCAPE`, `TAB`, `PAGE_UP`, `PAGE_DOWN`, `A` (for future Ctrl+A extensions — skip for now).

### Standards informing this design

- **WAI-ARIA Authoring Practices Guide** — "Listbox" pattern (single/multi-select with roving descendant) and "Listbox with Search Filter" variant. The select is a `combobox` element that owns a `listbox` popup; selection semantics follow the Listbox pattern.
- **Angular Material `mat-select`** — inspired the `compareWith` input, `panelClass`, the "control provides itself to form-field" approach, and the `FlexibleConnectedPositionStrategy` setup.
- **Radix UI `Select`** — inspired content-projection granularity (separate trigger / panel-content / item / group / empty slots via structural directives).
- **Headless UI `Listbox`** / **`Combobox`** — inspired the searchable-listbox split: when `searchable: true` the panel exposes a search input and the listbox filters; when `false`, CDK `ActiveDescendantKeyManager.withTypeAhead()` provides keystroke-based jumping.

## What to build

A standalone, generic `<tw-select>` component that behaves as an ARIA **combobox with listbox popup** and optional **in-panel search filter**. It supports single and multiple selection, is fully customizable via inputs and via templates (custom trigger, custom option rendering, custom empty state, panel header/footer), and participates in all three Angular forms strategies (template-driven, reactive, signal-forms) via `ControlValueAccessor`. When placed inside `<tw-form-field>`, the select detects the wrapper and switches to its chrome-less `naked` styling automatically (also available explicitly via `variant="naked"`).

The panel is rendered through `@angular/cdk/overlay` using `FlexibleConnectedPositionStrategy` with four preferred positions (below-start, below-end, above-start, above-end). The strategy handles viewport flipping, viewport margin, and scroll repositioning. Panel enter/leave uses Angular's native `animate.enter`/`animate.leave` with the `scale-in`/`scale-out`/`fade-in`/`fade-out` classes already defined in `projects/ngx-tw/theme/_base.css` — **no `@angular/animations` import, no new keyframes**.

Everything is strictly typed. No `any`. Outputs emit well-named event interfaces (`TwSelectSelectionChangeEvent<T>`, `TwSelectOpenedEvent`, `TwSelectSearchEvent`). The component is generic over `T`, the option-value type.

### Design decisions baked in

- **Listbox pattern, not menu.** `role="combobox"` on the trigger; `role="listbox"` on the panel; `role="option"` on each item; `role="group"` with `aria-label` for grouped ranges. Multi-select adds `aria-multiselectable="true"` on the listbox.
- **Keyboard focus stays on the trigger/search input; panel options use `aria-activedescendant`.** This is the APG-recommended pattern for combobox-with-listbox-popup and avoids losing focus when the panel scrolls or re-renders. Implemented with CDK `ActiveDescendantKeyManager`.
- **Single source of truth for selection:** `value = model<T | T[] | null>(null)`. Internal reflection via `linkedSignal` so `writeValue()` and user clicks can both update without re-triggering parent effects.
- **Option identity via `compareWith`.** Default: `Object.is`. Consumers override for deep equality (matches `mat-select`).
- **Two customization axes, not conflated:** (1) **data-driven** via `options` + optional accessor inputs; (2) **template-driven** via `*twSelectOption` and `*twSelectTrigger` structural directives. Either works, both can be combined (define `options`, override `*twSelectOption` to change rendering only).
- **Form-field detection is automatic.** `inject(FormFieldComponent, { optional: true })` — when present, the select treats itself as `variant="naked"` unless the consumer explicitly sets `variant="default"`. Either way, it provides itself under `TW_FORM_FIELD_CONTROL`.
- **No hidden native `<select>`.** The host element is an accessible combobox; the CVA serializes the value directly. Matches `tw-switch`/`tw-checkbox`/`tw-radio` precedent.

## API design

### Component identity

- **Selector:** `tw-select` (element selector).
- **Class:** `SelectComponent`.
- **Entry point:** `ngx-tw/select`.
- **Generic:** `SelectComponent<T>` — the option-value type. Default `T = unknown` for consumers that don't parameterise.
- **Change detection:** `ChangeDetectionStrategy.OnPush`.
- **Standalone:** yes (do not set `standalone: true` — it's the Angular v21 default).
- **Providers (on the component metadata):**
  - `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }`
  - `{ provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => SelectComponent) }`

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `options` | `readonly TwSelectOption<T>[] \| readonly O[]` | `[]` | `/** Array of options to render in the panel. Accepts either \`TwSelectOption<T>\` objects or arbitrary records read via the \`optionLabel\`, \`optionValue\`, \`optionDisabled\`, and \`optionGroup\` accessor inputs. Defaults to an empty array. */` |
| `optionLabel` | `(option: unknown) => string` | `(o) => (o as TwSelectOption<T>).label ?? String((o as TwSelectOption<T>).value)` | `/** Accessor returning the visible label for an option. Override when passing arbitrary objects. */` |
| `optionValue` | `(option: unknown) => T` | `(o) => (o as TwSelectOption<T>).value` | `/** Accessor returning the value for an option. The result is what \`value\` / \`valueChange\` emit. Override when passing arbitrary objects. */` |
| `optionDisabled` | `(option: unknown) => boolean` | `(o) => !!(o as TwSelectOption<T>).disabled` | `/** Accessor returning the disabled state for an option. Defaults to reading \`.disabled\`. */` |
| `optionGroup` | `(option: unknown) => string \| undefined` | `(o) => (o as TwSelectOption<T>).group` | `/** Accessor returning the group name for an option. Options sharing a group name are rendered under a labeled \`role="group"\` region in original array order. */` |
| `multiple` | `boolean` | `false` | `/** When true, enables multi-selection. The \`value\` model becomes a \`T[]\` and the panel renders checkable options. Defaults to \`false\`. */` |
| `searchable` | `boolean` | `false` | `/** When true, renders a search input at the top of the panel that filters options using \`filterPredicate\`. Disables type-ahead on the listbox to avoid input conflicts. Defaults to \`false\`. */` |
| `filterPredicate` | `(option: unknown, search: string) => boolean` | case-insensitive `includes` on the option's label | `/** Custom filter function for the search input. Return true to keep the option in view. Defaults to a case-insensitive substring match on the option label. */` |
| `placeholder` | `string \| undefined` | `undefined` | `/** Placeholder text shown in the trigger when no value is selected. */` |
| `disabled` | `boolean` | `false` | `/** When true, the trigger cannot be activated and the panel cannot open. Overridden only by the \`setDisabledState\` call from forms. Defaults to \`false\`. */` |
| `required` | `boolean` | `false` | `/** When true, exposes \`aria-required="true"\` on the trigger. Does not validate on its own — consumers use standard Angular \`Validators.required\` for that. Defaults to \`false\`. */` |
| `size` | `TwSize` | `'md'` | `/** Controls trigger padding, font size, and panel option density. Uses the shared \`TwSize\` scale. Defaults to \`'md'\`. */` |
| `color` | `TwColor` | `'primary'` | `/** Semantic color for focused trigger border, active option background, and checkmarks. Defaults to \`'primary'\`. */` |
| `variant` | `SelectVariant` | see notes | `/** Visual style of the trigger. \`'default'\` draws its own border/background chrome; \`'naked'\` strips trigger chrome so the component inherits its parent's (e.g. a \`tw-form-field\` wrapper). When the select is inside a \`tw-form-field\` and the consumer has not set this input, it defaults to \`'naked'\`; otherwise defaults to \`'default'\`. */` |
| `panelWidth` | `'trigger' \| 'auto' \| number \| string` | `'trigger'` | `/** Overlay panel width. \`'trigger'\` matches the trigger's measured width; \`'auto'\` lets content decide; a number is applied as pixels; a string is passed through as a CSS length. Defaults to \`'trigger'\`. */` |
| `panelClass` | `string \| readonly string[]` | `''` | `/** Extra class(es) applied to the overlay panel element. \`twMerge\` resolves conflicts with internal classes. */` |
| `panelMaxHeight` | `number` | `256` | `/** Maximum height of the listbox scroll region in pixels. Defaults to \`256\`. */` |
| `closeOnSelect` | `boolean \| undefined` | `undefined` | `/** Whether the panel closes after a selection is made. When left unset, resolves to \`true\` for single-select and \`false\` for multi-select. */` |
| `scrollStrategy` | `'reposition' \| 'close' \| 'block'` | `'reposition'` | `/** CDK scroll strategy for the overlay. Defaults to \`'reposition'\`. */` |
| `offset` | `number` | `4` | `/** Pixel distance between trigger and panel. Defaults to \`4\`. */` |
| `typeaheadDebounce` | `number` | `200` | `/** Debounce (ms) used by \`ActiveDescendantKeyManager.withTypeAhead()\` when \`searchable\` is false. Defaults to \`200\`. */` |
| `emptyMessage` | `string` | `'No results'` | `/** Fallback message rendered when the filter yields no options and no \`*twSelectEmpty\` template is provided. */` |
| `ariaLabel` (alias `'aria-label'`) | `string \| undefined` | `undefined` | `/** Accessible name for the combobox trigger. Required when no visible label is provided via \`tw-form-field\` or an external \`aria-labelledby\`. */` |
| `ariaLabelledby` (alias `'aria-labelledby'`) | `string \| undefined` | `undefined` | `/** ID of an external element that labels the combobox. Mirrored to \`aria-labelledby\`. */` |
| `compareWith` | `(a: T, b: T) => boolean` | `Object.is` | `/** Equality comparator for option values — critical when options are objects. Mirrors \`mat-select\`'s API. Defaults to \`Object.is\`. */` |

**Input count:** 23 inputs. This exceeds the 5–6 guideline and is explicitly permitted by MEMORY.md's "Overlay input count exception" — the same exception applied to `tw-popover` (17 inputs). Every input has a single, documented purpose. Consumers that don't need customization only touch `options` and `[(value)]`.

### Models (two-way)

| Model | Type | Default | JSDoc |
|---|---|---|---|
| `value` | `T \| T[] \| null` | `null` | `/** Two-way bound selected value(s). Single-select mode: a single \`T\` or \`null\`. Multi-select mode: a \`T[]\` (never \`null\` — absent selection is an empty array). Setting this programmatically does not emit \`selectionChange\` with \`source: 'user'\`. */` |
| `open` | `boolean` | `false` | `/** Two-way bound open state of the panel. Setting to \`true\` opens the overlay; setting to \`false\` closes it. Also fires \`openedChange\`. */` |

Note on the `open` model: `valueChange` is auto-generated by `model()` — do NOT redeclare. Same for `openChange`.

### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `openedChange` | `TwSelectOpenedEvent` | `/** Fires when the panel's visibility finishes changing. Payload carries the new open state and the trigger (useful for multi-panel coordination). */` |
| `selectionChange` | `TwSelectSelectionChangeEvent<T>` | `/** Fires after any selection change, whether from user interaction, programmatic \`value.set()\`, or a form-driven \`writeValue()\`. Includes \`added\`, \`removed\`, \`previousValue\`, and a \`source\` discriminator. */` |
| `searchChange` | `TwSelectSearchEvent` | `/** Fires whenever the search input's value changes (only when \`searchable\` is true). Debounced on the component's input side is the consumer's concern — this output fires on every keystroke. */` |

### Supporting types

Define these in `select.ts`, re-export from `index.ts`:

```ts
/** Canonical option shape. Consumers using arbitrary objects override the accessor inputs instead. */
export interface TwSelectOption<T> {
  /** Visible label. */
  label: string;
  /** Value emitted via `value` / `valueChange`. */
  value: T;
  /** When true, the option cannot be focused or selected. */
  disabled?: boolean;
  /** Optional group name. Options sharing a group render under a labelled `role="group"` region. */
  group?: string;
}

/** Visual style of the select trigger. */
export type SelectVariant = 'default' | 'naked';

/** Origin of a selection change, used to distinguish user input from programmatic writes. */
export type TwSelectSelectionSource = 'user' | 'reset' | 'programmatic';

/** Emitted by `selectionChange`. Generic over the option-value type. */
export interface TwSelectSelectionChangeEvent<T> {
  /** The current value. `null` when single-select has no selection; `T[]` in multi-select (possibly empty). */
  value: T | T[] | null;
  /** The previous value, before this change. */
  previousValue: T | T[] | null;
  /** Values newly added to the selection. Always empty when `source: 'reset'`. */
  added: readonly T[];
  /** Values removed from the selection. */
  removed: readonly T[];
  /** What triggered the change. */
  source: TwSelectSelectionSource;
}

/** Emitted by `openedChange`. */
export interface TwSelectOpenedEvent {
  /** Whether the panel is now open. */
  open: boolean;
  /** The combobox trigger element — handy when coordinating multiple open panels. */
  trigger: HTMLElement;
}

/** Emitted by `searchChange`. */
export interface TwSelectSearchEvent {
  /** The current search text (trimmed value passed to `filterPredicate`). */
  search: string;
  /** Number of options currently visible after filtering. */
  visibleCount: number;
}
```

### Content projection

Five projection slots. The defaults cover 80 % of use cases; consumers opt into customization by projecting a matching structural directive or `[slot]`.

| Slot | Mechanism | Context / Fallback |
|---|---|---|
| Trigger content | `*twSelectTrigger` structural directive on an `<ng-template>` | Context: `{ $implicit: T \| T[] \| null, open: boolean, empty: boolean, selectedOptions: unknown[] }`. **Fallback:** the default trigger renders the selected option's label (single) or a comma-separated list of labels (multi), or the `placeholder` input when empty. |
| Option template | `*twSelectOption` structural directive on an `<ng-template>` | Context: `{ $implicit: O, label: string, value: T, selected: boolean, active: boolean, disabled: boolean, index: number }`. **Fallback:** renders the label in a flex row with a leading checkmark (selected) or empty spacer. |
| Empty state | `*twSelectEmpty` structural directive on an `<ng-template>` | Context: `{ $implicit: string }` (the current search text). **Fallback:** renders `emptyMessage` input centered inside the panel. |
| Panel header | element with `slot="panel-header"` (CSS attribute) | No fallback — region renders only when projected. |
| Panel footer | element with `slot="panel-footer"` (CSS attribute) | No fallback — region renders only when projected. |

Detection uses `contentChild()` signal queries. `*twSelectOption`/`*twSelectTrigger`/`*twSelectEmpty` are declared as `Directive` classes with `selector: '[twSelectOption]'` etc., each marked with `{ providedIn: 'any' }` and holding a `templateRef = inject(TemplateRef<OptionContext>)`. The select reads the directive instance via `contentChild(TwSelectOptionTemplate)`.

**Rationale for structural directives** (over attribute directives or input-bound templates): consumers get `let-` context variables (idiomatic Angular), the template is *structurally* projected so the compiler type-checks the context, and we avoid exposing `TemplateRef` through an input (which reads awkwardly). Matches the pattern used by Material's `*matCellDef`, `*matHeaderCellDef`, etc.

## Usage examples

```html
<!-- Simplest: options array, single-select, two-way binding -->
<tw-select
  [options]="countries"
  [(value)]="country"
  placeholder="Select a country"
  aria-label="Country"
/>
```

```html
<!-- Reactive forms -->
<tw-select [options]="roles" formControlName="role" placeholder="Pick a role" />
```

```html
<!-- Multi-select with search -->
<tw-select
  [options]="tags"
  [(value)]="selectedTags"
  multiple
  searchable
  placeholder="Add tags"
  aria-label="Tags"
/>
```

```html
<!-- Inside tw-form-field — select auto-switches to naked variant -->
<tw-form-field>
  <label twLabel>Priority</label>
  <tw-select [options]="priorities" [formControl]="priorityCtrl" />
  <span twHint>Choose the urgency of this task.</span>
</tw-form-field>
```

```html
<!-- Custom option rendering (icon + two-line content) -->
<tw-select [options]="users" [(value)]="assignee" aria-label="Assignee">
  <ng-template *twSelectOption="let user; let selected = selected">
    <tw-avatar [src]="user.avatarUrl" size="sm" />
    <span class="flex-1 min-w-0">
      <span class="block truncate">{{ user.name }}</span>
      <span class="block text-xs text-fg-muted truncate">{{ user.email }}</span>
    </span>
    @if (selected) { <tw-icon name="check" class="size-4 text-primary-600" /> }
  </ng-template>
</tw-select>
```

```html
<!-- Custom trigger (chip list for multi) + custom empty state -->
<tw-select [options]="tags" [(value)]="selectedTags" multiple searchable>
  <ng-template *twSelectTrigger="let value; empty as isEmpty">
    @if (isEmpty) {
      <span class="text-fg-muted">Add tags…</span>
    } @else {
      <span class="flex flex-wrap gap-1">
        @for (v of value; track v) {
          <span class="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-xs">
            {{ v.label }}
          </span>
        }
      </span>
    }
  </ng-template>
  <ng-template *twSelectEmpty="let search">
    <div class="p-4 text-center text-sm text-fg-muted">
      No tags match "{{ search }}". <button twButton variant="ghost">Create</button>
    </div>
  </ng-template>
</tw-select>
```

```html
<!-- Disabled -->
<tw-select [options]="countries" [disabled]="true" placeholder="Not available" />
```

```html
<!-- Panel header/footer (e.g., "Select all" affordance) -->
<tw-select [options]="tags" [(value)]="selectedTags" multiple>
  <div slot="panel-header" class="flex items-center justify-between p-2 border-b border-border">
    <button twButton variant="ghost" size="xs" (click)="selectAll()">Select all</button>
    <button twButton variant="ghost" size="xs" (click)="clear()">Clear</button>
  </div>
</tw-select>
```

## Styling

### `tv()` config — slot-based

Single `tv()` config in `select.ts` with these slots:

```
slots:
  root            — outer block wrapping the trigger; `relative` so focus ring anchors correctly
  trigger         — the visible combobox button; flex row with value + chevron
  valueText       — the selected-label span inside the default trigger
  placeholderText — the placeholder span when empty
  chevron         — the trailing dropdown chevron icon (size-4, shrink-0, transition-transform)
  clearButton     — the optional "clear selection" icon button inside the trigger (hidden when disabled or empty)
  panel           — the overlay panel container (bg, border, shadow, rounded, overflow-hidden)
  panelHeader     — slot="panel-header" wrapper classes (border-b, padding)
  panelFooter     — slot="panel-footer" wrapper classes (border-t, padding)
  searchWrapper   — padding + border around the search input row
  searchInput     — the search <input type="search">
  listbox         — the scrollable listbox container (overflow-y-auto, min-h, max-h via style)
  optionGroup     — `role="group"` wrapper
  optionGroupLabel — the group's visible label (text-xs, uppercase, text-fg-subtle, px, py)
  option          — a single `role="option"` row
  optionLabel     — the label text inside a default option
  checkmark       — the leading/trailing check icon slot for selected options
  emptyState      — wrapper rendered in place of the listbox when no options match
```

Variants:

```
size:
  xs → trigger: 'px-2 py-1 text-xs',        chevron: 'size-3.5', option: 'px-2 py-1 text-xs gap-1.5',       searchInput: 'text-xs'
  sm → trigger: 'px-3 py-1.5 text-sm',      chevron: 'size-4',   option: 'px-3 py-1.5 text-sm gap-2',       searchInput: 'text-sm'
  md → trigger: 'px-4 py-2 text-sm',        chevron: 'size-4',   option: 'px-3 py-2 text-sm gap-2',         searchInput: 'text-sm'
  lg → trigger: 'px-5 py-2.5 text-base',    chevron: 'size-5',   option: 'px-4 py-2.5 text-base gap-2',     searchInput: 'text-base'
  xl → trigger: 'px-6 py-3 text-base',      chevron: 'size-5',   option: 'px-4 py-3 text-base gap-2',       searchInput: 'text-base'

variant:
  default → trigger: 'border border-border bg-surface rounded-md hover:border-border-strong transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500'
  naked   → trigger: 'bg-transparent border-0 rounded-none p-0 focus:outline-none focus-visible:outline-none'   // inherits form-field chrome; still focusable

open:
  true  → chevron: 'rotate-180'
  false → chevron: 'rotate-0'

disabled:
  true  → root: 'opacity-50 pointer-events-none cursor-not-allowed'
  false → root: ''

invalid:
  true  → trigger: ''   // form-field's invalid ring handles visuals; naked variant just drops this
  false → trigger: ''
```

Compound variants (one per `TwColor` for the focused trigger border — mirror the static-lookup pattern used by `checkbox.ts`/`form-field.ts` so Tailwind v4 scans the classes):

```
{ variant: 'default', focused: true, color: 'primary',   class: { trigger: 'border-primary-500' } }
{ variant: 'default', focused: true, color: 'secondary', class: { trigger: 'border-secondary-500' } }
… accent, info, success, warning, error …
{ variant: 'default', focused: true, color: 'neutral',   class: { trigger: 'border-border-strong' } }
```

`defaultVariants`:

```
{ size: 'md', variant: 'default', open: false, disabled: false, invalid: false, focused: false, color: 'primary' }
```

`twMerge: true` in the second argument.

### Static selected-state color lookup (option active + selected)

Define outside the component, same shape as `SOLID_BOX` in `checkbox.ts`:

```ts
const OPTION_ACTIVE_BG: Record<TwColor, string>;
// primary: 'bg-primary-50 dark:bg-primary-950',  info: 'bg-info-50 dark:bg-info-950',  …  neutral: 'bg-surface-muted'

const OPTION_CHECKMARK: Record<TwColor, string>;
// primary: 'text-primary-600',  info: 'text-info-600',  …  neutral: 'text-fg'
```

Applied via `computed()` on the option slot. Non-selected, non-active options: `text-fg hover:bg-surface-muted`. Disabled options: `opacity-50 pointer-events-none`. Focused option (active-descendant): append `bg-surface-muted` when not selected, or override with the colored lookup when also selected.

### Key structural classes

- **`panel`:** `bg-surface-overlay border border-border rounded-lg shadow-md overflow-hidden flex flex-col` — mirrors the popover panel chrome. `max-height` applied inline via `[style.maxHeight.px]="panelMaxHeight()"` on the `listbox` slot so the panel itself can grow with header/footer.
- **`listbox`:** `flex-1 min-h-0 overflow-y-auto py-1 focus:outline-none`. `role="listbox"` host binding. `tabindex="-1"` (focus lives on the trigger / search input).
- **`panelHeader` / `panelFooter`:** `border-b border-border` / `border-t border-border`, `p-2`, conditionally rendered with `@if (hasPanelHeader())`.
- **`searchWrapper`:** `p-2 border-b border-border`.
- **`searchInput`:** `w-full px-3 py-1.5 rounded-md border border-border bg-surface text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200 motion-reduce:transition-none`.
- **`optionGroupLabel`:** `px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle`.
- **`option`:** `relative flex items-center cursor-pointer select-none text-fg transition-colors duration-200 motion-reduce:transition-none`.
- **`checkmark`:** `size-4 shrink-0 ml-auto` (trailing).
- **`emptyState`:** `p-4 text-center text-sm text-fg-muted`.

### Visual-design-system compliance

- Radius: `rounded-md` on trigger + search input; `rounded-lg` on panel (standard container). Matches CLAUDE.md.
- Spacing: trigger uses the standard `px-{x} py-{y}` inline-element scale (`xs…xl`). Options use a compact variant of the same scale.
- Gap: `gap-2` inside the default option (icon + label). `gap-1.5` on `xs`.
- Shadow: `shadow-md` on panel (floating element). No shadow on the trigger.
- Focus ring on the default trigger: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`. `naked` variant strips the ring (form-field draws it on the wrapper).
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on trigger, options, search input. `transition-transform duration-200` on chevron.
- Panel enter/leave: `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"` — classes defined in `theme/_base.css`, no new keyframes.
- Icons: `size-4` inside the default option; `size-4`/`size-5` on the chevron depending on size variant; `shrink-0` everywhere.

## Accessibility

### Roles & attributes — ARIA APG "Combobox with Listbox Popup"

**Trigger host (`tw-select`'s own host element):**
- `role="combobox"`.
- `[attr.aria-haspopup]="'listbox'"`.
- `[attr.aria-expanded]="open()"` — `'true'`/`'false'`.
- `[attr.aria-controls]="listboxId"` (set only when open — or always, depending on APG guidance; always is simpler and fine).
- `[attr.aria-activedescendant]="activeOptionId() || null"` — drives keyboard navigation without moving DOM focus.
- `[attr.aria-autocomplete]="searchable() ? 'list' : 'none'"`.
- `[attr.aria-label]="ariaLabel() || null"`.
- `[attr.aria-labelledby]="effectiveAriaLabelledby() || null"` (computed — prefers the external input; falls back to form-field's label id when wrapped).
- `[attr.aria-describedby]="describedByIds() || null"` — populated by `FormFieldComponent.setDescribedByIds` via the form-field protocol.
- `[attr.aria-required]="required() || null"`.
- `[attr.aria-invalid]="errorState() || null"` — derived via the form-field-control contract (see Form integration).
- `[attr.aria-disabled]="isDisabled() || null"`.
- `[attr.tabindex]="isDisabled() ? -1 : 0"`.
- `[id]="hostId"` — stable per instance; consumed by the form-field for label `for=`.

**Panel (`role="listbox"` on an inner `<div>`):**
- `role="listbox"`.
- `[attr.aria-multiselectable]="multiple() ? 'true' : null"`.
- `[id]="listboxId"`.
- `[attr.aria-label]="listboxAriaLabel()"` — falls back to the trigger's accessible name.

**Group wrapper (`role="group"` on the per-group `<div>`):**
- `role="group"`.
- `[attr.aria-label]="groupName"`.

**Option (`role="option"` on each row):**
- `role="option"`.
- `[id]="optionId(index)"` — `${listboxId}-option-${index}`.
- `[attr.aria-selected]="isSelected(option) ? 'true' : 'false'"`.
- `[attr.aria-disabled]="isOptionDisabled(option) || null"`.
- `[class.cdk-active]="isActive(option)"` — purely for styling; `aria-activedescendant` on the trigger carries the semantic.

### Keyboard — APG Listbox pattern

Behaviour is uniform whether `searchable` is true or false, except where noted. `preventDefault()` unless stated.

| Key | Trigger focused & panel closed | Trigger focused & panel open (non-search) | Search input focused (search-mode, panel open) |
|---|---|---|---|
| `Enter` | Open panel; set active option to the first selected (single) or the first option (multi). | Select the active option. In single-select, close and return focus to trigger. In multi-select, toggle selection and keep the panel open. | Same as "panel open". |
| `Space` | Open panel (same as Enter). | Same as Enter. | **Do not** intercept — consumer is typing. |
| `Down Arrow` | Open panel; set active = first selected or first enabled option. | Move active to next enabled option (no wrap — stay at end). | Move active within the listbox (focus stays on input). |
| `Up Arrow` | Open panel; set active = last enabled option. | Move active to previous enabled option (no wrap). | Same as "panel open". |
| `Alt + Down` | Open panel without moving active selection. | — | — |
| `Alt + Up` | — | Close panel, return focus to trigger, do not change selection. | Same. |
| `Home` | Open panel; active = first enabled. | active = first enabled. | Move caret to start of search input (no `preventDefault`). |
| `End` | Open panel; active = last enabled. | active = last enabled. | Move caret to end (no `preventDefault`). |
| `PageUp` / `PageDown` | — | Move active up/down by 10. | Same. |
| `Escape` | — | Close panel, return focus to trigger, do not change selection. | Same. |
| `Tab` | Natural. | Close panel, do not change selection, allow default tab order. | Same. |
| `A`–`Z`, `0`–`9` (not search mode) | — | CDK `ActiveDescendantKeyManager.withTypeAhead(typeaheadDebounce())` jumps to the next option whose label starts with the typed prefix. | — |
| `A`–`Z` (search mode) | Opens panel (sets focus to the search input) and begins filtering. | Filters listbox. | Filters listbox. |
| Any printable while trigger focused (search mode) | Opens panel, focuses the search input, forwards the character so the first keystroke is not lost. | — | — |

**Multi-select note:** Enter and Space toggle the active option; the panel stays open (`closeOnSelect` defaults false for multi). Shift+click on an option is out of scope for v1.

### Focus management

- Inject `FocusMonitor`, call `focusMonitor.monitor(this.elementRef)` in `ngOnInit`, `stopMonitoring` in `destroyRef.onDestroy` — mirrors `checkbox.ts`. Drives the `focused()` signal (used by form-field).
- When the panel opens in non-search mode, focus stays on the trigger (combobox pattern); the listbox uses `aria-activedescendant`.
- When the panel opens in search mode, DOM focus moves to the `<input>` inside the panel. On panel close, DOM focus returns to the trigger (except when close was caused by `Tab` — then natural tab order wins).
- `ActiveDescendantKeyManager`: instantiate in `ngAfterContentInit` using a `QueryList`-like wrapper over the rendered options' `OptionRef[]`. Use `.withWrap(false)`, `.skipPredicate((o) => o.isDisabled())`, and conditionally `.withTypeAhead(typeaheadDebounce())` when `!searchable()`.
- After each arrow-key navigation, call `document.getElementById(activeOptionId())?.scrollIntoView({ block: 'nearest', behavior: 'auto' })` on the listbox element so the active option remains visible.
- No `FocusTrap` — a listbox is not a dialog. Outside-click and Escape both close without trapping.

### Live announcements

- Inject `LiveAnnouncer`. In **multi-select only**, after a selection toggle from user input, announce `"{{ label }} selected"` / `"{{ label }} deselected"` politely. Single-select doesn't need an announcement — `aria-selected` on the option + the combobox value change are sufficient.
- Do not announce programmatic writes (`writeValue` or `value.set` from consumer code). Guard announcements with the `source === 'user'` branch.

### Dev-mode accessible-name warning

In the constructor, use `afterNextRender` + `isDevMode()` to warn when:
- `ariaLabel()`, `ariaLabelledby()`, and the form-field-wrapper label are all absent, AND
- no `*twSelectTrigger` template is provided (because custom triggers often contain the visible label themselves).

Message: `[tw-select] The select has no accessible name. Set aria-label, aria-labelledby, or wrap the component in a <tw-form-field> with a <label twLabel>.`

### AXE / WCAG

Must pass all AXE checks and meet WCAG AA. Verify colour contrast of `text-fg-subtle` against `bg-surface-overlay` for the empty state and group labels.

## Form integration

### `ControlValueAccessor`

Implement on `SelectComponent`. Register via `NG_VALUE_ACCESSOR` (see Providers above). Mirrors `checkbox.ts` exactly:

- **`writeValue(value: T | T[] | null)`** — normalise (`multiple` ⇒ wrap non-array scalar to `[scalar]` or `[]`; single-select ⇒ unwrap array to its first element or `null`), update the internal `linkedSignal`, update the public `value` model. Emit `selectionChange` with `source: 'programmatic'`. **Do not** call `onChange` (forms call us, we don't call back).
- **`registerOnChange(fn: (v: T | T[] | null) => void)`** — store on a private field. Called from the user-interaction path after `selectionChange`.
- **`registerOnTouched(fn: () => void)`** — store on a private field. Called on first panel close and on blur.
- **`setDisabledState(isDisabled: boolean)`** — set a `cvaDisabled` signal; `isDisabled = computed(() => disabled() || cvaDisabled())` drives ARIA, trigger activation, and CSS.

### Template-driven, reactive, signal-forms

All three strategies are supported automatically via the single `ControlValueAccessor`. No per-strategy code. Signal forms (Angular v21's new `form()`-based API) consume any CVA, so the `model()` + CVA combination is sufficient.

### `FormFieldControl<T | T[]>` contract

Implement the abstract class from `ngx-tw/form-field`. Provide via:

```ts
{ provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => SelectComponent) }
```

Required members (all signals except `setDescribedByIds`/`onContainerClick`):

- `id = computed(() => hostId)` — a stable `tw-select-${n}` id.
- `value: Signal<T | T[] | null>` — expose the existing `value` model's read side. `value.asReadonly()` is sufficient.
- `focused: Signal<boolean>` — driven by `FocusMonitor`. `true` while the trigger or any panel descendant has focus.
- `empty: Signal<boolean>` — `computed(() => multi ? !value().length : value() == null)`.
- `disabled: Signal<boolean>` — `isDisabled` computed.
- `required: Signal<boolean>` — the `required` input.
- `errorState: Signal<boolean>` — `signal(false)` by default. Concrete error-state derivation (touched + invalid) is owned by a future `NgControl`-aware extension; for this prompt, expose a public `_setErrorState(v: boolean)` method used internally and by the form-field indirectly (future). Leaving this as a plain `signal(false)` is acceptable — the form-field just won't show red until a later revision wires `NgControl`.
- `controlType = 'select'` — gives `tw-form-field` a `tw-form-field-type-select` class hook.
- `userAriaDescribedBy: Signal<string | undefined>` — a private `signal<string | undefined>(undefined)` set by `ariaDescribedby` input or `setDescribedByIds` merge.
- **`setDescribedByIds(ids: string[])`** — store on a `signal<string[]>` and emit through `describedByIds` computed → host `[attr.aria-describedby]`.
- **`onContainerClick(event: MouseEvent)`** — focus the trigger and open the panel (unless the click originated inside the panel).

When wrapped in `tw-form-field`, the form-field mirrors `focused`, `empty`, `disabled`, `required`, and `errorState` into its own presentation. The select just publishes them.

### Auto-naked detection

```
private readonly formField = inject(FormFieldComponent, { optional: true });
readonly resolvedVariant = computed<SelectVariant>(() =>
  this.variant() ?? (this.formField ? 'naked' : 'default'),
);
```

Note: to make this work, change the `variant` input's default in the public-API table to `undefined` internally and surface `resolvedVariant` to the `tv()` config. JSDoc must document the auto-detection behavior (done in the table above).

## Implementation notes

### State signals

- `value = model<T | T[] | null>(null)` — user-facing.
- `internalValue = linkedSignal(() => value())` — decouples programmatic writes from user toggles.
- `open = model(false)`; `closing = signal(false)` (mirror the popover's pattern for leave-animation sequencing).
- `search = signal('')` — bound to the search input.
- `activeIndex = signal<number>(-1)` — index into `visibleOptions()`.
- `visibleOptions = computed(() => searchable() && search() ? options().filter(o => filterPredicate()(o, search())) : options())`.
- `selectedOptions = computed(() => options().filter(o => isSelected(o)))`.
- `isSelected(option)` — helper that uses `compareWith()` against `internalValue()`. In multi-mode, iterates the array; in single, compares directly.

### Overlay

Use the popover's pattern verbatim for overlay lifecycle. Concrete differences:

- `buildPositions(offset)` returns four positions, in order: `bottom-start`, `bottom-end`, `top-start`, `top-end`. Helper:

```ts
const positions: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top',    offsetY: offset },
  { originX: 'end',   originY: 'bottom', overlayX: 'end',   overlayY: 'top',    offsetY: offset },
  { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom', offsetY: -offset },
  { originX: 'end',   originY: 'top',    overlayX: 'end',   overlayY: 'bottom', offsetY: -offset },
];
```

- `FlexibleConnectedPositionStrategy`: `.withPositions(positions).withFlexibleDimensions(true).withPush(false).withViewportMargin(8)`. The `withFlexibleDimensions(true)` + `withPush(false)` combination lets the listbox shrink when near a viewport edge instead of being pushed to overlap the trigger.
- `panelWidth` resolution: read the trigger's `getBoundingClientRect().width` in the `open` effect when `panelWidth() === 'trigger'`, apply via `overlayRef.updateSize({ minWidth: px })`. For `'auto'` → no width set. For `number` → `{ width: px }`. For `string` → `{ width: cssValue }`.
- Panel is rendered via an **internal component** (`SelectOverlayComponent`, private, not exported) attached with a `ComponentPortal`. This component receives configuration (size, color, multi, listboxId, header/footer templates, option template, empty template, option context list, active index) via `signal()`-backed fields set from the outer directive — mirrors how `PopoverOverlayComponent` is driven by `PopoverDirective`. Keeps the overlay DOM cleanly detachable.
- Scroll strategy: `resolveScrollStrategy()` switch mirrors popover (`reposition` / `close` / `block`).
- Backdrop: `hasBackdrop: true` with `backdropClass: 'cdk-overlay-transparent-backdrop'`. Backdrop click closes the panel.
- Enter/leave: `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"`. `ANIMATION_DURATION = 150` — the directive defers `overlayRef.detach()` by that duration on close so the leave animation finishes before DOM removal (same pattern as popover).
- Outside-click when backdrop is disabled is not a concern here — backdrop is always on.
- Handle reposition on `resize`/`scroll` via `scrollStrategy: 'reposition'` (default) — CDK does the work.
- Dispose `overlayRef`, unsubscribe per-open subscriptions, and cancel the leave-timer in `destroyRef.onDestroy` — copy popover.

### Options & groups

- Flatten options into `renderedRows: { kind: 'group-label' | 'option'; group?: string; option?: O; index: number }[]` using a `computed()`. Group labels render at the first appearance of each group; options after their label. Ungrouped options render first (in original order). The `index` field on options is the *option* index (used for `ActiveDescendantKeyManager` and IDs) — group labels don't have one.
- `ActiveDescendantKeyManager` wraps an internal `OptionRef[]` list that matches `visibleOptions()` (excluding group-label rows). Rebuild on `visibleOptions` changes via an `effect()`.

### Selection logic

- **Single-select toggle:** `select(option)` → if selected, clear (only if the consumer allows deselection — default `false`; for now, single-select does NOT unselect by clicking the selected option, matching native `<select>`). Commit new value, call `onChange`, emit `selectionChange` (`source: 'user'`). If `closeOnSelect()` → close panel.
- **Multi-select toggle:** `toggle(option)` → add/remove from internal array (via `compareWith`), commit, emit with `added`/`removed`. Announce via `LiveAnnouncer`.
- **Reset/clear affordance:** expose a public `clear()` method AND render a dismiss icon button inside the default trigger when value is non-empty and `!disabled()`. Button is `role="button"` with `aria-label="Clear selection"`. Clicking it calls `clear()` and stops propagation so the panel doesn't open. Emits `selectionChange` with `source: 'reset'`.

### Refs & directives

All in `select.ts`:

- `SelectOptionTemplateDirective` — `selector: '[twSelectOption]'`. Holds `templateRef = inject(TemplateRef<TwSelectOptionContext<T>>)`. Typed with a `static ngTemplateContextGuard` so `let-`-bound variables are type-checked.
- `SelectTriggerTemplateDirective` — `selector: '[twSelectTrigger]'`. Same pattern, context: `{ $implicit: T | T[] | null; open: boolean; empty: boolean; selectedOptions: readonly unknown[] }`.
- `SelectEmptyTemplateDirective` — `selector: '[twSelectEmpty]'`. Context: `{ $implicit: string }`.

Imported in `SelectComponent.imports` so they can be used inside `<tw-select>`. Re-exported from `index.ts`.

### ID generation

```ts
let nextSelectId = 0;
// …
readonly hostId = `tw-select-${nextSelectId++}`;
readonly listboxId = `${this.hostId}-listbox`;
readonly searchInputId = `${this.hostId}-search`;
readonly optionId = (index: number) => `${this.hostId}-option-${index}`;
```

### Template structure

`select.ts` inline template renders **only the trigger**. Overlay panel content lives in `select-overlay.ts` (private, component selector `tw-select-overlay`, not exported from `index.ts`). The overlay template:

```
<div class="panel" animate.enter="scale-in fade-in" animate.leave="scale-out fade-out">
  @if (hasPanelHeader()) {
    <div class="panelHeader"><ng-content select="[slot=panel-header]"/></div>
  }
  @if (searchable()) {
    <div class="searchWrapper">
      <input class="searchInput" type="search" [(ngModel)]="…" … />
    </div>
  }
  <div role="listbox" class="listbox" [style.maxHeight.px]="panelMaxHeight()">
    @if (visibleOptions().length === 0) {
      @if (emptyTemplate()) {
        <ng-container *ngTemplateOutlet="emptyTemplate()!; context: { $implicit: search() }"/>
      } @else {
        <div class="emptyState">{{ emptyMessage() }}</div>
      }
    } @else {
      @for (row of renderedRows(); track row.kind === 'option' ? row.option : row.group) {
        @if (row.kind === 'group-label') {
          <div role="group" [attr.aria-label]="row.group">
            <div class="optionGroupLabel">{{ row.group }}</div>
          </div>
        } @else {
          <div role="option" [id]="optionId(row.index)" …>
            @if (optionTemplate()) {
              <ng-container *ngTemplateOutlet="optionTemplate()!; context: buildOptionContext(row)"/>
            } @else {
              <span class="optionLabel">{{ optionLabel()(row.option) }}</span>
              @if (isSelected(row.option)) {
                <tw-icon name="check" class="checkmark"/>
              }
            }
          </div>
        }
      }
    }
  </div>
  @if (hasPanelFooter()) {
    <div class="panelFooter"><ng-content select="[slot=panel-footer]"/></div>
  }
</div>
```

(Template illustrative — trim when the file grows past ~60 lines into a `select-overlay.html`.)

The **main component** template is small (~20 lines): the trigger, chevron, clear button, and a hidden `<ng-content>` that holds projected templates/slots until the overlay component consumes them. Since projected content on the outer component is rendered in the outer DOM, the overlay must have its templates *forwarded* to it — do this by setting `signal()`-backed fields on the internal overlay component instance immediately after `overlayRef.attach()`, same way the popover sets `size`, `color`, etc.

### Constraints during implementation

- No arrow functions in templates (use methods on the component — `buildOptionContext(row)` above).
- No `ngClass` / `ngStyle` — use `[class]` / `[style.*]`.
- No `@HostBinding` / `@HostListener` — `host:` object only.
- No `fakeAsync` / `tick` — Vitest. See Testing plan.
- Never import `@angular/animations`. Animations come from `theme/_base.css` via `animate.enter`/`animate.leave`.
- All class strings must be statically present in the source (fully-written lookup `Record<TwColor, string>` tables) so Tailwind v4 scans them — no runtime concatenation of fragments like `` `bg-${color}-50` ``.

## File structure

Under `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/select/`:

- **`select.ts`** — `SelectComponent<T>`, `SelectOptionTemplateDirective`, `SelectTriggerTemplateDirective`, `SelectEmptyTemplateDirective`. All public types (`TwSelectOption`, `SelectVariant`, `TwSelectSelectionSource`, `TwSelectSelectionChangeEvent`, `TwSelectOpenedEvent`, `TwSelectSearchEvent`, `TwSelectOptionContext`, `TwSelectTriggerContext`). `tv()` config. Static `OPTION_ACTIVE_BG` / `OPTION_CHECKMARK` lookup records. Module-scoped `nextSelectId` counter. Overlay helpers (`buildPositions`, `resolveScrollStrategy`).
- **`select-overlay.ts`** — private `SelectOverlayComponent` (not exported from `index.ts`). Contains the panel template (search input, listbox, group rendering, option rendering, empty state, header/footer projection). Receives config via signal-backed fields. Mirrors `PopoverOverlayComponent` in `popover.ts`.
- **`select-overlay.html`** — if the overlay template grows past ~50 lines (likely), extract.
- **`select.spec.ts`** — Vitest tests (see Testing plan).
- **`index.ts`** — public API exports (see below).
- **`ng-package.json`** — `{ "lib": { "entryFile": "index.ts" } }`.

Update:

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/select';`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/angular.json` — add the select to the library's secondary-entry-points list if the build config requires manual listing (most ng-packagr v21 setups auto-discover `ng-package.json` files; verify before assuming).
- **No theme file edits.** `scale-in`/`scale-out`/`fade-in`/`fade-out` already exist in `projects/ngx-tw/theme/_base.css`.

## Public API exports

```ts
// projects/ngx-tw/select/index.ts
export {
  SelectComponent,
  SelectOptionTemplateDirective,
  SelectTriggerTemplateDirective,
  SelectEmptyTemplateDirective,
} from './select';
export type {
  TwSelectOption,
  SelectVariant,
  TwSelectSelectionSource,
  TwSelectSelectionChangeEvent,
  TwSelectOpenedEvent,
  TwSelectSearchEvent,
  TwSelectOptionContext,
  TwSelectTriggerContext,
} from './select';
```

`SelectOverlayComponent` is **not** exported — internal overlay host only.

## Testing plan

File: `select.spec.ts`. Use explicit Vitest imports (`import { describe, it, expect, vi, beforeEach } from 'vitest'`) and `ComponentFixture` / `TestBed` from Angular. Import `OverlayModule` in each test bed (same pattern as `popover.spec.ts`). No `fakeAsync`/`tick` — use `async/await` + `fixture.whenStable()`. Use `vi.spyOn()` for method spies.

Define small test hosts: `BasicSelectHost<T>`, `MultiSelectHost<T>`, `SearchableSelectHost<T>`, `ReactiveFormsSelectHost<T>`, `FormFieldWrappedSelectHost<T>`, `CustomTemplatesSelectHost<T>`.

### What to cover

**Rendering**
- Default render mounts without errors with no inputs.
- Each `variant` (`default`, `naked`) renders without errors.
- Each `size` (`xs`–`xl`) renders without errors.
- Each `color` renders without errors.
- `placeholder` is shown when value is empty.
- When wrapped in `<tw-form-field>` without explicit `variant`, the trigger gets the naked styling (absence of `border-border` class on the trigger, or — preferred — a `data-variant="naked"` host attribute the implementation should expose specifically to make this testable).

**Inputs**
- `options`: rendering a list updates panel DOM.
- `optionLabel` / `optionValue` / `optionDisabled` / `optionGroup` accessors override the defaults when set.
- `disabled=true` blocks trigger activation — `click` doesn't open the panel, `Enter`/`Space`/`ArrowDown` don't open.
- `required=true` sets `aria-required="true"` on the trigger.
- `panelClass` appears on the overlay panel.
- `panelMaxHeight` is applied as inline `max-height` on the listbox.
- `closeOnSelect=true` in multi-mode overrides the default and closes after each pick.

**Two-way binding & CVA**
- `[(value)]`: programmatic `value.set(…)` updates the default trigger label.
- Reactive forms: `formControl.setValue(x)` updates the trigger; user pick updates `formControl.value`.
- `formControl.disable()` sets `aria-disabled="true"` and prevents panel opening.
- Template-driven `[(ngModel)]` round-trip with `await fixture.whenStable()`.
- `writeValue(null)` clears the selection and emits `selectionChange` with `source: 'programmatic'`.

**Outputs**
- `openedChange` fires with `{ open: true, trigger }` on open and `{ open: false, trigger }` after close animation completes (advance vitest fake timers or wait the 150 ms).
- `selectionChange` fires with correct `added`/`removed`/`previousValue`/`source` for each of: user click, keyboard Enter, `writeValue`, `clear()`.
- `searchChange` fires for each keystroke in the search input with the current `visibleCount`.

**Single-select interaction**
- Clicking the trigger opens the panel.
- Clicking an option commits the value, closes the panel (default `closeOnSelect`), and emits `selectionChange` (`source: 'user'`).
- Clicking a disabled option does nothing.
- Clicking the selected option does NOT deselect (matches native `<select>`).

**Multi-select interaction**
- Panel does not close after selecting an option.
- Each selection toggles that option's `aria-selected`.
- `LiveAnnouncer.announce` is called with `"{{ label }} selected"` / `"{{ label }} deselected"` (spy on `LiveAnnouncer`).
- `added`/`removed` arrays reflect the delta.

**Keyboard (non-search mode)**
- `Enter`/`Space`/`ArrowDown` on a closed trigger opens the panel.
- `ArrowDown`/`ArrowUp` update `aria-activedescendant`, not DOM focus.
- `Home`/`End` jump to first/last enabled option.
- Disabled options are skipped by the manager.
- `Escape` closes and returns focus to the trigger without changing selection.
- `Tab` closes and allows natural tab order.
- `Enter` on an active option selects; single-select closes.
- Type-ahead: pressing "b" then "a" within `typeaheadDebounce` focuses the first option whose label starts with "ba" (spy or inspect `aria-activedescendant`).

**Keyboard (search mode)**
- Focus is moved to the `<input>` on panel open.
- Typing filters the listbox; `visibleCount` on `searchChange` matches.
- `ArrowDown` from the input moves `aria-activedescendant` in the listbox while DOM focus stays on the input.
- `Enter` selects the active filtered option.
- `Escape` closes and returns DOM focus to the trigger.

**Empty state**
- When `visibleOptions().length === 0`: default empty state shows `emptyMessage`.
- When `*twSelectEmpty` is projected, the custom template renders with the current search text.

**Content projection**
- `*twSelectOption` replaces default option rendering; context variables (`selected`, `active`, `disabled`, `index`) are correct.
- `*twSelectTrigger` replaces the default trigger; context (`open`, `empty`, `selectedOptions`) matches state.
- `[slot="panel-header"]` and `[slot="panel-footer"]` render in the correct regions and only when projected.

**Groups**
- Options with the same `group` render under a single `role="group"` with matching `aria-label`.
- Ungrouped options render before the first group.

**Accessibility**
- `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded` reflects `open`, `aria-controls` points at the listbox.
- `aria-activedescendant` updates on arrow keys and matches the active option's `id`.
- `aria-multiselectable="true"` when `multiple=true` on the listbox.
- Each option has `role="option"` and correct `aria-selected`.
- Dev-mode warning is logged when no accessible name is provided (spy on `console.warn`).

**Form-field integration**
- When wrapped, `contentChild(TW_FORM_FIELD_CONTROL)` on the parent form-field resolves to the select.
- `control.focused()` becomes `true` on `focusin` and `false` on `focusout` (including when focus moves into the overlay — which is a **descendant** of the document body, not of the trigger. Use `FocusMonitor.monitor(trigger, true)` so focused descendants still count). Verify focus tracks both the trigger and the panel's search input.
- `control.empty()` is `true` when no selection, `false` otherwise (single and multi).
- `setDescribedByIds(['x', 'y'])` updates the trigger's `aria-describedby` to `"x y"`.
- `onContainerClick` focuses the trigger and opens the panel.

**Focus**
- `FocusMonitor.monitor` is called on init (spy).
- `stopMonitoring` is called on destroy.

**Overlay lifecycle**
- Opening attaches an overlay; closing detaches after the leave-animation delay (150 ms).
- Backdrop click closes the panel.
- `open.set(false)` from parent closes the panel and emits `openedChange`.
- Destroy while open disposes the overlay cleanly (no residual DOM).

**Panel width**
- `panelWidth="trigger"`: panel's `min-width` equals trigger's measured width.
- `panelWidth={number}`: panel's `width` equals `${n}px`.
- `panelWidth="auto"`: no width constraint applied.

## Constraints

- Standalone component; do NOT set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush` on component, overlay component, and every directive.
- Signal APIs only: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`, `signal()`, `contentChild()`, `contentChildren()`, `viewChild()`, `effect()`. No `mutate`. No RxJS in component logic — RxJS is acceptable only for CDK-returned observables (e.g., `overlayRef.backdropClick()`, `positionStrategy.positionChanges`), which must use `takeUntilDestroyed`.
- `inject()` for DI — no constructor injection.
- `host:` object only — never `@HostBinding`/`@HostListener`.
- Native control flow (`@if`, `@for`, `@switch`); no `ngClass`/`ngStyle`; no arrow functions in templates.
- Tailwind utilities only, no CSS files. Semantic tokens (`primary-*`, `info-*`, …), surface/fg/border tokens for neutral structural styling. Never raw palette colors. Never raw `neutral-*` for structural styling.
- `tv()` includes `defaultVariants` and passes `{ twMerge: true }` as the second argument.
- All class strings statically present in source — static `Record<TwColor, string>` lookup tables, not template-literal concatenation.
- Visual tokens (radius `rounded-md` on trigger + search input / `rounded-lg` on panel, shadow `shadow-md`, transitions `duration-200 motion-reduce:transition-none`, focus ring `outline-2 outline-offset-2 outline-primary-500`, spacing from the standard inline padding scale, icon sizes `size-4`/`size-5`) match CLAUDE.md's Visual Design System exactly. No invented values.
- No `@angular/animations`. Panel enter/leave uses `animate.enter="scale-in fade-in"` / `animate.leave="scale-out fade-out"` with existing keyframes in `projects/ngx-tw/theme/_base.css`.
- Every `input()`, `output()`, `model()`, exported type member, and public method has a one-line JSDoc.
- Strict typing — no `any`. Generic `T` propagates through options, model, and events.
- CVA on the component itself. Form-field integration via `TW_FORM_FIELD_CONTROL` token; auto-naked detection when a `FormFieldComponent` is injectable as an ancestor.
- Vitest: `vi.spyOn()`, `async/await`, `fixture.whenStable()`. No `fakeAsync`/`tick`.
- Keyboard behaviour matches WAI-ARIA APG "Combobox with Listbox Popup" (non-search mode) and "Listbox with Search Filter" (search mode).
