# Pass 5 FIX brief — ngx-tw

You are one of six parallel fix agents. Work is partitioned **by file ownership**.
**Touch only the files your prompt assigns you.** A sibling agent owns every other file.

## Read first

- `.claude/CLAUDE.md` — the spec. Follow it exactly.
- The audit report your prompt names, in `scratchpad/`. Each finding there carries an
  anchor, a rationale and a proposed fix. **Verify the anchor before editing** — line
  numbers may have shifted, and a prior pass recorded that findings can be wrong.

## DO NOT run builds or tests

Do **not** run `ng test`, `ng build`, `npm test`, `npm run build:lib`, or Playwright.

This is not a convenience rule. `ng test <one component>` type-checks the **whole library
program**, so a sibling agent's half-finished edit fails *your* run and you will chase a
phantom. The register documents two agents losing cycles to exactly this. The orchestrator
runs build + the full suite centrally once every agent has landed, and dispatches repairs.

Verify your work by **reading**. If you need a type check, `npx tsc --noEmit -p
projects/ngx-tw/tsconfig.lib.json` is permitted but treat a cross-entry-point error as
suspect: the root tsconfig maps `@cdevhub/ngx-tw/*` to `./dist/ngx-tw/*`, so sibling
entry points resolve through the **last build**, not source.

## Semver rule — verbatim, applies to every edit

The library is published. **Adding a required member to an exported interface, renaming an
exported symbol, or removing one is a BREAKING change.** Pass 3 shipped two such breaks from
two independent agents; pass 4 put this rule in every prompt and shipped zero. Use additive
or optional shapes, and keep a `@deprecated` alias for anything renamed. If you believe a
break is unavoidable, **stop and report it instead of landing it**.

## Tests

Every behavioural fix needs a spec that **fails before your change and passes after**.
Do not just assert the new behaviour — confirm the test is non-vacuous by reasoning about
what it would do against the old code, and say so in your report. A guard that cannot fail
is worse than none. (Vitest: no `fakeAsync`/`tick`; use `vi.useFakeTimers()` or
`await fixture.whenStable()`. `vi.spyOn` for spies. Import from `vitest` explicitly.)

## House rules that bite

- No `dark:` variants in components — the theme layer already inverts the ramp.
- No `@angular/animations`. Native `animate.enter` / `animate.leave`; keyframes live in
  `theme/_base.css`.
- Signals: no writes inside an `effect()` that the same effect track-reads.
- **Never put `{ }` or backticks inside a comment in an inline `template:` literal** — the
  template lexer reads braces as ICU syntax and backticks terminate the literal. Both
  produce errors pointing nowhere near the cause. Both were hit in earlier passes.
- `host` object for host bindings; `inject()`; `OnPush`; native control flow.

## Report back

State per finding: what you changed, the spec that guards it, and **anything you chose not
to do and why**. If a finding turns out to be wrong, say so plainly — a correction is worth
more than a compliant edit. List every file you touched.
