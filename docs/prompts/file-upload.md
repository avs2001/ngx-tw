# Prompt: Build `tw-file-upload` for ngx-tw

> Source of truth: this document. Read it end-to-end before opening any code file.

---

## Context

Before writing code, read:

- `.claude/CLAUDE.md` — conventions, semantic tokens, visual design system (spacing scale, icon sub-scales, typography roles, focus rings, border radius, transitions), JSDoc requirements, signal API rules, CVA runtime-assignment pattern, form-control input-count exception.
- `projects/ngx-tw/checkbox/checkbox.ts` — **canonical form-control peer**. Mirror its: runtime CVA wiring (`inject(NgControl, { optional: true, self: true })` → `this.ngControl.valueAccessor = this`), `FormFieldControl` extension, `TW_ERROR_STATE_MATCHER` integration, parent-form submission tracking, `aria-describedby` / `aria-labelledby` merging, dev-mode missing-accessible-name warning, `linkedSignal` for visible-state mirroring.
- `projects/ngx-tw/checkbox/checkbox.spec.ts` — Vitest layout, FocusMonitor stubbing, ngModel / FormControl / signal-forms hosts.
- `projects/ngx-tw/input/input.ts` — simpler `FormFieldControl<string>` shape; `errors` signal for `[twError match="…"]` filtering; `_ngControlRev` / `_formSubmitRev` revision-signal pattern.
- `projects/ngx-tw/progress-bar/progress-bar.ts` — the component this one **composes** for per-file progress UI. Do not reinvent — render `<tw-progress-bar [value]="item.progress" size="sm" />` per item.
- `projects/ngx-tw/button/button.ts` — `twButton` directive used by the "Choose files" trigger and the per-item remove control. Do not author a custom button.
- `projects/ngx-tw/icon/icon.ts` (first 80 lines) — `<tw-icon>` API, glyph sub-scale, `ICON_SIZE_PX`. Used for default file-type icons and the dropzone illustration.
- `projects/ngx-tw/form-field/form-field.ts` — `FormFieldControl` abstract base, `TW_FORM_FIELD_CONTROL` token, the `setDescribedByIds` / `setLabelledByIds` / `onContainerClick` / `controlType` contract.
- `projects/ngx-tw/core/types.ts` and `projects/ngx-tw/core/error-state-matcher.ts` — `TwColor`, `TwSize`, `ErrorStateMatcher`, `TW_ERROR_STATE_MATCHER`, `TwFormSubmitted`.
- `projects/ngx-tw/theme/_base.css` — existing keyframes (`fade-in`, `scale-in`, etc.); reuse `fade-in` for the dropzone-active overlay; do not author new keyframes.

CDK modules to import:

- `@angular/cdk/a11y` — `FocusMonitor` (host focus tracking), `LiveAnnouncer` (dynamic state announcements).
- `@angular/cdk/coercion` — not needed (signal inputs handle coercion).
- `@angular/cdk/drag-drop` — **explicitly not used**. CDK drag-drop is for *intra-app reordering* of DOM nodes; it is not the right primitive for *external file* drops. Use the native HTML5 DnD API on the dropzone element directly. (Rationale: CDK drag-drop has no DataTransfer.files plumbing; the native API is the only path that surfaces dropped File objects.)

---

## What to build

A component, **`<tw-file-upload>`**, that lets users select one or more files via (a) a "Choose files" button, (b) clicking the drop-zone, or (c) dragging files from the OS file picker / desktop and dropping them on the drop-zone. The selected files are exposed as a `File[]` value through `ControlValueAccessor` so the same component works with template-driven `ngModel`, reactive `FormControl`, and signal-based `formField` strategies — and integrates with `<tw-form-field>` for label / hint / error chrome and `TW_ERROR_STATE_MATCHER` policy.

The component renders:

- A **drop zone** — a dashed-bordered region with an icon, headline, and trigger button. The whole region is keyboard-activatable (`role="button"`, Enter / Space) and accepts file drops via native HTML5 drag-and-drop.
- A **file list** — one row per selected file, showing name, size (human-readable), per-file progress bar (if `progress > 0`), per-file status badge (success / error), per-file error message (when set), and a remove button.
- A **hidden native `<input type="file">`** — the actual form control, used both as the click target for the trigger button and as the focus / form-association anchor. Visually hidden via `sr-only` but kept focusable for screen readers.

The component **does not** issue any HTTP requests. It owns selection, validation, drag-drop UX, and the per-file progress / status surface. Consumers push progress and status updates back into the component via an imperative method (`setItemProgress(id, percent)` / `setItemStatus(id, status, error?)`) once their HTTP layer reports them. This split keeps the component HTTP-library-agnostic (`HttpClient`, `fetch`, S3 SDK, presigned uploads — all work).

### What it does NOT do

- Does **not** issue HTTP requests. Consumer owns the upload pipeline.
- Does **not** ship custom drag-drop based on `@angular/cdk/drag-drop`. Uses native HTML5 DnD on the dropzone (`dragenter` / `dragover` / `dragleave` / `drop`).
- Does **not** validate file content (MIME sniffing, image dimensions, virus scanning). Validates only `accept` (extension + MIME pattern matching the native `<input accept>` semantics), `maxSize`, and `maxFiles`.
- Does **not** chunk or resume uploads. That belongs in the consumer's pipeline.
- Does **not** show image previews by default. Custom item templates can render thumbnails — see the `*twFileUploadItem` slot directive.
- Does **not** expose a `TwColor` axis. The dropzone is neutral (surface tokens) with an active `primary-*` accent and an `error-*` accent for failures. `<tw-form-field>` provides error chrome around the component.

---

## File layout

Create under `projects/ngx-tw/file-upload/`:

| File | Role |
|---|---|
| `file-upload.ts` | `FileUploadComponent`, `FileUploadItemDirective` (structural slot for custom item rendering), `tv()` config, `FileUploadItem` interface, `FileUploadStatus` / `FileUploadVariant` types, internal helpers (`formatBytes`, `matchesAccept`, ID generator). |
| `file-upload.spec.ts` | Vitest suite — see Test plan. |
| `index.ts` | Re-exports `FileUploadComponent`, `FileUploadItemDirective`, `FileUploadItem`, `FileUploadStatus`, `FileUploadVariant`. |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |

Also: add `export * from '@cdevhub/ngx-tw/file-upload';` to `projects/ngx-tw/src/public-api.ts`. Insert near `input` / `textarea` / `select` (the other form-control entry points) — sequential ordering is the existing pattern, do not reorder unrelated lines.

---

## Public types (exported from `index.ts`)

```ts
/** Lifecycle status of a single selected file. */
export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

/** Visual variant of the drop zone container. */
export type FileUploadVariant = 'outline' | 'soft';

/** A single tracked entry in the file-upload's internal state. */
export interface FileUploadItem {
  /** Stable opaque id for this entry. Generated by the component on add. Use as the key when calling `setItemProgress` / `setItemStatus`. */
  readonly id: string;
  /** The underlying `File` object as provided by the browser (or by `writeValue`). */
  readonly file: File;
  /** Current upload progress, integer 0–100. `0` when no progress has been reported. */
  readonly progress: number;
  /** Current lifecycle status. Defaults to `'pending'`. */
  readonly status: FileUploadStatus;
  /** Optional error message attached when `status === 'error'`. Displayed in the file row and announced via `LiveAnnouncer`. */
  readonly error?: string;
}
```

`FileUploadItem` is **the** stable surface consumers receive in `(filesAdded)` and via `items()`. The raw `File[]` value flowing through CVA stays in lock-step (one item per file) but does not carry the id / progress / status — those are component-owned and lost across reactive `setValue` round-trips, which is correct: progress is transient UI state, not form value.

---

## Selector and class

- Element selector: `tw-file-upload`. Component class name: `FileUploadComponent` (no `Tw` prefix on the class).
- Item slot directive selector: `[twFileUploadItem]` — **structural** directive (`*twFileUploadItem="let item"`). The directive captures the `TemplateRef`, exposes the `FileUploadItem` via the implicit `$implicit` context, and the component renders it per item via `<ng-container [ngTemplateOutlet]="…" [ngTemplateOutletContext]="{ $implicit: item, item }" />`.
- Item directive class name: `FileUploadItemDirective`.

### Provider override

`FileUploadComponent` declares:

```ts
providers: [
  { provide: TW_FORM_FIELD_CONTROL, useExisting: forwardRef(() => FileUploadComponent) },
],
```

so `<tw-form-field>` can wire its label / hint / error chrome around the upload. CVA registration is **runtime** (`this.ngControl.valueAccessor = this`), not via the static `NG_VALUE_ACCESSOR` provider — this is non-negotiable: the component injects `NgControl` with `{ self: true }` for matcher integration, which is incompatible with a static value-accessor provider (see CLAUDE.md "ControlValueAccessor" section).

---

## API design

### Inputs

The component is a **form control** and qualifies for the form-control input-count exception codified in CLAUDE.md (ARIA + Forms baseline alone is ~12 inputs). No extra documentation needed — the exception applies directly.

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `multiple` | `boolean` | `false` | `When true, the user can select more than one file. Mirrors to the hidden <input multiple> attribute. Defaults to false.` |
| `accept` | `string \| undefined` | `undefined` | `Comma-separated list of accepted file types using the native <input accept> syntax (e.g., 'image/*,.pdf'). Forwarded to the hidden input and used to reject dropped files that do not match. Defaults to undefined (accept any).` |
| `maxSize` | `number \| undefined` | `undefined` | `Maximum size per file, in bytes. Files exceeding this are rejected with reason 'size' and never reach value. Defaults to undefined (no limit).` |
| `maxFiles` | `number \| undefined` | `undefined` | `Maximum total file count. Drops that would push the count over this limit are rejected with reason 'count'. Ignored when multiple is false (the limit is always 1). Defaults to undefined (no limit).` |
| `variant` | `FileUploadVariant` | `'outline'` | `Visual style of the drop zone. 'outline' renders a dashed-bordered transparent region; 'soft' renders a filled muted background. Defaults to 'outline'.` |
| `size` | `TwSize` | `'md'` | `Controls overall density: drop-zone padding, icon scale, list-row typography. Defaults to 'md'.` |
| `disabled` | `boolean` | `false` | `When true, blocks file selection (button, click, drop, keyboard) and applies muted styling. Reactive forms also propagate disabled via setDisabledState. Defaults to false.` |
| `required` | `boolean` | `false` | `Marks the control as required. Mirrors to aria-required. Inferred from Validators.required on a bound NgControl. Defaults to false.` |
| `label` | `string \| undefined` | `undefined` | `Headline text rendered inside the drop zone (e.g., 'Drag files here'). Projected content takes precedence over this input. Defaults to undefined.` |
| `description` | `string \| undefined` | `undefined` | `Secondary text rendered under the label (e.g., 'PDF up to 10MB'). Projected description content takes precedence. Defaults to undefined.` |
| `triggerLabel` | `string` | `'Choose files'` | `Label rendered inside the trigger button. Defaults to 'Choose files'. Use 'Choose file' when multiple is false (consumer responsibility).` |
| `ariaLabel` | `string \| undefined` | `undefined` (alias `aria-label`) | `Accessible name applied to the host when no visible label is projected. Mirrored to aria-label.` |
| `ariaLabelledby` | `string \| undefined` | `undefined` (alias `aria-labelledby`) | `ID of an external element that labels the control. Mirrored to aria-labelledby.` |
| `ariaDescribedby` | `string \| undefined` | `undefined` (alias `aria-describedby`) | `ID of an external element that describes the control. Form-field merges its hint/error ids alongside.` |
| `name` | `string \| undefined` | `undefined` | `Optional name attribute on the hidden <input type='file'> for native form submissions.` |
| `id` | `string \| undefined` | `undefined` (alias) | `Id on the host element. Auto-generated as 'tw-file-upload-N' when not provided. Used by the form-field's <label for> attribute.` |
| `errorStateMatcher` | `ErrorStateMatcher \| undefined` | `undefined` | `Per-instance override of the ErrorStateMatcher. When omitted, the component uses the TW_ERROR_STATE_MATCHER token's value.` |

No boolean inputs default to `true`. `multiple` defaults to `false` per Angular convention (matches `<input type="file">` native default).

### Outputs

| Output | Payload | JSDoc |
|---|---|---|
| `filesAdded` | `FileUploadItem[]` | `Fires once per add operation with the items that were accepted and appended. Does not fire for rejected files (see fileRejected). Does not fire on writeValue (programmatic value updates from forms).` |
| `fileRemoved` | `FileUploadItem` | `Fires when the user removes a single file via the remove button or programmatic remove(). Does not fire on writeValue.` |
| `fileRejected` | `{ file: File; reason: 'accept' \| 'size' \| 'count'; message: string }` | `Fires for each file that failed validation during add. Includes a human-readable message suitable for assistive-tech announcement.` |
| `cleared` | `void` | `Fires when all files are cleared at once (programmatic clear()). Does not fire on writeValue, even when the new value is empty.` |

No model() — the parent never needs `[(files)]` two-way binding because the `formControl` / `ngModel` / `formField` strategies already round-trip value through CVA. Two-way binding on top would be redundant.

### Models

None.

### Public methods (instance API)

| Method | Signature | JSDoc |
|---|---|---|
| `open` | `(): void` | `Programmatically opens the OS file picker (click the hidden input). No-op when disabled. Useful for triggering selection from elsewhere (toolbar, keyboard shortcut).` |
| `remove` | `(id: string): void` | `Removes the item with the given id. Emits fileRemoved with the removed item. Updates CVA value. No-op when the id is unknown or the component is disabled.` |
| `clear` | `(): void` | `Removes all items. Emits cleared. Updates CVA value to an empty array. No-op when already empty or disabled.` |
| `setItemProgress` | `(id: string, percent: number): void` | `Updates the per-item progress (0–100, clamped). Does not change status. Use this to mirror HTTP upload progress into the UI. No-op when the id is unknown.` |
| `setItemStatus` | `(id: string, status: FileUploadStatus, error?: string): void` | `Updates the per-item status and (optionally) the error message displayed in the file row. Announces transitions (uploading → success, → error) via LiveAnnouncer. No-op when the id is unknown.` |

The imperative-method pattern is chosen over an `Input<Record<string, number>>` deliberately: progress arrives at high frequency (sometimes every chunk), and constructing a new object reference per tick to push through Angular's signal-change-detection layer is wasteful. The method updates the internal items signal in one shot.

### Public readonly signals

| Signal | Type | JSDoc |
|---|---|---|
| `items` | `Signal<readonly FileUploadItem[]>` | `Current items with their progress and status. Use this from a template ref (#u='twFileUpload') to render alongside the component or to drive an external "upload all" button.` |
| `isDragging` | `Signal<boolean>` | `True while a valid file drag is over the drop zone. Useful for parent-level visual feedback.` |
| `valueLength` | `Signal<number>` | `Convenience alias for items().length. Useful for counter hints (e.g., '3 / 10').` |

Add `exportAs: 'twFileUpload'` so consumers can grab a template ref.

---

## CVA contract

| CVA hook | Behavior |
|---|---|
| `writeValue(value: File[] \| File \| null \| undefined)` | Normalizes the incoming value into an internal `FileUploadItem[]`: `null` / `undefined` → `[]`; a bare `File` → `[wrap(file)]`; an array → each `File` wrapped with a fresh id, `progress: 0`, `status: 'pending'`. Does **not** emit `filesAdded` / `cleared` (those are user-action events). Idempotent — calling with the same `File[]` reference is a no-op. |
| `registerOnChange(fn)` | Stored; called with the current `File[]` (i.e., `items().map(i => i.file)`) whenever the user adds or removes files. Not called from `writeValue`. |
| `registerOnTouched(fn)` | Stored; called on host blur (FocusMonitor `null` origin). |
| `setDisabledState(isDisabled)` | Toggles an internal `cvaDisabled` signal; the effective `disabled` signal ORs this with the `disabled` input. When disabled, all interactions are blocked. |

**Value-shape decision:** the CVA value is always `File[]`. Even when `multiple` is `false`, the value is `[file]` or `[]`, never a bare `File`. This eliminates branching in consumer code (`form.controls.upload.value?.[0]` works in both modes). On the **inbound** side, `writeValue` accepts the bare-`File` and `null` shapes too for ergonomic interop with legacy code — but the outbound (`onChange`) value is always an array.

---

## Validation behavior

Validation is **built-in** via the `accept`, `maxSize`, and `maxFiles` inputs. This is what consumers expect from a high-level file-upload — exposing them as inputs (mapped to clear DOM and UX states) is more ergonomic than requiring custom `Validator[]` for each rule. Consumers may still attach Angular `Validator`s for cross-field or async checks (e.g., "at least one image"), and those flow through the bound `NgControl` and surface via `errorState`.

Reject reasons and messages (built-in, displayed via `LiveAnnouncer.announce`):

| Reason | Trigger | Default message (announced + emitted on `fileRejected`) |
|---|---|---|
| `'accept'` | File's MIME type or extension fails `matchesAccept(file, accept)`. | `'{name} was rejected: file type not allowed.'` |
| `'size'` | `file.size > maxSize`. | `'{name} was rejected: exceeds {maxSize-formatted}.'` |
| `'count'` | Adding the file would push `items().length` past `maxFiles` (or past `1` when `!multiple`). | `'{name} was rejected: maximum file count reached.'` |

`matchesAccept(file, accept)` implements the native `<input accept>` matching rules: comma-separated list of (a) explicit MIME types (`image/png`), (b) wildcard MIME types (`image/*`), and (c) file extensions starting with `.` (`.pdf`). Case-insensitive. Empty / `undefined` `accept` → matches anything.

When `multiple` is `false` and the user adds a second file, the existing item is replaced — not rejected. Reset → wrap the new file → emit `filesAdded([newItem])`. The previously selected file is dropped silently (no `fileRemoved` event — the gesture is "replace", not "remove").

---

## Drag-drop behavior

Implement on the dropzone element using native HTML5 DnD:

- Bind via the `host` block of the dropzone wrapper (an inner `<div>`, not the component host — see DOM structure).
- Use the **counter pattern** for `dragenter` / `dragleave` to avoid the well-known bug where `dragleave` fires when the cursor crosses onto a child element. Maintain an internal `private dragCounter = 0` (plain field, not a signal). `dragenter` → increment; `dragleave` → decrement; `isDragging.set(dragCounter > 0 && isValidDrag)`. `drop` → reset counter to 0.
- On `dragover`: `event.preventDefault()` is required to enable `drop` (browser default is to reject the drop). Only call it when `!disabled` and `event.dataTransfer?.types.includes('Files')` (excludes intra-app DOM drags).
- On `drop`: `event.preventDefault()`, then call the internal `addFiles(event.dataTransfer.files)` path. Reset `dragCounter = 0` and `isDragging.set(false)`.

Visual states (drive via tv() variants, all reactive):

| State | Computed from | Styling |
|---|---|---|
| `idle` (default) | `!isDragging() && !errorState() && !disabled()` | dashed `border-border` / soft `bg-surface-muted`, `text-fg-muted` description |
| `dragging-valid` | `isDragging() && !errorState()` | `border-primary-500 bg-primary-50 dark:bg-primary-900/20`, `text-primary-700` description, dropzone scales subtly (`scale-[1.01]`, `transition-transform duration-150`) |
| `dragging-invalid` | `isDragging() && dragHasInvalidFiles()` (DataTransfer has files but none match `accept`) | `border-error-500 bg-error-50 dark:bg-error-900/20`, `text-error-700` description |
| `error` | `errorState() && !isDragging()` | `border-error-500`, dropzone otherwise idle |
| `disabled` | `disabled()` | `opacity-50 pointer-events-none cursor-not-allowed` on the dropzone wrapper |

**`dragHasInvalidFiles` heuristic.** During drag (not drop), the browser exposes `event.dataTransfer.items[i].type` (the MIME type) but **not the filename**, so extension-only `accept` patterns (`.pdf`) cannot be confirmed mid-drag. Show the dragging-valid state when at least one item *could* match (MIME match or any-extension `accept`). Final validation happens at `drop` time when the full `File` objects are available; rejected files surface via `fileRejected` then.

---

## File list rendering

Each item is rendered as a row. Default row layout (the projected `*twFileUploadItem` template can replace this entirely):

```
+----------------------------------------------------------+
| [icon] [name (truncate)]              [progress] [remove]|
|        [size · status / error message]                   |
+----------------------------------------------------------+
```

- **Icon** — `<tw-icon>` glyph at `size-5` (`md`). Default name resolved from `file.type` / extension: `image/*` → `'image'`; `application/pdf` → `'file-text'`; `text/*` → `'file-text'`; anything else → `'file'`. Consumer projection (`[twFileUploadIcon]` is **not** a separate slot — for fully custom rendering use `*twFileUploadItem`). This keeps the slot surface narrow.
- **Name** — `text-sm font-medium text-fg`, single line, `truncate` (requires `min-w-0` on the flex column).
- **Meta line** — `text-xs text-fg-muted`. Always shows formatted size (`formatBytes(file.size)`). Appends status when `!== 'pending'`: ` · Uploading`, ` · Done`, ` · Failed`. When `status === 'error'` and `item.error` is set, the message replaces the bare status: ` · Failed — {error}`.
- **Progress** — `<tw-progress-bar [value]="item.progress" size="sm" color="primary" />` when `0 < progress < 100`, `color="success"` at `100`, `color="error"` when `status === 'error'`. Hidden entirely when `status === 'pending'` and `progress === 0`.
- **Remove button** — `<button twButton variant="ghost" color="neutral" size="sm" (click)="remove(item.id)" [attr.aria-label]="'Remove ' + item.file.name">` with a trailing `<tw-icon name="x" size="sm" />`.

Row container: `flex items-start gap-3 px-3 py-2 rounded-md hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none`.

### Custom item template — `*twFileUploadItem`

Consumers can fully override row rendering:

```html
<tw-file-upload multiple>
  <ng-template *twFileUploadItem let-item>
    <div class="flex items-center gap-3 p-2">
      <img [src]="objectUrl(item.file)" class="size-12 rounded" alt="" />
      <span class="text-sm">{{ item.file.name }}</span>
      <button (click)="upload.remove(item.id)" aria-label="Remove">×</button>
    </div>
  </ng-template>
</tw-file-upload>
```

The directive captures `TemplateRef` and is read via `contentChild(FileUploadItemDirective)`. When present, the component renders `<ng-container [ngTemplateOutlet]="itemSlot.templateRef" [ngTemplateOutletContext]="{ $implicit: item, item }">` per item instead of the default row. When absent, the default row template runs.

The default row also accepts a small accept-customisation slot via standard `ng-content` fallback for the dropzone illustration:

```html
<ng-content select="[twFileUploadIcon]">
  <tw-icon name="upload-cloud" [size]="iconSize()" aria-hidden="true" />
</ng-content>
```

(`[twFileUploadIcon]` is a **plain marker** — no separate directive class; consumers just slap the attribute on whatever element they project.)

---

## Progress integration

Consumer side (canonical pattern):

```ts
@Component({ /* … */ })
class UploadFormComponent {
  readonly upload = viewChild.required(FileUploadComponent);

  onSubmit(): void {
    for (const item of this.upload().items()) {
      this.http
        .post('/upload', this.toFormData(item.file), {
          reportProgress: true,
          observe: 'events',
        })
        .subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              this.upload().setItemProgress(item.id, Math.round((event.loaded / event.total) * 100));
            } else if (event.type === HttpEventType.Response) {
              this.upload().setItemStatus(item.id, 'success');
            }
          },
          error: (err) => this.upload().setItemStatus(item.id, 'error', err.message),
        });
    }
  }
}
```

The component is the sole owner of the items list and emits no `progressChange` output — the consumer drives progress in, reads back via `items()` if needed. This matches how `tw-progress-bar` and `tw-table` (`viewChild` API surfaces) already work in the library.

---

## Accessibility

- **Hidden `<input type="file">` is the actual form control.** Mounted with `class="sr-only"` (visually hidden but focusable). Carries `[id]`, `[name]`, `[multiple]`, `[accept]`, `[disabled]`, `[required]` so native form-submission and native validation messages still work. Its `id` is `${hostId}-input`; the host id is the canonical `tw-file-upload-N`. Form-field's `<label for>` targets the **host** id (matching checkbox / input convention); a dev-mode `<label for="${hostId}-input">` is also acceptable but the host id is the canonical target.
- **Host element** is `role="group"` with `aria-labelledby` / `aria-describedby` wiring (the drop zone region containing both the heading and the file list — `'group'` is the WAI-ARIA role for a logically grouped collection of controls; using `'button'` here would lie about semantics because the host also wraps the file list, not just the trigger).
- **Drop zone wrapper** (inner element, not the host) carries `role="button"`, `tabindex="0"` (or `-1` when disabled), `aria-disabled` when disabled, `aria-describedby` pointing to the headline/description spans. Keyboard handlers: `Enter` and `Space` → call `open()` (delegating to the hidden input's `.click()`). `preventDefault` on space to avoid page scroll.
- **Trigger button** (`twButton` inside the dropzone) — native `<button type="button">`; clicking it also calls `open()` and `stopPropagation()` so it doesn't double-fire the dropzone's click handler.
- **Per-file remove buttons** — `aria-label="Remove {filename}"` for screen readers.
- **`LiveAnnouncer`** (politeness `'polite'`) announces:
  - On accepted add: `'{n} file(s) added.'` (single announcement per add operation, not per file).
  - On reject: `'{filename} was rejected: {reason}.'` (one announcement per rejected file, throttled to `setTimeout(0)` per file so a batch reject sequences cleanly).
  - On remove: `'{filename} removed.'`.
  - On status transition: `'{filename} upload {status}.'` (e.g., `'avatar.png upload complete.'` / `'avatar.png upload failed: server error.'`).
  - On clear: `'All files removed.'`.
- **Focus management**:
  - After remove of the last item in the list, focus moves to the dropzone wrapper (so keyboard users don't lose context).
  - After remove of a non-last item, focus moves to the next item's remove button.
  - After clear, focus moves to the trigger button.
  - The hidden input is never explicitly focused except when opening the picker — focus appears to stay on the dropzone from the user's perspective.
- **Focus ring** — canonical `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on the dropzone wrapper, trigger button, and each remove button. Use `focus-visible` exclusively — never `focus:`.
- **ARIA attributes on the host (computed):**
  - `aria-label` ← `ariaLabel()` input.
  - `aria-labelledby` ← `effectiveAriaLabelledby()` (consumer-supplied `aria-labelledby`, or falls back to the internal label span id, or `undefined` when only `aria-label` is provided).
  - `aria-describedby` ← `effectiveAriaDescribedby()` (form-field-merged ids + consumer-supplied + the description span id).
  - `aria-disabled` ← `disabled() || null`.
  - `aria-required` ← `required() || null`.
  - `aria-invalid` ← `errorState() || null`.
- **AXE:** must pass on default render, with one and many items, dragging state, all five sizes, both variants, disabled, error state.
- **Dev-mode accessible-name warning** mirrors checkbox's pattern: warn once (in dev only) if no `label`, `aria-label`, `aria-labelledby`, or projected label content is detectable.

---

## Form integration

Implement `ControlValueAccessor` via the **runtime** pattern (CLAUDE.md "ControlValueAccessor"):

```ts
private readonly ngControl = inject(NgControl, { optional: true, self: true });

constructor() {
  super();
  if (this.ngControl) {
    this.ngControl.valueAccessor = this;
  }
}
```

**Do not** add `NG_VALUE_ACCESSOR` to the providers array — the `inject(NgControl, { self: true })` for `TW_ERROR_STATE_MATCHER` integration would create a circular DI on the same element.

`FileUploadComponent extends FormFieldControl<File[]>`. Implement the abstract members:

- `id: Signal<string>` — `tw-file-upload-${nextId++}` fallback, overridable via the `id` input.
- `value: Signal<File[] | null>` — `computed(() => items().length ? items().map(i => i.file) : null)` so the form-field can tell when the control is empty.
- `focused: Signal<boolean>` — driven by `FocusMonitor` on the host.
- `empty: Signal<boolean>` — `computed(() => items().length === 0)`.
- `disabled: Signal<boolean>` — `computed(() => disabledInput() || cvaDisabled() || !!ngControl?.disabled)`.
- `required: Signal<boolean>` — mirrors `requiredInput()` or inferred from `Validators.required` on the bound `NgControl` (use `_ngControlRev` revision signal — see input.ts).
- `errorState: Signal<boolean>` — merges per-instance `errorStateMatcher` input + `TW_ERROR_STATE_MATCHER` token + parent `NgForm` / `FormGroupDirective` submission tracking (see checkbox.ts pattern for the full wiring; copy literally).
- `controlType = 'file-upload'` — form-field appends `tw-form-field-type-file-upload` for any consumer styling hooks.
- `userAriaDescribedBy: Signal<string | undefined>` — `computed(() => this.ariaDescribedby())`.
- `errors: Signal<Record<string, unknown> | null>` — mirrors `ngControl?.control?.errors` for `[twError match="…"]` filtering.
- `setDescribedByIds(ids: string[])` — append to internal `describedByIdsSignal`; merged into the host's `aria-describedby` attribute.
- `onContainerClick(event: MouseEvent)` — when the form-field wrapper is clicked, focus the dropzone wrapper (not the hidden input — that would surface the OS picker unexpectedly).

Must work identically with template-driven `ngModel`, reactive `[formControl]`, and signal-based `[formField]`. Demo / test all three.

---

## Variants — `tv()` config

Single `tv()` config in `file-upload.ts`, `twMerge: true`, slot-based. Slots: `root`, `dropzone`, `dropzoneInner`, `illustration`, `headline`, `description`, `trigger`, `divider`, `list`, `item`, `itemIcon`, `itemBody`, `itemName`, `itemMeta`, `itemProgress`, `itemActions`.

```ts
const fileUpload = tv({
  slots: {
    root: 'flex flex-col gap-3 w-full',
    dropzone: 'relative rounded-lg transition-[border-color,background-color,transform] duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    dropzoneInner: 'flex flex-col items-center justify-center text-center gap-3',
    illustration: 'text-fg-subtle shrink-0',
    headline: 'text-sm font-semibold text-fg empty:hidden',
    description: 'text-xs text-fg-muted empty:hidden',
    trigger: '', // trigger uses twButton — base classes come from the button directive
    divider: 'text-xs text-fg-subtle',
    list: 'flex flex-col gap-1 empty:hidden',
    item: 'flex items-start gap-3 px-3 py-2 rounded-md hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none',
    itemIcon: 'shrink-0 text-fg-muted mt-0.5',
    itemBody: 'flex-1 min-w-0 flex flex-col gap-0.5',
    itemName: 'text-sm font-medium text-fg truncate',
    itemMeta: 'text-xs text-fg-muted',
    itemProgress: 'mt-1',
    itemActions: 'flex items-center gap-1 shrink-0',
  },
  variants: {
    variant: {
      outline: { dropzone: 'border-2 border-dashed border-border bg-transparent' },
      soft: { dropzone: 'border border-border bg-surface-muted' },
    },
    size: {
      xs: { dropzone: 'p-3', headline: 'text-xs', description: 'text-2xs' },
      sm: { dropzone: 'p-4', headline: 'text-sm', description: 'text-xs' },
      md: { dropzone: 'p-6' },
      lg: { dropzone: 'p-8' },
      xl: { dropzone: 'p-8' },
    },
    state: {
      idle: '',
      draggingValid: { dropzone: 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]' },
      draggingInvalid: { dropzone: 'border-error-500 bg-error-50 dark:bg-error-900/20' },
      error: { dropzone: 'border-error-500' },
    },
    disabled: {
      true: { dropzone: 'opacity-50 pointer-events-none cursor-not-allowed' },
      false: {},
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
    state: 'idle',
    disabled: false,
  },
}, { twMerge: true });
```

`state` is computed from `isDragging` + `dragHasInvalidFiles` + `errorState` + `disabled` in a single `computed()`. Order of precedence: `disabled` wins over everything (it short-circuits to `idle` + the `disabled` variant); `isDragging` wins over `errorState`; `errorState` wins over `idle`.

The `border-2 border-dashed` on `outline.dropzone` is the **only** place a 2px border is used structurally — it is the dropzone's defining visual affordance. CLAUDE.md reserves 2px borders for "active state indicators" — extending that explicitly here: an empty drop zone IS an "awaiting-input" affordance, and the dashed 2px border is the canonical dropzone signature across every modern UI library. Document the deviation in an inline comment beside the `outline` variant.

`scale-[1.01]` is an arbitrary value — CLAUDE.md prohibits arbitrary spacing. **Use `scale-[1.01]` anyway**, with an inline comment: a 1% scale is below the granularity of Tailwind's `scale-*` scale (smallest step is `scale-95`) but is the visually-correct hover-lift for a dropzone. The alternative is dropping the lift entirely. **[CONFIRM]** — flagged in Open decisions.

---

## DOM structure (default — no `*twFileUploadItem`)

```html
<!-- host: <tw-file-upload> role="group" -->
<input
  type="file"
  class="sr-only"
  [id]="hiddenInputId()"
  [name]="name() ?? null"
  [multiple]="multiple()"
  [accept]="accept() ?? null"
  [disabled]="effectiveDisabled()"
  [required]="required()"
  (change)="onNativeChange($event)"
/>

<div
  [class]="dropzoneClasses()"
  role="button"
  [attr.tabindex]="effectiveDisabled() ? -1 : 0"
  [attr.aria-disabled]="effectiveDisabled() || null"
  [attr.aria-describedby]="dropzoneAriaDescribedby()"
  (click)="open()"
  (keydown)="onDropzoneKeydown($event)"
  (dragenter)="onDragEnter($event)"
  (dragover)="onDragOver($event)"
  (dragleave)="onDragLeave($event)"
  (drop)="onDrop($event)"
>
  <div [class]="dropzoneInnerClasses()">
    <div [class]="illustrationClasses()">
      <ng-content select="[twFileUploadIcon]">
        <tw-icon name="upload-cloud" [size]="iconSize()" aria-hidden="true" />
      </ng-content>
    </div>
    <span [id]="headlineId" [class]="headlineClasses()">
      <ng-content select="[twFileUploadHeadline]">
        @if (label()) { {{ label() }} } @else { Drag files here or click to browse }
      </ng-content>
    </span>
    <span [id]="descriptionId" [class]="descriptionClasses()">
      <ng-content select="[twFileUploadDescription]">
        @if (description()) { {{ description() }} }
      </ng-content>
    </span>
    <button
      type="button"
      twButton
      variant="outline"
      color="neutral"
      [size]="size()"
      [disabled]="effectiveDisabled()"
      (click)="$event.stopPropagation(); open()"
    >
      {{ triggerLabel() }}
    </button>
  </div>
</div>

<ul [class]="listClasses()" role="list">
  @for (item of items(); track item.id) {
    <li>
      @if (itemSlot(); as slot) {
        <ng-container
          [ngTemplateOutlet]="slot.templateRef"
          [ngTemplateOutletContext]="{ $implicit: item, item }"
        />
      } @else {
        <!-- default row -->
        <div [class]="itemClasses()">
          <tw-icon [name]="iconNameFor(item)" size="sm" [class]="itemIconClasses()" aria-hidden="true" />
          <div [class]="itemBodyClasses()">
            <span [class]="itemNameClasses()">{{ item.file.name }}</span>
            <span [class]="itemMetaClasses()">{{ metaTextFor(item) }}</span>
            @if (shouldShowProgress(item)) {
              <tw-progress-bar
                [class]="itemProgressClasses()"
                [value]="item.progress"
                size="sm"
                [color]="progressColorFor(item)"
              />
            }
          </div>
          <div [class]="itemActionsClasses()">
            <button
              type="button"
              twButton
              variant="ghost"
              color="neutral"
              size="sm"
              [attr.aria-label]="'Remove ' + item.file.name"
              (click)="remove(item.id)"
            >
              <tw-icon twButtonIcon name="x" />
            </button>
          </div>
        </div>
      }
    </li>
  }
</ul>
```

The `<ul>` carries `role="list"` because in some screen-reader-friendly resets `list-style: none` strips list semantics; the explicit role keeps the item-count announcement intact.

---

## Implementation notes

- `signal()` throughout. `linkedSignal` for `internalItems` mirroring the model-less internal source-of-truth: it accepts updates from `writeValue`, user drops, programmatic `remove`/`clear`, and `setItem*` methods, while still allowing the public `items: Signal<readonly FileUploadItem[]>` to expose it as readonly via `.asReadonly()`. (Equivalent to checkbox's `internalChecked` rationale: synchronous mirror + writable from internal operations.)
- ID generation: `let nextId = 0; const newItemId = () => `tw-file-upload-item-${nextId++}`;` for items; a separate `nextHostId` for the host id (matches checkbox).
- `formatBytes(n)`: implemented inline (~10 lines) — no shared utility. Output: `'12 B'`, `'4.3 KB'`, `'12.7 MB'`, `'1.2 GB'`. Powers of 1024.
- `matchesAccept(file, accept)`: implemented inline (~25 lines). Parse the `accept` string once per add operation, not per file (memoize across an add batch via local const).
- The component **does not** track focus on individual items; the inner `twButton` remove control owns its own focus state via the button directive's `FocusMonitor`.
- `host` bindings — see DOM structure section for the dropzone's; the host element's bindings:
  ```ts
  host: {
    'role': 'group',
    '[id]': 'id()',
    '[class]': 'rootClasses()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'effectiveAriaLabelledby() || null',
    '[attr.aria-describedby]': 'effectiveAriaDescribedby() || null',
    '[attr.aria-disabled]': 'effectiveDisabled() || null',
    '[attr.aria-required]': 'required() || null',
    '[attr.aria-invalid]': 'errorState() || null',
    '(blur)': 'onHostBlur()',
  }
  ```
- `FocusMonitor` on the **host** to feed the `focused` signal and trigger `onTouched` on blur. Use the same `monitor$.subscribe(origin => …)` pattern as checkbox.
- Subscribe to `parentForm?.ngSubmit` / `parentFormGroup?.ngSubmit` to bump `_formSubmitRev` — copy from checkbox.ts verbatim.
- `LiveAnnouncer` injected and called from inside `addFiles`, `remove`, `clear`, `setItemStatus`. Politeness `'polite'`; messages are short and stable so they don't pile up.
- `OnPush`, standalone (do not set `standalone: true`), `inject()` exclusively for DI, no `@HostBinding` / `@HostListener`, no `ngClass` / `ngStyle`.
- No `@angular/animations`. The only animation is the dropzone scale-up on drag-over, implemented purely with Tailwind utilities (`scale-[1.01]` + `transition-transform duration-150 motion-reduce:transition-none`). No new keyframes needed.

---

## Usage examples

Simplest — single file, no form binding:

```html
<tw-file-upload (filesAdded)="onFiles($event)" />
```

Multiple files with `accept` and `maxSize`:

```html
<tw-file-upload
  multiple
  accept="image/*,.pdf"
  [maxSize]="10 * 1024 * 1024"
  [maxFiles]="5"
  label="Drag images or PDFs here"
  description="Up to 5 files · 10MB each"
/>
```

Reactive forms with progress wiring:

```html
<form [formGroup]="form" (ngSubmit)="upload()">
  <tw-form-field>
    <tw-label>Attachments</tw-label>
    <tw-file-upload #u="twFileUpload" formControlName="attachments" multiple required />
    <tw-hint>PDF or image, up to 10MB each.</tw-hint>
    <tw-error match="required">At least one file is required.</tw-error>
  </tw-form-field>
  <button twButton type="submit" [disabled]="form.invalid">Upload</button>
</form>
```

```ts
upload(): void {
  for (const item of this.u().items()) {
    this.api.upload(item.file).subscribe({
      next: (e) => {
        if (e.type === 'progress') this.u().setItemProgress(item.id, e.percent);
        if (e.type === 'done') this.u().setItemStatus(item.id, 'success');
      },
      error: (err) => this.u().setItemStatus(item.id, 'error', err.message),
    });
  }
}
```

Template-driven forms:

```html
<tw-file-upload name="avatar" [(ngModel)]="profile.avatar" accept="image/*" />
```

Signal-based forms:

```html
<tw-file-upload [formField]="profileForm.avatar" accept="image/*" />
```

Disabled:

```html
<tw-file-upload disabled label="Upload locked" description="Sign in to upload." />
```

Custom item template (thumbnail preview for images):

```html
<tw-file-upload #u="twFileUpload" multiple accept="image/*">
  <ng-template *twFileUploadItem let-item>
    <div class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-muted">
      <img [src]="objectUrl(item.file)" class="size-12 rounded object-cover" alt="" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{{ item.file.name }}</p>
        <p class="text-xs text-fg-muted">{{ formatBytes(item.file.size) }}</p>
        <tw-progress-bar [value]="item.progress" size="sm" />
      </div>
      <button twButton variant="ghost" color="neutral" size="sm"
              [attr.aria-label]="'Remove ' + item.file.name"
              (click)="u.remove(item.id)">
        <tw-icon twButtonIcon name="x" />
      </button>
    </div>
  </ng-template>
</tw-file-upload>
```

Compact (soft variant, sm size, single file):

```html
<tw-file-upload variant="soft" size="sm" accept=".csv" triggerLabel="Choose CSV" />
```

---

## Test plan (`file-upload.spec.ts`)

Vitest. No `fakeAsync` / `tick`. Use `async/await` with `fixture.whenStable()` for any deferred work. `vi.spyOn` for spies. `vi.useFakeTimers()` only if needed for `LiveAnnouncer` flush ordering.

**Helpers**

- `makeFile(name, size, type)` → `new File([new Uint8Array(size)], name, { type })`.
- `dispatchDrop(el, files)` → constructs a `DataTransfer` (via `new DataTransfer()` in jsdom), calls `dataTransfer.items.add(file)` for each, dispatches `dragenter` → `dragover` → `drop`. **jsdom support note:** `DataTransfer` is available in recent jsdom; if a test fails on construction, fall back to a hand-rolled `{ dataTransfer: { files: [...], items: [...], types: ['Files'] } }` event object passed via `new DragEvent('drop', { dataTransfer })`.
- `getDropzone(fixture)` → `fixture.nativeElement.querySelector('[role="button"]')`.
- `getHiddenInput(fixture)` → `fixture.nativeElement.querySelector('input[type="file"]')`.

**Mandatory groups**

1. **Rendering**
   - Mounts with default inputs.
   - Renders each `variant` (`outline`, `soft`) and each `size` (`xs`–`xl`) without errors.
   - Hidden `<input type="file">` is `sr-only` and present.
   - Dropzone wrapper has `role="button"` and `tabindex="0"`.
   - Trigger button is rendered with default label `'Choose files'`.
   - File list is absent (empty `<ul>` collapses via `empty:hidden`) when no files.

2. **Inputs**
   - `multiple` reflects to the hidden input's `multiple` attribute.
   - `accept="image/*,.pdf"` reflects to the hidden input's `accept` attribute.
   - `disabled` blocks click on the trigger and dropzone, sets `aria-disabled` on host and dropzone, sets `tabindex=-1` on the dropzone.
   - `required` reflects to `aria-required` on the host.
   - `label` renders in the headline span; projected `[twFileUploadHeadline]` takes precedence.
   - `description` renders in the description span; projected `[twFileUploadDescription]` takes precedence.
   - `triggerLabel` renders inside the trigger button.

3. **Outputs**
   - `filesAdded` fires once with the new items after a drop / native change.
   - `fileRejected` fires once per rejected file with `{ file, reason, message }`.
   - `fileRemoved` fires when `remove(id)` is called.
   - `cleared` fires when `clear()` is called.
   - None of these fire on `writeValue`.

4. **Drag-drop**
   - `dragenter` followed by `dragover` flips `isDragging()` to true.
   - The dragenter→dragleave counter ignores child-traversal: dispatching `dragenter` twice and `dragleave` once still reports `isDragging() === true`.
   - `drop` adds files, resets `isDragging()` to false.
   - `dragover` on a disabled component does NOT call `preventDefault` (drop is rejected by the browser by default).
   - `dragover` with `dataTransfer.types = ['Files']` calls `preventDefault`; with `['text/plain']` does not.

5. **Selection via native input**
   - Programmatic `open()` triggers `.click()` on the hidden input (spy).
   - `change` event on the hidden input with `dataTransfer.files = [file]` (or via setting `.files` if jsdom supports it) → `filesAdded` emits, `items()` updates, `onChange(File[])` is called.
   - The hidden input is **cleared** after each selection so re-selecting the same file fires a new `change` event (set `input.value = ''`).

6. **Validation**
   - `accept="image/*"` rejects a `text/plain` file with reason `'accept'`.
   - `accept=".pdf"` rejects `name='x.txt'` and accepts `name='x.pdf'`.
   - `maxSize=1024` rejects a 2048-byte file with reason `'size'`.
   - `maxFiles=2` with 2 items already present rejects a third drop with reason `'count'`.
   - `!multiple` replaces the existing single file with the new one (not rejected).
   - Each rejection emits a `fileRejected` event with a human-readable `message`.

7. **CVA contract**
   - `writeValue([file1])` populates `items()` (with a fresh id, `progress=0`, `status='pending'`). Does NOT emit `filesAdded`.
   - `writeValue(null)` clears `items()`. Does NOT emit `cleared`.
   - `writeValue(file)` (bare File) populates `items()` with one wrapped entry.
   - User drop triggers `onChange(File[])`.
   - `setDisabledState(true)` disables interactions and applies disabled styling.
   - Works with `[formControl]`: round-trip value (form patch → items rendered; user drop → `form.value` updates).
   - Works with `[(ngModel)]`: round-trip value via `NgModel`.
   - Works with `[formField]` (signal forms): round-trip value through the signal-forms tree.

8. **Programmatic API**
   - `remove(id)` removes the item, emits `fileRemoved`, updates `onChange`.
   - `remove('unknown')` is a no-op.
   - `clear()` removes all, emits `cleared`, calls `onChange([])`.
   - `setItemProgress(id, 42)` updates the item's `progress` to 42 (assert via `items()` snapshot).
   - `setItemProgress(id, 999)` clamps to 100; negative clamps to 0.
   - `setItemStatus(id, 'success')` updates status; the meta line includes "Done".
   - `setItemStatus(id, 'error', 'boom')` sets status + error message; the meta line includes "Failed — boom".

9. **Accessibility**
   - Host has `role="group"`.
   - Dropzone has `role="button"`, focusable when not disabled.
   - Pressing Enter on the dropzone calls `.click()` on the hidden input (spy `open`).
   - Pressing Space on the dropzone calls `open()` and `preventDefault`s the keyboard event.
   - Trigger button click stops propagation so the dropzone click does not double-fire (assert `open` called once).
   - Per-file remove button carries `aria-label="Remove {filename}"`.
   - `LiveAnnouncer.announce` is called on add / remove / reject / status transition / clear (spy the injected `LiveAnnouncer`).
   - On remove of the last item, focus is on the dropzone (assert `document.activeElement === dropzone` after `await fixture.whenStable()`).
   - On remove of a non-last item, focus is on the next remove button.
   - `aria-invalid="true"` appears on the host when `errorState()` is true (use a `FormControl` with `Validators.required`, mark touched, assert).

10. **Form-field integration**
    - Wrapping in `<tw-form-field>` does not break value flow.
    - Form-field's label `for` attribute matches the host id.
    - Form-field's `setDescribedByIds` propagates to the host's `aria-describedby` attribute.
    - Form-field's `setLabelledByIds` propagates (custom override via the `setLabelledByIds` method).
    - `controlType` is `'file-upload'`; form-field appends `tw-form-field-type-file-upload` to its host.
    - `[twError match="size"]` shows only when `errors()` returns `{ size: … }` (use a custom validator that returns `{ size: true }`).

11. **State / variants smoke**
    - During drag, dropzone class contains `border-primary-500` (assert presence).
    - During drag with all files invalid for `accept`, dropzone class contains `border-error-500`.
    - With `errorState()` true and not dragging, dropzone class contains `border-error-500`.
    - With `variant='soft'`, dropzone class contains `bg-surface-muted`.

12. **Custom item template**
    - `*twFileUploadItem` overrides default rows; assert the projected `<img>` is present and the default `<tw-icon name="file">` is absent.
    - The template receives `$implicit` and `item` context.

13. **Class merging**
    - Consumer-provided `class="my-class"` on the host merges via twMerge with internal classes (assert `my-class` present alongside `flex`).

Target test count: 50–70 `it()` blocks.

---

## Demo page

Create under `projects/demo/src/app/routes/file-upload/` (separate follow-up task — list here for completeness). Examples to ship:

- Basic single file.
- Multiple files with `accept` and `maxSize`.
- Reactive forms with progress wiring (mock the HTTP layer with a `setTimeout` ticker for the demo).
- Template-driven forms.
- Signal-based forms.
- Disabled.
- Soft variant.
- Custom item template (image thumbnails).
- Inside `<tw-form-field>` with hint and error.
- Per-item error display (one file fails, others succeed — visual check).

Page wrapper mirrors `input-page.component.ts`. Sidebar entry: insert "File Upload" alphabetically.

---

## Verification

After implementation:

1. `npm run watch:lib` in one terminal; in another `npx ng test ngx-tw --include "**/file-upload.spec.ts"` — must be 100% green.
2. `npx ng lint` on touched files.
3. `npx ng build ngx-tw` — must succeed and emit the `ngx-tw/file-upload` secondary entry point bundle.
4. Manual: open the demo on port 4600 and verify each example:
   - Drag a file from desktop → dropzone highlights → drop → file appears in list.
   - Drag an invalid file (wrong extension) → dropzone shows error tint → drop is rejected → screen reader announces rejection.
   - Tab to dropzone, press Enter → OS picker opens.
   - Select a file via picker → file appears.
   - Click trigger button → OS picker opens (no double-fire).
   - Click remove on a file → focus lands on the next remove button (or dropzone if last).
   - With reactive form: patch a `File[]`, verify items render; remove one, verify the form value updates.
   - With `accept` mismatch + dev mode → console-warning-free for accessible-name (label is set), and `fileRejected` fires with the correct message.

---

## Open decisions for the maintainer

Sensible defaults I picked; verify before merging the implementation.

1. **CVA value shape is always `File[]`** — even when `multiple = false`, the value is `[file]` or `[]`. Eliminates branching in consumer code. Inbound `writeValue` also accepts bare `File` and `null` for ergonomic interop. If the team prefers `File | null` for single-file mode, flip the spec — but I judge the array everywhere cleaner. **[CONFIRM]**
2. **Progress is imperative (`setItemProgress(id, percent)`), not an input.** Avoids per-tick object construction for high-frequency progress streams. The alternative is `progress = input<Record<string, number>>({})` and a parallel `status = input<Record<string, FileUploadStatus>>({})`, which is more declarative but worse on hot paths. **[CONFIRM]**
3. **Validation is built-in (`accept`, `maxSize`, `maxFiles`) — not consumer-supplied Angular `Validator`s.** Matches the high-level component's contract and what consumers expect. Cross-field / async validators still flow through the bound `NgControl`. **[CONFIRM]**
4. **Drag-drop is native HTML5 DnD, not `@angular/cdk/drag-drop`.** CDK drag-drop is for intra-app reordering and has no `DataTransfer.files` plumbing. **[ASSUMED SAFE]**
5. **Host role is `'group'`, not `'button'`.** The host wraps both the dropzone (which is the button-like region) and the file list (which is a `role="list"`). The dropzone wrapper carries `role="button"`. **[ASSUMED SAFE]**
6. **`scale-[1.01]` arbitrary value for drag-over lift.** Below Tailwind's `scale-95` minimum. Justified inline because no canonical token exists at this granularity. **[CONFIRM]** — flag if the team prefers no lift at all (and rely on color shift only).
7. **2px dashed border on the `outline` variant.** CLAUDE.md restricts 2px borders to active-state indicators. Spec extends that explicitly to dropzone affordances; an inline comment documents the deviation. **[CONFIRM]**
8. **Default dropzone illustration uses `<tw-icon name="upload-cloud">`.** Assumes the project's icon registry has `upload-cloud` available (Lucide provides it). Substitute `cloud-arrow-up` / `inbox` if the canonical icon set differs. **[CONFIRM]**
9. **Per-row icons resolved heuristically from `file.type`** (`image/*` → `image`, `application/pdf` / `text/*` → `file-text`, else `file`). Keep the lookup table inline in the component, not a separate utility. **[ASSUMED SAFE]**
10. **No image thumbnail preview by default.** Consumers wanting previews use `*twFileUploadItem` to render `<img [src]="objectUrl(item.file)">` themselves (with their own URL revocation lifecycle — important: the component does **not** manage `URL.createObjectURL` / `URL.revokeObjectURL`). Documenting this avoids a memory-leak footgun if the component were to manage URLs itself. **[ASSUMED SAFE]**
11. **`triggerLabel` is a string, not projected content.** The trigger button is structurally important enough to warrant an input. If consumers need a fully custom trigger (e.g., with a leading icon), they can target it via slot — but that's a v2 feature; not in scope here. **[ASSUMED SAFE]**

---

## Constraints (from CLAUDE.md — non-negotiable)

- Selector prefix `tw-`; class name `FileUploadComponent` (no `Tw` prefix).
- Standalone — do not set `standalone: true`.
- `ChangeDetection.OnPush`, `host` object for host bindings, `inject()` for DI, native control flow (`@if`, `@for`, `@switch`).
- Signal API exclusively. `computed()` for derived state; `linkedSignal()` for the internal items mirror; no `mutate`.
- CVA via runtime assignment (`this.ngControl.valueAccessor = this`) — never via static `NG_VALUE_ACCESSOR` provider.
- Semantic color tokens / surface-fg-border tokens only. No raw palette colors. No raw `neutral-*` for structural styling.
- Visual tokens drawn from CLAUDE.md "Visual Design System" — `rounded-lg` on the dropzone, `rounded-md` on rows / buttons, container padding scale (`p-3`/`p-4`/`p-6`/`p-8`), gaps (`gap-1`/`gap-2`/`gap-3` only — never `gap-4`+), typography (`text-sm font-semibold` headline, `text-sm font-medium` filename, `text-xs text-fg-muted` meta, `text-2xs` xs-density meta), icon glyph sub-scale, focus rings (canonical `focus-visible:outline-2 outline-offset-2 outline-primary-500`).
- `tv()` with `twMerge: true`, slot-based, defines `defaultVariants`. Shared `TwSize` from `ngx-tw/core`. No exported variant config.
- No `@angular/animations`. Only Tailwind `transition-*` utilities + reusable theme keyframes (none needed for this component).
- Vitest, no `fakeAsync` / `tick`.
- Every `input()`, `output()`, and public method carries a one-line JSDoc.
- Form-control input-count exception applies (canonical: checkbox at 12+).

---

## Acceptance criteria

- Every public API member has a one-line JSDoc; Compodoc renders complete tables.
- All Vitest groups pass.
- `ng build ngx-tw` clean; the `ngx-tw/file-upload` entry point bundles.
- Demo route loads on port 4600, all examples render, no console errors, no AXE violations.
- Drag-and-drop works visually in Chromium and Firefox (verified manually).
- Reactive / template-driven / signal forms all bind without extra glue.
- `LiveAnnouncer` announcements verified manually with VoiceOver / NVDA on at least one platform.
- No regressions in other form-control tests.
