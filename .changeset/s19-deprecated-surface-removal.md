---
'ngx-tw': minor
---

**BREAKING — calendar outputs removed.** The three never-firing public outputs `opened`, `closed`, and `renderedMonthsCount` are gone from `tw-calendar`. Each carried `@deprecated v1: inline-only` JSDoc and never emitted in inline mode; the picker overlay components (`tw-date-picker`, `tw-date-range-picker`) wire their own `(opened) / (closed)` events directly via `PickerOverlayCoordinator` (S18) and do not forward the calendar's. Migration: subscribe to the picker-level events; no replacement exists for `renderedMonthsCount`.

**BREAKING — calendar input removed.** `[blockInvalidRangeCommit]` is gone. It shipped as a no-op + dev warning and the warning told consumers to subscribe to `rangePreview.invalidPreview` together with the `calendarRangeTooShort` / `calendarRangeTooLong` validator codes — those paths remain unchanged and are now the documented integration point.

**BREAKING — calendar range-behavior consolidation.** The four standalone booleans `[allowSingleDayRange]`, `[persistPartialRange]`, `[allowBackwardRange]`, and `[disableRangesCrossingDisabledDates]` are gone. They collapse into a single `[rangeBehavior]` input that accepts `Partial<RangeBehaviorConfig>` (new shared type exported from `ngx-tw/core`). Unset fields fall back to the documented per-field defaults — behavior matches v0.x exactly. The four codified `true`-default rationales (which lived on the individual inputs) now live on the `RangeBehaviorConfig` interface JSDoc.

Before:
```html
<tw-calendar
  mode="range"
  [allowSingleDayRange]="false"
  [allowBackwardRange]="true"
/>
```
After:
```html
<tw-calendar
  mode="range"
  [rangeBehavior]="{ allowSingleDayRange: false, allowBackwardRange: true }"
/>
```

**BREAKING — date-range-picker range-behavior consolidation.** The four mirror inputs on `tw-date-range-picker` (`[allowSingleDayRange]`, `[persistPartialRange]`, `[allowBackwardRange]`, `[disableRangesCrossingDisabledDates]`) also collapse into a single `[rangeBehavior]` input with the same `Partial<RangeBehaviorConfig>` shape. Path (a) was chosen over keeping individual inputs (path (b)) because the picker's surface is a 1:1 forward of the calendar's; splitting the breaking change across two API shapes buys nothing.

Before:
```html
<tw-date-range-picker [allowBackwardRange]="true" [persistPartialRange]="false" />
```
After:
```html
<tw-date-range-picker [rangeBehavior]="{ allowBackwardRange: true, persistPartialRange: false }" />
```

**BREAKING — date-picker time inputs removed.** All eight `@deprecated v2` standalone time inputs (`[withTime]` / alias of `withTimeInput`, `[timeFormat]`, `[showSeconds]`, `[hourStep]`, `[minuteStep]`, `[secondStep]`, `[minTime]`, `[maxTime]`) are gone. `[timeConfig]` — already shipping — is canonical. Pass `null` to hide the embedded `<tw-time-picker>`; pass `{}` to enable it with all defaults; supply any field to override the per-field default.

Audit prompt cited "nine" deprecated inputs; verified count is **eight**. The mapping is 1:1:

| v0.x input                | v1 replacement                       |
|---------------------------|---------------------------------------|
| `[withTime]="true"`       | `[timeConfig]="{}"`                  |
| `timeFormat="12h"`        | `[timeConfig]="{ format: '12h' }"`   |
| `[showSeconds]="true"`    | `[timeConfig]="{ showSeconds: true }"`|
| `[hourStep]="2"`          | `[timeConfig]="{ hourStep: 2 }"`     |
| `[minuteStep]="15"`       | `[timeConfig]="{ minuteStep: 15 }"`  |
| `[secondStep]="5"`        | `[timeConfig]="{ secondStep: 5 }"`   |
| `[minTime]="t"`           | `[timeConfig]="{ minTime: t }"`      |
| `[maxTime]="t"`           | `[timeConfig]="{ maxTime: t }"`      |

Before:
```html
<tw-date-picker [(value)]="deadline"
  [withTime]="true"
  timeFormat="12h"
  [showSeconds]="true"
  [showActions]="true"
/>
```
After:
```html
<tw-date-picker [(value)]="deadline"
  [timeConfig]="{ format: '12h', showSeconds: true }"
  [showActions]="true"
/>
```

**Internal.** `RangeBehaviorConfig` is a new shared interface exported from `ngx-tw/core`. The calendar exposes a private `_resolvedRangeBehavior: Signal<RangeBehaviorConfig>` computed that merges the consumer-supplied partial over the documented per-field defaults; every internal read site now reads `_resolvedRangeBehavior().X` instead of four individual inputs. The `[REC]` dev warning that fired on `[blockInvalidRangeCommit]` is also gone; the `isDevMode()` import in `calendar.ts` is still used by the existing `_warnedShapeMismatch` warnings and remains.

**Internal — date-picker.** `effectiveTimeConfig` now merges `timeConfig` over per-field literal defaults (`'24h'`, `false`, `1`, `1`, `1`, `null`, `null`) — there are no longer any deprecated-input fallbacks to consult. `withTime` simplifies to `this.timeConfig() !== null`. The overlay (`date-picker-overlay.ts`) is unchanged: it keeps individual signals fed from the parent's destructured `effectiveTimeConfig`, since each signal binds to a `<tw-time-picker>` property.

**Internal — date-range-picker.** Both effect-driven mirror blocks (`date-range-picker.ts:~819`, `:~1180`) simplify from four `instance.X.set(this.X())` calls to a single `instance.rangeBehavior.set(this.rangeBehavior())`. `date-range-picker-overlay.ts` template binding goes from four `[xxx]="xxx()"` rows to one `[rangeBehavior]="rangeBehavior()"`, and the four overlay signals collapse into a single `rangeBehavior = signal<Partial<RangeBehaviorConfig>>({})`.

**Demo.** Calendar API table replaces the four range-behavior rows with one `rangeBehavior` row pointing at `RangeBehaviorConfig`. Date-range-picker API table mirrors the same consolidation. Date-picker API table drops the three deprecated rows (`withTime`, `timeFormat`, `showSeconds` — the other five were never rendered as separate rows). Date-picker examples "With time" section + `withTimeSnippet` migrate to `[timeConfig]="{}"` and `[timeConfig]="{ format: '12h', showSeconds: true }"`. The date-picker playground's three time-related buttons (`withTime` / `12h` / `seconds`) now drive a single `playTimeConfig: Signal<DatePickerTimeConfig<Date> | null>` and the `<tw-date-picker>` binding shrinks to `[timeConfig]="playTimeConfig()"`. Calendar examples' "Range click behavior" copy updates the inline `<code>` blurbs to the new shape.

**CLAUDE.md.** The two codified `true`-default entries (`calendar.allowSingleDayRange`, `calendar.persistPartialRange`) are dropped — the rationale moves naturally to the `RangeBehaviorConfig` interface JSDoc, where each field's default is documented inline. `calendar.bordered` and `calendar.showAdjacentMonths` remain on the codified list (those inputs survive).

**Spec.** Calendar `phase-placeholder outputs` describe is replaced with two dropped-surface assertions (`opened` / `closed` / `renderedMonthsCount` undefined; `blockInvalidRangeCommit` + the four booleans undefined). A new `rangeBehavior config` describe adds four tests: defaults applied when input unset, `allowSingleDayRange: false` rejects same-cell second click, `allowBackwardRange: true` skips auto-swap, partial config merges over defaults. Date-picker's `back-compat: legacy [withTime] alias` test is removed and replaced with an assertion that all eight deprecated inputs are no longer on the component. Test count: 2614 (S18 baseline) → 2619 (+5 net).

**Out of scope.** `monthColumns` Phase 9 cap (audit Low) untouched. Calendar CVA / NG_VALUE_ACCESSOR migration to runtime stays in a future session. No new picker features; no overlay-coordinator changes.

**Risk note.** The `_resolvedRangeBehavior` computed uses object spread, which is safe for both partial and full `RangeBehaviorConfig` values consumers might pass — spreading a full config over the defaults still yields the full config. Consumers who passed `[allowSingleDayRange]="value"` via Angular's framework-level `setInput` API in their tests will see the input no longer exist (runtime ignore in template, hard error in `setInput`); they must migrate to `[rangeBehavior]="{ allowSingleDayRange: value }"`. Picker-level `(opened)` events were already independent from the calendar's (S18 wired them via `PickerOverlayCoordinator.opened$`), so the calendar-output removal has no observable behavior change for picker consumers.
