# Pass 6 — dark high-contrast ramp

Owner: theme agent. Scope touched: `projects/ngx-tw/theme/` and
`projects/demo/src/app/routes/theme/` only.

Resolution **(b)** from `pass5-theme.md` F4 is removed. `'system'` now composes
`prefers-color-scheme` and `prefers-contrast` as two independent axes.

---

## 1. The new scheme

**Activation selector: `[data-theme="high-contrast-dark"]`**, in a new file
`projects/ngx-tw/theme/_high-contrast-dark.css`.

Justification for a fourth scheme rather than a variant of an existing one: the
two axes are appearance (light/dark) and contrast (normal/increased). Three
schemes represented three of the four cells and left the fourth — the one a
dark + increased-contrast OS actually asks for — unrepresented, which is exactly
what forced pass 5's compromise. `TwTheme` / `TwResolvedTheme` gain the member
`'high-contrast-dark'`.

### Semver

**Additive.** No exported symbol renamed or removed; no required member added to
an exported interface. Three observable widenings, all deliberate:

| Change | Shape |
|---|---|
| `TwTheme` / `TwResolvedTheme` gain a member | union widening — can break a consumer's *exhaustive* `switch` at compile time. Standard minor-release cost; flagged, not hidden. |
| `TW_THEMES` / `TW_RESOLVED_THEMES` gain an entry | `cycleTheme()` now has 5 stops, `'high-contrast-dark'` inserted before `'system'`. |
| `isDark` / `isHighContrast` widen | **no existing resolved value changes its flags** — only the new value sets two at once. |

### The flags stop being mutually exclusive — on purpose

- `isDark` → `'dark' \| 'high-contrast-dark'`
- `isHighContrast` → `'high-contrast' \| 'high-contrast-dark'`
- `isLight` → unchanged, strictly `=== 'light'`

`isDark` **had** to widen or the feature is incoherent: the demo's own published
snippet is `isDark() ? '#334155' : '#e2e8f0'`, which under strict equality would
paint light-surface chart colours onto a pure-black surface.

**Deliberately not done:** widening `isLight` to include `'high-contrast'`. That
is arguably a latent bug (a light-based scheme reports `isLight() === false`),
but fixing it changes what a *shipped* scheme reports to consumers already
reading the flag, which is out of scope for an additive pass. Noted as an
asymmetry in the `isLight` JSDoc so the next reader sees it was a decision, not
an oversight.

---

## 2. Measured contrast — 90 pairings

Not asserted. Computed from the Tailwind v4 oklch palette → sRGB (gamut-clamped)
→ WCAG relative luminance → ratio. **Everything below is reproducible** — the
harness and the full tables are committed alongside this report:

| file | what |
|---|---|
| `scratchpad/p6-contrast.mjs` | the harness (`node scratchpad/p6-contrast.mjs <subject> <baseline>`) |
| `scratchpad/p6-contrast-hc-dark-vs-dark.txt` | all 90 rows vs. normal dark |
| `scratchpad/p6-contrast-hc-dark-vs-hc.txt` | all 90 rows vs. light high contrast |
| `scratchpad/p6-surface-separation.mjs` / `.txt` | the surface-vs-surface / hover-direction analysis in § 2.1 |

**Harness validated first** against Tailwind's published hexes and this repo's
own recorded numbers: `blue-500 #2b7fff`, `red-500 #fb2c36`, `gray-950 #030712`,
`amber-400 #ffb900`, `blue-950 #162456` — all exact; `gray-600/white 7.56`,
`gray-500/gray-950 4.16`, `violet-500/violet-950 3.47`, and `_dark.css:163`'s own
inline `blue-500 on blue-950 = 3.92` all reproduced.

### Result

| | |
|---|---|
| Pairings measured | 90 |
| Below the WCAG AA floor (4.5:1 text / 3:1 non-text) | **0** |
| Weakest pairing in the whole scheme | **7.96:1** |
| Beat the same pairing on `_dark.css` | **88 / 90** |

The weakest is `primary-500` on `surface` — the canonical focus ring, floor 3:1.
Every other pairing is higher, so the scheme clears **AAA (7:1) everywhere**,
which is what `_high-contrast.css` targets for its own soft/solid pairings.

The two that do not beat `_dark.css` are `fg on surface-sunken` and
`neutral-soft-fg on neutral-soft-hover`, both **17.75:1 here against 19.28:1
there**. Both are an artifact of the comparison rather than a regression:
`_dark.css` scores higher only because its `surface-sunken` **is** its `surface`
(separation 1.00 — an invisible well), so it is being measured against the base
surface. This scheme pays 1.5 points of an already ~4×-AAA ratio to have a
recessed surface that can actually be seen. See § 2.1 — that trade is the whole
subject of the one judgment call in this pass.

### Representative rows (hc-dark vs. normal dark)

| pairing | floor | hc-dark | dark |
|---|---|---|---|
| `fg` on `surface` | 4.5 | **21.00** | 19.28 |
| `fg-muted` on `surface-overlay` | 4.5 | **16.98** | 9.98 |
| `fg-subtle` on `surface-muted` | 4.5 | **9.98** | 5.64 |
| `border` on `surface` (SC 1.4.11) | 3 | **14.27** | 4.16 |
| `border-strong` on `surface` | 3 | **21.00** | 7.73 |
| `primary-500` on `surface` (focus ring) | 3 | **7.96** | 5.35 |
| `primary-solid-fg` on `primary-solid` | 4.5 | **14.76** | 5.58 |
| `primary-border` on `surface` | 3 | **11.59** | 2.28 |
| `primary-border-strong` on `primary-soft` | 3 | **12.07** | 3.91 |
| `warning-solid-fg` on `warning-solid` | 4.5 | **12.03** | 8.73 |
| `neutral-border-strong` on `neutral-soft` | 3 | **14.68** | 5.64 |

Note the two `dark` rows that are themselves **below 3:1** — `primary-border on
surface = 2.28` and `secondary-border on surface = 1.95`. Those are pre-existing
in `_dark.css` and out of my scope; recorded here because the measurement pass
surfaced them.

`border-muted` is deliberately **not** measured: `_semantic.css` documents it as
the purely decorative divider SC 1.4.11 exempts. It is still raised to `gray-500`,
mirroring what light high contrast does with the same token.

### Method mirrored, values not

- `_high-contrast.css` shifts the light ramp one palette step **darker**
  (50 → `-100` … 900 → `-950`, saturating). Normal dark is the plain inversion;
  this file is that inversion shifted one step **lighter** (50 → `-900` …
  900 → `-50`, saturating).
- Light HC collapses `surface`/`-raised`/`-overlay` onto pure white → this
  collapses them onto pure black. `fg` → white, `border-strong` → white,
  `fg-muted`/`fg-subtle`/`border` → `gray-200`/`gray-300`/`gray-300` (mirror of
  light's `gray-800`/`gray-700`/`gray-700`).
- Slots: `-soft` → `{c}-950`, `-soft-fg` → `{c}-50`, `-solid` → `{c}-200` with a
  black fg, `-border-strong` → `{c}-100` so a 1px outline stays visible on `-soft`.

**One deviation from the pure mirror**, in the file header: `warning-solid` keeps
the yellow-signage convention (light amber, near-black amber text) that
`_high-contrast.css` also carves out.

### 2.1 The one judgment call — and the measurement that reversed it

`surface-sunken` / `surface-muted` are the only place the two HC schemes could
plausibly diverge, because `_high-contrast.css` orders them the **opposite way
round from its own base scheme** (`muted` one step off the surface, `sunken` two;
`_light.css` has it the other way).

**I initially read that as an authoring slip and did not mirror it** — I used
`_dark.css`'s ordering (`muted` = `gray-800`, clearly visible; `sunken` =
`gray-950`) on the reasoning that `bg-surface-muted` carries gutters, inactive
tabs and hover states and must stay visible on a pure-black surface. That choice
produced a clean "0 of 90 below baseline", which is what made it look right.

**It was wrong, and the 90-pairing table could not see why.** Every pairing there
is foreground-on-background; the tradeoff lives entirely in
background-vs-background, which nothing was measuring. `neutral-soft` resolves to
`surface-muted` and `neutral-soft-hover` to `surface-sunken`, so this ordering
decides **which way a hover moves**. Measured (`p6-surface-separation.txt`):

| scheme | muted/surface | sunken/surface | hover moves |
|---|---|---|---|
| `light` | 1.10 | 1.04 | **toward** the surface ✗ |
| `dark` | 1.37 | 1.00 | **toward** the surface ✗ |
| `high-contrast` | 1.04 | 1.10 | away ✓ |
| my first draft | 1.43 | 1.04 | **toward** the surface ✗ |
| **shipped (pure mirror)** | **1.04** | **1.18** | **away ✓** |

Both *normal* schemes invert the hover — a `neutral-soft` chip slides toward the
page background when you point at it, and in `dark` it lands exactly on it
(1.00). `_high-contrast.css` is the **only** shipped scheme that gets this right.
So the swap is a deliberate fix, not a slip, and my first draft inherited plain
dark's inversion — trading a real usability defect for a separation number.

**Shipped: the faithful mirror.** It costs the two below-baseline rows above and
is worth it. The residual concern that drove the first draft — `-muted` being
near-invisible against the surface at 1.04 — is the *same property light high
contrast has* (also 1.04), and in both schemes what actually carries those
affordances is `border-*`, at **14.27:1** here. Mirroring also keeps the two HC
schemes symmetric, so a user toggling appearance while keeping increased contrast
gets the same design rather than two differently-tuned ones.

A third option (`muted` = `gray-900`, `sunken` = `gray-800`) scores better on
both separations (1.18 / 1.43) with the correct hover direction, but it is no
longer the mirror — it widens the steps beyond the light counterpart and breaks
that symmetry. The brief said mirror the method, so it was not taken; it is the
obvious candidate if a later pass decides both HC schemes should widen together.

The full reasoning and the table are in the file header, so the next reader does
not have to re-derive that the "slip" is load-bearing.

---

## 3. The defect that would have silently killed the feature

`_dark.css`'s no-JS branch was
`:root:not([data-theme="light"]):not([data-theme="high-contrast"])` —
**specificity 0,3,0**. The new scheme's own block is a bare attribute selector at
**0,1,0**. On a dark-preferring OS, `<html data-theme="high-contrast-dark">`
would therefore have matched the dark media block and lost to it **regardless of
import order** — source order cannot fix a specificity loss. The scheme would
have rendered as plain dark on exactly the machines it was written for, with
nothing failing.

Fixed by adding a third `:not([data-theme="high-contrast-dark"])` (now 0,4,0),
and **guarded** by a new spec (§ 6) rather than left as prose.

---

## 4. Import order — reasoning, and where it is written down

`index.css` order is now `_light` → `_dark` → `_high-contrast-dark` →
`_high-contrast`.

Only "**before `_high-contrast.css`**" is load-bearing, and for the identical
reason `_light.css` leads: `_high-contrast.css`'s `@media (forced-colors: active)`
selector list names every scheme at 0,1,0 — the same specificity as that scheme's
own block — so source order is the only tie-breaker and the forced-colors remap
has to win. Sitting after `_dark.css` is grouping, not cascade (`[data-theme]`
values match exactly, so no two scheme blocks can ever apply to one element).

Written into `_high-contrast-dark.css`'s header in the existing files' style, and
`index.css`'s and `_light.css`'s order comments were rewritten to state the rule
as "`_high-contrast.css` last" rather than "`_light.css` first", which was only
ever half the rule.

**No `@media (prefers-contrast: more) and (prefers-color-scheme: dark)` branch.**
`_high-contrast.css` ships no `prefers-contrast` branch either; adding one only
for the dark variant would make contrast auto-apply without JS for one of the two
HC schemes and not the other. Both are reached the same way — an explicit
`data-theme`. Recorded in the file header.

---

## 5. forced-colors — the two questions, answered separately

- **Does it need a dark counterpart?** **No.** Every value in that block is a
  system keyword (`Canvas`, `CanvasText`, `GrayText`, `Highlight`) whose value the
  OS supplies. It is scheme-agnostic *by construction* — there is nothing
  light- or dark-specific to duplicate.
- **Does the new scheme belong in its selector list?** **Yes, verified.** Each
  scheme's own block is 0,1,0, identical to its entry in that list; a scheme
  absent from the list keeps its author colours under Windows HCM while the other
  three yield. Added, and now enforced by a spec instead of checked once.

---

## 6. `dark:` custom variant

A `high-contrast-dark` subtree **is** dark, so it was added to the explicit
branch's **positive** match. It was deliberately **not** added to either
exclusion list.

This creates a **real divergence** between two predicates that the file's own
comment previously told readers to keep in lock-step, so it is spelled out in
`index.css` to stop a later pass "fixing" it into a bug:

- `_dark.css`'s media branch **excludes** `high-contrast-dark` — "which token
  set" — a root asking for dark-HC tokens must not get the plain dark ones.
- the `dark:` variant's media branch **does not** — "is this dark" — a root
  asking for dark-HC is still asking for dark.

The 2×2 exclusion product (2 dark ancestors × 2 light ones) is written with
nested `:where()` groups rather than four spelled-out descendant pairs;
`:where()` contributes zero specificity and it already sits inside a
zero-specificity `:not(:where(…))`, so it is exactly equivalent.

**Verified by compiling it**, since the library ships zero `dark:` utilities and
therefore reveals nothing on its own. A probe stylesheet with
`@source inline("dark:bg-red-500")` against the built `dist/ngx-tw/theme/index.css`
emits:

```
.dark\:bg-red-500:where([data-theme="dark"], [data-theme="dark"] *,
  [data-theme="high-contrast-dark"], [data-theme="high-contrast-dark"] *):not(…)
```

and the media branch without the exclusion, as intended. Consumer-facing only.

---

## 7. Specs

### Parity guard — it did **not** already cover four schemes

The brief allowed that it might. It did not: `BLOCKS` was light / dark-explicit /
**dark-media** / high-contrast — the fourth entry is the duplicated dark copy, not
a fourth scheme. The new file is a **fifth block**. Added to `BLOCKS`; the module
JSDoc's numbered list and the "all four scheme blocks" test title were updated.

The new block declares **exactly 195 declarations, the same key set**, generated
mechanically from `_light.css`'s key list rather than hand-typed, and omitting the
same seven scheme-invariant `@theme` tokens the others omit.

### Two new parity guards

- `excludes every explicitly-tagged scheme from _dark.css's media branch` —
  parses the `:not()` list, asserts one entry per `TW_RESOLVED_THEMES` member
  other than `dark`. Turns § 3 from a one-time fix into an enforced invariant.
- `lists every resolved scheme in the forced-colors remap` — same shape for
  § 5.

### Non-vacuity — confirmed by forced failure, not by reasoning

**Service (5 fail against the old code, 23 still pass).** Reverted
`detectSystemTheme` to the ranked form and both flags to strict equality:

```
× reports isDark / isLight / isHighContrast per axis, not per scheme
× resolves system to high-contrast-dark when the OS asks for dark AND more contrast
× writes the dark high-contrast scheme onto the document like any other
× composes the two axes live in both directions
× does not let a colour-scheme change clobber the contrast decision
```

**Parity (3 fail).** Removed the `_dark.css` `:not()`, removed the forced-colors
entry, and deleted one token from the new block:

```
× declares the same token set in every scheme block   → extra/missing: --color-error-icon
× excludes every explicitly-tagged scheme from _dark.css's media branch → ['high-contrast-dark']
× lists every resolved scheme in the forced-colors remap → ['high-contrast-dark']
```

All sabotage reverted; the restored files were re-measured (90/90, 0 regressions)
and re-diffed.

### Existing specs that had to change

Three encoded the removed compromise and would otherwise have been false-green:

- `keeps dark when the OS asks for both dark and more contrast` → rewritten as
  `resolves system to high-contrast-dark …`, with the old rationale kept as a
  comment explaining why it used to read `'dark'`.
- `does not let a colour-scheme change clobber the contrast decision` → the
  middle assertion now expects `high-contrast-dark`, not `dark`.
- `should have mutually exclusive isDark, isLight, isHighContrast` → renamed
  `reports isDark / isLight / isHighContrast per axis, not per scheme`; the
  mutual-exclusivity invariant it asserted is the thing this pass deliberately
  breaks.
- `should cycle through all themes in order` → 5 stops.

---

## 8. Docs that went false on landing — all fixed

`theme.types.ts` (the `TwTheme` (b) compromise + all three flag member docs and
a new `TwThemeState` note), `theme.service.ts` (class JSDoc "one of three", the
whole `detectSystemTheme` rationale, `applyToElement`'s "three schemes", plus new
per-flag JSDoc), `theme.directive.ts` (named the three CSS files),
`theme.meta.ts` (summary, the `prefers-contrast` bullet, the "all three schemes"
bullet, the flags bullet, `aliases`), `theme.bootstrap.ts` ("`'high-contrast'`
chosen at all"), `_light.css` header (key-set sentence + import-order sentence),
`_dark.css` header (activation-paths list + why each `:not()` exists),
`_high-contrast.css` (why the forced-colors list needs one entry per scheme),
`index.css` (both comments).

Demo: overview's "4 selectable themes" → 5 and "All three schemes … 195 tokens" →
four, plus the OS-detection and flags bullets; the API page's `typesSnippet`, a
**hard-coded copy of both unions**, which would have been wrong immediately; the
three flag description cells; the `TwThemeState` snippet comment; the page-shell
description.

---

## 9. Demo

- **Scheme switcher** (`Switching Themes`) iterates `TW_THEMES` — picks up the
  5th button with no code change.
- **Side-by-side `[twTheme]` preview** (`Scoped Subtrees`) iterates
  `TW_RESOLVED_THEMES` — picks up the 4th pane automatically, but its grid was
  `grid-cols-1 md:grid-cols-3` and would have orphaned it. Changed to
  `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`, and the intro now says the panes
  are every resolved scheme rendered at once, which is the manual check surface.
- **`Reading Theme State`** gained a paragraph and a rewritten HTML snippet
  making the not-mutually-exclusive flags concrete.

### Canary baselines: **no regeneration expected**

`canary.spec.ts:305` captures `section(page, 'Semantic Tokens')` as an element
screenshot. That section's own content and layout are untouched — every change is
in the sections above and below it. `prepareRegionCapture` hides the sticky header
and grows the viewport to the element's box before capture, so the vertical page
shift from a 5th switcher button (which may wrap to a second row) cannot move that
baseline. If the orchestrator sees a `theme-swatches.*.png` delta, it is **not**
from this pass and is worth investigating rather than accepting.

### ⚠ e2e coverage gap — orchestrator action, outside my ownership

Nothing in `e2e/` breaks. But the reason nothing breaks is that **nothing covers
the new scheme**, and this repo has been bitten by exactly this shape before —
CLAUDE.md records five components that had "zero e2e coverage while the suite
still reports green" because a hard-coded constant was never extended.

| anchor | why it silently skips the new scheme |
|---|---|
| `e2e/specs/02-cross-cutting/theme-matrix.spec.ts:8` | `type Theme = 'light' \| 'dark' \| 'high-contrast'` |
| `e2e/specs/02-cross-cutting/theme-matrix.spec.ts:88` | sweeps the literal `['light', 'dark', 'high-contrast']` |
| `e2e/specs/04-visual/canary.spec.ts:176` | sweeps `['light', 'dark']` only |

The scoped-pane test at `theme-matrix.spec.ts:224` also survives untouched — its
`[data-theme="dark"]` / `[data-theme="high-contrast"]` selectors are exact-value
attribute matches, so `high-contrast-dark` matches neither, and it uses
`.first()`. The 4th pane is rendered and asserted on by nothing.

I do not own `e2e/`, so this is flagged rather than fixed. The cheap version is
extending the `theme-matrix.spec.ts` sweep to the fourth value; the durable
version is having it iterate `TW_RESOLVED_THEMES` so the next scheme cannot
repeat this.

---

## 10. Verification actually run

| | |
|---|---|
| `npm run build:lib` | ✅ clean — re-run at the end against the full current tree, sibling changes included |
| `ng test ngx-tw --include='../theme/**/*.spec.ts'` | ✅ **5 files, 47 tests passed** — also re-run at the end against the full current tree |
| new CSS file reaches `dist/` | ✅ `theme/**/*.css` asset glob picked it up with no `ng-package.json` edit |
| Forced-failure runs | ✅ 5 service + 3 parity guards confirmed non-vacuous |
| `tsc --noEmit -p projects/demo/tsconfig.app.json` | ✅ clean |
| `ng test demo` | ✅ 4 passed (includes the route drift guard) |
| `ng build demo` (AOT, full template type-check) | ✅ clean (only the pre-existing bundle-budget warning) |
| Compiled-CSS inspection of `dist/demo/browser/styles-*.css` | ✅ all four `[data-theme=…]` blocks emitted; forced-colors list is `:root,[data-theme=light],[data-theme=dark],[data-theme=high-contrast],[data-theme=high-contrast-dark]`; `_dark.css` media selector carries the third `:not()` |
| Tailwind probe compile of the `dark:` variant | ✅ (§ 6) |
| Playwright | not run, per brief |

---

## 11. A sibling transient — observed, then self-resolved

Mid-pass, a sibling's in-flight edit broke the whole-library type-check:

```
TS2339: Property 'errorWiring' does not exist on type 'RadioGroupComponent<T>'
  projects/ngx-tw/radio/radio.ts:866
TS2339: Property 'errorWiring' does not exist on type 'TimePickerComponent<D>'
  projects/ngx-tw/time-picker/time-picker.ts:1003, :1005
```

Not touched, not fixed — exactly the phantom the brief warns about. Their
`core/error-state-wiring.ts` landed shortly after, and **both `build:lib` and the
47 theme tests were re-run green against the current tree**, so nothing in § 10 is
stale and there is no outstanding action for the orchestrator here. Recorded only
so the transcript's failed run is not mistaken for an unresolved problem.

---

## 12. Incidental findings — reported, not fixed

1. **Two `_dark.css` role borders fail SC 1.4.11 today.** `primary-border` on
   `surface` = **2.28:1** and `secondary-border` on `surface` = **1.95:1**
   (floor 3:1). Pre-existing in the plain dark scheme, unrelated to this pass,
   surfaced only because the measurement harness sweeps every role. Worth a
   finding of its own.

2. **`_dark.css`'s header contrast table has stale numbers.** It claims
   `blue-500 ↔ blue-950 ≈ 5.8:1`, but the inline comment eight lines below says
   `3.92:1` for the same pair — and 3.92 is correct (harness agrees to 0.01).
   `amber-400 ↔ amber-950` is listed as `≈11.2` (actual 8.73) and
   `gray-400 ↔ gray-950` as `8.59` in `_semantic.css` (actual 7.73). None change
   a decision — every affected pairing still passes — but the table reads as
   measured when it is not.

3. **CLAUDE.md's "zero `dark:` variants, greppable as a lint rule" is not quite
   true.** `dark:bg-primary-900/20` still appears twice in the shipped bundles —
   inside the *comment* in `file-upload.ts:154` that documents why the variant was
   removed. ng-packagr preserves the comment, Tailwind's `@source
   "../fesm2022/**/*.mjs"` scanner cannot tell a class name in a comment from one
   in a template, and it emits two dead rules for it. Harmless, but the
   documentation comment resurrects the exact utility it documents, and a naive
   grep-based lint would hit it.

---

## 13. Things I chose not to do

- **Widen `isLight` to include `'high-contrast'`** — § 1. Behaviour change to a
  shipped scheme; additive pass; documented as an asymmetry instead.
- **A `prefers-contrast` no-JS branch for either HC scheme** — § 4. Would make
  the two HC schemes reachable by different mechanisms.
- **Fix `_dark.css`'s stale contrast table or the two failing dark role
  borders** — § 12. Real findings, but changing `_dark.css`'s *values* is a
  different pass with its own visual-baseline blast radius; I touched that file
  only for the `:not()` and its comment.
- **Widen the `surface-muted` / `surface-sunken` steps beyond the light
  counterpart** (the third option in § 2.1) — better separation, but it breaks
  the symmetry between the two HC schemes and is no longer the mirror the brief
  asked for. The obvious candidate if a later pass widens both together.
- **Touch `shell.ts`'s 3-way theme pill** — outside my ownership. It reads
  `resolvedTheme()` into a `data-mode` attribute whose CSS handles
  `light`/`dark`/`system`; `high-contrast-dark` will fall through to the
  unstyled default exactly as `high-contrast` already does. Pre-existing shape,
  not a new break.

## Files touched

```
projects/ngx-tw/theme/_high-contrast-dark.css       (new)
projects/ngx-tw/theme/_dark.css
projects/ngx-tw/theme/_light.css
projects/ngx-tw/theme/_high-contrast.css
projects/ngx-tw/theme/index.css
projects/ngx-tw/theme/theme.types.ts
projects/ngx-tw/theme/theme.service.ts
projects/ngx-tw/theme/theme.directive.ts
projects/ngx-tw/theme/theme.bootstrap.ts
projects/ngx-tw/theme/theme.meta.ts
projects/ngx-tw/theme/theme-token-parity.spec.ts
projects/ngx-tw/theme/theme.service.spec.ts
projects/demo/src/app/routes/theme/theme-page.component.ts
projects/demo/src/app/routes/theme/overview/theme-overview.component.ts
projects/demo/src/app/routes/theme/examples/theme-examples.component.ts
projects/demo/src/app/routes/theme/api/theme-api.component.ts
```
