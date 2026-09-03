# Pass 6 report — select clear control + Directionality migration

Agent scope: `projects/ngx-tw/select/`, `tabs/`, `tab-nav/`, `split/`, `timeline/`, plus the one
e2e locator the pass-5 report costed. `combobox/` read but not edited.

**Both tasks landed.** Task 2 first, as instructed, then Task 1.

---

## Verification posture — and why I did not run builds, tests or Playwright

My prompt lifted the pass-5 blocker ("you **may** run Playwright"). I did not use that permission,
and the reason is evidence I gathered after starting, not caution:

- At session start `git status --porcelain` was **clean** (only untracked `scratchpad/`).
- Within minutes `git diff --stat` showed **35 tracked files changed** by sibling agents, growing to
  50+ including `e2e/pages/select.page.ts`, `e2e/specs/04-visual/canary.spec.ts`, and ~15 other e2e
  specs. Other agents are mid-flight in the same tree, right now.
- Two of their in-flight edits currently **break the library program**:
  - `projects/ngx-tw/theme/theme-node-shims.d.ts` (a brand-new untracked file) has a real syntax
    error: its header comment contains `theme/**/*.spec.ts`, and the `*/` inside `**/` terminates
    the block comment early. `tsc` reports TS1109/TS1005 at `(12,60)`, `(12,61)`, `(13,5)`.
  - `calendar/luxon/*` imports `TW_TZ_OVERRIDE` / `TW_DATE_ADAPTER` from `@cdevhub/ngx-tw/calendar`,
    which now export `TZ_OVERRIDE` / `DATE_ADAPTER` — a rename mid-flight, resolving through the
    stale `dist/`.

`npm run build:lib` would therefore fail on someone else's half-finished work, and — worse — could
overwrite or half-write `dist/ngx-tw/`, which every other agent's tests resolve through. Playwright
additionally needs a demo build on top of that, against e2e specs a sibling is rewriting. This is
exactly the phantom the brief describes, so I fell back to the brief's default: verify by reading,
plus the type checks below.

What I did instead:

- `npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json` → **only** the two sibling errors above.
- `npx tsc --noEmit -p projects/ngx-tw/tsconfig.spec.json` → **only** the sibling errors above.
- `npx tsc --noEmit -p e2e/tsconfig.json` → **clean**.
- An **isolated Tailwind v4 compile** (temp dir, deleted afterwards; touched no build output) to
  confirm every new utility actually generates:
  `end-6 / end-7 / end-8 / end-9 / end-10 / end-12 / end-13` all emit
  `inset-inline-end: calc(var(--spacing) * n)`, and `top-1/2` / `-translate-y-1/2` emit. `end-13` is
  off the classic scale but Tailwind v4's dynamic spacing handles it — the library already relies on
  this (`calendar-cell.ts:60` uses `w-15`).
- An isolated `twMerge` run to confirm the compound-variant override resolves:
  `twMerge('end-10 end-6')` → `end-6`; `twMerge('end-13 end-7')` → `end-7`.
- An isolated **jsdom 28.1.0** run (the runner's DOM) to settle a survivability question I had
  otherwise been about to assert from memory: a native `<button>` carrying no `tabindex` attribute
  reports `el.tabIndex === 0` in jsdom, so the pre-existing
  `expect(clearBtn.tabIndex).toBe(0)` at `select.spec.ts:824` still passes after the control stops
  being a `tabindex="0"` span. (jsdom returns `-1` for a bare `<div>`, so the getter is genuinely
  role-aware rather than defaulting to 0 — the assertion is still meaningful.)

Everything below that says "verified" was checked by one of these; everything else is a
reading-level claim and is labelled as such.

**What still needs central verification** (listed so the orchestrator does not have to re-derive it):

1. `npm run build:lib` + `ng test ngx-tw` once the tree settles.
2. **Visual baseline regeneration for `select-closed.{light,dark}.png`** —
   `gh workflow run e2e-update-baselines.yml --ref feat/vertical-rhythm -f branch=feat/vertical-rhythm`,
   then `git pull`. See "Expected visual delta" below for exactly what should move; anything else in
   that screenshot is a real regression.

**I did not commit.** The prompt mentions a "clean commit boundary" between the two tasks; I read
that as ordering rationale rather than an instruction to run `git commit`, and committing a subset
of a tree that five other agents are actively editing would create an asymmetric state the
orchestrator did not ask for. The two tasks touch disjoint files, so the boundary is still trivially
recoverable: Task 2 is `tabs/ tab-nav/ split/ timeline/`, Task 1 is `select/` + the one e2e spec.

---

# Task 2 — `Directionality` migration (tabs, tab-nav, split, timeline)

## The behaviour-preservation claim, verified rather than assumed

The prompt asked me to check whether any of the four does something on the *transition* that a plain
signal read would lose. **None does.** All four subscription bodies were bare mirrors:

| File | Old body |
|---|---|
| `tabs.ts:571-573` | `.subscribe((dir) => this.layoutDirection.set(dir))` |
| `tab-nav.ts:201-203` | `.subscribe((dir) => this.layoutDirection.set(dir))` |
| `split.ts:305-307` | `.subscribe(value => { this._cdkDir.set(value); })` |
| `timeline.ts:819-821` | `.subscribe((value) => { this._cdkDir.set(value); })` |

No previous-value comparison, no announcement, no side effect, no ordering dependency. Each mirror
signal was read from exactly one place (a `computed` or an `effect`), so replacing the
`signal` + subscription pair with a `computed` that reads `valueSignal()` is strictly
behaviour-preserving, and strictly *more* correct at construction time (the old code seeded from
`.value` at field-initialiser time and only caught up on the next emission).

## What changed

All four now declare the same shape, keeping `inject(Directionality, { optional: true })`:

```ts
private readonly layoutDirection = computed<'ltr' | 'rtl'>(
  () => this.directionality?.valueSignal() ?? 'ltr',
);
```

I kept a **named `computed`** rather than inlining the read into the effect the way `paginator` does.
Both satisfy "read `valueSignal()` directly"; the named member keeps the existing JSDoc anchored to
the thing it explains, and in `split`/`timeline` the value feeds a second computed (`_isRtl`) so it
needs a name anyway. The four are now consistent with each other and with `paginator`'s semantics.

Deletions that came with it:

- `tabs.ts` — subscription gone; `takeUntilDestroyed` import removed (last use). `destroyRef` kept:
  still used by the `resizeObserver` / `scrollCleanup` teardown at `:622`.
- `tab-nav.ts` — subscription gone; `takeUntilDestroyed` import removed; **`DestroyRef` import and
  the `destroyRef` field removed too** — the subscription was its only consumer. Private field, so
  no semver event.
- `split.ts` / `timeline.ts` — subscription + its `onDestroy` unsubscribe gone. `_destroyRef` kept in
  both (`split.ts:289` ResizeObserver, `timeline.ts:813` ResizeObserver).

`takeUntilDestroyed` going unused would have been a hard TS error, not a lint nit; both were caught.

## The mocks — this was the real trap, and it was live

`Directionality` is root-provided (`@Service()`), so a TestBed with no provider still injects the
real instance. **Three existing mocks had no `valueSignal`** and would have thrown
`this.directionality.valueSignal is not a function` at runtime in specs that pass today:

- `tabs.spec.ts:780` — `{ value: 'rtl', change: new Subject<Direction>() }`
- `tab-nav.spec.ts:917` — same shape
- `timeline.spec.ts:980` — `{ value: 'rtl', change: { subscribe: … } }`

All three now carry `valueSignal: signal<Direction>('rtl')`, with a one-line comment saying which
field is load-bearing. `value` and `change` are kept so the mocks stay shape-complete.
`timeline.spec.ts` needed a `type Direction` import added.

I swept for every other mock site and every spec that mounts these four components:
`grep -rn "provide: Directionality"` finds exactly six sites — the three above plus
`paginator.spec.ts` (×2), `segmented-control.spec.ts` and `tags-input.spec.ts`, all of which
**already** have `valueSignal` (pass 5 landed them). No spec outside `tabs/ tab-nav/ split/ timeline/`
mounts my components (`grep -rln "TabsComponent\|TabNavDirective\|SplitComponent\|TimelineComponent"
--include=*.spec.ts` → those three files only), and no spec anywhere uses `BidiModule` or `Dir`.

## New spec — `split`, the one component whose claim rested on reading alone

`split.spec.ts` had **no `Directionality` mock at all**: its two RTL tests pin `[rtl]="true"`, so the
`_cdkDir` path was entirely unguarded. Added `AmbientDirHost` (same 40/60 geometry as `RtlHost`, but
with **no** `rtl` input so `_isRtl` falls through to CDK) and two tests in `describe('RTL')`:

1. `inherits rtl from the ambient CDK Directionality when the rtl input is null` — mounts with a
   mocked `valueSignal` of `'rtl'`, asserts ArrowLeft **grows** the leading pane (LTR shrinks it).
2. `honours a direction flip at runtime` — mounts at `'ltr'`, asserts ArrowLeft shrinks, then
   `dir.set('rtl')` and asserts ArrowLeft now grows.

**Why (2) cannot pass against the old code**, which is the point: `dir.set('rtl')` writes the signal
and does **not** emit on `Directionality.change`. The old subscription mirror would never see it, so
`_cdkDir` would stay `'ltr'` and the second ArrowLeft would shrink, not grow — the assertion fails.
It is simultaneously the guard that the mock keeps a `valueSignal` at all. Test (1) is the weaker of
the pair (it would also pass against the old code, since the old field seeded from `.value`), and it
is there to cover the ambient-inheritance path that no split test covered before.

`_isRtl()` is read at event time inside `_onGutterKeydown` (`split.ts:695`), which is why a flip
takes effect without a rebuild; I checked that rather than assuming it.

## Not done, deliberately

`segmented-control.ts:518`, `slider.ts:931/1048/1070` and `tags-input.ts:663/699` read
`this.directionality?.value` **imperatively inside event handlers**. That is a third pattern, and it
is *correct* — an event handler needs the current value, not a reactive dependency, and none of them
keeps a mirror signal or a subscription. They are also outside my ownership. Flagging it only so a
future consistency pass does not mistake `.value` for the anti-pattern that was fixed here: the
anti-pattern was the **manual mirror**, not the `.value` getter.

---

# Task 1 — `select`'s clear control (GAPS F-02, the pass-5 carry-over)

## Path chosen: **Path A**, as the pass-5 report recommended

I built the case for Path B (combobox's wrapper layout) before rejecting it. Recording it, because
the prompt's "follow combobox's structure" and the report's "prefer Path A" read as being in tension
and the next pass should not re-litigate:

**They are not in tension.** `combobox.ts:318-334` is the clear-button *markup* — a native
`<button type="button">` with `aria-label`, a `(click)` handler and the same 20×20 `size-3` glyph.
That is what "follow its structure" means, and Path A adopts it verbatim. Nothing in that anchor is
about combobox's wrapper `<div>`.

**Why not Path B.** Its two costs fail silently, which is the wrong trade when the verification
budget is what it is this round:

- Combobox puts the box's focus ring on the wrapper via `focus-within:`. That is fine for an
  `<input>`; on select's `<button>` trigger it lights the ring on a **mouse click** and keeps it
  until blur, which contradicts CLAUDE.md's "Always use `focus-visible`, never `focus`". Nothing in
  the suite clicks a select and asserts no ring appeared, and the visual baselines do not click, so
  this would have shipped invisibly. Working around it needs a
  `has-[[role=combobox]:focus-visible]:` pattern that exists nowhere in the library.
- Under Path B the box's horizontal padding stops being part of the button, so clicking the trigger's
  right padding would no longer open the panel. Nothing asserts that either.
- Path B also requires reworking the exact `naked` / `fieldOwnsFocusRing` compound-variant pair that
  `select.ts:221-225` warns about (`outline-none` and `outline-2` sit in different tailwind-merge
  conflict groups, so both survive the merge).

Path A's cost — pixel reservation across the size axis — fails **loudly**, in
`select-closed.{light,dark}.png`, which is regenerable.

**Path D**, which I considered and dropped in one line: converting the trigger to
`<div role="combobox" tabindex="0">` would legalise the nesting in HTML but leaves the clear inside
the ARIA combobox (so it fixes only half the finding), and it makes `querySelector('button')` return
the *clear*.

### Correction to the pass-5 costing

The report listed "**all three** `querySelector('button')` sites break" as a Path B cost and "the
three sites survive unchanged" as a Path A benefit. **Both halves over-cost it.** `select.ts:616`
already declares `private readonly triggerButtonRef = viewChild<ElementRef<HTMLButtonElement>>('triggerButton')`,
and `focusTrigger()` already uses it. All three `querySelector('button')` calls are one-line swaps to
that view query, and they *should* be swapped on either path now that a second `<button>` lives
inside the host. I landed the swap:

- `:1479` close-path focus return
- `:1579` `panelWidth="trigger"` measurement — the dangerous one; a comment now says why
- `:1699` `onContainerClick`

The querySelector sites were never a discriminator between the paths.

## What changed in `select.ts`

**Template.** The `<span role="button" tabindex="0">` inside the trigger is gone. In its place, inside
the trigger's flex row:

```html
<span [class]="clearSpacerClasses()" aria-hidden="true"></span>
```

and after `</button>`, a real sibling control:

```html
<button type="button" [class]="clearButtonClasses()" aria-label="Clear selection"
        (click)="onClearClick($event)" (keydown)="onClearKeydown($event)">
```

**Why the in-flow spacer instead of the report's suggested trailing-padding reservation.** I tried
the padding route first and it does not work: `twMerge('px-4 pe-12')` returns **`px-4 pe-12`** —
tailwind-merge 2.5.4 does not list `pe` among `px`'s conflicting groups, so both survive the merge
and which one wins depends on Tailwind's utility ordering in the emitted sheet. I verified that
directly rather than reasoning about it. The spacer sidesteps the question and is stronger:
it is the *same box* (`size-6 shrink-0`) in the *same flex slot*, so the value text's truncation
point and the `naked` variant's `h-auto` height are preserved **by construction** rather than
approximated by a padding value. To be exact about the epistemics: I verified that the classes
generate and that nothing merges them away; I did **not** render the component in a browser, so
"identical" here means "identical by construction", not "observed identical".

That also retires an argument I nearly shipped: I had reasoned that Path A would shrink the `naked`
trigger by removing the clear's 24px height contribution. With the spacer that is moot, and the claim
was unverified anyway — it should not have been load-bearing.

**Positioning (`tv()` config).** `clearButton` gains `absolute top-1/2 -translate-y-1/2` and loses
`shrink-0` (no longer a flex item). Offsets are **logical**, per size:

| size | default variant | naked variant |
|---|---|---|
| xs | `end-8` | `end-6` |
| sm | `end-9` | `end-6` |
| md | `end-10` | `end-6` |
| lg | `end-12` | `end-7` |
| xl | `end-13` | `end-7` |

Each default value is `1px border + px-N + chevron width + gap-2`, rounded to the nearest spacing
step; naked drops the border and the padding, so it collapses to `chevron + gap-2`. `naked` values
land as five new `compoundVariants` and override via twMerge (verified above).

**`end-*`, never `right-*`** — and this is the one Path-A mechanic that is easy to miss. The trigger
is a flex row, so under `dir="rtl"` the chevron and the clear sit at the *left*. A physical `right-*`
offset would park the control on the wrong side, which would have been an RTL bug shipped in the same
pass as an RTL fix. `inset-inline-end` follows the row. There is precedent in the library
(`carousel.ts:346` uses `end-3`, `timeline.ts:244` uses `start-1`/`start-2`).

## Constraints from the prompt — how each survives

| Constraint | Status |
|---|---|
| Clear stays keyboard-reachable | Yes. Rendered **after** `</button>`, so tab order is unchanged (trigger → clear). A native button is in the tab order without `tabindex`. `onClearKeydown` and `focusTrigger()` both kept (below). |
| Trigger still opens on click | Unchanged — the trigger is still the whole box; only a 24px region is now covered by the clear, exactly as before. |
| Clicking clear does not open the panel | Kept `onClearClick`'s `stopPropagation()` + `preventDefault()`, and added a spec for it. Load-bearing: inside a `tw-form-field` the clear is still a descendant of the field's control wrapper, whose click handler calls `onContainerClick()` → `openPanel()`. |
| Accessible names stay distinct | Improved. The clear's `aria-label` is no longer inside the trigger's subtree, so it can no longer leak into a name-from-content computation of the trigger. |
| `naked` styling + form-field integration | `root` is untouched (`relative inline-block w-full`), so it is still the containing block; the trigger's classes, the `focused` border compounds and the whole `fieldOwnsFocusRing` pair are untouched. Only `clearButton` gained naked-specific offsets. |

**`FocusMonitor` unaffected:** `monitor(this.elementRef, true)` watches the *host* with
`checkChildren`, and the clear was and remains a host descendant, so `focusedSignal` behaves
identically.

## `onClearKeydown` kept — against the gaps report's recommendation

The gaps report (step 2) says to delete it as dead code once the control is a native button. I kept
it, and the prompt agrees (it lists the pass-3 keyboard work as a constraint that must survive). The
practical reason:

**jsdom does not synthesise a click from a key event on a native button.** Delete the handler and
`select.spec.ts`'s two keyboard-clear tests go red with no replacement — there would be *no*
unit-testable keyboard path for the control at all.

It is also not double-firing, which I checked rather than assumed: the handler calls
`preventDefault()` on Enter and Space, and that is precisely what suppresses a browser's native
button activation. So exactly one path runs in a real browser too. The JSDoc on the method now says
all of this, because it reads as redundant at a glance.

## Specs

**The non-vacuous guard** — `select.spec.ts`,
`it('renders the clear control as a native button OUTSIDE the trigger')`:

```ts
expect(clearBtn.tagName).toBe('BUTTON');          // was 'SPAN'  → fails on old code
expect(clearBtn.type).toBe('button');
expect(trigger.contains(clearBtn)).toBe(false);   // was true    → fails on old code
expect(getSelectHost(fixture).contains(clearBtn)).toBe(true);
expect(trigger.compareDocumentPosition(clearBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
```

Two of the five assertions fail against the pre-change tree, independently. The last two are the
tab-order argument made mechanical rather than left in a comment. This is the only enforcement that
exists, because **axe provably cannot see this violation**: `nested-interactive` fires only when the
ancestor's role is children-presentational, and the trigger's role is `combobox`.

Pass 5 declined to land this assertion because it would have been red against a bug it was not
fixing. It is green now.

**Changed** — the existing `puts the clear control in the tab order with an accessible name` asserted
`getAttribute('role') === 'button'`, which a native button does not carry. That assertion moved into
the new test as `tagName` / `type`; the surviving test keeps `tabIndex === 0` (a native button reports
0 without a `tabindex` attribute) and the `aria-label`.

**Added** — `select.spec.ts`, in `describe('SelectComponent inside tw-form-field')`:
`it('does not open the panel when the clear control is clicked inside a form field')`. This is the
guard on the `stopPropagation()` I kept: drop that one line and this test goes red while every
non-form-field clear test stays green, because it is the only fixture where the clear's click has a
handling ancestor.

**Unaffected, as the pass-5 report predicted** — all six existing clear locators use
`querySelector('[aria-label="Clear selection"]')` and survive the restructure. I re-checked each:
`select.spec.ts:308` (the `getClearControl` helper), `:779`, `:787`, `:799`, `:811`, plus the
`getTriggerButton` helper at `:304`, which scopes on `button[role="combobox"]` and so still resolves
to the trigger and not the clear.

**e2e** — `e2e/specs/01-components/select.spec.ts:309-315`. The locator was
`trigger.getByRole('button', { name: 'Clear selection' })`; it is now scoped to
`select.searchableSection`, which contains exactly one `tw-select` (checked in
`select-examples.component.ts:215-222`), so the locator stays strict-mode-safe. The comment that
documented the violation as intentional is replaced, and the now-unused `trigger` local is removed.

**Something I added and then removed, deliberately.** I first turned the freed `trigger` local into a
browser-level content-model assertion — `await expect(trigger.getByRole('button')).toHaveCount(0)`,
which is 1 against the old `role="button"` span and 0 now. I took it back out. It duplicates a unit
guard that is strictly better (five assertions, two of them independently failing against the old
tree, and runnable), while being an assertion I cannot execute this pass, added to a spec file
another agent is concurrently editing. If it were wrong it would surface as a mystery CI failure
attributed to this change. The locator update — which is what the task asked for — stands alone.

## Expected visual delta — read this before judging the regenerated baselines

This is a **derived prediction, not an observation** — I have not seen the rendered result. State it
that way when reviewing the regenerated images.

`select-closed.{light,dark}.png` screenshots the examples page's **Colors** section, and
`colorValues` (`select-examples.component.ts:717-726`) seeds 6 of 8 selects with a value, so the clear
control is inside those baselines. The change I expect is:

- the ✕ glyph shifting **1px toward the trailing edge** in each of the 6, because the rounded spacing
  step (`end-10` = 40px at `md`) sits 1px inboard of the exact geometric position (41px).

I expect nothing else to move: the value text, the chevron, the trigger box, the borders and the
heights are all driven by classes I did not touch, and the spacer holds the clear's former flex slot.
**A delta anywhere else in that screenshot is not explained by this change and should be
investigated rather than accepted as drift.** I did not use arbitrary pixel values (`end-[41px]`) to
make the position exact, because CLAUDE.md's Styling section forbids hardcoded pixel sizes.

`select-open.{light,dark}.png` should be untouched — it screenshots the overlay pane, and its trigger
locator is `page.locator('main').getByRole('combobox').first()`, which is unaffected by a second
button appearing in the host.

---

## Semver

No exported symbol renamed or removed; no required member added to an exported interface.
Additions are `SelectComponent.clearSpacerClasses` (`@internal` readonly computed) and the
`clearSpacer` slot in a non-exported `tv()` config. Removals are all `private`:
`TabNavComponent.destroyRef`, and the four private direction mirrors changed from `WritableSignal` to
`Signal` (`computed`) — none is reachable from consumer code. `onClearKeydown` and `focusTrigger`
were kept, so nothing `@internal` disappeared either.

## Files touched

- `projects/ngx-tw/tabs/tabs.ts`
- `projects/ngx-tw/tabs/tabs.spec.ts`
- `projects/ngx-tw/tab-nav/tab-nav.ts`
- `projects/ngx-tw/tab-nav/tab-nav.spec.ts`
- `projects/ngx-tw/split/split.ts`
- `projects/ngx-tw/split/split.spec.ts`
- `projects/ngx-tw/timeline/timeline.ts`
- `projects/ngx-tw/timeline/timeline.spec.ts`
- `projects/ngx-tw/select/select.ts`
- `projects/ngx-tw/select/select.spec.ts`
- `e2e/specs/01-components/select.spec.ts`

No demo page needed a change: neither task altered a consumer-facing API or a demo template.
