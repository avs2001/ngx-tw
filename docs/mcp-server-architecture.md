# ngx-tw MCP server — architecture

Status: proposed (2026-07-22). Scope: a stdio MCP server that lets Claude Code write correct
ngx-tw code without reading the library source.

Revision 2 supersedes the first draft on three points, all in "Keeping it in sync": the index is
no longer committed, the enforcement point is `release.mjs` rather than a CI job, and snippet
validation is AST-based rather than compile-based. Each correction is called out where it lands.

## The constraint that decides everything

A consumer installs `@cdevhub/ngx-tw` from npm. That tarball contains compiled JS, `.d.ts`,
and theme CSS — **not** the component `.ts` source, and **not** the demo app. So the server
can do *zero* parsing at runtime.

Everything it serves is baked into a static `index.json` at **library build time**, inside this
monorepo, where source and demo both exist. The server is a thin reader.

```
monorepo (build time)                     consumer machine (run time)
─────────────────────                     ───────────────────────────
projects/ngx-tw/**/*.ts   ─┐
projects/demo/**/examples  ├─► extractor ─► index.json ─► stdio server ─► Claude Code
projects/ngx-tw/theme/*.css┘                (bundled)      (reads once)
```

## Packaging

Companion package in this monorepo, lockstep-versioned with the library:

```
@cdevhub/ngx-tw        ← components only, unchanged, sideEffects:false
@cdevhub/ngx-tw-mcp    ← bin/server.js + index.json + MCP SDK dep
```

```json
{ "mcpServers": { "ngx-tw": { "type": "stdio", "command": "npx", "args": ["-y", "@cdevhub/ngx-tw-mcp"] } } }
```

## The unit is the entry point, not the class

`badge/index.ts` exports `BadgeComponent` **and** `BadgeDotDirective` **and** the `BadgeVariant`
type. `get_component('badge')` must return all of them, and the index schema must model an entry
point as *a set of exported symbols* — components, directives, and types — each with its own
selector and usage form (element `tw-card` vs attribute `[twBadge]`).

Bake this into the schema on day one. Retrofitting a one-class-per-entry-point assumption across
50+ components is the kind of rework that kills the project midway.

## Three content layers, three sources of truth

| Layer | Authority | Derivation |
|---|---|---|
| API — selectors, symbols, inputs/outputs/models, types, defaults, JSDoc | component **source** | extracted |
| Usage examples | demo `*Snippet` literals | extracted |
| Guidance — summary, whenToUse, whenNotToUse, related, aliases | `*.meta.ts` | hand-authored |

**API from source, not `.d.ts`** — `.d.ts` erases the default in `input<BadgeVariant>('soft')`,
which is exactly what a consumer needs. And not from the demo `api/*-api.component.ts` HTML
tables: those are hand-authored and already the library's most drift-prone surface. Compodoc is
**not installed** in this repo despite what CLAUDE.md implies, so there is no `documentation.json`
to lean on.

**Examples from the `*Snippet` string literals** in `projects/demo/src/app/routes/<name>/`. The
`demo-doc-page` skill mandates the `{section}Snippet` naming convention (Pattern B), so the
extraction target is stable. Extract literals only; read the template solely to pair each snippet
with its nearest preceding `<h2>` for a title.

**Guidance in a co-located `badge.meta.ts`** — the non-derivable layer, and the one that actually
earns the tool its keep: it disambiguates menu vs select vs combobox vs command-palette, dialog vs
sheet vs popover.

```ts
// projects/ngx-tw/badge/badge.meta.ts — build-time only, NOT exported from index.ts
export const meta = {
  summary: 'Compact status label, count, or tag applied to any element.',
  whenToUse: ['Status on a table row', 'Counts on a nav item', 'Categorical tags'],
  whenNotToUse: [
    { instead: 'alert', because: 'the message needs a full-width dismissible banner' },
    { instead: 'stat', because: 'the number is the primary content, not an annotation' },
  ],
  related: ['alert', 'stat', 'tags-input'],
  aliases: ['chip', 'pill', 'tag', 'label', 'counter'],
} satisfies ComponentMeta;
```

Deliberately not a full `docs.md` per component: that is a third prose source drifting against two
others, times 50+. `aliases` is what makes search work — "dropdown" must reach menu, select, and
combobox.

## Cross-cutting content

- **Conventions** (`content/conventions.md`) — tokens, size/spacing scale, focus-ring pattern,
  radius scale, `animate.enter` rules. Hand-distilled from CLAUDE.md's styling sections.
- **Getting started** (`content/getting-started.md`) — peer deps, Tailwind v4 `@theme` wiring,
  theme CSS import, `provideTheme`.
- **Theme tokens** — scraped from `theme/_semantic.css` / `_typography.css` (`--color-*`,
  `--text-*`, `--duration-*`). Machine source, so it stays true; stops the model inventing
  `bg-brand-500` or `text-[11px]`.
- **Icons — reframed.** There is no catalogue to ship. `IconRegistry` is BYO: the consumer calls
  `provideTwIcons()` / `provideTwLucideIcons()` and valid names are whatever they registered.
  Document the *registration model* in getting-started; a name list would be wrong for every
  consumer.

## Tool surface

Few tools, richly described. `get_component` returns everything about one entry point in one
response — Claude Code pays a round-trip per call.

| Tool | Input | Returns |
|---|---|---|
| `search_components` | `query`, `limit?` | Ranked `[{name, summary, importPath, whenToUse, aliases}]` |
| `get_component` | `name` | Full entry-point record: symbols, API, snippets, guidance, related |
| `list_components` | — | Names + one-line summaries |
| `get_conventions` | `topic?` | Styling / token / a11y rules |
| `get_started` | `topic?` | Install, Tailwind wiring, theme, icon registration |
| `list_theme_tokens` | `kind?` | Semantic color / surface / typography / duration tokens |

Search is lexical — weighted matching over name, aliases, summary, whenToUse, with prefix and
fuzzy fallback. ~50 components does not justify embeddings.

---

# Keeping it in sync

This is the part that decides whether the tool is an asset or a liability. An MCP server does not
merely go stale — it *amplifies*: every consumer's Claude confidently emits whatever the index
says. A wrong index is worse than no index.

Two facts about this repo shape the whole answer:

1. **CI is advisory.** `ci.yml` says so in its own header — `develop` has no branch protection and
   no rulesets, so a red run blocks nothing. A sync mechanism living only in a CI job is theater.
2. **`scripts/release.mjs` is the real gate.** Its local pre-flight — `lint`, `build:lib`,
   `test:ci`, `pack:check`, `verify:package` — runs blocking, locally, before anything publishes.

So the enforcement point is `release.mjs`, not a workflow file. *(This corrects revision 1, which
proposed a CI check as the primary guard.)*

The strategy is four levels, strongest first. Each level handles the drift the level above cannot.

## Level 0 — Generate, never store

`index.json` is **generated during `build:lib` into `dist/ngx-tw/`, and never committed.**

Revision 1 proposed committing it plus a `--check` mode that fails when regeneration differs.
That is backwards: committing a derived artifact *manufactures* the drift class it then polices.
A generated-at-build index cannot be stale, because there is no stored copy to be stale.

This single decision eliminates the entire "index doesn't match source" failure mode for the two
extracted layers. Everything below exists to handle the layers extraction can't reach.

Two corollaries worth wiring:

- **The MCP package build consumes the library's `dist` index and fails without it.** Version
  lockstep becomes mechanical rather than aspirational — you cannot publish an MCP package built
  against an absent or older library.
- **The server reports the library version in every response.** If a consumer's `.mcp.json`
  pins an old version, Claude can see the mismatch rather than silently trusting it.

## Level 1 — Validate at build, fail the build

New script `scripts/verify-mcp-index.mjs`, run right after generation. It has the full index in
memory, so every check below is a data lookup, not new analysis. Five checks:

**1. Coverage, both directions.** Every entry point in `public-api.ts` has a `*.meta.ts`; every
`*.meta.ts` maps to a live entry point. The second direction catches the orphan — a component
renamed or removed, its meta left behind describing something that no longer exists. This is the
same failure shape as the entry-point 4-edit checklist that CI otherwise silently skips.

**2. Link integrity.** Every `related: [...]` name and every `whenNotToUse[].instead` resolves to
a real entry point. This is the highest-value prose check available, because cross-references are
the one part of hand-written guidance that rots *mechanically* when a component is renamed.

**3. Snippet API validation — the important one.** Demo snippets are template literals. Nothing
compiles them, nothing type-checks them, and the `demo-doc-page` skill has them duplicating the
live markup rendered right above. Remove an input and the snippet keeps advertising it — in the
demo *and* in the index.

Parse each HTML snippet with `parseTemplate` from `@angular/compiler` (Angular-syntax-aware, so
`@for` / `@if` parse correctly), walk the AST for `tw-*` elements and `tw`-prefixed attribute
bindings, and check every selector and binding name against **the API layer of the same index**.
Build-fails on a binding that doesn't exist.

*(This replaces revision 1's compile-check-every-snippet idea, and a subclass-of-the-demo-component
variant of it. Both false-positive on perfectly good illustrative snippets that reference symbols
the demo class doesn't define, and neither can touch `.ts` snippets. The AST check has zero false
positives and needs no compile infrastructure.)*

The trade: it won't catch a bad enum literal (`variant="siolid"`). That's rare long-tail in
curated docs, and worth trading for a gate nobody has a reason to disable.

**Coverage boundary as implemented.** Three checks run at different scopes; read the gate as
strong-but-bounded, not comprehensive:

| Scope | What runs |
|---|---|
| Every element, everywhere | `tw-*` element selectors must exist; every `tw`-prefixed binding or attribute must resolve to a real directive, input, or `ng-content` projection marker |
| Elements a library symbol owns | *Exhaustive* binding validation against that symbol's full API |
| Deliberately skipped | See below |

Exhaustive validation is skipped, by design, when:

- **A symbol extends a base the extractor cannot see** (`StepperComponent extends CdkStepper`).
  Its inherited inputs are real but invisible to a source-only extractor, so flagging them would
  be a false positive. Affects table, tree, stepper, calendar, and other CDK-derived components.
  In-library base classes *are* followed, so only external bases lose coverage.
- **A binding name collides with a native/framework passthrough** (`value`, `disabled`, `label`,
  `checked`, `open`, `selected`, `placeholder`, …). Renaming an input to one of these names is
  the one drift class check 3 cannot see.
- **A valueless bare attribute outside the `tw` namespace** — `<input twInput uppercaseValue />`
  demonstrates pairing a library directive with a consumer-written one. Anything `tw`-prefixed
  stays fully checked.
- **A snippet that does not parse as a pure Angular template** — several `html`-labelled snippets
  deliberately lead with a TS fragment showing the wiring. Those warn rather than fail; the check
  exists to catch API drift, not to police snippet formatting.

Empirically the check finds a renamed input, a renamed output, a renamed selector, and a broken
import path, with zero false positives across the current 733-snippet corpus.

**4. Import-path validation.** Every `@cdevhub/ngx-tw/*` path appearing in a `ts` snippet is a
real entry point. Cheap, and catches the single most damaging error class — Claude emitting an
import that doesn't resolve.

**5. Warn (don't fail) on an entry point with zero snippets.** Signals a missing or renamed demo
page without blocking a release on documentation debt.

## Level 2 — Type-check the guidance layer

`meta.ts` files are hand-authored TypeScript, so the compiler can enforce their shape — but only
if something actually compiles them.

`tsconfig.lib.json` includes `badge/**/*.ts`, so a `meta.ts` is nominally in the lib program.
**Do not rely on that.** ng-packagr compiles the graph reachable from each entry point's
`entryFile`, and a `meta.ts` deliberately not exported from `index.ts` is unreachable. Whether it
is type-checked is an ng-packagr implementation detail, and a guarantee resting on one is not a
guarantee.

Make it explicit instead: a dedicated `tsconfig.meta.json` with the single glob `*/*.meta.ts`,
type-checked via `tsc --noEmit` inside `verify:mcp-index`. Under our control, unconditional, one
line of config.

Use a **single glob, not a per-directory include list** like `tsconfig.lib.json` and
`tsconfig.spec.json` use. Those lists are exactly why adding an entry point here takes four
coordinated edits; do not make it five.

What this buys: `ComponentMeta` shape violations and missing required fields become compile
errors. What it does **not** buy — despite being tempting — is rename safety via a
`component: BadgeComponent` field. A `Type<unknown>` field can't be checked against the entry
point's *name*, which is what the index keys on. Level 1's coverage check is the honest mechanism
for that; don't duplicate it in the type system and claim a stronger guarantee than holds.

## Level 3 — Wire it into the gate that actually gates

```diff
  step('Local pre-flight: lint, build:lib, test:ci, pack:check, verify:package');
  shInherit('npm run lint');
  shInherit('npm run build:lib');
+ shInherit('npm run verify:mcp-index');
  shInherit('npm run test:ci');
  shInherit('npm run pack:check');
  shInherit('npm run verify:package');
```

That diff is the sync mechanism. Everything above is the machinery it invokes; this is where it
becomes binding, because `release.mjs` is what a human actually has to get past to publish.

Add the same script as a CI job too — advisory, but it surfaces breakage on the PR instead of at
release time, which is when you want to know.

## What we deliberately do not do

| Rejected | Why |
|---|---|
| Commit `index.json` + `--check` mode | Manufactures the drift class it polices. Generate into `dist` instead. |
| Compile-check snippets (throwaway or subclass component) | False-positives on illustrative snippets referencing non-member symbols; can't cover `.ts` snippets; needs compile infra. Level 1.3 covers the real drift. |
| Hash the API to flag stale `whenToUse` prose | Fires on every input tweak. `whenToUse` goes stale when *purpose* changes, not when an input is added. Trains rubber-stamping, which is worse than no check. |
| Derive snippets from demo templates via marker comments | Would kill the duplication, but demo galleries are `@for` loops over variant arrays; the extracted markup would be loop scaffolding, not idiomatic consumer code. |
| A per-component `docs.md` | A third prose source, drifting against source and demo, times 50+. |

## Residual risk — owned by humans, not machines

Two things no mechanism above catches, stated plainly rather than papered over:

- **Purpose drift in `whenToUse` prose.** If a component's role in the system changes, the
  guidance silently misleads. No signal exists. Mitigation is review discipline: `meta.ts` is
  co-located, so it appears in the same diff as the component it describes.
- **`conventions.md` drifting from CLAUDE.md.** It is a hand-maintained distillation. Extracting
  from CLAUDE.md directly is the alternative, but that file is written for contributors, not
  consumers, and the distillation is the value.

Both are prose-quality problems, which is also the project's main risk overall: a bulk-generated
`whenToUse` that restates the class name adds nothing to an LLM's decision. Budget real review
time.

### Guidance entries awaiting human review

All 56 `*.meta.ts` files were authored against each component's real demo overview prose and class
JSDoc, not generated from names. Machine-checkable properties (shape, coverage, link integrity)
pass. The prose itself is not machine-checkable, and three entries specifically rest on authorial
judgement rather than existing documentation — they are the ones to read first:

| Entry | Why it needs an eye |
|---|---|
| `sheet` → `whenNotToUse: collapsible` | Overlay-vs-inline is a genuine decision, but no overview prose states it. Keep or drop. |
| `button` → `whenNotToUse: menu / segmented-control / switch` | The button demo page has no "Related components" section; these are semantic disambiguations, not distilled prose. |
| `paginator` → `whenNotToUse` | A `carousel` entry was dropped during authoring as unsupported padding. The remaining entries are grounded; the omission is worth confirming. |

Nine entry points carry no `whenNotToUse` at all — `form-field`, `file-upload`, `sort`, `avatar`,
`icon`, `code-block`, `aspect-ratio`, `core`, `theme` — because no genuine alternative existed.
That is the intended outcome: an omitted comparison is better than a fabricated one.

## North star (not this deliverable)

Once the index exists and is trustworthy, the demo's hand-authored API tables should render *from*
it. That collapses the library's worst existing drift surface and leaves one source feeding both
documentation surfaces. Worth stating as direction; explicitly out of scope for shipping the tool.

## Build order

1. `scripts/build-mcp-index.mjs` — API extractor over source, entry-point-shaped schema. Validate
   against `badge` (multi-symbol, attribute selector) and a hard case (`table` or `calendar`).
2. Snippet extractor — `*Snippet` literals + `<h2>` titles.
3. `ComponentMeta` type + `tsconfig.meta.json` + `meta.ts` for ~5 components. Validate the shape
   before generating 50.
4. `scripts/verify-mcp-index.mjs` — the five Level 1 checks. Land it **before** bulk-authoring, so
   the bulk pass is validated as it lands rather than audited afterwards.
5. Bulk-seed remaining `meta.ts` from demo overview prose, with human review.
6. `projects/ngx-tw-mcp/` — `@modelcontextprotocol/sdk` stdio server, six tools.
7. `release.mjs` pre-flight line, CI job, publish config, README `.mcp.json` section.

Steps 1–2 are independently useful. The server itself is trivial once the index exists — which is
the point: the hard part of this project is sync, not MCP.
