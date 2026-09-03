# P7 — Overlay component harnesses (dialog, sheet, menu, popover, tooltip)

Five new secondary entry points, no existing library file touched.

    projects/ngx-tw/dialog/testing/   → dialog-harness.ts, index.ts, ng-package.json, dialog-harness.spec.ts
    projects/ngx-tw/sheet/testing/    → sheet-harness.ts,  index.ts, ng-package.json, sheet-harness.spec.ts
    projects/ngx-tw/menu/testing/     → menu-harness.ts, menu-item-harness.ts, index.ts, ng-package.json, menu-harness.spec.ts
    projects/ngx-tw/popover/testing/  → popover-harness.ts, index.ts, ng-package.json, popover-harness.spec.ts
    projects/ngx-tw/tooltip/testing/  → tooltip-harness.ts, index.ts, ng-package.json, tooltip-harness.spec.ts

## Gate results

| Gate | Result |
|---|---|
| `npm run build:lib` | **PASS** — all five `*/testing` entry points built; whole package green |
| `ng test ngx-tw` (full suite) | **PASS — 97 files, 3524 passed, 0 failed, 4 skipped** |
| my five specs, isolated | **38/38 PASS** |
| my five specs discovered by the *standard* config | **confirmed** via `ng test ngx-tw --list-tests` — all five files listed, so the full-suite run above did execute them |
| `npm run verify:package` | **PASS** — 73 entry points exported, theme compiles from a clean consumer install |
| Forced-failure check | **PASS** — see "Non-vacuity" below |

Three transient sibling compile errors blocked the shared program at various points mid-session
(`date-picker/testing` + `date-range-picker/testing` `TS2801` missing `await` on
`HarnessPredicate.stringMatches`; `transfer.ts:1216` a stray `override`). All were fixed by their
owners, and every gate above was re-run afterwards against a clean tree. `git status` shows no
modified tracked files — my contribution is five new untracked directories.

---

## THE HEADLINE FINDING — trigger directives have no DOM marker

**`MenuTriggerDirective`, `PopoverDirective` and `TooltipDirective` cannot be located by their
own selector.** Angular renders an attribute only for the *static* attribute form. `twMenuTrigger`
and `twPopover` take a required `TemplateRef`, so they are **always** written as a property
binding (`[twMenuTrigger]="menu"`), and a bound input renders **no attribute at all**. None of the
three directives adds a host class or attribute of its own.

This is not theory: my first run had all 21 menu/popover/tooltip tests fail with
`Failed to find element matching selector "[twMenuTrigger]"` etc.

Material solves exactly this by having the directive add a marker class —
`.mat-mdc-menu-trigger`, `.mat-mdc-tooltip-trigger` — *for the harness's benefit*. ngx-tw has no
equivalent. **The clean fix is a one-line `host: { class: 'tw-menu-trigger' }` (etc.) on each of
the three directives.** I did not add it: per the brief, a `data-*`/class hook added for a test is
public API forever, and that is the maintainer's call. Widening a `hostSelector` to such a marker
later is a **non-breaking** change (`hostSelector` is not part of any method signature), so the
harnesses below can be tightened whenever you decide.

What I did instead, per component:

| Component | Selector shipped | Cost |
|---|---|---|
| `menu` | `[aria-haspopup="menu"]` | none today — CDK binds it unconditionally on `CdkMenuTrigger`, and nothing else in ngx-tw renders that value (`CdkContextMenuTrigger` deliberately renders none) |
| `popover` | `[aria-haspopup="dialog"]` | **collides** — `tw-date-picker` (`date-picker.ts:356,397`) and `tw-date-range-picker` (`date-range-picker.ts:311`) triggers carry the same value. Mitigated by a guard, below. |
| `tooltip` | `[twTooltip]` | **works only for `twTooltip="literal"`.** A `[twTooltip]="expr"` trigger is invisible to the harness. Loud failure ("failed to find element"), never a wrong read. |

### Popover's mismatch guard — and exactly how far it reaches

`PopoverHarness` verifies what it matched: it reads the trigger's `aria-controls` and throws a
named error unless the id starts with `tw-popover-`. **Every method except `getTriggerText()` is
guarded** — `isOpen()`, `open()`, `close()`, `getText()`, `hasArrow()` all route through the
check, so a date-picker trigger produces a clear "not a tw-popover panel" message telling you to
narrow with `PopoverHarness.with({ triggerText })` instead of being silently driven.

`getTriggerText()` is unguarded **on purpose**: `with({ triggerText })` calls it while filtering,
so it must be able to look at a foreign control and report its text rather than throw mid-query.

The guard is sound rather than best-effort because both colliders bind `aria-controls`
**unconditionally** — `date-picker.ts:359,399` and `date-range-picker.ts:313` all read
`[attr.aria-controls]="dialogId"`, a plain always-present field, not a null-when-closed signal.
So the check fires whether the picker is open or closed. (Had they bound it conditionally, a
*closed* foreign trigger would be genuinely indistinguishable from a closed popover and the guard
would have had a hole. Worth re-checking if those templates ever change.)

The fixture in `popover-harness.spec.ts` contains a decoy `aria-haspopup="dialog"` button shaped
like a real picker trigger, and the spec asserts all five guarded methods reject and that
`getTriggerText()` still answers.

### Tooltip's gap is asserted, not just documented

`tooltip-harness.spec.ts` has a test named *"cannot see a trigger whose message is a property
binding"* asserting a count of **0**. It documents a deficiency deliberately: if `TooltipDirective`
ever gains a host marker and the selector is widened, that test goes red and should be deleted.

### My recommendation on merging

- **`dialog`, `sheet`, `menu` — merge as they are.** Their host selectors are exact:
  `tw-dialog-container` / `tw-sheet-container` are element selectors, and `aria-haspopup="menu"`
  is unique within the library.
- **`popover` — mergeable, but better after adding `host: { class: 'tw-popover-trigger' }`.**
  The guard converts every ambiguity into a loud error, so nothing is silently wrong today; but
  the guard, its five call sites, its decoy fixture and its error message are ~40 lines existing
  purely because the directive has no marker. Add the marker and all of it deletes.
- **`tooltip` — I would add `host: { class: 'tw-tooltip-trigger' }` before merging.** This is the
  one harness with a coverage hole rather than a complexity cost: `[twTooltip]="expr"` triggers
  are simply unreachable, and no amount of harness code fixes that. It is still worth merging
  as-is if you would rather not touch the directive now — the failure is loud, and widening the
  selector later is non-breaking.

---

## Per-component public surface

### `@cdevhub/ngx-tw/dialog/testing` — `DialogHarness`, `DialogHarnessFilters`

`hostSelector = 'tw-dialog-container'`.
`with({ id, title, role })`, `getId()`, `getRole()`, `getTitleText()`, `getContentText()`,
`containsFocus()`, `hasBackdrop()`, `clickBackdrop()`, `pressEscape()`.

**Deliberately left out:** `getAriaLabel()`, `isModal()`, `getText()`, `close()` (a dialog's close
buttons are consumer-projected `[twDialogClose]` elements, reachable with the consumer's own
harness; the ref's `close()` is the API for programmatic close), any size/panel-class accessor.

### `@cdevhub/ngx-tw/sheet/testing` — `SheetHarness`, `SheetHarnessFilters`

Same shape plus the one axis a sheet has that a dialog does not:
`with({ id, title, side })`, `getSide()` (reads the container's `data-side`).

### `@cdevhub/ngx-tw/menu/testing` — `MenuHarness`, `MenuItemHarness` (+ both `*Filters`)

`MenuHarness`: `with({ triggerText })`, `getTriggerText()`, `isOpen()`, `open()`, `close()`,
`getItems(filters?)`, `clickItem(text)`.
`MenuItemHarness`: `hostSelector` is the three ARIA roles; `with({ text, disabled, checked })`,
`getText()`, `getRole()`, `isDisabled()`, `isChecked()` (`null` for a plain item — plain items
carry no `aria-checked` and folding that into `false` would be a lie), `click()`.

**Deliberately left out:** `[twContextMenuTrigger]` (opens on `contextmenu` at pointer
coordinates, exposes neither `aria-expanded` nor `aria-haspopup`); submenu traversal; icon /
shortcut / description accessors; keyboard-navigation helpers.

### `@cdevhub/ngx-tw/popover/testing` — `PopoverHarness`, `PopoverHarnessFilters`

`with({ triggerText })`, `getTriggerText()`, `isOpen()`, `open()`, `close()`, `getText()`,
`hasArrow()`.

**Deliberately left out:** position, backdrop mode, focus-trap, color/size, panel-class.

### `@cdevhub/ngx-tw/tooltip/testing` — `TooltipHarness`, `TooltipHarnessFilters`

`with({ triggerText })`, `getTriggerText()`, `isOpen()`, `getTooltipText()`, `show()`, `hide()`,
`focusTrigger()`, `blurTrigger()`.

Six state/interaction methods, per the "be conservative" instruction. `focusTrigger()` /
`blurTrigger()` are included because the WCAG 2.1 SC 1.4.13 keyboard path is otherwise
unreachable — `ComponentHarness.host()` is `protected`, so a consumer has no way to focus the
trigger through the harness. They move real DOM focus *and* dispatch `focusin`/`focusout`,
because a programmatic `focus()` does not reliably raise `focusin` in jsdom (the library's own
`tooltip.spec.ts` dispatches the events by hand for the same reason).

**Deliberately left out:** position, show/hide delays, color, size, arrow, panel-class — exactly
as instructed. Its position input was only fixed in pass 5; freezing it into a harness would lock
an API that may still move.

---

## Loader story — the brief's correction, confirmed and bounded

The correction ("overlay panels do **not** need `documentRootLoader`") holds for every
template-declared component, and all three of mine follow the `SelectHarness` template: the
harness hosts on the in-fixture trigger and resolves its panel through the protected
`documentRootLocatorFactory()`, so `menu`, `popover` and `tooltip` specs use the plain
`TestbedHarnessEnvironment.loader(fixture)` — deliberately, with the same comment the template
carries, so a regression in that internal empties the assertions.

**`dialog` and `sheet` are the structural exception and DO require
`TestbedHarnessEnvironment.documentRootLoader(fixture)`.** They are service-opened: nothing in
`fixture.nativeElement` represents them, so the harness's *host itself* is the overlay-resident
container. There is no in-fixture element to host on, so this is not a lapse — it is the only
possible shape, and it is stated in both harness JSDoc blocks and both specs.

`menu` and `popover` improve on Material's approach by scoping the panel to the trigger's
`aria-controls` id rather than "the first panel in the document", so sibling triggers and open
submenus stay apart. Both specs assert this with a second trigger present.

## Menu delegation — answered with evidence

**A parallel harness is the only option.** `@angular/cdk@22.0.5` exports exactly three testing
entry points — `./testing`, `./testing/testbed`, `./testing/selenium-webdriver` — all of which are
harness *infrastructure*. CDK ships **no component harnesses at all**; those live in
`@angular/material/*/testing`, and `@angular/material` is not a dependency of this workspace
(`ls node_modules/@angular/material` → absent). There is nothing to delegate to. What the
`hostDirectives` composition does buy is that every locator in `MenuItemHarness` is an ARIA role
or attribute CDK guarantees (`role="menuitem|menuitemcheckbox|menuitemradio"`, `aria-checked`,
`aria-disabled`, `aria-expanded`, `aria-controls`) rather than an ngx-tw class name.

## Popover lifetime — verified, and it is the opposite of `select`

Confirmed by reading `popover.ts` and asserted in the spec: closing **detaches** the portal and
keeps the `OverlayRef`; it is rebuilt only when `twPopoverBackdrop` or `twPopoverScrollStrategy`
changes (`ensureOverlay`). `select` disposes. The spec asserts panel-absent-while-closed **and**
panel-present-again-after-reopen on the same ref, so a regression to either behaviour goes red.

---

## Other findings worth your attention

1. **`popover`'s 120 ms leave transition is a hard-coded constant, not an input**
   (`ANIMATION_DURATION` in `popover.ts`). A harness-driven close cannot be shortened, so
   `popover-harness.spec.ts` burns a real 400 ms per close (3x margin, chosen after the
   menu-spec precedent where a 250 ms sleep against a 200 ms debounce was the library's last
   load-dependent flake). Dialog/sheet have no such problem — `enterAnimationDuration: 0` /
   `exitAnimationDuration: 0` makes `OverlayContainerCoordinator` fully synchronous (no rAF, no
   fallback timer), which the specs use. Making the popover duration an input would let its
   harness spec run in zero time too.

2. **`popover`'s arrow has no attribute hook.** `hasArrow()` matches
   `#<panelId> > div > span[aria-hidden="true"]` — the wrapper's only `aria-hidden` grandchild
   span, with content nested one level deeper. It is correct today and is tighter than the
   `.rotate-45` class the existing spec uses, but it is structural. A `data-arrow` or an
   `aria-hidden` marker with a role would make it durable.

3. **`waitForTasksOutsideAngular()` is a no-op in this workspace** and must not be copied from
   the `select` template as if it did something. `TestbedHarnessEnvironment` only sets
   `_taskState` when `TaskStateZoneInterceptor.isInProxyZone()`, and there is no zone.js polyfill
   (`testing-testbed.mjs:618,652`). What actually stabilizes is `TestElement`'s internal
   `forceStabilize()`. None of my harnesses calls it; encoding a false promise into frozen API
   would be worse than the extra line.

4. **`TwDialogRef.whenComponentReady()` / `SheetRef.whenComponentReady()` are the public await for
   the deferred container** and resolve for template content too (`null`), so neither harness nor
   consumer needs the `@internal` `_whenRendered()`. Both specs use it; both harness JSDoc blocks
   document it. This is the piece of ceremony the brief hoped the harness would remove, and it
   already existed.

5. **`autoFocus: false` still focuses the container.** CDK's `_trapFocus` treats `false` like
   `'dialog'` and focuses the container element when focus is not already inside
   (`dialog.mjs:180-186`). My first `containsFocus()` test assumed otherwise and failed. The
   shipped test instead stacks two dialogs/sheets and asserts the *same reader* answers `true`
   for the top one and `false` for the one beneath — a genuine differential.

6. **No `*/testing` entry point reaches the MCP index — the JSDoc rationale in the brief does not
   currently apply to harnesses.** `scripts/build-mcp-index.mjs:38-42` derives its entry-point list
   by regexing `@cdevhub/ngx-tw/…` specifiers out of `projects/ngx-tw/src/public-api.ts`. The brief
   correctly says nested testing entry points must NOT be added to that barrel, so they are
   invisible to the extractor: `dist/ngx-tw/index.json` lists **56 entry points, 0 of them
   `testing`** — `calendar/testing` and `select/testing` are missing too, not just mine. The JSDoc
   still earns its keep through `.d.ts` and IDE hovers, but if you want harness API tables in the
   demo/MCP surface, `entryPointNames()` needs to also walk `*/testing/ng-package.json`. This is
   the same silent-gap shape as the routes drift-guard story in CLAUDE.md: nothing fails, the
   tables are just empty.

7. **`MenuHarness` has no panel-id prefix guard, unlike `PopoverHarness`, and that is deliberate.**
   Its `aria-controls` points at a CDK-generated `cdk-menu-N` id. Asserting that prefix would bind
   the harness to a CDK-private id format: if CDK ever renamed it, a guard would turn a working
   menu into a hard error, whereas today a rename simply cannot happen without also breaking the
   `aria-controls` link the harness relies on. The menu selector is unambiguous anyway, so there
   is nothing to guard against.

8. **A secondary entry point cannot relatively import its parent.** `sheet-harness.ts` originally
   did `import type { SheetSide } from '../sheet-config'` and ng-packagr rejected it with
   `TS6059: not under rootDir .../sheet/testing`. It now imports from `@cdevhub/ngx-tw/sheet`,
   matching the established cross-entry-point pattern (`alert.d.ts` imports `TwColor` from
   `@cdevhub/ngx-tw/core`). Worth knowing before the next `*/testing` directory needs a parent type.

## Non-vacuity

Every spec asserts state *changes* across an interaction rather than initial reads (opposite roles,
opposite arrow presence, opposite checked state, different tooltip messages, `disableClose`
neutering the exact two gestures that closed the dialog two tests earlier).

Two internals were then deliberately broken to confirm the specs can fail:

- `MenuHarness.getPanelLoader()` changed to `rootHarnessLoader()` (dropping `aria-controls`
  scoping) → *"scopes items to its own panel"* went red (`expected 0, got 4`).
- `PopoverHarness`'s panel-id prefix check disabled → *"throws instead of misreading a foreign
  `aria-haspopup="dialog"` control"* went red (`promise resolved "null" instead of rejecting`).

Both were reverted; the final full-suite run above is against the restored files.
