---
"ngx-tw": patch
---

Cross-cutting token-violation sweep. Visual output is unchanged; this PR closes the audit's "token violations" theme (`text-base` outside the `tw-item` carve-out, `duration-normal` codification, `size-3.5` justification comments, raw `<pre>` in demo pages).

**Library:**

- `SheetTitleDirective` and `DialogTitleDirective` step from `text-base` → `text-sm font-semibold` per the CLAUDE.md typography rule. The `tw-stat` lg/xl `value` and stepper lg/xl labels keep `text-base` but now carry inline carve-out comments; CLAUDE.md gains a `tw-stat` KPI value row in the typography table.
- Every `size-3.5` use in the library now carries a one-line justification comment per the codified half-step rule (sort-header, paginator, alert dismiss, checkbox box+icon, radio circle+dot, select chevron + checkmark, combobox chevron+spinner — plus the previously-commented badge, date-picker, date-range-picker).
- CLAUDE.md adds a row in the **Transitions** table codifying `duration-normal` as a theme-overridable alias for `duration-200` (used by tabs, tab-nav, paginator, menu, command-palette, progress-bar).

**Demo:**

- Raw `<pre>...<code>` blocks in the accordion overview, accordion API page, and the sort examples event-log panel migrate to `<tw-code-block>`.
