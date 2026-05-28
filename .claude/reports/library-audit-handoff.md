# ngx-tw audit — session handoff

**Snapshot:** 2026-05-27, after S10 completed.
**Purpose:** everything a fresh Claude Code session needs to resume the 21-session ngx-tw audit-cleanup flow without re-discovering context.

---

## TL;DR — the flow

A 21-session implementation plan closes ~200 findings from a library + demo code audit. Sessions are delegated to background general-purpose agents. The orchestrator (the main thread) launches one session per agent, monitors completion, verifies the result, updates the task list, and stops. **10 of 21 sessions are complete (S01–S10).** **Working tree is unstaged**; no commits have been made — each session leaves edits in place plus a changeset under `.changeset/sNN-*.md`.

---

## Mission

Close all findings from `.claude/reports/library-audit-2026-05-27.md` (the original code-reviewer audit covering 48 components — library + demo). The implementation plan groups findings into 21 cohesive sessions across 4 phases. Each session is its own PR-sized unit of work with a `.changeset/sNN-*.md` entry.

---

## Status table

| # | Session | Status | Key outcome |
|---|---|---|---|
| S01 | `Tw*` class rename + CLAUDE.md staleness fix | ✅ | 17 symbols renamed in dialog + table; CLAUDE.md cleaned. |
| S02 | Token sweep (text-base + duration-normal + size-3.5 + raw `<pre>`) | ✅ | All `size-3.5` uses commented; CLAUDE.md gains `duration-normal` + KPI carve-out rows. |
| S03 | Boolean `true`-default rationale sweep | ✅ | All `input(true)` either commented or codified. |
| S04 | JSDoc Defaults + 7-component API mirror | ✅ | Library JSDoc completeness + demo description parity. |
| S05 | Demo section canon completeness | ✅ | All CVA pages have Template-driven section + Playground. |
| S06 | Form-control internals A (input, textarea, checkbox) | ✅ | Surfaced `*Input` aliasing as canonical (NOT a violation). |
| S07 | Form-control internals B (radio, switch, slider) + error-state parity | ✅ | All 6 form controls expose `errorState`. Discovered: static CVA incompatible with matcher injection. |
| S08 | CVA registration convergence to **runtime** | ✅ | D5 reversed — runtime canonical. Switch + radio-group + select + combobox migrated; their dormant `errorState` now activates. |
| S09 | Select + combobox internal fixes + shared overlay helpers | ✅ | 3 helpers extracted to `core/overlay/`; `useNakedWhenInFormField` skipped per advisor. |
| S10 | Form-field + time-picker + button | ✅ | 4 form-field directives renamed; button `''` union retained (template type-check requires it). |
| **S11** | **Display + status (avatar, badge, alert, empty-state, skeleton, spinner, icon)** | **⏸ NEXT** | Fold in spinner JSDoc `slot="suffix"` cleanup S10 flagged. |
| S12 | Tabs + tab-nav keyboard a11y + shared trigger variants | ⏸ | |
| S13 | Paginator raw-palette + FocusKeyManager + demo Sizes labels | ⏸ | |
| S14 | Breadcrumbs + menu + command-palette fixes | ⏸ | |
| S15a | Accordion + collapsible-group consolidation | ⏸ | |
| S15b | Table polish | ⏸ | Depends: S01 (table rename). |
| S16 | Sort + segmented-control + code-block + carousel + flip-card | ⏸ | |
| S17 | Indicators/overlays/feedback (progress-bar, stat, timeline, popover, toast, tooltip) | ⏸ | |
| S18 | Picker overlay coordinator extraction (date-picker / date-range-picker) | ⏸ | Depends: S09 (overlay helpers). |
| S19 | Calendar/date-picker pre-1.0 deprecated surface removal + rangeBehavior | ⏸ | Depends: S18. |
| S20 | Dialog/sheet overlay-container-base extraction | ⏸ | Depends: S01, S18 (composition pattern). |

**Test baseline at S10:** 2540 passing / 4 pre-existing skipped. All 3 type-checks (`lib`, `spec`, `app`) clean.

---

## Key artifacts (file paths)

**The source of truth — read these first when resuming:**

1. **`.claude/CLAUDE.md`** — project rule set. Recently updated with: "Operating mode" section, "ControlValueAccessor" subsection (runtime canonical), `duration-normal` row, KPI carve-out row, refreshed boolean-defaults codified list. **The CLAUDE.md is the LIVE policy; the audit + plan files reflect pre-revision state.**
2. **`.claude/reports/library-audit-2026-05-27.md`** — original audit findings.
3. **`.claude/reports/library-audit-implementation-plan.md`** — 21-session plan with dependencies.
4. **`.claude/reports/library-audit-session-prompts.md`** — refined per-session prompts. **CONTAINS STALE ENTRIES — see "Stale items" below.**
5. **`.changeset/sNN-*.md`** — 10 changesets so far (S01–S10). Each describes its session's outcome + any deviations from the spec.

---

## Operating mode (codified in CLAUDE.md)

> For non-trivial code changes — new components, animation work, `ControlValueAccessor` wiring, `public-api.ts` updates, multi-file refactors — treat your own conclusions as suspicious until verified. Call the `advisor` tool before committing to an approach and again before declaring done. Surface unresolved risks explicitly in the closing summary; never declare "done" with hidden uncertainty.

**Every background agent prompt embeds this posture.** Sessions S06–S10 demonstrated the value: each caught 1–3 material audit-spec drifts that would have produced broken code if applied naïvely.

---

## Six design decisions (current state)

These were originally listed in `library-audit-session-prompts.md`. **Two have been revised since.**

| # | Decision | Current state |
|---|---|---|
| **D1** | Accordion / collapsible-group consolidation | Inheritance (`AccordionComponent extends CollapsibleGroupComponent`), keep both selectors. **Pending S15a.** |
| **D2** | Picker overlay extraction | Composition via injectable coordinator + pure helpers (no base class). Same shape extended to dialog/sheet in S20. **Pending S18/S20.** |
| **D3** | Calendar `rangeBehavior` config | Ship as single `Partial<RangeBehaviorConfig>` object input. **Pending S19.** |
| **D4** | Paginator input-cap exception | Codify "Navigation primitives" exception in CLAUDE.md (no config-object refactor). **Pending S13.** |
| **D5** | **CVA registration target** | **REVERSED in S08.** Runtime pattern is canonical (`this.ngControl.valueAccessor = this`). Static `NG_VALUE_ACCESSOR` is incompatible with matcher integration (circular DI). Now codified in CLAUDE.md `## ControlValueAccessor` section. |
| **D6** | `text-base` codification | Two carve-outs codified in CLAUDE.md: `tw-item lg` title + `tw-stat lg/xl` KPI value. Done in S02. |

---

## Audit-drift patterns observed (S06–S10 lessons)

These keep showing up — embed them in future session prompts:

1. **Anchor drift.** Audit-claimed line numbers are off (sometimes by 20+ lines). Always `rg -n <symbol>` to locate current position.
2. **`*Input` aliasing is canonical, not violation.** Each `*Input` (in input.ts, checkbox.ts) pairs with a `computed()` sibling that combines raw input + NgControl/Validators fallback. Renaming would shadow the computed. (S06)
3. **Output renames need explicit `alias:`.** Slider's `input` output had no alias; renaming the TS identifier broke template `(input)="…"` bindings until `alias: 'input'` was added. (S07)
4. **Not everything can be `computed()`.** Methods that take arguments can't be parameter-less computeds; use memoized maps with O(1) lookup instead. (S07: `markClassFor`, `bubbleClassFor`)
5. **Focus signal naming.** Slider tracks focus via `focusedThumb`, not `_focused`. Always verify the actual signal name. (S07)
6. **Static CVA + matcher integration = circular DI.** `NG_VALUE_ACCESSOR` provider with `forwardRef` is incompatible with `inject(NgControl, { self: true })` on the same instance. Use runtime assignment. (S08)
7. **Runtime CVA assignment must be synchronous in constructor.** `afterNextRender` is too late — parent FormControl's `setUpControl()` runs in the same DI pass as construction. (S08, advisor-confirmed)
8. **Don't over-extract.** S09 dropped the 4th planned helper (`useNakedWhenInFormField`) because 3 call sites had heterogeneous shapes that didn't fit a single signature.
9. **HTML nested-interactive-content rule.** S09's `<span role="button">` substitution and S10's button `''` union narrowing both blocked by this rule. Native `<button>` inside another `<button>` is invalid; Angular template type-check requires bare-attribute use to bind `""`.
10. **Scope expansion via advisor.** Investigation finds related code that wasn't named in the audit. Advisor often recommends expanding to keep the surface cohesive (S10: 4 directives renamed, not 2).

---

## Stale items in `library-audit-session-prompts.md`

**Treat these as out-of-date** when reading the file:

- **D5 entry** (top of prompts file) says "static `NG_VALUE_ACCESSOR` + `forwardRef` is canonical". **Reversed by S08.** Runtime is canonical. See CLAUDE.md `## ControlValueAccessor`.
- **S08 prompt body** says "migrate to static". **Reversed.** S08 actually migrated *to runtime*.
- **S10 prompt body** says "Migrate the auto-naked detection at `:572` to the `useNakedWhenInFormField` helper from S09". **Skip this bullet** — the helper was deliberately not created in S09. Time-picker keeps inline detection.

The CLAUDE.md file is the live policy; when the prompts file disagrees with CLAUDE.md, **CLAUDE.md wins.**

---

## The session-delivery pattern (proven shape)

For each pending session:

1. **Update the task list** — `TaskCreate` for the session if it doesn't exist yet (S01–S20 were all created up front but `TaskList` is in-session state — re-create the relevant task when resuming).
2. **Launch a background agent** via `Agent` tool with `subagent_type: "general-purpose"` and `run_in_background: true`.
3. **The prompt body must include:**
   - Reference to required reading (CLAUDE.md, audit, prompts file, prior changesets).
   - Self-skeptical operating rules (S06–S10 lessons embedded).
   - Explicit scope (in/out, file paths, line anchors with "verify first" caveat).
   - Two advisor checkpoints (before approach commitment + before declaring done).
   - Acceptance check commands (`rg` greps + type-check + spec runs).
   - Spec additions required.
   - Changeset file path + content shape.
   - Deliverables (code + ≤500-word report).
4. **Wait for the completion notification.** Don't poll.
5. **Verify the report's claims briefly.** `rg` the acceptance checks if it's a high-risk session; trust low-risk hygiene sessions more.
6. **Mark the task complete** via `TaskUpdate`.
7. **Stop or proceed to next session** per user instruction.

---

## Recipe: launching a new session

Template for the Agent prompt body — the structure that's worked across S06–S10:

```
You are executing session SNN of the ngx-tw audit implementation plan — <name>. **Operate in self-skeptical mode** (codified in `.claude/CLAUDE.md` → "Operating mode"): call the `advisor` tool before committing to your approach and again before declaring done; verify every claim before acting; surface unresolved risks explicitly.

## Required reading
- `.claude/CLAUDE.md` — note "Operating mode" and the new "ControlValueAccessor" section.
- `.claude/reports/library-audit-2026-05-27.md` — Batch N "<component>" subsections.
- `.claude/reports/library-audit-session-prompts.md` — the SNN entry. **Note: D5/S08/S10 entries in this file are stale; see `.claude/reports/library-audit-handoff.md` "Stale items".**
- `.changeset/sNN-*.md` for prior sessions in this component family.

## Self-skeptical operating rules (S06–S10 lessons applied)
[Copy the "Audit-drift patterns observed" section above, abridged.]
Concretely: read the file fully before editing, verify anchors with `rg`, check whether the violation still exists, enumerate consumers before renaming, call advisor at <approach commitment> and before declaring done.

## Scope (SNN, exhaustive)
[Bullets from session-prompts.md SNN entry, with explicit out-of-scope.]
[Important: if SNN was originally drafted referencing D5/S08/S10 stale facts, override here.]

## Pre-requisites
[Which earlier sessions must have landed.]

## Acceptance check
[rg commands, type-checks, spec runs]

## Spec additions
[New spec coverage required.]

## Changeset
Add `.changeset/sNN-<name>.md` covering: [bullets]
Mark as `minor` (pre-1.0 breaking convention).

## Deliverables
1. Code changes only — no commits.
2. A report (≤500 words) covering:
   - Each audit claim verified vs current reality. List contradictions.
   - Advisor's specific guidance.
   - Acceptance-check results.
   - Type-check + spec-run results.
   - Any unresolved risk for reviewers.

Do not run the dev server. Do not modify `tsconfig*`, `angular.json`. Do not modify files outside <scope paths>.
```

---

## Immediate next action (S11)

**Scope (from prompts file + the S10 finding):**

- **avatar** — fix conditional `aria-hidden` so image-mode avatars aren't hidden from AT; signal-driven `[hidden]` in AvatarGroup; document `size-16` / `size-[60%]` as container-scale.
- **badge** — split `dot`-mode into `[twBadgeDot]` directive (currently 7 inputs, exceeds 5–6 cap; visual primitive — no codified exception). Replace unconditional `role="status"` with opt-in `live = input(false)`.
- **alert** — expand `politeness` JSDoc for `'off'` semantic.
- **empty-state** — snap `py-1.5`/`py-5` to scale OR justify; drop unused `hasIcon`/`hasActions` computeds.
- **skeleton + spinner + icon** — verify S03/S04 JSDoc work in place.
- **(S10 follow-up)** spinner JSDoc at `:65, :73` still references `slot="suffix"` — replace with `twSuffix` per S10's selector rename. Fold this into S11.

**Pre-requisites:** S02 ✅, S03 ✅, S04 ✅, S10 ✅.

**Self-skeptical considerations:**
- Badge `[twBadgeDot]` extraction is a breaking change for consumers — enumerate every `[dot]` use in demos.
- `role="status"` removal is a behavioral change; verify whether any consumer relies on the live-region announcement.
- `size-16` / `size-[60%]` documentation is non-functional but may surface a deeper question about whether the audit's "avatars are containers, not glyphs" framing should be codified in CLAUDE.md (probably yes — talk to advisor).

---

## What's NOT in this handoff

- Git history. Use `git log .changeset/` to see commit order if needed.
- Spec count details per file. Re-derive via `npx ng test ngx-tw --no-watch 2>&1 | tail -10`.
- Per-finding line numbers from the original audit (use the audit file directly — `.claude/reports/library-audit-2026-05-27.md`).
- Background-agent prompt templates for S11–S20 (compose at session-launch time using the recipe above; the prompts file has draft bullets per session).

---

## Glossary

- **CVA** — Angular's `ControlValueAccessor` interface for form-bindable components.
- **`TW_ERROR_STATE_MATCHER`** — `InjectionToken` for the error-state policy (libraries usually inject this and consume `matcher.isErrorState(ngControl?.control ?? null, form)` to decide whether to render the error state).
- **`tv()`** — `tailwind-variants` config helper used for variant-driven class strings across the library.
- **`twMerge`** — tailwind-merge integration enabled globally via `tv()`; allows consumer class overrides to win over internal classes.
- **Naked variant** — form-control trigger style used when the control sits inside a `<tw-form-field>` host. The form-field owns the border/focus-ring; the control renders without its own.
