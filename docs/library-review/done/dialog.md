# Dialog — Production-Grade Review

**Entry point:** `ngx-tw/dialog`
**Files:** `projects/ngx-tw/dialog/`

## Snapshot
- Selectors:
  - `tw-dialog-container` (internal, rendered inside the CDK overlay)
  - `[twDialogTitle], tw-dialog-title`
  - `[twDialogSubtitle], tw-dialog-subtitle`
  - `[twDialogHeader], tw-dialog-header`
  - `[twDialogContent], tw-dialog-content`
  - `[twDialogActions], tw-dialog-actions`
  - `[twDialogClose]`
  - `[twDialogIcon]`
- Public classes/directives:
  - Service: `TwDialog` (imperative) + `provideTwDialog(defaults?)` factory
  - Ref: `TwDialogRef`
  - Container: `TwDialogContainer` (internal)
  - Content directives: `TwDialogTitleDirective`, `TwDialogSubtitleDirective`, `TwDialogHeaderDirective`, `TwDialogContentDirective`, `TwDialogActionsDirective`, `TwDialogCloseDirective`, `TwDialogIconDirective`
  - Config: `TwDialogConfig` class + `TW_DIALOG_DATA`, `TW_DIALOG_DEFAULT_OPTIONS` tokens
- Inputs: configuration is via the `TwDialogConfig` class (16+ fields) — service-driven, not template-driven, so the input-cap rule does not apply. Content directives have 1-3 inputs each.
- Outputs: lifecycle observables on `TwDialogRef` (`afterOpened`, `beforeClosed`, `afterClosed`, `backdropClick`, `keydownEvents`).
- Slots: structural content via projection inside the dialog template/component.
- CVA: no
- `tv()` config: yes on `TwDialogContainer` (`dialog-container.ts:26-46`) — single `host` slot with 6 size variants (`xs`/`sm`/`md`/`lg`/`xl`/`fullscreen`). `twMerge: true`. `defaultVariants: { size: 'md' }`.
- A11y CDK utilities used: `@angular/cdk/dialog` (`Dialog`, `CdkDialogContainer`, `DialogRef`), `_IdGenerator` from `@angular/cdk/a11y`, `CdkScrollable`, `CdkPortalOutlet`. CDK Dialog handles focus trap, restore focus, scroll lock, ARIA modal.

## Inputs (TwDialogConfig)
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `size` | `TwDialogSize` (`xs`/`sm`/`md`/`lg`/`xl`/`fullscreen`) | `'md'` | yes | extra `'fullscreen'` value |
| `enterAnimationDuration` | `number` | `150` | yes | ms |
| `exitAnimationDuration` | `number` | `120` | yes | ms — note: asymmetric with enter |
| `scrollBehavior` | `TwDialogScrollStrategy` | `'block'` | yes | scroll lock by default |
| `maxWidth` | `number \| string` | `'calc(100vw - 32px)'` | yes | override of `CdkDialogConfig.maxWidth` |
| `data` | `D` | `null` | inherited | from `CdkDialogConfig` |
| `id`, `role`, `ariaModal`, `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`, `autoFocus`, `restoreFocus`, `panelClass`, `backdropClass`, `hasBackdrop`, `width`, `height`, `minWidth`, `minHeight`, `maxHeight`, `direction`, `disableClose`, `closeOnNavigation`, `closePredicate`, `viewContainerRef`, `injector`, `providers` | | (from CDK) | inherited | broad surface; consumer-driven |

### Findings
- `TwDialogConfig` extends `CdkDialogConfig` — gets inputs for free, but `TwDialogConfig` should still **export JSDoc for the inherited fields most consumers will touch** (e.g. `disableClose`, `autoFocus`, `restoreFocus`, `closePredicate`). Compodoc consumes only TwDialog-side annotations; inherited members may not appear in the generated API table. Add brief overrides with JSDoc.
- **`exitAnimationDuration = 120` is asymmetric with `enterAnimationDuration = 150`.** The asymmetric pattern is fine but unusual; the spec (`dialog.spec.ts:78`) hard-codes `EXIT_MS = 120`. Document the choice or symmetrize.
- The `size` axis includes `'fullscreen'` — that breaks the `TwSize` contract (`xs`/`sm`/`md`/`lg`/`xl`). The `TwDialogSize` type is component-specific (`dialog-config.ts:11`). Acceptable because fullscreen is a meaningfully different mode, but it should NOT be conflated with the shared `TwSize` type. ✓ Already done correctly.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `TwDialogRef.afterOpened` | `Observable<void>` | past-tense | fires after enter animation |
| `TwDialogRef.beforeClosed` | `Observable<R \| undefined>` | past-tense pre-event | fires when dismiss starts |
| `TwDialogRef.afterClosed` | `Observable<R \| undefined>` | past-tense | fires after exit animation |
| `TwDialogRef.backdropClick` | `Observable<MouseEvent>` | propertyChange (event-stream) | from CDK |
| `TwDialogRef.keydownEvents` | `Observable<KeyboardEvent>` | propertyChange (event-stream) | from CDK |
| `TwDialog.afterOpened` | `Observable<TwDialogRef>` | past-tense | service-level |
| `TwDialog.afterAllClosed` | `Observable<void>` | past-tense | service-level |
| `TwDialog.openDialogs` | `Signal<readonly TwDialogRef[]>` | readable signal | n/a — not an output |

### Findings
- All observable streams have JSDoc, with clear "before vs after animation" framing. Excellent.
- No `beforeOpened()` event. Probably not needed, but worth noting.
- `keydownEvents()` exposes raw events — consumers might want a higher-level `escape` stream. Not blocking.

## Customization surface
- ng-content slots: the consumer's component/template *is* the dialog content. Content directives style projected children.
- Structural directives:
  - `[twDialogTitle]`: auto-registers id with the container's `aria-labelledby` queue (lines 75-94 of dialog-content.ts).
  - `[twDialogActions]`: registers itself with `_updateActionSectionCount(1)` (lines 147-158).
  - `[twDialogClose]`: closes the enclosing dialog with the forwarded value (lines 165-192).
- Fallback content: N/A — entirely consumer-provided.
- Class merging: `twMerge: true` on container variant.
- Findings:
  - **`findEnclosingDialog()` helper (lines 194-206)** walks the DOM from the directive element up to `tw-dialog-container` and looks up the ref by id. This is necessary because `[twDialogTitle]` etc. are projected children — their injector chain may not find `TwDialogRef`. Works correctly. Document the implication: directives ONLY work when placed inside a dialog container; outside, the inject is null.
  - **`TwDialogIconDirective.color = input<TwColor | undefined>(undefined)`** — uses the shared union with explicit undefined for "no color". Matches the popover pattern. ✓
  - The `actionSectionCount` signal is recorded but **never read by the container's template** (`dialog-container.ts:80`). The signal is incremented/decremented by `TwDialogActionsDirective` (lines 147-158) but the variants config has no compound style based on its value. The signal is exported but dead-weight in the current code. Either wire it (e.g. add bottom padding when no actions section is projected) or remove it.

## CSS / Styling
- tailwind-variants: yes, single `host` slot with 6 size variants (`dialog-container.ts:26-46`)
- twMerge: yes
- Semantic tokens vs raw palette:
  - Container base: `bg-surface-raised text-fg border border-border shadow-md rounded-lg overflow-hidden ... opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closing]:opacity-0 data-[state=closing]:scale-95` (line 29). All semantic. ✓
  - Header, title, subtitle, content, actions classes (`dialog-content.ts:23-145`): all semantic — `text-fg`, `text-fg-muted`, `border-border-muted`. ✓
  - Icon color map (lines 30-39): `bg-{role}-50 text-{role}-600 dark:bg-{role}-950 dark:text-{role}-300`. Explicit `dark:` overrides per project convention. ✓
- Surface/fg/border tokens: extensive and correct. ✓
- Radius compliance: `rounded-lg` on the container, `rounded-full` on the icon. ✓
- Spacing/gap compliance: `gap-3` between icon and header content (line 25 of dialog-content.ts), `gap-2` on actions (line 144). ✓ Padding `px-6 pt-6 pb-4` (header), `px-6 py-4` (content/actions). Outside the strict `p-2/3/4/6/8` codified scale but matches Material's standard dialog padding — defensible.
- Typography compliance: title `text-base font-semibold` (line 69 of dialog-content.ts); subtitle `text-sm text-fg-muted` (line 100); content `text-sm` (line 114). Title is `text-base` — within the spec (CLAUDE.md allows `text-sm` baseline; `text-base` for "interactive triggers lg–xl" but headings inside projected content are explicitly the consumer's responsibility). The library applying `text-base font-semibold` to a title is fine because the title is treated as a structural element, not an h1.
- Focus rings: the container itself uses `outline-none` (line 29 — `flex flex-col outline-none ...`). The CDK auto-focus moves focus into the first focusable element. Container is `tabindex="-1"` (line 67). ✓ — consumers must ensure their internal buttons have `focus-visible:outline-2 outline-offset-2 outline-primary-500`. The `twButton` and `twDialogClose` (paired with a button) inherit those styles from button component when used.
- Dark mode handling: explicit `dark:` overrides on icon colors. Surface/fg tokens auto-adapt. ✓
- Transitions: `transition-[opacity,transform] ease-out motion-reduce:transition-none` on the container (line 29) — specific properties, motion-reduce honored. ✓
- Shadows: `shadow-md` on the container. ✓
- Icon sub-scale: icon container `size-10` (line 56 of dialog-content.ts) — glyph-icon "large standalone" size. ✓
- Findings:
  - Uses `data-[state=open]:` and `data-[state=closing]:` attribute selectors (line 29). The `data-state` attribute is bound from the `state()` signal (line 72 of dialog-container.ts). Clean approach — avoids needing `animate.enter`/`animate.leave` for the modal itself because the dialog has bespoke timing semantics (rAF + transitionend fallback).
  - The dialog uses CSS transitions rather than the project's `animate.enter`/`animate.leave` keyframes. This is justified because:
    1. The state-based transition needs to integrate with the dialog ref's `state()` signal lifecycle.
    2. Enter/exit durations are configurable per-call via `TwDialogConfig.enterAnimationDuration`/`exitAnimationDuration`.
    3. CDK's overlay does not own the timing — the dialog ref owns it via `_startExitAnimation`.
    Document this divergence so future contributors understand why this is the exception.

## Overlay specifics
- CDK Overlay primitives used: `Dialog` from `@angular/cdk/dialog` (the higher-level service), `createBlockScrollStrategy`, `createCloseScrollStrategy`, `createRepositionScrollStrategy`, `createNoopScrollStrategy`. CDK Dialog itself uses CDK Overlay internally.
- Position strategy: CDK Dialog uses a centered global position strategy by default.
- Scroll strategy: configurable via `scrollBehavior` (`'block'` default). Resolved by `resolveScrollStrategy` (`dialog.ts:199-213`).
- Focus trap: yes — CDK Dialog auto-creates and disposes the focus trap; `autoFocus` config controls where focus initially lands.
- Backdrop: yes by default (`hasBackdrop` default in CDK is `true`). `tw-dialog-backdrop` panel class applied.
- Escape close: yes via `cdkRef.keydownEvents` filter (lines 83-94 of dialog-ref.ts). Respects `disableClose`.
- Outside click close: yes via `cdkRef.backdropClick` (line 83 of dialog-ref.ts). Respects `disableClose`. **Bypasses the `disableClose` check at line 110-111** — `disableClose: true` is passed to CDK; the wrapper handles it itself so the exit animation can run. ✓
- Animations: CSS transitions on the container driven by `data-state` (`opening`/`open`/`closing`/`closed`). `requestAnimationFrame` defers the initial state to `'open'` so the initial-style frame paints first (line 157 of dialog-container.ts). Fallback timer guarantees cleanup if the `transitionend` is missed (line 174).
- Z-index / stacking: CDK overlay's stacking — multiple dialogs from the same service stack naturally.
- Findings:
  - **`disableClose: true` is forced on every CDK call (line 111 of dialog.ts)** so the wrapper can run the exit animation. This is correct architecture.
  - `closeOnOverlayDetachments: false` (line 112) is set so the overlay isn't torn down out from under the exit animation. ✓
  - Fallback timer at line 175 of dialog-ref.ts (`+100`) ensures `finishClose` runs even if `animationStateChanged.emit('closed')` is missed. Belt-and-suspenders. ✓
  - The `closePredicate` (config option) is honored before the close even begins (lines 151-161 of dialog-ref.ts). ✓ — this is the parity gap the popover review noted.
  - **Two `transitionend` fallback paddings.** Container has `ANIMATION_FALLBACK_PADDING = 50` (line 49), dialog ref has `+100` on its own fallback (line 175). Different values may race in edge cases. Consolidate.

## Accessibility
- ARIA roles/attributes:
  - Container: `role="dialog"` by default; `'alertdialog'` opt-in via `config.role` (line 13 of dialog-config.ts; lines 68 of dialog-container.ts).
  - `aria-modal` is bound from `config.ariaModal` (line 70 of dialog-container.ts).
  - `aria-labelledby` queue auto-populated by `TwDialogTitleDirective` (lines 75-94 of dialog-content.ts). Multiple titles supported. **Suppressed when `ariaLabel` is set** (line 69 of dialog-container.ts) — `aria-label` takes priority, correct per ARIA spec.
  - `aria-describedby` forwarded from config.
  - `id` forwarded from config.
- Keyboard support:
  - Escape closes (filtered to skip when `disableClose: true`).
  - Tab cycles inside the focus trap (CDK).
  - All other keys pass through.
- CDK a11y utilities: `_IdGenerator` (line 74 of dialog-content.ts), CDK Dialog's built-in focus trap. ✓
- aria-describedby wiring: via config string. **No `TwDialogDescriptionDirective` analogue to `TwDialogTitleDirective`.** Could mirror the title pattern for `aria-describedby` — useful when the dialog body is a multi-line paragraph.
- aria-labelledby wiring: ✓ via title queue.
- Focus return on close: CDK Dialog handles via `restoreFocus` config option. Origin (`'keyboard'`/`'mouse'`/`'program'`) is forwarded on close (`dialog-ref.ts:148, 193`).
- AXE risks: minimal — modal pattern correctly implemented.

### Findings
- Consider a `TwDialogDescriptionDirective` (and `aria-describedby` queue) so dialog body paragraphs can label themselves like titles do. Material has `mat-dialog-content` with this. Optional polish.
- The `aria-modal` attribute is bound from `config.ariaModal` but has no default value. CDK Dialog's `DialogConfig` does not default it; the spec expects `true` for modal dialogs. **Set `ariaModal: true` as the default** in `TwDialogConfig` so consumers don't have to remember.

## Tests
- Spec file: yes — `dialog.spec.ts` (443 lines)
- Coverage breakdown:
  - rendering: not-before-open ✓, with component content ✓, with TemplateRef ✓, every size variant ✓
  - backdrop: rendered by default ✓, omitted when disabled ✓, click-to-close ✓, disableClose blocks click ✓
  - keyboard: Escape closes ✓, disableClose blocks Escape ✓
  - close(): with result ✓, closePredicate blocks ✓
  - lifecycle observables: afterOpened once ✓, beforeClosed-then-afterClosed ordering ✓
  - state signal: opening → open → closing → closed ✓
  - service registry: tracks open list ✓, duplicate-id throws ✓, closeAll closes all ✓
  - accessibility: role=dialog ✓, role=alertdialog ✓, aria-labelledby from title ✓, ariaLabel overrides labelledby ✓, aria-modal set ✓
  - TwDialogCloseDirective: forwards value ✓, default button type ✓
  - content directives (offline): icon neutral classes ✓, icon error color ✓, subtitle muted text ✓
  - default options: provideTwDialog defaults merged ✓
- Vitest-specific issues: uses `vi.useFakeTimers()` with `vi.advanceTimersByTime`. Compliant — no `fakeAsync`/`tick`. Uses `ApplicationRef.tick()` once to flush `ngOnInit` after open (line 350) — that's the correct pattern.
- Findings:
  - Missing test: focus management — `autoFocus` lands focus on the first focusable element; `restoreFocus: true` returns to the opener.
  - Missing test: nested dialogs (parent → child via `inject(TwDialog)` from inside a dialog).
  - Missing test: scroll behavior — assert the body scroll-lock is applied with `scrollBehavior: 'block'`.
  - Missing test: `closeAll` of nested dialogs respects parent/child registry (`parentDialog` branch on lines 47-56 of dialog.ts).
  - Missing test: `closeAll` works mid-animation (close one dialog while another is opening).
  - Missing test: `cdkRef.overlayRef.detachments()` path (line 75 of dialog-ref.ts) — verifies the cleanup runs when overlay is forcibly detached.
  - Missing test: the `actionSectionCount` (if kept, see CSS findings).

## Gaps & lacks
1. `actionSectionCount` signal is wired but never read — dead code or unwired feature.
2. `ariaModal` has no default in `TwDialogConfig` — should default to `true` for the dialog role.
3. No `TwDialogDescriptionDirective` — `aria-describedby` can only be set via config string.
4. Inherited `CdkDialogConfig` fields lack project-side JSDoc (Compodoc may produce empty API rows).
5. Two animation fallback paddings (50ms in container, 100ms in ref) — consolidate.
6. Focus-management and scroll-lock are not under test.
7. Asymmetric enter (150ms) / exit (120ms) durations — document the choice.

## Concrete recommendations (deep-dive prompt body)

### Goal
Polish the dialog API: default `aria-modal` to `true`, expose a description directive for full ARIA labelling parity, remove the dead-weight `actionSectionCount`, consolidate animation fallback timers, and round out test coverage on focus management and scroll behavior.

### Tasks
1. **Default `ariaModal` to `true` (P0)** — accessibility
   - File(s): `projects/ngx-tw/dialog/dialog-config.ts:31-46`
   - Why: A `role="dialog"` element opened modally MUST set `aria-modal="true"`. CDK Dialog does not default it. Today consumers must remember to pass `ariaModal: true` in every call.
   - Change: Add `override ariaModal?: boolean = true;` in `TwDialogConfig` with a JSDoc one-liner.
   - Acceptance: Open a dialog with no `ariaModal` in config → `aria-modal="true"` on the container. The existing test `should set aria-modal when configured` should still pass; add a parallel `should default aria-modal to true`.
2. **Add `TwDialogDescriptionDirective` + `aria-describedby` queue (P1)** — accessibility parity with title
   - File(s): `projects/ngx-tw/dialog/dialog-content.ts` + `dialog-container.ts:62-75` (host bindings) + `index.ts` (export)
   - Why: Title text auto-registers via `_addAriaLabelledBy`; description text should mirror that for `aria-describedby`. Today consumers pass an explicit `ariaDescribedBy: 'my-id'` string.
   - Change:
     - Add `_ariaDescribedByQueue` to the container (parallel to `_ariaLabelledByQueue`).
     - Add a `TwDialogDescriptionDirective` (`selector: '[twDialogDescription], tw-dialog-description'`) that generates an id and registers it.
     - Update container `[attr.aria-describedby]` to take precedence from `config.ariaDescribedBy` first, then fall back to `_ariaDescribedByQueue[0]`.
   - Acceptance: A dialog with `<p twDialogDescription>...` produces `aria-describedby={id-of-p}` on the container.
3. **Wire or remove `actionSectionCount` (P1)** — dead-code hygiene
   - File(s): `projects/ngx-tw/dialog/dialog-container.ts:80-83, 136-138`; `dialog-content.ts:147-158`
   - Why: The signal is incremented/decremented but never consumed in the template or styling.
   - Change: Pick one.
     - **Option A — Wire it:** Use `data-actions="0"` vs `data-actions="1+"` on the container host and add a compound variant that shifts content padding when no actions are present. This gives a tighter dialog when actions are omitted.
     - **Option B — Remove it:** Delete the signal, the `_updateActionSectionCount` method, and the directive's `ngOnInit`/`ngOnDestroy` hooks that drive it. Reduces complexity for an unused feature.
   - Acceptance: If wired, a dialog without `[twDialogActions]` renders with different padding than one with actions, validated by a snapshot of the container `data-*` attribute and class output.
4. **Re-export JSDoc for common inherited config (P1)** — Compodoc surface
   - File(s): `projects/ngx-tw/dialog/dialog-config.ts:31-46`
   - Why: `TwDialogConfig extends CdkDialogConfig`. Compodoc only documents fields with JSDoc in the project. Inherited members like `disableClose`, `autoFocus`, `restoreFocus`, `closePredicate`, `panelClass`, `backdropClass`, `hasBackdrop`, `closeOnNavigation` end up undocumented in the API table.
   - Change: Add `override` declarations with project-side JSDoc for these commonly-consumed fields. Example: `/** Whether Escape and backdrop click are blocked. Defaults to `false`. */ override disableClose?: boolean = false;`
   - Acceptance: Compodoc regenerates and shows API rows for each annotated field.
5. **Consolidate animation fallback timers (P2)**
   - File(s): `dialog-container.ts:49, 174` + `dialog-ref.ts:175-178`
   - Why: Two different fallback paddings (50ms, 100ms) for the same exit animation. They are independent timers; in rare cases one fires before the other.
   - Change: Pick one source. Move the fallback timer entirely into `TwDialogContainer._startExitAnimation` so `TwDialogRef.finishClose` is called via the container's `animationStateChanged` emission. Remove the separate `closeFallbackTimer` in `TwDialogRef`. Alternatively, make the ref's timer a no-op when the container's timer fires first (already done via the `if (this.stateSignal() === 'closed') return` guard, so the change is purely tidy).
   - Acceptance: All existing dialog tests pass. A unit test asserting `finishClose` is called exactly once (use a spy on the `afterClosedSubject`).
6. **Document the CSS-transition divergence from `animate.enter`/`animate.leave` (P2)**
   - File(s): `dialog-container.ts:26-46` + a comment above the class
   - Why: Dialog is the one library overlay that does not use `animate.enter`/`animate.leave`. Future contributors will ask why.
   - Change: Comment block explaining: dialog uses a `data-[state]` driven CSS transition because the ref-owned lifecycle needs per-call configurable durations and integration with `state()`; `animate.enter`/`animate.leave` cannot accept runtime-configurable duration.
   - Acceptance: Comment lands; CLAUDE.md "Don'ts" section reference unchanged (no contradiction).
7. **Test coverage gaps (P1)**
   - File(s): `dialog.spec.ts`
   - Add tests:
     - `autoFocus`: dialog opens with focus on the first focusable element.
     - `restoreFocus: true` (default): closing returns focus to the opener.
     - Scroll lock: `scrollBehavior: 'block'` adds the body lock class.
     - Nested dialogs: open a child dialog from inside the parent, verify parent's `openDialogs` includes both.
     - `closeAll` mid-animation: open A, start closing A, open B, close all — assert both end up `closed`.
     - `actionSectionCount`: if kept, render with/without actions and assert padding.
     - `cdkRef.overlayRef.detachments()` path: forcibly detach the overlay, expect the ref to settle into `closed` state.

### Out of scope
- Adding `beforeOpened` — niche enough to defer.
- Splitting `TwDialogConfig` into per-call vs app-default shapes — current pattern works.
- Migrating to `animate.enter`/`animate.leave` — see task 6; the divergence is justified.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- dialog`
- Visual check: `http://localhost:4600/components/dialog`
- A11y: `npm run e2e:a11y` and manual NVDA / VoiceOver pass — confirm modal context is announced and title + description are both read.

## Priority
**P0** — `ariaModal=true` default is shipping-blocking for a11y compliance. P1 items (description directive, dead-code hygiene, inherited config JSDoc, test coverage) are polish. Dialog is overall the most architecturally complete overlay component in the library — only minor gaps remain.
