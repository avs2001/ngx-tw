# Toast — Production-Grade Review

**Entry point:** `ngx-tw/toast`
**Files:** `projects/ngx-tw/toast/`

## Snapshot
- Selectors:
  - `tw-toast` (visual component — `ToastComponent`)
  - `tw-toast-container` (internal flex-column host per position)
  - `[twToastIcon]`, `[twToastTitle]`, `[twToastDescription]`, `[twToastAction]` (content directives that style projected children)
- Public classes/directives:
  - Service: `ToastService` + `provideToast(defaults?)` factory
  - Ref: `ToastRef`
  - Visual: `ToastComponent` (also exported so consumers can render their own toast layout in custom `TemplateRef`/component content)
  - Content directives: `ToastIconDirective`, `ToastTitleDirective`, `ToastDescriptionDirective`, `ToastActionDirective`
  - Config: `ToastConfig` class + `TW_TOAST_DATA`, `TW_TOAST_REF`, `TW_TOAST_DEFAULT_OPTIONS` tokens
- Inputs:
  - `ToastService` is config-driven (`ToastConfig` ~15 fields).
  - `ToastComponent` inputs: 4 (`severity`, `dismissible`, `icon`, `ariaLabel`).
- Outputs: `ToastComponent`: 2 (`dismissed`, `actionClicked`). Lifecycle observables on `ToastRef` (`afterOpened`, `beforeDismissed`, `afterDismissed`, `_updates` internal). Service-level: `afterOpened`, `afterAllDismissed`.
- Slots: structural — `tw-toast` projects `[twToastIcon]`, `[twToastTitle]`, `[twToastDescription]`, `[twToastAction]` plus a default content slot. Fallback severity-default icon SVG renders when no `[twToastIcon]` is projected.
- CVA: no
- `tv()` config: yes (`toast-component.ts:14-99`) — 7 slots: `root`, `icon`, `title`, `description`, `content`, `action`, `dismiss`. Variants by `severity` use `compoundVariants` to set per-slot classes. `twMerge: true`. `defaultVariants: { severity: 'info' }`.
- A11y CDK utilities used: `LiveAnnouncer` (`@angular/cdk/a11y`), `Overlay`, `OverlayRef`, `createGlobalPositionStrategy`, `ComponentPortal`, `CdkPortalOutlet`.

## Inputs (ToastConfig)
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `severity` | `ToastSeverity` | `'info'` | yes | drives color + role + live politeness |
| `position` | `ToastPosition` | `'bottom-right'` | yes | per-position overlay |
| `duration` | `number` | `5000` | yes | ms; 0 disables auto-dismiss |
| `dismissible` | `boolean` | `true` | yes | True-default — same project rule applies; not currently in the codified exception list |
| `politeness` | `'polite' \| 'assertive' \| 'off'` | derived | yes | error → assertive; otherwise polite |
| `action` | `ToastAction` | `undefined` | yes | |
| `data` | `D \| null` | `null` | yes | |
| `panelClass` | `string \| string[]` | `undefined` | yes | |
| `icon` | `string \| TemplateRef<void> \| false` | `undefined` | yes | `TemplateRef` listed but never wired |
| `pauseOnInteraction` | `boolean` | `true` | yes | True-default — same |
| `swipeToDismiss` | `boolean` | `true` | yes | True-default — same |
| `maxVisible` | `number` | `5` | yes | per-position cap |
| `id` | `string` | (generated) | yes | |
| `ariaLabel` | `string` | `undefined` | yes | |
| `regionAriaLabel` | `string` | (`'Notifications'`) | yes | applies to region container |

### ToastComponent inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `severity` | `ToastSeverity` | `'info'` | yes | |
| `dismissible` | `boolean` | `true` | yes | True-default |
| `icon` | `string \| false \| undefined` | `undefined` | yes | string is rendered as text glyph in the fallback branch (line 203-205) |
| `ariaLabel` | `string \| undefined` | `undefined` | yes | |

### Findings
- Three `true`-default booleans in `ToastConfig` (`dismissible`, `pauseOnInteraction`, `swipeToDismiss`) and one in `ToastComponent` (`dismissible`). All need either inline justification (CLAUDE.md "Boolean defaults") or to be codified as toast-specific exceptions. Toasts dismissible by default is the right UX, but the codification needs updating.
- `ToastConfig.icon` accepts `TemplateRef<void>` in the type but **the implementation never consumes it as a template**. `ToastRef.iconSignal` is initialized from `config.icon` only when it's `string | false` (line 135-137 of toast-ref.ts: `typeof config.icon === 'string' || config.icon === false ? config.icon : undefined`). Passing a `TemplateRef` silently becomes `undefined`. Either:
  - Wire the template path (best — match the type), or
  - Narrow the public type to `string | false`.
- `ToastConfig.position` defaults to `'bottom-right'` — same default as the Material toast. Reasonable.
- `ToastConfig.maxVisible = 5` is a sensible upper bound. **However** `enforceMaxVisible` (line 240-253 of toast.ts) compares the filtered list count to `max`, and dismisses the oldest when `>= max` (i.e. the comparison is `while (atPosition.length >= max)`). This dismisses one too many. If `max = 5` and we add a 6th, the comparison `5 >= 5` is true → dismiss → now we have 4 visible → loop exits. ✓ Actually this is correct because the new toast is added AFTER `enforceMaxVisible`. Re-reading: the order in `openInternal` is `enforceMaxVisible(...)` then `registerOpen(ref)` then `attachToContainer`. So `atPosition.length` is the COUNT BEFORE adding the new toast. If max=5 and currently 5 visible, the condition `5 >= 5` evicts one. After eviction, the new toast brings the count back to 5. ✓ Correct.
- `regionAriaLabel` is read only from `defaultOptions.regionAriaLabel` in `getContainerForPosition` (line 311 of toast.ts) — **not per-call**. Per-call overrides via `config.regionAriaLabel` are silently ignored. Either honor per-call (each new toast could re-set the region label) or document that this is application-wide only.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `ToastComponent.dismissed` | `void` | past-tense | fires when × button clicked |
| `ToastComponent.actionClicked` | `void` | past-tense | fires when `[twToastAction]` clicked |
| `ToastRef.afterOpened` | `Observable<void>` | past-tense | after enter animation |
| `ToastRef.beforeDismissed` | `Observable<R \| undefined>` | past-tense pre-event | when dismiss starts |
| `ToastRef.afterDismissed` | `Observable<ToastDismissal<R>>` | past-tense | after leave animation; payload includes `reason` |
| `ToastService.afterOpened` | `Observable<ToastRef>` | past-tense | every open |
| `ToastService.afterAllDismissed` | `Observable<void>` | past-tense | when active list empties |

### Findings
- Outputs follow the past-tense convention. `afterDismissed` payload is rich (`reason`, `result`) — excellent.
- `_updates()` is `@internal` — the container uses it to re-announce on `ref.update(...)`. **Wait, actually no** — `ToastService.promise` calls `this.announceUpdate(ref)` directly (lines 155, 166), not via `_updates`. The `_updates()` observable is currently emitted (line 256 of toast-ref.ts) but nothing subscribes to it. Either remove `_updates()` or have the container subscribe to it instead of relying on the service for re-announcement.

## Customization surface
- ng-content slots: `tw-toast` has 5 projection points (`[twToastIcon]`, `[twToastTitle]`, `[twToastDescription]`, default content, `[twToastAction]`) — order in the template at lines 211-214.
- Structural directives: none.
- Fallback content:
  - **Icon slot has correct fallback** — when no `[twToastIcon]` is projected, severity-default SVG renders (lines 177-209). Uses `contentChild(ToastIconDirective)` to detect projection. ✓ Matches the CLAUDE.md fallback convention.
  - Default content slot has no fallback (string content path uses `{{ asString(...) }}` inside a `tw-toast`).
- Class merging: `twMerge: true` on `toastVariants`. `panelClass` from `ToastConfig` flows through `panelClassFor(ref)` (line 247 of toast-container.ts) onto the `tw-toast` element's `[class]` binding.
- Findings:
  - **`@HostBinding`/`@HostListener` not used** anywhere — host blocks throughout. ✓
  - Content directives inject the parent `ToastComponent` and pull their classes from it via `inject(ToastComponent).iconClasses` etc. (`toast-component.ts:109-156`). This means **the directives MUST be inside a `<tw-toast>`** — `inject(ToastComponent)` is not optional. If a consumer applies `[twToastTitle]` outside a `tw-toast`, it throws. Either:
    - Make the inject optional (`inject(ToastComponent, { optional: true })`) and fall back to a default class set, or
    - Document the constraint and reject usage outside `<tw-toast>` with a clearer error.

## CSS / Styling
- tailwind-variants: yes, 7 slots, severity variants via `compoundVariants`
- twMerge: yes
- Semantic tokens vs raw palette:
  - Root: `pointer-events-auto relative flex items-start gap-3 w-full max-w-sm p-4 rounded-lg border shadow-md text-sm` (line 18) — neutral structural classes.
  - Per-severity: `bg-info-50 text-info-800 border-info-300` etc. (lines 41-91). All semantic. ✓
  - Neutral severity uses surface tokens (`bg-surface-raised text-fg border-border`). ✓
- Surface/fg/border tokens: appropriate usage on neutral severity. ✓
- Radius compliance: `rounded-lg` on root, `rounded-md` on action/dismiss buttons. ✓
- Spacing/gap compliance: `gap-3` between icon and content (line 18) ✓, padding `p-4` (line 18) ✓, action button `px-3 py-1.5` (line 24) ✓, dismiss button `size-5` (line 26) ✓.
- Typography compliance: `text-sm` baseline, title `text-sm font-semibold`, description `text-sm`. ✓ — `description` could use `text-fg-muted`-style differentiation but the per-severity color already differentiates it (`text-info-700` vs `text-info-800`).
- Focus rings: action and dismiss buttons use `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (lines 24-26). ✓ Canonical pattern.
- Dark mode handling: **NO `dark:` overrides on any severity variant.** The `bg-info-50 text-info-800 border-info-300` color set will look like a light card on a dark background — possibly too bright. Project convention (codified, per memory entry) is explicit `dark:` overrides on colored variants. Toast is missing this entirely.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on root, action, dismiss (lines 18, 24-26). ✓
- Shadows: `shadow-md` on root. ✓
- Icon sub-scale: built-in icons `size-5` (line 19); dismiss button `size-5` (line 26); content directives match. ✓
- Findings:
  - **Dark-mode override gap.** Each severity needs `dark:bg-{role}-950/30 dark:text-{role}-300 dark:border-{role}-800` style overrides. The success and warning variants in particular will glare in dark mode.
  - The action button hover (`hover:bg-info-100` etc.) does not have a `dark:hover:bg-info-900` counterpart.

## Overlay specifics
- CDK Overlay primitives used: `Overlay`, `OverlayRef`, `createGlobalPositionStrategy`, `ComponentPortal`, `CdkPortalOutlet`
- Position strategy: `createGlobalPositionStrategy` per position (line 320 of toast.ts). 6 positions wired in `buildPositionStrategy` (lines 319-342). One overlay per position, reused for the lifetime of the service.
- Scroll strategy: `noop()` (line 302). Correct — toasts are viewport-anchored and shouldn't move with scroll.
- Focus trap: no — toasts should not steal focus.
- Backdrop: no (`hasBackdrop: false`, line 303). Correct.
- Escape close: yes — per toast via `(keydown.escape)` on the wrapper inside the container template (line 101 of toast-container.ts). **Important constraint**: Escape only closes the focused toast. If the user is not focused on a toast (e.g. typing in a form), Escape does nothing. That matches Material's pattern.
- Outside click close: no — toasts persist until duration expires, user dismisses, or swipes.
- Animations: position-aware enter/leave classes (lines 174-188 of toast-container.ts) — `toast-enter-right`/`toast-leave-right` for right-anchored, `toast-enter-left`/`toast-leave-left` for left, `toast-enter-top`/`toast-leave-top` for top-center, `toast-enter-bottom`/`toast-leave-bottom` for bottom-center. Keyframes in `_base.css:275-289`. ✓ All four axes honored.
- Z-index / stacking: CDK overlay manages it.
- Findings:
  - **One CDK overlay per position is correct and efficient.** Each position gets a `<tw-toast-container>` flex column that stacks individual toasts via `@for`.
  - `panelClass: ['tw-toast-overlay', 'tw-toast-overlay-${position}']` (line 304) gives consumers per-position selectors.
  - The container's `host` includes `role="region"` + `aria-label` (line 82) — correct WAI-ARIA pattern for grouped live announcements.
  - Swipe-to-dismiss is custom (lines 280-353 of toast-container.ts) — uses pointer events with capture, threshold, and opacity fade. Correct direction logic (only allow outward swipes for left/right-anchored toasts). Top/bottom-center allow both directions (line 351 `return true`). Worth a test.
  - **`leaveAnimationOverride` mechanism** (line 88 of toast-ref.ts, line 96 of toast-container.ts) — swipe uses `'fade-out'` instead of the position slide-out because the toast already has a translate transform applied. Clean.

## Accessibility
- ARIA roles/attributes:
  - Container: `role="region"` + `aria-label="Notifications"` (configurable via `regionAriaLabel`). ✓
  - Toast: `role="status"` (default) or `role="alert"` (error severity). Bound from `roleAttr()` (line 282 of toast-component.ts). ✓
  - `aria-live="polite"` (default) or `aria-live="assertive"` (error). Bound from `ariaLiveAttr()` (line 286). ✓
  - `aria-atomic="true"` (line 175). ✓
  - `aria-label` from input (line 173). ✓
- Keyboard support:
  - Escape on a focused toast dismisses it (line 101 of toast-container.ts).
  - Tab cycles to action button + dismiss button when focused.
  - No special menu-style navigation; toasts are independent elements.
- CDK a11y utilities: `LiveAnnouncer` used at `_announceOpen` (lines 203-208 of toast-container.ts) and `_announceUpdate` (line 211-213). Politeness resolved per ref. `politeness: 'off'` skips announcing. ✓
- aria-describedby wiring: N/A.
- aria-labelledby wiring: not applicable (toast is leaf-level).
- Focus return on close: not strictly needed — toasts don't trap focus. When focused inside a dismissing toast, focus naturally moves to the document body when the element is removed. CDK's `LiveAnnouncer` cleanup happens in the announcer's own lifecycle.
- AXE risks:
  - `role="alert"` + `aria-live="assertive"` may cause double announcement on some screen readers (NVDA-on-Firefox is a known case). The `LiveAnnouncer` call PLUS the `aria-live` region announce can compound. Test in NVDA / VoiceOver.

### Findings
- The double-announcement risk is real: `LiveAnnouncer` injects a hidden `aria-live` region into the page; the toast itself has `role="alert"` / `role="status"`. Materially safer to choose one channel. Material Snackbar relies primarily on `LiveAnnouncer` (the snackbar itself has no `role`); `role="status"` on the container makes sense because the toast may show after the announcer was used. **Consider dropping `role="alert"`/`role="status"` on the individual toast** and let `LiveAnnouncer` be the only announcement channel. Counter-argument: when `politeness: 'off'`, the role/live attrs are the only fallback. Pick a clear convention and document it.

## Tests
- Spec file: yes — `toast.spec.ts` (429 lines)
- Coverage breakdown:
  - basic open: mounts string toast ✓, region with aria-label ✓, severity classes + role=status ✓, error → role=alert + aria-live=assertive ✓
  - ToastRef contract: unique id ✓, programmatic dismiss with reason ✓, auto-dismiss after duration ✓, duration=0 sticky ✓, dismissible=false hides close button ✓, click close with reason=manual ✓
  - pause on interaction: hover pauses, leave resumes ✓; pauseOnInteraction=false disables pause ✓
  - actions: handler fires with ref, doesn't auto-dismiss ✓; no-handler action dismisses with reason=action ✓
  - TemplateRef content: renders with `$implicit` + `ref` ✓; ref.dismiss from template closes ✓
  - Component content: injects `TW_TOAST_DATA` + `TW_TOAST_REF` ✓; ref.dismiss from component works ✓
  - stacking + maxVisible: stacks 3 ✓; maxVisible eviction with reason=max-exceeded ✓
  - positions: dedicated overlay per position, reused ✓
  - dismissAll + afterAllDismissed: ✓
  - promise: success swap ✓; error swap ✓
  - accessibility: LiveAnnouncer called with text ✓; politeness=off skips ✓; error aria-atomic=true ✓
  - panelClass: extra classes merged ✓
  - provideToast defaults: applied per-call ✓
- Vitest-specific issues: uses `vi.useFakeTimers()` correctly. Uses `await vi.advanceTimersByTimeAsync(0)` for the promise paths — correct Vitest API. No `fakeAsync`/`tick`. Compliant.
- Findings:
  - Missing test: swipe-to-dismiss. The swipe logic is complex (threshold, direction allowed by position) and has no coverage.
  - Missing test: `swipeToDismiss: false` blocks the pointer handler.
  - Missing test: `_setFocused(true)` pauses (only hover path is tested).
  - Missing test: `update()` re-announces via `LiveAnnouncer` (covered indirectly by promise but not explicitly).
  - Missing test: `regionAriaLabel` per-call vs default-only behavior — currently broken (see Inputs findings).
  - Missing test: Escape on a focused toast dismisses it (the key handler is wired but not asserted).
  - Missing test: dark-mode classes (once added).
  - Missing test: `icon` as `TemplateRef` — would surface the silent type-narrow bug.

## Gaps & lacks
1. No `dark:` overrides on severity variants — colored toasts will glare in dark mode.
2. `ToastConfig.icon: TemplateRef` accepted by type but silently dropped at runtime.
3. `regionAriaLabel` per-call config is ignored — only the service's `defaultOptions.regionAriaLabel` wins.
4. `ToastRef._updates()` observable is emitted but nothing subscribes to it (re-announcement uses a different path).
5. Three `true`-default booleans (`dismissible`, `pauseOnInteraction`, `swipeToDismiss`) lack codified justification.
6. `inject(ToastComponent)` in content directives throws when used outside `<tw-toast>`; should be optional or documented.
7. Double a11y announcement risk: `LiveAnnouncer` + `role="alert"` / `aria-live` on the element.
8. Swipe and focus-pause are not under test.

## Concrete recommendations (deep-dive prompt body)

### Goal
Bring the toast component to dark-mode parity, eliminate the silent type-narrowing in `icon`, decide between `role="alert"` and `LiveAnnouncer` (currently both fire), and close swipe/focus test gaps.

### Tasks
1. **Add dark-mode overrides on every severity (P0)** — project convention
   - File(s): `projects/ngx-tw/toast/toast-component.ts:37-93`
   - Why: The dark-mode override convention is codified in CLAUDE.md ("Explicit `dark:bg-{color}-900/X` is project convention"). Colored toast cards in dark mode currently use the `-50` background which is near-white.
   - Change: For each severity compound-variant block, add dark counterparts:
     - root: `dark:bg-{role}-950/40 dark:text-{role}-200 dark:border-{role}-800`
     - icon: `dark:text-{role}-400`
     - title: `dark:text-{role}-100`
     - description: `dark:text-{role}-300`
     - action: `dark:text-{role}-200 dark:hover:bg-{role}-900`
     - dismiss: `dark:text-{role}-400 dark:hover:bg-{role}-900`
     - For neutral severity, use `dark:bg-surface-raised dark:text-fg dark:border-border` (already auto-adapt via tokens, but explicit is clearer).
   - Acceptance: A toast in `severity="warning"` renders distinguishably between light and dark themes; both pass WCAG AA contrast.
2. **Wire `icon: TemplateRef` or narrow the type (P1)** — public contract correctness
   - File(s): `projects/ngx-tw/toast/toast-config.ts:86-90`, `projects/ngx-tw/toast/toast-ref.ts:135-137`, `projects/ngx-tw/toast/toast-component.ts:175-209`, `projects/ngx-tw/toast/toast-container.ts:106-121`
   - Why: `ToastConfig.icon` is typed `string | TemplateRef<void> | false` but only `string` and `false` are honored. A `TemplateRef` is silently converted to `undefined`.
   - Change: Pick one.
     - **Option A — wire it:** Add a `TemplateRef` branch to the icon rendering. In `ToastComponent`, accept `icon: input<string | TemplateRef<void> | false | undefined>(undefined)` and render via `ngTemplateOutlet` when it's a `TemplateRef`. Update `ToastRef.iconSignal` to store the full type, and update `ToastContainerComponent`'s string toast block to pass the resolved icon through.
     - **Option B — narrow the type:** `ToastConfig.icon: string | false` (and `update()` patch the same). Simpler but loses a feature.
   - Acceptance: A consumer passing a `TemplateRef` for `icon` renders the projected markup inside the icon slot.
3. **Drop one of `role=alert`/`role=status` vs `LiveAnnouncer` to avoid double announcement (P1)** — accessibility
   - File(s): `projects/ngx-tw/toast/toast-component.ts:172-175, 281-288`, `projects/ngx-tw/toast/toast-container.ts:202-213`
   - Why: NVDA + VoiceOver sometimes announce the toast twice — once from `LiveAnnouncer`'s hidden live region and again from the toast's own `role="status"`/`aria-live="polite"`.
   - Change: Match the Material Snackbar pattern. Make `LiveAnnouncer` the only announcement channel:
     - Drop `[attr.role]` / `[attr.aria-live]` from `ToastComponent`. Keep `aria-atomic` and `aria-label` for AT context.
     - Keep the region container as `role="region"` (group label, not live).
     - Keep `LiveAnnouncer.announce(...)` in the container.
   - Acceptance: NVDA / VoiceOver announces each toast once. The unit test asserting `role="status"` is replaced with a test asserting `LiveAnnouncer.announce` is called with the expected politeness.
4. **Honor per-call `regionAriaLabel` (P1)**
   - File(s): `projects/ngx-tw/toast/toast.ts:296-317`
   - Why: `config.regionAriaLabel` is documented as accepted per-call but only the `defaultOptions.regionAriaLabel` is read.
   - Change: In `getContainerForPosition` (line 296+), instead of `this.defaultOptions.regionAriaLabel ?? 'Notifications'`, accept an override parameter and read `config.regionAriaLabel` per `openInternal` call. Optionally only update the region label when it differs from the current value (avoid noisy AT reading).
   - Acceptance: Opening a toast with `regionAriaLabel: 'Errors'` updates the existing container's `aria-label`. Test asserts the attribute changes.
5. **Remove or consume `ToastRef._updates()` (P2)**
   - File(s): `projects/ngx-tw/toast/toast-ref.ts:114, 256, 274-277`
   - Why: The observable is emitted on every `update()` (line 256) but no consumer subscribes. Re-announcement is driven explicitly by `ToastService.announceUpdate` (toast.ts:155, 166).
   - Change: Pick one.
     - **Drop it:** Remove `updatedSubject` and `_updates()`. Service continues to call `announceUpdate` directly.
     - **Use it:** Have `ToastContainerComponent` subscribe to `ref._updates()` on attach and re-announce automatically. This decouples the service from announcement logic.
   - Acceptance: Either the observable is consumed in a test, or it disappears with no behavior change.
6. **Codify or invert the three `true` defaults (P1)**
   - File(s): `projects/ngx-tw/toast/toast-config.ts:58-103`
   - Why: `dismissible`, `pauseOnInteraction`, `swipeToDismiss` all default to `true` without the inline-comment justification CLAUDE.md requires.
   - Change: Two paths.
     - **Inline justification:** Add a JSDoc note on each explaining the default — "Toasts are dismissible by default to give users an escape from sticky notifications", "Pause on interaction matches Material/Radix/Sonner conventions and prevents the toast from disappearing while being read", "Swipe-to-dismiss matches mobile-platform expectations".
     - **Update the codified list:** Add to CLAUDE.md the toast defaults under the boolean-defaults exception list.
   - Acceptance: Each `true` default carries a one-line rationale, or the CLAUDE.md exception list is updated.
7. **Make `inject(ToastComponent)` optional in content directives (P2)**
   - File(s): `projects/ngx-tw/toast/toast-component.ts:109-156`
   - Why: A consumer who applies `[twToastIcon]` to a div outside a `<tw-toast>` (e.g. inside a custom toast template) gets an injection error. The directives should degrade gracefully.
   - Change: Replace `inject(ToastComponent)` with `inject(ToastComponent, { optional: true })`. When null, apply a default class set or no-op the `[class]` binding.
   - Acceptance: Using `[twToastIcon]` outside a `<tw-toast>` does not throw. Used inside, behavior unchanged.
8. **Test coverage gaps (P1)**
   - File(s): `projects/ngx-tw/toast/toast.spec.ts`
   - Add tests:
     - Swipe-to-dismiss: pointer-down → pointer-move past threshold → pointer-up dismisses with reason=swipe.
     - Swipe direction constraint per position (right-anchored doesn't dismiss on leftward swipe).
     - `swipeToDismiss: false` disables the pointer handler.
     - Focus pause: `_setFocused(true)` pauses; `_setFocused(false)` resumes.
     - Per-call `regionAriaLabel` (after task 4).
     - `icon: TemplateRef` rendering (after task 2).
     - Escape key on a focused toast dismisses with reason=manual.
     - `dark:` class presence on severity variants (after task 1).

### Out of scope
- Drag-to-reorder stacked toasts.
- `priority` queue (higher-priority toasts displace lower-priority ones).
- Persistent toasts across navigation — the `closeOnNavigation` pattern from dialog doesn't apply since toasts are global.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- toast`
- Visual check: `http://localhost:4600/components/toast` (light + dark theme toggle)
- A11y: `npm run e2e:a11y` and manual NVDA / VoiceOver pass — confirm single announcement per toast and dark-mode contrast.

## Priority
**P0** — dark-mode parity is the most visible gap (toast is a notification primitive and consumers will absolutely use it in dark mode). The `role`/`LiveAnnouncer` double-announcement risk is a real a11y bug. P1 items (icon TemplateRef wiring, `regionAriaLabel` per-call, true-default justification) are tighter polish. The component is architecturally well-thought-out; gaps are concentrated in the visual layer and a couple of unwired features.
