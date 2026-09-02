# Rhythm baseline — live measurement

**Date:** 2026-09-02 · **Method:** `node scripts/measure-rhythm.mjs` against the demo dev
server, reading `getBoundingClientRect().height` off the `/foundations/rhythm` page.
These are **rendered** numbers from a real browser, not arithmetic on utility classes.

## Measured heights (px)

| Slot | xs | sm | md | lg | xl | on 4px grid |
|---|---:|---:|---:|---:|---:|---|
| Button | 24 | 32 | 36 | 44 | 48 | all |
| Input | 26 | 34 | **38** | 46 | 50 | **none** |
| Select | 27 | 34 | **38** | 46 | 50 | **none** |
| Segmented control | 32 | 40 | 44 | 52 | 56 | all |
| Switch | 16 | 20 | 24 | 28 | 32 | all |
| Checkbox | 16 | 20 | 20 | 24 | 28 | all |
| Radio | 16 | 20 | 20 | 24 | 28 | all |

## What this proves

**1 — The form row does not align. Spread is 24px at `md`.**
Button 36 · Input 38 · Select 38 · Segmented 44. A consumer placing these side by side in a
filter bar gets four different box heights. This is the headline defect.

**2 — The 2px gap between Button and Input is the border, and it is structural.**
Both apply the documented `md` inline padding (`py-2` = 8px top + 8px bottom) over a
`text-sm` line box (20px). Button has no border → 36px. Input has `border` → +2px → 38px.
The padding table in `.claude/CLAUDE.md` is specified **without reference to whether the
control carries a border**, so every bordered control is 2px taller than every unbordered
one at every size, by construction. No component is "wrong"; the *rule* is underspecified.

**3 — Height is padding-derived, so it can never be guaranteed on-grid.**
Nothing pins a height. Each control's height is an emergent sum of padding + line-height +
border, and the library has no token that says what a `md` control should measure. That is
the gap a rhythm system has to close.

**4 — `xs` and `sm` are the worst offenders.**
Input `xs` = 26px, Select `xs` = 27px — both off a 4px grid, and Select is off by 1px from
its own sibling, meaning the two are not even internally consistent. Select at `xs` also
sits at 27px, which is **not divisible by anything** and is the only odd-pixel value in the
set.

**5 — The `size` axis has a dead step.**
Checkbox and Radio measure 20px at both `sm` and `md`. Two adjacent size values render
identically, so `size="sm"` and `size="md"` are visually indistinguishable for those
controls.

**6 — Selection controls live on a different scale entirely.**
Switch 24 / Checkbox 20 / Radio 20 at `md`, against Button 36. They are glyph-sized, not
control-sized — defensible in isolation, but it means a `md` checkbox cannot be vertically
centred against a `md` input without an explicit wrapper, and the library ships no such
wrapper.

## Reproducing

```bash
npm start                      # demo dev server on :4600
node scripts/measure-rhythm.mjs
```

The page itself (`/foundations/rhythm`) reports the same numbers live, plus a per-size
off-grid ledger. Every slot exposes `data-rg-cell`, `data-rg-height` and `data-rg-ongrid`
so the measurement is scriptable as a regression gate.
