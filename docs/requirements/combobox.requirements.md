# `tw-combobox` — Requirements

Status: draft for implementation.
Entry point: `ngx-tw/combobox` (standalone; no source-level sharing with `tw-select`).
Shared types reused from `ngx-tw/core`: `TwSize`, `TwColor`.

---

## 1. Purpose & non-goals

`tw-combobox` is an **editable, single-select typeahead form control**. The user types into a text field; suggestions appear in a popover; the user may either pick a suggestion or commit their typed text as-is. Modelled on the ARIA 1.2 combobox pattern with listbox popup and `aria-activedescendant` (DOM focus stays on the input).

**Is:**
- An editable text input that exposes suggestions.
- A standalone form control implementing `ControlValueAccessor` and `FormFieldControl`.
- A drop-in for both local datasets and consumer-driven async result streams.

**Is not:**
- Multi-select (single value only — see Out of scope).
- A `tw-command-palette` (that is a fire-and-dismiss modal launcher).
- A tag/chip input (no on-the-fly option creation, no chip rendering).
- A non-editable `tw-select` (the trigger is an `<input>`, not a button).

---

## 2. Use cases

1. **Local country picker** — consumer passes ~250 country options. Component filters client-side by `startsWith` on the label. User picks one with arrow keys + Enter.
2. **Server-driven user search** — consumer subscribes to `queryChange`, debounces, fetches matching users, updates the `options` input. Component renders whatever the consumer feeds in; built-in filter is bypassed via `filterFn: null`.
3. **Free-form tag entry with suggestions** — `strict={false}` (default). User types a new tag; pressing Enter or blurring commits the typed string. Suggestions are convenience only.
4. **Strict picker inside a form** — `strict={true}`. User must select an option from the list; arbitrary text yields a validation error and reverts on blur.
5. **Mixed local + remote** — small frequently-used set rendered locally, plus async results appended once the query exceeds N chars. Consumer drives `options` via their own logic; component is unopinionated.

---

## 3. Public API

This is an overlay-bearing component, so input count exceeds the 5–6 cap under the codified overlay exception (per CLAUDE.md "Input count cap"). Total inputs: **~22**.

### Generic parameter

`ComboboxComponent<T = unknown>` — `T` is the type of `optionValue`.

### Inputs

```ts
/** Array of options to render in the popover. Plain objects or `TwComboboxOption<T>`. Default: `[]`. */
options = input<readonly unknown[]>([]);

/** Accessor returning the visible label for an option. Used by the default filter and trigger render. Default: reads `.label`, falls back to `String(value)`. */
optionLabel = input<(option: unknown) => string>(defaultOptionLabel);

/** Accessor returning the value emitted via `valueChange` when an option is picked. Default: reads `.value`. */
optionValue = input<(option: unknown) => T>(defaultOptionValue);

/** Accessor returning whether an option is non-interactive. Default: reads `.disabled`. */
optionDisabled = input<(option: unknown) => boolean>(defaultOptionDisabled);

/** Accessor returning a group label. Options sharing a group render under a labelled `role="group"`. Default: reads `.group`. */
optionGroup = input<(option: unknown) => string | undefined>(defaultOptionGroup);

/**
 * Filter function applied to `options` whenever `inputValue` changes.
 *  - Default: case-insensitive `startsWith` match on the option label (mirrors `<datalist>`).
 *  - Pass a custom function to override.
 *  - Pass `null` to disable client filtering entirely (async mode: consumer drives the visible list).
 * Default: built-in `startsWith` matcher.
 */
filterFn = input<((option: unknown, query: string) => boolean) | null>(defaultStartsWithFilter);

/** When `true`, the committed value must correspond to an option; arbitrary text reverts on blur. Default: `false`. */
strict = input<boolean>(false);

/** Placeholder shown when the input is empty. Default: `undefined`. */
placeholder = input<string | undefined>(undefined);

/** Disables the input and prevents opening. Default: `false`. */
disabledInput = input<boolean>(false, { alias: 'disabled' });

/** Sets `aria-required="true"` on the input. Default: `false`. */
requiredInput = input<boolean>(false, { alias: 'required' });

/** Controls trigger padding and font size (per CLAUDE.md inline padding scale). Default: `'md'`. */
size = input<TwSize>('md');

/** Semantic color for focus ring and active option highlight. Default: `'primary'`. */
color = input<TwColor>('primary');

/** Whether the input shows a chevron affordance. Default: `true`. */
showChevron = input<boolean>(true);

/** Whether a clear ("×") button appears when `inputValue` is non-empty. Default: `true`. */
clearable = input<boolean>(true);

/** When `true`, displays an in-popover spinner — set this while async results are loading. Default: `false`. */
loading = input<boolean>(false);

/** Debounce (ms) applied before `queryChange` emits. Local filtering is unaffected. Default: `150`. */
queryDebounce = input<number>(150);

/** Minimum query length before the popover opens automatically. `0` opens on focus. Default: `0`. */
minQueryLength = input<number>(0);

/** Whether the popover opens automatically when the input receives focus. Default: `true`. */
openOnFocus = input<boolean>(true);

/** Maximum height of the popover scroll region (px). Default: `256`. */
panelMaxHeight = input<number>(256);

/** Overlay width strategy. `'trigger'` matches input width; `'auto'` lets content decide; number = px; string = CSS length. Default: `'trigger'`. */
panelWidth = input<'trigger' | 'auto' | number | string>('trigger');

/** Extra classes appended to the overlay panel. Default: `''`. */
panelClass = input<string | readonly string[]>('');

/** CDK overlay scroll strategy. Default: `'reposition'`. */
scrollStrategy = input<'reposition' | 'close' | 'block'>('reposition');

/** Pixel offset between input and popover. Default: `4`. */
offset = input<number>(4);

/** Fallback empty-state message when no `*twComboboxEmpty` template is projected. Default: `'No results'`. */
emptyMessage = input<string>('No results');

/** Equality comparator used to reconcile `value` with options. Default: `Object.is`. */
compareWith = input<(a: T, b: T) => boolean>(Object.is);

/** Accessible name. */
ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

/** ID of an external label element. */
ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

/** ID of an external descriptor element. */
ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });
```

### Models (two-way)

```ts
/** Committed value. In free-text mode this can be either an option value (`T`) or the typed string. In strict mode it is either an option value or `null`. Default: `null`. */
value = model<T | string | null>(null);

/** Current visible text in the input. Bound separately from `value` because in async mode the parent drives the query independently from the committed selection. Default: `''`. */
inputValue = model<string>('');

/** Open state of the popover. Default: `false`. */
open = model<boolean>(false);
```

The primary two-way binding consumers reach for is `[(value)]`. `[(inputValue)]` is the hook for async-mode parents.

### Outputs

```ts
/** Fires after the user changes the query text. Payload is the latest query string, debounced by `queryDebounce`. Async-mode consumers subscribe to this to fetch results. */
queryChange = output<string>();

/** Fires when an option is picked from the list (not when free text is committed). Payload is the option object. */
optionSelected = output<{ option: unknown; value: T; label: string }>();

/** Fires whenever `value` changes — distinguishes the source so consumers can tell selection from free-text. */
valueCommit = output<{ value: T | string | null; source: 'option' | 'free-text' | 'reset' | 'programmatic' }>();

/** Fires when the popover opens or closes. */
openedChange = output<{ open: boolean; trigger: HTMLElement }>();
```

`valueChange` (on the `value` model) emits on every value mutation; `valueCommit` is the same event with origin metadata for consumers that need it.

---

## 4. Options data model

**Recommendation:** export a typed interface `TwComboboxOption<T>` from `ngx-tw/combobox`. Consumers may pass arbitrary records and override the accessor inputs (`optionLabel`/`optionValue`/etc.). This mirrors the proven `tw-select` shape and lets consumers bring their own domain types without mapping.

```ts
export interface TwComboboxOption<T> {
  /** Visible label. Used by the default filter. */
  label: string;
  /** Value emitted via `valueChange` / `optionSelected`. */
  value: T;
  /** When true, the option is non-interactive. */
  disabled?: boolean;
  /** Optional group label. Options sharing a group render under a `role="group"`. */
  group?: string;
  /** Optional secondary description rendered under the label. */
  description?: string;
}
```

**Grouped options: yes.** Recommended because country/region/department pickers are core use cases and grouping is purely additive — consumers that don't set `group` get a flat list. Group label rendering follows `tw-select`'s pattern (sticky-free `role="group"` regions with `aria-labelledby`).

**`description` field included** because async user-search and command-launcher use cases routinely render secondary text; supporting it as a first-class option field avoids forcing every consumer into the custom `*twComboboxOption` template.

---

## 5. ARIA & keyboard

Follows the **WAI-ARIA 1.2 combobox + listbox** pattern with `aria-activedescendant` (DOM focus stays on the `<input>` at all times).

### Roles & attributes (input element)

```html
<input
  role="combobox"
  aria-autocomplete="list"
  aria-haspopup="listbox"
  aria-expanded="true|false"
  aria-controls="<listbox-id>"
  aria-activedescendant="<active-option-id> | null"
  aria-required="true|null"
  aria-invalid="true|null"
  aria-label / aria-labelledby / aria-describedby
/>
```

The popover renders `role="listbox"` with each option as `role="option"` carrying `aria-selected` and `id` referenced by `aria-activedescendant`. Grouped options render inside `role="group"` with `aria-labelledby` pointing at the group header.

### Focus ring carve-out

The input itself uses the canonical focus ring (`focus-visible:outline-2 outline-offset-2 outline-primary-500`, per CLAUDE.md "Focus Rings").

Active option highlight uses the **background-shift indicator** (`bg-surface-muted`) under the **activedescendant-listbox carve-out** in CLAUDE.md "Focus Rings → Activedescendant-listbox carve-out". This is the canonical example case: DOM focus never leaves the input, options never receive `focus()`, so the outline ring is unreachable. Must remain unambiguously distinguishable from resting state and from `hover:bg-surface-muted/50`.

### Keyboard

| Key | Behavior |
|---|---|
| `ArrowDown` | If closed: open + move active to first enabled option. If open: move active to next enabled option (wraps). |
| `ArrowUp` | If closed: open + move active to last enabled option. If open: move active to previous enabled option (wraps). |
| `Home` | When open and input value is empty (or `Alt`+`Home`): move active to first enabled option. Otherwise default text cursor behavior. |
| `End` | Symmetric to `Home`. Default cursor behavior wins when input has text and no `Alt`. |
| `Enter` | If an option is active: commit that option, close, fire `optionSelected`, `preventDefault` + `stopPropagation` so the host form does not submit. If no active option (popover closed, or open with nothing highlighted): do NOT `preventDefault` — Enter falls through to native form submit per §12 #10. Free-text commit happens on blur/Tab instead, not on Enter. |
| `Escape` | If open: close and restore the input to the last committed value. If already closed: clear (clearable mode). |
| `Tab` | Commit current state (active option if any, otherwise typed text per `strict` rules) and close. Focus moves naturally. |
| `Alt+ArrowDown` | Force-open without moving active. |
| `Alt+ArrowUp` | Force-close. |
| Typing | Updates `inputValue` + opens popover (subject to `minQueryLength`). Resets active option to the first enabled match. |
| `Backspace` on empty input | No-op (does not close popover). |

### LiveAnnouncer

Use CDK `LiveAnnouncer` (`polite`) to debounced-announce result-count changes while the user types:

- `"<N> results"` / `"1 result"` / `"No results for <query>"`
- Debounce: 200ms (matches `tw-command-palette`).
- On selection: announce `"<label> selected"`.
- On open: announce `"<N> suggestions available"`.

---

## 6. Free text & strict mode contract

`value` is `T | string | null`. The exact semantics on commit:

**Free-text mode (`strict=false`, default — mirrors HTML `<datalist>`):**

| Scenario | `value` after commit | `valueCommit.source` | `optionSelected` fires? |
|---|---|---|---|
| User clicks option / presses Enter with option active | `optionValue(option)` (type `T`) | `'option'` | yes |
| User types `"foo"` matching an option's label exactly, blurs / Tabs | `optionValue(matchedOption)` (type `T`) — exact label match auto-resolves to the option's value | `'option'` | yes |
| User types `"foo"` with no exact label match, blurs / Tabs | `"foo"` (string) | `'free-text'` | no |
| User clears via clear button | `null` | `'reset'` | no |
| Parent calls `writeValue(x)` | `x` (verbatim) | `'programmatic'` | no |

**Strict mode (`strict=true`):**

| Scenario | `value` after commit | `valueCommit.source` | `optionSelected` fires? |
|---|---|---|---|
| User picks an option | `optionValue(option)` | `'option'` | yes |
| User types `"foo"` matching label exactly, commits | `optionValue(matchedOption)` | `'option'` | yes |
| User types `"foo"` with no match and blurs | `inputValue` reverts to the last committed option's label (or `''` if none); `value` unchanged; no commit event | n/a | no |
| User types `"foo"` with no match and presses Enter | Same revert behavior; popover stays open if there are partial matches, otherwise closes | n/a | no |

**Exact-label-match resolution** uses `optionLabel(option) === inputValue` (case-sensitive equality after both trimmed). Case-insensitive resolution would surprise users who deliberately preserved casing; case-sensitive is the safer default.

---

## 7. Form integration

Implements `ControlValueAccessor` (multi-provider `NG_VALUE_ACCESSOR`) and `FormFieldControl<T | string | null>` (provider `TW_FORM_FIELD_CONTROL`). Works with template-driven, reactive, and signal forms.

### `writeValue(value)`

- If `value` is `null`/`undefined`: set `inputValue = ''`, `value = null`.
- Otherwise reconcile against `options` using `compareWith`:
  - If a matching option exists: set `inputValue = optionLabel(match)`, `value = optionValue(match)`.
  - If no match (async mode, options not yet loaded, or strict-mode error): set `value` verbatim, `inputValue = String(value)`. When options arrive later, an `effect` re-reconciles and updates `inputValue` to the resolved label.
- `valueCommit` emits with `source: 'programmatic'`.

### `setDisabledState(isDisabled)`

Toggles a `cvaDisabled` signal merged with `disabledInput` via `computed`. Disabled state blocks all interaction, closes any open popover, and applies `opacity-50 pointer-events-none cursor-not-allowed` to the host (per CLAUDE.md "Opacity & Disabled States").

### `registerOnChange` / `registerOnTouched`

`onChange` fires whenever `value` changes from user interaction (not from `writeValue`). `onTouched` fires on blur (via CDK `FocusMonitor`).

### Form field integration

- `controlType = 'combobox'`.
- Reports `id`, `focused`, `empty`, `disabled`, `required`, `errorState` as signals.
- `setDescribedByIds` and `setLabelledByIds` merge form-field-pushed ids with consumer `aria-describedby` / `aria-labelledby`.
- `onContainerClick` focuses the input (mirrors `tw-select`).

---

## 8. Overlay & positioning

- **CDK Overlay** via `Overlay.position().flexibleConnectedTo(triggerSurfaceElementRef)`.
- **Positions:** start-aligned by default with vertical flip on overflow. Position list:
  1. `{ origin: bottom-start, overlay: top-start, offsetY: +offset }`
  2. `{ origin: bottom-end, overlay: top-end, offsetY: +offset }`
  3. `{ origin: top-start, overlay: bottom-start, offsetY: -offset }`
  4. `{ origin: top-end, overlay: bottom-end, offsetY: -offset }`
- `withFlexibleDimensions(false)`, `withPush(false)`, `withViewportMargin(8)`.
- **Scroll strategy:** `reposition` by default, `close` and `block` opt-in via `scrollStrategy`.
- **Width:** matches trigger by default (`panelWidth='trigger'`). **Measurement-source contract:** the anchor for `flexibleConnectedTo` and the element used by `updateOverlaySize`'s `getBoundingClientRect()` MUST be the same — the wrapping trigger `<div>` that styles the field surface, NOT the inner `<input>`. Anchoring to the inner input collapses the panel to the input's content width and diverges from the host-measured width whenever the field carries prefix/suffix/clear/chevron adornments. Same contract applies to any future overlay-bearing field-style component (select, combobox, date-picker, etc.).
- **Host display:** the host element MUST be `relative inline-block w-full` (NOT `inline-flex w-full`). `inline-flex` collapses to content width unless the parent provides an explicit width context, producing intermittent narrow panels. The internal trigger surface is the flex container.
- **Resize tracking:** a `ResizeObserver` watches the trigger surface and calls `updateOverlaySize` on every resize while the overlay is attached. **Ordering contract:** the observer MUST be installed BEFORE the first `updateOverlaySize` call inside `openPanel`, so that any layout shift between overlay attach and initial measurement is captured by the observer instead of silently lost.
- **Max height:** `panelMaxHeight` (default 256) on the inner listbox scroll container with `overflow-y-auto`.
- **Backdrop:** transparent backdrop captures outside clicks → close. No visible dim layer (combobox is non-modal).
- **Close behaviors:** outside click, Escape, Tab out, disabled toggle, selection commit (always), `value` cleared.
- **Enter/leave animation:** `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"` (keyframes in `theme/default.css`, 150ms, per CLAUDE.md "Enter/Leave Animations").

---

## 9. Visual surface

Matches `tw-input` resting state so the component looks native inside `tw-form-field` and standalone.

**Trigger (input element):**
- Border `border-border`, background `bg-surface`, text `text-fg`, radius `rounded-md` (per CLAUDE.md "Border Radius").
- Hover: `hover:border-border-strong`.
- Focus: canonical ring `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-{color}-500`.
- When wrapped in `tw-form-field`, auto-collapses to the naked variant (no border / no ring) so the form-field owns chrome — same auto-resolution as `tw-select`.
- Sizes follow the inline padding scale (per CLAUDE.md "Spacing Scale → inline padding"):

| Size | Padding | Font | Chevron |
|---|---|---|---|
| `xs` | `px-2 py-1` | `text-xs` | `size-3.5` |
| `sm` | `px-3 py-1.5` | `text-sm` | `size-4` |
| `md` | `px-4 py-2` | `text-sm` | `size-4` |
| `lg` | `px-5 py-2.5` | `text-base` | `size-5` |
| `xl` | `px-6 py-3` | `text-base` | `size-5` |

**Affordances inside the input row** (right-aligned, in this order):
- Optional clear button (`size-5`, `hover:bg-surface-muted`, focus-visible ring).
- Inline spinner when `loading()` is true and popover is closed.
- Chevron (`text-fg-muted`, rotates 180° when open, `transition-transform duration-200`).

**Popover panel:**
- `bg-surface-overlay`, `border border-border`, `rounded-md`, `shadow-md`, `overflow-hidden`.
- Inner listbox: `overflow-y-auto`, `py-1`.

**Option rows:**
- Use the activedescendant background-shift indicator (`bg-surface-muted` for active, `hover:bg-surface-muted` for resting, `opacity-50 pointer-events-none` for disabled).
- Density follows option size scale equivalent to `tw-select` (`px-3 py-2 text-sm` at `md`).

---

## 10. Loading & empty states

- **Loading** — driven entirely by the `loading()` input. When `true`:
  - An inline spinner replaces (or appears beside) the chevron in the trigger.
  - Inside the popover, the projected `*twComboboxLoading` template renders above the list. Fallback: a centred `tw-spinner` + "Loading…" text.
  - Existing results stay visible so they don't flicker — the loading indicator overlays, it does not blank.
- **Empty** — popover renders the projected `*twComboboxEmpty` template if no options pass the filter. Fallback: `emptyMessage()` text inside a `px-4 py-10 text-center text-sm text-fg-muted` block (mirrors `tw-command-palette` empty styling).
- **Popover open rules:**
  - With `minQueryLength > 0`: popover stays closed until the query meets the threshold, even if `loading=true` (avoids a flashing empty popover on every keystroke).
  - With `minQueryLength = 0`: opens on focus (if `openOnFocus`), or on first input.

---

## 11. Content projection slots

Minimal but enough to cover the documented use cases:

| Slot | Selector | Purpose | Fallback |
|---|---|---|---|
| Option template | `*twComboboxOption` | Per-option template; context `{ $implicit, label, value, selected, active, disabled, index }`. | Default row: label (+ optional description). |
| Empty template | `*twComboboxEmpty` | Rendered when filter yields zero options. Context `{ $implicit: query }`. | `emptyMessage()` text block. |
| Loading template | `*twComboboxLoading` | Rendered above the list while `loading=true`. | Centred `tw-spinner` + "Loading…". |
| Leading adornment | `[twComboboxPrefix]` (attribute) | Icon or text rendered before the input value (inside the field). | None — slot is absent if not projected. |
| Trailing adornment | `[twComboboxSuffix]` (attribute) | Custom trailing element, rendered before the clear button. | None. |

Not included (deliberately): trigger template, header/footer projection. The trigger is a single `<input>` by spec; popover header/footer can be added in a later iteration if real demand surfaces.

---

## 12. Edge cases & open questions

| # | Topic | Recommendation |
|---|---|---|
| 1 | **Stale async results** | Consumers debounce + cancel in their own code. The component does NOT track in-flight requests. Document: "if you use `queryChange` to fetch, guard with `switchMap` or your own race-cancellation". `optionSelected` is fired off the *current* options array at click time, not the array at query-emit time. |
| 2 | **`queryChange` debounce** | Library-level `queryDebounce` input (default 150ms) so async consumers don't all reinvent debouncing. Local filtering applies immediately (no debounce on `filterFn`) so the typed character → result mapping feels instant. |
| 3 | **Duplicate labels** | When multiple options share the same label, exact-match resolution (Section 6) picks the *first* in source order. `optionSelected` always emits the exact resolved option. Consumers wanting different tie-breaking ride `compareWith` against a synthetic key field. |
| 4 | **Virtualization** | Defer. Even 5k options render acceptably with native scroll; CDK `ScrollingModule` integration is a follow-up if real demand surfaces. Note in docs: "for >5k items, use async mode + server-side filtering." |
| 5 | **IME composition** | Suppress `queryChange` emission and active-index reset while `compositionstart`/`compositionend` are mid-flight. Wire native `compositionstart` / `compositionend` listeners on the input and gate the input handler. Standard requirement for CJK input. |
| 6 | **`writeValue` race with async options** | When `writeValue(x)` arrives before options load, store `x` verbatim and re-reconcile via an `effect` once `options()` first becomes non-empty *or* changes. `inputValue` updates to the resolved label at that point. No commit event re-fires. |
| 7 | **Clear button focus target** | Clicking clear must keep DOM focus on the `<input>` (or move it there). Otherwise `aria-activedescendant` semantics break on the next keystroke. |
| 8 | **Open + empty options** | If popover is forced open via `[(open)]=true` but `options.length === 0` and no `loading`, render the empty template. Do not auto-close. |
| 9 | **Strict mode interplay with `writeValue`** | `writeValue` does NOT validate against `strict`. Programmatic values are always accepted verbatim — coercing to `null` would hide model/options mismatches and surprise consumers. Validation is the form layer's job (Validators, not the accessor). |
| 10 | **`Enter` inside a `<form>`** | When the popover is open with an active option, Enter commits the option and stops propagation. When the popover is closed (or open with no active option), Enter falls through to native form submit — matches Material / Radix / Headless UI behavior and respects the user's expectation that Enter submits forms. |
| 11 | **Async result identity** | When `options` is replaced wholesale on each `queryChange`, the currently-selected `value` may no longer have a corresponding option. Component keeps `value` and `inputValue` as-is; only re-reconciles `inputValue` if the resolver finds a match. |
| 12 | **Asynchronous selection commit** | If a consumer wants to validate the picked option server-side before committing, they reject the change by resetting `value` in their `optionSelected` handler. Component does not own pre-commit hooks. |

---

## 13. Out of scope

- Multi-select / chip rendering.
- Creatable mode (on-the-fly option object construction). Free-text mode covers the basic case; richer "create new" UX is a follow-up component.
- Async pagination / infinite scroll within the popover.
- Virtualized option rendering (`cdk-virtual-scroll-viewport` integration).
- Tag-style chip input (separate component if pursued).
- Inline editable cell variant (tabular UI is `tw-table`'s problem).
- Built-in HTTP wiring or debounce strategies beyond the single `queryDebounce` input.

---

## 14. Testing checklist

Spec lives at `projects/ngx-tw/combobox/combobox.spec.ts`. Vitest. No `fakeAsync`/`tick` — use `async`/`await` with `fixture.whenStable()` and `vi.useFakeTimers()` / `vi.runAllTimers()` where timers are involved.

**Rendering**
- Mounts with no inputs and no options.
- Renders each value of `size` (xs–xl) and `color`.
- Renders chevron when `showChevron=true`, hides when `false`.
- Renders clear button only when input non-empty and `clearable=true`.
- Renders projected `*twComboboxOption` template when provided; falls back to default row otherwise.
- Renders projected `*twComboboxEmpty` / `*twComboboxLoading` templates with correct context.

**Inputs and outputs**
- `options` change → visible list changes (filtered through `filterFn`).
- Typing into the input updates `inputValue` model and emits debounced `queryChange`.
- Picking an option emits `optionSelected` with `{ option, value, label }` and updates `value`.
- Committing free text emits `valueCommit` with `source: 'free-text'`.
- `disabled` blocks all interaction and prevents popover opening.
- `loading` toggles the spinner affordance and renders the loading slot inside the popover.

**Interaction**
- Click input → opens popover (subject to `minQueryLength`).
- `ArrowDown`/`ArrowUp` move `aria-activedescendant` across enabled options only.
- `Home`/`End` jump to first/last enabled (when not interfering with text cursor).
- `Enter` with active option commits; without active commits free text (default) / reverts (strict).
- `Escape` closes and restores last committed value.
- `Tab` closes and commits.
- Backdrop click closes.
- IME composition: typing while composing does not move active index until composition ends.
- Disabled options are skipped by keyboard navigation and ignored on click.

**Accessibility**
- Input carries `role="combobox"`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`.
- `aria-expanded` flips with popover state.
- `aria-activedescendant` updates on every active-index move and clears when popover closes.
- Each option carries `role="option"`, `aria-selected`, stable `id`.
- Grouped options render `role="group"` with `aria-labelledby`.
- `LiveAnnouncer` announces result counts (mock the announcer via `vi.spyOn`) on debounced query and on selection.
- `aria-required`, `aria-invalid`, `aria-describedby`, `aria-labelledby` reflect input state and form-field-pushed ids.
- AXE checks pass in default and disabled states.

**Content projection**
- Default empty/loading content renders when no slot is projected.
- Projected content replaces fallback when supplied.

**ControlValueAccessor**
- `writeValue(value)` updates `inputValue` to the resolved option's label when a match exists; sets verbatim string otherwise.
- `writeValue(null)` clears both `value` and `inputValue`.
- Late-arriving `options` after a `writeValue` re-reconcile `inputValue` to the resolved label.
- `registerOnChange` fires on user-driven commits, not on `writeValue`.
- `registerOnTouched` fires on blur.
- `setDisabledState(true)` applies the disabled visuals and blocks interaction.
- Works under template-driven (`[(ngModel)]`), reactive (`[formControl]`), and signal-forms harnesses.

**Form-field integration**
- When wrapped in `tw-form-field`, variant auto-resolves to naked.
- `setDescribedByIds` and `setLabelledByIds` merge with consumer-provided `aria-*` correctly.
- Label click on the wrapping `tw-form-field` focuses the input.
