# Requirements: `tw-transfer` (dual-listbox shuttle)

> **Status:** Approved for prompt authoring (2026-06-02).
> **Source:** `docs/library-gap-audit.md` Tier 2 — _"transfer: Dual-listbox shuttle
> to move items between source/target with search + bulk move. (Ant, Angular kits)"_.
> **Architecture decisions** below were settled with the `advisor` tool and one
> user decision (value contract). They are **binding** — the implementation prompt
> and the build must honour them.

These requirements are the input to **prompt-architect**, which produces the build
prompt at `docs/prompts/tw-transfer.md`, which `/implement-component` then builds.
Use `docs/prompts/tw-tree.md` as the structural template for the prompt — transfer
shares its shape (CDK composition + config-object inputs + optional template
directive with `ngTemplateContextGuard` + 4-edit entry-point registration).

---

## 1. What it is

A **dual-listbox shuttle**: two side-by-side panels — **source** (left) and
**target** (right) — with a column of move controls between them. The user ticks
items in a panel and clicks a directional button to shuttle the ticked items to the
other side; a header "select all" tick and a per-panel search filter accelerate
bulk moves. The component's **value is the set of keys currently on the target
side** (`targetKeys`).

Canonical uses: assign roles/permissions, pick team members, build an allow-list,
move columns into/out of a report.

- Element selector `tw-transfer`, class `TransferComponent<T, K = unknown>`
  (generic over item type `T` and key type `K`).
- Secondary entry point `projects/ngx-tw/transfer/`.
- **This is a form control** (decision below). It is **not** a structural/layout
  primitive.

---

## 2. Architecture decisions (binding)

### 2.1 Compose `@angular/cdk/listbox` — one `CdkListbox` per panel

Each panel body is a `[cdkListbox]` (multi-select) containing one `[cdkOption]`
per visible item. **Do not** roll a custom listbox and **do not** copy `select`'s
buried `aria-activedescendant` overlay — `listbox` is an unshipped Tier-1 gap and
CDK already ships the primitive. `CdkListbox`/`CdkOption` give us, for free:

- `role="listbox"` + `aria-multiselectable`, `role="option"` + `aria-selected`,
- a **single tab stop per panel** with roving-tabindex arrow navigation,
- Space/Enter toggles the focused option, Home/End, typeahead
  (`cdkOptionTypeaheadLabel`),
- `[cdkListboxValue]` / `(cdkListboxValueChange)` for the checked set,
  `compareWith`, `[cdkOptionDisabled]`.

CDK refs: `node_modules/@angular/cdk/types/listbox.d.ts`
(`CdkListbox` `[cdkListbox]` exportAs `cdkListbox`; `CdkOption` `[cdkOption]`).
Import path: `@angular/cdk/listbox`.

**Option value = the item's key `K`**, not the item object — i.e.
`[cdkOption]="keyFn(item)"`. This makes each panel's `cdkListboxValue` a
`readonly K[]` and keeps `compareWith` trivial (key identity), avoiding object
reference fragility across data changes.

### 2.2 Two selection layers — name them distinctly, never conflate

| Layer | Name | Lifetime | What it is |
|---|---|---|---|
| **Membership** | `targetKeys` (the **value**) | Persisted | Which items live on the target side. Everything in `data` whose key ∉ `targetKeys` is on the source side. |
| **Checked** | per-panel `checked` (the **CdkListbox value**) | Ephemeral | The items the user has ticked in a panel, pending a bulk move. **Cleared to `[]` after every successful move.** |

The implementation prompt must use exactly this vocabulary. A move reads a panel's
ephemeral `checked` set, mutates the persisted `targetKeys`, then clears `checked`.

### 2.3 Value contract — `ControlValueAccessor`, value = `targetKeys`

**User decision: transfer is a form control.** Mirror the library's existing
array-valued controls **exactly** — `tags-input` (`projects/ngx-tw/tags-input/tags-input.ts`)
and `select` with `multiple` (`projects/ngx-tw/select/select.ts`):

- `implements ControlValueAccessor, FormFieldControl<readonly K[]>`.
- **Runtime registration only:** `inject(NgControl, { optional: true, self: true })`
  then `if (this.ngControl) this.ngControl.valueAccessor = this;` in the
  constructor. **Never** the static `NG_VALUE_ACCESSOR` provider — it circular-DIs
  against `inject(NgControl, { self: true })`, which `TW_ERROR_STATE_MATCHER`
  integration needs (see CLAUDE.md "ControlValueAccessor").
- Internal value held in a `signal<readonly K[]>([])` (NOT a `model()`).
  `writeValue` sets it; user moves update it **and** call the stored `onChange`
  **and** emit `valueChange`. **Do not combine `model()` + CVA** — that double-emits.
- Integrate `errorStateMatcher` / `_ngControlRev` exactly as `tags-input`/`select` do.
- `writeValue` must round-trip faithfully: keys present in the value but **absent
  from `data`** are preserved in the stored value (not dropped) even though they
  render nothing — so a form's value survives a `data` that lags behind.

Because it is a form control it **claims the form-control input-count exception**
(ARIA + Forms baseline ~12 inputs, canonical: checkbox). Even so, route all
behavioural/visual knobs into **config objects** (§4) — do not inflate the surface
just because the exception exists.

### 2.4 `keyFn` **and** `labelFn` — both required-in-spirit; `*twTransferItem` optional

Unlike `tree` (opaque `T` + mandatory template), transfer needs a **string per
item** in three places — the search filter, `cdkOptionTypeaheadLabel`, and the
default row render. So:

- `keyFn: (item: T) => K` — **required input**. Identity for membership, checked
  state, tracking, `compareWith`.
- `labelFn: (item: T) => string` — input, defaults to `(item) => String(item)`.
- `*twTransferItem` — **optional** template directive for rich row content. When
  absent, each row renders the default: the presentational check glyph + `labelFn`
  text. (Contrast tree, where the template is required.)

### 2.5 Per-row tick is **presentational**, not an interactive `tw-checkbox`

Inside a `cdkOption`, the option **is** the focusable unit and owns `aria-selected`.
Nesting an interactive `tw-checkbox` would create a second tab stop, duplicate the
selection ARIA, and break CdkListbox's single-tab-stop roving model. Render an
**`aria-hidden` check glyph** (a `tw-icon` or inline SVG) whose checked/unchecked
appearance is driven by the option's checked state; toggling happens by activating
the option (CdkOption handles click + Space/Enter). This is the direct analog of
the tree prompt's "selection ARIA on the row, not on the consumer's checkbox" rule.

> The **header** "select all" control is the exception: it sits **outside** the
> listbox, so it MAY be an interactive `tw-checkbox` (tri-state) — see §3.

---

## 3. Behaviour

### 3.1 Panel contents & ordering

- **Source panel** renders `data` items whose key ∉ `targetKeys`, in `data` order.
- **Target panel** renders items whose key ∈ `targetKeys`, in **`targetKeys`
  order** (so a freshly-moved item appends predictably).
- Per-panel **count** in the header reflects filtered/total visible items.

### 3.2 Moving

- **Directional buttons** (middle column): `→` moves the **source panel's checked**
  items to target; `←` moves the **target panel's checked** items to source.
  Each is disabled when that side has no checked items, when the control is
  `disabled`, or (for `←`) when `oneWay` is on.
- **Move-all**: the header select-all tick, when toggled on, checks every
  filtered + enabled item in that panel; a subsequent directional click then moves
  them. (No separate "move all" buttons — select-all + directional is the Ant idiom.)
- A move: compute the moved keys (filtered, **non-disabled** only), splice them
  across `targetKeys`, **clear that panel's `checked` to `[]`**, emit `valueChange`,
  call the CVA `onChange`, and **announce via `LiveAnnouncer`** (e.g.
  "{n} items moved to {targetTitle}"). Keep focus on the move button.

### 3.3 Search / filter (optional, per panel)

- When `display.showSearch` is on, each panel gets a labelled search `input[twInput]`
  above its list.
- Default filter: case-insensitive substring match of the query against
  `labelFn(item)`. Override via `behavior.filterFn: (item: T, query: string) => boolean`.
- **Filtered-out options must be removed from the DOM** (render `@for` over the
  *filtered* list) — never merely visually hidden, or CdkListbox's key manager will
  rove onto invisible options.
- **Select-all and directional moves operate on the filtered subset only** (Ant
  behaviour). Disabled items are always excluded from select-all and move.

### 3.4 Disabled

- Global `disabled` input (and Forms `setDisabledState`) disables the whole control:
  panels non-interactive, search + buttons disabled, `opacity-50` per the design
  system.
- Per-item disable via `behavior.disabledItem: (item: T) => boolean` → render that
  `cdkOption` with `cdkOptionDisabled`; exclude it from select-all and all moves.

### 3.5 oneWay (optional)

- `behavior.oneWay` (default `false`): when on, hide/disable the `←` button so
  items only flow source→target. Keep scope minimal — no per-item remove button
  required for v1; document it as a possible follow-up.

---

## 4. Public API (for prompt-architect to finalise)

> Counts below assume the **form-control input-count exception**. Keep
> behavioural/visual knobs inside the three config objects.

### Inputs

```typescript
/** All items across both panels. The source/target split derives from the value. Defaults to []. */
data = input<readonly T[]>([]);

/** Resolves a stable key for an item — drives membership (value), checked state, tracking, and compareWith. */
keyFn = input.required<(item: T) => K>();

/** Resolves an item's display label — used for the default row render, search filtering, and listbox typeahead. Defaults to String(item). */
labelFn = input<(item: T) => string>(/* (item) => String(item) */);

/** Per-panel text labels + aria-labels. Partial; unset keys fall back to defaults. */
labels = input<Partial<TwTransferLabels>>({});

/** Visual configuration — size, list viewport height, search/select-all visibility. Partial; falls back to defaults. */
display = input<Partial<TwTransferDisplayConfig>>({});

/** Behavioural configuration — oneWay, custom filterFn, per-item disabledItem predicate. Partial; falls back to defaults. */
behavior = input<Partial<TwTransferBehaviorConfig>>({});

/** Disables the entire control. Also driven by Forms setDisabledState. Defaults to false. */
disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
```

Plus the **form-control ARIA baseline** mirrored from `checkbox`/`tags-input`:
`name`, `id` (alias), `aria-label`, `aria-labelledby`, `aria-describedby`,
`required` (alias), `errorStateMatcher`.

### Config object types (Tw-prefixed; export from `index.ts`)

```typescript
/** i18n strings for the transfer. All optional; sensible English defaults. */
export interface TwTransferLabels {
  sourceTitle: string;          // default 'Source'
  targetTitle: string;          // default 'Target'
  searchPlaceholder: string;    // default 'Search'
  emptyText: string;            // default 'No items'
  selectAllLabel: string;       // aria-label for the header select-all, default 'Select all'
  moveToTargetLabel: string;    // aria-label for the → button, default 'Move selected to target'
  moveToSourceLabel: string;    // aria-label for the ← button, default 'Move selected to source'
  /** Count format, e.g. '{selected}/{total}'. */
  countFormat: string;          // default '{total} items'
}

/** Visual configuration. */
export interface TwTransferDisplayConfig {
  size?: TwSize;                // row/control density. Default 'md'.
  listHeight?: number | 'auto'; // scroll viewport height in px. Default 240.
  showSearch?: boolean;         // per-panel search inputs. Default false.
  showSelectAll?: boolean;      // header tri-state select-all. Default true.
}

/** Behavioural configuration. */
export interface TwTransferBehaviorConfig {
  oneWay?: boolean;             // source→target only. Default false.
  filterFn?: (item: T, query: string) => boolean; // custom search predicate.
  disabledItem?: (item: T) => boolean;            // per-item disable predicate.
}
```

### Outputs

```typescript
/** Fires when items move between panels by user interaction. Payload is the new full target-keys array. Does not fire on writeValue. */
valueChange = output<readonly K[]>();
```

(prompt-architect MAY additionally include a richer `moved` event
`{ keys; direction: 'toTarget' | 'toSource' }` if it does not bloat the surface;
the primary contract is `valueChange` = new target keys, mirroring `tags-input`.)

### Public methods

```typescript
/** Moves the given items (by key) to the target side; ignores keys already there or whose item is disabled. */
moveToTarget(keys: readonly K[]): void;

/** Moves the given items (by key) to the source side; no-op in oneWay mode. */
moveToSource(keys: readonly K[]): void;
```

### `*twTransferItem` context

```typescript
/** Context surfaced to a `*twTransferItem` template. */
export interface TwTransferItemContext<T> {
  $implicit: T;                       // the item (let-item)
  label: string;                      // resolved labelFn(item)
  checked: boolean;                   // ephemeral pending-move checked state
  disabled: boolean;                  // item disabled
  side: 'source' | 'target';          // which panel it renders in
}
```

`TransferItemDefDirective` (`[twTransferItem]`): pure `TemplateRef` carrier with a
static `ngTemplateContextGuard` returning `TwTransferItemContext<T>` — copy the
shape from `TreeNodeDefDirective` / table's cell-def.

---

## 5. Styling (`tv()` + `twMerge: true`, with `defaultVariants`)

Slots (illustrative — prompt-architect finalises):
`root` (grid: panel · controls · panel), `panel`, `panelHeader`, `panelTitle`,
`panelCount`, `selectAll`, `search`, `list` (the `cdkListbox` scroll viewport),
`option` (the `cdkOption` row), `optionCheck` (glyph), `optionLabel`, `controls`
(middle button column), `empty`.

- `size` variant drives row/control density per the Visual Design System ramps.
- Selected/checked option styling via a `checked` variant (e.g.
  `bg-primary-50 text-primary-700`), keyed off the option's checked state.
- Canonical **focus-visible** ring on options/buttons; menu-item-style background
  shift is **not** licensed here (options are focus-managed, not activedescendant).
- Semantic + surface/fg/border tokens only. No raw palette colors. No component CSS.
- All class strings literal so Tailwind v4 JIT sees them.

Move buttons compose the existing `[twButton]` directive (ghost/outline, icon-only,
square-interactive sizing per the design system). Search composes `input[twInput]`.
The header select-all composes `tw-checkbox` (interactive — it's outside the listbox).

---

## 6. Accessibility (must pass AXE, WCAG AA)

- Each panel is a **labelled listbox**: associate `cdkListbox` with its panel title
  via `aria-labelledby` (title element id) so AT announces "Source, listbox".
- Roving tabindex + arrow/Home/End/typeahead come from CdkListbox — **do not** add
  keyboard handlers on the host or options.
- Move buttons carry `aria-label`s from `labels`; disabled state via `disabled`
  attr (+ `aria-disabled` semantics already handled by `[twButton]`).
- `LiveAnnouncer` announces each move's result politely.
- The control surfaces error/required state through `FormFieldControl` like other
  form controls (so a wrapping `tw-form-field` shows messages).
- Every interactive element shows the canonical `focus-visible` outline ring.

---

## 7. File structure & entry-point registration

Secondary entry point `projects/ngx-tw/transfer/`:

- `transfer.ts` — `TransferComponent`, `TransferItemDefDirective`, the `tv()`
  config, the config-object interfaces, `TwTransferItemContext`, and the
  `*_DEFAULTS` constants.
- `transfer.spec.ts` — Vitest (see §8).
- `index.ts` — re-export values (`TransferComponent`, `TransferItemDefDirective`)
  and types (`TwTransferLabels`, `TwTransferDisplayConfig`,
  `TwTransferBehaviorConfig`, `TwTransferItemContext`).
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

**All four registration edits are required or CI silently skips the specs:**

1. `projects/ngx-tw/src/public-api.ts` — `export * from '@cdevhub/ngx-tw/transfer';`
2. `projects/ngx-tw/tsconfig.lib.json` — add `"transfer/**/*.ts"` to `include`
   (alphabetical: after `"toast/**/*.ts"` / before `"tree/**/*.ts"`).
3. `projects/ngx-tw/tsconfig.spec.json` — add `"transfer/**/*.spec.ts"` to `include`
   (this file's globs are `*.spec.ts`, unlike `tsconfig.lib.json`'s `*.ts`).
4. `angular.json` — add `"../transfer/**/*.spec.ts"` to the `unit-test` target's
   `include` list.

---

## 8. Testing (Vitest; see CLAUDE.md test rules)

Use a test-host that supplies `data`, `keyFn`, `labelFn`, optional
`*twTransferItem`, and binds a `FormControl`. No `fakeAsync`/`tick`; use
`async/await` + `fixture.whenStable()` (and `vi.useFakeTimers()`/`vi.runAllTimers()`
only where a timer needs control). Set inputs via `fixture.componentRef.setInput`.
Cover, querying the **DOM** (not internals):

- Default mount with empty `data` (renders both empty panels, no errors).
- Source/target split derives from the bound value; target order follows `targetKeys`.
- Ticking source options + clicking `→` moves them to target, **clears checked**,
  updates the value, emits `valueChange`, fires the FormControl change.
- `←` reverse move; `←` is suppressed under `behavior.oneWay`.
- Header select-all → checks all filtered enabled items; is **tri-state**
  (indeterminate when partial).
- Search filters the rendered options (removed from DOM); select-all + move scope to
  the filtered subset; disabled items excluded.
- `behavior.disabledItem` renders `aria-disabled`/`cdkOptionDisabled` and blocks moves.
- CVA: `writeValue` sets the split; `setDisabledState(true)` disables and blocks
  moves; orphan keys (in value, not in `data`) round-trip through `writeValue`.
- Default row render uses `labelFn`; `*twTransferItem` overrides it and receives the
  correct `$implicit` / `checked` / `side` context.
- ARIA: `role="listbox"` per panel with `aria-labelledby`, `role="option"` +
  `aria-selected` on rows, move buttons have `aria-label`s.

---

## 9. Constraints (carry into the prompt verbatim)

- Compose `@angular/cdk/listbox` (`CdkListbox`/`CdkOption`) — do not reinvent the
  listbox; do not touch `select`'s activedescendant overlay.
- CVA via **runtime** `ngControl.valueAccessor = this` (never static
  `NG_VALUE_ACCESSOR`); value = `targetKeys`; **no `model()`**.
- Per-row tick is presentational (`aria-hidden`); only the header select-all is an
  interactive `tw-checkbox`.
- Filtered-out options removed from the DOM; select-all/move scoped to filtered,
  non-disabled subset.
- Signals only: `input()`/`input.required()`, `output()`, `computed()`,
  `linkedSignal()` where writable-derived-from-source is genuinely needed.
  `ChangeDetectionStrategy.OnPush`. `host` object for bindings. `inject()` for DI.
  Native control flow. No arrow functions in templates.
- Class identifiers stay bare (`TransferComponent`, `TransferItemDefDirective`) —
  no `Tw` prefix; only shared **types** carry `Tw`.
- No `@angular/animations`, no `NgModule`, no `providedIn: 'root'`, no constructor
  injection (except the CVA `valueAccessor` assignment), no `@HostBinding`/
  `@HostListener`, no `ngClass`/`ngStyle`, no manual class-string concatenation.
- `tv()` defines `defaultVariants` and enables `twMerge`. Semantic + surface/fg/
  border tokens only.
- Do all four entry-point registration edits.
