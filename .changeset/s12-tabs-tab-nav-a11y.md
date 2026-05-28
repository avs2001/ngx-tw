---
"ngx-tw": minor
---

S12 — Tabs + tab-nav keyboard accessibility hardening and shared trigger-variant extraction (Batch 5 wrap-up). Closes the tab close-button keyboard trap, migrates both components to CDK `FocusKeyManager`, and removes ~110 lines of duplicated `tv()` config between the two surfaces. No consumer-facing template selector changes; one internal DOM shape change in `tw-tabs`.

**`TabsComponent` — a11y fix: close affordance is now keyboard-focusable.**

The closable-tab dismiss button previously shipped as `<span role="button" tabindex="-1">` with `(keydown.enter)` / `(keydown.space)` handlers. With `tabindex="-1"` the span could never receive keyboard focus, so the handlers could never fire — the close affordance was reachable only by mouse. The span is now a native `<button type="button">` with no negative tabindex, so keyboard users can `Tab` to it and activate it with `Enter` or `Space` (native button behaviour). Screen-reader users still hear the same `aria-label` ("Close {label}").

To keep the close button as a valid HTML child of the trigger, the trigger element changes from `<button role="tab">` to `<div role="tab">` (HTML forbids interactive content nested inside a `<button>`). Trigger activation is wired explicitly via `(click)` plus an `Enter` / `Space` handler on the tablist `(keydown)` — keyboard tab activation continues to work identically.

In addition, pressing `Delete` while a closable tab is focused now dismisses the tab without traversing to the close button — matches the WAI-ARIA Authoring Practices recommendation for closable tabs.

**`TabsComponent` + `TabNavComponent` — Refactor: adopt CDK `FocusKeyManager`.**

Both components previously hand-rolled roving focus by scanning `document.activeElement` against their trigger lists, with bespoke `findNextEnabled` helpers, custom `Home` / `End` branches, and manual wrap logic. They now use `FocusKeyManager` from `@angular/cdk/a11y`, configured `.withWrap().withHomeAndEnd()` and orientation-aware (`.withHorizontalOrientation('ltr')` / `.withVerticalOrientation()` for `tw-tabs`; horizontal-only for `nav[twTabNav]`). Tabs follows the APG automatic-activation pattern (selection follows focus); tab-nav remains manual activation (focus moves on arrows, Enter / Space activates).

This matches the canonical pattern in `AccordionComponent` and removes ~60 lines of duplicated keyboard plumbing. No behaviour change for end users.

**Internal: shared trigger `tv()` config and active-state maps extracted to `ngx-tw/core`.**

`tabs.ts` and `tab-nav.ts` carried two near-identical copies of the trigger `tv()` config plus the five active-state colour maps (`UNDERLINE_ACTIVE_HORIZONTAL` / `UNDERLINE_ACTIVE_VERTICAL` / `ENCLOSED_ACTIVE_HORIZONTAL` / `ENCLOSED_ACTIVE_VERTICAL` / `PILL_ACTIVE`) plus the inactive map. All of it now lives at `projects/ngx-tw/core/tab-trigger-variants.ts` as `tabTriggerVariants`, the maps, and `getActiveTriggerClasses(variant, color, orientation)` / `getInactiveTriggerClasses(variant)` helpers. Both components consume from `ngx-tw/core`.

Component-local slots (root / tablist / tablistInner / panel / scrollButton / closeButton for tabs; nav / list for tab-nav) stay in each component's local `tv()` config — only the trigger shape is canonical enough to share. The `no-underline` class needed only by anchor-based tab-nav is appended via `twMerge` in tab-nav's `linkBaseClasses`, not the shared base.

No consumer-facing API change: the new exports are additive on `ngx-tw/core`; existing imports from `ngx-tw/tabs` and `ngx-tw/tab-nav` are unchanged.

**Polish.**

- The close container in `tw-tabs` now scales with the `size` input using the codified square-interactive-target scale (`size-6` xs / `size-7` sm / `size-8` md / `size-9` lg+); previously fixed at `size-4`. The inner glyph stays at the glyph scale (`size-4`).
- `TabLinkDirective.linkRole` keeps its dual `'tab' | null` branch — the `'tab'` branch is APG-required when the nav is wired to a panel, and the `null` branch lets the anchor's native `role="link"` win when it isn't. An inline comment now documents both branches so the next audit pass doesn't re-flag the null branch as a no-op.

**Migration guide.**

No consumer-facing template changes are required. The close-button DOM restructure (span → button, button → div with `role="tab"`) is library-internal — both still match `[role="tab"]` and the close affordance still matches `[aria-label]` queries. Spec-level test code that dispatched `KeyboardEvent` with only `key` (no `keyCode`) on tab triggers will need to add `keyCode` because `FocusKeyManager` reads `event.keyCode`; production code is unaffected because real browsers populate both fields. Reference numeric codes: `ArrowRight=39`, `ArrowLeft=37`, `ArrowUp=38`, `ArrowDown=40`, `Home=36`, `End=35`, `Delete=46`.
