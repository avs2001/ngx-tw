# Prompt: Build `twAspectRatio` for ngx-tw

> Source of truth: this document. Read it end-to-end before opening any code file.

---

## Context

Before writing code, read:

- `.claude/CLAUDE.md` — directive selector convention (`tw` camelCase prefix for attribute selectors), class-naming rule (no `Tw` prefix on the class), `host` bindings rule (no `@HostBinding`), signal API rules, JSDoc requirements.
- `projects/ngx-tw/badge/badge-dot.ts` — **canonical structural peer**. A tiny attribute directive: `selector: '[twBadgeDot]'`, `exportAs`, signal `input()`s, a single `computed()` feeding `host: { '[class]': '...' }`. Mirror its shape exactly, but bind a host **style** instead of a class.
- `projects/ngx-tw/badge/index.ts` and `projects/ngx-tw/badge/ng-package.json` — the secondary-entry-point boilerplate to copy.

CDK modules to import: **none.** This is pure CSS — `aspect-ratio` is a browser-native property. There is no behavior to compose.

---

## What to build

An attribute directive, **`[twAspectRatio]`**, that sets the native CSS `aspect-ratio` property on its host element. It standardizes the `aspect-[16/9]` pattern consumers currently hand-roll, used everywhere media is rendered (cards, thumbnails, video, image grids). The directive sets **only** `aspect-ratio` — it does not set `width`, `display`, or any other layout property, matching Tailwind's own `aspect-*` utility. Consumers pair it with `w-full object-cover` themselves (shown in usage examples) so the common media case works out of the box without the directive becoming opinionated.

### Why no `tv()` config

This is a behavioral directive that sets a single CSS property from a coerced value — not a variant-driven visual component. There are no class strings to manage, no slots, no color/size axes. The `tv()` / tailwind-variants machinery (and the styling-with-Tailwind rules around semantic tokens) does **not** apply here. The one computed value the directive produces is the normalized `aspect-ratio` string, fed to a host **style** binding. Do **not** add a `tv()` config.

---

## API design

### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `twAspectRatio` | `number \| string` | `'1/1'` | `Sets the host's aspect ratio. Accepts a unitless number (e.g. 1.7777) or a ratio string using '/' or ':' (e.g. '16/9' or '16:9'). Invalid or non-positive values fall back to the default. Defaults to '1/1' (square).` |

The input name **matches the selector** so both binding forms read naturally:

- Static string: `<img twAspectRatio="16/9" />`
- Bound expression: `<div [twAspectRatio]="1.7777"></div>`

Keep to this single input — well under the 5–6 cap. No outputs, no models, no content projection.

### Coercion (the reason a `computed()` is warranted)

A single `computed()` (`ratio`) normalizes the input to a valid CSS `aspect-ratio` value. **Every output is the uniform `'<w> / <h>'` form** — including bare numbers, which become `'n / 1'`. This keeps applied values consistent and sidesteps a jsdom `cssstyle` quirk where a single-number `aspect-ratio` (valid CSS) is silently dropped while the `w / h` form is stored.

- **number** → `'n / 1'` when `> 0` (e.g. `1.7777` → `'1.7777 / 1'`). Equivalent CSS to the bare number, but storable and uniform.
- **string containing `/`** → trim, validate, join as `'<w> / <h>'`. Valid only when **both** sides parse (via `Number()`, which rejects `'16px'`) as numbers `> 0`; otherwise fall back. Covers divide-by-zero and negatives: `'0/1'`, `'16/0'`, `'-16/9'` all fall back. A non-2-part string (`'16/9/2'`) falls back.
- **string containing `:`** → split on `:` (CSS does **not** accept colon syntax; `'16:9'` → `'16 / 9'`), then apply the same both-sides-`> 0` validity rule.
- **plain numeric string** (`'1.5'`) → `'1.5 / 1'` when `> 0`.
- **invalid** — empty, whitespace-only, `NaN`, non-parseable, partial-numeric (`'16px/9'`), or any value resolving to `≤ 0` → fall back to the default (`'1 / 1'`).

The fallback default and the zero-config default are the **same value** (`'1 / 1'`), so the host style binding is always well-defined and never emits an empty/invalid `aspect-ratio`.

> **Bare-attribute note.** `<div twAspectRatio>` (valueless) binds the input to an empty string, not the declared `'1/1'` default — Angular treats a valueless attribute as an empty-string input. It still renders as `1/1` because the empty string is in the invalid → fallback set. This is intended: the "default == fallback" choice is exactly what makes the bare form work. Do **not** special-case empty string.

---

## Host binding

A single host style binding — no class binding, no attributes:

```ts
host: {
  '[style.aspect-ratio]': 'ratio()',
}
```

Block-level hosts already fill their container width, so the ratio takes effect with no extra width rule. For replaced elements (`<img>`, `<video>`), the consumer adds `w-full` (or `h-full`) to give the box a definite cross-axis size.

---

## Accessibility

The interactive-a11y rules (ARIA role, keyboard behavior, focus management) **do not apply** — this is a non-interactive, purely presentational directive. The only requirement is **non-interference**: the directive adds no `role` and no `aria-*` attributes, and never touches the host media's own `alt` / `aria-*` / `title`. The host element's existing accessibility is preserved untouched.

---

## File layout

Create under `projects/ngx-tw/aspect-ratio/`:

| File | Role |
|---|---|
| `aspect-ratio.ts` | `AspectRatioDirective` — selector `[twAspectRatio]`, `exportAs: 'twAspectRatio'`, the single `input()`, the `ratio` `computed()`, the host style binding. ~30 lines. |
| `aspect-ratio.spec.ts` | Vitest suite — see Test plan. |
| `index.ts` | `export { AspectRatioDirective } from './aspect-ratio';` |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |

Also: append `export * from '@cdevhub/ngx-tw/aspect-ratio';` to `projects/ngx-tw/src/public-api.ts`. There is no natural cluster — append at the end; do not reorder existing lines.

---

## Usage examples

Simplest — square (zero config):

```html
<div twAspectRatio class="w-full bg-surface-muted"></div>
```

16:9 video thumbnail (the canonical media case):

```html
<img twAspectRatio="16/9" class="w-full object-cover rounded-lg" [src]="thumb" alt="Preview" />
```

Numeric ratio via bound expression:

```html
<div [twAspectRatio]="4 / 3" class="w-full"></div>
```

Colon syntax (normalized to CSS `/`):

```html
<video twAspectRatio="21:9" class="w-full" [src]="clip"></video>
```

Inside an image grid:

```html
@for (img of images; track img.id) {
  <img twAspectRatio="1/1" class="w-full object-cover rounded-md" [src]="img.url" [alt]="img.alt" />
}
```

---

## Test plan (`aspect-ratio.spec.ts`)

Vitest. No `fakeAsync` / `tick`. Use a tiny host component (or `fixture.componentRef.setInput`) and assert the **applied DOM style**, never the directive's internal signal.

**Read the value with `el.style.getPropertyValue('aspect-ratio')` — not the `el.style.aspectRatio` camelCase accessor.** Angular's `[style.aspect-ratio]` binding sets the value via `style.setProperty('aspect-ratio', …)`, which jsdom stores generically; jsdom's CSSOM may not define a named `aspectRatio` accessor (it is version-dependent), so the camelCase read can return `''` and fail every test for an environment reason rather than a logic error. `getPropertyValue('aspect-ratio')` is the reliable read — confirm it resolves in the runner before writing the rest of the suite.

**Normalization caveat:** jsdom may store the raw string the directive applies rather than browser-normalizing `'16/9'` → `'16 / 9'`. Assert against the exact value the directive writes (the output of the coercion rules above), not a browser-normalized form.

Mandatory cases:

1. **Default / zero-config.** Mounting `<div twAspectRatio>` applies `aspect-ratio: 1/1` (resolves via the empty-string → fallback path; see the bare-attribute note).
2. **Number input.** `[twAspectRatio]="1.7777"` applies `1.7777`.
3. **Slash string.** `twAspectRatio="16/9"` applies the slash form.
4. **Colon string.** `twAspectRatio="16:9"` is normalized to `16 / 9` (colon replaced).
5. **Plain numeric string.** `twAspectRatio="1.5"` applies `1.5`.
6. **Whitespace trim.** `twAspectRatio=" 16 / 9 "` applies a trimmed value.
7. **Invalid → fallback.** Empty string, `'abc'`, `'0'`, `'-2'`, `'16/0'`, `'0/1'`, `'-16/9'`, and `NaN` each fall back to the default `1/1`.
8. **Reactivity.** Changing the input (`setInput`) updates the applied `aspect-ratio` style.
9. **Non-interference.** The directive adds no `role` or `aria-*` attribute, and an existing `alt` on a host `<img>` is left intact.

Target test count: 10–14 `it()` blocks.

---

## Demo page

Create under `projects/demo/src/app/routes/aspect-ratio/` (separate follow-up task via `/demo-doc-page` — listed here for completeness). Examples to ship: square (default), 16:9 image, 4:3, 21:9 video, numeric ratio, and an image grid of uniform tiles. Page wrapper mirrors an existing directive doc page (e.g. badge). Sidebar entry: insert "Aspect Ratio" alphabetically.

---

## Open decisions for the maintainer

1. **Default ratio is `'1/1'` (square), which doubles as the invalid-input fallback.** This honors the library's zero-config principle — the directive always produces a valid `aspect-ratio`. The alternative is `input.required<number | string>()` to force consumers to declare a ratio intentionally. **[RESOLVED — default `'1/1'` chosen for ergonomics; applied/normalized form is `'1 / 1'`.]**
2. **Sets only `aspect-ratio` — no `width` / `display`.** Matches Tailwind's `aspect-*` utility and keeps the directive unopinionated; consumers add `w-full` / `object-cover` as shown. **[ASSUMED SAFE]**
3. **Colon syntax (`'16:9'`) is accepted and normalized to CSS `'16 / 9'`** even though CSS itself rejects colons — consumers commonly think in `16:9`, so supporting it is a small ergonomic win. **[ASSUMED SAFE]**

---

## Constraints (from CLAUDE.md — non-negotiable)

- Attribute selector `[twAspectRatio]`; class name `AspectRatioDirective` (no `Tw` prefix on the class).
- Standalone — do not set `standalone: true`.
- `host` object for the style binding — never `@HostBinding`.
- `inject()` for any DI (none needed here).
- Signal API exclusively: `input()` + `computed()`. No `mutate`.
- **No `tv()` config** — single CSS property, not a variant-driven component (rationale above).
- Secondary entry point with its own `index.ts` + `ng-package.json`; re-export from root `public-api.ts`.
- The single `input()` carries a one-line JSDoc; Compodoc renders the API table.
- Vitest, no `fakeAsync` / `tick`; assert applied DOM style (`getPropertyValue('aspect-ratio')`), not internal signals.

---

## Acceptance criteria

- `AspectRatioDirective` applies a valid `aspect-ratio` style for number, slash, colon, and plain-numeric inputs; invalid input falls back to the default.
- The JSDoc on `twAspectRatio` renders a complete Compodoc table.
- All Vitest cases pass.
- `ng build ngx-tw` clean; the `ngx-tw/aspect-ratio` secondary entry point bundles.
- The directive adds no ARIA / role and leaves host media accessibility untouched.
