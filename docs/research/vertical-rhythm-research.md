# Control Height Scales & Vertical Rhythm — Research and Recommendation

**Status:** research report / recommendation. No library code changed.
**Date:** 2026-09-02
**Scope:** `projects/ngx-tw` — 54 components on the shared `xs | sm | md | lg | xl` size axis.

---

## 1. Executive recommendation

### 1.0 The convergent answer

**Where they agree.** Five of the seven systems surveyed set control height **explicitly**
(Primer, Radix, Carbon, Angular Material, shadcn — plus Ant's Button and Select). The two that
*derive* height from padding are the two that produce fractional or unstated results: Ant's
`Input` lands on **24.06px**, and MD3's text field has **no height token at all** behind its
famous 56dp. Of the systems that pin, three write **vertical padding to zero** rather than
leaving it inert (Primer, Angular Material, Ant's Button) — Material states this normatively:
*"Do not change the padding … Change dimensions."* Every system also pins line-height, by one
route or another: absolute px (Radix), a whole-pixel ratio per token (Carbon), a derived
`fontSize + 8` (Ant), or a **constant 20px line box across all five sizes** (Primer). And every
one of them **releases the fixed height for multi-line content while keeping a `min-height`
floor** — Primer via `data-label-wrap`, Mantine via `data-multiline`, shadcn via
`has-[>textarea]:h-auto`, Angular Material by never pinning `form-field` at all.

**Where they diverge** — in range, not in kind. `24 / 32 / 40` is common to Radix, Ant, Carbon
and Primer. Only **Primer publishes a full five-step ladder — 24/28/32/40/48** — which is
exactly the axis shape ngx-tw needs. Mantine (30/36/42/50/60) is the sole system off the 4px
grid; MD3 (32/40/56/96/136) is the sole mobile-first ladder. Nobody grows control heights on
touch: Primer raises only a `minTarget` token and the gaps *between* controls.

**So: pin explicit border-box heights from a token scale, delete vertical padding where pinned,
keep it where the box can grow, and pin line-heights so the line box is a fixed grid multiple.**
That is what §1.2–§1.6 specify.

### 1.1 The problem, in numbers

ngx-tw expresses size **only** as padding + font-size. Nothing pins a height, so every
component re-derives its own. With Tailwind Preflight's global `box-sizing: border-box`
([docs](https://tailwindcss.com/docs/preflight)) and Tailwind's default text metrics
(`text-xs` → 16px line box, `text-sm` → 20px, `text-base` → 24px —
[docs](https://tailwindcss.com/docs/font-size)), today's `button` computes to:

| size | padding-block | line box | border | **total** |
|---|---|---|---|---|
| xs | `py-1` → 8 | 16 | 2 | **26** |
| sm | `py-1.5` → 12 | 20 | 2 | **34** |
| md | `py-2` → 16 | 20 | 2 | **38** |
| lg | `py-2.5` → 20 | 24 | 2 | **46** |
| xl | `py-3` → 24 | 24 | 2 | **50** |

None land on a 4px grid. The *content boxes* — 24/32/36/44/48 — **are** grid-aligned; the 1px
border is what breaks them. That is the whole bug in one sentence.

**Four disagreeing scales already ship in this repo:**

| source | xs | sm | md | lg | xl |
|---|---|---|---|---|---|
| `button` (padding-derived) | 26 | 34 | 38 | 46 | 50 |
| `paginator` (pinned `h-7`…`h-11`) — `paginator.ts:281-311` | 28 | 32 | 36 | 40 | 44 |
| `slider` region (pinned `h-6`…`h-10`) — `slider.ts:162-186` | 24 | 28 | 32 | 36 | 40 |
| `CLAUDE.md` square-interactive (`size-6`…`size-9`) | 24 | 28 | 32 | 36 | — |

And drift **inside a single component**: `button.ts:18` puts no border on the base, while
`button.ts:20-22` gives `border` to the `outline` variant only. So **`button` solid `md` is
36px and `button` outline `md` is 38px** — same component, same size, 2px apart.

### 1.2 Recommended control-height tokens

Add to `projects/ngx-tw/theme/_semantic.css`:

```css
@theme {
  /* ===== Control heights =====
     Pinned border-box heights for single-line interactive controls. Every value is a
     multiple of 4px; the four primary steps (24/32/40/48) are also multiples of 8px.
     xs is pinned at 24px — the WCAG 2.2 SC 2.5.8 (AA) target-size floor. Do not lower it.
     Tailwind resolves h-*/min-h-*/max-h-* through the `--height-*` namespace, so these
     generate `h-control-md`, `min-h-control-md` and `max-h-control-md`.
     NOTE: these names must also be registered in the shared twMergeConfig (see §5.3),
     or consumer `class` overrides will not win against them. */
  --height-control-xs: 1.5rem;   /* 24px */
  --height-control-sm: 1.75rem;  /* 28px */
  --height-control-md: 2rem;     /* 32px */
  --height-control-lg: 2.5rem;   /* 40px */
  --height-control-xl: 3rem;     /* 48px */
}
```

| size | px | utility | Tailwind equiv. | Attestation |
|---|---|---|---|---|
| `xs` | **24** | `h-control-xs` | `h-6` | WCAG 2.2 floor · **Primer `--control-xsmall-size`** · Radix `--space-5` · Ant `controlHeightSM` · Carbon `$size-xs` · shadcn `h-6` · ngx-tw square-interactive `xs` |
| `sm` | **28** | `h-control-sm` | `h-7` | **Primer `--control-small-size`** · shadcn `radix-nova` `sm` · ngx-tw square-interactive `sm` · `paginator` `sm` |
| `md` | **32** | `h-control-md` | `h-8` | **Primer `--control-medium-size`** · Radix size `2` (default) · Ant `controlHeight` seed (default) · Carbon `$size-sm` · shadcn `radix-nova` default · ngx-tw square-interactive `md` |
| `lg` | **40** | `h-control-lg` | `h-10` | **Primer `--control-large-size`** · Radix size `3` · Ant `controlHeightLG` · Carbon `$size-md` · shadcn Track A `lg` |
| `xl` | **48** | `h-control-xl` | `h-12` | **Primer `--control-xlarge-size`** · Radix size `4` · Carbon `$size-lg` · MD3 48dp touch target |

Steps are **+4 / +4 / +8 / +8**.

> **This is not a synthesised compromise — it is GitHub Primer's shipped control scale,
> value for value.** `@primer/primitives@11.10.0` publishes exactly
> `--control-{xsmall,small,medium,large,xlarge}-size` = **24 / 28 / 32 / 40 / 48**, and Primer
> is the mature system whose size axis has the same five-step shape as ngx-tw's. Every
> individual value is independently confirmed in at least two other systems (§2).

> The brief's illustrative `--height-control-md: 2.25rem` (`h-9`, 36px) is **rejected** — §4.1.
> The *namespace* in that example is right; the number is not.

**Vertical slack check** — every row must be ≥ 0; this is what makes the numbers non-arbitrary:

| size | height | line box | border | slack | per side |
|---|---|---|---|---|---|
| xs | 24 | 16 (`text-xs`) | 2 | 6 | **3px** |
| sm | 28 | 20 (`text-sm`) | 2 | 6 | **3px** |
| md | 32 | 20 (`text-sm`) | 2 | 10 | **5px** |
| lg | 40 | 24 (`text-base`) | 2 | 14 | **7px** |
| xl | 48 | 24 (`text-base`) | 2 | 22 | **11px** |

`xs`/`sm` at 3px per side are tight — but Primer reaches the identical numbers from the other
direction (`size = 20px lineBox + 2 × paddingBlock`, with `paddingBlock` = 2/4/6/10/14), and
Radix size 1 is likewise a 24px shell around a 16px line box. It is defensible; it is stated
here rather than left to be discovered.

### 1.3 Line-height tokens — pin them in `rem`

Tailwind's defaults are **unitless ratios** (`--text-sm--line-height: calc(1.25 / 0.875)`), so a
consumer who reunits `--text-sm` rescales every line box and silently breaks every pinned
height. Radix pins line-heights as **absolute px** and that is exactly why its 24/32/40/48
shells land on integers. Do the same:

```css
@theme {
  --text-2xs: 0.6875rem;  --text-2xs--line-height:  1rem;     /* 11 / 16 */
  --text-xs:  0.75rem;    --text-xs--line-height:   1rem;     /* 12 / 16 */
  --text-sm:  0.875rem;   --text-sm--line-height:   1.25rem;  /* 14 / 20 */
  --text-base: 1rem;      --text-base--line-height: 1.5rem;   /* 16 / 24 */
}
```

These reproduce Tailwind's *computed* defaults exactly (16/20/24), so **the visual diff is
zero** — but the line box becomes a fixed 4px multiple that cannot be rescaled out from under a
pinned height. Pure robustness, no redesign.

### 1.4 Base unit and stacking rhythm

- **Base unit: 4px.** Tailwind's `--spacing` already defaults to `0.25rem`; keep it. Every
  control height and stacking gap is a multiple of 4; the primary steps (24/32/40/48) are
  additionally multiples of 8. This matches Primer (4px-based control scale) rather than
  Carbon (strict 8px mini unit) — 28px cannot exist on an 8px grid, and a five-step axis needs it.
- **No typographic baseline grid** — see §3.
- **Stacking (composition level, which the library does not own):**

  | between | gap |
  |---|---|
  | control ↔ its own hint/error | 4px (`mt-1`) — already `form-field`'s `subscriptWrapper`; + `min-h-5` = 24 reserved |
  | stacked form fields | 16px (`space-y-4`) |
  | form sections | 24px (`space-y-6`) |
  | page sections | 32/48px (`space-y-8` / `space-y-12`) |

> `CLAUDE.md` forbids `gap-4`+ **inside** components. That rule governs intra-component gaps
> and is unaffected: the table above is spacing *between* components.

### 1.5 Mechanism — one token family, two utilities

Verified empirically against this repo's Tailwind 4.3.0 (§5.1):

```
["h",     ["--height","--spacing"]]
["min-h", ["--min-height","--height","--spacing"]]
["max-h", ["--max-height","--height","--spacing"]]
```

`--height-control-md` generates **`h-control-md` *and* `min-h-control-md`**. The pinned-vs-min
split is therefore a per-component **utility** choice, not a token-scale choice — no second
token family. This is exactly Primer's two-mode design (§2.3).

| family | utility | components |
|---|---|---|
| **Pinned** — single-line, the control *is* the box | `h-control-*` + `inline-flex items-center`, `py-*` deleted | `button`, `input` (standalone), `select` trigger, `combobox` trigger, `date-picker` / `date-range-picker` triggers, `time-picker` fields, `number-input`, `segmented-control` item, `tabs` / `tab-nav` trigger, `paginator` nav/page buttons, `sort` trigger, `command-palette` input |
| **Min** — may wrap, grow, or wrap an unknown child; `py-*` stays load-bearing | `min-h-control-*`, keep `py-*` | `textarea`, `tags-input` root, `item` root, `menu` item, `select`/`combobox`/`command-palette` option, `table` cell, `tree` node, `timeline` content, `toast`, any wrapping-label button, **`form-field` `controlWrapper`** (§5.6 — it wraps arbitrary consumer controls, so it cannot assume a child height; this is Angular Material's documented carve-out too) |
| **Square targets** — own axis, same numbers | `h-control-* w-control-*` (**not** `size-*`) | icon-only buttons, `stepper` indicators, `calendar` cells, `paginator` ellipsis |
| **Excluded** — must NOT take a control height | own scales | `avatar`, `icon`, `spinner`, `progress-bar`, `separator`, `skeleton`, `badge` (inline; WCAG *Inline* exception), dot indicators, and all containers (`card`, `alert`, `dialog`, `sheet`, `popover`, `empty-state`, `code-block`) which use the container-padding scale |

**Square targets:** `size-*` resolves through `--spacing-*` **only** — verified: `size-ha` is
*not* generated from `--height-ha`. So squares use `h-control-md w-control-md` (or
`h-control-md aspect-square`). This is a feature: it unifies the square-interactive scale with
the control scale and retires the fourth rogue scale (its `lg` moves 36 → 40). Primer, Radix
and shadcn all make icon buttons exact squares of the control height.

**Pinning fixes the border problem for free.** Preflight's global `box-sizing: border-box` means
`h-control-md` is 32px *including* borders, so the solid-vs-outline 2px drift vanishes. Radix
needs an explicit padding-absorption trick for this
(`padding: var(--text-field-border-width)`); border-box gives it to us free.

### 1.6 Hard requirement: register the tokens with `twMerge`

**`twMerge('h-control-md h-11')` returns `"h-control-md h-11"` — both survive.** tailwind-merge
does not recognise a named height token, so a consumer's `h-11` does **not** override the
library's class, and source order decides. That violates `CLAUDE.md`'s rule that `twMerge` be
enabled "so consumer class overrides resolve correctly against internal classes".

Verified fix — register the names once and share the config across every `tv()` call:

```ts
// core/tw-merge-config.ts
const controlSizes = ['control-xs', 'control-sm', 'control-md', 'control-lg', 'control-xl'];

export const twMergeConfig = {
  extend: {
    classGroups: {
      h: [{ h: controlSizes }],
      'min-h': [{ 'min-h': controlSizes }],
      'max-h': [{ 'max-h': controlSizes }],
      w: [{ w: controlSizes }],
    },
  },
};
```

`tailwind-variants` accepts this as `tv(config, { twMerge: true, twMergeConfig })`. Confirmed
behaviour after extending:

| input | result |
|---|---|
| `h-control-md h-11` | `h-11` ✅ consumer wins |
| `h-11 h-control-md` | `h-control-md` ✅ last-wins preserved |
| `min-h-control-md min-h-11` | `min-h-11` ✅ |
| `h-8 h-11` | `h-11` ✅ numeric unaffected |

**This is not optional.** Without it the tokens are a regression in customisability — which is
precisely why shadcn keeps literal `h-9` classes and tokenises only colour and radius (§2.6).

---

## 2. Evidence per design system

### 2.1 GitHub Primer — *the closest structural match, and the exact scale*

`@primer/primitives@11.10.0`, source SHA `8b683a1`.

| Token | rem | px |
|---|---|---|
| `--control-xsmall-size` | `1.5rem` | **24** |
| `--control-small-size` | `1.75rem` | **28** |
| `--control-medium-size` | `2rem` | **32** |
| `--control-large-size` | `2.5rem` | **40** |
| `--control-xlarge-size` | `3rem` | **48** |

[`size.css`](https://unpkg.com/@primer/primitives@11.10.0/dist/css/functional/size/size.css) ·
[`size.json5`](https://github.com/primer/primitives/blob/8b683a1c4729ea8179c042401584b2ddaa88b519/src/tokens/functional/size/size.json5)

Full family:

| step | `-size` | `-paddingBlock` | `-paddingInline` condensed / normal / spacious | `-gap` |
|---|---|---|---|---|
| xsmall | 24 | 2 | 4 / 8 / 12 | 4 |
| small | 28 | 4 | 8 / 12 / 16 | 4 |
| medium | 32 | 6 | 8 / 12 / 16 | 8 |
| large | 40 | 10 | 8 / 12 / 16 | 8 |
| xlarge | 48 | 14 | 8 / 12 / 16 | 8 |

**The generating rule.** `control.{step}.lineBoxHeight` was **`1.25rem` (20px) for all five
steps** in [10.5.0](https://unpkg.com/@primer/primitives@10.5.0/dist/css/functional/size/size.css)
(tombstoned as `null` in 11.10.0's `removed.json`). So:

```
size = lineBoxHeight + 2 × paddingBlock,  lineBoxHeight = 20px constant
24 = 20+2(2)   28 = 20+2(4)   32 = 20+2(6)   40 = 20+2(10)   48 = 20+2(14)
```

All five, no rounding. **The height scale is entirely a function of vertical padding around a
fixed 20px line box** — which is the strongest possible argument for §1.3's pinned line-heights.

**Mechanism — explicit `height`, block padding literally `0`**
([`ButtonBase.module.css`](https://github.com/primer/react/blob/main/packages/react/src/Button/ButtonBase.module.css)):

```css
.ButtonBase { height: var(--control-medium-size); padding: 0 var(--control-medium-paddingInline-normal); }
&:where([data-size='small']) { height: var(--control-small-size); padding: 0 var(--control-small-paddingInline-condensed); gap: var(--control-small-gap); }
```

…and the two-mode release for wrapping labels — **this is §1.5's rule, shipped**:

```css
&:where([data-label-wrap='true']) {
  height: unset;
  min-height: var(--control-medium-size);
  & .ButtonContent { padding-block: calc(var(--control-medium-paddingBlock) - var(--base-size-2)); }
}
```

Icon-only buttons set `width: var(--control-{size}-size)` for an exact square.

Base scale `--base-size-*`: 2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 64, 80, 96, 112, 128px.
`--space-{xxs…xl}`: 2, 4, 8, 12, 16, 24px
([space.css](https://unpkg.com/@primer/primitives@11.10.0/dist/css/functional/spacing/space.css)).

**Two corrections worth carrying:**

- **Do not attribute an 8px grid to modern Primer.** No 8px/4px-grid statement exists in
  `primer/primitives` or on primer.style. It survives only in the superseded `primer/css`
  (`$spacer: 8px`, "a base-8 scale"). Modern `--space-*` (2/4/8/12/16/24) is not base-8, and
  **28px cannot sit on an 8px grid**.
- **Control heights do not grow on touch.** The entire coarse-pointer override
  ([size-coarse.css](https://unpkg.com/@primer/primitives@11.10.0/dist/css/functional/size/size-coarse.css))
  raises only `--control-minTarget-auto` to `2.75rem` (44px) and widens *inter-control* stack
  gaps (8 → 12/16px). Heights are untouched. Primer's touch strategy is **spacing, not size** —
  which is exactly WCAG 2.5.8's own *Spacing* exception (§4.6).

### 2.2 Radix Themes 3.3.0 — *pins outer height directly from the space scale*

Commit [`1faff10`](https://github.com/radix-ui/themes/tree/1faff10ac26ae17f09944d418c6949b93fc6b566/packages/radix-ui-themes/src).
[`styles/tokens/space.css`](https://github.com/radix-ui/themes/blob/1faff10ac26ae17f09944d418c6949b93fc6b566/packages/radix-ui-themes/src/styles/tokens/space.css) — in **px, not rem**:

```css
--space-1: calc(4px  * var(--scaling));   --space-6: calc(32px * var(--scaling));
--space-2: calc(8px  * var(--scaling));   --space-7: calc(40px * var(--scaling));
--space-3: calc(12px * var(--scaling));   --space-8: calc(48px * var(--scaling));
--space-4: calc(16px * var(--scaling));   --space-9: calc(64px * var(--scaling));
--space-5: calc(24px * var(--scaling));
```

Control heights *are* scale steps — no derivation:

| component | variable | size 1 | size 2 (default) | size 3 | size 4 |
|---|---|---|---|---|---|
| Button / IconButton | `--base-button-height` | **24** | **32** | **40** | **48** |
| TextField | `--text-field-height` | **24** | **32** | **40** | *none* |
| Select trigger | `--select-trigger-height` | **24** | **32** | **40** | *none* |
| SegmentedControl | direct `height:` | **24** | **32** | **40** | *none* |

Only Button reaches size 4. **Line-heights are absolute px**
([`typography.css`](https://github.com/radix-ui/themes/blob/1faff10ac26ae17f09944d418c6949b93fc6b566/packages/radix-ui-themes/src/styles/tokens/typography.css)):
12/16, 14/20, 16/24, 18/26, 20/28, 24/30, 28/36, 35/40, 60/60. A size-2 button is 32 = 20 line
box + 6 + 6.

Worth stealing: **border absorbed into padding** so outer height is variant-invariant —
`.rt-TextFieldRoot { height: var(--text-field-height); padding: var(--text-field-border-width); }`
with `--text-field-padding` = `space − border-width`. ngx-tw gets this free from border-box.
Worth copying: **`ghost` opts out of the pin** — `box-sizing: content-box; height: fit-content;`
plus negative margins so text still aligns (precedent for §1.5's "excluded" family).
**Worth avoiding:** `--scaling` (0.9–1.1) multiplies everything, so at 95% `--space-6` = **30.4px**.
Radix accepts subpixel control heights as the price of one global knob.

### 2.3 Ant Design 6.6.2 — *one seed, three fixed ratios*

Commit [`77d8317`](https://github.com/ant-design/ant-design/tree/77d831751b3452a8291256fa187553a258e2cf1e/components).
[`genControlHeight.ts`](https://github.com/ant-design/ant-design/blob/77d831751b3452a8291256fa187553a258e2cf1e/components/theme/themes/shared/genControlHeight.ts), entire file:

```ts
const genControlHeight = (token: SeedToken): HeightMapToken => {
  const { controlHeight } = token;
  return {
    controlHeightSM: controlHeight * 0.75,
    controlHeightXS: controlHeight * 0.5,
    controlHeightLG: controlHeight * 1.25,
  };
};
```

Seed `controlHeight: 32` ⇒ **XS 16 / SM 24 / base 32 / LG 40**; unchanged across v5→v6.
The public `size` prop reaches only three: `small` 24, `medium`/`undefined` 32, `large` 40.
`controlHeightXS` (16) is unreachable — only `skeleton` and `color-picker` consume it.

Keystone identity ([`genFontSizes.ts`](https://github.com/ant-design/ant-design/blob/77d831751b3452a8291256fa187553a258e2cf1e/components/theme/themes/shared/genFontSizes.ts)):
`getLineHeight = (fontSize + 8) / fontSize` — **the text box is always `fontSize + 8`**
(12→20, 14→22, 16→24). Because 32−22 and 40−24 are even, half-paddings are integers.

**Ant does not pin uniformly, and the exception is instructive:**

| component | mechanism | small / base / large |
|---|---|---|
| Button | **pinned** `height: controlHeight`; `paddingBlock` computed then hard-set to `0`, never read | 24 / 32 / 40 |
| Select | **pinned** via `--ant-select-input-height` | 24 / 32 / 40 |
| Textarea | `minHeight: controlHeight` only | ≥ 32 |
| **Input** | **emergent** — no `height`; `paddingBlock` reverse-derived from `(controlHeight − textBox)/2 − lineWidth` | **~24.06** / 32 / 40 |

Input's small size lands on **24.06px**, because `paddingBlockSM` multiplies the small font size
by the *medium* line-height. That fractional drift is exactly ngx-tw's current bug, reproduced
in a mature system that reverse-derives padding instead of pinning.

### 2.4 IBM Carbon — *strict 8px mini unit, `clamp()`-based application*

> "The basic unit of 2x Grid geometry is the **8-pixel square mini unit**."
> — [2x Grid overview](https://carbondesignsystem.com/elements/2x-grid/overview/)

Confirmed in code: `const miniUnit = 8;`
([@carbon/layout 11.58.0](https://unpkg.com/@carbon/layout@11.58.0/es/index.js)).

Control heights, `$layout-tokens`
([@carbon/styles 1.114.0 `utilities/_layout.scss`](https://unpkg.com/@carbon/styles@1.114.0/scss/utilities/_layout.scss)):

```scss
size: ( height: ( xs: 24px, sm: 32px, md: 40px, lg: 48px, xl: 64px, 2xl: 80px ) ),
```

Confirmed on the spec pages — Button xs **24** / sm **32** / md **40** / lg **48** / xl **64** / 2XL **80**
([style](https://carbondesignsystem.com/components/button/style/)); Text input sm **32** / md **40** / lg **48**
([style](https://carbondesignsystem.com/components/text-input/style/)); Dropdown identical
([style](https://carbondesignsystem.com/components/dropdown/style/)).

Spacing scale `$spacing-01…13` = **2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160**px
([_spacing.scss](https://unpkg.com/@carbon/layout@11.58.0/scss/generated/_spacing.scss)). Note
`$spacing-01/02/04` (2/4/12) deliberately sit **off** the mini unit — the 8px grid governs
layout and the height scale, explicitly **not** component-internal spacing. This is the direct
precedent for §1.4's "4px base, 8px for the primary steps".

**Mechanism:** heights are set explicitly via `block-size`, never derived from padding. Modern
components opt into a clamped custom property:

```scss
@include layout.use('size', $default: 'md', $min: 'xs', $max: 'lg');
block-size: layout.size('height');   // -> var(--cds-layout-size-height-local)
```

`text-input`, `select`, `search`, `list-box` all use `$default:'md', $min:'xs', $max:'lg'`;
`button` uses `$min:'xs', $default:'lg', $max:'2xl'`. Legacy components still hardcode rem
(`dropdown`, `number-input`, `date-picker`) — Carbon is mid-migration.

**Line-height is pinned per type token** ([_styles.scss](https://unpkg.com/@carbon/type@11.66.0/scss/_styles.scss)),
with ratios chosen so the productive tier lands on whole pixels: 12/1.33333 = **16**,
14/1.28572 = **18**, 14/1.42857 = **20**, 16/1.375 = **22**, 16/1.5 = **24**. The display tier
abandons whole-pixel snapping; the productive tier does not.

### 2.5 Mantine — *the divergent case, and the best multi-line answer*

`@mantine/core@9.6.0`.
[`Input.module.css`](https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/components/Input/Input.module.css):

```css
--input-height-xs: 30px;  --input-height-sm: 36px;  --input-height-md: 42px;
--input-height-lg: 50px;  --input-height-xl: 60px;
--input-height: var(--input-height-sm);   /* default size = sm */
```

`--button-height-*` is **identical** (30/36/42/50/60), plus a second `compact-*` track
(22/26/30/34/40). **Mantine is the outlier: 30, 42 and 50 are not multiples of 4**, and the
height ladder is not derived from the spacing ladder (`--mantine-spacing-*` = 10/12/16/20/32px).
Both are hand-tuned sequences. This is the counter-example that shows what "no grid" costs.

Two mechanisms worth stealing regardless:

1. **Single-line centring by line-height, not flex**: `line-height: calc(var(--input-height) - 2px)`,
   with `padding-y: 0`. Horizontal padding is *derived*: `--input-padding: calc(var(--input-height) / 3)`.
   Adornment slots are squares of `height − 2px`.
2. **The multi-line flip** — `[data-multiline] { --input-size: auto; --input-line-height: 1.55; }`
   with `padding-y` turning on, while `min-height: var(--input-height)` is **never released**.

### 2.6 shadcn/ui — *the Tailwind-native idiom, and a deliberate non-tokenisation*

`shadcn-ui/ui@main`. **Two live registry tracks with different scales:**

| track | xs | sm | default | lg |
|---|---|---|---|---|
| `new-york-v4` (Track A) | `h-6` **24** | `h-8` **32** | `h-9` **36** | `h-10` **40** |
| `radix-nova` (Track B) | `h-6` **24** | `h-7` **28** | `h-8` **32** | `h-9` **36** |

Track A `button` size variants, verbatim
([source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/button.tsx)):

```tsx
size: {
  default: "h-9 px-4 py-2 has-[>svg]:px-3",
  xs: "h-6 gap-1 rounded-md px-2 text-xs ...",
  sm: "h-8 gap-1.5 rounded-md px-3 ...",
  lg: "h-10 rounded-md px-6 ...",
  icon: "size-9", "icon-xs": "size-6", "icon-sm": "size-8", "icon-lg": "size-10",
},
```

Icon buttons are exact squares of each height. `Input` is `h-9` with **no size variant at all**.
`SelectTrigger` uses `data-[size=default]:h-9 data-[size=sm]:h-8`. Historically the ecosystem
drifted **downward**: v3 `default` was `h-10` (40) → `new-york` `h-9` (36) → nova `h-8` (32).

**Textarea — the critical answer: `min-h-16`, never `h-*`**
([source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/textarea.tsx)):

```tsx
"flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 ..."
```

`min-h-16` = 64px (v3's `min-h-[60px]` snapped onto the scale, +4px). No `h-*` in *either* track.
`py-2` **is** load-bearing here. `field-sizing-content` is auto-grow — **Chromium-only**, so
`min-h-*` is the real cross-browser floor.

And the two-mode release, in `InputGroup`
([source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/input-group.tsx)):

```tsx
"h-9 min-w-0 has-[>textarea]:h-auto",
"has-[>[data-align=block-start]]:h-auto ...",
```

**Negative result, stated explicitly: shadcn introduced NO height tokens in `@theme`.** Its
`@theme inline` block carries only breakpoints, fonts, 7 radius steps and ~40 colour aliases.
Control height is a literal utility, not a token. The reason matters for us: a named or
arbitrary-property height does not merge under `twMerge` against a consumer's `h-11` — which is
exactly the trap §1.6 measures and fixes. shadcn avoids the problem by not tokenising;
we solve it by extending the merge config.

The one height-ish token shadcn *does* use is a **component-local var**, and it is a good
pattern for derived geometry: `calendar` sets `[--cell-size:--spacing(8)]` then consumes
`size-(--cell-size)`, `h-(--cell-size)`, `min-w-(--cell-size)`; `card` uses
`[--card-spacing:--spacing(6)]` with `data-[size=sm]:[--card-spacing:--spacing(4)]`.

### 2.7 Material Design 3 / Angular Material — *pins heights, and hits our exact form-field problem*

`angular/components` @ [`a69732f`](https://github.com/angular/components/tree/a69732f546a5f1f43faeb0039fa08e4f7a1150f0) (v22.2.0-next.4);
`material-web` @ [`c05b4b2`](https://github.com/material-components/material-web/tree/c05b4b23485c803f68ff31cde52506cea5cc555a).

**MD3 classic container heights** (explicit `container-height` tokens): button **40px**, icon
button 40, chips 32, navigation tab 48, FAB small/standard/large 40/56/96, extended FAB 56,
data table header/row 56/52, select menu list item 48
([`_md-comp-filled-button.scss#L39`](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-comp-filled-button.scss#L39)).

**Text field: MD3 ships no height token at all** — the famous 56dp is *derived* from
`top-space 16 + body-large line-height 24 + bottom-space 16`, or with a label
`8 + 16 + 24 + 8`. Both = **56px** ([`_md-comp-filled-field.scss#L136`](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/_md-comp-filled-field.scss#L136)).
MD3 publishes **no dense text-field variant**.

**M3 Expressive button ladder** — 32 / 40 / 56 / 96 / 136dp (xs/s/m/l/xl), default = Small (40dp),
derived as `paddingTop + label line-height + paddingBottom` (6+20+6, 10+20+10, 16+24+16,
32+32+32, 48+40+48)
([`styles.xml`](https://github.com/material-components/material-components-android/blob/ac7e18efeefb331850c561faf9ab8bf81d27ba68/lib/java/com/google/android/material/button/res/values/styles.xml#L221)).
This is a **mobile ladder** — 96 and 136dp have no desktop analogue — and is the clearest
evidence that MD3 is the least transferable system here.

**Angular Material's density system.** Not a standalone `mat.density()` — it is a key inside
`mat.theme((density: -2))`. Heights at density 0 → minimum:

| token (minus `--mat-`) | 0 | -1 | -2 | -3 | -4 | -5 |
|---|---|---|---|---|---|---|
| `button-filled-container-height` (M3) | **40** | 36 | 32 | 28 | — | — |
| `button-filled-container-height` (M2) | **36** | 32 | 28 | 24 | — | — |
| `form-field-container-height` | **56** | 52 | 48 | 44 | 40 | 36 |
| `icon-button-state-layer-size` | 40 | 36 | 32 | 28 | 24 | **24** |
| `tab-container-height` | 48 | 44 | 40 | 36 | 32 | — |

**The documented "−4px per step" is a convention, not an algorithm** — it is `list.nth()` over a
hardcoded per-component array with a per-component floor
([`_m3-button.scss#L155`](https://github.com/angular/components/blob/a69732f546a5f1f43faeb0039fa08e4f7a1150f0/src/material/button/_m3-button.scss#L155)),
and it visibly breaks at the tails: `button-toggle` 40/40/40/36/**24**, `stepper-header` 72/68/64/60/**42**,
`list` three-line 88/84/80/76/72/**56**. The icon button caps at 24px with an inline comment —
*"anything lower will be smaller than the icon"* — the same floor logic as WCAG's 24px.

**Mechanism: heights are pinned, vertical padding is literally zero**
([`button.scss#L110`](https://github.com/angular/components/blob/a69732f546a5f1f43faeb0039fa08e4f7a1150f0/src/material/button/button.scss#L110)):

```scss
height: token-utils.slot(button-filled-container-height, $fallbacks);
padding: 0 #{token-utils.slot(button-filled-horizontal-padding, $fallbacks, true)};
```

This is a direct implementation of the M2 density rule (§5.4). Three mechanisms coexist: pinned
`height` (button, tabs, table, toolbar, chips, list, tree, stepper, expansion), `state-layer-size`
squares (checkbox, radio, icon-button), and **`form-field` as the sole hybrid** — see §5.6.

**Accessibility note that matters for §1.2:** `*-touch-target-display` follows
`(block, block, none, none)`, so **Angular Material silently drops the 48px touch target at
density ≤ −2**, and the docs warn *"Setting the density below 0 can reduce accessibility."*
A density ladder with no floor loses AA conformance — which is exactly why §1.2 pins `xs` at 24
and stops.

**Historical note:** `--mdc-filled-button-container-height` was real from v15–v19 (M2 ladder
36/32/28/24); the `--mdc-*` → `--mat-*` rename landed in **v20**. Exactly one `--mdc-*` vestige
survives in v22 (`--mdc-icon-button-state-layer-size`, emitted alongside its `--mat-` twin for
selector-specificity back-compat).

---

## 3. Baseline grid vs. vertical rhythm

**True typographic baseline alignment is not practiced in modern component systems.** The web
defeats it: variable line lengths, images and controls of arbitrary height, web-font loading
shifts, and sub-pixel rendering. In responsive interfaces "the baseline grid has no meaning
because elements such as controls, buttons, and images often cannot be set to the same height
parameters" ([Imperavi, *UI Typography*](https://imperavi.com/books/ui-typography/principles/vertical-rhythm/)).

What replaced it is the **soft grid**: elements are positioned relationally while every
measurement adheres to one base unit — *"all sizes, spacing (margins, padding) and line-heights
in your designs are multiples of 4px"*
([Designary](https://blog.designary.com/p/layout-basics-grid-systems-and-the-4px-grid)).
Hard grids are "overly restrictive and time-consuming to implement at scale"; soft grids
"align better with how development-side layout actually functions".

Every system surveyed here does the soft-grid thing, and the survey shows the *rhythm* is
carried by **pinned line-heights**, not by baseline alignment: Radix pins absolute px
line-heights; Carbon pins a ratio per type token chosen to yield whole pixels; Ant derives
`(fontSize + 8)`; Primer holds a **constant 20px line box across all five control sizes**. That
is the modern replacement for vertical rhythm, and §1.3 adopts it.

Beware the terminology trap: when Material says *"All components align to an 8dp square baseline
grid"* and *"Type aligns to the 4dp baseline grid"*
([M2, Spacing methods](https://m2.material.io/design/layout/spacing-methods.html)), "baseline
grid" means a **square dp grid**, not a typographic baseline.

Two dating caveats, both verified negatives, and both the same shape:

- **The 8dp/4dp grid language is M2's, not MD3's.** The current
  [MD3 spacing page](https://m3.material.io/foundations/layout/grids-spacing/spacing) contains
  **zero dp numbers** — it is prose about grouping, rhythm and proximity. Do not attribute the
  grid rule to MD3.
- **The 8px-grid claim does not hold for modern Primer either** (§2.1). It survives only in the
  superseded `primer/css`.

In both cases the *current* system is 4px-based or grid-agnostic while the quotable grid
statement belongs to a previous major version. Cite the version, not the brand.

The genuinely new development is CSS `text-box-trim` / `text-box-edge`, which removes the
half-leading a font reserves above and below its glyphs — the thing that made optical centring
need asymmetric padding. Shipped Chrome/Edge 133, Safari 18.2, Firefox 154 (2026-08-18),
making it **Baseline newly available**
([Chrome for Developers](https://developer.chrome.com/blog/css-text-box-trim)).

**Mention it; do not build on it.** "Baseline *newly* available" means field browsers still lack
it, and it changes where glyphs sit inside a box, not how tall the box is. Pinned heights remain
load-bearing; `text-box-trim` is a future polish pass for optical centring.

---

## 4. Trade-offs and rejected alternatives

### 4.1 Rejected: `md` = 36px (`h-9`, the brief's illustrative value)

The only real discriminator is **whether a 6px shrink on the default size, across 54 components
and the whole demo app, is acceptable.** Both candidates are on the 4px grid; both are attested.

| | **A — recommended** 24/28/32/40/48 | **B** 28/32/36/40/44 (`paginator`'s shipped scale) |
|---|---|---|
| `md` churn vs today's 38 | −6px | −2px |
| WCAG 24px floor at `xs` | ✅ exactly on it | ❌ `xs` = 28; no floor anchor |
| 8px grid at the primary steps | ✅ 24/32/40/48 | ❌ 28/36/44 are 4-only |
| shipped by a mature system, verbatim | ✅ **Primer, all five values** | ❌ no external match |
| `md` attestation | Primer medium, Radix default, Ant default, Carbon sm, nova default | shadcn Track A `h-9`, legacy Material button |
| unifies ngx-tw's square-interactive scale | ✅ at xs/sm/md | ❌ off by one step |

**A is recommended.** It is Primer's shipped five-step scale, it anchors `xs` on the WCAG floor,
and 32px is the most common default control height in dense web systems. B is the lower-churn
option and is legitimate **if and only if** preserving current density outranks grid alignment —
in which case adopt B wholesale rather than half-migrating.

### 4.2 Rejected: `--spacing-*` instead of `--height-*`

`--spacing-control-md` would also generate `h-control-md`, and it is the *documented* namespace.
But it additionally generates `p-control-md`, `py-control-md`, `gap-control-md`, `w-control-md`
and `size-control-md` — nonsense utilities that invite exactly the padding-vs-height fight this
proposal exists to end. `--height-*` generates precisely `h-`/`min-h-`/`max-h-`. See §5.1 for
proof and §5.2 for the one risk.

### 4.3 Rejected: a global `--scaling` multiplier (Radix's model)

Radix's own output shows the cost: at 95%, `--space-6` = **30.4px**. Fractional control heights
defeat the purpose. Consumers wanting a denser UI override the five `--height-control-*` tokens
directly — retheme-able, no new API.

### 4.4 Rejected: derive height from padding (status quo, numbers realigned)

Ant's `Input` is the counter-example: reverse-deriving `paddingBlock` from a target height yields
**24.06px**, because the derivation must guess which line-height applies. Padding-derived sizing
also cannot survive a variant that adds a border (ngx-tw's solid-vs-outline drift) without a
per-variant compensation rule. Primer proves the converse: constant line box + explicit height +
`padding: 0 <inline>` produces five exact integers.

### 4.5 Rejected: a second token family for `min-h`

Unnecessary — `min-h-*` falls through `--min-height` → `--height` → `--spacing`, so one
`--height-control-*` family serves both halves of the split (§1.5).

### 4.6 Rejected: growing control heights on touch devices

Tempting given Material's 48dp touch target
([M2, Spacing methods](https://m2.material.io/design/layout/spacing-methods.html)), but Primer
explicitly does **not** do it — its `@media (pointer: coarse)` block raises only
`--control-minTarget-auto` (44px) and widens inter-control gaps. WCAG 2.2 SC 2.5.8's own
*Spacing* exception endorses this: an undersized target conforms if a 24px-diameter circle
centred on it does not intersect another target's circle. **Spacing, not size**, is the
touch-density lever, and it belongs to the consumer's layout.

### 4.7 Rejected: a separate density axis (Angular Material's model)

Angular Material layers a `density: 0…-5` scale *orthogonal* to component size. ngx-tw already
has a five-step `size` axis on every component; a second multiplier would be redundant
configuration, and the input-count cap in `CLAUDE.md` argues against it independently.

The failure mode is also documented: Angular Material's ladder has **no accessibility floor** —
`*-touch-target-display` flips to `none` at density ≤ −2, and the guide concedes *"Setting the
density below 0 can reduce accessibility."* Its own `-4px` rule is not even arithmetic; it is a
hardcoded per-component lookup that breaks at every tail (§2.7). A single, floored, five-step
scale is simpler and safer. Consumers who want global density override the five
`--height-control-*` tokens.

---

## 5. Migration guidance

### 5.1 Empirical verification of the mechanism (Tailwind 4.3.0, this repo)

Compiled with the real `tailwindcss` API against `node_modules`:

| declared in `@theme` | `h-*` | `min-h-*` | `max-h-*` | `size-*` | `py-*` / `gap-*` / `w-*` |
|---|---|---|---|---|---|
| `--height-ha` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `--spacing-sa` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `--min-height-ma` | ❌ | ✅ | — | ❌ | ❌ |

Confirmed against Tailwind's source (`node_modules/tailwindcss/dist/lib.mjs`):

```js
["h",     ["--height","--spacing"]]
["min-h", ["--min-height","--height","--spacing"]]
["max-h", ["--max-height","--height","--spacing"]]
["w",     ["--width","--spacing","--container"]]
```

### 5.2 Risk: `--height-*` is undocumented

The public "Theme variable namespaces" table at
[tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme) lists `--spacing-*` but
**omits** `--height-*`, `--width-*` and `--min-height-*`. They are first-class `themeKeys` in
source (above), so the behaviour is intentional, not accidental — but it is not contractually
documented. Mitigation: moving the five tokens to `--spacing-*` is a one-line change if this
regresses; pin the Tailwind minor in CI and cover a generated utility in a spec.

**Pre-existing instance of this trap:** `theme/_semantic.css:42-46` declares
`--width-calendar-{xs..xl}`. Those tokens *do* generate `w-calendar-*` — but **nothing in the
codebase references them**. They are dead. Wire them up or delete them in the same pass.

### 5.3 Register the tokens with `twMerge` — do this first

See §1.6. Without the `twMergeConfig` extension, `h-control-md` and a consumer's `h-11` both
survive and source order decides. This is a hard prerequisite, not a polish item, and it is the
single reason shadcn declined to tokenise heights at all.

### 5.4 Double-counting: the resolution rule

**Do padding and a fixed height fight? Yes — and height wins silently.** Already live here:

```
paginator.ts:297   navButton: 'px-3 py-2 text-sm min-w-9 h-9'
paginator.ts:270   base:      'inline-flex items-center justify-center …'
```

With a fixed height plus flex centring, `py-2` is **inert** — only a min-content floor. At `md`
the two happen to agree (16 + 20 = 36 = `h-9`), so nobody noticed; at `xs` they do not
(`px-2 py-1` implies 24px content, `h-7` pins 28px). Primer resolves this by writing
`padding: 0 <inline>` explicitly; shadcn leaves a cosmetically redundant `py-2` in place.

**The rule is conditional, not blanket:**

| family | horizontal | vertical |
|---|---|---|
| **Pinned** | **keep `px-*`** | **replace `py-*` with `h-control-*`**; requires `inline-flex items-center` on the same element |
| **Min-height** | keep `px-*` | **keep `py-*`** and *add* `min-h-control-*` |

Dropping `py-*` from a `min-h` component collapses its content — `textarea`, `item`,
`tags-input` and wrapping labels all depend on live padding. Only where the height is pinned is
the padding provably inert. Primer encodes exactly this: `padding: 0` in fixed-height mode,
`padding-block: calc(paddingBlock - 2px)` when `height` is released for `data-label-wrap`.

**This rule is not an invention — it is Material's, stated normatively**
([M2, Applying density](https://m2.material.io/design/layout/applying-density.html)):

> "**Do not change the padding** of a component when increasing its density."
> "**Change dimensions** when increasing the density of components."

Angular Material implements it literally — `height: var(--mat-button-filled-container-height)`
with `padding: 0 <horizontal>` — as does Primer. Three of the five systems that pin heights
write vertical padding to zero rather than leaving it inert; only shadcn leaves a cosmetically
redundant `py-2` in place. **Delete it.** Leaving dead `py-*` in a pinned component is exactly
how `paginator`'s `xs` came to disagree with its own padding table.

Migration friction is low: **45 of 57 entry points already carry `(inline-)flex items-center`
in their base**, including `button.ts:18`.

### 5.5 The textarea floor — Mantine's choice, not shadcn's

Mantine sets the multi-line floor to `min-height: var(--input-height)` — the *same* token as the
single-line height, so a one-row textarea aligns pixel-perfectly with a sibling input. shadcn
hardcodes `min-h-16` (64px, ≈2 rows), which does not align with anything.

**Recommendation:** use `min-h-control-*` as the *floor* (alignment guarantee) and let the native
`rows` attribute drive the resting height (typically 2–3 rows). Optionally add
`field-sizing-content` for auto-grow — but treat it as progressive enhancement only: it is
**Chromium-only**, so `min-h-*` must remain the real cross-browser floor.

### 5.6 The `form-field` carve-out

`form-field` is where the payoff and the danger concentrate, because it wraps `input` with
`inFormField: true` (which zeroes the child's border and padding).

| appearance | classes | computed `md` |
|---|---|---|
| `outline` | `controlWrapper: 'px-3 py-2'` + child `border-0 p-0` | 16 + 20 + 2 = **38** — matches standalone `input` `md` ✅ |
| `filled` | `controlWrapper: 'px-3 pt-6 pb-2'`, `border-b` only | 24 + 8 + 20 + 1 = **53** ❌ |

`filled` is a floating-label appearance: the label occupies a band *inside* the control, so it is
intrinsically taller and **cannot share `--height-control-*`**.

**Angular Material hit this exact problem on this exact component and documented the answer.**
`form-field` is the *only* component in its library that is not pinned — it is a hybrid of
`min-height` plus live padding tokens, with this verbatim rationale in
[`_mdc-text-field-density-overrides.scss`](https://github.com/angular/components/blob/a69732f546a5f1f43faeb0039fa08e4f7a1150f0/src/material/form-field/_mdc-text-field-density-overrides.scss):

```scss
// MDC relies on input elements to stretch vertically when the height is reduced as per
// density scale. This doesn't work for our form field since we support custom form field
// controls without a fixed height.
.mat-mdc-form-field-infix {
  min-height: #{$height};                 // NOT height:
  padding-top:    token-utils.slot(form-field-filled-with-label-container-padding-top, …);
  padding-bottom: token-utils.slot(form-field-filled-with-label-container-padding-bottom, …);
}
```

A form field wraps *arbitrary consumer controls*, so it cannot assume a fixed child height.
Note also that Angular Material's escape valve at high density is to **drop the floating label
entirely** — `form-field-filled-label-display` flips to `none` at density ≤ −2.

Options for ngx-tw, preferred first:

1. **Treat `form-field` as `min-h`, not pinned** — matching Angular Material. `outline` takes
   `min-h-control-*` and keeps its `py-*`; `filled` keeps its asymmetric `pt-*`/`pb-*`. This
   preserves alignment (a `min-h-control-md` outline field still matches a 32px sibling button
   when its content is single-line) without assuming anything about the projected control.
2. Derive a second token — `--height-field-filled-md: calc(var(--height-control-md) + 1.25rem)` —
   one source of truth, still retheme-able. (Register it in `twMergeConfig` too.)
3. Leave `filled` padding-derived in the first pass and pin only `outline`.

Option 1 is now the recommendation; it is the only one with a shipped precedent, and it removes
`form-field` from the highest-risk list. Note this makes `form-field` the single documented
exception to §1.5's "pinned" family.

Also note a horizontal inconsistency not to inherit silently: `form-field` `md` uses `px-3`
while standalone `input` `md` uses `px-4`.

### 5.7 Suggested sequencing

1. **Extend `twMergeConfig`** (§1.6). Prerequisite for everything else.
2. Land the height tokens (§1.2) and the line-height pins (§1.3). Zero visual diff alone.
3. Migrate `button` first — reference implementation; its solid/outline drift disappears at once.
4. Migrate the rest of the **pinned** family, deleting `py-*` as each is converted.
5. Add `min-h-control-*` to the **min** family *without* touching their padding.
6. Unify square targets onto `h-control-* w-control-*`; retire the separate square-interactive
   table from `CLAUDE.md` (its `lg` moves 36 → 40).
7. Give `form-field` `min-h-control-*` and leave its padding alone (§5.6) — it is the one
   documented exception to the pinned family, following Angular Material.
8. Update `CLAUDE.md`: the "Inline element padding" table becomes *horizontal-only*, with the
   control-height table beside it — otherwise the two drift apart again.

### 5.8 Top risks

1. **Density change on the default size.** `md` moves 38 → 32 (−6px) across 54 components and
   every demo page. This is a deliberate densification, not a bug fix, and needs a visual review
   pass. If unacceptable, take §4.1 option B wholesale rather than half-migrating.
2. **`twMerge` blindness to named tokens** (§1.6). Un-extended, the tokens are a *regression* in
   customisability — consumer `h-11` silently loses. Must land first, and needs a spec.
3. **`xs`/`sm` have only 3px of vertical slack per side.** Any consumer enlarging
   `--text-xs`/`--text-sm`, or any icon taller than the glyph scale, overflows a pinned shell —
   silently, because `items-center` centres the overflow. The `rem` line-height pins (§1.3) are
   the mitigation, the icon-sizing rules in `CLAUDE.md` must be enforced, and `--height-*` being
   undocumented (§5.2) is the tail risk behind it.

*(`form-field` was the fourth risk in an earlier draft; §5.6 resolves it by adopting Angular
Material's `min-height` hybrid rather than pinning it.)*

---

## 6. Sources

- WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Tailwind theme variables / namespaces — https://tailwindcss.com/docs/theme
- Tailwind font-size + paired line-heights — https://tailwindcss.com/docs/font-size
- Tailwind height utilities — https://tailwindcss.com/docs/height
- Tailwind Preflight (`box-sizing: border-box`) — https://tailwindcss.com/docs/preflight
- Primer primitives 11.10.0 size tokens — https://unpkg.com/@primer/primitives@11.10.0/dist/css/functional/size/size.css
- Primer primitives 10.5.0 (`lineBoxHeight`) — https://unpkg.com/@primer/primitives@10.5.0/dist/css/functional/size/size.css
- Primer coarse-pointer overrides — https://unpkg.com/@primer/primitives@11.10.0/dist/css/functional/size/size-coarse.css
- Primer `ButtonBase.module.css` — https://github.com/primer/react/blob/main/packages/react/src/Button/ButtonBase.module.css
- Radix Themes source @ `1faff10` — https://github.com/radix-ui/themes/tree/1faff10ac26ae17f09944d418c6949b93fc6b566/packages/radix-ui-themes/src
- Radix Themes spacing / typography / layout docs — https://www.radix-ui.com/themes/docs/theme/spacing · https://www.radix-ui.com/themes/docs/theme/typography · https://www.radix-ui.com/themes/docs/theme/layout
- Ant Design source @ `77d8317` — https://github.com/ant-design/ant-design/tree/77d831751b3452a8291256fa187553a258e2cf1e/components
- Ant Design customize-theme docs — https://ant.design/docs/react/customize-theme
- Carbon 2x Grid overview — https://carbondesignsystem.com/elements/2x-grid/overview/
- Carbon spacing scale — https://unpkg.com/@carbon/layout@11.58.0/scss/generated/_spacing.scss
- Carbon layout tokens (`$layout-tokens`) — https://unpkg.com/@carbon/styles@1.114.0/scss/utilities/_layout.scss
- Carbon type styles / line-heights — https://unpkg.com/@carbon/type@11.66.0/scss/_styles.scss
- Carbon component style specs — https://carbondesignsystem.com/components/button/style/ · https://carbondesignsystem.com/components/text-input/style/ · https://carbondesignsystem.com/components/dropdown/style/
- Mantine `Input.module.css` — https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/components/Input/Input.module.css
- Mantine `Button.module.css` — https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/components/Button/Button.module.css
- Mantine default theme — https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/core/MantineProvider/default-theme.ts
- shadcn/ui button — https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/button.tsx
- shadcn/ui textarea — https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/textarea.tsx
- shadcn/ui input-group — https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/input-group.tsx
- Material M2 — Spacing methods (8dp/4dp grid, 48dp touch target) — https://m2.material.io/design/layout/spacing-methods.html
- Material M2 — Applying density ("change dimensions, not padding") — https://m2.material.io/design/layout/applying-density.html
- Material Design 3 — Grids & spacing (contains no dp numbers) — https://m3.material.io/foundations/layout/grids-spacing/spacing
- material-web MD3 tokens @ `c05b4b2` — https://github.com/material-components/material-web/tree/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens
- MD3 filled-field spacing tokens (56dp derivation) — https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/_md-comp-filled-field.scss
- MD3 Expressive button size overlays (Android) — https://github.com/material-components/material-components-android/blob/ac7e18efeefb331850c561faf9ab8bf81d27ba68/lib/java/com/google/android/material/button/res/values/styles.xml
- Angular Material theming guide (density) — https://github.com/angular/components/blob/a69732f546a5f1f43faeb0039fa08e4f7a1150f0/guides/theming.md
- Angular Material `_m3-button.scss` (density lookup table) — https://github.com/angular/components/blob/a69732f546a5f1f43faeb0039fa08e4f7a1150f0/src/material/button/_m3-button.scss
- Angular Material `button.scss` (pinned height, `padding: 0`) — https://github.com/angular/components/blob/a69732f546a5f1f43faeb0039fa08e4f7a1150f0/src/material/button/button.scss
- Angular Material form-field density overrides (`min-height` hybrid) — https://github.com/angular/components/blob/a69732f546a5f1f43faeb0039fa08e4f7a1150f0/src/material/form-field/_mdc-text-field-density-overrides.scss
- Imperavi, *UI Typography* — Vertical rhythm — https://imperavi.com/books/ui-typography/principles/vertical-rhythm/
- Designary — Grid systems and the 4px grid — https://blog.designary.com/p/layout-basics-grid-systems-and-the-4px-grid
- CSS `text-box-trim` — https://developer.chrome.com/blog/css-text-box-trim
