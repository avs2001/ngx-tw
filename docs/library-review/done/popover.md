# Popover — Production-Grade Review

**Entry point:** `ngx-tw/popover`
**Files:** `projects/ngx-tw/popover/`

## Snapshot
- Selectors: `[twPopover]` (trigger directive), `[twPopoverClose]` (close helper). Internal overlay component: `tw-popover-overlay` (not exported).
- Public classes/directives: `PopoverDirective`, `PopoverCloseDirective`
- Inputs: 16 on `PopoverDirective` (overlay exception applies). `twPopoverOpen` is a `model<boolean>`.
- Outputs: 2 (`twPopoverOpened`, `twPopoverClosed`)
- Slots: content provided via `[twPopover]` value (`TemplateRef<PopoverTemplateContext>` or component class). Template context exposes `$implicit` (data) + `close()`.
- CVA: no
- `tv()` config: yes, slots `wrapper` / `panel` / `arrow`, twMerge on, defaultVariants `{ size: 'md' }`
- A11y CDK utilities used: `FocusTrapFactory` (`@angular/cdk/a11y`), `Overlay`, `OverlayRef`, `CdkPortalOutlet`, `ComponentPortal`, `TemplatePortal`

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `twPopover` | `TemplateRef<PopoverTemplateContext> \| Type<unknown>` | required | yes | content |
| `twPopoverPosition` | `PopoverPosition` (12 values) | `'bottom'` | yes | |
| `twPopoverTriggerOn` | `PopoverTrigger` (`click` \| `focus` \| `manual`) | `'click'` | yes | |
| `twPopoverDisabled` | `boolean` | `false` | yes | |
| `twPopoverOpen` | `boolean` (model) | `false` | yes | two-way bindable |
| `twPopoverSize` | `TwSize` | `'md'` | yes | uses shared type ✓ |
| `twPopoverOffset` | `number` | `8` | yes | px |
| `twPopoverArrow` | `boolean` | `true` | yes | True-default — same issue as tooltip: no inline justification |
| `twPopoverBackdrop` | `PopoverBackdrop` (`transparent` \| `dimmed` \| `none`) | `'transparent'` | yes | |
| `twPopoverCloseOnOutside` | `boolean` | `true` | yes | True-default — needs inline justification or rename to `keepOpenOnOutside` |
| `twPopoverCloseOnEscape` | `boolean` | `true` | yes | True-default — same |
| `twPopoverScrollStrategy` | `PopoverScrollStrategy` (`reposition` \| `close` \| `block`) | `'reposition'` | yes | missing `'noop'` |
| `twPopoverTrapFocus` | `boolean` | `true` | yes | True-default — same |
| `twPopoverData` | `unknown` | `undefined` | yes | |
| `twPopoverPanelClass` | `string \| string[]` | `''` | yes | |
| `twPopoverColor` | `TwColor \| undefined` | `undefined` | yes | optional top-border accent |
| `twPopoverAriaLabel` | `string \| undefined` | `undefined` | yes | |

### Findings
- Overlay-bearing exception applies — 17 input surface is fine.
- **Four `true`-default booleans** (`twPopoverArrow`, `twPopoverCloseOnOutside`, `twPopoverCloseOnEscape`, `twPopoverTrapFocus`) lack the required inline JSDoc justification per CLAUDE.md "Boolean defaults". Either codify them in the exception list with comments or flip + rename. Three of them (close-on-outside, close-on-escape, trap-focus) are reasonable safety defaults; their justifications would be one-liners.
- `PopoverScrollStrategy` enum omits `'noop'`. CDK exposes it and the tooltip review notes that some overlay use cases need it. Add for completeness.
- `twPopoverAriaLabelledBy` is missing — only `twPopoverAriaLabel` is exposed. When the popover contains a heading (`<h2 twDialogTitle>`-style), `aria-labelledby` is the correct pattern. Dialog has this; popover should too.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `twPopoverOpened` | `void` | past-tense | fires at end of `openPopover()` |
| `twPopoverClosed` | `void` | past-tense | fires after the 150ms close animation |

### Findings
- Both follow the project's past-tense action convention.
- Asymmetry: `Opened` is emitted synchronously when the overlay attaches; `Closed` is emitted after the close animation completes. Material splits this into `opened`/`afterOpened`/`closed`/`afterClosed`. Acceptable to keep simple, but document the timing.
- No `beforeClose` / programmatic veto. `closePredicate` exists on dialog (`TwDialogConfig.closePredicate`) — popover lacks a parallel. Optional enhancement.

## Customization surface
- ng-content slots: none directly — content is the template/component passed in `twPopover`.
- Structural directives: `[twPopoverClose]` is a content-side helper; clicking it calls the injected `PopoverRef.close()`.
- Fallback content: N/A — content is fully consumer-provided.
- Class merging: `twMerge: true`. Consumer classes pass through `twPopoverPanelClass` and are merged onto the `panel` slot at lines 279-284.
- Findings:
  - `PopoverRef` (line 12-15 of popover-tokens.ts) exposes only `close()`. Material's `OverlayRef`-style refs also expose `updatePosition()`, observables, etc. Acceptable minimalism for now; document the limit.
  - `PopoverTemplateContext` correctly types `$implicit` and `close` so template authors get type hints.
  - `POPOVER_DATA` / `POPOVER_REF` are both available to *component* content. **However**, only `POPOVER_REF` is injected with `{ optional: true }` inside `PopoverCloseDirective`. Outside a popover, the directive becomes a no-op silently — that is intentional. Document it.

## CSS / Styling
- tailwind-variants: yes, 3 slots
- twMerge: yes
- Semantic tokens vs raw palette:
  - Panel base: `bg-surface-overlay text-fg text-sm border border-border rounded-lg shadow-md` (line 78). All semantic. ✓
  - Arrow base: same tokens (line 79). ✓
  - Color accent map (lines 97-106): all semantic `border-t-{role}-500`. ✓
  - Dimmed backdrop: `bg-black/20` (line 529) — uses raw `black`. The Tailwind v4 default `black` is fine for an overlay backdrop, but for theme parity consider `bg-fg/20` or a dedicated `--color-backdrop`.
- Surface/fg/border tokens usage: extensive use of `bg-surface-overlay`, `text-fg`, `border-border`. Excellent.
- Radius compliance: `rounded-lg` (line 78). ✓
- Spacing/gap compliance: size scale `p-2`/`p-3`/`p-4`/`p-6`/`p-8` (lines 83-88). Matches the container padding scale.
- Typography compliance: `text-sm` (line 78). ✓
- Focus rings compliance: the popover's internal panel does not own focus — the focus trap moves focus to the first focusable child. Consumers must ensure children have `focus-visible:outline-2 outline-offset-2 outline-primary-500`. Worth a JSDoc note on the directive.
- Dark mode handling: not needed for the neutral surface (the surface/fg/border tokens auto-adapt). The color accent (`border-t-{role}-500`) is light/dark agnostic. ✓
- Transitions: no transition classes on the panel itself. The enter/leave animation is via `animate.enter`/`animate.leave` keyframes only. Reasonable since position changes during scroll use CDK's own positioning.
- Shadows: `shadow-md` (line 78). ✓
- Icon sub-scale: arrow is `size-2.5` (line 79). Same decorative-element treatment as tooltip; outside the strict icon rules. ✓
- Findings:
  - **Backdrop is `bg-black/20` (line 529).** Consider a theme token like `--color-backdrop` so consumers can theme it. Otherwise acceptable.
  - **No `motion-reduce:` annotation on `animate.enter`/`animate.leave` host bindings.** The keyframes themselves handle `prefers-reduced-motion` in `_base.css:293-297`, so this is fine at the CSS layer — but the project pattern also adds `motion-reduce:transition-none` on transition utilities. None applied here because there are no `transition-` utilities; OK.

## Overlay specifics
- CDK Overlay primitives used: `Overlay`, `OverlayRef`, `FlexibleConnectedPositionStrategy`, `CdkPortalOutlet`, `ComponentPortal`, `TemplatePortal`, `FocusTrapFactory`
- Position strategy: `flexibleConnectedTo(elementRef).withPositions(positions).withFlexibleDimensions(false).withPush(true).withViewportMargin(8)` (lines 518-524). Correctly uses push and viewport margin.
- Scroll strategy: configurable via `twPopoverScrollStrategy`. Default `reposition`.
- Focus trap: yes via `FocusTrapFactory` (line 670-675). `focusInitialElementWhenReady()` is called.
- Backdrop: configurable (`transparent` | `dimmed` | `none`). Click closes when backdrop present (lines 589-592). When `none` + `closeOnOutside`, uses `outsidePointerEvents()` (lines 596-600).
- Escape close: yes — handled both at the trigger host (line 305) and inside the overlay via `keydownEvents()` (lines 603-609). Belt-and-suspenders, good.
- Outside click close: yes when no backdrop (`outsidePointerEvents()`).
- Animations: `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"` (lines 248-249). Keyframes in `_base.css:33-62`. The directive manually waits `ANIMATION_DURATION = 150` ms (line 69, lines 489-507) before detaching — needed because CDK doesn't await `animate.leave` completion.
- Z-index / stacking: `z-50` on the wrapper (line 76) — same redundancy issue as tooltip. CDK overlay container has its own stacking. Remove.
- Findings:
  - **`closePopover()` (lines 479-508) returns focus to the trigger element via `this.elementRef.nativeElement.focus()` BEFORE the leave animation completes (line 487).** If focus was inside the overlay, this works. If a focus trap is active and the user pressed Escape, the trap is destroyed first (line 484), then focus moves — good. But the focus shift is unconditional, even when the popover was opened on `focus` trigger (where focus already returned naturally). The condition should be "only refocus the trigger if focus is currently inside the overlay" — otherwise we clobber subsequent focus moves.
  - The position-strategy is created twice — once in `ensureOverlay` (lines 510-524) and again in `updatePositionStrategy` (lines 552-579) on every open. The subscription in `updatePositionStrategy` uses `takeUntilDestroyed(this.destroyRef)` which is the *directive's* destroy ref, not the open-cycle. After many open/close cycles, the subscriptions accumulate. Move position-change subscriptions to the `perOpenSubs` cleanup (already managed at lines 581-610).
  - `withPush(true)` is set on the position strategy. Combined with `withFlexibleDimensions(false)`, that's correct — the popover is fixed-size and pushes into the viewport rather than shrinking.
  - **Component-portal content path is wired (lines 653-668)** — consumers can pass `Type<unknown>`. The injector provides `POPOVER_DATA` and `POPOVER_REF`. ✓

## Accessibility
- ARIA roles/attributes:
  - Trigger: `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls={overlay.id}` (lines 299-301). ✓
  - Overlay: `role="dialog"`, `aria-label` from input (lines 246-247). **Missing `aria-modal="true"`** — popover is a focus-trapped dialog and should set it.
  - **No `aria-labelledby` plumbing.** Title-projected popovers can't announce their heading. Add a Title directive analogous to `TwDialogTitleDirective`.
- Keyboard support:
  - Tab cycles inside the focus trap (CDK handles it). ✓
  - Escape closes (configurable). ✓
  - No type-ahead — not expected.
- CDK a11y utilities: `FocusTrapFactory` used correctly. **However**, `focusInitialElementWhenReady()` is called once but the directive does NOT manage `restoreFocus` semantics like `ConfigurableFocusTrap` or `InteractivityChecker`. Acceptable for now.
- aria-describedby wiring: none. Tooltip-style description is not expected, but if a popover has a body paragraph it could be announced. Add `twPopoverAriaDescribedBy` as a follow-up.
- aria-labelledby wiring: missing — see above.
- Focus return on close: `this.elementRef.nativeElement.focus()` (line 487). Works for `click` trigger; for `focus` trigger the focus state is already correct, so a guard would help.
- AXE risks:
  - **No `aria-modal="true"`** on the dialog role. AT may not lock context to the popover.
  - Title content cannot be reflected in `aria-labelledby` without a header directive.

### Findings
- Add `aria-modal="true"` on the overlay host (line 248 host block) when `twPopoverTrapFocus()` is true (modal-ish behavior).
- Add a `TwPopoverTitleDirective` that registers its id into the overlay's `aria-labelledby`. Mirror the `TwDialogTitleDirective` pattern (`dialog-content.ts:67-94`).

## Tests
- Spec file: yes — `popover.spec.ts` (820 lines)
- Coverage breakdown:
  - rendering: click open, second-click toggle close ✓
  - sizes: all 5 ✓
  - positions: 8 of 12 (same gap as tooltip — `left-start`/`left-end`/`right-start`/`right-end` missing)
  - color accent: present + absent ✓
  - disabled: blocked + closes-when-disabled-while-open ✓
  - model binding: open + close-syncs-model ✓
  - template context: `$implicit` + `close()` ✓
  - PopoverCloseDirective: ✓
  - component content: with injected data ✓
  - arrow: shown/hidden ✓
  - trigger modes: focus open + click blocked when focus mode ✓
  - keyboard: Escape on/off ✓
  - backdrop: backdrop click closes + focus return ✓
  - accessibility: aria-haspopup, aria-expanded, role=dialog, unique id, aria-controls ✓
  - outputs: opened sync, closed after animation ✓
  - programmatic control: open/close/toggle ✓
  - overlay reuse: same overlay across cycles ✓
  - focus management: Escape returns focus ✓
  - cleanup on destroy ✓
- Vitest-specific issues: uses `vi.useFakeTimers()` + `vi.advanceTimersByTime()`. Compliant.
- Findings:
  - Missing test: scroll strategies (`close`, `block`) behavior.
  - Missing test: `outsidePointerEvents()` path when backdrop is `none`.
  - Missing test: `twPopoverPanelClass` applied + merged.
  - Missing test: focus trap actually traps Tab inside the panel.
  - Missing test: position fallback (force overlap with viewport edge, assert the second position kicks in).
  - Missing test: subscription accumulation regression (open/close 10 cycles, assert subscription count is stable).

## Gaps & lacks
1. No `aria-modal="true"` despite `role="dialog"` and active focus trap.
2. No `aria-labelledby` mechanism — no `TwPopoverTitleDirective`.
3. Four `true`-default booleans lack the required inline justification per CLAUDE.md "Boolean defaults".
4. Position-change subscriptions accumulate over open/close cycles (lines 542-549 + 571-578 use directive-lifetime cleanup instead of per-open).
5. Focus return on close is unconditional — clobbers focus when caller is closing programmatically and has moved focus elsewhere.
6. `twPopoverScrollStrategy` enum omits `'noop'`.
7. `bg-black/20` for dimmed backdrop bypasses the token system.
8. Redundant `z-50` on the wrapper.
9. Test coverage gaps on scroll strategies, focus trap, position fallback.

## Concrete recommendations (deep-dive prompt body)

### Goal
Bring `ngx-tw/popover` to dialog-equivalent accessibility, eliminate the subscription leak across open/close cycles, and codify the true-default booleans. Add a title directive so heading-bearing popovers get proper `aria-labelledby`.

### Tasks
1. **Set `aria-modal="true"` when focus is trapped (P0)** — accessibility
   - File(s): `projects/ngx-tw/popover/popover.ts:245-250` (overlay host) + `:246-247`
   - Why: A focus-trapped `role="dialog"` MUST set `aria-modal="true"` so AT locks context to it. Without it, screen-reader virtual cursors can escape.
   - Change: Add `[attr.aria-modal]` to the `PopoverOverlayComponent` host bindings. Wire it from a signal that mirrors `twPopoverTrapFocus()`. When `twPopoverTrapFocus = false`, omit the attribute (set to `null`).
   - Acceptance: Inspecting the overlay host with `twPopoverTrapFocus=true` shows `aria-modal="true"`. With `false`, the attribute is absent.
2. **Add `TwPopoverTitleDirective` + `aria-labelledby` queue (P0)** — accessibility
   - File(s): `projects/ngx-tw/popover/` — new file `popover-title.ts`; update `popover.ts` overlay host bindings; update `index.ts` exports.
   - Why: Popovers commonly contain a heading; that heading is the natural label. Mirroring `TwDialogTitleDirective` (`dialog/dialog-content.ts:67-94`) keeps the patterns consistent across overlay components.
   - Change: New directive selector `[twPopoverTitle], tw-popover-title` that:
     1. Generates a unique id via `_IdGenerator`.
     2. Registers/unregisters the id on the enclosing `PopoverOverlayComponent` via a method like `_addAriaLabelledBy(id)`.
     3. Overlay host gets `[attr.aria-labelledby]="ariaLabelledByQueue[0]"` (suppressed when `twPopoverAriaLabel` is set, per the dialog precedent).
   - Acceptance: A popover with `<h3 twPopoverTitle>Settings</h3>` produces `aria-labelledby={heading.id}` on the dialog element, and the heading carries the same `id`.
3. **Fix position-change subscription leak (P1)**
   - File(s): `projects/ngx-tw/popover/popover.ts:542-579`
   - Why: `positionChanges.subscribe(...)` uses `takeUntilDestroyed(this.destroyRef)` which is the directive's lifetime. With each open the strategy is replaced via `updatePositionStrategy` (line 568) but the old subscription stays bound to the (disposed) old strategy. Memory + subtle re-emission risk.
   - Change: Move the position-change subscription into `subscribePerOpen()` (lines 581-610) where it can be torn down with `this.perOpenSubs?.unsubscribe()` on each close. Drop the `takeUntilDestroyed` indirection there.
   - Acceptance: After 50 open/close cycles in a unit test, the strategy's `positionChanges` observers count is `<= 1` (use `(strategy.positionChanges as any).observers?.length` or RxJS metadata).
4. **Guard focus return on close (P1)**
   - File(s): `projects/ngx-tw/popover/popover.ts:479-508`
   - Why: `closePopover` unconditionally focuses the trigger (line 487). When a consumer programmatically closes the popover after moving focus elsewhere (e.g. transition to a new page), this snaps focus back unexpectedly.
   - Change: Before line 487, check whether `document.activeElement` is inside `this.overlayRef?.overlayElement`. Only call `this.elementRef.nativeElement.focus()` when focus is currently inside the overlay (i.e. the trap is still holding focus).
   - Acceptance: Unit test where focus is moved outside the popover (e.g. to `document.body`) before `close()` is called — assert that focus does not bounce back to the trigger after the animation.
5. **Justify the four `true`-default booleans (P1)**
   - File(s): `projects/ngx-tw/popover/popover.ts:324-348`
   - Why: CLAUDE.md "Boolean defaults" requires `true` defaults to either appear in the codified list or carry inline justification. `twPopoverArrow`, `twPopoverCloseOnOutside`, `twPopoverCloseOnEscape`, and `twPopoverTrapFocus` are all `input(true)` without justification.
   - Change: Add one-line `// Default true: …` comment above each. Suggested rationales: arrow = "panel reads as a callout without the arrow"; closeOnOutside = "modal expectation — clicking away dismisses"; closeOnEscape = "WAI-ARIA dialog pattern"; trapFocus = "matches role='dialog' baseline".
   - Acceptance: Each `input(true)` carries the justification. Library-fix-plan codified list updated if needed.
6. **Add `'noop'` to `PopoverScrollStrategy` (P2)**
   - File(s): `projects/ngx-tw/popover/popover.ts:57, 695-705`
   - Why: CDK supports `noop` (overlay neither closes nor repositions on scroll). Some embedded popovers want this.
   - Change: `export type PopoverScrollStrategy = 'reposition' | 'close' | 'block' | 'noop';`. Add `case 'noop': return this.overlay.scrollStrategies.noop();`.
   - Acceptance: Setting `twPopoverScrollStrategy="noop"` keeps the popover open and at its original position during ancestor scroll.
7. **Token-based dimmed backdrop (P2)**
   - File(s): `projects/ngx-tw/popover/popover.ts:528-529` + `projects/ngx-tw/theme/_semantic.css`
   - Why: `bg-black/20` is a raw color. Consumers theming dark mode may want a different alpha or color.
   - Change: Define `--color-backdrop: oklch(0 0 0 / 0.4)` (or similar) in `_semantic.css`, then in popover use `backdropClass: 'bg-(--color-backdrop)'` (Tailwind v4 arbitrary-value-with-CSS-var) or apply via a CSS class shipped with the theme.
   - Acceptance: Consumer who overrides `--color-backdrop` in their theme sees the dimmed backdrop change.
8. **Drop the redundant `z-50` (P2)**
   - File(s): `projects/ngx-tw/popover/popover.ts:76`
   - Change: Remove `z-50` from the wrapper slot. CDK overlay container manages stacking.
9. **Test coverage gaps (P2)**
   - File(s): `projects/ngx-tw/popover/popover.spec.ts`
   - Add tests for: scroll strategies (`close`/`block`/`noop`); `outsidePointerEvents` path with `backdrop="none"`; `twPopoverPanelClass` merging; focus trap actually keeping Tab inside; position fallback; subscription accumulation regression from task 3.

### Out of scope
- Splitting the directive into a `PopoverTrigger` + `PopoverContent` pair (Radix-style). Current shape is intentional and matches Material patterns.
- Adding `closePredicate` parity with dialog — useful but defer.
- Nested popover support — not currently a requirement.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- popover`
- Visual check: `http://localhost:4600/components/popover`
- A11y: `npm run e2e:a11y` and manual NVDA / VoiceOver pass — confirm the heading announces when popover opens.

## Priority
**P0** — accessibility tasks (`aria-modal` + `aria-labelledby` via title directive) are shipping-blocking; the subscription leak is a latent reliability bug. Popover is a building block for menus, dropdowns, and custom selects so a11y fixes here ripple downstream.
