# Badge — Production-Grade Review

**Entry point:** `ngx-tw/badge`
**Files:** `projects/ngx-tw/badge/`

## Snapshot
- Selectors: `[twBadge]` (attribute selector on `Component` — unusual; element selectors are the convention for components)
- Public classes/directives: `BadgeComponent`
- Inputs: 6 (`color`, `variant`, `size`, `pill`, `dismissible`, `dot`)
- Outputs: 1 (`dismissed`)
- Slots: 3 implicit (leading `tw-avatar`, leading `tw-icon`, default content), 0 named
- CVA: no
- `tv()` config: yes, slots used (`root`, `content`, `dismiss`, `dot`, `leadingAvatar`, `leadingIcon`)
- A11y CDK utilities used: none

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `color` | `TwColor` (shared) | `'neutral'` | yes | Uses shared core type |
| `variant` | `BadgeVariant` (`'solid' \| 'outline' \| 'soft'`) | `'soft'` | yes | |
| `size` | `TwSize` (shared) | `'md'` | yes | |
| `pill` | `boolean` | `false` | yes | Toggles `rounded-md` ↔ `rounded-full` |
| `dismissible` | `boolean` | `false` | yes | |
| `dot` | `boolean` | `false` | yes | Suppresses content + leading elements; renders solid dot |

### Findings
- All inputs have one-line JSDoc with defaults — compliant.
- All booleans default to `false` — compliant.
- 6 inputs sits at the cap; no exception needed.
- Uses shared `TwColor`/`TwSize` from `core` — compliant.
- `dot` mode is overloaded: it mutates the same root box rather than producing a structurally distinct element. Consider whether `dot` belongs as a separate sibling component (`<tw-badge-dot>`) or stays as a variant — current shape is acceptable.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `dismissed` | `void` | past-tense (action) | Codified dual-pattern (action events use past tense). Compliant. |

### Findings
- Single output, past-tense, no payload — compliant with codified pattern.

## Customization surface
- ng-content slots: 3 — leading `tw-avatar` (`<ng-content select="tw-avatar">`), leading `tw-icon` (`<ng-content select="tw-icon">`), default (text label).
- Structural directives: none.
- Fallback content: none. Slots are unconditional; absence of `tw-avatar`/`tw-icon` is detected via `contentChild()` → wrapper not rendered (lines 217–223). Correct pattern per CLAUDE.md.
- Class merging: yes — `twMerge: true` (line 157).
- Findings:
  - Selector is an attribute selector (`[twBadge]`) but the class is a `Component`, not a `Directive`. This is intentional (template needs slots + the dismiss button) but it's unusual. Convention in this library is element selector (`tw-badge`) for components, attribute for directives. Worth either (a) switching to `selector: 'tw-badge'`, the canonical element form — accepting a minor template churn for consumers — or (b) documenting why the attribute selector is preferred (allows wrapping any block-level element like `<span>` / `<div>` / `<a>` without an extra wrapper).
  - Leading icon and avatar are exclusive (icon hidden if avatar exists, line 175). Consumers who want both must wrap in custom DOM. Fine for a badge; acceptable.

## CSS / Styling
- tailwind-variants: yes, slots — `root`, `content`, `dismiss`, `dot`, `leadingAvatar`, `leadingIcon` (lines 18–26).
- twMerge: yes.
- Semantic tokens vs raw palette: compliant. All `bg-{role}-N`, `text-{role}-N`, `border-{role}-N` use semantic tokens (lines 95–132). Neutral variants correctly use `bg-surface-muted`, `text-fg`, `text-fg-muted`, `border-border`, `bg-fg-muted` (lines 110–112).
- Surface/fg/border tokens usage: correctly applied to neutral rows.
- Radius compliance: `rounded-md` default + `rounded-full` for pill (lines 81–82) — compliant.
- Spacing compliance: inline padding `px-1.5 py-0.5` (xs/sm), `px-2 py-1` (md), `px-3 py-1.5` (lg/xl). The xs/sm `px-1.5` and md `py-1` are tighter than the codified inline-padding scale (`px-2 py-1` / `px-3 py-1.5` / `px-4 py-2`), but badges legitimately need tighter padding than buttons — this is acceptable density divergence for the badge primitive. Document as a per-component carve-out if not already.
- Typography compliance: `text-xs` (xs/sm/md) and `text-sm` (lg/xl) — compliant with body/caption scale.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on dismiss button (line 22) — compliant.
- Dark mode handling: NO `dark:` overrides. Solid variant uses `bg-{color}-600 text-white` (e.g., line 95). Like Button, this has not been migrated to the `text-on-{role}` tokens. Same flag as Button.
- Transitions: dismiss button has `transition-colors duration-200 motion-reduce:transition-none` (line 22) — compliant.
- Shadows: none — appropriate.
- Icon sub-scale: leading icons sized via dedicated `leadingIcon` slot (lines 49, 56, 63, 70, 77). The values include `size-3` (xs/sm/md badge — 12px), `size-3.5` (md leading icon — half-step), `size-4` (lg/xl leading icon). The `size-3.5` half-step at line 63 violates the codified rule that `size-3.5` should only be used for xs-density chevrons inside compact triggers AND must carry an inline comment. Either move to `size-3` or `size-4`, or add an inline comment justifying the half-step.
- Findings:
  - `size-3.5` half-step at line 63 needs an inline comment or should be normalised.
  - Migrate `text-white` (solid variants, lines 95, 100, 105, 115, 120, 130) to `text-on-{role}`; warning's `text-black` (line 125) → `text-on-warning`.
  - The dismiss button width changes from `size-4` (xs/sm/md) to `size-5` (lg/xl). The button itself only sets `size-4`/`size-5` on its bounding box, but the close glyph is `size-full` — so the touch target is the bounding box. The codified square-interactive icon scale is `size-6/7/8/9` (24/28/32/36px). `size-4` (16px) is well below WCAG 2.5.5 (Target Size) min recommended 24px. FLAG: enlarge dismiss-button hit target to at least `size-6` xs/sm and `size-7` md and `size-8` lg/xl, or use negative margin + hit-area padding.

## Accessibility
- ARIA roles/attributes: `role="status"` on host (line 165). `aria-label="Dismiss"` on dismiss button (line 182).
- Keyboard support: native `<button type="button">` handles Enter/Space.
- CDK a11y utilities: none used — none required for a static labelled chip.
- Labels/descriptions wiring: dismiss label hardcoded `"Dismiss"`. NOT internationalised. Should accept an input (`dismissLabel`) or use `i18n` markup. Today consumers cannot localise the label.
- AXE risks:
  - Dismiss-button hit-target size 16px is below the WCAG 2.5.5 AA threshold (24px minimum) for `xs/sm/md` sizes. Flag from styling section.
  - `role="status"` on the root means every badge will be announced as a live region. For a button-tag (dismissible, dynamic) this is appropriate; for static status indicators (e.g., "Online") it is too. But for an inert tag like a category label, `role="status"` may be over-announcing — consider conditional role: `status` when dynamic, omit when static. Low priority.
- Findings:
  - Hardcoded `"Dismiss"` label is not localisable; add `dismissLabel` input. Recommended default keeps backward compat.
  - Hit-target size for dismiss button needs to grow to meet WCAG 2.5.5 — the simplest path is to size the wrapper button at the square-interactive scale (`size-6` for xs/sm, `size-7` md, `size-8` lg/xl) and keep the SVG glyph at `size-4`/`size-5` via inner `<svg class="size-3 ..." />`.

## Form integration (if applicable)
- CVA: not applicable.
- Findings: nothing required.

## Tests
- Spec file: yes (`badge.spec.ts`, 405 lines).
- Coverage breakdown:
  - rendering: default + projection covered.
  - variants/colors/sizes: every value rendered.
  - pill: covered.
  - dismissible: button rendered, emit on click, Enter implied via native button.
  - dot: rendered, content hidden, size override applied.
  - a11y: `role="status"`, `aria-label="Dismiss"`, SVG presence.
  - leading icon: render, sized, with dismiss; every size matrix.
  - leading avatar: render, sized, ring/overlap, padding adjustment, dot precedence.
  - outputs: `dismissed` covered.
  - CVA: n/a.
- Vitest-specific issues: none — uses `setInput`, `vi.spyOn`. No `fakeAsync`.
- Findings:
  - Missing: focus-ring class assertion on the dismiss button (no `focus-visible:outline-primary-500` check).
  - Missing: hit-target size check on dismiss button (would fail today on current xs/sm/md sizes).
  - Missing: no test for the case where `dismissible=true` AND `dot=true` — currently `dot` short-circuits the entire dismiss branch (line 169), which is correct behaviour but should be asserted.

## Gaps & lacks
1. Hardcoded `"Dismiss"` label — not localisable. Add a `dismissLabel` input.
2. Dismiss button touch target is below WCAG 2.5.5 (16px) for xs/sm/md sizes — promote to the square-interactive icon sub-scale.
3. Solid-variant foreground uses `text-white`/`text-black` instead of `text-on-{role}` tokens. Same gap as Button.
4. `size-3.5` half-step at line 63 lacks the required inline comment justification.
5. Selector is `[twBadge]` (attribute) on a `Component` — unusual; either move to element selector (`tw-badge`) or document the rationale.
6. Tests miss: focus-ring on dismiss, hit-target size, dot+dismissible interaction.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal
Bring Badge up to WCAG-AA hit-target, on-role-token, and l10n compliance.

### Tasks
1. **Localise the dismiss-button label** — add a `dismissLabel` input.
   - File(s): `projects/ngx-tw/badge/badge.ts:182-189` (dismiss button template)
   - Why: Hardcoded English strings are a l10n blocker. Library API must allow consumers to translate.
   - Change: add `readonly dismissLabel = input('Dismiss');` with JSDoc, and bind `[attr.aria-label]="dismissLabel()"` on the dismiss `<button>`.
   - Acceptance: spec adds a case verifying a custom `dismissLabel` propagates to `aria-label`; default remains `"Dismiss"`.

2. **Promote dismiss-button hit target to the square-interactive scale** — WCAG 2.5.5.
   - File(s): `projects/ngx-tw/badge/badge.ts:44-78` (`size` variant slots — `dismiss` slot)
   - Why: Current `size-4`/`size-5` (16/20px) is below the 24px minimum recommended by WCAG 2.5.5 Target Size (AA Enhanced). The codified square-interactive icon scale is `size-6`(24)/`size-7`(28)/`size-8`(32)/`size-9`(36) for xs/sm/md/lg.
   - Change: in each per-size slot, change `dismiss` to `size-6 -mr-1` (xs/sm), `size-7 -mr-1.5` (md), `size-8 -mr-1.5` (lg/xl). Use negative margin to keep the visual badge height unchanged. The inner `<svg>` already has `size-full`; replace with explicit `size-3` (xs/sm), `size-3.5` (md), `size-4` (lg/xl) glyph sizes via a separate `dismissIcon` slot — OR keep `size-full` but constrain the SVG to centred `1rem` via padding inside the dismiss slot config.
   - Acceptance: spec asserts the dismiss `<button>` element's class includes `size-6` (xs/sm), `size-7` (md), `size-8` (lg/xl). Visual check at `/badge` shows badges still look compact but the dismiss button has a generous hit area. AXE shows no new violations.

3. **Migrate solid variants to `text-on-{role}` tokens** — same as Button.
   - File(s): `projects/ngx-tw/badge/badge.ts:95-132` (compoundVariants — `variant: 'solid'` rows)
   - Why: `theme/_semantic.css:138-151` defines `--color-on-{role}` for solid-fill foregrounds. Library has migrated; Badge has not.
   - Change: swap `text-white` → `text-on-{color}` and warning's `text-black` → `text-on-warning`. Neutral solid `text-fg` → `text-on-neutral`.
   - Acceptance: no `text-white`/`text-black` in compoundVariants; visual demo unchanged; tests still pass.

4. **Justify or replace `size-3.5` at line 63** — codified half-step rule.
   - File(s): `projects/ngx-tw/badge/badge.ts:63` (`leadingIcon: 'size-3.5'` in `size.md`)
   - Why: CLAUDE.md restricts `size-3.5` to xs-density chevrons inside compact triggers with an inline comment.
   - Change: either (a) normalise to `size-4` (matches lg/xl leading icon) or `size-3` (matches xs/sm), or (b) add an inline comment justifying it — md leading icon needs to sit between text-xs body and md text density. Recommended: keep `size-3.5` and add the comment; visual difference vs `size-4` is small but the half-step is intentional.
   - Acceptance: line carries an inline comment OR is changed; the codified rule passes a `grep -n "size-3.5"` audit.

5. **Decide on selector — keep `[twBadge]` or move to `tw-badge`** — convention alignment.
   - File(s): `projects/ngx-tw/badge/badge.ts:160-194` (selector + template)
   - Why: All other library components use element selectors. The attribute selector on a `Component` is the lone outlier.
   - Change: recommended path — keep `[twBadge]` and add a class-level JSDoc explaining "attribute selector chosen so consumers can attach the badge styling to `<span>`/`<a>`/`<div>` without an extra wrapper element". Alternative: split into a `tw-badge` element component + a `[twBadge]` directive — too invasive for the value.
   - Acceptance: JSDoc block documents the choice; no behavioural change.

6. **Fill spec gaps** — focus-ring, hit-target, dot+dismissible.
   - File(s): `projects/ngx-tw/badge/badge.spec.ts`
   - Why: Codified test rules require focus-ring assertion and interaction coverage.
   - Change: add `it('renders focus-visible outline on dismiss button')`, `it('renders dot-mode without dismiss button even when dismissible=true')`, and `it('uses square-interactive hit-target for dismiss button')`.
   - Acceptance: three additional passing tests; coverage report shows dismiss-button branch covered for the dot=true case.

### Out of scope
- Splitting `dot` into a sibling component — current shape is fine.
- Replacing inline SVG dismiss glyph with `<tw-icon>` — would force a peer dep on the icon registry just for the close glyph.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- badge`
- Visual check: demo app at `http://localhost:4600/badge`
- A11y: `npm run e2e:a11y` or AXE on the demo page

## Priority
**P1** — Hit-target is a real WCAG gap; `dismissLabel` is a real l10n gap. Both block production use cases.
