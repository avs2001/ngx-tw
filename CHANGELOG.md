# Changelog

All notable changes to **ngx-tw** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed — packaging (consumer-facing, previously silent)

Both of these made the published `0.2.1` unusable from npm. Neither broke the
build, the unit tests, the e2e suite, or the demo app; see
`docs/production-audit.md` for the full write-up.

- **`@cdevhub/ngx-tw/theme/index.css` now resolves.** The stylesheet shipped in
  the tarball but the generated `exports` map had no entry for the subpath, so
  the documented import failed with *"not exported under the condition style"*.
  `projects/ngx-tw/package.json` now declares `"./theme/*.css"`.
- **The theme now generates component utilities.** The shipped theme's
  `@source` glob pointed at `../src/**/*.ts` — a directory the published package
  does not contain. Tailwind does not error on a glob that matches nothing, so
  consumer builds emitted semantic tokens and base styles but *zero* component
  utilities; components rendered structurally correct and completely unstyled.
  The glob now points at `../fesm2022/**/*.mjs`.
- **Peer range raised to Angular `^22.0.0`** (`@angular/core`, `@angular/common`,
  `@angular/cdk`). The published `0.2.1` still declares `^21`, so Angular 22
  consumers hit `ERESOLVE`. READMEs updated to match.

### Fixed — component-layer findings H3–H8

- **`tw-stepper` had no working keyboard navigation at all.** CdkStepper queries
  step headers with `@ContentChildren`, but `tw-stepper` renders them in its own
  template, so the FocusKeyManager was built over zero items and every arrow /
  Home / End press was a silent no-op. Re-declared as a view query (as Angular
  Material does). With navigation working, the missing roving tabindex now
  matters: headers are a single tab stop with arrow traversal inside, per APG.
- **`tw-table` selection and expansion are keyed by `trackBy`**, not object
  reference. An HTTP refetch or immutable store previously emptied the user's
  selection silently. `isSelected` is now an O(1) keyed lookup instead of a
  per-row linear scan on every change-detection cycle.
- **`tw-table`'s master select-all is hidden for `Observable`/`DataSource`
  inputs**, where it rendered but could never work.
- **`tw-popover` / `tw-command-palette` cancel a pending close when reopened**
  during the leave animation, instead of swallowing the reopen and writing
  `false` back over the consumer's two-way-bound `true`.
- **`tw-tabs` / `tw-tab-nav` honour layout direction.** Arrow keys were
  hardcoded LTR, so they inverted in RTL locales.
- **`tw-calendar`'s `open()`/`close()`/`toggle()` throw in dev mode** instead of
  being silent no-ops documented as working; `revalidate()` now actually
  re-runs the validator.

### Fixed — form validity (H1/H2 from the production audit)

Both pickers rendered an error border while telling the form everything was
fine, so a `form.invalid` submit guard let the bad value through.

- **`tw-date-picker` constraint and parse failures now reach the form.** Typed
  input outside `minDate`/`maxDate` (or rejected by `dateFilter`) is now
  committed *and* marks the control invalid with the same `calendarMinDate` /
  `calendarMaxDate` / `calendarDisabledDate` codes `tw-calendar` and
  `tw-date-range-picker` already emit. Unparseable text clears the form value —
  previously the **previous date silently survived** and would be submitted —
  and surfaces `calendarInvalidValue`, while leaving the typed text on screen to
  correct. `minDate`/`maxDate`/`dateFilter` changes re-run validation.
- **`tw-time-picker` `minTime`/`maxTime` are no longer decorative.** They now
  emit `timePickerMin` / `timePickerMax` on the bound control. New exported type
  `TimePickerValidationErrors`.
- **Signal-forms bindings are covered too.** Angular v22 maps a classic
  `NG_VALIDATORS` error key onto a signal-forms `ValidationError` whose `kind` is
  that key, so `[formField]` consumers get the same codes as `[formControl]` —
  and the same static `NG_VALUE_ACCESSOR` provider is what keeps both alive.
  `tw-date-picker`, `tw-time-picker` and `tw-date-range-picker` now each ship a
  signal-forms guard spec.
- Both components moved to the static `NG_VALUE_ACCESSOR` + deferred `NgControl`
  registration shape required by Angular v22 for a self-provided
  `NG_VALIDATORS`, and both ship the guard spec CLAUDE.md mandates. Each guard
  was verified to fail when the static provider is removed — 6 of 62 date-picker
  tests and 4 of 43 time-picker tests go red, and nothing else notices, which is
  exactly the silent failure the rule exists to prevent.
- `tw-date-picker`'s `rangeError` is now derived from the committed value rather
  than a flag set at commit time, so it stays correct when a constraint moves.
- JSDoc on `minDate`/`maxDate`/`dateFilter`/`minTime`/`maxTime` corrected — it
  promised only `errorState`, which is what made the gap easy to miss.

### Changed

- **Icon adapter now targets `lucide` instead of `lucide-angular`.**
  `lucide-angular@1.0.0` (its latest) declares `@angular/core`/`@angular/common`
  peers of `13.x - 21.x`, which excludes Angular 22 — `npm ci` failed with
  `ERESOLVE` on every CI job, and consumers would have hit the same wall. The
  framework-agnostic `lucide` package has **no peer dependencies at all**,
  exports the same PascalCase icon names, and emits the same
  `[tag, attrs][]` data, so `provideTwLucideIcons({ Star, Search })` is
  unchanged apart from the import specifier.
- **`@cdevhub/ngx-tw/icon/lucide` no longer emits a type import into its
  `.d.ts`.** It previously declared `import { LucideIconData } from
  'lucide-angular'` while the library depended on that package *nowhere* —
  so type-checking against this entry point silently required a package no
  manifest mentioned. The types (`LucideIconNode`, `LucideIconData`,
  `LucideIcons`) are now declared structurally and exported, leaving the entry
  point dependency-free and compatible with `lucide`, `lucide-angular`, or any
  source with the same shape.

### Added

- `npm run verify:package` — packs `dist/ngx-tw`, installs the tarball into a
  scratch project outside the repo, resolves the documented theme specifier with
  Tailwind's own resolver config, compiles it, and asserts real component
  utilities appear. Wired into `ci.yml`, `release.yml`, and the `release.mjs`
  pre-flight. This is the gate the two bugs above slipped past: the demo app
  imports the theme by relative path and Tailwind auto-detects the raw monorepo
  source, so no in-repo check can catch them.
- The release script now requires **`e2e.yml`** to be green in addition to
  `ci.yml`. `e2e.yml` owns the axe accessibility sweep, which previously could
  be fully red without blocking a publish.

The calendar component is undergoing a phased v1 cutover (see
`docs/calendar-refactoring-plan.md`). Phases 0, 1, 2, 3, 5, 18-baseline, and 19
have landed on `develop`. Phases 4 and 6 through 17 are still pending. Until v1
is tagged, every entry in this section is part of the same pre-release window
and APIs may shift again before the v1.0 tag.

### Added

#### Library scaffolding

- Initial set of 37 components exposed as secondary entry points:
  accordion, alert, avatar, badge, button, calendar, card, checkbox,
  code-block, collapsible, command-palette, date-picker, dialog, flip-card,
  form-field, icon, input, item, menu, paginator, popover, progress-bar,
  radio, segmented-control, select, separator, skeleton, slider, sort,
  spinner, stepper, switch, tab-nav, table, tabs, time-picker, toast,
  tooltip.
- Shared types (`TwColor`, `TwSize`) exported from `ngx-tw/core`.
- Default theme CSS at `ngx-tw/theme/default.css` mapping semantic tokens
  (info, success, warning, error, primary, secondary, accent, neutral) and
  surface/fg/border tokens to Tailwind palette colors, with built-in dark
  mode support.
- Keyframe animation classes (`fade-in`, `fade-out`, `scale-in`, `scale-out`,
  etc.) shipped with the default theme for use with Angular's native
  `animate.enter`/`animate.leave`.
- Unit test suites (Vitest) for every component.

#### Calendar — Phase 1 (type system, internal state model, event outputs) — *§7, §8, §11.2, §22.6, §33*

- Generic component signature `CalendarComponent<M, D, TOut>` where
  `M extends CalendarMode` narrows the value shape per mode.
- Spec-canonical types: `CalendarMode`, `CalendarSingleValue`,
  `CalendarMultipleValue`, `CalendarRangeValue`, `CalendarValue`,
  `CalendarSelectionState`, `CalendarViewState`, `CalendarOverlayState`,
  `CalendarErrorCode`, `CalendarValidationErrors`, `RangeClickBehavior`,
  `RangeGranularity`, `MaxSelectionBehavior`, `ResetBehavior`, `MobileMode`,
  plus event payload types `SelectionCompleteEvent`,
  `SelectionClearedEvent`, `RangePreviewEvent`, `ViewChangeEvent`,
  `ModeChangeEvent`. *§7.1, §7.4, §8, §10.2, §22.5, §33*
- Public readonly signals on `CalendarComponent`: `selectionState`,
  `viewState`, `activeDate`, `displayedMonths`, `lastInvalidFormValue`,
  `selectedPresetId`, `overlayState`. *§33.3*
- Public model signals: `mode`, `value`. *§33.1*
- Outputs: `valueChange`, `selectionStart`, `rangePreview`,
  `selectionComplete`, `selectionRestart`, `selectionCleared`,
  `selectionLimitReached`, `presetChange`, `viewChange`, `activeDateChange`,
  `monthChange`, `yearChange`, `opened`, `closed`, `cellClick`, `cellHover`,
  `renderedMonthsCount`, `modeChange`. *§33.2*
- Helper: `emptyCalendarValue<M, D>(mode)` returns the mode-agnostic empty
  value (`null` / `[]` / `{ start: null, end: null }`). *§7.4*
- Constants: `DAYS_PER_WEEK`, `WEEKS_PER_MONTH`, `YEARS_PER_PAGE`,
  `YEARS_PER_ROW`, `MONTHS_PER_ROW`.
- DI extension surface for selection: `CalendarSelectionStrategy`,
  `CALENDAR_SELECTION_STRATEGY`, plus shipped strategies
  `SingleSelectionStrategy`, `MultiSelectionStrategy`,
  `RangeSelectionStrategy`, `WeekSelectionStrategy`, and provider helpers
  (`provideSingleSelectionStrategy`, `provideMultiSelectionStrategy`,
  `provideRangeSelectionStrategy`, `provideWeekSelectionStrategy`,
  `provideCalendarSelectionStrategy`). Exposed via the `ngx-tw/calendar`
  entry point (re-exports `./selection`).

#### Calendar — Phase 2 (DateAdapter surface alignment) — *§20.1, §20.2*

- `DateAdapter<D>` is now spec-shape: 1-based-month `create(year, month, day)`,
  `addYears` / `addMonths` / `addDays` / `addHours` / `addMinutes`,
  `compare(first, second)`, `startOfWeek` / `endOfWeek` / `startOfDay`,
  `getDaysInWeek()`, `getDateNames(style)`, `toIso(date)` / `fromIso(iso)`.
- Optional TZ-aware virtuals on `DateAdapter`: `getTimezone()`,
  `withTimezone(date, tz)`, `isDST(date)`, `resolveAmbiguous(date, prefer)`.
  Floating adapters (`NativeDateAdapter`) implement these as pass-throughs;
  TZ-aware adapters (Luxon) override.
- DI tokens: `DATE_FORMATS` (with `DateFormats` interface), `TZ_OVERRIDE`
  (per-instance IANA timezone override), `DATE_SERIALIZATION` (transformer
  hook reserved for Phase 14). *§7.4, §4.3*
- Helper `serializeCalendarValue<M, D>(value, mode, adapter)` — adapter-driven
  ISO-8601 normalization for forms / persistence.
- Convenience providers: `provideNativeDateAdapter()` and
  `provideTwCalendar({ adapter, extraProviders })`.

#### Calendar — Phase 3 (form integration) — *§6, §10.2, §33.1*

- `CalendarComponent` registers with `NG_VALUE_ACCESSOR` and `NG_VALIDATORS`
  so it works with template-driven, reactive, and Signal Forms.
- Built-in validators: `calendarValidator(ctx)`, `calendarRequiredValidator(mode)`,
  helper `isCalendarValueEmpty(mode, value)`. Type
  `CalendarValidatorContext<M, D>` is exported.
- Signal Forms strict bindings: `CalendarSingleDirective`,
  `CalendarMultipleDirective`, `CalendarRangeDirective` — apply automatically
  on `<tw-calendar mode="single|multiple|range">` and implement
  `FormValueControl<T>` so `[field]="form.someDate"` infers cleanly. *§6.3, §7.3*
- Inputs: `readonly` (drives `aria-readonly`), `resetBehavior: 'full' | 'value-only'`
  (controls how `FormResetEvent` from `FormControl.reset()` restores internal
  state). *§6.5, §33.1*
- Wrong-shape `writeValue` payloads now preserve the prior value and surface
  `calendarInvalidValue` rather than throwing. *§7.2*

#### Calendar — Phase 5 (`CalendarIntl` + locale integration) — *§19*

- `CalendarIntl` injectable and `provideCalendarIntl(custom)` provider for
  partial overrides. *§19.4*
- Inputs on `CalendarComponent`: `locale: string | null` (falls back to
  Angular `LOCALE_ID`) and `intl: Partial<CalendarIntl> | null` (per-instance
  per-field merge). *§19.1, §19.4*
- Plural-aware messages via `Intl.PluralRules` for navigation and selection
  announcements.
- First-day-of-week resolved through `Intl.Locale.getWeekInfo()` with a
  Monday fallback when the runtime does not expose the API. *§19.2*
- Locale packs (one secondary entry point per locale, opt-in):
  `de`, `fr`, `es`, `pt`, `ja` re-exported from `ngx-tw/calendar`.
- Adapter `setLocale(locale)` is now driven by an effect that mirrors the
  resolved per-instance locale, so month / weekday names and `format()` track
  the input. *§19.1*

#### Calendar — Phase 18 (testing — baseline) — *§35*

- Vitest specs co-located with source: `calendar.spec.ts`, `calendar-cell.spec.ts`,
  `native-date-adapter.spec.ts`, `serialize-calendar-value.spec.ts`. The full
  `Phase 18` harness expansion (a11y, mode flips, range flow, mobile) is still
  ahead.

#### Calendar — Phase 19 (Luxon adapter entry point) — *§20.2, §4.2*

- New secondary entry point `ngx-tw/calendar/luxon` exporting `LuxonDateAdapter`,
  `provideLuxonDateAdapter()`, and `TwLuxonDateFormat`. Implements the full
  §20.2 surface plus the TZ-aware virtuals (`getTimezone`, `withTimezone`,
  `isDST`, `resolveAmbiguous`).

### Changed (BREAKING — pre-1.0, no semver promise yet)

#### Calendar

- Component generic signature is now `CalendarComponent<M, D, TOut>` with
  `M extends CalendarMode`. The value model narrows by mode. *§7.3*
- View token rename: `CalendarViewState` is `'day' | 'month' | 'year'`. The
  `'multi-year'` token is retired — the same grid is now `'year'` (years page)
  while the in-year month grid is `'month'`. *§7.4*
- Adapter method renames (Phase 2):
  - `addCalendarYears` → `addYears`
  - `addCalendarMonths` → `addMonths`
  - `addCalendarDays` → `addDays`
  - `compareDate` → `compare`
  - `createDate(year, zeroBasedMonth, day)` → `create(year, oneBasedMonth, day)`
  - `toIso8601` → `toIso`
- `viewChange` payload shape: `{ from, to, reason }` (was the
  pre-refactor `viewChanged: CalendarView` event that emitted only the new
  view name). *§22.6*
- `CalendarHarness.getCurrentView()` and `CalendarHarness.switchView()` accept
  `'day' | 'month' | 'year'` (mirrored as `CalendarHarnessView`).

#### Table — v2 input reshape (PR8)

The table's wide, flat input surface has been grouped into four config-object
inputs on `<tw-table>` and one on `<tw-column>`. Each config accepts a
partial object; unset keys fall back to the documented defaults. Data, state,
the row-mechanics flag, i18n and a11y attributes remain flat.

**`<tw-table>` migration:**

| v1 input | v2 location |
|---|---|
| `[variant]` | `[appearance]="{ variant }"` |
| `[density]` | `[appearance]="{ density }"` |
| `[size]` | `[appearance]="{ size }"` |
| `[layout]` | `[appearance]="{ layout }"` |
| `[rowAnimations]` | `[appearance]="{ rowAnimations }"` |
| `[stickyHeader]` | `[sticky]="{ header }"` |
| `[stickyFooter]` | `[sticky]="{ footer }"` |
| `[scrollHeight]` | `[sticky]="{ scrollHeight }"` |
| `[responsive]` (mode union) | `[responsive]="{ mode }"` |
| `[stackBelow]` | `[responsive]="{ stackBelow }"` |
| `[selectable]` | `[selection]="{ enabled }"` |

`data`, `trackBy`, `loading`, `error`, `multiTemplateRows`, `labels`,
`aria-label`, `aria-labelledby`, and the `expandedRows` / `selected` models
keep their v1 shape.

**`<tw-column>` migration:**

| v1 input | v2 location |
|---|---|
| `[sticky]` | `[display]="{ sticky }"` |
| `[align]` | `[display]="{ align }"` |
| `[numeric]` | `[display]="{ numeric }"` |
| `[hideBelow]` | `[display]="{ hideBelow }"` |
| `width` (attr/binding) | `[display]="{ width }"` |

`name`, `hidden`, `priority`, `headerLabel`, and `stackLabel` keep their v1
shape.

**Outputs:**

- `(rowClick)` → `(rowClicked)` — past-tense action convention.
  `selectionChange` and `expansionChange` are unchanged (state-change pattern).

**Types:**

- `TwTableResponsive` (the `'scroll' | 'stack' | 'hide'` mode union) is
  renamed to `TwTableResponsiveMode`. The new `TwTableResponsive` interface is
  the responsive config object.
- New: `TwTableAppearance`, `TwTableSticky`, `TwTableResponsive` (config),
  `TwTableSelection`, `TwColumnDisplay`.

### Removed (BREAKING)

#### Calendar — input / output / mode surface

- `selectionMode` input — use `mode`. *§5*
- `'multi'` mode value — use `'multiple'`. *§5*
- `'week'` mode value — `mode` no longer accepts `'week'`; week-as-unit
  selection remains available through the DI-only `WeekSelectionStrategy`.
  *§5*
- `selected` model alias — use the single canonical `value` model. *§7.3*
- `userSelection` output — use `selectionComplete` (and `selectionStart` for
  the first click of a range). *§33.2*
- Time-of-day inputs out of v1 scope: `withTime`, `timeFormat`, `showSeconds`,
  `hourStep`, `minuteStep`, `secondStep`, `minTime`, `maxTime`. (The companion
  `time-picker` component remains available.)
- Visual back-compat inputs: `color`, `size`, `headerless`. The calendar uses
  semantic tokens and is borderless via `bordered="false"`.
- `startAt` alias is reduced to a one-time anchor; runtime navigation is
  observed through `activeDate` / `activeDateChange`.
- `numberOfMonths` legacy alias — Phase 9 reintroduces this as the canonical
  multi-month input. The interim Phase 1 input is `monthColumns: 1 | 2`.

#### Calendar — adapter surface (Phase 2)

- Adapter method names `addCalendarYears`, `addCalendarMonths`,
  `addCalendarDays`, `compareDate`, `createDate`, `toIso8601` are removed in
  favour of the spec-shape names above. Custom `DateAdapter` subclasses must
  rename their overrides.

### Fixed

- SSR: `NativeDateAdapter` no longer reads `navigator.language` at
  construction. The adapter accepts a locale via `setLocale()` and the
  component pushes `LOCALE_ID` into it through an effect.
- SSR: month / weekday names and `today()` resolve via the `TZ_OVERRIDE`
  token chain so server-rendered calendars do not lock to the server's
  process timezone.
- DST: `NativeDateAdapter.startOfDay()` rebuilds the date at
  `00:00:00.000` to avoid skipping into 01:00 during the spring-forward
  transition.

### Notes

- `CalendarCell<D>` template context is unchanged on the public surface for
  this window; Phase 13 will rename it to `DayCellContext<D, T>`.
- The `data-state-*` styling contract referenced by §34.5 is reserved for
  Phase 4 — current variants still render through `tv()` slots.
- Deprecated type re-exports kept available for one cycle so workspace
  callers (date-picker, date-range-picker) keep building: `CalendarView`,
  `TwCalendarView` (both alias `CalendarViewState`), `TwDateFilter` (aliases
  `DateFilterFn<D>`), `TwCalendarCellClassFn` (aliases `DateClassFn<D>`).
  Phase 10 removes them.

### Requirements

- Angular `^22.0.0` with `@angular/cdk ^22.0.0`
- Tailwind CSS `^4.0.0`
- `tailwind-variants ^0.3.0`
- For `ngx-tw/calendar/luxon`: `luxon ^3.0.0` (peer)


## 0.2.1 — 2026-05-28

### Features

- **release:** tag-driven release flow with `npm run release:*` ([85e6924](https://github.com/avs2001/ngx-tw/commit/85e692473ebe3dbd5ef8ff1c5842c491e66efff5))

### Bug Fixes

- **a11y:** clear dark-mode solid contrast + breadcrumbs duplicate landmarks ([09ab024](https://github.com/avs2001/ngx-tw/commit/09ab0241ee935a59cf8ffc8a79126dfb62a8f4d3))
- **a11y:** WCAG-AA color-contrast + drop duplicate code-block landmarks ([4fe265f](https://github.com/avs2001/ngx-tw/commit/4fe265f4a914f3a3add4c01baf1527ce6c3f5e54))
- **ci, e2e:** unstick the e2e workflow ([94fa08e](https://github.com/avs2001/ngx-tw/commit/94fa08e62b6b3ebe201631bfc2f80098822b0e45))
- **ci:** unit tests need the built lib before running ([5c10bee](https://github.com/avs2001/ngx-tw/commit/5c10bee66769a5b3be9edace353572e11fd85052))
- **ci:** unblock release tag push, scope unit tests to ngx-tw ([c2f5d0f](https://github.com/avs2001/ngx-tw/commit/c2f5d0f2a62696615dfd46f475de227655022295))

[Unreleased]: https://github.com/avs2001/ngx-tw/commits/develop
