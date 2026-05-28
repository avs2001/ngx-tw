# Prompt: Close five library gaps (combobox, empty-state, sheet, stat, split)

## Context note for the implementer

The user-supplied brief that motivated this prompt was partially stale. The actual
repo state has been audited and the work items below reflect what is **really**
missing as of this prompt. Trust the file paths and checks in this document over
any older description you may have been given. If you find a file already in the
state described as the goal, mark that step done and move on — do not redo work.

## Step 0 — Read before writing

Read these first. Do not skip.

- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — project conventions
  (Angular v21, Tailwind v4, semantic tokens, `tv()` + `twMerge`, input-count cap,
  boolean defaults, JSDoc, visual design system, testing rules with Vitest).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/skills/demo-doc-page/SKILL.md` — demo
  page conventions (overview / examples / api children, page component, routes).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/skills/implement-component/SKILL.md` —
  end-to-end component implementation conventions.

Reference (peer) files. Open them once so your edits mirror the existing patterns:

- Library entry point: `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/badge/index.ts`
- Secondary entry manifest: `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/badge/ng-package.json`
- Vitest spec shape: `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/badge/badge.spec.ts`
- Demo route folder shape: `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/demo/src/app/routes/badge/`
- Public API surface: `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/src/public-api.ts`
- App route table: `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/demo/src/app/app.routes.ts`

Once you have read CLAUDE.md and at least one peer in each category above, proceed.

---

## Work item 1 — combobox: wire into public API and app routes

Current state: library code, spec, secondary entry-point files (`index.ts`,
`ng-package.json`), `types.ts`, and demo route folder all exist. Wiring is missing
in two places.

### 1a. Add export to `projects/ngx-tw/src/public-api.ts`

Append (keep the file's existing block ordering — group with the other component
exports, not at the very top):

```ts
export * from 'ngx-tw/combobox';
```

### 1b. Add route in `projects/demo/src/app/app.routes.ts`

Add a child entry inside the existing `Shell` children array. Match the lazy-load
shape of the surrounding entries:

```ts
{
  path: 'components/combobox',
  loadChildren: () => import('./routes/combobox/combobox.routes').then(m => m.COMBOBOX_ROUTES),
},
```

Verify `projects/demo/src/app/routes/combobox/combobox.routes.ts` exports
`COMBOBOX_ROUTES` (if the symbol is named differently, update the import accordingly
— do not rename the file).

---

## Work item 2 — empty-state: wire into public API and app routes

Current state: library code, spec, `index.ts`, `ng-package.json`, and demo route
folder all exist. Wiring missing.

### 2a. Add export to `projects/ngx-tw/src/public-api.ts`

```ts
export * from 'ngx-tw/empty-state';
```

### 2b. Add route in `projects/demo/src/app/app.routes.ts`

```ts
{
  path: 'components/empty-state',
  loadChildren: () => import('./routes/empty-state/empty-state.routes').then(m => m.EMPTY_STATE_ROUTES),
},
```

Verify the actual symbol name in `routes/empty-state/empty-state.routes.ts` and match it.

---

## Work item 3 — sheet: add public API export

Current state: library code, spec, `index.ts`, `ng-package.json`, demo route folder,
and `app.routes.ts` wiring all exist. Only the root public-api re-export is missing.

### 3a. Add export to `projects/ngx-tw/src/public-api.ts`

```ts
export * from 'ngx-tw/sheet';
```

No other changes for this item.

---

## Work item 4 — stat: convention audit (scaffolding already complete)

Current state: `stat.ts`, `stat.spec.ts`, `index.ts`, `ng-package.json`, demo route
folder, `app.routes.ts` wiring, and the root `public-api.ts` export all already
exist. The user's original brief said these were missing — they are not. Do not
recreate them.

What **is** required: an audit of `projects/ngx-tw/stat/stat.ts` against project
conventions. The file is ~520 lines, dated today, never reviewed.

### 4a. Audit checklist

Walk the file and verify each of the following. For every violation, either fix
in place (when the fix is mechanical and unambiguous) or list it under
"Audit findings to confirm" before touching it.

**Angular v21 conventions**
- [ ] No `standalone: true` literal anywhere (it is the default in v21).
- [ ] Signal APIs only: `input()`, `output()`, `model()`; no `@Input()` / `@Output()`.
- [ ] `ChangeDetection.OnPush` on every `@Component`.
- [ ] Host bindings live in the `host:` object — no `@HostBinding` / `@HostListener`.
- [ ] Native control flow (`@if`, `@for`, `@switch`); no `*ngIf`, `*ngFor`, `ngClass`, `ngStyle`.
- [ ] No `mutate` on signals.
- [ ] DI via `inject()`, not constructor injection.

**Styling — Tailwind v4 + semantic tokens**
- [ ] All colors use semantic tokens (`primary`, `secondary`, `accent`, `info`,
      `success`, `warning`, `error`, `neutral`) or the `surface-*` / `fg-*` /
      `border-*` tokens. No raw palette colors (`blue-*`, `red-*`, etc.).
- [ ] Structural backgrounds/text/borders use `surface-*` / `fg-*` / `border-*`,
      not raw `neutral-*`.
- [ ] `tv()` config has `{ twMerge: true }` and a `defaultVariants` block.
- [ ] No component-level CSS file; styling lives in `tv()` / class bindings.

**Visual design system (CLAUDE.md "Visual Design System")**
- [ ] Border radius drawn from `md` / `lg` / `xl` / `full` / `none`.
- [ ] Padding scale matches the `xs..xl` block-padding table (`p-2`..`p-8`)
      or the inline-padding table — not arbitrary `p-5`, `p-7`.
- [ ] **Typography**: only `text-2xs` / `text-xs` / `text-sm` / `text-base`
      are permitted for component-internal text. `text-lg`, `text-xl`,
      `text-2xl`, `text-3xl` are forbidden in library components.
      `stat.ts` currently uses `text-lg`, `text-2xl`, `text-3xl` for the
      `value` slot at `md` / `lg` / `xl` densities with inline comments
      claiming a "Stat-value exception" referencing the deleted
      `docs/prompts/tw-stat.md`. **User decision: reduce the scale.**
      The deleted prompt is not a source of truth — disregard it. Bring
      the value typography into the codified ceiling: pick from
      `text-2xs` / `text-xs` / `text-sm` / `text-base` only. Map the
      density axis as `xs` → `text-xs`, `sm` → `text-sm`,
      `md` → `text-base`, `lg` → `text-base font-semibold`,
      `xl` → `text-base font-bold` (or similar weight-driven emphasis that
      stays within the codified font-size ceiling). Remove the inline
      "Stat-value exception" comments while you are in the file — they
      reference a file that no longer exists. This is a mechanical fix;
      apply in place and list it under "Mechanical fixes applied" in the
      audit summary. Do not codify a new exception in CLAUDE.md.
- [ ] Focus rings (if any interactive elements) follow
      `focus-visible:outline-2 outline-offset-2 outline-primary-500`.
- [ ] Icon sizes drawn from the codified sub-scales.

**Input-count cap (CLAUDE.md "Input count cap")**
- [ ] Default cap: ≤ 5–6 inputs per component. `stat` is a visual primitive — it
      does **not** match any of the four codified exceptions (overlay-bearing,
      form control, structural-layout, data primitive).
- Current count: `StatComponent` exposes `variant`, `size`, `loading` (3) —
  within cap. `StatDeltaComponent` exposes `direction`, `inverted`, `variant`,
  `comparisonLabel`, `ariaLabel` (5) — within cap. Confirm no inputs are added
  during the audit; if the audit reveals a missing input is needed (e.g., for
  a11y), check the cap before adding.

**Boolean defaults (CLAUDE.md "Boolean defaults")**
- [ ] All boolean inputs default to `false` unless the input is on the codified
      exception list. `stat` is not on the list. `loading = input(false, …)`
      and `inverted = input(false, …)` are both correct — confirm no other
      boolean default sneaks in as `true`.

**JSDoc**
- [ ] Every `input()`, `output()`, `model()`, and public method has a one-line
      JSDoc comment describing purpose and default. Compodoc parses these for
      the API tables.

**Animations**
- [ ] No `@angular/animations` imports. Enter/leave use `animate.enter`/`animate.leave`
      with keyframes defined in `projects/ngx-tw/theme/default.css`.
      (`stat.ts` should not need any animation here; verify.)

**Selector / naming**
- [ ] Component selector is `tw-stat` / `tw-stat-delta`; directive selectors are
      attribute-style with `tw` camelCase prefix (`twStatLabel`, etc.).
- [ ] Class names carry no `Tw` prefix (correctly named `StatComponent`,
      `StatDeltaComponent`, `StatLabelDirective`, etc.).

### 4b. After the audit, produce a summary

Before applying any non-mechanical change, output:

1. **Mechanical fixes applied in place** — short bullet list of what you fixed
   without needing user input.
2. **Audit findings to confirm** — bullet list of suspected violations that
   require a decision (especially the typography exception flagged above).
   For each, propose a concrete resolution and wait for confirmation before
   editing.

### 4c. Re-check the spec

Open `projects/ngx-tw/stat/stat.spec.ts` and confirm it covers the test
categories from CLAUDE.md "Testing" / "What to test":

- Default render with no inputs.
- Each value of `variant`, `size`, `direction`, `delta variant`, `loading`.
- Input changes update the DOM; outputs (if any) emit correctly.
- Disabled / loading state.
- ARIA attributes (`aria-busy`, `aria-label` on delta, list semantics).
- Content projection: each slot directive renders, fallback behavior is correct.

No `fakeAsync` / `tick`. Use `async/await` with `fixture.whenStable()` or
`vi.useFakeTimers()` / `vi.runAllTimers()` if timer control is needed.

If a category is missing, add the test cases. If the spec is fully covering,
note that in the audit summary and skip.

---

## Work item 5 — split: add demo route wiring

Current state: library code, spec, public-api export, and demo route folder all
exist. The `app.routes.ts` entry is missing.

### 5a. Add route in `projects/demo/src/app/app.routes.ts`

```ts
{
  path: 'components/split',
  loadChildren: () => import('./routes/split/split.routes').then(m => m.SPLIT_ROUTES),
},
```

Verify the actual symbol name in `routes/split/split.routes.ts` and match it
(it is almost certainly `SPLIT_ROUTES` — confirm).

---

## Verification checklist (run before declaring done)

Run each step. Do not skip any — the work is not done until every box is checked.

- [ ] `pnpm ng build ngx-tw` (or the project's equivalent — check `package.json`
      `scripts`) completes successfully with no TypeScript or build errors.
- [ ] `pnpm ng build demo` (or the demo build script) completes successfully —
      this is the strongest signal that the secondary entry-point exports and
      lazy-loaded route imports resolve.
- [ ] `projects/ngx-tw/src/public-api.ts` contains, at minimum, these three new lines:
      `export * from 'ngx-tw/combobox';`,
      `export * from 'ngx-tw/empty-state';`,
      `export * from 'ngx-tw/sheet';`
      (in addition to existing exports; do not remove any).
- [ ] `projects/demo/src/app/app.routes.ts` contains lazy entries for
      `components/combobox`, `components/empty-state`, and `components/split`
      (in addition to the existing `components/sheet` and `components/stat`).
- [ ] Demo dev server starts (port **4600** per project memory) and these five
      routes navigate without runtime errors:
      `/components/combobox`, `/components/empty-state`, `/components/sheet`,
      `/components/stat`, `/components/split`.
- [ ] From a consumer entry point each of the five components imports cleanly:
      `import { ComboboxComponent } from 'ngx-tw/combobox';`
      `import { EmptyStateComponent } from 'ngx-tw/empty-state';`
      `import { Sheet } from 'ngx-tw/sheet';`
      `import { StatComponent } from 'ngx-tw/stat';`
      `import { SplitComponent } from 'ngx-tw/split';`
      (Adjust class names to whatever each entry point's `index.ts` actually
      re-exports — verify against the file, do not guess.)
- [ ] `pnpm test` (or the Vitest equivalent — `ng test` with the v21
      `@angular/build:unit-test` builder) passes; in particular the existing
      `stat.spec.ts`, `combobox.spec.ts`, `empty-state.spec.ts`, `sheet.spec.ts`,
      and `split.spec.ts` all pass.
- [ ] Stat audit summary (work item 4b) has been delivered to the user, and any
      items flagged "to confirm" have either been resolved or are explicitly
      waiting for user input — do not silently leave them.

## What NOT to do

- Do **not** recreate `stat/index.ts`, `stat/ng-package.json`, or `stat/stat.spec.ts`
  — they already exist. The original brief was stale on this point.
- Do **not** remove the existing `export * from 'ngx-tw/stat';` line from
  `public-api.ts` — it is already correct.
- Do **not** add the `components/sheet` route to `app.routes.ts` — it is already
  wired.
- Do **not** rename any class or selector during the stat audit without explicit
  user approval; renames are breaking changes and have their own remediation track.
- Do **not** introduce raw Tailwind palette colors anywhere; if the stat audit
  reveals any, replace with semantic tokens and call it out as a mechanical fix.
