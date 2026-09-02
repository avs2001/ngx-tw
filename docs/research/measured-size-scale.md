# Measured Size Scale — ngx-tw

**Status:** measurement audit, read-only. No source file was modified.
**Date:** 2026-09-02
**Scope:** every component under `projects/ngx-tw/` that exposes a density axis.

This document computes the **resting vertical height in CSS px** that each component
actually resolves to today, from its `tv()` config, so a vertical-rhythm spec can be
written against real numbers instead of guesses.

---

## 0. Computation model

### Token constants

| Token | Font | Line-height | Source |
|---|---|---|---|
| `text-2xs` | 0.6875rem (11px) | **1rem (16px)** | `projects/ngx-tw/theme/_semantic.css:53-54` (theme-authored token, not a Tailwind default) |
| `text-xs` | 0.75rem (12px) | 1rem (16px) | Tailwind v4 default |
| `text-sm` | 0.875rem (14px) | 1.25rem (20px) | Tailwind v4 default |
| `text-base` | 1rem (16px) | 1.5rem (24px) | Tailwind v4 default |
| *no `text-*` class* | inherited 16px | **1.5 → 24px** | Tailwind v4 preflight `html { line-height: 1.5 }`; `projects/demo/src/styles.css` sets no base font-size |

`projects/ngx-tw/theme/_typography.css` defines **only** `--font-sans`, `--font-mono`,
`--duration-fast`, `--duration-normal`. **It overrides no line-height.** The only
theme-authored type step is `--text-2xs` / `--text-2xs--line-height` in `_semantic.css:53-54`.
Explicit `leading-*` classes (checkbox/radio labels, stepper `leading-tight`) win where present
and are called out per row.

### Spacing map (Tailwind v4, 1 unit = 4px)

`py-0`=0 · `py-0.5`=2 · `py-1`=4 · `py-1.5`=6 · `py-2`=8 · `py-2.5`=10 · `py-3`=12 · `py-3.5`=14 · `py-4`=16 (**per side**)
`p-1`=4 · `p-2`=8 · `p-3`=12 · `p-4`=16 · `p-6`=24 · `p-8`=32 (**per side**)
`size-N` / `h-N` / `min-h-N` = `N × 4px`

### Formula

```
height = padding-top + padding-bottom + tallest-child-content + border-top + border-bottom
```

with `h-*` / `min-h-*` / `size-*` **overriding** the padding computation where present
(marked **[explicit]** in the table). `border` = 1px per side (2px total); `border-2` = 4px total;
`border-b`/`border-b-2` = 1px/2px total. Every element in this library is `box-sizing: border-box`
(Tailwind preflight), so a stated `h-9` already contains its border.

For `flex` rows the **tallest child** governs, not the text line — this is the single
largest source of surprise in the numbers below (see date-picker, time-picker, collapsible).

---

## 1. MASTER TABLE

Heights are the **resting** height of the element named in *element measured*, in CSS px.
`—` = the size is not supported. `content` = intrinsically content-driven.

| Component | Element measured | xs | sm | md | lg | xl | md on 4px grid? | md on 8px grid? | Source | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **avatar** | root | 24 | 32 | **40** | 48 | 64 | ✅ | ✅ | `avatar/avatar.ts:52-61` | **[explicit]** `size-6/8/10/12/16`. Codified container scale (comment at :57-60). |
| **badge** | root (solid/soft) | 20 | 20 | **24** | 32 | 32 | ✅ | ✅ | `badge/badge.ts:43-89` | `outline` variant `+2` (`badge.ts:29`). xs & sm collapse to the same height; lg & xl too. Dismiss buttons (`size-6/6/7/8/8`) are neutralised by negative `-my-*` margins. |
| **badge-dot** | root | 6 | 6 | **8** | 10 | 10 | ✅ | ✅ | `badge/badge-dot.ts:28-34` | **[explicit]** dot-indicator scale. |
| **breadcrumbs** | link row | 16 | 20 | **20** | 24 | 24 | ✅ | ❌ | `breadcrumbs/breadcrumbs.ts:95-136` | Text-only. Row jumps to the overflow trigger (`size-6/7/8/9/9` → 24/28/**32**/36/36) whenever the trail is collapsed. |
| **button** | host (solid/ghost/soft) | 24 | 32 | **36** | 44 | 48 | ✅ | ❌ | `button/button.ts:37-43` | No border on solid/ghost/soft. |
| **button** | host (`outline`) | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `button/button.ts:22, 37-43` | `+2px` border. **Solid and outline buttons are different heights.** |
| **button** | host (`link`) | 16 | 20 | **20** | 24 | 24 | ✅ | ❌ | `button/button.ts:115-119` | Padding stripped by compound variants. |
| **card** | body / header / footer | content | content | content | content | content | — | — | `card/card.ts:35-41` | `p-2/3/4/6/8` — **matches** the documented container scale. |
| **carousel** | — | — | — | — | — | — | — | — | `carousel/carousel.ts:252-258` | `size` variants are **empty objects**. The input has no vertical effect. |
| **checkbox** | row (label only) | 16 | 20 | **20** | 24 | 28 | ✅ | ❌ | `checkbox/checkbox.ts:62-104` | **[explicit]** `min-h-4/5/5/6/7` on `boxWrap` + `leading-4/5/5/6/7` on label. Add 16/16/16/20/20 when a description is projected. Box itself: 14/16/20/24/28. |
| **code-block** | header row | — | — | **33** | — | — | — | — | `code-block/code-block.ts:59` | No size input. `px-4 py-2 text-xs` + `border-b` → hardcoded. `pre` is `p-4`. |
| **collapsible** | trigger row | 28 | 32 | **36** | 44 | 48 | ✅ | ❌ | `collapsible/collapsible.ts:74-78` | Size arrives via `display.size` (config object), not a `size` input. **xs is 28 not 24** because `icon: 'size-5'` (20px) is fixed at every size (`collapsible.ts:51`). Root adds 1px (`default`) or 2px (`bordered`). |
| **combobox** | trigger | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `combobox/combobox.ts:117-118, 132-136` | `border` in the base slot. Identical to standalone input. |
| **command-palette** | search row | 33 | 37 | **45** | 53 | 57 | ❌ | ❌ | `command-palette/command-palette.ts:73-76, 91-117` | Overlay. `searchIcon: size-5` (20px) floors the row; `+1px border-b`. |
| **command-palette** | item row | 24 | 28 | **36** | 40 | 48 | ✅ | ❌ | `command-palette/command-palette.ts:91-117` | Overlay. |
| **date-picker** | root | 42 | 46 | **50** | 54 | 58 | ❌ | ❌ | `date-picker/date-picker.ts:169-201, 205` | 🔴 Padding is **`px-3 py-2` fixed at every size** (`:205`). Height is driven entirely by `triggerButton: size-6/7/8/9/10` (24/28/32/36/40), which is always rendered (`date-picker.ts:341+`). |
| **date-range-picker** | root (empty) | 34 | 38 | **38** | 42 | 42 | ❌ | ❌ | `date-range-picker/date-range-picker.ts:171-193, 197` | 🔴 Padding **`px-3 py-2` fixed** (`:197`). Once a value renders the `size-6` clear button (`:339`, `showClear` defaults `true` at `:429`) it becomes **42 at every size** — the size axis stops mattering. |
| **dialog** | — | N/A | N/A | N/A | N/A | N/A | — | — | `dialog/` | Overlay, no resting inline height. |
| **empty-state** | root | content | content | content | content | content | — | — | `empty-state/empty-state.ts:45-66` | `p-2/3/4/6/8` — **matches** the documented scale. |
| **file-upload** | dropzone | content | content | content | content | content | — | — | `file-upload/file-upload.ts:143-152` | `p-2/3/4/6/8` **matches**; `outline` adds `border-2` (4px total), `soft` adds `border` (2px). |
| **file-upload** | trigger button | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `file-upload/file-upload.html:55-66` | `twButton variant="outline" [size]="size()"` → identical to an outline button. |
| **form-field** | control row (`outline`) | 34 | 38 | **42** | 46 | 50 | ❌ | ❌ | `form-field/form-field.ts:128-130, 176-180` | 🔴 See §2.2. The form-field **never sets a font-size on the infix or the wrapped control**, so the content line is the inherited **24px at every size**. |
| **form-field** | control row (`filled`) | 49 | 51 | **57** | 63 | 69 | ❌ | ❌ | `form-field/form-field.ts:132-136, 181-185` | Asymmetric `pt-5/5/6/7/8` + `pb-1/1.5/2/2.5/3`, `border-b` only (1px). |
| **form-field** | total block | 58 | 62 | **66** | 70 | 74 | ❌ | ❌ | `form-field/form-field.ts:118, 173-175, 255, 452` | Adds the subscript row: `mt-1` (4px) + `min-h-5` (20px) = **+24px**, because `subscriptSizing` defaults to `'fixed'`. |
| **flip-card** | — | N/A | N/A | N/A | N/A | N/A | — | — | `flip-card/` | Geometry only. |
| **icon** | root | 12 | 16 | **20** | 24 | 32 | ✅ | ❌ | `icon/icon.ts:56-62` | **[explicit]** glyph scale. |
| **input** | host (standalone) | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `input/input.ts:76-78, 92-97` | `border border-border` in the `inFormField:false` variant + `px/py/text` compound variants. |
| **input** | host (in form-field) | — | — | — | — | — | — | — | `input/input.ts:74` | `border-0 p-0` — contributes only its inherited 24px line box. Row height comes from the form-field. |
| **item** | row (title only) | — | 32 | **36** | 48 | — | ✅ | ❌ | `item/item.ts:38-62` | sm/md/lg only (`ItemSize`). With a description: **48 / 60 / 72** — the `content` slot carries `gap-0` at sm but `gap-1` (4px) at md and lg (`item.ts:41, 49, 57`), so the stacked variant is 4px taller than a naive title+description sum at md/lg. lg title is `text-base` (codified exception). `item` is the **only** stacked slot in the library with a gap — checkbox/radio/switch `labelWrap` and slider `root` are bare `flex flex-col`. |
| **menu** | item | 20 | 24 | **32** | 36 | 44 | ✅ | ✅ | `menu/menu.ts:54-60` | Overlay. Panel adds `p-0.5/0.5/1/1.5/2` → panel = item + 4/4/8/12/16 (`menu.ts:34-40`). |
| **number-input** | host | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `number-input/number-input.ts:32` | A directive on `input[twNumberInput]`, always composed with `twInput` — inherits input's heights verbatim. No own chrome. |
| **number-stepper** | column | ≥24 | ≥24 | **≥24** | ≥32 | ≥32 | ✅ | ✅ | `number-input/number-stepper.ts:41-47` | Width-only (`w-6/7/7/8/8`); height comes from `flex-1` inside the parent. Min-content floor = 2 × chevron (`size-3/3/3/4/4`). Documented departure at `:20-40`. |
| **paginator** | nav / page button | 28 | 32 | **36** | 40 | 44 | ✅ | ❌ | `paginator/paginator.ts:281-315` | **[explicit]** `h-7/8/9/10/11` (border-inclusive). |
| **paginator** | page-size select | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `paginator/paginator.ts:265-266, 283-313` | 🔴 **No explicit height** — `px/py` + `border`. Sits 2px **taller** than the nav buttons it lines up with at sm/md/lg/xl and 2px **shorter** at xs. |
| **popover** | panel | content | content | content | content | content | — | — | `popover/popover.ts:77, 82-86` | Overlay. `p-2/3/4/6/8` **matches**; `+2px` border. |
| **progress-bar** | rail | — | 4 | **8** | 12 | — | ✅ | ✅ | `progress-bar/progress-bar.ts:89-93` | `ProgressBarSize` is sm/md/lg only. **[explicit]** `h-1/2/3`. |
| **radio** | row (label only) | 16 | 20 | **20** | 24 | 28 | ✅ | ❌ | `radio/radio.ts:67-108` | Identical model to checkbox. Circle: 14/16/20/24/28. |
| **segmented-control** | root | 32 | 40 | **44** | 52 | 56 | ✅ | ❌ | `segmented-control/segmented-control.ts:34, 39-45` | 🔴 Option matches the button exactly (24/32/36/44/48) but the root adds `p-1` (8px) → **always 8px taller than the button it mimics**. |
| **select** | trigger | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `select/select.ts:171-179, 182-183` | xs becomes **30** when the clear button renders (`clearButton: size-5` = 20px > `text-xs` 16px; `select.ts:168, 689`). |
| **select** | option row | 24 | 32 | **36** | 44 | 48 | ✅ | ❌ | `select/select.ts:754-766` | 🔴 A **third, hand-rolled** density scale (`px-2/3/3/4/4`, `py-1/1.5/2/2.5/3`) outside the `tv()` config — md uses `px-3` while the trigger uses `px-4`. |
| **separator** | — | N/A | N/A | N/A | N/A | N/A | — | — | `separator/separator.ts:20` | Rule + optional `px-3 text-sm` label. |
| **sheet** | — | N/A | N/A | N/A | N/A | N/A | — | — | `sheet/` | Overlay. |
| **skeleton** | root | — | — | **16** | — | — | ✅ | ✅ | `skeleton/skeleton.ts:26-27` | **[explicit]** `h-4` for `text`/`rectangle`. No size input. |
| **slider** | region (bare) | 24 | 28 | **32** | 36 | 40 | ✅ | ✅ | `slider/slider.ts:155-187` | **[explicit]** `h-6/7/8/9/10` on `region`. Add a 20px header row when a label is set; `+mt-2` rows for mark labels / min-max. |
| **sort-header** | container | 24 | 32 | **36** | 44 | 48 | ✅ | ❌ | `sort/sort-header.ts:61-83` | No border, no explicit height. Matches the solid button exactly. |
| **spinner** | root | 12 | 16 | **20** | 24 | 32 | ✅ | ❌ | `spinner/spinner.ts:43-49` | **[explicit]**. Extra `inherit` size = `size-[1em]`. |
| **split** | — | N/A | N/A | N/A | N/A | N/A | — | — | `split/split.ts:114` | Geometry only; `gutterSize` is a number input (px), default 6. |
| **stat** | root | content | content | content | content | content | — | — | `stat/stat.ts:78-122` | `p-2/3/4/6/8` **matches**. |
| **stepper** | step indicator | 24 | 28 | **32** | 40 | 48 | ✅ | ✅ | `stepper/stepper.ts:78-100` | **[explicit]**. lg=`size-10` and xl=`size-12` leave the square-interactive scale (which stops at `size-9`) and **skip `size-9` entirely**. |
| **switch** | row | 16 | 20 | **24** | 28 | 32 | ✅ | ✅ | `switch/switch.ts:57-88` | **[explicit]** `track: h-4/5/6/7/8`. Label (`text-xs/sm/sm/base/base`, no `leading-*`) never exceeds the track. |
| **table** | td (`comfortable`) | 40 | 44 | **44** | 48 | 48 | ✅ | ❌ | `table/table.ts:388-390, 399-404` | Size sets **font only**; `density` sets padding. The two axes are orthogonal — the same `size` yields two different heights. |
| **table** | td (`compact`) | 28 | 32 | **32** | 36 | 36 | ✅ | ✅ | `table/table.ts:393-396, 399-404` | Same note. |
| **tabs / tab-nav** | trigger (`pill`) | 24 | 32 | **36** | 44 | 48 | ✅ | ❌ | `core/tab-trigger-variants.ts:43-49` | Shared config. |
| **tabs / tab-nav** | trigger (`underline`, `enclosed`) | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `core/tab-trigger-variants.ts:32-41, 43-49` | `border-b-2` / `border` add 2px. `-mb-px` pulls 1px back onto the tablist, not off the trigger box. |
| **tabs** | close button | 24 | 28 | **32** | 36 | 36 | ✅ | ✅ | `tabs/tabs.ts:75-81` | lg and xl collapse to `size-9`. |
| **tags-input** | root (empty) | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `tags-input/tags-input.ts:81, 90-94, 117-121` | Matches input. |
| **tags-input** | root (≥1 chip) | 30 | 34 | **42** | 54 | 58 | ❌ | ❌ | `tags-input/tags-input.ts:170` + `badge/badge.ts:43-89` | 🔴 Chip is a `twBadge` at the same `size` (20/20/24/32/32) which out-measures the text line at xs/md/lg/xl → **the control grows 4-8px the moment the first chip is committed**. |
| **textarea** | host (**single row**, `rows=1`) | 26 | 34 | **38** | 46 | 50 | ❌ | ❌ | `textarea/textarea.ts:119, 127` + `input/input.ts:76-78, 92-97` | Textarea extends `InputDirective` and adds only `resize` classes (`textarea.ts:27-38`) — at one row it is **byte-identical to the standalone input**, i.e. inside the 38px cohort. |
| **textarea** | host (`rows=3`, the default) | 58 | 74 | **78** | 94 | 98 | ❌ | ❌ | `textarea/textarea.ts:135` | `rows` defaults to **3** (`:135`), `minRows` to 1 (`:127`). Height = 3 × line-height + padding + border. |
| **time-picker** | root (24h, empty) | 42 | 42 | **42** | 50 | 50 | ❌ | ❌ | `time-picker/time-picker.ts:143-185, 189` | 🔴 Padding **`px-3 py-2` fixed** (`:189`). Height floors on the stacked `stepperGroup` min-content (2 × `size-3`/`size-4` = 24/32). **xs, sm and md are byte-identical heights.** `format` defaults to `'24h'` (`:511`), `showSteppers` to `true` (`:539`). |
| **time-picker** | root (12h) | 44 | 44 | **44** | 52 | 52 | ✅ | ❌ | `time-picker/time-picker.ts:138-141, 152-184` | Meridiem block = `border` (2px) + `py-1/1/1/1.5/1.5` + `text-2xs/xs/xs/sm/sm` → 26/26/26/34/34, which then floors the row. |
| **timeline** | marker (`circle`) | 24 | 28 | **32** | 40 | 48 | ✅ | ✅ | `timeline/timeline.ts:222-226` | Item body is content-driven. Same lg/xl jump as stepper (`size-10`/`size-12`, skipping `size-9`). |
| **toast** | root | — | — | content | — | — | — | — | `toast/toast-component.ts:18` | Overlay. `p-4` + `border` hardcoded; no size input. |
| **tooltip** | panel | 20 | 24 | **32** | 36 | 40 | ✅ | ✅ | `tooltip/tooltip.ts:51, 92-104` | Overlay. No border (`:51` = `rounded-md shadow-md`). |
| **transfer** | option row | 24 | 32 | **36** | 44 | 48 | ✅ | ❌ | `transfer/transfer.ts:232-267` | Size arrives via `display.size` (`transfer.ts:654`). Panel header uses a *different* `px` at md (`px-4` vs the option's `px-3`, `:249-251`). |
| **tree** | node row | 20 | 24 | **28** | 32 | 36 | ✅ | ❌ | `tree/tree.ts:129, 135-139` | 🔴 Font is **hardcoded `text-sm`** on the node base (`:129`) — the `size` axis moves padding only (`py-0/0.5/1/1.5/2`), never the type scale. |
| **accordion** | — | — | — | — | — | — | — | — | `accordion/accordion.ts:22-24` | No size axis at all; density comes from the child `tw-collapsible`'s `display.size`. |
| **alert** | root | — | — | content | — | — | — | — | `alert/alert.ts:75-78` | 🔴 No size input. Hardcoded md density: `p-4 text-sm`. |
| **calendar** | root | — | — | content | — | — | — | — | `calendar/calendar.ts:94` | 🔴 No size input. Hardcoded `p-2` — **below** the documented md `p-4`. |
| **calendar** | day cell | — | — | **36** | — | — | ✅ | ❌ | `calendar/calendar-cell.ts:35` | **[explicit]** `h-9 w-9`. Header nav buttons are also `h-9 w-9` (`calendar-header.ts:18`) and the weekday row is `h-9` (`month-view.ts:47`) — a consistent 36px internal grid. |
| **calendar** | month / year cell | — | — | **40** | — | — | ✅ | ✅ | `calendar/calendar-cell.ts:36-37` | **[explicit]** `h-10` — 4px taller than the day cell, so switching views changes the panel height. |
| **aspect-ratio** | — | N/A | N/A | N/A | N/A | N/A | — | — | `aspect-ratio/` | Geometry only. |

---

## 2. DIVERGENCE ANALYSIS

### 2.1 The form-row cohort

These are the components a consumer will place side by side in a form row and expect to align.
Resting heights, in px:

| Component | xs | sm | **md** | lg | xl |
|---|---|---|---|---|---|
| `button` (solid — the default) | 24 | 32 | **36** | 44 | 48 |
| `button` (outline) | 26 | 34 | **38** | 46 | 50 |
| `input` (standalone) | 26 | 34 | **38** | 46 | 50 |
| `input` (inside `tw-form-field`) | 34 | 38 | **42** | 46 | 50 |
| `select` | 26 (30 w/ clear) | 34 | **38** | 46 | 50 |
| `combobox` | 26 | 34 | **38** | 46 | 50 |
| `number-input` | 26 | 34 | **38** | 46 | 50 |
| `tags-input` (empty) | 26 | 34 | **38** | 46 | 50 |
| `tags-input` (with a chip) | 30 | 34 | **42** | 54 | 58 |
| `file-upload` trigger | 26 | 34 | **38** | 46 | 50 |
| `date-range-picker` (empty) | 34 | 38 | **38** | 42 | 42 |
| `date-range-picker` (with a value) | 42 | 42 | **42** | 42 | 42 |
| `time-picker` (24h) | 42 | 42 | **42** | 50 | 50 |
| `date-picker` | 42 | 46 | **50** | 54 | 58 |
| `segmented-control` | 32 | 40 | **44** | 52 | 56 |
| `switch` | 16 | 20 | **24** | 28 | 32 |
| `checkbox` | 16 | 20 | **20** | 24 | 28 |
| `radio` | 16 | 20 | **20** | 24 | 28 |
| `slider` (bare region) | 24 | 28 | **32** | 36 | 40 |
| `textarea` (**single row**) | 26 | 34 | **38** | 46 | 50 |
| `textarea` (`rows=3`, the default) | 58 | 74 | **78** | 94 | 98 |

### 2.2 Exact px spread

Single-row textarea included (at `rows=1` it is identical to the input); the `rows=3` default excluded:

| Size | Text-bearing controls only¹ | Full cohort² |
|---|---|---|
| xs | **24 → 42 = 18px** | 16 → 42 = **26px** |
| sm | **32 → 46 = 14px** | 20 → 46 = **26px** |
| **md** | **36 → 50 = 14px** | 20 → 50 = **30px** |
| lg | **42 → 54 = 12px** | 24 → 54 = **30px** |
| xl | **42 → 58 = 16px** | 28 → 58 = **30px** |

¹ button, input, single-row textarea, form-field, select, combobox, number-input, tags-input, file-upload trigger, date-picker, date-range-picker, time-picker, segmented-control.
² adds checkbox, radio, switch, slider.

At **md** there are **five distinct heights** in the text-bearing cohort:
`36` (button solid) · `38` (input / single-row textarea / select / combobox / number-input / tags-input-empty / upload trigger / date-range-picker) · `42` (form-field / time-picker / tags-input-with-chip) · `44` (segmented-control) · `50` (date-picker).

Note that `combobox`'s inner `<input>` (`combobox.ts:119-120`) carries **no padding and no border of its
own** — Tailwind v4 preflight's universal `*{margin:0;padding:0;border:0 solid}` reset plus
`font: inherit` means it contributes only the trigger's own line box. The same holds for the
`input` slot in `date-picker.ts:157-158` and `tags-input.ts:73-74` (which additionally spell out
`p-0` / `border-0`). So none of these three controls is inflated by a nested field.

### 2.3 Root causes

**(a) The 1px border pushes every bordered control off the 4px grid.**
The padding scale (`py-2` = 16px) plus a `text-sm` line box (20px) yields a perfect **36px**.
Every bordered control then adds 2px and lands on **38** — off both the 4px and 8px grid.
This is systemic: `input`, `select`, `combobox`, `tags-input`, `outline` button, `underline`/`enclosed`
tab triggers, `paginator` page-size select all land on 26/34/**38**/46/50.
The unbordered ones (`solid` button, `sort-header`, `pill` tab, segmented option, `select` option row,
`transfer` option, `command-palette` item) land on 24/32/**36**/44/48. The library effectively
has **two parallel scales offset by 2px** and no rule saying which a component belongs to.

**(b) `tw-form-field` never scales the wrapped control's font.**
`form-field.ts` sets a font-size on the *label* per size (`:186-205`) but the `infix` slot
(`:113`) and `controlWrapper` (`:110-112`) carry no `text-*`. `input.ts:74` strips the input's
own padding *and* its font (the `text-*` classes live only on the `inFormField: false` compound
variants at `:92-97`). The wrapped control therefore renders at the **inherited 16px / 24px line
box at every size**. Consequences:
- Wrapping an `<input twInput>` in a form-field makes it **8px taller at xs**, 4px taller at sm and md, and identical at lg/xl.
- The form-field's own xs→xl range is only **16px** (34→50) versus the standalone input's **24px** (26→50) — the density axis is half as expressive.
- The visible text does not shrink at `size="xs"` at all.

**(c) Three components have no padding scale.**
`date-picker.ts:205`, `date-range-picker.ts:197` and `time-picker.ts:189` all hardcode
`px-3 py-2` on the root at **every** size. Their `size` variants change only font-size and
icon/button sizes. So:
- `date-picker` height is *entirely* a function of `triggerButton: size-6/7/8/9/10` → a 16px span (42→58) driven by an ornament, not by density.
- `time-picker` is **identical at xs, sm and md** (42px) because the stacked stepper column's 24px min-content is the floor.
- `date-range-picker` becomes **flat at 42px across all five sizes** as soon as a value renders the `size-6` clear button.

**(d) Tallest-child floors that ignore the size axis.**
`collapsible` icon `size-5` (fixed) → xs is 28 not 24 (`collapsible.ts:51`).
`command-palette` `searchIcon: size-5` (fixed) floors the search row (`:74`).
`select` `clearButton: size-5` (fixed) makes an xs trigger 30 instead of 26 (`select.ts:168`).
`time-picker` `stepperGroup` min-content floors xs/sm/md (`:132-141`).

**(e) Content that grows the control.**
`tags-input` embeds a `twBadge` chip at the same `size` (`tags-input.ts:170`). The badge's own
heights (20/20/24/32/32) exceed the text line at xs, md, lg and xl, so committing the first tag
**reflows the row** by +4px (xs), +4px (md), +8px (lg), +8px (xl).

**(f) `segmented-control` double-counts padding.**
Its `option` is byte-identical to a button (`px-4 py-2 text-sm`), but the root wraps it in `p-1`
(`segmented-control.ts:34`) → 8px taller than the button at every size, at every density.

### 2.4 Internal inconsistencies inside a single component

| Component | Mismatch | Source |
|---|---|---|
| `paginator` | Nav/page buttons are **[explicit]** `h-9` = 36 at md; the page-size `<select>` beside them has no height and computes to 38. Mismatch at every size (xs −2, sm/md/lg/xl +2). | `paginator.ts:283-313` |
| `select` | Trigger padding is `px-4 py-2` (`:176`) but the option row uses a separate hand-rolled scale with `px-3 py-2` (`:760`). Two different padding systems in one component. | `select.ts:176, 760` |
| `transfer` | At md the panel header is `px-4 py-2` while the option is `px-3 py-2` and the search is `px-3 py-2`. | `transfer.ts:249-251` |
| `table` | `size` sets font, `density` sets padding — orthogonal axes mean `size="md"` yields **44px** (comfortable) or **32px** (compact). | `table.ts:388-404` |
| `badge` | xs and sm resolve to the **same** 20px; lg and xl to the same 32px. Only three distinct heights across five sizes. | `badge.ts:44-88` |
| `tabs` | `closeButton` lg and xl both `size-9`. | `tabs.ts:79-80` |
| `breadcrumbs` | `overflowTrigger` lg and xl both `size-9` (codified saturation note in CLAUDE.md). | `breadcrumbs.ts:126, 134` |
| `button` | solid 36 vs outline 38 at md — the same component, two heights. | `button.ts:22, 40` |

### 2.5 Top 5 worst offenders

1. **`date-picker`** — 50px at md against a 38px cohort (**+12px**, the single largest gap). Its padding never scales (`date-picker.ts:205`); the entire size axis is expressed through the always-rendered `triggerButton` (`size-6…size-10`), an ornament. `size-10` at xl also leaves the square-interactive scale.
2. **`tw-form-field`** — the wrapped control's font is never scaled (`form-field.ts:113` + `input.ts:74, 92-97`), so xs/sm/md rows are 34/38/42 instead of 26/34/38 and the visible text never shrinks. Wrapping an input silently changes its height. Compounded by a **+24px** always-reserved subscript row (`subscriptSizing` defaults to `'fixed'`, `form-field.ts:452`).
3. **`time-picker`** — **xs, sm and md are all exactly 42px** (`time-picker.ts:189` fixed padding + the stacked stepper column's 24px min-content floor). Three of five density steps do nothing. Switching to 12h format shifts every number by +2px because the meridiem block's own border becomes the floor.
4. **`segmented-control`** — 44px at md, 8px taller than the button whose padding it copies verbatim, purely because of the root's `p-1` (`segmented-control.ts:34`). It is the only "button-like" control in the library that is not on the button's scale.
5. **`tags-input`** — the only form control whose height **changes at runtime**: 38 → 42 at md, 46 → 54 at lg, 50 → 58 at xl, the moment the first chip commits (`tags-input.ts:170` + `badge.ts:60-88`). A form row containing a tags-input cannot be laid out statically.

*Runner-up:* **`tree`** hardcodes `text-sm` on the node (`tree.ts:129`), so its `size` axis moves padding only — the type never gets denser.

---

## 3. COMPONENTS WITH NO SIZE AXIS

### (a) No `size` input, hardcoded density

| Component | Hardcoded density | Source |
|---|---|---|
| `alert` | `p-4 text-sm` — locked to md container padding + md type | `alert/alert.ts:75-78` |
| `calendar` | `p-2` root — locked to **xs** container padding (deviates from md `p-4`); cells are `h-9` (day) / `h-10` (month, year) and the header nav is `h-9`, all fixed | `calendar/calendar.ts:94`, `calendar/calendar-cell.ts:35-37`, `calendar/calendar-header.ts:18` |
| `code-block` | header `px-4 py-2 text-xs`; `pre` `p-4`; root `font-mono text-sm` | `code-block/code-block.ts:57-61` |
| `toast` | `p-4 text-sm` + `border`; action `px-3 py-1.5`; dismiss `size-6` | `toast/toast-component.ts:18-30` |
| `skeleton` | `h-4` for `text`/`rectangle` | `skeleton/skeleton.ts:26-27` |
| `separator` | label `px-3 text-sm` | `separator/separator.ts:20` |
| `accordion` | none of its own — inherits the child collapsible's `display.size` | `accordion/accordion.ts:22-24` |
| `dialog`, `sheet` | see (b) | — |
| `aspect-ratio`, `flip-card`, `split` | pure geometry, no density | — |

### (a′) Size present but routed through a config object rather than a `size` input

These do **not** match `grep "size = input"` and are easy to miss in an audit:

| Component | Route | Source |
|---|---|---|
| `collapsible` | `display.size` | `collapsible/collapsible.ts:35, 41, 259, 308-312` |
| `tree` | `display.size` | `tree/tree.ts:70, 110, 250, 306` |
| `transfer` | `display.size` | `transfer/transfer.ts:654-656` |
| `table` | `appearance.size` + `appearance.density` | `table/table.ts:92-95, 145, 853, 1038` |

### (b) Overlay-only — no resting inline height → **N/A**

`dialog`, `sheet`, `toast`, `tooltip`, `popover`, `menu`, `command-palette`.
(Their *internal* rows are measured in the master table because a rhythm spec still needs them:
tooltip panel 20/24/**32**/36/40; menu item 20/24/**32**/36/44; command-palette item 24/28/**36**/40/48;
popover panel `p-2/3/4/6/8` + 2px border.)

### (c) Intrinsically content-driven

`card` (body `p-2/3/4/6/8`), `alert` (`p-4`), `table` (row height = cell padding + font, per §1),
`timeline` (item body; only the marker has a fixed size), `accordion` (sum of its collapsibles),
`item` (title + optional description stack), `empty-state`, `stat`, `file-upload` dropzone,
`code-block`, `carousel`, `split`, `aspect-ratio`, `flip-card`, `skeleton` (variant-driven).

---

## 4. CONTAINER PADDING AUDIT

CLAUDE.md documents: **xs=`p-2` · sm=`p-3` · md=`p-4` · lg=`p-6` · xl=`p-8`**.

### Conforming

| Component | Slot | Source |
|---|---|---|
| `card` | header / body / footer | `card/card.ts:36-40` |
| `empty-state` | root | `empty-state/empty-state.ts:47-63` |
| `file-upload` | dropzone | `file-upload/file-upload.ts:147-151` |
| `stat` | root | `stat/stat.ts:80-115` |
| `popover` | panel | `popover/popover.ts:82-86` |
| `collapsible` | content | `collapsible/collapsible.ts:74-78` |

### Deviating

| Component | Actual | Deviation | Justified inline? | Source |
|---|---|---|---|---|
| `menu` | panel `p-0.5 / p-0.5 / p-1 / p-1.5 / p-2` | Entirely off-scale; xs and sm identical | ❌ no comment | `menu/menu.ts:35-39` |
| `calendar` | root `p-2` at all sizes | Locked to the xs step; no size axis | ❌ | `calendar/calendar.ts:94` |
| `alert` | root `p-4` | Locked to md; no size axis | ❌ | `alert/alert.ts:75` |
| `toast` | root `p-4` | Locked to md; no size axis | ❌ | `toast/toast-component.ts:18` |
| `code-block` | `pre p-4`, header `px-4 py-2` | Locked to md; no size axis | ❌ | `code-block/code-block.ts:59, 61` |
| `table` | empty / error / loading blocks `px-4 py-12` | `py-12` (48px) is off the scale entirely | ❌ | `table/table.ts:349, 356` |
| `command-palette` | empty state `px-4 py-10` | `py-10` (40px) off-scale | ❌ | `command-palette/command-palette.ts:87` |
| `combobox-overlay` | empty state `py-10` | `py-10` off-scale | ❌ | `combobox/combobox-overlay.ts` |
| `form-field` (outline) | `px-2/3/3/4/5` + `py-1/1.5/2/2.5/3` | md uses `px-3` where every sibling control uses `px-4`; sm and md share `px-3` | ❌ | `form-field/form-field.ts:176-180` |
| `form-field` (filled) | `pt-5/5/6/7/8` + `pb-1/1.5/2/2.5/3` | Asymmetric (floating label), `pt-7`/`pt-8` off-scale, xs and sm share `pt-5` | ❌ | `form-field/form-field.ts:181-185` |
| `date-picker` | root `px-3 py-2` at all sizes | No padding scale | ❌ | `date-picker/date-picker.ts:205` |
| `date-range-picker` | root `px-3 py-2` at all sizes | No padding scale | ❌ | `date-range-picker/date-range-picker.ts:197` |
| `time-picker` | root `px-3 py-2` at all sizes | No padding scale | ❌ | `time-picker/time-picker.ts:189` |
| `select` | option `px-2/3/3/4/4` | A third scale; md `px-3` vs the trigger's `px-4` | ❌ | `select/select.ts:756-764` |
| `transfer` | header `px-2/3/4/5/6`, search `px-2/3/3/4/4`, option `px-2/3/3/4/4` | Three different horizontal scales in one component | ❌ | `transfer/transfer.ts:232-267` |
| `segmented-control` | root `p-1` at all sizes | Off-scale, and additive on top of the option's own padding | ❌ | `segmented-control/segmented-control.ts:34` |
| `file-upload` | list item `px-3 py-2` at all sizes | Fixed, ignores `size` | ❌ | `file-upload/file-upload.ts:133` |
| `table` | toolbar `px-4 py-3`, footer `px-4 py-2`, pagination `px-2 py-2` | Three fixed paddings, none size-aware | ❌ | `table/table.ts:335, 359, 360` |
| `stat` | footer `mt-3 pt-3` | Fixed at all sizes while `root` scales | ❌ | `stat/stat.ts:67` |

---

## 5. HALF-STEP & OFF-SCALE VALUE AUDIT

CLAUDE.md requires an inline justification comment for `size-3.5` and for values off the
documented scales.

### `size-3.5` (permitted half-step — comment required)

| Location | Slot | Comment present? |
|---|---|---|
| `badge/badge.ts:68` | md `dismissIcon` | ✅ `:65-67` |
| `badge/badge.ts:73` | md `leadingIcon` | ✅ `:70-72` |
| `alert/alert.ts:80` | dismiss inner glyph | ✅ `:80` |
| `alert/alert.ts:176` | template dismiss svg | ✅ `:175` |
| `checkbox/checkbox.ts:65` | xs `box` | ✅ `:64` |
| `checkbox/checkbox.ts:83` | md `icon` | ✅ `:80-82` |
| `radio/radio.ts:70` | xs `circle` | ✅ `:69` |
| `radio/radio.ts:101` | xl `dot` | ✅ `:99-100` |
| `combobox/combobox.ts:132` | xs `chevron` / `spinner` | ✅ `:129-131` |
| `select/select.ts:174` | xs `chevron` | ✅ `:172-173` |
| `select/select-overlay.ts:224` | xs/sm checkmark | ✅ `:222-223` |
| `date-picker/date-picker.ts:175` | xs `triggerIcon` | ✅ `:174` |
| `date-range-picker/date-range-picker.ts:176` | xs `triggerIcon` | ✅ `:174-175` |
| `sort/sort-header.ts:66` | xs `arrowIcon` | ✅ `:64-65` |
| `paginator/paginator.ts:287` | xs `icon` | ✅ `:285-286` |
| `tags-input/tags-input.ts:92` | md `removeIcon` | ✅ `:88-89` |

**Every `size-3.5` in the library carries its justification.** ✅
Verified with an **unanchored** `grep -rnoE "size-3\.5"` (no leading `['" ]` boundary), so
arbitrary-variant-prefixed forms such as `[&_svg]:size-3.5` at `checkbox.ts:83` are included —
an anchored pattern silently skips those. 31 occurrences across 12 files; each class-bearing line
is immediately preceded by its rationale comment. No `size-3.5` exists outside the table above.

### Off-scale square/container sizes

| Location | Value | Scale it leaves | Comment? |
|---|---|---|---|
| `avatar/avatar.ts:55, 56, 60` | `size-10`, `size-12`, `size-16` | Glyph scale caps at `size-10` | ✅ `:57-59` (container-scale rationale) |
| `date-picker/date-picker.ts:199` | `size-10` (xl trigger) | Square-interactive caps at `size-9` | ✅ `:198` |
| `paginator/paginator.ts:304-307` | `min-w-10 h-10` (lg) | Square-interactive caps at `size-9` | ❌ **no comment** |
| `paginator/paginator.ts:311-314` | `min-w-11 h-11` (xl) | Square-interactive caps at `size-9` | ❌ **no comment** (only referenced second-hand from `date-picker.ts:198`) |
| `slider/slider.ts:184` | `size-10` (xl thumb) | Square-interactive caps at `size-9` | ⚠️ partial — `:156-157` cites the scale but does not justify exceeding it |
| `stepper/stepper.ts:94` | `size-10` (lg indicator) | Skips `size-9`; leaves the scale | ⚠️ partial — `:91-92` justifies `text-base` only, not the indicator size |
| `stepper/stepper.ts:98` | `size-12` (xl indicator) | Off-scale | ⚠️ partial (same comment) |
| `timeline/timeline.ts:225` | `size-10` (lg circle marker) | Off-scale | ❌ **no comment** |
| `timeline/timeline.ts:226` | `size-12` (xl circle marker) | Off-scale | ❌ **no comment** |
| `table/table.ts:350, 357` | `size-10` (empty/error icon) | Within the glyph scale ("large standalone") | n/a — conforming |
| `dialog/dialog-content.ts`, `sheet/sheet-content.ts` | `size-10` | Glyph scale "large standalone" | n/a — conforming |
| `calendar/calendar-cell.ts:36-37` | `h-10 w-16` / `h-10 w-14` (month/year cells) | Off both the square-interactive and glyph scales | ❌ **no comment** |

Re-audited with an **unanchored** `grep -rnoE "(size-1[0-9]|gap-[4-9]|py-3\.5|py-1[0-9]|p-1[0-9]|pt-[7-9]|pb-[7-9])"`
so arbitrary-variant forms (`[&_svg]:size-*`, `[&>tw-separator]:my-*`, `max-sm:p-*`) are covered.
The only additional hits are `timeline.ts:163` `pb-8` (justified at `:155-159`) and the
`max-{bp}:p-3` values in the table's responsive-card mode (`table.ts:485-488`), which are a
mobile-card layout rather than container padding.

### Off-scale gaps

CLAUDE.md permits `gap-1`, `gap-1.5`, `gap-2`, `gap-3` only.

| Location | Value | Comment? |
|---|---|---|
| `timeline/timeline.ts:161` | `gap-4` (sm item) | ❌ |
| `timeline/timeline.ts:162` | `gap-5` (md item) | ❌ |
| `timeline/timeline.ts:163` | `gap-6` (lg item) | ❌ |
| `timeline/timeline.ts:166` | `gap-8` (xl item) | ❌ — the comment at `:164-165` covers the font size, not the gap |

`timeline` is the only component using `gap-4` and larger, and none of the four is justified.
(The `pb-3/4/6/8/10` on `body` **is** justified at `:155-159`.)

### Off-scale vertical padding

| Location | Value | Comment? |
|---|---|---|
| `command-palette/command-palette.ts:109` | `py-3.5` (lg `searchInput`) | ❌ **no comment** — the only `py-3.5` in the library |
| `command-palette/command-palette.ts:87` | `py-10` (empty state) | ❌ |
| `combobox/combobox-overlay.ts` | `py-10` (empty state) | ❌ |
| `table/table.ts:349, 356` | `py-12` (empty / error) | ❌ |
| `form-field/form-field.ts:184, 185` | `pt-7`, `pt-8` | ❌ |

---

## 6. WHAT A RHYTHM SPEC HAS TO DECIDE

Stated as measurement consequences, not recommendations:

1. **Border in or out of the height budget.** Today the padding scale produces 24/32/**36**/44/48
   and bordered controls silently become 26/34/**38**/46/50. Either the border is subtracted from
   `py` for bordered controls, or every control gets an explicit `h-*` (the `paginator` /
   `slider` / `switch` model, which is the only group already landing cleanly on the 4px grid).
2. **A single canonical row height per size.** The current md cohort holds seven distinct values.
3. **`tw-form-field` must scale the control's type.** It is the only component whose density axis
   moves padding without moving the font.
4. **The three pickers need a padding scale.** `px-3 py-2` fixed is the direct cause of the
   largest divergences in the library.
5. **Tallest-child floors must be size-aware.** Fixed `size-5` icons (collapsible, command-palette,
   select clear) and min-content floors (time-picker steppers, number-stepper) override the
   size axis at low densities.
6. **Content must not change control height.** `tags-input` is the outlier.

### Grid summary at md

**On the 8px grid (12):** avatar 40 · badge 24 · badge-dot 8 · calendar month cell 40 · menu item 32 · progress rail 8 · slider 32 · stepper 32 · switch 24 · table compact 32 · timeline marker 32 · tooltip 32.

**On the 4px grid but not 8px (17):** breadcrumbs 20 · button solid 36 · calendar day cell 36 · checkbox 20 · collapsible 36 · icon 20 · item 36 · paginator nav button 36 · radio 20 · segmented-control 44 · select option 36 · sort-header 36 · spinner 20 · table comfortable 44 · tabs pill 36 · time-picker 12h 44 · transfer 36 · tree 28.

**Off the 4px grid entirely (14):** button outline 38 · combobox 38 · command-palette search 45 · **date-picker 50** · date-range-picker 38 · form-field 42 (66 with subscript) · input 38 · number-input 38 · paginator page-size select 38 · select trigger 38 · tabs underline/enclosed 38 · tags-input 38 (42 with a chip) · textarea 38 single-row / 78 at `rows=3` · **time-picker 42**.

Every entry in the third group except `command-palette` search and `time-picker` is `36 + 2px of border`.
