---
"ngx-tw": patch
---

Demo-only: closes the audit's "Demo doc-page section canon drift" theme. Section additions and renames across the `projects/demo/src/app/routes/**` tree so every Examples page follows the canonical `demo-doc-page` SKILL order.

**Sections added:**

- **Variants** → `select/examples` (`variant: 'default' | 'naked'` side by side).
- **Template-driven forms** → `textarea/examples`, `calendar/examples`, `date-picker/examples`, `date-range-picker/examples`. Each new section comes before its Reactive sibling per canon.
- **Playground** → `textarea/examples`, `calendar/examples`, `breadcrumbs/examples`. Live-binding playground with signals controlling every consumer-facing input.
- **Accessibility** → `button/overview`. ARIA roles, keyboard contract, focus management.

**Renames / cleanups:**

- `form-field/examples`: H2 "Appearance" → "Variants" (matching the SKILL canon vocabulary). Library input remains `appearance` — the audit's claim that the input was named `variant` was inaccurate; only the demo title moves.
- `calendar/examples`: stripped `(§21.2)`, `(§10.1)`, `(§25)`, `(§6.5)`, `(§7.3)` impl-spec references from section titles and body text.

No library code or API changes; no behavioral changes outside the demo app.
