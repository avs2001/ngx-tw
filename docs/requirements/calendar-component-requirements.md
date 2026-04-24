# Calendar Component — Requirements Specification v2.6

> Angular 21 library component supporting single, multiple, and range date selection with full forms integration (Reactive, Template-driven, Signal Forms), multi-month display, and rich cell customization.

**Changes in v2.6** — Internal-consistency audit reconciliation. Resolved nine critical contradictions: `presetViolationBehavior` union (§25.2 = §33.1 = `'disable' | 'hide' | 'warn'`), mode-change emit order aligned (§11.2 follows §8.3: `selectionCleared → presetChange → modeChange → valueChange`), `overlayState` signal nullability widened to `Signal<CalendarOverlayState | null>` (§33.3, §14.1), year-view "virtual rendering" re-described as per-pane OnPush CD islands (§23.4 ↔ §32.3), `virtualKeyboard: 'auto'` semantics pinned (§9.5, §33.1), `rangeSeparator` default pinned to `' – '` (§9.2.1, §33.1), `PresetGroup` `<D>` generic dropped throughout (§7.4, §25.1, §33.1), `selectionComplete` payload restructured as `{ value; reason }` for non-range modes (§33.2), initial-focus auto-skip gated on `autoSkipEmptyPeriods` (§13.3 ↔ §12.6), `activeDate` signal typed as `Signal<D | null>` (§33.3). Stale cross-references fixed: §43 decision-number callouts in §33.1, "row 9" references in §22.3 and §35.7 replaced with row names, schematics tagged `v1.1` (§37.1). Structural cleanup: duplicate §15.4 deleted, §33.4 `serializeCalendarValue` re-tagged `[REQ] [MUST]`, §9.3 mask classifications unified, §11.5 / §11.7 re-tagged `[WONT] v1`. Gaps closed: `timezone` input vs. `TZ_OVERRIDE` precedence (§4.3, §33.1), `selectionCleared.reason` mapping for every §13.5 close-path, missing §8.3 row for SELECTING-shaped `writeValue` rejection, §29.1 warning list extended, preset-scroll multi-month behavior (§25.2), `CalendarPreset.disabled` context widened (§25.1), §28 `aria-invalid` target in inline mode, §32.2 budgets for constraint-tightening and disabled-flip paths, two-input range SELECTING at form level (§9.4 / §26).

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
- `[REQ]` `[MUST]` **Precedence between the per-instance `timezone` input (§33.1) and the `TZ_OVERRIDE` DI token:** the component input **wins** for that component instance; unset instances fall back to `TZ_OVERRIDE`; adapters with neither set use `adapter.getTimezone()`. Floating adapters ignore both sources and log a dev-mode warning once per component instance if either is set.

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
- `[REQ]` `[MUST]` `dirty` is the **form control's** dirty flag (not a component output or signal). The component triggers the form's `markAsDirty()` implicitly via the first user-initiated `valueChange`. Programmatic `writeValue` does not mark the control dirty.
- `[REQ]` `[MUST]` `required` validation is mode-aware:
  - single: value non-null.
  - multiple: array non-empty. Note: an empty array (`[]`) is both the "never selected" and the "user cleared" state — `required` cannot distinguish them; consumers who need the distinction must track it via the form control's `dirty`/`touched` flags alongside `value`.
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
CalendarPreset<D>, PresetGroup
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
| SELECTING | programmatic `writeValue({start: D, end: null})` (SELECTING-shaped) | EMPTY | unchanged (rejected) | cleared | `selectionCleared` ({reason: 'programmatic'}); control marked `calendarInvalidValue` per §11.1 |
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
- `[REQ]` `[MUST]` Unparseable: control marked `calendarParseError`; `externalValue` becomes `null`; the raw string is retained on the input's native `value` property and in the `calendarParseError` error payload. It is **not** preserved on `externalValue` (which must remain `D`-shaped per §7.1).

#### 9.2.1 Per-mode parse strategy

- `[REQ]` `[MUST]` **Single mode:** one input, one value. `adapter.parse(value, formats)` returns `D | null`.
- `[REQ]` `[MUST]` **Multiple mode:** one input, comma-delimited list. Default separator `,` (configurable via `multipleSeparator` input); whitespace trimmed around each entry; empty entries ignored. Any single entry that fails to parse fails the whole input with `calendarParseError`.
- `[REQ]` `[MUST]` **Range mode, single input:** `{start} – {end}` form with an en-dash or hyphen separator (configurable via `rangeSeparator`; default `' – '` — space, en-dash, space). Parsing trims whitespace around each endpoint before delegating to `adapter.parse`. Both endpoints must parse; either-one-empty is treated as an incomplete draft (no `valueChange`).
- `[REQ]` `[MUST]` **Range mode, two inputs (§9.4):** each input parses independently. Range commits (`selectionComplete` + `valueChange`) when both inputs have valid parse and `end ≥ start` (or `allowBackwardRange=true` with auto-swap). Until both sides are valid, only `internalDraftValue` is updated.

### 9.3 Input masking

- `[REC]` `[COULD]` Opt-in input mask for the default locale format. **Default: off** (per §43 resolved decision #1). Configurable and disablable per instance.
- `[REQ]` `[MUST]` When masking is enabled, it must be compatible with paste and autofill.
- `[REQ]` `[MUST]` **IME composition:** the mask is suspended between `compositionstart` and `compositionend` events. Parse runs only after `compositionend` to avoid racing with the IME.

### 9.4 Range with two inputs

- `[REQ]` `[SHOULD]` Two separate inputs supported via two directive instances sharing the calendar.
- `[REQ]` `[MUST]` Focus moves start → end on start commit.
- `[REQ]` `[MUST]` Either input can open the calendar; SELECTING state syncs with focused input.
- `[REQ]` `[MUST]` Range commit fires `selectionComplete` + `valueChange` once both inputs have valid parse and the resulting range satisfies `end ≥ start` (auto-swap if `allowBackwardRange=true`). See §9.2.1.
- `[REQ]` `[MUST]` **SELECTING state with shared calendar + two inputs:** when the first input has a valid parse and the second does not, `selectionState = 'SELECTING'` and `internalDraftValue = { start }`. The picker's grid renders preview highlighting driven by `internalDraftValue` exactly as for a click-driven range. When instead the two inputs are bound to **two separate `FormControl`s** (§26.1), there is no calendar-level SELECTING state — each control commits independently; the "only start filled" intermediate surfaces as a parent-group validator error rather than a calendar-internal state.

### 9.5 Virtual keyboard (mobile)

- `[REQ]` `[MUST]` Tapping the input opens the calendar by default and suppresses the virtual keyboard. Configurable on the `CalendarInputDirective`: `virtualKeyboard: 'show' | 'hide' | 'auto'`. (This input lives on the input directive, not on the calendar component; see §33.1 for the component inputs list.)
- `[REQ]` `[MUST]` **`virtualKeyboard` value semantics:**
  - `'show'` — always show the virtual keyboard on focus; the calendar does not auto-open.
  - `'hide'` — always suppress the virtual keyboard and auto-open the calendar on focus.
  - `'auto'` (default) — suppress the virtual keyboard and auto-open the calendar when the focus event's `pointerType` is `'touch'` or when no pointer is available (programmatic focus on mobile viewports per §18.5); otherwise behave like `'show'`. The discriminator is the pointer type of the most recent interaction, tracked via the `pointerdown`/`focus` pair.
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
  | 'calendarInvalidValue';   // { expected: 'single' | 'multiple' | 'range'; actual: unknown; reason: 'shape' | 'transformer' }
```

> **Interaction-only rejections (no error codes).** `allowSingleDayRange=false` (clicking the same cell as draft start) and `disableRangesCrossingDisabledDates=true` (click past a disabled cell) are **click no-ops with invalid-flash visual feedback**. They do NOT produce form-level error codes. Consumers who need to surface these to users must observe the corresponding rejected-interaction patterns in the DOM (`data-state-invalid-flash`) or subscribe to `rangePreview`'s `invalidPreview` flag (§8.3).

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
- `[REQ]` `[MUST]` `selectionCleared({reason: 'programmatic'})` fires before the form's `valueChange` propagates back.
- `[REQ]` `[MUST]` If the programmatic value is SELECTING-shaped (`{ start: D, end: null }` in range mode), it is rejected as `calendarInvalidValue` per §11.6; the existing draft is discarded and the control is marked invalid.
- `[REQ]` `[MUST]` **Retained-draft interaction** (when `persistPartialRange=true` and overlay is closed): a programmatic `writeValue` while a draft is retained behind a closed overlay discards the draft and fires `selectionCleared({reason: 'programmatic'})` immediately. The draft will not re-appear on next open.

### 11.2 Mode change at runtime

- `[REQ]` `[MUST]` Clears value to the empty state for the new mode.
- `[REQ]` `[MUST]` Emits in canonical order (matches §8.3 and §30.2):
  1. `selectionCleared` ({reason: `'mode-change'`}) — only if a value was previously held
  2. `presetChange(null)` — only if `selectedPresetId` was set
  3. `modeChange`
  4. `valueChange` (empty for the new mode)
- `[REQ]` `[MUST]` Closes overlay if open (when `closeOnModeChange: true`, default); the `closed` event fires after `valueChange` per §13.7 invariants.

### 11.3 `disabled` flipped to true while overlay is open

- `[REQ]` `[MUST]` Overlay closes immediately.
- `[REQ]` `[MUST]` Any pending SELECTING state is cleared.
- `[REQ]` `[MUST]` `onTouched` is **not** called.

### 11.4 Constraints tightened (minDate, maxDate, disabledDates change)

- `[REQ]` `[MUST]` Existing value revalidated.
- `[REQ]` `[MUST]` Value **never** auto-mutated; control marked invalid instead.
- `[REQ]` `[MUST]` If focused date becomes disabled, focus moves to nearest enabled date in same month (§17.2).

### 11.5 `dayData` change mid-hover

- `[REQ]` `[MUST]` Hover state and range preview preserved; only cell rendering updates.
- `[REQ]` `[MUST]` No flicker: data delivered via single signal update, not unmount/remount.
- `[WONT]` **v1:** `events` is not a v1 input. Event/schedule layer is deferred to the v2 sibling component per §42.1; the picker ships with `dayData` + `dayBadge` + `cellTemplate` as the extensibility ceiling (§24.3).

### 11.6 `mode` mismatch with `value` shape

- `[REQ]` `[MUST]` Programmatic value with wrong shape: control marked `calendarInvalidValue`, value preserved, dev warning.

### 11.7 Adapter change at runtime

- `[WONT]` **v1:** runtime adapter swap is not supported. The `DateAdapter` is set at injector level and is constant for the component lifetime.
- `[REQ]` `[MUST]` If `DateAdapter` is re-provided at a scope containing a live `CalendarComponent`, the component throws a dev-mode error on its next change-detection cycle. Production behavior is undefined. Consumers must destroy and recreate the component to change adapters.

### 11.8 `interaction` mode change at runtime

- `[REQ]` `[COULD]` Switching `interaction` between `'inline'` and `'overlay'` at runtime. If supported:
  - `'inline' → 'overlay'`: inline DOM is removed; overlay DOM is created lazily on first open; committed `externalValue` is preserved; `internalDraftValue` is discarded.
  - `'overlay' → 'inline'`: overlay (if open) is closed per §13.4; inline DOM is mounted; committed `externalValue` is preserved; `internalDraftValue` is discarded.
- `[REQ]` `[MUST]` If not supported (simpler implementation), dev-mode warning; production: component may render both or neither — undefined.

---

## 12. Display & Navigation

### 12.1 Views

- `[REQ]` `[MUST]` Three views: `day`, `month`, `year`.
- `[REQ]` `[MUST]` Configurable `startView`.
- `[REQ]` `[MUST]` `viewChange` event with `{ from, to, reason }`.

### 12.2 Day view

- `[REQ]` `[MUST]` Grid column count = `adapter.getDaysInWeek()`. All shipped v1 adapters return 7; v1 guarantees correct rendering and tested CSS at 7. Non-7 support is a `[REC]` forward-compatibility posture for future non-Gregorian adapters (§19.5) — the contract accepts non-7 return values but v1 does not validate them.
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
- `[REQ]` `[MUST]` The check scans up to the `minDate`/`maxDate` boundary. When `minDate` or `maxDate` is unbounded, the check is limited to a configurable `navigationBoundaryLookahead: number` (default `24` periods, resolved per §43) — beyond that limit, the button remains enabled (pragmatic tradeoff: don't pay unbounded scan cost).
- `[REQ]` `[MUST]` Applies at every view level: day view checks previous/next month, month view checks previous/next year, year view checks previous/next 20-year page.
- `[REQ]` `[MUST]` Disabled nav buttons get `aria-disabled="true"` and are removed from the tab order.
- `[REQ]` `[MUST]` Re-evaluated whenever constraints change (reactive to input updates).
- `[REQ]` `[MUST]` `navigationStep` × dead-end interaction: dead-end prevention checks the **destination period only**, not intermediate periods. If `navigationStep > 1`, a single button press that lands in an enabled period succeeds even when skipped-over periods are fully disabled.

**Keyboard parity:**
- `[REQ]` `[MUST]` `PageUp`/`PageDown`/`Shift+PageUp`/`Shift+PageDown` respect the same dead-end logic — press becomes a no-op if navigation is blocked.
- `[REQ]` `[MUST]` Arrow-key pane-crossing (§17.4) respects the rule: pressing `→` at the last enabled date with no further enabled dates within the lookahead is a no-op.

**Handling an already-empty month:**

It's still possible to land in an entirely-disabled month — e.g., constraints tightened after navigation, or a user provided a `startAt` that falls in a disabled period. For this case:
- `[REQ]` `[MUST]` An empty-state message is rendered in place of the grid via `emptyStateTemplate: TemplateRef` input.
- `[REQ]` `[MUST]` Default template: localized text "No available dates in this month" (from `CalendarIntl`).
- `[REQ]` `[MUST]` The empty-state element is focusable (`tabindex="0"`) with accessible name matching the message, so screen reader users can perceive the state.
- `[REQ]` `[MUST]` When the grid is fully disabled, the empty-state element becomes the **initial focus target** per §13.3 (step 4's "first enabled cell" fallback resolves to the empty-state element instead, since no grid cell is available).
- `[REQ]` `[MUST]` If `minDate`/`maxDate` are both defined and the displayed period is outside their range, an adjacent-direction hint button ("Go to nearest available date") is offered.
- `[REC]` When navigation is initiated and the destination would be empty, the component may auto-skip to the next non-empty period within the lookahead window. Controlled by `autoSkipEmptyPeriods: boolean` (default `false`, resolved per §43 — explicit navigation is usually safer than implicit skip).
- `[REQ]` `[MUST]` When `autoSkipEmptyPeriods=true` and a skip occurs: `viewChange` fires once with the final destination period; `monthChange` (or the view-appropriate equivalent) fires once; the skip is announced to the live region ("Skipped {N} periods to {destination}" per `CalendarIntl.skipAnnouncement`). If no destination is found within `navigationBoundaryLookahead`, the button remains disabled and no events fire.

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
  4. Else focus first enabled cell in displayed month. If grid is fully disabled, focus the empty-state element (§12.6).
- `[REQ]` `[MUST]` **Auto-skip from a fully-disabled initial month is gated on `autoSkipEmptyPeriods`** (default `false`, §12.6). When `autoSkipEmptyPeriods=false`, focus remains on the empty-state element for the initially-displayed month — even if the next month has enabled cells. When `autoSkipEmptyPeriods=true`, the component navigates to the next month with enabled cells — capped at `navigationBoundaryLookahead` periods (default `24`; configurable per §12.6) — and focuses the first enabled cell there; if the lookahead is exhausted, focus remains on the empty-state element of the originally-displayed month and `monthChange` / `viewChange` do NOT fire.

### 13.4 Close sequence

Triggered by: outside click, Escape, selection commit + `closeOnSelect`, programmatic `close()`, `disabled=true`, scroll dismissal (CDK Overlay `scrollStrategy: 'close'`), focus loss from overlay, form reset (§6.5), adapter change (§11.7), constraint tightening that invalidates the draft, mobile back-button / hardware dismissal.

Order of operations:
1. `overlayState = 'closing'`.
2. Commit/discard rules applied (§13.5).
3. `valueChange` emitted (if commit); form write propagated.
4. `selectionComplete` / `selectionCleared` emitted.
5. Focus trap released.
6. Animation plays out.
7. Overlay detached from DOM.
8. `closed` event emitted.
9. `overlayState = 'closed'`.
10. Focus returned to trigger (unless trigger unmounted).
11. `onTouched` called if user-initiated (§13.6).

> **Invariant.** In any sequence where both `valueChange` and `closed` fire, `valueChange` strictly precedes `closed`. This mirrors the CVA convention `onChange → onTouched → blur` that consumers rely on.

### 13.5 Commit vs discard on close

Every `selectionCleared` cited below carries a `reason` from the §33.2 payload union (`'user' | 'programmatic' | 'mode-change' | 'reset' | 'disabled'`). The mapping is authoritative; consumers relying on `reason` can use the values in this column verbatim.

| Close reason | `selectionState` before | Effect on draft / value | `selectionCleared.reason` | `closed` emitted? | `onTouched` emitted? |
|---|---|---|---|---|---|
| Outside click | EMPTY | No change | — | ✓ | ✓ |
| Outside click | SELECTING | Discard draft if `persistPartialRange=false`; else keep | `'user'` (only if draft discarded) | ✓ | ✓ |
| Outside click | COMPLETE | No change | — | ✓ | ✓ |
| Escape | EMPTY | No change | — | ✓ | ✓ |
| Escape | SELECTING | Discard draft (regardless of `persistPartialRange`); emit `selectionCleared` if draft existed | `'user'` | ✓ | ✓ |
| Escape | COMPLETE | No change | — | ✓ | ✓ |
| `closeOnSelect` commit | COMPLETE | Commit happened synchronously; `valueChange`, `selectionComplete` fire before `closed` | — | ✓ | ✓ |
| Programmatic `close()` | SELECTING | Discard draft | `'programmatic'` | ✓ | ✗ (programmatic) |
| Programmatic `close()` | COMPLETE / EMPTY | No change | — | ✓ | ✗ |
| `disabled=true` | SELECTING | Discard draft | `'disabled'` | ✓ | ✗ |
| `disabled=true` | COMPLETE / EMPTY | No change | — | ✓ | ✗ |
| Form reset (§6.5) | any | Discard draft; form writes new value; emit `selectionCleared` only if a value was previously held | `'reset'` | ✓ | ✗ |
| Scroll dismissal | any | Treated as outside click — discard draft per `persistPartialRange` | `'user'` (only if draft discarded) | ✓ | ✓ |
| Focus loss from overlay | any | Treated as outside click | `'user'` (only if draft discarded) | ✓ | ✓ |
| Adapter change at runtime | any | Dev error; overlay force-closed; draft discarded; no events guaranteed | — (no events guaranteed) | — | ✗ |
| Constraint tightening invalidates draft | SELECTING | Discard draft | `'programmatic'` | ✓ | ✗ |
| Mobile back-button / hardware dismissal | any | Treated as Escape | `'user'` (only if draft discarded) | ✓ | ✓ |
| Trigger unmount | any | Discard draft; **exception to the paired-events invariant** — no `closed` fires (consumer never subscribed) | — | ✗ | ✗ |

### 13.6 Form interaction timing

- `[REQ]` `[MUST]` `onTouched` fires **once** when:
  - Overlay closes via user action (outside click, Escape, commit), OR
  - Inline calendar loses focus to an element outside its DOM, OR
  - Trigger loses focus to an element outside both trigger and overlay.
- `[REQ]` `[MUST]` `onTouched` **never** fires for programmatic close, `disabled` close, form reset, adapter change, or trigger unmount (see §13.5 table).
- `[REQ]` `[MUST]` `dirty` (the form control's flag, see §6.4) is set on the first `valueChange` caused by user action. Semantics across modes:
  - **Overlay mode:** first `valueChange` caused by user action within the component instance's lifetime (not scoped to a single overlay session — `dirty` persists across overlay re-opens).
  - **Inline mode:** first `valueChange` caused by user action (no overlay lifetime boundary applies).
  - **Form reset:** clears `dirty` per §6.5 (form-owned state).

### 13.7 Invariants

- `[REQ]` `[MUST]` `opened` and `closed` are paired: every `opened` is followed by exactly one `closed` **except** trigger-unmount (§13.5), which fires neither.
- `[REQ]` `[MUST]` `closed` fires before focus returns to the trigger; focus returns before any follow-on user action can cause a re-open.
- `[REQ]` `[MUST]` Re-opening during a `closing` phase is debounced: the new `open()` call is queued in a single-slot buffer (only the latest wins) and executes after `overlayState === 'closed'`.
- `[REQ]` `[MUST]` `openOnFocus` (§14.2) is suppressed for one focus tick after close to prevent an Escape → focus-return → re-open loop.
- `[REQ]` `[MUST]` Runtime `appendTo` changes close the overlay first (as if programmatic `close()`; §13.5 "Programmatic `close()`" row governs draft discard and events), then apply on next open. §8.3's selection-state transitions are unaffected — `appendTo` is an overlay-lifecycle concern only.

---

## 14. Interaction Modes

### 14.1 Inline

- `[REQ]` `[MUST]` Always-visible; no overlay.
- `[REQ]` `[MUST]` Selection emits immediately; no apply button unless a footer template provides one.
- `[REQ]` `[MUST]` `overlayState` signal returns `null` in inline mode (the signal type is `Signal<CalendarOverlayState | null>` per §33.3). Sections of §13 that apply: §13.6 (focus-loss `onTouched` via component blur); §13.7 invariants apply vacuously (no `opened`/`closed` fire).

### 14.2 Overlay

- `[REQ]` `[MUST]` CDK Overlay positioning with fallback positions.
- `[REQ]` `[MUST]` Opens on: trigger click, `Alt+↓` on trigger.
- `[REC]` `openOnFocus: boolean` optional (default `false`). When enabled, opening is debounced against close per §13.7 to avoid re-open loops.
- `[REQ]` `[MUST]` Closes on: outside click, Escape, selection commit (see `closeOnSelect` defaults below).
- `[REQ]` `[MUST]` `closeOnSelect` defaults are mode-derived: `true` in single mode; `false` in multiple and range modes. Consumers may override per instance.
- `[REQ]` `[MUST]` `appendTo: 'host' | 'body' | ElementRef`.
- `[REQ]` `[MUST]` Full lifecycle per §13.
- `[REQ]` `[MUST]` `Alt+↓` on a focused trigger while overlay is already open is a no-op (idempotent).

### 14.3 Mobile full-screen

The component ships in v1 with adaptive mobile presentation. Default behavior switches between desktop overlay and mobile full-screen/bottom-sheet based on viewport. See §18.5 for the full responsive-mode specification.

- `[REQ]` `[MUST]` `mobileMode: 'auto' | 'overlay' | 'fullscreen' | 'bottom-sheet'` input. Default `'auto'`.
- `[REQ]` `[MUST]` `'auto'` resolves at runtime (not SSR): desktop viewports (`≥ 600px`) render as overlay; mobile viewports render as full-screen or bottom-sheet per §18.5. On SSR, `'auto'` always resolves to overlay — mobile presentation is a client-only decision made post-hydration via `matchMedia('(max-width: 600px)')`.
- `[REQ]` `[MUST]` `'bottom-sheet'` positioning: pinned to viewport bottom; swipe-down gesture dismisses (treated as Escape); respects iOS/Android safe-area insets per §18.6.

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
| 2.4.11 Focus Not Obscured (Minimum) | Overlay positioning never hides the focused trigger beneath the panel; CDK `flexibleConnectedPositionStrategy` with fallback positions |
| 2.5.5 Target Size (Enhanced) | `[REC]` 44×44 CSS px on mobile viewports |
| 2.5.7 Dragging Movements | Drag-selection is explicitly not shipped in v1 (§42.3); all range selection works via discrete taps/clicks |
| 2.5.8 Target Size (Minimum) | Cell hit targets ≥ 24×24 CSS px |
| 3.3.1 Error Identification | Validation errors expose `aria-invalid` + message |
| 4.1.2 Name, Role, Value | All interactives have accessible names |
| 4.1.3 Status Messages | Live regions for view/range changes |

### 15.3 Structural ARIA

- `[REQ]` `[MUST]` Calendar grid: `role="grid"`, labeled by the visible month/year header via `aria-labelledby`; `aria-rowcount` and `aria-colcount` set (rowcount = weeks rendered, colcount = `adapter.getDaysInWeek()`).
- `[REQ]` `[MUST]` Rows: `role="row"`.
- `[REQ]` `[MUST]` Day cells: `role="gridcell"`.
  - **Single / multiple modes:** `aria-selected="true"` on selected cells.
  - **Range mode:** `aria-selected="true"` on both endpoints AND on cells inside the range; accessible name distinguishes "range start" / "range end" / "in range".
- `[REQ]` `[MUST]` Today's cell: `aria-current="date"`.
- `[REQ]` `[MUST]` Day column headers: `role="columnheader"` with `abbr`.
- `[REQ]` `[MUST]` Disabled cells: `aria-disabled="true"`; CAN receive roving focus (`tabindex="0"` when `activeDate`), but Enter/Space is a no-op and no commit event fires.
- `[REQ]` `[MUST]` Out-of-month cells: `aria-hidden="true"` unless interactive.
- `[REQ]` `[MUST]` **Focus pattern:** the grid uses **roving-tabindex** — the cell matching `activeDate` has `tabindex="0"`, all others have `tabindex="-1"`. `aria-activedescendant` is NOT used (and must not be added); the two patterns are mutually exclusive.
- `[REQ]` `[MUST]` Prev/Next navigation buttons: accessible name from `CalendarIntl` (e.g., "Previous month", "Next year"). `aria-label` is sourced from `CalendarIntl`, never hardcoded.
- `[REQ]` `[MUST]` Header (month/year title): `aria-live="polite"` wrapper; content updates announce the new period.

### 15.4 Overlay / dialog mode

- `[REQ]` `[MUST]` `role="dialog"`, `aria-modal="true"`, labeled by header.
- `[REQ]` `[MUST]` `aria-describedby` pointer to the keyboard-help element (§16.4), when rendered.
- `[REQ]` `[MUST]` Focus trap while open.
- `[REQ]` `[MUST]` Focus returns to trigger on close (§13.4).
- `[REQ]` `[MUST]` Trigger accessible name updates with selected value.

### 15.5 Live regions

- `[REQ]` `[MUST]` Month/year header: `aria-live="polite"` — navigation announces new period.
- `[REQ]` `[MUST]` Range selection commits: `role="status"` (polite) — "Start date selected" / "End date selected".
- `[REQ]` `[MUST]` During SELECTING, focus movement announces tentative range length (polite, debounced 150ms to avoid flooding).
- `[REQ]` `[MUST]` Individual arrow-key day navigation within the same month does NOT announce (too verbose); only period changes (month/year/view) announce.
- `[REQ]` `[MUST]` Announcements pluralization-aware via `CalendarIntl` (§19).

### 15.6 Cell accessible names

- `[REQ]` `[MUST]` Full localized date + state. Canonical template: `{long date} · {selection role}[ · {state flags}][ · {badge summary}]` where each segment comes from `CalendarIntl` and is joined by the locale's list separator. Omitted segments are fully elided (no trailing separator). The badge summary is present only when the cell has a `BadgeConfig` from §24.3 Layer 1 with a `count > 0` or a non-empty `label`. Example (with badge): "Tuesday, 15 March 2026, range start, 3 items"; without badge: "Tuesday, 15 March 2026, range start".
- `[REQ]` `[MUST]` `aria-label` for dynamic state; `aria-labelledby` for stable static references.
- `[REQ]` `[MUST]` Consumers override the template via `CalendarIntl.cellAccessibleName: (ctx: DayCellContext<D>) => string` — `CalendarIntl` ships the default.

### 15.7 Visual accessibility

- `[REQ]` `[MUST]` Focus indicator uses `outline`/`border` (visible in forced-colors mode).
- `[REQ]` `[MUST]` `prefers-reduced-motion`: disables view transitions and cell animations; selection/preview remain instant.
- `[REQ]` `[MUST]` Min touch target 24×24 CSS px; `[REC]` 44×44 mobile.

### 15.8 Screen reader test matrix

- `[REQ]` `[MUST]` Tested on the latest release of each AT at the time of each library minor release:
  - NVDA + Firefox (Windows)
  - JAWS + Chrome (Windows)
  - VoiceOver + Safari (macOS)
  - VoiceOver + Safari (iOS)
  - TalkBack + Chrome (Android)
- `[REQ]` `[MUST]` "Critical issue" = any defect that prevents a screen reader user from completing the task the calendar is designed for (selecting a date / range, navigating views, dismissing the overlay). Non-critical issues (verbosity, announcement phrasing) are tracked but do not block release.
- `[REQ]` `[MUST]` Zero critical issues on any combination before release.

---

## 16. Keyboard Interaction

### 16.1 Day view

| Key | Action |
|---|---|
| `←` / `→` | Previous / next day (in RTL, logical prev/next per §19.3 — `→` is logically previous) |
| `↑` / `↓` | Previous / next week |
| `Home` / `End` | First / last day of week (respects `firstDayOfWeek`) |
| `PageUp` / `PageDown` | Previous / next month |
| `Shift+PageUp` / `Shift+PageDown` | Previous / next year |
| `Ctrl+Home` | Focus today (if within constraints; no-op otherwise) |
| `Enter` / `Space` | Select focused date (no-op if cell is `aria-disabled`) |
| `Escape` | Close overlay (if open); no-op inline |
| `Tab` / `Shift+Tab` | Next/previous focusable in dialog (overlay) or component (inline); Tab cycles only within the grid's focusable set — the active cell |

### 16.2 Month view

| Key | Action |
|---|---|
| `←` / `→` | Previous / next month |
| `↑` / `↓` | Three months up / down |
| `Home` / `End` | January / December of current year |
| `PageUp` / `PageDown` | Previous / next year |
| `Shift+PageUp` / `Shift+PageDown` | Previous / next decade |
| `Ctrl+Home` | Focus the month containing today (if within constraints) |
| `Enter` | Drill into day view for that month |
| `Space` | Commit month (when `rangeGranularity='month'` or `mode='month'`); else drill into day view |
| `Escape` | Close overlay (if open); no-op inline |
| `Tab` / `Shift+Tab` | Same as day view |

### 16.3 Year view

| Key | Action |
|---|---|
| `←` / `→` | Previous / next year |
| `↑` / `↓` | Four years up / down (assumes 20-year grid with 5 columns; scales with `yearsPerPage`) |
| `Home` / `End` | First / last year of current decade page |
| `PageUp` / `PageDown` | Previous / next decade |
| `Shift+PageUp` / `Shift+PageDown` | Previous / next century |
| `Ctrl+Home` | Focus the year containing today (if within constraints) |
| `Enter` | Drill into month view |
| `Space` | Commit year (when `rangeGranularity='year'` or `mode='year'`); else drill into month view |
| `Escape` | Close overlay (if open); no-op inline |
| `Tab` / `Shift+Tab` | Same as day view |

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
| year → month (drill-down) | Focus the month previously drilled from when available; else first enabled month of drilled year |
| prev/next navigation (day view) | Same day-of-month in new month; if non-existent (Jan 31 → Feb), last day of new month |
| prev/next navigation (month view) | Same month in new year; if `autoSkipEmptyPeriods=true` and landing period is empty, apply the §12.6 skip rule |
| prev/next navigation (year view) | Same year-of-decade in new decade page |
| Pane shift (multi-month, programmatic / click) | Focus unchanged unless it leaves rendered range; then focus equivalent day in nearest rendered month — see §17.4 for arrow-driven shifts |
| Programmatic `writeValue` | See §17.3 |
| Constraint change | If focus becomes disabled, focus nearest enabled date in same month; if whole month disabled, navigate to next month with enabled dates within `navigationBoundaryLookahead`; if exhausted, focus remains and empty-state template takes over |
| Mode change | Focus resets to first enabled cell of current month (value cleared per §11.2). Mode-change focus reset takes **precedence** over the `writeValue` cascade that §11.2 implies — the cascade is suppressed. |
| Locale / `firstDayOfWeek` / RTL flip | Focus preserved on the same date if still rendered |
| Adapter swap (dev-only; §11.7) | Dev-mode error; production undefined |
| Responsive reflow | Focus preserved on the same date if still rendered |

### 17.3 Focus after programmatic `writeValue`

- `[REQ]` `[MUST]` If the written value is **within the currently displayed month(s)**, focus does **not** move.
- `[REQ]` `[MUST]` If the written value is **outside** the displayed range and the overlay is **open**, the calendar navigates to the written value's month and focuses it.
- `[REQ]` `[MUST]` If the overlay is **closed**, no focus change; the new displayed month applies on next open.
- `[REQ]` `[MUST]` `writeValue` **during SELECTING**: draft is discarded (per §11.1); focus moves to the written value (if within displayed range) or the committed value's month (if outside and overlay is open). `selectionCleared({reason: 'programmatic'})` fires before focus moves.
- `[REQ]` `[MUST]` `writeValue` to a **disabled date**: focus moves to the nearest enabled date in the same month per the constraint-change row of §17.2.
- `[REQ]` `[MUST]` `writeValue(null)`: focus moves to first enabled cell of currently displayed month (same algorithm as `clear()`).
- `[REQ]` `[MUST]` `writeValue` during `opening` / `closing` overlay transitions: the write is queued and applied after the phase completes (at which point the rules above apply to the stable phase).

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
- `[REC]` Horizontal swipe between months in day view. During range SELECTING, swipe changes the pane; the draft `start` is preserved and the hover preview continues in the new pane.
- `[REC]` Vertical swipe to dismiss overlay.
- `[REQ]` `[MUST]` Long-press is a no-op in v1 (reserved for future affordances). Long-press on a disabled cell is also a no-op.
- `[REQ]` `[MUST]` No dependence on hover.

### 18.2 Event model

- `[REQ]` `[MUST]` Pointer Events API; fallback to touch + mouse.
- `[REQ]` `[MUST]` `touch-action: pan-y` on the grid element — allows vertical page scroll, blocks the browser's default horizontal gesture so horizontal-swipe pane navigation has exclusive control.

### 18.3 Touch targets

- `[REQ]` `[MUST]` Cells ≥ 24×24 CSS px (WCAG 2.2 AA, SC 2.5.8).
- `[REC]` Cells ≥ 44×44 CSS px on small viewports (`< 600px`; same breakpoint as §18.5 and WCAG 2.2 AAA SC 2.5.5).

### 18.4 Range selection on mobile

- `[REQ]` `[MUST]` After first tap, show persistent hint ("Select end date") until second tap or close.
- `[REC]` Default to two-pane layout on mobile for range mode.
- `[REQ]` `[MUST]` If the user closes the overlay/sheet without a second tap, the first-tap draft is discarded per `persistPartialRange` (default discard); no event is emitted beyond the standard §13.5 `closed` + `selectionCleared({reason: 'user'})` (if the draft existed).

### 18.5 Responsive full-screen mode

- `[REQ]` `[MUST]` Ship responsive full-screen presentation in v1. Input: `mobileMode: 'overlay' | 'fullscreen' | 'bottom-sheet' | 'auto'`. Default: `'auto'` (per §43 resolved decision).
- `[REQ]` `[MUST]` `'auto'` behavior: viewport width `< 600px` (measured via `matchMedia('(max-width: 600px)')`) at overlay-open time → render as `fullscreen` by default on mobile OS / `bottom-sheet` where a sheet is conventional; otherwise render as standard positioned `overlay`. Breakpoint is measured once per open (no layout thrash mid-open).
- `[REQ]` `[MUST]` SSR: `'auto'` always resolves to `overlay` on the server; mobile presentation is a client-only decision made post-hydration (see §14.3, §31.2).
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
- `[REQ]` `[MUST]` Fallback when `LOCALE_ID` is unresolvable or unknown to `Intl.Locale`: Monday (`1`); logs a dev-mode warning.

### 19.3 RTL

- `[REQ]` `[MUST]` Full RTL via CSS logical properties.
- `[REQ]` `[MUST]` Prev/next buttons swap visually; arrow keys map to logical prev/next, not visual (see §16.1 RTL note).
- `[REQ]` `[MUST]` Range hover preview in RTL follows the same logical semantics — a "later" date is always to the logical end of the start (visually to the left in RTL).

### 19.4 CalendarIntl service

- `[REQ]` `[MUST]` All user-visible strings exposed via injectable `CalendarIntl`. Required fields (`CalendarIntlKeys` union):
  - **Button labels:** today, clear, prev month, next month, prev year, next year, prev decade, next decade, choose date, open calendar, apply (if footer).
  - **View labels:** month label, year label, decade label (e.g., "2020–2029"), year-view month header a11y name.
  - **Weekday / month names:** overrides for `Intl.DateTimeFormat` defaults (optional per locale).
  - **Accessible cell-name template:** `cellAccessibleName(ctx: DayCellContext<D>) => string` (§15.6).
  - **ARIA announcements:** "Start date selected", "End date selected", "No date selected", "X days selected" (plural), "Selecting — now select end date", "Skipped {N} periods to {destination}" (auto-skip).
  - **Error messages (§28):** per `CalendarErrorCode`, a consumer-facing message template (optional fallback).
  - **Parse-error messages:** parse failure for single/multiple/range inputs.
  - **Keyboard help text (§16.4):** multi-line description of the keyboard contract.
  - **In-progress template:** "Selecting X, now select end" shown in the live region.
- `[REQ]` `[MUST]` Fields using ICU `plural`: `"X days selected"`, `"X dates selected"` (multiple mode), `"Skipped {N} periods"`. These are the only plural-marked fields in v1.
- `[REQ]` `[MUST]` Override semantics: consumers replace **per-field** via merge (not full-bag replacement). Partial overrides inherit the default `CalendarIntl` for unspecified fields.
- `[REQ]` `[MUST]` Override at any injector level.
- `[REC]` Ship defaults for English + 5 other major locales (de, fr, es, pt, ja) — per §43 resolved decision.

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
create(year: number, month: number, day: number): D    // month is 1-based (January = 1)
parse(value: unknown, formats: string[]): D | null     // returns null on every failure (not an invalid() sentinel)
format(date: D, format: string): string
invalid(): D                                           // internal sentinel; never surfaced through parse
isValid(date: D): boolean
startOfDay(date: D): D                                 // normalization for time-aware adapters

getYear / getMonth / getDate / getDayOfWeek(date: D): number
// getMonth returns 1-based month number (January = 1)
// getDayOfWeek returns 0 = Sunday ... 6 = Saturday (ISO day-of-week is NOT used)

getFirstDayOfWeek(): number
getNumDaysInMonth(date: D): number
getDaysInWeek(): number
getDateNames / getMonthNames / getDayOfWeekNames(style): string[]

addYears / addMonths / addDays / addHours / addMinutes(date: D, n: number): D
compare(a: D, b: D): number
sameDate / sameMonth / sameYear(a: D, b: D): boolean
startOfWeek(date: D, firstDayOfWeek?: number): D       // required for Home key in day view
endOfWeek(date: D, firstDayOfWeek?: number): D         // required for End key in day view
clone(date: D): D

// TZ-aware methods (optional; only TZ-aware adapters must implement)
getTimezone(): string | null                           // IANA zone, or null for floating adapters
withTimezone(date: D, tz: string): D
isDST(date: D): boolean
resolveAmbiguous(date: D, prefer: 'earlier' | 'later'): D

// Serialization helpers (§7.5)
toIso(date: D): string
fromIso(iso: string): D | null
```

**Conventions pinned:**

- `create(year, month, day)` uses **1-based month** (January = 1). This is the #1 divergence between `Date` (0-based) and Luxon (1-based) adapters; all shipped adapters conform to 1-based.
- `getDayOfWeek()` returns `0 = Sunday` through `6 = Saturday`. Adapters whose native type uses ISO day-of-week (Monday = 1 … Sunday = 7) must convert.
- Floating (wall-clock) adapters return `null` from `getTimezone()` and implement TZ-aware methods as no-ops that return the input unchanged. `TZ_OVERRIDE` is ignored (§4.3).
- `NativeDateAdapter` DST edge: for a skipped-hour date (e.g., 2:30 AM spring-forward), `startOfDay` returns the next valid wall-clock moment (typically 01:00 or the DST transition hour). Tests cover this explicitly (§35.3).

### 20.3 DateFormats contract

- `[REQ]` `[MUST]` `DateFormats` DI token defines format strings for:
  - `input`, `display`, `monthLabel`, `yearLabel`, `decadeLabel` (e.g., "2020–2029"), `a11yLabel`, `monthA11yLabel`, `dayA11yLabel`, `yearViewMonthA11yLabel`.
- `[REQ]` `[MUST]` `DateFormats` can be provided two ways — via the DI token OR via the `dateFormats` component input. Input precedence: **component input overrides DI-provided default** for that instance; unspecified fields inherit from DI.

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
             │   clear() / reset() /   │                        │
             │   Escape / writeValue   │                        │
             └─────────────────────────┘                        │
             ▲                                                  │
             │                  clear() / reset()               │
             └──────────────────────────────────────────────────┘
             ▲                                                  │
             │                  3rd click (rangeClickBehavior)  │
             └──────────────────────────────────────────────────┘
```

- `[REQ]` `[MUST]` EMPTY: `{ start: null, end: null }`.
- `[REQ]` `[MUST]` SELECTING: `internalDraftValue = { start: A }`; `externalValue` unchanged.
- `[REQ]` `[MUST]` COMPLETE: `{ start: A, end: B }`.
- `[REQ]` `[MUST]` **Complete input set for state transitions** (authoritative; see §8.3 for the fully-ordered table with events):
  - From EMPTY: click A (→ SELECTING), programmatic `writeValue(complete)` (→ COMPLETE), preset selected (→ COMPLETE), disabled-cell click (no-op), outside click / Escape (no state change).
  - From SELECTING: click B (→ COMPLETE per happy path); hover (→ SELECTING); Escape (→ EMPTY, discard draft); `clear()` / `reset()` (→ EMPTY); programmatic `writeValue(null)` (→ EMPTY); programmatic `writeValue(complete)` (→ COMPLETE, draft discarded); outside click (→ per `persistPartialRange`: EMPTY with discard, or SELECTING retained); `mode` change / `disabled=true` (→ EMPTY).
  - From COMPLETE: click C (→ SELECTING or COMPLETE, depending on `rangeClickBehavior` — §21.3); `clear()` / `reset()` (→ EMPTY); programmatic `writeValue(null)` (→ EMPTY); preset selected (→ COMPLETE); mode change (→ EMPTY).
- `[REQ]` `[MUST]` `rangePreview` fires on BOTH pointer hover AND keyboard arrow-key focus movement during SELECTING. Keyboard navigation through cells produces `rangePreview` events identical to pointer hover.

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
| SELECTING hover/focus | `rangePreview` | `{ tentativeRange: { start: D, end: D }, invalidPreview: boolean }` (normalized so `start ≤ end` regardless of hover direction; `invalidPreview: true` when the preview crosses a disabled cell and `disableRangesCrossingDisabledDates=true`, or violates length constraints) |
| SELECTING → COMPLETE | `selectionComplete` | `{ value: { start: D, end: D }, reason: 'commit' \| 'auto-swap' }` |
| **Any → SELECTING with a new `start`, while a prior `start` or COMPLETE range existed** | `selectionRestart` | `{ start: D }` — `start` is the **newly-clicked** date (new draft start) |
| COMPLETE → COMPLETE via `nearest-edge` (one-click endpoint swap) | `selectionComplete` | `{ value: { start: D, end: D }, reason: 'nearest-edge' }` |
| any → EMPTY | `selectionCleared` | `{ reason: 'user' \| 'programmatic' \| 'mode-change' \| 'reset' \| 'disabled' }` |
| any state change | `valueChange` | `CalendarValue<M, D>` |

`selectionRestart` applies to both **COMPLETE → SELECTING** (3rd-click restart with `rangeClickBehavior='restart'`) and **SELECTING → SELECTING** (backward click with `allowBackwardRange=false`). The common semantic: a previous start/range is being abandoned in favor of a new start. Consumers distinguish the two cases by reading `selectionState` at emission time if needed.

**Auto-swap path does NOT emit `selectionRestart`.** A backward click with `allowBackwardRange=true` goes directly SELECTING → COMPLETE with a swapped payload; the event is `selectionComplete` (not `selectionRestart`). Consumers reading `reason: 'auto-swap'` can detect this path.

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
- `[REQ]` `[MUST]` Switching views **never** mutates `externalValue`. The only path that mutates value from within a non-day view is a **click** on a month/year cell under `rangeGranularity` ≠ `'day'` — that is a click commit, not a view switch (see §22.4/§22.5 for the (granularity × view × state) matrix).

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
- `[REQ]` `[MUST]` **Disabled-date fallback:** after applying the rule above, if the resolved target date is disabled, apply the §17.2 **"Constraint change"** row semantics — focus the nearest enabled date in the same month. If the entire month is disabled, §12.6 empty-state rules apply.

### 22.4 Month-view click during SELECTING

- `[REQ]` `[MUST]` The action is determined by the **(granularity × view × state)** matrix:

| `rangeGranularity` | View | State | Month-cell click |
|---|---|---|---|
| `'day'` | month | any | Drill-down (navigate to day view of that month) |
| `'month'` | month | EMPTY | Commit first click (→ SELECTING) |
| `'month'` | month | SELECTING | Commit second click (→ COMPLETE) |
| `'month'` | month | COMPLETE | Per `rangeClickBehavior` (restart / nearest-edge / require-clear) |
| `'year'` | month | any | Drill-down (navigate to day view of that month) — year granularity commits at year view |
| `'day'` | year | any | Drill-down to month view of that year |
| `'year'` | year | EMPTY / SELECTING / COMPLETE | Commit per state (analogous to month-level commit row) |

### 22.5 Granularity-based selection

- `[REQ]` `[SHOULD]` `rangeGranularity: 'day' | 'month' | 'year'`. Mixed-granularity composites (e.g., month start + day end) are NOT supported in v1.
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
- `[REC]` `[COULD]` Independent panes: opt-in via `independentMonthNavigation: boolean`. Default `false`.

### 23.3 Navigation step

- `[REQ]` `[MUST]` `navigationStep: 'single' | 'page'`. Default: `'single'`.
- `[REQ]` `[MUST]` Semantics:
  - `'single'` + linked panes: advance by **1 period** (e.g., Jan/Feb/Mar → Feb/Mar/Apr).
  - `'single'` + independent panes: advance **the focused pane** by 1; other panes unchanged.
  - `'page'` + linked panes: advance by **`numberOfMonths` periods** (Jan/Feb/Mar → Apr/May/Jun).
  - `'page'` + independent panes: advance the focused pane by `numberOfMonths` periods.

### 23.4 Year view (12-month)

- `[REQ]` `[MUST]` Supported via `numberOfMonths: 12, monthLayout: 'grid'`.
- `[REQ]` `[MUST]` `monthPaneDensity: 'full' | 'compact' | 'name-only'`.
- `[REQ]` `[MUST]` `full` density at 12 panes renders all 12 panes as independent OnPush change-detection islands (each pane only dirties when its own inputs change). CDK virtual scroll is **not** used — see §32.3 for the rationale. "Virtualization" in this context means per-pane CD isolation, not windowed DOM rendering.

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
  isRangePreviewStart: boolean;
  isRangePreviewEnd: boolean;
  isInvalidPreview: boolean;
  isDisabled: boolean;
  isOutOfMonth: boolean;
  isFocused: boolean;
  isWeekend: boolean;
  badge: BadgeConfig | null;
  data?: T;
};
```

### 24.2 Data binding

- `[REQ]` `[MUST]` `dayData: Map<string, T>` keyed by ISO date.
- `[REQ]` `[MUST]` `dayDataFn: (date: D) => T | undefined` alternative.
- `[REQ]` `[MUST]` **Precedence when both are supplied:** `dayData` map takes precedence for any date it contains a key for; `dayDataFn` is the fallback for unmapped dates.
- `[REQ]` `[MUST]` Indexed once per data change.

### 24.3 Customization layers

**Layer 1 — Badges**
- `[REQ]` `[MUST]` `dayBadge: (date: D, data?: T) => BadgeConfig | null`.
- `[REQ]` `[MUST]` `BadgeConfig: { count?: number; dot?: boolean; color?: TwColor; label?: string }` — label is **text only**. `color` is a semantic token name (`'info' | 'success' | 'warning' | 'error' | 'primary' | 'secondary' | 'accent' | 'neutral'`), not a raw Tailwind palette color or arbitrary CSS color. See `ngx-tw/core` `TwColor` for the union.
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
  disabled?: boolean | ((ctx: PresetDisabledContext<D>) => boolean);
};

type PresetDisabledContext<D> = {
  minDate: D | null;
  maxDate: D | null;
  disabledDates: D[] | DateFilterFn<D> | null;
  disabledDaysOfWeek: number[];
  dateFilter: DateFilterFn<D> | null;
  adapter: DateAdapter<D>;
};

type PresetGroup = { id: string; label: string };
```

- `[REQ]` `[MUST]` `PresetDisabledContext` exposes the full constraint surface so a predicate can decide independently whether its computed range is reachable. The `adapter` handle is provided so the predicate can use `sameDate` / `compare` / `addDays` without hard-coding `Date` arithmetic.
- `[REQ]` `[MUST]` `PresetGroup` has no generic parameter — it carries no date-typed fields. (Corrected from earlier drafts that declared `PresetGroup<D>`.)

### 25.2 Behavior

- `[REQ]` `[MUST]` Preset selection writes directly to COMPLETE; bypasses click flow.
- `[REQ]` `[MUST]` Overlay closes (overlay mode) unless `closeOnPresetSelect: false`.
- `[REQ]` `[MUST]` When `closeOnPresetSelect: false` and the user makes a subsequent manual selection (day/month cell click), `selectedPresetId` is cleared (emits `presetChange(null)` per §8.3). The manually-selected value takes precedence.
- `[REQ]` `[MUST]` **Post-selection navigation:**
  - Single-pane layout: navigate so the month containing `preset.value.start` is displayed.
  - Multi-month linked layout: navigate so `preset.value.start` lands in the **first** rendered pane; subsequent panes follow the linked-sequence (`start`, `start+1 month`, …). If the preset's `end` falls past the last rendered pane, no additional navigation happens — the user scrolls / navigates from there.
  - Multi-month independent layout (`independentMonthNavigation: true`): only the focused pane navigates; others are left unchanged.
  - `monthChange` (or the view-appropriate equivalent) fires exactly once per navigation, after `valueChange` and before the overlay-close sequence.
- `[REQ]` `[MUST]` Presets honor `minDate`/`maxDate`/`disabledDates`/`disabledDaysOfWeek`/`dateFilter` per `presetViolationBehavior: 'disable' | 'hide' | 'warn'`.
  - `'disable'` — the preset is rendered but non-interactive; attributed `data-state-preset-invalid`; `aria-disabled="true"`.
  - `'hide'` — the preset is removed from the list; no ARIA exposure.
  - `'warn'` — the preset is rendered as interactive; clicking it commits the (still-invalid) value and marks the control invalid per §10.2; a dev-mode warning logs once per preset per constraint change.
- `[REC]` Default: `'disable'`.
- `[REQ]` `[MUST]` In v1, presets are **range-only** — `CalendarPreset<D>` carries a `CalendarRangeValue<D>`. Consumers using presets in `single` or `multiple` mode get a dev-mode warning; presets are not rendered.

### 25.3 Accessibility

- `[REQ]` `[MUST]` `role="listbox"` with single-select semantics (`aria-activedescendant`-free roving-tabindex model matching the grid pattern).
- `[REQ]` `[MUST]` Keyboard: Tab in, Arrow within, Enter to select.
- `[REQ]` `[MUST]` Accessible name includes computed range ("Last 7 days, April 17 to April 24").

### 25.4 Custom preset option

- `[REC]` Convention: `'custom'`-flagged preset focuses the calendar grid rather than writing a value. Focus target resolves to `adapter.today()` if within constraints, else the first enabled date in the current view.

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

> **Note on state semantics.** The §21 SELECTING state machine is a single-control concept. When range selection is split across two independent `FormControl`s, there is no SELECTING state at the form level — each control is updated independently. Cross-field validators run after each individual commit, and invalid-intermediate states (e.g., only `startDate` filled) surface as validator errors on the parent group rather than as calendar-internal state.

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
- `[REQ]` `[MUST]` Reference policy tested in CI: `default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; font-src 'self'`. Nonce-based policies (`style-src 'nonce-XYZ'`) are supported — the component does not inject any `<style>` elements at runtime.

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
- `[REQ]` `[MUST]` `aria-invalid="true"` is applied when the control is invalid. The host for the attribute depends on `interaction`:
  - `interaction: 'overlay'` → on the trigger element (button/input bound via `CalendarInputDirective`).
  - `interaction: 'inline'` → on the grid root (`role="grid"` element).
  - When both a text input (via `CalendarInputDirective`) and an inline calendar share a `CalendarCoordinator` (§9.1), both elements receive `aria-invalid="true"` so screen readers reading either context announce the invalid state.
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

- `[REQ]` `[MUST]` Emit `console.warn` for (non-exhaustive — additional conditions are called out inline at their source section):
  - `minDate > maxDate`.
  - `value` shape mismatched with `mode`.
  - `numberOfMonths < 1`.
  - `maxRangeLength < minRangeLength`.
  - `disabledDaysOfWeek` invalid values.
  - Unknown `rangeClickBehavior` string.
  - `LOCALE_ID` unresolvable / unknown to `Intl.Locale` (§19.2; falls back to Monday).
  - `TZ_OVERRIDE` token or `timezone` input set on a floating adapter (§4.3).
  - `stateId` collision within the same `CalendarCoordinator` scope (§8.6; second instance wins).
  - Consumer predicate (`dateFilter`, `dayDataFn`, `dayBadge`, cell disabled predicate) throws — fail-safe disables the cell (§27.2).
  - Consumer predicate exceeds the 200 µs / cell P95 threshold on Moto G4 (§32.5), logged once per render pass.
  - Full render pass exceeds §32.2 budget by ≥ 50% (§32.5).
  - Presets supplied in `single` / `multiple` mode (§25.2) — presets are range-only in v1.
  - `valueTransformer.toForm` or `fromForm` throws (§7.6).
  - `presetViolationBehavior: 'warn'` — one log per preset per constraint change (§25.2).
  - Runtime `interaction` mode change when the implementation does not support it (§11.8).
  - Runtime adapter change attempted (§11.7).
  - Deprecated-symbol usage (§38.2, once per session).

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
activeDateChange (always emitted when click resolves to a cell, even if the clicked cell is already active)
→ valueChange
→ selectionComplete
→ (closed, if overlay + closeOnSelect)
→ (onTouched, if overlay + closeOnSelect + user-initiated)
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
→ selectionComplete ({reason: 'commit'})
→ (closed, if overlay + closeOnSelect)
→ (onTouched, if overlay + closeOnSelect + user-initiated)
```

**Range mode — backward click with auto-swap (SELECTING → COMPLETE)**
```
activeDateChange
→ valueChange
→ selectionComplete ({reason: 'auto-swap'})
→ (closed, if overlay + closeOnSelect)
→ (onTouched, if overlay + closeOnSelect + user-initiated)
```
(No `selectionRestart` fires on the auto-swap path. Consumers detecting swap use the `reason` field on `selectionComplete`.)

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
(selectionCleared ({reason: 'user'}), if discarding a SELECTING draft)
→ closed
→ onTouched
```

**Overlay close via `disabled=true` flip**
```
(selectionCleared ({reason: 'disabled'}), if was SELECTING)
→ closed
```
(No `onTouched`. Programmatic trigger — per §13.6.)

**Overlay close via form reset (§6.5)**
```
(selectionCleared ({reason: 'reset'}), if had value)
→ closed
```
(No `onTouched`. No component-emitted `valueChange` — the form owns the write.)

**Programmatic `writeValue` from form during SELECTING (§11.1)**
```
selectionCleared ({reason: 'programmatic'})
→ (form's valueChanges propagates the new value)
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
- `[REQ]` `[MUST]` `(ngModelChange)` / `FormControl.valueChanges` / Signal Forms `field.value()` updates all fire **after** the component's `valueChange` output, in the same microtask (native Angular form propagation). The three form strategies are observationally identical in ordering.
- `[REQ]` `[MUST]` `touched` / `onTouched` emission at overlay close or blur, never interleaved with `valueChange`. Specifically: in any sequence ending in `closed` due to a user action, `onTouched` fires **after** `closed` (see §13.4 step 11). `onTouched` is suppressed for programmatic closes, `disabled=true` flips, form resets, adapter changes, and trigger unmounts (§13.5).

### 30.4 Coalescing

- `[REQ]` `[MUST]` Multiple state changes within one microtask (e.g., `mode` + `value` set together) emit one `valueChange` at the end of the microtask, not one per mutation.

---

## 31. SSR & Hydration

### 31.1 Server rendering

- `[REQ]` `[MUST]` Full server render of current view (not a skeleton).
- `[REQ]` `[MUST]` No `window`/`document`/`navigator` outside lifecycle guards.
- `[REQ]` `[MUST]` `adapter.today()` on server uses configured server timezone.

### 31.2 Hydration

- `[REQ]` `[MUST]` No DOM mismatch warnings when server TZ differs from client. Achieved by rendering every cell's text content as the date label (`1`, `2`, ...) — never "today" — so server and client DOM text is identical regardless of `adapter.today()`.
- `[REQ]` `[MUST]` "Today" marker (CSS class + `aria-current="date"`) re-evaluated in an `afterNextRender` hook; if the client-side result differs from the server snapshot, the decoration is swapped silently (no event, no full re-render). See §4.3.
- `[REQ]` `[MUST]` Overlay DOM is **not** rendered on the server regardless of consumer binding. `overlayState` signal defaults to `'closed'` on server; any `open=true` binding is honored only client-side post-hydration to avoid state-shape mismatch.

### 31.3 Focus management

- `[REQ]` `[MUST]` No autofocus on hydration.
- `[REQ]` `[MUST]` Focus established only when user opens the overlay or interacts inline.

### 31.4 I18n on server

- `[REQ]` `[MUST]` `Intl.DateTimeFormat` works server-side (Node ≥ 18 with full ICU).

---

## 32. Performance

### 32.1 Bundle size budgets (enforced at build)

- `[REQ]` `[MUST]` Core + `NativeDateAdapter`, gzipped: ≤ **35 KB** (also measured as brotli: ≤ **30 KB** — reported alongside gzip).
- `[REQ]` `[MUST]` Core without adapter, gzipped: ≤ **25 KB**.
- `[REQ]` `[MUST]` Tree-shakable: importing the component must not pull Luxon/date-fns adapters.
- `[REQ]` `[MUST]` Measurement tooling: `@angular/build` `--stats-json` post-processed by `source-map-explorer`; CI gate compares against the last release baseline. Brotli figures from `brotli -q 11`.

### 32.2 Runtime budgets (mid-range mobile, Moto G4-class)

- `[REQ]` `[MUST]` Measurement methodology: Chrome DevTools **4× CPU throttle**, **Fast 3G** network throttle, Lighthouse-equivalent rendering pipeline. All budgets are **P95** over 20 sequential renders with cache warm.
- `[REQ]` `[MUST]` First render single-month day view: ≤ **50 ms** (P95).
- `[REQ]` `[MUST]` First render 12-pane year view: ≤ **200 ms** (P95).
- `[REQ]` `[MUST]` Cell click → visual feedback: ≤ **16 ms** (1 frame).
- `[REQ]` `[MUST]` Hover preview update: ≤ **16 ms**.
- `[REQ]` `[MUST]` Programmatic value change → DOM update: ≤ **50 ms**.
- `[REQ]` `[MUST]` `dayData` update re-render: ≤ **50 ms** (1 month), ≤ **200 ms** (12 months).
- `[REQ]` `[MUST]` Constraint change (minDate / maxDate / disabledDates / dateFilter reference update) → revalidation + cell re-style + focus re-resolution: ≤ **50 ms** (1 month), ≤ **200 ms** (12 months).
- `[REQ]` `[MUST]` `disabled=true` flip with open overlay → overlay force-close + draft discard + event emit: ≤ **32 ms** (2 frames).

### 32.3 Implementation requirements

- `[REQ]` `[MUST]` `ChangeDetectionStrategy.OnPush`.
- `[REQ]` `[MUST]` Signal-based internal state.
- `[REQ]` `[MUST]` Each month pane is an OnPush child; updating one pane does not dirty others.
- `[REQ]` `[MUST]` Month matrices memoized by `(year, month, firstDayOfWeek, locale)`.
- `[REQ]` `[MUST]` `dayData` indexed by ISO-date key once per data change.
- `[REQ]` `[MUST]` 12-pane year view at `full` density renders all 12 panes with OnPush children (each pane is its own CD island); this is what §23.4 refers to as "virtual rendering" — isolation of change detection, not windowed DOM rendering. CDK virtual scroll is **not** used — the grid is small enough that windowed virtualization would add overhead without benefit. Larger custom grids (e.g., multi-year agendas built on top of the adapter) may add their own virtualization.
- `[REQ]` `[MUST]` No `setInterval` for "today" refresh.

### 32.4 Measurement

- `[REQ]` `[MUST]` Budgets enforced in CI via automated benchmarks.
- `[REQ]` `[MUST]` Regressions block merge.
- `[REQ]` `[MUST]` Benchmark methodology documented in §39.1 so consumers can reproduce.

### 32.5 Dynamic data & consumer predicate performance

- `[REQ]` `[MUST]` Consumer predicates (`dateFilter`, `dayDataFn`, `dayBadge`, cell disabled predicate) are called **at most once per cell per render pass**.
- `[REQ]` `[MUST]` Internal memoization by (date, predicate reference identity) — stable predicate references yield cache hits across re-renders.
- `[REQ]` `[MUST]` `dayData` map read once per render pass; O(1) lookup by ISO-date key.
- `[REC]` Consumers pass stable predicate references (avoid inline arrow functions). Documented with `computed()` example in Signals.
- `[REQ]` `[MUST]` Dev-mode warning: if a single predicate call exceeds **200 µs** at P95 on Moto G4, log once per render pass with predicate source-snippet and cell count. (Rationale: with ≈42 cells × 4 predicates = 168 slots per render, 1 ms/slot would blow the 50 ms first-render budget many times over. 200 µs leaves headroom.)
- `[REQ]` `[MUST]` Dev-mode warning: if a full render pass exceeds §32.2 budget by 50%, log with diagnostic breakdown (time per predicate, per pane, per phase).

---

## 33. Component API Contract

All inputs use `input()` / `input.required()` (Angular 17.2+). All outputs use `output()` returning `OutputEmitterRef`. All public reactive state is exposed as readonly `Signal<T>`. No `EventEmitter` is used anywhere in the public API.

### 33.1 Inputs

Every input lists its TypeScript type and default value. `D` is the adapter date type. `M` is the mode generic.

> **Scope note.** Most rows below apply to `CalendarComponent`. The "Text input" table and rows explicitly labeled so (e.g., `virtualKeyboard`) apply to `CalendarInputDirective` instead — they are valid only when the directive is used to compose a text input with the calendar (§9.1, §9.5). Rows without a scope hint apply to the component.

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
| `blockInvalidRangeCommit` | `boolean` | `false` · `[REC] [COULD]` v1.1 (per §43 resolved decision #5) |
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
| `navigationBoundaryLookahead` | `number` | `24` · resolved per §43 decision #7 |
| `autoSkipEmptyPeriods` | `boolean` | `false` · `[REC]`, resolved per §43 decision #6 |

**Presets**
| Input | Type | Default |
|---|---|---|
| `presets` | `CalendarPreset<D>[]` | `[]` |
| `presetGroups` | `PresetGroup[]` | `[]` |
| `presetViolationBehavior` | `'disable' \| 'hide' \| 'warn'` | `'disable'` · semantics per §25.2 |
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
| `mobileMode` | `MobileMode` | `'auto'` · `[REQ] [MUST]` v1 (§14.3, §18.5) |
| `resetBehavior` | `ResetBehavior` | `'full'` |
| `interaction` | `'inline' \| 'overlay'` | `'overlay'` · runtime change per §11.8 |
| `multipleSeparator` | `string` | `','` · separator for multi-mode text input (§9.2.1) |
| `rangeSeparator` | `string` | `' – '` · separator for single-input range text entry (§9.2.1); whitespace trimmed around each endpoint on parse |
| `timezone` | `string \| null` | `null` · per-instance TZ override (TZ-aware adapters only; §4.2, §4.3). Overrides the `TZ_OVERRIDE` DI token for this component instance. |

Where `MobileMode = 'overlay' \| 'fullscreen' \| 'bottom-sheet' \| 'auto'` and `ResetBehavior = 'full' \| 'value-only'`.

**Text input (applies when `CalendarInputDirective` is used)**
| Input | Type | Default |
|---|---|---|
| `virtualKeyboard` | `'show' \| 'hide' \| 'auto'` | `'auto'` |

**Persistence & Serialization**
| Input | Type | Default |
|---|---|---|
| `valueTransformer` | `CalendarValueTransformer<M, D, TOut> \| null` | `null` (identity, D ↔ D) · `[REQ] [SHOULD]` v1; `[MUST]`-promotion tracked as §43 open decision #2 |
| `stateId` | `string \| null` | `null` · `[REC] [COULD]` (§8.6) |

*Note on `valueTransformer` generics:* The component is declared `CalendarComponent<M extends CalendarMode = 'single', D = Date, TOut = CalendarValue<M, D>>` (§7.3). `TOut` is exposed as the third generic so Signal Forms directives can reparameterize `Field<TOut>` when a transformer is present. The public `valueChange` output always emits `CalendarValue<M, D>` — see §7.6 for the transformer's role at the CVA boundary.

*Note on `persistentStateId`:* the `localStorage`-backed counterpart of `stateId` is **not** part of the v1 input surface. Deferred to v1.1+ per §8.6 and §42.2. Consumers needing cross-session persistence in v1 must serialize `externalValue` themselves at the form boundary.

*Note on `adapter`:* the `DateAdapter` is **not a component input**. Provide it via DI at the injector scope (`{ provide: DateAdapter, useClass: LuxonDateAdapter }`), typically at app or route level. This keeps the adapter constant for the component's lifetime (§11.7).

**Accessibility**
| Input | Type | Default |
|---|---|---|
| `errorAriaDescribedBy` | `string \| null` | `null` |

**i18n**
| Input | Type | Default |
|---|---|---|
| `locale` | `string` | `LOCALE_ID` |
| `intl` | `Partial<CalendarIntl>` | `{}` · per-field merge override; unspecified fields inherit the DI-provided defaults (§19.4) |
| `dateFormats` | `Partial<DateFormats>` | `{}` · component input overrides DI-provided `DateFormats` token for that instance; unspecified fields inherit from DI (§20.3) |

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
| `valueChange` | `CalendarValue<M, D>` — always untransformed (see §7.6 for transformer contract) |
| `selectionStart` | `{ start: D }` |
| `rangePreview` | `{ tentativeRange: { start: D; end: D }; invalidPreview: boolean }` |
| `selectionComplete` | `{ value: CalendarValue<M, D>; reason: 'commit' \| 'auto-swap' \| 'nearest-edge' \| 'preset' }` |
| `selectionRestart` | `{ start: D }` — `start` is the newly-clicked date |
| `selectionCleared` | `{ reason: 'user' \| 'programmatic' \| 'mode-change' \| 'reset' \| 'disabled' }` |
| `selectionLimitReached` | `{ limit: number; attempted: D }` |
| `presetChange` | `string \| null` — fires whenever `selectedPresetId` changes |
| `viewChange` | `{ from: CalendarViewState; to: CalendarViewState; reason: 'user' \| 'programmatic' \| 'drill-down' \| 'drill-up' }` |
| `activeDateChange` | `D` |
| `monthChange` | `{ year: number; month: number }` |
| `yearChange` | `{ year: number }` |
| `opened` | `void` |
| `closed` | `void` |
| `cellClick` | `{ date: D; event: PointerEvent }` — analytics only |
| `cellHover` | `{ date: D }` — analytics only |
| `renderedMonthsCount` | `number` |
| `modeChange` | `{ from: CalendarMode; to: CalendarMode }` |

**Naming convention:**
- Internal selection clicks do not emit `cellClick`. `cellClick` is analytics only.
- `activeDateChange` is the single source of truth for focus movement. `cellFocus` does not exist. `activeDateChange` fires whenever the active-cell target resolves to a new cell, including first click on an already-focused cell (semantic "activate", not a signal-equality check).
- `monthChange` / `yearChange` fire only when the displayed period changes, not on view drill.
- `selectedPresetId` is exposed both as a **readonly signal** (§33.3) for reactive reads AND as a `presetChange` output for imperative consumers.
- `overlayStateChange` output is **NOT** provided. Consumers observe the `overlayState` signal (§33.3) via `effect()` or template binding — signals are the canonical Angular v21 pattern and exposing both would duplicate the emission surface.
- `onTouched` is the CVA callback (registered via `registerOnTouched`), not a public output. Consumers observing touched state use the form control's `touched` signal (Signal Forms) or `AbstractControl.touched` (Reactive / Template-driven).
- Parse errors are surfaced through the form control's `errors` object (`calendarParseError`), not a dedicated output.

### 33.3 Readonly signals (public)

Exposed as component properties for direct reactive consumption (templates, `computed()`, `effect()`).

| Signal | Type |
|---|---|
| `overlayState` | `Signal<CalendarOverlayState \| null>` — `null` in inline mode (§14.1); one of `'closed' \| 'opening' \| 'open' \| 'closing'` in overlay mode |
| `selectionState` | `Signal<CalendarSelectionState>` |
| `activeDate` | `Signal<D \| null>` — `null` when no cell has roving focus (overlay closed and no inline focus, or programmatic focus has not yet been established). §8.5 invariant: `overlayState === 'open' ⟹ activeDate !== null`. |
| `selectedPresetId` | `Signal<string \| null>` |
| `viewState` | `Signal<CalendarViewState>` |
| `displayedMonths` | `Signal<{ year: number; month: number }[]>` — the months currently rendered |
| `lastInvalidFormValue` | `Signal<unknown>` — the raw `TOut` held on `fromForm` transformer failure (§7.6); `null` when transformer is absent or last write succeeded |

### 33.4 Public methods

| Method | Signature |
|---|---|
| `open` | `() => void` |
| `close` | `() => void` |
| `toggle` | `() => void` |
| `focusDate` | `(date: D, opts?: { navigate?: boolean }) => void` — when `navigate: true` (default `false`), navigates the view so `date` is rendered before focusing |
| `setView` | `(view: CalendarViewState) => void` |
| `goToDate` | `(date: D) => void` |
| `goToToday` | `() => void` |
| `clear` | `() => void` — alias: `clearSelection` (exported for discoverability; same implementation) |
| `reset` | `() => void` |
| `revalidate` | `() => void` — forces re-evaluation of all constraints, cell filters, and preset validity; useful when consumer predicate references change without re-rendering |

Also exported from `ngx-tw/calendar` (standalone helpers, not component methods):

- `[REQ]` `[MUST]` `serializeCalendarValue<M, D>(value, adapter)` — see §7.5. Shipped in v1; listed in the public API surface.

### 33.5 Output API style (binding rule)

- `[REQ]` `[MUST]` All outputs use `output<T>()` returning `OutputEmitterRef<T>`. **`EventEmitter` must not appear in the public API surface.**
- `[REQ]` `[MUST]` Consumers subscribe via `outputRef.subscribe(fn)` or convert via `outputToObservable(outputRef)` from `@angular/core/rxjs-interop`.

---

## 34. Theming & Customization

### 34.1 Tailwind v4 semantic tokens

The calendar is built on the ngx-tw semantic-token system. Styling is applied via Tailwind v4 utility classes in the component template; consumers customize by overriding semantic tokens in their own `@theme` block (no component CSS files, no hard-coded palette values).

- `[REQ]` `[MUST]` All color application uses semantic tokens defined in `projects/ngx-tw/theme/`:
  - **Surface/fg/border tokens** for structural styling (backgrounds, text, borders, dividers).
  - **Role-colored tokens** (`info`, `success`, `warning`, `error`, `primary`, `secondary`, `accent`, `neutral`) for selection states, range highlights, and badges.
  - No raw Tailwind palette colors (`blue-*`, `red-*`, etc.) appear anywhere in the component.
- `[REQ]` `[MUST]` Consumers re-theme the calendar by overriding semantic tokens via `@theme` in their own CSS — no component inputs needed for color:
  ```css
  @import 'ngx-tw/theme/default.css';
  @theme {
    --color-primary-500: oklch(0.55 0.2 260); /* rebrand primary to indigo */
    --color-info-50:     var(--color-sky-50);  /* remap info to sky */
  }
  ```
- `[REQ]` `[MUST]` Spacing, border-radius, typography, and shadow tokens come from the CLAUDE.md visual design system: `rounded-md` for interactive cells, `rounded-lg` for the grid container, focus rings `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`, transitions `transition-colors duration-200 motion-reduce:transition-none`, etc. The calendar adheres to the library-wide scale — it does not define its own.
- `[REQ]` `[MUST]` Documented theme reference lists every semantic token the component consumes (surface/fg/border + all role colors + shade stops used).

### 34.2 Dark mode

- `[REQ]` `[MUST]` Automatic via the theme's `_dark.css` layer (surface/fg/border tokens swap; role-colored tokens swap per `@media (prefers-color-scheme: dark)`).
- `[REQ]` `[MUST]` No theme input required — inherits from whatever the consumer's theme declares for dark mode.

### 34.3 Forced-colors mode

- `[REQ]` `[MUST]` Full support: state indicators use `outline`/`border`, not only backgrounds. Matches the theme's `_high-contrast.css` layer.

### 34.4 Template hooks

- `[REQ]` `[MUST]` Templates exposed for: day cell (`cellTemplate`), cell header (`cellHeaderTemplate`), month header (`monthHeaderTemplate`), calendar header (`headerTemplate`), footer (`footerTemplate`), preset (`presetTemplate`), preset group (`presetGroupTemplate`), empty state (`emptyStateTemplate`). Types and defaults per §33.1.

### 34.5 Styling hooks

- `[REQ]` `[MUST]` `data-state-*` attributes are the primary styling hook. Canonical attribute reference:

| Attribute | Element | Set when |
|---|---|---|
| `data-state-today` | grid cell | cell's date equals `adapter.today()` |
| `data-state-selected` | grid cell | cell is the committed selection (single / element of multiple / range endpoint or in-range) |
| `data-state-range-start` | grid cell | cell equals `range.start` |
| `data-state-range-end` | grid cell | cell equals `range.end` |
| `data-state-in-range` | grid cell | cell is strictly between `start` and `end` |
| `data-state-range-preview-start` / `-end` | grid cell | preview-boundary during SELECTING hover |
| `data-state-in-range-preview` | grid cell | preview interior |
| `data-state-invalid-preview` | grid cell | preview violates constraints or crosses disabled |
| `data-state-invalid-flash` | grid cell | momentary feedback for rejected interaction (disabled click, single-day-disallowed click) |
| `data-state-disabled` | grid cell | cell fails any constraint |
| `data-state-focused` | grid cell | cell is `activeDate` |
| `data-state-out-of-month` | grid cell | adjacent-month cell in day view |
| `data-state-weekend` | grid cell | Saturday or Sunday |
| `data-state-preset-invalid` | preset list item | preset's range no longer satisfies constraints (§25.6) |
| `data-state-overlay-opening` / `-open` / `-closing` | overlay panel root | mirrors `overlayState` signal |

- `[REC]` Tailwind is the expected consumer layer. Scope overrides via CSS selectors targeting these attributes.

### 34.6 Tailwind v4 requirement

- `[REQ]` `[MUST]` The component is built exclusively for Tailwind CSS v4+. Consumers must have Tailwind v4 installed (peer dependency declared in §3). Consumer-level `@theme` overrides are the supported customization surface.

---

## 35. Testing Requirements (Library)

### 35.1 Coverage

- `[REQ]` `[MUST]` Unit tests per mode, per adapter, per validator.
- `[REQ]` `[MUST]` State machine tests: every transition in §8.3 and §21 in every relevant configuration.
- `[REQ]` `[MUST]` Event ordering tests per §30.2 — every sequence, including the new `disabled=true`, auto-swap, form-reset, and writeValue-during-SELECTING sequences.
- `[REQ]` `[MUST]` Focus resolution tests per §17.2 — every row of the table, including mode-change-wins-over-writeValue-cascade, disabled-cell roving focus, writeValue-during-opening/closing.
- `[REQ]` `[MUST]` Overlay lifecycle tests: every row of the close-reason table (§13.5) — including scroll, focus loss, form reset, adapter change, constraint-tightening, mobile back-button, trigger unmount.
- `[REQ]` `[MUST]` View switching tests: every (granularity × view × state) cell from §22.4, selection persistence across every view transition, focus landing per §22.3 (including disabled-date fallback).
- `[REQ]` `[MUST]` Multi-month tests: linked nav, responsive collapse, hover preview spanning panes, keyboard edge navigation, cross-pane endpoints commit.
- `[REQ]` `[MUST]` Integration tests per forms paradigm (Reactive, Template-driven, Signal Forms) — validated observationally identical per §6.4, §30.3.
- `[REQ]` `[MUST]` Signal Forms typing test covering the `FieldTree<Date, string>` case and the `TOut` generic with `valueTransformer`.
- `[REQ]` `[MUST]` **Security coverage (§27):** dev-mode predicate try/catch fallback to disabled; CSP compatibility with the reference policy; consumer-template sanitization not bypassed.
- `[REQ]` `[MUST]` **Error handling coverage (§29):** every dev-mode warning condition; adapter parse failure surface; template-throw fallback.
- `[REQ]` `[MUST]` **Error display coverage (§28):** `errorAriaDescribedBy` composition with keyboard-help ID; `aria-invalid` toggling.
- `[REQ]` `[MUST]` **Transformer coverage (§7.6):** `isoStringTransformer` + `timestampTransformer` for each mode; `toForm` and `fromForm` error paths; `lastInvalidFormValue` signal; public `valueChange` emits untransformed `CalendarValue<M, D>` regardless of transformer.

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
- `[REQ]` `[MUST]` **Constraint flip during SELECTING**: `disabledDates` changes mid-interaction; active focus moves per the §17.2 **"Constraint change"** row; draft preserved if still valid, discarded with `selectionCleared` otherwise.
- `[REQ]` `[MUST]` **Mode flip during open overlay**: overlay closes per §11.2; no orphaned events.
- `[REQ]` `[MUST]` Each scenario runs 100× in CI with **jitter injection** — a uniform random delay in `[0, 16]ms` inserted between simulated user actions, seeded per test run for reproducibility (seed logged on failure). Failure if any run diverges from the canonical event sequence.

---

## 36. Testing Harness (for Consumers)

### 36.1 Harness

- `[REQ]` `[MUST]` Ship `CalendarHarness` built on Angular CDK `ComponentHarness`.
- `[REQ]` `[MUST]` Core API:
  - `open()`, `close()`, `isOpen()`
  - `getOverlayState()`, `getOverlayPhase()` — phase returns the 4-value `CalendarOverlayState`; `getOverlayState()` is kept as a shorter alias returning the same value
  - `selectDate(date)`, `selectRange(start, end)`, `hover(date)` — simulate pointer hover for range preview testing
  - `getSelectedValue()`, `getFocusedDate()`, `getBadge(date)`
  - `getCell(date)`, `getCells(predicate)`
  - `nextMonth()`, `prevMonth()`, `setView(view)`, `goToToday()`, `focusDate(date)`
  - `clearSelection()`, `setDisabled(disabled)`
  - `getPresets()`, `selectPreset(id)`
  - `isInvalid()`, `getErrors()` — form-level validation surface
- `[REQ]` `[MUST]` **Event-observation API:** `eventsFor(name): Observable<T>` — consumers subscribe to any public output (`valueChange`, `selectionComplete`, `rangePreview`, `selectionLimitReached`, `viewChange`, `modeChange`, `presetChange`, `selectionRestart`, `selectionCleared`) for assertions.

### 36.2 Usage pattern

- `[REQ]` `[MUST]` Documented end-to-end example with TestBed.

### 36.3 Mocks

- `[REC]` Export `MockDateAdapter` for deterministic testing (pinnable "today").

---

## 37. Developer Experience

### 37.1 Schematics

- `[REC]` `[COULD]` v1.1 — `ng add @your-org/calendar` — adds package, imports in `app.config`, registers default date adapter. Deferred from v1 per §43 resolved decision #3.
- `[REC]` `[COULD]` v1.1 — `ng generate @your-org/calendar:integration` — scaffolds a working form (Reactive, Signal Forms variants).

### 37.2 Debug mode

- `[REC]` `debug: boolean | (msg: DebugEvent) => void` input. When `true`, state transitions / validation / view changes are logged via `console.debug` in dev mode only. When a function, the function is called instead — useful for redirecting to a custom logger in tests.

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
- `[REQ]` `[MUST]` **Changing `DateAdapter` method signature** (add required method, change parameter type, change return type) = breaking. Adding a new optional method = minor.
- `[REQ]` `[MUST]` **Event payload shape changes:** adding an optional field = minor. Renaming or removing a field, or narrowing a union variant = breaking.
- `[REQ]` `[MUST]` **Semantic token renames / removals** (§34.1) = breaking — consumer themes depend on token names. Adding a new token shade or role = minor.
- `[REQ]` `[MUST]` **`data-state-*` attribute changes** (§34.5 table) = breaking — consumer CSS depends on attribute names. Adding a new `data-state-*` attribute = minor.

### 38.2 Deprecation policy

- `[REQ]` `[MUST]` Deprecations for ≥ 2 major versions before removal.
- `[REQ]` `[MUST]` `@deprecated` JSDoc and TypeScript pragma.
- `[REQ]` `[MUST]` Deprecated symbols emit a `console.warn` once per session in dev mode (stripped in production). Warning text includes the migration target.
- `[REQ]` `[MUST]` Minimum **6-month** calendar-time window between deprecation announcement and removal, regardless of major-release cadence — gives consumers at least two quarters to migrate.

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
- `[REQ]` `[MUST]` Theming reference: semantic-token list (§34.1), `data-state-*` attribute reference (§34.5).
- `[REQ]` `[MUST]` Signal Forms typing troubleshooting page (including `TOut` transformer generic).
- `[REQ]` `[MUST]` Cross-field composition recipes.
- `[REQ]` `[MUST]` Event ordering reference (§30) for consumers writing reactive code.
- `[REQ]` `[MUST]` Error display recipes for Reactive and Signal Forms (§28.5).
- `[REQ]` `[MUST]` **Performance benchmark methodology** — how `[§32](#32-performance)` budgets are measured (CPU throttle, network throttle, P95 sampling), so consumers can reproduce.
- `[REQ]` `[MUST]` Migration guide between major versions.

### 39.2 Live examples

- `[REQ]` `[MUST]` Stackblitz example per selection mode and per forms paradigm.

---

## 40. Non-Functional Requirements

- `[REQ]` `[MUST]` Semantic versioning (§38).
- `[REQ]` `[MUST]` Source maps shipped.
- `[REQ]` `[MUST]` No `any` types in public API.
- `[REQ]` `[MUST]` License: **MIT** (resolved per §43; LICENSE file committed to repo).
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
**Then** COMPLETE, `externalValue = { start: Apr 10, end: Apr 15 }` (auto-swap). `selectionComplete` fires with `{ start, end, reason: 'auto-swap' }`; **`selectionRestart` does NOT fire** on the auto-swap path (contrast §41.3).

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
**Then** overlay renders full-screen (covers viewport, respects `env(safe-area-inset-*)` per §18.6), `role="dialog"` + `aria-modal="true"` applied, focus trapped inside the dialog. Events in order: `opened` → `activeDateChange` (initial focus resolution, §13.2 / §30.2) → `overlayState = 'open'`. On close, `onTouched` fires per §13.6.

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

Resolved in v2.6 (internal-consistency audit reconciliation pass):
- **`presetViolationBehavior` union**: **`'disable' | 'hide' | 'warn'`** (not `'disable' | 'truncate' | 'allow'`) — see §25.2, §33.1.
- **Mode-change emit order**: `selectionCleared → presetChange → modeChange → valueChange` (§11.2 aligned with §8.3).
- **`overlayState` signal type**: `Signal<CalendarOverlayState | null>`, `null` in inline mode (§14.1, §33.3).
- **`activeDate` signal type**: `Signal<D | null>` (§33.3).
- **Year-view "virtual rendering"**: per-pane OnPush CD islands, not CDK virtual scroll (§23.4, §32.3).
- **`virtualKeyboard: 'auto'` semantics**: pointer-type based — suppress + auto-open on touch, show on pointer/keyboard (§9.5).
- **`rangeSeparator` default**: `' – '` (space, en-dash, space) (§9.2.1, §33.1).
- **`PresetGroup` generic**: `<D>` dropped (no date-typed fields) (§7.4, §25.1, §33.1).
- **`selectionComplete` payload shape**: `{ value, reason }` instead of the unspreadable `{ ...value, reason }` (§33.2, §21.5).
- **Initial-focus auto-skip**: gated on `autoSkipEmptyPeriods=true` (§13.3).
- **`timezone` input vs `TZ_OVERRIDE` token precedence**: per-instance input wins (§4.3, §33.1).
- **`selectionCleared.reason` mapping**: every §13.5 close-path now names a concrete reason value from the §33.2 union.

Resolved in v2.5 (parallel-audit reconciliation pass):
- **Input masking default**: **off** by default, opt-in per instance → §9.3.
- **License**: **MIT** → §40.
- **Schematics & `ng add`**: deferred to **v1.1**; core ships first → §37.1.
- **Shipped locale defaults for `CalendarIntl`**: English + **de, fr, es, pt, ja** in v1 → §19.4.
- **`blockInvalidRangeCommit`**: deferred to **v1.1** (`[REC] [COULD]`) — v1 behavior is "allow commit, mark invalid" → §10.4, §33.1.
- **`autoSkipEmptyPeriods` default**: **`false`** (explicit no-op; silent skip leapfrogs unexpectedly) → §12.6, §33.1.
- **`navigationBoundaryLookahead` default**: **24** periods (2 years in day view); referenced consistently across §12.6 and §13.3 → §33.1.
- **`mobileMode: 'auto'` normative weight**: promoted from `[REQ] [SHOULD]` to `[REQ] [MUST]` — aligns §18.5 with §33.1 and the v2.4 resolution → §14.3, §18.5.

The following decisions remain open:

1. **`selectedPresetId` signal semantics**: track only first-time preset selection, or continuously re-compute if current value matches a preset's computed range?
   *Recommendation: track only explicit selection (consumer sets a preset); don't auto-match. Auto-matching is brittle (preset values drift with "today").*

2. **`valueTransformer` final status**: ship as `[REQ] [SHOULD]` v1 (current position) or promote to `[REQ] [MUST]` v1?
   *Recommendation: keep `[REQ] [SHOULD]` for v1. Ship the API and the two built-in transformers (`isoStringTransformer`, `timestampTransformer`) in v1; the `DATE_SERIALIZATION` global token can follow in v1.1.*
