# Pass 6 — theme contrast + e2e scheme coverage

Owner: theme/e2e agent. Ownership honoured: **only** `e2e/` and
`projects/ngx-tw/theme/` were edited. `select/`, `combobox/`, `core/overlay/`,
`command-palette/`, `file-upload/`, `item/` and `.claude/CLAUDE.md` were read
but never written.

**Measured vs. read.** Everything numeric below is *measured* — Tailwind v4's
oklch palette → sRGB (gamut-clamped) → WCAG relative luminance → ratio, computed
twice by two independent implementations (`scratchpad/p6-contrast.mjs`, inherited
from the pass-6 theme agent, and a fresh one inside
`projects/ngx-tw/theme/theme-contrast.spec.ts`) that agree to 0.01. Claims I only
*read* are labelled as such.

---

## Task 2 first, because it changed what Task 1 had to cover

### The brief said two tokens. It is seven — and the brief's framing was the
### theme agent's incomplete sample, not a scoping decision.

| `{role}-border` on `--color-surface`, dark | before | after | floor |
|---|---|---|---|
| primary | 2.28 | **3.83** | 3 |
| secondary | 1.95 | **4.22** | 3 |
| accent | 2.20 | **3.42** | 3 |
| info | 2.68 | **3.44** | 3 |
| success | 2.84 | **4.07** | 3 |
| warning | 2.82 | **3.99** | 3 |
| error | 2.40 | **4.22** | 3 |

The theme agent reported only `primary` (2.28) and `secondary` (1.95). Its own
harness prints all seven — the sample was partial. **Fixing two and leaving five
was not an option**: it would ship a visibly non-uniform ramp for zero
accessibility gain on the siblings.

### Is the 3:1 floor even the right bar for this tier? Yes — checked, not assumed.

`_semantic.css` describes `-border` as "subtle border (outline variant,
dividers)", which reads decorative. I nearly reported the finding as a
misclassification. It is not, for two independent reasons:

1. `--color-neutral-border` **aliases `--color-border`**, which `_semantic.css`
   documents at length as *deliberately raised* to clear SC 1.4.11. The library
   already decided this slot identifies. Seven coloured siblings were left behind.
2. Actual paint sites (grepped, not assumed):
   - `alert.ts:50` — the `outline` variant is `border-{role}-border` over a
     **transparent** background. The border is the container's only boundary.
   - `item.ts:101` — `bg-primary-soft ring-2 ring-inset ring-primary-border` is
     the **selected state** indicator.

### The value rule, so the next reader can re-derive it

**The dimmest palette step measuring ≥ 3.4:1 against `--color-surface`.** The
0.4 margin over the floor stops a palette retune dropping below it silently.
Applied to grey the rule re-derives `gray-500` — the value `--color-border`
already ships — which is what makes it the right rule rather than one fitted to
the answer. Every new value also stays strictly dimmer than that role's
`-border-strong`, so the two tiers remain distinct (asserted by a test).

### Not regressed — verified by construction *and* by measurement

`grep` confirms no other token resolves through a `{role}-border`, so the seven
rows above are the *only* pairings that could move. The full 90-pairing sweep
after the change: **0 below the WCAG floor** (was 7).

### The trap I was one step from falling into

`_dark.css` duplicates its entire body inside `@media (prefers-color-scheme:
dark)`. A fix applied to one block only would render differently with and without
JS. **The repo already guards this** — `theme-token-parity.spec.ts:128` "keeps
`_dark.css`'s two blocks byte-identical, values included" — so no new spec was
needed. I confirmed it is not decorative by sabotage: reverting **only** the
`@media` copy of `--color-primary-border` turns that test red. Both blocks changed.

### Stale documentation — the table was worse than reported

The theme agent flagged three stale rows. **All ten rows of `_dark.css`'s header
contrast table were wrong**, and three of them were wrong in a way that matters:

| row | table claimed | measured | note |
|---|---|---|---|
| `blue-500 ↔ blue-950` | 5.8 ✓ AA | **3.91** ✗ | file *rejects* this pairing 20 lines below |
| `violet-500 ↔ violet-950` | 6.0 ✓ AA | **3.47** ✗ | ditto |
| `red-500 ↔ red-950` | 5.4 ✓ AA | **4.23** ✗ | ditto |
| `green-500 ↔ green-950` | 8.1 | **6.71** | |
| `amber-400 ↔ amber-950` | 11.2 | **8.73** | |
| `slate-300 ↔ slate-950` | 11.6 | **13.59** | wrong pair — shipped fg is `slate-900` |
| `sky-100 ↔ sky-950` | 12.5 | **12.10** | |
| `sky-300 ↔ sky-950` | 7.7 | **8.34** | |
| `sky-500 ↔ sky-950` | 7.4 | **5.12** | |
| `sky-300 ↔ gray-950` | ~11 | **12.08** | |

The table listed three **rejected candidates** under a "✓ AA" column, directly
contradicting the file's own inline comments. Rewritten to show what actually
ships, with the rejected candidates kept and marked as failures.

Also corrected in the same sweep:

- `_dark.css` inline `"blue-400 lifts that to ~7.8:1"` → **5.58**.
- `_dark.css` inline `"red-500/red-950 = 4.14"` → **4.23**; `"~5.8"` → **5.58**.
- `_semantic.css` dark `border-strong` `8.59` → **7.73**. I did **not** assert a
  cause: no plausible pairing reproduces 8.59 (`gray-400` on `gray-900` is 6.82),
  so the comment says that rather than inventing an explanation.

Every verdict survives correction — no shipped value changes as a result.

### The fix had no guard at all, so I built one

axe cannot see any of this (`color-contrast` tests text only — `_semantic.css`
says so). And **no visual baseline renders the alert `outline` variant**: the
canary captures the alert *Colors* section, which uses the `soft` variant. So the
Task 2 fix was regression-proof in the worst sense.

`projects/ngx-tw/theme/theme-contrast.spec.ts` (new, 5 tests) resolves each
scheme's token graph to sRGB and asserts the floor directly. Design notes:

- **Guards the guard**: asserts the oklch→sRGB conversion reproduces five of
  Tailwind's published hexes exactly, so a subtly wrong matrix fails loudly
  instead of producing plausible numbers.
- **Two-sided allowance list** modelled on `A11Y_BACKLOG`: `light` is recorded
  as known-failing with a dated reason, and the test fails **both** when an
  unlisted scheme fails *and* when a listed one starts passing. It cannot rot
  into permanent permission.
- Covers `-border` and `-border-strong` on `surface`, plus `-border-strong` on
  the matching `-soft` (where 73 of the library's `border-{role}-border-strong`
  uses land).

**Non-vacuity confirmed by forced failure, twice — not by reasoning:**

```
# reverted _dark.css's 7 -border values to the pre-fix ones
× clears 3:1 on every border token, except in the schemes listed as known-failing
  + "dark: --color-primary-border = 2.28:1"   ... all 7, matching the scratchpad
  + "dark: --color-secondary-border = 1.95:1"     harness to 0.01

# added a passing scheme ('dark') to KNOWN_FAILING
× clears 3:1 ... → staleAllowances: ["dark"]
```

Both sabotages reverted; 52/52 theme tests green after.

---

## Findings I did NOT fix — with numbers, for the orchestrator

### 1. `_light.css` fails the same floor, worse (all 8 roles)

| role | light `-border` on white | dark (after fix) |
|---|---|---|
| primary | **1.81** | 3.83 |
| secondary | **1.48** | 4.22 |
| accent | **1.86** | 3.42 |
| info | **1.67** | 3.44 |
| success | **1.40** | 4.07 |
| warning | **1.45** | 3.99 |
| error | **1.92** | 4.22 |

Both high-contrast schemes already clear it (`high-contrast` 4.94–10.34,
`high-contrast-dark` 10.93–15.02). **Light is the only outstanding scheme.**

Deliberately not fixed: raising it darkens the *default* scheme's outline tier
across eight colours, in the scheme every visual baseline is captured in. That is
a change with its own blast radius and deserves its own pass — the same reasoning
the theme agent used in its §13 for declining to touch `_dark.css` values.
It is recorded as a dated `KNOWN_FAILING` entry in the new spec, so it is an open
item with a test attached rather than a line in a report.

### 2. `item.ts`'s selected-state ring still fails — and the theme cannot fix it

`item.ts:101` paints `ring-primary-border` on `bg-primary-soft`. Measured for
every role, `{role}-border` on `{role}-soft` (floor 3):

| role | light | dark, before | dark, after my fix |
|---|---|---|---|
| primary | 1.66 ✗ | 1.67 ✗ | **2.80** ✗ |
| secondary | 1.42 ✗ | 1.73 ✗ | **3.74** ✓ |
| accent | 1.70 ✗ | 1.67 ✗ | **2.60** ✗ |
| neutral | **4.39** ✓ | — | **3.04** ✓ |
| info | 1.56 ✗ | 1.85 ✗ | **2.37** ✗ |
| success | 1.34 ✗ | 2.10 ✗ | **3.02** ✓ |
| warning | 1.39 ✗ | 2.10 ✗ | **2.97** ✗ |
| error | 1.76 ✗ | 1.93 ✗ | **3.39** ✓ |

Both high-contrast schemes clear it everywhere (4.50–13.67). **I first wrote
"the shortfall spans all eight roles" from the spec's scheme-level verdict and
it was wrong** — measuring gives 7/8 in light (`neutral` passes) and 4/8 in dark
after the fix. Size the `item.ts` change from this table, not from `primary`.

Clearing 3:1 on the soft fill needs roughly the `-500` step — which is what
`-border-strong` already is, so raising `-border` that far **collapses the two
tiers**. The fix belongs in `item.ts` (`ring-{role}-border-strong`), which I do
not own. Recorded as a two-sided expectation in the new spec
(`EXPECTED_BELOW_FLOOR = ['light', 'dark']`), so it fails the moment it is fixed
and forces the entry's deletion.

### 3. `-border-strong` on `-soft` also fails in light

`info` 2.54, `success` 2.12, `warning` 2.07 (floor 3). Dark passes all eight
(3.47–6.99). Absorbed by light's existing `KNOWN_FAILING` entry; part of the same
light-scheme pass as finding 1.

---

## Task 1 — e2e scheme coverage

### The durable fix: derive, don't guard

`TW_RESOLVED_THEMES` **exists and is exported** (`theme.types.ts:29`,
re-exported from `theme/index.ts`) — verified, not assumed.

New `e2e/support/themes.ts` is the single boundary module. It imports from the
**source file by relative path**, not via `@cdevhub/ngx-tw/theme`, because
`e2e/tsconfig.json` maps that alias to `../dist/ngx-tw/*`: the alias would require
a library build before Playwright could even *collect* the suite, and would pull
`theme.service.ts`'s `@angular/core` import into a plain Node process for two
string arrays. `theme.types.ts` has **no imports at all**. Verified by
`playwright test --list` before any spec was written on top of it.

**The brief asked whether a hard-coded list needs an `A11Y_BACKLOG`-style drift
guard. It does not, because there is no longer a second list to drift.** Every
sweep derives from `TW_RESOLVED_THEMES`; a fifth scheme is swept with no edit.
That is strictly stronger than a guard, and it is stated here because "I made it
structurally impossible" is only a good answer if it is said out loud.

One structural guard remains, of a different kind: `SCHEME_APPEARANCE` is a total
`Record<TwResolvedTheme, 'light' | 'dark'>`, so widening the union is a **compile
error** until the new scheme is classified. The luminance assertions cannot
silently skip it.

### `theme-matrix.spec.ts` — 3 schemes → 4, and the fourth pane finally asserted

- The `<html data-theme>` + console sweep and the axe `color-contrast` sweep now
  iterate `TW_RESOLVED_THEMES`: **8 cells instead of 6**, over 4 sampled pages.
- The scoped `[twTheme]` test asserted **three** panes while the demo renders
  **four** (it iterates the same constant). The 4th pane was rendered and
  asserted on by nothing. Now:
  - every pane in `TW_RESOLVED_THEMES` must be visible;
  - every pane whose scheme ≠ the document's must re-resolve its tokens (the
    root-scheme pane is skipped — asserting inequality there would be a
    guaranteed false failure);
  - **4** distinct chip backgrounds, not 3;
  - luminance per pane, driven by `SCHEME_APPEARANCE`.

**4-way distinctness is satisfiable — measured before asserting it**, exactly the
trap the test's own JSDoc documents for the pane background (`--color-surface` is
white in *both* `light` and `high-contrast`). `--color-primary-600` resolves to
`#155dfc` / `#51a2ff` / `#1447e6` / `#8ec5ff`. Recorded in the JSDoc with the
command to re-derive it.

**Non-vacuity confirmed by forced failure**: pointing the built
`_high-contrast-dark.css`'s `--color-primary-600` at dark's value makes it fail
with `got 21,93,252 | 80,162,255 | 20,71,230 | 80,162,255` — the fourth pane is
genuinely measured, not merely iterated. Reverted.

### `canary.spec.ts` — a considered position, not a reflex

**Two tiers, both derived:**

- `FULL_SCENE_SCHEMES = ['light', 'dark']` — every canonical scene (20 baselines,
  unchanged).
- every other resolved scheme — the **Semantic Tokens swatch grid only**
  (`SWATCH_ONLY_SCHEMES`, derived by subtraction). **+2 baselines, not +20.**

The argument is precedent, not cost: **`high-contrast` shipped long before this
and has never had a canary baseline.** The canary was never the scheme-coverage
mechanism — `theme-matrix.spec.ts` is, and it now sweeps all four schemes across
four pages with an axe contrast assertion per cell. Sweeping 10 scenes × 4 schemes
would double the baseline count to re-cover ground already covered functionally.
What a *scheme* change actually alters is the token ramp, and the swatch grid is
the one scene whose entire subject is that ramp.

A fifth scheme enrols in the swatch tier automatically and announces itself as a
**missing-baseline failure** on its first `@visual` run — loud, not silent.

Total: `@visual` goes from 20 to **22** tests.

---

## Task 3 — the CLAUDE.md `dark:` claim, verified end to end

**The claim is false as stated.** CLAUDE.md: *"the library now contains zero
`dark:` variants, which makes this greppable as a lint rule."*

Verified chain (every link checked, not inferred):

1. `projects/ngx-tw/file-upload/file-upload.ts:154` — a `//` comment containing
   the backtick-quoted literal `` `dark:bg-primary-900/20` ``.
2. ng-packagr preserves it →
   `dist/ngx-tw/fesm2022/cdevhub-ngx-tw-file-upload.mjs:95`.
3. `projects/ngx-tw/theme/index.css:99` declares
   `@source "../fesm2022/**/*.mjs";` — Tailwind scans the shipped bundle and
   cannot tell a class name in a comment from one in a template.
4. `dist/demo/browser/styles-E55TUI2F.css` emits
   `.dark\:bg-primary-900\/20` — four selector variants (explicit-attribute and
   media branches of the custom `dark` variant).

**Two things the theme agent's report did not cover:**

- **The bundle comment is not the only resurrection path.** The compiled CSS also
  carries `.dark\:bg-primary-900\/30` and `\/40`, which come from
  **`docs/library-review/done/calendar.md:105`** — Tailwind's repo-root auto
  source detection scans markdown too. So rewording the `file-upload.ts` comment
  alone does **not** make the grep-lint claim true.
- **`projects/demo/src/app/routes/segmented-control/examples/segmented-control-examples.component.ts:279`
  and `:640` ship a live `dark:ring-primary-800`.** Demo, not library, so not a
  CLAUDE.md violation — but it is the same anti-pattern in the code consumers
  copy from.

Also worth knowing: a naive `grep -rn "dark:" projects/ngx-tw` returns hits today
in `calendar-cell.ts`, `alert.ts`, `transfer.ts`, `file-upload.ts` (all comments)
and in `alert.spec.ts` / `tab-nav.spec.ts` (assertions that *no* `dark:` is
emitted). **A working lint rule must strip comments and exclude specs**, or the
comments must stop containing parseable class names. Recommended wording fix:
`` `dark:`-prefixed `bg-primary-900/20` `` instead of the whole literal.

`file-upload/`, `docs/`, the demo and CLAUDE.md are all outside my ownership —
reported, not touched.

---

## Verification actually run

| gate | result |
|---|---|
| `npm run build:lib` | ✅ clean (see transient below) |
| `ng test ngx-tw --include='../theme/**/*.spec.ts'` | ✅ **6 files, 52 tests** (was 5 / 47) |
| Forced failure — dark `-border` reverted | ✅ new contrast spec goes red, all 7 rows |
| Forced failure — stale allowance | ✅ reports `staleAllowances: ["dark"]` |
| Forced failure — `@media` block only | ✅ existing byte-identical parity guard goes red |
| Forced failure — hc-dark chip collapsed onto dark's | ✅ scoped-pane test goes red |
| `npx tsc --noEmit -p e2e/tsconfig.json` | ✅ clean |
| `npx eslint .` | ✅ **0 errors**, 79 warnings — the same 79 as before my change |
| `playwright --list` (import route + both sweeps) | ✅ 10 theme-matrix, 22 `@visual` |
| `playwright theme-matrix.spec.ts --project=chromium-light` | ✅ **10/10 passed**, incl. both new `high-contrast-dark` cells |
| Both new canary captures (scoped `--update-snapshots`, macOS output deleted) | ✅ 2/2, full content verified by eye |

**Not run:** the full `ng test ngx-tw` / `ng test demo` / whole Playwright suite.
Siblings held uncommitted edits in `select/`, `combobox/`, `core/overlay/`,
`date-picker/`, `time-picker/` throughout; a whole-program type-check would have
chased their in-flight state, which is the documented phantom. The theme entry
point is self-contained and was run in full.

**Transient observed, self-resolved:** the first `build:lib` failed with 40×
`TS2307: Cannot find module '@cdevhub/ngx-tw/<x>'` on the **root barrel only**
(every secondary entry point built ✅). A concurrent sibling `build:lib` clearing
`dist/` mid-run is the only consistent explanation; an immediate re-run was clean,
as was a subsequent `ng serve` that had failed the same way. Recorded so the
transcript's red run is not mistaken for an unresolved problem.

---

## Visual baselines

Regenerated on Linux/chromium via the workflow, **not** locally — macOS baselines
fail immediately on Linux. The two macOS PNGs I generated to validate the capture
path were deleted before commit (`git status` verified clean).

```
gh workflow run e2e-update-baselines.yml --ref feat/vertical-rhythm -f branch=feat/vertical-rhythm
  → run 33742099517, completed success
git pull --ff-only   → cfb5d63 chore(e2e): regenerate visual baselines
```

### Prediction made *before* pulling

**No existing baseline should move.** The `_dark.css` `-border` change is visible
only through `alert`'s `outline` variant and `item`'s selected ring — and the
canary captures neither (`alert-colors` renders the `soft` variant; `item` has no
canary scene). This extends p6 §9, which predicted no movement from the *demo*
changes, before Task 2 existed.

### What actually moved — all four accounted for

| file | delta | cause |
|---|---|---|
| `theme-swatches-high-contrast.png` | **new**, 848×1285 | mine — the new swatch tier |
| `theme-swatches-high-contrast-dark.png` | **new**, 848×1285 | mine — the new swatch tier |
| `select-closed-dark.png` | 41672 → 41734 B | **not mine** — see below |
| `select-closed-light.png` | 40943 → 40997 B | **not mine** — see below |

The other **18 baselines were byte-identical even under `--update-snapshots=all`**,
which both confirms the regeneration is deterministic and makes the two deltas
real signal rather than noise.

**The `select-closed` delta is a sibling's committed change, not mine, and the
evidence is that it moved in `light` as well as `dark`** — my token change is
dark-only and cannot touch a light baseline. Tracing it: `select.ts` between the
previous baseline commit (`b1edd7e`) and now moves the clear control from an
inline flex child to `absolute top-1/2 -translate-y-1/2 … end-{8..13}` and adds a
`clearSpacer: 'size-6 shrink-0'`. That is a layout change to the closed trigger,
which is exactly what this scene captures. Landed after the 07:38 regeneration and
so was un-baselined until now.

> ⚠ **One more regeneration will probably be needed.** Baselines are captured from
> the *committed* branch, and at the moment I ran the workflow siblings still held
> **uncommitted** edits in `select/`, `combobox/`, `core/overlay/`, `date-picker/`,
> `date-range-picker/` and `time-picker/`. If any of those change trigger or overlay
> layout, `select-closed.*`, `select-open.*` or `date-picker-open.*` will move again
> once they land. My two new baselines are unaffected by that — they capture the
> theme page only.

Both new PNGs are **848×1285 — identical to the existing `theme-swatches-dark.png`**,
so the full region was captured with no truncated band (the pass-5 defect the
workflow header warns about), and both were read by eye: every row from the
`Semantic Tokens` heading through `NEUTRAL` is present and renders in the correct
scheme. `select-closed` kept its 848×557 dimensions — an in-place shift, not
content loss.

---

## Files touched

```
projects/ngx-tw/theme/_dark.css            (7 -border values × 2 blocks; header table; 3 inline notes)
projects/ngx-tw/theme/_semantic.css        (stale dark border-strong figure; -border slot semantics)
projects/ngx-tw/theme/theme-contrast.spec.ts   (new — 5 measured contrast guards)
e2e/support/themes.ts                      (new — the derived-scheme boundary module)
e2e/specs/02-cross-cutting/theme-matrix.spec.ts
e2e/specs/04-visual/canary.spec.ts
```

Committed as `ed9e855` + `6620e55` and pushed to `feat/vertical-rhythm` —
**only** those six paths were staged; siblings' uncommitted work was left
untouched. (`6620e55` is a follow-up: `EXPECTED_BELOW_FLOOR` used an
order-sensitive `toEqual` against `TW_RESOLVED_THEMES`, whose order is UI-facing
and has already been changed once by insertion — a reorder would have failed the
contrast spec with a message about contrast. Both sides now sorted.) The push also
published three pre-existing local commits (`773bc77`, `8155f5c`, `9248ba2`) that
were already committed to the shared branch before I started; pushing was required
for the baseline workflow to see my changes.
