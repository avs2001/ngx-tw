# Pass 5 — lens: Angular CDK adoption (`cdk`)

Read-only audit. Register sections `Verified-clean` (~726) and `Open — carried to pass 5` (~750)
read first; `Traps` skimmed. Nothing below is in the register — I grepped it for `cdk`,
`aria-live`, `LiveAnnouncer`, `announce`, `rtl`, `Directionality`, `typeahead`, `escape`,
`SelectionModel`, `KeyManager`, `MutationObserver`, `matchMedia`, `drag` and got no overlap.

CDK version measured: **22.0.5** (`node_modules/@angular/cdk/package.json`). Every CDK claim
below is read off that installed copy, not from memory.

---

## Headline

The library is a **good** CDK citizen structurally — `menu` composes `CdkMenu`/`CdkMenuItem` via
`hostDirectives`, `transfer` composes `CdkListbox`, `tree` composes `CdkTree`, `textarea` composes
`CdkTextareaAutosize`, `stepper` extends `CdkStepper`, `dialog`/`sheet` extend
`CdkDialogContainer`. Nine of the ten "is CDK missing?" leads close clean.

The gap is not *which packages* are imported. It is that **four things CDK already owns are
independently re-implemented, and the re-implementations have diverged from the CDK-backed
siblings sitting next to them**:

| Concern | CDK-backed | Hand-rolled | Divergence found |
|---|---|---|---|
| List keyboard nav | 8 components | 8 components | wrap on/off, type-ahead present/absent, disabled-skip present/absent |
| Layout direction (RTL) | 5 components | 4 components (+1 with a third mechanism) | arrow keys invert in RTL in 3 |
| Announcements | `LiveAnnouncer` in 22 files | `aria-live` regions in 8 files | **2 components do both, announcing twice** |
| Unique DOM ids | `_IdGenerator` in 4 files | `let nextId = 0` in 28 files | `dialog.ts` and `dialog-content.ts` differ *inside one entry point* |

Findings are ordered by consumer-visible benefit, as the brief asked.

---

### F-1 `tw-table` announces its loading state twice — a `LiveAnnouncer` call and a hand-rolled live region carrying the same string
Severity: HIGH
Anchor: `projects/ngx-tw/table/table.ts:1275`
Register: not in register
Confidence: [verified]

**What.** Two announcement channels fire for one state change.

- `table.ts:1275` — `this._liveAnnouncer.announce(labels.loading, 'polite')` inside an effect that
  tracks `loading()`.
- `table.html:248-284` — `@if (loading())` inserts `<div ... role="status" aria-live="polite">`
  (`table.html:251-252`) whose fallback content ends in `<span>{{ resolvedLabels().loading }}</span>`
  (`table.html:283`).

Both emit the **same string** (`resolvedLabels().loading`) at the **same moment**. The
`@if` insertion of a `role="status"` node with text content is announced by NVDA and JAWS; the CDK
announcer writes the same text into its own visually-hidden `aria-live` region.

The `else` branch has the same shape at a lower confidence: `labels.rowsUpdatedAnnouncement` goes
through `LiveAnnouncer` only, so *that* one is fine — the duplication is specific to the loading
transition.

**Why it matters.** A screen-reader user hears "Loading…" twice on every fetch. This is the exact
failure `LiveAnnouncer` exists to prevent, and it is invisible to axe (both regions are
individually valid). Pass 3 was the accessibility pass and did not surface it, because it is not
an attribute defect — it is two correct mechanisms stacked.

**Fix.** Keep **both** `LiveAnnouncer` calls in the effect and silence the DOM region instead. Two
reasons this direction and not the reverse: (1) the two announces live in one `effect()`
(`table.ts:1272-1286`) and only the `if` branch has a DOM counterpart, so dropping it would mean
splitting the effect; (2) an `@if`-inserted live region — region and content appearing in the same
tick — is the *unreliable* announcement pattern, while a pre-existing region receiving text (what
`LiveAnnouncer` does) is the reliable one. Dropping the reliable channel to keep the unreliable one
is backwards.

Concretely, on `table.html:250-254`: deleting `aria-live="polite"` alone is **not** enough —
`role="status"` carries an implicit `aria-live="polite"` per ARIA. The overlay must become
non-announcing: drop both `role="status"` and `aria-live="polite"` and add `aria-hidden="true"`
(the spinner SVG is already `aria-hidden`; this hides the duplicate text span too). Nothing is lost
— `LiveAnnouncer` announces the same string. One-element diff, effect untouched, no semver impact.
Guard with a spec asserting the loading text reaches AT through exactly one channel.

---

### F-2 `paginator` hardcodes `withHorizontalOrientation('ltr')`, inverting arrow keys in RTL — and `tab-nav` documents this precise bug in prose
Severity: HIGH
Anchor: `projects/ngx-tw/paginator/paginator.ts:890`
Register: not in register
Confidence: [verified]

**What.**

```ts
// paginator.ts:889-891
const manager = new FocusKeyManager(items)
  .withHorizontalOrientation('ltr')   // ← literal
  .withHomeAndEnd();
```

`paginator` does not inject `Directionality` at all (`grep -L "@angular/cdk/bidi"` confirms).
Mechanism verified in the installed CDK, not inferred from the method name —
`_list-key-manager-chunk.mjs:138-141`:

```js
case LEFT_ARROW:
  if (this._horizontal && isModifierAllowed) {
    this._horizontal === 'rtl' ? this.setNextItemActive() : this.setPreviousItemActive();
```

So with `'ltr'` pinned, ArrowLeft always moves to the *previous* control. In an RTL page the
paginator's controls render right-to-left, so ArrowLeft moves focus visually **rightward** — the
wrong way.

The library already knows this. `tab-nav.ts:145` carries the comment *"Hardcoding 'ltr' inverts
ArrowLeft/ArrowRight in RTL"*, and `tabs.ts:584-591` / `tab-nav.ts:247-250` both feed a live
`Directionality` value into the same call. `paginator`'s block comment (`:874-882`) says it
"mirrors `accordion.ts` and the S12 tabs/tab-nav migration" — it mirrors everything except the
direction.

**Why it matters.** RTL is a supported scenario the library advertises: `split` ships an `rtl`
input and a demo section, `slider.meta.ts:12` lists RTL as a supported scenario, `breadcrumbs.meta.ts:11`
too. A keyboard user in an RTL locale gets backwards paging.

**Fix.** Inject `Directionality` (optional) and mirror it, exactly as `tab-nav.ts:141-150` does, or
— better, see F-9 — read `Directionality.valueSignal()` directly inside the existing rebuild
`effect()`, which already re-runs on signal change. Two lines. No semver impact.

---

### F-3 `segmented-control` and `tags-input` hand-roll horizontal arrow navigation with zero RTL awareness on non-native hosts
Severity: HIGH
Anchor: `projects/ngx-tw/segmented-control/segmented-control.ts:459`
Register: not in register (register `:96` "Space is not handled" is FIXED — `segmented-control.ts:441` handles it now; not re-reported)
Confidence: [verified]

**What.** Both components map ArrowRight → next / ArrowLeft → previous unconditionally, and neither
imports `@angular/cdk/bidi`:

- `segmented-control.ts:459-466` — `case 'ArrowRight': case 'ArrowDown': → +1`, `case 'ArrowLeft':
  case 'ArrowUp': → -1`. The host is `role="radio"` on a **custom element**
  (`segmented-control.ts:183-190`), so the browser's native RTL arrow flipping for
  `<input type="radio">` is unavailable — the component must flip it itself, and does not.
- `tags-input.ts:666-673` — chips are a horizontal row; `ArrowLeft → index-1`, `ArrowRight →
  index+1 or the input`. Same absence.

`radio` (`radio.ts:770-777`) has the identical code but is a **weaker** case and I am deliberately
not stacking it here: `orientation` defaults to `'vertical'`, so Left/Right is its secondary axis.

**Why it matters.** Same as F-2 — with F-2 this makes **3 components** whose arrow keys move the
wrong way in RTL while 5 siblings (`split`, `tabs`, `tab-nav`, `slider`, `timeline`) handle it. A
consumer cannot tell from the API which group a component is in.

**Fix.** Two options, and this needs a decision on which:
(a) Minimal — inject `Directionality` and negate the delta, ~4 lines each. Preserves the existing
    caret-position coupling in `tags-input` (`:641`, ArrowLeft only steps out of the input when the
    caret is at offset 0), which a key manager would fight.
(b) `segmented-control` only — migrate to `FocusKeyManager` (its options already expose `focus()`
    and `isDisabled()`; `segmented-control.ts:260` even documents `focus()` as *"Called by
    `FocusKeyManager` during arrow-key navigation"* — a comment describing a manager that does not
    exist). `.withHorizontalOrientation(dir).withWrap().withHomeAndEnd()` replaces `:453-495`
    wholesale.
`tags-input` should take (a). No semver impact either way.

---

### F-4 Escape-dismiss policy is split: 3 overlay surfaces ignore modified Escape, ~9 do not
Severity: MEDIUM
Anchor: `projects/ngx-tw/core/overlay/escape.ts:25`
Register: not in register
Confidence: [verified]

**What.** Two policies coexist.

*Modifier-guarded* (CDK `hasModifierKey`, 3 sites): `dialog/dialog-ref.ts:127`,
`sheet/sheet-ref.ts:135`, `tooltip/tooltip.ts:524` — all `event.keyCode === ESCAPE &&
!hasModifierKey(event)`.

*Unguarded* (`event.key === 'Escape'`, ~9 sites, 2 of them shared helpers):
`core/overlay/escape.ts:25`, `core/overlay/picker-overlay-coordinator.ts:252`, `select.ts:1265`,
`combobox.ts:1069`, `popover.ts:638`, `command-palette.ts:797`, `date-picker.ts:1145` /`:1185`
/`:1209`, `date-range-picker.ts:1091`, `tags-input.ts:655`/`:688`.

So Shift+Escape dismisses a select panel, a popover and a date picker, but not a dialog, a sheet or
a tooltip.

**Why it matters.** Modified Escape is how assistive tech and OS shells pass keys through
(Ctrl+Esc, Alt+Esc are OS-reserved on Windows; Shift+Esc is Chrome's task manager). More
importantly it is an *unpredictable* library: identical gestures produce different results on
sibling overlay components with no documented reason.

**Fix.** Adopt `hasModifierKey` everywhere and standardise on `event.key === 'Escape'` (see F-11 —
`keyCode` is deprecated DOM API; `hasModifierKey` reads `event.altKey/ctrlKey/metaKey/shiftKey` and
is keyCode-independent, verified at `keycodes.mjs:3-8`, so the two are orthogonal). Note the fix is
**not** one-line: the two shared helpers cover only 2 of ~12 sites; the rest are per-component
keydown handlers. **This is a behavioral break** — Shift+Escape stops dismissing 6 components — so
even though no exported type changes, it belongs in a minor release with a changelog entry, not a
patch.

---

### F-5 `select`'s type-ahead can make a **disabled** option the active descendant, after which Enter silently does nothing
Severity: MEDIUM
Anchor: `projects/ngx-tw/select/select.ts:1296`
Register: not in register
Confidence: [verified]

**What.**

```ts
// select.ts:1296-1298
const match = visible.findIndex((o) =>
  labelFn(o.option).toLowerCase().startsWith(this.typeAheadBuffer),
);
```

No `!o.disabled` filter. `:1301` then sets `activeIndex` to it, which drives
`aria-activedescendant`. Every *other* navigation path in the same file skips disabled options
(`findEnabledFrom`, `:1342-1350`), and `selectByVisibleIndex` correctly refuses to commit
(`:1126 — if (target.disabled) return;`).

**Why it matters.** Type "d" onto a list whose first "D…" entry is disabled: the screen reader
announces that option as active, the panel scrolls to it, and pressing Enter does nothing at all —
no error, no movement, no feedback. This is the failure mode WCAG 3.2 calls out. It is also the
*only* one of these findings that a user hits without an RTL locale or a screen reader.

**Fix.** One line — add `&& !o.disabled` to the predicate. CDK's `ListKeyManager` gets this free
via `skipPredicate` (`_list-key-manager-chunk.d.ts:50`), which is the F-6 argument, but do **not**
wait for that migration. No semver impact.

---

### F-6 Three activedescendant listboxes hand-roll `ListKeyManager`, and have already drifted apart
Severity: MEDIUM
Anchor: `projects/ngx-tw/select/select.ts:1310`
Register: not in register
Confidence: [verified]

**What.** `select`, `combobox` and `command-palette` each maintain a private `activeIndex` signal
plus their own move/wrap/skip/home/end logic — roughly 350 lines combined
(`select.ts:1286-1380`, `combobox.ts:1135-1171`, `command-palette.ts:797-850`). The tally across
the library:

- **CDK-backed list nav (8):** `tabs`, `tab-nav`, `collapsible` (+`accordion`), `paginator`
  (`FocusKeyManager`); `stepper` (`CdkStepper`'s own); `transfer` (`CdkListbox`); `menu`
  (`CdkMenu`); `tree` (`CdkTree`/`TreeKeyManager`).
- **Hand-rolled (8):** `select`, `combobox`, `command-palette`, `radio`, `segmented-control`,
  `tags-input`, `time-picker`, `calendar`. Of these, `calendar`'s is a **2-D grid** for which CDK
  ships no equivalent (correctly hand-rolled), and `time-picker`'s is a segmented field, not a list
  — so **6** are genuine list navigation.

The drift is the finding, not the line count:

| | wrap at ends | type-ahead | skips disabled in type-ahead |
|---|---|---|---|
| `select` | **no** (`findEnabledFrom` returns -1, `moveActive` breaks) | yes, 400ms | **no** (F-5) |
| `combobox` | **yes** (`(idx + delta + n) % n`, `:1145`) | n/a (filters by input text) | n/a |
| `command-palette` | no | none | n/a |

Two sibling activedescendant listboxes in the same library wrap differently, with no documented
reason on either.

**Why it matters.** Adopting `ListKeyManager` would make each of those a named, greppable option
(`.withWrap()`, `.withTypeAhead()`, `.skipPredicate()`) instead of an emergent property of three
separate loops, and would deliver CDK's type-ahead semantics for free — notably that CDK searches
from `selectedItemIndex + 1` with wraparound (`_typeahead-chunk.mjs:53-54`) so repeated prefixes
cycle, while `select`'s `findIndex` always restarts at 0 and cannot.

**Migration blockers I verified, so the next pass does not rediscover them:**
- `ActiveDescendantKeyManager<T>` requires `T extends Highlightable`
  (`_activedescendant-key-manager-chunk.d.ts:8,14`) — i.e. `setActiveStyles()`/`setInactiveStyles()`
  on each item. These components style options declaratively from a signal, so the correct target
  is **base `ListKeyManager`**, reading `activeItemIndex`.
- CDK's `Typeahead` **throws in dev mode** when items lack `getLabel`
  (`_typeahead-chunk.mjs:19-21`).
- CDK 22 added `constructor(items: Signal<T[]>, injector: Injector)`
  (`_list-key-manager-chunk.d.ts:37`), which fits `visibleOptions()` directly — no `QueryList`
  bridging needed. This is what makes the migration tractable now and was not true in older CDK.

**Fix.** Needs a decision: **whether to spend a refactor of this size at all.** If yes, migrate
`select` first (it is the one with type-ahead and the F-5 bug) using base `ListKeyManager` + the
signal constructor. **Semver:** `SelectVisibleOption` is an **exported** interface
(`select.ts:147`) — adding a required `getLabel()` is breaking. Add it as `getLabel?(): string`,
or keep the exported shape untouched and adapt into a private internal type. If no, at minimum land
F-5 and document the wrap divergence.

---

### F-7 `flip-card` announces a flip through `LiveAnnouncer` *and* a host `aria-live` region, in exactly the mode the host region was added for
Severity: MEDIUM
Anchor: `projects/ngx-tw/flip-card/flip-card.ts:283`
Register: not in register
Confidence: [verified]

**What.** Same shape as F-1, narrower blast radius.

- `flip-card.ts:113` binds `[attr.aria-live]="ariaLive()"`, and `:199-201` returns `'polite'` **only
  when `trigger() === 'manual'`** — so in manual mode the whole card is a live region and the
  front/back `aria-hidden` swap is announced by the AT.
- `:283-291` calls `liveAnnouncer.announce('Back face visible' / 'Front face visible')` on **every**
  flip, gated only on `hasBack()`.

The component's own comment at `:279-282` states the contradiction out loud: *"Manual mode
historically owned this because it sets `aria-live='polite'` on the host; interactive modes … still
need an explicit `LiveAnnouncer.announce`."* The announce was made unconditional; the host region
was not removed.

**Why it matters.** Manual-mode flip cards double-announce. Lower confidence than F-1 on the exact
AT behavior (a live region whose host also carries `aria-label` and `role` is announced
inconsistently across ATs), which is why this is MEDIUM and F-1 is HIGH — but the *design intent
contradiction* is unambiguous and is stated in the file.

**Fix.** Delete `ariaLive()` and its host binding (`:113`, `:199-201`); let `LiveAnnouncer` own the
announcement in all four trigger modes uniformly. `ariaLive` is `@internal`, so no semver impact.

---

### F-8 28 files hand-roll a module-level id counter; 4 use CDK's `_IdGenerator` — including two files inside the *same* entry point
Severity: LOW
Anchor: `projects/ngx-tw/dialog/dialog.ts:25`
Register: not in register
Confidence: [measured] (`grep -rnE "let (next|unique)[A-Za-z]*[Ii]d|_IdGenerator"` — 28 vs 4)

**What.** `let nextXId = 0; … \`tw-x-${nextXId++}\`` appears in 28 non-spec files (`split:36`,
`tabs:242`, `tooltip:245`, `radio:216`/`:581`, `input:149`, `checkbox:198`, `switch:152`,
`slider:217`, `select:374`, `combobox:76`, `table:664`/`:838`, `form-field:128-130`,
`popover:236`, `dialog:25`, `sheet:24`, `paginator:475`, … ). Four files use CDK's
`_IdGenerator`: `dialog/dialog-content.ts:73,113`, `sheet/sheet-content.ts:73,114`,
`popover/popover-title.ts:28`, `core/overlay/picker-overlay-coordinator.ts:110`.

The sharpest form: **`dialog/dialog.ts:25` and `dialog/dialog-content.ts:73` solve the same problem
two different ways inside one entry point.** Same for `popover.ts:236` vs `popover-title.ts:28`.

**Why it matters.** Mostly maintainer-visible. The one functional delta I verified
(`_id-generator-chunk.mjs:9-11`): `_IdGenerator` appends `APP_ID` when it is not the default
`'ng'`, so two Angular apps on one page get distinct ids; module-level counters in two separately
evaluated copies of the bundle both start at 0 and collide. Against that, `_IdGenerator` is an
**underscore-prefixed, unstable CDK symbol**, which is a real argument for *not* spreading it to 28
more files.

**Fix.** Drop `_IdGenerator` from the 4 files and use the module-counter convention the other 28
already follow. This ends the intra-entry-point split, removes a dependency on an unstable
`_`-prefixed CDK symbol, and touches 4 files instead of 32. No semver impact — all ids are internal
or already `readonly` fields.

I explicitly reject the opposite direction (a `core/` id helper routing all 32 sites): a mechanical
32-file refactor for a LOW finding whose only measured delta is multi-app-per-page is not worth the
churn, and CLAUDE.md's "do not create helper utilities or abstractions for one-off operations"
points away from it. CLAUDE.md's "never rewrite what CDK provides" reads as favouring
`_IdGenerator`; I believe the spec is wrong on this one instance, because an unstable underscore-
prefixed symbol is not something a published library should depend on at all.

---

### F-9 Four components mirror `Directionality.change` into a signal by hand; CDK 22 ships `Directionality.valueSignal`
Severity: LOW
Anchor: `projects/ngx-tw/tabs/tabs.ts:571`
Register: not in register
Confidence: [verified]

**What.** `Directionality` in CDK 22 exposes `readonly valueSignal: WritableSignal<Direction>`
(`_bidi-module-chunk.d.ts:15`). Four components predate it and each carry three pieces of
boilerplate — a mirror signal, a subscription, a teardown:

- `tabs.ts:286` + `:571-573`
- `tab-nav.ts:150` + `:201-203`
- `split.ts:200` + `:305-308`
- `timeline.ts:703` + `:819-822`

`slider.ts:899,1016,1038` reads `.value` imperatively inside handlers — fine, no reactivity needed.

**Note (folded in rather than filed separately):** `carousel` uses a **third** mechanism —
`getComputedStyle(viewport).direction` read **once** at setup (`carousel.ts:862`), with the comment
at `:860` conceding *"read once; consumers needing dynamic dir changes can re-render the host."* Its
key handling *is* RTL-aware (`:1402-1413` applies `_rtlSign()`), so this is not an F-2/F-3 defect —
just a frozen value where its closest sibling `timeline`, doing the same horizontal-scroll math,
tracks it live. Worth knowing that a naive switch could **regress**: `getComputedStyle().direction`
catches CSS `direction:` that `Directionality` (which reads the `dir` attribute) misses.

**Why it matters.** Removes 4 manual subscriptions — the register's "no subscription leaks" clean
finding stays clean with less to audit — and matches CLAUDE.md's signal-first rule.

**Fix.** Replace each mirror-signal + subscribe pair with a direct `directionality?.valueSignal()`
read inside the existing `computed`/`effect`. Internal only, no semver impact. Leave `carousel`
alone unless someone measures the CSS-`direction` case.

---

### F-10 `radio.orientation`'s JSDoc claims it "drives the arrow-key model"; it does not
Severity: LOW
Anchor: `projects/ngx-tw/radio/radio.ts:620`
Register: not in register
Confidence: [verified]

**What.** `/** Layout direction of the group. Drives \`aria-orientation\` and the arrow-key model.
Defaults to `'vertical'`. */`. The handler at `:770-777` treats ArrowRight/ArrowDown as one case and
ArrowLeft/ArrowUp as the other, **regardless of `orientation()`**. `orientation` reaches only
`[attr.aria-orientation]` (`:593`) and the `tv()` layout variant (`:701`).

The *behavior* is APG-correct — a radiogroup should accept both arrow pairs in either orientation.
The *documentation* is false.

**Why it matters.** CLAUDE.md treats JSDoc as load-bearing because Compodoc renders it into the
demo's API table; this sentence ships to consumers as a promise the component does not keep.

**Fix.** Reword to `Layout direction of the group. Sets \`aria-orientation\` and the visual axis;
both arrow-key pairs navigate in either orientation, per WAI-ARIA APG. Defaults to \`'vertical'\`.`
Doc-only, no semver impact.

---

### F-11 CLAUDE.md names CDK coercion as a thing to use; the library correctly uses Angular's `booleanAttribute`/`numberAttribute` instead, and CDK coercion is now redundant
Severity: LOW
Anchor: `.claude/CLAUDE.md` — "Compose Angular CDK, don't reinvent it" bullet, Core Principles
Register: not in register
Confidence: [measured]

**What.** Measured: **47** uses of `booleanAttribute`/`numberAttribute` from `@angular/core` across
14 files; **0** uses of `@angular/cdk/coercion`; **0** hand-rolled `transform:` functions
(`grep -rn "transform:" … | grep -v "booleanAttribute\|numberAttribute"` → empty). The code is
right and uniform. The spec sentence — *"Use CDK for focus traps, keyboard navigation, overlays,
ARIA, **coercion**, and collections"* — is the stale part.

**Fix.** Drop "coercion" from that list, or amend to *"coercion via Angular's own
`booleanAttribute`/`numberAttribute` (CDK's `coerce*` helpers are legacy)"*. **This is a spec
defect, not a code defect** — the code should not change. Doc-only.

---

## Closed positively — stated so pass 6 does not re-sweep

Each of these was a brief lead. Each is **not** a gap, and the reasoning is recorded so it does not
have to be rediscovered.

**Re-runnable form of each closure** — run these from the repo root before re-opening any lead
below. If a count moves, the closure is stale; if it does not, the lead is still closed.

| Lead | Check | Expected |
|---|---|---|
| coercion | `grep -rn "@angular/cdk/coercion" projects/ngx-tw --include="*.ts"` | 0 |
| coercion | `grep -rn "transform:" projects/ngx-tw --include="*.ts" \| grep -v spec \| grep -vE "booleanAttribute\|numberAttribute"` | 0 |
| observers | `grep -rn "MutationObserver" projects/ngx-tw --include="*.ts" \| grep -v spec` | 2 (`flip-card:267`, `stat:329`) |
| layout | `grep -rn "matchMedia\|innerWidth\|'resize'" projects/ngx-tw --include="*.ts" \| grep -v spec` | only `theme.service:74` + `carousel:1198` (reduced-motion), no layout use |
| collections | `grep -rn "SelectionModel" projects/ngx-tw --include="*.ts" \| grep -v spec` | 1, and it is a *comment* (`tree.ts:22`) explaining the rejection |
| drag-drop | `grep -rn "@angular/cdk/drag-drop" projects/ngx-tw` | 0, and no in-app element reordering exists to serve |
| scrolling | `grep -rn "@angular/cdk/scrolling" projects/ngx-tw --include="*.ts"` | 2 (`CdkScrollable` in dialog/sheet content) |
| text-field | `grep -rn "@angular/cdk/text-field" projects/ngx-tw --include="*.ts" \| grep -v spec` | 2 (`AutofillMonitor`, `CdkTextareaAutosize`) |
| high contrast | `grep -rn "forced-colors" projects/ngx-tw/theme/` | present in `_high-contrast.css` |
| interactivity | `grep -rn "InteractivityChecker" projects/ngx-tw` | 0, and no focusable-element DOM queries exist |
| deprecations | `grep -rn "attachDomPortal\|createDrag\|createDropList" projects/ngx-tw --include="*.ts"` | 0 |
| CDK privates | `grep -rnE "\.[_][a-zA-Z]+" projects/ngx-tw --include="*.ts" \| grep -v "\.spec\." \| grep -v "this\._"` | all hits are the library's own `_` fields; the only CDK ones (`_config`, `_ariaLabelledByQueue`, `_stepHeader`) are public-with-underscore |


**`@angular/cdk/coercion` — no gap.** Nothing in the library needs it. See F-11; the modern
`@angular/core` equivalents are used, uniformly, 47 times.

**`@angular/cdk/observers` — no gap worth acting on.** Exactly two hand-rolled `MutationObserver`s
exist (`flip-card.ts:267`, `stat.ts:329`) and both are correct. Measured against CDK's source:
`ContentObserver` hardcodes `{characterData, childList, subtree: true}`
(`observers.mjs:79-83`) with **no way to narrow it**. `stat`'s options match exactly; `flip-card`'s
`{childList: true}` on a single target is *deliberately narrower* and would get broader, not
better. CDK's only genuine extra is filtering out Comment-node-only records
(`observers.mjs:7-25`) — which would suppress nothing either component acts on, since both
recompute idempotently and `signal.set` of an equal value is a no-op. Both already disconnect on
destroy and both run inside `afterNextRender`, so SSR is safe without CDK's
`MutationObserverFactory` null-guard. Do not migrate.

**`@angular/cdk/layout` / `BreakpointObserver` — no gap; CSS is the better answer here.** Both
"responsive" claims are CSS-only, verified: `table` maps `TwBreakpoint` to Tailwind `max-*`
variants (`table.ts:499-527`), and `paginator` uses a **CSS container query**
(`paginator.ts:363` — `hidden @[30rem]:flex`, with `container-name` set at `:672-674`). The
container query is strictly better than `BreakpointObserver` for a paginator, because it responds
to the component's own width, not the viewport's. No `matchMedia`, `innerWidth` or resize listener
drives layout anywhere. (`theme.service.ts:74` uses `matchMedia('(prefers-color-scheme: dark)')` —
not a breakpoint, already `isBrowser`-guarded and `runOutsideAngular`; CDK's `MediaMatcher` would
add nothing.)

**`@angular/cdk/collections` / `SelectionModel` — no gap; the hand-rolled version is *better*, and
the code already says why.** Measured against CDK source: `SelectionModel.compareWith` is a
**comparator**, and `_getConcreteValue` linear-scans the whole selection for every membership test
(`_selection-model-chunk.mjs:145-152`). `table.ts:1396-1425` rejects exactly this in a comment —
*"a comparator would fix identity but leave membership as an O(rows × selected) scan"* — and keys
by `trackBy` into a `computed` Set instead. `SelectionModel` **cannot express a key function**, so
it cannot serve `table`. `tree.ts:20-23` and `transfer.ts:15-19` document the same choice for a
second reason: `SelectionModel.changed` is an RxJS `Subject`, which would need bridging into the
signal graph. Do not recommend `SelectionModel` for any of the three.

**`@angular/cdk/drag-drop` — no gap; nothing in the library reimplements it.** Checked every
pointer-drag site. `split`'s gutter (`split.ts:600-672`) is a constrained 1-D resize with percent/px
units, RTL, keyboard steps and snapping — it never translates an element, which is all `DragRef`
offers. `slider`'s thumb (`:886-887`) is the same shape. `carousel`'s pan (`:1277+`) drives
`scrollLeft` against CSS scroll-snap, which `cdkDrag` cannot do. `toast`'s swipe
(`toast-container.ts:335-395`) is the closest fit but would need `constrainPosition` plus a custom
release animation, for no gain. `file-upload` uses native HTML5 file drop (`DataTransfer`), which
`cdkDropList` explicitly does not handle. `transfer` moves items **by button**, and `table` lists
"Column resize, drag-reorder" as an explicit v1 non-goal (`table.ts:19`). Conclusion: the library
has **no drag-and-drop feature at all** — that is a product gap, not a CDK-adoption defect.

**`@angular/cdk/scrolling` / virtual scroll — capability gap, mostly documented.** `table.ts:20`
lists "CDK virtual scroll viewport integration" as an explicit v1 non-goal, and `tree.ts:568`
documents "no virtualization … not tuned for very large data sets". The **undocumented** cases are
`select`, `combobox` and `command-palette`, whose panels render every visible option into the DOM
with no stated cap. `MatSelect` has the identical limitation, and `cdk-virtual-scroll-viewport` is
genuinely hard to combine with `aria-activedescendant` (the active option's element must exist to
be referenced). Recommended action is a **JSDoc note on the panel**, not a virtual-scroll adoption.

**`@angular/cdk/text-field` — no gap.** `textarea` composes `CdkTextareaAutosize` via
`hostDirectives` with proper input aliasing (`textarea.ts:92-95`) and correctly cedes height
ownership to CDK while autosize is on (`:150-183`). `input` uses `AutofillMonitor`
(`input.ts:27`). `tags-input` is a single-line `<input type="text">` (`tags-input.ts:226`) —
autosize does not apply.

**`HighContrastModeDetector` — no gap; the CSS approach is better.** `theme/_high-contrast.css:251+`
maps the library's structural tokens under `@media (forced-colors: active)` to system keywords
(`Canvas`, `CanvasText`, `GrayText`, `Highlight`). CDK's detector predates the `forced-colors` media
query and works by sniffing a rendered pixel colour; the CSS is the modern, standards-track answer
and covers Linux a11y profiles the detector misses. The `high-contrast` *theme* in
`theme.service.ts:55` is an orthogonal, consumer-selected palette — not the same concern.

**`InteractivityChecker` — no gap.** Nothing in the library queries the DOM for focusable/tabbable
elements. Every `tabindex` is a declarative binding on a known element. `FocusTrapFactory`
(`popover.ts:27`, `command-palette.ts:28`) and CDK Dialog's built-in trap cover the cases where
tabbability matters, and both use `InteractivityChecker` internally.

**No deprecated CDK API is in use.** Enumerated every `@deprecated` symbol across
`node_modules/@angular/cdk/types/*.d.ts`: `attachDomPortal` (3 declarations),
`DragDrop.createDrag`/`createDropList`, `GlobalPositionStrategy.width`/`height`. **Zero** are
called by the library. Also checked and **disproved** my own suspicion that the `Overlay` service
is deprecated in favour of `createOverlayRef` — it carries no `@deprecated` tag in CDK 22.0.5
(`overlay.d.ts:278-286`), so the 8 `inject(Overlay)` sites are fine. The library already uses the
newer standalone `create*ScrollStrategy` functions alongside it.

**`dialog`/`sheet` reading `_config` and `_ariaLabelledByQueue` is idiomatic, not a violation.**
Both are declared **public** on `CdkDialogContainer` (`dialog.d.ts:167` `readonly _config: C;`,
`:195` `_ariaLabelledByQueue: string[];`) — underscore-prefixed by CDK convention for
`@docs-private` classes, but part of the documented subclassing surface that Material's own
`MatDialogContainer` uses identically. This is *not* another `CdkTree._expansionModel` (P4-2). A
sweep for library code reaching into `_`-prefixed members of CDK objects found nothing else;
every other `._x` hit is the library's own internal-field convention. `stepper._stepHeader` is
already recorded in the register as correct-and-forced and is not re-reported.

**CDK composition where it exists is exemplary.** `menu` binds `CdkMenu`, `CdkMenuGroup`,
`CdkMenuItem`, `CdkMenuItemCheckbox`, `CdkMenuItemRadio`, `CdkMenuTrigger` through `hostDirectives`
with full input/output aliasing (`menu.ts:176-360`). `transfer` composes `CdkListbox`/`CdkOption`
and documents, at `transfer.ts:8-31`, exactly which CDK behaviours it is delegating and which CDK
quirks it works around. These two are the model the F-3/F-6 components should be measured against.

---

## Residual uncertainty

- **F-1 and F-7 are `[verified]`, not `[measured]`.** I read the source; I did not run a screen
  reader. Whether a newly-inserted `role="status"` node is announced varies by AT/browser pair, and
  F-7's host region also carries `role` + `aria-label`, which muddies it further. F-1's duplication
  is unambiguous in the code (same string, two channels, same tick); F-7's is unambiguous as a
  *design contradiction* stated in the file's own comment. Neither claim depends on the AT question
  to justify the fix, but a NVDA/VoiceOver check before landing would be cheap.
- **No RTL claim here is `[measured]`.** The brief forbids running e2e, and there is no RTL e2e
  coverage to run — `grep -rn "rtl" e2e/` returns nothing, and the only RTL surface in the demo is
  `split`'s example section. F-2's *mechanism* is verified against CDK's source; F-2/F-3's
  *user-visible consequence* is inference from that mechanism.
- **F-6 is the only finding I would not act on without a maintainer decision.** It is a
  multi-hundred-line refactor of three of the most intricate components in the library, its payload
  is consistency plus two concrete bugs (F-5, the wrap divergence), and both of those can be fixed
  in isolation for a fraction of the cost.
