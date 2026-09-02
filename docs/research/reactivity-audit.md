# Signal Reactivity & Angular v22 Correctness Audit — `@cdevhub/ngx-tw`

**Scope:** all shipped source under `projects/ngx-tw/` (`*.spec.ts` excluded).
**Branch / commit:** `develop` @ `69d3711` (`chore(release): @cdevhub/ngx-tw@0.5.0`).
**Rules of record:** `.claude/CLAUDE.md` — "Angular Conventions (v22)", "`computed()` vs `linkedSignal()`", "No signal cycles in `effect()`", "ControlValueAccessor", "Form Compatibility".
**Method:** every effect-bearing file was read in full so transitive track-reads (through called methods and through `computed()`s the effect reads) were derived from source, not from snippets. Read-sets below exclude reads inside `untracked()`; write-sets include writes reached through called methods.

**Severity legend:** **HIGH** = runtime bug / silent data loss / freeze · **MEDIUM** = convention violation or documentation drift that can cause a future regression · **LOW** = polish.

---

## Executive summary

| Dimension | Result |
|---|---|
| 1. Signal cycles in `effect()` | 71 `effect()` + 2 `afterRenderEffect()` audited. **0 CYCLE (unbounded)**, **1 CODIFIED-EXCEPTION**, **4 SUSPECT**, **68 SAFE**. No freeze-shaped effect exists in the library. |
| 2. `computed()` vs `linkedSignal()` | 1 real misuse (`calendar.mode`), 1 defensible-but-noteworthy `signal()+effect()` sync (`input._value`). All 13 other `linkedSignal()` uses are correct. |
| 3. ControlValueAccessor | All 17 CVA implementers use a supported shape. **0 controls on the silent-validator-drop path.** All 4 `NG_VALIDATORS` providers ship the mandated spec. 3 documentation-drift findings (one of them actively misleading). |
| 4. Three-form-strategy compatibility | Classic-CVA path correctly taken everywhere. 3 test-coverage gaps (calendar signal-forms, calendar template-driven, transfer signal-forms). |
| 5. v22 convention violations | **Clean.** 61 components, 61 `OnPush`. No `standalone: true`, no `@HostBinding`/`@HostListener`, no `*ngIf`/`*ngFor`/`ngClass`/`ngStyle`, no `.mutate(`, no `@angular/animations`, no `@NgModule`, no constructor DI. |
| 6. Memory / lifecycle hygiene | 2 genuine leak candidates (both LOW), 1 observational. Teardown discipline across overlays, observers, focus monitors and key managers is otherwise excellent. |

---

# Dimension 1 — Signal cycles in `effect()`

## 1.1 Verdict definitions used

- **SAFE** — no signal written by the effect is track-read by the same effect (writes to plain fields, DOM, CDK non-signal properties, `output.emit`, `LiveAnnouncer`, and writes to *other* components' signals that this effect never reads all qualify).
- **CODIFIED-EXCEPTION** — the one cycle CLAUDE.md explicitly permits (`paginator.ts`), verified still guarded.
- **SUSPECT** — the effect writes a signal it *also* track-reads, so each write schedules a re-run. All four found converge (`Object.is` equality settles them in exactly one extra tick), so none can freeze — but per CLAUDE.md they are cycle-shaped effects lacking the mandated inline justification comment, and a future edit that removes a guard turns them into real cycles.
- **CYCLE** — write of a signal the effect track-reads with **no** convergence (typically a freshly-allocated array/object/`Date` that fails `Object.is` every run). **None found.**

## 1.2 Full per-effect verdict table

| # | Anchor | Track-reads | Writes | Verdict |
|---|---|---|---|---|
| 1 | `projects/ngx-tw/avatar/avatar.ts:171` | `displayMode()`→`src`,`imageLoaded`,`initials`; `alt()` | — (`console.warn`) | SAFE |
| 2 | `projects/ngx-tw/avatar/avatar.ts:284` | `avatars()`, `max()` | child `avatar.groupHidden` (not read here) | SAFE¹ |
| 3 | `projects/ngx-tw/calendar/calendar-form-directives.ts:51` | `api.disabled()` | `host.cvaDisabled` (not read here) | SAFE¹ |
| 4 | `projects/ngx-tw/calendar/calendar-form-directives.ts:54` | `api.readonly()` | `host.cvaReadonly` (not read here) | SAFE¹ |
| 5 | `projects/ngx-tw/calendar/calendar.ts:652` | `mode()` | closure `previousMode`; `onModeChanged()` **inside `untracked`** | SAFE |
| 6 | `projects/ngx-tw/calendar/calendar.ts:663` | `mode()`, `_lastInvalidFormValue()`, `resolvedConstraints()`, `minRangeLength()`, `maxRangeLength()`, `maxSelections()` | `validatorOnChange()` (plain callback, in `untracked`) | SAFE |
| 7 | `projects/ngx-tw/calendar/calendar.ts:678` | `effectiveLocale()` | `dateAdapter.setLocale()` (in `untracked`) | SAFE |
| 8 | `projects/ngx-tw/calendar/calendar.ts:689` | `_selectionState()`, `previewRange()`, `_hoveredDate()` | closure `lastEmittedPreviewKey`; `rangePreview.emit` (in `untracked`) | SAFE |
| 9 | `projects/ngx-tw/carousel/carousel.ts:690` | `ariaLabel()`, `ariaLabelledBy()`, `autoplayInterval()`, `slidesPerView()` | closure warn-flags | SAFE |
| 10 | `projects/ngx-tw/carousel/carousel.ts:717` | `autoplay()`, `_isPaused()`, `_effectiveAutoplayInterval()` | `setInterval` handle (plain); callback writes `_lastInteractionSource`/`activeIndex` **asynchronously**, neither feeds `_isPaused` | SAFE (has `onCleanup`) |
| 11 | `projects/ngx-tw/carousel/carousel.ts:738` | `autoplay()`, `_isPaused()` | closure `prevPaused`; `autoplayPaused`/`autoplayResumed` emits | SAFE |
| 12 | `projects/ngx-tw/carousel/carousel.ts:756` | `slides()` | `activeIndex` — read **and** written entirely inside `untracked` | SAFE (canonical reference) |
| 13 | `projects/ngx-tw/carousel/carousel.ts:1483` | `carousel.slidesPerView()` | closure `warned` | SAFE |
| 14 | `projects/ngx-tw/collapsible/collapsible.ts:438` | `value()`, `items()`, `isAccordionMode()` | child `item.setOpen()` inside `untracked` | SAFE |
| 15 | `projects/ngx-tw/collapsible/collapsible.ts:472` | `triggers()` | `this.keyManager` (plain field) | SAFE (has `onCleanup`) |
| 16 | `projects/ngx-tw/combobox/combobox.ts:732` | `open()`, `isDisabled()`, `overlayInstanceSignal`, `closingSignal()`; plus `firstEnabledIndex()`/`visibleOptions()` leaked in via `openOverlay()` | **`overlayInstanceSignal`**, **`closingSignal`**, `activeIndex` | **SUSPECT** (see 1.4) |
| 17 | `projects/ngx-tw/combobox/combobox.ts:750` | `overlayInstanceSignal`, `closingSignal()`, 12 config signals | overlay-instance signals inside `untracked` | SAFE |
| 18 | `projects/ngx-tw/combobox/combobox.ts:785` | `options()`, `compareWith()`, `optionValue()`, `optionLabel()` | `inputValue`, `lastCommittedLabel`, `pendingWriteValue` — all inside `untracked`, none read | SAFE |
| 19 | `projects/ngx-tw/combobox/combobox.ts:811` | `visibleOptions()`, `inputValue()`, `open()` | `announceTimer` (plain); `LiveAnnouncer` | SAFE |
| 20 | `projects/ngx-tw/command-palette/command-palette.ts:577` | `open()`; plus `filteredItems()`/`autoFocus()` leaked in via `openPalette()` | `isAttached` (a signal, but only read inside the deferred `setTimeout` at `:598/:702`, i.e. outside the reactive context); `open.set(false)` deferred in `setTimeout` | SAFE² ³ |
| 21 | `projects/ngx-tw/command-palette/command-palette.ts:594` | `query()`, `filteredItems()` | `announceTimer` (plain) | SAFE |
| 22 | `projects/ngx-tw/date-picker/date-picker.ts:783` | `minDate()`, `maxDate()`, `dateFilter()` | `validatorOnChange()` (in `untracked`) | SAFE |
| 23 | `projects/ngx-tw/date-picker/date-picker.ts:791` | `internalValue()`, `effectiveFormat()` | `rawInputText`, `unparseableText` inside `untracked`; neither is read by `internalValue` (which links to `value`) | SAFE |
| 24 | `projects/ngx-tw/date-picker/date-picker.ts:811` | `open()`, `isDisabled()`, `overlayInstanceSignal`, `closingSignal()`; `internalValue()`/`offset()`/`scrollStrategy()`/`activePresetIdSignal()` via `openOverlay()` | **`overlayInstanceSignal`**, **`closingSignal`**, `lastValueBeforeOpen`, `pendingCalendarValue` | **SUSPECT** (see 1.4) |
| 25 | `projects/ngx-tw/date-picker/date-picker.ts:828` | `overlayInstanceSignal` + 20 config signals | overlay-instance signals inside `untracked` | SAFE |
| 26 | `projects/ngx-tw/date-picker/date-picker.ts:889` | `locale()` | `adapter.setLocale()` (in `untracked`) | SAFE |
| 27 | `projects/ngx-tw/date-range-picker/date-range-picker.ts:784` | `open()`, `isDisabled()`, `overlayInstanceSignal`, `closingSignal()` | **`overlayInstanceSignal`**, **`closingSignal`** | **SUSPECT** (see 1.4) |
| 28 | `projects/ngx-tw/date-range-picker/date-range-picker.ts:801` | `overlayInstanceSignal` + 30 config signals | overlay-instance signals inside `untracked` | SAFE |
| 29 | `projects/ngx-tw/date-range-picker/date-range-picker.ts:877` | `locale()` | `adapter.setLocale()` (in `untracked`) | SAFE |
| 30 | `projects/ngx-tw/date-range-picker/date-range-picker.ts:885` | `minDate()`, `maxDate()`, `dateFilter()`, `minRangeLength()`, `maxRangeLength()` | `validatorOnChange()` (in `untracked`) | SAFE |
| 31 | `projects/ngx-tw/flip-card/flip-card.ts:273` | `flipped()`, `hasBack()` | closure `firstRun`; `LiveAnnouncer` | SAFE |
| 32 | `projects/ngx-tw/form-field/form-field.ts:592` | `control()`, `subscriptMode()`, `errorChildren()`, `e.shouldShow()`, `hintChildren()`, `ctrl.userAriaDescribedBy()` | `ctrl.setDescribedByIds()` inside `untracked` | SAFE |
| 33 | `projects/ngx-tw/form-field/form-field.ts:617` | `control()`, `labelChild()`, `shouldRenderLabelWrapper()`, `ctrl.userAriaLabelledby()` | `ctrl.setLabelledByIds()` inside `untracked` | SAFE |
| 34 | `projects/ngx-tw/form-field/form-field.ts:636` | `hintChildren()`, `h.effectiveAlign()` | — (`console.error`) | SAFE |
| 35 | `projects/ngx-tw/form-field/form-field.ts:649` | `prefixChildren()`, `infixRef()` | `restingLabelOffset` (not read here) | SAFE¹ (has `onCleanup`) |
| 36 | `projects/ngx-tw/icon/icon.ts:172` | via `renderSvg()`: `resolvedIcon()`, `effectiveStrokeWidth()`, `effectiveViewBox()`, `ariaLabel()`, `name()`, `sizeInPx()` | plain cache fields + `Renderer2` DOM | SAFE |
| 37 | `projects/ngx-tw/input/input.ts:323` | `valueAccessor.value()` | `_value` inside `untracked`, never read here | SAFE |
| 38 | `projects/ngx-tw/input/input.ts:330` | `readonlyInput()` | native attribute | SAFE |
| 39 | `projects/ngx-tw/input/input.ts:340` | `type()` | — (`throw` in dev; see 5.2) | SAFE |
| 40 | `projects/ngx-tw/menu/menu.ts:248` | `disabled()` | `cdkItem.disabled` (plain CDK property) | SAFE |
| 41 | `projects/ngx-tw/menu/menu.ts:301` | `disabled()` | `cdkCheckbox.disabled` (plain) | SAFE |
| 42 | `projects/ngx-tw/menu/menu.ts:361` | `disabled()` | `cdkRadio.disabled` (plain) | SAFE |
| 43 | `projects/ngx-tw/paginator/paginator.ts:794` | `page()`, `pageSize()`, `totalPages()` | **`page`** (clamp) | **CODIFIED-EXCEPTION** (see 1.3) |
| 44 | `projects/ngx-tw/paginator/paginator.ts:837` | `focusableItems()` | `_keyManager` (plain field) | SAFE (has `onCleanup`) |
| 45 | `projects/ngx-tw/popover/popover.ts:414` | `twPopoverOpen()`, `twPopoverDisabled()`, position/backdrop/scroll inputs via `openPopover()` | `overlayId` (not read); `popoverInstance` is a **plain field**, not a signal; `twPopoverOpen.set(false)` deferred in `setTimeout` | SAFE² |
| 46 | `projects/ngx-tw/progress-bar/progress-bar.ts:324` | `options()`, `label()` | closure `warned` (in `untracked`) | SAFE |
| 47 | `projects/ngx-tw/select/select.ts:837` | `open()`, `isDisabled()`, `overlayInstanceSignal`, `closingSignal()` | **`overlayInstanceSignal`**, **`closingSignal`**, `search`, `activeIndex` | **SUSPECT** (see 1.4) |
| 48 | `projects/ngx-tw/select/select.ts:854` | `overlayInstanceSignal` + 17 config signals | overlay-instance signals inside `untracked` | SAFE |
| 49 | `projects/ngx-tw/select/select.ts:901` | `search()`, `visibleOptions()` | `searchChange.emit` (in `untracked`) | SAFE |
| 50 | `projects/ngx-tw/sort/sort-header.ts:188` | `sortActionDescription()`, `containerRef()` | `_describedBy` (plain field); `AriaDescriber` | SAFE |
| 51 | `projects/ngx-tw/split/split.ts:239` | `_panes()`; `unit()`, `gutterSize()`, `storageKey()`, per-pane `defaultSize()/minSize()/maxSize()` via `_onPanesChange()` | `_sizes` (**never track-read** — `_reconcilePanes` reads it via `untracked`), child `_index`/`_basis`/`_size` (child `_size` read via `untracked`) | SAFE |
| 52 | `projects/ngx-tw/tab-nav/tab-nav.ts:207` | `resolvedPanel()`, `links()`, `link.active()`, `labels()` | `panel.activeTabId` (not read here); `previousActiveLinkId` read **and** written inside `untracked` | SAFE¹ |
| 53 | `projects/ngx-tw/tab-nav/tab-nav.ts:236` | `links()`, `layoutDirection()` | `keyManager` (plain field) | SAFE (has `onCleanup`) |
| 54 | `projects/ngx-tw/table/table.ts:1105` | `cdkTable()`, `data()`, `trackBy()`, `multiTemplateRows()`, `resolvedAppearance()` | plain CDK properties | SAFE |
| 55 | `projects/ngx-tw/table/table.ts:1117` | `cdkTable()`, `noDataRow()` | closure `registeredNoDataRow`; `table.setNoDataRow()` | SAFE |
| 56 | `projects/ngx-tw/table/table.ts:1130` | `expandedRows()` | — (`queueMicrotask` → `table.renderRows()`) | SAFE |
| 57 | `projects/ngx-tw/table/table.ts:1139` | `visibleColumns()`, `resolvedResponsive()`, `thClasses()`, `tdClasses()`, `footerTdClasses()` | child `columnIndex`/`extraHeaderClass`/`extraCellClass`/`extraFooterClass` inside `untracked`; `visibleColumns` reads only `hidden()`/`priority()`, so no feedback | SAFE |
| 58 | `projects/ngx-tw/table/table.ts:1172` | `resolvedRows()`, `columns()` | child `rowsSnapshot` inside `untracked` | SAFE |
| 59 | `projects/ngx-tw/table/table.ts:1179` | `columns()`, `c.name()` | — (`throw` in dev; see 5.2) | SAFE |
| 60 | `projects/ngx-tw/table/table.ts:1194` | `expansionTemplate()`, `multiTemplateRows()` | — (`throw` in dev; see 5.2) | SAFE |
| 61 | `projects/ngx-tw/table/table.ts:1222` | `loading()` | `LiveAnnouncer` (labels/rows read via `untracked`) | SAFE |
| 62 | `projects/ngx-tw/tabs/tabs.ts:532` | `triggerElements()`, `orientation()`, `layoutDirection()` | `keyManager` (plain field); `manager.setActiveItem()` inside `untracked` | SAFE (has `onCleanup`) |
| 63 | `projects/ngx-tw/tags-input/tags-input.ts:460` | `focusNonce()` | — (DOM `focus()` inside `untracked`) | SAFE |
| 64 | `projects/ngx-tw/textarea/textarea.ts:162` | `autosize()` | `cdkAutosize.enabled` (plain CDK property) | SAFE |
| 65 | `projects/ngx-tw/theme/theme.service.ts:79` | `resolvedTheme()`, `theme()` | DOM attribute + `localStorage` | SAFE |
| 66 | `projects/ngx-tw/time-picker/time-picker.ts:785` | `minTime()`, `maxTime()` | `validatorOnChange()` (in `untracked`) | SAFE |
| 67 | `projects/ngx-tw/time-picker/time-picker.ts:792` | `internalValue()`, `format()`, `showSeconds()` | `hourText`/`minuteText`/`secondText`/`meridiem`/`rangeError` — all inside `untracked`, none read | SAFE |
| 68 | `projects/ngx-tw/time-picker/time-picker.ts:821` | `format()`, `showSeconds()` | same set inside `untracked` | SAFE |
| 69 | `projects/ngx-tw/tooltip/tooltip.ts:381` | `twTooltipDisabled()` | plain fields; `overlayRef.detach()` | SAFE |
| 70 | `projects/ngx-tw/tree/tree.ts:320` | `resolvedSelection()` | `selectedKeys` inside `untracked`, never read here | SAFE |
| 71 | `projects/ngx-tw/tree/tree.ts:331` | `cdkTree()`, `expandedKeys()`, `data()`, `childrenAccessor()` — **`tree.isExpanded()` is *not* a track-read**: CDK v21's expansion state is an RxJS `SelectionModel`, not a signal (`node_modules/@angular/cdk/fesm2022/tree.mjs:15`, `:486-487`) | CDK expansion model only; the DOM round-trip through each node's `(expandedChange)` reaches `onCdkExpandedChange` (`tree.ts:488-501`), which is **compare-before-write**, so no write occurs | SAFE |

### `afterRenderEffect()` (2)

| # | Anchor | Track-reads | Writes | Verdict |
|---|---|---|---|---|
| R1 | `projects/ngx-tw/stat/stat.ts:298` | `textEl()` | `projectedText` (not read here) | SAFE¹ — but see finding **L-6** |
| R2 | `projects/ngx-tw/date-range-picker/date-range-picker-overlay.ts:396` | `presetOptions()`, `activeOptionIndex()` | child `option.tabindex` (not read here) | SAFE¹ |

¹ Safe, but the signal write is **not** wrapped in `untracked()` — see finding **L-1**.
² `open.set(false)` happens inside a `setTimeout`, i.e. outside any reactive context; the `untracked()` around it is decorative but harmless. The re-run it schedules settles immediately.
³ Verified not cycle-shaped: `command-palette`'s instance handle and close flag are **plain fields** — `private overlayInstance: … | null = null` (`:460`) and `private closing = false` (`:464`) — not signals and not getters over signals. This is what separates it (and `popover.ts:400/403`) from the four SUSPECT components in **M-1**.

## 1.3 CODIFIED-EXCEPTION verification — `paginator.ts:794`

The guard CLAUDE.md codifies is **present and correct**:

```ts
// projects/ngx-tw/paginator/paginator.ts:804-810
const clamped = Math.min(Math.max(1, newPage), tp);
if (clamped !== newPage) {
  if (this._pendingSource === null) this._pendingSource = 'programmatic';
  this.page.set(clamped);
  return;
}
```

- `page` is `model<number>(1)` (`paginator.ts:477`); `totalPages` is a pure `computed` over `totalItems()` / `effectivePageSize()` (`paginator.ts:579`) and never depends on `page`, so the clamp target is stable within a tick.
- The write is a **primitive** `number`, so `Object.is` stops the second pass: the re-run recomputes `clamped === newPage` and takes the `return` at line 809 → settles in exactly one extra tick.
- The mandatory explanatory comment (`paginator.ts:785-793`) is intact and still accurate, including the note that `untracked()` does *not* break this cycle.
- **No new effect of this shape was introduced.** Verdict: exception holds.

## 1.4 SUSPECT findings

### **M-1 — Four overlay-lifecycle effects write signals they track-read, with no CLAUDE.md-mandated justification comment** — MEDIUM

`projects/ngx-tw/select/select.ts:837`
`projects/ngx-tw/combobox/combobox.ts:732`
`projects/ngx-tw/date-picker/date-picker.ts:811`
`projects/ngx-tw/date-range-picker/date-range-picker.ts:784`

All four share this shape (select shown; the other three are structurally identical):

```ts
effect(() => {
  const shouldOpen = this.open();
  const disabled = this.isDisabled();
  if (disabled && this.overlayInstance) { this.closeOverlay(); return; }        // overlayInstance is a GETTER over overlayInstanceSignal()
  if (shouldOpen && !this.overlayInstance && !disabled && !this.closingSignal()) {
    this.openOverlay();      // → attachOverlayComponent() → overlayInstanceSignal.set(instance)   ← WRITES A TRACK-READ SIGNAL
  } else if (!shouldOpen && this.overlayInstance && !this.closingSignal()) {
    this.closeOverlay();     // → closingSignal.set(true)                                          ← WRITES A TRACK-READ SIGNAL
  }
});
```

`overlayInstance` is **not** a plain field in these four — it is `private get overlayInstance() { return this.overlayInstanceSignal(); }`. Declarations verified individually:

| Component | instance signal | getter | close flag signal | synchronous writes from the effect |
|---|---|---|---|---|
| `select.ts` | `:604` | `:609` | `:598` | `overlayInstanceSignal.set` `:1404`, `closingSignal.set(true)` `:1322` |
| `combobox.ts` | `:537` | `:543` | `:529` | `overlayInstanceSignal.set` `:1351`, `closingSignal.set(true)` `:1261` |
| `date-picker.ts` | `:639` | `:642` | `:629` | `overlayInstanceSignal.set` (in `openOverlay`), `closingSignal.set(true)` (in `closeOverlay`) |
| `date-range-picker.ts` | `:596` | `:599` | `:586` | `overlayInstanceSignal.set` `:1192`, `closingSignal.set(true)` `:1226` |

So both `overlayInstanceSignal` and `closingSignal` are genuine track-reads *and* genuine writes of the same effect. Each write schedules a re-run.

**Why it does not freeze today:** both written values are stable identities (an object reference set exactly once per open; a boolean). On the re-run the guard conditions (`!this.overlayInstance`, `!this.closingSignal()`) are false, so no branch fires and the effect settles after one extra tick. This is the same convergence argument as `paginator.ts` — but unlike paginator it carries **no inline justification comment**, and CLAUDE.md is explicit: "Do not introduce new effects of this shape — if a new one seems unavoidable, it needs the same guard + inline justification, or a `linkedSignal()` refactor."

**Risk if left as-is:** the guards are the only thing bounding the loop. If a future edit relaxes `!this.overlayInstance` / `!this.closingSignal()`, or makes `openOverlay()` re-mint an instance, this becomes an unbounded re-entrant open/close loop with no test that would catch it.

**Recommendation:** either (a) add the paginator-style inline comment naming the guard and the convergence argument to all four, or (b) demote `overlayInstance`/`closing` back to plain fields — as `popover.ts:400/403` and `command-palette.ts:460/464` already do; those two are *not* cycle-shaped **precisely because** their instance handle is a plain field — keeping only whatever genuinely needs to be a signal for the template.

Option (b) is the stronger fix: it removes the cycle rather than documenting it, and the library already contains two working precedents for the same overlay pattern. If (a) is chosen, `paginator.ts:785-793` is the model for the comment; `tree.ts:24-27` is a second in-repo precedent for documenting *why* a feedback path is bounded (there the loop runs through CDK's DOM/output layer rather than the signal graph, and is closed by compare-before-write).

### **L-2 — Overlay-lifecycle effects pick up hidden dependencies through `openOverlay()`** — LOW

`projects/ngx-tw/date-picker/date-picker.ts:811` (via `openOverlay()` reading `internalValue()`, `offset()`, `scrollStrategy()`, `activePresetIdSignal()`), `projects/ngx-tw/combobox/combobox.ts:732` (via `firstEnabledIndex()`, `visibleOptions()`), `projects/ngx-tw/command-palette/command-palette.ts:577` (via `filteredItems()`, `autoFocus()`), `projects/ngx-tw/popover/popover.ts:414` (via `buildPositionStrategy()` reading `twPopoverPosition()`, `twPopoverOffset()`, and `ensureOverlay()` reading `twPopoverBackdrop()`).

Because these calls sit in the effect's tracked phase, every change to a *panel-content* signal re-runs the *lifecycle* effect. The guards make each re-run a no-op, so this is not a bug — just wasted work and a surprising dependency graph. Wrapping the `openOverlay()` / `openPalette()` / `openPopover()` call in `untracked()` (the writes are already deliberately imperative) would make the dependency set match the intent.

---

# Dimension 2 — `computed()` vs `linkedSignal()`

### **M-2 — `calendar.mode` is a `linkedSignal()` that nothing ever writes** — MEDIUM

`projects/ngx-tw/calendar/calendar.ts:323`

```ts
readonly modeInput = input<CalendarMode>('single', { alias: 'mode' });
readonly mode: WritableSignal<CalendarMode> = linkedSignal(this.modeInput);
```

A repo-wide grep for `mode.set(` / `mode.update(` inside `projects/ngx-tw/calendar/` returns **zero** hits (the `host.mode.set(...)` hits in `calendar.spec.ts` are the *test host's* own signal, not the component's). Nothing in the library overrides it, so this is a purely derived read-only value — exactly what CLAUDE.md says `linkedSignal()` must not be used for ("Never use `linkedSignal()` for purely derived/calculated values — that's `computed()`'s job").

Two compounding problems:
1. It is **public API with no JSDoc** (contrast `valueInput`/`value` immediately below, and every other public member in the file). Compodoc will render it as an empty row.
2. Its type is `WritableSignal<CalendarMode>`, so consumers *can* write it — and if they do, they silently desynchronise the component from its own `mode` input while the `mode`-change effect (`calendar.ts:652`) happily emits `modeChange`. If that is intentional it must be documented; if not, it should be `computed()`.

Note `calendar.value` (line 332), `_viewState` (520) and `_activeDate` (528) are all written internally and are **correct** `linkedSignal()` uses.

### **L-3 — `input._value` is a `signal()` synced from a signal source by an `effect()`** — LOW

`projects/ngx-tw/input/input.ts:236` + `:323`

```ts
private readonly _value = signal<string>(this._readInitialValue());
...
if (this.valueAccessor && isSignal(this.valueAccessor.value)) {
  effect(() => {
    const v = (this.valueAccessor!.value as Signal<unknown>)();
    untracked(() => this._value.set(this._stringify(v)));
  });
}
```

This is the textbook `linkedSignal(source, computation)` shape — writable state derived from a source, also written by user interaction (`_onInput()` at line 425). It is nevertheless **defensible**: `TW_INPUT_VALUE_ACCESSOR` is optional, its `value` may be a plain (non-signal) value, and `_readInitialValue()` seeds from the DOM. A `linkedSignal` cannot express "source exists only sometimes". Flagged for the record, not for immediate change.

### Correct uses (no action)

`tabs.ts:291`, `calendar.ts:332/520/528`, `radio.ts:306/653`, `segmented-control.ts:259`, `checkbox.ts:391/398`, `switch.ts:300`, `date-picker.ts:592`, `time-picker` (internalValue) — all writable-derived-from-a-source and all actually written.

Two-arg reconciliation form used correctly where needed:
- `projects/ngx-tw/command-palette/command-palette.ts:538` — `activeIndex` keyed off the *id sequence*, carrying the previously-active id's new index forward. Textbook `(source, previous)` usage.
- `projects/ngx-tw/avatar/avatar.ts:185` — `imageLoaded` object form resetting to `null` on `src` change.

No case was found where the one-arg form is used but reconciliation against `previous` is actually required, and no `linkedSignal()` is used for a read-only derived value other than **M-2**.

---

# Dimension 3 — ControlValueAccessor registration

## 3.1 Classification of all 17 CVA implementers

| Control | Shape | `inject(NgControl,{self})` | Assignment site | Static `NG_VALUE_ACCESSOR` | `NG_VALIDATORS` | Matcher | Verdict |
|---|---|---|---|---|---|---|---|
| `checkbox/checkbox.ts` | A | `:333` | **constructor** `:367` | no | no | yes | ✅ |
| `switch/switch.ts` | A | `:253` | **constructor** `:275` | no | no | yes | ✅ |
| `radio/radio.ts` (RadioComponent) | A | `:290` | **constructor** `:415` | no | no | yes | ✅ |
| `radio/radio.ts` (RadioGroupComponent) | A | `:626` | **constructor** `:670` | no | no | yes | ✅ |
| `slider/slider.ts` | A | `:487` | **constructor** `:551` | no | no | yes | ✅ |
| `select/select.ts` | A | `:566` | **constructor** `:833` | no | no | yes | ✅ |
| `combobox/combobox.ts` | A | `:497` | **constructor** `:728` | no | no | yes | ✅ |
| `tags-input/tags-input.ts` | A | `:298` | **constructor** `:453` | no | no | yes | ✅ |
| `transfer/transfer.ts` | A | `:594` | **constructor** `:844` | no | no | yes | ✅ |
| `file-upload/file-upload.ts` | A | `:353` | **constructor** `:570` | no | no | yes | ✅ |
| `number-input/number-input.ts` | static-only | — | n/a | **yes** `:43` | no | no | ✅ (pure CVA) |
| `segmented-control/segmented-control.ts` | static-only | — | n/a | **yes** `:215` | no | no | ✅ (pure CVA) |
| `calendar/calendar.ts` | **B** | deferred `injector.get` in `ngOnInit` `:719` | n/a (static provider) | **yes** `:135` | **yes** `:140` | no | ✅ |
| `date-picker/date-picker.ts` | **B** | deferred `injector.get` in `ngOnInit` `:942` | n/a (static provider) | **yes** `:297` | **yes** `:283` | yes | ✅ |
| `time-picker/time-picker.ts` | **B** | deferred `injector.get` in `ngOnInit` `:894` | n/a (static provider) | **yes** `:296` | **yes** `:282` | yes | ✅ |
| `date-range-picker/date-range-picker.ts` | **B** | deferred `injector.get` in `ngOnInit` `:932` | redundant `:940` | **yes** `:281` | **yes** `:270` | yes | ⚠️ see **M-3** |
| `calendar/calendar-cva-utils.ts` | — | pure helper functions, no class | — | — | — | — | n/a |

**No control assigns `valueAccessor` in `ngOnInit` without a static provider. No control combines a static provider with `inject(NgControl, {self:true})`. No matcher-integrating control is stranded on the static-provider-only path without the required validator wiring.** The trap that cost the repo the date-range-picker error codes is not present anywhere.

Note on ordering: several Shape-A controls have an `afterNextRender(...)` immediately after the CVA block (e.g. `checkbox.ts:370`, `switch.ts:278`, `slider.ts:554`, `transfer.ts:847`, `file-upload.ts:573`, `radio.ts:418/673`). The `valueAccessor` assignment itself is **always** the plain constructor statement above it — it is never inside the render hook. Verified line by line.

## 3.2 CVA findings

### **M-3 — `date-range-picker` carries a code comment that flatly contradicts its own providers** — MEDIUM

`projects/ngx-tw/date-range-picker/date-range-picker.ts:936-941`

```ts
// Wire this component as the NgControl's value accessor. NG_VALUE_ACCESSOR
// is not registered as a provider to keep `inject(NgControl, { self })`
// possible — we assign it here instead.
if (this.ngControl) {
  this.ngControl.valueAccessor = this;
}
```

`NG_VALUE_ACCESSOR` **is** registered as a provider — at `date-range-picker.ts:281`, with a correct 8-line comment at `:274-279` explaining exactly why it must be. The `ngOnInit` comment is a leftover from before the v22 fix and is now actively dangerous: it tells the next maintainer that the static provider is absent *and* explains a rationale for keeping it absent. Removing that provider on the strength of this comment reintroduces the exact silent-validator-drop bug CLAUDE.md was written to prevent.

The assignment itself is harmless (Angular's `setUpControl` already resolved the accessor from the static provider; re-assigning the same instance is a no-op) but it is dead code. **Delete the assignment and the comment, or rewrite the comment to state that the static provider owns registration.**

### **M-4 — CLAUDE.md's CVA section is stale in two places** — MEDIUM (documentation)

1. **Shape B list is incomplete.** CLAUDE.md names only `calendar` and `date-range-picker` as controls that self-provide `NG_VALIDATORS`. `date-picker` (`:283`) and `time-picker` (`:282`) do too, and both correctly use Shape B. The table should list all four, otherwise a reviewer applying the rule literally would flag the two correct implementations as violations.

2. **The `input` / `textarea` exception describes something that does not exist.** CLAUDE.md says: *"pure-CVA controls that do not integrate `TW_ERROR_STATE_MATCHER` (`input`, `textarea`) may use static `NG_VALUE_ACCESSOR`."* Neither is true today:
   - `InputDirective` **does not implement `ControlValueAccessor` at all** and does not provide `NG_VALUE_ACCESSOR` — it relies on Angular's built-in `DefaultValueAccessor` on the native element (see the explicit design note at `projects/ngx-tw/textarea/textarea.ts:53-58`).
   - `InputDirective` **does** integrate `TW_ERROR_STATE_MATCHER` (`projects/ngx-tw/input/input.ts:179`, `:222`, `:275`) and **does** `inject(NgControl, {self:true})` (`:171`).
   - `TextareaDirective` extends `InputDirective` and inherits all of the above.

   The real pure-CVA static-provider exceptions in the library are **`number-input`** and **`segmented-control`**. The paragraph should be rewritten to name those.

### 3.3 Mandated validator specs — all four present ✅

CLAUDE.md: *"Any control providing `NG_VALIDATORS` MUST ship a spec asserting one error code reaches a bound `FormControl`."*

| Control | Spec | Named test |
|---|---|---|
| `calendar` | `projects/ngx-tw/calendar/calendar.spec.ts:2267` | `it('surfaces calendarMinDate through a bound FormControl')` (+ `it('produces no error for a value inside the constraints')` at `:2281`) |
| `date-picker` | `projects/ngx-tw/date-picker/date-picker.spec.ts:710` | `it('surfaces calendarMinDate on a bound FormControl for a date before minDate')` (+ `calendarMaxDate` at `:725`, re-validation at `:817`) |
| `date-range-picker` | `projects/ngx-tw/date-range-picker/date-range-picker.spec.ts:926` | `it('surfaces calendarRangeTooShort when the committed range is below minRangeLength')` (+ `it('surfaces calendarMinDate when an endpoint falls before minDate')` at `:949`) |
| `time-picker` | `projects/ngx-tw/time-picker/time-picker.spec.ts:735` | `it('surfaces timePickerMin on a bound FormControl for a time before minTime')` (+ `timePickerMax` at `:747`, re-validation at `:813`) |

Each of the four spec blocks also carries the explanatory comment tying it back to the v22 trap. This is the strongest part of the codebase's regression defence and should not be weakened.

---

# Dimension 4 — Three-form-strategy compatibility

## 4.1 Signal-forms custom-control risk

Angular v22 compiles a component exposing a `value` / `checked` **`model()`** as a signal-forms custom control, and `FormControlDirective` takes the classic CVA path only if a value accessor is visible at directive-creation time.

| Control | Exposes `value`/`checked` `model()`? | Accessor visible at creation? | Classic path taken |
|---|---|---|---|
| checkbox, switch, radio (×2), slider, select, combobox, segmented-control | yes | constructor assignment (A) or static provider | ✅ |
| calendar, date-picker, date-range-picker, time-picker | yes (`value` model) | static `NG_VALUE_ACCESSOR` (B) | ✅ |
| tags-input, transfer, file-upload, number-input | **no** — `value` is exposed as a read-only `Signal` (`tags-input.ts:335`, `transfer.ts:1092`, `file-upload.ts:418`, `number-input.ts:104`), value I/O runs through the CVA callbacks | n/a — never compiled as a custom control | ✅ by construction |

No control is ambiguous. The four Shape-B controls are the only ones where the failure would be silent, and all four are guarded by the specs in §3.3.

## 4.2 Coverage gaps

### **M-5 — `calendar` has no template-driven and no signal-forms spec, and its three signal-forms directives are entirely untested** — MEDIUM

- `projects/ngx-tw/calendar/calendar-form-directives.ts` declares `CalendarSingleDirective`, `CalendarMultipleDirective`, `CalendarRangeDirective` — the *only* signal-forms binding path for the calendar. **There is no `calendar-form-directives.spec.ts`**, and `calendar.spec.ts` contains zero references to these directives, to `@angular/forms/signals`, or to `[field]`.
- `calendar.spec.ts` contains **zero** `ngModel` references — no template-driven coverage either.
- Reactive forms are well covered (`FormControl` appears 6×, incl. the validator block).

Every other form control in the library carries all three. CLAUDE.md: *"Interactive controls MUST work with **all three** Angular form strategies."* Two of three are unverified for the calendar.

### **L-4 — `transfer` has no signal-forms spec** — LOW

`projects/ngx-tw/transfer/transfer.spec.ts` covers reactive forms (`describe('ControlValueAccessor (reactive forms)')` at `:351`) and `ngModel`, but has no `@angular/forms/signals` / `[field]` case. Every peer control (checkbox, switch, radio, slider, select, combobox, tags-input, file-upload, number-input, segmented-control) has one. Low risk because `transfer` exposes `value` as a read-only `Signal` and can never take the custom-control branch — but the matrix is incomplete.

---

# Dimension 5 — v22 convention violations

## 5.1 Sweep results — clean

| Check | Result |
|---|---|
| `ChangeDetectionStrategy.OnPush` on every component | ✅ 61 `@Component` declarations, 61 `OnPush`. Zero files where the count diverges. |
| `standalone: true` explicitly set | ✅ zero occurrences |
| `@HostBinding` / `@HostListener` | ✅ zero occurrences |
| `*ngIf` / `*ngFor` / `ngClass` / `ngStyle` / `CommonModule` | ✅ zero occurrences (the only grep hits were substrings inside `leadingClasses` / `trailingClasses` in `item/item.ts`) |
| `.mutate(` on signals | ✅ zero occurrences |
| `@angular/animations` | ✅ zero imports |
| `@NgModule` | ✅ zero occurrences |
| Constructor DI (parameters on `constructor`) | ✅ zero in Angular classes. The only parameterised constructors are `dialog/dialog-ref.ts:59` and `sheet/sheet-ref.ts:64`, which are plain non-DI value classes constructed manually by their services — not a violation. |
| Arrow functions in templates | ✅ zero hits across three targeted greps: `=>` in any `.html`; `=>` inside an event binding (`(click)="…=>…"`) in `.ts` or `.html`; `=>` inside an interpolation (`{{ … => … }}`). Event bindings and interpolations are the only places an arrow could appear. |

`ChangeDetectionStrategy.Eager` appears 25× but **only in `*.spec.ts` test hosts** (`split.spec.ts`, `tooltip.spec.ts`, …), which are out of scope.

## 5.2 Findings

### **L-5 — `throw` inside a dev-mode `effect()` (3 sites), inconsistent with the codebase's own documented preference** — LOW

`projects/ngx-tw/table/table.ts:1185` (duplicate column name), `projects/ngx-tw/table/table.ts:1198` (`multiTemplateRows` requirement), `projects/ngx-tw/input/input.ts:347` (unsupported input `type`).

`projects/ngx-tw/form-field/form-field.ts:632-635` documents the opposite policy for the identical situation and follows it:

> *"Reports via `console.error` instead of `throw` so an authoring mistake surfaces during development without crashing the surrounding effect graph (which would otherwise leave Angular in an unrecoverable error state)."*

An exception thrown from an effect body puts the effect into an errored state and can cascade. Either adopt `console.error` at the three sites, or record why `table` / `input` deliberately want a hard failure.

---

# Dimension 6 — Memory / lifecycle hygiene

## 6.1 Overall posture

Teardown discipline is strong and consistent. Verified paired create/destroy for:

- **CDK overlays** — `select.ts:949`, `combobox.ts`, `popover.ts:445`, `command-palette.ts:615`, `tooltip.ts:390`, plus `core/overlay/picker-overlay-coordinator.ts` (owns `dispose` + timer clearing for date-picker / date-range-picker) and `core/overlay/overlay-container-coordinator.ts:91/179`.
- **`FocusMonitor.monitor()` → `stopMonitoring()`** — `button.ts:208/210`, `item.ts:177/179`, `sort/sort-header.ts:267/274`, `input.ts:305/318`, `select.ts:927/944`, `combobox.ts:832`, `date-picker.ts:917/930`, `date-range-picker.ts:909/922`, `time-picker.ts:871/887`, `slider.ts`, `checkbox`, `switch`, `radio`, `tags-input`, `transfer`, `file-upload`. **No unmatched `monitor()` found.**
- **Observers** — `carousel.ts` (`IntersectionObserver` + `ResizeObserver`, both disconnected in `_teardownViewport`), `tabs.ts:567`, `split.ts:233`, `timeline.ts:723-725`, `flip-card.ts:269`, `form-field.ts:665` (via `onCleanup`), `select.ts:947`, `combobox.ts`.
- **`FocusKeyManager`** — every construction site uses `effect((onCleanup) => …)` with `manager.destroy()`: `paginator.ts:848`, `collapsible.ts:484`, `tab-nav.ts:257`, `tabs.ts:561`. `onCleanup` fires on both rebuild and destroy, so no separate hook is needed.
- **Subscriptions** — `takeUntilDestroyed` or explicit `unsubscribe()` everywhere checked (`stepper.ts:400`, `input.ts:307/358/375/383`, `menu.ts:306/366`, `tab-nav.ts:202`, `tabs.ts:528`, `split.ts:252`, `timeline.ts:732`, `core/form-reset.ts`, `core/overlay/escape.ts`, all four picker components).
- **Timers** — `carousel` (loop-jump + scroll debounce, both cleared in `_teardownViewport`), `code-block.ts:202-204`, `toast-ref.ts:308-314/331/348`, `command-palette.ts:611-612`, `popover.ts:438-442`, `select.ts:945`, `tooltip.ts:388`.

## 6.2 Leak candidates

### **L-6 — `carousel`: post-interaction pause timer is never cleared on destroy** — LOW

`projects/ngx-tw/carousel/carousel.ts:1324-1331`

```ts
this._postInteractionPauseUntil.set(Date.now() + this._effectiveAutoplayInterval() * 2);
setTimeout(() => {
  if (this._postInteractionPauseUntil() !== null && Date.now() >= (this._postInteractionPauseUntil() ?? 0)) {
    this._postInteractionPauseUntil.set(null);
  }
}, this._effectiveAutoplayInterval() * 2 + 16);
```

The handle is not stored, so `_teardownViewport()` (which meticulously clears `_scrollDebounceTimer`, `_loopJumpHandle`, and `_loopJumpSafetyHandle` at `:884-902`) cannot clear it. If the carousel is destroyed within `2 × autoplayInterval + 16 ms` of a drag release (≥ 2 s by default), the callback still fires and writes a signal on a destroyed component, holding the component alive until then. Fix: store the handle in a field and clear it alongside the others.

### **L-7 — `toast-container` has no destroy hook; swipe pointer listeners can outlive an interrupted drag** — LOW

`projects/ngx-tw/toast/toast-container.ts:300-302` adds `pointermove` / `pointerup` / `pointercancel` on the toast element in `onSwipeStart`; they are removed **only** in `onSwipeEnd` (`:322-326`). The file contains **no** `DestroyRef` / `ngOnDestroy` at all. If the toast auto-dismisses (timeout) or the container is torn down mid-swipe, the listeners are never removed and `el.releasePointerCapture` is never called.

Mitigating: `swipeSessions` is a `WeakMap` (`:172`), so no map entry is retained, and the listeners live on a DOM node that is detached with the toast — normally collectible. Contrast `carousel.ts:1231-1236` and `slider.ts:1108-1113`, both of which explicitly handle the destroy-mid-drag race. Recommend matching that pattern for consistency and to guarantee pointer-capture release.

### **L-8 (observational) — `dialog-ref` / `sheet-ref` never unsubscribe from CDK streams** — LOW / no action

`projects/ngx-tw/dialog/dialog-ref.ts:81/82/99/113/115/130` and the identical `projects/ngx-tw/sheet/sheet-ref.ts:88/89/104/118/120/141` subscribe to `cdkRef.backdropClick`, `keydownEvents`, and `overlayRef.detachments()` with no `takeUntilDestroyed` / stored `Subscription`. This is **safe**: CDK completes all three observables when the overlay is disposed, and `dispose()` (`dialog-ref.ts:279-280`) completes the ref's own `Subject`s. Listed only so a future reviewer running the same sweep does not re-open it.

### **L-9 (observational) — `stat.ts` `afterRenderEffect` may not re-run when projected text changes** — LOW

`projects/ngx-tw/stat/stat.ts:298-309`. The comment claims *"afterRenderEffect runs after each render so projection changes are captured."* `afterRenderEffect` is a **reactive** effect: it re-runs when its tracked dependencies change, and the only tracked read here is `this.textEl()` (a `viewChild` whose reference is stable). `el.textContent` is an untracked DOM read. Consequence: if the consumer swaps the projected delta text without changing the `#textEl` node identity, `projectedText` — and therefore `composedAriaLabel` — can go stale. Worth a targeted spec before deciding whether it is a real defect.

---

# Appendix A — Cross-cutting convention note

### **L-1 — Signal writes inside `effect()` not wrapped in `untracked()` (7 sites)** — LOW

CLAUDE.md: *"The only permitted signal write inside an `effect()` is a one-way sync to a **different** signal the effect does **not** track-read … Such a write **must** be wrapped in `untracked()`."*

All seven sites below satisfy the semantic condition (the written signal is never track-read by that effect) but omit the wrapper:

| Site | Written signal | Owner |
|---|---|---|
| `projects/ngx-tw/avatar/avatar.ts:288` | `avatar.groupHidden` | child `AvatarComponent` |
| `projects/ngx-tw/calendar/calendar-form-directives.ts:52` | `host.cvaDisabled` | host `CalendarComponent` |
| `projects/ngx-tw/calendar/calendar-form-directives.ts:55` | `host.cvaReadonly` | host `CalendarComponent` |
| `projects/ngx-tw/form-field/form-field.ts:652`, `:657` | `restingLabelOffset` | self |
| `projects/ngx-tw/tab-nav/tab-nav.ts:217` | `panel.activeTabId` | associated `TabNavPanel` |
| `projects/ngx-tw/date-range-picker/date-range-picker-overlay.ts:400` | `option.tabindex` | child directive |
| `projects/ngx-tw/stat/stat.ts:305`, `:309` | `projectedText` | self (`afterRenderEffect`) |

None of these can cycle today. Adding `untracked()` costs nothing, makes the invariant locally checkable, and matches the pattern already used at `collapsible.ts:458`, `table.ts:1146/1175`, `tree.ts:324/336`, `select.ts:874`, `combobox.ts:765`, `date-picker.ts:853`, `date-range-picker.ts:837`, `form-field.ts:611/629`, and `tab-nav.ts:211/219-220` (the same effect, for a different signal).

---

# Appendix B — Prioritised action list

| Rank | ID | Severity | Action |
|---|---|---|---|
| 1 | **M-3** | MEDIUM | Delete the contradictory `ngOnInit` comment + redundant `valueAccessor` assignment in `date-range-picker.ts:936-941`. It is a live trip-wire for the exact bug CLAUDE.md documents. |
| 2 | **M-1** | MEDIUM | Add paginator-style guard justification comments to the four overlay-lifecycle effects (`select:837`, `combobox:732`, `date-picker:811`, `date-range-picker:784`), or demote `overlayInstance`/`closing` to plain fields as `popover`/`command-palette` already do. |
| 3 | **M-4** | MEDIUM | Fix CLAUDE.md: add `date-picker` + `time-picker` to the Shape-B list; rewrite the `input`/`textarea` exception to name `number-input` + `segmented-control` (neither `input` nor `textarea` implements CVA, and `input` *does* integrate the matcher). |
| 4 | **M-5** | MEDIUM | Add a `calendar-form-directives.spec.ts` (signal-forms) and template-driven (`ngModel`) coverage to `calendar.spec.ts`. |
| 5 | **M-2** | MEDIUM | Decide `calendar.mode`: `computed()` (nothing writes it) or keep `WritableSignal` and add JSDoc explaining the intended override contract. Either way it currently has no JSDoc. |
| 6 | **L-6 / L-7** | LOW | Store + clear the carousel post-interaction timer; add a `DestroyRef.onDestroy` swipe cleanup to `toast-container`. |
| 7 | **L-1 / L-2 / L-5 / L-4 / L-9** | LOW | `untracked()` wrappers; `untracked()` around `openOverlay()` calls; `console.error` instead of `throw` in dev effects; transfer signal-forms spec; a spec pinning `stat`'s projected-text behaviour. |
