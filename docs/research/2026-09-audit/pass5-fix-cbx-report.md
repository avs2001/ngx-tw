# Pass 5 FIX report — combobox / select / number-input

Agent scope: `projects/ngx-tw/combobox/`, `projects/ngx-tw/select/`,
`projects/ngx-tw/number-input/`. No demo page needed a change (no rendered-DOM change
outside the additive `aria-disabled` attribute on `input[twNumberInput]`).

Per the brief I ran **no** build, `ng test`, or Playwright. Verification was by reading,
plus `npx tsc --noEmit` on both library tsconfigs (see "Type check" at the bottom).

**5 of 6 findings landed. 1 (GAPS F-02) is a deliberate stop-and-report**, taking the exit
the brief pre-authorized. Costed hand-off below.

---

## 1. SRP F-01 (HIGH) — combobox panel resize tracking dies after the first close — **FIXED**

Anchors verified before editing; all three were accurate.

**Change** (`projects/ngx-tw/combobox/combobox.ts`): deleted the
`resizeObserver?.disconnect(); resizeObserver = null;` pair from the `closeOverlay()` timer
callback, replacing it with a comment stating why the observer must survive a close.
Teardown was already present in the destroy hook, so nothing leaks.

**Why the deletion rather than the brief's suggested "call `installResizeObserver()` in the
early-return branch too".** Both fix the bug and my spec passes against either — so the
tiebreak is downstream, not correctness. `select.ts` has shipped the deletion shape (its
observer is only torn down in the destroy hook, `select.ts:1054`), so keeping the observer
alive across a close is already proven in production rather than newly introduced. It also
restores byte-parity between `closeOverlay` in the two files, which `pass5-srp.md` F-04
names as the precondition for the `PickerOverlayCoordinator` extraction the brief's
Ordering section points at. Two lines out beats two lines in.

**Spec** — `combobox.spec.ts`, `describe('overlay width')`:
`it('keeps tracking trigger resizes after a close/reopen cycle')`.

jsdom ships no `ResizeObserver` (I verified directly: jsdom 28.1.0, `typeof
ResizeObserver === 'undefined'`), so `installResizeObserver()` bails out entirely and a
real observer is not usable. The spec installs a stub on `globalThis` and restores the
previous value in a `finally` (it is a global shared with ~50 other spec files in the same
run).

**Why the assertion cannot pass against the old code.** The stub records, per instance, its
observed targets and whether `disconnect()` has been called. After open → close → reopen
the spec fires **only the observers that are still connected and are observing this
combobox host**, then asserts the overlay pane's inline width moved 480px → 640px. Under
the old code the sole observer was disconnected inside the close timer, so the live set is
empty: `expect(live.length).toBeGreaterThan(0)` fails, and the width assertion fails behind
it. The live-set filter is the whole point — firing a *disconnected* stub's stored callback
would still have called `updateOverlaySize()` and made the test vacuous, which is the trap
the brief flagged. The target filter additionally scopes the assertion away from any
observer CDK may mint while the global stub is installed.

---

## 2. SRP F-02 (LOW) — combobox backdrop/Escape subscriptions accumulate per open — **FIXED**

**Change** (`combobox.ts`): replaced `subscribeBackdrop()` + `subscribeOverlayEscape()` with
a single `subscribePerOpen()` that mirrors `select.ts:1537-1553` — a `perOpenSubs:
Subscription | null` field, unsubscribed-and-recreated at the top of the method, holding the
backdrop subscription and the `consumeOverlayEscape` teardown. `Subscription` added to the
existing rxjs import. Released in **two** places:

- the `closeOverlay()` timer callback (normal path), and
- the destroy hook — because destroy calls `clearCloseTimer()`, so a destroy landing
  mid-close would otherwise cancel the only thing that releases them.

**Correction to a claim I nearly made:** I initially assumed `select` omits the destroy-path
release and survives on `takeUntilDestroyed`. It does not — `select.ts:1053` already
releases `perOpenSubs` in its own destroy hook. So combobox is now equivalent to select on
this path rather than stricter than it, which is the outcome F-04's extraction wants.

**No spec, deliberately.** I judged it unobservable, as the brief allows: `closePanel()` is
idempotent and the Escape handler's `inputValue.set(lastCommittedLabel())` is idempotent
too, so N duplicate subscriptions produce exactly the same user-visible result as one. The
only assertable difference is the internal subscription count, which is a private field —
testing it would mean asserting on implementation detail, which CLAUDE.md's "What NOT to
test" forbids. A spec here would be ceremony, not a guard.

---

## 3. CDK F-5 (MEDIUM) — select type-ahead could activate a disabled option — **FIXED**

**Change** (`select.ts`, `applyTypeAhead`): added `!o.disabled &&` to the `findIndex`
predicate, with a comment tying it to `findEnabledFrom`.

**Spec** — `select.spec.ts`, `describe('keyboard')`:
`it('type-ahead skips a disabled option and lands on the next match')`.

The fixture is shaped to assert **skipping**, not refusal: `Apple` / `Cabbage` (disabled) /
`Carrot`, i.e. two options share the "ca" prefix and the first is disabled. Typing `c` on
the open panel must land on `-option-2`. Against the old code it lands on `-option-1` and
the assertion fails; a "not Cabbage" assertion would have passed trivially whenever
`activeIndex` happened to be `-1`, which is why I asserted the positive index. The spec then
presses Enter and asserts the value commits to `carrot` — the actual user-facing symptom
(old code: Enter silently did nothing).

Index format confirmed rather than inferred: `optionId = (index) =>
`${hostId}-option-${index}`` (`select.ts:640`) and `activeDescendantId` (`:759-764`) indexes
straight into `visibleOptions()`. The fixture is ungrouped and not searchable, so
`visibleOptions()` is the three options in declaration order and Carrot is index 2.

The spec opens the panel *before* typing. Worth recording: typing on a **closed** select
cannot be used to test this, because `applyTypeAhead` sets `activeIndex` and then the
overlay-open effect runs `initActiveIndexOnOpen()`, which clobbers the match. That is
pre-existing behaviour I did not touch.

**One behaviour change beyond the finding, flagged as the advisor asked.** A prefix that
matches *only* disabled options now yields `match === -1`, so the
`if (match >= 0) { if (!this.open()) this.openPanel(); }` branch no longer runs and the
panel no longer opens on that keystroke. I checked for fallout: `select.spec.ts` has **zero**
existing type-ahead assertions, and the only e2e one
(`e2e/specs/01-components/select.spec.ts:137`) types `j` for the enabled "Japan". So nothing
in the repo exercises the changed case. I consider the new behaviour correct — opening a
panel to highlight nothing is worse than not opening — but it is a behaviour change, not
purely a bug fix.

---

## 4. GAPS F-01 (HIGH) — `NumberInputDirective` disabled state — **FIXED (both halves)**

### The brief and the gaps report contradict each other here; I resolved it by reading, and sided with the report

The brief says "follow the disabled pattern the library's other CVA controls already
use… check how `input`/`textarea` do it and match", i.e. `'[disabled]': 'disabled()'`.
`pass5-gaps.md` F-01 says explicitly **do not** add `[disabled]`. The report is right, and
here is the evidence rather than a preference:

`NumberInputDirective.disabled` is `computed(() => this.cvaDisabled() || this.el.disabled)`
— it **reads the very DOM property** a `[disabled]` binding would write, and `el.disabled`
is not reactive so the computed memoizes it. `InputDirective` already binds
`'[disabled]': 'disabled()'` (`input.ts:179`). Two directives writing one DOM property,
where one of them also reads it, makes the resolved value depend on host-binding execution
order — which follows directive-match order and is therefore a function of the *consumer's*
`imports` array. The concrete failure: on `control.enable()`, `cvaDisabled` flips false and
the computed re-evaluates; if `NumberInputDirective`'s host bindings run before
`InputDirective` clears `el.disabled` in the same CD pass, it resolves `false || true` =
`true` and latches a stale disabled state that nothing will invalidate.

### What I actually did — and I did not use `disabled()` in the host binding either

Adding `'[attr.aria-disabled]': 'disabled() || null'` (the gaps report's own wording) would
have re-introduced the same hazard through the back door: binding `disabled()` forces the
computed to evaluate eagerly during the host-binding phase, where today it is only read
lazily at event time. So I added a dedicated, purely reactive computed:

```ts
readonly ariaDisabled = computed(() => (this.cvaDisabled() ? 'true' : null));
```

bound as `'[attr.aria-disabled]': 'ariaDisabled()'`, carrying a JSDoc block with the three
reasons. Deriving from `cvaDisabled` alone is not a compromise — it is the *correct* source:
when the element is natively disabled (static attribute, or `InputDirective`'s binding) AT
already has the state and `aria-disabled` is redundant. The only gap is
`setDisabledState(true)` on a standalone `input[twNumberInput]`, which is exactly
`cvaDisabled`. No `el.disabled` read, no memoization hazard, no ordering dependence.

I settled the underlying "is a static attribute rendered to the DOM before directives run?"
question in Angular's source rather than guessing: `setUpAttributes`
(`@angular/core/fesm2022/_debug_node-chunk.mjs:331`) writes **every** entry of `mergedAttrs`
with no filtering for names claimed as directive inputs, and it is called from
`elementLikeStartShared` (`:5587`) before `createDirectivesInstances`. So
`<input twInput twNumberInput disabled>` has `el.disabled === true` from element creation —
which is why the existing `DisabledAttrHost` assertion (`number-input.spec.ts:491-493`)
keeps passing under the new eager binding.

### Half 2 — the gates (the load-bearing half)

- `onInput()` now opens with `if (this.disabled() || this.el.readOnly) return;`, matching
  `onKeydown` / `stepBy` verbatim.
- `commitFromElement()` now opens with `if (this.disabled()) return;`, which covers both the
  blur path and the Enter path. I deliberately did **not** include `el.readOnly` here: a
  readonly field currently reformats its display on blur, and gating on readonly would have
  silently changed that. The finding is about disabled.

### Spec

`number-input.spec.ts`: new `NumberInputOnlyHost` — `<input twNumberInput [formControl]>`
with **no** `twInput` — plus
`it('reflects and enforces disabled without the sibling twInput directive')` in the
`ControlValueAccessor` block. It imports only `NumberInputDirective` from `./number-input`
plus `ReactiveFormsModule`, so it does not resolve through a possibly-stale `dist/`.

Why it cannot pass against the old code — three independent assertions, each of which fails:
`input.getAttribute('aria-disabled')` was `null` (no binding existed at all); dispatching an
`input` event after `ctrl.disable()` ran `onChange(9)` and `AbstractControl.setValue` does
not check `disabled`, so `getRawValue()` became 9 instead of 5; and the same call emitted
`valueChange`, so the event-count assertion fails. The spec also asserts
`input.disabled === false` — that is the *premise*, documenting that nothing writes the
native property in this shape, which is why every one of the five existing spec hosts (all
of which pair the two directives) was structurally incapable of catching this.

### Regression sweep on the two new gates

`commitFromElement` is reached from `onBlur` and from `onKeydown`'s `Enter` case, so I swept
every spec that touches either path rather than only the `typeInto` ones:

- `number-input.spec.ts` blur dispatches at `:332, 339, 348, 354, 379, 389, 405, 417, 565`
  and the Enter press at `:481` — **all** on `ReactiveHost`, whose control is never disabled
  in those tests. `disabled()` is false, so both gates are inert and the assertions are
  unchanged.
- `:561-568` `it('calls onTouched on blur')` still passes: the gate sits inside
  `commitFromElement`, not `onBlur`, so `onTouched()` is still called.
- `ReadonlyAttrHost` (`:489, 521`) only exercises stepping and the `readonly()` signal;
  neither dispatches `input`, and `stepBy` reads `el.value` directly rather than going
  through `commitFromElement`.
- `number-stepper.spec.ts:148-156` (`disables both buttons when the target FormControl is
  disabled`) is the one place a disabled control is read through the stepper. It asserts
  only `btn.disabled === true`, which comes from `for().disabled()` — a computed I did not
  touch. Note this test *does* force an eager read of `disabled`, which is exactly why
  `ariaDisabled` is derived from `cvaDisabled` instead.

### Known residual — stated rather than implied closed

In the standalone shape a disabled control is still **focusable and typable**: the box's
visible text can diverge from the model, because `aria-disabled` is advisory and only
`InputDirective` writes the native property. The writes are stopped, the emissions are
stopped, and AT is told — but the caret is not. Closing that would mean either binding
`[disabled]` (the collision above) or `[attr.readonly]` (which would silently change
`el.readOnly`, which `stepBy` and `onKeydown` already branch on, and which the gaps report
itself considered and rejected). I judged both worse than the residual.

---

## 5. GAPS F-02 (MEDIUM) — select's nested clear control — **NOT LANDED (stop and report)**

Taking the brief's explicit exit. The blocker is **not** the styling difficulty — it is that
I cannot verify or regenerate what the change breaks.

**Decisive constraint.** `e2e/specs/04-visual/canary.spec.ts:190-198` screenshots the
select examples page's **"Colors"** section into
`select-closed.{light,dark}.png`. I checked the fixture: `colorValues`
(`select-examples.component.ts:717-726`) seeds **6 of 8** of those selects with a value, so
`showClearButton()` is true and the clear control is inside every one of those baselines.
Both restructure paths move it. Playwright is forbidden this pass, so I can neither
regenerate the baselines nor see the result — I would be handing the orchestrator a red CI
indistinguishable from a real regression, on a change I could not look at.

I also did **not** add the report's proposed
`expect(trigger.contains(clearBtn)).toBe(false)` regression assertion: it fails today, and
landing a red guard for a bug I am not fixing is worse than none.

### Costed hand-off, so the next pass does not re-derive it

Current state (re-anchored against the tree after my edits):

- The violation: `<span role="button" tabindex="0">` at `select.ts:449-465`, nested inside
  the trigger `<button>` opened at `:414`.
- Pass 3's work is present and correct, as the register says: `onClearKeydown`
  (`select.ts:1147`), `focusTrigger()` (`:1168`, with its deliberate `isDisabled()` guard),
  the canonical focus ring in `clearButton` (`:182-183`), 24px target floor. **Only the
  content model is open.**

What breaks, by path:

**Path A — hoist the clear out of the trigger as an absolutely-positioned sibling of the
root** (`root` is already `relative inline-block w-full`, `:163`):
- Needs right-padding reservation on the trigger when `showClearButton()` is true, across
  all five pinned size steps *and* the `naked` variant (which is `px-0`), i.e. a new tv()
  variant plus compound variants. This is the fiddly half.
- The three `querySelector('button')` sites survive unchanged, because the trigger stays the
  first button in document order: `:1461` (focus return on close), `:1515`
  (`panelWidth="trigger"` measurement), `:1635`.

**Path B — combobox's structure** (`<div class="flex">` wrapper + inner flexed
`<button role="combobox">` + clear as flex sibling; `combobox.ts:269-351` is the model):
- **All three `querySelector('button')` sites break.** `:1515` is the dangerous one — it
  would measure the inner flexed button instead of the full trigger box, silently corrupting
  `panelWidth="trigger"`.
- The focus ring must move from `focus-visible:` on the button to `focus-within:` on the
  wrapper, which means reworking the `naked` / `fieldOwnsFocusRing` compound variants
  (`:226-229`, `:259-271`) — and the comment at `:221-225` records that this pair already
  has a non-obvious tailwind-merge interaction (`outline-none` vs `outline-2` sit in
  different conflict groups), so it is not a mechanical port.
- Upside: it makes select and combobox structurally identical.

Shared cost either way:
- `select.ts:1147-1155` `onClearKeydown` becomes dead code once the clear is a native
  `<button>` (Enter/Space fire `click`). It is `@internal`, so removal is not a semver event.
- `e2e/specs/01-components/select.spec.ts:309-311`: one locator to re-scope from
  `trigger.getByRole(...)` to page/root-scoped, plus the comment at `:310` that currently
  documents the violation as intentional.
- **Visual baseline regeneration for `select-closed.{light,dark}.png`.** This is the gate.
- The unit spec is unaffected: all six `select.spec.ts` clear locators
  (`:284, 755, 763, 775, 787, 802`) use
  `querySelector('[aria-label="Clear selection"]')` and survive either restructure.

My read: **Path A** is the cheaper and lower-risk of the two, because it leaves the trigger
box, the focus ring, and all three `querySelector('button')` call sites untouched. Path B is
only worth it as part of the `PickerOverlayCoordinator` work, where select and combobox are
being unified anyway.

---

## 6. GAPS F-03 (LOW) — three redundant `//` duplicates in combobox — **FIXED**

Re-verified all three anchors before deleting (they had not shifted; my other combobox edits
are all below them). Each JSDoc block genuinely already carries the `true`-default
justification, so each `//` pair was a true duplicate:

- `combobox.ts:405-408` `showChevron`
- `:410-413` `clearable`
- `:424-427` `openOnFocus`

Deleted the six `//` lines. JSDoc untouched. Pure comment deletion, no semver impact.

---

## Semver

No exported symbol renamed or removed; no required member added to an exported interface.
The only public-surface addition is `NumberInputDirective.ariaDisabled`, an `@internal`
readonly computed — additive. `subscribeBackdrop` / `subscribeOverlayEscape` were `private`,
so replacing them with `subscribePerOpen` is not consumer-visible.

## Type check

`npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json` → clean.
`npx tsc --noEmit -p projects/ngx-tw/tsconfig.spec.json` → one error, **not mine**:
`projects/ngx-tw/theme/theme.service.spec.ts(231,13)`. `git status` shows that file as a
sibling agent's in-flight edit — exactly the phantom the brief warned about. No error in any
file I own.

Note `tsc` does not type-check Angular host bindings or templates; the
`'[attr.aria-disabled]': 'ariaDisabled()'` binding references a public member, so ngtsc will
accept it.

## Files touched

- `projects/ngx-tw/combobox/combobox.ts`
- `projects/ngx-tw/combobox/combobox.spec.ts`
- `projects/ngx-tw/select/select.ts`
- `projects/ngx-tw/select/select.spec.ts`
- `projects/ngx-tw/number-input/number-input.ts`
- `projects/ngx-tw/number-input/number-input.spec.ts`

No demo or e2e file needed a change (GAPS F-02, the only finding that would have forced e2e
churn, was not landed).
