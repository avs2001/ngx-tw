---
"ngx-tw": minor
---

S13 — Paginator polish: active-page color routing, CDK `FocusKeyManager` adoption, and a fifth Input-count-cap exception ("Navigation primitives") codified in CLAUDE.md. No consumer-facing API breakage; one internal directive (`PaginatorFocusableDirective`) added but kept off `ngx-tw/paginator`'s `index.ts`.

**a11y / visual fix — active-page button now respects the `color` input.**

`PaginatorComponent` previously hardcoded its active-page background as `bg-primary-600 text-white border-primary-600` regardless of the `color` input. That meant `<tw-paginator color="error">` rendered a primary-colored active page (the `color` input set the focus-ring color but not the active fill), and the bare `text-white` foreground bypassed the warning role's amber-on-dark contrast convention. The active-page styling now routes through two color-keyed lookup maps (`PAGE_BUTTON_ACTIVE_BG` for background + border + hover + focus-visible outline; `PAGE_BUTTON_ACTIVE_FG` for the on-color text token), mirroring the `SOLID_BOX` / `SOLID_ICON` split in `checkbox.ts`. The background shade stays at `-600` for parity with checkbox (`warning` stays at `-500` per the amber-signage convention documented in `theme/_semantic.css`); the text token swaps from raw `text-white` to `text-on-{color}` so consumers retheming the `--color-on-*` aliases get correct contrast without changing the paginator.

**Refactor — adopt CDK `FocusKeyManager` for nav-group roving focus.**

`PaginatorComponent.onKeydown` previously scanned `document.activeElement` against a list collected from `nav.querySelectorAll('[data-tw-paginator-focusable]')`, with bespoke ArrowLeft / ArrowRight / Home / End branches. It now delegates to `FocusKeyManager` from `@angular/cdk/a11y`, configured `.withHorizontalOrientation('ltr').withHomeAndEnd()` — no `.withWrap()` because pagination should NOT loop from page 1 ArrowLeft back to the last page (that would be disorienting). The same DOM marker attribute (`data-tw-paginator-focusable`) is now the selector of a new internal `PaginatorFocusableDirective` that implements `FocusableOption`; its `disabled` getter resolves the `isDisabled` input signal so the manager skips disabled controls (first/prev on page 1, next/last on the last page). Pattern matches `AccordionComponent` and the S12 tabs/tab-nav migration. The directive is registered in `PaginatorComponent.imports` but deliberately not exported from `ngx-tw/paginator`'s `index.ts` — same shape as `TabTriggerElementDirective` in `ngx-tw/tabs`.

**CLAUDE.md — fifth Input-count-cap exception codified.**

Per design decision D4, `paginator` is exempted from the ≤5–6 input cap. The `Input count cap` table at `.claude/CLAUDE.md:391-397` gains a fifth row, **Navigation primitives** (canonical: `paginator` with ~20 inputs). The lead sentence updates from "four exceptions" → "five exceptions." Rationale: pagination has independent semantic axes (boundary/sibling counts, layout, type, page-size selector, first/last jump buttons, responsive collapse, link-mode factory, i18n labels) that cannot be flattened into config objects without losing template-type safety or surprising consumers. Material's `MatPaginator` carries a comparable surface.

**Spec coverage.**

The two existing keyboard tests in the `PaginatorComponent — accessibility` group dispatch their `KeyboardEvent`s with both `key` AND `keyCode` (jsdom does not derive `keyCode` from `key`, and CDK `FocusKeyManager` reads `keyCode`). Three new tests land in the same group: `End` jumps focus to the last focusable, ArrowLeft from page 1 skips the disabled first/prev controls (no focus movement), and the active-page button reflects the `color` input (asserts `bg-error-600` + `text-on-error` + no `text-white` for `color="error"`). Spec count: 2569 passing / 4 pre-existing skipped (was 2566 at S12).

**Migration guide.**

No template selector changes. Consumers using `[(page)]` / `[(pageSize)]` / `(paginated)` are unaffected. The active-page visual changes only when consumers had set a non-primary `color` input — previously they were silently rendered as primary; now they render with the chosen color's `-600` background and the role's on-color foreground. Anyone whose theme leaves `--color-on-*` aliases at the default `--color-{role}-solid-fg` mapping sees the same active-page foreground as before for primary/secondary/accent/info/success/error (still `white`), and a slightly darker on-color for warning (was `text-black`, now `var(--color-warning-950)`).

**Unresolved risk for reviewers.**

- `text-on-{color}` resolves through the legacy alias block in `theme/_semantic.css:284-296` (which already carries a "New code MUST use the slot tokens" forward-looking comment). Checkbox uses the same alias today, so paginator is consistent with the canonical reference. A future slot-token migration sweep should catch both call sites at once.
- The new `PaginatorFocusableDirective` triggers a `FocusKeyManager` rebuild on every focusable-set change (numbered page list shape, disabled-state flip). The cost is comparable to the previous `querySelectorAll` scan; no profiling regression observed in the existing spec timings.
