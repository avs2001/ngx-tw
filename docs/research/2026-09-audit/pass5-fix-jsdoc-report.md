# Pass 5 FIX report — F-03 JSDoc migration (calendar / pickers / overlays / stepper / toast)

Agent scope: `calendar/`, `date-picker/`, `date-range-picker/`, `popover/`, `stepper/`,
`time-picker/`, `toast/`, `tooltip/`. `paginator/` and `combobox/` skipped (other owners).

---

## Task 1 — migrate `true`-default justifications from `//` into JSDoc

**Migrated: 14.** All comment-only. No default, type, signature or behaviour changed.

### Census correction

The brief's prose says *"These **13** of the 17 are yours"* while its own table lists **14** rows.
**14 is correct.** F-03's table has 17 entries; 3 are `paginator/` (owned elsewhere); 17 − 3 = 14.
The prose count is the error, not the table.

Independently re-derived: `grep -rE "(input|model)(<[^>]*>)?\(true"` over all non-spec `.ts` in the
eight owned directories returns **exactly 14** matches, all 14 of which were `//`-only. No stray
`true`-default input was missed by the census, and none of the 14 turned out to be already
compliant. The census is accurate for my scope apart from that one prose figure.

### Anchors — all 14 verified at the exact line the census gave (none had shifted)

| # | file | input | `//` sat | new line |
|---|---|---|---|---|
| 1 | `calendar/calendar-header.ts:119` | `canSwitchView` | below | :116 |
| 2 | `calendar/calendar.ts:488` | `bordered` | below | :486 |
| 3 | `date-picker/date-picker.ts:497` | `showClear` | below | :496 |
| 4 | `date-range-picker/date-range-picker.ts:452` | `showClear` | below | :451 |
| 5 | `popover/popover.ts:353` | `twPopoverArrow` | above | :351 |
| 6 | `popover/popover.ts:361` | `twPopoverCloseOnOutside` | above | :357 |
| 7 | `popover/popover.ts:366` | `twPopoverCloseOnEscape` | above | :360 |
| 8 | `popover/popover.ts:374` | `twPopoverTrapFocus` | above | :366 |
| 9 | `stepper/stepper.ts:327` | `showError` | below | :325 |
| 10 | `stepper/stepper.ts:332` | `headerInteractive` | below | :328 |
| 11 | `time-picker/time-picker.ts:586` | `showSteppers` | below | :585 |
| 12 | `time-picker/time-picker.ts:590` | `showClear` | below | :588 |
| 13 | `toast/toast-component.ts:203` | `dismissible` | above | :201 |
| 14 | `tooltip/tooltip.ts:358` | `twTooltipArrow` | above | :355 |

### Editorial decisions

- **The literal `` Defaults to `true` `` (backticks included) is preserved verbatim in all 14**, so
  F-03's proposed enforcement check (fix item 4 — grep for that substring preceding an
  `input(true`) keys cleanly against every one.
- **No opt-out clause was invented.** The house template ends `…; the special case is <opt-out>.`,
  but that half is optional — `spinner.track` has none. Two `//` lines (`date-picker.showClear`,
  `date-range-picker.showClear`) state only a reason, so the migrated prose stops at the reason
  rather than manufacturing a "special case" the original never claimed. Where the `//` did name
  an opt-out (both `stepper`, all four `popover`, `toast`, `tooltip`), it was carried across.
- **`time-picker.showSteppers` — insertion, not rewrite.** Its JSDoc already carried a trailing
  `size="xs"` clause with its own em-dash. Folding the reason in with a second em-dash would have
  required moving existing text, so the reason went in as its own sentence between the two existing
  ones. Every pre-existing character survives in its original relative order.

### Verification (Task 2)

Mechanical, not eyeballed. Script re-found every `(input|model)(<…>)?\(true` in the nine files,
printed the 7 lines above each, and asserted (a) no line in that window starts with `//`, and
(b) the JSDoc block contains `` Defaults to `true` ``.

    total true-default inputs in owned dirs: 14   failures: 0

A marker-based grep (`TRUE-default` / `Default true:`) would have been unsound here — `tooltip`'s
`//` carried no marker prefix — so the window scan was used instead.

Diff restricted to the nine owned files, with every `//` and `/**` line filtered out, is **empty**
— proof the change is comment-only:

    git diff -- <9 files> | grep '^[+-]' | grep -v '^\(+++\|---\)' \
      | sed 's/^[+-]//' | grep -vE '^\s*(//|/\*\*)'      →  (no output)

No specs added: a comment migration has no observable behaviour to guard, and asserting on comment
text would be a test of the source file rather than the component.

### Extractor check (confirms the change actually lands)

`scripts/mcp/extract-api.mjs` classifies members in `signalFactory(init)` off the **initializer**
call expression, not the declaration's type annotation. So the two anchors written in the annotated
form — `readonly bordered: InputSignal<boolean> = input<boolean>(true)` (`calendar.ts`) and the
same shape in `calendar-header.ts` — are **not structurally excluded** from extraction; they are
classified like any other `input(true)`. Checked because a shape-based extractor would have made
those two edits inert; it is not shape-based.

**Stated precisely:** this is a source-read of the extractor, not an observation of its output. The
brief forbids running `build:lib`, so `dist/ngx-tw/index.json` and the emitted `.d.ts` were **not**
inspected. What is established is that the extractor's classifier accepts these declarations; that
the artifacts actually contain the new prose is an expectation, not a verified fact.

---

## Task 3 — false `onFormReset` attribution inside owned directories

**None.** Reported as a clean negative, per instruction.

`grep -rn "onFormReset"` across `calendar/`, `date-picker/`, `date-range-picker/`, `time-picker/`
(and the other four owned dirs) returns **zero matches**. Repo-wide, every occurrence outside the
declaration itself (`core/form-reset.ts:19`) lives in `e2e/`, `docs/`, or `scratchpad/` — none of
which are mine.

`calendar.ts` is the only owned file with any form-reset machinery, and its comments are
**accurate**: `:800-815` describes a hand-rolled `ctrl.events` subscription filtered on
`FormResetEvent`, explicitly feature-detected because Signal Forms' `InteropNgControl` exposes no
`events` stream; `:1730-1748` describes `handleFormReset()` correctly. Neither names `onFormReset`
nor claims to use it. Nothing to correct.

### Cross-check: does my own new prose repeat the F-08 error?

The three `showClear` blocks I rewrote are the only place in this diff where new consumer-visible
prose sits near reset vocabulary, so they were re-read against F-08 specifically.

- `date-picker:495` and `date-range-picker:450` — clean. "without it consumers must wire one
  themselves" refers unambiguously to the clear-button affordance named earlier in the same
  sentence. No mechanism is claimed.
- `time-picker:587` — "without the inline clear every form has to wire its own **reset surface**
  for an obvious affordance." This phrase is **verbatim from the `//` being migrated**, not mine.
  In context it plainly means a UI affordance for clearing, not `FormControl.reset()`. Left as
  written, preferring fidelity to the original author's wording over a paraphrase; flagged here
  because "reset surface" is the single phrase in this diff a reader scanning for F-08-style
  misattribution could pause on. If a reviewer wants it unambiguous, "wire its own clear
  affordance" is the one-word fix — but it would be a rewrite, not a migration.

### Two adjacent observations — reported, deliberately not edited

1. **`calendar.ts:1226`** — JSDoc on the public `reset()` reads *"Phase 3 extends this with
   form-reset integration."* Left alone on purpose. It makes no `onFormReset` claim, so it is not
   the F-08 defect, and it is genuinely ambiguous: `handleFormReset()` is a *separate private path*
   that does not run through `reset()`, so "Phase 3 extends this" may still be true as written.
   Editing a phased-roadmap marker on that ambiguity would destroy information rather than correct
   it.

2. **`docs/tree-shaking-audit.md:89`** (not mine — flagging for whoever owns `docs/`) asserts
   *"`calendar.ts:1151` references it as planned 'Phase 3 form-reset integration'"*, where "it" is
   `onFormReset`. `calendar.ts` references **no** such symbol at any line. The nearest real text is
   `:1226` above, which says "form-reset integration" without naming the helper. So that
   audit doc carries a milder version of the same F-08 misattribution, and it is one of the two
   places F-08 cites as having *settled* the keep/delete decision.

---

## Files touched (9, all comment-only)

    projects/ngx-tw/calendar/calendar-header.ts
    projects/ngx-tw/calendar/calendar.ts
    projects/ngx-tw/date-picker/date-picker.ts
    projects/ngx-tw/date-range-picker/date-range-picker.ts
    projects/ngx-tw/popover/popover.ts
    projects/ngx-tw/stepper/stepper.ts
    projects/ngx-tw/time-picker/time-picker.ts
    projects/ngx-tw/toast/toast-component.ts
    projects/ngx-tw/tooltip/tooltip.ts

Semver: none. No exported symbol added, renamed or removed.

## Not done, and why

- **`.claude/CLAUDE.md` rationale** — the brief said the orchestrator owns it. Confirmed already
  corrected in the working tree (the Compodoc sentence now names `scripts/mcp/extract-api.mjs`).
- **The 3 redundant `//` duplicates on `combobox`** (F-03 fix item 2) — `combobox/` is another
  agent's file; it shows unrelated edits in the working tree already.
- **`paginator/` rows 5-7 of the F-03 table** — other owner, per the brief.
- **No build or test run**, per the brief's standing instruction. Verification was by reading plus
  the two mechanical scans above.

## Residual risk

Low, and bounded: the change set is 14 comment blocks with an asserted-empty non-comment diff. The
one thing a reader should still sanity-check is *wording fidelity* — each migrated sentence is a
paraphrase of the `//` it replaced, not a copy, because the `//` lines were written as prose
fragments rather than JSDoc sentences.
