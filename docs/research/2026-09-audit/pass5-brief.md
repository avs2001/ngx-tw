# Pass 5 audit brief — ngx-tw (2026-09-03)

You are one of several parallel READ-ONLY audit agents. Do not edit any file.
Write your report to `scratchpad/pass5-<YOURKEY>.md` and return a compact summary.

## MANDATORY first step

Read these two sections of `docs/audit-2026-09-register.md` BEFORE auditing anything:

- `## Verified-clean, stated positively so pass 5 does not re-sweep`  (~line 726)
- `## Open — carried to pass 5`                                        (~line 750)

Also skim `## Traps that cost real time this pass` (~line 792).

The register is four prior audit passes deep. Re-reporting closed work is the single
biggest failure mode of this exercise.

## MANDATORY finding format

Every finding MUST carry ALL of these. A finding missing any line is DISCARDED.

    ### F-<n> <one-line title>
    Severity: BLOCKER | HIGH | MEDIUM | LOW
    Anchor: <path>:<line>            (exact file:line, must exist)
    Register: not in register | extends <ID/section> | contradicts <ID/section>
    Confidence: [measured] (you ran it / reproduced it) | [verified] (you read the source) | [reported] (inference)
    What: <what is wrong>
    Why it matters: <consumer-visible or maintainer-visible consequence>
    Fix: <concrete proposed change, or "needs a decision: <the decision>">

Prefer FEWER, HIGHER-confidence findings. A confident wrong claim costs more than a
missed one. Pass 4's recorded lesson: **test the component, not a model of it** — three
confident claims that pass came from modelling instead of measuring. If you can verify a
claim by running a grep or reading the real file, do that instead of reasoning about it.

## Project rules

`.claude/CLAUDE.md` is the spec. Read it. Where code and spec disagree, say which one you
believe is wrong and why — several prior findings were spec defects, not code defects.

## Semver rule (applies to every fix you propose)

The library is published. Adding a REQUIRED member to an exported interface, renaming an
exported symbol, or removing one is a BREAKING change. Propose additive/optional shapes and
deprecated aliases instead. Say so explicitly in your Fix line when it applies.

## Environment notes

- `dist/ngx-tw/` is the tsconfig target for `@cdevhub/ngx-tw/*` — cross-entry-point types
  resolve through the LAST BUILD, not sibling source. Do not trust a phantom type error.
- Do not run `npm test`, `ng test`, e2e, or any build. The orchestrator owns those.
  Grep, read, and `node -e` one-liners are fine.
