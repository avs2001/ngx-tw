# Pass 6 — `@angular/aria` pilot: `command-palette`

**Outcome: PILOT REJECTED.** No code was migrated. `@angular/aria` was **not** installed and is
declared in **no** `package.json`. One new section was added to `.claude/CLAUDE.md`.

Every claim below was read out of the shipped `@angular/aria@22.1.5` tarball (`npm pack`, extracted
to a scratch dir — never installed into the repo) or out of the repo's own
`node_modules/@angular/cdk@22.0.5`, not out of documentation. Two claims were additionally verified
empirically. Files read are named with line anchors so the next author can re-check without
re-deriving.

---

## 0. Correction to the brief's premise, and to pass-5 F-6

Three of the facts the brief and the pass-5 audit built on turn out to be wrong or stale. Correcting
them changes the shape of the decision, so they lead.

### 0.1 The version-compatibility premise checked the wrong peer

> *"`@angular/aria` is published and stable at **22.1.5**, matching this repo's `@angular/core: ^22.0.7`."*

`@angular/core` is not the binding constraint. `@angular/aria`'s peer range on core is wide
(`^22.0.0 || ^23.0.0`); its peer on **`@angular/cdk` is an exact version**:

| `@angular/aria` | peer `@angular/cdk` | peer `@angular/core` |
|---|---|---|
| 22.0.5 | `22.0.5` (exact) | `^22.0.0 \|\| ^23.0.0` |
| 22.0.7 | `22.0.7` (exact) | `^22.0.0 \|\| ^23.0.0` |
| 22.1.5 | `22.1.5` (exact) | `^22.0.0 \|\| ^23.0.0` |

This repo has `@angular/cdk@22.0.5` installed (`^22.0.5` declared). Verified empirically in a throwaway
directory outside the repo:

```
$ npm i --dry-run @angular/cdk@22.0.5 @angular/aria@22.1.5
npm error code ERESOLVE
npm error Could not resolve dependency:
npm error peer @angular/cdk@"22.1.5" from @angular/aria@22.1.5
```

So aria 22.1.5 is **not** installable here without also bumping CDK to exactly 22.1.5. See §4 for why
this matters far more to a *published library* than it does to this monorepo.

### 0.2 `command-palette` does not use `ListKeyManager`, and its navigation surface is ~75 lines, not ~117

Pass 5 F-6 (`scratchpad/pass5-cdk.md:226`) is titled *"Three activedescendant listboxes hand-roll
`ListKeyManager`"* and cites *"roughly 350 lines combined"*, attributing `command-palette.ts:797-850`
to that total. Checked against the file:

- `command-palette.ts` imports **only** `FocusTrapFactory, LiveAnnouncer` from `@angular/cdk/a11y`
  (`command-palette.ts:28`). There is no `ListKeyManager`, `FocusKeyManager` or
  `ActiveDescendantKeyManager` anywhere in the entry point. It hand-rolls index arithmetic directly.
- The cited anchor `:797-850` has drifted; the real navigation surface today is:

  | Anchor | What | Lines |
  |---|---|---|
  | `command-palette.ts:200-212` | `findFirstEnabled` / `findLastEnabled` | 12 |
  | `command-palette.ts:566-578` | `activeIndex` `linkedSignal` | 13 |
  | `command-palette.ts:580-585` | `activeItemId` computed | 6 |
  | `command-palette.ts:686-691` | `setActiveItem` (hover) | 6 |
  | `command-palette.ts:822-841` | arrow / Home / End / Enter cases in `handleOverlayKeydown` | 20 |
  | `command-palette.ts:850-862` | `moveActive` (wrap + skip-disabled) | 13 |
  | `command-palette.ts:864-868` | `activateActive` | 5 |
  | | **total** | **75** |

  (Plus 8 lines of JSDoc on `activeIndex`, which would survive a migration in some form.)

The ~350-line figure is the *three-component combined* total, and F-6's own table shows `select` is
the bulk of it. Nothing in F-6 is wrong about `select`; the correction is only that
`command-palette` is the *smallest* of the three and the one that gains least.

### 0.3 Pass-5 F-3's "zero RTL awareness" no longer holds for `segmented-control` / `tags-input`

F-3 (`pass5-cdk.md:124`) is the strongest stated motivation for migrating `segmented-control` (a free
RTL bug fix). Both components now inject `Directionality` and derive their forward key from it —
`segmented-control.ts:355,497` and `tags-input.ts:346,643,674-680`. The pass-5 RTL fix agent landed
it. **The free-bug-fix argument for a `segmented-control` migration is gone.** (§5 shows the pattern
does not exist in `@angular/aria` anyway, so this is belt-and-braces.)

---

## 1. Does `@angular/aria` support the activedescendant pattern? — **Yes**

This was the brief's first gate and it passes cleanly, so it is not the reason for rejection.

`Listbox` exposes `focusMode: InputSignal<'activedescendant' | 'roving'>`
(`types/listbox.d.ts`), and `ListFocus.getActiveDescendant()` returns
`activeItem()?.id()` in that mode (`fesm2022/_list-navigation-chunk.mjs:18-26`). `ComboboxPattern`
mirrors the popup's active descendant onto the combobox host
(`'[attr.aria-activedescendant]': '_pattern.activeDescendant()'`, `fesm2022/combobox.mjs`), which is
exactly the palette's shape: DOM focus on the input, active row identified by id.

The codified focus-ring carve-out in CLAUDE.md ("Activedescendant-listbox carve-out", canonical
example `command-palette.ts`) would therefore **survive** a migration. It is not the blocker either.

One DOM cost, non-fatal: in `activedescendant` mode `getListTabIndex()` returns **0**
(`_list-navigation-chunk.mjs:27-32`), so the listbox element gets `tabindex="0"` — a second tab stop
inside the palette's `FocusTrap`, reading as an empty listbox to a screen reader. Overridable:
`Listbox` has a `tabIndex` input aliased `tabindex` and the host binding is
`tabIndex() !== undefined ? tabIndex() : _pattern.tabIndex()` (`fesm2022/listbox.mjs:260`), so
`[tabindex]="-1"` wins. Report it as *"you are now overriding the directive"*, not as a wall.

---

## 2. The blocker with no workaround: `ngListbox` models **selection**; the palette is an **action list**

`Listbox.value` is `ModelSignal<V[]>` and *every* activation path in the pattern routes through it.
`OptionPattern.selected = computed(() => listbox().inputs.value().includes(this.value()))`
(`_option-chunk.mjs:218`). There is no "activate" concept — only "select".

The two selection modes, read from `ListboxPattern.keydown` (`_option-chunk.mjs:33-140`):

| `selectionMode` (single-select) | ArrowDown | Enter |
|---|---|---|
| `"follow"` | `next({selectOne: true})` — **selects on every arrow key** | **no binding registered at all** |
| `"explicit"` | `next()` — moves only | `toggleOne()` |

The Enter column is worth spelling out, because it is easy to misread. `ListboxPattern.keydown`
registers plain `Enter` in exactly two branches — `!followFocus() && multi()` (→ `toggle()`) and
`!followFocus() && !multi()` (→ `toggleOne()`) — plus `Ctrl/Meta+Enter` under
`multi() && followFocus()`. **There is no `followFocus() && !multi()` branch**, so single-select
follow mode registers no Enter handler whatsoever (`_option-chunk.mjs:33-140`).

Neither mode maps onto the palette, and they fail in *different* ways:

- **`follow`** — `value` changes on mere navigation, so "value changed ⇒ run the command" fires a
  command on every ArrowDown. And Enter contributes nothing: aria registers no handler, while
  `ComboboxPattern` still registers Enter on the input purely to relay it
  (`manager.on('Enter', e => this.keyboardEventRelay.set(e))`, `private.mjs`) — which
  `stopPropagation()`s the original (§3). So the relayed event lands on a listbox with no Enter
  binding and the palette's own `handleOverlayKeydown` never sees it: **Enter becomes dead.**
- **`explicit`** — Enter calls `listBehavior.toggleOne()` (`_list-chunk.mjs:73-75`). Pressing Enter
  twice on the same row **deselects** the second time and emits nothing. `closeOnSelect` defaults to
  `true` with a JSDoc-justified rationale (`command-palette.ts:442-443`), and the documented opt-out
  — `[closeOnSelect]="false"`, the "run many" launcher — is precisely the mode in which repeatedly
  hitting Enter on one row is the *point*. That mode breaks silently.

So in *no* mode does `@angular/aria` supply activation for free: `follow` supplies none, `explicit`
supplies the wrong one.

The regression net catches this precisely. `command-palette.spec.ts:818-831` asserts that the
**active** option carries `aria-selected="true"`. Under `ngOption` that attribute is bound from
`_pattern.selected()` (`fesm2022/listbox.mjs:502`), i.e. selection, not active:

- with `selectionMode="explicit"`, on open nothing is selected, so the active option renders
  `aria-selected="false"` → **the spec fails**;
- with `selectionMode="follow"` it passes, but that is the mode that fires a command per arrow key.

**There is no configuration in which "the active row is `aria-selected`" and "Enter runs the row"
both hold.** That is the rejection, and unlike everything else in this report it has no workaround
that preserves documented behaviour.

The generalisable discriminator, which §5 and the CLAUDE.md section both use: **does the component
have a genuine selection or expansion model, or does it fire and dismiss?** `ngListbox` fits the
former only. `@angular/aria`'s action-list pattern is `ngMenu` — whose trigger is a button, not a
filtered text input, so it does not fit a palette either.

---

## 3. The second blocker, patchable but expensive: `@angular/aria` swallows the CDK overlay's keys

`KeyboardEventManager` sets **`preventDefault: true` and `stopPropagation: true` as the defaults for
every key it registers** (`_violations-chunk.mjs:40-45`), and `EventManager.handle` applies them
whenever the matcher fires — *regardless of whether the handler did anything*
(`_violations-chunk.mjs:15-27`).

`ComboboxPattern.keydown` registers `Escape` whenever the popup is expanded, with a handler that is a
**no-op** under `alwaysExpanded` (`private.mjs`):

```js
.on('Escape', () => {
  if (!this.inputs.alwaysExpanded()) {
    this.inputs.expanded.set(false);
  }
});
```

`alwaysExpanded: true` is exactly what a palette needs (the list is visible for the whole lifetime of
the overlay; there is no collapsed state). So Escape matches, does nothing, and is
`stopPropagation()`-ed.

Meanwhile the palette's close-on-Escape rides `overlayRef.keydownEvents()`
(`command-palette.ts:807-811`, `:816-821`), and CDK's dispatcher is a **bubble-phase listener on
`document.body`**:

```js
this._cleanupKeydown = this._renderer.listen('body', 'keydown', this._keydownListener);
```
`node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs:404`

An event stopped on the input never reaches `body`. **`closeOnEscape` breaks outright**, and so does
every other key the palette reads off that channel (ArrowUp/Down/Home/End/Enter all get
`stopPropagation` too).

This one *is* patchable — `stopPropagation()` is not `stopImmediatePropagation()`, so a template
`(keydown)` on the same input element still fires, and Escape can be re-handled there. But needing to
hand-write a keyboard handler on a directive adopted *to own the keyboard* is the whole cost of the
migration reappearing on the other side of it.

**This finding is the most reusable thing the pilot produced, and it is not palette-specific.** It
applies to *any* `@angular/aria` widget placed inside a CDK overlay, which is most of the components
that would otherwise be candidates: `dialog`, `select`, `combobox`, `menu`, `popover`,
`command-palette`, `date-picker`, `time-picker`. It is now recorded in CLAUDE.md.

---

## 4. The third blocker, ecosystem-level: the exact CDK peer pin

Restated from §0.1 with the consequence spelled out. `@angular/aria` peer-depends on
`@angular/cdk` at an **exact** version. A *published* library that declares
`"@angular/aria": "^22.0.0"` in `projects/ngx-tw/package.json` propagates that: npm resolves aria to
the newest 22.x, which then demands a single exact CDK build from the consumer — **including
consumers who import only `tw-button` and never touch the aria-backed entry point.** ngx-tw currently
declares `"@angular/cdk": "^22.0.0"`, deliberately wide.

If a future adoption goes ahead, it must:

1. declare `@angular/aria` **optional** via `peerDependenciesMeta`, the way `luxon` and `lucide`
   already are (`projects/ngx-tw/package.json`), **and**
2. declare it in **both** `projects/ngx-tw/package.json` and the root `package.json` — the
   undeclared-peer trap documented in CLAUDE.md's **Library Structure** section (invisible under
   npm's hoisted `node_modules`, fatal under pnpm / Yarn PnP), **and**
3. re-verify after a build with
   `grep -l "from '@angular/aria'" dist/ngx-tw/fesm2022/*.mjs`.

**Task 2's verification step is moot on this outcome** — nothing was installed, nothing was declared,
and no bundle imports `@angular/aria`, so the grep would return nothing by construction. Recorded here
rather than left silently unaddressed.

---

## 5. What is *not* the obstacle — the brief asked me to quantify the DOM collision, and it is the mild part

The brief expected the flat-DOM / `tv()`-slot convention to be the expensive collision. Checked
concretely, it mostly is not:

| Concern | Verdict | Evidence |
|---|---|---|
| `ngListbox` / `ngOption` force wrapper elements | **No.** Both are attribute directives — they sit on the existing `<div role="listbox">` (`command-palette-overlay.html:22`) and `<div role="option">` (`:42`). | `selector: '[ngListbox]'`, `'[ngOption]'` |
| `tv()` slot classes are lost | **No.** Neither directive binds `class`. `[class]="itemClasses(...)"` (`overlay.html:45`) is untouched. | host bindings are `role` + `attr.*` only |
| Active-state styling has no hook | **No.** `ngOption` exports `active()` via `exportAs: 'ngOption'` and binds `[attr.data-active]`. | `fesm2022/listbox.mjs:411,499` |
| Grouping breaks — `ngOption` must be a direct child | **No.** `Option` resolves its listbox through DI (`inject(LISTBOX)`), and the palette's `role="group"` wrappers (`overlay.html:33`) are plain elements, so the injector chain reaches through them. | `fesm2022/listbox.mjs:414` |
| Grouped / `@for`-rendered options come out in the wrong order | **No.** `SortedCollection` sorts by `compareDocumentPosition` on every mutation, via a `MutationObserver`. | `_violations-chunk.mjs:118-167` |
| Item ids (`aria-activedescendant` asserts consumer ids) are lost | **No.** `Option.id` defaults to a generated id but is a settable `input()`. | `fesm2022/listbox.mjs:415-417` |
| `ResolvedItem` / `ResolvedGroup` must change shape | **No.** `ngOption` takes `[value]`, `[disabled]`, `[label]`; all three exist on `ResolvedItem.data`. No exported-interface change, hence no semver break. | `command-palette.ts:59-83` |
| `ngComboboxPopup` dictates rendering | **Partly.** It is `ng-template[ngComboboxPopup]` with a `DeferredContent` host directive, so it owns *when* the list renders — a second embedded view inside an already-portaled overlay component. Workable with `alwaysExpanded`, but it is a rendering layer the palette does not currently have and does not need. | `fesm2022/combobox.mjs` |
| Listbox adds a tab stop | **Yes, but overridable** with `[tabindex]="-1"`. See §1. | `_list-navigation-chunk.mjs:27-32` |

So the honest quantification the brief asked for: **the DOM-shape collision costs one `ng-template`
layer and one `tabindex` override.** It is not why the pilot was rejected. Saying so is itself
useful — it stops the next author rejecting a *good* candidate for the wrong reason.

---

## 6. Net accounting

Migrating `command-palette` would **delete** ~75 lines of index arithmetic (§0.2) and **add**:

- a selection model (`V[]`) the component has no concept of, plus a translation layer from
  `valueChange` to `itemSelected` that cannot express `closeOnSelect: false` (§2);
- an `ng-template ngComboboxPopup` + `DeferredContent` rendering layer inside an already-portaled
  CDK overlay (§5);
- a hand-written `(keydown)` Escape handler to undo the directive's `stopPropagation` (§3);
- a `[tabindex]="-1"` override to undo the directive's own tab stop (§1);
- a lockstep exact-CDK constraint on every consumer of every entry point (§4);
- a spec edit to `command-palette.spec.ts:818-831` weakening a correct `aria-selected` assertion,
  which the brief explicitly flags as a cost ("its existing spec is the regression net and should
  pass unchanged").

That last line is decisive on its own terms: the only way to make the migration green is to relax the
guard that catches it.

---

## 7. Which of the six *would* fit — and the answer is "none of them, today"

Pass-5 F-6 identifies six genuine hand-rolled list navigations. Scored against the discriminator from
§2 (**genuine selection/expansion model?**) plus §3 (**owns its own DOM focus, outside a CDK overlay?**):

| Component | Roles used | aria pattern exists? | Selection model? | Outside an overlay? | Verdict |
|---|---|---|---|---|---|
| `select` | `combobox` + `listbox` + `option` | **Yes** — `ngCombobox` + `ngListbox` | **Yes** — real single/multi select | **No** — CDK overlay | Best shape match, but §3 applies (see note). Also mid-migration onto the shared overlay coordinator. **Not now.** |
| `combobox` | `combobox` + `listbox` + `option` | **Yes** | **Yes** | **No** — CDK overlay | Same as `select`. **Not now.** |
| `command-palette` | `combobox` + `listbox` + `option` | Yes, shape-wise | **No** — action list | **No** — CDK overlay | **Rejected**, §2. |
| `radio` | `radiogroup` / `radio` (`radio.ts:243,582`) | **No** | Yes | Yes | `@angular/aria` ships **no RadioGroup**. Its only "radio" is `menuitemradio` inside `ngMenu`. **No target.** |
| `segmented-control` | `radiogroup` / `radio` (`segmented-control.ts:199,295`) | **No** | Yes | Yes | Same — no target. And the F-3 RTL motivation is stale (§0.3). |
| `tags-input` | `group` chip strip, MatChipGrid-style (`tags-input.ts:239`) | **No** — `ngGrid` is a real 2-D grid, this is a chip row + text input | No | Yes | **No target.** |

**Note on how §3 lands on `select` / `combobox`, checked rather than assumed.** Both handle Escape at
*two* levels: an element-level `(keydown)` switch on the trigger/input (`select.ts:1301`,
`combobox.ts:1043`) **and** the overlay's `keydownEvents()` as an explicitly-commented safety net
(`combobox.ts:1385-1391`). `stopPropagation()` does not stop listeners on the same element, so their
**primary** Escape path would survive an `ngCombobox` adoption; the safety net would not. But the
shared coordinator the sibling is migrating them onto exposes `escape$` built **solely** on
`overlayRef.keydownEvents()` (`core/overlay/picker-overlay-coordinator.ts:262,272`) — so §3 hits the
new shared abstraction head-on, which is worse than hitting either component. Softened from "hits §3
head-on" accordingly.

Verified: the strings `radiogroup` and standalone `radio` appear nowhere in `@angular/aria`'s eight
entry points (`accordion`, `combobox`, `grid`, `listbox`, `menu`, `tabs`, `toolbar`, `tree`); the only
match is `MenuItem.role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'` (`types/menu.d.ts:102`)
and one in `toolbar`.

**So: none of the six is a good first adoption today.** Three have no corresponding aria pattern at
all; one is the rejected pilot; the two that do match structurally (`select`, `combobox`) sit inside
CDK overlays and would hit §3 immediately — and are being reworked by a sibling right now.

### Where the maintainer should look instead

The discriminator points *away* from the six, at components that already own their DOM focus and have
a real selection/expansion model:

- **`tabs` / `tab-nav`** — `@angular/aria/tabs` ships the exact pattern; not in an overlay; genuine
  selection (active tab); currently `FocusKeyManager` (`tabs.ts:462,582`). This is the cleanest
  structural fit in the library. Caveat: it is a *lateral* move from CDK to aria, not a gap fill, and
  `tabs` was recently stabilised (`e2b5135 fix(tabs): stop stealing focus when a tablist mounts`) —
  so the risk/reward is thin unless aria's RTL-aware `prevKey`/`nextKey` and deferred tabpanel content
  are wanted for their own sake.
- **`transfer`** — already on `CdkListbox` (`transfer.ts:437-451`); genuine multi-select; own DOM
  focus; no overlay. `ngListbox` is CdkListbox's stated successor, so this is the lowest-risk aria
  migration available. Also a lateral move — there is no hand-rolled code to delete.
- **`collapsible` / `accordion`** — `@angular/aria/accordion`; expansion model; own focus; currently
  `FocusKeyManager` (`collapsible.ts:464,535`). Same lateral character.

If the goal is "delete hand-rolled navigation", the honest answer is that `@angular/aria` does not
currently address any of it, because the hand-rolled navigations are radio groups, chip strips, and
overlay-hosted comboboxes. If the goal is "get onto the framework's forward path for a11y patterns",
`transfer` is the cheapest first step and `tabs` the highest-value one — both after §3 is resolved
upstream or accepted as a permanent tax on overlay-hosted widgets.

---

## 8. Files touched

| File | Change |
|---|---|
| `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` | **One new section added** — `## @angular/aria — adoption position`, inserted between `## Accessibility` and `## Testing`. Nothing else in the file was edited. |
| `/Users/ciprianiuga/dev/sandbox/ngx-tw/scratchpad/p6-aria-pilot-report.md` | This report. |

**Deliberately not touched:**

- `projects/ngx-tw/command-palette/**` — zero edits. Public API unchanged, spec unchanged.
- `projects/demo/src/app/routes/command-palette/**` — zero edits.
- `package.json` (root) and `projects/ngx-tw/package.json` — `@angular/aria` **not** added, since it
  is not used. `package-lock.json` untouched: the package was inspected via `npm pack` into a scratch
  directory, and the resolution probe ran in a throwaway `npm init` directory outside the repo.

**Verification run:** none, deliberately. No source file changed, so `npm run build:lib` and
`ng test ngx-tw` would only have re-tested siblings' in-flight edits — `git status` showed
`date-picker.ts`, `date-range-picker.ts`, `date-range-picker.spec.ts` and `time-picker.ts` modified by
other agents, and the brief warns that a red run from those is the exact phantom that has cost agents
cycles before. The one thing that *did* warrant empirical proof (§0.1 ERESOLVE) was proved outside
the repo.

## 9. Residual risk, stated rather than hidden

- **§2 rests on reading `_option-chunk.mjs` and `_list-chunk.mjs`, not on running a TestBed.** I judged
  a TestBed probe not worth it: those files *are* the shipped `@angular/aria`, not a replica of it, so
  the CLAUDE.md "verify against the component, not a model of it" lesson is satisfied — and running
  `ng test ngx-tw` would have type-checked three siblings' half-finished files. If the maintainer wants
  belt-and-braces before acting on the CLAUDE.md section, the cheap confirmation is a scratch app with
  `ngListbox selectionMode="explicit"` and two Enter presses on one option.
- **All version facts are pinned to `@angular/aria@22.1.5` / `@angular/cdk@22.0.5`, read 2026-09-03.**
  The exact-peer-pin behaviour (§4) held across all three releases I checked and looks like policy
  rather than an accident, but it is upstream's call and could change.
- **§7's recommendation of `transfer` / `tabs` is a shape analysis, not a migration spike.** Neither
  was prototyped. Both would still pay the §3 tax if they were ever hosted in an overlay, which they
  are not today.
