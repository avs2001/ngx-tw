# Pass 5 FIX — RTL / CDK agent report

Scope owned: `paginator/`, `segmented-control/`, `tags-input/`, `table/`, `radio/`.
No demo page or e2e file needed a change (checked — see "Deliberately not done").
No builds or tests were run, per the brief. Every edited file was parse-checked with the
TypeScript compiler API (syntactic diagnostics only, no program/type-check) — all clean.

Anchors: every anchor in `pass5-cdk.md` was re-verified before editing. **All five findings
were real.** One sub-recommendation inside F-3 was wrong and is corrected below.

---

## 1. F-2 (HIGH) — `paginator` inverted arrow keys in RTL — FIXED

**Verified before editing.** `paginator.ts:890` was `new FocusKeyManager(items).withHorizontalOrientation('ltr')`,
a literal; `grep '@angular/cdk/bidi' paginator.ts` → 0 hits.

**Changed** (`projects/ngx-tw/paginator/paginator.ts`):

- Added `import { Directionality } from '@angular/cdk/bidi'`.
- `private readonly _directionality = inject(Directionality, { optional: true })` — optional so a
  consumer that never imports `BidiModule` still gets a working paginator (the same choice
  `tab-nav` makes). JSDoc'd on the field.
- Inside the existing key-manager rebuild `effect()`:
  `const direction = this._directionality?.valueSignal() ?? 'ltr'` →
  `.withHorizontalOrientation(direction)`. The read is placed **before** the `items.length === 0`
  early return so the effect tracks direction unconditionally and re-runs on a runtime `dir` flip.
- Rewrote the block comment at `:874-882`. It no longer claims to mirror the tabs/tab-nav
  migration; it now states what it does mirror (the RTL fix), what it deliberately does **not**
  (`.withWrap()` — a paginator must not loop page 1 → last page, and that divergence is now called
  out explicitly instead of being implied by the word "mirrors").

**Why `valueSignal()` and not the `Directionality.change` subscription `tab-nav` uses.** The brief
prefers it, F-9 recommends it, and I confirmed the discriminating risk is absent: the only
`Directionality` mocks in the repo (`tabs.spec.ts:779`, `tab-nav.spec.ts:916`,
`timeline.spec.ts:979`) are `{ value, change }` with **no `valueSignal`**, and `?.` guards the
object but not a missing method. None of those three files mounts a paginator
(`grep -l 'tw-paginator' *.spec.ts` → only `paginator.spec.ts`), so no spec I don't own can break.
My own specs provide `valueSignal: signal<Direction>(dir)`.

**Spec** — `paginator.spec.ts`, new top-level `describe('PaginatorComponent — RTL keyboard navigation')`,
5 tests. Fixture is `BasicHost` at `page = 3` of 10 so first/prev/next/last are all **enabled** —
at page 1 the manager's disabled-skip masks the leftward direction and the test would pass either
way. `buildPaginationRange(3, 10, 1, 1)` = `[1, 2, 3, 4, ellipsis, 10]`, so focusing the "3" button
and pressing ArrowLeft has an unambiguous LTR answer ("2") and RTL answer ("4").

- ArrowLeft under `ltr` → "2"
- **ArrowLeft under `rtl` → "4"** ← the discriminating test
- ArrowRight under `rtl` → "2"
- `Directionality` provided as `null` → LTR behaviour (guards the `{ optional: true }` + `?? 'ltr'`
  fallback — see the note below)
- `valueSignal` flipped `ltr → rtl` at runtime → ArrowLeft lands on "4" (guards that the effect
  actually re-runs, which the `change`-subscription approach would have needed extra wiring for)

> **Caught in review — a guard that was advertising coverage it did not have.** The fallback test
> originally passed `providers: []`, described as "no `Directionality` provider at all". That does
> not exercise the fallback: CDK 22 declares `Directionality` with `@Service()`
> (`node_modules/@angular/cdk/fesm2022/_directionality-chunk.mjs`), i.e. root-provided, so omitting a
> provider still injects the **real** instance — which reports `'ltr'` in jsdom because
> `document.dir` is empty. The test passed for the wrong reason and the `?? 'ltr'` branch was never
> reached. It now provides `{ provide: Directionality, useValue: null }`, which is the only way to
> make `inject(Directionality, { optional: true })` actually return `null`, and the test name says
> "resolves to null" rather than "no provider is present".

**Non-vacuity.** Against the old code the RTL test lands on "2", not "4", and fails; so does the
runtime-flip test. Events are dispatched with **both** `key` and `keyCode`
(`ArrowLeft` = 37, `ArrowRight` = 39) because CDK's `ListKeyManager.onKeydown` switches on
`event.keyCode` and jsdom does not derive it from `key` — the file already documents this at
`paginator.spec.ts:673`. Events are dispatched on the focusable element itself, because
`onKeydown` matches `event.target` against `item.elementRef.nativeElement` to sync `activeItemIndex`.

---

## 2. F-3 (HIGH) — `segmented-control` and `tags-input` hand-rolled arrows with no RTL awareness — FIXED (option (a), minimal)

Both anchors verified: `segmented-control.ts:459` mapped `ArrowRight`/`ArrowDown` → +1 and
`ArrowLeft`/`ArrowUp` → −1 unconditionally; `tags-input.ts:666` mapped `ArrowLeft` → index−1 and
`ArrowRight` → index+1/input. Neither imported `@angular/cdk/bidi`.

Both take the **minimal direction-aware fix**, not a `FocusKeyManager` migration. Both read
`Directionality` **imperatively** inside the keydown handler (`?.value`) — nothing in either
component needs to re-render on a direction change, which is the same call `slider.ts` makes and
which F-9 explicitly endorses. Both inject `{ optional: true }`.

### The report's F-3 option (b) is wrong — recording the correction

F-3(b) proposes migrating `segmented-control` to `FocusKeyManager`, citing the comment at
`segmented-control.ts:261` (*"Called by `FocusKeyManager` during arrow-key navigation"*) as evidence
the design was headed there. **That migration would be a behavioural regression.** The arrow branch
calls `this.selectOption(opt.value())` **and** `opt.focus()` — selection-follows-focus, which is the
APG-correct behaviour for a `radiogroup` and is asserted by six existing specs
(`segmented-control.spec.ts:304-355`, all of which assert `host.selected()`, not focus).
`FocusKeyManager` moves focus only; it has no selection concept. The `:261` comment was aspirational
and described a manager that does not exist. I rewrote it to describe what actually calls `focus()`.

### `segmented-control.ts`

Split the two-key-per-case switch into four cases. `ArrowRight` → `forward`, `ArrowLeft` →
`backward`, where `forward` is `-1` under RTL; `ArrowDown` → `+1` and `ArrowUp` → `-1` **always**.
`Home`/`End` untouched. `findNextEnabledIndex` untouched, so the modular wrap and the disabled-skip
are bit-identical. The flip applies regardless of `orientation()` — deliberately not a 2×2 matrix,
because a radiogroup accepts both arrow pairs in either layout.

**Spec** — new `describe('SegmentedControl — RTL keyboard navigation')`, 6 tests:
ArrowLeft/rtl selects next (`b → c`); ArrowRight/rtl selects previous (`b → a`); ArrowDown/ArrowUp
stay direction-independent; Home/End stay logical; the modular wrap + disabled-skip still hold under
RTL (`b`, `c` disabled, forward → wraps to `a`); LTR unchanged.
**Non-vacuity:** against the old code, ArrowLeft/rtl from `b` selects `a`, not `c` — the first two
tests fail. The wrap/skip and vertical-arrow tests are preservation guards and pass both ways by
design; they exist because the brief warned that a migration could silently drift those semantics.

### `tags-input.ts`

Two handlers changed:

- `onChipKeydown` — `ArrowLeft`/`ArrowRight` collapsed into one case computing
  `forward = rtl ? key === 'ArrowLeft' : key === 'ArrowRight'`. Forward advances (last chip →
  input); backward steps to the previous chip, and at index 0 does nothing but still
  `preventDefault()`s, exactly as before. `Home`/`End`/`Delete`/`Backspace`/`Escape` untouched —
  `Home`/`End` are logical keys and CDK does not flip them either.
- `onInputKeydown` — the "step out of the input into the last chip" branch is a *backwards* move
  (chips render before the input), so its trigger key is now `ArrowLeft` in LTR and `ArrowRight` in
  RTL. **The caret test is unchanged**: `selectionStart === 0` is the logical start of the text in
  both directions, so only the key that gates it moves. This preserves the caret-position coupling
  the report flagged as the reason to prefer option (a).

**Spec** — new nested `describe('RTL keyboard navigation')` inside `describe('TagsInputComponent')`
(it needs the file's `mountBare`/`key`/`removeButtons` helpers), 6 tests: ArrowLeft/rtl → next chip;
ArrowRight/rtl → previous chip; ArrowLeft/rtl past the last chip → input; ArrowRight/rtl from the
input's caret-0 → last chip; **ArrowLeft/rtl from the input must NOT step out**; Home/End stay
logical.
**Non-vacuity:** against the old code, test 1 leaves focus put (index 0 has no previous chip), test
3 does nothing, test 4 does nothing, and test 5 wrongly focuses the last chip. Four of the six fail.

---

## 3. F-1 (HIGH) — `tw-table` announced its loading state twice — FIXED, keeping `LiveAnnouncer`

Verified: `table.ts:1275` announced `labels.loading` inside an effect tracking `loading()`, and
`table.html:251-252` rendered an `@if`-inserted `role="status" aria-live="polite"` div whose
fallback content ends in `<span>{{ resolvedLabels().loading }}</span>` — the same string, same tick,
two channels.

**Decision: keep `LiveAnnouncer`, silence the DOM region.** Reasoning:

1. A live region that is *inserted* by `@if` with its content already present is the unreliable
   announcement pattern; a pre-existing region receiving text (what `LiveAnnouncer` does) is the
   reliable one. Dropping the reliable channel to keep the unreliable one is backwards.
2. The two announces (`loading` and `rowsUpdatedAnnouncement`) live in **one** effect and only the
   `if` branch has a DOM counterpart — removing the announcer would mean splitting the effect.

**I did not follow the report's `aria-hidden="true"` recommendation, and this is deliberate.** The
overlay renders **visible text** (`{{ resolvedLabels().loading }}`), which is the sighted user's
loading affordance, and its content is a consumer-projectable `<ng-content select="[slot='loading']">`.
`aria-hidden="true"` on a container a consumer can fill with a focusable element (a "Cancel" button
is the obvious case) is an axe `aria-hidden-focus` violation waiting to happen — and hiding visible
text from AT is itself a worse outcome than leaving it statically readable. The brief's own guidance
("if it renders visible text, keep the element and only drop its live-region semantics") says the
same. So:

- `table.html` — removed `role="status"` and `aria-live="polite"` from the loading overlay. Both had
  to go: `role="status"` carries an implicit `aria-live="polite"`, so deleting the attribute alone
  would not have been enough. Added a comment above the `@if` explaining why the overlay is
  deliberately not a live region.
- `table.html` — added `data-tw-table-loading` to the overlay. Two existing specs selected it by
  `[role="status"]` (`table.spec.ts:374` and `:973`) and would otherwise have broken; `data-tw-*` is
  the library's established internal-hook convention (`tabs.html:69`, `sort-header.html:25`,
  `paginator.html:79`, `carousel.ts:474`, `file-upload.ts:631`). Both specs updated to the new hook.
- `table.ts` — added a comment on the announcement effect recording that it is now the only channel,
  so the DOM region does not get re-added.

**Spec** — `table.spec.ts`, new test *"announces the loading state through exactly one channel"*,
directly after the existing `LiveAnnouncer` test. It (a) `vi.spyOn`s `LiveAnnouncer.announce`,
clears the spy after mount, flips `loading` to `true`, and asserts **exactly one** call containing
`DEFAULT_TABLE_LABELS.loading`; (b) asserts the overlay still renders that visible text but has no
`role` and no `aria-live`; (c) asserts that **no** element in the rendered table matching
`[aria-live], [role="status"], [role="alert"]` contains the loading string.

**Non-vacuity — stated precisely, because half of this test cannot fail.** The `LiveAnnouncer` half
passes identically before and after; the announcer was always called exactly once. The
**discriminating** assertions are (b) and (c) — against the old markup the overlay carries
`role="status"` + `aria-live="polite"`, so `getAttribute('role')` is `"status"` not `null`,
`hasAttribute('aria-live')` is `true`, and the (c) query returns the overlay itself. Three
assertions fail. This is deliberately an ARIA-attribute assertion, which CLAUDE.md's testing section
requires ("Correct ARIA roles/attributes… ARIA updates on state change") — it is not a
class-name/implementation-detail test.

> **Operational note for whoever runs the suite — read this before filing a repair.** The table's
> assertions live in `table.html`, and per CLAUDE.md the Vitest runner resolves `templateUrl`
> through `dist/ngx-tw/`, not source. **The new "exactly one channel" test cannot pass until
> `npm run build:lib` has run**, and against a stale `dist/` it will fail on
> `getAttribute('role') === 'status'` — which looks exactly like the bug it is guarding. The two
> re-pointed selectors (`[data-tw-table-loading]`) fail the same way against a stale `dist/`. Build
> first, then judge.

**e2e checked, no change needed.** `e2e/specs/01-components/table.spec.ts:80` asserts
`toContainText(/Loading/i)` on the visible overlay text, which is preserved. Nothing in `e2e/` or
the demo selects the table overlay by `role="status"`.

---

## 4. F-10 (LOW) — `radio.orientation` JSDoc was false — FIXED (doc only)

Verified: the handler at `radio.ts:770-777` treats ArrowRight/ArrowDown as one case and
ArrowLeft/ArrowUp as the other with no reference to `orientation()`, which reaches only
`[attr.aria-orientation]` and the `tv()` layout variant. The behaviour is APG-correct; only the
sentence was wrong.

`radio.ts:620` now reads: *"Layout direction of the group. Sets `aria-orientation` and the visual
axis; both arrow-key pairs navigate in either orientation, per WAI-ARIA APG. Defaults to
`'vertical'`."*

**Behaviour untouched** — I did not make arrow keys orientation-dependent, and I did **not** add
`Directionality` to `radio` even though I own the file. The CDK report deliberately excluded radio
from F-3 (its `orientation` defaults to `'vertical'`, so Left/Right is its secondary axis) and the
brief asked for the doc only. Adding it here would have been scope creep. **Flagged as a follow-up
below.**

**Spec** — added *"navigates with both arrow pairs regardless of [orientation]"* to
`radio.spec.ts`'s `keyboard` describe. It sets `orientation` to `'horizontal'` and walks all four
arrows. **This is a documentation lock, not a regression guard: it passes before and after, by
design**, because no behaviour changed. Its value is pinning the sentence the JSDoc now promises;
the existing suite only covered the four arrows in the default vertical orientation.

The demo API table (`projects/demo/src/app/routes/radio/api/radio-api.component.ts:67`) already
says *"Layout axis that drives both the flex direction and the `aria-orientation` attribute"* —
accurate, never claimed the arrow-key model, so no demo change was required.

---

## 5. GAPS F-03 (LOW) — three `//` justifications folded into JSDoc — FIXED

`paginator.ts` only, all three anchors verified. Each had a JSDoc block stating the default and a
bare `//` block below carrying the reason. Folded into one sentence each, matching the shape the
already-compliant inputs use, and the `//` lines deleted:

| Input | New JSDoc tail |
|---|---|
| `showFirstLastButtons` | `Defaults to \`true\` — first/last jumps are the standard pagination affordance for any list large enough to need a paginator; the special case is a compact paginator that opts out.` |
| `showPageInfo` | `Defaults to \`true\` — showing "X–Y of Z" is the expected pagination context; the special case is an ultra-compact paginator in tight UI that opts out.` |
| `hideOnEmpty` | `Defaults to \`true\` — hiding the paginator on empty data is the expected UX; the special case is a layout that opts out to reserve the paginator's vertical space.` |

**The brief's correction about *why* is confirmed.** `grep -rn compodoc` finds no dependency
anywhere in the repo; the real consumer is `scripts/mcp/extract-api.mjs`, whose `jsDocOf()` reads
`node.jsDoc` — the TypeScript AST's JSDoc array — so a `//` line is structurally invisible to it and
never reached the MCP index or a consumer's IDE hover. CLAUDE.md's "Compodoc parses these" is a
stale rationale for a rule that is nonetheless correct.

No spec: doc-only, and the extractor is exercised by `scripts/verify-mcp-index.mjs` in the build.

---

## Deliberately not done

- **No `FocusKeyManager` migration for `segmented-control`** — see the F-3(b) correction above. It
  would drop selection-follows-focus and break six existing specs. Recorded as a rejected option,
  not a follow-up.
- **No `Directionality` in `radio`** — out of scope by the report's own reasoning and the brief's
  explicit instruction. See follow-ups.
- **No `aria-hidden="true"` on the table loading overlay** — see §3.
- **`paginator` keeps no `.withWrap()`** — I did not "fix" this toward consistency with
  `tabs`/`tab-nav`. The existing comment justifies it and I strengthened rather than removed that
  justification.
- **No demo or e2e changes.** The paginator/radio API tables do not restate the changed sentences in
  a way that became wrong; the table e2e test asserts visible text only. Nothing required an edit.
- **No RTL e2e was built.** The brief said to propose rather than build — see follow-ups.
- **No builds or tests run**, per the brief. Everything above is verified by reading plus a
  syntax-only parse of every edited `.ts`.

## Follow-ups for the orchestrator

1. **RTL e2e is cheap and currently zero.** `grep -rn "rtl" e2e/` returns nothing. A single spec that
   loads the paginator, segmented-control and tags-input demo pages inside a `dir="rtl"` wrapper and
   drives ArrowLeft/ArrowRight would convert every RTL claim in this pass from `[verified]` (source +
   unit) to `[measured]` (real browser layout). It needs a `dir="rtl"` affordance on the demo shell,
   which I do not own. Recommend one spec file, not per-component coverage.
2. **`radio` still hard-codes horizontal arrow direction** (`radio.ts:770-777`). Correct-ish today
   because `orientation` defaults to `'vertical'`, but a consumer using
   `[orientation]="'horizontal'"` in an RTL locale gets the same inversion this pass fixed in three
   siblings. The fix is four lines identical to `segmented-control`'s. Out of scope for this brief
   by explicit instruction; worth a decision next pass.
3. **F-9 is now half-done.** `paginator` uses `Directionality.valueSignal()`; `tabs`, `tab-nav`,
   `split` and `timeline` still mirror `Directionality.change` into a signal by hand. Those four are
   other agents' files. If nobody migrated them this pass, the library now has two idioms for the
   same thing — worth converging before it reads as drift.
4. **Existing `Directionality` mocks in `tabs`/`tab-nav`/`timeline` specs lack `valueSignal`.** They
   are fine today, but any future migration of those components to `valueSignal()` (follow-up 3) must
   update the mocks in the same commit or they will fail with "not a function".

## Files touched

```
projects/ngx-tw/paginator/paginator.ts
projects/ngx-tw/paginator/paginator.spec.ts
projects/ngx-tw/segmented-control/segmented-control.ts
projects/ngx-tw/segmented-control/segmented-control.spec.ts
projects/ngx-tw/tags-input/tags-input.ts
projects/ngx-tw/tags-input/tags-input.spec.ts
projects/ngx-tw/table/table.html
projects/ngx-tw/table/table.ts
projects/ngx-tw/table/table.spec.ts
projects/ngx-tw/radio/radio.ts
projects/ngx-tw/radio/radio.spec.ts
```

All eleven are inside the five owned directories. No other file was modified.

## Semver

**No break.** Nothing exported was renamed, removed, or gained a required member. All three
`Directionality` injections are private fields declared `{ optional: true }`; `data-tw-table-loading`
is an added attribute; the removed `role`/`aria-live` are internal markup, not API; the JSDoc edits
are prose.

## Residual uncertainty

- **The RTL claims are `[verified]`, not `[measured]`.** The CDK mechanism is read off the installed
  22.0.5 source and the fixes are pinned by unit specs that mount under an RTL `Directionality` and
  assert which element becomes active. **No browser was run, and no screen reader was run.** The
  user-visible RTL consequence remains inference from the mechanism — as it was in the audit.
- **F-1's fix does not depend on the AT question, but its severity did.** Whether a newly-inserted
  `role="status"` node is announced varies by AT/browser pair, so the *size* of the bug is
  uncertain; that two channels carried the same string in the same tick is not. An NVDA/VoiceOver
  pass before release would settle it cheaply.
- **The radio orientation spec cannot fail against the old code.** Stated in §4; it is a doc lock, so
  do not count it toward behavioural coverage.
- **The table specs are `dist/`-dependent.** Three assertions in `table.spec.ts` now read markup from
  `table.html`, which Vitest resolves through the last `npm run build:lib`. A failure there against a
  stale `dist/` is indistinguishable from a real regression. Flagged inline in §3 as well.
