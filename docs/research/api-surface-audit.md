# ngx-tw — Public API Surface Audit

**Date:** 2026-09-02 · **Branch:** `develop` @ `69d3711` · **Library version:** `@cdevhub/ngx-tw@0.5.0`
**Scope:** all 56 top-level secondary entry points + 3 sub-entry-points under `projects/ngx-tw/`.
**Method:** TypeScript compiler API walk of every shipped `.ts` (excluding `*.spec.ts` / `*.meta.ts`) — 227 classes.
The signal-factory reader mirrors `scripts/mcp/extract-api.mjs`, including the `input.required<T>()` /
`model.required<T>()` `.required` unwrap, so required members are not silently dropped.
**Rules of record:** `.claude/CLAUDE.md`. Read-only audit — no library file was modified.

---

## Findings summary

| # | Dimension | HIGH | MED | LOW | Total | Headline |
|---|---|---:|---:|---:|---:|---|
| 1 | JSDoc completeness | 0 | 3 | 3 | 6 | 2 undocumented signal members; 112 undocumented public methods; 107 inputs omit their default |
| 2 | Entry-point registration | 0 | 0 | 1 | 1 | **56/56 clean in all 4 registries** |
| 3 | Export hygiene | 1 | 3 | 1 | 5 | `PromiseMessages` unnameable by consumers; `core` leaks internal plumbing |
| 4 | Input count cap | 0 | 4 | 3 | 7 | 40 classes > 6 inputs; 6 outside every codified exception |
| 5 | Boolean `true` defaults | 0 | 2 | 1 | 3 | 30 in code vs 15 on the allow-list; 1 listed input missing its justification |
| 6 | Naming conventions | 0 | 3 | 1 | 4 | `TwDialog*` family; `[tw-sort-header]`; `theme.service.ts` / `theme.directive.ts` |
| 7 | Shared-type usage | 0 | 1 | 2 | 3 | `ProgressBarSize` hand-rolls the shared size axis |
| 8 | CLAUDE.md accuracy | 1 | 7 | 4 | 12 | Wrong component path; stale `TwSplit*`, `showAdjacentMonths`, split counts, table exception |
| | **Total** | **2** | **23** | **16** | **41** | |

**The two HIGH findings:** F3.1 (`PromiseMessages` unexported — breaks consumer TypeScript) and F8.1
(CLAUDE.md sends an agent to a component path that does not exist).

**Overall.** The API surface is in strong shape. Input/output/model JSDoc coverage is 99.7% (2 misses out of
~740 members, both on a directive that is not exported from its entry point), entry-point registration is
perfect at 56/56 across all four registries, and no consumer-facing type in any `input()`/`output()`/`model()`
signature is unexported. The real debt is concentrated in three places: (a) undocumented public *methods*,
(b) a normative spec that has drifted materially from the code it governs, and (c) `core/index.ts` acting as
a cross-entry-point plumbing channel that is also, unavoidably, public API.

---

## 1. JSDoc completeness

Compodoc parses these to build the demo's API tables, so a miss renders as an empty cell.

### 1.1 Undocumented `input()` / `output()` / `model()` — 2 of ~740 — **LOW**

```
projects/ngx-tw/tabs/tabs.ts:209 — TabTriggerElementDirective.isActive   (input)
projects/ngx-tw/tabs/tabs.ts:210 — TabTriggerElementDirective.isDisabled (input)
```

`TabTriggerElementDirective` is **not** exported from `projects/ngx-tw/tabs/index.ts` (which exports only
`TabsComponent`, `TabComponent`, `TabTriggerDirective`, `TabContentDirective`), so these never reach a
consumer or an API table. LOW rather than MEDIUM for that reason — but they are the only two signal members
in the entire library without JSDoc, so closing them makes the rule 100% mechanically enforceable.

### 1.2 Undocumented public methods — 112 — **MEDIUM**

CLAUDE.md requires JSDoc on "public methods on directives/services". 110 of the 112 sit on a class exported
from its entry point's `index.ts`. `@internal`-tagged and lifecycle/CVA methods are already excluded.
They fall into three distinct groups with different fixes:

**(a) Date-adapter contract — 63 methods.** This is the largest single block and the one most visible to
consumers, since implementing a custom `DateAdapter` is a documented extension point.

| Class | Count | File |
|---|---:|---|
| `NativeDateAdapter` | 31 | `projects/ngx-tw/calendar/native-date-adapter.ts` |
| `LuxonDateAdapter` | 22 | `projects/ngx-tw/calendar/luxon/luxon-date-adapter.ts` |
| `DateAdapter` (abstract) | 10 | `projects/ngx-tw/calendar/date-adapter.ts` |

The 10 on the abstract base are the ones that matter — they define the contract a consumer must implement.
Anchors: `projects/ngx-tw/calendar/date-adapter.ts:86,90,91,95,99,100,135,136,143,147` —
`getLocale`, `getMonth`, `getDate`, `getNumDaysInMonth`, `getMinutes`, `getSeconds`, `addMonths`, `addDays`,
`addMinutes`, `sameDate`. The 53 concrete overrides inherit meaning from the base and are LOW by comparison.

**(b) Calendar selection strategies — 24 methods.** 6 each on `SingleSelectionStrategy`,
`MultiSelectionStrategy`, `RangeSelectionStrategy`, `WeekSelectionStrategy` in
`projects/ngx-tw/calendar/selection/`. All four extend the exported `CalendarSelectionStrategy` base and are
themselves exported — another documented extension point.

**(c) Component template handlers — 22 methods.** Public only because TypeScript defaults to public; they are
called from templates, not by consumers. The correct fix is `protected` or `@internal`, not a JSDoc line —
marking them would also shrink the demo's API tables to the real surface.

```
projects/ngx-tw/button/button.ts:214              — ButtonDirective.handleClick()
projects/ngx-tw/collapsible/collapsible.ts:197    — CollapsibleTriggerDirective.onClick()
projects/ngx-tw/collapsible/collapsible.ts:201    — CollapsibleTriggerDirective.onKeydown()
projects/ngx-tw/collapsible/collapsible.ts:215    — CollapsibleTriggerDirective.focus()
projects/ngx-tw/item/item.ts:183                  — ItemComponent.onActivate()
projects/ngx-tw/item/item.ts:188                  — ItemComponent.onKeydown()
projects/ngx-tw/paginator/paginator.ts:436        — PaginatorFocusableDirective.focus()
projects/ngx-tw/radio/radio.ts:703                — RadioGroupComponent.onKeydown()
projects/ngx-tw/segmented-control/segmented-control.ts:197 — SegmentedControlOptionComponent.select()
projects/ngx-tw/segmented-control/segmented-control.ts:202 — SegmentedControlOptionComponent.focus()
projects/ngx-tw/segmented-control/segmented-control.ts:283 — SegmentedControlComponent.selectOption()
projects/ngx-tw/segmented-control/segmented-control.ts:293 — SegmentedControlComponent.onKeydown()
projects/ngx-tw/stepper/stepper.ts:513            — StepperComponent.onHeaderClick()
projects/ngx-tw/tabs/tabs.ts:214                  — TabTriggerElementDirective.focus()
projects/ngx-tw/tabs/tabs.ts:343                  — TabsComponent.getTabId()
projects/ngx-tw/tabs/tabs.ts:347                  — TabsComponent.getPanelId()
projects/ngx-tw/tabs/tabs.ts:353                  — TabsComponent.isTabActive()
projects/ngx-tw/tabs/tabs.ts:357                  — TabsComponent.shouldRenderPanel()
projects/ngx-tw/tabs/tabs.ts:368                  — TabsComponent.selectTab()
projects/ngx-tw/tabs/tabs.ts:389                  — TabsComponent.closeTab()
projects/ngx-tw/tabs/tabs.ts:480                  — TabsComponent.scrollStart()
projects/ngx-tw/tabs/tabs.ts:491                  — TabsComponent.scrollEnd()
projects/ngx-tw/calendar/month-view.ts, year-view.ts, multi-year-view.ts — 1 each
```

`TabsComponent.selectTab()` / `.closeTab()` are the exception in this group: they read as genuine imperative
API a consumer would call from a `viewChild()` reference, and deserve real JSDoc rather than `@internal`.

### 1.3 Inputs whose JSDoc omits the stated default — 107 — **MEDIUM**

CLAUDE.md: JSDoc on an `input()` must give "what it controls **+ default**". 107 documented, non-required
inputs with a non-trivial literal default never say what that default is. Concentration by entry point:

| Entry point | Count | | Entry point | Count |
|---|---:|---|---|---:|
| `calendar` | 37 | | `select` | 6 |
| `combobox` | 25 | | `tab-nav` | 4 |
| `date-range-picker` | 10 | | 12 others | 1–2 each |
| `date-picker` | 7 | | | |

39 of the 107 default to `false`. Since `false` is the library-wide boolean convention (CLAUDE.md:
"Boolean inputs default to `false`"), those are arguably self-evident — **LOW**. The remaining **68 carry a
non-obvious default that is invisible in the API table** and are the MEDIUM half. Highest-value examples:

```
projects/ngx-tw/combobox/combobox.ts:404 — ComboboxComponent.queryDebounce   default=150
projects/ngx-tw/combobox/combobox.ts:415 — ComboboxComponent.panelMaxHeight  default=256
projects/ngx-tw/combobox/combobox.ts:424 — ComboboxComponent.scrollStrategy  default='reposition'
projects/ngx-tw/combobox/combobox.ts:427 — ComboboxComponent.offset          default=4
projects/ngx-tw/combobox/combobox.ts:430 — ComboboxComponent.emptyMessage    default='No results'
projects/ngx-tw/combobox/combobox.ts:433 — ComboboxComponent.compareWith     default=Object.is
projects/ngx-tw/calendar/calendar.ts:322 — CalendarComponent.modeInput       default='single'
projects/ngx-tw/calendar/calendar.ts:382 — CalendarComponent.maxSelectionBehavior default='emit-limit-reached'
projects/ngx-tw/calendar/calendar.ts:398 — CalendarComponent.rangeClickBehavior   default='restart'
projects/ngx-tw/calendar/calendar.ts:434 — CalendarComponent.resetBehavior    default='full'
projects/ngx-tw/date-picker/date-picker.ts:467–476 — todayLabel/clearLabel/cancelLabel/applyLabel
                                                     default='Today'/'Clear'/'Cancel'/'Apply'  (i18n-relevant)
projects/ngx-tw/date-range-picker/date-range-picker.ts:392,395 — emptyStartLabel/emptyEndLabel
                                                     default='Start date'/'End date'
projects/ngx-tw/select/select.ts:506 — SelectComponent.emptyMessage          default='No results'
projects/ngx-tw/stat/stat.ts:452     — StatComponent.variant                 default='outlined'
projects/ngx-tw/textarea/textarea.ts:138 — TextareaDirective.resize          default='vertical'
```

The i18n-facing label defaults (`'Today'`, `'Clear'`, `'Apply'`, `'No results'`, `'Start date'`) are the most
consequential — a consumer localizing the library needs to see the English string in the API table to know it
exists at all.

### 1.4 JSDoc restating the TypeScript type — 0 genuine — **cleared**

A heuristic flagged 8 candidates; all 8 were read and cleared. Each opens with a type-shaped word but
immediately describes behavior, which is what CLAUDE.md asks for. Representative:

```
projects/ngx-tw/skeleton/skeleton.ts:105 — SkeletonComponent.lines
  "Number of stacked text rows to render. Only applies when `shape` is `'text'`. Values greater than 1
   render N rows in a vertical stack…"          ← purpose + behavior, not a type restatement
```

**No action.** Recorded so a future audit does not re-raise them.

### 1.5 JSDoc stating the *wrong* default — 0 genuine — **cleared**

25 candidates where the "Defaults to X" literal did not string-match the initializer. All 25 were verified by
reading the source; **every one is accurate.** Two benign patterns account for all of them:

- **Prose naming the resolved default while the literal is `undefined`/`null`** — deliberate, and correct.
  `radio.ts:245-251` (`color`/`size`/`variant` inherit from the parent group, "or defaults to `'primary'`
  standalone"), `select.ts:485` (`variant` auto-resolves to `'naked'` inside a `tw-form-field`),
  `time-picker.ts:535` (`placeholder` resolves to `'--'`), `calendar.ts:335` (`startAt` → today on mount).
- **Prose naming the value behind a named constant** — verified equal in every case.
  `aspect-ratio.ts:95` → `DEFAULT_RATIO = '1 / 1'` ✓ · `tags-input.ts:245` → `DEFAULT_SEPARATORS =
  ['Enter', ',']` ✓ · `combobox.ts:370` → `defaultStartsWithFilter` genuinely lower-cases both sides and
  calls `startsWith`, matching "case-insensitive `startsWith` on the label" ✓.

**No action.** This is the class of finding that would have been silently-wrong docs; there are none.

---

## 2. Entry-point registration consistency

### 2.1 The four registries — all green

`docs/production-audit.md:36` claims "Secondary entry points registered in all 4 required places — **56/56**".
The four places are, and remain:

| # | Registry | Enforced by | Result |
|---|---|---|---|
| 1 | `<name>/ng-package.json` = `{"lib":{"entryFile":"index.ts"}}` | ng-packagr | **56/56** — byte-identical across all 56 |
| 2 | `<name>/index.ts` re-exporting the public API | ng-packagr | **56/56** |
| 3 | Root barrel `projects/ngx-tw/src/public-api.ts` | `scripts/build-mcp-index.mjs:entryPointNames()` | **56/56**, no orphans either way |
| 4 | `<name>/<name>.meta.ts` (guidance layer) | `scripts/verify-mcp-index.mjs` check 1, both directions | **56/56** |

Set-differenced in both directions; no entry point missing from any registry, and no registry entry lacking a
directory. `verify-mcp-index.mjs` check 1 already enforces #3 ⇄ #4 bidirectionally at release time, and
`scripts/verify-package.mjs:157` enforces reachability through the built `exports` map (59 = 56 + 3 sub).

**Root `tsconfig.json` is not a fifth registry.** Its `paths` entry is a wildcard
(`"@cdevhub/ngx-tw/*": ["./dist/ngx-tw/*"]`) — it cannot be missing a per-component entry, so there is
nothing to verify. Worth stating explicitly so a future audit does not go looking.

**Demo routes are an advisory fifth surface.** All 56 entry points have a demo route under
`projects/demo/src/app/routes/` except `core`, which is a types-and-tokens entry point with no visual
surface. `verify-mcp-index.mjs` check 5 already treats snippet coverage as WARN-only. Correct as-is.

### 2.2 Sub-entry-points are deliberately second-class — **LOW (informational)**

Three nested entry points carry their own `ng-package.json` but appear in **neither** the root barrel nor the
meta layer:

```
projects/ngx-tw/calendar/luxon/ng-package.json     → @cdevhub/ngx-tw/calendar/luxon
projects/ngx-tw/calendar/testing/ng-package.json   → @cdevhub/ngx-tw/calendar/testing
projects/ngx-tw/icon/lucide/ng-package.json        → @cdevhub/ngx-tw/icon/lucide
```

This is intentional, not an omission: `verify-mcp-index.mjs` builds a `SUB_ENTRIES` set specifically so these
resolve as valid import targets in snippets, while check 1 requires meta only for top-level names. The shape
matches the `@angular/material/testing` convention (optional adapters + test harnesses stay out of the
headline API). **The headline count is therefore 56 top-level + 3 sub = 59 published entry points**, which is
exactly what `verify-package.mjs` asserts. No action; recorded to disambiguate "every component directory".

---

## 3. Export hygiene

### 3.1 `PromiseMessages` is not exported but appears in a public method signature — **HIGH**

```
projects/ngx-tw/toast/toast.ts:28   interface PromiseMessages<T> { … }     ← no `export` keyword
projects/ngx-tw/toast/toast.ts:126  promise<T, R = void>(
                                      promise: Promise<T>,
                                      messages: PromiseMessages<T>,        ← public, documented API
                                      config?: ToastConfig<unknown, R>,
                                    ): ToastRef<unknown, R>
```

`ToastService.promise()` is documented public API, and `ToastService` is exported from
`projects/ngx-tw/toast/index.ts:1`. `PromiseMessages` is module-private — it carries no `export` keyword at
all, so it is unreachable even by a deep import, and `toast/index.ts` (which carefully re-exports
`ToastUpdatePatch`, `ToastSeverity`, `ToastPosition`, `ToastState`, `ToastDismissReason`, `ToastDismissal`,
`ToastTemplateContext`, `ToastAction`, `ToastContent`) cannot re-export it.

**Consumer impact.** Passing an object literal inline still compiles, so this is not a hard build break — but
a consumer cannot name the type. Every one of these fails:

```ts
const messages: PromiseMessages<User> = { … };            // cannot import the type
function buildMessages<T>(): PromiseMessages<T> { … }     // cannot annotate a factory's return
type MyMessages = Omit<PromiseMessages<User>, 'loading'>; // cannot derive from it
```

Any consumer factoring their toast messages into a helper — the normal thing to do once more than one call
site uses `promise()` — hits this immediately and must hand-copy the interface. This is the one finding in
the audit that silently degrades consumer TypeScript.

**Fix:** add `export` at `toast.ts:28` and re-export as `type PromiseMessages` from `toast/index.ts`.
Consider renaming to `TwPromiseMessages` for consistency with the entry point's other exported types.

### 3.2 Types referenced by public methods but not exported — 4 — **MEDIUM / LOW**

```
projects/ngx-tw/command-palette/command-palette.ts:650 — CommandPaletteComponent.selectItem(item: ResolvedItem)
projects/ngx-tw/command-palette/command-palette.ts:659 — CommandPaletteComponent.setActiveItem(item: ResolvedItem)
    ResolvedItem declared command-palette.ts:51, not exported from command-palette/index.ts
projects/ngx-tw/slider/slider.ts:816 — SliderComponent.onThumbPointerDown(event, thumb: ThumbId)
projects/ngx-tw/slider/slider.ts:864 — SliderComponent.onThumbKeyDown(event, thumb: ThumbId)
    ThumbId declared slider.ts:66, not exported from slider/index.ts
```

Unlike 3.1 these are **not** intended consumer API — the command-palette pair sits under an explicit
`// ── Internal wiring (used by overlay) ──` banner at `command-palette.ts:648`, and the slider pair are
template event handlers. But they are public TypeScript with JSDoc on exported components, so Compodoc
documents them and the demo API table advertises a parameter type nobody can name.

**Fix:** tag all four `@internal` (the pattern `paginator.ts:857,867` already uses correctly for `goTo` /
`onLinkClick`, which is why `PageChangeSource` is *not* a finding here), or `protected` them.

### 3.3 `core/index.ts` publishes cross-entry-point plumbing — **MEDIUM**

Secondary entry points cannot import each other's private files, so shared implementation must transit a
public entry point. `core` is that channel, and the cost is that ~30 internal symbols are permanent public
API. `projects/ngx-tw/core/index.ts` exports, among others:

```
PickerOverlayCoordinator, PICKER_ENTER_DURATION, PICKER_LEAVE_DURATION     (core/index.ts:25–29)
OverlayContainerCoordinator, OverlayContainerState,
  OverlayContainerAnimationEvent                                            (core/index.ts:38–40)
AriaIdQueue, OVERLAY_ANIMATION_FALLBACK_PADDING,
  coerceOverlayDuration, mergeOverlayPanelClass                             (core/index.ts:33–36)
tabTriggerVariants, getActiveTriggerClasses, getInactiveTriggerClasses,
  UNDERLINE_ACTIVE_HORIZONTAL, UNDERLINE_ACTIVE_VERTICAL,
  ENCLOSED_ACTIVE_HORIZONTAL, ENCLOSED_ACTIVE_VERTICAL,
  PILL_ACTIVE, INACTIVE_TRIGGER_CLASSES                                     (core/index.ts:41–52)
padTwo, to12h, from12h, fieldMax, fieldMin, appendDigit,
  isTerminalDigit, stepWithWrap, clamp, parseField, timeOfDaySeconds        (core/index.ts:54–67)
```

Two specific problems:

1. **`tabTriggerVariants` is an exported `tv()` config**, which CLAUDE.md forbids outright: *"Define a `tv()`
   config per component, co-located in the same file. **Do not export variant configs.**"* Declared at
   `projects/ngx-tw/core/tab-trigger-variants.ts:24`, exported at `core/index.ts:42`. The structural
   justification is real (tabs, tab-nav and segmented-control must share one class table so Tailwind's v4
   scanner sees static strings), but the rule as written has no carve-out for it.
2. **`@internal` tagging is inconsistent within the same file.**
   `INACTIVE_TRIGGER_CLASSES` (`tab-trigger-variants.ts:141`) *is* `@internal`-tagged; `tabTriggerVariants`
   (`:24`), `PickerOverlayCoordinator`, `OverlayContainerCoordinator`, `AriaIdQueue` and the whole
   `time-utils` family are not. So Compodoc documents most of the plumbing and hides one arbitrary constant.

**Fix:** pick one policy — `@internal` on everything in `core` that exists only to serve other entry points —
and add a codified carve-out to CLAUDE.md for the shared-`tv()` case, or move the shared table behind an
`@internal`-tagged export. Nothing here breaks consumers today; it inflates the documented surface.

### 3.4 No unexported type in any binding signature — **cleared**

Every named type referenced by a public `input()`, `output()` or `model()` type argument across all 227
classes resolves to an export of its own entry point or of `@cdevhub/ngx-tw/core`. Identifiers were extracted
token-wise from type text (so `readonly TransferItem[]`, `TwColor | 'custom'`, `CalendarValue<M, D>` are
covered, not just whole-string matches) and resolved transitively through `export *` chains.

The scan has one structural blind spot — a factory called without an explicit type argument yields no type
text to scan — so it was closed directly: **all 95 `output()` declarations in the library carry an explicit
type argument; zero are bare `output()`.** Nothing is hidden from the scan by inference.

**Zero findings** — this is the export-hygiene class that would most directly break consumers, and it is
clean.

---

## 4. Input count cap

Counting rule: **`input()` + `model()`, public, non-`@internal`, per class** (CLAUDE.md counts per class — its
`split` row cites `SplitComponent` and `SplitPaneComponent` separately). Host-directive re-exposures and
inputs inherited from **external** bases (`CdkStepper`, `CdkDialogConfig`) are excluded — real surface, but
not this library's to document or cap. Inputs inherited from **library** bases are counted once at the base
and again in the subclass total, with the source shown.

**Calibration against CLAUDE.md's own stated numbers** (run before generating the table):
`paginator` → 18 inputs + 2 models = **20** vs "~20" ✓ · `checkbox` → 14 inputs + 2 models = **16** vs
"12+" ✓ · `split` → `SplitComponent` **8**, `SplitPaneComponent` **7** vs "10 + 8" ✗ (see F8.4).

40 classes exceed 6. 34 fall inside a codified exception. The 6 that do not:

| Class | Inputs | File | Verdict |
|---|---:|---|---|
| `CarouselComponent` | 16 | `projects/ngx-tw/carousel/carousel.ts:420` | **MEDIUM** — no exception fits |
| `TabNavComponent` | 8 | `projects/ngx-tw/tab-nav/tab-nav.ts:95` | **MEDIUM** — see below |
| `SortHeaderComponent` | 8 | `projects/ngx-tw/sort/sort-header.ts:127` | **MEDIUM** — arguably data-primitive |
| `BadgeComponent` | 7 | `projects/ngx-tw/badge/badge.ts:175` | **MEDIUM** — visual primitive, explicitly excluded |
| `SegmentedControlComponent` | 7 | `projects/ngx-tw/segmented-control/segmented-control.ts:209` | **LOW** — 1 over |
| `AccordionComponent` | 7 (5 own + 2 via `CollapsibleGroupComponent`) | `projects/ngx-tw/accordion/accordion.ts:65` | **LOW** — 1 over |

**`CarouselComponent` — 16 inputs — the one real outlier.** MEDIUM.

```
orientation, slidesPerView, slidesToScroll, gap, loop, autoplay, autoplayInterval,
pauseOnHover, pauseOnFocusIn, draggable, keyboard, snapAlign, activeIndex,
ariaLabel, ariaLabelledBy, labels
```

Not overlay-bearing, not a form control, not a structural-layout primitive, not a data primitive, not a
pagination surface — it matches none of the five exceptions, at 2.7× the cap. Three coherent config-object
clusters are visible and would bring it to ~7: autoplay (`autoplay`, `autoplayInterval`, `pauseOnHover`,
`pauseOnFocusIn`), interaction (`draggable`, `keyboard`), layout (`slidesPerView`, `slidesToScroll`, `gap`,
`snapAlign`). This is the same reshape `table` already received (§8.6).

**`BadgeComponent` — 7 inputs.** MEDIUM, because CLAUDE.md rules on this shape explicitly: *"Visual primitives
(avatar, icon) and decorative primitives (progress-bar) do **not** qualify — reshape with config objects."*
Badge is a visual primitive. Its `pill`, `dismissible`, `live`, `dismissLabel` cluster into one
`dismiss`/`appearance` object. Either reshape it or extend the exclusion sentence to admit it.

**`TabNavComponent` — 8 inputs.** MEDIUM as written. The "Navigation primitives" exception is worded entirely
around **pagination** ("boundary/sibling counts, page-size selector, first/last jump buttons… Material's
`MatPaginator`"), so it does not cover a tab-bar on a plain reading. Either broaden that row to cover
navigation generally, or fold `navClass` + `linkClass` + `labels` into one config object.

**`SortHeaderComponent` — 8 inputs.** MEDIUM. Sits closest to the "data primitive" exception (it exists only
to drive table sorting) but that row names `table` specifically and is marked temporary. Cheapest resolution
is to name `sort` alongside `table` in that row.

The other 34 are legitimate: overlay-bearing (`date-range-picker` 48, `date-picker` 37, `combobox` 33,
`select` 28, `calendar` 27, `time-picker` 24, `popover` 17, `command-palette` 13, `tooltip` 9), form controls
(`slider` 24, `tags-input` 18, `file-upload` 17, `checkbox` 16, `textarea` 16, `radio` 14, `transfer` 14,
`switch` 13, `radio-group` 12, `input` 9, `form-field` 7, the three `calendar-form-directives` at 8),
structural-layout (`split` 8, `split-pane` 7), data primitives (`table` 14, `ColumnComponent` 7), navigation
(`paginator` 20), and internal calendar view classes (`MonthViewComponent` 16, `CalendarViewBase` 14,
`YearViewComponent`/`YearsViewComponent` 14 each, `CalendarHeaderComponent` 7, `CalendarCellComponent`).

**Note on scale.** `DateRangePickerComponent` at **48** and `DatePickerComponent` at **37** are formally
excused twice over (overlay + form control), but they are 8× and 6× the cap. Nothing in CLAUDE.md caps an
excused component, so this is not a rule violation — flagging it as the largest concentration of API surface
in the library and the obvious candidate if the exception table is ever tightened.

---

## 5. Boolean `true` defaults

**30 boolean inputs default to `true`.** CLAUDE.md's codified allow-list names **14 inputs** (its 15th bullet
is a parenthetical note about `RangeBehaviorConfig`, not an input). Of those 14: **13 verified present, 1
does not exist.**

### 5.1 Allow-list entries verified against source — 13 of 14 ✓

```
✓ projects/ngx-tw/spinner/spinner.ts:139               SpinnerComponent.track
✓ projects/ngx-tw/accordion/accordion.ts:92            AccordionComponent.collapsible
✓ projects/ngx-tw/calendar/calendar.ts:413             CalendarComponent.bordered        ← but see 5.2
✓ projects/ngx-tw/command-palette/command-palette.ts:417,420,423,426
                                                       closeOnSelect / closeOnEscape /
                                                       closeOnBackdropClick / autoFocus
✓ projects/ngx-tw/popover/popover.ts:351,359,364,372   twPopoverArrow / twPopoverCloseOnOutside /
                                                       twPopoverCloseOnEscape / twPopoverTrapFocus
✓ projects/ngx-tw/time-picker/time-picker.ts:539,543   showSteppers / showClear
✗ calendar.showAdjacentMonths                          DOES NOT EXIST — see F8.2
```

That is 13 present + 1 absent = the 14 inputs the list names.

### 5.2 `calendar.bordered` is on the allow-list but carries no justification — **MEDIUM**

```
projects/ngx-tw/calendar/calendar.ts:412-413
  /** When `true`, the calendar renders with a border and a soft shadow. */
  readonly bordered: InputSignal<boolean> = input<boolean>(true);
```

No "Defaults to `true`", no rationale, and no `//` comment above it. CLAUDE.md requires the rationale
"documented in an inline JSDoc comment on the same input", and supplies the text to use ("embedded calendar
reads as bordered; the borderless variant is the special case"). This is the **only** `true`-default in the
library with no justification of any kind — every other one of the 30 has one. One-line fix.

### 5.3 Seventeen `true`-defaults are absent from the allow-list — **MEDIUM (spec, not code)**

All 17 **do** carry the required justification in source. The code follows the rule; the allow-list has not
kept up. Full list:

| Input | Anchor | Justification form |
|---|---|---|
| `CalendarHeaderComponent.canSwitchView` | `calendar/calendar-header.ts:119` | `//` |
| `CarouselComponent.pauseOnHover` | `carousel/carousel.ts:504` | JSDoc |
| `CarouselComponent.pauseOnFocusIn` | `carousel/carousel.ts:507` | JSDoc |
| `CarouselComponent.draggable` | `carousel/carousel.ts:510` | JSDoc |
| `CarouselComponent.keyboard` | `carousel/carousel.ts:513` | JSDoc |
| `ComboboxComponent.showChevron` | `combobox/combobox.ts:393` | `//` |
| `ComboboxComponent.clearable` | `combobox/combobox.ts:398` | `//` |
| `ComboboxComponent.openOnFocus` | `combobox/combobox.ts:412` | `//` |
| `DatePickerComponent.showClear` | `date-picker/date-picker.ts:461` | `//` |
| `DateRangePickerComponent.showClear` | `date-range-picker/date-range-picker.ts:429` | `//` |
| `PaginatorComponent.showFirstLastButtons` | `paginator/paginator.ts:500` | `//` |
| `PaginatorComponent.showPageInfo` | `paginator/paginator.ts:511` | `//` |
| `PaginatorComponent.hideOnEmpty` | `paginator/paginator.ts:516` | `//` |
| `StepperComponent.showError` | `stepper/stepper.ts:327` | `//` |
| `StepperComponent.headerInteractive` | `stepper/stepper.ts:332` | `//` |
| `ToastComponent.dismissible` | `toast/toast-component.ts:203` | `//` |
| `TooltipDirective.twTooltipArrow` | `tooltip/tooltip.ts:350` | `//` |

The allow-list is meant to be exhaustive ("The codified list:"), so as written all 17 read as violations.
Either append them or restate the rule as "must carry an inline justification" and drop the enumeration —
an enumerated list of this size will keep drifting. See F8.5.

### 5.4 The justification format is split 12 `//` vs 5 JSDoc — **LOW**

CLAUDE.md says both *"documented in an inline **JSDoc** comment on the same input"* (line 433) and
*"the same **inline-comment** justification"* (line 451). The library reads it both ways: 5 inputs put the
rationale inside the `/** */` block (carousel ×4, spinner, accordion, command-palette ×4), 12 put it in a
`// TRUE-default: …` line comment above.

This matters mechanically: **`//` comments are invisible to Compodoc**, so 12 rationales never reach the demo
API tables, while the 5 JSDoc ones do. Recommend standardizing on JSDoc (`Defaults to \`true\` — <reason>`),
which is both the stricter reading of line 433 and the one that surfaces in generated docs. Logged as a spec
ambiguity in §8.8.

---

## 6. Naming conventions

### 6.1 `Tw*`-prefixed classes — 4 — **MEDIUM**

CLAUDE.md: *"**Never** apply a `Tw*` prefix to component or directive class identifiers… Shared **types** are
the only identifiers that carry a `Tw` prefix."*

```
projects/ngx-tw/dialog/dialog.ts:44          — TwDialog        @Injectable() service   ← clearest violation
projects/ngx-tw/dialog/dialog-ref.ts:21      — TwDialogRef     class
projects/ngx-tw/dialog/dialog-config.ts:30   — TwDialogConfig  class
projects/ngx-tw/calendar/date-range.ts:8     — TwDateRange     class
```

`TwDialog` is a **service**, not a type — it is the one unambiguous violation. `TwDialogRef`,
`TwDialogConfig` and `TwDateRange` are value classes used predominantly as types in consumer signatures
(`TwDialogRef<T>`, `TwDateRange<D>`), so they arguably fall under the "shared types" allowance — but the rule
says *types*, and these are `class` declarations that consumers also instantiate.

Compounding this: **CLAUDE.md's codified naming exception names `TwSplit*`, which no longer exists** (§8.3),
while this actually-present `TwDialog*` family is not mentioned at all. Either add a `TwDialog*` carve-out
(they mirror CDK's `DialogRef`/`DialogConfig` naming, which is a defensible reason) or rename
`TwDialog` → `DialogService`.

### 6.2 `[tw-sort-header]` uses dash-case for an attribute selector — **MEDIUM**

```
projects/ngx-tw/sort/sort-header.ts:127 — SortHeaderComponent  selector: '[tw-sort-header]'
```

CLAUDE.md: *"attribute selectors keep the `tw` camelCase prefix (`twBadge`)"*. Every other attribute
directive in the library complies (`twBadge`, `twTooltip`, `twInput`, `twTabLink`, `twStepperNext`, …); this
is the sole dash-case attribute selector. It mirrors Material's `[mat-sort-header]`, which is presumably why
it was written this way, but that is not the documented convention here. Renaming is a breaking change for
consumers, so the realistic options are a codified exception or a deprecation cycle supporting both.

### 6.3 `[data-tw-paginator-focusable]` — **LOW**

```
projects/ngx-tw/paginator/paginator.ts:426 — PaginatorFocusableDirective
```

A `data-` attribute marker used internally for focus management, not a consumer-facing directive selector.
Defensible; noted only so a mechanical selector check does not re-flag it.

### 6.4 Two files carry type suffixes — **MEDIUM**

```
projects/ngx-tw/theme/theme.service.ts
projects/ngx-tw/theme/theme.directive.ts
```

CLAUDE.md: *"Angular v22 style guide: bare names, no type suffixes — `button.ts`, `badge.ts`."* These are the
**only two** such files across all 56 entry points — every other entry point uses bare names (`button.ts`,
`toast.ts`, `dialog.ts`, `icon.registry.ts` notwithstanding). Renaming to `service.ts` / `directive.ts` would
be ambiguous, so `theme.ts` + a second file, or an explicit exception for the `theme` entry point, is the
practical fix. Purely internal — file names are not part of the published API.

### 6.5 Element selectors — clean

All component element selectors use the `tw-` prefix. A mechanical scan produced 21 apparent hits, all false
positives from **compound** `element[twAttribute]` selectors, which are correct and idiomatic:
`input[twInput]`, `textarea[twInput]`, `nav[twTabNav]`, `a[twTabLink]`, `button[twStepperNext]`,
`ng-template[twTabTrigger]`, and 15 more. **No violations.**

---

## 7. Shared-type usage (`TwColor` / `TwSize`)

Shared axes live at `projects/ngx-tw/core/types.ts:2` (`TwColor`) and `:13`
(`TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'`). 101 `color`/`size`/`variant` inputs across the library were
checked. Component-specific `variant` unions (`BadgeVariant`, `CardVariant`, `AlertVariant`, …) are correct
by design and not flagged.

### 7.1 `ProgressBarSize` hand-rolls the shared size axis — **MEDIUM**

```
projects/ngx-tw/progress-bar/progress-bar.ts:36  export type ProgressBarSize = 'sm' | 'md' | 'lg';
projects/ngx-tw/progress-bar/progress-bar.ts:207 readonly size = input<ProgressBarSize>(…)
```

A literal re-declaration of a subset of `TwSize`, with no reference to it. The library already demonstrates
the correct way to express exactly this:

```
projects/ngx-tw/item/item.ts:19  export type ItemSize = Extract<TwSize, 'sm' | 'md' | 'lg'>;   ← identical
                                                                                                 intent,
                                                                                                 derived
```

`ProgressBarSize` should be `Extract<TwSize, 'sm' | 'md' | 'lg'>`. As written, a future edit to `TwSize`
silently desynchronizes progress-bar. One-line fix, no behavior change.

### 7.2 `TwDialogSize` and `SheetSize` spell out `TwSize` inline — **LOW**

```
projects/ngx-tw/dialog/dialog-config.ts:10  export type TwDialogSize = 'xs'|'sm'|'md'|'lg'|'xl'|'fullscreen';
projects/ngx-tw/sheet/sheet-config.ts:19    export type SheetSize     = 'xs'|'sm'|'md'|'lg'|'xl'|'full';
```

Both genuinely extend the axis with an extra member, which CLAUDE.md permits ("Component-specific extra
variants are fine"). But both re-type the full `TwSize` union by hand rather than referencing it. Preferred:
`TwSize | 'fullscreen'` / `TwSize | 'full'` — the form `spinner` and `icon` already use.

### 7.3 Correct derivations — no action

```
projects/ngx-tw/spinner/spinner.ts:14   SpinnerColor = TwColor | 'current'            ✓ extends
projects/ngx-tw/spinner/spinner.ts:17   SpinnerSize  = TwSize  | 'inherit'            ✓ extends
projects/ngx-tw/icon/icon.types.ts:13   TwIconColor  = TwColor | 'current'            ✓ extends
projects/ngx-tw/item/item.ts:19         ItemSize     = Extract<TwSize,'sm'|'md'|'lg'> ✓ narrows
```

All other `color`/`size` inputs — 90+ across alert, avatar, badge, button, card, carousel, checkbox,
combobox, command-palette, date-picker, date-range-picker, empty-state, file-upload, form-field, input, menu,
number-input, paginator, radio, segmented-control, select, separator, slider, sort, stat, stepper, switch,
tab-nav, tabs, tags-input, textarea, time-picker, timeline — use `TwColor` / `TwSize` directly. **Adherence
is otherwise complete.**

---

## 8. CLAUDE.md accuracy

Places where `.claude/CLAUDE.md` is factually wrong about this repo at `69d3711`. The spec is normative for
every agent working here, so drift actively misdirects work — these are findings in their own right.

### F8.1 — Components do **not** live under `src/lib/` — **HIGH**

> CLAUDE.md:72 — "Each component is its own directory under `projects/ngx-tw/src/lib/` (e.g., `button/`,
> `badge/`)."

`projects/ngx-tw/src/` contains exactly one file, `public-api.ts`. There is no `src/lib/`. All 56 entry
points are directories directly under `projects/ngx-tw/` (`projects/ngx-tw/button/`,
`projects/ngx-tw/badge/`, …). The audit brief flagged this and it is confirmed.

HIGH because it is load-bearing and self-contradicted three lines later: CLAUDE.md:79 correctly cites
`projects/ngx-tw/theme/`, and every other path reference in the file (`projects/ngx-tw/menu/menu.ts`,
`projects/ngx-tw/core/types.ts`, `projects/ngx-tw/command-palette/command-palette.ts`) uses the real layout.
An agent scaffolding a new component from line 72 creates it in the wrong place, where ng-packagr will not
see it. **Fix:** `under `projects/ngx-tw/``.

### F8.2 — The boolean allow-list names an input that does not exist — **MEDIUM**

> CLAUDE.md:438 — "`calendar.showAdjacentMonths = input(true)` — month grid expects the leading/trailing days
> to render"

`showAdjacentMonths` appears **nowhere** in `projects/ngx-tw/calendar/` (or anywhere in the library) —
verified by full-text search across all non-spec `.ts`. The allow-list grants an exception to a
non-existent input.

MEDIUM, not HIGH: a phantom entry grants an exception nobody uses, so no consumer breaks and no shipped code
is wrong — it is the same spec-staleness class as F8.3 (stale prohibition), F8.4 and F8.6, and is graded with
them. Its distinct significance is evidential rather than operational: the allow-list is the enforcement
surface for a rule the spec calls mandatory, and a phantom entry proves that list is not validated against
source. Either the input was removed without updating CLAUDE.md, or it was specified and never built. Four
instances of this class in one file (F8.2/F8.3/F8.4/F8.6) is the argument for §8's closing recommendation:
replace enumerated lists with a rule plus a mechanical check.

### F8.3 — The `TwSplit*` naming exception is stale; those classes were already renamed — **MEDIUM**

> CLAUDE.md:76 — "Codified exception: the `TwSplit*` family (`TwSplit`, `TwSplitPane`, `TwSplitGutter`,
> `TwSplitPaneHeader`) is scheduled for rename in a future PR — do not introduce new violators."

The rename already shipped. Current names:

```
projects/ngx-tw/split/split.ts:106             — SplitComponent
projects/ngx-tw/split/split-pane.ts:28         — SplitPaneComponent
projects/ngx-tw/split/split-gutter.ts:11       — SplitGutterDirective
projects/ngx-tw/split/split-pane-header.ts:11  — SplitPaneHeaderDirective
```

Zero `TwSplit*` identifiers remain. The exception should be deleted — and note the irony that CLAUDE.md
carries a carve-out for a family that no longer violates the rule while the `TwDialog*` family that **does**
violate it (§6.1) goes unmentioned.

### F8.4 — The `split` input counts are stale — **LOW**

> CLAUDE.md:425 — "`split` (`SplitComponent` 10 + `SplitPaneComponent` 8)"

Actual: `SplitComponent` **8** (`split.ts:108–135`), `SplitPaneComponent` **7** (`split-pane.ts:30–54`).
Reduced by `f1fdd48 refactor(table, progress-bar, split): v2 input reshapes, class renames, form-integration
fixes`. Cosmetic — the exception still applies either way — but it is the number a future audit calibrates
against, which is exactly how this audit detected the drift.

### F8.5 — The boolean allow-list is 17 entries short of the code — **MEDIUM**

The list is presented as exhaustive ("The codified list:") and closes with "New boolean inputs that default
to `true` MUST land with the same inline-comment justification". 30 `true`-defaults exist in code; the list
names 14 inputs, of which 13 are real (§5.1) — leaving **17 unlisted**. All 17 **do** carry justification in
source (full table in §5.3), so the code is compliant and the spec is behind.

An enumerated allow-list of 30+ entries will keep drifting. Recommend replacing the enumeration with the
rule ("must carry a JSDoc justification on the same input") plus a lint/verify check, keeping only genuinely
surprising cases as illustrative examples.

### F8.6 — The `table` data-primitive exception has self-expired — **MEDIUM**

> CLAUDE.md:426 — "**Data primitives** … | `table` — temporary; PR8 reshapes into config objects, **after
> which this exception no longer applies**."

The reshape shipped (`f1fdd48`). `TableComponent` now takes config objects:

```
projects/ngx-tw/table/table.ts:854  readonly appearance = input<TwTableAppearance>({});
projects/ngx-tw/table/table.ts:857  readonly sticky     = input<TwTableSticky>({});
projects/ngx-tw/table/table.ts:860  readonly responsive = input<TwTableResponsive>({});
projects/ngx-tw/table/table.ts:863  readonly selection  = input<TwTableSelection>({});
```

By the sentence's own terms the exception no longer applies — yet `TableComponent` still has **14** inputs
and `ColumnComponent` **7**, so table becomes an unexcused violation the moment the text is read literally.
Resolve by making the exception permanent (data primitives are inherently wide) or by documenting the
post-reshape count as the accepted budget.

### F8.7 — The Testing section's `styleUrls` claim is false and contradicts the Styling section — **MEDIUM**

> CLAUDE.md:465 — "Components in the library use `templateUrl`/`styleUrls`, which ng-packagr inlines during
> the library build"

**Zero** occurrences of `styleUrl` or `styleUrls` exist in `projects/ngx-tw/`, and there are no component
`.css` files outside `theme/`. This is required by the Styling section — CLAUDE.md:85: *"No `.css`/`.scss`
files for components."* — so line 465 contradicts line 85.

Only **8 files** use `templateUrl` at all; the rest use inline templates per CLAUDE.md:498. The underlying
warning (a missing `dist/ngx-tw/` produces cryptic TestBed `templateUrl` failures) is still valid and worth
keeping — just drop `styleUrls` and note that it affects the 8 external-template components.

### F8.8 — The boolean-justification rule specifies two different comment forms — **MEDIUM**

> CLAUDE.md:433 — "the rationale is documented in an inline **JSDoc** comment on the same input"
> CLAUDE.md:451 — "MUST land with the same **inline-comment** justification"

Not synonymous, and the library splits 12 `//` vs 5 JSDoc (§5.4). The distinction is mechanical, not
stylistic: `node.jsDoc` is populated only for `/** */` blocks, so **Compodoc never sees a `//` rationale** —
12 of the 17 justifications are invisible in the generated API tables the JSDoc section exists to populate.
Pick one form; JSDoc is the one consistent with the file's own JSDoc Requirements section.

### F8.9 — `text-base` is "only" for two exceptions, but the trigger table assigns it to `lg`/`xl` — **MEDIUM**

> CLAUDE.md:191 — "`text-base` (16px) is permitted **only** for the codified exceptions above — the
> lg-density `tw-item` title … and the `tw-stat` lg/xl value. Do not introduce new uses of `text-base` for
> component-internal text."
> CLAUDE.md:193-199 — "Trigger font size scale (tabs, segmented controls, button groups): … | `lg`–`xl` |
> `text-base` |"

Directly self-contradictory, eight lines apart. The trigger scale mandates `text-base` for lg/xl triggers
across tabs, segmented-control and button groups — a third permitted use the "only" sentence excludes. The
audit brief flagged this and it is confirmed verbatim. **Fix:** add "and the lg/xl step of the trigger font
scale below" to the exception sentence.

### F8.10 — `checkbox` "12+ inputs" is accurate but ambiguous about `model()` — **LOW**

CLAUDE.md:424 cites `checkbox` at "12+ inputs". Actual: **14 `input()` + 2 `model()` = 16**. The claim holds
either way, but combined with `paginator` "~20" (18 + 2 models = 20 only if models count) and `split` "10 + 8"
(matching neither rule), the counting convention is never stated. Recommend stating it explicitly —
*"inputs = `input()` + `model()`, per class, excluding inherited and host-directive bindings"* — so future
audits calibrate identically. This audit had to reverse-engineer it from three data points, one of which
(F8.4) was wrong.

### F8.11 — "Do not export variant configs" is violated by `core` — **LOW**

> CLAUDE.md:341 — "Define a `tv()` config per component, co-located in the same file. Do not export variant
> configs."

`tabTriggerVariants` (a `tv()` config, `core/tab-trigger-variants.ts:24`) is exported from `core/index.ts:42`
and consumed by tabs, tab-nav and segmented-control. The structural reason is sound — one shared class table
keeps Tailwind v4's static scanner able to see the strings — but the rule admits no exception. Add a
carve-out for cross-entry-point shared tables, or `@internal`-tag the export (§3.3).

### F8.12 — "56/56 registered in all 4 required places" is correct but the 4 places are never named — **LOW**

`docs/production-audit.md:36` asserts the ratio without enumerating the registries, so the claim cannot be
re-verified without reconstructing them. This audit re-derived them from `scripts/verify-mcp-index.mjs` and
`scripts/build-mcp-index.mjs` and **confirms 56/56** (§2.1). Recommend naming them inline in
`production-audit.md`, and noting that the published total is 59 (56 + 3 sub-entry-points) as
`scripts/verify-package.mjs:157` asserts.

---

## Recommended order of work

1. **F3.1** — `export` `PromiseMessages` + re-export from `toast/index.ts`. One line, unblocks consumer TS.
2. **F8.1, F8.2** — fix the component path and drop the phantom `showAdjacentMonths` entry. Both actively
   misdirect agents reading the spec.
3. **F8.3, F8.4, F8.6, F8.7, F8.9** — one editing pass over CLAUDE.md clearing the stale `TwSplit*`
   exception, split counts, table exception, `styleUrls` claim, and `text-base` contradiction.
4. **§5.2** — add the one-line rationale to `calendar.bordered`; makes the boolean rule 30/30 compliant.
5. **§3.2** — `@internal`-tag the 4 methods leaking `ResolvedItem` / `ThumbId`, matching `paginator.ts`.
6. **§7.1** — `ProgressBarSize` → `Extract<TwSize, 'sm' | 'md' | 'lg'>`.
7. **§1.3** — add stated defaults to the 68 non-`false` inputs, prioritizing the i18n-facing label defaults
   in date-picker / date-range-picker / select / combobox.
8. **§1.2(c)** — `protected`/`@internal` the 22 template handlers; write real JSDoc for
   `TabsComponent.selectTab()` / `.closeTab()`.
9. **§4** — decide `CarouselComponent` (16 inputs): reshape into config objects, or codify a new exception.
10. **§1.2(a,b)** — JSDoc the 10 abstract `DateAdapter` methods and the 24 selection-strategy methods; both
    are documented extension points.

---

## Method notes & confidence

- **Extraction, not grep.** All member/method/selector/type facts come from a TypeScript compiler API walk
  (`ts.createSourceFile` with `setParentNodes`) over 227 classes in 182 source files. JSDoc presence is read
  from `node.jsDoc`, which is populated only for `/** */` blocks — the same thing Compodoc consumes — so
  "has JSDoc" here means exactly "will render in the demo API table". `//` comments were captured separately
  via `ts.getLeadingCommentRanges`, which is what made §5.4 / F8.8 visible.
- **Counting rule calibrated before use.** The input counter was validated against CLAUDE.md's three stated
  counts before any table was generated; two matched, one (`split`) did not and became F8.4.
- **Heuristic findings were manually verified, not reported raw.** The wrong-default scan produced 25 hits
  and the type-restatement scan 8; every one was read in source and **all 33 were cleared as false
  positives**. They are recorded as cleared (§1.4, §1.5) rather than silently dropped.
- **Exclusions.** Inherited-from-external bases (`CdkStepper`, `CdkDialogConfig`, `CdkMenuItem`) and
  `hostDirectives` re-exposures are real public surface but not this library's JSDoc to write, so they are
  excluded from the undocumented and cap counts. `@internal`-tagged members are excluded throughout — this
  is what correctly kept `paginator.goTo` / `PageChangeSource` out of §3.2.
- **Read-only.** No file under `projects/ngx-tw/` was modified. `scripts/build-mcp-index.mjs` was **not**
  executed (invoking it without `--out` writes `dist/ngx-tw/index.json`); its extractor was read for
  reference and re-implemented in a scratchpad script.
- **Lower confidence.** The severity split between MEDIUM and LOW in §4 rests on reading which of the five
  codified exceptions a component "fits", which is a judgment call for `TabNavComponent` and
  `SortHeaderComponent` specifically. `CarouselComponent` at 16 inputs fits none of them on any reading.
