# Prompt: Build `tw-combobox` for ngx-tw

> Source of truth: [`docs/requirements/combobox.requirements.md`](../requirements/combobox.requirements.md). This prompt is the implementation runlist — it references requirements sections by number rather than restating them. Read the requirements doc end-to-end before opening any code file.

---

## Context

Before writing code, read:

- `.claude/CLAUDE.md` — conventions, semantic tokens, focus-ring carve-outs, animation rules.
- `docs/requirements/combobox.requirements.md` — **all 14 sections**.
- `projects/ngx-tw/select/select.ts` + `select-overlay.ts` + `select.spec.ts` — closest structural peer (overlay attach/detach, `FormFieldControl`, `compareWith`, accessor inputs, grouped options).
- `projects/ngx-tw/command-palette/command-palette.ts` — closest behavioural peer (typeahead, `aria-activedescendant`, `LiveAnnouncer`, IME composition gate, debounced query).
- `projects/ngx-tw/input/input.ts` — visual surface to match (border, hover, focus ring, naked variant inside `tw-form-field`).
- `projects/ngx-tw/form-field/` — `FormFieldControl` contract, `TW_FORM_FIELD_CONTROL`, `setDescribedByIds` / `setLabelledByIds`, `TW_ERROR_STATE_MATCHER`.
- `projects/ngx-tw/core/index.ts` — `TwSize`, `TwColor`.
- `projects/ngx-tw/theme/default.css` — confirm `scale-in` / `fade-in` / `scale-out` / `fade-out` keyframes exist (they do; reused from select/menu).

CDK modules required: `@angular/cdk/overlay`, `@angular/cdk/a11y` (`FocusMonitor`, `LiveAnnouncer`), `@angular/cdk/keycodes`, `@angular/cdk/platform`, `@angular/cdk/portal`.

---

## What to build

A single-select **editable typeahead form control** following WAI-ARIA 1.2 combobox + listbox with `aria-activedescendant`. The trigger is an `<input>`. The user can type free text, filter suggestions, and either pick an option or commit the typed string. Local datasets filter via `filterFn`; async datasets disable client filtering (`filterFn={null}`) and let the parent drive `options` from a debounced `queryChange`.

Scope decisions already locked (do not revisit): single-select only; `value: T | string | null`; free text by default, opt-in `strict`; standalone entry point `ngx-tw/combobox`; reuse only `TwSize` and `TwColor` from `ngx-tw/core`; `writeValue` accepts values verbatim; Enter falls through to form submit when popover is closed or no active option.

---

## File layout

Create under `projects/ngx-tw/combobox/`:

| File | Role |
|---|---|
| `combobox.ts` | `ComboboxComponent<T>`, slot directives (`*twComboboxOption`, `*twComboboxEmpty`, `*twComboboxLoading`, `[twComboboxPrefix]`, `[twComboboxSuffix]`), `tv()` config. |
| `combobox-overlay.ts` | Internal panel component rendered into the CDK overlay (listbox markup, group headers, option rows, loading/empty slots). Mirrors `select-overlay.ts`. |
| `combobox-overlay.html` | Template for the overlay panel if it exceeds ~50 lines (otherwise inline). |
| `types.ts` | `TwComboboxOption<T>`, `TwComboboxOptionContext<T>`, `TwComboboxValueCommitEvent<T>`, `TwComboboxOptionSelectedEvent<T>`, `TwComboboxOpenedEvent`, `TwComboboxValueSource` (`'option' \| 'free-text' \| 'reset' \| 'programmatic'`). |
| `index.ts` | Re-exports the component, slot directives, and public types. |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |
| `combobox.spec.ts` | Vitest suite — see Test plan. |

Also: add `export * from 'ngx-tw/combobox';` (or re-export the entry point) in `projects/ngx-tw/public-api.ts`.

---

## Public API checklist

All inputs are listed exhaustively in requirements §3 with defaults and one-line JSDoc. Copy them verbatim. Per the codified **overlay exception** the input count cap does not apply.

**Inputs (must all exist, with JSDoc):**

- [ ] `options` — `readonly unknown[]`, default `[]`
- [ ] `optionLabel` — accessor, default reads `.label`
- [ ] `optionValue` — accessor, default reads `.value`
- [ ] `optionDisabled` — accessor, default reads `.disabled`
- [ ] `optionGroup` — accessor, default reads `.group`
- [ ] `filterFn` — `((option, query) => boolean) | null`, default startsWith matcher; `null` disables client filtering
- [ ] `strict` — `boolean`, default `false`
- [ ] `placeholder` — `string | undefined`, default `undefined`
- [ ] `disabledInput` (alias `disabled`) — `boolean`, default `false`
- [ ] `requiredInput` (alias `required`) — `boolean`, default `false`
- [ ] `size` — `TwSize`, default `'md'`
- [ ] `color` — `TwColor`, default `'primary'`
- [ ] `showChevron` — `boolean`, default `true`
- [ ] `clearable` — `boolean`, default `true`
- [ ] `loading` — `boolean`, default `false`
- [ ] `queryDebounce` — `number`, default `150`
- [ ] `minQueryLength` — `number`, default `0`
- [ ] `openOnFocus` — `boolean`, default `true`
- [ ] `panelMaxHeight` — `number`, default `256`
- [ ] `panelWidth` — `'trigger' | 'auto' | number | string`, default `'trigger'`
- [ ] `panelClass` — `string | readonly string[]`, default `''`
- [ ] `scrollStrategy` — `'reposition' | 'close' | 'block'`, default `'reposition'`
- [ ] `offset` — `number`, default `4`
- [ ] `emptyMessage` — `string`, default `'No results'`
- [ ] `compareWith` — `(a, b) => boolean`, default `Object.is`
- [ ] `ariaLabel` / `ariaLabelledby` / `ariaDescribedby` (aliases `aria-label` / `aria-labelledby` / `aria-describedby`)

**Models:**

- [ ] `value = model<T | string | null>(null)`
- [ ] `inputValue = model<string>('')`
- [ ] `open = model<boolean>(false)`

**Outputs:**

- [ ] `queryChange = output<string>()` — debounced per `queryDebounce`
- [ ] `optionSelected = output<TwComboboxOptionSelectedEvent<T>>()` — payload `{ option, value, label }`
- [ ] `valueCommit = output<TwComboboxValueCommitEvent<T>>()` — payload `{ value, source }`
- [ ] `openedChange = output<TwComboboxOpenedEvent>()` — payload `{ open, trigger }`

Every `input()` / `model()` / `output()` carries the one-line JSDoc shown in requirements §3.

---

## Slot directive plan

Five projection slots. Each is a standalone directive in `combobox.ts`.

| Selector | Kind | TemplateRef context |
|---|---|---|
| `*twComboboxOption` | Structural | `TwComboboxOptionContext<T>` = `{ $implicit: O, option: O, label: string, value: T, selected: boolean, active: boolean, disabled: boolean, index: number }` |
| `*twComboboxEmpty` | Structural | `{ $implicit: string }` — current query string |
| `*twComboboxLoading` | Structural | `{}` |
| `[twComboboxPrefix]` | Attribute | n/a (content projected via `<ng-content select="[twComboboxPrefix]">`) |
| `[twComboboxSuffix]` | Attribute | n/a |

Queried via `contentChild(SlotDirective)`. Fallbacks per requirements §10–§11.

---

## ARIA wiring

Exact attributes on the input (per requirements §5):

```html
<input
  #trigger
  role="combobox"
  type="text"
  aria-autocomplete="list"
  aria-haspopup="listbox"
  [attr.aria-expanded]="open()"
  [attr.aria-controls]="open() ? listboxId : null"
  [attr.aria-activedescendant]="open() ? activeOptionId() : null"
  [attr.aria-required]="requiredInput() ? 'true' : null"
  [attr.aria-invalid]="errorState() ? 'true' : null"
  [attr.aria-label]="ariaLabel() ?? null"
  [attr.aria-labelledby]="resolvedLabelledBy() || null"
  [attr.aria-describedby]="resolvedDescribedBy() || null"
  [attr.aria-disabled]="isDisabled() ? 'true' : null"
  [disabled]="isDisabled()"
  [placeholder]="placeholder() ?? null"
  (input)="onInput($event)"
  (keydown)="onKeydown($event)"
  (compositionstart)="composing.set(true)"
  (compositionend)="onCompositionEnd($event)"
  (focus)="onFocus()"
  (blur)="onBlur()"
/>
```

Listbox markup (inside the overlay panel):

```html
<ul [id]="listboxId" role="listbox" [attr.aria-labelledby]="resolvedLabelledBy() || null" aria-multiselectable="false">
  <!-- groups -->
  <li role="group" [attr.aria-labelledby]="groupHeaderId">
    <div [id]="groupHeaderId" class="...">{{ groupLabel }}</div>
    <!-- options -->
    <li role="option"
        [id]="optionId(i)"
        [attr.aria-selected]="isSelected(opt)"
        [attr.aria-disabled]="optionDisabled()(opt) ? 'true' : null"
        (mousedown)="onOptionMousedown($event, opt)"
        (click)="onOptionClick(opt)">…</li>
  </li>
</ul>
```

`mousedown` calls `preventDefault()` on options so the input never loses focus (clear-button focus target rule, §12 #7).

**LiveAnnouncer** (`polite`, debounced 200ms):
- Open: `"<N> suggestions available"`.
- Query change: `"<N> results"` / `"1 result"` / `"No results for <query>"`.
- Selection: `"<label> selected"`.

`listboxId`, `optionId(i)`, `groupHeaderId` come from `inject(_IdGenerator)` (or a local counter — match select's approach).

---

## `tv()` variant plan

Single `tv()` config in `combobox.ts`, `twMerge: true`, slot-based:

```ts
const combobox = tv({
  slots: {
    root: 'relative inline-flex w-full',
    trigger: 'flex w-full items-center gap-1.5 rounded-md border border-border bg-surface text-fg transition-colors duration-200 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2',
    input: 'flex-1 min-w-0 bg-transparent outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed',
    clearButton: 'size-5 rounded-md text-fg-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2',
    chevron: 'shrink-0 text-fg-muted transition-transform duration-200',
    spinner: 'shrink-0 text-fg-muted',
    popover: 'bg-surface-overlay border border-border rounded-md shadow-md overflow-hidden',
    listbox: 'overflow-y-auto py-1',
    option: 'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-surface-muted aria-disabled:opacity-50 aria-disabled:pointer-events-none',
    optionLabel: 'flex-1 min-w-0 truncate',
    optionDescription: 'text-xs text-fg-muted truncate',
    groupHeader: 'px-3 py-1 text-2xs uppercase tracking-wide text-fg-subtle',
    empty: 'px-4 py-10 text-center text-sm text-fg-muted',
    loading: 'flex items-center justify-center gap-2 px-4 py-6 text-sm text-fg-muted',
  },
  variants: {
    size: {
      xs: { trigger: 'px-2 py-1 text-xs', chevron: 'size-3.5', clearButton: 'size-4' },
      sm: { trigger: 'px-3 py-1.5 text-sm', chevron: 'size-4' },
      md: { trigger: 'px-4 py-2 text-sm', chevron: 'size-4' },
      lg: { trigger: 'px-5 py-2.5 text-base', chevron: 'size-5' },
      xl: { trigger: 'px-6 py-3 text-base', chevron: 'size-5' },
    },
    color: {
      primary: { trigger: 'focus-visible:outline-primary-500' },
      secondary: { trigger: 'focus-visible:outline-secondary-500' },
      accent: { trigger: 'focus-visible:outline-accent-500' },
      neutral: { trigger: 'focus-visible:outline-neutral-500' },
      info: { trigger: 'focus-visible:outline-info-500' },
      success: { trigger: 'focus-visible:outline-success-500' },
      warning: { trigger: 'focus-visible:outline-warning-500' },
      error: { trigger: 'focus-visible:outline-error-500' },
    },
    disabled: {
      true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
      false: {},
    },
    open: {
      true: { chevron: 'rotate-180' },
      false: {},
    },
    naked: {
      true: { trigger: 'border-0 bg-transparent px-0 hover:border-0 focus-visible:outline-0' },
      false: {},
    },
  },
  defaultVariants: { size: 'md', color: 'primary', disabled: false, open: false, naked: false },
});
```

Compound variants only if a `naked` + `size` combination needs extra carve-outs (likely not). `naked` auto-resolves when the host detects `inject(FormFieldComponent, { optional: true })` is non-null — same trick as select.

---

## Keyboard handling

Implement in `onKeydown(event: KeyboardEvent)`. Gate everything with `if (composing()) return;`.

| Key | Behavior |
|---|---|
| `ArrowDown` | `preventDefault`. Open if closed (active → first enabled). Else move active to next enabled (wraps). |
| `ArrowUp` | `preventDefault`. Open if closed (active → last enabled). Else move active to previous enabled (wraps). |
| `Home` | If input is empty OR `Alt` held: move active to first enabled and `preventDefault`. Else native cursor behavior. |
| `End` | Symmetric. |
| `Enter` | If popover open AND active option exists: commit option, close, `optionSelected.emit`, **`event.preventDefault()` + `event.stopPropagation()`** so form `submit` does not fire. Otherwise: **do nothing** — let Enter bubble (form submit fallthrough, §12 #10). Free-text commit on Enter happens through blur, not Enter itself, except when popover is closed and the input has changed since last commit — see resolver below. |
| `Escape` | If open: close, restore `inputValue` to last committed label, `preventDefault` + `stopPropagation`. Else if `clearable()` and input non-empty: clear. |
| `Tab` | Close + commit (no `preventDefault`). |
| `Alt+ArrowDown` | Force open without moving active. |
| `Alt+ArrowUp` | Force close. |
| Typing (`input` event) | Update `inputValue` model, open popover (if not blocked by `minQueryLength`), reset active to first enabled match, schedule debounced `queryChange.emit`. |
| `Backspace` on empty input | No-op. Do **not** close popover. |

IME: `compositionstart` sets `composing = true`; `compositionend` sets `composing = false` and runs the deferred input handler once.

---

## Free-text emit logic

Pseudocode resolver invoked from `commit(source: 'enter' | 'blur' | 'tab')`:

```ts
function commit(source) {
  if (isDisabled() || composing()) return;

  const text = inputValue().trim();
  const active = activeOption();  // currently highlighted option, if any

  // 1. Active option wins.
  if (active && !optionDisabled()(active)) {
    return commitOption(active, 'option');
  }

  // 2. Exact label match (case-sensitive, after trim) auto-resolves.
  const exact = options().find(o => !optionDisabled()(o) && optionLabel()(o).trim() === text);
  if (exact) return commitOption(exact, 'option');

  // 3. Empty text → null.
  if (text === '') {
    value.set(null);
    inputValue.set('');
    valueCommit.emit({ value: null, source: 'reset' });
    closePopover();
    return;
  }

  // 4. No match.
  if (strict()) {
    // Revert to last committed.
    inputValue.set(lastCommittedLabel());
    if (source === 'enter') return; // keep popover open if partial matches; else close.
    closePopover();
    return;
  }
  value.set(text);
  valueCommit.emit({ value: text, source: 'free-text' });
  closePopover();
}

function commitOption(option, source) {
  const v = optionValue()(option);
  const label = optionLabel()(option);
  value.set(v);
  inputValue.set(label);
  optionSelected.emit({ option, value: v, label });
  valueCommit.emit({ value: v, source });
  closePopover();
}
```

`lastCommittedLabel()` is a `signal<string>` updated on every successful commit and on `writeValue` resolution.

---

## ControlValueAccessor wiring

```ts
implements ControlValueAccessor, FormFieldControl<T | string | null>

writeValue(value: T | string | null): void
registerOnChange(fn: (value: T | string | null) => void): void
registerOnTouched(fn: () => void): void
setDisabledState(isDisabled: boolean): void
```

- `writeValue(value)`:
  - `value == null` → `value.set(null)`, `inputValue.set('')`, `lastCommittedLabel.set('')`.
  - Otherwise: store verbatim into `value`. Run reconciler against `options()` using `compareWith()`. If a match is found, set `inputValue` to its label; otherwise set `inputValue = String(value)` (string passthrough). Emit `valueCommit` with `source: 'programmatic'`. Do **not** call the registered `onChange`.
- An `effect` watches `options()` — on first non-empty change after a `writeValue` that didn't resolve, re-run reconciler and update `inputValue` if a match now exists.
- `registerOnChange(fn)` stores `onChange`. Wire to a `valueCommit` source filter: invoke `onChange(value())` whenever the source is `'option' | 'free-text' | 'reset'` (not `'programmatic'`).
- `registerOnTouched(fn)` stores `onTouched`. Fire via `FocusMonitor.monitor(trigger).subscribe(origin => { if (origin === null) onTouched(); })`.
- `setDisabledState(isDisabled)` → `cvaDisabled.set(isDisabled)`. `isDisabled = computed(() => disabledInput() || cvaDisabled())`. When `true`, close the popover.

Provider block on the component:

```ts
providers: [
  { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ComboboxComponent), multi: true },
  { provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => ComboboxComponent) },
],
```

---

## Form-field integration

Implement `FormFieldControl<T | string | null>` (signals: `id`, `focused`, `empty`, `disabled`, `required`, `errorState`, plus `controlType = 'combobox'`, `setDescribedByIds`, `setLabelledByIds`, `onContainerClick`). Mirror `select.ts` exactly.

- `id` — auto-generated, exposed for `for=` on the form-field label.
- `empty = computed(() => inputValue().length === 0 && value() == null)`.
- `errorState` — injected `TW_ERROR_STATE_MATCHER` × parent `NgControl`. Drives `aria-invalid` and ring color override (`focus-visible:outline-error-500`) when truthy.
- `resolvedLabelledBy = computed(() => [ariaLabelledby(), ...formFieldLabelledByIds()].filter(Boolean).join(' '))`.
- `resolvedDescribedBy = computed(() => [ariaDescribedby(), ...formFieldDescribedByIds()].filter(Boolean).join(' '))`.
- `onContainerClick()` calls `trigger.focus()`.
- When `inject(FormFieldComponent, { optional: true })` is non-null, the `naked` variant flips on.

---

## Implementation notes

- `signal<HTMLInputElement | null>` via `viewChild('trigger')` for the input.
- `visibleOptions = computed(() => filterFn() === null ? options() : options().filter(o => filterFn()!(o, inputValue())))`. Group flattening happens in a downstream `computed` that produces rendered rows (option / group-header).
- `activeIndex = linkedSignal({ source: visibleOptions, computation: () => firstEnabledIndex() })`. Reset whenever the visible list changes.
- `activeOption = computed(() => visibleOptions()[activeIndex()] ?? null)`.
- `activeOptionId = computed(() => activeOption() ? optionId(activeIndex()) : null)`.
- `queryChange` debounce: `signal` + `effect` using a `vi`-friendly `setTimeout`/`clearTimeout` (no RxJS pipe required; if RxJS is used, route through `takeUntilDestroyed(destroyRef)`).
- Overlay: instantiate `ComponentPortal(ComboboxOverlayComponent)`, pass the host as an injection token (mirror `select-overlay.ts`). Positions per requirements §8. `panelWidth='trigger'` measures input width on attach + on `ResizeObserver`.
- Enter/leave animations applied to the overlay root with `[animate.enter]="'scale-in fade-in'"` and `[animate.leave]="'scale-out fade-out'"`. No `@angular/animations`.
- Cleanup: `inject(DestroyRef).onDestroy(() => overlayRef?.dispose())`; `FocusMonitor.stopMonitoring(trigger)`.
- Open guard: `canOpen = computed(() => !isDisabled() && inputValue().length >= minQueryLength())`.
- Clear button: `mousedown` handler calls `event.preventDefault()` then sets `value=null` + `inputValue=''` + refocuses input.

---

## Test plan (`combobox.spec.ts`)

Vitest. No `fakeAsync` / `tick`. Use `async`/`await` + `fixture.whenStable()`; for debounce use `vi.useFakeTimers()` + `vi.runAllTimers()`.

**Rendering**
- [ ] Mounts with no inputs.
- [ ] Renders each `size` (xs–xl) and each `color`.
- [ ] Chevron visible iff `showChevron=true`.
- [ ] Clear button visible iff `clearable=true` AND `inputValue !== ''`.
- [ ] Disabled state applies `opacity-50 pointer-events-none`.
- [ ] Loading spinner appears when `loading=true`.

**ARIA**
- [ ] Default state: input has `role="combobox"`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-expanded="false"`, no `aria-controls`, no `aria-activedescendant`.
- [ ] Open state: `aria-expanded="true"`, `aria-controls=<listboxId>`, listbox `role="listbox"` present in DOM.
- [ ] Each option `role="option"`, has stable `id`, `aria-selected` reflects committed value, disabled options have `aria-disabled="true"`.
- [ ] `aria-activedescendant` updates as ArrowDown/ArrowUp move the active index.
- [ ] `aria-activedescendant` clears when popover closes.
- [ ] Grouped options render `role="group"` with `aria-labelledby` resolving to header id.
- [ ] `aria-required`, `aria-invalid`, `aria-label`, `aria-labelledby`, `aria-describedby` reflect inputs and form-field state.
- [ ] AXE passes default + open + disabled states.

**Keyboard** (one test per key)
- [ ] ArrowDown opens popover when closed; advances active when open; wraps.
- [ ] ArrowUp symmetric.
- [ ] Home / End jump (gated by input-empty / Alt).
- [ ] Enter with active option commits + `stopPropagation` (verify with a spy on a parent form `submit` listener).
- [ ] Enter with no active option does NOT call `preventDefault` (form submit propagates).
- [ ] Escape closes + restores last committed label.
- [ ] Tab closes + commits, focus leaves naturally.
- [ ] Alt+ArrowDown / Alt+ArrowUp force-open / force-close.
- [ ] Backspace on empty input does not close.
- [ ] Typing while `compositionstart`/`compositionend` is mid-flight does NOT move active index; resumes after `compositionend`.

**Free-text resolver** (all four scenarios in requirements §6)
- [ ] Click / Enter on active option → `optionSelected` + `valueCommit('option')`, `value` is option's value.
- [ ] Exact label match auto-resolves → `optionSelected` + `valueCommit('option')`.
- [ ] No match + free-text mode → `valueCommit('free-text')`, `value` is the string.
- [ ] No match + strict mode → no `valueCommit`, `inputValue` reverts to last committed label.

**Outputs**
- [ ] `queryChange` debounced by `queryDebounce` (use `vi.useFakeTimers`).
- [ ] `queryChange` suppressed during IME composition; fires once after `compositionend`.
- [ ] `valueCommit` source values are correct across all paths (`option`, `free-text`, `reset`, `programmatic`).
- [ ] `openedChange` fires with `{ open, trigger }`.

**Clear button**
- [ ] Clicking clear keeps DOM focus on the input.
- [ ] Clear sets `value=null`, `inputValue=''`, emits `valueCommit('reset')`.

**Async race**
- [ ] `writeValue(x)` before options load: `value` set verbatim, `inputValue=String(x)`. After `options` is populated with a matching record, `inputValue` updates to the resolved label without firing `optionSelected`.

**ControlValueAccessor + forms**
- [ ] `writeValue(null)` clears.
- [ ] `writeValue(matchingValue)` resolves to label.
- [ ] User commit calls registered `onChange`.
- [ ] `writeValue` does NOT call `onChange`.
- [ ] Blur calls `onTouched` (via FocusMonitor; mock the monitor or trigger blur on the element).
- [ ] `setDisabledState(true)` blocks interaction and closes any open popover.
- [ ] Reactive forms: bind via `[formControl]`, set value, assert DOM.
- [ ] Template-driven: `[(ngModel)]` round-trips.
- [ ] Signal forms: `[(value)]` round-trips.

**Form-field integration**
- [ ] Inside `tw-form-field`, trigger uses naked variant (no border, no ring).
- [ ] `setDescribedByIds` and `setLabelledByIds` merge with consumer-provided `aria-*` correctly.
- [ ] `onContainerClick` focuses input.
- [ ] `errorState=true` flips `aria-invalid` and the ring color.

**Slot fallbacks**
- [ ] `*twComboboxEmpty` not projected → `emptyMessage()` text renders.
- [ ] `*twComboboxLoading` not projected → spinner + "Loading…" renders.
- [ ] `*twComboboxOption` not projected → default row (label + optional description) renders.
- [ ] Projected templates replace fallbacks and receive correct context (`selected`, `active`, `disabled`, `index`, `query` for empty).

**LiveAnnouncer** — spy via `vi.spyOn(announcer, 'announce')`; assert messages on open, on debounced query, on selection.

---

## Demo page scope

Author under `projects/demo/src/app/routes/combobox/` (separate task). The demo must cover:

- [ ] Basic local picker (country list, default filter).
- [ ] Async server search (`filterFn={null}` + `(queryChange)` → mocked HTTP, sets `[options]`).
- [ ] Grouped options.
- [ ] Strict mode (rejects free text on blur).
- [ ] Custom option template (`*twComboboxOption` with icon + description).
- [ ] Free-text creation (commit arbitrary tag).
- [ ] Inside reactive form (`[formControl]`, validators, error state).
- [ ] Inside template-driven form (`[(ngModel)]`).
- [ ] Disabled state.
- [ ] Sizes / colors gallery.

---

## Out of scope (do not implement)

- Multi-select / chip rendering.
- "Create new" UX beyond bare free-text commit.
- Async pagination / infinite scroll inside the popover.
- `cdk-virtual-scroll-viewport` integration.
- Tag-input variant.
- Inline editable-cell variant.
- Built-in HTTP wiring or debounce beyond the single `queryDebounce` input.

---

## Constraints (from CLAUDE.md — non-negotiable)

- Selector prefix `tw-`; class name `ComboboxComponent` (no `Tw` prefix on the class).
- Standalone — do not set `standalone: true`.
- `ChangeDetection.OnPush`, `host` object for host bindings, `inject()` for DI, native control flow.
- Signal API exclusively; `linkedSignal()` only for writable-derived state (active index), `computed()` everywhere else.
- Semantic color tokens only (`primary-*`, `error-*`, `surface-*`, `fg-*`, `border-*`). No raw palette colors. No raw `neutral-*` for structural styling.
- Visual tokens drawn from CLAUDE.md "Visual Design System" — radius, spacing, gaps, typography, shadows, transitions, focus rings, icon sizing.
- Activedescendant-listbox carve-out applies to option rows (background-shift indicator); input itself uses canonical outline focus ring.
- `animate.enter` / `animate.leave` only — no `@angular/animations`.
- Vitest, no `fakeAsync` / `tick`.
- All `input()` / `output()` / `model()` carry one-line JSDoc.
