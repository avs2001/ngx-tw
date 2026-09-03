# P7 — picker harnesses (`combobox`, `date-picker`, `date-range-picker`, `time-picker`)

Four new `testing/` entry points. **No existing library file was modified.** Files created:

    projects/ngx-tw/combobox/testing/{ng-package.json,index.ts,combobox-harness.ts,combobox-option-harness.ts,combobox-harness.spec.ts}
    projects/ngx-tw/date-picker/testing/{ng-package.json,index.ts,date-picker-harness.ts,date-picker-harness.spec.ts}
    projects/ngx-tw/date-range-picker/testing/{ng-package.json,index.ts,date-range-picker-harness.ts,date-range-picker-harness.spec.ts}
    projects/ngx-tw/time-picker/testing/{ng-package.json,index.ts,time-picker-harness.ts,time-picker-harness.spec.ts}

`angular.json` / `tsconfig.spec.json` needed no edit — both already glob `../<component>/**/*.spec.ts`,
so the new specs are picked up automatically.

---

## Public surface (semver-frozen — method names only)

### `ComboboxHarness` (`@cdevhub/ngx-tw/combobox/testing`)

`with({label, inputValue, disabled})` · `getLabel` · `getInputValue` · `getPlaceholder` ·
`setInputValue` · `isOpen` · `isDisabled` · `isInvalid` · `isRequired` · `open` · `close` ·
`getOptions` · `getOptionTexts` · `selectOption` · `hasClearButton` · `clear`

`ComboboxOptionHarness`: `with({text, selected, disabled})` · `getText` · `isSelected` ·
`isDisabled` · `click`

### `DatePickerHarness` (`@cdevhub/ngx-tw/date-picker/testing`)

`with({label, value, disabled})` · `getLabel` · `getValue` · `getPlaceholder` · `setValue` ·
`isOpen` · `isDisabled` · `isInvalid` · `isRequired` · `open` · `close` · `getCalendar` ·
`selectDay` · `clickAction` · `hasClearButton` · `clear`

### `DateRangePickerHarness` (`@cdevhub/ngx-tw/date-range-picker/testing`)

`with({label, triggerText, disabled})` · `getLabel` · `getTriggerText` · `getStartText` ·
`getEndText` · `isOpen` · `isDisabled` · `isInvalid` · `isRequired` · `open` · `close` ·
`getCalendar` · `selectRange` · `clickAction` · `hasClearButton` · `clear`

### `TimePickerHarness` (`@cdevhub/ngx-tw/time-picker/testing`)

`with({label, disabled})` · `getLabel` · `hasSeconds` · `hasSteppers` · `getValue(field)` ·
`getValueText(field)` · `setValue(field, n)` · `clearValue(field)` · `getMeridiem` ·
`setMeridiem` · `stepUp(field?)` · `stepDown(field?)` · `isDisabled` · `isInvalid` ·
`isRequired` · `hasClearButton` · `clear`
Exported types: `TimePickerHarnessField` (`'hour'|'minute'|'second'`), `TimePickerHarnessMeridiem`.

**Calendar composition, not reimplementation.** `date-picker` and `date-range-picker` both import
`CalendarHarness` from `@cdevhub/ngx-tw/calendar/testing` and expose it via `getCalendar()`;
`selectDay` / `selectRange` delegate to its `selectCell` / `selectRange`. No day-grid logic was
duplicated.

**Overlay resolution follows the corrected `select/testing` pattern.** Every overlay-bearing harness
resolves its panel through the protected `documentRootLocatorFactory()`, and every spec's
`beforeEach` uses the plain `TestbedHarnessEnvironment.loader(fixture)` — so a regression that
pushed overlay knowledge back onto consumers would empty those assertions.

**Every method above has at least one assertion behind it**, and each spec asserts a state *change*
across an interaction rather than a single read — including `isInvalid`, which is exercised through
a `[formControl]` with `Validators.required` going `false → true → false` across `markAsTouched()`
and then `setValue(...)`. Those same tests double as the guard that `Validators.required` reaches
`aria-required` without the consumer also writing `[required]`.

---

## Deliberately left out

- **Presets** on both date pickers. `presets` is public API and reachable (`[role="option"]` inside
  the overlay), but the brief's surface list doesn't include it and a `selectPreset` method is a
  permanent promise. If wanted later it is two lines on top of `clickAction`'s locator.
- **Keyboard navigation** on `combobox` (ArrowUp/Down through `aria-activedescendant`). The
  highlight lives on the *input*, not on an option, so exposing it means minting a
  `getActiveOptionText()` concept that has no counterpart in `select/testing`. Left to
  `select`-shaped parity if a consumer ever asks.
- **`getSelectedOptionTexts()`** on `combobox` (the `select` harness has it). `combobox` is
  single-select and its committed value is already readable via `getInputValue()`; the per-option
  `isSelected()` + `getOptions({selected:true})` covers the rest without a third spelling.
- **Time-of-day fields inside the date pickers** (`timeConfig` / `showTime` render nested
  `tw-time-picker`s in the overlay). Reachable today by loading `TimePickerHarness` from the
  document-root loader; a `getTimePicker()` shortcut would be speculative and, for the range
  picker, currently unusable (see the `pendingRange` finding below).
- **`combobox` groups.** `role="group"` headers render, but no consumer surface reads them.

---

## Findings — component-side gaps and defects

These are the parts nobody else will reconstruct.

### 1. `combobox.ts` — selection highlight drifts to the wrong row during the leave animation

The state-push effect (`combobox.ts` ~:772) early-returns on `this.closing`, deliberately freezing
`renderedRows` so the list doesn't visibly re-filter mid-animation. But the same effect pushes
`isSelected` as a **live closure**:

```ts
instance.isSelected.set((index: number) => this.isVisibleOptionSelected(index));
```

So for the ~120 ms leave window the panel holds *frozen* rows while resolving selection against the
*current* (now-filtered) `visibleOptions()`. Committing `Banana` filters the list to one entry, and
the still-mounted row at index 0 — `Apple` — renders `aria-selected="true"`.

Found empirically: a spec that picked an option and immediately re-read `getOptions({selected:true})`
returned exactly one option, `Apple`. This is a real a11y-visible defect (SC 4.1.2), not a test
artifact. The spec now seeds the value through the bound model instead of asserting through that
window, with the reason recorded inline. **Not fixed here — it is a library file I do not own.**

Likely fix: snapshot the selection predicate alongside the frozen rows (push a plain
`readonly boolean[]` instead of a closure), or don't freeze `isSelected` independently of
`renderedRows`.

### 2. `date-range-picker.startAt` is a dead input

`date-range-picker.ts:400` declares `readonly startAt = input<D | null>(null)` and **nothing ever
reads it** — `grep -n startAt date-range-picker.ts` returns that one line. The overlay anchors its
calendar via `initialStartAt()` (`date-range-picker-overlay.ts:342`), derived from `pendingRange`.
Consequence: the range picker's calendar always opens on *today's* month, and a consumer setting
`startAt` gets silence. (`date-picker` does forward it — `date-picker.ts:910/932`.)

This is the root cause of the `it.skip` at `date-range-picker.spec.ts:502`, and it forced the new
harness spec to assert on day-of-month rather than a fixed month.

### 3. Reopening inside the leave window silently no-ops (all overlay pickers)

`PickerOverlayCoordinator.open()` returns `null` while `overlayRef` is still set
(`picker-overlay-coordinator.ts:158`), and every consumer's `openOverlay()` early-returns on that.
A `close()` immediately followed by `open()` therefore leaves `aria-expanded="true"` with the
**stale, outgoing** panel mounted — and once the 120 ms timer fires, open with *no* panel at all.
Documented in each harness's `close()` JSDoc since it is a semver-frozen surface and the warning
gets impossible to add later.

### 4. `DatePickerHarness` cannot drive a projected `[slot=trigger]`

With a custom trigger, `hasCustomTrigger()` suppresses both the text input and
`button[aria-haspopup="dialog"]`, so `open`/`close`/`isOpen`/`getValue` all fail to resolve.
Documented on the class. No stable hook exists for the custom-trigger path and I did not add one —
a `data-*` attribute is public API forever.

### 5. Hooks that are *only just* stable enough (no change requested, recorded for the next reader)

| Harness | Locator | Why it is fragile |
|---|---|---|
| `DatePickerHarness.clearButton` | `button:not([aria-haspopup])` | negative match against the trigger; the clear button's own `aria-label` is the consumer input `clearAriaLabel`, so label-matching would break under i18n |
| `DateRangePickerHarness` start/end | `button[role="combobox"] span > span`, positional | the three spans carry only classes; nothing semantic distinguishes start from end |
| `TimePickerHarness` fields | positional over `input[role="spinbutton"]` | field `aria-label`s come from the injectable `TimePickerIntl`; a localized app breaks any label selector |
| `TimePickerHarness` steppers | `:scope > div:not([role]) > button` | discriminated only by "the wrapper with no role"; `:scope` verified to work under jsdom 28 |
| `TimePickerHarness` clear | `:scope > button` | the only direct-child button; `clearLabel` is a consumer input |

If the maintainer ever wants these hardened, the cheapest durable fix is a `data-part="…"`
convention on picker sub-elements — but that is a public-API decision, not a test-time one.

### 6. The brief's JSDoc rationale does not hold for `testing/` entry points

The brief says JSDoc on harness members is read by `scripts/mcp/extract-api.mjs` and "ships in
`dist/ngx-tw/index.json`". After a clean `build:lib`, **no harness appears in that index** — not
mine, and not the pre-existing `CalendarHarness` / `SelectHarness` either:

```
CalendarHarness absent   SelectHarness absent   ComboboxHarness absent
DatePickerHarness absent DateRangePickerHarness absent TimePickerHarness absent
```

So `testing/` entry points are not indexed today. Not a regression, and the JSDoc is still worth
writing (it is what a consumer sees on hover, and these are semver-frozen APIs) — but if the index
is meant to cover harnesses, `build-mcp-index.mjs` needs to be pointed at them.

### 7. Two CDK facts worth writing down

- `TestElement.setInputValue()` assigns `element.value` and **does not** dispatch `input`. Every
  harness that types has to `dispatchEvent('input')` itself.
- `TestElement.dispatchEvent(name, data)` does `Object.assign(new Event(name), data)`. Passing
  `{ bubbles: true }` **throws** (`Cannot set property bubbles of #<Event> which has only a getter`).
  Pass only non-`Event` own properties — e.g. `{ inputType: 'insertText', data: '4' }`, which is
  exactly what `tw-time-picker`'s `beforeinput`-driven digit entry needs (`typeInElement` never
  emits `beforeinput`, so `sendKeys` cannot type into a time field).
- `HarnessPredicate.stringMatches` is `async`. Forgetting `await` compiles to a truthy `Promise` and
  silently matches everything — caught here by `TS2801` only because `strictTemplates`/strict mode
  is on.

---

## The four `it.skip`s in `date-range-picker.spec.ts` — verdict

Per the standing "do not modify any existing library file" constraint I did **not** edit
`date-range-picker.spec.ts`. Equivalent coverage now lives in
`date-range-picker/testing/date-range-picker-harness.spec.ts`. Note the originals' bodies use the
index-based `document.querySelectorAll('tw-calendar-cell button')[0]/[5]` that *was itself the bug*,
so re-enabling them verbatim would not pass — they need rewriting, not un-skipping.

| Skipped test | Verdict |
|---|---|
| `:528` `commits after two clicks … emits rangeChange with source="calendar"` | **Unblocked.** Root cause was exactly what its TODO guessed: index-based cell selection landed on adjacent-month leading days the range strategy rejects. `CalendarHarness.selectRange('10','15')` selects by cell *text*, and in-month days always precede trailing out-of-month days with the same number, so the first match is always in-month. Covered by *“commits a range from two calendar clicks”*. **Now redundant — safe for the orchestrator to delete.** |
| `:550` `stays open when showActions=true, commits on Apply` | **Unblocked.** Same cell-selection root cause, plus it needed an action-bar click, which `clickAction('Apply')` provides. Covered by *“holds the range pending until the Apply action confirms it”*. **Now redundant — safe to delete.** |
| `:502` combined period label `"April – May 2026"` | **Not unblocked.** Nothing to do with test technique — see finding #2: `startAt` is never forwarded and the calendar's `_activeDate` `linkedSignal` does not react to a later `startAt` push, so the overlay always opens on today. Needs a component fix. |
| `:634` `renders two time pickers when showTime=true` | **Not unblocked.** `pendingRange` reaches the overlay after its first render, so `hasTimeablePending()` is false on first paint. Needs the overlay to seed `pendingRange` synchronously on attach. |

---

## Gate results

All green for the four directories I own. Every run below is real output, not a claim.

| Gate | Result |
|---|---|
| `ng test ngx-tw --include=../{combobox,date-picker,date-range-picker,time-picker}/testing/*.spec.ts` | **52 / 52 passed**, 4 / 4 files — run against the freshly built `dist/` |
| `npm run build:lib` | **PASS.** All four new entry points built: `@cdevhub/ngx-tw/{combobox,date-picker,date-range-picker,time-picker}/testing` |
| ng-packagr entry-point ordering | **PASS.** `calendar/testing` is built *before* `date-picker/testing` and `date-range-picker/testing`. This is the first entry-point → *nested* entry-point internal import in the package, so it was the one genuinely novel build risk; it resolved correctly. |
| `dist/ngx-tw/package.json` exports map | **PASS.** All four `./x/testing` keys present with `types` + `default`, 76 entries total |
| Shipped-bundle imports vs declared peers | **PASS.** The only external import in all four bundles is `@angular/cdk/testing`, covered by the existing `@angular/cdk` peer. `date-picker`/`date-range-picker` additionally self-reference `@cdevhub/ngx-tw/calendar/testing`, which resolves through the package's own exports map. **No `package.json` change was needed.** |
| `npm run verify:package` | **PASS** (theme resolves, component utilities present, 177 KB compiled from a clean consumer install) |
| `npx eslint` on the four new directories | **PASS**, zero findings |
| `git status` on the four component directories | **clean apart from the four new untracked `testing/` dirs** — no existing library file was touched |
| `ng test ngx-tw` (full suite) | **3528 passed / 0 failed / 4 skipped**, 97 of 97 files green. An earlier run at 18:58 was 3521/3 with all three failures in a sibling's `tooltip/testing/tooltip-harness.spec.ts`; that agent has since fixed them. The 4 skips are the untouched `it.skip`s in `date-range-picker.spec.ts` — verified as the only skips in the library: `grep -rn "it\.skip\|describe\.skip" projects/ngx-tw --include=*.spec.ts` returns exactly those four plus one prose reference in my own new spec. |

### Notes on running these gates concurrently

Three sibling agents were building and testing throughout. Two failure modes recur and are **not**
real:

- `Missing "./core" specifier in "@cdevhub/ngx-tw" package` / `Cannot find module
  '@cdevhub/ngx-tw/<x>'` during `ng test` — `dist/` is being rewritten by a concurrent
  `build:lib`. Wait and re-run.
- `Cannot find module '@cdevhub/ngx-tw/skeleton'` *during* `build:lib` — two `ng build` processes
  clobbering `dist/`. Wait for `ps aux | grep "ng build"` to clear first; a serialised build
  succeeded first try.

A genuine ng-packagr *ordering / dependency-graph* error would look different (it names the entry
point graph, not a module path) and did not occur.

### Two real bugs I hit while writing this that are worth keeping

Both are recorded in finding #7 above, but they cost the most time, so: `TestElement.setInputValue`
does not dispatch `input`, and `TestElement.dispatchEvent(name, { bubbles: true })` **throws**
because `Object.assign` cannot write `Event.bubbles`. Neither is documented in the CDK harness
guide.
