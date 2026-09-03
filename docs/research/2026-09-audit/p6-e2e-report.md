# Pass 6 — e2e + CI agent report

Ownership: `.github/workflows/` and `e2e/` only. **No library or demo source touched.**
Branch `feat/vertical-rhythm`, PR #56. Commits `c195c28`, `1e7d168`, `b54a566`, `e8211ac`
(plus two bot commits from the baseline-regeneration workflow, `2dd2e4b` and `b1edd7e`).
Final CI run [33732471662](https://github.com/avs2001/ngx-tw/actions/runs/33732471662): **all
green**, including the visual canary on a pull request.

---

## Task 1 — the visual canary now runs on a PR that changes a baseline. **Done, verified in CI.**

**Chosen fix: a job-level condition fed by a cheap detection job.** `.github/workflows/e2e.yml`
gains `visual-baseline-scope` — checkout with `fetch-depth: 2` plus one
`git diff --name-only HEAD^1 HEAD -- e2e/__screenshots__` — whose output `e2e-visual` ORs into
its existing `if`.

**Why not a `paths:` filter**, which is the obvious answer and is wrong: a `paths:` filter on the
`pull_request` trigger gates the **whole workflow**, so it would have stopped `e2e-smoke` and
`e2e-a11y` — the two required PR checks — from running on any PR that does not touch a PNG.

**Why not simply allow the visual job on every PR**, which the brief explicitly asked me to
address: the CI-minutes argument in the workflow header is real (15-minute budget, its own browser
install). Detection costs a checkout and one `git diff`, ~15 s, and only a baseline-touching PR
pays for the sweep. Steady-state PR cost is unchanged.

**Two traps handled explicitly, both commented in the file:**

- `visual-baseline-scope` deliberately carries **no `if:`**. A *skipped* dependency propagates the
  skip to every job that `needs` it, so guarding the detection job with
  `if: github.event_name == 'pull_request'` would have silently disabled the visual canary on push
  and schedule as well. It runs unconditionally and short-circuits inside the step.
- Detection **fails safe, not open**: if `HEAD^1` cannot be resolved for any reason, it reports
  `baselines-changed=true` and the visual job runs. The failure mode of a broken detector must not
  be "skip the only check that can contradict a regenerated baseline".

**Verification (not by reading — by running):** run
[33732471662](https://github.com/avs2001/ngx-tw/actions/runs/33732471662), event `pull_request`:

```
e2e — visual baseline scope :: success
e2e — smoke (chromium-light) :: success
e2e — visual canary (chromium) :: success      ← previously "skipping" on every PR
```

Note one consequence worth knowing: detection compares the PR against its **base**, not against the
previous commit, so for PR #56 — which already carries baseline changes from pass 5 — the visual job
now runs on *every* push to the branch. That is correct (this PR does change baselines) but it means
the negative case cannot be observed on this PR.

**Second half of the same defect, also fixed.** `e2e-update-baselines.yml` ran plain
`--update-snapshots`, whose default mode is `changed`: it rewrites a baseline only when the
comparison **fails**, so a new capture differing by less than the spec's `maxDiffPixelRatio: 0.01`
is silently kept. This is not theoretical — see Task 2. The workflow now runs
`--update-snapshots=all`, and its header says plainly that the job passes by definition and that
the PR visual job is the only thing that can contradict it.

---

## Task 2 — the `theme-swatches` blank band. **Fixed. The pass-5 hypothesis is falsified.**

### The hypothesis was wrong, and the baseline itself said so

The register proposed "the capture happens before the tabbed shell's enter animation settles". The
evidence against it was already in the committed PNG: the painted band is **exactly 720 px** — one
`Desktop Chrome` viewport — with blank both above (~270 px) and below (~290 px). An unsettled
animation does not produce a viewport-height-exact painted window bracketed by blank on both sides.

Measured instead (`boundingBox()` + a probe capture at two viewport sizes):

| viewport | section box | result |
|---|---|---|
| 1280 × 720 | 848 × 1284 at y = 1194.5 | ~720 px painted, blank above and below |
| 1280 × 1800 | 848 × 1284 (unchanged) | **every row painted**, no extra wait |

The cause is capture mechanics: Playwright scrolls the target into view and captures its box, and
the part of the box that does not intersect the viewport at that moment comes back blank. No timing
is involved — growing the viewport fixes it with zero added waiting.

### It was never only `theme-swatches`

Reading the other baselines found the same silent loss in **four more**:

| baseline | height | what was missing |
|---|---|---|
| `theme-swatches` | 1285 | `Semantic Tokens` heading + SURFACE + FOREGROUND rows, and the bottom third |
| `alert-colors` | 945 | the `Colors` heading and its prose, the code block — **plus the sticky shell header painted into the frame** |
| `tabs-variants` | 844 | the code block's content |
| `card-variants` | 782 | bottom band |
| `button-colors` | 797 | bottom band |

### The fix

`prepareRegionCapture(page, target)` in `canary.spec.ts`, called before every **in-page region**
capture (not the three overlay captures, which are viewport-anchored):

1. hides `header.sticky` — the shell's `sticky top-0 z-30` header (`shell.ts:510`) otherwise paints
   into any region scrolled under it. Pass 5 had already done this for the theme capture alone;
   this generalises it.
2. grows the viewport height to the target's box + 32 px slack, only when the target is taller.
   Width stays 1280 so layout is unchanged, and `installStabilityHooks` has already zeroed
   scrollbar width, so neither step can reflow the subject.

The rationale is a long comment on the function, including the falsified hypothesis, so the next
reader does not re-derive it.

### Regeneration, and why it took two runs

First dispatch (`2dd2e4b`) rewrote **4 of 20** baselines — `theme-swatches` and `alert-colors`
only. The other three tall captures were unchanged because the restored content (thin dark text on
a light ground) is **fewer than 1% of the frame's pixels**, so `--update-snapshots`'s default
`changed` mode saw the comparison pass and kept the truncated baseline. That is the same
"green by definition" class as the register's `--update-snapshots` note, one level deeper. Switching
the workflow to `--update-snapshots=all` and re-dispatching (`b1edd7e`) rewrote 12 more; all five
affected baselines now show their full content. Verified by opening the regenerated PNGs, not by
trusting the green job.

Baselines are correct as of commit `b1edd7e`, generated on Linux from the branch's **committed**
state. Sibling agents had uncommitted library and demo edits in the tree throughout; if any of those
land and shift pixels, a re-dispatch is needed — and now the PR visual job will say so before merge.

**Nothing in the demo was at fault**, so nothing to hand off there.

---

## Task 3 — the flake class. **Fixed as a class; one instance is not mine.**

### First, a correction to the brief

Of the four recorded flakes, **only three are e2e**. `menu.spec.ts` type-ahead is
`projects/ngx-tw/menu/menu.spec.ts:737` — a **Vitest unit spec**, which sleeps
`await new Promise(r => setTimeout(r, 250))` for CDK's 200 ms typeahead debounce and drifts past
Vitest's 5 s default under load. It is library source; **reported, not fixed**. The fix is the
`pumpUntil` shape the register already names: poll `document.activeElement` until it is
`items[2]` instead of sleeping a fixed 250 ms.

### The class, measured

`grep` for the shape found **35** one-shot `page.evaluate` / `locator.evaluate` reads followed by a
bare `expect`, and **3** `expect(await …)` calls. They are not one class but three:

| sub-class | example | fix |
|---|---|---|
| one-shot read of asynchronously-settled state (above all **focus**) | `transfer.spec.ts:58` | `pollUntil` (new) or `toBeFocused` |
| auto-retrying assertion with too tight a default timeout | `date-picker.spec.ts` "overlay still present after close" | explicit `OVERLAY_SETTLE_TIMEOUT_MS` |
| genuinely slow first-hit lazy-chunk compile | `routes.spec.ts` `/components/sort/api` | one shared, larger `OUTLET_READY_TIMEOUT_MS` |

`e2e/support/timing.ts` (new) holds all three answers:

- **`pollUntil(page, fn, message)`** — the e2e counterpart of the unit suite's `pumpUntil`, built on
  Playwright's own `expect.poll` so retries, timeouts and last-value reporting come from the
  framework. **9 of the 35 pairs migrated**, not all 35: `transfer` ×2 (the pass-5 flake), `menu` ×2,
  `dialog` ×2, `concurrent-overlays` ×2, `keyboard-journey` ×1. Another **6** locator-focus
  assertions became `await expect(locator).toBeFocused()` (auto-retrying) in `focus-restoration`,
  `keyboard-journey` and `concurrent-overlays`.

  The other **26 are deliberately left alone**: they read values that are stable once the preceding
  `await` has resolved — `localStorage` after a click, a computed `transition-duration`, a measured
  slide width, a DOM ordering. Polling them would add churn without removing a race. Anyone
  re-checking that call should re-run the sweep:

  ```
  grep -rn "expect(await" e2e/            # 3 hits (1 fixed in split.spec.ts)
  # plus: a `const x = await …evaluate(` line followed within ~15 lines by a bare `expect(x`
  ```

  The rule I applied: migrate when the asserted value is **focus** or **overlay/DOM presence**,
  which this library moves from `afterNextRender`, CDK's `FocusMonitor` and overlay attach/detach
  hooks. Leave it when the value is already settled by the awaited action.
- **`OVERLAY_SETTLE_TIMEOUT_MS = 15_000`** — applied in two places, and the second one matters more
  than it looks:
  - `waitForOpen` / `waitForClosed` in **all eight** overlay POMs (dialog, menu, popover, select,
    tooltip, command-palette, date-picker, date-range-picker), all previously on the bare 5 s
    default;
  - **inline overlay attach/detach assertions written directly in specs**, which bypass the POMs
    entirely and were therefore untouched by the POM change. This is where the
    `date-picker.spec.ts` flake actually sits — its recorded symptom, *"overlay still present after
    close, expected 0 got 1"*, comes from an **inline** `await expect(picker.overlayDialog).toHaveCount(0)`
    in that spec, not from `waitForClosed()`. Fixing only the POM would have left the named flake
    on the default timeout. 9 inline sites now carry the constant, in `date-picker` (×4),
    `date-range-picker` (×2), `tooltip`, `popover` (×2), `reduced-motion` and
    `forms-three-strategies/select`.
- **`OUTLET_READY_TIMEOUT_MS = 45_000`** — the constant `20_000` was hand-copied into **seven**
  files. Now one exported constant; pass 4 measured `/components/sort/api` exceeding the old 20 s
  under contention while re-running alone in 1.9 s.

**One judgement call, recorded because it goes the other way.** `menu.spec.ts`'s disabled-item test
asserted `expect(focusedName).not.toMatch(/^Archive$/)`. Polling a **negative** would have gone green
the instant focus was anywhere else — including on `<body>` before the key handler ran — making it
*weaker* than the one-shot it replaced. It now asserts positively that focus lands on
`'Delete project'`. Same for `concurrent-overlays`' focus-trap loop, where two independent polls
could settle on different instants: it polls the pair as one object.

**Result:** `npm run e2e:fast` — **950 passed, 43 skipped, 0 failed, 0 flakes**, twice (pass 5: 936
passed, 52 skipped, **1 flake**).

**One gap I could not close cleanly:** `e2e/specs/01-components/select.spec.ts` carries three more
inline `await expect(select.listbox).toHaveCount(0)` assertions on the default timeout — but that
file also holds a **sibling agent's uncommitted change** (the select clear-control fix), whose
library half (`projects/ngx-tw/select/select.ts`) is still uncommitted. Committing the file would
have landed a spec change ahead of the code it depends on. Left untouched; it is a three-line
follow-up for whoever lands that fix.

---

## Task 4 — `test.fixme` as an untracked bug tracker. **Mechanism built, all entries migrated.**

### Census, reconciled

**35 `test.fixme` call sites**: 33 at statement position + 2 conditional in-body ones in
`explicit-assertions.spec.ts` (they gate `ARIA_CONTROLS_BACKLOG` / `ACCESSIBLE_NAME_BACKLOG`, take a
boolean rather than a title, and already expire through those backlogs — exempt by design, and the
guard exempts them explicitly). The gaps doc's "35 unconditional + 2" was the count *before* pass 5
promoted two. A raw `grep -c test.fixme e2e/` returns 50 because it counts prose mentions in file
headers.

### The split is measured, not assumed

I converted every suppressed body to `test.fail()`, ran it, then converted every one to a plain
`test()` and ran it again. The two runs disagree in a way that turns out to be the whole design
input: **Playwright reports a `test.fail()` body that times out as a hard failure**, not as an
expected failure. So `test.fail()` is only viable where the body fails on a *real assertion*.

| outcome | count | shape |
|---|---|---|
| body fails on a real assertion (≤ 7 s) | **9** | → `test.fail()` — self-expiring, no registry row needed |
| body is empty or vacuous | 18 | → `test.fixme` + registry row |
| body hangs on DOM the demo never renders | 5 | → `test.fixme` + registry row (`test.fail` would be permanently red) |
| body passes — **stale** | **1** | → promoted to a live `test()` |

Promoted to `test.fail()` (each with `test.setTimeout(EXPECTED_FAILURE_TIMEOUT_MS)` = 15 s, for
suite speed — a hang cannot rot silently, because a timed-out expected failure is a hard failure).
`mobile.spec.ts:65` is the only one outside `e2e:fast`'s project, so it was re-run explicitly under
`--project=mobile-chrome` after the cap was added: still fails at 6.8 s, run green. The nine are: `calendar.spec.ts:80`, `dialog.spec.ts:235`, `split.spec.ts:232/317/383/449`,
`forms-three-strategies/input.spec.ts:125`, `keyboard-journey.spec.ts:57`, `mobile.spec.ts:65`.
Note these include demo-blocked entries, not just library bugs: if a body fails fast, `test.fail()`
is the better mechanism regardless of *who* owns the blocker, because it expires by itself.

### The one the mechanism immediately flagged as stale

**`date-range-picker.spec.ts:42`** — *"`[numberOfMonths]="1"` still renders two grids"*. It passes.
This confirms the gaps doc's F-04(b) analysis exactly: the propagation chain is intact and the
overlay's `numberOfMonths` signal is merely seeded at 2 before the picker sets it — a first-render
flash that `toHaveCount`'s auto-retry absorbs. Promoted to a live test with the history in a comment.

**Two near-misses worth recording, because both would have been wrong to promote:**

- `concurrent-overlays:253` (z-index canary) *passes*, but vacuously — its body is
  `await page.goto('/_e2e/concurrent-overlays')` and a plan, and an SPA `goto` to a non-existent
  route does not throw. Registry, not promotion.
- `mobile:26` (sidebar drawer) *passes*, but its assertion is `expect(sidebar).toBeHidden()`, which
  in Playwright also passes for an element that has not attached. `shell.ts:346` still shows
  `<aside class="… w-64 shrink-0 …">` with no responsive variant, so the premise holds and the
  assertion is the problem. Registry, with that flagged in its `reason` so whoever lifts it
  strengthens the assertion rather than just deleting the suppression.

### The mechanism

- **`e2e/support/fixme-registry.ts`** — 23 `FixmeEntry` rows (`id`, `title`, `reason`, `blockedOn`,
  `reviewBy`), staggered horizons: `2026-10-15` for the seven that one demo change unblocks,
  `2026-11-01` for the five three-strategy gaps, `2026-12-01` for the rest.
- **`e2e/specs/00-smoke/fixme-registry.spec.ts`** — four pure-data checks under `@smoke`, so they run
  in the required PR check: expiry, id uniqueness/shape, completeness, and a pin on the
  `[fixme:<id>]` title format the CI guard parses.
- **CI guard in `e2e.yml`** (`e2e-smoke`, before the Playwright install so it fails in seconds) —
  scans the source for both directions: a call site whose id has no row, and a row no call site
  references.

**Why the pairing check lives in the workflow rather than in a spec — two constraints, both real:**

1. `@types/node` is not a dependency of this workspace, so a spec cannot `import 'node:fs'` without
   failing `tsc -p e2e/tsconfig.json` (verified: `TS2591`). This is the same missing dependency the
   register already records against `scripts/verify-theme-parity.mjs`. `package.json` is not mine.
2. My first design had `test.fixme(fixmeTitle('id'), …)`, which throws at collection time for an
   unknown id — enforcement by construction. **`playwright/valid-title` is an *error* in this repo's
   ESLint config and rejects a non-literal test title**, so that shape cost 23 lint errors. Titles
   are therefore literals of the form `'[fixme:<id>] <title>'`, and the pairing is enforced in CI.

The guard is not theoretical: its **first CI run went red** because I had changed the title format
and left the guard matching the old one. Fixed in `b54a566`; the failure is the evidence it fires.

### Also fixed here

`split.spec.ts`'s misplaced comment (gaps F-04(b)): an "axe sweep is covered centrally" note left
behind by a deleted test sat immediately above the RTL suppression and read as its rationale. Left a
short note in its place rather than a silent deletion.

---

## Task 5 — `onFormReset`. **Comments corrected; the two `@signal` skips re-diagnosed.**

### What is actually true

- `projects/ngx-tw/core/form-reset.ts` exports `onFormReset`, **no component imports it**, and it is
  **not exported from `core/index.ts`** — so it is not on the public surface.
- `date-picker`, `time-picker`, `date-range-picker` and `select` clear through the plain CVA path:
  `writeValue(null)` (`date-picker.ts:1514`, `time-picker.ts:1464`, `date-range-picker.ts:1465`,
  `select.ts:1650`).
- **`calendar` is the exception** and the brief's blanket phrasing would have been wrong for it:
  `calendar.ts:816-830` hand-rolls exactly the `control.events` + `FormResetEvent` subscription that
  the helper contains. So calendar's reset is *not* `writeValue(null)`, and the Signal-Forms
  consequence recorded for it is real — Signal Forms' `FieldState` exposes no `events` stream, so
  the `if (ctrl?.events)` guard never opens.

Corrected the header/inline comments and **two test titles** ("via onFormReset" → "via
writeValue(null)") across all seven cited files, each stating what the mechanism actually is and that
the previous claim was wrong. `select.spec.ts` was the only file that already had it right; its
comment now says so.

### The two skipped `@signal` tests: premise holds, blame was wrong

Their stated reason — *"`onFormReset` has no Signal Forms events stream"* — is false for
`date-picker`/`time-picker`/`date-range-picker`, which never used that helper. The **real** blocker
is smaller and demo-side: the Signal Forms sections of
`date-picker-examples.component.ts:373-389` and `time-picker-examples.component.ts:357-368` render a
picker and a readout **and no reset control at all**. There is no gesture to drive. Verified by
reading the demo templates. They are now registry entries
`forms/date-picker-signal-reset`, `forms/time-picker-signal-reset`,
`forms/date-range-picker-signal-reset`, with that reason. `forms/calendar-signal-reset` keeps a
genuine library reason.

### Recommendation on `form-reset.ts` — not mine to act on

**Delete it**, and it is a safe delete:

- zero importers in `projects/`;
- absent from `core/index.ts`, so it never reaches the public surface or the FESM bundle — **no
  semver break**;
- `docs/tree-shaking-audit.md:89` kept it as *"Phase-3 scaffolding … `calendar.ts:1151` references it
  as planned Phase 3 form-reset integration"*. That reference no longer exists at that line, and
  calendar has since implemented the behaviour inline. Two years of "planned groundwork" is a fair
  test of whether the plan is real.
- If the maintainer prefers to keep it: export it from `core/index.ts` and migrate
  `calendar.ts:816-830` onto it, which is the only call site the library will ever have. Either
  outcome is fine; the current state — shipped source that nothing can reach and that six spec files
  credited with behaviour it does not perform — is not.

### `docs/` still carries the misattribution — **not mine, please fix**

- `docs/tree-shaking-audit.md:26` and `:89` — the "`calendar.ts:1151` references it" claim.
- `docs/library-review/done/core.md:34,103,154,156` — "Calendar reinvents it" (true) plus an
  Option A migration plan that was never taken.
- `docs/library-review/done/input.md:130`.
- `docs/audit-2026-09-register.md:995` cites `onFormReset` as the *precedent* for the proposed
  `wireErrorState()` injection-context helper (pass-6 open item 3). The precedent is weak: the thing
  it points at is unused and unexported. The idea may still be right; the evidence offered for it is
  not.

---

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit -p e2e/tsconfig.json` | pass |
| `npx eslint e2e` | **0 errors, 75 warnings** — exactly the 75 at entry |
| `npm run e2e:fast` (local, macOS) | **950 passed, 43 skipped, 0 failed, 0 flakes** (was 936 / 52 / 1 flake) |
| `npm run e2e:visual` (local) | not a valid signal — macOS renders differ from the Linux baselines; 14 of 20 fail before *and* after my change. Regenerated on Linux instead |
| `e2e.yml` on PR #56 (final, `e8211ac`) | **run 33732471662: success.** `visual baseline scope` ✅ · `build library` ✅ · `smoke` ✅ · `accessibility` ✅ · **`visual canary` ✅ on a pull_request** · `full` + `merge gate` skipped (push/dispatch only, unchanged) |
| `e2e-update-baselines.yml` ×2 | both success; 4 + 12 baselines rewritten, all inspected by eye |

**Left red / not done, honestly:**

- The `menu.spec.ts` type-ahead flake is **unfixed** — it is a library-owned unit spec (above).
- **`--update-snapshots=all` is a tradeoff the maintainer may want to revisit, not a settled
  improvement.** It removes a silent-drift failure mode (a corrected capture kept out of the
  baseline because it differs by under 1%) at the cost of a noisier diff on every future
  regeneration: this run rewrote four baselines that only carried sub-threshold rendering noise
  (`button-variants` ±11 B, `select-closed` ±3 B, `select-open`, `date-picker-open-dark`). I think
  a *deliberate* regeneration should record what actually renders, but the churn is real and the
  call is yours.
- The e2e tree was moving under me: sibling agents had ~50 uncommitted library/demo files, and
  `e2e/specs/01-components/select.spec.ts` carries a sibling's change (the select clear-control fix).
  I **deliberately left that file unstaged** so it lands with its library half. Everything else in
  `e2e/` and `.github/workflows/` is committed.
- Midway through, `npm start` stopped compiling (`TW_SHEET_DATA` / `TW_THEME_CONFIG` renamed in demo
  source against a stale `dist/ngx-tw`), which surfaces as Playwright's
  `Timed out waiting for config.webServer` and names no file — the exact symptom the register
  records. `npm run build:lib` cleared it. Worth re-recording: **that error means "rebuild the
  library", not "the test is broken"**.

## Corrections to the brief, collected

1. The pass-5 animation hypothesis for the blank band is **falsified** — it is capture mechanics, and
   the viewport-height-exact painted band was already the proof.
2. The blank-band defect affected **five** baselines, not one.
3. `--update-snapshots` hides sub-threshold drift even at regeneration time; `=all` is required.
4. `menu.spec.ts` type-ahead is a **unit** spec, not an e2e one.
5. `test.fail()` does **not** absolve a timeout — Playwright reports a timed-out expected-failure as
   a hard failure. This decides which fixmes can use it, and it makes the mechanism safer than the
   gaps doc assumed.
6. Exactly **one** fixme was stale (`date-range-picker:42`), not the several the census implied — but
   two more *pass* for reasons that would have made promoting them a mistake.
7. The brief's "reset actually works via `writeValue(null)`" is true for four controls and **false
   for `calendar`**, which hand-rolls the `control.events` subscription.
