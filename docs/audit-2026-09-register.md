# ngx-tw — library audit, September 2026

**Method.** Six parallel read-only audits (API surface, signal reactivity, accessibility,
test/demo coverage, computed size scale, industry rhythm research), plus a mechanical sweep of
shipped source against `.claude/CLAUDE.md`, plus **live browser measurement** of every component
at every size via a new diagnostic page (`/foundations/rhythm`).

Full reports live in `docs/research/`. This file is the triage register.

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
