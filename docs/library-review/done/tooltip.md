# Tooltip — Production-Grade Review

**Entry point:** `ngx-tw/tooltip`
**Files:** `projects/ngx-tw/tooltip/`

## Snapshot
- Selectors: `[twTooltip]` (attribute directive). Internal overlay component: `tw-tooltip-overlay` (not exported).
- Public classes/directives: `TooltipDirective`
- Inputs: 8 (`twTooltip`, `twTooltipPosition`, `twTooltipColor`, `twTooltipSize`, `twTooltipShowDelay`, `twTooltipHideDelay`, `twTooltipDisabled`, `twTooltipArrow`)
- Outputs: 2 (`twTooltipShown`, `twTooltipHidden`)
- Slots: N/A — content is provided via the `twTooltip` input value (string or `TemplateRef`).
- CVA: no (transient overlay, not a form control)
- `tv()` config: yes, slots `wrapper` / `panel` / `arrow`, twMerge on, defaultVariants `{ color: 'neutral', size: 'md' }`
- A11y CDK utilities used: `AriaDescriber` (`@angular/cdk/a11y`), `Overlay`, `ScrollDispatcher`

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `twTooltip` | `string \| TemplateRef<void>` | required | yes | Required input |
| `twTooltipPosition` | `TooltipPosition` (12 values) | `'top'` | yes | 12-way placement |
| `twTooltipColor` | `TwColor` | `'neutral'` | yes | Shared `TwColor` |
| `twTooltipSize` | `TooltipSize` ('sm' \| 'md' \| 'lg') | `'md'` | yes | Component-specific size type, not shared `TwSize` |
| `twTooltipShowDelay` | `number` | `200` | yes | ms |
| `twTooltipHideDelay` | `number` | `0` | yes | ms |
| `twTooltipDisabled` | `boolean` | `false` | yes | Standard pattern |
| `twTooltipArrow` | `boolean` | `true` | yes | True-default lacks the required inline-justification comment (CLAUDE.md "Boolean defaults") |

### Findings
- `TooltipSize` (`'sm' \| 'md' \| 'lg'`) shadows the shared `TwSize` (`'xs'..'xl'`). Every other library size axis uses `TwSize`. Tooltip's component-specific type means consumers can't pass `xs`/`xl`, and the type name conflicts with the canonical contract. **Recommend:** rename + use `TwSize` (or, if 3 sizes is intentional, document why and rename to `TooltipDensity` to avoid implying parity).
- The `twTooltipArrow = input(true)` default lacks the required inline JSDoc comment justifying the `true` default. The CLAUDE.md exception list does not include tooltips; this is a new codified exception or needs flipping.
- No `controlled` mode (no `open` model). Tooltips are intentionally uncontrolled (hover/focus driven), but a `model<boolean>` for open state would unblock controlled patterns (programmatic preview, testing). Optional, not P0.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `twTooltipShown` | `void` | past-tense action | OK |
| `twTooltipHidden` | `void` | past-tense action | OK |

### Findings
- Both outputs follow CLAUDE.md output naming. Payload is `void` — fine.
- `twTooltipShown` is emitted inside `createAndShow()` synchronously after `attach()`. In practice it fires *before* the enter animation completes. Not necessarily wrong, but `MatTooltip` fires `_afterShown` only after `transitionend`. Consider documenting timing or splitting into `opened`/`afterOpened`.

## Customization surface
- ng-content slots: none — content is the `twTooltip` value.
- Structural directives: none.
- Fallback content: N/A.
- Class merging: `twMerge: true` on `tv()`, but the overlay component does not expose a `panelClass` input. Consumers who want to customize the panel must use the global CDK `panelClass: 'tw-tooltip-panel'` selector — no per-directive override is available.
- Findings:
  - No `twTooltipPanelClass` input (popover and toast both expose one). Recommend adding it for parity.
  - No way to add a CSS class to the arrow. Acceptable, but call it out in docs.

## CSS / Styling
- tailwind-variants: yes, 3 slots (wrapper/panel/arrow)
- twMerge: yes
- Semantic tokens vs raw palette: all uses are semantic (`bg-primary-700`, `bg-info-700`, etc.). Lines 59-86.
- Surface/fg/border tokens usage: `bg-surface-overlay`, `text-fg` on the `neutral` variant (line 73-74). Good.
- Radius compliance: `rounded-md` (line 54). Within the allowed set.
- Spacing/gap compliance: inline padding `px-2 py-1` / `px-3 py-1.5` / `px-4 py-2` (lines 89-95). Matches the codified inline pattern.
- Typography compliance: `text-xs` and `text-sm` (lines 89, 92, 95). Within the allowed scale.
- Focus rings compliance: N/A — tooltip is non-focusable. Correct (it has `pointer-events-none`).
- Dark mode handling: the colored variants (`bg-primary-700 text-white`) work in both modes by always using the dark-end of the palette. No explicit dark overrides because solid-fill `-700` shades produce sufficient contrast against any backdrop. **However**, the codified pattern is `on-{role}` tokens for solid fills (added in commit e952a33). Tooltip should use `text-on-primary`, `text-on-info`, etc. instead of hard-coded `text-white` — this is the new project convention.
- Transitions: `transition-colors` is not applied (no hover state on a tooltip — correct).
- Shadows: `shadow-sm` (line 54). Within the allowed set. **However**, the tooltip is an elevated overlay; `shadow-md` is more typical for floating panels per CLAUDE.md (popovers/dialogs/menus use `shadow-md`). `shadow-sm` reads weakly on a busy page.
- Icon sub-scale: arrow is `size-2` (line 55). Arrows are decorative — outside the icon sub-scale rules, no violation.
- Findings:
  - **Use `text-on-{role}` tokens** for the solid colored variants instead of `text-white`. Specifically `text-on-primary`, `text-on-info`, `text-on-success` (= `green-950`), `text-on-warning` (= `amber-950`), `text-on-error`, `text-on-secondary`, `text-on-accent`. The `text-white` choice on `success` and `warning` will fail WCAG AA against the lighter `-700` shades of green/amber.
  - **`shadow-sm` is too subtle** for an overlay floating above page content. Bump to `shadow-md` for visual parity with popover/menu.
  - **No dark-mode overrides on colored variants.** Project convention is explicit `dark:bg-{color}-900/X` overrides (per CLAUDE.md). Tooltip ships none. Consumers in dark mode get the same `-700` background which may not be desired.

## Overlay specifics
- CDK Overlay primitives used: `Overlay`, `OverlayRef`, `ComponentPortal`, `ScrollDispatcher`, `ConnectedPosition`
- Position strategy: `flexibleConnectedTo(elementRef).withPositions(positions).withPush(false)` (line 452-457). 12-position map with 3 fallbacks per primary axis (`buildPositions`, lines 196-211).
- Scroll strategy: `reposition()` (line 461). Good default.
- Focus trap: no — tooltip is non-interactive and aria-hidden.
- Backdrop: no — correct for transient hover-driven tooltips.
- Escape close: yes — `(keydown.escape)` on the trigger detaches the tooltip (line 297, 407).
- Outside click close: no — tooltips hide on `mouseleave`/`focusout`, which is appropriate.
- Animations: `animate.enter="fade-in"` / `animate.leave="fade-out"` (lines 238-239) backed by `_base.css:33-46`. `prefers-reduced-motion` honored at `_base.css:293-297`.
- Z-index / stacking: `z-50` on the wrapper slot (line 53). CDK overlay container itself manages the global z-index; this z-50 on the inner element is redundant.
- Findings:
  - Tooltip subscribes to `scrollDispatcher.ancestorScrolled` *and* uses `reposition()` scroll strategy (lines 442-444 + 461). The `reposition()` strategy already handles ancestor scroll. The manual subscription forces a detach instead of letting CDK reposition. Either remove the manual scroll-dispatcher subscription (CDK handles it) or change the strategy to `close()` since the behavior is "close on scroll".
  - `withPush(false)` is conservative. For a tooltip in a narrow viewport, push behavior would be friendlier. Consider `withPush(true)` to match popover.
  - No `viewportMargin` set on the position strategy. Popover uses `8` (line 524 there). Add `withViewportMargin(8)`.
  - **`z-50` on the wrapper is redundant** — CDK overlay container already has a much higher z-index. Remove (line 53).

## Accessibility
- ARIA roles/attributes: `role="tooltip"` on the overlay (line 236), `id` is unique (`tw-tooltip-${nextTooltipId++}`), `aria-describedby` is set on the trigger when visible (line 437-440) and removed on hide (line 487). **However**, the trigger also passes the *content string* to `AriaDescriber.describe()` (lines 502-509), which adds a *separate* hidden description span. The result is a duplicate description: one via the visible tooltip's `id` and a second via the AriaDescriber-injected element.
- Keyboard support: Escape closes (line 297). Mouse/focus drives open/close. No Tab handling needed (tooltip is non-focusable).
- CDK a11y utilities: `AriaDescriber` — used in addition to the manual `aria-describedby`. This is the bug above.
- aria-describedby wiring: present but double-wired (see above).
- Focus return on close: N/A — focus never moves into the tooltip.
- AXE risks:
  - **Duplicate aria-describedby content.** When the tooltip is open, AT users hear the description twice — once from the manual `aria-describedby` pointing at the visible tooltip and once from the AriaDescriber-injected hidden text.
  - No mechanism to suppress the tooltip for users who provide their own description (e.g. an icon button already has `aria-label`).
- Findings:
  - **Pick one mechanism: either `AriaDescriber` (which manages the hidden span itself and is the Angular Material pattern) or the manual `aria-describedby` to the visible tooltip — not both.** The Material approach (AriaDescriber only) is preferred when the tooltip is interactive-free and short text; the manual wiring is needed if the content is a `TemplateRef` (richer markup).
  - When `twTooltip` is a `TemplateRef`, `AriaDescriber` is silently skipped (line 503 checks `typeof content === 'string'`). Document this constraint.

## Tests
- Spec file: yes — `tooltip.spec.ts` (644 lines)
- Coverage breakdown:
  - rendering: default + show on mouseenter + hide on mouseleave ✓
  - colors: all 8 `TwColor` values ✓
  - sizes: all 3 sizes ✓
  - positions: 8 of 12 positions (4 corners + 4 with start/end) — `left-start`/`left-end`/`right-start`/`right-end` are missing
  - delays: custom show/hide delays ✓
  - disabled: rendering + reactive hide-on-disable ✓
  - arrow: shown by default + hidden when off ✓
  - template content: ✓
  - keyboard (Escape): ✓
  - focus (focusin/focusout): ✓
  - accessibility: role, aria-describedby wiring, unique id ✓ — **but does NOT test the duplicate AriaDescriber bug**
  - outputs: shown/hidden emissions ✓
  - programmatic control: show/hide/toggle ✓
  - cleanup on destroy: ✓
- Vitest-specific issues: uses `vi.useFakeTimers()` correctly, no `fakeAsync`/`tick`. Compliant.
- Findings:
  - Add test for the AriaDescriber-only path (assert there is exactly one description, not two).
  - Add tests for the 4 missing positions (`left-start`, `left-end`, `right-start`, `right-end`).
  - Add test that `twTooltipArrow=false` removes the arrow span entirely (currently asserts `null` via class lookup, which is fine — but also assert that no element with `aria-hidden="true"` is left over).
  - Add test for pointer events when disabled: hover, mouseleave, focusin, focusout should all be no-ops.
  - Add test for scroll-driven detach: emit a scroll event from an ancestor, expect the tooltip to detach. Once the strategy decision is made (see Overlay findings), this becomes important.

## Gaps & lacks
1. Duplicate description: manual `aria-describedby` + `AriaDescriber.describe()` both wired (lines 437-440 + 502-509).
2. Solid-fill foregrounds use `text-white` instead of `text-on-{role}` tokens — fails WCAG AA on `success`/`warning` variants.
3. `shadow-sm` is too weak for a floating overlay — should be `shadow-md` per CLAUDE.md guidance.
4. No `dark:` overrides on colored variants (project convention since commit 745d3f2).
5. `TooltipSize` (sm/md/lg) shadows shared `TwSize` — should align or rename.
6. `twTooltipArrow = input(true)` default lacks the required inline JSDoc justification (CLAUDE.md "Boolean defaults" rule).
7. Manual `ScrollDispatcher` subscription conflicts with `reposition()` scroll strategy.
8. Missing `twTooltipPanelClass` input for consumer customization.
9. `z-50` on the wrapper is redundant — CDK overlay container manages stacking.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal
Bring `ngx-tw/tooltip` to production-grade parity with popover and Material's CDK tooltip: fix accessibility (single description path), align color/size types with the rest of the library, adopt project-wide token conventions (`on-{role}`, explicit `dark:` overrides), and resolve the conflicting scroll-strategy + ScrollDispatcher pattern.

### Tasks
1. **Single ARIA description path (P0)** — eliminate the duplicate aria-describedby wiring
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:437-440, 481-491, 501-521`
   - Why: Tooltip currently sets `aria-describedby` manually on the trigger AND calls `AriaDescriber.describe()`. Screen readers announce the content twice.
   - Change: Remove `AriaDescriber.describe()` calls (lines 501-521). Keep the manual `aria-describedby={tooltip.id}` wiring — this works for both string and `TemplateRef` content. Drop the `AriaDescriber` injection entirely.
   - Acceptance: A unit test that opens a tooltip and asserts the trigger has exactly one `aria-describedby` pointing at an element with `role="tooltip"`, and there is no extra `cdk-describedby-message`/`cdk-describedby-host` element in the DOM.
2. **Use `on-{role}` semantic foregrounds (P0)** — fix contrast on success/warning variants
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:58-86`
   - Why: `text-white` on `bg-success-700` and `bg-warning-700` does not meet WCAG AA. Project tokens added in commit e952a33 (`--color-on-success`, `--color-on-warning`) exist precisely for solid-fill foregrounds.
   - Change: Replace each `text-white` with the matching `text-on-{role}`:
     - `primary` → `text-on-primary` (`secondary`, `accent`, `info`, `error` follow the same pattern)
     - `success` → `text-on-success` (green-950)
     - `warning` → `text-on-warning` (amber-950)
   - Acceptance: AXE color-contrast assertion on the tooltip in `success` and `warning` colors passes. Snapshot of `panel` slot's resolved classes shows `text-on-success` / `text-on-warning`.
3. **Add explicit dark-mode overrides on colored variants (P1)** — match project convention
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:58-86`
   - Why: Per commit 745d3f2 + the dark-mode override convention in CLAUDE.md memory, colored components ship explicit `dark:bg-{color}-900` overrides.
   - Change: For each non-neutral color variant, add `dark:bg-{color}-800` (or `-900`) and matching `dark:text-on-{role}` so the contrast is preserved in dark mode.
   - Acceptance: Tooltip in `primary` color shows distinguishably different background between light (`bg-primary-700`) and dark (`dark:bg-primary-800`) classes.
4. **Bump elevation to `shadow-md` (P1)** — visual consistency with other overlays
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:54`
   - Why: CLAUDE.md states floating overlays use `shadow-md`. Popover, menu, and toast all use `shadow-md`; tooltip is the only overlay on `shadow-sm`.
   - Change: `panel: 'rounded-md shadow-sm'` → `panel: 'rounded-md shadow-md'`.
   - Acceptance: Computed style of the panel shows the `shadow-md` value. Visual diff in demo shows a more pronounced elevation.
5. **Reconcile size type with `TwSize` (P1)** — drop the local `TooltipSize`
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:43, 87-97, 261, 263, 313`
   - Why: Every other component uses the shared `TwSize` from `ngx-tw/core`. `TooltipSize` shadows it with only 3 values, causing inconsistency.
   - Change: Drop `TooltipSize`; type `twTooltipSize` as `TwSize`. Add `xs` and `xl` rows to the `size` variant slot (`xs: { panel: 'px-1.5 py-0.5 text-2xs max-w-40' }`, `xl: { panel: 'px-4 py-2 text-base max-w-md' }`). Update the export in `index.ts` and the spec's type union accordingly.
   - Acceptance: TypeScript compile succeeds. Spec iterates all 5 sizes. Demo size selector renders all 5 without errors.
6. **Justify or invert the `twTooltipArrow = true` default (P1)** — comply with boolean-default rule
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:324-325`
   - Why: CLAUDE.md restricts `input(true)` to a codified list and requires an inline justification comment for new exceptions. Tooltip's arrow default is neither listed nor commented.
   - Change: Two options. (a) Keep `true` and add the inline comment, e.g. `// Tooltips read as labels without an arrow; opt-out only when paired with a strong visual association.`. (b) Flip to `input(false)` and update tests + demo.
   - Acceptance: Either an inline justification appears above `twTooltipArrow` or the default is `false` with passing tests.
7. **Resolve scroll-strategy/ScrollDispatcher conflict (P2)** — pick one path
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:333-358, 442-489`
   - Why: The directive subscribes to `scrollDispatcher.ancestorScrolled` AND uses `reposition()`. The reposition strategy already handles ancestor scroll; the manual subscription forces an immediate detach instead.
   - Change: Decide intent. If tooltips should *follow* the trigger on scroll, drop the manual ScrollDispatcher subscription (lines 442-444, 488-489) and rely on `reposition()`. If they should *close* on scroll, change the strategy to `this.overlay.scrollStrategies.close()` and remove the manual subscription. The "close on scroll" choice matches Material's behavior more closely.
   - Acceptance: Test that scrolling an ancestor while the tooltip is open behaves consistently with the documented intent.
8. **Add `twTooltipPanelClass` input (P2)** — parity with popover
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:302-331` (directive section) + `tw-tooltip-overlay` internal component
   - Why: Popover and toast both expose `panelClass`. Tooltip's CDK-level `panelClass: 'tw-tooltip-panel'` is hard-coded.
   - Change: Add `twTooltipPanelClass = input<string | string[]>('')`. Forward it onto the `panel` slot via twMerge.
   - Acceptance: A consumer-supplied class appears in the rendered panel and merges correctly when it overlaps with existing utilities (e.g. `max-w-md` should beat the default `max-w-xs`).
9. **Polish: drop the redundant `z-50` and add `viewportMargin` (P2)**
   - File(s): `projects/ngx-tw/tooltip/tooltip.ts:53, 452-457`
   - Change: Remove `z-50` from the wrapper slot (CDK overlay manages stacking). Add `.withViewportMargin(8)` to match popover and prevent edge clipping.
   - Acceptance: Tooltip near a viewport edge no longer clips against the edge.
10. **Test coverage gaps (P2)**
    - File(s): `projects/ngx-tw/tooltip/tooltip.spec.ts`
    - Add: missing positions (`left-start`, `left-end`, `right-start`, `right-end`); description-uniqueness test from task 1; pointer-event no-ops while disabled; scroll-driven behavior from task 7.

### Out of scope
- Submenu-style "rich" tooltips with interactive content — that is what `popover` is for. Tooltip should remain non-interactive and ARIA-described.
- Polymorphic position strings (e.g. `'auto'`). The 12-way explicit map is intentional and matches the popover API.
- Adding a `model<boolean>` for controlled open state — useful but a separate enhancement; tooltips are hover/focus-driven by spec.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- tooltip`
- Visual check: `http://localhost:4600/components/tooltip`
- A11y: `npm run e2e:a11y` and a manual AXE pass with each color variant open

## Priority
**P0** — accessibility (duplicate description, contrast on success/warning) is shipping-blocking; the rest are P1/P2 polish. Tooltip is used on most interactive controls, so a11y issues here ripple across every consumer.
