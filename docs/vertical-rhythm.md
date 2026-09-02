# Vertical rhythm — the control-height system

**Status:** normative. Adopted 2026-09-02.
**Evidence:** `docs/research/vertical-rhythm-research.md` (industry survey),
`docs/research/measured-size-scale.md` (computed scale), `docs/research/rhythm-baseline-live.md`
(browser measurement). Live instrument: `/foundations/rhythm` in the demo app.

---

## 1. The rule

**Base unit: 4px.** Every control height and every stacking gap is a multiple of 4.

**Control heights are pinned, not derived.** A single-line interactive control declares its
border-box height explicitly. It does not emerge from padding + line-height + border.

| size | height | utility |
|---|---|---|
| `xs` | 24px | `h-6` |
| `sm` | 32px | `h-8` |
| `md` | 36px | `h-9` |
| `lg` | 44px | `h-11` |
| `xl` | 48px | `h-12` |

This is the scale `button` already had. Everything else moves to meet it.

**`xs` = 24px is a floor, not a preference** — WCAG 2.2 SC 2.5.8 (Target Size Minimum, Level AA)
requires 24×24 CSS px. Never go below it.

### Why standard utilities and not `--height-control-*` tokens

A custom token would be the more expressive choice, and the research recommended one. It was
rejected on measured evidence: **`tailwind-merge` cannot collapse custom-token classes.**

```
twMerge('h-control-md h-11')  ->  "h-control-md h-11"   // both survive
twMerge('h-9 h-11')           ->  "h-11"                // correct
```

CLAUDE.md requires `twMerge` in every `tv()` config precisely so consumer overrides win. A
custom height token silently breaks that for the single most commonly overridden property.
Fixing it means an `extendTailwindMerge` config threaded through all ~55 `tv()` call sites —
churn that would land in the same diff as this migration and make any regression
unattributable. The chosen scale maps exactly onto stock utilities, so the token buys a name
and costs the merge rule. Not worth it.

Rethemability survives: `h-9` resolves through `--spacing`, and per-component `class`
overrides now actually win.

> **Known, deliberately deferred:** `twMerge('duration-normal duration-500')` returns *both* —
> the library's existing `--duration-normal` token has this same blindness today, so a consumer
> cannot override the library's transition timing. Real bug, separate pass, needs the shared
> `createTV` work this document declines to bundle in.

## 2. Pinned vs. `min-h`

**Pinned (`h-*`)** — the box cannot grow, because its content is always one line:

`button` · `input` · `select` trigger · `combobox` trigger · `number-input` ·
`date-picker` / `date-range-picker` / `time-picker` triggers · `segmented-control` root ·
tab triggers (`tabs`, `tab-nav`) · `paginator` buttons · `sort` header

**`min-h-*`** — the box must be free to grow with content, but never sit below the scale:

`textarea` · `tags-input` (chips wrap) · `form-field` (wraps arbitrary consumer controls) ·
`item` · `menu` item / option rows · table cell · `tree` node · `toast`

Angular Material makes `form-field` its only non-pinned control for exactly this reason.

## 3. Padding rule — this is the part that goes wrong

> **Where a height is pinned, vertical padding is deleted.** Horizontal padding stays.

Material states this normatively: *"Do not change the padding … Change dimensions."*

Leaving `py-2` alive next to `h-9` means padding and height fight. Under Preflight's global
`box-sizing: border-box` the taller one wins, invisibly, and the pinned height becomes a lie.

```
- size: { md: 'px-4 py-2 text-sm' }
+ size: { md: 'px-4 text-sm h-9' }
```

Centring comes from the layout, not the padding — `inline-flex items-center` on the base (most
components already have it). A bare `<input>` needs no flex; browsers centre its text natively.

**The border is inside the height.** `border-box` means a bordered control at `h-9` measures 36px
*including* its 2px border. No compensation, no separate scale for bordered controls. That
2px divergence between bordered and unbordered controls — the root cause of the original 30px
form-row spread — disappears by construction.

Where a component keeps `py-*` (the `min-h` set), the padding stays exactly as it is.

### Slack check

Every pinned size has room for its line box, so nothing overflows:

| size | height | line box | border | slack |
|---|---:|---:|---:|---:|
| xs | 24 | 16 (`text-xs`) | 2 | 6 |
| sm | 32 | 20 (`text-sm`) | 2 | 10 |
| md | 36 | 20 (`text-sm`) | 2 | 14 |
| lg | 44 | 24 (`text-base`) | 2 | 18 |
| xl | 48 | 24 (`text-base`) | 2 | 22 |

Line-heights are pinned in `rem` in `theme/_typography.css` so a consumer re-uniting `--text-sm`
cannot rescale the line box out from under a pinned height.

## 4. Cohorts

The instrument tracks two groups, because they have different obligations:

- **`form-row`** — box-matched controls with a bordered or filled shell. **Must** collapse to a
  single height at every size. Spread > 0 is a defect.
- **`selection`** — `switch`, `checkbox`, `radio`. Glyph-scale by design; box-matching them would
  mean inflating a checkbox to the height of a text input. Tracked, not held to zero spread.

`slider` is in **neither** cohort. Its root is `flex flex-col w-full` and the track region
collapses to roughly thumb height, so it is not box-matched against a text input — but unlike the
selection controls it is not a glyph either. A slider is *centred* against its toolbar
neighbours, never height-matched to them.

Content-driven components (card, alert, table, timeline, accordion) are in neither. Their
heights are meaningful but not comparable to a control height.

## 5. Verifying

```bash
npm start                       # demo dev server
node scripts/measure-rhythm.mjs # every slot, every size, cohort verdict
```

The verdict line is `WORST FORM-ROW SPREAD ACROSS ALL SIZES`. It must be `0px`.

`e2e/specs/02-cross-cutting/vertical-rhythm.spec.ts` enforces the same thing in CI
(`npx playwright test --grep @rhythm`).

## 6. Result

**Before: 30px worst spread. After: 0px at every size.** 18 form-row controls, one height each.

| | xs | sm | md | lg | xl |
|---|---:|---:|---:|---:|---:|
| **Every form-row control** | 24 | 32 | 36 | 44 | 48 |

Movements worth knowing about:

- **`date-picker`** 42/46/50/54/58 → 24/32/36/44/48. Its trigger padding was a fixed `px-3 py-2`
  at every size, with the whole density axis expressed through the trigger button instead.
- **`time-picker`** 42/42/42/50/50 → 24/32/36/44/48. Three of five sizes rendered identically;
  the size axis now actually has five steps.
- **`date-range-picker`** 34/38/38/42/42 → 24/32/36/44/48. Two dead steps removed.
- **`button` outline** was 2px taller than `button` solid at every size — same component, same
  size. Border-box absorbs the border; they are now identical.
- **`select`** measured 27px at `xs`, the only odd-pixel value in the library. The cause was not
  padding: its trigger was `inline-flex` where `combobox`'s was `flex`, so an inline-level
  trigger in a block root generated a line box driven partly by the consumer's inherited font
  strut. Pinning alone would have masked it; the trigger is now `flex`.
- **`form-field`** wrapped controls inherited the ambient 16px line box at every size, because
  its `size` variants were empty and `input.ts` strips the nested control's own `text-*`. The
  size axis was inert for typography. Fixed, and its control row is now on the scale.

### Deliberate non-participants

- **Selection controls** (`switch`, `checkbox`, `radio`, `slider`) — glyph-scale by design.
- **`textarea`, `tags-input`, `item`, `menu` rows, table cells, `tree` nodes, `form-field`** take
  a `min-h-*` floor, not a pin, so content can grow. A tags-input whose chips **wrap to a second
  row** is legitimately taller; one showing a *single* row of chips is not, and sits on the scale
  exactly like the empty control.

  > **Corrected 2026-09-02.** This bullet previously read "an *empty* tags-input sits on the
  > scale; a populated one is legitimately taller, because the chip out-measures the text line."
  > The mechanism was real — the chip does out-measure the text line at xs, md, lg and xl, and
  > not at sm, where the two are both 20px — but the conclusion was wrong. It described the
  > symptom of a padding bug as if it were a design intent. `tags-input`'s own compound-variant
  > comment stated the opposite intent: vertical padding is set below the nominal scale "so the
  > `min-h-*` floor actually BINDS at rest". It did not bind, because the arithmetic was computed
  > against the input's line box rather than against the chip.
  >
  > Measured populated: **26 / 32 / 38 / 50 / 54** against a 24 / 32 / 36 / 44 / 48 scale. A
  > filter bar was therefore on the grid until the user typed the first tag, then jumped 2px at
  > xs and md and 6px at lg and xl. Padding is now sized against the chip, so the floor binds in
  > the single-row case and still governs the wrapped case. Resting appearance is unchanged —
  > once the floor binds, `items-center` centres the chip and the padding no longer sets the
  > height. Gated by the `Pinned next to floored` row in `e2e/specs/02-cross-cutting/row-alignment.spec.ts`.
- **`button` `variant="link"`** — no box; a pinned height would blow out the line box of any
  paragraph it sits in.
- **`date-picker` with a projected custom trigger** — the consumer owns that box.
- **`naked` variants** (auto-applied inside `tw-form-field`) — the wrapper owns the height.
  Pinning both would have stacked to 54px at `md`.

### One accessibility trade-off, made explicitly

`segmented-control` at `xs` drops its `p-1` inset. The option — not the root — carries
`role="radio"` and the click handler, so the option is the target. A 24px root minus a 4px inset
per side leaves a 16px target, under the WCAG 2.2 SC 2.5.8 floor. An inset track and a 24px
target cannot both fit in 24px. The alternative (a 32px root at `xs`) would have kept the inset
but broken the shared control height. The inset returns at `sm` and above.

---

## 7. Row alignment — what the per-slot measurements cannot tell you

**Status:** normative. Adopted 2026-09-02.
**Instrument:** the "Row alignment" section of `/foundations/rhythm`.
**Gate:** `e2e/specs/02-cross-cutting/row-alignment.spec.ts` (`@rowalign`).

§1–§6 answer *"is this control the right height?"* by measuring each control alone. That cannot
answer *"do these two line up?"* — and the two are genuinely different questions. Every control
below passes the isolated check; some rows still misalign.

The instrument measures **two boxes per item**, because for a wrapper they are not the same box:

| Box | What it is |
|---|---|
| **outer** | the element the consumer writes in their markup |
| **control** | the visible shell — the bordered or filled box a reader perceives as "the control" |

It reports five spreads (outer, control, top, bottom, centre). **Which one is load-bearing is
decided by the row's `align-items`, not by the components.** A non-zero top spread under
`items-center` is not a defect — it is what centring mismatched heights *means*. The invariant
that must hold in every mode is the **control spread**.

### 7.1 The result

At every size, the seven controls a toolbar puts side by side — button, input, select, combobox,
date-picker, time-picker, segmented-control — agree on **every** edge to the pixel, under
`items-center` and under `items-baseline` alike.

Two measured caveats, both recorded rather than hidden:

- **`items-baseline` carries a 0.5px offset at xs/sm/md.** Four controls place their first text
  baseline identically; a native `<input>` sits 0.5px higher. The shells are identical — the cause
  is that an input derives its baseline from its own text layout while every other control is a
  flex container deriving it from a child, and the two round differently at the fractional ascents
  12px and 14px text produce. At 16px (lg/xl) it is exactly zero. Forcing agreement means
  overriding a native input's baseline, which is not worth it; the gate tolerates 0.75px.
- **The consumer's inherited font cannot move a pinned control.** Verified by measuring the same
  row under `text-xs`, `text-sm` and `text-base` parents: identical at all three. This is the
  regression gate for the `select`-at-27px bug class (§6), which only a shared row with a varied
  font strut can see.

### 7.2 Aligning a labelled field against bare controls

A `tw-form-field` does not box-match a bare control: at `md` its shell is 36px — exactly on the
scale, agreeing with every neighbour — while its **outer box is 60px**. The extra 24px is the
reserved subscript (hint/error) row.

**Where that 24px sits is the whole answer.** The field's label floats *inside* the shell, so the
shell is at the TOP of the wrapper and the subscript row hangs below it. Measured, at `md`:

| mode | shell top spread | outer spread | |
|---|---:|---:|---|
| `items-center` | **12px** | 24px | the wrapper is centred, so the shell rides 12px high |
| `items-end` | **24px** | 24px | worst — aligns the empty subscript row to the row's bottom |
| `items-stretch` | 0px | 24px | tops agree, but `select` stretches to 60px |
| **`items-start`** | **0px** | 24px | shells line up exactly; subscript space hangs below the row |
| **`items-baseline`** | **0px** | 24px | resolves identically here |

So there are two clean fixes, and which one you want depends on whether the field will ever show a
validation message:

1. **`items-start` on the row.** Keeps the default `subscriptSizing="fixed"`, so the row does not
   move when an error appears. The row is 24px taller than its controls, with the reserved space
   below. This is the right default for a form.
2. **`subscriptSizing="dynamic"` on the field.** Collapses the hint/error row while it is empty, so
   the wrapper *becomes* its shell — outer spread 0px, and **every** align mode agrees, including
   `items-center`. The right choice for a filter bar or toolbar, where no validation message is
   expected. The cost is a layout shift the first time one appears.

> **Corrected 2026-09-02.** This section previously claimed that "no `align-items` value fixes
> this" and told consumers not to mix wrapped and bare controls in one row. That was inferred from
> the `items-center` and `items-end` readings without measuring the other three, and it is wrong:
> `items-start` fixes it exactly, and `subscriptSizing="dynamic"` fixes it in any mode. The
> mistaken advice came from assuming a label row sits *above* the shell; it does not, because the
> label floats inside it.

All five modes are rendered and measured live in the "Row alignment" section of
`/foundations/rhythm`, so the table above cannot drift from the components.
