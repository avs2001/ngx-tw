# Pass 5 — orchestrator's own findings

## O-1 `@angular/aria` exists, is stable, matches this repo's Angular line, and is entirely unused

Severity: MEDIUM (strategic, not a defect)
Anchor: `package.json` dependencies (no `@angular/aria`); `node_modules/@angular/` (absent)
Register: not in register — no prior pass could have made this call, all four predate the
package being a settled part of the v22 story.
Confidence: **[measured]** — `npm view @angular/aria dist-tags` returns `latest: 22.1.5`;
the repo pins `@angular/core: ^22.0.7`. Package resolves, is not installed, zero imports.

**What.** Angular v22 ships `@angular/aria`: headless, accessible directives implementing
WAI-ARIA patterns — Accordion, Listbox, Combobox/Select/Multiselect, Menu/Menubar, Tabs,
Toolbar, Tree, Grid. They own keyboard interaction, ARIA attributes, focus management and
roving tabindex / activedescendant, and they ship CDK-based test harnesses per pattern.
They integrate with signal forms out of the box, because `[formField]` detects a `value`
model — which is exactly the custom-control predicate CLAUDE.md already documents.

ngx-tw hand-rolls **all eight** of those patterns: `accordion`, `select`, `combobox`,
`menu`, `tabs` + `tab-nav`, `segmented-control` (toolbar-shaped), `tree`, `table` +
`calendar` (grid-shaped).

**Why it matters.** CLAUDE.md's core principle is "Compose Angular CDK, don't reinvent it —
use CDK for focus traps, keyboard navigation, overlays, ARIA, coercion and collections.
Never rewrite what CDK provides." That principle was written when CDK was the only answer.
In v22 the a11y-behaviour answer has moved up a layer, and the rule now under-specifies:
the library is measurably compliant with the letter of it while hand-rolling the precise
patterns the framework now provides. Three of the register's most expensive defect classes
— roving tabindex desync (`calendar` focusedCellValue, `tabs`, `segmented-control`), RTL
arrow-key handling (fixed by hand in `5dccfc1`), and `aria-activedescendant` drift
(`select` searchable) — are exactly what these directives exist to own.

**Fix.** Not a pass-5 change. Adopting it is a multi-release architectural decision with a
real cost (new peer dep; headless directives dictate DOM shape, which collides with this
library's flat-DOM and `tv()`-slot conventions; every affected component's public API and
spec suite would move). What pass 5 should produce is the *decision framing*, not the
migration:

1. Record the position in CLAUDE.md so the next component author is not left guessing —
   either "CDK remains the behaviour layer, `@angular/aria` is deliberately not adopted,
   here is why" or "new a11y-pattern components compose `@angular/aria`".
2. If adopted, the honest entry points are the ones with the worst hand-rolled keyboard
   state today, taken one per release — not a sweep.

**Needs a maintainer decision.** I am not making this call inside an audit pass.
