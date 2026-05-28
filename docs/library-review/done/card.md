# Card — Production-Grade Review

**Entry point:** `ngx-tw/card`
**Files:** `projects/ngx-tw/card/`

## Snapshot
- Selectors: `tw-card` (element); `[twCardHeader]`, `[twCardBody]`, `[twCardFooter]`, `[twCardMedia]` (attribute directives).
- Public classes/directives: `CardComponent`, `CardHeaderDirective`, `CardBodyDirective`, `CardFooterDirective`, `CardMediaDirective`. Public type: `CardVariant`.
- Inputs: 3 (`variant`, `color`, `size`).
- Outputs: 0.
- Slots: 4 (header / body / footer / media) — directive-attached, no `select=` slots; ordering is consumer-driven.
- CVA: no.
- `tv()` config: yes; slots: `root`, `header`, `body`, `footer`, `media`.
- A11y CDK utilities used: none.

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `variant` | `'elevated' \| 'outlined' \| 'ghost'` | `'elevated'` | yes (`card.ts:80`) | Drives bg + shadow + border. |
| `color` | `TwColor` | `'neutral'` | yes (`card.ts:83`) | Only tints `outlined`. JSDoc accurately calls this out. |
| `size` | `TwSize` | `'md'` | yes (`card.ts:86`) | Maps to `p-2/3/4/6/8` on header/body/footer (block spacing scale). |

### Findings
- All three inputs are well-named, well-documented, and bounded to shared types from `ngx-tw/core`. No boolean inputs; nothing to invert.
- Input count: 3 — well under the cap.
- No way to scope dividers between header/body/footer to a thicker style; that's intentional ("the consumer projects what they need"), so not a gap.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- Card is purely presentational — no outputs is correct. If we ever add a "click to expand" affordance, that should be done by composing `tw-item` inside the card rather than baking it into Card.

## Customization surface
- ng-content slots: a single `<ng-content />` in the template (`card.ts:77`). Children are projected in document order — no named `select=` slot exists for header/body/footer/media. The four directives apply classes via host bindings but do **not** reposition or wrap content.
- Structural directives: `twCardHeader`, `twCardBody`, `twCardFooter`, `twCardMedia` — attribute directives that read `card.headerClasses` etc. via `inject(CardComponent)`. They are pure class appliers; the consumer owns the DOM element.
- Fallback content: not used. If no projection at all, an empty `tw-card` shell renders (still produces a valid styled box). That is acceptable — an empty card is a legal layout primitive.
- Class merging: `twMerge: true` is set on the `tv()` config (`card.ts:68`). Consumer `class="..."` overrides resolve cleanly.
- Findings:
  - **Strong customization story.** Because the directives only apply classes, the consumer chooses the element type (`div`, `header`, `footer`, `picture`, etc.). This matches the "flat DOM" goal in `CLAUDE.md`.
  - **Caveat — class targeting:** consumers cannot easily override only the header (or only the footer) via a `class` on `tw-card`. They must override on the projected child. That is correct by design, but the API tables / overview page should make this explicit.
  - The pattern of `[class]='headerClasses()'` in each directive (`card.ts:107, 118, 129, 140`) is duplicated four times. Acceptable — the directives are tiny and explicit. Do not refactor into a shared base.

## CSS / Styling
- tailwind-variants: yes; slots: `root`, `header`, `body`, `footer`, `media` (`card.ts:15-69`).
- twMerge: yes (`card.ts:68`).
- Semantic tokens vs raw palette: 100% semantic — `border-primary-300`, `border-secondary-300`, etc. in compoundVariants (`card.ts:54-60`). No raw Tailwind palette colors anywhere.
- Surface/fg/border tokens: correct use — `bg-surface-raised` (elevated, `card.ts:26`), `bg-surface` (outlined, `card.ts:29`), `border-border` (default, `card.ts:20-22`), `text-fg` / `text-fg-muted` (`card.ts:17-19`).
- Radius compliance: `rounded-lg` on root (`card.ts:17`) — compliant.
- Spacing/gap compliance: header/body/footer use `p-2/3/4/6/8` (`card.ts:36-40`) — compliant. No flex layout inside the card, so no gap considerations.
- Typography compliance: `text-sm` body/header, `text-xs` footer (`card.ts:18-20`) — compliant. Header is `font-semibold` (`card.ts:18`) — compliant.
- Focus rings compliance: card itself is not focusable; consumer wraps it in an interactive element if needed. **Gap**: if the consumer ever wants the whole card to be a button (a common Material pattern), there is no `interactive` variant. See recommendations.
- Dark mode handling: relies entirely on surface/fg/border tokens — they swap automatically. **No `dark:` overrides needed** because all colored surfaces are inside compoundVariants on `outlined` borders (1px borders that work fine in either mode at `-300`). This is correct.
- Transitions: `transition-shadow duration-200 motion-reduce:transition-none` only on `elevated` (`card.ts:26`) — compliant.
- Shadows: `shadow` on elevated resting (`card.ts:26`). **Gap**: no `hover:shadow-md` to match the `flip-card` pattern and the documented hover guidance for elevated surfaces in `CLAUDE.md` ("hover:shadow-md — shadow deepens"). See recommendations.
- Icon sub-scale: not applicable (no icons in card).
- Findings:
  - Solid semantic-token discipline.
  - Missing hover elevation on `elevated` variant is the only concrete styling miss against the codified visual system.

## Accessibility
- ARIA roles/attributes: no `role` set by default (`card.spec.ts:307-316` confirms). Correct — a generic container has no inherent role.
- Keyboard support: none (not interactive).
- CDK a11y utilities: none. None required.
- Labels/descriptions wiring: consumer responsibility.
- AXE risks: low — the only risk is if `outlined`+`color` combinations produce a border that doesn't pass non-text contrast against `bg-surface`. The `-300` shade against the white surface is borderline at 3:1 for small icons but the card border is decorative, not informational, so this is acceptable.
- Findings:
  - **No way to make a card a landmark.** When a card represents a meaningful region (e.g. an article preview), a consumer typically wants `role="article"` or to render `<article>`. They can — `tw-card` is an element selector and consumers can add `role` to the host externally. Document this in the overview as the recommended pattern.

## Form integration (if applicable)
- CVA: no.
- ErrorStateMatcher: no.
- form-field interop: no.
- Findings: not applicable.

## Tests
- Spec file: yes (`card.spec.ts`).
- Coverage breakdown:
  - Default render: yes (`card.spec.ts:64-95`).
  - Each variant: yes — elevated/outlined/ghost (`card.spec.ts:97-130`).
  - Color input: yes, plus negative coverage (color has no effect on elevated/ghost) (`card.spec.ts:132-166`).
  - Size input: xs/md/xl + "applies to all sections" lg (`card.spec.ts:168-214`). Missing `sm` explicit assertion, but the pattern is covered.
  - Content projection: header/body/footer present, missing-slot absence (`card.spec.ts:216-252`).
  - Media slot: present + classes without padding (`card.spec.ts:254-278`).
  - Section dividers: border-b on header, border-t on footer (`card.spec.ts:280-304`).
  - Accessibility: no default role (`card.spec.ts:306-317`).
  - Interaction: not applicable.
- Vitest-specific issues: none. No `fakeAsync`/`tick`, uses `vi`. `setInput` is replaced by setting host signals on the wrapping `FullCardHost`, which is also fine.
- Findings:
  - **Solid baseline.** Three concrete gaps:
    1. No assertion that `twMerge` correctly merges a consumer `class="rounded-2xl ..."` against the internal `rounded-lg`.
    2. No assertion that `[twCardMedia]` does **not** add padding even when `size="xl"` (today the test only checks `'p-'` is absent — but `'p-'` would also match `p-4` from a parent). Tighten the negation.
    3. No coverage for **all 8 colors** under outlined; the spec only spot-checks `error` and `primary`. Add a loop.

## Gaps & lacks
1. No `interactive` variant — consumers wanting a clickable card must wrap or hand-roll focus/keyboard. Document the "wrap in `<a>`/`<button>` or use `tw-item`" pattern, or add a small `interactive` boolean that flips role/tabindex/focus-ring.
2. `elevated` variant has resting `shadow` but no `hover:shadow-md` — violates the documented hover pattern for elevated surfaces in `CLAUDE.md`.
3. Solid-fill variant absent (cards never go solid). Reasonable on its own — alerts cover that. But consumers wanting a primary-tinted *background* card (rather than just an outline) must use `style`/`class` overrides. Consider a `tinted` variant or a `tone` axis on `color` for fill density.
4. No way to mark the card as a landmark region in a single input (e.g. `role="article"`). Document the host-element override pattern.
5. Tests miss "all 8 colors" coverage and stricter media-slot padding assertion.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Bring `tw-card` to production grade by closing the small gaps: add hover-shadow on elevated, harden tests, document landmark/interactive composition patterns, and lock the API table against the demo.

### Tasks

1. **Add hover elevation on the `elevated` variant** — match the codified hover pattern.
   - File(s): `projects/ngx-tw/card/card.ts:25-27`
   - Why: `CLAUDE.md` "Hover States" mandates `hover:shadow-md` on elevated surfaces; `flip-card` already follows this.
   - Change: in the `variants.variant.elevated.root` string, append ` hover:shadow-md`. Keep `transition-shadow duration-200 motion-reduce:transition-none` (already present).
   - Acceptance: spec asserts `card.className.includes('hover:shadow-md')` when `variant='elevated'`; visual diff on the card demo shows shadow deepen on hover; no shadow change on outlined/ghost.

2. **Tighten media slot padding assertion** — guarantee no `p-*` is applied to `[twCardMedia]` even at `size='xl'`.
   - File(s): `projects/ngx-tw/card/card.spec.ts:271-277`
   - Why: today's `expect(media.className).not.toContain('p-')` would also match `flex` if a regex regression slipped through. Make it an exact regex.
   - Change: replace with `expect(/(^|\s)p-[0-9]+(\s|$)/.test(media.className)).toBe(false);` and iterate over all five sizes.
   - Acceptance: green at every size.

3. **Cover all 8 colors under outlined** — add a loop.
   - File(s): `projects/ngx-tw/card/card.spec.ts:131-166`
   - Why: today only `error` and `primary` are spot-checked; the compoundVariants table is the riskiest surface to silently break (e.g. accidentally dropping `border-secondary-300`).
   - Change: parametrize over `['primary','secondary','accent','info','success','warning','error']` (neutral has no border colour) and assert `border-{color}-300` is applied while `border-{otherColor}-300` is absent.
   - Acceptance: each color asserts only its own shade.

4. **Add a `twMerge` integration test** — confirm consumer overrides win.
   - File(s): `projects/ngx-tw/card/card.spec.ts` (new `describe` block).
   - Why: documented invariant in `CLAUDE.md` — consumer overrides must resolve.
   - Change: in a host template, do `<tw-card class="rounded-2xl shadow-md">` and assert the rendered card has `rounded-2xl` and *not* `rounded-lg`.
   - Acceptance: passes; safety net against an accidental `twMerge: false` regression.

5. **Document the landmark / interactive composition pattern in the overview** — no code change in the library.
   - File(s): `projects/demo/src/app/routes/card/overview/*.ts` (description section).
   - Why: consumers will ask "how do I make the card clickable / a landmark?". The answer is composition — wrap in `<a>` or `<button>`, or place a `tw-item interactive` inside. Make this explicit in the page so we don't drift toward adding an `interactive` input.
   - Change: add a short subsection under "Basic Usage" with two snippets (card-as-link, card-with-interactive-row).
   - Acceptance: snippets compile in the demo; no library API change.

### Out of scope
- Adding an `interactive` input to `CardComponent` — the composition pattern is preferred (matches the "compose, don't inflate inputs" principle).
- Adding a `tinted` / `solid` variant — that overlaps with `tw-alert`. Reassess only after a real consumer request lands.
- Restyling `outlined` borders to `border-{color}-500` — the quiet `-300` is intentional.

### Verification
- Build: `npm run build:lib`
- Test: `npm test` (filter: `card`)
- Visual check: `http://localhost:4600/card`
- A11y: `npm run e2e:a11y` (card route)

## Priority
**P2** — Card is structurally sound, semantically tokenized, and well-tested. The hover-shadow miss is the only real visual policy violation; everything else is hardening. Ship after the higher-impact components in this batch.
