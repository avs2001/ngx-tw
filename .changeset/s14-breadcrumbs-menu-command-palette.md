---
"ngx-tw": minor
---

S14 — Breadcrumbs + menu + command-palette fixes. One BLOCKER fix (`activeIndex` no longer resets on identical-id `filteredItems` re-emission), one removed keyboard handler (`Tab` no longer closes the palette), tighter visual distinction between active and hovered options, plus polish across all three components. No consumer-facing API breakage.

**Bug fix (command-palette) — `activeIndex` selection-preservation.**

`CommandPaletteComponent.activeIndex` was a `linkedSignal` keyed off the `filteredItems()` array *reference*: any re-emission of the computed (even with the same item ids in the same positions) reset selection to the first enabled item. The signal is now keyed off the id sequence (`filteredItems().map((i) => i.data.id)`) and the computation uses the `previous` parameter (typed `{ source, value }`) to look up the previously-active id and carry its new index forward — only when the id has been removed entirely does the fallback to `findFirstEnabled(items)` fire. Consumer keyboard selection now survives transparent re-emissions (e.g. an upstream `commands` array re-built from a `model()` or a route change).

**a11y fix (command-palette) — Tab keypress no longer closes the palette.**

The previous `case 'Tab':` branch in `handleOverlayKeydown` called `event.preventDefault()` + `this.hide()`. The palette already installs a `FocusTrap` (`setupFocusTrap()`), so the trap cycles focus through the modal's focusable elements without leaking outside. The Tab branch was both redundant and surprising — pressing Tab to *escape* a modal is non-standard. The branch is removed; FocusTrap handles the cycling.

**Bug fix (command-palette) — close-timer leak guarded.**

The `setTimeout(ANIMATION_DURATION)` callback in `closePalette()` could fire after the palette had already been disposed (programmatic `disposeOverlay()` race, double-close), at which point it would still call `overlayRef.detach()`, `isAttached.set(false)`, and `open.set(false)` on a destroyed component. An `if (!this.isAttached()) { this.closing = false; return; }` guard now runs at the top of the callback before any state writes. `clearCloseTimer()` is already wired into `destroyRef.onDestroy()` (line 572) so the typical teardown path was already covered; the new guard hardens the destroyed-while-animating race.

**a11y fix (command-palette) — active vs hover visual distinction.**

Per the "Focus Rings → Activedescendant-listbox carve-out" section in CLAUDE.md, the keyboard-active option (`role="option"` referenced by `aria-activedescendant` on the combobox input) MUST be unambiguously distinguishable from the hovered non-active state. The `active.true` slot used the same `bg-surface-muted` token as the non-active hover state, so the two visual signals collapsed onto each other and keyboard users lost the active cue when their pointer drifted. Active is now `bg-surface-sunken` (one step recessed). A compound variant (`{ active: true, disabled: false }` → `hover:bg-surface-sunken`) keeps the recessed token sticky on hover so the active option doesn't visually flip to the hover token when the cursor passes over it.

**a11y polish (menu) — disabled-item visual hardening.**

`MenuItemDirective`'s `disabled` `tv()` variant gains `cursor-not-allowed` alongside the existing `opacity-50 pointer-events-none`. CDK's `CdkMenuItem` already honours `disabled` natively in keyboard navigation (the `effect()` at line 218 propagates the local `disabled` signal to `cdkItem.disabled`, and CDK's `FocusKeyManager`/`FocusableOption` skips disabled items). The cursor cue covers the residual case where focus arrives via a programmatic path that bypasses CDK's skip — the item still reads as "not interactive" rather than appearing focusable. No behavioural change for keyboard users.

**API doc (menu) — `MenuItemDirective.color` JSDoc clarification.**

The `color = input<TwColor | undefined>(undefined)` JSDoc previously said "Leave unset for the default neutral style", which was misleading: `undefined` and `'neutral'` produce different visuals. `undefined` leaves the base `text-fg` styling at full prominence; `'neutral'` applies the dimmed `text-fg-muted` + `hover:bg-surface-muted` tint defined in the `color.neutral` slot string. The JSDoc now spells out the distinction so consumers don't pick `'neutral'` thinking it's the default.

**Polish (menu) — submenu indicator scales with menu size.**

`MenuItemSubmenuIndicatorDirective` previously hard-coded `class: 'ml-auto pl-2 size-4 shrink-0 text-fg-muted'` on the host. The trailing chevron now uses a small `menuItemSubmenuIndicatorVariants` `tv()` config that resolves the glyph scale off the parent `MenuComponent.size()` (xs/sm/md → `size-4` floor, lg/xl → `size-5`, with xs specifically dropping to `size-3` per the glyph scale's xs step). The pattern mirrors `MenuItemIconDirective` — `inject(MenuComponent, { optional: true })` + `computed()` + `[class]` host binding.

**Polish (breadcrumbs) — overflow-trigger lg=xl behavior codified.**

`BreadcrumbsComponent` uses `size-9` for both `lg` and `xl` of the overflow trigger, which would normally violate the codified square-interactive-target scale (xs=size-6, sm=size-7, md=size-8, lg=size-9, no xl entry). Rather than introduce a new `xl=size-10` step that only one component would use, the CLAUDE.md "Square interactive targets" subsection gains a "Saturation note" line documenting the lg=xl reuse for breadcrumb overflow triggers — once the trigger is keyboard-reachable and clearly tappable, further scaling reads as visual bloat.

**Polish (breadcrumbs) — redundant `renderedEntries` condition dropped.**

The `collapsing` calculation in `BreadcrumbsComponent.renderedEntries` carried `all.length > 2` twice in the same `&&` chain. Reduced to a single check; semantics unchanged.

**Demo (breadcrumbs) — custom-separator example styling tightened.**

The "Custom separator (template)" demo at `projects/demo/src/app/routes/breadcrumbs/examples/breadcrumbs-examples.component.ts` already used `*twBreadcrumbsSeparator` correctly; the ad-hoc inline styling (`text-fg-subtle font-medium px-0.5`) on the projected `<span>` is now reduced to the single semantic class (`text-fg-subtle`). The corresponding code snippet (`separatorTemplateSnippet`) is updated to match so the demo and the docs render the same markup.

**Spec coverage.**

Five new tests land:
- `menu.spec.ts` — `disabled propagation to CDK > should layer cursor-not-allowed onto disabled items`; `submenu indicator scaling > should scale the trailing submenu indicator with menu size` (md = `size-4`); `submenu indicator scaling > should render size-3 for xs-density menus`; `submenu indicator scaling > should render size-5 for xl-density menus`. A new `SubmenuIndicatorSizedHost` host component covers the size-aware variants.
- `command-palette.spec.ts` — `keyboard navigation > does NOT close the palette on Tab` (asserts `getOverlay()` remains truthy *after* `flushClose(fixture)` — with the old `case 'Tab'` handler in place this assertion would fail because the close timer would detach the overlay; the explicit flush is what makes the test discriminate old vs new behavior); `activeIndex preservation > preserves the active index when filteredItems re-emits with identical ids` (mutates the `commands` signal to a new array reference with identical ids, asserts `aria-activedescendant` stays put); `activeIndex preservation > falls back to the first enabled item when the active id is removed` (covers the negative case); `active option visual distinction > renders the active option with bg-surface-sunken (distinct from hovered non-active)` (asserts active class string contains `bg-surface-sunken` and not `hover:bg-surface-muted`; non-active item contains `hover:bg-surface-muted` and not `bg-surface-sunken`).

Spec count: 2579 passing / 4 pre-existing skipped (was 2571 at S13).

**Unresolved risk for reviewers.**

- **Tab no longer closes the palette.** Some users with muscle memory built up against the previous closing-on-Tab behaviour will be momentarily surprised. The change aligns with universal modal conventions (FocusTrap cycles focus inside a modal; Escape is the dismiss key) and matches Material's Command palette + cmdk's behaviour, so the muscle-memory cost is one-time. No migration note required because the consumer-facing API surface is unchanged.
- **Active-option background contrast.** `bg-surface-sunken` reads as "more recessed" against the default theme's `bg-surface-overlay` palette, which is the correct semantic for an active descendant. Themes that swap `--color-surface-sunken` to a *brighter* shade (uncommon but possible for high-contrast themes) might invert the recess cue — the visual hierarchy still differentiates active from hover (the two are distinct colors), but reviewers checking dark-mode AAA themes should sanity-check.
- **Submenu indicator visual delta at xs/xl.** The chevron drops from `size-4` (16px) to `size-3` (12px) at xs and jumps to `size-5` (20px) at lg/xl. Consumers running the submenu indicator inside an xl menu with custom content alignment may see a small layout shift; the change is the design-system-correct scale per the glyph table.
- **`text-base` at lg/xl sizes in breadcrumbs (deferred).** `breadcrumbs.ts:122-126` uses `text-base` at lg and xl. CLAUDE.md restricts `text-base` to two carve-outs (`tw-item lg` and `tw-stat lg/xl`). The S14 prompt explicitly deferred this; flagged here for a future session to either add a third carve-out (breadcrumbs trigger font scale) or drop the lg/xl trigger font back to `text-sm`.
- **Breadcrumbs A1 audit-text ambiguity.** The original audit text said the custom-separator demo "mixes styling into projected separator without going through `*twBreadcrumbsSeparator` guidance" — but the demo already used `*twBreadcrumbsSeparator`. The minimal interpretation taken here is to tighten the inline styling on the projected `<span>`; reviewers wanting a heavier rework (e.g. dropping all custom styling so the projected glyph picks up the breadcrumb's own classes) should expand in a follow-up.
