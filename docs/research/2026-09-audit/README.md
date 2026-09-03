# September 2026 audit — agent reports and measurement scripts

Working artefacts from audit passes 5–8, promoted out of the session scratchpad so the
citations in `docs/audit-2026-09-register.md` resolve.

**The register is the durable record; these are its evidence.** Where a report and the
register disagree, the register wins — several findings here were corrected during the
pass that produced them, and the corrections live in the register rather than being
back-edited into the reports.

## What is here

- `pass5-*.md`, `p6-*.md`, `p7-*.md` — per-agent audit and fix reports.
- `*-brief.md` — the briefs those agents were given. Kept because two of them contained
  instructions that were wrong (the overlay-loader rule, a grep-driven variant rewrite),
  and the agents' pushback against them is part of the record.
- `*.mjs` — **re-runnable** measurement scripts. `bool.mjs` (boolean-default census),
  `fixme.mjs` / `fixme3.mjs` (test.fixme census), `inputs2.mjs` (untested-input census),
  `p6-contrast.mjs` / `p6-border-steps.mjs` / `p6-pairs.mjs` (WCAG contrast from the
  Tailwind oklch palette through sRGB to relative luminance),
  `p8-border-steps.mjs` (per-role border steps against BOTH `--color-surface` and the
  role's `-soft` fill — the second column is what pass 8 needed and `p6-border-steps.mjs`
  does not print), `p8-raw-scale-borders.mjs` (the same contrast maths applied to the
  raw-scale `border|ring|outline-{role}-{step}` utilities the semantic-slot guard cannot
  see).

Publishing the scripts is deliberate: the untested-input figure was disputed across three
passes purely because no pass had published how it was measured.

Transient build and test logs were not promoted.
