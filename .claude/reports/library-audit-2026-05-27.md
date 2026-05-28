# ngx-tw library + demo audit — 2026-05-27

Comprehensive code-reviewer pass over all 48 components (library + matching demo doc page). Findings tiered Critical / High / Medium / Low with `file:line` anchors and the rule each finding violates. Cross-cutting batch patterns at the end of each section; global patterns and recommended PRs at the bottom.

---

## Batch 1 — Form controls A (input, textarea, checkbox, radio, switch, slider)

Totals: Critical 0 · High 9 · Medium 9 · Low 2.

### input
- **High** — `requiredInput` aliased to `required` (`projects/ngx-tw/input/input.ts:210`) diverges from `radio.required`/`switch.required` naming. Same role, three different public names across batch.
- **Medium** — `userAriaDescribedBy = computed(() => this.userAriaDescribedByInput())` (`input.ts:293`) is a no-op `computed` wrapping a single signal.
- **Medium** — `requiredInput`, `readonlyInput`, `disabledInput`, `idInput`, `userAria*Input` names leak the "Input" suffix into public symbols.

### textarea
- **High** — Examples canon order broken: Reactive → Template-Driven → Signal (`projects/demo/src/app/routes/textarea/examples/textarea-examples.component.ts:188`). Canon is Template-Driven → Reactive → Signal.
- **High** — Missing Playground section. SKILL: "Playground (always last)" is mandatory.
- **Medium** — Demo lacks Variants/Sizes/States parity with `input` page.
- **Low** — `inputs: ['size']` re-declaration (`textarea.ts:71`) needs `@internal` note.

### checkbox
- **High** — `box: 'inline-flex … rounded-sm border …'` (`projects/ngx-tw/checkbox/checkbox.ts:55`) uses `rounded-sm`. CLAUDE.md Visual Design System bans `rounded-sm`; must be `rounded-md`/`rounded-none`.
- **Medium** — Two `model()`s (`checked`, `indeterminate`) + matching `linkedSignal`s creates dual storage (`checkbox.ts:312–373`). Document why mirror is needed or simplify.
- **Medium** — `requiredInput` (aliased `required`) reuses input's naming while sibling `disabled` is plain — inconsistent within a single file.
- **Low** — API page lacks a Methods row for the public `toggle()` method (`projects/demo/src/app/routes/checkbox/api/checkbox-api.component.ts`).

### radio
- **High** — Standalone `<tw-radio>` exposes `[(checked)]` via `model()` but has no `NG_VALUE_ACCESSOR` provider and no `writeValue`/`registerOn*` (`projects/ngx-tw/radio/radio.ts:213`). Either remove the standalone form-control claim or wire CVA.
- **Medium** — No `errorState`/`aria-invalid`/`TW_ERROR_STATE_MATCHER` integration on either `RadioComponent` or `RadioGroupComponent`.
- **Medium** — `RadioGroupComponent<T = unknown>` (`radio.ts:467`) generic isn't documented in the demo API page.

### switch
- **Medium** — Static `CHECKED_ICON_COLOR` map uses raw `text-white`/`text-black` (`projects/ngx-tw/switch/switch.ts:113–121`). Checkbox uses semantic `text-on-{color}` tokens for the same purpose.
- **Medium** — No `errorState`/`aria-invalid`/`TW_ERROR_STATE_MATCHER`.
- **Medium** — `(keydown)` toggles on Enter (`switch.ts:318`); ARIA `switch` pattern is Space-only (matches `checkbox`).

### slider
- **High** — `errorState` recomputes off `_ngControlRev`/`_formSubmitRev` but never reads `_focused` (`projects/ngx-tw/slider/slider.ts:494–502`). Touched-on-blur transitions won't repaint the error border until status/value changes again.
- **High** — Constructor `queueMicrotask` + manual `.subscribe` (`slider.ts:551–566`) bypasses `takeUntilDestroyed`, the pattern every other control uses.
- **Medium** — `readonly input = output<SliderValue>()` (`slider.ts:473`) shadows the imported `input` factory name on the class instance.
- **Medium** — `markClassFor`/`bubbleClassFor` (`slider.ts:718`) recompute on every CD cycle without memoization vs. every other class-string source which is a `computed()`.

### Batch patterns
- **High — Error-state matcher coverage is split.** `input`, `textarea` (inherited), `checkbox`, `slider` wire `TW_ERROR_STATE_MATCHER`, expose `errorStateMatcher` input, and reflect `aria-invalid`. `radio`, `switch` do not. Six form controls advertising the same forms compatibility should share the same error machinery.
- **Medium — CVA registration pattern diverges.** `checkbox` (`checkbox.ts:357`) and `slider` (`slider.ts:545–547`) use Material-style runtime `this.ngControl.valueAccessor = this`. `switch` (`switch.ts:130–135`) and `radio-group` (`radio.ts:447–453`) use static `NG_VALUE_ACCESSOR` provider. Converge.
- **Medium — `required` naming inconsistent.** Sometimes `requiredInput` aliased, sometimes plain `required`. Unify.
- **Medium — Disabled state is consistent** (`opacity-50 pointer-events-none cursor-not-allowed`) across all six — keep this as canonical reference.

---

## Batch 2 — Form controls B + button (select, combobox, form-field, time-picker, button)

### select
- **High** — `projects/ngx-tw/select/select.ts:173` uses both `focus:outline-none` (bare `focus:`) and `focus-visible:outline-none`. Library rule: `focus-visible` only. Drop the bare form.
- **High** — Clear "button" is a `<span role="button">` instead of `<button>` (`select.ts:398`). Native button preferred.
- **High** — Demo Examples page missing **Variants** section despite `variant: 'default' | 'naked'` (`projects/demo/src/app/routes/select/examples/select-examples.component.ts:103`).
- **High** — API descriptions don't mirror JSDoc one-liners (`projects/demo/src/app/routes/select/api/select-api.component.ts:30`).
- **Medium** — `errorState` exposed via private `_setErrorState()` shim (`select.ts:799, 1498`) rather than wired to `NgControl.invalid` like time-picker.

### combobox
- **High** — Raw palette: `focus-within:outline-neutral-500` (`projects/ngx-tw/combobox/combobox.ts:134`). Use `focus-within:outline-border-strong`.
- **High** — `focus-within:outline-2 focus-within:outline-offset-2` chain at `combobox.ts:113` is non-canonical (canonical is `focus-visible:` on the input).
- **High** — Demo section order starts at **Sizes** then **Colors** (canon is Colors → Sizes) (`combobox-examples.component.ts:177`).
- **High** — Uses "Disabled state" instead of canonical **States** section (`combobox-examples.component.ts:490`).
- **Medium** — ~24 inputs (overlay + form-control double exception applies). Non-overlay axes (`showChevron`, `clearable`, `openOnFocus`, `autoCloseDelay`) could collapse into a `config` object.

### form-field
- **High** — `PrefixDirective`/`SuffixDirective` use `selector: '[slot="prefix"]'`/`[slot="suffix"]` (`form-field.ts:339`). Using the standard HTML `slot` attribute as a directive selector is unconventional. Switch to `[twPrefix]`/`[twSuffix]`.
- **Medium** — Dev-mode validation throws inside an `effect()` (`form-field.ts:613`). Prefer `console.error`.
- **Medium** — Demo leads with "Appearance" rather than canonical **Variants** (`form-field-examples.component.ts:60`).

### time-picker
- **High** — Active meridiem button hard-codes `bg-primary-500 text-on-primary` (`time-picker.ts:669`) instead of respecting the `color` input.
- **High** — Numeric field widths `w-5..w-9` (`time-picker.ts:127, 134, 141, 148, 155`) not in spacing scale; need justification comments.
- **High** — Provides only `TW_FORM_FIELD_CONTROL`, no `NG_VALUE_ACCESSOR` (`time-picker.ts:224-228`); uses Material-style `ngControl.valueAccessor = this` (`:708`).
- **Medium** — `showSteppers = input(true)` / `showClear = input(true)` (`:468, :472`) carry justification comments but aren't on CLAUDE.md's codified `true`-default list.

### button
- **High** — `ButtonIconDirective` declares `twButtonIcon = input<'' | 'leading' | 'trailing'>('leading')` (`button.ts:225`). The empty-string member is undocumented and silently degrades. Drop `''` from the union.
- **High** — Overview missing **Accessibility** section (`button-overview.component.ts:11`).
- **High** — API description for `loading` paraphrased vs JSDoc (`button-api.component.ts:9`).
- **Medium** — `order: 'order-last'` (`button.ts:232`) assumes button is a flex container; document.

### Batch patterns
- **Overlay scroll-strategy and position duplication** between `select` (`select.ts:330, 502`) and `combobox` (`combobox.ts:97, 415`). Extract to `ngx-tw/core`.
- **Dismiss behaviour drift:** select closes overlay on backdrop + Escape; combobox only on backdrop. Combobox should listen to overlay `keydownEvents()` Escape like select does (`select.ts:1393`).
- **CVA registration style split:** select/combobox use `NG_VALUE_ACCESSOR` + `forwardRef`; time-picker uses `ngControl.valueAccessor = this`. Pick one.
- **Auto-naked detection duplicated:** select (`:614`), combobox (`:537`), time-picker (`:572`) each re-implement `inject(FormFieldComponent, { optional: true })` + `'naked'` resolution. Hoist to a helper.
- **Demo vocabulary drift:** form-field says "Appearance", others say "Variants". Pick one.

---

## Batch 3 — Date / Calendar (calendar, date-picker, date-range-picker)

Totals: Critical 0 · High 9 · Medium 7 · Low 3.

### calendar
- **High** — Public outputs `opened`, `closed`, `renderedMonthsCount` (`projects/ngx-tw/calendar/calendar.ts:535-542, 553-558`) are `@deprecated v1: inline-only` placeholders that NEVER emit. Drop until wired.
- **High** — Demo Examples missing **Template-driven forms** section (`calendar-examples.component.ts:40-261`).
- **High** — No **Playground** section.
- **High** — Section titles contain impl refs (`"(§21.2)"`, `"(§10.1)"`) (`calendar-examples.component.ts:102, 130, 157`).
- **Medium** — Four `true`-default range booleans collapse cleanly into a single `rangeBehavior` config object (`calendar.ts:418-436`).
- **Medium** — `blockInvalidRangeCommit` ships as no-op + dev warning (`calendar.ts:398`) — remove from public API or rename `[REC]`-prefixed.
- **Low** — `monthColumns` capped at 1|2 with JSDoc noting Phase 9 replacement (`calendar.ts:454`).

### date-picker
- **High** — Nine `@deprecated v2` inputs live alongside their `timeConfig` replacement (`date-picker.ts:491-529`). Library is pre-1.0; drop the standalone inputs.
- **High** — Missing **Template-driven** forms section in examples.
- **High** — Deprecation badge (`bg-warning-50 text-warning-700`) not consistently applied in API page for ~9 deprecated inputs.
- **Medium** — `openOverlay()` emits `opened` synchronously BEFORE the enter animation completes, contradicting its JSDoc (`date-picker.ts:1199`).
- **Medium** — `inject(NgControl, … self: true)` + manual `valueAccessor = this` assignment (`:594, :786`) diverges from `NG_VALUE_ACCESSOR` providers used by `calendar.ts:138-141`.
- **Low** — `ANIMATION_DURATION = 120` is a magic constant; visual system codifies `duration-150`/`duration-200`.

### date-range-picker
- **High** — Component composes `tw-calendar` inside the overlay but re-implements trigger chrome, overlay positions, focus-trap, scroll strategy, ID generation, and ARIA wiring instead of reusing `DatePickerComponent` (`date-range-picker.ts:269-275`). Extract a shared `BaseDatePicker`/`PickerTrigger`.
- **High** — Missing Template-driven forms section.
- **Medium** — `clearButton` uses `size-5` (sub-WCAG touch target) (`date-range-picker.ts:181-184`); bump to `size-6` to match date-picker.
- **Medium** — `buildDateRangePickerPositions` is byte-identical to `buildDatePickerPositions` (`date-range-picker.ts:155-162` vs `date-picker.ts:255-262`).
- **Low** — `size-3.5` half-step chevron honored with inline justification (`:191`). OK.

### Batch patterns
- **Template-driven section missing on all three Examples pages.** CVA components must demonstrate all three forms strategies. Calendar and date-range-picker also lack Playground.
- **Pre-1.0 deprecated surfaces.** Calendar 3 never-firing outputs; date-picker 9 deprecated time inputs alongside `timeConfig`. Pre-1.0 is the moment to remove, not deprecate.
- **Picker overlay duplication.** date-picker and date-range-picker independently re-implement overlay positions, scroll-strategy resolver, focus-trap lifecycle, animation-duration constant, ID generator, panel-class resolution, aria-label fallback. Extract a `PickerOverlayHost` mixin.
- **JSDoc compliance is uniformly excellent** across all three library files.
- **CLAUDE.md staleness:** `TwCalendarPresets` is listed as a flagged class-naming violation but the actual class is `CalendarPresetsDirective` (`calendar-presets.ts:14`) — rename has already landed; update CLAUDE.md.

---

## Batch 4 — Layout / Structure (card, separator, split, item, sheet, dialog, stepper)

### card
- **High** — API page must list `CardHeaderDirective`/`CardBodyDirective`/`CardFooterDirective`/`CardMediaDirective` (verify in `card-api.component.ts`).
- **Low** — `compoundVariants` omits a `neutral` outlined branch (`projects/ngx-tw/card/card.ts:54-60`).

### separator
- **Low** — `vertical` orientation silently drops the projected label (`projects/ngx-tw/separator/separator.ts:83-85`). Either render rotated or document content loss in JSDoc.

### split
- **High** — `_componentId = nextSplitId++` field-init counter (`projects/ngx-tw/split/split.ts:36, 161`). Use `_IdGenerator` from `@angular/cdk/a11y` (matches dialog/sheet) for SSR safety.
- **Medium** — `_setNoSelect` mutates `document.body.classList` (`split.ts:875-878`); concurrent drags on different instances race. Use a ref-counted helper.
- **Low** — `_ariaLabel` hardcodes English `"Resize column N"` (`split.ts:534-538`); expose as `gutterAriaLabel` input.

### item
- **Verified clean.** `text-base font-semibold` on `lg` title (`projects/ngx-tw/item/item.ts:58`) is the codified `tw-item` exception. `FocusMonitor` correctly wired, defaults compliant.

### sheet
- **High** — `SheetTitleDirective` uses `text-base font-semibold` (`projects/ngx-tw/sheet/sheet-content.ts:70`). CLAUDE.md: `text-base` reserved for the `tw-item lg` title.
- **Low** — `panelClass` merge logic (`sheet-container.ts:168-173`) duplicates dialog code; extract to shared helper.

### dialog
- **Blocker** — NEW `Tw*` class-name violations: `TwDialogContainer` (`dialog-container.ts:87`), `TwDialogHeaderDirective`, `TwDialogIconDirective`, `TwDialogTitleDirective`, `TwDialogSubtitleDirective`, `TwDialogDescriptionDirective`, `TwDialogContentDirective`, `TwDialogActionsDirective`, `TwDialogCloseDirective` (`dialog-content.ts:28,53,75,105,118,153,168,191`). None on the codified exempt list. Sibling `sheet` directives correctly omit the prefix.
- **High** — `TwDialogTitleDirective` host class `text-base font-semibold` (`dialog-content.ts:71`) — same `text-base` violation.
- **Medium** — `findEnclosingDialog` walks the DOM (`dialog-content.ts:213-225`). Brittle when nested under portals; inject via `{ optional: true, host: true }` ancestor lookup instead.

### stepper
- **High** — `showError = input(true)` (`stepper.ts:321`) and `headerInteractive = input(true)` (`:324`) — neither on codified true-default list. Invert or add inline rationale + update list.
- **Medium** — `text-base` on `lg`/`xl` step labels (`stepper.ts:91, 95`) likely qualifies under "Trigger font size scale" (`lg`/`xl` → `text-base`). Verify intent; downgrade to Low if treated as trigger role.
- **Low** — Demo page header uses hand-authored SVG vs sibling pages' `<tw-icon name="…" />` (`stepper-page.component.ts:32-43`).

### Batch patterns
1. **`text-base` outside `tw-item` carve-out** is the highest-frequency violation (dialog title, sheet title, possibly stepper labels).
2. **`Tw*` class-name discipline is broken on dialog only.** Sheet got it right. Single PR can rename `TwDialog*` → `Dialog*`.
3. **Boolean-true defaults creeping in** (`stepper.showError`, `stepper.headerInteractive`).
4. **Page-header chip icon source inconsistent** (six pages use `<tw-icon>`, stepper uses inline SVG).
5. **Dialog and sheet duplicate ~80% of plumbing** (animation lifecycle, aria-described-by queue, DOM walk, `panelClass` merge). Extract `core/overlay-container-base.ts`.

---

## Batch 5 — Navigation (tabs, tab-nav, breadcrumbs, paginator, menu, command-palette)

Totals: Blockers 2 · High 9 · Medium 13 · Low 4.

### tabs
- **High** — Tab close button is unreachable by keyboard (`projects/ngx-tw/tabs/tabs.html:55-67`): `<span role="button" tabindex="-1">` with `(keydown.enter)`/`(keydown.space)` — `tabindex="-1"` means keyboard users can never focus it.
- **High** — `duration-normal` not in codified scale (`tabs.ts:39, 42, 44`). CLAUDE.md codifies only `duration-150`/`duration-200`. (Same in `tab-nav.ts:37`, `paginator.ts:255, 260, 262`, `menu.ts:52`, `command-palette.ts:80`.)
- **Medium** — Close container fixed at `size-4` regardless of tab size (`tabs.ts:43-44`); contradicts square-interactive-target scale.
- **Low** — Active-state lookup tables (`UNDERLINE_ACTIVE_HORIZONTAL` etc.) duplicate the same structure 4× (`tabs.ts:166-219`).

### tab-nav
- **High** — Manual `document.activeElement` keyboard scan instead of CDK `FocusKeyManager` (`tab-nav.ts:285-323`). Same in `tabs`.
- **Medium** — `linkRole` returns `null` (`tab-nav.ts:375`) — anchors already have `role="link"`; setting `null` is a no-op.
- **Medium** — Spec may be missing Accessibility test group for ARIA tabs pattern.
- **Low** — `labels` input shape is overkill for one announcement (`tab-nav.ts:206`).

### breadcrumbs
- **Medium** — Demo Examples missing Playground (`breadcrumbs-examples.component.ts:196`).
- **Medium** — Custom-separator HTML demo mixes styling into projected separator without going through `*twBreadcrumbsSeparator` guidance (`:76`).
- **Medium** — Overflow-trigger `size-9` reused at lg AND xl (`breadcrumbs.ts:127, 135`). Either codify lg=xl or bump xl to `size-10`.
- **Low** — `renderedEntries` redundant condition `all.length > 2` checked twice (`breadcrumbs.ts:432`).

### paginator
- **Blocker** — ~20 inputs with no codified exception (`paginator.ts:424-483`). Either add to CLAUDE.md exception list with rationale or refactor secondary axes (labels, linkFactory, customAriaLabel, hideOnEmpty, hideOnSinglePage, responsive) into a config object.
- **High** — Active-page button uses raw palette: `bg-primary-600 text-white border-primary-600` (`paginator.ts:155-171`). Use `text-{color}-fg`/`text-on-{color}` tokens.
- **High** — `size-3.5` half-step lacks required justification comment (`paginator.ts:275`).
- **High** — Sizes section labels (`text-sm font-medium text-fg-muted mb-2`) are non-canonical demo-surface pattern.

### menu
- **High** — Disabled menuitem with `pointer-events-none` + `opacity-50` + carve-out `focus-visible:bg-surface-muted` may show no distinct focus state if programmatically focused (`menu.ts:74`). Verify FocusKeyManager skips disabled.
- **High** — `color = input<TwColor | undefined>(undefined)` (`menu.ts:207`) widens shared `TwColor` type. Default to a value or document.
- **Medium** — Submenu indicator hardcoded `size-4` regardless of menu density (`menu.ts:399`); parametrise off `MenuComponent.size()`.

### command-palette
- **Blocker** — `activeIndex` `linkedSignal` resets to first enabled item on every `filteredItems` emission (`command-palette.ts:516-519`). Stale identity (unchanged ids, new array ref) jumps selection back to 0. Key off stable `id` set instead.
- **High** — `setTimeout(ANIMATION_DURATION)` close-timer can leak if destroyed mid-animation; `untracked(() => this.open.set(false))` may run on destroyed state (`command-palette.ts:656-672`). Early-return on `!isAttached()`.
- **High** — Activedescendant carve-out: hovered non-active item identical to active item (both `bg-surface-muted`) (`command-palette.ts:119, 125`). Active state must be unambiguously distinguishable.
- **Medium** — `closeOnSelect`/`closeOnEscape`/`closeOnBackdropClick`/`autoFocus` defaults confirmed at `:401, :404, :407, :410`. ✓
- **Medium** — Tab key forcibly closes palette (`command-palette.ts:756-758`). FocusTrap already keeps focus inside; remove the Tab handler.

### Cross-cutting
- **High** — `tabs` and `tab-nav` duplicate ~110 lines of trigger tv() + active-state maps (`tabs.ts:38-44, 166-225` vs `tab-nav.ts:36-37, 93-130`). Extract `tabTriggerVariants` to `ngx-tw/core`.
- **High** — Menu (CDK Menu) handles Home/End/typeahead; command-palette implements Home/End but no typeahead.

### Batch patterns
1. `duration-normal` non-canonical, appears in 5+ components.
2. Hand-rolled roving keyboard navigation in tabs, tab-nav, paginator. Standardise on `FocusKeyManager`.
3. Trigger tv() duplication between tabs and tab-nav.
4. Raw palette colors in paginator active states.
5. Square interactive scale missing codified `xl` step.
6. No demo Playground in breadcrumbs.

---

## Batch 6 — Display / Status (avatar, badge, alert, empty-state, skeleton, spinner, icon)

Totals: Critical 0 · High 3 · Medium 6 · Low 4.

### avatar
- **High** — `aria-hidden` host binding (`projects/ngx-tw/avatar/avatar.ts:92-93`) yields `"true"` for image avatars without `alt` — hides meaningful images from screen readers. Only set `aria-hidden="true"` when `displayMode() !== 'image'`, or warn in dev mode for missing alt.
- **Medium** — AvatarGroup mutates DOM via `style.display` in an `effect()` (`avatar.ts:252-258`). Use signal-driven `@if`/`[hidden]`.
- **Medium** — `size-16` outside codified glyph scale at `xl` (`avatar.ts:52`). Avatars are containers, not glyphs — document the container scale or drop xl to a codified value.
- **Low** — `size-[60%]` arbitrary value (`avatar.ts:43`); justified inline but consider promoting to a theme token.

### badge
- **High** — `BadgeComponent` has 7 inputs + 1 output (`badge.ts:220-242`) — exceeds 5–6 cap with no codified exception (badge is a visual primitive, explicitly excluded). Either fold into `appearance` config or split `dot`-mode into a directive.
- **Medium** — Unconditional `role="status"` (`badge.ts:190`) implies live region. Most badges are decorative tags. Add opt-in `live` input.
- **Medium** — Dismiss button `transition-colors` (`badge.ts:22`) targets only background.

### alert
- **Medium** — `politeness="off"` returns `null` (`alert.ts:210-219`); JSDoc should call out the no-re-announce semantic.
- **Medium** — `size-3.5` dismiss-icon half-step (`alert.ts:175`) lacks per-use justification comment.

### empty-state
- **Medium** — Compound variants use `py-1.5`/`py-5` (`empty-state.ts:72-76`) outside the inline-padding scale. Snap to scale or add justification.
- **Low** — `hasIcon`/`hasActions` computed signals declared but unused (`empty-state.ts:242, 245`).

### skeleton
- **Medium** — `announce` JSDoc missing `Defaults to \`false\`.` suffix (`skeleton.ts:107`); Compodoc renders empty Default cell.
- **Low** — `width`/`height` inline-style built as semicolon string (`skeleton.ts:150-161`); prefer object form.

### spinner
- **Medium** — `track = input(true)` (`spinner.ts:138-139`) JSDoc says *what* but not *why* default is `true`. Append codified rationale.

### icon
- **Medium** — `ariaLabel`/`name`/`img` JSDoc missing `Defaults to …` (`icon.ts:110, 113, 122`).

### Batch patterns
1. Boolean-default `true` rationale missing on canonical `spinner.track`.
2. `size-3.5` half-step requires per-use comment; alert template inline `class="size-3.5"` doesn't carry one.
3. `role="status"` proliferation (badge unconditional, spinner always-on, skeleton conditional). Audit usage.
4. Animation classes correctly centralized in `theme/_base.css` with `prefers-reduced-motion`. Strong pattern.
5. **Demo shells uniform across all seven** — canonical `tw-item` + `twTabNav`, leading-aligned, primary-tinted icon chip, three-tab nav. Strong consistency baseline.

---

## Batch 7 — Indicators / Overlays / Feedback (progress-bar, stat, timeline, popover, toast, tooltip)

### progress-bar
- **Medium** — `effect()` mutates closure-scoped `warned` boolean (`progress-bar.ts:307-319`). Prefer `untracked` one-time check.
- **Low** — API table description paraphrases vs JSDoc (`progress-bar-api.component.ts:30`).
- **Low** — `duration-normal` works (token in `theme/_typography.css:8`) but CLAUDE.md cites only `duration-150`/`duration-200`.

### stat
- **Low** — `text-base font-bold`/`font-extrabold` for lg/xl value sizes (`stat.ts:107, 115`) — reserved for `tw-item lg` exception. Either add inline carve-out or step down.
- **Low** — API description drops "Projected footer content still renders" detail (`stat-api.component.ts:42`).

### timeline
- **Medium** — `scrollControls` exception inline-documented in library; API should mirror.
- **Low** — `ngDevMode` global pattern (`timeline.ts:1172`) inconsistent vs progress-bar's `isDevMode()`.

### popover
- **Medium** — Four `true`-default booleans (`twPopoverArrow`, `twPopoverCloseOnOutside`, `twPopoverCloseOnEscape`, `twPopoverTrapFocus`) inline-justified but not on CLAUDE.md codified list.
- **Low** — Demo `popover-api.component.ts:30` description escapes braces awkwardly.

### toast
- **High (Cross-cutting)** — Dismiss button is `size-5` (`toast-component.ts:26`). Interactive → square-target scale (xs → `size-6`). Bump container; keep inner SVG `size-4`.
- **Medium** — Demo `toast-api.component.ts` doesn't document `TW_TOAST_DATA`/`TW_TOAST_REF` tokens. Add a "Tokens" subsection.

### tooltip
- **High (Cross-cutting)** — Sets `aria-describedby` via raw `setAttribute` (`tooltip.ts:449-452`) but demo claims `AriaDescriber` use. Refactor to CDK `AriaDescriber.describe`/`removeDescription` to dedupe describedbys.
- **Medium** — `twTooltipHideDelay = input(0)` (`tooltip.ts:328`) asymmetric with show delay; document.

### Batch patterns
- **Overlay AT primitives inconsistent.** Popover uses raw aria-haspopup/expanded/controls + manual focus restore + `FocusTrapFactory`; tooltip uses raw `setAttribute('aria-describedby')`; toast correctly uses `LiveAnnouncer`. Migrate tooltip to CDK `AriaDescriber`.
- **JSDoc → demo API drift.** progress-bar, stat, popover, toast, tooltip all paraphrase. Adopt verbatim-mirror pass.
- **`@source inline(...)` safelist is load-bearing** for toast's interpolated `bg-${severity}-soft` classes. Document near the compound-variant map.
- **Square-interactive-target scale drift** (toast dismiss `size-5` vs `size-6`). Audit other overlay close affordances.
- **Boolean `true` defaults** in popover (4 inputs) inline-justified but not codified.

---

## Batch 8 — Content / Data (accordion, collapsible, table, sort, carousel, flip-card, code-block, segmented-control)

### accordion
- **High** — `'single'` mode never emits `aria-multiselectable="false"` (`accordion.ts:65`). ARIA APG expects an explicit value.
- **Medium** — `<pre>` raw blocks bypass `tw-code-block` (`accordion-overview.component.ts:86, 98` and `accordion-api.component.ts:81`).
- **Medium** — `host: { role: 'group' }` (`accordion.ts:63`) — APG recommends no role on wrapper.
- **Low** — `value = model<string | string[]>('')` empty-string default awkward for `'multiple'` mode (`accordion.ts:88`).

### collapsible
- **High** — `<pre>` raw `<code>` blocks instead of `tw-code-block` (multiple in `projects/demo/src/app/routes/collapsible/**`).
- **Medium** — `ViewEncapsulation.None` on `CollapsibleTriggerDirective` (`collapsible.ts:162`) needs justification comment.
- **Medium** — `CollapsibleGroupComponent` with `accordion=true` ~95% duplicates `AccordionComponent` (`collapsible.ts:454-503` vs `accordion.ts:168-212`). Consolidate.

### table
- **High** — `TwCellDefDirective`, `TwHeaderCellDefDirective`, `TwFooterCellDefDirective`, `TwNoDataRowDirective`, `TwRowExpansionDirective` (`table.ts:545, 560, 575, 600, 604`) — `Tw*` class-name violations. Add to PR4/PR6 rename plan.
- **High** — `backdrop-blur-[1px]` arbitrary value (`table.ts:353`); use `backdrop-blur-sm`.
- **High** — `[&>thead>tr>th]:shadow-[0_1px_0_0_var(--color-border)]` arbitrary shadow (`table.ts:445`); tokenize.
- **Medium** — Loading announcement `effect` uses `untracked` to avoid re-firing (`table.ts:1207-1223`) — brittle.
- **Medium** — `data-label` stack-mode `::before` may read label twice with screen readers (`table.ts:493-497`).
- **Low** — `INTERACTIVE_TAGS` set missing `'OPTION'` (`table.ts:516`).

### sort
- **Critical** — `size-3.5` xs arrow icon ships **without** the mandated half-step justification comment (`sort-header.ts:64`).
- **High** — `<pre>` raw block in examples event log (`sort-examples.component.ts:425`).
- **High** — Aliased every signal output/input (`sort.ts:83`) makes JSDoc-to-Compodoc mapping noisy.
- **Medium** — `effect` in constructor calls `ariaDescriber.describe` (`sort-header.ts:178-187`); could use `afterNextRender` once.
- **Low** — Component uses three lifecycle interfaces; could move to `afterNextRender` + DestroyRef (`sort-header.ts:136`).

### carousel
- **High** — `bg-black/40` deliberate raw color (`carousel.ts:206-208, 259`); define a semantic `overlay-control` token instead.
- **High** — `bg-{role}-solid`/`text-{role}-solid-fg` tokens (`carousel.ts:122-153`) — verify all 24 names exist in `theme/_semantic.css`.
- **Medium** — `_onPointerUp` reads `start` after nulling `this._dragStart` (`carousel.ts:1286-1294`); document closure capture.
- **Low** — `_effectiveSlidesToScrollView()` redundant with signal (`carousel.ts:568`).

### flip-card
- **Medium** — `aria-live='polite'` only in `'manual'` mode (`flip-card.ts:186, 252-264`); interactive mode toggles content silently. Announce via `LiveAnnouncer`.
- **Medium** — `MutationObserver` on `backWrapper` (`flip-card.ts:242-250`) is heavy; use `contentChild()` with `read: ElementRef`.
- **Medium** — Custom Tailwind classes (`tw-flip-perspective` etc., `flip-card.ts:34-63`) silently break if theme CSS not imported. Document hard dependency.

### code-block
- **Medium** — Outer host missing role; inner `<pre role="region" tabindex="0">` (`code-block.ts:107`) handles a11y but consumers may expect outer surface to be a region.
- **Medium** — `isCopied` is private signal; `model()` would let consumers observe (`code-block.ts:141`).
- **Low** — `copyToClipboard()` silently swallows failure (`code-block.ts:182-194`).
- **Low** — `CodeBlockHeaderDirective` host class duplicates `headerStart` slot (`code-block.ts:41`).

### segmented-control
- **High** — `ACTIVE_CLASSES`/`INACTIVE_CLASSES` live OUTSIDE the `tv()` config (`segmented-control.ts:63-102`); should be `compoundVariants` for single-source styling.
- **Medium** — `forwardRef(() => SegmentedControlComponent)` without `{ optional: false }` opaque failure if option rendered outside parent (`segmented-control.ts:130`).
- **Low** — `rootClass`/`optionClass` inputs duplicate normal Angular class binding (`:213, :216`).

### Batch patterns
1. **Raw `<pre>` blocks in demo pages.** accordion, collapsible, sort, segmented-control all bypass `tw-code-block`. #1 demo violation. Recommend a CI lint rule: `grep <pre routes/**`.
2. **`Tw*`-prefixed directive/component classes.** Table exports 5 such directives. Add to PR4/PR6 rename plan with `SplitComponent` family.
3. **Missing inline justification on `size-3.5` half-step** (`sort-header.ts:64`) — codified exception case without the required comment.
4. **Duplicate group orchestration** between `AccordionComponent.toggleItem` and `CollapsibleGroupComponent.toggleItem`. Consolidate.
5. **Arbitrary value escape hatches** (`backdrop-blur-[1px]`, `shadow-[0_1px_0_0_var(--color-border)]`, `bg-black/40`) in table and carousel. Define semantic tokens.

---

# Cross-library themes (consolidated)

These patterns showed up in **multiple batches** and represent the highest-leverage cleanups:

## 1. `Tw*` class-name violations beyond the codified list — **Blocker**

CLAUDE.md forbids `Tw*` prefixes on component/directive classes (only types like `TwColor`/`TwSize` keep the prefix). Codified exceptions: `TwSplit*` family, `TwCalendarPresets` (and `TwCalendarPresets` has actually been renamed to `CalendarPresetsDirective` — update CLAUDE.md).

**New violations to clean up:**
- Dialog (Batch 4): `TwDialogContainer`, `TwDialogHeaderDirective`, `TwDialogIconDirective`, `TwDialogTitleDirective`, `TwDialogSubtitleDirective`, `TwDialogDescriptionDirective`, `TwDialogContentDirective`, `TwDialogActionsDirective`, `TwDialogCloseDirective`.
- Table (Batch 8): `TwCellDefDirective`, `TwHeaderCellDefDirective`, `TwFooterCellDefDirective`, `TwNoDataRowDirective`, `TwRowExpansionDirective`.

Sibling `sheet` directives correctly omit the prefix — dialog↔sheet asymmetry confirms intent. Single rename PR resolves both.

## 2. `text-base` used outside the codified `tw-item lg` carve-out

- `SheetTitleDirective` (`sheet-content.ts:70`)
- `TwDialogTitleDirective` (`dialog-content.ts:71`)
- Possibly `stepper` step labels (`stepper.ts:91, 95`) — verify treated as trigger role
- `stat` lg/xl value sizes (`stat.ts:107, 115`) — borderline justified as dominant KPI tile

Either move to `text-sm font-semibold` or codify additional carve-outs in CLAUDE.md.

## 3. Boolean `true` defaults without codified rationale

CLAUDE.md requires either inline-comment justification OR membership in the codified list. Violations / drift:
- `stepper.showError`, `stepper.headerInteractive` (Batch 4) — no rationale, no codification.
- `time-picker.showSteppers`, `time-picker.showClear` (Batch 2) — inline-justified but not on canonical list.
- `popover.*` four booleans (Batch 7) — same.
- `spinner.track` (Batch 6) — codified but JSDoc lacks the *why*.

**Fix:** sweep all `input(true)` declarations; add a one-line rationale comment OR add to the codified list in CLAUDE.md.

## 4. `size-3.5` half-step icon missing per-use justification

CLAUDE.md mandates a one-line comment per use. Missing on:
- `sort-header.ts:64` — Critical (canonical case)
- `paginator.ts:275` — High
- `alert.ts:175` (template inline SVG) — High

Establish a CI lint: any `size-3.5` not preceded by `// ` comment is a violation.

## 5. Raw `<pre>` blocks in demo pages

`tw-code-block` is the canonical snippet component. The library's own docs bypass it in: accordion, collapsible, sort, segmented-control. Recommend `grep '<pre ' projects/demo/src/app/routes/**` CI check.

## 6. Hand-rolled roving keyboard navigation

CLAUDE.md: "Compose Angular CDK, don't reinvent it." Violations:
- `tabs` (Batch 5)
- `tab-nav` (Batch 5) — manual `document.activeElement` scan
- `paginator` (Batch 5)

Standardise on `FocusKeyManager`.

## 7. Overlay primitive duplication

- `select` ↔ `combobox`: overlay positions, scroll-strategy resolver, auto-naked detection (Batch 2).
- `date-picker` ↔ `date-range-picker`: trigger chrome, overlay positions, focus-trap, ID generation, animation constant (Batch 3).
- `tabs` ↔ `tab-nav`: ~110 lines of trigger `tv()` + active-state maps (Batch 5).
- `dialog` ↔ `sheet`: ~80% of plumbing (animation lifecycle, aria-described-by, DOM walks, panelClass merge) (Batch 4).
- `accordion` ↔ `collapsible-group` (Batch 8).

Extract shared bases into `ngx-tw/core` or per-domain shared modules.

## 8. `duration-normal` non-canonical

Used in tabs, tab-nav, paginator, menu, command-palette, progress-bar. Token exists in `theme/_typography.css:8` (200ms) but CLAUDE.md cites only `duration-150`/`duration-200`. Either codify or replace with `duration-200`.

## 9. Demo doc-page section canon drift

- Missing **Variants** section: select (`variant: default | naked`), form-field (calls it "Appearance").
- Missing **Template-driven forms** section: textarea, calendar, date-picker, date-range-picker (all CVA components).
- Missing **Playground** section: textarea, calendar, breadcrumbs.
- Missing **Accessibility** section: button.
- Section title pollution: calendar uses `(§21.2)` / `(§10.1)` impl refs.
- Non-canonical section title: form-field "Appearance" → "Variants"; combobox "Disabled state" → "States".

## 10. JSDoc → demo API description drift

progress-bar, stat, popover, toast, tooltip, select, button all paraphrase library JSDoc rather than mirroring. Adopt verbatim-copy pass before each release.

## 11. Error-state matcher gap across form controls

`input`, `textarea`, `checkbox`, `slider` wire `TW_ERROR_STATE_MATCHER`; `radio`, `switch` do not. Pick one and apply uniformly — six form controls advertising the same forms compatibility must share the same error machinery.

## 12. CVA registration pattern drift

`NG_VALUE_ACCESSOR` + `forwardRef` (switch, radio-group, select, combobox) vs runtime `this.ngControl.valueAccessor = this` (checkbox, slider, date-picker, time-picker). Pick one and document.

---

# Suggested PR sequencing

1. **PR-A — Rename `Tw*` directives/components.** Dialog (9 names) + table (5 names). Update public-api barrel. Update CLAUDE.md to reflect that `TwCalendarPresets` has already been renamed.
2. **PR-B — Sweep `text-base` violations.** Sheet title, dialog title, stepper step labels. Either step down to `text-sm font-semibold` or codify carve-outs.
3. **PR-C — Boolean-default rationale sweep.** Add inline comments OR update CLAUDE.md codified list. Cover stepper, time-picker, popover, spinner.
4. **PR-D — Half-step icon comments.** sort-header, paginator, alert. Add CI lint to enforce.
5. **PR-E — Migrate raw `<pre>` to `tw-code-block`.** accordion, collapsible, sort, segmented-control docs. CI lint.
6. **PR-F — Adopt `FocusKeyManager`.** tabs, tab-nav, paginator.
7. **PR-G — Extract overlay primitive shared bases.** Highest-impact targets: date-picker/range-picker base, select/combobox base, dialog/sheet base, tabs/tab-nav trigger variants.
8. **PR-H — `duration-normal` decision.** Codify in CLAUDE.md or replace with `duration-200`.
9. **PR-I — Demo doc-page coverage gaps.** Add missing Variants/Template-driven/Playground/Accessibility sections per Batch 5 + Batch 3 findings.
10. **PR-J — JSDoc verbatim mirror pass** across all API pages.
11. **PR-K — Error-state matcher parity** on radio, switch.
12. **PR-L — CVA registration convergence** (pick `NG_VALUE_ACCESSOR` + `forwardRef`).
13. **PR-M — Tooltip → CDK `AriaDescriber`.**
14. **PR-N — Targeted bug fixes:** tabs close button keyboard reachability, command-palette `activeIndex` stable-id keying, command-palette active/hover contrast, calendar/date-picker pre-1.0 deprecated surface removal.

---

# Headline findings (top 10)

1. **Blocker — Dialog directives carry `Tw*` prefix** outside codified list (9 names).
2. **Blocker — Paginator has ~20 inputs** with no codified exception.
3. **Blocker — command-palette `activeIndex`** resets to 0 on every upstream emission.
4. **Critical — `size-3.5` in sort-header** missing required justification (canonical case).
5. **High — Avatar `aria-hidden`** hides meaningful images from AT.
6. **High — Tabs close button keyboard-unreachable** (`tabindex="-1"` paired with keydown handlers).
7. **High — Paginator active state uses raw palette** (`text-white`, `bg-primary-600`).
8. **High — Tooltip uses raw `setAttribute('aria-describedby')`** instead of CDK `AriaDescriber`.
9. **High — Calendar/date-picker ship pre-1.0 deprecated surfaces** (3 never-firing outputs + 9 deprecated time inputs).
10. **High — Combobox uses raw palette** (`focus-within:outline-neutral-500`).
