# Prompt: Build `tw-tags-input` for ngx-tw

> Source of truth: this document. Read it end-to-end before opening any code file.

---

## Context

Before writing code, read:

- `.claude/CLAUDE.md` — conventions, semantic tokens, Visual Design System (spacing scale, gap values, typography roles, border radius, focus rings, transitions, disabled/opacity), JSDoc requirements, signal API rules (`computed()` vs `linkedSignal()`, **no signal cycles in `effect()`**, no `mutate`), `host`-bindings rule (no `@HostBinding`/`@HostListener`), **CVA runtime-assignment pattern** (the "ControlValueAccessor" section), the form-control input-count exception, the boolean-default rule, the focus-ring carve-outs, and the Vitest rules (no `fakeAsync`/`tick`).
- `projects/ngx-tw/checkbox/checkbox.ts` — **the canonical form-control peer.** Mirror precisely: runtime CVA wiring (`inject(NgControl, { optional: true, self: true })` → `this.ngControl.valueAccessor = this` in the constructor, checkbox.ts:327, 354-362); `extends FormFieldControl<T>` (checkbox.ts:269-272); the **aliased-input pattern for names the abstract base owns** — `requiredInput = input(false, { alias: 'required' })` (checkbox.ts:286), `idInput = input(..., { alias: 'id' })` (checkbox.ts:301), with `required` / `id` being the **computed contract members** (checkbox.ts:346, 434-440); `TW_ERROR_STATE_MATCHER` integration and the `errorState` computed (checkbox.ts:443-452); parent-form submission tracking (`parentForm`/`parentFormGroup` + `_formSubmitRev`, checkbox.ts:328-329, 604-609); `aria-describedby`/`aria-labelledby` merging (`effectiveAriaLabelledby`/`effectiveAriaDescribedby`, checkbox.ts:399-418); the `_ngControlRev` revision-signal pattern (checkbox.ts:337, 569-602); dev-mode missing-accessible-name warning (checkbox.ts:364-370, 612-616); `setDescribedByIds`/`onContainerClick` (checkbox.ts:553-565); the `FocusMonitor` host wiring and `onTouched`-on-blur (checkbox.ts:569-588). **This component does NOT use a static `NG_VALUE_ACCESSOR` provider — runtime assignment only, exactly like checkbox.**
- `projects/ngx-tw/checkbox/checkbox.spec.ts` — Vitest layout, FocusMonitor stubbing, the ngModel / FormControl / signal-forms host harness shapes. Copy the test scaffolding idioms.
- `projects/ngx-tw/combobox/combobox.ts` — **the accessor-input and chip-styling-adjacent precedent.** Note especially:
  - the **`focus-within:` container ring**: the `trigger` slot owns the visible focus ring (`focus-within:outline-2 focus-within:outline-offset-2` + a per-`color` `focus-within:outline-{color}-500` axis, combobox.ts:117-118, 138-147) while the inner `<input>` is bare (`flex-1 min-w-0 bg-transparent outline-none placeholder:text-fg-subtle`, combobox.ts:119-120). **Copy this container/input split verbatim — it is the tags-input container shape.**
  - the **accessor-input philosophy**: `compareWith = input<(a: T, b: T) => boolean>(Object.is)` (combobox.ts:432-433), and the `defaultOptionLabel` / `defaultOptionValue` module-level default fns (combobox.ts:78-98). Combobox accessors map an *existing* option object to label/value; **tags-input's `createTag` is net-new — it MINTS a value from typed text, which combobox/select never do (call this out, no in-repo precedent for value-creation).**
  - runtime CVA registration (`this.ngControl.valueAccessor = this`, combobox.ts:727-728).
  - the **debounced `LiveAnnouncer`** (`ANNOUNCE_DEBOUNCE = 200`, combobox.ts:68-69, 810-827) — that debounce exists for *per-keystroke result-count* announcements. **tags-input has no suggestion list in v1, so do NOT carry the debounce for add/remove** (announce those immediately). See Accessibility.
  - that combobox carries **30 inputs** — the concrete proof that a form control composing accessor functions stays a flat input list (see Input-count discipline).
- `projects/ngx-tw/combobox/types.ts` — **the event-type naming convention.** `TwComboboxOptionSelectedEvent<T>` / `TwComboboxValueCommitEvent<T>` are exported interfaces with a `Tw` prefix and a `<T>` parameter; payload fields carry one-line JSDoc (types.ts:21-45). Tags-input's `TwTagAddedEvent<T>` / `TwTagRemovedEvent<T>` and the accessor-fn type aliases follow this shape exactly.
- `projects/ngx-tw/badge/badge.ts` — **chip styling source.** The `[twBadge]` **attribute** selector (badge.ts:172) so chip styling applies to the chip wrapper element directly; the `color` / `variant` / `size` / `pill` inputs (badge.ts:202-212); `dismissLabel` (badge.ts:225-226, default `'Dismiss'`). **CRITICAL: do NOT use badge's `dismissible` button** — it is a plain `<button type="button">` with no tabindex control (badge.ts:187-198); N dismissible badges would create N+1 tab stops, fighting the single-tab-stop roving model (decision #2). Reuse badge for **visual styling only**; the component supplies its own remove buttons and owns their roving tabindex.
- `projects/ngx-tw/segmented-control/segmented-control.ts` — **the in-repo roving-tabindex-with-real-focus precedent** (the house pattern for the chip strip). Mirror: `[attr.tabindex]='isFocusable() ? 0 : -1'` (segmented-control.ts:136); arrow-key navigation that moves the active index then calls `opt.focus()` (segmented-control.ts:293-328); Home/End jumps; the `findNextEnabledIndex` wrapping helper (segmented-control.ts:330-339); the per-item `focus()` method (segmented-control.ts:202-204). Chips that receive real `tabindex`/`focus()` take the **canonical outline focus ring** (CLAUDE.md), NOT the command-palette background-shift carve-out.
- `projects/ngx-tw/command-palette/command-palette.ts` — read ONLY to confirm the **activedescendant carve-out does NOT apply here**: command-palette keeps DOM focus on the input and identifies the active option by id (`aria-activedescendant`, command-palette.ts:552-555), so it uses a `bg-surface-sunken` background shift (command-palette.ts:118-122). **Tags-input is the opposite model — real DOM focus moves to each chip's remove button — so use the canonical outline ring, not the background shift.**
- `projects/ngx-tw/input/input.ts` — the simpler `FormFieldControl<string>` shape (input.ts:160-300); the `errors` signal feeding `[twError match="…"]` (input.ts:286-290); the `_ngControlRev` / `_formSubmitRev` revision-signal pattern (input.ts:239-240, 286-316).
- `projects/ngx-tw/form-field/form-field.ts` — the `FormFieldControl<T>` abstract base and its full contract (form-field.ts:37-73): `id` / `value` / `focused` / `empty` / `disabled` / `required` / `errorState` / `errors` / `controlType` / `userAriaDescribedBy` / `setDescribedByIds` / `onContainerClick` / `setLabelledByIds`; the `TW_FORM_FIELD_CONTROL` token (form-field.ts:79-81). **Note: the float label reads `control.empty()`, NOT `control.value()` (`shouldLabelFloat` = `ctrl.focused() || !ctrl.empty()`, form-field.ts:474-481).** This matters for the `value` contract member (see Form integration).
- `projects/ngx-tw/core/types.ts` — `TwColor` (8 roles) and `TwSize` (`xs`–`xl`).
- `projects/ngx-tw/core/error-state-matcher.ts` — `ErrorStateMatcher`, `TW_ERROR_STATE_MATCHER`, `TwFormSubmitted`.

CDK modules to import:

- `@angular/cdk/a11y` — **`LiveAnnouncer`** (add / remove / max-reached announcements — explicit task requirement); **`FocusMonitor`** on the host (drives the `focused` signal and `onTouched`-on-blur, exactly as checkbox does).
- `@angular/cdk/keycodes` — optional, for `BACKSPACE` / `DELETE` / `ENTER` / `END` / `HOME` / `LEFT_ARROW` / `RIGHT_ARROW` constants if you prefer them over string `event.key` comparisons (segmented-control uses string keys; either is acceptable — pick one and be consistent).
- `@angular/cdk/overlay` — **explicitly NOT used in v1.** No suggestion dropdown, no listbox popup (see "What it does NOT do" and Open decisions). v1 is free-text only.

---

## What to build

A standalone form control, **`<tw-tags-input>`**, for **free-text multi-value entry** (recipients, labels, filters, keywords). The user types text and commits it as a "tag" via Enter or a separator key (comma by default); committed tags render inline as removable **chips** (styled with `[twBadge]`) ahead of the text input. The whole control is a `ControlValueAccessor` whose value is an array of tags, generic `T[]` defaulting to `string[]`. It integrates with `<tw-form-field>` for label / hint / error chrome and `TW_ERROR_STATE_MATCHER` policy, and works with template-driven `ngModel`, reactive `FormControl`, and signal-based `formField`.

This fills a real gap in the library: `combobox` is single-select free-text-or-option autocomplete; `select` is fixed-list multi-select — neither owns free-text token entry. Consumers currently hand-roll chip + token management on top of combobox. `tw-tags-input` owns it: chip rendering, the commit-on-separator gesture, dedup, a `max` cap, and the single-tab-stop roving-tabindex chip strip.

### What it does NOT do

- Does **not** provide autocomplete / a suggestion overlay. **There is no CDK Overlay, no listbox popup, no suggestion dropdown in v1.** Free-text only. Rationale (mirrors how number-input defers percent-style and hold-to-repeat): the task's CDK-leverage scope names only `LiveAnnouncer`; consumers already get autocomplete from `combobox`; what they hand-roll — and what this component owns — is chip/token management, not suggestion filtering. Suggestions are a deliberate v2 surface (see Open decisions), where an `options` input + an overlay listbox would graft onto this same value/chip model.
- Does **not** support a custom chip template (`*twTagsInputChip`) in v1. A consumer-authored chip template fights the component-owned remove-button + roving-tabindex focus model (decision below). Deferred to v2 (Open decisions) — the same way file-upload's custom item template is a deliberate, bounded slot decision.
- Does **not** validate tag content beyond trimming, the dedup comparator, and the `max` cap. Cross-field / async validation flows through the bound `NgControl` and surfaces via `errorState` (same split as file-upload).
- Does **not** reorder chips via drag. Out of scope; not a v1 gesture.
- Does **not** expose badge's built-in `dismissible` button as the remove control (it would break the single-tab-stop model — see Context / badge note).

---

## File layout

Create under `projects/ngx-tw/tags-input/` (flat secondary-entry-point layout, matching number-input / file-upload — **not** `src/lib/`):

| File | Role |
|---|---|
| `tags-input.ts` | `TagsInputComponent`, the `tv()` config, module-level accessor defaults (`defaultTagLabel`, identity `createTag`), inline helpers (id generator, paste-split). |
| `types.ts` | Exported public types: `TwTagAddedEvent<T>`, `TwTagRemovedEvent<T>`, and the accessor-fn type aliases (`TwTagFactory<T>`, `TwTagLabelFn<T>`). (Keep these in a separate `types.ts` mirroring combobox's `types.ts`; if the set proves trivial, inlining into `tags-input.ts` is acceptable — but a separate file matches the combobox precedent and keeps `index.ts` clean.) |
| `tags-input.spec.ts` | Vitest suite — see Test plan. |
| `index.ts` | Re-exports `TagsInputComponent` and the public types from `types.ts`. **Does NOT export the `tv()` config.** |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |

---

## Public types (exported from `index.ts`)

```ts
/** Maps committed text to a tag value of type `T`. Default is identity (the trimmed string). */
export type TwTagFactory<T> = (text: string) => T;

/** Maps a tag value of type `T` to its visible chip label. Default is `String(tag)`. */
export type TwTagLabelFn<T> = (tag: T) => string;

/** Payload of the `tagAdded` output. */
export interface TwTagAddedEvent<T> {
  /** The tag that was added. */
  tag: T;
  /** The resulting tag array after the add (a fresh array reference). */
  value: readonly T[];
}

/** Payload of the `tagRemoved` output. */
export interface TwTagRemovedEvent<T> {
  /** The tag that was removed. */
  tag: T;
  /** Index the tag occupied before removal. */
  index: number;
  /** The resulting tag array after the removal (a fresh array reference). */
  value: readonly T[];
}
```

Follow combobox/types.ts: `Tw`-prefixed exported interfaces, `<T>` parameter, one-line JSDoc on every field. The accessor type aliases mirror combobox's `optionLabel` / `optionValue` shape but are net-new in intent — `TwTagFactory` *creates* a `T` from a string, which combobox/select never do.

---

## Selector and class

- Element selector: `tw-tags-input`. Component class name: `TagsInputComponent` (**no `Tw` prefix on the class** — the package scope `@cdevhub/ngx-tw/tags-input` namespaces it). `exportAs: 'twTagsInput'` so consumers can grab a template ref for the public methods.
- Component-specific exported **types** carry the `Tw` prefix (`TwTagAddedEvent`, etc.) per the combobox event-type convention.
- The component is generic: `export class TagsInputComponent<T = string> extends FormFieldControl<T[]> implements ControlValueAccessor, OnInit`.

### Provider override

```ts
providers: [
  { provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => TagsInputComponent) },
],
```

so `<tw-form-field>` wires its label / hint / error chrome. CVA registration is **runtime** (`this.ngControl.valueAccessor = this` in the constructor), **never** via a static `NG_VALUE_ACCESSOR` provider — the component injects `NgControl` with `{ self: true }` for `TW_ERROR_STATE_MATCHER` integration, which is incompatible with a static value-accessor provider on the same instance (CLAUDE.md "ControlValueAccessor"; matches checkbox.ts:354-362). Do **not** add `NG_VALUE_ACCESSOR` to the providers array.

---

## API design

### Input-count discipline

This component is a **form control** and qualifies for the form-control input-count exception codified in CLAUDE.md (canonical: checkbox at 12+; the ARIA + Forms baseline alone is ~12 inputs). The tag-behavior knobs (`separatorKeys`, `addOnBlur`, `max`, `allowDuplicates`, `placeholder`, `createTag`, `tagLabel`, `compareWith`) stack on top.

**Recommendation: keep the input list FLAT — do NOT group the knobs into a config object.** Justification (grounded, not asserted): `combobox` is the directly comparable form control and carries **30 flat inputs** (verified by counting `readonly … = input` in combobox.ts), including the three accessor functions `optionLabel` / `optionValue` / `compareWith` as individual inputs. Accessor functions resist a config object — they need generic inference per-input and consumers set them independently — and four scalar knobs (`separatorKeys`, `addOnBlur`, `max`, `allowDuplicates`) plus `placeholder` do not earn a config object's ceremony. The total surface (~16 inputs) sits comfortably below combobox's 30 and is fully covered by the form-control exception. State this rationale in an inline comment near the inputs.

### Inputs

> **Naming caution — the `FormFieldControl` abstract base owns the identifiers `value` / `disabled` / `required` / `id`** (form-field.ts:39-49). The component cannot declare an `input()` field with one of those bare names, or it collides with the abstract member. Follow checkbox exactly: declare the inputs as `disabledInput` / `requiredInput` / `idInput` **aliased** to the public attribute names `disabled` / `required` / `id` (checkbox.ts:286, 301), and let the bare `disabled` / `required` / `id` identifiers be the **computed contract members** (checkbox.ts:346, 434-440, and the `isDisabled` computed at checkbox.ts:374). The consumer template still writes `disabled` / `required` / `id` (the alias) — only the class-field identifier differs. **`value` has NO input** — it is the readonly `tags.asReadonly()` signal that doubles as the `FormFieldControl.value` contract member (see Implementation notes).

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `color` | `TwColor` | `'primary'` | `Semantic color for the container focus-within ring and the chip accent. Defaults to 'primary'.` |
| `size` | `TwSize` | `'md'` | `Controls overall density: container padding, chip size, and input/text scale. Defaults to 'md'.` |
| `disabledInput` (alias `disabled`) | `boolean` | `false` | `When true, blocks typing, committing, and chip removal, and applies muted styling. Reactive forms also propagate disabled via setDisabledState. Defaults to false.` |
| `requiredInput` (alias `required`) | `boolean` | `false` | `Marks the control as required. Mirrors to aria-required. Inferred from Validators.required on a bound NgControl. Defaults to false.` |
| `placeholder` | `string \| undefined` | `undefined` | `Placeholder shown in the text input only while there are no chips and the input is empty. Defaults to undefined.` |
| `separatorKeys` | `readonly string[]` | `['Enter', ',']` | `Keys that commit the in-progress text as a tag. Each entry is a KeyboardEvent.key value ('Enter') or a single separator character (','). Defaults to ['Enter', ',']. Single-char separators also split pasted text.` |
| `addOnBlur` | `boolean` | `false` | `When true, blurring the control while the input holds non-empty text commits it as a tag. Defaults to false (text is only committed by an explicit separator/Enter or paste).` |
| `max` | `number \| undefined` | `undefined` | `Maximum number of tags. Once reached, further commits are blocked and announced. Does not truncate an oversized writeValue. Defaults to undefined (no limit).` |
| `allowDuplicates` | `boolean` | `false` | `When false (default), a committed tag equal (per compareWith) to an existing tag is dropped silently. When true, duplicates are kept. Defaults to false.` |
| `createTag` | `TwTagFactory<T>` | identity | `Maps committed text to a tag value. Default is identity — the trimmed string. Override to build object tags (e.g. (text) => ({ name: text, id: uuid() })).` |
| `tagLabel` | `TwTagLabelFn<T>` | `String(tag)` | `Maps a tag value to its visible chip label and the remove-button accessible name. Defaults to String(tag).` |
| `compareWith` | `(a: T, b: T) => boolean` | `Object.is` | `Equality comparator used for dedup when allowDuplicates is false. Defaults to Object.is (reference/value identity). String tags dedupe case-sensitively by default; pass (a, b) => a.toLowerCase() === b.toLowerCase() for case-insensitive dedup.` |
| `name` | `string \| undefined` | `undefined` | `Optional name attribute for native form association.` |
| `idInput` (alias `id`) | `string \| undefined` | `undefined` | `Id on the host element. Auto-generated as 'tw-tags-input-N' when not provided. Used by the form-field's <label for> attribute.` |
| `ariaLabel` (alias `aria-label`) | `string \| undefined` | `undefined` | `Accessible name applied to the control when no visible label is projected. Mirrored to the container's aria-label.` |
| `ariaLabelledby` (alias `aria-labelledby`) | `string \| undefined` | `undefined` | `ID of an external element that labels the control. Mirrored to aria-labelledby.` |
| `ariaDescribedby` (alias `aria-describedby`) | `string \| undefined` | `undefined` | `ID of an external element that describes the control. Form-field merges its hint/error ids alongside.` |
| `errorStateMatcher` | `ErrorStateMatcher \| undefined` | `undefined` | `Per-instance override of the ErrorStateMatcher. When omitted, uses the TW_ERROR_STATE_MATCHER token's value.` |

**Boolean defaults (CLAUDE.md rule):** all booleans default to `false` (`disabledInput`, `requiredInput`, `addOnBlur`, `allowDuplicates`). None need the `true`-default carve-out. `addOnBlur=false` is the conservative choice (text only commits on explicit gesture) and matches Material's chip-input default — no carve-out justification required.

### Outputs

Follow the propertyChange + past-tense dual pattern.

| Output | Payload | JSDoc |
|---|---|---|
| `valueChange` | `readonly T[]` | `Fires when the tag array changes through user interaction (add, remove, clear). Emits a fresh array reference. Does not fire on writeValue (programmatic form writes).` |
| `tagAdded` | `TwTagAddedEvent<T>` | `Fires when a tag is committed via Enter, a separator key, paste, or addTag(). Does not fire for dropped duplicates, blocked-by-max commits, or empty/whitespace commits. Does not fire on writeValue.` |
| `tagRemoved` | `TwTagRemovedEvent<T>` | `Fires when a tag is removed via the remove button, Backspace/Delete, or removeTag(). Does not fire on writeValue or clear() (clear is a bulk reset).` |

### Models

None. The form value is owned by the parent through CVA (`ngModel` / `formControl` / `formField` round-trip it), so a `model()` two-way binding would be redundant and fight the CVA round-trip — same reasoning as number-input and file-upload. The readonly `value` signal serves template-ref reads; `valueChange` serves non-form consumers.

### Public methods (instance API — reachable via `#ref="twTagsInput"`)

| Method | Signature | JSDoc |
|---|---|---|
| `addTag` | `(text: string): boolean` | `Commits text as a tag (trim → createTag → dedup unless allowDuplicates → max check). Returns true if a tag was added, false if it was dropped (empty/whitespace, duplicate, or max reached). Emits tagAdded + valueChange on success. No-op (returns false) when disabled.` |
| `removeTag` | `(tag: T \| number): void` | `Removes a tag by value (first match via compareWith) or by index. Emits tagRemoved + valueChange. Manages focus restoration (see Accessibility). No-op when disabled or when no match.` |
| `clear` | `(): void` | `Removes all tags and clears the in-progress input text. Emits valueChange with []. Does NOT emit tagRemoved per-tag (bulk reset). No-op when already empty or disabled.` |
| `focus` | `(): void` | `Moves focus to the text input.` |

### Public readonly signals

| Signal | Type | JSDoc |
|---|---|---|
| `value` | `Signal<readonly T[]>` | `The current tag array (empty array when there are no tags). Read from a template ref (#t='twTagsInput') for non-form usage. Also serves as the FormFieldControl contract member.` |
| `inputText` | `Signal<string>` | `The current in-progress (uncommitted) text in the input. Empty when nothing is typed.` |

---

## CVA contract

`writeValue` is **authoritative**: it does not dedup, does not enforce `max`, and does not emit. This mirrors number-input ("writeValue does not clamp/round — a programmatic write is authoritative") and file-upload ("writeValue does not emit filesAdded/cleared").

| CVA hook | Behavior |
|---|---|
| `writeValue(value: T[] \| null \| undefined)` | `null` / `undefined` → empty array. An array → store **as-is** (a defensive copy, to avoid mutating the caller's reference): **no dedup, no `max` truncation.** Clears the in-progress input text to `''`. Does **NOT** emit `valueChange` / `tagAdded` / `tagRemoved`. Idempotent for an equal array. (If the consumer pushes duplicates or an oversized array programmatically, that is their authoritative value — the component renders it faithfully; the next *user* commit re-applies dedup/max against the current set.) |
| `registerOnChange(fn)` | Store `fn`. Call with the current `T[]` (a fresh array) on **every user-driven change** — add, remove, clear. Never from `writeValue`. |
| `registerOnTouched(fn)` | Store `fn`. Call on host blur (FocusMonitor `null` origin), same as checkbox. |
| `setDisabledState(isDisabled)` | Set an internal `cvaDisabled = signal(false)` to `isDisabled`. The contract `disabled` member ORs this with the `disabledInput` input — `disabled = computed(() => this.disabledInput() \|\| this.cvaDisabled())` (mirror checkbox's `isDisabled`, checkbox.ts:374). When disabled, all interactions (type, commit, remove, keyboard) are blocked. |

**Value shape:** the CVA value is always `T[]` (an array, never a bare `T`, never `null` outbound — empty is `[]`). The `FormFieldControl.value` contract member is the same `value` signal (`Signal<readonly T[]>`); it returns an empty array — **never `null`** — when there are no tags. That is fine: a `Signal<readonly T[]>` satisfies the abstract `Signal<T[] | null>` by return-type covariance, and **the float label reads `empty()`, not `value()`** (form-field.ts:474-481), so floating works purely off the `empty` signal regardless of what `value()` returns. Do **not** add a separate null-when-empty value signal.

---

## Tag-creation, dedup & validation behavior (exhaustive — treat like number-input's edge-case table)

The commit pipeline (used by Enter, separator key, paste piece, `addTag()`, and `addOnBlur`):

1. **Trim** the candidate text. Empty after trim → **no-op** (return `false`, no event).
2. **Create** the tag: `tag = createTag(trimmed)`. (Default `createTag` returns the trimmed string.)
3. **Dedup** (when `!allowDuplicates`): if `value().some(existing => compareWith(existing, tag))` → **drop silently** (return `false`, no event, but **do clear the input text** — the gesture succeeded, the value was already present).
4. **Max check**: if `max() !== undefined && value().length >= max()` → **block**: do not add, return `false`, **announce** `'Maximum {max} tags reached'` via `LiveAnnouncer` (politeness `'assertive'` so it interrupts; throttle — see Accessibility), and **leave the input text intact** so the user can retry after removing a tag.
5. **Commit**: append `tag` to a fresh array, `tags.set(next)`, clear the input text, call `onChange(next)`, emit `tagAdded({ tag, value: next })` and `valueChange(next)`. Return `true`.

| Case | Behavior |
|---|---|
| Empty / whitespace-only commit (`''`, `'   '`) | No-op. No tag, no event, no announce. Input cleared (whitespace collapses to nothing). |
| Duplicate, `allowDuplicates=false` | Dropped silently. No `tagAdded`. Input **is** cleared (commit gesture consumed). No announce (silent is the documented behavior). |
| Duplicate, `allowDuplicates=true` | Added normally. |
| `max` reached | Commit blocked, input text **retained**, `'Maximum N tags reached'` announced (assertive, throttled). No `tagAdded`. |
| Trimming | Leading/trailing whitespace is stripped before `createTag`. Interior whitespace is preserved (`'New York'` is one tag). |
| Separator char inside the typed text | Typing the separator character commits the text *before* it; the separator itself is not added to any tag (see Keyboard — separator-key handling). |
| Paste containing separators | Split on all single-char `separatorKeys` (NOT on `'Enter'` — that is a key, not a character), commit each non-empty piece in order through the full pipeline (dedup + max per piece). See Paste table. |
| Object tags (`createTag` returns an object) | Dedup uses `compareWith`; default `Object.is` would treat every new object as distinct, so consumers using object tags **must** supply a `compareWith` (e.g. compare by `id`). Document this in the `createTag` / `compareWith` JSDoc. |
| String dedup case-sensitivity | Case-**sensitive** by default (`Object.is`). `'Foo'` and `'foo'` are distinct tags. A one-line `compareWith` enables case-insensitive dedup (see the `compareWith` JSDoc). |

### Paste handling (exhaustive — treat like file-upload's behavior tables)

Bind `(paste)` on the text input.

| Pasted text | `separatorKeys=['Enter', ',']` result |
|---|---|
| `'foo'` | No separator → merged into the current input text (see paste detail); commit happens on the next separator/Enter/blur. |
| `'foo,bar,baz'` | Three tags `'foo'`, `'bar'`, `'baz'`, each through the pipeline (dedup + max). |
| `'foo, bar ,  baz '` | Three tags `'foo'`, `'bar'`, `'baz'` (each piece trimmed). |
| `'foo,,bar'` | Two tags `'foo'`, `'bar'` (empty piece skipped). |
| `'foo,'` | One tag `'foo'` (trailing empty piece skipped). |
| `',,'` | No tags. |
| Paste that would exceed `max` | Commit pieces in order until `max` is hit; remaining pieces blocked; announce `'Maximum N tags reached'` once at the end (not per blocked piece). |

**Paste detail:** `event.preventDefault()` on `(paste)`, read `event.clipboardData?.getData('text')`. If the pasted text contains **no** single-char separator, treat it as a single candidate — append it to the current input text (so a user can paste a fragment mid-typing) rather than committing immediately; commit happens on the next separator/Enter/blur. If it **does** contain separators, prepend any text already in the input to the first piece, then split → commit each piece (so partial typing + paste merges correctly). This is the recommended behavior; the simpler "always split and commit, ignoring current input text" is acceptable if you document it instead — but the merge behavior is less surprising.

---

## Keyboard model — the single-tab-stop roving chip strip (the hardest part — read twice)

**The entire control is ONE tab stop.** Tab moves into the control (landing on the text input by default) and Shift+Tab/Tab moves out of it — it does **not** step through chips. Within the control, ArrowLeft/ArrowRight move a roving focus between the chips' remove buttons and the text input. This is the Material `MatChipGrid` interaction model, implemented with the in-repo roving-tabindex mechanics from `segmented-control.ts` (`[attr.tabindex]='isFocusable() ? 0 : -1'` + arrow keys that move an active index and call `.focus()`).

### Roving tabindex

- Exactly **one** focusable element in the control has `tabindex="0"` at any time; everything else is `tabindex="-1"`. Each chip's **remove button** and the **text input** participate in the roving set.
- Default focusable (the `tabindex="0"` element when nothing is highlighted) is the **text input**. So Tab lands on the input — the common case (start typing).
- When the user arrows left into the chips, the active chip's remove button becomes `tabindex="0"` (and receives `.focus()`); the input drops to `tabindex="-1"`. Arrowing right back past the last chip returns focus to the input.
- Track the roving position with a writable `activeChipIndex = signal<number | null>(null)` (`null` = the text input is active). Mirror segmented-control's `isFocusable` per-chip computed against this index.

### ARIA structure — `role="group"` (settled)

Use **`role="group"`** on the chip-strip container, with a roving-tabindex set. This is the **settled choice** — it is verifiable-by-construction (no dependency on Material's exact internal DOM, which is not installed in this repo), APG-defensible (a labelled group of controls; file-upload uses `role="group"` for an analogous wrapping region), and imposes **no `aria-required-children` obligation** (the trap that a `role="grid"` shape creates when a bare `<input>` sits inside it). Structure:

- The container element carries `role="group"`, `aria-label` / `aria-labelledby` / `aria-describedby`, `aria-disabled`, `aria-required`, `aria-invalid`. This is the element with the `focus-within:` ring.
- **Each chip wrapper** is `role="presentation"` (purely a styling host carrying `[twBadge]`); the **focusable, semantically meaningful element is the remove `<button type="button">`** inside it. The chip label text is a plain `<span>`.
- **The text input** is a bare `<input type="text">` inside the same group (no row/gridcell wrapping needed under `role="group"`).
- **Each remove button MUST have an accessible name** `Remove {label}` where `label = tagLabel(tag)` — set via `[attr.aria-label]`. Do **not** leave it as badge's default `'Dismiss'`. (This is why the component supplies its own remove buttons rather than using badge's `dismissible` slot.)

> **`role="grid"` contingency (do not implement unless needed).** If a future review insists on the literal MatChipGrid `role="grid"` shape, the only structural change is: wrap each chip in `role="row"` > `role="gridcell"` and put the `<input>` in its own `role="row"` > `role="gridcell"` (a bare `<input>` as a direct child of `role="grid"` fails axe-core's `aria-required-children` — that wrapping is the one-line remedy). The roving-tabindex logic, focus restoration, and keyboard table are identical either way. v1 ships `role="group"`.

### Exhaustive key table

All actions are no-ops when the control is disabled.

| Key | Focus context | Action |
|---|---|---|
| `Tab` | anywhere in control | Moves focus **out** of the control to the next tab stop. The control is a single tab stop — Tab never steps through chips. |
| `Shift+Tab` | anywhere in control | Moves focus **out** to the previous tab stop. |
| `Enter` | input, non-empty | `preventDefault()`, commit the input text as a tag (full pipeline). Swallowing Enter while typing a tag prevents accidental form submit — intended. |
| `Enter` | input, empty | No-op for the component; **do not `preventDefault`** — let native form submit through. (Only block submit when there is text to commit.) |
| separator char (e.g. `,`) | input | On `(keydown)`, if `event.key` is a single-char separator in `separatorKeys`, `preventDefault()` and commit the input text. The separator character is **not** inserted into the input. |
| `ArrowLeft` | input, caret at position 0 (or input empty) | `preventDefault()`, move active focus to the **last** chip's remove button (`activeChipIndex = lastIndex`, `.focus()`). If caret is not at position 0, let native caret movement happen (do not `preventDefault`). |
| `ArrowLeft` | a chip | `preventDefault()`, move to the previous chip; if already at the first chip, stay (no-op). |
| `ArrowRight` | a chip | `preventDefault()`, move to the next chip; if at the last chip, return focus to the **text input** (`activeChipIndex = null`, focus the input). |
| `ArrowRight` | input | No-op (already rightmost). Let native caret movement happen. |
| `Home` | a chip | `preventDefault()`, move to the **first** chip. |
| `End` | a chip | `preventDefault()`, return focus to the **text input**. |
| `Delete` | a chip | `preventDefault()`, remove the focused chip immediately. Apply the focus-restoration rule below. |
| `Backspace` | a chip | `preventDefault()`, remove the focused chip immediately. Apply the focus-restoration rule below. |
| `Backspace` | input, empty | **Two-step (Material-style):** first Backspace **highlights** the last chip — move active focus to it (`activeChipIndex = lastIndex`, `.focus()`), visually marking it (the canonical focus ring suffices; optionally a subtle `data-highlighted` state). A **second** Backspace (now on that chip) removes it. Backspace on an empty input with no chips is a no-op. |
| `Backspace` | input, non-empty | Native — deletes a character. Do not `preventDefault`. |
| `Escape` | input, non-empty | `preventDefault()`, clear the in-progress input text (cancel the partial tag). Does not remove committed tags. |
| `Escape` | a chip (highlighted) | `preventDefault()`, cancel the highlight — return focus to the text input (`activeChipIndex = null`) without removing the chip. |
| typing / printable keys | input | Native — appends to the input text; updates `inputText` (and thus placeholder-visibility and the float-label `empty` state) on `(input)`. |

### Focus restoration after removing a chip (state explicitly)

After removing the chip at index `N`:

1. If a chip exists at index `N` after removal (i.e. there was a chip to the right that shifts left into slot `N`) → focus that chip's remove button (`activeChipIndex = N`).
2. Else if a chip exists at index `N-1` (the previous chip) → focus it (`activeChipIndex = N-1`).
3. Else (no chips remain) → focus the **text input** (`activeChipIndex = null`).

This is the "next chip, else previous chip, else the text input" rule — unambiguous. Implement it inside `removeTag` (and the keyboard remove paths route through `removeTag`).

---

## Accessibility

- **`role="group"`** on the chip-strip container (settled — see ARIA structure) with `aria-label` (from `ariaLabel()`), `aria-labelledby` (merged: external `ariaLabelledby` else the form-field label id, mirror checkbox's `effectiveAriaLabelledby`), `aria-describedby` (form-field-merged + consumer-supplied, mirror checkbox's `effectiveAriaDescribedby` + `setDescribedByIds`), `aria-disabled` (`disabled() || null`), `aria-required` (`required() || null`), `aria-invalid` (`errorState() || null`).
- **Roving tabindex** as specified — single tab stop; arrow keys traverse; chip remove buttons receive **real DOM focus** and therefore take the **canonical outline focus ring** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (CLAUDE.md). **Do NOT use the command-palette `aria-activedescendant` background-shift carve-out** — that carve-out is only for options that never receive DOM focus; here they do.
- **Container focus ring**: the group container owns a `focus-within:` ring (combobox container pattern); the inner `<input>` is bare (`outline-none bg-transparent`). The chip remove buttons' own `focus-visible:` outline is the per-chip indicator.
- **Each remove button**: `aria-label="Remove {tagLabel(tag)}"`, `type="button"`, `tabindex` managed by the roving set.
- **`LiveAnnouncer`** (`@angular/cdk/a11y`):
  - On add: `'{label} added'` — politeness `'polite'`, **announced immediately** (no debounce — the combobox 200ms debounce is for per-keystroke result counts, which v1 has none of).
  - On remove: `'{label} removed'` — `'polite'`, immediate.
  - On `max` reached: `'Maximum {max} tags reached'` — politeness `'assertive'` so it interrupts; **throttle** to once per ~500ms (a plain timestamp guard, not a signal effect) so mashing Enter against a full control does not flood the live region. This is the only announcement that needs throttling.
  - `clear()`: optional `'All tags removed'` (`'polite'`).
- **Placeholder** is visible only when there are no chips AND the input is empty — so it does not read alongside committed chips.
- **Dev-mode accessible-name warning**: mirror checkbox (checkbox.ts:364-370, 612-616) — warn once in dev if no projected label, no `ariaLabel`, and no `ariaLabelledby` is detectable.
- **AXE matrix** — must pass on:
  - default render (empty);
  - with one chip and with many chips;
  - empty (no chips, input empty);
  - inside `<tw-form-field>` with a projected `<tw-label>`;
  - disabled;
  - required + invalid (bound `FormControl` with `Validators.required`, marked touched);
  - `max` reached;
  - each `color` (8) and each `size` (5).
  - **Verify the `role="group"` + roving structure passes axe-core** (no `aria-required-children`/`aria-required-parent` failures — `role="group"` carries neither obligation, which is why it is the settled choice; still confirm empirically).

---

## Form integration

`TagsInputComponent<T> extends FormFieldControl<T[]>` and implements `ControlValueAccessor` via the **runtime** pattern (CLAUDE.md "ControlValueAccessor"; matches checkbox.ts:354-362):

```ts
private readonly ngControl = inject(NgControl, { optional: true, self: true });

constructor() {
  super();
  if (this.ngControl) {
    this.ngControl.valueAccessor = this;
  }
}
```

**Do not** add `NG_VALUE_ACCESSOR` to the providers array (circular DI on the same instance with `inject(NgControl, { self: true })`).

Implement the `FormFieldControl<T[]>` abstract members (mirror checkbox / input). **The four members whose names collide with inputs read the aliased inputs** (`idInput()` / `disabledInput()` / `requiredInput()`):

- `id: Signal<string>` — `computed(() => this.idInput() ?? this.hostId)` where `hostId = 'tw-tags-input-' + nextId++` (mirror checkbox.ts:343, 346).
- `value: Signal<readonly T[]>` — **`this.tags.asReadonly()`.** The single `value` signal serves both the public template-ref API and the contract member. Returns an empty array (never `null`) when there are no tags; this satisfies the abstract `Signal<T[] | null>` by covariance, and the float label reads `empty()` not `value()` (form-field.ts:474-481).
- `focused: Signal<boolean>` — driven by `FocusMonitor` on the host (checkbox pattern).
- `empty: Signal<boolean>` — **`computed(() => this.tags().length === 0 && this.inputText().trim().length === 0)`.** Per the task: empty = (no chips) AND (input text is blank). The float label floats up as soon as either a chip exists or text is being typed.
- `disabled: Signal<boolean>` — `computed(() => this.disabledInput() || this.cvaDisabled())` (mirror checkbox's `isDisabled`, checkbox.ts:374).
- `required: Signal<boolean>` — `requiredInput()` OR inferred from `Validators.required` on the bound `NgControl` (mirror checkbox.ts:434-440, using `_ngControlRev`).
- `errorState: Signal<boolean>` — merges per-instance `errorStateMatcher` input + `TW_ERROR_STATE_MATCHER` token + parent `NgForm`/`FormGroupDirective` submission tracking. **Copy checkbox.ts:443-452 + the `ngOnInit` subscriptions (checkbox.ts:569-609) literally.**
- `controlType = 'tags-input'` — form-field appends `tw-form-field-type-tags-input`.
- `userAriaDescribedBy: Signal<string | undefined>` — `computed(() => this.ariaDescribedby())`.
- `errors: Signal<Record<string, unknown> | null>` — mirrors `ngControl?.control?.errors` for `[twError match="…"]` (input.ts:286-290 pattern, recompute on `_ngControlRev`).
- `setDescribedByIds(ids)` — append to an internal `describedByIdsSignal` merged into the container's `aria-describedby` (checkbox.ts:553-555).
- `onContainerClick(event)` — **focus the text input** (the task's contract: clicking the form-field surface focuses the input so the user can start typing). No-op when disabled. Mirror checkbox.ts:559-565 but target the input element rather than the host.
- `setLabelledByIds` — override to push merged label ids onto the container via `aria-labelledby` (the group is a non-native control, so an explicit attribute is correct — match combobox's override).

Must work identically with template-driven `ngModel`, reactive `[formControl]`, and signal-based `[formField]`. Demo / test all three.

---

## Variants — `tv()` config

Single `tv()` config in `tags-input.ts`, `twMerge: true`, slot-based. Slots: `root`, `group` (the `role="group"` container — owns the `focus-within:` ring), `chip` (the `[twBadge]`-styled chip wrapper / `role="presentation"`), `chipLabel`, `removeButton`, `removeIcon`, `input`.

Mirror combobox's `trigger`/`input` split (combobox.ts:117-147): the `group` slot is the bordered surface with `focus-within:outline-2 focus-within:outline-offset-2` + a per-`color` `focus-within:outline-{color}-500` axis; the `input` slot is `flex-1 min-w-0 bg-transparent outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed`.

Sketch (the implementer finalizes exact tokens against CLAUDE.md):

```ts
const tagsInputVariants = tv(
  {
    slots: {
      root: 'relative inline-block w-full',
      // chips + input wrap together; the container owns the focus-within ring.
      group:
        'flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface text-fg transition-colors duration-normal motion-reduce:transition-none hover:border-border-strong focus-within:outline-2 focus-within:outline-offset-2',
      chip: 'max-w-full min-w-0', // styled by [twBadge]; this slot adds layout glue only
      chipLabel: 'truncate',
      // canonical outline ring — the remove button receives real DOM focus
      removeButton:
        'inline-flex items-center justify-center shrink-0 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      removeIcon: 'shrink-0',
      input:
        'flex-1 min-w-24 bg-transparent outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed',
    },
    variants: {
      size: {
        xs: { group: 'px-2 py-1 text-xs', removeButton: 'size-4', removeIcon: 'size-3' },
        sm: { group: 'px-2 py-1.5 text-sm', removeButton: 'size-4', removeIcon: 'size-3' },
        md: { group: 'px-3 py-2 text-sm', removeButton: 'size-5', removeIcon: 'size-3.5' },
        lg: { group: 'px-4 py-2.5 text-base', removeButton: 'size-5', removeIcon: 'size-4' },
        xl: { group: 'px-5 py-3 text-base', removeButton: 'size-6', removeIcon: 'size-4' },
      },
      color: {
        primary: { group: 'focus-within:outline-primary-500' },
        secondary: { group: 'focus-within:outline-secondary-500' },
        accent: { group: 'focus-within:outline-accent-500' },
        neutral: { group: 'focus-within:outline-border-strong' },
        info: { group: 'focus-within:outline-info-500' },
        success: { group: 'focus-within:outline-success-500' },
        warning: { group: 'focus-within:outline-warning-500' },
        error: { group: 'focus-within:outline-error-500' },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: {},
      },
      errorState: {
        true: { group: 'focus-within:outline-error-500 border-error-500' },
        false: {},
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
      disabled: false,
      errorState: false,
    },
  },
  { twMerge: true },
);
```

- `gap-1.5` between chips/input (CLAUDE.md gap scale — `gap-1.5` is the canonical icon+label gap and reads correctly for a chip cluster). If the chips feel cramped, `gap-1` is the only other permitted compact value — do not use `gap-2`+ here.
- `min-w-24` (6rem) on the input keeps the text input from collapsing to zero width when chips wrap to fill the row. `min-w-24` is a scale token (not an arbitrary value); if it does not resolve in the project's spacing scale, fall back to `min-w-[6rem]` with an inline comment and flag it `[CONFIRM]`.
- The `disabled` overlay uses `opacity-50 pointer-events-none cursor-not-allowed` (CLAUDE.md disabled pattern, matching combobox.ts:148-151).

### Chip styling via `[twBadge]` (decide the mapping — easy to forget)

Each chip wrapper element carries `[twBadge]` for its visual treatment. The mapping (state it in an inline comment beside the chip rendering):

- **`variant`**: fixed `'soft'` (badge's default — a soft chip reads as a removable token, not a status badge). Do not expose a chip-variant input in v1.
- **`color`**: follows the component `color()` input. (So a `color="info"` tags-input renders soft-info chips.) Keeps the chip accent consistent with the focus ring.
- **`size`**: derive from the component `size()` — pass `size()` straight through to `[twBadge]` (badge supports the full `TwSize` axis). The chip's internal padding/typography then scales with the control density.
- **`pill`**: `false` (default `rounded-md`) — matches the container's `rounded-md` corners.
- **`dismissible`**: **`false`** — the component supplies its own remove button inside the chip (badge's dismiss button has no tabindex control, see Context). The remove button is a child element styled by the `removeButton` slot, with `aria-label="Remove {label}"`.

---

## DOM structure (`role="group"` shape)

```html
<!-- host: <tw-tags-input> — carries [class]=rootClasses, [id]=id(); FocusMonitor target for focused + onTouched-on-blur -->
<div
  [class]="groupClasses()"
  role="group"
  [attr.aria-label]="ariaLabel() || null"
  [attr.aria-labelledby]="effectiveAriaLabelledby() || null"
  [attr.aria-describedby]="effectiveAriaDescribedby() || null"
  [attr.aria-disabled]="disabled() || null"
  [attr.aria-required]="required() || null"
  [attr.aria-invalid]="errorState() || null"
  (keydown)="onGroupKeydown($event)"
>
  @for (tag of tags(); track $index; let i = $index) {
    <span role="presentation" twBadge variant="soft" [color]="color()" [size]="size()" [class]="chipClasses()">
      <span [class]="chipLabelClasses()">{{ tagLabel()(tag) }}</span>
      <button
        type="button"
        [class]="removeButtonClasses()"
        [attr.tabindex]="activeChipIndex() === i ? 0 : -1"
        [attr.aria-label]="'Remove ' + tagLabel()(tag)"
        [disabled]="disabled()"
        (click)="removeTag(i)"
        (focus)="activeChipIndex.set(i)"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" [class]="removeIconClasses()">
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"/>
        </svg>
      </button>
    </span>
  }
  <input
    #inputEl
    type="text"
    [class]="inputClasses()"
    [attr.tabindex]="activeChipIndex() === null ? 0 : -1"
    [attr.id]="inputId()"
    [attr.name]="name() || null"
    [placeholder]="placeholderVisible() ? (placeholder() ?? null) : null"
    [disabled]="disabled()"
    [value]="inputText()"
    (input)="onInput($event)"
    (keydown)="onInputKeydown($event)"
    (paste)="onPaste($event)"
    (focus)="activeChipIndex.set(null)"
  />
</div>
```

(Copy the X-glyph SVG path verbatim from badge.ts:195. `track $index` is correct here because tags can be duplicates when `allowDuplicates=true` — tracking by value would collide; `$index` is stable for the chip list. The single `(keydown)` on the group handles arrow/Home/End/Delete/Backspace-on-chip; the input's own `(keydown)` handles Enter/separator/Escape/Backspace-on-empty — or route everything through one group handler that branches on `event.target`. Decide one; the split shown keeps input-specific keys local.)

The host element carries `host: { '[class]': 'rootClasses()', '[id]': 'id()' }` and is the `FocusMonitor` target (for `focused` + `onTouched`-on-blur). Keep the group as the inner ring-owning element so `focus-within:` fires on either a chip button or the input gaining focus.

---

## Implementation notes

- **Source-of-truth signal:** `private readonly tags = signal<T[]>([])`. The public `value` signal **is** `tags.asReadonly()` (typed `Signal<readonly T[]>`) — it serves both the template-ref API and the `FormFieldControl.value` contract member. There is **no** separate null-when-empty value signal (the float label reads `empty()`, not `value()`; see Form integration). All array writes use `tags.set(freshArray)` — never `mutate`.
- `inputText = signal<string>('')` updated on `(input)`; cleared on commit. Expose `.asReadonly()` as the public `inputText` signal.
- `activeChipIndex = signal<number | null>(null)` — the roving position. **`null` = input is active.** Use a plain `signal`, not `linkedSignal` — it is interaction state, not derived-from-a-source. (After a removal that shrinks the array, clamp `activeChipIndex` inside `removeTag` synchronously — do NOT do it in an `effect()` that reads `tags()` and writes `activeChipIndex`, which would risk a cycle. The clamp happens in the same method that mutates `tags`.)
- **No signal cycles in `effect()`.** All state transitions (add, remove, clear, keyboard, paste) are synchronous methods triggered by DOM events — not effects. The only effect-like work is the `FocusMonitor` subscription (a side effect leaving the signal graph) and the dev-mode name warning in `afterNextRender`. Do **not** introduce an effect that reads `tags()`/`activeChipIndex()` and writes either.
- `placeholderVisible = computed(() => this.tags().length === 0 && this.inputText().length === 0)`.
- Accessor inputs: module-level defaults — `const defaultCreateTag = (text: string): unknown => text;` and `const defaultTagLabel = (tag: unknown): string => String(tag);` cast to the generic at the input declaration (mirror combobox.ts:78-86, 355-358). `createTag = input<TwTagFactory<T>>(defaultCreateTag as TwTagFactory<T>)`.
- `compareWith = input<(a: T, b: T) => boolean>(Object.is)` — verbatim from combobox.ts:433.
- `id` generation: `let nextId = 0;` module-level; `hostId = 'tw-tags-input-' + nextId++`; `id = computed(() => this.idInput() ?? this.hostId)`; `inputId = computed(() => this.id() + '-input')`.
- `FocusMonitor` on the host + `onTouched`-on-blur + `_ngControlRev` bump — copy checkbox.ts:569-602.
- Parent-form submission tracking + the `ngControl.control` status/value subscription — copy checkbox.ts:592-609.
- `LiveAnnouncer` injected; called from `addTag` (success), `removeTag`, the `max`-block path (throttled, assertive), and optionally `clear`.
- `OnPush`, standalone (do not set `standalone: true`), `inject()` for DI, `host` object only (no `@HostBinding`/`@HostListener`), native control flow (`@if`/`@for`), no `ngClass`/`ngStyle`.
- No `@angular/animations`. No new keyframes. (Chip enter/leave animation is optional and out of scope for v1 — if added later, use `animate.enter`/`animate.leave` with a theme keyframe, per CLAUDE.md.)

---

## Usage examples

Simplest — free-text strings, no form binding:

```html
<tw-tags-input (valueChange)="onTags($event)" placeholder="Add a label…" />
```

Template-driven forms:

```html
<tw-tags-input name="labels" [(ngModel)]="labels" placeholder="Add a label…" />
```

Reactive forms inside a form-field with label, hint, error, and a `max`:

```html
<tw-form-field>
  <tw-label>Recipients</tw-label>
  <tw-tags-input formControlName="recipients" [max]="10" placeholder="Type an email and press Enter" required />
  <tw-hint>Up to 10 recipients.</tw-hint>
  <tw-error match="required">At least one recipient is required.</tw-error>
</tw-form-field>
```

Signal-based forms:

```html
<tw-tags-input [formField]="filterForm.keywords" placeholder="Add a keyword" />
```

Semicolon + comma separators, allow duplicates:

```html
<tw-tags-input [separatorKeys]="['Enter', ',', ';']" allowDuplicates placeholder="paste comma-separated values" />
```

Case-insensitive dedup:

```html
<tw-tags-input [compareWith]="caseInsensitiveCompare" placeholder="tags (case-insensitive)" />
```

```ts
caseInsensitiveCompare = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();
```

Object tags (custom `createTag` + `compareWith` + `tagLabel`):

```html
<tw-tags-input
  [createTag]="makeTag"
  [tagLabel]="tagToLabel"
  [compareWith]="sameTagId"
  (tagAdded)="onTagAdded($event)"
/>
```

```ts
makeTag = (text: string): Tag => ({ id: crypto.randomUUID(), name: text });
tagToLabel = (t: Tag): string => t.name;
sameTagId = (a: Tag, b: Tag): boolean => a.name.toLowerCase() === b.name.toLowerCase();
```

Disabled:

```html
<tw-tags-input disabled [(ngModel)]="lockedTags" />
```

Template-ref + commit-on-blur:

```html
<tw-tags-input #t="twTagsInput" addOnBlur placeholder="Add tags" />
<button twButton (click)="t.clear()">Clear all</button>
<p>{{ t.value().length }} tag(s)</p>
```

---

## Test plan (`tags-input.spec.ts`)

Vitest. **No `fakeAsync` / `tick`.** Use `async/await` with `fixture.whenStable()`. `vi.spyOn` for spies (including the injected `LiveAnnouncer`). `vi.useFakeTimers()` only if the `max`-announce throttle timing needs control. Set signal inputs via `fixture.componentRef.setInput('name', value)` (use the **alias** names — `'disabled'`, `'required'`, `'id'` — for the aliased inputs). Always `fixture.detectChanges()` after setting inputs / triggering interactions. **Assert against the DOM (chip elements, attributes, element `value`) and emitted payloads — not internal signals.** Remember the dist-build dependency (`npm run watch:lib` alongside `npm test`, or `npm run build:lib` first) — a missing `dist/ngx-tw/` produces cryptic TestBed failures.

**Helpers**
- A tiny host component wrapping `<tw-tags-input …>`; variants binding `[(ngModel)]`, `[formControl]`, and `[formField]`.
- `getChips(fixture)` → all chip wrappers (`[role="presentation"]` carrying `[twBadge]`).
- `getInput(fixture)` → `fixture.nativeElement.querySelector('input[type="text"]')`.
- `getRemoveButtons(fixture)` → all `button[aria-label^="Remove "]`.
- `type(input, text)` → set `input.value`, dispatch `input`.
- `key(el, k)` → dispatch `keydown` with the given key.

**Mandatory groups**

1. **Rendering** — mounts with defaults (no chips, input present); renders each `color` (8) and `size` (5) without errors; the container carries `role="group"`; the `<input>` is present.
2. **Inputs change DOM** — `placeholder` shows only with no chips and empty input (add a chip → placeholder gone); `disabled` (via alias) blocks typing/commit/remove and sets `aria-disabled`; `required` (via alias) sets `aria-required`; `size`/`color` flow to the chips' `[twBadge]`.
3. **Commit** — Enter commits the typed text → a chip appears, `tagAdded` + `valueChange` fire with the right payload; comma commits; a separator char is not inserted into the input; empty/whitespace Enter is a no-op (no chip, no event).
4. **Dedup & max** — duplicate with `allowDuplicates=false` is dropped (no `tagAdded`, input cleared); with `allowDuplicates=true` it is kept; `max` reached blocks the commit, retains input text, and calls `LiveAnnouncer.announce` (spy) with the max message.
5. **Paste** — pasting `'a,b,c'` creates three chips with three `tagAdded` events; trimming + empty-piece skipping per the paste table; paste exceeding `max` commits up to the cap then blocks.
6. **Keyboard navigation** — ArrowLeft from the input (caret 0 / empty) focuses the last chip's remove button; ArrowRight from the last chip returns focus to the input; Home/End on a chip jump to first chip / input; assert `document.activeElement` after each (`await fixture.whenStable()`).
7. **Backspace two-step** — Backspace on an empty input highlights the last chip (focus moves, no removal); a second Backspace removes it (`tagRemoved` fires); Backspace on a non-empty input does not remove a chip (native char delete); Backspace on an empty input with no chips is a no-op.
8. **Delete** — Delete on a focused chip removes it immediately (`tagRemoved`).
9. **Escape** — Escape on a non-empty input clears the in-progress text (no chip removed); Escape on a highlighted chip cancels the highlight and returns focus to the input without removing.
10. **Focus restoration** — remove a middle chip → focus lands on the chip now occupying that index; remove the last chip → focus lands on the previous chip; remove the only chip → focus lands on the input. Assert `document.activeElement`.
11. **Remove button accessible names** — each remove button has `aria-label="Remove {label}"` reflecting `tagLabel`; object-tag config uses the custom label.
12. **Single tab stop** — exactly one element in the control has `tabindex="0"` at any time (the input by default; a chip when highlighted); all others `tabindex="-1"`.
13. **Outputs** — `valueChange` emits a fresh array on add/remove/clear; `tagAdded` does NOT fire for dropped duplicates / blocked-by-max / empty commits; `tagRemoved` does NOT fire on `clear()`; **none** fire on `writeValue`.
14. **Public API** — `addTag('x')` returns `true` and adds; returns `false` for empty/duplicate/max; `removeTag(0)` and `removeTag(tagValue)` both work; `clear()` empties and emits `valueChange([])`; `focus()` focuses the input.
15. **CVA contract** — `writeValue(['a','b'])` renders two chips, does **not** emit; `writeValue(null)` clears, no emit; `writeValue` keeps duplicates/oversize as-is (no dedup/no max truncation); user add calls the registered `onChange` with `T[]`; blur calls `onTouched`; `setDisabledState(true)` blocks interaction and applies disabled styling.
16. **Three form strategies** — round-trip with `[(ngModel)]`, `[formControl]` (patch value → chips render; user add → `form.value` updates), and `[formField]` (signal forms).
17. **FormFieldControl / float-label** — `empty()` is true only when no chips AND input blank; typing a character (no commit) floats the label (assert the form-field's floated-label state) and flips `empty()` false; a chip alone also floats the label; `controlType` is `'tags-input'` and the form-field host gets `tw-form-field-type-tags-input`; `setDescribedByIds` propagates to the container's `aria-describedby`; `[twError match="required"]` shows only when `errors()` has `required`.
18. **Accessibility** — `role="group"` present; `aria-invalid="true"` on the container when `errorState()` is true (bound `FormControl` + `Validators.required`, marked touched); `LiveAnnouncer.announce` spied on add / remove / max; remove buttons take the canonical `focus-visible:outline-*` (query class presence).
19. **Class merging** — consumer `class="my-class"` on the host merges via twMerge alongside the internal root classes.
20. **Dev-mode warning** — no accessible name (no label / aria-label / aria-labelledby) logs one `console.warn` (spy); providing `aria-label` suppresses it.

Target: ~55–75 `it()` blocks.

---

## Demo page

Follow-up (listed for completeness). Create under `projects/demo/src/app/routes/tags-input/`. Examples: basic free-text; reactive forms inside `<tw-form-field>` with `max` + required + error; template-driven; signal-based; custom separators + allow duplicates; case-insensitive dedup; object tags (custom `createTag`/`tagLabel`/`compareWith`); disabled; all colors; all sizes. Page wrapper mirrors `input-page.component.ts`. Sidebar entry: insert **"Tags Input"** alphabetically.

---

## Registration — all FOUR config edits (plus the per-directory boilerplate)

Omitting any of edits 2–4 makes CI **silently skip** the new specs (project memory note). Do all of these — the exact insertion points are shown (verified against the current files):

1. **`projects/ngx-tw/src/public-api.ts`** — add `export * from '@cdevhub/ngx-tw/tags-input';` in the form-control cluster, after the `number-input` line (currently line 37, between `number-input` and `spinner`):
   ```ts
   export * from '@cdevhub/ngx-tw/file-upload';
   export * from '@cdevhub/ngx-tw/number-input';
   export * from '@cdevhub/ngx-tw/tags-input';   // ← add
   export * from '@cdevhub/ngx-tw/spinner';
   ```
2. **`projects/ngx-tw/tsconfig.lib.json`** — add `"tags-input/**/*.ts",` to the `include` array. The array is roughly alphabetical; insert after `"tabs/**/*.ts"` (line 59) / before `"textarea/**/*.ts"` (`tags-input` sorts after `tabs`):
   ```jsonc
   "tabs/**/*.ts",
   "tags-input/**/*.ts",   // ← add
   "textarea/**/*.ts",
   ```
   (Include order is functionally irrelevant — alphabetical is just tidy. The only hard requirement is that the glob is present.)
3. **`projects/ngx-tw/tsconfig.spec.json`** — add `"tags-input/**/*.spec.ts",` to `include` (append near the other form-control specs, e.g. after `"number-input/**/*.spec.ts",` line 46, or at the end — ordering is not enforced here):
   ```jsonc
   "number-input/**/*.spec.ts",
   "tags-input/**/*.spec.ts",   // ← add
   ```
4. **`angular.json`** — the `ngx-tw` test target's `include` array — add `"../tags-input/**/*.spec.ts",` (after `"../number-input/**/*.spec.ts",` line 146). **This is the one people forget; without it CI silently skips the new specs.**
   ```jsonc
   "../number-input/**/*.spec.ts",
   "../tags-input/**/*.spec.ts",   // ← add
   ```

Plus the per-directory files (in File layout): `index.ts` re-exporting `TagsInputComponent` + the public types, and `ng-package.json` = `{ "lib": { "entryFile": "index.ts" } }`.

The root `tsconfig.json` `@cdevhub/ngx-tw/*` path alias is a **wildcard** → no per-entry edit needed there. After landing all four edits, run `npx ng test ngx-tw` (no `--include`) once to confirm the new specs are actually picked up.

---

## Open decisions for the maintainer

The four LOCKED DECISIONS (free-text-only scope; single-tab-stop roving chip strip; the `createTag`/`tagLabel`/`compareWith` value API; runtime CVA + `FormFieldControl`) are **settled** — not open. The items below are genuinely deferred or need a quick confirm.

1. **Autocomplete / suggestion overlay is v2.** v1 is free-text only — no CDK Overlay, no listbox. A v2 surface would add an `options` input + an overlay listbox grafted onto this same value/chip model (the way number-input defers percent-style). **[DEFERRED.]**
2. **Custom chip template `*twTagsInputChip` is v2.** A consumer template fights the component-owned remove-button + roving-tabindex focus model. Deferred like file-upload's bounded item-template decision. **[DEFERRED.]**
3. **ARIA role is `role="group"` (settled).** Chosen over `role="grid"` because it is verifiable-by-construction (Material is not installed to confirm MatChipGrid's exact DOM) and carries no `aria-required-children` obligation. The literal grid shape is a documented one-line contingency (wrap chips + input in `row`/`gridcell`) if a review insists — but v1 ships `group`. **[SETTLED — not open.]**
4. **`min-w-24` on the input slot.** Keeps the input from collapsing when chips wrap. If `min-w-24` does not resolve in the project's spacing scale, fall back to the arbitrary `min-w-[6rem]` with an inline comment. **[CONFIRM the token resolves.]**
5. **String dedup is case-sensitive by default** (`Object.is`). Case-insensitive is a one-line `compareWith`. If the team wants case-insensitive *by default*, change the default — but case-sensitive matches `Object.is` and is the least-surprising baseline. **[CONFIRM.]**
6. **`addOnBlur` defaults to `false`.** Conservative (commit only on explicit gesture); matches Material's chip-input default and keeps the boolean CLAUDE.md-clean. Flip to `true` if the team prefers blur-commits. **[CONFIRM.]**
7. **Paste merges with current input text when it has no separator** (paste a fragment mid-typing). The simpler "always split/commit ignoring current input" is acceptable if preferred — state whichever ships. **[CONFIRM.]**
8. **Chip mapping**: `[twBadge]` chips are `variant='soft'`, `color=color()`, `size=size()`, `pill=false`, `dismissible=false` (component-owned remove button). No chip-level variant input in v1. **[ASSUMED SAFE.]**
9. **`writeValue` is authoritative** — no dedup, no `max` truncation. The next user commit re-applies the rules against the current set. **[ASSUMED SAFE — mirrors number-input/file-upload.]**

---

## Constraints (from CLAUDE.md — non-negotiable)

- Element selector `tw-tags-input`; class name `TagsInputComponent` (no `Tw` prefix on the class). Exported **types** carry the `Tw` prefix (`TwTagAddedEvent`, `TwTagFactory`, …).
- Standalone — do not set `standalone: true`. `ChangeDetection.OnPush`. `host` object for host bindings — never `@HostBinding`/`@HostListener`. `inject()` for DI. Native control flow only. No arrow functions in templates.
- Signal API exclusively: `input()` / `output()` / `computed()`; writable `signal()` for `tags`, `inputText`, `activeChipIndex`, `cvaDisabled`, the rev signals. **No `model()`** (CVA owns the round-trip). No `mutate`. **No signal cycles in `effect()`** — all state transitions are event-driven methods; the only effect is the `FocusMonitor` subscription (a side effect leaving the graph) and the `afterNextRender` dev-mode warning.
- **CVA via runtime assignment** (`this.ngControl.valueAccessor = this`) — never a static `NG_VALUE_ACCESSOR` provider (the component injects `NgControl { self }` for `TW_ERROR_STATE_MATCHER`). `forwardRef` in the `TW_FORM_FIELD_CONTROL` provider.
- `extends FormFieldControl<T[]>` (checkbox is `extends`; combobox's `implements` is the outlier — follow checkbox). **The abstract identifiers `value` / `disabled` / `required` / `id` are the contract members; the inputs are aliased (`disabledInput`/`requiredInput`/`idInput`), and `value` has no input (it is `tags.asReadonly()`).** `controlType = 'tags-input'`. `empty` = no chips AND blank input.
- Semantic / surface-fg-border tokens only — `bg-surface`, `text-fg`, `border-border`, `hover:border-border-strong`, `text-fg-muted`, `text-fg-subtle`, `focus-within:outline-{color}-500`. No raw palette colors. No raw `neutral-*` for structure.
- Visual Design System: `rounded-md` container + chips + remove buttons; container padding on the inline-padding scale per `size`; `gap-1.5` (or `gap-1`) between chips; `text-xs`/`text-sm`/`text-base` per size; canonical `focus-visible:outline-2 outline-offset-2 outline-primary-500` on remove buttons (real DOM focus → canonical ring, NOT the command-palette background-shift carve-out); container `focus-within:` ring per combobox; `transition-colors duration-normal motion-reduce:transition-none`; `disabled` → `opacity-50 pointer-events-none cursor-not-allowed`; remove-button icon on the glyph scale (`size-3` / `size-3.5` / `size-4`).
- `tv()` with `twMerge: true`, slot-based, defines `defaultVariants`, `color: TwColor` + `size: TwSize` from `@cdevhub/ngx-tw/core`. No exported variant config.
- Input list is **flat** (no config object) — covered by the form-control input-count exception (combobox carries 30 flat inputs).
- No `@angular/animations`. No new theme keyframes.
- Vitest, no `fakeAsync` / `tick`. Assert DOM + emissions, not internal signals.
- Every `input()`, `output()`, public method, and public signal carries a one-line JSDoc; Compodoc renders the tables.

---

## Acceptance criteria

- `<tw-tags-input>` round-trips a real `T[]` (default `string[]`) through template-driven, reactive, and signal forms; the form value is always an array, never a bare value, never `null` outbound.
- The whole control is a **single tab stop**; ArrowLeft/Right/Home/End traverse chips ↔ input with real DOM focus; Delete and the two-step Backspace remove chips; Escape clears the in-progress text or cancels a chip highlight; Enter and the separator key(s) commit; paste splits on separators.
- Focus restoration after removal follows "next chip, else previous chip, else the text input" — deterministically.
- Each remove button is named `Remove {label}`; dedup (per `compareWith`, default `Object.is`, case-sensitive for strings), `max`, and trimming behave per the edge-case table; `writeValue` is authoritative (no dedup/no max truncation, no emit).
- Inside `<tw-form-field>`: the float label floats when a chip exists or text is being typed (`empty` = no chips AND blank input); error chrome flows through `errorState` / `errors`; clicking the form-field surface focuses the input.
- `LiveAnnouncer` announces add / remove immediately and `max`-reached assertively (throttled); the combobox 200ms debounce is **not** carried.
- AXE clean across the matrix (default, with chips, empty, in form-field with label, disabled, required+invalid, max-reached, every color/size) — the `role="group"` + roving structure carries no `aria-required-children` obligation; confirm empirically.
- Every public API member has a one-line JSDoc; Compodoc tables are complete.
- All Vitest blocks pass (confirm all four registration edits landed by running `npx ng test ngx-tw` with no `--include`).
- `ng build ngx-tw` clean; the `ngx-tw/tags-input` secondary entry point bundles.
