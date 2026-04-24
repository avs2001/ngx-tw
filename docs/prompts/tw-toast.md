# Prompt: Build `tw-toast` for ngx-tw

## Context

Read before starting:

- `.claude/CLAUDE.md` — all conventions, visual design system, animation patterns, service provider rules.
- `projects/ngx-tw/dialog/dialog.ts` — the canonical **service-driven overlay pattern** in this library. Study the `provideTwDialog()` function, the parent/child service delegation, `openDialogsAtThisLevel` signal, config-merging flow. The toast service follows the same shape (without CDK Dialog's modal focus trap).
- `projects/ngx-tw/dialog/dialog-ref.ts` — the `close()` / `afterClosed()` / state signal pattern; the toast `ToastRef` mirrors this (renamed `dismiss()` / `afterDismissed()`).
- `projects/ngx-tw/dialog/dialog-config.ts` — `InjectionToken` pattern for `TW_TOAST_DATA` and `TW_TOAST_DEFAULT_OPTIONS`.
- `projects/ngx-tw/dialog/dialog-container.ts` — container component attached via `ComponentPortal`, state-driven CSS class animation, fallback animation timer. The toast container is similar but stacks multiple toasts instead of holding one.
- `projects/ngx-tw/alert/alert.ts` — source of truth for **severity color mapping**. The toast reuses the alert's `soft` variant compound-variant colors for `info`, `success`, `warning`, `error`, `neutral`. Do not re-derive the palette — mirror the alert's soft variant classes for consistency.
- `projects/ngx-tw/popover/popover.ts` — CDK Overlay reuse pattern, `animate.enter` / `animate.leave`, subscription management, `untracked()` usage.
- `projects/ngx-tw/core/types.ts` — `TwColor` shared type.
- `projects/ngx-tw/theme/_base.css` — existing `fade-in` / `fade-out` keyframes with `prefers-reduced-motion` handling. You will add new toast-specific slide keyframes here.
- `node_modules/@angular/cdk/overlay` — `Overlay`, `OverlayRef`, `createGlobalPositionStrategy`, `OverlayContainer`.
- `node_modules/@angular/cdk/a11y` — `LiveAnnouncer` for severity-driven announcements.
- Reference only: `/Users/ciprianiuga/dev/sandbox/components/src/material/snack-bar/` — study `MatSnackBar.open()`, `MatSnackBarContainer`, `MatSnackBarRef`, and the `MAT_SNACK_BAR_DEFAULT_OPTIONS` injection token for the overlay config + global position strategy shape. **Improve on it**: Material dismisses the existing snackbar to show a new one — we **stack**.

## What to build

A production-grade toast / snackbar system. Consumers inject a `ToastService` and call `show()`, `success()`, `error()`, `warning()`, `info()`, or `promise()`. Toasts render inside a single CDK overlay per screen position, **stacked** in a column with newer toasts pushing older ones. Each toast supports rich content (string, `TemplateRef`, or component class), auto-dismiss with pause-on-hover/focus, an optional action button, a dismiss button, severity-driven ARIA live announcements, keyboard dismissal, and programmatic control via a returned `ToastRef`.

This consists of:

- `ToastService` — injectable service (NOT `providedIn: 'root'`; provide via `provideToast()`). Opens toasts and tracks refs.
- `ToastContainerComponent` — one per active screen position. Renders a stack of `ToastComponent`s inside the CDK overlay. Internal, not exported.
- `ToastComponent` — the visual toast panel (severity icon + content + action + dismiss). Public (exported so consumers can project it inside custom component content if needed).
- `ToastRef<T, R>` — returned from service methods; exposes `dismiss(result?)`, `afterDismissed()`, `beforeDismissed()`, `onAction()`, `state` signal, `pause()` / `resume()` for timer control.
- `ToastConfig` — per-call configuration class.
- `provideToast(defaults?)` — environment providers function; registers the service and optional app-wide defaults.
- Injection tokens: `TW_TOAST_DATA`, `TW_TOAST_REF`, `TW_TOAST_DEFAULT_OPTIONS`.

## API design

### `provideToast(defaults?: Partial<ToastConfig>): EnvironmentProviders`

Registers `ToastService` for DI. Optional `defaults` become app-wide defaults merged into every `show()` call. Follow the `provideTwDialog` implementation exactly.

### `ToastService`

#### Methods

- `show<R = void, D = unknown>(content: string | TemplateRef<ToastTemplateContext> | Type<unknown>, config?: ToastConfig<D, R>): ToastRef<unknown, R>` — Opens a toast. String content renders inside the default `ToastComponent` layout; `TemplateRef` renders via `TemplatePortal`; component class renders via `ComponentPortal` with `TW_TOAST_DATA` + `TW_TOAST_REF` injected.
- `success(message: string, config?: ToastConfig): ToastRef` — Shorthand; forces `severity: 'success'`.
- `error(message: string, config?: ToastConfig): ToastRef` — Shorthand; forces `severity: 'error'` and `politeness: 'assertive'`.
- `warning(message: string, config?: ToastConfig): ToastRef` — Shorthand; forces `severity: 'warning'`.
- `info(message: string, config?: ToastConfig): ToastRef` — Shorthand; forces `severity: 'info'`.
- `promise<T>(promise: Promise<T>, messages: { loading: string; success: string | ((value: T) => string); error: string | ((err: unknown) => string); }, config?: ToastConfig): ToastRef` — Shows a loading toast, then swaps its severity and content when the promise settles. Loading toasts are **not** auto-dismissed (duration is overridden to `0`). The same `ToastRef` is returned; it is re-used across the three states. The returned ref's `afterDismissed()` resolves once the final (success/error) toast is dismissed.
- `dismiss(id: string): void` — Dismisses one toast by id.
- `dismissAll(): void` — Dismisses every active toast.
- `getToastById<R = unknown>(id: string): ToastRef<unknown, R> | undefined` — Look up active ref.

#### Reactive readouts

- `activeToasts: Signal<readonly ToastRef[]>` — All currently visible toasts across positions.
- `afterOpened: Observable<ToastRef>` — Emits every time a toast is shown.
- `afterAllDismissed: Observable<void>` — Emits when the active list drains to empty (mirror the dialog service's `afterAllClosed` shape with `defer` + `startWith`).

### `ToastConfig<D = unknown, R = unknown>`

```typescript
class ToastConfig<D = unknown, R = unknown> {
  /** Severity of the toast. Maps to color + icon + politeness. Defaults to `'info'`. */
  severity?: ToastSeverity = 'info';

  /** Screen position of the toast stack. Defaults to `'bottom-right'`. */
  position?: ToastPosition = 'bottom-right';

  /** Auto-dismiss duration in ms. `0` disables auto-dismiss. Defaults to `5000`. */
  duration?: number = 5000;

  /** When true, renders a close (×) button. Defaults to `true`. */
  dismissible?: boolean = true;

  /** ARIA live region politeness. Defaults to `'polite'` (`'assertive'` for `severity: 'error'`). */
  politeness?: 'polite' | 'assertive' | 'off' = 'polite';

  /** Action button configuration. When set, renders a button inside the toast that invokes `handler` on click. */
  action?: { label: string; handler?: (ref: ToastRef) => void };

  /** Arbitrary data injected as `TW_TOAST_DATA` into component content, or exposed in the template context. */
  data?: D | null = null;

  /** Additional classes merged onto the toast panel via twMerge. */
  panelClass?: string | string[];

  /** Override the icon slot — string (icon name), TemplateRef, or `false` to hide. Defaults to severity-driven icon. */
  icon?: string | TemplateRef<void> | false;

  /** When true, pauses the auto-dismiss timer while the pointer hovers or focus is within the toast. Defaults to `true`. */
  pauseOnInteraction?: boolean = true;

  /** Enable horizontal swipe-to-dismiss via pointer gestures. Defaults to `true`. */
  swipeToDismiss?: boolean = true;

  /** Unique id. Auto-generated when omitted. */
  id?: string;

  /** Optional explicit aria-label for the toast element. When omitted, text content is used. */
  ariaLabel?: string;
}
```

### Types to export

```typescript
type ToastSeverity = 'info' | 'success' | 'warning' | 'error' | 'neutral';
type ToastPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
type ToastState = 'entering' | 'visible' | 'paused' | 'dismissing' | 'dismissed';

interface ToastTemplateContext<T = unknown> {
  $implicit: T;
  ref: ToastRef;
}
```

### `ToastRef<C = unknown, R = unknown>`

Created by the service and returned from `show()`. Similar to `TwDialogRef`.

#### Public API

- `id: string` — Unique identifier.
- `componentInstance: C | null` — Instance of projected component (null for string / template).
- `state: Signal<ToastState>` — Reactive lifecycle.
- `config: Readonly<ToastConfig>` — Resolved config (defaults merged).
- `dismiss(result?: R): void` — Start dismiss animation and clean up. Safe to call multiple times.
- `pause(): void` — Pause the auto-dismiss timer (used on hover/focus).
- `resume(): void` — Resume the timer with remaining time.
- `triggerAction(): void` — Invokes `config.action.handler`; equivalent to clicking the action button.
- `afterOpened(): Observable<void>` — Emits once when enter animation completes.
- `beforeDismissed(): Observable<R | undefined>` — Emits at the start of dismissal.
- `afterDismissed(): Observable<ToastDismissReason<R>>` — Emits after the leave animation completes and the element is detached. Payload: `{ reason: 'action' | 'timeout' | 'swipe' | 'manual' | 'programmatic', result?: R }`.
- `update(patch: Partial<Pick<ToastConfig, 'severity' | 'duration' | 'action' | 'icon' | 'data' | 'ariaLabel'>> & { content?: string | TemplateRef<ToastTemplateContext> | Type<unknown> }): void` — Mutates the live toast (used by `promise()` to swap loading → success/error).

### `ToastComponent` (selector: `tw-toast`)

The default visual component. Used internally for string-form `show()` calls and available as a public export so consumers can compose it inside custom component content.

#### Inputs

- `severity: ToastSeverity` — Severity of the toast. Defaults to `'info'`.
- `dismissible: boolean` — Whether to render the close button. Defaults to `true`.
- `icon: string | false` — Icon identifier or `false` to hide. Defaults to `undefined` (uses severity default).
- `ariaLabel: string | undefined` — Explicit label for the toast wrapper.

#### Outputs

- `dismissed: void` — Fires when the internal close button is clicked.
- `actionClicked: void` — Fires when the action button is clicked.

#### Content projection slots

- Default slot — toast message body (when used directly, not via service).
- `[twToastTitle]` — optional bold title directive attribute slot.
- `[twToastDescription]` — optional description directive attribute slot.
- `[twToastAction]` — action button slot; replaces the default action rendering when projected.
- `[slot="icon"]` — override icon; falls back to severity icon.

[CONFIRM] Should the default `ToastComponent` exist as a standalone public primitive with directive slots (mirroring alert with `twAlertTitle` / `twAlertContent` / `twAlertActions`), or remain internal-only with a fixed string layout? Current proposal: **public, with directive slots** so consumers can build custom toasts with the same visuals. Rationale: matches alert.

### Injection tokens

- `TW_TOAST_DATA: InjectionToken<unknown>` — provides `config.data` to component content.
- `TW_TOAST_REF: InjectionToken<ToastRef>` — provides the ref so component content can call `dismiss()` / `triggerAction()`.
- `TW_TOAST_DEFAULT_OPTIONS: InjectionToken<Partial<ToastConfig>>` — app-wide defaults set via `provideToast(defaults)`.

## Usage examples

```typescript
// 1. Register in app bootstrap.
export const appConfig: ApplicationConfig = {
  providers: [
    provideToast({ position: 'bottom-right', duration: 4000 }),
  ],
};
```

```typescript
// 2. Simplest — inject and call severity shorthands.
readonly toast = inject(ToastService);

save() {
  this.toast.success('Saved successfully.');
}

fail() {
  this.toast.error('Something went wrong.');
}
```

```typescript
// 3. Action button with handler.
this.toast.show('Message archived', {
  action: { label: 'Undo', handler: (ref) => { this.restore(); ref.dismiss(); } },
  duration: 8000,
});
```

```typescript
// 4. Promise-based toast — loading then success/error.
this.toast.promise(this.api.saveUser(user), {
  loading: 'Saving user…',
  success: (user) => `Saved ${user.name}.`,
  error: (err) => `Could not save: ${(err as Error).message}`,
});
```

```typescript
// 5. Template content with ref + data.
const ref = this.toast.show(this.tmpl, { data: { items: 12 }, severity: 'info' });
```

```html
<ng-template #tmpl let-data let-ref="ref">
  <strong>{{ data.items }} items updated.</strong>
  <button (click)="ref.dismiss()" class="ml-2 text-sm underline">Dismiss</button>
</ng-template>
```

```typescript
// 6. Component content with injected ref + data.
this.toast.show(CustomToastComponent, { data: { userId: 42 }, duration: 0 });
// In CustomToastComponent:
readonly data = inject(TW_TOAST_DATA);
readonly ref = inject(TW_TOAST_REF);
```

```typescript
// 7. Programmatic dismiss + await result.
const ref = this.toast.show('Undoable action', { action: { label: 'Undo' }, duration: 6000 });
ref.afterDismissed().subscribe(({ reason }) => {
  if (reason === 'action') this.rollback();
});
```

## Styling

### Overlay position (outer)

Each of the six `ToastPosition` values gets its own `OverlayRef` (lazily created on first use). Build a `GlobalPositionStrategy`:

- `top-right`, `top-center`, `top-left` → `.top('1rem')` plus `.right()` / `.centerHorizontally()` / `.left()`.
- `bottom-*` → `.bottom('1rem')` plus the corresponding horizontal anchor.
- `top-center` / `bottom-center` uses `.centerHorizontally()`.
- Safe-area insets: apply `env(safe-area-inset-*)` padding via a CSS class on the overlay pane [CONFIRM] — acceptable? Proposed: yes, via `.tw-toast-overlay { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }` in `_base.css`.

Scroll strategy: `noopScrollStrategy()` — toasts float with the viewport.

Overlay pane classes (container): `pointer-events-none` so clicks pass through gaps, with `pointer-events-auto` re-enabled on each toast.

### `ToastContainerComponent` (`tw-toast-container`)

Stacks the active `ToastRef`s for its assigned position into a flex column. Host classes:

- `flex flex-col gap-2 w-full max-w-sm` — vertical stack, `gap-2` per visual design system.
- `items-end` for right-aligned positions, `items-start` for left, `items-center` for center [CONFIRM] — or always `items-stretch`. Proposed: align based on position so non-max-width toasts hug the correct edge.
- Render order is newest-first (top of stack) for top positions; newest-last (bottom of stack) for bottom positions [CONFIRM]. Proposed: newest enters closest to the screen edge so users see the most recent action without scanning past older ones. For `bottom-right`: newest at the bottom. For `top-right`: newest at the top.

### `tv()` config for the individual toast panel

Use **slots**: `root`, `icon`, `title`, `description`, `content`, `action`, `dismiss`.

Base classes per slot:

- `root` — `pointer-events-auto relative flex items-start gap-3 p-4 rounded-lg shadow-md border text-sm w-full max-w-sm min-w-0 will-change-transform transition-colors duration-200 motion-reduce:transition-none`
- `icon` — `size-5 shrink-0 mt-0.5`
- `title` — `text-sm font-semibold`
- `description` — `text-sm` (use theme-appropriate muted class via severity compound variants)
- `content` — `flex-1 min-w-0`
- `action` — `inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`
- `dismiss` — `absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-md cursor-pointer transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`

Variants:

- `severity: 'info' | 'success' | 'warning' | 'error' | 'neutral'` — Mirror the alert component's **soft** variant compound-variant classes exactly (source: `projects/ngx-tw/alert/alert.ts`). Example for `info`: `root: 'bg-info-50 text-info-800 border-info-300'`, `icon: 'text-info-500'`, `title: 'text-info-800'`, `description: 'text-info-700'`, `action: 'text-info-700 hover:bg-info-100'`, `dismiss: 'text-info-500 hover:bg-info-100'`. Neutral uses surface/fg/border tokens per alert. Do not invent new colors.
- (No separate `variant` axis — toasts are always "soft". A `variant` could be added later if needed.)

`defaultVariants: { severity: 'info' }`. Enable `twMerge: true`.

`config.panelClass` is merged onto `root` via `twMerge`.

Visual design references (from CLAUDE.md visual design system):

- `rounded-lg` for panel.
- `shadow-md` for prominent elevation.
- `p-4` for default padding.
- `size-5 shrink-0` for icon with `mt-0.5` for multi-line alignment.
- `gap-3` between icon and content.
- `gap-2` between stacked toasts in the container.
- `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` for all focusable elements.
- `border-{severity}-300` structural color for the panel; neutral uses `border-border`.

### Icons

Default severity icons (inline SVG paths co-located in the `ToastComponent` template, same pattern as alert's dismiss SVG — avoid external icon dependency). Suggested defaults:

- `info` — filled info circle.
- `success` — filled check circle.
- `warning` — filled triangle exclamation.
- `error` — filled octagon exclamation.
- `neutral` — no icon by default.

[CONFIRM] Or require the consumer to always project an icon. Proposed: **ship default icons** inline for zero-config use; consumers override via `config.icon` or `[slot="icon"]`.

### Animations

Animations are position-aware. Define in `projects/ngx-tw/theme/_base.css`:

```css
@keyframes toast-slide-in-right { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
@keyframes toast-slide-out-right { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }
@keyframes toast-slide-in-left  { from { opacity: 0; transform: translateX(-100%); } to { opacity: 1; transform: translateX(0); } }
@keyframes toast-slide-out-left { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-100%); } }
@keyframes toast-slide-in-top   { from { opacity: 0; transform: translateY(-100%); } to { opacity: 1; transform: translateY(0); } }
@keyframes toast-slide-out-top  { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-100%); } }
@keyframes toast-slide-in-bottom  { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
@keyframes toast-slide-out-bottom { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(100%); } }

.toast-enter-right  { animation: toast-slide-in-right  150ms ease-out; }
.toast-leave-right  { animation: toast-slide-out-right 150ms ease-in; }
/* …same for left, top, bottom */

@media (prefers-reduced-motion: reduce) {
  .toast-enter-right, .toast-leave-right,
  .toast-enter-left,  .toast-leave-left,
  .toast-enter-top,   .toast-leave-top,
  .toast-enter-bottom,.toast-leave-bottom { animation: fade-in 0ms linear; }
}
```

Apply via `host: { '[animate.enter]': 'enterAnim()', '[animate.leave]': 'leaveAnim()' }` on the toast. `enterAnim()` / `leaveAnim()` are `computed()` signals that resolve the axis from `config.position`:

- `*-right` → `toast-enter-right` / `toast-leave-right`.
- `*-left` → `toast-enter-left` / `toast-leave-left`.
- `top-center` → `toast-enter-top` / `toast-leave-top`.
- `bottom-center` → `toast-enter-bottom` / `toast-leave-bottom`.

Reduced-motion handling is in the CSS (as above). Do **not** use `@angular/animations`.

## Accessibility

- **Live region announcements:** on toast open, call `LiveAnnouncer.announce(text, politeness)` from `@angular/cdk/a11y`. Politeness resolves: explicit `config.politeness` > `severity === 'error'` ? `'assertive'` : `'polite'`. Do **not** announce when `politeness === 'off'`. Do **not** rely on `role="alert"` — CDK's `LiveAnnouncer` handles SR compatibility more reliably than `role` on dynamically-inserted DOM.
- **Role:** Each toast wrapper uses `role="status"` for non-error toasts and `role="alert"` for error toasts (in addition to `LiveAnnouncer`). Container uses `role="region"` with `aria-label="Notifications"` [CONFIRM] label text? Proposed default: `'Notifications'`, overridable via default-options provider.
- **aria-live:** toast wrapper gets `aria-live="polite"` / `"assertive"` based on severity (redundant with `LiveAnnouncer` but improves VoiceOver behavior for toasts that appear while focus is stable).
- **aria-atomic:** `"true"` so updates (via `ref.update()`) re-announce the whole message.
- **Dismiss button:** `aria-label="Dismiss"` (same as alert), includes `focus-visible` outline.
- **Action button:** native `<button>` with focus-visible outline; label from `config.action.label`.
- **Keyboard:**
  - `Escape` on the focused toast dismisses that toast only (not the whole stack). Use CDK `keydownEvents()` on the overlay ref, filter by `ESCAPE`.
  - `Tab` from outside the stack moves focus into the most-recent toast's first focusable element (action button, then dismiss). Implement with a "skip-to-toasts" aria-landmark only if there is focus management need — otherwise rely on natural DOM order [CONFIRM] proposed default: **no global hotkey**; users Tab through the page naturally.
  - Focus ring follows the standard pattern.
- **Pause on interaction:** timer pauses when the host element receives `pointerenter` or `focusin`; resumes on `pointerleave` + `focusout` (only when both are false). This gives keyboard-only users and screen readers time to read.
- **Reduced motion:** handled in CSS via `prefers-reduced-motion`. No JS changes needed.
- **AXE:** must pass. Ensure color contrast on action button and dismiss icon meets WCAG AA across all severities.

## Implementation notes

### Overlay lifecycle (one overlay per position)

- `ToastService` maintains a `Map<ToastPosition, { overlayRef: OverlayRef; containerRef: ComponentRef<ToastContainerComponent> }>`.
- First `show()` for a given position creates its overlay lazily via `overlay.create({ positionStrategy: createGlobalPositionStrategy()..., scrollStrategy: overlay.scrollStrategies.noop(), hasBackdrop: false, panelClass: ['tw-toast-overlay', position-class] })`.
- Service attaches a `ComponentPortal<ToastContainerComponent>` once per overlay.
- The container holds a signal `toasts: Signal<readonly ToastRef[]>` filtered to its position. Service updates it via a shared per-position signal.
- Overlay stays mounted once created; on service destroy, dispose all overlays.

### Stacking

- Each `ToastRef` has its own projected content (string → `ToastComponent`, TemplateRef → `TemplatePortal`, Component class → `ComponentPortal`).
- The `ToastContainerComponent` template is a `@for` over its toasts signal that renders each via `CdkPortalOutlet`. Track by `ref.id`.
- Max-visible enforcement: service input `maxVisible` default `5` [CONFIRM]. When exceeded, the service dismisses the **oldest** ref (by insertion order) before appending the new one. Oldest dismissal uses `reason: 'timeout'` [CONFIRM] — proposed new reason `'max-exceeded'`. Include in union.

### Timer + pause/resume

- On open, if `config.duration > 0`, start a timer. Store `{ startedAt, remaining }`. On `pause()`: `remaining -= (now - startedAt)`; clear timeout. On `resume()`: restart with `remaining`. `ToastRef.pause()` / `resume()` are public so consumers can implement custom pause conditions.
- Internal host listeners on `ToastComponent`: `(pointerenter)` and `(focusin)` → `ref.pause()`; `(pointerleave)` + `(focusout)` → `ref.resume()` (only when both left). Track via two booleans: `hovered`, `focused`.
- On dismiss, clear the timer.

### Swipe-to-dismiss

- Use pointer events on the toast root: `pointerdown` → capture pointer, record start X; `pointermove` → translate the element along the horizontal axis (signal-bound `style.transform`); `pointerup` → if swipe distance exceeds threshold (e.g., 40% of width) **in the direction away from screen edge** (right for right-side positions, left for left-side positions, either for center), call `dismiss({ reason: 'swipe' })`. Otherwise animate back to 0.
- Threshold + axis direction per position in a lookup table.
- Disable swipe when `config.swipeToDismiss === false` or when `prefers-reduced-motion: reduce` matches.
- Use `@angular/cdk/platform` to detect touch/pointer capability; fall back to disabled when unsupported [CONFIRM].

### Promise toasts

- `promise()` immediately calls `show(messages.loading, { severity: 'neutral', duration: 0, dismissible: false, ... })`.
- Subscribe to the promise. On resolve: `ref.update({ severity: 'success', content: resolveMessage(value), duration: resolvedConfig.duration ?? default })` and restart the auto-dismiss timer. On reject: same with `severity: 'error'`.
- `update()` must swap the internal content portal (detach current, attach new `ComponentPortal<ToastComponent>` with updated inputs) or, if the toast uses the default component, set component inputs reactively via signals. Prefer the latter for flicker-free updates.

### Dismiss flow (mirrors dialog ref pattern)

1. Guard re-entry: if `state === 'dismissing' | 'dismissed'`, return.
2. Set `state = 'dismissing'`. Emit `beforeDismissedSubject`.
3. Container removes the toast from its signal → Angular runs `animate.leave` class → CSS animation plays.
4. After animation duration (150 ms + 50 ms fallback padding), call `finishDismiss()`: set `state = 'dismissed'`, emit `afterDismissedSubject`, remove the ref from the service's active list.
5. If the container's active list becomes empty, keep the overlay mounted (do **not** dispose); next `show()` reuses it. Dispose only on service destroy.

Fallback timer — use `setTimeout` with duration + padding in case the `animate.leave` hook does not fire (e.g., `prefers-reduced-motion` collapse). Mirrors `closeFallbackTimer` in `TwDialogRef`.

### Configuration resolution

Mirror `TwDialog.resolveConfig()`: `new ToastConfig()` → `Object.assign(merged, defaultOptions, perCallConfig)`. The `error()` / `success()` / `warning()` / `info()` shorthands set `severity` last so per-call config cannot accidentally override the shorthand intent [CONFIRM] — or allow override? Proposed: **do not allow override** inside shorthands (if you need flexibility, use `show()`).

### Parent/child service delegation

Same pattern as `TwDialog`: inject `ToastService` with `{ optional: true, skipSelf: true }` and delegate `activeToasts` / `afterOpened` / `afterAllDismissed` upward. Ensures lazy-loaded feature modules share the root stack rather than opening competing overlays.

### Destruction

- Service `ngOnDestroy`: dismiss all at this level, dispose every overlay in the position map, complete subjects.
- Each `ToastRef` uses a `DestroyRef`-less lifecycle (it is not an Angular directive); cleanup is manual inside `finishDismiss()`.

## File structure

```
projects/ngx-tw/toast/
  toast.ts                — ToastService, provideToast(), service-level logic
  toast-component.ts      — ToastComponent, directive slots (title/description/action/icon)
  toast-container.ts      — ToastContainerComponent (internal)
  toast-ref.ts            — ToastRef class
  toast-config.ts         — ToastConfig class, tokens (TW_TOAST_DATA, TW_TOAST_REF, TW_TOAST_DEFAULT_OPTIONS), ToastSeverity / ToastPosition / ToastState / ToastDismissReason / ToastTemplateContext types
  toast.spec.ts           — Vitest tests
  index.ts                — public API exports
  ng-package.json         — { "lib": { "entryFile": "index.ts" } }
```

### Test coverage for `toast.spec.ts`

Cover the full contract. All tests use `vi.useFakeTimers()` for duration-based behavior (no `fakeAsync` / `tick`).

- **Service registration:** `provideToast()` without defaults; with defaults merged into every call.
- **Open by string:** `show('hi')` mounts a `ToastComponent` with the text, `role="status"`, inside a `role="region"` container.
- **Severity helpers:** `success()`, `error()`, `warning()`, `info()` render with correct severity class + icon + role. `error()` produces `role="alert"` and `aria-live="assertive"`.
- **Open by TemplateRef:** template context receives `$implicit: data` and `ref`. Clicking an in-template button that calls `ref.dismiss()` dismisses.
- **Open by component class:** component injects `TW_TOAST_DATA` and `TW_TOAST_REF`; `ref.dismiss()` called from inside works.
- **Auto-dismiss:** after `duration` ms the toast dismisses; `afterDismissed` emits with `reason: 'timeout'`.
- **Pause on hover:** `pointerenter` stops the timer; advancing `duration + 1000` ms while hovered does not dismiss; `pointerleave` resumes; dismiss fires after remaining time.
- **Pause on focus:** `focusin` on the toast pauses; `focusout` resumes.
- **Dismissible close button:** click dismisses with `reason: 'manual'`.
- **Action button:** renders label, click fires `handler(ref)`; does not auto-dismiss unless handler calls `ref.dismiss()`.
- **Stacking:** three `show()` calls in quick succession result in three toasts in the same container; DOM order matches insertion order (verify per the chosen ordering).
- **Max visible:** `show()` while `activeToasts().length === maxVisible` dismisses the oldest (`reason: 'max-exceeded'`).
- **Position:** each of the six positions creates its own overlay pane with the correct CSS class and global-position anchors. Opening a second toast at the same position reuses the overlay.
- **dismissAll:** closes every active toast across positions.
- **afterAllDismissed:** emits when the last active toast is dismissed.
- **promise() — resolve:** loading toast shown with `duration: 0`; after `await promise` resolves, same ref mutates to success content + severity.
- **promise() — reject:** same flow, severity becomes `error`, politeness becomes `'assertive'`.
- **Programmatic dismiss:** `ref.dismiss()` emits `afterDismissed` with `reason: 'programmatic'`.
- **Escape key:** focus a toast, press Escape → that toast dismisses with `reason: 'manual'`.
- **Swipe-to-dismiss:** simulate pointerdown + pointermove past threshold + pointerup → dismiss with `reason: 'swipe'`. Insufficient swipe → no dismiss, element returns to origin.
- **Swipe disabled:** when `config.swipeToDismiss === false`, pointermove does not translate the element.
- **ARIA attributes:** toast has `aria-live`, `aria-atomic="true"`, region container has `aria-label`.
- **LiveAnnouncer:** `vi.spyOn(liveAnnouncer, 'announce')` is called with text + resolved politeness; not called when `politeness: 'off'`.
- **panelClass:** additional classes appear on the root element via `twMerge`.
- **Overlay reuse:** two sequential toasts at the same position share the same `OverlayRef` instance (spy on `overlay.create`, assert call count).
- **Service destroy:** every open toast is dismissed and every overlay is disposed on `ngOnDestroy`.
- **Parent/child delegation:** a child service's `show()` registers in the parent's active list.

## Public API exports

From `projects/ngx-tw/toast/index.ts`:

```typescript
export { ToastService, provideToast } from './toast';
export { ToastComponent } from './toast-component';
export { ToastRef } from './toast-ref';
export { ToastConfig } from './toast-config';
export {
  TW_TOAST_DATA,
  TW_TOAST_REF,
  TW_TOAST_DEFAULT_OPTIONS,
} from './toast-config';
export type {
  ToastSeverity,
  ToastPosition,
  ToastState,
  ToastDismissReason,
  ToastTemplateContext,
} from './toast-config';
```

Do NOT export `ToastContainerComponent`.

Add to `projects/ngx-tw/src/public-api.ts`:

```typescript
export * from 'ngx-tw/toast';
```

## Constraints

- Service is **not** `providedIn: 'root'`. Use the `@Injectable()` decorator without arguments and register via `provideToast()` — matches `provideTwDialog()`.
- All Angular conventions from CLAUDE.md apply. Key reminders:
  - `ChangeDetection.OnPush` on `ToastComponent` and `ToastContainerComponent`.
  - `host` object for host bindings — never `@HostBinding` / `@HostListener`.
  - `inject()` for DI — no constructor injection.
  - `input()` / `output()` signal APIs. No decorators. No `model()` here (no two-way binding needs).
  - JSDoc on every `input()`, `output()`, and public service method, public ref method.
  - `twMerge: true` in `tv()` config.
- **Semantic color tokens only** — mirror alert's soft-variant compound-variant classes. Never raw Tailwind palette colors. Neutral severity uses surface/fg/border tokens.
- **Visual design tokens** — `rounded-lg`, `shadow-md`, `p-4`, `size-5`, `gap-3` between icon and content, `gap-2` between stacked toasts, `focus-visible:outline-2 outline-offset-2 outline-primary-500`. Do not invent new values.
- **Animations** — use `animate.enter` / `animate.leave` with CSS classes defined in `_base.css`. No `@angular/animations`.
- **`prefers-reduced-motion`** — handled in CSS (fallback to instant `fade-in`). No JS branching.
- **CDK lifecycle** — create each position overlay once, reuse across toasts, dispose only on service destroy.
- **Subscription cleanup** — timers cleared on dismiss; subjects completed on service destroy.
- **No `fakeAsync` / `tick`** — use `vi.useFakeTimers()` + `vi.advanceTimersByTime()` + `await fixture.whenStable()`.
- **No `NgModule`.**
- **No component CSS files** — Tailwind utilities only, except the theme `_base.css` (which is a theme asset, not a component stylesheet).
- **Keep inputs on the public `ToastComponent` under six.** The exception in CLAUDE.md for overlay components applies to the service's `ToastConfig`, which will exceed six fields — that is expected.
