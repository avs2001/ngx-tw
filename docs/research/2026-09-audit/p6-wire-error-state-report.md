# Pass 6 — `wireErrorState()` : deduplicating the CVA error-state wiring (F-03)

Status: **landed, full suite green.**
Scope: `projects/ngx-tw/core/` + the 15 form-control class bodies. No spec outside `core/` was
touched. No public signature changed. No CVA registration moved.

---

## 1. The 15 sites, enumerated independently

F-03's count and file list were both **correct** — 15 classes across 14 files. I re-derived the list
from `grep -rn "_formSubmitRev" projects/ngx-tw --include="*.ts"` (specs excluded) rather than
trusting the finding, and the two components pass 4/5 had touched (`segmented-control`,
`number-input`) do not change the count: `segmented-control` was already in F-03's list, and
`number-input` extends `InputDirective` — it never carried a copy.

| # | File | Class | `errorState` tracked focus | `errorState` pre-check | `required` | `errors` | `NgControl` |
|---|---|---|---|---|---|---|---|
| 1 | `input/input.ts` | `InputDirective` | `_focused()` | — | ✓ | ✓ `override` | eager |
| 2 | `checkbox/checkbox.ts` | `CheckboxComponent` | `_focused()` | — | ✓ **+`requiredTrue`** | ✓ `override` | eager |
| 3 | `switch/switch.ts` | `SwitchComponent` | — | — | ✓ **+`requiredTrue`** | — | eager |
| 4 | `radio/radio.ts` | `RadioComponent` | — | **`if (parent) return parent.errorState()`** | — | — | eager |
| 5 | `radio/radio.ts` | `RadioGroupComponent` | — | — | ✓ | — | eager |
| 6 | `segmented-control/segmented-control.ts` | `SegmentedControlComponent` | — | — | ✓ | — | eager |
| 7 | `slider/slider.ts` | `SliderComponent` | `focusedThumb()` | — | ✓ | — | eager |
| 8 | `select/select.ts` | `SelectComponent` | — | — | ✓ | ✓ (no `override`) | eager |
| 9 | `combobox/combobox.ts` | `ComboboxComponent` | — | — | ✓ | ✓ (no `override`) | eager |
| 10 | `tags-input/tags-input.ts` | `TagsInputComponent` | `_focused()` | — | ✓ | ✓ `override` | eager |
| 11 | `transfer/transfer.ts` | `TransferComponent` | `_focused()` | — | ✓ | ✓ `override` | eager |
| 12 | `file-upload/file-upload.ts` | `FileUploadComponent` | `_focused()` | — | ✓ | ✓ `override` | eager |
| 13 | `date-picker/date-picker.ts` | `DatePickerComponent` | `focusedSignal()` | **`parseError() \|\| rangeError()` → true** | ✓ | ✓ `override` | **lazy** |
| 14 | `date-range-picker/date-range-picker.ts` | `DateRangePickerComponent` | `focusedSignal()` | **`parseError() \|\| rangeError()` → true** | ✓ | ✓ `override` | **lazy** |
| 15 | `time-picker/time-picker.ts` | `TimePickerComponent` | `focusedSignal()` | **`rangeError()` → true** | ✓ | ✓ `override` | **lazy** |

`TextareaDirective extends InputDirective` and `NumberInputDirective` inherit site 1; they are not
separate sites and were not edited.

### Divergences found *before* writing the helper — these determined its parameters

1. **`Validators.requiredTrue`** — `checkbox` and `switch` only. → `requiredValidators?: readonly ValidatorFn[]`.
2. **Focus signal read inside `errorState`** — 9 of 15 do it, under three different member names
   (`_focused`, `focusedSignal`, `focusedThumb`); 6 do not. → `track?: readonly (() => unknown)[]`.
3. **Pre-check short-circuit** — two shapes, not one. The pickers short-circuit to `true`; `radio`
   *delegates* to its parent and can therefore return `false`. → `errorStateOverride?: () => boolean | undefined`,
   where `undefined` falls through to the matcher and **any** boolean wins. A plain
   `() => boolean` "force true" parameter would have silently broken `RadioComponent`.
4. **`NgControl` acquisition** — 12 eager `inject(…, {self, optional})`, 3 lazy
   `injector.get(...)` in `ngOnInit`. → `ngControl: () => NgControl | null` (a required getter).
5. **`_ngControlRev` is read by members outside the block** — `disabled` / `isDisabled` computeds at
   `input`, `file-upload`, `date-picker`, `date-range-picker`, `time-picker` read the same revision
   signal. → the wiring exposes `rev: Signal<number>`.
6. **`_ngControlRev` is bumped from outside `ngOnInit`** at 13 places (blur handlers, `notifyTouched`,
   `onFocusOut`, post-lazy-lookup). → the wiring exposes `bump()`.
7. **`missing bump` asymmetry** — `date-picker` and `time-picker` bump the revision immediately after
   the lazy `NgControl` lookup; **`date-range-picker` does not.** See §5.

`defaultMatcher` (`inject(TW_ERROR_STATE_MATCHER)`), `parentForm` (`NgForm`) and `parentFormGroup`
(`FormGroupDirective`) are used **nowhere** outside this block at any of the 15 sites (verified by
grep), so the helper injects all three and the site fields were deleted.

---

## 2. What was built

`projects/ngx-tw/core/error-state-wiring.ts` (223 lines, ~110 of them JSDoc), exported from
`core/index.ts` as `wireErrorState` + the types `ErrorStateWiring` / `ErrorStateWiringOptions`.

```ts
export function wireErrorState(options: ErrorStateWiringOptions): ErrorStateWiring;

interface ErrorStateWiringOptions {
  readonly ngControl: () => NgControl | null;              // required
  readonly matcher?: () => ErrorStateMatcher | undefined;
  readonly required?: () => boolean;
  readonly requiredValidators?: readonly ValidatorFn[];    // default [Validators.required]
  readonly track?: readonly (() => unknown)[];
  readonly errorStateOverride?: () => boolean | undefined;
}

interface ErrorStateWiring {
  readonly errorState: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly errors: Signal<Record<string, unknown> | null>;
  readonly rev: Signal<number>;
  bump(): void;
  connect(): void;   // call from ngOnInit
}
```

Three design decisions worth recording:

- **Two-phase, on purpose.** `wireErrorState()` runs in the injection context (a field initializer);
  `connect()` runs from `ngOnInit`. The subscription *cannot* move into the constructor —
  `NgControl.control` is populated by the parent `FormControl*` directive's `ngOnChanges`, which runs
  after children's constructors and before their `ngOnInit`. All 15 sites already had an `ngOnInit`.
- **Every option is a callback, not a `Signal`.** Class field initializers run top-to-bottom, and
  three sites (`slider`, `switch`, `radio`'s group) declare `required` *above* their DI block. With
  `Signal` parameters those would have captured `undefined` at construction and thrown at first read.
  With callbacks the options are order-independent; only the `errorWiring` field itself has to precede
  the members that alias it, which I handled by hoisting the call at those three sites (each carries a
  one-line comment saying why).
- **The helper does not inject `NgControl`.** Constraint 2 of the brief and the CLAUDE.md trap both
  point the same way: the host owns that reference because it owns CVA registration. Passing a getter
  also unifies the eager and lazy sites. **Zero CVA registrations were moved, added or removed** — the
  four Shape-B controls keep their static `NG_VALUE_ACCESSOR`, and every Shape-A control keeps its
  constructor assignment. `git diff` contains no `valueAccessor` or `NG_VALUE_ACCESSOR` hunk.

---

## 3. Line delta

| | + | − | net |
|---|---|---|---|
| 15 sites (production) | 265 | 786 | **−521** |
| `core/error-state-wiring.ts` (new) | 223 | — | +223 |
| **Production total** | | | **−298** |
| `core/error-state-wiring.spec.ts` (new) | 351 | — | +351 |

F-03 estimated "≈550 deleted, ~90 added, ~450 net". Deletions came in at 786 (higher, because the
sites also shed three DI lines and several now-dead imports each); the helper came in at 223 rather
than 90 because roughly half of it is the JSDoc that CLAUDE.md requires on new public API, and it
carries the four parameters the specialization survey showed were mandatory.

---

## 4. Non-vacuity: five deliberate breaks, each rebuilt and run against the full suite

A dedup nobody's tests would notice breaking is worthless, so I broke the helper five ways. Each run
was a full `npm run build:lib` + `ng test ngx-tw` (specs resolve `@cdevhub/ngx-tw/*` through `dist/`,
so a rebuild between breaks is mandatory).

| Break | What was removed | Result | Which specs caught it |
|---|---|---|---|
| **A** | `ngSubmit` subscription in `connect()` | 2 files / 2 tests red | `input.spec.ts › turns on errorState after ngSubmit even without touched`; `core/error-state-wiring.spec.ts › turns errorState on when the parent form is submitted` |
| **B** | `statusChanges`/`valueChanges` subscription in `connect()` | **13 files / 33 tests red** | checkbox (6), combobox (4), core (4), date-picker (1), file-upload (1), input (2), number-input (1), segmented-control (2), radio (3), select (4), switch (2), textarea (2), tags-input (1) |
| **C** | `track` sources no longer read in `errorState` | **1 file / 1 test red** | `core/error-state-wiring.spec.ts` only |
| **D** | `errorStateOverride` ignored | 4 files / 5 tests red | date-picker (2), radio (1), time-picker (2), core (1) |
| **E** | `requiredValidators` option ignored (always `[Validators.required]`) | 3 files / 3 tests red | checkbox (1), switch (1), core (1) |

**My own spec was vacuous on first write and I caught it with break A.** The original "form
submitted" test only read `errorState()` *after* dispatching submit, so the computed evaluated fresh
against an already-`submitted` `FormGroupDirective` and passed even with the subscription deleted. I
hardened four tests to read-then-mutate-then-read (each carries a comment saying why), added a
`required` re-derivation test, and re-ran break A — the core spec then went red alongside
`input.spec.ts`. Breaks B–E were run against the hardened spec.

### Finding from the break matrix (report-only, no change made)

- **Break A (`ngSubmit`) is guarded at exactly one of 15 sites.** Only `input.spec.ts` submits a form
  and asserts error state on an untouched control. The other 14 sites carry byte-identical `ngSubmit`
  wiring that **no test would notice disappearing**. Before this pass that meant 14 unguarded copies;
  after it, one shared implementation guarded by two tests. That is a strict improvement, but a future
  pass may want per-site coverage.
- **Break C (focus tracking) had zero existing coverage.** Nine components read a focus signal inside
  `errorState` specifically so a blur-driven `touched` flip repaints the error border, and not one
  component spec exercised it. It is now guarded once, in `core/`.
- **Break D at `date-range-picker`** was caught by date-picker, time-picker and radio — but **not** by
  `date-range-picker.spec.ts`, which has no parse/range-error → `aria-invalid` assertion.

---

## 5. What I deliberately did **not** change

1. **`date-range-picker` still does not bump the revision after its deferred `NgControl` lookup.**
   `date-picker.ts:1020` and `time-picker.ts:989` both call `bump()` immediately after
   `injector.get(NgControl, …)`; `date-range-picker.ts` never has. `connect()` subscribes but does not
   bump, so the asymmetry survives the extraction unchanged and stays greppable. Normalising it would
   have been a behaviour change smuggled inside a dedup — exactly what the brief forbids. I added an
   explanatory comment at the site (`date-range-picker.ts`, in `ngOnInit`) so the next reader sees it
   is deliberate preservation, not an oversight. **Recommended as a separate one-line fix with its own
   spec**; the practical symptom is that anything read off `ngControl` before `ngOnInit` (`isDisabled`,
   `required`, `errorState`) keeps its `null`-era value until the first status/value emission.
2. **No `errors` member was added anywhere it did not already exist.** `switch`, `radio` (both
   classes), `segmented-control` and `slider` still have none. The wiring computes one, but an unread
   `computed()` never evaluates, and adding the member would change what `[twError match="…"]` renders
   under those controls — a behaviour change.
3. **No `required` member was added to `RadioComponent`.** It never had one.
4. **`FormFieldControl` is untouched.** No member added, required or optional (brief constraint 4).
5. **`core/form-reset.ts` left alone.** It is still unexported and unimported. It was the structural
   precedent for the helper's shape, nothing more; deleting or exporting it is out of scope.
6. **`getter`-style `track` at the sites, signal-reference style in the spec.** The 9 production sites
   pass `[() => this._focused()]` so a future field reorder cannot capture `undefined`.

---

## 6. Semver

Additive only. `wireErrorState`, `ErrorStateWiring`, `ErrorStateWiringOptions` are three new exports
from `@cdevhub/ngx-tw/core`. Nothing exported was renamed, removed, or had its signature changed. All
15 sites keep their existing member names, types and `override` modifiers — I preserved the
`override` / no-`override` split exactly (`combobox` and `select` implement `FormFieldControl` as an
interface, the rest extend the abstract class; getting this wrong is green locally and TS4113 on CI,
per the `textarea.ts` note).

**Root barrel:** `projects/ngx-tw/src/public-api.ts:8` is `export * from '@cdevhub/ngx-tw/core';`,
so the three new symbols reach the root barrel automatically — **no change was needed there, and I
confirmed it rather than assuming it.** (Had it been a named re-export list, the new exports would
have been silently absent from the root barrel and the build would still have passed.)

**MCP guidance:** `projects/ngx-tw/core/core.meta.ts` is hand-written and would otherwise have gone
stale, so I added one `whenToUse` entry describing `wireErrorState` and two `aliases`
(`wireErrorState`, `error state wiring`). Symbol extraction is automatic (573 → 586 symbols); only
the prose needed the edit.

**One packaging consequence worth flagging:** the `core` entry point's emitted bundle now imports
`@angular/forms` at runtime (previously only `import type`). Verified against the built output —
`dist/ngx-tw/fesm2022/cdevhub-ngx-tw-core.mjs` imports `@angular/core`, `@angular/core/rxjs-interop`,
`@angular/cdk/{a11y,overlay,portal}`, `@angular/forms`, `rxjs`, `rxjs/operators`, `tailwind-variants`.
`@angular/forms` is already declared in `projects/ngx-tw/package.json` peerDependencies, so the pnpm /
Yarn-PnP hazard CLAUDE.md documents does not apply. `"sideEffects": false` is set, so consumers who
import only `TwColor` from `core` still tree-shake it away.

---

## 7. Verification

- `npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json` — clean.
- `npx eslint` over all 17 touched/new files — clean (this also caught six now-dead imports:
  `takeUntilDestroyed` ×6, `Validators` ×3, plus an orphaned `DestroyRef` injection in
  `segmented-control`, all removed).
- `npm run build:lib` — exit 0.
- `npm test` (both projects, as CLAUDE.md requires) — **82 library spec files / 3369 tests passed,
  4 skipped; 2 demo spec files / 4 tests passed.** Re-run clean after the `core.meta.ts` edit. Logs: `scratchpad/p6-wire-{build,test}.log`,
  break logs `scratchpad/p6-wire-break{A,A2,B,C,D,E}.log`.
- **No existing spec was modified.** `git status` shows spec changes only in `carousel/` and `theme/`,
  which belong to sibling agents.

### Two process notes

1. **My prompt authorised `npm run build:lib` / `npm test`; `pass5-fix-brief.md` forbids them.** I
   followed the prompt, since it states the condition that made the prohibition necessary. That
   condition turned out **not** to hold: a sibling agent was actively editing `carousel/` and running
   `npm run build:lib` throughout. Three of my runs failed for reasons that were not mine —
   `dist/ngx-tw/` was mid-rewrite, producing bogus `Cannot find module '@cdevhub/ngx-tw/{sort,menu,
   collapsible,calendar,form-field}'` cascades (and, downstream, spurious TS4112 `override` errors in
   my own files). One run also died with a vitest `Worker exited unexpectedly` under CPU contention.
   All three cleared on retry with no source change. **If the orchestrator sees this failure
   signature, re-run before attributing it.**
2. The baseline `npm test` I captured before starting was itself red for this reason (18 failed
   suites, all `Missing "./x" specifier in "@cdevhub/ngx-tw" package`), so I have no clean
   pre-change baseline number to diff against. The post-change run is clean, and no spec file outside
   `core/` differs from `HEAD`, which is the stronger guarantee.

---

## 8. Files touched

New:
- `projects/ngx-tw/core/error-state-wiring.ts`
- `projects/ngx-tw/core/error-state-wiring.spec.ts`

Modified:
- `projects/ngx-tw/core/index.ts` (3 new exports)
- `projects/ngx-tw/core/core.meta.ts` (MCP guidance for the new helper)
- `projects/ngx-tw/input/input.ts` (also: one class-level `{@link TW_ERROR_STATE_MATCHER}` → backticks, since the import is gone)
- `projects/ngx-tw/checkbox/checkbox.ts`
- `projects/ngx-tw/switch/switch.ts`
- `projects/ngx-tw/radio/radio.ts` (two classes)
- `projects/ngx-tw/segmented-control/segmented-control.ts`
- `projects/ngx-tw/slider/slider.ts`
- `projects/ngx-tw/select/select.ts`
- `projects/ngx-tw/combobox/combobox.ts`
- `projects/ngx-tw/tags-input/tags-input.ts`
- `projects/ngx-tw/transfer/transfer.ts`
- `projects/ngx-tw/file-upload/file-upload.ts`
- `projects/ngx-tw/date-picker/date-picker.ts`
- `projects/ngx-tw/date-range-picker/date-range-picker.ts`
- `projects/ngx-tw/time-picker/time-picker.ts`

Not touched (inherit the wiring): `projects/ngx-tw/textarea/textarea.ts`,
`projects/ngx-tw/number-input/number-input.ts`.
