# Prompt: Build `tw-transfer` for ngx-tw

## Context

Read before starting:

- `.claude/CLAUDE.md` — all conventions (signals, `host` bindings, `tv()` + `twMerge`, semantic / surface / fg / border tokens, the full Visual Design System tables for radius / spacing / typography / icon-sizing / focus-rings / borders, the **form-control input-count exception**, the **runtime** `ControlValueAccessor` registration rule, and the Vitest test rules). This component is a **form control**, so it claims the form-control input-count exception — but every behavioural / visual knob still routes into a config object, not a new top-level input.
- `projects/ngx-tw/tags-input/tags-input.ts` AND `projects/ngx-tw/select/select.ts` — the two existing **array-valued form controls**. Copy their CVA + `FormFieldControl` wiring **exactly**: `inject(NgControl, { optional: true, self: true })` then `if (this.ngControl) this.ngControl.valueAccessor = this;` in the constructor (runtime — **never** the static `NG_VALUE_ACCESSOR` provider); the internal value held in a plain `signal` (NOT a `model()`); `writeValue` / `registerOnChange` / `registerOnTouched` / `setDisabledState`; the `_ngControlRev` + `_formSubmitRev` revision signals feeding `errorState`; the `errorStateMatcher` input + `TW_ERROR_STATE_MATCHER` default; the `valueChange` output (NOT a `model()`); the `ngOnInit` subscription that bumps `_ngControlRev` on `statusChanges` / `valueChanges` and `_formSubmitRev` on `ngSubmit`. `select`'s **controlled internal value** (`linkedSignal` mirroring an input / model, `.set()` on user action) is the exact shape for the per-panel ephemeral `checked` set.
- `projects/ngx-tw/table/table.ts` — the canonical reference for **config-object inputs** merged with `*_DEFAULTS` constants via `computed()`; the **template directive** that carries a `TemplateRef` with a typed context + a static `ngTemplateContextGuard` (`CellDefDirective`, table.ts:545); the `buildCellContext` helper (table.ts:783) that assembles a typed context object; rendering a projected template through `NgTemplateOutlet`; the tri-state master-selection computed.
- `projects/ngx-tw/checkbox/checkbox.ts` — the interactive tri-state `tw-checkbox` (`[checked]` / `[indeterminate]` / `(change)`) used for the **header** select-all, and the canonical `FormFieldControl` example.
- `projects/ngx-tw/button/button.ts` — the `[twButton]` directive (`variant` / `color` / `size`) the move buttons compose; note it is icon-agnostic (compose `tw-icon` inside).
- `projects/ngx-tw/icon/index.ts` — the `tw-icon` component (`IconComponent`, selector `tw-icon`) for the presentational per-row check glyph and the move-button chevron icons.
- `projects/ngx-tw/tree/index.ts` and `projects/ngx-tw/tree/ng-package.json` — entry-point shape.
- `node_modules/@angular/cdk/types/listbox.d.ts` — the CDK API you are composing. Read `CdkListbox` (`[cdkListbox]`, exportAs `cdkListbox`; inputs aliased `cdkListboxValue` / `cdkListboxMultiple` / `cdkListboxDisabled` / `cdkListboxCompareWith` / `cdkListboxUseActiveDescendant` / `cdkListboxOrientation`; output `cdkListboxValueChange`), `CdkOption` (`[cdkOption]` is the **value** alias, plus `cdkOptionDisabled`, `cdkOptionTypeaheadLabel`), and `ListboxValueChangeEvent<T>` (`{ value, listbox, option }`).

CDK modules to import: `@angular/cdk/listbox` (`CdkListbox`, `CdkOption` — or `CdkListboxModule`), `@angular/cdk/a11y` (`LiveAnnouncer`), `NgTemplateOutlet` from `@angular/common`. Plus `@angular/forms` (`NgControl`, `NgForm`, `FormGroupDirective`, `Validators`, `ControlValueAccessor`) and the `form-field` entry point (`FormFieldControl`, `TW_FORM_FIELD_CONTROL`).

> **CDK architecture — read this twice.** Each panel body is **one `[cdkListbox]`** with `[cdkListboxMultiple]="true"` (CdkListbox defaults to single-select — you MUST set multiple) and one `[cdkOption]` per **visible** item. **Do NOT** roll a custom listbox, and **do NOT** copy `select`'s buried `aria-activedescendant` overlay — that is the wrong pattern here. CdkListbox gives you, for free: `role="listbox"` + `aria-multiselectable`, `role="option"` + `aria-selected`, a **single tab stop per panel** with roving-tabindex Arrow / Home / End navigation, Space / Enter toggling, and typeahead via `cdkOptionTypeaheadLabel`. Leave `cdkListboxUseActiveDescendant` at its default (`false`) so each option receives **real DOM focus** — which is exactly why options take the canonical `focus-visible` outline ring and the menu-item background-shift carve-out is NOT licensed here. **The option value is the item's key `K`, not the item object** — bind `[cdkOption]="keyFn(item)"`. That makes each panel's `cdkListboxValue` a `readonly K[]` and keeps `cdkListboxCompareWith` trivial (key identity), avoiding object-reference fragility across data changes. **Do not hand-set `aria-selected`** — CdkOption owns it.

## What to build

A **dual-listbox shuttle** component, `tw-transfer` (class `TransferComponent<T, K = unknown>`, generic over item type `T` and key type `K`). Two side-by-side panels — **source** (left) and **target** (right) — with a column of directional move buttons between them. The user ticks items in a panel and clicks a directional button to shuttle the ticked items to the other side. Each panel has a header with a title, a live count, and an optional tri-state "select all" checkbox; an optional per-panel search input filters the list. Canonical uses: assigning roles / permissions, picking team members, building an allow-list, moving columns into / out of a report.

The component **is a form control**. Its value is **the set of keys currently on the target side** (`targetKeys`), exposed through `ControlValueAccessor` so it works with template-driven, reactive, and signal-based forms, and through `FormFieldControl` so a wrapping `<tw-form-field>` shows label / hint / error chrome. Consumers supply two accessors — `keyFn` (required) and `labelFn` (defaulted) — and may optionally project a `*twTransferItem` template for rich row content (the default render is a presentational check glyph + label).

> **Two selection layers — name them distinctly, never conflate them.** This is the single most conflatable thing in the build.
>
> | Layer | Name | Lifetime | What it is |
> |---|---|---|---|
> | **Membership** | `targetKeys` (the **value**) | Persisted | The keys whose items live on the target side. Held in `signal<readonly K[]>([])`. This is the CVA value. Everything in `data` whose key ∉ `targetKeys` is on the source side. **Never derived from `data`** — it is the source of truth. |
> | **Checked** | per-panel `sourceChecked` / `targetChecked` (the **CdkListbox value**) | Ephemeral | The keys the user has ticked in a panel, pending a bulk move. Bound *controlled* to that panel's `[cdkListboxValue]`. **Cleared to `[]` after every successful move.** |
>
> A move reads a panel's ephemeral checked set, mutates the persisted `targetKeys`, then clears that panel's checked set. **Select-all only mutates the ephemeral checked layer — it never touches `targetKeys`** (a move still requires the directional click).

## API design

Two exported artifacts: `TransferComponent` (`tw-transfer`) and `TransferItemDefDirective` (`*twTransferItem`).

### `TransferComponent<T, K>` inputs

```typescript
/** All items across both panels. The source/target split derives from the value, not the reverse. Defaults to `[]`. */
data = input<readonly T[]>([]);

/** Resolves a stable key for an item — drives membership (the value), checked state, tracking, the cdkOption value, and compareWith. Required. */
keyFn = input.required<(item: T) => K>();

/** Resolves an item's display label — used for the default row render, search filtering, and listbox typeahead. Defaults to `(item) => String(item)`. */
labelFn = input<(item: T) => string>((item: T) => String(item));

/** Per-panel text + ARIA labels. Partial; unset keys fall back to the English defaults in `TRANSFER_LABELS_DEFAULTS`. */
labels = input<Partial<TwTransferLabels>>({});

/** Visual configuration — size, list viewport height, search / select-all visibility. Partial; unset keys fall back to `TRANSFER_DISPLAY_DEFAULTS`. */
display = input<Partial<TwTransferDisplayConfig>>({});

/** Behavioural configuration — oneWay, custom filterFn, per-item disabledItem predicate. Partial; unset keys fall back to `TRANSFER_BEHAVIOR_DEFAULTS`. */
behavior = input<Partial<TwTransferBehaviorConfig<T, K>>>({});

/** Disables the entire control — panels non-interactive, search + buttons disabled, muted styling. Also driven by Forms `setDisabledState`. Defaults to `false`. */
disabledInput = input<boolean, unknown>(false, { alias: 'disabled', transform: booleanAttribute });
```

Plus the **form-control ARIA baseline**, mirrored verbatim from `checkbox` / `tags-input` / `select` (these flat inputs, together with the form-control nature, are what claim the input-count exception — keep every other knob inside the three config objects):

```typescript
/** Applied for labeling / identification on the control. Defaults to `undefined`. */
name = input<string | undefined>(undefined);

/** Id on the host element. Auto-generated as `tw-transfer-N` when unset. Used by the form-field's `<label for>` association. */
idInput = input<string | undefined>(undefined, { alias: 'id' });

/** Accessible name applied to the control when no visible label is wired. Mirrored to `aria-label`. Defaults to `undefined`. */
ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

/** ID of an external element that labels the control. Mirrored to `aria-labelledby`. Defaults to `undefined`. */
ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

/** ID of an external element that describes the control. Form-field merges its hint / error ids alongside. Defaults to `undefined`. */
ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

/** Marks the control as required. Mirrored to `aria-required`. Also inferred from `Validators.required` on a bound control. Defaults to `false`. */
requiredInput = input(false, { alias: 'required' });

/** Per-instance override of the {@link ErrorStateMatcher}. When omitted, uses the `TW_ERROR_STATE_MATCHER` token's value. Defaults to `undefined`. */
errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);
```

### `TransferComponent<T, K>` outputs

```typescript
/** Fires when items move between panels by user interaction. Payload is the new full target-keys array. Does not fire on `writeValue`. Mirrors `tags-input.valueChange`. */
valueChange = output<readonly K[]>();

/** Fires after each directional move, identifying the moved keys and their direction. Secondary to `valueChange` (which carries the canonical new value). Does not fire on `writeValue`. */
moved = output<TwTransferMovedEvent<K>>();
```

### `TransferComponent<T, K>` public methods

```typescript
/** Moves the given items (by key) to the target side; ignores keys already there or whose item is disabled. Emits `valueChange` + `moved`, calls the CVA onChange, announces via LiveAnnouncer. No-op when the control is disabled. */
moveToTarget(keys: readonly K[]): void;

/** Moves the given items (by key) to the source side; ignores keys already there or whose item is disabled. No-op when the control is disabled or `behavior.oneWay` is on. Same emissions as `moveToTarget`. */
moveToSource(keys: readonly K[]): void;
```

### Config object types (`Tw`-prefixed; export from `index.ts`)

```typescript
/** i18n strings for the transfer. All optional; unset keys fall back to the English defaults. */
export interface TwTransferLabels {
  /** Source (left) panel title. Defaults to `'Source'`. */
  sourceTitle?: string;
  /** Target (right) panel title. Defaults to `'Target'`. */
  targetTitle?: string;
  /** Placeholder for the per-panel search inputs. Defaults to `'Search'`. */
  searchPlaceholder?: string;
  /** Text shown in a panel body when it has no (visible) items. Defaults to `'No items'`. */
  emptyText?: string;
  /** Accessible name for the header select-all checkbox. Defaults to `'Select all'`. */
  selectAllLabel?: string;
  /** Accessible name for the → (move-to-target) button. Defaults to `'Move selected to target'`. */
  moveToTargetLabel?: string;
  /** Accessible name for the ← (move-to-source) button. Defaults to `'Move selected to source'`. */
  moveToSourceLabel?: string;
  /** Count template rendered in each panel header. Variables: `{total}`, `{selected}`. Defaults to `'{total} items'`. */
  countFormat?: string;
  /** LiveAnnouncer template announced after a move. Variables: `{count}`, `{target}`. Defaults to `'{count} items moved to {target}'`. */
  moveAnnouncement?: string;
}

/** Visual configuration. */
export interface TwTransferDisplayConfig {
  /** Row / control density across the design-system ramps. Defaults to `'md'`. */
  size?: TwSize;
  /** Scroll-viewport height of each list, in px (a number) or `'auto'` (flow with content). Defaults to `240`. */
  listHeight?: number | 'auto';
  /** When true, each panel gets a labelled search input above its list. Defaults to `false`. */
  showSearch?: boolean;
  /** When true, each panel header shows a tri-state select-all checkbox. Defaults to `true`. */
  showSelectAll?: boolean;
}

/** Behavioural configuration. Generic over item type `T` and key type `K`. */
export interface TwTransferBehaviorConfig<T = unknown, K = unknown> {
  /** When true, items only flow source → target; the ← button is hidden / disabled. Defaults to `false`. */
  oneWay?: boolean;
  /** Custom search predicate. Defaults to a case-insensitive substring match of the query against `labelFn(item)`. */
  filterFn?: (item: T, query: string) => boolean;
  /** Per-item disable predicate → renders that cdkOption with `cdkOptionDisabled` and excludes it from select-all and all moves. Defaults to `() => false`. */
  disabledItem?: (item: T) => boolean;
}
```

### `*twTransferItem` context + directive

```typescript
/** Context surfaced to a `*twTransferItem` template. */
export interface TwTransferItemContext<T> {
  /** The item data (implicit `let-item`). */
  $implicit: T;
  /** Resolved `labelFn(item)`. */
  label: string;
  /** Ephemeral pending-move checked state of this row's option. */
  checked: boolean;
  /** Whether the item is disabled (via `behavior.disabledItem`). */
  disabled: boolean;
  /** Which panel this row renders in. */
  side: 'source' | 'target';
}
```

`TransferItemDefDirective` (`[twTransferItem]`): a pure `TemplateRef<TwTransferItemContext<T>>` carrier with a static `ngTemplateContextGuard` returning `TwTransferItemContext<T>` — copy the exact shape from `CellDefDirective` (table.ts:545). The component queries it via `contentChild(TransferItemDefDirective)`. Unlike `tree`, this template is **optional**: when absent, each row renders the default — the presentational check glyph + `labelFn` text.

### Payload type

```typescript
/** Payload emitted by `moved`. */
export interface TwTransferMovedEvent<K> {
  /** The keys that moved in this interaction. */
  keys: readonly K[];
  /** The direction of the move. */
  direction: 'toTarget' | 'toSource';
}
```

## Usage examples

```html
<!-- Simplest: default row render (check glyph + label), no search, default select-all -->
<tw-transfer
  [data]="allRoles"
  [keyFn]="roleId"
  [labelFn]="roleName"
  [(ngModel)]="assignedRoleIds"
/>
```

```html
<!-- Rich rows via *twTransferItem — receives item + checked + side context -->
<tw-transfer
  [data]="people"
  [keyFn]="personId"
  [labelFn]="personName"
  [formControl]="membersControl"
>
  <ng-template twTransferItem let-person let-checked="checked" let-side="side">
    <tw-avatar size="sm" [src]="person.avatar" />
    <span class="min-w-0 truncate">{{ person.name }}</span>
    @if (side === 'target') {
      <span twBadge color="success" size="xs">member</span>
    }
  </ng-template>
</tw-transfer>
```

```html
<!-- Search + select-all + larger viewport, with a per-item disable predicate -->
<tw-transfer
  [data]="columns"
  [keyFn]="columnKey"
  [labelFn]="columnLabel"
  [(ngModel)]="visibleColumnKeys"
  [display]="{ showSearch: true, listHeight: 320, size: 'lg' }"
  [behavior]="{ disabledItem: isPinnedColumn }"
  [labels]="{ sourceTitle: 'Available', targetTitle: 'Shown' }"
/>
```

```html
<!-- Reactive form, one-way (no ← button), inside a tw-form-field for label/error chrome -->
<tw-form-field>
  <label twLabel>Allowed origins</label>
  <tw-transfer
    [data]="origins"
    [keyFn]="originHost"
    [labelFn]="originHost"
    [formControl]="originsControl"
    [behavior]="{ oneWay: true }"
    required
  />
  <span twError>Pick at least one origin.</span>
</tw-form-field>
```

## Styling

`tv()` config with `twMerge: true` and `defaultVariants`. All class strings must be **literal** so the Tailwind v4 JIT scanner picks them up — where a class varies by `size`, enumerate every size in a `variants.size` map (do not build class strings at runtime). Use semantic + surface / fg / border tokens only; never raw palette colors; no component CSS file.

Slots:

- `root` — the outer grid laying out *panel · controls · panel*: `grid grid-cols-[1fr_auto_1fr] gap-3 items-stretch text-fg`. When `display.size === 'sm'/'xs'` keep `gap-3` (controls column stays comfortable); apply `opacity-50 pointer-events-none` via a `disabled` variant.
- `panel` — `flex flex-col min-w-0 rounded-lg border border-border bg-surface overflow-hidden` (rounded container clips the scroll body; `min-w-0` enables row truncation).
- `panelHeader` — `flex items-center gap-2 border-b border-border bg-surface-muted`; padding rides the inline-element ramp (`xs` → `px-2 py-1`, `sm` → `px-3 py-1.5`, `md` → `px-4 py-2`, `lg` → `px-5 py-2.5`, `xl` → `px-6 py-3`).
- `panelTitle` — `text-sm font-semibold text-fg min-w-0 truncate flex-1`.
- `panelCount` — `text-xs text-fg-muted shrink-0` (rendered from `countFormat`).
- `search` — wraps the projected `input[twInput]`; `px-3 py-2 border-b border-border` (search input itself carries its own `tw-input` chrome).
- `list` — the `[cdkListbox]` scroll viewport: `flex flex-col overflow-y-auto outline-none`; height comes from `[style.height.px]` / `[style.maxHeight.px]` bound off `display.listHeight` (skip when `'auto'`).
- `option` — the `[cdkOption]` row: `flex items-center gap-2 cursor-pointer select-none text-fg transition-colors duration-200 motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`; per-size vertical padding on the inline ramp (`xs` → `px-2 py-1 text-xs`, `sm` → `px-3 py-1.5 text-sm`, `md` → `px-3 py-2 text-sm`, `lg` → `px-4 py-2.5 text-base`, `xl` → `px-4 py-3 text-base`). A `checked` variant keyed off the option's ephemeral checked state: `bg-primary-50 text-primary-700`. A `disabled` variant: `opacity-50 pointer-events-none` (also gated by `cdkOptionDisabled`).
- `optionCheck` — the presentational glyph (`tw-icon` or inline `<svg>` with `aria-hidden="true"`): `shrink-0`, glyph sub-scale by size (`xs`/`sm` → `size-4`, `md` → `size-5`, `lg`/`xl` → `size-5`). Visible only when checked (toggle visibility / color off the checked state; never an interactive control).
- `optionLabel` — `min-w-0 truncate flex-1`.
- `controls` — the middle button column: `flex flex-col justify-center gap-2`.
- `empty` — `flex items-center justify-center p-4 text-sm text-fg-subtle` (rendered when a panel's visible list is empty, using `labels.emptyText`).

Composed primitives:

- **Move buttons** — native `<button twButton variant="outline" color="neutral" [size]="size()">` each wrapping a `tw-icon` chevron (→ / ←). They are icon-only square targets: pass the `size` through to `[twButton]` and let it own padding; the chevron glyph uses the glyph sub-scale (`size-4`/`size-5`). Each button is disabled when its panel has no checked items, when the control is disabled, or (for ←) when `behavior.oneWay` is on. The ← button is **not rendered** when `oneWay` is on.
- **Search** — `input[twInput]` (the `tw-input` directive) inside the `search` slot, with an `aria-label` from `labels.searchPlaceholder`.
- **Header select-all** — `<tw-checkbox>` (interactive — it sits **outside** the listbox). Bind `[checked]` / `[indeterminate]` off the panel's tri-state computed (see Implementation notes) and `(change)` to toggle select-all for that panel; pass `[attr.aria-label]` from `labels.selectAllLabel` and `[disabled]` from the control's disabled state. Render only when `display.showSelectAll`.

## Accessibility

Must pass AXE and meet WCAG AA.

- **Each panel is a labelled listbox.** The `[cdkListbox]` element gets `[attr.aria-labelledby]` pointing at its panel-title element id (give each title a stable id derived from the host id), so AT announces "Source, listbox" / "Target, listbox". CdkListbox sets `role="listbox"` + `aria-multiselectable`; CdkOption sets `role="option"` + `aria-selected`. **Do not duplicate or override any of these.**
- **Roving tabindex, Arrow / Home / End, Space / Enter toggle, and typeahead come from CdkListbox** — do **not** add keyboard handlers on the host or on options. Set `cdkOptionTypeaheadLabel` to `labelFn(item)` so typeahead matches the visible label. Leave `cdkListboxUseActiveDescendant` at default `false` (real DOM focus per option → canonical outline focus ring).
- **Per-row tick is presentational** (`aria-hidden` glyph) — the option owns selection ARIA; never nest an interactive `tw-checkbox` inside an option (it would create a second tab stop and duplicate ARIA, breaking the single-tab-stop roving model).
- **Move buttons** carry `aria-label`s from `labels`; their disabled state rides the native `disabled` attribute (`[twButton]` already wires `aria-disabled`). Keep focus on the move button after a move (do not let focus jump to a panel).
- **`LiveAnnouncer`** announces each move politely, using `labels.moveAnnouncement` (e.g. "3 items moved to Target").
- The control surfaces error / required state through `FormFieldControl` (like `select` / `checkbox`), so a wrapping `<tw-form-field>` renders messages. Provide a dev-mode `console.warn` (via `afterNextRender` + `isDevMode()`) when no accessible name is wired (`aria-label` / `aria-labelledby` / form-field label), mirroring `tags-input`.
- Every interactive element (options, move buttons, select-all, search) shows a visible `focus-visible` indicator.

## Form integration

`implements ControlValueAccessor, FormFieldControl<readonly K[]>`. Mirror `select` / `tags-input` exactly:

- **Provider:** add `{ provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => TransferComponent) }` to `providers`. This is correct and coexists with the runtime CVA wiring — the "never static `NG_VALUE_ACCESSOR`" rule applies **only** to `NG_VALUE_ACCESSOR`, not to `TW_FORM_FIELD_CONTROL`.
- **CVA registration (runtime only):** `inject(NgControl, { optional: true, self: true })`, then in the constructor `if (this.ngControl) this.ngControl.valueAccessor = this;`. Never the static `NG_VALUE_ACCESSOR` provider — it circular-DIs against `inject(NgControl, { self: true })`, which the `errorStateMatcher` integration needs.
- **Value:** held in `signal<readonly K[]>([])` — this **is** `targetKeys`. The `FormFieldControl.value` member returns it. **NOT a `model()`** (a `model()` + CVA double-emits).
- **`writeValue(value)`** sets `targetKeys` to `[...value]` (or `[]` when null/undefined) and clears both panels' ephemeral checked sets. Does **not** emit `valueChange`. **Orphan keys** — keys present in the value but absent from `data` — are **preserved** in `targetKeys` (they render nothing but survive the round-trip, so a form value outlives a lagging `data`).
- **User moves** update `targetKeys` **and** call the stored `onChange(targetKeys)` **and** emit `valueChange` (+ `moved`).
- **`setDisabledState(isDisabled)`** sets a `cvaDisabled` signal; the effective `disabled` is `computed(() => this.disabledInput() || this.cvaDisabled())`.
- **`errorState` / `required` / `_ngControlRev` / `_formSubmitRev` / `setDescribedByIds` / `setLabelledByIds` / `onContainerClick`** — copy the `select` implementation member-for-member, including the `ngOnInit` subscription that bumps the revision signals on `statusChanges` / `valueChanges` / `ngSubmit`.

## Implementation notes

- **Ephemeral checked sets are controlled CdkListbox values.** Hold two writable signals: `sourceChecked = signal<readonly K[]>([])` and `targetChecked = signal<readonly K[]>([])`. Bind each *controlled* to its panel: `[cdkListboxValue]="sourceChecked()"` (and `[cdkListboxMultiple]="true"`, `[cdkListboxDisabled]="disabled()"`, `[cdkListboxCompareWith]="compareKeys"`). Capture user ticks via `(cdkListboxValueChange)="onSourceChecked($event)"`, where the handler does `this.sourceChecked.set([...event.value])`. This is `select`'s controlled-internal-value shape applied to a CdkListbox. Clearing after a move (`sourceChecked.set([])`) flows back through the binding and deselects every option.
- **The move pipeline (keep the two layers from blurring).** A directional click (or `moveToTarget` / `moveToSource`) does, in order: (1) read the panel's ephemeral checked set; (2) **scope it to the keys actually rendered right now** — i.e. `checked ∩ filteredEnabledKeys(panel)` — so a key a search filter has hidden can't be moved (per §3.3); (3) splice those keys across the persisted `targetKeys` signal (append in `data` order for source→target so the target appends predictably; remove for target→source); (4) `this.sourceChecked.set([])` (clear **that** panel's ephemeral set); (5) `this.onChange(this.targetKeys())`, `this.valueChange.emit(...)`, `this.moved.emit({ keys, direction })`; (6) `LiveAnnouncer.announce(...)`. **Select-all only mutates the ephemeral checked layer** — it never touches `targetKeys`; a move still requires the directional click.
- **Precompute row view-models — no function calls in the template** (house rule; see `tags-input.chipViews`). Derive, per panel, a `computed()` of `{ item, key, label, checked, disabled }[]` over the **filtered** list (filter via `behavior.filterFn` or the default case-insensitive `labelFn` substring match; the source list = `data` items whose key ∉ `targetKeys`, in `data` order; the target list = items whose key ∈ `targetKeys`, in **`targetKeys` order**). `@for` over these view-models with `track vm.key`, bind `[cdkOption]="vm.key"`, `[cdkOptionDisabled]="vm.disabled"`, `[cdkOptionTypeaheadLabel]="vm.label"`, and feed the **same** shape into the `*twTransferItem` context. `checked` on the view-model is `panelChecked().includes(key)` (per the ephemeral set) for the default glyph and the projected context.
- **Filtered-out options must be removed from the DOM** (the `@for` is over the *filtered* list) — never visually hidden, or CdkListbox's key manager will rove onto invisible options. Select-all and directional moves operate on the **filtered, non-disabled** subset only.
- **Reconcile the ephemeral checked set down to the rendered keys whenever the filter changes.** Because `[cdkListboxValue]="sourceChecked()"` is a *controlled* binding, a checked key whose option a new search query just removed from the DOM would leave CdkListbox holding a value with no rendered option — which it flags as an invalid/recoverable selection (a dev-mode complaint). So the signal feeding `[cdkListboxValue]` must be a **`linkedSignal()`** that mirrors the panel's raw ephemeral checked set but, on each recompute, **drops any key not in the panel's currently-rendered (filtered) set**. This keeps the controlled value valid at all times; it does **not** replace the move-time `∩ filteredEnabledKeys` scoping in step (2) of the pipeline — keep both. (A reconciled-out key returns to the checked set only if the consumer re-checks it after clearing the filter; do not silently re-add hidden keys.)
- **Tri-state select-all** (per panel) is a `computed()` modelled on table's `masterSelectionState`: over the panel's *filtered, enabled* keys, `'checked'` when all are in the ephemeral checked set, `'unchecked'` when none, `'indeterminate'` otherwise. Wire it to the header `tw-checkbox`'s `[checked]` (`=== 'checked'`) and `[indeterminate]` (`=== 'indeterminate'`). Toggling select-all on sets the panel's ephemeral checked set to all filtered-enabled keys; off sets it to `[]`.
- **Resolved config.** Merge each partial input with a `*_DEFAULTS` constant via `computed()` (`TRANSFER_LABELS_DEFAULTS`, `TRANSFER_DISPLAY_DEFAULTS`, `TRANSFER_BEHAVIOR_DEFAULTS`) — copy table's pattern exactly. Derive `size` / `showSearch` / etc. from the resolved `display`, and `oneWay` / `filterFn` / `disabledItem` from the resolved `behavior`.
- **`compareKeys`** is `(a, b) => Object.is(a, b)` by default (keys are identity-comparable); expose it as a stable class field for `[cdkListboxCompareWith]`.
- Signal APIs only: `input()` / `input.required()`, `output()`, `computed()`, `signal()`, and `linkedSignal()` only where a writable-derived-from-source value is genuinely needed (the reconciled checked-set above is the canonical case). `ChangeDetectionStrategy.OnPush`. `host` object for bindings. `inject()` for DI (the sole constructor statement is the CVA `valueAccessor` assignment). Native control flow (`@if`, `@for`); no arrow functions in templates; no manual class-string concatenation. The template likely exceeds ~50 lines (two symmetric panels) — extract it to `transfer.html`.

## File structure

Secondary entry point under `projects/ngx-tw/transfer/`:

- `transfer.ts` — `TransferComponent`, `TransferItemDefDirective`, the `tv()` config, the config-object interfaces (`TwTransferLabels`, `TwTransferDisplayConfig`, `TwTransferBehaviorConfig`), `TwTransferItemContext`, `TwTransferMovedEvent`, and the `*_DEFAULTS` constants.
- `transfer.html` — the inline-extracted template (two symmetric panels + the controls column).
- `transfer.spec.ts` — Vitest (see Testing). Use a test-host component supplying `data`, `keyFn`, `labelFn`, an optional `*twTransferItem`, and a bound `FormControl`. No `fakeAsync` / `tick` — use `async/await` with `fixture.whenStable()` (and `vi.useFakeTimers()` / `vi.runAllTimers()` only where a timer needs control). Set signal inputs via `fixture.componentRef.setInput(...)`.
- `index.ts` — public API re-exports (below).
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

## Testing

Query the **DOM**, not internals. Cover:

- **Default mount** with empty `data` — both panels render their empty state; no errors.
- **Source/target split** derives from the bound value; the target panel renders in **`targetKeys` order**; per-panel counts reflect visible items.
- **Move to target:** tick source options + click → moves them to target, **clears the source checked set**, updates the value, emits `valueChange` (and `moved` with `direction: 'toTarget'`), and fires the bound `FormControl`'s change.
- **Move to source:** ← reverses; ← is **not rendered** under `behavior.oneWay`.
- **Header select-all** checks all filtered, enabled items and is **tri-state** (indeterminate when partially checked); toggling off clears the panel's checked set; select-all does **not** move items on its own.
- **Search** filters the rendered options (removed from the DOM, not hidden); select-all + move scope to the **filtered** subset; disabled items are excluded; a checked key that becomes hidden is reconciled out and does not move.
- **`behavior.disabledItem`** renders `aria-disabled` / `cdkOptionDisabled` and blocks the item from select-all and moves.
- **CVA:** `writeValue` sets the split; `setDisabledState(true)` disables and blocks moves; **orphan keys** (in the value, not in `data`) round-trip through `writeValue` (render nothing, survive a re-emit).
- **Default render vs projection:** the default row uses `labelFn`; `*twTransferItem` overrides it and receives the correct `$implicit` / `checked` / `side` context.
- **ARIA:** `role="listbox"` per panel with `aria-labelledby` → its title id; `role="option"` + `aria-selected` on rows; move buttons carry `aria-label`s.

## Public API exports

From `transfer/index.ts`:

- Values: `TransferComponent`, `TransferItemDefDirective`.
- Types: `TwTransferLabels`, `TwTransferDisplayConfig`, `TwTransferBehaviorConfig`, `TwTransferItemContext`, `TwTransferMovedEvent`.

Then register the entry point — **all four edits are required or CI silently skips the specs.** (The glob arrays are not strictly alphabetical — placement within an array is functionally irrelevant; place each `transfer` glob alongside the sibling `t*` entry-point globs.)

1. `projects/ngx-tw/src/public-api.ts` — add `export * from '@cdevhub/ngx-tw/transfer';`
2. `projects/ngx-tw/tsconfig.lib.json` — add `"transfer/**/*.ts"` to `include` (this array is roughly alphabetical; place it among the `t*` globs near `"toast/**/*.ts"` / `"tree/**/*.ts"`).
3. `projects/ngx-tw/tsconfig.spec.json` — add `"transfer/**/*.spec.ts"` to `include` (this array is chronological — append alongside the other recently-added `t*` globs such as `"tree/**/*.spec.ts"`).
4. `angular.json` — add `"../transfer/**/*.spec.ts"` to the `unit-test` target's `include` list (alongside `"../tree/**/*.spec.ts"`).

## Constraints

- Compose `@angular/cdk/listbox` (`CdkListbox` / `CdkOption`) — do not reinvent the listbox; do not touch `select`'s activedescendant overlay. One `[cdkListbox]` per panel, `[cdkListboxMultiple]="true"`, `[cdkOption]="keyFn(item)"`.
- CVA via **runtime** `ngControl.valueAccessor = this` (never static `NG_VALUE_ACCESSOR`); value = `targetKeys`; **no `model()`**. The `TW_FORM_FIELD_CONTROL` `useExisting` provider is required and is not affected by that rule.
- Per-row tick is presentational (`aria-hidden`); only the header select-all is an interactive `tw-checkbox` (outside the listbox).
- Filtered-out options removed from the DOM; ephemeral checked set reconciled down to rendered keys on filter change; select-all / move scoped to the filtered, non-disabled subset; ephemeral checked sets cleared to `[]` after every move.
- Stay inside the **form-control input-count exception** — flat inputs limited to the ARIA + Forms baseline; all other knobs go in `labels` / `display` / `behavior`.
- Signals only: `input()` / `input.required()`, `output()`, `computed()`, `signal()`, `linkedSignal()` where writable-derived-from-source is genuinely needed. `ChangeDetectionStrategy.OnPush`. `host` object for bindings. `inject()` for DI. Native control flow. No arrow functions in templates.
- Class identifiers stay bare (`TransferComponent`, `TransferItemDefDirective`) — no `Tw` prefix. Only hand-authored shared **types** carry `Tw` (`TwTransferLabels`, etc.).
- Selectors: `tw-transfer` (element), `twTransferItem` (attribute / structural).
- No `@angular/animations`, no `NgModule`, no `providedIn: 'root'`, no constructor injection (except the CVA `valueAccessor` assignment), no `@HostBinding` / `@HostListener`, no `ngClass` / `ngStyle`, no manual class-string concatenation.
- `tv()` config defines `defaultVariants` and enables `twMerge`. Semantic + surface / fg / border tokens only.
- Do all four entry-point registration edits.
