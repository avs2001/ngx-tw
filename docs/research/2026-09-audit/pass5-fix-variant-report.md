# Pass 5 FIX — variant vocabulary unification + two `flip-card` fixes

Agent scope: `projects/ngx-tw/{card,flip-card,code-block,stat,accordion,collapsible}/`
plus `projects/demo/src/app/routes/{card,flip-card,code-block,stat,accordion,collapsible}/`.

**Status: complete.** Both `flip-card` fixes landed. All 10 of the 11 in-scope renames landed
(the 11th, `segmented-control`'s `filled → solid`, is another agent's file — see
*Partial-landing note* below).

> **Path correction.** The brief names the demo pages as
> `projects/demo/src/app/routes/components/{…}`. There is no `routes/components/` directory;
> the real path is `projects/demo/src/app/routes/{card,flip-card,…}/`. I worked the real paths.

---

## Task 2 — `flip-card` (done first, per the sequencing note)

### CDK F-7 (MEDIUM) — double announcement in manual mode

**Verified the anchor before editing.** The finding is correct: `flip-card.ts` bound
`[attr.aria-live]="ariaLive()"` on the host, `ariaLive()` returned `'polite'` for
`trigger === 'manual'`, and the `effect()` called `LiveAnnouncer.announce(...)` unconditionally
on every flip. The component's own comment stated the contradiction.

**What I changed.** Deleted the `ariaLive` computed and its host binding; `LiveAnnouncer` is now
the single channel in all four trigger modes. Rewrote the effect's comment to record *why* the
region was the half that went (narrower — manual only; and a live region on a host that also
carries `role` + `aria-label` is announced inconsistently across ATs).

Kept deliberately: `hostRole()` (`region` in manual mode) and `hostAriaLabel()` (the
`'Flip card'` fallback). Manual mode still needs a *named* region for AXE — that is a separate
concern from the live region, and removing it would trade one defect for another.

**Guards** (`flip-card.spec.ts`):

| Spec | Non-vacuity |
|---|---|
| `manual mode announces through LiveAnnouncer only — no host aria-live region` | Against the old code `ariaLive()` returned `'polite'` for `trigger="manual"`, so `getAttribute('aria-live')` was `'polite'`, not `null` — **this line fails**. The second half (`announce` called exactly once) passed before and after; it is there to prove the surviving channel was not deleted along with the region. |
| `no trigger mode puts an aria-live region on the host` | Loops all four modes. The `manual` iteration fails against the old code for the same reason. |
| existing `manual mode sets role=region, no tabindex, …` | **Rewritten** — it asserted `aria-live === 'polite'`, which is now the wrong expectation. Renamed and the assertion dropped; the `role`/`tabindex`/`aria-pressed` assertions are unchanged. |

Two traps the advisor flagged and I designed around: the effect's `firstRun` swallow means
mounting with `flipped: true` announces nothing (so the spec mounts, stabilises, *then*
toggles), and `hasBack()` is set asynchronously via `MutationObserver` in `afterNextRender`
(so the spec reuses the file's existing `flushBack()` helper rather than new plumbing).

### THEME F10 (LOW) — `duration-300`

**Chose option (a): keep `duration-300`, justify it in a comment.** Rationale, for the CLAUDE.md
carve-out you offered to add:

> The codified scale (`duration-150` / `duration-200` / `duration-normal`) is calibrated for
> colour and shadow shifts, which travel no distance. A flip card is a 180° 3-D rotation of the
> entire card through `rotateY`/`rotateX`. At 200ms the faces swap before the perspective reads
> as depth and the flip looks like a hard cut rather than a rotation; 300ms is the shortest step
> at which the motion reads as one continuous rotation. The `motion-reduce:transition-none`
> guard the scale requires is applied.

**Suggested CLAUDE.md wording** (a row in the Transitions table): *`duration-300` — large-travel
3-D transforms (card flip). Off the standard scale; only permitted with an inline comment saying
why, and only with `motion-reduce:transition-none`.*

I did **not** take option (b). A `--duration-slow` token would be the tidier answer, but
`theme/_typography.css` is not mine and a single consumer does not yet justify a new
theme-overridable token. **Proposed, not done.** If you'd rather have the token, it is a
two-line change in `_typography.css` plus swapping `duration-300` → `duration-slow` here.

The comment lives in the `tv()` slots object literal (plain TS), **not** in the `template:`
literal — the house rule about braces/backticks in inline-template comments.

The existing spec `uses the standard duration-300 token` was renamed to
`uses the off-scale duration-300 flip token` with a comment explaining the carve-out, so the
token is guarded against a well-meaning "fix" to 200 *and* against arbitrary `duration-[…]`.

---

## Task 1 — the renames

### Mechanism — A1.0 applied verbatim, 10 times, no per-component re-decision

Per component file (module-private, no new shared helper in `core/`):

```ts
export type XVariant = <canonical arms> | XVariantLegacy;

/** @deprecated <old> is an alias for <new> …; removed in the next major. */
export type XVariantLegacy = <legacy arms>;

type XVariantCanonical = Exclude<XVariant, XVariantLegacy>;
const VARIANT_ALIASES: Readonly<Record<XVariantLegacy, XVariantCanonical>> = { … };

/** @internal Canonical variant with legacy spellings folded in. */
private readonly resolvedVariant = computed<XVariantCanonical>(() => { … });
```

…then `tv()`'s variant keys, `compoundVariants` rows and `defaultVariants` moved to the
canonical spelling, and `resolvedVariant()` (never `variant()`) feeds `tv()`.

The narrowed `computed<XVariantCanonical>` return type is load-bearing, not decoration: it is
what makes the compiler prove normalisation happened. Without it a widened union flows straight
into `tv()` and a missed alias is silent.

### Semver — the promise and what enforces it

Every old string still compiles and still renders **byte-identical classes**. Each of the six
exported `*Variant` aliases **gains** an arm and loses none — additive, non-breaking.
`CollapsibleDisplay.variant` widens transitively, also additive.

Why byte-identical matters here specifically: measured behaviour of the installed
`tailwind-variants` is that an unrecognised variant value returns **base classes only** — no
throw, no console warning. A missed alias produces a silently unstyled component. That is the
failure mode every regression spec is written against, which is why each asserts **string
equality**, not `toContain`.

| Type | Before | After |
|---|---|---|
| `CardVariant` | `elevated \| outlined \| ghost` | `elevated \| outline \| ghost \| CardVariantLegacy('outlined')` |
| `FlipCardVariant` | `outlined \| elevated \| ghost` | `outline \| elevated \| ghost \| FlipCardVariantLegacy('outlined')` |
| `CodeBlockVariant` | `filled \| outlined` | `solid \| outline \| CodeBlockVariantLegacy('filled'\|'outlined')` |
| `StatVariant` | `plain \| outlined \| elevated \| filled` | `ghost \| outline \| elevated \| solid \| StatVariantLegacy('plain'\|'outlined'\|'filled')` |
| `AccordionVariant` | `default \| bordered \| ghost` | `default \| outline \| ghost \| AccordionVariantLegacy('bordered')` |
| `CollapsibleVariant` | `default \| bordered \| ghost \| filled` | `default \| outline \| ghost \| solid \| CollapsibleVariantLegacy('bordered'\|'filled')` |

**One deliberate deviation from A1.0's sample code.** A1.0 writes `export type CardVariantLegacy`.
I export it from the *component file* (so the `@deprecated` tag lands on an exported declaration
in the emitted `.d.ts`) but **did not re-export it from any `index.ts`**. Rationale: adding six
new names to the public barrel for a shim scheduled for removal makes the removal itself a second
breaking change. Consumers never need the name — the `*Variant` union they already import carries
the legacy arm.

`@deprecated` is JSDoc, not `//`, on both the `*Legacy` type and (restated) the `variant` input.
Noted from the brief that Compodoc isn't installed and `scripts/mcp/extract-api.mjs` is the real
reader — it parses JSDoc blocks, so the form is right either way.

**What the deprecation actually reaches, stated precisely** (an earlier draft of this report
over-claimed): a consumer writing `variant="outlined"` is matching a string literal against a
union, *not* referencing the `CardVariantLegacy` symbol — so there is **no IDE strike-through at
the use site**. The tag on the `*Legacy` alias documents the deprecation in the emitted `.d.ts`
(and is what `extract-api.mjs` can parse); the restatement in the `variant` input's own JSDoc is
what a consumer actually sees, on hover at the use site. Both were needed; neither alone is
sufficient.

### Default-value changes (A1.7 wrinkles 3 & 4)

Three components had a legacy string as their *default*; all three moved:

- `flip-card` — `defaultVariants` **and** the input default: `'outlined'` → `'outline'`
- `stat` — `defaultVariants` **and** the input default: `'outlined'` → `'outline'`
- `code-block` — `defaultVariants` **and** the input default: `'filled'` → `'solid'`

Their demo API tables print the default literally; all three updated.

### Per-component notes

**`card`** — 7 `compoundVariants` rows rekeyed, `defaultVariants` (`'elevated'`) untouched,
`color` JSDoc prose fixed ("Only applies to `outline` variant borders").

**`flip-card`** — no compound rows; default moved; JSDoc default reference updated.

**`code-block`** — hit twice (`filled→solid`, `outlined→outline`); one alias map with two entries.

**`stat`** — three renames on one type. `statDelta`'s `StatDeltaVariant`
(`badge | inline | icon-only`) is a different axis and was **not touched** (A1.7 wrinkle 2);
verified by grep that no `statDelta` key or default moved.

**`accordion`** — `resolvedVariant` inserted immediately above the `hostClasses` override so the
field initialiser order is correct; `hostClasses` is an `override` of
`CollapsibleGroupComponent`'s and now reads `resolvedVariant()`.

**`collapsible`** (A1.7 wrinkle 1, the awkward one) — `variant` arrives through the `display`
config bag, not a bare input. Normalisation lives **inside `resolvedDisplay()`**, and
`DISPLAY_DEFAULTS.variant` moved to the canonical `'default'` spelling. `resolvedDisplay()`'s
return type is no longer `Required<CollapsibleDisplay>` (whose `variant` stays wide after the
union widens, losing the compiler guard) but a new module-private
`ResolvedCollapsibleDisplay = Required<Omit<CollapsibleDisplay,'variant'>> & { variant:
CollapsibleVariantCanonical }`. Not exported — no semver impact. I grepped every reader of
`resolvedDisplay` first: it is read only inside `collapsible.ts` itself (`variantResult`), so
narrowing it breaks nothing. 15 `compoundVariants` rows rekeyed (8 solid + 7 outline) plus their
section comments; the `CollapsibleDisplay.color` JSDoc that named both `bordered` and `filled`
now names `outline` and `solid`.

### Regression specs — one per renamed component, with non-vacuity reasoning

All six assert **string equality** between the legacy and canonical spellings' rendered
`className`. That shape is self-evidently non-vacuous: delete the entry from `VARIANT_ALIASES`
and `tv()` returns base-only for the legacy string, so the two strings diverge and the test goes
red. Each also carries a "not the bare base classes" assertion so the pair cannot both collapse
to base and still compare equal.

| Component | Spec(s) | Notes |
|---|---|---|
| `card` | `"outlined" resolves to exactly the same classes as "outline"` + 2 supporting | **`color` is set to `'primary'`, not left at the default.** Card has no `neutral` compound row, so at the default colour the 7-row rekey — the highest-risk mechanical edit in that file — would have been completely unguarded. This was the one real trap in the set. |
| `flip-card` | `"outlined" resolves to exactly the same classes as "outline"` | Compares both the face and the root element. |
| `code-block` | `"filled"…"solid"`, `"outlined"…"outline"` | Two pairs. |
| `stat` | table-driven over all three pairs | `plain/ghost`, `outlined/outline`, `filled/solid`. |
| `accordion` | `"bordered" resolves to exactly the same classes as "outline"` | Also asserts `border-border` + `divide-y` survive. |
| `collapsible` | table-driven, 3 cases | `bordered/outline @ primary`, `filled/solid @ primary`, `filled/solid @ neutral`. Compares root **and** trigger **and** content class strings (the panel is opened so `content` is in the DOM), because the solid compound rows paint all three. Outline has no `neutral` row so it is checked at `primary`; solid does have one, so it is checked at both. The panel is opened **and `detectChanges()`d before either measured read** — the content wrapper carries `[animate.enter]="'collapsible-enter'"`, so letting it enter the DOM inside the first read could leave a transient enter class on one side of the comparison and not the other, producing a false failure that reads like a broken alias. |

Existing specs that set the old spellings were **renamed to the new spelling** rather than
deleted, and the alias coverage is the new block above — so both spellings are exercised, which
is what A1.0 asked for.

### Demo pages

Every usage in my six demo route trees migrated to the canonical spelling: `VARIANTS` arrays,
template attributes, `[display]` object literals, playground signals, copy-paste snippet
strings, prose in `<code>` tags, API-table default cells, and the "Types" code-block snippets
(which now also show the `*VariantLegacy` alias with its `@deprecated` tag, so the deprecation is
documented where a consumer will look).

Two prose fixes beyond the mechanical rename, because the substitution made them read badly:
"Tints the **outline** of the `outlined` variant" → "Tints the **border** of the `outline`
variant" (`card-api`, `card-examples`).

---

## Files touched

**Library (12):**
`projects/ngx-tw/card/card.ts`, `card.spec.ts`;
`projects/ngx-tw/flip-card/flip-card.ts`, `flip-card.spec.ts`;
`projects/ngx-tw/code-block/code-block.ts`, `code-block.spec.ts`;
`projects/ngx-tw/stat/stat.ts`, `stat.spec.ts`;
`projects/ngx-tw/accordion/accordion.ts`, `accordion.spec.ts`;
`projects/ngx-tw/collapsible/collapsible.ts`, `collapsible.spec.ts`.

No `index.ts` was modified (see the deliberate deviation above). No `.meta.ts` needed changes —
none of them names a variant string.

**Demo (18):** all three pages (`overview`, `examples`, `api`) under
`projects/demo/src/app/routes/{card,flip-card,code-block,stat,accordion,collapsible}/`.

**e2e (2) — outside my stated ownership, flagged explicitly:**

- `e2e/specs/01-components/flip-card.spec.ts` — line 60 asserted
  `toHaveAttribute('aria-live', 'polite')` on the manual-mode card. My F-7 fix invalidates it.
  I replaced it with an equivalent region-mode proxy (no `aria-pressed`, no `tabindex`, a
  non-empty `aria-label`) and a comment recording why the live region went. **I judged fixing
  this better than knowingly leaving a red e2e spec**: the file is flip-card-specific, no sibling
  agent owns flip-card, and it is not a shared file. Flagging it so you can veto.
- `e2e/specs/01-components/card.spec.ts` — a one-word comment fix (`outlined` → `outline`); no
  assertion involved.

---

## Verification performed

Per the brief I did **not** run `ng test` / `ng build` / Playwright.

- `npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json` — **clean**.
- A scratchpad tsconfig scoped to only my six library directories (sources + `index.ts` +
  `*.meta.ts` + **all six spec files**) — **clean**. This is the check that proves the specs
  compile against both spellings without dragging sibling agents' in-flight edits into the program.
- A scratchpad tsconfig scoped to my six demo route trees — **13 errors, all stale-dist, all
  confirmed false.** The root tsconfig maps `@cdevhub/ngx-tw/*` → `./dist/ngx-tw/*`, and
  `dist/ngx-tw/types/cdevhub-ngx-tw-card.d.ts` still reads
  `type CardVariant = 'elevated' | 'outlined' | 'ghost'` from the 00:48 build. Re-running the same
  check with `paths` repointed at `projects/ngx-tw/*/index.ts` — **clean, zero errors**. They
  clear on the orchestrator's central rebuild. Recording this so nobody chases the phantom.
- Grep sweep across all six library directories: no legacy string survives outside a
  `@deprecated` doc line, a `*Legacy` type arm, an alias-map key, or a regression spec.
- Grep sweep for external readers of the six `*Variant` types and `CollapsibleDisplay` across
  `projects/ngx-tw` and `projects/demo` — only the two out-of-scope demo files listed below.
- **Real declaration emit** (`--declaration --emitDeclarationOnly`) over all six entry points —
  **exit 0**. `--noEmit` skips declaration diagnostics, so this was a genuine gap rather than a
  redundant run; see Residual risk. Spot-checked the output: every `*Variant` union carries its
  widened arm, every `*VariantLegacy` carries its `@deprecated` tag, and the two module-private
  `collapsible` aliases hoist correctly into the `.d.ts`.

---

## Things I chose **not** to do

1. **`segmented-control`'s `filled → solid`** — another agent's file, excluded by the brief.
   **The `filled → solid` family is therefore only partially landed:** `code-block`, `collapsible`
   and `stat` are canonical; `segmented-control` still spells it `filled`. Until that lands, the
   library speaks both vocabularies on this one axis. It is behaviourally harmless — nothing
   shares a `tv()` config across that boundary — but it is a real inconsistency in the public API
   surface and should be scheduled.

2. **Two out-of-scope demo files still passing legacy strings** — build-clean and pixel-identical
   through the aliases, so they are safe to leave, but they are residue a later sweep should pick up:
   - `projects/demo/src/app/routes/foundations/rhythm/panels/container-panel.ts:134,151,320,326`
     — accordion `variant="bordered"` ×2 and `CollapsibleDisplay { variant: 'bordered' }` ×2.
   - `projects/demo/src/app/routes/empty-state/examples/empty-state-examples.component.ts:212,477`
     — card `variant="outlined"` (one live, one snippet string).

   A1.1/A1.2's demo-reference lists name both, but neither sits under my six route trees and my
   ownership block overrides A1.2's convenience list. A grep-driven sweep of `projects/demo` will
   pull them in — that would be a cross-boundary edit, so I left them.

3. **A `--duration-slow` theme token** — proposed above, not done; `theme/_typography.css` is not
   my file.

4. **Re-exporting `*VariantLegacy` from the entry-point barrels** — reasoning under
   *One deliberate deviation* above. Say the word and it is six one-line edits.

5. **`scripts/mcp/content/conventions.md:161`** says "outlined surfaces darken border" — generic
   English about a surface treatment, not a variant identifier, and a shared file. Left alone.

---

## Residual risk

- **~~Declaration-emit gap~~ — raised, then closed empirically.** `tsc --noEmit` does not run
  declaration-emit diagnostics, and one edit was exposed to that gap:
  `collapsible.resolvedDisplay` is a **public** member (`readonly`; `@internal` is only a JSDoc
  tag) whose return type changed from the exported `Required<CollapsibleDisplay>` to the
  module-private `ResolvedCollapsibleDisplay`. I ran a real `--declaration --emitDeclarationOnly`
  over all six entry points rather than reasoning about it: **exit 0**, and the emitted
  `collapsible.d.ts` hoists both private aliases as local `declare type`s
  (`ResolvedCollapsibleDisplay` at line 30, `CollapsibleVariantCanonical` at line 14) with
  `resolvedDisplay: Signal<ResolvedCollapsibleDisplay>` resolving against them. All six `.d.ts`
  files also carry their `@deprecated` tag. **No longer a risk.**

  I deliberately did *not* make the member `protected` or re-widen its type instead: narrowing a
  public `@internal` member is a larger semver question than the risk justified, and the
  narrowing is what gives the compiler-proof guard.
- **The unbuilt-dist blind spot.** Nothing in my verification exercised the demo *templates*
  (`variant="outline"` attributes, `[display]="{ variant: 'solid' }"` literals) — plain `tsc`
  does not type-check Angular templates and I could not run `ng build`. Every such literal is now
  a member of its widened union, and the source-paths type-check covers the TS-side constants
  those templates are typed against, so I rate the risk low. But the orchestrator's central build
  is the first thing that actually proves it.
- **AT behaviour of the F-7 fix is reasoned, not measured.** The audit itself rated its
  confidence on exact AT behaviour lower than the design-intent contradiction (which is why it was
  MEDIUM, not HIGH). What is now unambiguous is that there is exactly one announcement channel
  and it fires exactly once per flip. Whether manual-mode SR users preferred the region's phrasing
  to `LiveAnnouncer`'s "Back face visible" is a product question this fix does not answer.
