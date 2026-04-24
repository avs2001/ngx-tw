# Calendar Component — Open Decisions

Extracted from `docs/requirements/calendar-component-requirements.md` (v2.3).

Open decisions are entries tagged `[DEC]` in the requirements document — items that must be resolved before implementation. Each entry below records the current default recommendation (where one exists), the MoSCoW priority, and the requirements section it originates from.

---

## 1. Angular version support — backport to 17–20?

- **Source:** §3 Compatibility & Environment (line 111)
- **Tag:** `[DEC]`
- **Question:** Should the component support Angular 17–20 in addition to Angular 21?
- **Default recommendation:** **21-only.**
- **Notes:** Angular 21+ is a hard `[REQ] [MUST]` primary target. A backport would affect signal-based API usage, zoneless CD compatibility assumptions, and Signal Forms integration (§6.3).

---

## 2. `@angular/cdk` as a peer dependency?

- **Source:** §3 Compatibility & Environment (line 118)
- **Tag:** `[DEC]`
- **Question:** Should `@angular/cdk` be a declared peer dependency?
- **Default recommendation:** **Yes.**
- **Notes:** Existing peer dependencies already locked: `@angular/core`, `@angular/common`, `@angular/forms`. CDK would supply overlay, focus trap, a11y, and coercion primitives that the calendar already relies on conceptually.

---

## 3. `persistentStateId` — localStorage-backed state persistence

- **Source:** §8.6 State Persistence Across Re-mount (line 431)
- **Tag:** `[DEC] [COULD]`
- **Priority:** COULD (deferred to v1.1 or later)
- **Question:** Ship a `persistentStateId: string` input that persists calendar state to `localStorage` across browser sessions?
- **Default recommendation:** **Deferred to v1.1+.**
- **Dependencies / open concerns:**
  - Requires the §7.6 `valueTransformer` for serialization.
  - Needs a cache-invalidation strategy.
  - Needs an explicit user-consent model.
- **v1 baseline:** In-memory `stateId` (coordinator-scoped) ships in v1; no localStorage by default.

---

## 4. Mobile full-screen / responsive overlay mode

- **Source:** §18.5 Responsive full-screen mode (line 916)
- **Tag:** `[DEC]`
- **Priority:** SHOULD (per default rec)
- **Question:** Ship a responsive full-screen modal mode on small viewports?
- **Default recommendation:** **SHOULD ship in v1** for overlay mode on viewport < 600px.
- **Proposed API:** `mobileMode: 'overlay' | 'fullscreen' | 'bottom-sheet' | 'auto'`.
- **Notes:** Must compose with §18.6 iOS safe-area handling and §9.5 virtual-keyboard suppression.

---

## 5. Non-Gregorian calendar adapters

- **Source:** §19.5 Non-Gregorian calendars (line 955)
- **Tag:** `[DEC] [COULD]`
- **Priority:** COULD (v2+)
- **Question:** Ship Hebrew, Islamic, Buddhist, and/or Japanese `DateAdapter` implementations?
- **Default recommendation:** **Defer to v2+.**
- **v1 baseline:** Gregorian adapter only (`[REC]`). The `DateAdapter` contract (§20.1) is required to be Gregorian-agnostic so these can land later without a breaking change.

---

## 6. Which third-party date adapters ship in v1?

- **Source:** §20.4 Shipped adapters (line 1000)
- **Tag:** `[DEC]`
- **Question:** Of Luxon, date-fns, and Temporal — which (if any) ship in v1 as secondary entry points?
- **Default recommendation:** *(none stated)*
- **v1 baseline:** `NativeDateAdapter` is `[REQ] [MUST]`. Third-party adapters are all currently undecided.
- **Selection factors to consider:** bundle cost, timezone-awareness surface (§4.2), ecosystem adoption, Temporal polyfill maturity.

---

## 7. Event-layer / schedule-mode customization

- **Source:** §24.3 Layer 3 — Events (deferred) (line 1230)
- **Tag:** `[DEC] [WONT]`
- **Priority:** WONT (v1)
- **Question:** Should day cells support event-driven schedule semantics (drag, resize, create-by-drag, multi-day event bars)?
- **Default recommendation:** **Explicitly deferred from v1.** Scope is reserved for a sibling "schedule mode" component in v2+.
- **Notes:** Reinforces the §2 scope statement that the calendar is a range-capable date picker, not a calendar surface. The layered cell API (Layer 1 badges, Layer 2 cell template) remains in v1.

---

## Summary table

| # | Topic                                         | Section | MoSCoW       | Default recommendation             |
|---|-----------------------------------------------|---------|--------------|------------------------------------|
| 1 | Angular 17–20 backport                        | §3      | —            | 21-only                            |
| 2 | `@angular/cdk` peer dep                       | §3      | —            | Yes                                |
| 3 | `persistentStateId` (localStorage)            | §8.6    | COULD        | Defer to v1.1+                     |
| 4 | Mobile full-screen overlay                    | §18.5   | SHOULD       | Ship in v1 for viewport < 600px    |
| 5 | Non-Gregorian adapters (Hebrew/Islamic/…)     | §19.5   | COULD        | Defer to v2+                       |
| 6 | Luxon / date-fns / Temporal adapters in v1    | §20.4   | —            | *(unresolved)*                     |
| 7 | Event/schedule-mode cell layer                | §24.3   | WONT         | Defer to v2+ (sibling component)   |
