# Calendar Component — Requirements Specification v2.5

> Angular 21 library component supporting single, multiple, and range date selection with full forms integration (Reactive, Template-driven, Signal Forms), multi-month display, and rich cell customization.

**Changes in v2.1** — Internal State Model (§8), Overlay Lifecycle (§13), Focus Management Contract (§17), Error Display Strategy (§28), Event Ordering (§30). Enhanced interaction-time validation (§10), preset revalidation (§25.6), dynamic-data performance (§32.5), stress testing (§35.7), serialization (§7.5), drag-selection explicit WONT (§42.3).

**Changes in v2.2** — Form Reset Behavior (§6.5), Automatic Value Transformation (§7.6), State Persistence Across Re-mount (§8.6), Navigation Dead-End Prevention (§12.6). API additions: `valueTransformer`, `stateId`, `emptyStateTemplate`, `resetBehavior`. Cross-reference to §42.3 added in §23 for drag-selection decision visibility.

**Changes in v2.3** — Internal consistency fixes. Corrected `EventEmitter` → `OutputEmitterRef` throughout §33. Unified `selectedPresetId` as a public signal (§33.3). Clarified partial-range semantics in §7.1 to match state model. Resolved `selectionRestart` scope ambiguity. Clarified `nearest-edge` semantics (§21.3). Fixed `§17.2` row reference in §35.7. Aligned template lists between §33.1 and §34.4. Added missing `virtualKeyboard` input to §33.1. Fixed typo `navigationBoundaryLookhead` → `navigationBoundaryLookahead` throughout. Reconciled `disabledDates` type. Made exported state types (`CalendarSelectionState`, `CalendarViewState`, `CalendarOverlayState`) the canonical signal types. Documented input defaults in a type + default table. Added `TZ_OVERRIDE` and `DATE_SERIALIZATION` to exported tokens. Removed stale "3 events" a11y example. Added missing state-transition rows, preset event emissions, and `selectedPresetId` lifecycle to §8.3. Clarified form-reset detection mechanism (§6.5).

**Changes in v2.4** — Resolved seven open decisions (see `docs/calendar-plan_decisions.md` for full rationale):
1. **Angular 21-only floor** — no 17–20 backport shim. §3 tightened from `[DEC]` to `[REQ] [MUST]`.
2. **`@angular/cdk` is a required peer dependency** — §3 tightened from `[DEC]` to `[REQ] [MUST]`.
3. **`persistentStateId` deferred to v1.1+** — §8.6 bullet re-classified as `[WONT] v1`; in-memory `stateId` retained. §42.2 entry added.
4. **Mobile full-screen ships in v1** — §18.5 tightened to `[REQ] [SHOULD]` with `mobileMode: 'auto'` default.
5. **Non-Gregorian adapters deferred to v2+** — §19.5 tightened to `[WONT] v1`.
6. **Native + Luxon adapters in v1; date-fns + Temporal in v1.1** — §20.4 tightened to per-adapter `[REQ]` / `[SHOULD]` posture.
7. **Event / schedule Layer 3 deferred to v2 sibling** — §24.3 tag cleaned up from `[DEC] [WONT]` to `[WONT]`.

§33.1, §42, and §43 updated to match. The `[DEC]` classification is no longer used anywhere in the spec.

**Changes in v2.5** — Parallel-audit reconciliation pass. Closed open decisions #1 (masking default off), #3 (schematics in v1.1), #8 (`autoSkipEmptyPeriods` default `false`), and #9 (`navigationBoundaryLookahead` default 24). Promoted `mobileMode: 'auto'` from `[SHOULD]` to `[MUST]` (§18.5, §14.3). Added `[REQ] [MUST]` convention clarification. Extended §8.3 state transition table (EMPTY/COMPLETE outside-click, writeValue during SELECTING, Escape, disabled-cell click, preset-lifecycle emissions). Rewrote §8.4 emit path to match §30.2 canonical ordering. Added §8.4 simultaneous-trigger precedence rule. Extended §13.5 close-reason table (scroll, focus loss, form reset, adapter change, constraint tightening, mobile back-button, trigger unmount). Clarified §13.4 step order (commit → `valueChange` → `closed` → focus return → `onTouched`). Added `clear()`, `Escape`, and programmatic `writeValue` transitions to §21.1. Added missing ARIA in §15.3 (`aria-current="date"`, nav button labels, roving-tabindex declaration, grid row/colcount). Extended §16.2/§16.3 keyboard tables (Home/End, PageUp/PageDown, Shift variants, Space, Esc, Tab, Ctrl+Home). Added `startOfWeek`/`endOfWeek` and month-number / day-of-week conventions to §20.2. Extended `CalendarIntl` field list (§19.4). Rewrote §34.1 and §34.6 to reference Tailwind v4 semantic tokens instead of framework-agnostic CSS custom properties. Added §33.1 status annotations for `valueTransformer` / `blockInvalidRangeCommit` / `autoSkipEmptyPeriods` / `navigationBoundaryLookahead`. Added `selectionLimitReached`, `presetChange`, and `selectionCleared` payload shape to §33.2. Dropped `overlayStateChange` output in favor of the `overlayState` signal. Added `revalidate()` and `focusDate()` public methods. Added §38.1 SemVer coverage for adapter / event-payload / CSS-token changes. Removed residual `events` input references. See `docs/requirements/calendar-audit-findings.md` for the full parallel-audit change list.

---

## Document Conventions

Each requirement is tagged with:

**Classification**
- `[REQ]` — Binding requirement. Scheduled to ship.
- `[REC]` — Recommendation. Default approach; deviation requires justification.
- `[WONT]` — Explicitly deferred (may be paired with a version, e.g., `[WONT] v1`).

**Priority** (MoSCoW)
- `MUST` — v1 cannot ship without it.
- `SHOULD` — v1 strongly targets it; may slip to v1.1 without breaking consumers.
- `COULD` — nice to have; v2 candidate.
- `WONT` — explicitly deferred.

**Combining the two axes.** The classification declares ship-intent; the priority declares bindingness.
- `[REQ] [MUST]` — binding, v1-critical. Cannot ship v1 without it.
- `[REQ] [SHOULD]` — scheduled for v1, non-blocking if we slip to v1.1.
- `[REC] [MUST]` — implementation has latitude, but a valid default is mandatory.
- `[REC] [SHOULD]` — reference behavior; deviation allowed with justification.
- `[REC] [COULD]` — opt-in enhancement.
- `[WONT] v1` / `[WONT] v1.1` / `[WONT]` (permanent) — out of scope for the named release (or forever).

The `[DEC]` classification is retired; all open items must land in §43 as explicit Remaining Decisions, not inline.

---

## Table of Contents

1. [Target Use Cases & Personas](#1-target-use-cases--personas)
2. [Scope Statement](#2-scope-statement)
3. [Compatibility & Environment](#3-compatibility--environment)
4. [Timezone & Temporal Model](#4-timezone--temporal-model)
5. [Selection Modes](#5-selection-modes)
6. [Form Integration](#6-form-integration)
7. [Value Contract & Type System](#7-value-contract--type-system)
8. [Internal State Model](#8-internal-state-model)
9. [Text Input Integration](#9-text-input-integration)
10. [Date Constraints & Validation](#10-date-constraints--validation)
11. [Runtime State Conflicts](#11-runtime-state-conflicts)
12. [Display & Navigation](#12-display--navigation)
13. [Overlay Lifecycle](#13-overlay-lifecycle)
14. [Interaction Modes](#14-interaction-modes)
15. [Accessibility](#15-accessibility)
16. [Keyboard Interaction](#16-keyboard-interaction)
17. [Focus Management Contract](#17-focus-management-contract)
18. [Mobile & Touch Interaction](#18-mobile--touch-interaction)
19. [Internationalization & Localization](#19-internationalization--localization)
20. [Date Adapter Architecture](#20-date-adapter-architecture)
21. [Range Selection Flow](#21-range-selection-flow)
22. [View Switching Flow](#22-view-switching-flow)
23. [Multi-Month Display](#23-multi-month-display)
24. [Day Cell Customization](#24-day-cell-customization)
25. [Presets](#25-presets)
26. [Cross-Field & Composite Form Patterns](#26-cross-field--composite-form-patterns)
27. [Security](#27-security)
28. [Error Display Strategy](#28-error-display-strategy)
29. [Error Handling & Safety Nets](#29-error-handling--safety-nets)
30. [Event Ordering](#30-event-ordering)
31. [SSR & Hydration](#31-ssr--hydration)
32. [Performance](#32-performance)
33. [Component API Contract](#33-component-api-contract)
34. [Theming & Customization](#34-theming--customization)
35. [Testing Requirements (Library)](#35-testing-requirements-library)
36. [Testing Harness (for Consumers)](#36-testing-harness-for-consumers)
37. [Developer Experience](#37-developer-experience)
38. [Versioning & Migration](#38-versioning--migration)
39. [Documentation](#39-documentation)
40. [Non-Functional Requirements](#40-non-functional-requirements)
41. [Acceptance Criteria (Flow-Level)](#41-acceptance-criteria-flow-level)
42. [Out of Scope](#42-out-of-scope)
43. [Remaining Decisions](#43-remaining-decisions)

---

## 1. Target Use Cases & Personas

### 1.1 Primary use cases
- **Booking flows**: hotel check-in/out, flight departure/return, restaurant reservations. Range selection, overlay or inline, multi-month display, mobile-critical.
- **Enterprise forms**: HR leave requests, report date ranges, scheduling. Text input critical, validation-heavy, i18n-diverse.
- **Analytics & dashboards**: date range filters. Presets critical, inline, fast re-render on data change.

### 1.2 Primary personas
- **Booking app developer**: wants a drop-in range picker with polished hover preview, two-month display, and presets.
- **Enterprise form builder**: needs strong Reactive/Signal Forms integration, typed validators, text input + calendar, locale support.
- **Dashboard developer**: needs inline calendar, fast preset switching, and range visualization.

### 1.3 Non-target use cases (v1)
- Interactive schedule/event calendar (Google Calendar style).
- Time-of-day selection.
- Birthdate picker with far-past navigation (> 20 years) — supported but not optimized.
- Multi-range selection (multiple disjoint ranges).

---

## 2. Scope Statement

**`[REQ]` `[MUST]` The component is a range-capable date picker, not a calendar surface.**

Selection is the primary responsibility. Customization of day cells (badges, data, templates) is supported as a layered feature, but event-driven schedule semantics (drag, resize, create-by-drag, multi-day event bars) are explicitly deferred to a sibling component in v2.

---

## 3. Compatibility & Environment

- `[REQ]` `[MUST]` Angular 21+ as the primary and **only** supported major version for v1. No backport shim to 17–20 — the spec is built directly on 21 primitives (`FormValueControl<T>` from `@angular/forms/signals` per §6.3, signal-based public API per §33, `OutputEmitterRef` per §33.5, zoneless CD). Consumers on earlier majors must pin to a future v0.x line if community demand materializes; that is not v1 scope.
- `[REQ]` `[MUST]` Standalone component only; no NgModule.
- `[REQ]` `[MUST]` Zoneless change detection compatible.
- `[REQ]` `[MUST]` SSR/hydration safe; no direct `window`/`document` access outside lifecycle guards.
- `[REQ]` `[MUST]` Tree-shakable; no side-effectful module imports.
- `[REQ]` `[MUST]` TypeScript strict mode + `exactOptionalPropertyTypes`.
- `[REQ]` `[MUST]` Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk`. CDK is the substrate for overlay positioning (§13, §14.2), focus trap + a11y (§15, §17), live announcements (§15.5), and virtual scroll (§23.4, §32.3) — the §32.1 bundle budgets assume CDK is present.
- `[REC]` Optional peer for TZ-aware adapter consumers: `luxon ^3` (required only when importing `ngx-tw/calendar/luxon`; §20.4).
- `[REQ]` `[MUST]` Browser support: last 2 versions of evergreen browsers; Safari ≥ 16; no IE.

---

## 4. Timezone & Temporal Model

### 4.1 Wall-clock floating model (default)

- `[REQ]` `[MUST]` Component operates on **floating wall-clock dates** — no timezone attached.
- `[REQ]` `[MUST]` Component performs **no timezone conversion**. Delegated to the `DateAdapter`.
- `[REQ]` `[MUST]` "Today" is resolved via `adapter.today()`.
- `[REQ]` `[MUST]` `addDays(x, 1)` always moves one calendar day, DST-proof.

### 4.2 Timezone-aware adapters (opt-in)

- `[REC]` Luxon/Temporal-backed adapters may expose timezone-aware types.
- `[REQ]` `[MUST]` Adapter's `sameDate`, `addDays`, `today` produce wall-clock-consistent results within the adapter's configured timezone.

### 4.3 SSR timezone rule

- `[REQ]` `[MUST]` `adapter.today()` on server uses the configured server timezone (or `TZ_OVERRIDE` token).
- `[REQ]` `[MUST]` "Today" indicator hydration-tolerant across server/client timezone mismatch.
- `[REQ]` `[MUST]` **Hydration mechanism:** on hydration the component re-evaluates `adapter.today()` inside an `afterNextRender` callback. If the client-side "today" differs from the server snapshot, the "today" cell decoration is silently re-applied (CSS class + `aria-current="date"` swap) without emitting any public events and without triggering a full re-render. No hydration-mismatch warning is produced — the text content is stable because cells always render `D`-labels, never "today".
- `[REQ]` `[MUST]` `TZ_OVERRIDE` is honored **only** by TZ-aware adapters. Floating adapters log a dev-mode warning and ignore the token.

### 4.4 DST handling

- `[REQ]` `[MUST]` All calendar dates render, including 23h and 25h days.
- `[REQ]` `[MUST]` Range length = count of calendar days, not elapsed hours.
- `[REQ]` `[MUST]` `adapter.startOfDay(D)` may return a non-midnight wall-clock result on zones where local midnight is skipped (e.g., historical Americas/Havana). This is an adapter concern and must not throw; the component treats the returned value as the canonical start-of-day regardless of its wall-clock hour.

---

## 5. Selection Modes

### 5.1 Single
- `[REQ]` `[MUST]` Click replaces the current value.
- `[REQ]` `[MUST]` Click-selected deselects iff `allowDeselect`, else no-op.
- `[REC]` Default: `allowDeselect: boolean = false`.

### 5.2 Multiple
- `[REQ]` `[MUST]` Click adds; re-click removes.
- `[REQ]` `[SHOULD]` `maxSelections` cap; behavior at cap: `'ignore' | 'replace-oldest' | 'emit-limit-reached'`.
- `[REC]` Default: `'emit-limit-reached'`.
- `[REQ]` `[MUST]` When `maxSelectionBehavior: 'emit-limit-reached'`, the component emits `selectionLimitReached: { limit: number; attempted: D }` on the attempted-but-rejected click. The current value is unchanged. See §33.2.
- `[REQ]` `[MUST]` When `maxSelectionBehavior: 'replace-oldest'`, "oldest" is defined as **insertion order** (the earliest-added entry is replaced), regardless of chronological sort. Chronological sorting (via `sorted: true`) is applied as a post-mutation presentation step only.
- `[REC]` `sorted: true` returns chronological.

### 5.3 Range
- `[REQ]` `[MUST]` Full state machine in §21.
- `[REC]` Defaults: `allowBackwardRange: true`, `allowSingleDayRange: true`, `rangeClickBehavior: 'restart'`, `persistPartialRange: false`, `disableRangesCrossingDisabledDates: false`.

### 5.4 Cross-mode rules
- `[REQ]` `[MUST]` Changing `mode` at runtime clears value and emits `modeChange`.
- `[REQ]` `[MUST]` Mode is the single source of truth for value shape (§7).

---

## 6. Form Integration

### 6.1 Reactive Forms
- `[REQ]` `[MUST]` Implement `ControlValueAccessor`.
- `[REQ]` `[MUST]` Implement `Validator` via `NG_VALIDATORS`.
- `[REQ]` `[MUST]` Respect `setDisabledState`.
- `[REQ]` `[MUST]` Call `onTouched` per §13.6.
- `[REQ]` `[MUST]` Defensive `writeValue`: handle `null`, `undefined`, wrong shape, invalid dates without throwing.

### 6.2 Template-Driven Forms
- `[REQ]` `[MUST]` Works via the same `ControlValueAccessor`.
- `[REQ]` `[MUST]` Tested against `[(ngModel)]`, `ngModelChange`, `#ctrl="ngModel"`, `NgForm`.

### 6.3 Signal Forms
- `[REQ]` `[MUST]` Implement `FormValueControl<T>` from `@angular/forms/signals`.
- `[REQ]` `[MUST]` Optional signal inputs: `disabled`, `readonly`, `touched`, `errors`, `required`, `invalid`, `hidden`, `disabledReasons`.
- `[REQ]` `[MUST]` Compatible with `[field]="form.someDate"`.
- `[REQ]` `[MUST]` Typing resolution per §7.3.

### 6.4 Unified behavior
- `[REQ]` `[MUST]` `disabled` blocks interaction and reflects in ARIA.
- `[REQ]` `[MUST]` `touched` emits per §13.6.
- `[REQ]` `[MUST]` `dirty` emits on first user-initiated change; **not** on programmatic `writeValue`.
- `[REQ]` `[MUST]` `required` validation is mode-aware:
  - single: value non-null.
  - multiple: array non-empty.
  - range: both `start` and `end` non-null.

### 6.5 Form reset behavior

When a parent form resets, the component must not leave stale UI state (e.g., the user had navigated to December 2028 and the form resets — the display should not stay in December 2028).

- `[REQ]` `[MUST]` `FormControl.reset()` / `FormGroup.reset()` triggers full UI state reset:
  - `externalValue` resets to the reset value (form-owned).
  - `viewState` → `startView`.
  - Displayed month/year → `startAt` if set, else `adapter.today()`.
  - `activeDate` → result of applying the §13.3 priority chain to the newly-displayed month (same algorithm as overlay open; keeps behavior consistent with §17.5 `clear()` which also uses this priority).
  - Overlay closes if open; `closed` event fires per §13.7 invariants.
  - `internalDraftValue` cleared.
  - `hoveredDate` cleared.
  - `selectedPresetId` cleared.
- `[REQ]` `[MUST]` Reset detection: the component injects `NgControl` (Reactive / Template-driven) or reads the `FormValueControl`'s `touched`/`dirty` signals (Signal Forms) and subscribes to the control's `statusChanges` / pristine signal. A `writeValue(x)` accompanied by a pristine-transition-to-true is a reset. This is implementable within the CVA contract by holding a reference to `NgControl` via constructor injection with `@Self() @Optional()`.
- `[REQ]` `[MUST]` Reset emits `selectionCleared` if a value was previously selected. Does **not** emit `valueChange` (form-originated change; form handles its own emission per §30.2).
- `[REQ]` `[MUST]` `onTouched` is **not** called on reset (consistent with §13.6 — resets are programmatic, not user actions).
- `[REQ]` `[MUST]` `resetBehavior: 'full' | 'value-only'` input. `'full'` (default) resets UI as above. `'value-only'` preserves view/focus state and clears only the value (`externalValue`, `internalDraftValue`, `selectedPresetId`, `hoveredDate`).

---

## 7. Value Contract & Type System

### 7.1 Per-mode value shapes

```typescript
type CalendarSingleValue<D>   = D | null;
type CalendarMultipleValue<D> = D[];
type CalendarRangeValue<D>    = { start: D | null; end: D | null };

type CalendarValue<M extends CalendarMode, D> =
  M extends 'single'   ? CalendarSingleValue<D> :
  M extends 'multiple' ? CalendarMultipleValue<D> :
  M extends 'range'    ? CalendarRangeValue<D> :
  never;

type CalendarMode = 'single' | 'multiple' | 'range';
```

- `[REQ]` `[MUST]` Empty states: `null`, `[]`, `{ start: null, end: null }`.
- `[REQ]` `[MUST]` Shape never changes within a mode.
- `[REQ]` `[MUST]` During SELECTING (range mode), the partial start is held in `internalDraftValue` and **does not propagate to `externalValue`**. The form control retains its last committed value; the partial selection is observable only via `selectionStart` / `rangePreview` events. If the form's `required` validator is active, a range that is still COMPLETE-pending (i.e., user has clicked once but not twice) neither satisfies nor re-invalidates `required` — the form's `required` state reflects `externalValue` only (§8.1, §8.2).
- `[REQ]` `[MUST]` A committed range with one field null (e.g., programmatic `writeValue({ start: D, end: null })`) fails `required` validation per §6.4.
- `[REQ]` `[MUST]` Value equality uses `adapter.sameDate`, never reference equality.

### 7.2 Programmatic value violating constraints

- `[REQ]` `[MUST]` Never silently clamp or drop.
- `[REQ]` `[MUST]` Mark control invalid with specific error codes (§10); preserve value.
- `[REQ]` `[MUST]` Dev-mode warning.

### 7.3 Signal Forms typing resolution

- `[REQ]` `[MUST]` Generic: `CalendarComponent<M extends CalendarMode = 'single', D = Date, TOut = CalendarValue<M, D>>`.
- `[REQ]` `[MUST]` Value model: `model<CalendarValue<M, D>>()` — the internal model always carries the `D`-shaped value. `TOut` is the externally-observable form control value type, which may differ from `CalendarValue<M, D>` when a `valueTransformer` is supplied (§7.6).
- `[REQ]` `[MUST]` Mode-specific directives for strict binding (second generic `TOut` defaults to the untransformed shape):
  - `CalendarSingleDirective<D, TOut = D | null>` binds `Field<TOut>`.
  - `CalendarMultipleDirective<D, TOut = D[]>` binds `Field<TOut>`.
  - `CalendarRangeDirective<D, TOut = { start: D | null; end: D | null }>` binds `Field<TOut>`.
- `[REQ]` `[MUST]` `FormValueControl<T>` shape:  `T = TOut`. When no transformer is present, `TOut = CalendarValue<M, D>`; when a transformer is supplied, `TOut` is the transformer's external type.
- `[REQ]` `[MUST]` Directives forward to the underlying component.
- `[REQ]` `[MUST]` `DateFormats` can coerce adapter types to ISO 8601 strings for string-typed schemas.
- `[REQ]` `[MUST]` Troubleshooting doc page for the `FieldTree<Date, string>` error.

### 7.4 Exported types & tokens

**Types:**
```
CalendarMode
CalendarValue, CalendarSingleValue, CalendarMultipleValue, CalendarRangeValue
CalendarValidationErrors, CalendarErrorCode
CalendarSelectionState, CalendarViewState, CalendarOverlayState
DateFilterFn, DateAdapter, DateFormats
CalendarIntl, CalendarIntlKeys
DayCellContext<D, T = unknown>, BadgeConfig
RangeClickBehavior, RangeGranularity, MaxSelectionBehavior
ResetBehavior, MobileMode
CalendarPreset<D>, PresetGroup<D>
CalendarValueTransformer<M, D, TOut>
```

Canonical exported literal unions used by the readonly state signals (§33.3):

```typescript
type CalendarSelectionState = 'EMPTY' | 'SELECTING' | 'COMPLETE';
type CalendarViewState      = 'day' | 'month' | 'year';
type CalendarOverlayState   = 'closed' | 'opening' | 'open' | 'closing';
```

> **Type prefix convention.** Component-local types (`CalendarPreset`, `DayCellContext`, `BadgeConfig`, etc.) are exported from the `ngx-tw/calendar` entry point and do NOT carry the `Tw`-prefix — package scope provides namespacing per the ngx-tw conventions. Only truly shared cross-component types (`TwColor`, `TwSize`) use the `Tw` prefix; those live in `ngx-tw/core`.

**Injection tokens:**
```
TZ_OVERRIDE           // optional IANA timezone string; overrides adapter.today() timezone
DATE_SERIALIZATION    // CalendarValueTransformer; global default for valueTransformer
```

### 7.5 Serialization contract

- `[REQ]` `[MUST]` The component does **not** serialize values. `externalValue` carries adapter-typed `D` instances.
- `[REC]` Consumers serializing to JSON convert `D` to ISO 8601 strings at the form-submit boundary. A helper is provided (see §20 for the full `DateAdapter` surface):
  ```typescript
  serializeCalendarValue<M, D>(value: CalendarValue<M, D>, adapter: DateAdapter<D>):
    M extends 'single'   ? string | null :
    M extends 'multiple' ? string[] :
    M extends 'range'    ? { start: string | null; end: string | null } : never
  ```
- `[REQ]` `[MUST]` ISO 8601 format: `YYYY-MM-DD`. **No time component on any adapter** — time-aware adapters strip time after the `adapter.startOfDay` normalization (below). This keeps the serialization output uniform across all shipped adapters.
- `[REQ]` `[MUST]` Time-aware adapters: component normalizes to **start-of-day** in the adapter's declared timezone (per adapter instance configuration; see §20.1) before use, via `adapter.startOfDay(D)` (adapter responsibility).
- `[REQ]` `[MUST]` Non-Date adapters (Luxon, Temporal): consumer controls serialization; component does not round-trip through strings. The `toIso`/`fromIso` adapter methods (§20.2) are available for consumers who want to opt-in to string round-trips.
- `[REQ]` `[MUST]` Range value equality for `null` endpoints: the component uses structural equality (`{start: sameDate, end: sameDate}` with `null` treated as equal to `null`). `writeValue(null)` in range mode normalizes to `{ start: null, end: null }`.
- `[REQ]` `[MUST]` `serializeCalendarValue` is exported from `ngx-tw/calendar` and listed on the public API surface (§33.4).

### 7.6 Automatic value transformation

§7.5 defines a manual `serializeCalendarValue` helper. Real apps frequently want automatic bidirectional transformation at the form boundary so the `FormControl` value type matches the backend contract directly.

- `[REQ]` `[SHOULD]` `valueTransformer: CalendarValueTransformer<M, D, TOut>` input applies automatic conversion at the form boundary.
- `[REQ]` `[MUST]` Transformer interface:
  ```typescript
  interface CalendarValueTransformer<M extends CalendarMode, D, TOut> {
    toForm(value: CalendarValue<M, D>): TOut;
    fromForm(value: TOut): CalendarValue<M, D>;
  }
  ```
- `[REQ]` `[MUST]` Applied bidirectionally:
  - `toForm` runs before `valueChange` emits to the form control.
  - `fromForm` runs on every `writeValue` from the form control.
- `[REQ]` `[MUST]` Without a transformer, values round-trip as adapter-typed `D` instances (current behavior).
- `[REQ]` `[MUST]` Ship built-in transformers:
  - `isoStringTransformer` — D ↔ ISO 8601 string (`YYYY-MM-DD`). For single/multiple/range modes; range becomes `{ start: string | null; end: string | null }`.
  - `timestampTransformer` — D ↔ Unix timestamp (milliseconds, number).
- `[REC]` Global default via `DATE_SERIALIZATION` injection token. Component-level `valueTransformer` input overrides the global default.
- `[REQ]` `[MUST]` Transformer errors fail safely:
  - `toForm` throws → emit raw `D` as fallback; log dev warning.
  - `fromForm` throws → mark control `calendarInvalidValue`, set `externalValue` to the empty-state for the current mode (`null` / `[]` / `{ start: null, end: null }`), expose the raw incoming `TOut` on the `lastInvalidFormValue` readonly signal (§33.3) so consumers can correct, and log dev warning.
- `[REQ]` `[MUST]` Transformer applied **after** validation — validation operates on `D`, not on the transformed form type. Error codes (§10.2) still reference `D`-shaped payloads.
- `[REQ]` `[MUST]` Signal Forms integration: typed transformers change the inferred `Field<T>` type. The three mode-specific directives (§7.3) accept a transformer generic parameter.
- `[REQ]` `[MUST]` **Public `valueChange` output is NOT transformed.** The public `valueChange: OutputEmitterRef<CalendarValue<M, D>>` always emits the `D`-shaped value for API stability. The transformer intermediates only between the CVA `onChange` callback (which receives `TOut`) and the form control. Consumers observing the form control itself see `TOut`; consumers observing the component output see `CalendarValue<M, D>`.
- `[REQ]` `[MUST]` `valueTransformer` type surface: `CalendarValueTransformer<M, D, TOut>` — fully parameterized when exported (§7.4). `timestampTransformer`'s range shape is `{ start: number | null; end: number | null }` (mirroring `isoStringTransformer`).
- `[REC]` Documentation shows three common recipes: ISO string, Unix timestamp, and a custom `{ year, month, day }` object shape.

---

## 8. Internal State Model

The component maintains three orthogonal pieces of state with strict ownership rules. All observable behavior derives from this model.

### 8.1 State dimensions

**`externalValue`** — the value visible to forms and consumer code.
- Type: `CalendarValue<M, D>` (§7.1).
- Source of truth: the bound `FormControl` / `model()` / `[(ngModel)]`.
- Mutated only through: user commit, programmatic `writeValue`, preset selection, `clear()`.

**`internalDraftValue`** — in-flight state during multi-click selection.
- Mode-dependent:
  - `single`/`multiple`: unused (commits are atomic).
  - `range`: `{ start: D } | null` while SELECTING.
- Source of truth: component-private signal.
- **Never** leaks to `externalValue` until commit.
- Cleared on: commit, discard (overlay close + `!persistPartialRange`), mode change, `reset()`.

**`uiState`** — ephemeral presentation state.
- `selectionState: 'EMPTY' | 'SELECTING' | 'COMPLETE'`
- `viewState: 'day' | 'month' | 'year'`
- `activeDate: D` — the focused cell
- `hoveredDate: D | null` — pointer-hover cell (desktop only)
- `overlayState: 'closed' | 'opening' | 'open' | 'closing'`
- Source of truth: component-private signals.

### 8.2 Ownership rules

- `[REQ]` `[MUST]` **The form owns `externalValue` exclusively.** The component reads it; it never mutates its own model signal from user input except via the sanctioned emit path (§8.4).
- `[REQ]` `[MUST]` **The component owns `internalDraftValue` and `uiState` exclusively.** Consumers cannot read or write these directly; they observe consequences through events and `data-state-*` attributes.
- `[REQ]` `[MUST]` When `externalValue` changes programmatically during an in-flight interaction, `internalDraftValue` is discarded per §11.1.

### 8.3 State transition table

| `selectionState` | Trigger | Next state | `externalValue` | `internalDraftValue` | Events (ordered) |
|---|---|---|---|---|---|
| EMPTY | click A (range) | SELECTING | unchanged | `{ start: A }` | `activeDateChange`, `selectionStart` |
| EMPTY | click A (single) | COMPLETE | `A` | — | `activeDateChange`, `valueChange`, `selectionComplete` |
| EMPTY | click A (multi) | COMPLETE | `[A]` | — | `activeDateChange`, `valueChange`, `selectionComplete` |
| EMPTY | preset selected | COMPLETE | preset value | — | `monthChange` (if nav needed), `activeDateChange`, `valueChange`, `selectionComplete` |
| SELECTING | click B ≥ A | COMPLETE | `{ start: A, end: B }` | cleared | `activeDateChange`, `valueChange`, `selectionComplete` |
| SELECTING | click B < A, backward allowed | COMPLETE | `{ start: B, end: A }` | cleared | `activeDateChange`, `valueChange`, `selectionComplete` |
| SELECTING | click B < A, backward disallowed | SELECTING | unchanged | `{ start: B }` | `activeDateChange`, `selectionRestart` |
| SELECTING | hover C | SELECTING | unchanged | unchanged | `rangePreview` |
| SELECTING | outside click, `persistPartialRange=false` | EMPTY | unchanged | cleared | `selectionCleared`, `closed` |
| SELECTING | outside click, `persistPartialRange=true` | SELECTING | unchanged | unchanged | `closed` (overlay closes; draft retained for next open) |
| SELECTING | Escape (any `persistPartialRange`) | EMPTY | unchanged | cleared | `selectionCleared`, `closed` |
| SELECTING | programmatic `writeValue(null)` | EMPTY | null | cleared | `selectionCleared` |
| SELECTING | programmatic `writeValue(complete)` | COMPLETE | as written | cleared | `selectionCleared`, then form-originated `valueChange` |
| SELECTING | preset selected | COMPLETE | preset value | cleared | `selectionCleared`, `monthChange` (if nav needed), `activeDateChange`, `valueChange`, `selectionComplete` |
| COMPLETE | click C, `rangeClickBehavior='restart'` | SELECTING | unchanged | `{ start: C }` | `activeDateChange`, `selectionRestart` |
| COMPLETE | click C, `rangeClickBehavior='nearest-edge'` | COMPLETE | new range per §21.3 | — | `activeDateChange`, `valueChange`, `selectionComplete` |
| COMPLETE | click C, `rangeClickBehavior='require-clear'` | COMPLETE | unchanged | — | — (visual flash only) |
| COMPLETE | preset selected | COMPLETE | preset value | — | `monthChange` (if nav needed), `activeDateChange`, `valueChange`, `selectionComplete` |
| COMPLETE | `clear()` | EMPTY | empty value | — | `selectionCleared` ({reason: 'user'}), `valueChange`, `presetChange(null)` if was set |
| COMPLETE | programmatic `writeValue(end<start)`, backward disallowed | COMPLETE | as written | — | form-originated `valueChange`, control marked `calendarInvalidRange` |
| COMPLETE | click C, `rangeClickBehavior='restart'` (preset was active) | SELECTING | unchanged | `{ start: C }` | `presetChange(null)`, `activeDateChange`, `selectionRestart` |
| EMPTY | click on disabled cell (any mode) | EMPTY | unchanged | unchanged | — (no-op; visual invalid-flash only) |
| SELECTING | click on disabled cell | SELECTING | unchanged | unchanged | — (no-op; visual invalid-flash only) |
| SELECTING | hover C across disabled cell, `disableRangesCrossingDisabledDates=true` | SELECTING | unchanged | unchanged | `rangePreview` with `invalidPreview: true` payload flag |
| SELECTING | click same cell as `draft.start`, `allowSingleDayRange=true` | COMPLETE | `{ start: A, end: A }` | cleared | `activeDateChange`, `valueChange`, `selectionComplete` |
| SELECTING | click same cell as `draft.start`, `allowSingleDayRange=false` | SELECTING | unchanged | unchanged | — (no-op; visual invalid-flash only) |
| EMPTY | outside click / Escape | EMPTY | unchanged | — | `closed` (if overlay was open) |
| COMPLETE | outside click / Escape | COMPLETE | unchanged | — | `closed` (if overlay was open) |
| any | `mode` changed | EMPTY | empty for new mode | cleared | `selectionCleared` ({reason: 'mode-change'}), `presetChange(null)` if was set, `modeChange`, `valueChange` |
| any | `disabled=true` | EMPTY if was SELECTING; otherwise prior state retained; overlay forced closed | cleared if SELECTING | `selectionCleared` ({reason: 'disabled'}) if was SELECTING, `closed` (if overlay was open) — `onTouched` is NOT called |
| any | form reset (§6.5) | EMPTY | form-reset value | cleared | `selectionCleared` ({reason: 'reset'}) if previously had value, `presetChange(null)` if was set, `closed` (if overlay was open) — `onTouched` is NOT called, `valueChange` is NOT emitted (form owns the write) |
| any | `adapter` change (dev-mode; runtime change is `[WONT]` v1) | — | undefined | undefined | dev-mode error — consumers must destroy & recreate the component |

**`selectedPresetId` lifecycle across transitions:**
- Set by preset-selected rows above.
- Cleared on: `clear()`, `mode` change, `selectionRestart` via user click, any `selectionCleared` event originating from the user (not from programmatic writes that happen to match a preset), `resetBehavior: 'value-only'` resets, and `resetBehavior: 'full'` resets.
- Unchanged on: programmatic `writeValue` (even if the value happens to match a preset's range), overlay close, view change.
- Every preset-id clearing above emits `presetChange(null)` on the dedicated output (§33.2).

### 8.4 Emit path

The canonical per-action ordering (consistent with §30.2) is:

```
user action
  → component updates uiState (synchronous signal write)
  → component updates internalDraftValue (if SELECTING)
  → emit activeDateChange (if focus target updated)
  → on commit:
      → emit valueChange (triggers form write — microtask-batched per §8.5, §30.4)
      → emit selection-lifecycle event (selectionComplete, selectionRestart, selectionCleared)
  → if overlay + closeOnSelect:
      overlayState → closing → closed;
      emit closed;
      emit onTouched (if user-initiated close)
```

Precise ordering per action in §30.

**Simultaneous-trigger precedence.** When multiple structural triggers fire within a single microtask, they are processed in this fixed order:

1. `disabled` (flipping to `true`)
2. `adapter` change (dev-mode error per §11.7; halts processing)
3. `mode` change
4. Constraint changes (`minDate` / `maxDate` / `disabledDates` / `dateFilter`)
5. Value writes (`writeValue`)

Events are emitted in the order produced by this sequence. Consumers who need deterministic cross-trigger ordering must rely on this precedence rather than signal-write ordering.

### 8.5 Invariants

- `[REQ]` `[MUST]` `selectionState === 'SELECTING'` ⟹ `internalDraftValue !== null` ∧ `mode === 'range'`.
- `[REQ]` `[MUST]` `selectionState === 'COMPLETE'` ⟹ `externalValue` represents a committed selection.
- `[REQ]` `[MUST]` `overlayState === 'open'` ⟹ `uiState.activeDate !== null`.
- `[REQ]` `[MUST]` A single user action must not trigger more than one `selectionComplete`.
- `[REQ]` `[MUST]` `valueChange` fires at most once per user action (batched within a microtask).
- `[REQ]` `[MUST]` In any sequence that emits both `valueChange` and `closed`, `valueChange` fires strictly before `closed`.
- `[REQ]` `[MUST]` Validation runs once per emitted `valueChange` (i.e., at end-of-microtask), never per intermediate signal write.

### 8.6 State persistence across re-mount

Calendars inside `@if` / `*ngIf` / route outlets get destroyed and recreated. The form's `externalValue` is unaffected (form-owned), but `internalDraftValue` and `uiState` are not. Scenario: user is mid-range-selection, a parent UI toggles a filter that briefly unmounts the picker, and the user loses their in-flight `start`.

**Default behavior:**
- `[REQ]` `[MUST]` Without `stateId`, component state is transient. Unmount discards `internalDraftValue` and `uiState`; the form's `externalValue` persists because the form owns it.

**Opt-in persistence:**
- `[REC]` `[COULD]` `stateId: string` input enables an in-memory state cache keyed by id. Survives re-mount within the same browser session.
- `[REQ]` `[MUST]` Cached state: `selectionState`, `internalDraftValue`, `viewState`, displayed month/year, `activeDate`, `selectedPresetId`.
- `[REQ]` `[MUST]` **Not** cached: `overlayState` (always starts `closed` on mount regardless of previous value), `hoveredDate` (pointer state never persists).
- `[REQ]` `[MUST]` Cache is keyed at the `CalendarCoordinator` service level. The coordinator's injector scope determines persistence lifetime:
  - Injected at app level → persists across routes.
  - Injected at a route component → cleared on route change.
  - Injected at a dialog/overlay → cleared when that container is destroyed.
- `[REQ]` `[MUST]` `stateId` collision within the same coordinator scope logs a dev warning and the second instance wins.
- `[REQ]` `[MUST]` Cache is not persisted to `localStorage` / `sessionStorage` by default (no serialization concerns, no cross-tab issues, no hydration mismatch).
- `[WONT]` **v1:** cross-session / `localStorage`-backed persistence (`persistentStateId`) is deferred to v1.1+. Four prerequisites must stabilize first: (a) `valueTransformer` (§7.6) is still `[SHOULD]` and must be the serialization path; (b) cache invalidation on `mode` / constraint / adapter change is unspecified; (c) consent / privacy model is a consumer concern a library input cannot paper over; (d) SSR/hydration must not restore `overlayState` (§31.2). v1 consumers who need cross-session state must persist `externalValue` themselves via the form control. Listed in §42.2.
- `[REQ]` `[MUST]` Restoration on mount is synchronous (from in-memory map) — no flicker of default state.

---

## 9. Text Input Integration

### 9.1 Composition model

- `[REQ]` `[MUST]` Text input is a **separate directive**: `CalendarInputDirective` (`[calendarInput]`).
- `[REQ]` `[MUST]` Connects to the `CalendarComponent` via template reference: `<input [calendarInput]="picker">`.
- `[REQ]` `[MUST]` Share state through `CalendarCoordinator` service injected at parent level.
- `[REQ]` `[MUST]` Either usable alone: standalone calendar (inline) or standalone input.

### 9.2 Parsing

- `[REQ]` `[MUST]` Parse on blur and Enter.
- `[REQ]` `[SHOULD]` Parse on input with debouncing (configurable).
- `[REQ]` `[MUST]` Delegate to `adapter.parse(value, formats)`.
- `[REQ]` `[MUST]` Locale-aware: "04/10/2026" parses Apr 10 in `en-US`, Oct 4 in most of Europe.
- `[REQ]` `[MUST]` Unparseable: control marked `calendarParseError`; raw string preserved.

### 9.3 Input masking

- `[REC]` Opt-in input mask for the default locale format.
- `[REQ]` `[COULD]` Mask configurable and disablable.
- `[REQ]` `[MUST]` Mask compatible with paste, autofill, IME composition.

### 9.4 Range with two inputs

- `[REQ]` `[SHOULD]` Two separate inputs supported via two directive instances sharing the calendar.
- `[REQ]` `[MUST]` Focus moves start → end on start commit.
- `[REQ]` `[MUST]` Either input can open the calendar; SELECTING state syncs with focused input.

### 9.5 Virtual keyboard (mobile)

- `[REQ]` `[MUST]` Tapping the input opens the calendar by default and suppresses the virtual keyboard. Configurable: `virtualKeyboard: 'show' | 'hide' | 'auto'`.
- `[REQ]` `[MUST]` `inputmode` attribute set for numeric date entry where supported.

---

## 10. Date Constraints & Validation

### 10.1 Inputs

- `[REQ]` `[MUST]` `minDate`, `maxDate`.
- `[REQ]` `[MUST]` `disabledDates: D[] | DateFilterFn<D>`. Consumers requiring both a fixed list and a predicate compose via a single wrapper predicate (documented recipe). This constraint is OR-combined with `disabledDaysOfWeek` and `dateFilter` — a cell is disabled if **any** source considers it disabled.
- `[REQ]` `[MUST]` `disabledDaysOfWeek: number[]` (0 = Sunday). Combined via OR with other constraints.
- `[REQ]` `[MUST]` `dateFilter: DateFilterFn<D>`. Consumer-level predicate, combined via OR with other constraints.
- `[REQ]` `[MUST]` Mode-specific: `maxSelections`, `minRangeLength`, `maxRangeLength`.

### 10.2 Validation error codes (exported)

```typescript
type CalendarErrorCode =
  | 'calendarRequired'
  | 'calendarMinDate'         // { min, actual }
  | 'calendarMaxDate'         // { max, actual }
  | 'calendarDisabledDate'    // { actual }
  | 'calendarRangeTooShort'   // { length, min }
  | 'calendarRangeTooLong'    // { length, max }
  | 'calendarMaxSelections'   // { limit, actual }
  | 'calendarInvalidRange'    // { start, end } — end<start when backward disallowed; also programmatic writeValue with end<start per §21.4
  | 'calendarParseError'      // { raw }
  | 'calendarInvalidValue';   // wrong shape for mode (§11.6) or transformer fromForm failure (§7.6)
```

- `[REQ]` `[MUST]` All error payloads typed and exported.
- `[REQ]` `[MUST]` Error codes stable across versions.

### 10.3 Validation timing

- `[REQ]` `[MUST]` Validates on every value change regardless of source.
- `[REQ]` `[MUST]` Synchronous; async is the consumer's responsibility at form level.

### 10.4 Interaction-time validation behavior

Governs what the user can do during interaction vs. what is only flagged post-commit.

- `[REQ]` `[MUST]` **Disabled cells cannot be committed** — click no-op, keyboard commit ignored. Applies to any cell failing `minDate`/`maxDate`/`disabledDates`/`disabledDaysOfWeek`/`dateFilter`.
- `[REQ]` `[MUST]` **`minRangeLength` / `maxRangeLength` violations during SELECTING:**
  - Preview **is rendered** (user sees the tentative range).
  - Preview cells receive `data-state-invalid-preview` attribute for styling.
  - Second click **allows commit**; the resulting value is accepted but marked invalid at the form level (via §10.2 codes).
  - Rationale: silently blocking commit is surprising; conventional pattern is to let the user commit and surface the error via form messaging.
- `[REC]` `[COULD]` `blockInvalidRangeCommit: boolean` — opt-in strict mode where second click on an invalid-length range is a no-op. Default: `false`.
- `[REQ]` `[MUST]` **`disableRangesCrossingDisabledDates = true`:**
  - Preview rendering stops at the first disabled date in the preview direction.
  - Second click past a disabled date: no-op with `data-state-invalid-flash` visual feedback.
- `[REQ]` `[MUST]` Keyboard commit (Enter/Space) applies the same rules as click.

### 10.5 Invalid programmatic values

- `[REQ]` `[MUST]` Programmatic `writeValue` with an out-of-constraints value: control marked invalid with specific error code; value preserved. §7.2 + §11.4 govern.

---

## 11. Runtime State Conflicts

### 11.1 Programmatic value change during SELECTING (range)

- `[REQ]` `[MUST]` Cancels the SELECTING state; enters EMPTY or COMPLETE based on the new value.
- `[REQ]` `[MUST]` `selectionCleared` fires before the form's `valueChange` propagates back.

### 11.2 Mode change at runtime

- `[REQ]` `[MUST]` Clears value to the empty state for the new mode.
- `[REQ]` `[MUST]` Emits in order: `modeChange`, `selectionCleared`, `valueChange` (matches §8.3).
- `[REQ]` `[MUST]` Closes overlay if open (when `closeOnModeChange: true`, default).

### 11.3 `disabled` flipped to true while overlay is open

- `[REQ]` `[MUST]` Overlay closes immediately.
- `[REQ]` `[MUST]` Any pending SELECTING state is cleared.
- `[REQ]` `[MUST]` `onTouched` is **not** called.

### 11.4 Constraints tightened (minDate, maxDate, disabledDates change)

- `[REQ]` `[MUST]` Existing value revalidated.
- `[REQ]` `[MUST]` Value **never** auto-mutated; control marked invalid instead.
- `[REQ]` `[MUST]` If focused date becomes disabled, focus moves to nearest enabled date in same month (§17.2).

### 11.5 `dayData` / `events` change mid-hover

- `[REQ]` `[MUST]` Hover state and range preview preserved; only cell rendering updates.
- `[REQ]` `[MUST]` No flicker: data delivered via single signal update, not unmount/remount.

### 11.6 `mode` mismatch with `value` shape

- `[REQ]` `[MUST]` Programmatic value with wrong shape: control marked `calendarInvalidValue`, value preserved, dev warning.

### 11.7 Adapter change at runtime

- `[REC]` Not supported. Adapter set at injector level, constant for component lifetime.

---

## 12. Display & Navigation

### 12.1 Views

- `[REQ]` `[MUST]` Three views: `day`, `month`, `year`.
- `[REQ]` `[MUST]` Configurable `startView`.
- `[REQ]` `[MUST]` `viewChange` event with `{ from, to, reason }`.

### 12.2 Day view

- `[REQ]` `[MUST]` Grid column count = `adapter.getDaysInWeek()`. All shipped v1 adapters return 7. Non-7 support is only relevant for future non-Gregorian adapters (§19.5) and is therefore `[SHOULD]` rather than `[MUST]` for v1 in terms of CSS tested variants — v1 guarantees correct rendering at 7.
- `[REQ]` `[MUST]` Configurable `firstDayOfWeek` (0 through `getDaysInWeek()-1`).
- `[REC]` Leading/trailing adjacent-month days (dimmed). Configurable via `showAdjacentMonths`.
- `[REC]` Optional ISO 8601 week numbers via `showWeekNumbers`.
- `[REQ]` `[MUST]` Visual states per §21.6.

### 12.3 Month view
- `[REQ]` `[MUST]` 12-cell grid of selected year.

### 12.4 Year view
- `[REQ]` `[MUST]` 20-year grid (configurable `yearsPerPage`).

### 12.5 Navigation

- `[REQ]` `[MUST]` Previous/next period buttons.
- `[REQ]` `[MUST]` Header click cycles `day → month → year` (drill-up).
- `[REC]` "Today" shortcut button (`showTodayButton`).
- `[REC]` "Clear" button in multiple/range (`showClearButton`).
- `[REQ]` `[SHOULD]` Configurable `navigationStep` (§23.3).

### 12.6 Navigation dead-end prevention

Without dead-end rules, users can navigate into a month where every date is disabled — an empty grid with no recoverable action. The following rules prevent this.

**Disabling navigation buttons:**
- `[REQ]` `[MUST]` "Previous" button is disabled when **every** date in the previous period is outside `minDate`/`maxDate`/`disabledDates`/`disabledDaysOfWeek`/`dateFilter`.
- `[REQ]` `[MUST]` "Next" button follows the symmetric rule.
- `[REQ]` `[MUST]` The check scans up to the `minDate`/`maxDate` boundary. When `minDate` or `maxDate` is unbounded, the check is limited to a configurable `navigationBoundaryLookahead: number` (default 24 periods) — beyond that limit, the button remains enabled (pragmatic tradeoff: don't pay unbounded scan cost).
- `[REQ]` `[MUST]` Applies at every view level: day view checks previous/next month, month view checks previous/next year, year view checks previous/next 20-year page.
- `[REQ]` `[MUST]` Disabled nav buttons get `aria-disabled="true"` and are removed from the tab order.
- `[REQ]` `[MUST]` Re-evaluated whenever constraints change (reactive to input updates).

**Keyboard parity:**
- `[REQ]` `[MUST]` `PageUp`/`PageDown`/`Shift+PageUp`/`Shift+PageDown` respect the same dead-end logic — press becomes a no-op if navigation is blocked.
- `[REQ]` `[MUST]` Arrow-key pane-crossing (§17.4) respects the rule: pressing `→` at the last enabled date with no further enabled dates within the lookahead is a no-op.

**Handling an already-empty month:**

It's still possible to land in an entirely-disabled month — e.g., constraints tightened after navigation, or a user provided a `startAt` that falls in a disabled period. For this case:
- `[REQ]` `[MUST]` An empty-state message is rendered in place of the grid via `emptyStateTemplate: TemplateRef` input.
- `[REQ]` `[MUST]` Default template: localized text "No available dates in this month" (from `CalendarIntl`).
- `[REQ]` `[MUST]` The empty-state element is focusable (`tabindex="0"`) with accessible name matching the message, so screen reader users can perceive the state.
- `[REQ]` `[MUST]` If `minDate`/`maxDate` are both defined and the displayed period is outside their range, an adjacent-direction hint button ("Go to nearest available date") is offered.
- `[REC]` When navigation is initiated and the destination would be empty, the component may auto-skip to the next non-empty period within the lookahead window. Controlled by `autoSkipEmptyPeriods: boolean` (default `false` — explicit navigation is usually safer than implicit skip).

**Today button:**
- `[REQ]` `[MUST]` "Today" button is disabled if `adapter.today()` is outside constraints.
- `[REC]` Tooltip explains why when disabled ("Today is outside the allowed range").

---

## 13. Overlay Lifecycle

### 13.1 Phases

| Phase | Description |
|---|---|
| `closed` | No overlay in DOM |
| `opening` | Overlay rendered, animating in, focus being transferred |
| `open` | Interactive, focus trap active |
| `closing` | Animating out, focus being returned |

- `[REQ]` `[MUST]` Phase exposed via public readonly `overlayState` signal and in test harness.

### 13.2 Open sequence

Triggered by: trigger click, programmatic `open()`, `Alt+↓` on trigger.

Order of operations:
1. `overlayState = 'opening'`.
2. Overlay attached to DOM.
3. Initial `activeDate` resolved (§13.3).
4. `opened` event emitted.
5. Focus transferred to `activeDate` cell (after animation if motion allowed, immediately otherwise).
6. `overlayState = 'open'`.
7. Focus trap activated.

### 13.3 Initial focus resolution on open

- `[REQ]` `[MUST]` Priority order:
  1. If `externalValue` has a selection within the displayed month(s), focus that date (range: focus `start`).
  2. Else if `startAt` provided, focus `startAt` clamped to constraints.
  3. Else focus `adapter.today()` if within constraints.
  4. Else focus first enabled cell in displayed month.
- `[REQ]` `[MUST]` If no enabled cell in displayed month, navigate to next month with enabled cells (24-month search limit; else focus first cell regardless).

### 13.4 Close sequence

Triggered by: outside click, Escape, selection commit + `closeOnSelect`, programmatic `close()`, `disabled=true`.

Order of operations:
1. `overlayState = 'closing'`.
2. Focus trap released.
3. Commit/discard rules applied (§13.5).
4. Animation plays out.
5. Overlay detached from DOM.
6. Focus returned to trigger (unless trigger unmounted).
7. `closed` event emitted.
8. `overlayState = 'closed'`.
9. `onTouched` called if user-initiated (§13.6).

### 13.5 Commit vs discard on close

| Close reason | `selectionState` before | Effect on draft / value |
|---|---|---|
| Outside click | EMPTY | No change |
| Outside click | SELECTING | Discard draft if `persistPartialRange=false`; else keep |
| Outside click | COMPLETE | No change |
| Escape | any | Discard draft, revert to last committed `externalValue` |
| `closeOnSelect` commit | COMPLETE | Commit already happened synchronously |
| Programmatic `close()` | SELECTING | Discard draft |
| `disabled=true` | any | Discard draft, do **not** emit `onTouched` |
| Trigger unmount | any | Discard draft, emit no events |

### 13.6 Form interaction timing

- `[REQ]` `[MUST]` `onTouched` fires **once** when:
  - Overlay closes via user action (outside click, Escape, commit), OR
  - Inline calendar loses focus to an element outside its DOM, OR
  - Trigger loses focus to an element outside both trigger and overlay.
- `[REQ]` `[MUST]` `onTouched` **never** fires for programmatic close or `disabled` close.
- `[REQ]` `[MUST]` `dirty` fires on the first `valueChange` caused by user action within the overlay lifetime.

### 13.7 Invariants

- `[REQ]` `[MUST]` `opened` and `closed` are paired: every `opened` is followed by exactly one `closed`.
- `[REQ]` `[MUST]` `closed` fires before focus returns to the trigger; focus returns before any follow-on user action can cause a re-open.
- `[REQ]` `[MUST]` Re-opening during a `closing` phase is debounced: the new `open()` call waits for `overlayState === 'closed'`.

---

## 14. Interaction Modes

### 14.1 Inline

- `[REQ]` `[MUST]` Always-visible; no overlay.
- `[REQ]` `[MUST]` Selection emits immediately; no apply button unless a footer template provides one.

### 14.2 Overlay

- `[REQ]` `[MUST]` CDK Overlay positioning with fallback positions.
- `[REQ]` `[MUST]` Opens on: trigger click, `Alt+↓` on trigger.
- `[REC]` `openOnFocus` optional (default false).
- `[REQ]` `[MUST]` Closes on: outside click, Escape, selection commit (mode-dependent).
- `[REQ]` `[MUST]` `appendTo: 'host' | 'body' | ElementRef`.
- `[REQ]` `[MUST]` Full lifecycle per §13.

### 14.3 Mobile full-screen
- See §18.5.

---

## 15. Accessibility

### 15.1 Target compliance

- `[REQ]` `[MUST]` WCAG 2.2 Level AA.
- `[REQ]` `[MUST]` Section 508.
- `[REC]` EN 301 549 alignment.

### 15.2 WCAG success criteria coverage

| Criterion | Approach |
|---|---|
| 1.3.1 Info & Relationships | Semantic grid roles, weekday headers with `abbr` |
| 1.4.3 Contrast (Minimum) | All text, selected state, focus ring ≥ 4.5:1 |
| 1.4.11 Non-text Contrast | Focus indicator & cell borders ≥ 3:1 |
| 2.1.1 Keyboard | Full keyboard operation (§16) |
| 2.1.2 No Keyboard Trap | Focus trap releases on Escape |
| 2.4.3 Focus Order | Logical tab order in overlay |
| 2.4.7 Focus Visible | Visible focus indicator, not background alone |
| 2.5.5 / 2.5.8 Target Size | Cell hit targets ≥ 24×24 CSS px |
| 3.3.1 Error Identification | Validation errors expose `aria-invalid` + message |
| 4.1.2 Name, Role, Value | All interactives have accessible names |
| 4.1.3 Status Messages | Live regions for view/range changes |

### 15.3 Structural ARIA

- `[REQ]` `[MUST]` Calendar grid: `role="grid"`, labeled by the visible month/year header.
- `[REQ]` `[MUST]` Rows: `role="row"`.
- `[REQ]` `[MUST]` Day cells: `role="gridcell"` with `aria-selected` for single/multi; range mode uses accessible name.
- `[REQ]` `[MUST]` Day column headers: `role="columnheader"` with `abbr`.
- `[REQ]` `[MUST]` Disabled cells: `aria-disabled="true"`; arrow-key-reachable but not selectable.
- `[REQ]` `[MUST]` Out-of-month cells: `aria-hidden="true"` unless interactive.

### 15.4 Overlay / dialog mode

- `[REQ]` `[MUST]` `role="dialog"`, `aria-modal="true"`, labeled by header.
- `[REQ]` `[MUST]` Focus trap while open.
- `[REQ]` `[MUST]` Focus returns to trigger on close (§13.4).
- `[REQ]` `[MUST]` Trigger accessible name updates with selected value.

### 15.5 Live regions

- `[REQ]` `[MUST]` Month/year header: `aria-live="polite"` — navigation announces new period.
- `[REQ]` `[MUST]` Range selection: "Start date selected" / "End date selected".
- `[REQ]` `[MUST]` During SELECTING, focus movement announces tentative range length.
- `[REQ]` `[MUST]` Announcements pluralization-aware via `CalendarIntl` (§19).

### 15.6 Cell accessible names

- `[REQ]` `[MUST]` Full localized date + state: "Tuesday, 15 March 2026, selected, range start, 3 items" (where "3 items" reflects the cell's badge count per §24.3 Layer 1, if present).
- `[REQ]` `[MUST]` `aria-label` for dynamic state; `aria-labelledby` for stable static references.

### 15.7 Visual accessibility

- `[REQ]` `[MUST]` Focus indicator uses `outline`/`border` (visible in forced-colors mode).
- `[REQ]` `[MUST]` `prefers-reduced-motion`: disables view transitions and cell animations; selection/preview remain instant.
- `[REQ]` `[MUST]` Min touch target 24×24 CSS px; `[REC]` 44×44 mobile.

### 15.8 Screen reader test matrix

- `[REQ]` `[MUST]` Tested on:
  - NVDA + Firefox (Windows)
  - JAWS + Chrome (Windows)
  - VoiceOver + Safari (macOS)
  - VoiceOver + Safari (iOS)
  - TalkBack + Chrome (Android)
- `[REQ]` `[MUST]` Zero critical issues on any combination before release.

---

## 16. Keyboard Interaction

### 16.1 Day view

| Key | Action |
|---|---|
| `←` / `→` | Previous / next day |
| `↑` / `↓` | Previous / next week |
| `Home` / `End` | First / last day of week |
| `PageUp` / `PageDown` | Previous / next month |
| `Shift+PageUp` / `Shift+PageDown` | Previous / next year |
| `Enter` / `Space` | Select focused date |
| `Escape` | Close overlay (if open); no-op inline |
| `Tab` / `Shift+Tab` | Next/previous focusable in dialog |

### 16.2 Month view
- `[REQ]` `[MUST]` Arrows navigate months; Enter drills into day view for that month.

### 16.3 Year view
- `[REQ]` `[MUST]` Arrows navigate years; Enter drills into month view.

### 16.4 Accessibility aid
- `[REC]` Visible or `aria-describedby`-exposed keyboard help at dialog bottom.

### 16.5 Multi-month pane edge behavior
See §17.4.

---

## 17. Focus Management Contract

A deterministic algorithm. Every scenario below has exactly one defined outcome.

### 17.1 Focus trigger events

Focus is re-resolved on:
- Overlay open (§13.3).
- View change (day ↔ month ↔ year).
- Programmatic navigation (`goToDate`, `goToToday`).
- User navigation (prev/next, pane shift, drill).
- Programmatic value change (`writeValue`).
- Constraint change.
- Mode change.
- Multi-month responsive reflow.

### 17.2 Per-event focus resolution

| Event | Algorithm |
|---|---|
| day → month view | Focus month containing previously focused day |
| day → year view | Focus year containing previously focused day |
| month → day (drill-down) | See §22.3 |
| month → year view | Focus year containing previously focused month |
| year → month (drill-down) | Focus first month of drilled year |
| prev/next navigation (day view) | Same day-of-month in new month; if non-existent (Jan 31 → Feb), last day of new month |
| Pane shift (multi-month) | Focus unchanged unless it leaves rendered range; then focus equivalent day in nearest rendered month |
| Programmatic `writeValue` | See §17.3 |
| Constraint change | If focus becomes disabled, focus nearest enabled date in same month; if whole month disabled, navigate to next month with enabled dates |
| Mode change | Focus resets to first enabled cell of current month (value cleared per §11.2) |
| Responsive reflow | Focus preserved on the same date if still rendered |

### 17.3 Focus after programmatic `writeValue`

- `[REQ]` `[MUST]` If the written value is **within the currently displayed month(s)**, focus does **not** move.
- `[REQ]` `[MUST]` If the written value is **outside** the displayed range and the overlay is **open**, the calendar navigates to the written value's month and focuses it.
- `[REQ]` `[MUST]` If the overlay is **closed**, no focus change; the new displayed month applies on next open.

### 17.4 Multi-month arrow behavior at pane edges

- `[REQ]` `[MUST]` Horizontal, `←` from first day of a middle pane: focus moves to last day of previous pane.
- `[REQ]` `[MUST]` Horizontal, `→` from last day of a middle pane: focus moves to first day of next pane.
- `[REQ]` `[MUST]` Horizontal, `←` from first day of **first rendered pane**: trigger prev navigation, focus lands on last day of newly revealed first pane.
- `[REQ]` `[MUST]` Horizontal, `→` from last day of **last rendered pane**: trigger next navigation, focus lands on first day of newly revealed last pane.
- `[REQ]` `[MUST]` Vertical/grid layouts: `↑`/`↓` navigate rows spanning panes the same way.
- `[REQ]` `[MUST]` **No wrap**: arrow keys never jump from last pane to first or vice versa.

### 17.5 Navigation-triggered focus

- `[REQ]` `[MUST]` Click "next month": same day-of-month in new month (fallback last day if nonexistent).
- `[REQ]` `[MUST]` Click "today": focus today, navigate if needed.
- `[REQ]` `[MUST]` Click "clear" (or call `clear()`): focus remains on the clear button visually; `activeDate` is re-resolved by applying the §13.3 priority chain to the current displayed month (same algorithm as form reset, §6.5). No cell receives visible focus until the user tabs into the grid.

### 17.6 Focus visibility

- `[REQ]` `[MUST]` `activeDate` always corresponds to the cell with `tabindex="0"`; all others have `tabindex="-1"`.
- `[REQ]` `[MUST]` Focus ring visible whenever grid has keyboard focus; use `:focus-visible`.
- `[REQ]` `[MUST]` Mouse click does not show focus ring (per `:focus-visible` semantics).

---

## 18. Mobile & Touch Interaction

### 18.1 Touch gestures

- `[REQ]` `[MUST]` Tap on cell = select.
- `[REC]` Horizontal swipe between months in day view.
- `[REC]` Vertical swipe to dismiss overlay.
- `[REQ]` `[MUST]` No dependence on hover.

### 18.2 Event model

- `[REQ]` `[MUST]` Pointer Events API; fallback to touch + mouse.
- `[REQ]` `[MUST]` `touch-action` CSS prevents unwanted scroll during grid interaction.

### 18.3 Touch targets

- `[REQ]` `[MUST]` Cells ≥ 24×24 CSS px (WCAG 2.2 AA).
- `[REC]` Cells ≥ 44×44 CSS px on small viewports.

### 18.4 Range selection on mobile

- `[REQ]` `[MUST]` After first tap, show persistent hint ("Select end date") until second tap or close.
- `[REC]` Default to two-pane layout on mobile for range mode.

### 18.5 Responsive full-screen mode

- `[REQ]` `[SHOULD]` Ship responsive full-screen presentation in v1. Input: `mobileMode: 'overlay' | 'fullscreen' | 'bottom-sheet' | 'auto'`. Default: `'auto'`.
- `[REQ]` `[MUST]` `'auto'` behavior: viewport width `< 600px` at overlay-open time → render as `fullscreen`; otherwise render as standard positioned `overlay`. Breakpoint is measured once per open (no layout thrash mid-open).
- `[REQ]` `[MUST]` `'fullscreen'` and `'bottom-sheet'` variants keep the §13 overlay lifecycle (`opening` → `open` → `closing` → `closed`) and the §15.4 dialog a11y contract (`role="dialog"`, `aria-modal="true"`, focus trap, focus return). Only the positioning strategy differs.
- `[REQ]` `[MUST]` `'fullscreen'` composes with §18.6 iOS safe-area insets and §9.5 virtual-keyboard suppression.
- `[REQ]` `[MUST]` Each `mobileMode` value covered by §35.2 a11y and §35.5 visual-regression suites.

### 18.6 iOS safe-area and input behavior

- `[REQ]` `[MUST]` Respect `env(safe-area-inset-*)` in full-screen mode.
- `[REQ]` `[MUST]` Input opening calendar does not trigger virtual keyboard by default (§9.5).

---

## 19. Internationalization & Localization

### 19.1 Locale integration

- `[REQ]` `[MUST]` Default from Angular `LOCALE_ID`.
- `[REQ]` `[MUST]` Per-instance override via `locale` input.
- `[REQ]` `[MUST]` Month/weekday names via `Intl.DateTimeFormat` with `short`, `narrow`, `long` variants.

### 19.2 First day of week

- `[REQ]` `[MUST]` Locale-derived default, overridable per instance.

### 19.3 RTL

- `[REQ]` `[MUST]` Full RTL via CSS logical properties.
- `[REQ]` `[MUST]` Prev/next buttons swap visually; arrow keys map to logical prev/next, not visual.

### 19.4 CalendarIntl service

- `[REQ]` `[MUST]` All user-visible strings exposed via injectable `CalendarIntl`:
  - Labels: today, clear, prev month, next month, prev year, next year, choose date, open calendar.
  - ARIA announcements: "Start date selected", "X days selected".
  - Plural rules via ICU `plural`.
- `[REQ]` `[MUST]` Override at any injector level.
- `[REC]` Ship defaults for English + 5 other major locales (de, fr, es, pt, ja).

### 19.5 Non-Gregorian calendars

- `[REQ]` `[MUST]` `DateAdapter` contract stays Gregorian-agnostic (enforced by §20.1–§20.2). Non-Gregorian adapters remain a purely additive future extension.
- `[REQ]` `[MUST]` v1 ships Gregorian adapters only. §12.2 tested CSS covers 7-column week grids; non-7 week grids are `[SHOULD]`-tolerated at the contract level but not validated.
- `[WONT]` **v1:** Hebrew, Islamic (observation-based vs. tabular), Buddhist, and Japanese (era-aware, incl. Reiwa transition) adapters are deferred to v2+. Doing them correctly requires expanded `CalendarIntl` keys (§19.4), an extended screen-reader matrix (§15.8), and per-calendar leap/era math that would starve core picker scope.

---

## 20. Date Adapter Architecture

### 20.1 Adapter contract

- `[REQ]` `[MUST]` `DateAdapter<D>` abstract class as DI token.
- `[REQ]` `[MUST]` All internal logic operates on `D`; no hard-coded `Date` outside the adapter.

### 20.2 Adapter methods

```
today(): D
create(year: number, month: number, day: number): D
parse(value: unknown, formats: string[]): D | null
format(date: D, format: string): string
invalid(): D
isValid(date: D): boolean
startOfDay(date: D): D                 // normalization for time-aware adapters

getYear / getMonth / getDate / getDayOfWeek(date: D): number
getFirstDayOfWeek(): number
getNumDaysInMonth(date: D): number
getDaysInWeek(): number
getDateNames / getMonthNames / getDayOfWeekNames(style): string[]

addYears / addMonths / addDays(date: D, n: number): D
compare(a: D, b: D): number
sameDate / sameMonth / sameYear(a: D, b: D): boolean
clone(date: D): D

toIso(date: D): string                 // serialization helper (§7.5)
fromIso(iso: string): D | null
```

### 20.3 DateFormats contract

- `[REQ]` `[MUST]` `DateFormats` DI token defines format strings for:
  - `input`, `display`, `monthLabel`, `yearLabel`, `a11yLabel`, `monthA11yLabel`, `dayA11yLabel`.

### 20.4 Shipped adapters

Adapters ship as independent secondary entry points so importing one does not pull the others into the consumer bundle (§32.1 budgets are measured against native-only; each adapter is tree-shakable).

| Adapter | Entry point | v1 status | Rationale |
|---|---|---|---|
| `NativeDateAdapter` | `ngx-tw/calendar` (default) | `[REQ]` `[MUST]` | Zero-dependency baseline. Wall-clock floating model (§4.1). |
| `LuxonDateAdapter` | `ngx-tw/calendar/luxon` | `[REQ]` `[MUST]` | Only mature option with a stable, Intl-aligned, TZ-aware surface (§4.2, §31.4). Widely adopted in Angular/Node booking and enterprise work. `luxon` is an optional peer dep (§3). |
| `DateFnsDateAdapter` | `ngx-tw/calendar/date-fns` | `[SHOULD]` v1.1 | Deferred: the `date-fns` v2 → v3 migration and the separate `date-fns-tz` TZ package make the adapter surface unstable today; a v1.1 slot lets us pick the shape once. |
| `TemporalDateAdapter` | `ngx-tw/calendar/temporal` | `[COULD]` v1.1 | Deferred: browser support is still rolling out and polyfill maturity is uneven. v1.1 lands it without forcing a polyfill bundle on consumers who don't want it. |

- `[REQ]` `[MUST]` Per-adapter unit tests (§35.1) and DST / locale edge cases (§35.3) run against both shipped v1 adapters.
- `[REQ]` `[MUST]` `ngx-tw/calendar/luxon` honors the §7.5 rule that non-`Date` adapters do not round-trip through strings; serialization is the consumer's responsibility.
- `[REQ]` `[MUST]` Per-adapter setup guide in the documentation (§39.1).

---

## 21. Range Selection Flow

### 21.1 State machine

```
        ┌──────────┐  click A   ┌────────────┐  click B   ┌──────────┐
        │  EMPTY   │ ─────────▶ │ SELECTING  │ ─────────▶ │ COMPLETE │
        └──────────┘            └────────────┘            └──────────┘
             ▲                         │                        │
             │     clear / reset       │                        │
             └─────────────────────────┴────────────────────────┘
                                          3rd click
```

- `[REQ]` `[MUST]` EMPTY: `{ start: null, end: null }`.
- `[REQ]` `[MUST]` SELECTING: `internalDraftValue = { start: A }`; `externalValue` unchanged.
- `[REQ]` `[MUST]` COMPLETE: `{ start: A, end: B }`.

### 21.2 Happy path

- `[REQ]` `[MUST]` EMPTY → SELECTING on first click. Emit `activeDateChange`, `selectionStart`. Enter hover-preview mode.
- `[REQ]` `[MUST]` Hover during SELECTING updates preview (backward if target < start).
- `[REQ]` `[MUST]` SELECTING → COMPLETE on second click:
  - B ≥ A → `{ start: A, end: B }`.
  - B < A + `allowBackwardRange=true` → auto-swap.
  - B < A + `allowBackwardRange=false` → restart (B as new start).
  - B === A + `allowSingleDayRange=true` → `{ A, A }`.
- `[REQ]` `[MUST]` Validate `minRangeLength`/`maxRangeLength` (per §10.4).
- `[REQ]` `[MUST]` Emit in order: `activeDateChange`, `valueChange`, `selectionComplete`; close overlay if applicable.

### 21.3 Third-click behavior

- `[REQ]` `[MUST]` `rangeClickBehavior: 'restart' | 'nearest-edge' | 'require-clear'`.
- `[REC]` Default: `'restart'`.

**`restart` semantics:**
- `[REQ]` `[MUST]` Click on any cell while COMPLETE: new range begins. State → SELECTING with `draft.start = clicked`. Previous `externalValue` retained until second click commits the new range.

**`nearest-edge` semantics:**
- `[REQ]` `[MUST]` Click C while COMPLETE `{ start: A, end: B }`: compute the nearest endpoint to C (by `adapter.compare`). The result is a **one-click commit**:
  - If `|C − A| < |C − B|`, new range = `{ start: C, end: B }` (A replaced).
  - Else new range = `{ start: A, end: C }` (B replaced).
- `[REQ]` `[MUST]` Auto-swap if the new range has `end < start` and `allowBackwardRange=true`; else invalid per §10.2.
- `[REQ]` `[MUST]` State: COMPLETE → COMPLETE (no SELECTING intermediate). `externalValue` mutates immediately.
- `[REQ]` `[MUST]` Rationale: `nearest-edge` is a drag-like shortcut — one click to move one endpoint.

**`require-clear` semantics:**
- `[REQ]` `[MUST]` Click on any cell while COMPLETE: no-op. State unchanged. Visual feedback: brief `data-state-invalid-flash` on the clicked cell. Consumer must call `clear()` or the user must press the clear button before a new selection can begin.

### 21.4 Edge cases

| Situation | Behavior | Configurable via |
|---|---|---|
| Same date twice | `{A, A}` | `allowSingleDayRange` |
| Second click before first | Auto-swap | `allowBackwardRange` |
| Third click | Restart (default) | `rangeClickBehavior` |
| Click `start` during SELECTING | Single-day range | `allowSingleDayRange` |
| Range spans disabled date | Allowed | `disableRangesCrossingDisabledDates` |
| Range length violates constraints | Accept, mark form invalid (§10.4) | `blockInvalidRangeCommit` |
| Overlay close during SELECTING | Discard partial | `persistPartialRange` |
| Programmatic `end < start` | Auto-swap if backward allowed, else invalid | `allowBackwardRange` |
| Preset selected | Skip flow; write COMPLETE directly | — |

### 21.5 Events

See §30 for full ordering. Transitions emit:

| Transition | Event | Payload |
|---|---|---|
| EMPTY → SELECTING | `selectionStart` | `{ start: D }` |
| SELECTING hover/focus | `rangePreview` | `{ start: D, tentativeEnd: D }` |
| SELECTING → COMPLETE | `selectionComplete` | `{ start: D, end: D }` |
| **Any → SELECTING with a new `start`, while a prior `start` or COMPLETE range existed** | `selectionRestart` | `{ start: D }` |
| COMPLETE → COMPLETE via `nearest-edge` (one-click endpoint swap) | `selectionComplete` | `{ start: D, end: D }` |
| any → EMPTY | `selectionCleared` | `void` |
| any state change | `valueChange` | `CalendarValue<M, D>` |

`selectionRestart` applies to both **COMPLETE → SELECTING** (3rd-click restart with `rangeClickBehavior='restart'`) and **SELECTING → SELECTING** (backward click with `allowBackwardRange=false`). The common semantic: a previous start/range is being abandoned in favor of a new start. Consumers distinguish the two cases by reading `selectionState` at emission time if needed.

### 21.6 Visual cell states

| State | When |
|---|---|
| `idle` | Not involved in selection |
| `today` | `sameDate(cell, adapter.today())` |
| `range-start` | Equals `start` |
| `range-end` | Equals `end` |
| `in-range` | Strictly between `start` and `end` |
| `range-preview-start` | Would be start on click now (backward hover) |
| `range-preview-end` | Would be end on click now |
| `in-range-preview` | Would be in-range on click now |
| `invalid-preview` | Preview violates `maxRangeLength` |
| `disabled` | Fails any constraint |
| `focused` | Has keyboard focus |
| `out-of-month` | Adjacent month |
| `weekend` | Saturday/Sunday |

- `[REQ]` `[MUST]` States combinable; surfaced as `data-state-*` attributes.

---

## 22. View Switching Flow

### 22.1 Selection and view are orthogonal

- `[REQ]` `[MUST]` View state is independent of selection state.
- `[REQ]` `[MUST]` Switching views **never** mutates `externalValue` (exception: `rangeGranularity` ≠ 'day', §22.5).

### 22.2 Mid-SELECTING view switch

- `[REQ]` `[MUST]` User can switch views mid-SELECTING. `internalDraftValue` preserved.
- `[REQ]` `[MUST]` Month/year view shows indicator for the month/year containing draft `start`.
- `[REQ]` `[SHOULD]` Hover preview extends into month/year views.

### 22.3 Drilling from month/year back to day

- `[REQ]` `[MUST]` Focus landing rules (applied in order, with a disabled-fallback pass):
  - Target month contains `start` or `end` → focus that date.
  - Target month between `start` and `end` → focus day 1.
  - Target month before `start` or after `end` → focus day 1.
  - No selection → focus `adapter.today()` if in month, else day 1.
- `[REQ]` `[MUST]` **Disabled-date fallback:** after applying the rule above, if the resolved target date is disabled, apply §17.2 row 9 semantics — focus the nearest enabled date in the same month. If the entire month is disabled, §12.6 empty-state rules apply.

### 22.4 Month-view click during SELECTING

- `[REQ]` `[MUST]` Always navigation (drill-down), never commit — unless §22.5.

### 22.5 Granularity-based selection

- `[REQ]` `[SHOULD]` `rangeGranularity: 'day' | 'month' | 'year'`.
- `[REQ]` `[MUST]` At `month`: month clicks commit; range snaps to first-of-month-A → last-of-month-B.
- `[REQ]` `[MUST]` At `year`: year clicks commit; range snaps to full years.
- `[REQ]` `[MUST]` `startView` defaults to match granularity.

### 22.6 Events

- `[REQ]` `[MUST]` `viewChange` with `{ from, to, reason: 'user' | 'programmatic' | 'drill-down' | 'drill-up' }`.
- `[REQ]` `[MUST]` `activeDateChange` is the single source of truth for focus.

---

## 23. Multi-Month Display

### 23.1 Configuration

- `[REQ]` `[MUST]` `numberOfMonths: number` — 1 to 12+.
- `[REQ]` `[MUST]` `monthLayout: 'horizontal' | 'vertical' | 'grid'`.
- `[REQ]` `[MUST]` `monthsPerRow: number` (grid).

### 23.2 Navigation models

- `[REQ]` `[MUST]` Linked panes (default): panes consecutive; next/prev shifts all.
- `[REC]` `[COULD]` Independent panes: opt-in via `independentMonthNavigation: true`.

### 23.3 Navigation step

- `[REQ]` `[MUST]` `navigationStep: 'single' | 'page'`.
- `[REC]` Default: `'single'`.

### 23.4 Year view (12-month)

- `[REQ]` `[MUST]` Supported via `numberOfMonths: 12, monthLayout: 'grid'`.
- `[REQ]` `[MUST]` `monthPaneDensity: 'full' | 'compact' | 'name-only'`.
- `[REQ]` `[MUST]` `full` density at 12 panes uses virtual rendering.

### 23.5 Responsive

- `[REQ]` `[MUST]` `responsiveMonths: boolean` — true by default.
- `[REQ]` `[MUST]` `minPaneWidth: number` (default 280 px).
- `[REQ]` `[MUST]` `renderedMonthsCount` output reflects actual count.
- `[REQ]` `[SHOULD]` Horizontal scroll fallback when `responsiveMonths: false` and viewport too narrow.

### 23.6 Hover preview across panes

- `[REQ]` `[MUST]` Range preview spanning multiple panes renders continuously.
- `[REQ]` `[MUST]` Visual regression coverage.

### 23.7 Keyboard across panes
See §17.4.

### 23.8 Drag-select across panes
Cross-pane drag selection (click-and-drag across months to define a range) is marked `[WONT]` for v1 and v2. See §42.3 for rationale. Range selection across panes uses the two-click model with continuous hover preview (§21, §23.6). Consumers requiring drag semantics must build it externally.

---

## 24. Day Cell Customization

### 24.1 Cell context

```typescript
type DayCellContext<D, T = unknown> = {
  date: D;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isInRangePreview: boolean;
  isInvalidPreview: boolean;
  isDisabled: boolean;
  isOutOfMonth: boolean;
  isFocused: boolean;
  isWeekend: boolean;
  data?: T;
};
```

### 24.2 Data binding

- `[REQ]` `[MUST]` `dayData: Map<string, T>` keyed by ISO date.
- `[REQ]` `[MUST]` `dayDataFn: (date: D) => T | undefined` alternative.
- `[REQ]` `[MUST]` Indexed once per data change.

### 24.3 Customization layers

**Layer 1 — Badges**
- `[REQ]` `[MUST]` `dayBadge: (date: D, data?: T) => BadgeConfig | null`.
- `[REQ]` `[MUST]` `BadgeConfig: { count?: number; dot?: boolean; color?: string; label?: string }` — label is **text only**.
- `[REQ]` `[MUST]` Rendered in conventional position; consumer-themeable.

**Layer 2 — Cell template**
- `[REQ]` `[MUST]` `cellTemplate: TemplateRef<DayCellContext<D, T>>`.
- `[REQ]` `[MUST]` Consumer provides **presentational** content. Sub-element interactive listeners must `stopPropagation`.
- `[REQ]` `[MUST]` Consumer responsible for ARIA of sub-elements.

**Layer 3 — Events (deferred)**
- `[WONT]` v1. The §2 scope statement is load-bearing: this component is a range-capable date picker, not a calendar surface. Schedule semantics (drag-create, drag-resize, multi-day event bars, lane packing for overlapping events) need a different layout model and gesture contract — grafting them onto the picker grid distorts both products. Layer 1 (`BadgeConfig`) and Layer 2 (`cellTemplate` with full `DayCellContext`) are the extensibility ceiling for the picker. A sibling `schedule` component in v2 inherits `DateAdapter` and `CalendarIntl` cleanly (§42.1).

### 24.4 Click conflict resolution

- `[REQ]` `[MUST]` Component listens to cell clicks for selection.
- `[REQ]` `[MUST]` Sub-element listeners must `stopPropagation`.
- `[REQ]` `[MUST]` Documented pattern with code example.

---

## 25. Presets

### 25.1 Data contract

```typescript
type CalendarPreset<D> = {
  id: string;
  label: string;
  value: CalendarRangeValue<D> | (() => CalendarRangeValue<D>);
  group?: string;
  disabled?: boolean | ((ctx: { minDate?: D; maxDate?: D }) => boolean);
};

type PresetGroup = { id: string; label: string };
```

### 25.2 Behavior

- `[REQ]` `[MUST]` Preset selection writes directly to COMPLETE; bypasses click flow.
- `[REQ]` `[MUST]` Overlay closes (overlay mode) unless `closeOnPresetSelect: false`.
- `[REQ]` `[MUST]` Calendar scrolls/navigates to show preset range after selection.
- `[REQ]` `[MUST]` Presets honor `minDate`/`maxDate`/`disabledDates` per `presetViolationBehavior`.
- `[REC]` Default: `'disable'`.

### 25.3 Accessibility

- `[REQ]` `[MUST]` `role="list"` or `role="menu"`.
- `[REQ]` `[MUST]` Keyboard: Tab in, Arrow within, Enter to select.
- `[REQ]` `[MUST]` Accessible name includes computed range ("Last 7 days, April 17 to April 24").

### 25.4 Custom preset option

- `[REC]` Convention: `'custom'`-flagged preset focuses the calendar grid rather than writing a value.

### 25.5 Layout

- `[REQ]` `[MUST]` Default: vertical list beside grid (desktop); horizontal chip list (mobile).
- `[REQ]` `[MUST]` `presetTemplate: TemplateRef` for full customization.

### 25.6 Revalidation on constraint change

- `[REQ]` `[MUST]` When `minDate`/`maxDate`/`disabledDates` changes, every preset is re-evaluated against the new constraints.
- `[REQ]` `[MUST]` Presets that now violate constraints update visual state per `presetViolationBehavior` without animation flash.
- `[REQ]` `[MUST]` If the currently selected value **originated from** a preset and is now invalid, the preset is marked visually but the **value is not mutated** (consistent with §11.4).
- `[REQ]` `[MUST]` `selectedPresetId` is exposed as a public readonly `Signal<string | null>` (§33.3) — not an output. Consumers read it reactively via `picker.selectedPresetId()` in templates or `computed()`. Lifecycle rules per §8.3.

---

## 26. Cross-Field & Composite Form Patterns

### 26.1 Split range across two FormControls

- `[REQ]` `[MUST]` Two-input range (§9.4) produces two separate values at form level: `startDate` and `endDate` as independent controls.
- `[REQ]` `[MUST]` Validators provided:
  - `calendarCrossFieldRange(startCtrl, endCtrl)`: enforces end ≥ start at parent group level.
  - `calendarCrossFieldRangeLength(startCtrl, endCtrl, min, max)`.
- `[REC]` Recipe documented for FormGroup and Signal Forms.

### 26.2 Single range value in a FormGroup

- `[REQ]` `[MUST]` `CalendarRangeValue<D>` works as a single `FormControl` value.
- `[REQ]` `[MUST]` `FormGroup({ dateRange: new FormControl({ start: null, end: null }) })` is idiomatic.

### 26.3 Async validators

- `[REQ]` `[MUST]` Component-level validators are synchronous. Async at form level.
- `[REC]` Recipe documented.

### 26.4 Derived / computed ranges

- `[REC]` Example recipes: "pick start + duration → auto-set end"; "linked pickers — outbound restricts return range."

---

## 27. Security

### 27.1 Content safety

- `[REQ]` `[MUST]` All string inputs treated as **text**, never HTML. Never `innerHTML` on consumer-provided strings.
- `[REQ]` `[MUST]` Consumer templates run under Angular's default sanitization; component does not bypass.

### 27.2 Consumer predicates

- `[REQ]` `[MUST]` `dateFilter`, `dayDataFn`, `dayBadge`, etc. are wrapped in try/catch; thrown errors are caught and logged in dev.
- `[REQ]` `[MUST]` Throwing predicate → cell treated as disabled (fail-safe).
- `[REC]` Dev-mode warning on slow predicates (§32.5).

### 27.3 CSP compliance

- `[REQ]` `[MUST]` No inline styles injected by JS; no `eval`; no `new Function`.
- `[REQ]` `[MUST]` Compatible with `style-src 'self'` and `script-src 'self'`.

### 27.4 Data boundaries

- `[REQ]` `[MUST]` Consumer data in templates is the consumer's responsibility to sanitize. Documented.

---

## 28. Error Display Strategy

### 28.1 Position

**The component is headless for validation error display.**

- `[REQ]` `[MUST]` Component computes validation errors (§10) and exposes them via the form control's `errors` object and ARIA (`aria-invalid`).
- `[REQ]` `[MUST]` Component **does not** render inline error messages, icons, or tooltips for validation errors.
- `[REQ]` `[MUST]` Consumers render error UI using their form's error display pattern.

### 28.2 Rationale

Forms vary radically in how they present errors (inline below field, tooltip, summary at top, toast). An embedded error UI forces consumers to fight the component. Headless means the component integrates with any error system.

### 28.3 Information exposed for consumer error UI

- `[REQ]` `[MUST]` Typed error codes with structured payloads (§10.2).
- `[REQ]` `[MUST]` `aria-invalid="true"` on trigger/grid root when invalid.
- `[REQ]` `[MUST]` `errorAriaDescribedBy: string` input links to a consumer-provided error element via `aria-describedby`.
- `[REQ]` `[MUST]` Error codes stable and documented so consumers can i18n them.
- `[REQ]` `[MUST]` `aria-describedby` composition: when both `errorAriaDescribedBy` and the component's own keyboard-help element (§16.4) produce IDs, the component composes them as a space-separated list (`aria-describedby="keyboardHelpId errorId"`). Consumer-provided IDs always come last so they override in announcement order.

### 28.4 In-grid invalid feedback (exception)

Certain **interaction-level** states show directly in the grid because they are not "errors" in the form-validation sense but feedback during interaction:

- Disabled cells: `data-state-disabled`, `aria-disabled="true"`, dimmed.
- Out-of-range preview during SELECTING when hover exceeds `maxRangeLength`: `data-state-invalid-preview`; consumer can opt out via CSS.
- Preset violating constraints: `data-state-preset-invalid`.

These are **presentational affordances** for the active interaction, not validation messages. They help the user avoid committing invalid selections.

### 28.5 Documentation

- `[REQ]` `[MUST]` Cookbook includes:
  - Reactive Forms error display recipe.
  - Signal Forms error display recipe.
  - Accessibility pattern for linking `aria-describedby` correctly.

---

## 29. Error Handling & Safety Nets

### 29.1 Dev-mode warnings

- `[REQ]` `[MUST]` Emit `console.warn` for:
  - `minDate > maxDate`.
  - `value` shape mismatched with `mode`.
  - `numberOfMonths < 1`.
  - `maxRangeLength < minRangeLength`.
  - `disabledDaysOfWeek` invalid values.
  - Unknown `rangeClickBehavior` string.

### 29.2 Production behavior

- `[REQ]` `[MUST]` Warnings stripped in production builds.
- `[REQ]` `[MUST]` Invalid configuration never throws; degrades to safe default.

### 29.3 Adapter parse failures

- `[REQ]` `[MUST]` `adapter.parse` returning `null` → control marked `calendarParseError`, raw input preserved.
- `[REQ]` `[MUST]` Never throws to consumer code.

### 29.4 Template errors

- `[REQ]` `[MUST]` Cell template throw → cell renders fallback (default cell), logs in dev.

---

## 30. Event Ordering

Events fire in a specified order for each user action. Consumers may rely on this order.

### 30.1 Ordering principles

- `[REQ]` `[MUST]` Synchronous within a microtask: all events for a single user action fire before control returns to the consumer.
- `[REQ]` `[MUST]` Ordering is stable across releases; changing it is a breaking change.

### 30.2 Ordered sequences by action

**Single mode — click date**
```
activeDateChange (if focus moved)
→ valueChange
→ selectionComplete
→ (closed, if overlay + closeOnSelect)
```

**Multiple mode — click date to add**
```
activeDateChange
→ valueChange
→ selectionComplete
```

**Multiple mode — click selected date to remove**
```
activeDateChange
→ valueChange
```

**Range mode — first click (EMPTY → SELECTING)**
```
activeDateChange
→ selectionStart
```
(no `valueChange` — `externalValue` does not change during SELECTING)

**Range mode — hover during SELECTING**
```
rangePreview
```

**Range mode — second click (SELECTING → COMPLETE)**
```
activeDateChange
→ valueChange
→ selectionComplete
→ (closed, if overlay + closeOnSelect)
```

**Range mode — third click, restart (COMPLETE → SELECTING)**
```
activeDateChange
→ selectionRestart
```
(no `valueChange` — external value retained until next commit)

**Overlay open**
```
opened
→ activeDateChange (initial focus resolution)
```

**Overlay close via Escape / outside click, draft discarded**
```
(selectionCleared, if discarding a SELECTING draft)
→ closed
```

**Programmatic `writeValue` from form**
```
(selectionCleared, if SELECTING was in progress)
→ form-originated valueChange propagates in
→ activeDateChange (if focus re-resolved per §17.3)
```

**View change (day → month via header click)**
```
activeDateChange
→ viewChange
```

**Next-month navigation**
```
monthChange
→ activeDateChange
```

### 30.3 Form-level ordering

- `[REQ]` `[MUST]` `valueChange` fires **before** `selectionComplete`, so consumers subscribing to either see consistent state.
- `[REQ]` `[MUST]` `(ngModelChange)` / `FormControl.valueChanges` fire **after** `valueChange` in the same microtask (native Angular form propagation).
- `[REQ]` `[MUST]` `touched` emission at overlay close or blur, never interleaved with `valueChange`.

### 30.4 Coalescing

- `[REQ]` `[MUST]` Multiple state changes within one microtask (e.g., `mode` + `value` set together) emit one `valueChange` at the end of the microtask, not one per mutation.

---

## 31. SSR & Hydration

### 31.1 Server rendering

- `[REQ]` `[MUST]` Full server render of current view (not a skeleton).
- `[REQ]` `[MUST]` No `window`/`document`/`navigator` outside lifecycle guards.
- `[REQ]` `[MUST]` `adapter.today()` on server uses configured server timezone.

### 31.2 Hydration

- `[REQ]` `[MUST]` No DOM mismatch warnings when server TZ differs from client.
- `[REQ]` `[MUST]` "Today" marker may re-render after hydration if client differs; no warning.
- `[REQ]` `[MUST]` Overlay closed by default on hydration regardless of server-rendered state.

### 31.3 Focus management

- `[REQ]` `[MUST]` No autofocus on hydration.
- `[REQ]` `[MUST]` Focus established only when user opens the overlay or interacts inline.

### 31.4 I18n on server

- `[REQ]` `[MUST]` `Intl.DateTimeFormat` works server-side (Node ≥ 18 with full ICU).

---

## 32. Performance

### 32.1 Bundle size budgets (enforced at build)

- `[REQ]` `[MUST]` Core + `NativeDateAdapter`, gzipped: ≤ **35 KB**.
- `[REQ]` `[MUST]` Core without adapter, gzipped: ≤ **25 KB**.
- `[REQ]` `[MUST]` Tree-shakable: importing the component must not pull Luxon/date-fns adapters.

### 32.2 Runtime budgets (mid-range mobile, Moto G4-class)

- `[REQ]` `[MUST]` First render single-month day view: ≤ **50 ms** (P95).
- `[REQ]` `[MUST]` First render 12-pane year view: ≤ **200 ms** (P95).
- `[REQ]` `[MUST]` Cell click → visual feedback: ≤ **16 ms** (1 frame).
- `[REQ]` `[MUST]` Hover preview update: ≤ **16 ms**.
- `[REQ]` `[MUST]` Programmatic value change → DOM update: ≤ **50 ms**.
- `[REQ]` `[MUST]` `dayData` update re-render: ≤ **50 ms** (1 month), ≤ **200 ms** (12 months).

### 32.3 Implementation requirements

- `[REQ]` `[MUST]` `ChangeDetectionStrategy.OnPush`.
- `[REQ]` `[MUST]` Signal-based internal state.
- `[REQ]` `[MUST]` Each month pane is an OnPush child; updating one pane does not dirty others.
- `[REQ]` `[MUST]` Month matrices memoized by `(year, month, firstDayOfWeek, locale)`.
- `[REQ]` `[MUST]` `dayData` indexed by ISO-date key once per data change.
- `[REQ]` `[MUST]` 12-pane year view at `full` density uses CDK virtual scroll.
- `[REQ]` `[MUST]` No `setInterval` for "today" refresh.

### 32.4 Measurement

- `[REQ]` `[MUST]` Budgets enforced in CI via automated benchmarks.
- `[REQ]` `[MUST]` Regressions block merge.

### 32.5 Dynamic data & consumer predicate performance

- `[REQ]` `[MUST]` Consumer predicates (`dateFilter`, `dayDataFn`, `dayBadge`, cell disabled predicate) are called **at most once per cell per render pass**.
- `[REQ]` `[MUST]` Internal memoization by (date, predicate reference identity) — stable predicate references yield cache hits across re-renders.
- `[REQ]` `[MUST]` `dayData` map read once per render pass; O(1) lookup by ISO-date key.
- `[REC]` Consumers pass stable predicate references (avoid inline arrow functions). Documented with `computed()` example in Signals.
- `[REQ]` `[MUST]` Dev-mode warning: if a single predicate call exceeds **1 ms**, log once per render pass with predicate name and cell count.
- `[REQ]` `[MUST]` Dev-mode warning: if a full render pass exceeds §32.2 budget by 50%, log with diagnostic breakdown (time per predicate, per pane, per phase).

---

## 33. Component API Contract

All inputs use `input()` / `input.required()` (Angular 17.2+). All outputs use `output()` returning `OutputEmitterRef`. All public reactive state is exposed as readonly `Signal<T>`. No `EventEmitter` is used anywhere in the public API.

### 33.1 Inputs

Every input lists its TypeScript type and default value. `D` is the adapter date type. `M` is the mode generic.

**Selection**
| Input | Type | Default |
|---|---|---|
| `mode` | `CalendarMode` | `'single'` |
| `value` | `CalendarValue<M, D>` | mode-specific empty (§7.1) |
| `allowDeselect` | `boolean` | `false` |
| `maxSelections` | `number` | `Infinity` |
| `maxSelectionBehavior` | `MaxSelectionBehavior` | `'emit-limit-reached'` |
| `sorted` | `boolean` | `false` |
| `allowBackwardRange` | `boolean` | `true` |
| `allowSingleDayRange` | `boolean` | `true` |
| `rangeClickBehavior` | `RangeClickBehavior` | `'restart'` |
| `persistPartialRange` | `boolean` | `false` |
| `minRangeLength` | `number` | `1` |
| `maxRangeLength` | `number` | `Infinity` |
| `disableRangesCrossingDisabledDates` | `boolean` | `false` |
| `blockInvalidRangeCommit` | `boolean` | `false` |
| `rangeGranularity` | `RangeGranularity` | `'day'` |

**Constraints**
| Input | Type | Default |
|---|---|---|
| `minDate` | `D \| null` | `null` |
| `maxDate` | `D \| null` | `null` |
| `disabledDates` | `D[] \| DateFilterFn<D> \| null` | `null` |
| `disabledDaysOfWeek` | `number[]` | `[]` |
| `dateFilter` | `DateFilterFn<D> \| null` | `null` |

**Display**
| Input | Type | Default |
|---|---|---|
| `startAt` | `D \| null` | `null` |
| `startView` | `CalendarViewState` | matches `rangeGranularity` |
| `firstDayOfWeek` | `number` | locale-derived |
| `showWeekNumbers` | `boolean` | `false` |
| `showAdjacentMonths` | `boolean` | `true` |
| `numberOfMonths` | `number` | `1` |
| `monthLayout` | `'horizontal' \| 'vertical' \| 'grid'` | `'horizontal'` |
| `monthsPerRow` | `number` | `3` |
| `monthPaneDensity` | `'full' \| 'compact' \| 'name-only'` | `'full'` |
| `navigationStep` | `'single' \| 'page'` | `'single'` |
| `independentMonthNavigation` | `boolean` | `false` |
| `responsiveMonths` | `boolean` | `true` |
| `minPaneWidth` | `number` | `280` |
| `yearsPerPage` | `number` | `20` |
| `showTodayButton` | `boolean` | `false` |
| `showClearButton` | `boolean` | `false` |
| `navigationBoundaryLookahead` | `number` | `24` |
| `autoSkipEmptyPeriods` | `boolean` | `false` |

**Presets**
| Input | Type | Default |
|---|---|---|
| `presets` | `CalendarPreset<D>[]` | `[]` |
| `presetGroups` | `PresetGroup[]` | `[]` |
| `presetViolationBehavior` | `'disable' \| 'truncate' \| 'allow'` | `'disable'` |
| `closeOnPresetSelect` | `boolean` | `true` |

**Behavior**
| Input | Type | Default |
|---|---|---|
| `disabled` | `boolean` | `false` |
| `readonly` | `boolean` | `false` |
| `openOnFocus` | `boolean` | `false` |
| `closeOnSelect` | `boolean` | `true` |
| `closeOnModeChange` | `boolean` | `true` |
| `appendTo` | `'host' \| 'body' \| ElementRef` | `'body'` |
| `mobileMode` | `MobileMode` | `'auto'` |
| `resetBehavior` | `ResetBehavior` | `'full'` |

Where `MobileMode = 'overlay' \| 'fullscreen' \| 'bottom-sheet' \| 'auto'` and `ResetBehavior = 'full' \| 'value-only'`.

**Text input (applies when `CalendarInputDirective` is used)**
| Input | Type | Default |
|---|---|---|
| `virtualKeyboard` | `'show' \| 'hide' \| 'auto'` | `'auto'` |

**Persistence & Serialization**
| Input | Type | Default |
|---|---|---|
| `valueTransformer` | `CalendarValueTransformer<M, D, any> \| null` | `null` (identity, D ↔ D) |
| `stateId` | `string \| null` | `null` |

*Note on `valueTransformer` generics:* The component itself is declared `CalendarComponent<M extends CalendarMode = 'single', D = Date>`. The transformer's output type (`TOut`) is inferred from the bound transformer instance, not added as a third component generic. Signal Forms directives (§7.3) expose `TOut` as a directive generic.

*Note on `persistentStateId`:* the `localStorage`-backed counterpart of `stateId` is **not** part of the v1 input surface. Deferred to v1.1+ per §8.6 and §42.2. Consumers needing cross-session persistence in v1 must serialize `externalValue` themselves at the form boundary.

**Accessibility**
| Input | Type | Default |
|---|---|---|
| `errorAriaDescribedBy` | `string \| null` | `null` |

**i18n**
| Input | Type | Default |
|---|---|---|
| `locale` | `string` | `LOCALE_ID` |
| `intl` | `Partial<CalendarIntl>` | `{}` |
| `dateFormats` | `Partial<DateFormats>` | `{}` |

**Customization**
| Input | Type | Default |
|---|---|---|
| `dayData` | `Map<string, T>` | empty Map |
| `dayDataFn` | `(date: D) => T \| undefined` | `undefined` |
| `dayBadge` | `(date: D, data?: T) => BadgeConfig \| null` | `undefined` |
| `cellTemplate` | `TemplateRef<DayCellContext<D, T>> \| null` | `null` |
| `cellHeaderTemplate` | `TemplateRef<unknown> \| null` | `null` |
| `monthHeaderTemplate` | `TemplateRef<{ month: D }> \| null` | `null` |
| `headerTemplate` | `TemplateRef<unknown> \| null` | `null` |
| `footerTemplate` | `TemplateRef<unknown> \| null` | `null` |
| `presetTemplate` | `TemplateRef<{ preset: CalendarPreset<D> }> \| null` | `null` |
| `presetGroupTemplate` | `TemplateRef<{ group: PresetGroup }> \| null` | `null` |
| `emptyStateTemplate` | `TemplateRef<{ month: D; reason: 'all-disabled' \| 'out-of-bounds' }> \| null` | `null` |

**Debug**
| Input | Type | Default |
|---|---|---|
| `debug` | `boolean` | `false` |

### 33.2 Outputs

All outputs use `output<T>()` returning `OutputEmitterRef<T>`. Consumers subscribe via `outputRef.subscribe(fn)` or convert to Observable via `outputToObservable(outputRef)`.

| Output | Payload type |
|---|---|
| `valueChange` | `CalendarValue<M, D>` (or `TOut` when `valueTransformer` set) |
| `selectionStart` | `{ start: D }` |
| `rangePreview` | `{ start: D; tentativeEnd: D }` |
| `selectionComplete` | `CalendarValue<M, D>` |
| `selectionRestart` | `{ start: D }` |
| `selectionCleared` | `void` |
| `selectionLimitReached` | `{ limit: number; attempted: D }` |
| `viewChange` | `{ from: CalendarViewState; to: CalendarViewState; reason: 'user' \| 'programmatic' \| 'drill-down' \| 'drill-up' }` |
| `activeDateChange` | `D` |
| `monthChange` | `{ year: number; month: number }` |
| `yearChange` | `{ year: number }` |
| `opened` | `void` |
| `closed` | `void` |
| `overlayStateChange` | `CalendarOverlayState` |
| `cellClick` | `{ date: D; event: PointerEvent }` — analytics only |
| `cellHover` | `{ date: D }` — analytics only |
| `renderedMonthsCount` | `number` |
| `modeChange` | `{ from: CalendarMode; to: CalendarMode }` |

**Naming convention:**
- Internal selection clicks do not emit `cellClick`. `cellClick` is analytics only.
- `activeDateChange` is the single source of truth for focus movement. `cellFocus` does not exist.
- `monthChange` / `yearChange` fire only when the displayed period changes, not on view drill.
- `selectedPresetId` is **not** an output — it is a readonly signal (§33.3). Consumers read it reactively.

### 33.3 Readonly signals (public)

Exposed as component properties for direct reactive consumption (templates, `computed()`, `effect()`).

| Signal | Type |
|---|---|
| `overlayState` | `Signal<CalendarOverlayState>` |
| `selectionState` | `Signal<CalendarSelectionState>` |
| `activeDate` | `Signal<D>` |
| `selectedPresetId` | `Signal<string \| null>` |
| `viewState` | `Signal<CalendarViewState>` |
| `displayedMonths` | `Signal<{ year: number; month: number }[]>` — the months currently rendered |

### 33.4 Public methods

| Method | Signature |
|---|---|
| `open` | `() => void` |
| `close` | `() => void` |
| `toggle` | `() => void` |
| `focusDate` | `(date: D) => void` |
| `setView` | `(view: CalendarViewState) => void` |
| `goToDate` | `(date: D) => void` |
| `goToToday` | `() => void` |
| `clear` | `() => void` |
| `reset` | `() => void` |

### 33.5 Output API style (binding rule)

- `[REQ]` `[MUST]` All outputs use `output<T>()` returning `OutputEmitterRef<T>`. **`EventEmitter` must not appear in the public API surface.**
- `[REQ]` `[MUST]` Consumers subscribe via `outputRef.subscribe(fn)` or convert via `outputToObservable(outputRef)` from `@angular/core/rxjs-interop`.

---

## 34. Theming & Customization

### 34.1 CSS custom properties

- `[REQ]` `[MUST]` Every color, spacing, radius, font size exposed as CSS custom property.
- `[REQ]` `[MUST]` Documented theme tokens reference.
- `[REQ]` `[MUST]` No hard-coded colors in component stylesheet.

### 34.2 Dark mode

- `[REQ]` `[MUST]` Automatic via `color-scheme` + `prefers-color-scheme` + token overrides.
- `[REQ]` `[MUST]` No theme input required.

### 34.3 Forced-colors mode

- `[REQ]` `[MUST]` Full support: state indicators use `outline`/`border`, not only backgrounds.

### 34.4 Template hooks

- `[REQ]` `[MUST]` Templates exposed for: day cell (`cellTemplate`), cell header (`cellHeaderTemplate`), month header (`monthHeaderTemplate`), calendar header (`headerTemplate`), footer (`footerTemplate`), preset (`presetTemplate`), preset group (`presetGroupTemplate`), empty state (`emptyStateTemplate`). Types and defaults per §33.1.

### 34.5 Styling hooks

- `[REQ]` `[MUST]` `data-state-*` attributes on every stateful element.
- `[REC]` All styles scoped via `:host`.

### 34.6 Framework-agnostic

- `[REQ]` `[MUST]` No dependency on Tailwind, Bootstrap, or Material theming.

---

## 35. Testing Requirements (Library)

### 35.1 Coverage

- `[REQ]` `[MUST]` Unit tests per mode, per adapter, per validator.
- `[REQ]` `[MUST]` State machine tests: every transition in §8.3 and §21 in every relevant configuration.
- `[REQ]` `[MUST]` Event ordering tests per §30.2.
- `[REQ]` `[MUST]` Focus resolution tests per §17.2 — every row of the table.
- `[REQ]` `[MUST]` Overlay lifecycle tests: every row of the close-reason table (§13.5).
- `[REQ]` `[MUST]` View switching tests: selection persistence across every view transition.
- `[REQ]` `[MUST]` Multi-month tests: linked nav, responsive collapse, hover preview spanning panes, keyboard edge navigation.
- `[REQ]` `[MUST]` Integration tests per forms paradigm (Reactive, Template-driven, Signal Forms).
- `[REQ]` `[MUST]` Signal Forms typing test covering the `FieldTree<Date, string>` case.

### 35.2 Accessibility tests

- `[REQ]` `[MUST]` axe-core zero violations on default render.
- `[REQ]` `[MUST]` Screen reader matrix per §15.8.
- `[REQ]` `[MUST]` Keyboard navigation tests covering every key in §16 and pane-edge transitions in §17.4.

### 35.3 Locale/timezone edge cases

- `[REQ]` `[MUST]` DST transitions (spring forward + fall back, both hemispheres).
- `[REQ]` `[MUST]` Leap years, Feb 29.
- `[REQ]` `[MUST]` Year boundaries (Dec 31 → Jan 1).
- `[REQ]` `[MUST]` 53-week years for ISO week numbers.
- `[REQ]` `[MUST]` First-day-of-week variants (Sun/Mon/Sat).
- `[REQ]` `[MUST]` RTL layout.

### 35.4 SSR & zoneless

- `[REQ]` `[MUST]` Renders to string server-side.
- `[REQ]` `[MUST]` Hydrates without DOM mismatch warnings.
- `[REQ]` `[MUST]` Runs in zoneless app without change-detection gaps.

### 35.5 Visual regression

- `[REQ]` `[MUST]` Chromatic or Playwright coverage:
  - Every selection state (§21.6).
  - Range preview across multi-pane layouts.
  - Dark mode, RTL, forced-colors.

### 35.6 Performance regression

- `[REQ]` `[MUST]` Automated benchmarks enforcing §32 budgets in CI.

### 35.7 Stress & concurrency

Real apps have rapid or overlapping interactions. These must be exercised directly.

- `[REQ]` `[MUST]` **Rapid double-click** on a cell: second click within the same frame is a no-op. Commits are idempotent.
- `[REQ]` `[MUST]` **Rapid navigation** (click prev/next 10× in one burst): no focus loss, no UI freeze, final state deterministic.
- `[REQ]` `[MUST]` **Programmatic `writeValue` during user SELECTING**: §11.1 rules apply; tested both before and after user's second click.
- `[REQ]` `[MUST]` **Window resize during multi-month display**: responsive reflow preserves focus (§17.2) without flicker or focus-trap drop.
- `[REQ]` `[MUST]` **Held arrow key**: throttled to key-repeat rate; no event pile-up.
- `[REQ]` `[MUST]` **Overlay reopen during closing animation**: debounced per §13.7.
- `[REQ]` `[MUST]` **Constraint flip during SELECTING**: `disabledDates` changes mid-interaction; active focus moves per §17.2 row 9 (Constraint change); draft preserved if still valid, discarded with `selectionCleared` otherwise.
- `[REQ]` `[MUST]` **Mode flip during open overlay**: overlay closes per §11.2; no orphaned events.
- `[REQ]` `[MUST]` Each scenario runs 100× in CI with jitter injection; failure if any run diverges.

---

## 36. Testing Harness (for Consumers)

### 36.1 Harness

- `[REQ]` `[MUST]` Ship `CalendarHarness` built on Angular CDK `ComponentHarness`.
- `[REQ]` `[MUST]` API:
  - `open()`, `close()`, `isOpen()`
  - `getOverlayState()`
  - `selectDate(date)`, `selectRange(start, end)`
  - `getSelectedValue()`, `getFocusedDate()`
  - `getCell(date)`, `getCells(predicate)`
  - `nextMonth()`, `prevMonth()`, `setView(view)`
  - `getPresets()`, `selectPreset(id)`

### 36.2 Usage pattern

- `[REQ]` `[MUST]` Documented end-to-end example with TestBed.

### 36.3 Mocks

- `[REC]` Export `MockDateAdapter` for deterministic testing (pinnable "today").

---

## 37. Developer Experience

### 37.1 Schematics

- `[REC]` `ng add @your-org/calendar` — adds package, imports in `app.config`, registers default date adapter.
- `[REC]` `ng generate @your-org/calendar:integration` — scaffolds a working form (Reactive, Signal Forms variants).

### 37.2 Debug mode

- `[REC]` `[debug]="true"` logs state transitions, validation, view changes to console in dev mode.

### 37.3 Integration notes

- `[REC]` Recipes for `ngx-formly`, Angular Material theming alignment, plain Tailwind, PrimeNG/ng-zorro coexistence.

### 37.4 Storybook

- `[REC]` Shipped stories as reference; tokens exported in Style Dictionary or Token Studio format.

---

## 38. Versioning & Migration

### 38.1 Semver policy

- `[REQ]` `[MUST]` Semantic versioning.
- `[REQ]` `[MUST]` Public API explicitly documented; internals not under semver.
- `[REQ]` `[MUST]` Changing default value of documented input = breaking.
- `[REQ]` `[MUST]` Adding optional input = minor.
- `[REQ]` `[MUST]` Renaming/removing documented export = major.
- `[REQ]` `[MUST]` Changing event ordering (§30) = breaking.

### 38.2 Deprecation policy

- `[REQ]` `[MUST]` Deprecations for ≥ 2 major versions before removal.
- `[REQ]` `[MUST]` `@deprecated` JSDoc and TypeScript pragma.

### 38.3 Migration tooling

- `[REC]` `ng update` runs schematics migrating breaking changes where possible.
- `[REQ]` `[MUST]` Major-version migration guide documented.

---

## 39. Documentation

### 39.1 Required docs

- `[REQ]` `[MUST]` API reference per public symbol.
- `[REQ]` `[MUST]` Getting started.
- `[REQ]` `[MUST]` Recipe per forms paradigm.
- `[REQ]` `[MUST]` Recipe per selection mode.
- `[REQ]` `[MUST]` Multi-month layout guide.
- `[REQ]` `[MUST]` Customization cookbook: badges, cell templates, presets, text input composition.
- `[REQ]` `[MUST]` Accessibility statement mapping features to WCAG criteria.
- `[REQ]` `[MUST]` Theming / CSS token reference.
- `[REQ]` `[MUST]` Signal Forms typing troubleshooting page.
- `[REQ]` `[MUST]` Cross-field composition recipes.
- `[REQ]` `[MUST]` Event ordering reference (§30) for consumers writing reactive code.
- `[REQ]` `[MUST]` Error display recipes for Reactive and Signal Forms (§28.5).
- `[REQ]` `[MUST]` Migration guide between major versions.

### 39.2 Live examples

- `[REQ]` `[MUST]` Stackblitz example per selection mode and per forms paradigm.

---

## 40. Non-Functional Requirements

- `[REQ]` `[MUST]` Semantic versioning (§38).
- `[REQ]` `[MUST]` Source maps shipped.
- `[REQ]` `[MUST]` No `any` types in public API.
- `[REQ]` `[MUST]` License: MIT (recommended — confirm §43).
- `[REQ]` `[MUST]` Public changelog (Keep-a-Changelog format).
- `[REQ]` `[MUST]` Internals prefixed `_` or isolated in non-exported modules.

---

## 41. Acceptance Criteria (Flow-Level)

### 41.1 Range selection — happy path

**Given** mode = `range`, value = `{ start: null, end: null }`
**When** user clicks April 10
**Then** `selectionState = SELECTING`, `externalValue` unchanged, `internalDraftValue = { start: Apr 10 }`, events fire in order: `activeDateChange`, `selectionStart`, overlay remains open.

**Given** `selectionState = SELECTING` with draft start = Apr 10
**When** user hovers April 15
**Then** cells Apr 10–15 have `data-state` including `in-range-preview` or `range-preview-end`; `rangePreview` emitted.

**Given** `selectionState = SELECTING` with draft start = Apr 10
**When** user clicks April 15
**Then** `selectionState = COMPLETE`, `externalValue = { start: Apr 10, end: Apr 15 }`, `internalDraftValue` cleared, events fire in order: `activeDateChange`, `valueChange`, `selectionComplete`, (`closed` if `closeOnSelect`).

### 41.2 Range — backward click

**Given** SELECTING with draft start = Apr 15, `allowBackwardRange = true`
**When** user clicks April 10
**Then** COMPLETE, `externalValue = { start: Apr 10, end: Apr 15 }` (auto-swap).

### 41.3 Range — third-click restart

**Given** COMPLETE `{ start: Apr 10, end: Apr 15 }`, `rangeClickBehavior = 'restart'`
**When** user clicks April 20
**Then** SELECTING, `externalValue` unchanged, `internalDraftValue = { start: Apr 20 }`, events: `activeDateChange`, `selectionRestart`.

### 41.4 View switch during SELECTING

**Given** SELECTING draft start = Apr 10, view = `day`
**When** user clicks header to switch to `month` view
**Then** view = `month`, `internalDraftValue` preserved, April cell shows range-start-month indicator, events: `activeDateChange`, `viewChange` with reason `'user'`.

### 41.5 Programmatic disabled during open overlay

**Given** overlay open, SELECTING
**When** consumer sets `disabled = true`
**Then** overlay closes (`closed` emitted), `internalDraftValue` cleared, `selectionCleared` emitted, `onTouched` **not** called.

### 41.6 SSR hydration with timezone mismatch

**Given** server renders today as April 24 (server TZ), client resolves today as April 25 (client TZ)
**When** client hydrates
**Then** no hydration mismatch warning; "today" indicator moves to April 25 after hydration.

### 41.7 Invalid range commit

**Given** SELECTING draft start = Apr 10, `maxRangeLength = 3`, `blockInvalidRangeCommit = false`
**When** user clicks April 20
**Then** COMPLETE `{ start: Apr 10, end: Apr 20 }`, control marked with `calendarRangeTooLong`, `valueChange` and `selectionComplete` emit.

### 41.8 Multi-month keyboard edge

**Given** two linked panes showing April/May, focus on April 30, right-arrow
**When** `→` pressed
**Then** focus moves to May 1 (next pane), `activeDateChange` emitted, no navigation triggered.

**Given** two linked panes showing April/May, focus on May 31 (last pane last day)
**When** `→` pressed
**Then** next navigation triggered, panes now May/June, focus lands on June 1, events: `monthChange`, `activeDateChange`.

### 41.9 Preset revalidation

**Given** "Last 7 days" preset selected (value = Apr 17–23), `minDate` updated to Apr 20
**When** reactivity propagates
**Then** preset marked `data-state-preset-invalid`, selected value **not** mutated, control marked `calendarMinDate`, `selectedPresetId` still = `'last-7-days'`.

### 41.10 Mobile full-screen auto-mode

**Given** `mobileMode = 'auto'`, viewport width = 375 px, trigger focused
**When** user opens the overlay
**Then** overlay renders full-screen (covers viewport, respects `env(safe-area-inset-*)` per §18.6), `role="dialog"` + `aria-modal="true"` applied, focus trapped inside the dialog, `opening` → `open` sequence unchanged (§13.2), `onTouched` fires per §13.6.

**Given** same component, viewport resized to 900 px, overlay closed
**When** user reopens the overlay
**Then** overlay renders in standard positioned form (CDK Overlay with fallback positions per §14.2). Breakpoint evaluated at open time; already-open overlays do not re-layout on resize.

---

## 42. Out of Scope

### 42.1 Deferred to v2 (sibling component)
- Interactive schedule mode with first-class events.
- Drag-to-create, drag-to-resize event interactions.
- Multi-day event bars.

### 42.2 Deferred to future version
- Time-of-day selection / datetime picker.
- Multi-range selection (multiple disjoint ranges).
- Week selection (selecting entire weeks as units).
- Recurring selection patterns ("every Tuesday in May").
- Non-Gregorian calendar adapters (Hebrew, Islamic, Buddhist, Japanese) — v2+ (§19.5).
- Partial-day / half-day selection.
- `persistentStateId` — `localStorage`-backed re-mount persistence. Deferred to v1.1+ pending stable `valueTransformer`, cache-invalidation strategy, and consent model (§8.6).
- `DateFnsDateAdapter` — deferred to v1.1 pending `date-fns` v3 / `date-fns-tz` API stabilization (§20.4).
- `TemporalDateAdapter` — deferred to v1.1 pending broader browser support and polyfill maturity (§20.4).

### 42.3 Explicitly WONT

- **Drag-to-select selection** (click-and-drag across cells to define a range): not supported in v1 or v2. Rationale: poor mobile UX (competes with scrolling), accessibility burden (no keyboard equivalent), and the click-click range pattern is the established industry standard. Consumers who want this must build it externally.
- **Time-of-day entry combined with date selection**: not supported in this component. A separate `datetime-picker` component is a candidate for a future release.
- **Server-side storage of user preferences**: out of scope.
- **Analytics collection**: out of scope. Consumers wire their own via `cellClick`/`viewChange`.
- **Third-party calendar sync (Google Calendar, Outlook)**: out of scope.

---

## 43. Remaining Decisions

Resolved in v2.4 and moved into the spec body (see `docs/calendar-plan_decisions.md`):
- Angular 21-only floor → §3.
- `@angular/cdk` as a required peer → §3.
- Shipped v1 adapters (native + Luxon; date-fns + Temporal in v1.1) → §20.4.
- Mobile full-screen in v1 with `mobileMode: 'auto'` default → §18.5, §33.1.
- `persistentStateId` deferred to v1.1+; in-memory `stateId` retained in v1 → §8.6, §42.2.
- Non-Gregorian adapters deferred to v2+ → §19.5, §42.2.
- Event / schedule Layer 3 deferred to v2 sibling → §24.3, §42.1.

The following decisions remain open:

1. **Input masking default**: on or off?
   *Recommendation: off by default, opt-in per instance.*

2. **License**: MIT?
   *Recommendation: confirm MIT.*

3. **Schematics & `ng add`**: v1 or v1.1?
   *Recommendation: v1.1. Ship core first.*

4. **Shipped locale defaults for `CalendarIntl`**: which locales beyond English in v1?
   *Recommendation: de, fr, es, pt, ja.*

5. **`blockInvalidRangeCommit`**: ship in v1 or v1.1?
   *Recommendation: v1.1. Default behavior (allow commit, mark invalid) covers most consumers.*

6. **`selectedPresetId` signal semantics**: track only first-time preset selection, or continuously re-compute if current value matches a preset's computed range?
   *Recommendation: track only explicit selection (consumer sets a preset); don't auto-match. Auto-matching is brittle (preset values drift with "today").*

7. **`valueTransformer` as v1 requirement**: ship in v1 or v1.1?
   *Recommendation: v1 `SHOULD`. Ship the API and the two built-in transformers (`isoStringTransformer`, `timestampTransformer`). Real form integrations hit this constraint within the first day. `DATE_SERIALIZATION` token can follow in v1.1.*

8. **`autoSkipEmptyPeriods` default**: false (explicit no-op) or true (silent skip)?
   *Recommendation: `false`. Silent skip can leapfrog past months the user expected to see, which is more confusing than a disabled button.*

9. **`navigationBoundaryLookahead` default**: 24 periods is pragmatic but arbitrary.
   *Recommendation: 24 periods (2 years in day view) based on the 24-month search limit already established in §13.3. Keeps the numbers consistent.*
