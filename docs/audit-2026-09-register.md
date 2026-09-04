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
  > **Read with pass 8.** Still true, and narrower than it sounds: it rules out `blue-500`, not
  > `primary-300`. A component naming a semantic *scale step* instead of a semantic *slot* passes
  > this sweep and every other one the register runs — and pass 8 measured 14 of 28 such
  > `border|ring|outline-{role}-{step}` utilities below the 3:1 non-text floor.

- **[Pass 8]** Now that `light` is raised, **all four schemes clear SC 1.4.11 on both coloured
  border tiers**, enforced by `theme-contrast.spec.ts` with an empty allowance list. **[measured]**
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
- ~~The raw-scale sweep above.~~ **CLOSED in pass 9**, except `border-warning-500` in checkbox /
  radio / paginator, which is a `-solid`-fill design question rather than a token swap.
- ~~**The alert `outline` variant has no visual baseline**~~ **CLOSED in pass 9** (`alert-variants`) — the `alert-colors` scene captures the
  `soft` variant, which `theme-contrast.spec.ts`'s header already noted in a different context. So
  the *primary consumer* of every `{role}-border` token is unphotographed, which is why a change
  to all seven moved exactly one baseline. Adding an `alert-variants` scene would make the next
  border change self-evidencing.

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
| `ci.yml` (dispatched on the branch) | pass |
| `e2e.yml` (dispatched on the branch) | pass |
| Visual baselines | 3 of 22 moved; **1 real** — `tabs-variants-light`, a 1px band at the active-tab underline, `#2b7fff`→`#155dfc` (blue-500→blue-600). The other two are ±1-unit antialiasing noise. No baseline changed dimensions, so nothing lost content — the pass-6 failure mode was checked for and is absent. |

**`e2e.yml` green is not coverage of this change, and should not be read as such.** The visual suite
has 22 baselines, and the Semantic Tokens swatch grid paints only the *neutral* `--color-border*`
trio — none of the seven coloured tokens. One 1px tab underline is the entire baseline coverage of
what pass 8 moved. The real evidence is direct inspection in the browser at `localhost:4600`: the
alert `outline` variant in situ (its boundary now reads as deliberate rather than a pale wash), and
a side-by-side of old-vs-new for the two judgment calls — the two border tiers stay clearly
separable at adjacent steps, and the solid-indicator rim collapse is confined to the four roles
predicted, where the `ring-4 ring-{role}-soft` halo already carries the emphasis. `success` and
`warning` in fact keep the *widest* tier gap of the eight roles.

---

# Pass 9 — 2026-09-04, the border failures the theme layer could not reach

Scope: the open item pass 8 created. `theme-contrast.spec.ts` asserts the semantic `-border` /
`-border-strong` **slots**; a component naming a palette step directly bypasses it entirely, and
14 of 28 such utilities measured below the 3:1 non-text floor.

## The pass's real lesson: a sweep is only as good as its assumed background

Pass 8 measured every raw-scale utility **against white**, because that is `--color-surface` in the
default scheme. Two of the three findings below exist because that assumption was wrong somewhere,
and neither would have been caught by re-reading the code.

1. **`switch`'s error ring is not on white.** `ring-error-300` sits on `bg-error-100` — its own
   track. Measured against white it looked like 1.92; measured against the track it is **1.57**.
   The sweep understated it.
2. **The `high-contrast` scheme was failing on all seven roles** (1.72–2.89) for the outline-variant
   boundary — in places *worse* than light, in the scheme that exists for users who need contrast.
   Nothing measured it, because the sweep only ever resolved the light scheme. It is fixed here as
   a by-product, which is luck, not method.

So the honest count for the outline-variant change is **18 failing pairings closed, not 7**: seven
in `light`, three in `dark` (primary 2.95, secondary 1.95, accent 2.76), seven in `high-contrast`,
one in `high-contrast-dark`. **Zero regressions in any of the four**, verified per role per scheme.

## Tier 1 — landed

| # | Item | Evidence |
|---|---|---|
| P9-1 | **Focus rings and focused-state borders moved onto `-border`.** slider (three maps), form-field, select, the three pickers, combobox, tags-input, input, paginator's ring. info 2.71→4.02, success 2.22→4.94, warning 2.15→5.05. | **[measured]** |
| P9-2 | **The swap is a pixel-for-pixel no-op on four of seven roles.** After pass 8, `--color-{role}-border` resolves to `{hue}-500` for primary/secondary/accent/error — the exact value these sites already used. That is what made a 95-site change safe. | **[measured]** |
| P9-3 | **`switch`'s error track ring** `ring-error-300` → `ring-error-border-strong`: 1.57 → 3.90 **on `error-100`**, the background it actually sits on. `-border-strong` is also the slot `_semantic.css` assigns to rings. | **[measured]** |
| P9-4 | **Outline-variant boundaries** (badge, button, card, collapsible) and separator's coloured lines, `-300` → `-border`. The identical shape `alert` already had right. 18 pairings closed across four schemes. | **[measured]** |
| P9-5 | **`alert-variants` visual scene added.** The `outline` variant — the only place `--color-{role}-border` is painted — had **no baseline at all**; `alert-colors` renders `soft`. Added *before* the `-300` sweep so that change was provable from a screenshot instead of re-verified by hand. | **[verified]** |

## The canonical focus ring was deliberately not touched

`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` appears
in **36 files** and is unchanged in all of them. It already clears the floor (3.76), `-border`
resolves to the same blue-500 so the swap would be invisible, and `.claude/CLAUDE.md` documents that
exact string in its Focus Rings section. Rewriting 36 files to change nothing, against a pattern the
instructions name verbatim, is churn that makes the next grep harder. The replacement therefore
skipped any line containing `outline-offset-2`.

## Open — the one thing deliberately not fixed, and why it is not laziness

**`border-warning-500` in `checkbox`, `radio` and `paginator`** (2.15:1 on white) is not a token
swap. All three paint a border the *same colour as a `-solid` fill*, and `--color-warning-solid`
**is** `amber-500` precisely because dark-on-yellow (`warning-solid-fg` = `amber-950`) is what makes
its glyph pass AA. Darkening the fill breaks the thing the fill was chosen for.

The real question is whether a **low-luminance-by-design solid surface needs a separate boundary
token**, and it applies to every `-solid` in the library, not these three. Both obvious fixes
(`border-{role}-border-strong` on the fill, or migrating the box to `bg-{role}-solid`) introduce a
visible rim on roles that do not currently have one — a design change wearing a contrast fix's
clothes. Note also that `success` at `green-600` measures 3.22: passing, but inside the 0.4 margin
pass 8's rule exists to hold, which is a second reason this wants its own analysis.

This is the same shape as the `time-picker` entry already in `A11Y_BACKLOG` — a component using a
hand-picked step where the theme ships an AA-checked pair — and should be resolved the same way.

## Traps worth recording

**Parametrised spec assertions build class names with template literals, including in the test
NAME.** `card.spec.ts` and `collapsible.spec.ts` carry ``it(`should apply border-${color}-300 …`)``
plus a matching `toContain`. A string sweep for `border-primary-300` finds neither. They failed
loudly on the next run, which is the good outcome — but a sweep that only greps literal class names
will report "no remaining references" while seven parametrised tests still assert the old value.

**A regex that matches a palette step by construction goes silently vacuous when the class becomes a
slot.** `card.spec.ts` asserted the outline variant applies exactly one coloured border via
`/\bborder-[a-z]+-\d{3}\b/` → `['border-primary-300']`. Against `border-primary-border` that returns
`[]`, and had the expectation been `[]`-tolerant it would have passed while testing nothing. Three
`not.toContain('border-…-300')` negative assertions had the same hazard: left naming a class that
can no longer appear, they pass because the string is gone, not because the component is right.

## A CI gate that fails as "cancelled" is worse than one that fails as "failed"

`e2e — accessibility` hit its `timeout-minutes: 15` on the first pass-9 run. GitHub reports a
timed-out job as **cancelled**, and the whole workflow's conclusion follows suit — which reads like
somebody stopped the run, not like a gate went red. On the one job whose entire purpose is catching
accessibility regressions, that is the wrong failure mode: it invites exactly the "9 of 10 passed,
ship it" reading.

It was not a test failure. The log shows **387 tests passed consecutively with zero failures** up to
the cut. Measured across recent runs the job takes **8m42s / 9m20s / 9m33s / 10m24s** — so the 15m
cap was a ~30% margin on a sweep that grows with every route added to `e2e/support/routes.ts`. It
was going to expire on its own; pass 9 just arrived when it did. Raised to 25m, matching the ~2.5x
margin the full-suite shards already budget (30m).

Two method notes, because both cost a cycle:

- **Re-running a single job is not a valid re-measurement.** `gh run rerun --job` cannot regenerate
  the `ngx-tw-dist` artifact that job's `needs` supplied, so it died at `download-artifact` with a
  403 in 42 seconds having run no tests. Dispatch the whole workflow instead.
- **Duration, not conclusion, was the diagnostic.** "Did my change slow it?" was answerable only by
  comparing the job's wall time against its own history — 9m33s on the re-measure, squarely inside
  the historical band, which is what cleared the change.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass |
| `npx ng build demo` | pass |
| `npm run test:ci` | 3517 passed, 4 skipped |
| `npm run lint` | 0 errors, 79 warnings — all in `e2e/` |
| `npm run verify:package` | pass |
| `npm run verify:mcp-index` | 6 warnings |
| Visual baselines | 2 created (`alert-variants` light/dark), 6 modified. All dimensions unchanged; light diffs confirmed as the intended tokens (`#7bf1a8` green-300 → `#008236` green-700; `#8ec5ff` blue-300 → `#2b7fff` blue-500). The new alert scene was read by eye and captures the full section, outline border included. |

---

# Pass 10 — 2026-09-04, making pass 9 permanent

Scope: one thing. Pass 9 fixed every raw-scale border, ring and focus outline in the library, and
**nothing stopped the next component reintroducing one.** `.claude/CLAUDE.md` says to use the
`{role}-border` slot; `theme-contrast.spec.ts` asserted the slots themselves. Neither asserted what
components actually *use*. That gap is precisely how 14 of 28 such utilities shipped below the floor
for the life of the library.

## What was added

A second `describe` block in `theme-contrast.spec.ts` — the same file, deliberately, so it reuses
the colour maths that file already validates against Tailwind's published hexes rather than
duplicating it. It walks shipped component source for
`(border|ring|outline|divide)-{role}-{step}`, resolves each through **all four schemes**, and
asserts 3:1 against that scheme's `--color-surface`.

**It measures rather than pattern-matches, and that distinction is the design.** A lint rule banning
the syntax would also reject `outline-primary-500` — the canonical focus ring CLAUDE.md documents
verbatim, present in 36 files, which passes comfortably at 3.76. Banning a *spelling* would have
forced 36 files of churn to change nothing. The rule that matters is the contrast floor, so that is
what is asserted.

**Both sides were proven to fail before the guard was kept:**

- Reintroducing `border-success-300` in `badge.ts` produced
  `light: success-300 = 1.40:1 (badge/badge.ts)` **and**
  `high-contrast: success-300 = 1.78:1` — it names the file, and it caught the high-contrast
  scheme, which is exactly the blind spot that made pass 9 necessary.
- A bogus `RAW_SCALE_BACKLOG` entry was reported as `stale`, so the allowlist cannot rot into
  permission. Same two-sided shape as `KNOWN_FAILING` and `A11Y_BACKLOG`.

The backlog carries exactly one entry: `warning-500`, the deferred `-solid`-fill boundary question
in checkbox / radio / paginator, with the amber-500-is-load-bearing reasoning attached.

## The limitation is stated in the guard itself, not discovered later

It resolves each utility against its scheme's `--color-surface`, because that is where the
overwhelming majority are painted. A utility on a **coloured** background is not covered — and the
assumption is **not always conservative**: `switch`'s error ring sits on `bg-error-100` and measured
**1.57** there versus 1.92 against white. Worse, not better. The guard's own doc comment says so, so
green here is not mistaken for completeness.

`theme-node-shims.d.ts` gained `readdirSync` + `Dirent`, declared narrowly at the single call site's
shape rather than guessing at `@types/node`, which remains not a dependency.

## Still open

- **The `-solid` boundary question** (`warning-500` in checkbox, radio, paginator) — the one real
  contrast defect left, deferred because it applies to every `-solid` in the library.
- **`fg-subtle on surface-muted` = 4.39:1** against a 4.5 text floor in light — pre-existing, not
  border-governed, needs the fg-tier analysis.
- **The `dark:` rule is still unenforced.** CLAUDE.md calls it "greppable as a lint rule" and
  nothing greps it. This pass deliberately did not expand to cover it — pass 6 already found that a
  documentation comment in `file-upload.ts` and a demo page resurrect dead `dark:` utilities through
  Tailwind's scanner, so a naive guard would need to reason about comments and about the demo. Same
  shape of problem, its own pass.
- The consistency items: Escape-dismiss split; `_IdGenerator` (4 files vs 28 hand-rolling an id
  counter); `core/form-reset.ts` delete-or-adopt.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run test:ci` | **3519 passed**, 4 skipped (was 3517 + 2 guard tests) |
| `npm run build:lib` | pass |
| `npm run lint` | 0 errors, 79 warnings — all in `e2e/` |
| Guard forced-failure | both sides confirmed red before being kept |

---

# Pass 11 — 2026-09-04, the `-solid` boundary, and the pairing nothing asserts

Scope: the item passes 9 and 10 both deferred — `border-warning-500` in `checkbox`, `radio` and
`paginator`, 2.15:1 against white.

## The deferral was right, and the reason it was right is not the reason given

Both earlier passes deferred this as "a `-solid` design question applying to every `-solid` in the
library". Measurement says something sharper: **the component defect is `light`-only and
`warning`-only**, and the fix that looked most principled would have caused a regression.

`A11Y_BACKLOG` already contains the tempting precedent — `time-picker` was fixed by migrating from a
hand-picked step to "the theme's AA-checked `{role}-solid` / `-solid-fg` pair". Applying that here
would have been **wrong**, because the components use the role *scale step* and the theme's `-solid`
is a different value:

| scheme | `--color-warning-500` (what components use) | `--color-warning-solid` |
|---|---|---|
| `light` | `amber-500` — **2.15 FAIL** | `amber-500` — 2.15 |
| `high-contrast` | `amber-600` — **3.19 pass** | `amber-400` — **1.72** |

So "migrate to `-solid`" would have taken high-contrast from **3.19 to 1.72** — turning a passing
scheme into the worst failure in the set, in the scheme that exists for users who need contrast.
Verified against `_high-contrast.css:103` and `:212`.

## The fix

Leave the fill; give the boundary its own token. `border-warning-500` →
`border-warning-border-strong` at five sites (checkbox `SOLID_BOX` + `OUTLINE_BOX`, radio
`SOLID_RING` + `OUTLINE_RING`, paginator's active page). The `*_DOT` maps are the inner mark rather
than the boundary and are untouched.

Why this is proportionate rather than a blanket change: `--color-warning-border-strong` and
`--color-warning-500` are **the same value in `dark`** (both `amber-500`, `_dark.css:129` / `:313`),
so **no rim appears in dark at all**. The rim shows in `light` (amber-800, 7.13 on a 2.15 fill),
and in the two high-contrast schemes where a stronger edge is the point. The visual change is
exactly proportional to the need — none of the "6 of 8 roles grow a rim" churn that a universal
`-border-strong` boundary would have caused.

**Every raw-scale border, ring and outline in the library now clears 3:1 in all four schemes.**

## The guard flagged its own obsolescence, unasked

Pass 10's `RAW_SCALE_BACKLOG` carried exactly one entry, `warning-500`. The moment the fix landed,
the two-sided assertion reported it as **stale** — before anyone thought to go and delete it. That
is the mechanism working as designed and is worth recording as evidence that the shape
(`KNOWN_FAILING`, `A11Y_BACKLOG`, this) earns its keep. The list is now empty.

## Newly measured and NOT fixed: the fill-against-page pairing is unasserted everywhere

`--color-warning-solid` measures **2.15:1 against `--color-surface` in `light` and 1.72:1 in
`high-contrast`**. Every component painting a solid warning fill inherits it — alert, badge, button,
stepper, timeline, toast.

**Nothing asserts that pairing anywhere.** `borderRatios()` covers the two border tiers.
`p6-contrast.mjs` covers `solid-fg` on `solid` — the *text on* the fill — but never **the fill
against the page**. Pass 10's guard does not close it either: its regex is
`(border|ring|outline|divide)-{role}-{step}`, so a `bg-` utility is never scanned. That is how a
1.72 survives in the high-contrast scheme with a full contrast suite green.

Not fixed here because it is genuinely the library-wide `-solid` question, and it has a real
constraint: `warning-solid` cannot simply be darkened without breaking the dark-on-yellow pairing
that makes its foreground pass AA. The honest options are a separate `--color-{role}-solid-border`
token, or accepting that solid warning surfaces need a boundary the way these three now have one.

## Also noted, not chased

`success-600` measures **3.22** in light — passing, but inside the 0.4 margin pass 8's rule exists
to hold. Recorded so a future palette retune does not drop it silently.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run test:ci` | **3519 passed**, 4 skipped |
| `npm run build:lib` | pass |
| `npx ng build demo` | pass |
| `npm run lint` | 0 errors, 79 warnings — all in `e2e/` |
| Raw-scale sweep | **0 of 9 utilities below 3:1** (was 14 of 28 at pass 9's start) |

---

# Pass 13 — 2026-09-04, production hardening rather than defect hunting

Scope set by the maintainer, and it is a change of objective rather than another sweep: *"I don't
want to find new defects, I want to make sure the library is production grade, solid and well done
code, fluent API, and robust overall."*

## The baseline is strong, which is the first thing worth recording

Measured before changing anything, so later passes do not re-derive it:

| signal | result |
|---|---|
| `any` in shipped source | **3**, across ~400 files |
| `TODO` / `FIXME` / `HACK` | **0** |
| JSDoc on public inputs | essentially complete — two single-input gaps |
| SSR safety | **safe** — all 17 DOM-touching files verified individually |
| Suite | 3521 passing, 56 entry points, consumer-install verified |

**The SSR check is worth stating positively.** 17 files reference `document.` / `window.` while only
4 inject `DOCUMENT` or check `PLATFORM_ID`, which looks alarming and is not: four are test harnesses
(browser-only by construction), `theme.bootstrap.ts` and `theme.meta.ts` contain the DOM calls
*inside exported strings* rather than executing them, `carousel.ts` guards with
`typeof document !== 'undefined'`, and the rest sit on focus-handler paths that cannot run on a
server. Nothing to fix. Do not re-open this on the raw grep count.

## What was changed

| # | Item | Why it is a production-grade issue |
|---|---|---|
| P13-1 | **`core/form-reset.ts` deleted.** | Never exported, zero importers. The decisive reason is architectural, not statistical: `onFormReset()` needs an **injection context**, and `calendar` — its only intended consumer — deliberately defers that same `NgControl` lookup to `ngOnInit` to avoid the DI cycle its self-provided `NG_VALIDATORS` creates. Incompatible with the one component it was written for. |
| P13-2 | **`provideTheme({ attribute })` deprecated.** | A public option that **cannot work**: the stylesheets key off the literal `data-theme`, four files declare `[data-theme="…"]` blocks, and CSS cannot parameterise an attribute name. Both files documented the caveat; the API should not have carried the trap. Deprecated not removed (breaking); verified the `@deprecated` reaches the shipped `.d.ts`. |
| P13-3 | **`consumeOverlayEscape` dogfooded in `popover`.** | It is exported from `core/index.ts` — a public compatibility promise — with **zero library importers**, while `popover` duplicated its body inline. |
| P13-4 | **An untested overlay path covered.** | Neutering popover's overlay Escape handler left the **entire suite green**. The specs press Escape on the *trigger* (host `(keydown.escape)`); Escape from inside the panel arrives only through the CDK overlay's `keydownEvents()` channel, and that path had never been tested. |
| P13-5 | **470 class assertions made capable of failing.** | See below — the most consequential item. |
| P13-6 | **`tabs.dismissible` added, `closable` deprecated.** | One idea, two spellings. |

## P13-5: the suite contained 75 assertions that could not fail

`expect(el.className).toContain('x')` is a **substring** match against a space-joined string, so it
passes on any longer class sharing the prefix:

```
toContain('bg-surface')           also matches bg-surface-muted / -sunken / -raised
toContain('border-t')             also matches border-transparent
toContain('border-border')        also matches border-border-strong / -muted
toContain('ring-primary-border')  kept passing after the class became ring-primary-border-strong
```

The last one is not hypothetical — it happened **twice in this audit**. All ~470 are now
`classList.contains(...)`, which is exact and order-independent. The suite still passes, so nothing
depended on the loose behaviour. Demonstrated rather than asserted: changing `card`'s `bg-surface`
to `bg-surface-muted` **passes** the old form and **fails** the new one.

## Three CLAUDE.md rules were wrong, and the code was right

This pass changed the instructions three times without changing the code, which is the pass-5 lesson
(*"the specification drifts faster than the source"*) recurring:

1. **The `_IdGenerator` "drift" is not worth converging.** Measured against the installed CDK:
   `_IdGenerator` keeps its counters in a **module-scope `Map`**, exactly like `let nextId = 0`. Not
   per-injector, so the 28-file migration buys no robustness — and the SSR worry behind it is benign
   anyway, since a component's host id and label id come from the same counter in the same render
   pass. That left a large refactor onto an underscore-prefixed, private-by-convention symbol for
   cosmetic uniformity. **Do not do it.**
2. **"Do not test class names" is too broad.** 47 of 75 spec files violate it, so taken literally the
   suite has been non-compliant since the beginning. This is a Tailwind library in jsdom where
   nothing is computed and the class is the only observable proxy. The rule now says what it actually
   protects against, and mandates `classList.contains`.
3. **The form controls' bare `change` output is a carve-out, not drift.** `checkedChange` (from the
   `model()`) fires on **any** change including programmatic; `change` fires **only** on user
   interaction, every one documents it, and it is the name Material uses. Pass 5's own F-6 draft
   nearly deprecated these before re-reading the emit sites falsified it — two audits have now
   reached the edge of the same breaking rename.

## The dismissal-API survey shrank on inspection

"Five vocabularies for one concept" turned out to be **one** outlier and four justified spellings:
`dismissible` + `closeOnX` are the canonical capability/gesture pair; popover's `tw`-prefix is
required because it is an **attribute directive** whose unprefixed inputs would collide; and
`disableClose` is **CDK's own property** — `TwDialogConfig extends CdkDialogConfig` — so renaming it
would fight the base class and diverge from Material's vocabulary.

Only `tabs.closable` was drift, and one alias closes it. Recording the four justifications matters as
much as the change: pass 5's "nine shapes of dismissal API" counted shapes without separating the
justified from the drifted, and that framing invites a breaking rename that would make the library
**less** conventional.

## Open

- **`popover/testing` and `tooltip/testing` remain withdrawn.** The pass-7 blocker
  (`TestbedHarnessEnvironment` + zoneless + a leave animation means `whenStable()` may never resolve)
  is unchanged; the trigger markers that unblock *locatability* are in place. This is a real gap in
  the **consumer's** experience: 13 entry points ship harnesses, popover and tooltip do not.
- **The `dark:` rule is unenforced but NOT violated.** Re-measured 2026-09-04, correcting an
  overstatement made earlier in this same pass: all 12 `dark:` hits in shipped library `.ts` are
  **prose inside comments** ("Slot tokens own light/dark contrast — no `dark:`"). **Zero real
  utilities.** One live utility exists in the **demo** — `dark:ring-primary-800` — not in the
  library. So the rule holds in practice and only the guard is missing; pass 6's finding that a
  documentation comment in `file-upload.ts` resurrects a dead utility through Tailwind's scanner is
  what makes a naive grep insufficient. Low priority.
- **`fg-subtle on surface-muted` = 4.39:1 is a token measurement with NO governed painted
  instance.** Also corrected 2026-09-04. The number is real and is the single remaining failure in
  the 90-pairing sweep, but the only place the library pairs them directly is `stepper.ts:161`
  `INDICATOR_DISABLED` — a **disabled** state, which SC 1.4.3 explicitly exempts. Its sibling
  `INDICATOR_PENDING` uses `text-fg-muted` (6.87, passing), and `calendar-header` pairs
  `disabled:text-fg-subtle` with `disabled:hover:bg-transparent`, so the muted background never
  applies. Worth keeping recorded because a future component could pair them in an *active*
  context — but it is not a shipped accessibility failure. Not trivially fixable either:
  `--color-fg-subtle` is `gray-500` and `--color-fg-muted` is `gray-600`, so raising subtle to
  clear 4.5 collapses the two foreground tiers — the same trap the borders hit in pass 8.
- The remaining consistency items: the Escape-dismiss *implementation* split (three overlapping
  abstractions, one now dogfooded), and `_IdGenerator` — **closed as won't-do**, above.

---

# Pass 14 — 2026-09-04, the harness blocker root-caused: it was never about overlays

Scope: close the audit's last open item — 13 of 15 overlay-ish entry points ship a `testing/`
harness, `popover` and `tooltip` do not, so a **consumer** has no supported way to test them.

**Outcome: both ship, and the seven-pass-old blocker is fixed at its cause.** 15 harness entry
points, 73 exported. The fix is one option in `angular.json`, and the value of this pass is almost
entirely in what had to be falsified to find it.

## Three diagnoses died, in order, each to a measurement

**1. "An overlay leave animation."** Pass 7 recorded this three times — in the register and two
commit messages. Measured in the actual Vitest/jsdom environment:

```
PROBE getAnimations: undefined
```

Angular gates its whole native-animation implementation on
`typeof document?.documentElement?.getAnimations === 'function'`
(`@angular/core/fesm2022/_debug_node-chunk.mjs:3998`), and every `animate.leave` entry point returns
early when it is false. jsdom does not implement the Web Animations API, so **`animate.leave` is
inert in this suite** — for these two and for the six overlay components whose harnesses shipped
green throughout. The named cause could not have been the cause.

**2. "`fixture.whenStable()`."** This was my own hypothesis and it took three red CI runs to kill:

| Attempt | What was removed | Result |
|---|---|---|
| method bodies wrapped in `manualChangeDetection()` | the per-method await | `ci.yml` red — all 9 `tooltip` tests |
| acquisition wrapped too, via `load()` / `loadAll()` | the `getHarness` await | `ci.yml` red — all 8 **`popover`** tests |
| `beforeEach`'s own `await fixture.whenStable()` deleted | the last one | `ci.yml` red — all 9 `tooltip` tests |

After the third, `grep -c whenStable` over both harnesses and both specs returned **zero**. It still
hung. Stabilization was a symptom.

That second failure paid for itself twice: the failure **moved component between runs**, so it was
never a `tooltip` problem — and `popover`'s perfect record up to that point had been a run tally, the
same instrument pass 7 was corrected for trusting.

**3. "Leaked fake timers."** With `isolate` defaulting to `false` this would have explained
everything, and 17 spec files use them. A probe throwing on `vi.isFakeTimers()` as the first
statement of `beforeEach` **did not fire** in the run that reproduced. All 17 also pair their calls
with a restore, `menu`'s inside a `finally`. Dead.

Also ruled out by measurement, so nobody re-derives them: CPU starvation (14 busy Node processes on
8 cores provoked nothing) and the components themselves (`tooltip.spec.ts` and `popover.spec.ts` are
green every run; the tooltip pair in isolation passed 6 of 6).

## The observation that cracked it

From the run that reproduced, three facts together:

1. **No `Hook timed out` anywhere** — `beforeEach` completed, probe and all. The test **body** hung.
2. **Every test in the affected file died at exactly the 5 000 ms suite budget**, guards included.
3. **The guards' own `setTimeout(…, 1000)` bail never fired.** They are
   `Promise.race([work, bail])`, so a working timer would have rejected them at 1 000 ms with a
   named error, four seconds early. It did not.

A real `setTimeout` registered inside the test, with real timers confirmed at `beforeEach`, that
never runs, means **the worker's macrotask queue is starved**. Everything else follows and needs no
separate explanation: Angular's zoneless scheduler drives its tick from `setTimeout` raced with
`requestAnimationFrame`, so a starved queue means the tick never runs, the pending task is never
cleared, and `whenStable()` **cannot** resolve. That is why it looked like a stabilization bug for
seven passes, and why every fix aimed at stabilization failed.

## The cause, and the fix

**`isolate` defaults to `false`** in `@angular/build:unit-test`. The schema says so in as many words
— *"Defaults to false to align with the Karma/Jasmine experience"* — and the executor hardcodes
`isolate: false`. Spec files in a worker therefore share the module registry, the globals, and
anything still running. A runaway **microtask** loop left behind by an earlier file starves
macrotasks exactly like this, because microtasks drain to exhaustion before any timer runs.

The discriminating experiment, 16 full-suite runs with both harnesses in:

| Arm | Result |
|---|---|
| `--isolate` | **8 of 8 green** |
| default | **1 red of 8** |

**Be honest about the strength of that.** Across this whole pass the default-mode red rate measured
~4 in 23 (~17%), so eight green isolated runs alone put the null at p ≈ 0.22. The tally is not the
evidence. Two things are: the mechanism is removed **by construction** (files that do not share a
process cannot leak into each other), and **CI, which had been red 3 of 3 with the harnesses in, is
the instrument that decides** — pass 7's own correction says exactly this.

The fix is `"isolate": true` on both `test` targets in `angular.json`.

**It costs wall-clock**, and that is the trade being made deliberately. Measured on `ci.yml`, which
is the number that matters for the gate: the `unit tests` job goes **74 s → 121/139/135 s** across
three green isolated runs, against the last green non-isolated run — call it **+80%**. Locally the ratio is worse
(~80 s → ~2–2.5 min) because a dev machine has more cores to lose to per-file processes.

**There is a second cost, and it is not wall-clock.** A process per file needs process slots, so on
a saturated machine the suite stops being able to start workers at all:
`[vitest-pool]: Failed to start forks worker … Timeout waiting for worker to respond`, 14 files in
one run. That was measured at **load average 21–30 on 8 cores** — roughly 3.5× oversubscription,
caused by unrelated work on the same box, not by the suite. It has never been seen on `ci.yml`,
whose runner is dedicated. Worth knowing before someone reports it as a new flake: it is a symptom
of the machine, and the tell is that the failures name *files that could not start* rather than
tests that failed. The hazard it retires has cost three
passes, one deleted test, one misattributed flake fix and two harness withdrawals, so the trade is
worth it — but if a future maintainer wants the speed back, the alternative is to find the single
file that leaks a runaway loop rather than isolating all 97. That hunt is now well-posed: it is a
microtask loop, and `.claude/CLAUDE.md`'s signal-cycle section describes the shape that produces one.

## The finding is suite-wide, and it has been misread three times

Not about `popover` or `tooltip`. The same signature, three passes, three explanations:

| Pass | Test | Called | Actually |
|---|---|---|---|
| 7 | `menu` type-ahead | a fixed sleep racing the budget; fixed with virtual time | virtual time makes that test drive its own clock, hence immune to a starved queue — consistent with the sleep never having been the cause |
| 7 | `command-palette` "closes with Escape" | part of the leave-animation class; test deleted | same hazard |
| 14 | `popover` / `tooltip` harness specs | the leave animation, then `whenStable()` | starved macrotask queue |

`command-palette`'s deleted test can be restored now. It was removed for this, and `close()`'s JSDoc
records the gap it left.

## What the harnesses ship with

The `manualChangeDetection` machinery is kept even though the root cause is fixed, because it is
proven and because a stabilization await is a real hazard independent of this bug. It is checkable
by reading rather than by counting runs: `grep -c whenStable` over both entry points returns zero.

- **Both harnesses host on their pass-7 markers.** `PopoverHarness` on `[data-tw-popover-trigger]`,
  which deletes ~32 lines of `aria-haspopup="dialog"` disambiguation plus its spec test. *(The
  register credited that saving to pass 7; it was never realised there — no post-marker popover
  harness exists anywhere in history. The file was deleted in `2b9455c`, before the markers landed
  in `28dd6a4`, and the two versions are byte-identical.)*
- **A deterministic guard for stabilization hangs.** `PendingTasks` is public Angular API and
  `add()` returns a release function, so holding one entry open makes `whenStable()` unable to
  resolve on demand, in any environment, with no contention — the production failure without the
  probability. Bounded by `Promise.race`, which does the one thing a polling deadline cannot:
  **bound a single await that never returns**. Verified by breaking it four ways; removing
  `manualChangeDetection` from `hide`, `load`, `getText` or `loadAll` each goes red in about a
  second naming the method.
- **`load` / `loadAll`**, because `loader.getHarness` stabilizes twice: `getAllRawElements` calls
  `forceStabilize()`, and `HarnessPredicate` filtering routes through `parallel()`, which awaits
  `whenStable()` on **every fixture in `activeFixtures`** — worker-wide module state in
  `@angular/cdk/testing`, not just this test's fixture. Worth knowing before the next harness is
  written.

## The other two open items were re-measured, not assumed, and neither needed work

- **The `dark:` rule holds.** All **12** hits in shipped library `.ts` are prose inside comments;
  **zero** real utilities. Confirmed against the source, not the record.
- **`fg-subtle` on `surface-muted` still has no governed painted instance.** `stepper.ts:161`
  `INDICATOR_DISABLED` remains the only direct pairing and is a disabled state (SC 1.4.3 exempt);
  `INDICATOR_PENDING` beside it uses `text-fg-muted`. `calendar-header`'s two slots pair
  `disabled:text-fg-subtle` with `disabled:hover:bg-transparent` on the same element, so the muted
  background never applies — verified by reading both class strings in full.

## Open

- **The specific file that leaks the runaway loop is not identified.** `isolate: true` contains the
  hazard rather than removing its source, and it costs run time. Worth hunting only if that cost
  bites.
- **`command-palette`'s "closes with Escape" harness test can be restored** — it was deleted in
  pass 7 for this hazard.
- **The two new harnesses carry `load` / `loadAll` and the other 13 do not.** Either port the
  pattern or drop it once `isolate: true` has soaked; the inconsistency should not stand
  indefinitely.
- **The MCP index still does not cover `testing/` entry points** — `verify:mcp-index` reports 56,
  excluding all 15. Unchanged deliberately: the index feeds consumer-facing component guidance.
- The remaining consistency items are unchanged from pass 13: the Escape-dismiss implementation
  split, and `_IdGenerator` (closed as won't-do).

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass — 56 entry points + **15 `testing/`** |
| `npx ng build demo` | pass |
| `npm run lint` | 0 errors, 79 warnings — all in `e2e/` |
| `npm run verify:package` | pass — **73 entry points exported** |
| `npm run verify:mcp-index` | 6 warnings |
| `ci.yml` **with the fix** | **3 of 3 green** (`unit tests` 121 s / 139 s / 135 s) |
| `ci.yml` **without it**, same harnesses | **3 of 3 red** |

**Local `test:ci` verification was not completed, and that is stated rather than glossed.** The
machine sat at load average 21–35 on 8 cores throughout the verification window because of unrelated
work, and at that oversubscription the suite produces artefacts that are not the thing under test:
one run lost 14 files to `Failed to start forks worker`, another lost a single unrelated
`dialog.spec.ts` test at 5223 ms against a 5000 ms budget. Both harness specs passed in both. The
five-run local gate should be re-run on a quiet machine before this is treated as fully verified;
the `ci.yml` evidence above is what the decision rests on, which is what pass 7's own correction
prescribes — **CI is the authority for this failure class.**

**Statistical honesty, since this pass twice caught the suite out on exactly this.** Three green CI
runs against three red ones is the load-bearing evidence, and it is strong precisely because the
pre-fix CI failure rate was 3 of 3 rather than the ~17% seen locally. The 8-of-8 local isolated arm
is *supporting* evidence only: against a ~17% baseline it puts the null at p ≈ 0.22 on its own. What
makes the fix credible is neither tally but the mechanism — files that do not share a process cannot
leak into one another.

---

# Pass 15 — 2026-09-04, the timer leak: pass 14's diagnosis was also wrong

Scope: the four items pass 14 left open. Three are closed here, and the first of them closes the
whole seven-pass thread — **including pass 14's own diagnosis, which was wrong in the same way as
pass 7's, one layer further in.**

## P15-1: the leaker, found

**`carousel.spec.ts:830-832` and `code-block.spec.ts:232-233`.** The mechanism, traced rather than
inferred:

```ts
vi.useFakeTimers();                   // globalThis.setTimeout = Sinon's fake
vi.spyOn(globalThis, 'setTimeout');   // the spy captures the FAKE as its "original"
setSpy.mockRestore(); vi.useRealTimers();   // the file ends healthy — measurably so
```

Vitest then runs, after **every** spec file (`vitest/dist/chunks/base.RR7zL1h0.js:97`,
commented *"mocks should not affect different files"*):

```js
vi.restoreAllMocks();
```

That re-applies the captured original — putting Sinon's fake back **after** `useRealTimers()` has
uninstalled its clock. What remains accepts callbacks and never runs them, for every later file in
the same worker under `isolate: false`. Angular's zoneless scheduler ticks from `setTimeout`, so no
tick, no `PendingTasks` clear, and `whenStable()` can never resolve.

Both call sites now patch the global by **plain assignment**, which never enters Vitest's mock
registry, so `restoreAllMocks()` has nothing to re-apply.

## Two things pass 14 got wrong, and they are the lesson

**1. "It IS a starved macrotask queue" — falsified.** In a hung file `setImmediate` fired in
3–16 ms while `setTimeout` never resolved. The event loop was alive throughout; nothing was starved.
Pass 14's *observation* — a real `setTimeout(…, 1000)` registered inside the test that never fired —
was correct and was the right thing to notice. The *inference* drawn from it was wrong: the queue
was not blocked, the function was dead.

**2. "Leaked fake timers" was rejected for the wrong reason.** Pass 14 probed
`vi.isFakeTimers()` at the start of `beforeEach`, saw `false`, and struck the hypothesis off. The
flag *is* restored; it is the **function** that is not. The probe tested a proxy for the thing rather
than the thing — which is the exact failure `.claude/CLAUDE.md` already warns about in the
`ControlValueAccessor` section (*"verify a claim about a component against that component, not a
model of it"*). A hypothesis was killed by a measurement that could not have detected it.

The contradiction that eventually cracked it was sitting in pass 14's own evidence and was noted
without being followed: **the guards died at the suite's 5000 ms rather than at their own 1000 ms
`Promise.race` bail.** `@vitest/runner`'s `withTimeout` uses `getSafeTimers()` — stashed native
timers — so Vitest's budget fires while user-land timers are dead. Pass 14 called that observation
"the linchpin", reasoned from it to a starved queue, and stopped one step short.

## P15-2: `isolate: true` reverted, and the cost recovered

v0.8.0 set `"isolate": true` to *contain* a cause it could not name. The cause is now removed, so the
mitigation is no longer earned. Reverted.

The gate was chosen because it is a real test rather than a tally: **`ci.yml` was 3 of 3 RED without
isolation before the fix.** After it:

| | `unit tests` job |
|---|---|
| pre-fix, no isolation | **3 of 3 red** |
| post-fix, no isolation | **3 of 3 green** — 71 s / 69 s / 68 s |
| with isolation (v0.8.0) | green — 121 s / 139 s / 135 s |
| pre-audit baseline | green — 74 s |

So the +80% CI tax is fully repaid, and the suite is marginally faster than before the audit began.

## P15-3: a guard, because the next occurrence must not cost another pass

`projects/ngx-tw/test-setup.ts` now compares the global timer functions against a baseline at each
spec-file boundary and fails loudly, naming the cause, instead of hanging an innocent file. Two
details are load-bearing and should not be "cleaned up":

- The baseline is stashed on **`globalThis`, not module scope** — the setup file is re-evaluated per
  spec file, so a module-scope capture would re-capture the already-poisoned function and never fire.
- It is keyed to the window object, so a legitimately fresh environment re-baselines rather than
  failing.

Proven to bite: re-introducing the bug fails one file in 2.4 s with a message naming the cause.

## P15-4: `command-palette`'s deleted Escape test, restored

Pass 7 deleted `closes with Escape` from the command-palette harness spec because it hung on this
same hazard. It is back, rewritten to poll the DOM on a bounded deadline rather than sleep a fixed
250 ms, and **verified to bite**: neutering only the `Escape` case in `handleOverlayKeydown` gives
exactly 1 red and 9 green, failing through the poll's own named error rather than an assertion diff.

Its `HARNESS_TIMEOUT_MS = 15_000` budget is dropped, on a structural argument rather than a
measurement: a bounded poll **cannot** consume a suite budget — it fails at ~2 s with a diagnostic
however large the budget is — so the 15 s budget was guarding a failure mode the poll forecloses.

The harness's `close()` JSDoc also claimed in bold *"This method is not covered by a spec"*. That
ships to the `.d.ts` and a consumer's IDE hover, so landing the test while it stood would have been
this audit's own recurring failure: a record that outlived the fact.

## P15-5: the stabilization-free harness machinery was a defect, not insurance — removed

Pass 14 wrapped every `popover` / `tooltip` harness method in CDK's `manualChangeDetection()` and
added static `load` / `loadAll` doing the same for acquisition. It justified this as cheap insurance
that "removes a real dependency". **That was wrong, and the cost is measurable on the real harness.**

`manualChangeDetection()` sets the module-global flag `forceStabilize()` early-returns on
(`testing-testbed.mjs:644`), so `detectChanges()` **and** `whenStable()` never ran; a one-macrotask
yield stood in for both. Probed against a popover whose content resolves behind a real
`PendingTasks` entry — which is exactly what `httpResource()` / `resource()` register:

```
under the pass-14 wrapper  ->  getText() === 'loading'
plain harness              ->  getText() === 'resolved'
```

Non-vacuous: flipping the assertion to `'resolved'` went red. So the wrapper **silently removed the
harness's core service — stabilization — from public API**, to work around a defect in *this
repository's own suite* that no consumer has. Two lesser costs came with it: `forceStabilize()` also
carries the destroyed-fixture check the wrapper skipped, and `disableAutoChangeDetection` is a
global boolean rather than a counter, so in `Promise.all([h.isOpen(), h.getText()])` whichever
settles first re-enables auto-CD underneath the other.

Both harnesses are now the plain CDK shape the other 13 use. Porting the machinery to those 13 was
the alternative and was rejected for the same reason, more so: it would spread silent staleness to
the form controls (combobox, the pickers, tags-input, transfer, file-upload) where async content is
most likely.

**`load` / `loadAll` are removed, and that is a breaking change** — confirmed present in the
published 0.8.0 tarball. Stated honestly rather than minimised: test-only surface, no runtime path,
0.x, and it fails at **compile** time (TS2339) with a one-line migration to
`loader.getHarness(PopoverHarness.with({ … }))`. Keeping them as stabilizing aliases was considered
and rejected: their documented contract was "acquires *without* waiting for the application to
stabilize", so an alias would trade a loud compile error for a silent semantic change.

The seven `never awaits application stabilization` guard tests go with it. They worked — pass 14
verified they bite — but they pinned 2 of 15 harnesses against a **symptom**. The guard that matters
now is in `test-setup.ts` and names the **cause**; measured, it arms at 90 of 97 file boundaries
(the 7 misses are each worker's first file, which re-baselines by design). Protection moved layer
rather than being lost.

## P15-6: a second leak of the same family

`theme.service.spec.ts` was the only file using `vi.stubGlobal` (14 calls) and never called
`vi.unstubAllGlobals()`. That registry is **separate from mocks** — `restoreAllMocks()` does not undo
it and Vitest's `unstubGlobals` defaults to `false` — so under `isolate: false` its last, *partial*
`localStorage` double (`getItem`/`setItem`, no `removeItem`) outlived the file. It surfaced as five
failures in `split.spec.ts`, a file that has nothing to do with it. Deterministic repro; fixed.

The boundary guard now also covers `requestAnimationFrame` and `queueMicrotask` — the remaining
globals whose poisoning reproduces the original stabilization hang. Verified it can fail: forcing a
bad rAF baseline reds 90 of 97 files with a message naming `requestAnimationFrame`.

**Residual, named rather than hidden:** the guard covers the four globals that can cause a
stabilization hang. It is *not* a general cross-file global guard — a `localStorage`/`matchMedia`
class leak is still caught only by whichever file trips over it. Widening it to arbitrary globals
would turn every latent stub leak into a hard red at once and needs its own soak.

## Verification state at hand-off

| Gate | Result |
|---|---|
| `npm run build:lib` | pass — 56 entry points + 15 `testing/` |
| `npx ng build demo` | pass |
| `npm run test:ci` | **3534 passed**, 4 skipped + 4 demo — 8 of 8 consecutive runs |
| `npm run lint` | 0 errors, 79 warnings — all in `e2e/` |
| `npm run verify:package` | pass — 73 entry points exported |
| `npm run verify:mcp-index` | 6 warnings |
| `ci.yml`, no isolation, post-fix | **4 of 4 green** — `unit tests` 71 s / 69 s / 68 s |
| `ci.yml`, no isolation, pre-fix | **3 of 3 red** |

3541 → 3534 is exactly the seven deleted guard tests.

**The before/after CI contrast is the load-bearing evidence**, not any tally: same harnesses, same
workflow, 3 red before the leak fix and 4 green after. The local run counts (12 harness-change runs,
8 full `test:ci`) corroborate and no more — against the historical ~1-in-5 rate they leave a
meaningful null on their own, and several were taken at load average 21–35, the band this register
already flags as artefact-producing.

## Open

- **A general cross-file global-stub guard** — see P15-6. Deliberately deferred.
- The `demo` project has no `setupFiles`, so its two specs sit outside the boundary guard.
- **The MCP index still does not cover `testing/` entry points** — deliberate; the index feeds
  consumer-facing component guidance.
- The remaining consistency items are unchanged: the Escape-dismiss implementation split, and
  `_IdGenerator` (closed as won't-do).
