# Accessibility audit — `@cdevhub/ngx-tw`

**Target:** WCAG 2.2 Level AA + full AXE compliance.
**Scope:** every component under `projects/ngx-tw/`, the theme token layer under `projects/ngx-tw/theme/`, and the Playwright a11y suite under `e2e/`.
**Method:** static source audit (read-only — no library file was modified). Tailwind box arithmetic for target sizes; APG pattern conformance for ARIA and keyboard; oklch → sRGB → WCAG ratio computation for contrast.
**Date:** 2026-09-02. **Branch:** `develop` @ `69d3711` plus uncommitted working-tree changes.

> **Line numbers.** Every `file:line` anchor was resolved against the working tree at the time of writing. Unrelated concurrent edits landed mid-audit — `theme/_semantic.css` lost a 9-line block (calendar-width tokens moved to `_typography.css`), `date-range-picker.ts`, `toast/*` and `e2e/support/routes.ts` also changed. All `_semantic.css` anchors here have been re-resolved against the post-edit file and spot-verified. If the theme refactor continues, re-derive by symbol rather than by line.

Severity key — **HIGH** = WCAG 2.2 AA failure · **MEDIUM** = APG deviation or materially degraded AT experience · **LOW** = polish.

> **Framing.** The repo already tracks a set of known axe failures in `A11Y_BACKLOG`, `ARIA_CONTROLS_BACKLOG` and `ACCESSIBLE_NAME_BACKLOG` (`e2e/specs/03-accessibility/`). Findings inside those sets are tagged **[already tracked]** and are not presented as discoveries — there the finding is that the check is *unenforced*, not that the defect is unknown.
>
> **This library is already unusually a11y-literate.** `slider.ts`, `badge.ts` and `tags-input.ts` carry explicit SC 2.5.8 arithmetic in comments; `number-stepper.ts` reasons about the *Equivalent* exception and names the case it does not cover; `carousel.ts` implements the APG carousel pattern almost completely; `transfer.ts` solves focus-restoration-across-a-self-disabling-button. Sections 2 and 4 below therefore record a large number of **negative results** deliberately — knowing what was checked and passed is as useful as the failure list, and it keeps the failures credible.

---

## Lead table — HIGH findings

| # | Component | `file:line` | SC | Defect |
|---|---|---|---|---|
| H1 | carousel | `carousel/carousel.ts:270-274` (gaps `:290-294`, button `:1420`) | 2.5.8 | `dots` indicator buttons are 8–12 px with 12/16/20/20 px centre pitch at xs/sm/md/lg. Fails size **and** spacing. `dots` @ `md` is the **default configuration**. |
| H2 | carousel | `carousel/carousel.ts:276` | 2.5.8 | `lines` @ xs is a 4 × 16 px button on a 20 px pitch. |
| H3 | split | `split/split.ts:114` (applied `:97-99`) | 2.5.8 | Gutter drag target is `gutterSize` px wide — **6 px** by default — with no expanded hit area. |
| H4 | tree | `tree/tree.ts:135` (base `:129`) | 2.5.8 | `size="xs"` treeitem row is 20 px tall; rows are stacked flush, so no spacing exception. |
| H5 | menu | `menu/menu.ts:55` | 2.5.8 | `size="xs"` menu item is 20 px tall (`py-0.5` + `text-xs`), stacked with no gap. |
| H6 | select | `select/select.ts:167-168`, rendered `:394-402` | 2.5.8 | Clear control is `size-5` (20 × 20) and sits *inside* the trigger button, so the spacing exception is structurally unavailable. |
| H7 | select | `select/select.ts:394-402` + `:1039-1045` | 2.1.1 | The clear control has **no keyboard path**: `tabindex="-1"`, nothing calls `.focus()`, and no trigger key binding invokes `clear()`. Its `(keydown)` handler and focus ring are unreachable dead code. |
| H8 | select | `select/select.ts:187` (+ public `variant` input `:485`) | 2.4.7 | `variant="naked"` used standalone kills the ring (`focus-visible:outline-none`) and nothing replaces it — a grep of `form-field/` finds no ring at all. |
| H9 | select | `select/select.ts:369` vs `:1311-1315` | 4.1.2 | In `searchable` mode focus moves to the overlay search input while `aria-activedescendant` stays bound on the now-unfocused trigger. Arrow navigation is silent to AT. |
| H10 | checkbox | `checkbox/checkbox.ts:352` + missing `setLabelledByIds` override | 4.1.2 | A `tw-checkbox` labelled only by `<label twLabel>` inside a `tw-form-field` has **no accessible name**. |
| H11 | time-picker | `time-picker/time-picker.ts:468` + missing `setLabelledByIds` override | 4.1.2 | Same defect; the JSDoc at `:480` actively documents `<label for>` as a supported naming path. |
| H12 | tooltip | `tooltip/tooltip.ts:50`, `:341`, `:428`, `:310` | 1.4.13 | Tooltip is neither **hoverable** (`pointer-events-none` wrapper + 0 ms hide delay) nor **dismissible** (Escape bound only on the trigger host). |
| H13 | segmented-control | `segmented-control/segmented-control.ts:293-320` | 2.1.1 | **Space is not handled** and the host is not a native button, so a focused-but-unselected radio cannot be checked by keyboard. |
| H14 | segmented-control | `segmented-control/segmented-control.ts:176` | 2.1.1 | `activeValue() === null` is a strict null check; a value of `undefined` / `''` / any non-matching string leaves **no** option tabbable and the whole radiogroup drops out of the tab order. |
| H15 | tabs | `tabs/tabs.ts:212` + `:572-580` | 2.1.1 | If `value` matches no tab, no trigger gets `tabindex="0"` and the entire tablist becomes keyboard-unreachable. |
| H16 | command-palette | `command-palette/command-palette.ts:675-677` + `:768-772` | 2.1.1 | With `autoFocus="false"` nothing moves focus into the overlay, and every key binding is registered on `overlayRef.keydownEvents()` — the palette is entirely keyboard-inoperable while asserting `aria-modal="true"`. |
| H17 | date-picker | `date-picker/date-picker.ts:160` + `:208` | 2.4.7 | `variant="naked"` standalone: the input is `outline-none`, the root is `focus-within:outline-none`, and all nine `focused` compound variants are gated on `variant: 'default'` — **no indicator anywhere in the composite**. |
| H18 | calendar | `calendar/calendar-cell.ts:137` (host role `:111`) | 4.1.2 | `aria-selected` is bound on the inner `<button>`, whose implicit role does not support it; the `role="gridcell"` host carries none. **The selected day's state is never exposed.** |
| H19 | calendar | `calendar/calendar-view-base.ts:96`, `:204-208`, `:215` | 2.1.1 | `focusedCellValue` is a sticky roving-cursor override with exactly one writer (`focusCell`) and **no writer that ever resets it to `null`**. Any period change that skips `focusCell()` strands it, leaving **zero tabbable cells** — the grid drops out of the tab order. |
| H20 | calendar | `calendar/calendar-cell.ts:141` | 2.1.1 | `[disabled]` on the cell button (alongside the correct `aria-disabled` at `:138`) makes `.focus()` a no-op, so a fully-disabled month has no tab stop and arrow-navigating onto a disabled date desynchronises `tabindex` from DOM focus. |
| H21 | date-range-picker | `date-range-picker/date-range-picker.ts:342` | 2.1.1 | Clear button is `tabindex="-1"` with a `(click)`-only handler, the trigger is a `<button>` (not typable), `onTriggerKeydown` (`:996-1014`) handles only Alt+Arrow and Escape, and `showActions` defaults to `false`. **No keyboard path to clear.** |
| H22 | table | `table/table.html:132` | 2.1.1 | The clickable `<tr>` has a `(click)` wired to the public `rowClicked` output with **no `tabindex`, no `role`, no `(keydown)`, and no focus indicator**. Row-click is mouse-only with no alternative affordance shipped. |
| H23 | toast | `toast/toast-config.ts:67` + `toast/toast-renderer.ts:103-108` | 2.2.1 (2.1.1) | Toasts auto-dismiss after **5000 ms** while their action and dismiss buttons sit at the end of the document tab order inside a CDK global overlay with **no focus trap, no autofocus, no restore, and no F6 hotkey**. The time limit cannot be turned off, adjusted or extended by the user. |
| C1 | checkbox, radio, input, select | `checkbox.ts:111`, `radio.ts:115`, `input.ts:81`, `select.ts:183` | 1.4.11 | Resting boundary uses `border-border` = gray-300 → **1.47:1** light, **2.66:1** dark. An unchecked checkbox has no text; the border *is* the component. `border-border-strong` is also under 3:1 in light (**2.60**). |
| C2 | button | `button/button.ts:21` + `theme/_semantic.css:274` | 1.4.11 | `solid: ''` gives the solid variant no border, so the fill is the only boundary. `warning` fill vs page = **2.15:1** light, **1.72:1** high-contrast (dark passes at 11.72) — high-contrast is *worse* than light here. |
| E1 | e2e config | `e2e/support/a11y.ts:20-26` | — | `AXE_TAGS` omits `wcag22a`/`wcag22aa`. Axe's `target-size` rule is `wcag22aa`, so **every SC 2.5.8 finding above is invisible to CI by configuration.** |
| E2 | e2e config | `e2e/specs/03-accessibility/examples.spec.ts:87-116` | — | axe runs immediately after `goto` with **zero interaction**, and `runAxe` appears nowhere else. No open overlay, expanded panel, error state or disabled state is ever scanned. |
| E3 | e2e config | `e2e/specs/02-cross-cutting/theme-matrix.spec.ts:84` | — | The only cross-theme `color-contrast` sweep is `test.fixme`'d. The `high-contrast` theme has **zero** contrast verification anywhere. |
| E4 | e2e config | `e2e/specs/03-accessibility/examples.spec.ts:52-70` | — | `A11Y_BACKLOG` excludes 12 components from the axe sweep entirely — both schemes, all rules — rather than scoping the skip to the failing rule. **[already tracked]** |

**Cheapest high-value fixes**, in order: (1) add `'wcag22a','wcag22aa'` to `AXE_TAGS` — one line, and it turns eight of the SC 2.5.8 findings into enforced CI failures; (2) darken `--color-border` in light mode — one token, closes C1 across four components; (3) `min-h-6` on the `checkbox`/`switch`/`radio` root slots and a size floor on the carousel indicators — closes the largest cluster in §2; (4) add the missing `setLabelledByIds` overrides to `checkbox` and `time-picker` — closes H10/H11 and retires two `ACCESSIBLE_NAME_BACKLOG` entries.

---

## 1. Focus indicators

### The library-wide picture is strong

A word-level grep (`grep -rnoE "(^|[^-a-z])focus:[a-z0-9:.\[\]/-]+"`) across every non-spec `.ts`/`.html` returns **exactly one** bare `focus:` in the entire library:

- **LOW** — `input/input.ts:79` — `'border-0 p-0 shadow-none focus:outline-none focus-visible:outline-none'`. The `focus:` half is redundant next to the `focus-visible:` half on the same line, but it is a literal violation of the codified "always `focus-visible`, never `focus`" rule and the only one. Delete it.

> Note for reproducibility: a *line-level* grep (`grep focus: | grep -v focus-visible`) returns zero hits and is wrong — this line contains both utilities, so the line filter hides it. Two independent passes made that mistake before the word-level grep settled it.

Every other focus utility in the library is `focus-visible:` or `focus-within:`. All 22 `outline-none` / `focus-visible:outline-none` sites were individually adjudicated below.

### HIGH

- **HIGH (SC 2.4.7)** — `select/select.ts:187`. `naked: { trigger: 'bg-transparent border-0 rounded-none p-0 focus-visible:outline-none' }`. `variant` is a **public input** (`select.ts:485`), so `variant="naked"` is reachable standalone with no wrapper. Nothing replaces the ring: a grep for `focus-within|ring-2|outline-2` across `form-field/` returns nothing, and the `focused: true` compounds in `selectVariants` (`:211-218`) are scoped to `variant: 'default'`. Result: **no focus indicator whatsoever**.
  Contrast `combobox/combobox.ts:553`, where `naked = computed(() => !!this.formField)` is *not* consumer-settable, so combobox has no equivalent standalone path — that is the fix shape.

- **HIGH (SC 2.4.7)** — `date-picker/date-picker.ts:208` + `:160`, scoped to an explicit `variant="naked"` outside a `tw-form-field`. `resolvedVariant()` (`:655-656`) lets a consumer set `naked` standalone. In that state the root is `border-0 … focus-within:outline-none`, the input is `outline-none` with no replacement, and none of the nine `focused` compound variants apply (all are gated on `variant: 'default'`). **No visible focus indicator anywhere in the composite.** When `naked` is *auto*-selected inside a form-field, `form-field.ts:208-215` supplies the border swap, so that path is weakly compliant rather than a failure. Exactly the same shape as the select finding above — worth fixing both with one rule.

### MEDIUM

- **MEDIUM (SC 2.4.7 risk + codified-pattern departure)** — `form-field/form-field.ts:208-215` (`outline`) and `:218-225` (`filled`). For every control wrapped in a `tw-form-field` — input, textarea, number-input, tags-input, file-upload, select, combobox — the sole focus indicator is a **1 px `border-color` swap**, not a ring. Two problems:
  1. It is gated on `isFocused` (`form-field.ts:485`), which reads the control's CDK `FocusMonitor` state and therefore **fires for mouse origin too** — the exact behaviour the "never bare `focus:`" rule exists to prevent.
  2. At `color="neutral"` (`:211`) the focused border is `border-border-strong`, which is **identical to the hover state** already declared at `:132` (`hover:border-border-strong`). A keyboard-focused neutral field is visually indistinguishable from a hovered one, and only one neutral shade from resting.
- **MEDIUM** — `combobox/combobox.ts:159`. The `naked` variant sets `focus-within:outline-0 focus-within:outline-offset-0`, cancelling the wrapper ring so only the form-field border swap survives. Lower risk than select because `naked` is derived, not consumer-set.
- **MEDIUM** — `date-picker/date-picker.ts:160`, `variant="default"`. The input kills the UA ring with `outline-none` and never restores it; the only focus signal is a border-colour shift on the *root* (compound variants `:231-238`). SC 2.4.7 is minimally met, but it deviates from the codified canonical ring **and from the library's own text-input precedent** — `input.ts:81` puts the canonical ring on the input element itself.
- **MEDIUM** — `command-palette/command-palette.ts:74` (with `:72`). The search input is DOM-focused on open (`:675-677`) and carries `outline-none`; neither the input slot nor `searchWrapper` supplies any replacement. The text caret is the only focus signal. A caret is conventionally accepted for a text input, so this is not a clear AA failure — but unlike combobox (which compensates with a wrapper `focus-within:` ring at `:118`) there is no compensation at all.

### LOW

- **LOW** — `tabs/tabs.html:96-103`. The `role="tabpanel"` is `tabindex="0"` but inherits no focus indicator; a focused panel shows nothing.
- **LOW** — `file-upload/file-upload.ts:127`. The dropzone declares the canonical ring on an element that can never receive focus (no `tabindex`) — dead CSS implying a focusability contract the element does not honour.
- **LOW** — `input/input.ts:79` + `form-field/index.ts`. `TW_FORM_FIELD` is publicly exported, so a consumer can provide it on a hand-rolled wrapper, get `inFormField: true`, and inherit a `tw-input` with **no** focus indicator — their wrapper silently becomes responsible for supplying one. Undocumented on the token's JSDoc (`form-field.ts:96-103`).

### Adjudicated CLEAN — the two codified carve-outs, and everything that looked like one

| Site | Verdict |
|---|---|
| `menu/menu.ts:52` (`outline-none focus-visible:bg-surface-muted`) | **Carve-out (a) legitimately met.** All three consumers of `menuItemVariants` carry a CDK host directive supplying the required role: `MenuItemDirective` → `CdkMenuItem` (`:220-224`, `menuitem`), `MenuItemCheckboxComponent` → `CdkMenuItemCheckbox` (`:268-272`), `MenuItemRadioComponent` → `CdkMenuItemRadio` (`:328-332`). Uses `focus-visible:`, never bare `focus:`. |
| `command-palette/command-palette.ts:80` | **Carve-out (b) legitimately met.** Options are `<div role="option">` with no `tabindex` and no keydown handlers (`command-palette-overlay.html:42-50`); `aria-activedescendant` lives on the input (`html:17`). The active style is a real variant (`:122-125` `active: true → bg-surface-sunken`) with a `compoundVariants` entry (`:131-141`) stopping hover from demoting the active row — three distinguishable states: resting / hover (`muted`) / active (`sunken`). |
| `transfer/transfer.ts:210` | **CLEAN, and specifically *not* a carve-out claimed without qualifying.** `cdkListboxUseActiveDescendant` is never bound, so CDK's default `false` applies and options take real DOM focus — but the options carry the **canonical outline ring** at `:213`. The `outline-none` is on the scroll container, whose focus is transient (`CdkListbox._handleFocus()` forwards it to an option immediately). This was the highest-suspicion site in the brief; it is correct. |
| `dialog/dialog-container.ts:41`, `sheet/sheet-container.ts:42` | **CLEAN.** Both hosts are `tabindex="-1"` (`dialog-container.ts:79`, `sheet-container.ts:125`), focused programmatically by the CDK focus trap and never by user traversal. A ring around the whole modal panel would be noise with no navigational value. |
| `stepper/stepper.ts:110`, `:119` | **CLEAN.** `outline-none` is followed by the canonical ring in the same slot string — reset + replacement in one declaration. |
| `combobox/combobox.ts:114`, `:120` | **CLEAN.** The `#triggerSurface` wrapper carries `focus-within:outline-2 focus-within:outline-offset-2` (`:118`) plus per-colour variants (`:139-146`) and an error override (`:164`). Exactly one ring, no double ring. |
| `tags-input/tags-input.ts:73` | **CLEAN.** Wrapper carries `focus-within:outline-2 focus-within:outline-offset-2` at `:81` with per-colour variants at `:97-104`. The legitimate composite-input pattern. |
| `tabs/tabs.html:14-15` scroll buttons | **CLEAN on focus.** They have no ring *because* they are `tabindex="-1" aria-hidden="true"` — pointer-only affordances deliberately excluded from the a11y tree. Their size is a separate §2 finding. |
| `date-range-picker.ts:200`, `time-picker.ts:192`, `date-picker.ts:208` (`focus-within:outline-none` on the naked root) | **CLEAN in themselves** — the root is not focusable and carries no outline to remove. |
| `date-range-picker.ts:158` (trigger), `time-picker.ts:116` (spinbutton field) | **CLEAN.** Each pairs `outline-none` with the canonical ring on the same class string; exactly one ring survives. |
| `date-picker.ts:160` (input) | **DEFECTIVE** — see the HIGH and MEDIUM below. |
| `calendar/calendar-cell.ts:31` (day / month / year cell) | **CLEAN.** Canonical ring on the `button` slot for all three views. The `{ state: 'selected' }` compound at `:92` sets `ring-0`, which touches `ring`, not `outline`, so it does not suppress the indicator. Correctly claims **no** carve-out: the calendar is a focus-managed grid where cells take real DOM focus. |
| `calendar/calendar-header.ts:18`, `:20` (prev/next, period trigger) | **CLEAN.** Canonical ring. |
| data/nav group — accordion/collapsible trigger `collapsible.ts:50`, paginator chevrons `paginator.ts:270` and page buttons `:272`, breadcrumb links `breadcrumbs.ts:81` and overflow trigger `:92`, sort header `sort-header.ts:53`, toast dismiss `toast-component.ts:30` and action `:24`, alert dismiss `alert.ts:83` | **All canonical.** Zero `outline-none` and zero bare `focus:` anywhere in that group. The paginator's active page swaps the outline colour per palette (`:159-170`) but keeps 2 px / offset-2. |
| `table/table.html:132` (clickable row) | **No indicator — the element is not focusable at all.** See H22 in §4. |

Canonical rings confirmed present on: button base (`button/button.ts:18`, so **every** variant incl. `ghost`/`link`), badge dismiss (`badge.ts:22`), code-block copy + `<pre>` (`code-block.ts:61,63`), flip-card (`:72`), item (`:76`), timeline chevrons (`:469`), tabs/tab-nav triggers (`core/tab-trigger-variants.ts:28`), segmented-control option (`:36`), radio root (`:55`), tree node (`tree.ts:129`), split gutter (`split.ts:43`), transfer options + move buttons (`:213`, `:224`), slider thumbs (`:145` + per-colour at `:114-123`), checkbox root (`:53`), switch root (`:44`), calendar cell (`calendar-cell.ts:31`), carousel viewport/pause/indicator (`:198`, `:212`, `:216`), paginator nav + page buttons (`:270`, `:272`), time-picker steppers/meridiem/clear (`:133`, `:138`, `:139`), number-stepper (`:35`).

---

## 2. WCAG 2.2 SC 2.5.8 Target Size (Minimum) — 24 × 24 CSS px

**Method.** Rendered box computed from Tailwind arithmetic (`size-N`/`h-N`/`w-N` = N × 4 px; `p{x,y}-N` = N × 4 px per side; `text-xs` lh 16 px, `text-sm` lh 20 px, `text-base` lh 24 px, `text-2xs` lh 16 px per `theme/_semantic.css:44-45`). The **spacing** exception is then applied as a second step: a 24 px-diameter circle centred on the target must not intersect an adjacent target's circle, i.e. **centre-to-centre pitch ≥ 24 px**. The **equivalent-control** and **inline** exceptions are applied where they genuinely hold and are called out explicitly.

### HIGH — fails size, and the spacing exception does not rescue it

| Component | Variant / size | Computed box | Pitch to neighbour | `file:line` |
|---|---|---|---|---|
| **carousel** indicators, `dots` | xs | **8 × 8** | 8 + `gap-1` 4 = **12** | `carousel.ts:270`, gaps `:290` |
| | sm | **10 × 10** | 10 + `gap-1.5` 6 = **16** | `:271`, `:291` |
| | **md (default)** | **12 × 12** | 12 + `gap-2` 8 = **20** | `:272`, `:292` |
| | lg | **12 × 12** | 12 + `gap-2` 8 = **20** | `:273`, `:293` |
| | xl | 12 × 12 | 12 + `gap-3` 12 = 24 (tangent) | borderline — passes |
| **carousel** indicators, `lines` | xs | **4 × 16** | 16 + 4 = **20** | `:276`, `:290` |
| **carousel** indicators, `numbers` | xs | **20 × 20** | 20 + 4 = 24 (tangent) | borderline — passes |
| **split** gutter | all | **6 px** cross-axis | n/a — both neighbours are panes with consumer targets | `split.ts:114`, `:97-99` |
| **tree** node row | xs | **20 px** tall (`py-0` + `text-sm`) | rows flush, pitch 20 | `tree.ts:135`, base `:129` |
| **menu** item | xs | **20 px** tall (`px-1.5 py-0.5 text-xs`) | items flush in `flex-col`, pitch 20 | `menu.ts:55` |
| **select** clear | all | **20 × 20** | nested *inside* the trigger button | `select.ts:167-168`, `:394-402` |

Notes on each:

- **carousel** — the indicators are real `<button type="button">` (`carousel.ts:1420-1430`) whose class list is the `indicator` slot (`:214-216`, **no padding**) plus the size class only. There is no enlarged invisible hit area. `dots` is the default `variant` and `md` the default `size` (`:328-333`), so **the out-of-the-box configuration fails.** `sm`–`xl` `lines` and `sm`–`xl` `numbers` all pass. The `pauseControl` at `:210` is `size-6` = 24 × 24 and passes exactly. `[twCarouselPrev]`/`[twCarouselNext]` are *directives* on consumer-supplied buttons (`:1526`, `:1582`) — the library sets no geometry, so sizing is the consumer's responsibility; that is a documentation gap, not a library failure.
- **split** — `[style.flex-basis.px]="gutterSize()"` with `min-width`/`min-height` also `gutterSize()`, defaulting to **6** (`split.ts:114`). No padding, no pseudo-element, no transparent overlay anywhere in the template. The spacing exception cannot rescue it: a 24 px circle centred on the gutter extends 12 px into both adjacent panes, which routinely hold consumer targets. The *essential* exception is arguable for a visually thin divider, but the standard fix (keep the 6 px visual rail, expand the hit area with padding + negative margin) is well known, which makes the exception hard to sustain. Keyboard resize exists (`:637-741`) but keyboard operability is not one of SC 2.5.8's exceptions.
- **tree** — `sm` lands on exactly 24 with zero margin; any consumer line-height override drops it under.
- **menu** — `sm` (`px-2 py-1 text-xs`) is exactly 24; `md`/`lg`/`xl` are 32/36/44.
- **select clear** — the clear affordance is rendered *between* the trigger's opening and closing tags (`:394-402` sits inside the `<button role="combobox">` spanning `:360`–`:425`), and the trigger is itself a target with its own `(click)`. A 24 px circle on the 20 px clear control necessarily intersects the enclosing trigger's box, so the exception fails structurally. This finding is secondary to **H7** (SC 2.1.1), which is Level A and independent of any exception reading.

### MEDIUM — below 24 px with a partial or arguable exception

- **button, `link` variant** — `button/button.ts:115-120` strips padding at **every** size (`px-0 py-0`), giving 16 px (xs), 20 px (sm), 20 px (md), 24 px (lg/xl). A link-button genuinely inside a sentence is exempt (*inline*), and an isolated one passes via *spacing* — but nothing constrains the variant to inline use, and two stacked link buttons with `gap-2` have intersecting circles. Needs either a documented inline-only contract or a `min-h-6` floor.
- **tabs scroll buttons** — `tabs/tabs.ts:76-77`, `size-5` = 20 × 20 at xs/sm, flush against the trigger strip. Mitigating: they are `tabindex="-1" aria-hidden="true"` (`tabs.html:14-15`) and the strip is natively swipe/wheel-scrollable and arrow-key reachable. But SC 2.5.8 has no `aria-hidden` exception, and a redundant *gesture* is not an "equivalent control" in the criterion's sense. `md`+ pass (24/28/32).
- **number-input steppers** — `number-input/number-stepper.ts:35` + `:42-46`. Buttons carry a fixed **width** only (`w-6`/`w-7`/`w-7`/`w-8`/`w-8`); height comes from `flex-1` inside a `flex flex-col self-stretch` column, so each button is roughly **half the field's line box** — ≈ 28 × 12–19 px at md, floored near 12 px by the `size-3` glyph. Stacked and adjacent, so no spacing exception. The file's own comment (`:24-33`) argues the **Equivalent** exception (the ≥ 24 px spinbutton accepts typed values and ↑/↓) — a reasonable argument, and the reason this is MEDIUM not HIGH. **But the comment itself names the hole it does not cover:** a negatives-allowed field on touch, where `inputmode="numeric"/"decimal"` exposes no minus key and there are no hardware arrows, leaving the sub-24 px decrement button as the only path to a negative value. That residual case is a genuine failure.
- **time-picker steppers** — `time-picker/time-picker.ts:131-133` with per-size widths at `:150,158,166,174,182`. Identical shape and identical in-source reasoning (`:125-130`), but the measured boxes are **worse** than number-input's: `stepperGroup` is `flex flex-col self-stretch` and each `stepper` is `flex-1`, so the two buttons split the row height — **24 × 8–12** (xs), **28 × 10–12** (sm/md), **32 × 12–16** (lg/xl). Stacked and adjacent, so no spacing exception. Here the Equivalent argument is nonetheless **stronger** than number-input's: the hour/minute fields are `type="text" inputmode="numeric"` (`:305-306`, `:333-334`, `:362-363`), so a touch keyboard can enter every reachable value including every meridiem state, and in `readonlyInput` mode the steppers are natively `disabled` too (`:395`, `:410`). That is a complete equivalent control on the same page, which number-input's negatives-on-touch case is not. **MEDIUM** — the Equivalent exception genuinely applies here, but this is the largest undersize in the library and deserves a documented decision rather than an inline comment.
- **checkbox, unlabelled** — `checkbox/checkbox.ts:63-103`. With no label/description the `labelWrap` collapses via `empty:hidden` and the target reduces to the box: **14 × 16** (xs), **16 × 20** (sm), **20 × 20** (md). `lg` 24 × 24 and `xl` 28 × 28 pass.
- **switch, unlabelled** — `switch/switch.ts:59-87`. Track: **28 × 16** (xs), **36 × 20** (sm). `md` 44 × 24, `lg` 48 × 28, `xl` 56 × 32 pass.

### LOW — undersized but genuinely exempt (recorded so the geometry is on file)

- **checkbox / switch / radio, labelled.** There is no `<label>` element in any of the three; the whole host carries the role and the `(click)` (`checkbox.ts:256,270`; `switch.ts:189,202`; `radio.ts:227,235`) and contains the label span, so the effective target is the full host row — wide, but still **16 / 20 / 20 px tall** at xs / sm / md (`boxWrap` `min-h-4`/`min-h-5` and `track` `h-4`/`h-5` against `leading-4`/`leading-5`). In a vertical group with the default `gap-2` (8 px) the pitch is 24 px at xs (tangent) and 28 px at sm/md — **exempt via spacing**. The exemption is consumer-dependent: a `gap-0` list breaks it, and xs has zero margin. A `min-h-6` on the three root slots would remove the dependency entirely and is the single cheapest fix in this section.
- **stepper, `dot` variant** — `stepper/stepper.ts:125-129`. The indicator collapses to `size-2`/`size-2.5`/`size-3`, so header height falls to the label line box: ≈ 15 px (xs), 17.5 px (sm/md), 20 px (lg/xl). Genuinely exempt: headers are separated by a non-interactive connector (`flex-1 h-px mx-2` horizontal `:107`, `min-h-6 my-1` vertical `:116`) putting centre-to-centre well above 24 in both orientations. The `default` and `simple` variants pass on their own (24/28/32/40/48).
- **combobox clear** — `combobox/combobox.ts:122` `size-5` (sm–xl), `:132` `size-4` (xs). **Passes via spacing**: its only adjacent target is the input, separated by `gap-1.5` (6 px), giving centre-to-edge 16 px at md and 14 px at xs — both above the 12 px radius. The chevron (`:322-334`) is an `aria-hidden` decorative SVG with no click handler and `#triggerSurface` (`:253`) has no `(click)`, so no cluster forms.
- **badge dismiss** — isolated instances would pass via spacing anyway, but they pass outright (see below).
- **table row-selection checkbox** — `table/table.html:113-118` renders an unlabelled `<tw-checkbox size="sm">`, so the target is 16 × 20 px. **Passes via spacing at every shipped density × size**, with the numbers: vertically, the nearest other target is the adjacent row's checkbox, so the pitch *is* the row height — minimum **28 px** (bordered + compact), 32 (compact), 44 (comfortable). The tightest specific pair, select-all → first row, is 28 / 32 / 44. Horizontally the selection column is `w-12` (48 px) with the 16 px box centred (`table.ts:365-366`), leaving 16 px clear each side, and the next column's content starts 12–16 px beyond that. Margin at the worst case is ~4 px — worth a code comment, because a consumer narrowing the selection column or overriding density breaks it silently.
- **breadcrumb links** — `breadcrumbs/breadcrumbs.ts:79-81`. The `link` slot has **zero padding** (no `px-*`, `py-*`, or `min-h-*`), so its box is literally the line box: 16 px (xs `text-xs`), 20 px (sm/md `text-sm`), 24 px (lg/xl `text-base`). This is the **inline** exception's second limb — *"its size is otherwise constrained by the line-height of non-target text"* — satisfied by construction, since the height *is* the line-height and there is non-target text on the same line (the `current` span at `:313`, the `aria-hidden` separators at `:324`). **Read as a pass.** One hedge worth recording: if a reviewer rejects the inline exception, the `flex-wrap` layout (`:77`) puts vertically-adjacent link centres only 16–20 px apart at xs/sm/md, which spacing could not rescue. A `min-h-6` on the `link` slot removes the argument for ~zero visual cost.
- **time-picker numeric fields** — `time-picker.ts:149,157,165,173,181`: xs **20 × 16**, sm **24 × 20**, md **28 × 20** are under 24 × 24 (lg 32 × 24 and xl 36 × 24 pass outright). xs/sm/md **pass via spacing**: hour→minute centre distance is ≈ 27 px (xs) to 36 px (md), computed as half-field + separator (`px-0.5` = 4 px plus the `:` advance) + half-field, with no vertical neighbours. **xs is the tight one — ~27 px against a 24 px requirement, and the `:` glyph advance is an estimate. Worth one browser measurement before relying on it.**

### CLEAN — verified ≥ 24 × 24 at every size variant (negative results)

| Component | Evidence |
|---|---|
| paginator nav + page buttons | `min-w-7 h-7` (28) → `h-11` (44), `paginator.ts:281-315` |
| slider thumb | `size-6` (24) → `size-10` (40), `slider.ts:158-187` — carries an explicit SC 2.5.8 comment; the whole region is also a click/drag target (`:269` → `:800-813`) |
| calendar cells | day `h-9 w-9` (36), month `h-10 w-16`, year `h-10 w-14`, `calendar-cell.ts:35-37` |
| badge dismiss | `size-6`/`size-6`/`size-7`/`size-8`/`size-8` (24–32), `badge.ts:48,57,64,77,84`. Negative margins affect flow, not the hit box. |
| tags-input remove | `size-6`→`size-8` (24–32), `tags-input.ts:90-94` |
| alert dismiss | `size-6` (24), `alert.ts:83` |
| tabs close button | `size-6`→`size-9` (24–36), `tabs.ts:76-80` |
| breadcrumbs overflow trigger | `size-6`→`size-9` (24–36), `breadcrumbs.ts:102-134` |
| time-picker clear / meridiem | `size-6` (24) `:139`; meridiem `px-1.5 py-1 text-2xs` = 16 + 8 = 24 exactly `:152` |
| transfer options / move buttons | rows 24→48 (`:236-269`); move buttons `size-6`→`size-9` (24–36) |
| tabs / tab-nav / segmented-control triggers | xs `px-2 py-1 text-xs` = 24 exactly; sm–xl 32/36/44/48 (`core/tab-trigger-variants.ts`) |
| command-palette rows | xs `py-1 text-xs` = 24 exactly; sm–xl 28/36/40/48 (`:93-113`) |
| select trigger + options | xs 24 exactly; sm–xl 32/36/44/48 (`:174`, `:753-765`) |
| combobox trigger + options | 24/32/36/44/48; options fixed 36 (`combobox-overlay.ts:184`) |
| stepper `default`/`simple` indicators | `size-6`→`size-12` (24–48) |
| button (non-link) | xs `px-2 py-1 text-xs` = 24 exactly; icon-only xs = 24 × 32 |
| code-block copy | `size-8` (32), `:63` — also isolated |
| timeline scroll chevrons | `size-8` (32), `:546-592` |
| file-upload per-file remove | `twButton size="sm"` ≈ 40 × 28, `file-upload.html:100-111` |
| carousel pause control | `size-6` (24), `carousel.ts:210` |
| calendar prev/next nav | `h-9 w-9` (36 × 36), `calendar-header.ts:18`; period trigger `px-3 py-1.5 text-sm` = 32 tall, `:20` |
| date-picker trigger button | 24 / 28 / 32 / 36 / 40, `date-picker.ts:173,180,186,192,199` (xs exactly at the floor) |
| date-picker / date-range-picker / time-picker clear | `size-6` (24 × 24) at `date-picker.ts:166`, `date-range-picker.ts:168`, `time-picker.ts:140` — each also has ≥ 24 px clear space, so they would pass via spacing even at the margin |
| time-picker meridiem toggle | xs `px-1.5 py-1 text-2xs` = 24 × ~27 (zero margin); sm/md 24 × ~33; lg/xl 32 × ~37/41 (`:152-184`) |
| paginator page + all chevrons | 28 / 32 / 36 / 40 / 44 square, `paginator.ts:281-312` |
| breadcrumbs overflow trigger | `size-6`/`7`/`8`/`9`/`9` (24–36), `breadcrumbs.ts:102-134` — **CLAUDE.md's `size-9`-saturation note verified, and every smaller size uses the square-interactive scale, not the glyph scale** |
| sort header | xs `py-1` + `text-xs` = 24 (icon `size-3.5` does not exceed the line box); sm–xl 32/36/44/48, `sort-header.ts:63-82` |
| accordion / collapsible trigger | xs `py-1` + max(lh 16, `size-5` icon) = 28; sm–xl 32/36/44/48, `collapsible.ts:74-78` |
| toast dismiss / action | `size-6` container with a `size-4` glyph = 24 × 24 (`toast-component.ts:30`); action `py-1.5 text-sm` = 32 (`:24`) |
| table row height | comfortable 44, compact 32, bordered+compact **28** (the minimum across every density × size), `table.ts:389-395,435-440` |
| progress-bar, skeleton, spinner, stat, avatar, separator, aspect-ratio | non-interactive — exempt. Progress-bar confirmed: `aria-valuenow` correctly **omitted** when indeterminate (`progress-bar.ts:165,183`) |

---

## 3. ARIA correctness per APG pattern

### HIGH

- **HIGH (SC 4.1.2) — accessible name lost through `tw-form-field` label pushdown.**
  `LabelDirective` binds `[attr.for]="controlId()"` = the control's `id()` (`form-field/form-field.ts:264-268`), and the form-field separately pushes label ids via `ctrl.setLabelledByIds(ids)` (`:617-630`). The base implementation of that method is a **no-op** (`:71-73`). Six controls override it — `input.ts:404`, `transfer.ts:1191`, `combobox.ts:1452`, `tags-input.ts:714`, `file-upload.ts:900`, `select.ts:1492`. Two that need it do **not**:
  - **`checkbox`** — `id()` resolves to the host `<tw-checkbox>` (`checkbox.ts:352`, host `[id]="id()"` at `:257`). A custom element is **not a labelable element**, so `<label for>` is inert. The fallback `effectiveAriaLabelledby` (`:405-410`) then points at the component's own internal `<span id="labelElementId">` (`:239`), which is **empty** in this scenario, and `role="checkbox"` name-from-contents also resolves empty. Corroboration: `checkbox.spec.ts:849-887` uses exactly this markup and asserts only `label[for] === checkbox.id`, never the accessible name; the demo's live example papers over it with a redundant `aria-label` while the copyable snippet omits it.
  - **`time-picker`** — `'[id]': 'hostId'` sits in the **host block** (`time-picker.ts:466-472`) on a `<tw-time-picker>` element that carries no role and no `aria-labelledby`. The JSDoc at `:480` states the id is *"Used by the form-field's `<label for>` attribute"* — documenting a path that does not work.

  **Correctly not affected:** `date-picker` puts `hostId` on the inner `<input type="text">` (`:317`) and `date-range-picker` on a `<button>` (`:291`) — both labelable, so `<label for>` works natively. `textarea` inherits `InputDirective`'s override.

  Relationship to the tracked backlog: `ACCESSIBLE_NAME_BACKLOG` lists `checkbox`, and `explicit-assertions.spec.ts:184-192` correctly reasons that the *standalone* checkbox failure is a **harness false positive** (the scanner sees the `hidden aria-hidden="true"` native proxy at `checkbox.ts:195-202` while the name lives on the host). That reasoning holds only when the checkbox carries its own `label`/`aria-label`/projected content. **The form-field-wrapped path is a genuine failure and is not covered by the tracked item.**
  Fix on both sides: add the `setLabelledByIds` override to `checkbox` and `time-picker`, and add a second dev-mode warning in `form-field` — the one at `:286-293` only checks that the *directive host* is a `<label>`, never that the **target** is labelable.

- **HIGH (SC 4.1.2) — `select` strands `aria-activedescendant` in searchable mode.** On open with `searchable()`, focus is moved to the overlay's search input (`select.ts:1311-1315`), but `aria-activedescendant` is bound on the **trigger** (`:369`), which no longer holds focus. The search input has `aria-label` and `aria-controls` but **no `role="combobox"`, no `aria-activedescendant`, no `aria-expanded`** (`select-overlay.ts:45-56`). Arrow keys still update `activeIndex` visually (`select-overlay.ts:266-268` → `select.ts:1403`), but the active-option id is published on an unfocused element, which AT ignores. Arrow navigation in searchable mode is **completely silent to a screen reader**.

- **HIGH (SC 4.1.2) — `calendar` never exposes the selected day.** `calendar/calendar-cell.ts:137` binds `aria-selected` on the inner `<button>`, whose implicit `button` role does not support the attribute; the `role="gridcell"` host at `:111` carries none (it gets `data-state-selected` at `:115`, which is styling only). Screen readers announce the date but never "selected" — in single, multiple, **and** both range endpoints. Fix: move the binding to the host alongside the `data-state-*` bindings.
  Everything else in the grid is right and worth stating: `role="grid"` with an `aria-label` naming the month (`month-view.ts:36-37`, `year-view.ts:25-27`, `multi-year-view.ts:28-31`), `role="row"` (`month-view.ts:43,56`), `role="columnheader"` with the long weekday name as `aria-label` over the narrow visible text (`:45-51`), `aria-current="date"` on today (`calendar-cell.ts:139`), `aria-disabled` on out-of-range days (`:138`), live `aria-multiselectable`/`aria-readonly` (`month-view.ts:38-39`, `calendar.ts:907`), `role="group"` + label on the root (`calendar.ts:156-157`), and **no `aria-activedescendant`** — correct, this is a roving-tabindex grid.

### MEDIUM

**Window splitter (`split`)**
- `split/split.ts:87` — **`aria-orientation` is inverted.** It binds the *layout* direction, but on `role="separator"` the attribute describes the separator's own axis. APG is explicit: "Left/Right Arrow moves a **vertical** splitter". This component drives `direction: 'horizontal'` with Left/Right (`:657-662`) — an APG *vertical* splitter — while emitting `aria-orientation="horizontal"`. AT announces the wrong axis and suggests the wrong keys. Fix: `direction() === 'horizontal' ? 'vertical' : 'horizontal'`.
- `split/split.ts:88-89` — `aria-valuemin`/`aria-valuemax` are hardcoded `0`/`100` while the real movable range is bounded by the panes' `minSize`/`maxSize` (`split-pane.ts:33-36`, enforced in `redistributeWithConstraints` at `:731`). Home is announced as reaching 0 when the separator actually stops at, say, 20.
- **LOW** `:85-94` — no `aria-valuetext` ("Sidebar 30 percent" reads better than "30").
- **LOW** `split-gutter.ts:8-10` — `[twSplitGutter]` is a behaviour-free marker while the container unconditionally renders its own `role="separator"` divs (`split.ts:84-103`), so a projected "custom gutter" appears alongside the real one with no ARIA relationship.

**Tree**
- `tree/tree.ts:204-211` — `<cdk-tree role="tree">` never receives **`aria-multiselectable="true"`** even when `selection.mode === 'multiple'`. AT reports a single-select tree while items expose `aria-checked="mixed"` (`:217-218`, `:430-447`).
- CDK supplies `role="treeitem"`, `aria-expanded`, `aria-level`, `aria-posinset`, `aria-setsize` reactively, and `[isExpandable]` is correctly bound from `hasChildren` (`:216`) — without which `aria-expanded` would never render. Flat rendering with level/setsize/posinset and no `role="group"` containers is ARIA-conformant; **no finding** there.

**Listbox required-children — three sites, same shape**
- `command-palette/command-palette-overlay.html:25`, `:29` — the empty state is a plain `<div>` as a direct child of `role="listbox"` (`html:22`).
- `select/select-overlay.ts:73` — same; the "No results" message is outside the listbox's exposed structure.
- `combobox/combobox-overlay.ts:69-71` — the empty-state `<li>` is a non-option child of `<ul role="listbox">` (`:57-59`).
- Counter-example worth preserving: **`transfer` handles this correctly** — the empty panel renders a plain div *instead of* an empty listbox (`transfer.ts:428-431`, `:473-475`).

**Empty `role="group"` — two sites**
- `select/select-overlay.ts:76-82` and `combobox/combobox-overlay.ts:76-87` render `role="group"` containing only the header text, while the option rows are emitted as **siblings** because `renderedRows` flattens group-label and option into one list (`select.ts:650-664`, `combobox.ts:577-591`). Every group owns nothing; grouping is announced with no members.

**Popover**
- `popover/popover.ts:315-316` — `aria-haspopup="dialog"` and `aria-expanded` are bound unconditionally on whatever host carries `[twPopover]`, and the directive adds no `role` and no `tabindex`. On a `<div>`/`<span>` trigger both attributes land on `role="generic"`, where ARIA 1.2 forbids them, and the `(click)` at `:318` is not keyboard-activatable.
- `popover/popover.ts:245-248` — `role="dialog"` with no enforced accessible name; `aria-label` is optional and `aria-labelledby` only populates if `twPopoverTitle` is projected. `select.ts:912-924` emits a dev-mode warning in the same situation — that is the fix shape.
- **CLEAN and better than select:** `popover.ts:317` binds `aria-controls` to `overlayComponentId()`, set on open (`:515`) and **nulled on close** (`:556`). No dangling reference.

**Others**
- `timeline/timeline.ts:528` + `:546-592` — host is `role="list"` but in horizontal orientation its direct children are two `<button>`s plus a generic scroll `<div>`; the `role="listitem"` elements (`:853`) sit two levels down. Fails `aria-required-children`. Move `role="list"` to the scroll viewport.
- `timeline/timeline.ts:530-531` — `aria-orientation` on `role="list"`; not a global attribute and not supported on `list`. Fails `aria-allowed-attr`.
- `separator/separator.ts:77` + `:83-85` — `role="separator"` has **Children Presentational: True** in ARIA 1.2, so the projected label (the "OR" divider pattern) is pruned from the a11y tree and never announced. Either mirror it into `aria-label` or drop the role when labelled content is projected.
- `code-block/code-block.ts:129-132` — `aria-label` on a bare `<pre>`, which maps to `generic` where `aria-label` is prohibited and dropped. The focusable scroll region therefore has no accessible name despite the effort at `:196-199`. `role="group"` fixes it without the landmark-duplication problem the comment at `:88-96` is correctly avoiding.
- `carousel/carousel.ts:363-364` + `:402` — a `disabled` slide gets only `opacity-50 cursor-not-allowed`; no `aria-disabled`, no `aria-hidden`. AT sees a normal slide that navigation silently refuses to land on.
- `tags-input/tags-input.ts:169-194` — the chip strip has no list semantics: host is `role="group"` (`:214`), each chip is a bare `<span twBadge>` with no `listitem`/`row`/`option` role, and only the remove button is focusable. A SR user hears "Remove design, button" with no set size and no position. Either the APG `list`/`listitem` shape or Material's `MatChipGrid` `row`/`gridcell` shape restores it.
- `segmented-control/segmented-control.ts:221` — `role="radiogroup"` with no `aria-label`/`aria-labelledby` input and no dev-mode accessible-name warning. Contrast `radio.ts:673-679`, which warns.
- `flip-card/flip-card.ts:108-120`, `:186-188` — host is `role="button"` with arbitrary projected faces; any focusable descendant (a CTA on the back face — the canonical use) creates a nested interactive control and the button's name-from-content swallows the link text. `item.ts:140` documents exactly this hazard; flip-card has no equivalent warning.
- `button/button.ts:147-154` — the host block never manages `type`, so `<button twButton>` inside a `<form>` inherits `type="submit"` and any non-submit button silently submits.
- **LOW** `switch/switch.ts:309-313` and `radio/radio.ts:371-375` — `aria-describedby` unconditionally references a description span that is `empty:hidden`, yielding a reference resolving to an empty element. `checkbox.ts:419-422` guards this correctly.

**Date / time**
- `date-picker/date-picker-overlay.ts:84` and `date-range-picker/date-range-picker-overlay.ts:140` — `aria-label` / `[attr.aria-label]="calendarAriaLabel()"` is placed on the `<tw-calendar>` host, which has `class: 'block'` and **no role** (`calendar.ts:147`). `aria-label` on a roleless generic is dropped, so `calendarAriaLabel()` is a silently dead consumer-facing API; the real name comes from the inner `role="group"` label.
- `date-picker/date-picker-overlay.ts:51-67` — the preset panel is `role="listbox"` with `role="option"` `<button>`s and **no roving tabindex, no `aria-activedescendant`, no arrow-key handling** — every option is its own tab stop inside a listbox. The sibling component already does it right: `date-range-picker-overlay.ts:53-63` (`DateRangePresetOptionDirective`) + `:406-431` (`onPresetListKeydown`) + `:396-402` (roving `tabindex` effect). Port that across.
- `time-picker/time-picker.ts:424-445` — the AM/PM `role="radiogroup"` has two natively-focusable buttons with no `tabindex` management, so it is **two tab stops** where APG requires one.
- **LOW** `date-range-picker/date-range-picker.ts:293` — `role="combobox"` on a `<button>` with `aria-haspopup="dialog"` is valid ARIA 1.2 but deviates from APG's Date Picker Dialog, which uses a plain button.
- **CLEAN** — time-picker spinbuttons: `role="spinbutton"` with `aria-valuemin`/`max`/`now`/`valuetext` and a per-field `aria-label` on all three fields (`:314-319`, `:342-347`, `:371-376`), wrapped in a labelled `role="group"` (`:302`). `aria-valuetext` updates live and appends AM/PM in 12h mode (`:667-673`); `aria-valuenow` correctly goes null on an empty field.

**Data / navigation / status**
- `accordion/accordion.ts:72-74` — `hostRole` is deliberately overridden to `null` at `:103` (correct — APG accordions carry no container role), but `aria-multiselectable` (`:72`) and `aria-label`/`aria-labelledby` (`:73-74`) are still emitted on `<tw-accordion>`, i.e. on `role="generic"`, where `aria-label`/`aria-labelledby` are **prohibited** and `aria-multiselectable` is not allowed. A consumer who sets `[aria-label]` gets **nothing**, silently. **Do not "fix" this by restoring a role** — `aria-multiselectable` would be invalid on `role="group"` too and the APG accordion pattern does not use it; delete the attribute and forward the name to a consumer-supplied heading. **Not in the tracked backlog.**
- `accordion` — **no APG heading structure and no guidance to supply one.** APG requires each accordion header button to sit inside an `<h3>` (or appropriate level). The component cannot wrap the consumer's element (the trigger is a directive, `collapsible.ts:158-173`), but there is no heading in the demo (`projects/demo/src/app/routes/accordion/examples/accordion-examples.component.ts:33,37,56,60,64,75,79,83,94,98` are all bare `<button twCollapsibleTrigger>`) and no mention in the JSDoc. Screen-reader users lose heading-list navigation across panels. Fix is docs + demo, not emitted markup. Related **LOW**: `collapsible/collapsible.meta.ts` claims accordion provides "heading conventions out of the box" — it does not.
- `table/table.html:37` vs `sort/sort-header.ts:136` — **composition hazard: two conflicting `aria-sort` values on one header.** The generated `<th>` carries `aria-sort`; a consumer placing a `tw-sort-header` inside that header template gets a **second** one on the inner element. They also disagree when unsorted: `table.ts:757-767` returns `null` (attribute omitted) while `sort-header.ts:218-223` returns `'none'`.
- `table/table.html:133` — `aria-selected` on `<tr>`. ARIA 1.2 does permit it on `role="row"`, so this is not a spec violation and I did not verify whether axe flags it — **treat the tool question as open**. The semantic defect is real regardless: the table declares no selection model (no `grid`, no `aria-multiselectable`), so AT has nothing to interpret it against, and the per-row `<tw-checkbox>` already conveys the state via `aria-checked` (`table.html:113-118`).
- `breadcrumbs/breadcrumbs.ts:315` — `<span [class]="disabledClasses()" aria-disabled="true">`. `aria-disabled` is not global and is not allowed on `role="generic"`, so it is dropped and `opacity-50 cursor-not-allowed` (`:84`) becomes the **only** cue — the one place in the library where the colour-only concern (SC 1.4.1) actually bites. Since a disabled crumb is not interactive at all, the clean fix is to stop rendering it as link-like.
- `alert/alert.ts:200` + `:154` — `politeness` defaults to `'polite'`, which `computedRole()` (`:213-222`) maps to `role="status"` on the host. A **statically rendered** alert — the documented primary use case per `alert.meta.ts` ("a status banner at the top of a form") — is therefore a permanently mounted live region: any DOM change inside it, including unrelated re-renders of projected content, re-announces. APG reserves `alert`/`status` for **dynamically inserted** messages. The `'off'` escape hatch exists and is documented (`:193-199`), but the default is the chatty one. Flip the default, or key the role off "was this inserted after first paint".
- `toast/toast-component.ts:139` + `toast-container.ts:364-366` — **`ariaLabel` silently suppresses the message.** It becomes the host's accessible name *and* `resolveAnnouncementText` prefers it over the content, so a consumer setting `ariaLabel="Notification"` (expecting a region name) loses the actual message from both the accessible name — with `aria-atomic="true"` — and the announcement. The JSDoc at `:214` does not warn about the override direction.
- **LOW** `paginator/paginator.html:216-221` — the ellipsis `<span [attr.aria-label]>` wraps a single `aria-hidden` child; `aria-label` is prohibited on `generic`, so the element contributes nothing and the `ellipsis: 'More pages'` label (`:148`) is dead code implying coverage that does not exist. No real loss (the ellipsis is decorative and `pointer-events-none`), but delete the label or move it somewhere nameable.
- **LOW** `table/table.ts:757-767` — a sortable-but-unsorted column emits **no** `aria-sort` at all. Defensible (ARIA's default is `none`), but AT then cannot distinguish sortable from non-sortable columns. `aria-sort="none"` on every sortable header is friendlier and resolves the disagreement with `sort-header.ts:218-223`.
- **LOW** `sort/sort.meta.ts` — the summary claims the header turns "any element" into a trigger "with correct `aria-sort`". It is only correct on a `<th>`.

### Already tracked (unenforced, not novel)

- **Dangling `aria-controls` after the panel is destroyed** — `select.ts:368`, `stepper.html:23` (only the selected step's panel is ever in the DOM), plus accordion / collapsible / date-picker / date-range-picker. **Extension worth adding to the tracker:** `tabs.html:41` vs `:95` — `shouldRenderPanel()` (`tabs.ts:357-364`) never renders a `lazy` tab's panel until first activation, so **every un-visited lazy tab ships a dangling `aria-controls` from first paint**, not just after a close.
- **The `combobox` entry in `ARIA_CONTROLS_BACKLOG` appears STALE** — `combobox.ts:265` binds `[attr.aria-controls]="open() ? listboxId : null"` and `:266` gates `aria-activedescendant` identically. Worth re-running that assertion; it may already pass.
- **Nested interactive** — `tabs.html:34`/`:61` (close `<button>` inside `<div role="tab">`), `select.ts:395-396` (`<span role="button">` inside `<button role="combobox">`). Note the *keyboard-inoperability* of the select clear control (**H7**) is a separate, novel defect not covered by the nested-interactive item.
- **`aria-sort` on a non-columnheader element** (sort, table) — **reproduces, and the root cause is the API contract, not a bug.** `sort/sort-header.ts:137` puts `aria-sort` on the sort-header *host*, and the JSDoc at `:120` explicitly says that host may be a `<div>` or `<button>`. On a `<th>` this is **correct** — `aria-sort` on the columnheader with the button inside is exactly the APG shape (`sort-examples.component.ts:205` does this). On a `<span>`/`<div>` it is an `aria-allowed-attr` violation, and the demo mounts sort headers on `<span>` at `projects/demo/src/app/routes/sort/examples/sort-examples.component.ts:80,109,110,111,136,142,165,166,167`. The fix is to constrain the selector or warn in dev mode, not to move the attribute.
- **`ARIA_CONTROLS_BACKLOG` for date-picker / date-range-picker** — reproduces: `date-picker.ts:328`/`:369` and `date-range-picker.ts:296` bind `aria-controls` to `dialogId` (`date-picker.ts:587`) unconditionally, while the dialog exists only while open. `collapsible.ts:167` is the same shape (panel destroyed by the `@if` at `:240` unless `keepAlive`), and it propagates to accordion.
- **`ACCESSIBLE_NAME_BACKLOG` for paginator / table / toast does NOT reproduce at HEAD.** The paginator's page-size `<select>` has a real `<label for>` (`paginator.html:17-29` ↔ `:38`); table checkboxes carry `[aria-label]` (`table.html:104`, `:117`); toast has no form controls at all. Those three entries look retirable — re-run the assertion before assuming otherwise.
- **`nested-interactive` for paginator and breadcrumbs does NOT reproduce at HEAD** either: the paginator's keydown wrapper (`paginator.html:70-73`) carries no role, and the breadcrumb overflow `<button>` (`breadcrumbs.ts:342`) sits in a plain `<li>`. The tracked entries appear to predate a refactor.

### Confirmed correct (negative results)

`dialog` and `sheet` (`role`, `aria-modal`, `aria-labelledby` via the CDK queue with registration *and* unregistration on destroy, `aria-describedby` — `dialog-container.ts:81-85`, `dialog-content.ts:81-89,120-128`); `tooltip` (`role="tooltip"`, `AriaDescriber` with symmetrical teardown, `aria-hidden` arrow — `:245`, `:541-583`); `menu` (roles, `aria-checked`, `aria-disabled`, containment all from CDK; panel `aria-label`/`labelledby` at `:154-155`); `tabs` (`tablist`/`tab`/`tabpanel` with live `aria-selected`, `aria-controls`, `aria-labelledby`, `tabindex="0"`); `tab-nav` (**correct dual mode** — `<nav>` + `aria-current="page"` with no role override when there is no panel `:182,337-349`; full tablist semantics when there is `:334,343,355-359`); `segmented-control` and `radio` (`radiogroup`/`radio` + reactive `aria-checked`; radio has the strongest implementation in the library, with dev-mode name warnings on both group `:673-679` and item `:418-424`); `carousel` (`role="region"` + `aria-roledescription="carousel"` + dev warning `:424-427`; slides `role="group"` + `aria-roledescription="slide"` + "N of M" labels `:349-351,381-398`; hidden slides `aria-hidden` + `inert` `:352-353`; rotation control with state-correct label `:453-470,653-656`); `transfer` (dual `cdkListbox` with `aria-multiselectable`, each named by its panel title `:440,409`, host `role="group"` + dev warning `:850`); `combobox` (`role="combobox"`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, gated `aria-expanded`/`aria-controls`/`aria-activedescendant`, per-option `aria-selected`/`aria-disabled` — the strongest overlay implementation); `checkbox` (`role="checkbox"` with `aria-checked` incl. `"mixed"`, updated in the same microtask as `toggle()` via `linkedSignal` mirrors `:505-518`); `switch` (`role="switch"`, mirrored `aria-checked` `:300`); `slider` (`role="slider"` with reactive `aria-valuenow`/`min`/`max`/`valuetext`); `number-input` (`role="spinbutton"` with `aria-valuetext` falling back to `"Empty"` so a missing `aria-valuenow` is explained, `:59-64`); `file-upload` (`role="group"` + full label/describedby/required/invalid wiring, real `<ul role="list">`); `icon` (default `aria-hidden="true"`, swapping to `role="img"` + label when named — `icon.ts:232-237`); `avatar` (`<img [alt]>` defaulting to `''` with a dev warning, `role="img"` otherwise, decorative parts `aria-hidden` — `:99-130,170-178`); `spinner` (`role="status"` + `aria-live` + `sr-only` label); `skeleton` (defaults to `aria-hidden="true"`, opt-in `role="status"`); `empty-state` (`titleLevel` 1–6 input rendered through a `@switch` — **does not** hardcode a heading level); `stat` (plain `<dl>/<dt>/<dd>`, delta is `role="img"` with a composed label).

Data / nav additions: **`breadcrumbs` ARIA is fully correct** — `<nav [attr.aria-label]>` defaulting to `'Breadcrumb'` (`:294`, `:403`) + `<ol>` (`:295`) + `aria-current="page"` on the last crumb (`:313`, and `:206` on the projected-anchor path); overflow menu items are real `<a twMenuItem [href]>` (`:358`) inside a labelled `<tw-menu>` (`:351`); separators `aria-hidden` (`:324`). **`paginator` ARIA is APG-complete** — `role="navigation"` + accessible name (`:461`, `:463`, default `'Pagination'` `:136`), `aria-current="page"` on the active page (`paginator.html:235`, `:251`), and text names on the chevrons rather than glyphs (`"Previous"`, `"Next"`, `"First page"`, `"Last page"` — `:137-140`) with `"Go to page {n}"` / `"Page {n}, current page"` on page buttons (`:146-147`). **`progress-bar` handles indeterminate correctly** — `aria-valuenow` and `aria-valuetext` are explicitly nulled and `aria-busy="true"` added (`:165-167` linear, `:183-185` segmented); no hardcoded `aria-valuenow="0"`; accessible name enforced with a dev warning (`:321-338`); no `aria-live`, which is the right restraint. **`table` does not claim `role="grid"`** — there is no `role` on `<table>`, `<tr>`, `<th>` or `<td>` anywhere in `table.html`, and `table.ts:23` documents arrow-key grid navigation as out of scope for v1. Plain `<table>` semantics with `scope="col"` on every `<th>` (`table.html:39`, `:92`) is the correct, honestly-labelled choice — **there is no HIGH grid-keyboard failure here.** `table` also enforces an accessible name with a caption/`aria-label`/`aria-labelledby` dev warning (`:1205-1213`), gives the error overlay `role="alert"` (`table.html:199`) and the loading overlay `role="status" aria-live="polite"` (`:225-226`), and correctly suppresses the select-all checkbox for non-array data sources (`:98`) rather than rendering a dead control. **`toast` politeness tracks severity** — `'error'` → `role="alert"` + `aria-live="assertive"`, everything else → `role="status"` + polite (`toast-component.ts:251-258`), with the announcer resolving the same way (`toast-container.ts:359-362`) and the region carrying `role="region"` + `aria-label="Notifications"` (`:81-83`, `:160`). **`collapsible` panels** are `role="region"` + `aria-labelledby` (`:243-245`) — APG-correct.

---

## 4. Keyboard behaviour completeness

### HIGH — a required interaction is unreachable

- **HIGH (SC 2.1.1) — `select` clear control has no keyboard path.** `select.ts:397` sets `tabindex="-1"`; nothing in the file calls `.focus()` on it (grep for `clearButton|clearRef|clearEl` returns only class-name plumbing); `handleKeydown` (`:1054-1157`) has no Backspace/Delete branch, `Escape` (`:1139-1145`) only closes the panel, and the `default` branch (`:1152-1156`) routes characters to type-ahead. The element's own `(keydown)` handler (`:1039-1045`, Enter/Space → `clear()`) and its `focus-visible:` ring (`:168`) are unreachable dead code — strong evidence the author intended `tabindex="0"`. `combobox.ts:1025-1028` (Escape-when-closed → `clear()`) is the fix shape.
- **HIGH (SC 2.1.1) — `segmented-control` does not handle Space.** `:293-320` handles arrows and Home/End and then `default: return`s. The host is `<tw-segmented-option>`, not a native button, so there is no native activation either. Reachable case: nothing selected → the first enabled option is the tab stop → user Tabs in, presses Space, nothing happens. APG radiogroup requires Space to check the focused radio.
- **HIGH (SC 2.1.1) — `segmented-control` strands the whole radiogroup.** `:176` tests `this.parent?.activeValue() === null` strictly. With `undefined`, `''`, or any non-matching string — including `writeValue(undefined)` from a form — `isFocusable()` is false for **every** option and the radiogroup leaves the tab order entirely. `radio.ts:355` handles `null || undefined` and is the better precedent (it retains a narrower version of the same hole for non-matching non-null values).
- **HIGH (SC 2.1.1) — `tabs` strands the whole tablist.** `tabs.ts:212` gives `tabindex="0"` only to the active trigger, and `initializeActiveTab` (`:572-580`) only defaults when `activeValue` is falsy. A `value` matching no tab leaves no tabbable trigger.
- **HIGH (SC 2.1.1) — `command-palette` with `autoFocus="false"` is entirely keyboard-inoperable.** `:675-677` is the only thing that moves focus into the overlay, and every key binding is registered on `overlayRef.keydownEvents()` (`:768-772`), which fires only for events targeted inside the overlay — while the panel asserts `aria-modal="true"` (`command-palette-overlay.html:1`).
- **HIGH (SC 2.1.1) — `date-range-picker` clear control has no keyboard path.** `date-range-picker.ts:342` — `tabindex="-1"` with a `(click)`-only handler and no `(keydown)` at all; the trigger is a `<button>` (not typable), `onTriggerKeydown` (`:996-1014`) handles only Alt+Arrow and Escape, no host keydown binding exists (`:357-359` is `[class]` only), and `showActions` defaults to `false` so the overlay ships no Clear button either. This is strictly worse than the select case (H7), which at least has an unreachable handler. By contrast `date-picker.ts:346` and `time-picker.ts:451` use the same `tabindex="-1"` **survivably**, because select-all + Delete in the text field clears the value — those are **LOW**, not failures.
- **HIGH (SC 2.1.1) — `table` row-click is mouse-only.** `table/table.html:132`: the `<tr>` carries `(click)="handleRowClick(row, i, $event)"` with **no `tabindex`, no `role="button"`, no `(keydown)`, and no focus indicator**. `handleRowClick` (`table.ts:1244-1255`) is always wired and emits the public `rowClicked` output (`:888`), and the library ships no alternative affordance for that API. There is not even a `cursor-pointer` cue — only `[&>tbody>tr:hover]:bg-*` (`table.ts:372,376,381`), so mouse users get a hover shift with no keyboard equivalent. Either give the row `tabindex="0"` + `role="button"` + Enter/Space + a ring, or drop the row handler and require a real button in a cell.
- **HIGH (SC 2.2.1 Timing Adjustable, with SC 2.1.1 in support) — `toast` auto-dismisses interactive content in 5 s that a keyboard user cannot reach in time.** `toast-config.ts:67` defaults `duration` to `5000`. The action button (`toast-container.ts:121`, `:140`) and dismiss button (`toast-component.ts:183-192`) live in a CDK **global** overlay (`toast-renderer.ts:103-108`: `overlay.create()` with a global position strategy, `hasBackdrop: false`) with **no `cdkTrapFocus`, no `autoFocus`, no `restoreFocus`, and no `focus()` call anywhere in the four toast files** — verified by grep. Per CDK's container placement they sit at the end of the document tab order, so reaching them means tabbing past the entire page while a 5 s timer runs. `pauseOnInteraction` (`toast-config.ts:102`) pauses only on `focusin`/`pointerenter` (`toast-container.ts:258-268`), which cannot help someone who has not arrived yet. There is **no F6 or other hotkey** to jump to the `role="region"` container. The time limit cannot be turned off, adjusted, or extended by the user.
  Two sub-findings on the same code: (a) `toast-container.ts:88-90` **documents behaviour that does not exist** — *"the projected `<tw-toast>` is the focusable affordance"* — but nothing sets `tabindex` on `tw-toast` (full host block at `toast-component.ts:134-141`); that false comment is plausibly how the gap survived review. (b) Escape **is** implemented (`toast-container.ts:104`) but fires only on a bubbling keydown from inside the wrapper, i.e. only once focus is already on the action or dismiss button — there is no document-level Escape.
- **HIGH (SC 2.1.1) — `calendar`'s roving cursor can strand the grid with zero tab stops.** `calendar-view-base.ts:96` declares `focusedCellValue`; `:215` (`focusCell`) is its **only** writer, and grep across `calendar/*.ts` confirms **nothing ever resets it to `null`**. `isActiveCell()` (`:204-208`) short-circuits on it and ignores `activeDate` entirely. Any navigation that re-renders a different period *without* calling `focusCell()` leaves it pointing at a `compareValue` no rendered cell has, so `isActiveCell()` returns false for all 42 cells and **the grid has no tabbable cell at all**. Paths that change the period without `focusCell()`: `calendar.ts:1234`/`:1258` (header prev/next), `:1282`/`:1416`/`:1426` (drill-up / drill-down), and `multi-year-view.ts:146-157` (`pageUp`/`pageDown`, where `compareValue` *is* the year so a ±24-year shift guarantees no match). `year-view.ts:140-145` has the same omission but is masked because its `compareValue` is the 0–11 month index, which always exists on the new page — so this is a pattern, not a one-off; contrast `month-view.ts:218-225`, which calls it in the shared tail.
  Repro: open the picker → one ArrowRight → click next-month → Tab no longer reaches any day cell. Scope: the overlay is destroyed on close so the stale value does not survive an open/close cycle, but an inline `<tw-calendar>` keeps it for the component's lifetime.
  Two more symptoms of the same root cause: **MEDIUM** `calendar.ts:1101-1106` — `focusDate(date)` → `focusActiveCell()` → `calendar-view-base.ts:221` prefers the *stale* `focusedCellValue()` over the date just passed in, so the public API focuses the wrong cell after any arrow navigation. **MEDIUM** `calendar.ts:1443-1456` with `month-view.ts:223` — in 2-month mode (the **date-range-picker default**), a cross-grid arrow move has the origin view run `focusCell(compareValue)` before the parent redirects to the sibling grid, leaving **two `tabindex="0"` cells for the same date** and two competing `afterEveryRender` focus attempts. (Two tab stops at rest, one per `role="grid"`, is fine and matches Material — that part is not a finding.)
- **HIGH (SC 2.1.1) — `calendar` uses the native `disabled` attribute on day cells.** `calendar-cell.ts:141` — `[disabled]="!cell().enabled"`. A natively disabled button ignores `tabindex` and `.focus()` is a no-op, so `focusButton()` (`:269-271`) silently fails. Two consequences: (a) `_activeDate` initialises to `startAt() ?? today()` with **no clamp** to min/max (`calendar.ts:528-530`), so setting `minDate` to next month renders a fully-disabled current month whose single `tabindex="0"` cell is disabled — the grid has no tab stop and `focusCalendar()` (`date-picker-overlay.ts:288`) does nothing on open; (b) arrow-navigating onto a disabled date moves `tabindex="0"` onto it while DOM focus stays on the previous cell (now `-1`), so the next Tab exits the grid. APG's date-picker grid specifies `aria-disabled` **precisely so keyboard users can traverse disabled dates** — and `aria-disabled` is already correctly present at `:138`. The native `disabled` attribute is the whole defect; removing it fixes both.

### MEDIUM

- `popover/popover.ts:727` — `focusTrap.focusInitialElementWhenReady()`. With no tabbable element inside (a text-only popover) CDK falls back to `focusFirstTabbableElement()`, which returns `false`, leaving focus on the trigger — *outside* a subtree declaring `aria-modal="true"` (`:246`). AT is constrained to a dialog the user is not in.
- `tabs/tabs.ts:224-226` + `tabs.html:45`, and `tab-nav/tab-nav.ts:356` + `:367-369` — the `FocusKeyManager` skips disabled triggers and `pointer-events-none` blocks the pointer, so disabled tabs are unreachable by **both** paths. APG for Tabs says a disabled tab should stay focusable via `aria-disabled` so the user can discover why it is unavailable. (`aria-disabled` *is* set, so this is not a 1.4.1 colour-only issue — the defect is discoverability.)
- `tree/tree.ts:219` — `(activation)` is CDK's **keyboard-only** channel (`TreeKeyManager` fires it on Enter); the node's `(click)` handler only calls `_setActiveItem()` and never `activate()`. So `toggleSelection` runs on Enter but **not on a row click**, despite the row advertising `cursor-pointer` (`:129`) and rendering a selected background (`:142`). Not a WCAG failure (keyboard is operable) but a pointer/keyboard parity defect and a misleading affordance.
- `carousel/carousel.ts:1530`/`:1586` — `[attr.disabled]` lands on the native `<button>` host the moment the boundary is reached, so the button the user just activated becomes `disabled` **while focused** and focus drops to `<body>`. `transfer.ts:929-961` documents and solves exactly this; prefer `aria-disabled` + click-swallow (the directive already guards in `_onClick` at `:1565-1569`).
- `timeline/timeline.ts:449-452` + `:665-678` — `HORIZONTAL_VIEWPORT_CLASSES` is `overflow-x-auto tw-scrollbar-none` with **no `tabindex="0"`**. Keyboard access to the overflow depends entirely on the chevrons; with `scrollControls="never"` both chevrons are `hidden` + `disabled`, leaving a scrollable region with no keyboard path to the clipped events (SC 2.1.1) and no visual overflow cue either. `code-block`'s `<pre>` (`:130`) shows the fix.
- `flip-card/flip-card.ts:108-120` — see §3; the nested-focusable hazard is as much a keyboard-order problem as an ARIA one.
- `time-picker/time-picker.ts:980-1024` — **PageUp/PageDown are not handled at all**, though APG requires them for the spinbutton large step. The large step is bound to Shift+Arrow instead (`:1088`, `shift ? 2 : 1`), which is non-standard and not documented in the field's `aria-*`.
- `time-picker/time-picker.ts:1036-1042` — `onMeridiemKeydown` toggles AM↔PM on ArrowUp/Down/Space/Enter but never **moves focus**, and ignores ArrowLeft/ArrowRight entirely — both required for a `radiogroup`.
- `date-picker/date-picker.ts:306-312` + `:319`/`:323` — in `hasCustomTrigger()` mode the combobox input becomes `sr-only` **and** `tabindex="-1"`, and the projected trigger sits inside a roleless `div class="contents"` with click/keydown handlers plus an eslint-disable for `interactive-supports-focus` at `:305`. If a consumer projects a non-focusable element there is **no keyboard path to open**, and `aria-expanded`/`aria-controls` live only on the hidden, unreachable input.
- `collapsible/collapsible.ts:91` + `:169` — a disabled trigger gets `opacity-50 pointer-events-none` **and** `tabindex="-1"`. `aria-disabled="true"` is correctly present (`:168`), but a keyboard user can never land on the trigger to hear it. Keep it focusable and suppress activation in the handler instead.
- `collapsible/collapsible.ts:438-469` and `:511-526` — normal toggling is **safe** (the trigger is projected *outside* the panel, `:239-240`, so it survives the `@if` and keeps focus), but the group's value-sync effect and `toggleItem`'s sibling-close loop destroy other panels with no focus check. Focus sitting on a control inside a panel closed that way falls to `<body>`.
- `sort/sort-header.ts:103` + `sort-header.html:4-5` — a disabled sort header nulls **both** `role="button"` and `tabindex`, and the host gets `pointer-events-none`. The `aria-disabled="true"` at `sort-header.ts:137` lands on the *host* (`<th>`/`<span>`), not on the control, so a focus-mode user cannot encounter the disabled control at all. Keep `role="button"` + `tabindex="0"` + `aria-disabled` on the container and no-op the handlers — which already guard at `:286` and `:292`. Related **LOW** `:188-197`: `AriaDescriber.describe()` is applied to the container even when disabled, at which point it has no role for the description to attach to.
- `paginator/paginator.html:85`, `:154`, `:276`, `:344` — in `linkFactory` (anchor) mode, disabled first/prev/next/last get `tabindex="-1"` alongside `aria-disabled="true"`, plus `aria-disabled:pointer-events-none` (`paginator.ts:270`). A keyboard user at page 1 can neither reach nor hear "Previous, dimmed". The native-`<button>` path (`:116`, `:185`, `:307`, `:375`) uses a real `[disabled]`, which is programmatically determinable and therefore fine.
- `toast` dismissal loses focus to `<body>` — `toast-component.ts:187` emits `dismissed`, `toast-container.ts:116` calls `ref._dismissWith('manual')`, the entry leaves `orderedEntries()` (`:194-197`) and the focused button is destroyed with no `FocusMonitor`, no stored previously-focused element and no restore anywhere in the four toast files. Unconditional — independent of the 5 s timer.
- `alert/alert.ts:169-179`, `:206` — dismissal is neither announced nor focus-managed, and the component gives **no** focus-restoration hook and no JSDoc guidance, so the straightforward consumer implementation (`@if (!hidden())`) destroys the focused button and drops focus to `<body>`. Document a target, or expose a `dismissTarget` input.
- **LOW** `breadcrumbs/breadcrumbs.ts:364-370` — the `@defer @placeholder` overflow button is a functional no-op: it renders `<button aria-label="Show more breadcrumbs">` with **no `twMenuTrigger`**, so it is tabbable and announces a menu affordance while doing nothing until the deferred chunk resolves. Narrow window given `on viewport` + `prefetch on idle`, but `disabled` or `aria-busy` on the placeholder would close it.
- **LOW** `paginator/paginator.ts:137-138` — `"Previous"` / `"Next"` vs APG's preferred `"Previous page"` / `"Next page"`; note `first`/`last` already say "page".
- **LOW** `year-view.ts:109-131` / `multi-year-view.ts:114-137` — arrow keys clamp silently at page edges instead of paging, unlike the day grid which flows across months. These sub-views are not part of the APG dialog pattern.

### LOW

- `number-input/number-input.ts:246-275` — **PageUp/PageDown not handled** (`:273` routes them to native). Optional in the APG Spinbutton pattern, hence LOW. ArrowUp/Down, Home (when `min` defined), End (when `max` defined) and a non-`preventDefault`ed Enter are all present.
- `carousel/carousel.ts:1358-1367` — ArrowUp/ArrowDown navigate and `preventDefault()` **regardless of orientation**, so in a horizontal carousel a user who Tabs into the viewport and presses Down advances the carousel instead of scrolling the page.
- `tab-nav/tab-nav.ts:355-359` — same "no active link ⇒ no tab stop" hole as tabs, lower severity because router state normally guarantees a match.
- `tabs/tabs.ts:384-386` — `LiveAnnouncer` fires on *every* arrow keypress under automatic activation. Verbose but APG-consistent.

### CLEAN — full APG key set verified present

| Pattern | Component | Evidence |
|---|---|---|
| Modal dialog | dialog, sheet | Escape (`dialog-ref.ts:127` with `!hasModifierKey`; `sheet-ref.ts:135-137` gated on both `closeOnEscape` and `disableClose`), CDK focus trap + Tab cycling, `autoFocus: 'first-tabbable'` |
| Menu | menu | CDK `FocusKeyManager` built `.withWrap().withTypeAhead().withHomeAndEnd()` (`menu.mjs:1260`) — arrows, Home, End, type-ahead; Escape / Enter / Space / submenu arrows from `CdkMenu`/`CdkMenuTrigger` |
| Combobox (select-only) | select | Alt+↓/↑ (`:1059-1064`), Enter, Space, ↑/↓, Home, End, PageUp/PageDown, Escape, Tab, 400 ms type-ahead (`:1153-1182`). Home/End suppression while searching (`:1113-1126`) is correct, not a gap |
| Combobox (editable) | combobox | Alt+↓/↑, ↑/↓ with open-and-position, Home/End gated on empty input or Alt (correct for an editable combobox), Enter with form-submit passthrough, Escape revert-then-close and clear-when-closed, Tab-commits, Backspace guard, IME composition (`:918-1046`) |
| Tabs | tabs, tab-nav | Arrows (H/V + RTL), Home/End, wrap, Enter/Space, Delete on closable (`tabs.ts:449-466`); tab-nav Space activates the anchor (`:395-398`) |
| Radiogroup | radio | ↑/↓/←/→ with wrapping (`:747-759`), Home/End (`:729-734`), Space (`:449-455`); Enter deliberately omitted for native parity, documented at `:448` |
| Tree | tree | CDK `TreeKeyManager`: ↑/↓, → expand-then-descend / ← collapse-then-ascend (RTL-aware), Home/End, Enter, `*` expand-siblings, **and type-ahead** (`Typeahead`, `_tree-key-manager-chunk.mjs:174-179`) — the binding APG mandates for trees and the one most often missing |
| Dual listbox | transfer | CDK listbox: arrows, Home/End, Space/Enter toggle, **Ctrl+A** (`listbox.mjs:476-480`), **Shift+Arrow** range extend (`:513-518`), Ctrl+Shift+Home/End, wrap, type-ahead with explicit labels (`transfer.ts:447`) |
| Window splitter | split | ←/→ (horizontal, RTL-aware), ↑/↓ (vertical), Home/End saturating to min/max, PageUp/PageDown large step, Enter/Space collapse-toggle with `reset()` fallback (`:656-724`). **Every APG-required binding present.** |
| Slider | slider | →/↑ (+step), ←/↓ (−step), **PageUp/PageDown** (`:887-892`, 10 % of range — the commonly-omitted one is present), Home, End; RTL inverted correctly; both range thumbs independently reachable |
| Tags-input | tags-input | Enter and `,` commit (Enter falls through to form submit when empty), **Backspace on empty input** jumps to the last chip, ←/→ traverse chips, Home/End, Delete/Backspace remove the focused chip, Escape returns to the input (`:585-660`). Chips are genuinely keyboard-reachable — **no SC 2.1.1 finding.** |
| Carousel | carousel | ←/→ (RTL-aware), ↑/↓, Home, End, PageUp/PageDown on the focusable viewport (`:1336-1394`) |
| Stepper | stepper | Delegated to `CdkStepper._onKeydown` (`:508-511`): orientation-aware arrows, Home/End, Enter/Space. Roving tabindex is re-published into a signal after every keypress (`:491-511`) — the `_getFocusIndex()`-goes-stale trap is handled |
| Checkbox / switch | checkbox, switch | Space only, `preventDefault()`ed; Enter correctly not handled (native parity) — `checkbox.ts:521-527`, `switch.ts:367-373` |
| File-upload | file-upload | **Not drag-and-drop-only.** The inner `<button #trigger twButton>` (`file-upload.html:55-67`) activates natively → `open()` → clicks the hidden native input. Keyboard users reach the OS picker normally |
| Command palette | command-palette | Escape, ↓, ↑, Home, End, Enter (`:775-809`); Tab deliberately left to the focus trap (documented `:803-807`); disabled options skipped (`:811-823`) |
| Presentational group | button, item, code-block, flip-card, badge | Every `(click)` is on a native `<button>` or on a host that also binds `(keydown)` Enter/Space with a `tabindex`. No `(click)`-on-`div`/`span` without keyboard support anywhere |
| **Date grid** | calendar | **Complete against the APG required set**, including the binding most often missing: ArrowLeft/Right (±1 day), ArrowUp/Down (±1 week), Home/End (first/last day of the *row*, first-day-of-week aware), PageUp/PageDown (±1 month), and **Shift+PageUp / Shift+PageDown (±1 year)** at `month-view.ts:207-214`. Enter/Space at `calendar-cell.ts:253-257`; key→direction mapping at `:237-250` with `shiftKey` forwarded. Escape, focus restoration and the focus trap are all clean: overlay-level Escape via `coordinator.escape$()` (`date-picker.ts:1267`, `date-range-picker.ts:1208`) so it fires while focus is on a day cell inside the portal, trigger-level handlers at `date-picker.ts:1051/1091/1115` and `date-range-picker.ts:1010`, focus returned to the trigger on close (`date-picker.ts:1302` with a `returnFocusTo ?? resolveFocusTarget()` fallback chain; `date-range-picker.ts:1240`), and a CDK `FocusTrap` around the panel paired with `aria-modal="true"` (`core/overlay/picker-overlay-coordinator.ts:310-313`). **No keyboard trap.** The two calendar HIGHs above are roving-cursor and disabled-attribute defects, not missing bindings. |
| Time spinbutton | time-picker | ArrowUp/Down, caret-aware ArrowLeft/Right segment movement (`:993-1004`, `moveFocus` `:1222`), Home/End → field min/max (`:1005-1014`), digit auto-advance (`:1072-1080`), Backspace/Delete delegated to the native input (`:980-1024`). Only PageUp/PageDown missing — see MEDIUM |
| Disclosure / accordion | collapsible, accordion | Enter/Space with `preventDefault()` (`collapsible.ts:201-206`); accordion adds a `FocusKeyManager` built `.withWrap().withHomeAndEnd().withVerticalOrientation().withTypeAhead()` (`:478-482`) relayed via `onTriggerKeydown` (`:541-555`) with an `event.target`-based active-index resync (`:547-552`). ArrowUp/Down ✓, Home/End ✓ |
| Sort header | sort | Enter, Space with `preventDefault()` (`sort-header.ts:291-297`); `AriaDescriber` supplies "Sort" as a description, reactively re-tagged (`:188-197`) and cleaned up on destroy (`:271-280`) |
| Paginator | paginator | Every control is a native `<button>` or `<a href>` in the tab order, **plus** ArrowLeft/Right and Home/End via `FocusKeyManager().withHorizontalOrientation('ltr').withHomeAndEnd()` (`:843-845`), deliberately **without** `.withWrap()` (documented `:831-833`), with the active index resynced from `event.target` (`:915-930`) |

### Roving tabindex and focus restoration

**Roving tabindex — exactly one tab stop per composite:** verified for tabs (`tabs.ts:212`), tab-nav (`:355-359`), segmented-control (`:172-182`), radio (`:350-362`), stepper (`stepper.html:18`), menu (CDK), tree (CDK `makeFocusable()`), transfer (CDK, two listboxes = two stops, correct for the dual-listbox pattern), tags-input (`:176`, `:199`). Split correctly gives **each** separator its own `tabindex="0"` — splitters are not a composite widget with roving focus. The three stranding bugs above (H13/H14/H15 and the tab-nav LOW) are all failures of the *fallback* branch, not of the roving mechanism itself.

**Focus restoration after overlay close — CLEAN across all six overlays:** `dialog/dialog-ref.ts:283` (+ `restoreFocus: true` default, `dialog-config.ts:65`), `sheet/sheet-ref.ts:283`, `popover/popover.ts:529-543` (with a deliberate "consumer moved focus elsewhere" guard), `command-palette/command-palette.ts:691`, `select/select.ts:1326`; combobox is N/A because DOM focus never leaves the input. `transfer.ts:929-961` is the reference implementation for the harder case — moving focus to the destination listbox *before* the source button self-disables. `file-upload.ts:604-615` handles focus after removing a file.

---

## 5. Live regions and announcements

### Implemented well (reference implementations worth copying)

| Component | Behaviour | `file:line` |
|---|---|---|
| command-palette | **Debounced (200 ms) polite result-count** on every query change + an open announcement. Not over-chatty: the query effect deliberately does not track `isAttached`, so opening does not double-announce | `:594-608`, `:678-681` |
| combobox | Debounced (200 ms) result count, open-time suggestion count, selection confirmation; timer cleared on close and destroy | `:811-829`, `:1249-1252`, `:1211`, `:1262`, `:850` |
| tags-input | Announces add, remove, bulk clear, and max-reached (`assertive`, with an explicit 500 ms debounce) | `:539`, `:566`, `:512`, `:794-797` |
| transfer | Move result: "{count} items moved to {target}", polite | `:976-979` |
| tabs / tab-nav | "«label» tab, N of M" on selection; tab-nav guards the initial pass and no-op repeats | `tabs.ts:384-386`, `tab-nav.ts:219-231` |
| stepper | "«label», step N of M" on `selectionChange` | `:410-412` |
| code-block | "Copied to clipboard" | `:218` |
| toast | `LiveAnnouncer` with severity-derived politeness, re-announcing on `update()` | `toast-container.ts:206-215` |
| spinner / skeleton / stat | `role="status"` + `aria-live` + `sr-only` label; skeleton defaults to `aria-hidden` and is opt-in | `spinner.ts:80-81`, `skeleton.ts:75-88`, `stat.ts:386-387` |
| **calendar** | The most thorough in the library: month/year on header navigation, view switches, range start, committed selection with mode branching (including range length), and **rejected** commits — all routed through `LiveAnnouncer` with **no `aria-live` markup anywhere in the group**, which is the right primitive. Every message is gated on `intl.skipAnnouncement` (`calendar-intl.ts:195`) so consumers can silence them | `calendar.ts:1747-1796`, called from `:1254`, `:1278`, `:1291`, `:1422`, `:1432` |
| paginator | `"Page {page} of {totalPages}"`, polite | `paginator.ts:960-968` |
| table | Row-count and loading transitions | `table.ts:1222-1248` |

**Correctly silent, deliberately:** calendar does **not** announce arrow-key movement within the grid, because each cell's own `aria-label` is `dateStyle: 'full'` (`month-view.ts:126`) — focus movement already speaks the full month and year. That is a considered decision, not a gap.

**Correctly absent (do not "fix" these):** slider (value changes are announced natively from `role="slider"` + `aria-valuenow`/`aria-valuetext` — a live region would double-speak); radio and segmented-control (`aria-checked` on a focused radio is native); tree expand/collapse (native from the focused item's `aria-expanded` flip); file-upload *progress* (`setItemProgress` at `:629-639` deliberately does not announce; percentage is exposed through `<tw-progress-bar>` — the right throttling answer); tooltip (linked by `aria-describedby`, must not also announce).

### Missing or broken

- **MEDIUM — `carousel` has no working announcement at all.** Two compounding defects at `carousel.ts:440`:
  1. `[attr.aria-live]="autoplay() ? 'off' : 'polite'"` keys off the **input**, not runtime rotation state. APG requires `polite` whenever rotation is *stopped*. Pressing the built-in pause button flips `_isManuallyPaused` (`:1398-1401`) but leaves `aria-live="off"` — the exact case the pattern exists to cover. Same for the hover / focus / document-hidden pause paths.
  2. There is **no `LiveAnnouncer` anywhere in `carousel.ts`** (no import, no `announce` call). The only mechanism is the `aria-live` viewport, whose DOM text never changes on a slide change — only `aria-hidden`/`inert` toggle on pre-existing children (`:352-353`). Live-region announcement on `aria-hidden` mutation is unreliable across AT, so slide changes may be announced **nowhere**, even with autoplay off.
- **MEDIUM — `select` announces nothing while filtering.** `:1274` is the *only* `liveAnnouncer.announce` call in the file and fires solely for multi-select toggles. The `searchChange` effect (`:901-909`) already computes `visibleCount` and emits it to consumers, but nothing is announced. Combined with H9 (stranded `aria-activedescendant`) and the empty-state-outside-the-listbox finding in §3, **a screen-reader user filtering a searchable select receives nothing** — not the result count, not the active option, not the empty state. `command-palette` and `combobox` both do this correctly.
- **MEDIUM — `file-upload` batch rejections collapse to one.** `:800-805` schedules `setTimeout(() => announce(message), 0)` once **per rejected file**. CDK's `LiveAnnouncer` writes into a single shared live element and each `announce()` overwrites the previous text, so N same-tick zero-delay timers fire back-to-back and only the **last** rejection is voiced. The comment at `:802` ("Sequence per-file announcements so a batch of rejections is announced cleanly") describes an intent the code does not implement. Aggregate the batch into one message, or stagger with real delays.
- **MEDIUM — `file-upload` re-announces unchanged status.** `:653-665`: in `setItemStatus` the `changed` flag guards the *state write* (`:654`) but **not** the announcements (`:656-665`). A consumer driving an upload loop that calls `setItemStatus(id, 'uploading')` on each progress tick — the natural usage, since `setItemProgress` is a separate call — re-announces "file.pdf uploading." every tick. Move the announcements inside the guard.
- **LOW — `transfer` bulk selection is silent.** `:409-410` and `:913-919`: the per-panel count text and the select-all result are plain non-live spans. Ticking items or hitting select-all changes the count and the move buttons' enabled state with no announcement; only per-option `aria-selected` is spoken.
- **LOW — `code-block` copy *failure* is silent.** `:225`: no announcement and the button's `aria-label` stays "Copy code", so a blocked clipboard write produces no perceivable feedback.
- **LOW — `flip-card` announces on every hover flip.** The effect at `:273-289` fires for `mouseenter`/`mouseleave`-driven flips too (`:310-323`). Sweeping a pointer across a grid of `trigger="both"` cards floods the polite queue.
- **LOW — `tags-input` duplicate-drop is silent.** `:527`: a tag rejected as a duplicate produces no announcement and an unchanged chip strip — indistinguishable from a dropped keystroke.
- **LOW — `badge` dismissal.** `:196`: emits `dismissed` with no announcement and no focus management; the removed badge's focus falls to `<body>`. Consumer-owned, but worth a doc note.
- **LOW — `tree` programmatic expansion.** `:331-344`: expansion driven through the `expandedKeys` model while focus is elsewhere produces no announcement.
- **LOW — `split` snap-collapse.** `:809-813`: `collapseChange` fired from a snap during pointer drag has no spoken feedback (the keyboard path is covered natively by `aria-valuenow`).
- **MEDIUM — `sort` never announces the sort direction.** Neither `sort/sort.ts` nor `sort/sort-header.ts` imports `LiveAnnouncer` (only `AriaDescriber` and `FocusMonitor`, `sort-header.ts:16`). `SortDirective.sort()` (`sort.ts:118-146`) mutates `active`/`direction` and emits `sortChange` with no announcement. The classic `MatSort` behaviour — "Sorted by Name ascending" — is absent, and `aria-sort` alone is not re-read by most screen readers when it changes, even on a focused header. This is the single most impactful missing announcement in the library.
- **MEDIUM — `table` selection-count changes are never announced, and the label for it is dead code.** `table.ts:188` declares `selectionAnnouncement` and `:206` defaults it to `'{count} rows selected'`, but **the identifier appears nowhere else in the file**: `setSelected` (`:1360-1377`), `selectAll` (`:1383-1396`) and `clearSelection` (`:1398-1404`) all emit `selectionChange` without touching `_liveAnnouncer`. Selecting rows produces no summary — only the per-checkbox `aria-checked` flip is heard, so "select all" on a 200-row table says nothing.
- **MEDIUM — double announcement on every date commit, both pickers.** The embedded `<tw-calendar>` announces the commit (`calendar.ts:1767` single, `:1778-1781` range) **and** the wrapper announces the same thing (`date-picker.ts:1194`, `date-range-picker.ts:1056`). Two polite messages per selection.
- **MEDIUM — `toast` may announce twice.** The `<tw-toast>` host is itself a live region (`role="status"|"alert"` + `aria-live` + `aria-atomic="true"`, `toast-component.ts:136-138`, `:251-258`) **and** `LiveAnnouncer.announce()` is called with the same text (`toast-container.ts:206-211`, invoked from `toast.ts:247`). Whether AT speaks the inserted `role="status"` subtree varies by screen reader, so the outcome is either correct-once or spoken twice. Pick one channel — with `LiveAnnouncer` doing the work, the host should drop `aria-live` (keeping `role="status"` for semantics) or set it to `off`.
- **LOW — `date-range-picker.ts:1057-1059` is dead code that looks load-bearing.** The `"{start} selected. Pick end date."` branch is unreachable from the calendar path: `onCalendarSelection` returns at `:1256` when `!range.complete`, before `commit()` runs. The real first-click announcement comes from `calendar.ts:1785-1789`.

### Over-chatty / double-speak

- `form-field/form-field.ts:329-337` — `ErrorDirective` sets **both** `role="alert"` (implicit `aria-live="assertive"`) and an explicit `aria-live="polite"`, and the same element is *also* pushed into `aria-describedby` (`:600`). An error is therefore announced twice: once on insertion via the alert, once when focus lands on the control. Pick one channel.
- `form-field/form-field.ts:336` — `[class.hidden]` toggles a `role="alert"` element that stays mounted when `[twError match]` does not match. Un-hiding an already-present alert node does not reliably re-announce in several screen readers, unlike inserting it; `@if` on `shouldShow()` is more robust.
- `slider/slider.ts:303,332,362` — `aria-valuetext` is always emitted as `format(value)`, which for the default formatter (`:218-221`) is a verbatim duplicate of `aria-valuenow`. APG wants it only when the raw number is not self-describing.
- `tabs/tabs.ts:384-386` — announces on every arrow keypress under automatic activation (LOW, APG-consistent).
- **`alert/alert.ts:200` + `:154` — a permanently-mounted live region by default.** See §3; a statically rendered alert is a mounted `role="status"`, so *any* DOM change inside it re-announces. The default should be the quiet one.
- **`collapsible/collapsible.ts:348-352`** (called from `:338` and `:537`) — announces "Section expanded/collapsed" on top of the trigger's `aria-expanded` (`:166`), which AT already speaks on state change. The user hears "collapsed / Section collapsed". Remove it.
- **`time-picker/time-picker.ts:1157-1164`** — `commit()` announces the full formatted time on **every** committed field change, and `commitFromFields` (`:1097`) is called from every digit keystroke (`:1079`), every stepper press, every arrow step, and every meridiem toggle. Since each field is a `spinbutton` whose `aria-valuetext` already changes, AT speaks the value twice per keystroke.
- **`progress-bar` gets this right** — no `aria-live` on the bar; `role="progressbar"` is announced natively and a per-frame live region would be spam.

---

## 6. Disabled-state semantics

**Headline: this axis is in good shape.** `aria-disabled` appears at 50+ sites across the library, and the `opacity-50 pointer-events-none` idiom — which appears ~25 times — is paired with real semantics (`aria-disabled`, a native `disabled` attribute, `tabindex="-1"`, and a guard in the handler) in nearly every case. Verified paired at: `radio.ts:117-120/228/350`, `checkbox.ts:114/262/268` + `setDisabledState` `:553-555`, `switch.ts:98/194`, `slider.ts:198/305-368` + pointer guards `:801,817,865`, `select.ts:195/376-377` and options `:779` + `select-overlay.ts:93`, `combobox.ts:149/272-273` + options `combobox-overlay.ts:187/98`, `transfer.ts:284-288/390/436/446`, `segmented-control.ts:78/135/224/276-278`, `tab-nav.ts:352`, `tags-input.ts:107/220` + real `[disabled]` `:178,207`, `file-upload.ts:167/261` + `[disabled]` on input and trigger, `split.ts:51/93-94`, `item.ts:82/116`, `timeline.ts:470/680-686`, `menu.ts:79` (+ CDK's automatic `aria-disabled`), `paginator.ts:270-272` (`aria-disabled:` Tailwind variants alongside `disabled:`), `calendar.ts:148` / `calendar-cell.ts:138`, the date/time pickers' trigger bindings.

### The one true instance of the anti-pattern

- **MEDIUM — `stepper/stepper.html:20`.** `pointer-events-none` is applied when `!headerInteractive()` **alone**. The `aria-disabled` binding at `:26` is keyed only on `!step.isNavigable()`, and the `opacity-60` at `:21` likewise. So with `headerInteractive=false`: headers stay in the roving tab order, announce as normal selectable tabs, receive focus — and Enter/Space silently no-ops (`onHeaderClick` returns early at `stepper.ts:514`). This is exactly the "`pointer-events-none` alone hides the state from AT" pattern the rules call out.

### MEDIUM

- **`carousel/carousel.ts:363-364`, `:402`** — a `disabled` slide gets only `opacity-50 cursor-not-allowed`. No `aria-disabled`, no `aria-hidden`, no `inert`. Colour/opacity is the **only** cue (SC 1.4.1) *and* AT sees a normal slide that navigation refuses to land on.
- **`number-input/number-input.ts:110`** — `disabled = computed(() => this.cvaDisabled() || this.el.disabled)` reads a **non-signal DOM property**. Its only tracked dependency is `cvaDisabled`, so it never re-runs on a plain `[disabled]` toggle (template-driven or non-reactive usage). The stepper's `isDisabled()` stays `false`, its buttons remain clickable, and `stepBy` guards on the same stale value (`:280`) — so the control **mutates the value of a visually-disabled field**. This is the "CSS-only disabled state that still accepts input" class. Acknowledged as a "v2 limitation" in the JSDoc at `:109`, but it is a correctness defect, not a reactivity nicety. (`readonly` is safe by contrast — `stepBy` re-reads `this.el.readOnly` live.)
- **`button/button.ts:151`** — `'[attr.disabled]': 'isNativeButton() && (disabled() || loading()) ? true : null'`. In the **loading** state the native `disabled` attribute is applied, which removes the button from the tab order and blurs it if focused — the user's focus point is destroyed mid-interaction and the `aria-busy="true"` at `:150` is never heard. Lines `:149-150` already set `aria-disabled` + `aria-busy`, which is the correct loading pattern; native `disabled` should be restricted to `disabled()` only, with `loading()` relying on the existing click interception at `:214-219`.
- **`tabs` / `tab-nav` disabled items removed from the roving order** — see §4. `aria-disabled` *is* set, so this is a discoverability/APG issue, not SC 1.4.1.
- **`calendar/calendar-cell.ts:76`** — the `disabled` state slot is `text-fg-subtle cursor-not-allowed hover:bg-transparent`. **A text-colour change is the only visual disabled cue**, with no `opacity-50`. That is thinner than the `opacity-50`-only pattern the rules warn about, and it violates CLAUDE.md's "Opacity & Disabled States" table, which mandates `opacity-50` alongside `pointer-events-none`/`cursor-not-allowed`. Colour-only differentiation for sighted users (SC 1.4.1). The `outside` + `disabled` compound at `:91` re-asserts the same single token. *(Not a contrast finding — inactive components are exempt from 1.4.3.)*
- **`breadcrumbs/breadcrumbs.ts:84` + `:315`** — the one place in the library where the colour-only concern genuinely bites: `aria-disabled` is dropped because the host is a roleless `<span>` (see §3), leaving `opacity-50 cursor-not-allowed` as the entire signal, with no programmatically determinable state.
- **Removed from the focus order so the state cannot be encountered** — a distinct failure mode from the "alone" pattern, and it appears three times: `collapsible.ts:91` + `:169`, `sort-header.ts:103` + `sort-header.html:4-5`, and `paginator.html:85/154/276/344` in link mode. All three set `aria-disabled` correctly; the defect is that a keyboard user can never land on the control to hear it. Detailed in §4.

### LOW

- **`menu/menu.ts:73-77` — the inline comment is wrong and is a trap.** It states "CDK's `FocusableOption` honours `cdkItem.disabled` … and skips disabled items in keyboard navigation automatically." It does not: `menu.mjs:1260` builds the key manager with `.skipPredicate(() => false)`, so **nothing** is skipped — which is precisely the APG-correct behaviour (disabled menu items stay focusable). A maintainer trusting the comment could "align" the code with it and break compliance. The same comment claims `cursor-not-allowed` communicates the state, but `pointer-events-none` on the same line (`:79`) prevents that cursor from ever rendering.
- **`stepper/stepper.html:21`** — `opacity-60` for the non-navigable state is off the codified ramp (`opacity-50` disabled / `opacity-70` muted). Not an AT failure — `aria-disabled` plus the `INDICATOR_DISABLED`/`LABEL_DISABLED` colour tokens (`stepper.ts:161`, `:192`) carry the state non-colour-only — but it is spec drift.
- **`form-field/form-field.ts:178`** — `disabled: true → root: 'opacity-50 pointer-events-none'` kills pointer events on the **hint and error text** as well, so a user cannot select or interact with the error message of a disabled field. Not harmful for AT (every registered control also sets real `disabled`/`aria-disabled`), but avoidable.
- **`button/button.ts:49`** — the `loading` variant contributes `pointer-events-none` alone; currently safe only because `classes()` (`:202`) folds `loading()` into the `disabled` axis, which supplies `opacity-50`. Fragile coupling.
- **`tree`** — no per-node disabled API (`CdkTreeNode.isDisabled` is never bound at `:212-221`). Nothing to flag in the library, but the docs should say that a consumer-rendered "disabled" node is invisible to the key manager and will still be focused and type-ahead-matched.
- **`switch/switch.ts`** — no `TW_FORM_FIELD_CONTROL` provider, so `switch` cannot be wrapped in a `tw-form-field` and has no hint/error wiring path; errors surface only through the consumer's own markup. Worth documenting.
- **`file-upload/file-upload.html:1-14`** — the hidden native input is `class="sr-only" tabindex="-1"` yet carries `[required]` (`:12`). It stays in the a11y tree and is programmatically focusable, so a native form submit will try to report a constraint violation on a control the user cannot see. `checkbox.ts:195-202` (`hidden` + `aria-hidden`) shows the better shape.

- **LOW** `paginator/paginator.ts:270`, `:272` use `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed`, where CLAUDE.md's "Opacity & Disabled States" table prescribes `disabled:opacity-30 disabled:cursor-default` for *disabled buttons in groups* — which is exactly what first/prev/next/last are. Style-guide drift, not an AT failure. Same class: `time-picker.ts:133`, `:138` and `number-stepper.ts:35` use `disabled:opacity-40`, off the codified ramp but paired with the native `disabled` attribute so state is exposed.
- **CLEAN — calendar disabled day cells stay in the accessibility tree.** `calendar-cell.ts:138` sets `aria-disabled`, `:125` mirrors it as `data-state-disabled` on the `role="gridcell"` host, and there is no `display:none`, `aria-hidden`, or `pointer-events-none` on cells. (The native `disabled` at `:141` is a *keyboard* defect reported in §4, not an a11y-tree removal.) Root disabled treatment on all three pickers pairs the codified classes with a native `disabled`/`aria-disabled`: `date-picker.ts:213`, `date-range-picker.ts:205`, `time-picker.ts:196`.

**Almost no component uses `opacity-50` as its only disabled signal.** Every site audited pairs it with at least one of `aria-disabled`, a native `disabled` attribute, or a `cursor-*` change plus a handler guard. The exceptions are the three MEDIUMs above — `stepper` header (`pointer-events-none` alone), `carousel` slide (opacity + cursor only), `breadcrumbs` disabled crumb (`aria-disabled` dropped on a generic) — plus `calendar-cell` using colour alone with no opacity at all.

---

## 7. Contrast risk

**Method.** Every token resolved per-mode from `theme/_semantic.css` (light), `_dark.css`, `_high-contrast.css`, dereferenced into Tailwind v4.3.0's oklch palette (`node_modules/tailwindcss/theme.css:10-236`), then oklch → OKLab → linear sRGB → relative luminance → WCAG ratio. The converter was validated on five exact round-trips (white/black = 21.00; `oklch(21% .034 264.665)` → `#101828` = gray-900; `oklch(62.3% .214 259.815)` → `#2b7fff` = blue-500; red-500, amber-500, green-600 all exact). Ratios within ±0.3 of a threshold are marked **borderline — verify in-browser** rather than asserted.

Two structural notes: `--color-surface`, `--color-surface-raised` and `--color-surface-overlay` are **all** `--color-white` in light mode (`_semantic.css:3-5`), so those three columns are arithmetically identical. `_dark.css` declares the same 195 properties twice — once under `[data-theme="dark"]` (`:13-271`) and once under `prefers-color-scheme` (`:273-513`) — and the two blocks are in lock-step, so dark numbers apply to both activation paths.

**Accuracy guard applied throughout:** SC 1.4.3 and SC 1.4.11 both **exempt inactive/disabled components**. Disabled text at `opacity-50` is reported as informational usability only (light 3.39, dark 5.13, high-contrast 3.98 — composited in gamma-encoded sRGB, which is what browsers do). The colour-only-cue concern for disabled states lives in §6 under SC 1.4.1, where it belongs.

### HIGH — genuine SC 1.4.11 failures (3:1, UI component boundaries)

**C1 — form-control resting borders are effectively invisible.** `checkbox.ts:111`, `radio.ts:115`, `input.ts:81` and `select.ts:183` all draw their resting boundary with `border-border`:

| Token | Light (`_semantic.css:26-28`) | vs `bg-surface` | Dark (`_dark.css:27-29`) | vs `bg-surface` | vs `bg-surface-raised` |
|---|---|---|---|---|---|
| `border-border` | gray-300 | **1.47** FAIL | gray-600 | **2.66** FAIL | **2.35** FAIL |
| `border-border-muted` | gray-200 | **1.24** FAIL | gray-700 | **1.95** FAIL | **1.72** FAIL |
| `border-border-strong` | gray-400 | **2.60** FAIL | gray-500 | 4.16 PASS | 3.67 PASS |

An **unchecked checkbox contains no text** — the border *is* the component. At 1.47:1 in the default light theme it is essentially invisible to a low-vision user. Same for an unchecked radio, and for the resting outline of every `tw-input` and `tw-select`.

The split matters: `border-border-muted` on decorative dividers (`separator.ts:47`, `card.ts:18,20,29`) is **exempt** — SC 1.4.11 covers only boundaries required to identify a component or its state. The four form controls above are not exempt.

Note also **`border-border-strong` misses 3:1 in light mode (2.60)** — the *strongest* structural token. Anything relying on it to delimit a control inherits the failure, including `input.ts:81`'s and `select.ts:183`'s `hover:border-border-strong`. High-contrast mode fixes all three (`_high-contrast.css:15-17` → 10.31 / 4.84 / 21.00).

Highest-leverage fix: darken `--color-border` in light mode to ≈gray-500, or introduce a dedicated `--color-border-interactive` for form controls and leave the structural token where it is.

**C2 — the solid `warning` button has no visible boundary against the page.** `button.ts:21` declares `solid: ''` — only the `outline` variant gets a `border`. So a solid button's sole boundary is its own fill, which must clear 3:1 against the page. Every role does except warning:

| Mode | Fill | vs page | Verdict |
|---|---|---|---|
| light | amber-500 (`_semantic.css:274`) on white | **2.15** | FAIL |
| high-contrast | amber-400 (`_high-contrast.css:212`) on white | **1.72** | FAIL |
| dark | amber-400 on gray-950 | 11.72 | PASS |

**The high-contrast theme is worse than light mode for this component** — the one place in the audit where that inversion occurs. The label itself is fine (amber-950 on amber-500 = 6.99 light, 8.73 high-contrast); the dark-text-on-yellow signage convention documented at `_semantic.css:268-269` is a good call. What fails is the outer edge. A 1px `warning-border-strong` on the solid variant, or a darker high-contrast fill, closes it.

### MEDIUM

- **The raw `{role}-{shade}` scale is not AA-safe below `-700` in light mode.** Every role's `-500` fails 4.5:1 on both `bg-surface` and the soft `bg-{role}-50` pairing, and `-600` fails for info / success / warning:

  | Light, on `bg-surface` | `-500` | `-600` | `-700` |
  |---|---|---|---|
  | info | 2.71 FAIL | 4.02 FAIL | 5.85 PASS |
  | success | 2.22 FAIL | 3.22 FAIL | 7.09 PASS |
  | warning | 2.15 FAIL | 3.19 FAIL | 5.05 PASS |
  | error | 3.82 FAIL | 4.76 borderline pass | 6.42 PASS |
  | primary | 3.76 FAIL | 5.26 PASS | 6.82 PASS |
  | accent | 4.40 borderline fail | 5.88 PASS | 7.29 PASS |
  | secondary | 4.77 borderline pass | 7.56 PASS | 10.34 PASS |
  | neutral | 4.84 PASS | 7.56 PASS | 10.31 PASS |

  The soft column (`bg-{role}-50`) runs ~8% lower throughout. This is precisely why the slot tokens at `_semantic.css:151-185` exist — the raw scale is an escape hatch, and CLAUDE.md's own guidance already steers components onto slots. The residual risk is **consumer** code reaching for `text-info-500`.
- **Dark-mode soft pairings fail worse than light.** In dark, `--color-primary-50` resolves to `blue-950` (`_dark.css:32`), so `text-primary-500 on bg-primary-50` is blue-500-on-blue-950 = **3.91 FAIL**; accent **3.47 FAIL**; error 4.23 borderline fail; secondary 4.23 borderline fail; `text-neutral-500` on `bg-surface` **4.16 FAIL**. Documented accurately in-file at `_dark.css:159-160`, `:187`, `:253`.
- **`text-fg-subtle` on `bg-surface-muted`, light — 4.39, borderline fail.** Verify in-browser. Practical exposure is currently low: the only in-repo co-occurrence is `stepper.ts:161` (`INDICATOR_DISABLED`, with `opacity-60`), which is an inactive component and therefore SC-exempt. Placeholders (`input.ts:76`) sit on `bg-transparent` over `bg-surface` = 4.84, a pass.
- **Four theme comment blocks contradict themselves.** Cross-checking all 30 ratios asserted in comments found a consistent pattern — the **header tables are wrong while the inline comments are right to ±0.05**:

  | Pair | Header table | Inline comment | Actual |
  |---|---|---|---|
  | sky-600 / white | `_semantic.css:176` "4.7 ✓AA" | `:244` "3.85 ✗AA" | **4.02** |
  | red-500 / red-950 | `_dark.css:149` "5.4 ✓AA" | `_dark.css:253` "4.14 ✗AA" | **4.23** |
  | blue-500 / blue-950 | `_dark.css:150` "5.8 ✓AA" | `:159-160` "3.92 ✗AA" | **3.91** |
  | violet-500 / violet-950 | `_dark.css:151` "6.0 ✓AA" | `:187` "3.46 ✗AA" | **3.47** |

  The header blocks at `_semantic.css:173-184` and `_dark.css:142-152` read like pre-v4-palette carryover and need rewriting; the inline comments are trustworthy. Also `_semantic.css:180` claims amber-700/white "fails at 3.4:1" when it is actually **5.05:1, a pass** — the stated rationale for choosing amber-800 as `warning-fg` is false, though the choice itself is harmless (7.13). The *token choices* are overwhelmingly sound; it is the *documented rationale* that has drifted.

### Negative results that correct two standing assumptions

- **`text-fg-muted` on `bg-surface-raised` is 7.56:1 — a comfortable pass with ~68% headroom, not borderline.** `surface-raised` is plain white in light mode, so it is arithmetically identical to `bg-surface`. The belief encoded in `examples.spec.ts:60-65` (form-field hint text using `text-fg-muted` is a light-mode contrast problem) does **not** reproduce against the tokens as authored. Whatever axe is flagging on `/components/input/examples`, it is not this pairing at these token values — that backlog entry needs re-derivation before anyone "fixes" the token.
  Full foreground grid, light: `fg` 17.75 / 17.00 / 16.13 (surface / sunken / muted); `fg-muted` 7.56 / 7.24 / 6.87; `fg-subtle` 4.84 / 4.63 / **4.39**. Dark: `fg` 19.28–14.07, `fg-muted` 13.67–9.98, `fg-subtle` 7.73–5.64 — every dark cell passes AA with margin, and `fg-subtle` is markedly healthier in dark than in light. High-contrast: every foreground cell clears **AAA** (10.31–21.00).
- **The focus ring vs the component it outlines is NOT an AA failure — do not act on it.** This was the hypothesis flagged as highest-value going in, and it does not hold. Ring-vs-fill computes 1.40 (light, `outline-primary-500` on `bg-primary-solid`), 1.43 (dark), 1.68 (high-contrast) — but **every one of the 71 `outline-primary-500` sites in the library pairs it with `outline-offset-2`** (verified by grep; the only exceptions were `.spec.ts` files, and `combobox.ts:159`, which zeroes the outline entirely rather than tightening it). With a 2 px gap the ring's adjacent colour on *both* sides is the page background, so ring-vs-fill is never an adjacent-colour relationship under SC 1.4.11. The relationship that *does* exist — ring vs background — passes everywhere: 3.76 / 3.42 (light surface / muted), 5.35 / 4.72 / 3.90 (dark), 5.26 / 5.04 (high-contrast). The "3:1 against the component it outlines" requirement is **SC 2.4.13 Focus Appearance, which is AAA**, not 1.4.11. Reported as AAA-adjacent usability, not an AA finding.
- **Solid pairs are in good shape.** Light: all eight `text-on-{role}` / `bg-{role}-solid` pairs pass 4.5:1 (4.76 error → 17.75 neutral). Dark solids are the cleanest family in the audit (5.12–19.28) — the `-400`-not-`-500` decisions at `_dark.css:161`, `:188`, `:254` are all correct. High-contrast meets its stated ≥7:1 AAA target on all eight (7.09–21.00). The `info-solid` fix referenced in the repo's own notes is real and correct: `_semantic.css:244` chose sky-700 (5.85) over sky-600 (4.02).

### Unresolved — needs empirical verification

- `--color-overlay-control: oklch(0 0 0 / 0.4)` and `-hover: 0.6` (`_semantic.css:17-18`) — deliberately translucent black over **arbitrary consumer content** (carousel pause control, overlay indicators). No fixed backdrop, so no computable ratio; the comment at `:9-16` is explicit that the contract is against the media underneath. Needs verification against real consumer imagery.
- `--color-primary-500: Highlight` and the `Canvas` / `CanvasText` / `GrayText` keywords under `@media (forced-colors: active)` (`_high-contrast.css:257-273`) — CSS system colours whose values are UA- and OS-theme-dependent. Needs verification in Windows High Contrast.

---

## 8. Gaps in the existing e2e a11y coverage

This dimension is the root cause of most of the rest: the suite is well built, but its
configuration excludes exactly the surfaces where the failures in sections 1–7 live.

### 8.1 The axe tag set omits WCAG 2.2 entirely — **HIGH**

`e2e/support/a11y.ts:20-26`

```
export const AXE_TAGS = ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']
```

There is no `wcag22a` / `wcag22aa` tag, and a repo-wide grep for `wcag22` / `target-size`
across `e2e/` and `playwright.config.ts` returns nothing. Axe's `target-size` rule
(SC 2.5.8) and `focus-not-obscured-minimum` (SC 2.4.11) are both tagged `wcag22aa`, so
**every finding in section 2 of this report is invisible to CI by configuration.** The
stated bar is WCAG 2.2 AA; the suite enforces 2.1 AA.

Fix: append `'wcag22a', 'wcag22aa'` to `AXE_TAGS`. Expect an immediate wave of
`target-size` failures — those are the section-2 findings, not regressions.

### 8.2 Twelve components are excluded from the axe sweep outright — **HIGH** [already tracked]

`e2e/specs/03-accessibility/examples.spec.ts:52-70` (`A11Y_BACKLOG`), enforced at `:82`.

Excluded: `tabs`, `sort`, `table`, `stepper`, `select`, `paginator`, `timeline`, `toast`,
`time-picker`, `form-field`, `input`, `textarea`.

That set is disproportionately the *interactive* half of the library. The exclusion is
total — both colour schemes, all rules — rather than scoped to the specific rule that
fails (`nested-interactive`, `aria-allowed-attr`, `color-contrast`). A component excluded
for one `nested-interactive` node is simultaneously unchecked for missing labels, bad
roles, and contrast.

Fix: replace the component-level skip with a rule-level `disableRules([...])` per
component, or an `exclude(selector)` scoped to the offending node, so the remaining ~90
axe rules keep running on those twelve pages.

### 8.3 axe never scans an interactive state — **HIGH**

`e2e/specs/03-accessibility/examples.spec.ts:87-97` and `:100-116`.

Both tests do `page.goto(url)` → wait for the `h1` → `runAxe(page)`. There is no click, no
keypress, no overlay opened, no form submitted. `runAxe` appears in exactly two places in
the whole suite (`examples.spec.ts:96` and `:114`); the only other `AxeBuilder` uses are
the unused fixture at `e2e/fixtures/base.ts:56` and the skipped test at
`theme-matrix.spec.ts:92`.

**Consequence: no open overlay, expanded panel, error state, selected state, or disabled
state is ever axe-scanned anywhere in the repository.** The `04-visual` baselines named
`dialog-open`, `select-open` and `date-picker-open` are pixel screenshots, not axe runs —
they prove the overlay *renders*, not that it is accessible.

This is where a11y bugs actually live, and it is the single largest coverage gap. Missing
scenarios, in priority order:

| Scenario | Why it matters |
|---|---|
| dialog / sheet **open** | `aria-modal`, focus trap, background `aria-hidden`/`inert`, heading wiring |
| select / combobox / command-palette **open** | listbox required-children, `aria-activedescendant` resolution, option roles |
| menu **open**, submenu open | `role=menu` children, `aria-expanded` on the trigger |
| date-picker / date-range-picker / time-picker **open** | grid roles, `aria-selected`, spinbutton values |
| accordion / collapsible **expanded** | `aria-controls` now resolves; region labelling |
| tabs **after switching tab** | `aria-selected` moved, panel `aria-labelledby` |
| form-field **in error state** | `aria-invalid`, `aria-describedby` composition, contrast of error text |
| any control **disabled** | `aria-disabled` presence, contrast exemption correctness |
| toast **visible** | live-region role, dismiss button name, keyboard reachability |
| stepper / carousel **after advancing** | `aria-current`, slide labelling, live announcement |

### 8.4 The only cross-theme contrast sweep is permanently skipped — **HIGH**

`e2e/specs/02-cross-cutting/theme-matrix.spec.ts:84` — `test.fixme(...)` on
`` `@theme @a11y ${theme}: axe color-contrast passes on sampled pages` ``.

That test is the only place the `high-contrast` theme is ever scanned for contrast, and
one of only two places dark mode is. It is disabled with an inline note listing the known
failures (`input` hint colour in light+dark+high-contrast; `button` solid swatches in
dark; `dialog` in dark). Net effect:

- **`high-contrast` theme has zero contrast verification anywhere in the suite.**
- Dark-mode contrast is only covered by the `examples.spec.ts` dark sweep, minus the
  twelve backlogged components — i.e. dark contrast is unverified for `input`,
  `textarea`, `form-field`, `select`, `table`, `toast`, `time-picker`, `timeline`,
  `tabs`, `sort`, `stepper`, `paginator`.
- The sample is only 4 pages (`theme-matrix.spec.ts:30-35`: button, alert, input, dialog).

### 8.5 Five shipped components had no e2e coverage at all — **MEDIUM** (resolved in the working tree during this audit)

`e2e/support/routes.ts:13-65` now lists **54** components, matching the 54 `components/<slug>` routes declared in `projects/demo/src/app/app.routes.ts`. At the start of this audit it listed 49, omitting `aspect-ratio` (`app.routes.ts:18`), `file-upload` (`:102`), `number-input` (`:114`), `tags-input` (`:134`) and `tree` (`:210`). The file changed on disk mid-audit — the drift is now resolved. Recording it because the consequences are still live:

- Every spec in `03-accessibility/` iterates `COMPONENTS`, so until that change those five had **zero** axe scans, zero `aria-controls` resolution checks, zero `aria-expanded` validity checks and zero accessible-name checks. `tree` is a full composite widget; `tags-input` and `file-upload` are form controls with live regions and per-item remove buttons.
- **None of the five appears in any backlog set**, so the next `npm run e2e:a11y` runs the full sweep plus all four explicit assertions against them for the first time. Expect new failures — §1–§6 predicts several (`tree` row target size, `tags-input` chip semantics, `file-upload` announcements). Those are pre-existing defects surfacing, not regressions from the route addition.
- `projects/demo/src/app/app.routes.spec.ts:56` is a drift guard designed to fail on exactly this divergence. It should have caught the gap when the five routes were added; worth confirming it actually runs in CI, since a guard that was red for five components without anyone noticing is itself the finding.

### 8.6 Thirteen components are exempted from the explicit ARIA assertions — **MEDIUM** [already tracked]

`e2e/specs/03-accessibility/explicit-assertions.spec.ts:195-204` (`ARIA_CONTROLS_BACKLOG`)
and `:206-216` (`ACCESSIBLE_NAME_BACKLOG`), applied via `test.fixme` at `:230` and `:256`.

- No `aria-controls` resolution check: `accordion`, `collapsible`, `combobox`,
  `date-picker`, `date-range-picker`, `select`, `stepper`, `tabs`.
- No accessible-name check: `checkbox`, `combobox`, `form-field`, `input`, `paginator`,
  `table`, `textarea`, `toast`, `transfer`.

The file's own comment on the `checkbox`/`transfer` entries is correct and worth acting
on: those two are a **harness false positive** — `checkbox.ts` renders a `hidden`
`aria-hidden="true"` native input purely for form participation, and
`findUnlabeledFormControls` (`:44-99`) filters `input[type=hidden]` but not the `hidden`
attribute or `aria-hidden`. Teaching the helper to skip a11y-tree-excluded nodes would
retire two of the nine entries immediately and is the cheapest win in this section.

### 8.7 `npm run e2e:a11y` skips every keyboard and focus-restoration test — **MEDIUM**

`package.json:26` — `"e2e:a11y": "playwright test --grep @a11y --project=chromium-light"`.

The keyboard and focus specs are tagged `@keyboard` / `@overlay`, not `@a11y`:

- `e2e/specs/02-cross-cutting/focus-restoration.spec.ts:61, 79, 97`
- `e2e/specs/02-cross-cutting/keyboard-journey.spec.ts:26, 71, 113, 137`

So the command a developer runs to check accessibility deliberately excludes SC 2.1.1
(Keyboard), SC 2.4.3 (Focus Order) and SC 2.4.7 (Focus Visible) coverage. Adding `@a11y`
to those seven test titles costs nothing and roughly doubles what the a11y command
actually verifies.

### 8.8 Focus restoration is tested for two components out of ~14 overlay-bearing ones — **MEDIUM**

`focus-restoration.spec.ts` covers dialog (Esc `:61`, backdrop `:79`) and select (Esc
`:97`). Not covered: `sheet`, `popover`, `menu`, `command-palette`, `combobox`,
`date-picker`, `date-range-picker`, `time-picker`, `tooltip`, and dialog-closed-by-the-
close-button (as distinct from Esc/backdrop). Focus landing on `<body>` after an overlay
closes is one of the most common and most disorienting AT regressions, and it is
currently caught for two paths only.

### 8.9 Twelve components have no component-level spec — **MEDIUM**

Present in `app.routes.ts` but absent from `e2e/specs/01-components/`: `aspect-ratio`,
`breadcrumbs`, `combobox`, `empty-state`, `file-upload`, `number-input`, `sheet`, `stat`,
`tags-input`, `textarea`, `timeline`, `tree`. `sheet` and `combobox` are the notable ones
— both are overlay-bearing with focus-trap and required-children obligations.

### 8.10 Two divergent axe configurations — **LOW**

`e2e/fixtures/base.ts:55-61` defines an `axe` fixture that excludes `[data-compodoc]`, but
the accessibility specs use `runAxe` from `e2e/support/a11y.ts:47` instead, which has no
such exclusion and a different tag set path. The fixture appears to be dead code. Pick
one, delete the other, so a future tag change (see 8.1) lands everywhere.

### 8.11 `overview` and `api` sub-routes are never scanned — **LOW**

`examples.spec.ts:72-79` documents the choice to scan only `/examples`. Defensible — those
pages are prose and generated tables. Worth one static-page scan per release rather than
per PR, since heading-order and landmark regressions do occur there.
