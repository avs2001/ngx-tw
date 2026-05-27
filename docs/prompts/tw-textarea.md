# Prompt: Build `textarea[twTextarea]` for ngx-tw

> Source of truth: this document. Read it end-to-end before opening any code file.

---

## Context

Before writing code, read:

- `.claude/CLAUDE.md` — conventions, semantic tokens, focus-ring rules, animation rules, JSDoc requirements.
- `projects/ngx-tw/input/input.ts` — **closest peer**. `TextareaDirective` extends it; its conventions are non-negotiable.
- `projects/ngx-tw/input/input.spec.ts` — test patterns to mirror (Vitest, form-strategy hosts, no `fakeAsync`).
- `projects/ngx-tw/form-field/form-field.ts` — `FormFieldControl`, `TW_FORM_FIELD_CONTROL`, `controlType` mapping.
- `projects/ngx-tw/core/index.ts` — `TwSize`, `TW_ERROR_STATE_MATCHER`.
- `@angular/cdk/text-field` — `CdkTextareaAutosize` (composed via `hostDirectives`).

---

## What to build

A new **directive** that adapts a native `<textarea>` into an ngx-tw form-field-compatible control with:

1. Everything `InputDirective` provides for textareas (form-field integration, error state, autofill tracking, focus monitor, `FormFieldControl<string>` contract, ARIA wiring).
2. **Autosize** support (composed from CDK's `CdkTextareaAutosize` — never reinvented).
3. A `resize` axis that controls the user-driven resize handle.
4. A `rows` / `minRows` / `maxRows` configuration with clear interactions between rows and autosize.
5. A `maxLength` input that mirrors to the native attribute and exposes a `valueLength` signal so consumers can show a "X / N" hint with one binding.

The directive **extends `InputDirective`** so it inherits the entire `FormFieldControl` contract, error-state machinery, autofill tracking, focus monitor, ARIA wiring, and the size/error styling pipeline. It then layers textarea-specific behavior on top.

### What it does NOT do

- It does **not** implement `ControlValueAccessor`. Like `InputDirective`, value I/O stays with Angular's native value accessors so the same element works with template-driven `ngModel`, reactive `FormControl`, and signal-forms `formField` without any directive-level glue. (The Input overview is explicit about this: "The directive deliberately does *not* implement `ControlValueAccessor`.")
- It does **not** reimplement autosize measurement (no `style.height = 'auto'` + `scrollHeight` loop). It composes `CdkTextareaAutosize` via `hostDirectives`.
- It does **not** render any DOM (it's a directive on `<textarea>`).
- It does **not** ship a character-count UI element. It exposes a `valueLength` signal; consumers render the hint themselves with `<span twHint align="end">{{ bio().length }} / 240</span>` — the canonical pattern already used in the input demo.

---

## File layout

Create under `projects/ngx-tw/textarea/`:

| File | Role |
|---|---|
| `textarea.ts` | `TextareaDirective extends InputDirective`, `tv()` config for textarea-specific styling. |
| `index.ts` | Re-exports `TextareaDirective` (and only that). |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |
| `textarea.spec.ts` | Vitest suite — see Test plan. |

Also: add `export * from 'ngx-tw/textarea';` to `projects/ngx-tw/src/public-api.ts` immediately after `export * from 'ngx-tw/input';` (the file is in creation order, not alphabetical — placing it next to the input keeps the visual proximity matching the conceptual one). Do not reorder any unrelated lines.

---

## Selector and class

- Selector: `textarea[twTextarea]`. Attribute directive on a native `<textarea>`. Stacking `twInput` and `twTextarea` on the same element is unnecessary and unsupported — `twTextarea` is the dedicated textarea entry point.
- Class name: `TextareaDirective` (Angular CLI convention; no `Tw` prefix).
- `exportAs: 'twTextarea'`.

### Provider override

`TextareaDirective` re-declares the `TW_FORM_FIELD_CONTROL` provider with `useExisting: TextareaDirective` (with `forwardRef` if needed). This makes the form-field resolve to the subclass, so future textarea-specific behavior (e.g., min-height adjustments based on `rows`) can be wired without touching the parent.

### Inheriting from `InputDirective`

`extends InputDirective`. This gives us for free:
- `_isTextarea` is already `true` because we mount on `<textarea>`.
- `controlType = 'textarea'` falls out naturally — the form-field appends `tw-form-field-type-textarea`.
- `disabledInput`, `requiredInput`, `readonlyInput`, `errorStateMatcher`, `userAriaDescribedByInput`, `userAriaLabelledbyInput`, `size` — all inherited as-is.
- `_value` signal, `_focused`, `_autofilled`, error-state machinery, `id` generation, `setDescribedByIds`, `setLabelledByIds`, `onContainerClick`, `focus()`.
- `_onInput` host listener (already in the parent's `host` block).
- The `(input)` listener inherits via the parent `@Directive` decorator's `host` block — child `@Directive` decorators merge host bindings, so we redeclare only what we add (autosize trigger, `[maxlength]` attribute).

> Verify host metadata merging by inspecting the compiled output if behavior diverges; the canonical Angular pattern is for the child to redeclare its full host block. We will redeclare the full host block in the child for safety, copying the parent's bindings.

---

## Public API checklist

All inherited inputs (size, disabled, required, readonly, errorStateMatcher, aria-describedby, aria-labelledby, id) remain available with their existing semantics. **New** inputs:

- [ ] `autosize` — `boolean`, default `false`. When `true`, the textarea grows with content (via `CdkTextareaAutosize`). When `false`, the native `rows` controls height and the user can resize via the handle (per `resize`).
- [ ] `minRows` — `number`, default `1`. Forwarded to `CdkTextareaAutosize.cdkAutosizeMinRows` when `autosize` is `true`. Ignored otherwise.
- [ ] `maxRows` — `number | undefined`, default `undefined`. Forwarded to `CdkTextareaAutosize.cdkAutosizeMaxRows` when `autosize` is `true`. Past `maxRows`, the textarea scrolls. Ignored otherwise.
- [ ] `rows` — `number`, default `3`. Applied to the native `rows` attribute. When `autosize` is `true`, browsers still honor `rows` as the *initial* render height, so we forward it for first-paint correctness.
- [ ] `resize` — `'none' | 'vertical' | 'both'`, default `'vertical'`. Maps to the native CSS `resize` property via a class:
  - `'none'` → `resize-none`
  - `'vertical'` → `resize-y`
  - `'both'` → `resize` (both axes)
  - **`'horizontal'` is intentionally not supported.** Horizontal resize breaks form-field layout (the textarea overflows its wrapper) and is not a real user need. If a consumer needs it, they apply `resize-x` manually. Document this in the API table.
  - When `autosize` is `true`, the directive forces `resize-none` regardless of the `resize` input (autosize takes over height; user-resize would fight CDK on every keystroke). Document this interaction.
- [ ] `maxLength` — `number | undefined`, default `undefined`. Forwarded to the native `maxlength` attribute when set. Also exposed via the `valueLength` signal so consumers can wire a character counter with `{{ ta.valueLength() }} / {{ ta.maxLength() }}`.

**Public signals** (new):

- [ ] `valueLength` — `Signal<number>`. The current `_value` length. Updates on every `input` event. Useful for character counters and remaining-char hints.

**Inherited signals** (re-document, do not re-declare):

`id`, `value`, `focused`, `empty`, `disabled`, `required`, `errorState`, `controlType`, `errors`.

**Inherited methods** (re-document):

`focus(options?)`, `setDescribedByIds(ids)`, `setLabelledByIds(ids)`, `onContainerClick(event)`.

**New methods:**

- [ ] `resizeToFitContent(force = false)` — triggers a CDK autosize recalculation; thin proxy to the injected `CdkTextareaAutosize.resizeToFitContent`. Useful after programmatic value changes that bypass `(input)` (e.g., paste from clipboard via API). No-op when `autosize` is `false`.

### Input-cap exception

Inherited inputs: 8 (size, disabled, required, readonly, errorStateMatcher, aria-describedby, aria-labelledby, id). New inputs: 6 (autosize, minRows, maxRows, rows, resize, maxLength). Total ~14 — over the 5-6 cap. **Qualifies for the form-control exception** codified in CLAUDE.md (canonical: `checkbox` at 12+). No extra documentation needed — the exception applies directly.

---

## Styling

Reuse the existing `inputVariants` `tv()` config from `InputDirective` by **inheriting `classes()`** from the parent — do not redefine. Add a small textarea-specific `tv()` config for the `resize` axis:

```ts
const textareaVariants = tv({
  base: '',
  variants: {
    resize: {
      none: 'resize-none',
      vertical: 'resize-y',
      both: 'resize',
    },
  },
  defaultVariants: { resize: 'vertical' },
}, { twMerge: true });
```

**Short-circuit the autosize / resize conflict in the computed**, never rely on `tv` variant emission order or `twMerge` last-wins:

```ts
readonly textareaClasses = computed(() =>
  this.autosize()
    ? textareaVariants({ resize: 'none' })
    : textareaVariants({ resize: this.resize() }),
);
```

Combine in the host `[class]` binding:

```ts
host: {
  '[class]': 'classes() + " " + textareaClasses()',
  // ... other bindings, see below
}
```

Add an explicit test: `autosize=true` + `[resize]="'both'"` → host className contains `resize-none` and does not contain `resize-y`/bare `resize` utility.

**Min-height on standalone textarea.** The native `rows` attribute controls initial height, but if a consumer styles via CSS and zeros it out, the textarea collapses. We do **not** add a Tailwind `min-h-*` class — the native `rows` attribute is the canonical mechanism and consumers can override via `class="min-h-X"` (twMerge handles it).

---

## Host bindings (full block, redeclared on the child)

```ts
host: {
  '[class]': 'classes() + " " + textareaClasses()',
  '[attr.id]': 'id()',
  '[attr.rows]': 'rows()',
  '[attr.maxlength]': 'maxLength() ?? null',
  '[disabled]': 'disabled()',
  '[attr.aria-invalid]': 'errorState() || null',
  '[attr.aria-required]': 'required() || null',
  '(input)': '_onInput()',
}
```

Note: `type` attribute is omitted — textarea doesn't have a `type` attribute. `_isTextarea` is `true`, so the parent's `[attr.type]` binding (which already evaluates to `null` on textareas) wouldn't fire anyway, but since we're redeclaring the host block we omit it entirely for clarity.

---

## `hostDirectives` composition with CDK

```ts
@Directive({
  selector: 'textarea[twTextarea]',
  exportAs: 'twTextarea',
  hostDirectives: [
    {
      directive: CdkTextareaAutosize,
      inputs: [
        'cdkAutosizeMinRows: minRows',
        'cdkAutosizeMaxRows: maxRows',
      ],
    },
  ],
  providers: [
    { provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => TextareaDirective) },
  ],
  host: { /* see above */ },
})
```

The CDK directive is always mounted; we toggle its `enabled` setter via an `effect` based on our `autosize` input. Inject `CdkTextareaAutosize` with `{ self: true, optional: true }` (canonical Material/CDK consumer idiom — `self` scopes to the element injector, `optional` falls back gracefully if hostDirectives didn't mount):

```ts
private readonly cdkAutosize = inject(CdkTextareaAutosize, { self: true, optional: true });

constructor() {
  super();
  effect(() => {
    if (this.cdkAutosize) {
      this.cdkAutosize.enabled = this.autosize();
    }
  });
}
```

This matches how `MatInput` consumes the CDK autosize directive.

### `valueLength`

```ts
readonly valueLength = computed(() => this.value()?.length ?? 0);
```

`value()` is inherited from `InputDirective` and updates on every `(input)` event. No additional listener needed.

---

## ARIA / a11y

- `aria-invalid`, `aria-required`, `aria-describedby`, `aria-labelledby`, `aria-multiline` — inherited via `InputDirective` for the first four; `aria-multiline` is implicit on `<textarea>` (no need to set explicitly).
- Form-field integration: form-field calls `setDescribedByIds([…])` with the union of hint/error ids; the inherited implementation writes the merged list onto the textarea. Same for `setLabelledByIds`.
- Keyboard: Enter inserts a newline (native textarea behavior). Tab moves focus. Both are native behaviors — no JS overrides.
- Focus ring: inherited from `inputVariants` — canonical `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
- Disabled: native `disabled` attribute + `opacity-50 cursor-not-allowed` styling — inherited.
- Read-only: native `readonly` attribute — inherited.

---

## Form integration

No CVA. The directive does not own value I/O. Angular's `DefaultValueAccessor` (already installed by `FormsModule` / `ReactiveFormsModule`) attaches to `<textarea>` natively and handles `ngModel`, `FormControl`, `formControlName`, and signal-forms `formField` bindings. The test plan exercises all three idioms.

`required` inference from `Validators.required`, `disabled` reflection from `ngControl.disabled`, `errorState` driven by `TW_ERROR_STATE_MATCHER` + parent form submission — all inherited from `InputDirective`.

---

## Test plan (Vitest)

Mirror `input.spec.ts` exactly. Mandatory groups:

1. **Rendering** — mounts on `<textarea twTextarea>`, generates unique id, applies standalone styling (border + rounded), `rows="3"` default.
2. **Size axis (standalone)** — each `TwSize` maps to the correct `px-/py-/text-` triple (re-asserted because we extend, not just inherit).
3. **Size axis (in form-field)** — `p-0 border-0` when wrapped.
4. **rows / minRows / maxRows** —
   - `rows` reflects to the native `rows` attribute.
   - `minRows` / `maxRows` are forwarded to the underlying `CdkTextareaAutosize` (assert by reading the injected instance's inputs via debugElement, or by feature-test: with `autosize=true` and `minRows=1`, the rendered height is at least one line; with `maxRows=2` and 5 lines of content, the rendered height does not exceed two lines + scrollbar appears).
5. **autosize=false (default)** — `rows` controls height; CDK autosize directive is mounted but disabled (assert `cdkAutosize.enabled === false`).
6. **autosize=true** — `cdkAutosize.enabled === true`. **Do not assert pixel heights** — jsdom returns `scrollHeight = 0` for textareas. Deterministic surfaces: assert (a) `cdkAutosize.enabled` reflects the input value, (b) `resizeToFitContent()` proxies to the CDK directive's method via `vi.spyOn`, (c) `minRows` / `maxRows` are forwarded to the CDK directive's instance.
7. **resize axis** — each value applies the correct Tailwind class. `autosize=true` forces `resize-none` regardless of `resize` value.
8. **maxLength** — sets native `maxlength` attribute when defined; removes it when `undefined`. `valueLength` signal updates on input.
9. **valueLength signal** — starts at 0; after `fireInput('hello')`, equals 5.
10. **CVA-free form strategies** — ngModel host, FormControl host, signal-forms `formField` host. Mirror input.spec patterns exactly. Assert value sync in both directions, disabled propagation via `ctrl.disable()`, required inference from `Validators.required`.
11. **Disabled** — `[disabled]` reflects to native attribute; bound `FormControl.disable()` propagates.
12. **Read-only** — `readonly` input applies the native attribute.
13. **errorState** — pristine invalid → no error; touched invalid → error + `aria-invalid="true"`. Per-instance `errorStateMatcher` override works.
14. **Form-field integration** — registers via `TW_FORM_FIELD_CONTROL`, strips its own chrome (`border-0`, `p-0`), `controlType === 'textarea'`, container click focuses the textarea, `setDescribedByIds` writes the attribute.
15. **Focus** — `focused` signal reflects CDK FocusMonitor, focus ring class present in className.
16. **resizeToFitContent** — calling the directive method delegates to `CdkTextareaAutosize.resizeToFitContent` (spy).

Do NOT use `fakeAsync` / `tick`. Use `await fixture.whenStable()`, `vi.useFakeTimers()` + `vi.runAllTimers()` if you need timer control.

Test file count target: 25-35 individual `it()` blocks.

---

## Demo page

Create under `projects/demo/src/app/routes/textarea/` with the canonical shell (`overview/`, `examples/`, `api/`, page wrapper, routes file). Wire `components/textarea` into `app.routes.ts` and the sidebar nav (insert alphabetically; do not reorder unrelated lines). Mirror the input demo's section layout.

Examples to ship (each with a `tw-code-block`):

1. Basic — `<textarea twTextarea>` standalone and inside a form-field.
2. Sizes — xs through xl, standalone.
3. Autosize — `[autosize]="true"` with `minRows="2"` and `maxRows="8"`.
4. Character count — `maxLength="240"` + `<span twHint align="end">{{ ta.valueLength() }} / 240</span>`, using `#ta="twTextarea"` template ref.
5. Resize axis — `'none'`, `'vertical'`, `'both'`.
6. Disabled / readonly.
7. Reactive forms — `[formControl]` with `Validators.required + Validators.maxLength`, error region using `twError`.
8. Template-driven forms — `[(ngModel)]` with a "set value / reset" pair of buttons.
9. Signal forms — `[formField]` with `required` and `minLength` validators.
10. Custom error-state matcher — submit-only matcher.
11. Inside form-field with prefix/suffix slots — common patterns (e.g., a clear button in the suffix).

Page wrapper (`textarea-page.component.ts`) mirrors `input-page.component.ts` exactly — same `tw-item` header, same tab-nav, same `<router-outlet>`.

Sidebar entry: insert "Textarea" in the alphabetical position (between Tabs and Time Picker). Do not reorder any other entry.

---

## Verification

After implementation:

1. `npx ng test ngx-tw --include "**/textarea.spec.ts"` — must be 100% green.
2. `npx ng lint` on touched files.
3. `npx ng build ngx-tw` — must succeed and emit the `ngx-tw/textarea` secondary entry point bundle.
4. Start the demo on port 4600 and verify each example in the browser. Confirm: autosize grows / caps at maxRows, character count updates per keystroke, tab navigation shows the focus ring, click does not, form-field error styling appears, reactive `valueChanges` fires.

---

## Acceptance criteria

- Every public API member has a one-line JSDoc.
- Tests pass.
- `ng build ngx-tw` clean.
- Demo route loads, all sections render, no console errors.
- Autosize works visually (verified in browser, not just in a unit test).
- Reactive / template-driven / signal forms all bind without extra glue.
- No regressions in existing input tests (`<textarea twInput>` still works — we did not delete or modify the input directive).
