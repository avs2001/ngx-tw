# ngx-tw — library audit, September 2026

**Method.** Six parallel read-only audits (API surface, signal reactivity, accessibility,
test/demo coverage, computed size scale, industry rhythm research), plus a mechanical sweep of
shipped source against `.claude/CLAUDE.md`, plus **live browser measurement** of every component
at every size via a new diagnostic page (`/foundations/rhythm`).

Full reports live in `docs/research/2026-09-audit/`, alongside the re-runnable measurement
scripts (`bool.mjs`, `fixme.mjs`, `inputs2.mjs`, `p6-contrast.mjs`). This file is the triage
register.

**Confidence gradient.** Findings marked **[measured]** were reproduced in a real browser or by
running code. Findings marked **[verified]** were confirmed by reading the source myself.
Findings marked **[reported]** come from an audit agent and are file-anchored but I did not
independently re-derive them.

---

## What is already good

Worth stating, because it sets the bar for everything below and because a register of only
defects misrepresents the codebase.

- **Zero signal cycles** across 73 audited `effect()` / `afterRenderEffect()` calls. The one
  codified exception (`paginator`) still carries its bounding guard. **[reported]**
- **61/61 components on `OnPush`.** No `standalone: true`, no `@HostBinding`/`@HostListener`,
  no legacy control flow, no `.mutate(`, no `@angular/animations`, no NgModules. **[reported]**
- **No raw Tailwind palette colours** anywhere in shipped source — the semantic-token rule holds
  library-wide. No `transition-all`, no forbidden shadows, no forbidden radii. **[measured]**
- **56/56 secondary entry points** correctly registered in all four required places. **[reported]**
- **All four `NG_VALIDATORS` controls ship the mandated guard spec**, and each genuinely asserts
  an error code reaching a bound `FormControl` — not just a successful mount. **[reported]**
- **No control is on the silent-validator-drop path.** Every Shape-A CVA assigns
  `valueAccessor` in the constructor. **[reported]**
- ~7.2% of 2,672 tests are ceremonial by full census (not sampling). **[reported]**

---

## Tier 1 — fixed in this pass

| # | Finding | Evidence |
|---|---|---|
| F1 | `PromiseMessages` used in `ToastService.promise()`'s public signature but never exported — consumers could pass a literal but not name the type. | **[verified]** `toast.ts:28` |
| F2 | Five components (`aspect-ratio`, `file-upload`, `number-input`, `tags-input`, `tree`) had **zero e2e coverage** — missing from `e2e/support/routes.ts`, which every data-driven sweep iterates. | **[measured]** 15 new smoke tests, all pass |
| F3 | The drift guard for F2 **had never executed**. `npm test` was `ng test ngx-tw`; the demo project's test target was never invoked. | **[measured]** guard now runs and passes |
| F4 | `date-range-picker.ts:936` stated `NG_VALUE_ACCESSOR` "is not registered as a provider". It **is**, at `:281`, and it is load-bearing. A maintainer trusting the comment would delete it and silently kill every calendar error code. | **[verified]** |
| F5 | `--width-calendar-*` tokens defined in `_semantic.css`, referenced nowhere. | **[verified]** |
| F6 | Line-heights were unitless ratios, so re-uniting `--text-sm` rescales every line box. Now pinned in `rem` at Tailwind's own computed values (zero visual diff). | **[measured]** |
| F7 | Six factual errors in `.claude/CLAUDE.md` — including a component path (`src/lib/`) that does not exist. | **[verified]** |
| F8 | The vertical rhythm system itself — form-row spread **30px → 0px** at every size. See `docs/vertical-rhythm.md`. | **[measured]** |
| F9 | `file-upload` set `aria-required` and `aria-invalid` on a `role="group"` host — a **critical** axe `aria-allowed-attr` violation. Invisible because the component had no e2e coverage (see F2). `tags-input` had the same defect latently. Both moved to the control that owns the value. | **[measured]** — axe |
| F10 | Four demo examples used `[attr.aria-label]` on components that alias `aria-label` as an **input**. The attribute binding never feeds the input, and the component's own host binding then resolves it to `null` — stripping the name it looked like it was setting. Nine components have this shape. | **[measured]** |
| F11 | `carousel`'s post-interaction timer handle was never stored, so teardown could not clear it — it fired after destroy and wrote a signal on a dead component. | **[verified]** |
| F12 | `toast-container` had no destroy hook, so a swipe interrupted by an auto-dismiss left pointer capture unreleased. | **[verified]** |
| F13 | **`table.rowClicked` emitted `index: undefined` for every table without row expansion.** `table.html` read `let i = dataIndex`, but CDK populates `dataIndex` ONLY when `multiTemplateDataRows` is on; otherwise it sets `index`. Now reads both and coalesces. Found because the new spec dispatches a real DOM click — the old one called `handleRowClick(row, 2, event)` directly and passed the index in itself, so the template glue was never exercised. | **[measured]** |
| F14 | `calendar` changed height on every view switch (day 252 / month 120 / multi-year 240). All three views now hold 252px — verified in a browser at 0px variance. The *horizontal* shift (270 / 286 / 254) remains; pinning `min-w` pushes the range-endpoint pill ~1px off at every boundary, so it needs a rendered check. | **[measured]** |
| F15 | 188 JSDoc blocks completed across the library — 126 missing defaults, 2 members with none at all, 23 public methods, 28 alias notes. Compodoc generates the demo's API tables from these, so each was a blank cell a consumer reads. | **[reported]** |
| F16 | Off-scale values in `timeline`, `command-palette` and `calendar-cell` now carry the justification CLAUDE.md requires. `paginator` needed none — the height migration already put it exactly on the scale. | **[reported]** |

---

### Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass |
| `npm run test:ci` | **2977 passed**, 4 skipped (71 files) + 4 demo |
| `npm run lint` | **0 errors**, 70 warnings — the same 70 as before this work |
| `npm run e2e:fast` | **869 passed**, 0 failed, 58 skipped |
| `npx playwright test --grep @rhythm` | **6 passed** |
| `npm run verify:package` | pass — 59 entry points, theme resolves from a clean consumer install |
| `npm run verify:mcp-index` | pass (7 pre-existing warnings) |
| `npm run e2e:visual` | **stale by design — see Tier 3c.** Regenerate on Linux via `workflow_dispatch`. |

---

## Tier 2 — accessibility (26 HIGH). Needs its own pass.

These are **not** mechanical. Several are design decisions and each needs a test. Folding them
into the rhythm diff would make a regression in either unattributable.

**Do this one first — it is a one-line change that makes the rest enforceable:**

> `e2e/support/a11y.ts:20` — `AXE_TAGS` lists `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`,
> `best-practice`. It **omits `wcag22aa`**. Every SC 2.5.8 target-size finding below is
> invisible to CI *by configuration*. **[verified]**
>
> Caveat: enabling it turns CI red until the failures below are either fixed or added to the
> existing `A11Y_BACKLOG` mechanism. Enable and triage in the same change.

### Keyboard operability — a control is mouse-only (SC 2.1.1)

| Component | Defect | Anchor |
|---|---|---|
| `select` | Clear control has no keyboard path. Its `(keydown)` handler and focus ring are **unreachable dead code**. | `select.ts:394-402`, `:1039-1045` |
| `date-range-picker` | Clear button is `tabindex="-1"`, click-only; trigger keydown handles only Alt+Arrow and Escape; `showActions` defaults `false`. | `date-range-picker.ts:342` |
| `table` | Clickable `<tr>` wired to the public `rowClicked` output with no `tabindex`, `role`, `(keydown)` or focus indicator. | `table.html:132` |
| `segmented-control` | **Space is not handled** and the host is not a native button. | `segmented-control.ts:293-320` |
| `command-palette` | With `autoFocus="false"`, nothing moves focus in and every binding is on `overlayRef.keydownEvents()` — inoperable while asserting `aria-modal="true"`. | `command-palette.ts:675-677` |

### Widget silently leaves the tab order (SC 2.1.1)

| Component | Trigger | Anchor |
|---|---|---|
| `segmented-control` | `activeValue() === null` is a strict check; `undefined` / `''` / any non-matching value leaves **no** option tabbable. | `:176` |
| `tabs` | A `value` matching no tab leaves no trigger with `tabindex="0"` — the whole tablist is unreachable. | `tabs.ts:212` |
| `calendar` | `focusedCellValue` has one writer and **none that resets it to null**; a period change skipping `focusCell()` strands it at zero tabbable cells. | `calendar-view-base.ts:96,204-215` |
| `calendar` | Native `[disabled]` on cell buttons makes `.focus()` a no-op, desynchronising `tabindex` from DOM focus. | `calendar-cell.ts:141` |

### Accessible name / state (SC 4.1.2)

- `checkbox` and `time-picker` have **no accessible name** inside a `tw-form-field` — neither
  overrides `setLabelledByIds` and their `id()` lands on a non-labelable custom element.
  `time-picker`'s JSDoc actively documents the broken path. `checkbox.ts:352`, `time-picker.ts:468`
- `calendar` binds `aria-selected` on the inner `<button>`, whose implicit role does not support
  it; the `role="gridcell"` host carries none. **The selected day's state is never exposed.**
  `calendar-cell.ts:137`
- `select` searchable: focus moves to the overlay input while `aria-activedescendant` stays on
  the trigger — arrow navigation is silent to AT. `select.ts:369` vs `:1311`

### Target size (SC 2.5.8) — spacing exception unavailable

`carousel` dots 12px at **default config** · `carousel` lines 4×16 at xs · `split` gutter **6px**
· `tree` row 20px at xs · `menu` item 20px at xs · `select` clear 20×20 nested inside the trigger

### Other HIGH

- `tooltip` is neither **hoverable** nor **dismissible** (SC 1.4.13) — `pointer-events-none`
  wrapper, 0ms hide delay, Escape bound only on the trigger host. `tooltip.ts:50,310,341`
- `toast` auto-dismisses at 5000ms with no user control (SC 2.2.1); its buttons sit at the end of
  the tab order with no trap, autofocus, restore or hotkey. `toast-config.ts:67`
- `variant="naked"` on `select` and `date-picker` used standalone has **no focus indicator
  anywhere in the composite** (SC 2.4.7). `select.ts:187`, `date-picker.ts:160`
- **Contrast (SC 1.4.11):** `--color-border` = `gray-300` → **1.47:1** in light mode, against a
  3:1 requirement. For an unchecked checkbox the border *is* the component. `border-border-strong`
  (`gray-400`) is also under 3:1 at 2.60. Solid `warning` button is 2.15:1 light, **1.72:1 in
  high-contrast**. **[verified]** — this is a theme-layer decision with library-wide visual
  impact, not a mechanical fix.

### Coverage gaps behind all of the above

1. `AXE_TAGS` omits `wcag22aa` (above).
2. **axe never scans an interactive state** — `runAxe` runs only after `goto`. No open overlay,
   error or disabled state is ever scanned. That is where a11y bugs live.
3. The only cross-theme contrast sweep is `test.fixme`'d; **high-contrast has zero verification.**
4. `A11Y_BACKLOG` excludes 12 components wholesale rather than per-rule.

---

## Tier 3 — correctness and hygiene

- **4 SUSPECT effects** — `select.ts:837`, `combobox.ts:732`, `date-picker.ts:811`,
  `date-range-picker.ts:784` each write two signals they track-read (`overlayInstance` is a getter
  over a signal, plus `closingSignal`). They converge, but carry no justification comment, which
  CLAUDE.md requires. **The fix is known and already proven in this repo:** demote to plain
  fields, exactly as `popover.ts:400` and `command-palette.ts:460` do — which is why those two
  are SAFE. **[reported]**
- **`twMerge` cannot collapse custom-token classes.** `twMerge('duration-normal duration-500')`
  returns **both** — so a consumer cannot override the library's transition timing today.
  Needs a shared `createTV` with `twMergeConfig` threaded through ~55 call sites. **[measured]**
- **Leaks:** `carousel.ts:1324` post-interaction timer handle never stored, so teardown cannot
  clear it. `toast-container.ts:300-302` swipe pointer listeners removed only in `onSwipeEnd`,
  with no destroy hook. **[reported]**
- **Three public outputs referenced by no test repo-wide:** `select.searchChange`,
  `table.selectionChange`, `toast.actionClicked`. **[reported]**
- **`table`'s spec never dispatches a DOM event** — its three `MouseEvent`s are passed directly
  to `handleRowClick()`. The click path is untested. **[reported]**
- **138/647 inputs (21%) never appear in any spec.** Worst: `date-range-picker` (27/48 unused),
  `combobox` (17/33), `select` (16/28). **[reported]**
- `e2e/tsconfig.json` has 4 pre-existing type errors from two colliding Playwright `Page`
  types. **[measured]**
- **Library-internal cross-entry-point imports resolve through `dist/`, not source.** The root
  `tsconfig.json` maps `@cdevhub/ngx-tw/*` to `./dist/ngx-tw/*`, so when `textarea.ts` imports
  `InputDirective`, it type-checks against the *last build* rather than the sibling source file.
  During a multi-entry-point change `tsc` reports members that plainly exist as missing. CLAUDE.md
  documents this trap for tests but not for type-checking library source against itself. The
  uncomfortable corollary: a genuine cross-entry-point type error can be masked by a fresh
  `dist/` exactly as easily as a phantom one is invented by a stale one. **[measured]**
- **Two ways an inline-template comment breaks the build.** Both were hit during this session,
  both produce errors that point nowhere near the cause:
  1. **Braces.** Angular's template lexer parses `{ ... }` as the start of an ICU expression
     *even inside an HTML comment*. A comment containing `inject(X, { optional: true })` yields
     `TS1005: ',' expected` and `TS1359: 'true' is a reserved word`, reported at the template
     literal, not the comment.
  2. **Backticks.** A comment inside a `template:` literal that quotes code with backticks
     (`` `min-*` ``) terminates the literal early — 19 cascading errors in a file whose comment
     text looks harmless.
  Neither is caught by review-by-reading. Prefer prose without braces or backticks inside inline
  templates. **[measured]**
- **`[attr.aria-label]` is a silent footgun on nine components** — `radio`, `accordion`,
  `checkbox`, `transfer`, `tags-input`, `file-upload`, `menu`, `switch`, `paginator` all alias
  `aria-label` as an input *and* host-bind it. An attribute binding produces no accessible name
  and no warning. Worth a lint rule or a JSDoc note on each input. **[measured]**
- **`select`'s trigger was `inline-flex` where `combobox`'s was `flex`.** An inline-level trigger
  inside a block root generates a *line box*, so the host height was driven partly by the
  consumer's inherited font strut rather than by the trigger. This is why `select` measured 27px
  at `xs` — the only odd-pixel value in the library — while `combobox`, carrying byte-identical
  padding, measured 26. At every larger size the trigger's own ascent wins and the anomaly
  disappears, which is exactly why it looked like a one-off. Fixed during the rhythm migration;
  worth recording because **pinning the height alone would have hidden it, not fixed it** (the
  strut still wins at ~25.5px against a 24px pin). **[reported, with a controlled comparison]**

---

## Tier 3b — size-axis defects the rhythm pass did NOT fix

Surfaced by measurement, deliberately left for a follow-up because each needs a design decision
rather than a mechanical edit.

- **`calendar` changes height when you switch views.** Day cells are `h-9` (36px); month and year
  picker cells are `h-10` (40px), so the panel jumps on day → month → year. The deleted
  `--width-calendar-*` tokens were commented as existing precisely "so month / year / multi-year
  views share the same footprint across view transitions" — they were wired to nothing, so this
  bug was known, half-solved, and abandoned. **[measured]**
- **`checkbox` and `radio` render 20px at BOTH `sm` and `md`** — a dead step, two adjacent size
  values that look identical. The same defect was fixed in `time-picker` (three dead steps) and
  `date-range-picker` (two) during the rhythm pass; these were out of scope because selection
  controls are glyph-scale and sit outside the form-row cohort. **[measured]**
- **`badge-dot` renders 6 / 6 / 8 / 10 / 10 px** against CLAUDE.md's documented dot sub-scale of
  8 / 10 / 12. Both a dead step at xs/sm and a scale violation. **[measured]**
- **`breadcrumbs` wraps at `lg`/`xl`** (36 → 96 / 104px in a ~288px cell). Verified as correct
  `flex-wrap` behaviour, not a height bug — recorded so it is not re-investigated. **[measured]**

## Tier 3c — visual baselines need regenerating, on Linux, not here

The height migration intentionally changed the rendered size of nearly every interactive control.
Eight of the ten chromium visual baselines in `e2e/__screenshots__/` are now stale, with exactly
the expected deltas (`button-variants` 425 → 423px — the 2px the outline button no longer adds;
`tabs` 848 → 844; `button-colors` 799 → 797; `select-closed` 561 → 557).

**Do not run `npm run e2e:update-snapshots` locally.** `.github/workflows/e2e-update-baselines.yml`
says so in its own header: *"Baselines MUST be regenerated on the same OS/browser that the visual
job runs against (Linux + chromium). Regenerating on macOS or another platform produces wrong
baselines that fail again immediately."* Trigger that workflow (`workflow_dispatch`) on this
branch instead; it regenerates and commits them.

A caveat on reading those diffs: `card`, `alert` and `dialog` also differ, at ~3% of pixels, with
**no dimension change** — pure glyph-rendering drift from running on macOS against Linux-authored
baselines. Their layout boxes are identical. Do not mistake that for a regression. The line-height
pinning was separately verified to be genuinely zero-diff: computed line-heights measure exactly
16 / 20 / 24px, and a `text-xs` child inside a `text-sm` parent still resolves to 16px.

---

## Tier 4 — policy calls. Yours, not mine.

These are contradictions in the spec, not defects in the code. Each needs a decision about which
rule wins before anything should change.

1. **`text-base` self-contradiction.** CLAUDE.md permits it "only" for `tw-item` lg titles and
   `tw-stat` lg/xl values — then, eight lines later, its own trigger font-size table assigns
   `text-base` to every `lg`/`xl` control. **27 components outside the two codified exceptions
   use it.** Either the "only" clause is too narrow, or 27 components are in violation. Given
   the trigger table is the one components actually followed, the "only" clause is almost
   certainly the stale half — but that is your call, not mine. **[measured]**
2. **The `table` data-primitive exception has self-expired.** It is written as valid only until
   PR8 reshapes the API into config objects. That shipped; `table` still has 12 inputs. **[verified]**
3. **`tabTriggerVariants` is exported from `core/index.ts:42`**, contradicting "Do not export
   variant configs." Either the rule needs a carve-out for shared cross-component configs, or the
   export should go. **[verified]**
4. **The boolean `true`-default allow-list is 17 entries short** — 30 exist in code. All 17
   unlisted ones *do* carry justification, so the code complies and the spec lags. Decide whether
   the list is exhaustive-normative or illustrative. **[reported]**
5. **Boolean justification comment style is specified two ways** (JSDoc at `:433`, inline `//` at
   `:451`); 12 of 17 use `//`, which Compodoc cannot see. **[reported]**
6. **`Tw*` class prefixes.** `TwDialog`, `TwDialogRef`, `TwDialogConfig`, `TwDateRange` exist. The
   rule as written covers only *components and directives*, so these are not violations by the
   letter — but the intent is ambiguous. **[verified]**

---

# Pass 2 — 2026-09-02 (later the same day)

A second audit pass, run after the one above. Scope was set by the maintainer: **land Tier 3 and
Tier 3b, plus anything new this pass found. Tier 2 (26 HIGH accessibility) stays deferred, and
theme palette / contrast values stay out of scope.** Six parallel agents partitioned by *file
ownership* rather than by concern, so no two could touch the same component.

New reports: `docs/research/api-consistency-2026-09-02.md`,
`docs/research/token-compliance-2026-09-02.md`.

## 2.0 — Register corrections. Read this before re-auditing anything above.

**Tier 3 above is not deduplicated against Tier 1.** Five of its bullets restate work that Tier 1
had already landed in the same pass. Verified against source this pass, with anchors:

| Tier 3 bullet | Actual state | Proof |
|---|---|---|
| `carousel.ts:1324` timer handle never stored (dup of F11) | **already fixed** | field `carousel.ts:803`, cleared in the `DestroyRef` hook at `:897-900` |
| `toast-container.ts:300-302` no destroy hook (dup of F12) | **already fixed** | `DestroyRef.onDestroy` at `toast-container.ts:191-198` |
| `table.selectionChange` / `toast.actionClicked` untested | **already tested** | `table.spec.ts:1044-1101`, `toast.spec.ts:509-546` — real DOM clicks, full payloads |
| `select.searchChange` untested | **already tested** | landed in `e62c129`; two tests dispatching a real `input` event |
| `table`'s spec never dispatches a DOM event | **false** | `clickElement()` helper at `table.spec.ts:234-237`, used at `:435`, `:450`, `:468` |

Also corrected: the boolean allow-list has **13** entries, not 17 (30 exist in code, so 17 are
*unlisted* — which is what Tier 4 #4 meant). And the "138/647 inputs never in a spec" figure is
overstated: it greps by property name and so misses every aliased input (`disabledInput`,
`requiredInput`, `ariaLabel` are all covered via `[disabled]` / `[required]` / `[aria-label]`).

## 2.1 — Fixed in this pass

| # | Finding | Evidence |
|---|---|---|
| P1 | **`tags-input` defeated its own height floor as soon as it held one tag.** Padding was sized against the input's line box, but the tallest resting content is a *chip*. Measured populated: 26/32/38/50/54 against a 24/32/36/44/48 scale — on-grid while empty, then jumping 2px at xs/md and 6px at lg/xl. Only `sm` was ever correct. | **[measured]** — browser, all 5 sizes |
| P2 | Four SUSPECT effects demoted to plain fields (`select`, `combobox`, `date-picker`, `date-range-picker`), per the proven `popover`/`command-palette` shape. | **[verified]** |
| P3 | **Demotion alone would have broken `combobox`:** its close path leaves `activeIndex`/`inputValue`/`renderedRows` untouched, so on reopen no tracked signal changes and the fresh panel would render its empty-results message. Fixed with an `isAttached` signal. | **[verified]** |
| P4 | **All four picker/select lifecycle effects now wrap their body in `untracked()`.** Demoting the fields was not sufficient: `openOverlay()` reads ~25 inputs and writes two signals it reads straight back, so called from the tracked phase it recreated the forbidden shape. | **[verified]** |
| P5 | `checkbox`/`radio` dead step at sm/md → scale 16/20/24/28/32, matching `switch`. | **[verified]** |
| P6 | `badge-dot` 6/6/8/10/10 → 8/10/12/14/16, on CLAUDE.md's dot table (extended to 5 rows). | **[verified]** |
| P7 | `calendar` horizontal view-switch shift 270/286/254 → **270 in every view**, via cell widths, not `min-w` — the day grid is byte-identical, so the range pill cannot move. | **[verified]** |
| P8 | **`file-upload`'s two `dark:` utilities were the only ones in the library, and both were wrong.** `_dark.css` already inverts the ramp, so `bg-primary-50` *is* the dark wash; the `dark:bg-primary-900/20` override resolved to near-white, flashing the drag-over state. Corroborated by the codebase itself: `alert`, `tab-nav` and `segmented-control` already ship specs *asserting* no `dark:` overrides ("theme adaptation is owned by the slot tokens"). The convention was settled in tests; CLAUDE.md and this one component were the laggards. `file-upload` now carries the same guard. | **[measured]** |
| P9 | `e2e/tsconfig.json` — two colliding `playwright-core` installs diagnosed and pinned; `routes.spec.ts` was the only file importing `Page` from the fixtures barrel. `tsc -p e2e` is now **clean**. | **[measured]** |
| P10 | `toast-container.ts:319` — `setPointerCapture` was unguarded while both release sites were wrapped. jsdom implements neither, so the whole swipe path was unreachable from unit tests. | **[verified]** |
| P11 | New **row-alignment instrument** (`/foundations/rhythm`) + gate (`e2e/specs/02-cross-cutting/row-alignment.spec.ts`). Measures controls that *share a row*, over two boxes per item (outer vs. shell). | **[measured]** |
| P12 | **`aria-label` alias drift — the inverse of F10, and worse.** F10 covered the components that alias `aria-label` as an input. The inverse population was never audited: six components host-bound `[attr.aria-label]` *without* aliasing, so a plain `aria-label="Save"` was either removed (`toast`, `carousel` x2) or silently overwritten by a fallback (`flip-card`, `stat-delta`, `avatar-group`). `calendar` did the same to `aria-describedby`; `<tw-icon aria-label>` left the glyph `aria-hidden`. All aliased, all spec-guarded with a *static attribute* host (a `setInput` test would have passed with the bug present). | **[verified]** |
| P13 | The demo was itself a victim: 29 `ariaLabel="..."` usages across carousel, avatar-group, flip-card, icon and **breadcrumbs** never reached the input. `breadcrumbs` was already aliased before this session, so that page had been silently broken all along. All converted to the attribute form. | **[measured]** |

### Spec corrections in `.claude/CLAUDE.md`

- **`text-base`** — the "only for two codified exceptions" clause was the stale half; the trigger
  font-size table is authoritative. 27 components were in nominal violation of a rule they were
  correctly following. Maintainer decision.
- **`dark:` variants are now forbidden in components.** The rule previously *instructed* them,
  which is what produced P8. The library now contains zero, making it greppable as a lint rule.
- **`theme/default.css` does not exist** and never did — keyframes live in `theme/_base.css`.
  Corrected in CLAUDE.md and in three agent/skill definitions that were propagating it into
  generated code.
- Dot-indicator table extended to `lg` (`size-3.5`) and `xl` (`size-4`).

## 2.2 — New findings NOT fixed (need a decision, or belong to deferred Tier 2)

1. **`badge` matches CLAUDE.md's inline-padding table at zero of five sizes** — and that table
   names badges explicitly. Tier-4 shaped: either the table should not claim badges, or badge is
   in wholesale violation.
2. **The `twMerge` blind set is far smaller than assumed.** Measured against the installed
   `tailwind-merge`: exactly **6 classes, 91 sites, 3 conflict groups** (`duration-normal`,
   `duration-fast`, `shadow-table-sticky*`, `animate-progress-bar-indeterminate`). Every colour
   token, `text-2xs`, the fonts and `h-6…h-12` all merge correctly. The deferred `createTV` work
   needs **three `classGroups` lines**, not a 55-call-site refactor — `vertical-rhythm.md` defers
   it as though it were large. Worth reprioritising.
3. **Four components in the `min-h` cohort have no floor at all** — `tree` (xs rows render at
   20px, under the WCAG 2.2 floor; the register measured the symptom, this is the cause), plus
   three more. A pinned-vs-padding sweep cannot see this by construction.
4. **`items-baseline` sub-pixel**: shells agree exactly, but a native `<input>` places its first
   text baseline 0.5px above every flex-container control at xs/sm/md (0 at lg/xl). Tolerated at
   0.75px in the gate with the measurement recorded; forcing agreement means overriding a native
   input's baseline.
5. `dialog`/`sheet` publicly expose a type their own entry point deliberately does not export;
   `SegmentedControlComponent` is a `ControlValueAccessor` with none of the form-control ARIA
   baseline; the overlay family gives seven different answers to "how do I control dismissal".
   Full detail in `docs/research/api-consistency-2026-09-02.md`.
6. **`e2e/tsconfig.json`'s `paths` pin is temporary.** If its target moves (lockfile refresh,
   `@axe-core/playwright` bump), TypeScript does **not** error — it silently falls through and the
   errors return with no signal. The durable fix is `"overrides": { "playwright-core": "1.59.1" }`
   in `package.json`, deliberately not applied here because it needs an install.

## 2.3 — Verification at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass |
| `npm run test:ci` | **3049 passed**, 4 skipped (71 files) + **4 demo** — library run 4x, demo re-run after the 29 demo edits |
| `npm run lint` | **0 errors**, 70 warnings — the same 70 as before this pass |
| `npm run e2e:fast` | **880 passed**, 0 failed, 58 skipped (was 869; +11 new `@rowalign` tests) |
| `npx playwright test --grep @rhythm` | **17 passed** (6 vertical-rhythm + 11 row-alignment) |
| `npx tsc -p e2e/tsconfig.json --noEmit` | **clean** — was 4 errors |
| `npm run verify:package` | pass — 59 entry points, theme resolves from a clean consumer install |
| `npm run verify:mcp-index` | pass (the same 7 pre-existing warnings) |
| `npm run e2e:visual` | **still stale by design** — see Tier 3c. Regenerate on Linux via `workflow_dispatch`. |

### Two traps this pass hit, recorded so the next one does not

1. **A hidden browser tab suspends `requestAnimationFrame` and `ResizeObserver`.** The rhythm
   instrument appeared to report stale heights after a size change — it was reported as a bug
   before `document.visibilityState === 'hidden'` explained it. Driving the page through CDP does
   not make it visible; a screenshot forces one frame, and the readings need two. Measure with
   Playwright, not a background tab.
2. **`menu.spec.ts > should type-ahead to the first item…` is a pre-existing flake.** It timed
   out at ~5.2s in one of four full runs and passed in the other three. `projects/ngx-tw/menu/`
   is untouched by this pass; the test is real-timer based and drifts over the 5s limit under
   parallel load. Same shape as the two `reopen` tests fixed in this pass (see `pumpUntil` in
   `select.spec.ts` / `combobox.spec.ts`) — worth the same treatment.
3. **The dev server does not pick up a `dist/ngx-tw` rebuild on its own.** It watches demo source.
   After `build:lib`, touch a demo file (or restart it) before measuring, or you will verify a fix
   against the build that predates it — which happened here, and made a landed fix look inert.

---

# Pass 3 — 2026-09-02, accessibility

Scope: resolve Tier 2 (the 26 HIGH accessibility findings), the remaining Tier 4 policy
contradictions, and the open items from Pass 2 §2.2. Maintainer decisions taken up front:
contrast **in scope**; toast and tooltip behavioural changes **both approved**; the `table`
input-cap exception **loses its sunset clause**; all remaining Tier 4 spec items **resolved**.

## 3.0 — The coverage gaps came first, because nothing else was measurable without them

The register said to enable `wcag22aa` and triage in the same change. That was right, and
understated: three of the four coverage gaps had to be fixed before a single component finding
could be trusted.

**1. `A11Y_BACKLOG` excluded 12 components WHOLESALE.** Those twelve held most of Tier 2. A
component-wide skip hides every rule the component does *not* violate as well as the one it does,
so a backlogged component could regress on anything and the sweep stayed green. It is now a map
keyed `component:scheme` → rule ids, seeded from a measured sweep. Fixing a component means
deleting its rule ids one at a time, and a rule that stops firing is reported as a **stale
allowance** and must be deleted — so the list cannot rot into permanent permission.

**2. axe was scanning mid-animation, and 43 of its 49 contrast failures were phantoms.**
`runAxe` ran the instant the `<h1>` appeared, while the demo shell was still fading its chrome in,
so axe sampled intermediate blended colours. The same element reported a different colour on every
page — which is what gave it away. With a 1200ms settle:

| | before | after |
|---|---|---|
| components reporting `color-contrast` | **49 of 52** | **6** |
| total (component, rule) pairs | — | 22 |

The A11Y_BACKLOG comment's claim that "several semantic tokens in `_dark.css` don't yet satisfy AA"
was substantially this artefact. **[measured]**

**3. `wcag22aa` is now in `AXE_TAGS`.** It surfaced exactly one new rule the suite could not
previously see: `target-size` on `carousel`.

**4. axe never scanned an interactive state.** New sweep,
`e2e/specs/03-accessibility/interactive-states.spec.ts` (`@openstate`): opens the overlay on nine
components and scans it. This surface had **never been scanned in the library's history**, and it
immediately found five real defects that no rest-state scan can reach:

| Component | Rule | What it means |
|---|---|---|
| `select` | `aria-prohibited-attr`, `button-name` | an ARIA attribute the role forbids, and a button with no discernible text |
| `dialog` | `scrollable-region-focusable` | a mouse user can scroll the dialog body, a keyboard user cannot |
| `popover` | `aria-dialog-name` | renders `role="dialog"` with no accessible name |
| `menu`, `combobox`, `select` | `region` | overlay content is portalled outside any landmark |

The opener is role-based rather than per-component, and three details were needed to make it
honest: scope the trigger search to `main` (an unscoped "first trigger" picks the demo shell's own
theme picker on every route), dismiss between strategies (a leftover transparent backdrop
intercepts the next click and makes a working component read as "has no trigger"), and wait on the
pane's first CHILD rather than the pane (`sheet` and `command-palette` use a zero-size positioning
box, so the pane itself is never "visible" and two correct components read as broken).

**5. The cross-theme contrast sweep is no longer `test.fixme`'d.** High-contrast had **zero**
verification. With the settle applied it passes in all three themes, with one documented
selector exclusion — the form-field hint, which is the single genuinely failing surface.

## 3.1 — Contrast: measured, and narrower than the register implied

The register's numbers reproduce exactly: `--color-border` **1.47:1** and `--color-border-strong`
**2.60:1** in light, against SC 1.4.11's 3:1. Both raised (now 4.79:1 and 7.56:1 light, 4.16:1 and
8.59:1 dark), in both hand-duplicated dark activation blocks.

Two corrections to the register, both measured:

- **`--color-fg-muted` and `--color-fg-subtle` PASS everywhere** — 7.56:1 and 4.84:1 against
  surface in light. The claim that muted text was failing was the animation artefact above.
- **`--color-border-muted` is deliberately NOT raised.** It is the decorative divider, and
  SC 1.4.11 exempts boundaries not needed to identify a component or its state.

Worth recording for the next audit: **axe cannot see any of this.** Its `color-contrast` rule
tests text only, so all three border tokens were invisible to the sweep and had to be measured by
hand against a canvas-rasterised `oklch()` value. A first attempt that parsed the `oklch()` string
as RGB produced confident, entirely wrong ratios.

## 3.2 — Tier 4, resolved

| # | Resolution |
|---|---|
| 1 | `text-base` — settled in Pass 2; the trigger table is authoritative. |
| 2 | `table`'s data-primitive exception **loses its sunset clause** and becomes permanent. Its 12 inputs are independently set and independently read; collapsing them into config objects buys nothing and breaks every consumer. |
| 3 | **Carve-out added** for a `tv()` config shared by two or more components. `tabTriggerVariants` is the only one, and it is exported so a sibling entry point can import it — not as consumer API. |
| 4 | The boolean `true`-default list is now **illustrative, not exhaustive**. The rule is the JSDoc requirement; ~30 such inputs exist and all carry justification. An absent entry is not a violation. |
| 5 | Justification must live in the input's **JSDoc block**, not a bare `//` — Compodoc cannot read `//`, so 12 of 17 justifications never reached the demo's API table. |
| 6 | The `Tw*` prefix rule now states its scope **positively**, as a table: never on a component/directive class; expected on shared types; permitted on services, refs and configs; `TW_` on injection tokens. A `Tw`-prefixed service is correct, not tolerated. |

## 3.3 — `twMerge` blindness: the audit's claim verified, with a correction

Pass 2 recorded "three `classGroups` lines, not a 55-call-site refactor". Tested against the
installed `tailwind-variants@0.3.1` and `tailwind-merge`:

- The config is genuinely tiny, but it must **extend the existing `duration` group**, not declare
  a new one. A first attempt that invented a `transition-duration` group returned both classes and
  looked like proof the fix was impossible.
- `createTV` **does** apply it globally: `createTV({ twMergeConfig: { extend: { classGroups: {
  duration: ['duration-normal'] } } } })` collapses `duration-normal duration-500` to
  `duration-500`.
- **But the plumbing is still ~55 files**, because every component imports `tv` from
  `tailwind-variants` directly. The config is 3 lines; threading a shared factory is not. The
  audit's "worth reprioritising" is half right: cheap to specify, not cheap to land.

## 3.4 — Component fixes

Partitioned by component ownership, not by success criterion — the Tier 2 tables slice by SC, so
`select` appears in four of them and `calendar` in three. An SC-based split would have deadlocked
on the same files.

### select / combobox

- **The axe failures were the F10 footgun again, not a library defect.** `aria-prohibited-attr`
  and `button-name` fired on 15 nodes from ONE cause: `[attr.aria-label]` on `<tw-select>`, which
  aliases `aria-label` as an *input*. The attribute binding never feeds the input, the inner
  `role="combobox"` button resolves its name to null, and because the button then has no name,
  axe's `ariaProhibitedAttrEvaluate` takes the branch that returns a **violation** rather than
  "incomplete". Pages using the static `aria-label="…"` form never fired. Fixed demo-side.
  This is now the third distinct way this one footgun has produced a bug.
- Clear control is keyboard reachable in both components, and **returns focus to the trigger**
  after clearing — clearing unmounts the control the user is standing on, so focus would otherwise
  fall to `<body>` (SC 2.4.3). The refocus carries an explicit `isDisabled()` guard because
  `[disabled]` makes `.focus()` a silent no-op.
- `variant="naked"` standalone now has a focus ring. It could **not** be fixed by overriding:
  `outline-none` and `outline-2` are different tailwind-merge conflict groups, so both survive and
  `outline-style: none` wins. Needed a real `fieldOwnsFocusRing` axis.
- `aria-activedescendant` moved to whichever element holds DOM focus — the trigger when closed,
  the overlay search input when searchable and open.
- Both clears raised to 24px. Combobox's `xs: { clearButton: 'size-4' }` had to be **deleted**
  rather than superseded, because the size variant beats the slot base.
- **Known deviation, recorded rather than hidden:** select's clear is a `tabindex`'d span inside a
  `<button>`, which the HTML content model disallows. Hoisting it to a sibling button is the
  correct fix and remains open; axe's `nested-interactive` does not catch it, because that rule
  requires `childrenPresentational` on the role and `combobox` has no such flag.

### timeline / paginator / toast

- **timeline** — one structural correction cleared all three rules: `aria-orientation` removed
  from a `role="list"` host that does not support it, `role="list"` moved off the host (which also
  owned the two scroll chevrons) onto the viewport that actually contains the `listitem`s, and the
  scroll viewport made keyboard-reachable with a name and a focus ring.
- **paginator** — `landmark-unique` was demo-side: ~19 paginators all rendering
  `role="navigation"` with the same default name. Each instance now gets a distinct name, and
  `customAriaLabel`'s JSDoc tells consumers a page with more than one paginator must name each.
- **paginator `color-contrast` is deliberately RETAINED in the backlog.** The surviving node is
  the page-info line of a *deliberately disabled* paginator, which carries the
  `opacity-50 pointer-events-none` treatment CLAUDE.md prescribes. WCAG 1.4.3 exempts text in an
  inactive component; axe cannot model that exception. Lightening the disabled treatment to satisfy
  a rule that does not apply would make disabled and enabled paginators look alike.
- **toast: the register's SC 2.2.1 entry was stale.** Pause-on-hover AND pause-on-focus were
  already implemented before this session. The real hole was narrower and worse: a toast with
  `dismissible: false` and no action had **zero focusable descendants**, so a keyboard-only user
  could never stop its clock. Every toast is now one extra tab stop — that is the consumer-visible
  delta, not a timer change. No focus trap (a toast is not modal), no autofocus (it would yank the
  caret out of the user's task).
- `TwTimelineScrollLabels.scrollRegion` was added as a **required** member, which breaks any
  consumer annotating a complete literal. Made optional, and the resolved type is now
  `Required<>` with explicit-`undefined` keys filtered before the merge — a plain spread would let
  `{ scrollRegion: undefined }` overwrite the default and silently strip the name.

### table / sort

- **One host binding caused every `aria-allowed-attr` node in both components.**
  `SortHeaderComponent` emitted `[attr.aria-sort]` on *every* host, but `aria-sort` is legal only
  on `columnheader`/`rowheader` — so a `<span>` or `<button>` host was a violation, and inside
  `tw-table` it was also redundant, because the generated `<th>` already owned the attribute.
  Now gated on the host actually being a header cell. Measured before the change: 30+ nodes on
  the sort page, 8 on the table page, and **zero** on a `<th>` host — the valid path was already
  correct and is untouched.
- Gating it left sort state with **no valid hook at all** on span/button hosts: the direction was
  readable only from the arrow's rotation utility class. Added `data-sort-direction` on every host
  shape, mirroring `aria-sort`'s vocabulary. A `data-*` attribute is valid on any element and
  carries no ARIA semantics, so it states the same thing without lying to assistive tech — and it
  gives consumers a state hook to style on. Documented in the sort API page.
- Clickable rows are keyboard-operable behind an explicit `clickableRows` opt-in, because Angular
  exposes no way to ask whether `(rowClicked)` has a subscriber, and putting every row of a static
  table into the tab order would be worse than the bug. Deliberately **no `role` override** on the
  `<tr>` — retagging a `row` as `button` trades one violation for `aria-required-children`.

### tabs / segmented-control / stepper

- **`nested-interactive` on tabs has no clean fix, and the alternatives were measured, not
  assumed.** Hoisting the close button to a sibling inside the tablist trades it for
  `aria-required-children`; `aria-hidden` + `tabindex="-1"` is explicitly rejected by axe. The
  close affordance is now a pointer-only `<span aria-hidden="true">`, with **Delete on the focused
  tab** as the keyboard path, advertised via `aria-keyshortcuts="Delete"`.
  **This is a UX change, and the honest framing is that it is a trade, not a pure win:** the close
  control was focusable before and is not now. SC 2.1.1 is still satisfied because the function
  remains keyboard-reachable, and Delete is the APG-sanctioned gesture — but a sighted keyboard
  user who expects to Tab to a close button will not find one.
- **stepper's `aria-required-children` was a role error, not a missing child.** The vertical
  stepper renders its panel inside the header strip, so a `role="tablist"` could never be valid
  there. Horizontal keeps the tab pattern; vertical is now a disclosure — headers are
  `role="button"` with `aria-expanded`, and the inline panel is a labelled `role="group"`.
- **stepper's dark-only `color-contrast` was the `dark:` trap again, demo-side.** A custom step
  label carried `text-primary-700 dark:text-primary-300`; because the theme inverts the ramp, the
  override re-inverted it to blue-700 on gray-900 = **2.59:1**. This is the third component-level
  instance of the rule CLAUDE.md now forbids outright.

### Semver: two required interface members, both caught and softened

Two agents independently added a **required** member to an exported interface —
`TwTimelineScrollLabels.scrollRegion` and `TwTableLabels.selectionColumnLabel`. Each would have
been a compile break for any consumer annotating a complete literal, in exchange for a label that
already has a default. Both made optional, and both resolved types are now `Required<>` with
explicitly-`undefined` keys filtered before the merge — a plain spread lets
`{ key: undefined }` overwrite the default with undefined, which reaches the template as a null
label and silently reinstates the very defect the label exists to prevent.

---

# Pass 4 — 2026-09-03, Angular v22 idiom · consistency · public API

Scope: a full-library audit through the `angular-developer` v22 lens, plus cross-component
consistency, public API surface, and defect/gap hunting. Accessibility was explicitly **out of
scope** — pass 3 closed it and e2e was green at 916 on entry.

Method: five parallel read-only audit agents (v22 idiom/reactivity/runtime-safety, public
API/packaging/semver, cross-component consistency, forms+CVA including **signal forms**, test
coverage), then four fix agents partitioned **by component ownership** — pass 3's own recorded
lesson, since a criterion-based split deadlocks on `select` and `calendar`. Every finding was
required to carry an explicit `Register:` line (`not in register` / `extends X` / `contradicts X`);
findings without one were discarded, which is what kept a fourth pass from re-litigating the first
three.

## The pass's real lesson: three confident claims came from modelling instead of measuring

This is the through-line and it is worth more than any individual fix.

1. **A `test.fixme` comment sent an audit agent at the wrong file.** COVERAGE ranked
   `calendar`'s `nearest-edge` branch its top BLOCKER: a documented state-machine path with zero
   unit coverage whose only test was skipped as *"Pre-existing drift: the nearest-edge range-click
   behavior moved."* **There was no regression.** The comment was wrong on both counts —
   `rangeClickBehavior` never moved into `rangeBehavior` (they are different inputs,
   `calendar.ts:471` and `:479`), and the demo already wires it (`calendar-examples.component.ts:175`).
   The actual cause: `e2e/pages/calendar.page.ts:58` searched for the heading
   `'Range click behavior (§21.2)'` while the demo renders `'Range click behavior'`, and
   `section()` anchors its regex — so the locator matched nothing and every click timed out. It
   was the only one of eight section names in that file not matching its heading. One token
   deleted; **test passes in 16.6s.** **[measured]**
2. **A synthetic replica produced a false CVA rule that nearly landed in CLAUDE.md.** FORMS
   measured, on replicas, that the silent-validator-drop trap "requires a `value`/`checked`
   `model()`" and that `calendar` was therefore exempt on the reactive branch. FIX-2 ran the same
   experiment on the **real** component and got the opposite result. Primary source settles it:
   `_debug_node-chunk.mjs:8513` is `hasInput(def,'value') && hasOutput(def,'valueChange')` — a
   structural lookup, not a `model()` test. `calendar.ts:369` (`input({alias:'value'})`) plus
   `:533` (`output()` named `valueChange`) satisfies it with no `model()` in the file. Removing
   its provider makes the reactive guard **fail**, with no `NG01914`. The wrong rule had already
   been written into CLAUDE.md and was corrected in place. **[measured]**
3. **`stripInternal` looked like a two-line win and is blocked by tooling.** See below.

Corollary for pass 5: **test the component, not a model of it**, and treat every `fixme` comment
as an unverified hypothesis. The two remaining calendar fixmes were re-checked under that lens and
are **correctly** diagnosed (verified: no `[constraints]` binding and no custom
`CALENDAR_SELECTION_STRATEGY` provider exists anywhere in the demo).

## Tier 1 — fixed and verified in this pass

| # | Finding | Evidence |
|---|---|---|
| P4-1 | **Five packages the shipped bundles import were declared nowhere.** `@angular/forms` (16 entry-point bundles), `rxjs` (19), `tailwind-merge` (2, imported directly by `tabs.ts`/`tab-nav.ts`), `luxon`, `lucide`. Under npm's hoisted `node_modules` an undeclared import still resolves, so this was invisible locally; under pnpm or Yarn PnP a package resolves only what it declares and **16 entry points fail to load even when the consumer has `@angular/forms` installed**. `verify:package` never caught it because it compiles CSS and never imports a module. | **[measured]** `grep -l "from '<pkg>'" dist/ngx-tw/fesm2022/*.mjs`; fixed additively, `luxon`/`lucide` optional via `peerDependenciesMeta` (confirmed to survive ng-packagr) |
| P4-2 | **`tree` silently dropped `expandedKeys` at mount** — every `tw-tree` seeded with expanded keys rendered fully collapsed, permanently, across every demo example. Instrumented, not guessed: the sync effect *does* call `tree.expand(node)`, but `CdkTree._expansionModel` does not exist yet, so CDK's `else if (this._expansionModel)` falls through silently and the effect never re-runs. | **[measured]** fixed with an idempotent `applyExpansion()` replayed from `afterNextRender()` |
| P4-3 | **`file-upload` focus retarget was broken in every real browser.** The restore ran in `queueMicrotask`, which under zoneless fires *before* re-render, so it queried the pre-removal DOM: removing a middle file focused the button being destroyed (focus → `<body>`), and removing the last file never reached the "focus the trigger" branch. It survived unit testing because the spec called `detectChanges()` between click and assertion — right assertion, wrong order, **and the order was the bug**. | **[measured]** fixed with `afterNextRender(…, { injector })` |
| P4-4 | **`[twError match="…"]` was permanently hidden on six controls.** `checkbox`, `select`, `combobox`, `date-picker`, `date-range-picker`, `time-picker` never implemented the optional `errors` signal that `form-field.ts` reads to build its key set, so a `match`-targeted message could never render — including `calendarMinDate`, the very code the Shape-B `NG_VALIDATORS` apparatus exists to deliver. The JSDoc justified the omission as "controls without a backing `NgControl` may omit it"; **all six have one** (F4 shape). | **[measured]** implemented on all six, proven non-vacuous by deleting an override and watching the new test fail |
| P4-5 | **`required` was not derived from the bound control** on `switch`, `radio-group`, `slider`, `select`, `combobox`. With `Validators.required` on a reactive control, `required` read `false`, so `select`/`combobox` never rendered the form-field `*` marker and the others never exposed `aria-required`. Asymmetric and therefore easy to miss: under signal forms `cvaControlCreate` *writes* the `required` input, so it already read `true` there. | **[measured]** |
| P4-6 | **`stat`'s `aria-label` froze.** An `afterRenderEffect` scraped `textContent` while tracking only a static `viewChild`; since `afterRenderEffect` re-runs only when a *tracked producer* changes, it ran once — bind `{{ growth() }}%`, change 12 → 34, and the delta keeps announcing 12. Its comment claimed "afterRenderEffect runs after each render", verified false against Angular's source. Every existing test used static text. | **[verified]** fixed with the `MutationObserver` pattern `flip-card.ts:260` already uses |
| P4-7 | **`command-palette` broke SSR.** A bare `document.activeElement` was the first statement of `openPalette()`, reachable from a constructor `effect()`; `[open]="true"` at first render fails the whole SSR response. This was the **only** genuinely unsafe SSR site in the library — the 11-file `window.`/`document.` lead reduced to 9 code sites, 8 of them event-handler-only. | **[verified]** guarded |
| P4-8 | **A consumer passing `{ key: undefined }` crashed three components.** `carousel`, `paginator` and `transfer` merged label objects with a plain spread, so an explicitly-`undefined` key overwrote the default and reached an unguarded `template.replace(...)` → `TypeError`. `provideTheme({ storageKey: undefined })` wrote a literal `"undefined"` localStorage key. | **[measured]** fixed with the `Required<>` + undefined-filter pattern pass 3 established |
| P4-9 | **`timeline`'s scroll chevrons died on an orientation flip** — a one-shot `afterNextRender` behind an `orientation !== 'horizontal'` early return. `carousel.ts:693` documents having already fixed this exact class. | **[verified]** |
| P4-10 | **`segmented-control` had no error-state integration at all** — no `NgControl`, no matcher, no `aria-invalid`/`aria-required` in any strategy. Migrated to the constructor `valueAccessor` pattern (mandatory: it has a `value` model). | **[measured]** |
| P4-11 | **`slider` did not compile under `strictTemplates` with signal forms.** `min`/`max` inferred `number` while signal forms binds `number \| undefined` → TS2322. The library worked around it with `$any()` **in the copyable demo snippet**, i.e. shipping the workaround to consumers. | **[measured]** widened via the alias idiom; `$any()` removed from spec and demo |
| P4-12 | **`onTouched` fired from the change handler** on `checkbox`, `switch`, `radio`, `segmented-control`, so `touched` flipped without a blur and errors appeared early. `slider`/`tags-input`/`input` were already correct. Maintainer-approved behavioural change. Four `forms-three-strategies` e2e specs asserted the old timing and now blur explicitly before asserting — **their failure was the fix working**, and it was predicted in advance rather than discovered. | **[measured]** |
| P4-13 | **Six `@internal` symbols were re-exported from `core/index.ts`** — an annotation contradicting the barrel. Now module-private; nothing outside their own file ever used them. | **[measured]** |
| P4-14 | **Icon/dot scales corrected** on `menu` (was 4/4/4/5/5 → 3/4/5/6/**6**), `avatar.status` (8/8/10/12/12 → 8/10/12/14/16), `carousel` dots (8/10/12/12/12 → 8/10/12/14/16), `transfer` glyphs (4/4/5/5/5 → 3/4/5/6/6). | **[measured]** in-browser + unit specs with negative controls |

**P4-12 has a demo-visible consequence, now annotated.** The `checkbox`, `switch`, `radio` and
`segmented-control` demo pages all print a live `touched = …` readout directly under the control.
Before this pass, clicking flipped it to `true` immediately; now it stays `false` until focus
leaves — correct, and the same as a native input, but it reads as a bug to someone clicking
through the page. The four e2e specs pass because they blur explicitly; a human does not. Each
readout now carries a one-line note saying `touched` flips on blur. Worth recording as a pattern:
**a spec fixed by adding the missing gesture can hide a demo that never performs it.**

**Semver discipline held this time.** Pass 3 shipped two required-member breaks from two
independent agents; this pass put the rule verbatim in every fix prompt and **zero** occurred.
`TwCarouselLabels`, `TwPaginatorLabels`, `TwThemeConfig` and `TwTimelineScrollLabels` were
additionally softened to optional members with their exported defaults retyped `Required<>` — the
structural fix, not the per-member one.

## `stripInternal` — approved, attempted, blocked by tooling. Do not retry blind.

991 members annotated `@internal` ship as callable public API: `paginator.goTo(3, 'click')` and
`table.resolvedSticky()` compile in consumer code today. The maintainer approved enabling
`stripInternal`. It does not work, and the failure mode is nasty enough to record in full:

- With `stripInternal: true`, ng-packagr's `.d.ts` **rollup silently drops three genuinely public
  exports** from `core` — `tabTriggerVariants`, `getActiveTriggerClasses`,
  `getInactiveTriggerClasses`. The build then fails in `tabs` with TS2305/TS2724 pointing at the
  *importer*, never at the cause.
- **TypeScript is not at fault.** `tsc --stripInternal --emitDeclarationOnly` over
  `core/tab-trigger-variants.ts` emits all three correctly **[measured]**. The loss is in
  ng-packagr's flattening step.
- Making the six `@internal` lookup tables module-private (P4-13) is correct on its own merits and
  was kept, but does **not** fix this.
- A first failed attempt also produced a phantom `TS4112` in `transfer.ts:1157` claiming
  `TransferComponent` "does not extend another class" when `:539` plainly extends
  `FormFieldControl`. That was a **cascade**: `core` failed, so `@cdevhub/ngx-tw/core` became
  unresolvable and the base class unknown. Textbook instance of the trap Tier 3 already documents.

The flag is reverted with this diagnosis inline in `tsconfig.lib.prod.json`. Re-enabling needs a
different mechanism (api-extractor, or keeping internals out of barrels by convention).

## Corrections to earlier passes and to this pass's own agents

- **Register Tier 3's "138/647 inputs (21%) never appear in any spec" re-derived: 140/672 (20.8%)
  — flat.** No pass moved it. Pass 2's claim that the figure was "overstated because it misses
  aliased inputs" is **wrong**: re-derived with alias resolution, the number does not move.
  Composition shifted usefully though (`combobox` 17→3, `select` 16→6); new worst offender is
  `date-picker` at 19/38. **[measured]**
- **Tier 3's "three public outputs referenced by no test" is now zero of 69.** Fixed. **[measured]**
- **CONSISTENCY over-clustered `table`.** Its `default | striped | bordered` is a grid-style axis,
  not a surface treatment — `striped` has no analogue in the surface vocabulary. Renaming it to
  `outline` would have been wrong. This narrowed the approved variant unification from "13
  components" to **11 renames across 6**. **[verified]**
- **COVERAGE's F-01 is half wrong** — `tree.spec.ts:453` *does* dispatch the event; what is
  missing is identity discrimination (it activates row 0 and asserts id 1). A
  `toggleSelection(dataArray()[0])` mutation left all 33 pre-existing tests green. **[measured]**
- **COVERAGE's F-04 premise is falsified** — `onSwipeEnd` is *not* jsdom-unreachable. The real
  blocker is `getBoundingClientRect()` returning zero, which collapses the swipe threshold to 0,
  making an unstubbed swipe test **vacuous rather than impossible**. **[measured]**
- **Pass 3's hand-off lint row is stale**: it records "0 errors, 70 warnings". Current tree is
  **75**, and the +5 are pass 3's own axe-settle `waitForTimeout` calls. All 75 are in `e2e/`;
  `projects/ngx-tw/` and `projects/demo/` are lint-clean. **[measured]**
- **`stepper`'s `@ViewChildren` is correct and forced** — `CdkStepper` types `_stepHeader` as
  `QueryList<CdkStepHeader>` and calls `.changes.pipe(...)` (`stepper.mjs:449`); `viewChildren()`
  would not compile. **Do not re-investigate.** The `EventEmitter` in
  `core/overlay/overlay-container-coordinator.ts:88` is *not* forced, but `output()` is the wrong
  target — it is an RxJS stream consumed via `.pipe()`, so `Subject<T>` is the correct fix.
  Cosmetic; deferred.

## Verified-clean, stated positively so pass 5 does not re-sweep

- **Zoneless: clean.** Mechanical scan of all 259 non-spec files found zero plain (non-signal)
  fields read from a template or host binding, and zero reliance on `setTimeout`/listeners to
  schedule CD. Both `NgZone` uses are `runOutsideAngular` (zoneless-neutral). **[verified]**
- **SSR: one defect, now fixed** (P4-7). The 11-file lead collapsed to 9 real code sites — three
  of the "hits" were prose in comments.
- **Signal graph: clean.** The four Tier-3 SUSPECT effects are confirmed still fixed after pass 3
  (line numbers moved). A stronger tracked-region-only cycle scan finds only the codified
  `paginator` exception. All four `linkedSignal` uses correct; no `untracked` cargo-culting; no
  subscription leaks.
- **v22 API modernity: clean.** Zero `@Input`/`@Output`/`@HostBinding`/`@HostListener`, zero
  legacy control flow, zero non-self-closing tags.
- **`tv()` conformance: 63/63** set both `twMerge` and `defaultVariants`; exactly one exported
  config (the codified `tabTriggerVariants` carve-out).
- **Design tokens: pass-1 claims still hold** on the current tree after three passes of edits —
  zero raw palette colours, zero `transition-all`, zero forbidden shadows, zero forbidden radii
  (23 grep hits all read and confirmed as identifiers/prose), zero `dark:` variants in code.
- **Entry points: 56/56.** 56 directories with `ng-package.json`, 56 `export *` lines. A naive
  grep reports 57 because the file header's example import matches; `verify:package`'s "59" counts
  the 3 nested entry points (`calendar/luxon`, `calendar/testing`, `icon/lucide`).
- **CVA registration: all 10 Shape-A controls assign in the constructor; all 4 Shape-B provide
  statically.** No control is on the silent-drop path.

## Open — carried to pass 5

**Approved but not yet landed** (both span files that were owned by concurrent fix agents, so they
were deliberately queued rather than raced):

1. **Variant vocabulary unification** — 11 renames across 6 components, scoped in full at
   `docs/research/2026-09-audit/wave2-variant-scope.md`: `outlined`→`outline` (card, flip-card, code-block, stat),
   `bordered`→`outline` (accordion, collapsible), `filled`→`solid` (code-block, collapsible,
   segmented-control, stat), `plain`→`ghost` (stat). Each needs a deprecated alias.
   **Explicitly excluded:** `table` (different axis), `segmented-control`'s `surface` (a genuine
   third state), and the `default|naked` field-chrome axis on the three pickers.
2. **`TW_` prefix on 12 of 24 injection tokens**, six of which (`DATE_ADAPTER`, `DATE_FORMATS`,
   `THEME_CONFIG`, `SHEET_DATA`, `POPOVER_DATA`, `AVATAR_GROUP_SIZE`) import cleanly from the root
   barrel and can collide in consumer code. Needs deprecated aliases.

**Not yet decided:**

- **`stripInternal`**: decided (approved) and attempted, **blocked by ng-packagr** — see the dedicated section above for the full diagnosis and the failure mode. What remains open is not the decision but the *mechanism*: the 991-member leak is real, and closing it needs api-extractor or a barrel convention rather than the compiler flag.
- **`NumberInputDirective.setDisabledState`** is worse than audited: no `[disabled]`/`aria-disabled`
  host binding *and* `onInput()` (`number-input.ts:224-231`) is not gated on `disabled()`, so a
  disabled standalone control still writes every keystroke into the form model. Masked today
  because every shipped usage pairs it with `twInput`. **[measured]**
- **`select`'s clear is a `tabindex`'d span inside a `<button>`** — HTML content model violation,
  carried from pass 3, still open. axe cannot see it.
- **17 of 30 `true`-default justifications are still bare `//` comments**, including every one of
  the seven CLAUDE.md holds up as canonical. Pass 3 decided the JSDoc rule; the code was never
  migrated, so Compodoc still shows blank cells.
- **`verify:mcp-index`'s 7th warning is a wrong diagnosis** — it reports the theme demo page as
  "missing or renamed"; the directory exists with five files. Real cause: it inlines code samples
  instead of using `{section}Snippet` consts, so the MCP index serves **zero** snippets for the
  entire runtime theming API.
- **Five unexported types in public signatures**: `ThumbId` (slider), `ResolvedItem`/`ResolvedGroup`
  (command-palette), `DialogContainer`/`SheetContainer` — the last two handed out by documented
  getters. Same class as F1.
- **38 `test.fixme` in e2e used as a bug tracker with no expiry.** The repo already built the right
  pattern (`A11Y_BACKLOG` fails on a stale entry) and never generalised it. Given that one of these
  fixmes was actively misleading (above), this is worth more than its tier suggests.
- **Demo prose defect**: the toast page claims swipe is disabled under `prefers-reduced-motion`;
  the library has no such gate. Needs a product decision — "fixing" the prose by adding the gate
  would silently kill six e2e tests.
- **Test harnesses: 1 of 56.** Two `date-range-picker` skips ask for one in writing.

## Traps that cost real time this pass — read before the next one

- **A dev server left in a compile-error state silently poisons local e2e.**
  `playwright.config.ts:40` sets `reuseExistingServer: !CI`, so every click fails with
  `<vite-error-overlay> intercepts pointer events` — which reads as a component defect, not an
  environment one. `npx ng build demo` was clean throughout. Fix: `lsof -ti tcp:4600 | xargs kill -9`.
- **A sibling's non-compiling edit blocks every other agent's unit run**, because
  `ng test <one component>` type-checks the whole library program. Two agents lost cycles to this.
  When Playwright reports only `Timed out waiting for config.webServer`, the cause is usually a
  demo file that does not compile — the message never names it.
- **`ng test demo` does not type-check demo pages.** Proven by injecting a deliberate type error;
  the suite still passed. A demo-only type regression rides on `ng build demo` alone.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass — 56 entry points, 565 symbols |
| `npm run test:ci` | **3225 passed**, 4 skipped (72 files) + 4 demo — up from 3135 |
| `npm run lint` | **0 errors, 75 warnings** (all in `e2e/`; library and demo clean) |
| `npm run verify:package` | pass — theme resolves from a clean consumer install |
| Browser (`/components/*`) | menu rows uniform at 36px with and without a glyph; avatar/transfer glyphs on the new scale |
| `npm run e2e:fast` | **932 passed**, 54 skipped, 1 flake (see below) |

**Two flaky e2e tests, both load-dependent, both pass in isolation — new finding.** Two
consecutive full runs each failed exactly one test, and a *different* one each time:
`00-smoke/routes.spec.ts` (`/components/sort/api`, `<h1>` not found) and
`01-components/date-picker.spec.ts:205` (overlay still present after close, expected 0 got 1).
Re-run alone: sort/api 1 passed in 1.9s; date-picker 11 passed in 7.4s. Neither is a regression
from this pass — both are timing assertions that lose their race under full-suite contention, the
date-picker one against an overlay close animation. Worth fixing before they train someone to
re-run a red suite until it goes green, which is how a real failure gets waved through. **[measured]**

**Visual baselines: NOT regenerated, by design.** Per Tier 3c they must be produced on Linux via
`workflow_dispatch`. FIX-3's analysis says none of the 20 chromium baselines covers a menu glyph,
avatar status dot or carousel dot, so no shift is expected — but that is an expectation, not a
measurement, and the Linux job is the only thing that can confirm it.

---

# Pass 5 — 2026-09-03, SRP · CDK adoption · theme system · public API · defects

Scope set by the maintainer: a full-library audit through the `angular-developer` v22 lens, plus
consistency, CSS/token and theme system, SRP, CDK adoption, public API, and defect/gap hunting.

Method: five parallel read-only audit agents (SRP/decomposition, CDK adoption **gaps**, theme
system, public API/consistency, defects/coverage), then six fix agents partitioned **by file
ownership**, then a second wave of three for findings that arrived after the first wave launched.
Pass 4's `Register:` discipline was reused verbatim — every finding had to declare
`not in register` / `extends X` / `contradicts X`, and findings without one were discarded.
Two lenses had **never been audited before**: SRP, and "what CDK are we *missing*" as opposed to
"is our CDK usage correct".

Full reports: `docs/research/2026-09-audit/pass5-{srp,cdk,theme,api,gaps}.md`, with re-runnable measurement scripts
beside them (`bool.mjs`, `fixme.mjs`, `fixme3.mjs`, `inputs2.mjs`) — the first pass to publish its
scripts, which is what finally settled the untested-inputs dispute below.

## The pass's real lesson: the specification drifts faster than the source

Three passes running, a *rule's stated rationale* has been the defect rather than the code it
governs. This pass found three more, all in `.claude/CLAUDE.md`:

1. **"Compodoc parses these to generate API tables"** — justifying the JSDoc rule in three places.
   **Compodoc is not a dependency of this repo**: not in `package.json`, no config, no script.
   `docs/mcp-server-architecture.md:60-62` already said so in writing, and the demo's API tables
   are hand-authored HTML. The consequence the rule describes is real, but it runs through
   `scripts/mcp/extract-api.mjs:63` (`jsDocOf()` reads the compiler's `node.jsDoc` array — `/** */`
   blocks only, runs inside `npm run build:lib`, ships in `dist/ngx-tw/index.json`) and through the
   emitted `.d.ts` into a consumer's IDE hover. **[measured]**
2. **"Use CDK for … coercion"** — the library makes **49 uses** of Angular's own
   `booleanAttribute` / `numberAttribute` across 14 files and imports `@angular/cdk/coercion`
   **zero** times. The code was right; the instruction was stale. **[measured]**
3. **`time-picker` filed under "Overlay-bearing components"** in the input-cap exception table —
   it imports `@angular/cdk/overlay` **zero** times and renders inline. Its 24 inputs are genuinely
   wide, for a different reason, so it now has its own row rather than a borrowed justification.
   **[measured]**

Why this keeps happening is worth naming: a wrong rationale is invisible to every gate. Tests,
lint, `verify:package` and `verify:mcp-index` all check the *code*. Nothing checks whether the
reason a rule gives for itself is true — and a rule that cites a tool nobody can find is one
maintainer-check away from being abandoned wholesale.

## Tier 1 — fixed and verified in this pass

| # | Finding | Evidence |
|---|---|---|
| P5-1 | **`[twTheme]="'light'"` was a no-op inside any dark or high-contrast ancestor.** `_dark.css:13` and `_high-contrast.css:1` are element-agnostic `[data-theme=…]` rules that cascade into a subtree; `light` existed only in `_semantic.css`'s `@theme` block, which Tailwind v4 emits as `@layer theme { :root, :host }` — no subtree element matches either. The only `[data-theme="light"]` selector in the theme CSS was inside `@media (forced-colors: active)`. **The demo's own three-pane showcase demonstrated the bug**: switch the page to dark and the "light" pane stayed dark. `ThemeService.applyToElement()` carried the identical hole while its JSDoc promised subtree scoping, and `theme.meta.ts` advertised it into the MCP index. | **[verified]** → fixed with `theme/_light.css`, **195 declarations, all 195 string-equal to `_semantic.css`** (pixel-neutrality) and key-identical to the dark/HC blocks |
| P5-2 | **`provideTheme()` registered `ThemeService` but never constructed it.** No `provideEnvironmentInitializer`/`APP_INITIALIZER`, so the service was built on first `inject()` — and everything that applies the theme lives in its constructor effect. A consumer whose toggle sits in a lazily-loaded route got **no `data-theme` at all** until that chunk loaded. Masked completely: the demo injects it in the eagerly-loaded root layout, and every spec called `TestBed.inject` explicitly, so the un-injected path had zero coverage. | **[verified]** |
| P5-3 | **`defaultTheme` was a one-shot.** The constructor effect persisted to `localStorage` on first load with no user action, so changing `defaultTheme` in a later release left returning users pinned to the old value forever. Persist moved into `setTheme()`. Landing P5-2 without this would have made it strictly worse — the initializer now runs on *every* boot. | **[verified]** |
| P5-4 | **`'system'` could never resolve to `high-contrast`** — `prefers-contrast` appeared zero times in the repo. Now observed live. Resolution **(b)**: high-contrast only when contrast is requested and the OS is not dark, because the only HC scheme is light-based and (a) would move dark+contrast users onto a white surface. A dark HC ramp is recorded as the follow-up. One listener across both `MediaQueryList`s so a colour-scheme tick cannot clobber the contrast decision. | **[measured]** |
| P5-5 | **No flash-free path for a persisted theme disagreeing with the OS.** `TW_THEME_BOOTSTRAP_SCRIPT` now ships, built from `DEFAULT_TW_THEME_CONFIG` so its storage key and attribute cannot drift from `THEME_CONFIG`. | **[verified]** |
| P5-6 | **`combobox` panel resize tracking died permanently after the first close.** `closeOverlay()` disconnected and nulled the `ResizeObserver`; `ensureOverlay()` early-returns whenever `overlayRef` exists, and the ref is only ever *detached*, never disposed — so `installResizeObserver()` was never reached again. `select`, the file this was copied from, does **not** disconnect on close, which is why it was unaffected. The copies had drifted twice (see P5-7). | **[verified]** by the orchestrator against source, not taken on report |
| P5-7 | `combobox` registered backdrop/Escape teardown on `destroyRef` rather than per-open, accumulating one subscription per open on a reused `OverlayRef`. Replaced with a `perOpenSubs` aggregate mirroring `select`. | **[verified]** |
| P5-8 | **`paginator` inverted arrow keys in RTL.** `paginator.ts:890` pinned `withHorizontalOrientation('ltr')` as a literal and imported `@angular/cdk/bidi` zero times; CDK's `_list-key-manager-chunk.mjs:138-141` makes ArrowLeft unconditionally `setPreviousItemActive()`, which in an RTL page moves focus visually **rightward**. The library already knew: `tab-nav.ts:144` documents this exact bug class in prose *while fixing it*, and `paginator`'s own comment claimed to mirror that migration. **A missed sibling of commit `5dccfc1`.** Now reads `Directionality.valueSignal()` (CDK 22) inside the existing rebuild effect. | **[verified]** by the orchestrator against source + installed CDK |
| P5-9 | `segmented-control` and `tags-input` hand-rolled horizontal arrow navigation with zero `Directionality`, on custom `role` hosts that get **no native browser RTL fallback**. Minimal direction-aware fix in both. | **[verified]** |
| P5-10 | **`tw-table` and `flip-card` each announced the same string twice** — a `LiveAnnouncer` call *and* an `aria-live` host region. `flip-card`'s own comment stated the contradiction. | **[verified]** |
| P5-11 | **`select`'s type-ahead could make a *disabled* option the active descendant**, after which Enter silently did nothing. The arrow-key path already skipped disabled options; type-ahead did not. | **[verified]** |
| P5-12 | **`NumberInputDirective` never reflected disabled to the DOM, and `onInput()` was ungated** — a disabled standalone control wrote every keystroke into the form model. `onKeydown` and `stepBy` both open with a disabled guard; `onInput` did not, which is the tell it was accidental. Masked because all 28 demo usages **and all five spec hosts** pair it with `twInput`, whose native attribute supplies the missing behaviour. The existing disabled spec asserts `inputEl.disabled === true` — a correct DOM assertion that was **measuring the sibling directive** and never dispatched an `input` event. Structurally incapable of failing. | **[verified]** |
| P5-13 | **11 variant renames across 7 components** landed with deprecated aliases: `outlined`/`bordered` → `outline`, `filled` → `solid`, `plain` → `ghost`. | **[measured]** |
| P5-14 | **17 `true`-default justifications migrated from `//` into JSDoc.** | **[measured]** |
| P5-15 | **The MCP index served ZERO snippets for the entire runtime theming API** — the theme route had no `*Snippet` consts and no `<tw-code-block>`. Now 12. Repo-wide snippet count 733 → 745. | **[measured]** |
| P5-16 | **`verify-mcp-index.mjs` check 4's `.css` carve-out was dead code** — the scanner regex `[\w/-]` excludes `.`, so `@cdevhub/ngx-tw/theme/index.css` captured as `theme/index`, failing the carve-out and both entry-point lookups. Landing P5-15's CSS snippet would have turned an advisory WARN into a **hard `exit 1` on the release pre-flight**. Check 5's "missing or renamed demo page" also reported a wrong cause. | **[measured]** — found by the fix agent *in the audit's own claim* that check 4 "already whitelists `theme/*.css`" |

| P5-17 | **Overlay configuration was built once per component *lifetime* in `tooltip`, `select`, `combobox` and `popover`** — `position`, `offset`, `scrollStrategy` and backdrop config froze after the first open, because each guards creation on `if (this.overlayRef) return` and disposes only at destroy, while close merely `detach()`es. `tooltip` is the worst: `[twTooltipPosition]="isMobile() ? 'bottom' : 'right'"` is an ordinary binding and tooltips show and hide constantly. Extends the P4-6 / P4-9 "input read once, never re-read" class. | **[verified]** — the orchestrator re-derived `tooltip`'s *read site and detach-only hide* (`tooltip.ts:484`, `:554-556`); the **consequence** (a changed binding ignored on the next show) was established by the fix agent's failing-first spec, not by that read |
| P5-18 | **`provideCalendarIntl` / `provideTimePickerIntl` merged with `Object.assign`,** so an explicitly-`undefined` field overwrote the default and a missing key then crashed the calendar on view switch. P4-8's class, but in a **bootstrap-level provider** — one bad key at startup breaks every calendar in the app, and it surfaces later, on a view switch, far from the cause. | **[verified]** |
| P5-19 | **A disabled `tw-calendar` still presented every day cell as enabled**, and `cellHover` fired on every pointer move across the disabled grid. `effectiveDisabled` was never plumbed to the cells while `readonly` was. Prior art preserved: no native `[disabled]` on cells, and exactly one tabbable cell when disabled. | **[verified]** |
| P5-20 | **New e2e guards**: the `[twTheme]` subtree fix (P5-1) had none — `theme-matrix.spec.ts` covers 4 sampled pages and the theme page was not among them, which is exactly why P5-1 shipped. Plus the first RTL keyboard case for `paginator`. `dialog.spec.ts:92`'s stale fixme promoted to a live passing test. | **[measured]** — theme guard's non-vacuity proven by commenting out `@import "./_light.css"` in the loaded CSS and watching all three assertions fail independently |

### Why the variant aliases are load-bearing, not courtesy

Measured against the installed `tailwind-variants`: `tv({variant:'zzz'})` returns **base classes
only** — not the default, no throw, no console warning. So a rename without an alias leaves a
consumer's `variant="outlined"` **silently unstyled**. Every alias therefore ships a
**string-equality** regression spec (not `toContain`), which is the literal encoding of the
promise. `card`'s deliberately sets `color="primary"` because card has no `neutral` compound row,
so at the default colour its seven-row rekey would have been entirely unguarded. **[measured]**

The mechanism was decided once and applied uniformly: normalise in a `computed()` **before**
`tv()`, rather than duplicating the `tv()` key — duplication would have doubled `card` 7→14 and
`collapsible` 15→30 compound rows, which is exactly the drift CLAUDE.md codifies against.

## Corrections to earlier passes, and to this pass's own agents

- **The register's "6 of 12 injection tokens reach the root barrel" is wrong: all 12 do.** The
  deferred `TW_` work is roughly double what the register advertised. **[verified]**
- **The register's `test.fixme` reduced-motion cost is wrong, in the dangerous direction.** It says
  adding the gate would kill six e2e tests. `playwright.config.ts:62` sets
  `reducedMotion: 'reduce'` **globally**, so the real result is **1 red test and 3 silently vacuous
  ones** — cheaper than advertised but worse, because vacuous tests advertise coverage that does
  not exist. **[measured]**
- **The 140/672 untested-inputs dispute is settled: neither pass was wrong.** Pass 4 measured a
  total across methodologies; pass 2 measured a delta within one. Both are correct for their
  denominator. The real defect was that **no pass ever published its script** — this one did.
- **`test.fixme` count is 37, not 38.** `dialog.spec.ts:92` is **provably stale**:
  `dialog-config.ts:56` already overrides `ariaModal = true` and three unit tests assert it.
- **"69 outputs" matches no filter** — the real count is **88** source declarations (none
  `@internal`), 96 shipped `OutputEmitterRef` members. Treat 69 as stale.
- **Register Tier 2's "high-contrast has zero verification" is stale** — `theme-matrix.spec.ts`
  sweeps all three themes. Its scope is narrow (4 sampled pages, `color-contrast` only) and the
  theme page itself is not among them, **which is exactly why P5-1 shipped unguarded**.
- **Pass 1's F5 (`--width-calendar-*` dead tokens) is closed**, and
  `docs/production-audit.md:48`'s "`theme/index.css` is not exported" is closed — dist exports
  carry both `./theme` and `./theme/*.css`.
- **The `@internal` leak is 999 class members vs 2 module symbols**, which **kills the barrel
  convention outright** as a mechanism for `stripInternal`. `protected` closes *callability* but
  does not remove members from the `.d.ts`, so the published-surface fix still needs a post-rollup
  strip or api-extractor. This narrows the open question left by pass 4.
- **Three of the orchestrator's own briefing hypotheses were falsified by the SRP agent**, recorded
  so nobody re-checks: keyboard/type-ahead duplication **does not exist** (`menu`→`CdkMenu`,
  `tree`→`CdkTree`, `tabs`/`tab-nav`/`collapsible`→`FocusKeyManager`; only `select` hand-rolls a
  buffer, with no sibling); selection tracking in `table`/`transfer`/`tree` is **correctly three
  separate mechanisms**; and it is **four** overlay-bearing field components, not five.
- **`SelectionModel` cannot serve `table`** — its `compareWith` is a comparator that linear-scans
  (`_selection-model-chunk.mjs:145-152`), which is precisely what `table.ts:1396` rejects in
  writing. Recorded so the "use CDK collections" lead is not re-opened.
- **`dialog`/`sheet` reading `_config` / `_ariaLabelledByQueue` is idiomatic**, not a second
  `CdkTree._expansionModel`: both are declared public on `CdkDialogContainer`.

## Verified-clean, stated positively so pass 6 does not re-sweep

- **CDK adoption: 9 of 10 "is a package missing?" leads close clean.** `menu` composes `CdkMenu`,
  `transfer` composes `CdkListbox`, `tree` composes `CdkTree`, `textarea` composes
  `CdkTextareaAutosize`, `stepper` extends `CdkStepper`, `dialog`/`sheet` extend
  `CdkDialogContainer`. No deprecated CDK API in use; no CDK-private misuse beyond the two
  idiomatic reads above. `BreakpointObserver`, `drag-drop`, `SelectionModel`, `ContentObserver`,
  `HighContrastModeDetector` and `InteractivityChecker` were each checked and are genuinely not
  needed — **absence is not a finding**.
- **Theme token system: measured clean.** Scheme parity is **exact** — all three schemes define an
  identical 195-token set, no holes in any direction. **0** undefined tokens across 225 library +
  90 demo custom-namespace classes. **0** genuinely dead tokens. **16/16** `animate.enter`/`leave`
  classes have keyframes; **0/28** `_base.css` keyframe classes are orphaned. Theme entry point is
  SSR-guarded at all five touch points and correctly has no `providedIn`.
- **Entry-point boundaries: clean.** All ~190 cross-entry-point imports go through barrels; zero
  sibling-internal reaches.
- **Correctly-large files, do not re-open:** `calendar.ts` is the residual of an already-complete
  20-file decomposition; `table.ts` and `paginator.ts` are codified cap-exempt primitives.
  `date-picker` vs `date-range-picker`'s 28/40 method-name overlap is a **skeleton match only** —
  the bodies diverge for stated single-vs-range reasons.
- **`stepper`'s `@ViewChildren` remains forced** by `CdkStepper`'s `QueryList` typing (re-confirmed;
  the register already says do not re-investigate).

## Open — carried to pass 6

> **Superseded.** Pass 6 closed all but a handful of these. Read the **Pass 6** section's
> "Open — carried to pass 7" instead; this list is kept for the reasoning behind each item,
> not as a work queue. Items still open there are renumbered.

**Approved but deliberately not landed this pass** (maintainer scoped pass 5 to defects + variant
renames):

1. **`TW_` prefix on 12 injection tokens** — all 12 are root-barrel public (register said 6).
   Alias shape is specified in `docs/research/2026-09-audit/pass5-api.md` A2.3, with the one rule that matters:
   `export const OLD = TW_NEW;` — **never** a second `new InjectionToken`, which would split the
   DI graph in a way no test would catch.
2. **`select`'s clear control is a `role="button" tabindex="0"` span inside the `<button>` trigger**
   — an HTML content-model violation axe cannot see. The fix agent took the pre-authorised exit
   rather than ship unverifiable work: `e2e/specs/04-visual/canary.spec.ts:190` screenshots the
   select "Colors" section and `colorValues` seeds **6 of 8** of those selects with a value, so the
   clear control sits inside `select-closed.{light,dark}.png`. Costed Path A/Path B hand-off is in
   `docs/research/2026-09-audit/pass5-fix-cbx-report.md`; Path A recommended.

**Newly found, needing their own pass:**

3. **The CVA + `NgControl` + error-state + `required` block is duplicated at 15 class sites across
   14 files**, with the `statusChanges`/`ngSubmit` half **byte-identical at all 15** (~450 lines
   recoverable). `FormFieldControl` declares the contract and none of the mechanics. Target: a
   `wireErrorState()` injection-context function in `core/`, modelled on the existing
   `onFormReset`. **Caveat, added pass 6:** `onFormReset` is a *structural* precedent only — it has
   **zero importers**, is absent from `core/index.ts`, and never ships. It is what the shape looks
   like, not evidence the shape works. The load-bearing precedent is `TextareaDirective extends
   InputDirective`, the only form control without a copy of the block, because it inherits one.
4. **`select` and `combobox` bypass `PickerOverlayCoordinator` entirely** (only the two date
   pickers use it) and re-implement 7 methods, 5 identical modulo the anchor element. **Ordering
   constraint: P5-6 and P5-7 had to land first** — they are bugs in the exact reopen path this
   migration rewrites. Must not share a pass with item 3.
5. **`carousel.ts` is the one genuine multi-responsibility file** (1695 lines, 5 classes, zero
   extracted siblings). Safe half bounded precisely: lines 1467–1695 move with a one-way import;
   `CarouselSlideComponent` cannot (a true `contentChildren` ↔ `inject` cycle).
6. **6 genuine hand-rolled list navigations** remain (of 16 total; `calendar`'s 2-D grid and
   `time-picker`'s segmented field are justified). `select`/`combobox`/`command-palette` hand-roll
   ~350 lines of `ListKeyManager` and **have already diverged** — `select` does not wrap, `combobox`
   does; type-ahead exists only in `select`.
7. **`@angular/aria` is stable at 22.1.5, matches this repo's `^22.0.7` line, and is entirely
   unused.** It ships headless directives for Accordion, Listbox, Combobox/Select, Menu, Tabs,
   Toolbar, Tree and Grid — ngx-tw hand-rolls **all eight**. CLAUDE.md's "never rewrite what CDK
   provides" was written when CDK was the only answer; in v22 the a11y-behaviour layer has moved
   up. Three of this register's most expensive defect classes — roving-tabindex desync, RTL arrow
   keys, `aria-activedescendant` drift — are exactly what these directives own. **This is a
   multi-release architectural decision, not a fix**: the directives dictate DOM shape, which
   collides with this library's flat-DOM and `tv()`-slot conventions. What pass 6 owes is a
   recorded *position* in CLAUDE.md, either way, so the next component author is not left guessing.
   **[measured]** — `npm view @angular/aria dist-tags`.
8. **Escape-dismiss policy is split**: `dialog`/`sheet`/`tooltip` use `hasModifierKey`; ~9 other
   overlay sites do not, so Shift+Escape closes a select but not a dialog. Nine different shapes of
   dismissal API across the overlay family.
9. **28 files hand-roll `let nextId = 0`; 4 use CDK's `_IdGenerator`** — `dialog.ts` and
   `dialog-content.ts` differ *inside one entry point*.
10. **`Directionality` mirroring is now half-migrated** — `paginator` uses `valueSignal()` (CDK 22);
    `tabs`, `tab-nav`, `split` and `timeline` still hand-mirror `Directionality.change`.
11. **`ThemeDirective` and `ThemeService` disagree on the attribute** — the directive hard-codes
    `data-theme`, the service honours `config.attribute`. Documented in both JSDocs, not
    reconciled: either direction breaks something. Needs a decision.
12. **A dark high-contrast ramp** — the follow-up P5-4 deliberately deferred.
13. **Theme scheme-parity guard blocked on tooling**: `@types/node` is not installed, so a
    `scripts/verify-theme-parity.mjs` cannot be type-checked (`import 'node:fs'` fails TS2591).
    The `grep`/`comm` recipe is in `docs/research/2026-09-audit/pass5-fix-theme-report.md`. Three hand-duplicated
    195-token blocks now exist with nothing guarding them against drift.
14. **`segmented-control`'s `surface` variant** and the `default | naked` field-chrome axis (**four**
    components — `select` too, not three) stay excluded from the variant vocabulary, verified
    individually. `form-field`'s `appearance: outline | filled` was found to be a **fifth**
    exclusion the earlier scope never named.
15. **35 `test.fixme` with no expiry** — 37 at entry, **two promoted to live passing tests this
    pass**. `A11Y_BACKLOG` self-expires because axe *runs*; a `test.fixme` body never executes.
    Honest fix: `test.fail()` for the "library is broken" entries plus a dated registry for the
    demo-blocked ones. **Five real library defects live only inside fixme comments**, four of them
    one root cause (`onFormReset` is dead under signal forms).

    **The mechanism's cost is no longer hypothetical.** `calendar.spec.ts:153` read
    *"BUG / NEEDS-INVESTIGATION: calling `ctrl.disable()` does NOT propagate to the individual day
    cells"* — a precise, correct description of **P5-19**, which this pass found and fixed by an
    entirely independent route (an audit agent reading `effectiveDisabled`'s consumers). The fixme
    had the diagnosis and was invisible to every gate for as long as it sat there; promoted, it
    passes. `dialog.spec.ts:92` was the opposite failure — a fixme that had gone **stale**, its
    premise fixed at `dialog-config.ts:56` with three unit tests already asserting it. One
    mechanism, both failure modes, in one pass. **[measured]**
16. **`onFormReset` is cited by seven e2e spec files and imported by no component** — reset actually
    works via `writeValue(null)`. `docs/tree-shaking-audit.md:89` carries a milder version of the
    same misattribution, claiming `calendar.ts:1151` references a symbol it does not.
17. **Test harnesses: 1 of 56.** Position taken: the right target is ~14 (overlay + complex form),
    not 56 — harnesses are semver-frozen public API. The harness the two `date-range-picker` skips
    ask for **already ships** (`CalendarHarness.selectRange()`/`selectCell()`).
18. **Five unexported types in public signatures** (`ThumbId`, `ResolvedItem`, `ResolvedGroup`,
    `DialogContainer`, `SheetContainer`) — confirmed as exactly the non-`@internal` class; 15 more
    exist but only behind `@internal`.
19. **Seven components ship a `model()`-minted output alongside a hand-written one** with a real,
    entirely undocumented any-change-vs-user-gesture split (`change` fires only on gesture;
    `checkedChange` also fires from `writeValue`). Documentation gap, not a defect — and an audit
    agent's first draft would have deprecated four load-bearing outputs before re-checking.
20. **Demo prose defect**: the toast page claims swipe is disabled under `prefers-reduced-motion`;
    no such gate exists. Recommend deleting the prose — WCAG 2.3.3 is AAA and targets
    non-direct-manipulation motion.
21. **Two out-of-scope demo files still pass legacy variant strings**
    (`foundations/rhythm/panels/container-panel.ts`, `empty-state-examples.component.ts`) —
    build-clean through the new aliases, left for a sweep.

## Traps worth recording

- **`Directionality` is root-provided in CDK 22** (`@Service()`), so omitting its provider in a
  TestBed still injects the real instance, which reports `'ltr'` in jsdom. A "no provider"
  fallback test written the obvious way **tests nothing**; use `{ provide: Directionality, useValue: null }`.
  Caught by a fix agent reviewing its own spec.
- **`tv()` fails silently on an unrecognised variant** (base classes only, no throw, no warning) —
  see the aliases note above. This is the single most important thing to know before renaming any
  variant in this library.
- **Vitest resolves `templateUrl` through `dist/ngx-tw/`**, so any new spec asserting on an
  external template cannot pass before `npm run build:lib` — and a stale-dist failure looks exactly
  like the bug the spec guards.
- **`ngc` compiles a malformed template with exit 0.** A `perl -pe` one-liner editing a template
  parsed `$2[disabledGrid]` as an array subscript and injected four stray `="effectiveDisabled()"`
  lines. The Angular compiler accepted the result and exited **0**; only reading the diff caught it.
  Do not use `perl`/`sed` substitutions containing `$N` immediately followed by `[` on templates,
  and never treat a green compile as evidence a mechanical template edit was correct. **[measured]**
- **A spec can be vacuous because the code path it exercises was already inert.** Two of this
  pass's proposed specs asserted "the disabled control does not activate" against handlers that
  already early-returned — they would have passed before the fix. When guarding a newly-added
  disabled state, find the path that was genuinely unguarded (here: `cellHover`, which fired on
  every pointer move across a disabled grid) rather than the one the audit named.
- **`--noEmit` skips declaration diagnostics.** A public member whose type is module-private
  type-checks clean under `tsc --noEmit` and fails only on real declaration emit. Worth running
  emit over touched entry points after any type-visibility change.

## Two corrections this pass made to its own agents' proposals

Recorded because in both cases the *proposed spec*, not the finding, was the defect:

- **F-08's repro passes before the fix.** The gaps report proposed `{ monthViewLabel: undefined }`
  plus a view switch. `viewSwitched()` branches on the **resulting** view, and one period-button
  click from the default day view lands on `'month'`, which reads `yearViewLabel` —
  `monthViewLabel` is only read on the drill-*down*.
- **F-09's proposed assertion is vacuous**, and the report says why two paragraphs earlier:
  `onDateSelected` already early-returned, so the click path was inert. The pre-existing
  `disabled state` test is the same shape and must not be counted as coverage. The genuinely
  unguarded path was **hover**.

Also: the brief's own three-pane theme assertion was **unsatisfiable**. The panes carry
`bg-surface`, and `--color-surface` is `var(--color-white)` in *both* `_light.css:41` and
`_high-contrast.css:3` by design, so "three distinct pane backgrounds" fails on correct code. The
guard moved to the `bg-primary-600` chip (blue-600 / blue-400 / blue-700), which captures the same
failure.

## The gate gap this pass walked into

The `segmented-control` variant rename updated the examples page's `VARIANTS` const and missed its
`variantValues` Record twelve lines later. **`build:lib`, `test:ci`, `lint`, `verify:package` and
`verify:mcp-index` all stayed green while the demo did not compile** — because `ng test demo` does
not type-check demo pages (the register already documented this; it was not acted on). The only
symptom was that every local Playwright run died with `Timed out waiting for config.webServer`,
which never names the file.

**`npx ng build demo` is therefore a required gate after any change that touches demo source**, and
it is now in the table below. A rename that widens a union is exactly the shape that produces this:
the `Record<SegmentedControlVariant, …>` needed a fourth key once the union gained the deprecated
alias. Keying the Record on the rendered subset (`as const satisfies`) is the durable fix.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass — 56 entry points, 567 symbols, **745 snippets** (was 733) |
| `npx ng build demo` | pass — **newly added to the gate set, see above** |
| `npm run test:ci` | **3299 passed**, 4 skipped (73 files) + 4 demo — up from 3225 |
| `npm run lint` | **0 errors, 75 warnings** — the same 75 as at entry, all in `e2e/` |
| `npm run verify:package` | pass — theme resolves from a clean consumer install |
| `npm run verify:mcp-index` | **6 warnings** (was 7) — the theme entry point now carries snippets |
| `npm run e2e:fast` | **936 passed**, 52 skipped, **1 flake** (was 932). The flake is `transfer.spec.ts:58`, which passes 5/5 in isolation — see below |
| `npm run e2e:visual` | **regenerated on Linux via `workflow_dispatch`, then validated** — see below |
| CI, PR #56 | lint, unit, build, MCP index, npm pack + consumer install, e2e smoke, e2e a11y — all pass |
| CI, `e2e.yml` dispatched on the branch | **all 9 jobs pass**, including `visual canary` and all four `e2e — full` shards |

**Visual baselines were regenerated on Linux (`workflow_dispatch`), and doing so surfaced a
capture defect — recorded because it is only half fixed.**

15 of 20 baselines moved. `button`, `tabs` and `dialog` were **untouched by pass 5** — those
deltas are pass 1's rhythm migration finally being regenerated, which had been outstanding for
four passes. `card`, `select`, `date-picker` and `theme` were genuinely touched.

Note that `--update-snapshots` makes the visual suite pass **by definition** — it records whatever
renders. "20 passed" on the regeneration job is therefore *not* evidence of correctness, and the
only real check is the `e2e.yml` visual job running against the committed baselines afterwards.

Inspecting the regenerated PNGs (rather than trusting the green job) found that
**`theme-swatches.{light,dark}.png` no longer shows what it is named for.** Two causes:

1. **Fixed.** The theme demo page's migration to the tabbed `tw-item` + `twTabNav` shell pushed the
   "Semantic Tokens" section under the shell's `sticky top-0 z-30` header (`shell.ts:510`).
   Playwright element screenshots capture the page *region*, so the sticky chrome — including a
   `backdrop-blur-md` — landed inside the frame. The header is now hidden for that one capture, so
   the other 14 regenerated baselines stay valid.
2. **NOT fixed, carried to pass 6.** Even with the chrome gone, ~270px at the top of the frame is
   blank where the `Semantic Tokens` heading and the SURFACE and FOREGROUND rows used to render.
   The captured box is correct; its first rows are not painted at capture time. Most likely the
   same class as pass 3's axe finding — *scanning before the enter animation settles*, which
   produced 43 phantom contrast failures until a 1200ms settle was added. The baseline is stable
   and still guards the rows it does show, so this is a coverage hole, not a false alarm: **the
   surface and foreground token ramps currently have no visual guard.**

**CI gap: the visual canary cannot run on a pull request, so a baseline change is never
validated before merge.** `e2e.yml:212` gates that job on
`push || schedule || workflow_dispatch`, and its `push` trigger is scoped to
`branches: [develop]`. A feature branch therefore gets `skipping` on every PR run, and the first
thing that genuinely exercises a regenerated baseline is the push to `develop` **after** merge —
so a bad baseline turns `develop` red rather than the PR that introduced it.

That is backwards for the one artefact this repo already knows is platform-fragile enough to need
a dedicated regeneration workflow. It also compounds the `--update-snapshots` point above: the
regeneration job is green by definition, and the only job that could contradict it does not run.

Worked around for pass 5 by dispatching `e2e.yml` manually on the branch — **all 9 jobs passed,
including `visual canary` and all four `e2e — full` shards**, which is the genuine validation of
the 17 regenerated baselines. Pass 6 should make this structural: either allow the visual job on
pull requests that touch `e2e/__screenshots__/`, or add a required check that fails a PR carrying
baseline changes no visual run has verified. **[measured]**

**The `transfer.spec.ts:58` flake did not reproduce in CI** — all four `e2e — full` shards passed.
That strengthens the load-dependence diagnosis rather than weakening it: local full-suite
contention on a laptop is heavier than a 4-way-sharded CI run.

**All four load-dependent flakes are now fixed, and the last one turned CI red before it was.**
The three e2e flakes were fixed as a class (a shared `pollUntil` in `e2e/support/timing.ts`, plus
the recorded finding that the `date-picker` flake sat on an *inline* overlay assertion rather than
the page object, so fixing only the eight POMs would have missed the named flake). The fourth —
`menu.spec.ts`'s type-ahead — was **not** an e2e test at all but a Vitest unit spec sleeping a real
250ms for CDK's 200ms typeahead debounce, so the e2e class fix could not reach it. It failed a PR
`unit tests` check at 5000ms while passing locally three times in a row.

Fixed with virtual time (`vi.useFakeTimers()` + `advanceTimersByTime`), not a wider budget — a
longer sleep only moves the threshold. RxJS's async scheduler drives `debounceTime` through
`setInterval`, which Vitest's fake timers patch. Non-vacuous: without the clock advance it fails,
and it now fails in **26ms instead of hanging for 5000ms**, so a future regression reports as a
failure rather than a timeout. Three consecutive full runs: 3381 passed, zero flakes. **[measured]**

**A third load-dependent e2e flake, new this pass and NOT a regression.**
`transfer.spec.ts:58` (`expect(focusHome).toBe('listbox')`) failed once under full-suite
contention and passes **5/5 in isolation**. `git diff f1196e5..HEAD` confirms **no pass-5 change
touches `transfer/`** — it was in no agent's ownership. It joins the two pass 4 recorded
(`00-smoke/routes.spec.ts` on `/components/sort/api`, `date-picker.spec.ts:205`) and the
`menu.spec.ts` type-ahead flake from pass 2. That is now **four**, all the same shape: a timing
assertion that loses its race under parallel load.

This is worth more than its individual severity. Four independent flakes train a maintainer to
re-run a red suite until it goes green, which is exactly how a real failure gets waved through —
and this pass's own `test.fixme` findings show what happens when a known-bad signal is left to sit.
Pass 6 should fix the class (the repo already built the right tool: `pumpUntil` in
`select.spec.ts` / `combobox.spec.ts`), not the four instances.

**Visual baselines.** `_light.css` restates values `@theme` already set on `:root`, and all 195
declarations were verified string-equal to `_semantic.css`, so a light-mode page is pixel-identical
by construction. The variant renames resolve to byte-identical class strings, asserted by
string-equality specs. No baseline shift is *expected* — but that is an expectation, not a
measurement, and the Linux job is the only thing that can confirm it.

---

# Pass 6 — 2026-09-03, closing the open list

Scope set by the maintainer: **address every gap the register carries.** Where an item needed a
decision rather than a fix, the decision was taken up front: adopt `@angular/aria` incrementally
worst-first; author a dark high-contrast ramp; land all four large refactors.

Method: four parallel fix agents partitioned by file ownership, then three more for the refactors
(which each got their own commit so a regression stays attributable), then three for harnesses.
The `Register:` discipline from pass 4 was kept.

**Pass 5's open list of 21 items is now closed except where noted below.** Do not re-derive it.

## Tier 1 — landed

| # | Item | Evidence |
|---|---|---|
| P6-1 | **All 12 non-conforming injection tokens gained a `TW_` prefix** with deprecated aliases. Every alias is `export const OLD = TW_NEW` — a reference to the *same instance*. A second `new InjectionToken` under the old name would be a second DI key, so a consumer providing one and a component injecting the other would silently miss each other, and **no test would catch it**. Six alias specs assert the bidirectional DI round-trip; `avatar`'s asserts the rendered class, because that component injects optionally and a split graph would not throw — it would quietly render `size-6` instead of `size-16`. | **[measured]** |
| P6-2 | **`wireErrorState()`** — the CVA + `NgControl` + error-state + `required` block was duplicated at 15 class sites across 14 files. Now one `core/` injection-context helper; **−298 production lines**. Per-site differences are parameters, not flattened: `requiredTrue` on the boolean controls, `RadioComponent` delegating `errorState` to its parent group, nine controls tracking a focus signal. CVA registration untouched. | **[measured]** |
| P6-3 | **`select` + `combobox` migrated onto `PickerOverlayCoordinator`**, −145 lines, existing specs unchanged. Chose dispose-on-close over a reuse mode on evidence: neither subscribes to `positionChanges`, so the `tooltip` hazard has no analogue, and a reused strategy resolves its origin **once** with no `setOrigin()` — porting reuse into `core/` would have carried that gap into shared code. | **[measured]** |
| P6-4 | **`carousel` decomposed**, 1695 → 1147 lines across five files. Every moved region diffs byte-identical; the only content change is one `const` becoming exported. **1147 is the intended floor**, not unfinished work. | **[measured]** |
| P6-5 | **Dark high-contrast ramp** (`_high-contrast-dark.css`). `'system'` now composes `prefers-color-scheme` and `prefers-contrast` as independent axes into the full 2×2, removing pass 5's compromise. | **[measured]** |
| P6-6 | **`select`'s clear control** is now a native `<button>` sibling of the trigger over an in-flow spacer, with **logical** (`end-*`) offsets — a physical offset would have shipped an RTL bug in the same pass as an RTL fix. The old `role="button" tabindex="0"` span inside the trigger was a content-model violation axe provably cannot see. | **[verified]** |
| P6-7 | **`aria-required` fixed on all three pickers.** `date-picker` and `date-range-picker` bound the raw input while their JSDoc promised the bound control was honoured; **`time-picker` had no `aria-required` binding at all**. On `time-picker` it went on the three `role="spinbutton"` inputs, not the `role="group"` wrapper, which does not permit it. Pass 4's P4-5 fixed this class for five components and missed all three pickers. | **[measured]** |
| P6-8 | **Seven `{role}-border` tokens failed SC 1.4.11 in shipped dark** (1.95–2.84:1 against a 3:1 floor), now 3.42–4.22. The earlier report sampled two of the seven; fixing two would have shipped a visibly non-uniform ramp for no gain. The fix had **no guard** — axe tests text only — so a spec now resolves each scheme's token graph to sRGB and asserts the floor. | **[measured]** |
| P6-9 | **`transfer` had `aria-invalid` on its `role="group"` host** — pass 1's F9 class, corrected in `tags-input`/`file-upload` and missed here. Moved to the target panel, which owns the value, **including the empty region**: an empty target is exactly when a required transfer is invalid, and the listbox is not rendered there. | **[measured]** |
| P6-10 | **`slider` silently discarded a control-written value.** `writeValue()` sets the internal thumb signals and never the model; `internalSingle` is a `linkedSignal` deriving from `value()` that also read `min()`, so any bounds change recomputed from a model the CVA write never updated. A reactive slider holding 20 whose `min` moved to 10 reported **10**. `min()` is now read untracked. | **[measured]** |
| P6-11 | **`combobox` announced the wrong row selected during its leave animation.** `renderedRows` is frozen while the panel animates out, but `isSelected` was pushed as a **live closure** resolving `visibleOptions()` at call time — so frozen indices met a refiltered list and committing `Banana` marked `Apple` selected. SC 4.1.2. | **[measured]** |
| P6-12 | **`date-range-picker.startAt` was a dead input** — declared, read nowhere. The calendar always opened on today's month. `date-picker` forwarded it correctly. | **[measured]** |
| P6-13 | **13 component test harnesses** ship as nested `testing/` entry points. | **[measured]** |
| P6-14 | **The visual canary now runs on pull requests** that touch `e2e/__screenshots__/**`, via a scope-detection job. It previously ran only on `push` to `develop`, so a regenerated baseline was first exercised **after** merge. | **[measured]** |
| P6-15 | **`--update-snapshots` now runs in `=all` mode.** The default `changed` mode had silently kept three baselines that had lost content, because the diff fell under `maxDiffPixelRatio`. | **[measured]** |
| P6-16 | **Five visual baselines had silently lost content.** Playwright never paints the off-viewport slice of an element taller than the viewport — the painted band was exactly 720px, one viewport. Fixed with a region-capture helper. | **[measured]** |
| P6-17 | **`test.fixme` mechanism landed.** Every suppressed body was **run** rather than reasoned about: 9 became `test.fail()` (they execute, so they go red the day the bug is fixed), 23 got a dated registry, 1 was stale — and **2 pass but vacuously** (`toBeHidden()` also passes for an unattached element; an SPA `goto` to a nonexistent route does not throw) and were correctly not promoted. | **[measured]** |
| P6-18 | **All four load-dependent flakes closed.** Three e2e ones as a class via a shared `pollUntil`; the fourth was a **Vitest unit spec** (`menu` type-ahead, a real 250ms sleep) that the e2e fix could not reach. Fixed with virtual time, not a wider budget — and it now fails in 26ms instead of hanging for 5000ms. | **[measured]** |

## The pass's real lesson: harnesses are a defect-finding instrument

Three of the defects above (P6-11, P6-12, and the `transfer` one in P6-9) were found **while building
harnesses**, not by any audit lens. Writing a harness forces you to be a real consumer — to name
what you can observe and drive — and that is a different question from "is this code correct".
`startAt` had survived five audit passes because nothing ever tried to *use* it.

The corollary is where the remaining harness value is: the components a harness could **not** be
written for cleanly are the ones with API gaps.

## Corrections to this pass's own work

- **My "bounded poll" pattern was unsound and I shipped it before catching it.** A deadline checked
  *between* awaits cannot bound a single await that never returns. Harness calls route through
  `fixture.whenStable()`, which under zoneless can wait on a re-scheduled timer — so the poll
  **hung** the suite instead of failing it. Do not reintroduce it.
- **The brief I gave the harness agents was wrong about overlay loaders.** A harness should resolve
  its panel through the protected `documentRootLocatorFactory()`, so consumers use the ordinary
  fixture loader. The exception is `dialog`/`sheet`, which are service-opened and have no
  fixture-resident host at all — my correction was itself too broad.
- **A grep-driven instruction would have unstyled a table.** I told an agent to rewrite
  `variant: 'bordered'` → `'outline'` in a demo file where `bordered` is canonical on
  `TwTableVariant` with no alias. It declined, with evidence.
- **My proposed `ThemeDirective` reconciliation was not non-breaking**, as I claimed. Making the
  directive read `THEME_CONFIG` silently no-ops `[twTheme]` for consumers who renamed `attribute`.
- **`@angular/aria` peer-pins `@angular/cdk` at an exact version** — verified empirically
  (`npm i @angular/cdk@22.0.5 @angular/aria@22.1.5` → `ERESOLVE`). The decision to adopt was taken
  before this was known. See below.

## Corrections to earlier passes

- **`docs/tree-shaking-audit.md` justified keeping `core/form-reset.ts` on the grounds that
  `calendar.ts:1151` references it. It does not** — zero references at any line. `calendar` hand
  -rolls the same `FormResetEvent` subscription at `:816`. The helper has had **zero importers
  across six passes**, and produced a misattribution cascade across seven e2e specs and three docs,
  including two skipped tests that *blamed* it. **[measured]**
- **`library-review/done/theme.md:255` recorded a decision not to rename `THEME_CONFIG` because it
  was "already correctly prefixed". It was not.** Struck through rather than deleted, so the next
  reviewer does not re-derive the same wrong objection.
- The register's own `wireErrorState` entry cited `onFormReset` as *precedent that the shape works*.
  It is a **structural** precedent only.

## Open — carried to pass 7

1. **`@angular/aria`: the decision needs revisiting.** The pilot on `command-palette` was
   **rejected on evidence** — `ngListbox` models *selection*, a palette is an *action list*, and
   neither `selectionMode` supplies activation (`follow` registers no Enter handler in
   single-select; `explicit` maps Enter to `toggleOne()`, so Enter twice *deselects*, breaking the
   documented `[closeOnSelect]="false"` mode). Two costs surfaced after the decision was taken:
   the **exact CDK peer pin**, and **`KeyboardEventManager` defaulting to `stopPropagation: true`**
   for every key it registers — so any aria widget inside a CDK overlay swallows that overlay's
   Escape. That rules out every overlay-hosted target. Nothing was installed. Suggested first
   targets if still wanted: `transfer` (already `CdkListbox`, no overlay) or `tabs`/`tab-nav` —
   but both are lateral CDK→aria moves with **no hand-rolled code to delete**, so the honest pitch
   is "get onto the framework's forward path", not "delete hand-rolled navigation".
2. **A trigger-marker convention** (`data-tw-*` or a host class) on `twMenuTrigger`, `twPopover`,
   `twTooltip`. All three take a required `TemplateRef`, so they are **always property-bound and
   Angular emits no attribute** — they cannot be located by their own selector. Material solves
   this with `.mat-mdc-menu-trigger`. One line each; unblocks the two withdrawn harnesses, deletes
   ~40 lines of `popover` guard code, and closes `tooltip`'s coverage hole. **Public API, so it is
   a maintainer decision.**
3. **`popover/testing` and `tooltip/testing` are withdrawn**, pending item 2. Both hung the suite
   at the 5000ms budget under contention while passing in isolation; both burn real time on a
   hard-coded 120ms leave animation. A harness whose specs hang is worse than no harness.
4. **No `testing/` entry point reaches the MCP index** — `build-mcp-index.mjs` derives entry points
   from `public-api.ts`, which nested testing entry points are correctly absent from. Confirmed
   independently by two agents; `CalendarHarness` was already invisible before this pass.
5. ~~**`_light.css` fails the same 3:1 border floor worse than dark did** (1.40–1.92, all seven
   roles). Not fixed: it darkens the default scheme's outline tier in the scheme every visual
   baseline is captured in. Recorded as a dated, self-invalidating allowance.~~ **CLOSED in pass 8**
   — and the item understated it: `info`, `success` and `warning` failed on `-border-strong` too.
6. ~~**`item.ts`'s selected ring still fails** and the theme layer cannot fix it — clearing 3:1 on the
   soft fill collapses the two border tiers. Needs `ring-{role}-border-strong` in the component.
   Measured per-role: 7/8 roles in light, 4/8 in dark.~~ **CLOSED in pass 8.** The 7/8 and 4/8
   figures here were correct and were re-derived before the change.
7. **CLAUDE.md's "zero `dark:` variants, greppable as a lint rule" is subtly false.** A
   documentation comment in `file-upload.ts` survives into the shipped bundle and Tailwind's
   scanner resurrects the dead utility it documents; `docs/library-review/done/calendar.md` is
   also scanned, and `segmented-control-examples.component.ts` ships a live `dark:ring-primary-800`.
   Chain verified end to end.
8. **`transfer` has no per-panel marker** — panels are one template rendered twice. Its harness
   matches on a derived title id, and its select-all locator (`div:has(> [id$="-source-title"])`)
   is the one structural rather than semantic selector in the harness set.
9. **`file-upload` cannot expose `attach()`** — `HTMLInputElement.files` is read-only to script and
   CDK's `TestElement` has no operation for it. Only `Object.defineProperty` works, and that exists
   solely in Testbed, so an `attach()` built on it would silently do nothing elsewhere. The harness
   seeds through the bound control instead, so the gap is visible in the test.
10. **`DatePickerHarness` cannot drive a projected `[slot=trigger]`** — `hasCustomTrigger()`
    suppresses both the input and the popup button, and no stable hook exists.
11. **Reopening inside the leave window silently no-ops on every overlay picker** —
    `PickerOverlayCoordinator.open()` returns `null` while `overlayRef` is set, leaving
    `aria-expanded="true"` with the outgoing panel, then open with no panel at all.
12. **`core/form-reset.ts` should be deleted or adopted.** Zero importers, absent from
    `core/index.ts`, never ships. Either export it and migrate `calendar.ts:816-830`, or remove it.
13. **`ThemeDirective` and `ThemeService` disagree on the attribute** — the directive hard-codes
    `data-theme`, the service honours `config.attribute`. Three consumers exist and two ignore
    `attribute`. JSDoc deprecation is the recommended route; the obvious fix is breaking.
14. Remaining smaller items: **Escape-dismiss split across nine overlay shapes**; **28 files
    hand-rolling `let nextId = 0`** against four using CDK's `_IdGenerator`; **six genuinely
    hand-rolled list navigations** with no path now that aria is rejected.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass — 56 entry points + **13 `testing/`** |
| `npx ng build demo` | pass |
| `npm run test:ci` | **3518 passed**, 4 skipped (95 files) + 4 demo — stable across three consecutive runs |
| `npm run lint` | **0 errors, 79 warnings** — all in `e2e/` |
| `npm run verify:package` | pass |
| `npm run verify:mcp-index` | 6 warnings |
| `npm run e2e:fast` | **950 passed, 0 flakes** (was 936 / 1) |
| CI `e2e.yml` (dispatched) | **all 9 jobs pass**, including the visual canary and all four full-suite shards |


---

# Pass 7 — 2026-09-03, trigger markers, the `@angular/aria` decision, and a flake class

Scope: the two decisions pass 6 left to the maintainer, taken on code- and library-quality grounds
rather than deferred again.

## The two decisions

**1. Trigger markers: adopted.** `MenuTriggerDirective`, `PopoverDirective` and `TooltipDirective`
each take a required `TemplateRef`, so they are **always property-bound and Angular emits no
attribute** — none could be located by its own selector. All three now carry a static
`data-tw-*-trigger` marker. `data-tw-*` is this repo's existing convention (`data-tw-table-loading`,
`data-tw-sort-arrow`, `data-tw-carousel-viewport`), so this is consistency, not new vocabulary.

The quality argument is not about our tests: **a directive that cannot be located by its own
selector is a testability defect affecting consumers**, who hit the same wall writing their own.
Payoff was immediate — `popover`'s harness lost **32 lines** of guard code that existed only to
disambiguate `aria-haspopup="dialog"` from date-picker triggers, and `tooltip`'s coverage hole
closed: bound `[twTooltip]="expr"` triggers were previously unreachable, and its spec contained a
test asserting that gap which predicted its own deletion.

**2. `@angular/aria`: NOT adopted.** This **reverses** the "adopt incrementally" decision recorded
in pass 6, which was taken before two costs were known. Full reasoning is now in `.claude/CLAUDE.md`
so the next author does not re-derive it. In short: an exact `@angular/cdk` peer pin imposing
lockstep CDK on every consumer; `KeyboardEventManager` defaulting to `stopPropagation: true`, so
any aria widget inside a CDK overlay swallows that overlay's Escape; and a pattern mismatch that
made the `command-palette` pilot unmergeable without weakening the guard that catches it. Recorded
positively as well: the flat-DOM / `tv()`-slot conventions are **not** the obstacle — that was the
expected blocker and it is not the real one.

## The flake class, which cost the most and is the most reusable finding

**`TestbedHarnessEnvironment` + zoneless + an overlay leave animation means `fixture.whenStable()`
may never resolve.** Every harness call routes through it. Around a leave animation it reliably
hangs rather than resolves.

Three consequences, each learned the hard way:

- **A poll bounded by a deadline checked *between* awaits cannot bound a single await that never
  returns.** Polling a harness method to wait for a state therefore **hangs** rather than fails —
  it timed out at the full 15000ms budget, which no timeout can fix. Wait by reading the DOM
  directly; `document.querySelector` needs no stabilization.
- **Reading the DOM fixes a final assertion but not the harness calls before it.** `close()`
  resolves its input through the same path. That is exactly why `tooltip` was salvageable (its
  waits were the problem) and `popover` was not (its calls are).
- **A suite-level budget is right for bounded real work and wrong for a fixed sleep standing in for
  a condition.** Harness specs are slower than unit specs *by construction*; the `menu` type-ahead
  flake was the other shape and was correctly fixed with virtual time instead.

### Three process failures worth more than the fix

1. **The flake was chased one file at a time** — `popover`, then `command-palette`, then `tooltip`
   — before being recognised as systemic. Several full-suite cycles wasted.
2. **The unsound polling pattern was written, diagnosed, removed from one file, and then
   REINTRODUCED** by restoring another file that still contained it. Removing a bad pattern from
   one site does not remove it from the branch.
3. **A flaky spec reached `develop`** in `e911bbb` (`command-palette`'s `closes with Escape`)
   before the class was understood. It is removed here, not skipped — a skip rots, and this repo
   has a whole mechanism for that problem.

## Outcome

| Component | Decision | Evidence |
|---|---|---|
| `tooltip/testing` | **withdrawn** | kept on the strength of 5 consecutive green LOCAL runs, then failed in CI — see the correction below |
| `popover/testing` | **withdrawn** | 3 tests hung at the full 15000ms budget in ~1 run in 3 |
| `command-palette` `closes with Escape` | **removed** | hung ~1 in 3; already on `develop`. Escape dismissal stays covered in `command-palette.spec.ts` directly against the component, and `close()`'s JSDoc records the gap |

**13 harness entry points ship** — pass 6's set, minus `popover` and `tooltip`.

### Correction, made the same day: local green is not evidence for this failure class

`tooltip/testing` was kept on **5 consecutive green local runs** and then failed the very first
`ci.yml` run on `develop`, with the same three tests hanging at the full 15000ms budget. It was
withdrawn.

The mistake is worth more than the fix: a load-dependent hang is a function of **contention**, and
a developer machine running one suite is not the environment that decides. Five local runs felt
like strong evidence and were the wrong evidence. For this class, **CI is the authority** — and it
was one push away the whole time.

This also cost a red `develop`: `28dd6a4` and `e1452fd` both failed `ci.yml` while `e2e.yml` stayed
green, so the trunk was broken between those commits and this correction.

The markers are the durable half: locatability is solved permanently, so restoring `popover/testing`
later is a spec problem, not a library one.

## Open — carried forward

> **Superseded.** Pass 8 closed the two border items below. Read the **Pass 8** section's
> "Open — carried forward" for the current queue.

Everything in pass 6's list except items 2 and 3, which this pass closed. Still open and unchanged:
the MCP index not covering `testing/` entry points; ~~`_light.css` failing the 3:1 border floor
(1.40–1.92, all seven roles) in the **default** scheme~~ (closed in pass 8); ~~`item.ts`'s selected
ring, which the theme layer cannot fix~~ (closed in pass 8); `core/form-reset.ts` awaiting deletion
or adoption; the `ThemeDirective` / `ThemeService` attribute disagreement; and the smaller
consistency items.

**`popover/testing` is newly open**, blocked on the `whenStable()` interaction rather than on
locatability.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run test:ci` | **3523 passed**, 4 skipped — **5 of 5 consecutive runs green** |
| `npm run build:lib` | pass |
| `npx ng build demo` | pass |
| `npm run lint` | 0 errors |
| `npm run verify:package` | pass |
| `npm run verify:mcp-index` | 6 warnings |


---

# Pass 8 — 2026-09-04, the light scheme's border floor and `tw-item`'s selected ring

Scope set by the maintainer: the two accessibility items pass 6 measured and pass 7 carried
forward unchanged — `_light.css`'s coloured `-border` tokens, and `item.ts`'s selected ring.
Both were described as "the last known accessibility failures in shipped ngx-tw code". **They
were not**, and the correction is the most useful thing this pass produced; see "What the fix
does not reach" below.

## Tier 1 — landed

| # | Item | Evidence |
|---|---|---|
| P8-1 | **Seven `{role}-border` tokens failed SC 1.4.11 in shipped `light`** — 1.40–1.92:1 against a 3:1 floor, in the **default** scheme, the mirror of the dark defect P6-8 fixed. Now 3.76–5.05 on surface, 3.45–4.87 on the soft fill. | **[measured]** |
| P8-2 | **`info`, `success` and `warning` also failed the floor on `-border-strong`** — 2.15–2.71 on surface, 2.07–2.54 on their own `-soft` fill. Nobody had said so: pass 6 reported light as a `-border` problem and the `KNOWN_FAILING` allowance swallowed all thirteen of the scheme's failing pairings behind one entry. Now 4.76–7.56 / 4.36–7.23. | **[measured]** |
| P8-3 | **`item.ts`'s selected ring moved to `ring-primary-border-strong`.** Verified before changing rather than taken from the register: the subtle tier on its own soft fill failed **7 of 8 roles in light, 4 of 8 in dark** — the register's figure, and the one that survives measurement. | **[measured]** |
| P8-4 | **`theme-token-parity.spec.ts` gained the sixth duplicated block.** `_semantic.css`'s `@theme` compiles to `:root, :host`, so it *is* the light scheme for any consumer who never sets `data-theme`, and its hand-copied values were checked against nothing. This change had to edit both by hand — exactly the drift that would not have been caught. They agreed (195 tokens, zero diffs); now it is enforced. | **[measured]** |
| P8-5 | **`.claude/CLAUDE.md`'s Borders table said `border-{color}-300` / `-500`** — palette steps, not tokens, and a licence to name steps directly that the Semantic Color Tokens section forbids. Corrected to the `-border` / `-border-strong` slots. | **[verified]** |

## The fix could not be confined to one tier, and that is the interesting part

The dark fix moved `-border` and left `-border-strong` alone, because dark's `-border-strong` was
already `{hue}-500` and cleared every floor. Light does not work that way. On white, contrast rises
with the step number, so "the dimmest passing step" and "the lightest passing step" point the same
way — and the lightest step clearing the target is, for four of the seven roles, **exactly where
`-border-strong` already sat**. Stopping there would have collapsed the two tiers, which
`theme-contrast.spec.ts` already forbade in a test written during pass 6 for precisely this.

So the rule had to be stated for both tiers:

- **`-border`** — the lightest palette step measuring **≥ 3.4:1** against `--color-surface`. This is
  `_dark.css`'s rule read in light's direction; the 0.4 margin over 3:1 is what stops a palette
  retune dropping the token below the floor silently. Applied to grey it re-derives `gray-500`, the
  value `--color-border` already ships — which is what makes it a rule rather than a fit.
- **`-border-strong`** — the next palette step darker than that role's `-border`.

```
  role        was         now          on surface  on soft   step below (fails)
  primary     blue-300    blue-500       3.76       3.45     blue-400   2.64
  secondary   slate-300   slate-500      4.77       4.55     slate-400  2.63
  accent      violet-300  violet-500     4.40       4.01     violet-400 2.85
  info        sky-300     sky-600        4.02       3.77     sky-500    2.71
  success     green-300   green-700      4.94       4.72     green-600  3.22
  warning     amber-300   amber-700      5.05       4.87     amber-600  3.19
  error       red-300     red-500        3.82       3.50     red-400    2.89
  neutral     unchanged (--color-border, gray-500)  4.84     4.39
```

`success` and `warning` travel two steps further than the rest because green-600 (3.22 / 3.07) and
amber-600 (3.19 / 3.08) clear the floor by 0.07 on the soft fill — inside the margin the rule
exists to hold. The spread of steps is the hues differing in luminance, not an inconsistency; dark
produced the same spread from the same rule.

**One consequence was accepted rather than designed around.** For `primary`, `accent`, `info` and
`error` the new `-border-strong` now equals that role's `-solid`, so the 1px rim on a solid-filled
indicator (`stepper.ts`, `timeline.ts`: `bg-{role}-solid border border-{role}-border-strong`) stops
reading as a separate edge. Those indicators carry their emphasis through the fill and the
`ring-4 ring-{role}-soft` halo. Buying the rim back costs two more steps of darkening on every ring
in the scheme, which is the worse trade — and for `primary` the two-step value collides with
`-solid-hover` anyway.

## What the fix does not reach — and why the "last known failure" framing was wrong

`theme-contrast.spec.ts` asserts the **semantic slots**. A component that names a palette step
directly bypasses them entirely, and the register's standing claim that there are "no raw Tailwind
palette colours anywhere in shipped source" is true but does not cover this: `border-primary-300`
is a semantic *token*, just a scale step rather than a slot, so it passes every sweep the register
has ever run while resolving to the same 1.81:1 the theme fix just removed.

Measured with `docs/research/2026-09-audit/p8-raw-scale-borders.mjs` — **14 of the 28 distinct
`border|ring|outline-{role}-{step}` utilities in library components sit below 3:1 against white**:

```
  1.40–1.92   border-{7 roles}-300      badge, button, card, collapsible, separator
  1.92        ring-error-300            switch
  2.15–2.71   border-{info,success,warning}-500
                                        checkbox, radio, select, slider, form-field,
                                        date-picker, date-range-picker, time-picker, paginator
  2.15–2.71   outline-{info,success,warning}-500
                                        combobox, paginator, slider, tags-input
```

**Not fixed here, deliberately.** It is ~20 components and every light visual baseline, and each
use needs its own judgment: SC 1.4.11 exempts purely decorative boundaries, so `separator`'s
coloured rule plausibly qualifies while `badge`'s outline — the badge's only boundary, the same
shape as the alert `outline` variant this pass just fixed — plausibly does not. The
`outline-{role}-500` rows are focus indicators, where the canonical `outline-primary-500` passes at
3.76 and only the three low-luminance hues fail. That is a pass, not a rider.

The instruction that produced them is fixed, which is the half that stops the debt growing:
`.claude/CLAUDE.md`'s Borders table pointed at `border-{color}-300` / `-500` and now points at the
slots. `alert` and the tab triggers were already on the slots; `badge`, `button`, `card`,
`collapsible` and `separator` followed the table.

## Two guards were changed, and both were proven to bite

- **`KNOWN_FAILING` is now empty.** The mechanism stays — the assertion is two-sided, so an entry
  added to buy time turns the list red the moment its scheme is fixed. Reverting one token
  (`success-border` → `success-300`) was confirmed to fail the spec before the entry was deleted.
- **The `{role}-border`-on-`{role}-soft` expectation was retired, not updated.** `item.ts` was the
  only site painting that pairing; once its ring moved tiers, the expectation would have recorded a
  number about a combination the library does not produce and no one could act on. What replaced it
  is stronger: `borderRatios()` asserts `-border-strong` on `-soft` for all eight roles in all four
  schemes against a hard floor with no allowance list. The retired dark numbers (2.37–2.97 for
  primary, accent, info, warning) are preserved in the spec's header so the measurement is not lost.
- The new `@theme` ↔ `_light.css` parity test was likewise confirmed to fail on an induced drift.

## Corrections to earlier passes

1. **`_semantic.css`'s scheme table said `light` fails the 3:1 floor.** It no longer does; the table
   now reads `✓` on all four schemes and states that the enforcement covers both tiers and both
   backgrounds.
2. **`_semantic.css` and `_dark.css` both pointed at `scratchpad/p6-contrast.mjs`** — a path that
   moved when `e1452fd` promoted the measurement scripts to `docs/research/2026-09-audit/`. Both
   now point at the real one. A "re-measure, do not estimate" instruction that names a missing file
   is an instruction to estimate.
3. **`_dark.css`'s note that light "fails the same floor WORSE"** was true when written and is now
   past tense, with a pointer to light's own table.

## Newly measured, not fixed, so the next pass does not re-derive it

- **`fg-subtle on surface-muted` measures 4.39:1 in light**, against the 4.5 floor for text. It is
  **pre-existing** — untouched by this change — and is not governed by `theme-contrast.spec.ts`,
  which covers borders only. It is not a one-line fix: raising `--color-fg-subtle` to `gray-600`
  collides it with `--color-fg-muted` and collapses the two foreground tiers, the same shape of
  problem the border tiers had here. Reproduce with `p6-contrast.mjs light dark`.
- The raw-scale sweep above.

## Open — carried forward

Pass 6's items 5 and 6 are **closed** by this pass. Everything else in pass 7's carried-forward
list stands unchanged: the MCP index not covering `testing/` entry points; `popover/testing`
blocked on the `whenStable()` interaction; `core/form-reset.ts` awaiting deletion or adoption; the
`ThemeDirective` / `ThemeService` attribute disagreement; the Escape-dismiss split across nine
overlay shapes; 28 files hand-rolling `let nextId = 0` against four using CDK's `_IdGenerator`; six
hand-rolled list navigations with no migration target now that `@angular/aria` is rejected.

**Newly open:** the raw-scale border sweep, and `fg-subtle on surface-muted`.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass — 56 entry points, 586 symbols |
| `npx ng build demo` | pass |
| `npm run test:ci` | **3517 passed**, 4 skipped — **5 of 5 consecutive runs green** |
| `npm run lint` | 0 errors, 79 warnings — all in `e2e/` |
| `npm run verify:package` | pass |
| `npm run verify:mcp-index` | 6 warnings |
